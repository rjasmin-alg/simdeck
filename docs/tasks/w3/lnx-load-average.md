# lnx-load-average: Load average

| | |
|---|---|
| Task | `lnx-load-average` (wave 3, Linux) |
| Catalogue entry | `lnx-load-average` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-load-average/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | UL, NLA |
| Topic / tags / level | `linux-admin` / `performance` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **load counts runnable and D-state tasks, not CPU percent**.

The student: add CPU and I/O-bound tasks on 1–8 cores.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/08-procesi.md` (Uvod u Linux), section "Nadzor opterećenja" (definition box *opterećenje sustava*, the `yes > /dev/null` worked run) and "Primjer 2 — je li ovom stroju teško?"; footnotes ch8-loadavg (proc_loadavg(5)) and ch8-uptime (uptime(1))
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topics T41 (USE method) and T42 (memory, I/O and scheduler) (Napredna Linux administracija; chapters not written yet)
- Linux kernel `include/linux/sched/loadavg.h` (EXP_1, EXP_5, EXP_15, LOAD_FREQ) and `kernel/sched/loadavg.c` (check)
- Catalogue seed: NLA T41

## Model and presets

- **Scene:** one machine: a row of 1–8 core boxes (busy or idle), a run queue of `R` tasks waiting for a core, a
  disk lane of `D` tasks waiting for I/O, the three load numbers as `uptime` prints them next to `nproc`, a
  %CPU meter, and a small live chart of the 1/5/15-minute averages over 0–30 min with a cursor at time *t*.
- **State (computed from params, explorer):** `{ t, cores, running: [ids], queued: [ids], dstate: [ids],
  load: [l1, l5, l15], cpuPct, series: [[t, l1, l5, l15], …] }`.
- **Explorer:** the params define a workload (CPU tasks and I/O tasks started at t = 0 and stopped at
  `runFor`); the model replays the kernel's 5-second samples from 0 to `t` and draws the result. Moving `t`
  scrubs time; changing `cores` changes %CPU and the queue but **not** the load numbers.
- **Rules:**
  1. The load counts tasks in state `R` (running or runnable) **plus** tasks in state `D` (uninterruptible,
     waiting for disk I/O), averaged over 1, 5 and 15 minutes. From UL ch08 "Nadzor opterećenja",
     footnote ch8-loadavg (proc_loadavg(5)).
  2. It is not normalised to the number of CPUs: load 1 on one CPU = busy all the time; on four CPUs = idle
     75 % of the time. From UL ch08 "Nadzor opterećenja" (uptime(1) footnote ch8-uptime).
  3. Every 5 s the kernel samples n = nr_running + nr_uninterruptible and updates each average as
     `load = load·e + n·(1 − e)` with fixed-point e = 1884/2048, 2014/2048, 2037/2048 (≈ exp(−5/60),
     exp(−5/300), exp(−5/900)). Linux `include/linux/sched/loadavg.h` (EXP_1, EXP_5, EXP_15, FSHIFT 11) (check).
     The model uses the fixed-point constants in floating point and rounds to two decimals only for display.
  4. %CPU = min(cpuTasks, cores) / cores while the CPU tasks run; D-state tasks add 0 %CPU (they show as
     `wa`, iowait). CPU tasks above `cores` wait in the run queue and still count in the load.
  5. Edge cases: `cores` ≥ `cpuTasks` means an empty run queue; `cpuTasks = ioTasks = 0` keeps all three at
     0.00; `t < runFor` means the workload is still running at the cursor. Samples at exactly `runFor` still
     count the tasks (stop takes effect after that sample).
  6. Reading: a series falling left to right (1.33 → 0.40 → 0.14) is load that just started; a rising one is
     load that was higher earlier and is easing. From UL ch08 "Nadzor opterećenja".
- **Params:** `cores` range 1–8, default 2; `cpuTasks` range 0–8, default 2; `ioTasks` range 0–8, default 0;
  `runFor` range 5–1800 s step 5, default 65; `t` range 0–1800 s step 5, default 65.
- **Presets:**
  1. `book-yes` — two `yes > /dev/null` on 2 cores, measured at 65 s: cores 2, cpu 2, io 0, runFor 65, t 65 →
     1.32, 0.39, 0.14 (book: 1.33, 0.40, 0.14; the ±0.01 is sample alignment and the shell's own tasks);
     %CPU 100. From UL ch08 "Nadzor opterećenja" (`yes > /dev/null & yes > /dev/null & sleep 65; uptime`).
  2. `book-top-later` — the same after `kill %1 %2`, 14 s later in the book (the model snaps to the 5 s grid): t 80 → 1.03, 0.37, 0.13 (book's `top` in
     Primjer 2: 1.04, 0.38, 0.13, a separate session). From UL ch08 Primjer 2 "je li ovom stroju teško?".
  3. `one-core-queue` — cores 1, cpu 2, runFor 600, t 600 → 2.00, 1.73, 0.95; %CPU 100, one task waiting.
     Same work as preset 1 in steady state, a queue twice the capacity. Derived, unchecked.
  4. `io-bound` — cores 4, cpu 0, io 4, runFor 600, t 600 → 4.00, 3.46, 1.90 with %CPU 0 (all iowait):
     "load 4 on 4 cores" with idle CPUs. Derived, unchecked.
  5. `easing` — cores 4, cpu 4, runFor 600, t 900 → 0.03, 1.27, 1.38: the rising series of rule 6.
     Derived, unchecked.
- **Steps:** none (explorer). Each preset sets `t`; the demo moves the `t` and `cores` sliders.
- **Legend:** filled core = busy (R on CPU), outlined task in queue = runnable waiting (R), hatched task on
  the disk lane = D state, idle core = hollow box. "Changed" highlight: the load numbers that moved since the
  last param change and the cores whose busy/idle state flipped.
- **Captions:**
  - hr: „Opterećenje 1,32 na 2 jezgre: red nije premašio ono što stroj vodi usporedno. Na 1 jezgri ista bi
    brojka značila red dulji od kapaciteta."
  - en: "Load 1.32 on 2 cores: the queue never exceeded what the machine runs in parallel. On 1 core the same
    number would mean a queue longer than capacity."
- **Terms:** load average — opterećenje sustava; run queue — red za izvođenje; runnable (state R) — stanje
  izvođenja `R`; uninterruptible sleep (state D) — čekanje na ulaz/izlaz diska (stanje `D`); core — jezgra;
  I/O — ulaz/izlaz.
- **Misconceptions:** load = %CPU; "load 1.33 means overloaded" without `nproc`; a machine with idle CPUs
  cannot have a high load (D state).
- **Out of scope:** PSI (`/proc/pressure`), per-cgroup load, NO_HZ idle corrections, the 4th and 5th fields
  of `/proc/loadavg` (named only), the USE method itself (NLA T41).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-load-average sims/lnx-load-average` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-load-average/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
