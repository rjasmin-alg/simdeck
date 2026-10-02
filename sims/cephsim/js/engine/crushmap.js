// SPDX-License-Identifier: AGPL-3.0-or-later
// Building and finalising a CRUSH map.
//
// A map is plain data. `finalize()` does the two derivations Ceph does for you
// on a real cluster and that everybody forgets are happening:
//
//   1. Bucket weights are the sum of their children, bottom-up. You never set a
//      rack's weight; it *is* the sum of its hosts.
//   2. Device classes become shadow trees. `default~ssd` is a real, parallel
//      hierarchy containing only the SSDs, and `step take default class ssd`
//      takes that tree. Without this, "put metadata on SSD" cannot work.

import { TYPES, typeId, DEFAULT_TUNABLES } from './crush.js';

export function newMap(tunables = {}) {
  const map = {
    devices: {},                  // id -> {id, name, class, weight}
    buckets: {},                  // negative id -> bucket
    rules: [],
    tunables: { ...DEFAULT_TUNABLES, ...tunables },
    byName: {},                   // bucket name -> id
    parent: {},                   // child id -> parent bucket id
    nextBucketId: -1,
    shadow: {},                   // "rootName~class" -> shadow bucket id
  };
  map.rootId = (name, cls) => {
    if (cls) {
      const s = map.shadow[`${name}~${cls}`];
      if (s !== undefined) return s;
      return undefined;
    }
    return map.byName[name];
  };
  return map;
}

export function addDevice(map, id, name, cls = 'hdd', weight = 1) {
  map.devices[id] = { id, name, class: cls, weight };
  return id;
}

/**
 * `id` may be given to preserve the numbering from an imported crushmap. Ceph
 * itself treats bucket ids as stable identifiers ("do not change unnecessarily"),
 * so honouring them makes a decompile/compile round trip byte-for-byte stable.
 */
export function addBucket(map, { name, type, alg = 'straw2', items = [], id: wanted }) {
  const id = wanted !== undefined && wanted !== null ? wanted : map.nextBucketId--;
  if (id <= map.nextBucketId) map.nextBucketId = id - 1;
  map.buckets[id] = {
    id, name, alg,
    typeName: type,
    typeId: typeId(type),
    items: [...items],
    weights: [],
    weight: 0,
    shadowOf: null,
    shadowClass: null,
  };
  map.byName[name] = id;
  return id;
}

export function addRule(map, rule) {
  const id = rule.id !== undefined ? rule.id : map.rules.length;
  map.rules.push({ ...rule, id });
  return id;
}

/** Weight of any item, device or bucket. Devices carry theirs; buckets sum. */
function weightOf(map, id) {
  return id >= 0 ? (map.devices[id]?.weight ?? 0) : (map.buckets[id]?.weight ?? 0);
}

/** Post-order so a bucket is only summed after all of its children are. */
function recomputeWeights(map) {
  const seen = new Set();
  const visit = (id) => {
    if (id >= 0 || seen.has(id)) return;
    seen.add(id);
    const b = map.buckets[id];
    if (!b) return;
    for (const it of b.items) visit(it);
    b.weights = b.items.map((it) => weightOf(map, it));
    b.weight = b.weights.reduce((a, x) => a + x, 0);
  };
  for (const id of Object.keys(map.buckets)) visit(Number(id));
}

function recomputeParents(map) {
  map.parent = {};
  for (const id of Object.keys(map.buckets)) {
    const b = map.buckets[id];
    if (b.shadowOf !== null) continue;          // shadows are not real parents
    for (const it of b.items) map.parent[it] = Number(id);
  }
}

/** Every device class appearing under `id`. */
function classesUnder(map, id, acc = new Set()) {
  if (id >= 0) { const d = map.devices[id]; if (d) acc.add(d.class); return acc; }
  const b = map.buckets[id];
  if (b) for (const it of b.items) classesUnder(map, it, acc);
  return acc;
}

/**
 * Mirror `id`'s subtree keeping only devices of `cls`. Returns the new shadow
 * bucket id, or undefined when nothing of that class lives down here — an empty
 * rack simply does not appear in the shadow tree, which is what makes
 * "take default class ssd" skip racks that have no SSDs.
 */
function cloneShadow(map, id, cls) {
  if (id >= 0) return map.devices[id]?.class === cls ? id : undefined;
  const b = map.buckets[id];
  if (!b) return undefined;
  const items = [];
  for (const it of b.items) {
    const c = cloneShadow(map, it, cls);
    if (c !== undefined) items.push(c);
  }
  if (items.length === 0) return undefined;
  const sid = addBucket(map, { name: `${b.name}~${cls}`, type: b.typeName, alg: b.alg, items });
  map.buckets[sid].shadowOf = id;
  map.buckets[sid].shadowClass = cls;
  return sid;
}

function buildShadows(map) {
  // Drop any shadow buckets from a previous finalize.
  for (const id of Object.keys(map.buckets)) {
    const b = map.buckets[id];
    if (b.shadowOf !== null) { delete map.byName[b.name]; delete map.buckets[id]; }
  }
  map.shadow = {};
  for (const id of Object.keys(map.buckets).map(Number)) {
    const b = map.buckets[id];
    if (!b || b.typeName !== 'root') continue;
    for (const cls of classesUnder(map, id)) {
      const sid = cloneShadow(map, id, cls);
      if (sid !== undefined) map.shadow[`${b.name}~${cls}`] = sid;
    }
  }
}

/** Call after any structural change. Idempotent. */
export function finalize(map) {
  recomputeParents(map);
  buildShadows(map);
  recomputeWeights(map);
  return map;
}

/** Devices under an item, in tree order. */
export function devicesUnder(map, id, acc = []) {
  if (id >= 0) { acc.push(id); return acc; }
  const b = map.buckets[id];
  if (b) for (const it of b.items) devicesUnder(map, it, acc);
  return acc;
}

/** The chain of bucket names from a device up to its root — for `ceph osd tree`. */
export function ancestry(map, id) {
  const chain = [];
  let cur = map.parent[id];
  while (cur !== undefined) { chain.push(map.buckets[cur]); cur = map.parent[cur]; }
  return chain;
}

/** Reweight vector (all 1.0) sized for the map's devices. */
export function defaultReweights(map) {
  const rw = [];
  for (const id of Object.keys(map.devices)) rw[Number(id)] = 1;
  return rw;
}

export { TYPES };
