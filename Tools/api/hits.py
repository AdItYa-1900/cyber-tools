# -*- coding: utf-8 -*-
"""GET /t/hits/<token> -> the visits captured for that link. (Vercel function)"""
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

try:
    from _kv import configured, read_hits
except ImportError:
    from api._kv import configured, read_hits


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        token = parse_qs(urlparse(self.path).query).get("token", [""])[0]

        if not configured():
            payload = {"error": "storage not configured",
                       "hint": "Add a KV store to this Vercel project and redeploy."}
            code = 503
        else:
            payload = read_hits(token) if token else []
            code = 200

        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
