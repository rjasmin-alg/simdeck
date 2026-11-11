// SPDX-License-Identifier: AGPL-3.0-or-later
// simdeck: guided walks over a sample (preset task correlated-failure, docs/tasks/w3/correlated-failure.md; rules in
// SPEC.md). A walk is a short list of states over one sample, nothing the engine does not already do: each step says
// whether the walk's hidden dependency (one correlated event of the sample) is drawn, and whether it has tripped.
// Pure: plain data in, plain data out, no DOM and no strings (the page looks up `${strings}.cap<i>` and friends).

import { evaluator, gateOrDefault } from './engine/graph.js';

// Keyed by the sample's ?sample= key, like SAMPLES.
export const WALKS = {
  'onePdu': {
    feed: 'pdu-a',          // the sample's correlated event: "PDU A trips", hits Rack 1 and Rack 2
    service: 'svc',
    strings: 'walk.onePdu', // cap1..cap3, feed (canvas label), toggle
    steps: [
      { feed: false, trip: false }, // 1. the drawing: three racks, three replicas, "3x redundant"
      { feed: true, trip: false },  // 2. the feed is drawn: {PDU A} joins the cut list at size 1
      { feed: true, trip: true },   // 3. PDU A trips: two racks down, 1 of 3 replicas, service down
    ],
  },
};

export const walkFor = (key) => WALKS[key] || null;

/** The engine's id for the walk's event once it is in the universe (events.js: `ev:evt:<id>`). */
export const tripId = (walk) => `ev:evt:${walk.feed}`;

/** The canonical state of step i (clamped): is the feed drawn, and which events are broken. */
export function stepState(walk, i) {
  const s = walk.steps[clampStep(walk, i)];
  return { feed: s.feed, failed: new Set(s.trip ? [tripId(walk)] : []) };
}

export function clampStep(walk, i) {
  const n = walk.steps.length;
  return Math.min(n - 1, Math.max(0, Number.isFinite(i) ? Math.trunc(i) : 0));
}

/** Which step a state shows. Only the feed and its trip count; anything else the user broke is their own. The trip
 * cannot count while the feed is not drawn: the event is not in the model then. */
export function stepOf(walk, { feed, failed }) {
  const tripped = !!feed && failed.has(tripId(walk));
  const i = walk.steps.findIndex((s) => s.feed === !!feed && s.trip === tripped);
  return i < 0 ? 0 : i;
}

/** The sample as drawn at this state: without the feed event, the drawing nobody corrected; with it, the sample. */
export function withFeed(doc, walk, feed) {
  if (feed) return doc;
  return { ...doc, events: (doc.events || []).filter((e) => e.id !== walk.feed) };
}

/** What the feed reaches on the canvas (the event's `hits`, domain or component ids), or null when it is not drawn. */
export function feedHits(doc, walk, feed) {
  if (!feed) return null;
  const e = (doc.events || []).find((x) => x.id === walk.feed);
  return e ? [...e.hits] : null;
}

/** The service's voting group (the first group whose gate is not `all`), counted under `down`: how many of its
 * dependencies are up, of how many, and how many the gate needs (graph.js GATES). Null when it has none. */
export function voteCount(graph, down, serviceId) {
  const node = graph.nodes.get(serviceId);
  const g = node && node.groupList.find((x) => x.gate !== 'all');
  if (!g) return null;
  const ev = evaluator(graph, down);
  return {
    live: g.deps.filter((d) => ev.isUp(d)).length,
    of: g.deps.length,
    need: gateOrDefault(g.gate).need(g.deps.length, g.n),
  };
}
