/* ============================================================
   Document ID Checker

   An officer gets handed a string on a complaint form and has to
   decide what it is and whether it is even well-formed before
   anything else happens. This takes any Indian identifier and works
   that out, then decodes whatever the format itself encodes.

   What is genuinely decidable offline:

     GSTIN   full mod-36 checksum, and it carries the holder's PAN
             and state inside it
     CIN     carries the state, the year of incorporation and whether
             the company is listed
     PAN     structure plus the holder-type letter
     Card    Luhn check and the card network

   What is NOT decidable, and the tool says so rather than guessing:
   whether the number was ever issued, and who holds it. Nothing here
   contacts the Income Tax Department, GSTN, MCA, UIDAI or any bank.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  var B36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /* PAN 4th character: what kind of person or body holds it. */
  var PAN_HOLDER = {
    A: "Association of Persons (AOP)",
    B: "Body of Individuals (BOI)",
    C: "Company",
    F: "Firm or LLP",
    G: "Government",
    H: "Hindu Undivided Family",
    J: "Artificial Juridical Person",
    L: "Local Authority",
    P: "Individual",
    T: "Trust"
  };

  /* GST state codes. These are the census state codes, so the same
     table also decodes the first two digits of a CIN registration. */
  var GST_STATE = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
    "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
    "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
    "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "25": "Daman & Diu (old code)", "26": "Dadra & Nagar Haveli and Daman & Diu",
    "27": "Maharashtra", "28": "Andhra Pradesh (pre-2017 code)",
    "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
    "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands",
    "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
    "97": "Other Territory", "99": "Centre Jurisdiction"
  };

  /* CIN characters 9-10 are the ROC state, using two-letter codes that
     are close to but not identical with the vehicle-registration ones. */
  var CIN_STATE = {
    AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar",
    CH: "Chandigarh", CT: "Chhattisgarh", DL: "Delhi", GA: "Goa",
    GJ: "Gujarat", HR: "Haryana", HP: "Himachal Pradesh", JK: "Jammu & Kashmir",
    JH: "Jharkhand", KA: "Karnataka", KL: "Kerala", LD: "Lakshadweep",
    MP: "Madhya Pradesh", MH: "Maharashtra", MN: "Manipur", ML: "Meghalaya",
    MZ: "Mizoram", NL: "Nagaland", OR: "Odisha", PY: "Puducherry",
    PB: "Punjab", RJ: "Rajasthan", SK: "Sikkim", TN: "Tamil Nadu",
    TG: "Telangana", TR: "Tripura", UP: "Uttar Pradesh", UT: "Uttarakhand",
    UK: "Uttarakhand", WB: "West Bengal", AN: "Andaman & Nicobar Islands",
    DN: "Dadra & Nagar Haveli", DD: "Daman & Diu"
  };

  var CIN_OWNER = {
    PLC: "Public Limited Company",
    PTC: "Private Limited Company",
    OPC: "One Person Company",
    FLC: "Financial Lease Company as Public Limited",
    FTC: "Subsidiary of a Foreign Company as Private Limited",
    GAP: "General Association Public",
    GAT: "General Association Private",
    GOI: "Government of India company",
    NPL: "Not for Profit company (section 8)",
    SGC: "State Government company",
    ULL: "Unlimited Liability, Public",
    ULT: "Unlimited Liability, Private"
  };

  /* Card networks by IIN range. Prefix tests only, which is all that
     is decidable without a BIN dataset. */
  function cardNetwork(d) {
    var p2 = +d.slice(0, 2), p3 = +d.slice(0, 3), p4 = +d.slice(0, 4), p6 = +d.slice(0, 6);
    if (/^4/.test(d)) return "Visa";
    if ((p2 >= 51 && p2 <= 55) || (p4 >= 2221 && p4 <= 2720)) return "Mastercard";
    if (p2 === 34 || p2 === 37) return "American Express";
    if (p4 === 6521 || p4 === 6522 || p6 === 508227 || p3 === 508 ||
        p2 === 81 || p2 === 82 || (p2 === 60 && p4 !== 6011)) return "RuPay";
    if (p4 === 6011 || p2 === 65 || (p3 >= 644 && p3 <= 649)) return "Discover";
    if (p4 >= 3528 && p4 <= 3589) return "JCB";
    if (p2 === 36 || p2 === 38 || p2 === 39 || (p3 >= 300 && p3 <= 305)) return "Diners Club";
    if (p4 === 6062) return "RuPay / NPCI";
    return "";
  }

  function luhn(d) {
    var sum = 0, alt = false;
    for (var i = d.length - 1; i >= 0; i--) {
      var n = +d[i];
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }

  /* GSTIN check character: weighted mod 36 over the first 14. */
  function gstCheck(g) {
    var sum = 0;
    for (var i = 0; i < 14; i++) {
      var v = B36.indexOf(g[i]);
      if (v < 0) return null;
      var p = v * (i % 2 ? 2 : 1);
      sum += Math.floor(p / 36) + (p % 36);
    }
    return B36[(36 - (sum % 36)) % 36];
  }

  /* ---------------------------------------------------------- detectors
     Each returns null if the string is not of that shape, so the first
     one that claims the value wins. Ordered most specific first. */
  var TESTS = [
    { id: "gstin", label: "GSTIN", re: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/,
      read: function (v) {
        var want = gstCheck(v), ok = want === v[14];
        var st = GST_STATE[v.slice(0, 2)];
        return {
          valid: ok,
          verdict: ok ? "Checksum passes" : "Checksum fails, expected last character " + want,
          why: ok ? "The 15th character is computed from the other 14, and it agrees. " +
                    "A number invented at random almost never gets this right."
                  : "The last character does not match what the other 14 compute to. " +
                    "Either it was mistyped or it was made up.",
          rows: [
            ["State of registration", (st || "unknown code " + v.slice(0, 2)) + " (" + v.slice(0, 2) + ")"],
            ["PAN of the holder", v.slice(2, 12)],
            ["Holder type from PAN", PAN_HOLDER[v[5]] || "unknown code " + v[5]],
            ["Registration in that state", "number " + v[12] + " for this PAN"],
            ["Check character", v[14] + (ok ? "" : ", expected " + want)]
          ],
          next: "The PAN inside a GSTIN is the same PAN the entity files tax under. " +
                "One PAN with GSTINs in several states is one business, not several."
        };
      } },

    { id: "cin", label: "CIN", re: /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
      read: function (v) {
        var st = CIN_STATE[v.slice(6, 8)], yr = +v.slice(8, 12), own = v.slice(12, 15);
        var now = new Date().getFullYear();
        var sane = yr >= 1857 && yr <= now;
        return {
          valid: sane,
          verdict: sane ? "Well-formed" : "Year of incorporation " + yr + " is not plausible",
          why: "A CIN has no checksum, so this confirms the shape and decodes what the " +
               "shape carries. It does not confirm the company exists.",
          rows: [
            ["Listing status", v[0] === "L" ? "Listed on a stock exchange" : "Unlisted"],
            ["Industry code (NIC)", v.slice(1, 6)],
            ["Registrar of Companies", (st || "unknown code " + v.slice(6, 8)) + " (" + v.slice(6, 8) + ")"],
            ["Year of incorporation", String(yr) + (sane && now - yr <= 2 ? "  — incorporated within the last two years" : "")],
            ["Company class", CIN_OWNER[own] || "unknown code " + own],
            ["ROC registration number", v.slice(15)]
          ],
          next: "Check the year of incorporation against the date of the offence. A company " +
                "registered weeks before the fraud is a different proposition from one trading for a decade. " +
                "The full record is free on the MCA master-data page."
        };
      } },

    { id: "pan", label: "PAN", re: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
      read: function (v) {
        var h = PAN_HOLDER[v[3]];
        return {
          valid: !!h,
          verdict: h ? "Well-formed" : "Fourth character '" + v[3] + "' is not a valid holder type",
          why: "The Income Tax Department does not publish the PAN check-digit algorithm, so " +
               "no offline tool can verify the last character. This confirms the structure.",
          rows: [
            ["Holder type", h || "invalid code " + v[3]],
            ["Surname / entity initial", v[4] + (h === "Individual" ? "  — first letter of the surname" : "  — first letter of the entity name")],
            ["Sequence", v.slice(5, 9)],
            ["Check character", v[9]]
          ],
          next: "If the complaint also has a GSTIN, characters 3 to 12 of that GSTIN should be this exact PAN."
        };
      } },

    { id: "tan", label: "TAN", re: /^[A-Z]{4}[0-9]{5}[A-Z]$/,
      read: function (v) {
        return {
          valid: true, verdict: "Well-formed",
          why: "A TAN identifies a deductor of tax at source. There is no public checksum.",
          rows: [
            ["City code", v.slice(0, 3)],
            ["Deductor name initial", v[3]],
            ["Sequence", v.slice(4, 9)],
            ["Check character", v[9]]
          ],
          next: "A TAN belongs to an employer or a payer. It is a useful route to salary records."
        };
      } },

    { id: "ifsc", label: "IFSC", re: /^[A-Z]{4}0[A-Z0-9]{6}$/,
      read: function (v) {
        return {
          valid: true, verdict: "Well-formed",
          why: "The fifth character of an IFSC is always zero, and this one is.",
          rows: [["Bank code", v.slice(0, 4)], ["Branch code", v.slice(5)]],
          next: "Open Bank Branch (IFSC) Lookup for the branch name, district and MICR."
        };
      } },

    { id: "epic", label: "Voter ID (EPIC)", re: /^[A-Z]{3}[0-9]{7}$/,
      read: function (v) {
        return {
          valid: true, verdict: "Matches the current EPIC format",
          why: "There is no checksum in an EPIC number. Older state-issued cards used " +
               "other formats entirely, so a number that fails this may still be genuine.",
          rows: [["Functional Constituency code", v.slice(0, 3)], ["Serial", v.slice(3)]],
          next: "Only the Electoral Registration Officer can confirm an EPIC. The ECI search " +
                "page needs the number plus the state."
        };
      } },

    { id: "dl", label: "Driving Licence", re: /^[A-Z]{2}[0-9]{2}[ -]?(19|20)[0-9]{2}[0-9]{7}$/,
      read: function (v) {
        var c = v.replace(/[ -]/g, ""), yr = +c.slice(4, 8);
        return {
          valid: true, verdict: "Matches the standard format",
          why: "Most states issue SSRRYYYYNNNNNNN. Some older licences do not follow it, " +
               "so a mismatch is not proof of forgery.",
          rows: [
            ["State code", c.slice(0, 2)],
            ["RTO office code", c.slice(2, 4)],
            ["Year of issue", String(yr)],
            ["Licence number", c.slice(8)]
          ],
          next: "The issuing RTO holds the application form, the photograph and the address proof."
        };
      } },

    { id: "passport", label: "Indian passport", re: /^[A-PR-WY][0-9]{7}$/,
      read: function (v) {
        return {
          valid: true, verdict: "Matches the Indian passport format",
          why: "One letter followed by seven digits. There is no checksum on the booklet " +
               "number itself. The machine-readable zone at the foot of the page does have one.",
          rows: [["Series letter", v[0]], ["Number", v.slice(1)]],
          next: "The Regional Passport Office holds the application, the police verification " +
                "report and the address history."
        };
      } },

    { id: "card", label: "Payment card number", re: /^[0-9]{12,19}$/,
      read: function (v) {
        var ok = luhn(v), net = cardNetwork(v);
        return {
          valid: ok,
          verdict: ok ? "Luhn check passes" : "Luhn check fails",
          why: ok ? "The last digit is computed from the rest, and it agrees. This says the " +
                    "number is well-formed. It does not say the card exists or has money on it."
                  : "The final digit does not match the rest of the number. A real card number " +
                    "always passes this, so this one was mistyped or invented.",
          rows: [
            ["Network", net || "not recognised from the opening digits"],
            ["Issuer identification number", v.slice(0, 6)],
            ["Length", v.length + " digits"],
            ["Last four", v.slice(-4)]
          ],
          next: "The first six digits identify the issuing bank. Serve the notice on that bank, " +
                "not on the merchant. Record only the first six and last four in the case file.",
          sensitive: true
        };
      } },

    { id: "aadhaar", label: "Possible Aadhaar number", re: /^[2-9][0-9]{11}$/,
      read: function () {
        return {
          valid: null,
          verdict: "Not checked here",
          why: "This is the shape of an Aadhaar number. This tool deliberately does not " +
               "process it. Aadhaar handling is restricted under the Aadhaar Act, and no " +
               "offline check can tell you whether a number was ever issued.",
          rows: [],
          next: "If you only need to see how the check digit works, the Checksum Demonstration " +
                "tool does that on synthetic numbers.",
          refuse: true
        };
      } }
  ];

  function identify(raw) {
    var v = String(raw).toUpperCase().replace(/[\s\-]/g, "");
    for (var i = 0; i < TESTS.length; i++) {
      if (TESTS[i].re.test(v)) {
        var r = TESTS[i].read(v);
        r.label = TESTS[i].label;
        r.norm = v;
        return r;
      }
    }
    return null;
  }

  TK.reg({
    id: "docid",
    name: "Document ID Checker",
    cluster: "identity",
    tier: 1,
    desc: "Paste any Indian ID number and find out what it is and whether it is well-formed.",
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">Paste any identifier, one per line</label>' +
          '<textarea id="di-in" class="mono" placeholder="27AAPFU0939F1ZV&#10;U72200KA2013PTC097389&#10;AAPFU0939F&#10;ABC1234567"></textarea>' +
          '<p class="xs muted" style="margin-top:6px">GSTIN, CIN, PAN, TAN, IFSC, voter ID, ' +
          'driving licence, passport or card number. You do not have to say which. ' +
          'Nothing leaves this computer.</p></div>' +
          '<div class="row"><button class="btn primary" id="di-go">Check</button></div>' +
        "</div><div id=\"di-out\"></div>";

      $("#di-go").onclick = go;
      TK.fileInto("#di-in", { extract: /\b(?=[A-Za-z0-9]{8,21}\b)(?=[A-Za-z0-9]*\d)[A-Za-z0-9]+\b/g, onLoad: go });

      function go() {
        var lines = $("#di-in").value.split(/[\n,;]+/)
          .map(function (s) { return s.trim(); }).filter(Boolean);
        if (!lines.length) { TK.toast("Nothing to check", "danger"); return; }

        var out = "";
        lines.forEach(function (line) {
          var r = identify(line);
          var head = '<div class="card tight"><div class="row" style="margin-bottom:11px">' +
            '<span class="mono" style="font-size:16px;font-weight:600">' + esc(line) + "</span>";

          if (!r) {
            out += head + '<span class="badge">not recognised</span></div>' +
              '<p class="small muted" style="margin:0">This does not match any format the tool ' +
              'knows. Check for a missing or extra character before assuming it is fake.</p></div>';
            return;
          }

          head += '<span class="badge accent">' + esc(r.label) + "</span>";
          if (r.refuse) head += '<span class="badge warn">not processed</span>';
          else if (r.valid === true) head += '<span class="badge ok">' + esc(r.verdict) + "</span>";
          else if (r.valid === false) head += '<span class="badge danger">' + esc(r.verdict) + "</span>";
          head += "</div>";

          var body = "";
          if (r.rows.length) {
            body += '<dl class="kv">' + r.rows.map(function (p) {
              return "<dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd>";
            }).join("") + "</dl>";
          }
          body += '<p class="small muted" style="margin-top:10px">' + esc(r.why) + "</p>";
          if (r.sensitive) {
            body += '<div class="note warn">Write only the first six and last four digits in the ' +
              "case file. A full card number does not belong in a case diary.</div>";
          }
          if (r.next) {
            body += '<p class="small" style="margin-top:8px"><b>Next:</b> ' + esc(r.next) + "</p>";
          }
          out += head + body + "</div>";
        });
        $("#di-out").innerHTML = out;
      }
    }
  });
})();
