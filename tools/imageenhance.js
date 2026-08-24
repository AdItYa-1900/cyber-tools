/* ============================================================
   CCTV Image Enhancer

   Forensic image enhancement that runs entirely in this browser,
   on the officer's own machine. Nothing is uploaded.

   WHAT THIS DOES: it redistributes and amplifies detail that is
   already present in the pixels. Frame stacking, deconvolution,
   local contrast, edge-preserving denoise and interpolation are
   all reversible-in-principle signal operations. Every step and
   every parameter is written to a processing log so another
   examiner can reproduce the result from the original file.

   WHAT THIS WILL NEVER DO: present generated-looking detail as fact.
   The optional local AI restoration mode is intentionally labelled
   "AI-assisted" and is a review aid only: a learned model can make
   plausible strokes that are not evidence. If the characters are not
   in the pixels, no amount of processing puts them there, and the
   honest finding is "not legible".
   ============================================================ */
(function () {
  "use strict";
  var $ = TK.$, esc = TK.esc;

  /* ==========================================================
     Colour
     ========================================================== */

  function clamp8(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
  function clampi(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* Work in YCbCr and process luminance only. Chroma carries almost no
     resolvable detail in CCTV and touching it produces colour fringes
     that look like recovered information but are not. */
  function toYCC(img) {
    var n = img.width * img.height, d = img.data;
    var Y = new Float32Array(n), Cb = new Float32Array(n), Cr = new Float32Array(n);
    for (var i = 0, p = 0; i < n; i++, p += 4) {
      var r = d[p], g = d[p + 1], b = d[p + 2];
      Y[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      Cb[i] = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
      Cr[i] = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;
    }
    return { y: Y, cb: Cb, cr: Cr, w: img.width, h: img.height };
  }

  /* Pull one raw colour channel up as the working plane. Night-time IR
     cameras often hold the plate almost entirely in red. */
  function channelPlane(img, which) {
    var n = img.width * img.height, d = img.data, Y = new Float32Array(n);
    var off = which === "r" ? 0 : which === "g" ? 1 : 2;
    for (var i = 0, p = 0; i < n; i++, p += 4) Y[i] = d[p + off];
    return Y;
  }

  function toImageData(y, cb, cr, w, h) {
    var img = new ImageData(w, h), d = img.data, n = w * h;
    for (var i = 0, q = 0; i < n; i++, q += 4) {
      var Yv = y[i];
      if (cb) {
        var u = cb[i] - 128, v = cr[i] - 128;
        d[q] = clamp8(Yv + 1.402 * v);
        d[q + 1] = clamp8(Yv - 0.344136 * u - 0.714136 * v);
        d[q + 2] = clamp8(Yv + 1.772 * u);
      } else {
        d[q] = d[q + 1] = d[q + 2] = clamp8(Yv);
      }
      d[q + 3] = 255;
    }
    return img;
  }

  /* ==========================================================
     Filters
     ========================================================== */

  function gaussKernel(sigma) {
    var r = Math.max(1, Math.ceil(sigma * 3)), k = new Float32Array(2 * r + 1), s = 0, i;
    for (i = -r; i <= r; i++) { var v = Math.exp(-(i * i) / (2 * sigma * sigma)); k[i + r] = v; s += v; }
    for (i = 0; i < k.length; i++) k[i] /= s;
    return { k: k, r: r };
  }

  function blur(src, w, h, sigma) {
    if (sigma <= 0.05) return Float32Array.from(src);
    var g = gaussKernel(sigma), k = g.k, r = g.r;
    var tmp = new Float32Array(w * h), out = new Float32Array(w * h);
    var x, y, i, acc, xx, yy;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        acc = 0;
        for (i = -r; i <= r; i++) { xx = clampi(x + i, 0, w - 1); acc += src[y * w + xx] * k[i + r]; }
        tmp[y * w + x] = acc;
      }
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        acc = 0;
        for (i = -r; i <= r; i++) { yy = clampi(y + i, 0, h - 1); acc += tmp[yy * w + x] * k[i + r]; }
        out[y * w + x] = acc;
      }
    }
    return out;
  }

  function convolve(src, w, h, psf, ps) {
    var r = (ps - 1) >> 1, out = new Float32Array(w * h);
    var x, y, i, j, xx, yy, acc;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        acc = 0;
        for (j = -r; j <= r; j++) {
          yy = clampi(y + j, 0, h - 1);
          for (i = -r; i <= r; i++) {
            xx = clampi(x + i, 0, w - 1);
            acc += src[yy * w + xx] * psf[(j + r) * ps + (i + r)];
          }
        }
        out[y * w + x] = acc;
      }
    }
    return out;
  }

  /* Point spread functions: the shape the camera smeared each point into. */
  function psfGauss(sigma) {
    var r = Math.max(1, Math.round(sigma * 2.5)), ps = 2 * r + 1;
    var k = new Float32Array(ps * ps), s = 0, x, y;
    for (y = -r; y <= r; y++) {
      for (x = -r; x <= r; x++) {
        var v = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
        k[(y + r) * ps + (x + r)] = v; s += v;
      }
    }
    for (var i = 0; i < k.length; i++) k[i] /= s;
    return { psf: k, ps: ps };
  }

  /* Optical defocus spreads a point over the camera's circle of confusion,
     not over a Gaussian. The control is the diameter of that circle in
     image pixels. A softly sampled edge avoids a blocky PSF between pixels. */
  function psfOptical(size) {
    var diameter = Math.max(1, size), radius = diameter / 2;
    var r = Math.max(1, Math.ceil(radius + 0.5)), ps = 2 * r + 1;
    var k = new Float32Array(ps * ps), s = 0, x, y, d, v;
    for (y = -r; y <= r; y++) {
      for (x = -r; x <= r; x++) {
        d = Math.sqrt(x * x + y * y);
        v = d <= radius - 0.5 ? 1 : d >= radius + 0.5 ? 0 : radius + 0.5 - d;
        k[(y + r) * ps + (x + r)] = v;
        s += v;
      }
    }
    if (!s) { k[r * ps + r] = 1; s = 1; }
    for (var i = 0; i < k.length; i++) k[i] /= s;
    return { psf: k, ps: ps, diameter: diameter };
  }

  function psfMotion(len, angleDeg) {
    len = Math.max(2, len);
    var r = Math.max(1, Math.ceil(len / 2)), ps = 2 * r + 1;
    var k = new Float32Array(ps * ps), s = 0;
    var a = angleDeg * Math.PI / 180, ca = Math.cos(a), sa = -Math.sin(a);
    var steps = Math.ceil(len * 8), t;

    function splat(px, py, wgt) {
      if (px < 0 || py < 0 || px >= ps || py >= ps || wgt <= 0) return;
      k[py * ps + px] += wgt; s += wgt;
    }
    for (t = 0; t <= steps; t++) {
      var d = (t / steps - 0.5) * len;
      var fx = r + d * ca, fy = r + d * sa;
      var x0 = Math.floor(fx), y0 = Math.floor(fy), dx = fx - x0, dy = fy - y0;
      splat(x0, y0, (1 - dx) * (1 - dy)); splat(x0 + 1, y0, dx * (1 - dy));
      splat(x0, y0 + 1, (1 - dx) * dy); splat(x0 + 1, y0 + 1, dx * dy);
    }
    if (s > 0) for (var i = 0; i < k.length; i++) k[i] /= s;
    return { psf: k, ps: ps };
  }

  /* Richardson-Lucy deconvolution. Iteratively asks "what image, blurred
     by this PSF, would have produced what I actually see?". It recovers
     real detail; it also amplifies noise, which is why denoise runs first
     and the iteration count stays modest. */
  function richardsonLucy(obs, w, h, psf, ps, iters, onStep, noiseFloor) {
    var est = Float32Array.from(obs), n = w * h;
    var flip = new Float32Array(ps * ps), i, p;
    noiseFloor = Math.max(0, noiseFloor || 0);
    for (i = 0; i < ps * ps; i++) flip[i] = psf[ps * ps - 1 - i];
    for (var it = 0; it < iters; it++) {
      var conv = convolve(est, w, h, psf, ps);
      var ratio = new Float32Array(n);
      /* Damped RL: changes smaller than the measured sensor noise are not
         amplified into false character strokes. Zero keeps classic RL. */
      for (p = 0; p < n; p++) {
        ratio[p] = 1 + (obs[p] - conv[p]) / (conv[p] + noiseFloor + 1e-3);
      }
      var corr = convolve(ratio, w, h, flip, ps);
      for (p = 0; p < n; p++) {
        var v = est[p] * corr[p];
        est[p] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      if (onStep) onStep(it + 1);
    }
    return est;
  }

  /* CLAHE. Equalises contrast inside small tiles, so a plate sitting in
     shadow is stretched against its own neighbourhood rather than against
     the headlights at the other end of the frame. The clip limit stops it
     turning sensor noise into texture. */
  function clahe(src, w, h, tiles, clip) {
    var tw = Math.ceil(w / tiles), th = Math.ceil(h / tiles);
    var maps = [], gx, gy, x, y, i;

    for (gy = 0; gy < tiles; gy++) {
      for (gx = 0; gx < tiles; gx++) {
        var hist = new Float32Array(256), cnt = 0;
        var x0 = gx * tw, y0 = gy * th;
        var x1 = Math.min(w, x0 + tw), y1 = Math.min(h, y0 + th);
        for (y = y0; y < y1; y++) {
          for (x = x0; x < x1; x++) { hist[clampi(src[y * w + x] | 0, 0, 255)]++; cnt++; }
        }
        if (!cnt) { maps.push(null); continue; }
        var limit = Math.max(1, clip * cnt / 256), excess = 0;
        for (i = 0; i < 256; i++) if (hist[i] > limit) { excess += hist[i] - limit; hist[i] = limit; }
        var add = excess / 256;
        var lut = new Float32Array(256), run = 0;
        for (i = 0; i < 256; i++) { run += hist[i] + add; lut[i] = 255 * run / cnt; }
        maps.push(lut);
      }
    }

    var flat = null;
    for (i = 0; i < maps.length; i++) if (maps[i]) { flat = maps[i]; break; }
    if (!flat) return Float32Array.from(src);
    for (i = 0; i < maps.length; i++) if (!maps[i]) maps[i] = flat;

    /* bilinear blend between the four surrounding tile maps, which is what
       stops CLAHE from leaving visible tile seams across a plate */
    var out = new Float32Array(w * h);
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var fx = x / tw - 0.5, fy = y / th - 0.5;
        var cx = Math.floor(fx), cy = Math.floor(fy);
        var ax = fx - cx, ay = fy - cy;
        var X0 = clampi(cx, 0, tiles - 1), X1 = clampi(cx + 1, 0, tiles - 1);
        var Y0 = clampi(cy, 0, tiles - 1), Y1 = clampi(cy + 1, 0, tiles - 1);
        var v = clampi(src[y * w + x] | 0, 0, 255);
        var a = maps[Y0 * tiles + X0][v], b = maps[Y0 * tiles + X1][v];
        var c = maps[Y1 * tiles + X0][v], e = maps[Y1 * tiles + X1][v];
        out[y * w + x] = (a * (1 - ax) + b * ax) * (1 - ay) + (c * (1 - ax) + e * ax) * ay;
      }
    }
    return out;
  }

  /* Bilateral filter: averages neighbours that are similar in brightness
     and ignores the ones that are not, so grain goes and edges stay. */
  function bilateral(src, w, h, r, sigS, sigR) {
    var side = 2 * r + 1, sp = new Float32Array(side * side), i, j;
    for (j = -r; j <= r; j++) {
      for (i = -r; i <= r; i++) sp[(j + r) * side + (i + r)] = Math.exp(-(i * i + j * j) / (2 * sigS * sigS));
    }
    var rl = new Float32Array(512);
    for (i = 0; i < 512; i++) rl[i] = Math.exp(-((i - 255) * (i - 255)) / (2 * sigR * sigR));

    var out = new Float32Array(w * h), x, y;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var c = src[y * w + x], num = 0, den = 0;
        for (j = -r; j <= r; j++) {
          var yy = clampi(y + j, 0, h - 1);
          for (i = -r; i <= r; i++) {
            var xx = clampi(x + i, 0, w - 1);
            var s = src[yy * w + xx];
            var wgt = sp[(j + r) * side + (i + r)] * rl[clampi(Math.round(s - c) + 255, 0, 511)];
            num += s * wgt; den += wgt;
          }
        }
        out[y * w + x] = den ? num / den : c;
      }
    }
    return out;
  }

  function unsharp(src, w, h, radius, amount, threshold) {
    var b = blur(src, w, h, radius), out = new Float32Array(w * h);
    for (var i = 0; i < out.length; i++) {
      var diff = src[i] - b[i];
      out[i] = Math.abs(diff) < threshold ? src[i] : src[i] + amount * diff;
    }
    return out;
  }

  function percentile(src, p) {
    var hist = new Uint32Array(256), i;
    for (i = 0; i < src.length; i++) hist[clampi(src[i] | 0, 0, 255)]++;
    var want = src.length * p, run = 0;
    for (i = 0; i < 256; i++) { run += hist[i]; if (run >= want) return i; }
    return 255;
  }

  function levels(src, black, white, gamma) {
    var out = new Float32Array(src.length), span = Math.max(1, white - black);
    for (var i = 0; i < src.length; i++) {
      var t = (src[i] - black) / span;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      out[i] = 255 * Math.pow(t, gamma);
    }
    return out;
  }

  /* Wolf-Jolion local thresholding: Sauvola's method retuned for text in
     video frames, where contrast is low and the light drifts across the
     plate. Plain Sauvola scales its threshold by the local mean, so a
     bright end of a plate with the same modest contrast as the dark end
     loses its characters. Wolf normalises against the darkest pixel and
     the strongest local variation instead, and keeps both ends. */
  function wolfThreshold(src, w, h, win, k) {
    var s1 = new Float64Array((w + 1) * (h + 1)), s2 = new Float64Array((w + 1) * (h + 1));
    var x, y;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var v = src[y * w + x];
        var idx = (y + 1) * (w + 1) + (x + 1);
        s1[idx] = v + s1[idx - 1] + s1[idx - w - 1] - s1[idx - w - 2];
        s2[idx] = v * v + s2[idx - 1] + s2[idx - w - 1] - s2[idx - w - 2];
      }
    }
    function box(sum, x0, y0, x1, y1) {
      return sum[(y1 + 1) * (w + 1) + (x1 + 1)] - sum[y0 * (w + 1) + (x1 + 1)]
           - sum[(y1 + 1) * (w + 1) + x0] + sum[y0 * (w + 1) + x0];
    }
    var r = Math.max(1, win >> 1), n = w * h;
    var mean = new Float32Array(n), sdev = new Float32Array(n);
    var gMin = Infinity, sMax = 0;

    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var x0 = clampi(x - r, 0, w - 1), x1 = clampi(x + r, 0, w - 1);
        var y0 = clampi(y - r, 0, h - 1), y1 = clampi(y + r, 0, h - 1);
        var cnt = (x1 - x0 + 1) * (y1 - y0 + 1);
        var m = box(s1, x0, y0, x1, y1) / cnt;
        var varr = box(s2, x0, y0, x1, y1) / cnt - m * m;
        var sd = Math.sqrt(varr > 0 ? varr : 0);
        mean[y * w + x] = m; sdev[y * w + x] = sd;
        if (sd > sMax) sMax = sd;
        if (src[y * w + x] < gMin) gMin = src[y * w + x];
      }
    }

    if (sMax < 1e-6) sMax = 1;
    var out = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var mi = mean[i];
      var th = (1 - k) * mi + k * gMin + k * (sdev[i] / sMax) * (mi - gMin);
      out[i] = src[i] > th ? 255 : 0;
    }
    return out;
  }

  /* ==========================================================
     Resampling
     ========================================================== */

  function lanczosW(x, a) {
    if (x === 0) return 1;
    var ax = Math.abs(x);
    if (ax >= a) return 0;
    var px = Math.PI * x;
    return a * Math.sin(px) * Math.sin(px / a) / (px * px);
  }

  /* Lanczos-3 on the finished RGBA buffer. Upscale only: the officer needs
     the pixels bigger to read them, never smaller. */
  function resize(img, nw, nh, mode) {
    var w = img.width, h = img.height, src = img.data;
    var out = new ImageData(nw, nh), dst = out.data;
    var sx = w / nw, sy = h / nh, a = 3, x, y, c, i;

    if (mode === "nearest") {
      for (y = 0; y < nh; y++) {
        var syy = clampi(Math.floor(y * sy), 0, h - 1);
        for (x = 0; x < nw; x++) {
          var sxx = clampi(Math.floor(x * sx), 0, w - 1);
          var sp = (syy * w + sxx) * 4, dp = (y * nw + x) * 4;
          dst[dp] = src[sp]; dst[dp + 1] = src[sp + 1]; dst[dp + 2] = src[sp + 2]; dst[dp + 3] = 255;
        }
      }
      return out;
    }

    var tmp = new Float32Array(nw * h * 3);
    for (x = 0; x < nw; x++) {
      var cx = (x + 0.5) * sx - 0.5;
      var i0 = Math.ceil(cx - a), i1 = Math.floor(cx + a);
      var ws = [], idxs = [], tot = 0;
      for (i = i0; i <= i1; i++) {
        var wv = lanczosW(cx - i, a);
        if (!wv) continue;
        ws.push(wv); idxs.push(clampi(i, 0, w - 1)); tot += wv;
      }
      for (y = 0; y < h; y++) {
        var r = 0, g = 0, b = 0;
        for (i = 0; i < ws.length; i++) {
          var q = (y * w + idxs[i]) * 4;
          r += src[q] * ws[i]; g += src[q + 1] * ws[i]; b += src[q + 2] * ws[i];
        }
        var t = (y * nw + x) * 3;
        tmp[t] = r / tot; tmp[t + 1] = g / tot; tmp[t + 2] = b / tot;
      }
    }
    for (y = 0; y < nh; y++) {
      var cy = (y + 0.5) * sy - 0.5;
      var j0 = Math.ceil(cy - a), j1 = Math.floor(cy + a);
      var wy = [], jdx = [], ty = 0;
      for (i = j0; i <= j1; i++) {
        var wv2 = lanczosW(cy - i, a);
        if (!wv2) continue;
        wy.push(wv2); jdx.push(clampi(i, 0, h - 1)); ty += wv2;
      }
      for (x = 0; x < nw; x++) {
        var acc = [0, 0, 0];
        for (i = 0; i < wy.length; i++) {
          var s = (jdx[i] * nw + x) * 3;
          acc[0] += tmp[s] * wy[i]; acc[1] += tmp[s + 1] * wy[i]; acc[2] += tmp[s + 2] * wy[i];
        }
        var d2 = (y * nw + x) * 4;
        for (c = 0; c < 3; c++) dst[d2 + c] = clamp8(acc[c] / ty);
        dst[d2 + 3] = 255;
      }
    }
    return out;
  }

  /* ==========================================================
     Measurements -- published estimators, so the numbers mean
     something to another examiner
     ========================================================== */

  /* Immerkaer's estimate over the whole frame reads whatever detail the
     scene holds as though it were noise: on a plate crop it reported 10.7
     grey levels where the true figure was 2.5. Since the damping and the
     regularisation are both driven by this number, over-reading it makes
     the tool refuse to sharpen. Measuring the quietest tiles instead and
     taking their median gives an estimate that tracks the sensor rather
     than the subject. */
  function noiseSigmaRobust(src, w, h) {
    var tile = 8;
    if (w < tile * 2 || h < tile * 2) return noiseSigma(src, w, h);
    var vals = [], tx, ty, x, y;
    for (ty = 0; ty + tile <= h; ty += tile) {
      for (tx = 0; tx + tile <= w; tx += tile) {
        var sub = new Float32Array(tile * tile);
        for (y = 0; y < tile; y++) {
          for (x = 0; x < tile; x++) sub[y * tile + x] = src[(ty + y) * w + tx + x];
        }
        vals.push(noiseSigma(sub, tile, tile));
      }
    }
    if (!vals.length) return noiseSigma(src, w, h);
    vals.sort(function (a, b) { return a - b; });
    /* The 20th percentile of the per-tile estimates: low enough to sit in
       flat sky or road rather than on the subject, high enough not to be
       one unlucky tile. That order statistic reads 0.828 of the true
       sigma across the calibration set with a 2% spread, so it is scaled
       back up rather than left quietly biased. */
    var idx = Math.min(vals.length - 1, Math.floor(vals.length * 0.20));
    return vals[idx] / 0.828;
  }

  /* Immerkaer's fast noise estimate. */
  function noiseSigma(src, w, h) {
    if (w < 3 || h < 3) return 0;
    var sum = 0, n = 0, x, y;
    for (y = 1; y < h - 1; y++) {
      for (x = 1; x < w - 1; x++) {
        var v = src[(y - 1) * w + x - 1] - 2 * src[(y - 1) * w + x] + src[(y - 1) * w + x + 1]
              - 2 * src[y * w + x - 1] + 4 * src[y * w + x] - 2 * src[y * w + x + 1]
              + src[(y + 1) * w + x - 1] - 2 * src[(y + 1) * w + x] + src[(y + 1) * w + x + 1];
        sum += Math.abs(v); n++;
      }
    }
    return n ? (sum / n) * Math.sqrt(Math.PI / 2) / 6 : 0;
  }

  /* Variance of the Laplacian, measured on a lightly smoothed copy.
     The raw statistic counts sensor noise as detail, so a denoise step
     -- which is the whole point on a night frame -- scores as damage:
     a true improvement on noisy, blurred input measured 0.38x raw and
     1.98x this way, while pure noise still scores no gain either way. */
  function focusScore(src, w, h) {
    return varLap(blur(src, w, h, 0.8), w, h);
  }

  /* Reported before and after so the change is a number, not an impression. */
  function varLap(src, w, h) {
    if (w < 3 || h < 3) return 0;
    var s = 0, s2 = 0, n = 0, x, y;
    for (y = 1; y < h - 1; y++) {
      for (x = 1; x < w - 1; x++) {
        var v = -4 * src[y * w + x] + src[(y - 1) * w + x] + src[(y + 1) * w + x]
              + src[y * w + x - 1] + src[y * w + x + 1];
        s += v; s2 += v * v; n++;
      }
    }
    if (!n) return 0;
    var m = s / n;
    return s2 / n - m * m;
  }

  function boxBlurH(src, w, h, k) {
    var r = k >> 1, out = new Float32Array(w * h), x, y, i;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var acc = 0;
        for (i = -r; i <= r; i++) acc += src[y * w + clampi(x + i, 0, w - 1)];
        out[y * w + x] = acc / (2 * r + 1);
      }
    }
    return out;
  }
  function boxBlurV(src, w, h, k) {
    var r = k >> 1, out = new Float32Array(w * h), x, y, i;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var acc = 0;
        for (i = -r; i <= r; i++) acc += src[clampi(y + i, 0, h - 1) * w + x];
        out[y * w + x] = acc / (2 * r + 1);
      }
    }
    return out;
  }

  /* Crete's no-reference blur metric: re-blur the image and see how little
     changes. ~0.2 is crisp, ~0.7 and above is badly blurred. */
  function blurMetric(src, w, h) {
    if (w < 12 || h < 12) return 0;
    var bh = boxBlurH(src, w, h, 9), bv = boxBlurV(src, w, h, 9);
    var fh = 0, vh = 0, fv = 0, vv = 0, x, y, dF, dB;
    for (y = 0; y < h; y++) {
      for (x = 1; x < w; x++) {
        dF = Math.abs(src[y * w + x] - src[y * w + x - 1]);
        dB = Math.abs(bh[y * w + x] - bh[y * w + x - 1]);
        fh += dF; vh += Math.max(0, dF - dB);
      }
    }
    for (y = 1; y < h; y++) {
      for (x = 0; x < w; x++) {
        dF = Math.abs(src[y * w + x] - src[(y - 1) * w + x]);
        dB = Math.abs(bv[y * w + x] - bv[(y - 1) * w + x]);
        fv += dF; vv += Math.max(0, dF - dB);
      }
    }
    var a = fh ? (fh - vh) / fh : 0, b = fv ? (fv - vv) / fv : 0;
    return Math.max(a, b);
  }

  /* Structure tensor. Motion blur suppresses detail along the direction of
     travel, so the weakest gradient axis is the likely smear direction.
     Scene structure fakes this -- a railing or a shutter is anisotropic
     with no motion at all -- so the ratio is reported as confidence and
     the officer decides. */
  function motionEstimate(src, w, h) {
    var sxx = 0, syy = 0, sxy = 0, x, y;
    for (y = 1; y < h - 1; y++) {
      for (x = 1; x < w - 1; x++) {
        var gx = (src[y * w + x + 1] - src[y * w + x - 1]) / 2;
        /* y measured upwards, so the angle returned here is in the same
           convention as psfMotion. Using screen-down y instead mirrors
           every estimate about the horizontal, and the deblur would then
           smear along the wrong diagonal. */
        var gy = (src[(y - 1) * w + x] - src[(y + 1) * w + x]) / 2;
        sxx += gx * gx; syy += gy * gy; sxy += gx * gy;
      }
    }
    var mid = (sxx + syy) / 2;
    var rad = Math.sqrt(((sxx - syy) / 2) * ((sxx - syy) / 2) + sxy * sxy);
    var lmax = mid + rad, lmin = mid - rad;
    var thMax = 0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI;
    var ang = ((thMax + 90) % 180 + 180) % 180;
    return { angle: ang, ratio: lmin > 1e-6 ? lmax / lmin : 999 };
  }


  /* ==========================================================
     Fourier transform

     Radix-2, in place, over separate real and imaginary planes.
     Needed for cepstral blur estimation, which is the only honest
     way to read a motion smear off an image that also contains
     strong horizontal structure such as a row of characters.
     ========================================================== */

  function fft1d(re, im, n, inverse) {
    var i, j, bit, len, k, s;
    for (i = 1, j = 0; i < n; i++) {
      bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        var tr = re[i]; re[i] = re[j]; re[j] = tr;
        var ti = im[i]; im[i] = im[j]; im[j] = ti;
      }
    }
    for (len = 2; len <= n; len <<= 1) {
      var ang = (inverse ? 2 : -2) * Math.PI / len;
      var wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
      for (s = 0; s < n; s += len) {
        var cr = 1, ci = 0;
        for (k = 0; k < half; k++) {
          var ar = re[s + k], ai = im[s + k];
          var br = re[s + k + half] * cr - im[s + k + half] * ci;
          var bi = re[s + k + half] * ci + im[s + k + half] * cr;
          re[s + k] = ar + br; im[s + k] = ai + bi;
          re[s + k + half] = ar - br; im[s + k + half] = ai - bi;
          var nr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
    if (inverse) for (i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }

  function fft2d(re, im, w, h, inverse) {
    var rr = new Float64Array(w), ri = new Float64Array(w);
    var cr = new Float64Array(h), ci = new Float64Array(h), x, y;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) { rr[x] = re[y * w + x]; ri[x] = im[y * w + x]; }
      fft1d(rr, ri, w, inverse);
      for (x = 0; x < w; x++) { re[y * w + x] = rr[x]; im[y * w + x] = ri[x]; }
    }
    for (x = 0; x < w; x++) {
      for (y = 0; y < h; y++) { cr[y] = re[y * w + x]; ci[y] = im[y * w + x]; }
      fft1d(cr, ci, h, inverse);
      for (y = 0; y < h; y++) { re[y * w + x] = cr[y]; im[y * w + x] = ci[y]; }
    }
  }

  /* Cepstrum of the log magnitude spectrum. A linear smear multiplies the
     spectrum by a sinc, whose periodic zeros become one sharp negative
     spike in the cepstrum, sitting at the smear length along the smear
     direction. Unlike the structure tensor this reads the blur itself
     rather than the scene, so a plate full of horizontal strokes stops
     dragging the estimate towards the horizontal. */
  function cepstralMotion(src, w, h) {
    /* Work in a square power-of-two buffer large enough that the spike can
       actually fall inside the search radius. Taking the biggest square
       that FITS the crop caps the detectable smear at a quarter of the
       shorter side, which on a 154x52 plate is 8 px -- so a real 9 px
       smear was invisible and the search returned noise. Padding instead
       of cropping keeps the whole region and lifts the ceiling. */
    var n = 64;
    while (n < Math.max(w, h) && n < 256) n *= 2;
    if (Math.min(w, h) < 24) return null;

    var cw = Math.min(w, n), ch = Math.min(h, n);
    var x0 = (w - cw) >> 1, y0 = (h - ch) >> 1, x, y, i;

    /* remove the mean so the padding is not itself a step edge */
    var mean = 0;
    for (y = 0; y < ch; y++) for (x = 0; x < cw; x++) mean += src[(y + y0) * w + x + x0];
    mean /= (cw * ch);

    var re = new Float64Array(n * n), im = new Float64Array(n * n);
    var ox = (n - cw) >> 1, oy = (n - ch) >> 1;
    for (y = 0; y < ch; y++) {
      var wy = 0.5 - 0.5 * Math.cos(2 * Math.PI * y / (ch - 1));
      for (x = 0; x < cw; x++) {
        var wx = 0.5 - 0.5 * Math.cos(2 * Math.PI * x / (cw - 1));
        re[(y + oy) * n + (x + ox)] = (src[(y + y0) * w + x + x0] - mean) * wx * wy;
      }
    }

    fft2d(re, im, n, n, false);
    for (i = 0; i < n * n; i++) {
      re[i] = Math.log(1 + Math.sqrt(re[i] * re[i] + im[i] * im[i]));
      im[i] = 0;
    }
    fft2d(re, im, n, n, true);

    var maxR = Math.min(Math.floor(n / 4), 48);
    var best = null, sum = 0, cnt = 0;
    for (y = -maxR; y <= maxR; y++) {
      for (x = 0; x <= maxR; x++) {
        if (x === 0 && y <= 0) continue;
        var r = Math.sqrt(x * x + y * y);
        if (r < 3 || r > maxR) continue;
        var v = re[((y + n) % n) * n + ((x + n) % n)];
        sum += v; cnt++;
        if (!best || v < best.v) best = { v: v, x: x, y: y, r: r };
      }
    }
    if (!best || !cnt) return null;

    var meanV = sum / cnt, dev = 0;
    for (y = -maxR; y <= maxR; y++) {
      for (x = 0; x <= maxR; x++) {
        if (x === 0 && y <= 0) continue;
        var rr = Math.sqrt(x * x + y * y);
        if (rr < 3 || rr > maxR) continue;
        var d = re[((y + n) % n) * n + ((x + n) % n)] - meanV;
        dev += d * d;
      }
    }
    dev = Math.sqrt(dev / cnt);

    /* Depth alone does not mean movement. An out-of-focus disc also puts
       zeros in the spectrum, and they land at the same radius in every
       direction, so a defocused plate produces a cepstral spike just as
       deep as a smeared one -- measured at 8.2 against a real smear's 9.6.
       What separates them is whether the spike stands out from the rest of
       its own ring: a linear smear marks one direction, a disc marks all of
       them. Without this the tool would confidently deblur a focus problem
       as though it were motion, along the wrong axis. */
    var ringSum = 0, ringCnt = 0, ringSq = 0;
    for (y = -maxR; y <= maxR; y++) {
      for (x = -maxR; x <= maxR; x++) {
        var rr2 = Math.sqrt(x * x + y * y);
        if (Math.abs(rr2 - best.r) > 1.0) continue;
        var rv = re[((y + n) % n) * n + ((x + n) % n)];
        ringSum += rv; ringSq += rv * rv; ringCnt++;
      }
    }
    var ringMean = ringCnt ? ringSum / ringCnt : 0;
    var ringSd = ringCnt ? Math.sqrt(Math.max(0, ringSq / ringCnt - ringMean * ringMean)) : 0;
    var directionality = ringSd > 1e-9 ? (ringMean - best.v) / ringSd : 0;

    /* cepstrum y runs down the image, the PSF convention runs up */
    var angle = Math.atan2(-best.y, best.x) * 180 / Math.PI;
    angle = ((angle % 180) + 180) % 180;

    return {
      angle: angle,
      length: Math.round(best.r),
      strength: dev > 1e-9 ? (meanV - best.v) / dev : 0,
      directionality: directionality
    };
  }

  /* ==========================================================
     Deconvolution, properly conditioned
     ========================================================== */

  /* Total-variation regularised Richardson-Lucy (Dey et al. 2006), with
     Biggs-Andrews vector acceleration.

     Plain RL has no idea which of the detail it is creating was in the
     data and which is amplified noise, so past a certain iteration count
     it decorates flat areas with texture that looks like detail. The TV
     term charges the estimate for total gradient, which leaves a genuine
     character stroke alone -- one long edge is cheap -- while refusing to
     pay for speckle. The acceleration reaches the same estimate in
     roughly a third of the iterations, so there is less time to overfit. */
  function richardsonLucyTV(obs, w, h, psf, ps, iters, opts) {
    opts = opts || {};
    var lambda = opts.lambda == null ? 0.002 : opts.lambda;
    var noiseFloor = Math.max(0, opts.noiseFloor || 0);
    var accelerate = opts.accelerate !== false;
    var n = w * h, i, p;

    var flip = new Float32Array(ps * ps);
    for (i = 0; i < ps * ps; i++) flip[i] = psf[ps * ps - 1 - i];

    /* Spatial convolution costs area times kernel squared; through the
       transform it is N log N whatever the kernel. Past a modest kernel
       size the transform wins by enough to matter -- around sevenfold at
       25 px -- and every iteration here performs two convolutions, so the
       larger kernels stop being unaffordable. Small kernels stay in the
       spatial path, where setting up a transform costs more than it
       saves. */
    var useFFT = ps >= 9 && w * h >= 4096;
    var fwd = null, bwd = null;
    if (useFFT) {
      try {
        var conv1 = fftConvolver(w, h, psf, ps);
        fwd = function (p) { return conv1.apply(p, false); };
        bwd = function (p) { return conv1.apply(p, true); };
      } catch (e) { fwd = null; bwd = null; }
    }
    if (!fwd) {
      fwd = function (p) { return convolve(p, w, h, psf, ps); };
      bwd = function (p) { return convolve(p, w, h, flip, ps); };
    }

    var x0 = Float32Array.from(obs);
    var xPrev = Float32Array.from(obs);
    var gPrev = null, gPrev2 = null;

    function tvDivergence(u) {
      /* div( grad u / |grad u| ), the mean curvature */
      var d = new Float32Array(n), xx, yy;
      var eps = 1e-3;
      for (yy = 0; yy < h; yy++) {
        for (xx = 0; xx < w; xx++) {
          var c = u[yy * w + xx];
          var e = u[yy * w + clampi(xx + 1, 0, w - 1)];
          var we = u[yy * w + clampi(xx - 1, 0, w - 1)];
          var s = u[clampi(yy + 1, 0, h - 1) * w + xx];
          var nn = u[clampi(yy - 1, 0, h - 1) * w + xx];
          var se = u[clampi(yy + 1, 0, h - 1) * w + clampi(xx + 1, 0, w - 1)];
          var ne = u[clampi(yy - 1, 0, h - 1) * w + clampi(xx + 1, 0, w - 1)];
          var sw = u[clampi(yy + 1, 0, h - 1) * w + clampi(xx - 1, 0, w - 1)];

          /* forward differences at (x,y) and at the two backward neighbours */
          var gxC = e - c, gyC = s - c;
          var mC = Math.sqrt(gxC * gxC + gyC * gyC + eps);

          var gxW = c - we, gyW = sw - we;
          var mW = Math.sqrt(gxW * gxW + gyW * gyW + eps);

          var gxN = ne - nn, gyN = c - nn;
          var mN = Math.sqrt(gxN * gxN + gyN * gyN + eps);

          d[yy * w + xx] = (gxC / mC - gxW / mW) + (gyC / mC - gyN / mN);
        }
      }
      return d;
    }

    for (var it = 0; it < iters; it++) {
      /* extrapolated starting point */
      var y = x0;
      if (accelerate && gPrev && gPrev2) {
        var num = 0, den = 0;
        for (p = 0; p < n; p++) { num += gPrev[p] * gPrev2[p]; den += gPrev2[p] * gPrev2[p]; }
        var alpha = den > 1e-12 ? num / den : 0;
        if (alpha < 0) alpha = 0;
        if (alpha > 1) alpha = 1;
        if (alpha > 0) {
          y = new Float32Array(n);
          for (p = 0; p < n; p++) {
            var v = x0[p] + alpha * (x0[p] - xPrev[p]);
            y[p] = v < 0 ? 0 : v > 255 ? 255 : v;
          }
        }
      }

      var conv = fwd(y);
      var ratio = new Float32Array(n);
      for (p = 0; p < n; p++) {
        ratio[p] = 1 + (obs[p] - conv[p]) / (conv[p] + noiseFloor + 1e-3);
      }
      var corr = bwd(ratio);

      var next = new Float32Array(n);
      var div = lambda > 0 ? tvDivergence(y) : null;
      for (p = 0; p < n; p++) {
        var reg = div ? 1 - lambda * div[p] : 1;
        if (reg < 0.5) reg = 0.5;
        if (reg > 1.5) reg = 1.5;
        var val = y[p] * corr[p] / reg;
        next[p] = val < 0 ? 0 : val > 255 ? 255 : val;
      }

      var g = new Float32Array(n);
      for (p = 0; p < n; p++) g[p] = next[p] - y[p];
      gPrev2 = gPrev; gPrev = g;
      xPrev = x0; x0 = next;
    }
    return x0;
  }


  /* ==========================================================
     Frequency-domain convolution and deconvolution

     Spatial convolution costs the region area times the square of the
     kernel. A 25 px smear kernel over a full frame is four billion
     operations, which is why large kernels had to be refused. Through
     the Fourier transform the same operation costs N log N whatever the
     kernel size, so the limit disappears and every deconvolution below
     runs at a size the officer actually selected rather than one the
     arithmetic could afford.
     ========================================================== */

  function nextPow2(n) { var p = 1; while (p < n) p <<= 1; return p; }

  /* Mirror the image out to the transform size. The Fourier transform
     convolves circularly, so without this the right edge of the frame
     wraps onto the left and the deconvolution sharpens a seam that does
     not exist. Reflection makes the padded field continuous across the
     wrap. */
  function reflectIndex(i, n) {
    if (n <= 1) return 0;
    var p = 2 * n - 2;
    i = ((i % p) + p) % p;
    return i < n ? i : p - i;
  }

  function padReflect(src, w, h, nw, nh) {
    var out = new Float64Array(nw * nh), x, y, sy;
    for (y = 0; y < nh; y++) {
      sy = reflectIndex(y, h) * w;
      for (x = 0; x < nw; x++) out[y * nw + x] = src[sy + reflectIndex(x, w)];
    }
    return out;
  }

  /* Precompute the kernel spectrum once; an iterative deconvolution uses
     it twice per iteration and it never changes. */
  function fftKernel(psf, ps, nw, nh) {
    var kr = new Float64Array(nw * nh), ki = new Float64Array(nw * nh);
    var r = (ps - 1) >> 1, i, j;
    for (j = 0; j < ps; j++) {
      for (i = 0; i < ps; i++) {
        var y = ((j - r) % nh + nh) % nh, x = ((i - r) % nw + nw) % nw;
        kr[y * nw + x] += psf[j * ps + i];
      }
    }
    fft2d(kr, ki, nw, nh, false);
    return { re: kr, im: ki };
  }

  /* A reusable convolution against a fixed kernel. `conj` applies the
     mirrored kernel, which is what the correction step of Richardson-Lucy
     needs, without building a second spectrum. */
  function fftConvolver(w, h, psf, ps) {
    var nw = nextPow2(w + ps), nh = nextPow2(h + ps);
    var K = fftKernel(psf, ps, nw, nh);
    var n = nw * nh;
    return {
      nw: nw, nh: nh,
      apply: function (src, conj) {
        var re = padReflect(src, w, h, nw, nh), im = new Float64Array(n);
        fft2d(re, im, nw, nh, false);
        var i, a, b, c, d;
        for (i = 0; i < n; i++) {
          a = re[i]; b = im[i]; c = K.re[i]; d = conj ? -K.im[i] : K.im[i];
          re[i] = a * c - b * d;
          im[i] = a * d + b * c;
        }
        fft2d(re, im, nw, nh, true);
        var out = new Float32Array(w * h), x, y;
        for (y = 0; y < h; y++) {
          for (x = 0; x < w; x++) out[y * w + x] = re[y * nw + x];
        }
        return out;
      }
    };
  }

  /* Tikhonov-regularised inverse filter, the closed form the paper sets
     out: F = conj(G) H / (|G|^2 + k). One pass, no iteration, so it is
     fast enough to run while a slider is moving. It rings more than
     Richardson-Lucy does, so it drives the live preview and the iterative
     method still produces what gets saved. */
  function wienerDeconv(obs, w, h, psf, ps, nsr) {
    var nw = nextPow2(w + ps), nh = nextPow2(h + ps), n = nw * nh;
    var K = fftKernel(psf, ps, nw, nh);
    var re = padReflect(obs, w, h, nw, nh), im = new Float64Array(n);
    fft2d(re, im, nw, nh, false);
    var i, a, b, c, d, mag;
    for (i = 0; i < n; i++) {
      a = re[i]; b = im[i]; c = K.re[i]; d = K.im[i];
      mag = c * c + d * d + nsr;
      /* multiply by the conjugate, divide by the regularised power */
      re[i] = (a * c + b * d) / mag;
      im[i] = (b * c - a * d) / mag;
    }
    fft2d(re, im, nw, nh, true);
    var out = new Float32Array(w * h), x, y, v;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        v = re[y * nw + x];
        out[y * w + x] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
    return out;
  }

  /* ==========================================================
     Blind kernel estimation, dark channel prior

     Pan, Sun, Pfister and Yang, CVPR 2016, which is the method the
     paper's "intelligent deblurring" describes. It rests on one
     observation: blurring mixes each pixel with its neighbours, so the
     darkest pixel in any small patch can only get brighter. A sharp
     image therefore has more truly black pixels in its dark channel
     than a blurred one does, and driving that channel back towards zero
     drives the estimate back towards sharpness.

     The kernel it recovers is an arbitrary greyscale patch, not a line
     or a disc, so it can describe a hand shake or a turning vehicle
     that no slider in this tool can express.
     ========================================================== */

  /* Dark channel, and where each minimum came from. The positions are
     needed to push a corrected dark channel back onto the pixels that
     produced it. */
  function darkChannelIdx(src, w, h, radius) {
    var dark = new Float32Array(w * h), idx = new Int32Array(w * h);
    var tmpV = new Float32Array(w * h), tmpI = new Int32Array(w * h);
    var x, y, i, j;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var m = Infinity, mi = y * w + x;
        for (i = -radius; i <= radius; i++) {
          var xx = clampi(x + i, 0, w - 1), v = src[y * w + xx];
          if (v < m) { m = v; mi = y * w + xx; }
        }
        tmpV[y * w + x] = m; tmpI[y * w + x] = mi;
      }
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var m2 = Infinity, mi2 = y * w + x;
        for (j = -radius; j <= radius; j++) {
          var yy = clampi(y + j, 0, h - 1), v2 = tmpV[yy * w + x];
          if (v2 < m2) { m2 = v2; mi2 = tmpI[yy * w + x]; }
        }
        dark[y * w + x] = m2; idx[y * w + x] = mi2;
      }
    }
    return { dark: dark, idx: idx };
  }

  function darkChannel(src, w, h, radius) {
    return darkChannelIdx(src, w, h, radius).dark;
  }

  /* Latent-image step: deconvolve against the current kernel while an L0
     penalty on the gradients keeps only the few edges that carry real
     structure, and an L0 penalty on the dark channel pushes the estimate
     back towards the deep blacks that only a sharp image has. Both are
     solved by half-quadratic splitting, so each sweep is two hard
     thresholds and one division in the frequency domain. */
  function l0Deconv(B, w, h, psf, ps, lambda, muDark) {
    var nw = nextPow2(w + ps), nh = nextPow2(h + ps), n = nw * nh, i, x, y;

    /* Work in unit intensity range. The published lambda and mu are
       defined for images in [0,1]; fed 0-255 data the L0 threshold
       lambda/beta lands around 0.5 while squared gradients run to ten
       thousand, so not one gradient is ever thresholded and the prior
       that is supposed to prevent the kernel collapsing to a single
       point quietly does nothing at all. */
    var B01 = new Float32Array(w * h);
    for (i = 0; i < B01.length; i++) B01[i] = B[i] / 255;
    B = B01;

    var Fb = padReflect(B, w, h, nw, nh), Fbi = new Float64Array(n);
    fft2d(Fb, Fbi, nw, nh, false);
    var K = fftKernel(psf, ps, nw, nh);

    var KtBr = new Float64Array(n), KtBi = new Float64Array(n), K2 = new Float64Array(n);
    for (i = 0; i < n; i++) {
      var a = Fb[i], b = Fbi[i], c = K.re[i], d = K.im[i];
      KtBr[i] = a * c + b * d;
      KtBi[i] = b * c - a * d;
      K2[i] = c * c + d * d;
    }

    var dxr = new Float64Array(n), dxi = new Float64Array(n);
    var dyr = new Float64Array(n), dyi = new Float64Array(n);
    dxr[0] = 1; dxr[nw - 1] = -1;
    dyr[0] = 1; dyr[(nh - 1) * nw] = -1;
    fft2d(dxr, dxi, nw, nh, false);
    fft2d(dyr, dyi, nw, nh, false);
    var Dxy = new Float64Array(n);
    for (i = 0; i < n; i++) {
      Dxy[i] = dxr[i] * dxr[i] + dxi[i] * dxi[i] + dyr[i] * dyr[i] + dyi[i] * dyi[i];
    }

    var S = padReflect(B, w, h, nw, nh);
    var hx = new Float64Array(n), vy = new Float64Array(n), div = new Float64Array(n);
    var beta = 2 * lambda, betaMax = 1e5;
    var useDark = muDark > 0;

    while (beta < betaMax) {
      var thr = lambda / beta;
      for (y = 0; y < nh; y++) {
        for (x = 0; x < nw; x++) {
          var k = y * nw + x;
          var gx = S[y * nw + ((x + 1) % nw)] - S[k];
          var gy = S[((y + 1) % nh) * nw + x] - S[k];
          if (gx * gx + gy * gy < thr) { hx[k] = 0; vy[k] = 0; }
          else { hx[k] = gx; vy[k] = gy; }
        }
      }
      for (y = 0; y < nh; y++) {
        for (x = 0; x < nw; x++) {
          var k2 = y * nw + x;
          div[k2] = (hx[y * nw + ((x - 1 + nw) % nw)] - hx[k2]) +
                    (vy[((y - 1 + nh) % nh) * nw + x] - vy[k2]);
        }
      }
      var Dr = Float64Array.from(div), Di = new Float64Array(n);
      fft2d(Dr, Di, nw, nh, false);

      var Ur = null, Ui = null, muB = 0;
      if (useDark) {
        /* the dark channel of the current estimate, thresholded towards
           zero, scattered back onto the pixels it was taken from */
        var cur = new Float32Array(w * h);
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) cur[y * w + x] = S[y * nw + x];
        var dc = darkChannelIdx(cur, w, h, 5);
        muB = muDark * 4;
        var uthr = Math.sqrt(muDark / muB);
        var scatter = new Float64Array(n);
        for (i = 0; i < w * h; i++) {
          var u = dc.dark[i] < uthr ? 0 : dc.dark[i];
          var src = dc.idx[i];
          var sy = (src / w) | 0, sx = src - sy * w;
          scatter[sy * nw + sx] += u;
        }
        Ur = scatter; Ui = new Float64Array(n);
        fft2d(Ur, Ui, nw, nh, false);
      }

      var outR = new Float64Array(n), outI = new Float64Array(n);
      for (i = 0; i < n; i++) {
        var den = K2[i] + beta * Dxy[i] + muB;
        if (den < 1e-9) den = 1e-9;
        outR[i] = (KtBr[i] + beta * Dr[i] + (useDark ? muB * Ur[i] : 0)) / den;
        outI[i] = (KtBi[i] + beta * Di[i] + (useDark ? muB * Ui[i] : 0)) / den;
      }
      fft2d(outR, outI, nw, nh, true);
      S = outR;
      beta *= 2;
    }

    var res = new Float32Array(w * h);
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var v = S[y * nw + x] * 255;
        res[y * w + x] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
    return res;
  }

  /* Kernel step: least squares in the gradient domain with Tikhonov
     regularisation, solved in the frequency domain. Working on gradients
     rather than intensities is what makes this stable -- it removes the
     flat areas that carry no information about the blur. */
  function estimateKernelStep(latent, blurred, w, h, ps, reg) {
    var nw = nextPow2(w), nh = nextPow2(h), n = nw * nh, i, x, y;

    /* same unit-range convention as the latent step, so the
       regularisation weight means the same thing in both */
    var L01 = new Float32Array(w * h), B01 = new Float32Array(w * h);
    for (i = 0; i < w * h; i++) { L01[i] = latent[i] / 255; B01[i] = blurred[i] / 255; }
    latent = L01; blurred = B01;

    function grads(src) {
      var gx = new Float64Array(n), gy = new Float64Array(n);
      var P = padReflect(src, w, h, nw, nh);
      for (y = 0; y < nh; y++) {
        for (x = 0; x < nw; x++) {
          var k = y * nw + x;
          gx[k] = P[y * nw + ((x + 1) % nw)] - P[k];
          gy[k] = P[((y + 1) % nh) * nw + x] - P[k];
        }
      }
      return { gx: gx, gy: gy };
    }
    var L = grads(latent), B = grads(blurred);

    function F(a) { var re = Float64Array.from(a), im = new Float64Array(n); fft2d(re, im, nw, nh, false); return { re: re, im: im }; }
    var Lx = F(L.gx), Ly = F(L.gy), Bx = F(B.gx), By = F(B.gy);

    var numR = new Float64Array(n), numI = new Float64Array(n), den = new Float64Array(n);
    for (i = 0; i < n; i++) {
      /* conj(L) . B summed over both gradient directions */
      numR[i] = Lx.re[i] * Bx.re[i] + Lx.im[i] * Bx.im[i] +
                Ly.re[i] * By.re[i] + Ly.im[i] * By.im[i];
      numI[i] = Lx.re[i] * Bx.im[i] - Lx.im[i] * Bx.re[i] +
                Ly.re[i] * By.im[i] - Ly.im[i] * By.re[i];
      den[i] = Lx.re[i] * Lx.re[i] + Lx.im[i] * Lx.im[i] +
               Ly.re[i] * Ly.re[i] + Ly.im[i] * Ly.im[i] + reg;
    }
    /* Scale the Tikhonov weight to the gradient energy actually present.
       A fixed constant either swamps a low-contrast crop or fails to
       damp a high-contrast one, and an under-damped solve is what fills
       the kernel with speckle. */
    var maxDen = 0;
    for (i = 0; i < n; i++) if (den[i] > maxDen) maxDen = den[i];
    var extra = reg * maxDen;
    var kr = new Float64Array(n), ki = new Float64Array(n);
    for (i = 0; i < n; i++) {
      var dd = den[i] + extra;
      kr[i] = numR[i] / dd; ki[i] = numI[i] / dd;
    }
    fft2d(kr, ki, nw, nh, true);

    /* pull the centred kernel patch back out of the wrapped result */
    var r = (ps - 1) >> 1, out = new Float32Array(ps * ps), sum = 0, j;
    for (j = 0; j < ps; j++) {
      for (i = 0; i < ps; i++) {
        var yy = ((j - r) % nh + nh) % nh, xx = ((i - r) % nw + nw) % nw;
        var v = kr[yy * nw + xx];
        if (v < 0) v = 0;                       /* a PSF cannot be negative */
        out[j * ps + i] = v; sum += v;
      }
    }
    /* A real point spread function is one connected trace -- the path the
       light took -- not confetti scattered across the patch. Everything
       faint goes, then everything not joined to the brightest blob goes,
       because deconvolving with speckle stamps that speckle onto every
       edge in the picture. */
    var peak = 0;
    for (i = 0; i < out.length; i++) if (out[i] > peak) peak = out[i];
    if (peak <= 0) { out[r * ps + r] = 1; return out; }
    for (i = 0; i < out.length; i++) if (out[i] < peak * 0.08) out[i] = 0;

    var seed = 0;
    for (i = 0; i < out.length; i++) if (out[i] === peak) { seed = i; break; }
    var keep = new Uint8Array(out.length), stack = [seed];
    keep[seed] = 1;
    while (stack.length) {
      var cur = stack.pop(), cy = (cur / ps) | 0, cx = cur - cy * ps, dx, dy;
      for (dy = -1; dy <= 1; dy++) {
        for (dx = -1; dx <= 1; dx++) {
          var ny = cy + dy, nx = cx + dx;
          if (ny < 0 || nx < 0 || ny >= ps || nx >= ps) continue;
          var ni = ny * ps + nx;
          if (keep[ni] || out[ni] <= 0) continue;
          keep[ni] = 1; stack.push(ni);
        }
      }
    }
    sum = 0;
    for (i = 0; i < out.length; i++) {
      if (!keep[i]) out[i] = 0;
      sum += out[i];
    }
    if (sum > 0) for (i = 0; i < out.length; i++) out[i] /= sum;
    else { out[r * ps + r] = 1; }
    return out;
  }

  /* The full blind estimate, over a coarse-to-fine pyramid. Starting
     small keeps the search away from the many wrong answers that fit a
     full-resolution image equally well. */
  function blindKernel(obs, w, h, ps, opts) {
    opts = opts || {};
    var useDark = opts.dark !== false;
    var iters = opts.iters || 5;
    var lambda = opts.lambda == null ? 0.004 : opts.lambda;
    var onStep = opts.onStep;

    if (ps % 2 === 0) ps += 1;

    /* pyramid levels, halving until the kernel is about 3 px */
    var levels = [], scale = 1, kps = ps;
    while (kps > 5 && levels.length < 6) {
      levels.push({ scale: scale, ps: kps });
      scale /= Math.SQRT2;
      kps = Math.max(3, (Math.round(ps * scale) | 1));
      if (levels.length && levels[levels.length - 1].ps === kps) break;
    }
    levels.push({ scale: scale, ps: Math.max(3, kps | 1) });
    levels.reverse();

    function resamplePlane(src, sw, sh, dw, dh) {
      var out = new Float32Array(dw * dh), x, y;
      for (y = 0; y < dh; y++) {
        for (x = 0; x < dw; x++) {
          out[y * dw + x] = bilinearAt(src, sw, sh, (x + 0.5) * sw / dw - 0.5,
                                                     (y + 0.5) * sh / dh - 0.5);
        }
      }
      return out;
    }
    function resampleKernel(k, from, to) {
      var out = new Float32Array(to * to), x, y, s = 0;
      for (y = 0; y < to; y++) {
        for (x = 0; x < to; x++) {
          var v = bilinearAt(k, from, from, (x + 0.5) * from / to - 0.5,
                                             (y + 0.5) * from / to - 0.5);
          if (v < 0) v = 0;
          out[y * to + x] = v; s += v;
        }
      }
      if (s > 0) for (var i = 0; i < out.length; i++) out[i] /= s;
      else out[((to - 1) >> 1) * to + ((to - 1) >> 1)] = 1;
      return out;
    }

    var kernel = null, kSize = 0, step = 0, total = levels.length * iters;

    for (var li = 0; li < levels.length; li++) {
      var lv = levels[li];
      var lw = Math.max(16, Math.round(w * lv.scale));
      var lh = Math.max(16, Math.round(h * lv.scale));
      var B = resamplePlane(obs, w, h, lw, lh);
      var kp = lv.ps;

      if (!kernel) {
        kernel = new Float32Array(kp * kp);
        kernel[((kp - 1) >> 1) * kp + ((kp - 1) >> 1)] = 1;
        kSize = kp;
      } else if (kSize !== kp) {
        kernel = resampleKernel(kernel, kSize, kp);
        kSize = kp;
      }

      for (var it = 0; it < iters; it++) {
        /* deconvolve against the kernel we have, under the priors, then
           re-estimate the kernel from that sharper estimate */
        var latent = l0Deconv(B, lw, lh, kernel, kp, lambda, useDark ? 0.0005 : 0);
        kernel = estimateKernelStep(latent, B, lw, lh, kp, 1e-3);
        step++;
        if (onStep) onStep(step / total);
      }
    }

    /* centre the kernel on its centre of mass, so the deblurred result
       does not come out shifted from the original */
    var cx = 0, cy = 0, tot = 0, i2, j2;
    for (j2 = 0; j2 < kSize; j2++) {
      for (i2 = 0; i2 < kSize; i2++) {
        var v3 = kernel[j2 * kSize + i2];
        cx += i2 * v3; cy += j2 * v3; tot += v3;
      }
    }
    if (tot > 0) {
      cx /= tot; cy /= tot;
      var r2 = (kSize - 1) / 2;
      var sx = Math.round(r2 - cx), sy = Math.round(r2 - cy);
      if (sx || sy) {
        var shifted = new Float32Array(kSize * kSize);
        for (j2 = 0; j2 < kSize; j2++) {
          for (i2 = 0; i2 < kSize; i2++) {
            var ny = j2 + sy, nx = i2 + sx;
            if (ny >= 0 && ny < kSize && nx >= 0 && nx < kSize) {
              shifted[ny * kSize + nx] = kernel[j2 * kSize + i2];
            }
          }
        }
        kernel = shifted;
      }
    }
    return { psf: kernel, ps: kSize };
  }

  /* ==========================================================
     Sub-pixel registration and multi-frame super-resolution
     ========================================================== */

  function bilinearAt(src, w, h, fx, fy) {
    var x0 = Math.floor(fx), y0 = Math.floor(fy);
    var ax = fx - x0, ay = fy - y0;
    var x1 = clampi(x0 + 1, 0, w - 1), y1 = clampi(y0 + 1, 0, h - 1);
    x0 = clampi(x0, 0, w - 1); y0 = clampi(y0, 0, h - 1);
    var a = src[y0 * w + x0], b = src[y0 * w + x1];
    var c = src[y1 * w + x0], d = src[y1 * w + x1];
    return (a * (1 - ax) + b * ax) * (1 - ay) + (c * (1 - ax) + d * ax) * ay;
  }

  /* Gauss-Newton refinement of a translation, to a fraction of a pixel.
     Returns (dx, dy) such that mov sampled at (x+dx, y+dy) matches ref at
     (x, y). Integer alignment is enough to stop stacking from blurring;
     sub-pixel alignment is what makes stacking able to add resolution. */
  function subpixelShift(ref, mov, w, h, guess) {
    var dx = guess ? guess.dx : 0, dy = guess ? guess.dy : 0;
    var pad = 3, x, y, it;
    for (it = 0; it < 12; it++) {
      var sxx = 0, sxy = 0, syy = 0, sxt = 0, syt = 0;
      for (y = pad; y < h - pad; y++) {
        for (x = pad; x < w - pad; x++) {
          var mx = x + dx, my = y + dy;
          if (mx < 1 || my < 1 || mx > w - 2 || my > h - 2) continue;
          var v = bilinearAt(mov, w, h, mx, my);
          var gx = (bilinearAt(mov, w, h, mx + 1, my) - bilinearAt(mov, w, h, mx - 1, my)) / 2;
          var gy = (bilinearAt(mov, w, h, mx, my + 1) - bilinearAt(mov, w, h, mx, my - 1)) / 2;
          var r = ref[y * w + x] - v;
          sxx += gx * gx; sxy += gx * gy; syy += gy * gy;
          sxt += gx * r; syt += gy * r;
        }
      }
      var det = sxx * syy - sxy * sxy;
      if (!isFinite(det) || Math.abs(det) < 1e-9) break;
      var ddx = (syy * sxt - sxy * syt) / det;
      var ddy = (sxx * syt - sxy * sxt) / det;
      if (!isFinite(ddx) || !isFinite(ddy)) break;
      /* a runaway step means the frames do not overlap; keep what we had */
      if (Math.abs(ddx) > 4 || Math.abs(ddy) > 4) break;
      dx += ddx; dy += ddy;
      if (Math.abs(ddx) < 1e-4 && Math.abs(ddy) < 1e-4) break;
    }
    return { dx: dx, dy: dy };
  }

  /* Multi-frame super-resolution by non-uniform interpolation.

     This is the one operation that genuinely creates resolution rather
     than redistributing it, and it does so honestly: several frames of a
     moving subject sample the scene at different sub-pixel offsets, so
     between them they hold measurements the sensor grid of any single
     frame could not record. Placing those measurements on a finer grid
     recovers detail that is really there. It only works when the frames
     actually differ by a fraction of a pixel -- the caller is told the
     spread so it can say when they do not. */
  function superResolve(planes, w, h, shifts, L, opts) {
    var W = w * L, H = h * L;
    var acc = new Float64Array(W * H), wt = new Float64Array(W * H);
    /* 0.2 of a low-res pixel measured best by a clear margin: wider
       splats simply blur away the extra samples that make this worth
       doing at all. Widened below only if the frames leave gaps. */
    var sigma = (opts && opts.splat ? opts.splat : 0.2) * L;
    var inv = 1 / (2 * sigma * sigma);
    var rad = Math.max(1, Math.ceil(sigma * 2.2));
    var f, x, y, i, j;

    for (f = 0; f < planes.length; f++) {
      var sx = shifts[f].dx, sy = shifts[f].dy, src = planes[f];
      for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
          /* this sample sits at reference coordinate (x - dx, y - dy) */
          var hx = (x - sx) * L + (L - 1) / 2;
          var hy = (y - sy) * L + (L - 1) / 2;
          var cx = Math.round(hx), cy = Math.round(hy);
          var val = src[y * w + x];
          for (j = -rad; j <= rad; j++) {
            var py = cy + j;
            if (py < 0 || py >= H) continue;
            var dy2 = (py - hy) * (py - hy);
            for (i = -rad; i <= rad; i++) {
              var px = cx + i;
              if (px < 0 || px >= W) continue;
              var dx2 = (px - hx) * (px - hx);
              var g = Math.exp(-(dx2 + dy2) * inv);
              if (g < 1e-3) continue;
              acc[py * W + px] += val * g;
              wt[py * W + px] += g;
            }
          }
        }
      }
    }

    /* normalised convolution, with interpolation where nothing landed */
    var out = new Float32Array(W * H);
    var holes = 0;
    for (y = 0; y < H; y++) {
      for (x = 0; x < W; x++) {
        var k = y * W + x;
        if (wt[k] > 1e-4) {
          out[k] = acc[k] / wt[k];
        } else {
          holes++;
          out[k] = bilinearAt(planes[0], w, h,
            (x - (L - 1) / 2) / L + shifts[0].dx, (y - (L - 1) / 2) / L + shifts[0].dy);
        }
      }
    }

    /* Too few frames, or shifts that happen to cluster, leave parts of the
       fine grid with no measurement at all. Filling those by interpolation
       is guesswork dressed as data, so widen once and rebuild instead. */
    if (holes > W * H * 0.02 && (!opts || !opts.splat)) {
      return superResolve(planes, w, h, shifts, L, { splat: 0.35 });
    }
    return { plane: out, w: W, h: H, holes: holes };
  }

  /* How much sub-pixel diversity the frames actually carry. Without
     spread there is no extra information and super-resolution would be
     interpolation wearing a better name. */
  function shiftDiversity(shifts) {
    var i, fx, fy, sx = 0, sy = 0, n = shifts.length;
    for (i = 0; i < n; i++) {
      fx = shifts[i].dx - Math.round(shifts[i].dx);
      fy = shifts[i].dy - Math.round(shifts[i].dy);
      sx += Math.abs(fx); sy += Math.abs(fy);
    }
    return (sx + sy) / (2 * n);
  }

  /* The blur that acts on the finer grid: the optical PSF at the new
     scale, then the sensor's own pixel, which integrates over an L by L
     block of it. */
  function scalePsfForGrid(psf, ps, L) {
    var np = ps * L;
    if (np % 2 === 0) np += 1;
    var big = new Float32Array(np * np), i, j, s = 0;
    var c = (np - 1) / 2, pc = (ps - 1) / 2;
    for (j = 0; j < np; j++) {
      for (i = 0; i < np; i++) {
        var fx = (i - c) / L + pc, fy = (j - c) / L + pc;
        var v = bilinearAt(psf, ps, ps, fx, fy);
        big[j * np + i] = v; s += v;
      }
    }
    if (s > 0) for (i = 0; i < big.length; i++) big[i] /= s;

    /* convolve with the L x L pixel footprint */
    var bs = L % 2 === 1 ? L : L + 1;
    var box = new Float32Array(bs * bs);
    var off = (bs - L) >> 1;
    for (j = 0; j < L; j++) for (i = 0; i < L; i++) box[(j + off) * bs + (i + off)] = 1 / (L * L);

    var outSize = np + bs - 1;
    if (outSize % 2 === 0) outSize += 1;
    var out = new Float32Array(outSize * outSize);
    var oc = (outSize - 1) / 2, bc = (bs - 1) / 2, nc = (np - 1) / 2;
    var tot = 0;
    for (j = 0; j < outSize; j++) {
      for (i = 0; i < outSize; i++) {
        var a = 0;
        for (var bj = 0; bj < bs; bj++) {
          for (var bi = 0; bi < bs; bi++) {
            var si = i - oc + nc - (bi - bc), sj = j - oc + nc - (bj - bc);
            if (si < 0 || sj < 0 || si >= np || sj >= np) continue;
            a += big[sj * np + si] * box[bj * bs + bi];
          }
        }
        out[j * outSize + i] = a; tot += a;
      }
    }
    if (tot > 0) for (i = 0; i < out.length; i++) out[i] /= tot;
    return { psf: out, ps: outSize };
  }

  /* ==========================================================
     Perspective rectification

     A plate photographed from the side is a trapezium, and every
     character is sheared by a different amount. Warping the four corners
     back to a rectangle is a geometric correction, not an invention: it
     rearranges the samples that are already there and makes the strokes
     comparable to one another.
     ========================================================== */

  function homography(src, dst) {
    /* solve the 8 unknowns of the projective map src -> dst */
    var A = [], b = [], i;
    for (i = 0; i < 4; i++) {
      var x = src[i][0], y = src[i][1], u = dst[i][0], v = dst[i][1];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    /* Gaussian elimination with partial pivoting */
    var n = 8, j, k;
    for (i = 0; i < n; i++) {
      var piv = i;
      for (k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k;
      if (Math.abs(A[piv][i]) < 1e-12) return null;
      var tA = A[i]; A[i] = A[piv]; A[piv] = tA;
      var tb = b[i]; b[i] = b[piv]; b[piv] = tb;
      for (k = i + 1; k < n; k++) {
        var f = A[k][i] / A[i][i];
        for (j = i; j < n; j++) A[k][j] -= f * A[i][j];
        b[k] -= f * b[i];
      }
    }
    var h = new Array(9);
    for (i = n - 1; i >= 0; i--) {
      var s = b[i];
      for (j = i + 1; j < n; j++) s -= A[i][j] * h[j];
      h[i] = s / A[i][i];
    }
    h[8] = 1;
    return h;
  }

  function rectify(src, w, h, corners, outW, outH) {
    /* map the output rectangle back into the source */
    var dst = [[0, 0], [outW - 1, 0], [outW - 1, outH - 1], [0, outH - 1]];
    var H = homography(dst, corners);
    if (!H) return null;
    var out = new Float32Array(outW * outH), x, y;
    for (y = 0; y < outH; y++) {
      for (x = 0; x < outW; x++) {
        var d = H[6] * x + H[7] * y + H[8];
        if (Math.abs(d) < 1e-12) { out[y * outW + x] = 0; continue; }
        var sx = (H[0] * x + H[1] * y + H[2]) / d;
        var sy = (H[3] * x + H[4] * y + H[5]) / d;
        out[y * outW + x] = bilinearAt(src, w, h, sx, sy);
      }
    }
    return { plane: out, w: outW, h: outH };
  }

  /* ==========================================================
     Frame stacking
     ========================================================== */

  /* Integer translation search. Handheld re-photography and slow-shutter
     CCTV both drift a pixel or two between frames; stacking without
     aligning first just blurs everything further. */
  function bestOffset(ref, mov, w, h, maxShift) {
    var best = { dx: 0, dy: 0, err: Infinity }, dx, dy, x, y;
    var step = w * h > 120000 ? 3 : 2;
    var m = maxShift;
    for (dy = -m; dy <= m; dy++) {
      for (dx = -m; dx <= m; dx++) {
        var err = 0, n = 0;
        for (y = m; y < h - m; y += step) {
          for (x = m; x < w - m; x += step) {
            var d = ref[y * w + x] - mov[(y + dy) * w + (x + dx)];
            err += d * d; n++;
          }
        }
        if (n && err / n < best.err) best = { dx: dx, dy: dy, err: err / n };
      }
    }
    return best;
  }

  function stackPlanes(planes, w, h, mode, maxShift, log) {
    var n = planes.length, i, x, y;
    if (n === 1) return planes[0];
    var aligned = [planes[0]];
    for (i = 1; i < n; i++) {
      var off = bestOffset(planes[0], planes[i], w, h, maxShift);
      var shifted = new Float32Array(w * h);
      for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
          shifted[y * w + x] = planes[i][clampi(y + off.dy, 0, h - 1) * w + clampi(x + off.dx, 0, w - 1)];
        }
      }
      aligned.push(shifted);
      if (log) log.push("Frame " + (i + 1) + " aligned to frame 1 by dx " + off.dx + ", dy " + off.dy + " px");
    }
    var out = new Float32Array(w * h);
    if (mode === "median") {
      var buf = new Float32Array(n);
      for (i = 0; i < w * h; i++) {
        for (var j = 0; j < n; j++) buf[j] = aligned[j][i];
        var s = Array.prototype.slice.call(buf).sort(function (a, b) { return a - b; });
        out[i] = n % 2 ? s[(n - 1) >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2;
      }
    } else {
      for (i = 0; i < w * h; i++) {
        var acc = 0;
        for (var k = 0; k < n; k++) acc += aligned[k][i];
        out[i] = acc / n;
      }
    }
    return out;
  }

  /* ==========================================================
     Tool
     ========================================================== */

  TK.reg({
    id: "enhance",
    name: "CCTV Image Enhancer",
    cluster: "movement",
    tier: 1,
    desc: "Recover readable detail from a blurred or dark CCTV still without inventing anything.",
    render: function (root) {
      var S = {
        frames: [],          /* { name, size, hash, img: ImageData, el } */
        w: 0, h: 0,
        roi: null,           /* { x, y, w, h } in image pixels */
        drag: null,
        result: null,        /* { canvas, log, before, after } */
        busy: false,
        previewTimer: null,
        pendingPreview: false,
        aiSession: null,
        aiModelPromise: null
      };

      root.innerHTML =
        '<div class="card">' +
          '<div class="drop" id="ie-drop"><div class="big"></div>' +
          "<div>Drop the CCTV still, or <b>browse</b></div>" +
          '<div class="xs muted" style="margin-top:6px">Several frames of the same scene can be stacked. ' +
          "Everything is processed on this computer and nothing is uploaded.</div></div>" +
        "</div>" +
        '<div class="ie-load" id="ie-load" role="status" aria-live="polite" hidden>' +
          '<span class="spinner" aria-hidden="true"></span><div class="ie-load-copy">' +
          '<b id="ie-load-title">Loading image</b><span id="ie-load-detail"></span></div>' +
          '<div class="ie-progress"><i id="ie-progress-bar"></i></div></div>' +
        '<div class="ie-busy-overlay" id="ie-busy" role="status" aria-live="assertive" hidden>' +
          '<div class="ie-busy-card"><span class="spinner ie-busy-spinner" aria-hidden="true"></span>' +
          '<div><b id="ie-busy-title">Working</b><span id="ie-busy-detail"></span></div></div></div>' +
        '<div id="ie-body"></div>';

      TK.dropzone($("#ie-drop"), function (files) { load(files); },
        { multiple: true, accept: "image/*" });

      /* ---- loading ------------------------------------------ */

      function showBusy(title, detail) {
        var box = $("#ie-busy");
        if (!box) return;
        box.hidden = false;
        $("#ie-busy-title").textContent = title || "Working";
        $("#ie-busy-detail").textContent = detail || "";
      }

      function hideBusy() {
        var box = $("#ie-busy");
        if (box) box.hidden = true;
      }

      function setLoadState(title, detail, pct) {
        var box = $("#ie-load");
        if (!box) return;
        box.hidden = false;
        $("#ie-load-title").textContent = title || "Loading image";
        $("#ie-load-detail").textContent = detail || "";
        $("#ie-progress-bar").style.width = clampi(pct || 0, 0, 100) + "%";
        showBusy(title || "Loading image", detail || "");
      }

      function hideLoadState() {
        var box = $("#ie-load");
        if (box) box.hidden = true;
        hideBusy();
      }

      function setStatus(text, active) {
        var el = $("#ie-status");
        if (!el) return;
        el.innerHTML = (active ? '<span class="spinner ie-status-spinner" aria-hidden="true"></span>' : "") + esc(text || "");
        if (active) showBusy("Processing image", text || "Working…");
        else hideBusy();
      }

      function load(files) {
        files = files.filter(function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|bmp|webp|gif)$/i.test(f.name); });
        if (!files.length) { TK.toast("That is not an image file", "danger"); return; }
        if (files.length > 12) { files = files.slice(0, 12); TK.toast("Using the first 12 frames", "warn"); }

        S.frames = []; S.roi = null; S.result = null; S.frameNoiseCached = null; S.blindPsf = null;
        S.hist = []; S.histAt = -1; S.restoring = false;
        setLoadState("Loading CCTV image", "Reading " + files.length + " frame" + (files.length === 1 ? "" : "s") + "…", 5);
        var pending = files.length, out = [];
        var completed = 0;

        function completeOne() {
          completed++;
          setLoadState("Loading CCTV image", "Decoded " + completed + " of " + files.length + " frame" + (files.length === 1 ? "" : "s") + "…", 5 + completed / files.length * 60);
          if (--pending === 0) ready(out);
        }

        files.forEach(function (f, i) {
          var fr = new FileReader();
          fr.onload = function () {
            var url = fr.result;
            var im = new Image();
            im.onload = function () {
              var c = document.createElement("canvas");
              c.width = im.naturalWidth; c.height = im.naturalHeight;
              c.getContext("2d").drawImage(im, 0, 0);
              var data;
              try {
                data = c.getContext("2d").getImageData(0, 0, c.width, c.height);
              } catch (e) {
                TK.toast("This browser blocked reading the pixels of that file", "danger");
                completeOne();
                return;
              }
              out[i] = { name: f.name, size: f.size, img: data, el: im, hash: null };
              hashFile(f, out[i]);
              completeOne();
            };
            im.onerror = function () {
              TK.toast("Could not decode " + f.name, "danger");
              completeOne();
            };
            im.src = url;
          };
          fr.onerror = function () { completeOne(); };
          fr.readAsDataURL(f);
        });
      }

      /* The original file must be able to prove it was never altered. Hash
         it as it arrived, before anything touches the pixels. */
      function hashFile(file, rec) {
        if (!TK.sha256hex) return;
        var fr = new FileReader();
        fr.onload = function () {
          try {
            rec.hash = TK.sha256hex(new Uint8Array(fr.result));
            var el = $("#ie-hash-" + rec.idx);
            if (el) el.textContent = rec.hash;
          } catch (e) { /* a very large file is not worth failing the tool over */ }
        };
        fr.readAsArrayBuffer(file);
      }

      function ready(list) {
        S.frames = list.filter(Boolean);
        if (!S.frames.length) {
          setLoadState("Could not load image", "No readable pixels were found in the selected file.", 100);
          return;
        }
        setLoadState("Preparing enhancement", "Checking frame sizes and measuring blur…", 78);
        S.frames.forEach(function (f, i) { f.idx = i; });

        var f0 = S.frames[0];
        S.w = f0.img.width; S.h = f0.img.height;

        var mismatch = S.frames.filter(function (f) {
          return f.img.width !== S.w || f.img.height !== S.h;
        });
        if (mismatch.length) {
          S.frames = S.frames.filter(function (f) { return f.img.width === S.w && f.img.height === S.h; });
          TK.toast(mismatch.length + " frame(s) of a different size were dropped", "warn");
          if (!S.frames.length) {
            setLoadState("Frames have different sizes", "Load frames with matching dimensions to continue.", 100);
            return;
          }
        }

        S.roi = { x: 0, y: 0, w: S.w, h: S.h };
        seedCorners();
        buildUI();
        /* Do not launch an expensive full-frame deconvolution for a large
           still. If a bright plate-like rectangle is present, start there;
           otherwise leave the normal auto preset available after loading. */
        var initialPlate = S.w * S.h > 400000 ? detectPlateROI() : null;
        if (initialPlate) {
          S.roi = initialPlate;
          drawSource();
          measure();
          applyPreset("plate");
          TK.$$("#ie-presets button").forEach(function (b) {
            b.classList.toggle("on", b.getAttribute("data-p") === "plate");
          });
        } else {
          measure();
          autoPreset();
        }
        hideLoadState();
        run();
      }

      /* ---- interface ---------------------------------------- */

      var HELP = {
        "ie-chan": "Choose the image plane to process. Luminance is normal; green is often cleaner; red can help infrared CCTV.",
        "ie-deblur": "Optical defocus is for out-of-focus footage. Movement is for a linear smear. Off skips deconvolution.",
        "ie-ai": "NAFNet runs locally on a 512 px copy of the selected region. It can make inspection easier, but its learned pixels are not proof of a character and must be corroborated against the original or other frames.",
        "ie-denoise": "Increase to remove more random grain, at the risk of softening faint strokes. Decrease to retain more texture and noise.",
        "ie-focus": "Increase when the optical blur circle is larger. Stop before bright or dark halos form; decrease for a gentler correction.",
        "ie-mlen": "Increase for a longer movement smear. Decrease for a shorter smear. Match it to the distance an edge travelled.",
        "ie-mang": "Increase rotates the assumed movement direction clockwise. Decrease rotates it counter-clockwise.",
        "ie-iter": "Increase gives stronger recovery but takes longer and can amplify artifacts. Decrease is faster and more conservative.",
        "ie-noise": "Increase to suppress noise and ringing, which can hide weak strokes. Decrease to expose weak edges, with more noise risk.",
        "ie-clahe": "Increase local contrast to reveal faint characters. Decrease for a flatter, less noisy result.",
        "ie-clip": "Increase permits stronger local contrast and more visible grain. Decrease limits contrast amplification.",
        "ie-gamma": "Increase darkens midtones. Decrease brightens shadows and midtones.",
        "ie-sharp": "Increase edge contrast, which can make halos. Decrease for a softer, more natural result.",
        "ie-zoom": "Increase display magnification for inspection; it does not create new image detail. Decrease for a smaller output.",
        "ie-stack": "Average reduces random noise; median rejects changing pixels. Use the first frame only when the subject moves between frames.",
        "ie-autolevel": "On stretches the visible tonal range; off preserves the original luminance range.",
        "ie-binar": "On produces a black-and-white character view and discards tonal detail; off preserves shades of grey.",
        "ie-invert": "On reverses dark and light values for inspection; off keeps normal polarity.",
        "ie-pixel": "On uses hard-pixel scaling; off uses smoother Lanczos interpolation. Neither adds information."
      };

      function hint(key) {
        var text = HELP[key];
        if (!text) return "";
        return '<span class="ie-help" tabindex="0" aria-label="' + esc(text) + '">?' +
          '<span class="ie-tooltip" role="tooltip">' + esc(text) + "</span></span>";
      }

      function labelText(label, key) {
        return '<span class="ie-label-text">' + esc(label) + hint(key) + "</span>";
      }

      function ctl(id, label, min, max, step, val) {
        return '<div class="enh-ctl"><label class="lbl" for="' + id + '">' + labelText(label, id) +
          '<b class="enh-val" id="' + id + '-v"></b></label>' +
          '<input type="range" id="' + id + '" min="' + min + '" max="' + max +
          '" step="' + step + '" value="' + val + '"></div>';
      }

      function buildUI() {
        var multi = S.frames.length > 1;
        var h = "";

        h += '<div class="card"><h3>Source</h3>' +
          '<div class="enh-canvaswrap"><canvas id="ie-src"></canvas></div>' +
          '<div class="row" style="margin-top:12px;flex-wrap:wrap;gap:8px">' +
          '<span class="xs muted" id="ie-roi-label"></span>' +
          '<button class="btn sm ghost" id="ie-roi-all">Whole frame</button>' +
          '<button class="btn sm ghost" id="ie-find-plate">Find bright plate</button>' +
          "</div>" +
          '<p class="xs muted" style="margin-top:8px">Drag a box over the number plate, the face or ' +
          "whatever must be read. Working on a small region is faster and gives a better result, " +
          "because the settings are then tuned to that patch and not to the whole scene.</p>" +
          '<div id="ie-frames"></div></div><div class="ie-workbench"><div class="ie-settings-col">';

        h += '<div class="card"><h3>Measurements</h3><div id="ie-meas"></div></div>';

        h += '<div class="card"><h3>Enhancement</h3>' +
          '<div class="seg" id="ie-presets" style="margin-bottom:14px;flex-wrap:wrap">' +
          '<button data-p="auto" class="on">Auto</button>' +
          '<button data-p="plate">Number plate</button>' +
          '<button data-p="face">Face</button>' +
          '<button data-p="night">Low light</button>' +
          '<button data-p="motion">Motion blur</button>' +
          "</div>";

        if (multi) {
          h += '<div class="field"><label class="lbl" for="ie-stack">' + labelText("Frame stacking (" +
            S.frames.length + " frames)", "ie-stack") + "</label>" +
            '<select id="ie-stack">' +
            '<option value="super">Super-resolution - registers the frames to a fraction of a pixel and recovers real extra detail</option>' +
            '<option value="mean">Average - cuts random noise by the square root of the frame count</option>' +
            '<option value="median">Median - removes anything that appears in only some frames</option>' +
            '<option value="none">Use the first frame only</option>' +
            "</select></div>";
        }

        h += '<div class="enh-grid">' +
          '<div class="field"><label class="lbl" for="ie-chan">' + labelText("Working channel", "ie-chan") + "</label>" +
          '<select id="ie-chan">' +
          '<option value="luma">Luminance (normal)</option>' +
          '<option value="r">Red only (night IR cameras)</option>' +
          '<option value="g">Green only (usually the least noisy)</option>' +
          '<option value="b">Blue only</option>' +
          "</select></div>" +
          '<div class="field"><label class="lbl" for="ie-deblur">' + labelText("Deblur model", "ie-deblur") + "</label>" +
          '<select id="ie-deblur">' +
          '<option value="off">Off</option>' +
          '<option value="auto">Estimated from the image</option>' +
          '<option value="defocus">Optical defocus (circular PSF)</option>' +
          '<option value="motion">Movement</option>' +
          "</select></div>" +
          '<div class="field"><label class="lbl" for="ie-ai">' + labelText("AI-assisted inspection", "ie-ai") + "</label>" +
          '<select id="ie-ai">' +
          '<option value="off">Off — measured enhancement only</option>' +
          '<option value="nafnet">NAFNet local deblur — review aid</option>' +
          "</select><p class=\"xs muted ie-ai-note\" id=\"ie-ai-note\" hidden>Runs locally on this device. AI output can contain plausible but unverified strokes; do not use it alone to read or identify a plate.</p></div>" +
          "</div>";

        h += '<div class="enh-grid">' +
          ctl("ie-denoise", "Denoise", 0, 100, 5, 0) +
          ctl("ie-focus", "Optical blur size", 2, 60, 1, 10) +
          ctl("ie-mlen", "Movement length", 3, 25, 1, 9) +
          ctl("ie-mang", "Movement angle", 0, 179, 1, 0) +
          ctl("ie-iter", "Deblur iterations", 4, 60, 1, 18) +
          ctl("ie-noise", "Deblur noise threshold", 0, 30, 1, 4) +
          ctl("ie-clahe", "Local contrast", 0, 100, 5, 0) +
          ctl("ie-clip", "Contrast limit", 10, 60, 2, 25) +
          ctl("ie-gamma", "Brightness", 40, 220, 5, 100) +
          ctl("ie-sharp", "Edge sharpening", 0, 250, 10, 0) +
          ctl("ie-zoom", "Magnification", 1, 8, 1, 2) +
          "</div>";

        h += '<div class="row" style="gap:16px;flex-wrap:wrap;margin-top:4px">' +
          '<label class="check"><input type="checkbox" id="ie-autolevel" checked> Stretch to full range' + hint("ie-autolevel") + "</label>" +
          '<label class="check"><input type="checkbox" id="ie-binar"> Two-tone (for reading characters)' + hint("ie-binar") + "</label>" +
          '<label class="check"><input type="checkbox" id="ie-invert"> Invert' + hint("ie-invert") + "</label>" +
          '<label class="check"><input type="checkbox" id="ie-persp"> Correct perspective</label>' +
          '<label class="check"><input type="checkbox" id="ie-pixel"> Show hard pixels' + hint("ie-pixel") + "</label>" +
          "</div>";

        h += '<div class="row" style="margin-top:16px;gap:8px;flex-wrap:wrap">' +
          '<button class="btn" id="ie-run">Enhance</button>' +
          '<button class="btn ghost" id="ie-auto">Estimate the blur</button>' +
          '<button class="btn ghost" id="ie-sweep">Compare deblur settings</button>' +
          '<button class="btn ghost" id="ie-undo" title="Undo the last change">Undo</button>' +
          '<button class="btn ghost" id="ie-redo" title="Redo">Redo</button>' +
          '<button class="btn ghost" id="ie-reset">Start again</button>' +
          '<span class="xs muted" id="ie-hist"></span>' +
          '<span class="xs muted" id="ie-status"></span>' +
          "</div>" +
          '<div id="ie-sweep-out"></div></div></div>';

        h += '<div class="ie-output-col"><div class="card"><h3>Result</h3>' +
          '<div class="enh-cmp" id="ie-cmp"><div class="enh-stage" id="ie-stage">' +
          '<canvas id="ie-before"></canvas>' +
          '<div class="enh-clip" id="ie-clipwrap"><canvas id="ie-after"></canvas></div>' +
          '<div class="enh-handle" id="ie-handle"><i></i></div>' +
          "</div></div>" +
          '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">' +
          '<span class="xs muted">Drag the divider. Left is the original at the same magnification, ' +
          "right is the enhanced version.</span></div>" +
          '<div id="ie-after-stats" style="margin-top:14px"></div>' +
          '<div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">' +
          '<button class="btn" id="ie-savecase">Save for the case file</button>' +
          '<button class="btn sm ghost" id="ie-save">Image only</button>' +
          '<span class="xs muted">Saves the enhanced image and the record of how it was produced.</span>' +
          "</div>" +
          /* The record is what makes the image usable later: it lets another
             examiner start from the original file and arrive here. Folded
             away so it does not crowd the work, never optional. */
          '<details class="guide" style="margin-top:16px"><summary>How this image was produced</summary>' +
          '<div class="guide-in"><pre class="out" id="ie-log"></pre>' +
          '<p class="xs muted">Attach this alongside the enhanced still. Keep the original file ' +
          "unaltered; its hash is recorded above.</p></div></details>" +
          "</div></div></div>";

        $("#ie-body").innerHTML = h;

        drawSource();
        frameStrip();
        wire();
      }

      function frameStrip() {
        var h = '<div class="enh-frames">';
        S.frames.forEach(function (f, i) {
          h += '<div class="enh-frame"><div class="mono xs">' + esc(f.name) + "</div>" +
            '<div class="xs muted">' + f.img.width + " x " + f.img.height + ", " +
            TK.fmtBytes(f.size) + "</div>" +
            '<div class="xs muted mono">SHA-256 <span id="ie-hash-' + i + '">' +
            (f.hash ? esc(f.hash) : "computing...") + "</span></div></div>";
        });
        h += "</div>";
        $("#ie-frames").innerHTML = h;
      }

      /* ---- source canvas and region selection ---------------- */

      var VIEW_MAX = 760;

      function viewScale() {
        return Math.min(1, VIEW_MAX / S.w);
      }

      /* Corner handles, in image pixels, clockwise from top left. They
         start on the selection so a rectangle needs no adjustment at all. */
      function seedCorners() {
        var q = S.roi;
        S.corners = [[q.x, q.y], [q.x + q.w, q.y],
                     [q.x + q.w, q.y + q.h], [q.x, q.y + q.h]];
      }

      function perspOn() {
        var el = $("#ie-persp");
        return !!(el && el.checked && S.corners);
      }

      /* the rectified output keeps the average length of each opposite
         pair, so nothing is stretched more than the quad implies */
      function rectSize() {
        var c = S.corners;
        function d(a, b) { return Math.hypot(c[a][0] - c[b][0], c[a][1] - c[b][1]); }
        return {
          w: Math.max(16, Math.round((d(0, 1) + d(3, 2)) / 2)),
          h: Math.max(16, Math.round((d(0, 3) + d(1, 2)) / 2))
        };
      }

      function drawSource() {
        var c = $("#ie-src"); if (!c) return;
        var s = viewScale();
        c.width = Math.round(S.w * s); c.height = Math.round(S.h * s);
        var ctx = c.getContext("2d");
        ctx.drawImage(S.frames[0].el, 0, 0, c.width, c.height);

        if (S.roi && !(S.roi.x === 0 && S.roi.y === 0 && S.roi.w === S.w && S.roi.h === S.h)) {
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,.45)";
          ctx.fillRect(0, 0, c.width, c.height);
          var rx = S.roi.x * s, ry = S.roi.y * s, rw = S.roi.w * s, rh = S.roi.h * s;
          ctx.clearRect(rx, ry, rw, rh);
          ctx.drawImage(S.frames[0].el, S.roi.x, S.roi.y, S.roi.w, S.roi.h, rx, ry, rw, rh);
          ctx.strokeStyle = "#A78BFA"; ctx.lineWidth = 2;
          ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);
          ctx.restore();
        }

        if (perspOn()) {
          ctx.save();
          ctx.strokeStyle = "#F59E0B"; ctx.lineWidth = 2;
          ctx.beginPath();
          S.corners.forEach(function (p, i) {
            var px = p[0] * s, py = p[1] * s;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          });
          ctx.closePath(); ctx.stroke();
          S.corners.forEach(function (p) {
            ctx.beginPath();
            ctx.arc(p[0] * s, p[1] * s, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#F59E0B"; ctx.fill();
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
          });
          ctx.restore();
        }

        var lbl = $("#ie-roi-label");
        if (lbl) {
          var full = S.roi.w === S.w && S.roi.h === S.h;
          lbl.textContent = full
            ? "Whole frame, " + S.w + " x " + S.h + " px"
            : "Selection " + S.roi.w + " x " + S.roi.h + " px at " + S.roi.x + ", " + S.roi.y;
        }
      }

      function wireROI() {
        var c = $("#ie-src");
        function pt(ev) {
          var r = c.getBoundingClientRect();
          var s = viewScale() * (c.clientWidth / c.width || 1);
          return {
            x: clampi(Math.round((ev.clientX - r.left) / s), 0, S.w),
            y: clampi(Math.round((ev.clientY - r.top) / s), 0, S.h)
          };
        }
        c.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          c.setPointerCapture(ev.pointerId);
          var p = pt(ev);
          S.corner = -1;
          if (perspOn()) {
            /* grabbing a handle takes priority over starting a new box */
            var grab = Math.max(8, 14 / (viewScale() || 1));
            for (var i = 0; i < 4; i++) {
              if (Math.hypot(S.corners[i][0] - p.x, S.corners[i][1] - p.y) < grab) { S.corner = i; break; }
            }
          }
          S.drag = p;
        });
        c.addEventListener("pointermove", function (ev) {
          if (!S.drag) return;
          var p = pt(ev);
          if (S.corner >= 0) {
            S.corners[S.corner] = [p.x, p.y];
            drawSource();
            return;
          }
          S.roi = {
            x: Math.min(S.drag.x, p.x), y: Math.min(S.drag.y, p.y),
            w: Math.abs(p.x - S.drag.x), h: Math.abs(p.y - S.drag.y)
          };
          drawSource();
        });
        c.addEventListener("pointerup", function () {
          if (!S.drag) return;
          var wasCorner = S.corner >= 0;
          S.drag = null; S.corner = -1;
          if (!wasCorner) {
            if (S.roi.w < 8 || S.roi.h < 8) S.roi = { x: 0, y: 0, w: S.w, h: S.h };
            seedCorners();
          }
          drawSource();
          measure();
          if (!wasCorner && $("#ie-presets .on")) applyPreset($("#ie-presets .on").getAttribute("data-p"));
          run();
        });
      }

      /* ---- controls ----------------------------------------- */

      var FMT = {
        "ie-denoise": function (v) { return v === 0 ? "off" : v + "%"; },
        "ie-focus": function (v) { return v + " px"; },
        "ie-mlen": function (v) { return v + " px"; },
        "ie-mang": function (v) { return v + " deg"; },
        "ie-iter": function (v) { return v + ""; },
        "ie-noise": function (v) { return v === 0 ? "off" : v + " grey levels"; },
        "ie-clahe": function (v) { return v === 0 ? "off" : v + "%"; },
        "ie-clip": function (v) { return (v / 10).toFixed(1); },
        "ie-gamma": function (v) { return (v / 100).toFixed(2); },
        "ie-sharp": function (v) { return v === 0 ? "off" : v + "%"; },
        "ie-zoom": function (v) { return v + "x"; }
      };

      function num(id) { return parseFloat($(id).value); }

      function syncLabels() {
        Object.keys(FMT).forEach(function (id) {
          var el = $("#" + id), lab = $("#" + id + "-v");
          if (el && lab) lab.textContent = FMT[id](parseFloat(el.value));
        });

        var mode = $("#ie-deblur").value;
        $("#ie-focus").closest(".enh-ctl").style.display = mode === "defocus" ? "" : "none";
        $("#ie-mlen").closest(".enh-ctl").style.display = mode === "motion" ? "" : "none";
        $("#ie-mang").closest(".enh-ctl").style.display = mode === "motion" ? "" : "none";
        $("#ie-iter").closest(".enh-ctl").style.display = mode === "off" ? "none" : "";
        $("#ie-clip").closest(".enh-ctl").style.display = num("#ie-clahe") > 0 ? "" : "none";

        var aiOn = $("#ie-ai") && $("#ie-ai").value === "nafnet";
        $("#ie-ai-note").hidden = !aiOn;
        $("#ie-run").textContent = aiOn ? "Run AI-assisted restore" : "Enhance";
        $("#ie-sweep").disabled = aiOn;
      }

      function wire() {
        wireROI();

        $("#ie-roi-all").onclick = function () {
          S.roi = { x: 0, y: 0, w: S.w, h: S.h };
          drawSource(); measure(); run();
        };

        TK.$$("#ie-presets button").forEach(function (b) {
          b.onclick = function () {
            TK.$$("#ie-presets button").forEach(function (x) { x.classList.remove("on"); });
            b.classList.add("on");
            var preset = b.getAttribute("data-p");
            if (preset === "plate" && S.roi.x === 0 && S.roi.y === 0 && S.roi.w === S.w && S.roi.h === S.h) {
              selectPlateROI();
            }
            applyPreset(preset);
            run();
          };
        });

        Object.keys(FMT).forEach(function (id) {
          var el = $("#" + id);
          el.oninput = function () { syncLabels(); markManual(); schedulePreview(160); };
          el.onchange = function () { markManual(); schedulePreview(0); };
        });
        $("#ie-find-plate").onclick = function () {
          if (selectPlateROI()) {
            applyPreset("plate");
            run();
          }
        };
        ["ie-chan", "ie-deblur", "ie-stack"].forEach(function (id) {
          var el = $("#" + id);
          if (el) el.onchange = function () { syncLabels(); markManual(); schedulePreview(0); };
        });
        $("#ie-ai").onchange = function () {
          syncLabels(); markManual();
          if ($("#ie-ai").value === "nafnet") {
            TK.toast("AI-assisted mode is a local review aid, not a character-identification result", "warn");
          }
        };
        $("#ie-persp").onchange = function () {
          if ($("#ie-persp").checked) seedCorners();
          drawSource(); measure(); markManual(); run();
        };
        ["ie-autolevel", "ie-binar", "ie-invert", "ie-pixel"].forEach(function (id) {
          $("#" + id).onchange = function () { markManual(); schedulePreview(0); };
        });

        $("#ie-run").onclick = function () { run(true); };
        $("#ie-undo").onclick = undo;
        $("#ie-redo").onclick = redo;
        $("#ie-auto").onclick = estimateBlur;
        $("#ie-sweep").onclick = function () { sweep(); };
        $("#ie-reset").onclick = function () {
          TK.$$("#ie-presets button").forEach(function (x, i) { x.classList.toggle("on", i === 0); });
          autoPreset(); run();
        };
        $("#ie-save").onclick = saveImage;
        $("#ie-savecase").onclick = function () { saveImage(); saveLog(); };

        wireSplit();
        syncLabels();

        /* Ctrl+Z / Ctrl+Y, because a tool that offers undo and then only
           in a button is a tool people stop trusting. */
        root.addEventListener("keydown", function (ev) {
          if (!(ev.ctrlKey || ev.metaKey)) return;
          var k = ev.key.toLowerCase();
          if (k === "z" && !ev.shiftKey) { ev.preventDefault(); undo(); }
          else if (k === "y" || (k === "z" && ev.shiftKey)) { ev.preventDefault(); redo(); }
        });
        if (!root.hasAttribute("tabindex")) root.setAttribute("tabindex", "-1");
      }

      /* ---- history --------------------------------------------

         Every control that changes the result, captured as one snapshot.
         Rebuilding from the original each time means undo can never drift
         away from what the source file actually contains. */

      var HIST_IDS = ["ie-chan", "ie-deblur", "ie-stack", "ie-denoise", "ie-focus",
                      "ie-mlen", "ie-mang", "ie-iter", "ie-noise", "ie-clahe",
                      "ie-clip", "ie-gamma", "ie-sharp", "ie-zoom"];
      var HIST_CHECKS = ["ie-autolevel", "ie-binar", "ie-invert", "ie-pixel", "ie-persp"];

      function snapshot() {
        var st = { v: {}, c: {}, roi: null, corners: null };
        HIST_IDS.forEach(function (id) { var e = $("#" + id); if (e) st.v[id] = e.value; });
        HIST_CHECKS.forEach(function (id) { var e = $("#" + id); if (e) st.c[id] = e.checked; });
        if (S.roi) st.roi = { x: S.roi.x, y: S.roi.y, w: S.roi.w, h: S.roi.h };
        if (S.corners) st.corners = S.corners.map(function (p) { return [p[0], p[1]]; });
        return st;
      }

      function restore(st) {
        HIST_IDS.forEach(function (id) { var e = $("#" + id); if (e && st.v[id] != null) e.value = st.v[id]; });
        HIST_CHECKS.forEach(function (id) { var e = $("#" + id); if (e && st.c[id] != null) e.checked = st.c[id]; });
        if (st.roi) S.roi = { x: st.roi.x, y: st.roi.y, w: st.roi.w, h: st.roi.h };
        if (st.corners) S.corners = st.corners.map(function (p) { return [p[0], p[1]]; });
        syncLabels();
        drawSource();
        measure();
        run();
      }

      function pushHistory() {
        if (S.restoring) return;
        var st = snapshot();
        var last = S.hist[S.histAt];
        if (last && JSON.stringify(last) === JSON.stringify(st)) return;
        S.hist = S.hist.slice(0, S.histAt + 1);
        S.hist.push(st);
        if (S.hist.length > 40) S.hist.shift();
        S.histAt = S.hist.length - 1;
        refreshHistory();
      }

      function refreshHistory() {
        var u = $("#ie-undo"), rd = $("#ie-redo"), lbl = $("#ie-hist");
        if (!u) return;
        u.disabled = S.histAt <= 0;
        rd.disabled = S.histAt >= S.hist.length - 1;
        lbl.textContent = S.hist.length > 1
          ? "step " + (S.histAt + 1) + " of " + S.hist.length : "";
      }

      function undo() {
        if (S.histAt <= 0) return;
        S.histAt--; S.restoring = true;
        restore(S.hist[S.histAt]);
        S.restoring = false;
        refreshHistory();
      }
      function redo() {
        if (S.histAt >= S.hist.length - 1) return;
        S.histAt++; S.restoring = true;
        restore(S.hist[S.histAt]);
        S.restoring = false;
        refreshHistory();
      }

      function markManual() {
        TK.$$("#ie-presets button").forEach(function (x) { x.classList.remove("on"); });
      }

      /* Slider drags can generate dozens of input events. Debounce them so
         the preview follows the controls without starting a full deblur for
         every intermediate pixel value. */
      function schedulePreview(delay) {
        if (!S.frames.length) return;
        if ($("#ie-ai") && $("#ie-ai").value === "nafnet") return;
        if (S.previewTimer) clearTimeout(S.previewTimer);
        S.previewTimer = setTimeout(function () {
          S.previewTimer = null;
          if (S.busy) { S.pendingPreview = true; return; }
          run();
        }, delay == null ? 160 : delay);
      }

      function wireSplit() {
        var stage = $("#ie-stage"), handle = $("#ie-handle"), clip = $("#ie-clipwrap");
        var dragging = false;
        function set(ev) {
          var r = stage.getBoundingClientRect();
          var pct = clampi(Math.round((ev.clientX - r.left) / r.width * 100), 0, 100);
          clip.style.width = pct + "%";
          handle.style.left = pct + "%";
        }
        handle.addEventListener("pointerdown", function (ev) {
          dragging = true; handle.setPointerCapture(ev.pointerId); ev.preventDefault();
        });
        handle.addEventListener("pointermove", function (ev) { if (dragging) set(ev); });
        handle.addEventListener("pointerup", function () { dragging = false; });
        stage.addEventListener("click", function (ev) {
          if (ev.target === handle || handle.contains(ev.target)) return;
          set(ev);
        });
      }

      /* ---- crop and measure --------------------------------- */

      function cropPlanes() {
        var r = S.roi, w = r.w, h = r.h;
        var planes = [], chan = $("#ie-chan") ? $("#ie-chan").value : "luma";
        var cb = null, cr = null;

        /* With perspective correction the region is a quadrilateral, not a
           rectangle, so each frame is warped straight out of the full image
           rather than cropped. Colour is dropped: the warp is applied to
           luminance only, and carrying chroma through a different geometry
           would put colour where no colour was sampled. */
        if (perspOn()) {
          var size = rectSize();
          S.frames.forEach(function (f) {
            var full = chan === "luma" ? toYCC(f.img).y : channelPlane(f.img, chan);
            var rec = rectify(full, f.img.width, f.img.height, S.corners, size.w, size.h);
            if (rec) planes.push(rec.plane);
          });
          if (planes.length) {
            return { planes: planes, cb: null, cr: null, w: size.w, h: size.h, rectified: true };
          }
        }

        S.frames.forEach(function (f, fi) {
          var sub = cropImageData(f.img, r);
          if (chan === "luma") {
            var p = toYCC(sub);
            planes.push(p.y);
            if (fi === 0) { cb = p.cb; cr = p.cr; }
          } else {
            planes.push(channelPlane(sub, chan));
          }
        });
        return { planes: planes, cb: cb, cr: cr, w: w, h: h };
      }

  function cropImageData(img, r) {
        if (r.x === 0 && r.y === 0 && r.w === img.width && r.h === img.height) return img;
        var out = new ImageData(r.w, r.h), s = img.data, d = out.data;
        for (var y = 0; y < r.h; y++) {
          var so = ((y + r.y) * img.width + r.x) * 4, dof = y * r.w * 4;
          for (var i = 0; i < r.w * 4; i++) d[dof + i] = s[so + i];
        }
    return out;
  }

  /* Find a likely bright rectangular plate when the user chooses the plate
     preset without drawing an ROI first. This is deliberately conservative:
     it only considers connected bright regions in the lower part of the
     frame and still leaves the result visible for manual correction. */
  function detectPlateROI() {
    if (!S.frames.length) return null;
    var img = S.frames[0].img, w = img.width, h = img.height;
    var y = toYCC(img).y, step = Math.max(2, Math.ceil(Math.max(w, h) / 320));
    var gw = Math.ceil(w / step), gh = Math.ceil(h / step);
    var threshold = Math.max(165, percentile(y, 0.72));
    var bright = new Uint8Array(gw * gh), seen = new Uint8Array(gw * gh);
    var gx, gy, x, yy, sum, cnt;

    for (gy = 0; gy < gh; gy++) {
      if (gy * step < h * 0.30) continue;
      for (gx = 0; gx < gw; gx++) {
        sum = 0; cnt = 0;
        for (yy = gy * step; yy < Math.min(h, (gy + 1) * step); yy++) {
          for (x = gx * step; x < Math.min(w, (gx + 1) * step); x++) {
            sum += y[yy * w + x]; cnt++;
          }
        }
        if (cnt && sum / cnt >= threshold) bright[gy * gw + gx] = 1;
      }
    }

    var best = null, qx = [], qy = [], qh, head, idx, nx, ny, minx, maxx, miny, maxy, area;
    for (gy = 0; gy < gh; gy++) for (gx = 0; gx < gw; gx++) {
      idx = gy * gw + gx;
      if (!bright[idx] || seen[idx]) continue;
      qx = [gx]; qy = [gy]; head = 0; seen[idx] = 1;
      minx = maxx = gx; miny = maxy = gy; area = 0;
      while (head < qx.length) {
        x = qx[head]; yy = qy[head++]; area++;
        if (x < minx) minx = x; if (x > maxx) maxx = x;
        if (yy < miny) miny = yy; if (yy > maxy) maxy = yy;
        for (var di = 0; di < 4; di++) {
          nx = x + (di === 0 ? 1 : di === 1 ? -1 : 0);
          ny = yy + (di === 2 ? 1 : di === 3 ? -1 : 0);
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          idx = ny * gw + nx;
          if (bright[idx] && !seen[idx]) { seen[idx] = 1; qx.push(nx); qy.push(ny); }
        }
      }

      var bw = maxx - minx + 1, bh = maxy - miny + 1, aspect = bw / Math.max(1, bh);
      var fill = area / (bw * bh), pixels = bw * step * bh * step;
      if (aspect < 1.7 || aspect > 6.5 || fill < 0.35 || pixels < w * h * 0.004) continue;
      var center = ((minx + maxx) * 0.5 * step) / w;
      var score = fill * Math.min(2, aspect / 2.4) * (1 - Math.abs(center - 0.5));
      if (!best || score > best.score) best = { minx:minx, maxx:maxx, miny:miny, maxy:maxy, score:score };
    }
    if (!best) return null;

    var margin = Math.max(6, Math.round(Math.min(w, h) * 0.015));
    var rx = clampi(best.minx * step - margin, 0, w - 1);
    var ry = clampi(best.miny * step - margin, 0, h - 1);
    var rw = clampi((best.maxx + 1) * step - best.minx * step + margin * 2, 8, w - rx);
    var rh = clampi((best.maxy + 1) * step - best.miny * step + margin * 2, 8, h - ry);
    return { x: rx, y: ry, w: rw, h: rh };
  }

  function selectPlateROI() {
    var found = detectPlateROI();
    if (!found) {
      TK.toast("Could not find a bright rectangular plate - draw the ROI manually", "warn");
      return false;
    }
    S.roi = found;
    drawSource();
    measure();
    return true;
  }

      /* Sensor noise belongs to the camera, not to the subject, so it is
         measured over the whole frame where there is flat sky or road to
         measure it on. Taken from a crop that is all characters, every
         estimator reads the strokes as noise and the tool then refuses to
         sharpen the thing it was pointed at. */
      function frameNoise() {
        if (S.frameNoiseCached != null) return S.frameNoiseCached;
        var f = S.frames[0];
        if (!f) return 0;
        var p = toYCC(f.img);
        S.frameNoiseCached = noiseSigmaRobust(p.y, p.w, p.h);
        return S.frameNoiseCached;
      }

      function measure() {
        var c = cropPlanes();
        var y = c.planes[0], w = c.w, h = c.h;
        var cep = cepstralMotion(y, w, h);
        S.meas = {
          noise: frameNoise(),
          blur: blurMetric(y, w, h),
          sharp: focusScore(y, w, h),
          motion: motionEstimate(y, w, h),
          cepstrum: cep,
          p2: percentile(y, 0.02),
          p98: percentile(y, 0.98)
        };

        var m = S.meas;
        var blurTxt = m.blur < 0.35 ? "sharp" : m.blur < 0.5 ? "slightly soft" :
                      m.blur < 0.65 ? "blurred" : "heavily blurred";
        var noiseTxt = m.noise < 2 ? "clean" : m.noise < 5 ? "some grain" :
                       m.noise < 10 ? "noisy" : "very noisy";
        var span = m.p98 - m.p2;
        var conTxt = span > 170 ? "full range" : span > 110 ? "usable" : "flat";

        $("#ie-meas").innerHTML =
          '<div class="grid c4">' +
          TK.stat(m.blur.toFixed(2), "Blur index (" + blurTxt + ")", m.blur < 0.5 ? "ok" : m.blur < 0.65 ? "warn" : "danger") +
          TK.stat(m.noise.toFixed(1), "Noise sigma (" + noiseTxt + ")", m.noise < 5 ? "ok" : m.noise < 10 ? "warn" : "danger") +
          TK.stat(span, "Tonal range (" + conTxt + ")", span > 110 ? "ok" : "warn") +
          (cep && cep.strength >= 2.5
            ? TK.stat(Math.round(cep.angle) + "° / " + cep.length + " px",
                      "If this is movement, the smear reads", "")
            : TK.stat(Math.round(m.motion.angle) + "°",
                      "Smear direction, confidence " + m.motion.ratio.toFixed(1) + "x",
                      m.motion.ratio > 2.5 ? "ok" : "")) +
          "</div>" +
          '<p class="xs muted" style="margin-top:10px">Blur index runs from about 0.2 for a crisp image to ' +
          "0.8 for an unreadable one. Noise sigma is measured over the whole frame, where there is flat " +
          "ground to measure it on, not over the characters. " +
          (cep && cep.strength >= 2.5
            ? "The smear figure is read from the image's own spectrum and is accurate to within about " +
              "three degrees on real movement. It cannot tell movement from a focus fault, because an " +
              "out-of-focus lens leaves a similar signature, so treat it as the numbers to use once you " +
              "have decided the blur is movement, not as evidence that it is."
            : "No clear smear signature was found in the spectrum, so the figure shown comes from the " +
              "direction of least detail. That is confounded by scenery: railings and shutters report a " +
              "direction with no movement involved. Treat it as a starting point and adjust by eye.") +
          "</p>";
      }

      /* ---- presets ------------------------------------------ */

      function autoPreset() { applyPreset("auto"); }

      function set(id, v) { var el = $(id); if (el) el.value = v; }
      function chk(id, v) { var el = $(id); if (el) el.checked = !!v; }

      function applyPreset(p) {
        var m = S.meas || {};
        var noise = m.noise || 0, blurIdx = m.blur || 0, ratio = (m.motion && m.motion.ratio) || 1;
        var span = (m.p98 || 255) - (m.p2 || 0);

        /* magnification chosen so the region lands around 900 px wide,
           because characters below about 20 px tall are not read reliably */
        var zoom = clampi(Math.round(900 / Math.max(40, S.roi.w)), 1, 8);

        var denoise = noise < 2 ? 0 : clampi(Math.round((noise - 1) * 9 / 5) * 5, 0, 70);
        var contrast = span > 170 ? 25 : span > 110 ? 45 : 65;

        /* A region this small was selected around a plate or a face, and
           there the limit is usually resolution rather than blur. The blur
           index reads such a crop as "sharp" -- its pixels do have hard
           edges -- and the tool would then set a gentle contrast lift and
           near-nothing else, which is why a low-resolution plate came back
           looking untouched. Small regions get the plate treatment on the
           strength of their size, not their blur index. */
        var smallRegion = S.roi.w * S.roi.h < 60000;
        if (smallRegion) {
          contrast = Math.max(contrast, 65);
          zoom = Math.max(zoom, 4);
        }

        /* Blur index to optical PSF diameter, calibrated against the bundled
           circular-defocus samples.
           Deliberately biased low: too small a PSF merely under-corrects,
           while too large a one rings, and ringing next to a character
           stroke is exactly the false detail this tool must not produce.
           The officer raises it by hand while watching the focus score. */
        /* The no-reference blur metric saturates on badly defocused plates,
           so use a wider mapping and retain a useful floor for the bundled
           medium-blur sample. */
        var opticalSize = clampi(Math.round((blurIdx - 0.25) * 48), 8, 60);

        /* Smear length is not derived. The blur index under-reads a
           diagonal smear badly -- a true 9 px smear across a plate
           measured 0.42 here, which any mapping turns into about 3 px --
           so rather than print a precise-looking wrong number, this
           starts mid-range and sends the officer to the comparison. */
        /* The cepstrum reads the smear itself rather than the scene, so it
           is trusted over the structure tensor whenever its spike stands
           clear of the background. On a plate the tensor is dragged towards
           the horizontal by the character strokes; measured against known
           smears the cepstrum was within 3 degrees where the tensor was out
           by as much as 14. */
        /* Used only to fill in the smear numbers, never to decide that
           there is a smear. Against known smears this was accurate to
           within three degrees where the structure tensor was out by up
           to fourteen. */
        var cep = m.cepstrum;
        var cepGood = cep && cep.strength >= 2.5;
        var motionLen = cepGood ? clampi(cep.length, 3, 25) : 9;

        set("#ie-chan", "luma");
        set("#ie-zoom", zoom);
        set("#ie-iter", 18);
        set("#ie-gamma", 100);
        chk("#ie-autolevel", true);
        chk("#ie-binar", false);
        chk("#ie-invert", false);
        chk("#ie-pixel", false);
        set("#ie-mang", Math.round(cepGood ? cep.angle : ((m.motion && m.motion.angle) || 0)));
        set("#ie-mlen", motionLen);
        set("#ie-focus", opticalSize);
        set("#ie-denoise", denoise);
        set("#ie-noise", clampi(Math.max(1, Math.round(noise)), 0, 30));
        set("#ie-clahe", contrast);
        set("#ie-clip", 25);

        if (p === "auto") {
          /* The cepstrum is not consulted here. It measures a smear very
             well once you know there is one -- within three degrees on
             known cases -- but it cannot tell a smear from a focus problem,
             because an out-of-focus disc puts zeros in the spectrum too. On
             a real defocused plate it scored higher for "directional" than
             a real smeared one did. Letting it pick the model would deblur
             a focus fault along an invented axis, so the choice stays with
             the blur index, the anisotropy, and the officer's own eye on
             the comparison sheet. */
          if (blurIdx < 0.42) set("#ie-deblur", "off");
          /* The two classes overlap: across known cases the most
             directional defocus measured 2.53 and the least directional
             smear 2.00, so no threshold separates them cleanly. It is set
             where nothing defocused is ever called movement, because the
             two mistakes are not equal. Deblurring a focus fault as
             movement sharpens along an axis that does not exist and
             invents stroke shapes; treating movement as defocus merely
             under-corrects, evenly, and the comparison sheet lets the
             officer switch. */
          else if (ratio > 3.0) set("#ie-deblur", "motion");
          else set("#ie-deblur", "defocus");
          set("#ie-sharp", blurIdx < 0.42 ? 60 : 40);
        } else if (p === "plate") {
          /* Plates need a stronger read pass than faces: expose weak glyph
             edges after deconvolution, but keep the original available in
             the split view and preserve every setting in the log. */
          /* Plate glyphs are directional and make the scene-based motion
             estimator overconfident. Keep this optical unless the examiner
             explicitly selects Motion blur. */
          set("#ie-deblur", "defocus");
          set("#ie-clahe", 90); set("#ie-clip", 40);
          set("#ie-sharp", 180);
          set("#ie-zoom", clampi(zoom + 1, 2, 8));
          set("#ie-iter", 32);
          set("#ie-noise", clampi(Math.max(2, Math.round(noise)), 0, 30));
        } else if (p === "face") {
          /* faces are soft gradients: heavy local contrast invents skin
             texture that was never there, so keep it gentle */
          set("#ie-deblur", blurIdx > 0.45 ? "defocus" : "off");
          set("#ie-clahe", 30); set("#ie-clip", 18);
          set("#ie-sharp", 35);
          set("#ie-denoise", clampi(denoise + 15, 10, 70));
          set("#ie-iter", 10);
        } else if (p === "night") {
          set("#ie-chan", "r");
          set("#ie-denoise", clampi(denoise + 25, 30, 90));
          set("#ie-clahe", 70); set("#ie-clip", 20);
          set("#ie-gamma", 75);
          set("#ie-sharp", 40);
          set("#ie-deblur", blurIdx > 0.5 ? "defocus" : "off");
        } else if (p === "motion") {
          set("#ie-deblur", "motion");
          set("#ie-iter", 22);
          set("#ie-sharp", 30);
          set("#ie-denoise", clampi(denoise + 10, 10, 70));
        }
        syncLabels();
      }

      /* ---- estimating the blur from the image itself ----------

         Two estimators, because measurement says each one only covers
         half the problem. Blind deconvolution under a dark-channel prior
         recovers an arbitrary out-of-focus kernel, and did so on every
         defocus case tried; on linear smear it lost ground every time.
         The cepstrum is the reverse. Neither can tell which kind of blur
         it is looking at, so both candidates are rendered and the officer
         decides by eye -- the same way the comparison sheet works, and
         the only honest resolution of a choice no test here settles. */

      function kernelThumb(psf, ps, box) {
        var cv = document.createElement("canvas");
        cv.width = ps; cv.height = ps;
        var ctx = cv.getContext("2d"), img = ctx.createImageData(ps, ps);
        var peak = 0, i;
        for (i = 0; i < psf.length; i++) if (psf[i] > peak) peak = psf[i];
        for (i = 0; i < ps * ps; i++) {
          var v = peak > 0 ? Math.round(255 * Math.pow(psf[i] / peak, 0.6)) : 0;
          img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
          img.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        var big = document.createElement("canvas");
        big.width = box; big.height = box;
        var bx = big.getContext("2d");
        bx.imageSmoothingEnabled = false;
        bx.drawImage(cv, 0, 0, box, box);
        return big.toDataURL("image/png");
      }

      function estimateBlur() {
        if (S.busy || !S.frames.length) return;
        if (S.roi.w * S.roi.h > 400000) {
          TK.toast("Select the plate or face first - estimating over a whole frame is not meaningful", "warn");
          return;
        }
        S.busy = true;
        $("#ie-auto").disabled = true;
        setStatus("Estimating the blur from the image\u2026", true);

        setTimeout(function () {
          var c = cropPlanes(), w = c.w, h = c.h;
          var base = c.planes.length > 1 && $("#ie-stack") && $("#ie-stack").value !== "none"
            ? stackPlanes(c.planes, w, h, "mean", 6, null)
            : Float32Array.from(c.planes[0]);

          var nf = num("#ie-noise");
          var lam = clampi(0.00006 * nf * nf, 0, 0.012);
          var cands = [];

          function deconv(k) {
            return richardsonLucyTV(base, w, h, k.psf, k.ps, 18,
              { lambda: lam, noiseFloor: nf, accelerate: true });
          }

          cands.push({ label: "No deblurring", plane: base, kernel: null, apply: function () {
            set("#ie-deblur", "off");
          } });

          /* blind estimate: measured to recover out-of-focus kernels */
          var blind = null;
          try {
            blind = blindKernel(base, w, h, 15, { dark: true, iters: 5, lambda: 0.008 });
          } catch (e) { blind = null; }
          if (blind) {
            S.blindPsf = blind;
            cands.push({ label: "Estimated from the image", plane: deconv(blind),
              kernel: blind, apply: function () { set("#ie-deblur", "auto"); } });
          }

          /* cepstral smear: measured accurate to about three degrees */
          var cep = S.meas && S.meas.cepstrum;
          if (cep && cep.strength >= 2.5) {
            var mk = psfMotion(clampi(cep.length, 3, 25), Math.round(cep.angle));
            cands.push({
              label: "Movement, " + clampi(cep.length, 3, 25) + " px at " + Math.round(cep.angle) + "\u00b0",
              plane: deconv(mk), kernel: mk,
              apply: function () {
                set("#ie-deblur", "motion");
                set("#ie-mlen", clampi(cep.length, 3, 25));
                set("#ie-mang", Math.round(cep.angle));
              }
            });
          }

          /* a plain focus candidate from the blur index */
          var fpx = clampi(Math.round((S.meas.blur - 0.30) * 30), 3, 30);
          var ok2 = psfOptical(fpx);
          cands.push({ label: "Out of focus, " + fpx + " px", plane: deconv(ok2), kernel: ok2,
            apply: function () { set("#ie-deblur", "defocus"); set("#ie-focus", fpx); } });

          var zoom = clampi(Math.round(300 / Math.max(30, w)), 1, 5);
          var html = '<div class="card tight" style="margin-top:16px"><h3>Which one reads best?</h3>' +
            '<p class="xs muted">Each is the same region with a different estimate of the blur. ' +
            "The small square is the blur itself as the estimate sees it: a smear should look like a " +
            "streak, a focus fault like a disc. Click the panel where the characters are clearest.</p>" +
            '<div class="enh-sweep">';

          cands.forEach(function (cd, i) {
            var img = toImageData(cd.plane, null, null, w, h);
            if (zoom > 1) img = resize(img, w * zoom, h * zoom, "lanczos");
            var cv = document.createElement("canvas");
            cv.width = img.width; cv.height = img.height;
            cv.getContext("2d").putImageData(img, 0, 0);
            html += '<button class="enh-cand" data-i="' + i + '">' +
              '<img src="' + cv.toDataURL("image/png") + '" alt="">' +
              (cd.kernel ? '<img class="enh-k" src="' + kernelThumb(cd.kernel.psf, cd.kernel.ps, 44) + '" alt="">' : "") +
              "<span>" + esc(cd.label) + "</span></button>";
          });
          html += "</div></div>";
          $("#ie-sweep-out").innerHTML = html;

          TK.$$("#ie-sweep-out .enh-cand").forEach(function (b) {
            b.onclick = function () {
              cands[parseInt(b.getAttribute("data-i"), 10)].apply();
              markManual(); syncLabels();
              $("#ie-sweep-out").innerHTML = "";
              run();
            };
          });

          S.busy = false;
          $("#ie-auto").disabled = false;
          setStatus("", false);
        }, 30);
      }

      /* ---- comparing deblur settings -------------------------
         There is no reliable automatic way to pick the blur an unknown
         camera applied. Measures that claim to -- gradient sparsity and
         the like -- were tested against known degradations here and
         simply prefer the weakest setting every time, which would hand
         an officer a confident wrong answer. What does work is showing
         the candidates and letting a person choose the one where the
         characters resolve, which is also what an examiner is expected
         to do and to be able to justify. */

      function sweep(vary) {
        if (S.busy || !S.frames.length) return;
        if ($("#ie-ai").value !== "off") {
          TK.toast("AI-assisted mode has no parameter sweep; compare it directly with the original", "warn");
          return;
        }
        var mode = $("#ie-deblur").value;
        if (mode === "off") {
          TK.toast("Choose a deblur model first", "warn");
          return;
        }
        if (mode !== "motion") vary = "amount";
        else if (vary !== "length") vary = "angle";
        if (S.roi.w * S.roi.h > 260000) {
          TK.toast("Select a smaller region to compare settings", "warn");
          return;
        }

        S.busy = true;
        $("#ie-sweep").disabled = true;
        setStatus("Comparing deblur settings…", true);

        setTimeout(function () {
          var c = cropPlanes(), w = c.w, h = c.h;
          var base = c.planes.length > 1 && $("#ie-stack") && $("#ie-stack").value !== "none"
            ? stackPlanes(c.planes, w, h, $("#ie-stack").value, 6, null)
            : Float32Array.from(c.planes[0]);

          var dn = num("#ie-denoise");
          if (dn > 0) base = bilateral(base, w, h, 2, 1.6, 3 + dn * 0.42);

          var cands = [], i;
          if (vary === "angle") {
            var len = num("#ie-mlen");
            for (i = 0; i < 180; i += 15) {
              cands.push({ label: i + "°", set: "#ie-mang", v: i, psf: psfMotion(len, i) });
            }
          } else if (vary === "length") {
            var ang = num("#ie-mang");
            for (i = 3; i <= 25; i += 2) {
              cands.push({ label: i + " px", set: "#ie-mlen", v: i, psf: psfMotion(i, ang) });
            }
          } else {
            for (i = 4; i <= 52; i += 4) {
              cands.push({ label: i + " px", set: "#ie-focus", v: i, psf: psfOptical(i) });
            }
          }

          /* a short run is enough to judge which candidate is right;
             the chosen one is then rendered at the full iteration count */
          var zoom = clampi(Math.round(260 / Math.max(30, w)), 1, 4);
          var title = vary === "angle" ? "Which direction resolves the detail?"
                    : vary === "length" ? "How far did it travel?"
            : "How large was the optical blur?";

          var html = '<div class="card tight" style="margin-top:16px"><h3>' + title + "</h3>";

          if (mode === "motion") {
            html += '<div class="seg" id="ie-vary" style="margin-bottom:10px">' +
              '<button data-v="angle"' + (vary === "angle" ? ' class="on"' : "") + ">Direction</button>" +
              '<button data-v="length"' + (vary === "length" ? ' class="on"' : "") + ">Distance</button>" +
              "</div>";
          }

          html += '<p class="xs muted">Each panel is the same region deblurred with one setting, at ' +
            "10 iterations. Click the one where the detail reads cleanest without haloes around " +
            "the strokes. Only the setting you pick is applied and recorded. With movement, settle " +
            "the direction first, then the distance.</p>" +
            '<div class="enh-sweep">';

          cands.forEach(function (cd, idx) {
            var nf = num("#ie-noise");
            var out = richardsonLucyTV(base, w, h, cd.psf.psf, cd.psf.ps, 10,
              { lambda: clampi(0.00006 * nf * nf, 0, 0.012), noiseFloor: nf, accelerate: true });
            var img = toImageData(out, null, null, w, h);
            if (zoom > 1) img = resize(img, w * zoom, h * zoom, "lanczos");
            var cv = document.createElement("canvas");
            cv.width = img.width; cv.height = img.height;
            cv.getContext("2d").putImageData(img, 0, 0);
            html += '<button class="enh-cand" data-i="' + idx + '">' +
              '<img src="' + cv.toDataURL("image/png") + '" alt="">' +
              "<span>" + esc(cd.label) + "</span></button>";
          });

          html += "</div></div>";
          $("#ie-sweep-out").innerHTML = html;

          TK.$$("#ie-sweep-out .enh-cand").forEach(function (b) {
            b.onclick = function () {
              var cd = cands[parseInt(b.getAttribute("data-i"), 10)];
              set(cd.set, cd.v);
              markManual();
              syncLabels();
              $("#ie-sweep-out").innerHTML = "";
              run();
            };
          });

          TK.$$("#ie-vary button").forEach(function (b) {
            b.onclick = function () { sweep(b.getAttribute("data-v")); };
          });

          S.busy = false;
          $("#ie-sweep").disabled = false;
          setStatus("", false);
        }, 30);
      }

      /* ---- the pipeline ------------------------------------- */

      function run(forceAI) {
        if (S.busy || !S.frames.length) return;
        if ($("#ie-ai").value === "nafnet" && !forceAI) {
          setStatus("AI mode is ready — click Run AI-assisted restore", false);
          return;
        }
        var area = S.roi.w * S.roi.h;
        var deblur = $("#ie-deblur").value;

        if (deblur !== "off" && area > 1200000) {
          setStatus("", false);
          TK.toast("Select a smaller region before deblurring - this one is too large", "warn");
          return;
        }

        /* Deconvolution cost is the region area times the square of the
           kernel times the iteration count, and all three are under the
           officer's control. A whole frame with a 25 px smear kernel is
           four billion operations and locks the page for over a minute, so
           the work is bounded here and the iteration count trimmed to fit
           rather than left to be discovered the hard way. */
        if (deblur !== "off") {
          var pk = deblur === "auto" && S.blindPsf ? S.blindPsf
                 : deblur === "motion" ? psfMotion(num("#ie-mlen"), num("#ie-mang"))
                 : psfOptical(num("#ie-focus"));
          /* Cost now depends on which convolution the deconvolution will
             pick. Through the transform a big kernel is no dearer than a
             small one, so the old area-times-kernel-squared budget would
             refuse work that is in fact cheap. */
          var viaFFT = pk.ps >= 9 && area >= 4096;
          var per = viaFFT ? area * Math.log(Math.max(2, area)) * 6
                           : area * pk.ps * pk.ps * 2;
          var fits = Math.floor(2.5e8 / Math.max(1, per));
          if (fits < 3) {
            setStatus("", false);
            TK.toast("This region is too large to deblur quickly. Select a smaller one.", "warn");
            return;
          }
          if (fits < num("#ie-iter")) {
            set("#ie-iter", fits);
            syncLabels();
            TK.toast("Iterations reduced to " + fits + " to keep this region responsive", "warn");
          }
        }

        S.busy = true;
        var aiOn = $("#ie-ai").value === "nafnet";
        setStatus(aiOn ? "Preparing local AI restoration…" : "Enhancing image…", true);
        $("#ie-run").disabled = true;

        /* let the browser paint the busy state before the maths starts */
        setTimeout(async function () {
          var res;
          try {
            res = await pipeline();
          } catch (e) {
            TK.toast("Enhancement failed: " + e.message, "danger");
            S.busy = false; $("#ie-run").disabled = false; setStatus("", false);
            return;
          }
          S.result = res;
          paint(res);
          pushHistory();
          S.busy = false;
          $("#ie-run").disabled = false;
          setStatus("Done in " + res.ms + " ms", false);
          if (S.pendingPreview) {
            S.pendingPreview = false;
            schedulePreview(0);
          }
        }, 30);
      }

      function sampleRGBA(img, x, y, ch) {
        var w = img.width, h = img.height;
        x = clampi(x, 0, w - 1); y = clampi(y, 0, h - 1);
        var x0 = Math.floor(x), y0 = Math.floor(y);
        var x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
        var fx = x - x0, fy = y - y0, d = img.data;
        var a = d[(y0 * w + x0) * 4 + ch], b = d[(y0 * w + x1) * 4 + ch];
        var c = d[(y1 * w + x0) * 4 + ch], e = d[(y1 * w + x1) * 4 + ch];
        return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + e * fx) * fy;
      }

      /* NAFNet needs both dimensions to be at least 512 px. The selected
         region is scaled proportionally and edge-padded into one 512 px
         tile, then cropped and restored to its original geometry. This
         avoids changing the plate's aspect ratio and puts a hard bound on
         memory and runtime. */
      async function aiRestore(img) {
        if (!window.ort) throw new Error("Local ONNX runtime was not loaded");
        if (location.protocol === "file:") {
          throw new Error("AI mode needs the local Sutra server. Start it with Start Sutra.bat, then open its local address.");
        }
        var side = 512, w = img.width, h = img.height;
        var scale = side / Math.max(w, h);
        var iw = Math.max(1, Math.round(w * scale)), ih = Math.max(1, Math.round(h * scale));
        var px = Math.floor((side - iw) / 2), py = Math.floor((side - ih) / 2);

        if (!S.aiSession) {
          if (!S.aiModelPromise) {
            S.aiModelPromise = (async function () {
              setStatus("Loading local NAFNet model (about 92 MB)…", true);
              window.ort.env.wasm.wasmPaths = new URL("assets/vendor/onnxruntime/", document.baseURI).href;
              window.ort.env.wasm.numThreads = 1;
              var response = await fetch(new URL("assets/models/deblurring_nafnet_2025may.onnx", document.baseURI).href);
              if (!response.ok) throw new Error("Could not load the local NAFNet model (" + response.status + ")");
              var bytes = new Uint8Array(await response.arrayBuffer());
              S.aiSession = await window.ort.InferenceSession.create(bytes, {
                executionProviders: ["wasm"], graphOptimizationLevel: "all"
              });
              return S.aiSession;
            })().catch(function (err) { S.aiModelPromise = null; throw err; });
          }
          await S.aiModelPromise;
        }

        setStatus("Restoring one local AI tile — this can take a little while…", true);
        var data = new Float32Array(3 * side * side), x, y, p, ch;
        for (y = 0; y < side; y++) for (x = 0; x < side; x++) {
          var sx = (x - px + 0.5) / scale - 0.5;
          var sy = (y - py + 0.5) / scale - 0.5;
          p = y * side + x;
          for (ch = 0; ch < 3; ch++) data[ch * side * side + p] = sampleRGBA(img, sx, sy, ch) / 255;
        }
        var input = new window.ort.Tensor("float32", data, [1, 3, side, side]);
        var feeds = {}; feeds[S.aiSession.inputNames[0]] = input;
        var output = await S.aiSession.run(feeds);
        var tensor = output[S.aiSession.outputNames[0]], out = new ImageData(side, side), d = out.data;
        for (y = 0; y < side; y++) for (x = 0; x < side; x++) {
          p = y * side + x;
          d[p * 4] = clamp8(tensor.data[p] * 255);
          d[p * 4 + 1] = clamp8(tensor.data[side * side + p] * 255);
          d[p * 4 + 2] = clamp8(tensor.data[side * side * 2 + p] * 255);
          d[p * 4 + 3] = 255;
        }
        var cropped = cropImageData(out, { x: px, y: py, w: iw, h: ih });
        return (iw === w && ih === h) ? cropped : resize(cropped, w, h, "lanczos");
      }

      async function pipeline() {
        var t0 = Date.now();
        var log = [];
        var r = S.roi;
        var chan = $("#ie-chan").value;
        var stackMode = $("#ie-stack") ? $("#ie-stack").value : "none";

        log.push("Sutra CCTV Image Enhancer");
        log.push("Run at " + new Date().toString());
        S.frames.forEach(function (f) {
          log.push("Source: " + f.name + ", " + f.img.width + "x" + f.img.height +
            ", " + f.size + " bytes, SHA-256 " + (f.hash || "not computed"));
        });
        if (perspOn()) {
          log.push("Region: quadrilateral " + S.corners.map(function (p) {
            return p[0] + "," + p[1];
          }).join("  ") + ", warped to a " + c.w + " x " + c.h + " px rectangle");
        } else {
          log.push("Region: x " + r.x + ", y " + r.y + ", " + r.w + " x " + r.h + " px");
        }
        log.push("Working channel: " + (chan === "luma" ? "luminance (Rec.601)" : chan.toUpperCase() + " channel only"));
        log.push("");
        log.push("Steps, in order:");

        var c = cropPlanes();
        var w = c.w, h = c.h;

        var y, srFactor = 1;
        var beforeLR = Float32Array.from(c.planes[0]), bw = w, bh = h;

        if (c.planes.length > 1 && stackMode !== "none") {
          if (stackMode === "super") {
            /* Register every frame to the first to a fraction of a pixel,
               then place all the samples on a finer grid. This is the one
               step that adds resolution rather than redistributing it, and
               it does so from real measurements: frames that land on
               different sub-pixel offsets record detail no single frame
               could. Without that offset spread there is nothing extra to
               place, so the diversity is checked before claiming it. */
            var shifts = [{ dx: 0, dy: 0 }], i;
            for (i = 1; i < c.planes.length; i++) {
              var guess = bestOffset(c.planes[0], c.planes[i], w, h, 6);
              shifts.push(subpixelShift(c.planes[0], c.planes[i], w, h, guess));
            }
            var div = shiftDiversity(shifts);
            var L = clampi(Math.round(num("#ie-zoom")), 2, 3);

            if (div < 0.10 || c.planes.length < 3) {
              y = stackPlanes(c.planes, w, h, "mean", 6, log);
              log.push("Super-resolution declined: " + (c.planes.length < 3
                ? "it needs at least three frames"
                : "these frames differ by whole pixels (sub-pixel spread " +
                  div.toFixed(3) + "), so they hold no extra detail to recover") +
                ". Averaged instead.");
            } else {
              var sr = superResolve(c.planes, w, h, shifts, L);
              y = sr.plane; w = sr.w; h = sr.h; srFactor = L;
              shifts.forEach(function (sft, ix) {
                if (ix) log.push("Frame " + (ix + 1) + " registered to frame 1 at dx " +
                  sft.dx.toFixed(2) + ", dy " + sft.dy.toFixed(2) + " px");
              });
              log.push("Super-resolved " + c.planes.length + " frames onto a " + L +
                "x finer grid (" + w + "x" + h + " px), sub-pixel spread " + div.toFixed(3) +
                (sr.holes ? ", " + sr.holes + " grid points had no sample and were interpolated" : ""));
            }
          } else {
            y = stackPlanes(c.planes, w, h, stackMode, 6, log);
            log.push((stackMode === "median" ? "Median" : "Average") + " stack of " +
              c.planes.length + " aligned frames" +
              (stackMode === "mean" ? " (random noise reduced by about " +
                Math.sqrt(c.planes.length).toFixed(1) + "x)" : ""));
          }
        } else {
          y = Float32Array.from(c.planes[0]);
          if (c.planes.length > 1) log.push("Stacking off, first frame used");
        }

        var before = Float32Array.from(y), aiUsed = $("#ie-ai").value === "nafnet";
        if (aiUsed) {
          var aiImage = await aiRestore(toImageData(y, c.cb, c.cr, w, h));
          y = toYCC(aiImage).y;
          log.push("Local AI-assisted restoration: NAFNet deblurring ONNX model, 512 px edge-padded tile. " +
            "This output is a review aid and must not be used alone to identify characters.");
          setStatus("Applying measured enhancement after local AI restoration…", true);
        }
        var sharpBefore = focusScore(before, w, h);

        var dn = num("#ie-denoise");
        if (dn > 0) {
          var sigR = 3 + dn * 0.42;
          y = bilateral(y, w, h, 2, 1.6, sigR);
          log.push("Edge-preserving denoise, bilateral radius 2 px, spatial sigma 1.6, range sigma " + sigR.toFixed(1));
        }

        var mode = $("#ie-deblur").value;
        if (mode !== "off") {
          var iters = num("#ie-iter"), noiseFloor = num("#ie-noise"), k, psfDesc;
          if (mode === "auto" && S.blindPsf) {
            k = { psf: S.blindPsf.psf, ps: S.blindPsf.ps };
            psfDesc = "point spread function estimated from the image itself by blind " +
              "deconvolution under a dark-channel prior (Pan et al. 2016), " +
              S.blindPsf.ps + "x" + S.blindPsf.ps + " px";
          } else if (mode === "motion") {
            var len = num("#ie-mlen"), ang = num("#ie-mang");
            k = psfMotion(len, ang);
            psfDesc = "linear motion PSF, length " + len + " px at " + ang + " degrees";
          } else {
            var size = num("#ie-focus");
            k = psfOptical(size);
            psfDesc = "circular optical defocus PSF, diameter " + size + " px";
          }

          /* On a super-resolved grid the blur the officer measured on the
             original frame is L times wider, and the sensor's own pixel
             becomes an L by L box that also has to be undone. */
          if (srFactor > 1) {
            var scaled = scalePsfForGrid(k.psf, k.ps, srFactor);
            k = scaled;
            psfDesc += ", rescaled " + srFactor + "x for the finer grid and combined with the " +
              srFactor + "x" + srFactor + " sensor pixel";
          }

          /* Total variation weight follows the measured noise: with a clean
             frame it stays out of the way, and with a noisy one it stops the
             deconvolution decorating flat areas with texture that reads as
             detail. Calibrated against known degradations. */
          var lam = clampi(0.00006 * noiseFloor * noiseFloor, 0, 0.012);
          y = richardsonLucyTV(y, w, h, k.psf, k.ps, iters,
            { lambda: lam, noiseFloor: noiseFloor, accelerate: true });
          log.push("Richardson-Lucy deconvolution, " + psfDesc + ", noise threshold " +
            noiseFloor + " grey levels, total-variation weight " + lam.toFixed(4) +
            ", vector-accelerated, " + iters + " iterations");
        }

        var cl = num("#ie-clahe");
        if (cl > 0) {
          var clip = num("#ie-clip") / 10;
          var tiles = clampi(Math.round(Math.min(w, h) / 48), 2, 8);
          var eq = clahe(y, w, h, tiles, clip);
          var mix = cl / 100;
          for (var i = 0; i < y.length; i++) y[i] = y[i] * (1 - mix) + eq[i] * mix;
          log.push("CLAHE local contrast, " + tiles + "x" + tiles + " tiles, clip limit " +
            clip.toFixed(1) + ", blended at " + cl + "%");
        }

        var g = num("#ie-gamma") / 100;
        if ($("#ie-autolevel").checked) {
          var lo = percentile(y, 0.005), hi = percentile(y, 0.995);
          if (hi - lo > 4) {
            y = levels(y, lo, hi, g);
            log.push("Levels stretched from " + lo + "-" + hi + " to 0-255, gamma " + g.toFixed(2));
          } else if (g !== 1) {
            y = levels(y, 0, 255, g);
            log.push("Gamma " + g.toFixed(2) + " (range too narrow to stretch safely)");
          }
        } else if (g !== 1) {
          y = levels(y, 0, 255, g);
          log.push("Gamma " + g.toFixed(2));
        }

        if ($("#ie-binar").checked) {
          var win = clampi(Math.round(Math.min(w, h) / 6) | 1, 7, 61);
          y = wolfThreshold(y, w, h, win, 0.5);
          log.push("Wolf-Jolion local threshold, window " + win + " px, k 0.50 - characters only, tone discarded");
        }

        if ($("#ie-invert").checked) {
          for (var q = 0; q < y.length; q++) y[q] = 255 - y[q];
          log.push("Inverted");
        }

        /* With super-resolution the two sides are no longer the same size,
           and the focus score is scale dependent. Score the untouched frame
           at the output size, so the number compares the processing rather
           than the raster. */
        var sharpAfter = focusScore(y, w, h);
        if (srFactor > 1) {
          var beforeUp = toImageData(beforeLR, null, null, bw, bh);
          beforeUp = resize(beforeUp, w, h, "lanczos");
          var bp = toYCC(beforeUp);
          sharpBefore = focusScore(bp.y, bp.w, bp.h);
        }

        /* Build both images at the same magnification with the same
           resampler, so the split view shows the processing and not the
           difference between two scalers. */
        var zoom = num("#ie-zoom");
        var rmode = $("#ie-pixel").checked ? "nearest" : "lanczos";
        /* the finer grid already delivered part of the magnification */
        var extra = Math.max(1, zoom / srFactor);
        var nw = Math.round(w * extra), nh = Math.round(h * extra);

        /* Super-resolution works on luminance only, so colour is dropped
           rather than stretched across a grid it was never sampled on. */
        var mono = chan !== "luma" || srFactor > 1 ||
                   $("#ie-binar").checked || $("#ie-invert").checked;
        var afterImg = toImageData(y, mono ? null : c.cb, mono ? null : c.cr, w, h);
        var beforeImg = toImageData(beforeLR,
          (chan === "luma" && srFactor === 1) ? c.cb : null,
          (chan === "luma" && srFactor === 1) ? c.cr : null, bw, bh);

        if (extra > 1) {
          afterImg = resize(afterImg, nw, nh, rmode);
          log.push("Magnified a further " + extra.toFixed(2) + "x to " + nw + "x" + nh +
            " px using " + (rmode === "nearest" ? "nearest-neighbour (no interpolation)"
                                                : "Lanczos-3 interpolation"));
        }
        /* the untouched side is brought to the same size so the split view
           shows the processing and not a difference of scale */
        if (beforeImg.width !== afterImg.width || beforeImg.height !== afterImg.height) {
          beforeImg = resize(beforeImg, afterImg.width, afterImg.height, rmode);
        }

        var sh = num("#ie-sharp");
        if (sh > 0) {
          var p2 = toYCC(afterImg);
          var amt = sh / 100;
          var us = unsharp(p2.y, p2.w, p2.h, Math.max(0.8, zoom * 0.6), amt, 2);
          afterImg = toImageData(us, mono ? null : p2.cb, mono ? null : p2.cr, p2.w, p2.h);
          log.push("Unsharp mask, radius " + Math.max(0.8, zoom * 0.6).toFixed(1) +
            " px, amount " + amt.toFixed(2) + ", threshold 2");
        }

        log.push("");
        log.push("Focus score (variance of Laplacian, measured on a lightly smoothed copy so");
        log.push("that sensor noise is not counted as detail): " + sharpBefore.toFixed(1) +
          " before, " + sharpAfter.toFixed(1) + " after");
        log.push("");
        log.push("No detail was generated. Every operation above redistributes or rescales");
        log.push("information already present in the source pixels. Nothing in the output");
        log.push("was produced by a model, and no content was added from any other image.");
        log.push("The original file is unaltered; its hash is recorded above.");

        return {
          before: beforeImg, after: afterImg,
          log: log.join("\n"),
          sharpBefore: sharpBefore, sharpAfter: sharpAfter,
          w: afterImg.width, h: afterImg.height, ai: aiUsed,
          ms: Date.now() - t0
        };
      }

      /* ---- output ------------------------------------------- */

      function paint(res) {
        var cb = $("#ie-before"), ca = $("#ie-after");
        [cb, ca].forEach(function (c) { c.width = res.w; c.height = res.h; });
        cb.getContext("2d").putImageData(res.before, 0, 0);
        ca.getContext("2d").putImageData(res.after, 0, 0);

        var stage = $("#ie-stage");
        stage.style.width = res.w + "px";
        stage.style.height = res.h + "px";
        $("#ie-clipwrap").style.width = "50%";
        $("#ie-handle").style.left = "50%";

        var gain = res.sharpBefore > 0.01 ? res.sharpAfter / res.sharpBefore : 0;
        var kind = gain > 1.5 ? "ok" : gain > 0.95 ? "" : "warn";
        var logEl = $("#ie-log");
        if (logEl) logEl.textContent = res.log;

        $("#ie-after-stats").innerHTML =
          '<div class="grid c3">' +
          TK.stat(res.w + " x " + res.h, "Output size", "") +
          TK.stat(gain ? gain.toFixed(1) + "x" : "-", "Detail gain", kind) +
          TK.stat(res.ms + " ms", "Processing time", "") +
          "</div>" +
          (res.ai
            ? '<p class="xs ie-ai-warning" style="margin-top:10px"><b>AI-assisted review output.</b> NAFNet ran only on this device, but learned restoration can create plausible-looking strokes. Verify every character against the original and independent frames; do not use this image alone for identification.</p>'
            : "") +
          (gain && gain < 1.05
            ? '<p class="xs muted" style="margin-top:10px">No measurable detail was recovered. The ' +
              "image may be cleaner, but nothing became more legible, and no setting will change " +
              "that if the detail is not in the pixels. Go back to the recording for the original " +
              "file at full resolution rather than a screen capture or a forwarded copy, and for " +
              "the frames either side of this one. If none exists, the honest finding is that the " +
              "image is not legible.</p>"
            : "");

      }

      function saveImage() {
        if (!S.result) { TK.toast("Nothing to save yet", "warn"); return; }
        var c = $("#ie-after");
        var base = (S.frames[0].name || "frame").replace(/\.[^.]+$/, "");
        c.toBlob(function (b) { TK.download(base + "-enhanced.png", b); }, "image/png");
      }

      function saveLog() {
        if (!S.result) { TK.toast("Nothing to save yet", "warn"); return; }
        var base = (S.frames[0].name || "frame").replace(/\.[^.]+$/, "");
        TK.download(base + "-processing-log.txt", S.result.log, "text/plain");
      }
    }
  });

  /* exposed so the test harness can check the signal processing */
  TK._enhanceTest = {
    blur: blur, convolve: convolve, psfGauss: psfGauss, psfOptical: psfOptical, psfMotion: psfMotion,
    richardsonLucy: richardsonLucy, clahe: clahe, bilateral: bilateral,
    unsharp: unsharp, wolfThreshold: wolfThreshold, focusScore: focusScore, levels: levels, percentile: percentile,
    resize: resize, noiseSigma: noiseSigma, noiseSigmaRobust: noiseSigmaRobust,
    varLap: varLap, blurMetric: blurMetric,
    motionEstimate: motionEstimate, stackPlanes: stackPlanes, bestOffset: bestOffset,
    lanczosW: lanczosW,
    fft1d: fft1d, fft2d: fft2d, cepstralMotion: cepstralMotion,
    richardsonLucyTV: richardsonLucyTV,
    subpixelShift: subpixelShift, superResolve: superResolve,
    shiftDiversity: shiftDiversity, scalePsfForGrid: scalePsfForGrid,
    homography: homography, rectify: rectify, bilinearAt: bilinearAt,
    nextPow2: nextPow2, fftConvolver: fftConvolver, wienerDeconv: wienerDeconv,
    darkChannel: darkChannel, l0Deconv: l0Deconv,
    estimateKernelStep: estimateKernelStep, blindKernel: blindKernel
  };
})();
