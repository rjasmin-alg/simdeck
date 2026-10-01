# cow-vs-row: Copy-on-write vs redirect-on-write

| | |
|---|---|
| Task | `cow-vs-row` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-cow-vs-row` in `docs/catalogue.md` §4.6 |
| Kind | **add a preset to `sims/lnx-cow-filesystem/`** (no page of its own) |
| Folder | `sims/lnx-cow-filesystem/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | DR, NLA |
| Topic / tags / level | `storage` / `filesystems` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `lnx-cow-filesystem` merged; only one preset task per host folder at a time; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **where the old and the new block end up; the write penalty**.

The student: write to a snapshotted volume in both modes.

This is a **preset on `lnx-cow-filesystem`** (Copy-on-write filesystems), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/lnx-cow-filesystem/` (the host page) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.2
- `~/projects/napredna-linux-administracija/meta/toc.md`, T20 (LVM snapshots, thin provisioning), T22
  (Btrfs snapshots), T23 (ZFS) — chapters not written yet
- Vendor/standard references to check against: `lvcreate(8)` (classic `-s` snapshot with a COW area) and
  `lvmthin(7)`; OpenZFS documentation "Overview / Copy-on-write"; Btrfs documentation "Subvolumes" and
  "Snapshots"; SNIA Dictionary entries "copy on write" and "redirect on write" *(check titles)*
- Host task: `docs/tasks/*/lnx-cow-filesystem.md` (its model must expose a logical→physical map)

## Overlaps (catalogue §5)

- **§5.2 Snapshots and copy-on-write:** sto-backing-chains gets presets for qcow2, VHDX/AVHDX (covers win-hyperv-checkpoints) and VMware. LVM snapshot fill, thin overcommit and CoW filesystem stay separate pages on the same block-grid view. sto-cow-vs-row and win-vss can become presets of lnx-cow-filesystem.

## Model and presets

**Preset task on `lnx-cow-filesystem`.** The host shows one volume, a snapshot, and which blocks are shared
or owned. This preset adds a **mode** to the host: the same writes after a snapshot, executed as
copy-on-write (CoW) and as redirect-on-write (RoW), side by side.

- **Scene (in the host's K3 block grid):** two columns, `CoW` and `RoW`. Each shows the **live volume's
  block map** (logical block → physical slot), the **snapshot's map**, the physical slots (a row of 12),
  and an **I/O counter** (reads, writes, metadata updates) per write.
- **What the host model must support** (request under "Shared requests" in the host's `NOTES.md` if
  missing): (a) a per-volume map logical → physical, not just "shared/owned" flags; (b) a write policy
  switch `cow | row`; (c) per-operation I/O accounting; (d) two volumes run in lockstep from the same
  action list (ossimulator §11 lesson: when one finishes, run the other to its end).
- **State added:** `{ mode: 'cow'|'row'|'both', maps: {live: [], snap: []}, slots: [], io: {reads, writes,
  meta}, snapArea: [] (CoW only) }`.
- **One step:** one guest write to logical block b, with its I/Os listed in order.
- **Rules:**
  1. CoW, first write to b after the snapshot: read the old block, write it to the snapshot area, then write
     the new data **in place**: 1 read + 2 writes. The live volume stays where it was; the snapshot holds the
     old copies (classic LVM snapshot, NLA T20) (check).
  2. CoW, later writes to the same b: in place only, 1 write (the old version is already preserved).
  3. RoW: the new data goes to a **free slot**, the live map is re-pointed, the old block stays where it
     was and now belongs only to the snapshot: 1 write + 1 metadata update, no read (CoW filesystems and thin
     pools, NLA T20/T22/T23; SNIA Dictionary "redirect-on-write") (check).
  4. RoW leaves the live volume fragmented: a sequential read of the live volume jumps to wherever the
     redirected blocks landed (count the discontinuities).
  5. Deleting the snapshot: CoW drops the snapshot area (cheap); RoW frees only the slots no longer
     referenced by any map (needs reference tracking) (check).
  6. Tie-break: RoW takes the lowest-numbered free slot (derived, deterministic).
  7. Naming trap: the "copy-on-write" filesystems of NLA T22/T23 redirect on write by this taxonomy; the
     caption says so once (SNIA Dictionary) (check).
- **Params added:** `mode` choice CoW / RoW / both (default both).
- **Presets** (volume of 8 blocks in slots 0–7, snapshot taken at step 0; derived, checked by hand):
  1. `four-writes` — write blocks 1, 2, 5, 6 once: CoW **4 reads + 8 writes = 12 I/Os**; RoW **4 writes +
     4 metadata updates**, live blocks 1, 2, 5, 6 now in slots 8, 9, 10, 11; reading the live volume in order
     visits slots 0, 8, 9, 3, 4, 10, 11, 7: **4 jumps** (0→8, 9→3, 4→10, 11→7). CoW uses slots 8–11 as its
     snapshot area and the live volume stays in 0–7, no jumps.
  2. `rewrite-same` — write block 1 three times: CoW 1 read + 2 writes, then 1 + 1 = **5 I/Os**; RoW 3 writes
     (+3 meta), and the second and third free the slot of the previous live version (it is not in the
     snapshot) (rule 5).
  3. `delete-snapshot` — after `four-writes`, delete the snapshot: CoW frees the 4-slot snapshot area;
     RoW frees slots 1, 2, 5, 6 (the old blocks), live stays in 8–11.
- **Steps:** `four-writes` 4 (+1 read-back step) = 5; `rewrite-same` 3; `delete-snapshot` 5 + 1 = 6.
- **Legend (host's, plus):** in-place write (arrow into the same slot), redirected write (arrow to a new
  slot), read for copy (dashed arrow), metadata update (pointer icon). "Changed" marks the slots written in
  this step.
- **Captions:**
  - hr: „CoW (*copy-on-write*, kopiranje pri pisanju): staro se prvo pročita i prepiše u snimku, pa tek onda
    novo ide na isto mjesto — tri U/I operacije za jedno pisanje."
  - en: "RoW: the new block goes to slot 8 and only the pointer changes. One write, but the live volume is
    no longer contiguous."
- **Terms:** copy-on-write — kopiranje pri pisanju (check NLA T22); redirect-on-write — preusmjeravanje
  pri pisanju (check); snapshot — snimka (NLA toc T20/T22); write penalty — kazna pisanja (check);
  fragmentation — rascjepkanost (check); metadata — metapodaci (UL ch23).
- **Misconceptions:** "all snapshots cost the same on write"; "a copy-on-write filesystem copies the old
  block on every write"; "a RoW snapshot is free forever" (fragmentation, space held by old blocks).
- **Out of scope:** VSS (`win-vss`, the other preset on this host), backing-file chains (`backing-chains`),
  LVM snapshot fill-up (`lnx-lvm-snapshot`), journalling.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-cow-filesystem/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
