// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ground-image (SPEC.md). Run: node --test sims/ground-image/
// Tie-breaks first, then one test per rule, then the presets, then the generic block.
// Expected numbers come from an independent numpy check (fields over the upper hemisphere, 1200 × 360 points; mutual
// resistances by scipy quad; take-off angles on a 0.01° grid; SPEC.md §2 and §6).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const G = require('./ground.js');
const AF = require('./array-factor.js');
const CP = require('./current-pattern.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const D2R = Math.PI / 180;
const AVG = L.epsOf('average'), POOR = L.epsOf('poor');
const D_DIP = CP.directivity(0.5).d;
/** |E|² in the drawn plane, elevation in degrees. */
const e2 = (ant, h, eps, deg) => G.at(ant, h, eps, deg * D2R, L.CUT_PHI).e2;

// ── tie-breaks (SPEC.md §3) ──

test('tie-break 1: params clamped and on their grid; bad values give the default; the vertical at least λ/4', () => {
  assert.equal(L.norm({ h: 0 }).h, 0.05);
  assert.equal(L.norm({ h: 9 }).h, 3);
  assert.equal(L.norm({ h: 0.1 + 0.2 }).h, 0.3);
  assert.equal(L.norm({ h: 0.26 }).h, 0.25);
  assert.equal(L.norm({ h: '1.5' }).h, 1.5);
  assert.equal(L.norm({ h: 0.29 }).h, 0.3, 'rounds up');
  assert.equal(L.norm({ h: 0.276 }).h, 0.3);
  assert.equal(L.norm({ h: 0.274 }).h, 0.25);
  assert.equal(L.norm({ ant: 'vertical', h: 0.1 }).h, 0.25, 'lower end on the ground');
  assert.equal(L.norm({ ant: 'vertical', h: 0.3 }).h, 0.3);
  assert.equal(L.norm({ ant: 'horizontal', h: 0.1 }).h, 0.1);
  assert.equal(L.norm({ ant: 'yagi' }).ant, 'horizontal');
  assert.equal(L.norm({ ground: 'wet' }).ground, 'perfect');
  assert.equal(L.norm({ ground: 'toString' }).ground, 'perfect', 'not an inherited key');
  for (const bad of ['x', null, undefined, '', NaN, Infinity, true]) {
    assert.deepEqual(L.norm({ ant: bad, h: bad, ground: bad, t: bad }), L.defaults, String(bad));
  }
  // the ground plane ignores h but keeps it
  const s = S({ ant: 'groundplane', h: 1.5 });
  assert.equal(s.h, 0);
  assert.equal(s.p.h, 1.5);
  assert.equal(L.norm({ ant: 'groundplane', h: 0.1 }).h, 0.1, 'a low h is kept for a switch back');
  assert.deepEqual(S({ ant: 'groundplane', h: 0.05 }).lobes, S({ ant: 'groundplane', h: 3 }).lobes);
});

test('tie-break 2: time wraps round the period', () => {
  assert.equal(L.norm({ t: 360 }).t, 0);
  assert.equal(L.norm({ t: -5 }).t, 355);
  assert.equal(L.norm({ t: 722 }).t, 0);
  assert.equal(L.norm({ t: 47 }).t, 45);
  assert.equal(L.norm({ t: 49 }).t, 50, 'to the nearest step');
  assert.equal(L.norm({ t: -0.1 }).t, 0);
  assert.ok(!Object.is(L.norm({ t: -0.1 }).t, -0), 'no −0');
});

test('tie-break 3: equal lobes go to the lowest elevation', () => {
  // h = 0.75 λ over a perfect ground: lobes at arcsin(1/3) and at 90°, equally strong
  const s = S({ h: 0.75 });
  assert.equal(s.count, 2);
  near(s.lobes[0].dbi, s.lobes[1].dbi, 1e-9);
  near(s.main, Math.asin(1 / 3) / D2R, 1e-6);
  // h = 2 λ: four equal lobes, the lowest wins
  const s2 = S({ h: 2 });
  assert.equal(s2.count, 4);
  near(s2.main, Math.asin(1 / 8) / D2R, 1e-6);
  for (const q of s2.lobes) near(q.dbi, s2.dbi, 1e-8);
  // and directly: equal gains, the earlier (lower) one is kept
  assert.equal(L.mainOf([{ at: 10, g: 2 }, { at: 40, g: 2 * (1 + 1e-12) }, { at: 70, g: 1 }]).at, 10);
  assert.equal(L.mainOf([{ at: 10, g: 2 }, { at: 40, g: 2 * (1 + 1e-6) }]).at, 40);
  assert.equal(L.mainOf([{ at: 10, g: 2 }, { at: 40, g: 2 * (1 + 5e-10) }]).at, 10, 'within 1e-9: equal');
  assert.equal(L.mainOf([{ at: 10, g: 2 }, { at: 40, g: 2 * (1 + 2e-9) }]).at, 40, 'past 1e-9: stronger');
});

test('tie-break 4: the horizon and the zenith count as lobes when not below their neighbour; a zero never', () => {
  // the zenith: a low horizontal dipole, and λ/4 exactly (sin Δ = 1)
  assert.deepEqual(S({ h: 0.1 }).lobes.map((q) => q.at), [90]);
  assert.deepEqual(S({ h: 0.25 }).lobes.map((q) => q.at), [90]);
  assert.equal(S({ h: 0.75 }).lobes[1].at, 90, 'the second lobe exactly at 90° counts once');
  // the horizon: a vertical over a perfect ground; a horizontal dipole's horizon is a zero, not a lobe
  assert.equal(S({ ant: 'vertical', h: 1 }).lobes[0].at, 0);
  assert.equal(S({ ant: 'groundplane' }).lobes[0].at, 0);
  for (const h of [0.5, 1, 2]) assert.ok(S({ h }).lobes.every((q) => q.at > 0), String(h));
  // the vertical's zenith is the dipole's own null, never a lobe
  assert.ok(S({ ant: 'vertical', h: 1.5, ground: 'poor' }).lobes.every((q) => q.at < 90));
  // a flat top counts once, at its lower edge: at the horizon itself, short of the zenith
  assert.deepEqual(L.lobes((e) => (e <= 0.1 ? 1 : 1 - e / 90)).map((q) => q.at), [0]);
  const flat = L.lobes((e) => (e >= 89.9 ? 1 : e / 89.9));
  assert.equal(flat.length, 1);
  assert.ok(flat[0].at >= 89.9 - 1e-9 && flat[0].at < 90, String(flat[0].at));
  // a flat zero at an end is not a lobe
  assert.deepEqual(L.lobes((e) => Math.max(0, e - 10)).map((q) => q.at), [90]);
});

test('tie-break 5: the half-power span stops at the horizon and the zenith', () => {
  const up = S({ h: 0.15 });
  assert.equal(up.hp[1], 90);
  near(up.hp[0], Math.asin(Math.asin(Math.SQRT1_2 * Math.sin(2 * Math.PI * 0.15)) / (2 * Math.PI * 0.15)) / D2R, 1e-3,
    'where 2 sin(kh sin Δ) falls to 1/√2 of its top');
  const gp = S({ ant: 'groundplane' });
  assert.equal(gp.hp[0], 0);
  // touching half exactly is not below: λ/4 has its half-power edge at exactly 30°
  near(S({ h: 0.25 }).hp[0], 30, 1e-6);
  // a function that touches half and comes back: the walk goes on past it
  const f = (e) => (Math.abs(e - 20) < 1e-9 ? 0.5 : 1);
  assert.deepEqual(L.halfPower(f, 45), [0, 90]);
  // an end that is itself below half: the edge is bisected short of it
  // (started off the grid, so the walk steps past the end: 89.98 → 90.03, 0.02 → −0.03)
  near(L.halfPower((e) => (e < 89.99 ? 1 : 0), 45.03)[1], 89.99, 1e-6);
  near(L.halfPower((e) => (e > 0.01 ? 1 : 0), 44.97)[0], 0.01, 1e-6);
});

test('tie-break 6: the hop at 90° is exactly 0; the span gives the nearest and farthest landing', () => {
  assert.equal(L.hopKm(90), 0);
  assert.equal(L.hopKm(95), 0);
  const s = S({ h: 0.5 });
  assert.ok(s.hopNear < s.hop && s.hop < s.hopFar);
  near(s.hopNear, L.hopKm(s.hp[1]), 1e-9);
  near(s.hopFar, L.hopKm(s.hp[0]), 1e-9);
  assert.equal(S({ h: 0.15 }).hop, 0);
  assert.equal(S({ h: 0.15 }).hopNear, 0);
});

test('tie-break 7: the ground plane over a real ground keeps its 36.54 Ω; the lost share is never negative', () => {
  for (const g of ['perfect', 'average', 'poor']) {
    const s = S({ ant: 'groundplane', ground: g });
    near(s.r, 36.54, 0.01, g);
    assert.ok(s.lost >= 0 && s.lost < 1, g);
    near(s.lost + s.sky, 1, 1e-9, g);
  }
  assert.equal(S({ ant: 'groundplane' }).lost, 0);
});

test('tie-break 8: a zenith below 1e-9 of the main lobe is a null', () => {
  assert.equal(S({ h: 0.5 }).zenithDbi, null);
  assert.equal(S({ h: 1 }).zenithDbi, null);
  assert.equal(S({ ant: 'vertical', h: 0.5 }).zenithDbi, null);
  assert.equal(S({ ant: 'groundplane', ground: 'poor' }).zenithDbi, null);
  near(S({ h: 0.5, ground: 'average' }).zenithDbi, -5.83, 0.01);
  near(S({ h: 0.25 }).zenithDbi, S({ h: 0.25 }).dbi, 1e-12);
});

// ── rules (SPEC.md §4) ──

test('rule 1: the mirror\'s signs: a horizontal image in antiphase, a vertical one in phase', () => {
  for (const h of [0.15, 0.5, 1.3, 2.75]) {
    for (const deg of [0, 7, 19.47, 30, 63, 90]) {
      const u = Math.sin(deg * D2R);
      near(Math.sqrt(e2('horizontal', h, null, deg)), 2 * Math.abs(Math.sin(2 * Math.PI * h * u)), 1e-12, `h ${h} ${deg}`);
      const f = deg === 90 ? 0 : Math.cos(Math.PI / 2 * u) / Math.cos(deg * D2R);
      if (h >= 0.25) near(Math.sqrt(e2('vertical', h, null, deg)), f * 2 * Math.abs(Math.cos(2 * Math.PI * h * u)), 1e-12, `v ${h} ${deg}`);
    }
  }
  const r = G.reflect(null, 0.3);
  assert.deepEqual([r.rh, r.rv], [[1, 0], [1, 0]]);
  // the rod and its image make the half-wave dipole
  for (const u of [-0.9, -0.3, 0, 0.2, 0.7, 0.99]) {
    const a = G.rodFactor(u), b = G.rodFactor(-u);
    near(b[0], a[0], 1e-15); near(b[1], -a[1], 1e-15);
    near(2 * a[0], CP.elementFactor(0.5, u), 1e-12, String(u));
  }
  assert.deepEqual(G.rodFactor(1), [0, 0]);
});

test('rule 2: the image is a second element: the horizontal dipole and its image are a two-element array in antiphase', () => {
  for (const h of [0.1, 0.35, 0.5, 1.25, 3]) {
    for (const deg of [0, 5, 14.48, 30, 41, 77, 90]) {
      const cosG = Math.sin(deg * D2R);                     // the pair's line is vertical
      near(Math.sqrt(e2('horizontal', h, null, deg)), AF.arrayFactor(2, 2 * h, 180, cosG), 1e-12, `${h} ${deg}`);
      // and current-pattern.js's field of the pair, anywhere in the hemisphere
      const phi = 0.3 + deg * D2R, f = G.frame(deg * D2R, phi), els = G.elements('horizontal', h);
      near(G.at('horizontal', h, null, deg * D2R, phi).e2, CP.norm2(CP.field(els.direct.concat(els.image), f.r)), 1e-12);
    }
  }
});

test('rule 3: a lobe for every λ/2 of height, born straight up; the lowest at arcsin(1/(4h)); nulls at whole wavelengths of path', () => {
  for (let k = 1; k <= 60; k++) {
    const h = Number((k * 0.05).toFixed(2)), s = S({ h });
    assert.equal(s.count, Math.ceil(2 * h - 1e-9), `h ${h}`);
    if (h <= 0.25) assert.equal(s.main, 90, `h ${h}`);
    else near(s.main, Math.asin(1 / (4 * h)) / D2R, 1e-6, `h ${h}`);
    s.lobes.forEach((q, m) => near(Math.sin(q.at * D2R), Math.min(1, (2 * m + 1) / (4 * h)), 1e-7, `h ${h} lobe ${m}`));
    for (let m = 1; m / (2 * h) <= 1; m++) {
      const deg = Math.asin(m / (2 * h)) / D2R;
      assert.ok(e2('horizontal', h, null, deg) < 1e-20, `null h ${h} m ${m}`);
    }
    assert.ok(e2('horizontal', h, null, 0) < 1e-30, 'the horizon');
  }
  near(S({ h: 0.5 }).main, 30, 1e-6);
  // between whole multiples of λ/2 the newest lobe points straight up, weaker than the full ones
  const s55 = S({ h: 0.55 });
  assert.deepEqual(s55.lobes.map((q) => Math.round(q.at)), [27, 90]);
  assert.ok(s55.lobes[1].dbi < s55.dbi - 1);
  near(S({ h: 1 }).main, 14.4775, 1e-4);
  near(S({ h: 2 }).main, 7.1808, 1e-4);
  near(S({ h: 3 }).main, 4.7802, 1e-4);
});

test('rule 4: vertical antennas over a perfect ground are strongest on the horizon, with nothing straight up', () => {
  for (const h of [0.25, 0.4, 0.5, 1, 2.5]) {
    const s = S({ ant: 'vertical', h });
    assert.equal(s.main, 0, String(h));
    assert.equal(s.kind, 'horizon');
    assert.equal(s.zenithDbi, null);
  }
  const g = S({ ant: 'groundplane' });
  assert.equal(g.main, 0); assert.equal(g.kind, 'horizon'); assert.equal(g.count, 1);
  // the vertical's lobes, also the weak ones high up, against a fine independent scan (0.005°)
  for (const h of [0.5, 1, 1.75, 2.8, 3]) {
    const v = [];
    for (let i = 0; i <= 18000; i++) v.push(e2('vertical', h, null, i / 200));
    let n = v[0] >= v[1] ? 1 : 0;
    for (let i = 1; i < 18000; i++) if (v[i] > v[i - 1] && v[i] >= v[i + 1] && v[i] > 0) n++;
    assert.equal(S({ ant: 'vertical', h }).count, n, `vertical ${h}`);
  }
  assert.ok(S({ ant: 'vertical', h: 2.8 }).lobes.some((q) => Math.abs(q.at - 83.7) < 0.1), 'a lobe at 3e-4 of the main one counts');
});

test('rule 5: the feed resistance over a perfect ground is image theory\'s', () => {
  near(G.collinearResistance(0), 73.079, 1e-3);
  near(G.collinearResistance(0.5), 26.396, 1e-3);
  near(G.collinearResistance(1), -4.116, 1e-3);
  near(AF.mutualResistance(0.25, 0.5), 40.758, 1e-3);
  near(G.imageResistance('horizontal', 0.25), 85.602, 1e-3);
  near(G.imageResistance('horizontal', 0.125), 32.322, 1e-3);
  near(G.imageResistance('vertical', 0.25), 99.475, 1e-3);
  near(G.imageResistance('vertical', 0.5), 68.963, 1e-3);
  near(G.imageResistance('groundplane', 0), 36.540, 1e-3);
  for (const [ant, h] of [['horizontal', 0.05], ['horizontal', 0.15], ['horizontal', 0.25], ['horizontal', 0.6], ['horizontal', 1.35],
    ['horizontal', 3], ['vertical', 0.25], ['vertical', 0.7], ['vertical', 2.2], ['groundplane', 0]]) {
    const pw = G.power(ant, h, null);
    near(G.ohms(pw.fed) / G.imageResistance(ant, h), 1, 1e-4, `${ant} ${h}`);
    near(S({ ant, h }).r, G.imageResistance(ant, h), G.imageResistance(ant, h) * 1e-4);
  }
  near(S({ h: 0.05 }).r, 5.79, 0.01);
  const gp = S({ ant: 'groundplane' });
  near(gp.dbi, 5.161, 1e-3);
  near(gp.g, 2 * D_DIP, 1e-4);
});

test('rule 6: a raised horizontal dipole gains towards four times a dipole (+6 dB)', () => {
  near(S({ h: 2 }).dbi, 8.19, 0.01);
  near(S({ h: 3 }).dbi, 8.18, 0.01);
  near(S({ h: 3 }).g / (4 * D_DIP), 1, 0.01);
  near(S({ h: 0.5 }).dbi, 8.42, 0.01);
  near(S({ h: 0.6 }).fieldRatio, 2.248, 0.002, 'the largest field ratio in the ranges');
  for (let k = 1; k <= 60; k++) assert.ok(S({ h: k * 0.05 }).fieldRatio < L.TOP, String(k));
  assert.equal(L.TOP, 2.5, 'the plot ring SPEC §5 names');
});

test('rule 7: Fresnel: |Γ| = 1 for a perfect ground, below 1 on a real one, −1 at grazing; the pseudo-Brewster angle', () => {
  for (const eps of [AVG, POOR]) {
    for (const deg of [1, 10, 30, 60, 89]) {
      const f = G.fresnel(eps, deg * D2R);
      assert.ok(G.cabs2(f.gh) < 1 && G.cabs2(f.gv) < 1, String(deg));
    }
    const g0 = G.fresnel(eps, 0);
    near(g0.gh[0], -1, 1e-12); near(g0.gv[0], -1, 1e-12); near(g0.gh[1], 0, 1e-12); near(g0.gv[1], 0, 1e-12);
    // normal incidence: TE and TM alike, (√ε − 1)/(√ε + 1)
    const r = G.reflect(eps, Math.PI / 2), se = G.csqrt(eps), want = G.cdiv([se[0] - 1, se[1]], [se[0] + 1, se[1]]);
    near(r.rh[0], want[0], 1e-12); near(r.rh[1], want[1], 1e-12); near(r.rv[0], want[0], 1e-12); near(r.rv[1], want[1], 1e-12);
  }
  near(AVG[1], -12.857, 1e-3); near(POOR[1], -2.571, 1e-3);
  const brewster = (eps) => { let best = 0, v = 9; for (let d = 0; d <= 90; d += 0.01) { const x = G.cabs2(G.fresnel(eps, d * D2R).gv); if (x < v) { v = x; best = d; } } return best; };
  near(brewster(AVG), 13, 1); near(brewster(POOR), 23, 1);
  const pf = G.fresnel(null, 0.4);
  assert.deepEqual([pf.gh, pf.gv], [[-1, 0], [1, 0]]);
});

test('rule 8: a real ground fills the nulls', () => {
  for (const h of [0.5, 1, 2]) {
    for (let m = 1; m / (2 * h) <= 1; m++) {
      const deg = Math.asin(m / (2 * h)) / D2R;
      assert.ok(e2('horizontal', h, null, deg) < 1e-20);
      for (const eps of [AVG, POOR]) assert.ok(e2('horizontal', h, eps, deg) > 1e-3, `${h} ${m}`);
    }
  }
  near(S({ h: 0.5, ground: 'average' }).zenithDbi, -5.83, 0.01);
  near(S({ h: 0.5, ground: 'poor' }).zenithDbi, -2.04, 0.01);
  // the interference nulls over a perfect ground, counted by the formulas and found on the pattern
  for (const ant of ['horizontal', 'vertical', 'groundplane']) {
    for (let k = 1; k <= 60; k++) {
      const h = ant === 'groundplane' ? 0 : Number((k * 0.05).toFixed(2));
      if (ant === 'vertical' && h < 0.25) continue;
      const v = [];
      for (let i = 0; i <= 9000; i++) v.push(e2(ant, h, null, i / 100));
      const top = Math.max(...v);
      let found = 0;
      for (let i = 1; i < 9000; i++) if (v[i] <= v[i - 1] && v[i] < v[i + 1] && v[i] < 1e-4 * top) found++;
      if (ant === 'horizontal' && Math.abs(2 * h - Math.round(2 * h)) < 1e-9) found++;   // the null exactly at 90°
      assert.equal(L.nullsPerfect(ant, h), found, `${ant} ${h}`);
      assert.equal(S({ ant, h }).nullsPerfect, found);
    }
  }
  // poor ground fills more than average
  assert.ok(S({ h: 0.5, ground: 'poor' }).zenithDbi > S({ h: 0.5, ground: 'average' }).zenithDbi);
});

test('rule 9: a real ground wastes power and quiets a vertical\'s horizon', () => {
  for (const [ant, h] of [['horizontal', 0.15], ['horizontal', 0.5], ['horizontal', 2], ['vertical', 0.5], ['groundplane', 0]]) {
    assert.equal(S({ ant, h }).lost, 0);
    for (const ground of ['average', 'poor']) {
      const s = S({ ant, h, ground });
      assert.ok(s.lost > 0.15 && s.sky < 1, `${ant} ${h} ${ground}`);
      assert.ok(s.dbi < S({ ant, h }).dbi, 'less gain than over a perfect ground');
      near(s.belowPerfect, S({ ant, h }).dbi - s.dbi, 1e-9);
    }
  }
  near(S({ h: 0.5, ground: 'average' }).lost, 0.228, 0.001);
  near(S({ h: 0.5, ground: 'poor' }).lost, 0.331, 0.001);
  near(S({ ant: 'vertical', h: 0.5, ground: 'poor' }).lost, 0.523, 0.001);
  for (const ant of ['vertical', 'groundplane']) {
    for (const eps of [AVG, POOR]) {
      assert.ok(e2(ant, ant === 'vertical' ? 0.5 : 0, eps, 0) < 1e-24, ant);
    }
  }
  const v = S({ ant: 'vertical', h: 0.5, ground: 'poor' });
  near(v.main, 16.52, 0.01); near(v.dbi, 2.25, 0.01);
  near(S({ ant: 'groundplane', ground: 'average' }).main, 26.16, 0.01);
});

test('rule 10: the hop is skip-distance\'s geometry', () => {
  near(L.hopKm(0), 3835.8, 0.1);
  near(L.hopKm(10), 2193.0, 0.1);
  near(L.hopKm(30), 934.1, 0.1);
  near(L.hopKm(60), 328.4, 0.1);
  for (let a = 0; a < 90; a += 5) assert.ok(L.hopKm(a) > L.hopKm(a + 5), 'falls with the angle');
});

test('rule 11: time never changes the pattern or the readout', () => {
  const a = S({ h: 1.2, ground: 'average', t: 0 }), b = S({ h: 1.2, ground: 'average', t: 135 });
  delete a.p.t; delete b.p.t;
  assert.deepEqual(a, b);
});

// ── presets (SPEC.md §6) ──

test('presets give the numbers in SPEC.md §6', () => {
  const st = (id) => S(L.presets.find((x) => x.id === id).params);
  let s = st('nvis');
  assert.equal(s.main, 90); assert.equal(s.kind, 'up'); near(s.dbi, 6.55, 0.01); near(s.lost, 0.285, 0.001);
  near(s.hp[0], 34.82, 0.01); assert.equal(s.hop, 0); near(s.hopFar, 789, 1); assert.equal(s.r, null);
  s = st('half');
  near(s.main, 30, 1e-6); assert.equal(s.count, 1); near(s.dbi, 8.42, 0.01); near(s.hp[0], 14.48, 0.01); near(s.hp[1], 48.59, 0.01);
  near(s.hop, 934, 1); near(s.r, 69.07, 0.01); near(s.pathDiff, 0.5, 1e-6);
  s = st('high');
  near(s.main, 7.18, 0.01); assert.equal(s.count, 4); near(s.dbi, 8.19, 0.01); near(s.hop, 2549, 1); near(s.r, 72.80, 0.01);
  s = st('highPoor');
  near(s.main, 6.96, 0.01); assert.equal(s.count, 5); near(s.dbi, 7.76, 0.01); near(s.lost, 0.312, 0.001);
  near(s.zenithDbi, -2.29, 0.01); near(s.belowPerfect, 0.43, 0.01);
  s = st('gp');
  assert.equal(s.main, 0); near(s.dbi, 5.16, 0.01); near(s.hp[1], 39.04, 0.01); near(s.hop, 3836, 1); near(s.r, 36.54, 0.01);
  s = st('gpPoor');
  near(s.main, 29.20, 0.01); near(s.dbi, -1.80, 0.01); near(s.lost, 0.800, 0.001); near(s.hop, 961, 1); near(s.r, 36.54, 0.01);
  assert.equal(s.perfect.at, 0); near(s.perfect.dbi, 5.16, 0.01);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and finite for every preset, the defaults and a sweep', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  for (const ant of L.ANTS) {
    for (const ground of Object.keys(L.GROUNDS)) {
      for (const h of [0.05, 0.25, 0.45, 0.8, 1.55, 3]) {
        const s = S({ ant, h, ground });
        assert.deepEqual(JSON.parse(JSON.stringify(s)), s, `${ant} ${ground} ${h}`);
        for (const k of ['main', 'g', 'dbi', 'fieldRatio', 'hop', 'hopNear', 'hopFar', 'lost', 'sky', 'pathDiff']) {
          assert.ok(Number.isFinite(s[k]), `${ant} ${ground} ${h}: ${k}`);
        }
        assert.ok(s.count >= 1 && s.hp[0] <= s.main && s.main <= s.hp[1]);
        assert.ok(s.fieldRatio < L.TOP);
      }
    }
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ ant: 'vertical', h: 0.65, ground: 'poor', t: 30 });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a name and hint in both languages; the page is an explorer', () => {
  for (const pr of L.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k}`);
    assert.deepEqual(L.norm(pr.params), pr.params, pr.id);
    for (const key of ['preset_' + pr.id, 'preset_' + pr.id + 'Hint']) assert.ok(strings.hr[key] && strings.en[key], key);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  for (const k of ['up', 'lobe', 'horizon']) assert.ok(strings.en['main_' + k] && strings.hr['main_' + k], k);
});
