/* ============================================================
   Chat Export Analyser

   An exported chat is now the commonest single exhibit in a cyber
   case, and it usually arrives as a wall of thousands of lines that
   somebody has to read by eye. This turns it into a record: who spoke,
   when, what was sent, and what is missing from the export.

   Two findings matter more than the rest, and both are about absence:

     <Media omitted>      the export was taken WITHOUT media. Every
                          photograph, voice note and document in the
                          conversation is not in the file. An officer
                          who does not notice this files an exhibit
                          with the evidence removed.
     deleted messages     "This message was deleted" is a positive
                          finding. It proves a message existed at that
                          timestamp and was withdrawn.

   Formats handled: the Android export (dd/mm/yyyy, hh:mm - Sender:)
   and the iOS one ([dd/mm/yyyy, h:mm:ss AM] Sender:), including
   12-hour clocks and multi-line messages.

   Nothing is uploaded. The file is read in this browser.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* Each pattern captures date, time, an optional meridiem, sender and
     body. Tried in order; the first that matches a majority of lines
     decides the format for the whole file. */
  var LINE_FORMATS = [
    { id: "ios",
      re: /^‎?\[(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*([AaPp][Mm])?\]\s*([^:]{1,60}?):\s?([\s\S]*)$/ },
    { id: "android",
      re: /^(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*([AaPp][Mm])?\s*[-–]\s*([^:]{1,60}?):\s?([\s\S]*)$/ }
  ];

  /* A line that has a timestamp but no "Sender:" is a system notice:
     the encryption banner, a join or leave, a group rename. */
  var SYSTEM_FORMATS = [
    /^‎?\[(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*([AaPp][Mm])?\]\s*([\s\S]*)$/,
    /^(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*([AaPp][Mm])?\s*[-–]\s*([\s\S]*)$/
  ];

  var MEDIA_RE = /<\s*(?:media omitted|attached|image omitted|video omitted|audio omitted|document omitted|sticker omitted|gif omitted)[^>]*>|image omitted|video omitted|audio omitted|document omitted/i;
  var DELETED_RE = /this message was deleted|you deleted this message|message deleted/i;

  function detectFormat(lines) {
    var best = null, bestHits = 0;
    LINE_FORMATS.forEach(function (f) {
      var hits = 0;
      for (var i = 0; i < Math.min(lines.length, 400); i++) {
        if (f.re.test(lines[i])) hits++;
      }
      if (hits > bestHits) { bestHits = hits; best = f; }
    });
    return { fmt: best, hits: bestHits };
  }

  function toDate(d, t, mer, order) {
    var p = d.split(/[\/\-.]/).map(Number);
    var y, mo, da;
    if (p[0] > 31) { y = p[0]; mo = p[1]; da = p[2]; }        // yyyy-mm-dd
    else if (order === "mdy") { mo = p[0]; da = p[1]; y = p[2]; }
    else { da = p[0]; mo = p[1]; y = p[2]; }
    if (y < 100) y += y < 70 ? 2000 : 1900;

    var tp = t.split(":").map(Number);
    var h = tp[0], mi = tp[1], se = tp[2] || 0;
    if (mer) {
      var pm = /p/i.test(mer);
      if (pm && h < 12) h += 12;
      if (!pm && h === 12) h = 0;
    }
    var dt = new Date(y, (mo || 1) - 1, da || 1, h, mi, se);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function parse(text) {
    var lines = text.replace(/\r\n/g, "\n").split("\n");
    var det = detectFormat(lines);
    if (!det.fmt) return { error: "no recognisable chat lines" };

    /* Same ambiguity as any dump: 03/04 could be either order. Decide
       from a day component above 12 if the file contains one. */
    var dFirst = 0, mFirst = 0;
    lines.forEach(function (l) {
      var m = l.match(det.fmt.re) || l.match(SYSTEM_FORMATS[0]) || l.match(SYSTEM_FORMATS[1]);
      if (!m) return;
      var p = m[1].split(/[\/\-.]/).map(Number);
      if (p[0] > 31) return;
      if (p[0] > 12) dFirst++;
      if (p[1] > 12) mFirst++;
    });
    var order = mFirst && !dFirst ? "mdy" : "dmy";

    var msgs = [], system = [], cur = null, unparsed = 0;

    function flush() { if (cur) { msgs.push(cur); cur = null; } }

    lines.forEach(function (line) {
      if (!line.trim()) { if (cur) cur.body += "\n"; return; }

      var m = line.match(det.fmt.re);
      if (m) {
        flush();
        cur = {
          when: toDate(m[1], m[2], m[3], order),
          sender: m[4].trim().replace(/^‎/, ""),
          body: m[5] || ""
        };
        return;
      }
      /* timestamped but no sender: a system notice */
      var sm = line.match(SYSTEM_FORMATS[0]) || line.match(SYSTEM_FORMATS[1]);
      if (sm && sm[4] && sm[4].indexOf(":") === -1) {
        flush();
        system.push({ when: toDate(sm[1], sm[2], sm[3], order), text: sm[4].trim() });
        return;
      }
      /* otherwise a continuation of the message above */
      if (cur) cur.body += "\n" + line;
      else unparsed++;
    });
    flush();

    return { msgs: msgs, system: system, order: order, format: det.fmt.id,
             unparsed: unparsed, lines: lines.length };
  }

  TK.reg({
    id: "chat",
    name: "Chat Export Analyser",
    cluster: "telecom",
    tier: 2,
    wide: true,
    desc: "Read an exported chat into a record of who spoke, when, and what the export left out.",
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="drop" id="ch-drop"><div class="big"></div>' +
          "<div>Drop the exported chat, or <b>browse</b></div>" +
          '<div class="xs muted" style="margin-top:6px">The .txt file from Export chat. ' +
          "Android and iPhone exports are both read. Nothing is uploaded.</div></div>" +
        "</div><div id=\"ch-out\"></div>";

      TK.dropzone($("#ch-drop"), function (f) {
        TK.readText(f, function (txt) { show(f, parse(txt)); });
      }, { accept: ".txt,.log" });

      function show(file, r) {
        if (r.error || !r.msgs.length) {
          $("#ch-out").innerHTML = '<div class="note danger"><b>This does not read as a chat export</b>' +
            "<p>No timestamped lines were found. Export the conversation from the app itself " +
            "rather than copying text out of the screen, and keep the .txt file as it comes.</p></div>";
          return;
        }

        var people = {}, hours = new Array(24).fill(0);
        var media = 0, deleted = 0, chars = 0;
        var links = {}, numbers = {}, upi = {}, amounts = [];

        r.msgs.forEach(function (m) {
          var p = people[m.sender] || (people[m.sender] = {
            sender: m.sender, msgs: 0, media: 0, deleted: 0, chars: 0, first: null, last: null
          });
          p.msgs++;
          chars += m.body.length; p.chars += m.body.length;
          if (m.when) {
            hours[m.when.getHours()]++;
            if (!p.first || m.when < p.first) p.first = m.when;
            if (!p.last || m.when > p.last) p.last = m.when;
          }
          if (MEDIA_RE.test(m.body)) { media++; p.media++; }
          if (DELETED_RE.test(m.body)) { deleted++; p.deleted++; }

          (m.body.match(/https?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+/gi) || []).forEach(function (u) {
            links[u] = (links[u] || 0) + 1;
          });
          (m.body.match(/(?:\+?91[\-\s]?)?\b[6-9]\d{9}\b/g) || []).forEach(function (n) {
            var v = n.replace(/\D/g, "").slice(-10);
            numbers[v] = (numbers[v] || 0) + 1;
          });
          (m.body.match(/\b[a-zA-Z0-9.\-_]{2,40}@[a-zA-Z]{2,20}\b/g) || []).forEach(function (u) {
            if (u.indexOf(".") < u.indexOf("@")) upi[u.toLowerCase()] = (upi[u.toLowerCase()] || 0) + 1;
          });
          var am = m.body.match(/(?:₹|rs\.?\s*|inr\s*)([\d,]+(?:\.\d{1,2})?)/gi);
          if (am) am.forEach(function (a) { amounts.push(a.trim()); });
        });

        var dated = r.msgs.filter(function (m) { return m.when; });
        var first = dated.length ? dated[0].when : null;
        var last = dated.length ? dated[dated.length - 1].when : null;
        var rows = Object.keys(people).map(function (k) { return people[k]; })
          .sort(function (a, b) { return b.msgs - a.msgs; });

        var h = '<div class="grid c4">' +
          TK.stat(r.msgs.length, "Messages") +
          TK.stat(rows.length, "Participants") +
          TK.stat(media, "Media not in export", media ? "danger" : "ok") +
          TK.stat(deleted, "Deleted", deleted ? "warn" : "") +
          "</div>";

        h += '<div class="card"><h3>The export itself</h3><dl class="kv">' +
          "<dt>File</dt><dd>" + esc(file.name) + ", " + TK.fmtBytes(file.size) + "</dd>" +
          "<dt>Format</dt><dd>" + (r.format === "ios" ? "iPhone export" : "Android export") + "</dd>" +
          "<dt>Date order read as</dt><dd>" + (r.order === "mdy" ? "month first" : "day first") + "</dd>" +
          (first ? "<dt>First message</dt><dd>" + esc(TK.fmtDate(first)) + "</dd>" : "") +
          (last ? "<dt>Last message</dt><dd>" + esc(TK.fmtDate(last)) + "</dd>" : "") +
          "<dt>System notices</dt><dd>" + r.system.length + "</dd>" +
          (r.unparsed ? "<dt>Lines not attributed</dt><dd>" + r.unparsed + "</dd>" : "") +
          "</dl></div>";

        if (media) {
          h += '<div class="note danger"><b>' + TK.fmtNum(media) +
            " message(s) reference media that is not in this file</b>" +
            "<p>The conversation was exported <b>without media</b>. Every photograph, voice note " +
            "and document referred to in those messages is missing from the exhibit. Go back and " +
            "obtain the export with media attached, or the originals from the device. An export " +
            "taken this way is incomplete and the defence will say so.</p></div>";
        }
        if (deleted) {
          h += '<div class="note warn"><b>' + TK.fmtNum(deleted) + " message(s) were deleted</b>" +
            "<p>A deletion notice is a positive finding, not a gap: it establishes that a message " +
            "existed at that timestamp and was withdrawn afterwards. The content is not " +
            "recoverable from this file, but it may survive in a device-level extraction or in " +
            "the other party's copy of the conversation.</p></div>";
        }

        h += '<div class="card"><h3>Who spoke</h3><div id="ch-people"></div></div>';

        var linkRows = Object.keys(links).map(function (u) { return { url: u, n: links[u] }; })
          .sort(function (a, b) { return b.n - a.n; });
        if (linkRows.length) {
          h += '<div class="card"><h3>Links shared</h3>' +
            '<p class="small muted">Do not open these from a police machine. Put each through ' +
            "the Text Decoder and IP Address Check first.</p><div id=\"ch-links\"></div></div>";
        }

        var idRows = []
          .concat(Object.keys(numbers).map(function (v) { return { kind: "Mobile number", value: v, n: numbers[v] }; }))
          .concat(Object.keys(upi).map(function (v) { return { kind: "UPI address", value: v, n: upi[v] }; }))
          .sort(function (a, b) { return b.n - a.n; });
        if (idRows.length || amounts.length) {
          h += '<div class="card"><h3>Identifiers and amounts mentioned</h3>' +
            (amounts.length ? '<p class="small">Amounts named in the conversation: ' +
              esc(amounts.slice(0, 14).join(", ")) +
              (amounts.length > 14 ? " and " + (amounts.length - 14) + " more" : "") + "</p>" : "") +
            '<div id="ch-ids"></div></div>';
        }

        var peak = hours.indexOf(Math.max.apply(null, hours));
        var night = hours.slice(0, 6).reduce(function (a, b) { return a + b; }, 0);
        h += '<div class="card"><h3>When the conversation happened</h3>' +
          '<div class="grid c2"><div class="stat"><div class="k">BUSIEST HOUR</div>' +
          '<div class="v">' + (peak < 10 ? "0" + peak : peak) + ":00</div></div>" +
          '<div class="stat"><div class="k">BETWEEN 00:00 AND 06:00</div>' +
          '<div class="v">' + TK.fmtNum(night) + "</div></div></div>" +
          '<p class="small muted" style="margin-top:10px">Timestamps come from the exporting ' +
          "device's clock and its timezone, not from the network. If that device was set wrong, " +
          "every time here is wrong by the same amount.</p></div>";

        $("#ch-out").innerHTML = h;

        TK.table($("#ch-people"), rows, [
          { k: "sender", label: "Participant" },
          { k: "msgs", label: "Messages", cls: "num" },
          { k: "chars", label: "Characters", cls: "num", fmt: function (v) { return TK.fmtNum(v); } },
          { k: "media", label: "Media refs", cls: "num" },
          { k: "deleted", label: "Deleted", cls: "num",
            fmt: function (v) { return v ? '<span class="badge warn">' + v + "</span>" : "0"; } },
          { k: "first", label: "First", fmt: function (v) { return v ? esc(TK.fmtDate(v)) : ""; } },
          { k: "last", label: "Last", fmt: function (v) { return v ? esc(TK.fmtDate(v)) : ""; } }
        ], { filename: "chat-participants", sort: "msgs", dir: -1 });

        if (linkRows.length) {
          TK.table($("#ch-links"), linkRows, [
            { k: "url", label: "Link", cls: "mono", w: "440px" },
            { k: "n", label: "Times sent", cls: "num" }
          ], { filename: "chat-links", sort: "n", dir: -1 });
        }
        if (idRows.length) {
          TK.table($("#ch-ids"), idRows, [
            { k: "kind", label: "Type" },
            { k: "value", label: "Value", cls: "mono" },
            { k: "n", label: "Times mentioned", cls: "num" }
          ], { filename: "chat-identifiers", sort: "n", dir: -1 });
        }
      }
    }
  });

  TK._chatTest = { parse: parse };
})();
