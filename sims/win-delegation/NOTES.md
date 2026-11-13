<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-delegation — notes

Task `docs/tasks/w3/win-delegation.md` (thread t-0427, 2026-11-13). Stepper, kit view K4 for the ACL. Rules and
expected results: `SPEC.md`.

## Decisions

- **K4 rule table in first-match mode for the ACL.** The task names no kit view; the user's ACL in canonical order
  with "the first entry that names the token and covers the right decides" is exactly first match, so the table
  shows the deciding row, the rows never read (hatched) and the implicit "no entry grants the right" row. A deny
  is modelled and tested (tie-breaks T1–T3) though no preset uses one.
- **The panel shows the user's effective ACL, not the OU's ACL.** The task's scene shows "the ACL of the selected
  OU"; the OU's own entries are listed under the OU in the tree (key, trustee, right, "descendant users"), and the
  panel shows where they arrive: the target user's ACL with each row's source (explicit default, AdminSDHolder,
  inherited from OU=…). That is where the test is decided.
- **The `target` param and test steps.** A test step shows the user it tests; every other step (start, wizard,
  move, Domain Admins change, SDProp) shows the `target` param as a preview ("what would happen now"), and the caption
  ends with that verdict. Clicking a user in the tree sets `target`. Each preset sets `target` to the user its
  story is about (narrow: eyardley; protected-admin: tbrennan-adm; others aashdown).
- **Default ACL of a user** is reduced to one row, `Domain Admins` full control (explicit, the schema default), and
  AdminSDHolder's copy to `Domain Admins` and `Administrators` full control. Enough for rule 8 and for showing that
  inheritance is gone; the real lists are longer (see *(check)*).
- **SDProp is one step**, not a clock; the caption says "every 60 minutes on the PDC emulator".
- **Token change on leaving Domain Admins** takes effect in the next step; the caption says "after signing in
  again" (a token is built at logon).
- **Changed highlight:** the OU row and its entry lines when the wizard adds them; a user row when its container,
  adminCount or Domain Admins membership changes or it is tested; the Domain Admins line in the groups box; new rows
  of the ACL table (all of them after SDProp); the newest test in the log.
- **Legend:** explicit entry (key), inherited entry (key with a down arrow, dotted), protected account (shield),
  test ✓/✕, changed. No deny swatch: no preset shows a deny (see Deviations).

## Deviations from the task

- **Target `tbrennan` → `tbrennan-adm`, plus `administrator`.** The task's params list "admin `tbrennan`", its preset
  uses `tbrennan-adm`; the sim uses the admin account `tbrennan-adm` throughout and adds the built-in
  `administrator` (the `quillmoor` preset tests it), five options in all.
- **`protected-admin` starts with tbrennan-adm in `OU=Staff` and not in Domain Admins** (a new admin account). In the
  estate it sits in `CN=Users` and is already protected; then the "before SDProp ✓" edge (rule 6) could not happen.
- **`move-user` starts with the delegation already on the scope OU**, so it fits in 3 steps (test, move, test).
- **`narrow`'s 4th step** tests afenwick (`CN=Users`); the task gave only the step count.
- **`quillmoor`: the group `Helpdesk` is in Domain Admins**, standing in for the estate's shared `helpdesk` account
  (`domain-admins.txt`). Script: test administrator ✓; Helpdesk leaves Domain Admins; wizard; test administrator ✕.
- **Legend without deny (⛔).** The model and tests handle deny ACEs; no preset has one, so a legend entry would
  name something never on screen. The table's Type column shows ✓ allow / ✕ deny with the word in the tooltip.
- **State** adds `da` (the Domain Admins members) and `last` to the task's state shape.
- **hd-mia** is invented (the estate has no such user); `Helpdesk` as a group is invented too.

## Sources

- Microsoft Learn: "Delegating administration by using OU objects"; "Appendix C: Protected accounts and groups in
  Active Directory" (AdminSDHolder, SDProp every 60 minutes on the PDC emulator).
- Microsoft KB 296999 "Minimum permissions are needed for a delegated administrator to force password change at
  next logon" (Reset Password vs write pwdLastSet); Microsoft Learn training "Implement delegated privileges" (the
  wizard's predefined task "Reset user passwords and force password change at next sign in").
- Estate (student material): `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/ou-tree.txt`, `users.csv`,
  `domain-admins.txt`.
- OU tree subset from `sims/win-ad-structure/sim.js` @ 36f2f87 (copied as constant data: `models/` has no AD model;
  only names and parents are reused, no functions).

## Unchecked *(check)*

- The wizard's reset task contents (delegwiz.inf): Reset Password + read/write `pwdLastSet` on descendant user
  objects, and no `lockoutTime`. Supported by KB 296999 and several admin guides that grant `lockoutTime` separately
  for unlocking; the template file itself was not read.
- AdminSDHolder's real ACL (more rows; Domain Admins' entry is a set of rights, not literally "full control", but it
  includes Reset Password).
- The user class's default security descriptor granting Domain Admins full control on every new user.
- Rule 6: the inherited ACE still applies between joining Domain Admins and the next SDProp run.
- Croatian terms: *delegation of control* — delegiranje ovlasti; *access control entry* — unos kontrole pristupa
  (ACE); *protected account* — zaštićeni račun; *extended right* — prošireno pravo.

## Term pairs

Not in `kit/glossary.js` (written out in both tables with the `*term*` (hr) convention):

| en | hr | source |
|---|---|---|
| delegation of control | delegiranje ovlasti | task (check); glossary has "delegation — delegiranje" |
| access control entry (ACE) | unos kontrole pristupa | task (check); glossary has "access control list — popis kontrole pristupa" |
| protected account | zaštićeni račun | task (check) |
| extended right | prošireno pravo | task (check) |

`inheritance — nasljeđivanje` and `permission — dozvola` follow UL ch07, as the task says.

## Shared requests

- None for the kit. (`.sd-ctl[hidden]` workaround copied from `win-ntfs-inheritance`, as there.)
- Model: if a later sim reuses delegation or AdminSDHolder, `aclOf` / `check` in `sim.js` are pure and promotable
  as they are (no strings, plain data).

## Review

A fresh reviewer (subagent, 2026-11-13) read the diff against `SPEC.md` and mutated `sim.js` once per rule and
tie-break. All the obvious breaks were caught; 13 survived. Fixed afterwards:

- Tests added for: SDProp stamping only protected-group members; the AdminSDHolder rows; an OU ACE for the OU itself
  not inherited; the wizard's duplicate check on type, right and applies-to; the scope param in `move-user` and
  `quillmoor`; `reachedBy`; the panel returning to `target` after a test; Domain Admins kept in the token after
  SDProp. Each fails under its mutation (checked).
- Not testable: the deny-before-allow sort inside the explicit group (the explicit lists hold allows only); SPEC T2
  says so.
- Caption: the SDProp step said "the delegation no longer applies" also when it never applied (protected-admin with
  scope OU=Brackenridge); now a second wording says no OU delegation will reach the account.
- Caption: "inherited through the child OUs" only when the OU has child OUs (OU=Brackenridge has none).
- Highlights: the "passes on" badges and the users' inherited badges now get the changed mark on the wizard step.
- Wording: hr "obavezna promjena lozinke", hr "otključavanje" in the test log, en "Once hd-mia signs in again".
- Fact: the move caption said inherited entries are "not copied"; AD does store inherited ACEs (flagged inherited)
  and rewrites them after a move. Caption and SPEC rule 7 now say they are recomputed from the new parent.
- Not changed: the wizard caption on a re-run that adds nothing (`added = 0`) is unreachable in every preset.

## Timing

Started 09:16, done 09:36 (one session).
