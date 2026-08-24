/* ============================================================
   Cluster: Money trail - "Where did the money go?"
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* ==========================================================
     IFSC Lookup
     ========================================================== */
  TK.reg({
    id: "ifsc",
    name: "IFSC Lookup",
    cluster: "money",
    tier: 1,
    desc: "Find the bank and branch behind an IFSC code, offline.",
    lede: "All 183,000 RBI branches are bundled, so bank, branch and district resolve with no " +
          "network. The full postal address is fetched live when there is one.",
    badges: ["RBI master"],
    legal: {
      authority: "Reference only. IFSC codes are public.",
      holder: "Account holder identity is with the bank. BNSS 2023 s.94, and ask for the Bankers' " +
              "Books Evidence Act s.2A certificate in the same notice.",
      caution: "The branch in an IFSC is where the account was opened, not where the holder lives " +
               "and not where the fraud happened. Mule accounts are routinely opened far from the operator.",
      evidence: "Banks retain records for five years or more under PMLA obligations, much longer " +
                "than telecom. The money trail usually outlives the phone trail."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">IFSC code(s), one per line</label>' +
          '<textarea id="ifsc-in" class="mono" style="min-height:80px" placeholder="SBIN0000001&#10;HDFC0000123"></textarea></div>' +
          '<div class="row"><button class="btn primary" id="ifsc-go">Look up</button>' +
          '<span id="ifsc-dbstat" class="xs muted"></span>' +
          '' +
          '<label class="check"><input type="checkbox" id="ifsc-net" checked> Query the live RBI branch record</label></div>' +
        "</div><div id=\"ifsc-out\"></div>" +
        '<div class="card"><h3>Bank codes held offline</h3>' +
        '<p class="small muted">First four characters of any IFSC. The fifth is always 0 (reserved); the ' +
        'last six identify the branch.</p><div id="ifsc-banks"></div></div>';

      TK.fileInto("#ifsc-in", { extract: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g, onLoad: function () { var b = TK.$("#ifsc-go"); if (b) b.click(); } });

      $("#ifsc-go").onclick = go;

      var DB = null;

      /* keys is one sorted string of 11-character codes, so a binary search
         resolves a branch without parsing 183,000 keys into a Map. */
      function lookup(code) {
        if (!DB) return null;
        var lo = 0, hi = DB.n - 1;
        while (lo <= hi) {
          var mid = (lo + hi) >> 1;
          var k = DB.keys.substr(mid * 11, 11);
          if (k === code) {
            var f = DB.vals[mid].split(String.fromCharCode(31));
            return {
              bank: DB.bank[parseInt(f[0], 36)] || "",
              branch: f[1] || "",
              centre: DB.place[parseInt(f[2], 36)] || "",
              district: DB.place[parseInt(f[3], 36)] || "",
              state: DB.state[parseInt(f[4], 36)] || "",
              micr: f[5] || ""
            };
          }
          if (k < code) lo = mid + 1; else hi = mid - 1;
        }
        return null;
      }

      function dbStatus(msg, kind) {
        var el = $("#ifsc-dbstat");
        if (el) el.innerHTML = '<span class="badge ' + (kind || "") + '">' + esc(msg) + "</span>";
      }

      dbStatus("loading branch directory...", "");
      TK.loadData("ifsc.js", "IFSC_DB", function (d) {
        DB = d;
        dbStatus(d ? TK.fmtNum(d.n) + " branches ready, offline" : "branch directory unavailable",
                 d ? "ok" : "danger");
        if (d && $("#ifsc-in").value.trim()) go();
      });

      function go() {
        var codes = $("#ifsc-in").value.split(/[\s,;]+/).map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean);
        if (!codes.length) return;
        var useNet = $("#ifsc-net").checked;
        var out = codes.map(function (c) {
          var valid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(c);
          var bank = IFSC_BANKS[c.slice(0, 4)];
          var hit = valid ? lookup(c) : null;
          return '<div class="card tight" id="ifsc-' + esc(c.replace(/[^A-Z0-9]/g, "")) + '">' +
            '<div class="row" style="margin-bottom:11px">' +
            '<span class="mono" style="font-size:16px;font-weight:600">' + esc(c) + "</span>" +
            '<span class="badge ' + (valid ? "ok" : "danger") + '">' +
            (valid ? "Well-formed" : "Malformed") + "</span>" +
            (hit ? '<span class="badge ok">found offline</span>' : "") +
            (bank ? '<span class="badge accent">' + esc(bank) + "</span>" : "") + "</div>" +
            (valid ? '<div style="font-family:var(--mono);font-size:18px;letter-spacing:1.5px;margin-bottom:12px">' +
              '<span style="color:var(--accent)">' + c.slice(0, 4) + "</span>" +
              '<span style="color:var(--fg-3)">' + c[4] + "</span>" +
              '<span style="color:var(--fg-2)">' + c.slice(5) + "</span></div>" +
              '<div class="row xs muted" style="gap:18px;margin-bottom:12px">' +
              '<span><b style="color:var(--accent)">▉</b> bank</span>' +
              '<span><b style="color:var(--fg-3)">▉</b> reserved 0</span>' +
              '<span><b style="color:var(--fg-2)">▉</b> branch</span></div>'
              : '<p class="small muted">An IFSC is 11 characters: four letters (bank), a zero, then six ' +
                "alphanumerics (branch).</p>") +
            '<dl class="kv"><dt>Bank</dt><dd>' +
              esc((hit && hit.bank) || bank || "not in the directory") + "</dd>" +
            (hit ? "<dt>Branch</dt><dd>" + esc(hit.branch) + "</dd>" +
                   "<dt>Centre</dt><dd>" + esc(hit.centre) + "</dd>" +
                   "<dt>District</dt><dd>" + esc(hit.district) + "</dd>" +
                   "<dt>State</dt><dd>" + esc(hit.state) + "</dd>" +
                   (hit.micr ? "<dt>MICR</dt><dd>" + esc(hit.micr) + "</dd>" : "")
                 : "") +
            "<dt>Branch code</dt><dd>" + (valid ? c.slice(5) : "-") + "</dd></dl>" +
            '<div class="branch-slot" style="margin-top:10px"></div></div>';
        }).join("");

        $("#ifsc-out").innerHTML = out;

        if (!useNet) return;
        codes.forEach(function (c) {
          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(c)) return;
          var card = $("#ifsc-" + c.replace(/[^A-Z0-9]/g, ""));
          if (!card) return;
          var slot = card.querySelector(".branch-slot");
          slot.innerHTML = '<span class="row tight xs muted"><span class="spinner"></span> querying branch record…</span>';
          fetch("https://ifsc.razorpay.com/" + encodeURIComponent(c))
            .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
            .then(function (d) {
              slot.innerHTML = '<div class="note ok"><b>Full record from the live directory</b><dl class="kv" style="margin-top:6px">' +
                ["BANK", "BRANCH", "CENTRE", "DISTRICT", "STATE", "ADDRESS", "CONTACT", "MICR", "SWIFT"]
                  .filter(function (k) { return d[k]; })
                  .map(function (k) { return "<dt>" + k.charAt(0) + k.slice(1).toLowerCase() + "</dt><dd>" + esc(d[k]) + "</dd>"; })
                  .join("") +
                ["UPI", "NEFT", "RTGS", "IMPS"].map(function (k) {
                  return "<dt>" + k + "</dt><dd>" + (d[k] ? "enabled" : "not enabled") + "</dd>";
                }).join("") +
                "</dl></div>";
            })
            .catch(function (e) {
              slot.innerHTML = '<div class="note warn"><b>Live lookup unavailable</b>' +
                "<p>" + (e === 404 ? "The public branch directory has no record for this code, check it against the " +
                  "cheque leaf or the bank's own confirmation." :
                  "No network, or the browser blocked the cross-origin request (common when this page is opened " +
                  "directly from disk). Everything above came from the bundled directory and is unaffected. " +
                  "Only the postal address needs a connection.") + "</p></div>";
            });
        });
      }

      TK.table($("#ifsc-banks"), Object.keys(IFSC_BANKS).map(function (k) {
        return { code: k, bank: IFSC_BANKS[k] };
      }), [
        { k: "code", label: "Code", cls: "mono" },
        { k: "bank", label: "Bank" }
      ], { pageSize: 60, filename: "ifsc-bank-codes" });
    }
  });

  /* ==========================================================
     UPI Handle Resolver
     ========================================================== */
  TK.reg({
    id: "upi",
    name: "UPI Handle Resolver",
    cluster: "money",
    tier: 1,
    desc: "Resolve a UPI ID to its payment service provider bank and the app behind it.",
    lede: "A UPI ID is not an identity. The part after the @ names the bank you serve notice on. " +
          "That bank holds the real account behind the ID.",
    legal: {
      authority: "BNSS 2023 s.94 to the PSP bank and to the beneficiary bank.",
      holder: "PSP bank holds the handle-to-account mapping; the beneficiary bank holds the KYC; " +
              "NPCI holds switch-level records.",
      caution: "Resolve every hop: handle → PSP → underlying account → KYC → onward transfers. Skipping " +
               "a hop produces an attribution you cannot defend in cross-examination.",
      evidence: "The UTR / RRN is the join key across banks. Collect it for every leg or the trail breaks " +
                "at the first bank boundary."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">UPI ID(s), one per line</label>' +
          '<textarea id="upi-in" class="mono" placeholder="9876543210@ybl&#10;name.surname@okhdfcbank"></textarea></div>' +
          '<div class="row"><button class="btn primary" id="upi-go">Resolve</button>' +
          '</div>' +
        "</div><div id=\"upi-out\"></div>" +
        '<div class="card"><h3>Handle directory</h3><div id="upi-tbl"></div></div>';

      TK.fileInto("#upi-in", { extract: /\b[A-Za-z0-9.\-_]{2,}@[A-Za-z]{2,}\b/g, onLoad: function () { var b = TK.$("#upi-go"); if (b) b.click(); } });

      $("#upi-go").onclick = go;

      function go() {
        var ids = $("#upi-in").value.split(/[\s,;]+/).map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
        if (!ids.length) return;
        var out = ids.map(function (id) {
          var parts = id.split("@");
          var addr = parts[0], handle = parts[1] || "";
          var hit = UPI_HANDLES[handle];
          var isPhone = /^\d{10}$/.test(addr) || /^\+?91\d{10}$/.test(addr);

          return '<div class="card tight"><div class="row" style="margin-bottom:11px">' +
            '<span class="mono" style="font-size:16px;font-weight:600">' + esc(id) + "</span>" +
            (parts.length !== 2 ? '<span class="badge danger">Not a valid UPI ID</span>'
              : hit ? '<span class="badge ok">PSP resolved</span>'
              : '<span class="badge warn">Handle not in directory</span>') + "</div>" +
            (parts.length === 2 ? '<dl class="kv">' +
              "<dt>Address part</dt><dd>" + esc(addr) +
                (isPhone ? " &nbsp;<span class='badge accent'>a mobile number</span>" : "") + "</dd>" +
              "<dt>Handle</dt><dd>@" + esc(handle) + "</dd>" +
              "<dt>PSP bank</dt><dd>" + esc(hit ? hit.psp : "unknown, check the NPCI PSP list") + "</dd>" +
              "<dt>App</dt><dd>" + esc(hit ? hit.app : "unknown") + "</dd>" +
              "<dt>Serve notice on</dt><dd>" + esc(hit ? hit.psp + " (PSP), and the beneficiary bank once the " +
                "underlying account is identified" : "identify the PSP from NPCI first") + "</dd></dl>"
              : '<p class="small muted">A UPI ID has the form <code class="inl">address@handle</code>.</p>') +
            (isPhone ? '<div class="note accent" style="margin-top:11px"><b>The address is a mobile number</b>' +
              "<p>That number is very likely the account's registered mobile. Run it through Number " +
              "Intelligence and requisition its CAF and CDR, this is the shortest bridge between the money " +
              "side and the phone side of the case.</p></div>" : "") +
            "</div>";
        }).join("");

        var phones = ids.map(function (i) { return i.split("@")[0]; })
          .filter(function (a) { return /^\d{10}$/.test(a); });
        if (phones.length) {
          out += '<div class="note info"><b>Numbers to pursue</b><p class="mono">' +
            esc(phones.join(", ")) + "</p></div>";
        }
        $("#upi-out").innerHTML = out;
      }

      TK.table($("#upi-tbl"), Object.keys(UPI_HANDLES).map(function (k) {
        return { h: "@" + k, psp: UPI_HANDLES[k].psp, app: UPI_HANDLES[k].app };
      }), [
        { k: "h", label: "Handle", cls: "mono" },
        { k: "psp", label: "PSP bank" },
        { k: "app", label: "App" }
      ], { pageSize: 60, filename: "upi-handles" });
    }
  });

  /* ==========================================================
     Transaction Trail Analyser
     ========================================================== */
  TK.reg({
    id: "trail",
    name: "Transaction Trail Analyser",
    cluster: "money",
    tier: 2,
    desc: "Parse a bank or wallet statement and surface layering, mule behaviour and beneficiary concentration.",
    lede: "Mule accounts have a shape. Money arrives, then within minutes it leaves in several smaller " +
          "pieces to different people. The balance drops back to almost nothing. That shape can be " +
          "found by arithmetic.",
    wide: true,
    legal: {
      authority: "BNSS 2023 s.94 to the bank. Certified copies are admissible under the Bankers' Books " +
                 "Evidence Act 1891, s.2A certificate for printouts, s.4 for certified copies.",
      threshold: "Investigating officer may issue. Freezing or attaching needs the appropriate order " +
                 "(BNSS s.106/107 for seizure and attachment of proceeds of crime).",
      holder: "The account-holding bank; switch records with NPCI for UPI legs.",
      retention: "Five years minimum under PMLA record-keeping obligations, longer for some categories.",
      caution: "Request the s.2A certificate WITH the statement. A bare PDF e-mailed by a branch manager " +
               "is not self-proving and will be challenged.",
      evidence: "Also ask for the beneficiary's KYC, registered mobile, and the IP and device that operated " +
                "net banking, not just the statement."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card"><div class="drop" id="tr-drop"><div class="big">↓</div>' +
        "<div>Drop a bank or wallet statement (CSV / TSV), or <b>browse</b></div>" +
        '<div class="xs muted" style="margin-top:8px">Parsed locally. Nothing is uploaded.</div></div>' +
        '<div class="row" style="margin-top:12px"></div>' +
        '<div class="row" style="margin-top:10px">' +
          '<div class="field" style="margin:0"><label class="lbl">Layering window (minutes)</label>' +
          '<input type="number" id="tr-win" value="60" min="1" max="1440" style="width:110px"></div>' +
          '<div class="field" style="margin:0"><label class="lbl">Large-value threshold (₹)</label>' +
          '<input type="number" id="tr-big" value="50000" min="0" style="width:150px"></div>' +
        "</div></div><div id=\"tr-out\"></div>";

      TK.dropzone($("#tr-drop"), function (f) { TK.readText(f, function (x) { process(x); }); }, { accept: ".csv,.tsv,.txt" });

      function money(v) {
        if (v === null || v === undefined) return 0;
        var s = String(v).replace(/[₹,\s]/g, "").replace(/\((.*)\)/, "-$1");
        var n = parseFloat(s);
        return isNaN(n) ? 0 : n;
      }
      function inr(n) {
        return "₹" + (Math.round(n * 100) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 });
      }

      var lastBank = null;

      function process(text, override) {
        if (text) lastBank = text;
        var ps = TK.parseSmart(lastBank, TK.SPEC.bank);
        var p = ps.p, sm = ps.sm;
        if (!p.rows.length) { $("#tr-out").innerHTML = '<div class="note danger"><b>No rows found</b></div>'; return; }

        var m = override || sm.map;

        var win = (+$("#tr-win").value || 60) * 60000;
        var bigT = +$("#tr-big").value || 50000;

        var bOrder = m.date
          ? TK.detectDateOrder(p.rows.map(function (r) { return r[m.date]; }))
          : { order: "dmy", certain: true };

        var recs = p.rows.map(function (r, i) {
          var dr = m.debit ? money(r[m.debit]) : 0;
          var cr = m.credit ? money(r[m.credit]) : 0;
          if (!m.debit && !m.credit && m.amount) {
            var a = money(r[m.amount]);
            var t = (m.type ? String(r[m.type]) : "").toUpperCase();
            if (/^(D|DR|DEBIT|W)/.test(t) || a < 0) dr = Math.abs(a); else cr = Math.abs(a);
          }
          var narr = m.narr ? String(r[m.narr]) : "";
          // counterparty: UPI/IMPS/NEFT narrations embed it
          var cp = "";
          var um = narr.match(/([\w.\-]{2,}@[a-z]{2,})/i);
          if (um) cp = um[1];
          else {
            var nm = narr.match(/(?:UPI|IMPS|NEFT|RTGS|TRF|TO|FROM)[\/\-\s:]+([A-Za-z0-9 .&_-]{3,40})/i);
            if (nm) cp = nm[1].trim();
          }
          return {
            i: i,
            dt: m.date ? TK.parseDate(r[m.date], bOrder.order) : null,
            narr: narr,
            ref: m.ref ? String(r[m.ref]) : "",
            dr: dr, cr: cr,
            bal: m.bal ? money(r[m.bal]) : null,
            cp: cp || "(not parsed from narration)"
          };
        });

        var dated = recs.filter(function (r) { return r.dt; }).sort(function (a, b) { return a.dt - b.dt; });
        var totalIn = recs.reduce(function (s, r) { return s + r.cr; }, 0);
        var totalOut = recs.reduce(function (s, r) { return s + r.dr; }, 0);

        /* ---- layering: a credit followed by debits within the window ---- */
        var layers = [];
        dated.forEach(function (c, idx) {
          if (c.cr <= 0) return;
          var outs = [], sum = 0;
          for (var j = idx + 1; j < dated.length; j++) {
            if (dated[j].dt - c.dt > win) break;
            if (dated[j].dr > 0) { outs.push(dated[j]); sum += dated[j].dr; }
          }
          if (outs.length >= 2 && sum >= c.cr * 0.6) {
            layers.push({ credit: c, outs: outs, sum: sum, pct: c.cr ? (100 * sum / c.cr) : 0 });
          }
        });

        /* ---- counterparty rollup ---- */
        var cps = {};
        recs.forEach(function (r) {
          var e = cps[r.cp] || (cps[r.cp] = { cp: r.cp, inN: 0, outN: 0, inAmt: 0, outAmt: 0 });
          if (r.cr > 0) { e.inN++; e.inAmt += r.cr; }
          if (r.dr > 0) { e.outN++; e.outAmt += r.dr; }
        });
        var cpList = Object.keys(cps).map(function (k) { return cps[k]; })
          .sort(function (a, b) { return (b.inAmt + b.outAmt) - (a.inAmt + a.outAmt); });

        /* ---- other markers ---- */
        var round = recs.filter(function (r) {
          var a = r.dr || r.cr;
          return a >= 10000 && a % 1000 === 0;
        });
        var big = recs.filter(function (r) { return (r.dr || r.cr) >= bigT; });
        var lowBal = m.bal ? dated.filter(function (r) { return r.bal !== null && r.bal < 100; }).length : 0;
        var night = dated.filter(function (r) { return r.dt.getHours() < 6; });

        var out = "";
        out += '<div class="note ' + (p.meta.preamble.length ? "warn" : "ok") + '"><b>Parse report</b>' +
          "<p>" + TK.fmtNum(recs.length) + " transactions. Delimiter <code class='inl'>" +
          esc(p.meta.delim) + "</code>, header on line " + p.meta.headerRow + ".</p>" +
          (p.meta.preamble.length ? "<p class='xs mono muted'>Skipped: " +
            esc(p.meta.preamble.join(" ⏎ ").slice(0, 250)) + "</p>" : "") + "</div>";

        if (!m.date) out += '<div class="note danger"><b>No date column recognised</b><p>Timing analysis ' +
          "is disabled. Headers: <span class='mono xs'>" + esc(p.headers.join(" · ")) + "</span></p></div>";

        out += '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(TK.fmtNum(recs.length), "Transactions") +
          TK.stat(inr(totalIn), "Total credited", "ok") +
          TK.stat(inr(totalOut), "Total debited", "danger") +
          TK.stat(layers.length, "Layering events", layers.length ? "danger" : "ok") +
        "</div>";

        // mule scoring
        var muleSignals = [];
        if (layers.length) muleSignals.push(layers.length + " credit-then-rapid-dispersal sequences");
        if (totalIn > 0 && Math.abs(totalIn - totalOut) / totalIn < 0.1)
          muleSignals.push("in and out are within 10%, the account is a conduit, not a store");
        if (lowBal > recs.length * 0.2) muleSignals.push("balance returns to near zero repeatedly");
        if (round.length > recs.length * 0.4) muleSignals.push("most amounts are round thousands");
        if (cpList.length > 8 && recs.length < 120) muleSignals.push("many counterparties for a low transaction count");

        if (muleSignals.length >= 2) {
          out += '<div class="note danger"><b>This account behaves like a mule account</b><ul style="margin:6px 0 0 18px">' +
            muleSignals.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" +
            "<p style='margin-top:8px'>Requisition the KYC, the account-opening branch and officer, the " +
            "registered mobile and e-mail, the device and IP that operated net banking, and the onward " +
            "beneficiaries. Consider a hold through the 1930 / NCRP channel if the money may still be recoverable.</p></div>";
        } else if (muleSignals.length === 1) {
          out += '<div class="note warn"><b>One mule indicator present</b><p>' + esc(muleSignals[0]) +
            ". Not conclusive on its own.</p></div>";
        }

        if (layers.length) {
          out += '<div class="card"><h3>Layering sequences</h3>' +
            '<p class="small muted">A credit followed, within ' + ($("#tr-win").value) +
            " minutes, by two or more debits accounting for most of it. This is the core movement pattern " +
            "in a fraud chain, the money is being split and pushed onward before it can be held.</p>" +
            '<div class="rail">' + layers.slice(0, 20).map(function (L) {
              return '<div class="rail-item danger">' +
                '<div class="row tight"><b class="mono">' + esc(TK.fmtDate(L.credit.dt)) + "</b>" +
                '<span class="badge ok">IN ' + esc(inr(L.credit.cr)) + "</span>" +
                '<span class="badge danger">OUT ' + esc(inr(L.sum)) + " in " + L.outs.length + " transfers</span>" +
                '<span class="badge">' + L.pct.toFixed(0) + "% dispersed</span></div>" +
                '<div class="xs muted" style="margin-top:5px">from <b>' + esc(L.credit.cp) + "</b> → " +
                esc(L.outs.map(function (o) { return o.cp + " " + inr(o.dr); }).join(" · ")) + "</div>" +
                '<div class="xs muted mono" style="margin-top:2px">gap to first outflow: ' +
                TK.fmtDur((L.outs[0].dt - L.credit.dt) / 1000) + "</div></div>";
            }).join("") + "</div></div>";
        }

        out += '<div class="card"><h3>Counterparties</h3>' +
          '<p class="small muted">Parsed out of the narration field, which is inconsistent across banks, ' +
          "treat unresolved rows as needing a manual read, not as absent. Every UPI handle here should go " +
          "through the UPI Handle Resolver.</p><div id=\"tr-cp\"></div></div>";

        if (night.length) {
          out += '<div class="note warn"><b>' + night.length + " transaction(s) between midnight and 06:00</b>" +
            "<p>Overnight activity on a personal account is worth putting to the account holder, mule " +
            "accounts are commonly operated remotely, at whatever hour the handler is working.</p></div>";
        }

        out += '<div class="card"><h3>All transactions</h3><div id="tr-all"></div></div>';


        $("#tr-out").innerHTML = out;

        TK.mappingPanel($("#tr-out"), {
          headers: p.headers, spec: TK.SPEC.bank,
          result: override ? TK.appliedMap(sm, override) : sm,
          labels: TK.LABELS,
          onApply: function (next) { process(null, next); }
        });

        TK.table($("#tr-cp"), cpList, [
          { k: "cp", label: "Counterparty (from narration)" },
          { k: "inN", label: "Credits", cls: "num" },
          { k: "inAmt", label: "Received", cls: "num", fmt: function (v) { return v ? esc(inr(v)) : ""; } },
          { k: "outN", label: "Debits", cls: "num" },
          { k: "outAmt", label: "Sent", cls: "num", fmt: function (v) { return v ? esc(inr(v)) : ""; } }
        ], { filename: "counterparties", sort: "outAmt", dir: -1 });

        TK.table($("#tr-all"), recs, [
          { k: "dt", label: "Date", cls: "mono", fmt: function (v) { return esc(TK.fmtDate(v)); } },
          { k: "narr", label: "Narration", w: "260px" },
          { k: "ref", label: "UTR / Ref", cls: "mono" },
          { k: "cr", label: "Credit", cls: "num", fmt: function (v) {
              return v ? '<span style="color:var(--ok)">' + esc(inr(v)) + "</span>" : ""; } },
          { k: "dr", label: "Debit", cls: "num", fmt: function (v) {
              return v ? '<span style="color:var(--danger)">' + esc(inr(v)) + "</span>" : ""; } },
          { k: "bal", label: "Balance", cls: "num", fmt: function (v) { return v === null ? "" : esc(inr(v)); } }
        ], { filename: "transactions", pageSize: 300,
             rowClass: function (r) { return (r.dr || r.cr) >= bigT ? "hi" : ""; } });
      }
    }
  });
})();
