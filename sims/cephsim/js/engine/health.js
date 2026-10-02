// `ceph health detail`, assembled.
//
// Check names are Ceph's real ones, so that what you learn here is what you will
// grep for at three in the morning. Where something is not modelled it simply
// does not appear — there are no invented check names in this list.
//
// Not modelled, and therefore never reported: scrub errors, slow ops, clock
// skew, OSDMAP flags, BlueStore warnings, cephx, device health.

import { RATIOS } from './capacity.js';
import { poolWidth, poolMinSize } from './pgmap.js';

const OK = 'HEALTH_OK';
const WARN = 'HEALTH_WARN';
const ERR = 'HEALTH_ERR';

// Ceph's own defaults for the PG-per-OSD warnings.
const MIN_PG_PER_OSD = 30;
const MAX_PG_PER_OSD = 250;

export function clusterHealth(doc, { net, daemons, evals, usage, df }) {
  const checks = [];
  const add = (name, severity, summary, detail = []) =>
    checks.push({ name, severity, summary, detail });

  // ------------------------------------------------------------- monitors --
  const q = net.quorum;
  if (q.configured === 0) {
    if (doc.hosts.length) {
      add('MON_DOWN', WARN, 'no monitors configured',
        ['A cluster with no monitors has no map and no quorum. Add MON to a host.']);
    }
  } else if (!q.hasQuorum) {
    add('MON_DOWN', ERR,
      q.partitioned
        ? `monitors have lost quorum: ${q.largestGroup} of ${q.configured} can see each other, ${q.needed} needed`
        : `${q.configured - q.up} of ${q.configured} monitors down, quorum needs ${q.needed}`,
      [q.partitioned
        ? 'Enough monitors are running, but the network has split them. The cluster '
          + 'serves no I/O at all until they can reach each other again.'
        : 'Without a majority of monitors the cluster serves no I/O at all, however '
          + 'healthy the disks are.']);
  } else if (q.up < q.configured) {
    add('MON_DOWN', WARN, `${q.configured - q.up} of ${q.configured} monitors down`,
      [`Quorum holds with ${q.largestGroup}; ${q.needed} are needed.`]);
  } else if (q.configured % 2 === 0 && q.configured > 0) {
    add('MON_DOWN', WARN, `${q.configured} monitors is an even number`,
      [`${q.configured} mons tolerate the same ${q.configured / 2 - 1} failures as `
       + `${q.configured - 1} would. Use an odd number.`]);
  }

  // -------------------------------------------------------------- manager --
  if (daemons.mgr.configured === 0 && doc.hosts.length) {
    add('MGR_DOWN', WARN, 'no manager configured',
      ['No stats, no dashboard and no balancer. Data is unaffected.']);
  } else if (daemons.mgr.up === 0 && daemons.mgr.configured > 0) {
    add('MGR_DOWN', WARN, 'no active manager',
      ['Stats, the dashboard and the balancer stop. Data is unaffected.']);
  }

  // -------------------------------------------------------------- OSDs -----
  const allOsds = doc.hosts.flatMap((h) => h.osds.map((o) => ({ o, h })));
  const down = allOsds.filter(({ o, h }) =>
    o.up === false || h.up === false || net.unreachableHosts.has(h.id));
  const out = allOsds.filter(({ o }) => o.in === false);
  if (down.length) {
    const hosts = [...new Set(down.map(({ h }) => h.id))];
    const whole = hosts.filter((id) => {
      const h = doc.hosts.find((x) => x.id === id);
      return h.osds.length && h.osds.every((o) =>
        down.some((d) => d.o.id === o.id));
    });
    add('OSD_DOWN', WARN, `${down.length} osds down`,
      down.slice(0, 8).map(({ o, h }) =>
        `osd.${o.id} (${h.name}) — ${net.reasons.get(h.id) || (h.up === false ? 'host is down' : 'marked down')}`));
    if (whole.length) {
      add('OSD_HOST_DOWN', WARN, `${whole.length} host${whole.length === 1 ? '' : 's'} (${down.length} osds) down`,
        whole.map((id) => {
          const h = doc.hosts.find((x) => x.id === id);
          return `${h.name} — ${net.reasons.get(id) || 'down'}`;
        }));
    }
  }
  if (out.length) {
    add('OSD_OUT', WARN, `${out.length} osds out`,
      out.slice(0, 8).map(({ o, h }) => `osd.${o.id} (${h.name}) reweight 0`));
  }

  // ------------------------------------------------------------ fullness ---
  const named = (ids) => ids.slice(0, 8).map((id) => {
    const u = usage.get(id);
    return `osd.${id} is ${(u.ratio * 100).toFixed(1)}% full`;
  });
  if (df.full.length) {
    add('OSD_FULL', ERR, `${df.full.length} osds full`,
      [...named(df.full), `Writes stop at ${RATIOS.full * 100}%.`]);
  }
  if (df.backfillfull.length) {
    add('OSD_BACKFILLFULL', WARN, `${df.backfillfull.length} osds backfillfull`,
      [...named(df.backfillfull), `Backfill into these stops at ${RATIOS.backfillfull * 100}%.`]);
  }
  if (df.nearfull.length) {
    add('OSD_NEARFULL', WARN, `${df.nearfull.length} osds nearfull`,
      [...named(df.nearfull),
       'A cluster is as full as its fullest OSD, not as full as its average.']);
  }

  // ----------------------------------------------------------------- PGs ---
  let inactive = 0, degraded = 0, undersized = 0, misplaced = 0, totalPgs = 0;
  const availDetail = [], degradedDetail = [];
  for (const ev of evals) {
    totalPgs += ev.pool.pg_num;
    inactive += ev.inactive;
    degraded += ev.degraded;
    misplaced += ev.misplaced;
    undersized += ev.undersizedShards;
    if (ev.inactive) {
      availDetail.push(`pool ${ev.pool.name}: ${ev.inactive} pgs below min_size `
        + `${poolMinSize(ev.pool)} of ${poolWidth(ev.pool)}`);
    }
    if (ev.degraded) degradedDetail.push(`pool ${ev.pool.name}: ${ev.degraded} pgs degraded`);
  }
  if (inactive) {
    add('PG_AVAILABILITY', ERR, `Reduced data availability: ${inactive} pgs inactive`,
      [...availDetail, 'Clients block on these PGs; this is an outage, not a warning.']);
  }
  if (degraded) {
    add('PG_DEGRADED', WARN,
      `Degraded data redundancy: ${undersized} objects degraded, ${degraded} pgs degraded`,
      degradedDetail);
  }
  if (misplaced) {
    add('OBJECT_MISPLACED', WARN, `${misplaced} pgs misplaced`,
      ['Data is safe but not where CRUSH now wants it; backfill will move it.']);
  }

  // --------------------------------------------------------- pool sizing ---
  const inOsds = allOsds.filter(({ o }) => o.in !== false).length;
  if (inOsds > 0 && totalPgs > 0) {
    const replicas = evals.reduce((a, ev) => a + ev.pool.pg_num * poolWidth(ev.pool), 0);
    const per = replicas / inOsds;
    if (per < MIN_PG_PER_OSD) {
      add('TOO_FEW_PGS', WARN, `too few pgs per osd (${per.toFixed(0)} < min ${MIN_PG_PER_OSD})`,
        ['Fewer PGs means coarser placement and a lumpier distribution.']);
    } else if (per > MAX_PG_PER_OSD) {
      add('TOO_MANY_PGS', WARN, `too many pgs per osd (${per.toFixed(0)} > max ${MAX_PG_PER_OSD})`,
        ['Every PG costs memory and peering time on every OSD that holds it.']);
    }
  }
  // Deliberately absent: a check for pgp_num < pg_num. Ceph has no health check
  // for it (the autoscaler owns that now), and inventing one would break the
  // promise that every name here is one you can grep for. panel-pools.js reports
  // it as our own warning instead, where it is clearly ours.

  // -------------------------------------------------------------- CephFS ---
  for (const fs of daemons.filesystems) {
    if (!fs.up) {
      add('MDS_ALL_DOWN', ERR, `filesystem ${fs.name} has no active MDS`,
        ['The filesystem is offline. RADOS below it is unaffected.']);
    } else if (fs.degraded) {
      add('FS_DEGRADED', WARN,
        `filesystem ${fs.name} is degraded: ${fs.ranksActive} of ${fs.ranksWanted} ranks active`, []);
    } else if (fs.standbys === 0) {
      add('MDS_INSUFFICIENT_STANDBY', WARN, `filesystem ${fs.name} has no standby MDS`,
        ['Losing the active MDS takes the filesystem down until one is started.']);
    }
  }

  const status = checks.some((c) => c.severity === ERR) ? ERR
    : checks.length ? WARN : OK;
  return { status, checks, summary: summarise(status, checks) };
}

function summarise(status, checks) {
  if (status === OK) return 'HEALTH_OK';
  return `${status}: ${checks.map((c) => c.summary).join('; ')}`;
}

export { OK, WARN, ERR };
