/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-circuit-load: a location's four socket circuits, each behind its own breaker, and a cable drum plugged into one
   of them. The student plugs lamps, the make-up room's kettle and mirror lights into the sockets; every plug adds its
   current (P / V) to its circuit, a circuit above its breaker's rating trips and everything on it goes dark, and the
   cable drum's temperature follows the square of its current, coiled or unwound. An explorer: the state follows from
   the params at once. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON.
   The load itself comes from load.js (the shared electrical-load model, catalogue §5.25). Rules: SPEC.md. */
(function (root) {
  'use strict';

  var load = typeof module === 'object' && module.exports
    ? require('./load.js')
    : root.SimdeckModels['set-load'];

  /** Departments, in the fixed order every list of them is given in (tie-break, SPEC.md rule 6). */
  var DEPTS = ['electric', 'camera', 'makeup'];

  /** The location (SPEC.md "Location"): four circuits in board order. `dept` is the department the electricians'
   *  plan gives the circuit to; `slots` are its free sockets; `fixed` devices are already on it; `reel` names the
   *  cable drum's outlets when the drum is plugged into this circuit. Ratings in amperes (illustrative). */
  var CIRCUITS = [
    { id: 'c1', room: 'living', rating: 16, dept: 'electric', slots: ['s1', 's2'], fixed: [], reel: ['r1', 'r2'] },
    { id: 'c2', room: 'dining', rating: 16, dept: 'electric', slots: ['s3', 's4'], fixed: [], reel: [] },
    { id: 'c3', room: 'hall', rating: 16, dept: 'camera', slots: ['s5', 's6'], fixed: ['camera'], reel: [] },
    { id: 'c4', room: 'bedroom', rating: 10, dept: 'makeup', slots: ['s7', 's8'], fixed: [], reel: [] }
  ];
  /** Every socket the student can plug into, in board order (the drum's outlets after their circuit's sockets). */
  var SLOTS = [];
  var SLOT_CIRCUIT = {};
  CIRCUITS.forEach(function (c) {
    c.slots.concat(c.reel).forEach(function (id) { SLOTS.push(id); SLOT_CIRCUIT[id] = c.id; });
  });
  var REEL_SLOTS = ['r1', 'r2'];

  /** What can be plugged in, in the order the hand control offers them. */
  var PLUGGABLE = ['l650', 'l1000', 'l2000', 'kettle', 'mirror'];
  var REEL_MODES = ['coiled', 'unwound'];

  var defaults = { hand: 'l2000', reel: 'coiled' };
  SLOTS.forEach(function (id) { defaults[id] = ''; });

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  /** Presets (SPEC.md "Presets"): only what differs from the defaults. */
  var presets = [
    { id: 'one-lamp', params: { s1: 'l2000' } },
    { id: 'trip', params: { s1: 'l2000', s2: 'l2000' } },
    { id: 'spread', params: { s1: 'l2000', s3: 'l2000' } },
    { id: 'coiled', params: { r1: 'l2000' } },
    { id: 'makeup', params: { s7: 'kettle', s8: 'mirror', hand: 'kettle' } },
    { id: 'camera', params: { s5: 'kettle', s6: 'mirror', hand: 'kettle' } }
  ].map(function (x) { return { id: x.id, params: withDefaults(x.params) }; });

  function sortDepts(list) {
    return DEPTS.filter(function (d) { return list.indexOf(d) >= 0; });
  }

  /** The whole state from the params (SPEC.md rules 1–7). An unknown device in a socket counts as empty. */
  function derive(p) {
    var plugs = [];
    var circuits = CIRCUITS.map(function (c) {
      var devices = [];
      c.fixed.forEach(function (d) { devices.push({ slot: null, device: d, fixed: true }); });
      c.slots.concat(c.reel).forEach(function (slot) {
        var d = p[slot];
        if (d && load.DEVICES[d] && PLUGGABLE.indexOf(d) >= 0) devices.push({ slot: slot, device: d, fixed: false });
      });
      var l = load.circuitLoad(devices.map(function (x) { return load.DEVICES[x.device].w; }), c.rating);
      var depts = sortDepts(devices.map(function (x) { return load.DEVICES[x.device].dept; }));
      devices.forEach(function (x) {
        var dev = load.DEVICES[x.device];
        plugs.push({
          slot: x.slot, circuit: c.id, device: x.device, fixed: x.fixed, w: dev.w, amps: load.amps(dev.w), dept: dev.dept,
          offPlan: dev.dept !== c.dept, live: !l.tripped
        });
      });
      var offPlan = devices.filter(function (x) { return load.DEVICES[x.device].dept !== c.dept; }).length;
      return {
        id: c.id, room: c.room, rating: c.rating, dept: c.dept, watts: l.watts, amps: l.amps, limitW: l.limitW,
        headroomW: l.limitW - l.watts, tripped: l.tripped, depts: depts, dark: l.tripped ? depts : [], offPlan: offPlan
      };
    });
    var byId = {};
    circuits.forEach(function (c) { byId[c.id] = c; });

    var reelCircuit = byId[SLOT_CIRCUIT[REEL_SLOTS[0]]];
    var k = load.CABLE.k[p.reel] || load.CABLE.k.coiled;
    var demandW = plugs.filter(function (x) { return REEL_SLOTS.indexOf(x.slot) >= 0; })
      .reduce(function (s, x) { return s + x.w; }, 0);
    var reelW = reelCircuit.tripped ? 0 : demandW;
    var reel = {
      circuit: reelCircuit.id, mode: p.reel === 'unwound' ? 'unwound' : 'coiled', demandW: demandW, watts: reelW,
      amps: load.amps(reelW), temp: load.cableTemp(reelW, k), over: load.cableOver(reelW, k),
      maxAmps: load.cableMaxAmps(k), maxW: Math.floor(load.cableMaxAmps(k) * load.V)
    };

    var tripped = circuits.filter(function (c) { return c.tripped; }).map(function (c) { return c.id; });
    var dark = [];
    circuits.forEach(function (c) { dark = dark.concat(c.dark); });
    return {
      plugs: plugs, circuits: circuits, reel: reel, tripped: tripped, dark: sortDepts(dark),
      cameraDark: dark.indexOf('camera') >= 0,
      totalW: circuits.reduce(function (s, c) { return s + (c.tripped ? 0 : c.watts); }, 0)
    };
  }

  /** Rule 8 (the page's "changed" mark): sockets whose device differs between two param sets, in board order. */
  function changedSlots(a, b) {
    if (!a) return [];
    return SLOTS.filter(function (id) { return (a[id] || '') !== (b[id] || ''); });
  }

  /** Circuits whose tripped state differs between two states, in board order. */
  function changedTrips(a, b) {
    if (!a) return [];
    return b.circuits.filter(function (c, i) { return a.circuits[i].tripped !== c.tripped; }).map(function (c) { return c.id; });
  }

  /** Rule 9 (a click on a socket): an empty socket takes what is in hand, a full one is unplugged. */
  function click(p, slot) {
    var patch = {};
    patch[slot] = PLUGGABLE.indexOf(p[slot]) >= 0 ? '' : p.hand;
    return patch;
  }

  var logic = {
    V: load.V, DEVICES: load.DEVICES, CABLE: load.CABLE, DEPTS: DEPTS, CIRCUITS: CIRCUITS, SLOTS: SLOTS,
    SLOT_CIRCUIT: SLOT_CIRCUIT, REEL_SLOTS: REEL_SLOTS, PLUGGABLE: PLUGGABLE, REEL_MODES: REEL_MODES,
    defaults: defaults, presets: presets, withDefaults: withDefaults,
    initial: derive, derive: derive, changedSlots: changedSlots, changedTrips: changedTrips, click: click,
    load: load
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
