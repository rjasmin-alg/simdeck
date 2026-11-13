<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-account-lockout: notes

New stepper (task `docs/tasks/w3/win-account-lockout.md`, catalogue `win-account-lockout`, §4.5.1, wave 3). Drawn
with kit view K2 (topology): the three clients on the left, DC02 and DC01 (PDC emulator) on the right, the attempt
of this step on the wire; the policy strip with the clock and ana's passwords on top and the timeline of attempts
below are page code. Rules and expected numbers: `SPEC.md`.

## Decisions

- **One event per step** (an attempt, a stale retry, the password change, a pause). The task's sub-steps (a)–(e)
  happen in one step: the client's arrow, the dashed chain to the PDC, the counters (changed mark), the lock packet
  and the caption are shown together.
- **Fixed client → DC**: PC-A and the phone at DC02, PC-B at DC01 (the PDC itself). So `two-pcs` shows both cases:
  chained (counted at two DCs) and at the PDC (counted once). The phone's mail sync reaches DC02 through the mail
  server, which is not drawn.
- **A hidden `scenario` param** carries the preset's script; the presets set it. Policy params recompute the same
  step ("what if the threshold were 3?"); `scenario` and `retryMin` reset the demo.
- **Passwords are labels** `P0`–`P3`, a typo is "wrong password": no password text on the page.
- **Counter reset at the start of every step** (rule 4) rather than lazily at the next attempt as a DC does; the
  outcome is the same, and it lets the pause of `reset-window` show the reset.
- **`resetMin ≤ durationMin`** (the policy's own constraint): the slider's maximum follows the duration, and the
  model clamps too (`resetOf`). Without it a lockout could expire while the count still stands.
- **A locked account's attempts** are refused at the authenticating DC (it has `lockoutTime` by urgent replication)
  without counting or chaining *(check)*.
- **Lockout by the PDC first** (T4) when both DCs reach the threshold in one step: the PDC counts before the
  authenticating DC increments its copy.
- **Lockout event**: the caption names event 4740 on the PDC with the caller's computer (task: "beyond naming it" is
  out of scope).
- **Shorter caption after the first chain**: the first chained attempt explains chaining in full; later ones say
  "rejects it and chains it to the PDC DC01, which counts it too".
- **Croatian term rule** in the captions and the explanation: "*PDC emulator* (emulator PDC-a)" with the English in
  italics (the page's `rich()` turns `*…*` into `<em lang="en">`), since the glossary has none of these terms.
- **No reuse of `win-domain-logon`'s model**: that model is the DC locator and Kerberos; lockout needs none of it.
  Only the names (`quillmoor.example`, user `ana`, DC01) are shared. Nothing copied, nothing to promote.

## Deviations from the task

- **`stale-phone` turns the N-2 check off.** The task's defaults (`historyCheck` on) and its expectation (the phone
  locks the account at t = 40) contradict each other: after the change at t = 0 the phone's password is N-1, which
  rule 6 never counts. The preset sets `historyCheck: false` with the hint "N-2 check off (password history under
  3)"; with the check on, the same preset shows the phone not locking the account (caption `noLockHistory`). Owner
  question in the report.
- **`one-pc` step 6 and `two-pcs` step 6** are "the right password, refused" (task: 6 steps, not described);
  `old-password` step 7 is the right password, accepted; `stale-phone` step 1 is the password change.
- **`two-pcs` times**: PC-A at t = 0, 1, 2 and PC-B at t = 2, 3, so the same-minute tie-break (rule 8) shows in a
  preset.
- **Stale retries**: five retries at t = 0, r, 2r, 3r, 4r and PC-A at 4r + 5, so the step count stays 7 for every
  `retryMin` (the task: retries every 10 min, PC-A at t = 45).

## Sources

- Task file, model and presets; catalogue §4.5.1.
- Microsoft Learn security policy settings reference: "Account lockout threshold", "Account lockout duration",
  "Reset account lockout counter after" (titles from the task; ranges and the reset ≤ duration constraint from
  memory, not opened in this session) *(check)*.
- TechNet "Account Lockout and Password Concepts" (Windows Server 2003 technical reference), found by a web search
  in this session, not opened: badPwdCount per DC and not replicated; the authenticating DC chains a failed
  attempt to the PDC emulator, which increments its count, then the DC increments its own.
- Fox-IT, "Further abusing the badPwdCount attribute" (2017), search result summary: a failed attempt with one of
  the last two history passwords leaves badPwdCount unchanged (NTLM, Kerberos), and only when the attempt reaches
  the PDC.
- Samba bug 14054: Samba's KDC lacked the history check that its NTLM path had (the rule is per protocol in
  practice).
- DR estate `student/configs/ad/quillmoor/pso.txt` (staff PSO: `LockoutThreshold 0`, `PasswordHistoryCount 0`);
  only the student folder was used, and nothing from it is on the page.

## Unchecked *(check)*

- That a successful logon at a non-PDC DC also zeroes the PDC's count (task rule 4 "check").
- That chaining to the PDC happens for both NTLM and Kerberos (task rule 2 "check").
- The exact conditions of the N-2 rule: password history ≥ 3, which protocols, whether both DCs or only the PDC
  apply it (task rule 6 "check").
- That an attempt on a locked account is neither counted nor chained.
- The policy ranges and the reset ≤ duration constraint (Microsoft Learn pages not opened).
- Term pairs below (the task marks its terms "check").

## Checks

- **Numbers:** `numbers.py` (a Python hand count written from SPEC before the model, in the thread's scratchpad, not
  committed) agrees with the model on 7,840 param combinations (5 scenarios × threshold × reset × duration ×
  retry × history check), 54,880 steps: time, client, result, both counts and the lockout minute.
- **Tests:** tie-breaks first (T1–T6), rules 1–8, the presets' numbers, the log, the template's generic block.
- **Caption sweep** (headless, 5 presets × 10 param variants × every step × both languages, 800 captions): no
  empty or unfilled placeholder, no double space, no stage overflow at 1920×1080, no console error.
- **Fresh review** (a separate agent, no shared context: SPEC against the code and real AD, 46 mutations of its own,
  captions over every scenario × threshold × duration × reset × history check): no rule or number wrong. Fixed:
  four surviving mutations now have tests (the unlock clears `lockoutTime` on every DC; the counts end by rule 4,
  not the unlock; a count already 0 is not reset again; no reset sent to a PDC at 0); captions that were false for
  some params (`tickKeep` after a reset during a lockout, `endOpen` after a lockout that expired, `resetFirst`
  naming the DC that reset, a reset during a refused step, `noLockHistory` only when the check really saved the
  account, the stale ordinal only when every phone failure is still counted, `startTwoPcs`' question only at
  threshold 5, `okZero` when the count was already 0); 4740 names the mail server for the phone; Croatian wording.
  SPEC: urgent replication is within a site; the model clears `lockoutTime` at expiry (a simplification); the
  `reset-window` / `resetMin` 32 example needs `durationMin` ≥ 32. Equivalent survivors (never reached by a
  script): script order for one client in one minute, phone vs PC-B in one minute, a change zeroing the counts.
- **Gate:** `npm run gate -- win-account-lockout` passes (62/62 browser checks). Screenshots at 1920×1080 light,
  dark and grayscale and 375×812, both languages, reviewed; plus `two-pcs` step 5 (hr), `stale-phone` step 7 (en),
  `reset-window` step 5.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| account lockout | zaključavanje računa | task *(check)* |
| lockout threshold | prag zaključavanja | task *(check)* |
| bad password count | brojač neuspjelih prijava | task *(check)* |
| PDC emulator | emulator PDC-a | task *(check)* |
| stale credentials | zastarjele vjerodajnice | task *(check)*; the page says "zastarjela lozinka" |
| password history | povijest lozinki | task *(check)* |
| lockout duration | trajanje zaključavanja | simdeck |
| reset account lockout counter after | poništi brojač nakon | simdeck |

## Shared requests

- **K2:** a node spanning two grid rows would let a tall card (a DC with its counters) sit beside two short ones;
  here the rows are sized by the tallest card. Not needed for this page.

## Time

Start 08:46, done 09:13 (one session, including the fresh review).
