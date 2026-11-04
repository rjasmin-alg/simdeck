/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ntlm-vs-kerberos: ana on PC07 opens \\fs01\projects by name (Kerberos: a ticket FS01 opens with its
   own key, no DC at access time) or \\10.10.0.20\projects by address (no SPN, Negotiate falls back to NTLM: challenge,
   response from the NT hash, FS01 passes both to DC01). An on-path observer gains a challenge and a response (offline
   guessing only); an administrator on PC07 copies ana's NT hash and answers a new challenge from another host
   (pass-the-hash). One step = one message (the theft of the hash is one step too). Rules and numbers: SPEC.md.
   The NTLM arithmetic is real: MD4 (RFC 1320), MD5 (RFC 1321), HMAC-MD5 (RFC 2104), NTLMv2 ([MS-NLMP] §3.3.2).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── bytes: arrays of numbers 0…255 ──

  function hex(b) { return b.map(function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join(''); }
  function unhex(s) { var out = []; for (var i = 0; i < s.length; i += 2) out.push(parseInt(s.substr(i, 2), 16)); return out; }
  /** UTF-16LE of a string (the BMP is enough here). */
  function utf16le(s) { var out = []; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); out.push(c & 0xff, c >>> 8); } return out; }
  function rotl(v, s) { return ((v << s) | (v >>> (32 - s))) >>> 0; }
  /** Pad a message the MD4/MD5 way and split it into blocks of 16 little-endian words. */
  function blocks(bytes) {
    var m = bytes.slice(), bits = bytes.length * 8, out = [];
    m.push(0x80);
    while (m.length % 64 !== 56) m.push(0);
    for (var i = 0; i < 8; i++) m.push(i < 4 ? (bits >>> (8 * i)) & 0xff : 0);
    for (var b = 0; b < m.length; b += 64) {
      var X = [];
      for (var j = 0; j < 16; j++) X.push((m[b + 4 * j] | m[b + 4 * j + 1] << 8 | m[b + 4 * j + 2] << 16 | m[b + 4 * j + 3] << 24) >>> 0);
      out.push(X);
    }
    return out;
  }
  function words(ws) { var out = []; ws.forEach(function (w) { for (var i = 0; i < 4; i++) out.push((w >>> (8 * i)) & 0xff); }); return out; }

  /** MD4 (RFC 1320). */
  function md4(bytes) {
    var h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    function F(x, y, z) { return (x & y) | (~x & z); }
    function G(x, y, z) { return (x & y) | (x & z) | (y & z); }
    function H(x, y, z) { return x ^ y ^ z; }
    blocks(bytes).forEach(function (X) {
      var a = h[0], b = h[1], c = h[2], d = h[3], k;
      function r(f, add, w, x, y, z, i, s) { return rotl((w + f(x, y, z) + X[i] + add) >>> 0, s); }
      for (k = 0; k < 16; k += 4) {
        a = r(F, 0, a, b, c, d, k, 3); d = r(F, 0, d, a, b, c, k + 1, 7); c = r(F, 0, c, d, a, b, k + 2, 11); b = r(F, 0, b, c, d, a, k + 3, 19);
      }
      for (k = 0; k < 4; k++) {
        a = r(G, 0x5a827999, a, b, c, d, k, 3); d = r(G, 0x5a827999, d, a, b, c, k + 4, 5);
        c = r(G, 0x5a827999, c, d, a, b, k + 8, 9); b = r(G, 0x5a827999, b, c, d, a, k + 12, 13);
      }
      [0, 2, 1, 3].forEach(function (k3) {
        a = r(H, 0x6ed9eba1, a, b, c, d, k3, 3); d = r(H, 0x6ed9eba1, d, a, b, c, k3 + 8, 9);
        c = r(H, 0x6ed9eba1, c, d, a, b, k3 + 4, 11); b = r(H, 0x6ed9eba1, b, c, d, a, k3 + 12, 15);
      });
      h = [(h[0] + a) >>> 0, (h[1] + b) >>> 0, (h[2] + c) >>> 0, (h[3] + d) >>> 0];
    });
    return words(h);
  }

  var MD5_K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];
  var MD5_S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];

  /** MD5 (RFC 1321). */
  function md5(bytes) {
    var h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    blocks(bytes).forEach(function (X) {
      var a = h[0], b = h[1], c = h[2], d = h[3];
      for (var i = 0; i < 64; i++) {
        var f, g, q = i >> 4;
        if (q === 0) { f = (b & c) | (~b & d); g = i; }
        else if (q === 1) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
        else if (q === 2) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
        else { f = c ^ (b | ~d); g = (7 * i) % 16; }
        var tmp = d;
        d = c; c = b;
        b = (b + rotl((a + (f >>> 0) + MD5_K[i] + X[g]) >>> 0, MD5_S[q * 4 + (i % 4)])) >>> 0;
        a = tmp;
      }
      h = [(h[0] + a) >>> 0, (h[1] + b) >>> 0, (h[2] + c) >>> 0, (h[3] + d) >>> 0];
    });
    return words(h);
  }

  /** HMAC-MD5 (RFC 2104); keys here are 16 bytes, never longer than a block. */
  function hmacMd5(key, msg) {
    var k = key.slice();
    while (k.length < 64) k.push(0);
    var ipad = k.map(function (x) { return x ^ 0x36; }), opad = k.map(function (x) { return x ^ 0x5c; });
    return md5(opad.concat(md5(ipad.concat(msg))));
  }

  // ── the domain ──

  var USER = 'ana';
  var DOMAIN = 'QUILLMOOR';
  var SHARE = 'projects';
  var FS_NAME = 'fs01.quillmoor.example';
  var FS_IP = '10.10.0.20';
  /** ana and ivan were both given this password by the helpdesk (never shown on the page). */
  var PASSWORD = 'Jesen2026';
  // from sims/win-kerberos/sim.js @ 11f419a: SPN → the account that owns it. No account owns an SPN for the address.
  var SPNS = { 'cifs/fs01.quillmoor.example': 'FS01$' };
  function spnOwner(spn) { return Object.prototype.hasOwnProperty.call(SPNS, spn) ? SPNS[spn] : null; }

  /** Fixed "random" values so the page is deterministic (SPEC.md, "Fixed values"). */
  var RUN = {
    pc: { challenge: '8c2f61d04ab7e935', clientChallenge: '5e1f0c3a9b2d7748' },
    x: { challenge: '3d90e2b7c1458a6f', clientChallenge: 'a7046b1e93cd2f58' }
  };
  /** 2026-11-04 08:30:00 UTC as a FILETIME, little-endian. */
  var TIMESTAMP = '00b457ae366cdd01';

  // ── the rules, as pure functions ──

  /** Rule 5: NT hash = MD4(UTF-16LE(password)), no salt. */
  function ntHash(password) { return hex(md4(utf16le(password))); }

  /** Rule 3: NTOWFv2 = HMAC-MD5(NT hash, UTF-16LE(UPPER(user) ‖ domain)). Takes the hash, not the password (rule 6). */
  function ntowfv2(hashHex, user, domain) { return hex(hmacMd5(unhex(hashHex), utf16le(user.toUpperCase() + domain))); }

  /** The target info FS01 puts in CHALLENGE: NetBIOS domain (2), NetBIOS computer (1), end (0). */
  function targetInfo(domain, computer) {
    function av(id, s) { var b = utf16le(s); return [id & 0xff, id >>> 8, b.length & 0xff, b.length >>> 8].concat(b); }
    return hex(av(2, domain).concat(av(1, computer), [0, 0, 0, 0]));
  }

  /** Rule 3: the client's blob. */
  function blob(timestamp, clientChallenge, info) { return '0101000000000000' + timestamp + clientChallenge + '00000000' + info + '00000000'; }

  /** Rule 3: NTProofStr = HMAC-MD5(NTOWFv2, server challenge ‖ blob). */
  function ntProof(hashHex, user, domain, challenge, blobHex) {
    return hex(hmacMd5(unhex(ntowfv2(hashHex, user, domain)), unhex(challenge + blobHex)));
  }

  /** Rule 4: DC01 recomputes the proof from its stored hash for the user and compares. */
  function dcVerify(store, auth, challenge) {
    var h = Object.prototype.hasOwnProperty.call(store, auth.user) ? store[auth.user] : null;
    if (!h) return false;
    return ntProof(h, auth.user, auth.domain, challenge, auth.blob) === auth.proof;
  }

  /** Rule 7: one offline guess against a captured challenge and response: right when it reproduces the proof. */
  function guessMatches(capture, password) {
    return ntProof(ntHash(password), capture.user, capture.domain, capture.challenge, capture.blob) === capture.proof;
  }

  /**
   * Rule 1: Negotiate. Kerberos first; NTLM when no service ticket can be had. The first reason that holds is given:
   * local account, realm, no DC, address (unless TryIPSPN is set and an SPN for the address is registered).
   */
  function negotiate(o) {
    var spn = 'cifs/' + (o.target === 'ip' ? FS_IP : FS_NAME);
    if (o.localAccount) return { protocol: 'ntlm', reason: 'local', spn: null };
    if (o.inRealm === false) return { protocol: 'ntlm', reason: 'realm', spn: null };
    if (o.dcReachable === false) return { protocol: 'ntlm', reason: 'no-dc', spn: null };
    if (o.target === 'ip' && !(o.tryIpSpn && o.ipSpn)) return { protocol: 'ntlm', reason: 'ip', spn: null };
    return { protocol: 'kerberos', reason: null, spn: spn };
  }

  /** Rule 8: the attacker's host connects by the address; ana by the target she typed. */
  function runTarget(p) { return p.attacker === 'admin' ? 'ip' : p.target; }
  function uncFor(target) { return '\\\\' + (target === 'ip' ? FS_IP : 'fs01') + '\\' + SHARE; }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /** The phases of each path, in order. */
  var PATH = {
    kerberos: ['tgs-req', 'tgs-rep', 'ap-req', 'k-access'],
    ntlm: ['negotiate', 'challenge', 'authenticate', 'pass', 'dc-reply', 'n-access']
  };

  var logic = {
    /** Parameter defaults. */
    defaults: { target: 'name', attacker: 'none' },

    USER: USER,
    DOMAIN: DOMAIN,
    FS_NAME: FS_NAME,
    FS_IP: FS_IP,
    RUN: RUN,
    TIMESTAMP: TIMESTAMP,
    PATH: PATH,

    /** Lanes for these params: the attacker's host only when the attacker is admin on PC07. */
    lanes: function (p) { return p.attacker === 'admin' ? ['pc', 'x', 'fs', 'dc'] : ['pc', 'fs', 'dc']; },

    /** Steps for these params (by-name 4, by-ip 6, capture 6, pass-the-hash 7). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 20) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0: who holds which hash and key; Negotiate has chosen the protocol; nothing sent yet. */
    initial: function (p) {
      var target = runTarget(p);
      var neg = negotiate({ target: target });
      var hash = ntHash(PASSWORD);
      return {
        target: target,
        protocol: neg.protocol,
        reason: neg.reason,
        spn: neg.spn,
        client: p.attacker === 'admin' ? 'x' : 'pc',
        unc: uncFor(target),
        // what each party holds (rule 5: DC01 has one unsalted hash per account; ana's equals ivan's)
        store: { ana: hash, ivan: hash },
        memory: { pc: { hash: hash, tgt: true }, x: { hash: null } },
        wire: [],
        attacker: { hash: false, capture: false },
        contacts: { pcToDc: 0, fsToDc: 0 },
        challenge: null,
        response: null,
        access: null,
        phase: p.attacker === 'admin' ? 'theft' : PATH[neg.protocol][0],
        log: []
      };
    },

    /** State after step n: one message more (or the theft of the hash). */
    step: function (s0, n, p) {
      var s = clone(s0);
      var c = s.client;
      var watch = p.attacker === 'observer';
      var e;
      function gain(item) { s.wire.push({ n: n, item: item }); e.gained = (e.gained || []).concat(item); }
      function next() { var path = PATH[s.protocol], i = path.indexOf(s.phase); s.phase = i < path.length - 1 ? path[i + 1] : 'done'; }
      switch (s.phase) {
        case 'theft':
          // rule 6: an administrator on PC07 reads ana's NT hash from memory and takes it to its own host
          e = { n: n, kind: 'note', name: 'THEFT', at: 'pc', to: 'x' };
          s.memory.x.hash = s.memory.pc.hash;
          s.attacker.hash = true;
          gain('hash');
          s.phase = PATH[s.protocol][0];
          break;
        // ── Kerberos (rule 2): ana's TGT is from logon ──
        case 'tgs-req':
          e = { n: n, kind: 'msg', name: 'TGS-REQ', proto: 'kerberos', from: c, to: 'dc', spn: s.spn,
            carries: [{ type: 'ticket', what: 'tgt', lock: 'krbtgt' }, { type: 'auth', lock: 'skTgs' }, { type: 'spn', spn: s.spn }] };
          s.contacts.pcToDc++;
          next();
          break;
        case 'tgs-rep':
          e = { n: n, kind: 'msg', name: 'TGS-REP', proto: 'kerberos', from: 'dc', to: c, spn: s.spn,
            carries: [{ type: 'ticket', what: 'st', lock: spnOwner(s.spn) }, { type: 'part', lock: 'skTgs', holds: ['skFs'] }] };
          next();
          break;
        case 'ap-req':
          e = { n: n, kind: 'msg', name: 'AP-REQ', proto: 'kerberos', from: c, to: 'fs',
            carries: [{ type: 'ticket', what: 'st', lock: 'FS01$' }, { type: 'auth', lock: 'skFs' }] };
          next();
          break;
        case 'k-access':
          // FS01 opens the ticket with its own key and reads ana's groups from the PAC: the DC is not asked
          e = { n: n, kind: 'msg', name: 'AP-REP', proto: 'kerberos', from: 'fs', to: c, access: true, openedWith: 'FS01$',
            carries: [{ type: 'part', lock: 'skFs' }] };
          s.access = USER;
          next();
          break;
        // ── NTLM (rules 3 and 4) ──
        case 'negotiate':
          e = { n: n, kind: 'msg', name: 'NEGOTIATE', proto: 'ntlm', from: c, to: 'fs', reason: s.reason };
          next();
          break;
        case 'challenge':
          s.challenge = RUN[c].challenge;
          e = { n: n, kind: 'msg', name: 'CHALLENGE', proto: 'ntlm', from: 'fs', to: c, challenge: s.challenge, info: targetInfo(DOMAIN, 'FS01') };
          if (watch) gain('challenge');
          next();
          break;
        case 'authenticate': {
          // rule 6: the only secret in the computation is the NT hash in the client's memory
          var hash = s.memory[c].hash;
          var b = blob(TIMESTAMP, RUN[c].clientChallenge, targetInfo(DOMAIN, 'FS01'));
          s.response = { user: USER, domain: DOMAIN, blob: b, proof: ntProof(hash, USER, DOMAIN, s.challenge, b) };
          e = { n: n, kind: 'msg', name: 'AUTHENTICATE', proto: 'ntlm', from: c, to: 'fs', user: USER, domain: DOMAIN,
            proof: s.response.proof, fromHash: true };
          if (watch) { gain('response'); s.attacker.capture = true; }
          next();
          break;
        }
        case 'pass':
          // rule 4: FS01 has no hash of ana, so it hands challenge and response to DC01
          e = { n: n, kind: 'msg', name: 'PASS-THROUGH', proto: 'netlogon', from: 'fs', to: 'dc', user: USER, challenge: s.challenge, proof: s.response.proof };
          s.contacts.fsToDc++;
          next();
          break;
        case 'dc-reply': {
          var ok = dcVerify(s.store, s.response, s.challenge);
          e = { n: n, kind: 'msg', name: 'DC-REPLY', proto: 'netlogon', from: 'dc', to: 'fs', ok: ok, user: USER };
          if (ok) next(); else s.phase = 'denied';
          break;
        }
        case 'n-access':
          e = { n: n, kind: 'msg', name: 'ACCESS', proto: 'ntlm', from: 'fs', to: c, access: true, as: USER };
          s.access = USER;
          next();
          break;
        case 'denied':
          e = { n: n, kind: 'msg', name: 'ACCESS', proto: 'ntlm', from: 'fs', to: c, access: false };
          s.phase = 'done';
          break;
        default:
          return s;
      }
      s.log.push(e);
      return s;
    },

    // exported for the page and the tests
    hex: hex,
    unhex: unhex,
    utf16le: utf16le,
    md4: md4,
    md5: md5,
    hmacMd5: hmacMd5,
    ntHash: ntHash,
    ntowfv2: ntowfv2,
    targetInfo: targetInfo,
    blob: blob,
    ntProof: ntProof,
    dcVerify: dcVerify,
    guessMatches: guessMatches,
    negotiate: negotiate,
    spnOwner: spnOwner,
    runTarget: runTarget,
    uncFor: uncFor
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
