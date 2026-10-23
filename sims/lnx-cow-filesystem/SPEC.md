<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-cow-filesystem: spec

One concept: **snapshots share blocks; writes go to new blocks.** Task `docs/tasks/w2/lnx-cow-filesystem.md`,
catalogue `lnx-cow-filesystem` (§4.4, overlap §5.2). Stepper on kit view K3 (block grid).

## Model

A pool of `poolSize` physical blocks (ids `0 … poolSize − 1`) and the trees that point into it:

```
blocks:   [{ id, ver, refs }]        allocated blocks only, sorted by id; ver = the label (A0, C1 …)
trees:    [{ name, readonly, files: { name: [blockId] } }]   live tree first, then snapshots oldest first
poolSize: 10–24
writes:   { file: { k: times written } }   for the labels
op, err, event, moved, allocated, freed, changed, gone       what this step did (for the page)
```

The live tree is `podaci` (a Btrfs subvolume or a ZFS dataset); its file is `a`, of `fileBlocks` logical blocks
`0 … fileBlocks − 1`. Logical block k written for the v-th time (v from 0) gets the label letter k + v: `A0 … H0`
at first, `C1` when block 2 is overwritten once, `C2` twice. A tree holds only pointers; a block's `refs` is the
number of pointers to it over all trees. The metadata tree's own copy-on-write up to its root is out of scope
(one pointer list per tree stands for it).

## Rules

1. **A snapshot copies the tree's pointers, not the data.** It allocates 0 blocks; every block the live tree points
   to gains one reference. Sources: Btrfs documentation "Subvolumes" (a snapshot is a subvolume sharing its data
   with the original by copy-on-write); OpenZFS zfs-snapshot(8) (a snapshot initially consumes no additional space)
   *(check)*.
2. **Copy-on-write:** writing logical block k never overwrites a block another tree points to. The new data goes to a
   newly allocated block and only the writing tree's pointer moves. Sources: Btrfs documentation (copy-on-write);
   OpenZFS documentation "ZFS concepts" / zfs-snapshot(8) ("as data within the active dataset changes, the snapshot
   consumes disk space by continuing to reference the old data") *(check)*.
3. **Unshared data is not overwritten in place either:** the new block is written first, the pointer moves, then
   the old block (now `refs` 0) is freed. So every written block needs one free block, even when its old block was
   not shared, and a block freed in a step is not reused in the same step. Derived from rule 2 (a CoW filesystem
   never writes over live data) *(check)*.
4. **Deleting a file in the live tree drops its pointers;** blocks a snapshot still points to stay allocated, so the
   pool's used space does not fall while snapshots hold them. Source: zfsprops(7) `usedbysnapshots` (space that would
   be freed if all snapshots were destroyed) *(check)*.
5. **Destroying a snapshot frees exactly the blocks only it pointed to** (its "exclusive" blocks); blocks it shares with
   another tree stay. Sources: zfsprops(7) `used` of a snapshot (space unique to it); Btrfs "Quota groups" `excl`
   (exclusive) vs `rfer` (referenced) *(check)*.
6. **No free block → the write fails with `No space left on device` (ENOSPC)**, and no pointer, block or count
   changes, although an overwrite would not make the file any larger. A write of k blocks needs k free blocks before
   it starts (rule 3). Derived; real pools keep a reserve (ZFS "slop space", Btrfs global reserve) so this happens
   a little before the last block *(check)*.
7. **Tie-breaks:** new blocks take the lowest free ids, given to the written logical blocks in ascending order;
   snapshots are listed oldest first, after the live tree.
8. **Snapshots are read-only:** a write or `rm` in a snapshot fails (`EROFS`) and changes nothing. Writes in the
   presets go to the live tree only. (Writable snapshots and clones are out of scope.)

Space table, per tree: **referenced** = distinct blocks it points to (Btrfs `rfer`, ZFS `referenced`);
**exclusive** = blocks only it points to (Btrfs `excl`, ZFS `used` of a snapshot). Pool: used, free, shared
(`refs` ≥ 2).

## One step

One op of the scene's script, in this order: validate (rules 6, 8) → allocate the new blocks (rule 7) → move the
pointers → recount `refs` → free blocks with `refs` 0 → the space table is recomputed from the result.

| op | what changes |
|---|---|
| `write a` (new file) | `fileBlocks` new blocks, the live tree gets file `a` |
| `write a [k…]` | rules 2, 3, 6: k new blocks, the live pointers move; old blocks lose one ref, freed at 0 |
| `snapshot @sN` | rule 1: a read-only copy of the live tree's pointers |
| `rm a` | rule 4 |
| `destroy @sN` | rule 5; the row stays on the page, struck |

## Params

`scene` (hidden; the presets set it) · `fileBlocks` 4–8, default 8, resets · `poolSize` 10–24, default 24, resets ·
`showRefs` (each pool block's reference count as `×n`), default on. Every op touches only blocks 0–3, so every
scene runs with every `fileBlocks`.

## Presets and expected numbers (`fileBlocks` 8)

Checked with a node script over the model before the page was written (NOTES.md, Checks).

| # | preset | steps | after each step: pool used (free) | other numbers |
|---|---|---|---|---|
| 1 | `basic` | **3** | 8 (16) → 8 → 10 (14) | step 2: shared 8, `@s1` excl 0, rfer 8; step 3: blocks 2, 3 → new 8, 9; shared 6; `@s1` excl 2; `podaci` excl 2 |
| 2 | `delete-doesnt-free` | **4** | 8 → 8 → 8 → 0 | step 3 `rm a`: `podaci` rfer 0, `@s1` excl 8, nothing freed; step 4 frees 0–7 |
| 3 | `middle-snapshot` | **7** | 8 → 8 → 9 → 9 → 10 → 9 → 8 | step 3: C1 in block 8; step 5: C2 in 9, each tree excl 1 (C0, C1, C2); step 6 frees block 2 (C0); step 7 frees block 8 (C1) |
| 4 | `full-pool` (`poolSize` 10) | **7** | 8 (2) → 8 → 9 (1) → 10 (0) → 10 (0) → 8 (2) → 0 (10) | step 5: block 2 fails ENOSPC, nothing changes; step 6 `rm a` frees only blocks 8, 9 (A1, B1) |

Defaults = preset 1: `sim.json` `steps` 3.

## Deviations from the task

- `poolSize` range **10–24**, not 12–24: preset 4 (`full-pool`) uses a pool of 10.
- Overwriting two blocks in one step (preset 1) needs two free blocks (rule 3 applied per block: the old blocks are
  freed only after the whole write).
