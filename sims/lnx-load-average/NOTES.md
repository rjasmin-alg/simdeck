<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-load-average: notes

New explorer (task `docs/tasks/w3/lnx-load-average.md`, catalogue `lnx-load-average`, §4.4; courses UL ch08, NLA
T41/T42). Rules and expected numbers: `SPEC.md`. No kit view: the machine, the readout and the chart are the page's
own HTML and pixel-drawn SVG (text at 1:1, redrawn on resize, as `sims/amdahl/` does).

## Decisions

- **Pure, promotable model.** `sampleLoad`, `activeAt`, `loadAt`, `seriesOf` hold no strings: the kernel's
  exponential average and the workload's sample count. `sceneAt` reads cores, queue and disk lane at the cursor;
  `initial(params)` puts it all together.
- **Samples at 5, 10, 15 … s, none at 0.** With that alignment the model gives the task's 1.32 · 0.39 · 0.14 at 65 s
  (13 samples); a sample at 0 would give 1.38 · 0.42 · 0.15. The book's 1.33 · 0.40 · 0.14 is within 0.01.
- **Floating point, as the task says.** The kernel's `calc_load()` works in 11-bit fixed point and rounds up while
  the load rises (`newload += FIXED_1 − 1` when active ≥ load); the model does not, so it can read 0.01 lower than a
  real machine on a rising load. Stated in SPEC.md rule 3.
- **Tie at t = runFor.** The task says "t < runFor means the workload is still running" and "samples at exactly runFor
  still count". The scene treats t = runFor as still running too (preset 1 expects %CPU 100 at t = runFor = 65).
- **The chart's span** is 0–5 min while both `t` and `runFor` are ≤ 5 min, else 0–30 min. On a fixed 30-minute axis the
  book's 65-second run is a 40-pixel sliver; the switch happens once while scrubbing `t` past 5 min.
- **The whole curve is drawn**: solid up to the cursor, faint after it (the workload is known, so the future of the
  averages is too). That shows the "easing" shape before the cursor gets there.
- **Capacity line** at y = `cores` on the chart, labelled "kapacitet: nproc"; with "minutni prosjek po jezgri" in the
  readout it carries rule 2 without dividing the load numbers themselves.
- **iowait**: idle cores with a D task waiting show as "čeka U/I" (wa) = min(io, idle cores) / cores. A display
  simplification (SPEC.md rule 4); per-CPU iowait accounting is out of scope.
- **Task numbers**: CPU tasks #1…#c, I/O tasks #c+1…; the chip shows the number and the state letter (R or D), so
  state is never carried by colour alone (grayscale screenshot checked: filled, outlined, hatched, dashed).
- **The uptime and nproc lines** are program output: decimal point, `translate="no"`, as `uptime` prints them. Prose
  and captions use the page's decimal mark (1,32 in Croatian). The commands are the subject (the book teaches reading
  `uptime` next to `nproc`), so they appear; no other tool is named.
- **Captions** have two parts: the reading of the 1-minute value against the cores (rule 2), then what is
  happening at the cursor (SPEC.md "Captions"). `cUnderOne` is the task's caption word for word, with the numbers
  filled in. It is used only where it holds: not at t < 5 s (`cFirst`: no sample yet), not while a queue is visible
  and the average still lags (`cLag`), and not for a D-only load with idle cores (`cDisk`), where "on 1 core it would
  be a queue longer than capacity" would teach the CPU-queue misconception the sim is about.
- **"Changed"**: the printed load values that moved with the last param change, and cores whose busy/idle state
  flipped (a core added by the cores slider counts as flipped).
- **Review** (fresh reviewer, this session, 52 mutations): fixed captions that contradicted the stage (t = 0 said
  "no task" while two ran; "never exceeded capacity" next to six queued tasks; a D-only load read as a CPU queue;
  "no task in the window" right after a stop), singular forms for one task, the D sentence no longer quotes the CPU
  tasks' %CPU, the readout line says "sada/now" (there is no sample at t = 0), a y-axis label, Croatian explanation
  grammar. Added tests for every surviving mutation (partial trend comparisons, printed vs raw thresholds and changed
  marks, queue before D, shrinking cores, an I/O-only workload's stop); the only survivor left is `peak >= 0`, now
  equivalent (an empty workload returns `cZero` first). Dropped the unused `sampleT` field.
- **Entries**: `one-core-queue` (the same number on fewer cores) and `io-bound` (high load with idle CPUs), the two
  misconceptions a course page would link to. `related`: `processes` (process states).
- **Tags**: topic `linux-admin`, tag `performance`, level `intro` (as the task says; all in `tags.json`).

## Deviations from the task

- **t = runFor counts as running at the cursor** (see above); the task's rule 5 wording says `t < runFor`.
- **Chart span 0–5 min / 0–30 min** instead of always 0–30 min (see above).
- **Preset `book-top-later`** is labelled "Isto, 15 s kasnije" / "The same, 15 s later" (t = 80 s; the book's 14 s,
  snapped to the 5 s grid, as the task says).

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/08-procesi.md`: "Nadzor opterećenja" (definition box, the
  `yes > /dev/null` run at 65 s: 1.33, 0.40, 0.14 on `nproc` 2; the reading of falling and rising series) and
  "Primjer 2 — je li ovom stroju teško?" (`top` 14 s later: 1.04, 0.38, 0.13). Footnotes ch8-loadavg
  (proc_loadavg(5)), ch8-loadavg-polja (fields 4 and 5), ch8-uptime (uptime(1)).
- Linux `include/linux/sched/loadavg.h`, **checked** in `/usr/src/linux-headers-6.8.0-136/`: FSHIFT 11, FIXED_1,
  LOAD_FREQ (5·HZ + 1), EXP_1 1884, EXP_5 2014, EXP_15 2037, and `calc_load()`.
- `kernel/sched/loadavg.c` *(check)*: not available offline (only headers are installed); its NO_HZ folding is out
  of scope.
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, T41 (USE method) and T42 (memory, I/O and
  scheduler); chapters not written yet.
- Presets 3–5 are derived; all five numbers were checked with a script before coding and are in `sim.test.js`.

## Unchecked *(check)*

- `kernel/sched/loadavg.c` (not opened).
- Croatian terms written out below, until the glossary has them.

## Term pairs (missing from `kit/glossary.js`; written out in both tables until added)

| en | hr | source |
|---|---|---|
| run queue | red za izvođenje | UL ch08 |
| runnable (state R) | stanje izvođenja `R` | task, UL ch08 |
| uninterruptible sleep (state D) | čekanje na ulaz/izlaz diska (stanje `D`) | task, UL ch08 |
| core | jezgra | UL ch08 |
| I/O | ulaz/izlaz (U/I) | UL ch08; glossary has "U/I" in compound terms |
| iowait | čekanje na U/I | this sim |

Used from the glossary: `load average` (opterećenje sustava).

## Shared requests

- None. A small line-chart view in the kit (axes, series with dash styles, a cursor, a horizontal reference line,
  text at 1:1) would serve this sim, `amdahl` and others that draw their own SVG charts; not needed for this task.

## Time

Start 17:56, done 18:13 (2026-11-03), 17 minutes.
