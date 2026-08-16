/* ============================================================
   Cluster: Case handling - "How do I run and document this?"
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* ==========================================================
     Legal Authority Matrix
     ========================================================== */
  TK.reg({
    id: "legal",
    name: "Legal Authority Matrix",
    cluster: "case",
    tier: 1,
    desc: "What each kind of evidence sits under, who can authorise the request, and how long the holder keeps it.",
    lede: "A tool is only half the job. You also need to know what lets you ask. " +
          "This is the reference the rest of the kit points back to.",
    badges: ["BNSS 2023", "BSA 2023", "Needs local vetting"],
    render: function (root) {
      root.innerHTML =
        '<div class="note danger"><b>Training material, not legal advice</b>' +
        "<p>This reflects the BNSS / BSA / BNS regime that replaced the CrPC, Evidence Act and IPC from " +
        "1 July 2024, and the Telecommunications Act 2023 which is replacing the Telegraph Act in phases. " +
        "Provisions, authorised ranks and state standing orders change, and they differ between states. " +
        "<b>Have your prosecution wing vet every row before it goes into a real notice.</b></p></div>" +

        '<div class="card"><h3>Retention, why order of work matters</h3>' +
        '<p class="small muted">Request in the order things disappear, not in the order they occur to you.</p>' +
        '<div class="stack">' + [
          ["Plaza / shop CCTV", 5, "days", "danger"],
          ["NAT translation logs", 25, "often the first telecom record to age out", "danger"],
          ["CDR / IPDR", 55, "~1 year under licence conditions", "warn"],
          ["Platform data after a preservation request", 45, "commonly 180 days", "warn"],
          ["Bank records", 100, "5 years or more under PMLA obligations", "ok"]
        ].map(function (r) {
          return '<div><div class="row tight" style="margin-bottom:4px">' +
            "<b>" + esc(r[0]) + '</b><span class="xs muted">' + esc(r[2]) + "</span></div>" +
            '<div class="bar"><i style="width:' + r[1] + "%;background:var(--" + r[3] + ')"></i></div></div>';
        }).join("") + "</div>" +
        '<p class="small" style="margin-top:14px"><b>Practical order:</b> preservation notices to plazas and ' +
        "platforms on day one (free, fast, stops the clock) → IPDR and NAT logs → CDR and CAF → bank records. " +
        "The bank material will still be there in three years; the CCTV will not be there next week.</p></div>";

      LEGAL.matrix.forEach(function (e) {
        root.innerHTML += '<div class="card"><h3>' + esc(e.what) + "</h3><dl class=\"kv\">" +
          "<dt>Authority</dt><dd>" + esc(e.authority) + "</dd>" +
          "<dt>Who can authorise</dt><dd>" + esc(e.rank) + "</dd>" +
          "<dt>Data holder</dt><dd>" + esc(e.holder) + "</dd>" +
          "<dt>Retention</dt><dd>" + esc(e.retention) + "</dd>" +
          "</dl>" +
          '<div class="note warn" style="margin-top:12px"><b>Caution</b><p>' + esc(e.caution) + "</p></div>" +
          (e.pitfall ? '<div class="note info"><b>Common pitfall</b><p>' + esc(e.pitfall) + "</p></div>" : "") +
          "</div>";
      });

      root.innerHTML += '<div class="row"><button class="btn" id="lm-dl">Export the matrix as CSV</button></div>';
      $("#lm-dl").onclick = function () {
        TK.download("legal-authority-matrix.csv", TK.toCSV(LEGAL.matrix.map(function (e) {
          return {
            Evidence: e.what, Authority: e.authority, "Who can authorise": e.rank,
            "Data holder": e.holder, Retention: e.retention, Caution: e.caution, Pitfall: e.pitfall || ""
          };
        })), "text/csv");
      };
    }
  });

  /* ==========================================================
     Requisition Builder
     ========================================================== */
  TK.reg({
    id: "templates",
    name: "Requisition Builder",
    cluster: "case",
    tier: 1,
    desc: "Generate preservation notices and BNSS s.94 requisitions with the right provisions and the right asks.",
    lede: "Most requests come back useless. Either they asked for the wrong thing, or they left out " +
          "the detail the holder needs to find it. These drafts ask for the right things.",
    badges: ["BNSS s.94", "BSA s.63(4)"],
    legal: {
      authority: "The template states the provision it relies on. Confirm the authorised rank in your " +
                 "state's standing order before signing.",
      caution: "A template is a starting point. Read every line against your facts, a notice that asks " +
               "for something you have no authority to seek is worse than no notice at all."
    },
    render: function (root) {
      var T = {
        preserve_platform: {
          name: "Preservation notice, online platform / intermediary",
          note: "Free, fast, and it stops the retention clock. Send it on day one, before you know what " +
                "you want. Production comes later.",
          body: function (v) {
            return "To,\n    The Nodal Officer / Grievance Officer,\n    " + v.holder + "\n\n" +
"Subject: Request for preservation of records under rule 3(1)(j) of the Information Technology\n" +
"         (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, " + v.fir + "\n\n" +
"Sir/Madam,\n\n" +
"    A case vide " + v.fir + " under " + v.sections + " is under investigation by the undersigned.\n\n" +
"    You are requested to PRESERVE, and not to delete, alter or permit the deletion of, all\n" +
"records relating to the following account(s)/identifier(s), pending a formal requisition:\n\n" +
v.subjects.map(function (s) { return "        " + s; }).join("\n") + "\n\n" +
"    The preservation is requested in respect of the period " + v.from + " to " + v.to + ",\n" +
"and should extend to:\n\n" +
"    (a) basic subscriber information, registration details and registered contact points;\n" +
"    (b) IP address logs for account creation, and for all logins, with source ports and\n" +
"        timestamps stated in UTC;\n" +
"    (c) device identifiers and application version associated with the account;\n" +
"    (d) content, media and message metadata, to the extent retained; and\n" +
"    (e) details of any payment instrument linked to the account.\n\n" +
"    This is a preservation request only. A requisition under section 94 of the Bharatiya\n" +
"Nagarik Suraksha Sanhita, 2023 (or, where applicable, a request through the appropriate\n" +
"mutual legal assistance channel) will follow.\n\n" +
"    Kindly confirm preservation in writing within 48 hours, quoting your internal reference.\n";
          }
        },
        bnss94_generic: {
          name: "BNSS s.94 requisition, general",
          note: "The workhorse. The 'thing' must be described well enough that the recipient can find it " +
                "without guessing.",
          body: function (v) {
            return "To,\n    " + v.holder + "\n\n" +
"Subject: Requisition under section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023, " + v.fir + "\n\n" +
"Sir/Madam,\n\n" +
"    Whereas a case vide " + v.fir + " under " + v.sections + " is under investigation by the\n" +
"undersigned, and whereas the documents and things described below are necessary and desirable\n" +
"for the purposes of the said investigation;\n\n" +
"    Now therefore, in exercise of the powers conferred by section 94 of the Bharatiya Nagarik\n" +
"Suraksha Sanhita, 2023, you are required to produce the following:\n\n" +
v.subjects.map(function (s, i) { return "    " + (i + 1) + ". " + s; }).join("\n") + "\n\n" +
"    in respect of the period " + v.from + " to " + v.to + ".\n\n" +
"    You are further required to furnish, along with the above, a certificate under section\n" +
"63(4) of the Bharatiya Sakshya Adhiniyam, 2023 in the form prescribed in the Schedule thereto,\n" +
"in respect of every electronic record produced, duly signed by the person in charge of the\n" +
"relevant device and by an expert.\n\n" +
"    The material is to be furnished within " + v.days + " days. This communication and its\n" +
"contents are not to be disclosed to the person(s) to whom the records relate.\n";
          }
        },
        cdr: {
          name: "CDR requisition, access provider",
          note: "Ask for the site address and coordinates with the CDR. Getting the cell IDs and then " +
                "requisitioning the site list separately wastes a month.",
          body: function (v) {
            return "To,\n    The Nodal Officer (Law Enforcement),\n    " + v.holder + "\n\n" +
"Subject: Requisition under section 94 BNSS, 2023, call detail records in " + v.fir + "\n\n" +
"    A case vide " + v.fir + " under " + v.sections + " is under investigation. You are required\n" +
"to furnish, for the period " + v.from + " to " + v.to + ", in respect of:\n\n" +
v.subjects.map(function (s) { return "        " + s; }).join("\n") + "\n\n" +
"    1. Complete call detail records, including for each event: date and time, duration,\n" +
"       calling and called party numbers, call type, IMEI, IMSI, SMSC where applicable, and\n" +
"       the first and last cell global identity.\n\n" +
"    2. The cell site master data for every cell identity appearing in the above records,\n" +
"       giving site name, complete postal address, latitude, longitude, azimuth of the\n" +
"       serving sector and antenna height.\n\n" +
"    3. The Customer Acquisition Form and all KYC documents relied upon at activation, the\n" +
"       date of first activation, and the Point of Sale / retailer code with the retailer's\n" +
"       own KYC and address.\n\n" +
"    4. All other connections issued against the same identity document, across your network.\n\n" +
"    5. Porting history, if any, with donor and recipient operator and date of porting.\n\n" +
"    6. A certificate under section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 in the\n" +
"       prescribed form, in respect of every electronic record produced.\n\n" +
"    Records are sought in a machine-readable format (CSV or XLSX), not as a scanned image.\n" +
"    Kindly furnish within " + v.days + " days.\n\n" +
"    [Countersigned / approved by: ______________________ , rank ______________ ]\n";
          }
        },
        ipdr: {
          name: "IPDR / IP resolution requisition",
          note: "The three things without which this comes back nil: public IP, source port, and a " +
                "second-accurate timestamp with its timezone stated.",
          body: function (v) {
            return "To,\n    The Nodal Officer (Law Enforcement),\n    " + v.holder + "\n\n" +
"Subject: Requisition under section 94 BNSS, 2023, subscriber identification from IP session\n" +
"         records in " + v.fir + "\n\n" +
"    A case vide " + v.fir + " under " + v.sections + " is under investigation. You are required\n" +
"to identify the subscriber(s) associated with the following internet session(s) and to furnish\n" +
"the details set out below:\n\n" +
v.subjects.map(function (s) { return "        " + s; }).join("\n") + "\n\n" +
"    [Each entry states the public IP address, the source port, and the date and time.\n" +
"     TIMEZONE OF THE ABOVE TIMESTAMPS: " + (v.tz || "IST") + ". Please confirm the timezone of\n" +
"     your own records in your reply and state any conversion applied.]\n\n" +
"    1. The MSISDN, IMSI and IMEI associated with each session.\n\n" +
"    2. The private/internal IP address allocated and the complete network address translation\n" +
"       record, including the translated port range and the binding start and end times.\n\n" +
"    3. The Customer Acquisition Form and KYC documents for each subscriber so identified.\n\n" +
"    4. The cell global identity serving each session, with site address and coordinates.\n\n" +
"    5. The Access Point Name and the volume of data transferred in each session.\n\n" +
"    6. A certificate under section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023.\n\n" +
"    NAT translation records age out faster than other categories. This requisition is urgent\n" +
"    and the material should be preserved immediately on receipt of this notice, pending\n" +
"    production within " + v.days + " days.\n";
          }
        },
        bank: {
          name: "Bank requisition, account, KYC and trail",
          note: "Ask for the Bankers' Books Evidence Act s.2A certificate in the same notice, plus the " +
                "login IP and device. Most officers ask only for the statement and lose the digital side.",
          body: function (v) {
            return "To,\n    The Nodal Officer,\n    " + v.holder + "\n\n" +
"Subject: Requisition under section 94 BNSS, 2023, account records in " + v.fir + "\n\n" +
"    A case vide " + v.fir + " under " + v.sections + " is under investigation. You are required\n" +
"to furnish, in respect of the account(s)/identifier(s) below, for the period " + v.from + "\n" +
"to " + v.to + ":\n\n" +
v.subjects.map(function (s) { return "        " + s; }).join("\n") + "\n\n" +
"    1. Complete statement of account, in machine-readable format, showing for each entry the\n" +
"       date and time, narration, UTR / RRN / reference number, amount, and running balance.\n\n" +
"    2. Account opening form with all KYC documents, photograph and specimen signature, the\n" +
"       branch and the officer who opened the account, and the mode of opening (branch,\n" +
"       video-KYC or digital).\n\n" +
"    3. Registered mobile number, e-mail address, and every change made to them with dates.\n\n" +
"    4. For every internet or mobile banking session in the said period: the IP address,\n" +
"       source port, device identifier and timestamp.\n\n" +
"    5. Details of all linked accounts, cards, UPI handles and the beneficiaries registered.\n\n" +
"    6. For each outward transfer, the beneficiary name, account number, IFSC and bank.\n\n" +
"    7. Certificate under section 2A of the Bankers' Books Evidence Act, 1891 in respect of\n" +
"       the printouts furnished, and a certificate under section 63(4) of the Bharatiya\n" +
"       Sakshya Adhiniyam, 2023 in respect of every electronic record.\n\n" +
"    Kindly furnish within " + v.days + " days. Where funds are traceable and unutilised, the\n" +
"    account may be placed on hold pending orders, and this office informed forthwith.\n";
          }
        }
      };

      root.innerHTML =
        '<div class="card"><div class="field"><label class="lbl">Template</label>' +
        '<select id="t-kind">' + Object.keys(T).map(function (k) {
          return '<option value="' + k + '">' + esc(T[k].name) + "</option>";
        }).join("") + "</select></div>" +
        '<div id="t-note"></div>' +
        '<div class="grid c2">' +
          '<div class="field"><label class="lbl">FIR / case number</label><input type="text" id="t-fir" placeholder="FIR 0123/2026, PS Cyber Crime"></div>' +
          '<div class="field"><label class="lbl">Sections</label><input type="text" id="t-sec" placeholder="BNS s.318(4), 319(2); IT Act s.66C, 66D"></div>' +
        "</div>" +
        '<div class="field"><label class="lbl">Addressed to (holder)</label><input type="text" id="t-holder" placeholder="The Nodal Officer, [Bank / TSP / Platform], [address]"></div>' +
        '<div class="field"><label class="lbl">Subjects, one per line (numbers, accounts, IP+port+time, account IDs)</label>' +
        '<textarea id="t-subj" class="mono" placeholder="+91-9876543210&#10;+91-9876543211"></textarea></div>' +
        '<div class="grid c4">' +
          '<div class="field"><label class="lbl">Period from</label><input type="text" id="t-from" placeholder="01-01-2026"></div>' +
          '<div class="field"><label class="lbl">Period to</label><input type="text" id="t-to" placeholder="31-03-2026"></div>' +
          '<div class="field"><label class="lbl">Reply within (days)</label><input type="number" id="t-days" value="7"></div>' +
          '<div class="field"><label class="lbl">Timezone of your timestamps</label><select id="t-tz"><option>IST</option><option>UTC</option></select></div>' +
        "</div>" +
        '<button class="btn primary" id="t-go">Generate</button>' +
        '<div id="t-out" style="margin-top:16px"></div></div>';

      function note() {
        var t = T[$("#t-kind").value];
        $("#t-note").innerHTML = '<div class="note info"><b>' + esc(t.name) + "</b><p>" + esc(t.note) + "</p></div>";
      }
      $("#t-kind").onchange = note;
      note();

      $("#t-go").onclick = function () {
        var t = T[$("#t-kind").value];
        var subjects = $("#t-subj").value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!subjects.length) subjects = ["[subject identifier(s)]"];
        var v = {
          fir: $("#t-fir").value || "[FIR No. ____ / 20__]",
          sections: $("#t-sec").value || "[sections]",
          holder: $("#t-holder").value || "[name and address of the data holder]",
          subjects: subjects,
          from: $("#t-from").value || "[DD-MM-YYYY]",
          to: $("#t-to").value || "[DD-MM-YYYY]",
          days: $("#t-days").value || "7",
          tz: $("#t-tz").value
        };
        var body = t.body(v) +
"\n                                                        Yours faithfully,\n\n" +
"                                                        [Name, rank]\n" +
"                                                        Investigating Officer\n" +
"                                                        [Police Station, District]\n" +
"                                                        [Contact number, official e-mail]\n\n" +
"Place : ____________            Date : ____________\n";

        $("#t-out").innerHTML = '<div class="copyable"><pre class="out doc">' + esc(body) +
          '</pre><button class="btn sm copybtn" data-copy="prev">Copy</button></div>' +
          '<div class="row" style="margin-top:10px"><button class="btn" id="t-dl">Download .txt</button>' +
          '<button class="btn ghost" id="t-print">Print</button></div>' +
          '<div class="note warn" style="margin-top:12px"><b>Before you sign</b><p>Check the authorised rank ' +
          "for this category in your state's standing order, confirm the provision is current, and make sure " +
          "every ask is within what that provision permits.</p></div>";

        $("#t-dl").onclick = function () {
          TK.download("requisition-" + $("#t-kind").value + ".txt", body, "text/plain");
        };
        $("#t-print").onclick = function () { window.print(); };
      };
    }
  });

  /* ==========================================================
     Nodal Officer Directory
     ========================================================== */
  TK.reg({
    id: "nodal",
    name: "Nodal Officer Directory",
    cluster: "case",
    tier: 1,
    desc: "Searchable index of bank, TSP and platform nodal officers, built from the published list you import.",
    lede: "The nodal officer list is published openly on cybercrime.gov.in and copied by state police " +
          "sites. But it sits in a PDF that nobody can search under time pressure. Import it once and it " +
          "becomes usable.",
    wide: true,
    legal: {
      authority: "The directory itself is published. What you send the officer needs its own authority.",
      caution: "The list goes stale fast, officers move. If a notice bounces, get the current contact " +
               "from the entity's own grievance page before assuming the entity is unresponsive."
    },
    render: function (root) {
      root.innerHTML =
        '<div class="note info"><b>Where these contacts come from</b>' +
        "<p>Compiled from the nodal officer export generated <b>16-08-2026</b>, plus the State/UT cyber-cell " +
        "and grievance officers published on cybercrime.gov.in. Addresses are present on only about a fifth " +
        "of the rows because the source does not carry them for everyone, a blank means the source is blank, " +
        "not that parsing failed. Officers move often, so confirm a contact before relying on it.</p></div>" +

        '<div class="card"><div class="row" style="justify-content:space-between">' +
          '<div class="searchbox grow" style="max-width:340px">' +
            '<input type="search" id="nod-q" placeholder="Bank, app, exchange or officer name…">' +
          "</div><span id=\"nod-stat\" class=\"row tight xs muted\"></span></div>" +
          '<div class="row" id="nod-cats" style="margin-top:14px"></div></div>' +
        '<div id="nod-out"></div>' +

        '<div class="card"><h3>Import a newer or local list</h3>' +
        '<p class="small muted">Merged with the bundled set for this session. Any columns containing ' +
        "entity, name, designation, email, phone or address are picked up.</p>" +
        '<div class="drop" id="nod-drop"><div class="big"></div>' +
        "<div>Drop the CSV, or <b>browse</b></div></div>" +
        '<div class="row" style="margin-top:12px"><button class="btn ghost sm" id="nod-tmpl">Blank template</button></div></div>';

      TK.dropzone($("#nod-drop"), function (f) { TK.readText(f, importCsv); }, { accept: ".csv,.tsv,.txt" });

      $("#nod-tmpl").onclick = function () {
        TK.download("nodal-officers-template.csv",
          "entity,category,officer_name,designation,email,phone,address\n" +
          "Example Bank Ltd,Bank,Nodal Officer (LEA),nodal@example.com,\n", "text/csv");
      };

      var ROWS = [], cat = "", q = "";

      function importCsv(text) {
        var ps = TK.parseSmart(text, TK.SPEC.nodalimp);
        var p = ps.p, m = ps.sm.map;
        if (!m.e) { TK.toast("No entity column found", "danger"); return; }
        var add = p.rows.map(function (r) {
          return {
            e: String(r[m.e] || "").trim(),
            c: m.c ? String(r[m.c] || "").trim() || "Imported" : "Imported",
            o: m.o ? String(r[m.o] || "").trim() : "",
            d: m.d ? String(r[m.d] || "").trim() : "",
            m: m.m ? String(r[m.m] || "").trim() : "",
            p: m.p ? String(r[m.p] || "").trim() : "",
            imported: true
          };
        }).filter(function (r) { return r.e; });
        ROWS = ROWS.concat(add);
        TK.toast(add.length + " rows imported", "ok");
        draw();
      }

      function draw() {
        var cats = {};
        ROWS.forEach(function (r) { cats[r.c] = (cats[r.c] || 0) + 1; });
        var order = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; });

        $("#nod-stat").innerHTML = '<span class="badge ok">' + TK.fmtNum(ROWS.length) +
          " officers · " + TK.fmtNum(new Set(ROWS.map(function (r) { return r.e; })).size) + " entities</span>";

        $("#nod-cats").innerHTML =
          '<button class="btn sm' + (cat ? "" : " primary") + '" data-c="">All (' + ROWS.length + ")</button>" +
          order.map(function (k) {
            return '<button class="btn sm' + (cat === k ? " primary" : "") + '" data-c="' + esc(k) + '">' +
              esc(k) + " (" + cats[k] + ")</button>";
          }).join("");

        TK.$$("#nod-cats [data-c]").forEach(function (b) {
          b.onclick = function () { cat = b.dataset.c; draw(); };
        });

        // Entity names arrive with word breaks restored from a wrapped PDF
        // column, so "PhonePe" may read "Phone Pe". Match with spaces and
        // punctuation stripped from both sides so either spelling finds it.
        var qz = q.replace(/[^a-z0-9@.]/g, "");
        var view = ROWS.filter(function (r) {
          if (cat && r.c !== cat) return false;
          if (!q) return true;
          var hay = (r.e + " " + r.o + " " + r.m + " " + r.m2 + " " + r.d + " " +
                     r.p + " " + r.a + " " + r.w).toLowerCase();
          if (hay.indexOf(q) !== -1) return true;
          return qz && hay.replace(/[^a-z0-9@.]/g, "").indexOf(qz) !== -1;
        });

        $("#nod-out").innerHTML =
          '<div class="grid c4" style="margin-bottom:16px">' +
            TK.stat(TK.fmtNum(view.length), "Officers shown", "accent") +
            TK.stat(TK.fmtNum(new Set(view.map(function (r) { return r.e; })).size), "Entities") +
            TK.stat(TK.fmtNum(view.filter(function (r) { return r.m; }).length), "With e-mail", "ok") +
            TK.stat(TK.fmtNum(view.filter(function (r) { return r.p; }).length), "With phone", "ok") +
          "</div>" +
          '<div class="card"><h3>' + esc(cat || "All nodal officers") + "</h3><div id=\"nod-tbl\"></div></div>";

        TK.table($("#nod-tbl"), view, [
          { k: "e", label: "Entity", w: "210px" },
          { k: "c", label: "Category", fmt: function (v) {
              var cls = /Crypto/.test(v) ? "info"
                : /Wallet|TPAP|Credit/.test(v) ? "accent"
                : /State/.test(v) ? "warn"
                : /Bank/.test(v) ? "ok" : "";
              return '<span class="badge ' + cls + '">' + esc(v) + "</span>"; } },
          { k: "o", label: "Officer" },
          { k: "d", label: "Designation", w: "150px" },
          { k: "m", label: "E-mail", cls: "mono small", fmt: function (v, r) {
              var extra = r.m2 ? '<div class="xs muted">' + esc(r.m2) + "</div>" : "";
              return (v ? '<a href="mailto:' + esc(v) + '">' + esc(v) + "</a>" : "") + extra; } },
          { k: "p", label: "Phone", cls: "mono", fmt: function (v) {
              return v ? esc(v) : '<span class="xs muted">not in source</span>'; } },
          { k: "a", label: "Address", w: "190px", fmt: function (v) {
              return v ? esc(v) : '<span class="xs muted">not in source</span>'; } },
          { k: "w", label: "Website", cls: "small", fmt: function (v) {
              return v ? '<a href="' + esc(/^https?:/.test(v) ? v : "https://" + v) +
                '" target="_blank" rel="noopener">' + esc(v.slice(0, 30)) + "</a>" : ""; } }
        ], { filename: "nodal-officers", pageSize: 200,
             rowClass: function (r) { return r.imported ? "hi" : ""; } });
      }

      $("#nod-q").addEventListener("input", function (e) {
        q = e.target.value.trim().toLowerCase(); draw();
      });

      $("#nod-stat").innerHTML = '<span class="spinner"></span>';
      TK.loadData("nodal.js", "NODAL_DB", function (d) {
        ROWS = (d && d.rows) ? d.rows.slice() : [];
        draw();
      });
    }
  });

  /* ==========================================================
     Case Timeline Builder
     ========================================================== */
  TK.reg({
    id: "timeline",
    name: "Case Timeline Builder",
    cluster: "case",
    tier: 2,
    desc: "Merge events from CDR, IPDR, bank statements and your own notes into one chronology.",
    lede: "The story in a chargesheet is a chronology. Building it by hand across four spreadsheets is " +
          "where mistakes creep in. A wrong timezone here, a swapped date there.",
    wide: true,
    legal: {
      caution: "Every row in a timeline must be traceable to a source you can prove. Keep the source " +
               "column populated, an event you cannot attribute to a produced record does not belong " +
               "in a chargesheet.",
      evidence: "State the timezone once, at the top, and convert everything into it. Mixed-timezone " +
                "chronologies are a standard defence attack."
    },
    render: function (root) {
      var events = [];
      root.innerHTML =
        '<div class="card"><h3>Add an event</h3>' +
        '<div class="grid c2">' +
          '<div class="field"><label class="lbl">When</label><input type="text" id="tl-when" class="mono" placeholder="14-03-2026 21:40:15"></div>' +
          '<div class="field"><label class="lbl">Source</label><input type="text" id="tl-src" placeholder="CDR of +91-98765xxxxx, produced 02-04-2026"></div>' +
        "</div>" +
        '<div class="field"><label class="lbl">What happened</label><input type="text" id="tl-what" placeholder="Call from +91-98765xxxxx to +91-90123xxxxx, 142s, cell BLR-1149"></div>' +
        '<div class="row"><div class="field" style="margin:0"><label class="lbl">Significance</label>' +
        '<select id="tl-kind"><option value="">Neutral</option><option value="warn">Notable</option>' +
        '<option value="danger">Key event</option></select></div>' +
        '<button class="btn primary" id="tl-add" style="align-self:flex-end">Add</button>' +
        '' +
        '<button class="btn ghost" id="tl-clear" style="align-self:flex-end">Clear all</button></div></div>' +

        '<div class="card"><h3>Import events from a file</h3>' +
        '<p class="small muted">Any CSV with a date column. Pick which columns become the description.</p>' +
        '<div class="drop" id="tl-drop"><div class="big">↓</div><div>Drop a CSV, or <b>browse</b></div></div></div>' +

        '<div id="tl-out"></div>';

      $("#tl-add").onclick = function () {
        var w = TK.parseDate($("#tl-when").value);
        if (!w) { TK.toast("Could not parse that date", "danger"); return; }
        events.push({ dt: w, what: $("#tl-what").value, src: $("#tl-src").value, kind: $("#tl-kind").value });
        $("#tl-what").value = "";
        draw();
      };
      $("#tl-clear").onclick = function () { events = []; draw(); };

      TK.dropzone($("#tl-drop"), function (f) {
        TK.readText(f, function (txt) {
          var p = TK.parseTable(txt);
          var dcol = p.headers.filter(function (hh) { return /date|time|dt|when/i.test(hh); })[0];
          if (!dcol) { TK.toast("No date column found", "danger"); return; }
          var added = 0;
          p.rows.forEach(function (r) {
            var d = TK.parseDate(r[dcol]);
            if (!d) return;
            var desc = p.headers.filter(function (hh) { return hh !== dcol && r[hh]; })
              .slice(0, 4).map(function (hh) { return hh + ": " + r[hh]; }).join(" · ");
            events.push({ dt: d, what: desc, src: f.name, kind: "" });
            added++;
          });
          TK.toast(added + " events imported", "ok");
          draw();
        });
      }, { accept: ".csv,.tsv,.txt" });

      function draw() {
        if (!events.length) { $("#tl-out").innerHTML = ""; return; }
        events.sort(function (a, b) { return a.dt - b.dt; });
        var span = (events[events.length - 1].dt - events[0].dt) / 3600000;

        $("#tl-out").innerHTML =
          '<div class="grid c4" style="margin-bottom:16px">' +
            TK.stat(events.length, "Events") +
            TK.stat(span < 48 ? span.toFixed(1) + " h" : (span / 24).toFixed(1) + " d", "Span", "accent") +
            TK.stat(events.filter(function (e) { return e.kind === "danger"; }).length, "Key events", "danger") +
            TK.stat(new Set(events.map(function (e) { return e.src; })).size, "Distinct sources") +
          "</div>" +
          '<div class="card"><h3>Chronology</h3><div class="rail">' +
          events.map(function (e, i) {
            var gap = i > 0 ? (e.dt - events[i - 1].dt) / 60000 : null;
            return '<div class="rail-item ' + (e.kind || "") + '">' +
              '<div class="row tight"><b class="mono">' + esc(TK.fmtDate(e.dt)) + "</b>" +
              (gap !== null && gap < 60 ? '<span class="badge warn">+' +
                (gap < 1 ? Math.round(gap * 60) + "s" : Math.round(gap) + "m") + "</span>" : "") +
              (e.kind === "danger" ? '<span class="badge danger">key</span>' : "") + "</div>" +
              '<div style="margin-top:3px">' + esc(e.what) + "</div>" +
              (e.src ? '<div class="xs muted" style="margin-top:2px">source: ' + esc(e.src) + "</div>" : "") +
              "</div>";
          }).join("") + "</div>" +
          '<div class="row" style="margin-top:14px"><button class="btn" id="tl-csv">Export CSV</button>' +
          '<button class="btn" id="tl-txt">Export as narrative</button>' +
          '<button class="btn ghost" id="tl-print">Print</button></div></div>';

        $("#tl-csv").onclick = function () {
          TK.download("case-timeline.csv", TK.toCSV(events.map(function (e) {
            return { "Date and time": TK.fmtDate(e.dt), Event: e.what, Source: e.src,
                     Significance: e.kind === "danger" ? "Key" : e.kind === "warn" ? "Notable" : "" };
          })), "text/csv");
        };
        $("#tl-txt").onclick = function () {
          TK.download("case-timeline.txt",
            "CHRONOLOGY OF EVENTS\n" +
            "(all times stated in IST, confirm each source's native timezone)\n" +
            "=".repeat(72) + "\n\n" +
            events.map(function (e) {
              return TK.fmtDate(e.dt) + "\n    " + e.what + "\n    [source: " + (e.src || "NOT RECORDED") + "]\n";
            }).join("\n"), "text/plain");
        };
        $("#tl-print").onclick = function () { window.print(); };
      }
    }
  });
})();
