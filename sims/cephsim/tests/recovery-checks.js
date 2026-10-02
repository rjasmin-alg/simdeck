// Recovery and backfill.
//
// The property that matters most is conservation: every byte the plan says has
// to move must actually be moved, and the cluster must end up holding exactly
// what CRUSH asked for — no more (stale copies pruned) and no less.

import { Recovery, planRecovery, placementFrom } from '../js/engine/recovery.js';
import { evaluate, invalidate } from '../js/compile.js';
import { migrate } from '../js/model.js';
import { makeSample } from '../js/samples.js';
import { poolWidth } from '../js/engine/pgmap.js';
import { TiB } from '../js/engine/capacity.js';

export const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, detail: fn() || '' }); }
  catch (err) { results.push({ name, pass: false, detail: err.message }); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const sample = (k) => migrate(makeSample(k));
const ev = (doc) => { invalidate(); return evaluate(doc); };

/** Settle a document, then apply `mutate` and return the resulting Recovery. */
function disturb(key, mutate) {
  const doc = sample(key);
  const before = ev(doc);
  const start = placementFrom(before.evals);
  mutate(doc);
  const after = ev(doc);
  return {
    doc, before, after,
    rec: new Recovery(doc, after.evals, start, { ...doc.settings, down: after.down }),
  };
}
const close = (a, b) => Math.abs(a - b) <= Math.max(1, Math.abs(a) * 1e-9);

/** Drain a recovery in fixed steps, guarding against a queue that cannot finish. */
function drain(rec, stepSeconds = 30, limit = 200000) {
  let ticks = 0;
  while (!rec.done && ticks < limit) { rec.tick(stepSeconds); ticks++; }
  assert(rec.done, `recovery did not finish after ${ticks} ticks`);
  return ticks * stepSeconds;
}

check('a settled cluster has nothing to recover', () => {
  const doc = sample('threeRacks');
  const d = ev(doc);
  const rec = new Recovery(doc, d.evals, placementFrom(d.evals), doc.settings);
  assert(rec.done, `${rec.items.length} items of work on an untouched cluster`);
  assert(rec.totalBytes === 0, `${rec.totalBytes} bytes to move on an untouched cluster`);
  const c = rec.liveCounts(d.evals);
  assert(c.clean === c.total, `${c.total - c.clean} PGs not clean at rest`);
  return `${c.total} PGs, all clean, no work`;
});

check('changing stored data or a name starts no backfill', () => {
  // Only placement moves data. Typing in the inspector must not.
  for (const [what, mutate] of [
    ['stored bytes', (d) => { d.pools[0].stored = 90 * TiB; }],
    ['a host name', (d) => { d.hosts[0].name = 'renamed-for-a-slide'; }],
    ['a position', (d) => { d.hosts[0].x += 400; }],
    ['min_size', (d) => { d.pools[0].min_size = 1; }],
  ]) {
    const { rec } = disturb('threeRacks', mutate);
    assert(rec.items.length === 0, `changing ${what} queued ${rec.items.length} shard copies`);
  }
  return 'stored, name, position and min_size all move nothing';
});

check('marking OSDs out backfills without degrading anything', () => {
  // The copies are still there and still serving; they are just no longer where
  // CRUSH wants them. Ceph calls this misplaced, not degraded.
  const { rec, after } = disturb('threeRacks', (d) => {
    for (const o of d.hosts[0].osds) o.in = false;
  });
  assert(rec.items.length > 0, 'marking a host out moved nothing');
  assert(rec.items.every((i) => i.kind === 'backfill'),
    `${rec.items.filter((i) => i.kind === 'recovery').length} items called recovery, expected all backfill`);
  const c0 = rec.liveCounts(after.evals);
  assert(c0.degraded === 0, `${c0.degraded} PGs degraded by an "out", which should not degrade`);
  assert(c0.misplaced > 0, 'nothing reported as misplaced');
  assert(c0.inactive === 0, 'marking OSDs out took PGs offline');
  return `${rec.items.length} shard copies, ${c0.misplaced} misplaced, 0 degraded`;
});

check('marking OSDs down degrades but moves nothing, as Ceph does', () => {
  // A down OSD is not an out OSD. Ceph waits mon_osd_down_out_interval before
  // marking it out, and until then nothing backfills — the PG is simply short a
  // copy. Queuing work here would be the wrong lesson entirely.
  const { rec, after } = disturb('threeRacks', (d) => { d.hosts[0].up = false; });
  const c = rec.liveCounts(after.evals);
  assert(c.degraded > 0, 'a downed host degraded nothing');
  assert(rec.items.length === 0,
    `${rec.items.length} shard copies queued for a host that is only down, not out`);
  return `${c.degraded} PGs degraded, ${c.clean} clean, 0 bytes queued`;
});

check('marking a downed host out is what actually starts recovery', () => {
  // Down first (degraded, nothing moving), then out: now CRUSH wants copies on
  // new OSDs and the live count is short, so this is recovery, not backfill.
  const doc = sample('threeRacks');
  const before = ev(doc);
  const start = placementFrom(before.evals);
  doc.hosts[0].up = false;
  for (const o of doc.hosts[0].osds) o.in = false;
  const after = ev(doc);
  const rec = new Recovery(doc, after.evals, start, { ...doc.settings, down: after.down });
  assert(rec.items.length > 0, 'marking a downed host out queued nothing');
  const recoveryItems = rec.items.filter((i) => i.kind === 'recovery').length;
  assert(recoveryItems > 0,
    'copies are genuinely missing, so this is recovery rather than backfill');
  return `${rec.items.length} copies queued, ${recoveryItems} classed as recovery`;
});

check('recovery is queued ahead of backfill', () => {
  const { rec } = disturb('threeRacks', (d) => {
    d.hosts[0].up = false;                          // gone...
    for (const o of d.hosts[0].osds) o.in = false;  // ...and out -> recovery
    for (const o of d.hosts[1].osds) o.in = false;  // merely moved -> backfill
  });
  const kinds = rec.items.map((i) => i.kind);
  const lastRecovery = kinds.lastIndexOf('recovery');
  const firstBackfill = kinds.indexOf('backfill');
  assert(lastRecovery >= 0, 'no recovery items at all — the setup is not testing anything');
  assert(firstBackfill >= 0, 'no backfill items at all — the setup is not testing anything');
  assert(lastRecovery < firstBackfill,
    'a backfill was queued ahead of a recovery — missing copies come first');
  return `${kinds.filter((k) => k === 'recovery').length} recovery then `
    + `${kinds.filter((k) => k === 'backfill').length} backfill`;
});

check('every byte planned is a byte moved', () => {
  const { rec } = disturb('threeRacks', (d) => {
    for (const o of d.hosts[0].osds) o.in = false;
  });
  const planned = rec.items.reduce((a, i) => a + i.bytes, 0);
  assert(close(planned, rec.totalBytes),
    `items add to ${planned} but totalBytes says ${rec.totalBytes}`);
  drain(rec);
  assert(close(rec.movedBytes, rec.totalBytes),
    `moved ${rec.movedBytes} of ${rec.totalBytes}`);
  assert(rec.progress === 1, `progress ended at ${rec.progress}`);
  return `${(rec.totalBytes / TiB).toFixed(1)} TiB planned and moved`;
});

check('draining converges to exactly the layout CRUSH asked for', () => {
  const { rec, after } = disturb('threeRacks', (d) => {
    for (const o of d.hosts[0].osds) o.in = false;
  });
  drain(rec);
  for (const e of after.evals) {
    const cur = rec.current.get(e.pool.id);
    for (let ps = 0; ps < e.pgs.length; ps++) {
      const want = new Set(e.pgs[ps].up);
      const have = cur[ps];
      for (const o of want) assert(have.has(o), `pool ${e.pool.name} pg ${ps} never got osd.${o}`);
      // Stale copies must be dropped once the replacement lands, or capacity
      // would keep creeping up after every recovery.
      assert(have.size === want.size,
        `pool ${e.pool.name} pg ${ps} holds ${have.size} copies, wanted ${want.size}`);
    }
  }
  const c = rec.liveCounts(after.evals);
  assert(c.clean === c.total, `${c.total - c.clean} PGs not clean after draining`);
  return `${c.total} PGs settled clean, no stale copies left`;
});

check('progress only ever goes forwards', () => {
  const { rec, after } = disturb('threeRacks', (d) => { d.hosts[0].up = false; });
  let last = -1;
  let lastClean = -1;
  let guard = 0;
  while (!rec.done && guard++ < 200000) {
    rec.tick(30);
    assert(rec.progress >= last, `progress went backwards: ${last} -> ${rec.progress}`);
    last = rec.progress;
    const clean = rec.liveCounts(after.evals).clean;
    assert(clean >= lastClean, `clean PG count went backwards: ${lastClean} -> ${clean}`);
    lastClean = clean;
  }
  assert(rec.done, 'never finished');
  return `monotonic to ${(rec.progress * 100).toFixed(0)}%`;
});

check('skipping ahead lands in the same place as waiting', () => {
  const a = disturb('threeRacks', (d) => { for (const o of d.hosts[0].osds) o.in = false; });
  const b = disturb('threeRacks', (d) => { for (const o of d.hosts[0].osds) o.in = false; });
  drain(a.rec);
  b.rec.finish();
  for (const e of a.after.evals) {
    const ca = a.rec.current.get(e.pool.id);
    const cb = b.rec.current.get(e.pool.id);
    for (let ps = 0; ps < e.pgs.length; ps++) {
      const sa = [...ca[ps]].sort().join(',');
      const sb = [...cb[ps]].sort().join(',');
      assert(sa === sb, `pool ${e.pool.name} pg ${ps}: drained ${sa} but skipped ${sb}`);
    }
  }
  assert(close(a.rec.movedBytes, b.rec.movedBytes),
    `different byte totals: ${a.rec.movedBytes} vs ${b.rec.movedBytes}`);
  return 'identical placement and byte count either way';
});

check('a faster network finishes sooner, proportionally', () => {
  const slow = disturb('threeRacks', (d) => {
    for (const l of d.links) l.speed = 10;
    for (const o of d.hosts[0].osds) o.in = false;
  });
  const fast = disturb('threeRacks', (d) => {
    for (const l of d.links) l.speed = 100;
    for (const o of d.hosts[0].osds) o.in = false;
  });
  assert(close(slow.rec.totalBytes, fast.rec.totalBytes),
    'the two runs are not moving the same data');
  const rSlow = slow.rec.currentRate();
  const rFast = fast.rec.currentRate();
  assert(rFast > rSlow * 5, `10G rate ${rSlow} vs 100G rate ${rFast} — not proportional`);
  const tSlow = slow.rec.eta();
  const tFast = fast.rec.eta();
  assert(tFast < tSlow / 5, `eta ${tSlow}s at 10G vs ${tFast}s at 100G`);
  return `10G eta ${(tSlow / 60).toFixed(0)} min, 100G eta ${(tFast / 60).toFixed(0)} min`;
});

check('osd_max_backfills caps how many copies land on one OSD at once', () => {
  for (const cap of [1, 3]) {
    const { doc, rec } = disturb('threeRacks', (d) => {
      d.settings.maxBackfills = cap;
      for (const o of d.hosts[0].osds) o.in = false;
    });
    rec.maxBackfills = cap;
    const perOsd = new Map();
    for (const it of rec.activeShares().keys()) {
      perOsd.set(it.osd, (perOsd.get(it.osd) || 0) + 1);
    }
    const worst = Math.max(0, ...perOsd.values());
    assert(worst <= cap, `${worst} concurrent backfills into one OSD with the cap at ${cap}`);
  }
  return 'caps of 1 and 3 both respected';
});

check('a higher backfill cap finishes faster', () => {
  const one = disturb('threeRacks', (d) => {
    d.settings.maxBackfills = 1;
    for (const o of d.hosts[0].osds) o.in = false;
  });
  const many = disturb('threeRacks', (d) => {
    d.settings.maxBackfills = 8;
    for (const o of d.hosts[0].osds) o.in = false;
  });
  const t1 = drain(one.rec, 60);
  const t8 = drain(many.rec, 60);
  assert(t8 <= t1, `cap 8 took ${t8}s but cap 1 took ${t1}s`);
  return `cap 1: ${(t1 / 60).toFixed(0)} min, cap 8: ${(t8 / 60).toFixed(0)} min`;
});

check('an empty pool still settles rather than stalling the queue', () => {
  // Zero-byte shards have no bandwidth cost, but they must still complete or a
  // pool with no data would leave the cluster permanently "backfilling".
  const { rec, after } = disturb('threeRacks', (d) => {
    for (const p of d.pools) p.stored = 0;
    for (const o of d.hosts[0].osds) o.in = false;
  });
  assert(rec.totalBytes === 0, `${rec.totalBytes} bytes for pools holding nothing`);
  assert(rec.done, `${rec.items.length} items still pending on empty pools`);
  const c = rec.liveCounts(after.evals);
  assert(c.clean === c.total, `${c.total - c.clean} PGs stuck`);
  return 'empty pools settle immediately';
});

check('planRecovery separates urgent work from tidying', () => {
  const doc = sample('threeRacks');
  const before = ev(doc);
  const start = placementFrom(before.evals);
  // One host gone for good (recovery), another merely reweighted out (backfill).
  doc.hosts[0].up = false;
  for (const o of doc.hosts[0].osds) o.in = false;
  for (const o of doc.hosts[1].osds) o.in = false;
  const after = ev(doc);
  const plan = planRecovery(doc, after.evals, start, after.down);
  assert(plan.degradedPgs > 0, 'nothing counted as degraded');
  assert(plan.misplacedPgs > 0, 'nothing counted as misplaced');
  assert(plan.items.length >= plan.degradedPgs + plan.misplacedPgs,
    'fewer copies queued than PGs needing them');
  return `${plan.degradedPgs} degraded, ${plan.misplacedPgs} misplaced, ${plan.items.length} copies`;
});
