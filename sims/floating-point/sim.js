/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for floating-point: IEEE 754 binary32 and binary64. One value is decoded bit by bit (sign, stored exponent,
   fraction, kind, exact decimal value, ULP), and a second panel adds two decimal operands: each is rounded to the
   format, their exact sum is rounded once, and the result is compared with the number nearest to the decimal sum the
   student expected. Rules and numbers: SPEC.md (IEEE Std 754-2019 §3.4, §4.3, §5.1; Goldberg 1991 §1.1–1.2).
   An explorer: the state is derived from the params, no steps.
   Exact arithmetic is BigInt over rationals n/d (never Number, toFixed or parseFloat for a value); the state holds only
   strings, numbers and booleans, so it stays JSON-safe.
   Pure: no DOM, no Math.random, no Date, no timers.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Rule 1: the two binary interchange formats (IEEE 754-2019 Table 3.5). w exponent bits, p fraction bits. */
  var FORMATS = {
    binary32: { id: 'binary32', bits: 32, w: 8, p: 23, bias: 127 },
    binary64: { id: 'binary64', bits: 64, w: 11, p: 52, bias: 1023 }
  };
  var FORMAT_IDS = ['binary32', 'binary64'];

  /**
   * The values the strip's select offers. `dec` is a decimal the model rounds (rule 4); `special` is a bit pattern
   * chosen per format; 'sum' is the rounded a + b; 'typed' takes params.text, 'bits' takes params.hex.
   */
  var VALUES = {
    p01: { dec: '0.1' },
    p02: { dec: '0.2' },
    p03: { dec: '0.3' },
    one: { dec: '1' },
    two24: { dec: '16777216' },
    sum: { sum: true },
    inf: { special: 'inf' },
    max: { special: 'max' },
    'min-normal': { special: 'minNormal' },
    'min-sub': { special: 'minSub' },
    'neg-zero': { special: 'negZero' },
    nan: { special: 'nan' },
    typed: { typed: true },
    bits: { bits: true }
  };
  var VALUE_IDS = Object.keys(VALUES);

  /** The sum panel's operands: decimal strings, used as their own ids. */
  var OPERANDS = ['0.1', '0.2', '0.3', '0.5', '0.7', '1', '3', '16777216', '1e16'];

  /** The typed field keeps at most this many characters. */
  var MAX_TEXT = 40;

  var defaults = { format: 'binary64', value: 'p01', a: '0.1', b: '0.2', text: '', hex: '', digits: false };

  function P(p) { return Object.assign({}, defaults, p || {}); }
  function fmtOf(id) { return FORMATS[id] || FORMATS[defaults.format]; }

  // ── BigInt helpers ──
  var ZERO = BigInt(0), ONE = BigInt(1), TWO = BigInt(2), FIVE = BigInt(5), TEN = BigInt(10);
  function big(n) { return BigInt(n); }
  function pow2(k) { return ONE << big(k); }
  function pow10(k) { return TEN ** big(k); }
  function bitLength(n) { return n === ZERO ? 0 : n.toString(2).length; }
  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  function abs(n) { return n < ZERO ? -n : n; }

  /** A rational: sign 0 | 1, magnitude n / d with n ≥ 0, d > 0, reduced. */
  function rat(sign, n, d) {
    if (n === ZERO) return { sign: sign, n: ZERO, d: ONE };
    var g = gcd(n, d);
    return { sign: sign, n: n / g, d: d / g };
  }
  /** Signed sum of two rationals. A zero result is +0 (IEEE 754-2019 §6.3 under roundTiesToEven). */
  function ratAdd(x, y) {
    var a = (x.sign ? -x.n : x.n) * y.d, b = (y.sign ? -y.n : y.n) * x.d;
    var n = a + b;
    return rat(n < ZERO ? 1 : 0, abs(n), x.d * y.d);
  }
  function ratEq(x, y) { return x.sign === y.sign && x.n === y.n && x.d === y.d || x.n === ZERO && y.n === ZERO; }

  /**
   * Rule 6: the exact decimal expansion of n / d, all digits. It is finite whenever d has no prime factor but 2 and 5
   * (every binary fraction, every decimal); otherwise null. No exponent notation, no trailing zeros.
   */
  function decimalOf(r) {
    var d = r.d, i = 0, j = 0;
    while (d % TWO === ZERO) { d /= TWO; i++; }
    while (d % FIVE === ZERO) { d /= FIVE; j++; }
    if (d !== ONE) return null;
    var k = Math.max(i, j);
    var N = r.n * pow10(k) / r.d;
    var s = N.toString();
    var out;
    if (k === 0) out = s;
    else {
      while (s.length <= k) s = '0' + s;
      var ip = s.slice(0, s.length - k), fp = s.slice(s.length - k).replace(/0+$/, '');
      out = fp ? ip + '.' + fp : ip;
    }
    return (r.sign && r.n !== ZERO ? '-' : '') + out;
  }

  // ── rule 4: decimal text → rational ──

  /**
   * Parse a decimal number: optional sign, digits with a point or a comma, optional exponent (1e16, 2.5E-3); also
   * inf / infinity / ∞ and nan. Returns { ok, sign, special?: 'inf'|'nan', r?: rational } or { ok: false }.
   * Magnitudes beyond 10^400 or below 10^-400 are taken as overflow / underflow without building the huge number:
   * both formats round them to ∞ or 0 anyway (binary64 spans about 4.9e-324 … 1.8e308).
   */
  function parseDecimal(text) {
    var s = String(text == null ? '' : text).trim().replace(/−/g, '-');
    var m = /^([+-]?)(.*)$/.exec(s);
    var sign = m[1] === '-' ? 1 : 0, body = m[2].toLowerCase();
    if (body === 'inf' || body === 'infinity' || body === '∞') return { ok: true, sign: sign, special: 'inf' };
    if (body === 'nan') return { ok: true, sign: sign, special: 'nan' };
    var d = /^(?:(\d+)(?:[.,](\d*))?|[.,](\d+))(?:e([+-]?\d{1,9}))?$/.exec(body);
    if (!d) return { ok: false };
    var ip = d[1] || '', fp = d[1] !== undefined ? (d[2] || '') : d[3];
    var e10 = (d[4] ? parseInt(d[4], 10) : 0) - fp.length;
    var digits = (ip + fp).replace(/^0+/, '');
    if (!digits) return { ok: true, sign: sign, r: rat(sign, ZERO, ONE) };
    var mag = digits.length + e10;
    if (mag > 400) return { ok: true, sign: sign, special: 'inf', overflow: true };
    if (mag < -400) return { ok: true, sign: sign, r: rat(sign, ZERO, ONE), underflow: true };
    var n = BigInt(digits);
    return { ok: true, sign: sign, r: e10 >= 0 ? rat(sign, n * pow10(e10), ONE) : rat(sign, n, pow10(-e10)) };
  }

  // ── bit patterns ──

  function maskOf(k) { return pow2(k) - ONE; }
  function maxE(F) { return (1 << F.w) - 1; }
  function compose(F, sign, E, f) { return (big(sign) << big(F.bits - 1)) | (big(E) << big(F.p)) | big(f); }
  function patternOfSpecial(F, which, sign) {
    var s = sign || 0;
    switch (which) {
      case 'inf': return compose(F, s, maxE(F), ZERO);
      case 'nan': return compose(F, s, maxE(F), pow2(F.p - 1));            // the quiet NaN: top fraction bit set
      case 'max': return compose(F, s, maxE(F) - 1, maskOf(F.p));
      case 'minNormal': return compose(F, s, 1, ZERO);
      case 'minSub': return compose(F, s, 0, ONE);
      case 'negZero': return compose(F, 1, 0, ZERO);
      default: return compose(F, s, 0, ZERO);
    }
  }

  /**
   * Rules 4 and 5: round the exact rational x to the nearest number of format F, ties to even (roundTiesToEven,
   * IEEE 754-2019 §4.3.1), with gradual underflow to subnormals and overflow to ±∞ (§7.4: ties-to-even sends every
   * value at or beyond max + ½ ULP to ∞). Returns { pattern (BigInt), inexact, tie }.
   */
  function roundRational(x, F) {
    if (x.n === ZERO) return { pattern: compose(F, x.sign, 0, ZERO), inexact: false, tie: false };
    var n = x.n, d = x.d;
    // e = floor(log2(n / d))
    var e = bitLength(n) - bitLength(d);
    if (e >= 0 ? n < (d << big(e)) : (n << big(-e)) < d) e--;
    var emin = 1 - F.bias;
    if (e > F.bias) return { pattern: patternOfSpecial(F, 'inf', x.sign), inexact: true, tie: false };
    if (e < emin) e = emin;                                     // subnormal range: the quantum stays 2^(emin − p)
    var q = e - F.p;                                            // value = m · 2^q with p + 1 bits of m
    var num = q >= 0 ? n : n << big(-q), den = q >= 0 ? d << big(q) : d;
    var m = num / den, rem = num % den;
    var twice = rem * TWO;
    var tie = rem !== ZERO && twice === den;
    if (twice > den || (tie && (m & ONE) === ONE)) m += ONE;  // ties to even: up only when m is odd
    if (m === pow2(F.p + 1)) { m >>= ONE; q++; }                // 1.11…1 rounded up to 10.0
    var E, f;
    if (m >= pow2(F.p)) { E = q + F.p + F.bias; f = m - pow2(F.p); }
    else { E = 0; f = m; }                                      // subnormal (or zero after underflow)
    if (E >= maxE(F)) return { pattern: patternOfSpecial(F, 'inf', x.sign), inexact: true, tie: tie };
    return { pattern: compose(F, x.sign, E, f), inexact: rem !== ZERO, tie: tie };
  }

  /** Rules 1–3: the fields, the kind and the exact value of a bit pattern. */
  function decode(pattern, F) {
    var sign = Number(pattern >> big(F.bits - 1));
    var E = Number((pattern >> big(F.p)) & maskOf(F.w));
    var f = pattern & maskOf(F.p);
    var kind, value = null;
    if (E === maxE(F)) kind = f === ZERO ? 'inf' : 'nan';
    else if (E === 0) kind = f === ZERO ? 'zero' : 'subnormal';
    else kind = 'normal';
    if (kind === 'normal') value = scaled(sign, pow2(F.p) + f, E - F.bias - F.p);
    else if (kind === 'subnormal') value = scaled(sign, f, 1 - F.bias - F.p);
    else if (kind === 'zero') value = rat(sign, ZERO, ONE);
    return { sign: sign, E: E, f: f, kind: kind, value: value };
  }
  /** (−1)^sign · m · 2^k as a rational. */
  function scaled(sign, m, k) { return k >= 0 ? rat(sign, m << big(k), ONE) : rat(sign, m, pow2(-k)); }

  function bitsString(pattern, F) { return pattern.toString(2).padStart(F.bits, '0'); }
  function hexString(pattern, F) { return pattern.toString(16).toUpperCase().padStart(F.bits / 4, '0'); }

  /** The stage's hex field / ?hex=: hex digits only (a leading 0x dropped), at most 16, upper case. */
  function cleanHex(s) {
    return String(s == null ? '' : s).replace(/^\s*0[xX]/, '').replace(/[^0-9a-fA-F]/g, '').slice(0, 16).toUpperCase();
  }

  /**
   * Convert a pattern of format G to format F: a finite value is rounded (exact from binary32 to binary64), ±∞ stays,
   * a NaN becomes the quiet NaN with the same sign (payloads are out of scope).
   */
  function convert(pattern, G, F) {
    if (G === F) return pattern;
    var x = decode(pattern, G);
    if (x.kind === 'inf' || x.kind === 'nan') return patternOfSpecial(F, x.kind, x.sign);
    return roundRational(x.value, F).pattern;
  }

  /** The pattern params.hex stands for in format F: 8 digits are a binary32 pattern, anything else binary64. */
  function patternOfHex(hex, F) {
    var h = cleanHex(hex);
    if (!h) return compose(F, 0, 0, ZERO);
    var G = h.length <= 8 ? FORMATS.binary32 : FORMATS.binary64;
    var pat = BigInt('0x' + h.padStart(G.bits / 4, '0'));
    return convert(pat, G, F);
  }

  /** Flip bit i (0 = least significant) of the pattern; returns the new hex in format F. */
  function flipBit(hex, i, F) {
    var pat = patternOfHex(hex, F) ^ (ONE << big(i));
    return hexString(pat, F);
  }

  /** Bits that differ between two bit strings of the same length (indices from the left, 0 = sign); else []. */
  function changedBits(before, after) {
    if (!before || !after || before.length !== after.length) return [];
    var out = [];
    for (var i = 0; i < after.length; i++) if (before[i] !== after[i]) out.push(i);
    return out;
  }

  // ── what a program prints: the shortest decimal that reads back as the same number ──

  function numberOf(pattern, F) {
    var dv = new DataView(new ArrayBuffer(8));
    if (F.bits === 64) { dv.setBigUint64(0, pattern); return dv.getFloat64(0); }
    dv.setUint32(0, Number(pattern)); return dv.getFloat32(0);
  }
  /** Shortest round-trip decimal (binary64: the language's own; binary32: the fewest digits that read back). */
  function shortestOf(pattern, F) {
    var x = numberOf(pattern, F);
    if (x !== x) return 'NaN';
    if (x === Infinity) return 'Infinity';
    if (x === -Infinity) return '-Infinity';
    if (x === 0) return 1 / x < 0 ? '-0' : '0';
    if (F.bits === 64) return String(x);
    // For each length k, the nearest k-digit decimal and its two k-digit neighbours: at a power of two the rounding
    // interval is narrower below than above, so the neighbour above can read back when the nearest does not.
    for (var k = 1; k <= 9; k++) {
      var m = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(x.toExponential(k - 1));
      var M = BigInt(m[2] + (m[3] || '')), e10 = Number(m[4]) - (k - 1);
      var best = null;
      [M, M + ONE, M - ONE].forEach(function (c) {
        if (c <= ZERO) return;
        var y = Number(m[1] + c.toString() + 'e' + e10);
        if (Math.fround(y) === x && (best === null || Math.abs(y - x) < Math.abs(best - x))) best = y;
      });
      if (best !== null) return String(best);
    }
    return String(x);
  }
  /** 2^k to three significant digits, for the ULP line (k is within ±1100, so Number holds it). */
  function approxPow2(k) { return Math.pow(2, k).toPrecision(3).replace(/e\+/, 'e'); }
  /**
   * A short approximation of an exact decimal string: three significant digits and a power of ten ("1.49e-9"), read
   * from the digits themselves (Number would turn 1e-400 into 0). Rounded half up on the fourth digit; display only.
   */
  function approxOf(dec) {
    if (dec === null) return null;
    var neg = dec.charAt(0) === '-', s = neg ? dec.slice(1) : dec;
    var dot = s.indexOf('.'), ip = dot < 0 ? s : s.slice(0, dot), fp = dot < 0 ? '' : s.slice(dot + 1);
    var all = ip + fp, lead = all.search(/[1-9]/);
    if (lead < 0) return '0';
    var e = ip.length - 1 - lead;
    var dg = (all.slice(lead) + '0000').slice(0, 4);
    var m = Math.round(Number(dg) / 10);                      // three digits, 100 … 1000
    if (m === 1000) { m = 100; e++; }
    var ms = String(m);
    return (neg ? '-' : '') + ms.charAt(0) + '.' + ms.slice(1) + (e ? 'e' + e : '');
  }

  /** Everything the page shows about one pattern. */
  function describe(pattern, F) {
    var x = decode(pattern, F);
    var finite = x.kind !== 'inf' && x.kind !== 'nan';
    var ulpExp = finite ? Math.max(x.E, 1) - F.bias - F.p : null;
    var sig = null;
    if (x.kind === 'normal') sig = decimalOf(rat(0, pow2(F.p) + x.f, pow2(F.p)));
    else if (x.kind === 'subnormal' || x.kind === 'zero') sig = decimalOf(rat(0, x.f, pow2(F.p)));
    return {
      bits: bitsString(pattern, F),
      hex: hexString(pattern, F),
      sign: x.sign,
      expStored: x.E,
      expUnbiased: x.kind === 'normal' ? x.E - F.bias : x.kind === 'subnormal' || x.kind === 'zero' ? 1 - F.bias : null,
      fraction: Number(x.f),
      fractionBits: bitsString(pattern, F).slice(1 + F.w),
      expBits: bitsString(pattern, F).slice(1, 1 + F.w),
      significand: sig,
      kind: x.kind,
      exact: finite ? decimalOf(x.value) : null,
      ulp: finite ? { exp: ulpExp, approx: approxPow2(ulpExp) } : null,
      isMax: x.kind === 'normal' && x.E === maxE(F) - 1 && x.f === maskOf(F.p),
      shortest: shortestOf(pattern, F)
    };
  }

  // ── the sum panel ──

  /** One operand rounded to F: its decimal, the stored pattern and its exact value. */
  function operand(dec, F) {
    var pd = parseDecimal(dec);
    var r = roundRational(pd.r, F);
    var x = decode(r.pattern, F);
    return { dec: dec, rat: pd.r, pattern: r.pattern, value: x.value, inexact: r.inexact };
  }

  /**
   * Rule 5: a + b in format F. Each operand is rounded once on input (rule 4); the exact sum of the stored values is
   * rounded once more (§5.1). The expected number is the decimal sum a + b, rounded once. Equal means the same number
   * (with positive finite operands, the same bit pattern). ulpsApart counts representable numbers between rounded and
   * expected (the pattern difference: consecutive finite numbers of one sign have consecutive patterns).
   */
  function sumOf(aDec, bDec, F) {
    var a = operand(aDec, F), b = operand(bDec, F);
    var exactSum = ratAdd(a.value, b.value);
    var r = roundRational(exactSum, F);
    var expectedRat = ratAdd(a.rat, b.rat);
    var ex = roundRational(expectedRat, F);
    var absorbed = null;
    if (r.pattern === a.pattern && b.value.n !== ZERO) absorbed = 'b';
    else if (r.pattern === b.pattern && a.value.n !== ZERO) absorbed = 'a';
    var dr = describe(r.pattern, F), de = describe(ex.pattern, F);
    return {
      a: { dec: aDec, hex: hexString(a.pattern, F), exact: decimalOf(a.value), inexact: a.inexact },
      b: { dec: bDec, hex: hexString(b.pattern, F), exact: decimalOf(b.value), inexact: b.inexact },
      exactSum: decimalOf(exactSum),
      rounded: { hex: dr.hex, exact: dr.exact, shortest: dr.shortest, inexact: r.inexact, tie: r.tie, ulp: dr.ulp },
      expected: { dec: decimalOf(expectedRat), hex: de.hex, exact: de.exact, shortest: de.shortest, inexact: ex.inexact },
      equal: r.pattern === ex.pattern,
      ulpsApart: Number(r.pattern - ex.pattern),
      absorbed: absorbed,
      pattern: r.pattern
    };
  }

  // ── derive ──

  function derive(params) {
    var p = P(params);
    var format = FORMATS[p.format] ? p.format : defaults.format;
    var F = FORMATS[format];
    var def = VALUES[p.value] || VALUES[defaults.value];
    var aDec = OPERANDS.indexOf(p.a) >= 0 ? p.a : defaults.a;
    var bDec = OPERANDS.indexOf(p.b) >= 0 ? p.b : defaults.b;
    var sum = sumOf(aDec, bDec, F);

    var pattern, source;
    if (def.dec || def.typed) {
      var text = def.dec || String(p.text == null ? '' : p.text).slice(0, MAX_TEXT);
      var pd = def.dec ? parseDecimal(text) : (text.trim() ? parseDecimal(text) : { ok: true, sign: 0, r: rat(0, ZERO, ONE), empty: true });
      if (!pd.ok) {
        pattern = compose(F, 0, 0, ZERO);
        source = { from: 'typed', text: text, error: true };
      } else if (pd.special) {
        pattern = patternOfSpecial(F, pd.special, pd.sign);
        source = { from: def.dec ? 'decimal' : 'typed', text: text, special: pd.special, overflow: !!pd.overflow };
      } else {
        var rr = roundRational(pd.r, F);
        pattern = rr.pattern;
        var stored = decode(pattern, F);
        var diff = stored.value ? ratAdd(stored.value, rat(pd.r.sign ? 0 : 1, pd.r.n, pd.r.d)) : null;
        var tiny = !!pd.underflow;                              // below 10^-400: not built, certainly not exact
        source = {
          from: def.dec ? 'decimal' : 'typed', text: text, dec: tiny ? null : decimalOf(pd.r), empty: !!pd.empty,
          dyadic: !tiny && (pd.r.d & (pd.r.d - ONE)) === ZERO,
          inexact: rr.inexact || tiny, tie: rr.tie, underflow: !!pd.underflow || (pd.r.n !== ZERO && stored.kind === 'zero'),
          overflow: stored.kind === 'inf',
          error: false,
          diff: diff && !tiny ? decimalOf(diff) : null,
          diffApprox: diff && !tiny ? approxOf(decimalOf(diff)) : null
        };
      }
    } else if (def.special) {
      pattern = patternOfSpecial(F, def.special, 0);
      source = { from: 'special', special: def.special };
    } else if (def.sum) {
      pattern = sum.pattern;
      source = { from: 'sum' };
    } else {
      pattern = patternOfHex(p.hex, F);
      source = { from: 'bits' };
    }

    var s = describe(pattern, F);
    s.format = format;
    s.w = F.w;
    s.p = F.p;
    s.bias = F.bias;
    s.source = source;
    delete sum.pattern;
    s.sum = sum;
    return s;
  }

  var presets = [
    { id: 'point-one', params: { format: 'binary32', value: 'p01' } },
    { id: 'sum-64', params: { format: 'binary64', value: 'sum', a: '0.1', b: '0.2' } },
    { id: 'sum-32', params: { format: 'binary32', value: 'sum', a: '0.1', b: '0.2' } },
    { id: 'one-and-next', params: { format: 'binary32', value: 'one' } },
    { id: 'specials', params: { format: 'binary32', value: 'inf' } },
    { id: 'big-plus-one', params: { format: 'binary32', value: 'sum', a: '16777216', b: '1' } }
  ];

  var logic = {
    FORMATS: FORMATS, FORMAT_IDS: FORMAT_IDS, VALUES: VALUES, VALUE_IDS: VALUE_IDS, OPERANDS: OPERANDS,
    MAX_TEXT: MAX_TEXT, defaults: defaults,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, parseDecimal: parseDecimal, roundRational: roundRational, decode: decode, decimalOf: decimalOf,
    describe: describe, sumOf: sumOf, convert: convert, patternOfHex: patternOfHex, patternOfSpecial: patternOfSpecial,
    approxOf: approxOf, flipBit: flipBit, changedBits: changedBits, cleanHex: cleanHex, shortestOf: shortestOf, hexString: hexString,
    rat: rat, ratAdd: ratAdd, ratEq: ratEq, fmtOf: fmtOf, withDefaults: P, presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
