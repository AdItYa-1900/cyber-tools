# -*- coding: utf-8 -*-
"""Build data/ifsc.js, the offline IFSC branch directory.

Source: github.com/razorpay/ifsc (IFSC.csv), compiled from the RBI master
list. About 183,000 branches.

STORAGE
  `keys` is one sorted string of 11-character IFSC codes, binary-searched
  directly so nothing is parsed into a Map at load time. `vals` is an
  array in the same order, each entry holding that branch's fields joined
  by the ASCII unit separator. Bank, centre, district and state repeat
  heavily, so they live in dictionaries and are referenced by base-36
  index.

WHAT IS AND IS NOT BUNDLED
  Bank, branch, centre, district, state and MICR are bundled: that is
  everything needed to identify the branch and address a notice to it,
  and it fits in a few megabytes.

  Full postal addresses are NOT bundled. Carrying all 183,000 of them
  pushes the file past 29 MB, which is too much to load in a browser for
  a field that is only occasionally needed. The tool fetches the address
  live when there is a network, and says so when there is not.
"""
import csv, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
SRC = sys.argv[1] if len(sys.argv) > 1 else "IFSC.csv"
BANKS = sys.argv[2] if len(sys.argv) > 2 else "banks.json"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
UNIT = ""
B36 = "0123456789abcdefghijklmnopqrstuvwxyz"


def b36(n):
    if not n:
        return "0"
    s = ""
    while n:
        s = B36[n % 36] + s
        n //= 36
    return s


class Pool:
    """Intern repeated strings and hand back an index."""

    def __init__(self):
        self.items, self.idx = [], {}

    def get(self, v):
        v = re.sub(r"\s+", " ", (v or "").strip())
        if v not in self.idx:
            self.idx[v] = len(self.items)
            self.items.append(v)
        return self.idx[v]


bank_names = {}
try:
    with open(BANKS, encoding="utf-8") as f:
        bank_names = {k.upper(): v for k, v in json.load(f).items()}
    print(f"bank name table: {len(bank_names)} entries")
except OSError:
    print("banks.json not found, relying on the BANK column")

banks, places, states = Pool(), Pool(), Pool()
centres = districts = places
recs = {}

with open(SRC, encoding="utf-8", errors="replace") as f:
    for r in csv.DictReader(f):
        code = (r.get("IFSC") or "").strip().upper()
        if not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", code):
            continue
        bank = re.sub(r"\s+", " ", (r.get("BANK") or "").strip()) or bank_names.get(code[:4], "")
        recs[code] = (
            banks.get(bank),
            re.sub(r"\s+", " ", (r.get("BRANCH") or "").strip())[:52],
            centres.get(r.get("CENTRE") or r.get("CITY") or ""),
            districts.get(r.get("DISTRICT") or ""),
            states.get(r.get("STATE") or ""),
            (r.get("MICR") or "").strip()[:9],
        )

ordered = sorted(recs)
keys = "".join(ordered)
vals = []
for c in ordered:
    b, branch, ce, di, st, micr = recs[c]
    vals.append(UNIT.join([b36(b), branch, b36(ce), b36(di), b36(st), micr]))

print(f"branches : {len(recs):,}")
print(f"  banks {len(banks.items):,}   places {len(places.items):,}   states {len(states.items):,}")

os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, "ifsc.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("/* Offline IFSC branch directory, about 183,000 branches.\n"
            "   Source: github.com/razorpay/ifsc, compiled from the RBI master list.\n"
            "   Bank, branch, centre, district, state and MICR are bundled.\n"
            "   Full postal addresses are fetched live: carrying all of them here\n"
            "   would push this file past 29 MB. */\n")
    f.write("window.IFSC_DB = " + json.dumps({
        "n": len(ordered),
        "bank": banks.items,
        "place": places.items,
        "state": states.items,
        "keys": keys,
        "vals": vals
    }, ensure_ascii=False, separators=(",", ":")) + ";\n")

print(f"\nifsc.js  {os.path.getsize(path)/1048576:.2f} MB")
