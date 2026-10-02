// PGs: the layer between "a pool holds data" and "these disks hold bytes".
//
// A pool is pg_num placement groups. Each PG hashes to a placement value, CRUSH
// turns that into an ordered set of OSDs, and the OSDs that are actually up and
// in become the PG's acting set. Everything a user sees — capacity, degraded
// counts, whether the filesystem still answers — is derived from here.

import { doRule, NONE } from './crush.js';
import { hash2, hash3, stableMod, bmaskFor } from './hash.js';

/**
 * A PG's placement value, exactly as OSDMap::raw_pg_to_pps computes it with the
 * HASHPSPOOL flag (on by default since Firefly).
 *
 * Note it hashes through pgp_num, not pg_num. That is why raising pg_num alone
 * splits PGs without moving any data, and raising pgp_num is what actually
 * shuffles it — the single most useful thing to know when growing a pool.
 */
export function pgToPps(pool, ps) {
  const mask = bmaskFor(pool.pgp_num);
  return hash2(stableMod(ps, pool.pgp_num, mask), pool.id);
}

/** Replicas (replicated) or shards (erasure) a pool wants. */
export function poolWidth(pool) {
  return pool.type === 'erasure' ? pool.k + pool.m : pool.size;
}

/** Below this many live shards the PG stops serving I/O. */
export function poolMinSize(pool) {
  if (pool.min_size !== undefined) return pool.min_size;
  return pool.type === 'erasure' ? pool.k : Math.max(1, pool.size - 1);
}

/**
 * Raw CRUSH output for every PG in a pool. This is the expensive call — it is
 * the one thing the tick loop must never do. Cache it against a map epoch.
 */
export function mapPool(map, pool, reweights) {
  const width = poolWidth(pool);
  const raw = new Array(pool.pg_num);
  for (let ps = 0; ps < pool.pg_num; ps++) {
    raw[ps] = doRule(map, pool.crush_rule, pgToPps(pool, ps), width, reweights);
  }
  return raw;
}

// PG states, named as `ceph pg stat` names them.
export const CLEAN = 'active+clean';

/**
 * Turn raw CRUSH output into up/acting sets and a state, given which OSDs are
 * currently down.
 *
 * `out` OSDs never appear here at all — being out is expressed as reweight 0,
 * so CRUSH has already routed around them. `down` OSDs *do* appear in the raw
 * set (CRUSH does not know about liveness) and are subtracted here. That split
 * is real, and it is why marking an OSD down and marking it out do different
 * things.
 */
export function pgState(pool, rawSet, down, prevActing) {
  const width = poolWidth(pool);
  const minSize = poolMinSize(pool);
  const holes = rawSet.filter((o) => o === NONE).length;
  const placed = rawSet.filter((o) => o !== NONE);
  const up = placed.filter((o) => !down.has(o));

  const states = [];
  let active = up.length >= minSize;

  if (up.length === 0) {
    states.push('stale', 'inactive');
    active = false;
  } else if (!active) {
    states.push('incomplete', 'inactive');
  } else {
    states.push('active');
  }

  if (active) {
    // `placed` already dropped NONE holes, so a hole shows up here as a short
    // up set — an EC shard CRUSH could not place is degraded from birth.
    if (up.length < width) states.push('undersized', 'degraded');
    if (prevActing && prevActing.length) {
      const moved = up.some((o) => !prevActing.includes(o));
      if (moved) states.push(up.length < width ? 'backfilling' : 'remapped');
    }
    if (states.length === 1) states.push('clean');
  }

  return {
    up,
    acting: up,
    primary: up.length ? up[0] : null,
    holes,
    active,
    degraded: active && up.length < width,
    state: states.join('+'),
  };
}

/** Deterministic per-PG byte size, so the same cluster always fills the same way. */
function pgBytes(pool, ps, total, skew) {
  const base = total / pool.pg_num;
  if (!skew) return base;
  // Box-Muller off the hash, so it is reproducible rather than random.
  const u1 = (hash3(pool.id, ps, 1) >>> 0) / 4294967296 || 1e-9;
  const u2 = (hash3(pool.id, ps, 2) >>> 0) / 4294967296;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return base * Math.exp(skew * z - (skew * skew) / 2);   // mean-preserving
}

/**
 * Everything derived for one pool: per-PG placement, state counts, and how many
 * bytes each OSD is carrying on this pool's behalf.
 *
 * @param {object} opts.down  Set of down osd ids
 * @param {number} opts.skew  per-PG size variance (0 = every PG identical)
 */
export function evaluatePool(map, pool, reweights, opts = {}) {
  const down = opts.down || new Set();
  const skew = opts.skew ?? 0.25;
  const prev = opts.prev || null;
  const raw = opts.raw || mapPool(map, pool, reweights);
  const width = poolWidth(pool);

  const pgs = new Array(pool.pg_num);
  const stateCounts = {};
  const osdBytes = new Map();
  const osdPgs = new Map();
  let degraded = 0, inactive = 0, misplaced = 0, undersizedShards = 0;

  // An EC shard is stored/k bytes; a replica is the whole thing.
  const perShard = pool.type === 'erasure' ? 1 / pool.k : 1;

  for (let ps = 0; ps < pool.pg_num; ps++) {
    const st = pgState(pool, raw[ps], down, prev ? prev[ps] : null);
    pgs[ps] = st;
    stateCounts[st.state] = (stateCounts[st.state] || 0) + 1;
    if (!st.active) inactive++;
    if (st.degraded) { degraded++; undersizedShards += width - st.up.length; }
    if (st.state.includes('remapped') || st.state.includes('backfilling')) misplaced++;

    const bytes = pgBytes(pool, ps, pool.stored || 0, skew) * perShard;
    // Recovery needs this to know how long each shard takes to copy, and there
    // is no point recomputing a distribution we have already drawn.
    st.bytes = bytes;
    for (const o of st.up) {
      osdBytes.set(o, (osdBytes.get(o) || 0) + bytes);
      osdPgs.set(o, (osdPgs.get(o) || 0) + 1);
    }
  }

  return {
    pool, raw, pgs, stateCounts, osdBytes, osdPgs,
    degraded, inactive, misplaced, undersizedShards,
    active: pool.pg_num - inactive,
    /** raw bytes this pool consumes across all OSDs */
    rawUsed: [...osdBytes.values()].reduce((a, b) => a + b, 0),
  };
}

/** Raw-to-usable ratio: 1/size replicated, k/(k+m) erasure. */
export function poolEfficiency(pool) {
  return pool.type === 'erasure' ? pool.k / (pool.k + pool.m) : 1 / pool.size;
}

export { NONE };
