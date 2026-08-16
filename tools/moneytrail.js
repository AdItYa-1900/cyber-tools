/* ============================================================
   Money Trail Mapper - multi-statement financial trail analysis

   Multi-statement financial trail analysis: ingest
   several bank statements in different layouts, normalise them to
   one schema, classify each transaction by payment rail, extract
   entities, and reconstruct account-to-account transfers.

   THE MATCHING POLICY IS THE WHOLE POINT.
   A transfer edge is drawn only when a debit in one statement and
   a credit in another share a transaction REFERENCE (UPI txn id /
   RRN, NEFT-RTGS UTR, IMPS reference, cheque number). Matching on
   amount, or on amount+date, is deliberately not done: it produces
   false trails that fall apart under cross-examination. Softer
   pattern hunting belongs in Common Entities.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, $$ = TK.$$, esc = TK.esc;

  /* ---------------------------------------------- money helpers */
  function money(v) {
    if (v === null || v === undefined) return 0;
    var s = String(v).replace(/[₹,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }
  function inr(n) {
    var neg = n < 0; n = Math.abs(n);
    return (neg ? "-₹" : "₹") + n.toLocaleString("en-IN", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }
  function inrShort(n) {
    n = Math.abs(n);
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
    if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "k";
    return "₹" + n.toFixed(0);
  }

  /* ---------------------------------------------- rail classification */
  var RAILS = [
    { id: "UPI",    re: /\bUPI\b|@(?:YBL|IBL|AXL|PAYTM|OK[A-Z]+|APL|UPI)\b/i, cls: "accent" },
    { id: "IMPS",   re: /\bIMPS\b|\bP2A\b|\bP2P\b/i,                          cls: "info" },
    { id: "NEFT",   re: /\bNEFT\b/i,                                          cls: "ok" },
    { id: "RTGS",   re: /\bRTGS\b/i,                                          cls: "ok" },
    { id: "ATM",    re: /\bATM\b|CASH\s*WDL|CASH\s*WITHDRAWAL|\bCWDR\b|\bNWD\b/i, cls: "danger" },
    { id: "CHEQUE", re: /\bCHQ\b|CHEQUE|\bCLG\b|CLEARING/i,                   cls: "warn" },
    { id: "CARD",   re: /\bPOS\b|DEBIT\s*CARD|CREDIT\s*CARD|\bECOM\b/i,       cls: "" },
    { id: "CASH",   re: /\bCASH\s*DEP|BY\s*CASH|\bCASH\b/i,                   cls: "warn" }
  ];
  function railOf(text) {
    for (var i = 0; i < RAILS.length; i++) if (RAILS[i].re.test(text)) return RAILS[i].id;
    return "OTHER";
  }
  function railCls(id) {
    var r = RAILS.filter(function (x) { return x.id === id; })[0];
    return r ? r.cls : "";
  }

  /* ---------------------------------------------- entity extraction */
  var RX = {
    upiId:  /\b[A-Za-z0-9][\w.\-]{1,}@[A-Za-z]{2,}\b/g,
    ifsc:   /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
    mobile: /\b[6-9]\d{9}\b/g
  };

  /* Candidate transaction references.
     Strength matters. A 12-digit UPI transaction id or a 16-22 character
     NEFT UTR is effectively unique, so finding the same one on both sides
     proves the transfer. A bare 6-digit number is NOT: dates written as
     140326, partial account numbers and invoice numbers all collide, and
     one accidental collision draws a transfer that never happened.

     So a short numeric token is accepted only when it comes from the
     dedicated reference/cheque column, or sits next to a word that says
     it is one. Free narration text must clear the higher bar. */
  var REF_WORDS = /\b(CHQ|CHEQUE|CLG|REF|REFNO|UTR|RRN|TXN|TRANSACTION|IMPS|NEFT|RTGS|UPI)\b/;

  function harvest(text, trusted, out) {
    var s = String(text || "").toUpperCase();
    var runs = s.match(/[A-Z0-9]{6,24}/g) || [];
    for (var i = 0; i < runs.length; i++) {
      var t = runs[i];
      if (/X{2,}/.test(t)) continue;                        // masked account
      if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(t)) continue;       // IFSC: an entity, not a reference
      if (/^(19|20)\d{6}$/.test(t)) continue;               // YYYYMMDD date
      var digits = (t.match(/\d/g) || []).length;
      var letters = t.length - digits;
      if (digits < 6) continue;

      var strong =
        (letters === 0 && digits >= 10) ||                  // UPI txn id / RRN
        (letters >= 3 && t.length >= 10);                   // bank UTR, e.g. SBIN2607...

      if (strong) { out[t] = 1; continue; }
      // short or weakly-structured: needs to be vouched for
      if (trusted || REF_WORDS.test(s)) out[t] = 1;
    }
  }

  function refTokens(refField, descField) {
    var out = {};
    harvest(refField, true, out);    // dedicated ref / cheque column
    harvest(descField, false, out);  // free narration
    return Object.keys(out);
  }

  /* ---------------------------------------------- statement ingestion */
  function readHeaderMeta(text) {
    // Bank preambles state the account, holder and IFSC before the table.
    var head = text.split(/\r\n|\n|\r/).slice(0, 12).join("\n");
    function grab(re) { var m = head.match(re); return m ? m[1].trim() : ""; }
    return {
      bank:   grab(/^([A-Z][A-Za-z&.\s]{3,40}(?:BANK|BANK LTD|LIMITED)[A-Za-z.\s]*)/m),
      acct:   grab(/account\s*(?:no\.?|number)?\s*[,:]\s*([A-Za-z0-9*X\-]{4,})/i),
      name:   grab(/(?:account\s*name|customer\s*name|name)\s*[,:]\s*([^\n,]{2,60})/i),
      ifsc:   grab(/ifsc\s*(?:code)?\s*[,:]\s*([A-Z]{4}0[A-Z0-9]{6})/i),
      period: grab(/(?:statement\s*)?period\s*[,:]\s*([^\n]{4,60})/i)
    };
  }

  function ingest(name, text) {
    var ps = TK.parseSmart(text, TK.SPEC.stmt);
    var p = ps.p;
    if (!p.rows.length) return { name: name, error: "No data rows found", rows: [] };

    var m = ps.sm.map;

    var meta = readHeaderMeta(text);
    var label = meta.acct || name;

    var mOrder = m.date
      ? TK.detectDateOrder(p.rows.map(function (r) { return r[m.date]; }))
      : { order: "dmy", certain: true };

    var rows = p.rows.map(function (r, i) {
      var dr = m.debit ? money(r[m.debit]) : 0;
      var cr = m.credit ? money(r[m.credit]) : 0;
      if (!m.debit && !m.credit && m.amount) {
        var a = money(r[m.amount]);
        var t = (m.type ? String(r[m.type]) : "").toUpperCase();
        if (/^(D|DR|DEBIT|W)/.test(t) || a < 0) dr = Math.abs(a); else cr = Math.abs(a);
      }
      var desc = m.desc ? String(r[m.desc]) : "";
      var ref  = m.ref ? String(r[m.ref]) : "";
      var chq  = m.chq ? String(r[m.chq]) : "";
      var blob = [desc, ref, chq].join(" ");
      return {
        i: i,
        stmt: label,
        dt: m.date ? TK.parseDate(r[m.date], mOrder.order) : null,
        desc: desc,
        ref: ref || chq,
        dr: dr, cr: cr,
        bal: m.bal ? money(r[m.bal]) : null,
        rail: railOf(blob),
        tokens: refTokens((ref || chq), desc),
        upi: (blob.match(RX.upiId) || []).map(function (x) { return x.toLowerCase(); }),
        ifsc: (blob.match(RX.ifsc) || []),
        mob: (blob.match(RX.mobile) || []),
        blob: blob
      };
    });

    return {
      name: name, label: label, meta: meta, headers: p.headers,
      mapped: Object.keys(m).length, parseMeta: p.meta, rows: rows
    };
  }

  /* ---------------------------------------------- BS2BS matching */
  function matchTransfers(stmts) {
    // index every credit row by each of its reference tokens
    var creditIdx = {};
    stmts.forEach(function (s, si) {
      s.rows.forEach(function (r) {
        if (r.cr <= 0) return;
        r.tokens.forEach(function (t) {
          (creditIdx[t] = creditIdx[t] || []).push({ si: si, row: r });
        });
      });
    });

    var edges = [], seen = {};
    stmts.forEach(function (s, si) {
      s.rows.forEach(function (r) {
        if (r.dr <= 0) return;
        r.tokens.forEach(function (t) {
          (creditIdx[t] || []).forEach(function (c) {
            if (c.si === si) return;                        // same statement
            var key = si + ":" + r.i + ">" + c.si + ":" + c.row.i;
            if (seen[key]) return;
            seen[key] = 1;
            edges.push({
              from: s.label, to: stmts[c.si].label,
              fromFile: s.name, toFile: stmts[c.si].name,
              token: t,
              debit: r.dr, credit: c.row.cr,
              amountAgrees: Math.abs(r.dr - c.row.cr) < 0.01,
              dtOut: r.dt, dtIn: c.row.dt,
              rail: r.rail !== "OTHER" ? r.rail : c.row.rail,
              descOut: r.desc, descIn: c.row.desc
            });
          });
        });
      });
    });
    return edges;
  }

  /* ---------------------------------------------- layered graph layout */
  function layout(nodes, edges) {
    var idx = {}, indeg = {};
    nodes.forEach(function (n) { idx[n] = { in: [], out: [] }; indeg[n] = 0; });
    edges.forEach(function (e) {
      if (!idx[e.from] || !idx[e.to] || e.from === e.to) return;
      idx[e.from].out.push(e.to); idx[e.to].in.push(e.from);
    });
    nodes.forEach(function (n) {
      var seenN = {};
      idx[n].in.forEach(function (p) { seenN[p] = 1; });
      indeg[n] = Object.keys(seenN).length;
    });

    // longest-path layering, cycle-safe
    var level = {}, guard = 0;
    nodes.forEach(function (n) { level[n] = indeg[n] === 0 ? 0 : -1; });
    var changed = true;
    while (changed && guard++ < 40) {
      changed = false;
      edges.forEach(function (e) {
        if (e.from === e.to) return;
        var lf = level[e.from];
        if (lf < 0) return;
        if (level[e.to] < lf + 1) { level[e.to] = lf + 1; changed = true; }
      });
    }
    nodes.forEach(function (n) { if (level[n] < 0) level[n] = 0; });

    var byLevel = {};
    nodes.forEach(function (n) { (byLevel[level[n]] = byLevel[level[n]] || []).push(n); });
    return { level: level, byLevel: byLevel, maxLevel: Math.max.apply(null, nodes.map(function (n) { return level[n]; })) };
  }

  function drawGraph(stmts, edges) {
    var nodes = stmts.map(function (s) { return s.label; });
    if (!nodes.length) return TK.empty("Nothing to draw.", "◌");

    var L = layout(nodes, edges);
    var W = 100, ROW = 118, NW = 190, NH = 60;
    var levels = Object.keys(L.byLevel).map(Number).sort(function (a, b) { return a - b; });
    var maxPer = Math.max.apply(null, levels.map(function (l) { return L.byLevel[l].length; }));
    var width = Math.max(660, maxPer * (NW + 46));
    var height = (L.maxLevel + 1) * ROW + 40;

    var pos = {};
    levels.forEach(function (l) {
      var arr = L.byLevel[l];
      arr.forEach(function (n, i) {
        pos[n] = {
          x: width / 2 + (i - (arr.length - 1) / 2) * (NW + 46),
          y: 30 + l * ROW
        };
      });
    });

    // collapse parallel edges between the same pair
    var pair = {};
    edges.forEach(function (e) {
      if (e.from === e.to) return;
      var k = e.from + "␟" + e.to;
      var p = pair[k] || (pair[k] = { from: e.from, to: e.to, n: 0, amt: 0, rails: {} });
      p.n++; p.amt += e.debit; p.rails[e.rail] = 1;
    });

    var svg = '<svg viewBox="0 0 ' + width + " " + height + '" width="100%" ' +
      'style="min-width:' + Math.min(width, 900) + 'px;height:auto;overflow:visible" ' +
      'role="img" aria-label="Account transfer graph">' +
      '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" ' +
      'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/></marker></defs>';

    Object.keys(pair).forEach(function (k) {
      var p = pair[k], a = pos[p.from], b = pos[p.to];
      if (!a || !b) return;
      var x1 = a.x, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y - NH / 2;
      if (Math.abs(y2 - y1) < 4) { y1 = a.y; y2 = b.y; }
      var mid = (y1 + y2) / 2;
      var d = "M" + x1 + " " + y1 + " C" + x1 + " " + mid + " " + x2 + " " + mid + " " + x2 + " " + y2;
      svg += '<path d="' + d + '" fill="none" stroke="var(--accent)" stroke-width="1.8" ' +
        'opacity=".65" marker-end="url(#ah)"/>' +
        '<text x="' + ((x1 + x2) / 2) + '" y="' + (mid - 4) + '" text-anchor="middle" ' +
        'font-family="var(--mono)" font-size="10.5" fill="var(--fg-2)">' +
        esc(inrShort(p.amt)) + (p.n > 1 ? " ×" + p.n : "") + "</text>";
    });

    nodes.forEach(function (n) {
      var p = pos[n];
      var s = stmts.filter(function (x) { return x.label === n; })[0] || {};
      var nm = (s.meta && s.meta.name) || "";
      svg += '<g><rect x="' + (p.x - NW / 2) + '" y="' + (p.y - NH / 2) + '" width="' + NW +
        '" height="' + NH + '" rx="11" fill="var(--bg-2)" stroke="var(--line-2)"/>' +
        '<text x="' + p.x + '" y="' + (p.y - 6) + '" text-anchor="middle" font-family="var(--mono)" ' +
        'font-size="12" font-weight="600" fill="var(--fg)">' + esc(n) + "</text>" +
        '<text x="' + p.x + '" y="' + (p.y + 12) + '" text-anchor="middle" ' +
        'font-size="10.5" fill="var(--fg-3)">' + esc((nm || "").slice(0, 26)) + "</text></g>";
    });

    return '<div style="overflow-x:auto">' + svg + "</svg></div>";
  }

  /* ============================================================ tool */
  TK.reg({
    id: "moneytrail",
    name: "Money Trail Mapper",
    cluster: "money",
    tier: 2,
    desc: "Load many bank statements at once, normalise them, and reconstruct account-to-account transfers by reference number.",
    lede: "Load statements from different banks in whatever layout they arrived. You get one " +
          "clean table, a breakdown by payment type, and a transfer diagram built only " +
          "from matching reference numbers. Never from amounts alone.",
    badges: ["Multi-statement", "Reference-matched", "Offline"],
    wide: true,
    render: function (root) {
      var stmts = [], view = "overview";

      root.innerHTML =
        '<div class="card"><div class="drop" id="ar-drop"><div class="big"></div>' +
        "<div>Drop bank statements, several at once, or <b>browse</b></div>" +
        '<div class="xs muted" style="margin-top:8px">CSV, TSV or TXT. Parsed on this machine; nothing is uploaded.</div></div>' +
        '<div class="row" style="margin-top:12px">' +
          '' +
          '<button class="btn ghost" id="ar-clear">Clear all</button>' +
        "</div>" +
        '<div id="ar-files" style="margin-top:14px"></div></div>' +
        '<div id="ar-body"></div>';

      TK.dropzone($("#ar-drop"), function (files) {
        files.forEach(function (f) {
          if (/\.(pdf|xlsx|xls)$/i.test(f.name)) {
            TK.toast(f.name + ": export as CSV first", "danger");
            return;
          }
          TK.readText(f, function (t) { add(f.name, t); });
        });
      }, { accept: ".csv,.tsv,.txt,.html", multiple: true });

      $("#ar-clear").onclick = function () { stmts = []; refresh(); };

      function add(name, text, defer) {
        var st = ingest(name, text);
        if (st.error) { TK.toast(name + ": " + st.error, "danger"); return; }
        stmts.push(st);
        if (!defer) refresh();
      }

      /* ---------------- file list ---------------- */
      function fileList() {
        if (!stmts.length) return '<p class="xs muted">No statements loaded.</p>';
        return stmts.map(function (s, i) {
          var dr = s.rows.reduce(function (a, r) { return a + r.dr; }, 0);
          var cr = s.rows.reduce(function (a, r) { return a + r.cr; }, 0);
          return '<div class="row tight" style="padding:9px 0;border-bottom:1px solid var(--line)">' +
            '<span class="badge accent">' + (i + 1) + "</span>" +
            "<b>" + esc(s.label) + "</b>" +
            (s.meta.name ? '<span class="small muted">' + esc(s.meta.name) + "</span>" : "") +
            (s.meta.ifsc ? '<span class="badge">' + esc(s.meta.ifsc) + "</span>" : "") +
            '<span class="grow"></span>' +
            '<span class="xs muted mono">' + esc(s.name) + " · " + s.rows.length + " txn · " +
            "Dr " + esc(inrShort(dr)) + " · Cr " + esc(inrShort(cr)) + "</span></div>";
        }).join("");
      }

      /* ---------------- views ---------------- */
      function refresh() {
        $("#ar-files").innerHTML = fileList();
        var body = $("#ar-body");

        if (!stmts.length) { body.innerHTML = ""; return; }

        var all = [];
        stmts.forEach(function (s) { all = all.concat(s.rows); });
        var edges = matchTransfers(stmts);

        body.innerHTML =
          '<div class="row" style="margin-bottom:16px"><div class="seg" id="ar-view">' +
            '<button data-v="overview">Overview</button>' +
            '<button data-v="bs2bs">BS2BS transfers</button>' +
            '<button data-v="txn">Transactions</button>' +
            '<button data-v="common">Common entities</button>' +
            '<button data-v="search">Global search</button>' +
          "</div></div><div id=\"ar-view-body\"></div>";

        $$("#ar-view button").forEach(function (b) {
          b.classList.toggle("on", b.dataset.v === view);
          b.onclick = function () { view = b.dataset.v; refresh(); };
        });

        var vb = $("#ar-view-body");
        if (view === "overview") renderOverview(vb, all, edges);
        else if (view === "bs2bs") renderBs2bs(vb, edges);
        else if (view === "txn") renderTxn(vb, all);
        else if (view === "common") renderCommon(vb);
        else renderSearch(vb, all);
      }

      /* ---- overview ---- */
      function renderOverview(vb, all, edges) {
        var dr = all.reduce(function (a, r) { return a + r.dr; }, 0);
        var cr = all.reduce(function (a, r) { return a + r.cr; }, 0);
        var rails = {};
        all.forEach(function (r) { rails[r.rail] = (rails[r.rail] || 0) + 1; });
        var railList = Object.keys(rails).sort(function (a, b) { return rails[b] - rails[a]; });
        var maxRail = Math.max.apply(null, railList.map(function (k) { return rails[k]; }));

        var unmapped = stmts.filter(function (s) { return s.mapped < 4; });
        var noDate = all.filter(function (r) { return !r.dt; }).length;

        var h = '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(stmts.length, "Statements") +
          TK.stat(TK.fmtNum(all.length), "Transactions") +
          TK.stat(inrShort(cr), "Total credited", "ok") +
          TK.stat(inrShort(dr), "Total debited", "danger") +
        "</div>" +
        '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(edges.length, "Matched transfers", edges.length ? "accent" : "") +
          TK.stat(new Set(edges.map(function (e) { return e.from + ">" + e.to; })).size, "Account pairs") +
          TK.stat(inrShort(edges.reduce(function (a, e) { return a + e.debit; }, 0)), "Traced value", "accent") +
          TK.stat(noDate ? TK.fmtNum(noDate) : "0", "Rows without a date", noDate ? "warn" : "ok") +
        "</div>";

        if (unmapped.length) {
          h += '<div class="note warn"><b>' + unmapped.length + " statement(s) only partly recognised</b>" +
            "<p>" + unmapped.map(function (s) {
              return esc(s.name) + ", headers: <span class='mono xs'>" + esc(s.headers.join(" · ")) + "</span>";
            }).join("<br>") + "</p><p class='xs'>Rename the offending header in the file and re-drop it.</p></div>";
        }

        h += '<div class="grid c2">' +
          '<div class="card"><h3>Payment rails</h3>' +
          '<div class="stack">' + railList.map(function (k) {
            return '<div><div class="row tight" style="margin-bottom:4px">' +
              '<span class="badge ' + railCls(k) + '">' + esc(k) + "</span>" +
              '<span class="xs muted mono">' + rails[k] + " txn</span></div>" +
              '<div class="bar"><i style="width:' + (100 * rails[k] / maxRail) + '%"></i></div></div>';
          }).join("") + "</div></div>" +

          '<div class="card"><h3>Accounts in this case</h3>' +
          '<div class="stack">' + stmts.map(function (s) {
            var out = edges.filter(function (e) { return e.from === s.label; });
            var inc = edges.filter(function (e) { return e.to === s.label; });
            return '<div style="padding:9px 0;border-bottom:1px solid var(--line)">' +
              '<div class="row tight"><b class="mono">' + esc(s.label) + "</b>" +
              (s.meta.name ? '<span class="small">' + esc(s.meta.name) + "</span>" : "") + "</div>" +
              '<div class="xs muted" style="margin-top:3px">' +
              (s.meta.bank ? esc(s.meta.bank) + " · " : "") +
              (s.meta.ifsc ? esc(s.meta.ifsc) + " · " : "") +
              "sent to " + new Set(out.map(function (e) { return e.to; })).size + " · " +
              "received from " + new Set(inc.map(function (e) { return e.from; })).size + "</div></div>";
          }).join("") + "</div></div></div>";

        h += '<div class="note info"><b>Where the money went</b><p>' +
          (edges.length
            ? "Open <b>BS2BS transfers</b> for the graph and the export-ready table. " +
              edges.length + " transfer(s) between loaded accounts were matched on a shared reference."
            : "No transfers were matched between the loaded statements. Either these accounts did not " +
              "transact with each other, or the reference numbers are absent from the narration, in which " +
              "case ask the bank for the statement with the UTR / RRN column populated.") + "</p></div>";

        vb.innerHTML = h;
      }

      /* ---- BS2BS ---- */
      function renderBs2bs(vb, edges) {
        if (!edges.length) {
          vb.innerHTML = '<div class="note warn"><b>No reference-matched transfers</b>' +
            "<p>Nothing is drawn unless a debit in one statement and a credit in another carry the same " +
            "transaction reference. That is deliberate, see the matching policy below.</p></div>" +
            policyCard();
          return;
        }

        var mismatch = edges.filter(function (e) { return !e.amountAgrees; });

        vb.innerHTML =
          '<div class="card"><h3>Transfer graph</h3>' +
          '<p class="small muted">Source accounts at the top, destinations below. Edge labels show the ' +
          "total value matched between that pair.</p>" +
          drawGraph(stmts, edges) + "</div>" +

          (mismatch.length ? '<div class="note warn"><b>' + mismatch.length +
            " transfer(s) matched on reference but the amounts differ</b><p>Usually a fee or a partial " +
            "settlement. Worth a look before it goes in a report, the reference is the join, so these are " +
            "still the same transaction.</p></div>" : "") +

          '<div class="card"><h3>Matched transfers</h3>' +
          '<p class="small muted">Every transfer, with the reference number that proves it. Export this as your ' +
          "exhibit.</p><div id=\"ar-bs-tbl\"></div></div>" +
          policyCard();

        TK.table($("#ar-bs-tbl"), edges.map(function (e) {
          return {
            from: e.from, to: e.to, rail: e.rail, token: e.token,
            amt: e.debit,
            agree: e.amountAgrees ? "yes" : "differs (" + inr(e.credit) + " in)",
            when: e.dtOut || e.dtIn,
            desc: e.descOut
          };
        }), [
          { k: "from", label: "From account", cls: "mono" },
          { k: "to", label: "To account", cls: "mono" },
          { k: "rail", label: "Rail", fmt: function (v) {
              return '<span class="badge ' + railCls(v) + '">' + esc(v) + "</span>"; } },
          { k: "token", label: "Matching reference", cls: "mono" },
          { k: "amt", label: "Amount", cls: "num", fmt: function (v) { return esc(inr(v)); } },
          { k: "agree", label: "Amounts agree", fmt: function (v) {
              return v === "yes" ? '<span class="badge ok">yes</span>'
                : '<span class="badge warn">' + esc(v) + "</span>"; } },
          { k: "when", label: "Date", cls: "mono", fmt: function (v) { return esc(TK.fmtDate(v)); } },
          { k: "desc", label: "Narration", w: "230px" }
        ], { filename: "bs2bs-transfers", sort: "amt", dir: -1 });
      }

      function policyCard() {
        return '<div class="card"><h3>What gets matched, and what deliberately does not</h3>' +
          '<div class="grid c2">' +
          '<div><h4 style="color:var(--ok)">Treated as a match</h4><ul class="small" style="margin:0;padding-left:18px;line-height:1.9">' +
            "<li>Same UPI transaction ID / RRN on both sides</li>" +
            "<li>Same NEFT / RTGS UTR</li>" +
            "<li>Same IMPS reference number</li>" +
            "<li>Same cheque number</li>" +
            "<li>Explicitly labelled Ref. No. / Txn ID matching</li></ul></div>" +
          '<div><h4 style="color:var(--danger)">Deliberately not matched</h4><ul class="small" style="margin:0;padding-left:18px;line-height:1.9">' +
            "<li>Same amount with no shared ID, too noisy</li>" +
            "<li>Similar dates or descriptions alone</li>" +
            "<li>Round-amount coincidences (₹50,000)</li>" +
            "<li>IFSC codes, an entity, not a transaction id</li>" +
            "<li>Masked account numbers</li></ul></div></div>" +
          '<div class="note accent" style="margin-top:14px"><b>Why the strictness matters</b>' +
          "<p>Every arrow here can be proved. You can point to the same reference number in both statements, and " +
          "the bank can confirm it. Matching on amount alone falls apart the moment the defence " +
          "finds two unrelated transfers of ₹50,000 on the same day. Use <b>Common entities</b> for looser " +
          "pattern hunting.</p></div></div>";
      }

      /* ---- transactions ---- */
      function renderTxn(vb, all) {
        vb.innerHTML = '<div class="card"><h3>All transactions, normalised</h3>' +
          '<p class="small muted">Every statement reduced to the same columns regardless of the layout it ' +
          "arrived in.</p><div id=\"ar-txn-tbl\"></div></div>";

        TK.table($("#ar-txn-tbl"), all, [
          { k: "stmt", label: "Account", cls: "mono" },
          { k: "dt", label: "Date", cls: "mono", fmt: function (v) { return esc(TK.fmtDate(v)); } },
          { k: "desc", label: "Description", w: "280px" },
          { k: "rail", label: "Rail", fmt: function (v) {
              return '<span class="badge ' + railCls(v) + '">' + esc(v) + "</span>"; } },
          { k: "ref", label: "Reference", cls: "mono" },
          { k: "dr", label: "Debit", cls: "num", fmt: function (v) {
              return v ? '<span style="color:var(--danger)">' + esc(inr(v)) + "</span>" : ""; } },
          { k: "cr", label: "Credit", cls: "num", fmt: function (v) {
              return v ? '<span style="color:var(--ok)">' + esc(inr(v)) + "</span>" : ""; } },
          { k: "bal", label: "Balance", cls: "num", fmt: function (v) { return v === null ? "" : esc(inr(v)); } }
        ], { filename: "normalised-transactions", pageSize: 300 });
      }

      /* ---- common entities ---- */
      function renderCommon(vb) {
        var kinds = [
          { k: "upi", label: "UPI IDs" },
          { k: "ifsc", label: "IFSC codes" },
          { k: "mob", label: "Mobile numbers" }
        ];
        var h = '<div class="note info"><b>Softer matching lives here</b><p>These are values that appear in ' +
          "more than one statement. Unlike a BS2BS edge, a shared entity is not proof that money moved, it " +
          "is a lead telling you two accounts touch the same person, handle or branch.</p></div>";

        var any = false;
        kinds.forEach(function (kind) {
          var idx = {};
          stmts.forEach(function (s) {
            s.rows.forEach(function (r) {
              (r[kind.k] || []).forEach(function (v) {
                var e = idx[v] || (idx[v] = { v: v, stmts: {}, n: 0 });
                e.stmts[s.label] = 1; e.n++;
              });
            });
          });
          var shared = Object.keys(idx).map(function (k) { return idx[k]; })
            .filter(function (e) { return Object.keys(e.stmts).length >= 2; })
            .sort(function (a, b) { return Object.keys(b.stmts).length - Object.keys(a.stmts).length || b.n - a.n; });
          if (!shared.length) return;
          any = true;
          h += '<div class="card"><h3>' + esc(kind.label) + " shared across statements</h3>" +
            shared.map(function (e) {
              return '<div class="row tight" style="padding:8px 0;border-bottom:1px solid var(--line)">' +
                '<span class="badge danger">' + Object.keys(e.stmts).length + " statements</span>" +
                '<b class="mono">' + esc(e.v) + "</b>" +
                '<span class="xs muted mono">' + esc(Object.keys(e.stmts).join("  ·  ")) + "</span></div>";
            }).join("") + "</div>";
        });

        if (!any) h += TK.empty("No entity appears in two or more statements.", "◌");
        vb.innerHTML = h;
      }

      /* ---- global search ---- */
      function renderSearch(vb, all) {
        vb.innerHTML = '<div class="card"><h3>Search every loaded statement</h3>' +
          '<p class="small muted">Any value, a mobile number, a UPI handle, a name, an IFSC, part of a ' +
          "narration, across all " + stmts.length + " files at once.</p>" +
          '<div class="field"><input type="text" id="ar-q" class="mono" placeholder="e.g. mule2@ybl, 445566, KIRANN, ATM"></div>' +
          '<div id="ar-q-out"></div></div>';

        var box = $("#ar-q");
        box.addEventListener("input", function () {
          var q = box.value.trim().toLowerCase();
          var out = $("#ar-q-out");
          if (q.length < 2) { out.innerHTML = '<p class="xs muted">Type at least two characters.</p>'; return; }
          var hits = all.filter(function (r) {
            return (r.blob + " " + r.stmt).toLowerCase().indexOf(q) !== -1;
          });
          if (!hits.length) { out.innerHTML = TK.empty("No match for “" + esc(q) + "”.", "∅"); return; }
          var byStmt = {};
          hits.forEach(function (r) { byStmt[r.stmt] = (byStmt[r.stmt] || 0) + 1; });
          out.innerHTML = '<div class="row tight" style="margin-bottom:12px">' +
            '<span class="badge accent">' + hits.length + " rows</span>" +
            Object.keys(byStmt).map(function (k) {
              return '<span class="badge">' + esc(k) + ": " + byStmt[k] + "</span>";
            }).join("") + "</div><div id=\"ar-q-tbl\"></div>";
          TK.table($("#ar-q-tbl"), hits, [
            { k: "stmt", label: "Account", cls: "mono" },
            { k: "dt", label: "Date", cls: "mono", fmt: function (v) { return esc(TK.fmtDate(v)); } },
            { k: "desc", label: "Description", w: "300px" },
            { k: "rail", label: "Rail", fmt: function (v) {
                return '<span class="badge ' + railCls(v) + '">' + esc(v) + "</span>"; } },
            { k: "dr", label: "Debit", cls: "num", fmt: function (v) { return v ? esc(inr(v)) : ""; } },
            { k: "cr", label: "Credit", cls: "num", fmt: function (v) { return v ? esc(inr(v)) : ""; } }
          ], { filename: "search-results", pageSize: 200 });
        });
      }

      refresh();
    }
  });
})();
