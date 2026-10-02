// SPDX-License-Identifier: AGPL-3.0-or-later
// Recovery and backfill: the lag between what CRUSH wants and what the disks hold.
//
// `evaluate()` answers "where should this data be?" instantly, because CRUSH is
// a function. A real cluster does not move at the speed of a function — it has
// to copy the bytes, over a network, a few PGs at a time. That gap is the whole
// of this file, and it is where most operational pain actually lives: not in the
// new layout being wrong, but in the hours spent getting to it.
//
// The distinction Ceph draws and this keeps:
//   * **recovery** — a copy is missing, so the PG is degraded. Urgent.
//   * **backfill** — the right number of copies exist, they are just not where
//     CRUSH now wants them. The data is safe; this is tidying.
//
// Deliberately not modelled: the PG log (so no log-based vs full backfill
// distinction), peering time, `osd_recovery_sleep`, priority classes, and the
// read side of the copy. Rates come from link bandwidth and concurrency limits
// only.

import { poolWidth, poolMinSize } from './pgmap.js';
import { hostBandwidth } from './net.js';

/** Snapshot of who currently holds each PG: poolId -> array of Sets of osd ids. */
export function placementFrom(evals) {
  const out = new Map();
  for (const ev of evals) out.set(ev.pool.id, ev.pgs.map((pg) => new Set(pg.up)));
  return out;
}

/**
 * What has to move to get from `prev` to the acting sets in `evals`.
 *
 * `down` matters twice over. A copy sitting on a down OSD still occupies the
 * placement — that is why marking an OSD *down* queues no work at all, and
 * nothing moves until the monitors mark it *out* — but it does not count as a
 * live copy, which is what decides whether outstanding work is urgent recovery
 * or leisurely backfill.
 *
 * @returns {{items: Array, totalBytes: number, degradedPgs: number, misplacedPgs: number}}
 */
export function planRecovery(doc, evals, prev, down = new Set()) {
  const items = [];
  let totalBytes = 0;
  let degradedPgs = 0;
  let misplacedPgs = 0;

  for (const ev of evals) {
    const pool = ev.pool;
    const width = poolWidth(pool);
    const held = prev?.get(pool.id);

    for (let ps = 0; ps < ev.pgs.length; ps++) {
      const want = ev.pgs[ps].up;
      const have = held ? held[ps] : new Set(want);
      const missing = want.filter((o) => !have.has(o));
      if (!missing.length) continue;

      // A PG short of *live* copies is being recovered; one whose copies are all
      // present and merely in the wrong place is being backfilled.
      const live = [...have].filter((o) => !down.has(o)).length;
      const degraded = live < width;
      if (degraded) degradedPgs++; else misplacedPgs++;

      const bytes = ev.pgs[ps].bytes ?? 0;
      for (const osd of missing) {
        items.push({
          poolId: pool.id, ps, osd, bytes,
          kind: degraded ? 'recovery' : 'backfill',
          moved: 0,
        });
        totalBytes += bytes;
      }
    }
  }
  // Missing copies before tidying, exactly as Ceph prioritises it.
  items.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'recovery' ? -1 : 1));
  return { items, totalBytes, degradedPgs, misplacedPgs };
}

/**
 * A recovery in progress. Holds the current placement and drains work into it.
 *
 * The tick loop only ever touches this — it must never re-run CRUSH, which is
 * two orders of magnitude more expensive and the reason this class exists.
 */
export class Recovery {
  constructor(doc, evals, prev, settings = {}) {
    this.down = settings.down ?? new Set();
    const plan = planRecovery(doc, evals, prev, this.down);
    this.doc = doc;
    this.items = plan.items;
    this.totalBytes = plan.totalBytes;
    this.movedBytes = 0;
    this.elapsed = 0;
    this.current = prev ? clonePlacement(prev) : placementFrom(evals);
    this.target = placementFrom(evals);
    this.maxBackfills = settings.maxBackfills ?? doc.settings?.maxBackfills ?? 1;
    this.fraction = settings.recoveryFraction ?? doc.settings?.recoveryFraction ?? 0.5;
    this.bandwidth = new Map();        // host id -> bytes/s available to recovery
    this.osdHost = new Map();
    for (const h of doc.hosts) {
      this.bandwidth.set(h.id, hostBandwidth(doc, h.id) * this.fraction);
      for (const o of h.osds) this.osdHost.set(o.id, h.id);
    }
    this.pending = new Map();          // "poolId:ps" -> count of outstanding items
    for (const it of this.items) {
      const k = `${it.poolId}:${it.ps}`;
      this.pending.set(k, (this.pending.get(k) || 0) + 1);
    }
    // A shard with no bytes has nothing to copy, so it arrives at once. Without
    // this a pool holding no data would sit "backfilling" forever, one
    // concurrency slot at a time, which is nonsense.
    this.settleEmpty();
  }

  settleEmpty() {
    const empty = new Set(this.items.filter((it) => it.bytes <= 0));
    if (!empty.size) return;
    for (const it of empty) {
      this.current.get(it.poolId)?.[it.ps]?.add(it.osd);
      const k = `${it.poolId}:${it.ps}`;
      const n = (this.pending.get(k) || 1) - 1;
      if (n <= 0) this.pending.delete(k); else this.pending.set(k, n);
    }
    this.items = this.items.filter((it) => !empty.has(it));
    this.prune(empty);
  }

  get done() { return this.items.length === 0; }
  get progress() {
    // An empty queue is finished, whatever the last float said. Accumulating
    // thousands of partial copies leaves movedBytes a hair under totalBytes.
    if (this.done) return 1;
    return this.totalBytes ? Math.min(1, this.movedBytes / this.totalBytes) : 1;
  }
  get remainingBytes() { return Math.max(0, this.totalBytes - this.movedBytes); }

  /** Seconds remaining at the current rate, or null when nothing is moving. */
  eta() {
    const rate = this.currentRate();
    return rate > 0 ? this.remainingBytes / rate : null;
  }

  /** Aggregate bytes/s the cluster can actually push right now. */
  currentRate() {
    let rate = 0;
    for (const [, share] of this.activeShares()) rate += share;
    return rate;
  }

  /**
   * Which items are in flight and how much bandwidth each gets.
   *
   * Concurrency is capped per destination OSD by osd_max_backfills, and the
   * host's recovery bandwidth is split evenly between whatever it is pulling.
   */
  activeShares() {
    const perOsd = new Map();
    const active = [];
    for (const it of this.items) {
      const n = perOsd.get(it.osd) || 0;
      if (n >= this.maxBackfills) continue;
      perOsd.set(it.osd, n + 1);
      active.push(it);
    }
    const byHost = new Map();
    for (const it of active) {
      const h = this.osdHost.get(it.osd);
      if (!byHost.has(h)) byHost.set(h, []);
      byHost.get(h).push(it);
    }
    const shares = new Map();
    for (const [h, list] of byHost) {
      const bw = this.bandwidth.get(h) ?? 0;
      const each = list.length ? bw / list.length : 0;
      for (const it of list) shares.set(it, each);
    }
    return shares;
  }

  /**
   * Advance by `seconds` of simulated time.
   * @returns {{completed: number, moved: number}}
   */
  tick(seconds) {
    if (this.done || seconds <= 0) return { completed: 0, moved: 0 };
    this.elapsed += seconds;
    const shares = this.activeShares();
    let moved = 0;
    let completed = 0;
    const finished = new Set();

    for (const [it, rate] of shares) {
      if (rate <= 0) continue;
      const step = Math.min(rate * seconds, it.bytes - it.moved);
      it.moved += step;
      moved += step;
      if (it.moved >= it.bytes - 1e-6) finished.add(it);
    }

    if (finished.size) {
      for (const it of finished) {
        this.current.get(it.poolId)?.[it.ps]?.add(it.osd);
        const k = `${it.poolId}:${it.ps}`;
        const n = (this.pending.get(k) || 1) - 1;
        if (n <= 0) this.pending.delete(k); else this.pending.set(k, n);
        completed++;
      }
      this.items = this.items.filter((it) => !finished.has(it));
    }
    this.movedBytes += moved;

    // Once a PG's data has arrived, whatever it displaced is no longer held.
    if (finished.size) this.prune(finished);
    return { completed, moved };
  }

  /** Drop copies the target no longer wants, once the replacement has landed. */
  prune(finished) {
    const pools = new Set([...finished].map((it) => it.poolId));
    for (const poolId of pools) {
      const cur = this.current.get(poolId);
      const tgt = this.target.get(poolId);
      if (!cur || !tgt) continue;
      for (const it of finished) {
        if (it.poolId !== poolId) continue;
        if (this.pending.has(`${poolId}:${it.ps}`)) continue;   // still arriving
        for (const osd of [...cur[it.ps]]) if (!tgt[it.ps].has(osd)) cur[it.ps].delete(osd);
      }
    }
  }

  /** Run to completion without animating — "skip the wait". */
  finish() {
    for (const it of this.items) {
      this.current.get(it.poolId)?.[it.ps]?.add(it.osd);
    }
    this.movedBytes = this.totalBytes;
    const all = new Set(this.items);
    this.items = [];
    this.pending.clear();
    this.prune(all);
  }

  /** Is this PG still waiting on data? */
  pgPending(poolId, ps) { return this.pending.has(`${poolId}:${ps}`); }

  /**
   * PG counts as they would read in `ceph -s` *right now*, mid-recovery, rather
   * than at the target layout.
   *
   * Only copies on OSDs that are actually up count. A replica sitting on a
   * downed disk is not a replica you have.
   */
  liveCounts(evals, down = this.down) {
    let clean = 0, degraded = 0, misplaced = 0, inactive = 0, total = 0;
    for (const ev of evals) {
      const width = poolWidth(ev.pool);
      const minSize = poolMinSize(ev.pool);
      const cur = this.current.get(ev.pool.id);
      total += ev.pgs.length;
      for (let ps = 0; ps < ev.pgs.length; ps++) {
        const live = cur
          ? [...cur[ps]].filter((o) => !down.has(o)).length
          : ev.pgs[ps].up.length;
        if (live < minSize) inactive++;
        else if (live < width) degraded++;
        else if (this.pgPending(ev.pool.id, ps)) misplaced++;
        else clean++;
      }
    }
    return { clean, degraded, misplaced, inactive, total };
  }
}

function clonePlacement(p) {
  const out = new Map();
  for (const [k, arr] of p) out.set(k, arr.map((s) => new Set(s)));
  return out;
}
