/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for crc-error-detection: one message is sent twice over the same line, once with an even parity bit and once
   with a CRC. The sender's long division (modulo 2) is worked out one XOR row per step; the remainder is the FCS.
   Then the line flips the chosen data bits in both frames, the receiver recounts the parity and divides the received
   codeword. Rules and numbers: SPEC.md.
   The Hamming(15,11) mode (gen = 'hamming15', the code choice's fourth option; preset task fec-hamming) is a second, additive run on the same page:
   eleven data bits get four even parity bits, the line flips positions, the receiver re-checks, reads the syndrome and
   corrects one bit (SPEC.md, "Hamming(15,11)"). The CRC run is unchanged.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Bit 0 is the leftmost (first sent) bit.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** Message length in bits (fixed: the default message 1101011111 and the presets use it). */
  var N = 10;
  /** Generator polynomials offered, as bit strings, highest power first. */
  var GENS = ['10011', '1011', '100000111'];

  // ── bits: pure functions over plain arrays, promotable to models/ unchanged ──

  /** The n bits of value, most significant (bit 0, sent first) first. */
  function bitsOf(value, n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) out.push(Math.floor(value / Math.pow(2, i)) % 2);
    return out;
  }

  /** '10011' → [1, 0, 0, 1, 1]. */
  function parse(s) { return String(s).split('').map(Number); }

  function ones(bits) { return bits.reduce(function (a, b) { return a + b; }, 0); }

  /** Rule 1: the even parity bit makes the number of 1s, check bit included, even. */
  function parityBit(bits) { return ones(bits) % 2; }

  /**
   * Rules 3, 4, 7: long division modulo 2, left to right. At every position whose leading bit is 1 the generator is
   * XORed in (no borrows); a leading 0 is only brought down (XOR with zeros changes nothing, so no row is written).
   * Returns the rows (window start, register before and after) and the remainder: the last deg(gen) bits.
   */
  function divide(bits, gen) {
    var reg = bits.slice(), rows = [], r = gen.length - 1;
    for (var i = 0; i + r < reg.length; i++) {
      if (reg[i] !== 1) continue;
      var before = reg.slice();
      for (var j = 0; j < gen.length; j++) reg[i + j] ^= gen[j];
      rows.push({ at: i, before: before, after: reg.slice() });
    }
    return { rows: rows, remainder: reg.slice(reg.length - r) };
  }

  /** Rule 3: append deg(gen) zeros, divide; the remainder is the FCS and the codeword is data followed by FCS. */
  function encode(data, gen) {
    var r = gen.length - 1;
    var dividend = data.concat(zeros(r));
    var d = divide(dividend, gen);
    return { dividend: dividend, rows: d.rows, fcs: d.remainder, codeword: data.concat(d.remainder) };
  }

  /** Rules 4, 6: the receiver divides the whole received codeword; remainder 0 → accept, otherwise detected. */
  function check(received, gen) {
    var d = divide(received, gen);
    return { rows: d.rows, remainder: d.remainder, accept: ones(d.remainder) === 0 };
  }

  /** Rule 2 at the receiver: an odd count of 1s (check bit included) is an error. */
  function parityCheck(received) {
    var k = ones(received);
    return { ones: k, accept: k % 2 === 0 };
  }

  /** What the receiver's answer means, given whether the line really changed something. */
  function verdict(accept, damaged) { return accept ? (damaged ? 'missed' : 'ok') : 'detected'; }

  function zeros(n) { var z = []; for (var i = 0; i < n; i++) z.push(0); return z; }

  /** Indices (ascending) of the set bits of a flip mask over the N message bits. */
  function flipList(mask) {
    return bitsOf(mask, N).map(function (b, i) { return b ? i : -1; }).filter(function (i) { return i >= 0; });
  }

  /** The frame with the bits at idx inverted. */
  function flipBits(bits, idx) {
    var out = bits.slice();
    idx.forEach(function (i) { out[i] ^= 1; });
    return out;
  }


  // ── Hamming(15,11): pure functions over plain arrays, promotable to models/ unchanged. Positions are 1 … 15. ──

  /** Code word length, data bits, parity positions (powers of two) and data positions (the rest), in order. */
  var H = 15, HK = 11, PPOS = [1, 2, 4, 8], DPOS = [];
  for (var hp = 1; hp <= H; hp++) if (PPOS.indexOf(hp) < 0) DPOS.push(hp);
  /** Steps of the Hamming run: place, p1…p4, send, line, check p1…p4, syndrome, compare. */
  var HSTEPS = 13;
  /** The value of the code choice (param gen) that switches the page to Hamming(15,11). */
  var HAMMING = 'hamming15';

  /** Rule H2: p_j (j = 1 … 4) covers every position whose binary index has bit j − 1 set, itself included. */
  function covers(j) {
    var out = [];
    for (var i = 1; i <= H; i++) if (Math.floor(i / Math.pow(2, j - 1)) % 2 === 1) out.push(i);
    return out;
  }

  /** The 1s of a word (array index = position − 1) over p_j's positions; skip: a position left out of the count. */
  function onesOver(word, j, skip) {
    return covers(j).reduce(function (a, i) { return a + (i === skip ? 0 : word[i - 1]); }, 0);
  }

  /** Rules H1, H2: data a…k into positions 3, 5, 6, 7, 9 … 15; each p_j makes the 1s over its positions even. */
  function hammingEncode(data) {
    var word = [];
    for (var i = 0; i < H; i++) word.push(0);
    DPOS.forEach(function (pos, k) { word[pos - 1] = data[k]; });
    PPOS.forEach(function (pos, j) { word[pos - 1] = onesOver(word, j + 1, pos) % 2; });
    return word;
  }

  /** Rule H1 at the receiver: per check, the 1s over its positions (parity bit included); even passes. */
  function hammingChecks(word) {
    return [1, 2, 3, 4].map(function (j) {
      var k = onesOver(word, j);
      return { ones: k, result: k % 2 === 0 ? 'pass' : 'fail' };
    });
  }

  /** Rule H3: Σ 2^(j−1) over the failed checks (p1 is the lowest bit); 0 = no error found. */
  function syndromeOf(checks) {
    return checks.reduce(function (a, c, j) { return a + (c.result === 'fail' ? Math.pow(2, j) : 0); }, 0);
  }

  /** Rule H4: flip the position the syndrome names back; syndrome 0 changes nothing. */
  function hammingCorrect(word, syndrome) {
    var out = word.slice();
    if (syndrome > 0) out[syndrome - 1] ^= 1;
    return out;
  }

  /** The data bits a…k read back from positions 3, 5, 6, 7, 9 … 15. */
  function hammingDecode(word) { return DPOS.map(function (pos) { return word[pos - 1]; }); }

  /** Positions (ascending, 1 … 15) of the set bits of a 15-bit flip mask; position 1 is the most significant bit. */
  function hflipList(mask) {
    return bitsOf(mask, H).map(function (b, i) { return b ? i + 1 : 0; }).filter(function (i) { return i > 0; });
  }

  function differ(a, b) { return a.reduce(function (n, v, i) { return n + (v !== b[i] ? 1 : 0); }, 0); }

  /**
   * Steps: 0 start (data waits), 1 place, 2–5 compute p1…p4, 6 sent, 7 line, 8–11 re-check p1…p4, 12 syndrome and
   * correction, 13 compare the decoded data with the original. The same 13 for every word and error pattern.
   */
  var HPHASES = ['start', 'place', 'parity', 'parity', 'parity', 'parity', 'sent', 'line', 'check', 'check', 'check', 'check', 'syndrome', 'compare'];

  function hammingState(p, n) {
    var data = bitsOf(p.hdata, HK), sent = hammingEncode(data), flips = hflipList(p.hflip);
    var phase = HPHASES[n];
    var word = [];
    for (var i = 0; i < H; i++) {
      var pos = i + 1, pj = PPOS.indexOf(pos);
      word.push(n === 0 ? null : pj < 0 ? sent[i] : n >= pj + 2 ? sent[i] : null);
    }
    var s = {
      code: 'hamming15',
      phase: phase,
      j: phase === 'parity' ? n - 1 : phase === 'check' ? n - 7 : 0,
      data: data,
      word: word,
      planned: flips,
      flipped: n >= 7 ? flips : [],
      received: null,
      checks: [null, null, null, null],
      syndrome: null,
      corrected: null,
      fixed: null,
      decoded: null,
      wrong: null,
      dataWrong: null,
      verdict: null
    };
    if (n >= 7) {
      s.received = sent.slice();
      flips.forEach(function (pos) { s.received[pos - 1] ^= 1; });
      var all = hammingChecks(s.received);
      s.checks = all.map(function (c, j) { return n >= 8 + j ? c : null; });
      if (n >= 12) {
        s.syndrome = syndromeOf(all);
        s.corrected = s.syndrome > 0 ? s.syndrome : null;
        s.fixed = hammingCorrect(s.received, s.syndrome);
      }
      if (n >= 13) {
        s.decoded = hammingDecode(s.fixed);
        s.wrong = differ(s.fixed, sent);
        s.dataWrong = differ(s.decoded, data);
        // ok: nothing flipped; corrected: flips, and the data came back right; wrong: the data differs (rule H5)
        s.verdict = s.dataWrong > 0 ? 'wrong' : flips.length ? 'corrected' : 'ok';
      }
    }
    return s;
  }

  // ── the run ──

  /**
   * Phases: start (step 0), divide (one XOR row per step), sent (the FCS is appended), and only when bits are
   * flipped: line (the errors arrive), parity (the receiver recounts), crc (the receiver divides).
   */
  function plan(p) {
    var data = bitsOf(p.data, N), gen = parse(p.gen), enc = encode(data, gen), k = enc.rows.length;
    return { data: data, gen: gen, enc: enc, k: k, steps: k + 1 + (p.flip ? 3 : 0) };
  }

  function stateAt(p, n) {
    var pl = plan(p), data = pl.data, gen = pl.gen, enc = pl.enc, k = pl.k;
    var phase = n === 0 ? 'start' : n <= k ? 'divide' : n === k + 1 ? 'sent' : n === k + 2 ? 'line' : n === k + 3 ? 'parity' : 'crc';
    var at = ['start', 'divide', 'sent', 'line', 'parity', 'crc'].indexOf(phase);
    var flips = flipList(p.flip);
    var pbit = parityBit(data);
    var s = {
      phase: phase,
      data: data,
      gen: gen,
      r: gen.length - 1,
      parity: pbit,
      dividend: enc.dividend,
      rows: enc.rows.slice(0, Math.min(n, k)),
      fcs: at >= 2 ? enc.fcs : null,
      codeword: at >= 2 ? enc.codeword : null,
      planned: flips,
      flipped: at >= 3 ? flips : [],
      received: null,
      receivedParity: null,
      parityCheck: null,
      crcCheck: null
    };
    if (at >= 3) {
      s.received = flipBits(enc.codeword, flips);
      s.receivedParity = flipBits(data.concat([pbit]), flips);
    }
    var damaged = flips.length > 0;
    if (at >= 4) {
      var pc = parityCheck(s.receivedParity);
      s.parityCheck = { ones: pc.ones, verdict: verdict(pc.accept, damaged) };
    }
    if (at >= 5) {
      var cc = check(s.received, gen);
      s.crcCheck = { rows: cc.rows, remainder: cc.remainder, verdict: verdict(cc.accept, damaged) };
    }
    return s;
  }

  function isHamming(p) { return p.gen === HAMMING; }

  var logic = {
    N: N,
    GENS: GENS,
    H: H,
    HAMMING: HAMMING,
    HK: HK,
    PPOS: PPOS,
    DPOS: DPOS,

    /** data: the message as a number (bit 0 = its most significant bit); flip: a mask of message bits the line flips.
        gen: a CRC generator (GENS), or HAMMING for the Hamming(15,11) run; hdata: its 11 data bits a…k as a number (a
        most significant), default 10110011101; hflip: a mask of code word positions 1…15 (position 1 most significant). */
    defaults: { data: 863, gen: '10011', flip: 0, hdata: 1437, hflip: 0 },

    /** CRC: k XOR rows + the FCS step, and three more (line, parity, CRC) when the line flips bits. Hamming: 13. */
    steps: function (p) { return isHamming(p) ? HSTEPS : plan(p).steps; },

    initial: function (p) { return isHamming(p) ? hammingState(p, 0) : stateAt(p, 0); },

    /** Every step is a function of the params and n alone, so step back equals replay by construction. */
    step: function (s, n, p) { return isHamming(p) ? hammingState(p, n) : stateAt(p, n); },

    bitsOf: bitsOf,
    parse: parse,
    ones: ones,
    parityBit: parityBit,
    divide: divide,
    encode: encode,
    check: check,
    parityCheck: parityCheck,
    verdict: verdict,
    flipList: flipList,
    flipBits: flipBits,
    /** The flip mask for a list of message bit indices. */
    maskOf: function (idx) {
      return idx.filter(function (i, j) { return idx.indexOf(i) === j; }).reduce(function (m, i) { return m + Math.pow(2, N - 1 - i); }, 0);
    },
    /** The message number for a bit string. */
    valueOf: function (s) { return parseInt(s, 2); },

    covers: covers,
    hammingEncode: hammingEncode,
    hammingChecks: hammingChecks,
    syndromeOf: syndromeOf,
    hammingCorrect: hammingCorrect,
    hammingDecode: hammingDecode,
    hflipList: hflipList,
    /** The Hamming flip mask for a list of positions 1 … 15 (duplicates count once). */
    hmaskOf: function (pos) {
      return pos.filter(function (i, j) { return pos.indexOf(i) === j; }).reduce(function (m, i) { return m + Math.pow(2, H - i); }, 0);
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
