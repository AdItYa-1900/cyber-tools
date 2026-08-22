/* ============================================================
   Investigative Tracer Link

   A canary link: a URL an officer sends to a person of interest, over
   any channel. When it is opened it records what any web request
   already exposes, so the officer learns the device's public IP and the
   exact time it connected. That pair is what an ISP needs to name the
   subscriber under BNSS s.94.

   WHAT IT CAPTURES
     IP address, user-agent, exact timestamp, referrer, language, and
     the device's screen and timezone. All of this is passive: a browser
     reveals it on every request and no permission is involved.

     Approximate location is OFFERED, never taken. The page shows a
     button; tapping it triggers the browser's own geolocation prompt,
     which the person sees and must accept. Decline, and only the passive
     data is recorded.

   WHAT IT DOES NOT DO, DELIBERATELY
     No camera. No microphone. Covertly activating either against an
     unconsented link-recipient is not lawful for police, is
     inadmissible, and exposes the officer under the same IT Act
     sections used against offenders. This tool refuses to pretend
     otherwise.

   The capture happens on the toolkit's own server (serve.py), on the
   same origin as this page. This tool mints the link, states the ground
   rules, and reads the captured hits back for the case file.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  TK.reg({
    id: "canary",
    name: "Investigative Tracer Link",
    cluster: "network",
    tier: 2,
    wide: true,
    desc: "Generate a link that records the IP, device and time when a person of interest opens it.",
    render: function (root) {
      root.innerHTML =
        '<div class="note danger"><b>Read this before you deploy a link</b>' +
        "<p>This is a lawful tracer. It records the IP address, device details and time, and it " +
        "asks for location through the browser's own prompt. <b>It does not, and will not, capture " +
        "camera or microphone.</b> Covert camera or mic capture against a link-recipient is not " +
        "authorised by any police power, is inadmissible, and is itself an offence. Deploy the " +
        "link only against a legitimate person of interest, with your unit's authority, and " +
        "disclose the full capture log.</p></div>" +

        '<div class="card"><h3>Step 1 — Make the link</h3>' +
          '<div id="cn-status" class="cn-status"></div>' +
          '<div class="grid c2" style="margin-top:12px">' +
            '<div class="field"><label class="lbl">Case reference, for your own records</label>' +
            '<input type="text" id="cn-ref" placeholder="FIR 0123/2026"></div>' +
            '<div class="field"><label class="lbl">Name for the link (optional)</label>' +
            '<input type="text" id="cn-slug" placeholder="notice-4021" maxlength="32"></div>' +
          "</div>" +
          '<p class="xs muted">The name becomes part of the web address, so the link reads cleanly, ' +
          "e.g. <span class='mono'>/t/c/notice-4021</span>. Letters, numbers and hyphens only. It is " +
          "a plain label on your own address; it does not, and must not, imitate another " +
          "organisation.</p>" +
          '<div class="row"><button class="btn primary" id="cn-make">Make a tracer link</button></div>' +
          '<div id="cn-link" style="margin-top:14px"></div>' +
          '<details style="margin-top:14px"><summary class="small">Advanced: change the server address</summary>' +
          '<div class="field" style="margin-top:8px"><label class="lbl">Server address</label>' +
          '<input type="text" id="cn-base" class="mono"></div>' +
          '<p class="xs muted">This is filled in for you. Change it only if your unit runs the ' +
          "capture server on another machine so a device on the internet can reach it. A link " +
          "pointing at <span class='mono'>127.0.0.1</span> only works on this computer, which is " +
          "fine for practice.</p>" +
          '<p class="xs muted" style="margin-top:8px"><b>To get a clean link on your own address:</b> ' +
          "host the toolkit on your department domain (run <span class='mono'>serve.py</span> there, " +
          "with HTTPS in front). Opened from that address, every link this makes reads as " +
          "<span class='mono'>https://your-domain/t/c/notice-4021</span> on its own. Use your own " +
          "domain only, never a lookalike of another organisation.</p></details></div>" +

        '<div class="card"><h3>Step 2 — Send it, then see who opened it</h3>' +
          '<p class="small muted">Send the link through your normal channel. Come back here and ' +
          "press the button to see every device that opened it.</p>" +
          '<input type="hidden" id="cn-tok">' +
          '<div class="row"><button class="btn primary" id="cn-pull">Check who opened the link</button>' +
          '<span id="cn-import-wrap"></span></div>' +
          '<div id="cn-hits" style="margin-top:14px"></div></div>';

      /* When the app is served from a real host, the capture server is
         the same origin: no address to enter, it just works. Only a
         file:// or a bare localhost open needs the local combined
         server named explicitly. */
      var loc = window.location;
      var sameOrigin = /^https?:$/.test(loc.protocol);
      var DEFAULT_BASE = sameOrigin ? loc.origin : "http://127.0.0.1:8777";
      if (!$("#cn-base").value) $("#cn-base").value = DEFAULT_BASE;

      /* ---- live status. The officer should never wonder whether the
         capture server is up; a coloured line says so in plain words. */
      function base() { return ($("#cn-base").value.trim() || DEFAULT_BASE).replace(/\/+$/, ""); }

      function checkServer() {
        var el = $("#cn-status");
        el.innerHTML = '<span class="cn-dot wait"></span> checking the capture server…';
        /* Probe /t/hits, which touches the store, so this one call tells
           the three cases apart: no backend (network/404), backend but no
           store (503 with a message), and fully working (200). */
        fetch(base() + "/t/hits/probe")
          .then(function (r) {
            return r.text().then(function (txt) {
              var body = {};
              try { body = JSON.parse(txt); } catch (e) {}
              return { status: r.status, body: body };
            });
          })
          .then(function (res) {
            if (res.body && res.body.error === "storage not configured") {
              el.innerHTML = '<span class="cn-dot off"></span> <b>Almost there — the tracer needs a ' +
                "store.</b> The site is serving the tracer, but no database is connected to keep the " +
                "visits. Add a KV store to the project and redeploy. See " +
                "<span class='mono'>DEPLOY_VERCEL.md</span>.";
            } else if (res.status >= 200 && res.status < 400) {
              el.innerHTML = '<span class="cn-dot ok"></span> ' +
                "<b>Capture server is running.</b> You can make a link.";
            } else {
              throw "bad";
            }
          })
          .catch(function () {
            el.innerHTML = '<span class="cn-dot off"></span> <b>Capture server is not answering.</b> ' +
              (sameOrigin
                ? "The tracer backend on this site is not responding. On Vercel, make sure the " +
                  "<span class='mono'>api</span> folder deployed and a KV store is connected " +
                  "(<span class='mono'>DEPLOY_VERCEL.md</span>). On your own server, run " +
                  "<span class='mono'>serve.py</span>."
                : "Start the toolkit with the <b>Start Sutra</b> shortcut, then reopen this tool.");
          });
      }
      checkServer();

      $("#cn-make").onclick = function () {
        var ref = $("#cn-ref").value.trim();
        var slug = ($("#cn-slug").value || "").toLowerCase().replace(/[^a-z0-9\-]/g, "").slice(0, 32);
        $("#cn-make").disabled = true;
        fetch(base() + "/t/new?ref=" + encodeURIComponent(ref) + "&slug=" + encodeURIComponent(slug))
          .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
          .then(function (d) { showLink(d.link, d.token, ref); })
          .catch(function () {
            $("#cn-link").innerHTML = '<div class="note danger"><b>The capture server did not answer</b>' +
              "<p>A link is no use until the server that records the visits is running. Close this " +
              "and start the toolkit with the <b>Start Sutra</b> shortcut, then try again.</p></div>";
            checkServer();
          })
          .then(function () { $("#cn-make").disabled = false; });
      };

      function showLink(link, tok, ref) {
        $("#cn-tok").value = tok;
        $("#cn-link").innerHTML =
          '<div class="note ok"><b>Link ready</b>' +
          (ref ? '<p class="xs" style="margin:4px 0 0">' + esc(ref) + "</p>" : "") + "</div>" +
          '<div class="copyable" style="margin-top:10px"><pre class="out">' + esc(link) +
          '</pre><button class="btn sm copybtn" data-copy="prev">Copy link</button></div>' +
          '<p class="small muted" style="margin-top:10px">Every time this is opened, the server ' +
          "records one visit. Send it, then pull the visits below. The token is " +
          '<span class="mono">' + esc(tok) + "</span>.</p>";
      }

      /* ---- pull hits from the server */
      $("#cn-pull").onclick = function () {
        var tok = $("#cn-tok").value.trim();
        if (!tok) { TK.toast("Make a link first", "danger"); return; }
        $("#cn-hits").innerHTML = '<span class="row tight xs muted"><span class="spinner"></span> checking…</span>';
        fetch(base() + "/t/hits/" + encodeURIComponent(tok))
          .then(function (r) { return r.json(); })
          .then(renderHits)
          .catch(function () {
            $("#cn-hits").innerHTML = '<div class="note danger"><b>The capture server did not answer</b>' +
              "<p>Start the toolkit with the <b>Start Sutra</b> shortcut, then try again. Or, if you " +
              "have the saved log file from another machine, import it below.</p>" +
              '<div class="row" style="margin-top:8px"><span id="cn-import-wrap2"></span></div></div>';
            mountImport($("#cn-import-wrap2"));
          });
      };

      /* ---- import path, for a log carried from a server on another
         machine. Secondary: the button-press flow above is the norm. */
      function mountImport(host) {
        if (!host) return;
        var imp = document.createElement("span");
        TK.dropzone(imp, function (f) {
          TK.readText(f, function (txt) {
            var hits = [];
            txt.split(/\r?\n/).forEach(function (l) {
              if (!l.trim()) return;
              try { hits.push(JSON.parse(l)); } catch (e) {}
            });
            renderHits(hits);
          });
        }, { accept: ".jsonl,.json,.txt" });
        imp.innerHTML = '<button class="btn sm ghost">import a saved log file</button>';
        host.appendChild(imp);
      }
      mountImport($("#cn-import-wrap"));

      function renderHits(hits) {
        if (!hits || !hits.length) {
          $("#cn-hits").innerHTML = '<div class="note info"><b>No visits yet</b>' +
            "<p>Nobody has opened the link, or the token does not match. A link that is never " +
            "opened is not a failure: it may mean the person did not receive it, or did not " +
            "trust it.</p></div>";
          return;
        }

        var rows = hits.map(function (h) {
          var c = h.client || {};
          var geo = c.geo;
          return {
            at: h.at || "",
            ip: h.ip || "",
            device: deviceOf(h.ua_header || c.ua || ""),
            os: osOf(h.ua_header || c.ua || ""),
            screen: c.screen || "",
            tz: c.tz || "",
            lang: (h.accept_language || c.lang || "").split(",")[0],
            location: geo ? (geo.lat.toFixed(5) + ", " + geo.lon.toFixed(5) +
              " (±" + Math.round(geo.acc) + "m)") : "",
            ua: h.ua_header || c.ua || "",
            _geo: geo
          };
        });

        var withIp = rows.filter(function (r) { return r.ip && !isPrivate(r.ip); });
        var withLoc = rows.filter(function (r) { return r._geo; });

        var h = '<div class="grid c4">' +
          TK.stat(rows.length, "Visits") +
          TK.stat(unique(rows.map(function (r) { return r.ip; })).length, "Distinct IPs") +
          TK.stat(withLoc.length, "Location shared", withLoc.length ? "ok" : "") +
          TK.stat(withIp.length, "Traceable IPs", withIp.length ? "ok" : "warn") +
          "</div>";

        h += '<div class="card"><h3>Captured visits</h3><div id="cn-tbl"></div></div>';

        if (withIp.length) {
          h += '<div class="note ok"><b>What to do with the IP</b>' +
            "<p>Take the public IP and the exact timestamp to <b>IP Address Check</b> to see which " +
            "network holds it, then requisition the subscriber from that network under BNSS s.94, " +
            "quoting the IP and the time to the second. If the address is carrier-grade shared, you " +
            "also need the source port, which this link does not see: that comes from the network's " +
            "own logs.</p></div>";
        }

        h += '<div class="note warn"><b>An IP is a network, not a person</b>' +
          "<p>This places a connection on a network at a time. It does not prove who was holding " +
          "the device, and a VPN or proxy will show that service's address, not the person's. " +
          "Treat it as a lead to corroborate, and disclose the complete capture log.</p></div>";

        $("#cn-hits").innerHTML = h;

        TK.table($("#cn-tbl"), rows, [
          { k: "at", label: "Opened at", cls: "mono" },
          { k: "ip", label: "IP", cls: "mono",
            fmt: function (v) {
              return v + (isPrivate(v) ? ' <span class="badge warn">private</span>' : "");
            } },
          { k: "device", label: "Device" },
          { k: "os", label: "OS" },
          { k: "location", label: "Location", cls: "mono",
            fmt: function (v) {
              return v ? '<span class="badge ok">' + esc(v) + "</span>" : "<span class='muted'>not shared</span>";
            } },
          { k: "tz", label: "Timezone" },
          { k: "lang", label: "Language" }
        ], { filename: "tracer-hits", sort: "at", dir: 1 });
      }

      /* small UA heuristics, enough to say phone vs desktop and which OS */
      function deviceOf(ua) {
        if (/iPhone/i.test(ua)) return "iPhone";
        if (/iPad/i.test(ua)) return "iPad";
        var m = ua.match(/;\s*([A-Z0-9][A-Za-z0-9 _\-]+?)\s*(?:Build|\))/);
        if (/Android/i.test(ua)) return m ? m[1].trim() : "Android phone";
        if (/Windows/i.test(ua)) return "Windows PC";
        if (/Macintosh/i.test(ua)) return "Mac";
        if (/Linux/i.test(ua)) return "Linux";
        return ua ? "unknown" : "";
      }
      function osOf(ua) {
        var a = ua.match(/Android[\s\/]?([\d.]+)/i); if (a) return "Android " + a[1];
        var i = ua.match(/OS (\d+[_\d]*) like Mac/i); if (i) return "iOS " + i[1].replace(/_/g, ".");
        if (/Windows NT 10/i.test(ua)) return "Windows 10/11";
        if (/Mac OS X ([\d_]+)/i.test(ua)) return "macOS";
        if (/Linux/i.test(ua)) return "Linux";
        return "";
      }
      function isPrivate(ip) {
        return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1|fe80:|fc|fd)/i.test(ip);
      }
      function unique(a) {
        var s = {}, o = [];
        a.forEach(function (x) { if (x && !s[x]) { s[x] = 1; o.push(x); } });
        return o;
      }
    }
  });
})();
