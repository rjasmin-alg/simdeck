# Notes from filling in the task specs

The "Model and presets" sections of the wave-2 and wave-3 tasks were written by ten parallel agents
(2026-10-01), each reading the course books and existing code for its batch. These are the problems they
found that are bigger than one task file: wrong sources in the catalogue, merges to decide, and gaps in the
course material. Each is already reflected in the task file concerned, unless it says otherwise.

## Linux (batch 7: Linux cores and part of the derivatives)

- **Wrong sources:**
  - `lnx-exit-status`: `izlazni-status-spaja.svg` is in UL ch16, not ch17. DR S8 is a storage-cost brief with
    no exit-status material; the pipefail case is caveat CV-32 in the DR estate's `instructor/caveats.md`.
    CV-32 says the script runs `… | gzip > file && mail OK`, but the real `p4-nightly.sh` has no `&&` and
    mails OK every time: **the caveat text in dr-lecture-estate needs fixing.**
  - `lnx-disk-full-mysteries`: the real sources are UL ch05 Primjer 3, ch11 and ch12, not ch23.
  - `lnx-load-average`: the real source is UL ch08 "Nadzor opterećenja" and Primjer 2, not NLA T41 (that is
    the USE method). Preset 1 reproduces the book's numbers within 0.01.
  - `lnx-namespaces`: NLA T07 covers only network namespaces; PID and mount namespaces are T11.
  - `lnx-hypervisor-types`: type 1 vs type 2 is in UL ch02 "Kako doći do sustava za vježbu" (Primjer 4), not
    NLA T01. It is close to a reference poster (§4.11).
- **Catalogue wording fixed:** `lnx-permissions-rwx` said "umask subtracting from defaults"; umask clears bits
  (666 with umask 077 gives 600, not 567). Fixed in the catalogue; the spec treats subtraction as a
  misconception.
- **Preset tasks:** their Kind line said both "build a new simulator" and "adds a preset"; the generator now
  says only "add a preset". `lnx-container-ports` (a preset on `port-forwarding`) lists six things the host
  must support; check the host task covers them. "-p is DNAT" holds only for rootful containers; rootless
  Podman forwards in user space, and the page should say so.
- **§5 decisions:**
  - §5.16: `win-firewall-profiles` picks a profile per network connection, not per packet source, so the
    `lnx-firewalld-zones` model needs a field for what the zone is bound to. Decide whether it stays a preset.
  - §5.15: `lnx-boot-chain` and `lnx-systemd-ordering` load their stages and units from presets, so Windows
    presets fit; `win-services` needs one relation that is both requirement and ordering (DependOnService).
  - §5.22: `lnx-deploy-strategies` keeps its own model (traffic split per minute) and links to update rings.
  - §5.17: `lnx-namespaces` draws the shared container diagram; `lnx-cgroups` and `lnx-overlayfs-layers`
    reuse it, and `lnx-container-volumes` reuses the overlayfs layer stack.
- **Thin course material** (presets derived, rules marked *(check)*): netfilter, CoW filesystems, cgroups,
  alert states, deploy strategies, live migration, bonding (cited from man pages and vendor docs). Book gaps:
  job control, `2>&1 > file` order, symlink rules, the SELinux `user_tmp_t` denial; no Croatian term for
  "inode" in the book. Many NLA Croatian terms are marked *(check)* for the NLA author or the glossary.
- **Kept out as second concepts:** firewalld runtime vs permanent, Alertmanager grouping, post-copy migration.

## Networking derivatives (batch 5)

- **"No local material" was wrong** for `port-forwarding` (URM ch11 "NAT: kad više uređaja dijeli jednu
  adresu", Primjer 4(b)), `tcp-teardown` (URM ch13 "TCP: zatvaranje veze", Primjer 3) and `vlan-trunk`
  (ch07 Primjer 5, native VLAN, 1518→1522 B, VID 1–4094; ch12 allowed list). Fixed in the task files.
- **Seeds and dependencies:** `intervlan-routing` comes from ch07 Primjer 6 and ch12 Primjer 1, not ch11; the
  book never mentions SVIs or L3 switches, so that preset is derived. `port-forwarding` builds on `pat`
  (generator fixed); after the §5.12 nat/pat merge it depends on the merged page.
- **`tcp-teardown` needs the host first:** the adopted `tcp-handshake` page has a fixed three-step list. The
  spec lists four shared requests: a segment list per preset, a state label per end, a timeout step, and the
  start state "both ESTABLISHED". Plan them into the `tcp-handshake` port.
- **`tcp-states` duplicates `tcp-teardown`** (its presets 1, 2, 4 are teardown's 1, 2, 5): keep seq/ack
  numbers identical and build it last or not at all (§5.8).
- **Class:** `ipv4-header` and `ipv6-address-types` need params and presets, so they are now `explorer` in the
  catalogue (were `reference`).
- **Kit gaps:** no text or bit-string input param (`ipv6-address-types` falls back to a select; `line-coding`
  bits are clicked on the stage); no drag and drop (`osi-tcpip-map` uses click-then-click). Candidates for the
  kit after two sims need them.
- **`osi-tcpip-map`** was deliberately left out of the URM plan ("Namjerno izostavljeno": a click-reveals-a-
  definition card). Consider a reference poster or a preset of `encapsulation`.
- **Possibly two concepts:** `link-state-spf` (flooding plus SPF; a toggle shows SPF alone; its graph could
  serve `distance-vector`, §5.11). `syn-outcomes` is a mode of the handshake page in the URM plan; a separate
  page linked both ways is recommended.
- **Errata for the URM book's author:**
  - ch16 counts the resolver cache among caches that leave no DNS packet, but the client still queries the
    resolver;
  - ch16 Primjer 2 shows a readable GET/200 on port 443, which on the wire is encrypted TLS;
  - ch10 Primjer 2 calls 2001:db8:… internet-routable, but it is the documentation prefix (RFC 3849);
  - ch06 says line coding eats nominal Ethernet capacity, but the advertised rate already counts coding.
- **Numbers without a course source** (marked *(check)*):
  - `qos-queues`, `link-aggregation` (simplified bonding hashes), `poe-budget` (802.3af/at/bt classes,
    370 W budget, a 48-port switch so the presets fit), `mac-flooding` (port-security modes),
    `wifi-channels` (1/6/11 and channel widths are not in ch17), `wifi-roaming` (dBm thresholds);
  - `multicast-igmp` IGMPv2 timers, from RFC 2236 as remembered;
  - worked out by us: `route-summarisation` (ch09 has no summarisation section), the
    `static-default-route` three-router loop, the SPF graph, the `ipv4-header` fragments
    (500/500/440 B, offsets 0/60/120); TIME_WAIT 60 s is Linux-specific.
- **Smaller:** `qos-queues` got a wrong `operating-systems` tag (a generator bug, fixed). `wifi-roaming` may be
  better as a stepper (~13 steps). The Croatian NDP terms are not in the book.

## Network cores (batch 4)

- **`wpa-handshake`** (first batch): the agent stopped before writing the attacker view; written by the
  catalogue thread instead, at the level the book and the proposal ask for (what is visible on the air, why
  WPA2-Personal allows offline guessing and WPA3/SAE doesn't, as a defence lesson; no attack procedure).
- **`stp`: no course source.** The URM book has no STP; ch07 has one paragraph on the broadcast storm and
  NLA T06 only names Linux bridges. All rules rest on IEEE 802.1D and are marked derived; rules 2, 4, 7 and 8
  need checking against the standard. `broadcast-storm`'s presets (storm, no-loop, router-boundary) are
  specified on the `stp` host; frame counts derived.
- **`tcp-congestion`:** URM ch13 only separates congestion from flow control; cwnd, slow start, AIMD and CUBIC
  come from RFC 5681 and RFC 9438. It needs the small live chart view, not K1.
- **`ipv6-slaac`:** ch10 covers SLAAC only in outline; rules from RFC 4861/4862.
- **`tcp-retransmit`:** fast retransmit and duplicate ACKs are in URM ch15 (Primjer 5), not ch13. The book's ACK
  numbers there (4500 ×4, then 6000) only work with 375-byte segments, a size chosen by the spec *(check)*.
- **`wifi-association`:** the catalogue concept ended with the 4-way handshake, which is `wpa-handshake`'s
  concept; collapsed to one linked step.
- **`rule-first-match`:** the URM book does not state first match or implicit deny for router ACLs; sourced to
  the PostgreSQL `pg_hba.conf` docs and Cisco "Configuring IP Access Lists". "Windows Firewall block rules win
  regardless of order" is marked *(check)*.
- **Wrong sources:** `dhcp-rogue` (URM ch18 has no rogue DHCP; the source is UL ch18 "Četiri poruke");
  `csma-ca-rts-cts` (URM ch17 covers it fully; it nearly duplicates the URM page `skriveni-cvor.html` and earns
  its place only through the backoff and NAV timeline).
- **`crc-error-detection`:** no URM source; uses 50ohm `fehlererkennung`/`fehlerkorrektur` (keep the CC BY
  attribution). `fec-hamming` belongs on this host (§5.13). `ethernet-frame`'s bit-flip preset overlaps it.
- **`distance-vector`:** with synchronous rounds split horizon fixes every case, so "split horizon fails in
  loops" cannot be shown; the RFC metric convention is off by one from what Cisco displays.
- **Plan references:** the URM plan's planned cards are named pages in "Primijenjeno: 11 stranica", not card
  ids; cited that way.
- **Croatian terms** missing from the books, marked *(check)*: cwnd, slow start, DAD, RA/RS, split horizon,
  padding, MTU, PMTUD, DHCP snooping, STP itself.

## Rule added while the specs were being written: concepts, not tools

Owner, 2026-10-01: "avoid specific tooling in all sims, we are showing concepts, even specific os needs to be
mentioned only when needed". Now rule §1 in `COMMON.md`. The agents still writing were told; the specs
already written were swept for tool names (`syn-outcomes` cited a scanner's manual, now RFC 9293;
`packet-journey` named a capture tool, now "a packet capture"). Protocol roles that share a name with a tool
(an OCSP or WireGuard "responder") stay.

## Active Directory and Group Policy (batch 2)

- **Sources:** no local AD/GPO course material. Rules come from the protocol specifications and Microsoft
  documentation ([MS-ADTS], [MS-KILE], [MS-NLMP], [MS-GPOL], [MS-DRSR], RFC 4120/4178/2782), with uncertain
  specifics marked *(check)*. Croatian AD terms are not in the books; the few that exist (zona, resursni
  zapis, podmreža, dozvola, nasljeđivanje, grupa, karta/povjerenje from NLA T57) are used, the rest marked
  *(check)*.
- **Presets use the DR estate's AD data** (`dr-lecture-estate/student/configs/ad/quillmoor/`: forest, OU tree,
  GPOs, PSOs, trusts, users) and topologydrafter's `two-sites` layout. Three specs also cite
  `instructor/scenarios/S15.md`; those task files now carry a warning, and COMMON.md has a rule: instructor
  material informs the model, its answers never reach a page.
- **Names added by the spec** (marked "derived"): child domain `brk.quillmoor.example`, second tree
  `emberline.example`, forest `carrow.example`, an extra Colo site. The estate is one domain with one site.
- **The estate is inconsistent:** `gpos.txt` says 38 computers in OU=Workstations, `ou-tree.txt` says 35.
  Fix it in dr-lecture-estate; `win-ou-vs-group` uses it as a talking point meanwhile.
- **Class changes** (now in the catalogue): `win-ad-structure`, `win-functional-levels`, `win-admx-store` from
  reference to explorer (each needs one toggle); `win-gpo-slow-link` from stepper to explorer (a live speed dial).
- **§5 decisions:**
  - §5.7: the B1 `multimaster-conflict` "AD attribute" preset covers only the conflict rules;
    `win-ad-replication` stays a page for USN, high-watermark and up-to-dateness vector bookkeeping, and the
    preset links to it.
  - §5.21: `win-domain-logon` and `win-dns-srv-records` are separate pages on one record model (if merged,
    logon becomes step 2). USN rollback stays in `win-ad-backup-restore` (it needs the replication model);
    `sto-backing-chains` links to its `usn-rollback` preset. Authoritative restore lives in
    `win-ad-backup-restore`; `win-ad-recycle-bin` only refers to it.
  - §5.1: `win-fgpp` "most specific wins" is only direct PSOs beating group PSOs; within a tier the lowest
    precedence wins and the smaller GUID breaks ties.
  - Pass-the-hash in `win-ntlm-vs-kerberos` overlaps `lateral-movement`: link, don't repeat.
  - `win-admx-store`'s soft dependency on `win-gpo-precedence` is nominal.
- **Riskiest *(check)* items, verify first:** whether a DC accepts a machine's previous password
  (`win-domain-join` revert preset); the password-history "N-2" lockout exemption; the tie-break order in AD
  replication conflicts; the authoritative-restore version bump (100,000 per day); client behaviour when a
  GPO's AD and SYSVOL versions differ; the per-level list in `win-functional-levels`; slow-link defaults for
  scripts and preference extensions; when event 2095 is logged after a USN rollback.
- **Concepts, not tools:** cmdlets, `w32tm`/`ntdsutil` syntax, hypervisor and cloud product names were
  removed; `gpupdate` stays because it is `win-gpo-processing`'s subject.

## Security and Windows files and identity (batch 3)

- **Concepts, not tools** applied: `buffer-overflow` names no compiler, CPU vendor or hardening project
  ("a compiler stack protector", "the CPU's no-execute bit", ASLR); `ransomware-321` shows deletion of shadow
  copies as a concept, not a command; `win-laps` uses an abstract "one machine breached" event. Four Windows
  specs (`win-registry`, `win-vss`, `win-smb-session`, `win-laps`) were rewritten with concept-level framing.
- **Generator fixes:** tags were matched as substrings ("sig**nat**ure" gave `digital-signature` the `nat`
  tag); now whole words. `win-ntfs-mft` now uses the block grid (K3) and the `filesystems` tag only.
- **Two concepts in one entry:** `win-dfs` (namespace referrals + DFS-R conflict: make the conflict half a
  preset of `multimaster-conflict`, §5.7); `win-services` (dependencies and start types vs recovery after N
  failures: drop the recovery preset or ask `lnx-systemd-ordering` for a "fail N times" replay).
- **Host-model requests**, to plan into the host tasks:
  - `lnx-cow-filesystem` needs a copy-on-write mode with a diff area (`win-vss`, `sto-cow-vs-row`, §5.2);
  - `sto-backing-chains` needs apply/revert and branching (`win-hyperv-checkpoints`; its preset 5 covers part);
  - `ha-quorum-split-brain` needs per-member votes, a reachable witness and dynamic quorum/witness toggles
    (`win-failover-cluster`);
  - `lnx-firewalld-zones` needs a detection-based profile binding (`win-firewall-profiles`);
  - `lnx-boot-chain` needs a per-preset way to hide the systemd timing bar and a Session Manager stage (`win-boot`).
- ***(check)* numbers:** BitLocker default PCR profiles, DFS referral TTLs and failback, the MFT resident
  threshold (~700 B) and first user record (64), dynamic quorum and witness behaviour, LAPS default rotation,
  SMB signing defaults, OCSP soft-fail. Croatian terms for Windows internals often marked *(check)*: a
  glossary pass is advisable.

## Windows DNS, DHCP, IPAM and WSUS (batch 1)

- **Book numbers used:** `dhcp-dora` takes UL ch18's 600 s lease (T1 = 300 s, T2 = 525 s) and Primjer 3;
  `dns-resolution` URM ch14 Primjer 1 and UL ch19 Primjer 2; `dns-records` UL ch19's `lab.example` zone;
  `win-ipam-address-plan` URM ch09 Primjer 1 (the Grafo plan) and ch12 Primjer 3. The 27 Windows specs rest on
  Windows Server behaviour as known, numbers marked *(check)*, Microsoft document titles cited from memory.
- **Erratum for the URM book:** ch14 says all four DORA messages are broadcast; RFC 2131 §4.1 broadcasts OFFER
  and ACK only when the client sets the BROADCAST flag. The spec follows the RFC (flag on by default).
- **Catalogue fixed:** §5.4 listed `win-ad-dns`, a name from an earlier draft; now `win-dns-zone-types`,
  `win-dns-dynamic-update`, `win-dns-scavenging`. Kit views corrected in the generator: `win-dhcp-scope-options`
  and `win-dns-policies` use the rule table (K4); `win-ipam-address-plan` the block grid (K3). IPAM tags are
  `ip-addressing` (the earlier `authentication` came from the substring bug).
- **Decide:**
  - §5.21 "SRV records and domain logon are one page in two steps": `win-dns-srv-records` and
    `win-domain-logon` are specified as two pages on one record model (also batch 2's view). Pick one owner if
    they merge.
  - `win-dns-forwarders`: the catalogue calls it a preset of `dns-resolution`; its decision order is its own
    concept, so a separate page on the shared model is proposed.
  - `win-dns-policies` is first match by processing order: build it on the §5.1 evaluator.
  - `win-wsus-delivery`: WSUS clients download over BITS and peer-cache through BranchCache; Delivery
    Optimization serves cloud update content *(check)*. The spec models a generic peer cache.
  - `win-update-rings` is a preset on `win-wsus-groups`; that host's spec already asks for the hooks
    (approvals per day, an update-health flag, computer tags).
- **Riskiest *(check)* rules** (whole presets depend on them): DHCP failover lease lengths under MCLT, the 5 %
  standby reserve and the switchover default; DHCP policy precedence and a full policy range; WSUS approval
  when a computer is in groups with conflicting approvals, and when superseded updates may be declined;
  Windows DNS client suffix handling, timeouts and negative cache time; whether DNS policies are per server;
  the scavenging "zone can be scavenged after" time.
- **Concepts, not tools:** DNS/DHCP server products and client commands were removed from the Model sections;
  public resolver addresses replaced with documentation ranges; a vendor MAC prefix replaced with a locally
  administered one.

## Internet and application protocols (batch 6)

- **"No local material" was wrong**, now fixed: `smtp-dialogue` (UL ch20: full SMTP transcript and the
  `454 4.7.1 Relay access denied` example), `acme-renewal` (UL ch21: HTTP-01 on port 80, renewal timer, renew at
  a third of the lifetime left), `http-versions` (URM ch14 "Šire o temi": HTTP/2, HTTP/3, QUIC).
  `ftp-active-passive` is not in URM ch14; rules from RFC 959 and RFC 1579. No NLA topic covers SSH port
  forwarding: `ssh-tunnels`' NLA course tag comes from the catalogue only.
- **DR S6 is a secondary-expiry story**, not a TTL one: its timeline (DNS changed 2026-11-10, colo stops
  resolving 2026-11-24) is exactly the 14-day expire in the student-visible estate configs. The seed moved from
  `inet-dns-ttl-cache` to `inet-dns-secondary-expiry` in the catalogue.
- **Hosts:** `dns-split-brain` needs two independent primaries and a per-server query view on the
  `dns-secondary-expiry` host, otherwise it falls back to a preset on `dns-resolution`. `acme-renewal` is a
  preset on `cert-chain` (its challenge exchange may be a second concept there). The estate's CRL expiry
  (2026-11-12) belongs to `pki-revocation`, not `cert-chain`.
- **`ssh-key-auth`:** UL ch15's "still `yes`" story is config precedence (first value wins), a §5.1 first-match
  case, not key authentication; kept out of scope.
- **RFC numbers taken from the books' citations:** UL ch21 cites RFC 9846 as current TLS 1.3 and UL ch20 cites
  RFC 9989 for DMARC; cited as the books do, next to RFC 8446 and RFC 7489. **Check them.**
- ***(check)* numbers:** CISA amplification factors, health-check defaults (every 2 s, down after 3, up after
  2), SameSite defaulting to Lax, 6 connections per host, mail-server reply wording, RFC 9700 section numbers,
  many Croatian terms. Presets marked "derived" were checked by hand (NTP offset and delay, poisoning odds,
  HTTP/1.1 vs 2 vs 3 timings, FTP port arithmetic, least connections); the WebSocket accept value by script.
- **Concepts, not tools:** tool and product names left the Model sections; vendor document titles stay only in
  Sources, for the builder. The three attack sims (`dns-poisoning`, `bgp-hijack`, `ddos-amplification`) show the
  mechanism and the defence, with no how-to.

## Linux derivatives (batch 8)

- **Book numbers used** ("From chN" presets): quotas 46084/51200, mdstat `[2/1] [U_]`, the `free -h` line, the
  rsync slash listings, PIDs 38450/38485, `ciscenje.sh` exiting with 3, `arhiva.timer`, 2146 MB, the 4 TB disk.
  Every NLA-based rule is *(check)*: NLA has no chapters yet.
- **Book errata that would mislead a spec:** UL ch12's `free -h` columns don't add up (`used` = total −
  available in newer procps; the spec states a 159 MiB unreclaimable cache to reproduce the line). The book's
  `/etc/logrotate.conf` has `dateext` on, so default numbering is dates, not `.1 .2`; the preset covers both.
- **`lnx-regex-match`:** a backtracking stepper models Perl-style regexes, but UL ch06 teaches POSIX BRE/ERE,
  which picks the longest leftmost match. The page shows both (`a|ab` on "ab" gives "a" vs "ab"); without that
  it teaches the wrong rule for extended grep.
- **Presets on hosts:** `lnx-send-receive` is a preset on `backup-diff-incr`, which can't express it as is (a
  received increment is applied on the target, so restore needs no chain, and the parent snapshot must exist on
  both sides); the spec says what to request.
- **Overlaps:** `lnx-memory-swap-oom` and `lnx-page-cache` share starting numbers and split cleanly (pressure,
  swap and the OOM pick vs dirty pages, writeback and dropping caches). `lnx-rsync-delete` and
  `lnx-mirror-not-backup` both tie to DR S3 (the nightly mirror carries the ransomware): link them.
- **Kit requests:** the rule table (K4) needs a fourth evaluation mode, "control flags", for `lnx-pam-stack`.
- **Length:** `lnx-netns-veth-bridge`'s main preset is 19 steps; if it runs long, split it into two presets
  (L2 bridge, then L3 out), not two pages.
- **`lnx-raid-rebuild`:** URE odds from datasheet worst-case rates (4 × 4 TB RAID 5 at 1e-14 gives 62 %), stated
  on the page; how the kernel's software RAID reacts to a URE during rebuild is *(check)* and a param.
- **`disk-partitioning`** (catalogue `lnx-partition-tables`): an explorer with no steps (catalogue now says so);
  its soft dependency on `lnx-mount-layers` is weak.
- **Concepts, not tools:** product names removed (logger, multipath distribution wording, container engine,
  identity product, package names). Catalogue titles made generic where the product is not the concept:
  "ACME certificate renewal", "Infrastructure as code: state and drift", "Alert states: pending and firing",
  "VRRP failover", and the §5.7 and §5.12 presets.

## Architecture, OS gaps, automata, radio, crisis comms, reference and tools (batch 10)

- Preset numbers were worked out with scripts: cache traces, cycle counts, MESI counts, IEEE 754 bits, SWR,
  ionosphere geometry, Hamming syndromes, regex subset construction, ADS-B/CPR decoding, LoRa airtime, net
  timelines.
- **Two concepts:** `qam-ofdm` (QAM order vs noise, and OFDM subcarriers), specified as two modes of one page;
  splitting OFDM into its own task is worth considering.
- **`fec-hamming`** on the `crc-error-detection` host needs a code switch and a decode/correct step that a
  CRC-only model can't express; if the host can't add it, make Hamming a second mode of that page, not a preset.
- **Wrong seed:** `packet-aprs` cited 50ohm `paketvermittelte_netzwerke` (HAMNET/IP); the APRS material is in
  `afsk.md` and `relaisfunkstellen.md`. WIDEn-N path rules and the 30 s dupe window are *(check)*.
- **Kit views and tags corrected** in the generator: `multiple-access` (block grid, tag `modulation`), and,
  found in the same sweep, `digital-signature`, `osi-tcpip-map`, `win-gpo-processing`, `win-gpo-software-install`,
  `win-gpo-slow-link`, `kk-backup-ncs` (no shared view), `win-ad-backup-restore` (topology), `sto-ec-vs-replication`
  (block grid), `win-dhcp-policies` (rule table), `win-dhcp-superscope` (none).
- **Crisis comms source conflicts:** KK2 says the backup NCS takes over after 60 s of silence and calls an
  earlier takeover an error, but the handbook's Vježba 2 sets "takeover < 60 s" as the standard (the spec follows
  KK2). One KK1 slide lists three priorities while KK1, KK2 and the handbook elsewhere use four (with
  PRIORITET); KK2 suspends routine traffic under overload, the handbook suspends INFORMATIVNO (the spec uses four
  priorities and KK2's "samo PRIORITET i HITNO"). **Ask the KAKA author.**
- **`mesi-coherence`:** the source page `homogeni-multicore-simulator.html` counts M→S as an invalidation; the
  spec counts downgrades separately. Fix the imported page too (`multicore-mesi` adoption task).
- **Kit gap: no text-input param.** `endianness`, `floating-point`, `regex-to-nfa` and `quick-poll` need one;
  a shared `text` param covers all four (also asked for by batch 5).
- **`protocol-headers`** overlaps the imported `l2l3-protocols` (English only, no TCP/UDP headers): keep both and
  reuse its IPv4/IPv6 field data.
- **`well-known-ports`** keeps MySQL, PostgreSQL and RDP rows because the IANA registry names those services so;
  drop them if the "concepts, not tools" rule is read strictly.
- **`quick-poll` is blocked** until the owner picks how votes reach the page (hosting with shared state, a local
  server, or the teacher typing counts); only the model and the two layouts can be built now.
- **`countdown`:** check the kit lets a stepless tool page use Space for start/pause.
- **Illustrative numbers** the page must label as such: `os-context-switch-cost` timings. *(check)*:
  `lora-css` SNR limits and duty cycle; `ionosphere-muf` foE and LUF (foF2 = 5.5 MHz chosen to reproduce
  50ohm's "MUF 7.5 MHz at 45°").

## Storage, backup, DR, HA and performance (batch 9)

- **Numbers:** the Ceph specs come from running cephsim's engine (rack loss under a host rule: 453 PGs
  inactive, 1096 degraded, 499 clean; size/min_size counts on `hyperconverged`; EC 4+2; MAX AVAIL on
  `unbalanced`). The dc-sim phenomena are reproduced from its formulas and checked against its acceptance
  tests a–c. Dedup chunking, the SSD FTL and the retention prune were computed with scripts. The DR estate's
  student side only.
- **cephsim findings, for its adoption task:**
  - the `brokenRule` comment says "a third of the PGs go inactive"; the engine gives 453/2048 (22 %);
  - cephsim defaults EC `min_size` to k, Ceph documents k+1: with 5 instead of 4 the rack-loss count goes from
    271 to 783 inactive PGs. Check Ceph's default;
  - MAX AVAIL may over-promise: 17.9 TiB projected on `unbalanced`, while the fullest OSD is full at about
    14.3 TiB stored. Check against real Ceph.
- **`correlated-failure` and `never-zero-spof` duplicate faultline samples** (`onePdu`; `threeZone` with
  `authorities.js`): only strings, tests and the `?sample=` link are left, so they can fold into the
  `faultline` adoption task. Their "steps" are a guided walk in faultline's own UI.
- **Seeds fixed:** `write-cache` (the scoping note's item is a performance tier, not write-back durability;
  the catalogue now says so). `restore-drill` and `retention-gfs` cited DR S8, a capacity brief; the evidence is
  in the estate's p4 and VM-backup logs and `shares-and-dumps.txt`, now cited. `ceph-min-size` cites P05, which
  is not in the student scenarios. `nas-vs-san` is a 3–6 step stepper (catalogue changed from reference).
- **`game-tick-server`:** agentvsagent is not tick-authoritative (actions apply as they arrive; the 100 ms
  tick drives hazards only). The spec models a tick-batched server and borrows its line-of-sight and combat
  numbers. **Confirm the intended concept.**
- **dc-sim differences:** its "burn rate" is the fraction of breached checkpoints, not the SRE ratio
  (`slo-error-budget` uses the SRE one and says so); its shedding preset turns away 80 % of demand for good, so
  `retry-storm` adds a bistable variant (capacity 15 plus a one-tick spike) that shows the real metastable
  effect; `autoscaling-lag` adds one derived rule (order capacity when ρ > 0.8, with a lead time).
- **Host-model requests:** `cow-vs-row` needs a logical→physical map in `lnx-cow-filesystem`;
  `sync-async-replication` needs per-replica sync mode and acknowledgement times in `db-replication`; `fencing`
  needs a "hung" node state and a fence action in `quorum-split-brain`.
- Many Croatian terms are not in the books (RPO/RTO, erasure coding, PG, burn rate): marked *(check)*.

## Final sweep: product names (after all batches)

- Page-facing text in 14 specs was made generic: container engines, web servers, hypervisor apps, packet-filter
  front ends and the backup tool (`lnx-container-ports`, `lnx-container-volumes`, `lnx-overlayfs-layers`,
  `lnx-cgroups`, `lnx-netfilter-path`, `port-forwarding`, `syn-outcomes`, `icmp-messages`,
  `lnx-hypervisor-types`, `rpo-rto`, `lnx-alert-states`, `lnx-ansible-idempotence`, `lnx-deploy-strategies`,
  `win-failover-cluster`). Documentation citations moved to Sources, tagged with the rule they back. Rules,
  numbers and outcomes unchanged. Renamed ids: `container-ports` preset `docker-publish` → `publish`;
  `hypervisor-types` preset `where-kvm-sits` → `kernel-hypervisor` and param `kvm` → `kernel`; the container
  bridge is 10.88.0.1/16 with `web` at 10.88.0.5.
- COMMON.md now lists the products the syllabus teaches as topics (KVM/libvirt, Kubernetes, Ceph, Ansible,
  Terraform, Prometheus, Pacemaker/Corosync, and Windows Server features), which may be named on a page. Kept by
  design: nftables hooks in `lnx-netfilter-path` (T08 is nftables), `ping`/`tracert` in `icmp-messages` (URM ch11
  teaches them), `systemctl` and the package manager where UL teaches them.
