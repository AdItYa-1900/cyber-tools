# Sutra

*An offline investigation bench.*

An offline bench of cyber-investigation tools, built around one principle:

> **Where things are and who to contact is usually public.
> Who did what and when is never public.**

Every tool states which side of that line it sits on, and what legal authority
the request needs.

## Running it

Open `index.html` in a browser. There is no build step, no install, no server
requirement, it is plain HTML, CSS and JavaScript.

Two tools (IFSC branch records, IP Intelligence RDAP) call a public API when
they can. Browsers block cross-origin requests from `file://` pages, so if you
want those working, serve the folder instead:

```bash
python -m http.server 8777
```

Everything else, parsing, hashing, analysis, is fully offline and works
either way. **Evidence files you load are read in the browser and never leave
the machine.**

## The three tiers

| Tier | Meaning |
|------|---------|
| **T1** | Works on real public data. Bundled or fetched from a published source. |
| **T2** | Parses an evidence file you already hold lawfully. Cannot fetch anything itself. |
| **T3** | Workflow simulator. No lawful automated route to the real data exists. |

Tier 3 is not a compromise. For CEIR tracing and similar channels, teaching the
request flow and how to read the output is the *correct* training outcome, you
do not want officers hitting live national systems from a lab.

## Tools

**Identity resolution**. Number Intelligence · TSP/LSA Directory ·
IMSI/PLMN Decoder · CAF Summariser · Verhoeff Checksum

**Device tracing**. IMEI Analyser · MAC/OUI Lookup · CEIR Request Builder

**Telecom analysis**. CDR Processor · Common Contact Finder · IPDR Analyser ·
SMS Header Intelligence · Tower Dump Analyser

**Money trail**. IFSC Lookup · UPI Handle Resolver · Transaction Trail Analyser

**Network side**. Hash Generator · IP Intelligence

**Physical movement**. Toll Plaza Directory · Coordinate Toolkit

**Case handling**. Legal Authority Matrix · Requisition Builder ·
Nodal Officer Directory · Case Timeline Builder

## Bundled data, and where it came from

| File | Source | Caveat |
|------|--------|--------|
| `data/oui.js` | IEEE MA-L/M/S registry, 37,135 assignments | Refresh from `standards-oui.ieee.org/oui/oui.csv` |
| `data/toll.js` | NHAI toll plazas, 688 with coordinates | **Snapshot of 01-01-2022.** Locations and operators are stable; **rates are stale.** |
| `data/telecom.js` | LSA list, PLMN codes, DLT grammar | Rows marked `v:0` are unverified, the UI labels them |
| `data/reference.js` | Legal matrix, IFSC bank codes, UPI handles, ports | Legal matrix needs local vetting (see below) |

### What is deliberately *not* bundled

Three datasets were left out on purpose, because a wrong row produces a wrong
attribution in a case file, which is worse than no attribution:

- **DoT numbering series → operator.** Number Intelligence does structural
  analysis and imports the published NNP list.
- **TAC → handset make/model.** The GSMA database is licensed. IMEI Analyser
  validates structure and imports a TAC list if your unit holds one.
- **Nodal officer contacts.** Officers move; a stale bundled copy sends notices
  to the wrong person. Import the current list from `cybercrime.gov.in`.

Each of those tools ships an import path and says so on its own page.

## Legal accuracy

`data/reference.js` carries a matrix of what each evidence type sits under, who
can authorise it, and how long the holder keeps it. It is drafted against the
BNSS / BSA / BNS regime that replaced the CrPC, Evidence Act and IPC from
1 July 2024, and the Telecommunications Act 2023.

**It is training material, not legal advice.** Provisions change, authorised
ranks differ between states, and standing orders vary. Have your prosecution
wing vet every row before it goes into a real notice. The Legal Authority Matrix
tool says this on screen too.

## Accuracy

Parsing bugs in this kind of tool are dangerous precisely because they are
silent: a wrong number still looks like a number. The following are verified
by test rather than by inspection.

**Verified against published vectors**

- MD5 and SHA-256 match the RFC 1321 / FIPS 180-4 test vectors. Evidence
  hashing is the one place a quiet error would be unrecoverable.
- Luhn accepts the published valid test IMEIs and rejects a single-digit
  mutation of each.
- Verhoeff round-trips: a generated check digit validates, and altering any
  one digit fails.
- Haversine gives 1739.8 km for Bengaluru to Delhi.

**Bugs found and fixed**

| Was | Effect |
|-----|--------|
| Duration read digit-wise | `00:01:42` counted as 142 s instead of 102 s, inflating every talk-time total |
| Date order assumed | `04/13/2026` from a US-configured export silently became January 2027 |
| Target = most frequent A-party | Wrong number chosen whenever incoming legs put the target in the B column |
| Direction anchored at string start | `SMS-OUT` matched neither direction; 71 of 420 events went uncounted |
| Data volume read digit-wise | `1.5 MB` treated as 1.5 bytes |
| MSISDN stripping ordered wrongly | `0091-9876543210` never normalised |
| Along-track distance = distance from origin | Route corridor listed plazas in the wrong order |

**Where the tools now refuse to guess**

- If a date column contains nothing above 12 in either position, DD/MM and
  MM/DD both fit. The tool says so, states that it assumed day-first, and
  tells you to check against a date you already know. If the column contains
  both orders it refuses to trust the timeline at all.
- The CDR target number is reported with the percentage of rows it appears
  in. Below 90% it is flagged as a guess.
- Money-trail edges need a strong reference: a 10-digit-plus numeric or a
  bank UTR. A short numeric like a six-digit cheque number is accepted only
  from a dedicated reference column, never from free narration, because
  dates and invoice numbers collide with it.
- A packed cell identity is labelled "LAC/CI split inferred" rather than
  presented as fact.

## The training corpus

`data/samples.js` and `samples/*.csv` are one fictional case, **Operation
KHIDKI**, a phishing-to-mule-network fraud. Every file belongs to the same
investigation, so the tools stack into one narrative:

- Two suspect CDRs that **share three contacts neither of them is**, find them
  with the Common Contact Finder
- A SIM used in **two handsets**, the second only during the offence window -
  the CDR Processor flags it
- Three tower dumps, 718 devices, **exactly one present at all three scenes**
- A CAF batch with **eight connections on one identity document**, one PoS, one
  address, activated in a single burst
- A bank statement with **three layering sequences**, money in, dispersed to
  four handles within minutes, residue withdrawn in cash
- IPDR with **four sessions missing the source port**, the gap that makes a
  CGNAT request come back nil

The files carry the mess real exports carry: preamble junk, footer totals,
blank lines, mixed date formats, quoted fields. Trainees have to cope with all
of it.

Every identifier is fabricated. Regenerate with `gen_samples.py` (seeded, so
the corpus is reproducible).

## Structure

```
index.html          shell
assets/app.css      design system (tokens, dark + light)
assets/core.js      router, evidence parser, table, exporters
data/               bundled reference data + training corpus
tools/*.js          one file per investigation cluster
samples/            the corpus as loose CSVs for drag-and-drop practice
```

Adding a tool means one `TK.reg({..})` call, id, cluster, tier, the legal
block, and a `render(root)`. It appears in the sidebar and on the home grid
automatically.
