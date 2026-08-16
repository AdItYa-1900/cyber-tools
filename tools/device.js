/* ============================================================
   Cluster: Device tracing - "Which handset, and where is it now?"
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$;

  /* ---------- Luhn, shared by IMEI and card BINs ---------- */
  function luhn(numStr) {
    var sum = 0, alt = false;
    for (var i = numStr.length - 1; i >= 0; i--) {
      var d = +numStr[i];
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return sum % 10 === 0;
  }
  function luhnDigit(payload) {
    var sum = 0, alt = true;
    for (var i = payload.length - 1; i >= 0; i--) {
      var d = +payload[i];
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return (10 - (sum % 10)) % 10;
  }

  /* ==========================================================
     IMEI Analyser
     ========================================================== */
  TK.reg({
    id: "imei",
    name: "IMEI Analyser",
    cluster: "device",
    tier: 1,
    desc: "Validate an IMEI, split TAC / serial / check digit, and identify the certifying body.",
    lede: "Structure, checksum and make/model all work offline. Around 248,000 type allocation " +
          "codes are bundled. Owner is never decidable, by any tool, lawful or otherwise.",
    badges: ["3GPP TS 23.003", "Luhn"],
    legal: {
      authority: "BNSS 2023 s.94 to the access providers for IMEI-to-IMSI pairing; CEIR " +
                 "blocking and tracing through the State Police nodal channel to DoT.",
      threshold: "Per state SOP, commonly SP / DCP for device tracing requests.",
      holder: "The IMEI-IMSI pairing lives in operator CDR. CEIR holds blacklist status.",
      retention: "Tied to CDR retention, assume one year.",
      caution: "IMEI is reported by the handset's own software and can be spoofed or reflashed. " +
               "An IMEI appearing in two places at once is evidence of tampering, not of one device.",
      evidence: "The public KYM check (SMS to 14422) returns make, model and blacklist status. " +
                "It never returns an owner. Do not let that get recorded as an ownership result."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">IMEI / IMEISV, one per line</label>' +
          '<textarea id="imei-in" class="mono" placeholder="358240051111110&#10;35-209900-176148-1"></textarea></div>' +
          '<div class="row"><button class="btn primary" id="imei-go">Analyse</button>' +
          '' +
          '<button class="btn" id="imei-fix">Repair check digit</button></div>' +
        "</div><div id=\"imei-out\"></div>" +
        '<div class="card"><h3>Make and model</h3>' +
        '<p class="small muted">Around 248,000 type allocation codes are bundled, so most handsets ' +
        'resolve without a network. This is a community-maintained list, not the GSMA register: it is ' +
        'good for narrowing a handset down, and it is not authoritative for a chargesheet.</p>' +
        '<div class="grid c2" style="margin-top:12px">' +
          '<div class="stat"><div style="font-weight:640">For a citable answer</div>' +
          '<div class="small muted" style="margin-top:5px">SMS <code class="inl">KYM &lt;15-digit IMEI&gt;</code> ' +
          'to <b>14422</b>, or use the CEIR portal. That returns make, model, device type and blacklist ' +
          'status from the official register. It never returns an owner.</div></div>' +
          '<div class="stat"><div style="font-weight:640">Your own list</div>' +
          '<div class="small muted" style="margin-top:5px">If your unit holds a licensed TAC dataset ' +
          '(columns: tac, brand, model), drop it below. Imported rows take priority over the bundled ' +
          'list.</div></div>' +
        "</div>" +
        '<div class="drop" id="tac-drop" style="margin-top:12px"><div class="big"></div>' +
        '<div>Drop a TAC CSV, or <b>browse</b></div></div>' +
        '<div id="tac-status" style="margin-top:12px"></div></div>';


      var TACDB = null;          // an imported list, if the officer supplies one
      var bundled = null;        // the 248k-code list shipped with the toolkit

      /* keys is one string of sorted 8-character TACs, so a plain binary
         search finds a code without parsing a quarter of a million keys
         into a Map first. */
      function lookupBundled(tac) {
        if (!bundled) return null;
        var lo = 0, hi = bundled.n - 1;
        while (lo <= hi) {
          var mid = (lo + hi) >> 1;
          var k = bundled.keys.substr(mid * 8, 8);
          if (k === tac) {
            var d = bundled.d[parseInt(bundled.vals.substr(mid * 4, 4), 36)];
            var bar = d.indexOf("|");
            return { brand: bundled.b[parseInt(d.slice(0, bar), 36)],
                     model: d.slice(bar + 1), source: "bundled" };
          }
          if (k < tac) lo = mid + 1; else hi = mid - 1;
        }
        return null;
      }

      function lookupTAC(tac) {
        if (TACDB && TACDB[tac]) {
          return { brand: TACDB[tac].brand, model: TACDB[tac].model, source: "imported" };
        }
        return lookupBundled(tac);
      }

      function tacStatus(msg, kind) {
        var el = $("#tac-status");
        if (el) el.innerHTML = '<span class="badge ' + (kind || "") + '">' + TK.esc(msg) + "</span>";
      }

      tacStatus("loading device list...", "");
      TK.loadData("tac.js", "TAC_DB", function (d) {
        bundled = d;
        tacStatus(d ? TK.fmtNum(d.n) + " device codes ready" : "device list unavailable",
                  d ? "ok" : "danger");
        if (d && $("#imei-in").value.trim()) go();
      });

      TK.dropzone($("#tac-drop"), function (f) {
        TK.readText(f, function (txt) {
          var p = TK.parseTable(txt);
          var m = TK.mapColumns(p.headers, {
            tac: [/^tac/, /typeallocation/, /^prefix/],
            brand: [/brand/, /manufacturer/, /make/, /vendor/],
            model: [/model/, /name/, /device/]
          });
          if (!m.tac) {
            $("#tac-status").innerHTML = '<div class="note danger" style="margin-top:12px"><b>No TAC column found</b>' +
              '<p class="mono xs">' + TK.esc(p.headers.join(", ")) + "</p></div>";
            return;
          }
          TACDB = {};
          p.rows.forEach(function (r) {
            var k = String(r[m.tac]).replace(/[^\d]/g, "").slice(0, 8);
            if (k.length === 8) TACDB[k] = {
              brand: m.brand ? r[m.brand] : "", model: m.model ? r[m.model] : ""
            };
          });
          $("#tac-status").innerHTML = '<div class="note ok"><b>' +
            TK.fmtNum(Object.keys(TACDB).length) + " codes imported</b>" +
            "<p>These take priority over the bundled list.</p></div>";
          TK.toast("TAC list imported", "ok");
          if ($("#imei-in").value.trim()) go();
        });
      }, { accept: ".csv,.tsv,.txt" });

      // Reporting Body Identifier: first two TAC digits. Stable, published in TS 23.003 / GSMA.
      var RBI = {
        "01": "PTCRB (North America)", "10": "PTCRB (North America)",
        "30": "PTCRB (North America)", "33": "France",
        "35": "BABT / BSI (United Kingdom), the most common issuer worldwide",
        "44": "United Kingdom", "45": "Denmark", "49": "Germany",
        "50": "BZT / CETECOM", "51": "CETECOM (Germany)", "52": "Singapore",
        "53": "Australia / Approvals", "54": "Approvals body",
        "86": "TAF / CTTL (China), very common on China-manufactured handsets",
        "91": "Approvals body (India / regional)", "99": "Manufacturer-assigned / unallocated"
      };

      $("#imei-go").onclick = go;
      $("#imei-fix").onclick = function () {
        var lines = $("#imei-in").value.split(/\n+/).map(function (s) {
          var d = s.replace(/[^\d]/g, "");
          return d.length >= 14 ? d.slice(0, 14) + luhnDigit(d.slice(0, 14)) : s;
        });
        $("#imei-in").value = lines.join("\n");
        go();
        TK.toast("Check digits recomputed", "ok");
      };

      function go() {
        var lines = $("#imei-in").value.split(/[\n,;]+/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!lines.length) return;

        var out = "";
        lines.forEach(function (line) {
          var d = line.replace(/[^\d]/g, "");
          var card = '<div class="card tight"><div class="row" style="margin-bottom:12px">' +
            '<span class="mono" style="font-size:16px;font-weight:600">' + TK.esc(line) + "</span>";

          if (d.length !== 15 && d.length !== 16 && d.length !== 14) {
            card += '<span class="badge danger">' + d.length + " digits, invalid</span></div>" +
              '<p class="small muted" style="margin:0">An IMEI is 15 digits (14 + Luhn check). ' +
              "IMEISV is 16 (14 + 2-digit software version, no check digit). 14 digits is the bare TAC+serial.</p></div>";
            out += card; return;
          }

          var tac = d.slice(0, 8), snr = d.slice(8, 14), last = d.slice(14);
          var isSV = d.length === 16;
          var valid = d.length === 15 ? luhn(d) : null;
          var expect = luhnDigit(d.slice(0, 14));

          card += isSV ? '<span class="badge info">IMEISV (16)</span>'
            : d.length === 14 ? '<span class="badge warn">TAC+serial only (14)</span>'
            : valid ? '<span class="badge ok">Luhn valid</span>'
            : '<span class="badge danger">Luhn FAILS</span>';
          card += "</div>";

          card += '<div style="font-family:var(--mono);font-size:19px;letter-spacing:1.5px;margin-bottom:12px">' +
            '<span style="color:var(--accent)">' + tac + "</span>" +
            '<span style="color:var(--fg-2)">' + snr + "</span>" +
            (last ? '<span style="color:var(--warn)">' + last + "</span>" : "") + "</div>" +
            '<div class="row xs muted" style="gap:18px;margin-bottom:14px">' +
              '<span><b style="color:var(--accent)">▉</b> TAC, model type</span>' +
              '<span><b style="color:var(--fg-2)">▉</b> Serial</span>' +
              (last ? '<span><b style="color:var(--warn)">▉</b> ' + (isSV ? "Software version" : "Check digit") + "</span>" : "") +
            "</div>";

          var rbi = RBI[tac.slice(0, 2)];
          var tacHit = lookupTAC(tac);

          card += '<dl class="kv">' +
            "<dt>TAC</dt><dd>" + tac + "</dd>" +
            "<dt>Reporting body</dt><dd>" + TK.esc(rbi || (tac.slice(0, 2) + ", not in the seed table")) + "</dd>" +
            "<dt>Serial</dt><dd>" + snr + "</dd>" +
            (d.length === 15 ? "<dt>Check digit</dt><dd>" + last +
              (valid ? " (correct)" : ", expected " + expect) + "</dd>" : "") +
            (isSV ? "<dt>Software version</dt><dd>" + last + "</dd>" : "") +
            "<dt>Make / model</dt><dd>" + (tacHit
              ? TK.esc(((tacHit.brand || "") + " " + (tacHit.model || "")).trim()) +
                (tacHit.source === "imported"
                  ? " <span class='badge ok'>your list</span>"
                  : " <span class='badge'>community list</span>")
              : "<span class='muted'>this code is not in the list, check KYM to 14422</span>") + "</dd>" +
          "</dl>";

          if (d.length === 15 && !valid) {
            card += '<div class="note danger" style="margin-top:12px"><b>Checksum failure is itself a finding</b>' +
              "<p>Genuine handsets emit a Luhn-valid IMEI. A failing check digit usually means the number was " +
              "transcribed wrong, or the device has been reflashed with a fabricated IMEI. Rule out transcription " +
              "first, check the seizure memo and the box label, then treat it as tampering under s.66 IT Act " +
              "read with the Telecommunications Act provisions on tampering with identifiers.</p></div>";
          }
          if (/^(\d)\1{13,}$/.test(d.slice(0, 14)) || d.slice(0, 8) === "00000000") {
            card += '<div class="note danger" style="margin-top:12px"><b>Placeholder IMEI</b>' +
              "<p>All-identical or all-zero digits. This is a null value from the dump, not a real device.</p></div>";
          }
          card += "</div>";
          out += card;
        });

        // duplicate detection across the batch
        var seen = {}, dupes = [];
        lines.forEach(function (l) {
          var d = l.replace(/[^\d]/g, "").slice(0, 14);
          if (d.length === 14) { if (seen[d]) dupes.push(d); seen[d] = (seen[d] || 0) + 1; }
        });
        if (dupes.length) {
          out = '<div class="note danger"><b>Duplicate IMEI in this batch</b><p>' +
            TK.esc(dupes.join(", ")) + " appears more than once. Two handsets reporting one IMEI means " +
            "cloning. CEIR treats duplicate-IMEI devices as a distinct category from stolen ones.</p></div>" + out;
        }

        $("#imei-out").innerHTML = out;
      }
    }
  });

  /* ==========================================================
     MAC / OUI Lookup
     ========================================================== */
  TK.reg({
    id: "mac",
    name: "MAC / OUI Lookup",
    cluster: "device",
    tier: 1,
    desc: "Resolve a hardware address to its registered vendor using the full IEEE registry, and spot randomised addresses.",
    lede: "Bundled with the complete IEEE MA-L/MA-M/MA-S registry, 37,000 assignments, offline. " +
          "The more useful answer is often that the address is randomised and identifies nothing.",
    badges: ["IEEE registry", "Offline"],
    legal: {
      authority: "Reference only, the IEEE registry is public.",
      holder: "Which device held an address at a point in time sits in router/DHCP/AP logs, " +
              "which need BNSS s.94 to the operator of that network.",
      caution: "Since iOS 14 and Android 10, phones present a different randomised MAC to every " +
               "SSID by default. A randomised address cannot be tied to a handset or a vendor.",
      evidence: "Record the address exactly as captured, including case and separators, before " +
                "normalising it. The raw form is what the log shows."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">MAC address(es), any separator, one per line</label>' +
          '<textarea id="mac-in" class="mono" placeholder="3C:5A:B4:12:34:56&#10;a4-83-e7-11-22-33&#10;0021.6a12.3456&#10;DA:A1:19:44:55:66"></textarea></div>' +
          '<div class="row"><button class="btn primary" id="mac-go">Look up</button>' +
          '' +
          '<span id="mac-load" class="row tight xs muted"></span></div>' +
        "</div><div id=\"mac-out\"></div>";

      var DB = null;
      $("#mac-load").innerHTML = '<span class="spinner"></span> loading IEEE registry…';
      TK.loadData("oui.js", "OUI_DB", function (d) {
        DB = d;
        $("#mac-load").innerHTML = d
          ? '<span class="badge ok">' + TK.fmtNum(Object.keys(d).length) + " assignments loaded</span>"
          : '<span class="badge danger">registry failed to load</span>';
      });

      $("#mac-go").onclick = go;

      function go() {
        if (!DB) { TK.toast("Registry still loading", "danger"); return; }
        var lines = $("#mac-in").value.split(/[\n,;]+/).map(function (s) { return s.trim(); }).filter(Boolean);
        var out = "";

        lines.forEach(function (line) {
          var hex = line.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
          var card = '<div class="card tight"><div class="row" style="margin-bottom:11px">' +
            '<span class="mono" style="font-size:16px;font-weight:600">' + TK.esc(line) + "</span>";

          if (hex.length !== 12) {
            card += '<span class="badge danger">' + hex.length + " hex digits, need 12</span></div>" +
              '<p class="small muted" style="margin:0">EUI-48 addresses are 48 bits = 12 hex digits. ' +
              (hex.length === 16 ? "16 digits is an EUI-64 / interface identifier." : "") + "</p></div>";
            out += card; return;
          }

          var b0 = parseInt(hex.slice(0, 2), 16);
          var multicast = !!(b0 & 0x01);
          var local = !!(b0 & 0x02);

          // longest-prefix match: MA-S (9) -> MA-M (7) -> MA-L (6)
          var vendor = null, matched = "", reg = "MA-L";
          [9, 7, 6].forEach(function (n) {
            if (vendor) return;
            var k = hex.slice(0, n);
            if (DB[k]) {
              var v = DB[k].split("␟");
              vendor = v[0]; reg = v[1] || "MA-L"; matched = k;
            }
          });

          card += multicast ? '<span class="badge info">Multicast</span>' : '<span class="badge">Unicast</span>';
          card += local ? '<span class="badge warn">Locally administered</span>' : '<span class="badge ok">Globally unique</span>';
          card += "</div>";

          var canon = hex.match(/./g).join(":");
          card += '<div style="font-family:var(--mono);font-size:19px;letter-spacing:1px;margin-bottom:14px">' +
            '<span style="color:var(--accent)">' + (matched ? hex.slice(0, matched.length).match(/./g).join(":") : hex.slice(0, 6).match(/./g).join(":")) + "</span>" +
            '<span style="color:var(--fg-2)">:' + (matched ? hex.slice(matched.length) : hex.slice(6)).match(/./g).join(":") + "</span></div>";

          card += '<dl class="kv">' +
            "<dt>Normalised</dt><dd>" + canon + "</dd>" +
            "<dt>Vendor</dt><dd>" + (vendor ? TK.esc(vendor) : "<span class='muted'>not in the IEEE registry</span>") + "</dd>" +
            (vendor ? "<dt>Block type</dt><dd>" + TK.esc(reg) +
              (reg === "MA-M" ? " (28-bit, vendor shares the OUI)" :
               reg === "MA-S" ? " (36-bit, small assignment)" : " (24-bit OUI)") + "</dd>" : "") +
            "<dt>I/G bit</dt><dd>" + (multicast ? "1, group / multicast frame" : "0, individual address") + "</dd>" +
            "<dt>U/L bit</dt><dd>" + (local ? "1, locally administered" : "0, universally administered (burned in)") + "</dd>" +
          "</dl>";

          if (local && !multicast) {
            card += '<div class="note warn" style="margin-top:12px"><b>Almost certainly a randomised address</b>' +
              "<p>The locally-administered bit is set, so this was not assigned by IEEE to any vendor. " +
              "iOS 14+ and Android 10+ generate a fresh random MAC per network by default, and rotate it. " +
              "This address identifies a session, not a device, and the same handset will appear under a " +
              "different address on the next network. Do not attribute it to a manufacturer.</p></div>";
          }
          if (multicast) {
            card += '<div class="note info" style="margin-top:12px"><b>Not a device address</b>' +
              "<p>" + (hex === "FFFFFFFFFFFF" ? "This is the broadcast address."
                : hex.slice(0, 6) === "01005E" ? "IPv4 multicast mapping, typically mDNS/SSDP discovery traffic."
                : hex.slice(0, 4) === "3333" ? "IPv6 multicast mapping."
                : "The group bit is set, so this is a multicast destination.") +
              " It is a destination in the capture, not an endpoint you can trace.</p></div>";
          }
          card += "</div>";
          out += card;
        });
        $("#mac-out").innerHTML = out;
      }
    }
  });

  /* ==========================================================
     CEIR workflow
     ========================================================== */
  TK.reg({
    id: "ceir",
    name: "CEIR Request Builder",
    cluster: "device",
    tier: 3,
    desc: "The blocking / unblocking / tracing workflow for a stolen or suspect handset, and the request text.",
    lede: "There is no public API behind CEIR and you should not build one. What this does is get " +
          "the request right first time, and stop the citizen-facing check being mistaken for a police result.",
    legal: {
      authority: "Blocking and tracing are routed through the State Police nodal officer to DoT / CEIR. " +
                 "IMEI-IMSI pairing from the operators is BNSS 2023 s.94.",
      threshold: "Per state SOP; commonly SP / DCP countersignature for tracing.",
      holder: "DoT (CEIR) for blacklist status; access providers for the pairing and location.",
      caution: "The citizen KYM check via 14422 is OTP-gated and returns make, model and status only. " +
               "Automating or proxying it is not appropriate and gives you nothing an investigator needs.",
      evidence: "Blocking a handset ends its evidentiary usefulness, it stops generating CDR. Decide " +
                "deliberately whether you want it traced or silenced. You rarely get both."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="note warn"><b>Two different things called "CEIR"</b>' +
        "<p><b>The citizen portal</b> lets a victim report a lost handset and get it blocked, and lets anyone " +
        "check make/model/blacklist status by SMS to 14422. <b>The police channel</b> is a separate authenticated " +
        "route through your state nodal officer for tracing. Only the second one answers <i>which SIM is in " +
        "that handset now</i>, and it is not something a browser tool can reach.</p></div>" +

        '<div class="card"><h3>Which route do you need?</h3><div class="grid c3">' +
          ['{"t":"Victim wants it blocked","d":"Citizen files on the CEIR portal with the FIR copy and the purchase invoice. Blocks it across all Indian networks. Do this only when you have decided you do not need the device generating traffic.","k":"warn"}',
           '{"t":"You need the current SIM","d":"IMEI tracing request through the State Police nodal officer. The operators return the IMSI/MSISDN seen against that IMEI, with cell location. This is the one that actually advances the investigation.","k":"accent"}',
           '{"t":"You have the handset","d":"No CEIR needed. Dial *#06# or read the label under the battery / on the SIM tray, and record it in the seizure memo with a photograph before the device is switched off.","k":"ok"}'
          ].map(function (j) {
            var o = JSON.parse(j);
            return '<div class="stat ' + o.k + '"><div style="font-weight:640;font-size:14px">' + TK.esc(o.t) +
              '</div><div class="small muted" style="margin-top:6px;line-height:1.5">' + TK.esc(o.d) + "</div></div>";
          }).join("") + "</div></div>" +

        '<div class="card"><h3>Build the tracing request</h3>' +
          '<div class="grid c2">' +
            '<div class="field"><label class="lbl">IMEI(s), one per line</label><textarea id="ceir-imei" class="mono" style="min-height:70px" placeholder="358240051111110"></textarea></div>' +
            '<div><div class="field"><label class="lbl">FIR / case number</label><input type="text" id="ceir-fir" placeholder="FIR 0123/2026"></div>' +
            '<div class="field"><label class="lbl">Sections</label><input type="text" id="ceir-sec" placeholder="BNS s.318(4), IT Act s.66D"></div></div>' +
          "</div>" +
          '<div class="grid c2">' +
            '<div class="field"><label class="lbl">Period from</label><input type="text" id="ceir-from" placeholder="01-01-2026"></div>' +
            '<div class="field"><label class="lbl">Period to</label><input type="text" id="ceir-to" placeholder="31-03-2026"></div>' +
          "</div>" +
          '<button class="btn primary" id="ceir-go">Generate</button>' +
          '<div id="ceir-out" style="margin-top:14px"></div></div>';

      $("#ceir-go").onclick = function () {
        var imeis = $("#ceir-imei").value.split(/[\n,;]+/).map(function (s) { return s.replace(/[^\d]/g, ""); }).filter(Boolean);
        if (!imeis.length) { TK.toast("Enter at least one IMEI", "danger"); return; }
        var bad = imeis.filter(function (i) { return i.length !== 15 || !luhn(i); });

        var fir = $("#ceir-fir").value || "[FIR No. ____ / 20__]";
        var sec = $("#ceir-sec").value || "[sections]";
        var from = $("#ceir-from").value || "[DD-MM-YYYY]";
        var to = $("#ceir-to").value || "[DD-MM-YYYY]";

        var txt =
"To,\n" +
"    The Nodal Officer (Law Enforcement),\n" +
"    [Access Provider], [Licensed Service Area]\n\n" +
"Subject: Requisition under section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023 -\n" +
"         IMEI tracing in " + fir + "\n\n" +
"Sir/Madam,\n\n" +
"    A case vide " + fir + " under " + sec + " is under investigation by the undersigned.\n" +
"The handset(s) bearing the following International Mobile Equipment Identity number(s)\n" +
"are material to the investigation:\n\n" +
imeis.map(function (i, n) { return "    " + (n + 1) + ". " + i; }).join("\n") + "\n\n" +
"    You are required to furnish, for the period " + from + " to " + to + ":\n\n" +
"    (a) every IMSI and MSISDN observed in use against the above IMEI number(s), with the\n" +
"        first and last date and time of each such pairing;\n" +
"    (b) the Customer Acquisition Form and KYC documents for each MSISDN so identified;\n" +
"    (c) the cell global identity, site name and site address for the first and last activity\n" +
"        of each pairing, with latitude and longitude and azimuth of the serving sector;\n" +
"    (d) the current status of each such connection; and\n" +
"    (e) a certificate under section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 in respect\n" +
"        of every electronic record produced, in the form prescribed in the Schedule.\n\n" +
"    The information is required for the purposes of investigation and is not to be disclosed\n" +
"to the subscriber(s) concerned. Kindly furnish the same within [__] days.\n\n" +
"                                                        Yours faithfully,\n\n" +
"                                                        [Name, rank]\n" +
"                                                        Investigating Officer\n" +
"                                                        [Police Station, District]";

        $("#ceir-out").innerHTML =
          (bad.length ? '<div class="note danger"><b>' + bad.length + " IMEI(s) fail validation</b><p class='mono xs'>" +
            TK.esc(bad.join(", ")) + "</p><p>Fix these before the notice goes out, an operator will return " +
            "nil against a malformed IMEI and you will lose weeks.</p></div>" : "") +
          '<div class="copyable"><pre class="out doc">' + TK.esc(txt) + "</pre>" +
          '<button class="btn sm copybtn" data-copy="prev">Copy</button></div>' +
          '<div class="row" style="margin-top:10px"><button class="btn sm" id="ceir-dl">Download .txt</button></div>';

        $("#ceir-dl").onclick = function () {
          TK.download("ceir-imei-requisition.txt", txt, "text/plain");
        };
      };
    }
  });
})();
