<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-log-evidence: notes

New stepper (task `docs/tasks/w3/cmp-log-evidence.md`, catalogue `cmp-log-evidence` §4.13; seed: `lnx-log-path`,
`win-ipam-audit`, `ntp-sync`; evidence on top of the trail model, §5.24). Rules and expected numbers: `SPEC.md`.

## Decisions

- **One night, four properties.** The scenario is fixed (an admin account logs in, makes a new admin, copies the
  customer folder, deletes the local logs); the params switch each property of a log as evidence on or off: out of
  reach (`store`), clocks (`drift`), complete (`fileReads`), long enough (`keep` against `found`), and the log's own
  rule (`readers`). Each preset changes one of them against the central store.
- **The gateway is out of adm07's reach** (it is no admin there), so even with logs only on the hosts one question is
  answered. That is the "out of reach" point made by the scenario itself, not only by the store.
- **The deletion leaves a visible gap** on the hosts ("log begins at 23:31"), so with no store the tamper question is
  "partly", not "no": honest, because a log restarting in the middle of the night is itself a trace; what and who stay
  unknown. With a central store the deletion is a record of its own (sent before the local log goes).
- **The order needs synchronised clocks to be "yes".** A slow clock that happens to keep the order (1–5 minutes)
  gives "partly": the timestamps cannot prove it. Equal minutes are a tie and give "no". Only the file server drifts,
  and only slow, to keep the stage readable; the drift sweep is in `SPEC.md`.
- **Retention by whole days**, the same on the hosts and in the store, counted from the day the record was written
  (not its stamp); exactly `keep` days later it is still held. All records of the night fall on day 0.
- **The answers use the found day at every step** (the state carries them), and the table shows "?" until the last
  step; the cards show what is held at "now".
- **The log as personal data** is the table's last row and the last caption sentence, not a sixth question: who may
  read it (every host admin, every admin, two named reviewers) and that it is kept a set period. It is not counted in
  the answers. The readers control is shown only with a central store.
- **Model in `logs.js`**, pure and wordless, registered as `SimdeckModels.logs`, promotable to `models/logs.js`. It is
  not a copy of `cmp-policy-to-record`'s `trail.js`: the trail walks policy → standard → procedure → records over an
  audit period, while this sim asks which records of one incident survive. Catalogue §5.24 says `cmp-log-evidence`
  "fills" the trail with records; the link is conceptual (the explanation and `related`), no shared code was needed.
- **Marks:** held = solid with a thick left edge; deleted = red hatch, struck through, ✗; aged out = dashed, muted,
  struck through, ⌛; not logged and the log's restart = dashed italic; the step's changes outlined in ink (held rows
  also highlighted). Answers ✓ ~ ✗ with words and tints (green, amber, red hatch). Status rows carry the word as a
  tooltip (`title`, `aria-label`). Grayscale checked. Host badges (VPN / ID / DAT, en FS) tinted with series 1, 3, 5.
- **Phone:** cards two a row, the strips' sub-labels hidden, the table stacks each row (question and answer, the
  reason below).
- **Firm unnamed** ("a small firm"); account adm07 and svc-bkp2, address 203.0.113.45 (RFC 5737 documentation range).
  Articles only in the explanation, never on the stage; the foot says once: simplified, not legal advice, made up.
- **No glossary terms** (`[[…]]`); pairs are written out in the explanation, as the other `cmp-` pages do. The page
  does not link `glossary.js`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow only
  `sims/cmp-log-evidence/`; the open questions are here under "For the owner" and in the report.
- "Out of reach" is shown with an append-only central store; integrity by signatures or hash chains, and forwarding
  delay (a record not yet sent when the wipe happens) are out of scope (`SPEC.md`).

## Sources

- ISO/IEC 27001:2022, Annex A 8.15, 8.16, 8.17 (numbers only).
- GDPR, Regulation (EU) 2016/679, art. 5(1)(c), (e), art. 32, art. 33(3)(a). *(check: the Croatian wording
  "smanjenje količine podataka", "ograničenje pohrane" was not read on EUR-Lex directly)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(b); Implementing Regulation (EU) 2024/2690 (logging for some
  digital-infrastructure entities). *(check: the section number and what it says on clock synchronisation and
  retention)*
- RFC 5737 (documentation addresses).
- Illustrative (the page says so once): the firm, the accounts, the times, 4,812 files, the retention choices
  30/90/180/365 days, the found day.

## For the owner

From catalogue §4.13, "Where Croatian and EU practice matters", and this sim (not on the page):

- The name and number of the government regulation under the Zakon o kibernetičkoj sigurnosti *(open: not stated by the owner)*; whether it
  sets logging measures, a log retention period or clock synchronisation for ključni i važni subjekti *(open: not stated by the owner)*.
- Any Croatian rule on how long logs that hold personal data may or must be kept (for example from AZOP guidance or
  sector rules) *(open: not stated by the owner)*. The page uses illustrative periods and says only that the period must be written down and
  justified.
- Whether monitoring employees' activity through logs counts as the monitoring that involves the workers' council
  under the Zakon o radu *(open: not stated by the owner)*; the general rule is settled for `cmp-dpia-triage`. Not on the page.

## Settled

- NIS2 is implemented by the Zakon o kibernetičkoj sigurnosti (NN 14/2024) and a government regulation under it:
  owner confirmed 2026-11-08. The page already named the law once, without an article; unchanged (the catalogue line does not name this
  entry).

## Term pairs

Not in `kit/glossary.js` (it has *retention* / retencija from uvod-u-linux; the compliance pages say "razdoblje
čuvanja", the GDPR's wording); chosen here, for the owner to check in one place:

- *log* (zapisnik), *log record* (zapis), *timestamp* (vremenska oznaka), *central log store* (središnja pohrana
  zapisa), *append-only* (samo dodavanje), *retention period* (razdoblje čuvanja), *aged out* (isteklo), *clock
  synchronisation* (usklađivanje satova), *investigation* (istraga), *VPN gateway* (VPN pristupnik), *identity server*
  (poslužitelj identiteta), *file server* (datotečni poslužitelj).
- From the official GDPR text, as the task lists them: *personal-data breach* (povreda osobnih podataka), *data
  subject* (ispitanik), *data minimisation* (smanjenje količine podataka), *storage limitation* (ograničenje pohrane).

## Shared requests

- **Promote `logs.js` to `models/logs.js`** (catalogue §5.24) if a later sim (`cmp-restore-evidence`, `cmp-breach-triage`)
  wants records that survive or not. Its rule tests are the tie-break block and rules 1-8 of `sim.test.js`.
- **Kit:** `.sd-ctl { display: flex }` in `kit.css` overrides the `hidden` attribute the kit sets for a control's
  `visible: false`; the page adds `.sd-ctl[hidden] { display: none; }` as several sims do (amdahl, backup-window,
  cmp-jml-drift, cap-under-partition). Smallest change: `.sd-ctl[hidden] { display: none; }` in `kit.css`.

## Checks

- `node --test sims/cmp-log-evidence/sim.test.js`: 39 tests (tie-breaks first, then logs rules 1-8, sim rules 9-12,
  every caption key reachable and none missing, the six presets, strings, page, generic block).
- `npm run gate -- cmp-log-evidence`: pass. A sweep of 576 page states (both languages, six presets, six param
  variants, every step) at 1920×1080: no stage overflow, no page scroll, no label or chip outside the stage.
- Screenshots reviewed: 1920×1080 light, dark and grayscale, 375×812, both languages.
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md` (no rule implemented
  differently) and ran 86 mutations of `logs.js` and `sim.js`: 69 killed, 8 equivalent, 9 survived (plus one minor:
  a preset's `step`). All ten now have tests and a re-run kills each: the display tie-break by host and then true order,
  "gaps before drift" (reachable only in the model: a drifting gateway with file reads unlogged; the earlier test claimed
  it through the sim, where it cannot happen), the wipe as evidence from its own minute, `''` for `found`, rounding a
  fractional step, `aged` and the order taken from the found day at every step, `keep` 90 accepted, presets opening at
  step 0. Its content points were applied: "still in them" → "still inside the retention period" (the default preset's
  deleted records are not "in them"); the log-itself row says "✓ restricted" instead of "✓ in order", and its caption
  no longer reads as an approved retention period; the explanation no longer says the notification "has to assume the
  worst" (it says what art. 33(3) asks for); art. 32 cited as "security of processing"; the tamper reason no longer
  gives 23:31 when the file server's clock is slow; captions name "the admin grant" instead of "the new admin" (which
  read as a person); the English tie reason is a statement like the Croatian; the page calls the model's `isAged` and
  `stamp` instead of copying them; `state.n` is the clamped step.
- Kept on purpose: at drift 10 the copy ties with the login and also comes before the admin grant; the reason is
  "tie" (tie before wrong, rule 6) while the copy's chip is hatched as out of order. Both are true.

## Time

Start 16:23, done 16:52 (2026-11-07), one session (29 minutes).
