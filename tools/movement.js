/* ============================================================
   Cluster: Physical movement - "How did they move?"
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* ==========================================================
     Toll Plaza Directory
     ========================================================== */
  TK.reg({
    id: "toll",
    name: "Toll Plaza Directory",
    cluster: "movement",
    tier: 1,
    desc: "Search 688 NHAI toll plazas by name, operator, radius or route corridor, with coordinates and contacts.",
    lede: "Plaza locations, operators and site contacts are public. That is the half you " +
          "need in order to know where to send the notice. Which vehicle crossed when is not public. It " +
          "needs legal process.",
    badges: ["NHAI data", "688 plazas", "Offline"],
    wide: true,
    legal: {
      authority: "BNSS 2023 s.94 to NPCI / IHMCL for FASTag transaction records, and to the issuing " +
                 "bank for the tag's KYC.",
      threshold: "Investigating officer.",
      holder: "Plaza operator holds lane CCTV and ANPR locally, often for only a few days. NPCI/IHMCL " +
              "hold the transaction record. The issuing bank holds who the tag belongs to.",
      retention: "CCTV at the plaza is the perishable part, assume days, not weeks. Send the " +
                 "preservation request to the plaza operator before you draft anything else.",
      caution: "A FASTag crossing proves a tag passed a lane. It does not prove who was driving, and " +
               "tags are transferred between vehicles.",
      evidence: "Ask for tag ID, vehicle registration, plaza ID, lane number, direction and timestamp " +
                "together, plus the lane ANPR image, which is what ties the tag to the vehicle."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card"><div class="row" id="toll-mode-row">' +
          '<div class="seg" id="toll-mode">' +
            '<button class="on" data-m="name">By name / operator</button>' +
            '<button data-m="radius">Within a radius</button>' +
            '<button data-m="route">Along a route</button>' +
          "</div><span id=\"toll-load\" class=\"row tight xs muted\"></span></div>" +
          '<div id="toll-controls" style="margin-top:14px"></div>' +
        "</div><div id=\"toll-out\"></div>";

      var DB = null, mode = "name";
      $("#toll-load").innerHTML = '<span class="spinner"></span> loading plaza data…';
      TK.loadData("toll.js", "TOLL_DB", function (d) {
        DB = d;
        $("#toll-load").innerHTML = d
          ? '<span class="badge ok">' + TK.fmtNum(d.length) + " plazas loaded</span>"
          : '<span class="badge danger">failed to load</span>';
        controls();
      });

      $("#toll-mode").onclick = function (e) {
        var b = e.target.closest("button"); if (!b) return;
        TK.$$("#toll-mode button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        mode = b.dataset.m;
        controls();
        $("#toll-out").innerHTML = "";
      };

      function controls() {
        if (!DB) return;
        var c = $("#toll-controls");
        if (mode === "name") {
          c.innerHTML = '<div class="field"><label class="lbl">Plaza name, operator or contractor</label>' +
            '<input type="text" id="t-q" placeholder="e.g. Durg, or Ashoka Highways"></div>' +
            '<button class="btn primary" id="t-go">Search</button>';
          $("#t-q").addEventListener("input", search);
        } else if (mode === "radius") {
          c.innerHTML = '<p class="small muted">Give a point, a crime scene, a cell site, a recovered ' +
            "vehicle's last known position, and list every plaza around it.</p>" +
            '<div class="grid c3">' +
            '<div class="field"><label class="lbl">Latitude</label><input type="text" id="t-lat" class="mono" placeholder="21.1179"></div>' +
            '<div class="field"><label class="lbl">Longitude</label><input type="text" id="t-lon" class="mono" placeholder="81.1223"></div>' +
            '<div class="field"><label class="lbl">Radius (km)</label><input type="number" id="t-r" value="50" min="1" max="500"></div>' +
            "</div><button class=\"btn primary\" id=\"t-go\">Search</button>";
        } else {
          c.innerHTML = '<p class="small muted">Give an origin and a destination and list the plazas near ' +
            "the straight-line corridor between them. Use it to work out which plaza operators to serve " +
            "preservation notices on for a suspected route.</p>" +
            '<div class="grid c4">' +
            '<div class="field"><label class="lbl">From lat</label><input type="text" id="t-lat1" class="mono" placeholder="28.6139"></div>' +
            '<div class="field"><label class="lbl">From lon</label><input type="text" id="t-lon1" class="mono" placeholder="77.2090"></div>' +
            '<div class="field"><label class="lbl">To lat</label><input type="text" id="t-lat2" class="mono" placeholder="26.9124"></div>' +
            '<div class="field"><label class="lbl">To lon</label><input type="text" id="t-lon2" class="mono" placeholder="75.7873"></div>' +
            "</div>" +
            '<div class="field" style="max-width:220px"><label class="lbl">Corridor width (km either side)</label>' +
            '<input type="number" id="t-w" value="25" min="1" max="200"></div>' +
            '<button class="btn primary" id="t-go">Find plazas on route</button>';
        }
        var g = $("#t-go"); if (g) g.onclick = search;
      }

      /* Distance from a point to the great circle through a-b, and how far
         along that circle the point falls. The along-track figure must be
         the projection onto the route, not the straight-line distance from
         the origin: a plaza sitting well off to one side would otherwise be
         reported as further along the road than it actually is, and the
         corridor list would come out in the wrong order. */
      function trackGeom(pLat, pLon, aLat, aLon, bLat, bLon) {
        var R = 6371;
        var d13 = TK.haversine(aLat, aLon, pLat, pLon) / R;
        var t13 = TK.bearing(aLat, aLon, pLat, pLon) * Math.PI / 180;
        var t12 = TK.bearing(aLat, aLon, bLat, bLon) * Math.PI / 180;
        var dt = Math.atan2(Math.sin(t13 - t12), Math.cos(t13 - t12));  // signed
        var xt = Math.asin(Math.sin(d13) * Math.sin(dt));
        var at = Math.acos(Math.max(-1, Math.min(1, Math.cos(d13) / Math.cos(xt))));
        if (Math.abs(dt) > Math.PI / 2) at = -at;   // point lies behind the origin
        return { cross: Math.abs(xt) * R, along: at * R };
      }

      function search() {
        if (!DB) return;
        var res = [];

        if (mode === "name") {
          var q = ($("#t-q").value || "").trim().toLowerCase();
          if (!q) { $("#toll-out").innerHTML = ""; return; }
          res = DB.filter(function (t) {
            return t.n.toLowerCase().indexOf(q) !== -1 || (t.op || "").toLowerCase().indexOf(q) !== -1;
          }).map(function (t) { return { t: t, d: null }; });
        } else if (mode === "radius") {
          var la = parseFloat($("#t-lat").value), lo = parseFloat($("#t-lon").value), r = +$("#t-r").value || 50;
          if (isNaN(la) || isNaN(lo)) { TK.toast("Enter valid coordinates", "danger"); return; }
          res = DB.map(function (t) { return { t: t, d: TK.haversine(la, lo, t.y, t.x) }; })
            .filter(function (x) { return x.d <= r; })
            .sort(function (a, b) { return a.d - b.d; });
        } else {
          var a1 = parseFloat($("#t-lat1").value), o1 = parseFloat($("#t-lon1").value);
          var a2 = parseFloat($("#t-lat2").value), o2 = parseFloat($("#t-lon2").value);
          var w = +$("#t-w").value || 25;
          if ([a1, o1, a2, o2].some(isNaN)) { TK.toast("Enter all four coordinates", "danger"); return; }
          var routeLen = TK.haversine(a1, o1, a2, o2);
          res = DB.map(function (t) {
            var g = trackGeom(t.y, t.x, a1, o1, a2, o2);
            return { t: t, d: g.cross, along: g.along };
          }).filter(function (x) {
            // within the corridor, and between the two endpoints
            return x.d <= w && x.along >= -w && x.along <= routeLen + w;
          }).sort(function (a, b) { return a.along - b.along; });
        }

        var out = '<div class="grid c4" style="margin-bottom:16px">' +
          TK.stat(TK.fmtNum(res.length), "Plazas matched", res.length ? "accent" : "") +
          TK.stat(TK.fmtNum(DB.length), "Plazas in dataset") +
          TK.stat(new Set(res.map(function (x) { return x.t.op; })).size, "Distinct operators") +
          TK.stat(mode === "route" ? "corridor" : mode === "radius" ? "radius" : "text", "Search mode") +
        "</div>";

        if (!res.length) {
          out += TK.empty("No plazas matched.", "◎");
        } else {
          out += '<div class="card"><h3>Matches</h3><div id="toll-tbl"></div></div>';
          out += '<div class="card"><h3>Preservation notice, plaza operators</h3>' +
            '<p class="small muted">Lane CCTV is the first thing to disappear. Send this before anything else.</p>' +
            '<div class="copyable"><pre class="out doc">' + esc(
              "To: The Toll Plaza Manager / Concessionaire\n" +
              res.slice(0, 12).map(function (x) {
                return "    " + x.t.n + (x.t.op ? ", " + x.t.op : "") + (x.t.ct ? "  [" + x.t.ct + "]" : "");
              }).join("\n") + "\n\n" +
              "Subject: Preservation of records and CCTV footage, [FIR No. ____ / 20__]\n\n" +
              "You are required to PRESERVE, and not to overwrite, erase or destroy, the following for\n" +
              "the period [DD-MM-YYYY HH:MM] to [DD-MM-YYYY HH:MM]:\n\n" +
              "  1. All lane CCTV and ANPR footage and still images for every lane, both directions.\n" +
              "  2. Lane transaction logs including tag ID, vehicle class, lane number and timestamp.\n" +
              "  3. Vehicle registration numbers captured by the ANPR system.\n" +
              "  4. Details of vehicles that passed in cash or exempt lanes.\n\n" +
              "The material is required in connection with an investigation and a formal requisition\n" +
              "under section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023 follows. Confirm\n" +
              "preservation in writing to the undersigned within 24 hours.\n\n" +
              "Note: FASTag transaction data is separately being sought from NPCI / IHMCL and from the\n" +
              "issuing bank. This notice concerns the material held at the plaza itself."
            ) + '</pre><button class="btn sm copybtn" data-copy="prev">Copy</button></div></div>';
        }

        out += '<div class="note warn"><b>What this dataset is and is not</b><p>These are NHAI plaza ' +
          "locations and operator details from a public snapshot. <b>Rates are 2022-vintage and will be " +
          "wrong today.</b> Locations, operators and contacts are stable enough to act on; verify a rate " +
          "against the plaza before it goes in any document. Crossing records are not in here and cannot be.</p></div>";

        $("#toll-out").innerHTML = out;

        if (res.length) {
          TK.table($("#toll-tbl"), res.map(function (x) {
            return {
              n: x.t.n,
              d: x.d === null ? null : Math.round(x.d * 10) / 10,
              along: x.along ? Math.round(x.along) : null,
              op: x.t.op, ct: x.t.ct,
              y: x.t.y, x: x.t.x,
              car: x.t.r.car, ma: x.t.r.ma,
              traf: x.t.t
            };
          }), [
            { k: "n", label: "Plaza" },
            (mode === "radius" ? { k: "d", label: "Distance (km)", cls: "num" }
              : mode === "route" ? { k: "along", label: "km along route", cls: "num" }
              : { k: "op", label: "Operator" }),
            (mode === "route" ? { k: "d", label: "Off-route (km)", cls: "num" } : { k: "op", label: "Operator" }),
            { k: "ct", label: "Site contact", cls: "small" },
            { k: "y", label: "Lat", cls: "num mono", fmt: function (v) { return v.toFixed(5); } },
            { k: "x", label: "Lon", cls: "num mono", fmt: function (v) { return v.toFixed(5); } },
            { k: "car", label: "Car ₹", cls: "num" },
            { k: "traf", label: "Vehicles/day", cls: "num", fmt: function (v) { return v ? TK.fmtNum(v) : ""; } }
          ].filter(function (c, i, arr) {
            return arr.findIndex(function (z) { return z.k === c.k; }) === i;
          }), { filename: "toll-plazas", pageSize: 200 });
        }
      }
    }
  });

  /* ==========================================================
     Coordinate Toolkit
     ========================================================== */
  TK.reg({
    id: "geo",
    name: "Coordinate Toolkit",
    cluster: "movement",
    tier: 1,
    desc: "Convert coordinate formats, measure distance and bearing, and export a set of points as KML or GeoJSON.",
    lede: "Cell sites, toll plazas and scene coordinates all arrive in different formats. This " +
          "puts them in one format, measures between them, and makes a file anyone can open on a map.",
    badges: ["KML", "GeoJSON", "Offline"],
    legal: {
      authority: "Arithmetic, no authority needed.",
      caution: "A cell site coordinate is the location of the TOWER, not the handset. Sectors reach " +
               "several kilometres and the serving cell is not always the nearest one. Never plot a " +
               "tower and describe it as the suspect's position.",
      evidence: "When you export a plot for a case file, record where each coordinate came from. A map " +
                "with unattributed points is not evidence of anything."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="card"><h3>Distance and bearing</h3>' +
          '<div class="grid c2">' +
            '<div><label class="lbl">Point A</label><input type="text" id="g-a" class="mono" placeholder="21.1179, 81.1223  or  21°07\'04&quot;N 81°07\'20&quot;E"></div>' +
            '<div><label class="lbl">Point B</label><input type="text" id="g-b" class="mono" placeholder="28.6139, 77.2090"></div>' +
          "</div><div id=\"g-ab\" style=\"margin-top:14px\"></div></div>" +

        '<div class="card"><h3>Bulk points</h3>' +
          '<p class="small muted">One point per line: <code class="inl">label, lat, lon</code>, or paste a ' +
          "column of coordinates. Cell-site exports from the CDR Processor drop straight in.</p>" +
          '<div class="field"><textarea id="g-bulk" class="mono" style="min-height:130px" placeholder="Tower A, 21.1179, 81.1223&#10;Tower B, 21.2011, 81.3390&#10;Scene, 21.1500, 81.2000"></textarea></div>' +
          '<div class="row"><button class="btn primary" id="g-go">Process</button>' +
          '</div>' +
          '<div id="g-out" style="margin-top:14px"></div></div>';

      // accepts "21.1179, 81.1223" / "21 07 04 N, 81 07 20 E" / "21°07'04\"N 81°07'20\"E"
      function parsePt(s) {
        if (!s) return null;
        s = s.trim();
        var dd = s.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
        if (dd) return { lat: +dd[1], lon: +dd[2] };

        var dms = s.match(/(\d+)[°\s:]+(\d+)['\s:]*(\d+(?:\.\d+)?)?["\s]*([NSns])[,;\s]+(\d+)[°\s:]+(\d+)['\s:]*(\d+(?:\.\d+)?)?["\s]*([EWew])/);
        if (dms) {
          var la = +dms[1] + +dms[2] / 60 + (+dms[3] || 0) / 3600;
          var lo = +dms[5] + +dms[6] / 60 + (+dms[7] || 0) / 3600;
          if (/[Ss]/.test(dms[4])) la = -la;
          if (/[Ww]/.test(dms[8])) lo = -lo;
          return { lat: la, lon: lo };
        }
        return null;
      }

      function toDMS(v, isLat) {
        var hemi = v < 0 ? (isLat ? "S" : "W") : (isLat ? "N" : "E");
        v = Math.abs(v);
        var d = Math.floor(v), mF = (v - d) * 60, mm = Math.floor(mF), ss = ((mF - mm) * 60).toFixed(2);
        return d + "°" + ("0" + mm).slice(-2) + "'" + ("0" + ss).slice(-5) + '"' + hemi;
      }

      function inIndia(p) { return p.lat > 6 && p.lat < 38 && p.lon > 67 && p.lon < 98; }

      function ab() {
        var A = parsePt($("#g-a").value), B = parsePt($("#g-b").value);
        var el = $("#g-ab");
        if (!A || !B) {
          el.innerHTML = ($("#g-a").value || $("#g-b").value)
            ? '<div class="note warn"><b>Could not parse both points</b><p>Use decimal degrees ' +
              "(<span class='mono'>21.1179, 81.1223</span>) or DMS " +
              "(<span class='mono'>21°07'04&quot;N 81°07'20&quot;E</span>).</p></div>" : "";
          return;
        }
        var d = TK.haversine(A.lat, A.lon, B.lat, B.lon);
        var brg = TK.bearing(A.lat, A.lon, B.lat, B.lon);
        el.innerHTML = '<div class="grid c4" style="margin-bottom:14px">' +
          TK.stat(d < 1 ? Math.round(d * 1000) + " m" : d.toFixed(2) + " km", "Distance", "accent") +
          TK.stat(brg.toFixed(1) + "°", "Bearing A→B") +
          TK.stat(TK.compass(brg), "Direction") +
          TK.stat(Math.round(d / 40 * 60) + " min", "Drive @40 km/h") +
        "</div>" +
        '<dl class="kv"><dt>A (decimal)</dt><dd>' + A.lat.toFixed(6) + ", " + A.lon.toFixed(6) + "</dd>" +
        "<dt>A (DMS)</dt><dd>" + toDMS(A.lat, 1) + " " + toDMS(A.lon, 0) + "</dd>" +
        "<dt>B (decimal)</dt><dd>" + B.lat.toFixed(6) + ", " + B.lon.toFixed(6) + "</dd>" +
        "<dt>B (DMS)</dt><dd>" + toDMS(B.lat, 1) + " " + toDMS(B.lon, 0) + "</dd></dl>" +
        (!inIndia(A) || !inIndia(B) ? '<div class="note warn" style="margin-top:12px"><b>A point falls ' +
          "outside India</b><p>Latitude and longitude reversed is the usual cause, check the column order " +
          "in the source file.</p></div>" : "");
      }
      $("#g-a").addEventListener("input", ab);
      $("#g-b").addEventListener("input", ab);

      $("#g-go").onclick = proc;

      function proc() {
        var lines = $("#g-bulk").value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
        var pts = [], bad = [];
        lines.forEach(function (l) {
          var parts = l.split(/\s*,\s*/);
          var label = "", coordStr = l;
          if (parts.length >= 3) { label = parts[0]; coordStr = parts.slice(1).join(", "); }
          else if (parts.length === 2 && isNaN(parseFloat(parts[0]))) { label = parts[0]; coordStr = parts[1]; }
          var p = parsePt(coordStr);
          if (p) pts.push({ label: label || ("P" + (pts.length + 1)), lat: p.lat, lon: p.lon });
          else bad.push(l);
        });

        if (!pts.length) {
          $("#g-out").innerHTML = '<div class="note danger"><b>No coordinates parsed</b></div>';
          return;
        }

        var cLat = pts.reduce(function (s, p) { return s + p.lat; }, 0) / pts.length;
        var cLon = pts.reduce(function (s, p) { return s + p.lon; }, 0) / pts.length;
        var spread = 0, pair = null;
        for (var i = 0; i < pts.length; i++) for (var j = i + 1; j < pts.length; j++) {
          var d = TK.haversine(pts[i].lat, pts[i].lon, pts[j].lat, pts[j].lon);
          if (d > spread) { spread = d; pair = [pts[i], pts[j]]; }
        }

        var rows = pts.map(function (p) {
          return {
            label: p.label, lat: p.lat, lon: p.lon,
            dms: toDMS(p.lat, 1) + " " + toDMS(p.lon, 0),
            fromCentre: Math.round(TK.haversine(cLat, cLon, p.lat, p.lon) * 100) / 100,
            osm: "https://www.openstreetmap.org/?mlat=" + p.lat + "&mlon=" + p.lon + "#map=15/" + p.lat + "/" + p.lon
          };
        });

        $("#g-out").innerHTML =
          (bad.length ? '<div class="note warn"><b>' + bad.length + " line(s) not parsed</b>" +
            "<p class='mono xs'>" + esc(bad.slice(0, 5).join(" ⏎ ")) + "</p></div>" : "") +
          '<div class="grid c4" style="margin-bottom:14px">' +
            TK.stat(pts.length, "Points") +
            TK.stat(cLat.toFixed(5), "Centroid lat") +
            TK.stat(cLon.toFixed(5), "Centroid lon") +
            TK.stat(spread.toFixed(2) + " km", "Max spread", spread > 50 ? "warn" : "accent") +
          "</div>" +
          (pair ? '<p class="small muted">Furthest apart: <b>' + esc(pair[0].label) + "</b> and <b>" +
            esc(pair[1].label) + "</b>, " + spread.toFixed(2) + " km.</p>" : "") +
          '<div id="g-tbl"></div>' +
          '<div class=\"row\" style=\"margin-top:12px\">' +
            '<button class="btn" id="g-kml">Export KML</button>' +
            '<button class="btn" id="g-geo">Export GeoJSON</button>' +
            '<button class="btn" id="g-osm">Open centroid in OpenStreetMap</button>' +
          "</div>";

        TK.table($("#g-tbl"), rows, [
          { k: "label", label: "Label" },
          { k: "lat", label: "Latitude", cls: "num mono", fmt: function (v) { return v.toFixed(6); } },
          { k: "lon", label: "Longitude", cls: "num mono", fmt: function (v) { return v.toFixed(6); } },
          { k: "dms", label: "DMS", cls: "mono" },
          { k: "fromCentre", label: "km from centroid", cls: "num" },
          { k: "osm", label: "Map", fmt: function (v) {
              return '<a href="' + esc(v) + '" target="_blank" rel="noopener" style="color:var(--accent)">open</a>'; } }
        ], { filename: "coordinates", pageSize: 200 });

        $("#g-kml").onclick = function () {
          TK.download("points.kml",
            '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n' +
            "<name>Investigator Toolkit export</name>\n" +
            pts.map(function (p) {
              return "  <Placemark><name>" + esc(p.label) + "</name>" +
                "<Point><coordinates>" + p.lon + "," + p.lat + ",0</coordinates></Point></Placemark>";
            }).join("\n") + "\n</Document></kml>", "application/vnd.google-earth.kml+xml");
        };
        $("#g-geo").onclick = function () {
          TK.download("points.geojson", JSON.stringify({
            type: "FeatureCollection",
            features: pts.map(function (p) {
              return { type: "Feature", properties: { name: p.label },
                geometry: { type: "Point", coordinates: [p.lon, p.lat] } };
            })
          }, null, 2), "application/geo+json");
        };
        $("#g-osm").onclick = function () {
          window.open("https://www.openstreetmap.org/#map=11/" + cLat.toFixed(5) + "/" + cLon.toFixed(5),
            "_blank", "noopener");
        };
      }
    }
  });
})();
