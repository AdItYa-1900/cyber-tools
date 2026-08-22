# -*- coding: utf-8 -*-
"""Build data/tac.js, the TAC to make/model lookup for the IMEI tool.

Source: https://github.com/MoazEb/tac-database  (tac_full.csv)
Around 248,000 Type Allocation Codes with brand and model.

STORAGE
  A plain JSON object with a quarter of a million keys is slow to parse
  and large on disk. Instead:

    keys  one string of sorted 8-character TACs, no separators
    vals  one string of fixed-width base-36 device indexes
    dev   the unique (brand, model) pairs those indexes point at

  Lookup is a binary search straight over `keys`, so nothing has to be
  parsed into a Map at load time. That keeps the file smaller and makes
  the first lookup instant.

CAVEAT CARRIED INTO THE UI
  This is a community-maintained list, not the GSMA register. It is good
  for narrowing down a handset, and it is not authoritative. The tool
  says so, and still points at KYM/14422 for a citable answer.
"""
import csv, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
SRC = sys.argv[1] if len(sys.argv) > 1 else "tac_full.csv"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

B36 = "0123456789abcdefghijklmnopqrstuvwxyz"


def b36(n, width=4):
    s = ""
    while n:
        s = B36[n % 36] + s
        n //= 36
    return s.rjust(width, "0")


def clean_model(brand, specs):
    """First comma-segment is the marketing name; drop a repeated brand."""
    m = (specs or "").split(",")[0].strip()
    m = re.sub(r"\s+", " ", m)
    if brand and m.upper().startswith(brand.upper()):
        m = m[len(brand):].strip(" -")
    return m[:48]


rows = {}
with open(SRC, encoding="utf-8", errors="replace") as f:
    for r in csv.DictReader(f):
        tac = (r.get("TAC") or "").strip()
        if not tac.isdigit() or len(tac) != 8:
            continue
        brand = re.sub(r"\s+", " ", (r.get("Brand") or "").strip())[:28]
        model = clean_model(brand, r.get("SPECS") or "")
        if not brand and not model:
            continue
        rows.setdefault(tac, (brand, model))

print(f"unique TACs: {len(rows):,}")

# unique (brand, model) pairs
brands, bidx = [], {}
devs, didx = [], {}
for tac, (brand, model) in rows.items():
    if brand not in bidx:
        bidx[brand] = len(brands)
        brands.append(brand)
    key = (bidx[brand], model)
    if key not in didx:
        didx[key] = len(devs)
        devs.append(key)

print(f"unique brands : {len(brands):,}")
print(f"unique devices: {len(devs):,}")
if len(devs) >= 36 ** 4:
    raise SystemExit("device count exceeds the 4-char base-36 index")

ordered = sorted(rows)
keys = "".join(ordered)
vals = "".join(b36(didx[(bidx[rows[t][0]], rows[t][1])]) for t in ordered)

# devices as "brandIdx|model", brandIdx in base36
dev_strings = [b36(b, 2) + "|" + m for b, m in devs]

os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, "tac.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("/* TAC to make/model, from the community tac-database project\n"
            "   (github.com/MoazEb/tac-database). Around 248,000 codes.\n"
            "   Community-maintained, NOT the GSMA register: good for narrowing\n"
            "   a handset down, not authoritative for a chargesheet. */\n")
    f.write("window.TAC_DB = " + json.dumps({
        "n": len(ordered),
        "b": brands,
        "d": dev_strings,
        "keys": keys,
        "vals": vals
    }, ensure_ascii=False, separators=(",", ":")) + ";\n")

size = os.path.getsize(path)
print(f"\ntac.js  {size/1048576:.2f} MB")
print(f"  keys {len(keys)/1048576:.2f} MB   vals {len(vals)/1048576:.2f} MB   "
      f"devices {sum(len(x) for x in dev_strings)/1048576:.2f} MB")
