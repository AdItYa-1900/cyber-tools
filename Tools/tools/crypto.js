/* ============================================================
   Crypto Address Checker

   Investment-fraud and "task scam" complaints now almost always end
   at a wallet address, usually USDT on Tron. Before anything else the
   officer needs to know which chain it is on, because that decides
   which explorer shows the transactions and which exchange gets the
   notice.

   Everything here is arithmetic and runs offline:

     Base58Check   Bitcoin, Bitcoin Cash legacy, Litecoin, Dogecoin
                   and Tron all use it, with a different version byte.
                   The 4-byte checksum is real and is verified here.
     Bech32        native SegWit (bc1...) carries a BCH checksum, also
                   verified, including the bech32m variant used by
                   Taproot.
     EIP-55        an Ethereum address written in mixed case encodes a
                   checksum in the capitalisation. Verified with
                   Keccak-256.

   The single most important thing this tool says is that an 0x...
   address is NOT an Ethereum address. The same address exists on
   Ethereum, BSC, Polygon, Arbitrum, Optimism, Base and every other
   EVM chain, and the funds are usually on one of them. The chain has
   to come from the complaint, never from the address.
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* ---------------------------------------------------------- SHA-256
     Needed synchronously for Base58Check. WebCrypto only offers a
     promise, and a checksum that resolves later is harder to reason
     about than sixty lines of arithmetic. */
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  function sha256(bytes) {
    var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
             0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length, wl = ((l + 8) >> 6 << 4) + 16;
    var m = new Int32Array(wl);
    for (var i = 0; i < l; i++) m[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
    m[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    m[wl - 1] = l * 8;

    var w = new Int32Array(64);
    function rr(x, n) { return (x >>> n) | (x << (32 - n)); }

    for (var j = 0; j < m.length; j += 16) {
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (var t = 0; t < 64; t++) {
        if (t < 16) w[t] = m[j + t];
        else {
          var s0 = rr(w[t - 15], 7) ^ rr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
          var s1 = rr(w[t - 2], 17) ^ rr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
          w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
        }
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (hh + S1 + ch + K[t] + w[t]) | 0;
        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    var out = new Uint8Array(32);
    for (var k = 0; k < 8; k++) {
      out[k * 4] = (h[k] >>> 24) & 255; out[k * 4 + 1] = (h[k] >>> 16) & 255;
      out[k * 4 + 2] = (h[k] >>> 8) & 255; out[k * 4 + 3] = h[k] & 255;
    }
    return out;
  }

  /* ---------------------------------------------------------- Keccak-256
     Ethereum uses original Keccak padding (0x01), not the later
     SHA3 padding (0x06). Getting that wrong silently produces a
     plausible but wrong digest, so it is worth stating. */
  var RC = [
    [0x00000000, 0x00000001], [0x00000000, 0x00008082], [0x80000000, 0x0000808a],
    [0x80000000, 0x80008000], [0x00000000, 0x0000808b], [0x00000000, 0x80000001],
    [0x80000000, 0x80008081], [0x80000000, 0x00008009], [0x00000000, 0x0000008a],
    [0x00000000, 0x00000088], [0x00000000, 0x80008009], [0x00000000, 0x8000000a],
    [0x00000000, 0x8000808b], [0x80000000, 0x0000008b], [0x80000000, 0x00008089],
    [0x80000000, 0x00008003], [0x80000000, 0x00008002], [0x80000000, 0x00000080],
    [0x00000000, 0x0000800a], [0x80000000, 0x8000000a], [0x80000000, 0x80008081],
    [0x80000000, 0x00008080], [0x00000000, 0x80000001], [0x80000000, 0x80008008]];
  /* Rotation offsets, laid out by lane index x + 5y so the loop can read
     them flat. Written a row per y to keep it checkable against the
     standard table rather than as an opaque run of 25 numbers. */
  var ROT = [
    0, 1, 62, 28, 27,        /* y=0 */
    36, 44, 6, 55, 20,       /* y=1 */
    3, 10, 43, 25, 39,       /* y=2 */
    41, 45, 15, 21, 8,       /* y=3 */
    18, 2, 61, 56, 14        /* y=4 */
  ];

  function rotl64(hi, lo, n) {
    if (n === 0) return [hi, lo];
    if (n < 32) return [(hi << n) | (lo >>> (32 - n)), (lo << n) | (hi >>> (32 - n))];
    if (n === 32) return [lo, hi];
    n -= 32;
    return [(lo << n) | (hi >>> (32 - n)), (hi << n) | (lo >>> (32 - n))];
  }

  function keccak256(bytes) {
    var RATE = 136;                       // 1088 bits for Keccak-256
    var s = [];
    for (var i = 0; i < 25; i++) s.push([0, 0]);

    var padded = new Uint8Array(Math.ceil((bytes.length + 1) / RATE) * RATE);
    padded.set(bytes);
    padded[bytes.length] = 0x01;          // Keccak padding, not 0x06
    padded[padded.length - 1] |= 0x80;

    for (var off = 0; off < padded.length; off += RATE) {
      for (var w = 0; w < RATE / 8; w++) {
        var b = off + w * 8;
        var lo = padded[b] | (padded[b + 1] << 8) | (padded[b + 2] << 16) | (padded[b + 3] << 24);
        var hi = padded[b + 4] | (padded[b + 5] << 8) | (padded[b + 6] << 16) | (padded[b + 7] << 24);
        s[w][0] ^= hi; s[w][1] ^= lo;
      }
      permute(s);
    }

    var out = new Uint8Array(32);
    for (var j = 0; j < 4; j++) {
      var hi2 = s[j][0], lo2 = s[j][1];
      out[j * 8] = lo2 & 255; out[j * 8 + 1] = (lo2 >>> 8) & 255;
      out[j * 8 + 2] = (lo2 >>> 16) & 255; out[j * 8 + 3] = (lo2 >>> 24) & 255;
      out[j * 8 + 4] = hi2 & 255; out[j * 8 + 5] = (hi2 >>> 8) & 255;
      out[j * 8 + 6] = (hi2 >>> 16) & 255; out[j * 8 + 7] = (hi2 >>> 24) & 255;
    }
    return out;
  }

  function permute(s) {
    var C = [], D = [], B = [], x, y, r;
    for (r = 0; r < 24; r++) {
      for (x = 0; x < 5; x++) {
        C[x] = [s[x][0] ^ s[x + 5][0] ^ s[x + 10][0] ^ s[x + 15][0] ^ s[x + 20][0],
                s[x][1] ^ s[x + 5][1] ^ s[x + 10][1] ^ s[x + 15][1] ^ s[x + 20][1]];
      }
      for (x = 0; x < 5; x++) {
        var rt = rotl64(C[(x + 1) % 5][0], C[(x + 1) % 5][1], 1);
        D[x] = [C[(x + 4) % 5][0] ^ rt[0], C[(x + 4) % 5][1] ^ rt[1]];
      }
      for (x = 0; x < 5; x++) {
        for (y = 0; y < 5; y++) {
          s[x + 5 * y][0] ^= D[x][0]; s[x + 5 * y][1] ^= D[x][1];
        }
      }
      for (x = 0; x < 5; x++) {
        for (y = 0; y < 5; y++) {
          var idx = x + 5 * y;
          var rot = rotl64(s[idx][0], s[idx][1], ROT[idx]);
          B[y + 5 * ((2 * x + 3 * y) % 5)] = rot;
        }
      }
      for (x = 0; x < 5; x++) {
        for (y = 0; y < 5; y++) {
          var i0 = x + 5 * y;
          s[i0] = [B[i0][0] ^ (~B[(x + 1) % 5 + 5 * y][0] & B[(x + 2) % 5 + 5 * y][0]),
                   B[i0][1] ^ (~B[(x + 1) % 5 + 5 * y][1] & B[(x + 2) % 5 + 5 * y][1])];
        }
      }
      s[0][0] ^= RC[r][0]; s[0][1] ^= RC[r][1];
    }
  }

  /* ---------------------------------------------------------- Base58
     The XRP Ledger uses the same algorithm over a different alphabet.
     Decoding an XRP address with the Bitcoin alphabet produces bytes
     that look like a corrupt Bitcoin address, so the alphabet has to
     be chosen before decoding, not after. */
  var A58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  var A58_XRP = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";

  function b58decode(str, alpha) {
    alpha = alpha || A58;
    var bytes = [0];
    for (var i = 0; i < str.length; i++) {
      var v = alpha.indexOf(str[i]);
      if (v < 0) return null;
      for (var j = 0; j < bytes.length; j++) bytes[j] *= 58;
      bytes[0] += v;
      var carry = 0;
      for (var k = 0; k < bytes.length; k++) {
        bytes[k] += carry; carry = bytes[k] >> 8; bytes[k] &= 255;
      }
      while (carry) { bytes.push(carry & 255); carry >>= 8; }
    }
    var zero = alpha[0];
    for (var z = 0; z < str.length && str[z] === zero; z++) bytes.push(0);
    return new Uint8Array(bytes.reverse());
  }

  function b58check(str, alpha) {
    var raw = b58decode(str, alpha);
    if (!raw || raw.length < 5) return null;
    var payload = raw.slice(0, raw.length - 4), given = raw.slice(raw.length - 4);
    var want = sha256(sha256(payload)).slice(0, 4);
    for (var i = 0; i < 4; i++) if (given[i] !== want[i]) return { ok: false, version: payload[0], len: payload.length };
    return { ok: true, version: payload[0], len: payload.length };
  }

  /* ---------------------------------------------------------- Bech32 */
  var B32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  function polymod(v) {
    var GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3], chk = 1;
    for (var p = 0; p < v.length; p++) {
      var b = chk >> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ v[p];
      for (var i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i];
    }
    return chk;
  }
  function bech32(addr) {
    var s = addr.toLowerCase();
    if (s !== addr && addr.toUpperCase() !== addr) return null;   // no mixed case
    var pos = s.lastIndexOf("1");
    if (pos < 1 || pos + 7 > s.length || s.length > 90) return null;
    var hrp = s.slice(0, pos), data = [];
    for (var i = pos + 1; i < s.length; i++) {
      var d = B32.indexOf(s[i]);
      if (d < 0) return null;
      data.push(d);
    }
    var exp = [];
    for (var j = 0; j < hrp.length; j++) exp.push(hrp.charCodeAt(j) >> 5);
    exp.push(0);
    for (var k = 0; k < hrp.length; k++) exp.push(hrp.charCodeAt(k) & 31);
    var chk = polymod(exp.concat(data));
    var variant = chk === 1 ? "bech32" : chk === 0x2bc830a3 ? "bech32m" : null;
    return { hrp: hrp, witver: data[0], variant: variant, ok: !!variant };
  }

  /* ---------------------------------------------------------- EIP-55 */
  function eip55(hex40) {
    var lower = hex40.toLowerCase();
    var bytes = [];
    for (var i = 0; i < lower.length; i++) bytes.push(lower.charCodeAt(i));
    var h = keccak256(new Uint8Array(bytes));
    var hex = "";
    for (var j = 0; j < 20; j++) {
      hex += (h[j] >>> 4).toString(16) + (h[j] & 15).toString(16);
    }
    var out = "";
    for (var k = 0; k < 40; k++) {
      out += parseInt(hex[k], 16) >= 8 ? lower[k].toUpperCase() : lower[k];
    }
    return out;
  }

  /* ---------------------------------------------------------- chains */
  var VERSION = {
    0: { chain: "Bitcoin", kind: "P2PKH (legacy, starts with 1)", explorer: "blockchair.com/bitcoin" },
    5: { chain: "Bitcoin", kind: "P2SH (starts with 3)", explorer: "blockchair.com/bitcoin" },
    48: { chain: "Litecoin", kind: "P2PKH (starts with L)", explorer: "blockchair.com/litecoin" },
    50: { chain: "Litecoin", kind: "P2SH (starts with M)", explorer: "blockchair.com/litecoin" },
    30: { chain: "Dogecoin", kind: "P2PKH (starts with D)", explorer: "blockchair.com/dogecoin" },
    111: { chain: "Bitcoin TESTNET", kind: "test network, not real money", explorer: "" },
    65: { chain: "Tron (TRC-20)", kind: "standard Tron account", explorer: "tronscan.org" }
  };

  function analyse(raw) {
    var v = String(raw).trim();
    if (!v) return null;

    /* EVM: 0x + 40 hex */
    if (/^0x[0-9a-fA-F]{40}$/.test(v)) {
      var body = v.slice(2), mixed = body !== body.toLowerCase() && body !== body.toUpperCase();
      var want = eip55(body), ok = want === body;
      return {
        chain: "EVM address",
        badge: mixed ? (ok ? "ok" : "danger") : "",
        verdict: mixed
          ? (ok ? "EIP-55 checksum passes" : "EIP-55 checksum FAILS, this address is mistyped")
          : "Valid shape, no checksum to test",
        rows: [
          ["Format", "20-byte account address, 0x + 40 hex digits"],
          ["Capitalisation checksum", mixed
            ? (ok ? "present and correct" : "present and WRONG")
            : "not used (address is all one case, which is legal)"],
          ["Checksummed form", "0x" + want]
        ],
        warn: !mixed ? null : (ok ? null :
          "An address with mixed capitalisation carries a checksum in that capitalisation, and " +
          "this one does not match. Almost certainly a transcription error. Do not send a notice " +
          "with this address until it is re-checked against the source."),
        chainNote: true,
        explorer: "etherscan.io, bscscan.com, polygonscan.com, arbiscan.io"
      };
    }

    /* Bech32 / bech32m */
    if (/^(bc1|tb1|ltc1)[02-9ac-hj-np-z]{6,}$/i.test(v)) {
      var b = bech32(v);
      if (b) {
        var chain = b.hrp === "bc" ? "Bitcoin" : b.hrp === "ltc" ? "Litecoin" : "Bitcoin TESTNET";
        var kind = b.witver === 0
          ? (v.length === 42 ? "SegWit v0, single key (P2WPKH)" : "SegWit v0, script (P2WSH)")
          : b.witver === 1 ? "Taproot (P2TR)" : "witness version " + b.witver;
        return {
          chain: chain, badge: b.ok ? "ok" : "danger",
          verdict: b.ok ? "Checksum passes" : "Checksum FAILS",
          rows: [
            ["Format", kind], ["Encoding", b.variant || "neither bech32 nor bech32m"],
            ["Human-readable prefix", b.hrp]
          ],
          warn: b.ok ? null : "The built-in checksum does not agree. This address is mistyped.",
          explorer: chain === "Bitcoin" ? "blockchair.com/bitcoin" : "blockchair.com/litecoin"
        };
      }
    }

    /* XRP first: its addresses are valid Bitcoin-alphabet strings, so the
       generic branch below would decode them into nonsense and report a
       failed checksum on a perfectly good address. */
    if (/^r[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{24,34}$/.test(v)) {
      var xr = b58check(v, A58_XRP);
      if (xr) {
        return {
          chain: "XRP Ledger", badge: xr.ok ? "ok" : "danger",
          verdict: xr.ok ? "Checksum passes" : "Checksum FAILS",
          rows: [["Format", "classic address"], ["Version byte", xr.version],
                 ["Also ask for", "the destination tag"]],
          warn: xr.ok
            ? "An exchange normally holds one XRP address for all its customers and tells them " +
              "apart by the destination tag. Without the tag the exchange cannot identify whose " +
              "deposit it was, so request the tag alongside the address."
            : "The checksum built into this address does not agree. It has been mistyped.",
          explorer: "xrpscan.com"
        };
      }
    }

    /* Base58Check family */
    if (/^[1-9A-HJ-NP-Za-km-z]{25,40}$/.test(v)) {
      var r = b58check(v);
      if (r) {
        var meta = VERSION[r.version];
        if (meta) {
          return {
            chain: meta.chain, badge: r.ok ? "ok" : "danger",
            verdict: r.ok ? "Checksum passes" : "Checksum FAILS",
            rows: [["Format", meta.kind], ["Version byte", r.version],
                   ["Payload", r.len + " bytes"]],
            warn: r.ok ? null
              : "The four-byte checksum built into the address does not agree with the rest of " +
                "it. One character has been changed. Get the address again from the source, do " +
                "not correct it yourself.",
            explorer: meta.explorer,
            tron: meta.chain.indexOf("Tron") === 0
          };
        }
        return {
          chain: "Unknown Base58Check chain", badge: r.ok ? "" : "danger",
          verdict: r.ok ? "Checksum passes, version byte not recognised" : "Checksum FAILS",
          rows: [["Version byte", r.version], ["Payload", r.len + " bytes"]],
          warn: null, explorer: ""
        };
      }
    }

    /* Solana and other raw base58 public keys, 32 bytes, no checksum */
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)) {
      var raw = b58decode(v);
      if (raw && raw.length === 32) {
        return {
          chain: "Solana", badge: "",
          verdict: "Valid shape, Solana has no address checksum",
          rows: [["Format", "32-byte ed25519 public key"], ["Encoding", "base58, no checksum"]],
          warn: "Solana addresses carry no checksum, so a mistyped one can still look valid. " +
                "Copy and paste it, never retype it.",
          explorer: "solscan.io"
        };
      }
    }

    /* Monero */
    if (/^[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/.test(v)) {
      return {
        chain: "Monero", badge: "warn",
        verdict: "Monero address",
        rows: [["Format", v[0] === "4" ? "standard address" : "subaddress"]],
        warn: "Monero hides sender, receiver and amount by design. There is no public ledger to " +
              "follow. The realistic route is the exchange or peer-to-peer platform where it was " +
              "bought or sold, not the chain.",
        explorer: ""
      };
    }


    return {
      chain: "", badge: "danger", verdict: "Not a recognised address format",
      rows: [], warn: "Check for a truncated copy-paste. Wallet addresses are often broken " +
                      "across two lines in a screenshot or a PDF.", explorer: ""
    };
  }

  TK.reg({
    id: "cryptoaddr",
    name: "Crypto Address Checker",
    cluster: "money",
    tier: 1,
    desc: "Find out which blockchain a wallet address belongs to, and whether it is typed correctly.",
    render: function (root) {
      root.innerHTML =
        '<div class="card">' +
          '<div class="field"><label class="lbl">Wallet address, one per line</label>' +
          '<textarea id="ca-in" class="mono" placeholder="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t&#10;1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa&#10;bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4&#10;0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"></textarea>' +
          '<p class="xs muted" style="margin-top:6px">Copy the address from the complaint exactly. ' +
          'Do not retype it. Nothing leaves this computer.</p></div>' +
          '<div class="row"><button class="btn primary" id="ca-go">Check</button></div>' +
        "</div><div id=\"ca-out\"></div>";

      $("#ca-go").onclick = go;

      function go() {
        var lines = $("#ca-in").value.split(/[\s,;]+/)
          .map(function (s) { return s.trim(); }).filter(Boolean);
        if (!lines.length) { TK.toast("Nothing to check", "danger"); return; }

        var out = "";
        lines.forEach(function (line) {
          var r = analyse(line);
          var c = '<div class="card tight"><div class="row" style="margin-bottom:11px">' +
            '<span class="mono" style="font-size:14px;font-weight:600;word-break:break-all">' +
            esc(line) + "</span>";
          if (r.chain) c += '<span class="badge accent">' + esc(r.chain) + "</span>";
          c += '<span class="badge ' + (r.badge || "") + '">' + esc(r.verdict) + "</span></div>";

          if (r.rows.length) {
            c += '<dl class="kv">' + r.rows.map(function (p) {
              return "<dt>" + esc(p[0]) + "</dt><dd class=\"mono\" style=\"word-break:break-all\">" +
                esc(String(p[1])) + "</dd>";
            }).join("") + "</dl>";
          }
          if (r.chainNote) {
            c += '<div class="note warn" style="margin-top:12px"><b>This does not tell you the chain</b>' +
              "<p>The same 0x address exists on Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, " +
              "Base and every other EVM chain, and the money is usually on only one of them. " +
              "Get the chain from the complainant's transaction screenshot or the exchange, " +
              "then search that chain's explorer.</p></div>";
          }
          if (r.tron) {
            c += '<div class="note info" style="margin-top:12px"><b>Most likely USDT-TRC20</b>' +
              "<p>Tron is the usual rail for investment and task-based fraud in India because " +
              "transfer fees are near zero. The token contract matters: ask the complainant for " +
              "the transaction hash, not just the address.</p></div>";
          }
          if (r.warn) {
            c += '<div class="note ' + (r.badge === "danger" ? "danger" : "warn") +
              '" style="margin-top:12px">' + esc(r.warn) + "</div>";
          }
          if (r.explorer) {
            c += '<p class="small muted" style="margin-top:10px"><b>Public explorer:</b> ' +
              esc(r.explorer) + ". The full transaction history of any address is public and free " +
              "to read. You do not need legal process to look at the chain. You need it to find " +
              "out who owns the account at the exchange.</p>";
          }
          out += c + "</div>";
        });

        out += '<div class="card"><h3>Where the notice goes</h3>' +
          '<p class="small muted">A blockchain address has no owner on the chain. It becomes a ' +
          'person only where the money touched a regulated business, which is the exchange the ' +
          'funds were bought at or cashed out through. Indian exchanges and the major offshore ' +
          'ones are in the Nodal Officer Directory. Ask for the KYC record, the registered mobile ' +
          'and email, the deposit and withdrawal addresses, and the login IP history.</p></div>';

        $("#ca-out").innerHTML = out;
      }
    }
  });

  /* exposed so the test harness can check the primitives */
  TK._cryptoTest = { sha256: sha256, keccak256: keccak256, b58check: b58check,
                     bech32: bech32, eip55: eip55 };
})();
