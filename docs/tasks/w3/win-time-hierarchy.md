# win-time-hierarchy: Time in a domain

| | |
|---|---|
| Task | `win-time-hierarchy` (wave 3, Active Directory) |
| Catalogue entry | `win-time-hierarchy` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-time-hierarchy/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `time-sync` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-kerberos` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **the PDC emulator is the source, members follow DCs, Kerberos fails past 5 minutes**.

The student: drift clocks, move the PDC role.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-kerberos/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: inet-ntp-sync → §5.21
- Microsoft Learn: "How the Windows Time service works" (domain hierarchy, PDC emulator at the forest root); "Windows Time service tools and settings" (NtpServer, event 12)
- Microsoft Learn: "Maximum tolerance for computer clock synchronization" (5 min)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/forest.txt` (estate: PDC qm-dc01, manual peer `loom` 10.40.1.5)
- `docs/tasks/w2/ntp-sync.md` (`inet-ntp-sync`, the protocol itself)

## Overlaps (catalogue §5)

- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** a tree: external NTP source `loom` (10.40.1.5, from the estate) at the top → `DC01` (PDC emulator of the forest root) → `DC02`, `DC03` → members `PC-A`, `PC-B`. Each node shows its clock offset from true time (seconds) and an arrow to the node it syncs from. A Kerberos check strip at the bottom: |member − DC| per pair, red past 5 min.
- **State:** `{ round, nodes: { id: { offset, driftPerRound, source, syncs: bool, pdc: bool, config: 'domhier'|'manual'|'local' } }, events: [] }`.
- **One step:** one sync round: (a) every node drifts by its rate, (b) every syncing node takes its source's offset (instant sync; the NTP maths is in `inet-ntp-sync`), top-down, (c) the Kerberos strip is re-evaluated.
- **Rules (Microsoft: "How the Windows Time service works"; "Windows Time service tools and settings"):**
  1. Domain members (type NT5DS) sync from a DC of their domain.
  2. DCs sync from the PDC emulator of their domain (or a DC in the parent domain for a child domain's PDC).
  3. The forest root PDC emulator is the top; it should be configured with an external source and marked reliable. Without one it runs on its own clock and logs event 12 ("…it is the AD PDC emulator for the domain at the root of the forest, so there is no machine above it…").
  4. Moving the PDC role does not move the configuration: the new PDC (still domhier) has nobody above it → rule 3's event 12; the old PDC keeps its manual peer and now feeds nobody but itself (check: DCs pick the PDC by role, so they follow the new PDC).
  5. Kerberos compares clocks between parties, not with true time: a member more than 5 minutes off its DC fails (Kerberos policy, 5 min) — a whole domain that is wrong together still works.
  6. A node with W32Time stopped (or a VM that takes its time from the hypervisor instead) does not sync and drifts away (check: hypervisor time sync on a virtual DC).
  7. Tie-break: sync order within a round is top-down by tree depth, then by name.
- **Params:** `pdcSource` choice {external, none} default external; `pdcDrift` range −60…+60 s/round default 0; `memberStopped` toggle (PC-B time service off) default off; `pcbDrift` range 0–120 s/round default 40; `pdcOn` choice {DC01, DC02} default DC01.
- **Presets (5):**
  - `healthy` — all within 1 s of true time after round 1. 4 rounds. Derived, unchecked.
  - `pdc-no-source` — PDC without source drifting +60 s/round: after 10 rounds the whole domain is 10 min off true time, Kerberos strip all green (rule 5). 10 rounds.
  - `member-stopped` — PC-B's service stopped, drift 40 s/round: crosses 5 min after round 8 (320 s) → its logon fails. 9 rounds.
  - `move-pdc` — role moved to DC02 without reconfiguring: DC02 has no source (event 12), DC01 still follows `loom`; DC02 drifts +30 s/round and the domain follows it. 6 rounds.
  - `quillmoor` — estate: `qm-dc01` holds the PDC and uses `loom` (10.40.1.5) as manual peer (`forest.txt`). 3 rounds. From the DR estate.
- **Steps:** max 10.
- **Legend:** sync arrow (solid), broken sync (dashed with ✕), offset badge, PDC badge, Kerberos pair ok/fail (✓/✕); "changed" highlight marks nodes whose offset changed this round.
- **Captions:** hr: "Cijela domena kasni 10 minuta za stvarnim vremenom, ali svi se slažu međusobno — Kerberos radi." en: "The whole domain is 10 minutes behind real time, but everyone agrees with each other — Kerberos works."
  hr: "PC-B je 320 s ispred DC-a, više od 5 minuta: *Kerberos* odbija prijavu." en: "PC-B is 320 s ahead of its DC, more than 5 minutes: Kerberos refuses the logon."
- **Terms:** time source — izvor vremena (check); PDC emulator — emulator PDC-a (check); domain hierarchy — hijerarhija domene (check); clock drift — odmak sata (check); time synchronisation — sinkronizacija vremena; clock skew — razlika satova (check).
- **Misconceptions:** Kerberos needs the correct time; every machine should point at a public NTP server; moving the PDC role moves the time configuration.
- **Out of scope:** NTP offset/delay maths and stratum (`inet-ntp-sync`), poll intervals in seconds, high-accuracy time (1 s) settings.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-time-hierarchy sims/win-time-hierarchy` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-time-hierarchy/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
