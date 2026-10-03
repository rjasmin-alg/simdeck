/* SPDX-License-Identifier: AGPL-3.0-or-later
   Logic for aurora (the rough tone of a signal reflected by the aurora), after 50ohm's applet_aurora.html and
   sections/aurora_1.md, aurora_2.md (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.).
   The recording is the end of a CW contact on 2 m between GM4YXI and OK/DF7TR/P in three overs: GM4YXI received via
   the aurora, then OK/DF7TR/P's own signal as the recording station heard it while sending, then GM4YXI again. The
   aurora moves, so every part of the reflecting region shifts the frequency by a different Doppler amount and the
   received tone is spread over hundreds of hertz (Doppler spread): a hiss, not a note. The own signal is one clean
   line. These helpers take the recording's data (recording.js) as an argument: who is sending at a position, the
   transcript of each over, the WAV decoded to samples, a spectrogram, and each path's measured spectrum and width.
   The page's one param is the play position.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var REC_DURATION = 36.736;          // s, the recording's length (recording.js)
  var REC_MAX = 36.7;                 // the last position the play-position slider takes
  var FMAX = 2000;                    // Hz, the top of every plot (the receiver's audio passes about 200 … 1600 Hz)
  var FMIN_PEAK = 100;                // Hz, the lowest bin the peak is looked for in (keeps DC and hum out)
  var WIDTH_DB = 10;                  // the width is measured this many dB below the peak
  var FLOOR_DB = -60;                 // spectra are clamped here (dB below their peak)
  var ON = 0.5, OFF = 0.4;            // key down: frame RMS ≥ ON × the path's 90th percentile; key up: ≤ OFF × it

  // The overs, by time. A boundary belongs to the later over. bubble = the original's speech bubble.
  // Found in the recording: GM4YXI's last element ends at 21.5 s, OK/DF7TR/P's first starts at 21.95 s; the own
  // signal's last ends at 29.05 s and the receiver's noise is back from 29.5 s.
  var OVERS = [
    { id: 'a1', from: 0, station: 'GM4YXI', path: 'aurora', bubble: 0 },
    { id: 'b', from: 21.9, station: 'OK/DF7TR/P', path: 'own', bubble: 1 },
    { id: 'a2', from: 29.5, station: 'GM4YXI', path: 'aurora', bubble: 2 }
  ];

  var defaults = { t: 0 };

  var presets = [
    { id: 'aurora', params: { t: 0 } },
    { id: 'own', params: { t: 21.9 } },
    { id: 'last', params: { t: 29.5 } }
  ];

  /** The play position in s, 0 … REC_MAX, to 0.1 s (halves up; a non-number is 0). */
  function snapT(x) {
    var v = (x === null || x === '' || typeof x === 'boolean') ? NaN : Number(x);
    if (!isFinite(v)) v = 0;
    v = Math.min(REC_MAX, Math.max(0, v));
    return Math.floor(v * 10 + 0.5 + 1e-9) / 10;
  }

  /** The over sounding at t (s). A boundary belongs to the later over; before 0 is the first, past the end the last. */
  function overAt(t) {
    var o = OVERS[0];
    for (var i = 1; i < OVERS.length; i++) if (t >= OVERS[i].from - 1e-9) o = OVERS[i];
    return o;
  }

  /** The [from, to] spans in s of the overs on one path ('aurora' or 'own'). */
  function spans(path) {
    var out = [];
    OVERS.forEach(function (o, i) {
      if (o.path === path) out.push([o.from, i + 1 < OVERS.length ? OVERS[i + 1].from : REC_DURATION]);
    });
    return out;
  }

  /** One bubble's transcript up to t (s), by the original's rule: a character shows once its time is reached (ms ≤ t).
      events: [ms, character, space before, bubble]. A bubble's first character never takes a space. */
  function transcript(events, t, bubble) {
    var ms = t * 1000 + 1e-6, s = '';
    for (var i = 0; i < events.length && events[i][0] <= ms; i++) {
      if (events[i][3] !== bubble) continue;
      s += (events[i][2] && s ? ' ' : '') + events[i][1];
    }
    return s;
  }

  /** A WAV file's bytes (Uint8Array) → { rate, samples } with samples a Float32Array in −1 … 1. Mono 16-bit PCM only;
      walks the chunks, so a LIST chunk before 'data' (the original has one) is skipped. Throws on anything else. */
  function decodeWav(bytes) {
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    function tag(at) { return String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]); }
    if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('not a WAV file');
    var at = 12, rate = 0, fmtOk = false;
    while (at + 8 <= bytes.length) {
      var id = tag(at), size = dv.getUint32(at + 4, true), body = at + 8;
      if (id === 'fmt ') {
        fmtOk = dv.getUint16(body, true) === 1 && dv.getUint16(body + 2, true) === 1 && dv.getUint16(body + 14, true) === 16;
        rate = dv.getUint32(body + 4, true);
      } else if (id === 'data') {
        if (!fmtOk) throw new Error('only mono 16-bit PCM');
        var n = Math.floor(Math.min(size, bytes.length - body) / 2), samples = new Float32Array(n);
        for (var i = 0; i < n; i++) samples[i] = dv.getInt16(body + 2 * i, true) / 32768;
        return { rate: rate, samples: samples };
      }
      at = body + size + (size % 2);        // chunks are padded to an even length
    }
    throw new Error('no data chunk');
  }

  /** In-place radix-2 FFT of (re, im), length a power of two. */
  function fft(re, im) {
    var n = re.length, i, j = 0, k, m, tr, ti;
    for (i = 1; i < n; i++) {
      for (k = n >> 1; j & k; k >>= 1) j ^= k;
      j ^= k;
      if (i < j) { tr = re[i]; re[i] = re[j]; re[j] = tr; tr = im[i]; im[i] = im[j]; im[j] = tr; }
    }
    for (m = 2; m <= n; m <<= 1) {
      var a = -2 * Math.PI / m, wr = Math.cos(a), wi = Math.sin(a), h = m >> 1;
      for (i = 0; i < n; i += m) {
        var cr = 1, ci = 0;
        for (k = 0; k < h; k++) {
          var p = i + k, q = p + h;
          tr = re[q] * cr - im[q] * ci; ti = re[q] * ci + im[q] * cr;
          re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti;
          var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
  }

  /** Short-time power spectra: frames of n samples (Hann window) every hop samples, from `from` to `to` s.
      → [{ t (frame centre, s), rms, p: Float64Array(bins) }], bins = the FFT bins from 0 Hz up to FMAX. */
  function frames(rec, n, hop, from, to) {
    var x = rec.samples, rate = rec.rate, out = [], bins = Math.floor(FMAX * n / rate) + 1, w = new Float64Array(n);
    for (var i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n);
    var a = Math.max(0, Math.round((from || 0) * rate)), b = Math.min(x.length, to == null ? x.length : Math.round(to * rate));
    var re = new Float64Array(n), im = new Float64Array(n);
    for (var s = a; s + n <= b; s += hop) {
      var e = 0;
      for (i = 0; i < n; i++) { var v = x[s + i]; e += v * v; re[i] = v * w[i]; im[i] = 0; }
      fft(re, im);
      var p = new Float64Array(bins);
      for (i = 0; i < bins; i++) p[i] = re[i] * re[i] + im[i] * im[i];
      out.push({ t: (s + n / 2) / rate, rms: Math.sqrt(e / n), p: p });
    }
    return out;
  }

  /** The value at fraction q of xs sorted (index floor(q·(n − 1))). */
  function quantile(xs, q) {
    if (!xs.length) return 0;
    var a = xs.slice().sort(function (p, r) { return p - r; });
    return a[Math.floor(q * (a.length - 1))];
  }

  /** The −WIDTH_DB width of a spectrum p (power per bin, df Hz apart): the highest bin at or above FMIN_PEAK (ties: the
      lowest frequency), then the run of neighbouring bins at or above WIDTH_DB below it. width = bins × df.
      → { peak, lo, hi, width } in Hz (lo and hi are the outer bins' centres). null for an all-zero spectrum. */
  function widthOf(p, df) {
    var k0 = Math.ceil(FMIN_PEAK / df - 1e-9), k = -1, i;
    for (i = k0; i < p.length; i++) if (k < 0 || p[i] > p[k]) k = i;
    if (k < 0 || !(p[k] > 0)) return null;
    var lim = p[k] * Math.pow(10, -WIDTH_DB / 10), lo = k, hi = k;
    while (lo - 1 >= k0 && p[lo - 1] >= lim) lo--;
    while (hi + 1 < p.length && p[hi + 1] >= lim) hi++;
    return { peak: k * df, lo: lo * df, hi: hi * df, width: (hi - lo + 1) * df };
  }

  /** One path's spectrum, the receiver's noise taken out: the mean power of its key-down frames minus the mean of its
      key-up frames (never below 0), over all overs on the path. Frames of n samples, half overlapping.
      → { df, db: [dB below the peak, clamped at FLOOR_DB, per bin from 0 Hz], peak, lo, hi, width, down, up } with
      down/up the number of key-down and key-up frames. */
  function pathSpectrum(rec, path, n) {
    var fs = [];
    spans(path).forEach(function (sp) { fs = fs.concat(frames(rec, n, n / 2, sp[0], sp[1])); });
    var top = quantile(fs.map(function (f) { return f.rms; }), 0.9);
    var bins = fs.length ? fs[0].p.length : 0, on = new Float64Array(bins), off = new Float64Array(bins), nOn = 0, nOff = 0, i;
    fs.forEach(function (f) {
      if (f.rms >= ON * top) { nOn++; for (i = 0; i < bins; i++) on[i] += f.p[i]; }
      else if (f.rms <= OFF * top) { nOff++; for (i = 0; i < bins; i++) off[i] += f.p[i]; }
    });
    var sig = new Float64Array(bins);
    for (i = 0; i < bins; i++) sig[i] = Math.max(0, (nOn ? on[i] / nOn : 0) - (nOff ? off[i] / nOff : 0));
    var df = rec.rate / n, w = widthOf(sig, df) || { peak: null, lo: null, hi: null, width: null };
    var max = w.peak === null ? 0 : sig[Math.round(w.peak / df)], db = [];
    for (i = 0; i < bins; i++) db.push(max > 0 && sig[i] > 0 ? Math.max(FLOOR_DB, 10 * Math.log10(sig[i] / max)) : FLOOR_DB);
    return { df: df, db: db, peak: w.peak, lo: w.lo, hi: w.hi, width: w.width, down: nOn, up: nOff };
  }

  /** The whole recording as a spectrogram: frames of n samples every hop, 0 … FMAX, in dB below the loudest cell,
      clamped at `floor`. → { cols, bins, dt (s per column), df (Hz per bin), db: Float32Array(cols × bins), column-major }. */
  function spectrogram(rec, n, hop, floor) {
    var fs = frames(rec, n, hop), bins = fs.length ? fs[0].p.length : 0, max = 0, i, j;
    fs.forEach(function (f) { for (i = 0; i < bins; i++) if (f.p[i] > max) max = f.p[i]; });
    var db = new Float32Array(fs.length * bins);
    for (j = 0; j < fs.length; j++) {
      for (i = 0; i < bins; i++) {
        var v = fs[j].p[i];
        db[j * bins + i] = v > 0 && max > 0 ? Math.max(floor, 10 * Math.log10(v / max)) : floor;
      }
    }
    return { cols: fs.length, bins: bins, dt: hop / rec.rate, df: rec.rate / n, db: db };
  }

  function initial(p) {
    var t = snapT(p.t);
    return { t: t, over: overAt(t).id };
  }

  var logic = {
    REC_DURATION: REC_DURATION, REC_MAX: REC_MAX, FMAX: FMAX, FMIN_PEAK: FMIN_PEAK, WIDTH_DB: WIDTH_DB, FLOOR_DB: FLOOR_DB,
    ON: ON, OFF: OFF, OVERS: OVERS,
    defaults: defaults,
    presets: presets,
    initial: initial,
    snapT: snapT, overAt: overAt, spans: spans, transcript: transcript, decodeWav: decodeWav, fft: fft, frames: frames,
    quantile: quantile, widthOf: widthOf, pathSpectrum: pathSpectrum, spectrogram: spectrogram
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
