/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-risk-controls: four planned scenes of one fictional production (an actor running down wet stairs, a heavy lamp
   on a high stand over the crew, a car passing close to the camera, a powered door on a set), each with a likelihood
   and a severity level (1–5) and a risk score L × I as in cmp-risk-register. Five levels of control, strongest first:
   remove the hazard, replace it with something less dangerous, separate people from it, organise the work, personal
   protection. A control lowers the likelihood or the severity by whole levels (never below 1); removing the hazard
   leaves nothing. The lower controls depend on someone remembering every time, so on each run they are forgotten
   with a set chance; the page shows the risk on paper (every control in place), the expected risk on the day, and
   200 seeded runs of the scene with the injuries they give. An explorer: the state follows from the params.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  /** Rule 2: the five levels, strongest first. fail: the chance that the control is not in place on a run. */
  var LEVELS = [
    { id: 'remove', fail: 0 },
    { id: 'replace', fail: 0 },
    { id: 'separate', fail: 0.02 },
    { id: 'organise', fail: 0.2 },
    { id: 'protect', fail: 0.3 }
  ];
  var LEVEL_IDS = LEVELS.map(function (l) { return l.id; });

  /** Rule 1: the scenes (inherent L and I), and per level the levels its control takes off (dL, dI).
      'remove' takes the hazard away and has no dL, dI. */
  var SCENES = [
    { id: 'stairs', l: 4, i: 4, c: { replace: [2, 0], separate: [1, 1], organise: [1, 0], protect: [0, 1] } },
    { id: 'lamp', l: 3, i: 4, c: { replace: [0, 2], separate: [2, 0], organise: [1, 0], protect: [0, 1] } },
    { id: 'car', l: 3, i: 5, c: { replace: [0, 2], separate: [2, 0], organise: [1, 0], protect: [0, 0] } },
    { id: 'door', l: 4, i: 4, c: { replace: [0, 2], separate: [2, 0], organise: [1, 0], protect: [0, 0] } }
  ];
  var SCENE_IDS = SCENES.map(function (s) { return s.id; });

  /** Rule 4: the chance of an injury on one run at likelihood level 1–5 (index = level). */
  var P_RUN = [0, 0.01, 0.02, 0.04, 0.08, 0.16];
  var RUNS = 200;          // rule 5: runs per series
  var SERIOUS = 4;         // rule 4: severity at or above this is a serious injury
  var SEEDS = 99;          // rule 5: seeds 1 … SEEDS; the "new series" button goes round

  /** The param key of a scene's control at a level. */
  function key(scene, level) { return scene + '_' + level; }

  var defaults = { scene: 'stairs', seed: 1 };
  SCENE_IDS.forEach(function (s) { LEVEL_IDS.forEach(function (l) { defaults[key(s, l)] = false; }); });

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }
  /** Params with the given levels switched on in every scene. */
  function everywhere(levels, extra) {
    var o = {};
    SCENE_IDS.forEach(function (s) { levels.forEach(function (l) { o[key(s, l)] = true; }); });
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }

  /** Presets (SPEC.md "Presets"): only what differs from the defaults. */
  var presets = [
    { id: 'none', params: {} },
    { id: 'lower', params: everywhere(['organise', 'protect']) },
    { id: 'operator', params: { scene: 'door', door_organise: true } },
    { id: 'guard', params: { scene: 'door', door_separate: true, door_organise: true } },
    { id: 'upper', params: everywhere(['replace', 'separate', 'organise', 'protect'], { scene: 'lamp' }) },
    { id: 'remove', params: everywhere(['remove'], { scene: 'car' }) }
  ].map(function (x) { return { id: x.id, params: withDefaults(x.params) }; });

  // from sims/cmp-risk-register/scoring.js @ 35666dc
  /** Rule 1: the ordinal score. */
  function score(l, i) { return l * i; }

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

  function sceneOf(id) { return SCENES[SCENE_IDS.indexOf(id)]; }

  /** Rule 3: L and I with the controls `held` (level ids) in place; null when the hazard is removed. */
  function levelsWith(scene, held) {
    if (held.indexOf('remove') >= 0) return null;
    var l = scene.l, i = scene.i;
    held.forEach(function (lv) { var d = scene.c[lv]; if (d) { l -= d[0]; i -= d[1]; } });
    l = Math.max(1, l); i = Math.max(1, i);
    return { l: l, i: i, s: score(l, i) };
  }

  /** The chosen levels of a scene, strongest first (a param that is not exactly true is off). */
  function chosenOf(p, sceneId) {
    return LEVEL_IDS.filter(function (l) { return p[key(sceneId, l)] === true; });
  }

  /** Rule 6: the expected score, chance of an injury per run and of a serious one, over every combination of the
      chosen controls being forgotten (each independently with its level's fail chance). */
  function expected(scene, chosen) {
    var fixed = chosen.filter(function (l) { return LEVELS[LEVEL_IDS.indexOf(l)].fail === 0; });
    var may = chosen.filter(function (l) { return LEVELS[LEVEL_IDS.indexOf(l)].fail > 0; });
    var out = { s: 0, p: 0, ps: 0 };
    for (var m = 0; m < (1 << may.length); m++) {
      var pr = 1, held = fixed.slice();
      may.forEach(function (l, j) {
        var f = LEVELS[LEVEL_IDS.indexOf(l)].fail;
        if (m & (1 << j)) pr *= f; else { pr *= 1 - f; held.push(l); }
      });
      var r = levelsWith(scene, held);
      if (!r) continue;
      out.s += pr * r.s;
      out.p += pr * P_RUN[r.l];
      if (r.i >= SERIOUS) out.ps += pr * P_RUN[r.l];
    }
    return out;
  }

  /** Rule 5: one series of RUNS runs. Every run draws the same four numbers in the same order (separate, organise,
      protect forgotten?, then the injury), whatever is chosen, so a change of controls replays the same runs. */
  function series(scene, chosen, seed, sceneIndex) {
    var r = rng(seed * 16 + sceneIndex), runs = [], hurt = 0, serious = 0, forgot = 0;
    for (var k = 0; k < RUNS; k++) {
      var u = { separate: r(), organise: r(), protect: r() }, uh = r();
      var held = [], miss = [];
      chosen.forEach(function (l) {
        var f = LEVELS[LEVEL_IDS.indexOf(l)].fail;
        if (f > 0 && u[l] < f) miss.push(l); else held.push(l);
      });
      var lv = levelsWith(scene, held);
      var sev = lv && uh < P_RUN[lv.l] ? lv.i : 0;
      if (sev) hurt++;
      if (sev >= SERIOUS) serious++;
      if (miss.length) forgot++;
      runs.push({ sev: sev, miss: miss });
    }
    return { runs: runs, hurt: hurt, serious: serious, forgot: forgot };
  }

  /** Rule 7: the strongest chosen level, or null for none. */
  function strongest(chosen) { return chosen.length ? chosen[0] : null; }

  function sceneState(p, scene, idx, seed) {
    var chosen = chosenOf(p, scene.id);
    var paper = levelsWith(scene, chosen);
    var ex = expected(scene, chosen);
    var ser = series(scene, chosen, seed, idx);
    var inh = score(scene.l, scene.i);
    return {
      id: scene.id, l0: scene.l, i0: scene.i, s0: inh, chosen: chosen, top: strongest(chosen),
      removed: paper === null,
      l1: paper ? paper.l : null, i1: paper ? paper.i : null, s1: paper ? paper.s : 0,
      day: ex.s, kept: ex.s / inh,
      eHurt: ex.p * RUNS, eSerious: ex.ps * RUNS, eHurt0: P_RUN[scene.l] * RUNS,
      eSerious0: scene.i >= SERIOUS ? P_RUN[scene.l] * RUNS : 0,
      runs: ser.runs, hurt: ser.hurt, serious: ser.serious, forgot: ser.forgot
    };
  }

  function seedOf(x) {
    var n = Math.round(Number(x));
    return isFinite(n) && n >= 1 && n <= SEEDS ? n : defaults.seed;
  }

  /** The whole state from the params. */
  function derive(p) {
    var seed = seedOf(p.seed);
    var scenes = SCENES.map(function (s, k) { return sceneState(p, s, k, seed); });
    var sel = SCENE_IDS.indexOf(p.scene);
    return { scene: sel >= 0 ? sel : 0, seed: seed, scenes: scenes };
  }

  /** The patch that switches one control. */
  function toggle(p, sceneId, level) {
    if (SCENE_IDS.indexOf(sceneId) < 0 || LEVEL_IDS.indexOf(level) < 0) return null;
    var o = {};
    o[key(sceneId, level)] = p[key(sceneId, level)] !== true;
    return o;
  }
  /** The patch for the next series: seed + 1, round to 1 after SEEDS. */
  function nextSeed(p) { return { seed: seedOf(p.seed) % SEEDS + 1 }; }

  var logic = {
    LEVELS: LEVELS, LEVEL_IDS: LEVEL_IDS, SCENES: SCENES, SCENE_IDS: SCENE_IDS, P_RUN: P_RUN, RUNS: RUNS,
    SERIOUS: SERIOUS, SEEDS: SEEDS,
    defaults: defaults, presets: presets, withDefaults: withDefaults, key: key,
    initial: derive, derive: derive,
    score: score, rng: rng, levelsWith: levelsWith, chosenOf: chosenOf, expected: expected, series: series,
    strongest: strongest, toggle: toggle, nextSeed: nextSeed
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
