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

## Wave 3: derivatives (318 tasks)

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
| 64 | [`fin-accruals-cash`](w3/fin-accruals-cash.md) | Accruals vs cash: a year of invoices | Finance basics for IT managers | M | P1 | after `fin-capex-opex` |
| 65 | [`fin-capex-opex`](w3/fin-capex-opex.md) | CapEx vs OpEx: one purchase, three views | Finance basics for IT managers | S | P1 |  |
| 66 | [`fin-cloud-commitment`](w3/fin-cloud-commitment.md) | Cloud commitment vs on-demand | Finance basics for IT managers | S | P1 |  |
| 67 | [`fin-downtime-cost`](w3/fin-downtime-cost.md) | What an hour down costs, and what a nine is worth | Finance basics for IT managers | S | P1 |  |
| 68 | [`fin-npv-discounting`](w3/fin-npv-discounting.md) | Time value of money and NPV | Finance basics for IT managers | S | P1 |  |
| 69 | [`fin-tco`](w3/fin-tco.md) | Total cost of ownership | Finance basics for IT managers | S | P1 |  |
| 70 | [`fin-ale-risk`](w3/fin-ale-risk.md) | Expected annual loss and the price of a control | Finance basics for IT managers | S | P2 |  |
| 71 | [`fin-budget-variance`](w3/fin-budget-variance.md) | Budget vs actuals: reading a variance | Finance basics for IT managers | M | P2 | after `fin-accruals-cash` |
| 72 | [`fin-chargeback`](w3/fin-chargeback.md) | Showback and chargeback | Finance basics for IT managers | M | P2 | after `fin-fixed-variable` |
| 73 | [`fin-contingency-reserve`](w3/fin-contingency-reserve.md) | Contingency reserve: P50 vs P80 | Finance basics for IT managers | M | P2 |  |
| 74 | [`fin-depreciation`](w3/fin-depreciation.md) | Depreciation and book value | Finance basics for IT managers | S | P2 | after `fin-capex-opex` |
| 75 | [`fin-fixed-variable`](w3/fin-fixed-variable.md) | Fixed, variable and step costs; break-even | Finance basics for IT managers | S | P2 |  |
| 76 | [`fin-lease-vs-buy`](w3/fin-lease-vs-buy.md) | Lease vs buy | Finance basics for IT managers | M | P2 | after `fin-npv-discounting` |
| 77 | [`fin-licence-models`](w3/fin-licence-models.md) | Perpetual licence or subscription | Finance basics for IT managers | S | P2 | after `fin-capex-opex` |
| 78 | [`fin-prepay-discount`](w3/fin-prepay-discount.md) | Pay upfront for a discount? | Finance basics for IT managers | S | P2 | after `fin-npv-discounting` |
| 79 | [`fin-refresh-cycle`](w3/fin-refresh-cycle.md) | Refresh cycles and economic life | Finance basics for IT managers | M | P2 | after `fin-depreciation` |
| 80 | [`fin-roi-payback-npv`](w3/fin-roi-payback-npv.md) | ROI, payback and NPV disagree | Finance basics for IT managers | S | P2 | after `fin-npv-discounting` |
| 81 | [`fin-sunk-cost`](w3/fin-sunk-cost.md) | Sunk cost: decide looking forward | Finance basics for IT managers | S | P2 | after `fin-depreciation` |
| 82 | [`fin-cost-of-delay`](w3/fin-cost-of-delay.md) | Cost of delay: which project first | Finance basics for IT managers | S | P3 |  |
| 83 | [`fin-indexation-fx`](w3/fin-indexation-fx.md) | Inflation, indexation and currency in a multi-year contract | Finance basics for IT managers | S | P3 |  |
| 84 | [`cmp-audit-sampling`](w3/cmp-audit-sampling.md) | Audit sampling: how many tickets to check | Compliance and procedures for IT managers | S | P1 | after `cmp-policy-to-record` |
| 85 | [`cmp-change-risk-class`](w3/cmp-change-risk-class.md) | Change management: risk classes or one board for everything | Compliance and procedures for IT managers | M | P1 |  |
| 86 | [`cmp-incident-clocks`](w3/cmp-incident-clocks.md) | Incident reporting clocks: 24 hours, 72 hours, one month | Compliance and procedures for IT managers | M | P1 |  |
| 87 | [`cmp-jml-drift`](w3/cmp-jml-drift.md) | Joiner, mover, leaver: how access piles up | Compliance and procedures for IT managers | M | P1 |  |
| 88 | [`cmp-policy-to-record`](w3/cmp-policy-to-record.md) | Policy, standard, procedure, record: the trail an auditor walks | Compliance and procedures for IT managers | M | P1 |  |
| 89 | [`cmp-risk-register`](w3/cmp-risk-register.md) | Risk register: likelihood × impact, treatment and residual risk | Compliance and procedures for IT managers | S | P1 |  |
| 90 | [`cmp-bia`](w3/cmp-bia.md) | Business impact analysis: what must come back first | Compliance and procedures for IT managers | M | P2 |  |
| 91 | [`cmp-breach-triage`](w3/cmp-breach-triage.md) | Personal-data breach: record, notify, inform | Compliance and procedures for IT managers | S | P2 | after `cmp-incident-clocks` |
| 92 | [`cmp-data-subject-request`](w3/cmp-data-subject-request.md) | A data subject's request: find every copy within a month | Compliance and procedures for IT managers | M | P2 | after `cmp-retention-hold` |
| 93 | [`cmp-dpia-triage`](w3/cmp-dpia-triage.md) | Does this project need a data protection impact assessment? | Compliance and procedures for IT managers | S | P2 | after `cmp-risk-register` |
| 94 | [`cmp-log-evidence`](w3/cmp-log-evidence.md) | Logs as evidence: complete, in time, out of reach | Compliance and procedures for IT managers | M | P2 |  |
| 95 | [`cmp-nis2-scope`](w3/cmp-nis2-scope.md) | In scope? Essential and important entities | Compliance and procedures for IT managers | S | P2 |  |
| 96 | [`cmp-patch-sla`](w3/cmp-patch-sla.md) | Vulnerability fix deadlines: the average and the tail | Compliance and procedures for IT managers | S | P2 |  |
| 97 | [`cmp-privileged-access`](w3/cmp-privileged-access.md) | Standing admin rights or just in time; the break-glass account | Compliance and procedures for IT managers | S | P2 | after `cmp-jml-drift` |
| 98 | [`cmp-restore-evidence`](w3/cmp-restore-evidence.md) | Restore tests as evidence: covering the estate in a year | Compliance and procedures for IT managers | S | P2 | after `cmp-policy-to-record` |
| 99 | [`cmp-retention-hold`](w3/cmp-retention-hold.md) | Retention periods and the legal hold | Compliance and procedures for IT managers | S | P2 |  |
| 100 | [`cmp-shared-responsibility`](w3/cmp-shared-responsibility.md) | Shared responsibility: who runs which control in the cloud | Compliance and procedures for IT managers | S | P2 |  |
| 101 | [`cmp-sod-toxic`](w3/cmp-sod-toxic.md) | Segregation of duties: toxic combinations | Compliance and procedures for IT managers | S | P2 | after `cmp-jml-drift` |
| 102 | [`cmp-vendor-tiers`](w3/cmp-vendor-tiers.md) | Supplier risk: tiers and how deep to check | Compliance and procedures for IT managers | M | P2 | after `cmp-risk-register` |
| 103 | [`cmp-cost-of-noncompliance`](w3/cmp-cost-of-noncompliance.md) | The price of non-compliance and the price of controls | Compliance and procedures for IT managers | S | P3 | after `fin-ale-risk` |
| 104 | [`cmp-exceptions`](w3/cmp-exceptions.md) | Exceptions to policy: an accepted risk with an end date | Compliance and procedures for IT managers | S | P3 | after `cmp-risk-register` |
| 105 | [`cmp-four-eyes`](w3/cmp-four-eyes.md) | Four eyes: when the second approver is a rubber stamp | Compliance and procedures for IT managers | S | P3 |  |
| 106 | [`cmp-maturity-levels`](w3/cmp-maturity-levels.md) | Maturity levels: the average hides the weakest area | Compliance and procedures for IT managers | S | P3 |  |
| 107 | [`set-cable-runs-exits`](w3/set-cable-runs-exits.md) | Cable runs, walkways and exits: evacuating the set | Working on a film set | M | P1 |  |
| 108 | [`set-circuit-load`](w3/set-circuit-load.md) | Watts, volts, amps: why a circuit trips and a cable heats | Working on a film set | S | P1 |  |
| 109 | [`set-exclusion-zone`](w3/set-exclusion-zone.md) | Stunts, effects, weapons: the zone only specialists enter | Working on a film set | M | P1 | after `set-cable-runs-exits` |
| 110 | [`set-fatigue-turnaround`](w3/set-fatigue-turnaround.md) | Long days, short nights: turnaround and the drive home | Working on a film set | S | P1 |  |
| 111 | [`set-stand-tipping`](w3/set-stand-tipping.md) | Stands, sandbags and wind: when a stand tips | Working on a film set | M | P1 |  |
| 112 | [`set-stop-for-safety`](w3/set-stop-for-safety.md) | Anyone can stop for safety: from seeing a hazard to the halt | Working on a film set | M | P1 |  |
| 113 | [`set-call-sheet`](w3/set-call-sheet.md) | The call sheet: a day's plan and what one change moves | Working on a film set | M | P2 |  |
| 114 | [`set-calls-sequence`](w3/set-calls-sequence.md) | The calls: from "lock it up" to "moving on" | Working on a film set | M | P2 |  |
| 115 | [`set-card-handoff`](w3/set-card-handoff.md) | Camera cards: never wiped before two checked copies | Working on a film set | S | P2 |  |
| 116 | [`set-chain-of-command`](w3/set-chain-of-command.md) | Who decides what: the chain of command on set | Working on a film set | S | P2 | after `set-stop-for-safety` |
| 117 | [`set-emergency-response`](w3/set-emergency-response.md) | An injury on set: the first ten minutes | Working on a film set | S | P2 | after `set-cable-runs-exits` |
| 118 | [`set-lamp-heat`](w3/set-lamp-heat.md) | Hot lamps: burns, fire distance and the cool-down | Working on a film set | S | P2 |  |
| 119 | [`set-radio-discipline`](w3/set-radio-discipline.md) | Radio discipline: one channel, many voices | Working on a film set | S | P2 |  |
| 120 | [`set-risk-controls`](w3/set-risk-controls.md) | Remove the hazard first: the order of controls | Working on a film set | S | P2 |  |
| 121 | [`set-setup-cycle`](w3/set-setup-cycle.md) | Block, light, rehearse, shoot: the order of a setup | Working on a film set | M | P2 |  |
| 122 | [`set-who-touches-what`](w3/set-who-touches-what.md) | Departments: who touches what | Working on a film set | S | P2 | after `set-stop-for-safety` |
| 123 | [`set-working-at-height`](w3/set-working-at-height.md) | Working above others: dropped objects and the zone below | Working on a film set | S | P2 | after `set-cable-runs-exits` |
| 124 | [`set-boom-shadow`](w3/set-boom-shadow.md) | Boom, frame line and lamp: sound, camera and electric meet | Working on a film set | S | P3 |  |
| 125 | [`set-continuity`](w3/set-continuity.md) | Continuity: shooting out of story order | Working on a film set | S | P3 | after `set-call-sheet` |
| 126 | [`set-hearing`](w3/set-hearing.md) | Noise over a shooting day: the dose adds up | Working on a film set | S | P3 | after `set-call-sheet` |
| 127 | [`set-manual-handling`](w3/set-manual-handling.md) | Lifting and team carries | Working on a film set | S | P3 | after `set-stand-tipping` |
| 128 | [`set-phase-balance`](w3/set-phase-balance.md) | Three phases: spreading the lamps on a generator | Working on a film set | S | P3 | after `set-circuit-load` |
| 129 | [`set-picture-vehicles`](w3/set-picture-vehicles.md) | Picture vehicles and camera cars: stopping distance | Working on a film set | S | P3 | after `set-exclusion-zone` |
| 130 | [`set-weather-lightning`](w3/set-weather-lightning.md) | Weather limits: wind and lightning | Working on a film set | S | P3 |  |
| 131 | [`set-working-load`](w3/set-working-load.md) | Working loads and safety factors in rigging | Working on a film set | S | P3 | after `set-stand-tipping` |
| 132 | [`accelerated-charge`](w3/accelerated-charge.md) | Why an accelerated charge radiates: field lines that kink | Antennas and radiation | M | P1 |  |
| 133 | [`dipole-field`](w3/dipole-field.md) | The oscillating dipole: near field, far field, and loops that break away | Antennas and radiation | L | P1 | after `accelerated-charge` |
| 134 | [`dipole-length`](w3/dipole-length.md) | Dipole length: current, pattern and radiation resistance | Antennas and radiation | M | P1 |  |
| 135 | [`polarization`](w3/polarization.md) | Polarization: the wave carries the antenna's direction | Antennas and radiation | M | P1 |  |
| 136 | [`polarization-mismatch`](w3/polarization-mismatch.md) | Different antennas at each end: polarization loss | Antennas and radiation | L | P1 | after `polarization` |
| 137 | [`antenna-array`](w3/antenna-array.md) | Two antennas together: spacing, phase and steering the beam | Antennas and radiation | M | P2 | after `dipole-length` |
| 138 | [`gain-directivity`](w3/gain-directivity.md) | Gain and directivity: dBi, dBd, ERP and EIRP | Antennas and radiation | M | P2 | after `dipole-length` |
| 139 | [`ground-image`](w3/ground-image.md) | An antenna above ground: the image and the angle of radiation | Antennas and radiation | M | P2 | after `antenna-array` |
| 140 | [`link-budget`](w3/link-budget.md) | From transmitter to receiver: the link budget | Antennas and radiation | M | P2 | after `gain-directivity` |
| 141 | [`near-field-coupling`](w3/near-field-coupling.md) | Near-field coupling: induction without radiation | Antennas and radiation | S | P3 | after `dipole-field` |
| 142 | [`small-antenna`](w3/small-antenna.md) | Short antennas: radiation resistance, losses and bandwidth | Antennas and radiation | M | P3 | after `dipole-length` |
| 143 | [`yagi`](w3/yagi.md) | The Yagi: a reflector, directors, and parasitic currents | Antennas and radiation | L | P3 | after `antenna-array` |
| 144 | [`dns-ttl-cache`](w3/dns-ttl-cache.md) | TTL caching and the cutover | Internet and application protocols | S | P1 | after `dns-resolution` |
| 145 | [`email-auth`](w3/email-auth.md) | SPF, DKIM and DMARC | Internet and application protocols | M | P1 | after `email-path` |
| 146 | [`bgp-hijack`](w3/bgp-hijack.md) | BGP hijack and RPKI | Internet and application protocols | M | P2 | after `bgp-path-selection` |
| 147 | [`cdn-anycast`](w3/cdn-anycast.md) | Anycast and CDN edges | Internet and application protocols | S | P2 | after `bgp-path-selection` |
| 148 | [`ddos-amplification`](w3/ddos-amplification.md) | DRDoS amplification | Internet and application protocols | S | P2 |  |
| 149 | [`dns-secondary-expiry`](w3/dns-secondary-expiry.md) | A secondary is a cache with a timer | Internet and application protocols | S | P2 | after `dns-records` |
| 150 | [`http-caching`](w3/http-caching.md) | HTTP caching | Internet and application protocols | S | P2 | after `http-exchange` |
| 151 | [`http-versions`](w3/http-versions.md) | HTTP/1.1 vs HTTP/2 vs HTTP/3 | Internet and application protocols | M | P2 | after `http-exchange` |
| 152 | [`reverse-proxy-lb`](w3/reverse-proxy-lb.md) | Reverse proxy and load balancing | Internet and application protocols | M | P2 | after `http-exchange` |
| 153 | [`ssh-tunnels`](w3/ssh-tunnels.md) | SSH port forwarding | Internet and application protocols | S | P2 | after `ssh-key-auth` |
| 154 | [`acme-renewal`](w3/acme-renewal.md) | ACME certificate renewal | Internet and application protocols | S | P3 | preset on `cert-chain` |
| 155 | [`cookies-sessions`](w3/cookies-sessions.md) | Cookies and sessions | Internet and application protocols | S | P3 | after `http-exchange` |
| 156 | [`cors`](w3/cors.md) | Same origin and CORS | Internet and application protocols | S | P3 | after `http-exchange` |
| 157 | [`dns-poisoning`](w3/dns-poisoning.md) | DNS cache poisoning | Internet and application protocols | M | P3 | after `dns-resolution` |
| 158 | [`dns-split-brain`](w3/dns-split-brain.md) | Two primaries are two zones | Internet and application protocols | S | P3 | preset on `dns-secondary-expiry` |
| 159 | [`dnssec-chain`](w3/dnssec-chain.md) | DNSSEC chain of trust | Internet and application protocols | M | P3 | after `dns-resolution` |
| 160 | [`ftp-active-passive`](w3/ftp-active-passive.md) | Active vs passive FTP | Internet and application protocols | S | P3 | after `nat` |
| 161 | [`oauth-flow`](w3/oauth-flow.md) | OAuth 2.0 / OIDC authorization code flow | Internet and application protocols | M | P3 | after `http-exchange` |
| 162 | [`peering-transit`](w3/peering-transit.md) | Transit vs peering | Internet and application protocols | S | P3 | after `bgp-path-selection` |
| 163 | [`smtp-dialogue`](w3/smtp-dialogue.md) | An SMTP session | Internet and application protocols | S | P3 | after `email-path` |
| 164 | [`websocket`](w3/websocket.md) | WebSocket upgrade | Internet and application protocols | S | P3 | after `http-exchange` |
| 165 | [`aaa-8021x`](w3/aaa-8021x.md) | AAA and 802.1X | Security and cryptography | M | P2 |  |
| 166 | [`dmz-matrix`](w3/dmz-matrix.md) | DMZ rule matrix | Security and cryptography | S | P2 | after `stateful-firewall` |
| 167 | [`lateral-movement`](w3/lateral-movement.md) | Lateral movement and tiering | Security and cryptography | M | P2 | after `win-ntlm-vs-kerberos` |
| 168 | [`password-storage`](w3/password-storage.md) | Storing passwords | Security and cryptography | S | P2 | after `hash-properties` |
| 169 | [`ransomware-321`](w3/ransomware-321.md) | 3-2-1 and immutable copies vs ransomware | Security and cryptography | S | P2 | after `backup-diff-incr` |
| 170 | [`sql-injection`](w3/sql-injection.md) | SQL injection | Security and cryptography | S | P2 |  |
| 171 | [`wireguard`](w3/wireguard.md) | WireGuard | Security and cryptography | M | P2 | after `diffie-hellman` |
| 172 | [`buffer-overflow`](w3/buffer-overflow.md) | Stack buffer overflow | Security and cryptography | M | P3 |  |
| 173 | [`classic-ciphers`](w3/classic-ciphers.md) | Caesar and Vigenère | Security and cryptography | S | P3 |  |
| 174 | [`ipsec-ike`](w3/ipsec-ike.md) | IPsec and IKE | Security and cryptography | M | P3 | after `diffie-hellman` |
| 175 | [`mfa-phishing`](w3/mfa-phishing.md) | MFA fatigue and adversary-in-the-middle | Security and cryptography | S | P3 |  |
| 176 | [`pki-revocation`](w3/pki-revocation.md) | Revocation: CRL vs OCSP | Security and cryptography | S | P3 | preset on `cert-chain` |
| 177 | [`xss`](w3/xss.md) | Cross-site scripting | Security and cryptography | S | P3 | after `http-exchange` |
| 178 | [`lnx-access-decision`](w3/lnx-access-decision.md) | The access decision | Linux | S | P2 | after `lnx-permissions-rwx` |
| 179 | [`lnx-alert-states`](w3/lnx-alert-states.md) | Alert states: pending and firing | Linux | S | P2 |  |
| 180 | [`lnx-ansible-idempotence`](w3/lnx-ansible-idempotence.md) | Idempotence | Linux | S | P2 |  |
| 181 | [`lnx-cgroups`](w3/lnx-cgroups.md) | cgroups limits | Linux | S | P2 | after `lnx-namespaces` |
| 182 | [`lnx-container-ports`](w3/lnx-container-ports.md) | Publishing a container port | Linux | S | P2 | preset on `port-forwarding` |
| 183 | [`lnx-container-volumes`](w3/lnx-container-volumes.md) | Where container data is lost | Linux | S | P2 | after `lnx-overlayfs-layers` |
| 184 | [`lnx-deploy-strategies`](w3/lnx-deploy-strategies.md) | Blue-green, canary, rolling | Linux | M | P2 |  |
| 185 | [`lnx-disk-full-mysteries`](w3/lnx-disk-full-mysteries.md) | "Disk full" with free space | Linux | S | P2 | after `lnx-links-inodes` |
| 186 | [`lnx-exit-status`](w3/lnx-exit-status.md) | Exit status and &&, ||, set -e, pipefail | Linux | S | P2 | after `lnx-pipes-redirection` |
| 187 | [`lnx-firewalld-zones`](w3/lnx-firewalld-zones.md) | firewalld zones | Linux | S | P2 | after `lnx-netfilter-path` |
| 188 | [`lnx-live-migration`](w3/lnx-live-migration.md) | Live migration | Linux | M | P2 |  |
| 189 | [`lnx-load-average`](w3/lnx-load-average.md) | Load average | Linux | S | P2 |  |
| 190 | [`lnx-lvm-snapshot`](w3/lnx-lvm-snapshot.md) | LVM snapshot filling up | Linux | S | P2 | after `lnx-lvm-extend` |
| 191 | [`lnx-memory-swap-oom`](w3/lnx-memory-swap-oom.md) | Memory, swap and the OOM killer | Linux | S | P2 |  |
| 192 | [`lnx-mirror-not-backup`](w3/lnx-mirror-not-backup.md) | A mirror is not a backup | Linux | S | P2 |  |
| 193 | [`lnx-netns-veth-bridge`](w3/lnx-netns-veth-bridge.md) | Namespaces, veth and a bridge | Linux | M | P2 | after `lnx-namespaces` |
| 194 | [`lnx-page-cache`](w3/lnx-page-cache.md) | free vs available | Linux | S | P2 |  |
| 195 | [`lnx-pam-stack`](w3/lnx-pam-stack.md) | The PAM stack | Linux | S | P2 |  |
| 196 | [`lnx-raid-rebuild`](w3/lnx-raid-rebuild.md) | Rebuild under load and the second failure | Linux | S | P2 |  |
| 197 | [`lnx-regex-match`](w3/lnx-regex-match.md) | How a regex matches | Linux | M | P2 |  |
| 198 | [`lnx-rsync-delete`](w3/lnx-rsync-delete.md) | rsync, trailing slashes and --delete | Linux | S | P2 |  |
| 199 | [`lnx-signals`](w3/lnx-signals.md) | Signals | Linux | S | P2 |  |
| 200 | [`lnx-terraform-drift`](w3/lnx-terraform-drift.md) | Infrastructure as code: state and drift | Linux | S | P2 |  |
| 201 | [`lnx-thin-overcommit`](w3/lnx-thin-overcommit.md) | Thin provisioning and overcommit | Linux | S | P2 | after `lnx-lvm-extend` |
| 202 | [`lnx-zfs-self-heal`](w3/lnx-zfs-self-heal.md) | Checksums and self-healing | Linux | S | P2 | after `lnx-cow-filesystem` |
| 203 | [`lnx-bonding-modes`](w3/lnx-bonding-modes.md) | Bonding modes | Linux | S | P3 | after `link-aggregation` |
| 204 | [`lnx-hypervisor-types`](w3/lnx-hypervisor-types.md) | Type 1 vs type 2, containers vs VMs | Linux | S | P3 |  |
| 205 | [`lnx-job-control`](w3/lnx-job-control.md) | Job control | Linux | S | P3 | after `lnx-signals` |
| 206 | [`lnx-logrotate`](w3/lnx-logrotate.md) | logrotate | Linux | S | P3 | after `lnx-log-path` |
| 207 | [`lnx-multipath`](w3/lnx-multipath.md) | Multipath I/O | Linux | S | P3 |  |
| 208 | [`lnx-nfs-root-squash`](w3/lnx-nfs-root-squash.md) | NFS and root squash | Linux | S | P3 | after `lnx-permissions-rwx` |
| 209 | [`lnx-package-deps`](w3/lnx-package-deps.md) | Package dependency resolution | Linux | S | P3 |  |
| 210 | [`disk-partitioning`](w3/disk-partitioning.md) | MBR vs GPT | Linux | S | P3 | after `lnx-mount-layers` |
| 211 | [`lnx-policy-routing`](w3/lnx-policy-routing.md) | Policy routing | Linux | S | P3 | after `lnx-routing-decision` |
| 212 | [`lnx-quotas`](w3/lnx-quotas.md) | Disk quotas | Linux | S | P3 |  |
| 213 | [`lnx-send-receive`](w3/lnx-send-receive.md) | Btrfs/ZFS send and receive | Linux | S | P3 | preset on `backup-diff-incr` |
| 214 | [`lnx-special-bits`](w3/lnx-special-bits.md) | setuid, setgid and sticky | Linux | S | P3 | after `lnx-permissions-rwx` |
| 215 | [`lnx-subshell-trap`](w3/lnx-subshell-trap.md) | Subshells and traps | Linux | S | P3 | after `lnx-shell-quoting` |
| 216 | [`lnx-timers-cron`](w3/lnx-timers-cron.md) | cron vs systemd timers | Linux | S | P3 | after `lnx-systemd-ordering` |
| 217 | [`lnx-userns-mapping`](w3/lnx-userns-mapping.md) | Rootless containers | Linux | S | P3 | after `lnx-namespaces` |
| 218 | [`win-ad-backup-restore`](w3/win-ad-backup-restore.md) | Restoring a DC, and USN rollback | Active Directory | M | P2 | after `win-ad-replication` |
| 219 | [`win-ad-recycle-bin`](w3/win-ad-recycle-bin.md) | Deleted objects: tombstone and recycle bin | Active Directory | S | P2 | after `win-ad-replication` |
| 220 | [`win-ad-sites`](w3/win-ad-sites.md) | Sites, site links and the KCC | Active Directory | M | P2 | after `win-ad-replication` |
| 221 | [`win-fgpp`](w3/win-fgpp.md) | Password policy and fine-grained policies | Active Directory | S | P2 | after `win-gpo-precedence` |
| 222 | [`win-fsmo-roles`](w3/win-fsmo-roles.md) | FSMO roles | Active Directory | S | P2 | after `win-ad-structure` |
| 223 | [`win-ntlm-vs-kerberos`](w3/win-ntlm-vs-kerberos.md) | NTLM vs Kerberos | Active Directory | S | P2 | after `win-kerberos` |
| 224 | [`win-ou-vs-group`](w3/win-ou-vs-group.md) | OU or group? | Active Directory | S | P2 | after `win-ad-structure` |
| 225 | [`win-sysvol-dfsr`](w3/win-sysvol-dfsr.md) | SYSVOL replication | Active Directory | S | P2 | after `win-ad-replication` |
| 226 | [`win-time-hierarchy`](w3/win-time-hierarchy.md) | Time in a domain | Active Directory | S | P2 | after `win-kerberos` |
| 227 | [`win-account-lockout`](w3/win-account-lockout.md) | Account lockout | Active Directory | S | P3 | after `win-domain-logon` |
| 228 | [`win-delegation`](w3/win-delegation.md) | Delegation of control | Active Directory | S | P3 | after `win-ad-structure` |
| 229 | [`win-functional-levels`](w3/win-functional-levels.md) | Functional levels | Active Directory | S | P3 | after `win-ad-structure` |
| 230 | [`win-rodc`](w3/win-rodc.md) | Read-only DC at a branch | Active Directory | S | P3 | after `win-ad-sites` |
| 231 | [`win-trusts`](w3/win-trusts.md) | Trusts | Active Directory | M | P3 | after `win-kerberos` |
| 232 | [`win-gpo-security-filtering`](w3/win-gpo-security-filtering.md) | Security and WMI filtering | Group Policy | S | P2 | after `win-gpo-precedence` |
| 233 | [`win-gpo-tattooing`](w3/win-gpo-tattooing.md) | Policies vs preferences | Group Policy | S | P2 | after `win-gpo-processing` |
| 234 | [`win-admx-store`](w3/win-admx-store.md) | ADMX and the central store | Group Policy | S | P3 | after `win-gpo-precedence` |
| 235 | [`win-gpo-loopback`](w3/win-gpo-loopback.md) | Loopback processing | Group Policy | S | P3 | after `win-gpo-precedence` |
| 236 | [`win-gpo-slow-link`](w3/win-gpo-slow-link.md) | Slow links | Group Policy | S | P3 | after `win-gpo-processing` |
| 237 | [`win-gpo-software-install`](w3/win-gpo-software-install.md) | Software installation | Group Policy | S | P3 | after `win-gpo-processing` |
| 238 | [`win-gpo-targeting`](w3/win-gpo-targeting.md) | Item-level targeting | Group Policy | S | P3 | after `win-gpo-tattooing` |
| 239 | [`win-dns-scavenging`](w3/win-dns-scavenging.md) | Aging and scavenging | DNS on Windows Server | S | P1 | after `win-dns-dynamic-update` |
| 240 | [`win-dns-client-order`](w3/win-dns-client-order.md) | How a Windows client resolves a name | DNS on Windows Server | S | P2 | after `dns-resolution` |
| 241 | [`win-dns-forwarders`](w3/win-dns-forwarders.md) | Forwarders, conditional forwarders, root hints | DNS on Windows Server | S | P2 | after `dns-resolution` |
| 242 | [`win-dns-policies`](w3/win-dns-policies.md) | DNS policies and zone scopes | DNS on Windows Server | S | P3 | after `win-dns-zone-types` |
| 243 | [`win-dhcp-dns-update`](w3/win-dhcp-dns-update.md) | DHCP updating DNS for clients | DHCP on Windows Server | S | P2 | after `win-dns-dynamic-update` |
| 244 | [`win-dhcp-failover`](w3/win-dhcp-failover.md) | DHCP failover | DHCP on Windows Server | S | P2 | after `win-dhcp-scope-options` |
| 245 | [`win-dhcp-authorization`](w3/win-dhcp-authorization.md) | Authorizing a DHCP server | DHCP on Windows Server | S | P3 | after `dhcp-dora` |
| 246 | [`win-dhcp-policies`](w3/win-dhcp-policies.md) | Policy-based assignment | DHCP on Windows Server | S | P3 | after `win-dhcp-scope-options` |
| 247 | [`win-dhcp-superscope`](w3/win-dhcp-superscope.md) | Superscopes | DHCP on Windows Server | S | P3 | after `win-dhcp-scope-options` |
| 248 | [`win-ipam-audit`](w3/win-ipam-audit.md) | Who had this IP at 14:32? | IPAM | S | P2 | after `win-ipam-address-plan` |
| 249 | [`win-ipam-utilisation`](w3/win-ipam-utilisation.md) | Utilisation and thresholds | IPAM | S | P2 | after `win-ipam-address-plan` |
| 250 | [`win-ipam-discovery`](w3/win-ipam-discovery.md) | IPAM discovery and provisioning | IPAM | S | P3 | after `win-ipam-address-plan` |
| 251 | [`win-ipam-reconcile`](w3/win-ipam-reconcile.md) | IPAM vs reality | IPAM | S | P3 | after `win-ipam-address-plan` |
| 252 | [`win-update-rings`](w3/win-update-rings.md) | Update rings | WSUS and updates | S | P2 | preset on `win-wsus-groups` |
| 253 | [`win-wsus-client-cycle`](w3/win-wsus-client-cycle.md) | The client update cycle | WSUS and updates | S | P2 | after `win-wsus-flow` |
| 254 | [`win-wsus-cloned-id`](w3/win-wsus-cloned-id.md) | Clients that never report | WSUS and updates | S | P2 | after `win-wsus-flow` |
| 255 | [`win-wsus-groups`](w3/win-wsus-groups.md) | Computer groups and approvals | WSUS and updates | S | P2 | after `win-wsus-flow` |
| 256 | [`win-wsus-delivery`](w3/win-wsus-delivery.md) | Delivering updates over a WAN | WSUS and updates | S | P3 | after `win-wsus-flow` |
| 257 | [`win-wsus-supersedence`](w3/win-wsus-supersedence.md) | Superseded updates and cleanup | WSUS and updates | S | P3 | after `win-wsus-flow` |
| 258 | [`win-boot`](w3/win-boot.md) | Windows boot chain | Files, identity and the rest | S | P2 | preset on `lnx-boot-chain` |
| 259 | [`win-failover-cluster`](w3/win-failover-cluster.md) | Failover cluster quorum | Files, identity and the rest | S | P2 | preset on `quorum-split-brain` |
| 260 | [`win-ntfs-inheritance`](w3/win-ntfs-inheritance.md) | NTFS inheritance | Files, identity and the rest | S | P2 | after `win-ntfs-share-effective` |
| 261 | [`win-powershell-objects`](w3/win-powershell-objects.md) | PowerShell pipes objects, bash pipes text | Files, identity and the rest | S | P2 | after `lnx-pipes-redirection` |
| 262 | [`win-uac`](w3/win-uac.md) | UAC and the split token | Files, identity and the rest | S | P2 | after `win-access-token` |
| 263 | [`win-vss`](w3/win-vss.md) | Volume Shadow Copy | Files, identity and the rest | S | P2 | preset on `lnx-cow-filesystem` |
| 264 | [`win-bitlocker-tpm`](w3/win-bitlocker-tpm.md) | BitLocker and the TPM | Files, identity and the rest | S | P3 | after `lnx-boot-chain` |
| 265 | [`win-dfs`](w3/win-dfs.md) | DFS namespace and replication | Files, identity and the rest | M | P3 | after `dns-resolution` |
| 266 | [`win-firewall-profiles`](w3/win-firewall-profiles.md) | Windows Firewall profiles | Files, identity and the rest | S | P3 | preset on `lnx-firewalld-zones` |
| 267 | [`win-hyperv-checkpoints`](w3/win-hyperv-checkpoints.md) | Hyper-V checkpoints | Files, identity and the rest | S | P3 | preset on `backing-chains` |
| 268 | [`win-laps`](w3/win-laps.md) | LAPS | Files, identity and the rest | S | P3 | after `lateral-movement` |
| 269 | [`win-ntfs-mft`](w3/win-ntfs-mft.md) | NTFS MFT | Files, identity and the rest | S | P3 |  |
| 270 | [`win-registry`](w3/win-registry.md) | The registry | Files, identity and the rest | S | P3 |  |
| 271 | [`win-services`](w3/win-services.md) | Services and dependencies | Files, identity and the rest | S | P3 | preset on `lnx-systemd-ordering` |
| 272 | [`win-smb-session`](w3/win-smb-session.md) | An SMB session | Files, identity and the rest | S | P3 | after `win-kerberos` |
| 273 | [`win-storage-spaces`](w3/win-storage-spaces.md) | Storage Spaces | Files, identity and the rest | S | P3 |  |
| 274 | [`backup-window`](w3/backup-window.md) | Backup window and offsite seeding | Storage, backup and disaster recovery | S | P2 | after `backup-diff-incr` |
| 275 | [`ceph-down-out`](w3/ceph-down-out.md) | down vs out | Storage, backup and disaster recovery | S | P2 | after `ceph-min-size` |
| 276 | [`ceph-min-size`](w3/ceph-min-size.md) | size and min_size | Storage, backup and disaster recovery | S | P2 | after `quorum-split-brain` |
| 277 | [`crush-failure-domain`](w3/crush-failure-domain.md) | Failure domain in a placement rule | Storage, backup and disaster recovery | S | P2 | after `ceph-min-size` |
| 278 | [`ec-vs-replication`](w3/ec-vs-replication.md) | Erasure coding vs replication | Storage, backup and disaster recovery | S | P2 |  |
| 279 | [`iops-latency`](w3/iops-latency.md) | IOPS, throughput and latency | Storage, backup and disaster recovery | S | P2 | after `utilisation-latency` |
| 280 | [`restore-drill`](w3/restore-drill.md) | The backup that lies | Storage, backup and disaster recovery | S | P2 | after `backup-diff-incr` |
| 281 | [`retention-gfs`](w3/retention-gfs.md) | Retention: grandfather-father-son | Storage, backup and disaster recovery | S | P2 | after `backup-diff-incr` |
| 282 | [`smallest-disk-caps`](w3/smallest-disk-caps.md) | One small or full disk caps the pool | Storage, backup and disaster recovery | S | P2 | after `ceph-min-size` |
| 283 | [`ssd-internals`](w3/ssd-internals.md) | Inside an SSD | Storage, backup and disaster recovery | M | P2 |  |
| 284 | [`sync-async-replication`](w3/sync-async-replication.md) | Synchronous vs asynchronous replication | Storage, backup and disaster recovery | S | P2 | preset on `db-replication` |
| 285 | [`write-cache`](w3/write-cache.md) | Write-back vs write-through | Storage, backup and disaster recovery | S | P2 |  |
| 286 | [`alert-to-nobody`](w3/alert-to-nobody.md) | The alert that reaches nobody | Storage, backup and disaster recovery | S | P3 |  |
| 287 | [`correlated-failure`](w3/correlated-failure.md) | One power strip under three replicas | Storage, backup and disaster recovery | S | P3 | preset on `faultline` |
| 288 | [`site-failover`](w3/site-failover.md) | Site failover | Storage, backup and disaster recovery | M | P3 | after `rpo-rto` |
| 289 | [`cow-vs-row`](w3/cow-vs-row.md) | Copy-on-write vs redirect-on-write | Storage, backup and disaster recovery | S | P3 | preset on `lnx-cow-filesystem` |
| 290 | [`dedup-file-funnel`](w3/dedup-file-funnel.md) | Finding duplicate files | Storage, backup and disaster recovery | S | P3 | after `dedup-chunking` |
| 291 | [`nas-vs-san`](w3/nas-vs-san.md) | File vs block storage | Storage, backup and disaster recovery | S | P3 |  |
| 292 | [`cap-under-partition`](w3/cap-under-partition.md) | CAP under partition | High availability and distributed systems | S | P2 | after `db-replication` |
| 293 | [`cluster-membership`](w3/cluster-membership.md) | Who is still in the cluster: heartbeats and the token timeout | High availability and distributed systems | S | P2 |  |
| 294 | [`consistent-hashing`](w3/consistent-hashing.md) | Consistent hashing | High availability and distributed systems | S | P2 |  |
| 295 | [`fencing`](w3/fencing.md) | Fencing (STONITH) | High availability and distributed systems | S | P2 | preset on `quorum-split-brain` |
| 296 | [`raft`](w3/raft.md) | Raft leader election and log replication | High availability and distributed systems | M | P2 | after `quorum-split-brain` |
| 297 | [`resource-placement`](w3/resource-placement.md) | Where cluster resources run: location, colocation, order and stickiness | High availability and distributed systems | S | P2 |  |
| 298 | [`vrrp-failover`](w3/vrrp-failover.md) | VRRP failover | High availability and distributed systems | S | P2 | after `arp-local-remote` |
| 299 | [`lamport-clocks`](w3/lamport-clocks.md) | Logical clocks | High availability and distributed systems | M | P3 |  |
| 300 | [`never-zero-spof`](w3/never-zero-spof.md) | No system has zero SPOFs | High availability and distributed systems | S | P3 | preset on `faultline` |
| 301 | [`two-phase-commit`](w3/two-phase-commit.md) | Two-phase commit | High availability and distributed systems | S | P3 |  |
| 302 | [`littles-law`](w3/littles-law.md) | Little's law | Performance and capacity | S | P2 | after `utilisation-latency` |
| 303 | [`rate-limiting`](w3/rate-limiting.md) | Token bucket vs leaky bucket | Performance and capacity | S | P2 |  |
| 304 | [`retry-storm`](w3/retry-storm.md) | Retry storms and metastable collapse | Performance and capacity | S | P2 | after `utilisation-latency` |
| 305 | [`slo-error-budget`](w3/slo-error-budget.md) | SLOs and error budgets | Performance and capacity | S | P2 |  |
| 306 | [`tail-latency`](w3/tail-latency.md) | Tail latency and fan-out | Performance and capacity | S | P2 | after `utilisation-latency` |
| 307 | [`autoscaling-lag`](w3/autoscaling-lag.md) | Autoscaling lag | Performance and capacity | S | P3 | after `utilisation-latency` |
| 308 | [`cache-hit-ratio`](w3/cache-hit-ratio.md) | Cache hit ratio and latency | Performance and capacity | S | P3 |  |
| 309 | [`game-tick-server`](w3/game-tick-server.md) | Authoritative tick server | Performance and capacity | M | P3 |  |
| 310 | [`goodhart-teams`](w3/goodhart-teams.md) | Local optimisation, global degradation | Performance and capacity | M | P3 | after `utilisation-latency` |
| 311 | [`cache-mapping`](w3/cache-mapping.md) | Cache mapping | Computer architecture, OS gaps and automata | M | P2 |  |
| 312 | [`pipeline-hazards`](w3/pipeline-hazards.md) | Pipeline hazards | Computer architecture, OS gaps and automata | M | P2 |  |
| 313 | [`endianness`](w3/endianness.md) | Endianness | Computer architecture, OS gaps and automata | S | P3 |  |
| 314 | [`floating-point`](w3/floating-point.md) | IEEE 754 | Computer architecture, OS gaps and automata | S | P3 |  |
| 315 | [`mesi-coherence`](w3/mesi-coherence.md) | MESI coherence on its own | Computer architecture, OS gaps and automata | S | P3 | after `multicore-mesi` |
| 316 | [`twos-complement`](w3/twos-complement.md) | Two's complement and overflow | Computer architecture, OS gaps and automata | S | P3 |  |
| 317 | [`regex-to-nfa`](w3/regex-to-nfa.md) | Regex to NFA to DFA | Computer architecture, OS gaps and automata | M | P3 | after `automata` |
| 318 | [`os-context-switch-cost`](w3/os-context-switch-cost.md) | What a context switch costs | Computer architecture, OS gaps and automata | S | P3 |  |

## Wave 4: course pages

One task per course: [`w4/`](w4/). Each lists the sims the catalogue assigns to the course; the course file adds a sim when it is `ready`.

## Not tasks

- `dc-sim`: Python/Streamlit, cannot be copied into a static site. Its phenomena are build tasks (`utilisation-latency`, `tail-latency`, `retry-storm`, `goodhart-teams`, `littles-law`, `autoscaling-lag`).
- `dr-lecture-estate`: documents, not a simulator; `instructor/map.html` is the answer key and must never be published. Its scenarios seed build tasks.
- The 50ohm maps (`maidenhead`, `aprs_map`, `hamnet_map`): they need live map tiles or external services, which the build refuses. Revisit if the owner wants online-only pages.

## Catalogue id → sim folder

Area prefixes are dropped from folder names except `win-`, `lnx-`, `fin-`, `cmp-` and `set-`; a few names are overridden for clarity (`tasks.py` `SIM_ID_OVERRIDE`).

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
| `ant-accelerated-charge` | `accelerated-charge` |
| `ant-array-phasing` | `antenna-array` |
| `ant-dipole-field` | `dipole-field` |
| `ant-dipole-length` | `dipole-length` |
| `ant-gain-directivity` | `gain-directivity` |
| `ant-ground-image` | `ground-image` |
| `ant-link-budget` | `link-budget` |
| `ant-near-field-coupling` | `near-field-coupling` |
| `ant-polarization` | `polarization` |
| `ant-small-antenna` | `small-antenna` |
| `ant-tx-rx-polarization` | `polarization-mismatch` |
| `ant-yagi` | `yagi` |
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
| `ha-cluster-membership` | `cluster-membership` |
| `ha-consistent-hashing` | `consistent-hashing` |
| `ha-db-replication` | `db-replication` |
| `ha-fencing` | `fencing` |
| `ha-lamport-clocks` | `lamport-clocks` |
| `ha-multimaster-conflict` | `multimaster-conflict` |
| `ha-never-zero-spof` | `never-zero-spof` |
| `ha-quorum-split-brain` | `quorum-split-brain` |
| `ha-raft` | `raft` |
| `ha-resource-placement` | `resource-placement` |
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

`accounting`, `active-directory`, `antennas`, `arp`, `attacks`, `audit`, `authentication`, `automata`, `automation`, `backup`, `bgp`, `boot`, `budgeting`, `caches`, `change-management`, `circuits`, `classroom-tool`, `consensus`, `containers`, `contracts`, `costs`, `cpu`, `cryptography`, `data-protection`, `deduplication`, `dhcp`, `disaster-recovery`, `dns`, `electrical-safety`, `em-waves`, `email`, `emergency-comms`, `encapsulation`, `error-detection`, `ethernet`, `fault-tolerance`, `file-sharing`, `filesystems`, `fire-safety`, `firewall`, `governance`, `group-policy`, `http`, `icmp`, `identity-governance`, `incident-response`, `investment`, `ip`, `ip-addressing`, `ipv6`, `kerberos`, `link-aggregation`, `logging`, `lvm`, `memory`, `modulation`, `monitoring`, `multicast`, `nat`, `networking`, `number-representation`, `occupational-health`, `operating-systems`, `packages`, `parallelism`, `partitioning`, `performance`, `permissions`, `physical-layer`, `processes`, `propagation`, `qos`, `radio-networks`, `raid`, `receivers`, `replication`, `rigging`, `risk`, `routing`, `selinux`, `services`, `set-procedure`, `set-roles`, `set-safety`, `shell`, `signals`, `snapshots`, `specialist-hazards`, `spectrum`, `ssh`, `storage-basics`, `storage-cluster`, `switching`, `tcp`, `time-sync`, `tls`, `topology`, `troubleshooting`, `udp`, `updates`, `virtualization`, `vlan`, `vpn`, `wifi`, `windows-internals`, `working-at-height`

Topics: `architecture`, `classroom`, `compliance`, `distributed`, `film-set`, `finance`, `internet`, `linux-admin`, `networks`, `os`, `radio`, `security`, `storage`, `theory`, `windows-admin`.

Also in `tags.json`, used by no task yet: `scheduling`.
