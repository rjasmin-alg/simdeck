<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-page-cache — spec

**Concept:** the page cache is not lost memory; dirty pages and writeback.
Task: `docs/tasks/w3/lnx-page-cache.md`; catalogue `docs/catalogue.md` §4.4; courses UL (ch. 12 "Zauzeće, kvote i
odlagalište memorije") and NLA (T42).

Explorer: the state is a pure function of the params (`initial(params)` in `sim.js`). The machine starts as the book's
`free -h` line, the same numbers as `lnx-memory-swap-oom`. What the params describe happens in a fixed order:

1. read the file `a.dat` (`readMiB`), and read it again (`reread`);
2. write the file `b.dat` (`writeMiB`) with one buffered `write()` at **second 0**;
3. `seconds` pass;
4. `sync`, then `drop_caches`, then the power loss, each if its toggle is on.

All sizes are MiB (integers at every page setting), all times seconds.

## Params

| Param | Meaning | Values | Default |
|---|---|---|---|
| `readMiB` | size of `a.dat`, read once | 0–800, step 50 | 0 |
| `reread` | read `a.dat` a second time | off / on | off |
| `writeMiB` | size of `b.dat`, written at second 0 | 0–500, step 25 | 0 |
| `seconds` | seconds since the write | 0–60, step 5 | 0 |
| `sync` | run `sync` at that second | off / on | off |
| `dropCaches` | then `echo 1 > /proc/sys/vm/drop_caches` | off / on | off |
| `powerLoss` | then the power goes | off / on | off |
| `ratios` | `dirty_background_ratio` / `dirty_ratio` | `10/20`, `5/10` | `10/20` |

## Chosen constants

- **Disk speed 25 MiB/s** for writes (*chosen*: a slow disk, so that background writeback, throttling and expiry fall
  on different 5 s marks of the slider; the task names no speed). Reads are not timed: they happen before second 0.
- **159 MiB of the cache cannot be dropped** (*chosen*, as in `lnx-memory-swap-oom`, to reproduce the book's line).
- File names `a.dat` (read) and `b.dat` (written) are data, not language.

## Rules

1. **Start: the book's `free -h`.** total 1741, processes 258, buff/cache 885 = 159 that cannot be dropped + 726 clean
   cache of earlier files, free 598. **available = free + page cache that can be given back** (clean, dirty and
   under writeback; not the 159) = 1324; **used = total − available** = 417. Source: UL ch12 `free -h` listing
   (`1.7Gi 417Mi 598Mi 728Ki 885Mi 1.3Gi`); free(1) procps-ng 4.0.4, **checked** on this machine (used = total −
   available). Counting dirty pages as available follows the kernel's estimate, which adds the file LRU lists
   (dirty file pages are on them) *(check: `Documentation/filesystems/proc.rst`, not on this machine)*;
   proc_meminfo(5) `MemAvailable` "An estimate …", **checked**.
2. **Reading a file that is not cached** reads it from the disk into the page cache: it takes free memory first, then
   evicts the oldest clean cache (the 726 MiB of earlier files). buff/cache grows by the file, free falls, **available
   does not move**. **Reading it again is a cache hit**: no disk read. disk read = `readMiB`, whatever `reread` is.
   Kernel `Documentation/admin-guide/mm` *(check: not on this machine)*; proc_meminfo(5) `Cached` "In-memory cache
   for files read from the disk (the page cache)", **checked**. Edge: `readMiB` + `writeMiB` ≤ 1300 < 1324, so the
   written file never evicts `a.dat`, only earlier files (tested over the grid).
3. **A buffered write** puts dirty pages in the cache (taken like a read: free first, then the oldest clean cache) and
   `write()` returns before the disk is touched, unless rule 5 throttles it. write(2) NOTES: a successful return
   does not guarantee the data is on disk *(check: section 2 man pages are not installed here)*; proc_meminfo(5)
   `Dirty` "Memory which is waiting to get written back to the disk", **checked**.
4. **Writeback by age.** Flusher threads wake every `dirty_writeback_centisecs` = 500 (5 s: seconds 0, 5, 10, …) and
   write the pages that have been dirty for at least `dirty_expire_centisecs` = 3000 (30 s). The age is the file's:
   the kernel keeps one dirtied time per inode, the time of its first dirty page (second 0 here). **Tie-break:** a page
   that turns 30 s old exactly on a tick is written on that tick (≥), so `b.dat` goes at second **30**, not 35;
   `expiryTick(1)` = 35. Handed to the disk, the pages count as **Writeback** ("Memory which is actively being written
   back to the disk", proc_meminfo(5), **checked**) until the disk has them (25 MiB/s), then they are clean. Defaults
   500 and 3000 **checked** with `sysctl` on this machine; their meaning from `Documentation/admin-guide/sysctl/vm.rst`
   *(check: not on this machine)*.
5. **Two marks**, as a share of dirtyable memory (≈ available, 1324 here), rounded to MiB:
   `dirty_background_ratio` 10 % = **132**, `dirty_ratio` 20 % = **265** (5/10: 66 and 132; defaults 10 and 20
   **checked** with `sysctl`).
   - **Background writeback:** while **Dirty** is above the background mark, the flusher hands the dirty pages above
     the mark to the disk at once (they move from Dirty to Writeback). **Tie-break:** exactly at the mark is not above
     it: `writeMiB` 132 with 10/20 starts nothing until the expiry tick.
   - **Throttling:** **Dirty + Writeback** never exceeds the limit; a writer that reaches it is put to sleep and can
     dirty only as fast as the disk drains. Its `write()` returns at tw = (W − limit) / 25 s. **Tie-break:** exactly
     at the limit is not throttled (tw = 0).
   - So while throttled, Dirty = 132 and Writeback = 133 (sum 265); once the writer is done the disk drains the
     Writeback, Dirty stays at the mark, and the rest waits for the expiry tick (rule 4).
   Which counter each mark compares (Dirty for the background mark, Dirty + Writeback for the limit) follows
   `mm/page-writeback.c` as I remember it *(check: the source is not on this machine)*. Holding Dirty exactly at the
   mark is the model's simplification of a flusher that writes in chunks. The limit is a hard wall here, as the task
   asks; since Linux 3.2 the kernel slows a writer gradually from the midpoint of the two marks (≈ 198 MiB) and holds
   it near the limit *(check)*.
6. **`sync`** at second t writes everything not yet on disk (dirty, under writeback, and the rest a throttled writer
   still had to write) and returns when the disk has it: it takes (W − written) / 25 s. Afterwards Dirty 0, Writeback
   0, all of `b.dat` is clean cache. *Simplification:* a real `sync` started while the writer is still throttled
   writes only what the writer has handed to the kernel and may return before the writer is done; the model lets it
   wait for the writer too (as `write … && sync` would). The disk is busy at 25 MiB/s throughout, so the time
   everything is on disk is the same either way. sync(1) "Synchronize cached writes to persistent storage", **checked**; fsync(2)
   *(check: not installed)*.
7. **`drop_caches`** (`echo 1`) frees **clean** page cache only: the earlier files, `a.dat` and the clean part of
   `b.dat`. Dirty and Writeback pages stay, and so do the 159. **free rises by what was dropped, available does not
   move** (it already counted that cache). `vm.rst` `drop_caches`: "will not free any dirty objects" *(check)*.
8. **Power loss:** whatever of `b.dat` is not on disk is lost: dirty pages, pages under writeback and, if the writer
   was still throttled, the part it never wrote. Clean cache loses nothing (the disk has it). Derived from rules 3–5.
   The readouts show the values at the moment the power went: second `seconds`, or after `sync` returned
   (`powerAt` = seconds + sync time), because the power loss comes after sync in the fixed order.

## Edge cases

- `writeMiB` 0: `seconds` changes nothing; the caption then explains reads or the book's line.
- The writer is never still running at the expiry tick: tw ≤ (500 − 132) / 25 = 14.72 s < 30 (tested over the grid).
- `sync` with nothing written runs and does nothing (caption falls through).
- After `sync`, `drop_caches` frees `b.dat` too (it is clean).
- Power loss after `sync`: 0 lost; after the expiry tick's writeback is done (≥ 35 s for 100 MiB): 0 lost.

## Presets (numbers checked with an independent 1 ms time-stepping simulation before the page; now in `sim.test.js`)

| id | params | expected | source |
|---|---|---|---|
| `book-free` | nothing done | `Mem: 1741 417 598 0 885 1324` | UL ch12; the 159 split chosen |
| `read-twice` | read 400, reread | disk read 400 (not 800); free 198, buff/cache 1285, available 1324 | derived |
| `small-write` | write 100, 0 s | Dirty 100 (< 132, nobody writes yet); at 25 s still 100; at **30 s** Dirty 0, Writeback 100; at 35 s on disk 100 | derived |
| `big-write` | write 500, 0 s | Dirty 132 + Writeback 133 = **265**, writer throttled; 5 s: on disk 125, still throttled; 10 s: returned (9.4 s), on disk 250; 15 s: Dirty 132, Writeback 0, on disk 368; 30 s: Writeback 132; 35 s: Writeback 7, on disk 493; 40 s: all 500 | derived |
| `drop-caches` | drop on | buff/cache 885 → 159, free 598 → 1324, available 1324 | derived |
| `power-loss` | write 100, 10 s, power loss | **100 lost**; with `sync` on: 0 lost (sync took 4 s) | derived |

The task writes `big-write` as "Dirty shown ≈ 265"; here 265 is Dirty + Writeback (the sum the limit is checked on),
split 132 + 133 (NOTES.md, deviations).

## Scene

- **RAM bar** 1741 MiB wide, left to right: processes (solid grey), cache that cannot be dropped (dots), clean cache of
  earlier files, `a.dat` and `b.dat` (hatched, each named), `b.dat` under writeback (cross-hatch, arrow to the disk),
  `b.dat` dirty (cross-hatch, clock badge with its age), free (empty). Every segment carries its name and MiB.
- **Dirty gauge** under it: Dirty + Writeback on a 0–400 MiB scale with the two marks as dashed lines labelled
  "10 % · 132" and "20 % · 265", and "throttled" when the writer sleeps.
- **Disk** beside the readouts: the "disk I/O" counters (read, written) and the files (`a.dat` on disk; `b.dat`: X of
  W on disk, the lost part with a × badge), "writing at 25 MiB/s" while Writeback > 0.
- **Readouts** side by side: `free -m` (`total used free shared buff/cache available`) and `/proc/meminfo`
  (`MemTotal MemFree MemAvailable Cached Dirty Writeback`, in kB as the file prints them; Cached = buff/cache, the
  model has no Buffers or slab).
- **What happened:** one line per event (read, reread, write, background writeback, throttling, expiry, sync, drop,
  power loss).
- **"Changed":** the `free -m` cells, `/proc/meminfo` lines, bar segments and disk counters that moved with the last
  param change.

## Captions (first that applies)

`cLost`, `cLostMid` (the writer was still throttled), `cSafe`, `cSafeNone` (nothing was written), `cDrop` (the task's
caption, numbers filled in, plus the dirty and writeback pages kept if any), `cSync` (only when sync had something to
write),
`cThrottled`, `cBackground`, `cExpired`, `cDirty`, `cWritten`, `cReread`, `cRead`, `cBook` (`captionKey` in `sim.js`).

## Out of scope

Memory pressure, swap and OOM (`lnx-memory-swap-oom`), `O_DIRECT`, per-device writeback limits, readahead, NUMA,
cgroup writeback, journalling and metadata, `drop_caches` 2 and 3.
