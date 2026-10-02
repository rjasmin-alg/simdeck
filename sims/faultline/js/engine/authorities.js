// The six things every distributed system rests on whether or not anybody drew
// them. This file is the thesis:
//
//   No system, however elaborate, has zero points of failure, because something
//   has to be authoritative about what the cluster looks like.
//
// Multi-master does not escape this. Leaderless does not escape this. A CRDT
// that converges without coordination still has to know who to gossip with, and
// that peer list came from somewhere. The regress terminates in a human and a
// piece of configuration, and the honest thing a design tool can do is say so.
//
// Mechanically: these attach as real components with real dependency edges, so
// each is a size-1 cut by construction and falls out of the ordinary cut-set
// search. There is no special case in cutset.js and no "and also remember to
// mention" in the UI. A check enforces that a fully redundant drawn model still
// reports at least one cut.

export const AUTHORITY_DOMAIN = 'dom:implicit';

export const IMPLICIT_AUTHORITIES = [
  {
    id: 'auth:membership',
    kind: 'membership',
    name: 'Membership',
    question: 'What tells these nodes how many of them there are?',
    detail:
      'A majority is a majority of a defined set. Defining the set is a decision ' +
      'taken outside the cluster, and every node has to have been told the same answer.',
  },
  {
    id: 'auth:identity',
    kind: 'identity',
    name: 'Identity',
    question: 'What issues the credentials they authenticate with?',
    detail:
      'Peers that cannot prove who they are cannot form a cluster. The identity ' +
      'plane is almost never replicated to the same standard as the data it guards.',
  },
  {
    id: 'auth:naming',
    kind: 'naming',
    name: 'Naming',
    question: 'What resolves the peer addresses?',
    detail:
      'Nodes find each other by name. Name resolution is a dependency of ' +
      'membership itself, which is why DNS failures present as cluster failures.',
  },
  {
    id: 'auth:change',
    kind: 'change',
    name: 'Change',
    question: 'What pushed this configuration, and to how many at once?',
    detail:
      'A deployment pipeline is a single event that reaches every replica by ' +
      'design. It is the one component whose whole purpose is correlated action, ' +
      'and it defeats geographic redundancy completely.',
  },
  {
    id: 'auth:time',
    kind: 'time',
    name: 'Time',
    question: 'Whose clock decides which write was last?',
    detail:
      'Last-write-wins is only meaningful if the clocks agree. Where they do not, ' +
      'the loser is chosen by skew rather than by order, and nothing reports it.',
  },
  {
    id: 'auth:operator',
    kind: 'operator',
    name: 'The operator',
    question: 'Who declares the failover, and from which runbook?',
    detail:
      'Automatic failover moves the decision, it does not remove it. Somebody ' +
      'chose the threshold, and somebody is awake at 03:00 to override it.',
  },
];

// Attach the authorities a document has not modelled for itself.
//
// If the document draws its own `identity` authority — an actual IdP with real
// redundancy behind it — that one is not added, because the point is not to
// nag. The unmodelled ones are added and depended on by every service, which is
// what makes them cuts. They cannot be deleted from the UI: modelling one means
// drawing something better, not ticking a box.
export function attachAuthorities(doc, { kinds = null } = {}) {
  const modelled = new Set(
    (doc.components || [])
      .filter((c) => c.role === 'authority' && c.authorityKind)
      .map((c) => c.authorityKind),
  );

  const wanted = IMPLICIT_AUTHORITIES.filter(
    (a) => !modelled.has(a.kind) && (!kinds || kinds.includes(a.kind)),
  );
  if (!wanted.length) return { doc, added: [] };

  const services = (doc.components || []).filter((c) => c.role === 'service');
  const out = {
    ...doc,
    domains: [...(doc.domains || [])],
    components: [...(doc.components || [])],
    deps: [...(doc.deps || [])],
  };

  if (!out.domains.some((d) => d.id === AUTHORITY_DOMAIN)) {
    out.domains.push({
      id: AUTHORITY_DOMAIN,
      name: 'Not drawn',
      kind: 'implicit',
      parent: null,
      implicit: true,
    });
  }

  for (const a of wanted) {
    out.components.push({
      id: a.id,
      name: a.name,
      role: 'authority',
      authorityKind: a.kind,
      domain: AUTHORITY_DOMAIN,
      implicit: true,
      question: a.question,
      detail: a.detail,
      up: true,
    });
    for (const s of services) {
      out.deps.push({ id: `dep:${s.id}:${a.id}`, from: s.id, to: a.id, gate: 'all', implicit: true });
    }
  }

  return { doc: out, added: wanted.map((a) => a.id) };
}

export function authorityById(id) {
  return IMPLICIT_AUTHORITIES.find((a) => a.id === id) || null;
}
