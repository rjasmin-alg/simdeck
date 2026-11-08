<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-exceptions: notes

New explorer (task `docs/tasks/w3/cmp-exceptions.md`, catalogue `cmp-exceptions` §4.13; the acceptance is scored and
signed as in `cmp-risk-register`, §5.24). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Written vs operating is the stage.** Three of the four regimes (no end date, a date nobody checks, renewal without
  a decision) leave the estate exactly the same: 16 of 48 systems meet the standard at month 24, the oldest exception
  is 24 months old. Only the register changes: 32 open-ended, 25 expired, or every exception in date ("✓ all in
  date"). A review at expiry gives 37 of 48 and an oldest of 10 months. The comparison row on the stage shows all
  four for the same requests and month, so the point needs no toggling.
- **Every request is granted.** The student does not grant or refuse one by one: the same 36 requests arrive under
  every regime and all are granted, so the regimes compare on the same stream. "Grant exceptions over two years"
  becomes "the policy under which they were granted". Refusing requests is out of scope (a second concept: how many
  exceptions to allow).
- **Why a review fixes and the others do not.** Under review the owner must show the fix at expiry, so the work is
  planned to the deadline (finished when due, not earlier: Parkinson). Under the other regimes nobody asks, so only a
  replaced system closes an exception. That makes a longer end date slower (preset 6: 31 of 48 at month 24 with a
  12-month grace against 37 with 6 months) and gives each regime one honest mechanism.
- **Renew once, then escalate.** A review renews once with a plan; at the second expiry it escalates to the board,
  which tracks it until the fix is done. With no owner nobody answers the first review: it escalates at once, the
  board names an owner and the work starts a period late (preset 5).
- **"Complete exceptions" is one toggle** (owner and compensating control). Off, an exception has what the request
  named: 24 of 36 name an owner, 15 a control. A compensating control lowers the likelihood one level; the residual
  l × i is signed by the owner within the appetite (8) and by the board above it, copied from `cmp-risk-register`
  (`score`, `above`, `signer`). The stage shows the open ones without a control, without an owner, and above the
  appetite (the board signed).
- **A fixed table, no seed.** The 36 requests (month, system, reason, months to fix, owner, control, l, i, replacement)
  are a literal table in `sim.js`, generated once with a script and then frozen, so the numbers in SPEC never move and
  the page has no "new requests" button. Months are ⌊24k/36⌋ (1.5 a month).
- **The month** is set from the stage (◀ ▶ buttons, or a click on a history column); the panel's slider is hidden
  (kept in the URL) because six presets and three settings already fill the 1080 px panel. The buttons keep keyboard
  focus and use `aria-disabled` at 0 and 24.
- **The history** stacks open exceptions by status over the full height of the estate (48), so the pile-up reads as a
  rising stack and the empty top is the share that meets the standard.
- **Status patterns** for grayscale: in date solid, renewed diagonal stripes, escalated dotted, expired cross-hatched,
  no end date horizontal stripes; the oldest has a focus-coloured ring; ✕ and ? mark a missing control or owner.
  Grayscale screenshots checked.
- **"Without an owner" means granted without one.** The ? flag and the count stay after the board names an owner at
  the first review, so the stage shows how the exception was granted (the legend and the gaps line say "granted
  without an owner"). The signer follows the score alone.
- **The register's verdict:** "✓ all in date" only when nothing is expired, open-ended or escalated; escalated ones
  show "! some await the board".
- **Words:** no glossary terms (`[[…]]`); the explanation writes the pairs out (Croatian bold, English in italics in
  brackets), as the other `cmp-` pages do; the page does not link `glossary.js`. "Simplified, not legal advice, made-up
  firm, systems, requests and numbers" is said once, in the stage's foot.
- **No answer keys:** nothing from `dr-lecture-estate/instructor/`; the entry has no estate seed.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- "Grant exceptions" is the regime under which a fixed stream is granted (above), not a grant/refuse button per request.
- Six presets (the task asks 3–6).
- The brief says to add owner questions to `docs/tasks/OPEN.md`, but COMMON.md §9 and the gate's scope check allow
  only `sims/cmp-exceptions/`; open questions are in the report instead.
- `models/` holds no risk-scoring model yet; the three functions are copied from `sims/cmp-risk-register/scoring.js`
  @ 302ce39 with a comment on each (COMMON.md §6).

## Sources

- ISO/IEC 27001:2022, clause 6.1.3 (risk treatment; the risk owners approve the treatment plan and accept the
  residual risk) and clause 10.2 (nonconformity and corrective action), by number only. *(check: clause numbers and
  the acceptance item against a copy of the 2022 edition)*
- NIS2, Directive (EU) 2022/2555, art. 20(1) (management bodies approve the cybersecurity risk-management measures and
  oversee their implementation) and art. 21(1), EUR-Lex. *(check: the official Croatian wording "upravljačka tijela"
  and "mjere upravljanja kibernetičkim sigurnosnim rizicima" against EUR-Lex; the page paraphrases)*
- Time-limited exceptions with an owner and a compensating control: common governance and audit practice, not a
  clause; presented as such. *(check: no clause is cited for it on the page)*
- The scoring and signing of a residual risk: `cmp-risk-register` SPEC rules 1, 4 and 5.
- All numbers on the page (48 systems, 36 requests, fix times, owners, controls, replacements, the appetite) are
  illustrative (the page says so once). The preset numbers are checked by the Python script in `SPEC.md`, an
  independent re-implementation from the SPEC text.

## For the owner

- Catalogue §4.13 lists no Croatian detail for this entry. Whether the regulation under the Zakon o kibernetičkoj
  sigurnosti (NN 14/2024) asks for an exception register or time-limited deviations from the measures in its own words
  *(open: not stated by the owner; source: Narodne novine)*; not on the page.

## Term pairs

Not in `kit/glossary.js`; chosen here, for the owner to check in one place:

- *exception* (iznimka, as the catalogue's Croatian title), *risk acceptance* (prihvaćanje rizika), *compensating
  control* (kompenzacijska kontrola), *expiry date* / *end date* (rok isteka; on the stage "rok"), *exception register*
  (registar iznimki), *owner* (vlasnik), *renew* (obnoviti), *escalate* (eskalirati), *review at expiry* (pregled o
  isteku), *in date* (u roku), *expired* (istekla), *open-ended* (bez roka), *the board* (uprava, as
  `cmp-risk-register`), *risk appetite* (apetit za rizik), *the estate* (okruženje), *standard build* (standardna
  instalacija), *multi-factor sign-in* (višefaktorska prijava).

## Shared requests

- For the coordinator: when `models/scoring.js` is promoted from `cmp-risk-register`, `exceptions.js` should take
  `score`, `above` and `signer` from it instead of its copies.
- For the coordinator: `exceptions.js` (the exception lifecycle: regime, granted, closes, status, reviews, estate) is
  pure and wordless and can be promoted to `models/exceptions.js`; `cmp-patch-sla` also grants exceptions (open-ended
  ones in its "report" preset) and could read the same lifecycle. Its tests are the tie-break block and rules 1–7 of
  `sim.test.js`.
- For the kit: `.sd-ctl[hidden] { display: none; }` again (as in `cmp-four-eyes`, `cmp-sod-toxic`); and a small stage
  button style (`.ex-b` here; `.fe-b`, `.pa-b`, `.sx-b` elsewhere).

## Checks

- `node --test sims/cmp-exceptions/sim.test.js`: tie-breaks first (appetite equality, replacement at the fix month,
  fix exactly one period, closed at m, the period boundary, oldest tie and the 12-month boundary, no review after a
  replacement), then rules 1–11, the presets against SPEC, month by month, the tiles, and the generic block.
- `npm run gate -- cmp-exceptions`: see the report for the final run. Screenshots at 1920×1080 light, dark, grayscale
  and 375×812 in both languages reviewed, plus every preset in English, preset 5 in Croatian, preset 4 in dark and at
  375×812. Clicks checked in a browser: a history column sets the month; Enter on ◀ fourteen times keeps focus and
  stops at the right month; no console errors. First gate run failed one-screen (the panel 906 px > 800 in hr): the
  month slider moved to the stage and the toggle label shortened. Phone layout fixed after review (the stage's implicit
  grid column grew to its content; month labels collided).
- Fresh reviewer (a separate agent, no part in the build) read the code against `SPEC.md`, ran the Python check
  (identical numbers) and 80 mutants: 58 killed at first. No numeric mismatch. Applied: the ? flag after escalation
  is now defined and labelled as "granted without an owner" (SPEC rules 2 and 7); the register no longer shows
  "✓ all in date" beside escalated exceptions; preset 5 renamed "Incomplete requests" / "Nepotpuni zahtjevi"; the
  deadline assumption marked as the model's ("here") in the grace note; the explanation no longer says the board
  funds the fix (escalation does not speed a fix here); "a year or older" for age ≥ 12; Croatian wording
  (pReviewHint, nOwner); SPEC rule 10 states the normalise edge cases; comment rule numbers; unused fields
  (`granted`, `compare[].oldest`, `oldest.st`) dropped; `<i lang="en">` in the explanation. Its six tests for the
  12 real survivors are in `sim.test.js` (31 tests); with them 72 of 80 mutants die, the rest are equivalent
  (6) or were the dropped fields (2).

## Time

Start 23:31, done 23:56 (2026-11-08), 25 minutes, one session.
