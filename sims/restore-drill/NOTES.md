<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# restore-drill: notes

New stepper (task `docs/tasks/w3/restore-drill.md`, catalogue `sto-restore-drill`, overlap §5.3). No kit view: the
scene is a checks table drawn in the page. Rules and expected numbers: `SPEC.md`.

## Decisions

- **One table, archives as its columns.** The task's middle row of archives and the right checks table are merged:
  each archive (date, file, size bar, size) heads its column, so a verdict sits under the archive it is about.
  The dashboard is a row of lights above the checks and a headline light for the newest job.
- **Every archive is restored** in the restore step (the task's state has one `restored` list). With one restore
  the checkpoint run would restore the newest week (fine) and miss the task's "restore of 10-11: unusable";
  restoring each archive into its own empty directory keeps the table complete. The left source column shows the
  restore of the archive in focus: the first whose restore test fails, else the newest.
- **One cell, two forms.** With one archive a cell shows the literal output (`izlazni status: 2`, `Only in …:
  .postavke`); with several, the symbol and a short value (the size is in the column header).
- **The job's log** is a box under the table: during the run it shows what the job printed that night, titled
  "nobody reads it"; the caption counts its error lines when the dashboard is green. In the dotfile and truncated
  runs it is empty, which is the point (rule 3). Restore and compare show the commands' outputs, the reveal the
  night's log again (the checkpoint's "Disk quota exceeded" before "nightly OK").
- **`reliedOn` is a single select**; the model takes a list (rule 7 tie-break tested). gzip -t is in the table
  but not offered (task's list). Every param resets to step 0.
- **"New in this step"** on cells: a thick ink outline and a highlighter band on the left, so the verdict's colour
  stays visible (a full yellow fill hid pass/fail in the reveal step).
- **Repeat variant** works for all four tar faults (the task names it for the dotfile only; preset
  `ul-dotfile-nights`). Nights are 2026-09-05 … 08 (derived; the book has one run on 5 September).
- **Checkpoint scenario:** the version-control product is not named (COMMON §1): "the version-control server", log
  lines without the product name, its directory `/p4` shown as `/vcs`, file names as in the student log. The log
  records no exit status, so the status row is labelled "log line" (`nightly OK`) in this scenario and the select
  option reads "exit status or log line". The 1.2 MB checkpoint still holds the start of `db.*`: the source column
  marks it "partial", the restore test fails as `short`. The log lines of 09-13 … 09-27 are derived (the log starts
  on 09-28). tar -t / tar -d do not apply to a
  checkpoint (—, no verdict, never green). `weeks` keeps the last N of the eight weeks, so 10-11 is always in the
  run, and its size is still compared with 10-04 when that week is outside the window.
- **Sizes:** bytes below 10 000 (as the book prints them), decimal MB/GB with one decimal otherwise; the dotfile
  archive's size is not in the book, so its header shows the member count and size has no verdict.
- **`related`:** `backup-diff-incr`, `lnx-exit-status` (the pipefail case, catalogue §5.3). `related` takes ids,
  not presets; the explanation names the exit-status simulator in words. One `entries` line for `dr-checkpoint`.
- **Status `ready`**: set last, after the gate and the review.

## Deviations from the task

- `restored` per archive (above), and `fault` as one id plus the jobs' own fields instead of `{kind, fromJob}`.
- Rule 7's multi-check dashboard exists in the model only; the page offers one relied-on check.
- Derived values (SPEC rules 4, 5, 8): `tar -d` and the restore on the cut archive fail with 2; `tar -d` and
  `gzip -t` pass on the dotfile, named and empty archives; `gzip -t` passes on the short checkpoint *(check)*; the
  size threshold (less than half the previous) and a checkpoint's expected size (mean of its neighbours,
  ≈ 132.2 GB) are the builder's.

## Sources

- UL `book/chapters/23-odrzavanje-sustava.md`, „Sigurnosne kopije i oporavak → Što treba znati" (`named-puna.tar.gz`
  1671 B, `tar -tvzf` 2 members, `tar -dzf` no lines, job status 2; definitions „sigurnosna kopija", „proba
  oporavka"), „Tri načina da kopija izgleda dobro" (kvar 1: 16 entries, 15 names, 19 members, `Only in …: .postavke`;
  kvar 2: 1671 → 1471 B, gzip -t 1, tar -t both members then status 2; kvar 3: 45 B, two Permission denied, status
  2, no lines), Primjer 1 and 2; figure `provjera-arhive-i-proba-oporavka.svg` (not opened; the text is enough).
- DR estate `student/logs/p4-commit/p4-nightly.log` (2026-10-11 02:16:40 Disk quota exceeded, 02:58:12 nightly OK),
  `student/configs/colo/p4-commit/checkpoints-ls.txt` (eight checkpoints, 1,214,000 B on 10-11). The crontab's
  missing verify script and `hqc/vzdump-history.txt` were not used (one concept). No `instructor/` material.

## Term pairs

Used from the glossary: backup, restore test, exit status, recovery point. Not in the glossary, written out in both
tables: archive — arhiva; scope / content (of a backup) — opseg / sadržaj (UL ch23); dashboard — nadzor;
checkpoint (of a database) — kontrolna točka (the glossary's *checkpoint* is ossimulator's, same words).

## Shared requests

None. `kit/` and `models/` unchanged; nothing taken from `backup-diff-incr`'s model.

## Tags

Topic `storage`, tag `backup`, level `intro` (all in `tags.json`).

## Checks

- `node --test sims/restore-drill/sim.test.js`: 27 tests pass. Every rule broken once (15 mutants: list fails on a
  missing file, status ignored, glob keeps the dot-file, gzip misses the cut, empty listing fails, restore ignores
  missing files, restore ignores the cut, grey counts as green, a fail not beating a missing verdict, threshold `<=`,
  previous size from the window, first archive gets a size verdict, steps − 1, focus always newest, a job step runs
  every check): all killed.
- `npm run gate -- restore-drill`: pass (63/63 browser checks) with `status: "ready"`; `npm test` (6155) and
  `npm run check` pass. Screenshots looked at: the gate's 1920×1080 light,
  dark, grayscale, help, panel hidden and 375×812 in both languages, plus scripted states: every preset's end,
  `ul-named` 1, `ul-dotfile` 2 and 3 (hr, en), `dr-checkpoint` 5 (light, dark) and 11 (en), the four-night end,
  grayscale `ul-named` 4, phone `dr-checkpoint` 11 (the table scrolls sideways inside its box, the page does not).

## Review

A fresh reviewer read the diff against `SPEC.md`, the task and the sources. Their reference model, written from SPEC
and the sources alone, matched `sim.js` on every step of all 300 combinations of fault × reliedOn × repeat × weeks
(verdicts, dashboards, focus, fresh, restored, step counts). Of their 38 mutants, the tests first killed 9: they
checked verdicts but not the fields the page writes or the step bookkeeping. Four tests were added (a per-step
phase/cursor/focus/fresh trace, the full cell objects, the scenario data, the four-night size row); now every
mutant is killed except four equivalent ones (the weeks window rewritten, partial/eof order swapped, a copied
`reliedOn`, directory children swapped keeping 19 members).

Fixed from the review:
- The explanation said a scope fault is seen only by the exit status; the dot-file fault has status 0. It now
  separates a scope fault tar saw (status) from one it never saw (only the restore test).
- "Svaki drugi tjedan / Every other week" read as alternate weeks: now „Svi ostali tjedni" / "All the other weeks".
- The checkpoint's status was presented as sourced; SPEC rule 2 now marks it derived, and the row is the log line.
- „od 3 stavki": `capRestore` is plural on the number of items.
- The short checkpoint showed `db.*` as missing while the restore said 1.2 MB came back: now "partial".
- `/p4` paths renamed to `/vcs`; derived log lines of the first three weeks noted.
- `sim.json` entry: "one week is empty" → "one week is 1.2 MB".
- "jednom / once" with four nights: now "once, when the job ended".
- Croatian closing quotes ”.

## Time

Start 2026-11-05 05:40 CET, done 06:05 CET (about 25 minutes, including the review).
