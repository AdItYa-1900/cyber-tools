/* ============================================================
   Cluster: Identity resolution - "Who is behind this number?"
   ============================================================ */
(function () {
  "use strict";
  var h = TK.html, raw = TK.raw, $ = TK.$;

  /* ==========================================================
     1. Mobile Number Intelligence
     ========================================================== */
  TK.reg({
    id: "mni",
    name: "Number Intelligence",
    cluster: "identity",
    tier: 1,
    desc: "Validate an Indian MSISDN, decode its structure, and generate every search variant plus the requisition wording.",
    lede: "Takes a phone number in any form it arrives in. It tells you what is " +
          "certain, what is only likely, and what you must ask the " +
          "operator to confirm.",
    badges: ["E.164", "DoT NNP"],
    legal: {
      authority: "Nothing here needs authority, it is arithmetic on the number itself.",
      holder: "Subscriber identity sits with the access provider, not in this tool.",
      caution: "Number series tells you the ORIGINAL allocatee only. After MNP the number may " +
               "live on a completely different network. Never record a series-derived operator " +
               "as the current operator.",
      evidence: "Use the generated variants when searching seized devices, contacts are stored " +
                "in inconsistent formats and a bare 10-digit search misses hits."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">Phone number(s), one per line, any format</label>' +
          '<textarea id="mni-in" class="mono" placeholder="9876543210&#10;+91 98765 43211&#10;0091-9876543212&#10;08765432130"></textarea></div>' +
          '<div class="row"><button class="btn primary" id="mni-go">Analyse</button>' +
          '</div>' +
        "</div><div id=\"mni-out\"></div>";

      $("#mni-go").onclick = run;
      $("#mni-in").addEventListener("keydown", function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run();
      });

      function analyse(input) {
        var raw0 = input.trim();
        var digits = raw0.replace(/[^\d]/g, "");
        var r = { input: raw0, notes: [], ok: false };

        // strip country code / trunk prefix
        var national = digits;
        if (national.slice(0, 4) === "0091") { national = national.slice(4); r.notes.push("Stripped 0091 international prefix"); }
        else if (national.slice(0, 2) === "91" && national.length > 10) { national = national.slice(2); r.notes.push("Stripped 91 country code"); }
        if (national.length === 11 && national[0] === "0") { national = national.slice(1); r.notes.push("Stripped 0 trunk prefix"); }

        r.national = national;
        r.len = national.length;

        // short codes
        if (NNP.shortCodes[digits]) {
          r.kind = "Short code";
          r.detail = NNP.shortCodes[digits];
          r.verdict = "service";
          return r;
        }

        if (r.len !== 10) {
          if (digits.length > 10 && digits.slice(0, 2) !== "91") {
            r.kind = "Not an Indian number";
            r.detail = "Country code " + digits.slice(0, 3) + "…, this is a foreign MSISDN. " +
                       "Records sit with a foreign carrier and need MLAT, not a s.94 notice.";
            r.verdict = "foreign";
          } else {
            r.kind = "Invalid length";
            r.detail = "Indian mobile numbers are exactly 10 digits after the country code. Got " + r.len + ".";
            r.verdict = "bad";
          }
          return r;
        }

        var lvl = national[0];
        if (NNP.mobileLevels.indexOf(lvl) === -1) {
          r.kind = "Not a mobile number";
          r.detail = "Level " + lvl + " is not a mobile access code. Levels 2-5 are fixed-line " +
                     "STD ranges; a landline traces to an exchange and a physical address, " +
                     "which is a different requisition.";
          r.verdict = "fixed";
          return r;
        }

        r.ok = true;
        r.verdict = "ok";
        r.kind = "Valid Indian mobile (level " + lvl + ")";
        r.level = lvl;
        r.series4 = national.slice(0, 4);
        r.series5 = national.slice(0, 5);
        r.e164 = "+91" + national;
        r.variants = [
          national,
          "0" + national,
          "91" + national,
          "+91" + national,
          "0091" + national,
          "+91 " + national.slice(0, 5) + " " + national.slice(5),
          national.slice(0, 5) + "-" + national.slice(5)
        ];
        return r;
      }

      function run() {
        var lines = $("#mni-in").value.split(/[\n,;]+/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!lines.length) { TK.toast("Enter at least one number", "danger"); return; }
        var results = lines.map(analyse);
        var valid = results.filter(function (r) { return r.ok; });

        var out = '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(results.length, "Submitted") +
          TK.stat(valid.length, "Valid mobile", "ok") +
          TK.stat(results.filter(function (r) { return r.verdict === "bad" || r.verdict === "fixed"; }).length, "Rejected", "danger") +
          TK.stat(results.filter(function (r) { return r.verdict === "foreign"; }).length, "Foreign", "warn") +
        "</div>";

        results.forEach(function (r) {
          var kind = r.verdict === "ok" ? "ok" : r.verdict === "foreign" ? "warn" :
                     r.verdict === "service" ? "info" : "danger";
          out += '<div class="card tight"><div class="row" style="margin-bottom:10px">' +
            '<span class="mono" style="font-size:16px;font-weight:600">' + TK.esc(r.input) + "</span>" +
            '<span class="badge ' + kind + '">' + TK.esc(r.kind) + "</span></div>";

          if (!r.ok) {
            out += '<p class="small muted" style="margin:0">' + TK.esc(r.detail || "") + "</p></div>";
            return;
          }

          out += '<dl class="kv">' +
            "<dt>National (10-digit)</dt><dd>" + r.national + "</dd>" +
            "<dt>E.164</dt><dd>" + r.e164 + "</dd>" +
            "<dt>Access level</dt><dd>" + r.level + " &nbsp;<span class='muted'>(mobile)</span></dd>" +
            "<dt>Series (4 / 5)</dt><dd>" + r.series4 + " / " + r.series5 + "</dd>" +
            "<dt>Allocated operator</dt><dd class='muted'>Requires DoT NNP series list, import below, " +
              "then confirm current operator via the TSP</dd>" +
          "</dl>" +
          '<div style="margin-top:12px"><label class="lbl">Search variants for seized-device / database searching</label>' +
          '<div class="copyable"><pre class="out">' + r.variants.join("\n") + "</pre>" +
          '<button class="btn sm copybtn" data-copy="prev">Copy</button></div></div>';
          out += "</div>";
        });

        if (valid.length) {
          out += '<div class="note warn"><b>Before you write "operator: X" in the case diary</b>' +
            "<p>Mobile Number Portability means the allocated series and the serving network diverge " +
            "constantly. The only authoritative answer to <i>who serves this number today</i> comes from " +
            "the operator or the MNP clearing house. Series lookup narrows where to send the notice; " +
            "it does not close the question.</p></div>";

          var nums = valid.map(function (r) { return r.national; });
          out += '<div class="card"><h3>Requisition text</h3>' +
            '<p class="small muted">Paste into your BNSS s.94 notice. Fill the bracketed fields.</p>' +
            '<div class="copyable"><pre class="out doc" id="mni-req">' + TK.esc(
              "In connection with [FIR No. ____ / Case No. ____] under section(s) [____], you are " +
              "required to furnish the following in respect of the mobile number(s) listed below:\n\n" +
              nums.map(function (n) { return "   +91-" + n; }).join("\n") + "\n\n" +
              "1. Customer Acquisition Form (CAF) with all KYC documents relied upon at activation.\n" +
              "2. Date and time of first activation, and the Point of Sale / retailer code and\n" +
              "   the retailer's own KYC and address.\n" +
              "3. Current status (active / disconnected / churned) and, if ported, the donor and\n" +
              "   recipient operator with the date of porting.\n" +
              "4. Alternate contact number and e-mail recorded at the time of activation.\n" +
              "5. All other connections issued against the same identity document.\n" +
              "6. A certificate under section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 in\n" +
              "   respect of every electronic record produced.\n\n" +
              "The information is required for the purposes of investigation. Kindly furnish it\n" +
              "within [__] days to the undersigned."
            ) + "</pre><button class=\"btn sm copybtn\" data-copy=\"prev\">Copy</button></div></div>";
        }

        out += '<div class="card"><h3>Import the DoT numbering series list</h3>' +
          '<p class="small muted">This toolkit deliberately ships <b>no</b> guessed series→operator table: a wrong ' +
          'row produces a wrong attribution in a case file. Import the published DoT National Numbering ' +
          'Plan allocation CSV (columns: series, operator, LSA) and it will resolve here.</p>' +
          '<div class="drop" id="mni-drop"><div class="big">↓</div><div>Drop the NNP allocation CSV, or <b>browse</b></div></div>' +
          '<div id="mni-nnp"></div></div>';

        $("#mni-out").innerHTML = out;

        TK.dropzone($("#mni-drop"), function (f) {
          TK.readText(f, function (txt) {
            var p = TK.parseTable(txt);
            var m = TK.mapColumns(p.headers, {
              series: [/series/, /block/, /code/, /prefix/],
              op: [/operator/, /licensee/, /tsp/, /company/],
              lsa: [/lsa/, /circle/, /servicearea/, /state/]
            });
            if (!m.series) {
              $("#mni-nnp").innerHTML = '<div class="note danger" style="margin-top:12px">' +
                "<b>No series column found</b><p>Headers seen: <span class=\"mono\">" +
                TK.esc(p.headers.join(", ")) + "</span></p></div>";
              return;
            }
            var idx = {};
            p.rows.forEach(function (row) {
              var k = String(row[m.series]).replace(/[^\d]/g, "");
              if (k) idx[k] = row;
            });
            var found = valid.map(function (r) {
              var hit = null, key = "";
              for (var L = 6; L >= 3; L--) {
                key = r.national.slice(0, L);
                if (idx[key]) { hit = idx[key]; break; }
              }
              return {
                num: r.national,
                key: hit ? key : "",
                op: hit && m.op ? hit[m.op] : "",
                lsa: hit && m.lsa ? hit[m.lsa] : ""
              };
            });
            $("#mni-nnp").innerHTML = '<div class="note ok" style="margin:12px 0"><b>Loaded ' +
              TK.fmtNum(Object.keys(idx).length) + " series rows</b></div>" +
              '<div id="mni-nnp-tbl"></div>';
            TK.table($("#mni-nnp-tbl"), found, [
              { k: "num", label: "Number", cls: "mono" },
              { k: "key", label: "Matched series", cls: "mono" },
              { k: "op", label: "Allocated operator" },
              { k: "lsa", label: "LSA" }
            ], { filename: "series-lookup" });
          });
        }, { accept: ".csv,.txt,.tsv" });
      }
    }
  });

  /* ==========================================================
     2. TSP and LSA directory
     ========================================================== */
  TK.reg({
    id: "tsp",
    name: "TSP / LSA Directory",
    cluster: "identity",
    tier: 1,
    desc: "The 22 licensed service areas and which operator works where.",
    lede: "A notice sent to the wrong circle comes back empty weeks later. This shows which " +
          "licensed service area covers which region.",
    render: function (root) {
      var rows = LSA.map(function (l) {
        return { c: l.c, name: l.name, cat: l.cat === "M" ? "Metro" : "Category " + l.cat };
      });
      root.innerHTML =
        '<div class="card"><h3>Licensed Service Areas</h3>' +
        '<p class="small muted">Metro circles are separate from the state around them. A number ' +
        "issued in Noida belongs to UP (West), not Delhi. That one distinction misdirects a lot of " +
        "requisitions.</p><div id=\"lsa-tbl\"></div></div>" +

        '<div class="card"><h3>Access providers</h3><div class="grid c2">' +
        Object.keys(TSP).map(function (k) {
          var t = TSP[k];
          return '<div class="stat"><div style="font-weight:640;font-size:15px">' + TK.esc(t.short) + "</div>" +
            '<div class="small muted" style="margin-top:3px">' + TK.esc(t.name) + "</div>" +
            '<div style="margin-top:7px"><span class="badge ' + (t.type === "PSU" ? "info" : "") + '">' +
            TK.esc(t.type) + "</span>" + (t.note ? ' <span class="badge warn">' + TK.esc(t.note) + "</span>" : "") +
            "</div></div>";
        }).join("") + "</div></div>" +

        '<div class="note info"><b>Consolidation changes what an old CDR means</b>' +
        "<p>Aircel, Reliance Communications, Tata Docomo, Telenor and MTS have all closed. A 2017 CDR " +
        "can carry an operator code with no surviving nodal officer. Those requests go to the resolution " +
        "professional or the company that bought them. Establish that before assuming the record is gone.</p></div>";

      TK.table($("#lsa-tbl"), rows, [
        { k: "c", label: "Code", cls: "mono" },
        { k: "name", label: "Licensed service area" },
        { k: "cat", label: "Category" }
      ], { pageSize: 30, filename: "lsa" });
    }
  });

  /* ==========================================================
     3. IMSI / PLMN decoder
     ========================================================== */
  TK.reg({
    id: "mccmnc",
    name: "IMSI / PLMN Decoder",
    cluster: "identity",
    tier: 1,
    desc: "Break an IMSI into country, network and subscriber parts.",
    lede: "The IMSI identifies the SIM, not the number and not the person. Decoding it tells you " +
          "which network issued it, and whether you are looking at a foreign SIM.",
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">IMSI (15 digits) or MCC-MNC pair</label>' +
          '<input type="text" id="imsi-in" class="mono" placeholder="404451234567890  or  405-857" maxlength="20"></div>' +
          '<div class="row"><button class="btn primary" id="imsi-go">Decode</button>' +
          '' +
          '</div>' +
        "</div><div id=\"imsi-out\"></div>" +
        '<div class="card"><h3>India PLMN table</h3>' +
        '<p class="small muted">Rows marked <span class="badge warn">unverified</span> come from general ' +
        "knowledge. Confirm them against the DoT or ITU list before putting them in a report.</p>" +
        '<div id="plmn-tbl"></div></div>';

      $("#imsi-go").onclick = go;
      $("#imsi-in").addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });

      function lookup(mcc, mnc) {
        return MCCMNC.filter(function (r) { return r.mcc === mcc && r.mnc === mnc; })[0] || null;
      }

      function go() {
        var v = $("#imsi-in").value.trim();
        var d = v.replace(/[^\d]/g, "");
        if (!d) { $("#imsi-out").innerHTML = ""; return; }

        var mcc = d.slice(0, 3);
        var country = MCC_WORLD[mcc];
        var isIndia = mcc === "404" || mcc === "405" || mcc === "406";

        var hit = null, mnc = "", msin = "";
        if (d.length >= 5) {
          var try3 = d.slice(3, 6), try2 = d.slice(3, 5);
          hit = lookup(mcc, try3);
          if (hit) { mnc = try3; msin = d.slice(6); }
          else {
            hit = lookup(mcc, try2);
            mnc = hit ? try2 : (mcc === "405" ? try3 : try2);
            msin = d.slice(3 + mnc.length);
          }
        }

        var lenNote = d.length === 15 ? { k: "ok", t: "15 digits, correct IMSI length" }
          : d.length < 6 ? { k: "info", t: "Read as an MCC-MNC pair, not a full IMSI" }
          : { k: "warn", t: d.length + " digits. An IMSI is 15. Check for truncation." };

        var out = '<div class="card"><div class="row" style="margin-bottom:14px">' +
          '<span class="badge ' + lenNote.k + '">' + TK.esc(lenNote.t) + "</span>" +
          '<span class="badge ' + (country ? "ok" : "danger") + '">' +
          TK.esc(country ? "MCC " + mcc + " = " + country : "MCC " + mcc + " unrecognised") + "</span>" +
          (hit ? '<span class="badge accent">Network resolved</span>' : "") + "</div>";

        out += '<div style="font-family:var(--mono);font-size:19px;letter-spacing:1px;margin-bottom:14px;word-break:break-all">' +
          '<span style="color:var(--accent)">' + mcc + "</span>" +
          '<span style="color:var(--warn)">' + mnc + "</span>" +
          '<span style="color:var(--fg-2)">' + msin + "</span></div>" +
          '<div class="row xs muted" style="gap:18px;margin-bottom:16px">' +
            '<span><b style="color:var(--accent)">&#9609;</b> MCC, country</span>' +
            '<span><b style="color:var(--warn)">&#9609;</b> MNC, network</span>' +
            '<span><b style="color:var(--fg-2)">&#9609;</b> MSIN, subscriber serial</span></div>';

        out += '<dl class="kv">' +
          "<dt>Country (MCC)</dt><dd>" + mcc + ", " + TK.esc(country || "unknown") + "</dd>" +
          "<dt>Network (MNC)</dt><dd>" + (mnc || "-") + "</dd>" +
          (hit ? "<dt>Operator</dt><dd>" + TK.esc(TSP[hit.op] ? TSP[hit.op].name : hit.op) + "</dd>" +
                 "<dt>Brand or block</dt><dd>" + TK.esc(hit.brand) + "</dd>" +
                 "<dt>LSA</dt><dd>" + TK.esc(hit.lsa === "-" ? "national block" :
                   (LSA.filter(function (l) { return l.c === hit.lsa; })[0] || {}).name || hit.lsa) + "</dd>" +
                 "<dt>Confidence</dt><dd>" + (hit.v ? "verified" : "UNVERIFIED, confirm before reporting") + "</dd>"
               : "") +
          "<dt>MSIN</dt><dd>" + (msin || "-") + "</dd>" +
        "</dl>";

        if (!isIndia && country) {
          out += '<div class="note danger" style="margin-top:14px"><b>Foreign network, different evidence route</b>' +
            "<p>This SIM was issued by a carrier in " + TK.esc(country) + ". A BNSS s.94 notice has no reach " +
            "there. Subscriber details need mutual legal assistance. The Indian operator can only give you " +
            "the roaming leg it carried.</p></div>";
        } else if (isIndia && !hit && mnc) {
          out += '<div class="note warn" style="margin-top:14px"><b>Indian MCC, unrecognised MNC</b>' +
            "<p>Probably an operator that has closed: Aircel, RCom, Tata Docomo, Telenor or MTS. It may also " +
            "be a block missing from this table. Either way, a closed-operator code also dates the record, " +
            "which is useful in itself.</p></div>";
        }
        out += "</div>";
        $("#imsi-out").innerHTML = out;
      }

      var rows = MCCMNC.map(function (r) {
        return {
          plmn: r.mcc + "-" + r.mnc,
          op: TSP[r.op] ? TSP[r.op].short : (r.op || "-"),
          brand: r.brand,
          lsa: r.lsa === "-" ? "national" : ((LSA.filter(function (l) { return l.c === r.lsa; })[0] || {}).name || r.lsa),
          v: r.v
        };
      });
      TK.table($("#plmn-tbl"), rows, [
        { k: "plmn", label: "MCC-MNC", cls: "mono" },
        { k: "op", label: "Operator" },
        { k: "brand", label: "Brand or block" },
        { k: "lsa", label: "LSA" },
        { k: "v", label: "Status", fmt: function (v) {
            return v ? '<span class="badge ok">verified</span>' : '<span class="badge warn">unverified</span>';
          } }
      ], { pageSize: 100, filename: "plmn-india" });
    }
  });

  /* ==========================================================
     4. CAF Summariser
     ========================================================== */
  TK.reg({
    id: "caf",
    name: "CAF Summariser",
    cluster: "identity",
    tier: 2,
    desc: "Parse a Customer Acquisition Form export and surface the bulk-SIM and fake-KYC indicators.",
    lede: "One form tells you little. The pattern across many " +
          "forms tells you a lot: one ID document behind many SIMs, one shop issuing them, all switched on " +
          "within the same hour.",
    wide: true,
    render: function (root) {
      root.innerHTML =
        '<div class="card"><div class="drop" id="caf-drop"><div class="big"></div>' +
        "<div>Drop the CAF export (CSV / TSV), or <b>browse</b></div>" +
        '<div class="xs muted" style="margin-top:8px">Parsed in this browser. Nothing is uploaded.</div></div>' +
        '<div class="row" style="margin-top:12px"></div>' +
        "</div><div id=\"caf-out\"></div>";

      TK.dropzone($("#caf-drop"), function (f) { TK.readText(f, process); }, { accept: ".csv,.tsv,.txt" });

      function process(text) {
        var ps = TK.parseSmart(text, TK.SPEC.caf);
        var p = ps.p;
        if (!p.rows.length) {
          $("#caf-out").innerHTML = '<div class="note danger"><b>No data rows found</b><p>' +
            TK.esc(p.meta.error || "Check the delimiter and that the file has a header row.") + "</p></div>";
          return;
        }
        var m = ps.sm.map;

        // group by ID document
        function groupBy(rows, key) {
          var g = {};
          rows.forEach(function (r) {
            var v = (r[key] || "").trim().toUpperCase();
            if (!v) return;
            (g[v] = g[v] || []).push(r);
          });
          return g;
        }

        var byId = m.idnum ? groupBy(p.rows, m.idnum) : {};
        var byPos = m.pos ? groupBy(p.rows, m.pos) : {};
        var byAddr = m.addr ? groupBy(p.rows, m.addr) : {};

        function topGroups(g, min) {
          return Object.keys(g).filter(function (k) { return g[k].length >= min; })
            .sort(function (a, b) { return g[b].length - g[a].length; });
        }
        var multiId = topGroups(byId, 2);
        var multiPos = topGroups(byPos, 3);
        var multiAddr = topGroups(byAddr, 3);

        // activation clustering, same day bursts
        var byDay = {};
        if (m.act) p.rows.forEach(function (r) {
          var d = TK.parseDate(r[m.act]);
          if (!d) return;
          var k = TK.fmtDate(d).slice(0, 10);
          (byDay[k] = byDay[k] || []).push(r);
        });
        var burstDays = Object.keys(byDay).filter(function (k) { return byDay[k].length >= 3; })
          .sort(function (a, b) { return byDay[b].length - byDay[a].length; });

        var out = "";

        // parse report
        out += '<div class="note ' + (p.meta.preamble.length ? "warn" : "ok") + '"><b>Parse report</b>' +
          "<p>" + TK.fmtNum(p.rows.length) + " records from " + TK.fmtNum(p.meta.totalLines) + " lines. " +
          "Delimiter <code class='inl'>" + TK.esc(p.meta.delim) + "</code>, header on line " + p.meta.headerRow +
          (p.meta.skipped ? ", " + p.meta.skipped + " junk row(s) discarded" : "") + ".</p>" +
          (p.meta.preamble.length ? "<p class='xs mono muted'>Preamble skipped: " +
            TK.esc(p.meta.preamble.join(" ⏎ ").slice(0, 300)) + "</p>" : "") + "</div>";

        var unmapped = Object.keys(m).length;
        if (unmapped < 5) {
          out += '<div class="note warn"><b>Only ' + unmapped + ' columns recognised</b>' +
            "<p>Headers seen: <span class='mono xs'>" + TK.esc(p.headers.join(" · ")) + "</span></p></div>";
        }

        out += '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(TK.fmtNum(p.rows.length), "Connections") +
          TK.stat(Object.keys(byId).length || "-", "Distinct ID docs") +
          TK.stat(multiId.length, "IDs with 2+ SIMs", multiId.length ? "danger" : "ok") +
          TK.stat(multiPos.length, "High-volume PoS", multiPos.length ? "warn" : "ok") +
        "</div>";

        function groupCard(title, keys, g, label, kind, note) {
          if (!keys.length) return "";
          return '<div class="card"><h3>' + title + "</h3>" +
            (note ? '<p class="small muted">' + note + "</p>" : "") +
            keys.slice(0, 25).map(function (k) {
              var rows = g[k];
              return '<div style="border-bottom:1px solid var(--line);padding:9px 0">' +
                '<div class="row tight"><span class="badge ' + kind + '">' + rows.length + " connections</span>" +
                '<span class="mono small">' + TK.esc(k) + "</span></div>" +
                '<div class="xs muted mono" style="margin-top:4px">' +
                TK.esc(rows.map(function (r) { return m.msisdn ? r[m.msisdn] : "?"; }).slice(0, 20).join("  ")) +
                (rows.length > 20 ? "  …" : "") + "</div></div>";
            }).join("") + "</div>";
        }

        out += groupCard("One identity document, multiple connections", multiId, byId, "ID", "danger",
          "The classic bulk-SIM signature. Nine connections per identity document is the regulatory ceiling, " +
          "but in a fraud case any repetition is worth pulling the underlying KYC image for.");

        out += groupCard("Point of Sale concentration", multiPos, byPos, "PoS", "warn",
          "A single retailer issuing many of the connections in your case is a subject in their own right. " +
          "Requisition the retailer's own KYC and the activation logs from the distributor.");

        out += groupCard("Shared address", multiAddr, byAddr, "Address", "warn",
          "Identical address strings across unrelated subscriber names usually mean a template was reused, " +
          "not that people live together.");

        if (burstDays.length) {
          out += '<div class="card"><h3>Activation bursts</h3>' +
            '<p class="small muted">Three or more of these connections activated on the same day.</p><div class="rail">' +
            burstDays.slice(0, 15).map(function (d) {
              return '<div class="rail-item ' + (byDay[d].length >= 5 ? "danger" : "warn") + '">' +
                '<div class="row tight"><b class="mono">' + TK.esc(d) + "</b>" +
                '<span class="badge ' + (byDay[d].length >= 5 ? "danger" : "warn") + '">' +
                byDay[d].length + " activations</span></div>" +
                '<div class="xs muted mono" style="margin-top:3px">' +
                TK.esc(byDay[d].map(function (r) { return m.msisdn ? r[m.msisdn] : ""; }).join("  ")) + "</div></div>";
            }).join("") + "</div></div>";
        }

        out += '<div class="card"><h3>All records</h3><div id="caf-tbl"></div></div>';

        out += '<div class="note info"><b>What to ask for next</b><p>For every flagged identity document: ' +
          "the scanned KYC image and the biometric/e-KYC audit trail; all other connections against the same " +
          "document across <i>all</i> operators; the PoS agent's own KYC; and the first-call and first-recharge " +
          "details, which frequently expose the real user rather than the registered subscriber.</p></div>";

        $("#caf-out").innerHTML = out;

        var cols = [];
        if (m.msisdn) cols.push({ k: m.msisdn, label: "MSISDN", cls: "mono" });
        if (m.name) cols.push({ k: m.name, label: "Subscriber" });
        if (m.idtype) cols.push({ k: m.idtype, label: "ID type" });
        if (m.idnum) cols.push({ k: m.idnum, label: "ID number", cls: "mono" });
        if (m.act) cols.push({ k: m.act, label: "Activated", cls: "mono" });
        if (m.pos) cols.push({ k: m.pos, label: "PoS" });
        if (m.addr) cols.push({ k: m.addr, label: "Address" });
        if (!cols.length) cols = p.headers.slice(0, 8).map(function (x) { return { k: x, label: x }; });

        TK.table($("#caf-tbl"), p.rows, cols, {
          filename: "caf-records",
          rowClass: function (r) {
            if (m.idnum && byId[(r[m.idnum] || "").toUpperCase()] &&
                byId[(r[m.idnum] || "").toUpperCase()].length >= 2) return "flagged";
            if (m.pos && byPos[(r[m.pos] || "").toUpperCase()] &&
                byPos[(r[m.pos] || "").toUpperCase()].length >= 3) return "hi";
            return "";
          }
        });
      }
    }
  });

  /* ==========================================================
     5. Verhoeff checksum (Aadhaar structure, training only)
     ========================================================== */
  TK.reg({
    id: "verhoeff",
    name: "Verhoeff Checksum",
    cluster: "identity",
    tier: 1,
    desc: "The check-digit algorithm behind Aadhaar numbers. Teaching tool, synthetic numbers only.",
    lede: "This demonstrates the Verhoeff algorithm and nothing else. It cannot validate an " +
          "Aadhaar number against UIDAI, and no lawful tool available to an investigator can.",
    badges: ["Verhoeff (1969)", "Synthetic only"],
    legal: {
      authority: "Aadhaar Act 2016 s.33, identity information is disclosed only on the order of a " +
                 "court not inferior to a District Judge. s.29 bars sharing core biometric information.",
      threshold: "Court order. An investigating officer cannot requisition this directly.",
      holder: "UIDAI. Real validation needs AUA/KUA licensing, which is not available for this purpose.",
      caution: "Do not enter a real Aadhaar number here or anywhere else. Collecting and processing " +
               "Aadhaar numbers without authority is itself an offence under the Act.",
      evidence: "A passing checksum means the digits are well-formed. It says nothing about whether " +
                "the number was ever issued, or to whom."
    },
    render: function (root) {
      // Verhoeff tables
      var D = [
        [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
        [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
        [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
        [9,8,7,6,5,4,3,2,1,0]
      ];
      var P = [
        [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
        [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
        [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]
      ];
      var INV = [0,4,3,2,1,5,6,7,8,9];

      function verhoeffCheck(num) {
        var c = 0, rev = num.split("").reverse();
        for (var i = 0; i < rev.length; i++) c = D[c][P[i % 8][+rev[i]]];
        return c === 0;
      }
      function verhoeffDigit(payload) {
        var c = 0, rev = payload.split("").reverse();
        for (var i = 0; i < rev.length; i++) c = D[c][P[(i + 1) % 8][+rev[i]]];
        return INV[c];
      }

      root.innerHTML =
        '<div class="note danger"><b>Read this first</b><p>Nothing on this page talks to UIDAI. It is ' +
        "arithmetic. A number can pass the checksum and never have been issued to anybody. Use the " +
        "generator below for training data, do not type a real number into any field on this page.</p></div>" +

        '<div class="card"><h3>Check a synthetic number</h3>' +
          '<div class="field"><label class="lbl">12-digit test number</label>' +
          '<input type="text" id="vh-in" class="mono" maxlength="14" placeholder="e.g. 999912345670" autocomplete="off"></div>' +
          '<div id="vh-out"></div></div>' +

        '<div class="card"><h3>Generate training numbers</h3>' +
          '<p class="small muted">Generated in the 9999 test block so they are visibly synthetic and ' +
          "will never collide with a real issued number.</p>" +
          '<div class="row"><button class="btn primary" id="vh-gen">Generate 10</button>' +
          '<button class="btn" id="vh-gen-csv">Generate 200 as CSV</button></div>' +
          '<div id="vh-gen-out" style="margin-top:12px"></div></div>' +

        '<div class="card"><h3>How the algorithm works</h3>' +
          "<p class=\"small\">Verhoeff is a dihedral-group checksum. Unlike Luhn (used for IMEI and " +
          "card numbers) it catches all single-digit errors <i>and</i> all adjacent transpositions, " +
          "which is why it was chosen for a number humans read aloud and type by hand.</p>" +
          '<p class="small muted">Three tables drive it: a multiplication table <code class="inl">d</code> ' +
          "over the dihedral group D&#8325;, a permutation table <code class=\"inl\">p</code> applied by " +
          "position, and an inverse table. The check passes when the accumulated product is the identity " +
          "element, 0.</p></div>";

      function render() {
        var v = $("#vh-in").value.replace(/[^\d]/g, "");
        var el = $("#vh-out");
        if (!v) { el.innerHTML = ""; return; }

        if (/^\d{12}$/.test(v) && v.slice(0, 4) !== "9999") {
          el.innerHTML = '<div class="note danger"><b>Refusing to process</b><p>This looks like it could be ' +
            "a live 12-digit number. This page only handles numbers in the 9999 test block. If you were " +
            "testing the tool, use the generator above.</p></div>";
          return;
        }
        if (v.length !== 12) {
          el.innerHTML = '<div class="note"><b>' + v.length + " digits</b><p>Needs 12.</p></div>";
          return;
        }
        var ok = verhoeffCheck(v);
        var expected = verhoeffDigit(v.slice(0, 11));
        el.innerHTML = '<div class="note ' + (ok ? "ok" : "danger") + '"><b>' +
          (ok ? "Checksum valid" : "Checksum FAILS") + "</b>" +
          "<p>Payload <span class='mono'>" + v.slice(0, 11) + "</span>, check digit <span class='mono'>" +
          v[11] + "</span>" + (ok ? "" : ", expected <span class='mono'>" + expected + "</span>") + ".</p>" +
          "<p class='xs muted'>Structurally well-formed only. This is not a statement that the number exists.</p></div>";
      }
      $("#vh-in").addEventListener("input", render);

      function gen(n) {
        var out = [];
        for (var i = 0; i < n; i++) {
          var body = "9999";
          for (var j = 0; j < 7; j++) body += Math.floor(Math.random() * 10);
          out.push(body + verhoeffDigit(body));
        }
        return out;
      }
      $("#vh-gen").onclick = function () {
        var g = gen(10);
        $("#vh-gen-out").innerHTML = '<div class="copyable"><pre class="out">' + g.join("\n") +
          '</pre><button class="btn sm copybtn" data-copy="prev">Copy</button></div>' +
          '<p class="xs muted" style="margin-top:8px">All ten pass Verhoeff. All ten are fictional.</p>';
      };
      $("#vh-gen-csv").onclick = function () {
        var g = gen(200).map(function (x, i) {
          return { sl: i + 1, number: x, note: "SYNTHETIC - training data only" };
        });
        TK.download("synthetic-verhoeff-numbers.csv", TK.toCSV(g), "text/csv");
      };
    }
  });
})();
