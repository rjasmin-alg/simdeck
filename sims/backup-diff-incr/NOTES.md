<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# backup-diff-incr: notes

New stepper (task `docs/tasks/w2/backup-diff-incr.md`, catalogue `sto-backup-diff-incr`, overlap §5.3), drawn on kit
view **K3: block grid** (`kit/blockgrid.js`, kit 0.6.0). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Lanes.** The task's state has one `sets`/`restore`/`mode`; `compare` needs two modes over one disk, so `sets`,
  `stored` and `restore` live per lane (`lanes[]`), the disk, its history and `lost` are shared. `compare` always
  shows incremental (left) and differential (right) and ignores `mode` (the toggle's hint says so).
- **Sunday is two steps too.** Step 1 writes the data (blocks A–H), step 2 is the level-0 backup, so the week is a
  uniform 10 steps and the full backup's "everything is new" is visible.
- **Thursday writes block 0 twice** (`A1`, then `A2`): the task gives the changes as sets (Thu {0}), and the double
  write makes the rule 7 tie-break visible in every preset without changing a number. The disk shows `A2`.
- **A lost set shows at step 11** (choosing the target), when a restore needs it: it is crossed (`bad`) with the tag
  "izgubljena"/"lost". Before that it was made like any other set.
- **The failure step** replaces the compare step (`lost-tuesday` 14 steps, as the task says). It names the state that
  was really restored ("Monday's, not Thursday's"), strikes the blocks that differ from the target (`dead`), says
  which blocks a restore that skipped the gap would bring back stale (3 and 4 as `D`, `E`), and in single incremental
  mode points at the differential case. "Newest restorable point" is said only when it differs from what was
  restored (in incremental mode it is the same day). A differential or full restore whose target set is lost stops
  the same way (differential: after Sunday; full: nothing restored).
- **Compare:** both lanes advance together; the differential lane compares at step 14 and then shows "done,
  waiting" with its result kept; at the last step the caption gives both totals (book's „jedna je skupa da se
  napravi i jeftina da se vrati, druga obrnuto"). If a lane failed, that verdict is left out.
- **Every param resets** to step 0 (each changes the step count). `lose` offers Mon–Wed only (task); losing Sunday's
  full is out of scope.
- **K3 use:** disk = one grid (column labels 0–7, the row label is the day); each lane = one grid, a row per night
  (label the day, aside the set's tag), then the restored row (`soft` cells, the source set's day as `sub`). Not
  stored = an empty free cell; a night not reached yet = holes. The set applied in a step gets one `now` link down the
  column of its first block. Restore counters are the grid's `meta`, stored blocks its `count`.
- **Concepts, not tools:** no tool is named on the page. The snapshot file and levels 0/1 are named as concepts (the
  UL definitions); the archiver is only in Sources.
- **`related`:** `dedup-chunking`. `retention-gfs` and `lnx-send-receive` do not exist yet.
- **Model is promotable:** `write`, `kindOf`, `setBlocks`, `planFor`, `newestRestorable`, `restoreLen` are pure
  functions over arrays; `WEEK` is data; no words.

## Deviations from the task

- State shape per lane (above).
- The hr caption follows the kit's term rule (*incremental backup* (prirasna kopija) at first mention, English alone
  after), not the task's „prirasna kopija (*incremental backup*)" order.
- Thursday's block 0 is `A2`, not `A1` (double write, above).

## Sources

- UL `book/chapters/23-odrzavanje-sustava.md`, „Potpuna i prirasna kopija, i datoteka koja pamti razliku"
  (definicije „potpuna kopija", „prirasna kopija", „datoteka snimka"; razina 0 / razina 1; „treba cijeli niz, redom,
  i ako iz njega jedna arhiva otpadne, otpada i sve što za njom slijedi"; „jedna je skupa da se napravi i jeftina da
  se vrati, druga obrnuto"), figure `lanac-prirasnih-kopija.svg`; footnotes ch23-tar-snapshot and
  ch23-tar-snapshot-copy; Primjer 6.
- GNU tar manual §5.2 "Using tar to Perform Incremental Dumps" (`--listed-incremental`, the working copy of the
  snapshot file for repeated level-1 dumps), as quoted by UL ch23; not re-read online *(check)*.
- "Differential" is not defined in UL: the standard definition (since the last full) is used; the wording
  „diferencijalna kopija" *(check with the author)*.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| differential backup | diferencijalna kopija *(check)* |
| level 0 / level 1 | razina 0 / razina 1 (UL ch23) |
| restore | oporavak / vraćanje (UL ch23) |

Used from the glossary: backup, full backup, incremental backup, snapshot file, recovery point.

## Shared requests

None. `kit/` and `models/` unchanged.

## Checks

- `node --test sims/backup-diff-incr/sim.test.js`: 16 tests pass; `npm test` (1748) and `npm run check` pass. Every rule broken once (8 mutants: double write
  keeps the first content, Sunday not full, incremental from since-full, differential from since-last, differential
  plan = whole chain, oldest wins, the gap skipped, newest restorable ignores the loss): all killed.
- `npm run gate -- backup-diff-incr`: pass (61/61 browser checks). Screenshots looked at: the gate's 1920×1080 light,
  dark, grayscale, panel hidden and 375×812 in both languages; extra states scripted: every preset's end, steps 3, 8,
  10, 11, 12, 13, 15 of the incremental week, compare 10/14/15/17 (hr, en, dark), lost-tuesday 11/14 (hr, en),
  differential with the target's own set lost, full with the target's set lost, phone mid-compare.
- Phone: the lane grids scroll sideways inside their box (the kit's K3 phone behaviour), the page does not.

## Status left at wip

Everything in COMMON.md §8 holds, but `status: "ready"` makes `npm test` fail in `tests/landing.test.mjs` ("home at
1920×1080 …: first shelf's tiles end at … 1277"). This would be the sixth ready `storage` sim, the first shelf on the
home page wraps to a second row of tiles, and that row ends below 1080 px. The test (site frame) assumes the first
shelf fits one row. With `wip` the test passes. Setting `ready` is one line once the site handles a shelf of six or
more (cap or scroll the shelf, or check only its first row).

## Review

A fresh reviewer read the diff against `SPEC.md` and the task. Their own reference model, written from the rules
alone, matched the sim on every count in all 96 combinations of mode × restoreDay × lose × compare. They ran 28
mutants of `sim.js`: 24 were killed. Of the 4 survivors, two are equivalent; one only changes `sinceFull` at step 1,
which the page hides; the last changed `wrong` when nothing is restored, and a new assertion now covers it.

They found these caption defects, all fixed:
- The double-write caption lost its first value: one node was used for two placeholders.
- In compare, a lane whose restore had stopped at a gap was later shown as "done, waiting". It now reads "the restore
  stopped, state: …".
- The compare verdict claimed a difference when both lanes needed the same number of sets (restore to Monday). It
  also had a Croatian case error ("2 kopija"). It now gives the numbers without a counted noun, and has its own
  sentence when the counts are equal.
- The incremental cost caption overclaimed when the chain was only 2 sets long. It now has a "chain still short"
  variant.
- English wording fixes: "all 2 sets", and "is changed" changed to "was changed". In compare, Croatian text after the
  lane name now starts in lower case.

## Time

Start 2026-10-04 09:54 CEST, done 10:16 CEST (about 22 minutes, plus the review).
