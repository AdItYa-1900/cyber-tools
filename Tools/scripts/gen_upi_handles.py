# -*- coding: utf-8 -*-
"""Rebuild the UPI handle table in data/reference.js.

WHY THIS IS HAND-ASSEMBLED AND NOT SCRAPED
  NPCI publishes the list of live UPI members and third-party apps, but
  not as a machine-readable file, and its site blocks automated fetches.
  There is no open dataset mapping handle to PSP bank. So the table is
  built from sources that are individually checkable:

    - PayU's published handle list, which their docs serve as JSON
    - the SEBI/exchange "approved UPI handles for ASBA" lists, which
      brokers republish because IPO applications depend on them
    - handles already in this file, carried over

  Every entry names a PSP bank that is a real UPI member. Nothing is
  guessed from the look of a handle: a handle whose PSP could not be
  established from a source is left out, because naming the wrong bank
  sends the notice to the wrong place and wastes the only window there
  is to freeze an account.

  `app` is the consumer-facing application. Several apps share one PSP,
  and several handles map to one app, so neither field is unique.
"""
import pathlib, re, sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parent.parent

# handle -> (PSP bank, app)
H = {
    # --- PhonePe
    "ybl": ("Yes Bank", "PhonePe"), "ibl": ("ICICI Bank", "PhonePe"),
    "axl": ("Axis Bank", "PhonePe"),
    # --- Google Pay
    "okhdfcbank": ("HDFC Bank", "Google Pay"), "okaxis": ("Axis Bank", "Google Pay"),
    "oksbi": ("State Bank of India", "Google Pay"), "okicici": ("ICICI Bank", "Google Pay"),
    # --- Paytm
    "paytm": ("Paytm Payments Bank", "Paytm"), "ptaxis": ("Axis Bank", "Paytm"),
    "ptsbi": ("State Bank of India", "Paytm"), "ptyes": ("Yes Bank", "Paytm"),
    "pthdfc": ("HDFC Bank", "Paytm"),
    # --- Amazon Pay
    "apl": ("Axis Bank", "Amazon Pay"), "yapl": ("Yes Bank", "Amazon Pay"),
    "rapl": ("RBL Bank", "Amazon Pay"),
    # --- other large third-party apps
    "upi": ("NPCI", "BHIM"),
    "axisb": ("Axis Bank", "CRED"), "yescred": ("Yes Bank", "CRED"),
    "yescurie": ("Yes Bank", "CRED"),
    "sliceaxis": ("Axis Bank", "slice"), "slicepay": ("Axis Bank", "slice"),
    "slc": ("Axis Bank", "slice"),
    "fam": ("Federal Bank", "FamPay"), "yesfam": ("Yes Bank", "FamPay"),
    "jupiteraxis": ("Axis Bank", "Jupiter"),
    "naviaxis": ("Axis Bank", "Navi"),
    "fifederal": ("Federal Bank", "Fi Money"),
    "superyes": ("Yes Bank", "SuperMoney"),
    "goaxb": ("Axis Bank", "Kiwi"),
    "kbaxis": ("Axis Bank", "KreditBee"),
    "kphdfc": ("HDFC Bank", "Kredit.Pe"),
    "mvhdfc": ("HDFC Bank", "Money View"),
    "inhdfc": ("HDFC Bank", "INDmoney"),
    "seyes": ("Yes Bank", "SalarySe"),
    "yespop": ("Yes Bank", "POPClub"),
    "yestp": ("Yes Bank", "TwidPay"),
    "yespay": ("Yes Bank", "YesPay Next"),
    "oneyes": ("Yes Bank", "OneCard"),
    "yesg": ("Yes Bank", "Groww"),
    "axb": ("Axis Bank", "OkCredit"),
    "gwaxis": ("Axis Bank", "Genwise"),
    "axisgo": ("Axis Bank", "Ola Money"),
    "pingpay": ("Axis Bank", "Samsung Pay"),
    "fkaxis": ("Axis Bank", "Flipkart"),
    "freecharge": ("Axis Bank", "Freecharge"),
    "abfspay": ("Aditya Birla Finance", "Bajaj / ABFSPay"),
    "abcdicici": ("ICICI Bank", "Aditya Birla Capital Digital"),
    "zoicici": ("ICICI Bank", "Zomato"),
    "tapicici": ("ICICI Bank", "Tata Neu"),
    "freoicici": ("ICICI Bank", "Freo"),
    "niyoicici": ("ICICI Bank", "Niyo Global"),
    "myicici": ("ICICI Bank", "Mi Pay"),
    "pockets": ("ICICI Bank", "Pockets by ICICI"),
    "ikwik": ("HDFC Bank", "MobiKwik"),
    "rmhdfcbank": ("HDFC Bank", "FinShell Pay"),
    "shriramhdfcbank": ("HDFC Bank", "Shriram One"),
    "hdfcbankjd": ("HDFC Bank", "Justdial"),
    "pz": ("HDFC Bank", "PayZapp"),
    "jarunity": ("Unity Small Finance Bank", "Jar"),
    "bpunity": ("Unity Small Finance Bank", "BharatPe"),
    "rmrbl": ("RBL Bank", "Rio Money"),
    "trans": ("Transcorp", "Cheq"),
    "payu": ("PayU / Citrus", "PayU"),
    "paulpay": ("Yes Bank", "PaulPay"),
    "mboi": ("Bank of India", "BOI Omni Neo"),
    # --- WhatsApp Pay
    "waaxis": ("Axis Bank", "WhatsApp Pay"), "wahdfcbank": ("HDFC Bank", "WhatsApp Pay"),
    "waicici": ("ICICI Bank", "WhatsApp Pay"), "wasbi": ("State Bank of India", "WhatsApp Pay"),
    # --- bank-native handles
    "airtel": ("Airtel Payments Bank", "Airtel Thanks"),
    "aubank": ("AU Small Finance Bank", "AU 0101"),
    "axisbank": ("Axis Bank", "Axis Mobile / Axis Pay"),
    "bandhan": ("Bandhan Bank", "Bandhan UPI"),
    "barodampay": ("Bank of Baroda", "BOB World UPI"),
    "boi": ("Bank of India", "BHIM BOI"),
    "cboi": ("Central Bank of India", "Cent UPI"),
    "centralbank": ("Central Bank of India", "BHIM Cent UPI"),
    "cnrb": ("Canara Bank", "BHIM Canara / CANDI"),
    "csbpay": ("CSB Bank", "CSB Pay"),
    "dbs": ("DBS Bank India", "digibank by DBS"),
    "dlb": ("Dhanlaxmi Bank", "BHIM DLB"),
    "equitas": ("Equitas Small Finance Bank", "Equitas UPI"),
    "fbl": ("Federal Bank", "Federal Bank / LOTZA"),
    "fincarebank": ("Fincare Small Finance Bank", "Fincare UPI"),
    "finobank": ("Fino Payments Bank", "Fino BPay"),
    "hdfcbank": ("HDFC Bank", "HDFC Bank / PayZapp"),
    "hsbc": ("HSBC India", "HSBC Simply Pay"),
    "icici": ("ICICI Bank", "iMobile Pay"),
    "idbi": ("IDBI Bank", "IDBI GO Mobile / PayWiz"),
    "idfcbank": ("IDFC First Bank", "IDFC First UPI"),
    "idfcbabk": ("IDFC First Bank", "IDFC First UPI"),
    "indianbank": ("Indian Bank", "IndOASIS"),
    "allbank": ("Indian Bank", "IndOASIS"),
    "indie": ("IndusInd Bank", "INDIE"),
    "indus": ("IndusInd Bank", "BHIM IndusPay"),
    "iob": ("Indian Overseas Bank", "IOB UPI"),
    "jio": ("Jio Payments Bank", "MyJio / JioMoney"),
    "jkb": ("Jammu & Kashmir Bank", "BHIM JKB e-Cash"),
    "kbl": ("Karnataka Bank", "BHIM KBL UPI"),
    "kotak": ("Kotak Mahindra Bank", "Kotak 811 / Kotak Mobile"),
    "kotak811": ("Kotak Mahindra Bank", "Kotak 811"),
    "kmbl": ("Kotak Mahindra Bank", "Kotak UPI"),
    "kvb": ("Karur Vysya Bank", "KVB Upay"),
    "mahb": ("Bank of Maharashtra", "MahaMobile Plus"),
    "pnb": ("Punjab National Bank", "PNB UPI"),
    "psb": ("Punjab & Sind Bank", "PSB UPI"),
    "rbl": ("RBL Bank", "RBL MoBank"),
    "sbi": ("State Bank of India", "BHIM SBI Pay / YONO"),
    "scb": ("Standard Chartered Bank", "SC Mobile"),
    "sib": ("South Indian Bank", "SIB Mirror+"),
    "timecosmos": ("Cosmos Bank", "TimePay"),
    "uboi": ("Union Bank of India", "Union Bank UPI"),
    "unionbank": ("Union Bank of India", "Union Bank UPI"),
    "unionbankofindia": ("Union Bank of India", "Union Bank Nxt"),
    "uco": ("UCO Bank", "BHIM UCO UPI"),
    "yes": ("Yes Bank", "Yes Bank IRIS"),
    "yesbank": ("Yes Bank", "BHIM YES PAY"),
}

lines = ["window.UPI_HANDLES = {"]
for k in sorted(H):
    psp, app = H[k]
    lines.append('  "%s": { psp: "%s", app: "%s" },' % (k, psp, app))
lines[-1] = lines[-1].rstrip(",")
lines.append("};")
block = "\n".join(lines)

p = ROOT / "data" / "reference.js"
s = p.read_text(encoding="utf-8")
i = s.find("window.UPI_HANDLES")
j = s.find("\n};", i) + 3
assert i > 0 and j > i, "UPI_HANDLES block not found"
old = len(re.findall(r'"[a-z0-9]+":\s*\{', s[i:j]))
p.write_text(s[:i] + block + s[j:], encoding="utf-8")

print(f"UPI handles: {old} -> {len(H)}")
psps = sorted(set(v[0] for v in H.values()))
print(f"PSP banks covered: {len(psps)}")
print(f"apps covered: {len(set(v[1] for v in H.values()))}")
