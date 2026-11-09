// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for antenna-array (SPEC.md). Run: node --test sims/antenna-array/
// Tie-breaks first, then one test per rule, then the presets, then the generic block.
// Expected numbers come from an independent scipy check (mutual resistances by the cosine-integral form, directivity by
// a brute-force sum of |F·AF|² over the sphere, beam data on a 0.001° grid; SPEC.md §2 and §6).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const AF = require('./array-factor.js');
const CP = require('./current-pattern.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const D2R = Math.PI / 180;

// ── tie-breaks (SPEC.md §3) ──

test('tie-break 1: params are clamped and on their grid; a non-number gives the default; lag −180 is 180', () => {
  assert.equal(L.norm({ n: 0 }).n, 1);
  assert.equal(L.norm({ n: 12 }).n, 8);
  assert.equal(L.norm({ n: 3.4 }).n, 3);
  assert.equal(L.norm({ d: 0 }).d, 0.05);
  assert.equal(L.norm({ d: 5 }).d, 2);
  assert.equal(L.norm({ d: 0.1 + 0.2 }).d, 0.3);
  assert.equal(L.norm({ d: 0.26 }).d, 0.25);
  assert.equal(L.norm({ lag: 92 }).lag, 90);
  assert.equal(L.norm({ lag: -999 }).lag, 180, 'clamped to −180, which is 180');
  assert.equal(L.norm({ lag: -180 }).lag, 180);
  assert.equal(L.norm({ lag: 180 }).lag, 180);
  assert.equal(L.norm({ lag: -175 }).lag, -175);
  assert.ok(!Object.is(L.norm({ lag: -1 }).lag, -0), 'no −0');
  assert.equal(L.norm({ n: '4', d: '1.5' }).n, 4);
  for (const bad of ['x', null, undefined, '', NaN, Infinity, true]) {
    assert.deepEqual(L.norm({ n: bad, d: bad, lag: bad, t: bad }), L.defaults, String(bad));
  }
  for (const [k, r] of Object.entries(L.RANGES)) {
    if (k === 't') continue;
    for (let v = r[0]; v <= r[1] + 1e-9; v += r[2]) {
      const want = Number(v.toFixed(2)) === -180 ? 180 : Number(v.toFixed(2));
      assert.equal(L.norm({ [k]: v + 1e-7 })[k], want, `${k} ${v}`);
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

test('tie-break 3: one element: all round, spacing and phase change nothing, D is the dipole\'s', () => {
  const a = S({ n: 1, d: 0.05, lag: -90 }), b = S({ n: 1, d: 2, lag: 180 });
  const strip = (s) => { const c = Object.assign({}, s); delete c.p; return c; };
  assert.deepEqual(strip(a), strip(b));
  assert.equal(a.kind, 'single'); assert.equal(a.main, null); assert.equal(a.bw, null); assert.equal(a.side, null);
  assert.equal(a.grating, 0); assert.deepEqual(a.full, []); assert.equal(a.backDb, null); assert.equal(a.backNull, false);
  near(a.d, 1.6409, 1e-4); near(a.dbi, 2.151, 1e-3); assert.equal(a.overDipole, 0);
  for (const phi of [0, 33, 90, 180]) assert.equal(L.afAt(L.norm({ n: 1, d: 0.7, lag: 45 }), phi), 1);
});

test('tie-break 4: a full-size lobe exactly on the line counts', () => {
  assert.deepEqual(L.fullLobes(L.norm({ n: 2, d: 1, lag: 0 })).map((q) => q.phi).sort((x, y) => x - y), [0, 90, 180]);
  assert.deepEqual(S({ n: 2, d: 1, lag: 0 }).gratingAt.slice().sort((x, y) => x - y), [0, 180]);
  assert.deepEqual(L.fullLobes(L.norm({ n: 2, d: 0.5, lag: 180 })).map((q) => [q.m, q.phi]), [[-1, 180], [0, 0]]);
  assert.deepEqual(L.fullLobes(L.norm({ n: 2, d: 0.25, lag: 90 })).map((q) => [q.m, q.phi]), [[0, 0]]);
  // just short of the line: no lobe there
  assert.deepEqual(L.fullLobes(L.norm({ n: 2, d: 0.95, lag: 0 })).map((q) => q.phi), [90]);
  for (const q of L.fullLobes({ n: 3, d: 0.65, lag: 120 })) assert.ok(!Object.is(q.m, -0));
});

test('tie-break 5: the main lobe is m = 0; over-steered, the strongest, ties to the smaller angle', () => {
  const s = S({ n: 4, d: 1.5, lag: 0 });
  assert.equal(s.main, 90); assert.equal(s.mainAf, 4); assert.equal(s.over, false);
  const e = S({ n: 2, d: 0.5, lag: 180 });
  assert.equal(e.main, 0, 'm = 0 at 0°, its twin at 180° is m = −1');
  // over-steered, the two ends equal: the smaller angle
  const w = S({ n: 2, d: 0.25, lag: 180 });
  assert.equal(w.over, true); assert.equal(w.main, 0); near(w.mainDb, -3.0103, 1e-4);
  // over-steered, a negative step: the 180° end
  const o = S({ n: 2, d: 0.25, lag: -120 });
  assert.equal(o.over, true); assert.equal(o.main, 180); assert.ok(o.mainDb < 0);
  // over-steered with an interior maximum (eight close-spaced in antiphase): a mirror pair, the smaller angle
  const m8 = S({ n: 8, d: 0.1, lag: 180 });
  assert.equal(m8.over, true); assert.ok(m8.main > 0 && m8.main < 90, String(m8.main));
  near(L.afAt(m8.p, m8.main), L.afAt(m8.p, 180 - m8.main), 1e-9);
  assert.equal(m8.side, null, 'the twin is not a side lobe');
});

test('tie-break 5: over-steered ties at unrelated angles go to the smaller one; the main lobe is a true, refined peak', () => {
  // AF(ψ) = AF(2π − ψ): seven elements 0.35 λ apart with 170° have two equal maxima, at 40.4° and 156.9°
  const s = S({ n: 7, d: 0.35, lag: 170 });
  assert.equal(s.over, true); near(s.main, 40.42, 0.01);
  const other = L.refine(s.p, Math.round(156.93 / L.GRID));
  near(other.af, s.mainAf, 1e-9, 'the other peak is as strong');
  for (const q of [{ n: 7, d: 0.35, lag: 170 }, { n: 8, d: 0.1, lag: 180 }, { n: 4, d: 0.2, lag: -175 }]) {
    const t = S(q);
    for (const dphi of [-0.01, -0.001, 0.001, 0.01]) {
      const a = t.main + dphi;
      if (a >= 0 && a <= 180) assert.ok(L.afAt(t.p, a) <= L.afAt(t.p, t.main) * (1 + 1e-12), `${JSON.stringify(q)} ${dphi}`);
    }
  }
  // an over-steered end is exactly the end
  assert.equal(S({ n: 2, d: 0.05, lag: -130 }).main, 180);
  assert.equal(S({ n: 2, d: 0.05, lag: 130 }).main, 0);
  // end-fire to the left is end-fire, not steered
  const l = S({ n: 2, d: 0.25, lag: -90 });
  assert.equal(l.kind, 'endfire'); assert.equal(l.main, 180);
});

test('tie-break 6: no half-power point within 180° gives a null beamwidth', () => {
  // two elements 0.05 λ apart in phase: AF ≥ 2·cos(9°) everywhere, never half
  const s = S({ n: 2, d: 0.05, lag: 0 });
  assert.equal(s.bw, null); assert.equal(s.hp, null);
  assert.equal(L.beamwidth(L.norm({ n: 2, d: 0.05, lag: 0 }), 90), null);
  // one side falls to half, the other never does: still null
  assert.equal(S({ n: 2, d: 0.15, lag: 40 }).bw, null);
  // touching half exactly 180° away is not falling below it
  assert.equal(S({ n: 2, d: 0.15, lag: 45 }).bw, null);
  // the walk crosses the line's end by the mirror: an end-fire lobe's width is twice one side
  const c = S({ n: 2, d: 0.25, lag: 90 });
  near(c.hp[0], c.hp[1], 1e-9); near(c.bw, 180, 1e-6);
});

test('tie-break 7: a side lobe is a local maximum below the main lobe; ends count; full-size and twin lobes do not', () => {
  // two elements 0.75 λ in phase: a −3.01 dB lobe growing at each end of the line
  const s = S({ n: 2, d: 0.75, lag: 0 });
  near(s.side.db, -3.0103, 1e-3); assert.equal(s.side.at, 0, 'both ends alike: the first');
  // steered off broadside, only one end has its lobe: each end must count on its own
  const r = S({ n: 2, d: 0.75, lag: 60 }), l = S({ n: 2, d: 0.75, lag: -60 });
  assert.ok([0, 180].includes(r.side.at) && [0, 180].includes(l.side.at));
  assert.equal(r.side.at + l.side.at, 180, 'mirror images');
  // the grating lobes of 4 × 1.5 λ are not side lobes; the true side lobe is −11.3 dB
  const g = S({ n: 4, d: 1.5, lag: 0 });
  near(g.side.db, -11.30, 0.01);
  for (const a of g.gratingAt) assert.ok(Math.abs(g.side.at - a) > 1);
  // a side lobe at the line's end, flat there: the back lobe of three-element end-fire
  near(S({ n: 3, d: 0.25, lag: 90 }).side.db, -9.542, 1e-3); assert.equal(S({ n: 3, d: 0.25, lag: 90 }).side.at, 180);
  assert.equal(S({ n: 3, d: 0.25, lag: -90 }).side.at, 0);
  // a near-main lobe next to an over-steered main is a side lobe, not excluded as the main one
  const o = S({ n: 6, d: 0.3, lag: 160 });
  near(o.side.db, -0.3239, 1e-3); assert.equal(o.side.at, 180);
  // next to a full-size lobe: the side lobe is the end one, −4.62 dB
  const f = S({ n: 2, d: 1.2, lag: 180 });
  near(f.side.db, -4.6156, 1e-3); assert.equal(f.side.at, 0);
  // an exact twin, refined, is never a side lobe
  const tw = S({ n: 7, d: 0.35, lag: -175 });
  assert.ok(tw.side === null || tw.side.db < -0.01, JSON.stringify(tw.side));
  // two elements have no side lobes inside the visible region at λ/2
  assert.equal(S({ n: 2, d: 0.5, lag: 0 }).side, null);
});

test('tie-break 8: the back is a null below 1e-6 of the main lobe; broadside is its own mirror', () => {
  const c = S({ n: 2, d: 0.25, lag: 90 });
  assert.equal(c.backNull, true); assert.equal(c.backDb, null);
  const b = S({ n: 2, d: 0.5, lag: 0 });
  assert.equal(b.backNull, false); near(b.backDb, 0, 1e-12);
  const st = S({ n: 4, d: 0.5, lag: 60 });
  assert.equal(st.backNull, false); assert.ok(st.backDb < -3);
});

// ── rules (SPEC.md §4) ──

test('rule 1: the array factor is |sin(nψ/2)/sin(ψ/2)|, 2|cos(ψ/2)| for two, largest (n) only at ψ = 2πm', () => {
  for (let n = 1; n <= 8; n++) {
    for (let psi = -7; psi <= 7; psi += 0.173) {
      const closed = Math.abs(Math.sin(n * psi / 2) / Math.sin(psi / 2));
      near(AF.arrayFactorAt(n, psi), closed, 1e-12, `${n} ${psi}`);
    }
    for (const m of [-2, -1, 0, 1, 2]) near(AF.arrayFactorAt(n, 2 * Math.PI * m), n, 1e-12);
    if (n > 1) assert.ok(AF.arrayFactorAt(n, 0.5) < n - 1e-3);
  }
  for (let psi = -6; psi <= 6; psi += 0.37) near(AF.arrayFactorAt(2, psi), 2 * Math.abs(Math.cos(psi / 2)), 1e-12);
  assert.equal(AF.arrayFactorAt(5, 0), 5);
  near(AF.psiOf(0.5, 90, 1), Math.PI - Math.PI / 2, 1e-15);
});

test('rule 2: pattern multiplication: the field of the set is the element factor times the array factor', () => {
  const r = kit.rng(7);
  for (const [n, d, lag] of [[2, 0.5, 0], [3, 0.35, -60], [8, 1.75, 135], [5, 0.25, 90]]) {
    const els = AF.elements(n, d, lag);
    for (let i = 0; i < 40; i++) {
      const th = r() * Math.PI, ph = r() * 2 * Math.PI;
      const rh = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
      const e = Math.sqrt(CP.norm2(CP.field(els, rh)));
      const want = Math.abs(CP.elementFactor(0.5, rh[2])) * AF.arrayFactor(n, d, lag, rh[0]);
      near(e, want, 1e-12, `${n} ${d} ${lag}`);
    }
  }
  // element m lags element 0 by m·lag, centred on the origin
  const els = AF.elements(3, 0.5, 40);
  assert.deepEqual(els.map((e) => e.pos[0]), [-0.5, 0, 0.5]);
  assert.deepEqual(els.map((e) => e.phase), [-0, -40, -80]);
});

test('rule 3: steering: the main lobe is at cos φ0 = α/(360·d) and is full size; it turns towards the lagging end', () => {
  for (const [n, d, lag] of [[4, 0.5, 90], [4, 0.5, -90], [3, 0.75, 45], [8, 0.4, 100], [6, 1, -170]]) {
    const s = S({ n, d, lag });
    near(Math.cos(s.main * D2R), lag / (360 * d), 1e-12, `${n} ${d} ${lag}`);
    assert.equal(s.mainAf, n);
    near(L.afAt(s.p, s.main), n, 1e-9);
    assert.equal(s.kind, 'steered');
    if (lag > 0) assert.ok(s.main < 90); else assert.ok(s.main > 90);
  }
  near(S({ n: 4, d: 0.5, lag: 90 }).main, 60, 1e-9);
  near(S({ n: 4, d: 0.5, lag: 90 }).pathDiff, 0.25, 1e-12, 'the path per element makes up the 90° step');
});

test('rule 4: the three classic pairs', () => {
  const b = S({ n: 2, d: 0.5, lag: 0 });
  assert.equal(b.kind, 'broadside'); assert.equal(b.main, 90); near(b.bw, 60, 1e-6);
  near(L.afAt(b.p, 0), 0, 1e-12); near(L.afAt(b.p, 180), 0, 1e-12);
  const e = S({ n: 2, d: 0.5, lag: 180 });
  assert.equal(e.kind, 'endfire'); assert.equal(e.main, 0); near(e.bw, 120, 1e-6);
  near(L.afAt(e.p, 90), 0, 1e-12); near(L.afAt(e.p, 180), 2, 1e-12); near(e.backDb, 0, 1e-9);
  const c = S({ n: 2, d: 0.25, lag: 90 });
  assert.equal(c.kind, 'endfire'); assert.equal(c.main, 0); near(c.bw, 180, 1e-6);
  near(L.afAt(c.p, 180), 0, 1e-12); assert.equal(c.backNull, true); assert.equal(c.grating, 0);
});

test('rule 5: grating lobes: |360m + α| ≤ 360·d; none in phase below λ; two at 1.5 λ; a steered beam\'s first at λ/(1 + |cos φ0|)', () => {
  for (let d = 0.05; d < 1 - 1e-9; d += 0.05) assert.equal(S({ n: 4, d: Number(d.toFixed(2)), lag: 0 }).grating, 0, `${d}`);
  assert.equal(S({ n: 4, d: 1, lag: 0 }).grating, 2);
  const g = S({ n: 4, d: 1.5, lag: 0 });
  assert.equal(g.grating, 2);
  const at = g.gratingAt.slice().sort((x, y) => x - y);
  near(at[0], Math.acos(2 / 3) / D2R, 1e-9); near(at[1], 180 - Math.acos(2 / 3) / D2R, 1e-9);
  near(at[0], 48.19, 0.005);
  for (const a of at) near(L.afAt(g.p, a), 4, 1e-9);
  // count by the rule for a sweep
  for (const d of [0.3, 0.55, 0.8, 1.2, 1.65, 2]) {
    for (const lag of [-180, -95, 0, 45, 130, 180]) {
      const p = L.norm({ n: 3, d, lag });
      let k = 0;
      for (let m = -10; m <= 10; m++) if (Math.abs(360 * m + p.lag) <= 360 * p.d + 1e-6) k++;
      assert.equal(L.fullLobes(p).length, k, `${d} ${lag}`);
    }
  }
  // steered to 60° (cos φ0 = ½): the first grating lobe arrives at d = λ/1.5, on the line
  const lobes = (d) => L.fullLobes({ n: 4, d, lag: 360 * d * 0.5 }).length;
  assert.equal(lobes(2 / 3 - 0.01), 1);
  assert.equal(lobes(2 / 3), 2);
  assert.equal(L.fullLobes({ n: 4, d: 2 / 3, lag: 120 }).filter((q) => q.m !== 0)[0].phi, 180);
});

test('rule 6: more elements make a narrower beam; the side lobe tends to −13.3 dB', () => {
  let prev = Infinity;
  for (let n = 2; n <= 8; n++) {
    const s = S({ n, d: 0.5, lag: 0 });
    assert.ok(s.bw < prev, `${n}`); prev = s.bw;
    if (n > 2) { assert.ok(s.side.db < -9 && s.side.db > -13.27, `${n} ${s.side.db}`); }
  }
  near(S({ n: 4, d: 0.5, lag: 0 }).bw, 26.32, 0.01);
  near(S({ n: 8, d: 0.5, lag: 0 }).bw, 12.80, 0.01);
  near(S({ n: 4, d: 0.5, lag: 0 }).side.db, -11.30, 0.01);
  near(S({ n: 8, d: 0.5, lag: 0 }).side.db, -12.80, 0.01);
  // directivity rises with n too
  assert.ok(S({ n: 8, d: 0.5 }).d > S({ n: 4, d: 0.5 }).d && S({ n: 4, d: 0.5 }).d > S({ n: 2, d: 0.5 }).d);
});

test('rule 7: mutual resistance of side-by-side λ/2 dipoles (the Ci form, Balanis eq. 8-68) and J0', () => {
  near(AF.besselJ0(0), 1, 1e-15);
  near(AF.besselJ0(1), 0.7651976865579666, 1e-14);
  near(AF.besselJ0(10), -0.2459357644513483, 1e-14);
  near(AF.besselJ0(50), 0.0558123276692518, 1e-14);
  near(AF.besselJ0(-3), AF.besselJ0(3), 0);
  near(AF.mutualResistance(0), 73.0790, 1e-3);
  near(AF.mutualResistance(0.25), 40.7575, 1e-3);
  near(AF.mutualResistance(0.5), -12.5234, 1e-3);
  near(AF.mutualResistance(1), 4.0089, 1e-3);
  near(L.R11, CP.resistanceAtCrest(0.5), 1e-6, 'R11 is the dipole\'s own radiation resistance');
  // the power sum: n·R11 + 2Σ(n−p)cos(pα)R(pd)
  near(AF.powerResistance(2, 0.5, 0, L.rOf), 2 * (73.0790 - 12.5234), 2e-3);
  near(AF.powerResistance(2, 0.25, 90, L.rOf), 2 * 73.0790, 2e-3);
});

test('rule 8: directivity = the brute-force integral over the sphere; one element 1.6409', () => {
  for (const [n, d, lag] of [[2, 0.5, 0], [2, 0.25, 90], [3, 0.7, -60]]) {
    const s = S({ n, d, lag });
    const els = AF.elements(n, d, lag);
    const brute = 4 * Math.PI * s.mainAf * s.mainAf / CP.sphereIntegral(els, 360, 720);
    near(s.d / brute, 1, 1e-4, `${n} ${d} ${lag}`);
  }
  near(S({ n: 1 }).d, CP.directivity(0.5).d, 1e-12);
  near(AF.directivity(1, L.R11), 1.6409, 1e-4);
  // the cardioid's mutual term vanishes (cos 90° = 0): exactly twice the dipole
  near(S({ n: 2, d: 0.25, lag: 90 }).overDipole, 10 * Math.log10(2), 1e-6);
});

test('rule 9: over-steered: no full-size lobe, the strongest direction below n', () => {
  const w = S({ n: 2, d: 0.25, lag: 180 });
  assert.equal(w.kind, 'over'); assert.deepEqual(w.full, []); assert.equal(w.grating, 0);
  near(w.mainDb, -3.0103, 1e-4); near(w.dbi, 5.694, 1e-3); near(w.backDb, 0, 1e-9);
  for (const [n, d, lag] of [[2, 0.25, 95], [5, 0.1, 40], [8, 0.45, -170]]) {
    const s = S({ n, d, lag });
    assert.ok(Math.abs(lag) > 360 * d);
    assert.equal(s.kind, 'over', `${n} ${d} ${lag}`); assert.ok(s.mainAf < n); assert.ok(s.mainDb < 0);
    for (let phi = 0; phi <= 180; phi += 0.5) assert.ok(L.afAt(s.p, phi) <= s.mainAf * (1 + 1e-9), `${phi}`);
  }
  // exactly at the edge (|α| = 360·d) it is ordinary end-fire, not over-steered
  assert.equal(S({ n: 8, d: 0.25, lag: 90 }).kind, 'endfire');
});

test('rule 10: time changes only t: the pattern, lobes and directivity stay', () => {
  const a = S({ n: 4, d: 0.5, lag: 90, t: 0 }), b = S({ n: 4, d: 0.5, lag: 90, t: 215 });
  const strip = (s) => { const c = Object.assign({}, s, { p: Object.assign({}, s.p, { t: 0 }) }); return c; };
  assert.deepEqual(strip(a), strip(b));
});

// ── presets (SPEC.md §6, scipy numbers) ──

test('presets: ids, valid params, and what SPEC.md §6 says', () => {
  assert.deepEqual(L.presets.map((p) => p.id), ['broadside', 'endfire', 'cardioid', 'steer', 'grating', 'eight']);
  for (const p of L.presets) assert.deepEqual(L.norm(p.params), p.params, p.id);
  const st = (id) => S(L.presets.find((p) => p.id === id).params);
  let s = st('broadside');
  near(s.d, 3.9606, 1e-4); near(s.dbi, 5.978, 1e-3); near(s.overDipole, 3.827, 1e-3); near(s.bw, 60, 0.01); assert.equal(s.main, 90);
  s = st('endfire');
  near(s.d, 2.8017, 1e-4); near(s.dbi, 4.474, 1e-3); near(s.overDipole, 2.323, 1e-3); near(s.bw, 120, 0.01); assert.equal(s.main, 0);
  s = st('cardioid');
  near(s.d, 3.2818, 1e-4); near(s.dbi, 5.161, 1e-3); near(s.overDipole, 3.010, 1e-3); near(s.bw, 180, 0.01); assert.equal(s.backNull, true);
  s = st('steer');
  near(s.d, 6.9446, 1e-4); near(s.dbi, 8.417, 1e-3); near(s.overDipole, 6.266, 1e-3); near(s.bw, 30.893, 0.01); near(s.main, 60, 1e-9);
  near(s.side.db, -11.30, 0.01);
  s = st('grating');
  near(s.d, 6.7913, 1e-4); near(s.dbi, 8.320, 1e-3); near(s.overDipole, 6.169, 1e-3); near(s.bw, 8.706, 0.01); assert.equal(s.grating, 2);
  s = st('eight');
  near(s.d, 17.2756, 1e-3); near(s.dbi, 12.374, 1e-3); near(s.overDipole, 10.223, 1e-3); near(s.bw, 12.804, 0.01);
  // more checked shapes
  near(S({ n: 2, d: 0.75, lag: 0 }).d, 4.7400, 1e-4);
  near(S({ n: 2, d: 1, lag: 0 }).d, 3.1112, 1e-4);
  near(S({ n: 8, d: 0.25, lag: 90 }).d, 9.9089, 1e-4); near(S({ n: 8, d: 0.25, lag: 90 }).bw, 78.024, 0.01);
});

test('the plot top is the smallest rung at least 3 % above the largest field ratio', () => {
  assert.equal(L.plotTop(1), 1.5);
  assert.equal(L.plotTop(1.45), 1.5);
  assert.equal(L.plotTop(1.47), 2);
  assert.equal(L.plotTop(4.06), 4.5);
  assert.equal(L.plotTop(9), 4.5);
  for (const pr of L.presets) { const s = S(pr.params); assert.ok(s.top >= s.fieldRatio * 1.03, pr.id); }
  near(S({ n: 8, d: 0.9, lag: 0 }).fieldRatio, 4.062, 1e-3);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset, the defaults and a sweep', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  for (let n = 1; n <= 8; n += 1) {
    for (const d of [0.05, 0.25, 0.5, 0.65, 1, 1.35, 2]) {
      for (const lag of [-180, -90, -5, 0, 45, 180]) {
        const s = S({ n, d, lag });
        assert.deepEqual(JSON.parse(JSON.stringify(s)), s, `${n} ${d} ${lag}`);
        for (const k of ['d', 'dbi', 'overDipole', 'mainAf', 'rPower']) assert.ok(Number.isFinite(s[k]), `${n} ${d} ${lag}: ${k}`);
        assert.ok(s.rPower > 0);
      }
    }
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ n: 5, d: 0.65, lag: -75, t: 30 });
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
    for (const key of ['preset_' + pr.id, 'preset_' + pr.id + 'Hint']) assert.ok(strings.hr[key] && strings.en[key], key);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  for (const kind of ['single', 'broadside', 'endfire', 'steered', 'over']) assert.ok(strings.en['main_' + kind] && strings.hr['main_' + kind], kind);
});
