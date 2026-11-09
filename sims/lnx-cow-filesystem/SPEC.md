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

## Copy-on-write mode: preset `win-vss` (Volume Shadow Copy, "Previous Versions")

Task `docs/tasks/w3/win-vss.md`, catalogue `win-vss` (§4.5.7, overlap §5.2). Scenes `previous-versions`,
`diff-growth`, `diff-full` run in mode **`copy-on-write`** (`logic.mode(p)`); the four scenes above run in
`redirect-on-write` and are unchanged (test "copy-on-write mode is the win-vss scenes' only").

**Model, added.** The same `{ blocks, trees, poolSize, writes }`, plus `diffSize` (= `diffLimit`, 2–8): the **diff
area**, block ids `poolSize … poolSize + diffSize − 1`, shown as Δ0, Δ1, …; the volume keeps ids `0 … poolSize − 1`.
A **shadow copy** is a read-only tree (the host's snapshot) with a `time` ("HH:MM"). The live tree's pointers never
move: file `a` stays in volume blocks 0 … fileBlocks − 1. A shadow's pointer goes either to the live block (shared,
unchanged since the shadow) or to a diff-area copy. Ops: `write` (in place, `writeInPlace`), `snapshot` with `time`,
`restore` with `before` (the time of the change to undo). Step state adds `copied` ([{ k, from, to }]),
`overwritten` (volume ids written in place), `dropped` (shadows deleted this step), `from` (the restore's source);
`gone` also lists dropped shadows. Events add `restore` and `restore-none`.

**Rules** (Microsoft documentation, read from memory, not re-read: every one *(check)*, NOTES.md):

- **V1 Point in time.** A shadow keeps the volume's contents of the moment it was taken, whatever is written later
  (Microsoft *Volume Shadow Copy Service*). Taking one copies no block.
- **V2 Copy-on-write.** On the first change of a block that a shadow still shares, the old block is first copied to
  the lowest free diff-area block, every shadow pointer to it moves to the copy, then the new data overwrites the
  original **in place**. A block no shadow shares (already preserved, or no shadow) is overwritten with no copy. A
  block several shadows share is copied once and all of them point to the copy (Microsoft *How Volume Shadow Copy
  Service works*, copy-on-write; Windows keeps the copy with the newest shadow and older ones read through it: the
  same space).
- **V3 Diff area.** It grows by the blocks changed since the shadows, not with the volume's size; it has a limit
  (`diffLimit`), and when a write needs more copies than there are free diff blocks, the **oldest shadow is deleted**
  (its copies that no other shadow points to are freed) and the need is counted again, until the copies fit
  (Microsoft *Shadow copy storage*, the maximum size; "when the limit is reached, older shadow copies are deleted")
  *(check the exact behaviour)*.
- **V4 Restore (Previous Versions).** Restoring file `a` from a shadow writes the shadow's contents back into the live
  blocks that differ, in place, like any other write (V2: a newer shadow that shares a live block gets a copy of the
  current contents first). The live pointers stay. Reading previous versions needs no admin rights (Microsoft
  *Previous Versions*) *(check)*; not modelled.
- **V5 Same volume.** By default the diff area is on the same volume, so shadows are not a backup: they are lost with
  the volume and can be deleted by anyone who controls the host (link `ransomware-321`). Text only (captions,
  explanation); the model has no volume loss.
- **V6 A restore never deletes its own source.** When the diff area is full during a restore, the oldest shadow
  *other than the source* is deleted. A restore cannot run out: the blocks it writes differ from the source, so every
  shadow sharing them can be deleted. Derived.
- **V7 Tie-breaks.** Copies take the lowest free diff ids, given to the written blocks in ascending logical order;
  shadows are deleted oldest first; a restore takes the **newest surviving shadow taken strictly before** `before`,
  and of two with the same time the one taken later (the larger id) (task file). None → `restore-none`, nothing
  changes. Only the blocks whose contents differ are restored (a simplification: a real restore copies the whole
  file).

**Params added:** `diffLimit` 2–8, default 8, resets (shown in copy-on-write scenes only; `poolSize` is hidden
there and the presets set 10). `mode` is the scene's, not a param (below).

**Presets and expected numbers** (`fileBlocks` 8, `poolSize` 10; printed by a node script over the model, NOTES.md,
asserted in `sim.test.js`). Every op touches only blocks 0–3, so every scene runs with every `fileBlocks`.

| # | preset | steps | diff area used after each step | other numbers |
|---|---|---|---|---|
| 5 | `previous-versions` (`diffLimit` 8) | **6** | 0 → 0 → 2 → 2 → 2 → 4 | 1 write a 09:00; 2 S1 10:00; 3 write 2, 3 at 10:30: C0, D0 → Δ0, Δ1, live C1, D1 in place; 4 write 2 at 10:45: C2 in place, no copy; 5 S2 11:00; 6 restore from before 10:30 → S1: C2, D1 copied to Δ2, Δ3 for S2, live 2, 3 back to C0, D0. Volume used 8 throughout |
| 6 | `diff-growth` (`diffLimit` 8) | **7** | 0 → 0 → 1 → 2 → 2 → 4 → 4 | writes 0; 1; 0 again (no copy); 2, 3; 0–3 (all preserved, no copy). Same numbers with `poolSize` 24; volume used 8 throughout |
| 7 | `diff-full` (`diffLimit` 4) | **9** | 0 → 0 → 2 → 2 → 4 → 4 → 4 → 4 → 4 | S1 09:00, write 0, 1; S2 10:00, write 2, 3 (C0, D0 shared by S1, S2); S3 11:00; 7 write 0, 1 at 11:30: full → S1 deleted, frees Δ0, Δ1 (A0, B0), A1, B1 copied there for S2, S3; 8 restore from before 09:30: none left (`restore-none`); 9 restore from before 11:30 → S3: blocks 0, 1 back to A1, B1, no copy |

## Deviations from the task (win-vss)

- **`mode` is the scene's, not a param.** Each scene is written for one policy (the host's `rm` and `destroy` have no
  meaning on a VSS volume), so `logic.mode(p)` follows the scene. `sto-cow-vs-row` may add a visible switch.
- **`action` param (write / take-shadow / restore):** the presets are fixed scripts, one op per step (the host's
  decision "scripts, not free-form ops"); the ops are those three.
- **Steps:** 6 / 7 / 9 instead of about 8 / 8 / 10.

## Comparison: copy-on-write vs redirect-on-write (preset `sto-cow-vs-row`)

Task `docs/tasks/w3/cow-vs-row.md`, catalogue `sto-cow-vs-row` (§4.6, overlap §5.2). One concept: **where the old and
the new block end up after a snapshot, and the write penalty.** Scenes `four-writes`, `rewrite-same`,
`delete-snapshot` (presets 8–10) run in mode **`compare`** (`logic.mode(p)`); every other scene is unchanged (test
"rule C7").

**Model, added.** The state holds two sides, `cow` and `row`, each the host's fs data plus what the step did:
`{ fs, io: { list, reads, writes, meta }, total: { reads, writes, meta }, allocated, freed, moved, copied, read }`.
Both start from the same volume: file `a` of 8 blocks (A0…H0) in slots 0–7 and snapshot `@s1` of it, taken at step 0
(`cmpStart`). Copy-on-write is `writeInPlace` (the win-vss mode) over a volume of 8 with a 4-slot snapshot area
(diff ids 8–11 = slots 8–11); redirect-on-write is the host's `write` over 12 slots. `maps(fs)` gives the live and the
snapshot map (logical block → slot; `snap` null once deleted). The geometry is fixed (`CMP`: 8 blocks, 12 slots); the
host's `fileBlocks`, `poolSize` and `diffLimit` do not apply (tested).

**Rules** (sources: lvcreate(8) and lvmthin(7), OpenZFS "Copy-on-write", Btrfs "Subvolumes"/"Snapshots", SNIA
Dictionary "copy on write" and "redirect on write": all from memory, not re-read in this session; every rule *(check)*):

- **C1 CoW, first write to b after the snapshot:** read the old block, write it to the lowest free slot of the
  snapshot area, then write the new data in place: **1 read + 2 writes**. The live map does not change; the snapshot
  map points to the copy (classic LVM snapshot, NLA T20).
- **C2 CoW, a later write to the same b:** in place only, **1 write** (the old version is already preserved).
- **C3 RoW:** the new data goes to a free slot, the live map is re-pointed, the old block stays and now belongs to the
  snapshot only: **1 write + 1 metadata update, no read**. A previous live version the snapshot does not hold is freed
  after the write (host rule 3) (CoW filesystems and thin pools, NLA T20/T22/T23; SNIA "redirect-on-write").
- **C4 Fragmentation:** a sequential read of the live map in logical order; a **jump** is a next slot that is not the
  previous + 1 (backwards counts too). `seqRead` returns the slots, the contiguous runs and the jumps. The read is not a
  write: the I/O totals do not change.
- **C5 Deleting the snapshot:** CoW drops its whole area at once; RoW frees only the slots no map points to any more
  (reference counting: the host's `destroy`).
- **C6 Tie-breaks:** RoW takes the lowest-numbered free slot (a slot freed in an earlier step first, never one freed in
  the same write); CoW copies take the lowest free slot of the area. A write's I/Os are listed in order: the read, the
  copy, then the in-place write (CoW); the new block, then the map update (RoW). Derived.
- **C7 Lockstep:** both sides run every op of the same script; the `policy` param (both / cow / row) chooses only the
  columns the page shows, never the state (ossimulator §11: each variant runs to its own end).
- **Naming trap** (text only): the "copy-on-write" filesystems of NLA T22/T23 redirect on write by this taxonomy; the
  start caption and the explanation say so once each (SNIA Dictionary) *(check)*.

I/O accounting: per write, `ioOf('cow', r)` counts the copy's read and write and the in-place write; `ioOf('row', r)`
counts the new block's write and one metadata update per moved pointer. The metadata a real CoW snapshot also writes
(its exception table) and the pointer tree a real RoW system rewrites up to its root are **not** counted (the task's
numbers; the explanation says so).

**Presets and expected numbers** (printed by a node script over the model before the page; asserted in
`sim.test.js`):

| # | preset | steps | numbers |
|---|---|---|---|
| 8 | `four-writes` | **5** | write 1, 2, 5, 6, then read back. CoW **4 reads + 8 writes = 12 I/Os**, copies in 8, 9, 10, 11, live stays 0–7; RoW **4 writes + 4 metadata updates**, live 1, 2, 5, 6 in 8, 9, 10, 11. Step 5: CoW reads 0–7, 0 jumps; RoW reads 0, 8, 9, 3, 4, 10, 11, 7: **4 jumps** (0→8, 9→3, 4→10, 11→7) |
| 9 | `rewrite-same` | **3** | write 1 three times. CoW 3 + 1 + 1 = **5 I/Os** (1 read, 4 writes); RoW 3 writes + 3 metadata updates; slots 8, 9, 8; steps 2 and 3 free 8, then 9 (the previous live version, not in the snapshot) |
| 10 | `delete-snapshot` | **6** | `four-writes`, then delete the snapshot: CoW frees 8–11; RoW frees 1, 2, 5, 6, live stays in 0, 8, 9, 3, 4, 10, 11, 7 |

## Deviations from the task (sto-cow-vs-row)

- **The host model was extended additively** (as win-vss did), not requested and stopped: `ioOf`, `seqRead`, `maps`,
  `cmpStart` and the `compare` mode; the host's functions are reused unchanged.
- **State shape:** two sides `{ cow, row }` of the host's fs data instead of `{ mode, maps, slots, io, snapArea }`;
  `maps()` gives the maps, the CoW snapshot area is diff ids 8–11.
- **Param `policy`**, not `mode` (`logic.mode(p)` is already the scene's write policy and `data-mode` the page's).
- **Legend:** an in-place write and a redirected write are the same solid arrow (from the live block to the slot
  written; an arrow into the same slot cannot be drawn in K3); the metadata update is the kit's underline on the moved
  live pointer, not an icon. Added: "free in the snapshot area" (ghost), "read in one run" (span), "jump while
  reading" (dotted arc).
