// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for polarization-mismatch (SPEC.md). Run: node --test sims/polarization-mismatch/
// Tie-breaks first, then one test per rule, then the module (copied from sims/polarization with its own tests, plus the
// added functions), then the presets and the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const PZ = require('./polarization.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const rad = (d) => d * Math.PI / 180;
const ROTS = [0, 5, 30, 45, 60, 85, 90, 95, 120, 135, 150, 175, 180];
const LINEAR = ['v', 'h', 's', 'loop'];

// Independent of the model: 2-D Jones vectors [[re, im], [re, im]] in the view, the Poincaré sphere and the
// signed-axial-ratio formula (SPEC.md §2).
function stokes2(e) {
  const [x, y] = e, xx = x[0] ** 2 + x[1] ** 2, yy = y[0] ** 2 + y[1] ** 2, n = xx + yy;
  return [(xx - yy) / n, 2 * (x[0] * y[0] + x[1] * y[1]) / n, 2 * (x[0] * y[1] - x[1] * y[0]) / n];
}
const poincare = (w, r) => { const a = stokes2(w), b = stokes2(r); return (1 + a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / 2; };
const stutzman = (rw, ra, dt) => 0.5 + (4 * rw * ra + (1 - rw * rw) * (1 - ra * ra) * Math.cos(2 * rad(dt))) / (2 * (1 + rw * rw) * (1 + ra * ra));
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ── tie-breaks (SPEC.md §1) ──

test('tie-break 1: numbers clamped, non-numbers the default; unknown antenna v, unknown path direct; 0 and 180 both allowed', () => {
  assert.deepEqual(L.norm({ txRot: -10, rxRot: 400, amp: 150, ph: -5 }), Object.assign({}, L.defaults, { txRot: 0, rxRot: 180, amp: 100, ph: 0 }));
  assert.deepEqual(L.norm({ txRot: 'x', rxRot: null, amp: undefined, ph: true, om: 'y', t: '' }), L.defaults);
  assert.equal(L.norm({ tx: 'X' }).tx, 'v'); assert.equal(L.norm({ rx: 'R' }).rx, 'v'); assert.equal(L.norm({ path: 'sky' }).path, 'direct');
  for (const k of L.TYPES) assert.equal(L.norm({ tx: k, rx: k }).rx, k);
  assert.equal(L.norm({ txRot: 180 }).txRot, 180);
  assert.equal(S({ rxRot: 180, rx: 'h' }).plf, S({ rxRot: 0, rx: 'h' }).plf);
  assert.deepEqual(S({ txRot: 180 }).arrPol, S({ txRot: 0 }).arrPol);
});

test('tie-break 2: Ω and time wrap into [0, 360)', () => {
  assert.equal(L.norm({ om: 360 }).om, 0); assert.equal(L.norm({ om: -5 }).om, 355); assert.equal(L.norm({ om: 725 }).om, 5);
  assert.equal(L.norm({ t: 360 }).t, 0); assert.equal(L.norm({ t: -5 }).t, 355);
  assert.equal(L.norm({ om: true }).om, 0); assert.equal(L.norm({ t: false }).t, 0);
  assert.deepEqual(S({ t: 360, path: 'iono', om: 360 }), S({ t: 0, path: 'iono', om: 0 }));
});

test('tie-break 3: a line\'s tilt is in [0, 180), 180 is 0; a circle has no tilt', () => {
  assert.equal(L.line180(180), 0); assert.equal(L.line180(-30), 150); assert.equal(L.line180(359.9999999999), 0);
  assert.equal(S({ tx: 'h', txRot: 180 }).txPol.tilt, 0);
  assert.equal(S({ tx: 'v', txRot: 90 }).txPol.tilt, 0);
  assert.equal(S({ tx: 'r' }).txPol.tilt, null);
  assert.equal(S({ tx: 'v', path: 'iono', om: 90 }).arrPol.tilt, 0);
});

test('tie-break 4: classification by the Stokes s3: a line (no sense, AR null), a circle (AR 0 dB, no tilt), an ellipse between', () => {
  for (const k of LINEAR) for (const r of ROTS) {
    const d = S({ tx: k, txRot: r }).txPol;
    assert.equal(d.kind, 'lin'); assert.equal(d.sense, 0); assert.equal(d.arDb, null); assert.equal(d.ratio, 0);
  }
  for (const r of ROTS) {
    const d = S({ tx: 'r', txRot: r }).txPol, e = S({ tx: 'l', txRot: r }).txPol;
    assert.equal(d.kind, 'circ'); assert.equal(d.arDb, 0); assert.equal(d.tilt, null); assert.equal(d.sense, 1); assert.equal(e.sense, -1);
  }
  assert.equal(L.describe(L.crossed(0, 1e-8, 90, 1)).kind, 'ell', 'a hair off a line is an ellipse');
  // kind and sense agree even a hair off a line (sense from the sign of s3)
  for (const amp of [1e-7, 1e-5]) { const d = S({ tx: 'r', amp }).txPol; assert.equal(d.kind, 'ell'); assert.equal(d.sense, 1); }
  assert.equal(S({ tx: 'l', amp: 1e-7 }).txPol.sense, -1);
  const el = S({ tx: 'r', amp: 95 }).txPol;
  assert.equal(el.kind, 'ell'); assert.equal(el.sense, 1); assert.ok(el.arDb > 0 && el.ratio < 1);
});

test('tie-break 5: PLF classes in order: crossed, matched, lincirc, partial', () => {
  assert.equal(S({ tx: 'v', rx: 'h' }).kind, 'crossed');
  assert.equal(S({ tx: 'r', rx: 'l' }).kind, 'crossed');
  assert.equal(S({ tx: 'v', rx: 'v' }).kind, 'matched');
  assert.equal(S({ tx: 'r', rx: 'r' }).kind, 'matched');
  assert.equal(S({ tx: 'v', rx: 'r' }).kind, 'lincirc');
  assert.equal(S({ tx: 'r', rx: 's', rxRot: 20 }).kind, 'lincirc');
  assert.equal(S({ tx: 'v', rx: 's' }).kind, 'partial');
  assert.equal(S({ tx: 'r', amp: 50, rx: 'v' }).kind, 'partial');      // an ellipse against a line
  assert.equal(S({ tx: 'r', amp: 90, rx: 'r' }).kind, 'partial', 'PLF 0.99724 is not matched');
  assert.equal(S({ tx: 'r', amp: 90, rx: 'l' }).kind, 'partial', 'PLF 0.00276 is not crossed');
  assert.equal(L.classify(1e-13, { kind: 'lin' }, { kind: 'circ' }), 'crossed', 'crossed before lincirc');
  assert.equal(L.classify(1, { kind: 'lin' }, { kind: 'lin' }), 'matched');
  assert.equal(L.classify(0.5, { kind: 'ell' }, { kind: 'circ' }), 'partial');
});

test('tie-break 6: amp 0 or ph 0/180 make a "circular" Tx a line; amp and ph do nothing to other antennas', () => {
  assert.equal(S({ tx: 'r', amp: 0 }).txPol.kind, 'lin'); assert.equal(S({ tx: 'r', amp: 0 }).txPol.tilt, 0);
  assert.equal(S({ tx: 'r', ph: 0 }).txPol.kind, 'lin'); assert.equal(S({ tx: 'r', ph: 0 }).txPol.tilt, 45);
  assert.equal(S({ tx: 'l', ph: 180 }).txPol.kind, 'lin'); assert.equal(S({ tx: 'l', ph: 180 }).txPol.tilt, 135);
  for (const k of LINEAR) assert.deepEqual(S({ tx: k, amp: 30, ph: 10 }).eTx, S({ tx: k }).eTx);
  assert.deepEqual(S({ rx: 'r', amp: 30, ph: 10 }).eRx, S({ rx: 'r' }).eRx, 'the receiver is ideal');
});

test('tie-break 7: turning a circular receiver changes the phase of its voltage, never the PLF', () => {
  for (const tx of ['v', 's', 'r', 'l']) for (const r of ROTS) {
    near(S({ tx, amp: 70, ph: 60, rx: 'r', rxRot: r }).plf, S({ tx, amp: 70, ph: 60, rx: 'r' }).plf, 1e-12);
  }
  assert.notDeepEqual(S({ tx: 'v', rx: 'r', rxRot: 45 }).V, S({ tx: 'v', rx: 'r' }).V);
});

test('tie-break 8: zero power has no dB (null, not −Infinity), and the state stays JSON-safe', () => {
  const s = S({ tx: 'v', rx: 'h' });
  assert.equal(s.plf, 0); assert.equal(s.plfDb, null); assert.equal(s.volt, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  assert.equal(L.db(0), null); assert.equal(L.db(1), 0);
});

// ── rules (SPEC.md §3) ──

test('rule 1: antennas: a line at its tilt; a loop like a line in its plane (flat: horizontal); crossed dipoles 90° apart are circular', () => {
  assert.deepEqual(S({ tx: 'v' }).txPol.tilt, 90); assert.deepEqual(S({ tx: 'h' }).txPol.tilt, 0);
  assert.deepEqual(S({ tx: 's' }).txPol.tilt, 45); assert.deepEqual(S({ tx: 'loop' }).txPol.tilt, 0);
  assert.equal(S({ tx: 'v', txRot: 30 }).txPol.tilt, 120);
  assert.equal(S({ tx: 'loop', txRot: 90 }).txPol.tilt, 90, 'an upright loop seen edge-on: vertical');
  for (const r of ROTS) assert.deepEqual(S({ tx: 'loop', txRot: r }).eTx, S({ tx: 'h', txRot: r }).eTx);
  const s = Math.SQRT1_2, e = S({ tx: 'r' }).eTx;
  near(e[0][0], s, 1e-12); near(e[0][1], 0, 1e-12); near(e[1][0], 0, 1e-12); near(e[1][1], s, 1e-12);   // (h + jv)/√2
  near(S({ tx: 'l' }).eTx[1][1], -s, 1e-12);
  // right-hand turns clockwise seen from behind: right at ωt = 0, down a quarter period later
  const a = L.instant2(e, 0), b = L.instant2(e, 90);
  near(a[0], s, 1e-12); near(a[1], 0, 1e-12); near(b[0], 0, 1e-12); near(b[1], -s, 1e-12);
  // the receiving antenna is written as the wave it takes: a right-hand Rx is the same vector as a right-hand Tx
  assert.deepEqual(S({ rx: 'r' }).eRx, S({ tx: 'r' }).eTx);
});

test('rule 2: cos law between lines: 1, 0.75, 0.5, 0.25, 0 at 0, 30, 45, 60, 90°; v–h crossed, v–s −3.01 dB', () => {
  const want = { 0: 1, 30: 0.75, 45: 0.5, 60: 0.25, 90: 0 };
  for (const d of Object.keys(want)) near(S({ tx: 'v', rx: 'v', rxRot: Number(d) }).plf, want[d], 1e-12, d);
  assert.equal(S({ tx: 'v', rx: 'h' }).plf, 0);
  near(S({ tx: 'v', rx: 's' }).plfDb, -3.0103, 5e-5);
  near(S({ tx: 'v', rx: 'v', rxRot: 30 }).plfDb, -1.2494, 5e-5);
  near(S({ tx: 'v', rx: 'v', rxRot: 60 }).plfDb, -6.0206, 5e-5);
  for (const a of ROTS) for (const b of ROTS) near(S({ tx: 'h', txRot: a, rx: 'h', rxRot: b }).plf, Math.cos(rad(a - b)) ** 2, 1e-12);
});

test('rule 3: linear against circular is ½ at any angle, either way round', () => {
  for (const k of LINEAR) for (const r of ROTS) for (const c of ['r', 'l']) {
    near(S({ tx: k, txRot: r, rx: c }).plf, 0.5, 1e-12);
    near(S({ tx: c, rx: k, rxRot: r }).plf, 0.5, 1e-12);
    assert.equal(S({ tx: k, txRot: r, rx: c }).kind, 'lincirc');
  }
});

test('rule 4: circular against circular: the same sense 1, opposite senses 0', () => {
  for (const r of ROTS) {
    assert.equal(S({ tx: 'r', txRot: r, rx: 'r' }).plf, 1); assert.equal(S({ tx: 'l', txRot: r, rx: 'l' }).plf, 1);
    assert.equal(S({ tx: 'r', txRot: r, rx: 'l' }).plf, 0); assert.equal(S({ tx: 'l', txRot: r, rx: 'r' }).plf, 0);
  }
});

test('rule 5: amplitude and phase errors make an ellipse: AR and the PLF into either circle', () => {
  const cases = [
    { amp: 100, ph: 80, ar: 1.5237, tilt: 45, R: 0.9924, L: 0.0076 },
    { amp: 90, ph: 90, ar: 0.9151, tilt: 0, R: 0.99724, L: 0.00276 },
    { amp: 50, ph: 90, ar: 6.0206, tilt: 0, R: 0.9, L: 0.1 },
    { amp: 100, ph: 45, ar: 7.6555, tilt: 45, R: 0.85355, L: 0.14645 },
    { amp: 90, ph: 80, ar: 1.7798, tilt: 29.353, R: 0.98968, L: 0.010317 }
  ];
  for (const c of cases) {
    const s = S({ tx: 'r', amp: c.amp, ph: c.ph, rx: 'r' }), q = S({ tx: 'r', amp: c.amp, ph: c.ph, rx: 'l' });
    near(s.txPol.arDb, c.ar, 5e-4, 'AR'); near(s.txPol.tilt, c.tilt, 5e-3, 'tilt');
    near(s.plf, c.R, 5e-5, 'into R'); near(q.plf, c.L, 5e-6, 'into L');
    const r = 1 / s.txPol.ratio;
    near(s.plf, (r + 1) ** 2 / (2 * (r * r + 1)), 1e-12); near(q.plf, (r - 1) ** 2 / (2 * (r * r + 1)), 1e-12);
  }
  near(S({ tx: 'r', amp: 90, ph: 80, rx: 'l' }).plfDb, -19.8646, 5e-4);
  assert.equal(S({ tx: 'l', amp: 90, ph: 80 }).txPol.sense, -1);
  near(S({ tx: 'l', amp: 90, ph: 80, rx: 'r' }).plf, 0.010317, 5e-6, 'mirror image for L');
});

test('rule 5b: every PLF agrees with the Poincaré sphere and the signed-axial-ratio formula (2000 random pairs)', () => {
  const rnd = mulberry(7);
  for (let i = 0; i < 2000; i++) {
    const w = L.crossed(rnd() * 180, rnd(), rnd() * 180, rnd() < 0.5 ? 1 : -1);
    const r = L.crossed(rnd() * 180, 0.01 + rnd() * 0.99, rnd() * 180, rnd() < 0.5 ? 1 : -1);
    const p = L.plfOf(w, r);
    near(p, poincare(w, r), 1e-12);
    const dw = L.describe(w), dr = L.describe(r);
    if (dw.kind !== 'lin' && dr.kind !== 'lin') {
      near(p, stutzman(dw.sense / dw.ratio, dr.sense / dr.ratio, (dw.tilt || 0) - (dr.tilt || 0)), 1e-9);
    }
  }
});

test('rule 6: a bounce mirrors the wave: R comes back L, a 45° slant as 135°, v and h stay; any grazing angle', () => {
  assert.equal(S({ tx: 'r', path: 'bounce' }).arrPol.sense, -1);
  assert.equal(S({ tx: 'r', path: 'bounce' }).flipped, true);
  assert.equal(S({ tx: 'r', rx: 'r', path: 'bounce' }).plf, 0);
  assert.equal(S({ tx: 'r', rx: 'l', path: 'bounce' }).plf, 1);
  assert.equal(S({ tx: 's', path: 'bounce' }).arrPol.tilt, 135);
  assert.equal(S({ tx: 's', rx: 's', path: 'bounce' }).plf, 0);
  assert.equal(S({ tx: 'v', rx: 'v', path: 'bounce' }).plf, 1);
  assert.equal(S({ tx: 'h', rx: 'h', path: 'bounce' }).plf, 1);
  assert.equal(S({ tx: 'v', path: 'bounce' }).flipped, false);
  // the leg frames the page draws in: v at right angles to k, (h, v, k) left-handed as a view is (h × v = −k), leg 1 down
  for (const n of [1, 2]) {
    const f = L.leg('bounce', n), hv = PZ.cross3(L.H, f.v);
    near(PZ.dot3(f.k, f.v), 0, 1e-12); f.k.forEach((k, i) => near(hv[i], -k, 1e-12));
  }
  assert.ok(L.leg('bounce', 1).k[2] < 0 && L.leg('bounce', 2).k[2] > 0);
  // the 3-D mirror, read in each leg's view, is (e_h, e_v) → (−e_h, e_v) whatever the angle of the legs
  for (const beta of [5, 30, 60, 85]) {
    const c = Math.cos(rad(beta)), s = Math.sin(rad(beta));
    const v1 = [s, 0, c], v2 = [-s, 0, c];
    for (const e of [L.lin(30), L.crossed(10, 0.7, 50, 1)]) {
      const e3 = [0, 1, 2].map((i) => [e[0][0] * L.H[i] + e[1][0] * v1[i], e[0][1] * L.H[i] + e[1][1] * v1[i]]);
      const m = PZ.mirror(e3, [0, 0, 1]);
      const h = PZ.projection(m, PZ.linear(L.H)), v = PZ.projection(m, PZ.linear(v2));
      near(h[0], -e[0][0], 1e-12); near(h[1], -e[0][1], 1e-12); near(v[0], e[1][0], 1e-12); near(v[1], e[1][1], 1e-12);
    }
  }
});

test('rule 7: Faraday rotation turns a line by Ω (cos²Ω into the same line) and leaves a circle\'s PLF alone', () => {
  for (const om of [0, 30, 60, 90, 135, 200, 355]) {
    near(S({ tx: 'v', rx: 'v', path: 'iono', om }).plf, Math.cos(rad(om)) ** 2, 1e-12);
    assert.equal(S({ tx: 'v', path: 'iono', om }).arrPol.tilt, L.line180(90 + om));
    near(S({ tx: 'r', rx: 'r', path: 'iono', om }).plf, 1, 1e-12);
    near(S({ tx: 'v', rx: 'r', path: 'iono', om }).plf, 0.5, 1e-12);
    near(S({ tx: 'r', amp: 60, ph: 70, rx: 'r', path: 'iono', om }).plf, S({ tx: 'r', amp: 60, ph: 70, rx: 'r' }).plf, 1e-12);
  }
  near(S({ tx: 'v', rx: 'v', path: 'iono', om: 60 }).plfDb, -6.0206, 5e-5);
  assert.equal(S({ tx: 'v', rx: 'v', path: 'iono', om: 90 }).kind, 'crossed');
  // counterclockwise in the view: a horizontal line turned by 30° is at 30°
  assert.equal(S({ tx: 'h', path: 'iono', om: 30 }).arrPol.tilt, 30);
  assert.equal(S({ tx: 'v', rx: 'v', om: 60 }).plf, 1, 'Ω does nothing off the ionospheric path');
});

test('rule 8: time: the field at Tx and at Rx, the voltage Re(V·e^{jωt}), |V|² = PLF; a crest travels towards Rx', () => {
  for (const pr of [{ tx: 'r' }, { tx: 's', path: 'bounce' }, { tx: 'v', path: 'iono', om: 40 }, { tx: 'r', amp: 50, ph: 60, rx: 'l' }]) {
    for (const t of [0, 45, 90, 200]) {
      const s = S(Object.assign({ t }, pr)), a = L.fieldAt(P(pr), 1, t), b = L.fieldAt(P(pr), 0, t);
      near(a.h, s.eNow[0], 1e-12); near(a.v, s.eNow[1], 1e-12);
      near(b.h, s.eTxNow[0], 1e-12); near(b.v, s.eTxNow[1], 1e-12);
      near(s.V[0] ** 2 + s.V[1] ** 2, s.plf, 1e-12);
      assert.equal(s.uNow, L.uNow(s.V, t));
    }
  }
  // the voltage with a complex V: a right-hand wave into a vertical wire is E's vertical part now
  for (const t of [0, 45, 90, 200]) { const c = S({ tx: 'r', rx: 'v', t }); near(c.uNow, c.eNow[1], 1e-12); }
  near(S({ tx: 'v', rx: 's' }).volt, Math.SQRT1_2, 1e-12, 'voltage = √PLF');
  // a linear receiver: the voltage now is E now along the wire
  const s = S({ tx: 'v', rx: 'v', rxRot: 30, t: 40 });
  near(s.uNow, s.eNow[0] * Math.cos(rad(120)) + s.eNow[1] * Math.sin(rad(120)), 1e-12);
  // a crest at f moves to larger f as t grows
  const f0 = 0.5, v0 = L.fieldAt(P({ tx: 'v' }), f0, 0).v;
  near(L.fieldAt(P({ tx: 'v' }), f0 + 1 / 36, 30).v, v0, 1e-12);   // Δφ = 360·N·Δf = 30°
  // legs and the ionosphere along the way
  assert.equal(L.fieldAt(P({ path: 'bounce' }), 0.49, 0).leg, 1); assert.equal(L.fieldAt(P({ path: 'bounce' }), 0.5, 0).leg, 2);
  const q = L.fieldAt(P({ tx: 'v', path: 'iono', om: 90 }), L.IONO[0], 0), r = L.fieldAt(P({ tx: 'v', path: 'iono', om: 90 }), L.IONO[1], 0);
  near(q.h, 0, 1e-12); near(Math.abs(r.v), 0, 1e-12);
});

test('the plot: PLF against the Rx turn (0 … 180), or against Ω (0 … 360) with a comparison receiver on the ionospheric path', () => {
  let w = L.sweep(P({ tx: 'v', rx: 'h' }));
  assert.equal(w.axis, 'rot'); assert.equal(w.pts.length, 91); assert.equal(w.alt, null);
  assert.equal(w.pts[0].x, 0); assert.equal(w.pts[90].x, 180);
  assert.equal(w.pts[45].plf, 1); assert.equal(w.pts[0].plf, 0); assert.equal(w.pts[0].db, null);
  w = L.sweep(P({ tx: 'v', rx: 'r' }));
  for (const q of w.pts) near(q.plf, 0.5, 1e-12);
  w = L.sweep(P({ tx: 'v', rx: 'v', path: 'iono' }));
  assert.equal(w.axis, 'om'); assert.equal(w.altRx, 'r'); assert.equal(w.pts.length, 121); assert.equal(w.pts[120].x, 360);
  for (let i = 0; i < w.pts.length; i++) { near(w.pts[i].plf, Math.cos(rad(w.pts[i].x)) ** 2, 1e-12); near(w.alt[i].plf, 0.5, 1e-12); }
  w = L.sweep(P({ tx: 'r', rx: 'r', path: 'iono' }));
  assert.equal(w.altRx, 'v');
  for (let i = 0; i < w.pts.length; i++) { near(w.pts[i].plf, 1, 1e-12); near(w.alt[i].plf, 0.5, 1e-12); }
  near(L.sweep(P({ tx: 'r', amp: 50, rx: 'l', rxRot: 45, path: 'iono' })).alt[0].plf, 0.2, 1e-12, 'the comparison Rx is unturned');
  const bnc = L.sweep(P({ tx: 's', rx: 'h', path: 'bounce' }));
  near(bnc.pts[45 / 2 * 1 + 0.5 | 0].plf, L.plfOf(L.along(L.lin(45), L.norm({ path: 'bounce' })), L.lin(44)), 1e-12);
});

test('module: transverse and dipoleWave: length sin θ, null along the wire, linear (real) polarization', () => {
  near(PZ.len3(PZ.transverse([0, 0, 1], [Math.SQRT1_2, 0, Math.SQRT1_2])), Math.SQRT1_2, 1e-12);
  const w = PZ.dipoleWave([0, 0, 1], [0, 0, 1]);
  assert.equal(w.amp, 0); assert.equal(w.e, null);
  const x = PZ.dipoleWave([0, 0, 1], [1, 0, 0]);
  assert.deepEqual(x.e, [[0, 0], [0, 0], [1, 0]]);
});

test('module: plf: lines at ψ give cos²ψ; null for a zero vector; independent of length', () => {
  for (const psi of [0, 30, 45, 60, 90]) {
    near(PZ.plf(PZ.linear([0, 0, 1]), PZ.linear([0, Math.sin(rad(psi)), Math.cos(rad(psi))])), Math.pow(Math.cos(rad(psi)), 2), 1e-12);
  }
  assert.equal(PZ.plf(PZ.linear([0, 0, 0]), PZ.linear([0, 0, 1])), null);
  near(PZ.plf(PZ.linear([0, 0, 5]), PZ.linear([0, 2, 2])), 0.5, 1e-12);
});

test('module: complex vectors for the next page: linear against circular is 0.5 at any angle; the same sense facing is matched', () => {
  const s = Math.SQRT1_2;
  const rhcpUp = [[s, 0], [0, -s], [0, 0]];              // sends along +z: x − jy (e^{+jωt})
  const rhcpDown = [[s, 0], [0, s], [0, 0]];             // the same sense sending along −z: x + jy
  const lhcpDown = [[s, 0], [0, -s], [0, 0]];
  for (const psi of [0, 20, 45, 90, 135]) near(PZ.plf(rhcpUp, PZ.linear([Math.cos(rad(psi)), Math.sin(rad(psi)), 0])), 0.5, 1e-12);
  near(PZ.plf(rhcpUp, rhcpDown), 1, 1e-12, 'right into right, facing');
  near(PZ.plf(rhcpUp, lhcpDown), 0, 1e-12, 'right into left, facing');
});

test('module: instant and ellipse: a line\'s tilt and ratio 0, a circle\'s ratio 1', () => {
  assert.deepEqual(PZ.instant(PZ.linear([0, 0, 1]), 2, Math.PI), [0, 0, -2]);
  assert.deepEqual(PZ.instant(PZ.linear([0, 0, 1]), 2, Math.PI / 2), [0, 0, 0]);
  const u1 = [0, 0, 1], u2 = [0, 1, 0];
  for (const tilt of [0, 30, 90, 150]) {
    const e = PZ.ellipse(PZ.linear([0, Math.sin(rad(tilt)), Math.cos(rad(tilt))]), u1, u2);
    near(e.tilt, tilt, 1e-9); near(e.major, 1, 1e-12); assert.equal(e.minor, 0); assert.equal(e.ratio, 0);
  }
  const c = PZ.ellipse([[0, 0], [0, Math.SQRT1_2], [Math.SQRT1_2, 0]], u1, u2);
  near(c.ratio, 1, 1e-12);
  const el = PZ.ellipse([[0, 0], [0, 0.5], [1, 0]], u1, u2);  // z + j·y/2: an upright ellipse, axial ratio 2
  near(el.tilt, 0, 1e-9); near(el.ratio, 0.5, 1e-12);
});

test('module: the imaginary parts: projection keeps the sign of j, unit scales both parts, e^{+jωt} turns right-hand', () => {
  assert.deepEqual(PZ.projection([[0, 1], [0, 0], [0, 0]], PZ.linear([1, 0, 0])), [0, 1]);
  assert.deepEqual(PZ.projection([[0, 1], [0, 0], [0, 0]], [[0, 1], [0, 0], [0, 0]]), [-1, 0]);
  const s = Math.SQRT1_2, rhcpUp = [[s, 0], [0, -s], [0, 0]];
  near(PZ.plf(rhcpUp.map((c) => [2 * c[0], 2 * c[1]]), [[s, 0], [0, s], [0, 0]]), 1, 1e-12, 'unit() scales the imaginary part too');
  const u = PZ.unit([[0, 3], [0, 0], [0, 4]]);
  near(u[0][1], 0.6, 1e-12); near(u[2][1], 0.8, 1e-12);
  assert.equal(PZ.unit([[1e-13, 0], [0, 0], [0, 0]]), null, 'below EPS is zero');
  // x − jy: at ωt = 0 along x, a quarter period later along +y (x → y: right-hand sending along +z)
  const q0 = PZ.instant(rhcpUp, 1, 0), q1 = PZ.instant(rhcpUp, 1, Math.PI / 2);
  near(q0[0], s, 1e-12); near(q0[1], 0, 1e-12); near(q1[0], 0, 1e-12); near(q1[1], s, 1e-12);
});

test('module: a tilted ellipse: tilt from Re(x·y*), zero vector ratio 0', () => {
  // e = (1 + j)·u1 + (1 + 0.5j)·u2: |x|² = 2, |y|² = 1.25, Re(x·y*) = 1 + 0.5 = 1.5 → tilt = ½·atan2(3, 0.75)
  const e = PZ.ellipse([[0, 0], [1, 0.5], [1, 1]], [0, 0, 1], [0, 1, 0]);
  near(e.tilt, 0.5 * Math.atan2(3, 0.75) * 180 / Math.PI, 1e-9);
  const mean = 1.625, dev = Math.sqrt(0.375 * 0.375 + 1.5 * 1.5);
  near(e.major, Math.sqrt(mean + dev), 1e-12); near(e.minor, Math.sqrt(mean - dev), 1e-12);
  const z = PZ.ellipse([[0, 0], [0, 0], [0, 0]], [0, 0, 1], [0, 1, 0]);
  assert.equal(z.ratio, 0); assert.equal(z.major, 0);
});


test('module: snap makes rounding residue and −0 exact zeros', () => {
  assert.equal(PZ.snap(Math.cos(Math.PI / 2)), 0);
  assert.ok(Object.is(PZ.snap(-0), 0) || PZ.snap(-0) === 0);
  assert.ok(Object.is(PZ.snap(-1e-17), 0));
  assert.equal(PZ.snap(0.5), 0.5);
});

test('module (added): conj, sense, stokes, rotate, mirror', () => {
  const s = Math.SQRT1_2, up = [0, 0, 1];
  assert.deepEqual(PZ.conj([[1, 2], [0, -3], [4, 0]]), [[1, -2], [0, 3], [4, 0]]);
  const rhcpUp = [[s, 0], [0, -s], [0, 0]];                       // x − jy along +z: right-hand
  assert.equal(PZ.sense(rhcpUp, up), 1); assert.equal(PZ.sense(rhcpUp, [0, 0, -1]), -1);
  assert.equal(PZ.sense(PZ.conj(rhcpUp), up), -1); assert.equal(PZ.sense(PZ.linear([1, 0, 0]), up), 0);
  assert.equal(PZ.sense([[0, 0], [0, 0], [0, 0]], up), 0);
  assert.equal(PZ.sense([[1, 0], [0, -1e-10], [0, 0]], up), 0, 'a hair off a line is a line');
  assert.deepEqual(PZ.stokes(PZ.linear([1, 0, 0]), [1, 0, 0], [0, 1, 0]), [1, 0, 0]);
  const st = PZ.stokes([[s, 0], [0, s], [0, 0]], [1, 0, 0], [0, 1, 0]);
  near(st[0], 0, 1e-12); near(st[1], 0, 1e-12); near(st[2], 1, 1e-12);
  assert.equal(PZ.stokes([[0, 0], [0, 0], [0, 0]], [1, 0, 0], [0, 1, 0]), null);
  const d = PZ.stokes([[0.6, 0.2], [0.3, -0.5], [0, 0]], [1, 0, 0], [0, 1, 0]);
  near(d[0] ** 2 + d[1] ** 2 + d[2] ** 2, 1, 1e-12);
  // rotate: x about +z by 90 → y; the imaginary part turns too
  const r = PZ.rotate([[1, 0], [0, 0], [0, 2]], up, 90);
  assert.deepEqual(r, [[0, 0], [1, 0], [0, 2]]);
  const r2 = PZ.rotate([[0, 1], [0, 0], [0, 0]], up, 90);
  assert.deepEqual(r2, [[0, 0], [0, 1], [0, 0]]);
  near(PZ.rotate(PZ.linear([1, 0, 0]), up, 30)[1][0], 0.5, 1e-12);
  near(PZ.rotate(PZ.linear([0, 0, 1]), up, 60)[2][0], 1, 1e-12, 'the part along the axis stays');
  near(PZ.rotate(PZ.linear([1, 0, 1]), up, 60)[2][0], 1, 1e-12);
  assert.equal(PZ.sense([[1, 0], [0, -1e-6], [0, 0]], up), 1);
  // mirror off z = 0: x and y reverse, z stays; imaginary parts alike
  assert.deepEqual(PZ.mirror([[1, 1], [2, -1], [3, 2]], up), [[-1, -1], [-2, 1], [3, 2]]);
});

test('page constants SPEC.md §1, §3 and §4 name', () => {
  assert.equal(L.T_STEP, 5); assert.equal(L.KEY_STEP, 15); assert.equal(L.ANG_STEP, 5); assert.equal(L.WAVES, 3);
  assert.deepEqual(L.IONO, [0.3, 0.7]); assert.equal(L.BETA, 30); assert.deepEqual(L.BASE, { v: 90, h: 0, s: 45, loop: 0, r: 0, l: 0 });
  assert.deepEqual(L.defaults, { tx: 'v', txRot: 0, amp: 100, ph: 90, rx: 'v', rxRot: 0, path: 'direct', om: 0, t: 0 });
});

// ── presets (SPEC.md §5) ──

test('presets: the params SPEC.md §5 lists', () => {
  assert.deepEqual(L.presets.map((p) => p.id), ['vh', 'lincirc', 'rl', 'loop', 'bounce', 'faraday']);
  const want = {
    vh: { tx: 'v', rx: 'h' }, lincirc: { tx: 'v', rx: 'r' },
    rl: { tx: 'r', amp: 90, ph: 80, rx: 'l' }, loop: { tx: 'v', rx: 'loop' },
    bounce: { tx: 'r', rx: 'r', path: 'bounce' }, faraday: { tx: 'v', rx: 'v', path: 'iono', om: 60 }
  };
  for (const p of L.presets) assert.deepEqual(p.params, want[p.id], p.id);
});

test('presets: each shows what SPEC.md §5 says', () => {
  const st = (id) => S(L.presets.find((p) => p.id === id).params);
  let s = st('vh'); assert.equal(s.kind, 'crossed'); assert.equal(s.plfDb, null);
  s = st('lincirc'); assert.equal(s.kind, 'lincirc'); near(s.plfDb, -3.01, 0.005);
  for (const r of ROTS) near(S({ tx: 'v', txRot: r, rx: 'r' }).plf, 0.5, 1e-12);
  s = st('rl'); assert.equal(s.txPol.kind, 'ell'); assert.equal(s.txPol.sense, 1); near(s.txPol.arDb, 1.78, 0.005);
  near(s.txPol.tilt, 29.35, 0.005); near(s.plf, 0.0103, 5e-5); near(s.plfDb, -19.86, 0.005);
  s = st('loop'); assert.equal(s.kind, 'crossed'); assert.equal(s.rxPol.tilt, 0);
  s = st('bounce'); assert.equal(s.kind, 'crossed'); assert.equal(s.arrPol.sense, -1); assert.equal(s.flipped, true);
  s = st('faraday'); assert.equal(s.arrPol.tilt, 150); near(s.plf, 0.25, 1e-12); near(s.plfDb, -6.02, 0.005);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ tx: 'r', amp: 70, ph: 65, rx: 's', rxRot: 25, path: 'iono', om: 40, t: 75 });
  const copy = structuredClone(p);
  assert.deepEqual(L.initial(p), L.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a name in both languages', () => {
  for (const pr of L.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in L.defaults, `${pr.id}: ${k}`);
    const key = 'preset_' + pr.id;
    assert.ok(strings.hr[key] && strings.en[key], key);
  }
  for (const k of L.TYPES) assert.ok(strings.hr['type_' + k] && strings.en['type_' + k], k);
  for (const k of L.PATHS) assert.ok(strings.hr['path_' + k] && strings.en['path_' + k], k);
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
});
