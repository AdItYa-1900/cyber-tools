/* ============================================================
   Additional tools that keep coming up in real casework:

     Email Header Analyser - the single most useful thing you can do
       with a phishing or business-email-compromise complaint, and it
       needs nothing but the raw headers the victim can export.
     Timestamp Converter   - epoch, UTC and IST in one place, because
       a silent 5:30 offset is the commonest way a trail is lost.
     Text Decoder          - Base64, hex, URL encoding and punycode,
       plus a homograph check for lookalike domains.

   All three are pure computation and run offline.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* ==========================================================
     Email Header Analyser
     ========================================================== */
  TK.reg({
    id: "mailhdr",
    name: "Email Header Analyser",
    cluster: "network",
    tier: 2,
    desc: "Read raw email headers to find the true sender, the originating IP and signs of spoofing.",
    lede: "The From line is easy to fake. The delivery records underneath are not. They carry the " +
          "IP address you can actually serve notice on.",
    wide: true,
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">Paste the full raw headers</label>' +
          '<textarea id="mh-in" class="mono" style="min-height:180px" placeholder="Received: from ...&#10;Authentication-Results: ...&#10;From: ...&#10;Return-Path: ..."></textarea>' +
          '<p class="xs muted" style="margin-top:6px">In Gmail: open the message, three-dot menu, ' +
          '"Show original", then copy everything. In Outlook: File, Properties, Internet headers.</p></div>' +
          '<div class="row"><button class="btn primary" id="mh-go">Analyse</button>' +
          '</div>' +
        "</div><div id=\"mh-out\"></div>";

      TK.fileInto("#mh-in", { label: "Load a saved header file or PDF" , onLoad: function () { var b = TK.$("#mh-go"); if (b) b.click(); } });

      $("#mh-go").onclick = run;

      function unfold(text) {
        // RFC 5322 folded headers continue on lines starting with whitespace
        return text.replace(/\r\n/g, "\n").replace(/\n[ \t]+/g, " ");
      }

      function headers(text) {
        var out = [];
        unfold(text).split("\n").forEach(function (l) {
          var m = l.match(/^([A-Za-z0-9\-]+):\s*(.*)$/);
          if (m) out.push({ k: m[1], kl: m[1].toLowerCase(), v: m[2].trim() });
        });
        return out;
      }

      function first(hs, name) {
        var h = hs.filter(function (x) { return x.kl === name; })[0];
        return h ? h.v : "";
      }

      function ips(s) {
        return (s.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || []).filter(function (ip) {
          return ip.split(".").every(function (o) { return +o <= 255; });
        });
      }

      function isPrivate(ip) {
        return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(ip);
      }

      function domainOf(addr) {
        var m = String(addr).match(/@([A-Za-z0-9.\-]+)/);
        return m ? m[1].toLowerCase().replace(/[>\s.]+$/, "") : "";
      }

      function run() {
        var raw = $("#mh-in").value;
        if (!raw.trim()) { TK.toast("Paste the headers first", "danger"); return; }
        var hs = headers(raw);
        if (!hs.length) {
          $("#mh-out").innerHTML = '<div class="note danger"><b>No headers recognised</b>' +
            "<p>Make sure you pasted the raw source, not the message body.</p></div>";
          return;
        }

        var from = first(hs, "from"), retPath = first(hs, "return-path");
        var replyTo = first(hs, "reply-to"), subject = first(hs, "subject");
        var auth = hs.filter(function (h) { return h.kl === "authentication-results"; })
          .map(function (h) { return h.v; }).join(" ");
        var recv = hs.filter(function (h) { return h.kl === "received"; }).map(function (h) { return h.v; });

        // Received headers are prepended, so the last is the earliest hop.
        var chain = recv.slice().reverse().map(function (r, i) {
          var all = ips(r).filter(function (ip) { return !isPrivate(ip); });
          var host = (r.match(/from\s+([A-Za-z0-9.\-]+)/i) || [])[1] || "";
          var when = (r.match(/;\s*(.+)$/) || [])[1] || "";
          return { hop: i + 1, host: host, ip: all[0] || "", when: when.trim(), raw: r };
        });
        var origin = chain.filter(function (c) { return c.ip; })[0];

        function verdict(re) {
          var m = auth.match(re);
          return m ? m[1].toLowerCase() : "";
        }
        var spf = verdict(/spf=(\w+)/i), dkim = verdict(/dkim=(\w+)/i), dmarc = verdict(/dmarc=(\w+)/i);

        var fromDom = domainOf(from), pathDom = domainOf(retPath), replyDom = domainOf(replyTo);
        var findings = [], score = 0;

        function add(k, t, d) { findings.push({ k: k, t: t, d: d }); if (k === "danger") score += 3; else if (k === "warn") score += 1; }

        if (spf) add(spf === "pass" ? "ok" : "danger", "SPF " + spf.toUpperCase(),
          spf === "pass" ? "The sending IP is authorised to send for that domain."
            : "The sending server is NOT authorised by the domain it claims. Strong indicator of spoofing.");
        if (dkim) add(dkim === "pass" ? "ok" : dkim === "none" ? "warn" : "danger", "DKIM " + dkim.toUpperCase(),
          dkim === "pass" ? "The message carries a valid signature from the sending domain."
            : dkim === "none" ? "Unsigned. Genuine bank and government mail is normally signed."
            : "Signature verification failed. The message was altered or forged.");
        if (dmarc) add(dmarc === "pass" ? "ok" : "danger", "DMARC " + dmarc.toUpperCase(),
          dmarc === "pass" ? "Alignment checks passed."
            : "DMARC failed. The domain owner's own policy says this message should be rejected.");
        if (!spf && !dkim && !dmarc)
          add("warn", "No authentication results present",
            "The receiving server did not record SPF/DKIM/DMARC, or those headers were not copied. Ask the complainant to re-export the full original.");

        if (fromDom && pathDom && fromDom !== pathDom)
          add("danger", "From and Return-Path disagree",
            "Displayed as " + fromDom + " but the envelope sender is " + pathDom +
            ". Bounces go to the second one, which is usually the real operator.");
        if (replyDom && fromDom && replyDom !== fromDom)
          add("danger", "Reply-To points elsewhere",
            "Replies would go to " + replyDom + ", not " + fromDom +
            ". This is how the fraudster collects the answer while showing a trusted name.");
        if (/\b(hdfc|sbi|icici|axis|kotak|paytm|phonepe|npci|uidai|rbi|incometax|gov)\b/i.test(from) &&
            !/\.(gov|nic)\.in$|(hdfcbank|sbi|icicibank|axisbank|kotak|paytm|phonepe|npci)\.(com|co\.in|in|org\.in)$/i.test(fromDom))
          add("danger", "Display name impersonates an institution",
            "The From line reads like a bank or government sender but the domain " + (fromDom || "(none)") +
            " does not belong to it.");
        if (/\.(top|xyz|click|link|online|site|buzz|icu|cam|rest|zip|mov)$/i.test(fromDom))
          add("warn", "High-abuse top-level domain: " + fromDom, "Cheap to register and heavily used for fraud.");
        if (/\b(urgent|immediately|suspend|blocked|expire|verify now|last warning)\b/i.test(subject))
          add("warn", "Pressure wording in the subject", "Deadline pressure stops the recipient checking.");
        var xm = first(hs, "x-mailer") || first(hs, "x-php-originating-script");
        if (/phpmailer|swiftmailer|sendgrid|python|perl/i.test(xm))
          add("warn", "Sent by a bulk mailing library: " + xm,
            "Normal corporate mail does not usually advertise this.");
        if (origin && origin.ip)
          add("info", "Originating IP: " + origin.ip,
            "This is the address to put in your requisition. Run it through IP Address Check for the network owner and abuse contact.");

        var kind = score >= 6 ? { k: "danger", t: "Almost certainly forged" }
          : score >= 3 ? { k: "warn", t: "Suspicious, verify before acting" }
          : score >= 1 ? { k: "warn", t: "Minor indicators present" }
          : { k: "ok", t: "No spoofing indicators found" };

        var out = '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(chain.length, "Mail hops") +
          TK.stat(origin && origin.ip ? origin.ip : "not found", "Originating IP", origin && origin.ip ? "accent" : "warn") +
          TK.stat((spf || "n/a").toUpperCase(), "SPF", spf === "pass" ? "ok" : spf ? "danger" : "warn") +
          TK.stat((dmarc || "n/a").toUpperCase(), "DMARC", dmarc === "pass" ? "ok" : dmarc ? "danger" : "warn") +
        "</div>";

        out += '<div class="card"><div class="row" style="margin-bottom:14px">' +
          '<span class="badge ' + kind.k + '" style="font-size:13px;padding:4px 12px">' + esc(kind.t) + "</span>" +
          "</div>" + findings.map(function (f) {
            return '<div class="note ' + f.k + '"><b>' + esc(f.t) + "</b>" +
              (f.d ? "<p>" + esc(f.d) + "</p>" : "") + "</div>";
          }).join("") + "</div>";

        out += '<div class="card"><h3>Delivery path</h3>' +
          '<p class="small muted">Read top to bottom: hop 1 is the earliest server, which is where the ' +
          "message actually entered the mail system.</p><div class=\"rail\">" +
          chain.map(function (c, i) {
            return '<div class="rail-item ' + (i === 0 ? "danger" : "") + '">' +
              '<div class="row tight"><b>Hop ' + c.hop + "</b>" +
              (c.ip ? '<span class="badge ' + (i === 0 ? "danger" : "") + ' mono">' + esc(c.ip) + "</span>" : "") +
              (i === 0 ? '<span class="badge danger">origin</span>' : "") + "</div>" +
              '<div class="small" style="margin-top:3px">' + esc(c.host || "(host not stated)") + "</div>" +
              (c.when ? '<div class="xs muted mono" style="margin-top:2px">' + esc(c.when) + "</div>" : "") +
              "</div>";
          }).join("") + "</div></div>";

        out += '<div class="card"><h3>Key fields</h3><dl class="kv">' +
          "<dt>From</dt><dd>" + esc(from || "(absent)") + "</dd>" +
          "<dt>Return-Path</dt><dd>" + esc(retPath || "(absent)") + "</dd>" +
          "<dt>Reply-To</dt><dd>" + esc(replyTo || "(absent)") + "</dd>" +
          "<dt>Subject</dt><dd>" + esc(subject) + "</dd>" +
          "<dt>Date</dt><dd>" + esc(first(hs, "date")) + "</dd>" +
          "<dt>Message-ID</dt><dd>" + esc(first(hs, "message-id")) + "</dd>" +
          "</dl></div>";


        $("#mh-out").innerHTML = out;
      }
    }
  });

  /* ==========================================================
     Timestamp Converter
     ========================================================== */
  TK.reg({
    id: "time",
    name: "Timestamp Converter",
    cluster: "case",
    tier: 1,
    desc: "Convert between epoch, UTC and IST so a five-and-a-half hour offset never costs you a case.",
    lede: "Website logs are usually in UTC. Operator logs are usually in IST. Getting this wrong shifts " +
          "every event by 5 hours 30 minutes.",
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">Paste any timestamp</label>' +
          '<input type="text" id="ts-in" class="mono" placeholder="1773500502  or  2026-03-14 14:41:36  or  14/03/2026 20:11:42"></div>' +
          '<div class="row"><div class="seg" id="ts-tz">' +
            '<button class="on" data-tz="utc">Source is UTC</button>' +
            '<button data-tz="ist">Source is IST</button>' +
          "</div></div>" +
          '<div id="ts-out" style="margin-top:16px"></div></div>' +
        '<div class="card"><h3>Convert many at once</h3>' +
        '<p class="xs muted" style="margin-bottom:12px">Drop a log, a CSV or a PDF and every timestamp in it is ' +
        "converted to UTC and IST together.</p>" +
        '<div id="ts-bulk"></div></div>' +
        '<div class="card"><h3>Now</h3><div id="ts-now"></div></div>';

      var srcTz = "utc";
      $("#ts-tz").onclick = function (e) {
        var b = e.target.closest("button"); if (!b) return;
        TK.$$("#ts-tz button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); srcTz = b.dataset.tz; conv();
      };
      $("#ts-in").addEventListener("input", conv);

      /* Many at once. Platform logs arrive as pages of epoch values, and
         reading them one at a time is where the five-and-a-half hour
         mistake gets made. */
      TK.bulkPanel($("#ts-bulk"), {
        placeholder: "Paste a log, or drop a CSV or PDF, and every timestamp in it is converted",
        action: "Convert all",
        valueLabel: "As written",
        okLabel: "Converted",
        badLabel: "Unreadable",
        none: "No timestamps were found in that text.",
        filename: "timestamps.csv",
        extract: function (text) {
          var out = [], m, re;
          re = /(?<!\d)(\d{13}|\d{10})(?!\d)/g;
          while ((m = re.exec(text)) !== null) out.push(m[1]);
          re = /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?\b/g;
          while ((m = re.exec(text)) !== null) out.push(m[0]);
          re = /\b\d{2}[-\/]\d{2}[-\/]\d{4}[ ,]+\d{2}:\d{2}(?::\d{2})?\b/g;
          while ((m = re.exec(text)) !== null) out.push(m[0]);
          return out;
        },
        check: function (v) {
          var utc = null;
          if (/^\d{10}$/.test(v)) utc = new Date(+v * 1000);
          else if (/^\d{13}$/.test(v)) utc = new Date(+v);
          else {
            var d = TK.parseDate(v);
            if (d) {
              var wall = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(),
                                  d.getHours(), d.getMinutes(), d.getSeconds());
              utc = new Date(srcTz === "ist" ? wall - IST : wall);
            }
          }
          if (!utc || isNaN(utc.getTime())) {
            return { value: v, utc: "", ist: "", ok: false, verdict: "Could not be read" };
          }
          var ist = new Date(utc.getTime() + IST);
          return { value: v, utc: fmt(utc), ist: fmt(ist), ok: true,
                   verdict: "Converted" };
        },
        columns: [{ k: "utc", label: "UTC", cls: "mono" }, { k: "ist", label: "IST", cls: "mono" }]
      });

      var IST = 5.5 * 3600000;
      function fmt(d) {
        var p = function (n) { return (n < 10 ? "0" : "") + n; };
        return d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate()) +
          " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds());
      }

      function conv() {
        var v = $("#ts-in").value.trim();
        var el = $("#ts-out");
        if (!v) { el.innerHTML = ""; return; }

        var utc = null;
        if (/^\d{10}$/.test(v)) utc = new Date(+v * 1000);
        else if (/^\d{13}$/.test(v)) utc = new Date(+v);
        else {
          var d = TK.parseDate(v);
          if (d) {
            // TK.parseDate builds a local Date; treat its wall-clock reading
            // as being in the timezone the user selected.
            var wall = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(),
                                d.getHours(), d.getMinutes(), d.getSeconds());
            utc = new Date(srcTz === "ist" ? wall - IST : wall);
          }
        }
        if (!utc || isNaN(utc.getTime())) {
          el.innerHTML = '<div class="note warn"><b>Could not read that timestamp</b>' +
            "<p>Try a 10-digit epoch, or a date such as 2026-03-14 14:41:36.</p></div>";
          return;
        }

        var ist = new Date(utc.getTime() + IST);
        el.innerHTML = '<div class="grid c2" style="margin-bottom:14px">' +
          TK.stat(fmt(utc), "UTC") + TK.stat(fmt(ist), "IST", "accent") + "</div>" +
          '<dl class="kv">' +
          "<dt>Epoch seconds</dt><dd>" + Math.floor(utc.getTime() / 1000) + "</dd>" +
          "<dt>Epoch milliseconds</dt><dd>" + utc.getTime() + "</dd>" +
          "<dt>ISO 8601</dt><dd>" + utc.toISOString() + "</dd>" +
          "<dt>Day of week</dt><dd>" +
            ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][ist.getUTCDay()] +
            " (IST)</dd>" +
          "</dl>" +
          '<p class="small muted" style="margin-top:14px">Write it as <span class="mono">' +
          esc(fmt(ist)) + " IST</span>. Never give a time without its timezone.</p>";
        TK.animateStats(el);
      }

      function tick() {
        // fmt() reads UTC components, so an absolute Date already prints as
        // UTC. Adding the local offset on top shifted it a second time.
        var now = new Date();
        var el = $("#ts-now");
        if (!el) return;
        el.innerHTML = '<dl class="kv">' +
          "<dt>UTC now</dt><dd>" + fmt(now) + "</dd>" +
          "<dt>IST now</dt><dd>" + fmt(new Date(now.getTime() + IST)) + "</dd>" +
          "<dt>Epoch now</dt><dd>" + Math.floor(now.getTime() / 1000) + "</dd></dl>";
      }
      tick();
      var iv = setInterval(function () {
        if (!document.getElementById("ts-now")) { clearInterval(iv); return; }
        tick();
      }, 1000);
    }
  });

  /* ==========================================================
     Text Decoder
     ========================================================== */
  TK.reg({
    id: "decode",
    name: "Text Decoder",
    cluster: "network",
    tier: 1,
    desc: "Decode Base64, hex, URL encoding and punycode, and spot lookalike domain characters.",
    lede: "Fraud links hide their real content behind a handful of common encodings. This tries them " +
          "all and shows you which one produced readable text.",
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">Paste the encoded text</label>' +
          '<textarea id="dc-in" class="mono" style="min-height:110px" placeholder="aHR0cHM6Ly9leGFtcGxlLmluL3BheQ==  or  %68%74%74%70  or  xn--80ak6aa92e.com"></textarea></div>' +
          '<div class="row"><button class="btn primary" id="dc-go">Decode</button>' +
          '</div>' +
        "</div><div id=\"dc-out\"></div>";

      TK.fileInto("#dc-in", { label: "Load a file to decode" , onLoad: function () { var b = TK.$("#dc-go"); if (b) b.click(); } });

      $("#dc-go").onclick = run;

      function printable(s) {
        if (!s) return false;
        var ok = s.split("").filter(function (c) {
          var n = c.charCodeAt(0);
          return n === 9 || n === 10 || n === 13 || (n >= 32 && n < 127) || n > 160;
        }).length;
        return ok / s.length > 0.9;
      }

      function run() {
        var v = $("#dc-in").value.trim();
        if (!v) return;
        var results = [];

        try {
          var b = atob(v.replace(/\s+/g, ""));
          if (printable(b)) results.push({ n: "Base64", v: b });
        } catch (e) { /* not base64 */ }

        try {
          var u = decodeURIComponent(v);
          if (u !== v) results.push({ n: "URL encoding", v: u });
        } catch (e) { /* malformed escape */ }

        var hx = v.replace(/[^0-9a-fA-F]/g, "");
        if (hx.length >= 4 && hx.length % 2 === 0 && /^[0-9a-fA-F\s]+$/.test(v.trim())) {
          var s = "";
          for (var i = 0; i < hx.length; i += 2) s += String.fromCharCode(parseInt(hx.substr(i, 2), 16));
          if (printable(s)) results.push({ n: "Hex", v: s });
        }

        var rot = v.replace(/[a-zA-Z]/g, function (c) {
          var base = c <= "Z" ? 65 : 97;
          return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
        });
        if (rot !== v) results.push({ n: "ROT13", v: rot });

        // punycode / homograph check
        var warn = "";
        if (/xn--/i.test(v)) {
          warn += '<div class="note danger"><b>Punycode domain</b><p>This is an internationalised domain ' +
            "name. They are routinely used to register lookalikes of real brands using non-Latin characters " +
            "that render identically. Treat it as hostile until proven otherwise.</p></div>";
        }
        var nonAscii = v.split("").filter(function (c) { return c.charCodeAt(0) > 127; });
        if (nonAscii.length && /[a-z]/i.test(v)) {
          var uniq = Array.from(new Set(nonAscii)).slice(0, 12);
          warn += '<div class="note danger"><b>Mixed-script text</b><p>Latin letters appear alongside ' +
            "non-Latin characters: <span class='mono'>" + esc(uniq.join(" ")) + "</span>. In a domain or a " +
            "sender name this is a homograph attack: the characters look like ordinary letters but are not.</p></div>";
        }

        $("#dc-out").innerHTML = warn +
          (results.length
            ? results.map(function (r) {
                return '<div class="card tight"><div class="row" style="margin-bottom:9px">' +
                  '<span class="badge accent">' + esc(r.n) + "</span></div>" +
                  '<div class="copyable"><pre class="out">' + esc(r.v) +
                  '</pre><button class="btn sm copybtn" data-copy="prev">Copy</button></div></div>';
              }).join("")
            : '<div class="note"><b>Nothing decoded</b><p>The text does not appear to be Base64, hex, ' +
              "URL-encoded or ROT13. It may already be plain text, or encrypted rather than encoded.</p></div>");
      }
    }
  });
})();
