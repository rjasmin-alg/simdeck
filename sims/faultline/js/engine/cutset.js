// Minimal cut sets: the smallest combinations of failure events that take a
// service down. This is the core of the tool and the mechanism behind its one
// claim.
//
// Honesty, stated plainly, because there is no upstream oracle here the way
// cephsim has `crushtool --test` to check its CRUSH port against:
//
//   The graph is a modelling choice. The analysis over it is exact.
//
// Minimality is a definition, not an approximation — a cut is minimal iff
// removing any one element lets the service survive — and that is directly
// testable, which is what keeps this from being the "close enough" tool the
// house rules forbid. What is bounded is the *search*, not the maths: we look
// for cuts up to `maxSize` and say so rather than implying completeness.

import { evaluator } from './graph.js';

export function cutSets(graph, targetId, universe, opts = {}) {
  const maxSize = opts.maxSize ?? 3;
  const budget = opts.budget ?? 2_000_000;

  // The top event is not a basic event. "The service is down if the service is
  // down" is true, useless, and — because it is a size-1 cut — it would prune
  // away every larger cut that is actually worth reading. Anything whose whole
  // blast radius is the target itself goes the same way: a service alone in a
  // rack makes "rack lost" the same sentence twice.
  const pool = universe.filter(
    (e) => !(e.hits.size === 1 && e.hits.has(targetId)),
  );

  const found = [];
  let searched = 0;
  let truncated = false;

  // Any set containing a known smaller cut is non-minimal. Because sizes are
  // searched in increasing order, that check is the whole minimality test.
  const singles = new Set();

  const kills = (idxs) => {
    if (++searched > budget) { truncated = true; return false; }
    const failed = new Set();
    for (const i of idxs) for (const h of pool[i].hits) failed.add(h);
    return !evaluator(graph, failed).isUp(targetId);
  };

  const containsKnownCut = (idxs) => {
    for (const c of found) {
      let all = true;
      for (const i of c.idx) if (!idxs.includes(i)) { all = false; break; }
      if (all) return true;
    }
    return false;
  };

  const pick = [];
  for (let size = 1; size <= maxSize && !truncated; size++) {
    const walk = (start) => {
      if (truncated) return;
      if (pick.length === size) {
        if (!containsKnownCut(pick) && kills(pick)) found.push({ idx: pick.slice() });
        return;
      }
      for (let i = start; i < pool.length; i++) {
        if (singles.has(i)) continue;
        pick.push(i);
        walk(i + 1);
        pick.pop();
        if (truncated) return;
      }
    };
    walk(0);
    if (size === 1) for (const c of found) singles.add(c.idx[0]);
  }

  // The unit a failure is honestly measured in. A count alone cannot tell
  // "redundant right up to the region boundary" from "one server kills it" —
  // both are size 1 — so every cut carries the kind of thing you would have to
  // lose. A domain event knows its own kind from the profile's ladder; anything
  // else is named by what it is.
  const scopeOf = (e) => (e.kind === 'domain' ? e.domainKind || 'domain' : e.kind);

  const cuts = found.map((c) => {
    const events = c.idx.map((i) => pool[i]);
    const radius = new Set();
    for (const e of events) for (const h of e.hits) radius.add(h);
    // Among several events the widest is the one that characterises the cut:
    // "a rack and a disk" is a rack-scale answer.
    const widest = events.reduce((a, b) => (b.hits.size > a.hits.size ? b : a));
    return {
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        kind: e.kind,
        scope: scopeOf(e),
        implicit: !!e.implicit,
      })),
      size: events.length,
      blastRadius: radius.size,
      scope: scopeOf(widest),
      implicit: events.every((e) => e.implicit),
      drawn: events.every((e) => !e.implicit),
    };
  });

  // Smallest first. Then *drawn before not-drawn*, and only then the tightest
  // blast radius.
  //
  // The middle clause is load-bearing and was originally last, which inverted
  // the product's own punchline. An authority hits exactly one component, so
  // its radius is 1; a real correlated event hits several, so "PDU A trips" has
  // radius 2. Radius therefore decided first and all six authorities sorted
  // ahead of every drawn cut of the same size — the reveal arriving before the
  // setup. The authorities land hardest as what is left after you have fixed
  // everything you drew, so they sort last among equals and the tightest radius
  // still wins *inside* each group, where "this one power strip" is a more
  // useful sentence than "this whole region".
  cuts.sort(
    (a, b) =>
      a.size - b.size ||
      Number(a.implicit) - Number(b.implicit) ||
      a.blastRadius - b.blastRadius ||
      a.events[0].name.localeCompare(b.events[0].name),
  );

  return { cuts, searched, truncated, maxSize, universeSize: pool.length };
}

// Does this exact set of events take the target down? The single-shot question
// behind clicking things on the canvas.
export function killsTarget(graph, targetId, events) {
  const failed = new Set();
  for (const e of events) for (const h of e.hits) failed.add(h);
  return !evaluator(graph, failed).isUp(targetId);
}

// Property helper, exported because the checks lean on it and so should anyone
// who doubts a reported cut: a cut is minimal iff dropping any one member lets
// the target survive.
export function isMinimal(graph, targetId, events) {
  if (!killsTarget(graph, targetId, events)) return false;
  for (let i = 0; i < events.length; i++) {
    if (killsTarget(graph, targetId, events.filter((_, j) => j !== i))) return false;
  }
  return true;
}
