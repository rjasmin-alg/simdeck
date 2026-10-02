// The network, and what losing part of it does to the cluster.
//
// Ceph runs on two networks and people forget it: the **public** network carries
// clients, monitors and heartbeats to the mons, while the **cluster** network
// carries replication and recovery between OSDs. Cutting one is not like cutting
// the other, and that asymmetry is what this file exists to show.
//
// The model, stated plainly so it can be argued with:
//
//   * MONs form quorum over the public network. A majority of *configured* mons
//     must be mutually reachable, or the cluster stops serving entirely — this
//     is the one failure that takes a healthy set of disks completely offline.
//   * An OSD that cannot reach the quorum over the public network is marked
//     down, because that is exactly what the mons do to it.
//   * An OSD that can reach the mons but is cut off from its peers on the
//     cluster network is also marked down: its peers stop seeing heartbeats and
//     report it. On a real cluster this is the flapping scenario; here it
//     settles straight to down, which is the end state rather than the drama.
//
// Simplification worth knowing about: real Ceph needs `mon_osd_min_down_reporters`
// peers to agree before marking an OSD down, and a split cluster network causes
// minutes of flapping first. None of that timing is modelled.

/**
 * Network modelling is only meaningful once cables exist. A document with no
 * links at all has simply not described its network, so everything is treated as
 * connected; a *cabled* cluster is modelled properly.
 *
 * A host with no cables in an otherwise cabled document is likewise treated as
 * "network not drawn" rather than isolated — otherwise a half-finished diagram
 * reports a dead cluster, which is alarming and wrong.
 */
export function networkState(doc) {
  const enabled = doc.links.length > 0;
  const hosts = doc.hosts;
  const nodeUp = new Map();
  for (const h of hosts) nodeUp.set(h.id, h.up !== false);
  for (const s of doc.switches) nodeUp.set(s.id, s.up !== false);

  const liveLinks = doc.links.filter((l) =>
    l.up !== false && nodeUp.get(l.a) && nodeUp.get(l.b));

  const cabled = new Set();
  for (const l of doc.links) { cabled.add(l.a); cabled.add(l.b); }

  const pub = components(liveLinks.filter((l) => l.net !== 'cluster'), nodeUp);
  const clu = components(liveLinks.filter((l) => l.net === 'cluster'), nodeUp);
  const hasClusterNet = doc.links.some((l) => l.net === 'cluster');

  // ------------------------------------------------------------ quorum ------
  const monHosts = hosts.filter((h) => h.daemons.includes('mon'));
  const needed = Math.floor(monHosts.length / 2) + 1;
  const upMons = monHosts.filter((h) => h.up !== false);

  let quorumComponent = null;
  let inQuorum = [];
  let largestGroup = 0;
  if (monHosts.length === 0) {
    // No mons at all: nothing to lose, so do not pretend the cluster is down.
    quorumComponent = null;
    inQuorum = [];
  } else if (!enabled) {
    inQuorum = upMons.length >= needed ? upMons : [];
    largestGroup = upMons.length;
    if (upMons.length < needed) quorumComponent = undefined;
  } else {
    const groups = new Map();
    for (const h of upMons) {
      const c = comp(pub, h.id, cabled);
      if (!groups.has(c)) groups.set(c, []);
      groups.get(c).push(h);
    }
    let best = null;
    for (const [c, list] of groups) {
      largestGroup = Math.max(largestGroup, list.length);
      if (list.length >= needed && (!best || list.length > best[1].length)) best = [c, list];
    }
    if (best) { [quorumComponent, inQuorum] = best; }
    else { quorumComponent = undefined; inQuorum = []; }
  }
  const hasQuorum = monHosts.length === 0 || inQuorum.length >= needed;

  // ------------------------------------------- which hosts can serve --------
  const unreachable = new Set();
  const reasons = new Map();
  if (!hasQuorum && monHosts.length > 0) {
    for (const h of hosts) {
      unreachable.add(h.id);
      reasons.set(h.id, 'no monitor quorum');
    }
  } else if (enabled && quorumComponent !== null && quorumComponent !== undefined) {
    for (const h of hosts) {
      if (h.up === false || !cabled.has(h.id)) continue;
      if (comp(pub, h.id, cabled) !== quorumComponent) {
        unreachable.add(h.id);
        reasons.set(h.id, 'cut off from the monitors on the public network');
        continue;
      }
      if (hasClusterNet && cabledOn(doc, h.id, 'cluster')) {
        // Cut off from its peers: the peers stop hearing it and report it down.
        const peers = hosts.filter((o) => o.id !== h.id && o.up !== false
          && o.osds.length && cabledOn(doc, o.id, 'cluster'));
        const mine = comp(clu, h.id, cabled);
        if (peers.length && !peers.some((o) => comp(clu, o.id, cabled) === mine)) {
          unreachable.add(h.id);
          reasons.set(h.id, 'isolated from its peers on the cluster network');
        }
      }
    }
  }

  return {
    enabled,
    hasClusterNet,
    cabled,
    uncabled: new Set(hosts.filter((h) => !cabled.has(h.id)).map((h) => h.id)),
    publicComponents: pub,
    clusterComponents: clu,
    quorum: {
      configured: monHosts.length,
      up: upMons.length,
      needed,
      inQuorum: inQuorum.map((h) => h.id),
      hasQuorum,
      /** The biggest set of mons that can actually see each other. */
      largestGroup,
      /**
       * Enough monitors are alive to form a quorum, but they cannot reach each
       * other. That is a genuinely different failure from "too many mons are
       * down", and the fix is different too — repair the network, not the mons.
       */
      partitioned: !hasQuorum && monHosts.length > 0 && upMons.length >= needed,
    },
    unreachableHosts: unreachable,
    reasons,
  };
}

/** Union-find over one network's live links. Returns node id -> component id. */
function components(links, nodeUp) {
  const parent = new Map();
  const find = (x) => {
    if (!parent.has(x)) parent.set(x, x);
    while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); }
    return x;
  };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
  for (const l of links) { if (nodeUp.get(l.a) && nodeUp.get(l.b)) union(l.a, l.b); }
  const out = new Map();
  for (const k of parent.keys()) out.set(k, find(k));
  return out;
}

/** A node with no live link of this kind is its own island, keyed by its id. */
function comp(map, id, cabled) {
  return map.has(id) ? map.get(id) : (cabled.has(id) ? `solo:${id}` : 'unmodelled');
}
function cabledOn(doc, nodeId, net) {
  return doc.links.some((l) => l.net === net && (l.a === nodeId || l.b === nodeId));
}

/**
 * Recovery bandwidth available to a host, in bytes per second.
 *
 * Replication and backfill ride the cluster network when there is one and the
 * public network otherwise — which is itself a lesson: without a cluster
 * network, recovery competes with your clients.
 */
export function hostBandwidth(doc, hostId) {
  const net = doc.links.some((l) => l.net === 'cluster') ? 'cluster' : 'public';
  const gbps = doc.links
    .filter((l) => l.up !== false && l.net === net && (l.a === hostId || l.b === hostId))
    .reduce((a, l) => a + (l.speed || 0), 0);
  return (gbps * 1e9) / 8;                    // Gb/s -> bytes/s
}
