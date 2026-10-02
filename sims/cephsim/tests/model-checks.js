// SPDX-License-Identifier: AGPL-3.0-or-later
// Document + compiler checks. DOM-free, same shape as engine-checks.js.
//
// The engine is tested on its own properties; this file tests the translation
// into it — that the tree the UI edits becomes the CRUSH map you meant, and that
// the remap cache invalidates on exactly the right things and no others.

import {
  state, newDoc, loadDoc, addHost, addOsd, addBucketNode, addSwitchNode, addLink,
  removeIds, commit, undo, redo, canUndo, canRedo, migrate, allOsds, nextOsdId,
  resetHistory, changed,
} from '../js/model.js';
import {
  compileMap, structuralSignature, reweightsFor, downSet, getMap, evaluate,
  invalidate, ruleSteps,
} from '../js/compile.js';
import { doRule, NONE } from '../js/engine/crush.js';
import { devicesUnder, ancestry } from '../js/engine/crushmap.js';
import { TiB } from '../js/engine/capacity.js';

export const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, detail: fn() || '' }); }
  catch (err) { results.push({ name, pass: false, detail: err.message }); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

/** 3 racks x 3 hosts x (2 SSD + 4 HDD), drawn the way the UI would build it. */
function sampleDoc() {
  loadDoc(newDoc('test cluster'));
  const root = state.doc.buckets[0].id;
  for (let r = 0; r < 3; r++) {
    const rack = addBucketNode(`rack${r}`, 'rack', root);
    for (let h = 0; h < 3; h++) {
      const host = addHost(`h${r}-${h}`, h * 200, r * 200, { parent: rack.id });
      for (let i = 0; i < 2; i++) addOsd(host, { size: 2, cls: 'ssd' });
      for (let i = 0; i < 4; i++) addOsd(host, { size: 8, cls: 'hdd' });
      if (h === 0) host.daemons.push('mon', 'mgr');
    }
  }
  state.doc.rules = [
    { id: 0, name: 'replicated_rule', type: 'replicated', root: 'default', class: null,
      failureDomain: 'host', mode: 'firstn' },
    { id: 1, name: 'by-rack', type: 'replicated', root: 'default', class: null,
      failureDomain: 'rack', mode: 'firstn' },
    { id: 2, name: 'ssd-rule', type: 'replicated', root: 'default', class: 'ssd',
      failureDomain: 'host', mode: 'firstn' },
  ];
  state.doc.pools = [
    { id: 1, name: 'rbd', type: 'replicated', size: 3, min_size: 2, pg_num: 256,
      pgp_num: 256, crush_rule: 'replicated_rule', stored: 20 * TiB },
  ];
  invalidate();
  return state.doc;
}

// ----------------------------------------------------------------- model ----
check('a new document has a root bucket and a default rule', () => {
  loadDoc(newDoc());
  assert(state.doc.buckets.length === 1, 'expected exactly one bucket');
  assert(state.doc.buckets[0].type === 'root', 'the one bucket should be a root');
  assert(state.doc.rules.length === 1, 'expected a default rule');
  return `root "${state.doc.buckets[0].name}", rule "${state.doc.rules[0].name}"`;
});

check('osd numbers are unique and never reused', () => {
  loadDoc(newDoc());
  const a = addHost('a', 0, 0);
  const b = addHost('b', 0, 0);
  for (let i = 0; i < 4; i++) addOsd(a, {});
  for (let i = 0; i < 4; i++) addOsd(b, {});
  const ids = allOsds().map((o) => o.id);
  assert(new Set(ids).size === 8, `got duplicate osd ids: ${ids.join(',')}`);
  const highest = Math.max(...ids);
  removeIds([a.id]);                       // delete a whole host, OSDs and all
  const fresh = addOsd(b, {});
  assert(fresh.id > highest, `osd.${fresh.id} reused a number below ${highest}`);
  return `8 OSDs, host removed, next id ${fresh.id}`;
});

check('deleting a host takes its cables with it', () => {
  loadDoc(newDoc());
  const h = addHost('h1', 0, 0);
  const sw = addSwitchNode('sw1', 0, 200);
  addLink(h.id, sw.id, 'public');
  addLink(h.id, sw.id, 'cluster');
  assert(state.doc.links.length === 2, 'links did not get added');
  removeIds([h.id]);
  assert(state.doc.links.length === 0, `${state.doc.links.length} cables left dangling`);
  assert(state.doc.switches.length === 1, 'the switch should have survived');
  return '2 cables removed with the host';
});

check('deleting a rack re-parents its hosts instead of losing them', () => {
  sampleDoc();
  const rack = state.doc.buckets.find((b) => b.name === 'rack1');
  const orphans = state.doc.hosts.filter((h) => h.parent === rack.id).map((h) => h.id);
  removeIds([rack.id]);
  const root = state.doc.buckets.find((b) => b.type === 'root').id;
  assert(state.doc.hosts.length === 9, `lost hosts: ${state.doc.hosts.length} left`);
  for (const id of orphans) {
    assert(state.doc.hosts.find((h) => h.id === id).parent === root, 'an orphan was not re-parented');
  }
  return `${orphans.length} hosts moved up to the root`;
});

check('undo and redo restore the whole document', () => {
  sampleDoc();
  resetHistory();
  const before = JSON.stringify(state.doc);
  commit('add host');
  addHost('extra', 0, 0);
  changed();
  assert(state.doc.hosts.length === 10, 'host was not added');
  assert(canUndo(), 'nothing to undo');
  undo();
  assert(JSON.stringify(state.doc) === before, 'undo did not restore the document');
  assert(canRedo(), 'nothing to redo');
  redo();
  assert(state.doc.hosts.length === 10, 'redo did not re-add the host');
  return '10 hosts -> undo -> 9 -> redo -> 10';
});

check('migrate fills in a hand-written document', () => {
  const doc = migrate({ title: 'sparse', hosts: [{ id: 'h1', name: 'h1', osds: [{ id: 0 }] }] });
  assert(Array.isArray(doc.pools) && Array.isArray(doc.rules), 'missing arrays not filled in');
  const o = doc.hosts[0].osds[0];
  assert(o.size === 8 && o.class === 'hdd' && o.in === true && o.reweight === 1,
    `osd defaults wrong: ${JSON.stringify(o)}`);
  assert(doc.hosts[0].up === true, 'host up defaulted wrong');
  return 'defaults applied to a one-OSD document';
});

// -------------------------------------------------------------- compiler ----
check('the document tree compiles to the CRUSH tree you drew', () => {
  const doc = sampleDoc();
  const map = compileMap(doc);
  const root = map.buckets[map.byName['default']];
  const expect = 3 * 3 * (2 * 2 + 4 * 8);           // 3 racks x 3 hosts x 36 TiB
  assert(root.weight === expect, `root weight ${root.weight}, expected ${expect}`);
  assert(map.byName['rack0'] !== undefined, 'rack0 did not survive compilation');
  assert(map.buckets[map.byName['rack0']].weight === expect / 3, 'rack weight wrong');
  assert(map.buckets[map.byName['h0-0']].typeName === 'host', 'host bucket typed wrong');
  assert(devicesUnder(map, map.byName['default']).length === 54, 'wrong OSD count');
  return `${expect} TiB over 54 OSDs, 3 racks`;
});

check('a compiled rule places the way its failure domain says', () => {
  const doc = sampleDoc();
  const map = compileMap(doc);
  const rw = reweightsFor(doc);
  const nameOf = (osd, type) => ancestry(map, osd).find((b) => b.typeName === type)?.name;
  let hostBad = 0, rackBad = 0;
  for (let ps = 0; ps < 2000; ps++) {
    const byHost = doRule(map, 'replicated_rule', ps, 3, rw).filter((o) => o !== NONE);
    const byRack = doRule(map, 'by-rack', ps, 3, rw).filter((o) => o !== NONE);
    const hs = byHost.map((o) => nameOf(o, 'host'));
    if (new Set(hs).size !== hs.length) hostBad++;
    const rs = byRack.map((o) => nameOf(o, 'rack'));
    if (new Set(rs).size !== rs.length) rackBad++;
  }
  assert(hostBad === 0 && rackBad === 0, `violations: host ${hostBad}, rack ${rackBad}`);
  return '2000 PGs on each rule, 0 violations';
});

check('a class rule compiles to a shadow-tree take', () => {
  const doc = sampleDoc();
  const map = compileMap(doc);
  const steps = ruleSteps(doc.rules[2]);
  assert(steps[0].class === 'ssd', 'class lost in translation');
  const ssd = new Set(devicesUnder(map, map.shadow['default~ssd']));
  assert(ssd.size === 18, `default~ssd holds ${ssd.size} OSDs, expected 18`);
  const rw = reweightsFor(doc);
  let off = 0;
  for (let ps = 0; ps < 2000; ps++) {
    for (const o of doRule(map, 'ssd-rule', ps, 3, rw)) if (o !== NONE && !ssd.has(o)) off++;
  }
  assert(off === 0, `${off} placements escaped the ssd class`);
  return '18 SSDs, 2000 PGs, none escaped';
});

check('out is a reweight of zero, not a weight of zero', () => {
  const doc = sampleDoc();
  const before = compileMap(doc).buckets[compileMap(doc).byName['h0-0']].weight;
  const osd = doc.hosts[0].osds[0];
  osd.in = false;
  const map = compileMap(doc);
  assert(map.buckets[map.byName['h0-0']].weight === before,
    'marking an OSD out changed its host weight — that is what a crush weight change does');
  assert(reweightsFor(doc)[osd.id] === 0, 'an out OSD should have reweight 0');
  const rw = reweightsFor(doc);
  let hits = 0;
  for (let ps = 0; ps < 2000; ps++) if (doRule(map, 'replicated_rule', ps, 3, rw).includes(osd.id)) hits++;
  assert(hits === 0, `an out OSD still took ${hits} PGs`);
  return `host weight held at ${before} TiB, osd.${osd.id} took 0 PGs`;
});

check('a down OSD stays in the CRUSH map but leaves the acting set', () => {
  const doc = sampleDoc();
  const map = compileMap(doc);
  const osd = doc.hosts[0].osds[0];
  osd.up = false;
  const rw = reweightsFor(doc);
  const down = downSet(doc);
  assert(down.has(osd.id), 'down set missed an explicitly downed OSD');
  let raw = 0;
  for (let ps = 0; ps < 2000; ps++) if (doRule(map, 'replicated_rule', ps, 3, rw).includes(osd.id)) raw++;
  assert(raw > 0, 'CRUSH should not know about liveness — a down OSD stays in the raw set');
  const ev = evaluate(doc, { downOsds: down });
  const acting = ev.evals[0].pgs.filter((p) => p.up.includes(osd.id)).length;
  assert(acting === 0, `${acting} PGs kept a down OSD in the acting set`);
  assert(ev.evals[0].degraded > 0, 'a down OSD degraded nothing');
  return `raw set ${raw}/2000, acting set 0, ${ev.evals[0].degraded} PGs degraded`;
});

check('a down host takes all of its OSDs down with it', () => {
  const doc = sampleDoc();
  doc.hosts[0].up = false;
  const down = downSet(doc);
  for (const o of doc.hosts[0].osds) assert(down.has(o.id), `osd.${o.id} stayed up on a down host`);
  assert(down.size === 6, `${down.size} OSDs down, expected 6`);
  return '6 OSDs down with one host';
});

// ----------------------------------------------------------------- cache ----
check('moving a host on the canvas does not trigger a remap', () => {
  const doc = sampleDoc();
  const sig = structuralSignature(doc);
  doc.hosts[0].x += 500;
  doc.hosts[0].y -= 40;
  doc.title = 'renamed for a slide';
  assert(structuralSignature(doc) === sig, 'a pure move changed the structural signature');
  return 'position and title are not structural';
});

check('changing a weight, class or rule does trigger a remap', () => {
  const doc = sampleDoc();
  const sig0 = structuralSignature(doc);
  doc.hosts[0].osds[0].size = 16;
  const sig1 = structuralSignature(doc);
  assert(sig1 !== sig0, 'resizing an OSD did not change the signature');
  doc.hosts[0].osds[0].class = 'nvme';
  const sig2 = structuralSignature(doc);
  assert(sig2 !== sig1, 'changing device class did not change the signature');
  doc.rules[0].failureDomain = 'rack';
  assert(structuralSignature(doc) !== sig2, 'changing a failure domain did not change the signature');
  return 'size, class and failure domain all invalidate';
});

check('the map cache returns the same map until something structural moves', () => {
  const doc = sampleDoc();
  const a = getMap(doc);
  doc.hosts[0].x += 100;
  assert(getMap(doc) === a, 'a move rebuilt the map');
  doc.hosts[0].osds[0].size = 12;                // a 2 TiB SSD grows to 12
  const b = getMap(doc);
  assert(b !== a, 'a weight change did not rebuild the map');
  const want = 36 - 2 + 12;                      // host was 2x2 SSD + 4x8 HDD
  assert(b.buckets[b.byName['h0-0']].weight === want,
    `new host weight ${b.buckets[b.byName['h0-0']].weight}, expected ${want}`);
  return 'cache holds across moves, drops on weight change';
});

check('a full evaluation agrees with the replication factor', () => {
  const doc = sampleDoc();
  doc.settings.skew = 0;
  invalidate();
  const ev = evaluate(doc);
  const raw = ev.evals[0].rawUsed / TiB;
  assert(Math.abs(raw - 60) / 60 < 0.01, `20 TiB stored at size 3 gave ${raw.toFixed(1)} TiB raw`);
  assert(ev.usage.size === 54, `usage covers ${ev.usage.size} OSDs, expected 54`);
  assert(ev.df.total / TiB === 3 * 3 * 36, `cluster total ${ev.df.total / TiB} TiB`);
  return `${raw.toFixed(0)} TiB raw of ${ev.df.total / TiB} TiB, ${ev.evals[0].pgs.length} PGs`;
});
