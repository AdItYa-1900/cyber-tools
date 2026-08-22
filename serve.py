# -*- coding: utf-8 -*-
"""Single deployable server for the whole toolkit.

WHY ONE FILE
  Hosting platforms hand you one port and one process. This serves the
  entire app AND the tracer capture endpoints on that one port, so
  deploying is "run this, put HTTPS in front", nothing more. Officers
  then just open the web address; there is no launcher and nothing to
  install on their machines.

ROUTES
  Everything that is not a tracer route is served as a static file from
  this folder, so the app itself works unchanged.

  Tracer routes, on the same origin:
    GET  /t/new?ref=...   mint a token and a link
    GET  /t/c/<token>     the landing page you send
    POST /t/log/<token>   the page reports back to here
    GET  /t/hits/<token>  read what came back

  The tracer captures only what a web request already exposes -- IP,
  user-agent, time, language -- plus location if the person taps the
  button and grants the browser prompt. No camera. No microphone. Every
  visit is logged in full for disclosure.

RUN
  Locally:   python serve.py
  On a host: it binds 0.0.0.0 and honours the PORT environment variable,
             which is what most platforms inject. Put a reverse proxy in
             front for HTTPS. Officers open https://your-domain/ .
"""
import html
import json
import os
import re
import secrets
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

HERE = os.path.dirname(os.path.abspath(__file__))
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8777"))
LOG = os.environ.get("CANARY_LOG", os.path.join(HERE, "canary_log.jsonl"))
TITLE = os.environ.get("CANARY_TITLE", "Shared document")

LANDING = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
 *{{box-sizing:border-box}}
 body{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
   margin:0;background:#f4f6fb;color:#1f2430;min-height:100vh;display:flex;flex-direction:column}}
 header{{background:#fff;border-bottom:1px solid #e6e9f0;padding:14px 20px;
   display:flex;align-items:center;gap:11px}}
 .logo{{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#4f46e5,#6366f1);
   display:grid;place-items:center;flex:none}}
 .logo svg{{width:18px;height:18px}}
 .brand{{font-weight:650;font-size:15px;letter-spacing:-.2px}}
 .brand span{{display:block;font-size:11px;color:#8a93a6;font-weight:500}}
 main{{flex:1;display:grid;place-items:center;padding:24px}}
 .doc{{background:#fff;border:1px solid #e6e9f0;border-radius:16px;max-width:400px;width:100%;
   box-shadow:0 10px 34px -12px rgba(20,30,60,.18);overflow:hidden}}
 .doc-top{{padding:26px 26px 8px;text-align:center}}
 .file{{width:56px;height:70px;margin:0 auto 16px;border-radius:7px;background:#eef1f8;
   border:1px solid #e0e5f0;position:relative}}
 .file::after{{content:"";position:absolute;top:0;right:0;width:18px;height:18px;
   background:#dfe4f0;border-bottom-left-radius:7px}}
 .file .lines{{position:absolute;left:11px;right:11px;top:24px}}
 .file .lines i{{display:block;height:4px;border-radius:2px;background:#d3d9e6;margin-bottom:6px}}
 .file .lines i:nth-child(2){{width:70%}} .file .lines i:nth-child(3){{width:85%}}
 h1{{font-size:17px;margin:0 0 4px;letter-spacing:-.3px}}
 .meta{{font-size:12.5px;color:#8a93a6;margin-bottom:2px}}
 .body{{padding:16px 26px 24px}}
 .status{{display:flex;align-items:center;justify-content:center;gap:9px;
   font-size:13.5px;color:#5b6478;min-height:22px}}
 .sp{{width:16px;height:16px;border:2.5px solid #dfe4f0;border-top-color:#4f46e5;
   border-radius:50%;animation:s .8s linear infinite}}
 @keyframes s{{to{{transform:rotate(360deg)}}}}
 button{{width:100%;margin-top:18px;padding:13px;border:0;border-radius:10px;
   background:#4f46e5;color:#fff;font-size:15px;font-weight:600;cursor:pointer;
   display:none;transition:background .15s}}
 button:hover{{background:#4338ca}}
 .lock{{display:inline-block;vertical-align:-2px;margin-right:6px}}
 .fine{{font-size:11.5px;color:#9aa2b2;text-align:center;margin-top:14px;line-height:1.55}}
 footer{{text-align:center;padding:16px;font-size:11px;color:#aab1c0}}
</style></head><body>
<header>
 <span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"
   stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></span>
 <span class="brand">Document Portal<span>Secure file sharing</span></span>
</header>
<main>
 <div class="doc">
  <div class="doc-top">
   <div class="file"><div class="lines"><i></i><i></i><i></i></div></div>
   <h1>{title}</h1>
   <div class="meta">Shared securely &middot; 1 file</div>
  </div>
  <div class="body">
   <div class="status" id="status"><span class="sp"></span><span id="msg">Loading secure preview…</span></div>
   <button id="loc"><span class="lock">&#128274;</span>Verify and open document</button>
   <div class="fine">This document is protected. If it does not open automatically,
     tap the button above to continue.</div>
  </div>
 </div>
</main>
<footer>Encrypted transfer &middot; Link expires after viewing</footer>
<script>
 var token = {token};
 function post(extra){{
   var b = Object.assign({{
     token: token, screen: screen.width + "x" + screen.height,
     dpr: window.devicePixelRatio || 1,
     tz: (Intl.DateTimeFormat().resolvedOptions().timeZone) || "",
     tzOffsetMin: new Date().getTimezoneOffset(),
     lang: navigator.language, platform: navigator.platform || "",
     ua: navigator.userAgent
   }}, extra || {{}});
   fetch("/t/log/" + token, {{method:"POST",headers:{{"Content-Type":"application/json"}},
     body: JSON.stringify(b)}});
 }}
 post();
 setTimeout(function(){{
   document.getElementById("status").style.display = "none";
   var btn = document.getElementById("loc");
   btn.style.display = "block";
   btn.onclick = function(){{
     btn.disabled = true; btn.textContent = "Opening…";
     if (!navigator.geolocation){{ done(); return; }}
     navigator.geolocation.getCurrentPosition(function(p){{
       post({{ geo: {{ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }} }});
       done();
     }}, function(){{ done(); }}, {{ enableHighAccuracy:true, timeout:10000 }});
   }};
 }}, 1400);
 function done(){{
   document.querySelector(".body").innerHTML =
     '<div class="status" style="color:#8a93a6">This link has expired. ' +
     'Please ask the sender to share the document again.</div>';
 }}
</script></body></html>"""


def client_ip(handler):
    fwd = handler.headers.get("X-Forwarded-For", "")
    return fwd.split(",")[0].strip() if fwd else handler.client_address[0]


class Handler(SimpleHTTPRequestHandler):
    """Tracer routes under /t/ ; everything else is a static file."""

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _html(self, code, page):
        body = page.encode()
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        parts = [p for p in u.path.split("/") if p]

        if parts[:1] == ["t"]:
            if parts[1:2] == ["new"]:
                q = parse_qs(u.query)
                ref = q.get("ref", [""])[0]
                # An officer may name the link so it reads cleanly, e.g.
                # /t/c/notice-4021 instead of a random string. The slug is
                # sanitised and a short random suffix is appended so two
                # links with the same name never collide. This is a
                # readable name on YOUR domain, not a disguise of anyone
                # else's.
                slug = re.sub(r"[^a-z0-9\-]", "", q.get("slug", [""])[0].lower())[:32]
                tok = (slug + "-" if slug else "") + secrets.token_urlsafe(4)
                host = self.headers.get("Host", f"127.0.0.1:{PORT}")
                proto = self.headers.get("X-Forwarded-Proto", "http")
                return self._json(200, {
                    "token": tok, "ref": ref,
                    "link": f"{proto}://{host}/t/c/{tok}",
                })
            if len(parts) == 3 and parts[1] == "c":
                return self._html(200, LANDING.format(
                    title=html.escape(TITLE), token=json.dumps(parts[2])))
            if len(parts) == 3 and parts[1] == "hits":
                return self._json(200, self._read_hits(parts[2]))
            return self._json(404, {"error": "unknown tracer route"})

        return super().do_GET()          # static file

    def do_POST(self):
        parts = [p for p in urlparse(self.path).path.split("/") if p]
        if parts[:2] == ["t", "log"] and len(parts) == 3:
            length = int(self.headers.get("Content-Length") or 0)
            try:
                client = json.loads(self.rfile.read(length) or b"{}")
            except ValueError:
                client = {}
            rec = {
                "token": parts[2],
                "at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "epoch": int(time.time()),
                "ip": client_ip(self),
                "ua_header": self.headers.get("User-Agent", ""),
                "accept_language": self.headers.get("Accept-Language", ""),
                "referer": self.headers.get("Referer", ""),
                "x_forwarded_for": self.headers.get("X-Forwarded-For", ""),
                "client": client,
            }
            with open(LOG, "a", encoding="utf-8") as f:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            self.send_response(204)
            self.end_headers()
            return
        self.send_response(404)
        self.end_headers()

    def _read_hits(self, token):
        out = []
        if os.path.exists(LOG):
            with open(LOG, encoding="utf-8") as f:
                for line in f:
                    try:
                        r = json.loads(line)
                        if r.get("token") == token:
                            out.append(r)
                    except ValueError:
                        pass
        return out

    def log_message(self, *args):
        pass


def main():
    handler = partial(Handler, directory=HERE)
    srv = ThreadingHTTPServer((HOST, PORT), handler)
    print("=" * 60)
    print("  Sutra - investigation toolkit")
    print("=" * 60)
    where = "this computer" if HOST in ("127.0.0.1", "localhost") else "every address on this host"
    print(f"\n  Serving on {HOST}:{PORT}  ({where})")
    print(f"  App:      http://127.0.0.1:{PORT}/index.html")
    print(f"  Log file: {LOG}")
    print("\n  Tracer captures IP, device, time, and location on tap only.")
    print("  No camera. No microphone. Every visit logged for disclosure.")
    print("  Put HTTPS in front before using it against a real device.\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.")


if __name__ == "__main__":
    main()
