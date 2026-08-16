"""Generate bundled reference-data JS files for the OSINT toolkit.

Sources:
  oui.csv  - IEEE MA-L/MA-M/MA-S public registry (standards-oui.ieee.org)
  toll.json - NHAI toll plaza snapshot 01-01-2022 (geohacker/toll-plazas-india)
"""
import csv, json, os, re, io

OUT = r"C:\Users\kumar\Desktop\Tools\data"
os.makedirs(OUT, exist_ok=True)


def write_js(fname, varname, obj, note):
    path = os.path.join(OUT, fname)
    body = json.dumps(obj, separators=(",", ":"), ensure_ascii=False)
    with open(path, "w", encoding="utf-8") as f:
        f.write("/* %s */\n" % note)
        f.write("window.%s = %s;\n" % (varname, body))
    print("%-22s %8.1f KB  %d entries" % (fname, os.path.getsize(path) / 1024,
                                          len(obj)))


# ---------------------------------------------------------------- OUI
def clean_org(s):
    s = re.sub(r"\s+", " ", s or "").strip().strip(",")
    return s or "Private"


oui = {}
with open("oui.csv", encoding="utf-8", errors="replace") as f:
    for row in csv.DictReader(f):
        asn = (row.get("Assignment") or "").strip().upper()
        if not asn:
            continue
        org = clean_org(row.get("Organization Name"))
        reg = (row.get("Registry") or "").strip()
        # MA-M is 7 hex, MA-S is 9 hex; keep as-is, lookup walks longest-first
        oui[asn] = org if reg == "MA-L" else org + "\u241f" + reg

write_js("oui.js", "OUI_DB", oui,
         "IEEE public OUI/MA-L/MA-M/MA-S registry. Source: standards-oui.ieee.org")


# ---------------------------------------------------------------- Toll
def num(v):
    try:
        f = float(str(v).replace(",", ""))
        return int(f) if f == int(f) else f
    except (TypeError, ValueError):
        return None


tolls = []
with open("toll.json", encoding="utf-8") as f:
    for r in json.load(f):
        lat, lon = num(r.get("lat")), num(r.get("lon"))
        if lat is None or lon is None:
            continue
        if not (6 < lat < 38 and 67 < lon < 98):   # drop junk coords
            continue
        rt = r.get("rates") or {}
        tolls.append({
            "n": re.sub(r"\s+", " ", (r.get("name") or "").strip()),
            "y": round(lat, 6),
            "x": round(lon, 6),
            "op": re.sub(r"\s+", " ", (r.get("contractor_name") or "").strip()),
            "ct": re.sub(r"\s+", " ", (r.get("contact_details") or "").strip()),
            "t": num(r.get("traffic_per_day")),
            "pt": (r.get("project_type") or "").strip(),
            "fd": (r.get("fee_effective_date") or "").strip(),
            "r": {k: num(v) for k, v in {
                "car": rt.get("car_single"), "lcv": rt.get("lcv_single"),
                "bus": rt.get("bus_multi"), "ma": rt.get("multiaxle_single"),
            }.items() if num(v) is not None},
        })

tolls.sort(key=lambda t: t["n"])
write_js("toll.js", "TOLL_DB", tolls,
         "NHAI toll plazas, snapshot 01-01-2022 (geohacker/toll-plazas-india). "
         "Locations/operators stable; RATES ARE 2022-VINTAGE. "
         "FASTag crossing logs are NOT here - those need legal process to NPCI/IHMCL.")
