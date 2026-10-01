# lnx-memory-swap-oom: Memory, swap and the OOM killer

| | |
|---|---|
| Task | `lnx-memory-swap-oom` (wave 3, Linux) |
| Catalogue entry | `lnx-memory-swap-oom` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-memory-swap-oom/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | UL, OS |
| Topic / tags / level | `linux-admin` / `memory` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **page cache vs used, swapping, who the OOM killer picks**.

The student: start processes, watch memory and the kill.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-12/`
- Catalogue seed: UL ch12
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, section "Zauzeće, kvote i odlagalište memorije" (`free -h` listing: 1.7Gi / 417Mi / 598Mi / 885Mi / 1.3Gi; `fallocate`/`mkswap`/`swapon` of a 512M swap file; definition *odlagalište memorije*) and its "Šire o temi" (`/proc/swaps`, `SwapTotal`, `SwapFree`)
- free(1) (procps-ng: `used` = total − available, check), proc(5) `/proc/meminfo` `MemAvailable` and `/proc/pid/oom_score_adj`; Linux kernel source `mm/oom_kill.c` (`oom_badness`, `oom_evaluate_task`) (check)
- The book has no OOM section: the OOM rules are all (check)

## Model and presets

- **Scene:** a horizontal RAM bar 1741 MiB wide (the book's `1.7Gi`), split into `used` (anonymous memory of each process, one labelled block per process), `buff/cache` (reclaimable part hatched, unreclaimable 159 MiB solid) and `free`; under it a swap bar; right, a live `free -m` table (`total used free shared buff/cache available`, `Swap:` row) and a process table (`PID`, name, RSS, swap, `oom_score_adj`, badness). If the OOM killer fires, the victim's row is struck through with the kernel's log line `Out of memory: Killed process … (name)`.
- **Class:** explorer. The params are the processes and the swap; the page recomputes the whole picture from them. No steps.
- **State (derived from params):** `{ free, cache, cacheFixed: 159, procs: [{ pid, name, rss, swap, adj, killed }], swapTotal, swapUsed, oomVictim, events }`.
- **What the params drive:** processes start in fixed list order (backup → db → build), each allocating its size through rules 2–5; the table, bars and `free` line follow.
- **Rules:**
  1. Starting point is the book's `free -h`: total 1741, free 598, buff/cache 885, of which 159 is not reclaimable; other processes' memory 258. `available = free + reclaimable cache` = 1324 (`1.3Gi`); `used = total − available` = 417 (procps-ng 4 definition, check free(1)). The 159 is chosen to reproduce the book's line; say so in NOTES. (ch12 "Zauzeće, kvote i odlagalište memorije", `free -h` listing)
  2. Reading files (backup) fills page cache from free memory: free drops, `available` does not. (ch12 `free` "priručne spreme i međuspremnike"; kernel Documentation/filesystems/proc.rst `MemAvailable`, check)
  3. An allocation takes free memory first, then reclaims clean page cache (least recently used first). (kernel mm docs, check)
  4. If cache is exhausted and swap has room, the least recently used anonymous pages (those of the earliest-started process) go to swap. Simplification of `vm.swappiness`, which in reality mixes rules 3 and 4; say so. (ch12 *odlagalište memorije*; proc(5) `SwapTotal`/`SwapFree`, check)
  5. If neither is enough, the OOM killer picks the process with the highest badness = RSS + swap (+ page tables, ignored) + `oom_score_adj` × total / 1000; `oom_score_adj = -1000` is never picked. The victim may be a process other than the one asking. Its memory is freed and the allocation completes. (kernel mm/oom_kill.c `oom_badness`; proc(5) `/proc/pid/oom_score_adj`, check)
  6. Tie-break: equal badness → the later-started process is picked (the kernel replaces its choice on ≥ while walking the task list). (mm/oom_kill.c `oom_evaluate_task`, check)
- **Params:** `swap` choice 0 | 512 | 1024 MiB, default 0 (512 is the book's `/swapdatoteka`); `backup` toggle (reads 800 MiB of files), default off; `db` toggle, default off; `dbSize` range 200–1200 step 100, default 900; `dbAdj` choice 0 | −1000, default 0; `build` toggle, default off; `buildSize` range 200–1200 step 100, default 600.
- **Presets:**
  - `book-free` — nothing started: `Mem: 1741 417 598 … 885 1324`, `Swap: 0 0 0`. From ch12 (`free -h`, the 159 MiB split derived).
  - `backup-reads` — backup on: free 0, buff/cache 1483, available still 1324. Derived, unchecked.
  - `cache-gives-way` — build 900 alone (buildSize 900): free 0, buff/cache 583, available 424, used 1317; no swap used, nobody killed. Derived, unchecked.
  - `oom-kills-db` — db 900, then build 600, no swap: build is 176 MiB short after reclaiming all cache; badness db 900 > build 424 → **db** is killed, build runs, free 724. Derived, unchecked.
  - `swap-saves` — same with swap 512: 176 MiB of db's pages go to swap (db RSS 724, swap 176), nobody killed. Derived, unchecked.
  - `protect-db` — same as `oom-kills-db` with `dbAdj` −1000: the victim is build itself (424 allocated), db survives. Derived, unchecked.
- **Steps:** none (explorer).
- **Legend:** process memory (solid block per process, labelled), reclaimable page cache (hatched), unreclaimable cache (dots), free (empty), swap used (striped, under the RAM bar), OOM victim (cross + struck row). The "changed" highlight marks the bar segments and table cells that changed since the last param change.
- **Captions:**
  - HR: „Za build nedostaje 176 MiB, a odlagališta memorije nema. Ubojica OOM bira proces s najvećim zbrojem: baza (900 MiB) ima više od builda (424 MiB), pa umire baza.“
  - EN: "The build is 176 MiB short and there is no swap. The OOM killer picks the highest score: the database (900 MiB) outscores the build (424 MiB), so the database dies."
- **Terms:** page cache — predmemorija stranica (UL uses *predmemorija* for cache); swap area — odlagalište memorije; available memory — raspoloživa memorija; used memory — zauzeta memorija; OOM killer — ubojica OOM (check); paging — straničenje; resident set size — rezidentni skup (check).
- **Misconceptions:** "free is 0, the machine is out of memory" (look at `available`); the OOM killer kills the process that asked (it kills the highest score); swap only slows things down (it can be what keeps the database alive).
- **Out of scope:** cgroup memory limits (`lnx-cgroups`), overcommit modes, huge pages, zswap, dirty pages and writeback (`lnx-page-cache`).
- **Note for coordinator:** overlaps with `lnx-page-cache` (both show that page cache counts as available). Suggested split: this page owns memory pressure, swap and the OOM choice; `lnx-page-cache` owns dirty pages, writeback and `drop_caches`. Link both ways.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-memory-swap-oom` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-memory-swap-oom sims/lnx-memory-swap-oom` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-memory-swap-oom/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
