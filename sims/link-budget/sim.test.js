// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for link-budget (SPEC.md). Run: node --test sims/link-budget/
// Tie-breaks first, then one test per rule, then the shared modules' new functions, then the presets, then the generic
// block. Expected numbers come from an independent Python check of the same formulas (SPEC.md §2 and §4).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const LB = require('./link-budget.js');
const PZ = require('./polarization.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const preset = (id) => S(L.presets.find((p) => p.id === id).params);

// ── tie-breaks (SPEC.md §1) ──

test('tie-break 1: params are clamped and put on their grid; a non-number gives the default; f from its list, dish a boolean', () => {
  assert.equal(L.norm({ ptx: -5 }).ptx, 0);
  assert.equal(L.norm({ ptx: 60 }).ptx, 50);
  assert.equal(L.norm({ ptx: 36.6 }).ptx, 37);
  assert.equal(L.norm({ gt: 2.15 }).gt, 2);
  assert.equal(L.norm({ gr: 2.3 }).gr, 2.5);
  assert.equal(L.norm({ gr: -20 }).gr, -10);
  assert.equal(L.norm({ dt: 0.1 }).dt, 0.3);
  assert.equal(L.norm({ dr: 0.1 + 0.2 + 0.4 }).dr, 0.7);
  assert.equal(L.norm({ dr: 9 }).dr, 3);
  assert.equal(L.norm({ lt: 12.4 }).lt, 12);
  assert.equal(L.norm({ lr: 99 }).lr, 50);
  assert.equal(L.norm({ dk: -20 }).dk, -10);
  assert.equal(L.norm({ dk: 99 }).dk, 56);
  assert.equal(L.norm({ psi: 47 }).psi, 45);
  assert.equal(L.norm({ psi: 100 }).psi, 90);
  assert.equal(L.norm({ sens: -200 }).sens, -150);
  assert.equal(L.norm({ sens: -60 }).sens, -80);
  assert.equal(L.norm({ fade: 31 }).fade, 30);
  for (const bad of ['x', null, undefined, '', NaN, Infinity, true]) {
    const keys = Object.keys(L.defaults);
    const n = L.norm(Object.fromEntries(keys.map((k) => [k, bad === true && k === 'dish' ? false : bad])));
    assert.deepEqual(n, L.defaults, String(bad));
  }
  assert.equal(L.norm({ f: '2400' }).f, 2400);
  assert.equal(L.norm({ f: 2401 }).f, 145, 'not one of the bands');
  assert.equal(L.norm({ dish: true }).dish, true);
  assert.equal(L.norm({ dish: 'true' }).dish, false, 'only a boolean (the kit parses the URL)');
  assert.equal(L.norm({ dish: 1 }).dish, false);
  for (const [k, r] of Object.entries(L.RANGES)) {
    for (let v = r[0]; v <= r[1] + 1e-9; v += r[2]) {
      assert.equal(L.norm({ [k]: v + 1e-7 })[k], Number(v.toFixed(2)), `${k} ${v}`);
    }
  }
});

test('tie-break 2: crossed (ψ 90°) receives nothing: loss, power, margin and distances are null; 85° is finite', () => {
  const s = S({ psi: 90 });
  assert.equal(s.plf, 0);
  assert.equal(s.pol, null); assert.equal(s.prx, null); assert.equal(s.margin, null); assert.equal(s.left, null);
  assert.equal(s.dMax, null); assert.equal(s.dEdge, null); assert.equal(s.status, 'crossed');
  assert.equal(s.uv, 0); assert.equal(s.prxW, 0);
  assert.equal(L.prxAt(s, 5), null);
  const t = S({ psi: 85 });
  near(t.pol, 21.19, 0.01); assert.ok(Number.isFinite(t.prx)); assert.notEqual(t.status, 'crossed');
});

test('tie-break 3: a margin exactly at the reserve works; exactly at 0 is fading; just under each falls a status', () => {
  assert.equal(L.statusOf(10, 10), 'works');
  assert.equal(L.statusOf(10 - 1e-12, 10), 'works', 'rounding below the reserve still meets it');
  assert.equal(L.statusOf(10 - 1e-6, 10), 'fading');
  assert.equal(L.statusOf(0, 10), 'fading');
  assert.equal(L.statusOf(-1e-12, 10), 'fading');
  assert.equal(L.statusOf(-1e-6, 10), 'fail');
  assert.equal(L.statusOf(0, 0), 'works', 'no reserve: just at the sensitivity works');
  assert.equal(L.statusOf(null, 0), 'crossed');
  // the model uses it: P_r at 1 km with 0 dBm is −75.68 dBm
  const m = S({ ptx: 0, dk: 0, sens: -80, fade: 0 });               // margin 4.32
  near(m.margin, 4.3249, 1e-3);
  assert.equal(m.status, 'works');
  assert.equal(L.initial(Object.assign({}, m.p, { fade: 4 })).status, 'works');
  assert.equal(L.initial(Object.assign({}, m.p, { fade: 5 })).status, 'fading');
  assert.equal(L.initial(Object.assign({}, m.p, { dk: 3 })).status, 'fail');   // 2 km: margin −1.70
  // at d_max the margin equals the reserve (to rounding), and the status there is works
  const s = S({});
  const k = { margin: L.prxAt(s, s.dMax) - s.p.sens };
  assert.equal(L.statusOf(k.margin, s.p.fade), 'works');
});

test('tie-break 4: no cable means no connectors either; any cable adds two connectors (0.2 dB)', () => {
  assert.equal(L.cableLoss(145, 0), 0);
  assert.equal(L.cableLoss(10368, 0), 0);
  near(L.cableLoss(145, 1), 0.0862 + 0.2, 1e-3);
  assert.equal(S({ lt: 0, lr: 0 }).ltx, 0);
  assert.equal(S({ lt: 0, lr: 0 }).lrx, 0);
  near(S({ lt: 1 }).ltx - S({ lt: 0 }).ltx, 0.2862, 1e-3);
});

test('tie-break 5: with fixed gains the dish sizes change nothing; with dishes the gain sliders change nothing', () => {
  const a = S({ dish: false, gt: 5, gr: 7, dt: 0.3, dr: 0.3 }), b = S({ dish: false, gt: 5, gr: 7, dt: 3, dr: 3 });
  assert.equal(a.prx, b.prx); assert.equal(a.gt, 5); assert.equal(a.gr, 7);
  const c = S({ dish: true, gt: -10, gr: -10, f: 1296 }), d = S({ dish: true, gt: 40, gr: 40, f: 1296 });
  assert.equal(c.prx, d.prx); near(c.gt, 20.06, 0.005);
  assert.equal(a.small, false); assert.equal(a.near, false); assert.equal(a.farKm, null);
});

test('tie-break 6: a dish under 3 λ across is flagged small, its gain still computed', () => {
  const s = S({ dish: true, dt: 1, dr: 1, f: 435 });            // 1 m = 1.45 λ
  assert.equal(s.small, true); near(s.gt, 10.58, 0.005);
  assert.equal(S({ dish: true, dt: 1, dr: 1, f: 1296 }).small, false);   // 4.32 λ
  assert.equal(S({ dish: true, dt: 3, dr: 0.6, f: 1296 }).small, true, 'the smaller dish decides (0.6 m = 2.6 λ)');
  assert.equal(S({ dish: true, dt: 0.7, dr: 0.7, f: 1296 }).small, false, '0.7 m = 3.03 λ');
});

test('tie-break 7: closer than 2D²/λ of the larger dish is flagged near', () => {
  const s = S({ dish: true, dt: 3, dr: 0.5, f: 10368, dk: -3 });    // 0.5 km < 622.5 m
  near(s.farKm, 0.6225, 1e-4); assert.equal(s.near, true);
  assert.equal(S({ dish: true, dt: 3, dr: 0.5, f: 10368, dk: -2 }).near, false);   // 0.63 km
  assert.equal(S({ dish: false, dk: -10, f: 10368 }).near, false);
  assert.equal(S({ dish: false, dt: 3, dr: 3, f: 10368, dk: -10 }).near, false, 'fixed gain: no size is known');
  assert.equal(S({ dish: false, dt: 0.3, dr: 0.3, f: 145 }).small, false);
});

// ── rules (SPEC.md §2) ──

test('rule 1: λ = c/f for the five bands', () => {
  near(S({ f: 145 }).lam, 2.06753, 1e-5);
  near(S({ f: 435 }).lam, 0.68918, 1e-5);
  near(S({ f: 1296 }).lam, 0.231321, 1e-6);
  near(S({ f: 2400 }).lam, 0.124914, 1e-6);
  near(S({ f: 10368 }).lam, 0.0289152, 1e-7);
  assert.deepEqual(L.FREQS, [145, 435, 1296, 2400, 10368]);
});

test('rule 2: cable loss α(f)·len/100 + 0.2 dB, α = 0.63√f + 0.0071f per 100 m', () => {
  const want = { 145: 8.62, 435: 16.23, 1296: 31.88, 2400: 47.90, 10368: 137.76 };
  for (const f of L.FREQS) near(L.alpha(f), want[f], 0.005, `${f}`);
  near(S({ f: 435, lt: 30 }).ltx, 5.07, 0.005);
  near(S({ f: 435, lr: 30 }).lrx, 5.07, 0.005);
  near(L.cableLoss(435, 20) * 2 - 0.2, L.cableLoss(435, 40), 1e-12, 'linear in length, connectors once');
});

test('rule 3: dish gain η(πD/λ)² with η 0.55; fixed gains as set', () => {
  const want = { 145: 1.04, 435: 10.58, 1296: 20.06, 2400: 25.41, 10368: 38.12 };
  for (const f of L.FREQS) near(S({ dish: true, dt: 1, f }).gt, want[f], 0.005, `${f}`);
  near(S({ dish: true, dt: 2, f: 1296 }).gt - S({ dish: true, dt: 1, f: 1296 }).gt, 6.0206, 1e-4, 'twice the diameter: 4× the gain');
  const two = S({ dish: true, dt: 3, dr: 0.5, f: 10368 });           // each end its own dish
  near(two.gt - two.gr, 20 * Math.log10(6), 1e-9);
  near(two.aEff, 0.55 * Math.PI * 0.25 / 4, 1e-12, 'the receiving area is the receive dish\'s');
  assert.equal(S({ gt: 12.5 }).gt, 12.5);
});

test('rule 4: EIRP = P_tx − L_tx + G_t', () => {
  const s = S({ ptx: 47, gt: 10, lt: 30, f: 435 });
  near(s.eirp, 47 - 5.0689 + 10, 1e-3);
  near(s.eirp, 51.93, 0.005);
});

test('rule 5: path loss 20·log(4πd/λ) = spreading 10·log(4πd²) − area 10·log(λ²/4π); +6.02 dB per doubling', () => {
  const s = S({ f: 145, dk: 0 });
  near(s.path, 75.675, 1e-3);
  near(s.spread - s.aIso, s.path, 1e-9);
  near(S({ dk: 3 }).path - S({ dk: 0 }).path, 6.0206, 1e-4);         // 1 → 2 km
  near(S({ dk: 6 }).path - S({ dk: 3 }).path, 6.0206, 1e-4);         // 2 → 4 km
  near(S({ dk: 10 }).path - S({ dk: 0 }).path, 20, 1e-9);            // ten times
  // the spreading does not depend on the band, the area part carries all of it
  assert.equal(S({ f: 145 }).spread, S({ f: 10368 }).spread);
  const want = { 145: -4.68, 435: -14.23, 1296: -23.71, 2400: -29.06, 10368: -41.77 };
  for (const f of L.FREQS) near(S({ f }).aIso, want[f], 0.005, `${f}`);
  near(LB.isoAreaDb(Math.sqrt(4 * Math.PI)), 0, 1e-12);
  near(LB.C / Math.sqrt(4 * Math.PI) / 1e6, 84.57, 0.005);
});

test('rule 6: the receiving area G_r·λ²/4π: falls as 1/f² with fixed gain, stays put for a dish', () => {
  near(S({ f: 145 }).aEff, 0.34017, 1e-5);
  near(S({ f: 2400 }).aEff, 0.0012417, 1e-7);
  near(S({ f: 145 }).aEff / S({ f: 2400 }).aEff, (2400 / 145) ** 2, 1e-9);
  for (const f of L.FREQS) near(S({ dish: true, dr: 1, f }).aEff, 0.55 * Math.PI / 4, 1e-12, `${f}`);
  near(S({ gr: 10 }).aEff, 10 * S({ gr: 0 }).aEff, 1e-12);
});

test('rule 7: polarization loss −10·log cos²ψ via |ê_tx·ê_rx*|²', () => {
  assert.equal(S({ psi: 0 }).pol, 0);
  near(S({ psi: 45 }).pol, 3.0103, 1e-4);
  near(S({ psi: 60 }).pol, 6.0206, 1e-4);
  near(S({ psi: 85 }).pol, 21.19, 0.005);
  for (let psi = 0; psi < 90; psi += 5) near(L.plfOf(psi), Math.cos(psi * Math.PI / 180) ** 2, 1e-12, `${psi}`);
  // the same factor as the shared model's own projection of two linear vectors
  near(L.plfOf(30), PZ.plf(PZ.linear([1, 0, 0]), PZ.linear([Math.cos(Math.PI / 6), Math.sin(Math.PI / 6), 0])), 1e-15);
});

test('rule 8: P_r = EIRP − L_p + G_r − L_pol − L_rx; also W and µV across 50 Ω', () => {
  const s = S({ ptx: 47, gt: 10, gr: 3, lt: 30, lr: 10, f: 435, dk: 14, psi: 45 });
  near(s.prx, s.eirp - s.path + s.gr - s.pol - s.lrx, 1e-12);
  near(s.pAnt, s.eirp - s.path + s.gr, 1e-12);
  near(s.flux, s.eirp - s.spread, 1e-12);
  const t = S({ ptx: 30, f: 145, dk: 0 });                         // 30 dBm − 75.68 = −45.68 dBm
  near(t.prx, -45.675, 1e-3);
  near(t.prxW, Math.pow(10, (t.prx - 30) / 10), 1e-20);
  near(1e6 * LB.volts(1e-15, 50), 0.2236, 1e-4, '−120 dBm');
  near(t.uv, 1e6 * Math.sqrt(t.prxW * 50), 1e-9);
  // each gain and loss counts once, dB for dB
  near(S({ gt: 5 }).prx - S({ gt: 0 }).prx, 5, 1e-12);
  near(S({ gr: 5 }).prx - S({ gr: 0 }).prx, 5, 1e-12);
  near(S({ ptx: 40 }).prx - S({ ptx: 30 }).prx, 10, 1e-12);
  near(S({ lr: 10 }).prx - S({ lr: 0 }).prx, -L.cableLoss(145, 10), 1e-12);
});

test('rule 9: margin = P_r − S, left = margin − F; works, fading, fail', () => {
  const s = S({});
  near(s.margin, s.prx + 120, 1e-12); near(s.left, s.margin - 10, 1e-12);
  assert.equal(s.status, 'works');
  assert.equal(preset('satellite').status, 'fading');
  assert.equal(S({ ptx: 0, dk: 50, sens: -80 }).status, 'fail');
});

test('rule 10: the longest distance d·10^(left/20) and the edge d·10^(M/20); P_r falls 20 dB per decade', () => {
  const s = S({});
  near(s.dMax, 10 * Math.pow(10, s.left / 20), 1e-9);
  near(s.dEdge, 10 * Math.pow(10, s.margin / 20), 1e-9);
  // the same longest distance from any starting distance
  for (const dk of [-5, 0, 7, 20, 33]) near(S({ dk }).dMax, s.dMax, 1e-6 * s.dMax, `dk ${dk}`);
  // at d_max the margin is exactly the reserve
  near(L.prxAt(s, s.dMax) - s.p.sens, s.p.fade, 1e-9);
  near(L.prxAt(s, s.dEdge) - s.p.sens, 0, 1e-9);
  near(L.prxAt(s, 2 * s.dKm), s.prx - 6.0206, 1e-4);
  near(L.prxAt(s, 10 * s.dKm), s.prx - 20, 1e-9);
  // fading: d_max shorter than d, d_edge longer
  const f = preset('satellite');
  assert.ok(f.dMax < f.dKm && f.dEdge > f.dKm);
});

test('rule 11: the distance grid is the rounded R10 series, three steps a doubling', () => {
  for (let k = 0; k < 10; k++) assert.equal(L.distanceKm(k), [1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8][k], `R10 ${k}`);
  for (let k = 0; k < 10; k++) assert.equal(L.distanceKm(k + 20), 100 * L.distanceKm(k), `decade ${k}`);
  assert.equal(L.distanceKm(-10), 0.1);
  assert.equal(L.distanceKm(0), 1);
  assert.equal(L.distanceKm(-1), 0.8);
  assert.equal(L.distanceKm(10), 10);
  assert.equal(L.distanceKm(13), 20);
  assert.equal(L.distanceKm(14), 25);
  assert.equal(L.distanceKm(33), 2000);
  assert.equal(L.distanceKm(56), 400000);
  for (const k of [0, 1, 3, 4, 10, 11, 20, -10, -9]) assert.equal(L.distanceKm(k + 3), 2 * L.distanceKm(k), `${k}`);
  for (let k = -10; k < 56; k++) assert.ok(L.distanceKm(k + 1) > L.distanceKm(k), `rising at ${k}`);
});

// ── the shared modules' new functions ──

test('module link-budget: the functions copied from gain-directivity are unchanged', () => {
  near(LB.db(100), 20, 1e-12); assert.equal(LB.db(0), null); near(LB.fromDb(3), 1.9953, 1e-4);
  near(LB.dbm(1), 30, 1e-12); near(LB.dbw(1000), 30, 1e-12); near(LB.gain(1.5, 0.5), 0.75, 1e-12);
  near(LB.dbdOf(2.15, 1.6409), -0.0009, 1e-4); assert.equal(LB.dbdOf(null, 1.64), null);
  const tx = LB.transmit(100, 3, 2, 0.5, 1.6409);
  near(tx.pAnt, 50.12, 0.01); near(tx.eirp, 50.12, 0.01); near(tx.erp, 30.55, 0.01);
});

test('module link-budget: path loss, areas, dish gain, polarization loss, receive, distanceFor, volts', () => {
  near(LB.wavelength(299.792458), 1, 1e-12);
  near(LB.pathLossDb(1000, 1), 81.984, 1e-3);
  near(LB.spreadingDb(1000) - LB.isoAreaDb(1), LB.pathLossDb(1000, 1), 1e-9);
  near(LB.effArea(1, 1), 1 / (4 * Math.PI), 1e-15);
  near(LB.gainOfArea(LB.effArea(7, 0.3), 0.3), 7, 1e-12);
  near(LB.dishGain(1, 0.1, 1), (Math.PI * 10) ** 2, 1e-9);
  assert.equal(LB.polLossDb(1), 0); assert.equal(LB.polLossDb(0), null); near(LB.polLossDb(0.5), 3.0103, 1e-4);
  assert.equal(LB.receive(40, 100, 5, null, 0), null);
  near(LB.receive(40, 100, 5, 3, 1), -59, 1e-12);
  near(LB.distanceFor(10, 6.0206), 20, 1e-4);
  near(LB.distanceFor(10, -20), 1, 1e-12);
  near(LB.volts(2, 50), 10, 1e-12);
});

// ── presets (SPEC.md §4) ──

test('presets: the ids SPEC.md §4 lists, each already on its grid', () => {
  assert.deepEqual(L.presets.map((p) => p.id), ['handheld', 'band', 'base', 'satellite', 'dishes']);
  for (const p of L.presets) assert.deepEqual(L.norm(Object.assign({}, L.defaults, p.params)), Object.assign({}, L.defaults, p.params), p.id);
});

test('presets: each shows what SPEC.md §4 says (Python numbers)', () => {
  let s = preset('handheld');
  near(s.path, 95.68, 0.005); near(s.prx, -58.68, 0.005); near(s.uv, 260.45, 0.01); near(s.margin, 61.32, 0.005);
  near(s.dMax, 3683.3, 0.1); near(s.dEdge, 11647.8, 0.1); assert.equal(s.status, 'works');
  assert.deepEqual(preset('handheld').p, S({}).p, 'the defaults are the handheld preset');
  s = preset('band');
  near(s.path, 120.05, 0.005); near(s.path - preset("handheld").path, 24.38, 0.005); near(s.prx, -83.05, 0.005);
  near(s.margin, 36.95, 0.005); near(s.dMax, 222.5, 0.1); near(s.aEff, 0.001242, 1e-6); assert.equal(s.status, 'works');
  near(s.spread, preset('handheld').spread, 1e-12, 'all of the difference is the catching area');
  s = preset('base');
  near(s.ltx, 5.07, 0.005); near(s.eirp, 51.93, 0.005); near(s.path, 113.18, 0.005); near(s.pol, 3.01, 0.005);
  near(s.prx, -64.26, 0.005); near(s.margin, 55.74, 0.005); near(s.dMax, 4843.8, 0.1); assert.equal(s.status, 'works');
  s = preset('satellite');
  near(s.path, 141.70, 0.005); near(s.prx, -117.71, 0.005); near(s.uv, 0.291, 0.001); near(s.margin, 2.29, 0.005);
  near(s.dMax, 823.6, 0.1); near(s.dEdge, 2604.5, 0.1); assert.equal(s.status, 'fading');
  const yagi = L.initial(Object.assign({}, s.p, { gr: 10 }));
  near(yagi.margin, 12.29, 0.005); assert.equal(yagi.status, 'works');
  s = preset('dishes');
  near(s.gt, 20.06, 0.005); near(s.gr, 20.06, 0.005); near(s.path, 134.70, 0.005); near(s.prx, -65.61, 0.005);
  near(s.margin, 54.39, 0.005); assert.equal(s.status, 'works'); assert.equal(s.small, false); assert.equal(s.near, false);
  const hi = L.initial(Object.assign({}, s.p, { f: 10368 }));
  near(hi.path - s.path, 18.06, 0.005); near(hi.gt - s.gt, 18.06, 0.005); near(hi.ltx, 1.58, 0.005);
  near(hi.prx, -49.67, 0.005); near(hi.prx - s.prx, 15.94, 0.005);
  const lo = L.initial(Object.assign({}, s.p, { f: 145 }));
  near(lo.prx, -84.17, 0.005); assert.equal(lo.small, true);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset, the defaults, crossed, and a sweep', () => {
  for (const pr of [{ params: {} }, { params: { psi: 90 } }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  for (const f of L.FREQS) {
    for (let dk = -10; dk <= 56; dk += 11) {
      for (const dish of [false, true]) {
        const s = S({ f, dk, dish, lt: dk % 7, psi: (dk + 10) % 90 });
        assert.deepEqual(JSON.parse(JSON.stringify(s)), s, `${f} ${dk} ${dish}`);
        for (const k of ['prx', 'margin', 'left', 'dMax', 'dEdge', 'path', 'eirp', 'aEff']) assert.ok(Number.isFinite(s[k]), `${f} ${dk} ${dish}: ${k}`);
      }
    }
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ ptx: 47, gt: 10, lt: 30, f: 435, dk: 14, psi: 45 });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a name and hint in both languages', () => {
  for (const pr of L.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k}`);
    for (const key of ['preset_' + pr.id, 'preset_' + pr.id + 'Hint']) assert.ok(strings.hr[key] && strings.en[key], key);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
});
