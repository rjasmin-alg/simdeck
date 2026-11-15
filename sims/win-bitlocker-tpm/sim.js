/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-bitlocker-tpm: measured boot into TPM registers (PCRs), and the unseal of the BitLocker volume master
   key (VMK) that compares the profile's PCRs with the values recorded at seal time. One step: power on (TPM reset),
   or one boot stage (measured, then it runs). Rules and numbers: SPEC.md.
   The stage list is data and the stepping walks it one stage per step, the pattern of sims/lnx-boot-chain/sim.js
   (CHAINS[…].stages, step) @ 204464f; that model is not in models/ yet, so the pattern is copied, not the code.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── SHA-256 (FIPS 180-4), bytes in, bytes out; small and synchronous so the model stays pure ──

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

  function sha256(bytes) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var len = bytes.length, total = ((len + 9 + 63) >> 6) << 6, m = new Array(total), i, j;
    for (i = 0; i < total; i++) m[i] = i < len ? bytes[i] : 0;
    m[len] = 0x80;
    var bits = len * 8;
    for (i = 0; i < 4; i++) m[total - 1 - i] = (bits >>> (8 * i)) & 0xff;   // messages here are far below 2^32 bits
    var w = new Array(64);
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var off = 0; off < total; off += 64) {
      for (j = 0; j < 16; j++) w[j] = (m[off + 4 * j] << 24) | (m[off + 4 * j + 1] << 16) | (m[off + 4 * j + 2] << 8) | m[off + 4 * j + 3];
      for (j = 16; j < 64; j++) {
        var s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        var s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[j] + w[j]) | 0;
        var t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = [];
    for (i = 0; i < 8; i++) out.push((H[i] >>> 24) & 0xff, (H[i] >>> 16) & 0xff, (H[i] >>> 8) & 0xff, H[i] & 0xff);
    return out;
  }

  function utf8(s) {
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));   // labels here have no surrogates
    }
    return out;
  }
  function toHex(bytes) { return bytes.map(function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join(''); }
  function fromHex(hex) { var out = []; for (var i = 0; i < hex.length; i += 2) out.push(parseInt(hex.substr(i, 2), 16)); return out; }

  var ZERO = '0000000000000000000000000000000000000000000000000000000000000000';
  var PCRS = [0, 2, 4, 7, 11];

  /** Rule 1: PCR_new = SHA-256(PCR_old ‖ SHA-256(measurement)). Hex in, hex out. */
  function extend(oldHex, label) { return toHex(sha256(fromHex(oldHex).concat(sha256(utf8(label))))); }

  // ── the scene: what each stage measures (rule 2) ──

  var PROFILES = { '7,11': [7, 11], '0,2,4,11': [0, 2, 4, 11] };
  var CAP = 'BitLocker=unlocked';

  /** Settings of this boot from the params (the seal was made with SEAL_SETTINGS). */
  function settingsOf(p) {
    return { board: p.otherMachine ? 'B' : 'A', firmware: p.firmwareUpdate ? 'v1.08' : 'v1.07', secureBoot: !!p.secureBoot,
      bootManager: p.bootManager === 'changed' ? 'v2' : 'v1', sameTpm: !p.otherMachine };
  }
  var SEAL_SETTINGS = { board: 'A', firmware: 'v1.07', secureBoot: true, bootManager: 'v1', sameTpm: true };

  /** The stages, in boot order, with the { pcr, label } measurements each makes before it runs (rule 2; ascending PCR). */
  function stagesOf(st) {
    return [
      { id: 'firmware', measures: [{ pcr: 0, label: 'firmware=' + st.board + ' ' + st.firmware },
        { pcr: 2, label: 'optionROM=' + (st.board === 'A' ? 'A gpu 3.1' : 'B gpu 4.0') }] },
      { id: 'secureboot', measures: [{ pcr: 7, label: 'SecureBoot=' + (st.secureBoot ? 'on' : 'off') }] },
      { id: 'bootmgr', measures: [{ pcr: 4, label: 'bootmgr=' + st.bootManager }] },
      { id: 'bitlocker', measures: [] },
      { id: 'winload', measures: [] }
    ];
  }

  function zeros() { var o = {}; PCRS.forEach(function (i) { o[i] = ZERO; }); return o; }

  /** PCR values at the unlock moment (after every measuring stage, before the cap) for the given settings. */
  function pcrsAtUnlock(st) {
    var pcr = zeros();
    stagesOf(st).forEach(function (s) { s.measures.forEach(function (m) { pcr[m.pcr] = extend(pcr[m.pcr], m.label); }); });
    return pcr;
  }

  /** The seal (rule 3): the profile's PCRs at the unlock moment of a boot with the seal-time settings. */
  function sealOf(profile) {
    var list = PROFILES[profile] || PROFILES['7,11'], at = pcrsAtUnlock(SEAL_SETTINGS), values = {};
    list.forEach(function (i) { values[i] = at[i]; });
    return { profile: list.slice(), values: values, tpm: 'A' };
  }

  /** Rule 4 and 7: compare the profile's PCRs with the sealed values, and the TPM. */
  function compare(pcr, sealed, tpm) {
    var rows = {}, all = true;
    sealed.profile.forEach(function (i) {
      var match = pcr[i] === sealed.values[i];
      rows[i] = { now: pcr[i], sealed: sealed.values[i], match: match };
      if (!match) all = false;
    });
    var sameTpm = sealed.tpm === tpm;
    return { pcr: rows, sameTpm: sameTpm, ok: all && sameTpm };
  }

  var logic = {
    PCRS: PCRS, PROFILES: PROFILES, ZERO: ZERO, CAP: CAP, SEAL_SETTINGS: SEAL_SETTINGS,
    sha256: sha256, utf8: utf8, toHex: toHex, extend: extend,
    settingsOf: settingsOf, stagesOf: stagesOf, pcrsAtUnlock: pcrsAtUnlock, sealOf: sealOf, compare: compare,

    defaults: { profile: '7,11', secureBoot: true, firmwareUpdate: false, bootManager: 'original', suspend: false, otherMachine: false },

    presets: [
      { id: 'normal', params: {} },
      { id: 'secure-boot-off', params: { secureBoot: false } },
      { id: 'firmware-update', params: { firmwareUpdate: true } },
      { id: 'suspended', params: { firmwareUpdate: true, suspend: true, profile: '0,2,4,11' } },
      { id: 'disk-moved', params: { otherMachine: true } }
    ],

    /** Power on + five stages, for every setting (SPEC.md). */
    steps: 6,

    initial: function (p) {
      var st = settingsOf(p);
      return {
        stages: stagesOf(st).map(function (s) { return s.id; }),
        power: false, at: -1, done: [], changed: null, extended: [],
        pcr: { 0: null, 2: null, 4: null, 7: null, 11: null }, log: [],
        sealed: sealOf(p.profile), settings: st, suspended: !!p.suspend,
        compare: null, unlocked: null, how: null, recovery: false, capped: false, resealed: false, atUnlock: null
      };
    },

    step: function (s, n, p) {
      var o = JSON.parse(JSON.stringify(s));
      var stages = stagesOf(o.settings);
      o.extended = []; o.changed = null;
      if (!o.power) {                                                    // step 1: power on, TPM reset (rule 1)
        o.power = true; o.at = 0; o.pcr = zeros(); o.extended = PCRS.slice();
        return o;
      }
      if (o.at >= stages.length || o.recovery) return o;                 // nothing after the end or the recovery screen
      var stage = stages[o.at];
      o.changed = stage.id;
      stage.measures.forEach(function (m) {                              // rule 2: measured before it runs
        o.pcr[m.pcr] = extend(o.pcr[m.pcr], m.label);
        o.log.push({ pcr: m.pcr, label: m.label, stage: stage.id });
        o.extended.push(m.pcr);
      });
      if (stage.id === 'bitlocker') {
        o.atUnlock = JSON.parse(JSON.stringify(o.pcr));
        o.compare = compare(o.pcr, o.sealed, o.settings.sameTpm ? 'A' : 'B');
        if (o.suspended) { o.unlocked = true; o.how = 'clearKey'; }      // rule 6: no TPM check
        else if (o.compare.ok) { o.unlocked = true; o.how = 'tpm'; }     // rule 4
        else { o.unlocked = false; }                                     // rule 4, 7
        if (o.unlocked) {                                                // rule 8: the cap
          o.pcr[11] = extend(o.pcr[11], CAP);
          o.log.push({ pcr: 11, label: CAP, stage: stage.id });
          o.extended.push(11);
          o.capped = true;
        }
        o.done.push(stage.id); o.at += 1;
        return o;
      }
      if (stage.id === 'winload') {
        if (!o.unlocked) { o.recovery = true; o.changed = null; return o; }   // rule 4: the recovery screen
        if (o.how === 'clearKey') {                                       // rule 6: reseal to this boot, resume
          var values = {};
          o.sealed.profile.forEach(function (i) { values[i] = o.atUnlock[i]; });
          o.sealed = { profile: o.sealed.profile, values: values, tpm: o.settings.sameTpm ? 'A' : 'B' };
          o.suspended = false; o.resealed = true;
        }
      }
      o.done.push(stage.id); o.at += 1;
      return o;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
