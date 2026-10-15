/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-gpo-processing: an administrator edits one setting of the GPO "Workstation Settings" at t = 0, and
   the host picks it up only in its next processing pass: a background refresh (90 min + a random 0–30 min offset; a
   DC every 5 min), gpupdate, a logon (user part) or a restart (computer part). Folder Redirection and Software
   Installation apply only in a synchronous foreground pass; with fast logon optimisation a foreground pass is
   asynchronous unless the previous pass asked for a synchronous one. One step = the next event on the time axis.
   Rules, tie-breaks and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Randomness is Simdeck.rng(seed). The page
   loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var rng = (root.Simdeck || (typeof require === 'function' ? require('../../kit/kit.js') : {})).rng;

  /** Rule 2: minutes between refreshes, and the largest random offset. */
  var INTERVAL = 90;
  var MAX_OFFSET = 30;
  var DC_INTERVAL = 5;
  /** Rule 6: Security is reapplied after this many minutes even if unchanged (never reached here). */
  var SECURITY_REAPPLY = 16 * 60;
  var V_OLD = 4;
  var V_NEW = 5;

  /** The client-side extensions in table order (T6): the setting each one holds in the GPO, its part, rule 3. */
  var CSES = [
    { id: 'registry', setting: 'screensaver', part: 'user', sync: false },
    { id: 'security', setting: 'lock', part: 'computer', sync: false },
    { id: 'folders', setting: 'folders', part: 'user', sync: true },
    { id: 'software', setting: 'msi', part: 'computer', sync: true }
  ];
  var SETTINGS = ['screensaver', 'lock', 'folders', 'msi'];
  var CHANGES = ['screensaver', 'folders', 'msi'];
  var ACTIONS = ['wait', 'gpupdate', 'force', 'relog'];

  function cseOf(setting) { for (var i = 0; i < CSES.length; i++) if (CSES[i].setting === setting) return CSES[i]; return null; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ── the rules, as pure functions ──

  /** Rule 2: the k-th random offset (0…30) for this seed. */
  function offsetAt(seed, k) {
    var r = rng(seed), v = 0;
    for (var i = 0; i <= k; i++) v = r.int(MAX_OFFSET + 1);
    return v;
  }

  /** Rules 2, 7: the next refresh after a refresh, startup or logon at t0. Uses (and counts) one draw on a client. */
  function schedule(s, t0) {
    if (s.dc) return { t: t0 + DC_INTERVAL, base: t0 + DC_INTERVAL, off: 0 };
    var off = offsetAt(s.seed, s.draws++);
    return { t: t0 + INTERVAL + off, base: t0 + INTERVAL, off: off };
  }

  /** Rule 4: is a foreground pass of this part synchronous? */
  function syncForeground(s, part) { return s.dc || !s.fastLogon || !!s.pending.syncNext[part]; }

  /**
   * Rule 3: one pass over the CSEs (T6 order). kind 'bg' | 'gpupdate' | 'force' | 'fg'; parts: the parts processed;
   * mode: { part: 'sync' | 'async' } for 'fg'. Mutates s.applied and s.pending; returns { results, quiet }.
   * results[cse] is 'notRun' | 'unchanged' | 'signal' | 'applied' | 'reapplied'.
   */
  function pass(s, kind, parts, mode) {
    var before = clone(s.pending.syncNext);
    var results = {};
    CSES.forEach(function (c) {
      if (parts.indexOf(c.part) < 0) { results[c.id] = 'notRun'; return; }
      var isNew = s.applied[c.setting] < s.gpo[c.setting];
      if (!isNew && kind !== 'force') { results[c.id] = 'unchanged'; return; }
      var syncPass = kind === 'fg' && mode[c.part] === 'sync';
      if (c.sync && !syncPass) {
        s.pending.syncNext[c.part] = true;
        results[c.id] = 'signal';
        return;
      }
      s.applied[c.setting] = s.gpo[c.setting];
      results[c.id] = isNew ? 'applied' : 'reapplied';
    });
    // rule 4: a synchronous foreground pass clears its part's flag
    if (kind === 'fg') parts.forEach(function (part) { if (mode[part] === 'sync') s.pending.syncNext[part] = false; });
    var any = CSES.some(function (c) { return results[c.id] === 'applied' || results[c.id] === 'reapplied'; });
    var newFlag = ['computer', 'user'].some(function (part) { return s.pending.syncNext[part] && !before[part]; });
    return { results: results, quiet: !any && !newFlag };
  }

  /** Rule 1: the foreground event for the edited setting's part: a logon (user) or a restart (computer). */
  function fgKind(s) { return cseOf(s.change).part === 'computer' ? 'restart' : 'logon'; }

  /** T1, T2: the next event: the first planned action, unless the refresh comes strictly earlier. */
  function nextEvent(s) {
    if (s.plan.length && s.plan[0].t <= s.nextRefresh.t) return { t: s.plan[0].t, kind: s.plan[0].kind, planned: true };
    return { t: s.nextRefresh.t, kind: 'refresh', planned: false };
  }

  function done(s) { return s.applied[s.change] >= s.gpo[s.change]; }

  /** Process the next event (one of nextEvent), log it, and plan the follow-up. */
  function processNext(s, n) {
    var ev = nextEvent(s);
    var e = { n: n, t: ev.t, kind: ev.kind };
    if (ev.planned) s.plan.shift();
    s.t = ev.t;
    var r;
    if (ev.kind === 'refresh') {
      e.base = s.nextRefresh.base;
      e.off = s.nextRefresh.off;
      r = pass(s, 'bg', ['computer', 'user']);
      s.nextRefresh = schedule(s, ev.t);
    } else if (ev.kind === 'gpupdate' || ev.kind === 'force') {
      r = pass(s, ev.kind, ['computer', 'user']);
      // rule 5: a change that could not apply → the user accepts the prompt (logoff or restart) 5 min later
      if (!done(s)) s.plan.push({ t: ev.t + 5, kind: fgKind(s) });
    } else {
      var parts = ev.kind === 'restart' ? ['computer', 'user'] : ['user'];
      var mode = {};
      parts.forEach(function (part) { mode[part] = syncForeground(s, part) ? 'sync' : 'async'; });
      e.mode = mode;
      r = pass(s, 'fg', parts, mode);
      s.relogs++;
      s.nextRefresh = schedule(s, ev.t);   // rule 7, T1
      if (s.action === 'relog' && !done(s) && s.relogs < 2) s.plan.push({ t: ev.t + 30, kind: fgKind(s) });
    }
    e.results = r.results;
    e.quiet = ev.kind === 'refresh' && r.quiet;
    e.flags = clone(s.pending.syncNext);
    e.next = clone(s.nextRefresh);
    s.events.push(e);
    return e;
  }

  var logic = {
    /** Parameter defaults. */
    defaults: { dc: false, change: 'screensaver', action: 'wait', fastLogon: true, seed: 3 },

    INTERVAL: INTERVAL,
    MAX_OFFSET: MAX_OFFSET,
    DC_INTERVAL: DC_INTERVAL,
    SECURITY_REAPPLY: SECURITY_REAPPLY,
    V_OLD: V_OLD,
    V_NEW: V_NEW,
    CSES: CSES,
    SETTINGS: SETTINGS,
    CHANGES: CHANGES,
    ACTIONS: ACTIONS,

    /** Steps for these params: the edit, then one event per step until the run ends (T5). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 30) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** The state at the end of the run (the page uses it for the axis range). */
    run: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.phase !== 'done' && n < 30) { n++; s = logic.step(s, n, p); }
      return s;
    },

    /** State at step 0: everything at version 4 applied; PC07 started at −10, DC01 refreshed last at −2. */
    initial: function (p) {
      var dc = p.dc === true;
      var seed = Math.max(1, Math.min(9, Math.round(Number(p.seed) || 1)));
      var s = {
        host: dc ? 'dc01' : 'pc07',
        dc: dc,
        t: dc ? -2 : -10,
        seed: seed,
        draws: 0,
        fastLogon: !dc && p.fastLogon !== false,
        change: CHANGES.indexOf(p.change) >= 0 ? p.change : 'screensaver',
        action: ACTIONS.indexOf(p.action) >= 0 ? p.action : 'wait',
        gpo: {},
        applied: {},
        pending: { syncNext: { computer: false, user: false } },
        nextRefresh: null,
        plan: [],
        relogs: 0,
        events: [],
        phase: 'edit',
        result: null
      };
      SETTINGS.forEach(function (k) { s.gpo[k] = V_OLD; s.applied[k] = V_OLD; });
      if (dc) {
        s.events.push({ n: 0, t: -7, kind: 'refresh', base: -7, off: 0, quiet: true, history: true });
        s.events.push({ n: 0, t: -2, kind: 'refresh', base: -2, off: 0, quiet: true, history: true });
        s.nextRefresh = schedule(s, -2);
      } else {
        s.events.push({ n: 0, t: -10, kind: 'restart', history: true });
        s.nextRefresh = schedule(s, -10);
      }
      return s;
    },

    /** State after step n: the edit (step 1), then the next event that is not a quiet refresh before an action. */
    step: function (s0, n, p) {
      var s = clone(s0);
      if (s.phase === 'done') return s;
      if (s.phase === 'edit') {
        s.gpo[s.change] = V_NEW;
        s.t = 0;
        s.events.push({ n: n, t: 0, kind: 'edit', setting: s.change });
        if (s.action === 'gpupdate' || s.action === 'force') s.plan.push({ t: 5, kind: s.action });
        else if (s.action === 'relog') s.plan.push({ t: 30, kind: fgKind(s) });
        s.phase = 'run';
        return s;
      }
      var e, guard = 0;
      do {
        e = processNext(s, n);
        // T4: a quiet refresh before a planned action is drawn but is not a step
        if (e.quiet && s.plan.length && !done(s)) e.collapsed = true;
        else break;
      } while (++guard < 100);
      if (done(s)) { s.phase = 'done'; s.result = 'applied'; }
      else if (e.quiet && !s.plan.length) { s.phase = 'done'; s.result = 'waiting'; }   // T5
      return s;
    },

    // exported for the page and the tests
    offsetAt: offsetAt,
    schedule: schedule,
    syncForeground: syncForeground,
    pass: pass,
    nextEvent: nextEvent,
    processNext: processNext,
    cseOf: cseOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
