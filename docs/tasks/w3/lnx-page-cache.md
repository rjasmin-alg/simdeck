# lnx-page-cache: free vs available

| | |
|---|---|
| Task | `lnx-page-cache` (wave 3, Linux) |
| Catalogue entry | `lnx-page-cache` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-page-cache/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | UL, NLA |
| Topic / tags / level | `linux-admin` / `memory` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **the page cache is not lost memory; dirty pages and writeback**.

The student: read and write files, watch the counters.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T42 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T42
- NLA row T42 ("Memorija, U/I i raspoređivač — koliko treba da se pročita mjerenje") (no chapter yet)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, section "Zauzeće, kvote i odlagalište memorije" (`free -h` listing used as the starting point; `free` "priručne spreme i međuspremnike")
- Linux kernel Documentation/admin-guide/sysctl/vm.rst: `dirty_background_ratio`, `dirty_ratio`, `dirty_expire_centisecs`, `dirty_writeback_centisecs`, `drop_caches`; proc(5) `/proc/meminfo` (`MemAvailable`, `Cached`, `Dirty`, `Writeback`); free(1); sync(1), fsync(2)

## Model and presets

- **Scene:** a RAM bar 1741 MiB (the book's `1.7Gi`) split into process memory, page cache **clean** (hatched), page cache **dirty** (cross-hatched, with an age clock), unreclaimable cache (dots) and free; beside it a disk with the files read/written and a "disk I/O" counter; right, two readouts side by side: `free -m` (`used free buff/cache available`) and the matching `/proc/meminfo` lines (`MemFree`, `MemAvailable`, `Cached`, `Dirty`, `Writeback`). Two marks on the dirty scale: `dirty_background_ratio` (10%) and `dirty_ratio` (20%).
- **Class:** explorer. The params describe what has been done (read, re-read, write, seconds since, sync, drop caches, power loss); the page recomputes the picture.
- **State (derived from params):** `{ free, procMem: 258, cacheFixed: 159, clean, dirty, writeback, diskRead, diskWritten, throttled, lost }`. Same starting numbers as `lnx-memory-swap-oom` so the two pages agree.
- **What the params drive:** read → cache fill; write → dirty pages; seconds → writeback by age; thresholds → background writeback and throttling; sync/drop/power-loss → their rules, applied in that order.
- **Rules:**
  1. Start: the book's `free -h` (`1.7Gi 417Mi 598Mi … 885Mi 1.3Gi`). `available` ≈ free + reclaimable page cache = 1324; `used` = total − available = 417. (ch12 `free -h` listing; free(1); 159 MiB unreclaimable chosen to match the book, say so)
  2. Reading a file not in the cache reads it from disk into the page cache, taking free memory (evicting the oldest clean cache if free runs out); `available` does not drop. Reading it again is a cache hit: no disk read. (kernel Documentation/admin-guide/mm, check)
  3. A buffered write puts dirty pages in the cache and `write()` returns before the disk is touched. (write(2) NOTES, check)
  4. Writeback by age: flusher threads wake every `dirty_writeback_centisecs` (500 = 5 s) and write pages dirty for longer than `dirty_expire_centisecs` (3000 = 30 s). Tie-break: a page that turns 30 s old exactly on a flusher tick is written on that tick. (kernel Documentation/admin-guide/sysctl/vm.rst)
  5. Background writeback starts at once when dirty memory exceeds `dirty_background_ratio` (10%) of dirtyable memory (≈ available: 132 MiB here); above `dirty_ratio` (20%: 265 MiB) the writing process is throttled, so dirty memory stays near 265 MiB while the disk drains. (vm.rst)
  6. `sync` (or `fsync` on the file) writes all dirty pages now; they become clean. (sync(1), fsync(2))
  7. `echo 1 > /proc/sys/vm/drop_caches` frees clean page cache only; dirty pages are not freed. Free goes up, `available` stays the same. (vm.rst `drop_caches`: "will not free any dirty objects")
  8. Power loss: dirty pages not yet written are lost; clean cache loses nothing (the disk has it). (derived from rules 3–4)
- **Params:** `readMiB` range 0–800 step 50, default 0; `reread` toggle, default off; `writeMiB` range 0–500 step 25, default 0; `seconds` range 0–60 step 5 (time since the write), default 0; `sync` toggle, default off; `dropCaches` toggle, default off; `powerLoss` toggle, default off; `ratios` choice `10/20` | `5/10`, default `10/20`.
- **Presets:**
  - `book-free` — nothing done: `Mem: 1741 417 598 … 885 1324`. From ch12 (split of buff/cache derived).
  - `read-twice` — read 400, reread on: disk read 400 (not 800); free 198, buff/cache 1285, available 1324. Derived, unchecked.
  - `small-write` — write 100, seconds 0 → Dirty 100 (below 132, nobody writes yet); move seconds to 30 → written, Dirty 0. Derived, unchecked.
  - `big-write` — write 500: background writeback from 132 MiB, writer throttled at 265 MiB; Dirty shown ≈ 265, `throttled` flag on. Derived, unchecked.
  - `drop-caches` — drop on: buff/cache 885 → 159, free 598 → 1324, available 1324 (unchanged). Derived, unchecked.
  - `power-loss` — write 100, seconds 10, power loss: 100 MiB lost; with `sync` on first: 0 lost. Derived, unchecked.
- **Steps:** none (explorer).
- **Legend:** process memory (solid), clean cache (hatched), dirty cache (cross-hatch + clock badge with age), unreclaimable cache (dots), free (empty), threshold marks (dashed lines labelled 10% / 20%), lost data (× badge). "Changed" marks the segments and `/proc/meminfo` lines that moved since the last param change.
- **Captions:**
  - HR: „`drop_caches` je oslobodio 726 MiB predmemorije: `free` je narastao na 1324, a `available` je ostao 1324. Ta memorija nikad nije bila izgubljena, samo posuđena.“
  - EN: "`drop_caches` freed 726 MiB of page cache: `free` rose to 1324 and `available` stayed at 1324. That memory was never lost, only lent."
- **Terms:** page cache — predmemorija stranica (check; UL uses *predmemorija* for cache); dirty page — prljava stranica (check); writeback — upisivanje na disk (check); buffered write — pisanje kroz međuspremnik (check); available memory — raspoloživa memorija; synchronise — sinkronizirati; flusher thread — nit za pražnjenje (check).
- **Misconceptions:** "Linux ate my RAM" (cache is lent and counted as available); `drop_caches` makes the system faster or frees "real" memory; a finished `cp` means the data is on disk.
- **Out of scope:** memory pressure, swap and OOM (`lnx-memory-swap-oom`), `O_DIRECT`, per-device writeback limits, readahead sizes, NUMA, cgroup writeback.
- **Note for coordinator:** shares its starting numbers and the "available" rule with `lnx-memory-swap-oom`; see the split proposed there.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-page-cache sims/lnx-page-cache` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-page-cache/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
