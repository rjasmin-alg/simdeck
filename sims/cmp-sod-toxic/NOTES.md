<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-sod-toxic: notes

New explorer (task `docs/tasks/w3/cmp-sod-toxic.md`, catalogue `cmp-sod-toxic` §4.13, a reader of §5.24's people ×
roles × rights model). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Eight duties, four toxic pairs, exactly the catalogue's four.** request + approve a purchase, create + pay a
  supplier, write code + deploy to production, run the backups + manage the logs. A real ruleset has more pairs; four
  disjoint ones keep the matrix readable and the minimum provable per pair (SPEC rule 5). Pairs sit next to each
  other, so the forbidden cells are the matrix's sub-diagonal staircase, each outlined in ink and filled by its worst
  conflict; the allowed cells show how many hold both duties in muted grey, the diagonal the holders against the need.
- **Why a small team cannot separate: who may hold what.** Two departments (office, IT, alternating, so 3 people =
  2 + 1). The money duties are the office's, the production duties IT's, the logs anyone's (the log store can be run
  outside IT, which is what makes a compensating control possible in a team of three). Without that constraint four
  disjoint pairs separate with two people and the "shrink the team" contrast disappears.
- **Deputies.** "A deputy for every duty" (two holders, for holidays and sick leave) is the second lever: it doubles
  the people separation needs (from 4 to 8). Presets 2 → 3 → 6 show it. The catalogue does not name deputies; they are
  the realistic reason a team of six still cannot separate, and they stay inside the one concept.
- **Compensating control rule.** It holds when the person cannot edit the log the review reads (does not hold the
  logs duty) and someone independent (holding neither duty of the pair) reviews it. So a control can never fix
  backups + logs, and preset 5 shows a control that proves nothing until the logs move to someone else. The "no
  reviewer" half of the rule cannot happen in this team (the other department never holds a pair's duties); it stays
  in `sod.js` for teams laid out differently, tested there, and has no caption note.
- **Three resolutions, three outcomes.** Split prevents (the cell's conflict disappears); a control that holds
  *detects* (afterwards, at the review); acceptance with a signature leaves the risk *undetected but on record*. The
  verdict box says "Audit: finding" while anything is open or a duty is short. Accepting is always possible, even
  where splitting was; the caption then says how many the team could still separate.
- **Explorer with click state in hidden params.** Assignments are one duty mask per person (`m0…m11`, as
  `cmp-jml-drift` keeps rights as bit masks), resolutions one base-3 number per person (`r0…r11`), plus `edit`. With
  `edit` off the page shows the shared-out assignment for the team (SPEC rule 6), so moving the team slider shows the
  best a team of that size can do at once; the first click on a cell switches to the student's own assignment, and
  `S` ("Share out the duties") goes back. People beyond the team keep their masks. Everything is in the URL.
- **Split is a button.** It moves one duty to the least busy person who may hold it and holds neither half (SPEC
  rule 7); when nobody can, it is `aria-disabled` and the caption says why. Students can also move duties by clicking
  cells; a click on the other department's cell is refused with a reason (`aria-disabled`, focus kept).
- **The list shows six conflicts** (two columns of three) and "+ n more"; more rows squeeze the grid below the
  projector's one screen. The matrix and the counters always show all of them.
- **The shared model** (`sod.js`, §5.24): duties, rules, who may hold what, holders, short duties, conflicts, the
  matrix, the minimum, sharing out, split, control. Pure, wordless, registers as `SimdeckModels['sod']`. It does not
  use `cmp-jml-drift`'s `access.js` (that is a department of four teams and two years of events; nothing here moves
  over time), only the same representation: one bit mask per person, and its `popcount`, copied with a comment
  `// from sims/cmp-jml-drift/access.js @ 59b7f46`. `access-rights` was not in `models/` when this started.
- **Words:** no glossary terms (`[[…]]`); the explanation writes the pairs out (Croatian bold, English in italics in
  brackets), as the other `cmp-` pages do; the page does not link `glossary.js`. Croatian captions avoid number
  agreement with "label: n" forms ("otvorenih: 2") and plural forms for the main count. People's names are made up and
  the same in both tables. "Not legal advice, made-up firm and people" is said once, in the stage's foot.
- **No answer keys:** nothing from `dr-lecture-estate/`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- Deputies and the two departments are added (above): the task's "shrink the team until separation becomes
  impossible" needs a reason a small team cannot separate.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-sod-toxic/`; open questions are in the report instead.

## Sources

- ISO/IEC 27001:2022, Annex A 5.3, segregation of duties ("conflicting duties and conflicting areas of responsibility
  shall be segregated"; paraphrased, not quoted), by number only. *(check: number and title against the 2022 edition)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(i): "human resources security, access control policies and asset
  management", EUR-Lex. *(check: the point letter, and the official Croatian wording; the page says "politike
  kontrole pristupa")*
- Conflict matrices (SoD rulesets), compensating controls and risk acceptance: common audit and identity-governance
  practice; no standard number on the page.
- DORA, Regulation (EU) 2022/2554, art. 9(4)(c) (access limited to what the function needs) applies to financial
  entities; not on the page. *(check)*
- Team sizes, departments, names and who may hold which duty are illustrative (the page says so once). The minimum
  per team size is checked by the brute-force Python script in `SPEC.md`.

## For the owner

- Catalogue §4.13 lists no Croatian detail for this entry. Whether the regulation under the Zakon o kibernetičkoj
  sigurnosti (NN 14/2024) names segregation of duties in its own words *(open: not stated by the owner; source: Narodne novine)*; not on the
  page.
- Whether "deputies" belong on this page or only in `cmp-four-eyes` (they double the people needed; here they are a
  toggle, default off).

## Settled

- NIS2 is implemented in Croatia by the Zakon o kibernetičkoj sigurnosti (NN 14/2024) and a government
  regulation under it (catalogue §4.13): owner confirmed 2026-11-08. Not on the page; the catalogue line does not name this entry.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place (razdvajanje dužnosti and načelo četiri
oka are the owner's, settled 2026-11-07):

- *toxic combination* (nespojiva kombinacija; the catalogue's title says "nespojive kombinacije ovlasti"),
  *conflict matrix* (matrica sukoba), *compensating control* (kompenzacijska kontrola), *risk acceptance*
  (prihvaćanje rizika, "prihvati rizik potpisom"), *deputy* (zamjena), *independent review* (neovisni pregled),
  *duty* (dužnost), *holder* (nositelj dužnosti), *audit finding* (nalaz revizije, "Revizija: nalaz").

## Shared requests

- For the kit: `.sd-ctl[hidden] { display: none; }` is needed by every page with hidden params (this one,
  `cmp-risk-register`, `cmp-jml-drift` each add it); the kit's `.sd-ctl { display: flex }` overrides the `hidden`
  attribute. Smallest change: add that rule to `kit.css`.
- For the coordinator: `sod.js` can be promoted to `models/sod.js` (or merged into `models/access-rights.js` as a
  `conflicts(masks, rules)` family) when `cmp-four-eyes` or `cmp-privileged-access` starts; its tests are the
  rule 1–8 blocks of `sim.test.js`.

## Checks

- `node --test sims/cmp-sod-toxic/sim.test.js`: tie-breaks first (sharing out by fewest duties then id, the logs to
  someone without a conflict, split's second-duty-first and taker order, the reviewer by id, conflict order), then
  rules 1–12, the presets against SPEC, the generic block.
- Mutation check (mine): 26 deliberate breaks of `sod.js` and `sim.js`, one per rule or tie-break; all 26 make a test
  fail (one survivor at first, the logs preference, now covered by the n = 7 with deputies case where it matters).
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md`, ran the Python check and
  the preset table in node (all matched), and ran 38 mutants of its own (28 killed; of the 10 survivors 4 were
  equivalent). Applied: sharing out now puts the unavoidable overlaps on someone already in conflict, so in preset 3
  (and n = 5–7 with deputies) every conflict's control can hold; before, Bruno got the logs and no control could ever
  hold for him, which contradicted the caption's advice. Tests added for the real survivors (`edit` 0/'0', an empty
  `team`, one short duty, `canSplit`, no logs note on accepted conflicts, the minimum wired to team and deputies,
  avoidable ≥ 0). SPEC's check script now prints its table; rule 8b's reasoning corrected; the list's six-row cap
  and kept resolutions stated in SPEC. Keyboard focus after a split moves to the next button. Strings: preset 3's
  hint (three in the office and three in IT), gender-neutral Croatian for the abuse phrases ("Moguća zlouporaba:
  …"), "ljudi s obje dužnosti" instead of "oboje", English number agreement in the matrix labels, the hr concept
  now says "može", "počiniti prijevaru" / "commit fraud", "nositelj ili zamjena", the detected caption's subject,
  "zapisima (logovima)" once in the explanation, the clean caption no longer reads as "separation prevents fraud"
  (now: nobody can do it and hide it alone). Left as is: resolutions survive a team change (stated in SPEC);
  Croatian-first term pairs in the explanation, as the sibling `cmp-` pages do.
- Gate: `npm run gate -- cmp-sod-toxic` passes (46/46 browser checks); screenshots at 1920×1080 light, dark,
  grayscale and 375×812 in both languages reviewed, plus the presets, 12 people with deputies and the worst case
  (everyone holds everything, 24 conflicts) at 1920×1080. Clicks, split, control, accept, S, refusals and URL state
  checked in a browser with no console errors.

## Time

Start 14:27, done 15:00 (2026-11-07), 33 minutes, one session.
