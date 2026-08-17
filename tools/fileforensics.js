/* ============================================================
   File-level forensics that run on the officer's own machine.

     Photo Metadata Reader - pulls EXIF out of a photograph: the
       camera, the body serial number, the original date and the GPS
       fix. The absence of EXIF is itself a finding, because every
       messaging platform strips it.
     File Type Checker     - reads the first bytes of a file and says
       what it actually is, regardless of the extension. Catches a
       .exe renamed to .jpg, and identifies phone-extraction databases.

   Both read the file with FileReader inside the browser. Nothing is
   uploaded anywhere, which is the only way an exhibit should be
   handled on an untrusted network.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  function readBuf(file, cb) {
    var r = new FileReader();
    r.onload = function () { cb(new DataView(r.result), new Uint8Array(r.result)); };
    r.onerror = function () { TK.toast("Could not read that file", "danger"); };
    r.readAsArrayBuffer(file);
  }

  /* ==========================================================
     1. Photo Metadata Reader
     ========================================================== */

  var IFD0 = {
    0x010F: "Make", 0x0110: "Model", 0x0112: "Orientation",
    0x0131: "Software", 0x0132: "DateTime", 0x013B: "Artist",
    0x8298: "Copyright", 0x011A: "XResolution", 0x011B: "YResolution"
  };
  var EXIF = {
    0x9003: "DateTimeOriginal", 0x9004: "DateTimeDigitized",
    0x829A: "ExposureTime", 0x829D: "FNumber", 0x8827: "ISO",
    0x920A: "FocalLength", 0xA002: "PixelXDimension", 0xA003: "PixelYDimension",
    0xA430: "CameraOwnerName", 0xA431: "BodySerialNumber",
    0xA433: "LensMake", 0xA434: "LensModel", 0xA435: "LensSerialNumber",
    0x9291: "SubSecTimeOriginal", 0x882A: "OffsetTime", 0x9010: "OffsetTimeOriginal"
  };
  var GPS = {
    0x0001: "GPSLatitudeRef", 0x0002: "GPSLatitude",
    0x0003: "GPSLongitudeRef", 0x0004: "GPSLongitude",
    0x0005: "GPSAltitudeRef", 0x0006: "GPSAltitude",
    0x0007: "GPSTimeStamp", 0x001D: "GPSDateStamp",
    0x0012: "GPSMapDatum", 0x001B: "GPSProcessingMethod"
  };

  var TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

  function readIFD(dv, tiff, off, little, names, out) {
    if (off + 2 > dv.byteLength) return 0;
    var n = dv.getUint16(off, little), next = 0;
    for (var i = 0; i < n; i++) {
      var e = off + 2 + i * 12;
      if (e + 12 > dv.byteLength) break;
      var tag = dv.getUint16(e, little), type = dv.getUint16(e + 2, little);
      var count = dv.getUint32(e + 4, little), size = (TYPE_SIZE[type] || 0) * count;
      if (!size) continue;
      var vOff = size > 4 ? tiff + dv.getUint32(e + 8, little) : e + 8;
      if (vOff + size > dv.byteLength) continue;

      /* pointers to the nested directories */
      if (tag === 0x8769) { out._exifPtr = tiff + dv.getUint32(e + 8, little); continue; }
      if (tag === 0x8825) { out._gpsPtr = tiff + dv.getUint32(e + 8, little); continue; }

      var name = names[tag];
      if (!name) continue;

      if (type === 2) {                                  // ASCII
        var s = "";
        for (var c = 0; c < count; c++) {
          var ch = dv.getUint8(vOff + c);
          if (!ch) break;
          s += String.fromCharCode(ch);
        }
        if (s.trim()) out[name] = s.trim();
      } else if (type === 5 || type === 10) {            // RATIONAL
        var vals = [];
        for (var r = 0; r < count; r++) {
          var num = type === 5 ? dv.getUint32(vOff + r * 8, little) : dv.getInt32(vOff + r * 8, little);
          var den = type === 5 ? dv.getUint32(vOff + r * 8 + 4, little) : dv.getInt32(vOff + r * 8 + 4, little);
          vals.push(den ? num / den : 0);
        }
        out[name] = count === 1 ? vals[0] : vals;
      } else if (type === 3) {
        out[name] = count === 1 ? dv.getUint16(vOff, little)
          : Array.apply(null, Array(count)).map(function (_, k) { return dv.getUint16(vOff + k * 2, little); });
      } else if (type === 4) {
        out[name] = count === 1 ? dv.getUint32(vOff, little)
          : Array.apply(null, Array(count)).map(function (_, k) { return dv.getUint32(vOff + k * 4, little); });
      }
    }
    var nOff = off + 2 + n * 12;
    if (nOff + 4 <= dv.byteLength) next = dv.getUint32(nOff, little);
    return next;
  }

  function parseExif(dv) {
    if (dv.byteLength < 4) return null;
    /* JPEG only. HEIC and modern RAW use a different container. */
    if (dv.getUint16(0) !== 0xFFD8) return { notJpeg: true };

    var p = 2, app1 = -1;
    while (p + 4 < dv.byteLength) {
      if (dv.getUint8(p) !== 0xFF) break;
      var marker = dv.getUint8(p + 1);
      if (marker === 0xDA || marker === 0xD9) break;          // start of scan
      var len = dv.getUint16(p + 2);
      if (marker === 0xE1 && p + 10 < dv.byteLength) {
        var sig = "";
        for (var i = 0; i < 4; i++) sig += String.fromCharCode(dv.getUint8(p + 4 + i));
        if (sig === "Exif") { app1 = p + 10; break; }
      }
      p += 2 + len;
    }
    if (app1 < 0) return { none: true };

    var bo = dv.getUint16(app1);
    if (bo !== 0x4949 && bo !== 0x4D4D) return { none: true };
    var little = bo === 0x4949;
    if (dv.getUint16(app1 + 2, little) !== 0x002A) return { none: true };

    var out = {};
    readIFD(dv, app1, app1 + dv.getUint32(app1 + 4, little), little, IFD0, out);
    if (out._exifPtr) readIFD(dv, app1, out._exifPtr, little, EXIF, out);
    if (out._gpsPtr) readIFD(dv, app1, out._gpsPtr, little, GPS, out);
    delete out._exifPtr; delete out._gpsPtr;
    return Object.keys(out).length ? out : { none: true };
  }

  function dms(v, ref) {
    if (!v || v.length !== 3) return null;
    var d = v[0] + v[1] / 60 + v[2] / 3600;
    if (ref === "S" || ref === "W") d = -d;
    return d;
  }

  TK.reg({
    id: "photometa",
    name: "Photo Metadata Reader",
    cluster: "movement",
    tier: 1,
    desc: "Read the camera, date and GPS location hidden inside a photograph.",
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="drop" id="pm-drop"><div class="big"></div>' +
          "<div>Drop a photo, or <b>browse</b></div>" +
          '<div class="xs muted" style="margin-top:6px">JPEG from a camera or phone. ' +
          "The file is read on this computer and is not uploaded.</div></div>" +
        "</div><div id=\"pm-out\"></div>";

      TK.dropzone($("#pm-drop"), function (f) {
        readBuf(f, function (dv) { show(f, parseExif(dv)); });
      }, { accept: "image/jpeg,image/*" });

      function show(file, x) {
        var head = '<div class="card"><h3>' + esc(file.name) + "</h3>" +
          '<p class="small muted">' + TK.fmtBytes(file.size) + ", last modified " +
          esc(new Date(file.lastModified).toLocaleString()) + ". The modified date is a property " +
          "of this copy of the file, not of the photograph.</p>";

        if (x && x.notJpeg) {
          $("#pm-out").innerHTML = head +
            '<div class="note warn">This is not a JPEG. HEIC (the iPhone default), PNG and ' +
            "camera RAW store metadata in other containers that this reader does not open. " +
            "Ask for the original JPEG, or export one.</div></div>";
          return;
        }

        if (!x || x.none) {
          $("#pm-out").innerHTML = head +
            '<div class="note warn"><b>No metadata in this file, which is itself a finding</b>' +
            "<p>WhatsApp, Telegram, Instagram, Facebook and most other platforms strip all " +
            "metadata when an image is sent. A photograph with nothing inside it almost " +
            "certainly reached you through one of them, not from the camera that took it.</p>" +
            "<p><b>What to do:</b> ask the complainant for the file straight off the device, " +
            "sent as a document or over a cable, not forwarded through a chat app. Then " +
            "requisition the original from the device.</p></div></div>";
          return;
        }

        var rows = [];
        function add(k, v) { if (v !== undefined && v !== null && v !== "") rows.push([k, v]); }

        add("Camera make", x.Make);
        add("Camera model", x.Model);
        add("Body serial number", x.BodySerialNumber);
        add("Owner name recorded in camera", x.CameraOwnerName);
        add("Lens", [x.LensMake, x.LensModel].filter(Boolean).join(" "));
        add("Lens serial number", x.LensSerialNumber);
        add("Software", x.Software);
        add("Artist / author field", x.Artist);
        add("Taken (camera clock)", x.DateTimeOriginal);
        add("Digitised", x.DateTimeDigitized !== x.DateTimeOriginal ? x.DateTimeDigitized : null);
        add("File last edited", x.DateTime !== x.DateTimeOriginal ? x.DateTime : null);
        add("Timezone recorded", x.OffsetTimeOriginal || x.OffsetTime);
        add("Dimensions", x.PixelXDimension && x.PixelYDimension
          ? x.PixelXDimension + " x " + x.PixelYDimension : null);
        add("ISO", x.ISO);
        add("Focal length", x.FocalLength ? x.FocalLength + " mm" : null);

        var lat = dms(x.GPSLatitude, x.GPSLatitudeRef);
        var lon = dms(x.GPSLongitude, x.GPSLongitudeRef);

        var h = head + '<dl class="kv">' + rows.map(function (p) {
          return "<dt>" + esc(p[0]) + "</dt><dd>" + esc(String(p[1])) + "</dd>";
        }).join("") + "</dl>";

        if (lat !== null && lon !== null) {
          var coord = lat.toFixed(6) + ", " + lon.toFixed(6);
          h += '<div class="note ok" style="margin-top:14px"><b>This photograph carries a GPS fix</b>' +
            '<dl class="kv" style="margin-top:6px">' +
            "<dt>Coordinates</dt><dd class=\"mono\">" + esc(coord) + "</dd>" +
            (x.GPSAltitude ? "<dt>Altitude</dt><dd>" + (+x.GPSAltitude).toFixed(1) + " m" +
              (x.GPSAltitudeRef === 1 ? " below sea level" : "") + "</dd>" : "") +
            (x.GPSDateStamp ? "<dt>GPS date (UTC)</dt><dd>" + esc(x.GPSDateStamp) + "</dd>" : "") +
            (x.GPSTimeStamp && x.GPSTimeStamp.length === 3
              ? "<dt>GPS time (UTC)</dt><dd>" + x.GPSTimeStamp.map(function (n) {
                  return String(Math.floor(n)).padStart(2, "0"); }).join(":") + "</dd>" : "") +
            "</dl>" +
            '<p style="margin-top:8px">The GPS clock is set by satellite and is in UTC, so it is ' +
            "independent of the camera clock. Where the two disagree, the GPS time is the " +
            "reliable one. Add 5:30 for IST.</p>" +
            '<div class="row" style="margin-top:10px">' +
            '<button class="btn sm" id="pm-copy" data-c="' + esc(coord) + '">Copy coordinates</button>' +
            "</div></div>";
        } else if (x.Make || x.Model) {
          h += '<div class="note info" style="margin-top:14px"><b>No location in this photograph</b>' +
            "<p>The camera metadata survived but there is no GPS fix, so either location was " +
            "switched off in the camera app, or the phone had no fix indoors. The absence of a " +
            "location is not evidence that the photograph was taken elsewhere.</p></div>";
        }

        if (x.Software && /whatsapp|instagram|snapseed|photoshop|gimp|lightroom|picsart/i.test(x.Software)) {
          h += '<div class="note warn" style="margin-top:12px"><b>This image has been through editing software</b>' +
            "<p>The Software field reads <b>" + esc(x.Software) + "</b>. The image is not straight " +
            "out of a camera. Treat the content as edited until you have the original.</p></div>";
        }

        h += '<p class="small muted" style="margin-top:14px">Metadata is written by the device and ' +
          "can be altered with free tools, so on its own it corroborates rather than proves. Hash " +
          "the file with the Hash tool and record the value before you do anything else with it.</p>";

        $("#pm-out").innerHTML = h + "</div>";
        var cp = $("#pm-copy");
        if (cp) cp.onclick = function () { TK.copy(cp.dataset.c); };
      }
    }
  });

  /* ==========================================================
     2. File Type Checker
     ========================================================== */

  /* Signatures are matched at a byte offset, so a renamed file cannot
     hide behind its extension. `ext` lists the extensions that are
     honest for that signature. */
  var SIGS = [
    { m: "FFD8FF", o: 0, name: "JPEG image", ext: ["jpg", "jpeg", "jpe"] },
    { m: "89504E470D0A1A0A", o: 0, name: "PNG image", ext: ["png"] },
    { m: "474946383961", o: 0, name: "GIF image", ext: ["gif"] },
    { m: "474946383761", o: 0, name: "GIF image", ext: ["gif"] },
    { m: "424D", o: 0, name: "BMP image", ext: ["bmp"] },
    { m: "49492A00", o: 0, name: "TIFF image (little-endian)", ext: ["tif", "tiff", "dng", "nef", "cr2", "arw"] },
    { m: "4D4D002A", o: 0, name: "TIFF image (big-endian)", ext: ["tif", "tiff", "dng", "nef"] },
    { m: "52494646", o: 0, name: "RIFF container (WAV / AVI / WEBP)", ext: ["wav", "avi", "webp"] },
    { m: "66747970", o: 4, name: "ISO base media (MP4 / MOV / HEIC / 3GP)", ext: ["mp4", "mov", "m4a", "m4v", "heic", "heif", "3gp"] },
    { m: "1A45DFA3", o: 0, name: "Matroska (MKV / WEBM)", ext: ["mkv", "webm"] },
    { m: "494433", o: 0, name: "MP3 audio (ID3)", ext: ["mp3"] },
    { m: "25504446", o: 0, name: "PDF document", ext: ["pdf"] },
    { m: "D0CF11E0A1B11AE1", o: 0, name: "Old Office document (DOC / XLS / PPT / MSG)", ext: ["doc", "xls", "ppt", "msg", "db"] },
    { m: "504B0304", o: 0, name: "ZIP container (also DOCX / XLSX / PPTX / APK / JAR / ODT)", ext: ["zip", "docx", "xlsx", "pptx", "apk", "jar", "odt", "ods", "epub", "kmz"] },
    { m: "504B0506", o: 0, name: "ZIP container (empty archive)", ext: ["zip"] },
    { m: "526172211A07", o: 0, name: "RAR archive", ext: ["rar"] },
    { m: "377ABCAF271C", o: 0, name: "7-Zip archive", ext: ["7z"] },
    { m: "1F8B08", o: 0, name: "GZIP archive", ext: ["gz", "tgz"] },
    { m: "53514C69746520666F726D6174203300", o: 0, name: "SQLite database", ext: ["db", "sqlite", "sqlite3", "db3", "crypt"] },
    { m: "4D5A", o: 0, name: "Windows executable (EXE / DLL)", ext: ["exe", "dll", "sys", "scr", "ocx"] },
    { m: "7F454C46", o: 0, name: "Linux / Android executable (ELF)", ext: ["so", "elf", "bin"] },
    { m: "6465780A", o: 0, name: "Android DEX bytecode", ext: ["dex"] },
    { m: "CAFEBABE", o: 0, name: "Java class file", ext: ["class"] },
    { m: "62706C697374", o: 0, name: "Apple binary plist", ext: ["plist"] },
    { m: "3C3F786D6C", o: 0, name: "XML document", ext: ["xml", "svg", "kml", "gpx", "plist"] },
    { m: "7B5C727466", o: 0, name: "Rich Text Format", ext: ["rtf"] },
    { m: "0A0D0D0A", o: 0, name: "PCAPNG capture", ext: ["pcapng", "ntar"] },
    { m: "D4C3B2A1", o: 0, name: "PCAP capture", ext: ["pcap"] },
    { m: "A1B2C3D4", o: 0, name: "PCAP capture", ext: ["pcap"] }
  ];

  /* Extensions Windows will execute or that carry code. A file whose
     real type is one of these is the reason this tool exists. */
  var DANGEROUS = /^(Windows executable|Linux \/ Android|Android DEX|Java class)/;

  function hexHead(u8, n) {
    var s = "";
    for (var i = 0; i < Math.min(n, u8.length); i++) {
      s += (u8[i] < 16 ? "0" : "") + u8[i].toString(16).toUpperCase();
    }
    return s;
  }

  function identify(u8) {
    var head = hexHead(u8, 32);
    for (var i = 0; i < SIGS.length; i++) {
      var s = SIGS[i];
      if (head.substr(s.o * 2, s.m.length) === s.m) return s;
    }
    return null;
  }

  TK.reg({
    id: "filetype",
    name: "File Type Checker",
    cluster: "network",
    tier: 1,
    desc: "Find out what a file really is, whatever its name says.",
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="drop" id="ft-drop"><div class="big"></div>' +
          "<div>Drop any file, or <b>browse</b></div>" +
          '<div class="xs muted" style="margin-top:6px">Only the first bytes are read, so even a ' +
          "very large file is instant. Nothing is uploaded, and nothing is run.</div></div>" +
        "</div><div id=\"ft-out\"></div>";

      TK.dropzone($("#ft-drop"), function (files) {
        var out = [];
        var pending = files.length;
        files.forEach(function (f, i) {
          readBuf(f.slice(0, 64), function (dv, u8) {
            out[i] = { file: f, sig: identify(u8), head: hexHead(u8, 16) };
            if (--pending === 0) render(out);
          });
        });
      }, { multiple: true });

      function render(list) {
        var h = "";
        list.forEach(function (r) {
          var name = r.file.name, ext = (name.split(".").pop() || "").toLowerCase();
          var hasExt = name.indexOf(".") > 0;
          var sig = r.sig;
          var mismatch = sig && hasExt && sig.ext.indexOf(ext) === -1;

          h += '<div class="card tight"><div class="row" style="margin-bottom:11px">' +
            '<span class="mono" style="font-size:15px;font-weight:600">' + esc(name) + "</span>" +
            '<span class="badge">' + TK.fmtBytes(r.file.size) + "</span>";
          if (!sig) h += '<span class="badge">signature not recognised</span>';
          else if (mismatch) h += '<span class="badge danger">extension does not match</span>';
          else h += '<span class="badge ok">matches its extension</span>';
          h += "</div>";

          h += '<dl class="kv">' +
            "<dt>Actually is</dt><dd>" + esc(sig ? sig.name : "not a type this tool knows") + "</dd>" +
            "<dt>Named as</dt><dd>" + (hasExt ? "." + esc(ext) : "<span class='muted'>no extension</span>") + "</dd>" +
            "<dt>First bytes</dt><dd class=\"mono\">" + esc(r.head.replace(/(..)/g, "$1 ").trim()) + "</dd>" +
            "</dl>";

          if (mismatch && sig && DANGEROUS.test(sig.name)) {
            h += '<div class="note danger" style="margin-top:12px"><b>This is a program pretending to be something else</b>' +
              "<p>The name says <b>." + esc(ext) + "</b> but the file is <b>" + esc(sig.name) +
              "</b>. This is how malware is delivered. Do not open it. Preserve it, hash it, and " +
              "send it to your cyber forensics unit for examination in an isolated environment.</p></div>";
          } else if (mismatch) {
            h += '<div class="note warn" style="margin-top:12px"><b>The name does not match the contents</b>' +
              "<p>The file is really <b>" + esc(sig.name) + "</b>. Sometimes this is innocent, " +
              "because a phone or an app saved it with the wrong extension. Sometimes it is " +
              "deliberate. Note it, and open it only in a viewer that matches the real type.</p></div>";
          }

          if (sig && sig.name.indexOf("SQLite") === 0) {
            h += '<div class="note info" style="margin-top:12px"><b>This is a database, not a document</b>' +
              "<p>Phone extractions store messages, contacts and call logs in SQLite. WhatsApp " +
              "uses msgstore.db, Android contacts use contacts2.db. Open it with a database " +
              "viewer, not a text editor, and work on a copy so the original hash stays intact.</p></div>";
          }
          if (sig && sig.name.indexOf("ZIP container") === 0) {
            h += '<div class="note info" style="margin-top:12px"><b>ZIP is a container, so look inside</b>' +
              "<p>DOCX, XLSX, PPTX, APK and JAR are all ZIP files. If this is named .apk it is an " +
              "Android app, which is worth passing to your forensics unit rather than installing.</p></div>";
          }

          h += "</div>";
        });

        h += '<div class="card"><p class="small muted">The extension is only a name. The first ' +
          "bytes of a file are written by the program that created it, and they are what this " +
          "reads. Hash the file before anything else, so the record shows the exhibit you " +
          "received is the exhibit you examined.</p></div>";
        $("#ft-out").innerHTML = h;
      }
    }
  });
})();
