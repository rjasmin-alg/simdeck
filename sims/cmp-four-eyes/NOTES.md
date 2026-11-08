<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-four-eyes: notes

New explorer (task `docs/tasks/w3/cmp-four-eyes.md`, catalogue `cmp-four-eyes` §4.13, the approval queue on top of
§5.24's people × roles × rights model). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The record beside what happened.** The stage's first card is the record: 300 of 300 requests with two
  signatures, and the test "every request has a second signature" passes, under every setting. Beside it the catch
  count. The contrast the compliance notes ask for (written vs operating) is the stage: the card never changes while
  the catches fall from 9 to 0.
- **A fixed stream, a variable queue.** The team's month of requests is fixed (300, 30 high-risk, 12 bad, 9 of them
  high-risk); the approver's queue (10…160 a day) sets the minutes each. So the same twelve bad requests are judged
  under every setting, and the tiles do not jump around when the load changes.
- **Common random numbers.** Each request has one draw; it is caught when the draw is under p. More time never catches
  fewer, an independent approver never catches fewer than a colleague, and both policies are judged on the same
  draws. The bars show the count and the expected rate (a marker), as `cmp-privileged-access` does.
- **Both policies always on the stage.** "Everything the same" and "By risk" are two bars on the same stream; the
  policy switch outlines one and drives the day bar and the tiles. The catalogue's "compare reviewing everything with
  reviewing by risk" needs no toggling.
- **The look.** p = q · (1 − e^(−t/4 min)), zero under a minute. The exponential is the random-search detection formula
  (Koopman), a standard shape; the constants are made up. The 1-minute floor makes "approval becomes automatic" literal:
  at 80 a day (45 s each) every request is signed unread. Independence is a factor q = 0.25: a colleague or a
  subordinate looks but rarely objects.
- **Depth.** In depth is 15 minutes; when the share times the load does not fit the hour, the in-depth reviews share
  the hour and the rest get 0. The caption calls an in-depth review under 5 minutes thin (preset 5).
- **Shares 10–50 %, loads 10–160.** Every pair gives a whole number of in-depth reviews a day, so the day bar shows
  whole slots. A 5 % share was dropped for that reason.
- **The approver's hour** is drawn as one slot per request, as wide as its minutes; unread slots are hatched.
- **The shared model** (`approval.js`, §5.24): the stream, the minutes, the depth order, the look and the record. Pure,
  wordless, registers as `SimdeckModels['approval-queue']`. It does not use `cmp-jml-drift`'s `access.js` (nothing
  here is about who holds which right), only its generator, mulberry32, copied with a comment
  `// from sims/cmp-jml-drift/access.js @ 59b7f46`. `access-rights` was not in `models/` when this started.
- **Seed 26** for the presets (SPEC): the catches stay within 0.8 of the expected count for every preset.
- **Words:** no glossary terms (`[[…]]`); the explanation writes the terms out (Croatian bold, English in italics in
  brackets), as the other `cmp-` pages do; the page does not link `glossary.js`. Minutes under one are shown in seconds
  (45 s, 23 s). "Not legal advice, made-up firm, people and numbers" is said once, in the stage's foot.
- **No answer keys:** nothing from `dr-lecture-estate/instructor/`; the entry has no estate seed.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- "Send a stream of requests" is a fixed month of 300 with a "New requests" button (N) that draws another month; the
  number of bad ones is fixed (12) so the counts compare across settings.
- Five presets (the task asks 3–6).
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-four-eyes/`; open questions are in the report instead.

## Sources

- ISO/IEC 27001:2022, Annex A 5.3, segregation of duties, by number only. *(check: number and title against the 2022
  edition)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(i): "human resources security, access control policies and asset
  management", EUR-Lex. *(check: the point letter, and the official Croatian wording; the page says "politike
  kontrole pristupa")*
- B. O. Koopman, *Search and Screening* (1946; 1980): the random-search formula p = 1 − e^(−t/τ). *(check: that the
  shape is fair for a human reviewer; the constants are made up and the page says so)*
- Design vs operating effectiveness (a signature shows the control exists; looking again at approved requests shows
  whether it works): general audit practice, as in `cmp-policy-to-record`, `cmp-audit-sampling`.
- All numbers (10 % high-risk, 12 bad of 300, the hour a day, 15 minutes in depth, q = 0.25) are illustrative (the
  page says so once). The preset numbers are checked by the Python script in `SPEC.md`, an independent
  re-implementation.

## For the owner

- Catalogue §4.13 lists no Croatian detail for this entry. Whether the regulation under the Zakon o kibernetičkoj
  sigurnosti (NN 14/2024) names a four-eyes or dual-approval requirement in its own words *(open: not stated by the
  owner; source: Narodne novine)*; not on the page.
- For financial entities, DORA (Regulation (EU) 2022/2554) and the HNB/HANFA expectations on dual control of payments
  *(check)*; not on the page.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place (načelo četiri oka and razdvajanje dužnosti
are the owner's, settled 2026-11-07):

- *approver* (odobravatelj), *second signature* (drugi potpis), *bad request* (neispravan zahtjev), *rubber stamp*
  (formalnost; on the stage "potpis bez čitanja", signed unread), *review by risk* (pregled prema riziku),
  *in-depth review* (detaljan pregled), *independent* (neovisan), *the record* (zapis).

## Shared requests

- For the kit: `.sd-ctl[hidden] { display: none; }` again (as in `cmp-sod-toxic`, `cmp-privileged-access`): the kit's
  `.sd-ctl { display: flex }` overrides the `hidden` attribute.
- For the kit: a small "stage button" style (`.fe-b` here, `.pa-b` in `cmp-privileged-access`, `.sx-b` in
  `cmp-sod-toxic`); three sims now draw the same thing.
- For the coordinator: `approval.js` can be promoted to `models/approval-queue.js`; its tests are the rule 1–6 blocks
  of `sim.test.js`. `rng` in it, in `privileged.js` and in `access.js` is the kit's mulberry32; a shared copy would
  let all three drop theirs.

## Checks

- `node --test sims/cmp-four-eyes/sim.test.js`: 29 tests. Tie-breaks first (exactly one minute looks, depth order
  high-risk then routine by arrival, draws in arrival order from their own stream, common random numbers, the hour
  used in full), then rules 1–8, the presets against SPEC, the generic block.
- Fresh reviewer (a separate agent, no part in the build) checked the code against `SPEC.md`, ran the Python check
  (identical output) and 58 mutants: 44 killed, 13 survivors (one no-op excluded). Applied: the "rest signed unread"
  note claimed a bad request passes even when every bad one was inside the in-depth share (seed 28, 10 a day, 50 %),
  now only when one does; in-depth requests under a minute (160 a day, 50 %) were drawn as reviewed in depth, now as
  signed unread in the tiles and the day bar; caption wording ("the rest … each", "reviewed evenly", "Isti red,
  jednako za sve"), "A quiet day" / "Miran dan", "Pola reda „detaljno”"; unused compute fields dropped; SPEC states
  the rounding and the sub-minute in-depth case, and its script prints seed 26's positions. Tests added for the real
  survivors: u = p not caught, exactly one minute is looked, rounding of a fraction, the seed-26 shuffle (a Sattolo
  shuffle passed every other check), a non-numeric seed, the in-depth floor. Equivalent survivors left: `<=` vs `<`
  on values the grid never reaches, `Math.max(0, …)` (never negative by construction).
- Gate: `npm run gate -- cmp-four-eyes` passes (46/46 browser checks); screenshots at 1920×1080 light, dark,
  grayscale and 375×812 in both languages reviewed, plus every preset, 20 a day by risk, colleague in dark, and
  160 a day with 50 % in depth. The first gate run failed text size on the phone: a `<sup>` in the explanation
  (13 px); the formula is now written inline.
- Left for the coordinator: the hr explanation writes the Croatian term first in bold, the English in brackets (as
  `cmp-sod-toxic` and `cmp-privileged-access` do); COMMON §4's term rule puts the English first.

## Time

Start 23:05, done 23:31 (2026-11-08), 26 minutes, one session.
