<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-incident-clocks: notes

New stepper (task `docs/tasks/w3/cmp-incident-clocks.md`, catalogue `cmp-incident-clocks` §4.13; seed: `rpo-rto`
"found on Monday"; hub of the incident-timeline model, §5.24). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Awareness is the end of the triage.** The brief lists start, detection, triage, classification and personal data;
  NIS2 counts from "becoming aware of the significant incident" and GDPR from "having become aware" of the breach, which
  the EDPB reads as a reasonable degree of certainty after a short initial investigation. So the model takes the end of
  the triage (classification done) as the one moment both sets start. The explanation says this simplifies, and that an
  authority can treat a drawn-out triage as undue delay; the model does not try to score "undue delay".
- **How a deadline is missed:** reports are filed by whoever may file them, working either office hours (weekdays
  8–16) or on call. Hour clocks run on through nights and weekends, so awareness on a Friday evening leaves the early
  warning for Monday while its deadline was Saturday. Slowing the triage misses it the same way, by pushing awareness
  out of office hours (preset 5: 8 h vs 2 h). Detecting later never misses a deadline by itself: that is the point
  (preset 2).
- **Only the early warning can be missed** with these hours of work (1, 3, 3); a test checks it over every attack hour
  of the week. Any 72 hours hold at least 8 office hours, so the 72-hour reports always make it. That is honest for the
  illustrative numbers and keeps the lesson on the 24 hours. The model and the strings still handle late 72-hour
  reports (GDPR's "with reasons for the delay", the final report moved by a late notification); tests reach them with
  other hours of work and a hand-made state.
- **One queue, clock order** (early warning, notification, GDPR; the NIS2 notification first on equal deadlines). Two
  people working in parallel is out of scope.
- **The final report is not simulated**, only its deadline: one calendar month after the notification was filed (same
  hour, last day of a shorter month). The stage stops at the 72-hour mark (and any filing after it); the final report has its
  own step and a row in the table, no lane (a month does not fit on a week's axis).
- **The misconception lane** "From the attack?": a dashed, struck-through 24-hour box from the attack, shown from the
  detection step. The detection caption says how much of it would be gone, or how long before detection it would have
  run out.
- **Reference week:** Monday 1 March 2027, chosen so no daylight-saving change or Croatian public holiday falls inside
  the weeks shown; the foot says holidays and daylight saving are left out.
- **Steps (7)** jump "now" to fixed marks (attack, detection, awareness, +24 h, +72 h, final report, summary) instead
  of one step per event, so the step count is the same for every param combination. A first draft had a "late
  filings" step after +72 h; the reviewer showed it always repeated the +72 h step (no report is ever filed after the
  72-hour mark with these hours of work), so it was dropped and a late early warning's filing is told at +72 h.
- **Timeline model in `clocks.js`**, pure and wordless, registered as `SimdeckModels.clocks`, ready for
  `models/clocks.js` (catalogue §5.24; `cmp-breach-triage` reuses the clocks). It takes the hours of work as an optional
  `prep` so a reuser can change them.
- **Firm unnamed** ("a small firm"), as `cmp-policy-to-record` does. Articles only in the explanation, never on the
  stage. The stage foot says once: simplified, not legal advice, made-up numbers.
- **Marks:** NIS2 bars series 1, GDPR series 3, each lane labelled with its regime and hours; late = red hatch plus ✗
  and words; weekends grey hatch; work = ink blocks; ▲ ● ◆ for attack, detection, awareness; the step's table rows
  highlighted (kit highlight + ink edge). Grayscale checked.
- **Phone:** lane labels narrow, sub-labels and the times inside stage labels hidden (the table, which scrolls inside
  its own box, keeps the times), day columns show the weekday only.
- **No glossary terms** (`[[…]]`); pairs are written out in the explanation (Croatian bold, English in italics), as
  `cmp-policy-to-record` does. The page does not link `glossary.js`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow only
  `sims/cmp-incident-clocks/`; the open questions are here under "For the owner" and in the report.
- "GDPR" is used on the Croatian stage too (lane and toggle labels); the explanation gives "Opća uredba o zaštiti
  podataka" once.

## Sources

- NIS2, Directive (EU) 2022/2555, art. 23(1), (4)(a), (b), (d) (EUR-Lex). *(check: the Croatian wording — rano
  upozorenje, obavijest o incidentu, završno izvješće, "u roku od 24 sata od saznanja" — was confirmed through a
  Croatian secondary source quoting the directive, not read on EUR-Lex directly)*
- GDPR, Regulation (EU) 2016/679, art. 33(1); Croatian "bez nepotrebnog odgađanja i, ako je izvedivo, najkasnije 72 sata
  nakon saznanja".
- EDPB Guidelines 9/2022 on personal data breach notification (v2.0, 28 March 2023), on when a controller is "aware".
  *(check: paragraph numbers)*
- Regulation (EEC, Euratom) No 1182/71, art. 3 (periods in hours and months). *(check, see below)*
- Illustrative (the page says so once): office hours 8–16, the hours of work per report (1, 3, 3), the firm.

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters" (not on the page):

- The name and number of the government regulation under the Zakon o kibernetičkoj sigurnosti *(open: not stated by the owner)*; which
  article of the law sets the 24 h / 72 h / one month reporting and whether it differs from art. 23 *(open: not stated by the owner)*.
- Which body receives incident reports for which sector (the national CSIRT or the competent authority) *(open: not stated by the owner)*.
  The page still says "the competent CSIRT or competent authority".
- The DORA reporting timings for financial entities and the split between the Hrvatska narodna banka and HANFA
  *(open: not stated by the owner)*. The page says only that DORA has its own timings. No DORA preset was built (optional in the catalogue).
- Whether a final report whose month ends on a Saturday, Sunday or public holiday moves to the next working day
  (Regulation 1182/71 art. 3(4) for EU acts; the Croatian law may say otherwise) *(open: not stated by the owner)*. The page ignores it; none
  of the presets' final dates falls on a weekend, but about a quarter of all param combinations do (384 of 1436
  significant ones, the reviewer's count).

## Settled

- NIS2 is implemented by the Zakon o kibernetičkoj sigurnosti (NN 14/2024) and a government regulation under it:
  owner confirmed 2026-11-08. On the page: the explanation's NIS2 paragraph names both, without an article.
- The competent authorities categorise entities (ključni i važni subjekti) and notify them; entities do not decide for
  themselves: owner confirmed 2026-11-08. On the page: one sentence at the end of the NIS2 paragraph.
- The GDPR supervisory authority is the Agencija za zaštitu osobnih podataka (AZOP): owner confirmed 2026-11-08. On the page: the GDPR
  paragraph names it; captions still say only "nadzorno tijelo".
- Financial entities follow DORA for ICT incidents, with their own reporting timings, supervised by the Hrvatska
  narodna banka and HANFA: owner confirmed 2026-11-08. On the page: the "Simplified" paragraph, without timings.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *awareness* (saznanje): the official texts' "od saznanja", "nakon saznanja".
- *triage* (trijaža): used in Croatian incident handling; "početna procjena" was dropped because the Croatian NIS2
  text uses it for the notification's initial assessment, a different thing.
- *early warning* (rano upozorenje), *incident notification* (obavijest o incidentu), *final report* (završno
  izvješće), *significant incident* (značajan incident): the Croatian NIS2 text.
- *personal-data breach* (povreda osobnih podataka), *supervisory authority* (nadzorno tijelo), *competent CSIRT*
  (nadležni CSIRT): the Croatian GDPR and NIS2 texts, as the task lists them.
- *without undue delay* (bez nepotrebne odgode; GDPR's Croatian text says "bez nepotrebnog odgađanja").
- *on call* (dežurstvo), *office hours* (radno vrijeme), *the person who files* (tko prijavljuje).

## Shared requests

- **Promote `clocks.js` to `models/clocks.js`** (catalogue §5.24) before `cmp-breach-triage` starts. Its rule tests are
  the tie-break block and rules 1-8 of `sim.test.js`.

## Checks

- `node --test sims/cmp-incident-clocks/sim.test.js`: 38 tests (tie-breaks first, then clocks rules 1-8 including the
  "only the early warning can be missed" claim over every hour of the week, sim rules 9-12, every caption key reachable,
  the six presets, strings, page, generic block).
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md` and ran 68 mutations of
  `clocks.js` and `sim.js`: 52 killed, 6 equivalent, 10 survived. All ten now have tests and a re-run kills each
  (15 mutations re-run, 15 killed): the ghost tie-break in the summary, the GDPR-only +72 h caption, the axis margin
  and gap width, the axis and `lastFiled` with a late filing, a negative or fractional step, `'0'` as false, `moment`
  of a negative hour. Its other points were applied: the always-repeated step dropped (8 → 7 steps), `week0` must be
  a Monday and an unknown mode throws up front, stale comments, "triage" renamed (see Term pairs), "0 hours" captions
  (detection at the attack's hour, or exactly 24 h after it) given their own sentences, "N h prije roka" replaced by "N h
  rezerve" / "to spare" (true at 0), "Sat je tekao" → "Rok je tekao", en "the first to be missed", Croatian quotes „…“,
  and a "would end at …" sentence instead of a Croatian count that needed agreement. Kept: a late GDPR filing is marked
  ✗ even though art. 33 allows it "where feasible" with reasons (the result text says "with reasons for the delay"; it
  cannot happen with the page's hours).

## Time

Start 13:50, done 14:22 (2026-11-07), one session (32 minutes).
