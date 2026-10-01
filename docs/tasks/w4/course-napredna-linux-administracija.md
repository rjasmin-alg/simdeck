# course-napredna-linux-administracija: course page: Napredna Linux administracija

| | |
|---|---|
| Task | `course-napredna-linux-administracija` (wave 4) |
| Owner | coordinator or owner (admin → Kolegiji) |
| Size | S |
| Depends on | wave 0; add each sim when it is `ready` |
| Licence | AGPL-3.0-or-later |

## Goal

A course file `courses/napredna-linux-administracija.json` and its generated page: the playlist for **Napredna Linux administracija**, in the order the
course teaches it. Sims are added as they become `ready` (unfinished ones are flagged by the check, not
published).

## Do

- Create the course in the admin (Kolegiji → + Novi kolegij), or by hand per `docs/site-structure.md` §3.2.
- Ask the owner for the course's title, term, sections (lectures or weeks) and short address.
- Order the sims below by the syllabus; leave out what the owner drops; tools never go on course pages.

## Candidate sims (78, from the catalogue's course column)

| Sim | Title | Wave | Catalogue § |
|---|---|---|---|
| `l2l3-protocols` | L2/L3 protocol deep dive (en) | 1 | 2.1 |
| `lvm-topology` | LVM topology lab (en) | 1 | 2.1 |
| `stratis-lab` | Stratis topology lab (en) | 1 | 2.1 |
| `zfs-btrfs-lab` | ZFS & Btrfs topology lab (en) | 1 | 2.1 |
| `cephsim` | cephsim | 1 | 2.4 |
| `faultline` | faultline | 1 | 2.4 |
| `rule-first-match` | First match wins | 2a | 4.1 |
| `stp` | Spanning tree | 2b | 4.1 |
| `tcp-congestion` | TCP congestion control | 2b | 4.1 |
| `bgp-path-selection` | BGP path selection | 2b | 4.2 |
| `lnx-cow-filesystem` | Copy-on-write filesystems | 2b | 4.4 |
| `lnx-namespaces` | A container is a process | 2b | 4.4 |
| `lnx-netfilter-path` | A packet through netfilter | 2b | 4.4 |
| `lnx-overlayfs-layers` | Image layers and copy-up | 2b | 4.4 |
| `win-kerberos` | Kerberos | 2b | 4.5.1 |
| `backing-chains` | Backing chains (qcow2, VHDX, VMware delta) | 2b | 4.6 |
| `dedup-chunking` | Deduplication: fixed vs content-defined chunks | 2a | 4.6 |
| `db-replication` | Replication lag and failover | 2b | 4.7 |
| `multimaster-conflict` | Multi-master replication with a conflict | 2b | 4.7 |
| `quorum-split-brain` | Quorum and split-brain | 2b | 4.7 |
| `utilisation-latency` | Latency near full utilisation | 2b | 4.8 |
| `fragmentation-pmtud` | Fragmentation and PMTUD | 3 | 4.1 |
| `link-aggregation` | Link aggregation and flow hashing | 3 | 4.1 |
| `link-state-spf` | Link state and Dijkstra | 3 | 4.1 |
| `multicast-igmp` | Multicast and IGMP | 3 | 4.1 |
| `qos-queues` | QoS queues | 3 | 4.1 |
| `vlan-trunk` | Access and trunk ports, native VLAN | 3 | 4.1 |
| `bgp-hijack` | BGP hijack and RPKI | 3 | 4.2 |
| `reverse-proxy-lb` | Reverse proxy and load balancing | 3 | 4.2 |
| `ssh-tunnels` | SSH port forwarding | 3 | 4.2 |
| `ipsec-ike` | IPsec and IKE | 3 | 4.3 |
| `pki-revocation` | Revocation: CRL vs OCSP | 3 | 4.3 |
| `wireguard` | WireGuard | 3 | 4.3 |
| `lnx-alert-states` | Alert states: pending and firing | 3 | 4.4 |
| `lnx-ansible-idempotence` | Idempotence | 3 | 4.4 |
| `lnx-bonding-modes` | Bonding modes | 3 | 4.4 |
| `lnx-cgroups` | cgroups limits | 3 | 4.4 |
| `lnx-container-ports` | Publishing a container port | 3 | 4.4 |
| `lnx-container-volumes` | Where container data is lost | 3 | 4.4 |
| `lnx-deploy-strategies` | Blue-green, canary, rolling | 3 | 4.4 |
| `lnx-hypervisor-types` | Type 1 vs type 2, containers vs VMs | 3 | 4.4 |
| `lnx-live-migration` | Live migration | 3 | 4.4 |
| `lnx-load-average` | Load average | 3 | 4.4 |
| `lnx-lvm-snapshot` | LVM snapshot filling up | 3 | 4.4 |
| `lnx-multipath` | Multipath I/O | 3 | 4.4 |
| `lnx-netns-veth-bridge` | Namespaces, veth and a bridge | 3 | 4.4 |
| `lnx-page-cache` | free vs available | 3 | 4.4 |
| `lnx-pam-stack` | The PAM stack | 3 | 4.4 |
| `lnx-policy-routing` | Policy routing | 3 | 4.4 |
| `lnx-raid-rebuild` | Rebuild under load and the second failure | 3 | 4.4 |
| `lnx-send-receive` | Btrfs/ZFS send and receive | 3 | 4.4 |
| `lnx-terraform-drift` | Infrastructure as code: state and drift | 3 | 4.4 |
| `lnx-thin-overcommit` | Thin provisioning and overcommit | 3 | 4.4 |
| `lnx-userns-mapping` | Rootless containers | 3 | 4.4 |
| `lnx-zfs-self-heal` | Checksums and self-healing | 3 | 4.4 |
| `ceph-down-out` | down vs out | 3 | 4.6 |
| `ceph-min-size` | size and min_size | 3 | 4.6 |
| `cow-vs-row` | Copy-on-write vs redirect-on-write | 3 | 4.6 |
| `crush-failure-domain` | Failure domain in a placement rule | 3 | 4.6 |
| `ec-vs-replication` | Erasure coding vs replication | 3 | 4.6 |
| `iops-latency` | IOPS, throughput and latency | 3 | 4.6 |
| `nas-vs-san` | File vs block storage | 3 | 4.6 |
| `smallest-disk-caps` | One small or full disk caps the pool | 3 | 4.6 |
| `ssd-internals` | Inside an SSD | 3 | 4.6 |
| `sync-async-replication` | Synchronous vs asynchronous replication | 3 | 4.6 |
| `write-cache` | Write-back vs write-through | 3 | 4.6 |
| `cap-under-partition` | CAP under partition | 3 | 4.7 |
| `consistent-hashing` | Consistent hashing | 3 | 4.7 |
| `fencing` | Fencing (STONITH) | 3 | 4.7 |
| `lamport-clocks` | Logical clocks | 3 | 4.7 |
| `raft` | Raft leader election and log replication | 3 | 4.7 |
| `two-phase-commit` | Two-phase commit | 3 | 4.7 |
| `vrrp-failover` | VRRP failover | 3 | 4.7 |
| `autoscaling-lag` | Autoscaling lag | 3 | 4.8 |
| `rate-limiting` | Token bucket vs leaky bucket | 3 | 4.8 |
| `retry-storm` | Retry storms and metastable collapse | 3 | 4.8 |
| `slo-error-budget` | SLOs and error budgets | 3 | 4.8 |
| `tail-latency` | Tail latency and fan-out | 3 | 4.8 |
