<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-privileged-access: notes

New explorer (task `docs/tasks/w3/cmp-privileged-access.md`, catalogue `cmp-privileged-access` §4.13, a reader of
§5.24's people × roles × rights model). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Same thefts, two settings, side by side.** The catalogue says "give a team standing or just-in-time admin rights,
  steal a credential at a random hour many times and count". The thefts come from their own seeded stream and do not
  depend on the mode or on the windows, so the stage always shows both bars: standing rights hit every theft (100 of
  100), just in time hits the few that fall into a window (4 of 100). The mode switch decides which bar is outlined,
  which windows the week shows and which sentence the caption reads. The contrast is the stage, as the compliance
  notes ask.
- **A week, not a year, on the stage.** One row per administrator, 168 hours, working hours shaded, windows filled,
  every theft marked ✕ (with rights) or ○ (without). The windows repeat every week (a simplification; SPEC rule 2),
  so a week shows the whole year's pattern, and the year appears as numbers: 8760 admin hours a person against 312.
- **Windows inside working hours, no overlap.** Elevations sit in slots of the working week (Mon–Fri 08–16), so the
  expected share is exact (`per` · `len` / 168) and a second lever appears for free: thefts only in working hours
  (phishing happens while people work) raise the share to `per` · `len` / 40, and a window as long as the working day
  every day is "just in time in name only" (preset 4: 100 %).
- **What "the window" means here.** A stolen admin session (or token) that the attacker uses at once: it carries
  admin rights if the person is elevated at that hour. A stolen password kept for later is out of scope (the thief
  could wait for a window); requesting an elevation is stopped by the approval (someone else approves it). Both are
  said in the explanation and SPEC rule 5, not modelled.
- **The break-glass account as six stages driven by a button.** Sealed → identity system down → opened (two people,
  two halves) → alert → review → resealed, with two switches: a real outage or an ordinary day, and the alert on or
  off. Four outcomes: justified, known (outage but no alert: a finding), caught (no outage, alert: a finding, caught at
  once), unnoticed (no outage, no alert: the password stays out of the safe). While the identity system is down the
  week shows a banner: nobody can get an elevation, which is why the account exists. The account itself is not in the
  theft count: it is sealed, never used for daily work, so there is no session to steal; the explanation says so.
- **Controls on the stage.** The panel must fit 1080 px without its own scroll (the gate checks it). With six presets
  and the four main controls (mode, elevations a week, length, thefts in working hours) there is no room for more, so
  the theft count (10 / 100 / 1000), "New thefts" (N) and the break-glass controls ("Next stage" G, outage, alert) sit
  on the stage next to what they change. Team size and seed are kept in the URL only (`team`, `seed`): the team's
  size does not change the share, and four rows read best on a projector.
- **The shared model** (`privileged.js`, §5.24): the week, windows, thefts, the expected share, the break-glass stages.
  Pure, wordless, registers as `SimdeckModels['privileged-access']`. It does not use `cmp-jml-drift`'s `access.js`
  (a department of four teams over two years; nothing here is about who holds which right), only the same generator,
  mulberry32, copied with a comment `// from sims/cmp-jml-drift/access.js @ 59b7f46`. `access-rights` was not in
  `models/` when this started.
- **Seed 42** for the presets: one of five seeds in 1–999 whose hits match the rounded expected numbers for presets
  2 and 3 (SPEC).
- **Words:** no glossary terms (`[[…]]`); the explanation writes the terms out (Croatian bold, English in italics in
  brackets), as the other `cmp-` pages do; the page does not link `glossary.js`. Numbers are formatted with the page's
  locale (8.760 / 8,760; 3,6 % / 3.6 %). People's names are made up and the same as in `cmp-sod-toxic`. "Not legal
  advice, made-up firm, people and numbers" is said once, in the stage's foot.
- **No answer keys:** only the student handbook's line on Domain Admins and the break-glass account; nothing from
  `dr-lecture-estate/instructor/`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- "Thefts only in working hours" is added (a toggle): it is what makes "just in time in name only" visible, and it
  stays inside the one concept (the size of the window against when credentials are stolen).
- Team size is a URL param, not a control (panel space, above).
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-privileged-access/`; open questions are in the report instead.

## Sources

- ISO/IEC 27001:2022, Annex A 8.2, privileged access rights (the allocation and use of privileged access rights is
  restricted and managed; paraphrased, not quoted), by number only. *(check: number and title against the 2022
  edition)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(i): "human resources security, access control policies and asset
  management", EUR-Lex. *(check: the point letter, and the official Croatian wording; the page says "politike
  kontrole pristupa")*
- Just-in-time elevation, break-glass (emergency access) accounts with split, sealed credentials, an alert on use and
  a review afterwards: common identity-governance practice; no standard number on the page.
- DORA, Regulation (EU) 2022/2554, art. 9(4)(c) (access limited to what the function needs, for financial entities);
  not on the page. *(check)*
- DR `student/handbook/it-wiki.md`, "Accounts": Domain Admins and the break-glass administrator account.
- Team size, elevations, lengths, working hours and thefts are illustrative (the page says so once). The expected
  share and the preset numbers are checked by the Python script in `SPEC.md`, an independent re-implementation.

## For the owner

- Catalogue §4.13 lists no Croatian detail *(check)* for this entry. Whether the regulation under the Zakon o
  kibernetičkoj sigurnosti (NN 14/2024) names privileged accounts, emergency accounts or time-limited rights in its own
  words *(check; source: Narodne novine, the Uredba o kibernetičkoj sigurnosti)*; not on the page.
- Whether "thefts only in working hours" should stay a toggle or become the default (it is the more realistic case
  and the more sobering number: 15 % instead of 3.6 %).

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place (račun za hitne slučajeve is the owner's,
settled 2026-11-07):

- *standing privileges* (stalna administratorska prava), *just-in-time access* (privremena prava; the catalogue's
  Croatian title says "stalna ili privremena administratorska prava"), *elevation* (podizanje ovlasti),
  *credential* (vjerodajnica), *identity system* (sustav identiteta), *alert* (upozorenje), *review afterwards*
  (naknadni pregled), *resealed* (ponovno zapečaćen), *privileged access rights* (povlaštena prava pristupa, ISO
  8.2's title, in the explanation's source line).

## Shared requests

- For the kit: `.sd-ctl[hidden] { display: none; }` again (as in `cmp-sod-toxic`, `cmp-jml-drift`,
  `cmp-risk-register`): the kit's `.sd-ctl { display: flex }` overrides the `hidden` attribute.
- For the kit: a small "segmented buttons" and "pressed toggle button" style for controls drawn on the stage
  (`.pa-seg`, `.pa-b` here; `cmp-sod-toxic` has `.sx-b`). Two sims now draw the same thing.
- For the coordinator: `privileged.js` can be promoted to `models/privileged-access.js`; its tests are the rule 1–8
  blocks of `sim.test.js`. `rng` in it and in `access.js` is the kit's mulberry32; a shared `models/` copy would let
  both drop theirs.

## Checks

- `node --test sims/cmp-privileged-access/sim.test.js`: tie-breaks first (window end exclusive, slot order, schedules
  by person independent of team size, three draws per theft), then rules 1–10, the presets against SPEC, the generic
  block.
- Mutation check (mine): 28 deliberate breaks of `privileged.js` and `sim.js`, one per rule or tie-break; 27 make a
  test fail. The survivor swaps the order of the "always in a window" and "no hit" notes, which cannot both apply
  (an expected share of 1 hits every theft): equivalent.
- Fresh reviewer (a separate agent, no part in the build) checked the code against `SPEC.md`, ran the Python check
  (identical output) and its own mutants. Applied: the theft is now a stolen *session* used at once, and the
  explanation says the attacker cannot get an elevation approved (with a stolen password the model would not hold);
  "{h} h" in the caption (Croatian "52 sata" vs "312 sati" agreement); stage labels on the silent and unnoticed paths
  ("Bez upozorenja", "Bez pregleda", "Nije zapečaćen") so a chip never contradicts the outcome; focus kept on a stage
  button when N or G re-renders; the preset 3 hint and the working-hours note no longer say the windows are open in
  working hours; "nijedan"; the safe instead of an envelope; "odgovara za to" softened to a finding for management;
  the identity-system banner also says nobody can sign in as an administrator; the unused `expectedHits` removed;
  SPEC's disabled controls, seed count and the kit's toggle parsing corrected. Tests added for its real survivors:
  the just-in-time share under standing rights, idpDown without an alert, thefts and schedules of people 4–7, the
  page numbers with team ≠ 4 and 1000 thefts, exactly one hit, each boolean spelling, empty values, rounding, the
  stage names. Left as is: 52 · 168 = 8736 vs 8760 hours (3.57 % vs 3.56 %, negligible).
- Gate: `npm run gate -- cmp-privileged-access` passes (46/46 browser checks); screenshots at 1920×1080 light, dark,
  grayscale and 375×812 in both languages reviewed, plus every preset, 1000 thefts in dark and the unnoticed path.
  The grayscale screenshot showed the ✕ marks lost on the dark windows; they now sit in a light ring.

## Time

Start 15:07, done 15:30 (2026-11-07), 23 minutes, one session.
