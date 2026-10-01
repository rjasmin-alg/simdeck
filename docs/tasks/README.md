# simdeck tasks

Generated from `docs/catalogue.md` by `tools/catalogue/tasks.py`. One task per simulator; each task file is self-contained together with `COMMON.md` and the repo. Wave 0 and the course and kit tasks are written by hand (`w0/`, `w4/`).

Run order: wave 0 → wave 1 (in parallel) → wave 2a pilots → kit views K1–K4 → wave 2b (in parallel) → wave 3 (in parallel, each after its soft dependency) → wave 4 course pages as sims become ready. Within a wave, tasks are independent except where **Depends on** says otherwise.

## Wave 0: foundation (coordinator, before anything else)

| Task | What |
|---|---|
| [`kit-follow-ups`](w0/kit-follow-ups.md) | done on main (cd893d4): kept for reference |
| [`bilingual`](w0/bilingual.md) | Croatian and English in every sim, the index and course pages |
| [`contract-check`](w0/contract-check.md) | one command that checks a sim against the contract, and the per-task gate |
| [`vocabulary`](w0/vocabulary.md) | topics and tags every task needs, in both languages |
| [`licence`](w0/licence.md) | AGPL-3.0-or-later: LICENSE, package.json, source link on every page |
| [`licence-source-repos`](w0/licence-source-repos.md) | AGPL-3.0-or-later in the repos simdeck copies from (owner: AGPL everything) |
| [`shared-models`](w0/shared-models.md) | where model code shared by several sims lives (`models/` done; first promotion waits on `dhcp-dora`) |
| [`presets-in-index`](w0/presets-in-index.md) | index and course entries that open a sim at a preset |
| [`ossimulator-english`](w0/ossimulator-english.md) | English UI for ossimulator (in its own repo) |
| [`freeze-originals`](w0/freeze-originals.md) | notes in the original projects pointing to the simdeck copies |
| [`publish`](w0/publish.md) | build and deploy after every merge |

## Wave 1: adopt what exists (83 tasks)

| # | Task | Title | Group | Size | Pri | Depends on |
|---|---|---|---|---|---|---|
| 1 | [`amdahl`](w1/amdahl.md) | Amdahl's law simulator (en) | single-page-labs | S | P1 |  |
| 2 | [`webserver-amdahl`](w1/webserver-amdahl.md) | Web server Amdahl (en) | single-page-labs | S | P2 |  |
| 3 | [`multicore-mesi`](w1/multicore-mesi.md) | Homogeneous multicore, LV13 (hr) | single-page-labs | S | P2 |  |
| 4 | [`sram-dram`](w1/sram-dram.md) | SRAM vs DRAM cell (en) | single-page-labs | S | P2 |  |
| 5 | [`rowhammer`](w1/rowhammer.md) | Rowhammer (en) | single-page-labs | S | P2 |  |
| 6 | [`spectre-meltdown`](w1/spectre-meltdown.md) | Spectre & Meltdown (en) | single-page-labs | S | P2 |  |
| 7 | [`l2l3-protocols`](w1/l2l3-protocols.md) | L2/L3 protocol deep dive (en) | single-page-labs | S | P2 |  |
| 8 | [`automata`](w1/automata.md) | DFA, NFA, PDA, Turing machine (hr) | single-page-labs | S | P2 |  |
| 9 | [`dfa-game`](w1/dfa-game.md) | DFA classroom game (hr) | single-page-labs | S | P3 |  |
| 10 | [`lvm-topology`](w1/lvm-topology.md) | LVM topology lab (en) | single-page-labs | S | P1 |  |
| 11 | [`stratis-lab`](w1/stratis-lab.md) | Stratis topology lab (en) | single-page-labs | S | P2 |  |
| 12 | [`zfs-btrfs-lab`](w1/zfs-btrfs-lab.md) | ZFS & Btrfs topology lab (en) | single-page-labs | S | P2 |  |
| 13 | [`radio-security-slides`](w1/radio-security-slides.md) | Radio and cybersecurity 2026, slides (hr) | single-page-labs | S | P3 |  |
| 14 | [`radio-security-page`](w1/radio-security-page.md) | Radio and cybersecurity, web page (hr/en) | single-page-labs | S | P3 |  |
| 15 | [`rf-bandplan`](w1/rf-bandplan.md) | RF spectrum EU/HR bandplan (hr) | single-page-labs | S | P2 |  |
| 16 | [`comms-poster`](w1/comms-poster.md) | Communication technologies poster (hr) | single-page-labs | S | P3 |  |
| 17 | [`radio-networks`](w1/radio-networks.md) | Radio network demos (hr) | single-page-labs | S | P2 |  |
| 18 | [`lora-mesh`](w1/lora-mesh.md) | LoRa / mesh comparison (hr) | single-page-labs | S | P2 |  |
| 19 | [`ham-modes`](w1/ham-modes.md) | Ham radio modes reference (hr) | single-page-labs | S | P3 |  |
| 20 | [`student-picker`](w1/student-picker.md) | Random student picker (hr) | single-page-labs | S | P2 |  |
| 21 | [`subnet-mask`](w1/subnet-mask.md) | Subnet mask | URM book pages | S | P1 |  |
| 22 | [`vlsm`](w1/vlsm.md) | VLSM | URM book pages | S | P1 |  |
| 23 | [`ipv6-shorten`](w1/ipv6-shorten.md) | Shortening IPv6 addresses | URM book pages | S | P2 |  |
| 24 | [`mac-table`](w1/mac-table.md) | MAC address table | URM book pages | S | P1 |  |
| 25 | [`vlan`](w1/vlan.md) | VLAN | URM book pages | S | P1 |  |
| 26 | [`routing-table`](w1/routing-table.md) | Routing table, longest prefix | URM book pages | S | P1 |  |
| 27 | [`nat`](w1/nat.md) | NAT | URM book pages | S | P1 |  |
| 28 | [`pat`](w1/pat.md) | PAT | URM book pages | S | P1 |  |
| 29 | [`tcp-handshake`](w1/tcp-handshake.md) | TCP three-way handshake | URM book pages | S | P1 |  |
| 30 | [`flow-control`](w1/flow-control.md) | Flow control | URM book pages | S | P2 |  |
| 31 | [`tcp-window`](w1/tcp-window.md) | Sliding window | URM book pages | S | P2 |  |
| 32 | [`hidden-node`](w1/hidden-node.md) | Hidden node | URM book pages | S | P2 |  |
| 33 | [`stateful-firewall`](w1/stateful-firewall.md) | Firewall, stateful filtering and DMZ | URM book pages | S | P1 |  |
| 34 | [`layered-diagnosis`](w1/layered-diagnosis.md) | Layer-by-layer troubleshooting | URM book pages | S | P2 |  |
| 35 | [`interrupts`](w1/interrupts.md) | Interrupts (S ch. 1) | ossimulator | S | P1 |  |
| 36 | [`processes`](w1/processes.md) | Processes (S ch. 3) | ossimulator | S | P1 |  |
| 37 | [`scheduling`](w1/scheduling.md) | CPU scheduling (S ch. 9) | ossimulator | S | P1 |  |
| 38 | [`memory-allocation`](w1/memory-allocation.md) | Memory allocation (S ch. 7) | ossimulator | S | P2 |  |
| 39 | [`address-translation`](w1/address-translation.md) | Address translation (S ch. 7–8) | ossimulator | S | P1 |  |
| 40 | [`page-replacement`](w1/page-replacement.md) | Page replacement (S ch. 8) | ossimulator | S | P1 |  |
| 41 | [`threads`](w1/threads.md) | Threads (S ch. 4) | ossimulator | S | P2 |  |
| 42 | [`synchronization`](w1/synchronization.md) | Synchronization (S ch. 5) | ossimulator | S | P1 |  |
| 43 | [`deadlock`](w1/deadlock.md) | Deadlock (S ch. 6) | ossimulator | S | P1 |  |
| 44 | [`io-techniques`](w1/io-techniques.md) | I/O techniques (S ch. 1, 11) | ossimulator | S | P2 |  |
| 45 | [`disk-scheduling`](w1/disk-scheduling.md) | Disk scheduling (S ch. 11) | ossimulator | S | P2 |  |
| 46 | [`raid-cache`](w1/raid-cache.md) | RAID and disk cache (S ch. 11) | ossimulator | S | P1 |  |
| 47 | [`drivers`](w1/drivers.md) | Device drivers (S ch. 11) | ossimulator | S | P3 |  |
| 48 | [`filesystem`](w1/filesystem.md) | File system (S ch. 12) | ossimulator | S | P2 |  |
| 49 | [`syscalls`](w1/syscalls.md) | System calls (S ch. 2–3) | ossimulator | S | P1 |  |
| 50 | [`os-call-journey`](w1/os-call-journey.md) | Journey of one call (capstone) | ossimulator | S | P2 |  |
| 51 | [`os-map`](w1/os-map.md) | OS map (index) | ossimulator | S | P2 |  |
| 52 | [`topologydrafter`](w1/topologydrafter.md) | topologydrafter | larger apps | S | P1 |  |
| 53 | [`cephsim`](w1/cephsim.md) | cephsim | larger apps | S | P1 |  |
| 54 | [`faultline`](w1/faultline.md) | faultline | larger apps | S | P2 |  |
| 55 | [`nyquist`](w1/nyquist.md) | applet_nyquist.html | 50ohm applets | S | P2 |  |
| 56 | [`quantisation`](w1/quantisation.md) | quantisierung_und_sampling.html | 50ohm applets | S | P2 |  |
| 57 | [`fourier`](w1/fourier.md) | fourier.html | 50ohm applets | S | P2 |  |
| 58 | [`rect-pulse-spectrum`](w1/rect-pulse-spectrum.md) | applet_rectangle.html | 50ohm applets | S | P3 |  |
| 59 | [`sine-amplitude-period`](w1/sine-amplitude-period.md) | applet_sinus_amplitude_und_periode.html | 50ohm applets | S | P3 |  |
| 60 | [`lambda-f`](w1/lambda-f.md) | applet_lambda_und_f.html | 50ohm applets | S | P2 |  |
| 61 | [`am-modulation`](w1/am-modulation.md) | applet_am_modulator.html | 50ohm applets | S | P2 |  |
| 62 | [`phase-modulation`](w1/phase-modulation.md) | applet_pm.html | 50ohm applets | S | P3 |  |
| 63 | [`qpsk`](w1/qpsk.md) | applet_qpsk.html | 50ohm applets | S | P2 |  |
| 64 | [`iq-signals`](w1/iq-signals.md) | applet_iq.html | 50ohm applets | S | P3 |  |
| 65 | [`iq-phasor`](w1/iq-phasor.md) | applet_iq_zeiger.html | 50ohm applets | S | P3 |  |
| 66 | [`ring-modulator`](w1/ring-modulator.md) | applet_ringmodulator.html | 50ohm applets | S | P3 |  |
| 67 | [`speech-spectrum`](w1/speech-spectrum.md) | spektrum_sprachsignale.html | 50ohm applets | S | P3 |  |
| 68 | [`dsp-basics`](w1/dsp-basics.md) | applet_dsp.html | 50ohm applets | S | P3 |  |
| 69 | [`dsp-filter`](w1/dsp-filter.md) | applet_dsp_filter.html | 50ohm applets | S | P3 |  |
| 70 | [`chirp-1`](w1/chirp-1.md) | applet_chirp_1.html | 50ohm applets | S | P3 |  |
| 71 | [`chirp-2`](w1/chirp-2.md) | applet_chirp_2.html | 50ohm applets | S | P3 |  |
| 72 | [`lc-resonance`](w1/lc-resonance.md) | applet_schwingkreis.html | 50ohm applets | S | P3 |  |
| 73 | [`lc-antenna`](w1/lc-antenna.md) | applet_schwingkreis_antenne.html | 50ohm applets | S | P3 |  |
| 74 | [`trap-antenna`](w1/trap-antenna.md) | applet_traps.html | 50ohm applets | S | P3 |  |
| 75 | [`attenuator`](w1/attenuator.md) | applet_daempfungsglied.html | 50ohm applets | S | P3 |  |
| 76 | [`rectifier-1`](w1/rectifier-1.md) | applet_gleichrichter_1.html | 50ohm applets | S | P3 |  |
| 77 | [`rectifier-2`](w1/rectifier-2.md) | applet_gleichrichter_2.html | 50ohm applets | S | P3 |  |
| 78 | [`ripple`](w1/ripple.md) | applet_brumm.html | 50ohm applets | S | P3 |  |
| 79 | [`multipath-interference`](w1/multipath-interference.md) | applet_interferenz.html | 50ohm applets | S | P2 |  |
| 80 | [`fading`](w1/fading.md) | fading_applet.html | 50ohm applets | S | P3 |  |
| 81 | [`skip-distance`](w1/skip-distance.md) | sprungdistanz_applet.html | 50ohm applets | S | P3 |  |
| 82 | [`greyline`](w1/greyline.md) | greyline.html | 50ohm applets | S | P3 |  |
| 83 | [`aurora`](w1/aurora.md) | applet_aurora.html | 50ohm applets | S | P3 |  |

## Wave 2a: pilots (each shapes a kit view) (4 tasks)

Then the kit tasks: [`kit-sequence-chart`](w0/kit-sequence-chart.md), [`kit-topology`](w0/kit-topology.md), [`kit-block-grid`](w0/kit-block-grid.md), [`kit-rule-table`](w0/kit-rule-table.md).

| # | Task | Title | Group | Size | Pri | Depends on |
|---|---|---|---|---|---|---|
| 1 | [`arp-local-remote`](w2/arp-local-remote.md) | Local or remote, then ARP | Network fundamentals | S | P1 |  |
| 2 | [`dhcp-dora`](w2/dhcp-dora.md) | DHCP DORA and the lease | DHCP | S | P1 |  |
| 3 | [`rule-first-match`](w2/rule-first-match.md) | First match wins | Network fundamentals | S | P1 |  |
| 4 | [`dedup-chunking`](w2/dedup-chunking.md) | Deduplication: fixed vs content-defined chunks | Storage and backup | M | B1 |  |

## Wave 2b: core technologies (61 tasks)

| # | Task | Title | Group | Size | Pri | Depends on |
|---|---|---|---|---|---|---|
| 1 | [`dns-resolution`](w2/dns-resolution.md) | Recursive and iterative resolution | DNS | M | P1 |  |
| 2 | [`dns-records`](w2/dns-records.md) | DNS record types | DNS | S | P2 |  |
| 3 | [`win-dns-zone-types`](w2/win-dns-zone-types.md) | Zone types and replication scope | DNS | S | P2 |  |
| 4 | [`win-dns-srv-records`](w2/win-dns-srv-records.md) | What AD puts in DNS | DNS | S | P2 | after `win-dc-promotion` |
| 5 | [`win-dns-dynamic-update`](w2/win-dns-dynamic-update.md) | Secure dynamic updates | DNS | S | P2 |  |
| 6 | [`win-dhcp-scope-options`](w2/win-dhcp-scope-options.md) | Scopes, reservations and option precedence | DHCP | S | P1 |  |
| 7 | [`win-ad-structure`](w2/win-ad-structure.md) | Forest, tree, domain, OU | Active Directory | S | P2 |  |
| 8 | [`win-group-scopes`](w2/win-group-scopes.md) | Group scopes and AGDLP | Active Directory | S | P1 |  |
| 9 | [`win-dc-promotion`](w2/win-dc-promotion.md) | What promoting a DC does | Active Directory | S | P2 |  |
| 10 | [`win-domain-join`](w2/win-domain-join.md) | Joining a domain | Active Directory | S | P2 |  |
| 11 | [`win-domain-logon`](w2/win-domain-logon.md) | Domain logon | Active Directory | M | P2 | after `win-dns-srv-records` |
| 12 | [`win-kerberos`](w2/win-kerberos.md) | Kerberos | Active Directory | M | P1 |  |
| 13 | [`win-ad-replication`](w2/win-ad-replication.md) | AD multi-master replication | Active Directory | M | P2 | after `multimaster-conflict` |
| 14 | [`win-gpo-precedence`](w2/win-gpo-precedence.md) | GPO precedence | Group Policy | M | P1 |  |
| 15 | [`win-gpo-processing`](w2/win-gpo-processing.md) | When policy applies | Group Policy | S | P2 |  |
| 16 | [`win-ipam-address-plan`](w2/win-ipam-address-plan.md) | Planning the address space | IPAM | S | P2 |  |
| 17 | [`win-wsus-flow`](w2/win-wsus-flow.md) | How an update reaches a client | WSUS | M | P1 |  |
| 18 | [`win-ntfs-share-effective`](w2/win-ntfs-share-effective.md) | Effective access: NTFS plus share | Windows files and identity | S | P1 |  |
| 19 | [`win-access-token`](w2/win-access-token.md) | The access token | Windows files and identity | S | P2 |  |
| 20 | [`encapsulation`](w2/encapsulation.md) | Encapsulation and decapsulation | Network fundamentals | S | P1 |  |
| 21 | [`hop-rewrite`](w2/hop-rewrite.md) | What changes at each hop | Network fundamentals | S | P1 |  |
| 22 | [`stp`](w2/stp.md) | Spanning tree | Network fundamentals | M | P1 |  |
| 23 | [`ipv6-slaac`](w2/ipv6-slaac.md) | IPv6 SLAAC | Network fundamentals | M | P2 |  |
| 24 | [`port-multiplexing`](w2/port-multiplexing.md) | Ports and sockets | Network fundamentals | S | P2 |  |
| 25 | [`tcp-retransmit`](w2/tcp-retransmit.md) | Loss and retransmission | Network fundamentals | M | P2 |  |
| 26 | [`tcp-congestion`](w2/tcp-congestion.md) | TCP congestion control | Network fundamentals | M | P1 |  |
| 27 | [`wifi-association`](w2/wifi-association.md) | 802.11 association step by step | Network fundamentals | S | P2 |  |
| 28 | [`wpa-handshake`](w2/wpa-handshake.md) | WPA2/WPA3 handshake and what an attacker sees | Network fundamentals | M | B1 |  |
| 29 | [`http-exchange`](w2/http-exchange.md) | One HTTP exchange | Internet protocols | S | P2 |  |
| 30 | [`tls-handshake`](w2/tls-handshake.md) | TLS 1.2 vs 1.3 | Internet protocols | M | P1 |  |
| 31 | [`cert-chain`](w2/cert-chain.md) | Chain of trust and expiry | Internet protocols | S | P1 |  |
| 32 | [`email-path`](w2/email-path.md) | The path of an e-mail | Internet protocols | M | P2 |  |
| 33 | [`ssh-key-auth`](w2/ssh-key-auth.md) | SSH host and user keys | Internet protocols | S | P2 |  |
| 34 | [`ntp-sync`](w2/ntp-sync.md) | NTP offset and delay | Internet protocols | S | P2 |  |
| 35 | [`bgp-path-selection`](w2/bgp-path-selection.md) | BGP path selection | Internet protocols | M | P2 |  |
| 36 | [`sym-vs-asym`](w2/sym-vs-asym.md) | Symmetric vs asymmetric encryption | Security foundations | S | P2 |  |
| 37 | [`diffie-hellman`](w2/diffie-hellman.md) | Diffie–Hellman | Security foundations | S | P2 |  |
| 38 | [`hash-properties`](w2/hash-properties.md) | Hash functions | Security foundations | S | P2 |  |
| 39 | [`digital-signature`](w2/digital-signature.md) | Digital signatures | Security foundations | S | P2 |  |
| 40 | [`lnx-pipes-redirection`](w2/lnx-pipes-redirection.md) | Pipes and the three streams | Linux foundations | S | P1 |  |
| 41 | [`lnx-links-inodes`](w2/lnx-links-inodes.md) | Hard links, symlinks and inodes | Linux foundations | S | P2 |  |
| 42 | [`lnx-permissions-rwx`](w2/lnx-permissions-rwx.md) | Permission bits, octal, umask | Linux foundations | S | P1 |  |
| 43 | [`lnx-boot-chain`](w2/lnx-boot-chain.md) | The boot chain | Linux foundations | S | P2 |  |
| 44 | [`lnx-systemd-ordering`](w2/lnx-systemd-ordering.md) | systemd dependencies and ordering | Linux foundations | M | P2 |  |
| 45 | [`lnx-mount-layers`](w2/lnx-mount-layers.md) | Block device to mount point | Linux foundations | S | P2 |  |
| 46 | [`lnx-log-path`](w2/lnx-log-path.md) | The path of a log message | Linux foundations | S | P2 |  |
| 47 | [`lnx-routing-decision`](w2/lnx-routing-decision.md) | Address, route and resolver | Linux foundations | S | P2 |  |
| 48 | [`lnx-shell-quoting`](w2/lnx-shell-quoting.md) | Quoting and word splitting | Linux foundations | S | P2 |  |
| 49 | [`lnx-selinux-decision`](w2/lnx-selinux-decision.md) | DAC says yes, SELinux says no | Linux foundations | S | P1 |  |
| 50 | [`lnx-namespaces`](w2/lnx-namespaces.md) | A container is a process | Linux foundations | M | P2 |  |
| 51 | [`lnx-overlayfs-layers`](w2/lnx-overlayfs-layers.md) | Image layers and copy-up | Linux foundations | S | P1 |  |
| 52 | [`lnx-netfilter-path`](w2/lnx-netfilter-path.md) | A packet through netfilter | Linux foundations | M | P1 |  |
| 53 | [`lnx-cow-filesystem`](w2/lnx-cow-filesystem.md) | Copy-on-write filesystems | Linux foundations | S | P2 |  |
| 54 | [`lnx-lvm-extend`](w2/lnx-lvm-extend.md) | Extending an LV and its filesystem | Linux foundations | S | P2 |  |
| 55 | [`backup-diff-incr`](w2/backup-diff-incr.md) | Differential vs incremental | Storage and backup | S | B1 |  |
| 56 | [`backing-chains`](w2/backing-chains.md) | Backing chains (qcow2, VHDX, VMware delta) | Storage and backup | M | B1 |  |
| 57 | [`rpo-rto`](w2/rpo-rto.md) | RPO and RTO | Storage and backup | S | P2 |  |
| 58 | [`multimaster-conflict`](w2/multimaster-conflict.md) | Multi-master replication with a conflict | Replication and HA | M | B1 |  |
| 59 | [`quorum-split-brain`](w2/quorum-split-brain.md) | Quorum and split-brain | Replication and HA | S | P1 |  |
| 60 | [`db-replication`](w2/db-replication.md) | Replication lag and failover | Replication and HA | S | P2 |  |
| 61 | [`utilisation-latency`](w2/utilisation-latency.md) | Latency near full utilisation | Performance | S | P2 |  |

## Wave 3: derivatives (236 tasks)

| # | Task | Title | Group | Size | Pri | Depends on |
|---|---|---|---|---|---|---|
| 1 | [`syn-outcomes`](w3/syn-outcomes.md) | Open, closed, filtered | Networking basics and LAN protocols | S | P1 | after `tcp-handshake` |
| 2 | [`arp-spoofing`](w3/arp-spoofing.md) | ARP spoofing, man in the middle | Networking basics and LAN protocols | S | P2 | after `arp-local-remote` |
| 3 | [`broadcast-storm`](w3/broadcast-storm.md) | A loop without spanning tree | Networking basics and LAN protocols | S | P2 | preset on `stp` |
| 4 | [`crc-error-detection`](w3/crc-error-detection.md) | Error detection with CRC | Networking basics and LAN protocols | S | P2 |  |
| 5 | [`csma-cd`](w3/csma-cd.md) | CSMA/CD and binary exponential backoff | Networking basics and LAN protocols | M | P2 |  |
| 6 | [`delay-components`](w3/delay-components.md) | Four kinds of delay | Networking basics and LAN protocols | S | P2 |  |
| 7 | [`dhcp-relay`](w3/dhcp-relay.md) | DHCP relay and giaddr | Networking basics and LAN protocols | S | P2 | after `dhcp-dora` |
| 8 | [`distance-vector`](w3/distance-vector.md) | Distance vector and count to infinity | Networking basics and LAN protocols | M | P2 | after `routing-table` |
| 9 | [`domains`](w3/domains.md) | Collision and broadcast domains | Networking basics and LAN protocols | S | P2 | after `mac-table` |
| 10 | [`fragmentation-pmtud`](w3/fragmentation-pmtud.md) | Fragmentation and PMTUD | Networking basics and LAN protocols | M | P2 | after `hop-rewrite` |
| 11 | [`icmp-messages`](w3/icmp-messages.md) | What ping answers mean | Networking basics and LAN protocols | S | P2 | after `hop-rewrite` |
| 12 | [`intervlan-routing`](w3/intervlan-routing.md) | Inter-VLAN routing | Networking basics and LAN protocols | S | P2 | after `vlan` |
| 13 | [`ipv6-ndp`](w3/ipv6-ndp.md) | NDP instead of ARP | Networking basics and LAN protocols | S | P2 | after `ipv6-slaac` |
| 14 | [`link-aggregation`](w3/link-aggregation.md) | Link aggregation and flow hashing | Networking basics and LAN protocols | S | P2 |  |
| 15 | [`link-state-spf`](w3/link-state-spf.md) | Link state and Dijkstra | Networking basics and LAN protocols | M | P2 |  |
| 16 | [`packet-journey`](w3/packet-journey.md) | The whole journey: from URL to page | Networking basics and LAN protocols | L | P2 | after `encapsulation` |
| 17 | [`port-forwarding`](w3/port-forwarding.md) | Port forwarding (DNAT) | Networking basics and LAN protocols | S | P2 | after `pat` |
| 18 | [`route-summarisation`](w3/route-summarisation.md) | Route summarisation | Networking basics and LAN protocols | S | P2 | after `routing-table` |
| 19 | [`static-default-route`](w3/static-default-route.md) | Static and default routes | Networking basics and LAN protocols | S | P2 | after `routing-table` |
| 20 | [`tcp-teardown`](w3/tcp-teardown.md) | TCP connection teardown | Networking basics and LAN protocols | S | P2 | preset on `tcp-handshake` |
| 21 | [`tcp-vs-udp-loss`](w3/tcp-vs-udp-loss.md) | TCP vs UDP under loss | Networking basics and LAN protocols | S | P2 | after `tcp-retransmit` |
| 22 | [`traceroute`](w3/traceroute.md) | Traceroute and TTL | Networking basics and LAN protocols | S | P2 | after `hop-rewrite` |
| 23 | [`vlan-trunk`](w3/vlan-trunk.md) | Access and trunk ports, native VLAN | Networking basics and LAN protocols | S | P2 | after `vlan` |
| 24 | [`wifi-channels`](w3/wifi-channels.md) | Wi-Fi channels and overlap | Networking basics and LAN protocols | S | P2 |  |
| 25 | [`asymmetric-path`](w3/asymmetric-path.md) | Asymmetric path through NAT and firewall | Networking basics and LAN protocols | S | P3 | after `stateful-firewall` |
| 26 | [`cgnat`](w3/cgnat.md) | Carrier-grade NAT | Networking basics and LAN protocols | S | P3 | after `nat` |
| 27 | [`csma-ca-rts-cts`](w3/csma-ca-rts-cts.md) | CSMA/CA and RTS/CTS | Networking basics and LAN protocols | S | P3 | after `hidden-node` |
| 28 | [`dhcp-rogue`](w3/dhcp-rogue.md) | Rogue DHCP and snooping | Networking basics and LAN protocols | S | P3 | after `dhcp-dora` |
| 29 | [`ethernet-frame`](w3/ethernet-frame.md) | Anatomy of an Ethernet frame | Networking basics and LAN protocols | S | P3 | after `encapsulation` |
| 30 | [`ipv4-header`](w3/ipv4-header.md) | IPv4 header fields | Networking basics and LAN protocols | S | P3 | after `hop-rewrite` |
| 31 | [`ipv6-address-types`](w3/ipv6-address-types.md) | IPv6 address types and scopes | Networking basics and LAN protocols | S | P3 | after `ipv6-slaac` |
| 32 | [`line-coding`](w3/line-coding.md) | Line coding: NRZ vs Manchester | Networking basics and LAN protocols | S | P3 |  |
| 33 | [`mac-flooding`](w3/mac-flooding.md) | MAC flooding and port security | Networking basics and LAN protocols | S | P3 | after `mac-table` |
| 34 | [`multicast-igmp`](w3/multicast-igmp.md) | Multicast and IGMP | Networking basics and LAN protocols | M | P3 |  |
| 35 | [`nominal-vs-actual`](w3/nominal-vs-actual.md) | Nominal vs actual throughput | Networking basics and LAN protocols | S | P3 | after `delay-components` |
| 36 | [`osi-tcpip-map`](w3/osi-tcpip-map.md) | OSI vs TCP/IP, and which device lives where | Networking basics and LAN protocols | S | P3 | after `encapsulation` |
| 37 | [`poe-budget`](w3/poe-budget.md) | PoE power budget | Networking basics and LAN protocols | S | P3 |  |
| 38 | [`qos-queues`](w3/qos-queues.md) | QoS queues | Networking basics and LAN protocols | M | P3 |  |
| 39 | [`tcp-states`](w3/tcp-states.md) | TCP state machine | Networking basics and LAN protocols | M | P3 | after `tcp-retransmit` |
| 40 | [`wifi-roaming`](w3/wifi-roaming.md) | Roaming between APs | Networking basics and LAN protocols | S | P3 | after `wifi-association` |
| 41 | [`adsb-frame`](w3/adsb-frame.md) | Decoding an ADS-B frame | Radio and crisis communications | S | P3 |  |
| 42 | [`ctcss`](w3/ctcss.md) | CTCSS tone squelch | Radio and crisis communications | S | P3 |  |
| 43 | [`fec-hamming`](w3/fec-hamming.md) | Hamming code | Radio and crisis communications | S | P3 | preset on `crc-error-detection` |
| 44 | [`fft-waterfall`](w3/fft-waterfall.md) | FFT and the waterfall | Radio and crisis communications | M | P3 |  |
| 45 | [`fsk-psk-ask`](w3/fsk-psk-ask.md) | ASK, FSK and PSK | Radio and crisis communications | S | P3 |  |
| 46 | [`ionosphere-muf`](w3/ionosphere-muf.md) | Ionosphere, MUF and the dead zone | Radio and crisis communications | M | P3 | after `skip-distance` |
| 47 | [`lora-css`](w3/lora-css.md) | LoRa chirp spread spectrum | Radio and crisis communications | S | P3 |  |
| 48 | [`multiple-access`](w3/multiple-access.md) | FDMA, TDMA, CDMA | Radio and crisis communications | S | P3 |  |
| 49 | [`packet-aprs`](w3/packet-aprs.md) | Packet radio and APRS | Radio and crisis communications | M | P3 |  |
| 50 | [`qam-ofdm`](w3/qam-ofdm.md) | QAM and OFDM | Radio and crisis communications | M | P3 | after `qpsk` |
| 51 | [`shannon-hartley`](w3/shannon-hartley.md) | Shannon–Hartley | Radio and crisis communications | S | P3 |  |
| 52 | [`superhet-image`](w3/superhet-image.md) | Superheterodyne and the image frequency | Radio and crisis communications | M | P3 |  |
| 53 | [`swr`](w3/swr.md) | SWR and standing waves | Radio and crisis communications | M | P3 |  |
| 54 | [`backup-ncs`](w3/backup-ncs.md) | Backup NCS takeover | Radio and crisis communications | S | P3 | after `directed-net` |
| 55 | [`directed-net`](w3/directed-net.md) | Directed net vs free-for-all | Radio and crisis communications | S | P3 |  |
| 56 | [`gateway-tiers`](w3/gateway-tiers.md) | Multi-tier relay through a gateway | Radio and crisis communications | M | P3 | after `directed-net` |
| 57 | [`priority-traffic`](w3/priority-traffic.md) | Priority traffic and ACK | Radio and crisis communications | S | P3 | after `directed-net` |
| 58 | [`http-status-codes`](w3/http-status-codes.md) | HTTP status codes | Reference posters and classroom tools | S | P3 |  |
| 59 | [`linux-dirs`](w3/linux-dirs.md) | The Linux directory tree | Reference posters and classroom tools | S | P3 |  |
| 60 | [`well-known-ports`](w3/well-known-ports.md) | Well-known ports | Reference posters and classroom tools | S | P3 |  |
| 61 | [`protocol-headers`](w3/protocol-headers.md) | Header poster | Reference posters and classroom tools | S | P3 |  |
| 62 | [`countdown`](w3/countdown.md) | Exercise countdown | Reference posters and classroom tools | S | P3 |  |
| 63 | [`quick-poll`](w3/quick-poll.md) | Quick poll | Reference posters and classroom tools | M | P3 |  |
| 64 | [`dns-ttl-cache`](w3/dns-ttl-cache.md) | TTL caching and the cutover | Internet and application protocols | S | P1 | after `dns-resolution` |
| 65 | [`email-auth`](w3/email-auth.md) | SPF, DKIM and DMARC | Internet and application protocols | M | P1 | after `email-path` |
| 66 | [`bgp-hijack`](w3/bgp-hijack.md) | BGP hijack and RPKI | Internet and application protocols | M | P2 | after `bgp-path-selection` |
| 67 | [`cdn-anycast`](w3/cdn-anycast.md) | Anycast and CDN edges | Internet and application protocols | S | P2 | after `bgp-path-selection` |
| 68 | [`ddos-amplification`](w3/ddos-amplification.md) | DRDoS amplification | Internet and application protocols | S | P2 |  |
| 69 | [`dns-secondary-expiry`](w3/dns-secondary-expiry.md) | A secondary is a cache with a timer | Internet and application protocols | S | P2 | after `dns-records` |
| 70 | [`http-caching`](w3/http-caching.md) | HTTP caching | Internet and application protocols | S | P2 | after `http-exchange` |
| 71 | [`http-versions`](w3/http-versions.md) | HTTP/1.1 vs HTTP/2 vs HTTP/3 | Internet and application protocols | M | P2 | after `http-exchange` |
| 72 | [`reverse-proxy-lb`](w3/reverse-proxy-lb.md) | Reverse proxy and load balancing | Internet and application protocols | M | P2 | after `http-exchange` |
| 73 | [`ssh-tunnels`](w3/ssh-tunnels.md) | SSH port forwarding | Internet and application protocols | S | P2 | after `ssh-key-auth` |
| 74 | [`acme-renewal`](w3/acme-renewal.md) | ACME certificate renewal | Internet and application protocols | S | P3 | preset on `cert-chain` |
| 75 | [`cookies-sessions`](w3/cookies-sessions.md) | Cookies and sessions | Internet and application protocols | S | P3 | after `http-exchange` |
| 76 | [`cors`](w3/cors.md) | Same origin and CORS | Internet and application protocols | S | P3 | after `http-exchange` |
| 77 | [`dns-poisoning`](w3/dns-poisoning.md) | DNS cache poisoning | Internet and application protocols | M | P3 | after `dns-resolution` |
| 78 | [`dns-split-brain`](w3/dns-split-brain.md) | Two primaries are two zones | Internet and application protocols | S | P3 | preset on `dns-secondary-expiry` |
| 79 | [`dnssec-chain`](w3/dnssec-chain.md) | DNSSEC chain of trust | Internet and application protocols | M | P3 | after `dns-resolution` |
| 80 | [`ftp-active-passive`](w3/ftp-active-passive.md) | Active vs passive FTP | Internet and application protocols | S | P3 | after `nat` |
| 81 | [`oauth-flow`](w3/oauth-flow.md) | OAuth 2.0 / OIDC authorization code flow | Internet and application protocols | M | P3 | after `http-exchange` |
| 82 | [`peering-transit`](w3/peering-transit.md) | Transit vs peering | Internet and application protocols | S | P3 | after `bgp-path-selection` |
| 83 | [`smtp-dialogue`](w3/smtp-dialogue.md) | An SMTP session | Internet and application protocols | S | P3 | after `email-path` |
| 84 | [`websocket`](w3/websocket.md) | WebSocket upgrade | Internet and application protocols | S | P3 | after `http-exchange` |
| 85 | [`aaa-8021x`](w3/aaa-8021x.md) | AAA and 802.1X | Security and cryptography | M | P2 |  |
| 86 | [`dmz-matrix`](w3/dmz-matrix.md) | DMZ rule matrix | Security and cryptography | S | P2 | after `stateful-firewall` |
| 87 | [`lateral-movement`](w3/lateral-movement.md) | Lateral movement and tiering | Security and cryptography | M | P2 | after `win-ntlm-vs-kerberos` |
| 88 | [`password-storage`](w3/password-storage.md) | Storing passwords | Security and cryptography | S | P2 | after `hash-properties` |
| 89 | [`ransomware-321`](w3/ransomware-321.md) | 3-2-1 and immutable copies vs ransomware | Security and cryptography | S | P2 | after `backup-diff-incr` |
| 90 | [`sql-injection`](w3/sql-injection.md) | SQL injection | Security and cryptography | S | P2 |  |
| 91 | [`wireguard`](w3/wireguard.md) | WireGuard | Security and cryptography | M | P2 | after `diffie-hellman` |
| 92 | [`buffer-overflow`](w3/buffer-overflow.md) | Stack buffer overflow | Security and cryptography | M | P3 |  |
| 93 | [`classic-ciphers`](w3/classic-ciphers.md) | Caesar and Vigenère | Security and cryptography | S | P3 |  |
| 94 | [`ipsec-ike`](w3/ipsec-ike.md) | IPsec and IKE | Security and cryptography | M | P3 | after `diffie-hellman` |
| 95 | [`mfa-phishing`](w3/mfa-phishing.md) | MFA fatigue and adversary-in-the-middle | Security and cryptography | S | P3 |  |
| 96 | [`pki-revocation`](w3/pki-revocation.md) | Revocation: CRL vs OCSP | Security and cryptography | S | P3 | preset on `cert-chain` |
| 97 | [`xss`](w3/xss.md) | Cross-site scripting | Security and cryptography | S | P3 | after `http-exchange` |
| 98 | [`lnx-access-decision`](w3/lnx-access-decision.md) | The access decision | Linux | S | P2 | after `lnx-permissions-rwx` |
| 99 | [`lnx-alert-states`](w3/lnx-alert-states.md) | Alert states: pending and firing | Linux | S | P2 |  |
| 100 | [`lnx-ansible-idempotence`](w3/lnx-ansible-idempotence.md) | Idempotence | Linux | S | P2 |  |
| 101 | [`lnx-cgroups`](w3/lnx-cgroups.md) | cgroups limits | Linux | S | P2 | after `lnx-namespaces` |
| 102 | [`lnx-container-ports`](w3/lnx-container-ports.md) | Publishing a container port | Linux | S | P2 | preset on `port-forwarding` |
| 103 | [`lnx-container-volumes`](w3/lnx-container-volumes.md) | Where container data is lost | Linux | S | P2 | after `lnx-overlayfs-layers` |
| 104 | [`lnx-deploy-strategies`](w3/lnx-deploy-strategies.md) | Blue-green, canary, rolling | Linux | M | P2 |  |
| 105 | [`lnx-disk-full-mysteries`](w3/lnx-disk-full-mysteries.md) | "Disk full" with free space | Linux | S | P2 | after `lnx-links-inodes` |
| 106 | [`lnx-exit-status`](w3/lnx-exit-status.md) | Exit status and &&, ||, set -e, pipefail | Linux | S | P2 | after `lnx-pipes-redirection` |
| 107 | [`lnx-firewalld-zones`](w3/lnx-firewalld-zones.md) | firewalld zones | Linux | S | P2 | after `lnx-netfilter-path` |
| 108 | [`lnx-live-migration`](w3/lnx-live-migration.md) | Live migration | Linux | M | P2 |  |
| 109 | [`lnx-load-average`](w3/lnx-load-average.md) | Load average | Linux | S | P2 |  |
| 110 | [`lnx-lvm-snapshot`](w3/lnx-lvm-snapshot.md) | LVM snapshot filling up | Linux | S | P2 | after `lnx-lvm-extend` |
| 111 | [`lnx-memory-swap-oom`](w3/lnx-memory-swap-oom.md) | Memory, swap and the OOM killer | Linux | S | P2 |  |
| 112 | [`lnx-mirror-not-backup`](w3/lnx-mirror-not-backup.md) | A mirror is not a backup | Linux | S | P2 |  |
| 113 | [`lnx-netns-veth-bridge`](w3/lnx-netns-veth-bridge.md) | Namespaces, veth and a bridge | Linux | M | P2 | after `lnx-namespaces` |
| 114 | [`lnx-page-cache`](w3/lnx-page-cache.md) | free vs available | Linux | S | P2 |  |
| 115 | [`lnx-pam-stack`](w3/lnx-pam-stack.md) | The PAM stack | Linux | S | P2 |  |
| 116 | [`lnx-raid-rebuild`](w3/lnx-raid-rebuild.md) | Rebuild under load and the second failure | Linux | S | P2 |  |
| 117 | [`lnx-regex-match`](w3/lnx-regex-match.md) | How a regex matches | Linux | M | P2 |  |
| 118 | [`lnx-rsync-delete`](w3/lnx-rsync-delete.md) | rsync, trailing slashes and --delete | Linux | S | P2 |  |
| 119 | [`lnx-signals`](w3/lnx-signals.md) | Signals | Linux | S | P2 |  |
| 120 | [`lnx-terraform-drift`](w3/lnx-terraform-drift.md) | Infrastructure as code: state and drift | Linux | S | P2 |  |
| 121 | [`lnx-thin-overcommit`](w3/lnx-thin-overcommit.md) | Thin provisioning and overcommit | Linux | S | P2 | after `lnx-lvm-extend` |
| 122 | [`lnx-zfs-self-heal`](w3/lnx-zfs-self-heal.md) | Checksums and self-healing | Linux | S | P2 | after `lnx-cow-filesystem` |
| 123 | [`lnx-bonding-modes`](w3/lnx-bonding-modes.md) | Bonding modes | Linux | S | P3 | after `link-aggregation` |
| 124 | [`lnx-hypervisor-types`](w3/lnx-hypervisor-types.md) | Type 1 vs type 2, containers vs VMs | Linux | S | P3 |  |
| 125 | [`lnx-job-control`](w3/lnx-job-control.md) | Job control | Linux | S | P3 | after `lnx-signals` |
| 126 | [`lnx-logrotate`](w3/lnx-logrotate.md) | logrotate | Linux | S | P3 | after `lnx-log-path` |
| 127 | [`lnx-multipath`](w3/lnx-multipath.md) | Multipath I/O | Linux | S | P3 |  |
| 128 | [`lnx-nfs-root-squash`](w3/lnx-nfs-root-squash.md) | NFS and root squash | Linux | S | P3 | after `lnx-permissions-rwx` |
| 129 | [`lnx-package-deps`](w3/lnx-package-deps.md) | Package dependency resolution | Linux | S | P3 |  |
| 130 | [`disk-partitioning`](w3/disk-partitioning.md) | MBR vs GPT | Linux | S | P3 | after `lnx-mount-layers` |
| 131 | [`lnx-policy-routing`](w3/lnx-policy-routing.md) | Policy routing | Linux | S | P3 | after `lnx-routing-decision` |
| 132 | [`lnx-quotas`](w3/lnx-quotas.md) | Disk quotas | Linux | S | P3 |  |
| 133 | [`lnx-send-receive`](w3/lnx-send-receive.md) | Btrfs/ZFS send and receive | Linux | S | P3 | preset on `backup-diff-incr` |
| 134 | [`lnx-special-bits`](w3/lnx-special-bits.md) | setuid, setgid and sticky | Linux | S | P3 | after `lnx-permissions-rwx` |
| 135 | [`lnx-subshell-trap`](w3/lnx-subshell-trap.md) | Subshells and traps | Linux | S | P3 | after `lnx-shell-quoting` |
| 136 | [`lnx-timers-cron`](w3/lnx-timers-cron.md) | cron vs systemd timers | Linux | S | P3 | after `lnx-systemd-ordering` |
| 137 | [`lnx-userns-mapping`](w3/lnx-userns-mapping.md) | Rootless containers | Linux | S | P3 | after `lnx-namespaces` |
| 138 | [`win-ad-backup-restore`](w3/win-ad-backup-restore.md) | Restoring a DC, and USN rollback | Active Directory | M | P2 | after `win-ad-replication` |
| 139 | [`win-ad-recycle-bin`](w3/win-ad-recycle-bin.md) | Deleted objects: tombstone and recycle bin | Active Directory | S | P2 | after `win-ad-replication` |
| 140 | [`win-ad-sites`](w3/win-ad-sites.md) | Sites, site links and the KCC | Active Directory | M | P2 | after `win-ad-replication` |
| 141 | [`win-fgpp`](w3/win-fgpp.md) | Password policy and fine-grained policies | Active Directory | S | P2 | after `win-gpo-precedence` |
| 142 | [`win-fsmo-roles`](w3/win-fsmo-roles.md) | FSMO roles | Active Directory | S | P2 | after `win-ad-structure` |
| 143 | [`win-ntlm-vs-kerberos`](w3/win-ntlm-vs-kerberos.md) | NTLM vs Kerberos | Active Directory | S | P2 | after `win-kerberos` |
| 144 | [`win-ou-vs-group`](w3/win-ou-vs-group.md) | OU or group? | Active Directory | S | P2 | after `win-ad-structure` |
| 145 | [`win-sysvol-dfsr`](w3/win-sysvol-dfsr.md) | SYSVOL replication | Active Directory | S | P2 | after `win-ad-replication` |
| 146 | [`win-time-hierarchy`](w3/win-time-hierarchy.md) | Time in a domain | Active Directory | S | P2 | after `win-kerberos` |
| 147 | [`win-account-lockout`](w3/win-account-lockout.md) | Account lockout | Active Directory | S | P3 | after `win-domain-logon` |
| 148 | [`win-delegation`](w3/win-delegation.md) | Delegation of control | Active Directory | S | P3 | after `win-ad-structure` |
| 149 | [`win-functional-levels`](w3/win-functional-levels.md) | Functional levels | Active Directory | S | P3 | after `win-ad-structure` |
| 150 | [`win-rodc`](w3/win-rodc.md) | Read-only DC at a branch | Active Directory | S | P3 | after `win-ad-sites` |
| 151 | [`win-trusts`](w3/win-trusts.md) | Trusts | Active Directory | M | P3 | after `win-kerberos` |
| 152 | [`win-gpo-security-filtering`](w3/win-gpo-security-filtering.md) | Security and WMI filtering | Group Policy | S | P2 | after `win-gpo-precedence` |
| 153 | [`win-gpo-tattooing`](w3/win-gpo-tattooing.md) | Policies vs preferences | Group Policy | S | P2 | after `win-gpo-processing` |
| 154 | [`win-admx-store`](w3/win-admx-store.md) | ADMX and the central store | Group Policy | S | P3 | after `win-gpo-precedence` |
| 155 | [`win-gpo-loopback`](w3/win-gpo-loopback.md) | Loopback processing | Group Policy | S | P3 | after `win-gpo-precedence` |
| 156 | [`win-gpo-slow-link`](w3/win-gpo-slow-link.md) | Slow links | Group Policy | S | P3 | after `win-gpo-processing` |
| 157 | [`win-gpo-software-install`](w3/win-gpo-software-install.md) | Software installation | Group Policy | S | P3 | after `win-gpo-processing` |
| 158 | [`win-gpo-targeting`](w3/win-gpo-targeting.md) | Item-level targeting | Group Policy | S | P3 | after `win-gpo-tattooing` |
| 159 | [`win-dns-scavenging`](w3/win-dns-scavenging.md) | Aging and scavenging | DNS on Windows Server | S | P1 | after `win-dns-dynamic-update` |
| 160 | [`win-dns-client-order`](w3/win-dns-client-order.md) | How a Windows client resolves a name | DNS on Windows Server | S | P2 | after `dns-resolution` |
| 161 | [`win-dns-forwarders`](w3/win-dns-forwarders.md) | Forwarders, conditional forwarders, root hints | DNS on Windows Server | S | P2 | after `dns-resolution` |
| 162 | [`win-dns-policies`](w3/win-dns-policies.md) | DNS policies and zone scopes | DNS on Windows Server | S | P3 | after `win-dns-zone-types` |
| 163 | [`win-dhcp-dns-update`](w3/win-dhcp-dns-update.md) | DHCP updating DNS for clients | DHCP on Windows Server | S | P2 | after `win-dns-dynamic-update` |
| 164 | [`win-dhcp-failover`](w3/win-dhcp-failover.md) | DHCP failover | DHCP on Windows Server | S | P2 | after `win-dhcp-scope-options` |
| 165 | [`win-dhcp-authorization`](w3/win-dhcp-authorization.md) | Authorizing a DHCP server | DHCP on Windows Server | S | P3 | after `dhcp-dora` |
| 166 | [`win-dhcp-policies`](w3/win-dhcp-policies.md) | Policy-based assignment | DHCP on Windows Server | S | P3 | after `win-dhcp-scope-options` |
| 167 | [`win-dhcp-superscope`](w3/win-dhcp-superscope.md) | Superscopes | DHCP on Windows Server | S | P3 | after `win-dhcp-scope-options` |
| 168 | [`win-ipam-audit`](w3/win-ipam-audit.md) | Who had this IP at 14:32? | IPAM | S | P2 | after `win-ipam-address-plan` |
| 169 | [`win-ipam-utilisation`](w3/win-ipam-utilisation.md) | Utilisation and thresholds | IPAM | S | P2 | after `win-ipam-address-plan` |
| 170 | [`win-ipam-discovery`](w3/win-ipam-discovery.md) | IPAM discovery and provisioning | IPAM | S | P3 | after `win-ipam-address-plan` |
| 171 | [`win-ipam-reconcile`](w3/win-ipam-reconcile.md) | IPAM vs reality | IPAM | S | P3 | after `win-ipam-address-plan` |
| 172 | [`win-update-rings`](w3/win-update-rings.md) | Update rings | WSUS and updates | S | P2 | preset on `win-wsus-groups` |
| 173 | [`win-wsus-client-cycle`](w3/win-wsus-client-cycle.md) | The client update cycle | WSUS and updates | S | P2 | after `win-wsus-flow` |
| 174 | [`win-wsus-cloned-id`](w3/win-wsus-cloned-id.md) | Clients that never report | WSUS and updates | S | P2 | after `win-wsus-flow` |
| 175 | [`win-wsus-groups`](w3/win-wsus-groups.md) | Computer groups and approvals | WSUS and updates | S | P2 | after `win-wsus-flow` |
| 176 | [`win-wsus-delivery`](w3/win-wsus-delivery.md) | Delivering updates over a WAN | WSUS and updates | S | P3 | after `win-wsus-flow` |
| 177 | [`win-wsus-supersedence`](w3/win-wsus-supersedence.md) | Superseded updates and cleanup | WSUS and updates | S | P3 | after `win-wsus-flow` |
| 178 | [`win-boot`](w3/win-boot.md) | Windows boot chain | Files, identity and the rest | S | P2 | preset on `lnx-boot-chain` |
| 179 | [`win-failover-cluster`](w3/win-failover-cluster.md) | Failover cluster quorum | Files, identity and the rest | S | P2 | preset on `quorum-split-brain` |
| 180 | [`win-ntfs-inheritance`](w3/win-ntfs-inheritance.md) | NTFS inheritance | Files, identity and the rest | S | P2 | after `win-ntfs-share-effective` |
| 181 | [`win-powershell-objects`](w3/win-powershell-objects.md) | PowerShell pipes objects, bash pipes text | Files, identity and the rest | S | P2 | after `lnx-pipes-redirection` |
| 182 | [`win-uac`](w3/win-uac.md) | UAC and the split token | Files, identity and the rest | S | P2 | after `win-access-token` |
| 183 | [`win-vss`](w3/win-vss.md) | Volume Shadow Copy | Files, identity and the rest | S | P2 | preset on `lnx-cow-filesystem` |
| 184 | [`win-bitlocker-tpm`](w3/win-bitlocker-tpm.md) | BitLocker and the TPM | Files, identity and the rest | S | P3 | after `lnx-boot-chain` |
| 185 | [`win-dfs`](w3/win-dfs.md) | DFS namespace and replication | Files, identity and the rest | M | P3 | after `dns-resolution` |
| 186 | [`win-firewall-profiles`](w3/win-firewall-profiles.md) | Windows Firewall profiles | Files, identity and the rest | S | P3 | preset on `lnx-firewalld-zones` |
| 187 | [`win-hyperv-checkpoints`](w3/win-hyperv-checkpoints.md) | Hyper-V checkpoints | Files, identity and the rest | S | P3 | preset on `backing-chains` |
| 188 | [`win-laps`](w3/win-laps.md) | LAPS | Files, identity and the rest | S | P3 | after `lateral-movement` |
| 189 | [`win-ntfs-mft`](w3/win-ntfs-mft.md) | NTFS MFT | Files, identity and the rest | S | P3 |  |
| 190 | [`win-registry`](w3/win-registry.md) | The registry | Files, identity and the rest | S | P3 |  |
| 191 | [`win-services`](w3/win-services.md) | Services and dependencies | Files, identity and the rest | S | P3 | preset on `lnx-systemd-ordering` |
| 192 | [`win-smb-session`](w3/win-smb-session.md) | An SMB session | Files, identity and the rest | S | P3 | after `win-kerberos` |
| 193 | [`win-storage-spaces`](w3/win-storage-spaces.md) | Storage Spaces | Files, identity and the rest | S | P3 |  |
| 194 | [`backup-window`](w3/backup-window.md) | Backup window and offsite seeding | Storage, backup and disaster recovery | S | P2 | after `backup-diff-incr` |
| 195 | [`ceph-down-out`](w3/ceph-down-out.md) | down vs out | Storage, backup and disaster recovery | S | P2 | after `ceph-min-size` |
| 196 | [`ceph-min-size`](w3/ceph-min-size.md) | size and min_size | Storage, backup and disaster recovery | S | P2 | after `quorum-split-brain` |
| 197 | [`crush-failure-domain`](w3/crush-failure-domain.md) | Failure domain in a placement rule | Storage, backup and disaster recovery | S | P2 | after `ceph-min-size` |
| 198 | [`ec-vs-replication`](w3/ec-vs-replication.md) | Erasure coding vs replication | Storage, backup and disaster recovery | S | P2 |  |
| 199 | [`iops-latency`](w3/iops-latency.md) | IOPS, throughput and latency | Storage, backup and disaster recovery | S | P2 | after `utilisation-latency` |
| 200 | [`restore-drill`](w3/restore-drill.md) | The backup that lies | Storage, backup and disaster recovery | S | P2 | after `backup-diff-incr` |
| 201 | [`retention-gfs`](w3/retention-gfs.md) | Retention: grandfather-father-son | Storage, backup and disaster recovery | S | P2 | after `backup-diff-incr` |
| 202 | [`smallest-disk-caps`](w3/smallest-disk-caps.md) | One small or full disk caps the pool | Storage, backup and disaster recovery | S | P2 | after `ceph-min-size` |
| 203 | [`ssd-internals`](w3/ssd-internals.md) | Inside an SSD | Storage, backup and disaster recovery | M | P2 |  |
| 204 | [`sync-async-replication`](w3/sync-async-replication.md) | Synchronous vs asynchronous replication | Storage, backup and disaster recovery | S | P2 | preset on `db-replication` |
| 205 | [`write-cache`](w3/write-cache.md) | Write-back vs write-through | Storage, backup and disaster recovery | S | P2 |  |
| 206 | [`alert-to-nobody`](w3/alert-to-nobody.md) | The alert that reaches nobody | Storage, backup and disaster recovery | S | P3 |  |
| 207 | [`correlated-failure`](w3/correlated-failure.md) | One power strip under three replicas | Storage, backup and disaster recovery | S | P3 | preset on `faultline` |
| 208 | [`site-failover`](w3/site-failover.md) | Site failover | Storage, backup and disaster recovery | M | P3 | after `rpo-rto` |
| 209 | [`cow-vs-row`](w3/cow-vs-row.md) | Copy-on-write vs redirect-on-write | Storage, backup and disaster recovery | S | P3 | preset on `lnx-cow-filesystem` |
| 210 | [`dedup-file-funnel`](w3/dedup-file-funnel.md) | Finding duplicate files | Storage, backup and disaster recovery | S | P3 | after `dedup-chunking` |
| 211 | [`nas-vs-san`](w3/nas-vs-san.md) | File vs block storage | Storage, backup and disaster recovery | S | P3 |  |
| 212 | [`cap-under-partition`](w3/cap-under-partition.md) | CAP under partition | High availability and distributed systems | S | P2 | after `db-replication` |
| 213 | [`consistent-hashing`](w3/consistent-hashing.md) | Consistent hashing | High availability and distributed systems | S | P2 |  |
| 214 | [`fencing`](w3/fencing.md) | Fencing (STONITH) | High availability and distributed systems | S | P2 | preset on `quorum-split-brain` |
| 215 | [`raft`](w3/raft.md) | Raft leader election and log replication | High availability and distributed systems | M | P2 | after `quorum-split-brain` |
| 216 | [`vrrp-failover`](w3/vrrp-failover.md) | VRRP failover | High availability and distributed systems | S | P2 | after `arp-local-remote` |
| 217 | [`lamport-clocks`](w3/lamport-clocks.md) | Logical clocks | High availability and distributed systems | M | P3 |  |
| 218 | [`never-zero-spof`](w3/never-zero-spof.md) | No system has zero SPOFs | High availability and distributed systems | S | P3 | preset on `faultline` |
| 219 | [`two-phase-commit`](w3/two-phase-commit.md) | Two-phase commit | High availability and distributed systems | S | P3 |  |
| 220 | [`littles-law`](w3/littles-law.md) | Little's law | Performance and capacity | S | P2 | after `utilisation-latency` |
| 221 | [`rate-limiting`](w3/rate-limiting.md) | Token bucket vs leaky bucket | Performance and capacity | S | P2 |  |
| 222 | [`retry-storm`](w3/retry-storm.md) | Retry storms and metastable collapse | Performance and capacity | S | P2 | after `utilisation-latency` |
| 223 | [`slo-error-budget`](w3/slo-error-budget.md) | SLOs and error budgets | Performance and capacity | S | P2 |  |
| 224 | [`tail-latency`](w3/tail-latency.md) | Tail latency and fan-out | Performance and capacity | S | P2 | after `utilisation-latency` |
| 225 | [`autoscaling-lag`](w3/autoscaling-lag.md) | Autoscaling lag | Performance and capacity | S | P3 | after `utilisation-latency` |
| 226 | [`cache-hit-ratio`](w3/cache-hit-ratio.md) | Cache hit ratio and latency | Performance and capacity | S | P3 |  |
| 227 | [`game-tick-server`](w3/game-tick-server.md) | Authoritative tick server | Performance and capacity | M | P3 |  |
| 228 | [`goodhart-teams`](w3/goodhart-teams.md) | Local optimisation, global degradation | Performance and capacity | M | P3 | after `utilisation-latency` |
| 229 | [`cache-mapping`](w3/cache-mapping.md) | Cache mapping | Computer architecture, OS gaps and automata | M | P2 |  |
| 230 | [`pipeline-hazards`](w3/pipeline-hazards.md) | Pipeline hazards | Computer architecture, OS gaps and automata | M | P2 |  |
| 231 | [`endianness`](w3/endianness.md) | Endianness | Computer architecture, OS gaps and automata | S | P3 |  |
| 232 | [`floating-point`](w3/floating-point.md) | IEEE 754 | Computer architecture, OS gaps and automata | S | P3 |  |
| 233 | [`mesi-coherence`](w3/mesi-coherence.md) | MESI coherence on its own | Computer architecture, OS gaps and automata | S | P3 | after `multicore-mesi` |
| 234 | [`twos-complement`](w3/twos-complement.md) | Two's complement and overflow | Computer architecture, OS gaps and automata | S | P3 |  |
| 235 | [`regex-to-nfa`](w3/regex-to-nfa.md) | Regex to NFA to DFA | Computer architecture, OS gaps and automata | M | P3 | after `automata` |
| 236 | [`os-context-switch-cost`](w3/os-context-switch-cost.md) | What a context switch costs | Computer architecture, OS gaps and automata | S | P3 |  |

## Wave 4: course pages

One task per course: [`w4/`](w4/). Each lists the sims the catalogue assigns to the course; the course file adds a sim when it is `ready`.

## Not tasks

- `dc-sim`: Python/Streamlit, cannot be copied into a static site. Its phenomena are build tasks (`utilisation-latency`, `tail-latency`, `retry-storm`, `goodhart-teams`, `littles-law`, `autoscaling-lag`).
- `dr-lecture-estate`: documents, not a simulator; `instructor/map.html` is the answer key and must never be published. Its scenarios seed build tasks.
- The 50ohm maps (`maidenhead`, `aprs_map`, `hamnet_map`): they need live map tiles or external services, which the build refuses. Revisit if the owner wants online-only pages.

## Catalogue id → sim folder

Area prefixes are dropped from folder names except `win-` and `lnx-`; a few names are overridden for clarity (`tasks.py` `SIM_ID_OVERRIDE`).

| Catalogue id | Sim folder |
|---|---|
| `50ohm-am` | `am-modulation` |
| `50ohm-attenuator` | `attenuator` |
| `50ohm-aurora` | `aurora` |
| `50ohm-chirp-1` | `chirp-1` |
| `50ohm-chirp-2` | `chirp-2` |
| `50ohm-dsp` | `dsp-basics` |
| `50ohm-dsp-filter` | `dsp-filter` |
| `50ohm-fading` | `fading` |
| `50ohm-fourier` | `fourier` |
| `50ohm-greyline` | `greyline` |
| `50ohm-interference` | `multipath-interference` |
| `50ohm-iq` | `iq-signals` |
| `50ohm-iq-phasor` | `iq-phasor` |
| `50ohm-lambda-f` | `lambda-f` |
| `50ohm-lc-antenna` | `lc-antenna` |
| `50ohm-lc-resonance` | `lc-resonance` |
| `50ohm-nyquist` | `nyquist` |
| `50ohm-pm` | `phase-modulation` |
| `50ohm-qpsk` | `qpsk` |
| `50ohm-quantisation` | `quantisation` |
| `50ohm-rectangle` | `rect-pulse-spectrum` |
| `50ohm-rectifier-1` | `rectifier-1` |
| `50ohm-rectifier-2` | `rectifier-2` |
| `50ohm-ring-modulator` | `ring-modulator` |
| `50ohm-ripple` | `ripple` |
| `50ohm-sine` | `sine-amplitude-period` |
| `50ohm-skip-distance` | `skip-distance` |
| `50ohm-speech-spectrum` | `speech-spectrum` |
| `50ohm-traps` | `trap-antenna` |
| `app-cephsim` | `cephsim` |
| `app-faultline` | `faultline` |
| `app-topologydrafter` | `topologydrafter` |
| `arh-cache-mapping` | `cache-mapping` |
| `arh-endianness` | `endianness` |
| `arh-floating-point` | `floating-point` |
| `arh-mesi` | `mesi-coherence` |
| `arh-pipeline-hazards` | `pipeline-hazards` |
| `arh-twos-complement` | `twos-complement` |
| `aut-regex-to-nfa` | `regex-to-nfa` |
| `dr-alert-to-nobody` | `alert-to-nobody` |
| `dr-correlated-failure` | `correlated-failure` |
| `dr-rpo-rto` | `rpo-rto` |
| `dr-site-failover` | `site-failover` |
| `ha-cap` | `cap-under-partition` |
| `ha-consistent-hashing` | `consistent-hashing` |
| `ha-db-replication` | `db-replication` |
| `ha-fencing` | `fencing` |
| `ha-lamport-clocks` | `lamport-clocks` |
| `ha-multimaster-conflict` | `multimaster-conflict` |
| `ha-never-zero-spof` | `never-zero-spof` |
| `ha-quorum-split-brain` | `quorum-split-brain` |
| `ha-raft` | `raft` |
| `ha-two-phase-commit` | `two-phase-commit` |
| `ha-vrrp-failover` | `vrrp-failover` |
| `ham-adsb-frame` | `adsb-frame` |
| `ham-ctcss` | `ctcss` |
| `ham-fec-hamming` | `fec-hamming` |
| `ham-fft-waterfall` | `fft-waterfall` |
| `ham-fsk-psk-ask` | `fsk-psk-ask` |
| `ham-ionosphere-muf` | `ionosphere-muf` |
| `ham-lora-css` | `lora-css` |
| `ham-multiple-access` | `multiple-access` |
| `ham-packet-aprs` | `packet-aprs` |
| `ham-qam-ofdm` | `qam-ofdm` |
| `ham-shannon` | `shannon-hartley` |
| `ham-superhet-image` | `superhet-image` |
| `ham-swr` | `swr` |
| `inet-acme-renewal` | `acme-renewal` |
| `inet-bgp-hijack` | `bgp-hijack` |
| `inet-bgp-path-selection` | `bgp-path-selection` |
| `inet-cdn-anycast` | `cdn-anycast` |
| `inet-cert-chain` | `cert-chain` |
| `inet-cookies-sessions` | `cookies-sessions` |
| `inet-cors` | `cors` |
| `inet-ddos-amplification` | `ddos-amplification` |
| `inet-dns-poisoning` | `dns-poisoning` |
| `inet-dns-records` | `dns-records` |
| `inet-dns-resolution` | `dns-resolution` |
| `inet-dns-secondary-expiry` | `dns-secondary-expiry` |
| `inet-dns-split-brain` | `dns-split-brain` |
| `inet-dns-ttl-cache` | `dns-ttl-cache` |
| `inet-dnssec-chain` | `dnssec-chain` |
| `inet-email-auth` | `email-auth` |
| `inet-email-path` | `email-path` |
| `inet-ftp-active-passive` | `ftp-active-passive` |
| `inet-http-caching` | `http-caching` |
| `inet-http-exchange` | `http-exchange` |
| `inet-http-versions` | `http-versions` |
| `inet-ntp-sync` | `ntp-sync` |
| `inet-oauth-flow` | `oauth-flow` |
| `inet-peering-transit` | `peering-transit` |
| `inet-reverse-proxy-lb` | `reverse-proxy-lb` |
| `inet-smtp-dialogue` | `smtp-dialogue` |
| `inet-ssh-key-auth` | `ssh-key-auth` |
| `inet-ssh-tunnels` | `ssh-tunnels` |
| `inet-tls-handshake` | `tls-handshake` |
| `inet-websocket` | `websocket` |
| `kk-backup-ncs` | `backup-ncs` |
| `kk-directed-net` | `directed-net` |
| `kk-gateway-tiers` | `gateway-tiers` |
| `kk-priority-traffic` | `priority-traffic` |
| `lnx-partition-tables` | `disk-partitioning` |
| `net-arp-local-remote` | `arp-local-remote` |
| `net-arp-spoofing` | `arp-spoofing` |
| `net-asymmetric-path` | `asymmetric-path` |
| `net-broadcast-storm` | `broadcast-storm` |
| `net-cgnat` | `cgnat` |
| `net-crc` | `crc-error-detection` |
| `net-csma-ca-rts-cts` | `csma-ca-rts-cts` |
| `net-csma-cd` | `csma-cd` |
| `net-delay-components` | `delay-components` |
| `net-dhcp-dora` | `dhcp-dora` |
| `net-dhcp-relay` | `dhcp-relay` |
| `net-dhcp-rogue` | `dhcp-rogue` |
| `net-distance-vector` | `distance-vector` |
| `net-domains` | `domains` |
| `net-encapsulation` | `encapsulation` |
| `net-ethernet-frame` | `ethernet-frame` |
| `net-fragmentation-pmtud` | `fragmentation-pmtud` |
| `net-hop-rewrite` | `hop-rewrite` |
| `net-icmp-messages` | `icmp-messages` |
| `net-intervlan-routing` | `intervlan-routing` |
| `net-ipv4-header` | `ipv4-header` |
| `net-ipv6-address-types` | `ipv6-address-types` |
| `net-ipv6-ndp` | `ipv6-ndp` |
| `net-ipv6-slaac` | `ipv6-slaac` |
| `net-line-coding` | `line-coding` |
| `net-link-aggregation` | `link-aggregation` |
| `net-link-state-spf` | `link-state-spf` |
| `net-mac-flooding` | `mac-flooding` |
| `net-multicast-igmp` | `multicast-igmp` |
| `net-nominal-vs-actual` | `nominal-vs-actual` |
| `net-osi-tcpip-map` | `osi-tcpip-map` |
| `net-packet-journey` | `packet-journey` |
| `net-poe-budget` | `poe-budget` |
| `net-port-forwarding` | `port-forwarding` |
| `net-port-multiplexing` | `port-multiplexing` |
| `net-qos-queues` | `qos-queues` |
| `net-route-summarisation` | `route-summarisation` |
| `net-rule-first-match` | `rule-first-match` |
| `net-static-default-route` | `static-default-route` |
| `net-stp` | `stp` |
| `net-syn-outcomes` | `syn-outcomes` |
| `net-tcp-congestion` | `tcp-congestion` |
| `net-tcp-retransmit` | `tcp-retransmit` |
| `net-tcp-states` | `tcp-states` |
| `net-tcp-teardown` | `tcp-teardown` |
| `net-tcp-vs-udp-loss` | `tcp-vs-udp-loss` |
| `net-traceroute` | `traceroute` |
| `net-vlan-trunk` | `vlan-trunk` |
| `net-wifi-association` | `wifi-association` |
| `net-wifi-channels` | `wifi-channels` |
| `net-wifi-roaming` | `wifi-roaming` |
| `net-wpa-handshake` | `wpa-handshake` |
| `ossim-address-translation` | `address-translation` |
| `ossim-deadlock` | `deadlock` |
| `ossim-disk-scheduling` | `disk-scheduling` |
| `ossim-drivers` | `drivers` |
| `ossim-filesystem` | `filesystem` |
| `ossim-interrupts` | `interrupts` |
| `ossim-io-techniques` | `io-techniques` |
| `ossim-journey` | `os-call-journey` |
| `ossim-map` | `os-map` |
| `ossim-memory-allocation` | `memory-allocation` |
| `ossim-page-replacement` | `page-replacement` |
| `ossim-processes` | `processes` |
| `ossim-raid-cache` | `raid-cache` |
| `ossim-scheduling` | `scheduling` |
| `ossim-sync` | `synchronization` |
| `ossim-syscalls` | `syscalls` |
| `ossim-threads` | `threads` |
| `perf-autoscaling-lag` | `autoscaling-lag` |
| `perf-cache-hit-ratio` | `cache-hit-ratio` |
| `perf-game-tick-server` | `game-tick-server` |
| `perf-goodhart-teams` | `goodhart-teams` |
| `perf-littles-law` | `littles-law` |
| `perf-rate-limiting` | `rate-limiting` |
| `perf-retry-storm` | `retry-storm` |
| `perf-slo-error-budget` | `slo-error-budget` |
| `perf-tail-latency` | `tail-latency` |
| `perf-utilisation-latency` | `utilisation-latency` |
| `ref-http-status` | `http-status-codes` |
| `ref-linux-dirs` | `linux-dirs` |
| `ref-ports` | `well-known-ports` |
| `ref-protocol-headers` | `protocol-headers` |
| `sec-aaa-8021x` | `aaa-8021x` |
| `sec-buffer-overflow` | `buffer-overflow` |
| `sec-classic-ciphers` | `classic-ciphers` |
| `sec-diffie-hellman` | `diffie-hellman` |
| `sec-digital-signature` | `digital-signature` |
| `sec-dmz-matrix` | `dmz-matrix` |
| `sec-hash-properties` | `hash-properties` |
| `sec-ipsec-ike` | `ipsec-ike` |
| `sec-lateral-movement` | `lateral-movement` |
| `sec-mfa-phishing` | `mfa-phishing` |
| `sec-password-storage` | `password-storage` |
| `sec-pki-revocation` | `pki-revocation` |
| `sec-ransomware-321` | `ransomware-321` |
| `sec-sql-injection` | `sql-injection` |
| `sec-sym-vs-asym` | `sym-vs-asym` |
| `sec-wireguard` | `wireguard` |
| `sec-xss` | `xss` |
| `spl-amdahl` | `amdahl` |
| `spl-automata` | `automata` |
| `spl-comms-poster` | `comms-poster` |
| `spl-dfa-game` | `dfa-game` |
| `spl-ham-modes` | `ham-modes` |
| `spl-l2l3-protocols` | `l2l3-protocols` |
| `spl-lora-mesh` | `lora-mesh` |
| `spl-lvm-lab` | `lvm-topology` |
| `spl-multicore-mesi` | `multicore-mesi` |
| `spl-radio-networks` | `radio-networks` |
| `spl-radio-security-page` | `radio-security-page` |
| `spl-radio-security-slides` | `radio-security-slides` |
| `spl-rf-bandplan` | `rf-bandplan` |
| `spl-rowhammer` | `rowhammer` |
| `spl-spectre-meltdown` | `spectre-meltdown` |
| `spl-sram-dram` | `sram-dram` |
| `spl-stratis-lab` | `stratis-lab` |
| `spl-student-picker` | `student-picker` |
| `spl-webserver-amdahl` | `webserver-amdahl` |
| `spl-zfs-btrfs-lab` | `zfs-btrfs-lab` |
| `sto-backing-chains` | `backing-chains` |
| `sto-backup-diff-incr` | `backup-diff-incr` |
| `sto-backup-window` | `backup-window` |
| `sto-ceph-down-out` | `ceph-down-out` |
| `sto-ceph-min-size` | `ceph-min-size` |
| `sto-cow-vs-row` | `cow-vs-row` |
| `sto-crush-failure-domain` | `crush-failure-domain` |
| `sto-dedup-chunking` | `dedup-chunking` |
| `sto-dedup-file-funnel` | `dedup-file-funnel` |
| `sto-ec-vs-replication` | `ec-vs-replication` |
| `sto-iops-latency` | `iops-latency` |
| `sto-nas-vs-san` | `nas-vs-san` |
| `sto-restore-drill` | `restore-drill` |
| `sto-retention-gfs` | `retention-gfs` |
| `sto-smallest-disk-caps` | `smallest-disk-caps` |
| `sto-ssd-internals` | `ssd-internals` |
| `sto-sync-async-replication` | `sync-async-replication` |
| `sto-write-cache` | `write-cache` |
| `tool-countdown` | `countdown` |
| `tool-quick-poll` | `quick-poll` |
| `urm-firewall` | `stateful-firewall` |
| `urm-flow-control` | `flow-control` |
| `urm-hidden-node` | `hidden-node` |
| `urm-ipv6-shorten` | `ipv6-shorten` |
| `urm-layered-diagnosis` | `layered-diagnosis` |
| `urm-mac-table` | `mac-table` |
| `urm-nat` | `nat` |
| `urm-pat` | `pat` |
| `urm-routing-table` | `routing-table` |
| `urm-subnet-mask` | `subnet-mask` |
| `urm-tcp-handshake` | `tcp-handshake` |
| `urm-vlan` | `vlan` |
| `urm-vlsm` | `vlsm` |
| `urm-window` | `tcp-window` |

## Tags used by the tasks

Wave 0 task `vocabulary` added these to `tags.json`, with Croatian and English labels and search aliases
(`tests/vocabulary.test.mjs` keeps this list, the task files and `tags.json` in step):

`active-directory`, `antennas`, `arp`, `attacks`, `authentication`, `automata`, `automation`, `backup`, `bgp`, `boot`, `caches`, `circuits`, `classroom-tool`, `consensus`, `containers`, `cpu`, `cryptography`, `deduplication`, `dhcp`, `disaster-recovery`, `dns`, `email`, `emergency-comms`, `encapsulation`, `error-detection`, `ethernet`, `fault-tolerance`, `file-sharing`, `filesystems`, `firewall`, `group-policy`, `http`, `icmp`, `ip`, `ip-addressing`, `ipv6`, `kerberos`, `link-aggregation`, `logging`, `lvm`, `memory`, `modulation`, `monitoring`, `multicast`, `nat`, `number-representation`, `operating-systems`, `packages`, `parallelism`, `partitioning`, `performance`, `permissions`, `physical-layer`, `processes`, `propagation`, `qos`, `radio-networks`, `raid`, `receivers`, `replication`, `routing`, `selinux`, `services`, `shell`, `signals`, `snapshots`, `spectrum`, `ssh`, `storage-basics`, `storage-cluster`, `switching`, `tcp`, `time-sync`, `tls`, `topology`, `troubleshooting`, `udp`, `updates`, `virtualization`, `vlan`, `vpn`, `wifi`, `windows-internals`

Topics: `architecture`, `classroom`, `distributed`, `internet`, `linux-admin`, `networks`, `os`, `radio`, `security`, `storage`, `theory`, `windows-admin`.

Also in `tags.json`, used by no task yet: `scheduling`.
