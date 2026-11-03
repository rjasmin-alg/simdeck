<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-memory-swap-oom: notes

New explorer (task `docs/tasks/w3/lnx-memory-swap-oom.md`, catalogue `lnx-memory-swap-oom`, §4.4; courses UL ch12, OS).
Rules and expected numbers: `SPEC.md`. No kit view: the bars, `free -m`, the process table and the trace are the
page's own HTML (text at 1:1, no SVG).

## Decisions

- **Pure, promotable model.** `run`, `allocate`, `readFiles`, `badness`, `pickVictim` and `segments` hold no
  strings and no page code. `initial(params)` puts the `free -m` columns and the process table together; `changed`
  and `captionKey` are for the page.
- **The 159 MiB of unreclaimable cache** is chosen so that available = free + reclaimable cache reproduces the book's
  1.3Gi (1324). The page says so in the explanation; SPEC.md rule 1.
- **Other processes (258 MiB)** are one fixed grey block: not swappable, not OOM candidates (many small processes,
  each far below db or the build). Stated in SPEC.md.
- **The backup has RSS 0.** Its anonymous memory is left out; what it reads is page cache, not its RSS. That is a
  point the table makes on purpose (RSS 0, yet buff/cache grew by 598).
- **Swap order:** earliest-started process first, never the asker's own pages (SPEC.md rule 4). The task's
  "simplification of `vm.swappiness`" is said in the explanation.
- **The asker that dies** keeps what it had (424) as its RSS in the struck row; its memory returns to free.
- **Score column:** the live badness for live rows; the score at the kill for a killed row; "nikad / never" for −1000.
  The scores the OOM killer compared are in the trace line and the caption (build 424 at the moment of the OOM, 600
  after it got db's memory).
- **Kernel log line:** `Out of memory: Killed process 2102 (db)`, the start of the real line (the kernel goes on with
  total-vm, anon-rss, … which the page leaves out). PIDs are fixed: backup 2101, db 2102, build 2103.
- **Names:** `backup`, `db`, `build`: generic roles, no product (COMMON §1). The commands shown are the subject:
  `free -m` (the book's listing) and `oom_score_adj`.
- **Panel layout:** six presets in two columns (as `amdahl` and `delay-components` do) so the presets and five
  params fit at 1920×1080 in both languages; measured for every preset, panel 864/864 hr and 862/862 en.
- **Captions** name db and the build in Croatian cases (`baza`/`baze`, `build`/`builda`); only the build can trigger
  the OOM killer with these params (SPEC.md edge cases), so the OOM captions are written for it. `cOomDb` is the
  task's caption word for word with the numbers filled in.
- **Entries:** `cache-gives-way` (free 0 is not out of memory), `oom-kills-db` (the highest score dies, not the asker)
  and `swap-saves` (swap keeps the database alive): the three misconceptions of the task. `related`: `lnx-cgroups`,
  `processes`. `lnx-page-cache` does not exist yet; link it both ways when it is built (task's note for coordinator).
- **Tags:** topic `linux-admin`, tag `memory`, level `intro` (as the task says; all in `tags.json`).

## Deviations from the task

- **`db` and `build` toggles folded into `dbSize` / `buildSize`, 0 = not started** (range 0–1200 step 100, "ne
  radi / not started" at 0). With separate toggles the panel needed ~960 px of 864 at 1920×1080. The sizes 100 MiB
  are now also reachable (the task's range starts at 200); nothing in the model depends on it. `dbAdj` stays the
  task's 0 | −1000 choice.
- **"total" in the badness is RAM + swap** (the kernel's `totalpages`); the task writes "adj × total / 1000". Only
  matters for adj values other than 0 and −1000, which the page does not offer.
- **The OOM killer repeats while still short** (the kernel's out_of_memory is called again by the allocator); with
  the page's params one kill always suffices.
- **Swapping never takes the asker's own pages** (the task says "the least recently used anonymous pages (those of the
  earliest-started process)"; this makes the asker's exclusion explicit). Not reachable from the page's grid either
  way; tested on `allocate` directly.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, "Zauzeće, kvote i odlagalište
  memorije": the `free -h` listing (1.7Gi / 417Mi / 598Mi / 728Ki / 885Mi / 1.3Gi, `Swap: 0B 0B 0B`); the 512M
  `/swapdatoteka` (`fallocate`, `mkswap`, `swapon`; `free` then shows `Swap: 511Mi`); the definition *odlagalište
  memorije*; "Šire o temi" (`/proc/swaps`, `SwapTotal`, `SwapFree`). The book has no OOM section.
- free(1), procps-ng 4.0.4 (this machine), **checked**: used = total − available; available = MemAvailable.
- proc_meminfo(5), **checked**: `MemAvailable`, `SwapTotal`, `SwapFree`.
- proc_pid_oom_score_adj(5), **checked**: added to the badness; −1000 disables OOM killing for the task.
- `/usr/src/linux-headers-6.8.0-136/include/linux/oom.h`, **checked**: `oom_badness(p, totalpages)`, `struct
  oom_control` `totalpages`, `chosen`, `chosen_points`; `include/uapi/linux/oom.h`: `OOM_SCORE_ADJ_MIN (-1000)`.
- Numbers: an independent closed-form script (in the session's scratchpad) gave the six presets' numbers before the
  model was written; they are now in `sim.test.js`.

## Unchecked *(check)*

- `mm/oom_kill.c` itself (`oom_badness` body: rss + swap entries + page tables, `adj *= totalpages / 1000`;
  `oom_evaluate_task` replacing on `points >= chosen_points`; the task-list walk in creation order): not on this
  machine, only the headers are.
- Kernel `Documentation/filesystems/proc.rst` (`MemAvailable` estimate) and the mm reclaim documentation (rule 3).
- Croatian "ubojica OOM" for *OOM killer* (the task marks it *check*; no course book uses it yet).

## Term pairs (missing from `kit/glossary.js`; written out in both tables until added)

| en | hr | source |
|---|---|---|
| page cache | predmemorija stranica | task (UL uses *predmemorija* for cache) |
| available memory | raspoloživa memorija | task |
| used memory | zauzeta memorija | task |
| OOM killer | ubojica OOM | task *(check)* |

Used from the glossary: `cache` (predmemorija), `swap area` (odlagalište memorije), `paging` (straničenje),
`resident set` (rezidentni skup).

## Shared requests

- None needed. Noted only: `visible: (p) => false` does not hide a kit control because `.sd-ctl { display: flex }`
  beats the `hidden` attribute (`dns-ttl-cache` works around it with a page rule). This page does not hide controls.

## Review

A fresh reviewer (subagent, this session) read the diff against SPEC.md and the task, recomputed the six presets by
hand (all match), ran the whole page grid (memory conserved, at most one kill, backup never the victim, the asker
always the build) and tried 63 mutations. Fixed after the review:
- the trace's swap step said "{n} pages" for a number of MiB (and the Croatian plural was wrong for 1024);
- the OOM caption said "swap is full" while the stage showed it empty again (the victim's swap is freed): now "swap was
  not enough";
- `cReclaim` said "the request took" for the sum of two requests: now "{took} MiB was taken back from the page cache";
- `changed()` did not compare `ask`;
- `cOomProtected` was used when a −1000 database would have lost anyway (db 200, build 1200): now `cOomSelf`;
- the trace shows the scores the OOM killer compared, so the build's 424 at the OOM and its 600 after are both visible;
- tests added for every behaviour-changing survivor: a −1000 process still swaps, a two-kill OOM loop, the PIDs,
  `changed()` on ask/adj/score/cache, the `cOomSelf` fall-through. My own mutation set (27 mutations over rules 1–6,
  captions and `changed`) is now killed in full.
Left as is: survivors that cannot change any result on the page's grid (e.g. swapping a killed process: no process is
killed before swapping).

## Time

Start 18:42, done 19:06 (2026-11-03), 24 minutes.
