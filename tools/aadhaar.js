/* ============================================================
   Aadhaar Verifier

   Three checks an investigating officer can lawfully run, all of
   them entirely on this machine and none of them contacting UIDAI:

     1. Check digit   - Verhoeff, over a number already in the case
                        file. Catches a transcription error before it
                        reaches a requisition or a chargesheet.
     2. Bulk check    - the same over a CSV, a text file or a text
                        PDF, for a seized list.
     3. Secure QR     - decodes the signed block printed on every
                        Aadhaar letter, e-Aadhaar and PVC card, and
                        compares it against what is printed on the
                        face of the card. A forged card is normally
                        an edited print over an unchanged or borrowed
                        QR, so the two disagree.

   What no tool can do, this one included: turn an Aadhaar number
   into a name and address. That is held in the CIDR, and Aadhaar
   Act 2016 s.33 releases it only on the order of a court not
   inferior to a District Judge. Authentication needs an AUA/KUA
   licence and the resident's consent. Anything online offering
   number-to-identity is either selling leaked data or inventing it.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* ==========================================================
     Verhoeff
     ========================================================== */

  var D = [
    [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0]
  ];
  var P = [
    [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]
  ];
  var INV = [0,4,3,2,1,5,6,7,8,9];

  function verhoeffOK(num) {
    var c = 0, rev = num.split("").reverse();
    for (var i = 0; i < rev.length; i++) c = D[c][P[i % 8][+rev[i]]];
    return c === 0;
  }
  function verhoeffDigit(payload) {
    var c = 0, rev = payload.split("").reverse();
    for (var i = 0; i < rev.length; i++) c = D[c][P[(i + 1) % 8][+rev[i]]];
    return INV[c];
  }

  /* An Aadhaar number never begins 0 or 1; a VID always begins 2 and
     is 16 digits. Both carry a Verhoeff digit. */
  function classify(raw) {
    var v = String(raw).replace(/[^\d]/g, "");
    if (!v) return { kind: "empty" };
    if (v.length === 12) {
      if (/^[01]/.test(v)) {
        return { kind: "aadhaar", v: v, ok: false, why: "an Aadhaar number never starts with 0 or 1" };
      }
      return { kind: "aadhaar", v: v, ok: verhoeffOK(v), expect: verhoeffDigit(v.slice(0, 11)) };
    }
    if (v.length === 16 && /^[2-9]/.test(v)) {
      return { kind: "vid", v: v, ok: verhoeffOK(v), expect: verhoeffDigit(v.slice(0, 15)) };
    }
    return { kind: "length", v: v, n: v.length };
  }

  function mask(v) {
    return v.length >= 4 ? "XXXX XXXX " + v.slice(-4) : v;
  }
  function group(v) {
    return v.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  /* ==========================================================
     Secure QR

     The QR payload is one very long decimal integer. It decodes to a
     byte array, gzip-compressed from V2 onwards, holding text fields
     separated by byte 255, then the photograph, then optional 32-byte
     contact hashes, then a 256-byte RSA signature.
     ========================================================== */

  /* decimal string -> bytes, without BigInt so the file stays ES5 */
  function decToBytes(dec) {
    var digits = dec.replace(/\D/g, "");
    if (!digits) return null;
    var num = [], i, j;
    for (i = 0; i < digits.length; i++) num.push(+digits.charAt(i));
    var out = [];
    while (num.length) {
      var rem = 0, next = [];
      for (j = 0; j < num.length; j++) {
        var cur = rem * 10 + num[j];
        var q = Math.floor(cur / 256);
        rem = cur % 256;
        if (next.length || q) next.push(q);
      }
      out.push(rem);
      num = next;
    }
    out.reverse();
    return new Uint8Array(out);
  }

  function gunzip(bytes, cb) {
    if (typeof DecompressionStream !== "function") { cb(null); return; }
    try {
      var ds = new DecompressionStream("gzip");
      var w = ds.writable.getWriter();
      w.write(bytes); w.close();
      new Response(ds.readable).arrayBuffer()
        .then(function (b) { cb(new Uint8Array(b)); })
        .catch(function () { cb(null); });
    } catch (e) { cb(null); }
  }

  function utf8(u8, from, to) {
    var s = "";
    for (var i = from; i < to; i++) s += "%" + ("0" + u8[i].toString(16)).slice(-2);
    try { return decodeURIComponent(s); } catch (e) {
      var t = "";
      for (var j = from; j < to; j++) t += String.fromCharCode(u8[j]);
      return t;
    }
  }

  var FIELDS = ["name", "dob", "gender", "careOf", "district", "landmark", "house",
                "location", "pincode", "postOffice", "state", "street", "subDistrict", "vtc"];
  var LABELS = {
    name: "Name", dob: "Date of birth", gender: "Gender", careOf: "Care of",
    house: "House", street: "Street", landmark: "Landmark", location: "Location",
    vtc: "Village / town / city", subDistrict: "Sub-district", district: "District",
    postOffice: "Post office", state: "State", pincode: "PIN code"
  };

  function parseQR(u8) {
    /* split on the 0xFF delimiter */
    var parts = [], start = 0, i;
    for (i = 0; i < u8.length; i++) {
      if (u8[i] === 255) { parts.push([start, i]); start = i + 1; }
    }
    if (parts.length < 15) return { error: "This does not have the field structure of an Aadhaar Secure QR." };

    var txt = parts.map(function (r) { return utf8(u8, r[0], r[1]); });

    /* V2 and later begin with a version marker; V1 begins with the
       contact-present flag */
    var version = "V1", off = 0;
    if (/^V\d$/i.test(txt[0])) { version = txt[0].toUpperCase(); off = 1; }

    var flag = txt[off] || "";
    var refId = txt[off + 1] || "";
    var out = { version: version, flag: flag, refId: refId, fields: {} };
    for (i = 0; i < FIELDS.length; i++) out.fields[FIELDS[i]] = txt[off + 2 + i] || "";

    /* Sanity-check the layout before asserting anybody's identity. An
       unfamiliar version would otherwise be reported confidently with
       the fields shifted by one, which is how a tool gets a person
       wrongly attached to an address. */
    var checks = 0, passed = 0;
    checks++; if (/^\d{4}\d{8,}/.test(refId)) passed++;
    checks++; if (/^[MFT]$/i.test(out.fields.gender)) passed++;
    checks++; if (/^\d{6}$/.test(out.fields.pincode)) passed++;
    checks++; if (/\d{4}/.test(out.fields.dob)) passed++;
    checks++; if (out.fields.name && out.fields.name.length > 1 && !/^\d+$/.test(out.fields.name)) passed++;
    out.confidence = passed / checks;
    out.raw = txt;

    if (passed < 4) {
      out.error = "The fields did not come out where an Aadhaar Secure QR keeps them, so nothing here " +
        "is being reported as an identity. The raw fields are listed below for you to read yourself.";
      return out;
    }

    out.last4 = refId.slice(0, 4);
    var ts = refId.slice(4);
    if (/^\d{12,}$/.test(ts)) {
      out.issued = ts.slice(0, 4) + "-" + ts.slice(4, 6) + "-" + ts.slice(6, 8) + " " +
                   ts.slice(8, 10) + ":" + ts.slice(10, 12) + ":" + ts.slice(12, 14);
    }

    /* photo runs from after the last text field to the start of the
       trailing hashes and signature */
    var photoFrom = parts[off + 2 + FIELDS.length - 1][1] + 1;
    var hashes = 0;
    if (flag === "1" || flag === "2") hashes = 1;
    else if (flag === "3") hashes = 2;
    var photoTo = u8.length - 256 - hashes * 32;
    if (photoTo > photoFrom) {
      out.photoFrom = photoFrom;
      out.photoTo = photoTo;
      out.photoBytes = photoTo - photoFrom;
    }
    out.hasEmail = flag === "1" || flag === "3";
    out.hasMobile = flag === "2" || flag === "3";
    out.signature = u8.slice(u8.length - 256);
    out.signedTo = u8.length - 256;
    return out;
  }

  /* ==========================================================
     Tool
     ========================================================== */

  TK.reg({
    id: "verhoeff",
    name: "Aadhaar Verifier",
    cluster: "identity",
    tier: 1,
    desc: "Check an Aadhaar or VID check digit, verify many at once, and decode the Secure QR on a card to test it against what is printed.",
    render: function (root) {
      root.innerHTML =
        '<div class="card"><h3>Check one number</h3>' +
          '<div class="field"><label class="lbl" for="ad-in">Aadhaar (12 digits) or VID (16 digits)</label>' +
          '<input type="text" id="ad-in" class="mono" maxlength="24" placeholder="0000 0000 0000" autocomplete="off"></div>' +
          '<div id="ad-out"></div></div>' +

        '<div class="card"><h3>Check many at once</h3>' +
          '<div id="ad-bulk"></div><div id="ad-bulk-out"></div></div>' +

        '<div class="card"><h3>Secure QR on a card</h3>' +
          '<p class="xs muted">Scan the QR on the Aadhaar letter, PVC card or e-Aadhaar with any ' +
          "phone scanner and paste what it returns: a long run of digits.</p>" +
          '<div class="field"><textarea id="ad-qr" class="mono" style="min-height:88px" ' +
          'placeholder="2374172… (several hundred digits)"></textarea></div>' +
          '<div class="row" style="gap:8px;flex-wrap:wrap">' +
          '<button class="btn" id="ad-qr-go">Decode</button>' +
          '<span class="xs muted" id="ad-qr-note"></span></div>' +
          '<div id="ad-qr-out"></div></div>';

      /* ---- single ----------------------------------------- */

      function single() {
        var el = $("#ad-out"), r = classify($("#ad-in").value);
        if (r.kind === "empty") { el.innerHTML = ""; return; }

        if (r.kind === "length") {
          el.innerHTML = '<div class="note"><b>' + r.n + " digits</b>" +
            "<p>An Aadhaar number is 12 digits, a VID is 16.</p></div>";
          return;
        }

        var label = r.kind === "vid" ? "VID" : "Aadhaar number";
        if (r.why) {
          el.innerHTML = '<div class="note danger"><b>Not a valid ' + label + "</b><p>" +
            esc(r.why) + ".</p></div>";
          return;
        }

        el.innerHTML = '<div class="note ' + (r.ok ? "ok" : "danger") + '"><b>' +
          (r.ok ? "Check digit valid" : "Check digit fails") + "</b>" +
          "<p>" + label + " <span class='mono'>" + esc(group(r.v)) + "</span>. " +
          (r.ok
            ? "The digits are internally consistent, so this was not mistyped. Whether it was ever " +
              "issued, and to whom, is held by UIDAI and released only on a court order."
            : "The last digit should be <span class='mono'>" + r.expect + "</span>. Re-read the source " +
              "document: this number cannot exist as written.") +
          "</p></div>";
      }
      $("#ad-in").addEventListener("input", single);

      /* ---- bulk ------------------------------------------- */

      TK.bulkInput($("#ad-bulk"), {
        placeholder: "Paste numbers, or a whole page of text, and every Aadhaar-shaped number in it is checked",
        action: "Check all",
        onClear: function () { $("#ad-bulk-out").innerHTML = ""; },
        onText: function (text) {
          /* pick up spaced and hyphenated forms, but not a run of digits
             that is part of something longer such as an account number */
          var re = /(?<![\d])(\d[\d\- ]{10,22}\d)(?![\d])/g, m, seen = {}, rows = [];
          while ((m = re.exec(text)) !== null) {
            var digits = m[1].replace(/\D/g, "");
            if (digits.length !== 12 && digits.length !== 16) continue;
            if (seen[digits]) { seen[digits].count++; continue; }
            var r = classify(digits);
            var row = {
              number: group(digits),
              kind: r.kind === "vid" ? "VID" : "Aadhaar",
              verdict: r.why ? "Invalid: " + r.why : r.ok ? "Check digit valid" : "Check digit fails, expected " + r.expect,
              ok: !r.why && r.ok,
              count: 1
            };
            seen[digits] = row;
            rows.push(row);
          }

          var host = $("#ad-bulk-out");
          if (!rows.length) {
            host.innerHTML = TK.empty("No 12 or 16 digit numbers found in that text.", "∅");
            return;
          }
          var bad = rows.filter(function (r) { return !r.ok; });
          host.innerHTML =
            '<div class="grid c3" style="margin-top:14px">' +
            TK.stat(rows.length, "Distinct numbers", "") +
            TK.stat(rows.length - bad.length, "Check digit valid", "ok") +
            TK.stat(bad.length, "Failed", bad.length ? "danger" : "") +
            "</div><div id=\"ad-bulk-tbl\" style=\"margin-top:14px\"></div>" +
            '<div class="row" style="margin-top:12px"><button class="btn sm ghost" id="ad-bulk-csv">Export results as CSV</button></div>';

          TK.table($("#ad-bulk-tbl"), rows, [
            { k: "number", label: "Number", cls: "mono" },
            { k: "kind", label: "Type" },
            { k: "count", label: "Times seen" },
            { k: "verdict", label: "Result",
              fmt: function (v, row) {
                return '<span class="badge ' + (row.ok ? "ok" : "danger") + '">' + esc(v) + "</span>";
              } }
          ]);

          $("#ad-bulk-csv").onclick = function () {
            TK.download("aadhaar-check.csv", TK.toCSV(rows.map(function (r) {
              return { number: r.number, type: r.kind, times_seen: r.count, result: r.verdict };
            })), "text/csv");
          };
        }
      });

      /* ---- secure QR --------------------------------------- */

      $("#ad-qr-go").onclick = function () {
        var raw = $("#ad-qr").value.replace(/\s+/g, "");
        var note = $("#ad-qr-note"), out = $("#ad-qr-out");
        out.innerHTML = "";
        if (!raw) { TK.toast("Paste the QR contents first", "warn"); return; }
        if (!/^\d+$/.test(raw)) {
          out.innerHTML = '<div class="note warn"><b>That is not a Secure QR payload</b>' +
            "<p>A Secure QR scans as digits only. If your scanner returned a web address, the card " +
            "carries the older non-signed QR, which holds nothing that can be verified.</p></div>";
          return;
        }

        note.textContent = "Decoding…";
        setTimeout(function () {
          var bytes = decToBytes(raw);
          if (!bytes || bytes.length < 300) {
            note.textContent = "";
            out.innerHTML = '<div class="note warn">That payload is too short to be a Secure QR.</div>';
            return;
          }
          if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
            gunzip(bytes, function (plain) {
              note.textContent = "";
              if (!plain) {
                out.innerHTML = '<div class="note warn">This browser could not decompress the payload.</div>';
                return;
              }
              showQR(plain, bytes.length);
            });
          } else {
            note.textContent = "";
            showQR(bytes, bytes.length);
          }
        }, 20);
      };

      function showQR(u8, rawLen) {
        var q = parseQR(u8), out = $("#ad-qr-out");

        if (q.error) {
          var h = '<div class="note warn"><b>Could not read this reliably</b><p>' + esc(q.error) + "</p></div>";
          if (q.raw) {
            h += '<div class="card tight"><h3>Raw fields</h3><pre class="out">' +
              esc(q.raw.slice(0, 24).map(function (t, i) { return i + ": " + t; }).join("\n")) + "</pre></div>";
          }
          out.innerHTML = h;
          return;
        }

        var rows = [];
        FIELDS.forEach(function (f) {
          if (q.fields[f]) rows.push([LABELS[f] || f, q.fields[f]]);
        });

        var h = '<div class="grid c3" style="margin-top:14px">' +
          TK.stat(q.version, "QR version", "") +
          TK.stat("…" + q.last4, "Last 4 digits", "") +
          TK.stat(q.photoBytes ? TK.fmtBytes(q.photoBytes) : "none", "Photograph", q.photoBytes ? "ok" : "warn") +
          "</div>";

        h += '<div class="card tight" style="margin-top:14px"><h3>What the QR actually contains</h3><div class="kv">';
        rows.forEach(function (r) {
          h += "<div><span>" + esc(r[0]) + "</span><b>" + esc(r[1]) + "</b></div>";
        });
        if (q.issued) h += "<div><span>Generated</span><b class='mono'>" + esc(q.issued) + "</b></div>";
        h += "<div><span>Contact details</span><b>" +
          (q.hasMobile || q.hasEmail
            ? [q.hasMobile ? "mobile" : null, q.hasEmail ? "email" : null].filter(Boolean).join(" and ") +
              " present, stored as a hash only"
            : "none carried") + "</b></div>";
        h += "</div></div>";

        h += '<div class="card tight"><h3>Compare against the printed card</h3>' +
          '<p class="xs muted">A forged card is usually a genuine QR with an edited print over it. ' +
          "Type what is printed on the face of the card and the two are compared.</p>" +
          '<div class="grid c2">' +
          '<div class="field"><label class="lbl" for="ad-pn">Printed name</label>' +
          '<input type="text" id="ad-pn" autocomplete="off"></div>' +
          '<div class="field"><label class="lbl" for="ad-pd">Printed date of birth or year</label>' +
          '<input type="text" id="ad-pd" autocomplete="off" placeholder="DD-MM-YYYY"></div>' +
          '<div class="field"><label class="lbl" for="ad-pa">Printed Aadhaar number</label>' +
          '<input type="text" id="ad-pa" class="mono" autocomplete="off" placeholder="0000 0000 0000"></div>' +
          "</div><div id=\"ad-cmp\"></div></div>";

        if (q.photoBytes) {
          h += '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm ghost" id="ad-photo">' +
            "Save the embedded photograph</button>" +
            '<span class="xs muted">JPEG 2000, which browsers cannot display. Open it in an image viewer.</span></div>';
        }

        h += '<div class="note"><b>Signature not checked</b><p>The block ends with a 256-byte UIDAI ' +
          "signature. Verifying it needs UIDAI's current public certificate, which UIDAI reissues; a " +
          "stale copy bundled here would report genuine cards as forged, so none is bundled. The " +
          "contents above are what the QR carries, and comparing them against the print is what " +
          "exposes an edited card.</p></div>";

        out.innerHTML = h;

        function compare() {
          var pn = $("#ad-pn").value.trim(), pd = $("#ad-pd").value.trim(),
              pa = $("#ad-pa").value.replace(/\D/g, "");
          var items = [];
          function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ""); }

          if (pn) {
            items.push({ what: "Name", printed: pn, qr: q.fields.name,
                         same: norm(pn) === norm(q.fields.name) });
          }
          if (pd) {
            var a = pd.replace(/\D/g, ""), b = (q.fields.dob || "").replace(/\D/g, "");
            items.push({ what: "Date of birth", printed: pd, qr: q.fields.dob,
                         same: a === b || (a.length === 4 && b.indexOf(a) >= 0) ||
                               (b.length === 4 && a.indexOf(b) >= 0) });
          }
          if (pa) {
            items.push({ what: "Last 4 digits", printed: pa.slice(-4), qr: q.last4,
                         same: pa.slice(-4) === q.last4 });
          }
          if (!items.length) { $("#ad-cmp").innerHTML = ""; return; }

          var bad = items.filter(function (x) { return !x.same; });
          var hh = '<div class="note ' + (bad.length ? "danger" : "ok") + '"><b>' +
            (bad.length ? "The print does not match the QR" : "The print matches the QR") + "</b><p>" +
            (bad.length
              ? "The signed block says something different from what is printed on the face. Seize the " +
                "card and record both readings."
              : "Every field you entered agrees with the signed block.") + "</p></div>";
          hh += '<div class="kv">';
          items.forEach(function (x) {
            hh += "<div><span>" + esc(x.what) + "</span><b>" +
              '<span class="badge ' + (x.same ? "ok" : "danger") + '">' +
              (x.same ? "same" : "differs") + "</span> " +
              esc(x.printed) + (x.same ? "" : " vs " + esc(x.qr)) + "</b></div>";
          });
          hh += "</div>";
          $("#ad-cmp").innerHTML = hh;
        }
        ["ad-pn", "ad-pd", "ad-pa"].forEach(function (i) {
          $("#" + i).addEventListener("input", compare);
        });

        if (q.photoBytes) {
          $("#ad-photo").onclick = function () {
            TK.download("aadhaar-qr-photo.jp2",
              new Blob([u8.slice(q.photoFrom, q.photoTo)], { type: "image/jp2" }));
          };
        }
      }
    }
  });

  TK._aadhaarTest = { verhoeffOK: verhoeffOK, verhoeffDigit: verhoeffDigit,
                      classify: classify, decToBytes: decToBytes, parseQR: parseQR };
})();
