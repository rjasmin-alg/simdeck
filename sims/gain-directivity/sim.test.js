// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for gain-directivity (SPEC.md). Run: node --test sims/gain-directivity/
// Tie-breaks first, then one test per rule, then the shared modules' own rules, then the presets, then the generic block.
// Expected numbers come from an independent scipy check (quad integration of the same shape, the closed forms with
// I₀ and Γ, SPEC.md §2 and §5).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const CP = require('./current-pattern.js');
const LB = require('./link-budget.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const S = (over) => L.initial(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);
const SH = (over) => L.shape(P(over));

// ── tie-breaks (SPEC.md §1) ──

test('tie-break 1: params are clamped and put on their grid; a non-number gives the default; ptx and scale from their lists', () => {
  assert.equal(L.norm({ hbw: 0 }).hbw, 20);
  assert.equal(L.norm({ hbw: 999 }).hbw, 360);
  assert.equal(L.norm({ hbw: 66 }).hbw, 65);
  assert.equal(L.norm({ hbw: 67.5 }).hbw, 70);
  assert.equal(L.norm({ vbw: 1 }).vbw, 10);
  assert.equal(L.norm({ vbw: 200 }).vbw, 180);
  assert.equal(L.norm({ fb: -3 }).fb, 0);
  assert.equal(L.norm({ fb: 15.4 }).fb, 15);
  assert.equal(L.norm({ sll: 0 }).sll, -10);
  assert.equal(L.norm({ sll: -99 }).sll, -40);
  assert.equal(L.norm({ eff: 0 }).eff, 5);
  assert.equal(L.norm({ eff: 37 }).eff, 35);
  assert.equal(L.norm({ eff: 101 }).eff, 100);
  assert.equal(L.norm({ cable: 1.3 }).cable, 1.5);
  assert.equal(L.norm({ cable: 0.1 + 0.2 }).cable, 0.5);
  assert.equal(L.norm({ cable: 12 }).cable, 10);
  for (const bad of ['x', null, undefined, '', NaN, Infinity, true]) {
    const n = L.norm({ hbw: bad, vbw: bad, fb: bad, sll: bad, eff: bad, cable: bad, ptx: bad, scale: bad });
    assert.deepEqual(n, L.defaults, String(bad));
  }
  assert.equal(L.norm({ ptx: '10' }).ptx, 10);
  assert.equal(L.norm({ ptx: 50 }).ptx, 100, 'not one of the four');
  assert.equal(L.norm({ scale: 'db' }).scale, 'db');
  assert.equal(L.norm({ scale: 'log' }).scale, 'field');
  assert.equal(L.norm({ hbw: '90' }).hbw, 90);
  // every slider value lands exactly on its grid
  for (const [k, r] of Object.entries(L.RANGES)) {
    for (let v = r[0]; v <= r[1] + 1e-9; v += r[2]) {
      const got = L.norm({ [k]: v + 1e-7 })[k];
      assert.equal(got, Number(v.toFixed(2)), `${k} ${v}`);
    }
  }
});

test('tie-break 2: an omni pattern ignores the back and side lobes; F/B 0 dB, no side lobes, no horizontal beamwidth', () => {
  const a = S({ hbw: 360, fb: 0, sll: -10 }), b = S({ hbw: 360, fb: 40, sll: -40 });
  assert.equal(a.d, b.d);
  assert.equal(SH({ hbw: 360 }).kH, 0);
  for (const phi of [0, 45, 90, 135, 180]) assert.equal(L.horiz(SH({ hbw: 360, fb: 0, sll: -10 }), phi), 1);
  assert.equal(a.fbRead, 0); assert.equal(a.side, null); assert.equal(a.hbwRead, null); assert.equal(a.omni, true);
  assert.equal(a.fbLimited, false); assert.equal(S({ hbw: 360 }).fbLimited, false, 'default fb 20 too');
  assert.equal(S({ hbw: 360 }).fbTail, false);
  assert.equal(SH({ vbw: 180 }).m, 0);
  for (const e of [0, 45, 89, 90]) assert.equal(L.vert(SH({ vbw: 180 }), e), 1);
  assert.equal(S({ vbw: 180 }).vbwRead, null);
});

test('tie-break 3: the front is the maximum and is 1; with fb 0 the back equals it and the main lobe stays at the front', () => {
  for (const [hbw, fb, sll] of [[20, 0, -10], [65, 15, -10], [180, 0, -10], [355, 0, -10], [90, 40, -40]]) {
    const sh = SH({ hbw, fb, sll });
    assert.equal(L.horiz(sh, 0), 1, `${hbw}`);
    for (let phi = 0; phi <= 180; phi += 0.5) assert.ok(L.horiz(sh, phi) <= 1 + 1e-15, `${hbw} ${phi}`);
  }
  const bi = SH({ hbw: 120, fb: 0 });
  near(L.horiz(bi, 180), 1, 1e-15);
  const s = S({ hbw: 120, fb: 0, vbw: 90 });
  assert.equal(s.kind, 'bidir'); near(s.fbRead, 0, 1e-12); near(s.hbwRead, 120, 0.01, 'measured at the front');
  assert.equal(S({ hbw: 120, fb: 1 }).kind, 'beam');
  // fb 0 on a broad lobe: front and back fill all round, nothing falls to half: 'broad', not bidirectional
  for (const hbw of [180, 300, 355]) assert.equal(S({ hbw, fb: 0 }).kind, 'broad', String(hbw));
  assert.equal(S({ hbw: 175, fb: 0 }).kind, 'bidir');
});

test('tie-break 4: no half-power point gives a null beamwidth, not 360', () => {
  assert.equal(S({ hbw: 360 }).hbwRead, null);
  assert.equal(S({ hbw: 300, fb: 0 }).hbwRead, null, 'a bidirectional broad beam never falls to half');
  near(S({ hbw: 300, fb: 20 }).hbwRead, 300, 0.01);
  assert.equal(L.beamwidth(() => 0.6, 180), null);
  assert.equal(L.beamwidth((a) => (a < 10 ? 1 : 0.4), 180) <= 20, true);
});

test('tie-break 5: a side lobe sticks out between 0 and 180°; hidden in a broad main lobe it is null', () => {
  assert.equal(S({ hbw: 180, sll: -10 }).side, null, 'merged into the broad main lobe');
  assert.equal(S({ hbw: 360 }).side, null);
  const s = S({ hbw: 60, sll: -20 });
  near(s.side.db, -20, 1e-9); assert.equal(s.side.at, 120);
  near(S({ hbw: 20, sll: -40 }).side.db, -40, 1e-9);
  assert.equal(S({ hbw: 20, sll: -40 }).side.at, 40);
  assert.equal(S({ hbw: 90, sll: -15 }).side.at, 135, 'clamped at 135°');
  // the back lobe at 180° and the main at 0° are not side lobes
  assert.equal(S({ hbw: 120, fb: 0, sll: -40 }).side, null);
});

test('tie-break 6: zero power has no dB; every state is finite and JSON-safe', () => {
  assert.equal(LB.db(0), null); assert.equal(LB.db(-1), null); assert.equal(LB.db(1), 0);
  assert.equal(LB.dbm(0), null); assert.equal(LB.dbdOf(null, 1.64), null);
  const s = S({ eff: 5, cable: 10, ptx: 1, hbw: 20, vbw: 10 });
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  for (const k of ['eirpDbw', 'erpDbw', 'pRadDbw']) assert.ok(Number.isFinite(s.tx[k]), k);
});

// ── rules (SPEC.md §4) ──

test('rule 1: the total stays the same: P_rad depends only on ptx, cable and eff, and U_max = D·P_rad/4π', () => {
  const shapes = [{}, { hbw: 20, vbw: 10 }, { hbw: 65, vbw: 100, fb: 15, sll: -15 }, { vbw: 40 }, { hbw: 120, fb: 0 }];
  const base = S({ ptx: 100, cable: 1.5, eff: 70 }).tx.pRad;
  near(base, 100 * 0.7 * Math.pow(10, -0.15), 1e-9);
  for (const sh of shapes) {
    const s = S(Object.assign({ ptx: 100, cable: 1.5, eff: 70 }, sh));
    near(s.tx.pRad, base, 1e-9, JSON.stringify(sh));
    // the intensity over the sphere: ∫∫ U dΩ with U_max = D·P_rad/4π gives back P_rad
    const umax = s.d * s.tx.pRad / (4 * Math.PI);
    near(umax * s.iA * s.iE, s.tx.pRad, 1e-9);
    near(s.tx.eirp, s.d * s.tx.pRad, 1e-9, 'EIRP is the peak intensity times 4π');
  }
  // an independent route: a brute-force sum over the sphere of A(φ)E(ε) cos ε
  const sh = SH({ hbw: 65, vbw: 100, fb: 15, sll: -15 });
  let sum = 0; const st = 0.5;
  for (let phi = -180 + st / 2; phi < 180; phi += st) {
    for (let e = -90 + st / 2; e < 90; e += st) sum += L.horiz(sh, phi) * L.vert(sh, e) * Math.cos(e * Math.PI / 180);
  }
  sum *= (st * Math.PI / 180) ** 2;
  near(4 * Math.PI / sum, S({ hbw: 65, vbw: 100, fb: 15, sll: -15 }).d, 2e-3, 'midpoint sum');
});

test('rule 2: squeezing raises D; the isotropic radiator has D = 1 exactly', () => {
  const iso = S({});
  near(iso.d, 1, 1e-12); near(iso.dbi, 0, 1e-12); assert.equal(iso.kind, 'iso');
  let last = 0;
  for (let hbw = 360; hbw >= 20; hbw -= 5) {
    const d = S({ hbw, vbw: 90, fb: 25, sll: -30 }).d;
    assert.ok(d > last, `hbw ${hbw}: ${d} > ${last}`); last = d;
  }
  last = 0;
  for (let vbw = 180; vbw >= 10; vbw -= 5) {
    const d = S({ hbw: 90, vbw }).d;
    assert.ok(d > last, `vbw ${vbw}: ${d} > ${last}`); last = d;
  }
  // a bigger back lobe or side lobes take power from the main lobe: D falls
  assert.ok(S({ hbw: 60, fb: 10 }).d < S({ hbw: 60, fb: 30 }).d);
  assert.ok(S({ hbw: 30, sll: -10 }).d < S({ hbw: 30, sll: -30 }).d);
});

test('rule 3: the closed forms: I_A = 2π·I₀(κ)e^{−κ}, I_E = √π·Γ((m+2)/2)/Γ((m+3)/2), omni at 90° is 1.5', () => {
  for (const hbw of [355, 180, 90, 60, 20]) {
    const k = L.kappaOf(hbw);
    near(L.integralA({ kH: k, b: 0, kS: 1, phiS: 90, s: 0, m: 0 }), L.closedA(k), 1e-10, `hbw ${hbw}`);
  }
  // scipy values (quad and i0e)
  near(L.closedA(L.kappaOf(180)), 3.5304230242521437, 1e-12);
  near(L.closedA(L.kappaOf(20)), 0.37212719033543634, 1e-12);
  near(L.closedE(0), 2, 1e-12); near(L.closedE(1), Math.PI / 2, 1e-12); near(L.closedE(2), 4 / 3, 1e-12);
  for (const vbw of [170, 120, 90, 78, 40, 10]) {
    const m = L.mOf(vbw);
    near(L.integralE({ m }), L.closedE(m), vbw > 120 ? 1e-8 : 1e-10, `vbw ${vbw} (below m = 1 the pole is a cusp: Simpson is a little less exact)`);
  }
  near(L.closedE(L.mOf(40)), 0.7046748322307474, 1e-10);
  near(L.closedE(L.mOf(10)), 0.1851401174770106, 1e-10);
  near(L.mOf(90), 2, 1e-12); near(L.mOf(120), 1, 1e-12);
  near(L.kappaOf(180), Math.LN2, 1e-12);
  near(S({ vbw: 90 }).d, 1.5, 1e-9, 'the short dipole\'s sin²θ');
  near(S({ vbw: 90 }).dbi, 1.7609, 1e-4);
  near(S({ vbw: 120 }).d, 4 / Math.PI, 1e-9);
});

test('rule 4: the beamwidths read back what was set', () => {
  for (const hbw of [20, 35, 65, 90, 135, 180, 250, 300, 355]) near(S({ hbw, fb: 40, sll: -40 }).hbwRead, hbw, 0.01, `hbw ${hbw}`);
  for (const vbw of [10, 25, 40, 80, 100, 150, 175]) near(S({ vbw }).vbwRead, vbw, 0.01, `vbw ${vbw}`);
  // the lobes are combined by their maximum: a back lobe or side lobes below −3 dB do not widen the main lobe
  near(S({ hbw: 65, fb: 4, sll: -10 }).hbwRead, 65, 0.01);
});

test('rule 5: F/B is fb while the main lobe\'s own back is lower; a broad main lobe limits it', () => {
  for (const fb of [0, 3, 15, 30, 40]) near(S({ hbw: 60, fb }).fbRead, fb, 1e-9, `fb ${fb}`);
  const s = S({ hbw: 300, fb: 20 });
  near(s.fbRead, 3.2262, 1e-3, 'scipy: 3.226');
  near(s.fbRead, -LB.db(Math.exp(-2 * L.kappaOf(300))), 1e-9);
  assert.equal(s.fbLimited, true);
  assert.equal(S({ hbw: 60, fb: 20 }).fbLimited, false);
  assert.equal(s.fbTail, true, '20 dB set, 3.2 dB got: worth saying');
  // a narrow beam whose tail caps a very deep back lobe by a little: limited, but not worth a sentence
  const n = S({ hbw: 65, fb: 39 });
  assert.equal(n.fbLimited, true); assert.equal(n.fbTail, false); near(n.fbRead, 38.444, 0.001);
  assert.equal(S({ hbw: 65, fb: 40 }).fbTail, false);
  assert.equal(S({ hbw: 90, fb: 40 }).fbTail, true);
  near(S({ hbw: 300, fb: 2 }).fbRead, 2, 1e-9, 'a back lobe above the main lobe\'s back sets it again');
});

test('rule 6: side lobes read back sll when they stick out; their level counts in D', () => {
  for (const sll of [-40, -25, -15, -10]) near(S({ hbw: 30, sll }).side.db, sll, 1e-9, `sll ${sll}`);
  assert.equal(S({ hbw: 30 }).side.at, 60);
  assert.equal(S({ hbw: 180 }).side, null);
});

test('rule 7: gain = efficiency × directivity; dBd = dBi − 2.15 for every shape', () => {
  near(L.D_DIPOLE, 1.640922377, 1e-8, 'scipy quad of the half-wave dipole');
  near(L.DBD, 2.15088, 1e-5);
  for (const over of [{}, { vbw: 40 }, { hbw: 65, vbw: 100, eff: 55 }, { hbw: 20, vbw: 20, eff: 5 }]) {
    const s = S(over);
    near(s.g, s.d * s.eff, 1e-12);
    near(s.gDbi, s.dbi + 10 * Math.log10(s.eff), 1e-12);
    near(s.gDbd, s.gDbi - 2.1509, 1e-4);
    near(s.dbd, s.dbi - 2.1509, 1e-4);
  }
  near(S({}).dbd, -2.151, 1e-3, 'the isotropic radiator is 2.15 dB below the dipole');
});

test('rule 8: EIRP and ERP by watts and by dB agree; ERP = EIRP − 2.15 dB', () => {
  for (const over of [{}, { ptx: 1000, cable: 3, eff: 80, hbw: 65, vbw: 100 }, { ptx: 1, cable: 10, eff: 5 }, { ptx: 10, cable: 2, hbw: 20, vbw: 20 }]) {
    const s = S(over), tx = s.tx, p = s.p;
    near(tx.eirpDbw, 10 * Math.log10(p.ptx) - p.cable + s.gDbi, 1e-9, 'EIRP in dB');
    near(tx.erpDbw, 10 * Math.log10(p.ptx) - p.cable + s.gDbd, 1e-9, 'ERP in dB');
    near(tx.eirpDbw - tx.erpDbw, 2.15088, 1e-5);
    near(tx.eirp, p.ptx * Math.pow(10, -p.cable / 10) * s.g, 1e-9 * tx.eirp);
    near(tx.erp * L.D_DIPOLE, tx.eirp, 1e-9 * tx.eirp);
    near(tx.cableW + tx.lossW + tx.pRad, p.ptx, 1e-9, 'every watt is accounted for');
    near(tx.ptxDbm, 10 * Math.log10(p.ptx) + 30, 1e-12);
    near(tx.pRadDbw, LB.db(tx.pRad), 1e-12); near(tx.pAntDbw, LB.db(tx.pAnt), 1e-12); near(tx.ptxDbw, LB.db(p.ptx), 1e-12);
  }
  const s = S({ ptx: 100, cable: 3 });
  near(s.tx.pAnt, 50.12, 0.01, '3 dB of cable is half');
});

test('rule 9: a lossy antenna has gain below its directivity, and below 0 dBi when η·D < 1', () => {
  const s = S({ vbw: 90, eff: 10 });
  near(s.d, 1.5, 1e-9); near(s.g, 0.15, 1e-9); near(s.gDbi, -8.239, 1e-3);
  assert.equal(s.lossy, true); assert.equal(s.belowIso, true);
  const t = S({ vbw: 40 });
  assert.equal(t.lossy, false); assert.equal(t.belowIso, false);
  assert.equal(S({ eff: 95 }).lossy, true, 'any loss counts');
  assert.equal(S({}).belowIso, false, 'the isotropic radiator is not below itself');
  assert.equal(S({ eff: 95 }).belowIso, true);
});

test('the dipole reference: its directive gain is 1.64 broadside, 0 overhead, and averages 1 over the sphere', () => {
  near(L.dipoleAt(0), 1.640922, 1e-5);
  assert.equal(L.dipoleAt(90), 0); assert.equal(L.dipoleAt(-90), 0);
  let sum = 0; const n = 3600;
  for (let i = 0; i <= n; i++) {
    const e = -90 + 180 * i / n, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    sum += w * L.dipoleAt(e) * Math.cos(e * Math.PI / 180);
  }
  near(sum * (Math.PI / n) / 3 / 2, 1, 1e-6);
  // its half-power beamwidth is 78°
  near(L.beamwidth((e) => L.dipoleAt(e) / L.dipoleAt(0), 90), 78.08, 0.02);
});

test('plot scales: the linear top is the smallest of the ladder above D and the dipole; the dB top the next 5 dBi', () => {
  assert.equal(S({}).top, 2); assert.equal(S({}).topDb, 5);
  assert.equal(S({ vbw: 40 }).top, 3); assert.equal(S({ vbw: 40 }).topDb, 10);
  assert.equal(S({ hbw: 65, vbw: 100, fb: 15, sll: -15 }).top, 10);
  assert.equal(S({ hbw: 20, vbw: 20, fb: 30, sll: -25 }).top, 100);
  assert.equal(S({ hbw: 20, vbw: 10 }).top, 200);
  assert.equal(L.plotTop(1e6), 200);
  // efficiency does not rescale the plot
  assert.equal(S({ eff: 5 }).top, S({}).top);
  assert.equal(S({ hbw: 20, vbw: 20, eff: 5 }).top, S({ hbw: 20, vbw: 20 }).top);
  assert.equal(S({ hbw: 20, vbw: 20, eff: 5 }).topDb, S({ hbw: 20, vbw: 20 }).topDb);
  // the margins (SPEC §6): a value within 2 % of a ladder step takes the next one; dBi within 0.5 dB of a
  // multiple of 5 takes the next multiple
  assert.equal(L.plotTop(1.97), 3); assert.equal(L.plotTop(1.95), 2); assert.equal(L.plotTop(9.9), 20);
  assert.equal(L.dbTop(Math.pow(10, 0.42)), 5); assert.equal(L.dbTop(Math.pow(10, 0.46)), 10);
  assert.equal(L.dbTop(Math.pow(10, 0.3)), 5);
});

// ── the shared modules' own rules (promotable) ──

test('module link-budget: dBW, dBm, gain, dBd and the transmit chain', () => {
  assert.equal(LB.dbw(100), 20); assert.equal(LB.dbm(100), 50); assert.equal(LB.dbw(1), 0);
  near(LB.fromDb(3), 1.99526, 1e-5); near(LB.fromDb(-10), 0.1, 1e-15);
  assert.equal(LB.gain(1.5, 0.1), 0.15000000000000002);
  near(LB.dbdOf(2.15088, 1.640922), 0, 1e-5);
  const t = LB.transmit(100, 1, 6.8442, 1, 1.640922);
  near(t.pAnt, 79.433, 1e-3); near(t.eirp, 543.65, 0.01); near(t.erp, 331.31, 0.01);
  near(t.eirp, t.pRad * 6.8442, 1e-9); assert.equal(t.cableDb, 1); near(t.cableW, 100 - t.pAnt, 1e-12);
});

test('module current-pattern (copied from dipole-length): the half-wave dipole is 2.15 dBi, 78°; on the axis F is 0', () => {
  const d = CP.directivity(0.5);
  near(d.d, 1.6409, 1e-4); near(d.beamwidth, 78.08, 0.06); assert.equal(d.main, 90);
  near(CP.axialIntegral(0.5), 1.2188267, 1e-7);
  assert.ok(Object.is(CP.elementFactor(0.5, 1), 0));
  near(CP.elementFactor(0.5, 0), 1, 1e-15);
});

// ── presets (SPEC.md §5) ──

test('presets: the ids and params SPEC.md §5 lists, each already on its grid', () => {
  assert.deepEqual(L.presets.map((p) => p.id), ['iso', 'collinear', 'beam', 'whip', 'dish']);
  for (const p of L.presets) assert.deepEqual(L.norm(p.params), p.params, p.id);
});

test('presets: each shows what SPEC.md §5 says (scipy numbers)', () => {
  const st = (id) => S(L.presets.find((p) => p.id === id).params);
  let s = st('iso');
  near(s.d, 1, 1e-12); near(s.gDbd, -2.151, 1e-3); near(s.tx.eirp, 100, 1e-9); near(s.tx.erp, 60.94, 0.01); assert.equal(s.kind, 'iso');
  s = st('collinear');
  near(s.d, 2.8382, 1e-4); near(s.dbi, 4.530, 1e-3); near(s.gDbd, 2.380, 1e-3); near(s.tx.eirp, 283.82, 0.01); near(s.tx.erp, 172.96, 0.01);
  assert.equal(s.kind, 'omni');
  s = st('beam');
  near(s.d, 6.8442, 1e-4); near(s.dbi, 8.353, 1e-3); near(s.gDbd, 6.202, 1e-3); near(s.tx.eirp, 543.65, 0.01); near(s.tx.erp, 331.31, 0.01);
  near(s.hbwRead, 65, 0.01); near(s.vbwRead, 100, 0.01); near(s.fbRead, 15, 1e-9); near(s.side.db, -15, 1e-9); assert.equal(s.side.at, 130);
  assert.equal(s.kind, 'beam');
  s = st('whip');
  near(s.d, 1.5, 1e-9); near(s.gDbi, -8.239, 1e-3); near(s.tx.eirp, 15, 1e-9); near(s.tx.erp, 9.14, 0.01); assert.equal(s.belowIso, true);
  s = st('dish');
  near(s.d, 91.7869, 1e-3); near(s.dbi, 19.628, 1e-3); near(s.gDbd, 17.477, 1e-3); near(s.tx.eirp, 579.14, 0.01); near(s.tx.erp, 352.93, 0.01);
  near(s.fbRead, 30, 1e-9); near(s.side.db, -25, 1e-9);
  // 10 W into the large beam gives about the EIRP of 100 W into the small one
  near(s.tx.eirpDbw, st('beam').tx.eirpDbw, 0.3);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset, the defaults and a sweep of shapes', () => {
  for (const pr of [{ params: {} }].concat(L.presets)) {
    const s = S(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  for (let hbw = 20; hbw <= 360; hbw += 35) {
    for (let vbw = 10; vbw <= 180; vbw += 34) {
      const s = S({ hbw, vbw, fb: hbw % 41, sll: -10 - (vbw % 31) });
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s, `${hbw} ${vbw}`);
      for (const k of ['d', 'dbi', 'g', 'gDbi', 'gDbd', 'fbRead']) assert.ok(Number.isFinite(s[k]), `${hbw} ${vbw}: ${k}`);
    }
  }
});

test('initial is deterministic and does not mutate its params', () => {
  const p = P({ hbw: 65, vbw: 100, fb: 15, sll: -15, eff: 55, cable: 2.5, ptx: 10, scale: 'db' });
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
