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
| `CMP` | Compliance and procedures for IT managers | owner, 2026-11-07: same audience as `FIN` |
| `SET` | Rad na setu / Working on set (crew safety and departments) | owner, 2026-11-08: for a colleague who trains film crews |
| `ARI` | Računanje na papiru / Arithmetic on paper (the four operations written in columns, any base) | owner suggestion s-002, 2026-11-12: teachers, parents and pupils, and at university to show that a base is only notation |

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

**Status, 2026-11-13** (the Status column after each ID; `python3 tools/catalogue/status.py` rewrites it): **401 of 477 entries are live**, 64 w3, 5 not adopted, 3 w3 · held, 2 w1 · held, 1 w3 · building, 1 w3 · queued.

| Area | Entries | Live | To build (wave) |
|---|---|---:|---|
| §2.1 single-page-labs → import (23 labs) | 20 | 18 | 2 w1 · held |
| §2.2 URM book interactive pages → port (14 pages) | 14 | 14 | – |
| §2.3 ossimulator → import the built pages (16 pages and the map) | 17 | 17 | – |
| §2.4 Larger apps → port | 5 | 3 | – |
| §2.5 50ohm applets → port (29 applets, CC BY 4.0; 3 maps not adopted) | 32 | 29 | – |
| §4.1 Networking basics and LAN protocols | 52 | 48 | 1 w3, 3 w3 · held |
| §4.2 Internet and application protocols | 30 | 24 | 6 w3 |
| §4.3 Security and cryptography | 17 | 15 | 2 w3 |
| §4.4 Linux | 55 | 55 | – |
| §4.5.1 Active Directory | 21 | 19 | 1 w3 · building, 1 w3 · queued |
| §4.5.2 Group Policy | 9 | 4 | 5 w3 |
| §4.5.3 DNS on Windows Server | 7 | 6 | 1 w3 |
| §4.5.4 DHCP on Windows Server | 6 | 3 | 3 w3 |
| §4.5.5 IPAM | 5 | 3 | 2 w3 |
| §4.5.6 WSUS and updates | 7 | 5 | 2 w3 |
| §4.5.7 Files, identity and the rest | 18 | 8 | 10 w3 |
| §4.6 Storage, backup and disaster recovery | 22 | 20 | 2 w3 |
| §4.7 High availability and distributed systems | 13 | 8 | 5 w3 |
| §4.8 Performance and capacity | 10 | 7 | 3 w3 |
| §4.9 Computer architecture, OS gaps and automata | 8 | 3 | 5 w3 |
| §4.10 Radio and crisis communications | 17 | 13 | 4 w3 |
| §4.11 Reference posters and classroom tools | 6 | 6 | – |
| §4.12 Finance basics for IT managers | 20 | 20 | – |
| §4.13 Compliance and procedures for IT managers | 23 | 23 | – |
| §4.14 Working on a film set | 25 | 12 | 13 w3 |
| §4.15 Antennas and radiation | 12 | 12 | – |
| §4.16 Arithmetic on paper | 6 | 6 | – |

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

Everything else in §4 marked P2 (must-have this semester) or P3 (nice to have). §4 holds 381 new ideas:
5 B1, 49 P1, 192 P2 and 135 P3. By area: Windows 73, Linux 55, networking basics 52, internet 30,
film set 25, compliance 23, storage/DR 22, finance 20, security 17, radio 17, antennas 12, HA 11, performance 10,
architecture 8, reference/tools 6. The six finance P1 entries (§4.12, added 2026-11-06), the six compliance P1
entries (§4.13, added 2026-11-07), the six film-set P1 entries (§4.14, added 2026-11-08) and the five antenna P1
entries (§4.15, added 2026-11-08) came after the batch list in §3.2 was written and are not in it.

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
| `net-osi-tcpip-map` | live | OSI vs TCP/IP, and which device lives where | layer models and the layer each device works at | drag protocols and devices onto layers | expl | S | P3 | URM | URM ch04 |  |
| `net-line-coding` | live | Line coding: NRZ vs Manchester | how bits become a signal and why the clock must be recoverable | type bits, compare waveforms, cut the clock | expl | S | P3 | URM, HAM | URM card ch06 (Manchester) |  |
| `net-delay-components` | live | Four kinds of delay | propagation vs transmission vs queuing vs processing delay | sliders for distance, bandwidth, packet size, load | expl | S | P2 | URM | URM card ch06 |  |
| `net-nominal-vs-actual` | live | Nominal vs actual throughput | overhead, half duplex and retries eat the link rate | toggle overheads, watch goodput | expl | S | P3 | URM | URM card ch06 |  |
| `net-ethernet-frame` | live | Anatomy of an Ethernet frame | fields, minimum size, padding, FCS | edit the payload, see padding and FCS | expl | S | P3 | URM | URM ch07 |  |
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
| `net-ipv4-header` | live | IPv4 header fields | what each field does and which change in transit | click fields, see their role | expl | S | P3 | URM | URM card ch08 (IPv4 header) |  |
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
| `net-ipv6-address-types` | live | IPv6 address types and scopes | link-local, GUA, ULA, multicast and their reach | classify addresses, see where they travel | expl | S | P3 | URM | URM ch10 |  |
| `net-dhcp-dora` | live | DHCP DORA and the lease | discover/offer/request/ack, T1/T2 renewal, expiry | step a client, let time run, unplug the server | step | S | P1 | URM, UL, WIN1 | URM card ch14 (DORA), UL ch18 |  |
| `net-dhcp-relay` | live | DHCP relay and giaddr | a relay forwards broadcasts as unicast and tags the subnet | step a client on a remote subnet | step | S | P2 | URM, WIN1 | URM card ch14 (relay) |  |
| `net-dhcp-rogue` | w3 · held | Rogue DHCP and snooping | the first offer wins, so a rogue server takes over | add a rogue server, then trust ports | step | S | P3 | URM, SEC, WIN1 | URM ch18 |  |
| `net-rule-first-match` | live | First match wins | rule lists are evaluated top down, the first match decides, implicit deny | send packets/requests through presets: router ACL, stateless firewall, `pg_hba.conf` | step | S | P1 | URM, UL, NLA | UL ch22 (pg_hba first match) → §5.1 |  |
| `net-port-forwarding` | live | Port forwarding (DNAT) | inbound connections to a NAT'd server | add a forward, open from outside | step | S | P2 | URM | extends `urm-pat` → §5.12 |  |
| `net-cgnat` | live | Carrier-grade NAT | double NAT, shared address space, why port forwarding fails | step a connection through two NATs | step | S | P3 | URM | URM ch11 |  |
| `net-tcp-teardown` | live in `tcp-handshake` | TCP connection teardown | FIN/ACK in both directions, half close, TIME_WAIT | step a close from either side | step | S | P2 | URM | extends `urm-tcp-handshake` → §5.8 |  |
| `net-tcp-states` | live | TCP state machine | the states a socket passes through, live | drive both ends, watch states | step | M | P3 | URM | URM ch13 |  |
| `net-tcp-retransmit` | live | Loss and retransmission | RTO, duplicate ACKs, fast retransmit | drop chosen segments, step the exchange | step | M | P2 | URM | URM ch13 → §5.8 |  |
| `net-tcp-congestion` | live | TCP congestion control | slow start, congestion avoidance, AIMD sawtooth, Reno vs CUBIC | set loss and RTT, watch cwnd over time | expl | M | P1 | URM, NLA | URM ch13 |  |
| `net-tcp-vs-udp-loss` | live | TCP vs UDP under loss | the same stream: TCP retransmits and stalls, UDP drops and continues | slider for loss, play both side by side | expl | S | P2 | URM | URM card ch13-tcp-naspram-udp-gubitak |  |
| `net-port-multiplexing` | live | Ports and sockets | the 5-tuple keeps many connections apart on one port 443 | open connections from several clients | step | S | P2 | URM | URM card ch13 (multiplexing) |  |
| `net-syn-outcomes` | live | Open, closed, filtered | SYN gets SYN/ACK, RST or nothing, and what each means (port scanning) | probe ports on a host behind a firewall | step | S | P1 | URM, SEC | URM card ch15 (three SYN outcomes) |  |
| `net-asymmetric-path` | live | Asymmetric path through NAT and firewall | replies taking another path break stateful devices | toggle the return path, watch the connection die | step | S | P3 | URM | URM card ch15 |  |
| `net-crc` | live | Error detection with CRC | how a CRC catches burst errors where parity fails | flip bits, compute parity and CRC | step | S | P2 | URM, HAM | → §5.13 |  |
| `net-wifi-channels` | live | Wi-Fi channels and overlap | 2.4 GHz 1/6/11, 5 GHz channel widths, co-channel interference | place APs, assign channels | expl | S | P2 | URM | URM ch17 |  |
| `net-wifi-association` | live | 802.11 association step by step | scan, authenticate, associate, then the 4-way handshake | step a station joining an AP | step | S | P2 | URM | URM card ch17-pridruzivanje-koraci; feeds `net-wpa-handshake` |  |
| `net-wpa-handshake` | live | WPA2/WPA3 handshake and what an attacker sees | PMK origin, 4-way handshake, why WPA2-PSK can be cracked offline and SAE can't | step the handshake; toggle the attacker's capture view | step | M | B1 | URM, SEC | proposal first batch; URM card ch17-pmk-porijeklo-rukovanje |  |
| `net-csma-ca-rts-cts` | live | CSMA/CA and RTS/CTS | Wi-Fi avoids collisions it can't detect; RTS/CTS fixes the hidden node | step stations with and without RTS/CTS | step | S | P3 | URM | extends `urm-hidden-node` |  |
| `net-wifi-roaming` | live | Roaming between APs | the client, not the AP, decides when to roam; sticky clients | walk a client across a floor plan | expl | S | P3 | URM | URM ch17 |  |
| `net-qos-queues` | live | QoS queues | priority queue vs weighted fair queuing, tail drop | set traffic mix and queue weights | expl | M | P3 | URM, NLA |  |  |
| `net-multicast-igmp` | live | Multicast and IGMP | joins, IGMP snooping keeps the stream off other ports | hosts join and leave a group | step | M | P3 | URM, NLA |  |  |
| `net-packet-journey` | live | The whole journey: from URL to page | DNS, ARP, TCP, TLS, HTTP in order, across the real path | step the capstone, open each part's own simulator | step | L | P2 | URM | URM card ch16-put-podataka-detaljno → §5.9 |  |
| `net-poe-budget` | w3 | PoE power budget | class per device vs switch budget | add devices to a switch | expl | S | P3 | URM |  |  |

### 4.2 Internet and application protocols

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `inet-dns-resolution` | live | Recursive and iterative resolution | resolver asks root, TLD and authoritative servers; the client asks once | step a lookup; repeat it warm | step | M | P1 | URM, UL, WIN1 | UL ch19, URM card ch14 (DNS query path) → §5.4 |  |
| `inet-dns-ttl-cache` | live | TTL caching and the cutover | old answers live until TTL expires; lower the TTL before migrating | change a record, run time, see who still gets the old IP | step | S | P1 | UL, DR | UL ch19 Example 2 → §5.4 |  |
| `inet-dns-records` | live | DNS record types | A/AAAA/CNAME/MX/TXT/NS resolve differently; no CNAME at the apex | build a small zone, query it | expl | S | P2 | UL, URM, WIN1 | UL ch19 |  |
| `inet-dns-secondary-expiry` | live | A secondary is a cache with a timer | SOA serial, refresh, retry, expire; a dead primary takes the zone down later | kill the primary, run time | step | S | P2 | UL, DR | DR S6 (student timeline); DR caveat CV-02 → §5.4 |  |
| `inet-dns-split-brain` | live in `dns-secondary-expiry` | Two primaries are two zones | split-brain primaries answer differently | edit one primary, query both | step | S | P3 | DR | DR caveat CV-01 |  |
| `inet-dnssec-chain` | w3 | DNSSEC chain of trust | DS → DNSKEY → RRSIG from the root down | step validation; break a signature | step | M | P3 | UL, SEC |  |  |
| `inet-dns-poisoning` | w3 | DNS cache poisoning | forged answers race the real one; TXID and port randomisation | step the race at different entropy | step | M | P3 | SEC |  |  |
| `inet-http-exchange` | live | One HTTP exchange | request line, headers, status codes, body | send requests, read responses | step | S | P2 | URM, UL | URM ch14 |  |
| `inet-http-versions` | live | HTTP/1.1 vs HTTP/2 vs HTTP/3 | multiplexing, and head-of-line blocking at TCP vs QUIC | load a page with loss on each version | expl | M | P2 | URM |  |  |
| `inet-http-caching` | live | HTTP caching | Cache-Control, ETag, 304, what a CDN edge keeps | request repeatedly, change headers | step | S | P2 | URM, UL |  |  |
| `inet-cookies-sessions` | live | Cookies and sessions | a stateless protocol remembers you; SameSite | log in, browse, switch sites | step | S | P3 | URM, SEC |  |  |
| `inet-cors` | live | Same origin and CORS | the browser, not the server, enforces it; preflight | make cross-origin calls with different headers | step | S | P3 | SEC |  |  |
| `inet-reverse-proxy-lb` | live | Reverse proxy and load balancing | round robin vs least connections vs hash vs sticky; health checks | add servers, fail one, change the algorithm | expl | M | P2 | UL, NLA | UL ch21, NLA T54 |  |
| `inet-cdn-anycast` | live | Anycast and CDN edges | one address, many places; BGP picks the nearest | move clients, withdraw a site | expl | S | P2 | URM |  |  |
| `inet-tls-handshake` | live | TLS 1.2 vs 1.3 | key exchange, certificate, round trips; 1-RTT vs 2-RTT | step both handshakes side by side | step | M | P1 | UL, URM, SEC | UL ch21 → §5.5 |  |
| `inet-cert-chain` | live | Chain of trust and expiry | leaf, intermediate, root store; a missing intermediate; expiry clocks | build a chain, remove links, advance time | step | S | P1 | UL, DR | UL ch21, DR S4 → §5.5 |  |
| `inet-acme-renewal` | live in `cert-chain` | ACME certificate renewal | HTTP-01 vs DNS-01 challenge, 90-day automation | step a renewal; break port 80 | step | S | P3 | UL |  |  |
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
| `inet-oauth-flow` | live | OAuth 2.0 / OIDC authorization code flow | who sees what: browser, app, identity provider | step a login with a third-party IdP | step | M | P3 | SEC |  |  |
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
| `sec-xss` | live | Cross-site scripting | stored vs reflected; output encoding | post a comment with a script | step | S | P3 | SEC |  |  |
| `sec-buffer-overflow` | live | Stack buffer overflow | overwriting the return address; canaries, NX, ASLR | feed longer inputs, step the stack | step | M | P3 | SEC, OS, ARH |  |  |
| `sec-pki-revocation` | live in `cert-chain` | Revocation: CRL vs OCSP | how a revoked certificate is (or isn't) noticed; stapling | revoke, then connect with different checks | step | S | P3 | NLA, SEC | NLA T50 → §5.5 |  |
| `sec-wireguard` | live | WireGuard | handshake, cryptokey routing, roaming | step a handshake; move a peer | step | M | P2 | NLA, SEC | NLA T09 → §5.9 |  |
| `sec-ipsec-ike` | live | IPsec and IKE | IKE phases, transport vs tunnel mode, ESP | step a site-to-site tunnel coming up | step | M | P3 | NLA, SEC | NLA T09 |  |
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
| `lnx-special-bits` | live | setuid, setgid and sticky | who the process runs as; who may delete in /tmp | run a setuid binary, delete in a sticky dir | step | S | P3 | UL | UL ch07 |  |
| `lnx-signals` | live | Signals | SIGTERM vs SIGKILL, traps, SIGHUP and nohup | send signals to processes with and without handlers | step | S | P2 | UL | UL ch08 |  |
| `lnx-job-control` | live | Job control | fg/bg, Ctrl-Z, process groups, what dies on logout | drive jobs from a shell | step | S | P3 | UL | UL ch08 |  |
| `lnx-boot-chain` | live | The boot chain | firmware → bootloader → kernel → initramfs → systemd | step a boot; break one stage | step | S | P2 | UL | UL ch10 (`lanac-podizanja.svg`) → §5.15 |  |
| `lnx-systemd-ordering` | live | systemd dependencies and ordering | Wants/Requires vs After/Before; a failed dependency | edit unit relations, boot, see the order and failures | expl | M | P2 | UL | UL ch10 → §5.15 |  |
| `lnx-timers-cron` | live | cron vs systemd timers | missed runs, `Persistent=`, randomised delay | let time pass with the machine off | step | S | P3 | UL | UL ch10 |  |
| `lnx-mount-layers` | live | Block device to mount point | disk → partition → filesystem → mount; a mount hides what was there | mount over a non-empty directory | step | S | P2 | UL | UL ch11 (`tocka-montiranja-zaklanja.svg`) |  |
| `lnx-partition-tables` | live | MBR vs GPT | partition limits, protective MBR, backup header | add partitions to each | expl | S | P3 | UL | UL ch11 |  |
| `lnx-disk-full-mysteries` | live | "Disk full" with free space | inode exhaustion, and a deleted file still open | fill a disk both ways, find the cause | step | S | P2 | UL | UL ch11, ch23 |  |
| `lnx-mirror-not-backup` | live | A mirror is not a backup | RAID protects against disk loss, not deletion or corruption | delete a file on a healthy mirror | step | S | P2 | UL, DR | UL ch12 (`granica-zastite-zrcala.svg`) → §5.3 |  |
| `lnx-lvm-extend` | live | Extending an LV and its filesystem | PV → VG → LV → filesystem, in that order | add a disk, extend each layer | step | S | P2 | UL | UL ch12; stepper companion to `spl-lvm-lab` |  |
| `lnx-quotas` | live | Disk quotas | soft vs hard limit, grace period | users write files, time passes | step | S | P3 | UL | UL ch12 |  |
| `lnx-memory-swap-oom` | live | Memory, swap and the OOM killer | page cache vs used, swapping, who the OOM killer picks | start processes, watch memory and the kill | expl | S | P2 | UL, OS | UL ch12 |  |
| `lnx-page-cache` | live | free vs available | the page cache is not lost memory; dirty pages and writeback | read and write files, watch the counters | expl | S | P2 | UL, NLA | NLA T42 |  |
| `lnx-load-average` | live | Load average | load counts runnable and D-state tasks, not CPU percent | add CPU and I/O-bound tasks on 1–8 cores | expl | S | P2 | UL, NLA | NLA T41 |  |
| `lnx-log-path` | live | The path of a log message | app → journald → rsyslog → file or remote | send messages with facilities and priorities | step | S | P2 | UL | UL ch13 (`put-poruke.svg`) |  |
| `lnx-logrotate` | live | logrotate | rotation numbering, compress, copytruncate vs create | run rotations while an app writes | step | S | P3 | UL | UL ch13 |  |
| `lnx-routing-decision` | live | Address, route and resolver | the three things a host needs, and the route lookup | break each one, see which command fails | step | S | P2 | UL | UL ch14 (`cetiri-podatka-i-tri-mjesta.svg`); `urm-routing-table` for LPM |  |
| `lnx-firewalld-zones` | live | firewalld zones | a packet's zone comes from its source or interface | send packets from different sources | step | S | P2 | UL | UL ch15 → §5.16 |  |
| `lnx-selinux-decision` | live | DAC says yes, SELinux says no | a second, label-based check after permissions | change modes and contexts, retry access | step | S | P1 | UL | UL ch15 (`dozvola-i-politika.svg`, `tri-mjesta-koja-kazu-ne.svg`) |  |
| `lnx-shell-quoting` | live | Quoting and word splitting | what the shell does to a line before the command sees it | type lines, step expansion, splitting, globbing | step | S | P2 | UL | UL ch16 (`navodnici-i-razdvajanje.svg`) |  |
| `lnx-exit-status` | live | Exit status and `&&`, `\|\|`, `set -e`, `pipefail` | how failure propagates, and a pipeline that reports success while failing | run chains where one step fails | step | S | P2 | UL, DR | UL ch17 (`izlazni-status-spaja.svg`), DR S8 → §5.3 |  |
| `lnx-subshell-trap` | live | Subshells and traps | a `cd` in a subshell doesn't stick; cleanup on EXIT | run scripts with and without subshells | step | S | P3 | UL | UL ch17 (`podljuska-i-trap.svg`) |  |
| `lnx-rsync-delete` | live | rsync, trailing slashes and `--delete` | `src` vs `src/`, and how `--delete` mirrors a mistake | sync, delete at source, sync again | step | S | P2 | UL, DR | UL ch15 |  |
| `lnx-package-deps` | live | Package dependency resolution | repo metadata, dependency trees, conflicts | install packages into a small repo | step | S | P3 | UL | UL ch09 |  |
| `lnx-nfs-root-squash` | live | NFS and root squash | the server, not the client, decides who you are | access as root and as a user | step | S | P3 | UL | UL ch18 |  |
| `lnx-namespaces` | live | A container is a process | PID, network and mount namespaces isolate one process tree | start a container, compare host and container views | step | M | P2 | NLA | NLA T07 → §5.17 |  |
| `lnx-cgroups` | live | cgroups limits | CPU shares and memory limits; OOM inside a cgroup | set limits, run greedy workloads | expl | S | P2 | NLA | NLA T11 |  |
| `lnx-overlayfs-layers` | live | Image layers and copy-up | read-only layers, a writable top, copy-up and whiteouts | edit and delete files inside a container | step | S | P1 | NLA | NLA T12–13 → §5.17 |  |
| `lnx-container-volumes` | live | Where container data is lost | container layer vs volume vs bind mount on `rm` | write data, recreate the container | step | S | P2 | NLA | NLA T15 |  |
| `lnx-container-ports` | live in `port-forwarding` | Publishing a container port | `-p` is DNAT on the host | publish ports, connect from outside | step | S | P2 | NLA | NLA T16 → §5.12 |  |
| `lnx-userns-mapping` | live | Rootless containers | root inside maps to an unprivileged UID outside | create files, check owners on the host | step | S | P3 | NLA | NLA T17 |  |
| `lnx-netns-veth-bridge` | live | Namespaces, veth and a bridge | how container networking is wired by hand | connect two namespaces step by step | step | M | P2 | NLA | NLA T06–08 |  |
| `lnx-netfilter-path` | live | A packet through netfilter | prerouting, input, forward, output, postrouting; where NAT and filter happen | send inbound, forwarded and local packets | step | M | P1 | NLA | NLA T08 → §5.1 |  |
| `lnx-policy-routing` | live | Policy routing | `ip rule` picks a table before the route lookup | add rules and tables, send from two sources | step | S | P3 | NLA | NLA T05 |  |
| `lnx-bonding-modes` | live | Bonding modes | active-backup vs balance vs 802.3ad | fail links, send flows | expl | S | P3 | NLA | NLA T06 → `net-link-aggregation` |  |
| `lnx-lvm-snapshot` | live | LVM snapshot filling up | CoW snapshot space and invalidation when full | write to the origin, watch the snapshot fill | step | S | P2 | NLA | NLA T20 → §5.2 |  |
| `lnx-thin-overcommit` | live | Thin provisioning and overcommit | promised vs real space; the pool fills under everyone | create thin volumes, write, run out | expl | S | P2 | NLA, DR | NLA T20 → §5.2 |  |
| `lnx-cow-filesystem` | live | Copy-on-write filesystems | snapshots share blocks; writes go to new blocks | write, snapshot, write, see shared and owned blocks | step | S | P2 | NLA | NLA T22–23 → §5.2 |  |
| `lnx-send-receive` | live in `backup-diff-incr` | Btrfs/ZFS send and receive | incremental replication from snapshot pairs | snapshot, send, change, send incremental | step | S | P3 | NLA, DR | NLA T22 → §5.3 |  |
| `lnx-zfs-self-heal` | live | Checksums and self-healing | a scrub finds a bad block and repairs it from the mirror | corrupt a block, scrub | step | S | P2 | NLA | NLA T23 |  |
| `lnx-raid-rebuild` | live | Rebuild under load and the second failure | a long rebuild, an unreadable sector, a lost array | fail a disk, rebuild, hit a URE | step | S | P2 | NLA, DR | NLA T24 → §5.3 |  |
| `lnx-multipath` | live | Multipath I/O | path failover for iSCSI/FC | fail paths during I/O | step | S | P3 | NLA | NLA T25; `spl-stratis-lab` |  |
| `lnx-ansible-idempotence` | live | Idempotence | a script run twice breaks things; a declarative task doesn't | run both versions repeatedly | step | S | P2 | NLA | NLA T30 |  |
| `lnx-terraform-drift` | live | Infrastructure as code: state and drift | desired vs state vs real; plan shows the diff | change infra by hand, run plan | step | S | P2 | NLA | NLA T31 |  |
| `lnx-deploy-strategies` | live | Blue-green, canary, rolling | how each moves traffic and rolls back | deploy a bad version with each strategy | step | M | P2 | NLA | NLA T33 |  |
| `lnx-alert-states` | live | Alert states: pending and firing | scrape, `for:` duration, pending → firing, flapping | feed a metric, tune the rule | step | S | P2 | NLA | NLA T36–37 |  |
| `lnx-live-migration` | live | Live migration | pre-copy rounds converge only if dirtying is slower than copying | slider for dirty rate and bandwidth | expl | M | P2 | NLA | NLA T02 |  |
| `lnx-pam-stack` | live | The PAM stack | required/requisite/sufficient/optional decide a login | reorder modules, fail some, log in | step | S | P2 | NLA | NLA T58 → §5.1 |  |
| `lnx-hypervisor-types` | live | Type 1 vs type 2, containers vs VMs | where the kernel and the hypervisor sit | compare stacks, click layers | ref | S | P3 | NLA | NLA T01, T07 |  |

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
| `win-account-lockout` | live | Account lockout | threshold, bad-password count checked at the PDC emulator, a stale password locking an account | mistype passwords from two machines, keep an old session | step | S | P3 | WIN1 |  |  |
| `win-kerberos` | live | Kerberos | AS → TGT, TGS → service ticket, AP; clock skew breaks it | step a user opening a file share; skew the clock | step | M | P1 | WIN2, NLA | NLA T57 → §5.6 |  |
| `win-ntlm-vs-kerberos` | live | NTLM vs Kerberos | challenge-response vs tickets; when Windows falls back to NTLM; why pass-the-hash works | authenticate by name and by IP, capture the hash | step | S | P2 | WIN2, SEC |  |  |
| `win-time-hierarchy` | live | Time in a domain | the PDC emulator is the source, members follow DCs, Kerberos fails past 5 minutes | drift clocks, move the PDC role | step | S | P2 | WIN2 | `inet-ntp-sync` → §5.21 |  |
| `win-ad-replication` | live | AD multi-master replication | USNs, up-to-dateness vector, attribute-level last writer wins | change one attribute on two DCs at once | step | M | P2 | WIN2 | → §5.7 (`ha-multimaster-conflict`) |  |
| `win-ad-sites` | live | Sites, site links and the KCC | intra-site vs inter-site replication, cost and schedule; site-aware DC choice | add sites and links, change a password, wait | expl | M | P2 | WIN2 | `app-topologydrafter` two-sites |  |
| `win-sysvol-dfsr` | live | SYSVOL replication | GPO version in AD vs in SYSVOL; a GPO that half-arrived at a branch | edit a GPO, cut the link to a site | step | S | P2 | WIN2 | → §5.21 |  |
| `win-rodc` | w3 · building | Read-only DC at a branch | password replication policy; what a stolen RODC exposes | log users in at the branch, steal the RODC | step | S | P3 | WIN2, SEC | `app-topologydrafter` two-sites |  |
| `win-fsmo-roles` | live | FSMO roles | the single-master jobs and what breaks when a holder is gone; transfer vs seize | turn off role holders, try operations | step | S | P2 | WIN2 |  |  |
| `win-functional-levels` | live | Functional levels | what raising the domain and forest level unlocks, and what it rules out | raise levels with old DCs present | expl | S | P3 | WIN2 |  |  |
| `win-fgpp` | live | Password policy and fine-grained policies | one domain policy from the Default Domain Policy GPO; PSOs override it by precedence | apply PSOs to users and groups, see the winner | step | S | P2 | WIN2 | → §5.1 |  |
| `win-delegation` | live | Delegation of control | granting rights on an OU instead of Domain Admins | delegate password resets, test as a helpdesk user | step | S | P3 | WIN2 |  |  |
| `win-trusts` | w3 · queued | Trusts | direction, transitivity, forest vs external trusts; who can access what | build trusts between forests, test access | step | M | P3 | WIN2 |  |  |
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
| `sto-cow-vs-row` | live in `lnx-cow-filesystem` | Copy-on-write vs redirect-on-write | where the old and the new block end up; the write penalty | write to a snapshotted volume in both modes | step | S | P3 | DR, NLA | → §5.2 |  |
| `sto-write-cache` | live | Write-back vs write-through | write-back is fast until the power fails; battery-backed cache | write, cut power with each setting | step | S | P2 | DR, NLA | write-back durability (the scoping note's §5 "no write cache" is a performance tier: a separate idea) |  |
| `sto-ssd-internals` | live | Inside an SSD | FTL, erase blocks, write amplification, TRIM, wear | write and overwrite, see erase cycles | step | M | P2 | OS, NLA | `ossim-disk-scheduling` hdd-vs-ssd |  |
| `sto-iops-latency` | live | IOPS, throughput and latency | queue depth and block size trade them off | sliders for block size, queue depth, device | expl | S | P2 | NLA, DR | NLA T27 |  |
| `sto-nas-vs-san` | live | File vs block storage | NAS (NFS/SMB) vs SAN (iSCSI/FC): who owns the filesystem | mount both, connect two clients | step | S | P3 | NLA | NLA T25 |  |
| `sto-ec-vs-replication` | live | Erasure coding vs replication | overhead vs failures tolerated vs rebuild cost (k+m) | choose k, m, replicas; fail disks | expl | S | P2 | NLA, DR | cephsim → §5.7 |  |
| `sto-ceph-min-size` | live | size and min_size | `size=2 min_size=2` blocks I/O on one failure; 3/2 doesn't | fail OSDs under each setting, try to write | step | S | P2 | NLA, DR | cephsim, faultline `sizeTwo`, scoping §5, DR S2/P05 → §5.7 |  |
| `sto-ceph-down-out` | live | down vs out | down is degraded and nothing moves; out triggers rebalancing after a timer | stop an OSD, let time pass | step | S | P2 | NLA, DR | cephsim |  |
| `sto-crush-failure-domain` | live | Failure domain in a placement rule | same data, rule by host vs by rack; then lose a rack | switch the rule, kill a rack | step | S | P2 | NLA, DR | cephsim `brokenRule` |  |
| `sto-smallest-disk-caps` | live | One small or full disk caps the pool | the fullest OSD sets MAX AVAIL; uneven hosts fill first | add mismatched disks, fill the pool | expl | S | P2 | NLA, DR | cephsim, scoping note §5 |  |
| `sto-sync-async-replication` | live in `db-replication` | Synchronous vs asynchronous replication | RPO 0 at the cost of latency vs lag and data loss on failover | write, fail the primary at different moments | step | S | P2 | DR, NLA | → §5.7 (with `ha-db-replication`) |  |
| `dr-rpo-rto` | live | RPO and RTO | how much data and how much time you lose, on one timeline | place backups and an incident, measure loss | expl | S | P2 | DR | DR scenarios |  |
| `dr-site-failover` | live | Site failover | DNS/GSLB moves users; what doesn't follow (sessions, IP-bound licences) | lose a site, fail over, fail back | step | M | P3 | DR | DR S1, S12, S14 |  |
| `dr-correlated-failure` | live in `faultline` | One power strip under three replicas | redundancy that shares one hidden dependency | add dependencies, fail the PDU | step | S | P3 | DR | faultline `onePdu`: a preset on the imported faultline |  |
| `dr-alert-to-nobody` | w3 | The alert that reaches nobody | the alert path depends on the system that failed | fail the site, follow the alert | step | S | P3 | DR | DR S1 |  |

### 4.7 High availability and distributed systems

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `ha-multimaster-conflict` | live | Multi-master replication with a conflict | concurrent writes on two masters; last-writer-wins, versions, what is lost | write on both sides of a partition, heal it | step | M | B1 | DR, NLA, WIN2 | proposal first batch; NLA T55 → §5.7 |  |
| `ha-quorum-split-brain` | live | Quorum and split-brain | majority keeps one side alive; even counts and witnesses; fencing | partition a cluster of 2–5 nodes, add a witness | step | S | P1 | NLA, DR, WIN2 | NLA T52–53; cephsim MON quorum → §5.7 |  |
| `ha-fencing` | live in `quorum-split-brain` | Fencing (STONITH) | why a node must be killed before its resources move | hang a node with and without fencing | step | S | P2 | NLA | NLA T53 → §5.7 |  |
| `ha-cluster-membership` | w3 | Who is still in the cluster: heartbeats and the token timeout | nodes pass a token round a ring; a node that misses it past the timeout is dropped and membership re-forms before quorum is counted; a short timeout drops slow nodes, a long one delays failover | slow a node, cut a link, change the timeout | step | S | P2 | NLA | NLA T52; owner suggestion s-001 "corosync" (2026-11-12); next to `quorum-split-brain` |  |
| `ha-resource-placement` | w3 | Where cluster resources run: location, colocation, order and stickiness | constraints and scores decide which node runs each resource and in what order a group starts; a failure moves the whole group, stickiness keeps it from moving back | fail a node, change scores and stickiness, add a colocation or an order | explorer | S | P2 | NLA | NLA T52; owner suggestion s-001 "corosync" (2026-11-12) |  |
| `ha-vrrp-failover` | live | VRRP failover | master election, virtual IP, preemption, gratuitous ARP | fail and restore the master | step | S | P2 | NLA, URM | NLA T54 |  |
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
| `perf-littles-law` | live | Little's law | L = λW in a shop, a server, a build farm | change arrival rate and service time | expl | S | P2 | DR | dc-sim |  |
| `perf-tail-latency` | live | Tail latency and fan-out | p99 decouples from the mean; fan-out makes the tail common | sliders for variability and fan-out | expl | S | P2 | DR, NLA | dc-sim `tail_decoupling` |  |
| `perf-retry-storm` | live | Retry storms and metastable collapse | retries keep a recovered system down; backoff, jitter, admission control | spike the load, toggle retry policies | step | S | P2 | DR, NLA | dc-sim `metastable_collapse` |  |
| `perf-rate-limiting` | live | Token bucket vs leaky bucket | bursts allowed vs smoothed | send bursts through each limiter | step | S | P2 | NLA, URM |  |  |
| `perf-cache-hit-ratio` | w3 | Cache hit ratio and latency | a few percent of hit ratio dominates average latency | sliders for hit ratio and miss cost | expl | S | P3 | OS, ARH |  |  |
| `perf-goodhart-teams` | w3 | Local optimisation, global degradation | teams meeting their own metric hurt the whole | tune each team's target, watch the system | expl | M | P3 | DR | dc-sim `goodhart` |  |
| `perf-autoscaling-lag` | live | Autoscaling lag | provisioning lead time vs load spikes; spot preemption | spike the load with different lead times | expl | S | P3 | DR, NLA | dc-sim `resource_provisioning` |  |
| `perf-slo-error-budget` | live | SLOs and error budgets | burn rate, fast and slow burn alerts | inject incidents, watch the budget | expl | S | P2 | NLA, DR | NLA T40, dc-sim |  |
| `perf-game-tick-server` | w3 | Authoritative tick server | a fixed tick, server-side line of sight, why clients lag | step ticks, move players, add latency | step | M | P3 | URM | agentvsagent |  |

### 4.9 Computer architecture, OS gaps and automata

ossimulator covers the OS course; these fill small gaps or extend the imported architecture labs.

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `arh-cache-mapping` | live | Cache mapping | direct-mapped vs set-associative; conflict misses | feed addresses, change associativity | step | M | P2 | ARH, OS |  |  |
| `arh-pipeline-hazards` | live | Pipeline hazards | data hazards, stalls, forwarding, branch flush | step instructions through five stages | step | M | P2 | ARH | pairs with `spl-spectre-meltdown` |  |
| `arh-mesi` | w3 | MESI coherence on its own | the states of one cache line across cores | issue reads and writes per core | step | S | P3 | ARH | split from `spl-multicore-mesi` |  |
| `arh-twos-complement` | w3 | Two's complement and overflow | signed integers and the wrap | add numbers, watch flags | expl | S | P3 | ARH |  |  |
| `arh-floating-point` | w3 | IEEE 754 | sign/exponent/mantissa; why 0.1 + 0.2 ≠ 0.3 | toggle bits, type numbers | expl | S | P3 | ARH |  |  |
| `arh-endianness` | live | Endianness | byte order in memory and on the wire | write values, read them as bytes | expl | S | P3 | ARH, URM |  |  |
| `os-context-switch-cost` | w3 | What a context switch costs | saved state, TLB and cache warmup | switch at different rates | expl | S | P3 | OS | ossim covers mode vs process switch |  |
| `aut-regex-to-nfa` | w3 | Regex to NFA to DFA | Thompson construction and subset construction | type a regex, step the constructions | step | M | P3 | AUT | pairs with `spl-automata`, `lnx-regex-match` |  |

### 4.10 Radio and crisis communications

Mostly covered by the 50ohm applets and the radio labs (§2.1, §2.5). New ideas where nothing exists:

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `ham-superhet-image` | w3 | Superheterodyne and the image frequency | mixing to an IF, and the second frequency that also lands there | tune the LO, move a signal onto the image | expl | M | P3 | HAM | 50ohm `ueberlagerungsempfaenger_*`, `spiegelfrequenzen` |  |
| `ham-swr` | live | SWR and standing waves | mismatch reflects power; standing wave on the line | change load impedance, watch the wave | expl | M | P3 | HAM | 50ohm `swr*` |  |
| `ham-ionosphere-muf` | w3 | Ionosphere, MUF and the dead zone | layers by day and night, skip distance, the zone nobody hears | change time of day and frequency | expl | M | P3 | HAM | 50ohm `ionosphaere*`, `muf_luf_*`; near `50ohm-skip-distance` |  |
| `ham-fec-hamming` | live in `crc-error-detection` | Hamming code | correcting one bit error with parity bits | flip bits, decode | step | S | P3 | HAM, URM | 50ohm `fehlerkorrektur` → §5.13 |  |
| `ham-multiple-access` | live | FDMA, TDMA, CDMA | three ways to share a channel | add users to each scheme | expl | S | P3 | HAM, URM | 50ohm `vielfachzugriff` |  |
| `ham-qam-ofdm` | live | QAM and OFDM | constellation size vs noise; subcarriers | change order and SNR, watch errors | expl | M | P3 | HAM, URM | 50ohm `qam`, `ofdm`; extends `50ohm-qpsk` |  |
| `ham-shannon` | live | Shannon–Hartley | capacity from bandwidth and SNR | sliders for B and SNR | expl | S | P3 | HAM, URM | 50ohm `shannon_hartley_gesetzt` |  |
| `ham-packet-aprs` | live | Packet radio and APRS | CSMA on a shared channel, digipeaters, path aliases | send beacons through digipeaters | step | M | P3 | HAM | 50ohm `paketvermittelte_netzwerke` |  |
| `ham-fft-waterfall` | live | FFT and the waterfall | sample rate sets the span, FFT size sets the resolution | change sample rate and FFT size | expl | M | P3 | HAM | HamMonitor `DESIGN.md` |  |
| `ham-ctcss` | live | CTCSS tone squelch | a sub-audible tone opens the receiver | key up with and without the tone | step | S | P3 | HAM | HamMonitor `ctcss.py` |  |
| `ham-lora-css` | live | LoRa chirp spread spectrum | chirps, spreading factor vs airtime vs range | change SF and bandwidth | expl | S | P3 | HAM | idea only (Lora-Wideband-Decoder is noncommercial) |  |
| `ham-fsk-psk-ask` | live | ASK, FSK and PSK | three ways to put bits on a carrier | type bits, switch modulation | expl | S | P3 | HAM, URM | SigDigger (idea only) |  |
| `ham-adsb-frame` | w3 | Decoding an ADS-B frame | Mode S frame fields, CPR position | step through one frame | step | S | P3 | HAM | intercept (idea only) |  |
| `kk-directed-net` | live | Directed net vs free-for-all | an NCS turns contention into a queue | let stations call with and without an NCS | step | S | P3 | KK | KK1 slides |  |
| `kk-priority-traffic` | live | Priority traffic and ACK | routine/priority/emergency preemption, acknowledgement and retry | inject traffic of each priority | step | S | P3 | KK | KK1/KK2, `KK_Operativni_Prirucnik.docx` |  |
| `kk-backup-ncs` | live | Backup NCS takeover | the net survives losing its control station | silence the NCS mid-traffic | step | S | P3 | KK | KK2 slides |  |
| `kk-gateway-tiers` | w3 | Multi-tier relay through a gateway | local nets, gateways and delay to the coordination level | send a message from field to HQ | step | M | P3 | KK | KK2 slides |  |

### 4.11 Reference posters and classroom tools

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `ref-ports` | live | Well-known ports | the ports students meet, grouped by service | filter by layer and protocol | ref | S | P3 | URM, UL |  |  |
| `ref-http-status` | live | HTTP status codes | the classes and the codes that matter | filter by class | ref | S | P3 | URM |  |  |
| `ref-linux-dirs` | live | The Linux directory tree | FHS: what lives where and why | click directories | ref | S | P3 | UL | UL ch05 |  |
| `ref-protocol-headers` | live | Header poster | Ethernet, IPv4, IPv6, TCP, UDP headers side by side | hover fields | ref | S | P3 | URM | overlaps `spl-l2l3-protocols` |  |
| `tool-countdown` | live | Exercise countdown | a projector-sized timer for in-class exercises | set and start | tool | S | P3 | all |  |  |
| `tool-quick-poll` | live | Quick poll | students answer A–D from phones, results on the projector | ask, collect, reveal | tool | M | P3 | all | needs a server or a shared-state capability; out of scope for static pages today |  |

### 4.12 Finance basics for IT managers

The money vocabulary an IT manager meets in budgets, purchases and talks with finance, each term as a mechanism
to move, not a glossary card. Most entries show **one purchase seen two ways** (cash vs expense, nominal vs
discounted, list price vs five-year cost), which is the contrast IT managers usually miss. Generic principles only:
no tax law, no products; money is in euros and the fiscal year's first month is a parameter.

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `fin-capex-opex` | live | CapEx vs OpEx: one purchase, three views | buying puts the cash out on day one but the expense is spread over the useful life as depreciation, and the asset sits on the balance sheet meanwhile; a service is paid and expensed month by month; which budget each draws on, why operating profit before depreciation (EBITDA) looks better with CapEx, and the capitalisation threshold below which a purchase is simply expensed | spend the same amount as a bought server or a five-year service, scrub through the months and watch cash, expense and book value side by side; move the threshold and the price | expl | S | P1 | FIN, DR | DR `student/handbook/constraints.md` (capex remaining vs opex headroom, approval thresholds); hub of the shared ledger model → §5.23 |  |
| `fin-depreciation` | live | Depreciation and book value | straight-line vs declining-balance depreciation over a useful life, with a residual value; software (a perpetual licence) amortises the same way; retiring or selling early books the remaining book value as a loss or a gain | set cost, life, residual value and method; retire the asset in year *n* and see the write-off | expl | S | P2 | FIN | shares the asset model with `fin-refresh-cycle` → §5.23 |  |
| `fin-refresh-cycle` | live | Refresh cycles and economic life | capital cost per year falls as the cycle lengthens while support, failures and lost staff time rise with age; the sum has a minimum (the economic life); refreshing a whole fleet at once makes a spending wall every *n* years | for a fleet of devices choose the cycle length and how many staggered cohorts, run ten years, read yearly cash, depreciation and age-related cost | expl | M | P2 | FIN, DR | asset model with `fin-depreciation` → §5.23 |  |
| `fin-accruals-cash` | live | Accruals vs cash: a year of invoices | an expense belongs to the month the service is used, not the month it is paid: a prepaid annual support contract is spread over twelve months, December's service invoiced in January is accrued in December | step through a year of IT invoices (prepaid support, colocation billed quarterly in arrears, a late invoice), post each one, watch the cash line and the expense line part and meet again at year end | step | M | P1 | FIN | the ledger model → §5.23 |  |
| `fin-budget-variance` | live | Budget vs actuals: reading a variance | a budget phased by month against actuals; a variance splits into volume (more used), price (dearer per unit) and timing (an invoice late or early); "under budget in October" is often a missing invoice; the run-rate forecast to year end; use-it-or-lose-it phasing as a preset | step the months of a cloud and licence budget, inject more usage, a price rise and a late invoice, read each part of the variance and the year-end forecast | step | M | P2 | FIN | builds on `fin-accruals-cash` (timing variance is an accrual) → §5.23 |  |
| `fin-tco` | live | Total cost of ownership | the purchase price is a small part of five years of power, space, support, staff time, training, migration and the exit at the end; the cheaper purchase can be the dearer option; build-vs-buy (staff time as a cost) as a preset | build two options line by line, switch cost categories on and off, move the horizon, watch the ranking flip | expl | S | P1 | FIN, DR | DR handbook price list (colocation per kW-month, remote hands, MSP onboarding, cloud egress) |  |
| `fin-npv-discounting` | live | Time value of money and NPV | a euro next year is worth less than a euro today; the discount rate is the cost of capital (what the money would earn or cost elsewhere); NPV sums the discounted cash flows | drag cash flows on a timeline, move the discount rate, watch nominal and discounted bars and the NPV change sign | expl | S | P1 | FIN | the discounting every investment page reuses → §5.23 |  |
| `fin-roi-payback-npv` | live | ROI, payback and NPV disagree | three yardsticks rank the same projects differently: simple ROI ignores timing, payback ignores everything after the payback date, NPV depends on the rate; IRR is the rate at which NPV is zero | shape two projects' cash flows (a quick win and a slow large return), read the three rankings, find the rate at which they swap | expl | S | P2 | FIN | needs `fin-npv-discounting` |  |
| `fin-fixed-variable` | live | Fixed, variable and step costs; break-even | a platform's fixed cost spread over more users lowers the average cost; capacity comes in steps; the next user's marginal cost is not the average; the break-even volume between running it yourself and paying per user | move the user count and utilisation, compare an in-house platform with a per-user service, watch average and marginal cost and the break-even point | expl | S | P2 | FIN, DR | idle headroom costs money, too little costs latency: link `utilisation-latency` → §5.23 |  |
| `fin-chargeback` | live | Showback and chargeback | shared IT cost allocated to departments by a key (users, VMs, storage, tickets): the key decides who pays; charging a fixed cost per unit means a department that leaves raises everyone else's price, and the next one leaves (the spiral) | pick allocation keys, move each department's usage, switch from showback to chargeback, let a department leave | expl | M | P2 | FIN | unit cost from `fin-fixed-variable` |  |
| `fin-cloud-commitment` | live | Cloud commitment vs on-demand | a commitment buys a discount on usage paid for whether used or not; break-even utilisation is committed price ÷ on-demand price; cover the base load, leave the peaks on demand; a longer term deepens the discount and the risk | draw a year of usage, set the commitment level and term, watch unused commitment against on-demand spend and the total | expl | S | P1 | FIN, DR | DR handbook cloud prices; `perf-autoscaling-lag` (§4.8) |  |
| `fin-lease-vs-buy` | live | Lease vs buy | the same hardware bought for cash, bought on a loan or leased: cash, expense and balance sheet differ, and the comparison is fair only when discounted at the cost of capital; at the end of the term buy out the residual, return or extend | choose the financing, lease rate, term and residual; compare the cash timeline, the yearly expense and each option's NPV | expl | M | P2 | FIN | needs `fin-npv-discounting`; ledger model → §5.23 |  |
| `fin-licence-models` | live | Perpetual licence or subscription | a perpetual licence is a large upfront purchase (capitalised, amortised) plus yearly maintenance at a share of the list price; a subscription is a recurring expense; letting maintenance lapse and coming back costs back-fees; per-user and per-core metrics grow differently as the hardware grows | set user growth, maintenance share, yearly price rises and the horizon; find the crossing year; let maintenance lapse in year 3; switch the metric | expl | S | P2 | FIN | ledger model → §5.23 |  |
| `fin-prepay-discount` | live | Pay upfront for a discount? | a discount for paying early is an interest rate in disguise, to compare with the cost of capital; payment terms (30, 60, 90 days) move cash, not cost; three years prepaid ties up working capital and the cash buffer | set the discount, years prepaid and payment terms; read the implied annual rate against the cost of capital and watch the cash balance | expl | S | P2 | FIN | needs `fin-npv-discounting` |  |
| `fin-indexation-fx` | live | Inflation, indexation and currency in a multi-year contract | a fixed price loses real value to inflation; an indexation clause passes inflation on (with a cap or a floor); a price in a foreign currency adds exchange-rate risk; nominal vs real euros | run a five-year contract along inflation and exchange-rate paths, choose fixed, indexed or capped, and the currency | expl | S | P3 | FIN |  |  |
| `fin-contingency-reserve` | live | Contingency reserve: P50 vs P80 | each line of a project estimate is a range skewed towards overruns, so the total's median is above the sum of the most likely values; the reserve buys a level of confidence | set ranges for the line items, run many trials, choose the confidence level, read the reserve it needs | expl | M | P2 | FIN, DR | DR P07 brief (one-off spend cap, approval threshold) |  |
| `fin-downtime-cost` | live | What an hour down costs, and what a nine is worth | cost of downtime = lost revenue + idle staff + recovery work + penalties, varying with the hour and the day; each extra nine removes less downtime and costs more redundancy | set the cost components and the availability target; compare the expected yearly downtime cost with the yearly cost of the HA option | expl | S | P1 | FIN, DR | `rpo-rto` gives the hours down; `perf-slo-error-budget` (§4.8) → §5.23 |  |
| `fin-ale-risk` | live | Expected annual loss and the price of a control | ALE = single loss expectancy × annual rate of occurrence; a control is worth its yearly cost when it removes more ALE than that; accept, reduce, transfer (insurance) or avoid; a rare large loss hides behind a small average | add risks with a loss and a frequency, buy controls and insurance, watch ALE, control cost and the worst simulated year | expl | S | P2 | FIN, DR, SEC | `ransomware-321` (an immutable copy as a control), `faultline` → §5.23 |  |
| `fin-sunk-cost` | live | Sunk cost: decide looking forward | money already spent, and an old system's remaining book value, is the same whichever way you choose, so only the cost still to come and the benefit still to come count; the opportunity cost of the people tied up | step a project that overruns; at each gate continue, stop or switch, and compare deciding by "already spent" with deciding by "still to spend" | step | S | P2 | FIN | the write-off from `fin-depreciation` |  |
| `fin-cost-of-delay` | live | Cost of delay: which project first | each project loses value for every week it waits; ordering by value lost per week ÷ duration beats ordering by size or by who asks loudest | reorder three to five projects in a queue and watch the total value lost | expl | S | P3 | FIN |  |  |

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

### 4.13 Compliance and procedures for IT managers

What an IT manager is asked to show an auditor, a supervisory authority or the board: risks known and treated, access
under control, changes managed, personal data handled lawfully, incidents reported on time and recovery proven. Each
entry puts a procedure or a control in motion and shows the contrast people miss (with and without the control,
written vs operating, the average vs the tail, the clock started at awareness vs at the attack), never the rule text
as a card. Frameworks are the subject here, so GDPR (Opća uredba o zaštiti podataka), NIS2 and its Croatian
implementation (Zakon o kibernetičkoj sigurnosti, 2024), ISO/IEC 27001 and, for the financial sector, DORA are named
where a concept comes from them. General principles only: no legal advice, no products or tools, one fictional
organisation; the Croatian details below were confirmed by the owner on 2026-11-08 and may go on the pages; a new
Croatian detail not listed there is still marked *(check)* and kept off the page until the owner confirms it.

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `cmp-policy-to-record` | live | Policy, standard, procedure, record: the trail an auditor walks | a policy states intent ("backups are tested"), a standard makes it measurable (every critical system each quarter), a procedure says how, a record proves it happened; the auditor walks down from a clause to the records for the whole period; a missing layer breaks the trail: a policy without records is paper compliance (designed, not operating), records without a policy have no mandate, a procedure nobody follows shows as gaps in the dates | build the chain for three requirements, delete or weaken one layer, leave some months without records, then run the audit walk-through and see where it stops and whether the finding is about design or operation | step | M | P1 | CMP | DR S9 (pass the client audit), DR `student/handbook/constraints.md` (the audit date and what failing it costs); hub of the evidence model → §5.24 |  |
| `cmp-audit-sampling` | live | Audit sampling: how many tickets to check | an auditor tests a sample of a control's occurrences; the chance of finding at least one failure is 1 − (1 − rate)ⁿ, so a sample of 25 misses a 2% failure rate more often than not (about 60% of the time); how often a control runs sets the usual sample size; one exception found means a larger sample or a finding; "no exceptions found" is not "no failures" | set the population (250 change tickets), the true failure rate and the sample size, draw samples many times, read the detection rate; compare what the auditor concludes with what is true | expl | S | P1 | CMP | the evidence model from `cmp-policy-to-record` → §5.24 |  |
| `cmp-risk-register` | live | Risk register: likelihood × impact, treatment and residual risk | a risk is scored likelihood × impact on a 5 × 5 matrix; a treatment (reduce, transfer, avoid, accept) moves it from inherent to residual risk at a cost; the risk appetite line decides what must be treated and who signs an acceptance; multiplying ordinal scores misleads (5 × 1 and 1 × 5 tie, 3 × 3 outranks both), which a view in money exposes; ISO/IEC 27001 asks for this loop (assess, treat, accept the residual, review) | place a dozen IT risks on the matrix, choose a treatment and its cost for each, watch the arrows from inherent to residual, move the appetite line, then switch to the money view and watch the ranking change | expl | S | P1 | CMP, SEC | the money view is `fin-ale-risk` (§4.12); hub of the risk-scoring model → §5.24 |  |
| `cmp-change-risk-class` | live | Change management: risk classes or one board for everything | sending every change to a weekly change advisory board adds days of lead time and makes teams batch changes, so each release is bigger and fails more often; classes by risk (standard: pre-approved and repeatable; normal: peer-reviewed, the board only for high risk; emergency: approved fast, reviewed afterwards) cut lead time without raising the failure rate; changes nobody recorded show up only as incidents | run a quarter of changes under three regimes (no process, everything to the weekly board, risk classes), tune what counts as standard and how often the board meets, read lead time, batch size, change failure rate and unrecorded changes | expl | M | P1 | CMP | staged rollout in `lnx-deploy-strategies` and update rings (§5.22) → §5.24 |  |
| `cmp-jml-drift` | live | Joiner, mover, leaver: how access piles up | access granted on request and never removed grows with every move (privilege creep), and leavers' accounts stay active when HR and IT are not connected; roles instead of one-off grants and removal on move keep people near least privilege; a periodic access review cleans up, but a reviewer shown 500 lines approves them all | run two years of a department with hires, moves and departures; switch on HR-driven provisioning, roles, removal on move and a quarterly review of a chosen size; watch excess rights per person, orphaned accounts and how much the review really removes | expl | M | P1 | CMP, SEC | DR `student/handbook/it-wiki.md` (leavers disabled on their last day); groups in `win-group-scopes`, the logon token in `win-access-token`; hub of the people × roles × rights model → §5.24 |  |
| `cmp-sod-toxic` | live | Segregation of duties: toxic combinations | some pairs of rights in one person let them make an error or a fraud and hide it: request and approve, write code and deploy it to production, administer backups and delete their logs, create a supplier and pay it; a conflict matrix checked against role assignments finds them; a small team cannot always separate, so a compensating control (an independent review of a log the person cannot edit) takes the place of separation | assign roles in a team of three to twelve people, watch conflicts light up on the matrix, resolve each by splitting the duty, adding a compensating control or accepting it with a signature; shrink the team until separation becomes impossible | expl | S | P2 | CMP, SEC | the people × roles × rights model from `cmp-jml-drift` → §5.24 |  |
| `cmp-four-eyes` | live | Four eyes: when the second approver is a rubber stamp | a second approval catches a bad request only when the approver is independent and actually looks; as the queue grows the time per item falls and approval becomes automatic, so the catch rate drops while the record still shows two signatures; reviewing the risky few in depth beats reviewing everything thinly | send a stream of requests with a few bad ones, set the approver's workload, independence and the share reviewed in depth, watch the catch rate and the time per approval; compare reviewing everything with reviewing by risk | expl | S | P3 | CMP |  |  |
| `cmp-privileged-access` | live | Standing admin rights or just in time; the break-glass account | standing administrator rights are exposed every hour of the year; just-in-time elevation (requested, approved, limited in time, logged) shrinks the window in which a stolen credential is an admin one; a break-glass account for when the identity system itself is down stays sealed, alerts when used and is reviewed afterwards | give a team standing or just-in-time admin rights, steal a credential at a random hour many times and count how often it carried admin rights; open the break-glass account and follow the alert and the review | expl | S | P2 | CMP, SEC | DR `student/handbook/it-wiki.md` (Domain Admins and the break-glass account); credential theft in `lateral-movement`, `win-laps` → §5.24 |  |
| `cmp-log-evidence` | live | Logs as evidence: complete, in time, out of reach | logs answer "who did what, when" only if they are complete, their clocks agree, they are kept out of reach of the administrators they record (sent off the host, append-only) and long enough to cover how late incidents are found; a log holding personal data needs its own retention and access rules | replay an incident in which an admin account misbehaves, with local logs or a central append-only store, clocks in sync or drifting, 30 or 180 days kept; see which of the investigation's questions can still be answered | step | M | P2 | CMP, SEC | `lnx-log-path`, `win-ipam-audit` (correlating logs), `ntp-sync` → §5.24 |  |
| `cmp-patch-sla` | live | Vulnerability fix deadlines: the average and the tail | a remediation policy sets deadlines by severity; compliance is reported as the share fixed in time, but exposure is open vulnerabilities × days, and the average hides the long tail on systems nobody owns; fixing the known-exploited ones first lowers real risk more than fixing by score; an exception needs an owner and an end date | set deadlines per severity and the team's capacity, feed a stream of vulnerabilities over owned and orphaned systems, order the queue by score or by known exploitation, read the in-time percentage, the exposure and the oldest open item | expl | S | P2 | CMP, SEC | delivery in `win-wsus-flow` and update rings (§5.22); exceptions in `cmp-exceptions` → §5.24 |  |
| `cmp-dpia-triage` | live | Does this project need a data protection impact assessment? | processing likely to result in a high risk to people needs an assessment before it starts (GDPR art. 35); screening criteria add up (systematic monitoring, sensitive data, large scale, combined datasets, people in a weak position such as employees, new technology), and meeting two usually means an assessment; measures (minimisation, pseudonymisation, shorter retention, narrower access) lower the risk that remains | describe a planned IT project by toggling what it does (badge access logs, location tracking of company cars, a camera over the desks, monitoring staff computers), watch the criteria light up and the recommendation change; apply measures and read the remaining risk | expl | S | P2 | CMP | risk scoring from `cmp-risk-register` → §5.24 |  |
| `cmp-retention-hold` | live | Retention periods and the legal hold | each record class is kept for a period counted from a trigger (end of contract, end of employment), and deleting it afterwards is an obligation too (GDPR's storage limitation); a legal hold suspends deletion for the records a dispute or an investigation touches; deleted data lives on in backups until they age out | set retention for a few record classes on a timeline, run the years, place a dispute that starts a hold and later lifts it; see records kept too long, deleted on time, deleted under a hold, and erased data still inside the backup set | expl | S | P2 | CMP | DR S8 (a retention plan); backup ageing from `retention-gfs` → §5.24 |  |
| `cmp-data-subject-request` | live | A data subject's request: find every copy within a month | a person may ask for a copy of their data or for its erasure, and the answer is due within one month (two more for complex requests, GDPR art. 12); personal data sits in more places than the main system (exports, mailboxes, shared folders, test copies, backups), so the record of processing activities decides how much is found; erasure reaches backups only as they age out | follow a request through a small organisation's systems with a good, a partial or no data map, watch the clock and what is found or missed; switch to an erasure request and see what stays in the backups and how that is recorded | step | M | P2 | CMP | the backup ageing from `cmp-retention-hold` → §5.24 |  |
| `cmp-breach-triage` | live | Personal-data breach: record, notify, inform | a breach of the confidentiality, integrity or availability of personal data is notified to the supervisory authority unless it is unlikely to result in a risk to people (GDPR art. 33), and the people are told when the risk is high (art. 34); strong encryption with a key that was not lost turns a lost laptop into a breach that is only recorded; every breach goes into the internal register whatever the outcome | step through cases (a lost laptop, an e-mail to the wrong recipient, ransomware that also took data, a restore that lost two days) and toggle the factors (encrypted, which data, how many people, recovered in time); watch the decision move between record, notify and inform | step | S | P2 | CMP, SEC | the clocks from `cmp-incident-clocks` → §5.24 |  |
| `cmp-nis2-scope` | live | In scope? Essential and important entities | NIS2 applies by sector and size: medium and large organisations in the listed sectors are in, large ones in the high-criticality sectors are essential and the rest important, and some are in whatever their size (for example DNS service providers, top-level-domain registries, public administration); the class decides how supervision works (before or after an incident) and the fine ceiling; the national law and the authorities' lists have the final word | toggle sector, headcount, turnover, balance sheet and special roles for a few example organisations, watch the class change at each threshold, compare what follows for each class | expl | S | P2 | CMP | size thresholds from the EU definition of small and medium enterprises; the Croatian law categorises through the competent authorities *(check)* |  |
| `cmp-incident-clocks` | live | Incident reporting clocks: 24 hours, 72 hours, one month | under NIS2 a significant incident starts the clocks at awareness: an early warning within 24 hours, an incident notification within 72 hours, a final report within a month of the notification (art. 23); a personal-data breach goes to the supervisory authority within 72 hours of awareness (GDPR art. 33); the clocks start when the organisation becomes aware, not when the attack began, and run through weekends; one incident can start both sets | place an incident on a timeline (start, detection, triage, classified as significant, personal data involved?), watch which clocks start and when each runs out; detect later, let it happen on a Friday evening, slow the triage down and see a deadline missed | step | M | P1 | CMP, DR, SEC | an outage found late (`rpo-rto` preset "found on Monday"); hub of the incident-timeline model → §5.24 |  |
| `cmp-bia` | live | Business impact analysis: what must come back first | the analysis sets each business process's maximum tolerable downtime; a supporting system inherits the shortest one of every process that depends on it (identity, name resolution and the network end up most urgent); its recovery time objective must be below that, and the gap between required and achievable recovery is the work list | set tolerable downtime for a handful of processes, draw what they depend on, watch required RTOs propagate down the graph, enter what recovery can achieve today and read the gaps and the recovery order | expl | M | P2 | CMP, DR | `rpo-rto`; the hidden dependencies of `faultline` and `ha-never-zero-spof`; the price of the hours in `fin-downtime-cost` → §5.24 |  |
| `cmp-restore-evidence` | live | Restore tests as evidence: covering the estate in a year | a backup policy is proven by restore tests, not by job reports; with a few test slots a quarter, the order decides which systems are never tested; each test record (date, scope, time taken against the promised RTO, result, sign-off) is the evidence, and a restore slower than the RTO is a finding even when it succeeds | schedule restore tests for a dozen systems over four quarters with limited slots, ordered by criticality or not, run the year; read the coverage, the systems never tested, the measured times against the RTOs and the evidence an auditor receives | expl | S | P2 | CMP, DR | the failure itself is `restore-drill` ("the backup that lies"); RTOs from `cmp-bia` and `rpo-rto` → §5.24 |  |
| `cmp-vendor-tiers` | live | Supplier risk: tiers and how deep to check | suppliers are tiered by what they reach (personal data, production access, a critical service) and how hard they are to replace; the depth of checking follows the tier (a short questionnaire, certification evidence, contract clauses with audit rights); assessment time is limited, so checking everyone the same way spreads it thin; a supplier's own subcontractors and many services on one provider (concentration) are risks too; NIS2 lists supply-chain security among the required measures (art. 21) | tier thirty suppliers with a rule, set the assessment budget, compare one questionnaire for all with tiered checking (risk covered per hour spent), then reveal a critical subcontractor and a shared provider | expl | M | P2 | CMP | risk scoring from `cmp-risk-register` → §5.24 |  |
| `cmp-shared-responsibility` | live | Shared responsibility: who runs which control in the cloud | moving a workload from own servers to rented infrastructure, a platform or a finished application hands controls to the provider layer by layer (building, hardware, operating system, application); the customer always keeps the data, the identities and who has access, and the backups of data held in someone else's application; a gap opens where each side assumes the other does it; the provider's assurance report is evidence only for its own part | move a workload across the four models and watch each control change owner; mark the controls you believe the provider covers and see the gaps; open the provider's report and see which of your controls it does not prove | expl | S | P2 | CMP | the cost side of the same move is `fin-cloud-commitment` (§4.12) → §5.24 |  |
| `cmp-exceptions` | live | Exceptions to policy: an accepted risk with an end date | an exception to a standard is a risk acceptance: it needs an owner, a compensating control and an expiry date; without expiry, exceptions pile up until they are the real policy; a review at expiry renews, fixes or escalates | grant exceptions over two years with and without expiry dates and reviews, and watch the share of the estate that really meets the standard and the age of the oldest exception | expl | S | P3 | CMP | acceptance from `cmp-risk-register` → §5.24 |  |
| `cmp-maturity-levels` | live | Maturity levels: the average hides the weakest area | each control area is rated on a scale from ad hoc to measured and improving; one average looks fine while one area stays at the bottom, and the weakest area is where incidents and findings come from; each level up costs more than the last, so a target per area beats raising everything | rate the current and target levels of eight areas on a radar, spend a budget to raise them, compare the average with the weakest area and with the findings a simulated audit raises | expl | S | P3 | CMP |  |  |
| `cmp-cost-of-noncompliance` | live | The price of non-compliance and the price of controls | the fine ceiling is the higher of a fixed sum and a share of worldwide yearly turnover (GDPR up to €20 million or 4%; NIS2 at least €10 million or 2% for essential entities and €7 million or 1.4% for important ones), so for a large firm the percentage decides and for a small one the fixed sum; the expected yearly cost is incident likelihood × (incident cost + chance of a fine × fine), to compare with what the controls cost each year; under NIS2 the management body is answerable for the measures | set turnover, entity class, incident likelihood and control spend, watch the ceiling switch from the fixed sum to the percentage, compare the expected yearly cost with the control budget | expl | S | P3 | CMP, FIN | the expected-loss model from `fin-ale-risk` (§4.12) → §5.24 |  |

**Croatian titles.**

- `cmp-policy-to-record` — Politika, standard, procedura, zapis: trag kojim ide revizor
- `cmp-audit-sampling` — Uzorkovanje u reviziji: koliko zahtjeva treba provjeriti
- `cmp-risk-register` — Registar rizika: vjerojatnost × učinak, postupanje i preostali rizik
- `cmp-change-risk-class` — Upravljanje promjenama: razredi rizika ili jedan odbor za sve
- `cmp-jml-drift` — Dolazak, premještaj, odlazak: kako se ovlasti gomilaju
- `cmp-sod-toxic` — Razdvajanje dužnosti: nespojive kombinacije ovlasti
- `cmp-four-eyes` — Načelo četiri oka: kad drugi potpis postane formalnost
- `cmp-privileged-access` — Stalna ili privremena administratorska prava; račun za hitne slučajeve
- `cmp-log-evidence` — Zapisi kao dokaz: potpuni, točnog vremena, izvan dosega administratora
- `cmp-patch-sla` — Rokovi za otklanjanje ranjivosti: prosjek i rep
- `cmp-dpia-triage` — Treba li projektu procjena učinka na zaštitu podataka?
- `cmp-retention-hold` — Rokovi čuvanja i obustava brisanja zbog spora
- `cmp-data-subject-request` — Zahtjev ispitanika: pronaći svaku kopiju u roku od mjesec dana
- `cmp-breach-triage` — Povreda osobnih podataka: evidentirati, prijaviti, obavijestiti
- `cmp-nis2-scope` — Jesmo li obveznici? Ključni i važni subjekti
- `cmp-incident-clocks` — Rokovi za prijavu incidenta: 24 sata, 72 sata, mjesec dana
- `cmp-bia` — Analiza utjecaja na poslovanje: što se mora prvo vratiti
- `cmp-restore-evidence` — Testovi obnove kao dokaz: cijelo okruženje u godini dana
- `cmp-vendor-tiers` — Rizik dobavljača: razine i dubina provjere
- `cmp-shared-responsibility` — Podijeljena odgovornost u oblaku: tko provodi koju kontrolu
- `cmp-exceptions` — Iznimke od politike: prihvaćeni rizik s rokom isteka
- `cmp-maturity-levels` — Razine zrelosti: prosjek skriva najslabije područje
- `cmp-cost-of-noncompliance` — Cijena neusklađenosti i cijena kontrola

**Where Croatian and EU practice matters** (one line each, for the page's notes, not the model; confirmed by the owner
on 2026-11-08, so these may be named on the page):

- `cmp-nis2-scope`, `cmp-incident-clocks`, `cmp-cost-of-noncompliance`: NIS2 is implemented by the Zakon o kibernetičkoj
  sigurnosti (NN 14/2024) and a government regulation under it; the law speaks
  of ključni i važni subjekti, and the competent authorities categorise entities and notify them rather than entities
  deciding for themselves; which body receives incident reports for which sector; the national fine amounts, each
  quoted with its article.
- `cmp-breach-triage`, `cmp-incident-clocks`, `cmp-data-subject-request`, `cmp-dpia-triage`: the supervisory authority is
  the Agencija za zaštitu osobnih podataka (AZOP); the Zakon o provedbi Opće uredbe o zaštiti podataka (NN 42/2018) adds
  national rules, for example on video surveillance and on fines for public bodies; AZOP's list of processing
  that always needs an impact assessment.
- `cmp-dpia-triage`: monitoring employees also involves the workers' council under the Zakon o radu.
- `cmp-retention-hold`: statutory retention periods for accounting, payroll and personnel records come from several
  Croatian laws (Zakon o računovodstvu, Zakon o radu, Zakon o arhivskom gradivu i arhivima); the page uses illustrative
  periods; a statutory period is quoted only with its law and article.
- `cmp-incident-clocks`, `cmp-vendor-tiers`: financial entities follow DORA (applying since 17 January 2025) for ICT
  incidents and ICT third-party risk, with their own reporting timings and a register of ICT third-party arrangements;
  the supervisors are the Hrvatska narodna banka and HANFA. A DORA preset is optional.
- `cmp-risk-register`, `cmp-policy-to-record`, `cmp-maturity-levels`: ISO/IEC 27001 (2022 edition) certification is
  voluntary; the measures the cybersecurity law requires cover similar ground.

**Suggested order for a course playlist** (`courses/cmp-it-managers.json`, "Usklađenost i procedure za IT menadžere /
Compliance and procedures for IT managers", `lang: hr`; text only, no file yet):

1. *Pravila i dokazi / Rules and evidence*: `cmp-policy-to-record`, `cmp-audit-sampling`, `cmp-maturity-levels`,
   `cmp-exceptions`
2. *Rizik / Risk*: `cmp-risk-register`, `cmp-vendor-tiers`, `cmp-shared-responsibility`, `cmp-cost-of-noncompliance`,
   then `fin-ale-risk` for the same risks in money
3. *Tko smije što / Who may do what*: `cmp-jml-drift`, `cmp-sod-toxic`, `cmp-four-eyes`, `cmp-privileged-access`,
   `cmp-log-evidence`
4. *Promjene i ranjivosti / Changes and vulnerabilities*: `cmp-change-risk-class`, `cmp-patch-sla`
5. *Osobni podaci / Personal data*: `cmp-dpia-triage`, `cmp-retention-hold`, `cmp-data-subject-request`,
   `cmp-breach-triage`
6. *Kad nešto pođe po zlu / When something goes wrong*: `cmp-nis2-scope`, `cmp-incident-clocks`, `cmp-bia`,
   `cmp-restore-evidence`, then the existing `rpo-rto` and `restore-drill` as the technical side

**Suggested `learn.json` placement** (outline only; add nodes as their sims become ready). A new area between `money`
and `linux`, since none of the existing areas is about rules and proof:

- **`compliance`**: "Pravila i dokazi: usklađenost i procedure" / "Rules and proof: compliance and procedures"; blurb
  "Rizik, pristupi, promjene, osobni podaci i incidenti onako kako ih traže GDPR, NIS2 i revizor." / "Risk, access,
  changes, personal data and incidents the way GDPR, NIS2 and the auditor ask for them." (94 / 99 chars)
  - `evidence` "Pravila i dokazi" / "Rules and evidence"
    - `trail`: `cmp-policy-to-record`
    - `sampling`: `cmp-audit-sampling`
    - `maturity`: `cmp-maturity-levels`, `cmp-exceptions`
  - `risk` "Upravljanje rizikom" / "Managing risk"
    - `register`: `cmp-risk-register`, `fin-ale-risk`
    - `suppliers`: `cmp-vendor-tiers`, `cmp-shared-responsibility`
    - `price`: `cmp-cost-of-noncompliance`
  - `access` "Tko smije što" / "Who may do what"
    - `lifecycle`: `cmp-jml-drift`
    - `separation`: `cmp-sod-toxic`, `cmp-four-eyes`
    - `privileged`: `cmp-privileged-access`, `lateral-movement`
    - `logs`: `cmp-log-evidence`
  - `change` "Promjene i zakrpe" / "Changes and patches"
    - `changes`: `cmp-change-risk-class`, `lnx-deploy-strategies`
    - `vulnerabilities`: `cmp-patch-sla`
  - `personal-data` "Osobni podaci" / "Personal data"
    - `dpia`: `cmp-dpia-triage`
    - `retention`: `cmp-retention-hold`
    - `requests`: `cmp-data-subject-request`
    - `breach`: `cmp-breach-triage`
  - `incidents` "Kad nešto pođe po zlu" / "When something goes wrong"
    - `scope`: `cmp-nis2-scope`
    - `reporting`: `cmp-incident-clocks`
    - `continuity`: `cmp-bia`, `rpo-rto`
    - `restore-tests`: `cmp-restore-evidence`, `restore-drill`
- Also in existing leaves: `cmp-restore-evidence` in `resilience › backups › verify`; `cmp-bia` in
  `resilience › disaster › rpo-rto`; `cmp-change-risk-class` in `resilience › disaster › rollback`;
  `cmp-privileged-access` in `security › attacks › domain`; `cmp-cost-of-noncompliance` in `money › risk`, next to
  `fin-ale-risk` once that is placed.

### 4.14 Working on a film set

What a newcomer to a film set has to know before the first call, for a colleague who trains film crews (owner,
2026-11-08): who runs the floor and who may stop it, what each department owns and hands to the next, the order of the
calls, and the handful of hazards that hurt people on sets (power, stands in the wind, cables and blocked exits, stunts,
effects and weapons, vehicles, height, heat, fatigue). Safety comes first: six of the entries are the safety core. Each
entry puts a practice in motion and shows the contrast that makes its reason visible (with and without the practice,
the right and the wrong order, under and over the limit), never the rule as a card. Safety rules appear as the reason
behind a practice, not as regulation; numbers are illustrative and the page says so; every page says that the
production's safety briefing and the department head have the final word. Specialist work (connecting power, rigging,
stunts, effects and pyrotechnics, weapons, precision driving, operating lifts) is shown from outside, as what the
specialist controls and why everyone else stays out, never as instructions. No brands of lamps, stands, radios, lifts or
cameras; one fictional production, which may be recognisably modelled on a real, publicly documented accident named as
a visible reference (below). Owner decisions of 2026-11-08: English loanwords for roles, equipment and the day, Croatian
for the calls, and the safety law applies to everyone on set whatever the contract. Croatian terms and rules not yet
verified are marked *(check)* and stay off the pages until the owner or the colleague confirms them.

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `set-stop-for-safety` | live | Anyone can stop for safety: from seeing a hazard to the halt | the 1st AD runs the floor and calls the halt, each head of department answers for their department's work, and the safety briefing makes one rule explicit: whoever sees danger says so at once, out loud or on the radio, and work stops until it is fixed; a hazard passed along the chain ("I'll tell my boss at the break", "not my department") loses minutes at every hop and sometimes the message itself, while the hazard does not wait; nobody is blamed for a stop that turns out unnecessary; after the stop the department that owns the hazard fixes it and the 1st AD restarts | place a hazard on the set (a stand without its sandbag over a walkway, a cable across the fire exit, smoke from a lamp near a curtain), pick who notices it (a trainee from another department, a day player, the owning department's own crew) and what they do (say nothing, tell a colleague, tell their head of department at the break, call "stop" on the spot); watch the message travel hop by hop against the moment the hazard becomes an accident; switch the briefing's "anyone may stop" rule off and on | step | M | P1 | SET | based on the *Midnight Rider* train strike, 2014 (federal safety citations, Georgia criminal case); hub of the crew-and-chain model → §5.25 |  |
| `set-circuit-load` | live | Watts, volts, amps: why a circuit trips and a cable heats | a lamp's power divided by the mains voltage is the current it draws (P = V × I: 2 kW at 230 V is about 8.7 A); a circuit's breaker allows a set current (a 16 A socket circuit carries about 3.7 kW), so lamps that add up to more trip it, often mid-take; a cable heats with the current through it, and a cable left coiled on its drum cannot shed that heat, so it carries far less than when unwound before its insulation softens; a lamp plugged into another department's circuit trips their equipment too; connecting to a building's or a generator's supply is the licensed electricians' work, and the page shows the load, never the connection | plug lamps of different power into the sockets of a location's circuits, watch the current add up against each breaker and the trip when it is exceeded; run the same load through a cable coiled on its drum and fully unwound and watch its temperature; plug the kettle and the make-up mirror lights into the circuit the camera uses | expl | S | P1 | SET | idea only; hub of the electrical-load model → §5.25 |  |
| `set-stand-tipping` | live | Stands, sandbags and wind: when a stand tips | a stand tips when the overturning moment (the head's weight off-centre, and the wind's push on a frame or flag times its height) exceeds the restoring moment (the weight of the stand and its sandbags times their distance from the tipping edge); raising the riser lifts both the centre of gravity and the lever, and wind force grows with the square of the wind speed and with the frame's area, so a large frame high up in a gust is the classic accident; a sandbag on the leg under the load, the widest base, the load over a leg, a lower height and a person holding or lowering the frame in rising wind each move the balance back; above a wind limit set for the day, frames come down | build a stand (base width, riser height, a lamp or a frame of a chosen size), add sandbags and choose which leg they go on, raise the wind, watch the two moments and the tipping point; compare a small flag with a large frame, a low and a fully extended riser, a bag on the right leg and on the wrong one | expl | M | P1 | SET | idea only; hub of the forces-and-moments model → §5.25 |  |
| `set-cable-runs-exits` | w3 | Cable runs, walkways and exits: evacuating the set | cables, stands and cases left where people walk turn into trips, and on a location the same clutter narrows doors, corridors and stairs and blocks the fire lane outside; good practice runs cables along walls and over doorways, covers the crossings people must use, keeps one walkway and every exit clear and never wedges a fire door open for a cable; an alarm in the middle of a take shows the difference in seconds, when everyone heads for the nearest exit at once, perhaps in the dark or in smoke | lay cable runs and park gear on the floor plan of a location flat, then sound the alarm and watch crew and cast walk out: trips at open crossings, a queue at a narrowed corridor, an exit blocked by a cart, a fire door held open; tidy the runs, run it again and compare the time until the last person is out | step | M | P1 | SET | idea only; hub of the floor-plan model → §5.25 |  |
| `set-exclusion-zone` | w3 | Stunts, effects, weapons: the zone only specialists enter | a stunt, a special effect (fire, smoke, an explosion, water, wind), a weapon or a moving vehicle is planned, briefed and run by its specialist (stunt coordinator, effects supervisor, armourer, precision driver), who sets a zone and a sequence of its own: a briefing for everyone on set, a rehearsal at walking pace, the zone cleared and checked, the specialist reports ready, the 1st AD calls it, the action, and the specialist's "all clear" before anyone re-enters; "cut" stops the camera, not the hazard (a burning element, hot debris, a weapon not yet checked), so the all-clear, not the cut, opens the zone; whoever missed the briefing does not know where the zone is; everyone else stays out and touches nothing in it | step through a scene with an effect and a stunt on the floor plan, choose who attended the briefing, move crew into or out of the zone at each call, skip a step (no rehearsal, re-entry on "cut", a late arrival who missed the briefing) and see the near miss it produces; compare with the full sequence | step | M | P1 | SET | based on the *Rust* prop-gun shooting, 2021 (New Mexico safety bureau citation, criminal case); the floor plan from `set-cable-runs-exits` → §5.25 |  |
| `set-fatigue-turnaround` | live | Long days, short nights: turnaround and the drive home | turnaround is the rest between one day's wrap and the next day's call; every hour the day runs over comes out of it, and travel, packing up and getting home shorten the sleep left inside it; lost sleep accumulates through the week as a sleep debt; reaction time worsens with hours awake (research puts 17 to 19 hours awake on a par with a blood alcohol level many countries set as the driving limit), so the most dangerous part of a long day is often the drive home; a fixed minimum rest, an earlier wrap, a room near the location or a driver for those who live far, and a shorter next day each break the chain | plan a five-day week of calls and wraps, let days run over, set each crew member's travel time; watch turnaround, sleep, hours awake at the drive home and the fatigue risk climb through the week; apply the remedies one at a time | expl | S | P1 | SET | idea only; the week holds its own model; the shooting day of `set-call-sheet` → §5.25 |  |
| `set-chain-of-command` | live | Who decides what: the chain of command on set | the director decides what the shot is, the producers and the production manager decide money and schedule, the 1st AD runs the floor (the order of work, the calls, the clock and the safety halt), each head of department decides how their department does its part and speaks for it; requests go through the department head and the 1st AD, not straight to someone else's crew; with forty people talking to everyone directly the links multiply (n(n−1)/2) and contradictory instructions reach the same person, while through the heads of department each person has one boss and one line up | send requests across the set (move a lamp, go thirty minutes over, the actor needs five minutes, the stand in the exit must go, a new prop for the next scene) either straight to whoever is nearest or through the department head and the 1st AD; watch who must approve each one, the contradictory orders, the lost requests and the time to an answer; count the links in both modes | step | S | P2 | SET | the crew model from `set-stop-for-safety` → §5.25 |  |
| `set-who-touches-what` | live | Departments: who touches what | each department owns its equipment and its work: lamps and power belong to electric; stands, flags, dolly track and rigging to grip; the camera and its cards to camera; microphones and the transmitters on actors to sound; the dressed set to art; whatever actors handle to props; clothing to costume; faces and hair to make-up; the location's rules and its owner to locations; paperwork, transport and catering to production; a well-meant move by someone from another department breaks something they cannot see (a stand moved off its sandbag, a dressed cup that no longer matches the last take, a hot lamp, a camera setting changed); the rule is to ask the department that owns it | meet a dozen small problems on set (a flag throws a shadow on the actor, a cup is in the wrong place, a cable crosses the walkway, a costume is wet, a lamp sits close to a curtain), give each to a department or fix it yourself, and see what follows from each choice: the fix, the continuity error, the burn, the stand left without its bag | expl | S | P2 | SET | the crew model from `set-stop-for-safety` → §5.25 |  |
| `set-calls-sequence` | w3 | The calls: from "lock it up" to "moving on" | a take runs on a fixed sequence of calls from the 1st AD and the departments: last looks, lock it up (the area held quiet and clear, doors and passers-by stopped), roll sound and "speed", roll camera, the slate marks the take, action, cut, then reset or back to one, check the take, and "moving on" when the setup is done; each call is a handshake that tells every department what it may and may not do (nobody crosses the frame or talks after "roll", nobody moves before "cut", lamps and dressing are touched only on reset); called out of order or not heard, the take is lost (no sound at action, a passer-by in frame, no slate) or someone is standing where the camera, a vehicle or an effect will be | step through a take and pick a department (camera, sound, grip, make-up, a production assistant at the door) to see what it does and must not do at each call; then reorder or skip calls, let one department miss a call on a noisy radio, and see what the take and the floor look like | step | M | P2 | SET | idea only; the calls travel on the main radio channel of `set-radio-discipline` |  |
| `set-setup-cycle` | w3 | Block, light, rehearse, shoot: the order of a setup | each setup runs in an order that lets the departments hand over without redoing work: the director and actors block the scene in a private rehearsal, the crew watch and marks are set, stand-ins take the actors' marks while camera, electric and grip light and rig (second team), the actors go to make-up and costume, then first team returns for a rehearsal on camera, last looks, and the take; lighting before the blocking is known means relighting, and a change after the marks are set costs every department its work; a setup's length is the longest chain of waits, not the sum of everyone's work | arrange the steps of a setup on a timeline and give them to departments, change the blocking after the light is set, skip the stand-ins, and see the rework and the total time; compare the right order with a few tempting shortcuts | step | M | P2 | SET | idea only; a setup's length feeds the day in `set-call-sheet` |  |
| `set-radio-discipline` | live | Radio discipline: one channel, many voices | a handheld radio channel carries one voice at a time; two people pressing at once block each other and neither is heard, and someone far off may not hear that the channel is busy; each department has a channel of its own and the main channel belongs to the 1st AD's calls; long talk moves to a side channel, messages say who for and who from, stay short and are acknowledged ("copy"); a crowded main channel delays the one urgent "stop" call, while an agreed emergency word clears the channel at once | put departments on one or several channels, set how often and how long they talk, then send an urgent stop call; watch the queue, the doubled transmissions and the delay until it is heard; switch discipline on (short messages, side channels, the emergency word) and compare | expl | S | P2 | SET | idea only; a shared channel is the mechanism of `csma-cd` and `hidden-node`; a net with a control station is `kk-directed-net` → §5.25 |  |
| `set-call-sheet` | w3 | The call sheet: a day's plan and what one change moves | the call sheet is the day's plan: the scenes in shooting order with location, cast and the departments and equipment each needs, call times staggered by department (those who prepare come first), the meal break, the planned wrap, the weather, the nearest hospital and the safety notes for the day's hazards; one change ripples through it: moving a scene to another location adds a company move, a later actor call moves make-up's call, a new effect adds a briefing and its specialists; everyone reads it the night before | build a day from five scenes at two locations, order them, set each department's preparation time, and watch call times, company moves, the meal break and the wrap; then make the classic changes (swap two scenes, add a night exterior, add a stunt) and follow what changes for each department and for the next day's turnaround | expl | M | P2 | SET | idea only; hub of the shooting-day model → §5.25 |  |
| `set-card-handoff` | w3 | Camera cards: never wiped before two checked copies | a camera card holds the only copy of the day's shots until it is copied; the hand-over from camera to the data team is logged, each copy is checked against the card by a checksum, and the card goes back to camera to be wiped only when two verified copies exist on separate drives kept apart; a card wiped early, a copy nobody verified, or both copies on one drive lose a scene that cannot be reshot without the whole unit; the camera report and the labels let anyone see which card is safe to wipe | shoot a day on several cards, move each through hand-over, copying and verification, choose when to send it back for wiping; inject a failed copy, a dropped drive and a mislabelled card; see which takes survive with and without the two-copies rule and the log | step | S | P2 | SET | idea only; the same rule as backups: `ransomware-321`, `restore-drill` → §5.25 |  |
| `set-risk-controls` | live | Remove the hazard first: the order of controls | a hazard's risk is how likely harm is times how bad it would be; controls work in an order of strength: remove the hazard (shoot the stairs dry, cut the stunt), replace it with something less dangerous (a stunt performer, a soft prop, a cooler lamp), separate people from it (a barrier, a rail, an exclusion zone), organise the work (a rehearsal, a briefing, a spotter, fewer people present) and, last, personal protection (gloves, pads, ear defenders); the lower controls depend on someone remembering every time, so they fail more often, and a scene protected only by them keeps most of its risk | take three planned scenes (an actor running down wet stairs, a lamp on a high stand over the crew, a car passing close to the camera), choose controls from each level and see the risk that remains; run each scene many times with people sometimes forgetting the organisational and personal controls and count the injuries | expl | S | P2 | SET | based on the *Star Wars* powered-door injury, 2014 (UK safety regulator's prosecution, 2016); likelihood × impact scored as in `cmp-risk-register` → §5.25 |  |
| `set-emergency-response` | w3 | An injury on set: the first ten minutes | when someone is hurt the work stops, one named person calls the emergency number with the exact address from the call sheet, the set's first-aider takes over, one person goes to meet the ambulance at the agreed point, the access route is cleared, and everyone else keeps back; the time until care arrives is the sum of these steps, and a missing address, "someone must have called", a blocked access road or a crowd around the injured each add minutes; afterwards the incident is reported so its cause can be fixed | step through an injury on a location shoot with and without the call sheet's address and meeting point, a named caller, a cleared access route and a first-aider on set; watch the clock to first aid and to the ambulance's arrival | step | S | P2 | SET | idea only; the floor plan from `set-cable-runs-exits`; the clock from awareness as in `cmp-incident-clocks` → §5.25 |  |
| `set-working-at-height` | live | Working above others: dropped objects and the zone below | a tool or a clamp dropped from height lands with energy that grows with its mass and the height (E = m·g·h: a 1 kg clamp from 6 m about 59 J), enough to injure badly without a hard hat; the controls are a zone below that nobody enters while someone works above, tools tied on, a platform with rails instead of a ladder, and ladders and lifts used only by those trained for them; a fall of two metres can already cause serious injury, so rails and harnesses come before speed | place someone working on a ladder, a platform or a lift above a busy set, choose what they hold, the height and who walks below; drop something at random moments and count the hits; add a closed zone below, tethered tools and rails and compare | expl | S | P2 | SET | idea only; the floor plan from `set-cable-runs-exits` → §5.25 |  |
| `set-lamp-heat` | w3 | Hot lamps: burns, fire distance and the cool-down | a tungsten lamp turns most of its power into heat; its housing and front glass get hot enough to burn skin within a second or two, and a curtain, paper or a gel too close to its front can scorch or catch fire; radiant heat falls with distance, about with its square, so each lamp has a minimum distance to flammable material; after switching off it stays too hot to touch or pack for many minutes; LED lamps run cooler, but their housings and power units still get hot; gloves, distance and time to cool are the practice, and only electric handles lamps | place lamps of different power and type near a curtain, a paper lantern, a gel and an actor, read the heat at each, find the safe distances; switch off and watch the housing cool to a touch-safe temperature over time; strike a lamp too early with and without gloves | expl | S | P2 | SET | idea only; the lamps from `set-circuit-load` → §5.25 |  |
| `set-continuity` | w3 | Continuity: shooting out of story order | scenes are shot in the order that suits locations and cast, not the story; every object, costume, hairstyle, make-up and wound, a glass's level and an actor's hand must match from one shot to the next in the story, even when the shots are days apart; the script supervisor's notes and photos record the state at each cut, and props, costume and make-up restore it before the take; a reset without notes, a prop moved by someone else or a lunch break in the middle of a scene shows as a jump in the edit | shoot a short story of six shots out of order across two days, change the state of a few items between takes (a coat gets wet, a candle burns down, a glass is half empty), choose which departments keep notes and photos; then play the edit in story order and find the jumps | step | S | P3 | SET | idea only; the shooting order from `set-call-sheet` → §5.25 |  |
| `set-working-load` | live | Working loads and safety factors in rigging | hanging hardware is rated with a working load limit well below its breaking strength (the safety factor), because wear, a sudden stop and uneven loading eat into the margin; a load that drops a short way before the line catches it pulls many times its own weight; two lines holding one load at an angle each carry more than half of it, more as the angle opens, and the whole weight each at 120 degrees; the chain is as strong as its weakest piece; rigging is set and checked by riggers and grips only, and everyone else walks around it, never under it | hang a lamp from one line or two, open the angle between them, let it drop a short way and be caught, swap in a weaker link; watch each line's force against its working load limit and the margin left | expl | S | P3 | SET | idea only; the forces from `set-stand-tipping` → §5.25 |  |
| `set-picture-vehicles` | w3 | Picture vehicles and camera cars: stopping distance | a vehicle moving in a shot needs its stopping distance clear: the distance covered while the driver reacts plus the braking distance, which grows with the square of the speed and lengthens on a wet or loose surface; crew and camera stand outside that envelope or behind protection, the crew on a camera car are strapped in, rehearsals start at walking pace, and a public road is closed or controlled by those authorised to do it; nobody steps out to fix anything while a vehicle is moving | set the speed, the surface and the reaction time, watch the envelope ahead of a passing car grow, place the camera, a grip and a production assistant around the route and see who is inside it; compare rehearsal speed with take speed | expl | S | P3 | SET | idea only; the zone from `set-exclusion-zone` → §5.25 |  |
| `set-manual-handling` | w3 | Lifting and team carries | the load on the lower back depends less on an object's weight than on how far from the body it is held (a lever), and on twisting, reaching high and carrying far; a lift is planned before it starts: the route cleared, a trolley if there is one, two or more people with one caller for heavy or awkward items, everyone lifting and setting down together; when one carrier stumbles or lets go, the others take the extra share at once, which is how many team-carry injuries happen | choose an object (a case, a lamp, a length of dolly track, a generator part), the number of carriers, how far from the body it is held and the route; watch the load on each back against an illustrative guideline; let one carrier let go; add a caller, a trolley and a cleared route | expl | S | P3 | SET | idea only; the moments from `set-stand-tipping` → §5.25 |  |
| `set-phase-balance` | live | Three phases: spreading the lamps on a generator | a generator or a large supply has three phases, each with its own limit; lamps are spread across them so that each phase carries a similar load; piling lamps on one phase trips it while the other two idle, and an unbalanced load sends current back through the neutral conductor, which can then overheat; the electricians plan the distribution before the lamps are placed, and everyone else plugs in only where they are told | plug lamps into the three phases of a generator's distribution, watch each phase's current and the neutral current, unbalance it on purpose and trip one phase, then rebalance and compare | expl | S | P3 | SET | idea only; builds on `set-circuit-load` → §5.25 |  |
| `set-hearing` | live | Noise over a shooting day: the dose adds up | sound level in decibels is logarithmic: every 3 dB more is twice the sound energy, so the time someone can spend at that level halves; a day near a generator, a wind machine, blank-firing weapons or explosions adds up to a daily dose in which short loud events weigh heavily; ear defenders cut the level that reaches the ear, but only while they are worn, and distance helps (outdoors, double the distance from a source and the level falls by about 6 dB); the effects crew and the armourer announce loud events in their briefing | build a crew member's day from exposures (a quiet dialogue scene, the generator, the wind machine, a scene with blank-firing weapons), watch the daily dose fill, put on and take off ear defenders at chosen moments, move the generator further away | expl | S | P3 | SET | idea only; the shooting day from `set-call-sheet` → §5.25 |  |
| `set-weather-lightning` | w3 | Weather limits: wind and lightning | an outdoor day has weather limits agreed before the shoot: a wind speed at which frames, high rolls and lifts come down, and a lightning rule (the seconds between flash and thunder give the distance, about 3 seconds per kilometre; when it falls under the agreed value everyone goes to shelter, and work resumes only an agreed time after the last thunder); tall stands, lifts, booms and metal rigs on open ground are where lightning finds people; heat and cold bring limits of their own (water, shade, warm clothing, breaks) | watch a storm approach a field location, count from flash to thunder, set the wind and lightning limits, and decide when to lower frames, bring the lift down and send people to shelter; compare "one more take" with following the limits | expl | S | P3 | SET | based on the Indiana State Fair stage collapse, 2011 (state investigation reports); the wind force from `set-stand-tipping` → §5.25 |  |
| `set-boom-shadow` | w3 | Boom, frame line and lamp: sound, camera and electric meet | the boom microphone wants to be as close to the actor as the frame line allows, while a lamp behind it throws its shadow onto the wall or the actor; the lens's angle of view sets how low the boom can go, and the lamp's position sets where the shadow falls; camera, electric and sound settle it together (the lamp moves, a flag cuts the light off the boom, the boom comes in from another side, or the actor wears a body microphone), each asking the other department's head rather than moving their equipment | move the actor, the lens (wider or tighter), the boom and a lamp in a side view of a room; watch the frame line, the boom's distance to the actor's mouth and the shadow on the wall; try the fix each department can offer | expl | S | P3 | SET | idea only; the departments from `set-who-touches-what` |  |

**Croatian titles** (owner, 2026-11-08: roles, equipment and the day as the English loanwords crews say, declined
where natural; the calls in Croatian; every title at most 60 characters).

- `set-stop-for-safety` — Svatko smije zaustaviti rad zbog sigurnosti
- `set-circuit-load` — Vati, volti, amperi: zašto izbaci osigurač i grije se kabel
- `set-stand-tipping` — Stativi, vreće s pijeskom i vjetar: kada se stativ prevrne *(check whether crews say stand and sandbag)*
- `set-cable-runs-exits` — Kabeli, prolazi i izlazi: evakuacija kroz set
- `set-exclusion-zone` — Kaskaderi, efekti, oružje: zona u koju ulaze samo stručnjaci
- `set-fatigue-turnaround` — Dugi dani, kratke noći: turnaround i vožnja kući
- `set-chain-of-command` — Tko o čemu odlučuje: hijerarhija na setu
- `set-who-touches-what` — Odjeli: tko smije dirati što
- `set-calls-sequence` — Komande na setu: od „Tišina!” do „Idemo dalje!” *(check the calls' exact wording)*
- `set-setup-cycle` — Proba, svjetlo, proba s kamerom, snimanje: redoslijed setupa
- `set-radio-discipline` — Disciplina na radiovezi: jedan kanal, mnogo glasova
- `set-call-sheet` — Call sheet: plan dana i što pokreće jedna promjena
- `set-card-handoff` — Kartice kamere: ne brišu se prije dviju provjerenih kopija
- `set-risk-controls` — Prvo ukloniti opasnost: redoslijed mjera zaštite
- `set-emergency-response` — Ozljeda na setu: prvih deset minuta
- `set-working-at-height` — Rad iznad drugih: predmeti koji padaju i zona ispod
- `set-lamp-heat` — Vrući reflektori: opekline, razmak od zapaljivoga i hlađenje
- `set-continuity` — Kontinuitet: snimanje izvan redoslijeda priče
- `set-working-load` — Radno opterećenje i faktor sigurnosti u riggingu *(check "radno opterećenje" for the working load limit)*
- `set-picture-vehicles` — Picture vehicle i camera car: zaustavni put i mjesto ekipe
- `set-manual-handling` — Podizanje tereta i nošenje u skupini
- `set-phase-balance` — Tri faze: raspodjela reflektora na agregatu
- `set-hearing` — Buka kroz snimateljski dan: doza se zbraja
- `set-weather-lightning` — Vremenske granice: vjetar i munje
- `set-boom-shadow` — Boom, rub kadra i reflektor: ton, kamera i rasvjeta *(check "rub kadra" for the frame line)*

**Where Croatian practice matters** (one line each, for the page's notes, not the model; everything marked *(check)* is
unverified and goes into the sim's `NOTES.md` for the owner and the colleague, not onto the page):

- All `set-` pages, set language (owner, 2026-11-08): roles, equipment and the day use the English loanwords crews
  say (gaffer, key grip, grip, boom operator, 1st AD, stand-in, call sheet, setup, wrap, picture vehicle, camera car),
  written in Croatian strings as loanwords with Croatian declension where natural (setupa, gaffera, call sheeta); a
  Croatian gloss may appear once in an explanation. The owner is asking the colleague about the rest (builders go
  ahead with the terms as listed meanwhile, owner 2026-11-08: easy to fix later): the spelling and
  declension of each loanword, and which equipment words crews say in English (stand or stativ, sandbag or vreća s
  pijeskom, flag, frame) *(check)*.
- `set-calls-sequence`, `set-radio-discipline`, `set-exclusion-zone`: the calls are in Croatian ("Tišina!", "Ton!",
  "Kamera!", "Klapa!", "Akcija!", "Rez!", "Na početne pozicije!", "Idemo dalje!"); their exact wording and order, and
  the Croatian for lock-up, speed, back to one and all clear *(check)*.
- `set-chain-of-command`, `set-setup-cycle`, `set-continuity`, `set-boom-shadow`: the Croatian glosses to give once,
  if at all: direktor filma for the production manager, skripta or skripterica for the script supervisor, mizanscena
  for blocking, rub kadra for the frame line *(check)*.
- All `set-` pages, Croatian rules (owner, 2026-11-08): the Zakon o zaštiti na radu and the rest rules apply to
  everyone on set, whatever their contract, and `set-stop-for-safety` and `set-fatigue-turnaround` may say so on the
  page. The law's employer's risk assessment (procjena rizika), training for safe work (osposobljavanje za rad na
  siguran način) and the worker's right to stop or leave work in serious and imminent danger without consequence may
  be named, without article numbers; the article numbers and the current amendments *(check)*; the Croatian name for
  the production's safety person (stručnjak zaštite na radu, ovlaštenik poslodavca) *(check)*.
- `set-fatigue-turnaround`: daily rest under the Zakon o radu applies to everyone on set (the EU minimum is 11
  consecutive hours, Directive 2003/88/EC art. 3); the Croatian figure and its article *(check)*.
- `set-circuit-load`, `set-phase-balance`: who may work on electrical installations and connect temporary supplies, and
  the technical rules for temporary installations *(check)*. Mains of 230 V single phase and 400 V three phase at 50 Hz
  are standard and may be on the page.
- `set-working-at-height`: the rules for ladders, platforms and lifts and the training to operate a lift *(check)*.
- `set-exclusion-zone`: pyrotechnics and explosives need a licensed person and a permit; weapons on set (real,
  deactivated, replicas, blank-firing) under the weapons law, and who issues which permit *(check)*.
- `set-picture-vehicles`: filming on a public road needs a permit and traffic control by the police or an authorised
  firm *(check)*.
- `set-hearing`: the EU noise action values (80 and 85 dB(A), exposure limit 87 dB(A), Directive 2003/10/EC) may be
  named with the directive; the Croatian rulebook that carries them *(check)*.
- `set-manual-handling`: the Croatian rules on manual handling (from Directive 90/269/EEC) set no single weight limit
  *(check)*; any kilogram figure on the page is an illustrative guideline and the page says so.
- `set-emergency-response`, `set-cable-runs-exits`: 112 is the emergency number and may be on the page; fire-door and
  escape-route rules on a location, and a fire watch when smoke or haze is used with detectors switched off *(check)*.

**Real cases as visible references** (owner, 2026-11-08). A page's scenario stays fictional (the one production, no real
names or dates in the model, the presets or the captions), but it may be recognisably modelled on a real, publicly
documented accident. The page then names the case in a visible "Na temelju / Based on" line in its notes or foot,
with the public investigation or the court record, so a lecturer can teach it as a hypothetical or point to the real
event; SPEC.md cites the source in full. Only cases with a public official report or court record qualify. The
reports below are named from memory: their exact titles, numbers and dates are *(check)* until the builder has the
document in hand.

- `set-stop-for-safety`: the 2014 train strike on a railway bridge during the shooting of *Midnight Rider* (Georgia,
  USA), crew placed on a live line without the railway's permission and without a safety briefing; the US federal
  safety agency's citations of the production company and the Georgia criminal case (guilty pleas, 2015).
- `set-exclusion-zone`: the 2021 fatal discharge of a prop gun during a rehearsal of *Rust* (New Mexico, USA), a live
  round in a weapon not checked in front of everyone; the New Mexico Occupational Health and Safety Bureau's
  investigation and citation (2022) and the state's criminal case against the armourer (2024).
- `set-risk-controls`: the 2014 injury of an actor by a powered set door during the shooting of *Star Wars: The Force
  Awakens* (UK), a hazard an engineering control could have stopped; the UK Health and Safety Executive's prosecution
  of the production company (guilty plea and fine, 2016).
- `set-weather-lightning`: the 2011 stage-roof collapse in high wind at the Indiana State Fair (USA), a concert
  stage rather than a film set, but the textbook case of a weather limit not set in advance; the state-commissioned
  investigation reports (2012) and the state safety agency's citations (owner accepted the non-film case, 2026-11-08).
- Candidates, used only if an official report or court record turns up: `set-fatigue-turnaround`, the 1997 death of
  a camera assistant driving home after a very long day on *Pleasantville* (California, USA) *(check for a court
  record)*; `set-picture-vehicles`, the 2007 camera-car crash during a test run for *The Dark Knight* (UK) *(check
  the inquest record)*.
- No case needed: the pages about how the work flows (`set-chain-of-command`, `set-who-touches-what`,
  `set-calls-sequence`, `set-setup-cycle`, `set-radio-discipline`, `set-call-sheet`, `set-card-handoff`,
  `set-continuity`, `set-boom-shadow`).
- No fitting documented case known: `set-circuit-load`, `set-phase-balance`, `set-stand-tipping`, `set-working-load`,
  `set-cable-runs-exits`, `set-emergency-response`, `set-working-at-height`, `set-lamp-heat`, `set-manual-handling`,
  `set-hearing`; they stay plainly fictional unless a builder finds a case that meets the rule and the owner agrees.

**Suggested order for a course playlist** (`courses/set-film-crew.json`, "Rad na setu / Working on set", `lang: hr`;
text only, no file yet):

1. *Tko je tko i tko zaustavlja rad / Who is who, and who stops the work*: `set-chain-of-command`,
   `set-stop-for-safety`, `set-who-touches-what`
2. *Snimateljski dan / The shooting day*: `set-call-sheet`, `set-calls-sequence`, `set-radio-discipline`,
   `set-setup-cycle`
3. *Sigurnost prije svega / Safety first*: `set-risk-controls`, `set-exclusion-zone`, `set-cable-runs-exits`,
   `set-emergency-response`
4. *Struja, svjetlo i toplina / Power, light and heat*: `set-circuit-load`, `set-phase-balance`, `set-lamp-heat`
5. *Stativi, tereti i visina / Stands, loads and height*: `set-stand-tipping`, `set-working-load`,
   `set-working-at-height`, `set-manual-handling`
6. *Na otvorenom i na cesti / Outdoors and on the road*: `set-weather-lightning`, `set-picture-vehicles`
7. *Ljudi i odjeli kroz dan / People and departments through the day*: `set-fatigue-turnaround`, `set-hearing`,
   `set-continuity`, `set-boom-shadow`, `set-card-handoff`

**Suggested `learn.json` placement** (outline only; add nodes as their sims become ready). A new area after `radio`
and before `lecturer`, since none of the existing areas is about work outside IT:

- **`film-set`**: "Rad na setu: sigurnost i tko što radi" / "Working on set: safety and who does what"; blurb
  "Sigurnost, odjeli i snimateljski dan: tko što radi, kojim redom i kada se sve zaustavlja." / "Safety, departments
  and the shooting day: who does what, in what order, and when everything stops." (89 / 98 chars)
  - `crew` "Ekipa i odjeli" / "Crew and departments"
    - `chain`: `set-chain-of-command`
    - `stop`: `set-stop-for-safety`
    - `departments`: `set-who-touches-what`, `set-boom-shadow`
  - `day` "Snimateljski dan" / "The shooting day"
    - `call-sheet`: `set-call-sheet`
    - `calls`: `set-calls-sequence`, `set-radio-discipline`
    - `setup`: `set-setup-cycle`
    - `continuity`: `set-continuity`, `set-card-handoff`
  - `safety` "Sigurnost" / "Safety"
    - `controls`: `set-risk-controls`
    - `specialists`: `set-exclusion-zone`, `set-picture-vehicles`
    - `exits`: `set-cable-runs-exits`, `set-emergency-response`
    - `weather`: `set-weather-lightning`
  - `power` "Struja, svjetlo i toplina" / "Power, light and heat"
    - `load`: `set-circuit-load`, `set-phase-balance`
    - `heat`: `set-lamp-heat`
  - `loads` "Stativi, tereti i visina" / "Stands, loads and height"
    - `stands`: `set-stand-tipping`
    - `rigging`: `set-working-load`
    - `height`: `set-working-at-height`
    - `lifting`: `set-manual-handling`
  - `health` "Zdravlje kroz dugi dan" / "Health over a long day"
    - `fatigue`: `set-fatigue-turnaround`
    - `hearing`: `set-hearing`
- Also in existing leaves: `set-card-handoff` in `resilience › backups › verify`; `set-radio-discipline` in
  `networks › local › shared-medium`, next to `csma-cd`; `set-risk-controls` in `compliance › risk › register`.

### 4.15 Antennas and radiation

Why an antenna radiates, and what follows from it, as pages that go further than the 50ohm ports: a real model
computed live, presets, and one contrast that is the stage. The list started from a reviewer's remark on `lc-antenna`,
forwarded by the owner on 2026-11-08: the resonant-circuit-to-dipole simplification holds up to the last step, but
the last step misses **time**. Field lines kink because a disturbance in the source travels outward at a finite speed
c; without travel time everything shown also holds in the near (reactive, evanescent) field, where nothing radiates.
(The reviewer's picture, from the antenna lectures at FER: a charge moving along a dipole, its radial field lines
travelling out towards the receiver, kinking because their source has moved, and so gaining the rotational part that
Maxwell's equation for rot E describes.) The owner added that the same picture explains polarization, and asked for
new, more complex pages rather than a change to `lc-antenna`, which stays as it is. Every formula is standard
(Purcell & Morin, Griffiths, Balanis, Kraus) and is checked in each sim's SPEC.md; numbers on the pages are the
textbook's, not illustrative. Croatian terms come from the 50ohm-contents-hr text where it has them; the rest are
marked *(check)*. The pages that use the kinked-field-line picture credit it as an idea in their credit line,
"from the antenna lectures at FER" (owner, 2026-11-09); no person is named on a page.

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `ant-accelerated-charge` | live | Why an accelerated charge radiates: field lines that kink | a charge's field lines start radial, but each piece of a line at distance r shows where the charge was at t − r/c; when the charge moves, jerks or oscillates along a wire, the news travels out at c and the lines kink where it has reached; the kinked part is transverse to the line of sight and falls off as 1/r, the radial part as 1/r², so far away only the transverse part is left: radiation; with c infinite the lines stay radial from the charge's current position, swing rigidly with it, and nothing travels out (the near-field picture, energy returned every period); the transverse, curling part is what rot E = −∂B/∂t ties to a changing magnetic field | kick, stop or oscillate a charge on a wire; switch c between finite and infinite; scrub time and watch the kink move out; read the transverse and radial field at two distances | expl | M | P1 | HAM | reviewer's remark on `50ohm-lc-antenna` (owner, 2026-11-08); J. J. Thomson's kink construction (Purcell & Morin ch. on radiation) → §5.26 |  |
| `ant-dipole-field` | live | The oscillating dipole: near field, far field, and loops that break away | the E field lines of a short oscillating dipole, drawn over time from the exact Hertzian solution (contours of sin²θ·[cos(kr−ωt)/(kr) − sin(kr−ωt)]): close to the wire the lines go out and come back into it every half period (reactive near field, energy stored and returned, E and H 90° apart); from about a quarter wavelength out closed loops pinch off and travel away at c; the reactive near field reaches about λ/2π, beyond it the far field, where E and H are in phase, both fall as 1/r and their ratio settles to the wave impedance of free space, about 377 Ω; with c infinite the same lines only grow and shrink and nothing pinches off | play and scrub one period; switch c between finite and infinite; move a probe out from the wire and read E, H, their phase and E/H; mark the near and far zones in wavelengths | expl | L | P1 | HAM | Hertz (1889); Balanis ch. 4, Griffiths ch. 11; builds on `ant-accelerated-charge` → §5.26 |  |
| `ant-polarization` | live | Polarization: the wave carries the antenna's direction | the transverse field a dipole sends out lies in the plane of the wire and the line of sight, so the wave is linearly polarized along the transmitting dipole (vertical dipole, vertical polarization); along the wire's own axis there is no transverse part and no radiation (the sin θ null); a receiving dipole picks up a voltage proportional to the cosine of the angle between it and the arriving E, so its power goes with cos² and is zero at 90° (cross-polarized); the same dipole receives best what it would send best (reciprocity) | rotate the receiving dipole and watch voltage and power; move the receiver from broadside to end-on; rotate the transmitter | expl | M | P1 | HAM, URM | owner, 2026-11-08 ("this explains antennas and polarization too"); the simple, linear page; `ant-tx-rx-polarization` is the complex one → §5.26 |  |
| `ant-tx-rx-polarization` | live | Different antennas at each end: polarization loss | the transmitting and receiving antennas need not match: the wave between them carries a polarization vector (a line, an ellipse or a circle, and for a circle a sense of rotation), and the receiving antenna takes its projection, the polarization loss factor \|ê_tx·ê_rx*\|², in dB; vertical against horizontal loses (in theory) everything, vertical against a 45° slant 3 dB, linear against circular 3 dB at any angle, right-hand against left-hand circular almost everything; a dipole and a small loop in the same plane are crossed; a circular wave is two crossed dipoles fed 90° apart, and amplitude or phase errors make it elliptical (axial ratio); a reflection flips the sense of a circular wave, and on a long ionospheric path Faraday rotation turns a linear wave by an angle that drifts, which is why a fixed linear antenna fades and a circular one does not | pick the Tx and the Rx antenna from lists (vertical, horizontal, 45° slant, right- and left-hand circular, small loop), rotate either, watch the E vector travel between them and the received signal and loss in dB; add a reflection; switch on Faraday rotation and drift it | expl | L | P1 | HAM | owner, 2026-11-08 ("different antennas on Tx and Rx", circular and loops included); builds on `ant-polarization` (its vector and projection, extended to complex vectors) → §5.26 |  |
| `ant-dipole-length` | live | Dipole length: current, pattern and radiation resistance | the current on a centre-fed dipole is a standing wave, zero at the open ends; at λ/2 the feed sits at a current maximum and the pattern is a slightly flattened figure eight (2.15 dBi) with about 73 Ω radiation resistance; shorter, the current is small everywhere, the pattern barely changes but the radiation resistance falls with the square of the length (a short dipole: about 790·(L/λ)² Ω), so little of the power radiates; at a full wavelength the feed sits at a current minimum (a very high impedance) and the halves' currents still add broadside; at 3λ/2 a reversed segment splits the pattern into lobes | change the length from 0.1λ to 2λ; watch the current along the wire, the pattern in the plane through the wire and the radiation resistance and feed impedance; compare the presets | expl | M | P1 | HAM | Balanis ch. 4, Kraus; related `lambda-f`, `lc-antenna`, `swr` → §5.26 |  |
| `ant-gain-directivity` | live | Gain and directivity: dBi, dBd, ERP and EIRP | an antenna does not add power, it redistributes it: directivity is how much stronger the strongest direction is than the average over the whole sphere (an isotropic radiator), so squeezing the pattern raises it while the total stays the same; gain is directivity times efficiency (losses in the wire, the coil, the ground); dBi counts from the isotropic radiator, dBd from a half-wave dipole, and dBd = dBi − 2.15; ERP and EIRP are the transmitter power plus the gain (and minus cable loss) in dBd and dBi; reading a pattern: the main lobe, the half-power beamwidth, the front-to-back ratio, the side lobes, the linear and the dB scale | squeeze and stretch a pattern and watch the directivity and the total; switch between linear and dB polar plots; add cable loss and an efficiency; read ERP and EIRP for a station | expl | M | P2 | HAM | 50ohm-contents-hr (izotropni zračitelj, dobitak, EIRP, ERP); builds on `ant-dipole-length` → §5.26 |  |
| `ant-array-phasing` | live | Two antennas together: spacing, phase and steering the beam | two identical dipoles fed together add their fields with a path difference and a feed phase; the array factor 2·cos((k·d·cos φ + δ)/2) multiplies the single pattern: λ/2 apart in phase gives a broadside beam, λ/2 apart in antiphase an end-fire one, λ/4 apart fed 90° apart a cardioid with a null at the back; changing the feed phase steers the beam; spacing beyond λ makes extra full-size lobes (grating lobes); more elements make a narrower beam | change the spacing and the feed phase, add elements up to eight, watch the pattern and the steering angle; compare the presets | expl | M | P2 | HAM | Balanis ch. 6, Kraus; builds on `ant-dipole-length` (the pattern of a set of currents) → §5.26 |  |
| `ant-ground-image` | live | An antenna above ground: the image and the angle of radiation | the ground reflects like a mirror, so an antenna above it behaves like itself plus an image below (in antiphase for a horizontal antenna, in phase for a vertical one); the direct and reflected waves add or cancel by height: a horizontal dipole low over ground radiates mostly straight up (near-vertical incidence, a short skip), high over ground it lifts lobes down to low angles (long distance), and its elevation pattern gains a lobe for every half wavelength of height; a vertical quarter-wave over a ground plane is half a dipole with its image, about 36 Ω, radiating at low angles; poor ground fills in the nulls and wastes power | raise and lower a horizontal and a vertical antenna in wavelengths; switch between perfect and poor ground; watch the elevation pattern and the take-off angle; link the angle to the skip distance | expl | M | P2 | HAM | 50ohm-contents-hr (groundplane antena, kut zračenja); builds on `ant-array-phasing` (the image as a second element); related `skip-distance` → §5.26 |  |
| `ant-link-budget` | live | From transmitter to receiver: the link budget | the received power in dB is the transmitter power, plus both antennas' gains, minus the free-space path loss 20·log(4πd/λ), minus cable, connector and polarization losses; the path loss grows 6 dB for each doubling of the distance; it seems to grow with frequency only because a receiving antenna of fixed gain catches less at a shorter wavelength (effective area Gλ²/4π), so two dish antennas of fixed size gain it back; the margin is what is left above the receiver's sensitivity, and fading needs part of it | set power, gains, cable lengths, frequency and distance; add a polarization mismatch; read each term on a bar chart in dB and the margin against the receiver's sensitivity; find the longest distance that still works | expl | M | P2 | HAM | Friis (1946); Balanis ch. 2; builds on `ant-gain-directivity`; related `fading`, `wifi-channels` → §5.26; URM (Wi-Fi) only as a side note (owner, 2026-11-09): linked from `networks › wireless › channels`, not on the URM course path |  |
| `ant-yagi` | live | The Yagi: a reflector, directors, and parasitic currents | only the driven element is fed; the others carry currents induced by its field, with a phase set by their length: a slightly longer element (a reflector) behind and slightly shorter ones (directors) in front make the fields add forwards and cancel backwards; more directors narrow the beam and raise the gain with diminishing returns, while the front-to-back ratio and the feed impedance (which falls well below 73 Ω) depend on the spacing and lengths | add and remove directors, change the lengths and spacings, watch the induced currents (amplitude and phase), the pattern, the gain, the front-to-back ratio and the feed impedance | expl | L | P3 | HAM | 50ohm-contents-hr (Yagi, reflektor, direktor, omjer naprijed-natrag); induced-EMF method with mutual impedances (Balanis ch. 8 and 10); builds on `ant-array-phasing` → §5.26 |  |
| `ant-near-field-coupling` | live | Near-field coupling: induction without radiation | inside the reactive near field two antennas couple like the windings of a loose transformer: the coupled voltage falls steeply (as 1/r³ for two small loops), it carries no energy away when nothing is there to take it, and it barely depends on polarization in the far-field sense; past about λ/2π the radiated field takes over and falls as 1/r; that is why a contactless card or a wireless charger works only at a few centimetres while a radio link reaches far, and why a meter held close to an antenna misreads its far-field pattern | move a receiving loop out from a transmitting loop and watch the coupled voltage on a log–log plot cross over from 1/r³ to 1/r; change the frequency and watch the crossover move | expl | S | P3 | HAM | 50ohm-contents-hr (reaktivno blisko polje, zračeće blisko polje, daleko polje); builds on `ant-dipole-field` → §5.26 |  |
| `ant-small-antenna` | live | Short antennas: radiation resistance, losses and bandwidth | a dipole much shorter than λ/2 has a tiny radiation resistance and a large capacitive reactance; a loading coil cancels the reactance but adds loss resistance, so the efficiency R_rad / (R_rad + R_loss) falls fast as the antenna shrinks, and the stored energy rises against the radiated (a higher Q), so the band in which the SWR stays low narrows; there is no free lunch: small, efficient and broadband, pick two | shorten the antenna and add a loading coil; change the coil's quality; watch radiation resistance, efficiency, Q and the SWR bandwidth | expl | M | P3 | HAM | 50ohm-contents-hr (skraćene antene); Chu's limit (simplified); builds on `ant-dipole-length`; related `trap-antenna`, `swr` → §5.26 |  |

Dropped or merged (one line each):
- Circular polarization on its own: merged into `ant-tx-rx-polarization`. Circular only matters next to the other
  antenna it meets, and one vector model covers linear, elliptical and circular.
- Reciprocity: one sentence in `ant-polarization` (the same dipole receives best what it sends best) and the
  effective area in `ant-link-budget`. It is a property, not a mechanism with a contrast of its own.
- Reading a radiation pattern: inside `ant-gain-directivity`. Beamwidth, front-to-back and the dB scale need a pattern
  that changes, which that page has.
- From transmission line to antenna (an opened twin line): already `lc-antenna` and `swr`; no new contrast.

**Croatian titles** (every title at most 60 characters; terms from 50ohm-contents-hr unless marked).

- `ant-accelerated-charge` — Zašto ubrzani naboj zrači: silnice koje se lome *(check "lom silnica")*
- `ant-dipole-field` — Dipol kroz vrijeme: blisko polje, daleko polje i petlje
- `ant-polarization` — Polarizacija: val nosi smjer antene
- `ant-tx-rx-polarization` — Različite antene na predaji i prijemu: gubitak polarizacije *(check "gubitak polarizacije")*
- `ant-dipole-length` — Duljina dipola: struja, dijagram zračenja i otpor zračenja
- `ant-gain-directivity` — Dobitak i usmjerenost: dBi, dBd, ERP i EIRP *(check "usmjerenost" for directivity)*
- `ant-array-phasing` — Dvije antene zajedno: razmak, faza i usmjeravanje snopa *(check "antenski niz" for array)*
- `ant-ground-image` — Antena iznad tla: zrcalna slika i kut zračenja *(check "zrcalna slika" for the image)*
- `ant-link-budget` — Od odašiljača do prijamnika: proračun veze *(check "proračun veze" against "bilanca snage")*
- `ant-yagi` — Yagi antena: reflektor, direktori i inducirane struje
- `ant-near-field-coupling` — Sprega u bliskom polju: indukcija bez zračenja *(check "sprega")*
- `ant-small-antenna` — Kratke antene: otpor zračenja, gubici i širina pojasa

**Term pairs to settle** (one line each; for each sim's `NOTES.md`, not the model):

- From 50ohm-contents-hr, settled: blisko polje, reaktivno blisko polje, zračeće blisko polje, daleko polje, dijagram
  zračenja, izotropni zračitelj, dobitak, dBi, dBd, EIRP, ERP, kut zračenja, širina snopa na polovici snage, omjer
  naprijed-natrag, polarizacija, desnokretna i lijevokretna cirkularna polarizacija, loop antena, groundplane antena,
  Yagi, reflektor, direktor, valna impedancija (377 Ω), fazni pomak, Faradayeva rotacija, silnice električnog polja,
  skraćene antene.
- Not found there, *(check)*: kašnjenje / retardacija (retardation), lom silnica (kinked field lines), usmjerenost
  (directivity), otpor zračenja (radiation resistance; one hit only), antenski niz or skupina antena (array),
  faktor niza (array factor), zrcalna slika (image antenna), gubitak polarizacije or faktor gubitka polarizacije
  (polarization loss factor), omjer osi (axial ratio), proračun veze (link budget), gušenje u slobodnom prostoru
  (free-space path loss), efektivna površina (effective aperture), sprega (coupling), faktor dobrote Q for an antenna,
  inducirana struja (induced current), parazitni element.

**Suggested order for a course playlist** (`courses/ham-antennas.json`, "Antene i zračenje / Antennas and
radiation", `lang: hr`; text only, no file yet):

1. *Zašto antena zrači / Why an antenna radiates*: `lc-antenna` (as it is), `ant-accelerated-charge`,
   `ant-dipole-field`, `ant-near-field-coupling`
2. *Polarizacija / Polarization*: `ant-polarization`, `ant-tx-rx-polarization`
3. *Dipol / The dipole*: `ant-dipole-length`, `ant-small-antenna`, `trap-antenna`, `swr`
4. *Usmjerenost / Directivity*: `ant-gain-directivity`, `ant-array-phasing`, `ant-yagi`
5. *Antena u stvarnom svijetu / The antenna in the real world*: `ant-ground-image`, `skip-distance`,
   `ant-link-budget`

**Suggested `learn.json` placement** (outline only; add nodes as their sims become ready). The existing
`radio › circuits › antennas` leaf (`lc-antenna`, `trap-antenna`, `swr`) stays; a new subject goes after `circuits`:

- **`radio › antennas`** "Antene i zračenje" / "Antennas and radiation"
  - `why` "Zašto antena zrači" / "Why an antenna radiates": `ant-accelerated-charge`, `ant-dipole-field`, `lc-antenna`
  - `near-far` "Blisko i daleko polje" / "Near field and far field": `ant-dipole-field`, `ant-near-field-coupling`
  - `polarization` "Polarizacija" / "Polarization": `ant-polarization`, `ant-tx-rx-polarization`
  - `dipole` "Dipol" / "The dipole": `ant-dipole-length`, `ant-small-antenna`
  - `directivity` "Dobitak i usmjerenost" / "Gain and directivity": `ant-gain-directivity`, `ant-array-phasing`,
    `ant-yagi`
  - `ground` "Antena iznad tla" / "Antennas over ground": `ant-ground-image`
  - `link` "Proračun veze" / "The link budget": `ant-link-budget`
- Also in existing leaves: `ant-ground-image` in `radio › propagation › ionosphere`, next to `skip-distance`;
  `ant-link-budget` in `radio › propagation › fading` and `networks › wireless › channels`.

### 4.16 Arithmetic on paper

How to add, subtract, multiply and divide on paper, from owner suggestion s-002 (2026-11-12): "elementary
mathematical problems - how to add, subtract, multiply and divide on paper". Owner decisions of the same day: one
page serves three audiences through a switch, **teacher** (the default: projected in class, any numbers, step forward
and back, a typical mistake shown with why it is wrong), **adult** (why each step works) and **child** (grades 2 to 4:
big digits, one step per click, the school phrasing); every column page works in **any base**, 10 by default, because
at university the same page shows that a base is only a way of writing a number (a carry happens when a column reaches
the base); subtraction shows **both methods side by side**, borrowing and the method Croatian schools teach. The
written forms are the Croatian ones (division as "846 : 3 = 282" with the remainders under the dividend). The Croatian
school method of subtraction is believed to be equal additions (add the base to the top digit and one to the next
digit of the number taken away) *(check)*: it stays off the pages until the owner confirms it. Six pages; the first
column page is the pilot of kit view K5 (paper columns: squared-paper cells, the carry row, crossed-out digits, the
audience and base switches).

| ID | Status | Title | Concept | Student does | Class | Size | Pri | Courses | Seed / overlap | Int |
|---|---|---|---|---|---|---|---|---|---|---|
| `ari-place-value` | live | Place value: a digit is worth what its place says | a digit is worth the digit times the base to the power of its place; ten ones regroup into one ten (in base b, b of them into one of the next place); the same quantity written in base 10, 2, 8 and 16 has other digits but is the same number | build a number from blocks, regroup ones into tens, switch the base and watch the digits change while the blocks stay | expl | S | P2 | ARI | owner suggestion s-002; pairs with `arh-twos-complement` (number-representation) |  |
| `ari-column-addition` | live | Column addition: carrying | add column by column from the right; a column whose sum reaches the base writes what is left over and carries the rest to the next column (more than 1 with three or more numbers); the carry is a regrouping, not a trick | type two to four numbers, step column by column, see the carry move, switch the base | step | M | P2 | ARI | owner suggestion s-002; pilot of kit view K5 |  |
| `ari-column-subtraction` | live | Column subtraction: two methods side by side | when a top digit is smaller, either borrow (take one from the next column, it is worth the base here) or use equal additions (add the base to the top digit and one to the next digit taken away); both keep the difference unchanged, so they give the same answer | type two numbers, step both methods at once, compare what is written where; a zero in the top number | step | S | P2 | ARI | owner suggestion s-002; after `ari-column-addition` |  |
| `ari-column-multiplication` | live | Column multiplication: partial products | multiply by each digit of the second number, write each partial product one place further left (it is multiplied by the base), then add; an area model shows why; in base 2 every partial product is the number itself or zero, shifted: shift-and-add | type two numbers, step digit by digit, open the area model, switch to base 2 | step | S | P2 | ARI | owner suggestion s-002; after `ari-column-addition`; base 2 pairs with `arh-twos-complement` |  |
| `ari-long-division` | live | Long division, the Croatian way | take as few leading digits as can be divided, ask how many times, multiply, subtract, bring down the next digit, repeat; a 0 in the quotient when a step is too small; the remainder is less than the divisor | type a dividend and a divisor, step through, see a forgotten 0 in the quotient as a typical mistake | step | M | P2 | ARI | owner suggestion s-002; after `ari-column-multiplication` |  |
| `ari-checking` | live | Is it right? Checking a result | the inverse operation checks a result (difference plus the number taken away gives the top number; quotient times divisor plus remainder gives the dividend), and an estimate from rounded numbers catches a result that is off by a place | check given results, find the wrong one, estimate before computing | expl | S | P3 | ARI | owner suggestion s-002; after `ari-long-division` |  |

**Suggested `learn.json` placement** (outline only; add nodes as their sims become ready). A new area before
`lecturer`:

- **`arithmetic`**: "Računanje na papiru" / "Arithmetic on paper"; blurb "Zbrajanje, oduzimanje, množenje i dijeljenje
  na papiru, u bilo kojoj bazi." / "Adding, subtracting, multiplying and dividing on paper, in any base."
  - `numbers` "Brojevi i mjesna vrijednost" / "Numbers and place value"
    - `place-value`: `ari-place-value`
  - `operations` "Četiri računske operacije" / "The four operations"
    - `addition`: `ari-column-addition`
    - `subtraction`: `ari-column-subtraction`
    - `multiplication`: `ari-column-multiplication`
    - `division`: `ari-long-division`
  - `checking` "Provjera" / "Checking"
    - `checking`: `ari-checking`
- Also in existing leaves: `ari-place-value` and base 2 of `ari-column-multiplication` next to `arh-twos-complement`
  once that is placed.

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
| 5.24 | **Compliance: four shared models, and evidence on top of existing sims** | `cmp-jml-drift`, `cmp-sod-toxic`, `cmp-privileged-access`, `cmp-four-eyes`; `cmp-risk-register`, `cmp-dpia-triage`, `cmp-vendor-tiers`, `cmp-exceptions`, `cmp-cost-of-noncompliance`; `cmp-incident-clocks`, `cmp-breach-triage`; `cmp-policy-to-record`, `cmp-audit-sampling`, `cmp-restore-evidence`, `cmp-log-evidence`; and `cmp-bia`, `cmp-retention-hold`, `cmp-data-subject-request`, `cmp-change-risk-class`, `cmp-patch-sla`, `cmp-shared-responsibility` | Four shared models, each built first in its hub sim and copied by the others, like §5.23's ledger: people × roles × rights over time (`cmp-jml-drift`; `cmp-sod-toxic` and `cmp-privileged-access` read the same assignments, `cmp-four-eyes` adds an approval queue); risk scoring (`cmp-risk-register`; the impact assessment, supplier tiers and exceptions score the same way, and its money view is `fin-ale-risk`'s expected loss, which `cmp-cost-of-noncompliance` reuses too); the incident timeline with clocks (`cmp-incident-clocks`; `cmp-breach-triage` adds the decision); the evidence trail, a requirement and its records over a period (`cmp-policy-to-record`; `cmp-audit-sampling` draws from it, `cmp-restore-evidence` and `cmp-log-evidence` fill it). The compliance pages link the technical ones instead of repeating them: `cmp-restore-evidence` ↔ `restore-drill` (the restore that lies) and `rpo-rto`; `cmp-bia` ↔ `rpo-rto`, `faultline`, `ha-never-zero-spof`, `fin-downtime-cost`; `cmp-retention-hold` and `cmp-data-subject-request` ↔ `retention-gfs` (erased data ageing out of backups); `cmp-privileged-access` ↔ `lateral-movement`, `win-laps`; `cmp-jml-drift` ↔ `win-group-scopes`, `win-access-token`; `cmp-change-risk-class` ↔ `lnx-deploy-strategies` and §5.22's rings; `cmp-patch-sla` ↔ `win-wsus-flow`; `cmp-log-evidence` ↔ `lnx-log-path`, `win-ipam-audit`, `ntp-sync`; `cmp-shared-responsibility` ↔ `fin-cloud-commitment`. |
| 5.25 | **Film set: five shared models, and links to existing sims** | `set-stop-for-safety`, `set-chain-of-command`, `set-who-touches-what`; `set-cable-runs-exits`, `set-exclusion-zone`, `set-emergency-response`, `set-working-at-height`, `set-picture-vehicles`; `set-stand-tipping`, `set-working-load`, `set-manual-handling`, `set-weather-lightning`; `set-call-sheet`, `set-continuity`, `set-hearing`, `set-fatigue-turnaround`; `set-circuit-load`, `set-phase-balance`, `set-lamp-heat`; and `set-radio-discipline`, `set-card-handoff`, `set-risk-controls` | Five shared models, each built first in its hub sim and copied by the others, like §5.24's: the crew and its chain, departments with their heads, the 1st AD and who passes a message to whom, hop by hop (`set-stop-for-safety`; `set-chain-of-command` and `set-who-touches-what` read the same crew); the floor plan, a location's rooms, doors, exits and walkways with gear and people placed on it and walking paths through it (`set-cable-runs-exits`; `set-exclusion-zone`, `set-emergency-response` and `set-working-at-height` place their zones and routes on it, `set-picture-vehicles` adds a vehicle's envelope to the exclusion zone); forces and moments, weights, lever arms, wind load and line tension (`set-stand-tipping`; `set-working-load` and `set-manual-handling` reuse the statics, `set-weather-lightning` the wind force); the shooting day, scenes, setups, calls, breaks and wrap on one timeline (`set-call-sheet`; `set-continuity` reads its shooting order, `set-hearing` its exposures; `set-fatigue-turnaround` keeps its own week of calls and wraps in the same day format); the electrical load, lamps, sockets, circuits and phases (`set-circuit-load`; `set-phase-balance` adds the three phases, `set-lamp-heat` uses its lamps). The set pages link the technical ones instead of repeating them: `set-radio-discipline` ↔ `csma-cd` (a shared medium with collisions) and `hidden-node` (the station that cannot hear the channel is busy), and `kk-directed-net` and `kk-priority-traffic` once built; `set-card-handoff` ↔ `ransomware-321` (copies kept apart) and `restore-drill` (a copy counts only when checked); `set-risk-controls` ↔ `cmp-risk-register` (likelihood × impact, residual risk); `set-emergency-response` ↔ `cmp-incident-clocks` (the clock runs from awareness). The real cases of §4.14 are visible references on single pages (`set-stop-for-safety`, `set-exclusion-zone`, `set-risk-controls`, `set-weather-lightning`), not part of any shared model: each page keeps the one fictional production. |
| 5.26 | **Antennas: five shared models, and links to existing sims** | `ant-accelerated-charge`, `ant-dipole-field`, `ant-near-field-coupling`; `ant-dipole-length`, `ant-gain-directivity`, `ant-array-phasing`, `ant-ground-image`, `ant-yagi`, `ant-small-antenna`; `ant-polarization`, `ant-tx-rx-polarization`; `ant-link-budget`; and `lc-antenna`, `trap-antenna`, `swr`, `lambda-f`, `skip-distance`, `fading` | Five models, each kept as a pure module inside the first sim that needs it and copied by the ones that build on it (COMMON.md §6), for the coordinator to promote to `models/`: (1) **retarded field** of a slowly moving charge and a field-line tracer that follows it (`ant-accelerated-charge`, reused by `ant-dipole-field` for its probe); (2) **Hertzian dipole field**, the exact near-to-far E and H and the stream-function contours (`ant-dipole-field`, `ant-near-field-coupling`); (3) **pattern of a set of currents**: elements with length, position, orientation, amplitude and phase, the sinusoidal current on each, the far-field sum and a numerical directivity integral (`ant-dipole-length` first; `ant-gain-directivity`, `ant-array-phasing`, `ant-ground-image` as an element plus its image, `ant-yagi` with induced currents from mutual impedances, `ant-small-antenna`); (4) **polarization vector**: a complex unit vector for each antenna and direction, the projection \|ê_tx·ê_rx*\|² and the ellipse (`ant-polarization`, `ant-tx-rx-polarization`, and the mismatch term in `ant-link-budget`); (5) **link budget in dB** (`ant-link-budget`, the ERP/EIRP readout in `ant-gain-directivity`). The new pages link the existing ones under `related` (`lc-antenna` from the two "why it radiates" pages, `trap-antenna` and `swr` from `ant-small-antenna`, `skip-distance` from `ant-ground-image`, `fading` from `ant-link-budget`); the existing pages are not changed. |

---

## 6. External material and licences

simdeck is **AGPL-3.0-or-later** (owner, 2026-10-01). It is the strongest copyleft in common use and the
"or later" keeps the upgrade path open. What it means here:

- **Network clause (§13).** Anyone who modifies a simdeck page and serves it to users must offer them the
  source. simdeck itself should do the same: every page and the index link to the source (a kit
  requirement, §7.2). The link points to a source archive of the served commit on the same server
  (`source.tar.gz`).
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
