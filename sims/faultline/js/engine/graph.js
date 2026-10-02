// The dependency DAG: "this needs that". Overlaid on the fault-domain tree,
// which answers a different question (where a thing sits, not what it needs).
//
// A dependency edge carries the *gate* it participates in. Edges out of one
// node that share a gate form a group; groups are ANDed. That is enough to say
// "the service needs a quorum of these members AND its network AND its identity
// plane" without inventing intermediate gate nodes nobody would want to draw.

export const GATES = {
  all:    { id: 'all',    label: 'all of',        need: (n) => n },
  any:    { id: 'any',    label: 'any one of',    need: (n) => Math.min(1, n) },
  quorum: { id: 'quorum', label: 'a majority of', need: (n) => Math.floor(n / 2) + 1 },
  kofn:   { id: 'kofn',   label: 'k of',          need: (n, k) => Math.min(Math.max(k || 1, 0), n) },
};

export function gateOrDefault(id) {
  return GATES[id] || GATES.all;
}

// doc.deps: [{ id, from, to, gate, n }]  — "from needs to"
export function buildGraph(doc) {
  const nodes = new Map();
  const ensure = (id) => {
    if (!nodes.has(id)) nodes.set(id, { id, groups: new Map(), dependents: new Set() });
    return nodes.get(id);
  };

  for (const c of doc.components || []) ensure(c.id);

  for (const e of doc.deps || []) {
    if (!e || !e.from || !e.to) continue;
    const node = ensure(e.from);
    ensure(e.to).dependents.add(e.from);
    const key = `${e.gate || 'all'}:${e.group || ''}:${e.n ?? ''}`;
    if (!node.groups.has(key)) {
      node.groups.set(key, { gate: e.gate || 'all', n: e.n, deps: [] });
    }
    node.groups.get(key).deps.push(e.to);
  }

  for (const node of nodes.values()) node.groupList = [...node.groups.values()];
  return { nodes };
}

// Availability of every node given a set of failed node ids.
//
// Two deliberate rules, both load-bearing:
//
//   * An id with no node in the graph is treated as UP, not down. An undrawn
//     dependency is "not described", not "broken" — the same call cephsim's
//     net.js makes with its 'unmodelled' sentinel. A half-finished diagram must
//     not report a dead cluster.
//
//   * A dependency cycle resolves to DOWN for every node in it. That is not a
//     guard against bad input, it is the right answer: if A needs B and B needs
//     A, neither can bootstrap from cold. Circular control-plane dependencies
//     are a real outage class and the model should say so.
export function evaluator(graph, failed) {
  const memo = new Map();
  const inFlight = new Set();

  function isUp(id) {
    if (memo.has(id)) return memo.get(id);
    if (inFlight.has(id)) return false;
    if (failed && failed.has(id)) { memo.set(id, false); return false; }

    const node = graph.nodes.get(id);
    if (!node) { memo.set(id, true); return true; }

    inFlight.add(id);
    let ok = true;
    for (const g of node.groupList) {
      let live = 0;
      for (const d of g.deps) if (isUp(d)) live++;
      if (live < gateOrDefault(g.gate).need(g.deps.length, g.n)) { ok = false; break; }
    }
    inFlight.delete(id);
    memo.set(id, ok);
    return ok;
  }

  return { isUp, memo };
}

// Why is it down? The failed things it actually rests on, nearest first.
// Used by the blast-radius view, not by the cut-set search.
export function explain(graph, failed, targetId) {
  const ev = evaluator(graph, failed);
  if (ev.isUp(targetId)) return { up: true, reasons: [] };

  const reasons = [];
  const seen = new Set();
  const walk = (id, depth) => {
    if (seen.has(id) || depth > 12) return;
    seen.add(id);
    if (failed && failed.has(id)) { reasons.push({ id, depth, direct: true }); return; }
    const node = graph.nodes.get(id);
    if (!node) return;
    for (const g of node.groupList) {
      let live = 0;
      for (const d of g.deps) if (ev.isUp(d)) live++;
      const need = gateOrDefault(g.gate).need(g.deps.length, g.n);
      if (live < need) {
        reasons.push({ id, depth, gate: g.gate, need, live, of: g.deps.length });
        for (const d of g.deps) if (!ev.isUp(d)) walk(d, depth + 1);
      }
    }
  };
  walk(targetId, 0);
  return { up: false, reasons };
}
