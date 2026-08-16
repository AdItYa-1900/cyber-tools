"""Generate the synthetic training corpus: data/samples.js

ONE CASE SPINE. Every file below belongs to the same fictional
investigation, so the tools stack into one narrative instead of
seven disconnected demos.

  Operation KHIDKI - a phishing-to-mule-network case.

  +91 90123 45678  "the handler"  - appears in BOTH suspect CDRs,
                                     never calls the complainant
  +91 98765 43210  mule A          - receives, disperses
  +91 87654 32109  mule B          - second receiver
  +91 76543 21098  the runner      - present at all three ATM scenes
  +91 99887 76655  complainant

Deliberate realism: preamble junk, mixed date formats, a footer
totals row, blank lines, inconsistent header casing, an IMEI used
briefly then abandoned. Trainees should have to cope with all of it.
"""
import json, os, random
from datetime import datetime, timedelta

random.seed(20260314)          # reproducible corpus
OUT = r"C:\Users\kumar\Desktop\Tools\data"

HANDLER = "9012345678"
MULE_A = "9876543210"
MULE_B = "8765432109"
RUNNER = "7654321098"
VICTIM = "9988776655"

IMEI_A_MAIN = "358240051111110"
IMEI_A_BURNER = "354827094411223"   # used only in the offence window
IMEI_B = "352099001761481"
IMEI_RUNNER = "356938035643809"

BASE = datetime(2026, 3, 14, 0, 0, 0)

CELLS = [
    ("404-45-1149-21", "BLR_Koramangala_S1", 12.9352, 77.6245),
    ("404-45-1149-22", "BLR_Koramangala_S2", 12.9352, 77.6245),
    ("404-45-2201-11", "BLR_Indiranagar_S1", 12.9716, 77.6412),
    ("404-45-3310-31", "BLR_Whitefield_S3", 12.9698, 77.7500),
    ("404-45-4402-12", "BLR_Majestic_S1", 12.9767, 77.5713),
    ("404-45-5518-11", "BLR_Electronic_City", 12.8452, 77.6602),
]


def q(v):
    """RFC 4180 quoting. The intended messiness in this corpus is preamble
    junk, footer totals and mixed date formats - NOT malformed CSV. A file
    that is broken at the quoting level teaches nothing useful."""
    v = str(v)
    return '"' + v.replace('"', '""') + '"' if any(c in v for c in ',"\n') else v


def row(cells):
    return ",".join(q(c) for c in cells)


def rnum():
    return random.choice("6789") + "".join(random.choice("0123456789") for _ in range(9))


def d1(dt):    # 14/03/2026 21:40:15
    return dt.strftime("%d/%m/%Y %H:%M:%S")


def d2(dt):    # 14-03-2026 21:40
    return dt.strftime("%d-%m-%Y %H:%M")


def d3(dt):    # 20260314214015
    return dt.strftime("%Y%m%d%H%M%S")


# =====================================================  CDR
def make_cdr(target, partners, imeis, n, imsi, start_offset=0):
    """partners: list of (number, weight, is_night_biased)"""
    rows = []
    t = BASE + timedelta(days=-20, hours=start_offset)
    pool = [p for p, w, _ in partners for _ in range(w)]
    for _ in range(n):
        t += timedelta(minutes=random.randint(4, 260))
        other = random.choice(pool)
        night = any(p == other and nb for p, _, nb in partners)
        if night and random.random() < 0.55:
            t = t.replace(hour=random.randint(0, 4), minute=random.randint(0, 59))
        # burner IMEI only inside the offence window
        if len(imeis) > 1 and BASE <= t <= BASE + timedelta(days=2):
            imei = imeis[1] if random.random() < 0.75 else imeis[0]
        else:
            imei = imeis[0]
        typ = random.choice(["OUT", "OUT", "IN", "IN", "SMS-OUT", "IN"])
        dur = 0 if "SMS" in typ else random.choice(
            [8, 14, 22, 35, 47, 62, 95, 128, 142, 210, 305])
        cell = random.choice(CELLS)
        rows.append([
            target, other, d1(t), str(dur), typ, imei, imsi,
            cell[0], cell[1], f"{cell[2]:.6f}", f"{cell[3]:.6f}",
        ])
    rows.sort(key=lambda r: datetime.strptime(r[2], "%d/%m/%Y %H:%M:%S"))
    return rows


CDR_HEAD = ["Calling Party", "Called Party", "Call Date Time", "Duration(Sec)",
            "Call Type", "IMEI", "IMSI", "Cell ID", "Site Name", "Latitude", "Longitude"]


def cdr_text(target, rows, lsa="Karnataka"):
    """Wrap rows in the junk a real operator export carries."""
    out = []
    out.append("CALL DETAIL RECORD - CONFIDENTIAL")
    out.append(f"Subscriber,+91{target}")
    out.append(f"LSA,{lsa}")
    out.append("Requisition Ref,NODAL/LEA/2026/04412 dated 21-03-2026")
    out.append("Generated On,02-04-2026 11:41:07")
    out.append("")
    out.append(",".join(CDR_HEAD))
    for r in rows:
        out.append(row(r))
    out.append("")
    out.append(f"Total Records,{len(rows)},,,,,,,,,")
    out.append("*** END OF REPORT - This is a computer generated statement ***")
    return "\n".join(out)


others_a = [rnum() for _ in range(22)]
others_b = [rnum() for _ in range(18)]
SHARED_1, SHARED_2 = rnum(), rnum()      # two more common contacts

cdr_a_rows = make_cdr(
    MULE_A,
    [(HANDLER, 9, True), (MULE_B, 3, False), (SHARED_1, 4, True), (SHARED_2, 2, False)]
    + [(o, 2, False) for o in others_a],
    [IMEI_A_MAIN, IMEI_A_BURNER], 420, "404450123456789")

cdr_b_rows = make_cdr(
    MULE_B,
    [(HANDLER, 8, True), (MULE_A, 3, False), (SHARED_1, 3, True), (SHARED_2, 3, False)]
    + [(o, 2, False) for o in others_b],
    [IMEI_B], 310, "404450987654321", start_offset=3)

CDR = cdr_text(MULE_A, cdr_a_rows)
CDR2 = cdr_text(MULE_B, cdr_b_rows)


# =====================================================  Tower dumps
def make_dump(cell, when, n_random, planted):
    rows = []
    for _ in range(n_random):
        t = when + timedelta(minutes=random.randint(-25, 25))
        rows.append([rnum(), "3" + "".join(random.choice("0123456789") for _ in range(14)),
                     d2(t), cell[0], cell[1]])
    for num, imei in planted:
        t = when + timedelta(minutes=random.randint(-9, 9))
        rows.append([num, imei, d2(t), cell[0], cell[1]])
    random.shuffle(rows)
    head = "MSISDN,IMEI,Date Time,Cell ID,Site Name"
    pre = (f"TOWER DUMP EXTRACT\nCell,{cell[0]}\nSite,{cell[1]}\n"
           f"Window,{d2(when - timedelta(minutes=30))} to {d2(when + timedelta(minutes=30))}\n\n")
    return pre + head + "\n" + "\n".join(row(r) for r in rows)


DUMP1 = make_dump(CELLS[0], BASE + timedelta(hours=20, minutes=25), 240,
                  [(RUNNER, IMEI_RUNNER), (MULE_A, IMEI_A_BURNER)])
DUMP2 = make_dump(CELLS[3], BASE + timedelta(days=1, hours=19), 265,
                  [(RUNNER, IMEI_RUNNER), (rnum(), "3" + "1" * 14)])
DUMP3 = make_dump(CELLS[5], BASE + timedelta(days=2, hours=21, minutes=10), 210,
                  [(RUNNER, IMEI_RUNNER)])


# =====================================================  IPDR
ipdr_rows = []
t = BASE + timedelta(hours=19, minutes=50)
DESTS = ["104.21.44.18", "172.67.191.203", "13.107.42.14", "142.250.192.14",
         "104.21.44.18", "185.199.108.153"]
for i in range(70):
    t += timedelta(minutes=random.randint(1, 45))
    up = random.randint(1200, 900000)
    dn = random.randint(4000, 6500000)
    port = random.randint(20000, 61000)
    ipdr_rows.append([
        MULE_A, IMEI_A_BURNER if i < 26 else IMEI_A_MAIN, "404450123456789",
        f"10.{random.randint(20, 90)}.{random.randint(1, 254)}.{random.randint(1, 254)}",
        "100.79.14.201" if i % 3 else "100.79.14.208",
        "" if i in (11, 23, 37, 51) else str(port),      # deliberate gaps
        random.choice(DESTS), random.choice(["443", "443", "443", "80", "8080"]),
        d3(t), d3(t + timedelta(minutes=random.randint(1, 25))),
        str(up), str(dn), CELLS[0][0], "jionet",
    ])

IPDR = ("IPDR EXTRACT - CONFIDENTIAL\nSubscriber,+91" + MULE_A +
        "\nTimestamps,UTC\nGenerated,05-04-2026\n\n" +
        "MSISDN,IMEI,IMSI,Private IP,Public IP,Source Port,Destination IP,Dest Port,"
        "Start Time,End Time,Uplink Bytes,Downlink Bytes,Cell ID,APN\n" +
        "\n".join(row(r) for r in ipdr_rows))


# =====================================================  CAF
ID_BULK = "TESTID9911X"          # one document behind many SIMs
POS_BULK = "POS-KA-88231"
NAMES = ["Ramesh Kumar", "S Devaraj", "Mohan Rao", "Anil Kumar", "Prakash N",
         "Suresh Babu", "Vijay Kumar", "Ganesh M", "Kiran Reddy", "Naveen S",
         "Ravi Shankar", "Manjunath B", "Girish Kumar", "Santosh Raj"]
ADDR_BULK = "No 14, 3rd Cross, Shivaji Nagar, Bengaluru 560051"

caf_rows = []
act = BASE - timedelta(days=41)
for i, nm in enumerate(NAMES):
    bulk = i < 8                       # first eight are the racket
    num = {0: MULE_A, 1: MULE_B, 2: RUNNER, 3: HANDLER}.get(i, rnum())
    a = act + (timedelta(minutes=17 * i) if bulk else timedelta(days=random.randint(-300, -40)))
    caf_rows.append([
        num, nm, "Aadhaar" if bulk else random.choice(["Voter ID", "Driving Licence", "Passport"]),
        ID_BULK if bulk else "DOC" + str(random.randint(100000, 999999)),
        ADDR_BULK if bulk else f"No {random.randint(1,90)}, {random.choice(['MG Road','Jayanagar','HSR Layout','BTM Layout'])}, Bengaluru",
        d2(a), POS_BULK if bulk else "POS-KA-" + str(random.randint(10000, 99999)),
        "Active" if i % 5 else "Disconnected",
        rnum(),
    ])

CAF = ("CUSTOMER ACQUISITION FORM EXTRACT\nOperator,Airtel Karnataka\n"
       "Ref,NODAL/LEA/2026/04412\n\n"
       "MSISDN,Subscriber Name,ID Type,ID Number,Address,Date of Activation,POS Code,Status,Alternate Number\n" +
       "\n".join(row(r) for r in caf_rows))


# =====================================================  Bank statement (mule A)
bank = []
bal = 1840.00
t = BASE - timedelta(days=6)
BENES = ["mule2@ybl", "kirann@okaxis", "rs.traders@paytm", "vjay88@ibl", "gk.enterprise@okhdfcbank"]


def push(dt, narr, dr, cr, ref):
    global bal
    bal = bal - dr + cr
    bank.append([dt.strftime("%d-%m-%Y %H:%M:%S"), narr, ref,
                 f"{dr:.2f}" if dr else "", f"{cr:.2f}" if cr else "", f"{bal:.2f}"])


for _ in range(5):     # ordinary background traffic
    t += timedelta(hours=random.randint(6, 30))
    amt = random.choice([250, 480, 1200, 90])
    push(t, f"UPI/{random.choice(['swiggy','bmtc','recharge'])}@ybl/PAYMENT", amt, 0,
         "UTR" + str(random.randint(10 ** 11, 10 ** 12)))
    t += timedelta(hours=random.randint(2, 20))
    push(t, "UPI/salary.acct@oksbi/CREDIT", 0, random.choice([4000, 6500]),
         "UTR" + str(random.randint(10 ** 11, 10 ** 12)))

# the offence: three layering bursts
for burst, amount in enumerate([250000, 180000, 95000]):
    t = BASE + timedelta(hours=20, minutes=21 + burst * 47)
    push(t, f"IMPS/{VICTIM}/INWARD FROM COMPLAINANT AC XX4471", 0, amount,
         "UTR" + str(random.randint(10 ** 11, 10 ** 12)))
    remaining = amount
    outs = random.sample(BENES, 4)
    for k, b in enumerate(outs):
        t += timedelta(minutes=random.randint(2, 11))
        share = round(amount * random.uniform(0.19, 0.26) / 1000) * 1000
        share = min(share, remaining - 500)
        remaining -= share
        push(t, f"UPI/{b}/TRANSFER", share, 0, "UTR" + str(random.randint(10 ** 11, 10 ** 12)))
    t += timedelta(minutes=random.randint(3, 14))
    push(t, "ATM/CASH WDL/BLR KORAMANGALA S1", round(remaining / 500) * 500 - 500, 0,
         "ATM" + str(random.randint(10 ** 8, 10 ** 9)))

BANK = ("STATEMENT OF ACCOUNT\nAccount Number,XXXXXXXX5566\nAccount Name,RAMESH KUMAR\n"
        "IFSC,SBIN0004521\nPeriod,08-03-2026 to 18-03-2026\n\n"
        "Txn Date,Narration,Ref/UTR,Debit,Credit,Balance\n" +
        "\n".join(row(r) for r in bank) +
        "\n\nOpening Balance,1840.00\nClosing Balance," + f"{bal:.2f}" +
        "\n*** This is a system generated statement ***")


# =====================================================  Nodal officers (synthetic)
# ==========================================  Cell site master data
# What an investigator actually gets: the site list the operator supplies
# ALONGSIDE the CDR, under the same s.94 requisition. It is authoritative
# because the operator owns it - unlike crowdsourced tower databases.
# Three sectors per site at 0/120/240 degrees, which is the normal macro
# configuration and the reason one location yields three cell IDs.

BLR_AREAS = [
    ("Koramangala",   12.9352, 77.6245, "8th Block, Koramangala"),
    ("Indiranagar",   12.9716, 77.6412, "100 Feet Road, Indiranagar"),
    ("Whitefield",    12.9698, 77.7500, "ITPL Main Road, Whitefield"),
    ("Majestic",      12.9767, 77.5713, "Gubbi Thotadappa Road, Majestic"),
    ("ElectronicCity", 12.8452, 77.6602, "Phase 1, Electronic City"),
    ("Jayanagar",     12.9250, 77.5938, "4th Block, Jayanagar"),
    ("HSR Layout",    12.9121, 77.6446, "27th Main, HSR Layout"),
    ("Marathahalli",  12.9591, 77.6974, "Outer Ring Road, Marathahalli"),
    ("Hebbal",        13.0358, 77.5970, "Bellary Road, Hebbal"),
    ("Yelahanka",     13.1007, 77.5963, "New Town, Yelahanka"),
    ("Banashankari",  12.9250, 77.5460, "2nd Stage, Banashankari"),
    ("Rajajinagar",   12.9915, 77.5551, "Dr Rajkumar Road, Rajajinagar"),
]

OPS = [("Airtel", "404", "45"), ("Jio", "405", "857"),
       ("Vi", "404", "86"), ("BSNL", "404", "64")]

cells = []
lac_seed = 1100
for ai, (area, la, lo, addr) in enumerate(BLR_AREAS):
    for oi, (opname, mcc, mnc) in enumerate(OPS):
        # each operator puts its own site a little way from the others
        jlat = la + random.uniform(-0.010, 0.010)
        jlon = lo + random.uniform(-0.010, 0.010)
        lac = lac_seed + ai * 7 + oi
        tech = random.choice(["4G", "4G", "4G", "5G", "2G"])
        ttype = random.choice(["Macro", "Macro", "Macro", "Micro", "IBS"])
        for s in range(3):
            ci = 10 + ai * 30 + oi * 7 + s
            cells.append([
                f"{mcc}-{mnc}-{lac}-{ci}", mcc, mnc, str(lac), str(ci),
                opname, tech, ttype,
                str([0, 120, 240][s]),
                f"{jlat:.6f}", f"{jlon:.6f}",
                f"BLR_{area.replace(' ', '')}_S{s+1}",
                addr, "Bengaluru", "Karnataka",
            ])

# the six sites that appear in the CDR corpus must resolve exactly,
# otherwise the tools will not chain together
for cgi, site, la, lo in CELLS:
    mcc, mnc, lac, ci = cgi.split("-")
    cells.append([cgi, mcc, mnc, lac, ci, "Airtel", "4G", "Macro",
                  str(random.choice([0, 120, 240])),
                  f"{la:.6f}", f"{lo:.6f}", site,
                  "Site address on record with the licensee",
                  "Bengaluru", "Karnataka"])

CELLSITE = (
    "CELL SITE MASTER DATA - CONFIDENTIAL\n"
    "Licensee,Airtel / Jio / Vi / BSNL (consolidated extract)\n"
    "LSA,Karnataka\n"
    "Requisition Ref,NODAL/LEA/2026/04412 dated 21-03-2026\n"
    "Generated On,02-04-2026\n\n"
    "CGI,MCC,MNC,LAC,CI,Operator,Technology,Site Type,Azimuth,"
    "Latitude,Longitude,Site Name,Address,City,Circle\n"
    + "\n".join(row(c) for c in cells))


# ==========================================  Arthagya multi-statement set
# Four accounts, four DIFFERENT bank layouts, linked by shared reference
# numbers. This is what makes BS2BS matching demonstrable: the same UTR /
# UPI transaction ID appears as a debit in one file and a credit in another.
# Amounts alone are never the join - several decoys share an amount but
# carry no common reference, and must NOT be matched.

ARTH = {}

# the shared references that stitch the accounts together
UTR_V_A = "IMPS512340098765"          # victim  -> mule A
UPI_A_B1 = "412345678901"             # mule A  -> beneficiary 1
UPI_A_B2 = "412345678902"             # mule A  -> beneficiary 2
UPI_A_B1b = "412345678903"            # mule A  -> beneficiary 1 (second leg)
CHQ_A_B2 = "445566"                   # mule A  -> beneficiary 2 by cheque
NEFT_B1_B2 = "SBIN26073412998801"     # bene 1  -> bene 2 (onward layer)


def ddmmyyyy(dt): return dt.strftime("%d-%m-%Y")
def ddmmyy(dt):   return dt.strftime("%d/%m/%y")
def dmonyy(dt):   return dt.strftime("%d-%b-%y")


T0 = BASE + timedelta(hours=20, minutes=21)

# ---- 1. Complainant's account (SBI-style layout) ------------------------
v = []
vb = 486300.00
def vpush(dt, desc, ref, dr, cr):
    global vb
    vb = vb - dr + cr
    v.append([ddmmyyyy(dt), ddmmyyyy(dt), desc, ref,
              f"{dr:.2f}" if dr else "", f"{cr:.2f}" if cr else "", f"{vb:.2f}"])

vpush(T0 - timedelta(days=3), "SALARY CREDIT MAR 2026", "NEFTSAL0098", 0, 74000)
vpush(T0 - timedelta(days=1), "UPI-BESCOM-BILLPAY", "409988776655", 3120, 0)
vpush(T0, "IMPS/P2A/RAMESH KUMAR/HDFC", UTR_V_A, 250000, 0)
vpush(T0 + timedelta(minutes=94), "IMPS/P2A/RAMESH KUMAR/HDFC", "IMPS512340098992", 180000, 0)
vpush(T0 + timedelta(days=1), "ATM WDL BLR JAYANAGAR", "ATM7781234", 10000, 0)

ARTH["arth_victim"] = (
    "STATE BANK OF INDIA - STATEMENT OF ACCOUNT\n"
    "Account Number,XXXXXXXX4471\nAccount Name,SUNITA MENON\n"
    "IFSC,SBIN0001234\nBranch,BENGALURU JAYANAGAR\n"
    "Statement Period,11-03-2026 to 16-03-2026\n\n"
    "Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n"
    + "\n".join(row(r) for r in v))

# ---- 2. Mule A (HDFC-style layout, DD/MM/YY dates) ----------------------
a = []
ab = 1840.00
def apush(dt, narr, ref, dr, cr):
    global ab
    ab = ab - dr + cr
    a.append([ddmmyy(dt), narr, ref,
              f"{dr:.2f}" if dr else "", f"{cr:.2f}" if cr else "", f"{ab:.2f}"])

apush(T0, "IMPS-512340098765-SUNITA MENON-SBIN-XXXX4471", UTR_V_A, 0, 250000)
apush(T0 + timedelta(minutes=5), "UPI-MULE2@YBL-YESB0000001-PAYMENT", UPI_A_B1, 65000, 0)
apush(T0 + timedelta(minutes=9), "UPI-KIRANN@OKAXIS-UTIB0000123-PAYMENT", UPI_A_B2, 60000, 0)
apush(T0 + timedelta(minutes=14), "UPI-MULE2@YBL-YESB0000001-PAYMENT", UPI_A_B1b, 58000, 0)
apush(T0 + timedelta(minutes=22), "CHQ PAID-445566", CHQ_A_B2, 55000, 0)
# decoy: same amount as a real leg, but no shared reference anywhere
apush(T0 + timedelta(minutes=40), "UPI-GROCERY.STORE@PAYTM-PAYMENT", "419900112233", 60000, 0)
apush(T0 + timedelta(minutes=94), "IMPS-512340098992-SUNITA MENON-SBIN-XXXX4471", "IMPS512340098992", 0, 180000)
apush(T0 + timedelta(minutes=101), "ATM CASH WDL BLR KORAMANGALA", "ATM8890021", 49500, 0)

ARTH["arth_muleA"] = (
    "HDFC BANK LTD\nAccount No,XXXXXXXX5566\nName,RAMESH KUMAR\n"
    "IFSC,HDFC0000521\nPeriod,11/03/26 to 16/03/26\n\n"
    "Date,Narration,Chq/Ref Number,Withdrawal Amt.,Deposit Amt.,Closing Balance\n"
    + "\n".join(row(r) for r in a))

# ---- 3. Beneficiary 1 (ICICI-style, serial column, DD-Mon-YY) -----------
b1 = []
b1b = 12400.00
def b1push(i, dt, chq, rem, dr, cr):
    global b1b
    b1b = b1b - dr + cr
    b1.append([str(i), dmonyy(dt), dmonyy(dt), chq, rem,
               f"{dr:.2f}" if dr else "", f"{cr:.2f}" if cr else "", f"{b1b:.2f}"])

b1push(1, T0 + timedelta(minutes=5), "", f"UPI/{UPI_A_B1}/RAMESH KUMAR/HDFC0000521", 0, 65000)
b1push(2, T0 + timedelta(minutes=14), "", f"UPI/{UPI_A_B1b}/RAMESH KUMAR/HDFC0000521", 0, 58000)
b1push(3, T0 + timedelta(minutes=31), "", f"NEFT/{NEFT_B1_B2}/K NARAYAN/UTIB0000123", 95000, 0)
b1push(4, T0 + timedelta(minutes=55), "", "UPI/430011223344/AMAZON PAY/APL", 4200, 0)

ARTH["arth_bene1"] = (
    "ICICI BANK - ACCOUNT STATEMENT\nAccount Number,XXXXXXXX7781\n"
    "Customer Name,M SHAFIQ\nIFSC,ICIC0000998\nPeriod,11-Mar-26 to 16-Mar-26\n\n"
    "S No.,Value Date,Transaction Date,Cheque Number,Transaction Remarks,"
    "Withdrawal Amount (INR),Deposit Amount (INR),Balance (INR)\n"
    + "\n".join(row(r) for r in b1))

# ---- 4. Beneficiary 2 (Axis-style, DR/CR columns, SOL id) ---------------
b2 = []
b2b = 3300.00
def b2push(dt, chq, part, dr, cr):
    global b2b
    b2b = b2b - dr + cr
    b2.append([ddmmyyyy(dt), chq, part,
               f"{dr:.2f}" if dr else "", f"{cr:.2f}" if cr else "", f"{b2b:.2f}", "0451"])

b2push(T0 + timedelta(minutes=9), "", f"UPI/P2A/{UPI_A_B2}/RAMESH KUMAR", 0, 60000)
b2push(T0 + timedelta(minutes=22), CHQ_A_B2, "CHEQUE DEPOSIT CLG", 0, 55000)
b2push(T0 + timedelta(minutes=31), "", f"NEFT INW/{NEFT_B1_B2}/M SHAFIQ/ICIC0000998", 0, 95000)
# decoy credit: same 60,000 amount, unrelated reference
b2push(T0 + timedelta(minutes=70), "", "UPI/P2A/455512349999/SUPPLIER PAYMENT", 0, 60000)
b2push(T0 + timedelta(minutes=140), "", "ATM WDL BLR ELECTRONIC CITY", 99000, 0)

ARTH["arth_bene2"] = (
    "AXIS BANK\nAccount No,XXXXXXXX3390\nName,K NARAYAN\n"
    "IFSC,UTIB0000123\nPeriod,11-03-2026 to 16-03-2026\n\n"
    "Tran Date,CHQNO,PARTICULARS,DR,CR,BAL,SOL\n"
    + "\n".join(row(r) for r in b2))


NODAL = """NODAL OFFICER DIRECTORY (SYNTHETIC TRAINING SAMPLE - NOT REAL CONTACTS)
Source,Replace this file with the current list from cybercrime.gov.in

Entity,Category,Officer Name,Designation,Email,Phone,Address,Updated
Example Bank Ltd,Bank,[withheld],Nodal Officer (LEA),lea.nodal@example-bank.test,022-00000001,"Mumbai 400001",2026-01-15
Sample Payments Bank,Bank,[withheld],Vice President - Compliance,nodal@sample-pay.test,022-00000002,"Noida 201301",2026-01-15
Demo Telecom (Karnataka),TSP,[withheld],Nodal Officer,nodal.ka@demo-telecom.test,080-00000003,"Bengaluru 560001",2026-02-01
Demo Telecom (Maharashtra),TSP,[withheld],Nodal Officer,nodal.mh@demo-telecom.test,022-00000004,"Mumbai 400051",2026-02-01
Test Wallet Pvt Ltd,PPI,[withheld],Grievance Officer,grievance@test-wallet.test,0124-0000005,"Gurugram 122002",2026-01-20
Placeholder Social Ltd,Intermediary,[withheld],Nodal Contact - India,lea-india@placeholder-social.test,,"Delhi 110001",2026-02-10
Placeholder Messaging,Intermediary,[withheld],Grievance Officer,grievance@placeholder-msg.test,,"Delhi 110001",2026-02-10
Mock ISP Networks,ISP,[withheld],Nodal Officer,nodal@mock-isp.test,044-0000006,"Chennai 600002",2026-01-05
"""


# =====================================================  brief
BRIEF = """OPERATION KHIDKI - synthetic case brief (fictional)

On 14 March 2026 the complainant received an SMS from header BZ-SBIVERIFY
warning that the account would be blocked for incomplete KYC, with a link to
sbi-kyc-verify.xyz. Credentials were entered. Within nine minutes Rs 2,50,000
left the account by IMPS, followed by two further transfers.

The receiving account is held in the name of Ramesh Kumar. Its statement shows
each credit dispersed within minutes to four UPI handles, with the residue
withdrawn in cash at an ATM in Koramangala.

Two suspect numbers have been identified. Their CDRs share contacts that neither
of them is. Tower dumps were obtained for the three ATM locations used across
three consecutive evenings.

Every number, account, IMEI and identity document in this corpus is fabricated.
Numbers are drawn from ranges that will not collide with live subscribers, and
identity documents use an obviously synthetic format. Nothing here is real data
about any real person.
"""

SAMPLES = {
    "cdr": CDR, "cdr2": CDR2, "ipdr": IPDR, "caf": CAF, "bank": BANK,
    "cellsite": CELLSITE, "dump1": DUMP1, "dump2": DUMP2, "dump3": DUMP3, "nodal": NODAL, "brief": BRIEF,
}
SAMPLES.update(ARTH)

os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, "samples.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("/* Synthetic training corpus - Operation KHIDKI. Entirely fictional.\n"
            "   Generated by gen_samples.py; every identifier is fabricated. */\n")
    f.write("window.SAMPLES = " + json.dumps(SAMPLES, ensure_ascii=False) + ";\n")

print("samples.js  %.1f KB" % (os.path.getsize(path) / 1024))
for k, v in SAMPLES.items():
    print("  %-8s %6d chars  %4d lines" % (k, len(v), v.count("\n") + 1))

# also drop loose CSVs so trainees can practise the drag-and-drop path
sdir = os.path.join(OUT, "..", "samples")
os.makedirs(sdir, exist_ok=True)
for k, v in SAMPLES.items():
    ext = "txt" if k == "brief" else "csv"
    with open(os.path.join(sdir, f"khidki-{k}.{ext}"), "w", encoding="utf-8") as f:
        f.write(v)
print("loose sample files written to samples/")
