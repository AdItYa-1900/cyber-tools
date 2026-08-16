/* ============================================================
   Sutra - core runtime
   Zero-build, file:// safe. Classic script, no modules, no fetch
   of local files (large datasets are lazy-injected as <script>).
   Everything runs client-side: evidence files never leave the box.
   ============================================================ */
(function () {
  "use strict";

  var TK = window.TK = {
    tools: {},
    order: [],
    clusters: [
      { id: "identity",  name: "Identity resolution", q: "Who is behind this number?",        color: "#0A7EA4" },
      { id: "device",    name: "Device tracing",      q: "Which handset, and where is it now?", color: "#7C5CE6" },
      { id: "telecom",   name: "Telecom analysis",    q: "Who did they talk to, and from where?", color: "#0E9F6E" },
      { id: "money",     name: "Money trail",         q: "Where did the money go?",           color: "#B7791F" },
      { id: "network",   name: "Network side",        q: "What is on the wire?",              color: "#0A7EA4" },
      { id: "movement",  name: "Physical movement",   q: "How did they move?",                color: "#D9432F" },
      { id: "case",      name: "Case handling",       q: "How do I run and document this?",   color: "#5A6B84" }
    ]
  };

  /* ---------------------------------------------------- dom helpers */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  TK.$ = $; TK.$$ = $$;

  // escape for safe interpolation into HTML
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  TK.esc = esc;

  // tagged template that auto-escapes ${} interpolations.  Use TK.raw(x) to opt out.
  function html(strings) {
    var out = strings[0];
    for (var i = 1; i < arguments.length; i++) {
      var v = arguments[i];
      if (v && v.__raw) out += v.value;
      else if (Array.isArray(v)) out += v.map(function (x) {
        return (x && x.__raw) ? x.value : esc(x);
      }).join("");
      else out += esc(v);
      out += strings[i];
    }
    return out;
  }
  TK.html = html;
  TK.raw = function (v) { return { __raw: true, value: v == null ? "" : String(v) }; };

  /* ---------------------------------------------------- icons */
  /* Stroke-based 24x24 glyphs, inlined so the app stays self-contained.
     currentColor everywhere, so an icon takes the colour of its context. */

  var ICONS = {
    identity: '<circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    device:   '<rect x="6.5" y="2.5" width="11" height="19" rx="2.4"/><path d="M10.5 18.6h3"/>',
    telecom:  '<path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>' +
              '<path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7"/><circle cx="12" cy="12" r="1.6"/>',
    money:    '<rect x="2.5" y="5.5" width="19" height="13" rx="2.2"/><circle cx="12" cy="12" r="2.8"/>' +
              '<path d="M6 9.5v5M18 9.5v5"/>',
    network:  '<circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4"/>' +
              '<path d="M12 2.8a14 14 0 0 1 0 18.4a14 14 0 0 1 0-18.4"/>',
    movement: '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    "case":   '<path d="M14 2.8H6.6A1.8 1.8 0 0 0 4.8 4.6v14.8a1.8 1.8 0 0 0 1.8 1.8h10.8a1.8 1.8 0 0 0 1.8-1.8V7.8z"/>' +
              '<path d="M14 2.8V8h5.2M8.6 13h6.8M8.6 16.8h6.8"/>',

    search:   '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    upload:   '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    copy:     '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check:    '<path d="M20 6L9 17l-5-5"/>',
    alert:    '<path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9.2"/>',
    arrow:    '<path d="M5 12h14M13 6l6 6-6 6"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/>',
    shield:   '<path d="M12 22s8-4 8-10V5.5l-8-3-8 3V12c0 6 8 10 8 10z"/>',
    lock:     '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>'
  };

  /* The wordmark: three linked nodes, the thread a case is followed by. */
  TK.logoMark = function (size) {
    size = size || 24;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" ' +
      'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M5.6 6.8 11.4 16.6 18.4 7.4"/>' +
      '<circle cx="5.6" cy="6.8" r="2.1" fill="currentColor" stroke="none"/>' +
      '<circle cx="11.4" cy="16.6" r="2.1" fill="currentColor" stroke="none"/>' +
      '<circle cx="18.4" cy="7.4" r="2.1" fill="currentColor" stroke="none"/></svg>';
  };

  TK.icon = function (name, size) {
    var p = ICONS[name];
    if (!p) return "";
    size = size || 16;
    return '<svg class="ic" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" ' +
      'fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  };

  /* ---------------------------------------------------- registration */

  TK.reg = function (def) {
    TK.tools[def.id] = def;
    TK.order.push(def.id);
  };

  /* ---------------------------------------------------- language */
  /* Bilingual content lives in data/i18n.js. Anything not translated
     yet falls back to the English written in the tool definition, so a
     missing translation degrades to English rather than to blank.   */

  TK.lang = "en";
  try {
    var saved = localStorage.getItem("tk-lang");
    if (saved === "hi" || saved === "en") TK.lang = saved;
  } catch (e) { /* file:// may block storage */ }

  function pack() {
    return (window.I18N && I18N.ui && I18N.ui[TK.lang]) || {};
  }

  // t("save") -> translated UI string, falling back to English then the key
  TK.t = function (key, fallback) {
    var p = pack();
    if (p[key]) return p[key];
    var en = (window.I18N && I18N.ui && I18N.ui.en) || {};
    return en[key] || fallback || key;
  };

  // localised view of a tool definition
  TK.tool = function (id) {
    var def = TK.tools[id];
    if (!def) return null;
    var tr = (window.I18N && I18N.tools && I18N.tools[id]) || {};
    var loc = tr[TK.lang] || {};
    var en = tr.en || {};
    return {
      id: id,
      def: def,
      name: loc.name || en.name || def.name,
      desc: loc.desc || en.desc || def.desc,
      what: loc.what || en.what || "",
      need: loc.need || en.need || [],
      steps: loc.steps || en.steps || [],
      tier: def.tier,
      cluster: def.cluster
    };
  };

  TK.cluster = function (id) {
    var c = TK.clusters.filter(function (x) { return x.id === id; })[0] || {};
    var tr = (window.I18N && I18N.clusters && I18N.clusters[id]) || {};
    var loc = tr[TK.lang] || tr.en || {};
    return { id: id, color: c.color, name: loc.name || c.name, q: loc.q || c.q };
  };

  TK.setLang = function (l) {
    if (l !== "en" && l !== "hi") return;
    TK.lang = l;
    try { localStorage.setItem("tk-lang", l); } catch (e) {}
    document.documentElement.setAttribute("lang", l === "hi" ? "hi" : "en");
    buildNav();
    route();
  };

  /* ---------------------------------------------------- toast */

  TK.toast = function (msg, kind) {
    var host = $(".toast-host");
    var t = document.createElement("div");
    t.className = "toast " + (kind || "");
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s";
      t.style.opacity = "0";
      setTimeout(function () { t.remove(); }, 300);
    }, 2200);
  };

  TK.copy = function (text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); TK.toast("Copied to clipboard", "ok"); }
    catch (e) { TK.toast("Copy failed", "danger"); }
    ta.remove();
  };

  /* ---------------------------------------------------- download */

  TK.download = function (filename, content, mime) {
    var blob = content instanceof Blob ? content
      : new Blob(["﻿" + content], { type: (mime || "text/plain") + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    TK.toast("Saved " + filename, "ok");
  };

  TK.toCSV = function (rows, headers) {
    if (!rows.length) return "";
    headers = headers || Object.keys(rows[0]);
    var q = function (v) {
      v = v === null || v === undefined ? "" : String(v);
      return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    return [headers.map(q).join(",")].concat(rows.map(function (r) {
      return headers.map(function (h) { return q(r[h]); }).join(",");
    })).join("\r\n");
  };

  /* ---------------------------------------------------- lazy data */

  var loaded = {};
  TK.routeSeq = 0;

  /* Datasets load asynchronously, and the officer may navigate away before
     one arrives. Firing the callback then writes into a page that no longer
     exists. Capture the route id at call time and drop the callback if the
     tool has since been replaced. */
  TK.loadData = function (file, globalName, cb0) {
    var seq = TK.routeSeq;
    var cb = function (d) { if (seq === TK.routeSeq) cb0(d); };
    if (window[globalName]) return cb(window[globalName]);
    if (loaded[file]) { loaded[file].push(cb); return; }
    loaded[file] = [cb];
    var s = document.createElement("script");
    s.src = "data/" + file;
    s.onload = function () {
      var d = window[globalName];
      loaded[file].forEach(function (fn) { fn(d); });
    };
    s.onerror = function () {
      loaded[file].forEach(function (fn) { fn(null); });
      TK.toast("Could not load data/" + file, "danger");
    };
    document.head.appendChild(s);
  };

  /* ---------------------------------------------------- CSV / evidence parser */

  // Sniff delimiter from the most consistent candidate across sample lines.
  function sniff(lines) {
    var cands = [",", "\t", ";", "|"], best = ",", bestScore = -1;
    cands.forEach(function (d) {
      var counts = lines.slice(0, 25).map(function (l) { return splitLine(l, d).length; });
      var mode = {}, top = 0, topN = 0;
      counts.forEach(function (c) { mode[c] = (mode[c] || 0) + 1; if (mode[c] > top) { top = mode[c]; topN = c; } });
      var score = topN > 1 ? top * topN : -1;
      if (score > bestScore) { bestScore = score; best = d; }
    });
    return best;
  }

  function splitLine(line, delim) {
    var out = [], cur = "", inQ = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (inQ) {
        if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
        else cur += c;
      } else if (c === '"') inQ = true;
      else if (c === delim) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out.map(function (s) { return s.trim(); });
  }

  /**
   * Parse a messy operator dump.
   * Real CDR/IPDR files carry preamble junk (case number, "Report generated
   * on.", blank rows, disclaimer) before the true header row. We score every
   * early row and pick the one that looks most like a header.
   */
  TK.parseTable = function (text, opts) {
    opts = opts || {};
    text = text.replace(/^﻿/, "");
    var rawLines = text.split(/\r\n|\n|\r/);
    var lines = rawLines.filter(function (l) { return l.trim() !== ""; });
    if (!lines.length) return { headers: [], rows: [], meta: { error: "File is empty" } };

    var delim = opts.delim || sniff(lines);
    var grids = lines.map(function (l) { return splitLine(l, delim); });

    // modal column count = the shape of the real data block
    var freq = {}, modal = 0, modalN = 0;
    grids.forEach(function (g) { freq[g.length] = (freq[g.length] || 0) + 1; });
    Object.keys(freq).forEach(function (k) {
      if (freq[k] > modal && +k > 1) { modal = freq[k]; modalN = +k; }
    });

    // header = first row with modal width whose cells are mostly non-numeric & unique
    var hIdx = -1;
    for (var i = 0; i < Math.min(grids.length, 40); i++) {
      var g = grids[i];
      if (g.length !== modalN) continue;
      var filled = g.filter(function (c) { return c !== ""; });
      if (filled.length < modalN * 0.7) continue;
      var numeric = filled.filter(function (c) { return /^[\d.,\-+\s]+$/.test(c); }).length;
      var uniq = {}; filled.forEach(function (c) { uniq[c.toLowerCase()] = 1; });
      if (numeric / filled.length < 0.4 && Object.keys(uniq).length === filled.length) { hIdx = i; break; }
    }
    var preamble = [];
    if (hIdx === -1) hIdx = 0;
    else preamble = grids.slice(0, hIdx).map(function (g) {
      return g.filter(function (c) { return c !== ""; }).join(" | ");
    }).filter(Boolean);

    /* Some exports carry no header at all. The caller detects that from
       the content and re-parses with noHeader, so the first line is kept
       as data instead of being eaten as a heading. */
    if (opts.noHeader) {
      var synth = [];
      for (var c0 = 0; c0 < modalN; c0++) synth.push("Column " + (c0 + 1));
      var outRows = [];
      grids.forEach(function (g) {
        if (g.length < Math.max(2, modalN * 0.5)) return;
        var o = {}, filled = 0;
        for (var k0 = 0; k0 < synth.length; k0++) {
          var v0 = (g[k0] || "").replace(/^["']|["']$/g, "").trim();
          o[synth[k0]] = v0;
          if (v0 !== "") filled++;
        }
        if (filled > Math.max(1, modalN * 0.4)) outRows.push(o);
      });
      return {
        headers: synth, rows: outRows,
        meta: { delim: delim === "\t" ? "TAB" : delim, headerRow: 0, preamble: [],
                skipped: grids.length - outRows.length, totalLines: rawLines.length,
                synthesised: true }
      };
    }

    var headers = grids[hIdx].map(function (h, i) {
      h = h.replace(/^["']|["']$/g, "").trim();
      return h || "col" + (i + 1);
    });
    // de-duplicate header names
    var seen = {};
    headers = headers.map(function (h) {
      if (seen[h]) { seen[h]++; return h + "_" + seen[h]; }
      seen[h] = 1; return h;
    });

    var rows = [], skipped = 0;
    for (var j = hIdx + 1; j < grids.length; j++) {
      var g2 = grids[j];
      if (g2.length < 2) { skipped++; continue; }
      // trailing junk: footer notes, totals, disclaimers
      if (g2.length < modalN * 0.5) { skipped++; continue; }
      var o = {}, filledN = 0;
      for (var k = 0; k < headers.length; k++) {
        var v = (g2[k] || "").replace(/^["']|["']$/g, "").trim();
        o[headers[k]] = v;
        if (v !== "") filledN++;
      }
      if (!filledN) { skipped++; continue; }
      // Footer/total rows keep the full column count but fill only a cell or
      // two ("Total Records,420,,,"). A real data row is mostly populated.
      if (filledN <= Math.max(2, modalN * 0.4)) { skipped++; continue; }
      rows.push(o);
    }

    return {
      headers: headers, rows: rows,
      meta: {
        delim: delim === "\t" ? "TAB" : delim,
        headerRow: hIdx + 1,
        preamble: preamble,
        skipped: skipped,
        totalLines: rawLines.length
      }
    };
  };

  /**
   * Map arbitrary operator column names onto canonical fields.
   * spec = { canonical: [/regex/, "exact"..] }
   */
  TK.mapColumns = function (headers, spec) {
    var map = {}, used = {};
    Object.keys(spec).forEach(function (canon) {
      var pats = spec[canon];
      for (var p = 0; p < pats.length; p++) {
        var pat = pats[p];
        for (var i = 0; i < headers.length; i++) {
          if (used[headers[i]]) continue;
          var h = headers[i].toLowerCase().replace(/[^a-z0-9]/g, "");
          var ok = pat instanceof RegExp ? pat.test(h)
            : h === String(pat).toLowerCase().replace(/[^a-z0-9]/g, "");
          if (ok) { map[canon] = headers[i]; used[headers[i]] = 1; return; }
        }
      }
    });
    return map;
  };

  /* ---------------------------------------------------- parsing values */

  /* Which of the two leading components is the day?
     Scan a whole column: any first component above 12 proves day-first,
     any second component above 12 proves month-first. If neither appears
     the column is genuinely ambiguous and the caller must say so rather
     than silently pick one. */
  TK.detectDateOrder = function (values) {
    var dFirst = 0, mFirst = 0, seen = 0;
    for (var i = 0; i < values.length; i++) {
      var m = String(values[i] || "").trim()
        .match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
      if (!m) continue;
      seen++;
      if (+m[1] > 12) dFirst++;
      if (+m[2] > 12) mFirst++;
    }
    if (dFirst && !mFirst) return { order: "dmy", certain: true, seen: seen };
    if (mFirst && !dFirst) return { order: "mdy", certain: true, seen: seen };
    if (dFirst && mFirst) return { order: "dmy", certain: false, conflict: true, seen: seen };
    return { order: "dmy", certain: false, seen: seen };
  };

  /* Indian operator dumps use every date format known to man.
     `order` is "dmy" (default) or "mdy"; pass the result of
     detectDateOrder so a US-ordered export is not read as day-first. */
  TK.parseDate = function (s, order) {
    if (!s) return null;
    s = String(s).trim();
    var m;
    // 01/02/2024 14:30:05 | 01-02-2024 14:30 | 01.02.2024
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) {
      var yr = +m[3]; if (yr < 100) yr += yr < 70 ? 2000 : 1900;
      var a = +m[1], b = +m[2];
      var day = order === "mdy" ? b : a;
      var mon = order === "mdy" ? a : b;
      // a component above 12 can only be the day, whatever the caller said
      if (a > 12) { day = a; mon = b; }
      else if (b > 12) { day = b; mon = a; }
      if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
      return new Date(yr, mon - 1, day, +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    }
    // 2024-02-01 14:30:05  (ISO-ish)
    m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    // 20240201143005 (14-digit compact, common in IPDR)
    m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    // epoch seconds / ms
    if (/^\d{10}$/.test(s)) return new Date(+s * 1000);
    if (/^\d{13}$/.test(s)) return new Date(+s);
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  TK.fmtDate = function (d) {
    if (!d) return "";
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getDate()) + "-" + p(d.getMonth() + 1) + "-" + d.getFullYear() +
      " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  };

  TK.fmtDur = function (sec) {
    sec = Math.round(+sec || 0);
    if (sec < 60) return sec + "s";
    var m = Math.floor(sec / 60), s = sec % 60;
    if (m < 60) return m + "m " + s + "s";
    return Math.floor(m / 60) + "h " + (m % 60) + "m";
  };

  TK.fmtBytes = function (b) {
    b = +b || 0;
    var u = ["B", "KB", "MB", "GB", "TB"], i = 0;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return (i === 0 ? b : b.toFixed(b < 10 ? 2 : 1)) + " " + u[i];
  };

  TK.fmtNum = function (n) {
    if (n === null || n === undefined || n === "") return "";
    return (+n).toLocaleString("en-IN");
  };

  /* Normalise an Indian MSISDN to bare 10 digits.
     Order matters: strip international/trunk zeros FIRST, because
     "0091-98765 43210" and "0 91 98765 43210" both hide the country
     code behind them. Only strip a leading 91 when what remains would
     still be longer than 10 digits, so a genuine number beginning 91
     (91xxxxxxxx is a valid 10-digit mobile) survives intact. */
  TK.normNum = function (s) {
    if (!s) return "";
    var d = String(s).replace(/[^\d]/g, "");
    d = d.replace(/^0+/, "");
    if (d.length > 10 && d.slice(0, 2) === "91") d = d.slice(2);
    return d;
  };

  /* Call duration. Operators send bare seconds, HH:MM:SS, MM:SS, or a
     number with a unit. Reading "00:01:42" as 142 seconds instead of 102
     inflates every talk-time figure in the report. */
  TK.parseDur = function (v) {
    if (v === null || v === undefined || v === "") return 0;
    var s = String(v).trim();
    var c = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
    if (c) {
      return c[3] !== undefined
        ? (+c[1]) * 3600 + (+c[2]) * 60 + (+c[3])   // HH:MM:SS
        : (+c[1]) * 60 + (+c[2]);                    // MM:SS
    }
    var comp = s.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/i);
    if (comp && (comp[1] || comp[2] || comp[3])) {
      return (+(comp[1] || 0)) * 3600 + (+(comp[2] || 0)) * 60 + (+(comp[3] || 0));
    }
    var n = parseFloat(s.replace(/[^\d.]/g, ""));
    if (isNaN(n)) return 0;
    if (/\bmin/i.test(s)) return n * 60;
    if (/\bhour|\bhr/i.test(s)) return n * 3600;
    return n;
  };

  /* Data volume. A cell reading "1.5 MB" is not 1.5 bytes. */
  TK.parseBytes = function (v) {
    if (v === null || v === undefined || v === "") return 0;
    var s = String(v).trim();
    var n = parseFloat(s.replace(/,/g, "").replace(/[^\d.\-]/g, ""));
    if (isNaN(n)) return 0;
    var u = s.replace(/[\d.,\s\-]/g, "").toUpperCase();
    var mult = { KB: 1024, K: 1024, MB: 1048576, M: 1048576,
                 GB: 1073741824, G: 1073741824, TB: 1099511627776,
                 KIB: 1024, MIB: 1048576, GIB: 1073741824 }[u];
    return mult ? n * mult : n;
  };

  /* ---------------------------------------------------- geo */

  TK.haversine = function (lat1, lon1, lat2, lon2) {
    var R = 6371, r = Math.PI / 180;
    var dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  TK.bearing = function (lat1, lon1, lat2, lon2) {
    var r = Math.PI / 180;
    var y = Math.sin((lon2 - lon1) * r) * Math.cos(lat2 * r);
    var x = Math.cos(lat1 * r) * Math.sin(lat2 * r) -
      Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon2 - lon1) * r);
    return (Math.atan2(y, x) / r + 360) % 360;
  };

  TK.compass = function (deg) {
    var pts = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
               "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return pts[Math.round(deg / 22.5) % 16];
  };

  /* ---------------------------------------------------- file input */

  TK.dropzone = function (el, onFile, opts) {
    opts = opts || {};
    var input = document.createElement("input");
    input.type = "file";
    if (opts.accept) input.accept = opts.accept;
    if (opts.multiple) input.multiple = true;
    input.style.display = "none";
    el.appendChild(input);

    function handle(files) {
      if (!files || !files.length) return;
      opts.multiple ? onFile(Array.prototype.slice.call(files)) : onFile(files[0]);
    }
    el.addEventListener("click", function (e) { if (e.target !== input) input.click(); });
    input.addEventListener("change", function () { handle(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) {
      el.addEventListener(ev, function (e) { e.preventDefault(); el.classList.add("over"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      el.addEventListener(ev, function (e) { e.preventDefault(); el.classList.remove("over"); });
    });
    el.addEventListener("drop", function (e) { handle(e.dataTransfer.files); });
  };

  TK.readText = function (file, cb) {
    var r = new FileReader();
    r.onload = function () { cb(r.result); };
    r.onerror = function () { TK.toast("Could not read file", "danger"); };
    r.readAsText(file);
  };

  /* ---------------------------------------------------- data table */

  /**
   * Render a sortable/filterable table into `host`.
   * cols: [{k, label, cls, fmt(v,row), w}]
   */
  TK.table = function (host, rows, cols, opts) {
    opts = opts || {};
    var state = { sort: opts.sort || null, dir: opts.dir || 1, q: "", page: 0 };
    var PAGE = opts.pageSize || 500;

    host.innerHTML =
      '<div class="tbl-toolbar">' +
        '<div class="searchbox grow" style="max-width:280px"><input type="search" placeholder="Filter rows.."></div>' +
        '<span class="tbl-count"></span>' +
        '<div class="grow"></div>' +
        (opts.actions || "") +
        '<button class="btn sm" data-x="csv">Export CSV</button>' +
      '</div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead></thead><tbody></tbody></table></div>' +
      '<div class="row tight" style="margin-top:8px" data-x="pager"></div>';

    var thead = $("thead", host), tbody = $("tbody", host);
    var count = $(".tbl-count", host), pager = $('[data-x="pager"]', host);

    function view() {
      var r = rows;
      if (state.q) {
        var q = state.q.toLowerCase();
        r = r.filter(function (row) {
          for (var i = 0; i < cols.length; i++) {
            var v = row[cols[i].k];
            if (v != null && String(v).toLowerCase().indexOf(q) !== -1) return true;
          }
          return false;
        });
      }
      if (state.sort) {
        var c = cols.find(function (x) { return x.k === state.sort; });
        r = r.slice().sort(function (a, b) {
          var av = a[c.k], bv = b[c.k];
          if (av == null) return 1; if (bv == null) return -1;
          var an = typeof av === "number" ? av : parseFloat(String(av).replace(/,/g, ""));
          var bn = typeof bv === "number" ? bv : parseFloat(String(bv).replace(/,/g, ""));
          var cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn
            : String(av).localeCompare(String(bv), undefined, { numeric: true });
          return cmp * state.dir;
        });
      }
      return r;
    }

    function draw() {
      var r = view();
      var pages = Math.max(1, Math.ceil(r.length / PAGE));
      if (state.page >= pages) state.page = pages - 1;
      var slice = r.slice(state.page * PAGE, (state.page + 1) * PAGE);

      thead.innerHTML = "<tr>" + cols.map(function (c) {
        var arr = state.sort === c.k ? '<span class="arrow">' + (state.dir > 0 ? "▲" : "▼") + "</span>" : "";
        return '<th class="' + (c.cls || "") + '" data-k="' + esc(c.k) + '"' +
          (c.w ? ' style="min-width:' + c.w + '"' : "") + ">" + esc(c.label) + arr + "</th>";
      }).join("") + "</tr>";

      tbody.innerHTML = slice.map(function (row) {
        var cls = opts.rowClass ? opts.rowClass(row) : "";
        return '<tr class="' + cls + '">' + cols.map(function (c) {
          var v = row[c.k];
          var out = c.fmt ? c.fmt(v, row) : esc(v == null ? "" : v);
          return '<td class="' + (c.cls || "") + '">' + out + "</td>";
        }).join("") + "</tr>";
      }).join("") || '<tr><td colspan="' + cols.length + '" class="center muted" style="padding:32px">No matching rows</td></tr>';

      count.textContent = TK.fmtNum(r.length) + " of " + TK.fmtNum(rows.length) + " rows";
      pager.innerHTML = pages > 1
        ? '<button class="btn sm" data-p="-1"' + (state.page === 0 ? " disabled" : "") + ">Prev</button>" +
          '<span class="xs muted mono">page ' + (state.page + 1) + " / " + pages + "</span>" +
          '<button class="btn sm" data-p="1"' + (state.page >= pages - 1 ? " disabled" : "") + ">Next</button>"
        : "";
    }

    thead.addEventListener("click", function (e) {
      var th = e.target.closest("th"); if (!th) return;
      var k = th.dataset.k;
      if (state.sort === k) state.dir = -state.dir; else { state.sort = k; state.dir = 1; }
      draw();
    });
    $("input[type=search]", host).addEventListener("input", function (e) {
      state.q = e.target.value; state.page = 0; draw();
    });
    pager.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]"); if (!b) return;
      state.page += +b.dataset.p; draw();
    });
    host.addEventListener("click", function (e) {
      var b = e.target.closest('[data-x="csv"]'); if (!b) return;
      TK.download((opts.filename || "export") + ".csv",
        TK.toCSV(view().map(function (row) {
          var o = {};
          cols.forEach(function (c) { o[c.label] = row[c.k]; });
          return o;
        }), cols.map(function (c) { return c.label; })), "text/csv");
    });

    draw();
    return { redraw: draw, view: view };
  };

  /* ---------------------------------------------------- ui blocks */

  TK.stat = function (v, k, kind) {
    return '<div class="stat ' + (kind || "") + '"><div class="v" data-count>' + esc(v) +
      '</div><div class="k">' + esc(k) + "</div></div>";
  };

  /* Count a numeric stat up from zero. Purely presentational: the final
     text is always the exact string the tool produced, so a value like
     "8.97 L" or "23 days" is animated on its digits and restored intact. */
  function animateStats(root) {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    $$("[data-count]", root).forEach(function (el) {
      /* The true value is stashed the first time this element is seen, and
         every later call restores from that stash. The count-up is pure
         decoration; it must not be able to leave a wrong figure on screen,
         because these numbers get copied into case papers. Without the
         stash, a re-entrant call could read the partially-counted text as
         its target and freeze the display there. */
      if (el.dataset.finalValue !== undefined) {
        el.textContent = el.dataset.finalValue;
        return;
      }
      el.dataset.finalValue = el.textContent;
      var final = el.textContent;
      var m = final.match(/^([^\d\-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
      if (!m) return;
      var target = parseFloat(m[2].replace(/,/g, ""));
      if (!isFinite(target) || Math.abs(target) < 2) return;
      var dec = (m[2].split(".")[1] || "").length;
      var t0 = performance.now(), dur = 520;
      function frame(now) {
        var p = Math.min(1, (now - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        el.textContent = m[1] +
          (dec ? val.toFixed(dec) : Math.round(val).toLocaleString("en-IN")) + m[3];
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = el.dataset.finalValue;
      }
      requestAnimationFrame(frame);
    });
  }
  TK.animateStats = animateStats;

  TK.empty = function (msg, icon) {
    return '<div class="empty"><div class="big">' + (icon || "◌") + "</div><div>" + esc(msg) + "</div></div>";
  };

  /* ---------------------------------------------------- router */

  function renderHome(main) {
    var total = TK.order.length;
    var hi = TK.lang === "hi";

    var h = '<div class="wrap"><div class="hero">' +
      '<span class="eyebrow">' + esc(TK.t("brandSub")) + "</span>" +
      "<h1>" + (hi ? "हर उपकरण, एक ही जगह।" : "Every tool, one workspace.") + "</h1>" +
      "<p>" + (hi
        ? total + " उपकरण साइबर अपराध अन्वेषण के लिए, उसी सवाल के अनुसार समूहबद्ध जिसका जवाब आप ढूँढ रहे हैं। " +
          "सब कुछ इसी ब्राउज़र में चलता है। आपकी फ़ाइलें इसी कंप्यूटर पर पढ़ी जाती हैं, कहीं भेजी नहीं जातीं।"
        : total + " tools for cyber-crime investigation, grouped by the question you are actually trying " +
          "to answer. Everything runs in this browser. Evidence files you load are read on this machine " +
          "and never leave it.") + "</p>" +
      '<div class="hero-search">' +
        '<input type="search" id="home-search" placeholder="' + esc(TK.t("searchAll")) +
        '" autocomplete="off" spellcheck="false">' +
      "</div></div>";

    h += '<div class="note accent" style="margin-bottom:var(--s5)"><b>' + esc(TK.t("needHelp")) + "</b>" +
      "<p>" + esc(TK.t("helpLine")) + "</p></div>";

    h += '<div id="home-results">' + clusterGrid("") + "</div>";

    h += '<div class="note warn" style="margin-top:var(--s6)"><b>' +
      (hi ? "यह किट क्या बता सकती है और क्या नहीं" : "What this kit can and cannot tell you") + "</b><p>" +
      (hi
        ? "यहाँ दिया संदर्भ डेटा सार्वजनिक है और एक तारीख़ तक का है। यह बताता है कि <i>चीज़ें कहाँ हैं और किससे संपर्क करना है</i>। " +
          "यह कभी नहीं बताता कि <i>किसने कब क्या किया</i>। उसके लिए हमेशा डेटा रखने वाले को क़ानूनी नोटिस देना पड़ता है।"
        : "The reference data bundled here is public and dated. It tells you <i>where things are and who to " +
          "contact</i>. It never tells you <i>who did what and when</i>. That always requires legal process " +
          "against the data holder.") + "</p></div>";

    h += "</div>";
    main.innerHTML = h;

    animateStats(main);
    var box = $("#home-search");
    box.addEventListener("input", function () {
      $("#home-results").innerHTML = clusterGrid(box.value.trim().toLowerCase());
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var first = $("#home-results .tool-card");
        if (first) location.hash = first.getAttribute("href");
      }
    });
  }

  function clusterGrid(q) {
    var out = "", hits = 0;
    TK.clusters.forEach(function (raw) {
      var cl = TK.cluster(raw.id);
      var ids = TK.order.filter(function (id) {
        var t = TK.tool(id);
        if (t.cluster !== cl.id) return false;
        return !q || (t.name + " " + t.desc + " " + t.what).toLowerCase().indexOf(q) !== -1;
      });
      if (!ids.length) return;
      hits += ids.length;
      out += '<section class="cluster"><div class="cluster-head">' +
        '<h2><span class="cl-ic" style="color:' + cl.color + '">' + TK.icon(cl.id, 15) +
        "</span>" + esc(cl.name) + "</h2>" +
        '<span class="q">' + esc(cl.q) + "</span></div>" +
        '<div class="tool-grid">' + ids.map(function (id) {
          var t = TK.tool(id);
          return '<a class="tool-card" href="#/' + id + '"><div class="tc-top">' +
            '<span class="tc-name">' + esc(t.name) + "</span></div>" +
            '<div class="tc-desc">' + esc(t.desc) + "</div></a>";
        }).join("") + "</div></section>";
    });
    return hits ? out : TK.empty(TK.t("noResults"), "∅");
  }

  function route() {
    TK.routeSeq++;
    var main = $(".main");
    var hash = location.hash.replace(/^#\/?/, "");
    var id = hash.split("?")[0];

    $$(".nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#/" + id);
    });

    main.scrollTop = 0;

    if (!id) { document.title = TK.t("brand"); return renderHome(main); }

    var t = TK.tools[id];
    if (!t) {
      main.innerHTML = '<div class="wrap">' + TK.empty("No tool named “" + id + "”.", "∅") +
        '<div class="center"><a class="btn" href="#/">Back to all tools</a></div></div>';
      return;
    }

    var L = TK.tool(id);
    var cl = TK.cluster(t.cluster);
    document.title = L.name + " · " + TK.t("brand");

    var guide = "";
    if (L.what || L.need.length || L.steps.length) {
      guide = '<section class="guide">' +
        (L.what ? '<div class="guide-what"><h4>' + esc(TK.t("whatIsThis")) + "</h4><p>" + esc(L.what) + "</p></div>" : "") +
        '<div class="guide-cols">' +
          (L.need.length ? '<div><h4>' + esc(TK.t("youWillNeed")) + "</h4><ul class=\"guide-need\">" +
            L.need.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></div>" : "") +
          (L.steps.length ? '<div><h4>' + esc(TK.t("howToUse")) + "</h4><ol class=\"guide-steps\">" +
            L.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div>" : "") +
        "</div></section>";
    }

    main.innerHTML =
      '<div class="wrap' + (t.wide ? " wide" : "") + '">' +
        '<div class="tool-head">' +
          '<div class="tool-topline">' +
            '<div class="tool-eyebrow"><span class="cl-ic" style="color:' + (cl.color || "currentColor") +
              '">' + TK.icon(cl.id, 14) + "</span>" + esc(cl.name || "") + "</div>" +
            '<div class="lang-switch" role="group" aria-label="' + esc(TK.t("language")) + '">' +
              '<button data-lang="en"' + (TK.lang === "en" ? ' class="on"' : "") + '>English</button>' +
              '<button data-lang="hi"' + (TK.lang === "hi" ? ' class="on"' : "") + '>हिन्दी</button>' +
            "</div>" +
          "</div>" +
          "<h1>" + esc(L.name) + "</h1>" +
          '<p class="lede">' + esc(L.desc) + "</p>" +
        "</div>" +
        guide +
        '<div id="tool-body"></div>' +
      "</div>";

    $$(".lang-switch button").forEach(function (b) {
      b.onclick = function () { TK.setLang(b.dataset.lang); };
    });

    try {
      t.render($("#tool-body"), t);
      animateStats($("#tool-body"));
    } catch (err) {
      $("#tool-body").innerHTML = '<div class="note danger"><b>This tool crashed</b><p class="mono">' +
        esc(err && err.message) + "</p></div>";
      if (window.console) console.error(err);
    }
  }

  /* ---------------------------------------------------- sidebar */

  function buildNav() {
    var nav = $(".nav");
    nav.innerHTML = TK.clusters.map(function (raw) {
      var cl = TK.cluster(raw.id);
      var ids = TK.order.filter(function (id) { return TK.tools[id].cluster === cl.id; });
      if (!ids.length) return "";
      return '<div class="nav-group" data-cluster="' + cl.id + '">' +
        '<h4><span class="cl-ic" style="color:' + cl.color + '">' + TK.icon(cl.id, 13) +
        "</span>" + esc(cl.name) + "</h4>" +
        ids.map(function (id) {
          var t = TK.tool(id);
          return '<a href="#/' + id + '" data-name="' + esc((t.name + " " + t.desc).toLowerCase()) + '">' +
            "<span>" + esc(t.name) + "</span></a>";
        }).join("") + "</div>";
    }).join("");

    var b = $(".brand-name"), s = $(".brand-sub"), q = $("#nav-search"), lk = $(".side-foot .lock");
    if (b) b.textContent = TK.t("brand");
    if (s) s.textContent = TK.t("brandSub");
    if (q) q.placeholder = TK.t("search");
    if (lk) lk.textContent = TK.t("runsLocal");
  }

  /* Command palette. One search affordance for the whole app: the sidebar
     field and Ctrl+K both open it, so there is nothing to learn twice. */
  var palette = null;

  function openPalette() {
    if (palette) return;
    var veil = document.createElement("div");
    veil.className = "cmdk-veil";
    veil.innerHTML =
      '<div class="cmdk" role="dialog" aria-modal="true" aria-label="Search tools">' +
        '<div class="cmdk-input">' +
          '<span class="spinner" style="border:0;background:var(--fg-3);width:14px;height:14px;' +
            'border-radius:0;animation:none;-webkit-mask:no-repeat center/contain url(&quot;data:image/svg+xml,' +
            "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' " +
            "stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E" +
            '%3Cpath d=\'M20 20l-3.6-3.6\'/%3E%3C/svg%3E&quot;)"></span>' +
          '<input type="text" placeholder="Search tools…" autocomplete="off" spellcheck="false">' +
        "</div>" +
        '<div class="cmdk-list"></div>' +
        '<div class="cmdk-foot"><span><b class="kbd">↑↓</b> navigate</span>' +
        '<span><b class="kbd">↵</b> open</span><span><b class="kbd">esc</b> close</span></div>' +
      "</div>";
    document.body.appendChild(veil);
    palette = veil;

    var input = $("input", veil), list = $(".cmdk-list", veil);
    var items = [], sel = 0;

    function render(q) {
      q = q.trim().toLowerCase();
      items = [];
      var html = "";
      TK.clusters.forEach(function (cl) {
        var ids = TK.order.filter(function (id) {
          var t = TK.tools[id];
          if (t.cluster !== cl.id) return false;
          return !q || (t.name + " " + t.desc).toLowerCase().indexOf(q) !== -1;
        });
        if (!ids.length) return;
        html += '<div class="cmdk-group">' + esc(cl.name) + "</div>";
        ids.forEach(function (id) {
          var t = TK.tools[id];
          html += '<div class="cmdk-item" role="option" data-id="' + id + '" data-i="' + items.length + '">' +
            '<span class="pip t' + t.tier + '">T' + t.tier + "</span>" +
            '<span class="nm">' + esc(t.name) + "</span>" +
            '<span class="ds">' + esc(t.desc.slice(0, 52)) + "…</span></div>";
          items.push(id);
        });
      });
      list.innerHTML = html || '<div class="cmdk-empty">No tool matches that.</div>';
      sel = 0; mark();
    }

    function mark() {
      $$(".cmdk-item", list).forEach(function (el, i) {
        el.setAttribute("aria-selected", i === sel ? "true" : "false");
        if (i === sel) el.scrollIntoView({ block: "nearest" });
      });
    }

    function choose(i) {
      if (!items[i]) return;
      location.hash = "#/" + items[i];
      closePalette();
    }

    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
      else if (e.key === "Enter") { e.preventDefault(); choose(sel); }
      else if (e.key === "Escape") { e.preventDefault(); closePalette(); }
    });
    list.addEventListener("click", function (e) {
      var it = e.target.closest(".cmdk-item");
      if (it) choose(+it.dataset.i);
    });
    list.addEventListener("mousemove", function (e) {
      var it = e.target.closest(".cmdk-item");
      if (it && +it.dataset.i !== sel) { sel = +it.dataset.i; mark(); }
    });
    veil.addEventListener("mousedown", function (e) { if (e.target === veil) closePalette(); });

    render("");
    input.focus();
  }

  function closePalette() {
    if (!palette) return;
    palette.remove();
    palette = null;
  }

  function wireSearch() {
    var box = $("#nav-search");
    // the sidebar field is an entry point, not a second search box
    box.addEventListener("focus", function () { box.blur(); openPalette(); });
    box.addEventListener("click", openPalette);

    document.addEventListener("keydown", function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ""));
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault(); palette ? closePalette() : openPalette();
      } else if (e.key === "/" && !typing && !palette) {
        e.preventDefault(); openPalette();
      } else if (e.key === "Escape" && palette) {
        closePalette();
      }
    });
  }

  function wireMobileNav() {
    var btn = $("#menu-btn"), side = $(".sidebar");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = side.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $(".nav").addEventListener("click", function (e) {
      if (e.target.closest("a")) side.classList.remove("open");
    });
  }

  /* Light is the default. Dark is the opt-in override, so an untouched
     install opens in the light theme the design was drawn for. */
  function wireTheme() {
    var KEY = "tk-theme";
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* file:// may block */ }
    if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
    $("#theme-toggle").addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", "dark");
      try { localStorage.setItem(KEY, isDark ? "light" : "dark"); } catch (e) {}
    });
  }

  // global copy delegation
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    var sel = b.getAttribute("data-copy");
    var src = sel === "prev" ? b.parentElement.querySelector("pre, code") : $(sel);
    if (src) TK.copy(src.textContent);
  });

  /* Tools re-render their own panels after a file loads, so watch the
     tool body and animate any stat that appears later. */
  function watchStats() {
    if (!window.MutationObserver) return;
    var pending = null;
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        for (var j = 0; j < muts[i].addedNodes.length; j++) {
          var n = muts[i].addedNodes[j];
          if (n.nodeType === 1 && (n.matches && n.matches(".stat") || n.querySelector && n.querySelector(".stat"))) {
            clearTimeout(pending);
            pending = setTimeout(function () { animateStats($(".main")); }, 30);
            return;
          }
        }
      }
    }).observe($(".main"), { childList: true, subtree: true });
  }

  TK.boot = function () {
    buildNav();
    wireSearch();
    wireMobileNav();
    wireTheme();
    watchStats();
    window.addEventListener("hashchange", function () { closePalette(); route(); });
    route();
  };
})();
