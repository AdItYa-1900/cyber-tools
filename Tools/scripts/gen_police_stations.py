"""Build data/police.js, an India police station directory.

SOURCE
  OpenStreetMap, amenity=police, fetched via Overpass:
      node/way["amenity"="police"] inside the India admin_level=2 area.
  State and district are assigned locally by point-in-polygon against
  the Census-2011 district boundaries (datameet/maps), because OSM
  itself tags addr:district on only ~3% of these nodes.

COVERAGE. READ THIS
  India has on the order of 17,000 police stations. OSM has a few
  thousand. This directory is therefore INCOMPLETE and unevenly
  distributed: urban districts are well mapped, rural ones barely.
  It is a finding aid, not an authoritative register. The tool says
  so on screen and offers an import path for a state's official list.

  There is no single public, machine-readable, complete national
  police station register. If one is procured, import it, the
  importer accepts any CSV with name + coordinates.

VINTAGE
  District boundaries are Census 2011; several districts have since
  been split or renamed, so a station may carry its parent district.
"""
import json, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "data")
PS = sys.argv[1] if len(sys.argv) > 1 else "ps_geo.json"
DIST = sys.argv[2] if len(sys.argv) > 2 else "dists11.geojson"


# ----------------------------------------------------------- geometry
def rings_of(geom):
    """Yield exterior rings from Polygon / MultiPolygon."""
    t, c = geom["type"], geom["coordinates"]
    if t == "Polygon":
        yield c[0]
    elif t == "MultiPolygon":
        for poly in c:
            yield poly[0]


def bbox(ring):
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return min(xs), min(ys), max(xs), max(ys)


def in_ring(x, y, ring):
    """Ray casting."""
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y):
            xint = (xj - xi) * (y - yi) / (yj - yi + 1e-18) + xi
            if x < xint:
                inside = not inside
        j = i
    return inside


print("loading district boundaries…")
dj = json.load(open(DIST, encoding="utf-8"))
areas = []
for f in dj["features"]:
    p = f["properties"]
    for ring in rings_of(f["geometry"]):
        if len(ring) < 4:
            continue
        areas.append((bbox(ring), ring, p.get("DISTRICT", ""), p.get("ST_NM", "")))
print("  %d rings from %d districts" % (len(areas), len(dj["features"])))

# grid index so we are not testing 4000 points against 3000 rings
CELL = 1.0
grid = collections.defaultdict(list)
for a in areas:
    x0, y0, x1, y1 = a[0]
    for gx in range(int(x0 // CELL), int(x1 // CELL) + 1):
        for gy in range(int(y0 // CELL), int(y1 // CELL) + 1):
            grid[(gx, gy)].append(a)


def locate(lon, lat):
    for bb, ring, dist, st in grid.get((int(lon // CELL), int(lat // CELL)), ()):
        if bb[0] <= lon <= bb[2] and bb[1] <= lat <= bb[3] and in_ring(lon, lat, ring):
            return dist, st
    return "", ""


# ----------------------------------------------------------- stations
def clean(s):
    return re.sub(r'\s+', ' ', (s or "")).strip()


print("loading police stations…")
pj = json.load(open(PS, encoding="utf-8"))

seen = set()
out = []
for el in pj["elements"]:
    t = el.get("tags") or {}
    name = clean(t.get("name") or t.get("name:en") or t.get("official_name") or "")
    if not name:
        continue
    if "lat" in el:
        lat, lon = el["lat"], el["lon"]
    elif "center" in el:
        lat, lon = el["center"]["lat"], el["center"]["lon"]
    else:
        continue

    key = (name.lower(), round(lat, 4), round(lon, 4))
    if key in seen:
        continue
    seen.add(key)

    dist, st = locate(lon, lat)
    if not st:
        dist = clean(t.get("addr:district", ""))
        st = clean(t.get("addr:state", ""))

    addr = ", ".join(filter(None, [
        clean(t.get("addr:housenumber", "")), clean(t.get("addr:street", "")),
        clean(t.get("addr:city", "")), clean(t.get("addr:postcode", ""))
    ]))

    out.append({
        "n": name,
        "y": round(lat, 6), "x": round(lon, 6),
        "d": dist, "s": st,
        "a": addr,
        "p": clean(t.get("phone") or t.get("contact:phone") or ""),
        "o": clean(t.get("operator") or ""),
        "w": clean(t.get("website") or t.get("contact:website") or "")
    })

out.sort(key=lambda r: (r["s"], r["d"], r["n"]))

os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, "police.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("/* India police station directory.\n"
            "   Source: OpenStreetMap amenity=police (Overpass). State/district assigned\n"
            "   by point-in-polygon against Census-2011 district boundaries (datameet/maps).\n"
            "   INCOMPLETE: India has ~17,000 police stations; OSM maps a few thousand,\n"
            "   with far better coverage in cities than in rural districts. This is a\n"
            "   finding aid, NOT an authoritative register. Import your state's official\n"
            "   list to supplement it. */\n")
    f.write("window.POLICE_DB = " + json.dumps(out, ensure_ascii=False,
                                               separators=(",", ":")) + ";\n")

print("%-22s %7.1f KB  %d stations" % ("police.js", os.path.getsize(path) / 1024, len(out)))
print("  with state :", sum(1 for r in out if r["s"]))
print("  with distr :", sum(1 for r in out if r["d"]))
print("  with phone :", sum(1 for r in out if r["p"]))
print("  states     :", len({r["s"] for r in out if r["s"]}))
print("  districts  :", len({(r['s'], r['d']) for r in out if r["d"]}))
print("\ntop states:")
for k, v in collections.Counter(r["s"] for r in out if r["s"]).most_common(12):
    print("   %-28s %4d" % (k, v))
