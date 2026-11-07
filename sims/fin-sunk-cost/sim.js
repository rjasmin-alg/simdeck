/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-sunk-cost: one overrunning in-house build, decided at four gates two ways. "By already spent" charges
   the cash already spent to every way out of the project and the old system's book value to every option that
   retires it; "by still to spend" counts only the benefit, the cash and the people's time still to come. Two lanes
   follow the two rules month by month; at the end each runs on to its own end. Stepper, 16 steps (SPEC.md rule 11).
   The old system's book value and write-off come from asset.js (copied from fin-depreciation, promotable to models/).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var A = typeof module === 'object' && module.exports
    ? require('./asset.js')
    : root.SimdeckModels.asset;

  var GATES = [0, 3, 6, 9];
  var END = 12;
  var BUILD = { cash: 20000, team: 4, benefit: 400000 };             // a month of building; the benefit once live
  var PRODUCT = { cash: 120000, months: 3, team: 2, benefit: 320000 }; // the ready-made product
  var OLD = { life: 60, age: 36 };                                   // months: 5-year life, bought 3 years ago
  var EST = {                                                        // estimated total build months at G0…G3 (rule 2)
    none: [4, 4, 4, 4],
    moderate: [4, 7, 14, 14],
    severe: [4, 9, 17, 22]
  };
  var OPTIONS = ['continue', 'switch', 'stop'];
  var RULES = ['sunk', 'fwd'];
  var RANGE = { value: { min: 0, max: 10000, step: 1000 }, old: { min: 0, max: 240000, step: 12000 } };
  var LIMIT = 60;                                                    // months a lane may run on to its own end

  var defaults = { overrun: 'moderate', value: 5000, old: 24000, product: true };

  /** Presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'overrun', params: { overrun: 'moderate', value: 5000, old: 24000, product: true }, step: 0 },
    { id: 'on-track', params: { overrun: 'none', value: 5000, old: 24000, product: true }, step: 0 },
    { id: 'team-free', params: { overrun: 'moderate', value: 0, old: 24000, product: true }, step: 8 },
    { id: 'old-books', params: { overrun: 'none', value: 10000, old: 180000, product: true }, step: 0 },
    { id: 'no-way-out', params: { overrun: 'severe', value: 5000, old: 24000, product: false }, step: 8 }
  ];

  /** The 16 steps (rule 11): the month on the stage, the gate and whether it is open or decided. */
  var SCHEDULE = (function () {
    var out = [{ month: 0, gate: 0, phase: 'open' }, { month: 0, gate: 0, phase: 'decided' }];
    for (var m = 1; m <= END; m++) {
      var g = GATES.indexOf(m);
      if (g >= 0) {
        out.push({ month: m, gate: g, phase: 'open' });
        out.push({ month: m, gate: g, phase: 'decided' });
      } else out.push({ month: m, gate: null, phase: null });
    }
    return out;
  })();
  var STEPS = SCHEDULE.length - 1;

  function bool(v, dflt) {
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
    if (v === false || v === 'false' || v === 0 || v === '0') return false;
    return dflt;
  }
  function num(v, key) {
    var r = RANGE[key];
    var x = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    if (typeof x !== 'number' || !Number.isFinite(x)) return defaults[key];
    var k = x / r.step;
    var snapped = (k < 0 ? -Math.round(-k) : Math.round(k)) * r.step;
    return Math.min(r.max, Math.max(r.min, snapped));
  }

  /** Params made safe (rule 1). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    return {
      overrun: Object.prototype.hasOwnProperty.call(EST, q.overrun) ? q.overrun : defaults.overrun,
      value: num(q.value, 'value'),
      old: num(q.old, 'old'),
      product: bool(q.product, defaults.product)
    };
  }

  /** The old system: cost 2.5 × its book value now, straight-line over 60 months, 36 already gone. */
  function oldSystem(p) {
    var cost = p.old * OLD.life / (OLD.life - OLD.age);
    return { cost: cost, sched: A.schedule(cost, OLD.life, 0, 'sl') };
  }
  function oldBook(p, m) {
    var o = oldSystem(p);
    return A.bookAt(o.sched, o.cost, OLD.age + m);
  }
  /** Retired in month m: written off at its book value (a loss on paper, no cash). */
  function writeOff(p, m) {
    var o = oldSystem(p);
    var w = -A.disposal(o.sched, o.cost, OLD.age + m, 0).gain;
    return w === 0 ? 0 : w;                                           // never -0
  }

  /** The option chosen by `key` ('fwd' or 'sunk'); tie-break: current course, then less cash, then OPTIONS order
      (rule 6). */
  function choose(rows, key, current) {
    var sorted = rows.slice().sort(function (a, b) {
      if (b[key] !== a[key]) return b[key] - a[key];
      var ac = a.id === current ? 0 : 1, bc = b.id === current ? 0 : 1;
      if (ac !== bc) return ac - bc;
      if (a.cash !== b.cash) return a.cash - b.cash;
      return OPTIONS.indexOf(a.id) - OPTIONS.indexOf(b.id);
    });
    return sorted[0].id;
  }

  /** The gate table at gate g for a building project that has spent `spent` (rules 3-7). */
  function gateTable(g, spent, p) {
    var month = GATES[g], est = EST[p.overrun][g];
    var rem = est - month;
    var W = oldBook(p, month);
    var rows = [{ id: 'continue', benefit: BUILD.benefit, cash: BUILD.cash * rem, team: BUILD.team * rem }];
    if (p.product) rows.push({ id: 'switch', benefit: PRODUCT.benefit, cash: PRODUCT.cash, team: PRODUCT.team * PRODUCT.months });
    rows.push({ id: 'stop', benefit: 0, cash: 0, team: 0 });
    rows.forEach(function (r) {
      r.people = r.team * p.value;
      r.fwd = r.benefit - r.cash - r.people;                              // rule 4
      r.lostSpent = r.id === 'continue' ? 0 : spent;                      // rule 5
      r.lostBook = r.id === 'stop' ? 0 : W;
      r.sunk = A.tidy(r.fwd - r.lostSpent - r.lostBook);
      r.whole = r.fwd - spent;                                            // rule 7
    });
    var current = g === 0 ? 'stop' : 'continue';
    return {
      gate: g, month: month, est: est, prevEst: g > 0 ? EST[p.overrun][g - 1] : est, rem: rem,
      spent: spent, book: W, current: current, rows: rows,
      fwd: choose(rows, 'fwd', current), sunk: choose(rows, 'sunk', current)
    };
  }

  function newLane() {
    return { phase: 'plan', cash: 0, team: 0, benefit: 0, built: 0, setup: 0, live: null, liveKind: null,
      writeOff: null, months: [null], choices: [null, null, null, null], tables: [null, null, null, null], event: null };
  }

  /** One month for a lane (rule 8). */
  function month(L, m, p) {
    var trueLen = EST[p.overrun][GATES.length - 1];
    L.event = null;
    if (L.phase === 'build') {
      L.cash += BUILD.cash; L.team += BUILD.team; L.built += 1;
      L.months[m] = 'build';
      L.event = 'build';
      if (L.built >= trueLen) {
        L.phase = 'live'; L.live = m; L.liveKind = 'build'; L.benefit += BUILD.benefit; L.writeOff = writeOff(p, m);
        L.event = 'golive';
      }
    } else if (L.phase === 'switch') {
      L.cash += PRODUCT.cash / PRODUCT.months; L.team += PRODUCT.team; L.setup += 1;
      L.months[m] = 'switch';
      L.event = 'setup';
      if (L.setup >= PRODUCT.months) {
        L.phase = 'live'; L.live = m; L.liveKind = 'switch'; L.benefit += PRODUCT.benefit; L.writeOff = writeOff(p, m);
        L.event = 'golive';
      }
    } else {
      L.months[m] = L.phase === 'live' ? 'live' : 'kept';
      L.event = 'idle';
    }
  }

  /** A gate for a lane: decide by its rule if it is building (or at G0 before starting). */
  function gate(L, g, p, rule) {
    if (L.phase !== 'plan' && L.phase !== 'build') { L.choices[g] = 'none'; return; }
    var tb = gateTable(g, L.cash, p);
    L.tables[g] = tb;
    var c = tb[rule];
    L.choices[g] = c;
    L.phase = c === 'continue' ? 'build' : c === 'switch' ? 'switch' : 'kept';
  }

  /** A lane up to step s of the schedule. */
  function laneAt(rule, s, p) {
    var L = newLane();
    if (s.month > 0 || s.phase === 'decided') gate(L, 0, p, rule);
    for (var m = 1; m <= s.month; m++) {
      month(L, m, p);
      var g = GATES.indexOf(m);
      if (g >= 0 && (m < s.month || s.phase === 'decided')) gate(L, g, p, rule);
    }
    return L;
  }

  /** Rule 10: the lane run on with no more gates until it goes live (or stays stopped); its outcome. */
  function finish(L, p) {
    var F = JSON.parse(JSON.stringify(L));
    var m = F.months.length - 1;
    while ((F.phase === 'build' || F.phase === 'switch') && m < LIMIT) { m += 1; month(F, m, p); }
    var people = F.team * p.value;
    return {
      cash: F.cash, team: F.team, people: people, benefit: F.benefit, net: F.benefit - F.cash - people,
      live: F.live, liveKind: F.liveKind, writeOff: F.writeOff,
      kept: F.live === null ? oldBook(p, END) : null, choices: F.choices
    };
  }

  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  /** The state at step n (0…16). */
  function compute(n, params) {
    var p = normalise(params);
    var k = Math.max(0, Math.min(STEPS, Math.round(Number(n)) || 0));
    var s = SCHEDULE[k];
    var lanes = {};
    RULES.forEach(function (r) {
      var L = laneAt(r, s, p);
      L.people = L.team * p.value;
      lanes[r] = L;
    });
    // the gate on show: the latest gate reached; its table from a lane that faced it (rule 9)
    var g = s.gate;
    if (g === null) { g = 0; for (var i = 0; i < GATES.length; i++) if (GATES[i] <= s.month) g = i; }
    var shownPhase = s.gate === null ? 'decided' : s.phase;
    var table = null;
    var facing = [];
    if (shownPhase === 'open') {
      RULES.forEach(function (r) {
        var L = lanes[r];
        if (L.phase === 'plan' || L.phase === 'build') facing.push(r);
      });
      if (facing.length) table = gateTable(g, lanes[facing[0]].cash, p);
    } else {
      RULES.forEach(function (r) { if (lanes[r].tables[g]) facing.push(r); });
      if (facing.length) table = lanes[facing[0]].tables[g];
    }
    var last = k === STEPS;
    var final = null;
    if (last) {
      final = { sunk: finish(lanes.sunk, p), fwd: finish(lanes.fwd, p) };
      var parted = null;
      for (var j = 0; j < GATES.length; j++) {
        if (final.sunk.choices[j] !== final.fwd.choices[j]) { parted = j; break; }
      }
      final.parted = parted;
      final.diff = final.fwd.net - final.sunk.net;
    }
    return {
      n: k,
      month: s.month,
      gate: g,
      atGate: s.gate !== null,
      phase: shownPhase,
      params: p,
      est: EST[p.overrun].slice(),
      book: oldBook(p, s.month),
      lanes: lanes,
      same: same(lanes.sunk.months, lanes.fwd.months) && same(lanes.sunk.choices, lanes.fwd.choices),
      facing: facing,
      table: table,
      last: last,
      final: final
    };
  }

  /** Caption keys (SPEC.md "Captions"): a lead and an optional second sentence. */
  function captionKey(s) {
    if (s.last) {
      var f = s.final;
      if (f.sunk.net === f.fwd.net && f.parted === null) return { lead: 'cEndSame', gap: null };
      return { lead: 'cEnd', gap: f.diff > 0 ? 'gEndFwd' : f.diff < 0 ? 'gEndSunk' : 'gEndEven' };
    }
    if (s.atGate) {
      var tb = s.table;
      if (!tb) {
        var gone = null;
        if (s.phase === 'open') RULES.forEach(function (r) { if (s.lanes[r].event === 'golive') gone = r; });
        return { lead: 'cNoGate', gap: null, live: gone };
      }
      var only = s.facing.length === 1 ? (s.facing[0] === 'sunk' ? 'gOnlySunk' : 'gOnlyFwd') : null;
      var live = null;
      if (s.phase === 'open') RULES.forEach(function (r) { if (s.lanes[r].event === 'golive') live = r; });
      if (s.phase === 'open') {
        var lead = s.gate === 0 ? (s.params.product ? 'cOpen0' : 'cOpen0NoProduct')
          : tb.est > tb.prevEst ? 'cOpenGrew' : 'cOpenHeld';
        return { lead: lead, gap: only, live: live };
      }
      if (tb.fwd === tb.sunk) return { lead: 'cAgree', gap: only };
      var reason = tb.sunk === 'continue' && tb.spent > 0 ? 'rSpent'
        : tb.sunk === 'stop' && tb.book > 0 ? 'rBook' : null;
      return { lead: 'cDiffer', gap: reason, only: only };
    }
    return { lead: s.same ? 'cMonthSame' : 'cMonthDiffer', gap: null };
  }

  var logic = {
    GATES: GATES, END: END, BUILD: BUILD, PRODUCT: PRODUCT, OLD: OLD, EST: EST, OPTIONS: OPTIONS, RULES: RULES,
    RANGE: RANGE, SCHEDULE: SCHEDULE,
    defaults: defaults,
    presets: presets,
    steps: STEPS,
    initial: function (p) { return compute(0, p); },
    step: function (s, n, p) { return compute(n, p); },
    compute: compute,
    normalise: normalise,
    oldBook: oldBook,
    writeOff: writeOff,
    choose: choose,
    gateTable: gateTable,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
