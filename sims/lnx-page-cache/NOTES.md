<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-page-cache: notes

New explorer (task `docs/tasks/w3/lnx-page-cache.md`, catalogue `lnx-page-cache`, §4.4; courses UL ch12, NLA T42).
Rules and expected numbers: `SPEC.md`. No kit view: the RAM bar, the dirty gauge, the readouts, the disk and the
trace are the page's own HTML (text at 1:1, no SVG).

## Decisions

- **Same starting machine as `lnx-memory-swap-oom`:** 1741 / 598 free / 885 buff/cache of which 159 cannot be
  dropped / 258 processes, available 1324, used 417. The "available" rule is the same (free + cache that can be given
  back); here dirty and writeback pages count too (they are page cache on the file lists).
- **Continuous time with a 25 MiB/s disk** (chosen). The task gives the seconds slider but no disk speed; without
  one, background writeback and throttling have no duration. 25 MiB/s puts the phases of the 500 MiB write on
  different 5 s marks: throttled at 0 and 5 s, `write()` returns at 9.4 s, writeback drains by 15 s, 132 MiB wait,
  the expiry tick at 30 s, all on disk at 40 s. Every number stays a whole MiB at every slider setting (tested).
- **Writeback is shown as its own state** (Dirty → Writeback → clean), so the `Writeback` line of `/proc/meminfo`
  moves: at the expiry tick the pages become Writeback, and only the next 5 s mark shows them on disk.
- **Background mark on Dirty, limit on Dirty + Writeback** (SPEC.md rule 5): the flusher hands the dirty pages above
  the background mark to the disk at once, so while throttled the split is Dirty 132 + Writeback 133 = 265.
- **The age is the file's** (the kernel keeps one dirtied time per inode): the clock badge shows the seconds since the
  write, and the whole of `b.dat` expires on the 30 s tick.
- **`sync` at second t** writes whatever is not on disk, including the rest of a still-throttled writer, and the page
  reports how long it took (`(W − written) / 25`).
- **Power loss** shows the state at that moment (banner instead of the "available =" line); lost data gets a ✕ badge
  on the dirty/writeback segments and on `b.dat` in the disk box. If the writer was still running, the caption says
  so (`cLostMid`) and the lost amount includes what it never wrote.
- **`/proc/meminfo` in kB** as the file prints it (MiB × 1024); `Cached` = buff/cache (the model has no Buffers or
  slab). `MemTotal` is left out (free -m shows the total) so the readouts and the trace fit at 1920×1080.
- **Files `a.dat` and `b.dat`:** generic data, no tool names. Commands shown are the subject: `free -m`,
  `/proc/meminfo`, `sync`, `drop_caches`, `write()`.
- **Dirty and writeback segments have a minimum width** (6.6rem) so their name, MiB and age clock stay readable for
  small writes; the bar's scale bends a little there, the MiB are written in each segment.
- **Trace:** one line per model event, two columns at 1920×1080; a re-read is folded into its read's line. The worst
  case (every toggle on, read 800, write 500 at 5 s) fits: checked by screenshot.
- **Panel:** six presets in two columns, the ratios choice on one row, toggles in one column; fits at 1920×1080 in
  both languages (the gate's panel check).
- **Entries:** `drop-caches` (the task's caption; "Linux ate my RAM") and `power-loss` (a finished write is not on
  disk). `related`: `lnx-memory-swap-oom`; that sim's `related` should list this one back (coordinator; not my folder).
- **Tags:** topic `linux-admin`, tag `memory`, level `intro` (as the task says; all in `tags.json`).

## Deviations from the task

- **`big-write` "Dirty shown ≈ 265"** is shown as Dirty 132 + Writeback 133 = 265 on the gauge (Dirty + Writeback),
  since the limit is checked on that sum. `/proc/meminfo` shows the two lines separately.
- **`small-write` "move seconds to 30 → written, Dirty 0"**: at 30 s Dirty is 0 and the 100 MiB are under writeback;
  they are on disk at 35 s (4 s at 25 MiB/s). Power loss at 30 s still loses them.
- **Disk speed, the per-inode age, and the background/limit split** are additions the task did not specify (above).
- **Param order in the panel:** sliders first, then the ratios, then the toggles (reread among them), so the panel fits.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, "Zauzeće, kvote i odlagalište
  memorije": the `free -h` listing (1.7Gi / 417Mi / 598Mi / 728Ki / 885Mi / 1.3Gi); free shows "priručne spreme i
  međuspremnike".
- free(1), procps-ng 4.0.4 (this machine), **checked**: used = total − available.
- proc_meminfo(5), **checked**: `MemAvailable` ("An estimate …"), `Cached` ("the page cache"), `Dirty` ("waiting to
  get written back to the disk"), `Writeback` ("actively being written back to the disk").
- `sysctl` on this machine, **checked**: `vm.dirty_background_ratio = 10`, `vm.dirty_ratio = 20`,
  `vm.dirty_expire_centisecs = 3000`, `vm.dirty_writeback_centisecs = 500`.
- sync(1), **checked**: "Synchronize cached writes to persistent storage".
- `/usr/src/linux-headers-6.8.0-136/include/linux/writeback.h`, **checked**: `dirty_writeback_interval`,
  `dirty_expire_interval`, `global_dirty_limits(*pbackground, *pdirty)`.
- NLA `meta/toc.md` T42 (no chapter yet).
- Numbers: an independent 1 ms time-stepping simulation (session scratchpad) agreed with the closed form on all 546
  write/seconds/ratios cases before the page was written; the presets' numbers are now in `sim.test.js`.

## Unchecked *(check)*

- `Documentation/admin-guide/sysctl/vm.rst` (meaning of the four knobs; `drop_caches` "will not free any dirty
  objects"): not on this machine.
- `mm/page-writeback.c`: background writeback compared on Dirty alone, the throttle limit on Dirty + Writeback; one
  dirtied time per inode (`fs/fs-writeback.c`). Source not on this machine.
- write(2) NOTES and fsync(2): section 2 man pages are not installed here.
- `Documentation/filesystems/proc.rst` `MemAvailable` (dirty file pages counted as available).
- Croatian terms marked *check* in the task: *prljava stranica*, *upisivanje na disk*, *pisanje kroz međuspremnik*,
  *nit za pražnjenje*, *predmemorija stranica*.

## Term pairs (missing from `kit/glossary.js`; written out in both tables until added)

| en | hr | source |
|---|---|---|
| page cache | predmemorija stranica | task (UL uses *predmemorija* for cache) *(check)* |
| dirty page | prljava stranica | task *(check)* |
| writeback | upisivanje na disk | task *(check)* |
| buffered write | pisanje kroz međuspremnik | task *(check)* |
| flusher thread | nit za pražnjenje | task *(check)* |
| available memory | raspoloživa memorija | task |

Used from the glossary: `cache` (predmemorija).

## Shared requests

- None needed.

## Review

A fresh reviewer (subagent, this session) read the model against SPEC.md and the task, recomputed the six presets by
hand (all match), and ran 77 mutations, each also compared with the original over all 148 512 page settings. Every
mutation of a rule or tie-break was caught. Fixed after the review:
- the power-loss banner and `cLost` said "at {seconds} s" when sync had run first; now `powerAt` = seconds + sync
  time (power-loss preset with sync: 14 s, not 10);
- tests added for what survived: the caption order power loss → drop → sync, every preset's events with their values
  (background line also while throttled, the throttle line after `write()` returned, `returnedAt`, `evicted`, sync
  time, expiry tick), the power time;
- edge wording: `cSafeNone` when nothing was written; `cSync` only when sync had something to write (else
  `cWritten`); "dirty and writeback pages stay" after drop_caches (the number includes writeback);
- SPEC.md: the sync-while-throttled simplification, the hard throttle wall vs the kernel's gradual slowdown, the
  caption list with `cLostMid`.
Left as is: survivors with no visible effect (expiry ignoring writeback that has always drained by 30 s; `changed()`
skipping `used`, which never moves); `shared` stays 0 (in reality the 159 MiB would be shmem/tmpfs and show there;
the book shows 728Ki, 0 in MiB).

## Time

Start 20:15, done 20:40 (2026-11-03), 25 minutes.
