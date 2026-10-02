// The fault-domain tree: pure containment. geo > region > zone > dc > rack > host > psu.
//
// The tree is the "where" axis and it is the only thing that makes redundancy
// checkable: three replicas are only three replicas if they sit in three
// different domains of the kind you care about. Nothing here knows what a
// region *is* — the kind ladder comes from a profile.

// Membership is a stored field (`component.domain`), never inferred from
// geometry. See CLAUDE.md: a relationship you cannot record is one you cannot
// validate.

export function domainIndex(doc) {
  const byId = new Map();
  const children = new Map();
  const roots = [];
  for (const d of doc.domains || []) {
    byId.set(d.id, d);
    if (!children.has(d.id)) children.set(d.id, []);
  }
  for (const d of doc.domains || []) {
    if (d.parent && byId.has(d.parent)) {
      if (!children.has(d.parent)) children.set(d.parent, []);
      children.get(d.parent).push(d.id);
    } else {
      roots.push(d.id);
    }
  }
  return { byId, children, roots };
}

// Root-ward chain, self first. Stops on a cycle rather than hanging: a
// malformed document should give a wrong answer, not a locked tab.
export function ancestry(doc, domainId, idx = domainIndex(doc)) {
  const out = [];
  const seen = new Set();
  let cur = domainId;
  while (cur && idx.byId.has(cur) && !seen.has(cur)) {
    seen.add(cur);
    out.push(cur);
    cur = idx.byId.get(cur).parent;
  }
  return out;
}

// Every domain in the subtree, self included.
export function descendants(doc, domainId, idx = domainIndex(doc)) {
  const out = [];
  const stack = [domainId];
  const seen = new Set();
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id) || !idx.byId.has(id)) continue;
    seen.add(id);
    out.push(id);
    for (const c of idx.children.get(id) || []) stack.push(c);
  }
  return out;
}

// Component ids anywhere under a domain.
export function componentsIn(doc, domainId, idx = domainIndex(doc)) {
  const under = new Set(descendants(doc, domainId, idx));
  return (doc.components || []).filter((c) => under.has(c.domain)).map((c) => c.id);
}

// The ancestor of `kind` that a component sits under, or null.
export function domainOfKind(doc, compId, kind, idx = domainIndex(doc)) {
  const comp = (doc.components || []).find((c) => c.id === compId);
  if (!comp) return null;
  for (const id of ancestry(doc, comp.domain, idx)) {
    if (idx.byId.get(id).kind === kind) return id;
  }
  return null;
}

// How many distinct domains of `kind` these components occupy. This is the
// number that tells you whether "three replicas" means anything: three copies
// with a spread of 1 at rack level is one power strip away from zero copies.
export function spread(doc, compIds, kind, idx = domainIndex(doc)) {
  const seen = new Set();
  let unplaced = 0;
  for (const id of compIds) {
    const d = domainOfKind(doc, id, kind, idx);
    if (d) seen.add(d); else unplaced++;
  }
  return { count: seen.size, domains: [...seen], unplaced };
}

// Lowest domain containing all of them — the blast radius of their nearest
// shared ancestor. Returns null when they share nothing (separate roots).
export function commonAncestor(doc, compIds, idx = domainIndex(doc)) {
  const chains = [];
  for (const id of compIds) {
    const comp = (doc.components || []).find((c) => c.id === id);
    if (!comp) continue;
    chains.push(ancestry(doc, comp.domain, idx));
  }
  if (!chains.length) return null;
  let candidates = chains[0];
  for (const chain of chains.slice(1)) {
    const set = new Set(chain);
    candidates = candidates.filter((d) => set.has(d));
  }
  return candidates[0] || null;
}

export function depth(doc, domainId, idx = domainIndex(doc)) {
  return ancestry(doc, domainId, idx).length;
}
