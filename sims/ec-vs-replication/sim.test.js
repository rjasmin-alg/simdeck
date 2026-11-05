// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ec-vs-replication's model (rules: SPEC.md). Run: node --test sims/ec-vs-replication/
// Tie-breaks first, then one test per rule, then the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.filter((x) => x.id === id)[0];
const fromPreset = (id) => S(preset(id).params);
const mask = (...hosts) => hosts.reduce((a, h) => a | (1 << (h - 1)), 0);     // h1 = bit 0
const names = (s) => s.cols.map((c) => c.name);
const MIB = 1048576, TIB = 2 ** 40, TB = 1e12;

// ── tie-breaks ──

test('rule 6 tie-break: equal efficiency → more failures tolerated first (6+3, 4+2, 2+1 all 2/3)', () => {
  assert.deepEqual(names(S({ scheme: 'ec', k: 4, m: 2 })), ['6+3', '4+2', '2+1', '3×']);
  assert.deepEqual(names(S({ scheme: 'ec', k: 2, m: 1 })), ['6+3', '4+2', '2+1', '3×']);
  // all one half: 3+3, 2+2, 2× (tolerated 3, 2, 1)
  assert.deepEqual(names(S({ scheme: 'ec', k: 2, m: 2, n: 2 })), ['3+3', '2+2', '2×']);
  assert.deepEqual(names(S({ scheme: 'rep', k: 4, m: 1, n: 2 })), ['4+1', '3+3', '2+2', '2×']);
});

test('rule 6: efficiency descending first, before failures tolerated', () => {
  // 8+3 (8/11) before 3× (1/3), though both columns differ in tolerance
  assert.deepEqual(names(S({ scheme: 'rep', k: 8, m: 3, n: 3 })), ['8+3', '3×']);
  const s = S({ scheme: 'ec', k: 8, m: 2 });   // 8+2 = 4/5, twin 4+1
  assert.deepEqual(names(s), ['8+2', '4+1', '3×']);
  assert.equal(s.cols.filter((c) => c.current).length, 1);
  assert.equal(s.cols.filter((c) => c.current)[0].name, '8+2');
});

test('rule 6: two different schemes in range never tie on both efficiency and failures tolerated', () => {
  const all = [];
  for (let n = 2; n <= 4; n++) all.push({ kind: 'rep', n });
  for (let k = 2; k <= 8; k++) for (let m = 1; m <= 3; m++) all.push({ kind: 'ec', k, m });
  for (const sch of all) {
    const e = logic.evaluate(sch, 12, 0);
    for (const tw of logic.twins(sch)) {
      assert.equal(logic.cmpFrac(logic.efficiency(tw), e.eff), 0);
      assert.notEqual(logic.evaluate(tw, 12, 0).tolerated, e.tolerated, `${e.name} vs twin`);
    }
  }
  assert.deepEqual(logic.twins({ kind: 'ec', k: 5, m: 2 }), []);     // 5/7 is near 8/11 but not equal
  assert.deepEqual(logic.twins({ kind: 'ec', k: 6, m: 2 }).map((x) => x.k + '+' + x.m), ['3+1']);
});

test('rule 6 order: current first, then narrower, only when efficiency and tolerance are equal', () => {
  const a = { eff: { num: 2, den: 3 }, tolerated: 2, current: false, width: 6 };
  const b = { eff: { num: 2, den: 3 }, tolerated: 2, current: true, width: 9 };
  const c = { eff: { num: 2, den: 3 }, tolerated: 2, current: false, width: 3 };
  assert.ok(logic.order(a, b) > 0, 'current first');
  assert.ok(logic.order(a, c) > 0, 'narrower first');
  assert.ok(logic.order({ ...a, tolerated: 3 }, b) < 0, 'tolerance beats current');
});

test('rule 4 tie-breaks: lowest lost piece, lowest free host, sources skip lost shards', () => {
  const s = S({ scheme: 'ec', k: 4, m: 2, hosts: 9, failed: mask(1, 3) });
  assert.equal(s.cur.plan.piece, 0);                       // d1 before d3
  assert.equal(s.cur.plan.target, 6);                      // h7, the lowest of h7 h8 h9
  assert.deepEqual(s.cur.plan.sources, [1, 3, 4, 5]);       // d2 d4 c1 c2
  const t = S({ scheme: 'ec', k: 4, m: 2, hosts: 9, failed: mask(2, 7) });
  assert.equal(t.cur.plan.piece, 1);                       // d2
  assert.equal(t.cur.plan.target, 7);                      // h7 is down → h8
  assert.deepEqual(t.cur.plan.sources, [0, 2, 3, 4]);
});

test('rule 3 tie-break: live = min_size exactly → I/O continues', () => {
  const s = S({ scheme: 'rep', n: 3, failed: mask(1) });
  assert.equal(s.cur.live, 2);
  assert.equal(s.cur.min, 2);
  assert.equal(s.cur.active, true);
  assert.equal(s.cur.status, 'degraded');
});

test('rule 2 tie-break: live = need exactly → data intact', () => {
  const s = S({ scheme: 'ec', k: 4, m: 2, failed: mask(5, 6) });
  assert.equal(s.cur.live, 4);
  assert.equal(s.cur.intact, true);
  const r = S({ scheme: 'rep', n: 3, failed: mask(1, 2) });
  assert.equal(r.cur.live, 1);
  assert.equal(r.cur.intact, true);
});

// ── rules ──

test('rule 1: overhead and efficiency, compared as fractions', () => {
  const ec = logic.evaluate({ kind: 'ec', k: 4, m: 2 }, 9, 0);
  assert.equal(ec.rawObj, 6 * MIB);
  assert.equal(ec.rawPct, 150);
  assert.equal(ec.piece, 1 * MIB);
  assert.deepEqual(ec.eff, { num: 4, den: 6 });
  const rep = logic.evaluate({ kind: 'rep', n: 3 }, 9, 0);
  assert.equal(rep.rawObj, 12 * MIB);
  assert.equal(rep.rawPct, 300);
  assert.equal(rep.piece, 4 * MIB);
  assert.equal(logic.cmpFrac(logic.efficiency({ kind: 'ec', k: 4, m: 2 }), logic.efficiency({ kind: 'ec', k: 2, m: 1 })), 0);
  assert.ok(logic.cmpFrac(logic.efficiency({ kind: 'ec', k: 8, m: 3 }), logic.efficiency({ kind: 'ec', k: 4, m: 2 })) > 0);
  const e83 = logic.evaluate({ kind: 'ec', k: 8, m: 3 }, 12, 0);
  assert.equal(e83.rawPct, 137.5);
  assert.equal(e83.rawObj, 5.5 * MIB);
  assert.equal(Math.round(e83.effPct * 10) / 10, 72.7);
});

test('rule 2: data survives n − 1 or m failures; one more loses it', () => {
  assert.equal(S({ scheme: 'rep', n: 4 }).cur.tolerated, 3);
  assert.equal(S({ scheme: 'ec', k: 8, m: 3, hosts: 12 }).cur.tolerated, 3);
  const lost = S({ scheme: 'ec', k: 4, m: 2, failed: mask(1, 2, 3) });
  assert.equal(lost.cur.intact, false);
  assert.equal(lost.cur.status, 'lost');
  assert.equal(lost.cur.plan, null);
  assert.equal(S({ scheme: 'rep', n: 3, failed: mask(1, 2, 3) }).cur.status, 'lost');
});

test('rule 3: default min_size: replication size − ⌊size/2⌋, EC k + min(1, m − 1); stopped below it', () => {
  assert.deepEqual([2, 3, 4].map((n) => logic.defaultMinSize({ kind: 'rep', n })), [1, 2, 2]);
  assert.equal(logic.defaultMinSize({ kind: 'ec', k: 4, m: 2 }), 5);
  assert.equal(logic.defaultMinSize({ kind: 'ec', k: 2, m: 1 }), 2);        // m = 1: k
  assert.equal(logic.defaultMinSize({ kind: 'ec', k: 4, m: 1 }), 4);
  assert.equal(S({ scheme: 'ec', k: 2, m: 1, failed: mask(1) }).cur.status, 'degraded');
  assert.equal(logic.defaultMinSize({ kind: 'ec', k: 8, m: 3 }), 9);
  const s = S({ scheme: 'ec', k: 4, m: 2, failed: mask(1, 2) });
  assert.equal(s.cur.intact, true);
  assert.equal(s.cur.active, false);
  assert.equal(s.cur.status, 'stopped');
  assert.equal(s.cur.ioTolerated, 1);
  assert.equal(S({ scheme: 'rep', n: 3, failed: mask(1, 2) }).cur.status, 'stopped');
});

test('rule 3: custom min_size applies to the current scheme only, clamped to 1–n or k–k+m', () => {
  const s = S({ scheme: 'ec', k: 4, m: 2, minSize: 'custom', minCustom: 4, failed: mask(1, 2) });
  assert.equal(s.cur.min, 4);
  assert.equal(s.cur.status, 'degraded');
  assert.equal(s.cur.ioTolerated, 2);
  assert.equal(s.alt.min, 2);                               // 3× keeps its default
  assert.equal(S({ scheme: 'ec', k: 4, m: 2, minSize: 'custom', minCustom: 1 }).cur.min, 4);
  assert.equal(S({ scheme: 'ec', k: 4, m: 2, minSize: 'custom', minCustom: 9 }).cur.min, 6);
  assert.equal(S({ scheme: 'rep', n: 3, minSize: 'custom', minCustom: 1 }).cur.min, 1);
  assert.equal(S({ scheme: 'rep', n: 3, minSize: 'custom', minCustom: 5 }).cur.min, 3);
  assert.equal(S({ scheme: 'ec', minSize: 'default', minCustom: 4 }).cur.min, 5);
  assert.deepEqual(logic.minRange({ kind: 'ec', k: 4, m: 2 }), [4, 6]);
});

test('rule 4: rebuild reads S for a copy, k shards of S/k for a shard; a disk: D vs k × D', () => {
  const r = S({ scheme: 'rep', n: 3, failed: mask(1) });
  assert.equal(r.cur.plan.read, 4 * MIB);
  assert.equal(r.cur.plan.write, 4 * MIB);
  assert.deepEqual(r.cur.plan.sources, [1]);
  assert.equal(r.cur.rebuildDisk, 8 * TB);
  const e = S({ scheme: 'ec', k: 4, m: 2, failed: mask(1) });
  assert.equal(e.cur.plan.read, 4 * MIB);
  assert.equal(e.cur.plan.write, 1 * MIB);
  assert.equal(e.cur.plan.sources.length, 4);
  assert.equal(e.cur.rebuildDisk, 32 * TB);
  assert.equal(logic.rebuildRead({ kind: 'ec', k: 8, m: 3 }, 8 * TB), 64 * TB);
  assert.equal(S({}).cur.plan, null);                       // nothing lost, nothing to rebuild
});

test('rule 4: no free host up → a plan without a target', () => {
  const s = S({ scheme: 'ec', k: 4, m: 2, hosts: 6, failed: mask(1) });
  assert.equal(s.cur.plan.target, null);
  assert.equal(S({ scheme: 'ec', k: 4, m: 2, hosts: 7, failed: mask(1, 7) }).cur.plan.target, null);
  assert.ok(logic.captionKey(s).notes.includes('nNoSpare'));
});

test('rule 5: pieces on distinct hosts in order; too few hosts leaves holes that count as missing', () => {
  const s = S({ scheme: 'ec', k: 4, m: 2, hosts: 9 });
  assert.deepEqual(s.cur.pieces.map((x) => x.host), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(s.cur.pieces.map((x) => x.label), ['d1', 'd2', 'd3', 'd4', 'c1', 'c2']);
  assert.deepEqual(s.alt.pieces.map((x) => x.label), ['R1', 'R2', 'R3']);
  const few = S({ scheme: 'ec', k: 4, m: 2, hosts: 5 });
  assert.equal(few.cur.placeable, false);
  assert.equal(few.cur.holes, 1);
  assert.equal(few.cur.pieces[5].host, null);
  assert.equal(few.cur.status, 'degraded');                 // 5 live = min_size 5
  assert.equal(logic.captionKey(few).key, 'cHoles');
  const e83 = S({ scheme: 'ec', k: 8, m: 3, hosts: 9 });
  assert.equal(e83.cur.holes, 2);
  assert.equal(e83.cur.live, 9);
  assert.equal(e83.cur.status, 'degraded');
  assert.equal(S({ scheme: 'ec', k: 8, m: 3, hosts: 8 }).cur.status, 'stopped');
  assert.equal(S({ scheme: 'ec', k: 8, m: 3, hosts: 7 }).cur.status, 'lost');
});

test('rule 5: failed bits at or above the host count are ignored; the mask is clamped', () => {
  const s = S({ hosts: 4, failed: mask(5, 9) });
  assert.deepEqual(s.failed, []);
  assert.equal(S({ failed: 99999 }).p.failed, 4095);
  assert.equal(logic.toggleHost(0, 2), 4);
  assert.equal(logic.toggleHost(4, 2), 0);
});

test('rule 7: a click marks the host that changed and the plans that changed', () => {
  const a = S({ failed: 0 });
  const b = S({ failed: mask(2) });
  const ch = logic.changed(a, b);
  assert.deepEqual(ch.hosts, [1]);
  assert.deepEqual(ch.plan, { cur: true, alt: true });
  const c = S({ failed: mask(2, 8) });                      // h8 holds nothing: the plans stay
  assert.deepEqual(logic.changed(b, c), { hosts: [7], plan: { cur: false, alt: false } });
  assert.deepEqual(logic.changed(null, a), { hosts: [], plan: { cur: false, alt: false } });
});

test('captions: status picks the key; notes for no margin, no spare, a twin', () => {
  assert.equal(logic.captionKey(S({ scheme: 'ec' })).key, 'cOkEc');
  assert.equal(logic.captionKey(S({ scheme: 'rep' })).key, 'cOkRep');
  assert.equal(logic.captionKey(S({ failed: mask(1) })).key, 'cDegraded');
  assert.equal(logic.captionKey(S({ failed: mask(1, 2) })).key, 'cStopped');
  assert.equal(logic.captionKey(S({ failed: mask(1, 2, 3) })).key, 'cLost');
  const k = logic.captionKey(S({ scheme: 'ec', k: 4, m: 2 }));
  assert.deepEqual(k.notes, ['nTwin']);
  assert.equal(k.twin.name, '6+3');
  assert.equal(logic.captionKey(S({ scheme: 'rep', n: 3 })).twin, null);
  assert.deepEqual(logic.captionKey(fromPreset('min-size-k')).notes, ['nRebuild', 'nNoMargin']);
  assert.deepEqual(logic.captionKey(S({ scheme: 'rep', n: 3, minSize: 'custom', minCustom: 1, failed: mask(1, 2) })).notes, ['nRebuild', 'nNoMargin']);
  assert.deepEqual(logic.captionKey(S({ hosts: 5, failed: mask(1) })).notes, ['nHoles', 'nNoSpare']);
});

test('rule 7: a click that only moves the rebuild sources marks the plan', () => {
  const a = S({ failed: mask(1) }), b = S({ failed: mask(1, 3) });
  assert.equal(a.cur.plan.piece, b.cur.plan.piece);
  assert.equal(a.cur.plan.target, b.cur.plan.target);
  assert.notDeepEqual(a.cur.plan.sources, b.cur.plan.sources);
  assert.deepEqual(logic.changed(a, b).plan, { cur: true, alt: false });   // 3× still reads R2
  // only the compared scheme's plan moves: h5 holds a 4+2 shard, not a 3× copy
  const r1 = S({ scheme: 'rep', failed: mask(1) }), r2 = S({ scheme: 'rep', failed: mask(1, 5) });
  assert.deepEqual(logic.changed(r1, r2).plan, { cur: false, alt: true });
});

test('rule 5: exactly as many hosts as pieces is placeable', () => {
  assert.equal(S({ scheme: 'ec', k: 4, m: 2, hosts: 6 }).cur.placeable, true);
  assert.equal(S({ scheme: 'ec', k: 4, m: 2, hosts: 5 }).cur.placeable, false);
});

test('the host list follows the host count and the mask', () => {
  const s = S({ hosts: 12, failed: mask(10, 12) });
  assert.equal(s.hosts.length, 12);
  assert.deepEqual(s.hosts.filter((x) => !x.up).map((x) => x.id), [9, 11]);
  assert.deepEqual(s.failed, [9, 11]);
});

test('twins and the alternative share the failures (table row "Now")', () => {
  const s = fromPreset('ec-4-2');
  const by = Object.fromEntries(s.cols.map((c) => [c.name, c]));
  assert.equal(by['6+3'].status, 'degraded');                 // 7 of 9, min_size 7
  assert.equal(by['2+1'].status, 'lost');                     // 1 of 3, needs 2
  assert.equal(by['3×'].status, 'stopped');
});

test('captions: holes only → the holes sentence and a status sentence; no "hosts down"', () => {
  assert.deepEqual(logic.captionKey(S({ scheme: 'ec', k: 8, m: 3, hosts: 8 })), { key: 'cHoles', notes: ['sStopped'], twin: null });
  assert.deepEqual(logic.captionKey(S({ scheme: 'ec', k: 8, m: 3, hosts: 7 })).notes, ['sLost']);
  assert.deepEqual(logic.captionKey(S({ scheme: 'ec', k: 8, m: 3, hosts: 9 })).notes, ['sDegraded']);
  // a down host that holds no piece is not a lost piece
  assert.equal(S({ scheme: 'rep', n: 3, failed: mask(1, 8) }).cur.lost, 1);
});

test('captions: no-margin note only when the live pieces are exactly what the data needs', () => {
  assert.ok(!logic.captionKey(S({ scheme: 'ec', minSize: 'custom', minCustom: 4, failed: mask(1) })).notes.includes('nNoMargin'));
});

test('captions: the twin note names only a twin that fits on the hosts', () => {
  assert.equal(logic.captionKey(S({ scheme: 'ec', k: 4, m: 2, hosts: 6 })).twin.name, '2+1');
  assert.equal(logic.captionKey(S({ scheme: 'ec', k: 4, m: 2, hosts: 9 })).twin.name, '6+3');
});

test('defaults and rounding of params', () => {
  assert.deepEqual(logic.defaults, { scheme: 'ec', n: 3, k: 4, m: 2, minSize: 'default', minCustom: 4, hosts: 9, failed: 0 });
  assert.equal(logic.norm({ k: 4.6 }).k, 5);
  assert.equal(logic.norm({ scheme: 'ec', k: 4, m: 2, minSize: 'custom', minCustom: 4.6 }).minCustom, 5);
  assert.deepEqual(logic.RANGE.n, [2, 4]);
  assert.deepEqual(logic.RANGE.k, [2, 8]);
  assert.deepEqual(logic.RANGE.m, [1, 3]);
  assert.deepEqual(logic.RANGE.hosts, [3, 12]);
});

test('preset params are pinned (SPEC presets table)', () => {
  const pp = (id) => logic.norm(Object.assign({}, logic.defaults, preset(id).params));
  assert.deepEqual(pp('three-copies'), { scheme: 'rep', n: 3, k: 4, m: 2, minSize: 'default', minCustom: 3, hosts: 9, failed: mask(1) });
  assert.deepEqual(pp('ec-4-2'), { scheme: 'ec', n: 3, k: 4, m: 2, minSize: 'default', minCustom: 4, hosts: 9, failed: mask(1, 2) });
  assert.deepEqual(pp('ec-8-3'), { scheme: 'ec', n: 3, k: 8, m: 3, minSize: 'default', minCustom: 8, hosts: 12, failed: mask(1) });
  assert.deepEqual(pp('same-hardware'), { scheme: 'rep', n: 3, k: 4, m: 2, minSize: 'default', minCustom: 3, hosts: 9, failed: 0 });
  assert.deepEqual(pp('min-size-k'), { scheme: 'ec', n: 3, k: 4, m: 2, minSize: 'custom', minCustom: 4, hosts: 9, failed: mask(1, 2) });
  assert.equal(fromPreset('ec-4-2').cur.plan.target, 6);
  assert.deepEqual(fromPreset('ec-4-2').cur.plan.sources, [2, 3, 4, 5]);
  assert.equal(fromPreset('ec-8-3').cur.plan.piece, 0);
  assert.equal(fromPreset('three-copies').cur.plan.piece, 0);
});

// ── presets (SPEC.md table) ──

test('preset three-copies: 300 %, 33 %, survives 2, I/O after 1, rebuild of an 8 TB disk reads 8 TB', () => {
  const s = fromPreset('three-copies');
  assert.equal(s.cur.name, '3×');
  assert.equal(s.cur.rawPct, 300);
  assert.equal(Math.round(s.cur.effPct), 33);
  assert.equal(s.cur.tolerated, 2);
  assert.equal(s.cur.ioTolerated, 1);
  assert.equal(s.cur.status, 'degraded');
  assert.equal(s.cur.plan.target, 3);
  assert.equal(s.cur.rebuildDisk, 8 * TB);
});

test('preset ec-4-2: 150 %, 67 %, min_size 5; two hosts down: complete but stopped; 8 TB disk reads 32 TB', () => {
  const s = fromPreset('ec-4-2');
  assert.equal(s.cur.name, '4+2');
  assert.equal(s.cur.rawPct, 150);
  assert.equal(Math.round(s.cur.effPct), 67);
  assert.equal(s.cur.min, 5);
  assert.deepEqual(s.failed, [0, 1]);
  assert.equal(s.cur.live, 4);
  assert.equal(s.cur.status, 'stopped');
  assert.equal(s.cur.rebuildDisk, 32 * TB);
  assert.equal(s.alt.status, 'stopped');                    // 3× on h1–h3 lost two of three, below min_size 2
});

test('preset ec-8-3: 137.5 %, 72.7 %, survives 3, needs 11 hosts, rebuild reads 8 ×', () => {
  const s = fromPreset('ec-8-3');
  assert.equal(s.cur.rawPct, 137.5);
  assert.equal(s.cur.tolerated, 3);
  assert.equal(s.cur.ioTolerated, 2);
  assert.equal(s.cur.hostsNeeded, 11);
  assert.equal(s.cur.plan.target, 11);
  assert.equal(s.cur.plan.sources.length, 8);
  assert.equal(s.cur.plan.read / s.cur.plan.write, 8);
});

test('preset same-hardware: 60 TiB needs 180 TiB raw with 3×, 90 TiB with 4+2', () => {
  const s = fromPreset('same-hardware');
  assert.equal(s.cur.rawPool, 180 * TIB);
  assert.equal(s.alt.rawPool, 90 * TIB);
  assert.equal(logic.POOL_DATA, 65970697666560);           // cephsim threeRacks cephfs_data stored
  assert.deepEqual(s.failed, []);
});

test('preset min-size-k: 4+2 with min_size 4 keeps I/O through two failures', () => {
  const s = fromPreset('min-size-k');
  assert.equal(s.cur.min, 4);
  assert.equal(s.cur.live, 4);
  assert.equal(s.cur.status, 'degraded');
  assert.equal(fromPreset('ec-4-2').cur.status, 'stopped');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const pr of logic.presets) {
    const s = fromPreset(pr.id);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic, does not mutate its params, and cleans bad input', () => {
  const p = P({ scheme: 'rep', n: 4, failed: 5 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
  const bad = logic.norm({ scheme: 'x', n: 'a', k: 99, m: -1, hosts: 2, minSize: 'y', failed: -3 });
  assert.deepEqual(bad, { scheme: 'ec', n: 3, k: 8, m: 1, minSize: 'default', minCustom: 9, hosts: 3, failed: 0 });
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key and preset has its strings; the page is an explorer; preset params are known params', () => {
  const keys = ['cOkEc', 'cOkRep', 'cDegraded', 'cHoles', 'cStopped', 'cLost', 'sDegraded', 'sStopped', 'sLost', 'nHoles', 'nRebuild', 'nNoMargin', 'nNoSpare', 'nTwin'];
  for (const key of keys) assert.ok(key in strings.hr && key in strings.en, key);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries || []) assert.ok(preset(e.preset), e.preset);
  for (const pr of logic.presets) assert.ok(html.includes(`'${pr.id}'`), `page labels preset ${pr.id}`);
});
