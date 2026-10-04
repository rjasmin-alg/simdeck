/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-kerberos: ana on PC07 opens \\fs01\projects. AS exchange (pre-authentication, TGT locked with the
   krbtgt key), TGS exchange (service ticket locked with FS01$'s key), AP exchange (FS01 opens the ticket with its own
   key, the DC is not contacted). Every timestamp is checked against the receiver's clock: more than 5 minutes apart
   fails with KRB_AP_ERR_SKEW. One step = one message or one check. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MIN = 60, HOUR = 3600, DAY = 86400;
  /** Kerberos policy defaults (Default Domain Policy): skew 5 min, TGT 10 h, renewal 7 days, service ticket 600 min. */
  var POLICY = { skew: 5 * MIN, tgtLife: 10 * HOUR, renew: 7 * DAY, stLife: 600 * MIN };
  /** ana logs on at 08:00:00 domain time. */
  var LOGON = 8 * HOUR;

  var USER = 'ana';
  var SHARE = 'projects';
  var FS_NAME = 'fs01.quillmoor.example';
  var FS_IP = '10.10.0.20';
  /** SPN → the account that owns it (the KDC's directory). No account owns an SPN for the address. */
  var SPNS = { 'cifs/fs01.quillmoor.example': 'FS01$' };
  /** Every account's long-term key, as the KDC holds them. */
  var KDC_KEYS = ['krbtgt', 'ana', 'FS01$'];

  var ERR = {
    KRB_AP_ERR_SKEW: 37,
    KDC_ERR_S_PRINCIPAL_UNKNOWN: 7,
    KRB_AP_ERR_REPEAT: 34
  };

  var LANES = ['pc', 'kdc', 'fs'];

  /** The SPN PC07 asks for: by name the server's host name, by address the address (rule 5). */
  function spnFor(p) { return 'cifs/' + (p.byName ? FS_NAME : FS_IP); }
  /** The path the user typed. */
  function uncFor(p) { return '\\\\' + (p.byName ? 'fs01' : FS_IP) + '\\' + SHARE; }

  // ── the rules, as pure functions ──

  /** Rule 2 and rule 8: the time in a request is accepted while |client − server| ≤ the limit (5:00 passes). */
  function skewOk(client, server) { return Math.abs(client - server) <= POLICY.skew; }
  /** Rule 9: a ticket is usable while now < expires (at the expiry it is expired). */
  function valid(ticket, now) { return !!ticket && now < ticket.expires; }
  /** Rule 7: a new TGT, issued at `now`. */
  function newTgt(now) { return { issued: now, expires: now + POLICY.tgtLife, renewTill: now + POLICY.renew }; }
  /** Rule 7: a service ticket never outlives the TGT it came from. */
  function newSt(now, tgt) { return { issued: now, expires: Math.min(now + POLICY.stLife, tgt.expires) }; }
  /** Rule 5: the account owning an SPN, or null. */
  function spnOwner(spn) { return Object.prototype.hasOwnProperty.call(SPNS, spn) ? SPNS[spn] : null; }

  /** Rule 5: the KDC's answer to a TGS-REQ. The authenticator is checked before the SPN is looked up. */
  function tgsCheck(authTime, kdcTime, spn) {
    if (!skewOk(authTime, kdcTime)) return { error: 'KRB_AP_ERR_SKEW' };
    var owner = spnOwner(spn);
    if (!owner) return { error: 'KDC_ERR_S_PRINCIPAL_UNKNOWN' };
    return { error: null, owner: owner };
  }

  /** Rule 6: the server's check of an AP-REQ: the authenticator's time, then its replay cache. */
  function apCheck(auth, serverTime, replay) {
    if (!skewOk(auth.time, serverTime)) return 'KRB_AP_ERR_SKEW';
    for (var i = 0; i < replay.length; i++) if (replay[i].client === auth.client && replay[i].time === auth.time) return 'KRB_AP_ERR_REPEAT';
    return null;
  }

  /** The cache at the start of the run (SPEC.md "Times"). */
  function startCache(p) {
    var cache = { tgt: null, st: {} };
    if (p.hoursLater > 0 || p.cached) cache.tgt = newTgt(LOGON);
    if (p.cached) cache.st['cifs/' + FS_NAME] = newSt(LOGON, cache.tgt);
    return cache;
  }

  /** Where the run starts at domain time `now` (rule 7): a valid service ticket → AP, a valid TGT → TGS, else AS. */
  function startPhase(cache, spn, now) {
    if (valid(cache.st[spn], now)) return 'ap-req';
    if (valid(cache.tgt, now)) return 'tgs-req';
    return 'as-req';
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function addKey(list, k) { if (list.indexOf(k) < 0) list.push(k); }

  var logic = {
    /** Parameter defaults. */
    defaults: { skewMin: 0, byName: true, cached: false, hoursLater: 0 },

    POLICY: POLICY,
    LOGON: LOGON,
    ERR: ERR,
    LANES: LANES,
    USER: USER,
    FS_NAME: FS_NAME,
    FS_IP: FS_IP,
    KDC_KEYS: KDC_KEYS,

    /** Steps for these params: the messages and checks until access or an error (open-share: 8). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 20) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0: the clocks, PC07's cache and the keys each party holds; nothing sent yet. */
    initial: function (p) {
      var now = LOGON + p.hoursLater * HOUR;
      var cache = startCache(p);
      var spn = spnFor(p);
      // valid or not, a cached ticket came with its session key
      var pcKeys = [USER];
      if (cache.tgt) pcKeys.push('skTgs');
      if (cache.st['cifs/' + FS_NAME]) pcKeys.push('skFs');
      return {
        clocks: { pc: now + p.skewMin * MIN, kdc: now, fs: now },
        spn: spn,
        unc: uncFor(p),
        cache: cache,
        keys: { pc: pcKeys, kdc: KDC_KEYS.slice(), fs: ['FS01$'] },
        replay: [],
        phase: startPhase(cache, spn, now),
        start: startPhase(cache, spn, now),
        error: null,
        log: []
      };
    },

    /** State after step n: one message or one check more. */
    step: function (s0, n, p) {
      var s = clone(s0);
      var c = s.clocks;
      var e = { n: n };
      switch (s.phase) {
        case 'as-req':
          // rule 1: the user name and a timestamp under ana's key; no password on the wire
          e = { n: n, kind: 'msg', name: 'AS-REQ', from: 'pc', to: 'kdc', half: 'as',
            carries: [{ type: 'auth', lock: 'ana', time: c.pc, pa: true }], used: { pc: ['ana'] } };
          s.phase = 'as-check';
          break;
        case 'as-check': {
          // rule 2: the KDC opens the timestamp with ana's stored key and compares it with its own clock
          var ok = skewOk(c.pc, c.kdc);
          e = { n: n, kind: 'check', at: 'kdc', half: 'as', test: 'skew', ok: ok, skew: c.pc - c.kdc, used: { kdc: ['ana'] } };
          if (!ok) { s.error = 'KRB_AP_ERR_SKEW'; s.phase = 'error'; s.errFrom = 'kdc'; } else s.phase = 'as-rep';
          break;
        }
        case 'as-rep': {
          // rule 3: TGT under krbtgt (session key + PAC), the session key again under ana's key
          var tgt = newTgt(c.kdc);
          s.cache.tgt = tgt;
          addKey(s.keys.pc, 'skTgs');
          e = { n: n, kind: 'msg', name: 'AS-REP', from: 'kdc', to: 'pc', half: 'as',
            carries: [{ type: 'ticket', what: 'tgt', lock: 'krbtgt', holds: ['skTgs', 'pac'], expires: tgt.expires, renewTill: tgt.renewTill, fresh: true },
              { type: 'part', lock: 'ana', holds: ['skTgs'], expires: tgt.expires }],
            used: { kdc: ['krbtgt', 'ana'], pc: ['ana'] }, added: { pc: ['skTgs'] }, issued: 'tgt' };
          s.phase = 'tgs-req';
          break;
        }
        case 'tgs-req':
          // rule 4: TGT + authenticator under the TGS session key + the SPN
          e = { n: n, kind: 'msg', name: 'TGS-REQ', from: 'pc', to: 'kdc', half: 'tgs',
            carries: [{ type: 'ticket', what: 'tgt', lock: 'krbtgt', expires: s.cache.tgt.expires }, { type: 'auth', lock: 'skTgs', time: c.pc },
              { type: 'spn', spn: s.spn }],
            used: { pc: ['skTgs'] } };
          s.phase = 'tgs-rep';
          break;
        case 'tgs-rep': {
          // rule 5: open the TGT with krbtgt, check the authenticator's time, find the SPN's owner
          var r = tgsCheck(c.pc, c.kdc, s.spn);
          var used = { kdc: ['krbtgt'] };
          if (r.error) {
            s.error = r.error;
            e = { n: n, kind: 'msg', name: 'KRB-ERROR', from: 'kdc', to: 'pc', half: 'tgs', error: r.error, code: ERR[r.error],
              skew: c.pc - c.kdc, spn: s.spn, ntlm: r.error === 'KDC_ERR_S_PRINCIPAL_UNKNOWN', used: used };
            s.phase = 'done';
            break;
          }
          var st = newSt(c.kdc, s.cache.tgt);
          s.cache.st[s.spn] = st;
          addKey(s.keys.pc, 'skFs');
          used.kdc.push(r.owner);
          e = { n: n, kind: 'msg', name: 'TGS-REP', from: 'kdc', to: 'pc', half: 'tgs', owner: r.owner, skew: c.pc - c.kdc, spn: s.spn,
            carries: [{ type: 'ticket', what: 'st', lock: r.owner, holds: ['skFs', 'pac'], expires: st.expires, spn: s.spn, fresh: true },
              { type: 'part', lock: 'skTgs', holds: ['skFs'], expires: st.expires }],
            used: { kdc: used.kdc, pc: ['skTgs'] }, added: { pc: ['skFs'] }, issued: 'st' };
          s.phase = 'ap-req';
          break;
        }
        case 'ap-req':
          // rule 6: service ticket + authenticator under the service session key, inside SMB session setup
          e = { n: n, kind: 'msg', name: 'AP-REQ', from: 'pc', to: 'fs',
            carries: [{ type: 'ticket', what: 'st', lock: 'FS01$', expires: s.cache.st[s.spn].expires, spn: s.spn }, { type: 'auth', lock: 'skFs', time: c.pc }],
            used: { pc: ['skFs'] }, fromCache: s.start === 'ap-req' };
          s.phase = 'ap-check';
          break;
        case 'ap-check': {
          // rule 6: FS01 opens the ticket with its own key, checks time and replay cache, builds the token; no DC
          var auth = { client: USER, time: c.pc };
          var err = apCheck(auth, c.fs, s.replay);
          e = { n: n, kind: 'check', at: 'fs', test: 'ap', ok: !err, error: err, skew: c.pc - c.fs, used: { fs: ['FS01$'] } };
          if (err) { s.error = err; s.phase = 'error'; s.errFrom = 'fs'; } else {
            s.replay.push(auth);
            addKey(s.keys.fs, 'skFs');
            e.added = { fs: ['skFs'] };
            s.phase = 'ap-rep';
          }
          break;
        }
        case 'ap-rep':
          // the session setup response (with AP-REP under the service session key): the share opens
          e = { n: n, kind: 'msg', name: 'AP-REP', from: 'fs', to: 'pc', carries: [{ type: 'part', lock: 'skFs', holds: ['time'] }],
            used: { fs: ['skFs'], pc: ['skFs'] }, access: true };
          s.phase = 'done';
          break;
        case 'error':
          // the check failed: the party that checked sends KRB-ERROR (rule 2, rule 6)
          e = { n: n, kind: 'msg', name: 'KRB-ERROR', from: s.errFrom, to: 'pc', half: s.errFrom === 'kdc' ? 'as' : undefined,
            error: s.error, code: ERR[s.error], skew: c.pc - c.kdc, used: {} };
          if (e.half === undefined) delete e.half;
          s.phase = 'done';
          break;
        default:
          return s;
      }
      s.log.push(e);
      return s;
    },

    // exported for the page and the tests
    skewOk: skewOk,
    valid: valid,
    newTgt: newTgt,
    newSt: newSt,
    spnOwner: spnOwner,
    spnFor: spnFor,
    uncFor: uncFor,
    tgsCheck: tgsCheck,
    apCheck: apCheck,
    startCache: startCache,
    startPhase: startPhase
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
