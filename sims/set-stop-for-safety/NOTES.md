<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-stop-for-safety: notes

Task `docs/tasks/w3/set-stop-for-safety.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native
stepper, one minute per step, 16 steps.

## Decisions

- **All eight runs at once.** The model runs every action (say nothing, tell a colleague, tell the boss at the break,
  "Stop!" at once) with the briefing's rule on and off, from the same start. The params pick the run the chart and the
  minute line draw, and the table shows all eight at the current minute. So the contrast is on the stage at every minute
  (COMMON.md §11: run each variant to its own end and show each outcome), and switching the rule (key A) or the action
  keeps the step.
- **The crew is `crew.js`, copied unchanged from `set-chain-of-command`** (@ d7b6298; only its header comment differs).
  Catalogue §5.25 names this sim as the crew model's hub, but `set-chain-of-command` was built first and its module is
  ready for promotion; `models/` has no `set-crew` yet (COMMON.md §6: copy, keep its tests, report). I left the people,
  ids and lines as they are, so promotion stays one file. Consequences: the day player is the crew's `actor` (cast, line
  up to the 1st AD), labelled "Day player" on this page; the "trainee from another department" is the AD trainee.
- **What the rule switches.** The task asks for the briefing's "anyone may stop" rule to switch on and off, but the
  student already picks the noticer's action, so the rule cannot change what the noticer does. It changes what everyone
  else does with the message (SPEC.md rules 8 and 9). With the rule on, anyone who hears of a hazard calls stop, and the
  1st AD halts on anyone's word. With it off, only the owning department may stop it: a colleague from another
  department drops it ("not my department"), someone of the owning department waits for their own break, the owning
  head fixes it without a halt, and the 1st AD checks a report from outside the department with the owning head first
  (4 min). A false alarm then gets the reporter told off. That makes "nobody is blamed for an unnecessary stop" visible
  as the absence of the telling-off.
- **The false alarm is a fourth hazard** (a burning smell at a new lamp burning off its coating): "a stop that turns out
  unnecessary" needs a case where the stop costs minutes and nothing was wrong. Lamp coatings burning off on first use
  is a common explanation for the smell; the page only says "a burning smell at a new lamp".
- **The accident wins a tie** (rule 11): a halt or a fix in the fuse minute is too late. A hop in that minute is kept and
  drawn, so the student sees the 1st AD hear it as the curtain catches.
- **Deterministic loss.** "Sometimes the message itself" is a rule about who hears it (rule 9d), not a random draw: the
  same case always loses or keeps the message, and the presets and table are stable on a projector. The trainee's
  colleague is the electrician and the day player's is the boom operator, so with the rule off the trainee's word
  reaches the gaffer (late) for the electric hazards and is lost for the grip's stand, while the day player's is always
  lost. That is the "sometimes".
- **The noticer's own crew** shows the "own department" contrast: with the rule off their stop is not checked, and at
  the break their head fixes it without a halt (the fix can still come after the accident).
- **The 1st AD's check takes 4 minutes** (radio the owning head, who goes and looks, then answers). That is long enough
  to make the smoke (accident at 4) and the cable at the break (accident at 12) visibly too late without the rule, and
  short enough for the stand (7) to survive a direct stop.
- **Steps: 16.** The break is a param (5–12, default 10); the latest event over every case is a restart at minute 16
  (tested over all 768 combinations). Quiet minutes stay, because the minutes against the fuse are the point.
- **Six presets planned, five kept.** `own` (the electrician tells the gaffer at the break, rule off) was dropped so the
  panel fits 1920×1080 in English; the case is reachable from the controls and stays in the tests. The hazard control is
  a drop-down (4 options), the toggle has no hint line, and the legend labels are short, for the same reason (the English
  title wrapped onto two lines with the longer legend).
- **The arrows run over the org chart, not the floor plan.** The positions are `set-chain-of-command`'s, so a few long
  hops (day player → boom operator) pass under other boxes. The minute badge and the arrowhead stay readable. A floor
  plan is the `set-cable-runs-exits` model (§5.25), not this one.
- **Not modelled on the real case.** See below: without the records in hand there is no "Based on" line, and the
  scenario stays plainly fictional.

## Real case: no "Based on" line (task rule)

The catalogue names the 2014 *Midnight Rider* train strike (Georgia, USA), with the US federal safety agency's
citations and the Georgia criminal case (guilty pleas, 2015). The task allows the visible reference only with the
official record in hand, its title, number and date checked against the document. I could not open any of them:

- the US Department of Labor newsroom (dol.gov/newsroom/releases) returned HTTP 403 to the fetch tool;
- the OSHA establishment search (osha.gov/ords/imis/establishment.html) and the OSHRC decision search
  (oshrc.gov/decision-search/) load, but only answer a query, which the fetch tool cannot submit; the commonly cited
  docket number (OSHRC 14-1544) is therefore unverified;
- no official Wayne County Superior Court or Georgia prosecutor page was found for the criminal case.

So the page has no "Na temelju / Based on" line, as the task requires. The same happened to `set-risk-controls`.
Once someone opens the records in a browser, the line for the explanation's last paragraph (strings.js `explain`, both
languages) would be: "Na temelju: udar vlaka na željezničkom mostu tijekom snimanja filma *Midnight Rider* (Georgia,
SAD, 2014): ekipa na pruzi bez dopuštenja i bez sigurnosnog brifinga; OSHA, kazna produkcijskoj tvrtki (*(check)*
broj inspekcije, datum); kazneni postupak, Wayne County, Georgia (priznanja krivnje, 2015)." / "Based on: the train
strike on a railway bridge during the shooting of *Midnight Rider* (Georgia, USA, 2014), crew on the line without
permission and without a safety briefing; OSHA citation of the production company (*(check)* inspection number, date);
criminal case, Wayne County, Georgia (guilty pleas, 2015)." *(check every detail against the documents)*. The page's
model already carries the case's lesson (no briefing, nobody who felt entitled to stop the work).

## For the owner (terms and calls as used; catalogue §4.14 marks them *(check)*)

Loanwords from the owner's list, as written: *1st AD*, *gaffer*, *key grip*, *grip*, *boom operator*; declined where
natural: "1st AD-a" (sim.json summary). Not on the owner's list, so *(check)* with the colleague who trains crews:

- *Day player* in the Croatian strings (role and noticer); or "glumac na jedan dan", "dnevni glumac" *(check)*
- *Pripravnik* for the AD trainee; *Ekipa odjela* for "own crew" (the owning department's crew member) *(check)*
- *DoP*, *Produkcija*, *Redatelj*, *Operater kamere*, *Električar*, *Snimatelj zvuka*, *Rekviziter*, *Pomoćni
  rekviziter*: as in `set-chain-of-command` *(check)*
- *prvi asistent režije* as the once-only gloss of 1st AD *(check)*
- *Stativ bez vreće* / "stativ bez vreće s pijeskom" (catalogue: stand or stativ, sandbag or vreća s pijeskom)
  *(check)*
- The call: „Stop!” in both languages, as in `set-radio-discipline` (not in the catalogue's list of calls; the Croatian
  call for a safety halt) *(check)*. The restart is described ("1st AD nastavlja rad"), not quoted as a call, since the
  catalogue's "Idemo dalje!" means moving on to the next setup.
- *ukor* for "told off" *(check: or "dobiva po nosu", "kritika")*
- Croatian law named on the page without article numbers: Zakon o zaštiti na radu; procjena rizika; osposobljavanje za
  rad na siguran način; the worker's right to stop or leave work in serious and imminent danger without consequence
  (owner, 2026-11-08: may be named). The articles and current amendments *(check)*: the Narodne novine consolidated text
  of the Zakon o zaštiti na radu (NN 71/14 and amendments, from memory *(check)*); the right to stop in the article on
  the worker's rights in case of serious and imminent danger *(check)*.

## Unchecked (*(check)*)

- Every minute (the fuses 7, 12 and 4, the fix times, the 4-minute check, the break) is illustrative, and the page says
  so in its foot line and explanation.
- Directive 89/391/EEC art. 8(4)–(5) and art. 13 are cited in SPEC.md from memory, not against the EUR-Lex text; the
  directive is not named on the page (no number on the page comes from it).
- The film/TV safety guidance listed in SPEC.md (HSE, Ontario, ScreenSkills) was found by `set-chain-of-command`'s
  builder, not read in full.
- That a stop called from outside the department is checked first without such a rule is the model's assumption about
  a production without the briefing's rule, not a documented practice.
- The *Midnight Rider* records (above).

## Numbers check

An independent replay (`replay.py`, a minute-by-minute simulation written apart from `sim.js`'s planner, run with
`python3 -I` from the session scratchpad, not committed) compared every outcome minute (halt, fixed, checked, restart,
accident, lost, telling-off, check) over all 4 hazards × 3 noticers × 4 actions × 2 rules × 8 break minutes = 768 cases:
0 mismatches. It caught nothing in the model, but writing it surfaced that rule 9c was unreachable with the first
choice of colleagues (fixed by giving the trainee the electrician as colleague) and that the step count is 16, not 18
(the cable at a break in minute 12 falls before the halt).

## Fresh review

A fresh reviewer (a separate agent, given only the code and SPEC.md) compared the code with SPEC.md, replayed the
expected-numbers table (all cells matched) and ran 58 deliberate mutations: 47 killed, 11 survived. Nine survivors are
equivalent (pairs of outcomes that never occur together, a lost message that can never fall in a fuse minute, the
`t + 1` branch of the break arrival that the param range never reaches); the two real gaps (halt outranks fixed in
rule 12; "waiting" means strictly later) now have assertions. It also found SPEC drift (the dropped sixth preset, the
legend and minute-line description, the caption order), now corrected in SPEC.md, and four caption slips on the
false-alarm paths ("nobody mentioned it" when someone had, "fixed" for a check, "the hazard stays" for a false alarm, a
check that promised a stop), now fixed. The page's captions have no unit tests; they were checked by screenshots and
caption dumps of the reviewer's cases.

## Term pairs (glossary)

None needed: the page uses no `[[terms]]`. Candidates once the owner confirms the forms: 1st AD / prvi asistent režije;
head of department / šef odjela; day player / *(check)*.

## Shared requests

- **Promote `crew.js` to `models/set-crew.js`** (as `set-chain-of-command`'s NOTES also asks), with its crew tests;
  then point this sim and `set-chain-of-command` at it. This sim reads `PEOPLE`, `person`, `headOf`, `path` and `lines`.
  The message logic (per-hop delays, the check, loss by department) stays in this sim's `sim.js`: it is this page's
  concept, not the crew model.
- **Glossary**: none.

## Learn tree

Suggested leaf (catalogue §4.14): `film-set` → `crew` → `stop`.

## Time

Started 2026-11-13 07:01, done 2026-11-13 07:25, including a fresh review (58 deliberate mutations).
