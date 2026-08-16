# -*- coding: utf-8 -*-
"""Build data/oui.js, the offline IEEE hardware-address registry.

WHY THIS COVERS FIVE FILES, NOT ONE
  IEEE hands out address space in four sizes, published as separate CSVs:

    MA-L   oui.csv     24-bit prefix, 6 hex digits   ~39,900 assignments
    MA-M   mam.csv     28-bit prefix, 7 hex digits    ~6,500
    MA-S   oui36.csv   36-bit prefix, 9 hex digits    ~7,100
    IAB    iab.csv     36-bit prefix (retired scheme) ~4,500
    CID    cid.csv     company id, never in a real
                       burned-in unicast address        ~220

  A build that reads only oui.csv is not "the IEEE registry". Every
  address inside an MA-M, MA-S or IAB block shares one of a handful of
  OUIs that MA-L attributes to "IEEE Registration Authority", so those
  addresses resolve to the registrar instead of the actual company. That
  is a wrong vendor in a case file, which is worse than no vendor.

  Values are "Organisation<U+241F>REGISTRY" so the tool can say which
  block size matched, and the lookup tries 9, then 7, then 6 hex digits:
  longest prefix wins, so the specific holder beats the shared OUI.
"""
import csv, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")

SRC = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
UNIT = "␟"

FILES = [
    ("ieee_oui.csv", "MA-L", 6),
    ("ieee_mam.csv", "MA-M", 7),
    ("ieee_oui36.csv", "MA-S", 9),
    ("ieee_iab.csv", "IAB", 9),
    ("ieee_cid.csv", "CID", 6),
]

db = {}
counts = {}

for fname, reg, width in FILES:
    path = os.path.join(SRC, fname)
    n = 0
    try:
        f = open(path, encoding="utf-8", errors="replace")
    except OSError:
        print(f"  {reg}: {fname} missing, skipped")
        continue
    with f:
        for r in csv.DictReader(f):
            key = re.sub(r"[^0-9A-Fa-f]", "", r.get("Assignment") or "").upper()
            if len(key) != width:
                continue
            org = re.sub(r"\s+", " ", (r.get("Organization Name") or "").strip())
            if not org:
                continue
            # A shorter, more specific registry already claimed this exact
            # prefix; never let a later file overwrite it.
            if key in db:
                continue
            db[key] = org + UNIT + reg
            n += 1
    counts[reg] = n
    print(f"  {reg}: {n:,}")

print(f"\ntotal assignments: {len(db):,}")
private = sum(1 for v in db.values() if v.startswith("Private" + UNIT))
print(f"  withheld ('Private'): {private:,}")

os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, "oui.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("/* IEEE public hardware-address registry, all five assignment files:\n"
            "   MA-L (24-bit) + MA-M (28-bit) + MA-S (36-bit) + IAB + CID.\n"
            "   Source: standards-oui.ieee.org. Keys are hex prefixes of 6, 7\n"
            "   or 9 digits; look up longest-first so a specific MA-S holder\n"
            "   beats the shared OUI that MA-L credits to the registrar.\n"
            "   Values are \"Organisation<US>REGISTRY\". */\n")
    f.write("window.OUI_DB = " + json.dumps(db, ensure_ascii=False, separators=(",", ":")) + ";\n")

print(f"oui.js  {os.path.getsize(path)/1048576:.2f} MB")
