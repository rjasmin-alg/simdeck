<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-cgroups: notes

New explorer (task `docs/tasks/w3/lnx-cgroups.md`, catalogue `lnx-cgroups`, §5.17 containers). No kit view fits (K3
block grid is cells, not proportional bars with limit lines), so the page draws its own HTML bars. Rules and expected
numbers: `SPEC.md`.

## Decisions

- **Scene from `lnx-namespaces`, reduced** (task "Reuse"): only the drawing style is reused, the host as an ink frame
  with a thick top and the containers as boxes on it; no namespace code. `lnx-namespaces` has no model in `models/`
  and nothing of its model is used, so nothing was copied.
- **Pure model, promotable.** `splitCpu`, `memoryOutcome`, `oomOrder`, `badness`, `cpuMax`, `sharesToWeight`,
  `engineFiles` take plain data and hold no strings. `compute(params)` builds the page's scene.
- **Processes per group.** The task's params give each group one memory demand; preset 4 needs "200 MB and 400 MB" from
  600, so A and B split the demand 1/3 : 2/3 (a small and a large process). C splits it in halves, two equal workers,
  so rule 6's tie-break can be reached from the page (`memC` ≥ 550 with `memory.max` 512M). `oom_score_adj` is 0 on the
  page; the model and the tests take any value.
- **Host**: 16 GB RAM with 512 MB of its own (kernel and host processes), so preset 4 shows "15.0 GB free" as the task's
  caption says. Host-wide OOM cannot happen (3 × 2000 MB < 15.5 GB) and is out of scope.
- **Throttled** (rule 3) means the cap, not the weights, is what stops the group: demand above `cpu.max` and the group
  gets its whole cap. A group held below its cap by contention is shown as "wanted, not given" but not throttled.
- **`memory.high` above `memory.max`** is not drawn (it cannot matter); the file still shows the value.
- **One panel for three groups.** 19 per-group sliders do not fit: a choice "Uređujem / Editing" A/B/C shows the
  selected group's six controls (`visible`), and that group's box gets a thicker frame. Presets set it to their group.
- **Panel fit at 1920×1080** (it was 380 px too tall): presets in two columns with short labels (the long names are in
  the hints and in `sim.json` entries), tighter sliders and gaps, the three choices on one line with their label, the
  `oomGroup` toggle labelled just `memory.oom.group`.
- **Captions** speak about the group and half (CPU or memory) whose param changed last (`nextFocus`, as in
  `lnx-systemd-ordering`); a preset speaks for its own. Both task captions are used: `cContention` gives the ratio as
  a number ("3 puta" / "3 times") so it holds for any weights; `cOom` also names the victim.
- **"Changed"** marks a group's CPU or memory meter when its outcome (allocation, throttling, use, limits, kills)
  changed with the last edit, and the host strips when any did (task Legend).
- **Files as the kernel reads them back**: `cpu.max` `max 100000`; `memory.high` and `memory.max` in bytes
  (`536870912`) or `max`. The panel's choices use the written form (`512M`), which the kernel accepts.
- **Killed groups stop using CPU**: when every process of a group is killed (`memory.oom.group`, or a limit both
  processes exceed), its CPU demand is 0 and the meter says "every process killed".
- **`oom_score_adj` −1000** is never a victim (model and tests; the page's processes all have 0).
- **Engine mapping (rule 7)** lives in `engineFiles` (tested) and in the explanation; the page does not name an
  engine or its flags ("sustav za kontejnere" / "the container engine"). `systemd-run -p MemoryMax=` is named, as the
  task asks; systemd is NLA course material.
- **Tags**: topic `linux-admin`, tag `containers`, level `advanced` (as the task says; all in `tags.json`).
  `related`: `lnx-namespaces`. Entries: `weights-idle`, `high-throttle`, `oom-inside` (the three misconceptions).

## Deviations from the task

- **`memX` range 0–2000 step 50** (task: 0–2048 step 32): the presets' 450 and 600 MB are not on a 32 MB grid. 50 MB
  steps hit every preset number and move quickly with the arrow keys.
- **`weightB` defaults to 300**: the defaults are preset 1, as the task marks it "(default)".
- **`memory.oom.group` applies to all three groups** (the task names one toggle, `oomGroup`).
- **Short preset labels** (panel fit, above).

## Sources

See `SPEC.md` (Sources). Read locally: systemd.resource-control(5), cgroups(7) (systemd 255, Ubuntu 24.04). From
memory, not re-read here (no kernel source on this machine): the cgroup-v2 document, `mm/oom_kill.c`, the shares →
weight conversion. *(check all three.)*

- *(check)* **Rule 6 tie-break.** The task says the kernel picks "the first found in the scan". As I remember
  `oom_evaluate_task`, a task is skipped only when its points are *lower* than the chosen one's, so on equal points the
  later-scanned task wins. The model keeps the task's "lower PID dies" as its total order; ties in pages are rare in
  practice. Flagged for the owner.
- *(check)* **Shares → weight.** The runtimes changed the conversion in 2025 (quadratic in log2, 1024 → 100); the
  older linear one gives 1024 → 39. The explanation says 1024 → 100.
- *(check: idealised)* **Water-filling** is the long-run average of the fair scheduler, not an instant split.

## Term pairs

From the glossary: *process*, *scheduler* (raspoređivač), *hard limit* (tvrdo ograničenje, UL ch12), *kernel*, *swap
area* (odlagalište memorije, UL ch12). Missing from `kit/glossary.js`, written out in both tables:

| en | hr |
|---|---|
| control group (cgroup) | kontrolna grupa *(check: NLA T11 writes `cgroups`)* |
| container | kontejner (as in `lnx-namespaces`) |
| OOM killer | *OOM killer* (ubojica pri nedostatku memorije) *(check: no book term; the task's wording)* |
| throttled (CPU) | prigušena |
| weight (cpu.weight) | težina |
| the container engine | sustav za kontejnere *(check)* |

## Shared requests

- **Glossary:** add the term pairs above with `"src": "simdeck"`.
- **Kit (optional):** `.sd-ctl { display: flex }` beats `[hidden]` (the page adds `.sd-ctl[hidden] { display: none }`,
  as several sims do); a kit fix would let `visible` work everywhere.

## Checks

- Numbers printed from the model before the page was written and compared with the task's presets: all equal
  (SPEC.md table).
- **Mutations** (29, one at a time with a script): tie-break reversed or dropped, weights ignored, no redistribution,
  want ignoring the cap, throttled without the allocation check or for any cap, OOM at equal use, `memory.high`
  killing, one kill only, the smallest killed, `oom_score_adj` ignored, `oomGroup` ignored, `overHigh` on demand or
  `>=`, the `cpu.max` period, the linear shares formula, MB instead of MiB, the 1/3 split, the host's own RAM, the
  `memory.high` file, `changed` ignoring kills, focus ignoring presets or the group picker, the tie caption, the
  ratio inverted, the nominal share, `cThrottledIdle` always. Two survived at first (weights ignored only in the
  "satisfied" test, `changed` ignoring kills): tests added, both fail now. One survives and is equivalent: letting a
  group that wants nothing into the fill (it is satisfied at once and takes 0).
- **Mutations after the review** (33, the list above plus the review's: the kill loop's `<`, `ceil` → `round`, unset
  shares, the shares clamp, `oom_score_adj` −1000 in both kill paths, a killed group keeping its CPU, `changed` without
  `memory.max` or the cap, the `cThrottledIdle` threshold, the tie caption with two dead, `cAlone` and `cCpuNone` order):
  none survives. The output clamp of `sharesToWeight` was redundant with the input clamp and was removed.
- Browser: every preset in hr and en at 1920×1080, the `high-throttle` preset raised to 600 MB, the tie in C, the phone
  at 375 px. No console errors.
- **Fresh review** (a separate agent read the task, SPEC, model, tests, strings and page, swept ~21k param states and
  ran its own mutations; water-filling, throttling, `memory.high`, the victim choice, the badness formula and the
  shares conversion agreed with its reading of the sources). Fixed from it: a fully killed group still used CPU; a
  group with CPU but no memory shown as "idle"; the tie caption presenting lower-PID as kernel behaviour, and used
  when both processes died; the memory files not in bytes; `cSplit` for a single wanting group (now `cAlone`) and for
  a focus group that wants nothing (now `cCpuNone` first, `cCpuNoneIdle` when cores are idle); CPU scale labels
  for 5 or 7 cores; hr "jezgra" (core) used for the kernel (now "jezgra sustava"); the `memX` deviation missing from
  SPEC; `oom_score_adj` −1000. Tests added for its surviving mutants: the kill loop's `<=`, `ceil` and the clamps in
  `sharesToWeight`, `cThrottledIdle` with little idle, `changed` on a cap or limit move. Not changed (equivalent or
  below what a test can see on this page): water-fill epsilons, the `cWorkConserving` margin.
- Not checked: a real projector; the numbers against a real kernel (`cpu.stat`, an OOM in a test cgroup).

## Time

Start 2026-10-30 17:18, done 17:41 (CET), about 23 minutes, one session, including the fresh review.
