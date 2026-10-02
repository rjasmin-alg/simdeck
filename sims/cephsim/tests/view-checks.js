// Geometry and sample-cluster checks. DOM-free.
//
// The samples are teaching material, so they get asserted like code: the one
// labelled "broken on purpose" has to actually break, and only in the way the
// label claims. A sample that quietly stopped demonstrating its point would be
// worse than no sample.

import {
  hostBox, switchBox, routeLink, slotColumns, contentBounds, distanceToPolyline,
  SLOT, HOST_MIN_W,
} from '../js/geom.js';
import { SAMPLES, makeSample } from '../js/samples.js';
import { migrate, loadDoc, newDoc, state } from '../js/model.js';
import { compileMap, reweightsFor, downSet, evaluate, invalidate, ruleSteps } from '../js/compile.js';
import { osdUsage, clusterDf, RATIOS, TiB } from '../js/engine/capacity.js';
import { paintAll, paintSlot, fillColour, CANVAS_CSS } from '../js/render.js';
import { crushRows, paintTree } from '../js/render-crush.js';
import { osdMapLayout, pgHistogram, pgStateBreakdown, paintOsdMap } from '../js/render-osdmap.js';
import { poolWarning, domainsAvailable } from '../js/panel-pools.js';
import { buildSvg, buildCephScript } from '../js/exporters.js';
import { devicesUnder } from '../js/engine/crushmap.js';

export const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, detail: fn() || '' }); }
  catch (err) { results.push({ name, pass: false, detail: err.message }); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const mkHost = (n, x = 0, y = 0) => ({ x, y, osds: Array.from({ length: n }, (_, i) => ({ id: i })) });

// ------------------------------------------------------------------ geom ----
check('every disk slot lands inside its host box', () => {
  for (const n of [0, 1, 3, 4, 5, 8, 12, 24, 36, 60]) {
    const h = mkHost(n, 40, 70);
    const b = hostBox(h);
    assert(b.slots.length === n, `${n} disks produced ${b.slots.length} slots`);
    for (const s of b.slots) {
      assert(s.x >= b.x && s.x + s.w <= b.x + b.w, `slot escaped horizontally at n=${n}`);
      assert(s.y >= b.y && s.y + s.h <= b.y + b.h, `slot escaped vertically at n=${n}`);
    }
    assert(b.w >= HOST_MIN_W, `box narrower than the minimum at n=${n}`);
  }
  return 'checked 0 to 60 disks';
});

check('disk slots never overlap each other', () => {
  for (const n of [2, 7, 12, 24, 36]) {
    const b = hostBox(mkHost(n));
    for (let i = 0; i < b.slots.length; i++) {
      for (let j = i + 1; j < b.slots.length; j++) {
        const a = b.slots[i], c = b.slots[j];
        const hit = a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h;
        assert(!hit, `slots ${i} and ${j} overlap at n=${n}`);
      }
    }
  }
  return 'no overlaps from 2 to 36 disks';
});

check('a host box grows with its disk count and never gets absurdly wide', () => {
  const small = hostBox(mkHost(4)), big = hostBox(mkHost(36));
  assert(big.h > small.h, 'a 36-bay host is not taller than a 4-bay one');
  assert(slotColumns(60) <= 6, `${slotColumns(60)} columns is too wide to read`);
  assert(big.w <= 6 * SLOT + 5 * 5 + 20 + 1, `36-bay box is ${big.w}px wide`);
  return `4-bay ${small.w}x${small.h}, 36-bay ${big.w}x${big.h}`;
});

check('a cable starts and ends outside both boxes', () => {
  const a = hostBox(mkHost(12, 0, 300));
  const b = switchBox({ x: 40, y: 0 });
  const cases = [
    [a, b],
    [b, a],
    [hostBox(mkHost(4, 0, 0)), hostBox(mkHost(4, 600, 20))],   // near-horizontal
    [hostBox(mkHost(4, 0, 0)), hostBox(mkHost(4, 30, 400))],   // near-vertical
  ];
  for (const [p, q] of cases) {
    const r = routeLink(p, q);
    for (const box of [p, q]) {
      for (const pt of [r.start, r.end]) {
        const inside = pt.x > box.x + 1 && pt.x < box.x + box.w - 1
                    && pt.y > box.y + 1 && pt.y < box.y + box.h - 1;
        assert(!inside, 'a cable endpoint landed inside a box');
      }
    }
    assert(/^M[-\d.]/.test(r.d), `malformed path: ${r.d.slice(0, 20)}`);
    assert(r.points.length >= 2, 'route has no points');
  }
  return '4 orientations, endpoints all outside';
});

check('cable hit testing finds the line and misses the paper', () => {
  const a = hostBox(mkHost(12, 0, 300));
  const b = switchBox({ x: 40, y: 0 });
  const r = routeLink(a, b);
  assert(distanceToPolyline(r.points, r.mid) < 1, 'the midpoint is not on its own cable');
  assert(distanceToPolyline(r.points, { x: r.mid.x + 400, y: r.mid.y + 400 }) > 100,
    'a far-away point registered as a hit');
  return 'midpoint hits, distant point misses';
});

check('content bounds enclose everything', () => {
  const boxes = [hostBox(mkHost(4, -100, -50)), switchBox({ x: 300, y: 200 })];
  const b = contentBounds(boxes);
  for (const box of boxes) {
    assert(box.x >= b.x && box.y >= b.y, 'a box starts outside the bounds');
    assert(box.x + box.w <= b.x + b.w + 0.01, 'a box ends outside the bounds');
    assert(box.y + box.h <= b.y + b.h + 0.01, 'a box ends outside the bounds');
  }
  assert(contentBounds([]) === null, 'empty input should give null, not a degenerate box');
  return `${b.w.toFixed(0)}x${b.h.toFixed(0)} around 2 boxes`;
});

// --------------------------------------------------------------- samples ----
check('every sample is internally consistent', () => {
  const names = [];
  for (const [key, s] of Object.entries(SAMPLES)) {
    const doc = migrate(makeSample(key));
    const bucketIds = new Set(doc.buckets.map((b) => b.id));
    const nodeIds = new Set([...doc.hosts.map((h) => h.id), ...doc.switches.map((x) => x.id)]);
    const ruleNames = new Set(doc.rules.map((r) => r.name));
    for (const h of doc.hosts) assert(bucketIds.has(h.parent), `${key}: host ${h.name} has no parent bucket`);
    for (const l of doc.links) {
      assert(nodeIds.has(l.a) && nodeIds.has(l.b), `${key}: cable ${l.id} dangles`);
    }
    for (const p of doc.pools) {
      assert(ruleNames.has(p.crush_rule), `${key}: pool ${p.name} wants missing rule ${p.crush_rule}`);
      if (p.type === 'erasure') assert(p.k > 0 && p.m > 0, `${key}: pool ${p.name} has a bad EC profile`);
      else assert(p.size >= p.min_size, `${key}: pool ${p.name} has min_size above size`);
    }
    const ids = doc.hosts.flatMap((h) => h.osds.map((o) => o.id));
    assert(new Set(ids).size === ids.length, `${key}: duplicate osd numbers`);
    names.push(`${key}(${doc.hosts.length}h/${ids.length}osd)`);
  }
  return names.join(' ');
});

check('every sample compiles and evaluates cleanly', () => {
  const out = [];
  for (const key of Object.keys(SAMPLES)) {
    const doc = migrate(makeSample(key));
    invalidate();
    const map = compileMap(doc);
    for (const r of doc.rules) {
      const steps = ruleSteps(r);
      const rootId = map.rootId(steps[0].item, steps[0].class);
      assert(rootId !== undefined, `${key}: rule ${r.name} takes a root that does not exist`);
      assert(devicesUnder(map, rootId).length > 0, `${key}: rule ${r.name} takes an empty root`);
    }
    invalidate();
    const ev = evaluate(doc);
    let inactive = 0;
    for (const e of ev.evals) inactive += e.inactive;
    out.push(`${key}: ${(ev.df.ratio * 100).toFixed(0)}% used`);
    assert(inactive === 0, `${key}: ${inactive} PGs inactive with everything up`);
  }
  return out.join(', ');
});

/** Simulate losing a whole rack, the way the UI's host-down toggle would. */
function failRack(doc, rackName) {
  const rack = doc.buckets.find((b) => b.name === rackName);
  for (const h of doc.hosts) if (h.parent === rack.id) h.up = false;
  invalidate();
  return evaluate(doc);
}

check('the "broken on purpose" sample really does break, and only on rack loss', () => {
  const doc = migrate(makeSample('brokenRule'));
  invalidate();
  const healthy = evaluate(doc);
  assert(healthy.evals[0].inactive === 0 && healthy.evals[0].degraded === 0,
    'the broken sample should look perfectly healthy until something fails');
  const oneHost = migrate(makeSample('brokenRule'));
  oneHost.hosts[0].up = false;
  invalidate();
  const one = evaluate(oneHost);
  assert(one.evals[0].inactive === 0, `losing one host already broke it (${one.evals[0].inactive} inactive)`);
  const after = failRack(migrate(makeSample('brokenRule')), 'rack1');
  assert(after.evals[0].inactive > 0,
    'losing a whole rack left every PG active — the sample no longer demonstrates its point');
  return `healthy -> 1 host down: 0 inactive -> rack down: ${after.evals[0].inactive} of ${doc.pools[0].pg_num} inactive`;
});

check('a rack-aware replicated pool survives a rack failure', () => {
  const doc = migrate(makeSample('threeRacks'));
  const after = failRack(doc, 'rack1');
  const rbd = after.evals.find((e) => e.pool.name === 'rbd');
  assert(rbd.inactive === 0, `the rack-aware pool lost ${rbd.inactive} PGs to one rack`);
  assert(rbd.degraded > 0, 'losing a rack should still degrade a rack-aware pool');
  return `rbd: ${rbd.degraded} of ${rbd.pool.pg_num} degraded, 0 inactive`;
});

check('a host-domain EC pool on the same hardware does NOT survive a rack failure', () => {
  // The lesson the threeRacks sample exists to teach: k=4 m=2 places happily
  // across 9 hosts, but a rack holds 3 of them and m is only 2. Rack tolerance
  // for the replicated pool does not buy rack tolerance for the EC one.
  const after = failRack(migrate(makeSample('threeRacks')), 'rack1');
  const ec = after.evals.find((e) => e.pool.name === 'cephfs_data');
  assert(ec.inactive > 0,
    'the 4+2 EC pool survived losing 3 of 9 hosts — it should not, m is 2');
  const healthy = evaluate(migrate(makeSample('threeRacks')));
  const ecOk = healthy.evals.find((e) => e.pool.name === 'cephfs_data');
  assert(ecOk.inactive === 0 && ecOk.degraded === 0,
    'the EC pool should be perfectly clean before the failure');
  return `clean when healthy, ${ec.inactive} of ${ec.pool.pg_num} PGs inactive after one rack`;
});

check('the unbalanced-hosts sample shows the small hosts filling first', () => {
  const doc = migrate(makeSample('unbalanced'));
  invalidate();
  const ev = evaluate(doc);
  const big = doc.hosts.find((h) => h.name === 'ceph-big').osds.map((o) => o.id);
  const small = doc.hosts.filter((h) => h.name.startsWith('ceph-small')).flatMap((h) => h.osds.map((o) => o.id));
  const mean = (ids) => ids.reduce((a, i) => a + ev.usage.get(i).ratio, 0) / ids.length;
  const ratio = mean(small) / mean(big);
  // Each host carries the same data; the small ones have a sixth of the spindles.
  assert(ratio > 4, `small hosts only ${ratio.toFixed(1)}x as full as the big one`);
  const maxAvail = Math.max(...[...ev.usage.values()].map((u) => u.ratio));
  assert(maxAvail > mean(big) * 3, 'the fullest OSD is not meaningfully ahead of the big host');
  return `small hosts ${(mean(small) * 100).toFixed(0)}% full vs big host ${(mean(big) * 100).toFixed(0)}% — ${ratio.toFixed(1)}x`;
});

check('the nvme metadata rule keeps metadata off the spinning disks', () => {
  const doc = migrate(makeSample('threeRacks'));
  invalidate();
  const map = compileMap(doc);
  const nvme = new Set(devicesUnder(map, map.shadow['default~nvme']));
  const ev = evaluate(doc);
  const meta = ev.evals.find((e) => e.pool.name === 'cephfs_metadata');
  for (const osd of meta.osdBytes.keys()) {
    assert(nvme.has(osd), `metadata landed on osd.${osd}, which is not NVMe`);
  }
  return `${meta.osdBytes.size} NVMe OSDs carry the metadata pool, 0 HDDs`;
});

// ---------------------------------------------------------------- markup ----
// The renderer builds SVG as strings, so it can be checked without a browser.
// That matters more than usual here: headless Firefox is broken on this machine,
// and a NaN in one attribute silently blanks a whole layer.

/** Minimal XML well-formedness check: balanced tags, quoted attributes. */
function xmlErrors(markup) {
  const errs = [];
  const stack = [];
  const tag = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+\s*=\s*"[^"]*")*)\s*(\/?)>/g;
  let cursor = 0, m;
  while ((m = tag.exec(markup))) {
    const between = markup.slice(cursor, m.index);
    if (between.includes('<')) errs.push(`unparsable markup near "${between.trim().slice(0, 40)}"`);
    if (/&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(between)) errs.push('unescaped & in text');
    cursor = m.index + m[0].length;
    const [, closing, name, , selfClose] = m;
    if (closing) {
      if (stack.pop() !== name) errs.push(`</${name}> does not close the open tag`);
    } else if (!selfClose) stack.push(name);
  }
  const tail = markup.slice(cursor);
  if (tail.includes('<')) errs.push(`unparsable trailing markup "${tail.trim().slice(0, 40)}"`);
  if (stack.length) errs.push(`unclosed: ${stack.join(', ')}`);
  return errs;
}

function paintSample(key) {
  const doc = migrate(makeSample(key));
  invalidate();
  const ev = evaluate(doc);
  return { doc, ev, out: paintAll(doc, ev.usage) };
}

check('painted markup is well-formed XML for every sample', () => {
  const sizes = [];
  for (const key of Object.keys(SAMPLES)) {
    const { out } = paintSample(key);
    for (const [layer, markup] of Object.entries({ cables: out.cables, nodes: out.nodes })) {
      const errs = xmlErrors(markup);
      assert(!errs.length, `${key}/${layer}: ${errs.slice(0, 2).join('; ')}`);
    }
    sizes.push(`${key} ${((out.cables.length + out.nodes.length) / 1024).toFixed(1)}KiB`);
  }
  return sizes.join(', ');
});

check('no attribute is ever NaN, undefined or Infinity', () => {
  for (const key of Object.keys(SAMPLES)) {
    const { out } = paintSample(key);
    const all = out.cables + out.nodes;
    for (const bad of ['NaN', 'undefined', 'Infinity', '="null"']) {
      assert(!all.includes(bad), `${key}: "${bad}" reached the markup`);
    }
  }
  // An OSD with no usage entry at all must still paint (it happens mid-edit).
  const doc = migrate(makeSample('hyperconverged'));
  const bare = paintAll(doc, null);
  assert(!/(NaN|undefined)/.test(bare.nodes), 'painting without usage data produced NaN');
  return 'clean with and without usage data';
});

check('every OSD gets exactly one slot group, keyed by its number', () => {
  const { doc, out } = paintSample('threeRacks');
  const ids = doc.hosts.flatMap((h) => h.osds.map((o) => o.id));
  for (const id of ids) {
    const n = (out.nodes.match(new RegExp(`data-id="${id}" data-kind="osd"`, 'g')) || []).length;
    assert(n === 1, `osd.${id} painted ${n} times`);
  }
  const groups = (out.nodes.match(/data-kind="osd"/g) || []).length;
  assert(groups === ids.length, `${groups} slot groups for ${ids.length} OSDs`);
  return `${ids.length} OSDs, one group each`;
});

check('the fill bar stays inside its slot at every ratio, including over-full', () => {
  const slot = hostBox(mkHost(4)).slots[0];
  for (const ratio of [0, 0.01, 0.5, 0.85, 0.95, 1, 1.4]) {
    const usage = new Map([[slot.osd.id, { ratio, used: 1, total: 2, pgs: 3 }]]);
    const markup = paintSlot(slot, usage, false);
    // attributes wrap across lines in the template, so match on whitespace
    const bar = /class="slot-fill"\s+x="([\d.-]+)"\s+y="([\d.-]+)"\s+width="([\d.-]+)"\s+height="([\d.-]+)"/.exec(markup);
    assert(bar, `no fill bar painted at ratio ${ratio}`);
    const [, , y, , h] = bar.map(Number);
    assert(h >= 0, `negative bar height at ratio ${ratio}`);
    assert(y >= slot.y - 0.01 && y + h <= slot.y + slot.h + 0.01,
      `bar escaped the slot at ratio ${ratio}: y=${y} h=${h} slot=${slot.y}..${slot.y + slot.h}`);
  }
  return 'ratios 0 to 1.4 all contained';
});

check('names are escaped, so a host cannot inject markup', () => {
  const doc = migrate(makeSample('hyperconverged'));
  doc.hosts[0].name = '<script>alert(1)</script> & "quoted"';
  const out = paintAll(doc, null);
  assert(!out.nodes.includes('<script>'), 'a host name injected a raw tag');
  assert(out.nodes.includes('&lt;script&gt;'), 'the name was not escaped');
  assert(!xmlErrors(out.nodes).length, 'escaping produced malformed XML');
  return 'tags, ampersands and quotes all escaped';
});

check('editor-only styling stays out of the exported canvas CSS', () => {
  // CANVAS_CSS is embedded into exported SVG; selection rings and marquees must
  // not travel with a diagram into someone's slides.
  for (const cls of ['sel-ring', 'sel-slot', 'marquee', 'link-preview', 'drop-target']) {
    assert(!CANVAS_CSS.includes(cls), `${cls} leaked into CANVAS_CSS`);
  }
  for (const cls of ['.slot', '.cable', '.host-name', '.box']) {
    assert(CANVAS_CSS.includes(cls), `${cls} is missing from CANVAS_CSS`);
  }
  return 'canvas and editor styling are disjoint';
});

check('fill colour crosses over at Ceph\'s own thresholds', () => {
  const at = (r) => fillColour(r);
  assert(at(0.5) !== at(0.86), 'nearfull did not change the colour');
  assert(at(0.86) !== at(0.91), 'backfillfull did not change the colour');
  assert(at(0.91) !== at(0.96), 'full did not change the colour');
  assert(at(0.96) === at(0.99), 'past full should stay one colour');
  return `${RATIOS.nearfull}/${RATIOS.backfillfull}/${RATIOS.full} each shift the colour`;
});

// -------------------------------------------------- CRUSH tree + OSD map ----
check('the CRUSH tree flattens to exactly the tree you drew', () => {
  const doc = migrate(makeSample('threeRacks'));
  const rows = crushRows(doc);
  const osds = doc.hosts.flatMap((h) => h.osds).length;
  const want = 1 + doc.buckets.filter((b) => b.type !== 'root').length + doc.hosts.length + osds;
  assert(rows.length === want, `${rows.length} rows, expected ${want}`);
  const root = rows[0];
  assert(root.type === 'root' && root.depth === 0, 'the root is not first at depth 0');
  const total = doc.hosts.flatMap((h) => h.osds).reduce((a, o) => a + o.size, 0);
  assert(root.weight === total, `root row weight ${root.weight}, expected ${total}`);
  // Depth must never jump by more than one, or the indent lies about the tree.
  for (let i = 1; i < rows.length; i++) {
    assert(rows[i].depth <= rows[i - 1].depth + 1, `depth jumped at row ${i}`);
  }
  return `${rows.length} rows, root ${root.weight} TiB`;
});

check('collapsing hides children and nothing else', () => {
  const doc = migrate(makeSample('threeRacks'));
  const all = crushRows(doc).length;
  const noOsds = crushRows(doc, { collapsed: new Set(doc.hosts.map((h) => h.id)) });
  const want = 1 + doc.buckets.filter((b) => b.type !== 'root').length + doc.hosts.length;
  assert(noOsds.length === want, `${noOsds.length} rows with hosts collapsed, expected ${want}`);
  assert(noOsds.every((r) => r.kind !== 'osd'), 'an OSD row survived collapsing its host');
  const rack = doc.buckets.find((b) => b.name === 'rack1');
  const noRack = crushRows(doc, { collapsed: new Set([rack.id]) });
  assert(noRack.some((r) => r.id === rack.id), 'the collapsed rack itself disappeared');
  assert(noRack.length < all, 'collapsing a rack hid nothing');
  return `${all} -> ${noOsds.length} rows`;
});

check('a host with no parent bucket still appears in the tree', () => {
  const doc = migrate(makeSample('hyperconverged'));
  doc.hosts[0].parent = 'gone';
  const rows = crushRows(doc);
  assert(rows.some((r) => r.kind === 'host' && r.id === doc.hosts[0].id),
    'an orphaned host vanished from the CRUSH view entirely');
  return 'orphan still listed';
});

check('tree markup is well-formed and free of NaN', () => {
  const doc = migrate(makeSample('threeRacks'));
  invalidate();
  const ev = evaluate(doc);
  const rows = crushRows(doc, { usage: ev.usage });
  const markup = paintTree(rows, { selection: new Set([doc.hosts[0].id]) });
  const errs = xmlErrors(markup);
  assert(!errs.length, errs.slice(0, 2).join('; '));
  for (const bad of ['NaN', 'undefined', 'Infinity']) {
    assert(!markup.includes(bad), `"${bad}" reached the tree markup`);
  }
  return `${(markup.length / 1024).toFixed(1)} KiB over ${rows.length} rows`;
});

check('the OSD map lays out one cell per OSD and never overlaps them', () => {
  const doc = migrate(makeSample('threeRacks'));
  invalidate();
  const ev = evaluate(doc);
  const { rows } = osdMapLayout(doc, ev.usage);
  assert(rows.length === doc.hosts.length, `${rows.length} rows for ${doc.hosts.length} hosts`);
  const cells = rows.flatMap((r) => r.cells);
  assert(cells.length === doc.hosts.flatMap((h) => h.osds).length, 'lost cells');
  const seen = new Set();
  for (const c of cells) {
    const key = `${c.x},${c.y}`;
    assert(!seen.has(key), `two cells at ${key}`);
    seen.add(key);
    assert(c.ratio >= 0 && Number.isFinite(c.ratio), `bad ratio ${c.ratio}`);
  }
  return `${cells.length} cells, all distinct`;
});

check('the PG histogram accounts for every OSD', () => {
  const doc = migrate(makeSample('threeRacks'));
  invalidate();
  const ev = evaluate(doc);
  const h = pgHistogram(ev.usage);
  const total = h.bins.reduce((a, b) => a + b, 0);
  assert(total === h.n, `histogram counts ${total} OSDs but ${h.n} were measured`);
  assert(h.min <= h.mean && h.mean <= h.max, `mean ${h.mean} outside ${h.min}..${h.max}`);
  assert(h.max > h.min, 'a real cluster should not have a perfectly flat PG count');
  return `${h.n} OSDs across ${h.bins.length} bins, ${h.min}..${h.max}`;
});

check('PG state breakdown adds up to pg_num', () => {
  for (const key of ['threeRacks', 'brokenRule']) {
    const doc = migrate(makeSample(key));
    const rack = doc.buckets.find((b) => b.name === 'rack1');
    for (const h of doc.hosts) if (h.parent === rack.id) h.up = false;
    invalidate();
    const ev = evaluate(doc);
    for (const e of ev.evals) {
      const b = pgStateBreakdown(e);
      const sum = Object.values(b).reduce((a, x) => a + x, 0);
      assert(sum === e.pool.pg_num, `${key}/${e.pool.name}: ${sum} states for ${e.pool.pg_num} PGs`);
    }
  }
  return 'every PG lands in exactly one bucket, healthy and failed';
});

check('OSD map markup is well-formed and free of NaN', () => {
  for (const key of Object.keys(SAMPLES)) {
    const doc = migrate(makeSample(key));
    invalidate();
    const ev = evaluate(doc);
    const markup = paintOsdMap(doc, ev, { selection: new Set([0]) });
    const errs = xmlErrors(markup);
    assert(!errs.length, `${key}: ${errs.slice(0, 2).join('; ')}`);
    for (const bad of ['NaN', 'undefined', 'Infinity']) {
      assert(!markup.includes(bad), `${key}: "${bad}" reached the OSD map`);
    }
  }
  // And with no data at all, which is what a fresh document looks like.
  assert(!xmlErrors(paintOsdMap(migrate(makeSample('hyperconverged')), null)).length,
    'the empty state is malformed');
  return `${Object.keys(SAMPLES).length} samples plus the empty state`;
});

// ---------------------------------------------------------- pool warnings ---
check('a pool that wants more failure domains than exist is called out', () => {
  const doc = migrate(makeSample('threeRacks'));
  const rack = doc.rules.find((r) => r.name === 'by-rack');
  assert(domainsAvailable(doc, rack) === 3, `${domainsAvailable(doc, rack)} racks found, expected 3`);

  // size 3 over 3 racks is fine.
  const rbd = doc.pools.find((p) => p.name === 'rbd');
  assert(poolWarning(doc, rbd) === null, `clean pool warned: ${poolWarning(doc, rbd)}`);

  // size 4 over 3 racks is not.
  rbd.size = 4;
  const w = poolWarning(doc, rbd);
  assert(w && /only 3/.test(w), `expected a domain-count warning, got ${w}`);

  // And below min_size it must say something stronger.
  rbd.size = 6; rbd.min_size = 5;
  const w2 = poolWarning(doc, rbd);
  assert(w2 && /min_size/.test(w2), `expected a min_size warning, got ${w2}`);
  return `3 racks: size 3 ok, size 4 warns, min_size 5 warns harder`;
});

check('an EC pool sitting exactly on its domain count is flagged', () => {
  const doc = migrate(makeSample('threeRacks'));
  const rule = doc.rules.find((r) => r.name === 'ec-host');
  const ec = doc.pools.find((p) => p.name === 'cephfs_data');
  assert(poolWarning(doc, ec) === null, `4+2 over 9 hosts warned: ${poolWarning(doc, ec)}`);
  // Trim to exactly six hosts and the same pool becomes fragile.
  doc.hosts = doc.hosts.slice(0, 6);
  const w = poolWarning(doc, ec);
  assert(w && /no room/.test(w), `expected a "no room to retry" warning, got ${w}`);
  return '9 hosts clean, 6 hosts flagged as fragile';
});

check('a pgp_num below pg_num is reported', () => {
  const doc = migrate(makeSample('hyperconverged'));
  const p = doc.pools[0];
  p.pgp_num = p.pg_num / 2;
  const w = poolWarning(doc, p);
  assert(w && /pgp_num/.test(w), `expected a pgp_num warning, got ${w}`);
  return w;
});

check('a device class narrows the domains a rule can reach', () => {
  const doc = migrate(makeSample('threeRacks'));
  const any = { root: 'default', class: null, failureDomain: 'host' };
  const nvme = { root: 'default', class: 'nvme', failureDomain: 'host' };
  const ssd = { root: 'default', class: 'ssd', failureDomain: 'host' };
  assert(domainsAvailable(doc, any) === 9, `${domainsAvailable(doc, any)} hosts for any class`);
  assert(domainsAvailable(doc, nvme) === 9, 'every host has NVMe in this sample');
  assert(domainsAvailable(doc, ssd) === 0, `${domainsAvailable(doc, ssd)} hosts claim SSDs that do not exist`);
  const rackNvme = { root: 'default', class: 'nvme', failureDomain: 'rack' };
  assert(domainsAvailable(doc, rackNvme) === 3, `${domainsAvailable(doc, rackNvme)} racks with NVMe`);
  return 'any 9 hosts, nvme 9, ssd 0, nvme-by-rack 3';
});

// -------------------------------------------------------------- exports ----
check('exported SVG is standalone, well-formed and free of editor chrome', () => {
  for (const key of Object.keys(SAMPLES)) {
    loadDoc(makeSample(key));
    invalidate();
    state.derived = evaluate(state.doc);
    for (const tab of ['physical', 'crush', 'osdmap']) {
      const svg = buildSvg(tab);
      assert(svg.startsWith('<?xml'), `${key}/${tab}: no XML declaration`);
      assert(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svg), `${key}/${tab}: no namespace`);
      const body = svg.slice(svg.indexOf('<svg'));
      const errs = xmlErrors(body.replace(/<style>[\s\S]*?<\/style>/g, '<style/>'));
      assert(!errs.length, `${key}/${tab}: ${errs.slice(0, 2).join('; ')}`);
      for (const bad of ['NaN', 'undefined', 'Infinity']) {
        assert(!svg.includes(bad), `${key}/${tab}: "${bad}" reached the export`);
      }
      // Selection rings and marquees must not travel into someone's slides.
      for (const cls of ['sel-ring', 'sel-slot', 'marquee', 'link-preview']) {
        assert(!svg.includes(cls), `${key}/${tab}: editor chrome "${cls}" leaked into the export`);
      }
      // Self-contained: nothing to fetch.
      assert(!/(https?:)?\/\//.test(svg.replace(/xmlns="[^"]*"/g, '')),
        `${key}/${tab}: the export references something external`);
      const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg);
      assert(vb, `${key}/${tab}: no viewBox`);
      assert(Number(vb[3]) > 0 && Number(vb[4]) > 0, `${key}/${tab}: degenerate viewBox`);
    }
  }
  return `${Object.keys(SAMPLES).length} samples x 3 views`;
});

check('an empty cluster still exports something valid', () => {
  loadDoc(newDoc('empty'));
  invalidate();
  state.derived = evaluate(state.doc);
  for (const tab of ['physical', 'crush', 'osdmap']) {
    const svg = buildSvg(tab);
    assert(svg.includes('<svg'), `${tab}: nothing produced`);
    assert(!svg.includes('NaN'), `${tab}: NaN in an empty export`);
  }
  return 'physical, crush and osdmap all survive an empty document';
});

check('the generated ceph script covers the whole design', () => {
  loadDoc(makeSample('threeRacks'));
  invalidate();
  state.derived = evaluate(state.doc);
  const sh = buildCephScript();
  const doc = state.doc;
  for (const h of doc.hosts) {
    assert(sh.includes(`add-bucket ${h.name} host`), `${h.name} is not created`);
  }
  for (const b of doc.buckets.filter((x) => x.parent !== null)) {
    assert(sh.includes(`add-bucket ${b.name} ${b.type}`), `${b.name} is not created`);
  }
  for (const o of doc.hosts.flatMap((h) => h.osds)) {
    assert(sh.includes(`crush set osd.${o.id} `), `osd.${o.id} has no weight`);
    assert(sh.includes(`set-device-class ${o.class} osd.${o.id}`), `osd.${o.id} has no class`);
  }
  for (const r of doc.rules) assert(sh.includes(r.name), `rule ${r.name} missing`);
  for (const p of doc.pools) {
    assert(sh.includes(`pool create ${p.name} ${p.pg_num} ${p.pgp_num}`), `pool ${p.name} missing`);
    assert(sh.includes(`pool set ${p.name} min_size`), `pool ${p.name} has no min_size`);
  }
  for (const fs of doc.fs) assert(sh.includes(`fs new ${fs.name}`), `filesystem ${fs.name} missing`);
  for (const img of doc.rbd) assert(sh.includes(`rbd create ${img.pool}/${img.name}`), `image ${img.name} missing`);
  assert(sh.includes('#!/bin/sh'), 'no shebang');
  assert(/Review every line/.test(sh), 'no warning that this is generated');
  return `${sh.split('\n').length} lines covering ${doc.hosts.length} hosts, `
    + `${doc.rules.length} rules, ${doc.pools.length} pools`;
});

check('the ceph script takes k and m from the pools, not from a guess', () => {
  loadDoc(makeSample('threeRacks'));
  invalidate();
  state.derived = evaluate(state.doc);
  const ec = state.doc.pools.find((p) => p.type === 'erasure');
  assert(new RegExp(`k=${ec.k} m=${ec.m}`).test(buildCephScript()),
    `the profile does not say k=${ec.k} m=${ec.m}`);

  // Two pools with different geometries on one rule cannot share a profile.
  state.doc.pools.find((p) => p.name === 'rgw_data').k = 8;
  state.doc.pools.find((p) => p.name === 'rgw_data').m = 3;
  const sh = buildCephScript();
  assert(/different k\/m/.test(sh), 'a conflicting EC geometry passed without comment');
  return 'k/m taken from the pool, conflicts flagged';
});

check('reweighted and out OSDs survive the round trip into the script', () => {
  loadDoc(makeSample('hyperconverged'));
  const osd = state.doc.hosts[0].osds[0];
  osd.reweight = 0.5;
  state.doc.hosts[0].osds[1].in = false;
  invalidate();
  state.derived = evaluate(state.doc);
  const sh = buildCephScript();
  assert(sh.includes(`ceph osd reweight ${osd.id} 0.5`), 'the reweight is missing');
  assert(sh.includes(`ceph osd out ${state.doc.hosts[0].osds[1].id}`), 'the out OSD is missing');
  return 'reweight and out both emitted';
});
