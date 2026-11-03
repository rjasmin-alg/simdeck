<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-load-average — spec

**Concept:** load counts runnable and D-state tasks, not CPU percent.
Task: `docs/tasks/w3/lnx-load-average.md`; catalogue `docs/catalogue.md` §4.4; courses UL (ch. 8 "Nadzor
opterećenja") and NLA (T41 USE method, T42 memory, I/O and scheduler).

Explorer: the state is a pure function of the params. The params define a workload: `cpuTasks` CPU-bound tasks and
`ioTasks` tasks waiting for disk I/O, all started at t = 0 and stopped after `runFor`. The model replays the kernel's
5-second samples from 0 to the cursor `t` (`loadAt`, `seriesOf` in `sim.js`) and reads the scene at `t` (`sceneAt`).

## Params

| Param | Meaning | Range | Default |
|---|---|---|---|
| `cores` | number of cores (`nproc`) | 1–8 | 2 |
| `cpuTasks` | CPU-bound tasks (state R) | 0–8 | 2 |
| `ioTasks` | tasks waiting for disk I/O (state D) | 0–8 | 0 |
| `runFor` | the workload runs from 0 to `runFor`, in s | 5–1800, step 5 | 65 |
| `t` | the cursor, in s | 0–1800, step 5 | 65 |

## Rules

1. **What is counted.** The load counts tasks in state R (running or runnable) **plus** tasks in state D
   (uninterruptible, waiting for disk I/O), averaged over 1, 5 and 15 minutes. UL ch08 "Nadzor opterećenja",
   footnote ch8-loadavg (proc_loadavg(5): "the number of jobs in the run queue (state R) or waiting for disk I/O
   (state D) averaged over 1, 5, and 15 minutes"). A sample counts n = `cpuTasks` + `ioTasks` while the workload
   runs, 0 after.
2. **Not normalised to the CPUs.** `cores` plays no part in the load numbers. Load 1 on one CPU = busy all the time;
   on four CPUs = idle 75 % of the time. UL ch08 "Nadzor opterećenja", footnote ch8-uptime (uptime(1)). The page
   prints `nproc` beside the numbers, the 1-minute value per core, and a capacity line at `cores` on the chart.
3. **The sample.** Every 5 s the kernel takes n = nr_running + nr_uninterruptible and updates each average as
   `load = load·e + n·(1 − e)` with e = 1884/2048, 2014/2048, 2037/2048 (≈ exp(−5/60), exp(−5/300), exp(−5/900)).
   Linux `include/linux/sched/loadavg.h`: FSHIFT 11, FIXED_1 2048, EXP_1 1884, EXP_5 2014, EXP_15 2037, LOAD_FREQ
   5·HZ + 1 (**checked** against `/usr/src/linux-headers-6.8.0-136/include/linux/sched/loadavg.h`, which also holds
   `calc_load()`: `newload = load·exp + active·(FIXED_1 − exp)`, rounded up when active ≥ load). The model uses the
   constants as fractions in floating point (no integer rounding) and rounds to two decimals only for display, as
   `uptime` prints them. Samples are at 5, 10, 15 … s; there is none at 0, so at t = 0 all three are 0.00.
   (LOAD_FREQ is 5 s + 1 tick; the model uses exactly 5 s. `kernel/sched/loadavg.c` (NO_HZ folding) is out of
   scope; not opened.)
4. **%CPU.** While the workload runs, %CPU = min(`cpuTasks`, `cores`) / `cores`. CPU tasks above `cores` wait in the
   run queue: no CPU, but they count in the load. D-state tasks add 0 %CPU; idle cores with a D task waiting show as
   iowait: wa = min(`ioTasks`, idle cores) / `cores` (a display simplification: which CPU the kernel charges iowait
   to is out of scope). The rest is idle.
5. **Edge cases and tie-breaks.**
   - `cores` ≥ `cpuTasks` → empty run queue.
   - `cpuTasks = ioTasks = 0` → all three stay 0.00 at every t; %CPU 0.
   - The workload is running at the cursor while `t` ≤ `runFor` (the task's "t < runFor" plus the tie at t =
     `runFor`: the scene at t = 65 with runFor 65 still shows the tasks, as preset 1's %CPU 100 needs).
   - A sample at exactly `runFor` still counts the tasks; the stop takes effect after that sample.
   - `t` off the 5 s grid uses the last sample at or before `t`.
   - Changing `cores` changes %CPU, the run queue and the cores drawn, never the load numbers.
   - Cores take the CPU tasks in order: task 1 on core 0, … Task numbers: CPU tasks 1…c, I/O tasks c + 1…c + io.
6. **Reading the three numbers.** Compared as printed: l1 > l5 > l15 ("falling left to right", 1.33 → 0.40 → 0.14)
   is load that just started; l1 < l5 < l15 ("rising") is load that was higher earlier and is easing. UL ch08
   "Nadzor opterećenja".

## Presets (checked with `sim.js`, `node -e` before coding; now in `sim.test.js`)

| # | id | params | expected | model | source |
|---|---|---|---|---|---|
| 1 | `book-yes` | cores 2, cpu 2, io 0, runFor 65, t 65 | 1.32, 0.39, 0.14; %CPU 100 | 1.3242, 0.3912, 0.1352 | UL ch08 (`yes > /dev/null & yes > /dev/null & sleep 65; uptime`): book 1.33, 0.40, 0.14; the ±0.01 is sample alignment and the shell's own tasks |
| 2 | `book-top-later` | the same, t 80 | 1.03, 0.37, 0.13 | 1.0309, 0.3720, 0.1331 | UL ch08 Primjer 2 (`top`, 14 s later, a separate session): 1.04, 0.38, 0.13 |
| 3 | `one-core-queue` | cores 1, cpu 2, runFor 600, t 600 | 2.00, 1.73, 0.95; %CPU 100, one task waiting | 1.9999, 1.7317, 0.9520 | derived |
| 4 | `io-bound` | cores 4, cpu 0, io 4, runFor 600, t 600 | 4.00, 3.46, 1.90; %CPU 0, wa 100 % | 3.9998, 3.4635, 1.9040 | derived |
| 5 | `easing` | cores 4, cpu 4, runFor 600, t 900 | 0.03, 1.27, 1.38 (rising) | 0.0267, 1.2685, 1.3783 | derived |

Closed forms (a constant n from 0 to T samples): l_k = n·(1 − e_k^T). Preset 1: 13 samples (5…65 s),
2·(1 − 0.91992^13) = 1.3242. Preset 2: three more samples with n = 0, 1.3242·0.91992^3 = 1.0309.

## Scene

- One machine: a row of `cores` core boxes (busy = filled, with the task's number and R; idle = hollow, dashed).
- The run queue lane: CPU tasks waiting for a core (outlined chips, R).
- The disk lane: D tasks (hatched chips, D) next to a disk.
- The `uptime` and `nproc` lines (two decimals, a decimal point: program output), the 1-minute load per core, the
  sample n = R + D at the cursor, a %CPU bar (busy, iowait hatched, idle).
- The chart: l1, l5, l15 (solid, dashed, dotted) against time, 0–5 min while `t` and `runFor` are both ≤ 5 min, else
  0–30 min; the part after the cursor is drawn faint; a horizontal line at `cores` ("capacity"); the cursor at `t`;
  the workload's stop marked on the axis.
- "Changed": the printed load numbers that moved since the last param change, and the cores whose busy/idle state
  flipped (a core that did not exist before counts as flipped).

## Captions (two parts: reading, then what is happening)

Reading (rule 2), first that applies; l1 is the printed 1-minute value (thresholds compare printed values):
- `cFirst`: the tasks run but t < 5 s, so no sample yet: all three are still 0.00 (no second part).
- `cZero`: all three print 0.00 and there is no workload (no second part).
- `cFaded`: all three print 0.00 after the workload stopped: the averages have decayed (no second part).
- `cLag`: at the cursor n > cores while l1 ≤ cores: the average lags behind a queue that is there (not "within
  capacity").
- `cDisk`: at the cursor only D tasks and every core idle: the number counts disk waits, not a queue for a core
  (no second part; the "on 1 core it would be a queue longer than capacity" reading does not apply).
- `cUnderOne`: 1 < l1 ≤ cores: the task's caption ("Load 1.32 on 2 cores: the queue never exceeded what the machine
  runs in parallel. On 1 core the same number would mean a queue longer than capacity.").
- `cUnder`: l1 ≤ 1 (and l1 ≤ cores): within capacity.
- `cOver`: l1 > cores: on average more tasks than the cores run at once.

At the cursor (rules 4–6), first that applies:
- stopped (t > runFor), had a workload: `bRising` when the series rises, else `bStopped`.
- `bQueue`: CPU tasks wait in the run queue (wins over D when both).
- `bDisk`: D tasks beside running CPU tasks count but add no %CPU.
- `bFalling`: the series falls (load that just started).
- `bSteady`: otherwise (the three approach n).

## Out of scope

PSI (`/proc/pressure`), per-cgroup load, NO_HZ idle corrections, the 4th and 5th fields of `/proc/loadavg` (named in
the explanation only), the USE method (NLA T41), per-CPU iowait accounting.
