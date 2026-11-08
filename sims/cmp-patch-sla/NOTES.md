<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-patch-sla: notes

New explorer (task `docs/tasks/w3/cmp-patch-sla.md`, catalogue `cmp-patch-sla` §4.13). Rules and expected numbers:
`SPEC.md`.

## Decisions

- **The contrast is the stage.** Four numbers across the top: the two the report shows (fixed in time, average time
  to fix, green and ticked) beside the two it hides (oldest open, open at year end, dashed red). Below them, where the
  exposure is (items against exposure, split by systems with and without an owner: 13 % of the items, 80 % of the
  exposure in preset 1), and the known-exploited exposure under both queue orders on the same stream. At the bottom
  the tail itself: every item open at year end as a tile, by age, in two lanes, with each severity's deadline as a
  line.
- **A year, a steady stream.** 365 days, 2–6 items a day (1483 with seed 7), every day a working day. No patch days,
  no weekends: they would add a burst pattern, not the concept.
- **Systems nobody owns are in nobody's queue.** Their items are never fixed unless a dated exception gives one an
  owner. This is the simplification that makes the tail; the explanation says why (nobody plans the work).
- **What the report counts.** Fixed in time ÷ (fixed + open past the deadline); items under an exception and items
  not yet due are left out. That is the common way such a share is computed, and it is what lets an open-ended
  exception lift it (88.8 % → 99.1 %) without fixing anything.
- **Exceptions apply only to overdue items on unowned systems.** That keeps the third control to one meaning: what
  happens to the tail. A dated exception (30 days) names an owner who puts the item in the queue; an item fixed by
  the end date counts as in time (it met the approved date). If it runs out unfixed it is overdue again.
- **The order changes which items stay open, not how many.** The team does the same work either way, so total
  exposure and the open count are identical under both orders (tested); only the exploited exposure moves (2442 →
  126 vulnerability-days in preset 4/5) while the share in time barely does (81.6 % → 81.2 %). The stage always
  shows both orders on the same stream.
- **Deadlines are the yardstick.** They decide in time and overdue, never the queue, so shorter deadlines lower the
  percentage with exactly the same exposure (preset 6, caption note with the share under 15/30/90/180).
- **Deadline steppers on the stage.** Four sliders made the panel 1253 px tall against 926; the deadlines now sit as
  − / + steppers above the chart they change, moving through a list of usual values per severity. The panel keeps the
  order, the team's fixes a day, the systems nobody owns and the exception rule. The seed is kept in the URL; "New
  stream" (N) is on the stage.
- **One model file.** The compliance notes' four shared models (people × roles × rights, risk scoring, incident
  clocks, evidence trail) are not used here, so `sim.js` holds everything; `stream`, `run`, `status` and `measure` are
  pure functions over plain data if `cmp-exceptions` wants the exception rule later. mulberry32 is copied from the
  kit's `Simdeck.rng` so node tests need no kit.
- **Seed 7** for the presets. Seeds 1–10 all show the same contrasts (report 99.1–100 %, unowned share of exposure
  80–95 %, exploited exposure by score 1542–4082 against 100–129 exploited first, tight deadlines 4–6 points lower);
  seed 7 is one where the report reads 99.1 % rather than a suspicious 100 %.
- **Words:** no glossary terms (`[[…]]`); the explanation writes the terms out (Croatian bold, English in italics in
  brackets), as the other `cmp-` pages do; the page does not link `glossary.js`. Numbers are formatted with the
  page's locale. "Simplified, not legal advice, made-up firm, systems and numbers" is said once, in the stage's foot.
- **No answer keys:** nothing from `dr-lecture-estate/instructor/`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The deadlines are stage steppers, not panel controls (panel height, above).
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-patch-sla/`; open questions are in the report instead.

## Sources

- ISO/IEC 27001:2022, Annex A 8.8, management of technical vulnerabilities (information about technical
  vulnerabilities is obtained, exposure evaluated and measures taken; paraphrased, not quoted), by number only.
  *(check: number and title against the 2022 edition)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(e): security in network and information systems acquisition,
  development and maintenance, including vulnerability handling and disclosure, EUR-Lex. *(check: the official
  Croatian wording; the page says "postupanje s ranjivostima")*
- CVSS v3.1 specification (FIRST): the qualitative severity bands 0.1–3.9 low, 4.0–6.9 medium, 7.0–8.9 high,
  9.0–10.0 critical. Named on the page only as "the CVSS scale" in the explanation's source line (a scoring standard,
  not a product).
- Prioritising known-exploited vulnerabilities: the US federal catalogue of known exploited vulnerabilities and its
  two-week remediation rule (CISA, BOD 22-01) is the best-known example; for the builder only, not on the page (no
  agency, not EU).
- Deadlines 15 / 30 / 90 / 180 days, the arrival rate, the shares of severities and of known exploitation, the team's
  rate and the 30-day exception are illustrative (the page says so once). The exploitation shares are chosen so that
  about 8 % of items are known exploited and a third of those are medium, in line with the observation that
  exploitation follows the score only loosely *(check against a public analysis if a number is ever quoted; none is
  on the page)*.
- DORA, Regulation (EU) 2022/2554, art. 9 (ICT security, including patches and updates for financial entities); not
  on the page. *(check the paragraph)*
- The Python re-implementation in `SPEC.md` checks every preset number.

## For the owner

- Catalogue §4.13 lists no Croatian detail for this entry. Whether the regulation under the Zakon o kibernetičkoj
  sigurnosti (NN 14/2024) sets vulnerability handling deadlines or a reporting metric of its own *(open: not stated by the owner; source:
  Narodne novine)*; nothing of it is on the page.
- Whether a fix made inside a dated exception's end date should count as in time (the usual reading: it met the
  approved date; the page says so in the caption) or as late against the original deadline (83.9 % instead of
  93.7 % in preset 3).
- Whether "systems nobody owns are never fixed" is too absolute for the audience (the alternative: fixed at a low
  rate when someone stumbles on them). It is the cleanest way to show the tail.

## Settled

- NIS2 is implemented in Croatia by the Zakon o kibernetičkoj sigurnosti (NN 14/2024) and a government
  regulation under it (catalogue §4.13): owner confirmed 2026-11-08. Not on the page; the catalogue line does not name this entry.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *remediation policy* (politika otklanjanja ranjivosti), *deadline* (rok), *severity* (ozbiljnost: kritična,
  visoka, srednja, niska), *score* (ocjena), *known exploited* (iskorištavana u napadima; short label
  "iskorištavana"), *exposure* (izloženost), *vulnerability-days* (ranjivost-dana), *system nobody owns / orphaned
  system* (sustav bez vlasnika), *exception* (iznimka), *end date* (rok isteka; in labels "rok"), *fixed in time*
  (otklonjeno u roku), *average time to fix* (prosječno do otklanjanja), *queue* (red čekanja), *the tail* (rep).

## Shared requests

- For the kit: `.sd-ctl[hidden] { display: none; }` again (as in `cmp-privileged-access`, `cmp-sod-toxic`,
  `cmp-jml-drift`, `cmp-risk-register`): the kit's `.sd-ctl { display: flex }` overrides the `hidden` attribute.
- For the kit: small stage buttons (`.ps-b` here; `.pa-b` in `cmp-privileged-access`, `.sx-b` in `cmp-sod-toxic`) and
  now a − value + stepper; three sims draw the same button.
- For the kit: a param type "stepper over a list of values" would have let the deadlines stay in the panel at a
  third of a slider's height.

## Checks

- `node --test sims/cmp-patch-sla/sim.test.js`: tie-breaks first (arrival then id in the queue, exploited-first as a
  total order, four draws per item, fixes adding up, fix the day after arrival at the earliest, deadline-day and
  exception end-day boundaries, the exception's day), then rules 1–10, the presets against SPEC, the generic block.
- Mutation check (mine): 29 deliberate breaks of `sim.js`, one per rule or tie-break; 28 make a test fail. The
  survivor swaps the order of the open-ended and dated exception notes, which cannot both apply: equivalent.
- Python re-implementation (`SPEC.md`): identical numbers for every preset.
- Fresh reviewer (a separate agent, no part in the build) checked the code against `SPEC.md`, reproduced every preset
  number and ran 43 mutants of its own. Applied: the "nothing open" caption could never show (two items always
  arrive on day 365), now "nothing open longer than 30 days"; Croatian agreement ("3 pod iznimkom ne broje se",
  "otvorene su 3 ranjivosti": the verb moved into the plural forms); tests for every non-equivalent survivor (the
  share in time under both orders, any single deadline changed, caption note order where two notes can apply, the
  exception notes' guards, rounding of every param, the chart data under dated exceptions and its ages, the
  deadline comparison keeping the exception rule); SPEC rule 8 no longer claims overdue tiles are drawn (the deadline
  lines show it), rule 10 states the guards; dead `queued` and unused strings removed; labels "Sustavi bez vlasnika",
  "Iznimka nakon roka (sustavi bez vlasnika)", "on systems nobody owns"; two explanation lines. Its concept point on
  preset 3 is in the caption now: a dated exception moves the exposure to the same team's systems rather than
  removing it (42 715 → 41 617 in total, owned overdue 9 → 55), and fixes inside the end date count as in time
  (83.9 % if counted against the original deadline); see "For the owner". The ten survivors left are equivalent
  (cases that cannot occur: k ≤ 6 a day, the end date always after the deadline, URL values already clamped,
  exploited first never worse than by score, a total that does not move while the team is never idle).

## Time

Start 16:53, done 17:18 (2026-11-07), one session, including the fresh review.
