# course-optimizacija-i-oporavak: course page: Optimisation and disaster recovery

| | |
|---|---|
| Task | `course-optimizacija-i-oporavak` (wave 4) |
| Owner | coordinator or owner (admin → Kolegiji) |
| Size | S |
| Depends on | wave 0; add each sim when it is `ready` |
| Licence | AGPL-3.0-or-later |

## Goal

A course file `courses/optimizacija-i-oporavak.json` and its generated page: the playlist for **Optimisation and disaster recovery**, in the order the
course teaches it. Sims are added as they become `ready` (unfinished ones are flagged by the check, not
published).

## Do

- Create the course in the admin (Kolegiji → + Novi kolegij), or by hand per `docs/site-structure.md` §3.2.
- Use the working title above; the owner gives official course names later (not needed now). Ask for
  sections (lectures or weeks) and a short address only when the page is published.
- Order the sims below by the syllabus; leave out what the owner drops; tools never go on course pages.

## Candidate sims (58, from the catalogue's course column)

| Sim | Title | Wave | Catalogue § |
|---|---|---|---|
| `cephsim` | cephsim | 1 | 2.4 |
| `faultline` | faultline | 1 | 2.4 |
| `cert-chain` | Chain of trust and expiry | 2b | 4.2 |
| `rpo-rto` | RPO and RTO | 2b | 4.6 |
| `backing-chains` | Backing chains (qcow2, VHDX, VMware delta) | 2b | 4.6 |
| `backup-diff-incr` | Differential vs incremental | 2b | 4.6 |
| `dedup-chunking` | Deduplication: fixed vs content-defined chunks | 2a | 4.6 |
| `db-replication` | Replication lag and failover | 2b | 4.7 |
| `multimaster-conflict` | Multi-master replication with a conflict | 2b | 4.7 |
| `quorum-split-brain` | Quorum and split-brain | 2b | 4.7 |
| `utilisation-latency` | Latency near full utilisation | 2b | 4.8 |
| `fin-ale-risk` | Expected annual loss and the price of a control | 3 | 4.12 |
| `fin-capex-opex` | CapEx vs OpEx: one purchase, three views | 3 | 4.12 |
| `fin-cloud-commitment` | Cloud commitment vs on-demand | 3 | 4.12 |
| `fin-contingency-reserve` | Contingency reserve: P50 vs P80 | 3 | 4.12 |
| `fin-downtime-cost` | What an hour down costs, and what a nine is worth | 3 | 4.12 |
| `fin-fixed-variable` | Fixed, variable and step costs; break-even | 3 | 4.12 |
| `fin-refresh-cycle` | Refresh cycles and economic life | 3 | 4.12 |
| `fin-tco` | Total cost of ownership | 3 | 4.12 |
| `cmp-bia` | Business impact analysis: what must come back first | 3 | 4.13 |
| `cmp-incident-clocks` | Incident reporting clocks: 24 hours, 72 hours, one month | 3 | 4.13 |
| `cmp-restore-evidence` | Restore tests as evidence: covering the estate in a year | 3 | 4.13 |
| `dns-secondary-expiry` | A secondary is a cache with a timer | 3 | 4.2 |
| `dns-split-brain` | Two primaries are two zones | 3 | 4.2 |
| `dns-ttl-cache` | TTL caching and the cutover | 3 | 4.2 |
| `ransomware-321` | 3-2-1 and immutable copies vs ransomware | 3 | 4.3 |
| `lnx-exit-status` | Exit status and &&, ||, set -e, pipefail | 3 | 4.4 |
| `lnx-mirror-not-backup` | A mirror is not a backup | 3 | 4.4 |
| `lnx-raid-rebuild` | Rebuild under load and the second failure | 3 | 4.4 |
| `lnx-rsync-delete` | rsync, trailing slashes and --delete | 3 | 4.4 |
| `lnx-send-receive` | Btrfs/ZFS send and receive | 3 | 4.4 |
| `lnx-thin-overcommit` | Thin provisioning and overcommit | 3 | 4.4 |
| `win-ad-backup-restore` | Restoring a DC, and USN rollback | 3 | 4.5.1 |
| `win-ad-recycle-bin` | Deleted objects: tombstone and recycle bin | 3 | 4.5.1 |
| `alert-to-nobody` | The alert that reaches nobody | 3 | 4.6 |
| `correlated-failure` | One power strip under three replicas | 3 | 4.6 |
| `site-failover` | Site failover | 3 | 4.6 |
| `backup-window` | Backup window and offsite seeding | 3 | 4.6 |
| `ceph-down-out` | down vs out | 3 | 4.6 |
| `ceph-min-size` | size and min_size | 3 | 4.6 |
| `cow-vs-row` | Copy-on-write vs redirect-on-write | 3 | 4.6 |
| `crush-failure-domain` | Failure domain in a placement rule | 3 | 4.6 |
| `dedup-file-funnel` | Finding duplicate files | 3 | 4.6 |
| `ec-vs-replication` | Erasure coding vs replication | 3 | 4.6 |
| `iops-latency` | IOPS, throughput and latency | 3 | 4.6 |
| `restore-drill` | The backup that lies | 3 | 4.6 |
| `retention-gfs` | Retention: grandfather-father-son | 3 | 4.6 |
| `smallest-disk-caps` | One small or full disk caps the pool | 3 | 4.6 |
| `sync-async-replication` | Synchronous vs asynchronous replication | 3 | 4.6 |
| `write-cache` | Write-back vs write-through | 3 | 4.6 |
| `cap-under-partition` | CAP under partition | 3 | 4.7 |
| `never-zero-spof` | No system has zero SPOFs | 3 | 4.7 |
| `autoscaling-lag` | Autoscaling lag | 3 | 4.8 |
| `goodhart-teams` | Local optimisation, global degradation | 3 | 4.8 |
| `littles-law` | Little's law | 3 | 4.8 |
| `retry-storm` | Retry storms and metastable collapse | 3 | 4.8 |
| `slo-error-budget` | SLOs and error budgets | 3 | 4.8 |
| `tail-latency` | Tail latency and fan-out | 3 | 4.8 |
