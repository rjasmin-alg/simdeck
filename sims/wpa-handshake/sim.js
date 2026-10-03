/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for wpa-handshake: where the PMK comes from (passphrase, 802.1X/EAP or SAE), the 4-way handshake built on it,
   and what a passive observer records. Rules and sources: SPEC.md (rule numbers in the comments below).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON; keys and nonces are lowercase hex strings.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── bytes, SHA-1, HMAC-SHA1, PBKDF2 and the 802.11i PRF (bytes are plain arrays of 0..255) ──

  function utf8(s) {
    var out = [], b = unescape(encodeURIComponent(s));
    for (var i = 0; i < b.length; i++) out.push(b.charCodeAt(i));
    return out;
  }
  function hex(bytes) { return bytes.map(function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join(''); }
  function unhex(s) { var out = []; for (var i = 0; i < s.length; i += 2) out.push(parseInt(s.substr(i, 2), 16)); return out; }
  function macBytes(mac) { return mac.split(':').map(function (x) { return parseInt(x, 16); }); }

  function sha1(msg) {
    var bytes = msg.concat([0x80]), ml = msg.length, i;
    while (bytes.length % 64 !== 56) bytes.push(0);
    var hi = Math.floor(ml / 0x20000000), lo = (ml * 8) >>> 0;
    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    var h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0, w = new Array(80);
    for (var off = 0; off < bytes.length; off += 64) {
      for (i = 0; i < 16; i++) w[i] = (bytes[off + 4 * i] << 24) | (bytes[off + 4 * i + 1] << 16) | (bytes[off + 4 * i + 2] << 8) | bytes[off + 4 * i + 3];
      for (i = 16; i < 80; i++) { var x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]; w[i] = (x << 1) | (x >>> 31); }
      var a = h0, b = h1, c = h2, d = h3, e = h4;
      for (i = 0; i < 80; i++) {
        var f, k;
        if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
        else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
        else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
        else { f = b ^ c ^ d; k = 0xca62c1d6; }
        var tmp = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) | 0;
        e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = tmp;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
    }
    var out = [];
    [h0, h1, h2, h3, h4].forEach(function (v) { out.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); });
    return out;
  }

  function hmacSha1(key, msg) {
    if (key.length > 64) key = sha1(key);
    var ipad = [], opad = [];
    for (var i = 0; i < 64; i++) { var kb = key[i] || 0; ipad.push(kb ^ 0x36); opad.push(kb ^ 0x5c); }
    return sha1(opad.concat(sha1(ipad.concat(msg))));
  }

  /** PBKDF2-HMAC-SHA1(password, salt, iterations, dkLen bytes) (RFC 2898; 802.11i Annex H.4 for the PSK). */
  function pbkdf2(pass, salt, iter, dkLen) {
    var out = [];
    for (var blk = 1; out.length < dkLen; blk++) {
      var u = hmacSha1(pass, salt.concat([(blk >>> 24) & 255, (blk >>> 16) & 255, (blk >>> 8) & 255, blk & 255]));
      var t = u.slice();
      for (var j = 1; j < iter; j++) {
        u = hmacSha1(pass, u);
        for (var q = 0; q < t.length; q++) t[q] ^= u[q];
      }
      out = out.concat(t);
    }
    return out.slice(0, dkLen);
  }

  /** The 802.11i PRF-n: HMAC-SHA1(K, A ‖ 0 ‖ B ‖ i) for i = 0, 1, …, truncated to n bits (SPEC rule 4). */
  function prf(key, label, data, bits) {
    var out = [], a = utf8(label);
    for (var i = 0; out.length * 8 < bits; i++) out = out.concat(hmacSha1(key, a.concat([0], data, [i])));
    return out.slice(0, bits / 8);
  }

  /** Unsigned byte-string order, first byte first: the min/max tie-break of rule 4. */
  function cmpBytes(a, b) {
    for (var i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
    return a.length - b.length;
  }
  function minMax(a, b) { return cmpBytes(a, b) <= 0 ? a.concat(b) : b.concat(a); }

  // ── the keys (hex in, hex out) ──

  var pmkMemo = {};
  /** Rule 1: PMK = PBKDF2-HMAC-SHA1(passphrase, SSID, 4096, 256 bits). Memoised: it is pure and the replay asks often. */
  function pmkFromPass(pass, ssid) {
    var key = pass + '\u0000' + ssid;
    if (!pmkMemo[key]) pmkMemo[key] = hex(pbkdf2(utf8(pass), utf8(ssid), 4096, 32));
    return pmkMemo[key];
  }

  /** Rule 4: PTK = PRF-384(PMK, "Pairwise key expansion", min/max(AA, SPA) ‖ min/max(ANonce, SNonce)) → KCK, KEK, TK. */
  function ptkOf(pmk, aa, spa, anonce, snonce) {
    var data = minMax(macBytes(aa), macBytes(spa)).concat(minMax(unhex(anonce), unhex(snonce)));
    var ptk = prf(unhex(pmk), 'Pairwise key expansion', data, 384);
    return { kck: hex(ptk.slice(0, 16)), kek: hex(ptk.slice(16, 32)), tk: hex(ptk.slice(32, 48)) };
  }

  /** The MIC of message n: HMAC-SHA1-128 with the KCK over a stand-in for the frame ("M<n>" ‖ payload; SPEC, Simplifications). */
  function micOf(kck, n, payload) {
    return hex(hmacSha1(unhex(kck), utf8('M' + n).concat(unhex(payload || ''))).slice(0, 16));
  }

  /** Rule 8: the PMK out of SAE depends on the password and both sides' fresh random values (a stand-in, not Dragonfly). */
  function saePmk(pass, rS, rA) { return hex(prf(utf8(pass), 'SAE session', unhex(rS).concat(unhex(rA)), 256)); }

  // ── fixed values of the scene (SPEC, Simplifications) ──

  var SEED = utf8('simdeck wpa-handshake');
  function fixed(label, bits) { return hex(prf(SEED, label, [], bits)); }
  var AP_MAC = '02:00:00:00:0a:01';
  var STA_MAC = '02:00:00:00:5a:02';
  var ANONCE = fixed('ANonce', 256);
  var SNONCE = fixed('SNonce', 256);
  var GTK = fixed('GTK', 128);
  var USER = 'ana';
  var EAP_PMK = fixed('EAP session ' + USER, 256);
  var SAE_RS = fixed('SAE random STA', 256);
  var SAE_RA = fixed('SAE random AP', 256);
  var SSID = { psk: 'HomeNet', sae: 'HomeNet', eap: 'Campus' };

  /** Passphrase classes for the explorer: alphabet size, length, a fixed example (SPEC, Explorer numbers). */
  var CLASSES = [
    { id: 'lower8', alphabet: 26, length: 8, example: 'qhzkrmto' },
    { id: 'mixed8', alphabet: 62, length: 8, example: 'x7Qp2mKa' },
    { id: 'words4', alphabet: 7776, length: 4, example: 'kava-most-oblak-sedam' },
    { id: 'rand12', alphabet: 62, length: 12, example: 'T4v9qLm2Zr8w' },
    { id: 'rand20', alphabet: 62, length: 20, example: 'p8Ku3nWq7ZxR2mTb9yLe' }
  ];
  function classOf(id) { return CLASSES.filter(function (c) { return c.id === id; })[0] || CLASSES[0]; }

  /** One step per entry (SPEC, Steps). */
  var SCRIPTS = {
    psk: ['pmk', 'm1', 'staPtk', 'm2', 'm3', 'm4'],
    eap: ['eap', 'pmkToAp', 'm1', 'staPtk', 'm2', 'm3', 'm4'],
    sae: ['saeCommit', 'saeConfirm', 'pmk', 'm1', 'staPtk', 'm2', 'm3', 'm4']
  };
  /** compare: WPA2 waits while WPA3 runs SAE, so both end at the same step. */
  var COMPARE_WAIT = SCRIPTS.sae.length - SCRIPTS.psk.length;

  var SECRET_KEYS = ['pass', 'pmk', 'kck', 'kek', 'tk', 'gtk'];

  function keys(o) {
    var k = { cred: null, pass: null, pmk: null, kck: null, kek: null, tk: null, gtk: null, installed: false };
    Object.keys(o || {}).forEach(function (x) { k[x] = o[x]; });
    return k;
  }

  /** One run (a mode other than compare) at step 0. */
  function initialRun(mode, passClass) {
    var pass = mode === 'eap' ? null : classOf(passClass).example;
    return {
      mode: mode, ssid: SSID[mode], passClass: passClass, passphrase: pass, staMac: STA_MAC, apMac: AP_MAC,
      sta: { keys: keys(mode === 'eap' ? { cred: USER } : { pass: pass }) },
      ap: { keys: keys({ pass: pass, gtk: GTK }) },
      as: mode === 'eap' ? { keys: keys({ cred: '*' }) } : null,
      rows: [], onAir: [],
      observer: { captured: [], canTestGuesses: false, note: 'nothing' },
      last: null, changed: []
    };
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Rules 5–8: record a frame on the air; the first one also gives both MACs and the SSID. */
  function record(s, frame, step) {
    s.onAir.push(frame);
    var cap = s.observer.captured;
    if (cap.length === 0) {
      cap.push({ item: 'apMac', from: 'AP', value: s.apMac, step: step });
      cap.push({ item: 'staMac', from: 'STA', value: s.staMac, step: step });
      cap.push({ item: 'ssid', from: 'AP', value: s.ssid, step: step });
    }
    Object.keys(frame.fields).forEach(function (name) {
      if (name === 'install') return;            // a flag, not a value
      var item = name === 'mic' ? 'mic' + frame.msg.slice(1) : name;
      if (cap.some(function (c) { return c.item === item && c.from === frame.from; })) return;
      cap.push({ item: item, from: frame.from, value: frame.fields[name], step: step });
    });
  }

  function has(s, item) { return s.observer.captured.some(function (c) { return c.item === item; }); }

  /** The observer's verdict (SPEC, Observer notes). */
  function judge(s) {
    var o = s.observer;
    if (s.mode === 'psk') {
      o.canTestGuesses = has(s, 'anonce') && has(s, 'snonce') && has(s, 'mic2') && has(s, 'ssid') && has(s, 'staMac') && has(s, 'apMac');
      o.note = o.canTestGuesses ? 'testable' : o.captured.length ? 'waiting' : 'nothing';
    } else if (s.mode === 'eap') {
      o.canTestGuesses = false;
      o.note = has(s, 'eap') ? 'noShared' : 'nothing';
    } else {
      o.canTestGuesses = false;
      o.note = has(s, 'saeCommit') ? 'online' : 'nothing';
    }
  }

  function msgRow(step, from, to, msg, fields, extra) {
    var row = { kind: 'msg', step: step, from: from, to: to, msg: msg, fields: fields, air: true, lock: false };
    Object.keys(extra || {}).forEach(function (k) { row[k] = extra[k]; });
    return row;
  }
  function noteRow(step, lane, what) { return { kind: 'note', step: step, lane: lane, what: what }; }
  function frameOf(row) {
    var f = {};
    row.fields.forEach(function (x) { f[x.name] = x.value; });
    return { msg: row.msg, from: row.from, to: row.to, fields: f };
  }

  /** One step of a run: kind is the script entry, label the step number shown in the chart. */
  function apply(r, kind, label) {
    var s = clone(r), sta = s.sta.keys, ap = s.ap.keys, ch = [];
    s.last = { did: kind, step: label };
    function send(row) { s.rows.push(row); if (row.air) record(s, frameOf(row), label); }
    switch (kind) {
      case 'pmk': {                                           // rules 1 and 8: computed on both sides, never sent
        var pmk = s.mode === 'sae' ? saePmk(s.passphrase, SAE_RS, SAE_RA) : pmkFromPass(s.passphrase, s.ssid);
        sta.pmk = pmk; ap.pmk = pmk;
        s.rows.push(noteRow(label, 'STA', 'pmk'), noteRow(label, 'AP', 'pmk'));
        ch.push('sta.pmk', 'ap.pmk');
        break;
      }
      case 'eap':                                             // rule 2: per-user PMK at the STA and the server
        send(msgRow(label, 'STA', 'AS', 'eap', [{ name: 'eap', value: fixed('EAP exchange', 64) }]));
        sta.pmk = EAP_PMK; s.as.keys.pmk = EAP_PMK;
        s.rows.push(noteRow(label, 'STA', 'pmk'), noteRow(label, 'AS', 'pmk'));
        ch.push('sta.pmk', 'as.pmk');
        break;
      case 'pmkToAp':                                         // rule 2: over the wired network, protected
        send(msgRow(label, 'AS', 'AP', 'pmk', [], { air: false, lock: true }));
        ap.pmk = s.as.keys.pmk;
        ch.push('ap.pmk');
        break;
      case 'saeCommit':
      case 'saeConfirm': {                                    // rule 8: opaque, both ways
        var name = kind === 'saeCommit' ? 'saeCommit' : 'saeConfirm';
        send(msgRow(label, 'STA', 'AP', name, [{ name: name, value: fixed(name + ' STA', 64) }]));
        send(msgRow(label, 'AP', 'STA', name, [{ name: name, value: fixed(name + ' AP', 64) }]));
        break;
      }
      case 'm1':                                              // rule 3
        send(msgRow(label, 'AP', 'STA', 'M1', [{ name: 'anonce', value: ANONCE }]));
        break;
      case 'staPtk': {                                        // rule 4: the STA has both nonces after M1
        var p1 = ptkOf(sta.pmk, s.apMac, s.staMac, ANONCE, SNONCE);
        sta.kck = p1.kck; sta.kek = p1.kek; sta.tk = p1.tk;
        s.rows.push(noteRow(label, 'STA', 'ptk'));
        ch.push('sta.kck', 'sta.kek', 'sta.tk');
        break;
      }
      case 'm2': {                                            // rules 3, 4: SNonce + MIC; then the AP derives the PTK
        var mic2 = micOf(sta.kck, 2, SNONCE);
        var p2 = ptkOf(ap.pmk, s.apMac, s.staMac, ANONCE, SNONCE);
        ap.kck = p2.kck; ap.kek = p2.kek; ap.tk = p2.tk;
        send(msgRow(label, 'STA', 'AP', 'M2', [{ name: 'snonce', value: SNONCE }, { name: 'mic', value: mic2 }],
          { micOk: micOf(ap.kck, 2, SNONCE) === mic2 }));
        s.rows.push(noteRow(label, 'AP', 'ptk'));
        ch.push('ap.kck', 'ap.kek', 'ap.tk');
        break;
      }
      case 'm3': {                                            // rule 3: ANonce, {GTK}KEK, MIC, install
        var mic3 = micOf(ap.kck, 3, ANONCE);
        send(msgRow(label, 'AP', 'STA', 'M3', [{ name: 'anonce', value: ANONCE }, { name: 'gtkEnc', value: '{GTK}KEK' },
          { name: 'mic', value: mic3 }, { name: 'install', value: '1' }], { micOk: micOf(sta.kck, 3, ANONCE) === mic3 }));
        sta.gtk = ap.gtk;
        ch.push('sta.gtk');
        break;
      }
      case 'm4': {                                            // rule 3: acknowledgement with MIC; both install the TK
        var mic4 = micOf(sta.kck, 4, '');
        send(msgRow(label, 'STA', 'AP', 'M4', [{ name: 'mic', value: mic4 }], { micOk: micOf(ap.kck, 4, '') === mic4 }));
        sta.installed = true; ap.installed = true;
        s.rows.push(noteRow(label, 'STA', 'install'));
        ch.push('sta.installed', 'ap.installed');
        break;
      }
      default:
        throw new Error('unknown step ' + kind);
    }
    judge(s);
    s.changed = ch;
    return s;
  }

  /** A run that waits this step (compare: WPA2 during SAE). */
  function wait(r, label) {
    var s = clone(r);
    s.last = { did: 'wait', step: label };
    s.changed = [];
    return s;
  }

  var logic = {
    AP_MAC: AP_MAC, STA_MAC: STA_MAC, ANONCE: ANONCE, SNONCE: SNONCE, GTK: GTK, USER: USER, EAP_PMK: EAP_PMK,
    SAE_RS: SAE_RS, SAE_RA: SAE_RA, SSID: SSID, CLASSES: CLASSES, SCRIPTS: SCRIPTS, COMPARE_WAIT: COMPARE_WAIT,
    SECRET_KEYS: SECRET_KEYS,

    /** Parameter defaults: the `home` run. guessRate is the exponent of 10 (guesses per second). */
    defaults: { mode: 'psk', observer: false, passClass: 'lower8', guessRate: 6 },

    /** Steps per mode: 6 / 7 / 8, compare 8 (SPEC, Steps). */
    steps: function (p) { return p.mode === 'compare' ? SCRIPTS.sae.length : SCRIPTS[p.mode].length; },

    initial: function (p) {
      if (p.mode === 'compare') return { mode: 'compare', a: initialRun('psk', p.passClass), b: initialRun('sae', p.passClass), last: null };
      return initialRun(p.mode, p.passClass);
    },

    step: function (s, n, p) {
      if (p.mode === 'compare') {
        var a = n > COMPARE_WAIT ? apply(s.a, SCRIPTS.psk[n - 1 - COMPARE_WAIT], n) : wait(s.a, n);
        var b = apply(s.b, SCRIPTS.sae[n - 1], n);
        return { mode: 'compare', a: a, b: b, last: { step: n } };
      }
      return apply(s, SCRIPTS[p.mode][n - 1], n);
    },

    /** The run(s) of a state: one, or the two of compare (WPA2 first). */
    runs: function (s) { return s.mode === 'compare' ? [s.a, s.b] : [s]; },

    /** Explorer rows: each class's space and the seconds to try all of it at 10^guessRate per second. */
    explore: function (p) {
      var rate = Math.pow(10, p.guessRate);
      return CLASSES.map(function (c) {
        var space = Math.pow(c.alphabet, c.length);
        return { id: c.id, alphabet: c.alphabet, length: c.length, space: space, seconds: space / rate };
      });
    },

    classOf: classOf,

    // crypto, exported for the tests (rules 1, 4, 6, 8)
    utf8: utf8, hex: hex, unhex: unhex, macBytes: macBytes, sha1: sha1, hmacSha1: hmacSha1, pbkdf2: pbkdf2, prf: prf,
    cmpBytes: cmpBytes, pmkFromPass: pmkFromPass, ptkOf: ptkOf, micOf: micOf, saePmk: saePmk
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
