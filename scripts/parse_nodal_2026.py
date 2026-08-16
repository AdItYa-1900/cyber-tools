"""Parse the 2026 nodal officer export (ic_api.nodals) into JSON.

The PDF renders several columns so narrowly that every character wraps
onto its own line, so extract_tables() returns "3\\n6\\n0\\nO\\nn\\ne.."
with the word spaces lost. Two repairs are needed:

  1. continuation rows, a row whose "#" and "id" are blank is the tail
     of the previous row's wrapped text and must be appended to it.
  2. word boundaries, after joining, "360OneMutualFund" is re-split on
     case transitions. Wide columns (email, mobile, designation,
     category) are unaffected and are taken verbatim.

Wide columns are authoritative. Re-split names are best-effort: an
organisation rendered in full capitals cannot be re-split and is left
as it is rather than guessed at.
"""
import json, re, sys, time, os

PDF = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\kumar\Downloads\nodals_2026-08-16.pdf"
OUT = sys.argv[2] if len(sys.argv) > 2 else "nodal2026_rows.json"

COLS = ["num", "id", "category", "organization", "nodal_name", "designation",
        "email_1", "email_2", "email_3", "mobile_1", "mobile_2", "phone",
        "address", "state", "website"]

# columns rendered one-character-per-line and needing re-splitting
NARROW = {"organization", "nodal_name", "phone", "address"}


def dechar(s):
    """Join the per-character line wrapping."""
    return re.sub(r'\s*\n\s*', '', s or '')


def resplit(s):
    """Restore word boundaries lost to the wrapping."""
    if not s:
        return ""
    s = re.sub(r'(?<=[a-z0-9])(?=[A-Z])', ' ', s)          # ..ualFund -> ual Fund
    s = re.sub(r'(?<=[A-Z])(?=[A-Z][a-z])', ' ', s)        # A.PMahajan -> A.P Mahajan
    s = re.sub(r'(?<=[.,])(?=[A-Za-z])', ' ', s)           # Mr.Sunil   -> Mr. Sunil
    s = re.sub(r'(?<=[a-zA-Z])(?=\d)', ' ', s)             # Road12     -> Road 12
    s = re.sub(r'\s*&\s*', ' & ', s)
    s = re.sub(r'\s{2,}', ' ', s)
    return s.strip()


def clean_wide(s):
    return re.sub(r'\s+', ' ', (s or '').replace('\n', ' ')).strip()


def main():
    import pdfplumber
    rows, cur = [], None
    t0 = time.time()

    with pdfplumber.open(PDF) as pdf:
        total = len(pdf.pages)
        for pi, page in enumerate(pdf.pages):
            for tbl in page.extract_tables():
                for raw in tbl:
                    cells = list(raw) + [""] * (len(COLS) - len(raw))
                    num = dechar(cells[0]).strip()
                    idv = dechar(cells[1]).strip()

                    # header row repeats on every page
                    if num == "#" or idv == "id":
                        continue

                    if num and re.match(r'^\d+$', num):
                        if cur:
                            rows.append(cur)
                        cur = {}
                        for ci, name in enumerate(COLS):
                            v = cells[ci] if ci < len(cells) else ""
                            cur[name] = dechar(v) if name in NARROW else clean_wide(v)
                    elif cur:
                        # continuation: append wrapped tails
                        for ci, name in enumerate(COLS):
                            v = cells[ci] if ci < len(cells) else ""
                            if not v:
                                continue
                            if name in NARROW:
                                cur[name] += dechar(v)
                            else:
                                extra = clean_wide(v)
                                if extra and extra not in cur.get(name, ""):
                                    cur[name] = (cur.get(name, "") + " " + extra).strip()

            if pi % 500 == 0:
                el = time.time() - t0
                print("page %d/%d  rows=%d  %.0fs  eta %.0fs"
                      % (pi, total, len(rows), el,
                         (el / max(pi, 1)) * (total - pi)), flush=True)

    if cur:
        rows.append(cur)

    for r in rows:
        for k in NARROW:
            r[k] = resplit(r[k])

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False)

    print("DONE rows=%d  %.0fs -> %s" % (len(rows), time.time() - t0, OUT), flush=True)
    with_mob = sum(1 for r in rows if re.search(r'\d{7,}', r.get("mobile_1", "")))
    print("with mobile:", with_mob,
          " with email:", sum(1 for r in rows if "@" in r.get("email_1", "")),
          " with address:", sum(1 for r in rows if r.get("address")),
          " with state:", sum(1 for r in rows if r.get("state")), flush=True)


if __name__ == "__main__":
    main()
