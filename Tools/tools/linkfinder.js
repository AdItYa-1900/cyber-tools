/* ============================================================
   Entity Link Finder

   The slowest part of a cyber case is not reading any one file. It is
   noticing that the mobile number on the bank KYC is the same number
   sitting in the suspect's call records, and that the IMEI in the
   tower dump is the one in the CDR. Done by hand across a CDR, three
   statements, an IPDR and a CAF, that is days of eye work, and it is
   where things get missed.

   This loads every file at once, pulls out every identifier it can
   recognise, and reports the ones that appear in MORE THAN ONE file.
   That short list is the spine of the case.

   WHAT IT WILL AND WILL NOT CLAIM
   A value appearing in two files is a lead, not proof. Two accounts
   can share a branch IFSC and be unconnected. The tool ranks by how
   many separate sources a value appears in and says plainly that
   corroboration is still required. It never asserts a relationship.

   Extraction is deliberately strict. A loose pattern that matches
   every ten-digit run would bury the real links under dates, amounts
   and reference numbers, which is worse than not running it at all.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* Luhn, used to keep IMEI extraction honest: a 15-digit run that
     fails the check digit is almost never an IMEI. */
  function luhn(d) {
    var sum = 0, alt = false;
    for (var i = d.length - 1; i >= 0; i--) {
      var n = +d[i];
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }

  /* True when the match sits inside a longer digit run, which is how a
     ten-digit "number" gets read out of the middle of a fifteen-digit
     IMEI. \b cannot catch this: between two digits there is no
     boundary to find. */
  function insideLongerRun(text, start, end) {
    return /\d/.test(text.charAt(start - 1)) || /\d/.test(text.charAt(end));
  }

  /* Each extractor returns canonical values. `re` finds candidates and
     `keep` decides whether a candidate survives, which is what stops
     the output filling with dates and amounts. */
  var TYPES = [
    { id: "msisdn", label: "Mobile number", weight: 10,
      re: /(?:\+?91[\-\s]?|\b0)?([6-9]\d{9})\b/g,
      keep: function (m, text) {
        if (insideLongerRun(text, m.index, m.index + m[0].length)) return null;
        return m[1];
      } },

    /* The same number written the way people write it: 98765 43210.
       Kept separate and pinned to the 5+5 grouping, because allowing
       any separator inside a ten-digit run would start stitching
       together adjacent columns of a CSV. */
    { id: "msisdn", label: "Mobile number", weight: 10,
      re: /(?:\+?91[\-\s])?\b([6-9]\d{4})[\s\-]([0-9]{5})\b/g,
      keep: function (m, text) {
        if (insideLongerRun(text, m.index, m.index + m[0].length)) return null;
        return m[1] + m[2];
      } },

    /* An IMEI and an IMSI are both fifteen digits, so they can only be
       told apart by content. A Luhn-valid run is an IMEI. A run that
       fails Luhn and opens with an Indian MCC is an IMSI.

       Anything else failing Luhn is still reported as an IMEI, with the
       failure named, never dropped. A reflashed handset carries a wrong
       check digit by definition, and that is the one an officer most
       needs to see. Discarding it would hide the finding. */
    { id: "imei", label: "IMEI", weight: 10,
      re: /\b(\d{15})\b/g,
      keep: function (m, text) {
        if (insideLongerRun(text, m.index, m.index + m[0].length)) return null;
        if (luhn(m[1])) return m[1];
        if (/^(404|405)/.test(m[1])) return null;   // an Indian IMSI
        return m[1];
      },
      flag: function (v) { return luhn(v) ? "" : "check digit fails"; } },

    { id: "imsi", label: "IMSI", weight: 8,
      re: /\b((?:404|405)\d{12})\b/g,
      keep: function (m, text) {
        if (insideLongerRun(text, m.index, m.index + m[0].length)) return null;
        return luhn(m[1]) ? null : m[1];
      } },

    { id: "ifsc", label: "IFSC", weight: 4,
      re: /\b([A-Z]{4}0[A-Z0-9]{6})\b/g,
      keep: function (m) { return m[1]; } },

    { id: "upi", label: "UPI address", weight: 9,
      re: /\b([a-zA-Z0-9.\-_]{2,60}@[a-zA-Z]{2,20})\b/g,
      /* an email is not a UPI address; UPI handles have no dot after @ */
      keep: function (m) { return m[1].indexOf(".") > m[1].indexOf("@") ? null : m[1].toLowerCase(); } },

    { id: "email", label: "Email", weight: 8,
      re: /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g,
      keep: function (m) { return m[1].toLowerCase(); } },

    { id: "ip", label: "IP address", weight: 8,
      re: /\b((?:\d{1,3}\.){3}\d{1,3})\b/g,
      keep: function (m) {
        var ok = m[1].split(".").every(function (o) { return +o <= 255; });
        return ok ? m[1] : null;
      } },

    { id: "account", label: "Account number", weight: 7,
      re: /\b([Xx*]{4,}\d{4,6}|\d{11,18})\b/g,
      keep: function (m, text) {
        var v = m[1];
        if (/^[Xx*]/.test(v)) return v.toUpperCase();
        if (insideLongerRun(text, m.index, m.index + m[0].length)) return null;
        /* A country-coded mobile number is twelve digits and would
           otherwise be filed as an account, producing a duplicate of a
           number already extracted properly. */
        if (/^91[6-9]\d{9}$/.test(v)) return null;
        /* a bare long run is only an account if it is not an IMEI/IMSI */
        if (v.length === 15 || (v.length === 15 && v[0] === "4")) return null;
        return v.length >= 11 && v.length <= 18 ? v : null;
      } },

    { id: "utr", label: "UTR / reference", weight: 9,
      re: /\b(?:UTR|RRN|REF(?:\.|ERENCE)?(?:\s*NO\.?)?)[:\s]*([A-Z0-9]{8,22})\b/gi,
      keep: function (m) { return m[1].toUpperCase(); } },

    { id: "cellid", label: "Cell ID", weight: 9,
      re: /\b(\d{3}-\d{2,3}-\d{1,5}-\d{1,5})\b/g,
      keep: function (m) { return m[1]; } },

    { id: "vehicle", label: "Vehicle number", weight: 9,
      re: /\b([A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{4})\b/g,
      keep: function (m) { return m[1].replace(/\s+/g, ""); } },

    { id: "crypto", label: "Crypto address", weight: 10,
      re: /\b(0x[0-9a-fA-F]{40}|T[1-9A-HJ-NP-Za-km-z]{33}|bc1[02-9ac-hj-np-z]{11,71})\b/g,
      keep: function (m) { return m[1]; } }
  ];

  function extract(text) {
    var found = {};                     // type -> value -> count
    TYPES.forEach(function (t) {
      /* Two extractors may share an id (a number written solid, and the
         same number written 5+5). They accumulate into one bucket. */
      if (!found[t.id]) found[t.id] = {};
      var re = new RegExp(t.re.source, t.re.flags), m;
      while ((m = re.exec(text)) !== null) {
        var v = t.keep(m, text);
        if (!v) continue;
        found[t.id][v] = (found[t.id][v] || 0) + 1;
      }
    });
    /* An email and a UPI address can match the same span; the email
       rule is the stricter one, so it wins. */
    Object.keys(found.email).forEach(function (e) { delete found.upi[e]; });
    return found;
  }

  TK.reg({
    id: "linkfinder",
    name: "Entity Link Finder",
    cluster: "network",
    tier: 2,
    wide: true,
    desc: "Load every file in a case and find the identifiers that appear in more than one.",
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="drop" id="lf-drop"><div class="big"></div>' +
          "<div>Drop every file in the case, or <b>browse</b></div>" +
          '<div class="xs muted" style="margin-top:6px">CDRs, statements, IPDR, CAF, tower dumps, ' +
          "chat exports, notes. Text or CSV. Two or more files, or there is nothing to cross.</div></div>" +
          '<div id="lf-files" style="margin-top:14px"></div>' +
        "</div><div id=\"lf-out\"></div>";

      var loaded = [];

      TK.dropzone($("#lf-drop"), function (files) {
        var pending = files.length;
        files.forEach(function (f) {
          TK.readText(f, function (txt) {
            loaded.push({ name: f.name, size: f.size, text: txt, ents: extract(txt) });
            if (--pending === 0) { paintFiles(); analyse(); }
          });
        });
      }, { multiple: true, accept: ".csv,.tsv,.txt,.log,.json" });

      function paintFiles() {
        $("#lf-files").innerHTML = '<div class="row" style="flex-wrap:wrap;gap:8px">' +
          loaded.map(function (f, i) {
            return '<span class="badge">' + esc(f.name) + " · " + TK.fmtBytes(f.size) + "</span>";
          }).join("") +
          ' <button class="btn sm ghost" id="lf-clear">Clear</button></div>';
        $("#lf-clear").onclick = function () {
          loaded = []; $("#lf-files").innerHTML = ""; $("#lf-out").innerHTML = "";
        };
      }

      function analyse() {
        if (loaded.length < 2) {
          $("#lf-out").innerHTML = '<div class="note warn"><b>One file cannot be crossed</b>' +
            "<p>This tool reports identifiers that appear in more than one source. Load at least " +
            "two files from the same case.</p></div>";
          return;
        }

        /* type|value -> { type, value, files:{name:count} } */
        var index = {};
        loaded.forEach(function (f) {
          TYPES.forEach(function (t) {
            Object.keys(f.ents[t.id]).forEach(function (v) {
              var key = t.id + "|" + v;
              if (!index[key]) index[key] = { type: t, value: v, files: {}, total: 0 };
              index[key].files[f.name] = f.ents[t.id][v];
              index[key].total += f.ents[t.id][v];
            });
          });
        });

        var rows = Object.keys(index).map(function (k) { return index[k]; })
          .filter(function (r) { return Object.keys(r.files).length > 1; })
          .map(function (r) {
            var n = Object.keys(r.files).length;
            var note = r.type.flag ? r.type.flag(r.value) : "";
            return {
              kind: r.type.label + (note ? " (" + note + ")" : ""),
              value: r.value,
              sources: n,
              occurrences: r.total,
              where: Object.keys(r.files).map(function (f) {
                return f + " (" + r.files[f] + ")";
              }).join(", "),
              score: n * 100 + r.type.weight
            };
          })
          .sort(function (a, b) { return b.score - a.score || b.occurrences - a.occurrences; });

        var byKind = {};
        rows.forEach(function (r) { byKind[r.kind] = (byKind[r.kind] || 0) + 1; });
        var allSources = rows.filter(function (r) { return r.sources === loaded.length; }).length;

        var h = '<div class="grid c4">' +
          TK.stat(loaded.length, "Files crossed") +
          TK.stat(rows.length, "Linked identifiers") +
          TK.stat(allSources, "In every file", allSources ? "ok" : "") +
          TK.stat(Object.keys(byKind).length, "Kinds of link") +
          "</div>";

        if (!rows.length) {
          h += '<div class="note info"><b>Nothing appears in two files</b>' +
            "<p>These sources have no identifier in common. That is itself a finding: either the " +
            "files belong to unrelated matters, or the link runs through something not written in " +
            "them, such as a person or an address.</p></div>";
          $("#lf-out").innerHTML = h;
          return;
        }

        h += '<div class="card"><h3>Identifiers present in more than one source</h3>' +
          '<p class="small muted">Ordered by how many separate sources carry the value. A value in ' +
          "every file is the strongest lead the set contains.</p>" +
          '<div id="lf-tbl"></div></div>';

        h += '<div class="note warn"><b>A shared value is a lead, not a relationship</b>' +
          "<p>Two statements can share a branch IFSC and have nothing to do with each other. A number " +
          "can appear in two CDRs because it is a call centre. Every row here has to be explained " +
          "before it goes in a report: check what the value is, then check why both sources hold it.</p></div>";

        $("#lf-out").innerHTML = h;

        TK.table($("#lf-tbl"), rows, [
          { k: "kind", label: "Type" },
          { k: "value", label: "Value", cls: "mono", w: "230px" },
          { k: "sources", label: "Sources", cls: "num",
            fmt: function (v) {
              return '<span class="badge ' + (v === loaded.length ? "ok" : "") + '">' + v + "</span>";
            } },
          { k: "occurrences", label: "Times seen", cls: "num" },
          { k: "where", label: "Found in", w: "320px" }
        ], { filename: "entity-links", sort: "sources", dir: -1, pageSize: 40 });
      }
    }
  });

  TK._linkTest = { extract: extract };
})();
