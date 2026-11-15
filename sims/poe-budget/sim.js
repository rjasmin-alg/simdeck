/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for poe-budget: a 48-port PoE switch with a power budget. Each device has a class; the switch reserves
   the class maximum (or, in measured mode, the device's draw) and admits devices in port order while the total
   fits the budget. With priorities on, a device that does not fit sheds lower-priority ports, highest port first.
   A port type caps what one port can give. Rules and numbers: SPEC.md (IEEE 802.3af/at/bt class table; vendor
   practice for allocation and priority, marked (check)).
   An explorer: the state is derived from the params, no steps. Watts are summed in integer centiwatts.
   Pure: no DOM, no Math.random, no Date, no timers.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var PORTS = 48;

  /** Rule 1: class → power at the switch port (PSE) and guaranteed at the device (PD), in centiwatts; the
      standard that introduced it. */
  var CLASSES = [
    { cls: 0, pse: 1540, pd: 1295, std: 'af' },
    { cls: 1, pse: 400, pd: 384, std: 'af' },
    { cls: 2, pse: 700, pd: 649, std: 'af' },
    { cls: 3, pse: 1540, pd: 1295, std: 'af' },
    { cls: 4, pse: 3000, pd: 2550, std: 'at' },
    { cls: 5, pse: 4500, pd: 4000, std: 'bt' },
    { cls: 6, pse: 6000, pd: 5100, std: 'bt' },
    { cls: 7, pse: 7500, pd: 6200, std: 'bt' },
    { cls: 8, pse: 9000, pd: 7130, std: 'bt' }
  ];

  /** Rule 6: what one port of a type can give (PSE) and what that guarantees at the device (PD), centiwatts. */
  var PORT_TYPES = {
    at: { pse: 3000, pd: 2550 },
    bt: { pse: 9000, pd: 7130 }
  };

  var RANK = { low: 0, high: 1, critical: 2 };

  /** The device kinds, in the order their port blocks sit on the switch. Draws are examples (SPEC.md). */
  var KINDS = [
    { id: 'phone', param: 'phones', cls: 2, draw: 350, priority: 'low', first: 1, max: 24 },
    { id: 'ap', param: 'aps', cls: 4, draw: 1300, priority: 'critical', first: 25, max: 8 },
    { id: 'cam', param: 'cams', cls: 3, draw: 600, priority: 'critical', first: 33, max: 8 },
    { id: 'ptz', param: 'ptz', cls: 6, draw: 4000, priority: 'critical', first: 41, max: 2 }
  ];

  var MODES = ['class', 'measured'];
  var TYPES = ['at', 'bt'];

  var defaults = { budget: 370, allocMode: 'class', phones: 24, aps: 4, cams: 0, ptz: 0, portType: 'at', priorities: false };
  var BUDGET = { min: 60, max: 740, step: 10 };

  function P(p) { return Object.assign({}, defaults, p || {}); }
  function kindOf(id) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === id) return KINDS[i]; return null; }
  function classOf(c) { return CLASSES[c]; }
  function cw(w) { return Math.round(Number(w) * 100); }
  function W(c) { return c / 100; }

  /** An integer count clamped to 0 … max; anything else becomes 0. */
  function count(x, max) {
    x = Math.round(Number(x));
    if (!isFinite(x) || x < 0) return 0;
    return Math.min(max, x);
  }
  function budgetOf(x) {
    x = Math.round(Number(x) / BUDGET.step) * BUDGET.step;
    if (!isFinite(x)) return defaults.budget;
    return Math.min(BUDGET.max, Math.max(BUDGET.min, x));
  }

  /** The 48 ports with the device each holds: every kind fills its own block from its first port. */
  function layout(p) {
    var ports = [];
    for (var n = 1; n <= PORTS; n++) ports.push({ n: n, device: null, cls: null, priority: null, portType: p.portType });
    KINDS.forEach(function (k) {
      var c = count(p[k.param], k.max);
      for (var i = 0; i < c; i++) {
        var port = ports[k.first - 1 + i];
        port.device = k.id;
        port.cls = k.cls;
        port.priority = p.priorities ? k.priority : null;
      }
    });
    return ports;
  }

  /** Rules 2, 3 and 6: what a device of kind k reserves on a port of type t, and whether the port limits it. */
  function want(k, mode, t) {
    var c = classOf(k.cls), cap = PORT_TYPES[t];
    var w = mode === 'measured' ? k.draw : c.pse;
    var limited = c.pse > cap.pse;
    return { want: Math.min(w, cap.pse), limited: limited, pd: limited ? cap.pd : c.pd };
  }

  /**
   * Rules 4, 5 and 7, over plain data: entries [{ n, want (centiwatts), rank }] in any order; budget in centiwatts.
   * Returns { byPort: { n: 'powered' | 'denied' | 'shed' }, total, events }.
   */
  function allocate(entries, budget, usePriorities) {
    var list = entries.slice().sort(function (a, b) { return a.n - b.n; });
    var on = [], total = 0, byPort = {}, shedBy = {}, events = [];
    list.forEach(function (e) {
      if (total + e.want <= budget) { on.push(e); total += e.want; byPort[e.n] = 'powered'; return; }   // rule 7: ≤
      if (usePriorities) {
        var cands = on.filter(function (x) { return x.rank < e.rank; })
          .sort(function (a, b) { return a.rank - b.rank || b.n - a.n; });   // lowest priority, then highest port
        var freed = 0, chosen = [];
        for (var i = 0; i < cands.length && total - freed + e.want > budget; i++) { chosen.push(cands[i]); freed += cands[i].want; }
        if (total - freed + e.want <= budget) {
          chosen.forEach(function (x) { on.splice(on.indexOf(x), 1); byPort[x.n] = 'shed'; shedBy[x.n] = e.n; });
          events.push({ type: 'shed', n: e.n, ports: chosen.map(function (x) { return x.n; }), freed: freed, left: budget - total });
          total += e.want - freed;
          on.push(e);
          byPort[e.n] = 'powered';
          return;
        }
      }
      byPort[e.n] = 'denied';
      events.push({ type: 'deny', n: e.n, need: e.want, left: budget - total });
    });
    return { byPort: byPort, shedBy: shedBy, total: total, events: events };
  }

  function derive(p) {
    p = P(p);
    var mode = MODES.indexOf(p.allocMode) >= 0 ? p.allocMode : defaults.allocMode;
    var type = TYPES.indexOf(p.portType) >= 0 ? p.portType : defaults.portType;
    var prio = p.priorities === true;
    var budget = budgetOf(p.budget);
    var ports = layout({ phones: p.phones, aps: p.aps, cams: p.cams, ptz: p.ptz, portType: type, priorities: prio });

    var entries = [], info = {}, demand = 0, draw = 0;
    ports.forEach(function (port) {
      if (!port.device) return;
      var k = kindOf(port.device), w = want(k, mode, type);
      info[port.n] = w;
      demand += w.want;
      draw += k.draw;
      entries.push({ n: port.n, want: w.want, rank: RANK[k.priority] });
    });
    var a = allocate(entries, cw(budget), prio);

    var result = ports.map(function (port) {
      if (!port.device) return { n: port.n, device: null, want: 0, allocated: 0, pd: 0, limited: false, state: 'empty', shedBy: null };
      var w = info[port.n], st = a.byPort[port.n];
      var on = st === 'powered';
      return {
        n: port.n, device: port.device, want: W(w.want), allocated: on ? W(w.want) : 0, pd: W(w.pd), limited: w.limited,
        state: on && w.limited ? 'limited' : st, shedBy: st === 'shed' ? a.shedBy[port.n] : null
      };
    });

    return {
      budget: budget, allocMode: mode, portType: type, priorities: prio, cap: W(PORT_TYPES[type].pse),
      ports: ports, result: result,
      total: W(a.total), left: W(cw(budget) - a.total), demand: W(demand), draw: W(draw),
      events: a.events.map(function (e) {
        return e.type === 'deny'
          ? { type: 'deny', n: e.n, need: W(e.need), left: W(e.left) }
          : { type: 'shed', n: e.n, ports: e.ports, freed: W(e.freed), left: W(e.left) };
      })
    };
  }

  /** Ports whose state or allocation differs between two states (for the page's "changed" marks). */
  function changedPorts(prev, next) {
    if (!prev) return [];
    var out = [];
    for (var i = 0; i < next.result.length; i++) {
      var a = prev.result[i], b = next.result[i];
      if (!a || a.device !== b.device || a.state !== b.state || a.allocated !== b.allocated) out.push(b.n);
    }
    return out;
  }

  /** Runs of consecutive ports with the same device, state and allocation (the page's table). */
  function groups(s) {
    var out = [];
    s.result.forEach(function (r) {
      if (!r.device) return;
      var g = out[out.length - 1];
      if (g && g.to === r.n - 1 && g.device === r.device && g.state === r.state && g.allocated === r.allocated && g.want === r.want) {
        g.to = r.n;
        g.count++;
      } else {
        out.push({ from: r.n, to: r.n, count: 1, device: r.device, state: r.state, want: r.want, allocated: r.allocated, pd: r.pd,
          cls: kindOf(r.device).cls, priority: s.ports[r.n - 1].priority });
      }
    });
    return out;
  }

  var presets = [
    { id: 'office', params: {} },
    { id: 'cameras', params: { cams: 6 } },
    { id: 'measured', params: { cams: 6, allocMode: 'measured' } },
    { id: 'priority', params: { cams: 6, priorities: true } },
    { id: 'ptz', params: { ptz: 1 } }
  ];

  var logic = {
    PORTS: PORTS, CLASSES: CLASSES.map(function (c) { return { cls: c.cls, pse: W(c.pse), pd: W(c.pd), std: c.std }; }),
    PORT_TYPES: { at: { pse: 30, pd: 25.5 }, bt: { pse: 90, pd: 71.3 } },
    KINDS: KINDS.map(function (k) { return { id: k.id, param: k.param, cls: k.cls, draw: W(k.draw), priority: k.priority, first: k.first, max: k.max }; }),
    MODES: MODES, TYPES: TYPES, RANK: RANK, BUDGET: BUDGET, defaults: defaults,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, allocate: allocate, layout: layout, changedPorts: changedPorts, groups: groups, withDefaults: P,
    presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
