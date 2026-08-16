/* ============================================================
   Cluster: Telecom analysis
   "Who did they talk to, and from where?"
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* ---------- shared: load-or-drop evidence file ---------- */
  function fileCard(id, label, sampleKey) {
    return '<div class="card"><div class="drop" id="' + id + '-drop"><div class="big">↓</div>' +
      "<div>" + label + ", or <b>browse</b></div>" +
      '<div class="xs muted" style="margin-top:8px">Parsed in this browser. The file is never uploaded.</div></div>' +
      "</div>";
  }

  function wireFile(id, sampleKey, onText) {
    TK.dropzone($("#" + id + "-drop"), function (f) { TK.readText(f, onText); },
      { accept: ".csv,.tsv,.txt,.xls" });
  }

  function parseReport(p) {
    return '<div class="note ' + (p.meta.preamble.length || p.meta.skipped ? "warn" : "ok") + '"><b>Parse report</b>' +
      "<p>" + TK.fmtNum(p.rows.length) + " records from " + TK.fmtNum(p.meta.totalLines) + " lines. " +
      "Delimiter <code class='inl'>" + esc(p.meta.delim) + "</code>, header detected on line " + p.meta.headerRow +
      (p.meta.skipped ? ", " + p.meta.skipped + " non-conforming row(s) discarded" : "") + ".</p>" +
      (p.meta.preamble.length ? "<p class='xs mono muted'>Skipped preamble: " +
        esc(p.meta.preamble.join("  ⏎  ").slice(0, 400)) + "</p>" : "") + "</div>";
  }

  function mapReport(m, headers, needed) {
    var missing = needed.filter(function (k) { return !m[k]; });
    if (!missing.length) return "";
    return '<div class="note ' + (missing.length > needed.length / 2 ? "danger" : "warn") + '">' +
      "<b>Columns not recognised: " + esc(missing.join(", ")) + "</b>" +
      "<p>Headers in the file: <span class='mono xs'>" + esc(headers.join(" · ")) + "</span></p>" +
      "<p class='xs'>Every operator names these differently. If a column is present under a name the " +
      "parser does not know, rename the header in the file and re-drop it.</p></div>";
  }

  /* ==========================================================
     CDR Processor
     ========================================================== */
  TK.reg({
    id: "cdr",
    name: "CDR Processor",
    cluster: "telecom",
    tier: 2,
    desc: "Parse a call detail record dump and pull out contacts, patterns, handset changes and tower footprint.",
    lede: "Getting the call records is the easy part. Reading twenty thousand " +
          "rows is the hard part. This does the counting and the flagging for you, so you spend " +
          "your time on the rows that matter.",
    wide: true,
    legal: {
      authority: "BNSS 2023 s.94, written order to produce a document or thing.",
      threshold: "DoT instructions restrict CDR requisitions to SP / DCP rank and above, with a monthly " +
                 "report to the District Magistrate. Some states delegate to ACP / DySP by standing order.",
      holder: "Access provider nodal officer for the licensed service area.",
      retention: "At least one year under licence conditions. Anything older is probably gone, ask early.",
      caution: "A CDR shows who called whom, when, for how long, and from which tower. It does not " +
               "contain what was said. Recordings need a different and far harder permission.",
      evidence: "Obtain the BSA s.63(4) certificate with the record, not later. Hash the file on receipt " +
                "and record the hash in the seizure memo."
    },
    render: function (root) {
      root.innerHTML = fileCard("cdr", "Drop the CDR file (CSV / TSV)", "cdr") + '<div id="cdr-out"></div>';
      wireFile("cdr", "cdr", function (t) { process(t); });

      var lastText = null;

      function process(text, override) {
        if (text) lastText = text;
        /* Columns are identified from their contents as well as their
           headings, so a file using "Party A" or "Mob No", or one with
           no header row at all, still parses. Whatever is inferred is
           shown above the results and can be corrected. */
        var ps = TK.parseSmart(lastText, TK.SPEC.cdr);
        var p = ps.p, sm = ps.sm;
        if (!p.rows.length) {
          $("#cdr-out").innerHTML = '<div class="note danger"><b>No data rows found</b></div>';
          return;
        }
        var m = override || sm.map;

        // Decide day-first vs month-first from the whole column, not row by row
        var dOrder = m.datetime
          ? TK.detectDateOrder(p.rows.map(function (r) { return r[m.datetime]; }))
          : { order: "dmy", certain: true, seen: 0 };

        // ---- normalise into a working record set
        var recs = p.rows.map(function (r) {
          var dt = m.datetime ? TK.parseDate(r[m.datetime], dOrder.order) : null;
          if (!dt && m.datetime && m.time) dt = TK.parseDate(r[m.datetime] + " " + r[m.time], dOrder.order);
          var typ = (m.type ? r[m.type] : "").toString().toUpperCase();
          return {
            a: TK.normNum(m.a_party ? r[m.a_party] : ""),
            b: TK.normNum(m.b_party ? r[m.b_party] : ""),
            dt: dt,
            dur: m.dur ? TK.parseDur(r[m.dur]) : 0,
            type: typ,
            imei: m.imei ? String(r[m.imei]).replace(/[^\d]/g, "") : "",
            imsi: m.imsi ? String(r[m.imsi]).replace(/[^\d]/g, "") : "",
            cell: m.cellid ? String(r[m.cellid]).trim() : "",
            site: m.site ? String(r[m.site]).trim() : "",
            lat: m.lat ? parseFloat(r[m.lat]) : NaN,
            lon: m.lon ? parseFloat(r[m.lon]) : NaN,
            raw: r
          };
        });

        /* The target is the one number that appears in essentially every
           row, on whichever side. Counting only the A column mis-identifies
           it as soon as incoming legs are recorded with the target as
           B-party, which several operators do. */
        var seenIn = {};
        recs.forEach(function (r) {
          var here = {};
          if (r.a) here[r.a] = 1;
          if (r.b) here[r.b] = 1;
          Object.keys(here).forEach(function (n) { seenIn[n] = (seenIn[n] || 0) + 1; });
        });
        var ranked = Object.keys(seenIn).sort(function (x, y) { return seenIn[y] - seenIn[x]; });
        var target = ranked[0] || "";
        var targetShare = recs.length ? seenIn[target] / recs.length : 0;

        var dated = recs.filter(function (r) { return r.dt; });
        dated.sort(function (x, y) { return x.dt - y.dt; });
        var span = dated.length ? { from: dated[0].dt, to: dated[dated.length - 1].dt } : null;

        /* Operators label direction as OUT / MOC / OG / A2B / O, or the
           incoming equivalents, and often prefix the service: "SMS-OUT",
           "MO-CALL". Anchoring at the start missed all of those, so they
           were counted as neither direction. Match on word boundaries and
           test outgoing first, since "OUTGOING" contains no "IN" but
           "INCOMING" must not be caught by a loose "O" test. */
        function isOut(r) {
          return /OUTGOING|\bMOC\b|\bMO\b|\bOUT\b|\bOG\b|\bA2B\b|^O$/.test(r.type);
        }
        function isIn(r) {
          return !isOut(r) &&
            /INCOMING|\bMTC\b|\bMT\b|\bIN\b|\bIC\b|\bB2A\b|^I$/.test(r.type);
        }
        function isSMS(r) { return /SMS|MSG|TEXT/.test(r.type); }

        // ---- contact roll-up
        var contacts = {};
        recs.forEach(function (r) {
          var other = r.a === target ? r.b : (r.b === target ? r.a : r.b);
          if (!other || other === target) return;
          var c = contacts[other] || (contacts[other] = {
            num: other, calls: 0, sms: 0, out: 0, in: 0, dur: 0, first: null, last: null, night: 0
          });
          if (isSMS(r)) c.sms++; else c.calls++;
          if (isOut(r)) c.out++; else if (isIn(r)) c.in++;
          c.dur += r.dur;
          if (r.dt) {
            if (!c.first || r.dt < c.first) c.first = r.dt;
            if (!c.last || r.dt > c.last) c.last = r.dt;
            var hh = r.dt.getHours();
            if (hh >= 0 && hh < 5) c.night++;
          }
        });
        var clist = Object.keys(contacts).map(function (k) { return contacts[k]; })
          .sort(function (x, y) { return (y.calls + y.sms) - (x.calls + x.sms); });

        // ---- handset / SIM changes
        var imeis = {}, imsis = {};
        recs.forEach(function (r) {
          if (r.imei && r.imei.length >= 14) {
            var t = r.imei.slice(0, 14);
            var e = imeis[t] || (imeis[t] = { imei: t, n: 0, first: null, last: null, imsis: {} });
            e.n++;
            if (r.dt) { if (!e.first || r.dt < e.first) e.first = r.dt; if (!e.last || r.dt > e.last) e.last = r.dt; }
            if (r.imsi) e.imsis[r.imsi] = 1;
          }
          if (r.imsi) imsis[r.imsi] = (imsis[r.imsi] || 0) + 1;
        });
        var imeiList = Object.keys(imeis).map(function (k) { return imeis[k]; })
          .sort(function (x, y) { return y.n - x.n; });

        // ---- cell footprint
        var cells = {};
        recs.forEach(function (r) {
          var key = r.cell || r.site;
          if (!key) return;
          var c = cells[key] || (cells[key] = {
            cell: r.cell, site: r.site, n: 0, night: 0, lat: r.lat, lon: r.lon
          });
          c.n++;
          if (r.dt && r.dt.getHours() < 6) c.night++;
          if (isNaN(c.lat) && !isNaN(r.lat)) { c.lat = r.lat; c.lon = r.lon; }
        });
        var cellList = Object.keys(cells).map(function (k) { return cells[k]; })
          .sort(function (x, y) { return y.n - x.n; });

        // ---- hour x weekday heatmap
        var grid = [], DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (var d = 0; d < 7; d++) { grid[d] = []; for (var hh2 = 0; hh2 < 24; hh2++) grid[d][hh2] = 0; }
        var maxCell = 0;
        dated.forEach(function (r) {
          var v = ++grid[r.dt.getDay()][r.dt.getHours()];
          if (v > maxCell) maxCell = v;
        });

        var nightRecs = dated.filter(function (r) { return r.dt.getHours() < 5; });

        /* ---------------- render ---------------- */
        var out = parseReport(p) +
          mapReport(m, p.headers, ["a_party", "b_party", "datetime", "dur", "type", "imei", "cellid"]);

        if (m.datetime && !dOrder.certain) {
          out += '<div class="note ' + (dOrder.conflict ? "danger" : "warn") + '"><b>' +
            (dOrder.conflict
              ? "Date column is inconsistent"
              : "Date order could not be proved from this file") + "</b><p>" +
            (dOrder.conflict
              ? "Some rows can only be day-first and others can only be month-first. The column is " +
                "mixed and the timeline cannot be trusted. Go back to the operator for a clean export."
              : "No value in this column has a first or second component above 12, so DD/MM and MM/DD " +
                "both fit. Dates have been read as <b>day-first (DD/MM)</b>, the Indian convention. " +
                "If the export came from a US-configured system, every date here is wrong. Confirm " +
                "against a date you already know from the case.") + "</p></div>";
        }
        if (target && targetShare < 0.9) {
          out += '<div class="note warn"><b>Target number is a guess on this file</b>' +
            "<p>+91-" + esc(target) + " appears in only " + Math.round(targetShare * 100) +
            "% of rows. In a single-subscriber CDR it should be near 100%. This may be a multi-number " +
            "extract, or the A/B columns may not have been recognised. Check it against your requisition " +
            "before relying on the contact list below.</p></div>";
        }

        out += '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(TK.fmtNum(recs.length), "Records") +
          TK.stat(TK.fmtNum(clist.length), "Unique contacts", "accent") +
          TK.stat(imeiList.length, "Handsets (IMEI)", imeiList.length > 1 ? "warn" : "") +
          TK.stat(Object.keys(imsis).length || "-", "SIMs (IMSI)", Object.keys(imsis).length > 1 ? "warn" : "") +
        "</div>";

        out += '<div class="card tight"><dl class="kv">' +
          "<dt>Target number</dt><dd>" + (target ? "+91-" + target : "not determinable") +
            ' <span class="muted">(seen in ' + Math.round(targetShare * 100) +
            '% of rows; verify against your requisition)</span></dd>' +
          (span ? "<dt>Period covered</dt><dd>" + TK.fmtDate(span.from) + " → " + TK.fmtDate(span.to) +
            "  (" + Math.round((span.to - span.from) / 86400000) + " days)</dd>" : "") +
          "<dt>Total talk time</dt><dd>" + TK.fmtDur(recs.reduce(function (s, r) { return s + r.dur; }, 0)) + "</dd>" +
          "<dt>Calls / SMS</dt><dd>" + TK.fmtNum(recs.filter(function (r) { return !isSMS(r); }).length) +
            " calls, " + TK.fmtNum(recs.filter(isSMS).length) + " SMS</dd>" +
          "<dt>Outgoing / incoming</dt><dd>" + TK.fmtNum(recs.filter(isOut).length) + " out, " +
            TK.fmtNum(recs.filter(isIn).length) + " in</dd>" +
          "<dt>Distinct cells</dt><dd>" + TK.fmtNum(cellList.length) + "</dd>" +
        "</dl></div>";

        // ---- handset changes: the highest-value automatic finding
        if (imeiList.length > 1) {
          out += '<div class="card"><h3>Handset changes</h3>' +
            '<div class="note danger"><b>This SIM was used in ' + imeiList.length + " different handsets</b>" +
            "<p>The change may be innocent: an upgrade, a repair, a dual-SIM phone. Or it may not be. " +
            "A phone used only during the " +
            "offence window is the one to trace through CEIR.</p></div>" +
            '<div class="rail">' + imeiList.map(function (e) {
              return '<div class="rail-item ' + (e.n < recs.length * 0.12 ? "danger" : "") + '">' +
                '<div class="row tight"><b class="mono">' + esc(e.imei) + "</b>" +
                '<span class="badge">' + TK.fmtNum(e.n) + " records</span>" +
                (e.n < recs.length * 0.12 ? '<span class="badge danger">brief use</span>' : "") + "</div>" +
                '<div class="xs muted mono" style="margin-top:3px">' +
                (e.first ? TK.fmtDate(e.first) + "  →  " + TK.fmtDate(e.last) : "no timestamps") +
                (Object.keys(e.imsis).length > 1 ? "  ·  " + Object.keys(e.imsis).length + " different SIMs in this handset" : "") +
                "</div></div>";
            }).join("") + "</div></div>";
        }

        // ---- top contacts
        out += '<div class="card"><h3>Contacts</h3>' +
          '<p class="small muted">Ranked by how often they were contacted. But the number that matters is often not at ' +
          'the top. Look for one contacted heavily for a few days and then never again.</p>' +
          '<div id="cdr-contacts"></div></div>';

        // ---- odd hours
        if (nightRecs.length) {
          out += '<div class="card"><h3>Activity between midnight and 05:00</h3>' +
            '<p class="small muted">' + TK.fmtNum(nightRecs.length) + " records (" +
            (100 * nightRecs.length / dated.length).toFixed(1) + "% of dated activity). " +
            "Night contact with a small closed set of numbers is a stronger association signal than raw volume.</p>" +
            '<div id="cdr-night"></div></div>';
        }

        // ---- heatmap
        out += '<div class="card"><h3>When this number is active</h3><div style="overflow-x:auto">' +
          '<table style="border-collapse:collapse;font-size:10px;font-family:var(--mono)">' +
          "<tr><td></td>" + grid[0].map(function (_, hr) {
            return '<td style="padding:2px 3px;color:var(--fg-3);text-align:center">' + (hr % 3 === 0 ? hr : "") + "</td>";
          }).join("") + "</tr>" +
          grid.map(function (rowArr, di) {
            return "<tr><td style='padding:2px 8px 2px 0;color:var(--fg-2);text-align:right'>" + DAYS[di] + "</td>" +
              rowArr.map(function (v, hr) {
                var a = maxCell ? v / maxCell : 0;
                var bg = v === 0 ? "var(--bg-3)" : "rgba(99,91,255," + (0.12 + a * 0.78).toFixed(2) + ")";
                return '<td title="' + DAYS[di] + " " + hr + ":00, " + v + ' events" style="width:15px;height:15px;' +
                  "background:" + bg + ';border:1px solid var(--bg)"></td>';
              }).join("") + "</tr>";
          }).join("") + "</table></div>" +
          '<p class="xs muted" style="margin-top:10px">Darker = more events. A flat 24-hour profile suggests ' +
          "an automated or shared number rather than a person.</p></div>";

        // ---- cell footprint
        if (cellList.length) {
          out += '<div class="card"><h3>Cell site footprint</h3>' +
            '<p class="small muted">The most-used cell overnight is usually the residence; the most-used ' +
            "cell in working hours is usually the workplace. Both are inferences to be corroborated, not " +
            "conclusions, a sector can reach several kilometres and the serving cell is not always the nearest.</p>" +
            '<div id="cdr-cells"></div></div>';
        }

        out += '<div class="card"><h3>All records</h3><div id="cdr-all"></div></div>';

        out += '<div class="note info"><b>Next steps this analysis sets up</b><p>Run the same file through ' +
          "the Common Contact Finder against your other suspects' CDRs. Push the cell list into the " +
          "Coordinate Toolkit to map the footprint. Take the brief-use IMEI to the CEIR request builder. " +
          "And confirm the target number against your requisition, the most frequent A-party is a " +
          "heuristic, not a guarantee.</p></div>";

        $("#cdr-out").innerHTML = out;

        TK.mappingPanel($("#cdr-out"), {
          headers: p.headers, spec: TK.SPEC.cdr, result: override ? TK.appliedMap(sm, override) : sm,
          labels: TK.LABELS,
          onApply: function (next) { process(null, next); }
        });

        /* ---- tables ---- */
        TK.table($("#cdr-contacts"), clist, [
          { k: "num", label: "Contact", cls: "mono", fmt: function (v) { return "+91-" + esc(v); } },
          { k: "calls", label: "Calls", cls: "num" },
          { k: "sms", label: "SMS", cls: "num" },
          { k: "out", label: "Out", cls: "num" },
          { k: "in", label: "In", cls: "num" },
          { k: "dur", label: "Talk time", cls: "num", fmt: function (v) { return TK.fmtDur(v); } },
          { k: "night", label: "00-05h", cls: "num", fmt: function (v) {
              return v ? '<span class="badge warn">' + v + "</span>" : "0"; } },
          { k: "first", label: "First", cls: "mono", fmt: function (v) { return esc(TK.fmtDate(v)); } },
          { k: "last", label: "Last", cls: "mono", fmt: function (v) { return esc(TK.fmtDate(v)); } }
        ], { filename: "cdr-contacts", sort: "calls", dir: -1,
             rowClass: function (r) { return r.night > 3 ? "hi" : ""; } });

        if (nightRecs.length) {
          TK.table($("#cdr-night"), nightRecs.map(function (r) {
            return { dt: r.dt, b: r.b, type: r.type, dur: r.dur, site: r.site || r.cell };
          }), [
            { k: "dt", label: "When", cls: "mono", fmt: function (v) { return esc(TK.fmtDate(v)); } },
            { k: "b", label: "Other party", cls: "mono" },
            { k: "type", label: "Type" },
            { k: "dur", label: "Duration", cls: "num", fmt: function (v) { return TK.fmtDur(v); } },
            { k: "site", label: "Cell / site" }
          ], { filename: "cdr-night", pageSize: 200 });
        }

        if (cellList.length) {
          TK.table($("#cdr-cells"), cellList, [
            { k: "cell", label: "Cell ID", cls: "mono" },
            { k: "site", label: "Site / address" },
            { k: "n", label: "Events", cls: "num" },
            { k: "night", label: "Overnight", cls: "num", fmt: function (v) {
                return v ? '<span class="badge info">' + v + "</span>" : "0"; } },
            { k: "lat", label: "Lat", cls: "num mono", fmt: function (v) { return isNaN(v) ? "" : v.toFixed(5); } },
            { k: "lon", label: "Lon", cls: "num mono", fmt: function (v) { return isNaN(v) ? "" : v.toFixed(5); } }
          ], { filename: "cdr-cells", sort: "n", dir: -1 });
        }

        var allCols = p.headers.slice(0, 12).map(function (x) {
          return { k: x, label: x, cls: /id|imei|imsi|no|num|date|time/i.test(x) ? "mono" : "" };
        });
        TK.table($("#cdr-all"), p.rows, allCols, { filename: "cdr-all", pageSize: 300 });

        // stash for the common-contact tool
        window.__lastCDR = { target: target, contacts: clist, name: "CDR " + (target || "?") };
      }
    }
  });

  /* ==========================================================
     Common Contact Finder
     ========================================================== */
  TK.reg({
    id: "common",
    name: "Common Contact Finder",
    cluster: "telecom",
    tier: 2,
    desc: "Intersect two or more CDRs to find the numbers every suspect was in touch with.",
    lede: "Two suspects may never call each other. If both call the same third number, that number is " +
          "worth everything. It usually belongs to " +
          "the organiser or the handler.",
    wide: true,
    legal: {
      authority: "Same as CDR. BNSS 2023 s.94, one requisition per number.",
      caution: "Intersecting records lawfully obtained for one accused with records obtained for another " +
               "is fine. Intersecting them with records obtained for an unrelated case is not, check that " +
               "every file in front of you belongs to this investigation.",
      evidence: "Note in the case diary which requisition each file came from. A conclusion drawn from " +
                "four CDRs needs all four to be provable."
    },
    render: function (root) {
      var sets = [];
      root.innerHTML =
        '<div class="card"><div class="drop" id="cc-drop"><div class="big">↓</div>' +
        "<div>Drop two or more CDR files, or <b>browse</b> (you can add them one at a time)</div></div>" +
        '<div class=\"row\" style=\"margin-top:12px\">' +
        '<button class="btn ghost" id="cc-clear">Clear</button></div>' +
        '<div id="cc-files" style="margin-top:12px"></div></div><div id="cc-out"></div>';

      TK.dropzone($("#cc-drop"), function (files) {
        files.forEach(function (f) { TK.readText(f, function (t) { add(f.name, t); }); });
      }, { accept: ".csv,.tsv,.txt", multiple: true });

      $("#cc-clear").onclick = function () { sets = []; refresh(); };

      function add(name, text) {
        var p = TK.parseTable(text);
        var m = TK.mapColumns(p.headers, CDR_COLS);
        if (!m.a_party || !m.b_party) { TK.toast(name + ": no A/B party columns", "danger"); return; }
        var cOrder = m.datetime
          ? TK.detectDateOrder(p.rows.map(function (r) { return r[m.datetime]; }))
          : { order: "dmy", certain: true };
        var aCount = {}, pairs = {};
        p.rows.forEach(function (r) {
          var a = TK.normNum(r[m.a_party]);
          if (a) aCount[a] = (aCount[a] || 0) + 1;
        });
        var target = Object.keys(aCount).sort(function (x, y) { return aCount[y] - aCount[x]; })[0] || "";
        p.rows.forEach(function (r) {
          var a = TK.normNum(r[m.a_party]), b = TK.normNum(r[m.b_party]);
          var other = a === target ? b : (b === target ? a : b);
          if (!other || other === target) return;
          var e = pairs[other] || (pairs[other] = { n: 0, first: null, last: null });
          e.n++;
          var dt = m.datetime ? TK.parseDate(r[m.datetime], cOrder.order) : null;
          if (dt) { if (!e.first || dt < e.first) e.first = dt; if (!e.last || dt > e.last) e.last = dt; }
        });
        sets.push({ name: name, target: target, pairs: pairs, rows: p.rows.length });
        refresh();
      }

      function refresh() {
        $("#cc-files").innerHTML = sets.length ? sets.map(function (s, i) {
          return '<div class="row tight" style="padding:7px 0;border-bottom:1px solid var(--line)">' +
            '<span class="badge accent">' + (i + 1) + "</span>" +
            "<b>" + esc(s.name) + "</b>" +
            '<span class="mono small">target +91-' + esc(s.target) + "</span>" +
            '<span class="xs muted">' + TK.fmtNum(s.rows) + " rows · " +
            TK.fmtNum(Object.keys(s.pairs).length) + " contacts</span></div>";
        }).join("") : '<p class="xs muted">No files loaded.</p>';

        if (sets.length < 2) {
          $("#cc-out").innerHTML = sets.length === 1
            ? '<div class="note"><b>One file loaded</b><p>Add at least one more to intersect.</p></div>' : "";
          return;
        }

        // intersect
        var all = {};
        sets.forEach(function (s, i) {
          Object.keys(s.pairs).forEach(function (num) {
            var e = all[num] || (all[num] = { num: num, in: [], total: 0, first: null, last: null });
            e.in.push(i);
            e.total += s.pairs[num].n;
            var f = s.pairs[num].first, l = s.pairs[num].last;
            if (f && (!e.first || f < e.first)) e.first = f;
            if (l && (!e.last || l > e.last)) e.last = l;
          });
        });

        var targets = sets.map(function (s) { return s.target; });
        var shared = Object.keys(all).map(function (k) { return all[k]; })
          .filter(function (e) { return e.in.length >= 2; })
          .sort(function (x, y) { return y.in.length - x.in.length || y.total - x.total; });

        // direct links between the targets themselves
        var direct = [];
        sets.forEach(function (s, i) {
          targets.forEach(function (t, j) {
            if (i !== j && s.pairs[t]) direct.push({ from: s.target, to: t, n: s.pairs[t].n });
          });
        });

        var out = '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(sets.length, "CDRs loaded") +
          TK.stat(TK.fmtNum(Object.keys(all).length), "Distinct contacts") +
          TK.stat(shared.length, "Shared by 2+", shared.length ? "danger" : "ok") +
          TK.stat(shared.filter(function (e) { return e.in.length === sets.length; }).length,
                  "Shared by ALL", "danger") +
        "</div>";

        if (direct.length) {
          out += '<div class="note danger"><b>The targets are in direct contact</b><p>' +
            direct.map(function (d) {
              return "+91-" + esc(d.from) + " ↔ +91-" + esc(d.to) + " (" + d.n + " events)";
            }).join("<br>") + "</p><p>Direct contact between accused persons is admissible association " +
            "evidence in its own right, put it in the chargesheet explicitly, with the CDR rows cited.</p></div>";
        }

        if (!shared.length) {
          out += '<div class="note"><b>No shared contacts</b><p>These numbers have no overlap in their ' +
            "contact sets. That is a finding too, it argues against a co-ordinated group, or means the " +
            "co-ordination happened on a channel that does not appear in a CDR (an app, a burner, in person).</p></div>";
        } else {
          out += '<div class="card"><h3>Shared contacts</h3>' +
            '<p class="small muted">A number appearing in every suspect\'s CDR, which none of them is, ' +
            "is the classic sign of an organiser. Sort by how many files it appears in. Then check how " +
            "closely its activity matches the time of the offence.</p><div id=\"cc-tbl\"></div></div>";
        }

        out += '<div class="note info"><b>What to do with a shared number</b><p>Run it through Number ' +
          "Intelligence, requisition its CAF and its own CDR, and check whether its cell footprint overlaps " +
          "the offence location. If the same number also appears in the beneficiary account's registered " +
          "mobile field, you have closed the loop between the phone side and the money side.</p></div>";

        $("#cc-out").innerHTML = out;

        if (shared.length) {
          TK.table($("#cc-tbl"), shared.map(function (e) {
            return {
              num: e.num,
              sets: e.in.length,
              which: e.in.map(function (i) { return String(i + 1); }).join(", "),
              total: e.total,
              first: e.first, last: e.last
            };
          }), [
            { k: "num", label: "Shared contact", cls: "mono", fmt: function (v) { return "+91-" + esc(v); } },
            { k: "sets", label: "In how many CDRs", cls: "num" },
            { k: "which", label: "Which files", cls: "mono" },
            { k: "total", label: "Total events", cls: "num" },
            { k: "first", label: "First seen", cls: "mono", fmt: function (v) { return esc(TK.fmtDate(v)); } },
            { k: "last", label: "Last seen", cls: "mono", fmt: function (v) { return esc(TK.fmtDate(v)); } }
          ], { filename: "shared-contacts", sort: "sets", dir: -1,
               rowClass: function (r) { return r.sets === sets.length ? "flagged" : ""; } });
        }
      }
      refresh();
    }
  });

  /* ==========================================================
     IPDR Analysis
     ========================================================== */
  TK.reg({
    id: "ipdr",
    name: "IPDR Analyser",
    cluster: "telecom",
    tier: 2,
    desc: "Parse internet session records and resolve a public IP + port + timestamp back to a subscriber.",
    lede: "Thousands of " +
          "people share one public IP address today. So the address alone identifies nobody. The port " +
          "number and the exact time are what make it traceable. Most requests forget to ask for them.",
    wide: true,
    legal: {
      authority: "BNSS 2023 s.94 for a historic pull. Ongoing collection of traffic data is IT Act " +
                 "s.69B with the Monitoring and Collecting Traffic Data Rules 2009, a different threshold.",
      threshold: "As with CDR, SP / DCP and above in most states.",
      holder: "Access provider / ISP nodal officer.",
      retention: "Around one year under licence conditions, but NAT translation logs are often the first " +
                 "thing to age out. This is the most perishable evidence in the whole kit.",
      caution: "Without source port AND exact time with timezone, a CGNAT address resolves to hundreds of " +
               "subscribers and the operator will return nil.",
      evidence: "State the timezone in the requisition. Platform logs are usually UTC, operator logs usually " +
                "IST. A silent 5:30 offset has lost cases."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card"><h3>Resolve a single session</h3>' +
        '<p class="small muted">The three things a platform gives you, and what the operator needs back.</p>' +
        '<div class="grid c3">' +
          '<div class="field"><label class="lbl">Public IP</label><input type="text" id="ip-ip" class="mono" placeholder="100.64.12.34"></div>' +
          '<div class="field"><label class="lbl">Source port</label><input type="text" id="ip-port" class="mono" placeholder="49152"></div>' +
          '<div class="field"><label class="lbl">Timestamp</label><input type="text" id="ip-ts" class="mono" placeholder="2026-03-14 09:22:41"></div>' +
        "</div>" +
        '<div class="row"><div class="seg" id="ip-tz"><button class="on" data-tz="UTC">Source is UTC</button>' +
        '<button data-tz="IST">Source is IST</button></div>' +
        '<button class="btn primary" id="ip-go">Check</button></div>' +
        '<div id="ip-single" style="margin-top:14px"></div></div>' +

        fileCard("ipdr", "Drop the IPDR file (CSV / TSV)", "ipdr") + '<div id="ipdr-out"></div>';

      $("#ip-tz").onclick = function (e) {
        var b = e.target.closest("button"); if (!b) return;
        TK.$$("#ip-tz button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
      };

      $("#ip-go").onclick = function () {
        var ip = $("#ip-ip").value.trim(), port = $("#ip-port").value.trim(), ts = $("#ip-ts").value.trim();
        var tz = TK.$("#ip-tz button.on").dataset.tz;
        var probs = [];

        var cgnat = /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip);
        var priv = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);

        if (!ip) probs.push({ k: "danger", t: "No IP address given." });
        if (!port) probs.push({ k: "danger", t: "No source port. Behind CGNAT this request will come back nil, the port is what separates one subscriber from the hundreds sharing the address." });
        if (!ts) probs.push({ k: "danger", t: "No timestamp. NAT bindings are reused within seconds; without the exact time the mapping is ambiguous." });
        else if (!/\d{1,2}:\d{2}:\d{2}/.test(ts)) probs.push({ k: "warn", t: "Timestamp has no seconds. NAT ports are recycled in under a minute, ask the platform for second-level precision." });
        if (priv) probs.push({ k: "danger", t: "This is an RFC 1918 private address. It never appears on the public internet, so no operator can resolve it. You have been given an internal address, go back to the platform for the public one." });
        if (cgnat) probs.push({ k: "warn", t: "RFC 6598 carrier-grade NAT range. Shared by a large number of subscribers. Port and exact time are mandatory, not optional." });

        var d = TK.parseDate(ts);
        var conv = "";
        if (d) {
          var shifted = new Date(d.getTime() + (tz === "UTC" ? 5.5 : -5.5) * 3600000);
          conv = tz === "UTC"
            ? "Given as UTC → <b>" + TK.fmtDate(shifted) + " IST</b>, this is what goes in the requisition."
            : "Given as IST → " + TK.fmtDate(shifted) + " UTC (for cross-checking the platform's own log).";
        }

        $("#ip-single").innerHTML =
          (probs.length
            ? probs.map(function (p) { return '<div class="note ' + p.k + '">' + esc(p.t) + "</div>"; }).join("")
            : '<div class="note ok"><b>Request is well-formed</b><p>IP, port and a second-accurate timestamp, ' +
              "this is resolvable.</p></div>") +
          (conv ? '<div class="note accent"><b>Timezone</b><p>' + conv + "</p></div>" : "") +
          '<div class="copyable"><pre class="out doc">' + esc(
            "You are required to identify the subscriber to whom the following public IP address was\n" +
            "assigned at the exact time stated, and to furnish the associated subscriber details:\n\n" +
            "    Public IP address : " + (ip || "[________]") + "\n" +
            "    Source port       : " + (port || "[________]") + "\n" +
            "    Date and time     : " + (ts || "[________]") + "  (" + tz + ")" +
            (d ? "\n                        = " + TK.fmtDate(new Date(d.getTime() + (tz === "UTC" ? 5.5 : 0) * 3600000)) + " IST" : "") + "\n\n" +
            "Together with:\n" +
            "  (a) the MSISDN, IMSI and IMEI associated with that session;\n" +
            "  (b) the private/internal IP address and the NAT translation record;\n" +
            "  (c) the Customer Acquisition Form and KYC for the subscriber so identified;\n" +
            "  (d) the cell global identity serving the session, with site address and coordinates;\n" +
            "  (e) a certificate under section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023."
          ) + '</pre><button class="btn sm copybtn" data-copy="prev">Copy</button></div>';
      };

      wireFile("ipdr", "ipdr", function (t) { process(t); });

      var lastIpdr = null;

      function process(text, override) {
        if (text) lastIpdr = text;
        var ps = TK.parseSmart(lastIpdr, TK.SPEC.ipdr);
        var p = ps.p, sm = ps.sm;
        if (!p.rows.length) { $("#ipdr-out").innerHTML = '<div class="note danger"><b>No rows found</b></div>'; return; }
        var m = override || sm.map;

        function bytes(r, k) { return m[k] ? TK.parseBytes(r[m[k]]) : 0; }

        var iOrder = m.start
          ? TK.detectDateOrder(p.rows.map(function (r) { return r[m.start]; }))
          : { order: "dmy", certain: true };

        var recs = p.rows.map(function (r) {
          var st = m.start ? TK.parseDate(r[m.start], iOrder.order) : null;
          var en = m.end ? TK.parseDate(r[m.end], iOrder.order) : null;
          var up = bytes(r, "up"), dn = bytes(r, "down");
          return {
            msisdn: m.msisdn ? TK.normNum(r[m.msisdn]) : "",
            imei: m.imei ? String(r[m.imei]).replace(/[^\d]/g, "") : "",
            priv: m.priv_ip ? String(r[m.priv_ip]).trim() : "",
            pub: m.pub_ip ? String(r[m.pub_ip]).trim() : "",
            dest: m.dest_ip ? String(r[m.dest_ip]).trim() : "",
            sport: m.src_port ? String(r[m.src_port]).trim() : "",
            dport: m.dest_port ? String(r[m.dest_port]).trim() : "",
            st: st, en: en,
            dur: (st && en) ? Math.max(0, (en - st) / 1000) : 0,
            up: up, down: dn, total: up + dn || bytes(r, "total"),
            cell: m.cellid ? String(r[m.cellid]).trim() : ""
          };
        });

        var dated = recs.filter(function (r) { return r.st; }).sort(function (a, b) { return a.st - b.st; });
        var totalBytes = recs.reduce(function (s, r) { return s + r.total; }, 0);

        function tally(key) {
          var t = {};
          recs.forEach(function (r) { if (r[key]) t[r[key]] = (t[r[key]] || 0) + 1; });
          return Object.keys(t).map(function (k) { return { v: k, n: t[k] }; })
            .sort(function (a, b) { return b.n - a.n; });
        }
        var pubIPs = tally("pub"), destIPs = tally("dest"), dports = tally("dport");

        // sessions with no port recorded, the fatal gap
        var noPort = recs.filter(function (r) { return !r.sport; }).length;

        var out = parseReport(p) + mapReport(m, p.headers,
          ["msisdn", "pub_ip", "src_port", "start", "up", "down"]);

        out += '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(TK.fmtNum(recs.length), "Sessions") +
          TK.stat(TK.fmtBytes(totalBytes), "Total volume", "accent") +
          TK.stat(pubIPs.length, "Public IPs") +
          TK.stat(noPort ? TK.fmtNum(noPort) : "0", "Missing port", noPort ? "danger" : "ok") +
        "</div>";

        if (noPort) {
          out += '<div class="note danger"><b>' + TK.fmtNum(noPort) + " session(s) have no source port</b>" +
            "<p>These rows cannot be resolved back to a subscriber if the address is behind CGNAT. Go back " +
            "to the provider and ask for the translation record including the translated source port range.</p></div>";
        }
        if (dated.length) {
          out += '<div class="note accent"><b>Session window</b><p>' + TK.fmtDate(dated[0].st) + " → " +
            TK.fmtDate(dated[dated.length - 1].st) + ". Confirm with the provider whether these timestamps " +
            "are IST or UTC before you correlate them with anything from a foreign platform.</p></div>";
        }

        out += '<div class="grid c2">' +
          '<div class="card"><h3>Public IPs used</h3><div id="ipdr-pub"></div></div>' +
          '<div class="card"><h3>Destination ports</h3><div id="ipdr-port"></div></div>' +
        "</div>";

        if (destIPs.length) {
          out += '<div class="card"><h3>Destination addresses</h3>' +
            '<p class="small muted">Push the interesting ones through IP Intelligence to get the ' +
            "registered holder and abuse contact.</p><div id=\"ipdr-dest\"></div></div>";
        }

        out += '<div class="card"><h3>All sessions</h3><div id="ipdr-all"></div></div>';

        $("#ipdr-out").innerHTML = out;

        TK.mappingPanel($("#ipdr-out"), {
          headers: p.headers, spec: TK.SPEC.ipdr, result: override ? TK.appliedMap(sm, override) : sm,
          labels: TK.LABELS,
          onApply: function (next) { process(null, next); }
        });

        TK.table($("#ipdr-pub"), pubIPs, [
          { k: "v", label: "Public IP", cls: "mono" },
          { k: "n", label: "Sessions", cls: "num" }
        ], { pageSize: 25, filename: "ipdr-public-ips" });

        TK.table($("#ipdr-port"), dports.map(function (d) {
          return { v: d.v, n: d.n, svc: PORTS[+d.v] || "" };
        }), [
          { k: "v", label: "Port", cls: "mono" },
          { k: "svc", label: "Usual service" },
          { k: "n", label: "Sessions", cls: "num" }
        ], { pageSize: 25, filename: "ipdr-ports" });

        if (destIPs.length) {
          TK.table($("#ipdr-dest"), destIPs, [
            { k: "v", label: "Destination", cls: "mono" },
            { k: "n", label: "Sessions", cls: "num" }
          ], { pageSize: 50, filename: "ipdr-destinations" });
        }

        TK.table($("#ipdr-all"), recs, [
          { k: "st", label: "Start", cls: "mono", fmt: function (v) { return esc(TK.fmtDate(v)); } },
          { k: "dur", label: "Duration", cls: "num", fmt: function (v) { return v ? TK.fmtDur(v) : ""; } },
          { k: "msisdn", label: "MSISDN", cls: "mono" },
          { k: "priv", label: "Private IP", cls: "mono" },
          { k: "pub", label: "Public IP", cls: "mono" },
          { k: "sport", label: "Src port", cls: "mono num" },
          { k: "dest", label: "Destination", cls: "mono" },
          { k: "dport", label: "Dst port", cls: "mono num" },
          { k: "total", label: "Volume", cls: "num", fmt: function (v) { return v ? TK.fmtBytes(v) : ""; } }
        ], { filename: "ipdr-sessions", pageSize: 300,
             rowClass: function (r) { return r.sport ? "" : "flagged"; } });
      }
    }
  });

  /* ==========================================================
     SMS Header Intelligence
     ========================================================== */
  TK.reg({
    id: "smshdr",
    name: "SMS Header Intelligence",
    cluster: "telecom",
    tier: 1,
    desc: "Check a sender ID against the TRAI DLT grammar and triage the message body for phishing markers.",
    lede: "Every genuine commercial SMS in India uses a registered sender ID with a fixed shape. " +
          "A message that does not fit did not come through a registered route. That is " +
          "usually the fastest answer you can give a victim.",
    badges: ["TRAI DLT"],
    legal: {
      authority: "Analysis of a message the complainant has given you needs no authority.",
      holder: "The registered entity behind a header is traceable through the TSP's DLT records, " +
              "BNSS s.94 to the access provider.",
      caution: "A header matching a known bank string is not proof the bank sent it. Headers are " +
               "spoofable on international SMS routes, which is exactly how most of these arrive.",
      evidence: "Screenshot the message showing the sender ID and the timestamp, and take the handset's " +
                "message database in the forensic image. A retyped message body has no evidentiary value."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
        '<div class="grid c2">' +
          '<div class="field"><label class="lbl">Sender ID / header as it appears on the handset</label>' +
          '<input type="text" id="sms-hdr" class="mono" placeholder="VM-SBIINB"></div>' +
          '<div class="field"><label class="lbl">Received at</label>' +
          '<input type="text" id="sms-when" class="mono" placeholder="14-03-2026 21:40"></div>' +
        "</div>" +
        '<div class="field"><label class="lbl">Message body, paste verbatim</label>' +
        '<textarea id="sms-body" class="mono" style="min-height:110px" placeholder="Dear Customer, your account will be blocked.."></textarea></div>' +
        '<div class="row"><button class="btn primary" id="sms-go">Analyse</button>' +
        '' +
        '</div>' +
        "</div><div id=\"sms-out\"></div>";

      $("#sms-go").onclick = run;

      function run() {
        var hdr = $("#sms-hdr").value.trim().toUpperCase();
        var body = $("#sms-body").value;
        var when = TK.parseDate($("#sms-when").value.trim());
        var findings = [], score = 0;

        /* ---- header ---- */
        if (!hdr) findings.push({ k: "warn", t: "No sender ID given", d: "Ask the complainant for a screenshot showing it." });
        else {
          var m = hdr.match(DLT.pattern);
          if (m) {
            var prefix = m[1], suffix = m[2];
            findings.push({ k: "ok", t: "Header fits the DLT grammar", d: "Prefix " + prefix + " (access provider + circle), entity header " + suffix + "." });
            var cat = DLT.categories[prefix[1]] || DLT.categories[prefix[0]];
            if (cat) findings.push({ k: "info", t: "Category indicator: " + cat, d: "Derived from the prefix, treat as indicative." });
            if (DLT.knownHeaders.indexOf(suffix) !== -1) {
              findings.push({ k: "ok", t: "“" + suffix + "” is a known registered header", d: "Note: known ≠ authentic. Headers are spoofable on international routes." });
            } else {
              findings.push({ k: "warn", t: "“" + suffix + "” is not in the known-header list", d: "Not conclusive, the list here is small. But a header impersonating a bank that is not the bank's real registered string is a strong signal." });
              score += 2;
            }
            // near-miss impersonation
            DLT.knownHeaders.forEach(function (k) {
              if (suffix !== k && (suffix.indexOf(k.slice(0, 4)) === 0 || k.indexOf(suffix.slice(0, 4)) === 0)) {
                findings.push({ k: "danger", t: "Looks like an imitation of “" + k + "”", d: "Near-miss headers are the standard technique, the victim reads the first few characters and stops." });
                score += 3;
              }
            });
          } else {
            score += 4;
            var why = DLT.redFlags.filter(function (f) { return !f.ok && f.re.test(hdr); })[0];
            findings.push({ k: "danger", t: "Header does NOT fit the DLT grammar",
              d: why ? why.msg : "Expected two letters, a hyphen, then 2-6 alphanumerics (e.g. VM-SBIINB)." });
          }
        }

        /* ---- body ---- */
        var urls = body.match(/(?:https?:\/\/|www\.)[^\s<>"']+/gi) || [];
        var phones = body.match(/\b(?:\+?91[\-\s]?)?[6-9]\d{9}\b/g) || [];
        var upis = body.match(/\b[\w.\-]{2,}@[a-z]{2,}\b/gi) || [];

        var shorteners = ["bit.ly", "tinyurl", "t.co", "goo.gl", "rb.gy", "cutt.ly", "is.gd", "shorturl", "rebrand.ly", "tiny.cc"];
        var badTld = [".xyz", ".top", ".click", ".link", ".online", ".site", ".buzz", ".icu", ".cfn", ".rest", ".cam", ".zip", ".mov"];

        urls.forEach(function (u) {
          var low = u.toLowerCase();
          var host = low.replace(/^https?:\/\//, "").split("/")[0];
          if (shorteners.some(function (s) { return host.indexOf(s) !== -1; })) {
            findings.push({ k: "danger", t: "URL shortener: " + host, d: "Hides the real destination. Preserve it and expand it in a sandbox, never on a work machine." }); score += 3;
          }
          if (badTld.some(function (t) { return host.endsWith(t); })) {
            findings.push({ k: "danger", t: "High-abuse TLD: " + host, d: "Cheap registration, heavily used in SMS phishing." }); score += 3;
          }
          if (low.indexOf("http://") === 0) {
            findings.push({ k: "warn", t: "Plain HTTP link", d: "No bank sends an http:// link." }); score += 2;
          }
          if (/(sbi|hdfc|icici|axis|kotak|paytm|phonepe|npci|uidai|rbi)/.test(host) &&
              !/(sbi|hdfc|icici|axisbank|kotak|paytm|phonepe|npci|uidai|rbi)\.(com|co\.in|in|org\.in|gov\.in)$/.test(host)) {
            findings.push({ k: "danger", t: "Brand name in a non-official domain: " + host, d: "The brand appears in the hostname but the registrable domain is not the brand's own." }); score += 4;
          }
        });

        if (/\b(otp|cvv|pin|password|upi\s*pin|mpin)\b/i.test(body)) {
          findings.push({ k: "danger", t: "Asks for a credential", d: "No bank, wallet or government body asks for an OTP, PIN or CVV by SMS. This alone establishes the message is fraudulent." }); score += 4;
        }
        if (/\b(block|blocked|suspend|expire|deactivat|24 hours|immediately|urgent|last date|today)\b/i.test(body)) {
          findings.push({ k: "warn", t: "Manufactured urgency", d: "Deadline pressure is the standard lever, it stops the victim verifying." }); score += 2;
        }
        if (/\b(kyc|re-?kyc|pan\s*card|aadhaar\s*link)\b/i.test(body)) {
          findings.push({ k: "warn", t: "KYC pretext", d: "The most common Indian SMS-phishing pretext by a wide margin." }); score += 2;
        }
        if (/\b(lottery|prize|winner|reward|cashback|refund|lucky)\b/i.test(body)) {
          findings.push({ k: "warn", t: "Reward pretext" }); score += 2;
        }
        if (/(apk|\.apk\b|install.{0,20}app|download.{0,20}app)/i.test(body)) {
          findings.push({ k: "danger", t: "Pushes an app install", d: "APK sideload messages deliver screen-sharing or SMS-forwarding malware. If the victim installed it, seize and image the handset before anything else." }); score += 4;
        }
        if (phones.length) {
          findings.push({ k: "warn", t: "Callback number in the body: " + phones.join(", "),
            d: "Run each through Number Intelligence and requisition the CAF. Callback numbers are often the most traceable element in the whole message." });
        }
        if (upis.length) {
          findings.push({ k: "danger", t: "UPI handle in the body: " + upis.join(", "),
            d: "Resolve the handle to its PSP and requisition the underlying account. This is a direct line to the money." }); score += 2;
        }
        if (when && (when.getHours() >= 22 || when.getHours() < 7)) {
          findings.push({ k: "warn", t: "Sent outside permitted hours",
            d: "Promotional SMS may only be sent 10:00-21:00. Delivery at " +
               (when.getHours() < 10 ? "0" : "") + when.getHours() + ":00 is itself a regulatory breach." }); score += 1;
        }

        var verdict = score >= 8 ? { k: "danger", t: "Almost certainly fraudulent" }
          : score >= 4 ? { k: "warn", t: "Suspicious, verify before acting" }
          : score >= 1 ? { k: "warn", t: "Minor indicators present" }
          : { k: "ok", t: "No phishing markers detected" };

        var out = '<div class="card"><div class="row" style="margin-bottom:14px">' +
          '<span class="badge ' + verdict.k + '" style="font-size:13px;padding:5px 13px">' + esc(verdict.t) + "</span>" +
          '<span class="xs muted mono">indicator score ' + score + "</span></div>" +
          '<div class="bar" style="margin-bottom:16px"><i style="width:' + Math.min(100, score * 8) +
          "%;background:var(--" + (verdict.k === "danger" ? "danger" : verdict.k === "warn" ? "warn" : "ok") + ')"></i></div>' +
          findings.map(function (f) {
            return '<div class="note ' + f.k + '"><b>' + esc(f.t) + "</b>" +
              (f.d ? "<p>" + esc(f.d) + "</p>" : "") + "</div>";
          }).join("") + "</div>";

        if (urls.length) {
          out += '<div class="card"><h3>Extracted indicators</h3>' +
            '<div class="note danger"><b>Do not open these</b><p>Preserve them as text. If they must be ' +
            "examined, do it in an isolated sandbox on a network that is not the police network.</p></div>" +
            '<div class="copyable"><pre class="out">' + esc(urls.concat(phones).concat(upis).join("\n")) +
            '</pre><button class="btn sm copybtn" data-copy="prev">Copy</button></div></div>';
        }

        out += '<div class="card"><h3>What to preserve, and from whom</h3><dl class="kv">' +
          "<dt>Handset</dt><dd>Seize and image it. The SMS database holds the raw header and the true " +
            "receipt timestamp, a screenshot does not.</dd>" +
          "<dt>Access provider</dt><dd>BNSS s.94: delivery records for this header on this date, the " +
            "originating SMSC or international gateway, and the DLT registration behind the header.</dd>" +
          "<dt>Registered entity</dt><dd>If the header is genuinely registered, the principal entity and " +
            "its telemarketer are on record and identifiable.</dd>" +
          "<dt>Domain</dt><dd>Preserve WHOIS/RDAP and hosting details for any URL before the site is taken " +
            "down, see IP Intelligence.</dd>" +
          "<dt>Money</dt><dd>Any UPI handle or account in the body: requisition the PSP and the beneficiary " +
            "bank immediately, and report on the 1930 / NCRP channel to attempt a hold.</dd>" +
        "</dl></div>";

        $("#sms-out").innerHTML = out;
      }
    }
  });

  /* ==========================================================
     Tower dump analysis (Cell Spyder / LBS)
     ========================================================== */
  TK.reg({
    id: "tower",
    name: "Tower Dump Analyser",
    cluster: "telecom",
    tier: 2,
    desc: "Find the handsets present at multiple crime scenes from a set of tower dumps.",
    lede: "A tower dump lists every phone that used a tower in that window. That is thousands of innocent " +
          "people. It only becomes useful when you compare scenes. The small set present at A and B and " +
          "C is your suspect list.",
    wide: true,
    legal: {
      authority: "BNSS 2023 s.94. A tower dump is a bulk collection affecting a large number of " +
                 "uninvolved people, and courts increasingly expect proportionality to be recorded.",
      threshold: "SP / DCP and above in most states, as with CDR.",
      holder: "Access provider, and you need the dump from EVERY operator serving that location, " +
              "not just one.",
      retention: "One year under licence conditions.",
      caution: "Note in the case diary why a dump was necessary, the narrowest window you could use, " +
               "and what you did with the non-suspect data. A dump taken for one offence should not be " +
               "reused for another.",
      evidence: "Presence in a tower dump places a SIM in a sector, not a person at an address. Sectors " +
                "extend for kilometres. It is a lead-generation technique, not proof of presence."
    },
    render: function (root) {
      var dumps = [];
      root.innerHTML =
        '<div class="note warn"><b>Use the narrowest window you can justify</b>' +
        "<p>Every extra minute in the request multiplies the number of uninvolved people whose location " +
        "data you are collecting. Ask for the offence window, not the day.</p></div>" +

        '<div class="card"><div class="drop" id="tw-drop"><div class="big">↓</div>' +
        "<div>Drop two or more tower dumps, one per location, or <b>browse</b></div></div>" +
        '<div class=\"row\" style=\"margin-top:12px\">' +
        '<button class="btn ghost" id="tw-clear">Clear</button></div>' +
        '<div id="tw-files" style="margin-top:12px"></div></div><div id="tw-out"></div>';

      TK.dropzone($("#tw-drop"), function (files) {
        files.forEach(function (f) { TK.readText(f, function (t) { add(f.name, t); }); });
      }, { accept: ".csv,.tsv,.txt", multiple: true });

      $("#tw-clear").onclick = function () { dumps = []; refresh(); };

      function add(name, text) {
        // columns identified from their contents as well as their names
        var ps = TK.parseSmart(text, TK.SPEC.dump);
        var p = ps.p, m = ps.sm.map;
        if (!m.msisdn && !m.imei) { TK.toast(name + ": no MSISDN or IMEI column", "danger"); return; }
        var tOrder = m.dt
          ? TK.detectDateOrder(p.rows.map(function (r) { return r[m.dt]; }))
          : { order: "dmy", certain: true };
        var ids = {};
        p.rows.forEach(function (r) {
          var num = m.msisdn ? TK.normNum(r[m.msisdn]) : "";
          var imei = m.imei ? String(r[m.imei]).replace(/[^\d]/g, "").slice(0, 14) : "";
          var key = num || imei;
          if (!key) return;
          var e = ids[key] || (ids[key] = { num: num, imei: imei, n: 0, first: null, last: null });
          e.n++;
          if (!e.imei && imei) e.imei = imei;
          var dt = m.dt ? TK.parseDate(r[m.dt], tOrder.order) : null;
          if (dt) { if (!e.first || dt < e.first) e.first = dt; if (!e.last || dt > e.last) e.last = dt; }
        });
        dumps.push({ name: name, ids: ids, rows: p.rows.length });
        refresh();
      }

      function refresh() {
        $("#tw-files").innerHTML = dumps.length ? dumps.map(function (d, i) {
          return '<div class="row tight" style="padding:7px 0;border-bottom:1px solid var(--line)">' +
            '<span class="badge accent">' + (i + 1) + "</span><b>" + esc(d.name) + "</b>" +
            '<span class="xs muted">' + TK.fmtNum(d.rows) + " rows · " +
            TK.fmtNum(Object.keys(d.ids).length) + " distinct devices</span></div>";
        }).join("") : '<p class="xs muted">No dumps loaded.</p>';

        if (dumps.length < 2) {
          $("#tw-out").innerHTML = dumps.length === 1
            ? '<div class="note"><b>One dump loaded</b><p>A single dump is a haystack. Add a second location ' +
              "to intersect.</p></div>" : "";
          return;
        }

        var all = {};
        dumps.forEach(function (d, i) {
          Object.keys(d.ids).forEach(function (k) {
            var e = all[k] || (all[k] = { key: k, num: d.ids[k].num, imei: d.ids[k].imei, in: [], total: 0 });
            e.in.push(i); e.total += d.ids[k].n;
            if (!e.imei && d.ids[k].imei) e.imei = d.ids[k].imei;
          });
        });
        var list = Object.keys(all).map(function (k) { return all[k]; });
        var atAll = list.filter(function (e) { return e.in.length === dumps.length; });
        var at2 = list.filter(function (e) { return e.in.length >= 2; });

        var pool = list.length;
        var out = '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(TK.fmtNum(pool), "Devices across all dumps") +
          TK.stat(TK.fmtNum(at2.length), "At 2+ locations", "warn") +
          TK.stat(TK.fmtNum(atAll.length), "At EVERY location", atAll.length ? "danger" : "ok") +
          TK.stat(pool ? (100 * atAll.length / pool).toFixed(2) + "%" : "-", "Narrowed to", "accent") +
        "</div>";

        out += '<div class="note ' + (atAll.length ? "danger" : "") + '"><b>' +
          (atAll.length
            ? atAll.length + " device(s) were present at all " + dumps.length + " locations"
            : "No device appears in every dump") + "</b><p>" +
          (atAll.length
            ? "You have gone from " + TK.fmtNum(pool) + " devices to " + atAll.length +
              ". That is the value of the technique. Now corroborate independently, presence in a sector " +
              "is not presence at the scene, and a delivery rider or a bus route can produce the same pattern."
            : "Either the offender was not carrying a phone, used a different device at each scene, or one " +
              "of the dumps is from the wrong sector or window. Check the cell IDs against the actual scene " +
              "coordinates before concluding anything.") + "</p></div>";

        if (at2.length) out += '<div class="card"><h3>Devices at more than one location</h3><div id="tw-tbl"></div></div>';

        out += '<div class="note info"><b>Before this goes in a report</b><p>For each device in the narrowed ' +
          "set: requisition its full CDR and CAF, check whether its footprint outside the offence windows is " +
          "consistent with an innocent explanation, and look for it in the Common Contact Finder against " +
          "your existing suspects. A single intersection hit is a lead. Corroboration is what makes it evidence.</p></div>";

        $("#tw-out").innerHTML = out;

        if (at2.length) {
          TK.table($("#tw-tbl"), at2.map(function (e) {
            return {
              num: e.num ? "+91-" + e.num : "(IMEI only)",
              imei: e.imei || "",
              locs: e.in.length,
              which: e.in.map(function (i) { return String(i + 1); }).join(", "),
              total: e.total
            };
          }), [
            { k: "num", label: "MSISDN", cls: "mono" },
            { k: "imei", label: "IMEI", cls: "mono" },
            { k: "locs", label: "Locations", cls: "num" },
            { k: "which", label: "Which dumps", cls: "mono" },
            { k: "total", label: "Total events", cls: "num" }
          ], { filename: "tower-intersection", sort: "locs", dir: -1,
               rowClass: function (r) { return r.locs === dumps.length ? "flagged" : "hi"; } });
        }
      }
      refresh();
    }
  });
})();
