# course-windows-napredno: course page: Windows administration, advanced (working name)

| | |
|---|---|
| Task | `course-windows-napredno` (wave 4) |
| Owner | coordinator or owner (admin → Kolegiji) |
| Size | S |
| Depends on | wave 0; add each sim when it is `ready` |
| Licence | AGPL-3.0-or-later |

## Goal

A course file `courses/windows-napredno.json` and its generated page: the playlist for **Windows administration, advanced (working name)**, in the order the
course teaches it. Sims are added as they become `ready` (unfinished ones are flagged by the check, not
published).

## Do

- Create the course in the admin (Kolegiji → + Novi kolegij), or by hand per `docs/site-structure.md` §3.2.
- Use the working title above; the owner gives official course names later (not needed now). Ask for
  sections (lectures or weeks) and a short address only when the page is published.
- Order the sims below by the syllabus; leave out what the owner drops; tools never go on course pages.

## Candidate sims (47, from the catalogue's course column)

| Sim | Title | Wave | Catalogue § |
|---|---|---|---|
| `topologydrafter` | topologydrafter | 1 | 2.4 |
| `win-ad-replication` | AD multi-master replication | 2b | 4.5.1 |
| `win-kerberos` | Kerberos | 2b | 4.5.1 |
| `backing-chains` | Backing chains (qcow2, VHDX, VMware delta) | 2b | 4.6 |
| `multimaster-conflict` | Multi-master replication with a conflict | 2b | 4.7 |
| `quorum-split-brain` | Quorum and split-brain | 2b | 4.7 |
| `lateral-movement` | Lateral movement and tiering | 3 | 4.3 |
| `win-ad-backup-restore` | Restoring a DC, and USN rollback | 3 | 4.5.1 |
| `win-ad-recycle-bin` | Deleted objects: tombstone and recycle bin | 3 | 4.5.1 |
| `win-ad-sites` | Sites, site links and the KCC | 3 | 4.5.1 |
| `win-delegation` | Delegation of control | 3 | 4.5.1 |
| `win-fgpp` | Password policy and fine-grained policies | 3 | 4.5.1 |
| `win-fsmo-roles` | FSMO roles | 3 | 4.5.1 |
| `win-functional-levels` | Functional levels | 3 | 4.5.1 |
| `win-ntlm-vs-kerberos` | NTLM vs Kerberos | 3 | 4.5.1 |
| `win-rodc` | Read-only DC at a branch | 3 | 4.5.1 |
| `win-sysvol-dfsr` | SYSVOL replication | 3 | 4.5.1 |
| `win-time-hierarchy` | Time in a domain | 3 | 4.5.1 |
| `win-trusts` | Trusts | 3 | 4.5.1 |
| `win-admx-store` | ADMX and the central store | 3 | 4.5.2 |
| `win-gpo-loopback` | Loopback processing | 3 | 4.5.2 |
| `win-gpo-security-filtering` | Security and WMI filtering | 3 | 4.5.2 |
| `win-gpo-slow-link` | Slow links | 3 | 4.5.2 |
| `win-gpo-targeting` | Item-level targeting | 3 | 4.5.2 |
| `win-gpo-tattooing` | Policies vs preferences | 3 | 4.5.2 |
| `win-dns-policies` | DNS policies and zone scopes | 3 | 4.5.3 |
| `win-dns-scavenging` | Aging and scavenging | 3 | 4.5.3 |
| `win-dhcp-dns-update` | DHCP updating DNS for clients | 3 | 4.5.4 |
| `win-dhcp-failover` | DHCP failover | 3 | 4.5.4 |
| `win-dhcp-policies` | Policy-based assignment | 3 | 4.5.4 |
| `win-dhcp-superscope` | Superscopes | 3 | 4.5.4 |
| `win-ipam-audit` | Who had this IP at 14:32? | 3 | 4.5.5 |
| `win-ipam-discovery` | IPAM discovery and provisioning | 3 | 4.5.5 |
| `win-ipam-reconcile` | IPAM vs reality | 3 | 4.5.5 |
| `win-ipam-utilisation` | Utilisation and thresholds | 3 | 4.5.5 |
| `win-update-rings` | Update rings | 3 | 4.5.6 |
| `win-wsus-cloned-id` | Clients that never report | 3 | 4.5.6 |
| `win-wsus-delivery` | Delivering updates over a WAN | 3 | 4.5.6 |
| `win-wsus-supersedence` | Superseded updates and cleanup | 3 | 4.5.6 |
| `win-bitlocker-tpm` | BitLocker and the TPM | 3 | 4.5.7 |
| `win-dfs` | DFS namespace and replication | 3 | 4.5.7 |
| `win-failover-cluster` | Failover cluster quorum | 3 | 4.5.7 |
| `win-hyperv-checkpoints` | Hyper-V checkpoints | 3 | 4.5.7 |
| `win-laps` | LAPS | 3 | 4.5.7 |
| `win-ntfs-mft` | NTFS MFT | 3 | 4.5.7 |
| `win-smb-session` | An SMB session | 3 | 4.5.7 |
| `win-storage-spaces` | Storage Spaces | 3 | 4.5.7 |
