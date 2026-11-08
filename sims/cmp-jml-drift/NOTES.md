<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-jml-drift: notes

New explorer (task `docs/tasks/w3/cmp-jml-drift.md`, catalogue `cmp-jml-drift` §4.13, hub of §5.24's people × roles
× rights model). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Two runs on the same events.** The catalogue says "run two years … switch on HR-driven provisioning, roles, removal
  on move and a quarterly review"; the page replays the same joiners, movers, leavers and requests twice, once with no
  controls and once with the switches the student set, so every difference comes from the controls. Both are on
  the same charts (dashed: no controls; solid: yours) and in the numbers table; the matrix shows your controls.
- **Month slider instead of steps.** An explorer: the whole two years are computed from the params, and `month`
  (0–24, default 24) picks what the numbers, chart markers and matrix show. Dragging it from 0 shows the drift grow.
- **The shared model is `access.js`** (§5.24): department, events, joiner/mover/leaver/request rules, review, month
  numbers. Pure, wordless, no dependencies; registers as `SimdeckModels['access-rights']`, ready to move to
  `models/access-rights.js` unchanged. `sim.js` adds params, presets, the two-run comparison, the matrix order and
  the caption. `cmp-sod-toxic` and `cmp-privileged-access` can read `replay(...).accounts` (team, roles, direct
  rights per account at a month).
- **Where the creep comes from** (each a rule, not emergent): one-off requests (granted directly, never expire), moves
  without removal, and joiners set up as a copy of a colleague (copying the colleague's surplus). With roles there is
  no copying and a move swaps a role; one-off grants still happen, so roles + removal on move end near, not at,
  least privilege (0.9 per person in preset 5).
- **HR-driven provisioning** is modelled only where the concept needs it: HR's record of a departure closes the
  account on the last day (the DR handbook's "leavers disabled on their last day"). Without it the manager tells IT
  half the time. Joiners and movers are processed the same either way.
- **The reviewer reads from the top.** The first model (each line read with chance care ÷ lines, fresh each quarter)
  let a 400-line review halve the surplus over eight quarters, which contradicts the concept's "a reviewer shown 500
  lines approves them all". Now the reviewer reads the first `care` lines with care and approves the rest unread,
  and the list is sorted by name the same way every quarter, so the same people are checked again and the rest
  never. One reviewer for 424 lines (preset 3) removes 6 of 106 unneeded rights in the last review; team leads (about
  110 lines each) remove much more; with roles a list is short enough to be read in full. A read leaver's line closes
  the account. The explanation says the reviewer approves the rest unread; the "sorted by name" detail is in SPEC.
- **Review scope as the "chosen size".** The task's "quarterly review of a chosen size" is two controls: who reviews
  (one reviewer for the department or each team lead for their team) and how many lines a reviewer reads with care
  (10–500, default 50). The list length itself follows from roles and the drift.
- **Seed 949** for the presets: the closest of seeds 1–3000 to the long-run averages (SPEC "Over many runs"). The one
  reviewer's last list is 424 lines (405 on average), so the page says "hundreds of lines" rather than 500.
- **Matrix:** columns are open accounts (active people grouped by team, then leavers' open accounts under ⊘), rows the
  20 rights grouped by team. Needed = solid in the team's colour, unneeded = hatched with a danger outline, leaver's
  account = cross-hatched in ink; the grayscale screenshot keeps all three apart. Team colours repeat on the row
  labels and the group headers, so the block diagonal reads as "each team's own rights".
- **Words:** the rights are generic business functions (customers, ledger, payroll, tickets, stock …), no products.
  No glossary terms (`[[…]]`): the explanation writes the pairs out (Croatian bold, English in italics in brackets),
  as the other `cmp-` pages do; the page does not link `glossary.js`. Croatian captions avoid number agreement with
  "label: n" forms ("Uklonjeno nepotrebnih prava: 6 od 106").
- **No answer keys:** nothing from `dr-lecture-estate/instructor/`; the only estate input is the student handbook's
  leaver rule.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The review's "chosen size" is the reviewer scope plus the lines read with care (above).
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-jml-drift/`; open questions are in the report instead.

## Sources

- ISO/IEC 27001:2022, Annex A 5.15 (access control), 5.16 (identity management), 5.18 (access rights: provisioning,
  review at planned intervals, removal or adjustment on a change of role or termination), by number only.
  *(check: the control numbers and titles against the 2022 edition)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(i): "human resources security, access control policies and asset
  management", EUR-Lex. *(check: the point letter, and the official Croatian wording; the page paraphrases it as
  "sigurnost ljudskih potencijala, politike kontrole pristupa i upravljanje imovinom")*
- DR `student/handbook/it-wiki.md`: leavers are disabled on their last working day (the estate's rule; the "HR
  records" switch). Not cited on the page.
- Role-based access, access recertification and rubber-stamping: common identity-governance practice; no standard
  number on the page.
- All rates, team sizes and counts are illustrative (the page says so once). Checked by the Python script in
  `SPEC.md`, which reproduces every preset row.

## For the owner

- Catalogue §4.13 lists no Croatian detail for this entry. Whether the regulation under the Zakon o kibernetičkoj
  sigurnosti (NN 14/2024) lists access rights reviews or a review interval in its own words *(open: not stated by the owner; source:
  Narodne novine)*; not on the page. GDPR is not cited: least privilege follows from art. 5(1)(f) and art. 32 only
  indirectly, and the page keeps to the two texts that name access control.

## Settled

- NIS2 is implemented in Croatia by the Zakon o kibernetičkoj sigurnosti (NN 14/2024) and a government
  regulation under it (catalogue §4.13): owner confirmed 2026-11-08. Not on the page; the catalogue line does not name this entry.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place (dolazak, premještaj, odlazak is the
owner's, settled 2026-11-07):

- *least privilege* (načelo najmanjih ovlasti), *privilege creep* (gomilanje ovlasti), *orphaned account* (napušteni
  račun; on the stage "otvoreni računi otišlih"), *access review* (pregled prava pristupa; the control says "pregled
  prava"), *role-based access* (pristup temeljen na ulogama; the control says "Prava kroz uloge"), *rubber-stamping*
  (odobravanje naslijepo; on the page "ostali odobreni nepročitani"), *HR records* (kadrovska evidencija; the control
  says "Kadrovska zatvara račune"), *one-off grant* (pojedinačno pravo), *unneeded right* (nepotrebno pravo).

## Shared requests

None for the kit. For the coordinator: promote `access.js` to `models/access-rights.js` when `cmp-sod-toxic` or
`cmp-privileged-access` starts (§5.24); its tests are the "rules 1–7" block of `sim.test.js`.

## Checks

- `node --test sims/cmp-jml-drift/sim.test.js`: 31 tests; boundaries and tie-breaks first (strict thresholds, the
  mover's team and the request's right, review order by name then id, exactly `care` lines read with roles first,
  the same people first every quarter), then rules 1–10 (including the order within a month and each caption note's
  own condition), the six presets against SPEC, the orderings over seeds 1–60, the generic block.
- Mutation check (mine): 31 deliberate breaks of `access.js` and `sim.js`, one per rule or boundary; 30 made a test
  fail. The survivor (clearing every role on a move instead of the old one) is equivalent: with removal on move an
  account only ever holds one role.
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md`, ran the Python check and
  compared Python and JS on seeds 1–200 for all six presets (no difference), and ran 59 mutants of its own. Applied:
  SPEC now states the order within a month (leavers, joiners copying before moves, movers, requests, review), that
  removal on move takes the whole old team's rights, the seventh draw when nobody is left to copy, numeric toggles
  and ±Infinity in rule 9, the y scale as "rounded up", tooltips on held rights only, and what the Python script does
  and does not check. Tests added for its 12 real survivors (matrix taken after the review, only open accounts in
  the matrix and leavers by id, joiners copy before moves, requests after moves, copied counts up to the month, each
  caption note's condition, seed rounding); re-run: all killed. Strings: screen-reader labels and the copy note in
  "label: n" form, the leaver's tooltip and legend without gender ("nakon odlaska"), "s koleginim viškom", the leaver
  cell's outline dashed like its legend, the explanation no longer says reviews without roles remove little (team
  leads do remove much; it now says one reviewer for the whole department does, and that the list comes in the same
  order every time), the team-review hint says it takes four readers, and "numbers are made up" appears once (the
  foot). Left as is: team review ends with fewer unneeded rights than roles alone (0.5 against 0.9); the hint and the
  explanation say what it costs, and preset 6 shows roles plus the same review.

## Time

Start 13:15, done 13:46 (2026-11-07), one session.
