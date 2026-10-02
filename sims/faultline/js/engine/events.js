// A failure *event* is the honest unit, not a component.
//
// Nobody loses "server 12". They lose a power strip, a top-of-rack switch, an
// availability zone, a certificate, or a config push — and each of those takes
// out a *set* of components that the diagram drew as independent. This is the
// entire reason redundancy lies: N copies are only N-fold safety if the
// failures are independent, and the interesting ones never are.
//
// So the cut-set search enumerates over events, uniformly. Components and
// domains contribute their own automatic events; authored correlated events sit
// alongside them with no special casing.

import { componentsIn, domainIndex } from './domain.js';

export const EVENT_KINDS = {
  component:  { id: 'component',  label: 'Component fails' },
  domain:     { id: 'domain',     label: 'Domain lost' },
  correlated: { id: 'correlated', label: 'Correlated event' },
};

export function eventUniverse(doc, { domainEvents = true, componentEvents = true } = {}) {
  const idx = domainIndex(doc);
  const out = [];

  if (componentEvents) {
    for (const c of doc.components || []) {
      out.push({
        id: `ev:comp:${c.id}`,
        name: c.name || c.id,
        kind: 'component',
        target: c.id,
        implicit: !!c.implicit,
        hits: new Set([c.id]),
      });
    }
  }

  if (domainEvents) {
    for (const d of doc.domains || []) {
      if (d.implicit) continue; // "Not drawn" is a holder, not a place that can fail
      const hits = componentsIn(doc, d.id, idx);
      if (!hits.length) continue;
      out.push({
        id: `ev:dom:${d.id}`,
        name: `${d.name || d.id} lost`,
        kind: 'domain',
        target: d.id,
        domainKind: d.kind,
        hits: new Set(hits),
      });
    }
  }

  for (const e of doc.events || []) {
    const hits = new Set();
    for (const h of e.hits || []) {
      if (idx.byId.has(h)) for (const c of componentsIn(doc, h, idx)) hits.add(c);
      else hits.add(h);
    }
    if (!hits.size) continue;
    out.push({
      id: `ev:evt:${e.id}`,
      name: e.name || e.id,
      kind: 'correlated',
      target: e.id,
      note: e.note,
      hits,
    });
  }

  return out;
}

// Two events are redundant for search purposes when they hit exactly the same
// set. A rack containing one host and that host are the same failure told twice;
// keeping both only pads the cut list. The survivor is the one with the more
// specific story — a component before a correlated event before a whole domain.
export function dedupeUniverse(universe) {
  const bySignature = new Map();
  const rank = { component: 0, correlated: 1, domain: 2 };
  for (const e of universe) {
    const sig = [...e.hits].sort().join(' ');
    const prev = bySignature.get(sig);
    if (!prev || (rank[e.kind] ?? 9) < (rank[prev.kind] ?? 9)) bySignature.set(sig, e);
  }
  return [...bySignature.values()];
}
