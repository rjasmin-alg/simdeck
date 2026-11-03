<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-memory-swap-oom — spec

**Concept:** page cache vs used, swapping, and who the OOM killer picks.
Task: `docs/tasks/w3/lnx-memory-swap-oom.md`; catalogue `docs/catalogue.md` §4.4; courses UL (ch. 12 "Zauzeće, kvote
i odlagalište memorije") and OS.

Explorer: the state is a pure function of the params (`initial(params)` in `sim.js`). The machine starts as the book's
`free -h` line; the started processes run in fixed order backup → db → build, each one through rules 2–6. All sizes
are MiB, all integers.

## Params

| Param | Meaning | Values | Default |
|---|---|---|---|
| `swap` | size of the swap area | 0, 512, 1024 (512 is the book's `/swapdatoteka`) | 0 |
| `backup` | the backup reads 800 MiB of files | off / on | off |
| `dbSize` | the database's anonymous memory; **0 = not started** | 0–1200, step 100 | 0 |
| `dbAdj` | the database's `oom_score_adj` | 0, −1000 | 0 |
| `buildSize` | the build's anonymous memory; **0 = not started** | 0–1200, step 100 | 0 |

The task's `db` and `build` toggles are folded into the sizes (0 = off) so that presets and params fit the panel at
1920×1080 (NOTES.md, deviations). The tests speak the task's shape (`db`, `dbSize` default 900, `build`, `buildSize`
default 600) through a small mapping helper.

## Rules

1. **Starting point: the book's `free -h`.** total 1741, free 598, buff/cache 885, of which **159 is not
   reclaimable**; other processes 258 (= 1741 − 598 − 885). **available = free + reclaimable cache** = 598 + 726 =
   1324 (`1.3Gi`); **used = total − available** = 417. UL ch12 "Zauzeće, kvote i odlagalište memorije", the `free -h`
   listing (1.7Gi / 417Mi / 598Mi / 728Ki / 885Mi / 1.3Gi). free(1) of procps-ng 4.0.4, **checked** on this machine:
   "used — Used or unavailable memory (calculated as total - available)"; "available — Estimation of how much memory
   is available for starting new applications, without swapping … takes into account page cache". The book's own
   line confirms the procps-ng 4 definition (1741 − 598 − 885 = 258 ≠ 417; 1741 − 1324 = 417). The 159 is **chosen**
   to reproduce the line (available = free + cache − 159); in a real kernel MemAvailable also discounts slab, the
   low watermark and part of the page cache (proc_meminfo(5) `MemAvailable`, checked: "An estimate …"). `shared` is
   shown as 0 (`728Ki` in the book is 0 in MiB).
2. **Reading files fills the page cache from free memory.** The backup reads 800 MiB: min(free, 800) moves from free
   to buff/cache; the rest replaces older reclaimable cache (least recently used first), so buff/cache stops at
   1483. free drops, **available does not move**. The backup's own anonymous memory is left out (RSS 0): file pages
   are cache, not the reader's RSS. UL ch12 (free(1): "priručne spreme i međuspremnike"); kernel
   `Documentation/filesystems/proc.rst` `MemAvailable` *(check: not opened)*.
3. **An allocation takes free memory first, then reclaims clean page cache** (least recently used first), never the
   unreclaimable 159. Kernel mm documentation *(check: not opened)*.
4. **Swap.** If cache is exhausted and swap has room, the least recently used anonymous pages go to swap: those of the
   **earliest-started** live process first, then the next. The asker's own pages are never swapped for its own
   request (they are the most recently used; swapping them would only move the shortage). This is a simplification of
   `vm.swappiness`, which in reality mixes reclaiming cache (rule 3) and swapping (rule 4); here they go in order.
   UL ch12 definition *odlagalište memorije*, "Šire o temi" (`/proc/swaps`, `SwapTotal`, `SwapFree`);
   proc_meminfo(5) `SwapTotal` / `SwapFree`, **checked**.
5. **The OOM killer.** If neither is enough, the OOM killer picks the live process with the highest
   **badness = RSS + swap (+ page tables, ignored) + oom_score_adj × (RAM + swap) / 1000**. `oom_score_adj = −1000`
   is never picked. The victim may be a process other than the asker. Its RAM and swap are freed; if the victim is
   another process, the allocation then completes from the freed memory; if it is the asker, the asker dies with what
   it had and its request is never met. Repeat while still short (with these params one kill always suffices: see
   below). Linux `mm/oom_kill.c` `oom_badness()` *(check: the source is not on this machine)*; what **is checked**:
   the prototype `long oom_badness(struct task_struct *p, unsigned long totalpages)` and `struct oom_control`'s
   `totalpages`, `chosen`, `chosen_points` in `/usr/src/linux-headers-6.8.0-136/include/linux/oom.h`;
   `OOM_SCORE_ADJ_MIN (-1000)` in `include/uapi/linux/oom.h` ("disables oom killing"); proc_pid_oom_score_adj(5):
   "The value of oom_score_adj is added to the badness score … −1000 … equivalent to disabling OOM-killing entirely
   for that task". The man page's "root processes are given 3% extra" is from older kernels and is not modelled.
6. **Tie-break.** Equal badness → the **later-started** process is picked: the kernel walks the task list in creation
   order and replaces its choice when `points >= chosen_points` (`oom_evaluate_task`, *check*). The model walks the
   processes in start order and replaces on ≥ (`pickVictim`).

### Edge cases

- Only the build can trigger the OOM killer: db ≤ 1200 < 1324 always fits, and the backup allocates nothing. So the
  victim is db or the build; the backup (score 0) can never win against a build that already holds ≥ 124 MiB.
- With the page's grid no badness tie is reachable (db = 1324 − db needs db = 662; with swap 512, db = 918; with
  1024, db = 1174). Rule 6 is tested on `pickVictim` directly and through the model with `dbSize` 918.
- If swap is full or too small, the OOM killer still runs after it (e.g. swap 512, db 1200, build 1200: 512 of db's
  pages go to swap, 564 still missing, db (688 + 512 = 1200) beats build (636) and dies; its swap is freed too).
- A killed process keeps its row (struck), with the RSS, swap and score it was killed with; its memory counts as
  free.

## Presets (numbers checked with an independent closed-form script before coding; now in `sim.test.js`)

| id | params | expected | source |
|---|---|---|---|
| `book-free` | nothing started | `Mem: 1741 417 598 0 885 1324`, `Swap: 0 0 0` | UL ch12 `free -h`; the 159 split derived |
| `backup-reads` | backup on | free 0, buff/cache 1483, available 1324, used 417 | derived |
| `cache-gives-way` | build 900 | free 0, buff/cache 583, available 424, used 1317; no swap, nobody killed | derived |
| `oom-kills-db` | db 900, build 600, no swap | build: 424 from cache, **176 short**; badness db 900 > build 424 → **db** killed; build gets 600; free 724 | derived |
| `swap-saves` | the same, swap 512 | 176 MiB of db's pages to swap: db RSS 724, swap 176; nobody killed; available 0 | derived |
| `protect-db` | the same as `oom-kills-db`, dbAdj −1000 | db never a candidate; the build dies with 424; db survives with 900; free 424 | derived |

Closed forms: reclaimable cache 885 − 159 = 726; db 900 takes 598 free + 302 cache, leaving 424 reclaimable; build
600 takes those 424 and is 600 − 424 = 176 short.

## Scene

- **RAM bar** 1741 MiB wide: other processes (grey, "ostali"), one labelled block per live process (db, build, by
  name and size), unreclaimable cache (dots, "fiksno"), reclaimable cache (hatched), free (empty). Every segment has
  its name and MiB written in it, so colour is never the only carrier.
- **Swap bar** under it at the same scale (512 is 29 % of the RAM bar's width): the swapped pages of each process
  (striped, labelled with the process) and the free rest; "nema odlagališta memorije" (dashed box) without swap.
- The **available** line: free + reclaimable cache = available.
- **`free -m`** as printed (program output, `translate="no"`): `Mem:` total used free shared buff/cache available,
  `Swap:` total used free.
- **Process table:** PID, name, asks, RSS, swap, `oom_score_adj`, score (live: the current badness; a killed row: the
  score it was killed with; −1000: "nikad"). A killed row is struck through with ✕ and "ubijen".
- **What happened:** one line per started process: the backup's read, or what an allocation got from free, from cache,
  from swapping whose pages, how much it was short, the scores the OOM killer compared, whom it killed, and whether
  the request was met. Under it the kernel's log line `Out of memory: Killed process <pid> (<name>)`.
- **"Changed":** the `free -m` cells, the bar segments (and the swap bar) and the process-table cells that moved with
  the last param change; a new row is marked whole. A segment that vanished (e.g. free 724 → 0) has nothing to mark.

## Captions (first that applies)

- `cOomDb` — the task's caption: "The build is 176 MiB short and there is no swap. The OOM killer picks the highest
  score: the database (900 MiB) outscores the build (424 MiB), so the database dies." ("swap is full" when swap
  exists.)
- `cOomProtected` — the build dies itself because db has −1000, and only when the protection decided it (db's RSS +
  swap > the build's score); otherwise `cOomSelf`.
- `cOomSelf` — the build dies itself because its own score is the highest (db 200, build 1200; also with db at −1000
  when db's RSS + swap would have lost anyway). A −1000 db is compared by its RSS + swap.
- `cSwap` — pages went to swap, nobody was killed.
- `cReclaim` — an allocation took cache back: free may read 0, available tells the truth.
- `cRead` — only the backup moved memory: free fell, available did not.
- `cFits` — everything fit in free memory.
- `cBook` — nothing started: the book's line, available vs free.

## Out of scope

cgroup memory limits (`lnx-cgroups`), overcommit modes, huge pages, zswap, dirty pages and writeback
(`lnx-page-cache`), `drop_caches`, the kernel's watermarks and kswapd, page tables in the badness.
