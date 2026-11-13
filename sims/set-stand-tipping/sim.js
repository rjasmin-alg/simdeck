/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-stand-tipping: a three-legged stand on an outdoor location, with a lamp or a flag or frame on top of its riser,
   sandbags on its legs (or on the ground beside them) and the wind blowing. The overturning moment (the wind's push
   on the head times its height, and the head's weight times its offset from the column) against the restoring moment
   (the weight of the stand, its head and its bags times their distance from the tipping edge, and a grip's hand on the
   column): above it, the stand tips. And the day's wind limit for frames. An explorer: the state follows from the
   params at once. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON.
   The physics comes from statics.js (the shared forces-and-moments model, catalogue §5.25). Rules: SPEC.md. */
(function (root) {
  'use strict';

  var st = typeof module === 'object' && module.exports
    ? require('./statics.js')
    : root.SimdeckModels['set-statics'];

  /** Rule 7: what can go on top of the riser. m = mass (kg), area = the surface the wind pushes (m²), sail = a flag
   *  or frame (the day's wind limit is for these), w and hgt = its size (m), for the drawing. All illustrative. */
  var HEADS = {
    lamp: { m: 10, area: 0.12, sail: false, w: 0.45, hgt: 0.4 },
    flag: { m: 1.5, area: 0.27, sail: true, w: 0.45, hgt: 0.6 },
    frame: { m: 4, area: 1.44, sail: true, w: 1.2, hgt: 1.2 },
    bigframe: { m: 7, area: 3.24, sail: true, w: 1.8, hgt: 1.8 }
  };
  var HEAD_IDS = ['lamp', 'flag', 'frame', 'bigframe'];

  /** Rule 7: the stand (kg; its own centre of gravity at 0.4 × the riser's height), a sandbag (kg; hung on a leg a
   *  quarter of the way from the column to the foot, its weight 0.25 m above the ground), and a grip holding the column (N, at m above the ground). All illustrative. */
  var STAND = { m: 14, cg: 0.4 };
  var BAG = { m: 15, along: 0.25, z: 0.25 };
  var HOLD = { f: 120, z: 1.2 };

  /** Rule 8: which legs take the bags, in the order they are filled (one each in turn). The load side is the side the
   *  wind and the head push toward: one leg when the load is over a leg, two when it is between them. */
  var LEGS = {
    leg: { load: ['A'], back: ['B', 'C'] },
    gap: { load: ['B', 'C'], back: ['A'] }
  };

  /** Params (SPEC.md "Params"). Ranges: height 1.5–4 m (0.25), arm 0–0.8 m (0.1), the legs' reach from the column
   *  0.45–0.75 m (0.05), bags 0–3, wind 0–16 m/s (0.5), limit 4–14 m/s (0.5). */
  var RANGES = {
    height: { min: 1.5, max: 4, step: 0.25 },
    arm: { min: 0, max: 0.8, step: 0.1 },
    reach: { min: 0.45, max: 0.75, step: 0.05 },
    bags: { min: 0, max: 3, step: 1 },
    wind: { min: 0, max: 16, step: 0.5 },
    limit: { min: 4, max: 14, step: 0.5 }
  };
  var defaults = {
    head: 'lamp', height: 2.5, reach: 0.6, orient: 'leg', arm: 0.3, bags: 1, bagOn: 'load', wind: 3, hold: false, limit: 8
  };

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  /** Presets (SPEC.md "Presets"): only what differs from the defaults. Pairs differ in one param. */
  var presets = [
    { id: 'arm', params: { arm: 0.8, reach: 0.45, orient: 'gap', bags: 0, wind: 0 } },
    { id: 'flag', params: { head: 'flag', height: 3, arm: 0, wind: 7 } },
    { id: 'bigframe', params: { head: 'bigframe', height: 3, arm: 0, wind: 7 } },
    { id: 'riser', params: { head: 'frame', height: 4, arm: 0, wind: 7 } },
    { id: 'ground', params: { head: 'frame', height: 2.5, arm: 0, orient: 'gap', bags: 2, bagOn: 'ground', wind: 6 } },
    { id: 'limit', params: { head: 'bigframe', height: 2, reach: 0.75, arm: 0, bags: 3, wind: 9, hold: true } }
  ].map(function (x) { return { id: x.id, params: withDefaults(x.params) }; });

  /** Rule 9: params outside their range or of an unknown id fall back to the default; numbers are clamped. */
  function clean(p) {
    var q = withDefaults(p);
    if (!HEADS[q.head]) q.head = defaults.head;
    if (!LEGS[q.orient]) q.orient = defaults.orient;
    if (['load', 'back', 'ground'].indexOf(q.bagOn) < 0) q.bagOn = defaults.bagOn;
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k], v = Number(q[k]);
      if (!isFinite(v)) v = defaults[k];
      q[k] = Math.min(r.max, Math.max(r.min, v));
    });
    q.bags = Math.round(q.bags);
    q.reach = Math.round(q.reach * 20) / 20;
    q.hold = q.hold === true;
    return q;
  }

  /** Rule 11: a speed above a limit; tie-break: within EPS of it is not above. */
  function above(v, limit) { return v > limit + st.EPS; }

  /** Rule 8: where each bag is: [{ leg, x, y, onLeg }] in the order placed. On the ground a bag stands beside the
   *  foot of the first leg of its side and carries nothing (it holds only once the leg has lifted). */
  function bagsOf(p, feet) {
    var out = [];
    var side = p.bagOn === 'back' ? 'back' : 'load';
    var legs = LEGS[p.orient][side];
    for (var i = 0; i < p.bags; i++) {
      var leg = legs[i % legs.length];
      var foot = feet.filter(function (f) { return f.leg === leg; })[0];
      if (p.bagOn === 'ground') out.push({ leg: leg, x: foot.x, y: foot.y, onLeg: false });
      else out.push({ leg: leg, x: foot.x * BAG.along, y: foot.y * BAG.along, onLeg: true });
    }
    return out;
  }

  /** The whole state from the params (SPEC.md rules 7–12). */
  function derive(params) {
    var p = clean(params);
    var head = HEADS[p.head], r = p.reach;
    var feet = st.tripod(r, p.orient);
    var bags = bagsOf(p, feet);
    var wStand = st.weight(STAND.m), wHead = st.weight(head.m), wBag = st.weight(BAG.m);

    // Rule 10: what overturns: the wind on the head at the riser's height, and the head's weight at its offset.
    var force = st.windForce(p.wind, head.area);
    var windM = force * p.height;
    var offsetM = wHead * p.arm;
    var overturn = windM + offsetM;

    // Rule 10: what restores: the stand and the head on the column, the bags on the legs, the grip's hand.
    var weights = [{ w: wStand, x: 0, y: 0 }, { w: wHead, x: 0, y: 0 }];
    bags.forEach(function (b) { if (b.onLeg) weights.push({ w: wBag, x: b.x, y: b.y }); });
    var holdM = p.hold ? HOLD.f * HOLD.z : 0;
    var bal = st.balance(feet, weights, overturn, holdM);
    var edge = bal.edges[bal.edge];

    var parts = {
      standHead: st.restoringOf(edge, wStand + wHead, 0, 0),
      bags: bags.map(function (b) { return b.onLeg ? st.restoringOf(edge, wBag, b.x, b.y) : 0; }),
      hold: holdM,
      wind: windM,
      offset: offsetM
    };

    // Rule 11: the wind speed at which it tips, and the day's limit for frames.
    var vCrit = st.criticalSpeed(bal.restoring, offsetM, head.area, p.height);

    // Rule 12: how far it can lean over the governing edge before it falls by itself (no wind, no hand).
    var masses = [{ m: STAND.m, z: STAND.cg * p.height }, { m: head.m, z: p.height }];
    bags.forEach(function (b) { if (b.onLeg) masses.push({ m: BAG.m, z: BAG.z }); });
    var mTot = masses.reduce(function (s, x) { return s + x.m; }, 0);
    var dist = (st.restoringOf(edge, wStand + wHead, 0, 0) - wHead * p.arm +
      parts.bags.reduce(function (s, x) { return s + x; }, 0)) * edge.nx / st.weight(mTot);
    var cgZ = st.cgHeight(masses);
    var cgX = (head.m * p.arm + bags.reduce(function (s2, b) { return s2 + (b.onLeg ? BAG.m * b.x : 0); }, 0)) / mTot;

    return {
      params: p,
      head: { id: p.head, m: head.m, area: head.area, sail: head.sail, w: head.w, hgt: head.hgt },
      r: r,
      feet: feet,
      bags: bags,
      edge: { a: edge.a, b: edge.b, cross: edge.cross, nx: edge.nx, ny: edge.ny, e: edge.e },
      force: force,
      overturn: bal.overturn,
      restoring: bal.restoring,
      parts: parts,
      ratio: bal.ratio,
      tips: bal.tips,
      vCrit: vCrit,
      overLimit: head.sail && above(p.wind, p.limit),
      critOverLimit: head.sail && above(vCrit, p.limit),
      lean: st.leanAngle(dist, cgZ),
      cgZ: cgZ,
      cgX: cgX,
      mass: mTot
    };
  }

  var logic = {
    HEADS: HEADS, HEAD_IDS: HEAD_IDS, STAND: STAND, BAG: BAG, HOLD: HOLD, LEGS: LEGS,
    RANGES: RANGES, defaults: defaults, presets: presets, withDefaults: withDefaults, clean: clean, bagsOf: bagsOf, above: above,
    initial: derive, derive: derive, statics: st
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
