/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-stop-for-safety: a hazard on set, someone who notices it, what they do, and the minutes it takes until the work
   stops, against the minute the hazard becomes an accident. One step is one minute (illustrative). The model runs all
   four actions with the briefing's "anyone may stop" rule on and off (eight runs) from the same start; the page draws
   the chosen one and lists all eight. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON.
   The crew and its lines come from crew.js (the shared crew model, catalogue §5.25). Rules: SPEC.md. */
(function (root) {
  'use strict';

  var crew = typeof module === 'object' && module.exports
    ? require('./crew.js')
    : root.SimdeckModels['set-crew'];

  /** Rule 4: the hazards. `dept` owns it; `fuse` is the minute it becomes an accident if the work has not stopped and it
      has not been fixed before then (null: a false alarm, it never does); `fix` is how many minutes the owning crew needs
      once they are at it (for the false alarm: to check it). Illustrative minutes. */
  var HAZARDS = [
    { id: 'stand', dept: 'grip', fuse: 7, fix: 2, real: true },
    { id: 'exit', dept: 'electric', fuse: 12, fix: 3, real: true },
    { id: 'smoke', dept: 'electric', fuse: 4, fix: 2, real: true },
    { id: 'smell', dept: 'electric', fuse: null, fix: 1, real: false }
  ];

  /** Rule 5: who notices it. `own` is the owning department's crew member (not its head). */
  var NOTICERS = ['trainee', 'dayplayer', 'own'];

  /** Rule 6: what they do. */
  var ACTIONS = ['silent', 'colleague', 'break', 'stop'];

  /** Rule 6: the person working beside each noticer (who hears "tell a colleague"). */
  var BESIDE = { trainee: 'el', actor: 'boom', gr: 'el', el: 'gr' };

  /** Rule 7: minutes. A call (out loud or on the radio, at once) is heard the next minute; the 1st AD's check of a
      report from outside the owning department, with the rule off, takes CHECK minutes. */
  var CALL = 1;
  var CHECK = 4;

  var RULES = ['on', 'off'];

  function hazard(id) {
    for (var i = 0; i < HAZARDS.length; i++) if (HAZARDS[i].id === id) return HAZARDS[i];
    throw new Error('unknown hazard: ' + id);
  }

  /** The department's crew member who is not its head (grip: the grip; electric: the electrician). */
  function crewOf(dept) {
    for (var i = 0; i < crew.PEOPLE.length; i++) {
      var q = crew.PEOPLE[i];
      if (q.dept === dept && !q.head) return q.id;
    }
    return null;
  }

  /** Rule 5: the person who notices the hazard. */
  function noticer(n, h) {
    if (n === 'trainee') return 'trainee';
    if (n === 'dayplayer') return 'actor';
    if (n === 'own') return crewOf(h.dept);
    throw new Error('unknown noticer: ' + n);
  }

  /** Rules 6-10: every event one run would have if the hazard waited, in time order: hops, the halt, the fix, the
      restart, a lost message, the 1st AD's check and a telling-off. Pure function of the params, the action and the rule.
      `plan` cuts it at the accident (rule 11). */
  function intended(p, action, rule) {
    var h = hazard(p.hazard);
    var anyone = rule === 'on';
    var N = noticer(p.noticer, h);
    var O = crew.headOf(h.dept);
    var W = crewOf(h.dept);
    var B = p.breakAt;
    var ev = [];
    var seq = 0;
    function push(e) { e.seq = seq++; ev.push(e); }
    function owns(id) { return crew.person(id).dept === h.dept; }

    // rule 10: after the halt the owning head sends their crew (they heard the halt and what it is for), the crew fixes
    // it (or checks it, for a false alarm), and the 1st AD restarts the work
    function halt(t) {
      push({ t: t, kind: 'halt', at: 'ad1' });
      afterHalt(t);
    }
    function afterHalt(t) {
      push({ t: t + 1, kind: 'hop', from: O, to: W, how: 'send' });
      push({ t: t + 1 + h.fix, kind: h.real ? 'fixed' : 'clear', at: W });
      push({ t: t + 2 + h.fix, kind: 'restart', at: 'ad1' });
    }
    // rule 9b: with the rule off, the owning head sends their crew to fix it, without a halt
    function fixNoHalt(t) {
      push({ t: t + 1, kind: 'hop', from: O, to: W, how: 'send' });
      push({ t: t + 1 + h.fix, kind: h.real ? 'fixed' : 'clear', at: W });
    }

    // rules 8 and 9: what the person who hears it does
    function arrive(to, t, from, how) {
      push({ t: t, kind: 'hop', from: from, to: to, how: how });
      if (to === 'ad1') {
        if (anyone || owns(from)) { halt(t); return; }
        // rule 9a: the rule is off and the report comes from outside the owning department: the 1st AD checks it with
        // the owning head before anyone stops
        push({ t: t, kind: 'check', at: 'ad1', head: O, until: t + CHECK });
        if (h.real) halt(t + CHECK);
        else push({ t: t + CHECK, kind: 'blame', who: from });
        return;
      }
      if (anyone) { arrive('ad1', t + CALL, to, 'call'); return; }   // rule 8: whoever hears of it calls stop at once
      if (to === O) { fixNoHalt(t); return; }                          // rule 9b
      if (owns(to)) { arrive(O, Math.max(B, t + 1), to, 'break'); return; } // rule 9c: their own head, at the break
      push({ t: t, kind: 'lost', at: to });                            // rule 9d: "not my department"
    }

    // rule 6: what the one who noticed it does, from minute 0
    if (action === 'stop') arrive('ad1', CALL, N, 'call');
    else if (action === 'colleague') arrive(BESIDE[N], CALL, N, 'say');
    else if (action === 'break') arrive(crew.person(N).via, B, N, 'break');
    else if (action !== 'silent') throw new Error('unknown action: ' + action);

    ev.sort(function (a, b) { return a.t - b.t || a.seq - b.seq; });
    ev.forEach(function (e) { delete e.seq; });
    return ev;
  }

  /** Rule 11 applied to `intended`: the events that happen. */
  function plan(p, action, rule) {
    var h = hazard(p.hazard);
    var ev = intended(p, action, rule).map(function (e, i) { var c = JSON.parse(JSON.stringify(e)); c.seq = i; return c; });

    // rule 11: safe from the first halt or the fix; otherwise, or if that comes in the fuse minute or later, the accident
    // happens at the fuse (a tie goes to the accident: the hazard does not wait)
    var safe = null;
    ev.forEach(function (e) {
      if ((e.kind === 'halt' || e.kind === 'fixed') && safe === null) safe = e.t;
    });
    if (h.fuse !== null && (safe === null || safe >= h.fuse)) {
      var kept = ev.filter(function (e) {
        if (e.t < h.fuse) return true;
        return e.t === h.fuse && (e.kind === 'hop' || e.kind === 'lost');
      });
      kept.push({ t: h.fuse, kind: 'accident', seq: -1 });
      kept.sort(function (a, b) { return a.t - b.t || a.seq - b.seq; });
      ev = kept;
    }
    ev.forEach(function (e) { delete e.seq; });
    return ev;
  }

  /** What a run's log keeps: the first minute of each outcome (null until it happens). */
  var LOG_KEYS = ['halt', 'fixed', 'clear', 'restart', 'accident', 'lost', 'blame', 'check'];

  function emptyRun() {
    var log = {};
    LOG_KEYS.forEach(function (k) { log[k] = null; });
    return { log: log, hops: [], now: [], lostAt: null, blamed: null, checkUntil: null };
  }

  function key(action, rule) { return action + '-' + rule; }

  function advance(run, events, n) {
    var out = JSON.parse(JSON.stringify(run));
    out.now = [];
    events.forEach(function (e) {
      if (e.t !== n) return;
      out.now.push(e);
      if (e.kind === 'hop') out.hops.push(e);
      else if (out.log[e.kind] === null) out.log[e.kind] = n;
      if (e.kind === 'lost') out.lostAt = e.at;
      if (e.kind === 'blame') out.blamed = e.who;
      if (e.kind === 'check') out.checkUntil = e.until;
    });
    return out;
  }

  /** Rule 12: the one-line outcome of a run at minute n, for the scoreboard and the caption. Kinds, in this order:
      accident, restart, halt (stopped, being fixed), fixed (fixed without a halt), blame, clear, lost, check, waiting
      (a message not yet arrived), quiet (nobody knows, or nothing happens). */
  function outcome(run, p, action, rule, n) {
    var L = run.log;
    if (L.accident !== null) return { kind: 'accident', t: L.accident };
    if (L.restart !== null) return { kind: 'restart', t: L.restart, halt: L.halt, stopped: L.restart - L.halt };
    if (L.halt !== null) return { kind: 'halt', t: L.halt };
    if (L.fixed !== null) return { kind: 'fixed', t: L.fixed };
    if (L.blame !== null) return { kind: 'blame', t: L.blame };
    if (L.clear !== null) return { kind: 'clear', t: L.clear };
    if (L.lost !== null) return { kind: 'lost', t: L.lost };
    if (L.check !== null) return { kind: 'check', t: L.check, until: run.checkUntil };
    // a message still to come, even one the accident will overtake (it is on its way, or waiting for the break)
    var events = intended(p, action, rule);
    var next = null;
    for (var i = 0; i < events.length; i++) if (events[i].t > n && events[i].kind === 'hop') { next = events[i]; break; }
    if (next) return { kind: 'waiting', t: next.t, how: next.how };
    return { kind: 'quiet', t: null };
  }

  var logic = {
    defaults: { hazard: 'stand', noticer: 'trainee', action: 'stop', anyone: true, breakAt: 10 },

    /** One step is one minute; the latest event of any case is a restart at minute 16 (SPEC.md, steps). */
    steps: 16,
    BREAK_MIN: 5,
    BREAK_MAX: 12,

    HAZARDS: HAZARDS,
    NOTICERS: NOTICERS,
    ACTIONS: ACTIONS,
    RULES: RULES,
    BESIDE: BESIDE,
    CALL: CALL,
    CHECK: CHECK,
    crew: crew,
    hazard: hazard,
    crewOf: crewOf,
    noticer: noticer,
    plan: plan,
    intended: intended,
    key: key,
    outcome: outcome,

    initial: function (p) {
      var runs = {};
      ACTIONS.forEach(function (a) { RULES.forEach(function (r) { runs[key(a, r)] = emptyRun(); }); });
      return { minute: 0, runs: runs };
    },

    step: function (s, n, p) {
      var runs = {};
      ACTIONS.forEach(function (a) {
        RULES.forEach(function (r) {
          var k = key(a, r);
          runs[k] = advance(s.runs[k], plan(p, a, r), n);
        });
      });
      return { minute: n, runs: runs };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
