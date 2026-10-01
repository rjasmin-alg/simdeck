# lnx-cow-filesystem: Copy-on-write filesystems

| | |
|---|---|
| Task | `lnx-cow-filesystem` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-cow-filesystem` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-cow-filesystem/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `filesystems` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **snapshots share blocks; writes go to new blocks**.

The student: write, snapshot, write, see shared and owned blocks.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topics T22 (Btrfs — podvolumeni, snimke, `send`/`receive`) and T23 (ZFS na Linuxu — bazeni, `datasets`, provjera integriteta) (Napredna Linux administracija; chapters not written yet)
- OpenZFS documentation: zfs-snapshot(8), zfsprops(7) (`used`, `referenced`, `usedbysnapshots`, `written`) (check)
- Btrfs documentation: "Subvolumes", btrfs-subvolume(8) (`snapshot`), "Quota groups" (`rfer`/`excl`) (check)
- Existing modelling (object level only): `/home/rjasmin/projects/single-page-labs/zfs-btrfs-topology-lab.html` ("Snapshots are subvolumes sharing extents by copy-on-write")
- Related: `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md` `mkfs.xfs` output with `reflink=1` (file-level CoW, explanation only)
- Catalogue seed: NLA T22–23 → §5.2

## Overlaps (catalogue §5)

- **§5.2 Snapshots and copy-on-write:** sto-backing-chains gets presets for qcow2, VHDX/AVHDX (covers win-hyperv-checkpoints) and VMware. LVM snapshot fill, thin overcommit and CoW filesystem stay separate pages on the same block-grid view. sto-cow-vs-row and win-vss can become presets of lnx-cow-filesystem.

## Model and presets

- **Scene:** a pool of 24 physical blocks as a block grid (kit view K3 once it exists). Above it, one column per
  tree: the live filesystem (subvolume/dataset `podaci`) and each snapshot (`@s1`, `@s2`). Each tree lists its
  file's logical blocks 0–7, each with an arrow to the physical block it points to. Each physical block shows
  its reference count. A space table at the side: per tree "referenced" and "exclusive" (Btrfs `rfer`/`excl`,
  ZFS `referenced`/`used`), and the pool's used/free.
- **State:** `{ blocks: [{ id, ver, refs }], trees: [{ name, readonly, files: { name: [blockId] } }], poolSize,
  op, err, event }`. Block ids are allocation order; `ver` is the label (A0, A1…) for captions.
- **One step:** one operation from the preset script, in the order: validate (rule 6) → change pointers →
  allocate new blocks (lowest free id first) → recount `refs` → free blocks with `refs` 0 → recompute the space
  table.
- **Rules:**
  1. A snapshot copies the tree's pointers, not the data: it allocates 0 data blocks and every block's `refs`
     rises by 1 (Btrfs docs "Subvolumes" — snapshots share data by CoW; OpenZFS zfs-snapshot(8)).
  2. Writing a block never overwrites a block another tree points to: the new data goes to a newly allocated
     block and only the writing tree's pointer moves (copy-on-write) (Btrfs docs; OpenZFS docs "ZFS concepts"
     (check)).
  3. A block with `refs` 1 that is overwritten is freed after the new block is written (the pointer moves
     first, then the old block is released), so the pool needs one free block even to overwrite unshared data
     (check).
  4. Deleting a file in the live tree drops its pointers; blocks still referenced by a snapshot stay allocated:
     the pool's used space does not fall (zfsprops(7) `usedbysnapshots`).
  5. Destroying a snapshot frees exactly the blocks only it referenced ("exclusive"); blocks it shares with
     another tree stay (zfsprops(7) `used` of a snapshot; Btrfs docs "Quota groups" `excl`).
  6. No free block → the write fails with "No space left on device" and no pointer changes, even though the
     operation would not grow the file (derived; real pools keep reserves, (check)).
  7. Tie-break: new blocks take the lowest free id; snapshots are listed oldest first.
  8. Snapshots are read-only here (writes target the live tree only).
- **Params:** `fileBlocks` range 4–8, default 8, `resets: true`; `poolSize` range 12–24, default 24, `resets:
  true`; `showRefs` toggle, default on.
- **Presets:**
  1. `basic` (derived, unchecked): write file `a` (8 blocks; used 8) → snapshot `@s1` (used 8; `@s1` excl 0) →
     overwrite blocks 2 and 3 (used 10; shared 6; `@s1` excl 2; live excl 2) → snapshot "costs" exactly the 2
     old blocks. 3 steps.
  2. `delete-doesnt-free` (derived, unchecked): file of 8 blocks → `@s1` → `rm a` (used still 8, live refer 0) →
     destroy `@s1` (used 0). 4 steps.
  3. `middle-snapshot` (derived, unchecked): 8 blocks → `@s1` → overwrite block 2 → `@s2` → overwrite block 2
     again → destroy `@s1` frees 1 block (the original block 2; the others are shared with `@s2`) → destroy `@s2`
     frees 1 block. Used 8 → 8 → 9 → 9 → 10 → 9 → 8. 7 steps.
  4. `full-pool` (derived, unchecked): `poolSize` 10; 8 blocks → `@s1` → overwrite block 0 (used 9) → overwrite
     block 1 (used 10) → overwrite block 2 fails with ENOSPC, nothing changes → `rm a` frees only the 2 blocks
     the live tree owned alone (used 8, not 0) → destroy `@s1` (used 0). Deleting files barely helps a full pool
     with snapshots. 7 steps.
- **Steps:** 3, 4, 7, 7.
- **Legend:** block shared by ≥2 trees (striped), block owned by one tree (solid), free (hollow), freed this step
  (crossed); "changed" highlight marks pointers that moved and blocks whose `refs` changed.
- **Captions:** hr: "*Snapshot* (snimka) nije zauzeo nijedan blok: kopirao je samo pokazivače. Sad blokove 0–7
  dijele dva stabla." en: "The snapshot took no blocks: it copied only the pointers. Blocks 0–7 are now shared
  by two trees."
- **Terms:** snapshot — snimka; copy-on-write — kopiranje pri pisanju (check against NLA T22–23 once written);
  block — blok; subvolume — podvolumen; pool — bazen; reference count — brojač referenci (check); shared block —
  dijeljeni blok.
- **Misconceptions:** a snapshot is a copy and costs as much space as the data; deleting files frees space while
  snapshots exist; a snapshot's size is fixed when it is taken.
- **Out of scope:** the metadata tree's own CoW up to the root (shown only as one root pointer per tree),
  checksums and scrub (`lnx-zfs-self-heal`), send/receive (`lnx-send-receive`), clones and writable snapshots,
  compression, reflink copies (XFS `reflink=1` in UL ch11/ch12 `mkfs.xfs` output is the same idea at file level;
  mention in the explanation only), redirect-on-write vs copy-on-write (`sto-cow-vs-row`, a later preset here per §5.2).
- **Note for the coordinator:** no course text exists yet (NLA T22–23 has no chapter), so every preset number is
  derived; have them checked against Btrfs/ZFS accounting when the NLA chapter is written. The existing
  `zfs-btrfs-topology-lab.html` models pools, datasets and snapshots as objects, not block sharing, so there is
  nothing to reuse but vocabulary.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-cow-filesystem sims/lnx-cow-filesystem` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-cow-filesystem/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
