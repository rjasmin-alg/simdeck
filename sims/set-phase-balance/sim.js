/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-phase-balance: a generator's distribution on a night exterior, three phases L1, L2, L3, each behind its own 32 A
   breaker, with four sockets each; the camera and video village is always on L3. The student plugs lamps (and the
   make-up room's kettle) into the sockets; every plug adds its current (P / V) to its phase, a phase above its rating
   trips and everything on it goes dark while the other two carry on, and the neutral carries what the three phase
   currents do not cancel: next to nothing when the phases are balanced, a large current when they are not. The
   gaffer's plan names a device for each socket; anything else is marked as not in the plan. An explorer: the state
   follows from the params at once. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON.
   The load and the phases come from load.js (the shared electrical-load model, catalogue §5.25). Rules: SPEC.md. */
(function (root) {
  'use strict';

  var load = typeof module === 'object' && module.exports
    ? require('./load.js')
    : root.SimdeckModels['set-load'];

  /** Departments, in the fixed order every list of them is given in (tie-break, SPEC.md rule 7). */
  var DEPTS = ['electric', 'camera', 'makeup'];

  /** Rule 3: each phase's breaker, amperes (illustrative). */
  var RATING = 32;

  /** The distribution (SPEC.md "Distribution"): three phases in board order, four sockets each; `fixed` devices are
   *  wired in and cannot be unplugged. */
  var PHASES = [
    { id: 'L1', slots: ['a1', 'a2', 'a3', 'a4'], fixed: [] },
    { id: 'L2', slots: ['b1', 'b2', 'b3', 'b4'], fixed: [] },
    { id: 'L3', slots: ['c1', 'c2', 'c3', 'c4'], fixed: ['camera'] }
  ];
  var SLOTS = [];
  var SLOT_PHASE = {};
  PHASES.forEach(function (ph) { ph.slots.forEach(function (id) { SLOTS.push(id); SLOT_PHASE[id] = ph.id; }); });

  /** Rule 6: the gaffer's plan, the device each socket is meant to take ('' = left free). Eight 2 kW lamps and one
   *  1 kW, spread so each phase carries a similar load: 6000, 6000 and 800 + 5000 = 5800 W. */
  var PLAN = {
    a1: 'l2000', a2: 'l2000', a3: 'l2000', a4: '',
    b1: 'l2000', b2: 'l2000', b3: 'l2000', b4: '',
    c1: 'l2000', c2: 'l2000', c3: 'l1000', c4: ''
  };

  /** What can be plugged in, in the order the hand control offers them. */
  var PLUGGABLE = ['l650', 'l1000', 'l2000', 'kettle'];

  var defaults = { hand: 'l2000' };
  SLOTS.forEach(function (id) { defaults[id] = ''; });

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  /** Presets (SPEC.md "Presets"): only what differs from the defaults. */
  var presets = [
    { id: 'plan', params: PLAN },
    { id: 'lopsided', params: { a1: 'l2000', a2: 'l2000', a3: 'l2000', a4: 'l1000', b1: 'l2000', b2: 'l2000', c1: 'l2000', c2: 'l2000', c3: 'l2000' } },
    { id: 'pile', params: { a1: 'l2000', a2: 'l2000', a3: 'l2000', a4: 'l2000' } },
    { id: 'kettle', params: Object.assign({}, PLAN, { c4: 'kettle', hand: 'kettle' }) }
  ].map(function (x) { return { id: x.id, params: withDefaults(x.params) }; });

  function sortDepts(list) {
    return DEPTS.filter(function (d) { return list.indexOf(d) >= 0; });
  }

  /** A socket's device, or '' when it is empty or holds an unknown id (rule 9). */
  function deviceIn(p, slot) {
    var d = p[slot];
    return d && PLUGGABLE.indexOf(d) >= 0 ? d : '';
  }

  /** The whole state from the params (SPEC.md rules 1–7). */
  function derive(p) {
    var lists = PHASES.map(function (ph) {
      var devices = [];
      ph.fixed.forEach(function (d) { devices.push({ slot: null, device: d, fixed: true }); });
      ph.slots.forEach(function (slot) {
        var d = deviceIn(p, slot);
        if (d) devices.push({ slot: slot, device: d, fixed: false });
      });
      return devices;
    });
    var pl = load.phaseLoad(lists.map(function (ds) { return ds.map(function (x) { return load.DEVICES[x.device].w; }); }), RATING);

    var plugs = [];
    var phases = PHASES.map(function (ph, i) {
      var l = pl.phases[i], devices = lists[i];
      devices.forEach(function (x) {
        var dev = load.DEVICES[x.device];
        plugs.push({
          slot: x.slot, phase: ph.id, device: x.device, fixed: x.fixed, w: dev.w, amps: load.amps(dev.w), dept: dev.dept,
          offPlan: !x.fixed && PLAN[x.slot] !== x.device, live: !l.tripped
        });
      });
      var depts = sortDepts(devices.map(function (x) { return load.DEVICES[x.device].dept; }));
      return {
        id: ph.id, rating: RATING, watts: l.watts, amps: l.amps, limitW: l.limitW, headroomW: l.limitW - l.watts,
        tripped: l.tripped, depts: depts, dark: l.tripped ? depts : []
      };
    });

    /** Rule 6: planned sockets left empty, in board order. */
    var missing = SLOTS.filter(function (id) { return PLAN[id] && !deviceIn(p, id); });
    var dark = [];
    phases.forEach(function (ph) { dark = dark.concat(ph.dark); });
    return {
      plugs: plugs,
      phases: phases,
      neutral: { watts: pl.neutralW, amps: pl.neutralAmps, rating: RATING },
      supply: { demandW: pl.demandW, liveW: pl.liveW, limitW: pl.limitW },
      tripped: phases.filter(function (ph) { return ph.tripped; }).map(function (ph) { return ph.id; }),
      dark: sortDepts(dark),
      cameraDark: dark.indexOf('camera') >= 0,
      offPlan: plugs.filter(function (x) { return x.offPlan; }).map(function (x) { return x.slot; }),
      missing: missing,
      asPlanned: SLOTS.every(function (id) { return deviceIn(p, id) === PLAN[id]; })
    };
  }

  /** Rule 8 (the page's "changed" mark): sockets whose device differs between two param sets, in board order. */
  function changedSlots(a, b) {
    if (!a) return [];
    return SLOTS.filter(function (id) { return deviceIn(a, id) !== deviceIn(b, id); });
  }

  /** Phases whose tripped state differs between two states, in board order. */
  function changedTrips(a, b) {
    if (!a) return [];
    return b.phases.filter(function (ph, i) { return a.phases[i].tripped !== ph.tripped; }).map(function (ph) { return ph.id; });
  }

  /** Rule 9 (a click on a socket): an empty socket takes what is in hand, a full one is unplugged. */
  function click(p, slot) {
    var patch = {};
    if (SLOTS.indexOf(slot) < 0) return patch;
    if (deviceIn(p, slot)) patch[slot] = '';
    else if (PLUGGABLE.indexOf(p.hand) >= 0) patch[slot] = p.hand;
    return patch;
  }

  /** Rule 8 (caption): among the phases with something plugged in by the student, the one with the least to spare;
   *  tie-break: board order. Null when nothing is plugged in. */
  function leastSpare(s) {
    var loaded = s.phases.filter(function (ph) { return s.plugs.some(function (x) { return x.phase === ph.id && !x.fixed; }); });
    if (!loaded.length) return null;
    return loaded.reduce(function (best, ph) { return ph.headroomW < best.headroomW ? ph : best; });
  }

  var logic = {
    V: load.V, V_LL: load.V_LL, DEVICES: load.DEVICES, DEPTS: DEPTS, RATING: RATING, PHASES: PHASES, SLOTS: SLOTS,
    SLOT_PHASE: SLOT_PHASE, PLAN: PLAN, PLUGGABLE: PLUGGABLE,
    defaults: defaults, presets: presets, withDefaults: withDefaults,
    initial: derive, derive: derive, changedSlots: changedSlots, changedTrips: changedTrips, click: click,
    leastSpare: leastSpare, load: load
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
