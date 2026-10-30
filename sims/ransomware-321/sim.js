/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ransomware-321: an attacker releases ransomware on a file server and every copy of its data is a card.
   One attacker action per step (logon, local admin, the saved backup credential, then each copy it can reach), then
   the night's scheduled jobs, the discovery and the count: which copies still hold a clean version, the newest one,
   and how much data is lost. A copy the attacker reaches with the same credential falls with the source; a mirror
   copies the damage on its next run; an immutable copy refuses the delete; an offline copy is out of reach.
   Rules, tie-breaks and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Times are minutes from Monday
   2026-11-09 00:00 (negative: the days before). The page loads this as a classic script (window.SimLogic); node tests
   require() it. The copies and the checklist are pure functions over plain data and hold no words. */
(function (root) {
  'use strict';

  var H = 60, D = 24 * H;

  /** Fixed times of the night (DR S3: logon 02:10 Monday; the jobs at 22:00; discovery the next morning 07:50). */
  var ATTACK = 2 * H + 10;
  var JOBS = 22 * H;
  var DISCOVERY = D + 7 * H + 50;
  /** The clock of each step, 1-based. Steps 2–8 follow the logon minutes apart (illustrative). */
  var CLOCK = [null, ATTACK, ATTACK + 2, ATTACK + 5, ATTACK + 10, ATTACK + 15, ATTACK + 20, ATTACK + 25, ATTACK + 30,
    JOBS, DISCOVERY, DISCOVERY];
  var STEPS = 11;
  var STEPS_BLOCKED = 2;

  /** Credentials in the order the attacker gains them. */
  var CREDS = ['user', 'localAdmin', 'domainAdmin'];

  /**
   * Every copy the page can show, in card order. `cred`: the credential that can write and delete it ('localAdmin':
   * anything on the server or attached to it; 'domainAdmin': the backup account; null: nothing online reaches it).
   * `versions`: the times of the clean versions it holds when the night begins (minutes from Mon 00:00).
   *   src     the source data D:\Shares, live until the attack
   *   vss     on-volume shadow copies of D: (weekdays 07:00 and 12:00); off in the estate
   *   mirror  the NAS mirror Z:, one copy replaced by each 22:00 run
   *   usb     the USB disk E:, a weekly backup (Fridays 20:00), attached all the time
   *   repo    a versioned backup repository on a NAS, nightly at 22:00
   *   cloud   an off-site copy of the repository's versions in object storage (with a lock in `immutable`)
   *   tape    a weekly tape (Fridays 22:00), taken off site
   */
  var COPIES = [
    { id: 'src', medium: 'disk', site: 'onsite', cred: 'localAdmin', online: true, kind: 'live', versions: [ATTACK] },
    { id: 'vss', medium: 'disk', site: 'onsite', cred: 'localAdmin', online: true, kind: 'snapshot', onVolume: true,
      versions: [-3 * D + 7 * H, -3 * D + 12 * H] },
    { id: 'mirror', medium: 'disk', site: 'onsite', cred: 'domainAdmin', online: true, kind: 'mirror', versions: [-2 * H] },
    { id: 'usb', medium: 'disk', site: 'onsite', cred: 'localAdmin', online: true, kind: 'versioned', attached: true,
      versions: [-10 * D + 20 * H, -3 * D + 20 * H] },
    { id: 'repo', medium: 'disk', site: 'onsite', cred: 'domainAdmin', online: true, kind: 'versioned', nightly: true,
      versions: [-3 * D + 22 * H, -2 * D + 22 * H, -2 * H] },
    { id: 'cloud', medium: 'cloud', site: 'offsite', cred: 'domainAdmin', online: true, kind: 'versioned', copyOf: 'repo',
      versions: [-3 * D + 22 * H, -2 * D + 22 * H, -2 * H] },
    { id: 'tape', medium: 'tape', site: 'offsite', cred: null, online: false, kind: 'versioned',
      versions: [-10 * D + 22 * H, -3 * D + 22 * H] }
  ];

  /** The designs: which copies exist, whether shadow copies are on, and the cloud copy's object lock in days. */
  var DESIGNS = {
    'estate': { copies: ['src', 'vss', 'mirror', 'usb'], vss: false, lockDays: 0 },
    '321-online': { copies: ['src', 'vss', 'mirror', 'usb', 'repo', 'cloud'], vss: true, lockDays: 0 },
    'immutable': { copies: ['src', 'vss', 'mirror', 'usb', 'repo', 'cloud'], vss: true, lockDays: 30 },
    'offline-tape': { copies: ['src', 'vss', 'mirror', 'usb', 'repo', 'tape'], vss: true, lockDays: 0 }
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function defOf(id) { for (var i = 0; i < COPIES.length; i++) if (COPIES[i].id === id) return COPIES[i]; return null; }
  function copyOf(s, id) { for (var i = 0; i < s.copies.length; i++) if (s.copies[i].id === id) return s.copies[i]; return null; }
  function norm(p) { return { design: DESIGNS[p.design] ? p.design : 'estate', mfaOnVpn: !!p.mfaOnVpn, credOnServer: !!p.credOnServer }; }

  /**
   * Rule 1: how a copy is reached from the server. 'sameCred': the credential that writes it can be had on the
   * server (its local admin, or the backup account's saved password); 'otherCred': only a credential that is not on
   * the server; 'none': nothing online reaches it (offline).
   */
  function reachOf(def, p) {
    if (!def.online) return 'none';
    if (def.cred === 'localAdmin') return 'sameCred';
    return p.credOnServer ? 'sameCred' : 'otherCred';
  }

  /** The copies of a design at the start of the night. */
  function copiesFor(p) {
    var o = norm(p), d = DESIGNS[o.design];
    return d.copies.map(function (id) {
      var def = defOf(id), lock = id === 'cloud' ? d.lockDays : 0;
      var off = id === 'vss' && !d.vss;
      var c = {
        id: id, medium: def.medium, site: def.site, cred: def.cred, reach: reachOf(def, o), online: def.online,
        kind: def.kind, lockDays: lock, immutableUntil: null, deleted: false, off: off,
        versions: off ? [] : def.versions.map(function (t) {
          var v = { t: t, clean: true };
          if (lock) v.lockedUntil = t + lock * D;
          return v;
        })
      };
      c.immutableUntil = lockEnd(c);
      return c;
    });
  }

  /** The earliest end of an object lock among a copy's versions (null: nothing locked). */
  function lockEnd(c) {
    var m = null;
    c.versions.forEach(function (v) { if (v.lockedUntil != null && !v.gone && (m === null || v.lockedUntil < m)) m = v.lockedUntil; });
    return m;
  }

  /** The versions still there. */
  function present(c) { return c.versions.filter(function (v) { return !v.gone; }); }
  /** The newest clean version still there (null: none). */
  function newestClean(c) {
    var best = null;
    present(c).forEach(function (v) { if (v.clean && (best === null || v.t > best.t)) best = v; });
    return best;
  }
  /** clean (holds a clean version) · encrypted (holds only encrypted ones) · deleted · off (never held any). */
  function statusOf(c) {
    if (c.off) return 'off';
    if (newestClean(c)) return 'clean';
    if (c.deleted || !present(c).length) return 'deleted';
    return 'encrypted';
  }

  /** Can the attacker, holding `creds`, write to the copy? Online, and holding the credential that reaches it. */
  function canTouch(c, creds) { return c.online && c.cred !== null && creds.indexOf(c.cred) >= 0; }

  /** Encrypt in place: every version on the copy (the live data, a mirror, the backups on a disk) is encrypted. */
  function encrypt(c) {
    c.versions.forEach(function (v) { if (!v.gone) v.clean = false; });
    return 'encrypted';
  }

  /** Rule 5: delete every version, except those under an object lock that has not ended at time t. */
  function remove(c, t) {
    var kept = 0;
    c.versions.forEach(function (v) {
      if (v.gone) return;
      if (v.lockedUntil != null && v.lockedUntil > t) kept++;
      else v.gone = true;
    });
    if (kept) { c.immutableUntil = lockEnd(c); return 'locked'; }
    c.deleted = true;
    c.immutableUntil = null;
    return 'deleted';
  }

  /**
   * Rule 6: the 3-2-1 checklist. `paper` counts the cards (the source and every copy; shadow copies live on the
   * source volume and are not a copy). `real` applies rule 1: the source and every mutable copy reached with the same
   * credential are one copy; a copy reached otherwise, offline or immutable counts on its own.
   */
  function checklist(copies) {
    var cards = copies.filter(function (c) { return !defOf(c.id).onVolume; });
    function count(list) {
      var media = [];
      list.forEach(function (c) { if (media.indexOf(c.medium) < 0) media.push(c.medium); });
      return {
        copies: list.length,
        media: media.length,
        offsite: list.filter(function (c) { return c.site === 'offsite'; }).length,
        offlineOrImmutable: list.filter(function (c) { return !c.online || c.lockDays > 0; }).length
      };
    }
    var own = cards.filter(function (c) { return c.id !== 'src' && (c.reach !== 'sameCred' || c.lockDays > 0); });
    return { paper: count(cards), real: count(cards.filter(function (c) { return c.id === 'src'; }).concat(own)) };
  }

  /** Does a count meet 3-2-1 (and the extra offline or immutable copy)? */
  function ticks(n) {
    return { copies: n.copies >= 3, media: n.media >= 2, offsite: n.offsite >= 1, offlineOrImmutable: n.offlineOrImmutable >= 1 };
  }

  /**
   * Rule 7 and the tie-break: the copies that still hold a clean version (the source and the shadow copies on its
   * volume not counted, rule 6), and the one to
   * restore from: the newest clean version; equal times prefer the copy on site (faster restore), then card order.
   * The lost data runs from that version to the attack; an intact source loses nothing.
   */
  function count(s) {
    var order = s.copies.map(function (c) { return c.id; });
    var surv = s.copies.filter(function (c) { return c.id !== 'src' && !defOf(c.id).onVolume && statusOf(c) === 'clean'; });
    var ranked = surv.slice().sort(function (a, b) {
      return newestClean(b).t - newestClean(a).t ||
        (a.site === b.site ? 0 : a.site === 'onsite' ? -1 : 1) ||
        order.indexOf(a.id) - order.indexOf(b.id);
    });
    var src = copyOf(s, 'src'), intact = statusOf(src) === 'clean';
    var best = intact ? 'src' : ranked.length ? ranked[0].id : null;
    var tie = !intact && ranked.length > 1 && newestClean(ranked[0]).t === newestClean(ranked[1]).t;
    return {
      survivors: surv.map(function (c) { return c.id; }),
      best: best,
      bestT: best ? newestClean(copyOf(s, best)).t : null,
      tie: tie ? ranked[1].id : null,
      sourceIntact: intact,
      lostMinutes: intact ? 0 : best ? ATTACK - newestClean(copyOf(s, best)).t : null
    };
  }

  var logic = {
    ATTACK: ATTACK,
    JOBS: JOBS,
    DISCOVERY: DISCOVERY,
    CLOCK: CLOCK,
    CREDS: CREDS,
    COPIES: COPIES,
    DESIGNS: DESIGNS,
    norm: norm,
    reachOf: reachOf,
    copiesFor: copiesFor,
    copyOf: copyOf,
    present: present,
    newestClean: newestClean,
    statusOf: statusOf,
    canTouch: canTouch,
    remove: remove,
    checklist: checklist,
    ticks: ticks,
    count: count,

    /** Defaults are the preset `estate`: the file server as it is, no MFA on the VPN, the backup credential saved. */
    defaults: { design: 'estate', mfaOnVpn: false, credOnServer: true },

    /** 11 steps; 2 when MFA stops the logon (the refused logon, then the count). */
    steps: function (p) { return norm(p).mfaOnVpn ? STEPS_BLOCKED : STEPS; },

    /** Step 0: the copies at the start of the night; no attacker yet. */
    initial: function (p) {
      var o = norm(p), copies = copiesFor(o);
      return {
        clock: null, design: o.design,
        attacker: { creds: [], at: null, blocked: false },
        copies: copies,
        checklist: checklist(copies),
        survivors: null, best: null, rpoMinutes: null,
        done: false, last: null, log: []
      };
    },

    /** State after step n (SPEC.md "One step"). */
    step: function (prev, n, p) {
      var o = norm(p), s = clone(prev), a = s.attacker, e;
      if (s.done) return s;
      var t = o.mfaOnVpn && n === STEPS_BLOCKED ? ATTACK : CLOCK[n];
      s.clock = t;
      var last = o.mfaOnVpn && n === STEPS_BLOCKED ? STEPS : n;
      function hit(id, need) {
        var c = copyOf(s, id);
        if (!c) return { id: id, effect: 'absent' };
        if (c.off) return { id: id, effect: 'off' };
        if (!c.online) return { id: id, effect: 'offline' };
        if (!canTouch(c, a.creds)) return { id: id, effect: 'unreachable', need: c.cred };
        return { id: id, effect: need(c) };
      }
      switch (last) {
        case 1:
          if (o.mfaOnVpn) { a.blocked = true; e = { kind: 'blocked' }; break; }
          a.creds.push('user'); a.at = 'src';
          e = { kind: 'logon', cred: 'user' };
          break;
        case 2:
          a.creds.push('localAdmin');
          e = { kind: 'localAdmin', cred: 'localAdmin' };
          break;
        case 3:
          if (o.credOnServer) a.creds.push('domainAdmin');
          e = { kind: 'findCred', found: o.credOnServer };
          break;
        case 4: case 5: case 6: case 7: {
          var id = ['src', 'mirror', 'usb', 'vss'][last - 4];
          var r = hit(id, function (c) { return c.kind === 'snapshot' ? remove(c, t) : encrypt(c); });
          if (['encrypted', 'deleted', 'locked'].indexOf(r.effect) >= 0) a.at = id;
          e = { kind: ['encryptSource', 'encryptMirror', 'encryptUsb', 'deleteShadows'][last - 4], hits: [r] };
          break;
        }
        case 8: {
          var hits = ['repo', 'cloud', 'tape'].filter(function (id) { return copyOf(s, id); })
            .map(function (id) { return hit(id, function (c) { return remove(c, t); }); });
          var first = hits.filter(function (r) { return r.effect === 'deleted' || r.effect === 'locked'; })[0];
          a.at = first ? first.id : 'src';        // nothing reached: back on the server
          e = { kind: 'backups', hits: hits };
          break;
        }
        case 9: {
          // rule 2: the mirror replaces its copy with the source as it is now; a versioned backup adds a version
          var srcClean = statusOf(copyOf(s, 'src')) === 'clean', jobs = [];
          s.copies.forEach(function (c) {
            if (c.kind === 'mirror' || defOf(c.id).nightly || defOf(c.id).copyOf) {
              var from = defOf(c.id).copyOf ? copyOf(s, defOf(c.id).copyOf) : null;
              if (c.deleted || (from && from.deleted)) { jobs.push({ id: c.id, effect: 'failed' }); return; }
              var v = { t: t, clean: srcClean };
              if (c.lockDays) v.lockedUntil = t + c.lockDays * D;
              if (c.kind === 'mirror') { c.versions = [v]; jobs.push({ id: c.id, effect: 'replaced', clean: srcClean }); }
              else { c.versions.push(v); jobs.push({ id: c.id, effect: 'added', clean: srcClean }); }
              c.immutableUntil = lockEnd(c);
            }
          });
          e = { kind: 'jobs', hits: jobs };
          break;
        }
        case 10:
          e = { kind: 'discovery' };
          break;
        default: {
          var k = count(s);
          s.survivors = k.survivors; s.best = k.best; s.rpoMinutes = k.lostMinutes; s.done = true;
          e = { kind: 'count', survivors: k.survivors, best: k.best, bestT: k.bestT, tie: k.tie,
            sourceIntact: k.sourceIntact, lostMinutes: k.lostMinutes };
        }
      }
      e.n = n;
      e.t = t;
      s.last = e;
      s.log.push(e);
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
