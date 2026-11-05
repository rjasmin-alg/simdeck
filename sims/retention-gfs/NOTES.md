<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# retention-gfs: notes

Task `docs/tasks/w3/retention-gfs.md` (wave 3, explorer, S, P2). Rules and numbers: `SPEC.md`.

## Decisions

- **Own calendar, not kit view K3.** The task allows it ("explorer, draw own strip and say so"): a year of days is
  not a block grid. The calendar is an HTML grid (ISO weeks as columns, Monday … Sunday as rows), split into as many
  blocks as give the largest cells: two blocks of 27 weeks at 1920×1080, five narrower ones on a phone. Cell sizes
  are computed from the box; text stays at `--fs-sm` (≥ 16 px).
- **Marks carry the rule three ways**: shape (square daily, circle weekly, diamond monthly, star yearly, triangle
  newest), letter (hr D/T/M/G/Z, en D/W/M/Y/L, from `strings.js`) and colour (`--c1` … `--c5`). Pruned backups are
  faded dashed outlines, failed nights a cross, days after today blank with a dotted border, today an ink outline,
  the fault's day (verdict) a dashed `--danger` outline. Months are tinted in turn and labelled.
- **One run start, a "run the year to" slider.** The run always starts on 1 Jan 2026 and `day` (1–365) sets today.
  Scrubbing it shows the prune working night by night (points appear, slide, vanish).
- **Keep-all on an empty policy** (SPEC rule 7): with every count 0 nothing is pruned, the caption says the space only
  grows (UL ch23's definition of retention says the same). The task's params allow all zeros and say nothing about it.
- **The verdict** treats the fault as appearing during the working day after that night's 01:40 job, so a point
  exactly N days old is clean. It shows where the restore goes back to, or "no clean point".
- **"Changed" marks only follow a change of one param.** Loading a preset changes several at once and would mark
  dozens of cells against the defaults; it marks nothing. The stat cards whose value changed are highlighted too.
- **Caption when a rule keeps fewer than asked**, the task's "7 + 4 + 10" note, shown in the plain state, with the
  true reason: "The monthly rule keeps only 10 of 12: the run so far has had 12 months, and 2 of them are covered by
  the rules before it", or, early in the run, "…has had only 3 months". The model returns the numbers (`short`).
- **Dates** carry no year, except one outside 2026 (a fault noticed more days back than the run is long).
- **Panel fit at 1920×1080**: the five counts and the job's outcome sit two to a row (the pattern of
  `sims/backup-window/`); the outcome choice reads "Jobs fail from: never | 14 Sep".
- **Legend**: nine entries (five rules, the keep-all mark, pruned, failed, changed).
- **No model reused.** `backup-diff-incr` is not in `models/` and the task says only its day/set vocabulary is
  reused, so nothing is copied. `prune` and `run` are pure over ISO date strings and promotable as they are.
- No `Date` in the model: the calendar is integer arithmetic (days since 1970-01-01, ISO weekday, week start).

## Deviations from the task

- **Presets 4 and 5 run from 1 Jan, not 1 Aug.** With 7 daily + 4 weekly and no monthly or yearly rule, the kept set
  on 13 Sep is the same from either start (a test runs both). The calendar shows the earlier months as pruned.
- **Rule 3's wording.** The task says each option considers only backups "older than everything already kept"; the
  model implements the vendor's actual walk (skip what is marked, skip periods already covered, stop at the count),
  which gives the task's numbers in all five presets and agrees with an independent script on 40 random runs.
- **Captions.** The task's hr caption ("7 dnevnih i 4 tjedne kopije: 11 točaka oporavka…, najstarija 32 dana. Greška
  primijećena nakon šest tjedana nema se gdje vratiti.") is generated from the state instead of fixed: "7 dnevnih i 4
  tjedne: 11 točaka oporavka, najstarija stara 32 dana. … Greška primijećena nakon 42 dana nema se kamo vratiti: …".
  The en failing caption is the task's, with "Nobody is told." added.
- **Legend**: "newest (L/Z)" and "all (A/S)" entries added (keep-last and the empty policy), which the task's legend lacks. No legend
  entry for the fault's day or today: the line above the calendar shows both swatches with their dates.
- **Related**: `alert-to-nobody` (named in preset 5) does not exist yet, so `sim.json` `related` lists only
  `backup-diff-incr` and `restore-drill`.

## Checks

- Numbers first checked with an independent Python script reproducing the vendor's prune walk (all five presets as in
  the task), then the JS model compared with it on 40 random parameter sets: 0 differences.
- `sim.test.js`: 29 tests, tie-breaks first. Each rule was broken once (order reversed, week starting Sunday,
  covered periods counted, failed nights still adding, earlier of two backups kept, marked backups retaken,
  non-progressive prune, empty policy deleting, verdict and gap tie-breaks): each made at least one test fail.
  Two mutations are equivalent by construction and cannot fail a test: `break` vs `continue` when an option reaches
  its count (periods are contiguous in time, so nothing later belongs to a kept period), and pruning again on a
  failed night (a count-based prune of the same set changes nothing; what rule 4 shows is that nothing is added).
- **Fresh review** (a separate agent, SPEC.md against the code, 46 mutants): the model matched SPEC and every preset
  number. It found six surviving mutants that were real gaps (verdict taking the oldest clean point, coverage from
  only the previous option, a multi-param change counted as one, caption order failing vs empty policy,
  `detectAfter` 1, param limits), now each covered by a test and re-checked; two page bugs (a 2025 fault date shown
  as a 2026 date; the "fewer than asked" caption giving the wrong reason early in the run, and "only 1 are"), and no
  legend entry for the keep-all mark: all fixed. Its other survivors were equivalent mutants.
- `npm run gate -- retention-gfs`: pass (48/48 browser checks). Screenshots reviewed: 1920×1080 light, dark,
  grayscale and 375×812 in both languages, plus presets 1, 3, 5 and a one-param change, rendered separately.

## Sources

- UL ch23 (`~/projects/uvod-u-linux/book/chapters/23-odrzavanje-sustava.md`): definitions of retention (retencija) and
  recovery point (točka oporavka); Primjer 6, the two questions (spacing, how far back).
- DR estate, `student/configs/hq/hq-nas02/shares-and-dumps.txt` (7 daily + 4 weekly, 16 Aug … 13 Sep, "prune runs
  only after a successful job") and `student/logs/hqc/vzdump-history.txt` (jobs failing from 14 Sep to 1 Nov);
  scenario `student/scenarios/S8.md`. Only `student/` material was used.
- The vendor's backup-pruning documentation (keep-last/-daily/-weekly/-monthly/-yearly, processing order, periods
  already covered are skipped) and its prune simulator: the semantics as implemented. *(check)*: not re-read online
  in this session; rule 7 (empty policy keeps everything) and rule 6's 25 Jan are from that semantics as remembered and
  reproduced by script, worth one look at the vendor's prune simulator.
- No product, tool or command is named on the page.

## Term pairs

In the glossary: *retention* — retencija, *recovery point* — točka oporavka, *restore test* — proba oporavka (UL).
Missing, written out in both tables:

- grandfather-father-son (GFS) — djed-otac-sin *(check)*
- prune — orezivanje *(check)*
- daily / weekly / monthly / yearly copy — dnevna / tjedna / mjesečna / godišnja kopija

## Shared requests

None.

## Time

Start 2026-11-05 06:09 CET, done 06:33 CET (one session, including the fresh review and its fixes).
