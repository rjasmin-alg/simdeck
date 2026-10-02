// SPDX-License-Identifier: AGPL-3.0-or-later
// The crushtool text format, both directions.
//
// The fixture below is real-shaped `crushtool -d` output, quirks included:
// tabs, trailing comments, the extra `id -N class X` lines Ceph writes for each
// shadow bucket, and the pre-Nautilus `min_size`/`max_size` on a rule. Those
// quirks are the whole reason this parser needs testing — a map that parses but
// silently picks up a shadow bucket's id is worse than one that refuses.

import { decompile, compileText, parseCrushText, docFromCrushText } from '../js/crushtext.js';
import { doRule, NONE } from '../js/engine/crush.js';
import { defaultReweights, devicesUnder, ancestry } from '../js/engine/crushmap.js';
import { compileMap } from '../js/compile.js';
import { migrate } from '../js/model.js';
import { SAMPLES, makeSample } from '../js/samples.js';

export const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, detail: fn() || '' }); }
  catch (err) { results.push({ name, pass: false, detail: err.message }); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const REAL_MAP = `# begin crush map
tunable choose_local_tries 0
tunable choose_local_fallback_tries 0
tunable choose_total_tries 50
tunable chooseleaf_descend_once 1
tunable chooseleaf_vary_r 1
tunable chooseleaf_stable 1
tunable straw_calc_version 1
tunable allowed_bucket_algs 54

# devices
device 0 osd.0 class hdd
device 1 osd.1 class hdd
device 2 osd.2 class ssd
device 3 osd.3 class hdd
device 4 osd.4 class hdd
device 5 osd.5 class ssd

# types
type 0 osd
type 1 host
type 3 rack
type 11 root

# buckets
host node1 {
\tid -3\t\t# do not change unnecessarily
\tid -4 class hdd\t\t# do not change unnecessarily
\tid -9 class ssd\t\t# do not change unnecessarily
\t# weight 19.06467
\talg straw2
\thash 0\t# rjenkins1
\titem osd.0 weight 9.09569
\titem osd.1 weight 9.09569
\titem osd.2 weight 0.87329
}
host node2 {
\tid -5\t\t# do not change unnecessarily
\tid -6 class hdd\t\t# do not change unnecessarily
\t# weight 19.06467
\talg straw2
\thash 0\t# rjenkins1
\titem osd.3 weight 9.09569
\titem osd.4 weight 9.09569
\titem osd.5 weight 0.87329
}
root default {
\tid -1\t\t# do not change unnecessarily
\tid -2 class hdd\t\t# do not change unnecessarily
\t# weight 38.12934
\talg straw2
\thash 0\t# rjenkins1
\titem node1 weight 19.06467
\titem node2 weight 19.06467
}

# rules
rule replicated_rule {
\tid 0
\ttype replicated
\tmin_size 1
\tmax_size 10
\tstep take default
\tstep chooseleaf firstn 0 type host
\tstep emit
}
rule ssd-only {
\tid 1
\ttype replicated
\tstep take default class ssd
\tstep chooseleaf firstn 0 type osd
\tstep emit
}

# end crush map
`;

check('a real crushtool map parses', () => {
  const p = parseCrushText(REAL_MAP);
  assert(p.devices.length === 6, `${p.devices.length} devices`);
  assert(p.buckets.length === 3, `${p.buckets.length} buckets`);
  assert(p.rules.length === 2, `${p.rules.length} rules`);
  assert(p.tunables.choose_total_tries === 50, 'tunables lost');
  assert(p.devices[2].class === 'ssd', 'device class lost');
  return '6 devices, 3 buckets, 2 rules, tunables kept';
});

check('shadow-bucket id lines do not steal the real bucket id', () => {
  // `id -3` then `id -4 class hdd` then `id -9 class ssd`: only the bare one is
  // node1's. Taking the last would give -9 and quietly renumber the tree.
  const map = compileText(REAL_MAP);
  assert(map.byName.default === -1, `default got id ${map.byName.default}, expected -1`);
  assert(map.byName.node1 === -3, `node1 got id ${map.byName.node1}, expected -3`);
  assert(map.byName.node2 === -5, `node2 got id ${map.byName.node2}, expected -5`);
  return 'default=-1 node1=-3 node2=-5';
});

check('weights survive the round trip to five decimals', () => {
  const map = compileText(REAL_MAP);
  assert(map.buckets[map.byName.node1].weight.toFixed(5) === '19.06467',
    `node1 weight ${map.buckets[map.byName.node1].weight}`);
  assert(map.buckets[map.byName.default].weight.toFixed(5) === '38.12934',
    `root weight ${map.buckets[map.byName.default].weight}`);
  assert(map.devices[2].weight === 0.87329, 'a device weight was rounded');
  return 'root 38.12934, node1 19.06467';
});

check('pre-Nautilus min_size and max_size on a rule are ignored, not fatal', () => {
  const map = compileText(REAL_MAP);
  const r = map.rules.find((x) => x.name === 'replicated_rule');
  assert(r, 'the rule with min_size/max_size vanished');
  assert(r.steps.length === 3, `${r.steps.length} steps, expected 3`);
  assert(r.steps[0].op === 'take' && r.steps[2].op === 'emit', 'steps mangled');
  return '3 steps, no stray min_size step';
});

check('an imported map places the way the file says', () => {
  const map = compileText(REAL_MAP);
  const rw = defaultReweights(map);
  const ssd = new Set(devicesUnder(map, map.shadow['default~ssd']));
  assert(ssd.size === 2, `default~ssd holds ${ssd.size} devices`);
  let off = 0, hostBad = 0;
  for (let x = 0; x < 3000; x++) {
    for (const o of doRule(map, 'ssd-only', x, 2, rw)) if (o !== NONE && !ssd.has(o)) off++;
    const s = doRule(map, 'replicated_rule', x, 2, rw).filter((o) => o !== NONE);
    const hosts = s.map((o) => ancestry(map, o).find((b) => b.typeName === 'host')?.name);
    if (new Set(hosts).size !== hosts.length) hostBad++;
  }
  assert(off === 0, `${off} placements escaped the ssd class`);
  assert(hostBad === 0, `${hostBad} PGs doubled up on a host`);
  return '3000 PGs on each rule, both rules honoured';
});

check('decompile then compile is byte-for-byte stable', () => {
  const out = [];
  for (const key of Object.keys(SAMPLES)) {
    const t1 = decompile(compileMap(migrate(makeSample(key))));
    const t2 = decompile(compileText(t1));
    const t3 = decompile(compileText(t2));
    assert(t1 === t2, `${key}: first round trip changed the text`);
    assert(t2 === t3, `${key}: second round trip changed the text`);
    out.push(`${key} ${t1.split('\n').length}L`);
  }
  const r1 = decompile(compileText(REAL_MAP));
  assert(r1 === decompile(compileText(r1)), 'the real map is not stable');
  return out.join(', ');
});

check('exported text carries the shadow trees a class rule needs', () => {
  const text = decompile(compileMap(migrate(makeSample('threeRacks'))));
  assert(text.includes('root default~nvme {'), 'no nvme shadow root in the export');
  assert(text.includes('root default~hdd {'), 'no hdd shadow root in the export');
  assert(/step take default class nvme/.test(text), 'the class rule lost its class');
  // ...and importing throws them away rather than duplicating them.
  const map = compileText(text);
  const shadows = Object.values(map.buckets).filter((b) => b.shadowOf !== null);
  const named = new Set(shadows.map((b) => b.name));
  assert(named.size === shadows.length, 'shadow buckets were duplicated on import');
  return `${named.size} shadow buckets, regenerated not duplicated`;
});

check('every step form survives a round trip', () => {
  const text = decompile(compileMap(migrate(makeSample('threeRacks'))));
  const map = compileText(text);
  const ec = map.rules.find((r) => r.type === 'erasure');
  assert(ec, 'the erasure rule was lost');
  assert(ec.steps[1].mode === 'indep', `erasure rule came back as ${ec.steps[1].mode}`);
  const cls = map.rules.find((r) => r.steps[0].class === 'nvme');
  assert(cls, 'the class rule was lost');
  const plain = map.rules.find((r) => r.name === 'by-rack');
  assert(plain.steps[1].type === 'rack', 'the rack failure domain was lost');
  assert(plain.steps[1].mode === 'firstn', 'firstn became something else');
  return 'firstn, indep, class and failure domain all preserved';
});

check('a broken map fails loudly with a line number', () => {
  const cases = [
    ['', 'no devices'],
    ['device 0 osd.0\n', 'no buckets'],
    [REAL_MAP.replace('step chooseleaf firstn 0 type host', 'step chooseleaf sideways 0 type host'), 'bad mode'],
    [REAL_MAP.replace('step take default', 'step teleport default'), 'unknown step'],
    [REAL_MAP.replace('host node1 {', 'sandwich node1 {'), 'unknown bucket type'],
    [REAL_MAP.replace('item node1 weight 19.06467', 'item ghost weight 1.0'), 'unknown item'],
  ];
  for (const [text, why] of cases) {
    let threw = false;
    try { compileText(text); } catch { threw = true; }
    assert(threw, `accepted a map it should have rejected (${why})`);
  }
  return `${cases.length} malformed maps all rejected`;
});

check('importing a crushmap produces a document you can actually edit', () => {
  const doc = docFromCrushText(REAL_MAP, 'imported');
  assert(doc.hosts.length === 2, `${doc.hosts.length} hosts`);
  assert(doc.hosts.flatMap((h) => h.osds).length === 6, 'lost OSDs');
  assert(doc.buckets.some((b) => b.type === 'root'), 'no root bucket');
  for (const h of doc.hosts) {
    assert(doc.buckets.some((b) => b.id === h.parent), `${h.name} has no parent bucket`);
    assert(Number.isFinite(h.x) && Number.isFinite(h.y), `${h.name} has no position`);
  }
  // Positions and cabling are invented; everything placement-related is not.
  const osd = doc.hosts[0].osds.find((o) => o.id === 2);
  assert(osd.class === 'ssd' && osd.size === 0.87329, `osd.2 came across as ${JSON.stringify(osd)}`);
  assert(doc.rules.length === 2, 'rules lost');
  assert(doc.pools.length === 0, 'a crushmap has no pools to import');
  // And the document must compile straight back to the same tree.
  const remade = compileMap(migrate(doc));
  assert(remade.buckets[remade.byName.default].weight.toFixed(5) === '38.12934',
    'the imported document does not recompile to the same weight');
  return '2 hosts, 6 OSDs, 2 rules, recompiles to the same weight';
});
