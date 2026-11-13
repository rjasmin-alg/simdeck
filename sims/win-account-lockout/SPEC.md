<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-account-lockout: spec

One concept: **account lockout — a threshold of bad passwords, counted per DC and at the PDC emulator, which sees
the attempts of every DC; a stale password left on a device is enough to lock the account.**

Task: `docs/tasks/w3/win-account-lockout.md` (catalogue §4.5.1). Stepper. Kit view K2 (topology) draws the three
clients on the left and the two DCs on the right, the attempt of this step on the wire; a policy strip with the
clock on top and a timeline of the attempts below.

## Scene

| Party | Data |
|---|---|
| Domain | `quillmoor.example`, user `QUILLMOOR\ana` (as in `win-domain-logon`) |
| DC01 | the PDC emulator (badge); its own `badPwdCount`, `badPasswordTime`, `lockoutTime` |
| DC02 | a second DC; its own `badPwdCount`, `badPasswordTime`, `lockoutTime` |
| PC-A | ana's laptop; authenticates at DC02 |
| PC-B | a desktop; authenticates at DC01 |
| phone | ana's phone with mail sync; its attempts reach DC02 (through the mail server, not drawn) |

The DC each client uses is fixed (the locator's choice, `win-domain-logon`). PC-B at the PDC itself shows that an
attempt the PDC handles is counted once.

Passwords are labels, not text: `P0`, `P1`, `P2` in history and the current one; a typo is `✕`. At step 0 ana's
password is `P2` and her history (newest first) is `P1`, `P0`.

## State

`{ t, pwd: { current, history: [] }, dcs: { DC01: { bad, lastBad, lockoutTime }, DC02: { … } },
locked: null | { since, by }, sessions: [{ client, pwdUsed, retryMin }], log: [], last }` — `t` in minutes from the
start; `lastBad` the minute of the DC's last counted bad attempt (`badPasswordTime`) or null; `last` the event of
this step with what each DC did (for the page); `log` one entry per step.

## Params

| Param | Range | Default | Meaning |
|---|---|---|---|
| `scenario` | the five presets | `one-pc` | which attempts happen (hidden; set by the presets) |
| `threshold` | 0–10 | 5 | Account lockout threshold; 0 = never lock |
| `resetMin` | 1–60, at most `durationMin` when that is > 0 | 30 | Reset account lockout counter after (minutes) |
| `durationMin` | 0–60 | 30 | Account lockout duration; 0 = until an administrator unlocks |
| `retryMin` | 1–30 | 10 | how often the stale session retries (`stale-phone`) |
| `historyCheck` | toggle | on | the N-2 password-history check (rule 6) |

`resetMin ≤ durationMin` is the policy's own constraint (Microsoft Learn, "Reset account lockout counter after": the
value must be less than or equal to the lockout duration) *(check)*; the range's maximum follows `durationMin`.
`scenario` and `retryMin` reset the demo; the policy params recompute the same step ("what if the threshold were 3?").

## Rules

1. **Per DC, not replicated.** Each DC keeps its own `badPwdCount` and `badPasswordTime` for ana; they do not
   replicate (Microsoft Learn, "Account lockout and management tools" / TechNet "Account Lockout and Password
   Concepts" *(check: title)*).
2. **Chained to the PDC.** A DC that rejects a password (DC02 here) forwards the attempt to the PDC emulator before
   failing it. The PDC checks it against its own copy and, if it rejects it too, increments its own count; then the
   authenticating DC increments its copy. An attempt at the PDC itself is counted once. So the PDC counts the bad
   attempts of every DC (same sources; chaining for NTLM and Kerberos *(check)*).
3. **Lockout.** When a count reaches `threshold` the account is locked: `lockoutTime` is set and replicates urgently
   to every DC of the site (both cards show it in the same step; between sites it follows replication, out of
   scope). The PDC's count is checked first, then the authenticating
   DC's. `threshold` 0 never locks (counts still rise).
4. **Counter reset.** A DC's count is 0 again once `resetMin` minutes have passed since its last bad attempt
   (`t − lastBad ≥ resetMin`: the reset comes first when the next attempt falls exactly on the boundary). Real DCs
   apply it when the next attempt arrives; here it is applied at the start of every step, so a pause (the tick of
   `reset-window`) shows it. A successful logon sets the authenticating DC's count to 0 and, when that DC is not
   the PDC, the PDC's too *(check: that success at another DC zeroes the PDC's count)*.
5. **Locked stays locked.** A locked account refuses every attempt, the right password too, for `durationMin`
   minutes from `lockoutTime` (`t ≥ since + durationMin` unlocks it; simplified: the model clears `lockoutTime` on
   every DC at that moment, where a real DC keeps the old value until the next logon and treats it as expired); 0 = until an administrator unlocks it (not in
   the presets). A refused attempt on a locked account is neither counted nor chained *(check)*. After the lockout
   expires the counts are 0 by rule 4 (since `resetMin ≤ durationMin` and nothing counted while locked).
6. **Password history (N-2).** With `historyCheck` on, a wrong password equal to one of the last two in history
   (N-1, N-2) is refused but not counted, at the authenticating DC and at the PDC (chained as usual). Microsoft
   names this for NTLM and Kerberos when password history is at least 3 (TechNet "Account Lockout and Password
   Concepts"; Fox-IT 2017 "Further abusing the badPwdCount attribute") *(check: the exact conditions)*.
7. **Stale session.** A session that keeps an old password (mail sync on the phone) retries every `retryMin`
   minutes on its own; each retry is an attempt like any other.
8. **Password change** (`stale-phone` step 1): ana changes her password on PC-A; DC02 sends it urgently to the PDC.
   The old current password goes to the front of the history; counts do not change.

## Tie-breaks

- **T1 Same minute, client order.** Events in the same minute run in the order PC-A, PC-B, phone (task rule 8); a
  tick comes before them; two events of one client keep their script order (a guard: no script has two events of
  one client in one minute, nor the phone and PC-B in one minute, so only PC-A/PC-B and the change/phone ties show).
- **T2 Reset boundary.** `t − lastBad = resetMin` resets before the attempt is counted (rule 4).
- **T3 Unlock boundary.** `t = since + durationMin` is unlocked: the attempt is checked normally (rule 5).
- **T4 PDC first.** When the PDC and the authenticating DC reach the threshold in one step, the lockout is the PDC's
  (`locked.by` = DC01).
- **T5 Only the last two.** With `historyCheck`, `history[0]` and `history[1]` are not counted; `history[2]` is.
- **T6 Success clears the count**, the PDC's too (rule 4), but not a lockout (rule 5 wins: a locked account refuses
  the right password).

## Events per scenario (one per step)

| Preset | Events | Steps | End |
|---|---|---|---|
| `one-pc` | PC-A ✕ at t = 0, 1, 2, 3, 4; PC-A `P2` at t = 5 | 6 | step 5: DC02 5, DC01 5 → locked by DC01 at t = 4; step 6 refused (locked) |
| `two-pcs` | PC-A ✕ at t = 0, 1, 2; PC-B ✕ at t = 2, 3; PC-A `P2` at t = 4 | 6 | t = 2 PC-A before PC-B (T1); step 5: DC02 3, DC01 5 → locked at t = 3; step 6 refused at DC02 (the lockout replicated) |
| `stale-phone` | change `P2` → `P3` at t = 0; phone `P2` at t = 0, r, 2r, 3r, 4r; PC-A `P3` at 4r + 5 (r = `retryMin`) | 7 | preset sets `historyCheck` off: counts 1…5 at t = 0…40, locked at t = 40; step 7 (t = 45) refused |
| `old-password` | PC-A `P1` (N-1) at t = 0…5; PC-A `P2` at t = 6 | 7 | counts stay 0, step 7 logs on. With `historyCheck` off: locked at t = 4, steps 6, 7 refused |
| `reset-window` | PC-A ✕ at t = 0, 1, 2, 3; tick to t = 34; PC-A ✕ at t = 34, 35, 36, 37 | 9 | counts 1–4, back to 0 at the tick (34 − 3 ≥ 30), then 1–4: never 5, not locked |

`sim.json` `steps` = 6 (the default scenario `one-pc`). Steps per scenario are fixed: 6 / 6 / 7 / 7 / 9.

**The N-2 rule and the stale phone.** The task's defaults (`historyCheck` on) and its `stale-phone` expectation
(locked at t = 40) contradict each other: the phone's `P2` is N-1 after the change, so with the check on it is
never counted. The preset turns the check off (a domain with password history under 3, or an access path the check
does not cover); with it on, the same preset shows the phone *not* locking the account. Owner question in the
report.

Other combinations checked by the numbers script: `two-pcs` with threshold 6 → no lockout, step 6 logs on and both
counts go to 0; `one-pc` with threshold 0 → counts 5/5, step 6 logs on; `stale-phone` (check off) with duration 3 → `resetMin` clamps to 3 and every retry
finds the count reset, never locked; with `retryMin` 1 as well → locked at t = 4, unlocked at t = 7, step 7 (t = 9)
logs on; `stale-phone` with `retryMin` 30 and `resetMin` 30 → each retry finds the count reset,
never more than 1; `reset-window` with `resetMin` 32 and `durationMin` ≥ 32 → no reset at the tick, locked at t = 34 (at the default
duration 30 the reset is clamped to 30 and the tick resets).

## Out of scope

Fine-grained policies per group (`win-fgpp`), cloud-directory lockout, finding the source in event logs (only
named: the PDC logs event 4740 with the caller's computer), administrator unlock, smart lockout, NTLM vs Kerberos
details (`win-ntlm-vs-kerberos`), DC location (`win-domain-logon`).

## Sources

- Task file `docs/tasks/w3/win-account-lockout.md`; catalogue §4.5.1.
- Microsoft Learn, security policy settings reference: "Account lockout threshold" (0–999, 0 = never), "Account
  lockout duration" (0 = until an administrator unlocks; must be ≥ the reset time), "Reset account lockout counter
  after" (1–99,999 minutes, ≤ the duration) — titles from the task, ranges from memory *(check)*.
- TechNet "Account Lockout and Password Concepts" (Windows Server 2003 technical reference): badPwdCount per DC,
  not replicated; chaining to the PDC emulator; lockoutTime replicated urgently; the N-2 history check.
- Fox-IT, "Further abusing the badPwdCount attribute" (2017): the N-2 rule for NTLM and Kerberos; it holds only when
  the attempt is forwarded to the PDC.
- Samba bug 14054 (the KDC lacked the history check that NTLM had): the rule is protocol-dependent in practice.
- DR estate `student/configs/ad/quillmoor/pso.txt` (staff PSO with `LockoutThreshold 0`, `PasswordHistoryCount 0`):
  the estate's staff are never locked out, and the N-2 check would not apply there.
