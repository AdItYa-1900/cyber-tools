# -*- coding: utf-8 -*-
"""GET /t/new -> mint a token and the link to send. (Vercel function)"""
import json
import re
import secrets
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        ref = q.get("ref", [""])[0]
        # A readable name on your own address, sanitised. A random suffix
        # is always added so two links with the same name never collide.
        slug = re.sub(r"[^a-z0-9\-]", "", q.get("slug", [""])[0].lower())[:32]
        tok = (slug + "-" if slug else "") + secrets.token_urlsafe(4)

        host = self.headers.get("Host", "")
        proto = self.headers.get("X-Forwarded-Proto", "https")
        link = f"{proto}://{host}/t/c/{tok}"

        body = json.dumps({"token": tok, "ref": ref, "link": link}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
