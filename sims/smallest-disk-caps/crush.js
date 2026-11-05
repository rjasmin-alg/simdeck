/* SPDX-License-Identifier: AGPL-3.0-or-later
   CRUSH placement and per-PG bytes, as the cephsim engine computes them. Copied, unchanged in behaviour, from
   sims/cephsim/js/engine/hash.js (hash2, hash3, stableMod, bmaskFor), crush.js (straw2Choose, isOut, chooseFirstn,
   doRule for a firstn rule), crushmap.js (bucket weights = sum of children) and pgmap.js (pgToPps, pgBytes)
   @ 9fae442, turned into a classic script (COMMON §6: copy, do not link). Only straw2 buckets and firstn rules: the
   rest of the engine (uniform buckets, indep, device-class shadow trees) is not needed here.
   tools/check-engine.mjs compares this file with the engine over every lab cluster the page can build.
   Pure: no DOM, no Math.random. The page loads it as window.SimCrush; node tests require() it. */
(function (root) {
  'use strict';

  var NONE = 0x7fffffff;                     // CRUSH_ITEM_NONE
  var TYPES = ['osd', 'host', 'chassis', 'rack', 'row', 'pdu', 'pod', 'room', 'datacenter', 'zone', 'region', 'root'];
  // "Optimal" tunables (cephsim DEFAULT_TUNABLES).
  var TUNABLES = { choose_total_tries: 50, choose_local_tries: 0, choose_local_fallback_tries: 0, chooseleaf_vary_r: 1 };

  // ── Robert Jenkins' hash, as Ceph's src/crush/hash.c (cephsim hash.js) ──

  var SEED = 1315423911;
  function mix(s) {
    var a = s[0], b = s[1], c = s[2];
    a = (a - b) | 0; a = (a - c) | 0; a ^= c >>> 13;
    b = (b - c) | 0; b = (b - a) | 0; b ^= a << 8;
    c = (c - a) | 0; c = (c - b) | 0; c ^= b >>> 13;
    a = (a - b) | 0; a = (a - c) | 0; a ^= c >>> 12;
    b = (b - c) | 0; b = (b - a) | 0; b ^= a << 16;
    c = (c - a) | 0; c = (c - b) | 0; c ^= b >>> 5;
    a = (a - b) | 0; a = (a - c) | 0; a ^= c >>> 3;
    b = (b - c) | 0; b = (b - a) | 0; b ^= a << 10;
    c = (c - a) | 0; c = (c - b) | 0; c ^= b >>> 15;
    s[0] = a; s[1] = b; s[2] = c;
  }
  function hash2(a, b) {
    a |= 0; b |= 0;
    var hash = SEED ^ a ^ b, x = 231232, y = 1232, s;
    s = [a, b, hash]; mix(s); a = s[0]; b = s[1]; hash = s[2];
    s = [x, a, hash]; mix(s); x = s[0]; a = s[1]; hash = s[2];
    s = [b, y, hash]; mix(s); b = s[0]; y = s[1]; hash = s[2];
    return hash >>> 0;
  }
  function hash3(a, b, c) {
    a |= 0; b |= 0; c |= 0;
    var hash = SEED ^ a ^ b ^ c, x = 231232, y = 1232, s;
    s = [a, b, hash]; mix(s); a = s[0]; b = s[1]; hash = s[2];
    s = [c, x, hash]; mix(s); c = s[0]; x = s[1]; hash = s[2];
    s = [y, a, hash]; mix(s); y = s[0]; a = s[1]; hash = s[2];
    s = [b, x, hash]; mix(s); b = s[0]; x = s[1]; hash = s[2];
    s = [y, c, hash]; mix(s); y = s[0]; c = s[1]; hash = s[2];
    return hash >>> 0;
  }
  function stableMod(x, b, bmask) { return (x & bmask) < b ? (x & bmask) : (x & (bmask >> 1)); }
  function bmaskFor(n) { var m = 0; while (m < n - 1) m = (m << 1) | 1; return m; }

  // ── the map: a root of hosts of OSDs (cephsim compileMap + finalize, straw2 only) ──

  /**
   * hosts: [{ name, osds: [{ id, weight }] }] in tree order. Bucket ids as cephsim numbers them: the root -1, the
   * hosts -2, -3, … in order. Bucket weights are the sums of their children.
   */
  function buildMap(hosts) {
    var map = { buckets: {}, devices: {}, rootId: -1 };
    var rootItems = [], rootWeights = [];
    hosts.forEach(function (hst, i) {
      var id = -2 - i;
      var items = hst.osds.map(function (o) { return o.id; });
      var weights = hst.osds.map(function (o) { return o.weight; });
      hst.osds.forEach(function (o) { map.devices[o.id] = { id: o.id, weight: o.weight }; });
      var w = weights.reduce(function (a, x) { return a + x; }, 0);
      map.buckets[id] = { id: id, typeId: 1, items: items, weights: weights, weight: w };
      rootItems.push(id); rootWeights.push(w);
    });
    map.buckets[-1] = { id: -1, typeId: TYPES.indexOf('root'), items: rootItems, weights: rootWeights,
      weight: rootWeights.reduce(function (a, x) { return a + x; }, 0) };
    return map;
  }

  // ── buckets and selection (cephsim crush.js) ──

  /** straw2: every child draws ln(u)/w; the highest draw wins, the first child on a tie. */
  function straw2Choose(bucket, x, r) {
    var high = -1, highDraw = -Infinity;
    for (var i = 0; i < bucket.items.length; i++) {
      var w = bucket.weights[i], draw;
      if (w > 0) {
        var u = hash3(x, bucket.items[i], r) & 0xffff;
        draw = Math.log((u + 1) / 65536) / w;
      } else draw = -Infinity;
      if (high < 0 || draw > highDraw) { high = i; highDraw = draw; }
    }
    return high < 0 ? NONE : bucket.items[high];
  }

  /** Reweight as a probabilistic rejection (an absent reweight counts as out). */
  function isOut(reweights, x, item) {
    var w = reweights[item];
    if (w === undefined) return true;
    var fixed = Math.round(w * 0x10000);
    if (fixed >= 0x10000) return false;
    if (fixed === 0) return true;
    return (hash2(x, item) & 0xffff) >= fixed;
  }

  function chooseFirstn(map, bucket, reweights, x, numrep, type, out, outposIn, tries, recurseTries,
                        localRetries, localFallbackRetries, recurseToLeaf, varyR, out2, parentR) {
    var outpos = outposIn;
    for (var rep = outpos; rep < numrep; rep++) {
      var skipRep = false, item = NONE, ftotal = 0, retryDescent = true;
      while (retryDescent) {
        retryDescent = false;
        var inB = bucket, flocal = 0, retryBucket = true;
        while (retryBucket) {
          retryBucket = false;
          var r = rep + parentR + ftotal + flocal;
          item = straw2Choose(inB, x, r);
          if (item === NONE) { skipRep = true; break; }
          var itype = item >= 0 ? 0 : map.buckets[item].typeId;
          if (itype !== type) {
            if (item >= 0 || !map.buckets[item]) { skipRep = true; break; }
            inB = map.buckets[item];
            retryBucket = true;
            continue;
          }
          var collide = false;
          for (var i = 0; i < outpos; i++) if (out[i] === item) { collide = true; break; }
          var reject = false;
          if (!collide && recurseToLeaf) {
            if (item < 0) {
              var subR = varyR ? (r >> (varyR - 1)) : 0;
              var got = chooseFirstn(map, map.buckets[item], reweights, x, outpos + 1, 0, out2, outpos,
                recurseTries, recurseTries, localRetries, localFallbackRetries, false, varyR, null, subR);
              if (got <= outpos) reject = true;
            } else out2[outpos] = item;
          }
          if (!reject && !collide && item >= 0) reject = isOut(reweights, x, item);
          if (reject || collide) {
            ftotal++;
            flocal++;
            if (collide && flocal <= localRetries) retryBucket = true;
            else if (localFallbackRetries > 0 && flocal <= localRetries + localFallbackRetries) retryBucket = true;
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

  /** `take <root>; chooseleaf firstn 0 type host; emit` for placement value x: up to maxOut OSD ids. */
  function placeFirstn(map, x, maxOut, reweights) {
    var t = TUNABLES, out2 = [], scratch = [];
    var n = chooseFirstn(map, map.buckets[map.rootId], reweights, x, maxOut, TYPES.indexOf('host'), scratch, 0,
      t.choose_total_tries, t.choose_total_tries, t.choose_local_tries, t.choose_local_fallback_tries,
      true, t.chooseleaf_vary_r, out2, 0);
    var res = [];
    for (var i = 0; i < n; i++) if (out2[i] !== undefined) res.push(out2[i]);
    return res.slice(0, maxOut);
  }

  // ── PGs (cephsim pgmap.js) ──

  /** A PG's placement value with HASHPSPOOL (OSDMap::raw_pg_to_pps). */
  function pgToPps(poolId, pgpNum, ps) { return hash2(stableMod(ps, pgpNum, bmaskFor(pgpNum)), poolId); }

  /** Deterministic per-PG share of the pool's bytes, mean-preserving log-normal with the given skew. */
  function pgBytes(poolId, pgNum, ps, total, skew) {
    var base = total / pgNum;
    if (!skew) return base;
    var u1 = (hash3(poolId, ps, 1) >>> 0) / 4294967296 || 1e-9;
    var u2 = (hash3(poolId, ps, 2) >>> 0) / 4294967296;
    var z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return base * Math.exp(skew * z - (skew * skew) / 2);
  }

  /** Raw CRUSH output for every PG of a pool { id, pgNum, size }: an array of OSD id arrays. */
  function mapPool(map, pool, reweights) {
    var raw = [];
    for (var ps = 0; ps < pool.pgNum; ps++) raw.push(placeFirstn(map, pgToPps(pool.id, pool.pgNum, ps), pool.size, reweights));
    return raw;
  }

  var crush = {
    NONE: NONE, hash2: hash2, hash3: hash3, stableMod: stableMod, bmaskFor: bmaskFor,
    buildMap: buildMap, straw2Choose: straw2Choose, placeFirstn: placeFirstn,
    pgToPps: pgToPps, pgBytes: pgBytes, mapPool: mapPool
  };
  if (typeof module === 'object' && module.exports) module.exports = crush;
  else root.SimCrush = crush;
})(typeof globalThis !== 'undefined' ? globalThis : this);
