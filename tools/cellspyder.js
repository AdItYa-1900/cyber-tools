/* ============================================================
   Cell Spyder, cell tower intelligence

   WHERE THE COORDINATES COME FROM MATTERS.
   The authoritative source for a tower's position is the cell site
   master data the licensee supplies alongside the CDR, under the
   same BNSS s.94 requisition. It is authoritative because the
   operator owns the network. Crowdsourced databases (OpenCelliD and
   the like) estimate tower positions from handset observations and
   are frequently out by hundreds of metres, useful for orientation,
   never for placing a person somewhere.

   This tool therefore has no built-in "tower API". You load a site
   list, it is cached in IndexedDB, and everything runs offline.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, $$ = TK.$$, esc = TK.esc;

  var DB_NAME = "tk-cellspyder", STORE = "towers", DB_VER = 1;

  /* ---------------------------------------------- IndexedDB cache */
  function idb(cb) {
    if (!window.indexedDB) return cb(null);
    var rq = indexedDB.open(DB_NAME, DB_VER);
    rq.onupgradeneeded = function () {
      var db = rq.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "cgi" });
    };
    rq.onsuccess = function () { cb(rq.result); };
    rq.onerror = function () { cb(null); };
  }

  function cacheSave(towers, cb) {
    idb(function (db) {
      if (!db) return cb(false);
      var tx = db.transaction(STORE, "readwrite"), st = tx.objectStore(STORE);
      towers.forEach(function (t) { st.put(t); });
      tx.oncomplete = function () { cb(true); };
      tx.onerror = function () { cb(false); };
    });
  }

  function cacheLoad(cb) {
    idb(function (db) {
      if (!db) return cb([]);
      var tx = db.transaction(STORE, "readonly");
      var rq = tx.objectStore(STORE).getAll();
      rq.onsuccess = function () { cb(rq.result || []); };
      rq.onerror = function () { cb([]); };
    });
  }

  function cacheClear(cb) {
    idb(function (db) {
      if (!db) return cb();
      var tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = cb;
    });
  }

  /* ---------------------------------------------- CGI parsing */
  /* A cell identity arrives in a dozen shapes. Everything structural
     here is decidable offline from the numbering standard alone.     */
  function parseCGI(raw) {
    var s = String(raw || "").trim().toUpperCase();
    if (!s) return null;

    var parts = s.split(/[-_/:|\s.]+/).filter(Boolean);
    var out = { input: raw.trim(), mcc: "", mnc: "", lac: "", ci: "", form: "" };

    if (parts.length >= 4 && /^\d{3}$/.test(parts[0])) {
      out.mcc = parts[0]; out.mnc = parts[1]; out.lac = parts[2]; out.ci = parts[3];
      out.form = "MCC-MNC-LAC-CI";
    } else if (parts.length === 2 && /^\d+$/.test(parts[0])) {
      out.lac = parts[0]; out.ci = parts[1]; out.form = "LAC-CI";
    } else if (parts.length === 1 && /^\d{9,15}$/.test(parts[0])) {
      // packed CGI: 3 MCC + 2-3 MNC + rest
      var d = parts[0];
      out.mcc = d.slice(0, 3);
      var mncLen = (d.slice(0, 3) === "405") ? 3 : 2;
      out.mnc = d.slice(3, 3 + mncLen);
      var rest = d.slice(3 + mncLen);
      out.lac = rest.slice(0, Math.max(1, rest.length - 5));
      out.ci = rest.slice(Math.max(1, rest.length - 5));
      out.form = "packed (LAC/CI split inferred)";
    } else if (parts.length === 3 && /^\d{3}$/.test(parts[0])) {
      out.mcc = parts[0]; out.mnc = parts[1]; out.ci = parts[2];
      out.form = "MCC-MNC-CI";
    } else {
      out.form = "unrecognised";
      out.ci = s;
    }

    // LTE: E-UTRAN Cell Identity = eNodeB (20 bits) + sector (8 bits)
    var ciNum = parseInt(out.ci, 10);
    if (!isNaN(ciNum) && ciNum > 65535) {
      out.enb = Math.floor(ciNum / 256);
      out.sector = ciNum % 256;
    }
    out.key = [out.mcc, out.mnc, out.lac, out.ci].join("-");
    return out;
  }

  function opFromPlmn(mcc, mnc) {
    var hit = (window.MCCMNC || []).filter(function (r) {
      return r.mcc === mcc && r.mnc === String(mnc).replace(/^0+(?=\d)/, "");
    })[0];
    if (!hit) return "";
    return (window.TSP && TSP[hit.op]) ? TSP[hit.op].short : hit.op;
  }

  var OP_COLOR = {
    Airtel: "#F04E4E", Jio: "#3F7BE8", Vi: "#E0A42B",
    BSNL: "#3FD18B", MTNL: "#A78BFA"
  };
  function opColor(o) { return OP_COLOR[o] || "#7D8CA5"; }

  /* ---------------------------------------------- sector map (SVG) */
  function drawMap(towers, centre, radiusKm) {
    if (!towers.length) return TK.empty("No towers to plot.", "◌");

    var W = 860, H = 560, PAD = 46;
    var lats = towers.map(function (t) { return t.lat; });
    var lons = towers.map(function (t) { return t.lon; });
    if (centre) { lats.push(centre.lat); lons.push(centre.lon); }

    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLon = Math.min.apply(null, lons), maxLon = Math.max.apply(null, lons);
    // pad the extent so edge markers are not clipped
    var padLat = Math.max((maxLat - minLat) * 0.14, 0.004);
    var padLon = Math.max((maxLon - minLon) * 0.14, 0.004);
    minLat -= padLat; maxLat += padLat; minLon -= padLon; maxLon += padLon;

    var spanLat = maxLat - minLat, spanLon = maxLon - minLon;
    function X(lon) { return PAD + (lon - minLon) / spanLon * (W - PAD * 2); }
    function Y(lat) { return H - PAD - (lat - minLat) / spanLat * (H - PAD * 2); }

    // metres-per-pixel, for the scale bar and sector radius
    var midLat = (minLat + maxLat) / 2;
    var kmPerPxX = TK.haversine(midLat, minLon, midLat, maxLon) / (W - PAD * 2);

    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" style="height:auto;' +
      'background:var(--bg-2);border-radius:var(--r3);border:1px solid var(--line)" ' +
      'role="img" aria-label="Cell tower sector map">';

    // graticule
    svg += '<g opacity=".28">';
    for (var gi = 0; gi <= 4; gi++) {
      var gx = PAD + gi * (W - PAD * 2) / 4, gy = PAD + gi * (H - PAD * 2) / 4;
      svg += '<line x1="' + gx + '" y1="' + PAD + '" x2="' + gx + '" y2="' + (H - PAD) +
        '" stroke="var(--line-2)" stroke-width="1"/>' +
        '<line x1="' + PAD + '" y1="' + gy + '" x2="' + (W - PAD) + '" y2="' + gy +
        '" stroke="var(--line-2)" stroke-width="1"/>';
    }
    svg += "</g>";

    // search radius ring
    if (centre && radiusKm) {
      var rpx = radiusKm / kmPerPxX;
      svg += '<circle cx="' + X(centre.lon) + '" cy="' + Y(centre.lat) + '" r="' + rpx +
        '" fill="var(--accent)" fill-opacity=".05" stroke="var(--accent)" ' +
        'stroke-width="1.4" stroke-dasharray="6 5"/>';
    }

    // sector wedges, azimuth is the direction the antenna faces,
    // measured clockwise from true north
    var BEAM = 65, REACH_KM = 1.1;
    towers.forEach(function (t) {
      if (isNaN(t.az)) return;
      var cx = X(t.lon), cy = Y(t.lat);
      var r = Math.max(26, REACH_KM / kmPerPxX);
      var a0 = (t.az - BEAM / 2 - 90) * Math.PI / 180;
      var a1 = (t.az + BEAM / 2 - 90) * Math.PI / 180;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      svg += '<path d="M' + cx + " " + cy + " L" + x0.toFixed(1) + " " + y0.toFixed(1) +
        " A" + r.toFixed(1) + " " + r.toFixed(1) + " 0 0 1 " + x1.toFixed(1) + " " + y1.toFixed(1) +
        ' Z" fill="' + opColor(t.op) + '" fill-opacity=".16" stroke="' + opColor(t.op) +
        '" stroke-opacity=".45" stroke-width="1"/>';
    });

    // tower markers
    towers.forEach(function (t) {
      svg += '<circle cx="' + X(t.lon) + '" cy="' + Y(t.lat) + '" r="4.5" fill="' +
        opColor(t.op) + '" stroke="var(--bg)" stroke-width="1.4"><title>' +
        esc(t.cgi + "  " + t.op + "  az " + t.az + "°\n" + t.site + "\n" + t.lat + ", " + t.lon) +
        "</title></circle>";
    });

    if (centre) {
      var ccx = X(centre.lon), ccy = Y(centre.lat);
      svg += '<g><line x1="' + (ccx - 9) + '" y1="' + ccy + '" x2="' + (ccx + 9) + '" y2="' + ccy +
        '" stroke="var(--fg)" stroke-width="2"/><line x1="' + ccx + '" y1="' + (ccy - 9) +
        '" x2="' + ccx + '" y2="' + (ccy + 9) + '" stroke="var(--fg)" stroke-width="2"/></g>';
    }

    // scale bar
    var targetPx = 130, km = targetPx * kmPerPxX;
    var nice = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50].reduce(function (a, b) {
      return Math.abs(b - km) < Math.abs(a - km) ? b : a;
    });
    var barPx = nice / kmPerPxX;
    svg += '<g transform="translate(' + PAD + "," + (H - 20) + ')">' +
      '<line x1="0" y1="0" x2="' + barPx.toFixed(1) + '" y2="0" stroke="var(--fg-2)" stroke-width="2"/>' +
      '<line x1="0" y1="-4" x2="0" y2="4" stroke="var(--fg-2)" stroke-width="2"/>' +
      '<line x1="' + barPx.toFixed(1) + '" y1="-4" x2="' + barPx.toFixed(1) +
      '" y2="4" stroke="var(--fg-2)" stroke-width="2"/>' +
      '<text x="' + (barPx / 2).toFixed(1) + '" y="-8" text-anchor="middle" font-size="11" ' +
      'font-family="var(--mono)" fill="var(--fg-2)">' + (nice < 1 ? nice * 1000 + " m" : nice + " km") + "</text></g>";

    // north arrow
    svg += '<g transform="translate(' + (W - 30) + ',' + (PAD - 6) + ')">' +
      '<path d="M0 12 L0 -10 M0 -10 L-4 -4 M0 -10 L4 -4" stroke="var(--fg-2)" stroke-width="1.6" fill="none"/>' +
      '<text x="0" y="24" text-anchor="middle" font-size="10" fill="var(--fg-3)">N</text></g>';

    svg += "</svg>";
    return svg;
  }

  /* ============================================================ tool */
  TK.reg({
    id: "cellspyder",
    name: "Cell Spyder",
    cluster: "telecom",
    tier: 2,
    desc: "Resolve cell IDs to sites, search towers by radius, and plot sector coverage with azimuth.",
    lede: "Turn a cell identity into a place using the operator's own site list. See which way the " +
          "antenna was pointing. The site list is saved on this computer, so it works offline after the first load.",
    badges: ["CGI decode", "Sector map", "IndexedDB cache"],
    wide: true,
    render: function (root) {
      var DB = [], byKey = {}, mode = "cgi", results = [], centre = null, radiusKm = 2;
      var opFilter = {};

      root.innerHTML =
        '<p class="small muted">Use the cell site list the operator supplied with the CDR. ' +
        'Crowdsourced tower databases are often out by hundreds of metres.</p>' +

        '<div class="card"><div class="row" style="justify-content:space-between">' +
          "<h3 style=\"margin:0\">Site database</h3><span id=\"cs-dbstat\" class=\"xs muted\"></span></div>" +
          '<div class="drop" id="cs-drop" style="margin-top:14px"><div class="big"></div>' +
          "<div>Drop the cell site master data (CSV), or <b>browse</b></div>" +
          '<div class="xs muted" style="margin-top:8px">Cached in this browser. Survives a reload; never uploaded.</div></div>' +
          '<div class="row" style="margin-top:12px">' +
            '' +
            '<button class="btn ghost" id="cs-clear">Clear cache</button>' +
          "</div></div>" +

        '<div class="card"><div class="row"><div class="seg" id="cs-mode">' +
          '<button class="on" data-m="cgi">Cell ID lookup</button>' +
          '<button data-m="radius">Location search</button>' +
        "</div></div><div id=\"cs-controls\" style=\"margin-top:14px\"></div></div>" +
        '<div id="cs-out"></div>';

      /* ---- database load ---- */
      function setStat() {
        $("#cs-dbstat").innerHTML = DB.length
          ? '<span class="badge ok">' + TK.fmtNum(DB.length) + " sectors · " +
            TK.fmtNum(new Set(DB.map(function (t) { return t.lat + "," + t.lon; })).size) +
            " sites cached</span>"
          : '<span class="badge warn">no site data loaded</span>';
      }

      function indexDB() {
        byKey = {};
        DB.forEach(function (t) {
          byKey[t.cgi.toUpperCase()] = t;
          var p = parseCGI(t.cgi);
          if (p) byKey[p.key] = t;
          if (t.lac && t.ci) byKey[(t.lac + "-" + t.ci).toUpperCase()] = t;
          if (t.ci) byKey["CI:" + String(t.ci).toUpperCase()] = t;
        });
        opFilter = {};
        DB.forEach(function (t) { if (t.op) opFilter[t.op] = true; });
      }

      function ingest(text, cb) {
        var ps = TK.parseSmart(text, TK.SPEC.cellsite);
        var p = ps.p, m = ps.sm.map;

        if (!m.lat || !m.lon) {
          return cb(null, "No latitude/longitude columns found. Headers: " + p.headers.join(", "));
        }

        var towers = p.rows.map(function (r) {
          var cgi = m.cgi ? String(r[m.cgi]).trim() : "";
          var mcc = m.mcc ? String(r[m.mcc]).trim() : "";
          var mnc = m.mnc ? String(r[m.mnc]).trim() : "";
          var lac = m.lac ? String(r[m.lac]).trim() : "";
          var ci  = m.ci ? String(r[m.ci]).trim() : "";
          if (!cgi && mcc && mnc) cgi = [mcc, mnc, lac, ci].filter(Boolean).join("-");
          if (!cgi) cgi = [lac, ci].filter(Boolean).join("-");
          var op = m.op ? String(r[m.op]).trim() : "";
          if (!op && mcc && mnc) op = opFromPlmn(mcc, mnc);
          return {
            cgi: cgi, mcc: mcc, mnc: mnc, lac: lac, ci: ci,
            op: op,
            tech: m.tech ? String(r[m.tech]).trim() : "",
            stype: m.stype ? String(r[m.stype]).trim() : "",
            az: m.az ? parseFloat(r[m.az]) : NaN,
            lat: parseFloat(r[m.lat]), lon: parseFloat(r[m.lon]),
            site: m.site ? String(r[m.site]).trim() : "",
            addr: m.addr ? String(r[m.addr]).trim() : "",
            city: m.city ? String(r[m.city]).trim() : "",
            circle: m.circle ? String(r[m.circle]).trim() : ""
          };
        }).filter(function (t) {
          return t.cgi && !isNaN(t.lat) && !isNaN(t.lon);
        });

        cb(towers, towers.length ? "" : "No rows had both a cell identity and valid coordinates.");
      }

      function adopt(towers) {
        var seen = {};
        DB.forEach(function (t) { seen[t.cgi.toUpperCase()] = 1; });
        var fresh = towers.filter(function (t) { return !seen[t.cgi.toUpperCase()]; });
        DB = DB.concat(fresh);
        indexDB(); setStat(); controls();
        cacheSave(towers, function (ok) {
          TK.toast(TK.fmtNum(fresh.length) + " new sectors" + (ok ? " cached" : " loaded"), "ok");
        });
      }

      TK.dropzone($("#cs-drop"), function (f) {
        TK.readText(f, function (txt) {
          ingest(txt, function (towers, err) {
            if (!towers) { TK.toast(err, "danger"); return; }
            adopt(towers);
          });
        });
      }, { accept: ".csv,.tsv,.txt" });


      $("#cs-clear").onclick = function () {
        cacheClear(function () {
          DB = []; byKey = {}; indexDB(); setStat(); controls();
          $("#cs-out").innerHTML = "";
          TK.toast("Cache cleared", "ok");
        });
      };

      $("#cs-mode").onclick = function (e) {
        var b = e.target.closest("button"); if (!b) return;
        $$("#cs-mode button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); mode = b.dataset.m; controls();
        $("#cs-out").innerHTML = "";
      };

      /* ---- controls ---- */
      function controls() {
        var c = $("#cs-controls");
        if (mode === "cgi") {
          c.innerHTML =
            '<div class="field"><label class="lbl">Cell IDs, one per line, bulk supported</label>' +
            '<textarea id="cs-ids" class="mono" placeholder="404-45-1149-21&#10;404-45-3310-31&#10;1149-22&#10;40445114921"></textarea></div>' +
            '<div class="row"><button class="btn primary" id="cs-go">Look up</button>' +
            '</div>';

      TK.fileInto("#cs-ids", { onLoad: function () { var b = TK.$("#cs-go"); if (b) b.click(); } });
          $("#cs-go").onclick = runCGI;
        } else {
          c.innerHTML =
            '<div class="grid c3">' +
            '<div class="field"><label class="lbl">Latitude</label><input type="text" id="cs-lat" class="mono" placeholder="12.9352"></div>' +
            '<div class="field"><label class="lbl">Longitude</label><input type="text" id="cs-lon" class="mono" placeholder="77.6245"></div>' +
            '<div class="field"><label class="lbl">Radius</label>' +
              '<div class="row tight"><input type="range" id="cs-r" min="100" max="15000" step="100" value="2000" style="flex:1">' +
              '<span id="cs-rlbl" class="mono small nowrap">2.0 km</span></div></div>' +
            "</div>" +
            '<div class="row"><button class="btn primary" id="cs-go2">Search</button>' +
            '</div>';
          var r = $("#cs-r");
          r.oninput = function () {
            radiusKm = +r.value / 1000;
            $("#cs-rlbl").textContent = radiusKm < 1
              ? Math.round(+r.value) + " m" : radiusKm.toFixed(1) + " km";
          };
          $("#cs-go2").onclick = runRadius;
        }
      }

      /* ---- CGI lookup ---- */
      function runCGI() {
        var lines = $("#cs-ids").value.split(/[\n,;]+/)
          .map(function (s) { return s.trim(); }).filter(Boolean);
        if (!lines.length) return;

        results = lines.map(function (line) {
          var p = parseCGI(line);
          var hit = byKey[line.toUpperCase()] || byKey[p.key] ||
            (p.lac && p.ci ? byKey[(p.lac + "-" + p.ci).toUpperCase()] : null) ||
            (p.ci ? byKey["CI:" + String(p.ci).toUpperCase()] : null);
          return { q: line, p: p, t: hit || null };
        });
        centre = null;
        render("cgi");
      }

      /* ---- radius search ---- */
      function runRadius() {
        var la = parseFloat($("#cs-lat").value), lo = parseFloat($("#cs-lon").value);
        if (isNaN(la) || isNaN(lo)) { TK.toast("Enter valid coordinates", "danger"); return; }
        centre = { lat: la, lon: lo };
        results = DB.map(function (t) {
          return { q: t.cgi, p: parseCGI(t.cgi), t: t, d: TK.haversine(la, lo, t.lat, t.lon) };
        }).filter(function (x) { return x.d <= radiusKm; })
          .sort(function (a, b) { return a.d - b.d; });
        render("radius");
      }

      /* ---- render ---- */
      function render(kind) {
        var found = results.filter(function (r) { return r.t; });
        var miss = results.filter(function (r) { return !r.t; });
        var ops = {};
        found.forEach(function (r) { ops[r.t.op || "unknown"] = (ops[r.t.op || "unknown"] || 0) + 1; });
        var opList = Object.keys(ops).sort(function (a, b) { return ops[b] - ops[a]; });

        var shown = found.filter(function (r) { return opFilter[r.t.op] !== false; });
        var sites = new Set(shown.map(function (r) { return r.t.lat + "," + r.t.lon; }));

        var h = '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(TK.fmtNum(results.length), kind === "cgi" ? "Cell IDs queried" : "Sectors in radius") +
          TK.stat(TK.fmtNum(found.length), "Resolved", found.length ? "ok" : "") +
          TK.stat(TK.fmtNum(sites.size), "Physical sites", "accent") +
          TK.stat(miss.length, "Not in site list", miss.length ? "warn" : "ok") +
        "</div>";

        if (!DB.length) {
          h += '<div class="note warn"><b>No site database loaded</b><p>Cell identities can still be ' +
            "decoded structurally, but nothing can be placed on a map until you load the operator's " +
            "site list.</p></div>";
        }

        if (miss.length && DB.length) {
          h += '<div class="note warn"><b>' + miss.length + " cell ID(s) not in the loaded site list</b>" +
            "<p class='mono xs'>" + esc(miss.map(function (r) { return r.q; }).join("  ·  ")) + "</p>" +
            "<p>Either the site belongs to another operator, you need that operator's list too, or the " +
            "site was decommissioned after the CDR period. Ask the licensee for the site list " +
            "<i>as it stood on the date of the offence</i>, not as it stands today.</p></div>";
        }

        // operator filter
        if (opList.length > 1) {
          h += '<div class="card tight"><div class="row"><h4 style="margin:0">Operators</h4>' +
            opList.map(function (o) {
              return '<label class="check"><input type="checkbox" data-op="' + esc(o) + '"' +
                (opFilter[o] === false ? "" : " checked") + ">" +
                '<span class="badge" style="border-color:' + opColor(o) + ";color:" + opColor(o) + '">' +
                esc(o) + " · " + ops[o] + "</span></label>";
            }).join("") + "</div></div>";
        }

        if (shown.length) {
          h += '<div class="card"><h3>Sector map</h3>' +
            '<p class="small muted">Wedges show antenna azimuth at a nominal 65° beamwidth. They indicate ' +
            "<b>direction</b>, not verified coverage, real cell reach varies with terrain, power and load. " +
            "Hover a marker for its details.</p>" +
            drawMap(shown.map(function (r) { return r.t; }), centre, kind === "radius" ? radiusKm : 0) +
            '<div class=\"row\" style=\"margin-top:12px\">' +
              '<button class="btn" id="cs-kml">Export KML</button>' +
              '<button class="btn" id="cs-geo">Export GeoJSON</button>' +
              '<button class="btn ghost" id="cs-osm">Open area in OpenStreetMap</button>' +
            "</div>" +
            '<p class="xs muted" style="margin-top:10px">KML opens in Google Earth over real imagery, ' +
            "that is the practical way to put these on a basemap for a case file.</p></div>";
        }

        h += '<div class="card"><h3>Tower details</h3><div id="cs-tbl"></div></div>';

        h += '<p class="small muted">A serving cell places a phone in a sector, which can span ' +
          "kilometres. It does not place a person at an address.</p>";

        $("#cs-out").innerHTML = h;

        $$('#cs-out [data-op]').forEach(function (cb) {
          cb.onchange = function () { opFilter[cb.dataset.op] = cb.checked; render(kind); };
        });

        var rows = (kind === "radius" ? shown : results).map(function (r) {
          var t = r.t || {};
          return {
            q: r.q,
            form: r.p ? r.p.form : "",
            cgi: t.cgi || "",
            op: t.op || "",
            tech: t.tech || "",
            az: isNaN(t.az) ? null : t.az,
            d: r.d === undefined ? null : Math.round(r.d * 1000),
            lat: t.lat, lon: t.lon,
            site: t.site || "",
            addr: t.addr || "",
            enb: r.p && r.p.enb ? r.p.enb + " / " + r.p.sector : ""
          };
        });

        var cols = [
          { k: "q", label: "Queried", cls: "mono" },
          { k: "cgi", label: "CGI", cls: "mono", fmt: function (v) {
              return v ? esc(v) : '<span class="badge warn">not found</span>'; } },
          { k: "op", label: "Operator", fmt: function (v) {
              return v ? '<span class="badge" style="border-color:' + opColor(v) + ";color:" + opColor(v) +
                '">' + esc(v) + "</span>" : ""; } },
          { k: "tech", label: "Tech" },
          { k: "az", label: "Azimuth", cls: "num", fmt: function (v) {
              return v === null ? "" : v + "° " + TK.compass(v); } },
          { k: "enb", label: "eNB / sector", cls: "mono" },
          { k: "lat", label: "Latitude", cls: "num mono", fmt: function (v) { return v ? v.toFixed(6) : ""; } },
          { k: "lon", label: "Longitude", cls: "num mono", fmt: function (v) { return v ? v.toFixed(6) : ""; } },
          { k: "site", label: "Site" },
          { k: "addr", label: "Address", w: "200px" }
        ];
        if (kind === "radius") {
          cols.splice(4, 0, { k: "d", label: "Distance (m)", cls: "num" });
        }
        TK.table($("#cs-tbl"), rows, cols, { filename: "cell-towers", pageSize: 200 });

        var plot = shown.map(function (r) { return r.t; });
        var kmlBtn = $("#cs-kml");
        if (kmlBtn) {
          kmlBtn.onclick = function () {
            TK.download("cell-towers.kml",
              '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n' +
              "<name>Cell sites</name>\n" +
              plot.map(function (t) {
                return "  <Placemark><name>" + esc(t.cgi) + "</name><description>" +
                  esc([t.op, t.tech, t.site, t.addr, "azimuth " + t.az + "°"].filter(Boolean).join(" | ")) +
                  "</description><Point><coordinates>" + t.lon + "," + t.lat + ",0</coordinates></Point></Placemark>";
              }).join("\n") + "\n</Document></kml>",
              "application/vnd.google-earth.kml+xml");
          };
          $("#cs-geo").onclick = function () {
            TK.download("cell-towers.geojson", JSON.stringify({
              type: "FeatureCollection",
              features: plot.map(function (t) {
                return { type: "Feature",
                  properties: { cgi: t.cgi, operator: t.op, tech: t.tech, azimuth: t.az,
                                site: t.site, address: t.addr },
                  geometry: { type: "Point", coordinates: [t.lon, t.lat] } };
              })
            }, null, 2), "application/geo+json");
          };
          $("#cs-osm").onclick = function () {
            var cl = centre || { lat: plot[0].lat, lon: plot[0].lon };
            window.open("https://www.openstreetmap.org/#map=14/" + cl.lat.toFixed(5) + "/" + cl.lon.toFixed(5),
              "_blank", "noopener");
          };
        }
      }

      /* ---- boot: restore the cache ---- */
      setStat(); controls();
      cacheLoad(function (towers) {
        if (towers && towers.length) {
          DB = towers; indexDB(); setStat(); controls();
          TK.toast(TK.fmtNum(towers.length) + " sectors restored from cache", "ok");
        }
      });
    }
  });
})();
