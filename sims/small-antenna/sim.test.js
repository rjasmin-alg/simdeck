// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for small-antenna (SPEC.md). Run: node --test sims/small-antenna/
// Tie-breaks first, then one test per rule, then the modules' own rules, then the presets, then the generic block.
// Expected numbers come from an independent scipy check (the self impedance by Balanis 8-60 with scipy's Si and Ci, the
// radiation resistance also by quad of the far field, the wire loss by quad of ∫I², the band edges by brentq on the SWR,
// Q by a central difference; SPEC.md §4).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const LA = require('./loaded-antenna.js');
const MI = require('./mutual-impedance.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const rel = (a, b, r, msg) => assert.ok(Math.abs(a - b) <= r * Math.abs(b), `${msg || ''} ${a} vs ${b} (±${r * 100} %)`);
const LENS = [];
for (let i = 5; i <= 48; i++) LENS.push(i / 100);

// ── tie-breaks (SPEC.md §2) ──

test('tie-break 1: len is clamped to 0.05 … 0.48 and put on the 0.01 grid; a non-number gives 0.10', () => {
  assert.equal(L.norm({ len: 0 }).len, 0.05);
  assert.equal(L.norm({ len: -1 }).len, 0.05);
  assert.equal(L.norm({ len: 0.5 }).len, 0.48);
  assert.equal(L.norm({ len: 3 }).len, 0.48);
  assert.equal(L.norm({ len: 0.1 + 0.2 }).len, 0.3);
  assert.equal(L.norm({ len: 0.105 }).len, 0.11, 'half a step rounds up');
  assert.equal(L.norm({ len: 0.1049 }).len, 0.1);
  assert.equal(L.norm({ len: '0.25' }).len, 0.25);
  for (const bad of ['x', null, undefined, '', NaN, Infinity, -Infinity]) assert.equal(L.norm({ len: bad }).len, 0.1, String(bad));
  for (const v of LENS) {
    assert.equal(L.norm({ len: v + 1e-7 }).len, v, `${v} from above`);
    assert.equal(L.norm({ len: v - 1e-7 }).len, v, `${v} from below`);
    assert.ok(String(L.norm({ len: v }).len).length <= 4, `${v}: no 0.35000000000000003`);
  }
});

test('tie-break 2: qc is one of 50, 100, 200, 400, ideal (a numeric string counts); anything else is 200; coil is a boolean', () => {
  for (const q of [50, 100, 200, 400, 'ideal']) assert.equal(L.norm({ qc: q }).qc, q);
  assert.equal(L.norm({ qc: '400' }).qc, 400);
  assert.equal(L.norm({ qc: '50' }).qc, 50);
  for (const bad of [0, 150, 'x', null, undefined, '', 'Ideal', Infinity, 1000]) assert.equal(L.norm({ qc: bad }).qc, 200, String(bad));
  for (const v of [true, 'true', '1', 1]) assert.equal(L.norm({ coil: v }).coil, true, String(v));
  for (const v of [false, 'false', '0', 0, 'x', null, '']) assert.equal(L.norm({ coil: v }).coil, false, String(v));
  assert.equal(L.norm({}).coil, true, 'missing: the default, on');
});

test('tie-break 3: time wraps into [0, 360) on the 5° grid; a non-number gives 0', () => {
  assert.equal(L.norm({ t: 360 }).t, 0);
  assert.equal(L.norm({ t: -5 }).t, 355);
  assert.equal(L.norm({ t: 725 }).t, 5);
  assert.equal(L.norm({ t: 47 }).t, 45);
  assert.equal(L.norm({ t: 48 }).t, 50);
  for (const bad of ['x', null, undefined, '', NaN]) assert.equal(L.norm({ t: bad }).t, 0, String(bad));
  assert.ok(!Object.is(L.norm({ t: -0.1 }).t, -0));
  assert.deepEqual(S({ t: 360 }), S({ t: 0 }));
});

test('tie-break 4: the coil is never negative; the antenna is capacitive over the whole slider', () => {
  for (const len of LENS) {
    const s = S({ len });
    assert.ok(s.xAnt < 0, `${len}: X ${s.xAnt}`);
    assert.ok(s.xCoil > 0, `${len}: X_L ${s.xCoil}`);
    near(s.xCoil, -s.xAnt, 1e-9, `${len}: X_L = −X`);
  }
  // past resonance (not on the slider) the coil would have to be a capacitor: it is zero, not negative
  const past = LA.system({ len: 0.5, radiusM: L.RADIUS_M, f0: L.F0, coil: true, qc: 200 });
  assert.ok(past.xAnt > 0);
  assert.equal(past.xCoil, 0); assert.equal(past.rCoil, 0);
});

test('tie-break 5: without the coil there is no coil loss and no tuning; Q, bandwidth and edges are null', () => {
  for (const len of [0.05, 0.1, 0.25, 0.48]) {
    const s = S({ len, coil: false });
    assert.equal(s.xCoil, 0); assert.equal(s.rCoil, 0); assert.equal(s.lCoil, 0);
    near(s.rIn, s.rRad + s.rWire, 1e-12, `${len}: R_in`);
    for (const k of ['q', 'qRad', 'bw', 'fLo', 'fHi', 'k', 'perRad', 'perHeat']) assert.equal(s[k], null, `${len}: ${k}`);
    assert.equal(s.pCoil, 0);
    assert.equal(s.share, 0); assert.equal(s.wholeBand, false); assert.equal(s.lossless, false);
  }
  // the coil Q does not matter without the coil
  assert.deepEqual(Object.assign(S({ coil: false, qc: 50 }), { qc: 0 }), Object.assign(S({ coil: false, qc: 400 }), { qc: 0 }));
});

test('tie-break 6: an SWR whose |Γ| is within 1e-12 of 1 is null; every finite one is kept', () => {
  assert.equal(LA.swr([1, 1e14], 1).swr, null);
  assert.equal(LA.swr([1, 1e14], 1).gamma2, 1);
  assert.equal(LA.swr([1, 0], 1).swr, 1);
  assert.equal(LA.swr([1, 0], 1).gamma2, 0);
  near(LA.swr([2, 0], 1).swr, 2, 1e-12);
  near(LA.swr([0.5, 0], 1).swr, 2, 1e-12);
  const bare = S({ coil: false });
  assert.ok(bare.swr0 > 1e6 && Number.isFinite(bare.swr0), `${bare.swr0}`);
  assert.equal(L.swrCurve(P({ coil: false })).filter((q) => q.swr === null).length, 0);
});

test('tie-break 7: band edges search outward from f0; not found within f0/2, or SWR > 2 at f0, gives null', () => {
  const flat = { f0: 1e6, rIn: 1, z: () => [1, 0] };            // matched everywhere: no edge
  assert.deepEqual(LA.bandEdges(flat, 2), { lo: null, hi: null, bw: null });
  const off = { f0: 1e6, rIn: 1, z: () => [5, 0] };             // SWR 5 at f0
  assert.deepEqual(LA.bandEdges(off, 2), { lo: null, hi: null, bw: null });
  const lin = { f0: 1e6, rIn: 1, z: (f) => [1 + Math.abs(f - 1e6) / 1e3, 0] };   // SWR = 1 + |Δf|/1 kHz: edges at ±1 kHz
  const e = LA.bandEdges(lin, 2);
  near(e.lo, 1e6 - 1e3, 2e-3); near(e.hi, 1e6 + 1e3, 2e-3); near(e.bw, 2e3, 4e-3);
  const onesided = { f0: 1e6, rIn: 1, z: (f) => [f > 1e6 ? 1 + (f - 1e6) / 1e3 : 1, 0] };
  const o = LA.bandEdges(onesided, 2);
  assert.equal(o.lo, null); near(o.hi, 1e6 + 1e3, 2e-3); assert.equal(o.bw, null);
  // every length on the slider has both edges, for every coil
  for (const len of LENS) for (const qc of L.QCS) assert.ok(L.analyse(len, true, qc).bw > 0, `${len} ${qc}`);
});

test('tie-break 6: |Γ| just short of the 1e-12 margin keeps a finite SWR', () => {
  const w = LA.swr([1, 1e5], 1).swr;
  assert.ok(Number.isFinite(w)); rel(w, 9.99999917e9, 1e-6);
});

test('tie-break 7: the search treats a null SWR as over; starts at f0·1e-5; tries f0/2 itself, not beyond', () => {
  const f0 = 1e6;
  // ∞ outside ±1 kHz: the edges are there
  near(LA.bandEdges({ f0, rIn: 1, z: (f) => [1, Math.abs(f - f0) > 1e3 ? 1e14 : 0] }, 2).bw, 2000, 4e-3);
  // a bump 100 … 200 Hz out: the first offsets (10, 20, 40, 80, 160 Hz) find it, the edges are at ±100 Hz
  const bump = (f) => { const d = Math.abs(f - f0); return d > 100 && d < 200 ? [5, 0] : [1, 0]; };
  near(LA.bandEdges({ f0, rIn: 1, z: bump }, 2).bw, 200, 4e-3);
  // SWR = 1 + |Δf|/(c·f0): edges at ±c·f0; found for c = 0.3 and 0.4 (≤ f0/2), not for 0.6
  for (const c of [0.3, 0.4]) near(LA.bandEdges({ f0, rIn: 1, z: (f) => [1 + Math.abs(f - f0) / (c * f0), 0] }, 2).bw, 2 * c * f0, 0.01, `c ${c}`);
  assert.equal(LA.bandEdges({ f0, rIn: 1, z: (f) => [1 + Math.abs(f - f0) / (0.6 * f0), 0] }, 2).bw, null);
});

test('Q: the central difference uses a step of f0·1e-6', () => {
  const sys = { f0: 1e6, rIn: 1, z: (f) => { const x = (f - 1e6) / 1e3; return [1, x * x * x + x]; } };
  near(LA.qOf(sys), 500.0005, 1e-6);
});

// ── rules (SPEC.md §4) ──

test('rule 1: radiation resistance at the feed (Balanis 8-60a over sin²πL); short limit 197·(L/λ)²', () => {
  const table = [[0.05, 0.4948], [0.1, 1.9989], [0.15, 4.5736], [0.2, 8.3281], [0.25, 13.4312], [0.3, 20.1306], [0.48, 64.9370]];
  for (const [len, r] of table) near(S({ len }).rRad, r, 2e-4, `${len}`);
  near(LA.dipoleImpedance(0.5, 1e-5)[0], 73.079, 1e-3, 'λ/2: 73 Ω as in dipole-length');
  rel(S({ len: 0.05 }).rRad, 20 * Math.PI ** 2 * 0.05 ** 2, 0.005, 'short limit');
  // the radius does not change R
  near(LA.dipoleImpedance(0.1, 1e-3)[0], LA.dipoleImpedance(0.1, 1e-5)[0], 1e-9);
});

test('rule 2: the reactance is capacitive, ~1/L, crosses zero at 0.48716 λ; the short-dipole formula agrees', () => {
  const table = [[0.05, -4511.78], [0.1, -2451.84], [0.15, -1655.01], [0.2, -1203.50], [0.25, -895.53], [0.3, -659.48], [0.48, -23.58]];
  for (const [len, x] of table) near(S({ len }).xAnt, x, 0.01, `${len}`);
  const a = L.RADIUS_M / L.LAMBDA;
  const X = (len) => LA.dipoleImpedance(len, a)[1];
  assert.ok(X(0.4871) < 0 && X(0.4872) > 0, 'resonant between 0.4871 and 0.4872 λ');
  near(LA.dipoleImpedance(0.48716460, a)[0], 67.749, 1e-3, 'R at resonance');
  for (let i = 1; i < LENS.length; i++) assert.ok(S({ len: LENS[i] }).xAnt > S({ len: LENS[i - 1] }).xAnt, `${LENS[i]}: |X| falls`);
  const short = (len) => -120 * (Math.log(len * L.LAMBDA / (2 * L.RADIUS_M)) - 1) / Math.tan(Math.PI * len);
  for (const len of [0.05, 0.1, 0.15]) rel(S({ len }).xAnt, short(len), 0.005, `${len} within 0.5 %`);
  rel(S({ len: 0.2 }).xAnt, short(0.2), 0.01, '0.2 within 1 %');
});

test('rule 3: the wire\'s copper loss at the feed', () => {
  for (const [len, r] of [[0.05, 0.0781], [0.1, 0.1578], [0.25, 0.4244], [0.48, 1.0789]]) near(S({ len }).rWire, r, 2e-4, `${len}`);
  near(LA.surfaceResistance(7.1e6), 6.9518e-4, 1e-8, 'R_s of copper at 7.1 MHz');
  // the closed form against a numerical ∫I² ds
  const a = L.RADIUS_M / L.LAMBDA, rs = LA.surfaceResistance(L.F0);
  for (const len of [0.07, 0.23, 0.41]) {
    let sum = 0; const n = 4000;
    for (let i = 0; i < n; i++) { const s = -len / 2 + len * (i + 0.5) / n; sum += Math.sin(2 * Math.PI * (len / 2 - Math.abs(s))) ** 2 * len / n; }
    rel(LA.wireLoss(len, a, rs), rs / (2 * Math.PI * a) * sum / Math.sin(Math.PI * len) ** 2, 1e-5, `${len}`);
  }
});

test('rule 4: the coil cancels the reactance; its inductance and its loss X_L/Q', () => {
  near(S({ len: 0.1 }).lCoil, 54.961, 1e-3);
  near(S({ len: 0.05 }).lCoil, 101.137, 1e-3);
  near(S({ len: 0.48 }).lCoil, 0.5287, 1e-4);
  for (const [qc, rc] of [[50, 49.037], [100, 24.518], [200, 12.259], [400, 6.130], ['ideal', 0]]) near(S({ len: 0.1, qc }).rCoil, rc, 1e-3, String(qc));
  assert.equal(S({ qc: 'ideal' }).lossless, true);
  assert.equal(S({ qc: 400 }).lossless, false);
  assert.equal(S({ qc: 'ideal', coil: false }).lossless, false);
  // at f0 the reactance is exactly cancelled: SWR 1 with the coil on
  for (const len of LENS) assert.equal(S({ len }).swr0, 1, `${len}`);
});

test('rule 5: efficiency R_rad / (R_rad + R_wire + R_coil)', () => {
  const table = [
    [0.05, 200, 0.02139], [0.05, 'ideal', 0.86364], [0.1, 50, 0.03905], [0.1, 100, 0.07493], [0.1, 200, 0.13866],
    [0.1, 400, 0.24122], [0.1, 'ideal', 0.92683], [0.25, 200, 0.73261], [0.48, 200, 0.98190]
  ];
  for (const [len, qc, eta] of table) near(S({ len, qc }).eta, eta, 2e-5, `${len} ${qc}`);
  for (const len of LENS) { const s = S({ len }); near(s.eta, s.rRad / (s.rRad + s.rWire + s.rCoil), 1e-12); }
  // falls fast as the antenna shrinks, with any one coil
  for (const qc of L.QCS) for (let i = 1; i < LENS.length; i++) assert.ok(S({ len: LENS[i], qc }).eta > S({ len: LENS[i - 1], qc }).eta, `${qc} ${LENS[i]}`);
  // without the coil the same η applies to what gets in
  near(S({ coil: false }).eta, 0.92683, 2e-5);
});

test('rule 6: Q from the impedance (Yaghjian & Best); per period 2πη/Q radiated, 2π(1 − η)/Q heated; Q_rad = Q/η', () => {
  const table = [
    [0.05, 200, 196.76], [0.05, 'ideal', 7944.8], [0.1, 50, 49.63], [0.1, 100, 95.26], [0.1, 200, 176.26],
    [0.1, 400, 306.65], [0.1, 'ideal', 1178.2], [0.25, 200, 63.78], [0.48, 200, 12.24]
  ];
  for (const [len, qc, q] of table) rel(S({ len, qc }).q, q, 5e-4, `${len} ${qc}`);
  const s = S({});
  near(s.perRad, 2 * Math.PI * s.eta / s.q, 1e-15); near(s.perHeat, 2 * Math.PI * (1 - s.eta) / s.q, 1e-15);
  near(s.perRad, 0.00494, 1e-5); near(s.perHeat, 0.03070, 1e-5);
  for (const len of [0.05, 0.1, 0.25, 0.48]) {
    const rads = L.QCS.map((qc) => S({ len, qc }).qRad);
    for (const r of rads) rel(r, rads[0], 2e-3, `${len}: Q_rad does not depend on the coil`);
  }
  rel(S({ len: 0.1 }).qRad, 1271.2, 1e-3);
});

test('rule 7: the SWR ≤ 2 bandwidth matches brentq and 0.7071·f0/Q', () => {
  const table = [
    [0.05, 200, 25.515], [0.05, 'ideal', 0.632], [0.1, 50, 101.150], [0.1, 100, 52.705], [0.1, 200, 28.483],
    [0.1, 400, 16.372], [0.1, 'ideal', 4.261], [0.25, 200, 78.722], [0.48, 200, 410.858]
  ];
  for (const [len, qc, bw] of table) near(S({ len, qc }).bw / 1000, bw, Math.max(1e-3, bw * 2e-4), `${len} ${qc}`);
  for (const len of LENS) for (const qc of L.QCS) {
    const a = L.analyse(len, true, qc);
    rel(a.bw, Math.SQRT1_2 * L.F0 / a.q, 2e-3, `${len} ${qc}`);
    assert.ok(a.fLo < L.F0 && a.fHi > L.F0);
  }
  const s = S({});
  near(s.fLo, 7085780, 20); near(s.fHi, 7114260, 20);
  near(s.share, 28483 / 200000, 1e-4, 'share of the 40 m band');
  assert.equal(S({ len: 0.48 }).wholeBand, true); assert.equal(S({ len: 0.48 }).share, 1);
  assert.equal(S({ len: 0.3, qc: 50 }).wholeBand, false, '168 kHz: not the whole band');
});

test('rule 8: no free lunch: η × bandwidth is fixed by the length, whatever the coil', () => {
  for (const [len, k] of [[0.05, 0.546], [0.1, 3.949], [0.25, 57.67], [0.48, 403.4]]) {
    for (const qc of L.QCS) rel(S({ len, qc }).k / 1000, k, 1e-3, `${len} ${qc}`);
  }
  for (const len of LENS) {
    const ks = L.QCS.map((qc) => L.analyse(len, true, qc).k);
    for (const k of ks) rel(k, ks[0], 1e-3, `${len}`);
  }
  // a better coil: more efficiency, less bandwidth
  const pts = L.coilPoints(0.1);
  for (let i = 1; i < pts.length; i++) { assert.ok(pts[i].eta > pts[i - 1].eta); assert.ok(pts[i].bw < pts[i - 1].bw); }
  assert.deepEqual(L.refLines().map((r) => r.len), [0.05, 0.1, 0.25, 0.48]);
  rel(L.refLines()[1].k / 1000, 3.949, 1e-3);
});

test('rule 9: without the coil the SWR is huge and almost nothing gets in', () => {
  rel(S({ coil: false }).swr0, 1292483, 1e-4);
  rel(S({ len: 0.25, coil: false }).swr0, 4179.4, 1e-4);
  rel(S({ coil: false }).pIn / 100, 3.0948e-6, 1e-3);
  rel(S({ len: 0.25, coil: false }).pIn / 100, 9.566e-4, 1e-3);
  near(S({ len: 0.48, coil: false }).swr0, 1.43, 0.01, 'near full size it hardly needs a coil');
});

test('rule 10: Chu\'s limit 1/(ka)³ + 1/(ka), ka = πL; the radiation Q is above it on the whole slider', () => {
  near(LA.chuQ(1), 2, 1e-15);
  near(S({ len: 0.1 }).qChu, 35.435, 1e-3);
  near(S({ len: 0.05 }).qChu, 264.378, 1e-3);
  near(S({ len: 0.48 }).qChu, 0.9548, 1e-4);
  for (const len of LENS) for (const qc of L.QCS) {
    const a = L.analyse(len, true, qc);
    assert.ok(a.qRad > a.qChu, `${len} ${qc}`);
    assert.ok(a.k < a.kChu, `${len} ${qc}: η·BW below Chu's line`);
  }
  near(S({}).kChu, Math.SQRT1_2 * L.F0 / S({}).qChu, 1e-6);
});

test('rule 11: where the 100 W go: radiated, coil, wire and reflected add to 100', () => {
  for (const p of [{}, { qc: 50 }, { qc: 'ideal' }, { coil: false }, { len: 0.48 }, { len: 0.05, coil: false }]) {
    const s = S(p);
    near(s.pRad + s.pCoil + s.pWire + s.pRef, 100, 1e-9, JSON.stringify(p));
    near(s.pRad, s.pIn * s.eta, 1e-12);
  }
  const s = S({});
  near(s.pRad, 13.866, 1e-3); near(s.pCoil, 85.040, 1e-3); near(s.pWire, 1.0946, 1e-3); assert.equal(s.pRef, 0);
  near(S({ coil: false }).pIn * 1000, 0.30948, 1e-4, 'mW');
});

test('rule 12: time: cos ωt current, sin ωt charge, the stored energy swings between coil and wire; nothing else moves', () => {
  assert.equal(S({ t: 0 }).cosT, 1); assert.equal(S({ t: 0 }).sinT, 0);
  assert.equal(S({ t: 90 }).cosT, 0); assert.equal(S({ t: 90 }).sinT, 1);
  assert.equal(S({ t: 270 }).sinT, -1);
  for (const t of [0, 30, 45, 135, 200, 355]) {
    const s = S({ t });
    near(s.wMag + s.wEl, 1, 1e-12); near(s.wMag, Math.cos(t * Math.PI / 180) ** 2, 1e-12);
  }
  const a = S({ t: 0 }), b = S({ t: 135 });
  for (const k of Object.keys(a)) if (!['t', 'cosT', 'sinT', 'wMag', 'wEl'].includes(k)) assert.deepEqual(a[k], b[k], k);
});

test('rule 13: lengths in metres at 7.1 MHz', () => {
  near(L.LAMBDA, 42.2243, 1e-4);
  near(S({ len: 0.1 }).metres, 4.2224, 1e-4);
  near(S({ len: 0.48 }).metres, 20.2677, 1e-4);
});

test('rule 14: the SWR curve spans the band, is sorted, and resolves the narrowest notch', () => {
  const c = L.swrCurve(P({ len: 0.05, qc: 'ideal' }));
  assert.equal(c[0].f, 7.0e6); assert.equal(c[c.length - 1].f, 7.2e6);
  for (let i = 1; i < c.length; i++) assert.ok(c[i].f >= c[i - 1].f);
  assert.equal(c.length, 401 + 121);
  const under = c.filter((q) => q.swr !== null && q.swr <= 2);
  assert.ok(under.length >= 15, `${under.length} samples inside a 0.63 kHz notch`);
  assert.equal(L.swrCurve(P({ coil: false })).length, 401, 'no notch without the coil');
  // the edges of the band in the table
  const s = c.find((q) => q.f === 7.0e6);
  rel(s.swr, 52067, 2e-3);
  rel(L.swrCurve(P({})).find((q) => q.f === 7.2e6).swr, 26.18, 2e-3);
  rel(L.swrCurve(P({ len: 0.48 })).find((q) => q.f === 7.0e6).swr, 1.42, 5e-3);
});

test('the coil\'s path over every length runs the slider; η falls with length, the bandwidth stays near 0.71·f0/Q_c', () => {
  const p = L.lengthPath(200);
  assert.equal(p.length, 44); assert.equal(p[0].len, 0.05); assert.equal(p[43].len, 0.48);
  for (let i = 1; i < p.length; i++) assert.ok(p[i].eta > p[i - 1].eta);
  rel(p[5].bw, S({ len: 0.1 }).bw, 1e-9);
  rel(p[0].bw, Math.SQRT1_2 * L.F0 / 200, 0.02, 'a tiny antenna: the coil sets Q');
});

test('the band 200 kHz wide but off centre is not the whole band', () => {
  const s = S({ len: 0.36, qc: 100 });
  assert.ok(s.bw > 200e3, `${s.bw}`);
  assert.equal(s.wholeBand, false); assert.ok(s.share < 1);
});

test('near resonance: |X| < R_rad only at 0.47 and 0.48 λ', () => {
  for (const len of LENS) assert.equal(S({ len }).nearRes, len >= 0.47, String(len));
});

test('without the coil: the lowest SWR across the band, under 2 only near resonance', () => {
  near(S({ len: 0.47, coil: false }).swr0, 2.405, 0.002);
  near(S({ len: 0.47, coil: false }).bandMinSwr, 1.715, 0.005, 'at 7.2 MHz');
  assert.ok(S({ coil: false }).bandMinSwr > 1e6);
  assert.equal(S({}).bandMinSwr, null, 'tuned: not computed');
  for (const len of LENS) {
    const s = S({ len, coil: false });
    assert.ok(s.bandMinSwr <= s.swr0 + 1e-9, String(len));
    assert.equal(s.bandMinSwr <= 2, len >= 0.47, String(len));
  }
});

test('the coil\'s share of the magnetic energy is X_L/(Q·R_in): most of it when short, little at full size', () => {
  near(S({}).coilShare, 0.965, 0.005);
  near(S({ len: 0.25 }).coilShare, 0.766, 0.005);
  assert.ok(S({ len: 0.48 }).coilShare < 0.05);
  assert.equal(S({ coil: false }).coilShare, null);
  for (const len of LENS) { const s = S({ len }); assert.ok(s.coilShare > 0 && s.coilShare <= 1, String(len)); }
});

test('the SWR curve: the dense points span f0 ± 3·BW, and none are added without the coil', () => {
  const c = L.swrCurve(P({ len: 0.05, qc: 'ideal' }));
  const off = c.filter((q) => Math.abs(Math.round((q.f - 7e6) / 500) * 500 + 7e6 - q.f) > 1e-6);
  const bw = S({ len: 0.05, qc: 'ideal' }).bw;
  near(Math.min(...off.map((q) => q.f)), 7.1e6 - 3 * bw, 1); near(Math.max(...off.map((q) => q.f)), 7.1e6 + 3 * bw, 1);
  near(3 * bw, 1895.76, 0.05);
  assert.equal(L.swrCurve(P({ len: 0.48, coil: false })).length, 401);
});

// ── the modules' own rules (promotable; mutual-impedance.js copied from yagi) ──

test('module: self impedance of λ/2 is 73.08 + j42.51 Ω at the crest whatever the radius; Si and Ci', () => {
  const z = MI.selfImpedance(0.5, 0.0025);
  near(z[0], 73.079, 1e-3); near(z[1], 42.515, 1e-3);
  near(MI.selfImpedance(0.5, 1e-5)[1], 42.515, 1e-3);
  near(MI.Si(1), 0.946083070367183, 1e-13); near(MI.Ci(1), 0.337403922900968, 1e-13);
  near(MI.Si(9), 1.665040075829602, 1e-12); near(MI.Ci(9), 0.055347531333133, 1e-12);
});

test('module: system() at f0 is the sum of its parts; z(f) scales the length, the radius and the coil', () => {
  const sys = LA.system({ len: 0.1, radiusM: 1e-3, f0: 7.1e6, coil: true, qc: 200 });
  const z = sys.z(7.1e6);
  near(z[0], sys.rIn, 1e-12); near(z[1], 0, 1e-9);
  const f = 7.3e6, za = LA.dipoleImpedance(0.1 * f / 7.1e6, 1e-3 * f / LA.C0);
  const zf = sys.z(f);
  near(zf[0], za[0] + sys.rWire + sys.rCoil, 1e-12); near(zf[1], za[1] + sys.xCoil * f / 7.1e6, 1e-9);
  near(sys.lCoil * 1e6, 54.961, 1e-3);
  assert.equal(LA.system({ len: 0.1, radiusM: 1e-3, f0: 7.1e6, coil: true, qc: 0 }).rCoil, 0, 'qc 0: lossless');
  assert.equal(LA.system({ len: 0.1, radiusM: 1e-3, f0: 7.1e6, coil: true, qc: null }).rCoil, 0, 'qc null: lossless');
  rel(LA.qOf(sys), 176.26, 5e-4);
});

test('module: the matched series circuit bandwidth (s − 1)/(Q·√s) for other SWR limits', () => {
  const sys = LA.system({ len: 0.1, radiusM: 1e-3, f0: 7.1e6, coil: true, qc: 100 });
  const q = LA.qOf(sys);
  for (const s of [1.5, 2, 3]) rel(LA.bandEdges(sys, s).bw, 7.1e6 * (s - 1) / (q * Math.sqrt(s)), 3e-3, `s ${s}`);
});

// ── presets (SPEC.md §6) ──

test('presets: the params SPEC.md §6 lists', () => {
  assert.deepEqual(L.presets.map((p) => p.id), ['full', 'bare', 'coil', 'half', 'lossy', 'ideal']);
  assert.deepEqual(L.presets.map((p) => [p.params.len, p.params.coil, p.params.qc]),
    [[0.48, true, 200], [0.1, false, 200], [0.1, true, 200], [0.25, true, 200], [0.1, true, 50], [0.1, true, 'ideal']]);
  for (const p of L.presets) assert.equal(p.params.t, 0);
});

test('presets: each shows what SPEC.md §6 says', () => {
  const st = (id) => S(L.presets.find((p) => p.id === id).params);
  let s = st('full');
  near(s.rRad, 64.94, 0.01); near(s.xAnt, -23.58, 0.01); near(s.lCoil, 0.53, 0.005); near(s.eta, 0.982, 5e-4);
  near(s.q, 12.24, 0.01); near(s.bw / 1000, 410.9, 0.1); assert.equal(s.wholeBand, true);
  assert.ok(L.swrCurve(P({ len: 0.48 })).every((q) => q.swr < 1.5), 'the whole band under SWR 1.5');
  s = st('bare');
  near(s.rRad, 2.0, 0.005); near(s.xAnt, -2451.8, 0.1); rel(s.swr0, 1.3e6, 0.01); near(s.pIn * 1000, 0.31, 0.005);
  s = st('coil');
  near(s.lCoil, 55.0, 0.05); near(s.rCoil, 12.26, 0.01); near(s.eta, 0.139, 5e-4); near(s.q, 176, 0.5); near(s.bw / 1000, 28.5, 0.05);
  s = st('half');
  near(s.rRad, 13.43, 0.01); near(s.eta, 0.733, 5e-4); near(s.bw / 1000, 78.7, 0.05);
  s = st('lossy');
  near(s.rCoil, 49.04, 0.01); near(s.eta, 0.039, 5e-4); near(s.bw / 1000, 101.15, 0.01);
  s = st('ideal');
  near(s.eta, 0.927, 5e-4); near(s.q, 1178, 0.5); near(s.bw / 1000, 4.26, 0.005); assert.equal(s.rCoil, 0);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset, the defaults and every length, coil and Q', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  for (const len of LENS.filter((_, i) => i % 5 === 0)) for (const qc of L.QCS) for (const coil of [true, false]) {
    const s = S({ len, qc, coil });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, `${len} ${qc} ${coil}`);
    for (const k of ['rRad', 'xAnt', 'rWire', 'rIn', 'eta', 'qChu', 'pIn', 'pRad', 'metres', 'swr0']) assert.ok(Number.isFinite(s[k]), `${len}: ${k}`);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ len: 0.17, qc: 100, t: 75 });
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
    assert.deepEqual(L.norm(pr.params), pr.params, `${pr.id}: already normal`);
    for (const key of ['preset_' + pr.id, 'preset_' + pr.id + 'Hint']) assert.ok(strings.hr[key] && strings.en[key], key);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.id, 'small-antenna');
});

test('page constants SPEC.md names: slider 0.05 … 0.48 by 0.01, 7.1 MHz, 2 mm copper, 100 W, time 5° and 15°', () => {
  assert.equal(L.LEN_MIN, 0.05); assert.equal(L.LEN_MAX, 0.48); assert.equal(L.LEN_STEP, 0.01);
  assert.equal(L.F0, 7.1e6); assert.equal(L.RADIUS_M, 1e-3); assert.equal(L.P_TX, 100); assert.equal(L.SWR_LIMIT, 2);
  assert.deepEqual(L.BAND, [7.0e6, 7.2e6]); assert.equal(LA.SIGMA_CU, 5.8e7);
  assert.equal(L.T_STEP, 5); assert.equal(L.KEY_STEP, 15);
  assert.deepEqual(L.defaults, { len: 0.1, coil: true, qc: 200, t: 0 });
});
