<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-wsus-cloned-id: notes

New stepper (task `docs/tasks/w3/win-wsus-cloned-id.md`, catalogue `win-wsus-cloned-id`, §4.5.6, wave 3). No kit view:
the task names none, and the scene is two columns of HTML cards and a table with arrows between them (an SVG overlay
drawn after layout, 1:1 in CSS pixels). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Step 1 is the deployment.** "Image generalised before cloning" and "clones deployed from an image that was not"
  are one event each: step 0 shows the image (its ID `7f3a…`, or no ID when generalised) and empty clone slots, step 1
  starts the clones. This keeps one-row and generalised-image at the task's 4 steps.
- **Generalised clones get their IDs at first start** (step 1), as rule 4 says, not at first contact with WSUS.
- **The console starts empty.** The reference machine that the image was captured from had a row of its own in real
  life; showing it would add a fourth, stale row to every preset. The image card says the image was "captured from a
  computer that has already reported to WSUS" instead.
- **One report per clone in the window** (09:00 + 20 min per clone). The next round would come about a day later; it
  would only repeat the flips.
- **The reset button** sets `resetAt` (no control of its own, as `brAt` in `win-wsus-flow`) to the current step: the
  reset is the next step, 10 min after the step before; PC-02 reports 10 min after the reset, or at its own scheduled
  report if that is sooner. One reset per run: a second press moves it. A press at step 0 is a step that is rejected
  ("the clones don't exist yet"). As in `win-wsus-flow`, `resetAt` survives in the URL only through the `reset-one`
  preset; after `L` or a reload a button press is lost (see "Shared requests").
- **The reset keeps the old row.** On a shared ID the other clones still use it; on a generalised image it stays as a
  stale entry, so PC-02 is in the console twice (WSUS keeps a computer until it is deleted or cleaned up *(check)*).
- **Param `pc02Missing`** instead of the task's `patchPc02`: the toggle means "PC-02 lacks KB-C", and the name says so.
- **Console summary.** Under the table the console's numbers (computers, KB-C installed, KB-C needed) sit beside the
  truth on the machines (computers, without KB-C). When every clone has reported, the console says 0 needed and a
  machine lacks KB-C, a "the report is wrong" tag appears (⚠ + red border + words).
- **Clone cards** say "shown as PC-03 in the console" when the row of their ID now carries another name: the
  "missing machines are switched off" misconception, answered on the card.
- **ID chips:** each fixed ID has its own colour and pattern (`7f3a` diagonal, `a2c4` dots, `d91e` vertical, `5b07`
  horizontal, `e3f8` checker, `16bd` cross-hatch, `9c6b` back-diagonal) plus its text, so matching works without
  colour (grayscale screenshot checked).
- **Phone:** the columns stack, the arrows are hidden (the ID chips carry the match) and the IP column is dropped.
- **Names:** WSUS and KB-C are named (the course teaches WSUS, COMMON.md §1); no tool, command or registry key is named
  (out of scope per the task). Duplicate machine SIDs get one sentence in the explanation.

## Deviations from the task

- **false-green has 4 steps, not 5.** With the console summary always on screen, the false green is visible at the
  09:40 report (step 4); a fifth "read the report" step would only repeat it. one-row and false-green differ by
  `pc02Missing` (one-row: off, so it shows the identity alone; false-green: the default, on).
- Step counts otherwise as the task: one-row 4, reset-one 6, generalised-image 4. `sim.json` `steps` is 4 (defaults =
  false-green). Largest run: 5 clones with a reset, 8 steps.
- State: besides the task's `t`, `machines`, `console`, `log`, the state has `image`, `deployed`, `resetDone` and `ev`
  (this step's event); machines carry `ip`, `lastReport` and `reportedId` (for the arrows).
- **Reuse of `win-wsus-flow`:** its model is not in `models/` and has no client IDs; nothing was copied. Only the idea
  (a client's status report lands on the server) and the button pattern (`brAt` → `resetAt`) are shared.

## Sources

- Task file, model and presets.
- Microsoft (titles from the task, not opened from here): support article on computers that don't appear in the WSUS
  console / cloned clients sharing a SusClientId *(check)*; "Sysprep (Generalize) a Windows installation" *(check)*.

## Not checked *(check)*

- The SusClientId is created when the update client first runs (the image card says so); whether generalising removes
  it on every Windows version is the reviewer's belief and mine, not checked.
- WSUS keys computers by SusClientId and overwrites the row on each report (rule 1, 3): standard knowledge, title of the
  support article not confirmed.
- Generalising removes the SusClientId so each clone creates its own (rule 4): the client creates the ID when the update
  agent first runs; whether generalisation itself removes it, or the image must be captured before the machine ever
  contacts WSUS, is worded per the task.
- After a reset the client registers at its next contact (rule 5); "10 min after the reset" is a model choice.
- A stale row stays until deleted or removed by cleanup (computers not contacting the server).
- All times (07:30, 08:00, 09:00 + 20 min, reset + 10) are model choices, not from a source.

## Checks

- Numbers: SPEC.md's timeline was written before the model; a small script printed every preset's events and rows
  (and the button at steps 0, 2, 3), and they agree. `sim.test.js` pins every time, ID, row and step count.
- 26 tests: 3 tie-break/ordering tests first, one or more per rule, the button cases, clamps, the end of the run,
  the maximum over all combinations, and the template's generic block.
- Mutations, one at a time (tie-break `<` → `<=`, rows keyed by name, deploy ID both ways, name / status / IP not
  overwritten, reset making a row at once, reset deleting the old row, reset a step late, rejected reset applied,
  report gap, deploy time, recontact delay, the `min` for a sooner scheduled report, PC-02 patched, row order by ID,
  `Math.max` on the clock): every one fails a test except `Math.max` (equivalent: events never go back in time, which a
  test checks over every combination). The `min` survived at first (no preset reaches it); a hand-made-state test now
  catches it.
- Captions read in both languages at every step of every preset, plus clones 2 and 4, generalised + reset, and the
  button at steps 0, 2 and 3. Fixed from that read: "the row now hides" counted a clone that had not reported yet; a
  report landing on a row last written by PC-02 before its reset said PC-02 "had the same ID" (now its own caption);
  Croatian verb agreement in the deploy caption.
- Fresh review (a separate agent read the code against SPEC.md and the task, drove the page and made ~25 more
  mutations). Fixed from it: with 2 clones and a reset, the last caption called the shared row "stale" while PC-01
  still had that ID (now "PC-01 still has the ID 7f3a…: the row will show it again at its next report"); the ⚠ tag
  waited for every clone to report while the caption already said the report was wrong (one condition now); "every
  computer is switched on and reporting" was said before the last clones had reported; tests did not pin `lastReport`,
  `reportedId`, `ev.id`, `ev.ids` or the summary before the end (7 surviving mutations, all now caught); the image was
  said to come from a computer that "had reported to WSUS" (the ID is made when the update client first runs; now said
  so); the SID sentence now names local machine SIDs; "cleanup" added to how a stale row goes; "Stvarno" → "Na
  računalima"; the button says "oznaku". Dark theme: the ID chip in a highlighted row was unreadable (own ink now).
  Not changed: `resetAt` is not in the URL (see "Shared requests"); at 1366×768 the stage scrolls (not a contract size).
- Gate: see the report; screenshots reviewed at 1920×1080 light, dark, grayscale and 375×812 in both languages.

## Term pairs

Not in `kit/glossary.js`; written out in the strings (*English* (Croatian) at the first mention):

- client ID — oznaka klijenta
- clone (disk image) — klon (slika diska)
- generalise (an image) — generalizirati (sliku)
- report (status report) — izvještaj / javljanje stanja
- console — konzola
- duplicate identity — dvostruki identitet

## Shared requests

- **Kit: hidden params in the URL.** `resetAt` has no control, so the kit does not keep it in the query string; a
  press of the reset button is lost on `L` or a reload. Same as `win-wsus-flow`'s `brAt`; a param flag such as
  `hidden: true` (kept in the URL, no control drawn) would fix both.
- **Arrows between HTML elements** (from a card to a table row, drawn after layout): drawn in the page here with an SVG
  overlay; K2 draws links only between its own nodes.
- **Legend swatch `ci-id`** (a patterned square): defined in the page.

## Time

Start 18:58, done 19:18 (one session, 2026-11-04).
