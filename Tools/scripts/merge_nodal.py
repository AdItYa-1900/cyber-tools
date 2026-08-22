"""Merge the 2026 nodal export with the state/UT police list into data/nodal.js

The 2026 export (10,114 rows) supersedes the 2024 PDF entirely: it is
current, it has UNMASKED mobile numbers, and it carries address, state
and website columns the older list never had. The 2024 list is dropped
rather than merged, so nobody reads a stale row believing it is current.

Three repairs are applied to the extracted text:

  1. Fragment rows, 175 rows carry no organisation at all. They are the
     tails of wrapped rows that the extractor mistook for new records.
     Dropping them yields exactly the 10,114 the PDF header states,
     which is the check that the repair is right.

  2. Category strings are wrapped mid-word by the narrow column
     ("Crypt o Exc hange"). Spaces are stripped and the value matched
     against the known category set.

  3. Organisation names rendered in ALL CAPS cannot be re-split on case
     transitions, so they arrive as THENANDEDMERCHANTCOOPERATIVEBANK.
     A greedy longest-match against a banking vocabulary restores the
     word breaks. Anything unmatched is left alone rather than guessed.
"""
import json, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "data")
ROWS_2026 = sys.argv[1] if len(sys.argv) > 1 else "nodal2026_rows.json"
STATE_HTML = sys.argv[2] if len(sys.argv) > 2 else "nodal_probe.html"

# ---------------------------------------------------------------- category
CATEGORIES = [
    "Crypto Exchange", "E-Commerce", "Broadband", "Intermediary", "Matrimonial",
    "Website", "DLA-NBFC", "DLA-BANK", "DLA-HFC", "Credit Card", "Wallet",
    "Bank", "ISP", "TSP", "OTT", "TPAP", "NBFC", "Merchant", "Insurance",
    "Gaming", "Other",
]
_CAT_KEY = {re.sub(r'[^a-z]', '', c.lower()): c for c in CATEGORIES}
# longest first so "dlanbfc" is tried before "bank"
_CAT_ORDER = sorted(_CAT_KEY, key=len, reverse=True)


def fix_category(raw):
    """The narrow column wraps mid-word, so a cell may hold a whole
    category, its head ("Crypt"), or only its tail ("band", "ediary")."""
    k = re.sub(r'[^a-z]', '', (raw or "").lower())
    if not k:
        return "Other"
    if k in _CAT_KEY:
        return _CAT_KEY[k]
    for key in _CAT_ORDER:
        if k.startswith(key) or key.startswith(k) or k.endswith(key) or key.endswith(k):
            return _CAT_KEY[key]
    for key in _CAT_ORDER:                     # last resort: substring either way
        if len(k) >= 3 and (k in key or key in k):
            return _CAT_KEY[key]
    return (raw or "Other").strip() or "Other"


# ---------------------------------------------------------------- all-caps names
VOCAB = """THE AND OF FOR CO OPERATIVE COOPERATIVE CO-OPERATIVE COOP CO-OP
BANK BANKS BANKING LIMITED LTD PVT PRIVATE PUBLIC COMPANY CORPORATION CORP
MERCHANT MERCHANTS URBAN NAGARI NAGRIK SAHAKARI SAHKARI GRAMIN GRAMEEN
CREDIT SOCIETY SOCIETIES PRIMARY CENTRAL DISTRICT STATE NATIONAL
FINANCE FINANCIAL SERVICES SERVICE SOLUTIONS TECHNOLOGIES TECHNOLOGY
PAYMENTS PAYMENT WALLET SMALL RURAL REGIONAL MAHILA MAHAJAN
INDIA INDIAN BHARAT NEW OLD SHRI SREE SRI SHREE JANATA JANTA
DEVELOPMENT INDUSTRIAL COMMERCIAL PEOPLES PEOPLE
NIDHI SOUHARDA PATTINA SAHAKAR VIKAS UDYOG SEVA
EXCHANGE CRYPTO NETWORK NETWORKS COMMUNICATION COMMUNICATIONS
BROADBAND CABLE FIBER FIBRE INTERNET DIGITAL ONLINE GLOBAL
""".split()
VOCAB = sorted(set(VOCAB), key=len, reverse=True)


def split_caps(name):
    """Restore word breaks in an ALL-CAPS run using a banking vocabulary."""
    def split_token(tok):
        if len(tok) < 8 or not tok.isupper():
            return tok
        out, i, n = [], 0, len(tok)
        while i < n:
            for w in VOCAB:
                if tok.startswith(w, i):
                    out.append(w)
                    i += len(w)
                    break
            else:
                # accumulate unmatched characters into one chunk
                if out and not out[-1].isupper() or not out:
                    out.append(tok[i])
                else:
                    out[-1] = out[-1]
                    out.append(tok[i])
                i += 1
        # glue single stray characters back onto their neighbour
        merged = []
        for part in out:
            if merged and len(part) == 1 and len(merged[-1]) == 1:
                merged[-1] += part
            else:
                merged.append(part)
        return " ".join(merged)

    parts = [split_token(t) for t in re.split(r'(\s+)', name)]
    return re.sub(r'\s{2,}', ' ', "".join(parts)).strip()


def titlecase_if_shouty(s):
    letters = re.sub(r'[^A-Za-z]', '', s)
    if len(letters) > 6 and letters.isupper():
        return " ".join(w.capitalize() if len(w) > 2 else w for w in s.split())
    return s


# ---------------------------------------------------------------- build
raw = json.load(open(ROWS_2026, encoding="utf-8"))
print("extracted rows:", len(raw))

rows, dropped = [], 0
for r in raw:
    org = (r.get("organization") or "").strip()
    if not org:
        dropped += 1
        continue

    org = split_caps(org)
    org = titlecase_if_shouty(org)
    name = titlecase_if_shouty(split_caps((r.get("nodal_name") or "").strip()))

    emails = [e.strip() for e in (r.get("email_1"), r.get("email_2"), r.get("email_3")) if e and "@" in e]
    mobiles = []
    for m in (r.get("mobile_1"), r.get("mobile_2"), r.get("phone")):
        for hit in re.findall(r'\d[\d\-\s]{6,}\d', m or ""):
            d = re.sub(r'\D', '', hit)
            if 6 <= len(d) <= 15:
                mobiles.append(d)

    rows.append({
        "e": org,
        "c": fix_category(r.get("category")),
        "o": name,
        "d": re.sub(r'\s+', ' ', (r.get("designation") or "")).strip(),
        "m": emails[0] if emails else "",
        "m2": "; ".join(emails[1:]),
        "p": "; ".join(dict.fromkeys(mobiles)),
        "a": re.sub(r'\s+', ' ', (r.get("address") or "")).strip(),
        "st": re.sub(r'\s+', ' ', (r.get("state") or "")).strip(),
        "w": re.sub(r'\s+', ' ', (r.get("website") or "")).strip(),
    })

print("dropped fragment rows:", dropped, "-> kept", len(rows))

# ---------------------------------------------------------------- state police
def deob(s):
    s = re.sub(r'\s*\[\s*at\s*\]\s*', '@', s, flags=re.I)
    s = re.sub(r'\s*\[\s*dot\s*\]\s*', '.', s, flags=re.I)
    s = re.sub(r'\s*\[\s*hyphen\s*\]\s*', '-', s, flags=re.I)
    s = re.sub(r'\s*\[\s*underscore\s*\]\s*', '_', s, flags=re.I)
    return re.sub(r'\s+', '', s)


state_rows = []
try:
    import html
    s = open(STATE_HTML, encoding="utf-8", errors="replace").read()
    tbl = re.search(r'<table.*?</table>', s, re.S | re.I)
    for tr in re.findall(r'<tr.*?</tr>', tbl.group(0), re.S | re.I) if tbl else []:
        c = [re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', x))).strip()
             for x in re.findall(r'<t[dh].*?</t[dh]>', tr, re.S | re.I)]
        c = [x for x in c if x]
        if len(c) < 5 or not re.match(r'^\d+$', c[0]):
            continue
        g = lambda i: c[i] if len(c) > i else ""
        state_rows.append({"e": g(1), "c": "State / UT Police", "o": g(2), "d": g(3),
                           "m": deob(g(4)) if "@" in deob(g(4)) else "", "m2": "",
                           "p": "", "a": "", "st": g(1), "w": ""})
        if len(c) >= 8:
            em = deob(g(8)) if len(c) > 8 else ""
            state_rows.append({"e": g(1), "c": "State / UT Police", "o": g(5),
                               "d": (g(6) + ". Grievance Officer").strip(" -"),
                               "m": em if "@" in em else "", "m2": "",
                               "p": g(7) if re.search(r'\d{5,}', g(7)) else "",
                               "a": "", "st": g(1), "w": ""})
except OSError:
    print("state list not found, skipping")

rows = state_rows + rows
print("with state police:", len(rows))

os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, "nodal.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("/* Nodal officer directory.\n"
            "   Primary source: nodals export generated 16-08-2026 (10,114 rows) -\n"
            "   supplied by the user, carries UNMASKED mobile numbers plus address,\n"
            "   state and website. Supersedes the 2024 published PDF entirely.\n"
            "   Plus: cybercrime.gov.in State/UT cyber-cell & grievance officers.\n"
            "   Officers move - confirm a contact before relying on it. */\n")
    f.write("window.NODAL_DB = " + json.dumps({
        "updated": "Nodal export 16-08-2026; State/UT list fetched 08-2026.",
        "rows": rows
    }, ensure_ascii=False, separators=(",", ":")) + ";\n")

print("\n%-18s %7.1f KB  %d rows" % ("nodal.js", os.path.getsize(path) / 1024, len(rows)))
print("entities:", len({r["e"].lower() for r in rows}))
print("with email :", sum(1 for r in rows if r["m"]))
print("with phone :", sum(1 for r in rows if r["p"]))
print("with address:", sum(1 for r in rows if r["a"]))
print("\ncategories:")
for k, v in collections.Counter(r["c"] for r in rows).most_common():
    print("   %-20s %5d officers  %5d entities" % (
        k, v, len({r["e"].lower() for r in rows if r["c"] == k})))
