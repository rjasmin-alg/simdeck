# course-uvod-u-linux: course page: Uvod u Linux (Linux Essentials?)

| | |
|---|---|
| Task | `course-uvod-u-linux` (wave 4) |
| Owner | coordinator or owner (admin → Kolegiji) |
| Size | S |
| Depends on | wave 0; add each sim when it is `ready` |
| Licence | AGPL-3.0-or-later |

## Goal

A course file `courses/uvod-u-linux.json` and its generated page: the playlist for **Uvod u Linux (Linux Essentials?)**, in the order the
course teaches it. Sims are added as they become `ready` (unfinished ones are flagged by the check, not
published).

## Do

- Create the course in the admin (Kolegiji → + Novi kolegij), or by hand per `docs/site-structure.md` §3.2.
- Ask the owner for the course's title, term, sections (lectures or weeks) and short address.
- Order the sims below by the syllabus; leave out what the owner drops; tools never go on course pages.

## Candidate sims (58, from the catalogue's course column)

| Sim | Title | Wave | Catalogue § |
|---|---|---|---|
| `lvm-topology` | LVM topology lab (en) | 1 | 2.1 |
| `dhcp-dora` | DHCP DORA and the lease | 2a | 4.1 |
| `rule-first-match` | First match wins | 2a | 4.1 |
| `cert-chain` | Chain of trust and expiry | 2b | 4.2 |
| `dns-records` | DNS record types | 2b | 4.2 |
| `dns-resolution` | Recursive and iterative resolution | 2b | 4.2 |
| `email-path` | The path of an e-mail | 2b | 4.2 |
| `http-exchange` | One HTTP exchange | 2b | 4.2 |
| `ntp-sync` | NTP offset and delay | 2b | 4.2 |
| `ssh-key-auth` | SSH host and user keys | 2b | 4.2 |
| `tls-handshake` | TLS 1.2 vs 1.3 | 2b | 4.2 |
| `lnx-boot-chain` | The boot chain | 2b | 4.4 |
| `lnx-links-inodes` | Hard links, symlinks and inodes | 2b | 4.4 |
| `lnx-log-path` | The path of a log message | 2b | 4.4 |
| `lnx-lvm-extend` | Extending an LV and its filesystem | 2b | 4.4 |
| `lnx-mount-layers` | Block device to mount point | 2b | 4.4 |
| `lnx-permissions-rwx` | Permission bits, octal, umask | 2b | 4.4 |
| `lnx-pipes-redirection` | Pipes and the three streams | 2b | 4.4 |
| `lnx-routing-decision` | Address, route and resolver | 2b | 4.4 |
| `lnx-selinux-decision` | DAC says yes, SELinux says no | 2b | 4.4 |
| `lnx-shell-quoting` | Quoting and word splitting | 2b | 4.4 |
| `lnx-systemd-ordering` | systemd dependencies and ordering | 2b | 4.4 |
| `backup-diff-incr` | Differential vs incremental | 2b | 4.6 |
| `linux-dirs` | The Linux directory tree | 3 | 4.11 |
| `well-known-ports` | Well-known ports | 3 | 4.11 |
| `acme-renewal` | ACME certificate renewal | 3 | 4.2 |
| `dns-secondary-expiry` | A secondary is a cache with a timer | 3 | 4.2 |
| `dns-ttl-cache` | TTL caching and the cutover | 3 | 4.2 |
| `dnssec-chain` | DNSSEC chain of trust | 3 | 4.2 |
| `email-auth` | SPF, DKIM and DMARC | 3 | 4.2 |
| `http-caching` | HTTP caching | 3 | 4.2 |
| `reverse-proxy-lb` | Reverse proxy and load balancing | 3 | 4.2 |
| `smtp-dialogue` | An SMTP session | 3 | 4.2 |
| `ssh-tunnels` | SSH port forwarding | 3 | 4.2 |
| `password-storage` | Storing passwords | 3 | 4.3 |
| `lnx-access-decision` | The access decision | 3 | 4.4 |
| `lnx-disk-full-mysteries` | "Disk full" with free space | 3 | 4.4 |
| `lnx-exit-status` | Exit status and &&, ||, set -e, pipefail | 3 | 4.4 |
| `lnx-firewalld-zones` | firewalld zones | 3 | 4.4 |
| `lnx-job-control` | Job control | 3 | 4.4 |
| `lnx-load-average` | Load average | 3 | 4.4 |
| `lnx-logrotate` | logrotate | 3 | 4.4 |
| `lnx-memory-swap-oom` | Memory, swap and the OOM killer | 3 | 4.4 |
| `lnx-mirror-not-backup` | A mirror is not a backup | 3 | 4.4 |
| `lnx-nfs-root-squash` | NFS and root squash | 3 | 4.4 |
| `lnx-package-deps` | Package dependency resolution | 3 | 4.4 |
| `lnx-page-cache` | free vs available | 3 | 4.4 |
| `disk-partitioning` | MBR vs GPT | 3 | 4.4 |
| `lnx-quotas` | Disk quotas | 3 | 4.4 |
| `lnx-regex-match` | How a regex matches | 3 | 4.4 |
| `lnx-rsync-delete` | rsync, trailing slashes and --delete | 3 | 4.4 |
| `lnx-signals` | Signals | 3 | 4.4 |
| `lnx-special-bits` | setuid, setgid and sticky | 3 | 4.4 |
| `lnx-subshell-trap` | Subshells and traps | 3 | 4.4 |
| `lnx-timers-cron` | cron vs systemd timers | 3 | 4.4 |
| `win-powershell-objects` | PowerShell pipes objects, bash pipes text | 3 | 4.5.7 |
| `restore-drill` | The backup that lies | 3 | 4.6 |
| `retention-gfs` | Retention: grandfather-father-son | 3 | 4.6 |
