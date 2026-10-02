// Document -> analysis. The one seam between what the user drew and what the
// engine reasons about.
//
// The implicit authorities are attached *here*, not in the document. That is
// deliberate: they are a property of the analysis, not of the drawing, so they
// cannot be deleted, saved away, or exported out of existence. Modelling one
// means drawing something better, not removing a row.

import { attachAuthorities } from './engine/authorities.js';
import { buildGraph } from './engine/graph.js';
import { cutSets } from './engine/cutset.js';
import { dedupeUniverse, eventUniverse } from './engine/events.js';

// Only what can change an answer. Positions, labels and colours are absent, so
// dragging a box costs zero recomputation — the same trick as
// cephsim/js/compile.js:26.
export function structuralSignature(doc) {
  const parts = [];
  for (const d of doc.domains || []) parts.push(`d:${d.id}:${d.kind}:${d.parent || ''}`);
  for (const c of doc.components || []) parts.push(`c:${c.id}:${c.role}:${c.domain}:${c.authorityKind || ''}`);
  for (const e of doc.deps || []) parts.push(`e:${e.from}>${e.to}:${e.gate || 'all'}:${e.n ?? ''}:${e.group || ''}`);
  for (const e of doc.events || []) parts.push(`v:${e.id}:${[...(e.hits || [])].sort().join(',')}`);
  parts.push(`s:${doc.settings?.maxCutSize ?? 3}:${doc.settings?.authorities !== false}`);
  return parts.join('|');
}

let cache = { sig: null, value: null, epoch: 0 };

export function currentEpoch() {
  return cache.epoch;
}

export function invalidate() {
  cache = { sig: null, value: null, epoch: cache.epoch + 1 };
}

export function compile(doc) {
  const sig = structuralSignature(doc);
  if (sig === cache.sig && cache.value) return cache.value;

  const withAuth =
    doc.settings?.authorities === false ? { doc, added: [] } : attachAuthorities(doc);
  const expanded = withAuth.doc;
  const graph = buildGraph(expanded);
  const universe = dedupeUniverse(eventUniverse(expanded));

  const value = { doc: expanded, graph, universe, added: withAuth.added, epoch: cache.epoch + 1 };
  cache = { sig, value, epoch: cache.epoch + 1 };
  return value;
}

// The headline, and it is deliberately not a number.
//
// `smallest` and `smallestDrawn` used to be counts, and a count cannot tell the
// two answers a student most needs distinguished apart: `threeZone` is redundant
// right up to the region boundary and reports 1, while a design where one server
// kills the service also reports 1. The size is the least informative part. What
// carries the meaning is how wide the failure is and what *kind* of thing it is —
// a region, a rack, a host, a config push — because that is the unit an operator
// already reasons in.
export function describeCut(cut) {
  if (!cut) return null;
  return {
    size: cut.size,
    blastRadius: cut.blastRadius,
    scope: cut.scope,
    drawn: cut.drawn,
    names: cut.events.map((e) => e.name),
  };
}

// Cut sets for every service in the document, plus the headline the UI leans on.
export function analyse(doc) {
  const c = compile(doc);
  const maxSize = doc.settings?.maxCutSize ?? 3;
  const services = c.doc.components.filter((x) => x.role === 'service');

  const results = services.map((s) => {
    const r = cutSets(c.graph, s.id, c.universe, { maxSize });
    return {
      service: s,
      ...r,
      drawnCuts: r.cuts.filter((x) => x.drawn),
      implicitCuts: r.cuts.filter((x) => !x.drawn),
      smallest: describeCut(r.cuts[0]),
      smallestDrawn: describeCut(r.cuts.find((x) => x.drawn)),
    };
  });

  return { ...c, services: results };
}
