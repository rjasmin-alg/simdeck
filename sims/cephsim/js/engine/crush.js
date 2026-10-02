// SPDX-License-Identifier: AGPL-3.0-or-later
// The CRUSH engine: straw2 buckets and rule execution.
//
// Ported from Ceph's src/crush/mapper.c. The structure is faithful — recursive
// descent, retry accounting, the firstn/indep split, chooseleaf recursion and
// vary_r — because those details are exactly what a student gets wrong and what
// this tool exists to make visible.
//
// Two documented divergences from upstream (see README "What this is not"):
//   1. straw2 uses Math.log rather than Ceph's fixed-point crush_ln() table.
//      Statistically identical; individual PG->OSD mappings may differ.
//   2. Only straw2 and uniform buckets exist. list/tree buckets were deprecated
//      long before anyone reading this deployed a cluster.

import { hash2, hash3 } from './hash.js';

export const NONE = 0x7fffffff;   // CRUSH_ITEM_NONE
const UNDEF = 0x7ffffffe;         // CRUSH_ITEM_UNDEF

// The standard type ladder. Index is the numeric type id CRUSH compares against.
export const TYPES = [
  'osd', 'host', 'chassis', 'rack', 'row', 'pdu',
  'pod', 'room', 'datacenter', 'zone', 'region', 'root',
];
export const typeId = (name) => TYPES.indexOf(name);

// "Optimal" tunables, i.e. what any cluster from Jewel onwards runs.
export const DEFAULT_TUNABLES = {
  choose_total_tries: 50,
  choose_local_tries: 0,
  choose_local_fallback_tries: 0,
  chooseleaf_descend_once: 1,
  chooseleaf_vary_r: 1,
  // chooseleaf_stable is deliberately not modelled: it perturbs which leaf a
  // descent settles on to shave a little data movement, and getting it subtly
  // wrong would be worse than not having it. Documented in README.
};

// ------------------------------------------------------------------ buckets --

/**
 * straw2: every child draws a random number scaled by its weight, highest wins.
 * The magic is that a child's draw does not depend on any other child, so
 * removing one child leaves every other child's draw untouched — which is why
 * only that child's share of the data moves.
 */
function straw2Choose(bucket, x, r) {
  let high = -1;
  let highDraw = -Infinity;
  for (let i = 0; i < bucket.items.length; i++) {
    const w = bucket.weights[i];
    let draw;
    if (w > 0) {
      const u = hash3(x, bucket.items[i], r) & 0xffff;
      // ln over (0, 1] — always negative, so a bigger weight means a bigger
      // (less negative) draw. Matches crush_ln()'s [1/0x10000, 1] domain.
      draw = Math.log((u + 1) / 65536) / w;
    } else {
      draw = -Infinity;
    }
    if (high < 0 || draw > highDraw) { high = i; highDraw = draw; }
  }
  return high < 0 ? NONE : bucket.items[high];
}

/**
 * Partial Fisher-Yates over the bucket's items, as crush_bucket_perm_choose
 * does. Ceph memoises the permutation across calls; recomputing it is the same
 * answer, just slower, and uniform buckets are vanishingly rare in practice.
 */
function uniformChoose(bucket, x, r) {
  const size = bucket.items.length;
  if (size === 0) return NONE;
  const pr = ((r % size) + size) % size;
  const perm = [];
  for (let i = 0; i < size; i++) perm.push(i);
  const i0 = hash3(x, bucket.id, 0) % size;
  perm[0] = i0; perm[i0] = 0;
  for (let p = 1; p <= pr; p++) {
    if (p < size - 1) {
      const i = hash3(x, bucket.id, p) % (size - p);
      if (i) { const t = perm[p + i]; perm[p + i] = perm[p]; perm[p] = t; }
    }
  }
  return bucket.items[perm[pr]];
}

function bucketChoose(bucket, x, r) {
  return bucket.alg === 'uniform' ? uniformChoose(bucket, x, r)
                                  : straw2Choose(bucket, x, r);
}

/**
 * `ceph osd reweight` — a probabilistic rejection at selection time, entirely
 * separate from the CRUSH weight in the bucket. An OSD at reweight 0.5 is still
 * full-weight in the tree; it just gets thrown back half the time. This is the
 * distinction people conflate, and it is why reweighting cascades badly.
 */
function isOut(reweights, x, item) {
  const w = reweights[item];
  if (w === undefined) return true;
  const fixed = Math.round(w * 0x10000);
  if (fixed >= 0x10000) return false;
  if (fixed === 0) return true;
  return (hash2(x, item) & 0xffff) >= fixed;
}

// ------------------------------------------------------------------- firstn --

function chooseFirstn(map, bucket, reweights, x, numrep, type, out, outposIn,
                      tries, recurseTries, localRetries, localFallbackRetries,
                      recurseToLeaf, varyR, out2, parentR) {
  let outpos = outposIn;

  for (let rep = outpos; rep < numrep; rep++) {
    let skipRep = false;
    let item = NONE;
    let ftotal = 0;
    let retryDescent = true;

    while (retryDescent) {
      retryDescent = false;
      let inB = bucket;
      let flocal = 0;
      let retryBucket = true;

      while (retryBucket) {
        retryBucket = false;
        let r = rep + parentR + ftotal + flocal;
        item = bucketChoose(inB, x, r);
        if (item === NONE) { skipRep = true; break; }

        const itype = item >= 0 ? 0 : map.buckets[item].typeId;
        if (itype !== type) {
          if (item >= 0 || !map.buckets[item]) { skipRep = true; break; }
          inB = map.buckets[item];
          retryBucket = true;
          continue;
        }

        let collide = false;
        for (let i = 0; i < outpos; i++) if (out[i] === item) { collide = true; break; }

        let reject = false;
        if (!collide && recurseToLeaf) {
          if (item < 0) {
            const subR = varyR ? (r >> (varyR - 1)) : 0;
            const got = chooseFirstn(map, map.buckets[item], reweights, x,
              outpos + 1, 0, out2, outpos,
              recurseTries, recurseTries, localRetries, localFallbackRetries,
              false, varyR, null, subR);
            if (got <= outpos) reject = true;   // descent found no usable leaf
          } else {
            out2[outpos] = item;
          }
        }
        if (!reject && !collide && item >= 0) reject = isOut(reweights, x, item);

        if (reject || collide) {
          ftotal++;
          flocal++;
          if (collide && flocal <= localRetries) retryBucket = true;
          else if (localFallbackRetries > 0 &&
                   flocal <= localRetries + localFallbackRetries) retryBucket = true;
          else if (ftotal < tries) retryDescent = true;
          else skipRep = true;
        }
      }
      if (skipRep) break;
    }

    if (skipRep) continue;
    out[outpos] = item;
    outpos++;
  }
  return outpos;
}

// -------------------------------------------------------------------- indep --

/**
 * The erasure-coded path. Unlike firstn, position matters: shard 3 is shard 3.
 * A shard that cannot be placed leaves a NONE hole rather than shifting the
 * shards after it, because shifting them would invalidate every stripe.
 */
function chooseIndep(map, bucket, reweights, x, left, numrep, type,
                     out, outpos, tries, recurseTries, recurseToLeaf,
                     out2, parentR) {
  const endpos = outpos + left;
  for (let rep = outpos; rep < endpos; rep++) {
    out[rep] = UNDEF;
    if (out2) out2[rep] = UNDEF;
  }

  for (let ftotal = 0; left > 0 && ftotal < tries; ftotal++) {
    for (let rep = outpos; rep < endpos; rep++) {
      if (out[rep] !== UNDEF) continue;
      let inB = bucket;

      for (;;) {
        let r = rep + parentR;
        r += (inB.alg === 'uniform' && inB.items.length % numrep === 0)
          ? (numrep + 1) * ftotal
          : numrep * ftotal;

        const item = bucketChoose(inB, x, r);
        if (item === NONE) {
          out[rep] = NONE;
          if (out2) out2[rep] = NONE;
          left--;
          break;
        }

        const itype = item >= 0 ? 0 : map.buckets[item].typeId;
        if (itype !== type) {
          if (item >= 0 || !map.buckets[item]) {
            out[rep] = NONE;
            if (out2) out2[rep] = NONE;
            left--;
            break;
          }
          inB = map.buckets[item];
          continue;
        }

        let collide = false;
        for (let i = outpos; i < endpos; i++) if (out[i] === item) { collide = true; break; }
        if (collide) break;

        if (recurseToLeaf) {
          if (item < 0) {
            chooseIndep(map, map.buckets[item], reweights, x, 1, numrep, 0,
                        out2, rep, recurseTries, recurseTries, false, null, r);
            if (out2[rep] === NONE) break;
          } else {
            out2[rep] = item;
          }
        }

        if (itype === 0 && isOut(reweights, x, item)) break;

        out[rep] = item;
        left--;
        break;
      }
    }
  }

  for (let rep = outpos; rep < endpos; rep++) {
    if (out[rep] === UNDEF) out[rep] = NONE;
    if (out2 && out2[rep] === UNDEF) out2[rep] = NONE;
  }
}

// ----------------------------------------------------------------- do_rule --

/**
 * Run one CRUSH rule for placement value `x`.
 *
 * @param {object} map        compiled crush map (see buildMap in crushmap.js)
 * @param {string|number} ruleRef  rule id or name
 * @param {number} x          the placement value (a hashed PG id)
 * @param {number} maxOut     replicas / shards wanted (pool size, or k+m)
 * @param {number[]} reweights  osd id -> 0..1 reweight
 * @returns {number[]} osd ids, length <= maxOut, possibly containing NONE
 */
export function doRule(map, ruleRef, x, maxOut, reweights) {
  const rule = typeof ruleRef === 'number'
    ? map.rules.find((r) => r.id === ruleRef)
    : map.rules.find((r) => r.name === ruleRef);
  if (!rule) throw new Error(`crush: no such rule ${ruleRef}`);

  const t = map.tunables;
  let w = [];                       // the current working set
  const result = [];
  let recurseTries = t.choose_total_tries;
  let chooseTries = t.choose_total_tries;
  let chooseLeafTries = 0;

  for (const step of rule.steps) {
    switch (step.op) {
      case 'set_choose_tries': chooseTries = step.num; break;
      case 'set_chooseleaf_tries': chooseLeafTries = step.num; break;
      case 'take': {
        const id = map.rootId(step.item, step.class);
        // A take that resolves to nothing is not an error: `take default class
        // nvme` on a cluster with no NVMe has no shadow tree to take, and a real
        // cluster answers by placing nothing. panel-pools.js surfaces it as a
        // pool warning, which is where it is actionable.
        if (id === undefined) { w = []; break; }
        w = [id];
        break;
      }
      case 'choose':
      case 'chooseleaf': {
        const leaf = step.op === 'chooseleaf';
        const type = typeof step.type === 'number' ? step.type : typeId(step.type);
        if (type < 0) throw new Error(`crush: unknown type ${step.type}`);
        const out = [];
        for (const item of w) {
          let numrep = step.num;
          if (numrep <= 0) {
            numrep = maxOut + numrep;
            if (numrep <= 0) continue;
          }
          if (item >= 0) { out.push(item); continue; }   // already a device
          const bucket = map.buckets[item];
          const out2 = leaf ? [] : null;
          const scratch = [];
          if (step.mode === 'indep') {
            chooseIndep(map, bucket, reweights, x, numrep, numrep, type,
                        scratch, 0, chooseTries,
                        chooseLeafTries || recurseTries, leaf, out2, 0);
            const src = leaf ? out2 : scratch;
            for (let i = 0; i < numrep; i++) out.push(src[i] === undefined ? NONE : src[i]);
          } else {
            const n = chooseFirstn(map, bucket, reweights, x, numrep, type,
                        scratch, 0, chooseTries,
                        chooseLeafTries || recurseTries,
                        t.choose_local_tries, t.choose_local_fallback_tries,
                        leaf, t.chooseleaf_vary_r, out2, 0);
            const src = leaf ? out2 : scratch;
            for (let i = 0; i < n; i++) if (src[i] !== undefined) out.push(src[i]);
          }
        }
        w = out;
        break;
      }
      case 'emit':
        for (const item of w) result.push(item);
        w = [];
        break;
      default:
        throw new Error(`crush: unknown rule op ${step.op}`);
    }
  }
  return result.slice(0, maxOut);
}
