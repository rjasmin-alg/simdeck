<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-change-risk-class: notes

New explorer (task `docs/tasks/w3/cmp-change-risk-class.md`, catalogue `cmp-change-risk-class` §4.13). Rules and
expected numbers: `SPEC.md`.

## Decisions

- **Three lanes at once instead of a regime switch.** The catalogue says "run a quarter under three regimes"; the
  stage runs all three on the same changes with the same hidden defects (common random numbers), so every difference
  between the lanes comes from the process. The params tune the board's frequency, what counts as standard and the
  load; "New quarter" (N) draws another quarter.
- **Why the board batches.** Under "everything to the board" everything approved at one meeting goes out as one
  release (SPEC rule 5). That is the batching the concept names; it is a rule, not an emergent behaviour, and the
  explanation says so. Under risk classes the high-risk changes approved at one meeting still deploy one by one.
- **The board is not a worse reviewer.** Peer review and the board both find a defect half the time; the board lane
  fails more per deployment only because one defect fails a whole release (and rolls back the good changes in it).
  That matches the cited finding (external approval did not lower the failure rate) and keeps "a board reviewer
  rubber-stamps a long agenda" out of this page (that is `cmp-four-eyes`). High-risk changes under classes get peer
  review and the board (0.75).
- **Unrecorded changes:** all of them with no process; under the board, urgent changes that cannot be approved by the
  next working day go in at once without a record (bypass); under classes the emergency route records them. Their
  failures are "found only as an incident". Routine changes sneaking past a slow board would be realistic too, but
  one bypass mechanism is enough for the concept.
- **The change failure rate is per deployment** (the usual delivery measure). Counted per change the board lane has
  fewer incidents than classes in some quarters (several defects fail one release together); the lane foot shows the
  changes rolled back (39 against 5 in preset 1), which is the cost the per-deployment rate stands for.
- **Seed 1501** for the presets: chosen by scanning seeds 1–3000 for the quarter closest to the long-run averages
  (SPEC "Over many quarters") in which every preset shows its contrast. Other seeds differ in the numbers, not in
  the orderings the tests check over seeds 1–200.
- **One block height for all lanes** so batch sizes compare; single changes get small when a lane has a release of
  40+ (presets 2 and 5). Count labels from 3 changes up, ✗ on failed deployments.
- **Worst value marked:** the highest of each number across the lanes is red with ▲ (colour plus shape). Lowest is
  not always best (0 days lead time with no process comes with no record), so only the worst is marked.
- **No glossary terms** (`[[…]]`): the explanation writes the pairs out (Croatian bold, English in italics in
  brackets), as `cmp-risk-register` and `cmp-audit-sampling` do; the page does not link `glossary.js`.
- **No shared model.** §5.24's four models (people × roles × rights, risk scoring, incident clocks, evidence trail)
  do not apply: the risk classes here are a routing rule, not likelihood × impact. Nothing copied from another sim.
  The change-flow engine (`run`, `metrics`) is pure and wordless if `cmp-patch-sla` or a later sim wants it.
- **The firm is unnamed**; the foot says once: simplified, not legal advice, made-up firm, changes and rates.
- The Croatian title is shortened to fit 60 characters: "Upravljanje promjenama: razredi rizika ili odbor za sve"
  (the catalogue's "… ili jedan odbor za sve" is 61).

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- All three regimes are always on the stage (above) rather than chosen one at a time.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-change-risk-class/`; open questions are in the report instead.

## Sources

- ISO/IEC 27001:2022, Annex A 8.32 (change management), by number only. *(check: the control number)*
- DORA, Regulation (EU) 2022/2554, art. 9(4)(e) (ICT change management based on a risk assessment approach; all
  changes recorded, tested, assessed, approved, implemented and verified), EUR-Lex. *(check: the point letter and
  the official Croatian wording; the page paraphrases in Croatian "čl. 9. st. 4. t. (e)")*
- N. Forsgren, J. Humble, G. Kim, *Accelerate*, 2018, ch. 7 (external change approval and delivery performance).
  *(check: chapter)* The page says "studies of software delivery", without the title.
- Standard / normal / emergency changes: common service-management practice (the ITIL change enablement practice);
  not named on the page.
- All numbers on the page are illustrative (the page says so once). Checked by the Python script in `SPEC.md`.

## For the owner

- Catalogue §4.13 lists no Croatian detail *(check)* for this entry. DORA applies to financial entities only (since
  17 January 2025); the page names it as the source of the risk-based change management requirement, not as a duty
  of the fictional firm. Whether the regulation under the Zakon o kibernetičkoj sigurnosti (NN 14/2024) asks for
  change management in its own words *(check; source: Narodne novine)*; not on the page.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place (odbor za promjene is the owner's, settled
2026-11-07):

- *change management* (upravljanje promjenama), *standard change* (standardna promjena), *normal change* (normalna
  promjena), *emergency change* (hitna promjena).
- *lead time* (vrijeme do produkcije; the lane says "dana do produkcije"), *change failure rate* (udio neuspjelih
  isporuka; the lane says "neuspjelih isporuka"), *deployment* (isporuka), *batch size* (promjene po isporuci;
  "paket" in the concept), *rolled back* (vraćeno), *without a record* (bez zapisa).
- *peer review* (pregled kolege), *reviewed afterwards* (pregleda se naknadno), *board meeting* (sjednica odbora).

## Shared requests

None.

## Checks

- `node --test sims/cmp-change-risk-class/sim.test.js`: 27 tests; boundaries and tie-breaks first (same-day order,
  kind and defect boundaries, the agenda cutoff, the urgent bypass boundary, the review boundary, the rolled-back
  release), then rules 1–9, the five presets against SPEC, the orderings over 200 quarters, the generic block.
- Mutation check (mine): 26 deliberate breaks of `sim.js`, one per rule or boundary, each made a test fail (after
  adding `kindOf`/`defectOf` so the float boundaries are testable, and checking the full records in the tie-break
  test).
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md`, ran the Python check and
  98 mutants of `sim.js`: no code contradicted the spec; 15 real survivors. Added since: the unrecorded flag sticks
  after a recorded redeploy; the stage data of `compute` equal the run's deployments and metrics; the horizon is at
  least the quarter; the bypass note only when something bypassed (and with none of them failed); normalise's seed
  and load clamps and blank strings. Unused fields removed (`maxBatch`, `caught`). Re-run: 85 killed, 12 survivors,
  all equivalent (e.g. a simpler `meetingFrom` that agrees for every day, `Math.round` for halves up on positives,
  the loop guard). Wording applied: the no-process lane says each change goes out the day it is ready; urgent fixes
  "cannot wait for the next meeting" (not "a week"); a too-broad standard saves each medium-risk change a day; the
  bypass count in the caption is bold. Flagged, not changed: the term order (Croatian bold, English in italics in
  brackets) follows the other cmp- pages rather than COMMON §4's `[[term]]` rule; see the report.

## Time

Start 12:44, done 13:10 (2026-11-07), one session.
