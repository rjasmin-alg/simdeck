<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# backup-window: notes

New explorer (task `docs/tasks/w3/backup-window.md`, catalogue `sto-backup-window` §4.6). Rules and expected numbers:
`SPEC.md`.

## Decisions

- **Whole seconds.** Every transfer is rounded to the second once, and all comparisons (fits, nights, faster plan)
  are on integers, so the task's tie-breaks are exact and testable.
- **Window position.** The task gives only the window's length; it is centred on 01:00 (12 h = 19:00–07:00, the
  task's example; 8 h = 21:00–05:00; 14 h = 18:00–08:00). The clock bar runs noon to noon so the window is one band.
- **Seeding is windowed.** Over the link the full copy runs only inside the window (rule 4), so "nights to seed" is
  ⌈full / window⌉ and the link's elapsed time counts 24 h for every night but the last. The tile and the caption also
  give the transfer time itself (39.6 days for `brk-uplink`, as the task's caption says).
- **The queue (rule 4) is quantified.** The task says changes pile up during seeding and that the queue never drains
  when `incrH > windowH`. The page also says how long it takes to drain: one day of changes per day the seeding
  took, drained by what each later night leaves after its own change. This shows that seeding `brk-uplink` over the
  link means 80 nights plus 306 nights of catch-up, while the truck plan catches up in 12 nights.
- **Own tie-break:** a nightly change exactly as long as the window *fits* (rule 3: ≤) but leaves nothing for the
  queue, so a backlog never drains (rule 4 counts it as "never catches up", growth 0 a night).
- **`seedBy` param (link / truck).** The task's preset `truck` is "preset 2 by disk", but its params list has no
  switch, so presets 2 and 3 would have been identical. `seedBy` chooses the plan: the truck's time feeds the seeding
  tile and the queue, and the link's full-copy rows are dimmed and marked "by link; not chosen". With the link chosen,
  the truck lane still appears past three nights (rule 7) as the comparison the task asks for.
- **Faster-plan verdict.** The seeding tile shows ✓ when the chosen plan is no slower than the other one (rule 6:
  equal → link), else ✗ with the other plan's time. For `hq-to-cloud` the truck is faster (61.4 h vs 83.6 h from the
  first night's start, because the link only uses the 12-h windows); the page shows that without comment.
- **The truck lane's local copy and drive sliders** appear only with the truck lane.
- **Changed marks** follow param changes, as in `lnx-thin-overcommit`: the page keeps the previous state and marks
  each tile whose verdict flipped (`flipped()` in `sim.js`, tested).
- **Drawing.** The time bars are drawn in the page, not with the K3 block grid: K3 draws discrete equal cells, and
  these bars are continuous and positioned on a clock (a window that starts at 19:00, 0.48 h of transfer). No shared
  request: it is a different view, not a missing K3 feature.
- **Efficiency default 0.8** as the task says (derived; *(check)* against a measured run). The presets set 1.0 so
  their times match the task's numbers.
- **Concepts, not tools:** no tool or product is named. Site names stay generic on the page ("HQ", "branch"); the
  estate files are only in Sources.
- **Model is promotable:** `transferS`, `changedBytes`, `seedNights`, `linkElapsedS`, `truckParts`, `faster`,
  `catchUp` are pure functions over numbers; no words. Nothing from `backup-diff-incr`'s model was needed (it models
  which blocks a set stores, not transfer time), so nothing was copied.

## Deviations from the task

- Added the `seedBy` param (above).
- Added the catch-up time of the queue (rule 4 quantified) and the "queued changes" tile.
- The task's captions are used as preset hints (`brk-uplink` en, `truck` hr, and their translations); the live
  caption is built from the state.
- The full copy's rows show night 1, "… n more nights" and the last night when seeding needs more than three nights.

## Sources

- Task numbers and rules: `docs/tasks/w3/backup-window.md`.
- DR estate, student side (`~/projects/dr-lecture-estate/student/`): `handbook/sites.md` (HQ internet 1000/1000,
  Brackenridge 300/50, Harrow Street 80/20 Mbit/s), `configs/hq/hq-nas02/shares-and-dumps.txt` (fs-mirror 21.4 TB,
  vzdump 10.4 TB). `handbook/constraints.md` and `scenarios/S8.md` (costs) not used: costs are out of scope.
- NLA `meta/toc.md` T28 (offsite, „izmještanje"); chapters not written yet.
- UL ch23 for full / incremental (glossary: potpuna / prirasna kopija).
- Numbers checked before the page with `node -e` over `compute` for every preset; all match the task (47.6 h, 0.48 h,
  39.6 days, 9.5 h, 2 % → 19.0 h, 29.7 h, 2.6 days, 23.1 h, 11.1 h).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| backup window | prozor za kopiranje *(check)* |
| offsite copy | izmještena kopija (NLA T28 „izmještanje") |
| seeding | početno punjenje *(check)* |
| bandwidth | propusnost (URM) |
| change rate | stopa promjene |

Used from the glossary: full backup, incremental backup.

## Shared requests

None. `kit/` and `models/` unchanged.

## Review

A fresh reviewer read the code against `SPEC.md` and the task. Their own reference model (exact rational arithmetic)
matched `compute` on 5 890 500 parameter sets; the only differences are float half-ties in a transfer (x.5 s rounding
one way or the other, 1 s), which flip no verdict over every slider value. They ran 35 mutants: 18 killed, 7
equivalent, 10 survived; tests now kill all 10 (whole-day truck time, round vs ceil/floor in transfers and the truck
copy, a nightly change of 0 s, caption order with the truck and an overflow, the window's position, efficiency in the
1-TB time, exactly three nights).

Defects they found, all fixed:
- A nightly change exactly as long as the window showed "the queue grows < 1 s every night"; it now says the queue
  never shrinks.
- The seeding tile said "faster by truck" (and the changed mark flipped on it) while the truck lane was hidden; the
  verdict now shows only with the lane, and `best` counts for the changed mark only then.
- With equal times and the truck chosen, the tile said "faster by link"; it now needs the plan to be strictly slower.
- A catch-up of millions of nights drew hundreds of axis ticks; the step now grows without limit and big counts are
  grouped (3 959 500).
- Croatian "umjesto 1 noć" (needs the genitive): the truck caption now compares with the link's time, the nights in
  parentheses.

Wording, also fixed: an overflow longer than the rest of the day has its own caption ("longer than a whole day");
"+0 nights" reads "none"; the `brk-uplink` hint says "manje od pola sata" like the English; a Croatian day count
keeps its decimal ("21,0 dana", not "21 dana"); English "in a 11 h window" became "at 11 h a night".

## Checks

- `node --test sims/backup-window/sim.test.js`: 27 tests. Every rule broken once (16 mutants before the review: the rule 6, 3 and 4
  tie-breaks, bits vs bytes, efficiency, the change share, the link's elapsed time, the drain rate, which plan feeds
  the queue, the truck's second copy, the lane threshold and the forced lane, the never-drains caption note, URL link
  speeds): all killed.
- `npm run gate -- backup-window`: pass. Screenshots looked at: the gate's 1920×1080 light, dark, grayscale and
  375×812 in both languages; extra, every preset and three edge cases (100 TB at 20 Mbit/s with a 4 h window, 0.5 TB
  at 10 Gbit/s, the link/truck tie) in hr and en at 1920×1080 and 375×812, measured for content past the stage; the
  changed marks after a param change; after the review also a catch-up of millions of nights, a change exactly as
  long as the window, an overflow longer than a day and a 0-s change. On the phone a long overflow label is clipped
  inside its box (the tile gives the number); the page does not scroll sideways.

## Time

Start 2026-11-05 02:46, done 03:10 (about 24 minutes, the review included; the reviewer ran in parallel).
