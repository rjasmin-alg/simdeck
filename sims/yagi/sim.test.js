// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for yagi (SPEC.md). Run: node --test sims/yagi/
// Tie-breaks first, then one test per rule, then the presets, then the generic block.
// Expected numbers come from an independent scipy check (mutual impedances by the Ci/Si closed form and by quad of the
// induced-EMF integral, the self impedance by Balanis 8-60, directivity by a brute-force sum of |E|² over the sphere,
// beamwidths on a 0.01° grid; SPEC.md §2 and §6).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const MI = require('./mutual-impedance.js');
const CP = require('./current-pattern.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const nearZ = (z, re, im, tol, msg) => { near(z[0], re, tol, (msg || '') + ' re'); near(z[1], im, tol, (msg || '') + ' im'); };
const preset = (id) => L.initial(L.presets.find((x) => x.id === id).params);
const ETA = MI.ETA0, k = 2 * Math.PI;

// ── tie-breaks (SPEC.md §3) ──

test('tie-break 1: params are clamped and on their grid; a non-number gives the default; refl is a boolean', () => {
  assert.equal(L.norm({ dirs: -1 }).dirs, 0);
  assert.equal(L.norm({ dirs: 12 }).dirs, 8);
  assert.equal(L.norm({ dirs: 3.4 }).dirs, 3);
  assert.equal(L.norm({ sd: 0.1 + 0.2 }).sd, 0.3);
  assert.equal(L.norm({ sd: 0 }).sd, 0.05);
  assert.equal(L.norm({ ld: 0.4475 }).ld, 0.45, 'half a step rounds up');
  assert.equal(L.norm({ ld: 0.4474 }).ld, 0.445);
  assert.equal(L.norm({ lr: 9 }).lr, 0.6);
  assert.ok(!('le' in L.norm({ le: 0.5 })), 'the driven element is fixed, not a param');
  assert.equal(L.norm({ dirs: '4', sd: '0.25' }).dirs, 4);
  for (const bad of ['x', null, undefined, '', NaN, Infinity]) {
    const n = L.norm({ dirs: bad, lr: bad, sr: bad, le: bad, ld: bad, sd: bad, t: bad });
    for (const key of ['dirs', 'lr', 'sr', 'ld', 'sd', 't']) assert.equal(n[key], L.defaults[key], `${key} ${String(bad)}`);
  }
  for (const v of [true, 'true', '1', 1]) assert.equal(L.norm({ refl: v }).refl, true, String(v));
  for (const v of [false, 'false', '0', 0, 'x', null]) assert.equal(L.norm({ refl: v }).refl, false, String(v));
  assert.equal(L.norm({}).refl, L.defaults.refl);
  for (const [key, r] of Object.entries(L.RANGES)) {
    if (key === 't') continue;
    for (let v = r[0]; v <= r[1] + 1e-9; v += r[2]) {
      assert.equal(L.norm({ [key]: v + 1e-7 })[key], Number(v.toFixed(3)), `${key} ${v}`);
      assert.equal(L.norm({ [key]: v - 1e-7 })[key], Number(v.toFixed(3)), `${key} ${v} from below`);
    }
  }
});

test('tie-break 2: time wraps round the period; a non-number gives 0', () => {
  assert.equal(L.norm({ t: 360 }).t, 0);
  assert.equal(L.norm({ t: -5 }).t, 355);
  assert.equal(L.norm({ t: 722 }).t, 0);
  assert.equal(L.norm({ t: 47 }).t, 45);
  assert.equal(L.norm({ t: 'x' }).t, 0);
  assert.ok(!Object.is(L.norm({ t: -0.1 }).t, -0));
});

test('tie-break 3: the driven element alone: its own pattern, F/B undefined, vertical all round; absent elements change nothing', () => {
  const a = S({ refl: false, dirs: 0, lr: 0.4, sr: 0.05, ld: 0.55, sd: 0.45 });
  const b = S({ refl: false, dirs: 0, lr: 0.6, sr: 0.4, ld: 0.38, sd: 0.05 });
  for (const key of ['zin', 'd', 'main', 'bwE', 'bwH', 'fbDb', 'series']) {
    if (key === 'series') continue;                // the bars do use the director length (they add directors)
    assert.deepEqual(a[key], b[key], key);
  }
  assert.equal(a.single, true);
  assert.equal(a.els.length, 1);
  assert.equal(a.main, 0);
  assert.equal(a.kind, 'fwd');
  assert.equal(a.fbDb, null);
  assert.equal(a.backNull, false);
  assert.equal(a.bwH, null, 'all round in the vertical plane');
  nearZ(a.zin, a.zAlone[0], a.zAlone[1], 1e-9, 'its own impedance');
  // a reflector switched off ignores its length and spacing; zero directors ignore theirs
  const c = S({ refl: false, dirs: 2, lr: 0.4, sr: 0.05 }), d = S({ refl: false, dirs: 2, lr: 0.6, sr: 0.4 });
  assert.deepEqual(c.zin, d.zin);
  const e = S({ refl: true, dirs: 0, ld: 0.38, sd: 0.05 }), f = S({ refl: true, dirs: 0, ld: 0.55, sd: 0.45 });
  assert.deepEqual(e.zin, f.zin);
});

test('tie-break 4: the main lobe: equal front and back go forward; a backward beam is 180°; ends are exact', () => {
  const one = S({ refl: false, dirs: 0 });
  near(L.pow(one.els, one.crest, L.hDir(0)), L.pow(one.els, one.crest, L.hDir(180)), 1e-12, 'a dipole: front = back');
  assert.equal(one.main, 0);
  const back = preset('toolong');
  assert.equal(back.main, 180);
  assert.equal(back.kind, 'back');
  // the main lobe is the strongest direction on a fine grid
  for (const id of ['three', 'long', 'toolong', 'reflector']) {
    const st = preset(id);
    let mx = 0;
    for (let a = 0; a <= 360; a += 0.01) mx = Math.max(mx, L.pow(st.els, st.crest, L.hDir(a)));
    assert.ok(st.emax2 >= mx * (1 - 1e-12), id);
  }
  // a beam to the side is refined off the grid and found as the strongest
  const side = S({ refl: false, dirs: 3, ld: 0.49, sd: 0.45 });
  assert.equal(side.kind, 'side');
  near(side.main, 159.955, 0.001);
  let mx = 0, at = 0;
  for (let a = 0; a <= 180; a += 0.0005) { const v = L.pow(side.els, side.crest, L.hDir(a)); if (v > mx) { mx = v; at = a; } }
  assert.ok(side.emax2 >= mx * (1 - 1e-12), 'refined to the peak');
  near(side.main, at, 0.001);
  assert.ok(Math.abs(side.main - Math.round(side.main / L.GRID) * L.GRID) > 1e-3, 'off the grid');
  // its beamwidth sides are measured each way from the beam
  const [u, d] = side.bwSides;
  near(L.pow(side.els, side.crest, L.hDir(side.main + u)), side.emax2 / 2, 1e-9 * side.emax2);
  near(L.pow(side.els, side.crest, L.hDir(side.main - d)), side.emax2 / 2, 1e-9 * side.emax2);
  assert.ok(Math.abs(u - d) > 0.1, 'not symmetric off the boom');
});

test('tie-break 5: beamwidths: half power on both sides; the vertical one is twice one side; null when all round', () => {
  const st = preset('three');
  const half = st.emax2 / 2;
  const [a, b] = st.bwSides;
  near(L.pow(st.els, st.crest, L.hDir(st.main + a)), half, 1e-9 * st.emax2);
  near(L.pow(st.els, st.crest, L.hDir(st.main - b)), half, 1e-9 * st.emax2);
  near(a, b, 1e-9, 'mirror symmetric about the boom');
  near(L.pow(st.els, st.crest, L.vDir(st.main, st.bwH / 2)), half, 1e-9 * st.emax2);
  // touching half exactly is not falling below it
  assert.equal(L.halfSide(() => 0.5, 1), null);
  assert.equal(L.halfSide((s) => 1 - s / 360, 1), null, 'reaching half only at 180°');
  near(L.halfSide((s) => 1 - s / 359.9, 1), 179.95, 1e-9, 'falling below half in the last step');
  near(L.halfSide((s) => 1 - s / 200, 1), 100, 1e-9);
});

test('tie-break 6: F/B is the main lobe against the opposite direction; a null is flagged', () => {
  const st = preset('three');
  near(st.fbDb, -10 * Math.log10(L.pow(st.els, st.crest, L.hDir(180)) / st.emax2), 1e-12);
  const back = preset('toolong');
  assert.ok(back.fbDb > 10, 'positive though the beam is backwards');
  near(back.fbDb, -10 * Math.log10(L.pow(back.els, back.crest, L.hDir(0)) / back.emax2), 1e-12);
  assert.equal(st.backNull, false);
  assert.deepEqual(L.frontToBack(0.999e-12), { db: null, isNull: true }, 'below 1e-6 in field: a null');
  near(L.frontToBack(1e-12).db, 120, 1e-9);
  assert.equal(L.frontToBack(1e-12).isNull, false);
  assert.deepEqual(L.frontToBack(1), { db: -0, isNull: false });
  assert.equal(preset('dipole').fbDb, null, 'one element: not defined, not a null');
  assert.equal(preset('dipole').backNull, false);
});

test('tie-break 7: the director step: each lag wrapped into (−180°, 180°], their mean; steady only when every one is a lag', () => {
  const st = preset('long');
  const c = st.cur, f = st.fed;
  let sum = 0;
  for (let j = f + 1; j < c.length - 1; j++) { let g = -L.wrap180(c[j + 1].phase - c[j].phase); if (g === -180) g = 180; sum += g; }
  near(st.dirStep, sum / (c.length - 2 - f), 1e-12);
  near(st.dirStep, 122.48, 0.01);
  assert.equal(st.dirSteady, true);
  assert.equal(preset('three').dirStep, null, 'one director: no step');
  assert.equal(preset('three').dirSteady, false);
  // a small lead stays a small lead, not a lag of nearly a period (directors at 163°, 0°, 3°)
  const m = S({ refl: true, lr: 0.57, sr: 0.37, dirs: 3, ld: 0.495, sd: 0.08 });
  assert.equal(m.dirSteady, false);
  assert.ok(m.dirStep < 100, String(m.dirStep));
  near(m.dirStep, ((c2) => (-L.wrap180(c2[3].phase - c2[2].phase) - L.wrap180(c2[4].phase - c2[3].phase)) / 2)(m.cur), 1e-12);
});

// ── rules (SPEC.md §4) ──

test('rule 1: the self impedance is Balanis 8-60; λ/2 is 73.08 + j42.51 Ω; resonance near 0.4725 λ', () => {
  nearZ(MI.selfImpedance(0.5), 73.079, 42.515, 1e-3, 'λ/2');
  nearZ(MI.selfImpedance(0.5, 0.01), 73.079, 42.515, 1e-3, 'λ/2, any radius');
  nearZ(MI.selfImpedance(0.47), 60.652, -3.532, 1e-3, '0.47');
  nearZ(MI.selfImpedance(0.42), 42.426, -72.178, 1e-3, '0.42');
  nearZ(MI.selfImpedance(0.55), 95.706, 122.326, 1e-3, '0.55');
  let prev = -Infinity;
  for (let l = 0.4; l <= 0.6; l += 0.005) { const x = MI.selfImpedance(l)[1]; assert.ok(x > prev, `rises at ${l}`); prev = x; }
  assert.ok(MI.selfImpedance(0.4720)[1] < 0 && MI.selfImpedance(0.4730)[1] > 0, 'zero between 0.472 and 0.473');
  // Si and Ci against scipy
  near(MI.Si(1), 0.946083070367183, 1e-14);
  near(MI.Ci(1), 0.33740392290096816, 1e-14);
  near(MI.Si(7.5), 1.5106815309433859, 1e-12);
  near(MI.Ci(7.5), 0.1156332032379343, 1e-12);
  near(MI.Ci(0.0003), -7.53451244090654, 1e-12);
});

test('rule 2: the mutual impedance: the Ci/Si closed form for two λ/2 elements; reciprocal for unequal lengths', () => {
  const Ci = MI.Ci, Si = MI.Si;
  for (const d of [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.45, 0.5, 1, 2]) {
    const l = 0.5, u0 = k * d, u1 = k * (Math.hypot(d, l) + l), u2 = k * (Math.hypot(d, l) - l);
    const R = ETA / (4 * Math.PI) * (2 * Ci(u0) - Ci(u1) - Ci(u2));
    const X = -ETA / (4 * Math.PI) * (2 * Si(u0) - Si(u1) - Si(u2));
    nearZ(MI.mutualImpedance(0.5, 0.5, d), R, X, 1e-6, `d ${d}`);
  }
  nearZ(MI.mutualImpedance(0.5, 0.5, 0.5), -12.523, -29.908, 1e-3, 'Balanis/Kraus at λ/2');
  nearZ(MI.mutualImpedance(0.5, 0.5, 0.25), 40.758, -28.329, 1e-3);
  // unequal lengths: scipy quad of the same integral, and reciprocity
  nearZ(MI.mutualImpedance(0.5, 0.45, 0.2), 43.766431, -17.093258, 1e-6, 'scipy');
  for (const [a, b, d] of [[0.5, 0.45, 0.2], [0.42, 0.55, 0.05], [0.6, 0.38, 0.3], [0.475, 0.445, 0.15]]) {
    const z1 = MI.mutualImpedance(a, b, d), z2 = MI.mutualImpedance(b, a, d);
    nearZ(z1, z2[0], z2[1], 1e-9, `reciprocal ${a} ${b} ${d}`);
  }
  // as the spacing shrinks R tends to the self resistance
  assert.ok(MI.mutualImpedance(0.5, 0.5, 0.05)[0] < 73.08 && MI.mutualImpedance(0.5, 0.5, 0.05)[0] > 71.6);
});

test('rule 3: only the driven element is fed: no voltage on any parasitic element', () => {
  for (const id of ['reflector', 'director', 'three', 'long', 'toolong']) {
    const st = preset(id);
    const Z = MI.matrix(st.els.map((e) => ({ len: e.len, x: e.x })), MI.RADIUS, L.zOf);
    st.els.forEach((e, i) => {
      let re = 0, im = 0;
      st.crest.forEach((c, j) => { const m = MI.cmul(Z[i][j], c); re += m[0]; im += m[1]; });
      if (i === st.fed) {
        // V·sin(πl)/I_feed: the impedance at the feed
        // the feed current is 1, so the driving term V·sin(πl) gives V = Z_in
        const s = Math.sin(Math.PI * e.len);
        nearZ([re / s, im / s], st.zin[0], st.zin[1], 1e-9, `${id} feed`);
      } else {
        assert.ok(Math.hypot(re, im) < 1e-9, `${id} element ${i}: ${re} ${im}`);
      }
    });
  }
});

test('rule 4: power balance: Re(Z_in)·|I_feed|² = Re(IᴴZI) = the far field over the sphere', () => {
  for (const id of ['dipole', 'reflector', 'three', 'long', 'toolong']) {
    const st = preset(id);
    near(st.zin[0], st.rPower, 1e-9 * st.rPower, `${id}: feed current is 1`);
    const els = st.els.map((e, i) => ({ len: e.len, pos: [e.x, 0, 0], dir: [0, 1, 0], amp: Math.hypot(...st.crest[i]), phase: Math.atan2(st.crest[i][1], st.crest[i][0]) * 180 / Math.PI }));
    const sph = CP.resistanceOf(els, 360, 360);
    near(sph / st.rPower, 1, 2e-4, `${id}: sphere`);
    // the directivity from the sphere sum and the strongest direction in the horizontal plane
    const d = 4 * Math.PI * st.emax2 / CP.sphereIntegral(els, 360, 360);
    near(d / st.d, 1, 2e-4, `${id}: D`);
    // the field sum matches current-pattern.js field() (elements along y)
    for (const phi of [0, 33, 90, 147, 180]) {
      const e = CP.field(els, L.hDir(phi));
      near(CP.norm2(e), L.pow(st.els, st.crest, L.hDir(phi)), 1e-9 * st.emax2, `${id} ${phi}`);
    }
  }
});

test('rule 4b: the beam lies in the horizontal plane: no direction on the sphere is stronger', () => {
  for (const id of ['reflector', 'director', 'three', 'long', 'toolong']) {
    const st = preset(id);
    let mx = 0;
    for (let th = 0; th <= 180; th += 2) {
      for (let ph = 0; ph < 360; ph += 2) {
        const u = [Math.sin(th * Math.PI / 180) * Math.cos(ph * Math.PI / 180), Math.sin(th * Math.PI / 180) * Math.sin(ph * Math.PI / 180), Math.cos(th * Math.PI / 180)];
        mx = Math.max(mx, L.pow(st.els, st.crest, u));
      }
    }
    assert.ok(mx <= st.emax2 * (1 + 1e-9), id);
  }
});

test('rule 5: the phase is set by the length: more length, more lag; a lagging element pulls the beam, a leading one pushes it', () => {
  const swaps = { 0.05: 0.49, 0.1: 0.48, 0.15: 0.47, 0.2: 0.46, 0.25: 0.45, 0.3: 0.44 };   // first length that leads
  for (const d of [0.05, 0.1, 0.15, 0.2, 0.25, 0.3]) {
    let prevUnwrapped = null;
    for (let i = 0; i <= 30; i++) {
      const l = Number((0.4 + 0.005 * i).toFixed(3));
      const st = S({ refl: false, dirs: 1, ld: l, sd: d });
      const ph = st.cur[1].phase;
      // unwrapped into (−360, 0]: lengthening always adds lag
      const u = ph > 0 ? ph - 360 : ph;
      if (prevUnwrapped !== null) assert.ok(u < prevUnwrapped, `${d} ${l}: ${u} after ${prevUnwrapped}`);
      prevUnwrapped = u;
      assert.equal(st.kind, ph < 0 ? 'fwd' : 'back', `${d} ${l}: phase ${ph} and ${st.kind}`);
      if (Math.abs(l * 100 - Math.round(l * 100)) < 1e-9) assert.equal(ph > 0, l >= swaps[d] - 1e-9, `switch at ${d}: ${l}`);
    }
  }
  const r = preset('reflector'), dd = preset('director'), tl = preset('toolong');
  near(r.cur[0].amp, 0.669, 5e-4); near(r.cur[0].phase, 142.3, 0.05);
  near(dd.cur[1].amp, 0.846, 5e-4); near(dd.cur[1].phase, -147.0, 0.05);
  near(tl.cur[1].amp, 0.601, 5e-4); near(tl.cur[1].phase, 144.2, 0.05);
  assert.equal(dd.kind, 'fwd'); assert.equal(tl.kind, 'back');
});

test('rule 6: a reflector behind or a director in front gives a forward beam', () => {
  for (const id of ['reflector', 'director', 'three', 'long']) {
    const st = preset(id);
    assert.equal(st.kind, 'fwd', id);
    assert.ok(st.fbDb > 10, id);
    assert.ok(st.dbi > preset('dipole').dbi + 4, id);
  }
});

test('rule 7: more tuned directors, more gain, each adding less than the first; the beam narrows', () => {
  const st = preset('long');
  const want = [6.13, 8.61, 9.66, 10.33, 11.59, 12.07, 12.44, 13.35, 13.51];
  st.series.forEach((g, i) => near(g, want[i], 0.006, `${i} directors`));
  const first = st.series[1] - st.series[0];
  for (let i = 1; i < st.series.length; i++) {
    assert.ok(st.series[i] > st.series[i - 1], `rises at ${i}`);
    if (i > 1) assert.ok(st.series[i] - st.series[i - 1] < first, `${i} adds less than the first`);
  }
  near(st.series[6], st.dbi, 1e-12, 'the bar of the present layout is its gain');
  const bw = [];
  for (let n = 1; n <= 8; n++) bw.push(S({ refl: true, lr: 0.5, sr: 0.2, le: 0.475, ld: 0.43, sd: 0.3, dirs: n }).bwE);
  near(preset('three').bwE, 63.5, 0.05);
  near(bw[5], 38.8, 0.05);
  assert.ok(bw[7] < bw[0]);
});

test('rule 8: the feed impedance falls below the driven element alone', () => {
  const alone = preset('dipole');
  nearZ(alone.zin, 63.04, 3.98, 0.005);
  for (const id of ['reflector', 'director', 'three', 'long', 'toolong']) {
    const st = preset(id);
    assert.ok(st.zin[0] < alone.zin[0] * 0.75, id);
    nearZ(st.zAlone, alone.zin[0], alone.zin[1], 1e-9, `${id}: the reference is the same element alone`);
  }
  nearZ(preset('three').zin, 24.90, -1.03, 0.005);
});

test('rule 9: the driven element alone is a dipole: λ/2 is 73 Ω and 2.15 dBi, nulls along the wire', () => {
  // a λ/2 element alone, through the same induced-currents path as the antenna
  const els = [{ len: 0.5, x: 0 }], r = MI.induced(els, 0, MI.RADIUS, L.zOf);
  nearZ(r.zin, 73.08, 42.52, 0.005);
  const I = r.crest, mb = L.mainBeam(els, I);
  const d = MI.ETA0 * mb.p2 / (Math.PI * MI.powerResistance(r.Z, I));
  near(10 * Math.log10(d), 2.151, 0.001);
  near(L.D_DIPOLE, 1.6409, 1e-4);
  near(d, L.D_DIPOLE, 1e-12);
  const st = preset('dipole');
  assert.equal(L.DRIVEN, 0.475);
  assert.equal(L.pow(st.els, st.crest, L.hDir(90)), 0);
  assert.equal(L.gainAt(st, L.hDir(270)), -Infinity);
  near(L.beamwidths(els, I, 0, mb.p2).e, 78.1, 0.05);
  near(st.bwE, 79.2, 0.05);
});

test('rule 10: time never changes the model\'s numbers', () => {
  const a = S({ t: 0 }), b = S({ t: 135 });
  const strip = (s) => Object.assign({}, s, { p: Object.assign({}, s.p, { t: 0 }) });
  assert.deepEqual(strip(a), strip(b));
});

// ── presets (SPEC.md §6) ──

test('presets: the numbers in SPEC.md §6', () => {
  const want = {
    dipole: { dbi: 2.110, fb: null, z: [63.04, 3.98], bw: [79.2, null] },
    reflector: { dbi: 6.452, fb: 10.67, z: [36.35, 30.85], bw: [69.0, 133.0] },
    director: { dbi: 6.266, fb: 13.26, z: [25.47, -21.90], bw: [69.7, 137.6] },
    three: { dbi: 8.131, fb: 26.10, z: [24.90, -1.03], bw: [63.5, 100.8] },
    long: { dbi: 12.437, fb: 12.12, z: [44.98, 33.22], bw: [38.8, 43.0] },
    toolong: { dbi: 5.814, fb: 10.43, z: [28.12, 23.65], bw: [70.0, 146.0] }
  };
  for (const [id, w] of Object.entries(want)) {
    const st = preset(id);
    near(st.dbi, w.dbi, 0.001, `${id} dBi`);
    if (w.fb === null) assert.equal(st.fbDb, null); else near(st.fbDb, w.fb, 0.006, `${id} F/B`);
    nearZ(st.zin, w.z[0], w.z[1], 0.006, id);
    near(st.bwE, w.bw[0], 0.06, `${id} bwE`);
    if (w.bw[1] === null) assert.equal(st.bwH, null); else near(st.bwH, w.bw[1], 0.06, `${id} bwH`);
  }
  assert.deepEqual(L.presets.find((x) => x.id === 'three').params, Object.assign({}, L.defaults), 'the default is the three-element preset');
});

test('the polar plots\' top: the smallest ring at least 0.5 dB above the gain', () => {
  assert.equal(L.plotTop(2.15), 10);
  assert.equal(L.plotTop(9.5), 10);
  assert.equal(L.plotTop(9.51), 15);
  assert.equal(L.plotTop(14.1), 15);
  assert.equal(L.plotTop(14.51), 20);
  assert.equal(L.plotTop(30), 20);
  assert.equal(preset('long').top, 15);
  assert.equal(preset('three').top, 10);
});

test('the bars are recomputed for every layout (the memo key holds every param)', () => {
  for (const over of [{ sd: 0.25 }, { ld: 0.43 }, { lr: 0.48 }, { sr: 0.3 }, { refl: false }]) {
    const st = S(over);
    for (let n = 0; n <= 8; n += 4) near(st.series[n], 10 * Math.log10(L.solveLayout(L.norm(P(Object.assign({}, over, { dirs: n })))).d), 1e-12, JSON.stringify(over) + n);
  }
});

test('an element\'s own reactance: + longer than resonant, − shorter', () => {
  const st = preset('three');
  assert.ok(st.selfX[0] > 30, 'the reflector, 0.5 λ: inductive');
  assert.ok(st.selfX[1] > 0 && st.selfX[1] < 6, 'the driven element, 0.475 λ: just above resonance');
  assert.ok(st.selfX[2] < -30, 'the director, 0.445 λ: capacitive');
  near(st.selfX[0], 42.515, 1e-3);
});

test('two elements at the same place are refused, not looped over', () => {
  assert.throws(() => MI.integrate(() => [1, 0], 0, 1, 0));
});

// ── generic block ──

test('state is JSON-safe and finite over the ranges', () => {
  for (const refl of [false, true]) {
    for (const dirs of [0, 1, 3, 8]) {
      for (const [l, s] of [[0.38, 0.05], [0.445, 0.15], [0.55, 0.45]]) {
        for (const [lr, sr] of [[0.4, 0.05], [0.6, 0.4]]) {
          const st = S({ refl, dirs, ld: l, sd: s, lr, sr });
          assert.deepEqual(JSON.parse(JSON.stringify(st)), st, `${refl} ${dirs} ${l} ${s}`);
          for (const key of ['d', 'dbi', 'dbd', 'emax2', 'rPower', 'main']) assert.ok(Number.isFinite(st[key]), key);
          assert.ok(st.zin.every(Number.isFinite));
          assert.ok(st.series.every(Number.isFinite));
          assert.ok(st.rPower > 0);
          assert.equal(st.els.length, (refl ? 1 : 0) + 1 + dirs);
        }
      }
    }
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ dirs: 5, ld: 0.44, sd: 0.27, t: 30 });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a name and hint in both languages; the page is an explorer', () => {
  for (const pr of L.presets) {
    for (const key of Object.keys(pr.params)) assert.ok(key in L.defaults, `${pr.id}: ${key}`);
    for (const key of ['preset_' + pr.id, 'preset_' + pr.id + 'Hint']) assert.ok(strings.hr[key] && strings.en[key], key);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  for (const kind of ['single', 'fwd', 'back', 'side']) assert.ok(strings.en['main_' + kind] && strings.hr['main_' + kind], kind);
});
