<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-lvm-snapshot: spec

One concept: **a classic (thick) LVM snapshot keeps the origin's old chunks in its own fixed copy-on-write area, and is
lost (invalid) when that area is full.** Task: `docs/tasks/w3/lnx-lvm-snapshot.md`; catalogue `lnx-lvm-snapshot` §4.4,
overlap §5.2.

## Scene

- Volume group `podaci` (the VG name of `lnx-lvm-extend`, UL ch12). Origin LV `lv_data`: 16 chunks A…P, each with a
  version number, all at version 1 when the snapshot `snap` is taken (step 0: `lvcreate -s -n snap … podaci/lv_data`).
- The snapshot's copy-on-write (CoW) area holds `cap` slots, one chunk each. VG free space `vgFree` is counted in the
  same slots (real LVM counts extents, and an extent holds many chunks: the page says so).
- Each step is one I/O from the preset's script: a write to the origin, a write to the snapshot, or (preset
  `backup-window`) a read of the snapshot by a backup.

State: `{ origin: [{ id, ver }], cow: [{ chunk, ver, src: 'origin'|'snap' }], cap, valid, vgFree, i, ev }`, where `ev`
records what the step did (slot taken, autoextend, invalidation, where a read came from) for the page.

## Rules

1. **First write to an origin chunk copies the old chunk into the CoW area (one slot), then overwrites the origin.**
   The origin's version goes up by one; the slot holds the old version, `src: 'origin'`. (lvcreate(8) `--snapshot`;
   lvm(8) "COW" *(check)*.)
2. **A chunk already in the CoW area takes no new slot.** Tie-break: the test is per chunk, not per write: the second,
   third … write to C, from either side, never takes a slot. The saved version stays the one from the snapshot's
   moment (a later origin write to C does not touch the slot).
3. **Reading the snapshot:** the CoW slot of that chunk if one exists, else the current origin chunk. So the snapshot
   reads as the origin was when taken (plus the snapshot's own writes, rule 4).
4. **Writing to the snapshot** (it is writable: a mounted test copy) stores the new data in a slot, `src: 'snap'`, for
   a chunk not yet in the CoW area; for a chunk already there it overwrites that slot (no new slot, rule 2). The
   snapshot's version of the chunk goes up by one; the origin is untouched. (lvcreate(8): snapshots are writable,
   `-p rw` by default *(check)*.)
5. **Data% = used slots / cap × 100**, two decimals (`lvs` prints `25.00`). Chunk metadata (the exception store's
   headers) is ignored; the page says so. (lvs(8) `Data%` *(check)*.)
6. **A write that needs slot `cap + 1` invalidates the snapshot:** `lvs` attr `swi-I-s---` (`swi-Ios---` when
   mounted, as in `snapshot-write` and `backup-window`; valid: `swi-a-s---`, `swi-aos---`), Data% `100.00`; all its
   content is lost (every slot, and every read of it fails with an I/O error). The origin's write goes through, and the
   origin and its later writes go on unaffected; a write to an invalid snapshot fails. Once invalid it stays invalid
   (autoextend no longer helps). (lvs(8) attr field, 5th char `I`, "invalid snapshot"; lvmthin(7) contrast: a thin
   pool that fills stops writes instead *(check)*.)
7. **Autoextend (optional).** After each write, when autoextend is on and Data% is above `threshold` (at exactly
   the threshold nothing grows), the CoW area grows by
   `ceil(cap × percent / 100)` slots (at least 1) if the VG has that many free; with fewer free, nothing grows
   (all or nothing, as `lvextend` in `lnx-lvm-extend` rule 3). One check per write (one monitoring poll). The check
   runs before the next write, so a write never needs slot `cap + 1` while the VG could still give it: the task's
   phase (b) "try autoextend, then invalidate" gives the same result. (lvm.conf(5) `snapshot_autoextend_threshold`,
   `snapshot_autoextend_percent`, minimum threshold 50, default 100 = off; needs dmeventd monitoring. lvm.conf says
   "exceeds", and lvresize's policy code (per the review, from memory) does nothing at percent ≤ threshold; the task
   says ≥. They differ only at exactly `threshold` (cap 4 at 50 or 75, …), which no preset hits; the model follows
   LVM *(check)*. Newer lvm2 is said to grow by at least enough to get back under the threshold, not by percent alone;
   no preset depends on it *(check)*. Whether a growth the VG cannot fully give fails or grows partly is unchecked;
   the model fails it *(check)*.)

One step, in order: (a) is the chunk already in the CoW area? (b) if not, is a slot free? if not, invalidate;
(c) copy the old chunk into the slot (origin write) or store the new data there (snapshot write); (d) apply the write;
(e) recompute Data% and run the autoextend check. A read does (a) and returns the slot or the origin cell, and changes
nothing.

## Params

| Key | Range | Default | Notes |
|---|---|---|---|
| `cap` | 2–8 slots | 4 | the snapshot's CoW size at `lvcreate -s -L` |
| `autoextend` | toggle | off | rule 7 |
| `threshold` | 50–95, step 5 | 70 | shown when autoextend is on |
| `percent` | 10–100, step 10 | 50 | shown when autoextend is on |
| `vgFree` | 0–8 slots | 4 | VG free space; preset `autoextend` sets 6 |

All `resets: true`. 16 origin chunks, fixed.

## Presets (expected numbers, checked by `sim.test.js`)

Derived from the rules, unchecked against a real system (real LVM rounds to extents and polls; it does not check per
write).

- **`fill-up`** (6 steps): cap 4, origin writes to C, F, H, K, M, A. Data% after each: 25.00, 50.00, 75.00, 100.00,
  then write 5 (M) needs slot 5 → invalid (`swi-I-s---`, 100.00); write 6 (A) goes to the origin only. The origin ends
  with C, F, H, K, M, A at version 2.
- **`same-chunks`** (10 steps): cap 4, origin writes A, B, A, B, … (5 each). Data% 25.00, 50.00, then 50.00 for good;
  the snapshot stays valid and still reads A1, B1 while the origin ends at A6, B6.
- **`autoextend`** (6 steps): cap 4, autoextend on, threshold 70, percent 50, VG free 6, origin writes to C, F, H, K,
  M, A. Write 1 25.00, write 2 50.00, write 3 75.00 → grows by 2 → cap 6 (VG free 4), Data% 50.00; write 4 66.67;
  write 5 83.33 → grows by 3 → cap 9 (VG free 1), 55.56; write 6 66.67. All fit. With autoextend off the same script
  invalidates at write 5 (as `fill-up`).
- **`snapshot-write`** (5 steps): cap 4: origin C, snapshot H, origin F, snapshot K, origin M. Data% 25.00, 50.00,
  75.00, 100.00 (two slots `src: 'origin'`, two `src: 'snap'`), write 5 invalidates. The snapshot's own writes take
  space like the origin's.
- **`backup-window`** (8 steps): cap 3 (about 20 % of the origin's 16 chunks), a backup reads the snapshot while the
  application writes: origin C, read A, origin D, read C, origin E, origin F, read D, read E. Read A comes from the
  origin (A unchanged), read C from its CoW slot (C1, while the origin holds C2); write E fills the area (100.00);
  write F invalidates it; reads D and E fail (I/O error), although the origin has every write.

## Language

Terms (task list): snapshot — snimka (NLA toc T20); copy-on-write — kopiranje pri pisanju; origin volume — izvorni
volumen; logical volume — logički volumen; chunk — komad *(check)*; invalid snapshot — nevaljana snimka *(check)*;
extent — *extent* (UL ch12 writes the English word; see `lnx-lvm-extend` NOTES).

Misconceptions the page answers: the snapshot must be as big as the origin (it holds only what changes); an LVM
snapshot is a backup (it lives in the same VG and dies when full); a full snapshot slows down or stops the origin (the
origin goes on, the snapshot is lost).

Out of scope: thin snapshots (`lnx-thin-overcommit`), `lvconvert --merge`, chunk-size tuning, the CoW write penalty in
numbers, `lvmcache`.
