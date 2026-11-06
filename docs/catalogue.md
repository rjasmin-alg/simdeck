# simdeck: simulator catalogue

What simdeck should contain: what already exists and needs adopting, what to build next and in which
order, and the full pool of ideas behind both. Research and writing only; no simulator code.

Written 2026-10-01 from a survey of `~/projects` (sources cited per entry), the course material found
there, and the owner's answers (Windows courses, licence, languages). Sections:

1. [How to read and rank this catalogue](#1-how-to-read-and-rank-this-catalogue)
2. [Adoption list: what exists and needs adopting](#2-adoption-list-what-exists-and-needs-adopting)
3. [Build list: what we work on, in order](#3-build-list-what-we-work-on-in-order)
4. [The full catalogue of new simulators](#4-the-full-catalogue-of-new-simulators)
5. [Duplicates, overlaps and shared simulators](#5-duplicates-overlaps-and-shared-simulators)
6. [External material and licences](#6-external-material-and-licences)
7. [What this implies for the site frame and the UI kit](#7-what-this-implies-for-the-site-frame-and-the-ui-kit)

---

## 1. How to read and rank this catalogue

Every entry has a stable `id` (kebab-case, usable as the manifest id later). Each table row is one entry.

**Status** (the column after ID) says where each entry stands, written by `python3 tools/catalogue/status.py`
from `sims/`, the task files and the runner's queue (the counts are at the top of §3):

| Status | Meaning |
|---|---|
| `live` | built and ready: it is on the site |
| `live in` *x* / `live as` *x* | built as a preset on *x*, folded into *x*, or built under the id *x* |
| `wip` | in `sims/` but not ready |
| `w1`, `w3` | not built yet; the wave whose task builds it (`docs/tasks/w1/`, `w3/`) |
| … `· building` / `· queued` / `· next` | the runner is on it / it is in the queue / it goes back into the queue after the current one |
| … `· held` | waits for your decision (`docs/tasks/OPEN.md`, the coordinator's decisions list) |
| `not adopted` | decided against (§2) |

**Interest (`Int`) is yours to fill in.** It is blank everywhere. Use:

| Int | Meaning |
|---|---|
| `3` | I want this soon |
| `2` | Interested |
| `1` | Maybe, later |
| `0` | Drop it |
| blank | Not rated yet |

The ranking rule is **Int first, then Pri, then Size**: rated 3 before 2 before 1 before unrated, and
within a level, B1 before P1 before P2 before P3, and S before M before L. Entries rated `0` drop out of
the build list. You can edit the column here by hand, or use the ranking page
(`.herdr-project/simdeck-t-0002/library/catalogue-ranker.html`), which lets you click a level per entry,
group by interest, area or course, and export the ratings to merge back into this file.

**Pri** is my proposal, to be overridden by Int:

| Pri | Meaning |
|---|---|
| `B1` | First batch, fixed by the proposal |
| `P1` | Strongest candidates for the next batch (the batch itself is decided later) |
| `P2` | Must-have this semester |
| `P3` | Nice to have |

**Size:** `S` fits one working session from the template (the proposal's target); `M` needs one to two
sessions or a non-trivial model; `L` needs several sessions or is a capstone.

**Class** is the playbook's page class (§10.4): `step` (stepper, clicker-driven), `expl` (explorer,
live parameters), `ref` (reference poster, no controls), `tool` (lecturer only, never on a course page).

**Course codes** (the courses found in the material; see the report for what is assumed):

| Code | Course | Evidence |
|---|---|---|
| `URM` | Uvod u računalne mreže (intro to computer networks, 1st year) | `uvod-u-racunalne-mreze/`, `urm-sveucilisni-udzbenik/` |
| `UL` | Uvod u Linux | `uvod-u-linux/` (syllabus outcomes in `inputs/outcomes.md`) |
| `NLA` | Napredna Linux administracija | `napredna-linux-administracija/meta/toc.md` (topics T01–T60, no chapters yet) |
| `WIN1` | Windows administration, basic | owner, 2026-10-01; starting scope AD, GPO, IPAM, DNS, DHCP, WSUS; no material in `~/projects` |
| `WIN2` | Windows administration, advanced | as `WIN1` |
| `OS` | Operacijski sustavi | `ossimulator/` |
| `DR` | Optimisation and disaster recovery | `dr-lecture-estate/` |
| `SEC` | Security topics (URM ch18, NLA §8, radio security) | spread over several courses, not a course of its own |
| `ARH` | Computer architecture and memory | `single-page-labs/` index group, lab exercise "LV13" |
| `AUT` | Automata and computability | `single-page-labs/` index group |
| `HAM` | Ham radio licence course (classes A and P) | `50ohm-contents-hr/` |
| `KK` | Crisis communications KK1/KK2 | `KAKA/` |
| `FIN` | Finance basics for IT managers | owner, 2026-11-06: three requests |

**Seed** names where an entry comes from: a book chapter (`UL ch19`), a planned URM card
(`URM card ch08-arp`), an NLA topic (`NLA T20`), a DR scenario (`DR S6`) or an existing simulator
(`ossim:processes`, `spl:lvm-topology-lab-v2`, `cephsim`). `→` points to the overlap note in §5.

**Language.** Every simulator and the whole site support **English and Croatian** (owner decision,
2026-10-01). Titles here are in English; the Croatian title and summary come with each manifest entry.
Sizes in §4 include writing both languages. For adopted material, the language column in §2 says what
exists today and what has to be translated.

---

## 2. Adoption list: what exists and needs adopting

Verdicts:

- **import**: copy into simdeck as a native page and adapt to the kit (the proposal's plan for
  `single-page-labs`).
- **port**: as import, but the page needs real rework first (it is a fragment, depends on another
  project's components, or loads libraries from the network).

There is no "link" verdict. **Owner decision, 2026-10-01: simdeck copies and adopts, it never links out**
(`docs/site-structure.md` §0): every simulator lives in `sims/<id>/`, and a published folder is complete and
works offline. What used to be linked entries (ossimulator, the larger apps) are now imports or ports, and
what cannot work offline (three 50ohm maps) is not adopted.
- **idea**: nothing to copy; the concept goes into the build list (§4).

**Both languages on adoption.** Every native import and port must reach English and Croatian, so each
adopted page carries a translation task on top of the kit adaptation. Today's state:

| Source | Language today | Translation work |
|---|---|---|
| single-page-labs | of the 20 imported: 9 en, 9 hr, the Marp deck in hr (`lang="POSIX"`), 1 with an hr/en toggle (`radio-cybersecurity.html`) | 19 pages need the other language; the toggle page shows the pattern |
| URM interactive pages | hr only | all 14 need English |
| 50ohm applets | hr (translated from de) | all need English; the German original helps, as English 50ohm text doesn't exist |
| ossimulator | hr and en in one build since `93da8f8` (`?lang=`, else `simdeck.lang`); Croatian keeps the English terms in italics | done: English was written in ossimulator's source (task `ossimulator-english`, its glossary `docs/POJMOVNIK.md` pairs every term) and all 17 builds were re-imported in t-0118 |
| cephsim, faultline, topologydrafter | en | Croatian is written in the simdeck copy, which is canonical once imported |

**Licence: AGPL-3.0-or-later** (owner, 2026-10-01) for simdeck and for your own code copied into it.
None of your own repos has a LICENSE file today: ossimulator (`"private": true`), single-page-labs,
cephsim, faultline, topologydrafter, dc-sim, dr-lecture-estate, the books. Copying from them puts the copy
under AGPL-3.0-or-later. **Owner decision, 2026-10-02: AGPL everything**, so the source repos get an AGPL
LICENSE file too (wave-0 task `licence-source-repos`; each is a change in that repo). What AGPL means for the
pages is in §6.

### 2.1 single-page-labs → import (23 labs)

`~/projects/single-page-labs/`. 24 HTML files: 23 labs plus `index.html`. The index lists 22 of them
(`lora-mesh-usporedba-v3.html` is published but unlisted). Not a git repo; all files dated 2026-09-08
except the LoRa page (09-11). Deployed at `materijali.online/singles/`. Only `radio-sigurnost-2026.html`
handles arrow keys (Marp); no hand-written lab has keyboard stepping yet.

| ID | Status | Item | Where | What it shows | State | Verdict | Licence / assets | Pri | Int |
|---|---|---|---|---|---|---|---|---|---|
| `spl-amdahl` | live | Amdahl's law simulator (en) | `amdahl-simulator.html` | Amdahl bottleneck, Gustafson, real examples; 2 sliders | polished, 43 KB | import as `expl` | own; Google Fonts | P1 |  |
| `spl-webserver-amdahl` | live | Web server Amdahl (en) | `webserver-amdahl.html` | Amdahl applied to a web request (net/app/DB) | polished | import; later a preset of `spl-amdahl` → §5 | own; Google Fonts | P2 |  |
| `spl-multicore-mesi` | live | Homogeneous multicore, LV13 (hr) | `homogeni-multicore-simulator.html` | Amdahl + MESI coherence per core + false sharing | polished | import; split MESI out as a `step` page later | own; **Chart.js 4.4.1 from cdnjs (MIT)**: vendor it | P2 |  |
| `spl-sram-dram` | live | SRAM vs DRAM cell (en) | `sram-dram.html` | 6T SRAM vs 1T1C DRAM read/write/refresh/leak | polished | import as `step` | own; Google Fonts | P2 |  |
| `spl-rowhammer` | live | Rowhammer (en) | `rowhammer.html` | DRAM disturbance, double-sided hammer, mitigations | polished, animated | import as `expl` | own; Google Fonts | P2 |  |
| `spl-spectre-meltdown` | live as `hw-side-effects` | Spectre & Meltdown (en) | `spectre-meltdown.html` | speculative execution, branch predictor, Flush+Reload | polished, has STEP | import as `step` | own; Google Fonts | P2 |  |
| `spl-l2l3-protocols` | live | L2/L3 protocol deep dive (en) | `l2l3-protocols.html` | Ethernet, VLAN/QinQ, IPv4/6, VXLAN/GENEVE, GRE/MPLS/IPsec, MACsec, PMTUD | polished, 102 KB, mostly reading | import as `ref`; the fragmentation calculator seeds `net-fragmentation-pmtud` | own; Google Fonts; cites RFCs | P2 |  |
| `spl-automata` | live | DFA, NFA, PDA, Turing machine (hr) | `automati-dijagrami-demo.html` | automata running on an input word | polished, has Korak (step) | import as `step` | own; no deps | P2 |  |
| `spl-dfa-game` | live | DFA classroom game (hr) | `dfa-classroom-game.html` | presenter/player rounds building a DFA | polished; multi-device sync unverified | import as `tool` | own; no deps | P3 |  |
| `spl-lvm-lab` | live | LVM topology lab (en) | `lvm-topology-lab-v2.html` | PE map, PV/VG/LV stack, presets (striped, RAID, LUKS, thin), commands | polished; **v2 is canonical** | import as `expl`; drop v1 (`lvm-topology-lab.html`) | own; no deps | P1 |  |
| `spl-stratis-lab` | live | Stratis topology lab (en) | `stratis-topology-lab.html` | pools, filesystems, snapshots, iSCSI/MPIO/NVMe-TCP, cache tier | polished | import as `expl` | own; no deps | P2 |  |
| `spl-zfs-btrfs-lab` | live | ZFS & Btrfs topology lab (en) | `zfs-btrfs-topology-lab.html` | vdevs/RAIDZ2/special/SLOG/dRAID vs Btrfs profiles, failure and rebuild | polished, 65 KB | import as `expl` | own; no deps | P2 |  |
| `spl-radio-security-slides` | w1 · held | Radio and cybersecurity 2026, slides (hr) | `radio-sigurnost-2026.html` | 22-slide Marp deck: TETRA, EMCOMM, LoRa, GNSS jamming, AIS, 5G MCX, PQC | generated output, Marp source missing; `lang="POSIX"` bug | import as `ref`, or link; ask for the Marp source | own text; Marp runtime (MIT); **Twemoji from jsDelivr (CC BY 4.0, needs attribution)** | P3 |  |
| `spl-radio-security-page` | w1 · held | Radio and cybersecurity, web page (hr/en) | `radio-cybersecurity.html` | same material as the slides as a long page | polished; JS linked as a stylesheet (line 14) | import as `ref`; pick this **or** the slides → §5 | own; **4 `assets/*.png` (really JPEG), likely AI-generated, provenance unknown**; Lucide `@latest` from unpkg (ISC, unpinned) | P3 |  |
| `spl-rf-bandplan` | live | RF spectrum EU/HR bandplan (hr) | `rf-spektar-eu-hr-bandplan.html` | zoomable spectrum with EU/HR allocations | polished; letter hotkeys | import as `expl` | own; HAKOM-derived data (public regulation) | P2 |  |
| `spl-comms-poster` | live | Communication technologies poster (hr) | `komunikacijske-tehnologije-poster.html` | log-scale poster of technologies by frequency | polished | import as `ref` | own; Google Fonts | P3 |  |
| `spl-radio-networks` | live | Radio network demos (hr) | `radio-network-demos.html` | conventional repeater vs trunking/TETRA vs mesh under load | polished | import as `expl` | own; no deps | P2 |  |
| `spl-lora-mesh` | live | LoRa / mesh comparison (hr) | `lora-mesh-usporedba-v3.html` | propagation in LoRaWAN vs Meshtastic vs MeshCore vs MANET | polished; not in the index | import as `expl` | own; no deps | P2 |  |
| `spl-ham-modes` | live | Ham radio modes reference (hr) | `ham-radio-modes-reference-v2.html` | 27 analog/digital modes, ITU emission classes, filters | polished; **v2 is canonical** | import as `ref`; drop `ham-radio-modes.html` and `ham-radio-modes-reference.html` | own; no deps | P3 |  |
| `spl-student-picker` | live | Random student picker (hr) | `random-student-picker.html` | pick names without repeats | polished | import as `tool` | own; no deps | P2 |  |

Not adopted: `index.html` (replaced by the simdeck index), `lvm-topology-lab.html` and the two older ham
pages (superseded variants). Google Fonts (OFL) are fetched at runtime by 11 pages; the kit's local fonts
replace them on import.

### 2.2 URM book interactive pages → port (14 pages)

`~/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/` (identical copy in
`urm-sveucilisni-udzbenik/`). Croatian "Razina A" interactive term pages embedded in the networking book's
web edition (`materijali.online/urm`). Each is a 7–15 KB HTML **fragment**, not a standalone page: it
depends on the book site's `static/komponente.js` (`IA.Klizac` slider, `IA.Koraci` steps, 428 lines) and
CSS, and follows the book's "§7a" layout checked by `scripts/check-web.py`. Every page takes its numbers
verbatim from a worked example in the book, which is exactly the "numbers stated up front, already checked"
rule from the playbook. **These were missing from the proposal** and are the strongest networking material
that exists.

Verdict for all: **port**. Wrap each fragment as a standalone page, map `IA.Klizac`/`IA.Koraci` onto the
kit's controls, and keep the book's example numbers. One decision is open: which copy is canonical, the
book's or simdeck's (→ report).

| ID | Status | Item | Where (`ugradbeno/…`) | What it shows | Seed | Pri | Int |
|---|---|---|---|---|---|---|---|
| `urm-subnet-mask` | live | Subnet mask | `podmrezna-maska.html` | mask bits, network/broadcast, host count; the normative §7a example | URM ch08/09 | P1 |  |
| `urm-vlsm` | live | VLSM | `vlsm.html` | carving subnets of different sizes | URM ch09 | P1 |  |
| `urm-ipv6-shorten` | live | Shortening IPv6 addresses | `skracivanje-zapisa-ipv6-adrese.html` | zero compression rules, `::` once | URM ch10 | P2 |  |
| `urm-mac-table` | live | MAC address table | `tablica-mac-adresa.html` | switch learning, flooding, forwarding | URM ch07 | P1 |  |
| `urm-vlan` | live | VLAN | `vlan.html` | VLAN membership and tagging | URM ch07 | P1 |  |
| `urm-routing-table` | live | Routing table, longest prefix | `tablica-usmjeravanja.html` | longest-prefix match on router R2 (Example 2) | URM ch11 | P1 |  |
| `urm-nat` | live | NAT | `nat.html` | address translation table | URM ch11 | P1 |  |
| `urm-pat` | live in `nat` | PAT | `pat.html` | port translation, many hosts behind one address | URM ch11 | P1 |  |
| `urm-tcp-handshake` | live | TCP three-way handshake | `trostruko-rukovanje.html` | SYN/SYN-ACK/ACK, why ACK = seq + 1 (X=4000, Y=9500) | URM ch13 | P1 |  |
| `urm-flow-control` | live | Flow control | `kontrola-toka.html` | receiver window limiting the sender | URM ch13 | P2 |  |
| `urm-window` | live | Sliding window | `prozor.html` | window size vs throughput | URM ch13 | P2 |  |
| `urm-hidden-node` | live | Hidden node | `skriveni-cvor.html` | two stations out of range of each other collide at the AP | URM ch17 | P2 |  |
| `urm-firewall` | live | Firewall, stateful filtering and DMZ | `vatrozid.html` | stateless vs stateful filter for a client to port 443, DMZ (Example 5) | URM ch18 | P1 |  |
| `urm-layered-diagnosis` | live | Layer-by-layer troubleshooting | `dijagnostika-po-slojevima.html` | bottom-up, top-down, divide-and-conquer | URM ch15 | P2 |  |

The same book also plans about 40 interactive cards in `meta/plan-interaktivne-stranice.md` §6, most
unbuilt. They overlap the networking build list in §4.1 almost completely; the seeds there say which card
each entry corresponds to.

### 2.3 ossimulator → import the built pages (16 pages and the map)

`~/projects/ossimulator/`, `materijali.online/ossim/` (own login realm `sim/os`). All 16 pages are built,
`status: 'ready'`, about 900 tests, deployed 2026-09-30; teacher review (DoD C18) still open. Croatian UI,
Stallings 9th ed. Every page loads any of its scenarios paused through `?scenario=<id>` (not only the
`PUBLIC_SCENARIOS`), so one page can back several single-concept index entries. Licence: none (private).

Verdict for all: **import** the built single file (`dist-single/<id>.html`, made for Moodle: one
self-contained file per page, 200–335 KB) into `sims/<id>/`, unchanged except for `data-sim`, the
`#simdeck-meta` placeholder and the `#simdeck-exceptions` block (it has its own runtime, not the kit; its text
floor is 14 px; its six-section layout scrolls). ossimulator's TypeScript source, with about 900 tests, stays
where it is, so for these pages the simdeck copy is a build and not the place to fix things. **Owner decision,
2026-10-02: ossimulator is the source of truth** for its pages, the one exception to "copies are canonical":
fixes and the English UI go into ossimulator, and simdeck re-imports the builds. The *Index entries* column proposes separate
single-concept entries (each a `?scenario=` deep link); that is about 60 entries from 16 pages, which needs
the frame's preset entries (task `presets-in-index`).

| ID | Status | Page | Concept | Index entries (scenario ids) | Pri | Int |
|---|---|---|---|---|---|---|
| `ossim-interrupts` | live | Interrupts (S ch. 1) | nested interrupts, IPL, kernel stack | sequential vs nested (`stallings-sequential`, `stallings`), stack overflow, re-entrant ISR, interrupt vs exception vs syscall (`sync`) | P1 |  |
| `ossim-processes` | live | Processes (S ch. 3) | 2/5/7-state models, PCB, switching | 5-state trace (`stallings-trace`), suspend (`suspend-memory`), zombie (`fork-zombie`), orphan (`orphan`), mini shell (`mini-shell`) | P1 |  |
| `ossim-scheduling` | live | CPU scheduling (S ch. 9) | FCFS…Feedback on one process set | FCFS vs RR (`compare-fcfs-rr4-srt`), quantum (`rr-quantum`), SPN/SRT/HRRN, MLFQ (`stallings-fb1`), starvation and aging (`starvation`, `aging`) | P1 |  |
| `ossim-memory-allocation` | live | Memory allocation (S ch. 7) | partitions, placement, buddy | internal fragmentation (`fixed-equal`), first/best/next fit (`placement-differs`), compaction, buddy (`buddy-stallings`) | P2 |  |
| `ossim-address-translation` | live | Address translation (S ch. 7–8) | paging, segmentation, TLB | paging split (`stallings-paging`), TLB locality (`tlb-locality`), two-level walk, inverted table, protection fault | P1 |  |
| `ossim-page-replacement` | live | Page replacement (S ch. 8) | OPT/LRU/FIFO/Clock | four algorithms (`stallings-four-algorithms`), Clock (`clock-walkthrough`), Belady (`belady-anomaly`), working set, thrashing | P1 |  |
| `ossim-threads` | live | Threads (S ch. 4) | ULT vs KLT | blocking call (`ult-blocking`, `klt-blocking`), jacketing, multicore | P2 |  |
| `ossim-sync` | live | Synchronization (S ch. 5) | races, Peterson, semaphores, monitors | lost update (`race-counter-lost-update`), attempts 2–4, producer–consumer deadlock (`pc-bounded-deadlock`), readers–writers | P1 |  |
| `ossim-deadlock` | live | Deadlock (S ch. 6) | RAG, banker, detection, philosophers | RAG cycle (`rag-classic`), banker safe/unsafe, detection (`detect-fig610`), dining philosophers (`dining-naive`) | P1 |  |
| `ossim-io-techniques` | live | I/O techniques (S ch. 1, 11) | PIO vs interrupt vs DMA, buffering | three techniques (`three-techniques`), double/circular buffering (`buffering-compare`) | P2 |  |
| `ossim-disk-scheduling` | live | Disk scheduling (S ch. 11) | FIFO…FSCAN, HDD vs SSD | Table 11.2 (`stallings-table-11-2`), SCAN vs C-SCAN, HDD vs SSD (`hdd-vs-ssd`) | P2 |  |
| `ossim-raid-cache` | live | RAID and disk cache (S ch. 11) | RAID 0–6, XOR, small write, cache policies | RAID 5 layout, XOR reconstruct (`raid5-reconstruct`), small write, RAID 6 double failure, LRU vs LFU vs FBR | P1 |  |
| `ossim-drivers` | live | Device drivers (S ch. 11) | I/O layers, top/bottom half | top/bottom half (`top-bottom-half`), blocking vs non-blocking | P3 |  |
| `ossim-filesystem` | live | File system (S ch. 12) | allocation methods, inodes | allocation compare (`allocation-compare`), defrag, inode levels (`inode-levels`) | P2 |  |
| `ossim-syscalls` | live | System calls (S ch. 2–3) | user/kernel mode, TRAP | 11 steps of `read()` (`read-11-steps`), blocking read, privileged trap | P1 |  |
| `ossim-journey` | live | Journey of one call (capstone) | `read()` and page fault through every layer | `read-miss`, `page-fault` | P2 |  |
| `ossim-map` | live | OS map (index) | layered OS overview | `?m=<id>` focuses a module | P2 |  |

Not adopted: `legacy/ugnijezdeni-prekidi.html` (superseded by `interrupts`).

### 2.4 Larger apps → port

| ID | Status | Item | Where | What it shows | State | Deep links today | Verdict | Licence | Pri | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `app-topologydrafter` | live | topologydrafter | `~/projects/topologydrafter`, `materijali.online/topologija/` | network topology drawing with step reveal (AD multi-site, DMZ, campus) | built, in classroom use | **yes**: `?sample=<two-sites\|dmz\|campus>&present=1&step=<n>&theme=` | **port**: copy `index.html`, `css/`, `js/`; bundle its ES modules once into a classic script (`docs/site-structure.md` §5); samples become presets | none | P1 |  |
| `app-cephsim` | live | cephsim | `~/projects/cephsim`, `materijali.online/ceph/` | Ceph cluster: CRUSH, PGs, replication vs EC, quorum, recovery | 7 phases done, 148/148 checks pass; **never opened in a real browser** | no (samples `hyperconverged`, `threeRacks`, `brokenRule`, `unbalanced`); `?sample=` is about 20 lines | **port** as topologydrafter (bundle once, add `?sample=`, Croatian in the copy); single concepts also become native pages (§4.6–4.7) | none | P1 |  |
| `app-faultline` | live | faultline | `~/projects/faultline`, `materijali.online/faultline/` | fault-domain tree + dependency gates, minimal cut sets | phase 0b of 7 (spike), 47/47 checks pass | no (samples `threeZone`, `onePdu`, `sizeTwo`, `usEast1`, `frontDoor`) | **port** as topologydrafter (bundle once, add `?sample=`) | none | P2 |  |
| `app-dc-sim` | not adopted | dc-sim | `~/projects/dc-sim` | datacenter as queues + teams: tail latency, retry collapse, Goodhart | 86 pytest tests, Streamlit GUI, not deployed | no | **idea** only: Python/Streamlit cannot be copied into a static site; its phenomena are native pages (§4.8) | none | P3 |  |
| `app-dr-estate` | not adopted | dr-lecture-estate | `~/projects/dr-lecture-estate` | fictional estate, 15 DR scenarios, 25 projects | v1 complete, not deployed | `instructor/map.html#CV-nn` | **not adopted**: documents, not a simulator, and `map.html` is the answer key; its scenarios seed §4.6–4.7 | none | P3 |  |

### 2.5 50ohm applets → port (29 applets, CC BY 4.0; 3 maps not adopted)

`~/projects/50ohm-contents-hr/contents/html/` (Croatian translation of DARC's 50ohm.de; German original in
`50ohm-contents-dl/`). The content licence is **CC BY 4.0** (`LICENSE`, identical in both repos). Its only
condition is attribution, which the GPLv3 and AGPLv3 both allow (§7(b) of each), so CC BY 4.0 material
can go into an AGPL page. Attribution is required: "50ohm.de-Autorenteam, AJW-Referat des
DARC e.V.", plus a note of changes. Before copying, check that every applet's code is covered by the repo
licence, as no applet carries its own notice. Ten applets load libraries from `50ohm.de` (jQuery 3.7.1 MIT,
Chart.js 4.4.1 MIT, three.js MIT, Leaflet BSD-2, Leaflet.Maidenhead by HA8TKS, licence unchecked); port
means vendoring these. Three are maps of live external services (online tiles, aprs.fi, hamnetdb.net); the build refuses network loads, so they are not adopted.

Verdict: **port** the signal and circuit applets (most double as networking physical-layer material),
leave out the maps. All `HAM`, some also `URM` ch06.

| ID | Status | Applet (`contents/html/…`) | Shows | Verdict | Pri | Int |
|---|---|---|---|---|---|---|
| `50ohm-nyquist` | live | `applet_nyquist.html` | sampling theorem, aliasing | port | P2 |  |
| `50ohm-quantisation` | live | `quantisierung_und_sampling.html` | quantisation and sampling | port | P2 |  |
| `50ohm-fourier` | live | `fourier.html` | Fourier synthesis of a waveform | port | P2 |  |
| `50ohm-rectangle` | live | `applet_rectangle.html` | spectrum of a rectangular pulse | port | P3 |  |
| `50ohm-sine` | live | `applet_sinus_amplitude_und_periode.html` | sine amplitude and period | port | P3 |  |
| `50ohm-lambda-f` | live | `applet_lambda_und_f.html` | wavelength vs frequency | port | P2 |  |
| `50ohm-am` | live | `applet_am_modulator.html` | AM modulation | port | P2 |  |
| `50ohm-pm` | live | `applet_pm.html` | phase modulation | port | P3 |  |
| `50ohm-qpsk` | live | `applet_qpsk.html` | QPSK constellation | port | P2 |  |
| `50ohm-iq` | live | `applet_iq.html` | I/Q signals | port | P3 |  |
| `50ohm-iq-phasor` | live | `applet_iq_zeiger.html` | I/Q phasor | port | P3 |  |
| `50ohm-ring-modulator` | live | `applet_ringmodulator.html` | ring modulator / mixer | port | P3 |  |
| `50ohm-speech-spectrum` | live | `spektrum_sprachsignale.html` | spectrum of speech signals | port | P3 |  |
| `50ohm-dsp` | live | `applet_dsp.html` | DSP basics | port | P3 |  |
| `50ohm-dsp-filter` | live | `applet_dsp_filter.html` | digital filter | port | P3 |  |
| `50ohm-chirp-1` | live | `applet_chirp_1.html` | chirp signal (311 KB) | port | P3 |  |
| `50ohm-chirp-2` | live | `applet_chirp_2.html` | chirp signal (581 KB) | port | P3 |  |
| `50ohm-lc-resonance` | live | `applet_schwingkreis.html` | LC resonant circuit | port | P3 |  |
| `50ohm-lc-antenna` | live | `applet_schwingkreis_antenne.html` | resonant circuit and antenna | port | P3 |  |
| `50ohm-traps` | live | `applet_traps.html` | trap antenna | port | P3 |  |
| `50ohm-attenuator` | live | `applet_daempfungsglied.html` | attenuator pad | port | P3 |  |
| `50ohm-rectifier-1` | live | `applet_gleichrichter_1.html` | half-wave rectifier | port | P3 |  |
| `50ohm-rectifier-2` | live | `applet_gleichrichter_2.html` | full-wave rectifier | port | P3 |  |
| `50ohm-ripple` | live | `applet_brumm.html` | mains hum / ripple | port | P3 |  |
| `50ohm-interference` | live | `applet_interferenz.html` | interference, multipath | port | P2 |  |
| `50ohm-fading` | live | `fading_applet.html` | fading | port | P3 |  |
| `50ohm-skip-distance` | live | `sprungdistanz_applet.html` | ionospheric skip distance | port | P3 |  |
| `50ohm-greyline` | live | `greyline.html` | grey line propagation | port | P3 |  |
| `50ohm-aurora` | live | `applet_aurora.html` | aurora propagation (790 KB, embedded data) | port | P3 |  |
| `50ohm-maidenhead` | not adopted | `maidenhead.html` | Maidenhead locator map (Leaflet, online tiles) | not adopted (needs the network) | P3 |  |
| `50ohm-aprs-map` | not adopted | `aprs_map.html` | live APRS map (aprs.fi iframe) | not adopted (needs the network) | P3 |  |
| `50ohm-hamnet-map` | not adopted | `hamnet_map.html` | HAMNET map (hamnetdb.net iframe) | not adopted (needs the network) | P3 |  |

`test.html` is a stub and is not adopted. The German repo has one more (`applet_iq_169`).

### 2.6 Idea sources (nothing to copy)

| Source | Where | Concept it seeds | Entry in §4 | Licence note |
|---|---|---|---|---|
| filesearcher | `~/projects/filesearcher/idea.md` | file dedup funnel: size → partial hash → full hash | `sto-dedup-file-funnel` | own, none |
| agentvsagent | `~/projects/agentvsagent/engine.py`, `spectator.html` | authoritative tick server, grid raycast line of sight | `perf-game-tick-server` | own, none; needs a JS rewrite (server-bound today) |
| HamMonitor | `~/projects/HamMonitor/DESIGN.md` | FFT/waterfall, NFM demod, CTCSS detection, sample rate vs span | `ham-fft-waterfall`, `ham-ctcss` | own, none |
| cluster-design scoping note | `~/projects/cluster-design-sim-scoping.md` §5 | six design-failure exercises (rule without device class, one small disk caps a tier, size=2/min_size=2, phantom OSD, no write cache, consumer SSDs) | §4.7 | own |
| dr-lecture-estate caveats | `instructor/caveats.md` | split-brain primaries (CV-01), DNS secondary expiry (CV-02), backup that lies (S8), cert expiry (S4), AD mass deletion (S15) | §4.3, §4.6, §4.7 | own; answer key, don't publish |
| Lora-Wideband-Decoder | `~/projects/Lora-Wideband-Decoder` | LoRa chirp spread spectrum | `ham-lora-css` | **PolyForm Noncommercial 1.0.0**: no code reuse |
| intercept | `~/projects/intercept` | ADS-B decoding, waterfall UI | `ham-adsb-frame` | Apache-2.0 fork; ideas only |
| SigDigger | `~/projects/SigDigger` | FSK/PSK/ASK demodulation | `ham-fsk-psk-ask` | LICENSE file is LGPL-3 text; ideas only |
| GNS3 sample | `~/GNS3/projects/…/primjer-mreza.gns3` | a reference topology for networking scenarios | presets in §4.1 | own |
| KAKA course slides | `~/projects/KAKA/*.pptx` | directed nets, NCS, priority traffic | §4.10 | own |

Not teachable (checked and skipped): desk, linkyard/lnux, SentinelMap, scanner, NetScout, hrs-remotion,
hrs-web, wall-clock, esp32clock (MIT Wokwi example, at most an NTP idea), DeDECTive (MIT), DroneMonitor,
geneologija, starenovine, deepdig, cityfps (AGPL mapgen lab), shellpath (no code yet), upute.online.

---

## 3. Build list: what we work on, in order

New native simulators only (adoption is §2). Batch 1 is fixed; everything after it waits for your
ratings. Re-rank by filling in Int; the ranking page does the sorting.

<!-- status:begin (tools/catalogue/status.py) -->

**Status, 2026-11-06** (the Status column after each ID; `python3 tools/catalogue/status.py` rewrites it): **256 of 409 entries are live**, 97 w3, 44 w3 · queued, 5 not adopted, 3 w3 · held, 2 w1 · held, 1 w3 · building, 1 wip.

| Area | Entries | Live | To build (wave) |
|---|---|---:|---|
| §2.1 single-page-labs → import (23 labs) | 20 | 18 | 2 w1 · held |
| §2.2 URM book interactive pages → port (14 pages) | 14 | 14 | – |
| §2.3 ossimulator → import the built pages (16 pages and the map) | 17 | 17 | – |
| §2.4 Larger apps → port | 5 | 3 | – |
| §2.5 50ohm applets → port (29 applets, CC BY 4.0; 3 maps not adopted) | 32 | 29 | – |
| §4.1 Networking basics and LAN protocols | 52 | 35 | 3 w3 · held, 14 w3 · queued |
| §4.2 Internet and application protocols | 30 | 19 | 7 w3, 4 w3 · queued |
| §4.3 Security and cryptography | 17 | 11 | 6 w3 |
| §4.4 Linux | 55 | 40 | 14 w3, 1 wip |
| §4.5.1 Active Directory | 21 | 16 | 5 w3 |
| §4.5.2 Group Policy | 9 | 4 | 5 w3 |
| §4.5.3 DNS on Windows Server | 7 | 6 | 1 w3 |
| §4.5.4 DHCP on Windows Server | 6 | 3 | 3 w3 |
| §4.5.5 IPAM | 5 | 3 | 2 w3 |
| §4.5.6 WSUS and updates | 7 | 5 | 2 w3 |
| §4.5.7 Files, identity and the rest | 18 | 8 | 10 w3 |
| §4.6 Storage, backup and disaster recovery | 22 | 16 | 6 w3 |
| §4.7 High availability and distributed systems | 11 | 7 | 3 w3, 1 w3 · queued |
| §4.8 Performance and capacity | 10 | 1 | 4 w3, 5 w3 · queued |
| §4.9 Computer architecture, OS gaps and automata | 8 | 0 | 6 w3, 2 w3 · queued |
| §4.10 Radio and crisis communications | 17 | 0 | 17 w3 |
| §4.11 Reference posters and classroom tools | 6 | 0 | 6 w3 |
| §4.12 Finance basics for IT managers | 20 | 1 | 1 w3 · building, 18 w3 · queued |

<!-- status:end -->

### 3.1 Batch 1, fixed by the proposal (M3)

| # | ID | Title | Size | Why first |
|---|---|---|---|---|
| 1 | `sto-dedup-chunking` | Deduplication: fixed vs content-defined chunks | M | the playbook's suggested wave-1 page: a clear stepper with a clean rule set, shapes the kit |
| 2 | `sto-backup-diff-incr` | Differential vs incremental backup | S | reuses the block-grid view from #1 |
| 3 | `sto-backing-chains` | Differential disks / snapshot backing chains | M | the same block grid, plus chains and merge |
| 4 | `ha-multimaster-conflict` | Multi-master replication with a conflict | M | first sequence-over-time page |
| 5 | `net-wpa-handshake` | WPA2/WPA3 handshake and what an attacker sees | M | first message-sequence page; the kit's sequence chart is born here |

### 3.2 Candidates for the next batch (P1, not decided)

The batch is decided after the list is complete and rated (owner, 2026-10-01). These are the entries
marked P1, weighted towards networking, Linux, Windows, internet and basic protocols; each is S or M and
reuses one of the kit's shared views (§7.2). 26 entries:

| # | ID | Title | Size | Courses |
|---|---|---|---|---|
| 1 | `net-encapsulation` | Encapsulation and decapsulation | S | URM |
| 2 | `net-stp` | Spanning tree | M | URM, NLA |
| 3 | `net-arp-local-remote` | Local or remote, then ARP | S | URM |
| 4 | `net-hop-rewrite` | What changes at each hop | S | URM |
| 5 | `net-dhcp-dora` | DHCP DORA and the lease | S | URM, UL, WIN1 |
| 6 | `net-rule-first-match` | First match wins | S | URM, UL, NLA |
| 7 | `net-tcp-congestion` | TCP congestion control | M | URM, NLA |
| 8 | `net-syn-outcomes` | Open, closed, filtered | S | URM, SEC |
| 9 | `inet-dns-resolution` | Recursive and iterative resolution | M | URM, UL, WIN1 |
| 10 | `inet-dns-ttl-cache` | TTL caching and the cutover | S | UL, DR |
| 11 | `inet-tls-handshake` | TLS 1.2 vs 1.3 | M | UL, URM, SEC |
| 12 | `inet-cert-chain` | Chain of trust and expiry | S | UL, DR |
| 13 | `inet-email-auth` | SPF, DKIM and DMARC | M | UL, SEC |
| 14 | `lnx-pipes-redirection` | Pipes and the three streams | S | UL |
| 15 | `lnx-permissions-rwx` | Permission bits, octal, umask | S | UL |
| 16 | `lnx-selinux-decision` | DAC says yes, SELinux says no | S | UL |
| 17 | `lnx-overlayfs-layers` | Image layers and copy-up | S | NLA |
| 18 | `lnx-netfilter-path` | A packet through netfilter | M | NLA |
| 19 | `win-group-scopes` | Group scopes and AGDLP | S | WIN1 |
| 20 | `win-kerberos` | Kerberos | M | WIN2, NLA |
| 21 | `win-gpo-precedence` | GPO precedence | M | WIN1 |
| 22 | `win-dns-scavenging` | Aging and scavenging | S | WIN2 |
| 23 | `win-dhcp-scope-options` | Scopes, reservations and option precedence | S | WIN1 |
| 24 | `win-wsus-flow` | How an update reaches a client | M | WIN1 |
| 25 | `win-ntfs-share-effective` | Effective access: NTFS plus share | S | WIN1 |
| 26 | `ha-quorum-split-brain` | Quorum and split-brain | S | NLA, DR, WIN2 |

### 3.3 Backlog

Everything else in §4 marked P2 (must-have this semester) or P3 (nice to have). §4 holds 321 new ideas:
5 B1, 32 P1, 164 P2 and 120 P3. By area: Windows 73, Linux 55, networking basics 52, internet 30,
storage/DR 22, finance 20, security 17, radio 17, HA 11, performance 10, architecture 8, reference/tools 6.
The six finance P1 entries (§4.12, added 2026-11-06) came after the batch list in §3.2 was written and are not in it.

Adoption (§2) holds 88 entries, 83 of them adopted: 20 single-page-labs imports, 14 URM ports, 17
ossimulator imports (about 60 index entries through scenarios), 3 larger apps ported and 29 50ohm applets
ported. Not adopted: dc-sim and dr-lecture-estate (ideas only) and the three online-only 50ohm maps. The idea
sources in §2.6 feed §4 and are not counted again.

**Tasks.** Every adopted item and every §4 entry has its own self-contained task in `docs/tasks/`
(`README.md` there gives the order): wave 0 foundation, wave 1 adoption, wave 2 core technologies (DNS,
DHCP, AD, Group Policy, IPAM, WSUS first, then the networking, internet, security, Linux, storage and HA
cores), wave 3 derivatives, wave 4 course pages.

---

## 4. The full catalogue of new simulators

One concept each, grouped by area. Areas map to courses through the Courses column; the frame thread
decides the final grouping axes (§7.1).

### 4.1 Networking basics and LAN protocols

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `net-encapsulation` | live | Encapsulation and decapsulation | each layer adds its header going down and strips it coming up | step a message down the sender's stack and up the receiver's | step | S | P1 | URM | URM card ch04-enkapsulacija-dekapsulacija → §5.9 |  |
| `net-osi-tcpip-map` | w3 · queued | OSI vs TCP/IP, and which device lives where | layer models and the layer each device works at | drag protocols and devices onto layers | expl | S | P3 | URM | URM ch04 |  |
| `net-line-coding` | w3 · queued | Line coding: NRZ vs Manchester | how bits become a signal and why the clock must be recoverable | type bits, compare waveforms, cut the clock | expl | S | P3 | URM, HAM | URM card ch06 (Manchester) |  |
| `net-delay-components` | live | Four kinds of delay | propagation vs transmission vs queuing vs processing delay | sliders for distance, bandwidth, packet size, load | expl | S | P2 | URM | URM card ch06 |  |
| `net-nominal-vs-actual` | w3 · queued | Nominal vs actual throughput | overhead, half duplex and retries eat the link rate | toggle overheads, watch goodput | expl | S | P3 | URM | URM card ch06 |  |
| `net-ethernet-frame` | w3 · queued | Anatomy of an Ethernet frame | fields, minimum size, padding, FCS | edit the payload, see padding and FCS | expl | S | P3 | URM | URM ch07 |  |
| `net-csma-cd` | live | CSMA/CD and binary exponential backoff | collisions on a shared bus and how backoff resolves them | step stations transmitting at once | step | M | P2 | URM | URM card ch07 |  |
| `net-domains` | live | Collision and broadcast domains | hubs, switches and routers split different domains | place devices, see the domains coloured | expl | S | P2 | URM | URM card ch07 |  |
| `net-stp` | live | Spanning tree | root bridge election, port roles, which port blocks the loop | step BPDUs; break a link and watch reconvergence | step | M | P1 | URM, NLA | URM ch07 → §5.10 |  |
| `net-broadcast-storm` | live in `stp` | A loop without spanning tree | one broadcast multiplies forever in a switched loop | send one broadcast, count frames per step | step | S | P2 | URM | pairs with `net-stp` → §5.10 |  |
| `net-mac-flooding` | w3 · held | MAC flooding and port security | a full CAM table turns a switch into a hub | flood fake MACs, then enable port security | step | S | P3 | URM, SEC | extends `urm-mac-table` |  |
| `net-vlan-trunk` | live | Access and trunk ports, native VLAN | 802.1Q tags added and removed at trunk edges | send frames across two switches | step | S | P2 | URM, NLA | extends `urm-vlan` |  |
| `net-intervlan-routing` | live | Inter-VLAN routing | router on a stick vs L3 switch SVIs | send a frame VLAN 10 → 20, follow the tag | step | S | P2 | URM | URM ch07/11 |  |
| `net-link-aggregation` | live | Link aggregation and flow hashing | why one flow never exceeds one member link | add flows, change the hash, fail a link | expl | S | P2 | URM, NLA | NLA T06 |  |
| `net-arp-local-remote` | live | Local or remote, then ARP | the host ANDs the mask, picks the target or the gateway, resolves its MAC | step a ping to a local and a remote host | step | S | P1 | URM | URM cards ch08-lokalno-udaljeno-odrediste, ch08-arp-zahtjev-odgovor → §5.9 |  |
| `net-arp-spoofing` | w3 · held | ARP spoofing, man in the middle | a forged reply rewrites the victim's ARP cache | step the attack, then turn on dynamic ARP inspection | step | S | P2 | URM, SEC | URM ch18 |  |
| `net-ipv4-header` | w3 · queued | IPv4 header fields | what each field does and which change in transit | click fields, see their role | expl | S | P3 | URM | URM card ch08 (IPv4 header) |  |
| `net-hop-rewrite` | live | What changes at each hop | MACs change per hop, IPs stay, TTL drops, checksum recomputed | step a packet across two routers | step | S | P1 | URM | URM card ch11-skok-sto-se-mijenja → §5.9 |  |
| `net-traceroute` | live | Traceroute and TTL | TTL-exceeded replies map the path, and stars are not failures | step increasing TTLs; drop ICMP on one router | step | S | P2 | URM | URM card ch11-tracert-ttl |  |
| `net-icmp-messages` | live | What ping answers mean | echo reply, unreachable codes, timeout, and what silence means | ping through scenarios (down host, ACL, no route) | step | S | P2 | URM | URM ch11 |  |
| `net-fragmentation-pmtud` | live | Fragmentation and PMTUD | fragments vs DF + ICMP "frag needed", and the PMTUD black hole | sliders for MTU and overhead; block ICMP | expl | M | P2 | URM, NLA | `spl-l2l3-protocols` calculator |  |
| `net-route-summarisation` | live | Route summarisation | aggregating contiguous prefixes into one route | pick networks, see the summary and what it over-covers | expl | S | P2 | URM | URM ch09 |  |
| `net-static-default-route` | live | Static and default routes | how a default route catches everything, and routing loops | add routes on three routers, send packets | step | S | P2 | URM | URM ch11 |  |
| `net-distance-vector` | live | Distance vector and count to infinity | RIP-style updates, slow convergence, split horizon | step update rounds; cut a link | step | M | P2 | URM | URM ch11 |  |
| `net-link-state-spf` | live | Link state and Dijkstra | LSA flooding builds one map; SPF picks paths | step Dijkstra on a weighted graph; change a cost | step | M | P2 | URM, NLA | URM ch11 → §5.11 |  |
| `net-ipv6-slaac` | live | IPv6 SLAAC | RS/RA, prefix + interface ID, DAD | step a host joining a link | step | M | P2 | URM | URM ch10 |  |
| `net-ipv6-ndp` | live | NDP instead of ARP | neighbour solicitation to the solicited-node multicast | step an IPv6 neighbour lookup next to ARP | step | S | P2 | URM | URM ch10; pairs with `net-arp-local-remote` |  |
| `net-ipv6-address-types` | w3 · queued | IPv6 address types and scopes | link-local, GUA, ULA, multicast and their reach | classify addresses, see where they travel | expl | S | P3 | URM | URM ch10 |  |
| `net-dhcp-dora` | live | DHCP DORA and the lease | discover/offer/request/ack, T1/T2 renewal, expiry | step a client, let time run, unplug the server | step | S | P1 | URM, UL, WIN1 | URM card ch14 (DORA), UL ch18 |  |
| `net-dhcp-relay` | live | DHCP relay and giaddr | a relay forwards broadcasts as unicast and tags the subnet | step a client on a remote subnet | step | S | P2 | URM, WIN1 | URM card ch14 (relay) |  |
| `net-dhcp-rogue` | w3 · held | Rogue DHCP and snooping | the first offer wins, so a rogue server takes over | add a rogue server, then trust ports | step | S | P3 | URM, SEC, WIN1 | URM ch18 |  |
| `net-rule-first-match` | live | First match wins | rule lists are evaluated top down, the first match decides, implicit deny | send packets/requests through presets: router ACL, stateless firewall, `pg_hba.conf` | step | S | P1 | URM, UL, NLA | UL ch22 (pg_hba first match) → §5.1 |  |
| `net-port-forwarding` | live | Port forwarding (DNAT) | inbound connections to a NAT'd server | add a forward, open from outside | step | S | P2 | URM | extends `urm-pat` → §5.12 |  |
| `net-cgnat` | w3 · queued | Carrier-grade NAT | double NAT, shared address space, why port forwarding fails | step a connection through two NATs | step | S | P3 | URM | URM ch11 |  |
| `net-tcp-teardown` | live in `tcp-handshake` | TCP connection teardown | FIN/ACK in both directions, half close, TIME_WAIT | step a close from either side | step | S | P2 | URM | extends `urm-tcp-handshake` → §5.8 |  |
| `net-tcp-states` | w3 · queued | TCP state machine | the states a socket passes through, live | drive both ends, watch states | step | M | P3 | URM | URM ch13 |  |
| `net-tcp-retransmit` | live | Loss and retransmission | RTO, duplicate ACKs, fast retransmit | drop chosen segments, step the exchange | step | M | P2 | URM | URM ch13 → §5.8 |  |
| `net-tcp-congestion` | live | TCP congestion control | slow start, congestion avoidance, AIMD sawtooth, Reno vs CUBIC | set loss and RTT, watch cwnd over time | expl | M | P1 | URM, NLA | URM ch13 |  |
| `net-tcp-vs-udp-loss` | live | TCP vs UDP under loss | the same stream: TCP retransmits and stalls, UDP drops and continues | slider for loss, play both side by side | expl | S | P2 | URM | URM card ch13-tcp-naspram-udp-gubitak |  |
| `net-port-multiplexing` | live | Ports and sockets | the 5-tuple keeps many connections apart on one port 443 | open connections from several clients | step | S | P2 | URM | URM card ch13 (multiplexing) |  |
| `net-syn-outcomes` | live | Open, closed, filtered | SYN gets SYN/ACK, RST or nothing, and what each means (port scanning) | probe ports on a host behind a firewall | step | S | P1 | URM, SEC | URM card ch15 (three SYN outcomes) |  |
| `net-asymmetric-path` | w3 · queued | Asymmetric path through NAT and firewall | replies taking another path break stateful devices | toggle the return path, watch the connection die | step | S | P3 | URM | URM card ch15 |  |
| `net-crc` | live | Error detection with CRC | how a CRC catches burst errors where parity fails | flip bits, compute parity and CRC | step | S | P2 | URM, HAM | → §5.13 |  |
| `net-wifi-channels` | live | Wi-Fi channels and overlap | 2.4 GHz 1/6/11, 5 GHz channel widths, co-channel interference | place APs, assign channels | expl | S | P2 | URM | URM ch17 |  |
| `net-wifi-association` | live | 802.11 association step by step | scan, authenticate, associate, then the 4-way handshake | step a station joining an AP | step | S | P2 | URM | URM card ch17-pridruzivanje-koraci; feeds `net-wpa-handshake` |  |
| `net-wpa-handshake` | live | WPA2/WPA3 handshake and what an attacker sees | PMK origin, 4-way handshake, why WPA2-PSK can be cracked offline and SAE can't | step the handshake; toggle the attacker's capture view | step | M | B1 | URM, SEC | proposal first batch; URM card ch17-pmk-porijeklo-rukovanje |  |
| `net-csma-ca-rts-cts` | w3 · queued | CSMA/CA and RTS/CTS | Wi-Fi avoids collisions it can't detect; RTS/CTS fixes the hidden node | step stations with and without RTS/CTS | step | S | P3 | URM | extends `urm-hidden-node` |  |
| `net-wifi-roaming` | w3 · queued | Roaming between APs | the client, not the AP, decides when to roam; sticky clients | walk a client across a floor plan | expl | S | P3 | URM | URM ch17 |  |
| `net-qos-queues` | w3 · queued | QoS queues | priority queue vs weighted fair queuing, tail drop | set traffic mix and queue weights | expl | M | P3 | URM, NLA |  |  |
| `net-multicast-igmp` | w3 · queued | Multicast and IGMP | joins, IGMP snooping keeps the stream off other ports | hosts join and leave a group | step | M | P3 | URM, NLA |  |  |
| `net-packet-journey` | live | The whole journey: from URL to page | DNS, ARP, TCP, TLS, HTTP in order, across the real path | step the capstone, open each part's own simulator | step | L | P2 | URM | URM card ch16-put-podataka-detaljno → §5.9 |  |
| `net-poe-budget` | w3 · queued | PoE power budget | class per device vs switch budget | add devices to a switch | expl | S | P3 | URM |  |  |

### 4.2 Internet and application protocols

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `inet-dns-resolution` | live | Recursive and iterative resolution | resolver asks root, TLD and authoritative servers; the client asks once | step a lookup; repeat it warm | step | M | P1 | URM, UL, WIN1 | UL ch19, URM card ch14 (DNS query path) → §5.4 |  |
| `inet-dns-ttl-cache` | live | TTL caching and the cutover | old answers live until TTL expires; lower the TTL before migrating | change a record, run time, see who still gets the old IP | step | S | P1 | UL, DR | UL ch19 Example 2 → §5.4 |  |
| `inet-dns-records` | live | DNS record types | A/AAAA/CNAME/MX/TXT/NS resolve differently; no CNAME at the apex | build a small zone, query it | expl | S | P2 | UL, URM, WIN1 | UL ch19 |  |
| `inet-dns-secondary-expiry` | live | A secondary is a cache with a timer | SOA serial, refresh, retry, expire; a dead primary takes the zone down later | kill the primary, run time | step | S | P2 | UL, DR | DR S6 (student timeline); DR caveat CV-02 → §5.4 |  |
| `inet-dns-split-brain` | w3 · queued | Two primaries are two zones | split-brain primaries answer differently | edit one primary, query both | step | S | P3 | DR | DR caveat CV-01 |  |
| `inet-dnssec-chain` | w3 | DNSSEC chain of trust | DS → DNSKEY → RRSIG from the root down | step validation; break a signature | step | M | P3 | UL, SEC |  |  |
| `inet-dns-poisoning` | w3 | DNS cache poisoning | forged answers race the real one; TXID and port randomisation | step the race at different entropy | step | M | P3 | SEC |  |  |
| `inet-http-exchange` | live | One HTTP exchange | request line, headers, status codes, body | send requests, read responses | step | S | P2 | URM, UL | URM ch14 |  |
| `inet-http-versions` | live | HTTP/1.1 vs HTTP/2 vs HTTP/3 | multiplexing, and head-of-line blocking at TCP vs QUIC | load a page with loss on each version | expl | M | P2 | URM |  |  |
| `inet-http-caching` | live | HTTP caching | Cache-Control, ETag, 304, what a CDN edge keeps | request repeatedly, change headers | step | S | P2 | URM, UL |  |  |
| `inet-cookies-sessions` | w3 · queued | Cookies and sessions | a stateless protocol remembers you; SameSite | log in, browse, switch sites | step | S | P3 | URM, SEC |  |  |
| `inet-cors` | w3 · queued | Same origin and CORS | the browser, not the server, enforces it; preflight | make cross-origin calls with different headers | step | S | P3 | SEC |  |  |
| `inet-reverse-proxy-lb` | live | Reverse proxy and load balancing | round robin vs least connections vs hash vs sticky; health checks | add servers, fail one, change the algorithm | expl | M | P2 | UL, NLA | UL ch21, NLA T54 |  |
| `inet-cdn-anycast` | live | Anycast and CDN edges | one address, many places; BGP picks the nearest | move clients, withdraw a site | expl | S | P2 | URM |  |  |
| `inet-tls-handshake` | live | TLS 1.2 vs 1.3 | key exchange, certificate, round trips; 1-RTT vs 2-RTT | step both handshakes side by side | step | M | P1 | UL, URM, SEC | UL ch21 → §5.5 |  |
| `inet-cert-chain` | live | Chain of trust and expiry | leaf, intermediate, root store; a missing intermediate; expiry clocks | build a chain, remove links, advance time | step | S | P1 | UL, DR | UL ch21, DR S4 → §5.5 |  |
| `inet-acme-renewal` | w3 · queued | ACME certificate renewal | HTTP-01 vs DNS-01 challenge, 90-day automation | step a renewal; break port 80 | step | S | P3 | UL |  |  |
| `inet-email-path` | live | The path of an e-mail | MUA → MSA → MTA → MDA → IMAP; envelope vs header | send a mail across two domains | step | M | P2 | UL, URM | UL ch20, URM card ch14 (mail send vs fetch) |  |
| `inet-email-auth` | live | SPF, DKIM and DMARC | three checks, alignment, and the DMARC verdict | send legitimate, forwarded and spoofed mails | step | M | P1 | UL, SEC | UL ch20 |  |
| `inet-smtp-dialogue` | w3 | An SMTP session | HELO/MAIL FROM/RCPT TO/DATA and reply codes | type commands, read replies | step | S | P3 | UL |  |  |
| `inet-ftp-active-passive` | w3 | Active vs passive FTP | the second connection and why NAT breaks active mode | connect through NAT in both modes | step | S | P3 | URM | URM ch14 |  |
| `inet-ssh-key-auth` | live | SSH host and user keys | known_hosts, key auth vs password, the first-connection warning | connect, change the host key, add a key | step | S | P2 | UL | UL ch15 |  |
| `inet-ssh-tunnels` | live | SSH port forwarding | local, remote and dynamic forwarding | build each tunnel, send traffic | step | S | P2 | UL, NLA |  |  |
| `inet-ntp-sync` | live | NTP offset and delay | four timestamps give offset and delay; stratum | step an exchange with asymmetric delay | step | S | P2 | UL | UL ch18 |  |
| `inet-bgp-path-selection` | live | BGP path selection | AS path, local preference, prefix propagation between ASes | step announcements across a small internet | step | M | P2 | NLA, URM | NLA T10 → §5.11 |  |
| `inet-bgp-hijack` | live | BGP hijack and RPKI | a more-specific prefix wins; route origin validation | announce a hijack, then turn on ROV | step | M | P2 | NLA, SEC |  |  |
| `inet-peering-transit` | w3 | Transit vs peering | who pays whom, tier-1, IXPs | connect networks, follow the money and the traffic | expl | S | P3 | URM |  |  |
| `inet-ddos-amplification` | live | DRDoS amplification | spoofed small requests become large replies at the victim | pick protocols, see the amplification factor | expl | S | P2 | URM, SEC | URM card ch18 (DRDoS) |  |
| `inet-oauth-flow` | w3 | OAuth 2.0 / OIDC authorization code flow | who sees what: browser, app, identity provider | step a login with a third-party IdP | step | M | P3 | SEC |  |  |
| `inet-websocket` | w3 | WebSocket upgrade | from HTTP request to a persistent two-way channel | step the upgrade, then push messages | step | S | P3 | URM |  |  |

### 4.3 Security and cryptography

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `sec-sym-vs-asym` | live | Symmetric vs asymmetric encryption | the key distribution problem and how public keys solve it | send messages with each scheme, count keys | step | S | P2 | URM, SEC | URM card ch18 |  |
| `sec-diffie-hellman` | live | Diffie–Hellman | a shared secret over a public channel (colour mixing, then numbers) | step both sides and the eavesdropper | step | S | P2 | URM, SEC | feeds `inet-tls-handshake` |  |
| `sec-hash-properties` | live | Hash functions | avalanche effect, fixed length, integrity, collisions | change one character, compare hashes | expl | S | P2 | SEC |  |  |
| `sec-password-storage` | live | Storing passwords | plain vs hash vs salted vs slow hash; rainbow tables; cracking time | pick a scheme and a password, see attack cost | expl | S | P2 | SEC, UL |  |  |
| `sec-digital-signature` | live | Digital signatures | sign with private, verify with public; tampering breaks it | sign, tamper, verify | step | S | P2 | SEC | feeds `inet-cert-chain` |  |
| `sec-classic-ciphers` | w3 | Caesar and Vigenère | why frequency analysis breaks substitution | encrypt, then break by frequency | expl | S | P3 | SEC |  |  |
| `sec-dmz-matrix` | live | DMZ rule matrix | which zone may open what to which | toggle rules between internet, DMZ and LAN | expl | S | P2 | URM, SEC | URM card ch18 (DMZ); extends `urm-firewall` |  |
| `sec-aaa-8021x` | live | AAA and 802.1X | supplicant, authenticator, RADIUS; port opens after EAP | step a laptop plugging in | step | M | P2 | URM, SEC | URM card ch18 (AAA) |  |
| `sec-ransomware-321` | live | 3-2-1 and immutable copies vs ransomware | which copies survive encryption and deletion | release ransomware on an estate with different backup designs | step | S | P2 | DR, SEC | DR S3, P09 |  |
| `sec-mfa-phishing` | w3 | MFA fatigue and adversary-in-the-middle | push bombing and session-token theft defeat weak MFA | step attacks against OTP, push, FIDO2 | step | S | P3 | SEC |  |  |
| `sec-sql-injection` | live | SQL injection | concatenated input becomes code; parameters fix it | type inputs, see the built query | step | S | P2 | SEC |  |  |
| `sec-xss` | w3 | Cross-site scripting | stored vs reflected; output encoding | post a comment with a script | step | S | P3 | SEC |  |  |
| `sec-buffer-overflow` | w3 | Stack buffer overflow | overwriting the return address; canaries, NX, ASLR | feed longer inputs, step the stack | step | M | P3 | SEC, OS, ARH |  |  |
| `sec-pki-revocation` | w3 | Revocation: CRL vs OCSP | how a revoked certificate is (or isn't) noticed; stapling | revoke, then connect with different checks | step | S | P3 | NLA, SEC | NLA T50 → §5.5 |  |
| `sec-wireguard` | live | WireGuard | handshake, cryptokey routing, roaming | step a handshake; move a peer | step | M | P2 | NLA, SEC | NLA T09 → §5.9 |  |
| `sec-ipsec-ike` | w3 | IPsec and IKE | IKE phases, transport vs tunnel mode, ESP | step a site-to-site tunnel coming up | step | M | P3 | NLA, SEC | NLA T09 |  |
| `sec-lateral-movement` | live | Lateral movement and tiering | one admin login on a workstation exposes the domain | follow credentials hop to hop; apply tiering | step | M | P2 | WIN2, SEC | → §4.5 |  |

### 4.4 Linux

Uvod u Linux (UL) chapters and Napredna Linux administracija (NLA) topics.

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `lnx-pipes-redirection` | live | Pipes and the three streams | stdin/stdout/stderr, `>` vs `2>&1` order, pipes | build a command line, see where each stream goes | step | S | P1 | UL | UL ch06 (`cjevovod-i-tri-toka.svg`) → §5.14 |  |
| `lnx-regex-match` | live | How a regex matches | the matcher walks the input, backtracks, anchors | type a pattern and text, step the match | step | M | P2 | UL, AUT | UL ch06; pairs with `spl-automata` |  |
| `lnx-links-inodes` | live | Hard links, symlinks and inodes | names point to inodes; the link count; dangling symlinks | create, link, delete, see what survives | step | S | P2 | UL | UL ch05 (`unos-u-direktoriju-i-brojac-poveznica.svg`) |  |
| `lnx-permissions-rwx` | live | Permission bits, octal, umask | nine bits, octal notation, umask clearing bits from the defaults (666 with umask 077 gives 600) | toggle bits, set umask, create files | expl | S | P1 | UL | UL ch07 (`devet-bitova-dozvola.svg`) |  |
| `lnx-access-decision` | live | The access decision | owner → group → other, first match decides; the ACL mask | pick a user and a file, step the check | step | S | P2 | UL | UL ch07 → §5.1 |  |
| `lnx-special-bits` | w3 | setuid, setgid and sticky | who the process runs as; who may delete in /tmp | run a setuid binary, delete in a sticky dir | step | S | P3 | UL | UL ch07 |  |
| `lnx-signals` | live | Signals | SIGTERM vs SIGKILL, traps, SIGHUP and nohup | send signals to processes with and without handlers | step | S | P2 | UL | UL ch08 |  |
| `lnx-job-control` | w3 | Job control | fg/bg, Ctrl-Z, process groups, what dies on logout | drive jobs from a shell | step | S | P3 | UL | UL ch08 |  |
| `lnx-boot-chain` | live | The boot chain | firmware → bootloader → kernel → initramfs → systemd | step a boot; break one stage | step | S | P2 | UL | UL ch10 (`lanac-podizanja.svg`) → §5.15 |  |
| `lnx-systemd-ordering` | live | systemd dependencies and ordering | Wants/Requires vs After/Before; a failed dependency | edit unit relations, boot, see the order and failures | expl | M | P2 | UL | UL ch10 → §5.15 |  |
| `lnx-timers-cron` | w3 | cron vs systemd timers | missed runs, `Persistent=`, randomised delay | let time pass with the machine off | step | S | P3 | UL | UL ch10 |  |
| `lnx-mount-layers` | live | Block device to mount point | disk → partition → filesystem → mount; a mount hides what was there | mount over a non-empty directory | step | S | P2 | UL | UL ch11 (`tocka-montiranja-zaklanja.svg`) |  |
| `lnx-partition-tables` | wip | MBR vs GPT | partition limits, protective MBR, backup header | add partitions to each | expl | S | P3 | UL | UL ch11 |  |
| `lnx-disk-full-mysteries` | live | "Disk full" with free space | inode exhaustion, and a deleted file still open | fill a disk both ways, find the cause | step | S | P2 | UL | UL ch11, ch23 |  |
| `lnx-mirror-not-backup` | live | A mirror is not a backup | RAID protects against disk loss, not deletion or corruption | delete a file on a healthy mirror | step | S | P2 | UL, DR | UL ch12 (`granica-zastite-zrcala.svg`) → §5.3 |  |
| `lnx-lvm-extend` | live | Extending an LV and its filesystem | PV → VG → LV → filesystem, in that order | add a disk, extend each layer | step | S | P2 | UL | UL ch12; stepper companion to `spl-lvm-lab` |  |
| `lnx-quotas` | w3 | Disk quotas | soft vs hard limit, grace period | users write files, time passes | step | S | P3 | UL | UL ch12 |  |
| `lnx-memory-swap-oom` | live | Memory, swap and the OOM killer | page cache vs used, swapping, who the OOM killer picks | start processes, watch memory and the kill | expl | S | P2 | UL, OS | UL ch12 |  |
| `lnx-page-cache` | live | free vs available | the page cache is not lost memory; dirty pages and writeback | read and write files, watch the counters | expl | S | P2 | UL, NLA | NLA T42 |  |
| `lnx-load-average` | live | Load average | load counts runnable and D-state tasks, not CPU percent | add CPU and I/O-bound tasks on 1–8 cores | expl | S | P2 | UL, NLA | NLA T41 |  |
| `lnx-log-path` | live | The path of a log message | app → journald → rsyslog → file or remote | send messages with facilities and priorities | step | S | P2 | UL | UL ch13 (`put-poruke.svg`) |  |
| `lnx-logrotate` | w3 | logrotate | rotation numbering, compress, copytruncate vs create | run rotations while an app writes | step | S | P3 | UL | UL ch13 |  |
| `lnx-routing-decision` | live | Address, route and resolver | the three things a host needs, and the route lookup | break each one, see which command fails | step | S | P2 | UL | UL ch14 (`cetiri-podatka-i-tri-mjesta.svg`); `urm-routing-table` for LPM |  |
| `lnx-firewalld-zones` | live | firewalld zones | a packet's zone comes from its source or interface | send packets from different sources | step | S | P2 | UL | UL ch15 → §5.16 |  |
| `lnx-selinux-decision` | live | DAC says yes, SELinux says no | a second, label-based check after permissions | change modes and contexts, retry access | step | S | P1 | UL | UL ch15 (`dozvola-i-politika.svg`, `tri-mjesta-koja-kazu-ne.svg`) |  |
| `lnx-shell-quoting` | live | Quoting and word splitting | what the shell does to a line before the command sees it | type lines, step expansion, splitting, globbing | step | S | P2 | UL | UL ch16 (`navodnici-i-razdvajanje.svg`) |  |
| `lnx-exit-status` | live | Exit status and `&&`, `\|\|`, `set -e`, `pipefail` | how failure propagates, and a pipeline that reports success while failing | run chains where one step fails | step | S | P2 | UL, DR | UL ch17 (`izlazni-status-spaja.svg`), DR S8 → §5.3 |  |
| `lnx-subshell-trap` | w3 | Subshells and traps | a `cd` in a subshell doesn't stick; cleanup on EXIT | run scripts with and without subshells | step | S | P3 | UL | UL ch17 (`podljuska-i-trap.svg`) |  |
| `lnx-rsync-delete` | live | rsync, trailing slashes and `--delete` | `src` vs `src/`, and how `--delete` mirrors a mistake | sync, delete at source, sync again | step | S | P2 | UL, DR | UL ch15 |  |
| `lnx-package-deps` | w3 | Package dependency resolution | repo metadata, dependency trees, conflicts | install packages into a small repo | step | S | P3 | UL | UL ch09 |  |
| `lnx-nfs-root-squash` | w3 | NFS and root squash | the server, not the client, decides who you are | access as root and as a user | step | S | P3 | UL | UL ch18 |  |
| `lnx-namespaces` | live | A container is a process | PID, network and mount namespaces isolate one process tree | start a container, compare host and container views | step | M | P2 | NLA | NLA T07 → §5.17 |  |
| `lnx-cgroups` | live | cgroups limits | CPU shares and memory limits; OOM inside a cgroup | set limits, run greedy workloads | expl | S | P2 | NLA | NLA T11 |  |
| `lnx-overlayfs-layers` | live | Image layers and copy-up | read-only layers, a writable top, copy-up and whiteouts | edit and delete files inside a container | step | S | P1 | NLA | NLA T12–13 → §5.17 |  |
| `lnx-container-volumes` | live | Where container data is lost | container layer vs volume vs bind mount on `rm` | write data, recreate the container | step | S | P2 | NLA | NLA T15 |  |
| `lnx-container-ports` | live in `port-forwarding` | Publishing a container port | `-p` is DNAT on the host | publish ports, connect from outside | step | S | P2 | NLA | NLA T16 → §5.12 |  |
| `lnx-userns-mapping` | w3 | Rootless containers | root inside maps to an unprivileged UID outside | create files, check owners on the host | step | S | P3 | NLA | NLA T17 |  |
| `lnx-netns-veth-bridge` | live | Namespaces, veth and a bridge | how container networking is wired by hand | connect two namespaces step by step | step | M | P2 | NLA | NLA T06–08 |  |
| `lnx-netfilter-path` | live | A packet through netfilter | prerouting, input, forward, output, postrouting; where NAT and filter happen | send inbound, forwarded and local packets | step | M | P1 | NLA | NLA T08 → §5.1 |  |
| `lnx-policy-routing` | w3 | Policy routing | `ip rule` picks a table before the route lookup | add rules and tables, send from two sources | step | S | P3 | NLA | NLA T05 |  |
| `lnx-bonding-modes` | w3 | Bonding modes | active-backup vs balance vs 802.3ad | fail links, send flows | expl | S | P3 | NLA | NLA T06 → `net-link-aggregation` |  |
| `lnx-lvm-snapshot` | live | LVM snapshot filling up | CoW snapshot space and invalidation when full | write to the origin, watch the snapshot fill | step | S | P2 | NLA | NLA T20 → §5.2 |  |
| `lnx-thin-overcommit` | live | Thin provisioning and overcommit | promised vs real space; the pool fills under everyone | create thin volumes, write, run out | expl | S | P2 | NLA, DR | NLA T20 → §5.2 |  |
| `lnx-cow-filesystem` | live | Copy-on-write filesystems | snapshots share blocks; writes go to new blocks | write, snapshot, write, see shared and owned blocks | step | S | P2 | NLA | NLA T22–23 → §5.2 |  |
| `lnx-send-receive` | w3 | Btrfs/ZFS send and receive | incremental replication from snapshot pairs | snapshot, send, change, send incremental | step | S | P3 | NLA, DR | NLA T22 → §5.3 |  |
| `lnx-zfs-self-heal` | live | Checksums and self-healing | a scrub finds a bad block and repairs it from the mirror | corrupt a block, scrub | step | S | P2 | NLA | NLA T23 |  |
| `lnx-raid-rebuild` | live | Rebuild under load and the second failure | a long rebuild, an unreadable sector, a lost array | fail a disk, rebuild, hit a URE | step | S | P2 | NLA, DR | NLA T24 → §5.3 |  |
| `lnx-multipath` | w3 | Multipath I/O | path failover for iSCSI/FC | fail paths during I/O | step | S | P3 | NLA | NLA T25; `spl-stratis-lab` |  |
| `lnx-ansible-idempotence` | live | Idempotence | a script run twice breaks things; a declarative task doesn't | run both versions repeatedly | step | S | P2 | NLA | NLA T30 |  |
| `lnx-terraform-drift` | live | Infrastructure as code: state and drift | desired vs state vs real; plan shows the diff | change infra by hand, run plan | step | S | P2 | NLA | NLA T31 |  |
| `lnx-deploy-strategies` | live | Blue-green, canary, rolling | how each moves traffic and rolls back | deploy a bad version with each strategy | step | M | P2 | NLA | NLA T33 |  |
| `lnx-alert-states` | live | Alert states: pending and firing | scrape, `for:` duration, pending → firing, flapping | feed a metric, tune the rule | step | S | P2 | NLA | NLA T36–37 |  |
| `lnx-live-migration` | live | Live migration | pre-copy rounds converge only if dirtying is slower than copying | slider for dirty rate and bandwidth | expl | M | P2 | NLA | NLA T02 |  |
| `lnx-pam-stack` | live | The PAM stack | required/requisite/sufficient/optional decide a login | reorder modules, fail some, log in | step | S | P2 | NLA | NLA T58 → §5.1 |  |
| `lnx-hypervisor-types` | w3 | Type 1 vs type 2, containers vs VMs | where the kernel and the hypervisor sit | compare stacks, click layers | ref | S | P3 | NLA | NLA T01, T07 |  |

### 4.5 Windows administration

Two courses: Windows administration basic (`WIN1`) and advanced (`WIN2`). Their starting scope is AD,
GPO, IPAM, DNS, DHCP and WSUS (owner, 2026-10-01). No course material was found in `~/projects`, so the
split between the courses is my proposal. The generic protocol pages (`net-dhcp-dora`, `net-dhcp-relay`,
`inet-dns-resolution`, `inet-dns-records`) also serve `WIN1`, and the Windows pages here link to them
instead of repeating them.

#### 4.5.1 Active Directory

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `win-ad-structure` | live | Forest, tree, domain, OU | the logical structure of AD and what each boundary is for (security, replication, policy) | click through a sample forest, place objects | expl | S | P2 | WIN1 | `app-topologydrafter` two-sites |  |
| `win-ou-vs-group` | live | OU or group? | OUs carry policy and delegation, groups carry permissions; one object, one OU, many groups | sort tasks into "OU" or "group", see why | step | S | P2 | WIN1 | → §5.21 |  |
| `win-group-scopes` | live | Group scopes and AGDLP | domain local, global, universal: who can be a member, where they can be used; AGDLP nesting | build the nesting for a file share, test a user | expl | S | P1 | WIN1 |  |  |
| `win-dc-promotion` | live | What promoting a DC does | AD DS, the DNS zone and SRV records, SYSVOL, the first replication | step a server becoming the first DC, then a second | step | S | P2 | WIN1 | → §5.21 |  |
| `win-domain-join` | live | Joining a domain | DNS SRV lookup, computer account, secure channel; a broken secure channel after a snapshot revert | join a client, revert it, try to log in | step | S | P2 | WIN1 |  |  |
| `win-domain-logon` | live | Domain logon | DC locator via DNS SRV, then Kerberos; cached credentials when no DC answers | log in on site, at a branch, offline | step | M | P2 | WIN1 | `app-topologydrafter` two-sites |  |
| `win-account-lockout` | w3 | Account lockout | threshold, bad-password count checked at the PDC emulator, a stale password locking an account | mistype passwords from two machines, keep an old session | step | S | P3 | WIN1 |  |  |
| `win-kerberos` | live | Kerberos | AS → TGT, TGS → service ticket, AP; clock skew breaks it | step a user opening a file share; skew the clock | step | M | P1 | WIN2, NLA | NLA T57 → §5.6 |  |
| `win-ntlm-vs-kerberos` | live | NTLM vs Kerberos | challenge-response vs tickets; when Windows falls back to NTLM; why pass-the-hash works | authenticate by name and by IP, capture the hash | step | S | P2 | WIN2, SEC |  |  |
| `win-time-hierarchy` | live | Time in a domain | the PDC emulator is the source, members follow DCs, Kerberos fails past 5 minutes | drift clocks, move the PDC role | step | S | P2 | WIN2 | `inet-ntp-sync` → §5.21 |  |
| `win-ad-replication` | live | AD multi-master replication | USNs, up-to-dateness vector, attribute-level last writer wins | change one attribute on two DCs at once | step | M | P2 | WIN2 | → §5.7 (`ha-multimaster-conflict`) |  |
| `win-ad-sites` | live | Sites, site links and the KCC | intra-site vs inter-site replication, cost and schedule; site-aware DC choice | add sites and links, change a password, wait | expl | M | P2 | WIN2 | `app-topologydrafter` two-sites |  |
| `win-sysvol-dfsr` | live | SYSVOL replication | GPO version in AD vs in SYSVOL; a GPO that half-arrived at a branch | edit a GPO, cut the link to a site | step | S | P2 | WIN2 | → §5.21 |  |
| `win-rodc` | w3 | Read-only DC at a branch | password replication policy; what a stolen RODC exposes | log users in at the branch, steal the RODC | step | S | P3 | WIN2, SEC | `app-topologydrafter` two-sites |  |
| `win-fsmo-roles` | live | FSMO roles | the single-master jobs and what breaks when a holder is gone; transfer vs seize | turn off role holders, try operations | step | S | P2 | WIN2 |  |  |
| `win-functional-levels` | w3 | Functional levels | what raising the domain and forest level unlocks, and what it rules out | raise levels with old DCs present | expl | S | P3 | WIN2 |  |  |
| `win-fgpp` | live | Password policy and fine-grained policies | one domain policy from the Default Domain Policy GPO; PSOs override it by precedence | apply PSOs to users and groups, see the winner | step | S | P2 | WIN2 | → §5.1 |  |
| `win-delegation` | w3 | Delegation of control | granting rights on an OU instead of Domain Admins | delegate password resets, test as a helpdesk user | step | S | P3 | WIN2 |  |  |
| `win-trusts` | w3 | Trusts | direction, transitivity, forest vs external trusts; who can access what | build trusts between forests, test access | step | M | P3 | WIN2 |  |  |
| `win-ad-recycle-bin` | live | Deleted objects: tombstone and recycle bin | tombstone lifetime, recycle bin, authoritative restore | mass-delete an OU, then recover | step | S | P2 | WIN2, DR | DR S15 |  |
| `win-ad-backup-restore` | live | Restoring a DC, and USN rollback | non-authoritative vs authoritative restore; reverting a DC snapshot silently breaks replication | restore a DC each way, revert a VM snapshot | step | M | P2 | WIN2, DR | → §5.21 (`sto-backing-chains`) |  |

#### 4.5.2 Group Policy

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `win-gpo-precedence` | live | GPO precedence | local → site → domain → OU, link order, enforced, block inheritance; the winning setting | link GPOs, toggle flags, see the winning setting | step | M | P1 | WIN1 |  |  |
| `win-gpo-processing` | live | When policy applies | computer at boot, user at logon, background refresh every 90 ± 30 min, `gpupdate`; settings that need a foreground pass | change a GPO, run time, log off and on | step | S | P2 | WIN1 |  |  |
| `win-gpo-security-filtering` | live | Security and WMI filtering | who a GPO applies to; the computer account needs Read too | filter a GPO to a group, add a WMI filter | step | S | P2 | WIN2 |  |  |
| `win-gpo-loopback` | w3 | Loopback processing | user policy from the computer's OU, replace vs merge | log users into a kiosk OU | step | S | P3 | WIN2 | extends `win-gpo-precedence` |  |
| `win-gpo-tattooing` | live | Policies vs preferences | a policy reverts when the GPO goes away; a preference stays (tattooing) | apply both kinds, unlink the GPO | step | S | P2 | WIN2 |  |  |
| `win-gpo-targeting` | w3 | Item-level targeting | one GPO, preferences that apply per group, OS, IP range | target drive maps, move a user | step | S | P3 | WIN2 | extends `win-gpo-tattooing` |  |
| `win-gpo-software-install` | w3 | Software installation | assigned vs published, computer vs user, why it needs a reboot or a logon | deploy an MSI each way | step | S | P3 | WIN1 |  |  |
| `win-gpo-slow-link` | w3 | Slow links | which extensions skip over a slow link, and why a branch behaves differently | change the link speed, refresh | expl | S | P3 | WIN2 |  |  |
| `win-admx-store` | w3 | ADMX and the central store | where templates come from and why editors disagree | edit from two admin machines with and without a central store | expl | S | P3 | WIN2 |  |  |

#### 4.5.3 DNS on Windows Server

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `win-dns-zone-types` | live | Zone types and replication scope | primary, secondary, stub, AD-integrated; forest, domain or custom replication scope | create zones, add DCs, see who holds which | expl | S | P2 | WIN1 | → §5.4 |  |
| `win-dns-srv-records` | live | What AD puts in DNS | `_ldap._tcp`, `_kerberos._tcp`, `_msdcs`; what breaks when they are missing | delete records, try to join and log in | step | S | P2 | WIN1 | pairs with `win-domain-logon` → §5.21 |  |
| `win-dns-forwarders` | live | Forwarders, conditional forwarders, root hints | where a DC sends names it doesn't own | resolve internal, partner and internet names | step | S | P2 | WIN1 | preset of `inet-dns-resolution` → §5.4 |  |
| `win-dns-client-order` | live | How a Windows client resolves a name | hosts file, cache, DNS with suffix search, then LLMNR/NetBIOS; why a short name goes wrong | resolve short and full names with different settings | step | S | P2 | WIN1 |  |  |
| `win-dns-dynamic-update` | live | Secure dynamic updates | clients register their own records; record ownership and why a renamed machine can't update | join, rename, move machines | step | S | P2 | WIN1 | → §5.21 |  |
| `win-dns-scavenging` | live | Aging and scavenging | timestamps, no-refresh and refresh intervals, which stale records disappear and when | run months of client activity, enable scavenging | step | S | P1 | WIN2 | → §5.21 |  |
| `win-dns-policies` | w3 | DNS policies and zone scopes | split-horizon answers by client subnet | query from inside and outside | step | S | P3 | WIN2 |  |  |

#### 4.5.4 DHCP on Windows Server

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `win-dhcp-scope-options` | live | Scopes, reservations and option precedence | exclusions, reservations; server, scope, class and reservation options, the most specific wins | set options at each level, renew a client | expl | S | P1 | WIN1 | builds on `net-dhcp-dora` → §5.1 |  |
| `win-dhcp-authorization` | w3 | Authorizing a DHCP server | an unauthorized Windows server stays silent; rogue servers that aren't Windows don't | add servers with and without authorization | step | S | P3 | WIN1 | → `net-dhcp-rogue` |  |
| `win-dhcp-dns-update` | live | DHCP updating DNS for clients | the server registers records, name protection, DnsUpdateProxy | renew leases for old and new clients | step | S | P2 | WIN2 | → §5.21 |  |
| `win-dhcp-failover` | live | DHCP failover | load balance vs hot standby, MCLT, partner down; the old 80/20 split scope | fail a server, renew leases | step | S | P2 | WIN2 |  |  |
| `win-dhcp-policies` | w3 | Policy-based assignment | addresses and options by vendor class, MAC or user class | connect phones and laptops | step | S | P3 | WIN2 |  |  |
| `win-dhcp-superscope` | w3 | Superscopes | several logical subnets on one segment | grow a scope past its subnet | step | S | P3 | WIN2 |  |  |

#### 4.5.5 IPAM

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `win-ipam-address-plan` | live | Planning the address space | blocks → ranges → addresses for sites and VLANs, with room to grow | allocate a block to sites, run out, re-plan | expl | S | P2 | WIN1, URM | `urm-vlsm` → §5.21 |  |
| `win-ipam-discovery` | w3 | IPAM discovery and provisioning | IPAM finds DHCP, DNS and DC servers and gets access through GPO | add servers, provision access, see what IPAM sees | step | S | P3 | WIN2 |  |  |
| `win-ipam-utilisation` | live | Utilisation and thresholds | scope fill across servers, alerts before a range runs out | let leases grow over a term | expl | S | P2 | WIN2 |  |  |
| `win-ipam-audit` | live | Who had this IP at 14:32? | correlating leases and logon events to find a machine and a user | answer an incident question from the audit trail | step | S | P2 | WIN2, SEC |  |  |
| `win-ipam-reconcile` | w3 | IPAM vs reality | records drift from the DHCP and DNS servers; stale reservations, overlapping ranges | make changes outside IPAM, reconcile | step | S | P3 | WIN2 |  |  |

#### 4.5.6 WSUS and updates

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `win-wsus-flow` | live | How an update reaches a client | Microsoft Update → upstream WSUS → downstream (replica or autonomous) → client; sync, approval, download | step an update through a two-site hierarchy | step | M | P1 | WIN1 |  |  |
| `win-wsus-groups` | live | Computer groups and approvals | approve per group, deadlines; server-side vs client-side targeting by GPO | approve for test, then production | step | S | P2 | WIN1 | → §5.22 |  |
| `win-wsus-client-cycle` | live | The client update cycle | detect, download, install, reboot; scan interval, deadlines, active hours | run days of client time with different settings | step | S | P2 | WIN1 |  |  |
| `win-wsus-cloned-id` | live | Clients that never report | cloned images share one SusClientId, so many machines show as one | deploy clones, check reporting, fix the id | step | S | P2 | WIN2 |  |  |
| `win-wsus-supersedence` | w3 | Superseded updates and cleanup | superseded updates pile up; declining and cleanup keep WSUS alive | run a year of releases with and without cleanup | step | S | P3 | WIN2 |  |  |
| `win-wsus-delivery` | w3 | Delivering updates over a WAN | express vs full files, BITS, delivery optimization peers at a branch | update a branch over a slow link | expl | S | P3 | WIN2 |  |  |
| `win-update-rings` | live in `win-wsus-groups` | Update rings | approval rings and deferrals; a bad patch stopped at ring 1 | release patches through rings | step | S | P2 | WIN2 | → §5.22 |  |

#### 4.5.7 Files, identity and the rest

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `win-ntfs-share-effective` | live | Effective access: NTFS plus share | most restrictive of the two wins; deny beats allow; groups add up | set ACEs on share and folder, test users locally and over the network | expl | S | P1 | WIN1 | → §5.1 |  |
| `win-ntfs-inheritance` | live | NTFS inheritance | inherited vs explicit ACEs, disabling inheritance, move vs copy | build a folder tree, move files around | step | S | P2 | WIN1 |  |  |
| `win-access-token` | live | The access token | SIDs and groups are fixed at logon; why you log off after a group change | add a user to a group, test before and after logon | step | S | P2 | WIN1 |  |  |
| `win-uac` | live | UAC and the split token | admins run with a filtered token until elevated | run tasks as admin with and without elevation | step | S | P2 | WIN1, SEC |  |  |
| `win-powershell-objects` | live | PowerShell pipes objects, bash pipes text | the same task in both pipelines | step each stage, inspect what flows | step | S | P2 | WIN1, UL | → §5.14 |  |
| `win-firewall-profiles` | w3 | Windows Firewall profiles | domain/private/public profile selection by network | move a laptop between networks | step | S | P3 | WIN1 | → §5.16 |  |
| `win-boot` | live in `lnx-boot-chain` | Windows boot chain | UEFI → Boot Manager → winload → kernel → smss → winlogon | step a boot; break the BCD | step | S | P2 | WIN1 | → §5.15 |  |
| `win-services` | w3 | Services and dependencies | start types, dependencies, delayed start, recovery actions | configure services, boot, fail one | expl | S | P3 | WIN1 | → §5.15 |  |
| `win-registry` | w3 | The registry | hives, HKLM vs HKCU, where policy writes | browse hives, apply a policy, find the key | ref | S | P3 | WIN1 |  |  |
| `win-vss` | live in `lnx-cow-filesystem` | Volume Shadow Copy | copy-on-write snapshots behind "Previous Versions" | write files, take shadows, restore | step | S | P2 | WIN1 | → §5.2 |  |
| `win-smb-session` | w3 | An SMB session | negotiate, session setup, tree connect, signing | connect with different SMB versions | step | S | P3 | WIN2 |  |  |
| `win-dfs` | w3 | DFS namespace and replication | referrals to the nearest target; DFS-R conflicts | open a share from two sites; edit on both | step | M | P3 | WIN2 |  |  |
| `win-hyperv-checkpoints` | w3 | Hyper-V checkpoints | AVHDX chain, merge on delete | take checkpoints, delete the middle one | step | S | P3 | WIN2 | → §5.2 (`sto-backing-chains` preset) |  |
| `win-failover-cluster` | live in `quorum-split-brain` | Failover cluster quorum | node majority, disk and file-share witness | fail nodes and the witness | step | S | P2 | WIN2 | → §5.7 (`ha-quorum-split-brain` preset) |  |
| `win-storage-spaces` | w3 | Storage Spaces | mirror vs parity, columns, how many disks you can lose | build a pool, fail disks | expl | S | P3 | WIN2 |  |  |
| `win-bitlocker-tpm` | w3 | BitLocker and the TPM | PCR measurements; what triggers the recovery key | change firmware/boot settings, reboot | step | S | P3 | WIN2, SEC |  |  |
| `win-laps` | w3 | LAPS | unique rotated local admin passwords stop lateral movement | compromise one machine with and without LAPS | step | S | P3 | WIN2, SEC | → `sec-lateral-movement` |  |
| `win-ntfs-mft` | w3 | NTFS MFT | MFT records, resident vs non-resident data, alternate data streams | create small and large files, add an ADS | ref | S | P3 | WIN2 |  |  |

### 4.6 Storage, backup and disaster recovery

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `sto-dedup-chunking` | live | Deduplication: fixed vs content-defined chunks | an inserted byte shifts every fixed chunk; rolling-hash boundaries resynchronise | insert/delete bytes in a file, compare the chunk tables | step | M | B1 | DR, NLA | proposal first batch; NLA T28 → §5.3 |  |
| `sto-dedup-file-funnel` | w3 | Finding duplicate files | size → partial hash → full hash, false positives at each stage | run the funnel over a file set | step | S | P3 | DR | filesearcher `idea.md` → §5.3 |  |
| `sto-backup-diff-incr` | live | Differential vs incremental | what each backup stores, and what a restore needs | change blocks over a week, restore on Thursday | step | S | B1 | DR, UL | proposal first batch; UL ch23 (`lanac-prirasnih-kopija.svg`) → §5.3 |  |
| `sto-backing-chains` | live | Backing chains (qcow2, VHDX, VMware delta) | reads fall through the chain; commit/merge; a broken link kills children | take snapshots, write, delete or merge one in the middle | step | M | B1 | DR, NLA, WIN2 | proposal first batch → §5.2 |  |
| `sto-retention-gfs` | live | Retention: grandfather-father-son | how many copies a schedule keeps and how far back you can go | set daily/weekly/monthly counts, run a year | expl | S | P2 | DR, UL | UL ch23 Example 6 → §5.3 |  |
| `sto-restore-drill` | live | The backup that lies | backups report OK; only a test restore shows they're empty | run the job for weeks, then restore | step | S | P2 | DR, UL | DR S8, UL ch23 (`provjera-arhive-i-proba-oporavka.svg`) → §5.3 |  |
| `sto-backup-window` | live | Backup window and offsite seeding | data size vs bandwidth vs window; why the first offsite copy goes by truck | sliders for size, change rate, link speed | expl | S | P2 | DR | NLA T28 |  |
| `sto-cow-vs-row` | w3 | Copy-on-write vs redirect-on-write | where the old and the new block end up; the write penalty | write to a snapshotted volume in both modes | step | S | P3 | DR, NLA | → §5.2 |  |
| `sto-write-cache` | live | Write-back vs write-through | write-back is fast until the power fails; battery-backed cache | write, cut power with each setting | step | S | P2 | DR, NLA | write-back durability (the scoping note's §5 "no write cache" is a performance tier: a separate idea) |  |
| `sto-ssd-internals` | live | Inside an SSD | FTL, erase blocks, write amplification, TRIM, wear | write and overwrite, see erase cycles | step | M | P2 | OS, NLA | `ossim-disk-scheduling` hdd-vs-ssd |  |
| `sto-iops-latency` | live | IOPS, throughput and latency | queue depth and block size trade them off | sliders for block size, queue depth, device | expl | S | P2 | NLA, DR | NLA T27 |  |
| `sto-nas-vs-san` | w3 | File vs block storage | NAS (NFS/SMB) vs SAN (iSCSI/FC): who owns the filesystem | mount both, connect two clients | step | S | P3 | NLA | NLA T25 |  |
| `sto-ec-vs-replication` | live | Erasure coding vs replication | overhead vs failures tolerated vs rebuild cost (k+m) | choose k, m, replicas; fail disks | expl | S | P2 | NLA, DR | cephsim → §5.7 |  |
| `sto-ceph-min-size` | live | size and min_size | `size=2 min_size=2` blocks I/O on one failure; 3/2 doesn't | fail OSDs under each setting, try to write | step | S | P2 | NLA, DR | cephsim, faultline `sizeTwo`, scoping §5, DR S2/P05 → §5.7 |  |
| `sto-ceph-down-out` | live | down vs out | down is degraded and nothing moves; out triggers rebalancing after a timer | stop an OSD, let time pass | step | S | P2 | NLA, DR | cephsim |  |
| `sto-crush-failure-domain` | live | Failure domain in a placement rule | same data, rule by host vs by rack; then lose a rack | switch the rule, kill a rack | step | S | P2 | NLA, DR | cephsim `brokenRule` |  |
| `sto-smallest-disk-caps` | live | One small or full disk caps the pool | the fullest OSD sets MAX AVAIL; uneven hosts fill first | add mismatched disks, fill the pool | expl | S | P2 | NLA, DR | cephsim, scoping note §5 |  |
| `sto-sync-async-replication` | live in `db-replication` | Synchronous vs asynchronous replication | RPO 0 at the cost of latency vs lag and data loss on failover | write, fail the primary at different moments | step | S | P2 | DR, NLA | → §5.7 (with `ha-db-replication`) |  |
| `dr-rpo-rto` | live | RPO and RTO | how much data and how much time you lose, on one timeline | place backups and an incident, measure loss | expl | S | P2 | DR | DR scenarios |  |
| `dr-site-failover` | w3 | Site failover | DNS/GSLB moves users; what doesn't follow (sessions, IP-bound licences) | lose a site, fail over, fail back | step | M | P3 | DR | DR S1, S12, S14 |  |
| `dr-correlated-failure` | w3 | One power strip under three replicas | redundancy that shares one hidden dependency | add dependencies, fail the PDU | step | S | P3 | DR | faultline `onePdu`: a preset on the imported faultline |  |
| `dr-alert-to-nobody` | w3 | The alert that reaches nobody | the alert path depends on the system that failed | fail the site, follow the alert | step | S | P3 | DR | DR S1 |  |

### 4.7 High availability and distributed systems

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `ha-multimaster-conflict` | live | Multi-master replication with a conflict | concurrent writes on two masters; last-writer-wins, versions, what is lost | write on both sides of a partition, heal it | step | M | B1 | DR, NLA, WIN2 | proposal first batch; NLA T55 → §5.7 |  |
| `ha-quorum-split-brain` | live | Quorum and split-brain | majority keeps one side alive; even counts and witnesses; fencing | partition a cluster of 2–5 nodes, add a witness | step | S | P1 | NLA, DR, WIN2 | NLA T52–53; cephsim MON quorum → §5.7 |  |
| `ha-fencing` | live in `quorum-split-brain` | Fencing (STONITH) | why a node must be killed before its resources move | hang a node with and without fencing | step | S | P2 | NLA | NLA T53 → §5.7 |  |
| `ha-vrrp-failover` | w3 · queued | VRRP failover | master election, virtual IP, preemption, gratuitous ARP | fail and restore the master | step | S | P2 | NLA, URM | NLA T54 |  |
| `ha-db-replication` | live | Replication lag and failover | async replicas lag; failover loses the tail; reading your own writes | write, read from a replica, fail the primary | step | S | P2 | NLA, DR | NLA T55 → §5.7 |  |
| `ha-cap` | live | CAP under partition | a partitioned system picks consistency or availability | partition, issue reads and writes in CP and AP modes | step | S | P2 | NLA, DR |  |  |
| `ha-raft` | live | Raft leader election and log replication | terms, votes, majority commit | kill leaders, partition, step messages | step | M | P2 | NLA | → §5.7 |  |
| `ha-lamport-clocks` | w3 | Logical clocks | Lamport and vector clocks order events without a shared clock | send messages between three processes | step | M | P3 | NLA |  |  |
| `ha-two-phase-commit` | w3 | Two-phase commit | prepare/commit, and the coordinator crash that blocks everyone | crash participants and the coordinator | step | S | P3 | NLA |  |  |
| `ha-consistent-hashing` | live | Consistent hashing | adding a node moves 1/n of keys, mod-n moves almost all | add and remove nodes in both schemes | expl | S | P2 | NLA | relates to CRUSH in `app-cephsim` |  |
| `ha-never-zero-spof` | w3 | No system has zero SPOFs | the implicit authorities: identity, naming, time, change, operator | remove each authority, see what fails | step | S | P3 | DR | faultline authorities: a preset on the imported faultline |  |

### 4.8 Performance and capacity

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `perf-utilisation-latency` | live | Latency near full utilisation | waiting time explodes as ρ → 1 | slider for load, watch the queue and latency | expl | S | P2 | DR, NLA, OS | dc-sim `three_tier_chain` |  |
| `perf-littles-law` | w3 · queued | Little's law | L = λW in a shop, a server, a build farm | change arrival rate and service time | expl | S | P2 | DR | dc-sim |  |
| `perf-tail-latency` | w3 · queued | Tail latency and fan-out | p99 decouples from the mean; fan-out makes the tail common | sliders for variability and fan-out | expl | S | P2 | DR, NLA | dc-sim `tail_decoupling` |  |
| `perf-retry-storm` | w3 · queued | Retry storms and metastable collapse | retries keep a recovered system down; backoff, jitter, admission control | spike the load, toggle retry policies | step | S | P2 | DR, NLA | dc-sim `metastable_collapse` |  |
| `perf-rate-limiting` | w3 · queued | Token bucket vs leaky bucket | bursts allowed vs smoothed | send bursts through each limiter | step | S | P2 | NLA, URM |  |  |
| `perf-cache-hit-ratio` | w3 | Cache hit ratio and latency | a few percent of hit ratio dominates average latency | sliders for hit ratio and miss cost | expl | S | P3 | OS, ARH |  |  |
| `perf-goodhart-teams` | w3 | Local optimisation, global degradation | teams meeting their own metric hurt the whole | tune each team's target, watch the system | expl | M | P3 | DR | dc-sim `goodhart` |  |
| `perf-autoscaling-lag` | w3 | Autoscaling lag | provisioning lead time vs load spikes; spot preemption | spike the load with different lead times | expl | S | P3 | DR, NLA | dc-sim `resource_provisioning` |  |
| `perf-slo-error-budget` | w3 · queued | SLOs and error budgets | burn rate, fast and slow burn alerts | inject incidents, watch the budget | expl | S | P2 | NLA, DR | NLA T40, dc-sim |  |
| `perf-game-tick-server` | w3 | Authoritative tick server | a fixed tick, server-side line of sight, why clients lag | step ticks, move players, add latency | step | M | P3 | URM | agentvsagent |  |

### 4.9 Computer architecture, OS gaps and automata

ossimulator covers the OS course; these fill small gaps or extend the imported architecture labs.

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `arh-cache-mapping` | w3 · queued | Cache mapping | direct-mapped vs set-associative; conflict misses | feed addresses, change associativity | step | M | P2 | ARH, OS |  |  |
| `arh-pipeline-hazards` | w3 · queued | Pipeline hazards | data hazards, stalls, forwarding, branch flush | step instructions through five stages | step | M | P2 | ARH | pairs with `spl-spectre-meltdown` |  |
| `arh-mesi` | w3 | MESI coherence on its own | the states of one cache line across cores | issue reads and writes per core | step | S | P3 | ARH | split from `spl-multicore-mesi` |  |
| `arh-twos-complement` | w3 | Two's complement and overflow | signed integers and the wrap | add numbers, watch flags | expl | S | P3 | ARH |  |  |
| `arh-floating-point` | w3 | IEEE 754 | sign/exponent/mantissa; why 0.1 + 0.2 ≠ 0.3 | toggle bits, type numbers | expl | S | P3 | ARH |  |  |
| `arh-endianness` | w3 | Endianness | byte order in memory and on the wire | write values, read them as bytes | expl | S | P3 | ARH, URM |  |  |
| `os-context-switch-cost` | w3 | What a context switch costs | saved state, TLB and cache warmup | switch at different rates | expl | S | P3 | OS | ossim covers mode vs process switch |  |
| `aut-regex-to-nfa` | w3 | Regex to NFA to DFA | Thompson construction and subset construction | type a regex, step the constructions | step | M | P3 | AUT | pairs with `spl-automata`, `lnx-regex-match` |  |

### 4.10 Radio and crisis communications

Mostly covered by the 50ohm applets and the radio labs (§2.1, §2.5). New ideas where nothing exists:

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `ham-superhet-image` | w3 | Superheterodyne and the image frequency | mixing to an IF, and the second frequency that also lands there | tune the LO, move a signal onto the image | expl | M | P3 | HAM | 50ohm `ueberlagerungsempfaenger_*`, `spiegelfrequenzen` |  |
| `ham-swr` | w3 | SWR and standing waves | mismatch reflects power; standing wave on the line | change load impedance, watch the wave | expl | M | P3 | HAM | 50ohm `swr*` |  |
| `ham-ionosphere-muf` | w3 | Ionosphere, MUF and the dead zone | layers by day and night, skip distance, the zone nobody hears | change time of day and frequency | expl | M | P3 | HAM | 50ohm `ionosphaere*`, `muf_luf_*`; near `50ohm-skip-distance` |  |
| `ham-fec-hamming` | w3 | Hamming code | correcting one bit error with parity bits | flip bits, decode | step | S | P3 | HAM, URM | 50ohm `fehlerkorrektur` → §5.13 |  |
| `ham-multiple-access` | w3 | FDMA, TDMA, CDMA | three ways to share a channel | add users to each scheme | expl | S | P3 | HAM, URM | 50ohm `vielfachzugriff` |  |
| `ham-qam-ofdm` | w3 | QAM and OFDM | constellation size vs noise; subcarriers | change order and SNR, watch errors | expl | M | P3 | HAM, URM | 50ohm `qam`, `ofdm`; extends `50ohm-qpsk` |  |
| `ham-shannon` | w3 | Shannon–Hartley | capacity from bandwidth and SNR | sliders for B and SNR | expl | S | P3 | HAM, URM | 50ohm `shannon_hartley_gesetzt` |  |
| `ham-packet-aprs` | w3 | Packet radio and APRS | CSMA on a shared channel, digipeaters, path aliases | send beacons through digipeaters | step | M | P3 | HAM | 50ohm `paketvermittelte_netzwerke` |  |
| `ham-fft-waterfall` | w3 | FFT and the waterfall | sample rate sets the span, FFT size sets the resolution | change sample rate and FFT size | expl | M | P3 | HAM | HamMonitor `DESIGN.md` |  |
| `ham-ctcss` | w3 | CTCSS tone squelch | a sub-audible tone opens the receiver | key up with and without the tone | step | S | P3 | HAM | HamMonitor `ctcss.py` |  |
| `ham-lora-css` | w3 | LoRa chirp spread spectrum | chirps, spreading factor vs airtime vs range | change SF and bandwidth | expl | S | P3 | HAM | idea only (Lora-Wideband-Decoder is noncommercial) |  |
| `ham-fsk-psk-ask` | w3 | ASK, FSK and PSK | three ways to put bits on a carrier | type bits, switch modulation | expl | S | P3 | HAM, URM | SigDigger (idea only) |  |
| `ham-adsb-frame` | w3 | Decoding an ADS-B frame | Mode S frame fields, CPR position | step through one frame | step | S | P3 | HAM | intercept (idea only) |  |
| `kk-directed-net` | w3 | Directed net vs free-for-all | an NCS turns contention into a queue | let stations call with and without an NCS | step | S | P3 | KK | KK1 slides |  |
| `kk-priority-traffic` | w3 | Priority traffic and ACK | routine/priority/emergency preemption, acknowledgement and retry | inject traffic of each priority | step | S | P3 | KK | KK1/KK2, `KK_Operativni_Prirucnik.docx` |  |
| `kk-backup-ncs` | w3 | Backup NCS takeover | the net survives losing its control station | silence the NCS mid-traffic | step | S | P3 | KK | KK2 slides |  |
| `kk-gateway-tiers` | w3 | Multi-tier relay through a gateway | local nets, gateways and delay to the coordination level | send a message from field to HQ | step | M | P3 | KK | KK2 slides |  |

### 4.11 Reference posters and classroom tools

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `ref-ports` | w3 | Well-known ports | the ports students meet, grouped by service | filter by layer and protocol | ref | S | P3 | URM, UL |  |  |
| `ref-http-status` | w3 | HTTP status codes | the classes and the codes that matter | filter by class | ref | S | P3 | URM |  |  |
| `ref-linux-dirs` | w3 | The Linux directory tree | FHS: what lives where and why | click directories | ref | S | P3 | UL | UL ch05 |  |
| `ref-protocol-headers` | w3 | Header poster | Ethernet, IPv4, IPv6, TCP, UDP headers side by side | hover fields | ref | S | P3 | URM | overlaps `spl-l2l3-protocols` |  |
| `tool-countdown` | w3 | Exercise countdown | a projector-sized timer for in-class exercises | set and start | tool | S | P3 | all |  |  |
| `tool-quick-poll` | w3 | Quick poll | students answer A–D from phones, results on the projector | ask, collect, reveal | tool | M | P3 | all | needs a server or a shared-state capability; out of scope for static pages today |  |

### 4.12 Finance basics for IT managers

The money vocabulary an IT manager meets in budgets, purchases and talks with finance, each term as a mechanism
to move, not a glossary card. Most entries show **one purchase seen two ways** (cash vs expense, nominal vs
discounted, list price vs five-year cost), which is the contrast IT managers usually miss. Generic principles only:
no tax law, no products; money is in euros and the fiscal year's first month is a parameter.

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `fin-capex-opex` | w3 · building | CapEx vs OpEx: one purchase, three views | buying puts the cash out on day one but the expense is spread over the useful life as depreciation, and the asset sits on the balance sheet meanwhile; a service is paid and expensed month by month; which budget each draws on, why operating profit before depreciation (EBITDA) looks better with CapEx, and the capitalisation threshold below which a purchase is simply expensed | spend the same amount as a bought server or a five-year service, scrub through the months and watch cash, expense and book value side by side; move the threshold and the price | expl | S | P1 | FIN, DR | DR `student/handbook/constraints.md` (capex remaining vs opex headroom, approval thresholds); hub of the shared ledger model → §5.23 |  |
| `fin-depreciation` | w3 · queued | Depreciation and book value | straight-line vs declining-balance depreciation over a useful life, with a residual value; software (a perpetual licence) amortises the same way; retiring or selling early books the remaining book value as a loss or a gain | set cost, life, residual value and method; retire the asset in year *n* and see the write-off | expl | S | P2 | FIN | shares the asset model with `fin-refresh-cycle` → §5.23 |  |
| `fin-refresh-cycle` | w3 · queued | Refresh cycles and economic life | capital cost per year falls as the cycle lengthens while support, failures and lost staff time rise with age; the sum has a minimum (the economic life); refreshing a whole fleet at once makes a spending wall every *n* years | for a fleet of devices choose the cycle length and how many staggered cohorts, run ten years, read yearly cash, depreciation and age-related cost | expl | M | P2 | FIN, DR | asset model with `fin-depreciation` → §5.23 |  |
| `fin-accruals-cash` | w3 · queued | Accruals vs cash: a year of invoices | an expense belongs to the month the service is used, not the month it is paid: a prepaid annual support contract is spread over twelve months, December's service invoiced in January is accrued in December | step through a year of IT invoices (prepaid support, colocation billed quarterly in arrears, a late invoice), post each one, watch the cash line and the expense line part and meet again at year end | step | M | P1 | FIN | the ledger model → §5.23 |  |
| `fin-budget-variance` | w3 · queued | Budget vs actuals: reading a variance | a budget phased by month against actuals; a variance splits into volume (more used), price (dearer per unit) and timing (an invoice late or early); "under budget in October" is often a missing invoice; the run-rate forecast to year end; use-it-or-lose-it phasing as a preset | step the months of a cloud and licence budget, inject more usage, a price rise and a late invoice, read each part of the variance and the year-end forecast | step | M | P2 | FIN | builds on `fin-accruals-cash` (timing variance is an accrual) → §5.23 |  |
| `fin-tco` | w3 · queued | Total cost of ownership | the purchase price is a small part of five years of power, space, support, staff time, training, migration and the exit at the end; the cheaper purchase can be the dearer option; build-vs-buy (staff time as a cost) as a preset | build two options line by line, switch cost categories on and off, move the horizon, watch the ranking flip | expl | S | P1 | FIN, DR | DR handbook price list (colocation per kW-month, remote hands, MSP onboarding, cloud egress) |  |
| `fin-npv-discounting` | live | Time value of money and NPV | a euro next year is worth less than a euro today; the discount rate is the cost of capital (what the money would earn or cost elsewhere); NPV sums the discounted cash flows | drag cash flows on a timeline, move the discount rate, watch nominal and discounted bars and the NPV change sign | expl | S | P1 | FIN | the discounting every investment page reuses → §5.23 |  |
| `fin-roi-payback-npv` | w3 · queued | ROI, payback and NPV disagree | three yardsticks rank the same projects differently: simple ROI ignores timing, payback ignores everything after the payback date, NPV depends on the rate; IRR is the rate at which NPV is zero | shape two projects' cash flows (a quick win and a slow large return), read the three rankings, find the rate at which they swap | expl | S | P2 | FIN | needs `fin-npv-discounting` |  |
| `fin-fixed-variable` | w3 · queued | Fixed, variable and step costs; break-even | a platform's fixed cost spread over more users lowers the average cost; capacity comes in steps; the next user's marginal cost is not the average; the break-even volume between running it yourself and paying per user | move the user count and utilisation, compare an in-house platform with a per-user service, watch average and marginal cost and the break-even point | expl | S | P2 | FIN, DR | idle headroom costs money, too little costs latency: link `utilisation-latency` → §5.23 |  |
| `fin-chargeback` | w3 · queued | Showback and chargeback | shared IT cost allocated to departments by a key (users, VMs, storage, tickets): the key decides who pays; charging a fixed cost per unit means a department that leaves raises everyone else's price, and the next one leaves (the spiral) | pick allocation keys, move each department's usage, switch from showback to chargeback, let a department leave | expl | M | P2 | FIN | unit cost from `fin-fixed-variable` |  |
| `fin-cloud-commitment` | w3 · queued | Cloud commitment vs on-demand | a commitment buys a discount on usage paid for whether used or not; break-even utilisation is committed price ÷ on-demand price; cover the base load, leave the peaks on demand; a longer term deepens the discount and the risk | draw a year of usage, set the commitment level and term, watch unused commitment against on-demand spend and the total | expl | S | P1 | FIN, DR | DR handbook cloud prices; `perf-autoscaling-lag` (§4.8) |  |
| `fin-lease-vs-buy` | w3 · queued | Lease vs buy | the same hardware bought for cash, bought on a loan or leased: cash, expense and balance sheet differ, and the comparison is fair only when discounted at the cost of capital; at the end of the term buy out the residual, return or extend | choose the financing, lease rate, term and residual; compare the cash timeline, the yearly expense and each option's NPV | expl | M | P2 | FIN | needs `fin-npv-discounting`; ledger model → §5.23 |  |
| `fin-licence-models` | w3 · queued | Perpetual licence or subscription | a perpetual licence is a large upfront purchase (capitalised, amortised) plus yearly maintenance at a share of the list price; a subscription is a recurring expense; letting maintenance lapse and coming back costs back-fees; per-user and per-core metrics grow differently as the hardware grows | set user growth, maintenance share, yearly price rises and the horizon; find the crossing year; let maintenance lapse in year 3; switch the metric | expl | S | P2 | FIN | ledger model → §5.23 |  |
| `fin-prepay-discount` | w3 · queued | Pay upfront for a discount? | a discount for paying early is an interest rate in disguise, to compare with the cost of capital; payment terms (30, 60, 90 days) move cash, not cost; three years prepaid ties up working capital and the cash buffer | set the discount, years prepaid and payment terms; read the implied annual rate against the cost of capital and watch the cash balance | expl | S | P2 | FIN | needs `fin-npv-discounting` |  |
| `fin-indexation-fx` | w3 · queued | Inflation, indexation and currency in a multi-year contract | a fixed price loses real value to inflation; an indexation clause passes inflation on (with a cap or a floor); a price in a foreign currency adds exchange-rate risk; nominal vs real euros | run a five-year contract along inflation and exchange-rate paths, choose fixed, indexed or capped, and the currency | expl | S | P3 | FIN |  |  |
| `fin-contingency-reserve` | w3 · queued | Contingency reserve: P50 vs P80 | each line of a project estimate is a range skewed towards overruns, so the total's median is above the sum of the most likely values; the reserve buys a level of confidence | set ranges for the line items, run many trials, choose the confidence level, read the reserve it needs | expl | M | P2 | FIN, DR | DR P07 brief (one-off spend cap, approval threshold) |  |
| `fin-downtime-cost` | w3 · queued | What an hour down costs, and what a nine is worth | cost of downtime = lost revenue + idle staff + recovery work + penalties, varying with the hour and the day; each extra nine removes less downtime and costs more redundancy | set the cost components and the availability target; compare the expected yearly downtime cost with the yearly cost of the HA option | expl | S | P1 | FIN, DR | `rpo-rto` gives the hours down; `perf-slo-error-budget` (§4.8) → §5.23 |  |
| `fin-ale-risk` | w3 · queued | Expected annual loss and the price of a control | ALE = single loss expectancy × annual rate of occurrence; a control is worth its yearly cost when it removes more ALE than that; accept, reduce, transfer (insurance) or avoid; a rare large loss hides behind a small average | add risks with a loss and a frequency, buy controls and insurance, watch ALE, control cost and the worst simulated year | expl | S | P2 | FIN, DR, SEC | `ransomware-321` (an immutable copy as a control), `faultline` → §5.23 |  |
| `fin-sunk-cost` | w3 · queued | Sunk cost: decide looking forward | money already spent, and an old system's remaining book value, is the same whichever way you choose, so only the cost still to come and the benefit still to come count; the opportunity cost of the people tied up | step a project that overruns; at each gate continue, stop or switch, and compare deciding by "already spent" with deciding by "still to spend" | step | S | P2 | FIN | the write-off from `fin-depreciation` |  |
| `fin-cost-of-delay` | w3 · queued | Cost of delay: which project first | each project loses value for every week it waits; ordering by value lost per week ÷ duration beats ordering by size or by who asks loudest | reorder three to five projects in a queue and watch the total value lost | expl | S | P3 | FIN |  |  |

**Croatian titles.**

- `fin-capex-opex` — Kapitalni izdaci ili operativni troškovi: jedna kupnja, tri pogleda
- `fin-depreciation` — Amortizacija i knjigovodstvena vrijednost
- `fin-refresh-cycle` — Ciklus zamjene opreme i ekonomski vijek trajanja
- `fin-accruals-cash` — Trošak ili plaćanje: vremenska razgraničenja kroz godinu računa
- `fin-budget-variance` — Plan i ostvarenje: čitanje odstupanja
- `fin-tco` — Ukupni trošak vlasništva (TCO)
- `fin-npv-discounting` — Vremenska vrijednost novca i neto sadašnja vrijednost (NSV)
- `fin-roi-payback-npv` — Povrat ulaganja, razdoblje povrata i NSV ne slažu se
- `fin-fixed-variable` — Fiksni, varijabilni i stepenasti troškovi; točka pokrića
- `fin-chargeback` — Raspodjela troškova IT-a: prikaz ili interna naplata
- `fin-cloud-commitment` — Ugovorena potrošnja u oblaku ili plaćanje po potrošnji
- `fin-lease-vs-buy` — Leasing ili kupnja
- `fin-licence-models` — Trajna licenca ili pretplata
- `fin-prepay-discount` — Popust za plaćanje unaprijed i rokovi plaćanja
- `fin-indexation-fx` — Inflacija, indeksacija i tečaj u višegodišnjem ugovoru
- `fin-contingency-reserve` — Pričuva za nepredviđene troškove: P50 ili P80
- `fin-downtime-cost` — Koliko košta sat zastoja i koliko vrijedi jedna devetka
- `fin-ale-risk` — Očekivani godišnji gubitak (ALE) i cijena zaštite
- `fin-sunk-cost` — Nepovratni trošak: odlučuje se gledajući naprijed
- `fin-cost-of-delay` — Trošak kašnjenja: koji projekt prvi

**Where Croatian practice commonly differs** (one line each, for the page's notes, not the model):

- `fin-capex-opex`, `fin-depreciation`: firms often book depreciation at the maximum rates the profit-tax rules allow, so
  computer equipment is commonly written off over two years, shorter than its useful life; low-value items (sitni
  inventar) are often expensed when put into use.
- `fin-lease-vs-buy`: firms reporting under the Croatian standards (HSFI) usually still expense operating-lease
  instalments, where the international standard puts a right-of-use asset and a liability on the lessee's balance sheet.
- `fin-indexation-fx`: Croatia has used the euro since 2023, so the currency risk lies in contracts priced in another
  currency (often US dollars).
- `fin-budget-variance`, `fin-accruals-cash`: the fiscal year is usually the calendar year (the DR estate uses April to
  March, hence the parameter).

**Suggested order for a course playlist** (`courses/fin-it-managers.json`, "Osnove financija za IT menadžere /
Finance basics for IT managers", `lang: hr`; text only, no file yet):

1. *Jedna kupnja, dva pogleda / One purchase, two views*: `fin-capex-opex`, `fin-depreciation`, `fin-accruals-cash`,
   `fin-budget-variance`
2. *Novac kroz vrijeme / Money over time*: `fin-npv-discounting`, `fin-roi-payback-npv`, `fin-cost-of-delay`,
   `fin-sunk-cost`, `fin-indexation-fx`
3. *Koliko stvarno košta / What it really costs*: `fin-tco`, `fin-fixed-variable`, `fin-chargeback`, `fin-refresh-cycle`
4. *Kupiti, unajmiti ili se pretplatiti / Buy, lease or subscribe*: `fin-lease-vs-buy`, `fin-licence-models`,
   `fin-cloud-commitment`, `fin-prepay-discount`
5. *Rizik izražen u novcu / Risk in money*: `fin-downtime-cost`, `fin-ale-risk`, `fin-contingency-reserve`, then the
   existing `rpo-rto` and `ransomware-321` as the technical side of the same losses

**Suggested `learn.json` placement** (outline only; add nodes as their sims become ready). A new area between
`performance` and `linux`, since none of the existing areas is about money:

- **`money`**: "Novac: koliko IT stvarno košta" / "Money: what IT really costs"; blurb "Proračun, ulaganja i rizik
  riječima financija: kapitalni izdaci, amortizacija, TCO, NSV." / "Budgets, investments and risk in the words
  finance uses: CapEx, depreciation, TCO, NPV." (88 / 87 chars)
  - `books` "Kako financije knjiže kupnju" / "How finance books a purchase"
    - `capex-opex`: `fin-capex-opex`, `fin-lease-vs-buy`
    - `depreciation`: `fin-depreciation`, `fin-refresh-cycle`
    - `accruals`: `fin-accruals-cash`
    - `variance`: `fin-budget-variance`, `fin-accruals-cash`
  - `worth-it` "Isplati li se?" / "Is it worth it?"
    - `time-value`: `fin-npv-discounting`, `fin-indexation-fx`
    - `yardsticks`: `fin-roi-payback-npv`, `fin-cost-of-delay`
    - `looking-forward`: `fin-sunk-cost`
  - `real-cost` "Koliko stvarno košta" / "What it really costs"
    - `tco`: `fin-tco`
    - `per-user`: `fin-fixed-variable`, `fin-chargeback`
    - `refresh`: `fin-refresh-cycle`
  - `buying` "Kupiti, unajmiti ili se pretplatiti" / "Buy, lease or subscribe"
    - `lease`: `fin-lease-vs-buy`
    - `licences`: `fin-licence-models`
    - `cloud`: `fin-cloud-commitment`
    - `paying`: `fin-prepay-discount`
  - `risk` "Rizik izražen u novcu" / "Risk in money"
    - `downtime`: `fin-downtime-cost`, `rpo-rto`
    - `expected-loss`: `fin-ale-risk`, `ransomware-321`
    - `reserve`: `fin-contingency-reserve`
- Also in existing leaves: `fin-downtime-cost` in `resilience › disaster › rpo-rto`; `fin-ale-risk` in
  `security › attacks › ransomware`.

---

## 5. Duplicates, overlaps and shared simulators

Where several entries show the same mechanism, the recommendation is **one simulator with presets** (a
preset is a scenario, like ossimulator's `?scenario=`), or a clear home with links from the others.

| # | Cluster | Entries | Recommendation |
|---|---|---|---|
| 5.1 | **First-match rule evaluation** | `net-rule-first-match`, `urm-firewall`, `lnx-access-decision`, `lnx-netfilter-path`, `lnx-pam-stack`, `win-ntfs-share-effective`, UL ch22 pg_hba | Build one rule-table evaluator with presets: router ACL, stateless firewall, `pg_hba.conf`. Keep netfilter (a path through hooks, not one list), PAM (control flags, not first match), NTFS (deny wins, not first match) and the most-specific-wins rules (`win-dhcp-scope-options`, `win-fgpp`) separate, because their rules are different; note the contrast on each page. |
| 5.2 | **Snapshots and copy-on-write** | `sto-backing-chains` (B1), `lnx-lvm-snapshot`, `lnx-thin-overcommit`, `lnx-cow-filesystem`, `sto-cow-vs-row`, `win-vss`, `win-hyperv-checkpoints` | `sto-backing-chains` gets presets for qcow2, VHDX/AVHDX (covers `win-hyperv-checkpoints`) and VMware. LVM snapshot fill, thin overcommit and CoW filesystem stay separate pages on the same block-grid view. `sto-cow-vs-row` and `win-vss` can become presets of `lnx-cow-filesystem`. |
| 5.3 | **Backup, dedup and redundancy** | `sto-backup-diff-incr` (B1), `sto-dedup-chunking` (B1), `sto-dedup-file-funnel`, `sto-retention-gfs`, `sto-restore-drill`, `lnx-send-receive`, `lnx-mirror-not-backup`, `lnx-raid-rebuild`, `lnx-exit-status`, `ossim-raid-cache`, `spl-zfs-btrfs-lab` | Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. `lnx-send-receive` is a preset of `sto-backup-diff-incr`. The restore drill and `lnx-exit-status`'s pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in `ossim-raid-cache`: link it rather than building RAID again; build only `lnx-mirror-not-backup` and `lnx-raid-rebuild`, which it doesn't cover. |
| 5.4 | **DNS** | `inet-dns-resolution`, `inet-dns-ttl-cache`, `inet-dns-secondary-expiry`, `inet-dns-split-brain`, `win-dns-zone-types`, `win-dns-dynamic-update`, `win-dns-scavenging`, DR S6 | Resolution and TTL can share one page with two modes, but each is a full 3–5 minute demo, so keep two pages on one model. Secondary expiry and split-brain are presets of one "zone servers over time" page. |
| 5.5 | **TLS and certificates** | `inet-tls-handshake`, `inet-cert-chain`, `sec-digital-signature`, `sec-pki-revocation`, `inet-acme-renewal`, DR S4 | Handshake and chain are separate pages. Certificate expiry from the DR estate is a preset of `inet-cert-chain`. Revocation and ACME extend the chain page if they are built at all. |
| 5.6 | **Kerberos** | `win-kerberos`, NLA T57 | One page, one model; the Linux course links it (MIT Kerberos and AD use the same exchanges). |
| 5.7 | **Replication, quorum and consensus** | `ha-multimaster-conflict` (B1), `win-ad-replication`, `ha-db-replication`, `sto-sync-async-replication`, `ha-quorum-split-brain`, `ha-fencing`, `win-failover-cluster`, `ha-raft`, cephsim MON quorum, `sto-ceph-min-size`, faultline `sizeTwo`, `sto-ec-vs-replication` | B1 multi-master gets presets "database row" and "AD attribute" (covers most of `win-ad-replication`). `ha-db-replication` and `sto-sync-async-replication` are one page. `ha-quorum-split-brain` gets presets for a Linux HA cluster, a Windows failover cluster with a witness, and Ceph monitors; fencing is its second step. Raft stays separate (it is the mechanism, not the symptom). size/min_size gets **one** native page (`sto-ceph-min-size`) and the cephsim and faultline samples link to it. |
| 5.8 | **TCP** | `urm-tcp-handshake`, `urm-flow-control`, `urm-window`, `net-tcp-teardown`, `net-tcp-retransmit`, `net-tcp-congestion`, `net-tcp-states`, `net-tcp-vs-udp-loss` | Separate pages, one shared sequence-chart view and one TCP model. Teardown is a second mode of the ported handshake page. The state machine is the union of the others; build it last or not at all. |
| 5.9 | **A packet's path** | `net-encapsulation`, `net-arp-local-remote`, `net-hop-rewrite`, `net-traceroute`, `net-packet-journey`, `sec-wireguard` / tunnels, `spl-l2l3-protocols` | One topology-with-headers model for the path pages (ARP, hop rewrite, traceroute). Tunnels (VXLAN, GRE, WireGuard, IPsec) are presets of `net-encapsulation`. `net-packet-journey` is the capstone and links into each, like ossimulator's `journey`. |
| 5.10 | **Switching loops** | `net-stp`, `net-broadcast-storm` | One page: the storm is step 1 (STP off), STP is step 2. |
| 5.11 | **Routing protocols** | `net-distance-vector`, `net-link-state-spf`, `inet-bgp-path-selection` | Separate pages on one graph view. |
| 5.12 | **NAT and port publishing** | `urm-nat`, `urm-pat`, `net-port-forwarding`, `lnx-container-ports`, `net-cgnat` | `urm-nat` and `urm-pat` are near-duplicates (8,253 bytes each, same layout); merge them into one page with two modes on port. Port forwarding and container port publishing are both DNAT: one page with a "container" preset. |
| 5.13 | **Error detection and correction** | `net-crc`, `ham-fec-hamming`, 50ohm `fehlererkennung` | One page, parity → CRC → Hamming as steps. |
| 5.14 | **Pipelines** | `lnx-pipes-redirection`, `win-powershell-objects` | Separate pages; the PowerShell page is built as a comparison against the bash one. |
| 5.15 | **Boot and service ordering** | `lnx-boot-chain`, `win-boot`, `lnx-systemd-ordering`, `win-services` | One boot-chain page with Linux and Windows presets. One dependency-graph page with systemd and Windows-services presets. |
| 5.16 | **Firewall zones** | `lnx-firewalld-zones`, `win-firewall-profiles` | One page, two presets; both pick a rule set by where the packet comes from. |
| 5.17 | **Containers** | `lnx-namespaces`, `lnx-cgroups`, `lnx-overlayfs-layers`, `lnx-container-volumes`, `lnx-userns-mapping` | Separate pages (each is one concept) on one container diagram. |
| 5.18 | **Imported duplicates** | `lvm-topology-lab` vs `-v2`; three ham-modes pages; `radio-sigurnost-2026` vs `radio-cybersecurity`; `amdahl-simulator` vs `webserver-amdahl` | Import v2 and reference-v2 only. The two radio-security pages carry the same material in two formats: import one (the page has the hr/en toggle, the slides have the arrow keys) and decide which. Webserver Amdahl becomes a preset of Amdahl after import. |
| 5.19 | **Duplicated across books** | URM and `urm-sveucilisni-udzbenik` share the same 14 interactive pages | Port once; both books link the simdeck copy (→ report). |
| 5.20 | **Planned twice** | URM's ~40 planned interactive cards (`meta/plan-interaktivne-stranice.md` §6) and §4.1 here | The same concepts are planned in two places. Recommend simdeck builds them and the book embeds or links the simdeck page (→ report). |
| 5.21 | **Windows infrastructure: AD, DNS and DHCP together** | `win-dc-promotion`, `win-dns-srv-records`, `win-domain-logon`, `win-dns-dynamic-update`, `win-dhcp-dns-update`, `win-dns-scavenging`, `win-sysvol-dfsr`, `win-time-hierarchy`, `win-ad-backup-restore`, `win-ou-vs-group`, `win-ipam-address-plan` | One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to `inet-ntp-sync` for the protocol. USN rollback is a preset next to `sto-backing-chains` (the same "revert a snapshot" act, a different victim). The address plan reuses `urm-vlsm`'s arithmetic. |
| 5.22 | **Update approval** | `win-wsus-groups`, `win-update-rings`, `lnx-deploy-strategies` (canary) | Groups with approvals and rings with deferrals are the same staged-rollout idea; one page with two presets. The canary deploy in Linux links to it. |
| 5.23 | **Money: one ledger, and costs on top of existing models** | `fin-capex-opex`, `fin-accruals-cash`, `fin-budget-variance`, `fin-lease-vs-buy`, `fin-licence-models`, `fin-depreciation`, `fin-refresh-cycle`, `fin-npv-discounting`; and `fin-downtime-cost` ↔ `rpo-rto`, `perf-slo-error-budget`; `fin-ale-risk` ↔ `ransomware-321`, `faultline`; `fin-fixed-variable` ↔ `utilisation-latency`, `ec-vs-replication` | One shared ledger model (a month-by-month timeline with three lines: cash, expense, book value) under the capex, accruals, variance, lease and licence pages, like §5.21's shared domain; depreciation and refresh share one asset model; `fin-npv-discounting` holds the discounting the investment pages reuse, so build it first. The money pages do not repeat the technical ones: `fin-downtime-cost` takes the hours down from `rpo-rto`'s timeline (link, or an "in money" preset on `rpo-rto`) and turns an error budget's minutes into euros; `fin-ale-risk` links `ransomware-321` as a priced control; `fin-fixed-variable` links `utilisation-latency` (headroom costs money, too little costs latency) and could take `ec-vs-replication`'s overhead as a cost per usable TB preset. |

---

## 6. External material and licences

simdeck is **AGPL-3.0-or-later** (owner, 2026-10-01). It is the strongest copyleft in common use and the
"or later" keeps the upgrade path open. What it means here:

- **Network clause (§13).** Anyone who modifies a simdeck page and serves it to users must offer them the
  source. simdeck itself should do the same: every page and the index link to the source (a kit
  requirement, §7.2). While `materijali.online` sits behind basic auth, the link can point to a source
  archive on the same server, or to a public repo once there is one.
- **Single-file builds.** The build inlines the kit into each page. If the output is minified, it is no
  longer the "preferred form for modification", so the source link matters; an unminified build keeps
  every page its own source.
- **Text and code together.** AGPL covers the explanations inside the pages too. That is fine for simdeck.
  Only if you later want others to reuse the prose alone (in slides, say) would a separate CC BY-SA 4.0
  for docs help; nothing needs it now.
- **Third-party parts keep their licences.** MIT, BSD, ISC, Apache-2.0, LGPL-3.0, OFL-1.1 and CC BY 4.0
  material all combine with AGPL-3.0, with their notices kept.

What the catalogue draws on from outside your own work:

| Material | Used by | Licence | AGPL-3.0 note |
|---|---|---|---|
| 50ohm.de content and applets (DARC e.V.) | §2.5, seeds in §4.10 | CC BY 4.0 | compatible; keep attribution and a note of changes; check per applet |
| 50ohm exam questions | not used | DL-DE-BY 2.0 (Bundesnetzagentur) | don't import |
| Chart.js 4.4.1 | `spl-multicore-mesi`, 50ohm applets | MIT | compatible; vendor it, pin the version |
| jQuery 3.7.1, three.js | 50ohm applets | MIT | compatible; vendor |
| Leaflet | 50ohm applets | BSD-2-Clause | compatible; vendor it (the map applets that need online tiles are not adopted) |
| Leaflet.Maidenhead (HA8TKS) | `50ohm-maidenhead` (not adopted) | not checked | not needed |
| Marp runtime / Uncover theme | `spl-radio-security-slides` | MIT | compatible |
| Twemoji graphics | `spl-radio-security-slides` | CC BY 4.0 | attribution needed; or drop emoji (ossimulator's glyph rule forbids them anyway) |
| Lucide icons | `spl-radio-security-page` | ISC | compatible; pin and vendor instead of `@latest` |
| Google Fonts used by 11 labs | §2.1 | mostly OFL-1.1 | replace with the kit's local fonts on import |
| Atkinson Hyperlegible, JetBrains Mono (ossimulator) | candidate kit fonts | OFL-1.1 | compatible as fonts; ship the licence file |
| `assets/*.png` in single-page-labs | `spl-radio-security-page` | unknown (likely AI-generated) | flag `asset_review: true`; replace before a public release |
| HAKOM / ETSI allocation data | `spl-rf-bandplan` | public regulation | facts, not copyrightable as such; cite the source |
| RFCs | protocol pages | IETF Trust (text), BSD (code components) | cite, don't copy text verbatim at length |
| Lora-Wideband-Decoder | idea for `ham-lora-css` | PolyForm Noncommercial 1.0.0 | **incompatible**; no code |
| cityfps mapgen lab | not used | AGPL-3.0 | compatible (same licence), but not needed |
| intercept | idea for `ham-adsb-frame` | Apache-2.0 | compatible, but nothing to copy |
| SigDigger | idea for `ham-fsk-psk-ask` | LGPL-3 (LICENSE file) | compatible, nothing to copy |
| Packet Tracer / GNS3 files | presets only | Cisco/GNS3 terms | use as topology references, don't ship `.pkt` |

No external simulator code is proposed for copying. Every new entry in §4 is written fresh.

---

## 7. What this implies for the site frame and the UI kit

Requirements only; the frame and kit threads design them.

### 7.1 For the site frame (`sim.json`, `tags.json`, courses)

Measured against the frame on `main` (`docs/site-structure.md` §2, `tags.json`, `site.json`). Each sim's task
file in `docs/tasks/` already names its topic, tags and level.

**What fits as it is:**
- `topic` (one per sim, groups the home page) maps onto the catalogue's areas, and `courses/<id>.json`
  carries the catalogue's course column. A sim in several courses is simply listed in several course files.
- `class` (`stepper`, `explorer`, `reference`, `tool`) is the catalogue's Class column; `steps`, `status`
  (`ready`/`wip`), `aliases`, `related` (the §5 clusters and capstones), `origin` and `asset_review` cover
  provenance and the audit.
- `level` (`intro`, `core`, `advanced`): the tasks propose one from the courses (intro for URM, UL, WIN1 and
  AUT; advanced for NLA, WIN2 and DR; core otherwise), for the owner to adjust.
- Exceptions live in the page (`#simdeck-exceptions`), which suits the imported ossimulator and app pages.

**What the catalogue needs changed:**

| Need | Frame today | Change | Task |
|---|---|---|---|
| Topics for Windows, internet protocols and theory | 9 topics, none for these | add `windows-admin`, `internet`, `theory` | `vocabulary` |
| Tags for about 300 sims | 18 tags | add the ~85 tags listed in `docs/tasks/README.md`, with Croatian and English labels and aliases | `vocabulary` |
| Both languages (owner) | `lang` is one value, equal to `<html lang>`; labels are Croatian | `title`, `concept`, `summary`, `aliases` and tag/topic labels per language; the page switches language at runtime | `bilingual` |
| One page, several index entries | one entry per folder; course items are plain sim ids | entries for presets (`?preset=`) and ossimulator scenarios (`?scenario=`), searchable and listable in course files | `presets-in-index` |
| Attribution for CC BY imports (29 50ohm applets) | no field | an `attribution` field (or a licence list generated from `NOTES.md`), shown on the page and on a licences page | `licence` |
| Shared model code | the build inlines only files inside the sim's folder (plus the kit) | a `models/` folder inlined like the kit, so derivatives reuse a core model | `shared-models` |

Not needed any more: `audience` and `requires_network` (proposed in an earlier draft): the DR estate's
instructor map and the online-only 50ohm maps are not adopted.

- **Scale:** about 300 planned new sims, 83 adopted pages, about 60 ossimulator scenario entries. The home
  page's one search box and topic grouping has to stay usable at that size; grouping within a topic (the
  catalogue's §4.5.x subsections, for example) may become necessary.
- **Planning data stays outside the manifest:** Pri and Int belong to this catalogue, not to `sim.json`.

### 7.2 For the UI kit (controls and views many simulators need)

Counted over the §4 entries; the first four cover most of the build list.

| Shared view or control | Needed by (examples) | Rough count |
|---|---|---|
| **Message sequence chart** (lanes per party, arrows per step, an "attacker sees" overlay) | WPA, DHCP, DNS, TLS, Kerberos, TCP, SMTP, OAuth, NTP, SSH, 802.1X | ~45 |
| **Topology with moving packets** (nodes, links, a packet per step, link failure) | ARP, hop rewrite, STP, routing protocols, VRRP, quorum, BGP, anycast | ~40 |
| **Block grid** (cells for blocks/chunks/extents, colour + pattern for state) | dedup, backups, backing chains, snapshots, thin pools, RAID, SSD, CoW | ~25 |
| **Rule or table view with the matching row highlighted** | first match, MAC/ARP/routing/NAT tables, GPO, NTFS ACEs, PAM, DNS records | ~30 |
| **Decision path** (a short flowchart lit up step by step) | SELinux, netfilter, SPF/DKIM/DMARC, access decision, boot chain | ~15 |
| **Bit / field strip** (header fields, permission bits, address bits) | IPv4 header, permissions, subnet, IEEE 754, frames | ~12 |
| **Time axis** (events over time, TTLs and timers running out) | TTL cache, leases, cert expiry, retention, RPO/RTO, alert states | ~20 |
| **Small live chart** (one or two lines, updating with parameters) | TCP cwnd, queueing, tail latency, retry storm, error budget | ~15 |
| **Side-by-side compare** (two variants stepped in lockstep) | TLS 1.2 vs 1.3, fixed vs CDC chunks, TCP vs UDP, diff vs incr | ~25 |
| **Preset picker with deep link** (`?preset=`) | every page in §5's clusters | most |
| **Seeded randomness and "new topology"** | CSMA, mesh, retries, random workloads | ~15 |
| **Sliders and toggles with projector-sized labels** | every `expl` page | ~70 |

Other requirements:

- **Step counts.** Message sequences run 4–20 steps, which suits a 3–5 minute demo. Capstones
  (`net-packet-journey`) will exceed that and need a declared exception or chapters.
- **English and Croatian everywhere (owner decision).** Every native simulator and every site page
  (index, course pages) works in both languages. What this asks of the kit and the frame:
  - **A language switch** on every page, remembered across pages, with a `?lang=hr|en` deep link so a
    course page in one language opens the simulators in the same language.
  - **All visible text in string tables** (`hr`, `en`) next to the page, never hard-coded in the markup or
    the logic. Event codes stay language-neutral, as in ossimulator's `<area>.<kebab>` codes, so tests
    never depend on wording.
  - **Glossary as a component.** Croatian text keeps ossimulator's rule (English term in italics,
    Croatian in parentheses at first mention). A shared glossary file serves both languages, so a term is
    translated once for all simulators.
  - **The contract check** fails a native page that lacks a string in either language, the same way it
    fails an undefined colour token.
  - **Layout headroom.** Croatian labels run longer than English ones; the 1920×1080 no-scroll rule must be
    checked in both languages.
  - **Manifest:** `title`, `concept` and `summary` per language (`{hr, en}`), replacing the single `lang`
    field of `sim.json`. Course files pick a language; the course page is generated in it.
  - **Imported pages in one language** (ossimulator did until `93da8f8` added English) declare a `languages`
    exception, so the index can mark them instead of pretending they are bilingual.
- **Attribution footer** for CC BY imports, in both languages.
- **Source link** on every page and on the index (AGPL-3.0 §13, see §6), with the licence name.
