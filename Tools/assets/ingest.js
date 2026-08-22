/* ============================================================
   Sutra - smart ingestion

   The problem this solves: every operator, bank and department
   names its columns differently. "Calling Party", "A Party",
   "Party A", "Mob No", "Sub No", "MSISDN", "Ph" are all the same
   field. Matching on the header name alone fails constantly, and
   the officer is left with a tool that says "column not recognised"
   and no way forward.

   So this reads the DATA, not just the heading. A column whose
   values are overwhelmingly ten digits starting 6-9 is a mobile
   number, whatever the heading says. A column that parses as dates
   is a date column. Header names still count, but as one piece of
   evidence rather than the only one.

   Two rules keep this safe for evidence work:

     1. Nothing is hidden. Whatever is inferred is shown on screen
        with its confidence and the reason, and can be corrected
        with a dropdown. Silent auto-correction in an evidence tool
        would be worse than failing loudly.

     2. Content beats a misleading header. If a column called
        "Duration" contains dates, it is treated as dates and the
        disagreement is reported.
   ============================================================ */
(function () {
  "use strict";

  var TK = window.TK;

  /* ---------------------------------------------- value detectors
     Each returns true when a single cell looks like that kind of
     value. Kept deliberately strict: a loose detector poisons the
     column profile.                                              */

  function digits(v) { return String(v).replace(/[^\d]/g, ""); }

  var DET = {
    msisdn: function (v) {
      var d = digits(v);
      if (d.length > 10 && d.slice(0, 2) === "91") d = d.slice(2);
      d = d.replace(/^0+/, "");
      return d.length === 10 && /^[6-9]/.test(d);
    },
    landline: function (v) {
      var d = digits(v);
      return d.length >= 8 && d.length <= 11 && /^0?[1-5]/.test(d);
    },
    imei: function (v) {
      var d = digits(v);
      return (d.length === 14 || d.length === 15 || d.length === 16) && !/^0+$/.test(d);
    },
    imsi: function (v) {
      var d = digits(v);
      return d.length === 15 && /^(40[456]|[2-7]\d\d)/.test(d);
    },
    datetime: function (v) {
      var s = String(v).trim();
      if (!s || /^\d+$/.test(s) && s.length < 8) return false;
      return TK.parseDate(s) !== null;
    },
    timeonly: function (v) { return /^\d{1,2}:\d{2}(:\d{2})?$/.test(String(v).trim()); },
    duration: function (v) {
      var s = String(v).trim();
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return true;
      return /^\d{1,6}$/.test(s) && +s <= 86400;
    },
    calltype: function (v) {
      return /^(in|out|inc|outg|incoming|outgoing|moc|mtc|mo|mt|og|ic|a2b|b2a|sms|sms-in|sms-out|call|voice|data|cw|cf)\b/i
        .test(String(v).trim());
    },
    drcr: function (v) { return /^(dr|cr|debit|credit|d|c|w|withdrawal|deposit)$/i.test(String(v).trim()); },
    ipv4: function (v) {
      var s = String(v).trim();
      return /^\d{1,3}(\.\d{1,3}){3}$/.test(s) &&
        s.split(".").every(function (o) { return +o <= 255; });
    },
    port: function (v) { return /^\d{1,5}$/.test(String(v).trim()) && +v <= 65535 && +v > 0; },
    ifsc: function (v) { return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(v).trim().toUpperCase()); },
    upi: function (v) { return /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(String(v).trim()); },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); },
    mac: function (v) {
      var h = String(v).replace(/[^0-9a-fA-F]/g, "");
      return h.length === 12 && /[:.\-]/.test(String(v));
    },
    lat: function (v) {
      var n = parseFloat(v);
      return !isNaN(n) && n >= 6 && n <= 38 && /\./.test(String(v));
    },
    lon: function (v) {
      var n = parseFloat(v);
      return !isNaN(n) && n >= 67 && n <= 98 && /\./.test(String(v));
    },
    /* An amount, not merely a number. Serial-number and code columns
       ("S No." holding 1, 2, 3; a branch code of 0451) are numeric but
       are not money, and treating them as such lets a serial column be
       mistaken for the running balance. So require an actual sign of
       currency: paise, grouped thousands, a symbol, or a value large
       enough to be a real transaction. */
    money: function (v) {
      var s = String(v).trim();
      if (!s) return false;
      if (!/^[₹Rs.\s]*-?[\d,]+(\.\d{1,2})?\s*(cr|dr)?$/i.test(s)) return false;
      if (/₹|rs/i.test(s)) return true;
      if (/,\d{2,3}/.test(s)) return true;              // 1,23,456 or 1,234
      if (/\.\d{2}$/.test(s)) return true;              // paise
      var bare = s.replace(/[^\d]/g, "");
      if (bare.length > 9) return false;        // 412345678901 is a reference
      var n = parseFloat(s.replace(/[^\d.\-]/g, ""));
      return !isNaN(n) && Math.abs(n) >= 1000;
    },
    bytes: function (v) {
      var s = String(v).trim();
      return /^\d{2,}$/.test(s) || /^[\d.]+\s*(k|m|g|t)b?$/i.test(s);
    },
    cellid: function (v) {
      var s = String(v).trim();
      return /^\d{3}[-_]\d{2,3}[-_]\d{1,6}[-_]\d{1,6}$/.test(s) ||
        /^\d{5,12}$/.test(s) || /^[A-Z]{2,5}[-_]?\d{3,8}$/i.test(s);
    },
    azimuth: function (v) {
      var n = parseFloat(v);
      return !isNaN(n) && n >= 0 && n <= 360 && /^\d{1,3}(\.\d+)?$/.test(String(v).trim());
    },
    utr: function (v) {
      var s = String(v).trim().toUpperCase();
      return /^[A-Z0-9]{10,24}$/.test(s) && /\d{6,}/.test(s) && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(s);
    },
    text: function (v) { return /[A-Za-z]{3,}/.test(String(v)); }
  };

  /* ---------------------------------------------- column profiling */

  /* Fraction of non-empty values in a column that satisfy each
     detector, plus a few shape facts used for disambiguation. */
  function profileColumn(rows, header, sampleSize) {
    var vals = [];
    for (var i = 0; i < rows.length && vals.length < (sampleSize || 400); i++) {
      var v = rows[i][header];
      if (v !== undefined && v !== null && String(v).trim() !== "") vals.push(String(v).trim());
    }
    var out = { header: header, filled: vals.length, total: rows.length, types: {} };
    if (!vals.length) return out;

    Object.keys(DET).forEach(function (k) {
      var hits = 0;
      for (var j = 0; j < vals.length; j++) if (DET[k](vals[j])) hits++;
      var frac = hits / vals.length;
      if (frac >= 0.55) out.types[k] = Math.round(frac * 100) / 100;
    });

    var dec = 0;
    vals.forEach(function (v) { if (/\.\d{1,2}\s*$/.test(String(v))) dec++; });
    out.decimalFrac = dec / vals.length;

    var uniq = {};
    vals.forEach(function (v) { uniq[v] = 1; });
    out.distinct = Object.keys(uniq).length;
    out.distinctRatio = out.distinct / vals.length;
    out.sample = vals.slice(0, 3);
    return out;
  }

  TK.profileColumns = function (headers, rows) {
    var p = {};
    headers.forEach(function (h) { p[h] = profileColumn(rows, h); });
    return p;
  };

  /* ---------------------------------------------- header scoring */

  function headerScore(header, patterns) {
    if (!patterns) return 0;
    var h = String(header).toLowerCase().replace(/[^a-z0-9]/g, "");
    for (var i = 0; i < patterns.length; i++) {
      var pat = patterns[i];
      var ok = pat instanceof RegExp ? pat.test(h)
        : h === String(pat).toLowerCase().replace(/[^a-z0-9]/g, "");
      if (ok) return 1 - i * 0.05;      // earlier patterns are stronger
    }
    return 0;
  }

  /* ---------------------------------------------- smart mapping

     spec: { canonical: { head: [patterns], want: ["type", ...],
                          need: bool, prefer: "min"|"max" } }

     Returns { map, detail, unused, headerless }.                */

  TK.smartMap = function (headers, rows, spec) {
    var prof = TK.profileColumns(headers, rows);

    // A header row that is itself data means the file had no header.
    var headerless = headers.filter(function (h) {
      return DET.msisdn(h) || DET.imei(h) || DET.ipv4(h) || /^\d{6,}$/.test(h);
    }).length >= Math.max(2, headers.length * 0.3);

    function fieldsOf(sp) {
      return Object.keys(sp).filter(function (k) { return k.indexOf("__") !== 0; });
    }

    var cand = [];
    fieldsOf(spec).forEach(function (field) {
      var s = spec[field];
      headers.forEach(function (h) {
        var hs = headerless ? 0 : headerScore(h, s.head);
        var cs = 0, via = "";
        (s.want || []).forEach(function (t) {
          var f = prof[h].types[t] || 0;
          if (f > cs) { cs = f; via = t; }
        });
        if (!hs && !cs) return;
        // header evidence is weighted higher, but content alone can carry a
        // field when the heading is unrecognisable
        var score = hs * 1.6 + cs * 1.0;
        cand.push({ field: field, header: h, score: score, hs: hs, cs: cs, via: via });
      });
    });

    cand.sort(function (a, b) { return b.score - a.score; });

    var map = {}, detail = {}, takenCol = {}, takenField = {};
    cand.forEach(function (c) {
      if (takenField[c.field] || takenCol[c.header]) return;
      if (c.score < 0.5) return;
      map[c.field] = c.header;
      takenField[c.field] = 1;
      takenCol[c.header] = 1;
      detail[c.field] = {
        header: c.header,
        confidence: Math.min(1, c.score / 1.6),
        byHeader: c.hs > 0,
        byContent: c.cs > 0,
        contentType: c.via,
        contentFrac: c.cs,
        sample: prof[c.header].sample,
        conflict: c.hs > 0 && c.cs === 0 && (spec[c.field].want || []).length > 0
      };
    });

    /* Pairs of the same kind need ordering, not just detection. In a CDR
       both parties look identical to a detector, so when the headings say
       nothing useful the target is taken to be the column that barely
       varies, because every row is theirs.

       This only runs when the headings gave no signal. A file that says
       "Party A" and "Party B" has already told us the order, and guessing
       over the top of that is how you end up reporting the caller as the
       called party. Content decides only what the name leaves open. */
    fieldsOf(spec).forEach(function (field) {
      var s = spec[field];
      if (!s.pairWith || !map[field] || !map[s.pairWith]) return;
      var dA = detail[field], dB = detail[s.pairWith];
      if ((dA && dA.byHeader) || (dB && dB.byHeader)) return;   // names already said
      var a = prof[map[field]], b = prof[map[s.pairWith]];
      if (Math.abs(a.distinctRatio - b.distinctRatio) < 0.08) return;  // too close to call
      var aIsConstant = a.distinctRatio < b.distinctRatio;
      var shouldBeConstant = s.prefer === "min";
      if (shouldBeConstant !== aIsConstant) {
        var t = map[field];
        map[field] = map[s.pairWith];
        map[s.pairWith] = t;
        var d = detail[field];
        detail[field] = detail[s.pairWith];
        detail[s.pairWith] = d;
        if (detail[field]) detail[field].swapped = true;
        if (detail[s.pairWith]) detail[s.pairWith].swapped = true;
      }
    });

    // domain-specific clean-up, where the generic scoring cannot decide
    if (spec.__resolve) spec.__resolve(map, prof, rows, headers, detail);

    /* A resolver may claim a column that generic scoring had already given
       to another field. Keep the resolver's assignment and drop the older
       one, so no column is read as two different things. */
    var owner = {};
    fieldsOf(spec).forEach(function (f) {
      var col = map[f];
      if (!col) return;
      if (owner[col] === undefined) { owner[col] = f; return; }
      var keep = (detail[f] && detail[f].confidence || 0) >
                 (detail[owner[col]] && detail[owner[col]].confidence || 0) ? f : owner[col];
      var drop = keep === f ? owner[col] : f;
      delete map[drop];
      delete detail[drop];
      owner[col] = keep;
    });

    var takenCol2 = {};
    Object.keys(map).forEach(function (f) { takenCol2[map[f]] = 1; });
    var unused = headers.filter(function (h) { return !takenCol2[h]; });
    return { map: map, detail: detail, profile: prof, unused: unused, headerless: headerless };
  };

  /* ---------------------------------------------- money-column resolver

     Debit, credit and balance all look like money to a detector, so the
     generic scoring cannot separate them. The data can:

       - Balance is present on almost every row. Debit and credit are
         sparse, because a row is one or the other.
       - Which sparse column is the debit is settled by watching the
         balance: it falls on the rows where the debit column is filled.

     This is decided from the file itself, so a statement whose columns
     are called "Amount Withdrawn" and "Running Bal" still comes out
     right, and one with no useful headings at all still comes out right. */

  function num(v) {
    var s = String(v === undefined || v === null ? "" : v).replace(/[₹,\s]/g, "")
      .replace(/^\((.*)\)$/, "-$1").replace(/(cr|dr)$/i, "");
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  function resolveMoney(map, prof, rows, headers, detail) {
    /* A reference column can look numeric, so require the column to
       behave like currency: mostly values carrying paise, or an explicit
       symbol. "Chq/Ref Number" holding 412345678901 is excluded here,
       which is what stops it being mistaken for the running balance. */
    var moneyCols = headers.filter(function (h) {
      var pr = prof[h];
      if ((pr.types.money || 0) < 0.55 || !pr.filled) return false;
      if ((pr.types.utr || 0) >= 0.55) return false;
      return (pr.decimalFrac || 0) >= 0.5;
    });
    if (moneyCols.length < 2) return;

    var fill = {};
    moneyCols.forEach(function (h) { fill[h] = prof[h].filled / Math.max(1, prof[h].total); });

    // the fullest money column is the running balance
    var balance = moneyCols.slice().sort(function (a, b) { return fill[b] - fill[a]; })[0];
    if (fill[balance] < 0.85) balance = null;

    var sparse = moneyCols.filter(function (h) { return h !== balance && fill[h] < 0.9; });
    if (!sparse.length) return;

    if (balance) {
      map.bal = balance;
      detail.bal = { header: balance, confidence: 0.95, byHeader: false, byContent: true,
                     contentType: "money, present on every row", contentFrac: fill[balance],
                     sample: prof[balance].sample };
    }

    if (sparse.length === 2 && balance) {
      // whichever column coincides with the balance going down is the debit
      var score = {};
      sparse.forEach(function (h) { score[h] = 0; });
      var prev = null;
      for (var i = 0; i < rows.length; i++) {
        var b = num(rows[i][balance]);
        if (b === null) continue;
        if (prev !== null) {
          var delta = b - prev;
          sparse.forEach(function (h) {
            var v = num(rows[i][h]);
            if (v !== null && v !== 0) score[h] += (delta < 0 ? 1 : -1);
          });
        }
        prev = b;
      }
      var debit = score[sparse[0]] >= score[sparse[1]] ? sparse[0] : sparse[1];
      var credit = debit === sparse[0] ? sparse[1] : sparse[0];
      map.debit = debit;
      map.credit = credit;
      [[ "debit", debit ], [ "credit", credit ]].forEach(function (pair) {
        detail[pair[0]] = {
          header: pair[1], confidence: 0.92, byHeader: false, byContent: true,
          contentType: "money, confirmed against the balance column",
          contentFrac: fill[pair[1]], sample: prof[pair[1]].sample
        };
      });
      delete map.amount;
    } else if (sparse.length === 1 && !map.debit && !map.credit) {
      map.amount = sparse[0];
    }
  }

  /* ---------------------------------------------- mapping panel UI

     Shows what was matched and why, and lets it be corrected. This
     is what makes automatic inference acceptable in evidence work:
     the officer can always see and override the machine's guess. */

  TK.mappingPanel = function (host, opts) {
    var headers = opts.headers, spec = opts.spec, res = opts.result;
    var labels = opts.labels || {};
    var esc = TK.esc;

    var fields = Object.keys(spec).filter(function (k) { return k.indexOf("__") !== 0; });
    var got = fields.filter(function (f) { return res.map[f]; });
    var missing = fields.filter(function (f) { return !res.map[f] && spec[f].need; });
    var lowConf = got.filter(function (f) { return res.detail[f].confidence < 0.62; });

    var tone = missing.length ? "danger" : (lowConf.length || res.headerless) ? "warn" : "ok";
    var summary = missing.length
      ? missing.length + " required column(s) could not be found"
      : res.headerless
        ? "This file has no header row. Columns were identified from their contents."
        : lowConf.length
          ? got.length + " columns matched, " + lowConf.length + " with low confidence"
          : "All " + got.length + " columns matched";

    var h = '<div class="mapbar ' + tone + '">' +
      '<button class="mapbar-head" type="button" aria-expanded="false">' +
        '<span class="mapbar-dot"></span>' +
        "<b>" + esc(summary) + "</b>" +
        '<span class="mapbar-hint">Check or change how columns were read</span>' +
        '<span class="mapbar-chev">&rsaquo;</span>' +
      "</button><div class=\"mapbar-body\">";

    h += '<p class="small muted" style="margin:0 0 12px">Columns are matched by name and by what ' +
      "they contain. If anything is wrong, change it here and the file is re-read.</p>";

    h += '<div class="maprows">';
    fields.forEach(function (f) {
      var d = res.detail[f];
      var col = res.map[f] || "";
      var conf = d ? Math.round(d.confidence * 100) : 0;
      var badge = !col
        ? (spec[f].need ? '<span class="badge danger">not found</span>'
                        : '<span class="badge">not present</span>')
        : conf >= 80 ? '<span class="badge ok">' + conf + "% sure</span>"
        : conf >= 62 ? '<span class="badge accent">' + conf + "% sure</span>"
        : '<span class="badge warn">' + conf + "% - please check</span>";

      var why = "";
      if (d) {
        var bits = [];
        if (d.byHeader) bits.push("name matches");
        if (d.byContent) bits.push("values look like " + d.contentType +
          " (" + Math.round(d.contentFrac * 100) + "% of rows)");
        if (d.swapped) bits.push("order corrected");
        why = bits.join(", ");
      }

      h += '<div class="maprow">' +
        '<div class="mapfield"><b>' + esc(labels[f] || f) + "</b>" + badge + "</div>" +
        '<select data-field="' + esc(f) + '">' +
          '<option value="">(none)</option>' +
          headers.map(function (x) {
            return '<option value="' + esc(x) + '"' + (x === col ? " selected" : "") + ">" +
              esc(x) + "</option>";
          }).join("") +
        "</select>" +
        '<div class="mapwhy">' + esc(why) +
          (d && d.sample && d.sample.length
            ? ' <span class="mapsample">e.g. ' + esc(d.sample.slice(0, 2).join(", ")) + "</span>"
            : "") +
        "</div></div>";
    });
    h += "</div>";

    if (res.unused.length) {
      h += '<p class="xs muted" style="margin-top:12px">Columns not used: <span class="mono">' +
        esc(res.unused.join(", ")) + "</span></p>";
    }
    h += '<div class="row" style="margin-top:14px"><button class="btn primary sm" data-map="apply">' +
      "Re-read the file with these columns</button></div>";
    h += "</div></div>";

    host.insertAdjacentHTML("afterbegin", h);

    var bar = host.querySelector(".mapbar");
    var head = bar.querySelector(".mapbar-head");
    head.onclick = function () {
      var open = bar.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    };
    if (tone !== "ok") bar.classList.add("open");

    bar.querySelector('[data-map="apply"]').onclick = function () {
      var next = {};
      TK.$$("select[data-field]", bar).forEach(function (s) {
        if (s.value) next[s.dataset.field] = s.value;
      });
      opts.onApply(next);
    };
  };

  /* ---------------------------------------------- field specs
     head: header patterns (the old behaviour)
     want: content types that would confirm this field            */

  TK.SPEC = {
    cdr: {
      a_party: { head: [/^(a|calling)?(party)?(msisdn|mobile|number|no|num|tel)$/, /^aparty/, /^partya/,
                        /^callingnumber/, /^callingparty/, /^msisdn$/, /^target/, /^subscriber/,
                        /^mobno/, /^subno/, /^caller/],
                 want: ["msisdn"], need: true, pairWith: "b_party", prefer: "min" },
      b_party: { head: [/^(b|called)?(party)?(msisdn|mobile|number|no|num)$/, /^bparty/, /^partyb/,
                        /^callednumber/, /^calledparty/, /^othernumber/, /^destination/, /^receiver/],
                 want: ["msisdn"], need: true, pairWith: "a_party", prefer: "max" },
      datetime: { head: [/^(call)?(date ?time|datetime|dt)$/, /^date$/, /^calldate/, /^starttime/,
                         /^callstart/, /^eventtime/, /^timestamp/, /^when/],
                  want: ["datetime"], need: true },
      time:     { head: [/^time$/, /^calltime/], want: ["timeonly"] },
      dur:      { head: [/^dur/, /^duration/, /^callduration/, /^secs?$/, /^talktime/, /^calldur/],
                  want: ["duration"], need: true },
      type:     { head: [/^(call)?type/, /^direction/, /^inout/, /^callmode/, /^service/, /^ctype/],
                  want: ["calltype"] },
      imei:     { head: [/^imei/, /^equipment/, /^deviceid/, /^handset/], want: ["imei"] },
      imsi:     { head: [/^imsi/, /^subscriberid/, /^simid/], want: ["imsi"] },
      cellid:   { head: [/^(first|last)?cell(id|global)?/, /^cgi$/, /^lac.*cell/, /^cellidentity/,
                         /^siteid/, /^tower/], want: ["cellid"] },
      site:     { head: [/^(cell|site|tower|bts)?(name|address|location|desc)/, /^firstcell/,
                         /^lastcell/, /^towerlocation/], want: ["text"] },
      lat:      { head: [/^lat/, /^latitude/], want: ["lat"] },
      lon:      { head: [/^lon/, /^long/, /^longitude/], want: ["lon"] }
    },

    ipdr: {
      msisdn:    { head: [/^(msisdn|mobile|number|subscriber|calling)/, /^target/, /^mobno/],
                   want: ["msisdn"], need: true },
      imei:      { head: [/^imei/], want: ["imei"] },
      imsi:      { head: [/^imsi/], want: ["imsi"] },
      priv_ip:   { head: [/^(private|source|src|internal|allocated)?ip/, /^privateip/, /^sourceip/],
                   want: ["ipv4"], pairWith: "pub_ip", prefer: "max" },
      pub_ip:    { head: [/^(public|nat|translated|natted)?ip/, /^publicip/, /^natip/, /^translatedip/],
                   want: ["ipv4"], need: true, pairWith: "priv_ip", prefer: "min" },
      dest_ip:   { head: [/^(dest|destination|dst|server|remote)ip/], want: ["ipv4"] },
      src_port:  { head: [/^(source|src|private|translated|nat|start)port/, /^port$/], want: ["port"], need: true },
      dest_port: { head: [/^(dest|destination|dst|server)port/], want: ["port"] },
      start:     { head: [/^(start|session|login|begin)?(time|date|datetime)/, /^starttime/],
                   want: ["datetime"], need: true },
      end:       { head: [/^(end|stop|logout|release)(time|date|datetime)/, /^endtime/], want: ["datetime"] },
      up:        { head: [/^(up|uplink|sent|tx|ul)(link)?(bytes|volume|data|octets)?/], want: ["bytes"] },
      down:      { head: [/^(down|downlink|recv|received|rx|dl)(link)?(bytes|volume|data|octets)?/], want: ["bytes"] },
      total:     { head: [/^(total|data)(bytes|volume|usage)/], want: ["bytes"] },
      cellid:    { head: [/^cell/, /^cgi/, /^eci/], want: ["cellid"] },
      apn:       { head: [/^apn/, /^accesspoint/], want: ["text"] }
    },

    bank: {
      date:   { head: [/^(txn|tran|transaction|value|posting)?date/, /^date/, /^dt$/, /valuedate/],
                want: ["datetime"], need: true },
      narr:   { head: [/narration/, /particular/, /description/, /remark/, /details/, /transactionremarks/],
                want: ["text"], need: true },
      ref:    [],
      debit:  { head: [/^debit/, /withdrawal/, /^dr$/, /^wdl/, /paid/, /amountdebit/],
                want: ["money"] },
      credit: { head: [/^credit/, /deposit/, /^cr$/, /received/, /amountcredit/],
                want: ["money"] },
      amount: { head: [/^amount/, /^amt/, /transactionamount/], want: ["money"] },
      type:   { head: [/^type/, /drcr/, /crdr/, /txntype/], want: ["drcr"] },
      bal:    { head: [/balance/, /closingbalance/, /runningbalance/], want: ["money"] }
    }
  };
  // the ref field needs its own shape; declared separately for clarity
  TK.SPEC.bank.ref = { head: [/^ref/, /utr/, /rrn/, /chq/, /cheque/, /transactionid/, /txnid/, /refno/,
                              /instrument/],
                       want: ["utr"] };
  TK.SPEC.bank.__resolve = resolveMoney;

  /* One call that handles the whole ingestion problem: parse, infer the
     columns from names and contents, and if the file turns out to have no
     header row, parse it again so the first line is kept as data. */
  TK.parseSmart = function (text, spec) {
    var p = TK.parseTable(text);
    if (!p.rows.length) return { p: p, sm: null };
    var sm = TK.smartMap(p.headers, p.rows, spec);
    if (sm.headerless) {
      var p2 = TK.parseTable(text, { noHeader: true });
      if (p2.rows.length >= p.rows.length) {
        var sm2 = TK.smartMap(p2.headers, p2.rows, spec);
        sm2.headerless = true;
        return { p: p2, sm: sm2 };
      }
    }
    return { p: p, sm: sm };
  };

  /* Re-describe a hand-corrected mapping so the panel shows the officer's
     own choice rather than the original guess. */
  TK.appliedMap = function (sm, chosen) {
    var detail = {}, used = {};
    Object.keys(chosen).forEach(function (f) {
      var d = sm.detail[f];
      detail[f] = (d && d.header === chosen[f]) ? d
        : { header: chosen[f], confidence: 1, byHeader: false, byContent: false,
            contentType: "set by you", contentFrac: 0,
            sample: (sm.profile[chosen[f]] || {}).sample || [] };
      used[chosen[f]] = 1;
    });
    return { map: chosen, detail: detail, profile: sm.profile,
             unused: Object.keys(sm.profile).filter(function (h) { return !used[h]; }),
             headerless: sm.headerless };
  };

  TK.SPEC.caf = {
    msisdn: { head: [/msisdn/, /mobile/, /^number/, /^phone/, /connection/, /^mobno/],
              want: ["msisdn"], need: true },
    name:   { head: [/subscribername/, /^name/, /customername/, /subscriber/], want: ["text"], need: true },
    father: { head: [/father/, /guardian/, /careof/], want: ["text"] },
    dob:    { head: [/dob/, /dateofbirth/, /birth/], want: ["datetime"] },
    addr:   { head: [/address/, /^addr/, /residence/], want: ["text"] },
    idtype: { head: [/idtype/, /poitype/, /documenttype/, /prooftype/], want: ["text"] },
    idnum:  { head: [/idnumber/, /idno/, /poi/, /documentno/, /proofno/], want: ["text"] },
    act:    { head: [/activation/, /doa/, /dateofactivation/, /^activated/], want: ["datetime"] },
    pos:    { head: [/^pos/, /retailer/, /dealer/, /outlet/, /agent/], want: ["text"] },
    alt:    { head: [/alternate/, /altnumber/, /contactnumber/], want: ["msisdn"] },
    status: { head: [/status/, /state$/], want: ["text"] }
  };

  TK.SPEC.dump = {
    msisdn: { head: [/msisdn/, /mobile/, /^number/, /subscriber/, /aparty/, /^mobno/],
              want: ["msisdn"], need: true },
    imei:   { head: [/imei/, /equipment/, /handset/], want: ["imei"] },
    imsi:   { head: [/imsi/], want: ["imsi"] },
    dt:     { head: [/datetime/, /^date/, /^time/, /timestamp/, /^when/], want: ["datetime"] },
    cell:   { head: [/cell/, /cgi/, /site/, /tower/], want: ["cellid"] }
  };

  TK.SPEC.cellsite = {
    cgi:    { head: [/^cgi/, /cellglobal/, /^cellid/, /^cell$/, /globalcellid/], want: ["cellid"] },
    mcc:    { head: [/^mcc/] },
    mnc:    { head: [/^mnc/] },
    lac:    { head: [/^lac/, /^tac$/, /locationarea/] },
    ci:     { head: [/^ci$/, /^cid$/, /cellidentity/, /^eci$/, /sectorid/] },
    op:     { head: [/operator/, /licensee/, /^tsp/, /network/, /carrier/], want: ["text"] },
    tech:   { head: [/tech/, /^rat$/, /generation/], want: ["text"] },
    stype:  { head: [/sitetype/, /towertype/, /^type$/], want: ["text"] },
    az:     { head: [/azimuth/, /bearing/, /antennadirection/, /^direction/], want: ["azimuth"] },
    lat:    { head: [/^lat/], want: ["lat"], need: true },
    lon:    { head: [/^lon/, /^long/], want: ["lon"], need: true },
    site:   { head: [/sitename/, /^site$/, /towername/, /bts/], want: ["text"] },
    addr:   { head: [/address/, /location$/], want: ["text"] },
    city:   { head: [/city/, /district/, /town/], want: ["text"] },
    circle: { head: [/circle/, /^lsa/, /state/, /region/], want: ["text"] }
  };

  TK.SPEC.station = {
    n: { head: [/^name/, /station/, /^ps/, /policestation/], want: ["text"], need: true },
    d: { head: [/district/, /^dist/], want: ["text"] },
    s: { head: [/^state/, /^st$/], want: ["text"] },
    y: { head: [/^lat/], want: ["lat"] },
    x: { head: [/^lon/, /^long/], want: ["lon"] },
    a: { head: [/address/, /location/], want: ["text"] },
    p: { head: [/phone/, /contact/, /mobile/, /^tel/], want: ["msisdn", "landline"] }
  };

  TK.SPEC.nodalimp = {
    e: { head: [/entity/, /bank/, /organisation/, /organization/, /company/, /^name$/],
         want: ["text"], need: true },
    c: { head: [/categ/, /type/, /sector/], want: ["text"] },
    o: { head: [/officername/, /nodalofficer/, /^officer/, /contactperson/], want: ["text"] },
    d: { head: [/desig/, /rank/, /post/], want: ["text"] },
    m: { head: [/email/, /mail/], want: ["email"] },
    p: { head: [/phone/, /mobile/, /contact/, /^tel/], want: ["msisdn", "landline"] }
  };

  TK.SPEC.stmt = {
    date:   { head: [/^(txn|tran|transaction|value|posting)?date/, /^date/, /^dt$/, /valuedate/],
              want: ["datetime"], need: true },
    desc:   { head: [/narration/, /description/, /particular/, /remark/, /details/, /transactionremarks/],
              want: ["text"], need: true },
    ref:    { head: [/chq.*ref/, /^ref/, /utr/, /rrn/, /transactionid/, /txnid/, /refno/, /instrument/],
              want: ["utr"] },
    chq:    { head: [/cheque\s*number/, /^chqno$/, /^chequeno$/] },
    debit:  { head: [/withdrawal/, /^debit/, /^dr$/, /^wdl/, /paid/, /amountdebit/], want: ["money"] },
    credit: { head: [/deposit/, /^credit/, /^cr$/, /received/, /amountcredit/], want: ["money"] },
    amount: { head: [/^amount/, /^amt/, /transactionamount/], want: ["money"] },
    type:   { head: [/^type/, /drcr/, /crdr/], want: ["drcr"] },
    bal:    { head: [/balance/, /closingbalance/, /runningbalance/], want: ["money"] },
    __resolve: resolveMoney
  };

  TK.LABELS = {
    a_party: "Calling number", b_party: "Called number", datetime: "Date and time",
    time: "Time", dur: "Duration", type: "Call type", imei: "IMEI", imsi: "IMSI",
    cellid: "Cell ID", site: "Tower name or address", lat: "Latitude", lon: "Longitude",
    msisdn: "Mobile number", priv_ip: "Private IP", pub_ip: "Public IP", dest_ip: "Destination IP",
    src_port: "Source port", dest_port: "Destination port", start: "Session start",
    end: "Session end", up: "Data sent", down: "Data received", total: "Total data", apn: "APN",
    date: "Date", narr: "Narration", ref: "Reference or UTR", debit: "Debit",
    credit: "Credit", amount: "Amount", bal: "Balance",
    msisdn2: "Mobile number", name: "Subscriber name", father: "Father or guardian",
    dob: "Date of birth", addr: "Address", idtype: "ID type", idnum: "ID number",
    act: "Activation date", pos: "Point of sale", alt: "Alternate number", status: "Status",
    dt: "Date and time", cell: "Cell or tower", cgi: "Cell global identity",
    mcc: "MCC", mnc: "MNC", lac: "LAC", ci: "Cell identity", op: "Operator",
    tech: "Technology", stype: "Site type", az: "Azimuth", site: "Site name",
    city: "City or district", circle: "Circle or state", desc: "Narration", chq: "Cheque number",
    n: "Station name", d: "District", s: "State", y: "Latitude", x: "Longitude",
    a: "Address", p: "Phone", e: "Entity", c: "Category", o: "Officer", m: "E-mail"
  };
})();
