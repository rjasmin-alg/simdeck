/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-working-at-height: one crew member works above a busy set (on a ladder, a platform with rails or in a lift),
   holding a spanner, a clamp or a small lamp. Over a week of work above, things drop: from the hand, knocked off where
   they were put down, or while handed up or down. Each lands with E = m·g·h somewhere in a circle that grows with the
   height, and sometimes someone is under it. The controls: a zone below (open, taped, closed), tools tied on, the toe
   board of a platform or a lift, and training (who is not trained does not go up). An explorer: the state follows from
   the params at once; the week is seeded and every control acts on the same drops.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var G = 9.81;
  var EPS = 1e-9;

  /** Rule 1 and SPEC "Scene": what they hold (kg). Illustrative. */
  var ITEMS = { spanner: { m: 0.5 }, clamp: { m: 1 }, lamp: { m: 2.5 } };
  var ITEM_IDS = ['spanner', 'clamp', 'lamp'];
  var ACCESS_IDS = ['ladder', 'platform', 'lift'];
  var WORKER = { m: 80 };

  /** Rule 3: what stops the worker's own fall. */
  var FALL_STOP = { ladder: [], platform: ['rails'], lift: ['rails', 'harness'] };

  /** Rule 2: energy bands (J), illustrative: below the first a knock, from it "injures badly without a hard hat",
   *  from the second "dangerous even with a hard hat". */
  var BANDS = [10, 100];

  /** Rule 5: the week (hours of work above, days) and the drop kinds with their highest rate (per hour). */
  var HOURS = 20;
  var DAYS = 5;
  var KINDS = ['hand', 'edge', 'pass'];
  var LMAX = { hand: 1.5, edge: 0.5, pass: 0.25 };
  /** Rule 6: the rate of each kind with this access (per hour). */
  var RATE = {
    ladder: { hand: 1.5, edge: 0.5, pass: 0.25 },
    platform: { hand: 1.0, edge: 0.5, pass: 0.25 },
    lift: { hand: 1.0, edge: 0.5, pass: 0.25 }
  };

  /** Rule 10: the share of the time someone is under the work, and inside a taped zone. */
  var SHARE = { few: 0.05, busy: 0.2, through: 0.4 };
  var TRAFFIC_IDS = ['few', 'busy', 'through'];
  var ZONE_IDS = ['open', 'taped', 'closed'];
  var TAPED = 0.5;
  var SEEDS = 99;

  /** Rule 8: the radius of the circle where things land (m), from the height (m). */
  function landR(h) { return 0.5 + 0.3 * h; }

  var RANGES = {
    height: { min: 2, max: 10, step: 0.5 },
    zoneR: { min: 1, max: 5, step: 0.5 }
  };
  var defaults = {
    access: 'ladder', trained: true, item: 'clamp', height: 6, traffic: 'busy', zone: 'open', zoneR: 3, tether: false, seed: 1
  };

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { if (k in defaults) p[k] = over[k]; });
    return p;
  }

  /** Presets (SPEC.md "Presets"): only what differs from the defaults. */
  var presets = [
    { id: 'ladder', params: {} },
    { id: 'zone', params: { zone: 'closed', zoneR: 3 } },
    { id: 'small', params: { zone: 'closed', zoneR: 1.5 } },
    { id: 'taped', params: { zone: 'taped', zoneR: 3 } },
    { id: 'layers', params: { access: 'platform', tether: true } },
    { id: 'low', params: { height: 2 } }
  ].map(function (x) { return { id: x.id, params: withDefaults(x.params) }; });

  /** Rule 12: unknown ids fall back to the default; numbers are clamped and snapped; the seed is an integer 1 … SEEDS. */
  function clean(p) {
    var q = withDefaults(p);
    if (ACCESS_IDS.indexOf(q.access) < 0) q.access = defaults.access;
    if (ITEM_IDS.indexOf(q.item) < 0) q.item = defaults.item;
    if (TRAFFIC_IDS.indexOf(q.traffic) < 0) q.traffic = defaults.traffic;
    if (ZONE_IDS.indexOf(q.zone) < 0) q.zone = defaults.zone;
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k], v = Number(q[k]);
      if (!isFinite(v)) v = defaults[k];
      v = Math.min(r.max, Math.max(r.min, v));
      q[k] = Math.round((v - r.min) / r.step) * r.step + r.min;
    });
    var s = Number(q.seed);
    q.seed = isFinite(s) && Math.floor(s) === s && s >= 1 && s <= SEEDS ? s : defaults.seed;
    q.trained = q.trained !== false;
    q.tether = q.tether === true;
    return q;
  }

  /** mulberry32, the same generator as Simdeck.rng in kit/kit.js: a function returning [0, 1). */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Rule 1: energy (J) and speed at the floor (m/s) of mass m (kg) from height h (m). */
  function energy(m, h) { return m * G * h; }
  function speed(h) { return Math.sqrt(2 * G * h); }

  /** Rule 2: the band index 0, 1 or 2; a value on a boundary belongs to the band above. */
  function band(e) {
    var b = 0;
    BANDS.forEach(function (x) { if (e >= x - EPS) b++; });
    return b;
  }

  /** Rule 5: the week's candidate events for a seed, independent of every other param, sorted by time
   *  (tie-break: kind order, then the order drawn). Each: { kind, t (h), v, u, a, r, i }. */
  function events(seed) {
    var r = rng(seed), out = [];
    KINDS.forEach(function (kind, k) {
      var t = 0, i = 0;
      for (;;) {
        t += -Math.log(1 - r()) / LMAX[kind];
        if (t >= HOURS) break;
        out.push({ kind: kind, k: k, i: i++, t: t, v: r(), u: r(), a: r(), r: r() });
      }
    });
    out.sort(function (x, y) { return x.t - y.t || x.k - y.k || x.i - y.i; });
    return out;
  }

  /** Rule 6: does a candidate event happen with this access. */
  function happens(ev, access) { return ev.v < RATE[access][ev.kind] / LMAX[ev.kind]; }

  /** Rule 7: what stops it before the floor: 'tether', 'toeboard' or null. */
  function stopper(kind, p) {
    if (kind === 'hand' && p.tether) return 'tether';
    if (kind === 'edge' && p.access !== 'ladder') return 'toeboard';
    return null;
  }

  /** Rule 9: inside the zone (on the tape counts as inside). */
  function inZone(d, p) { return p.zone !== 'open' && d <= p.zoneR + EPS; }

  /** Rule 10: the factor on the share for a landing at distance d. */
  function zoneFactor(d, p) {
    if (!inZone(d, p)) return 1;
    return p.zone === 'closed' ? 0 : TAPED;
  }

  /** Rule 10: is someone under a drop that landed at distance d, with draw r (strictly below the chance). */
  function isHit(r, d, p) { return r < SHARE[p.traffic] * zoneFactor(d, p); }

  /** Rule 11: the day (0 … DAYS − 1) of an event at t hours: each day holds HOURS / DAYS hours. */
  function dayOf(t) { return Math.min(DAYS - 1, Math.floor(t / (HOURS / DAYS))); }

  /** Rule 11: the expected hits over many weeks. */
  function expected(p) {
    var R = landR(p.height), q = Math.min(1, (p.zoneR / R) * (p.zoneR / R));
    var f = p.zone === 'closed' ? 1 - q : p.zone === 'taped' ? 1 - (1 - TAPED) * q : 1;
    var rate = 0;
    KINDS.forEach(function (k) { if (!stopper(k, p)) rate += RATE[p.access][k]; });
    return HOURS * rate * SHARE[p.traffic] * f;
  }

  /** The whole state from the params (SPEC.md rules 1–11). */
  function derive(params) {
    var p = clean(params);
    var m = ITEMS[p.item].m, R = landR(p.height), share = SHARE[p.traffic];
    var drops = [], counts = { dropped: 0, caught: 0, stopped: 0, landed: 0, hits: 0 };
    var byKind = { hand: 0, edge: 0, pass: 0 };
    if (p.trained) {
      events(p.seed).forEach(function (ev) {
        if (!happens(ev, p.access)) return;
        counts.dropped++;
        byKind[ev.kind]++;
        var stop = stopper(ev.kind, p);
        var d = R * Math.sqrt(ev.u), ang = 2 * Math.PI * ev.a;
        var x = { kind: ev.kind, t: ev.t, day: dayOf(ev.t), stop: stop,
          d: d, x: d * Math.cos(ang), y: d * Math.sin(ang), inside: false, hit: false };
        if (stop === 'tether') counts.caught++;
        else if (stop === 'toeboard') counts.stopped++;
        else {
          counts.landed++;
          x.inside = inZone(d, p);
          x.hit = isHit(ev.r, d, p);
          if (x.hit) counts.hits++;
        }
        drops.push(x);
      });
    }
    var e = energy(m, p.height);
    return {
      params: p,
      blocked: !p.trained,
      m: m,
      energy: e,
      speed: speed(p.height),
      band: band(e),
      fall: energy(WORKER.m, p.height),
      fallStop: FALL_STOP[p.access].slice(),
      landR: R,
      share: share,
      drops: drops,
      counts: counts,
      byKind: byKind,
      expected: p.trained ? expected(p) : 0
    };
  }

  /** The patch for the next week: seed + 1, round to 1 after SEEDS. */
  function nextSeed(p) { return { seed: clean(p).seed % SEEDS + 1 }; }

  var logic = {
    G: G, EPS: EPS, ITEMS: ITEMS, ITEM_IDS: ITEM_IDS, ACCESS_IDS: ACCESS_IDS, TRAFFIC_IDS: TRAFFIC_IDS, ZONE_IDS: ZONE_IDS,
    WORKER: WORKER, FALL_STOP: FALL_STOP, BANDS: BANDS, HOURS: HOURS, DAYS: DAYS, KINDS: KINDS, LMAX: LMAX, RATE: RATE,
    SHARE: SHARE, TAPED: TAPED, SEEDS: SEEDS, RANGES: RANGES, defaults: defaults, presets: presets,
    withDefaults: withDefaults, clean: clean, rng: rng, energy: energy, speed: speed, band: band, landR: landR,
    events: events, happens: happens, stopper: stopper, inZone: inZone, zoneFactor: zoneFactor, isHit: isHit, dayOf: dayOf, expected: expected,
    nextSeed: nextSeed, initial: derive, derive: derive
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
