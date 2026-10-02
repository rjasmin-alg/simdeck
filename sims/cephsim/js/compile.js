// SPDX-License-Identifier: AGPL-3.0-or-later
// The bridge from the editable document to the pure engine.
//
// The document is what the UI edits: hosts at x/y, OSDs with a size in TiB,
// rules described as "root + class + failure domain". The engine wants a CRUSH
// map. This file translates, and — importantly — decides when a retranslation
// is actually needed.
//
// Remapping is the expensive operation (~90 ms at teaching scale). It is keyed
// off a structural signature, so dragging a host around the canvas, renaming
// something for a slide or scrubbing the recovery clock all cost nothing.

import {
  newMap, addDevice, addBucket, addRule, finalize, devicesUnder,
} from './engine/crushmap.js';
import { evaluatePool, mapPool } from './engine/pgmap.js';
import { osdUsage, clusterDf } from './engine/capacity.js';
import { networkState } from './engine/net.js';
import { daemonState } from './engine/daemons.js';
import { clusterHealth } from './engine/health.js';
import { clientState } from './engine/clients.js';

/**
 * Everything that can change placement, and nothing that cannot. Position,
 * colour and free-text labels are deliberately absent — that is the whole point.
 */
export function structuralSignature(doc) {
  const parts = [];
  for (const b of doc.buckets) parts.push(`b:${b.id}:${b.name}:${b.type}:${b.parent}`);
  for (const h of doc.hosts) {
    parts.push(`h:${h.id}:${h.name}:${h.parent}`);
    for (const o of h.osds) parts.push(`o:${o.id}:${o.size}:${o.class}:${o.in}:${o.reweight}`);
  }
  for (const r of doc.rules) {
    parts.push(`r:${r.id}:${r.name}:${r.root}:${r.class}:${r.failureDomain}:${r.mode}:${
      r.steps ? JSON.stringify(r.steps) : ''}`);
  }
  for (const p of doc.pools) {
    parts.push(`p:${p.id}:${p.type}:${p.size}:${p.k}:${p.m}:${p.pg_num}:${p.pgp_num}:${p.crush_rule}`);
  }
  return parts.join('|');
}

/** A rule as the UI describes it becomes the steps CRUSH actually runs. */
export function ruleSteps(rule) {
  if (rule.steps) return rule.steps;
  const mode = rule.mode || (rule.type === 'erasure' ? 'indep' : 'firstn');
  return [
    { op: 'take', item: rule.root || 'default', class: rule.class || null },
    { op: 'chooseleaf', mode, num: 0, type: rule.failureDomain || 'host' },
    { op: 'emit' },
  ];
}

/** Document -> engine CRUSH map. */
export function compileMap(doc) {
  const map = newMap();
  const bucketIds = new Map();          // doc bucket id -> engine bucket id

  // Buckets first, deepest last, so a parent always exists before its children
  // are attached. The doc stores the tree by parent pointer; CRUSH wants item
  // lists, so invert it here.
  const children = new Map();
  for (const b of doc.buckets) {
    if (!children.has(b.parent)) children.set(b.parent, []);
    children.get(b.parent).push(b);
  }
  // Parent before children, so ids come out the way Ceph numbers them: the root
  // is -1 and the tree descends from there. Cosmetic, but `ceph osd tree` output
  // that starts at -13 does not look like a real cluster.
  const makeBucket = (b) => {
    const id = addBucket(map, { name: b.name, type: b.type });
    for (const c of children.get(b.id) || []) map.buckets[id].items.push(makeBucket(c));
    for (const h of doc.hosts.filter((x) => x.parent === b.id)) {
      map.buckets[id].items.push(makeHost(h));
    }
    return id;
  };
  const makeHost = (h) => {
    const id = addBucket(map, { name: h.name, type: 'host' });
    for (const o of h.osds) {
      // An OSD marked `out` keeps its CRUSH weight; being out is a reweight of
      // zero, not a weight of zero. Conflating them is the classic mistake and
      // it moves far more data than intended.
      addDevice(map, o.id, `osd.${o.id}`, o.class, o.size);
      map.buckets[id].items.push(o.id);
    }
    return id;
  };

  for (const b of doc.buckets) {
    if (b.parent === null) bucketIds.set(b.id, makeBucket(b));
  }
  // Hosts parented straight to nothing would vanish; park them under the first
  // root so a half-drawn cluster still renders.
  const rootDoc = doc.buckets.find((b) => b.type === 'root');
  const rootEngine = rootDoc ? map.byName[rootDoc.name] : undefined;
  if (rootEngine !== undefined) {
    for (const h of doc.hosts) {
      if (!doc.buckets.some((b) => b.id === h.parent)) {
        map.buckets[rootEngine].items.push(makeHost(h));
      }
    }
  }

  for (const r of doc.rules) {
    addRule(map, { id: r.id, name: r.name, type: r.type, steps: ruleSteps(r) });
  }
  return finalize(map);
}

/**
 * The reweight vector CRUSH consults. `out` is reweight 0 — that is literally
 * how Ceph expresses it, and why an out OSD disappears from acting sets while a
 * down one does not.
 */
export function reweightsFor(doc) {
  const rw = [];
  for (const h of doc.hosts) {
    for (const o of h.osds) rw[o.id] = o.in === false ? 0 : (o.reweight ?? 1);
  }
  return rw;
}

/**
 * OSDs that cannot serve. A down host takes its OSDs with it; an explicitly
 * downed OSD counts on its own. Reachability (Phase 4) folds in here too.
 */
export function downSet(doc, extra = new Set(), unreachableHosts = new Set()) {
  const down = new Set(extra);
  for (const h of doc.hosts) {
    const hostDown = h.up === false || unreachableHosts.has(h.id);
    for (const o of h.osds) if (hostDown || o.up === false) down.add(o.id);
  }
  return down;
}

// ------------------------------------------------------------------ cache ---
// One remap per structural change, reused until the shape actually moves.
let cache = { sig: null, map: null, raw: new Map(), epoch: 0 };

export function currentEpoch() { return cache.epoch; }

export function getMap(doc) {
  const sig = structuralSignature(doc);
  if (sig !== cache.sig) {
    cache = { sig, map: compileMap(doc), raw: new Map(), epoch: cache.epoch + 1 };
  }
  return cache.map;
}

/** Raw CRUSH output for a pool, cached against the current map epoch. */
export function getRaw(doc, pool, reweights) {
  const map = getMap(doc);
  const key = `${pool.id}:${pool.pg_num}:${pool.pgp_num}:${pool.crush_rule}`;
  if (!cache.raw.has(key)) cache.raw.set(key, mapPool(map, pool, reweights));
  return cache.raw.get(key);
}

/** Drop the memo — for tests, and after a reweight, which CRUSH does consult. */
export function invalidate() { cache = { sig: null, map: null, raw: new Map(), epoch: cache.epoch + 1 }; }

/**
 * The whole derived picture for a document, in the order the pieces depend on
 * each other: network first (it decides who is reachable), then placement, then
 * capacity, then health on top of all of it.
 *
 * @param {Set<number>} opts.downOsds  OSDs the user has explicitly marked down,
 *   over and above whatever the topology and the network imply.
 */
export function evaluate(doc, { downOsds = new Set(), prev = null } = {}) {
  const map = getMap(doc);
  const reweights = reweightsFor(doc);
  const net = networkState(doc);
  const down = downSet(doc, downOsds, net.unreachableHosts);
  const evals = doc.pools.map((pool) => evaluatePool(map, pool, reweights, {
    down,
    skew: doc.settings?.skew ?? 0.25,
    raw: getRaw(doc, pool, reweights),
    prev: prev?.find((e) => e.pool.id === pool.id)?.pgs.map((p) => p.up) ?? null,
  }));
  const usage = osdUsage(map, evals);
  const df = clusterDf(map, usage);
  const daemons = daemonState(doc, net);
  const health = clusterHealth(doc, { net, daemons, evals, usage, df });
  const clients = clientState(doc, { map, evals, usage, daemons });
  return { map, reweights, net, daemons, evals, usage, df, health, clients, down,
           epoch: cache.epoch };
}

export { devicesUnder };
