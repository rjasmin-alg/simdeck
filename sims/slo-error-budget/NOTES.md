<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# slo-error-budget: notes

New explorer (task `docs/tasks/w3/slo-error-budget.md`, catalogue `perf-slo-error-budget` §4.8, wave 3). One concept:
burn rate, and fast and slow burn alerts. No kit view fits (a timeline, gauges and lamps are none of K1–K4), so the
page draws its own SVG, measured in CSS pixels after layout (1:1, no viewBox), redrawn by a `ResizeObserver`; the
budget bar and the burn gauges are HTML. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Exact arithmetic.** Error rates are whole basis points (every editor stop and every SLO's allowed rate is), time
  is whole minutes, so budgets and window sums are integers in bp·min and every threshold (14.4, 6, 1) is compared as
  `10 × sum ≥ 10θ × w × allowed`. The tie-break (rule 5) is then exact: preset 2's 1.44 % for an hour is burn 14.4
  to the last bit, and fires.
- **Instants and minutes.** The window of w minutes ending at instant t holds minutes t − w … t − 1; the cursor is an
  instant. The fast-burn preset's page is on at exactly one instant (the end of the hour); the blip's page is on
  from 1 min into the blip to 4 min after it, off 5 min after it ended.
- **Before day 0 there were no errors** (the month follows a clean one) and a short history is still divided by the
  full window. The task does not say. Consequence: the slow-burn ticket fires at day 1.5, when the 3-day window is
  half full at burn 2, not at minute one. Stated in the explanation.
- **Overlapping incidents add, capped at 100 %.** Each incident's own "budget used" (rule 4) is shown uncapped in
  the state; the budget bar uses the capped total.
- **The cursor (`at`)** is where the gauges and lamps are read. The whole month's alert history is drawn too (three
  lamp strips under each timeline), so a student sees when each alert came on and went off without scrubbing.
  Each preset puts the cursor where its point shows: the end of the outage, the end of the hour, day 15, 7 min
  after the blip started (the page has just stopped, the 1 h burn is still 33.3), day 30.
- **A detail view** (3 h around the cursor, minute by minute) under the month: on the 30-day scale a 2-minute blip
  and a 5-minute window are under a pixel. The windows of 5 min, 30 min and 1 h are drawn there, 6 h and 3 days on
  the month, each as a bracket ending at the cursor and labelled with its burn (`showWindows`).
- **The incident editor.** The kit's params are flat, so the selected incident is mirrored in four params: `sel`,
  `iStart` (whole hours), `iDur` and `iRate` (indices into fixed stops, so a 2-minute blip and a 30-day slow burn
  are both reachable on one slider). Moving one of them edits `incidents[sel]`; selecting another incident, a
  preset or a drag moves them to it (`mirror`, `applyEdit` in `sim.js`, the page's `sync`). "Add incident" (`A`) puts
  30 min at 10 % at the cursor's hour; "Remove incident" (`X`) drops the selected one; at most 6.
- **Stage interaction.** Click or drag on either timeline moves the cursor; dragging an incident's bracket moves it
  (whole hours) and selects it. The cursor slider is the keyboard way (arrows step one minute).
- **The incident list in the URL.** The kit writes only scalar params to the URL; the page keeps `?inc=start-duration-bp.…`
  beside them (written only when the list differs from the active preset's), so a reload and the language switch
  (`L` reloads the page) keep hand-made incidents. Shared request below.
- **Captions** (pure `captionKey`, SPEC.md "Captions"): the task's en caption is `slowBurn` ("0.2 % errors never wake
  anyone, yet at burn rate 2 the month's budget is gone on day 15 at 00:00: the ticket alert, on since day 1, 12:00,
  is the one that catches it."); its rate is the month's peak 1 h error rate and its burn the peak 3-day burn. The
  task's hr caption ("SLO 99,9 % kroz 30 dana daje proračun greške od 43,2 minute. Dvadeset minuta ispada potrošilo
  je gotovo polovicu.") is split: the first sentence is the empty-start caption (`cEmpty`), the second is what
  `cPage` says at the outage preset ("Dosad je potrošeno 20 od 43,2 min (46 %).").
- **"Changed"** marks a lamp whose state differs from the state drawn before the last change (yellow ring and ink
  outline, `.sd-changed`, plus the word in its tooltip). A redraw of the same state keeps the marks.
- **Colour is never alone:** pages and tickets have their own strip rows with labels; a lamp that is on is solid
  with the word PAGE/TICKET (HITNO/ZAHTJEV), off is dashed with "off"; a gauge over its threshold is a solid fill,
  under it an outlined bar, and the value is always written.
- **Panel fit at 1920×1080:** presets in two columns (as amdahl), the action buttons side by side, no hints in the
  settings; how to click and drag is in the explanation.
- **Concepts, not tools:** no monitoring product is named; "an alert", "a page", "a ticket".
- `related`: `fin-downtime-cost` (an error budget's minutes in money, catalogue §5.23) and `lnx-alert-states` (how an
  alert rule goes pending → firing). Topic `distributed`, tag `monitoring`, level `advanced` (the task's); all exist
  in `tags.json`.

## Deviations from the task

- **Extra params** for the editor (`sel`, `iStart`, `iDur`, `iRate`) and the cursor `at`; the task's `windowDays` is
  fixed at 30 and not a param.
- **State** carries more than the task's list: `usedAtMin`/`remainingAtPct` (at the cursor), `lit`, `firstFired`,
  `peak`, `hourly`, per-incident `usedMin`. `exhaustedAt` is an instant in minutes (21 600 = day 15, 00:00).
- **Preset 1's expected "46 %"** is 46.3 %; the page rounds shares of 10 % and over to whole percent. Preset 4's 5 min
  burn 400 is at the end of the blip; the preset's cursor is 5 min later, where the page has just stopped (the
  gauges show 33.3 and 0; the detail shows the page strip ending at the cursor).
- **Slow burn: the ticket fires at day 1.5**, from the zero-history decision above.
- No `goodhart-teams` or `alert-to-nobody` links: those sims do not exist yet (`related` only takes existing ids).

## Sources

- B. Beyer, C. Jones, J. Petoff, N. R. Murphy (eds.), *Site Reliability Engineering*, O'Reilly 2016, ch. 3 "Embracing
  Risk", ch. 4 "Service Level Objectives" *(check chapter numbers)*.
- B. Beyer, N. R. Murphy, D. K. Rensin, K. Kawahara, S. Thorne (eds.), *The Site Reliability Workbook*, O'Reilly 2018,
  ch. 5 "Alerting on SLOs": burn rate, multiwindow multi-burn-rate alerts, 14.4 / 6 / 1 with 1 h + 5 min, 6 h + 30 min,
  3 d + 6 h *(check chapter number; the thresholds and windows are as the task states them)*.
- NLA toc (`napredna-linux-administracija/meta/toc.md`): T40 "SLI, SLO i proračun greške" and T37 (uzbunjivanje);
  the chapters are not written yet, so the Croatian terms are the toc's and the task's.
- dc-sim: `src/dc_sim/org/error_budget.py` (`ErrorBudgetTracker.burn_rate` = the breached fraction of checkpoints in a
  rolling window, compared with an allowed breach fraction). **A different definition**: this page uses the SRE ratio
  (rule 2); nothing from dc-sim is copied.
- Preset numbers checked before coding with an independent script (Python, exact fractions, minute by minute):
  20 / 43.2 = 46.3 %, 1 h burn 333.3, fast page on at instants 15 121 … 15 144; 1.44 % × 1 h = burn 14.4, 2 %,
  page at 12 300 only; 0.2 % = burn 2, exhausted at 21 600 (day 15), ticket from 2160 (day 1.5), no page; blip 2 min =
  4.6 %, 1 h burn 33.3, 5 min burn 400, page at 7921 … 7926; 0.05 % = burn 0.5, 50 %, no alert.

## Term pairs

Missing from `kit/glossary.js` (only *error rate* — stopa pogrešaka — is there), written out in the explanation as
*English* (Croatian) on the Croatian page, and with `*…*` in the empty-start caption:

| English | Croatian | Note |
|---|---|---|
| service level objective (SLO) | ciljana razina usluge | NLA T40 *(check)* |
| service level indicator (SLI) | pokazatelj razine usluge | NLA T40 *(check)*; in aliases only |
| error budget | proračun greške | NLA T40 (fin-downtime-cost writes "proračun pogrešaka") |
| burn rate | brzina trošenja (proračuna) | task *(check)* |
| alert | uzbuna | NLA T37 |
| page | hitna uzbuna | task *(check)* |
| ticket | zahtjev | task *(check)* |
| window | vremenski prozor | task |

## Shared requests

- **Kit:** `.sd-ctl` has `display: flex` in `kit.css`, which beats the `hidden` attribute a param's `visible()` sets.
  Worked around with `[data-sim="slo-error-budget"] .sd-ctl[hidden] { display: none; }` (as amdahl, littles-law).
  Smallest fix: `.sd-ctl[hidden] { display: none; }` in `kit.css`.
- **Kit:** list-valued params (here the incident list) are kept in the params but never written to the URL, so a
  link or the language switch would lose them. Worked around with the page's own `?inc=` (the kit keeps query keys it
  does not own). Smallest fix: an optional `{ key, encode, decode }` for a param without a control, written and read
  with the others.
- **Kit:** a button param cannot be disabled with a reason as other params can (the add button at 6 incidents, remove
  with none); the page's run functions just do nothing then.

## Review

A fresh reviewer (subagent, no shared context) read the code against SPEC.md, recomputed every preset number with an
independent brute-force model (all match, including the on/off instants), compared 150 random incident sets with
`compute` (all match), and ran 35+ mutations. Fixed from its findings: dragging in the detail view ran away (each
move re-read the span, which moves with the cursor; the span is now fixed at pointerdown); a start before day 0
shifted the incident instead of clipping it; the zoom box was not watched for resizes; SPEC claimed every caption
gives the budget used (now it says which do); a budget exhausted with no alert at all (none found in a 4000-case
search, not ruled out) printed "undefined" and now has its own caption. Test gaps it found now have tests: each
alert's short window deciding when it stops (the ticket's 6 h, the 30 min's length), the budget so far and what is
left (and its clamp at 0), the hourly bars, start rounding, the 100 % rate cap, the cursor clamp, the caption order
ticket-before-exhausted, `firstAlert` on a tie, `addIncident` and `mirror` at the edges. Left as is: a selected
incident other than the first is not restored from `?inc=` (selection starts at 1); an incident from the URL whose
values are off the editor's stops snaps to the nearest stops on its first slider edit.

## Checks

- `node --test sims/slo-error-budget/sim.test.js`: 20 tests, tie-breaks first. 25 mutations, each making a test fail:
  the ≥ tie of the burn thresholds and of exhaustion, the budget, a window off by one, dividing a short history by
  the data available, OR instead of AND, the long window alone, the slow threshold, the 100 % cap of the series and
  of one rate, the per-incident budget, the clip at day 30, a negative start shifted, the ticket's short window,
  the 30 min and 6 h lengths, start rounding, the clamp of what is left, the budget so far, the hourly mean, the
  cursor clamp, `addIncident`'s floor, `mirror`'s clamp, the caption order, `firstAlert`'s tie.
- Interactions driven headless (Playwright): the editor sliders edit the selected incident, add/remove, selecting
  moves the sliders, a click on the month moves the cursor, dragging a bracket moves the incident, `?inc=` survives a
  reload and the `L` switch, a preset clears it; a drag in the detail keeps the cursor under the pointer; no console
  errors. Every caption kind rendered in both languages with no placeholder left.
- `npm run gate -- slo-error-budget`: pass (51 browser checks, 0 exceptions). Screenshots at 1920×1080 light, dark and
  grayscale and 375×812, both languages, reviewed, plus each preset by hand.

## Time

Start 2026-11-08 13:44 CET, done 14:12 CET: about 28 minutes, one session (including the fresh review and its fixes).
