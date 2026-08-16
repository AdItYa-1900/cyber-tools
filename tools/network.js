/* ============================================================
   Cluster: Network side - "What is on the wire?"
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* ---------------- MD5 (pure JS, byte-array input) ----------------
     WebCrypto deliberately does not implement MD5. It is still the
     hash printed on a lot of Indian seizure memos and hash reports,
     so the tool has to be able to produce it for comparison.        */
  function md5(bytes) {
    var S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
    var K = new Uint32Array(64);
    for (var i = 0; i < 64; i++) K[i] = (Math.abs(Math.sin(i + 1)) * 4294967296) | 0;

    var len = bytes.length;
    var withPad = ((len + 8) >> 6 << 4) + 16;
    var M = new Uint32Array(withPad);
    for (i = 0; i < len; i++) M[i >> 2] |= bytes[i] << ((i % 4) << 3);
    M[len >> 2] |= 0x80 << ((len % 4) << 3);
    M[withPad - 2] = len << 3;
    M[withPad - 1] = Math.floor(len / 536870912);

    var a0 = 1732584193, b0 = -271733879, c0 = -1732584194, d0 = 271733878;
    function rol(x, c) { return (x << c) | (x >>> (32 - c)); }

    for (i = 0; i < M.length; i += 16) {
      var A = a0, B = b0, C = c0, D = d0;
      for (var j = 0; j < 64; j++) {
        var F, g;
        if (j < 16)      { F = (B & C) | (~B & D);      g = j; }
        else if (j < 32) { F = (D & B) | (~D & C);      g = (5 * j + 1) % 16; }
        else if (j < 48) { F = B ^ C ^ D;               g = (3 * j + 5) % 16; }
        else             { F = C ^ (B | ~D);            g = (7 * j) % 16; }
        var tmp = D; D = C; C = B;
        var sum = (A + F + K[j] + M[i + g]) | 0;
        B = (B + rol(sum, S[j])) | 0;
        A = tmp;
      }
      a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    return [a0, b0, c0, d0].map(function (n) {
      var s = "";
      for (var k = 0; k < 4; k++) s += ("0" + ((n >>> (k * 8)) & 255).toString(16)).slice(-2);
      return s;
    }).join("");
  }

  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return ("0" + b.toString(16)).slice(-2);
    }).join("");
  }

  /* ==========================================================
     Hash Generator
     ========================================================== */
  TK.reg({
    id: "hash",
    name: "Hash Generator",
    cluster: "network",
    tier: 1,
    desc: "Hash a file or a string with MD5, SHA-1, SHA-256, SHA-384 and SHA-512, verify against a known value, and draft the certificate.",
    lede: "Hash every exhibit the moment it reaches you. Write the value in the seizure memo. Check it again " +
          "before filing. That one habit defeats a tampering argument at trial.",
    badges: ["Offline", "Any file size"],
    legal: {
      authority: "None needed, hashing is a local computation.",
      holder: "N/A",
      evidence: "Bharatiya Sakshya Adhiniyam 2023 s.63 governs electronic records. The s.63(4) " +
                "certificate must be in the form set out in the Schedule and signed by the person in " +
                "charge of the device AND an expert. The hash goes in it.",
      caution: "MD5 and SHA-1 are broken against deliberate collision attacks. They are still fine for " +
               "detecting accidental corruption and for matching a value an operator has already given " +
               "you, but quote SHA-256 as the primary value in anything new."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card"><h3>Hash a file</h3>' +
          '<div class="drop" id="h-drop"><div class="big">⬡</div>' +
          "<div>Drop the exhibit file, or <b>browse</b></div>" +
          '<div class="xs muted" style="margin-top:8px">Read locally. Nothing is uploaded, whatever the size.</div></div>' +
          '<div id="h-file" style="margin-top:14px"></div></div>' +

        '<div class="card"><h3>Hash text</h3>' +
          '<div class="field"><textarea id="h-text" class="mono" placeholder="Paste text to hash"></textarea></div>' +
          '<button class="btn primary" id="h-textgo">Hash text</button>' +
          '<div id="h-textout" style="margin-top:14px"></div></div>' +

        '<div class="card"><h3>Verify against a known value</h3>' +
          '<p class="small muted">Paste the hash the operator, bank or forensic lab supplied. It is compared ' +
          "case-insensitively against every hash computed above.</p>" +
          '<div class="field"><input type="text" id="h-verify" class="mono" placeholder="e.g. 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"></div>' +
          '<div id="h-verdict"></div></div>' +

        '<div class="card"><h3>Section 63(4) certificate, working draft</h3>' +
          '<div class="note warn"><b>Draft only</b><p>The Schedule to the Bharatiya Sakshya Adhiniyam ' +
          "prescribes the form, and it needs signatures from the person in charge of the device and from " +
          "an expert. Have your prosecution wing settle the wording before it is used. This fills in the " +
          "parts a tool can fill in.</p></div>" +
          '<div class="grid c2">' +
            '<div class="field"><label class="lbl">Exhibit / property number</label><input type="text" id="c-ex" placeholder="MO-3"></div>' +
            '<div class="field"><label class="lbl">FIR / case number</label><input type="text" id="c-fir" placeholder="FIR 0123/2026"></div>' +
            '<div class="field"><label class="lbl">Produced by</label><input type="text" id="c-by" placeholder="Nodal Officer, [Bank / TSP]"></div>' +
            '<div class="field"><label class="lbl">Received on</label><input type="text" id="c-on" placeholder="14-03-2026"></div>' +
          "</div>" +
          '<button class="btn primary" id="c-go">Generate</button>' +
          '<div id="c-out" style="margin-top:14px"></div></div>';

      var lastHashes = {};

      function renderHashes(host, hashes, meta) {
        lastHashes = hashes;
        host.innerHTML = (meta || "") +
          '<div class="stack">' + Object.keys(hashes).map(function (k) {
            return '<div><label class="lbl">' + esc(k) + "</label>" +
              '<div class="copyable"><pre class="out" style="padding:8px 12px">' + esc(hashes[k]) +
              '</pre><button class="btn sm copybtn" data-copy="prev">Copy</button></div></div>';
          }).join("") + "</div>" +
          '<div class="row" style="margin-top:12px"><button class="btn sm" data-h="dl">Download hash list</button></div>';
        host.querySelector('[data-h="dl"]').onclick = function () {
          TK.download("hashes.txt", Object.keys(hashes).map(function (k) {
            return k + "  " + hashes[k];
          }).join("\r\n"), "text/plain");
        };
        verify();
      }

      function hashBuffer(buf, cb) {
        var out = {};
        out["MD5"] = md5(new Uint8Array(buf));
        var algos = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
        if (!window.crypto || !crypto.subtle) {
          out["SHA-*"] = "unavailable, this browser did not expose WebCrypto on a local file";
          return cb(out);
        }
        Promise.all(algos.map(function (a) {
          return crypto.subtle.digest(a, buf).then(function (d) { out[a] = hex(d); });
        })).then(function () { cb(out); }).catch(function () { cb(out); });
      }

      TK.dropzone($("#h-drop"), function (f) {
        var host = $("#h-file");
        host.innerHTML = '<div class="row tight"><span class="spinner"></span> hashing ' +
          esc(f.name) + " (" + TK.fmtBytes(f.size) + ")…</div>";
        var r = new FileReader();
        r.onload = function () {
          hashBuffer(r.result, function (hashes) {
            renderHashes(host, hashes,
              '<dl class="kv" style="margin-bottom:14px"><dt>File</dt><dd>' + esc(f.name) + "</dd>" +
              "<dt>Size</dt><dd>" + TK.fmtBytes(f.size) + " (" + TK.fmtNum(f.size) + " bytes)</dd>" +
              "<dt>Last modified</dt><dd>" + esc(TK.fmtDate(new Date(f.lastModified))) + "</dd>" +
              "<dt>Hashed at</dt><dd>" + esc(TK.fmtDate(new Date())) + "</dd></dl>");
            window.__lastFile = { name: f.name, size: f.size, hashes: hashes };
          });
        };
        r.onerror = function () { host.innerHTML = '<div class="note danger"><b>Could not read the file</b></div>'; };
        r.readAsArrayBuffer(f);
      });

      $("#h-textgo").onclick = function () {
        var t = $("#h-text").value;
        if (!t) { TK.toast("Nothing to hash", "danger"); return; }
        var buf = new TextEncoder().encode(t);
        hashBuffer(buf.buffer, function (hashes) {
          renderHashes($("#h-textout"), hashes,
            '<p class="xs muted" style="margin:0 0 12px">' + TK.fmtNum(buf.length) + " bytes of UTF-8.</p>");
        });
      };

      function verify() {
        var v = $("#h-verify").value.trim().toLowerCase().replace(/[^a-f0-9]/g, "");
        var el = $("#h-verdict");
        if (!v) { el.innerHTML = ""; return; }
        var match = Object.keys(lastHashes).filter(function (k) {
          return String(lastHashes[k]).toLowerCase() === v;
        });
        el.innerHTML = match.length
          ? '<div class="note ok"><b>MATCH, ' + esc(match.join(", ")) + "</b><p>The value you were given is " +
            "identical to the one computed here. The file is bit-for-bit what was produced.</p></div>"
          : '<div class="note danger"><b>NO MATCH</b><p>None of the computed hashes equals this value. Either ' +
            "the file differs from the one that was hashed, a different algorithm was used, or the value was " +
            "mistranscribed. Check the algorithm first, that is usually what it is.</p></div>";
      }
      $("#h-verify").addEventListener("input", verify);

      $("#c-go").onclick = function () {
        var f = window.__lastFile;
        if (!f) { TK.toast("Hash a file first", "danger"); return; }
        var txt =
"CERTIFICATE UNDER SECTION 63(4) OF THE BHARATIYA SAKSHYA ADHINIYAM, 2023\n" +
"(working draft, to be settled in the form prescribed in the Schedule)\n\n" +
"Case            : " + ($("#c-fir").value || "[FIR No. ____ / 20__]") + "\n" +
"Exhibit         : " + ($("#c-ex").value || "[exhibit / property number]") + "\n" +
"Produced by     : " + ($("#c-by").value || "[name and designation of the person producing the record]") + "\n" +
"Received on     : " + ($("#c-on").value || "[DD-MM-YYYY]") + "\n\n" +
"1. The electronic record described below was produced from a computer/communication device\n" +
"   that was, at all material times, in regular use and operating properly.\n\n" +
"       File name   : " + f.name + "\n" +
"       File size   : " + f.size + " bytes\n" +
"       MD5         : " + (f.hashes["MD5"] || "-") + "\n" +
"       SHA-1       : " + (f.hashes["SHA-1"] || "-") + "\n" +
"       SHA-256     : " + (f.hashes["SHA-256"] || "-") + "\n" +
"       SHA-512     : " + (f.hashes["SHA-512"] || "-") + "\n" +
"       Hashed on   : " + TK.fmtDate(new Date()) + "\n\n" +
"2. The information contained in the said electronic record was regularly fed into the\n" +
"   computer in the ordinary course of the said activities.\n\n" +
"3. Throughout the material part of that period the computer was operating properly; and if\n" +
"   not, any period of non-operation did not affect the electronic record or the accuracy of\n" +
"   its contents.\n\n" +
"4. The information contained in the electronic record reproduces or is derived from\n" +
"   information fed into the computer in the ordinary course of the said activities.\n\n" +
"5. The hash values stated above were computed on receipt and may be re-verified at any time\n" +
"   against the exhibit to establish that it has not been altered.\n\n" +
"Signature of the person in charge of the device : ______________________\n" +
"Name and designation                            : ______________________\n\n" +
"Signature of the expert                         : ______________________\n" +
"Name and designation                            : ______________________\n\n" +
"Place : ____________            Date : ____________";

        $("#c-out").innerHTML = '<div class="copyable"><pre class="out doc">' + esc(txt) +
          '</pre><button class="btn sm copybtn" data-copy="prev">Copy</button></div>' +
          '<div class="row" style="margin-top:10px"><button class="btn sm" id="c-dl">Download .txt</button></div>';
        $("#c-dl").onclick = function () { TK.download("s63-certificate-draft.txt", txt, "text/plain"); };
      };
    }
  });

  /* ==========================================================
     IP Intelligence
     ========================================================== */
  TK.reg({
    id: "ip",
    name: "IP Intelligence",
    cluster: "network",
    tier: 1,
    desc: "Classify an address offline, then pull the live RDAP registration and abuse contact.",
    lede: "Half the addresses that reach an investigator cannot be traced at all. Knowing that " +
          "straight away saves weeks. This tells you which half you are holding.",
    badges: ["RDAP", "RFC 1918 / 6598"],
    legal: {
      authority: "RDAP and WHOIS are public registries, no authority needed to query them.",
      holder: "Which subscriber held an address at a time is with the access provider: BNSS 2023 s.94, " +
              "and see the IPDR Analyser for what the request must contain.",
      caution: "Geolocation from an IP address is a commercial estimate, frequently wrong by hundreds of " +
               "kilometres, and it resolves to the operator's infrastructure, not the user. It is not " +
               "evidence of anybody's location.",
      evidence: "Capture the RDAP response and its timestamp now. Registrations change and hosting " +
                "disappears, an abuse contact you did not preserve is one you no longer have."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">IP address or domain</label>' +
          '<input type="text" id="ipi-in" class="mono" placeholder="103.21.244.1  or  example.com"></div>' +
          '<div class="row"><button class="btn primary" id="ipi-go">Analyse</button>' +
          '' +
          '' +
          '</div>' +
        "</div><div id=\"ipi-out\"></div>";

      $("#ipi-go").onclick = go;
      $("#ipi-in").addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });

      function toInt(ip) {
        var p = ip.split(".").map(Number);
        return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
      }
      function inCidr(ip, cidr) {
        var parts = cidr.split("/"), bits = +parts[1];
        var mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0;
        return (toInt(ip) & mask) >>> 0 === (toInt(parts[0]) & mask) >>> 0;
      }

      function go() {
        var v = $("#ipi-in").value.trim();
        if (!v) return;
        var isIP4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(v) &&
          v.split(".").every(function (o) { return +o >= 0 && +o <= 255; });
        var isIP6 = /^[0-9a-f:]+$/i.test(v) && v.indexOf(":") !== -1;
        var out = "";

        if (isIP4) {
          var reserved = IP_RESERVED.filter(function (r) { return inCidr(v, r.cidr); })[0];
          var cgnat = reserved && reserved.cidr === "100.64.0.0/10";
          var priv = reserved && /^(10\.|172\.16|192\.168)/.test(reserved.cidr);

          out += '<div class="card"><div class="row" style="margin-bottom:12px">' +
            '<span class="mono" style="font-size:17px;font-weight:600">' + esc(v) + "</span>" +
            '<span class="badge ' + (reserved ? (priv ? "danger" : "warn") : "ok") + '">' +
            esc(reserved ? reserved.label : "Globally routable") + "</span></div>";

          out += '<dl class="kv"><dt>Version</dt><dd>IPv4</dd>' +
            "<dt>Integer</dt><dd>" + TK.fmtNum(toInt(v)) + "</dd>" +
            "<dt>Class (historic)</dt><dd>" + (function () {
              var f = +v.split(".")[0];
              return f < 128 ? "A" : f < 192 ? "B" : f < 224 ? "C" : f < 240 ? "D (multicast)" : "E (reserved)";
            })() + "</dd>" +
            "<dt>Routable</dt><dd>" + (reserved ? "No, reserved space" : "Yes") + "</dd></dl>";

          if (priv) {
            out += '<div class="note danger" style="margin-top:12px"><b>This address is useless as given</b>' +
              "<p>RFC 1918 space exists behind millions of separate routers. It never appears on the public " +
              "internet, so no operator can tell you who held it. Whoever gave you this address gave you an " +
              "internal one, go back and ask for the public address, the source port and the exact time.</p></div>";
          } else if (cgnat) {
            out += '<div class="note warn" style="margin-top:12px"><b>Carrier-grade NAT, shared address</b>' +
              "<p>RFC 6598 space is shared by a large number of subscribers simultaneously. The address alone " +
              "resolves to hundreds of people. You need the public address, the source port and a second-accurate " +
              "timestamp with its timezone. See the IPDR Analyser before drafting the notice.</p></div>";
          }
          out += '<div id="ipi-rdap" style="margin-top:14px"><span class="row tight xs muted">' +
            '<span class="spinner"></span> querying RDAP…</span></div></div>';
        } else if (isIP6) {
          out += '<div class="card"><div class="row" style="margin-bottom:12px">' +
            '<span class="mono" style="font-size:16px;font-weight:600">' + esc(v) + "</span>" +
            '<span class="badge accent">IPv6</span></div>' +
            '<dl class="kv"><dt>Type</dt><dd>' +
            (/^fe80:/i.test(v) ? "Link-local" : /^f[cd]/i.test(v) ? "Unique local (RFC 4193), not routable" :
             /^ff/i.test(v) ? "Multicast" : "Global unicast") + "</dd></dl>" +
            '<div class="note info" style="margin-top:12px"><b>IPv6 changes the request</b>' +
            "<p>There is usually no NAT, so the address maps more directly to a subscriber prefix, but " +
            "privacy extensions rotate the host portion. Ask the operator for the /64 prefix assignment, " +
            "not just the full address.</p></div>" +
            '<div id="ipi-rdap" style="margin-top:14px"><span class="row tight xs muted">' +
            '<span class="spinner"></span> querying RDAP…</span></div></div>';
        } else {
          out += '<div class="card"><div class="row" style="margin-bottom:12px">' +
            '<span class="mono" style="font-size:16px;font-weight:600">' + esc(v) + "</span>" +
            '<span class="badge accent">Domain</span></div>' +
            '<div class="note warn"><b>Preserve before you investigate</b><p>Phishing domains are taken down ' +
            "or abandoned within days. Capture the RDAP record and a full-page screenshot with a visible " +
            "timestamp now, hash them, and only then start analysing. Do not visit the site from a police " +
            "network.</p></div>" +
            '<div id="ipi-rdap"><span class="row tight xs muted"><span class="spinner"></span> querying RDAP…</span></div></div>';
        }

        out += '<div class="note info"><b>What an IP can and cannot establish</b><p>It can establish which ' +
          "network held the address, and, with a lawful request to that network, which subscriber account " +
          "was assigned it at a moment in time. It cannot establish who was sitting at the keyboard, and " +
          "commercial geolocation cannot establish where they were. Both of those need corroboration from " +
          "somewhere else in the case.</p></div>";

        $("#ipi-out").innerHTML = out;

        var url = isIP4 || isIP6 ? "https://rdap.org/ip/" + encodeURIComponent(v)
          : "https://rdap.org/domain/" + encodeURIComponent(v.replace(/^https?:\/\//, "").split("/")[0]);

        fetch(url, { headers: { "Accept": "application/rdap+json" } })
          .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
          .then(function (d) {
            var rows = [];
            if (d.name) rows.push(["Network name", d.name]);
            if (d.handle) rows.push(["Handle", d.handle]);
            if (d.startAddress) rows.push(["Range", d.startAddress + " - " + d.endAddress]);
            if (d.type) rows.push(["Allocation type", d.type]);
            if (d.country) rows.push(["Country", d.country]);
            if (d.ldhName) rows.push(["Domain", d.ldhName]);
            if (d.status) rows.push(["Status", [].concat(d.status).join(", ")]);
            (d.events || []).forEach(function (e) {
              rows.push([e.eventAction.replace(/^\w/, function (c) { return c.toUpperCase(); }),
                         String(e.eventDate).replace("T", " ").replace(/\.*/, "")]);
            });

            var contacts = [];
            (d.entities || []).forEach(function (en) {
              var role = (en.roles || []).join(", ");
              var name = "", email = "", phone = "";
              ((en.vcardArray || [])[1] || []).forEach(function (f) {
                if (f[0] === "fn") name = f[3];
                if (f[0] === "email") email = f[3];
                if (f[0] === "tel") phone = f[3];
              });
              if (name || email) contacts.push({ role: role, name: name, email: email, phone: phone });
            });

            var slot = $("#ipi-rdap");
            if (!slot) return;
            slot.innerHTML = '<div class="note ok"><b>RDAP registration</b>' +
              '<dl class="kv" style="margin-top:8px">' + rows.map(function (r) {
                return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>";
              }).join("") + "</dl></div>" +
              (contacts.length ? '<div style="margin-top:12px"><h4>Registered contacts</h4>' +
                contacts.map(function (c) {
                  return '<div style="padding:7px 0;border-bottom:1px solid var(--line)">' +
                    '<span class="badge ' + (/abuse/i.test(c.role) ? "danger" : "") + '">' +
                    esc(c.role || "contact") + "</span> " +
                    "<b>" + esc(c.name) + "</b>" +
                    (c.email ? ' <span class="mono small">' + esc(c.email) + "</span>" : "") +
                    (c.phone ? ' <span class="mono small muted">' + esc(c.phone) + "</span>" : "") + "</div>";
                }).join("") +
                '<p class="xs muted" style="margin-top:8px">The abuse contact is who you write to for ' +
                "preservation and takedown. Preservation first, takedown destroys evidence.</p></div>" : "") +
              '<div class="row" style="margin-top:12px"><button class="btn sm" id="ipi-save">Save RDAP response</button></div>';

            $("#ipi-save").onclick = function () {
              TK.download("rdap-" + v.replace(/[^\w.]/g, "_") + ".json",
                JSON.stringify({ queried: v, at: new Date().toISOString(), response: d }, null, 2),
                "application/json");
            };
          })
          .catch(function (e) {
            var slot = $("#ipi-rdap");
            if (!slot) return;
            slot.innerHTML = '<div class="note warn"><b>RDAP lookup unavailable</b>' +
              "<p>" + (e === 404 ? "No registration record found for this value."
                : "No network access, or the browser blocked the cross-origin request, which is common when " +
                  "this page is opened directly from disk rather than served. The offline classification above " +
                  "is unaffected.") + "</p>" +
              '<p class="xs">Manual: <span class="mono">' + esc(url) + "</span></p></div>";
          });
      }
    }
  });
})();
