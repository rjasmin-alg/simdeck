/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for digital-signature: sign with the private key, verify with the public key; tampering breaks it.
   Alice signs the toy hash of a message with textbook RSA (no padding), the network carries message + signature past
   Mallory, Bob hashes what arrived, recovers v = s^e mod n with the public key he trusts and compares. Rules and
   numbers: SPEC.md. Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Words live in strings.js. */
(function (root) {
  'use strict';

  // ── SHA-256 (FIPS 180-4), from sims/hash-properties/sim.js @ 377c608 (not in models/ yet) ──

  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  var H0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

  /** The UTF-8 bytes of a string (code points; a lone surrogate becomes U+FFFD, as TextEncoder does). */
  function utf8(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        var d = str.charCodeAt(i + 1);
        if (d >= 0xdc00 && d <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
      }
      if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd;
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  /** SHA-256 of a byte array, as 32 bytes. */
  function sha256Bytes(bytes) {
    var len = bytes.length;
    var msg = bytes.slice();
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    var bitsHi = Math.floor(len / 0x20000000), bitsLo = (len * 8) >>> 0;
    msg.push((bitsHi >>> 24) & 255, (bitsHi >>> 16) & 255, (bitsHi >>> 8) & 255, bitsHi & 255,
      (bitsLo >>> 24) & 255, (bitsLo >>> 16) & 255, (bitsLo >>> 8) & 255, bitsLo & 255);
    var h = H0.slice();
    var w = new Array(64);
    for (var off = 0; off < msg.length; off += 64) {
      for (var t = 0; t < 16; t++) {
        var j = off + 4 * t;
        w[t] = ((msg[j] << 24) | (msg[j + 1] << 16) | (msg[j + 2] << 8) | msg[j + 3]) >>> 0;
      }
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var T1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var T2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + T1) >>> 0; d = c; c = b; b = a; a = (T1 + T2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    var out = [];
    h.forEach(function (x) { out.push((x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255); });
    return out;
  }

  function hex(bytes) {
    return bytes.map(function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
  }

  /** SHA-256 of a string's UTF-8 bytes, as 64 lower-case hex characters. */
  function sha256(str) { return hex(sha256Bytes(utf8(str))); }

  // ── toy RSA ──

  /** The textbook RSA example (Alice) and Mallory's key (SPEC.md, Keys). */
  var KEYS = {
    alice: { p: 61, q: 53, n: 3233, e: 17, d: 2753 },
    mallory: { p: 47, q: 59, n: 2773, e: 17, d: 157 }
  };
  var MESSAGES = ['Plati 100 EUR', 'Plati 900 EUR'];
  var ATTACKS = ['none', 'edit', 'resign', 'swapkey'];
  var PHASES = ['write', 'hash', 'sign', 'send', 'mallory', 'bobHash', 'recover', 'compare', 'conclude'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** b^e mod m for small integers, by repeated squaring (exact while m² < 2^53). */
  function powMod(b, e, m) {
    var r = 1 % m;
    b = ((b % m) + m) % m;
    while (e > 0) {
      if (e & 1) r = (r * b) % m;
      b = (b * b) % m;
      e = Math.floor(e / 2);
    }
    return r;
  }

  /** The 256-bit digest, read big-endian, mod n: byte by byte, so it stays exact in doubles. */
  function digestMod(hexDigest, n) {
    var r = 0;
    for (var i = 0; i < hexDigest.length; i += 2) r = (r * 256 + parseInt(hexDigest.slice(i, i + 2), 16)) % n;
    return r;
  }

  /** The toy hash: SHA-256 of the message, mod n of the key in use (SPEC.md, Hash). */
  function toyHash(msg, n) { return digestMod(sha256(msg), n); }
  function sign(msg, key) { return powMod(toyHash(msg, key.n), key.d, key.n); }
  function recover(sig, key) { return powMod(sig, key.e, key.n); }

  /** The params the model uses: an unknown message or attack falls back to the first; forged defaults to the other
      message (tests set it to reach the tie-break). */
  function norm(p) {
    var msg = MESSAGES.indexOf(p.msg) >= 0 ? p.msg : MESSAGES[0];
    var forged = typeof p.forged === 'string' && p.forged !== msg ? p.forged : MESSAGES[msg === MESSAGES[0] ? 1 : 0];
    return { msg: msg, forged: forged, attack: ATTACKS.indexOf(p.attack) >= 0 ? p.attack : 'none' };
  }

  /** What a valid verdict means (SPEC.md, Tie-break). Explained: the holder of the private key matching the key Bob
      trusts signed exactly the received message. Otherwise a toy-size accident: the same toy hash (collision) or
      v = h' by chance. */
  function explain(s) {
    if (!s.valid) return 'reject';
    if (s.sigFrom === s.bobTrusts && s.signedMsg === s.recvMsg) return s.bobTrusts === 'alice' ? 'authentic' : 'wrongKey';
    return s.sigFrom === s.bobTrusts ? 'collision' : 'chance';
  }

  var logic = {
    KEYS: KEYS,
    MESSAGES: MESSAGES,
    ATTACKS: ATTACKS,
    PHASES: PHASES,

    defaults: { msg: MESSAGES[0], attack: 'none', showNumbers: true },
    steps: PHASES.length,
    norm: norm,

    initial: function () {
      return {
        phase: 'start',
        keys: clone(KEYS),
        msg: null,             // what Alice wrote
        digest: null,          // SHA-256 of msg (hex)
        hashSent: null,        // h = digest mod n_A
        sig: null,             // s = h^d mod n_A
        wire: null,            // { msg, sig, from, to, edited, resigned } on the network in this step
        mallorySaw: null,      // the message as Mallory read it (rule 5)
        malloryDid: null,      // none | edit | resign | swapkey
        recvMsg: null,         // what Bob got
        recvSig: null,
        sigFrom: null,         // whose private key made recvSig
        signedMsg: null,       // the message recvSig was made over
        bobTrusts: 'alice',    // whose public key Bob holds (as Alice's)
        digestRecv: null,
        hashRecv: null,        // h' = H(recvMsg) mod n of the key Bob trusts
        recovered: null,       // v = recvSig^e mod n
        valid: null,
        conclusion: null,      // authentic | reject | wrongKey | collision | chance
        changed: []
      };
    },

    step: function (prev, n, params) {
      var s = clone(prev);
      var q = norm(params);
      var A = KEYS.alice, M = KEYS.mallory;
      var phase = PHASES[n - 1];
      s.phase = phase;
      s.changed = [];
      s.wire = null;
      var K = KEYS[s.bobTrusts];

      switch (phase) {
        case 'write':        // 1. Alice writes the message
          s.msg = q.msg;
          s.changed.push('alice-msg');
          break;
        case 'hash':         // 2. h = SHA-256(m) mod n
          s.digest = sha256(s.msg);
          s.hashSent = digestMod(s.digest, A.n);
          s.changed.push('alice-hash');
          break;
        case 'sign':         // 3. s = h^d mod n: the private key (rule 1)
          s.sig = powMod(s.hashSent, A.d, A.n);
          s.changed.push('alice-sig');
          break;
        case 'send':         // 4. message and signature leave together; Mallory reads the message (rule 5)
          s.wire = { msg: s.msg, sig: s.sig, from: 'alice', to: 'mallory', edited: false, resigned: false };
          s.mallorySaw = s.msg;
          s.changed.push('mallory-saw');
          break;
        case 'mallory':      // 5. Mallory acts, then the pair goes on to Bob
          s.malloryDid = q.attack;
          var m = s.msg, sig = s.sig, from = 'alice', signed = s.msg;
          if (q.attack !== 'none') m = q.forged;                       // edit, resign, swapkey: her message
          if (q.attack === 'resign' || q.attack === 'swapkey') {         // signed with her own private key
            sig = sign(m, M); from = 'mallory'; signed = m;
          }
          if (q.attack === 'swapkey') { s.bobTrusts = 'mallory'; s.changed.push('bob-key'); }
          s.recvMsg = m; s.recvSig = sig; s.sigFrom = from; s.signedMsg = signed;
          s.wire = { msg: m, sig: sig, from: 'mallory', to: 'bob', edited: m !== s.msg, resigned: from !== 'alice' };
          s.changed.push('mallory-act', 'bob-recv');
          break;
        case 'bobHash':      // 6. h' = SHA-256(m') mod n of the key Bob trusts
          s.digestRecv = sha256(s.recvMsg);
          s.hashRecv = digestMod(s.digestRecv, K.n);
          s.changed.push('bob-hash');
          break;
        case 'recover':      // 7. v = s^e mod n: the public key (rule 1)
          s.recovered = recover(s.recvSig, K);
          s.changed.push('bob-recover');
          break;
        case 'compare':      // 8. v = h'? (rules 2, 3, 4)
          s.valid = s.recovered === s.hashRecv;
          s.changed.push('bob-compare');
          break;
        case 'conclude':     // 9. what Bob can conclude (tie-break: explain)
          s.conclusion = explain(s);
          s.changed.push('conclusion');
          break;
      }
      return s;
    },

    sha256: sha256,
    digestMod: digestMod,
    toyHash: toyHash,
    powMod: powMod,
    sign: sign,
    recover: recover,
    explain: explain
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
