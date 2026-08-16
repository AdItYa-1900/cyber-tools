"""Build data/nodal.js from the officially published nodal officer lists.

SOURCES (both public, both fetched, nothing here is invented):
  1. Bank / wallet / merchant / crypto nodal officers
     "Nodal List 2024", published for LEA use, mirrored by Puducherry Police:
     https://police.py.gov.in/Nodal%20List%202024%20(1).pdf
  2. State/UT cyber-cell nodal + grievance officers
     https://cybercrime.gov.in/Webform/Crime_NodalGrivanceList.aspx

WHAT THE SOURCE DOES NOT CONTAIN
  - Phone numbers. The published PDF masks every mobile number as
    "**********". They are redacted at source, so this file has none.
  - Postal addresses. The list carries entity, officer, designation and
    e-mail only.
  Do not let anyone "fill these in" from memory. A notice sent to a
  fabricated address is worse than no notice.

VINTAGE
  The bank list is the 2024 edition. Officers move constantly. Treat
  every row as a starting point to be confirmed, not as current fact.
"""
import json, os, re, sys, html

SCRATCH = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(SCRATCH), "data")
PDF = sys.argv[1] if len(sys.argv) > 1 else "nodal2024.pdf"
HTML = sys.argv[2] if len(sys.argv) > 2 else "nodal_probe.html"

# ---------------------------------------------------------------- classify
CO_OP = r'co-?op|sahakari|sahkari|grameen|gramin|grama|nidhi|urban co|credit societ|mahila'
CRYPTO = r'wazirx|coindcx|coinswitch|zebpay|giottus|unocoin|bitbns|binance|crypto|blockchain|coinbase|flitpay|buyucoin|mudrex|pi42'
PAYMENT = (r'paytm|phonepe|google pay|amazon pay|mobikwik|freecharge|razorpay|payu|ccavenue|'
           r'billdesk|cashfree|instamojo|airtel payments|jio payments|worldline|pine labs|'
           r'bharat ?pe|cred$|ease ?buzz|atom|zaakpay|juspay|airpay|epaynow|mpurse|paulpay|'
           r'pay1|paysharp|rapipay|reliance payment|tata payments|ypay|qwikcilver|eroute|'
           r'spice money|dhani pay|fino payments|infibeam|open$|payswiff|mswipe|paynearby')
MERCHANT = (r'amazon india|flipkart|myntra|nykaa|snapdeal|shopclues|croma|housing\.com|'
            r'magicbricks|nobroker|khata book|midas')
INSURANCE = r'insurance|life insurance corporation|allianz'
ISP = r'^airtel$|vodafone|^bsnl|^mtnl|jio infocomm|tata comm|act fibernet|hathway|excitel|railtel'


def classify(name):
    n = " " + name.lower().strip() + " "
    if re.search(CO_OP, n):      return "Co-operative / RRB"
    if re.search(CRYPTO, n):     return "Crypto exchange"
    if re.search(PAYMENT, n):    return "Payment / Wallet"
    if re.search(INSURANCE, n):  return "Insurance"
    if re.search(MERCHANT, n):   return "Merchant / Platform"
    if re.search(ISP, n):        return "ISP / Telecom"
    if re.search(r'\bbank\b|finserv|financ|small finance', n): return "Bank"
    return "Other intermediary"


def clean(s):
    s = re.sub(r'\s+', ' ', (s or "")).strip()
    return s.strip(" .,-")


# ---------------------------------------------------------------- 1. PDF
def parse_pdf(path):
    import pdfplumber
    out, seen = [], set()
    with pdfplumber.open(path) as pdf:
        for pg in pdf.pages:
            for tbl in pg.extract_tables():
                for r in tbl:
                    c = [clean((x or "").replace("\n", " ")) for x in r]
                    if len(c) < 6 or not re.match(r'^\d+$', c[0] or ""):
                        continue
                    entity, officer, desig, mobile, email = c[1], c[2], c[3], c[4], c[5]
                    email = re.sub(r'\s+', '', email).lower()
                    if "@" not in email:
                        continue
                    # the source masks every mobile; keep nothing rather than junk
                    phone = mobile if re.search(r'\d{6,}', mobile or "") else ""
                    key = (entity.lower(), email)
                    if key in seen:
                        continue
                    seen.add(key)
                    out.append({
                        "e": entity, "c": classify(entity), "o": officer,
                        "d": desig, "m": email, "p": phone,
                        "u": c[6] if len(c) > 6 else ""
                    })
    return out


# ---------------------------------------------------------------- 2. states
def deobfuscate(s):
    """cybercrime.gov.in writes e-mails as name[at]domain[dot]gov[dot]in"""
    s = re.sub(r'\s*\[\s*at\s*\]\s*', '@', s, flags=re.I)
    s = re.sub(r'\s*\[\s*dot\s*\]\s*', '.', s, flags=re.I)
    s = re.sub(r'\s*\[\s*hyphen\s*\]\s*', '-', s, flags=re.I)
    s = re.sub(r'\s*\[\s*underscore\s*\]\s*', '_', s, flags=re.I)
    return re.sub(r'\s+', '', s)


def parse_states(path):
    try:
        s = open(path, encoding="utf-8", errors="replace").read()
    except OSError:
        return []
    m = re.search(r'<table.*?</table>', s, re.S | re.I)
    if not m:
        return []
    out = []
    for tr in re.findall(r'<tr.*?</tr>', m.group(0), re.S | re.I):
        cells = [clean(html.unescape(re.sub(r'<[^>]+>', ' ', c)))
                 for c in re.findall(r'<t[dh].*?</t[dh]>', tr, re.S | re.I)]
        cells = [c for c in cells if c]
        if len(cells) < 4 or not re.match(r'^\d+$', cells[0]):
            continue
        state = cells[1]
        # layout: no, state, cyber name, rank, email, griev name, rank, contact, email
        def at(i):
            return cells[i] if len(cells) > i else ""
        rows = [("Nodal Cyber Cell Officer", at(2), at(3), deobfuscate(at(4)), "")]
        if len(cells) >= 8:
            rows.append(("Grievance Officer", at(5), at(6),
                         deobfuscate(at(8)) if len(cells) > 8 else "",
                         at(7) if re.search(r'\d{5,}', at(7)) else ""))
        for role, name, rank, email, phone in rows:
            if not name:
                continue
            out.append({
                "e": state, "c": "State / UT Police", "o": name,
                "d": (rank + ", " + role).strip(" -"),
                "m": email if "@" in email else "", "p": phone, "u": ""
            })
    return out


# ---------------------------------------------------------------- write
banks = parse_pdf(PDF)
states = parse_states(HTML)
allrows = states + banks

os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, "nodal.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("/* Nodal officer directory. Compiled from the official published lists.\n"
            "   Bank/wallet/crypto: 'Nodal List 2024' (LEA edition), mirrored by Puducherry Police.\n"
            "   State/UT: cybercrime.gov.in nodal & grievance officer page.\n"
            "   PHONE NUMBERS ARE MASKED AT SOURCE and are therefore absent.\n"
            "   POSTAL ADDRESSES ARE NOT PUBLISHED in either list.\n"
            "   The bank list is the 2024 edition - confirm before relying on any row. */\n")
    f.write("window.NODAL_DB = " + json.dumps({
        "updated": "Bank list: 2024 edition. State list: fetched 2026-08.",
        "sources": [
            "https://police.py.gov.in/Nodal%20List%202024%20(1).pdf",
            "https://cybercrime.gov.in/Webform/Crime_NodalGrivanceList.aspx"
        ],
        "rows": allrows
    }, ensure_ascii=False, separators=(",", ":")) + ";\n")

import collections
print("%-24s %6.1f KB" % ("nodal.js", os.path.getsize(path) / 1024))
print("total rows:", len(allrows), " entities:", len({r["e"] for r in allrows}))
for k, v in collections.Counter(r["c"] for r in allrows).most_common():
    print("   %-22s %4d officers  %3d entities" % (
        k, v, len({r["e"] for r in allrows if r["c"] == k})))
print("with email:", sum(1 for r in allrows if r["m"]),
      " with phone:", sum(1 for r in allrows if r["p"]))
