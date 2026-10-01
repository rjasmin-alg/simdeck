# backing-chains: Backing chains (qcow2, VHDX, VMware delta)

| | |
|---|---|
| Task | `backing-chains` (wave 2b, Storage and backup) |
| Catalogue entry | `sto-backing-chains` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/backing-chains/` |
| Class | stepper |
| Size | M |
| Priority | B1 |
| Courses | DR, NLA, WIN2 |
| Topic / tags / level | `storage` / `snapshots` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **reads fall through the chain; commit/merge; a broken link kills children**.

The student: take snapshots, write, delete or merge one in the middle.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.

## Sources

- `docs/proposal-simdeck.md` (first batch) and `docs/playbook.md` §10.8
- Catalogue seed: proposal first batch → §5.2
- `~/projects/napredna-linux-administracija/meta/toc.md`, topics T20 (LVM snapshots, thin provisioning) and
  T22 (Btrfs snapshots) for neighbouring material; no chapter written yet
- No local material on qcow2/VHDX/VMDK chains. Vendor docs to check every rule against: QEMU documentation
  "Disk Images" and "QCOW2 Image Format" (backing files), `qemu-img(1)` (`create -b`, `commit`, `rebase`),
  QEMU "Live Block Operations" (block-stream, block-commit); Microsoft Learn "Using checkpoints to revert
  virtual machines to a previous state" and "Choose between standard or production checkpoints in Hyper-V";
  VMware vSphere docs "Consolidate Snapshots" and "Delete a Snapshot" *(check titles)*
- Catalogue §5.2 (presets qcow2 / VHDX / VMware; covers `win-hyperv-checkpoints`) and §5.21 (USN rollback is
  a separate preset next to this one)

## Overlaps (catalogue §5)

- **§5.2 Snapshots and copy-on-write:** sto-backing-chains gets presets for qcow2, VHDX/AVHDX (covers win-hyperv-checkpoints) and VMware. LVM snapshot fill, thin overcommit and CoW filesystem stay separate pages on the same block-grid view. sto-cow-vs-row and win-vss can become presets of lnx-cow-filesystem.

## Model and presets

- **Scene:** K3 block grid. A vertical **stack of layers**, base image at the bottom, the active overlay
  (the one the VM writes to) on top, each a row of 8 blocks `0..7` with only its allocated blocks filled.
  An arrow from each overlay to its backing file (labelled with the file name: `base.qcow2`, `s1.qcow2`,
  `s2.qcow2`; for VHDX `disk.vhdx`, `disk_<guid>.avhdx`; for VMDK `disk.vmdk`, `disk-000001.vmdk`).
  Above the stack: **what the VM sees** (the merged view), and for a read, a probe that falls down the
  stack until it hits an allocated block.
- **State:** `{ layers: [{id, file, backing: id|null, blocks: {idx: label}, readOnly}], active: id,
  probe: {block, path: id[], result}|null, broken: id[], format: 'qcow2'|'vhdx'|'vmdk', log: [] }`.
- **One step:** one operation, shown in phases where it has them: `write b` (one step), `read b` (one step
  per layer the probe visits, max 3), `snapshot` (one step), `commit`/`merge` of a middle layer (copy phase,
  re-point phase, remove phase: three steps), `delete file` without merge (one step, then the next read
  fails).
- **Rules:**
  1. A read of block b returns the content from the topmost layer, starting at the active one, that has b
     allocated; if none has, the block reads as zeros (qcow2 format specification, backing files; see Sources) (check).
  2. A write always goes to the active layer and allocates b there; lower layers are never modified by the
     guest (copy-on-write at cluster granularity: a partial write first copies the cluster up; the model's
     block = one cluster) (qcow2 format specification) (check).
  3. An external snapshot makes the current active layer read-only and creates a new empty overlay whose
     backing file is the old active layer.
  4. **Commit (merge down)** layer L into its backing P: every block allocated in L is copied into P
     (overwriting), L's child is re-pointed to P, L is removed (called commit for qcow2, merge for VHDX,
     consolidate for VMDK). Invariant: the merged view seen from the active layer is unchanged.
  5. **Stream (pull up)** into child C from L: blocks of L that C does not have are copied into C, C's
     backing becomes L's backing, L is removed (check). Same
     invariant.
  6. Tie-break: in commit, L's block wins over P's; in stream, C's own block wins over L's.
  7. Commit into a layer that has another child (a branch) is refused: it would change what the other
     child sees (derived) (check).
  8. Deleting a backing file without merging breaks every layer above it: reads that fall through it fail
     and the image cannot be opened (derived).
  9. VHDX/AVHDX: deleting a checkpoint merges its AVHDX into the parent automatically; VMDK: deleting a
     snapshot consolidates its delta into the parent (vendor docs in Sources) (check).
- **Params:** `format` choice qcow2 / VHDX / VMDK (labels, file names and verbs only; rules 1–8 are the same);
  `op` button group: write block (select 0–7), read block (select 0–7), snapshot, merge middle, delete middle
  file; `showView` toggle (merged view row, default on).
- **Presets** (8 blocks; base has 0–3 = `A B C D`, 4–7 unallocated; derived, checked by hand):
  1. `read-through` — snapshot of base; s1 writes `1=B1`, `4=E1`; snapshot; s2 (active) writes `1=B2`, `2=C2`. Reads from the
     top: 0 → `A` (falls to base, 3 layers visited), 1 → `B2` (s2), 4 → `E1` (s1), 5 → zeros (3 layers, none
     allocated). Allocated: base 4, s1 2, s2 2.
  2. `commit-middle` — from `read-through`, commit s1 into base: base becomes `A B1 C D E1`, s2 now backs on
     base, s1 gone; the VM's view is still `A B2 C2 D E1 0 0 0` (rule 4 invariant).
  3. `stream-middle` — same chain, stream s1 into s2: s2 gains `4=E1` (keeps its own `B2`), backs on base;
     view unchanged; base untouched (rule 5).
  4. `broken-link` — same chain, delete `s1.qcow2` without merging: the next read of block 4 (and the VM
     start) fails; base alone gives `A B C D`, the week's work in s1 and s2 is unreachable (rule 8).
  5. `vhdx-checkpoints` — VHDX: checkpoint, write, checkpoint, write, delete the middle checkpoint →
     automatic merge, same outcome as `commit-middle` (rule 9; covers catalogue `win-hyperv-checkpoints`).
  6. `vmdk-delta` — VMDK names `disk-000001.vmdk`, `disk-000002.vmdk`; deleting a snapshot =
     consolidate (rule 9).
- **Steps:** `read-through` 1 snapshot + 2 writes + 1 snapshot + 2 writes + reads (3+1+2+3) = 15; `commit-middle` 5
  (build, shown as one step) + 3 = 8 (+ 2 verifying reads = 10); `stream-middle` 10; `broken-link` 1 + 1 + 1
  failed read = 3, with the build step 4; `vhdx-checkpoints` 7; `vmdk-delta` 7.
- **Legend:** allocated block (solid, labelled), unallocated (empty), read-only layer (hatched border),
  active layer (thick border, "aktivni"), backing arrow, read probe (arrow down the stack), broken layer
  (crossed, red **and** "✕" label). "Changed" marks the blocks written, copied or read in this step.
- **Captions:**
  - hr: „Čitanje bloka 4: aktivni sloj `s2` ga nema, pa čitanje pada na pozadinsku datoteku (*backing file*)
    `s1.qcow2`, gdje je `E1`."
  - en: "Commit: s1's two blocks are copied into base, s2 is re-pointed to base and s1 is removed. What the
    VM sees has not changed."
- **Terms:** backing file — pozadinska datoteka (check); overlay — prekrivni sloj (check); snapshot —
  snimka (NLA toc T20, T22 „snimke"; note UL ch23's „datoteka snimka" is tar's snapshot file, a different thing); copy-on-write — kopiranje pri pisanju (check NLA T20/T22); commit / merge —
  spajanje; checkpoint (VHDX) — kontrolna točka; chain — lanac (UL ch23 „lanac prirasnih kopija").
- **Misconceptions:** "a snapshot is a copy of the disk" (it is an empty overlay that grows); "deleting a
  snapshot deletes its data" (it merges); "a snapshot is a backup" (it dies with its base; link
  `lnx-mirror-not-backup`).
- **Out of scope:** internal qcow2 snapshots, LVM snapshots and thin pools (`lnx-lvm-snapshot`,
  `lnx-thin-overcommit`), CoW filesystems (`lnx-cow-filesystem`), live block jobs' timing, VSS
  (`win-vss`), USN rollback (catalogue §5.21: a preset next to this sim, not part of it).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `backing-chains` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh backing-chains sims/backing-chains` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/backing-chains/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
