// Daemon availability. OSDs hold the data; these decide whether you can get at it.

/**
 * @param {object} doc
 * @param {object} net  result of networkState()
 */
export function daemonState(doc, net) {
  const reachable = (h) => h.up !== false && !net.unreachableHosts.has(h.id);
  const on = (id) => doc.hosts.filter((h) => h.daemons.includes(id));
  const upOn = (id) => on(id).filter(reachable);

  const mons = on('mon');
  const mgrs = upOn('mgr');
  const mdss = upOn('mds');
  const rgws = upOn('rgw');

  // CephFS needs at least one MDS rank served. Standbys are the rest.
  const filesystems = (doc.fs || []).map((fs) => {
    const ranks = Math.max(1, fs.maxMds || 1);
    const active = Math.min(mdss.length, ranks);
    return {
      ...fs,
      ranksWanted: ranks,
      ranksActive: active,
      standbys: Math.max(0, mdss.length - active),
      up: active >= 1,
      degraded: active < ranks,
    };
  });

  return {
    mon: {
      configured: mons.length,
      up: mons.filter(reachable).length,
      quorum: net.quorum,
    },
    // MGR is active/standby: one runs, the rest wait. Losing all of them costs
    // you stats, the dashboard and the balancer, but not your data.
    mgr: { configured: on('mgr').length, up: mgrs.length, active: mgrs.length ? 1 : 0,
           standbys: Math.max(0, mgrs.length - 1) },
    mds: { configured: on('mds').length, up: mdss.length },
    rgw: { configured: on('rgw').length, up: rgws.length },
    filesystems,
    /** RGW is stateless, so the endpoint is up if any gateway is. */
    objectGatewayUp: rgws.length > 0,
  };
}
