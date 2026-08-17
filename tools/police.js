/* ============================================================
   Police Station Lookup

   Browse by state and district, search by name, or find the
   nearest station to a coordinate.

   COVERAGE IS PARTIAL AND THE TOOL SAYS SO.
   There is no single public, complete, machine-readable register of
   Indian police stations. This ships the best open source there is
   (OpenStreetMap), which maps a few thousand of roughly seventeen
   thousand stations, with far better coverage in cities than in
   rural districts. Treat it as a finding aid and import your state's
   official list to supplement it.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, $$ = TK.$$, esc = TK.esc;

  /* ---------------------------------------------- small scatter map */
  function plot(rows, centre) {
    if (!rows.length) return "";
    var W = 840, H = 470, PAD = 40;
    var lats = rows.map(function (r) { return r.y; });
    var lons = rows.map(function (r) { return r.x; });
    if (centre) { lats.push(centre.lat); lons.push(centre.lon); }
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLon = Math.min.apply(null, lons), maxLon = Math.max.apply(null, lons);
    var padLat = Math.max((maxLat - minLat) * 0.12, 0.02);
    var padLon = Math.max((maxLon - minLon) * 0.12, 0.02);
    minLat -= padLat; maxLat += padLat; minLon -= padLon; maxLon += padLon;
    var sLat = maxLat - minLat, sLon = maxLon - minLon;
    function X(l) { return PAD + (l - minLon) / sLon * (W - PAD * 2); }
    function Y(l) { return H - PAD - (l - minLat) / sLat * (H - PAD * 2); }

    var mid = (minLat + maxLat) / 2;
    var kmPerPx = TK.haversine(mid, minLon, mid, maxLon) / (W - PAD * 2);

    var s = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" style="height:auto;' +
      'background:var(--bg-2);border:1px solid var(--line);border-radius:var(--r3)" ' +
      'role="img" aria-label="Police station locations">';
    s += '<g opacity=".25">';
    for (var i = 0; i <= 4; i++) {
      var gx = PAD + i * (W - PAD * 2) / 4, gy = PAD + i * (H - PAD * 2) / 4;
      s += '<line x1="' + gx + '" y1="' + PAD + '" x2="' + gx + '" y2="' + (H - PAD) +
        '" stroke="var(--line-2)"/><line x1="' + PAD + '" y1="' + gy + '" x2="' + (W - PAD) +
        '" y2="' + gy + '" stroke="var(--line-2)"/>';
    }
    s += "</g>";

    rows.forEach(function (r) {
      s += '<circle cx="' + X(r.x).toFixed(1) + '" cy="' + Y(r.y).toFixed(1) +
        '" r="4" fill="var(--accent)" fill-opacity=".85" stroke="var(--bg)" stroke-width="1"><title>' +
        esc(r.n + (r.d ? "\n" + r.d : "") + (r.s ? ", " + r.s : "") + "\n" + r.y + ", " + r.x) +
        "</title></circle>";
    });
    if (centre) {
      var cx = X(centre.lon), cy = Y(centre.lat);
      s += '<g><circle cx="' + cx + '" cy="' + cy + '" r="7" fill="none" stroke="var(--warn)" stroke-width="2"/>' +
        '<line x1="' + (cx - 10) + '" y1="' + cy + '" x2="' + (cx + 10) + '" y2="' + cy +
        '" stroke="var(--warn)" stroke-width="1.6"/><line x1="' + cx + '" y1="' + (cy - 10) +
        '" x2="' + cx + '" y2="' + (cy + 10) + '" stroke="var(--warn)" stroke-width="1.6"/></g>';
    }

    var targetPx = 120, km = targetPx * kmPerPx;
    var nice = [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500].reduce(function (a, b) {
      return Math.abs(b - km) < Math.abs(a - km) ? b : a;
    });
    var bar = nice / kmPerPx;
    s += '<g transform="translate(' + PAD + "," + (H - 16) + ')">' +
      '<line x1="0" y1="0" x2="' + bar.toFixed(1) + '" y2="0" stroke="var(--fg-2)" stroke-width="2"/>' +
      '<text x="' + (bar / 2).toFixed(1) + '" y="-7" text-anchor="middle" font-size="11" ' +
      'font-family="var(--mono)" fill="var(--fg-2)">' + nice + " km</text></g>";
    return s + "</svg>";
  }

  /* ============================================================ tool */
  TK.reg({
    id: "ps",
    name: "Police Station Lookup",
    cluster: "movement",
    tier: 1,
    desc: "Browse police stations by state and district, search by name, or find the nearest station to a coordinate.",
    lede: "Which station has jurisdiction, and where is it. Bundled from open data with state and " +
          "district resolved by coordinates, and honest about the districts it does not yet cover.",
    badges: ["OpenStreetMap", "Offline", "Partial coverage"],
    wide: true,
    render: function (root) {
      var DB = null, mode = "browse", results = [], centre = null;

      root.innerHTML =
        '<div class="note warn">This list is incomplete: it covers a few thousand of roughly ' +
        "seventeen thousand stations, and cities better than villages. <b>A station missing here may " +
        "still exist.</b> Import your state's own list below to fill the gaps.</div>" +

        '<div class="card"><div class="row" style="justify-content:space-between">' +
          '<div class="seg" id="ps-mode">' +
            '<button class="on" data-m="browse">Browse by state &amp; district</button>' +
            '<button data-m="name">Search by name</button>' +
            '<button data-m="near">Nearest station</button>' +
          "</div><span id=\"ps-stat\" class=\"row tight xs muted\"></span></div>" +
          '<div id="ps-controls" style="margin-top:16px"></div></div>' +
        '<div id="ps-out"></div>' +

        '<div class="card"><h3>Import an official list</h3>' +
        '<p class="small muted">Any CSV with a station name and coordinates. Columns for district, state, ' +
        "address and phone are picked up if present. Imported rows are merged with the bundled set for this " +
        "session.</p>" +
        '<div class="drop" id="ps-drop"><div class="big"></div><div>Drop the CSV, or <b>browse</b></div></div>' +
        '<div class="row" style="margin-top:12px"><button class="btn ghost sm" id="ps-tmpl">Download a blank template</button></div></div>';

      $("#ps-tmpl").onclick = function () {
        TK.download("police-stations-template.csv",
          "name,district,state,latitude,longitude,address,phone\n" +
          "Example PS,Bengaluru Urban,Karnataka,12.9716,77.5946,\"MG Road\",080-00000000\n", "text/csv");
      };

      TK.dropzone($("#ps-drop"), function (f) {
        TK.readText(f, function (txt) {
          var ps = TK.parseSmart(txt, TK.SPEC.station);
          var p = ps.p, m = ps.sm.map;
          if (!m.n) { TK.toast("No station-name column found", "danger"); return; }
          var added = p.rows.map(function (r) {
            return {
              n: String(r[m.n]).trim(),
              d: m.d ? String(r[m.d]).trim() : "",
              s: m.s ? String(r[m.s]).trim() : "",
              y: m.y ? parseFloat(r[m.y]) : NaN,
              x: m.x ? parseFloat(r[m.x]) : NaN,
              a: m.a ? String(r[m.a]).trim() : "",
              p: m.p ? String(r[m.p]).trim() : "",
              imported: true
            };
          }).filter(function (r) { return r.n; });
          DB = (DB || []).concat(added);
          TK.toast(added.length + " stations imported", "ok");
          stat(); controls();
        });
      }, { accept: ".csv,.tsv,.txt" });

      function stat() {
        $("#ps-stat").innerHTML = DB
          ? '<span class="badge ok">' + TK.fmtNum(DB.length) + " stations · " +
            TK.fmtNum(new Set(DB.map(function (r) { return r.s; }).filter(Boolean)).size) + " states</span>"
          : '<span class="spinner"></span>';
      }

      function states() {
        var s = {};
        DB.forEach(function (r) { if (r.s) s[r.s] = (s[r.s] || 0) + 1; });
        return Object.keys(s).sort().map(function (k) { return { name: k, n: s[k] }; });
      }
      function districts(st) {
        var d = {};
        DB.forEach(function (r) { if (r.s === st && r.d) d[r.d] = (d[r.d] || 0) + 1; });
        return Object.keys(d).sort().map(function (k) { return { name: k, n: d[k] }; });
      }

      /* ---- controls ---- */
      function controls() {
        if (!DB) return;
        var c = $("#ps-controls");

        if (mode === "browse") {
          c.innerHTML =
            '<div class="grid c3">' +
              '<div class="field"><label class="lbl">Select state</label><select id="ps-st">' +
                '<option value="">-- Select State --</option>' +
                states().map(function (s) {
                  return '<option value="' + esc(s.name) + '">' + esc(s.name) + " (" + s.n + ")</option>";
                }).join("") + "</select></div>" +
              '<div class="field"><label class="lbl">Select district</label>' +
                '<select id="ps-dt" disabled><option value="">-- Select District --</option></select></div>' +
              '<div class="field"><label class="lbl">Filter district by name</label>' +
                '<input type="text" id="ps-dq" placeholder="type to narrow the list"></div>' +
            "</div><button class=\"btn primary\" id=\"ps-go\">Search</button>";

          var stSel = $("#ps-st"), dtSel = $("#ps-dt"), dq = $("#ps-dq");
          function fillDistricts() {
            var st = stSel.value;
            var q = dq.value.trim().toLowerCase();
            var list = st ? districts(st).filter(function (d) {
              return !q || d.name.toLowerCase().indexOf(q) !== -1;
            }) : [];
            dtSel.disabled = !st;
            dtSel.innerHTML = '<option value="">' +
              (st ? "-- All districts in " + esc(st) + " --" : "-- Select District --") + "</option>" +
              list.map(function (d) {
                return '<option value="' + esc(d.name) + '">' + esc(d.name) + " (" + d.n + ")</option>";
              }).join("");
          }
          stSel.onchange = fillDistricts;
          dq.oninput = fillDistricts;
          $("#ps-go").onclick = function () {
            var st = stSel.value, dt = dtSel.value;
            if (!st) { TK.toast("Select a state", "danger"); return; }
            centre = null;
            results = DB.filter(function (r) {
              return r.s === st && (!dt || r.d === dt);
            }).sort(function (a, b) { return (a.d || "").localeCompare(b.d || "") || a.n.localeCompare(b.n); });
            render();
          };

        } else if (mode === "name") {
          c.innerHTML =
            '<div class="field"><label class="lbl">Search PS name</label>' +
            '<input type="text" id="ps-q" placeholder="e.g. Koramangala, Cyber Crime, Kotwali"></div>' +
            '<p class="xs muted">Matches the station name, district and address.</p>';
          var q = $("#ps-q");
          q.oninput = function () {
            var v = q.value.trim().toLowerCase();
            if (v.length < 2) { results = []; $("#ps-out").innerHTML = ""; return; }
            centre = null;
            results = DB.filter(function (r) {
              return (r.n + " " + r.d + " " + r.s + " " + (r.a || "")).toLowerCase().indexOf(v) !== -1;
            }).slice(0, 800);
            render();
          };

        } else {
          c.innerHTML =
            '<p class="small muted">Give a coordinate, a scene, a cell site, a recovered vehicle, and ' +
            "list the closest stations. Useful for working out jurisdiction and for a zero-FIR transfer.</p>" +
            '<div class="grid c3">' +
              '<div class="field"><label class="lbl">Latitude</label><input type="text" id="ps-lat" class="mono" placeholder="12.9352"></div>' +
              '<div class="field"><label class="lbl">Longitude</label><input type="text" id="ps-lon" class="mono" placeholder="77.6245"></div>' +
              '<div class="field"><label class="lbl">How many</label><input type="number" id="ps-k" value="10" min="1" max="100"></div>' +
            "</div>" +
            '<div class="row"><button class="btn primary" id="ps-go2">Find nearest</button>' +
            '<button class="btn" id="ps-here">Use my location</button></div>';

          $("#ps-go2").onclick = near;
          $("#ps-here").onclick = function () {
            if (!navigator.geolocation) { TK.toast("Geolocation unavailable", "danger"); return; }
            navigator.geolocation.getCurrentPosition(function (pos) {
              $("#ps-lat").value = pos.coords.latitude.toFixed(6);
              $("#ps-lon").value = pos.coords.longitude.toFixed(6);
              near();
            }, function () { TK.toast("Location permission denied", "danger"); });
          };
        }
      }

      function near() {
        var la = parseFloat($("#ps-lat").value), lo = parseFloat($("#ps-lon").value);
        var k = +$("#ps-k").value || 10;
        if (isNaN(la) || isNaN(lo)) { TK.toast("Enter valid coordinates", "danger"); return; }
        centre = { lat: la, lon: lo };
        results = DB.filter(function (r) { return !isNaN(r.y) && !isNaN(r.x); })
          .map(function (r) {
            var c = Object.create(r);
            c.dist = TK.haversine(la, lo, r.y, r.x);
            return c;
          })
          .sort(function (a, b) { return a.dist - b.dist; })
          .slice(0, k);
        render();
      }

      /* ---- render ---- */
      function render() {
        if (!results.length) {
          $("#ps-out").innerHTML = '<div class="note"><b>No stations matched</b>' +
            "<p>Given the coverage gaps described above, this may mean the station is simply not mapped " +
            "yet rather than absent. Check the state's own list.</p></div>";
          return;
        }
        var withGeo = results.filter(function (r) { return !isNaN(r.y) && !isNaN(r.x); });
        var sts = new Set(results.map(function (r) { return r.s; }).filter(Boolean));
        var dts = new Set(results.map(function (r) { return r.d; }).filter(Boolean));

        var h = '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(TK.fmtNum(results.length), "Stations", "accent") +
          TK.stat(dts.size, "Districts") +
          TK.stat(sts.size, "States") +
          TK.stat(results.filter(function (r) { return r.p; }).length, "With a phone number",
                  results.filter(function (r) { return r.p; }).length ? "ok" : "warn") +
        "</div>";

        if (centre && results[0] && results[0].dist !== undefined) {
          var n0 = results[0];
          h += '<div class="note accent"><b>Nearest: ' + esc(n0.n) + "</b>" +
            "<p>" + (n0.dist < 1 ? Math.round(n0.dist * 1000) + " m" : n0.dist.toFixed(2) + " km") +
            " away, bearing " + TK.compass(TK.bearing(centre.lat, centre.lon, n0.y, n0.x)) +
            (n0.d ? " · " + esc(n0.d) : "") + (n0.s ? ", " + esc(n0.s) : "") + ".</p>" +
            "<p class='xs'>Nearest is not the same as in charge. Station limits follow notified boundaries, not " +
            "straight-line distance. Confirm with the district police before acting on this.</p></div>";
        }

        if (withGeo.length) {
          h += '<div class="card"><h3>Locations</h3>' + plot(withGeo, centre) +
            '<div class=\"row\" style=\"margin-top:12px\">' +
              '<button class="btn" id="ps-kml">Export KML</button>' +
              '<button class="btn ghost" id="ps-osm">Open in OpenStreetMap</button>' +
            "</div></div>";
        }

        h += '<div class="card"><h3>Stations</h3><div id="ps-tbl"></div></div>';
        $("#ps-out").innerHTML = h;

        var cols = [{ k: "n", label: "Police station", w: "210px" }];
        if (centre) cols.push({ k: "dist", label: "Distance", cls: "num", fmt: function (v) {
          return v === undefined ? "" : (v < 1 ? Math.round(v * 1000) + " m" : v.toFixed(2) + " km"); } });
        cols = cols.concat([
          { k: "d", label: "District" },
          { k: "s", label: "State" },
          { k: "a", label: "Address", w: "200px" },
          { k: "p", label: "Phone", cls: "mono" },
          { k: "y", label: "Latitude", cls: "num mono", fmt: function (v) { return isNaN(v) ? "" : v.toFixed(6); } },
          { k: "x", label: "Longitude", cls: "num mono", fmt: function (v) { return isNaN(v) ? "" : v.toFixed(6); } }
        ]);

        TK.table($("#ps-tbl"), results, cols, {
          filename: "police-stations", pageSize: 200,
          rowClass: function (r) { return r.imported ? "hi" : ""; }
        });

        var kml = $("#ps-kml");
        if (kml) {
          kml.onclick = function () {
            TK.download("police-stations.kml",
              '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n' +
              withGeo.map(function (r) {
                return "  <Placemark><name>" + esc(r.n) + "</name><description>" +
                  esc([r.d, r.s, r.a, r.p].filter(Boolean).join(" | ")) +
                  "</description><Point><coordinates>" + r.x + "," + r.y + ",0</coordinates></Point></Placemark>";
              }).join("\n") + "\n</Document></kml>",
              "application/vnd.google-earth.kml+xml");
          };
          $("#ps-osm").onclick = function () {
            var c = centre || { lat: withGeo[0].y, lon: withGeo[0].x };
            window.open("https://www.openstreetmap.org/#map=12/" + c.lat.toFixed(5) + "/" + c.lon.toFixed(5),
              "_blank", "noopener");
          };
        }
      }

      $("#ps-mode").onclick = function (e) {
        var b = e.target.closest("button"); if (!b) return;
        $$("#ps-mode button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); mode = b.dataset.m;
        results = []; centre = null;
        $("#ps-out").innerHTML = "";
        controls();
      };

      stat();
      TK.loadData("police.js", "POLICE_DB", function (d) {
        DB = d || [];
        stat(); controls();
      });
    }
  });
})();
