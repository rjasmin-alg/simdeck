# lnx-lvm-snapshot: LVM snapshot filling up

| | |
|---|---|
| Task | `lnx-lvm-snapshot` (wave 3, Linux) |
| Catalogue entry | `lnx-lvm-snapshot` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-lvm-snapshot/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `lvm`, `snapshots` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-lvm-extend` is merged and reuse its model (COMMON.md §6); uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **CoW snapshot space and invalidation when full**.

The student: write to the origin, watch the snapshot fill.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-lvm-extend/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T20 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T20 → §5.2
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, section "LVM: fizički volumeni, grupe i logički volumeni" (PV/VG/LV vocabulary and extents, which the snapshot reuses; UL has no snapshot section)
- lvcreate(8) `--snapshot`/`-s`, lvs(8) attribute field (`s`, `I`), lvm.conf(5) `snapshot_autoextend_threshold`, `snapshot_autoextend_percent` (check)
- Related lab: `/home/rjasmin/projects/single-page-labs/lvm-topology-lab-v2.html` (LVM topology, snapshots and thin pools)

## Overlaps (catalogue §5)

- **§5.2 Snapshots and copy-on-write:** sto-backing-chains gets presets for qcow2, VHDX/AVHDX (covers win-hyperv-checkpoints) and VMware. LVM snapshot fill, thin overcommit and CoW filesystem stay separate pages on the same block-grid view. sto-cow-vs-row and win-vss can become presets of lnx-cow-filesystem.

## Model and presets

- **Reuses from `lnx-lvm-extend`:** the PV → VG → LV layers, extents and VG free space (`vgs` VFree), and its labels for `lvcreate`/`lvextend`. New here: a snapshot LV with its own fixed copy-on-write (CoW) area, chunks, and the Data% gauge. Classic ("thick") snapshots only; thin snapshots belong to `lnx-thin-overcommit`.
- **Scene (K3 block grid):** row 1, the origin LV `lv_data` as 16 chunks A…P with a version number on each; row 2, the snapshot's CoW area `snap` as N slots; row 3, the snapshot as the reader sees it (each cell drawn from the CoW slot if one exists, else an arrow down to the origin cell). Right: `lvs`-style line (`snap  swi-a-s---  Data% 50.00` → `swi-I-s---` when invalid), VG free, the next write in the script.
- **State:** `{ origin: [{ id, ver }], cow: [{ chunk, ver, src: 'origin'|'snap' }], cap, valid, vgFree, script: [{ target: 'origin'|'snap', chunk }], i, log }`.
- **One step:** one write from the script. Phases: (a) is the chunk already in the CoW area? (b) if not, is a slot free? if not, try autoextend; if still none, invalidate; (c) copy the old chunk into the slot (origin write) or store the new data there (snapshot write); (d) apply the write; (e) recompute Data%.
- **Rules:**
  1. First write to an origin chunk after the snapshot was taken copies the old chunk into the CoW area (one slot), then overwrites the origin. (lvcreate(8) `--snapshot`; lvm(8) "COW", check)
  2. Further writes to the same origin chunk use no new slot: the snapshot already holds the version it needs. Tie-break: the test is per chunk, not per write.
  3. Reading the snapshot: CoW slot if present, else the current origin chunk. The snapshot shows the origin as it was when taken.
  4. Writing to the snapshot (it is writable, e.g. a mounted backup copy) also takes a slot for a chunk not yet in the CoW area. (lvcreate(8), check)
  5. Data% = used slots / capacity (chunk metadata ignored; say so on the page).
  6. A write that needs slot `cap + 1` makes the snapshot invalid (`lvs` attr `I`, Data% 100): all of its content is lost; the origin and its writes continue unaffected. (lvs(8) attr field; lvmthin(7) contrast, check)
  7. Autoextend (optional): when Data% ≥ `snapshot_autoextend_threshold`, the snapshot grows by `snapshot_autoextend_percent` of its size if the VG has free extents; with no VG free space, nothing grows. (lvm.conf(5), check; needs dmeventd monitoring)
- **Params:** `cap` range 2–8 slots, default 4; `autoextend` toggle, default off; `threshold` range 50–95 step 5, default 70; `percent` range 10–100 step 10, default 50; `vgFree` range 0–8 slots, default 4 (preset `autoextend` uses 6). All `resets: true`. (16 origin chunks fixed.)
- **Presets:**
  - `fill-up` — cap 4, writes to 6 different origin chunks: Data% 25, 50, 75, 100 after writes 1–4; write 5 invalidates the snapshot; origin has all 6 writes. Derived, unchecked.
  - `same-chunks` — cap 4, 10 writes alternating chunks A and B: Data% stops at 50, snapshot stays valid and still shows the old A and B. Derived, unchecked.
  - `autoextend` — cap 4, autoextend on, threshold 70, percent 50, VG free 6, writes to 6 different chunks (checked after each write): write 3 → 75% → cap 6 (VG free 4); write 5 → 83% → cap 9 (VG free 1); write 6 → 67%, all fit. Without autoextend write 5 would invalidate. Derived, unchecked (real LVM rounds to extents and checks on a dmeventd poll, not per write).
  - `snapshot-write` — cap 4, 2 origin writes plus 2 writes into the snapshot: 100% after 4 writes, the 5th (origin) invalidates. Derived, unchecked.
  - `backup-window` — cap 3 (≈ 20% of origin), a backup reads the snapshot while the application rewrites 4 chunks: the backup's later reads fail once the snapshot is invalid. Derived, unchecked.
- **Steps:** one per write: `fill-up` 6, `same-chunks` 10, `autoextend` 6, `snapshot-write` 5, `backup-window` 8.
- **Legend:** origin chunk (solid, version number), saved old version in a CoW slot (hatched, arrow to its origin cell), snapshot-own write (cross-hatched), free slot (outline), invalid snapshot (whole row greyed with a cross). "Changed" marks the origin cell written and the slot filled in this step.
- **Captions:**
  - HR: „Prvo pisanje u blok C: stari C kopiran je u područje snimke (3 od 4 mjesta, 75 %). Ponovno pisanje u C više ne troši mjesto.“
  - EN: "First write to chunk C: the old C was copied into the snapshot area (3 of 4 slots, 75%). Writing C again takes no more space."
- **Terms:** snapshot — snimka (NLA toc T20); copy-on-write — kopiranje pri pisanju; origin volume — izvorni volumen; logical volume — logički volumen; chunk — komad (check); invalid snapshot — nevaljana snimka (check); extent — ekstent (check against UL ch12).
- **Misconceptions:** the snapshot size must equal the origin (it must hold only what changes); an LVM snapshot is a backup (it lives in the same VG and dies when full); a full snapshot slows down or stops the origin (the origin goes on, the snapshot is lost).
- **Out of scope:** thin snapshots, `lvconvert --merge`, chunk-size tuning, the CoW write penalty in numbers, `lvmcache`.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-lvm-snapshot` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-lvm-snapshot sims/lnx-lvm-snapshot` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-lvm-snapshot/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
