/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-working-load: a lamp hung from a pipe on one line or two, each line a chain of three pieces (a clamp on the pipe,
   a steel sling, a shackle at the lamp), each rated with a working load limit five times below its breaking strength.
   Open the angle between two lines, let the lamp drop a short way before the line catches it, swap in a weaker piece
   (a small shackle, a worn sling, a hook with no rating) and read each line's pull against its limit and the margin
   left before it breaks. An explorer: the state follows from the params at once. Pure: no DOM, no Math.random, no
   Date, no timers; state is plain JSON. The physics comes from rigging.js (line tension, the jolt of a drop, the
   chain of pieces; catalogue §5.25). Rules: SPEC.md. */
(function (root) {
  'use strict';

  var rg = typeof module === 'object' && module.exports
    ? require('./rigging.js')
    : root.SimdeckModels['set-rigging'];

  /** Rule 6: the lamps (kg). Illustrative. */
  var LAMPS = { l2: { m: 10 }, l5: { m: 20 }, l10: { m: 35 } };
  var LAMP_IDS = ['l2', 'l5', 'l10'];

  /** Rule 6: the safety factor of every rated piece (breaking strength = SF × the working load limit) and the
   *  stiffness of one line (N/m: it stretches 1 mm under 100 N). Both illustrative. */
  var SF = 5;
  var K = 100000;

  /** Rule 6: the pieces of a line from the top, with their working load limits as marked (kg). Illustrative. */
  var PIECES = [
    { id: 'clamp', wll: 150 },
    { id: 'sling', wll: 100 },
    { id: 'shackle', wll: 250 }
  ];

  /** Rule 7: the weaker link put into line A (the only line, or the left one of two). `at`: which piece it replaces;
   *  `wll`: its marking (kg; null for none); `breaking`: its real breaking strength (kg). A small shackle is rated and
   *  marked for less; a worn sling still carries its marking but breaks at 40 % of a new one; a hook with no marking
   *  breaks at an unknown load, here 100 kg. Illustrative. */
  var LINKS = {
    rated: null,
    small: { at: 2, id: 'smallShackle', wll: 25, breaking: 125 },
    worn: { at: 1, id: 'wornSling', wll: 100, breaking: 200 },
    unrated: { at: 2, id: 'hook', wll: null, breaking: 100 }
  };
  var LINK_IDS = ['rated', 'small', 'worn', 'unrated'];

  /** Params (SPEC.md "Params"). angle: between the two lines, 0–160° (5); drop: how far the lamp falls before the
   *  line catches it, 0–20 cm (1). */
  var RANGES = {
    angle: { min: 0, max: 160, step: 5 },
    drop: { min: 0, max: 20, step: 1 }
  };
  var defaults = { lamp: 'l5', lines: 'one', angle: 60, drop: 0, link: 'rated' };

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  /** Presets (SPEC.md "Presets"): only what differs from the defaults. */
  var presets = [
    { id: 'single', params: {} },
    { id: 'angle', params: { lines: 'two', angle: 120 } },
    { id: 'drop', params: { drop: 10 } },
    { id: 'small', params: { link: 'small', drop: 5 } },
    { id: 'worn', params: { link: 'worn', drop: 10 } },
    { id: 'wide', params: { lamp: 'l10', lines: 'two', angle: 150 } }
  ].map(function (x) { return { id: x.id, params: withDefaults(x.params) }; });

  /** Rule 8: params of an unknown id fall back to the default; numbers are clamped to their range and rounded to it. */
  function clean(p) {
    var q = withDefaults(p);
    if (LAMP_IDS.indexOf(q.lamp) < 0) q.lamp = defaults.lamp;
    if (q.lines !== 'one' && q.lines !== 'two') q.lines = defaults.lines;
    if (LINK_IDS.indexOf(q.link) < 0) q.link = defaults.link;
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k], v = Number(q[k]);
      if (!isFinite(v)) v = defaults[k];
      v = Math.min(r.max, Math.max(r.min, v));
      q[k] = Math.round(v / r.step) * r.step;
    });
    return q;
  }

  /** Rule 7: the pieces of a line, in newtons: [{ id, wll, breaking, swapped }]. `weak`: put the chosen link in. */
  function piecesOf(link, weak) {
    var sw = weak ? LINKS[link] : null;
    return PIECES.map(function (x, i) {
      if (sw && sw.at === i) {
        return { id: sw.id, wll: sw.wll === null ? null : rg.weight(sw.wll), breaking: rg.weight(sw.breaking), swapped: true };
      }
      return { id: x.id, wll: rg.weight(x.wll), breaking: rg.weight(SF * x.wll), swapped: false };
    });
  }

  /** The whole state from the params (SPEC.md rules 6–10). */
  function derive(params) {
    var p = clean(params);
    var m = LAMPS[p.lamp].m, w = rg.weight(m);
    var n = p.lines === 'two' ? 2 : 1;
    var angle = n > 1 ? p.angle : 0;

    // Rule 9: the pull at rest, then the jolt of the drop.
    var tStatic = rg.lineTension(w, n, angle);
    var stiff = rg.catchStiffness(K, n, angle);
    var stretch = w / stiff;
    var drop = p.drop / 100;
    var factor = rg.dropFactor(drop, stretch);
    var tPeak = tStatic * factor;

    // Rule 10: each line against its pieces.
    var ids = n > 1 ? ['A', 'B'] : ['A'];
    var lines = ids.map(function (id, i) {
      var pieces = piecesOf(p.link, i === 0);
      var c = rg.chain(pieces);
      return {
        id: id,
        pieces: pieces,
        wll: c.wll,
        breaking: c.breaking,
        weakest: c.weakest,
        weakestLabel: c.weakestLabel,
        force: tPeak,
        share: c.wll === null ? null : tPeak / c.wll,
        margin: c.breaking / tPeak,
        state: rg.lineState(tPeak, c.wll, c.breaking)
      };
    });

    return {
      params: p,
      lamp: { id: p.lamp, m: m },
      w: w,
      n: n,
      angle: angle,
      tStatic: tStatic,
      stiff: stiff,
      stretch: stretch,
      factor: factor,
      stopIn: rg.catchDistance(drop, stretch),
      tPeak: tPeak,
      lines: lines,
      falls: lines.some(function (l) { return l.state === 'breaks'; })
    };
  }

  var logic = {
    LAMPS: LAMPS, LAMP_IDS: LAMP_IDS, SF: SF, K: K, PIECES: PIECES, LINKS: LINKS, LINK_IDS: LINK_IDS,
    RANGES: RANGES, defaults: defaults, presets: presets, withDefaults: withDefaults, clean: clean, piecesOf: piecesOf,
    initial: derive, derive: derive, rigging: rg
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
