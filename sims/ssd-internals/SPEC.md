<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ssd-internals: spec

One concept: **FTL, erase blocks, write amplification, TRIM, wear.** Task `docs/tasks/w3/ssd-internals.md`,
catalogue `sto-ssd-internals` (§4.6). Class stepper. The student writes and overwrites logical blocks and watches
the flash translation layer place them, garbage collection copy pages the host never wrote, and erase counters
climb.

## Scene

One kit block grid (K3, `kit/blockgrid.js`), so the arrows can join the host's view and the NAND:

- **Top row, the host's view:** 10 logical blocks, LBA 0–9. A written LBA is solid (the host's colour); an LBA
  never written or trimmed is free. With `showMap` on, each LBA's `sub` line is its FTL mapping `block.page`
  (`2.3`), or `–` when unmapped: this row *is* the FTL map.
- **Under it, the NAND:** 4 erase blocks (`EB0`–`EB3`) × 4 pages, moved right with `offset` so they sit under the
  middle of the LBAs. A page is free (empty), valid (solid, labelled with its LBA) or invalid (the kit's `dead`:
  grey, crossed, struck label). The active block has a bracket "active" over it; the reserve block has an "R"
  badge on its label; the erase counter is each block's `aside` ("erased ×2"), with a flash mark and "+1" in the
  step that erased it.
- **Arrows** (with `showMap` on; the toggle hides them all): in a write step, from the LBA to its new page (`now`), and to the page it left, as
  a `broken` link (the stale mapping). In a GC step, one arrow per moved page from the victim's old page to its copy
  in the reserve block. In a TRIM step, `broken` links from each trimmed LBA to the page it pointed to.
- **Card on the right:** counters (host writes, NAND writes, write amplification = NAND / host, GC runs) and the
  GC log (`GC 1: EB0 → EB3, 2 pages moved`).

"Changed" (the kit's highlight) marks the pages programmed or invalidated in this step and every page of the block
erased in this step, plus the LBAs written or trimmed in it and those whose mapping GC moved.

## State

```
{ pages: (null | 'X' | lba)[4][4],  // null free, 'X' invalid, a number = valid page holding that LBA
  erase: [4],                       // erase count per block (wear)
  map: { lba: [b, p] },             // the FTL map; an unmapped LBA has no key
  active: b, ptr: p,                // the active erase block and its next free page (ptr = 4: full)
  host, nand,                       // host writes, NAND programs, counted from the start of the workload
  gc: [{ victim, to, moved }],      // the GC log
  trimmed: lba[],                   // LBAs trimmed and not written since
  i,                                // index of the next op in the script
  ev }                              // what this step did, for the page (the changed pages, arrows, caption)
```

The task's `gcLog` is `gc`; `ev` and `i` are added (the replay needs the position in the script, the page needs
what changed). JSON-safe: `map` keys are strings.

## Script and one step

A run is a **script** of host operations: the pattern's ops (from the preset) followed by the ops the student adds
with the buttons (param `extra`). Ops: `fill` (write LBA 0–9 in order, one step, the prep of presets 1–3), `w n`
(write LBA n), `t [n…]` (TRIM the set).

**One step** is one op, except that a write which finds the active block full and fewer than two free blocks
first takes a GC step (rule 4): the GC is its own step, then the write follows as the next step without a second
check. The step count is found by replaying the script (`steps(p)`).

## Rules

Sources: AG = Agrawal et al., "Design Tradeoffs for SSD Performance", USENIX ATC 2008; HU = Hu et al., "Write
Amplification Analysis in Flash-Based Solid State Drives", SYSTOR 2009; TB = Tanenbaum & Bos, *Modern Operating
Systems* 4th ed., SSD section (§5.4.1) *(check)*; TRIM = ATA/ACS DATA SET MANAGEMENT (TRIM) and NVMe Dataset
Management (Deallocate) *(check)*. The geometry (4 × 4, 10 LBAs) is the task's teaching size, not a real drive.

1. **No overwrite in place.** A page can be programmed only when erased (state `null`). A write never programs a
   page that holds data or is invalid. (AG §2; TB *(check)*.)
2. **Writes go to the active block.** A host write programs the next free page of the active block (`ptr`), points
   the LBA's map entry there and marks the LBA's previous page, if any, invalid (`'X'`). host + 1, nand + 1. A write
   of a trimmed LBA has no previous page. (AG §3, log-structured page mapping.)
3. **Erase is per block.** Erasing sets all four pages of a block free and increments that block's erase counter
   by one (wear). Nothing else erases. (AG §2.)
4. **Opening a block.** When a write finds the active block full (`ptr = 4`): if at least two blocks are free, the
   lowest-numbered free block becomes active; otherwise (one free block left, the reserve) a GC step runs first.
   One block is always kept free as the reserve: the drive has 16 pages for 10 LBAs, 6 pages of over-provisioning,
   and GC needs one whole empty block to copy into. (Task model; AG §3.3 cleaning *(check)*.)
5. **GC victim and copy.** The victim is the full block with the most invalid pages; tie → the lower erase count;
   tie → the lower block number (greedy cleaning, HU §3). Its valid pages are copied, in page order, into the
   reserve block (nand + 1 each, host unchanged; their map entries move), the victim is erased (rule 3) and the
   reserve, now holding the copies, becomes the active block; the erased victim becomes the new reserve. The active
   block takes part: it is full, so it can be the victim.
6. **TRIM.** TRIM of a set of LBAs marks each mapped one's page invalid and removes its map entry, with no NAND
   write and no host write. GC no longer copies those pages. TRIM of an unmapped LBA does nothing. (TRIM.)
7. **Write amplification** = NAND programs / host writes, both counted from the start of the workload: in presets
   1–3 from after the fill (the fill itself is 10 host = 10 NAND writes, WA 1.0), in `first-fill` from the empty
   drive. With no host write yet, WA is shown as "–". Every NAND program counts: host writes and GC copies. (HU §2.)

Derived: with 10 LBAs on 12 non-reserve pages, the victim always has at least one invalid page (12 pages, at most
10 valid), so GC never runs out of room and the copies always fit in the reserve.

## Presets

All but `first-fill` start with the `fill` step: LBA 0–9 written once, blocks 0–1 full, block 2 half full and
active, block 3 free (the reserve). The counters then start at 0. Numbers from `scratchpad ref.py` (an independent
Python implementation of rules 1–7, kept in NOTES.md) and the model; derived, unchecked against real firmware.

| Preset | Script after the fill | Host | NAND | WA | GC runs (victim: moved) | Erase counts | Steps |
|---|---|---|---|---|---|---|---|
| 1 `hot-data` | w 0 1 2 3 0 1 2 3 | 8 | **14** | **1.75** | 3 (EB0: 2, EB3: 2, EB2: 2) | [1, 0, 1, 1] | 1 + 8 + 3 = **12** |
| 2 `spread` | w 0 4 8 1 5 9 2 6 | 8 | **26** | **3.25** | 6, each moving 3 (EB0, EB1, EB2, EB3, EB0, EB1) | [2, 2, 1, 1] | 1 + 8 + 6 = **15** |
| 3 `trim` | t 6 7 8 9, then w 0 4 8 1 5 9 2 6 | 8 | **13** | **1.63** (1.625) | 3 (EB1: 1, EB0: 2, EB2: 2) | [1, 1, 1, 0] | 1 + 1 + 8 + 3 = **13** |
| 4 `first-fill` | (empty drive) w 0 … 9 | 10 | **10** | **1.0** | 0 | [0, 0, 0, 0] | **10** |

`hot-data` GC 1 (step 4): EB0 holds X X 2 3 (the most invalid pages), so it is the victim; 2 and 3 are copied
into EB3, EB0 is erased (the Croatian caption of the task). `trim` vs `spread`: the same eight writes cost 13 NAND
writes instead of 26, because GC no longer copies the trimmed LBAs 6–9 (the English caption of the task).

Default params = preset `hot-data`, so `sim.json` `steps` = 12.

## Params

- `pattern` (choice, resets): `hot`, `spread`, `trim`, `fill` — the script of presets 1–4.
- `lba` (select 0–9): the LBA the buttons act on.
- Buttons (the task's `op` group): **Write LBA n** (key W) and **TRIM LBA n** (key T) append `w n` / `t [n]` to
  `extra` and show the op's first step (the GC step when the write needs one); **Undo my ops** (key U) drops `extra`.
  The kit's own reset (R) restores the defaults. An op that would take the run past 20 steps is not added; the page
  goes to the last step and its caption says why (the kit's action buttons have no disabled state; NOTES.md). Added
  ops that do not fit are skipped, later ones that fit still run (only a hand-made `extra` can do that).
- `showMap` (toggle, on): the `sub` mapping line and the arrows.
- `extra` (no control): the added ops, as a string `w3 t5 w0`.

## Legend

free page (empty) · valid page (solid, LBA label) · invalid page (crossed, struck) · active block (bracket) ·
reserve block ("R") · GC copy / FTL pointer (arrow) · stale mapping (broken arrow) · erased (flash, +1) · changed.

## Out of scope

Static wear levelling, SLC caching, multi-plane and channel parallelism, power-loss protection, endurance ratings,
the HDD/SSD access-time comparison (the `disk-scheduling` sim).
