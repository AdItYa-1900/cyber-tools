# -*- coding: utf-8 -*-
"""POST /t/log/<token> -> record one visit in the KV store. (Vercel function)

Captures only what a web request already exposes -- IP, user-agent,
time, language -- plus location if the page sent it because the person
tapped the button and granted the browser prompt. No camera. No
microphone.
"""
import json
import time
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

try:
    from _kv import configured, append_hit
except ImportError:                       # Vercel bundles siblings flat
    from api._kv import configured, append_hit


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        token = parse_qs(urlparse(self.path).query).get("token", [""])[0]
        length = int(self.headers.get("Content-Length") or 0)
        try:
            client = json.loads(self.rfile.read(length) or b"{}")
        except ValueError:
            client = {}

        fwd = self.headers.get("X-Forwarded-For", "")
        ip = fwd.split(",")[0].strip() if fwd else self.client_address[0]

        record = {
            "token": token,
            "at": time.strftime("%Y-%m-%dT%H:%M:%S%z", time.localtime()),
            "epoch": int(time.time()),
            "ip": ip,
            "ua_header": self.headers.get("User-Agent", ""),
            "accept_language": self.headers.get("Accept-Language", ""),
            "referer": self.headers.get("Referer", ""),
            "x_forwarded_for": fwd,
            "client": client,
        }

        if configured() and token:
            try:
                append_hit(token, record)
            except Exception:
                pass                       # never surface storage errors to the visitor

        self.send_response(204)
        self.end_headers()
