// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for smallest-disk-caps's model (rules: SPEC.md). Run: node --test sims/smallest-disk-caps/
// Tie-breaks first, then one test per rule, the placement (crush.js against the cephsim engine's output), the presets'
// numbers, then the template's generic block. tools/check-engine.mjs compares crush.js with the engine over every lab
// cluster; the golden sets below pin it without importing another sim's folder.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const crush = require('./crush.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.filter((x) => x.id === id)[0];
const fromPreset = (id) => S(preset(id).params);
const osd = (s, id) => logic.osdOf(s, id);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b} (±${tol})`);

// ── tie-breaks ──

test('rule 8 tie-break: equal fill → the fullest shown is the lowest id (one-small-disk: osd.12 and osd.14 equal)', () => {
  const s = fromPreset('one-small-disk');
  assert.equal(osd(s, 12).ratio, osd(s, 14).ratio);           // both hold every PG: exactly equal
  assert.equal(s.fullest, 12);
  assert.equal(s.maxAvailOsd, 12);                            // the MAX AVAIL projection ties the same way
  // the same cluster with the small hosts swapped in id order would still pick the lower id: not osd.14
  assert.notEqual(s.fullest, 14);
});

test('rule 8 tie-break: on an empty pool the marker stays on the OSD that will fill first, not osd.0', () => {
  const s = S({ storedTiB: 0 });
  s.osds.forEach((o) => assert.equal(o.ratio, 0));
  assert.equal(s.fullest, 15);
  assert.equal(S({}).fullest, 15);
});

test('rule 8 tie-break: MAX AVAIL on an empty pool ties every OSD (equal weights) → the lowest id', () => {
  const s = S({ storedTiB: 0 });
  assert.equal(s.maxAvailOsd, 0);
  near(s.maxAvailTiB, 128 * 0.95 / 3, 1e-9, 'empty pool projects 0.95 × raw ÷ size');
});

test('rule 8 tie-breaks hold in any input order (a higher id seen first)', () => {
  const list = [{ id: 9, r: 0.5 }, { id: 3, r: 0.5 }, { id: 7, r: 0.4 }];
  assert.equal(logic.argmax(list, (o) => o.r), 3);
  const osds = [9, 3, 7].map((id) => ({ id, weight: 8, sizeTiB: 8, usedTiB: id === 7 ? 1 : 4 }));
  assert.equal(logic.maxAvail(osds, 3).osd, 3);
  near(logic.maxAvail(osds, 3).tib, (8 * 0.95 - 4) * 3 / 3, 1e-9);
});

// ── rules ──

test('rule 1: each OSD holds the bytes of the PGs placed on it; raw totals over the OSDs that are in', () => {
  const p = P({});
  const pl = logic.labPlacement(p);
  const s = logic.compute(p);
  const bytes = pl.raw.map((set, ps) => crush.pgBytes(1, 256, ps, 1, 0.25) / pl.skewSum);
  const want = {};
  pl.raw.forEach((set, ps) => set.forEach((o) => { want[o] = (want[o] || 0) + p.storedTiB * bytes[ps]; }));
  s.osds.forEach((o) => near(o.usedTiB, want[o.id] || 0, 1e-9, `osd.${o.id}`));
  const used = s.osds.reduce((a, o) => a + o.usedTiB, 0);
  near(s.rawUsedTiB, used, 1e-9);
  near(s.rawTiB, 16 * 8, 1e-9);
  near(s.rawRatio, used / 128, 1e-12);
  // the per-PG sizes add up to exactly the stored data: with no short PG the pool uses stored × size
  const full3 = fromPreset('one-small-disk');
  assert.equal(full3.short, 0);
  near(full3.rawUsedTiB, 3 * 0.4, 1e-9);
  // HQ: the out OSD (osd.22) is left out of raw capacity, as ceph df's TOTAL 210.6 TiB
  const hq = S({ cluster: 'hq' });
  near(hq.rawTiB, 210.59, 0.005);
});

test('rule 2: thresholds 85 / 90 / 95 % of the OSD\'s size; the level is the highest reached', () => {
  assert.deepEqual(logic.RATIOS, { nearfull: 0.85, backfillfull: 0.90, full: 0.95 });
  assert.equal(logic.levelOf(0.8499), 'ok');
  assert.equal(logic.levelOf(0.85), 'nearfull');
  assert.equal(logic.levelOf(0.8999), 'nearfull');
  assert.equal(logic.levelOf(0.90), 'backfillfull');
  assert.equal(logic.levelOf(0.95), 'full');
  assert.equal(logic.levelOf(1.2), 'full');
  // osd.15 (52.2 % at 8 TiB) crosses nearfull between 13.0 and 13.1 TiB stored, backfillfull by 14.5
  assert.equal(osd(S({ storedTiB: 13 }), 15).level, 'ok');
  assert.equal(osd(S({ storedTiB: 13.1 }), 15).level, 'nearfull');
  assert.equal(osd(S({ storedTiB: 14 }), 15).level, 'backfillfull');
  const s = S({ storedTiB: 14 });
  assert.equal(s.counts.full, 0);
  assert.equal(s.counts.backfillfull, 2);              // osd.15 91.4 %, osd.13 90.5 %; osd.12 and osd.14 below 85 %
  assert.equal(osd(S({ cluster: 'hq' }), 22).level, 'out');
});

test('rule 3: MAX AVAIL = min (size × 0.95 − used) / weight share, × 1/size; raw free does not enter it', () => {
  const s = S({});
  const W = s.osds.reduce((a, o) => a + o.weight, 0);
  let min = Infinity;
  s.osds.forEach((o) => { min = Math.min(min, (o.sizeTiB * 0.95 - o.usedTiB) / (o.weight / W)); });
  near(s.maxAvailTiB, min / 3, 1e-9);
  near(s.maxAvailTiB, 18.24, 0.005, 'preset 1');
  assert.equal(s.maxAvailOsd, 15);
  assert.ok(s.maxAvailTiB < s.naiveTiB / 1.8, 'far below raw free ÷ 3');
  // the same used bytes with a size-2 projection: only the efficiency factor changes the formula's scale
  // HQ: osd.13 at 88.6 % decides; the out osd.22 is not in the weight sum (3.40 TiB; 3.57 with it)
  const hq = S({ cluster: 'hq' });
  assert.equal(hq.maxAvailOsd, 13);
  near(hq.maxAvailTiB, 3.397, 0.001);
});

test('rule 4: size 3 on three hosts → every host holds a full copy, whatever its disk count', () => {
  for (const [small, big] of [[2, 8], [3, 12], [6, 2], [1, 4]]) {
    const s = S({ smallHostDisks: small, bigHostDisks: big });
    assert.equal(s.short, 0, `${small}/${big}`);
    s.hosts.forEach((x) => near(x.usedTiB, s.storedTiB, 1e-9, `${x.name} ${small}/${big}`));
  }
  // so the host with fewer disks fills faster: per OSD ≈ stored / its disks
  const s = S({});
  assert.ok(s.hosts[1].minRatio > 4 * s.hosts[0].maxRatio);
  // size 2: a PG takes two of the three hosts by weight; no host holds a full copy
  const two = S({ size: 2 });
  two.hosts.forEach((x) => assert.ok(x.usedTiB < two.storedTiB - 0.1, x.name));
});

test('rule 4: different disk sizes alone do not unbalance (CRUSH weights by size)', () => {
  // three hosts of 16 TiB each: 2 × 8, 8 × 2, 4 × 4; every disk fills at about the same rate
  const hosts = [
    { name: 'a', osds: [0, 1].map((id) => ({ id, weight: 8 })) },
    { name: 'b', osds: [2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({ id, weight: 2 })) },
    { name: 'c', osds: [10, 11, 12, 13].map((id) => ({ id, weight: 4 })) }
  ];
  const map = crush.buildMap(hosts);
  const rw = []; for (let i = 0; i < 14; i++) rw[i] = 1;
  const raw = crush.mapPool(map, { id: 1, pgNum: 256, size: 3 }, rw);
  const per = {};
  raw.forEach((set, ps) => set.forEach((o) => { per[o] = (per[o] || 0) + crush.pgBytes(1, 256, ps, 1, 0.25); }));
  const meanRatio = (ids, w) => ids.reduce((a, id) => a + per[id] / w, 0) / ids.length;
  const r8 = meanRatio([0, 1], 8), r2 = meanRatio([2, 3, 4, 5, 6, 7, 8, 9], 2), r4 = meanRatio([10, 11, 12, 13], 4);
  for (const r of [r2, r4]) near(r / r8, 1, 0.1, 'per-size mean fill');
  // whereas uneven hosts (preset 1) differ five times and more
  const s = S({});
  assert.ok(s.hosts[2].minRatio / s.hosts[0].maxRatio > 4);
});

test('rule 5: adding disks to the big host does not move the cap; raw capacity grows', () => {
  const a = S({}), b = fromPreset('add-to-big-host');
  near(b.rawTiB / a.rawTiB, 160 / 128, 1e-9);
  near(b.fullAtTiB / a.fullAtTiB, 1, 0.05, 'cap within 5 %');
  // the small hosts still hold a full copy each
  for (const x of b.hosts.slice(1)) near(x.usedTiB, b.storedTiB, 0.02 * b.storedTiB, x.name);
  // their OSD ids did not change (slots are fixed per host)
  assert.deepEqual(b.hosts[1].osds, [12, 13]);
  assert.deepEqual(b.hosts[2].osds, [14, 15]);
  assert.deepEqual(b.hosts[0].osds, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16, 17, 18, 19]);
  // and Ceph's projection rises anyway: it assumes the new weight takes new data
  assert.ok(b.maxAvailTiB > a.maxAvailTiB * 1.2);
});

test('rule 6: fits before full = stored × 0.95 / fullest ratio − stored; MAX AVAIL over-promises with uneven hosts', () => {
  const s = S({});
  const f = osd(s, s.fullest);
  near(s.fullAtTiB, s.storedTiB * 0.95 / f.ratio, 1e-9);
  near(s.headroomTiB, s.fullAtTiB - s.storedTiB, 1e-12);
  near(s.fullAtTiB, 14.548, 0.001);
  assert.ok(s.maxAvailTiB > 2.5 * s.headroomTiB, 'preset 1: 18.2 promised, 6.5 fits');
  // at exactly fullAt the fullest stands at 95 %
  const at = S({ storedTiB: s.fullAtTiB - 1e-6 });
  near(osd(at, 15).ratio, 0.95, 1e-6);
  // scale-free: the same cap at any stored amount below it
  near(S({ storedTiB: 2 }).fullAtTiB, s.fullAtTiB, 1e-9);
  assert.equal(S({ cluster: 'hq' }).headroomTiB, null);
});

test('rule 7: data beyond the cap is refused; the deciding OSD stands at 95 %, the pool is full', () => {
  const s = S({ storedTiB: 20 });
  assert.equal(s.full, true);
  near(s.storedTiB, 14.548, 0.001);
  near(s.refusedTiB, 20 - s.storedTiB, 1e-12);
  assert.equal(s.askedTiB, 20);
  assert.equal(osd(s, s.fullest).ratio, 0.95);
  assert.equal(osd(s, s.fullest).level, 'full');
  assert.equal(s.counts.full, 1);
  assert.equal(s.headroomTiB, 0);
  near(s.maxAvailTiB, 0, 1e-9);
  near(s.rawRatio, 0.34, 0.005, 'while raw used is about a third');
  assert.equal(S({ storedTiB: 14 }).full, false);
  // the boundary: just past the cap is refused, just under it is not
  const cap = S({}).fullAtTiB;
  assert.equal(S({ storedTiB: cap + 0.005 }).full, true);
  assert.equal(S({ storedTiB: cap - 0.005 }).full, false);
  assert.deepEqual(logic.captionKey(s).notes, []);            // a full pool gets no note
});

test('a host holds a full copy only with a copy of every PG; HQ host rows leave the out OSD out', () => {
  const s = S({});
  assert.deepEqual(s.hosts.map((x) => x.pgs), [256, 255, 256]);   // PG 127 is [11, 15]: no copy on ceph-small-1
  assert.deepEqual(s.hosts.map((x) => x.fullCopy), [true, false, true]);
  const hq = S({ cluster: 'hq' });
  near(hq.hosts[3].minRatio, 0.3629, 0.0001, 'hq-pve-04 without osd.22');
  hq.hosts.forEach((x) => assert.equal(x.fullCopy, false));
});

test('presets stay within the param ranges', () => {
  for (const pr of logic.presets) {
    const p = P(pr.params);
    assert.ok(p.smallHostDisks >= logic.RANGE.smallHostDisks[0] && p.smallHostDisks <= logic.RANGE.smallHostDisks[1], pr.id);
    assert.ok(p.bigHostDisks >= logic.RANGE.bigHostDisks[0] && p.bigHostDisks <= logic.RANGE.bigHostDisks[1], pr.id);
    assert.ok(p.storedTiB >= 0 && p.storedTiB <= logic.storedMax(p) + 1e-9, pr.id);
    assert.ok(logic.DISKS.includes(p.diskGiB), pr.id);
  }
  assert.deepEqual(logic.RANGE.bigHostDisks, [2, 16]);
});

test('rule 9: changed = OSDs whose level differs; nothing across clusters; added OSDs are not marked', () => {
  const a = S({ storedTiB: 13 }), b = S({ storedTiB: 14 });
  const ch = logic.changed(a, b);
  assert.ok(ch.includes(15));
  ch.forEach((id) => assert.notEqual(osd(a, id).level, osd(b, id).level));
  assert.deepEqual(logic.changed(a, a), []);
  assert.deepEqual(logic.changed(a, S({ cluster: 'hq' })), []);
  assert.deepEqual(logic.changed(null, a), []);
  const more = logic.changed(S({ storedTiB: 14 }), S({ storedTiB: 14, bigHostDisks: 16 }));
  [16, 17, 18, 19].forEach((id) => assert.ok(!more.includes(id)));
});

// ── placement ──

test('crush.js: preset 1 gives the cephsim engine\'s sets (golden values from the engine)', () => {
  const pl = logic.labPlacement(P({}));
  assert.deepEqual(pl.raw.slice(0, 8), [[8, 12, 14], [5, 14, 12], [12, 9, 14], [4, 14, 13], [3, 13, 15], [4, 14, 12], [6, 15, 12], [6, 13, 15]]);
  assert.deepEqual(pl.raw[127], [11, 15]);                     // the one PG CRUSH could not give a third host
  assert.equal(pl.short, 1);
  near(pl.skewSum, 1.013948, 1e-6);
});

test('crush.js: OSD ids are fixed per host slot; bucket weights are the sums of their disks', () => {
  assert.deepEqual([0, 11, 12, 15].map((k) => logic.slotId(0, k)), [0, 11, 16, 19]);
  assert.deepEqual([0, 1, 2, 11].map((k) => logic.slotId(1, k)), [12, 13, 20, 29]);
  assert.deepEqual([0, 1, 2, 11].map((k) => logic.slotId(2, k)), [14, 15, 30, 39]);
  const map = crush.buildMap(logic.labHosts(P({})));
  assert.deepEqual(map.buckets[-1].items, [-2, -3, -4]);
  assert.deepEqual(map.buckets[-1].weights, [96, 16, 16]);
  assert.equal(map.buckets[-3].weight, 16);
  // every set is on distinct hosts
  const pl = logic.labPlacement(P({ smallHostDisks: 5, bigHostDisks: 9 }));
  const hostOf = (id) => (id < 12 || (id >= 16 && id < 20) ? 0 : (id === 12 || id === 13 || (id >= 20 && id < 30)) ? 1 : 2);
  pl.raw.forEach((set) => assert.equal(new Set(set.map(hostOf)).size, set.length));
});

test('the stored slider ends at 2.5 disks\' worth, on its step', () => {
  assert.equal(logic.storedMax(P({})), 20);
  near(logic.storedMax(P({ diskGiB: 2048 })), 5, 1e-9);
  near(logic.storedMax(P({ diskGiB: 447 })), 1.05, 1e-9);
});

// ── presets ──

test('preset 1 unbalanced: cephsim `unbalanced` — small hosts ≈ 48–52 %, big ≈ 7–11 %, raw 19 %, osd.15 decides', () => {
  const s = fromPreset('unbalanced');
  near(s.hosts[1].minRatio, 0.478, 0.001); near(s.hosts[2].maxRatio, 0.522, 0.001);
  near(s.hosts[0].minRatio, 0.067, 0.001); near(s.hosts[0].maxRatio, 0.110, 0.001);
  near(s.rawRatio, 0.187, 0.001);
  near(s.maxAvailTiB, 18.24, 0.005);
  near(s.naiveTiB, 34.68, 0.005);
  assert.equal(s.fullest, 15);
  near(osd(s, 15).ratio, 0.522, 0.001);
  assert.deepEqual(logic.captionKey(s), { key: 'cCopy', notes: ['nOver'] });
});

test('preset 2 add-to-big-host: small hosts still ≈ 50 %, the cap moves 3 %', () => {
  const s = fromPreset('add-to-big-host');
  near(s.hosts[1].maxRatio, 0.496, 0.001);
  near(osd(s, 15).ratio, 0.506, 0.001);
  assert.equal(s.fullest, 15);
  near(s.fullAtTiB, 15.03, 0.005);
  near(s.maxAvailTiB, 23.71, 0.005);
});

test('preset 3 fill-it: 14 TiB → osd.15 past backfillfull, raw used a third; full at 14.5 TiB', () => {
  const s = fromPreset('fill-it');
  near(osd(s, 15).ratio, 0.914, 0.001);
  assert.equal(osd(s, 15).level, 'backfillfull');
  near(s.rawRatio, 0.328, 0.001);
  near(s.fullAtTiB, 14.548, 0.001);
  assert.deepEqual(logic.captionKey(s), { key: 'cCopy', notes: ['nLevel'] });
});

test('preset 4 one-small-disk: a 447 GiB disk holds every PG; the pool takes at most 0.95 × 447 GiB', () => {
  const s = fromPreset('one-small-disk');
  near(osd(s, 12).ratio, 409.6 / 447, 1e-9);
  assert.equal(osd(s, 12).level, 'backfillfull');
  near(s.fullAtTiB * 1024, 0.95 * 447, 1e-6);
  // whatever the big host has
  for (const big of [2, 8]) near(S(Object.assign({}, preset('one-small-disk').params, { bigHostDisks: big })).fullAtTiB * 1024, 424.65, 1e-6);
  near(s.rawRatio, 3 * 409.6 / (6 * 447), 1e-9);
});

test('preset 5 dr-38-percent: raw 37.88 %, vm-rbd MAX AVAIL 3.4 TiB, osd.13 nearfull decides', () => {
  const s = fromPreset('dr-38-percent');
  near(s.rawRatio, 0.3788, 0.0001);
  near(s.maxAvailTiB, 3.4, 0.005);
  assert.equal(s.fullest, 13);
  assert.equal(osd(s, 13).level, 'nearfull');
  assert.equal(s.counts.nearfull, 1);
  near(s.naiveTiB, 65.41, 0.005);
  assert.equal(s.pool.name, 'vm-rbd');
  assert.deepEqual(logic.captionKey(s), { key: 'cHq', notes: ['nHqNaive'] });
});

test('captions: empty, full, size 2, even hosts, and a host with nearly as many disks', () => {
  assert.equal(logic.captionKey(S({ storedTiB: 0 })).key, 'cEmpty');
  assert.equal(logic.captionKey(S({ storedTiB: 20 })).key, 'cFull');
  assert.equal(logic.captionKey(S({ size: 2 })).key, 'cSize2');
  assert.equal(logic.captionKey(S({ smallHostDisks: 4, bigHostDisks: 4 })).key, 'cEven');
  assert.equal(logic.captionKey(S({ smallHostDisks: 10, bigHostDisks: 9 })).key, 'cCopyOther');
  // the over-promise note only when MAX AVAIL promises 20 % more than fits
  const even = S({ smallHostDisks: 4, bigHostDisks: 4 });
  assert.ok(even.maxAvailTiB <= 1.2 * even.headroomTiB);
  assert.deepEqual(logic.captionKey(even).notes, []);
  for (const [sm, bg] of [[11, 12], [12, 12], [2, 12], [12, 2]]) {
    const s = S({ smallHostDisks: sm, bigHostDisks: bg });
    const k = logic.captionKey(s).key;
    const hst = s.hosts[osd(s, s.fullest).host];
    if (k === 'cCopy') assert.ok(s.hosts.every((x) => x.disks >= hst.disks));
    else assert.ok(k === 'cEven' || k === 'cCopyOther', k);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const pr of logic.presets) {
    const s = fromPreset(pr.id);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('deterministic: the same params give the same state', () => {
  for (const pr of logic.presets) assert.deepEqual(fromPreset(pr.id), fromPreset(pr.id));
  assert.deepEqual(S({ smallHostDisks: 7, bigHostDisks: 3, diskGiB: 2048, storedTiB: 1.5, size: 2 }),
    S({ smallHostDisks: 7, bigHostDisks: 3, diskGiB: 2048, storedTiB: 1.5, size: 2 }));
});

test('both string tables have the same keys and forms', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key and preset has its strings; the page is an explorer; preset params are known params', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const lang of ['hr', 'en']) {
    for (const k of ['cCopy', 'cEven', 'cCopyOther', 'cSize2', 'cEmpty', 'cFull', 'cHq', 'nLevel', 'nOver', 'nAdded', 'nHqNaive']) assert.ok(strings[lang][k], `${lang}.${k}`);
    for (const l of logic.LEVELS.concat(['out'])) assert.ok(strings[lang]['lvl_' + l], `${lang}.lvl_${l}`);
  }
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries || []) assert.ok(preset(e.preset), e.preset);
  for (const pr of logic.presets) assert.ok(html.includes(`'${pr.id}'`), `page labels preset ${pr.id}`);
});
