// SPDX-License-Identifier: AGPL-3.0-or-later
// Compares ../crush.js and ../sim.js with the cephsim engine they were copied from (sims/cephsim/js/engine, copied
// into simdeck from ~/projects/cephsim): for every lab cluster the page can build (small 1–12, big 2–16, size 2 and
// 3, every disk size), the CRUSH set of every PG, the per-OSD bytes, raw used and MAX AVAIL must be equal (the engine
// given stored / skewSum, as sim.js scales its per-PG sizes to add up to stored exactly).
// Prints the preset numbers of SPEC.md. Run from the repo root:  node sims/smallest-disk-caps/tools/check-engine.mjs
// Dev tool only: the page never loads it.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const L = require(join(here, '../sim.js'));
const eng = join(here, '../../cephsim/js');
const { compileMap, reweightsFor } = await import(join(eng, 'compile.js'));
const { evaluatePool } = await import(join(eng, 'engine/pgmap.js'));
const { osdUsage, poolDf, clusterDf, TiB } = await import(join(eng, 'engine/capacity.js'));

function engine(p) {
  const hosts = L.labHosts(p).map((x, i) => ({ id: 'h' + i, name: x.name, parent: 'root',
    osds: x.osds.map((o) => ({ id: o.id, size: o.weight, class: 'hdd', in: true, reweight: 1 })) }));
  const pool = { id: 1, name: 'rbd', type: 'replicated', size: p.size, min_size: 2, pg_num: 256, pgp_num: 256,
    crush_rule: 'replicated_rule', stored: p.storedTiB * TiB };
  const doc = { buckets: [{ id: 'root', name: 'default', type: 'root', parent: null }], hosts, pools: [pool],
    rules: [{ id: 0, name: 'replicated_rule', type: 'replicated', root: 'default', class: null, failureDomain: 'host', mode: 'firstn' }] };
  const map = compileMap(doc);
  const ev = evaluatePool(map, pool, reweightsFor(doc), { skew: 0.25 });
  const usage = osdUsage(map, [ev]);
  return { raw: ev.raw, usage, df: clusterDf(map, usage), pdf: poolDf(map, pool, usage, [ev]) };
}

const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
let n = 0, bad = 0;
for (const diskGiB of L.DISKS) for (const size of [2, 3]) for (let small = 1; small <= 12; small++) for (let big = 2; big <= 16; big++) {
  const p = { ...L.defaults, smallHostDisks: small, bigHostDisks: big, diskGiB, size, storedTiB: 0.2 * diskGiB / 1024 };
  const pl = L.labPlacement(p), s = L.compute(p);
  // sim.js scales the per-PG sizes to add up to exactly `stored`: ask the engine for the same total
  const e = engine({ ...p, storedTiB: p.storedTiB / pl.skewSum });
  n++;
  const why = [];
  pl.raw.forEach((set, i) => { if (set.join() !== e.raw[i].join()) why.push(`PG ${i} ${set} vs ${e.raw[i]}`); });
  for (const o of s.osds) {
    const u = e.usage.get(o.id);
    if (!close(o.usedTiB * TiB, u.used)) why.push(`osd.${o.id} used ${o.usedTiB * TiB} vs ${u.used}`);
  }
  if (!s.full) {
    if (!close(s.rawRatio, e.df.ratio)) why.push(`raw ${s.rawRatio} vs ${e.df.ratio}`);
    if (!close(s.maxAvailTiB * TiB, e.pdf.maxAvail)) why.push(`max avail ${s.maxAvailTiB} vs ${e.pdf.maxAvail / TiB}`);
  }
  if (why.length) { bad++; console.log(JSON.stringify(p), why.slice(0, 3).join('; ')); }
}
console.log(`${n} clusters compared with the cephsim engine, ${bad} differ`);

const pct = (x) => (100 * x).toFixed(1) + ' %';
for (const pr of L.presets) {
  const s = L.compute({ ...L.defaults, ...pr.params });
  const f = L.osdOf(s, s.fullest);
  const span = (h) => `${pct(s.hosts[h].minRatio)}–${pct(s.hosts[h].maxRatio)}`;
  console.log(`${pr.id}: raw ${pct(s.rawRatio)}, MAX AVAIL ${s.maxAvailTiB.toFixed(2)} TiB (osd.${s.maxAvailOsd}), fullest osd.${f.id} ${pct(f.ratio)} ${f.level}` +
    (s.cluster === 'lab' ? `, full at ${s.fullAtTiB.toFixed(2)} TiB, fits ${s.headroomTiB.toFixed(2)} TiB, hosts ${s.hosts.map((x, i) => span(i)).join(' | ')}, short ${s.short}` : '') +
    `, raw free ÷ size ${s.naiveTiB.toFixed(2)} TiB`);
}
