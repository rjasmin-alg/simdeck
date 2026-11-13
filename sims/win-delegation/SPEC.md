<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-delegation — spec

One concept: **granting rights on an OU instead of Domain Admins.** The admin delegates password resets on an OU
to the group `Helpdesk`; hd-mia (a member) tests resets. Task: `docs/tasks/w3/win-delegation.md`. Stepper, kit view
K4 (rule table) for the ACL. Model: `sim.js`; tests: `sim.test.js`.

Sources:
- [MS-DOC] Microsoft Learn, "Delegating administration by using OU objects" (the wizard, OU-scoped delegation).
- [MS-APPC] Microsoft Learn, "Appendix C: Protected accounts and groups in Active Directory" (AdminSDHolder,
  SDProp every 60 minutes on the PDC emulator, adminCount, inheritance disabled).
- [MS-KB296999] Microsoft KB 296999, "Minimum permissions are needed for a delegated administrator to force
  password change at next logon": Reset Password alone does not set "must change at next logon"; that needs write
  `pwdLastSet`.
- [MS-TRAIN] Microsoft Learn training "Implement delegated privileges": the wizard's predefined task "Reset user
  passwords and force password change at next sign in".
- [ACL] Windows access check: ACEs read in canonical order (explicit deny, explicit allow, inherited deny, inherited
  allow; inherited ones nearest parent first); the first ACE that grants or denies the requested right decides; none
  means refused. (Standard Windows security model; also used by `win-ntfs-inheritance`.)
- [EST] `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/`: `ou-tree.txt` (OU tree, `OU=Disabled`),
  `users.csv` (homes of eyardley, aashdown, afenwick, tbrennan-adm, administrator), `domain-admins.txt` (`helpdesk`,
  `administrator`, `tbrennan-adm` in Domain Admins).

## Scene

- Containers (parents first): `quillmoor.example` › `CN=Users`; `OU=Quillmoor` › `OU=Staff` › `OU=HQ`,
  `OU=Brackenridge`; `OU=Quillmoor` › `OU=Disabled`. [EST], subset as in `win-ad-structure`.
- Users and homes [EST]: eyardley `OU=HQ`, aashdown `OU=Brackenridge`, afenwick `CN=Users`, tbrennan-adm `CN=Users`
  (Domain Admins, adminCount 1), administrator `CN=Users` (Domain Admins, adminCount 1).
- Group `Helpdesk` with user `hd-mia` (invented for the lesson; the estate has one shared account `helpdesk`).
- hd-mia's token: `hd-mia`, `Helpdesk`, and `Domain Admins` while Helpdesk is a member of it.

## State

`{ aces: { containerId: [{ trustee, type, right, appliesTo }] }, users: { id: { container, adminCount } },
da: [user ids], helpdeskInDA, sdpropRun, log: [{ n, user, action, ok }], last }`. ACLs of users are derived
(`aclOf`), not stored in the sim's state: a move or an SDProp run changes them through `container` /
`adminCount`.

## Rules

1. **Wizard** [MS-DOC, MS-TRAIN, MS-KB296999]: the task "reset passwords and force a change at next logon" adds two
   allow ACEs on the OU: `Helpdesk` · extended right `Reset Password`, and `Helpdesk` · write `pwdLastSet`, both
   applying to descendant user objects. They are inherited by every user below the OU, through child OUs.
   Running it again on the same OU adds nothing (T4) *(check: the real wizard's behaviour on a second run)*.
   An OU ACE that applies to the OU itself only (`appliesTo: this`) is not inherited by users.
2. **Test** [ACL]: a user's ACL is its explicit ACEs, then (inheritance on) each ancestor's ACEs that apply to users,
   nearest ancestor first; deny before allow within each group. The first ACE that names a SID of hd-mia's token and
   covers the right decides: allow → ✓, deny → ✕. No such ACE → ✕ (the implicit row). `full` covers every right.
3. **Outside the OU**: a user not below the delegated OU (e.g. in `CN=Users`) has no inherited Helpdesk ACE → ✕.
4. **Unlock** needs write `lockoutTime`; the reset task does not grant it → ✕ *(check: the wizard's task contents
   in delegwiz.inf; third-party guides grant `lockoutTime` separately for unlocking)*. Domain Admins' full control
   covers it.
5. **Protected accounts** [MS-APPC]: SDProp stamps `adminCount = 1` on members of protected groups (here: Domain
   Admins) and replaces their ACL with AdminSDHolder's, inheritance off. Reduced AdminSDHolder ACL in the sim:
   `Domain Admins` full control, `Administrators` full control *(check: the real AdminSDHolder ACL has more rows
   and Domain Admins' entry is "special" rather than full control; it includes Reset Password)*.
6. **Edge**: joining Domain Admins changes nothing on the ACL until SDProp runs; in between the inherited Helpdesk
   ACE still applies *(check)*.
7. **Move**: moving a user changes its parent; its inherited ACEs are recomputed from the new ancestors, and the
   old parent's are gone. AD stores inherited ACEs in each object's security descriptor, flagged as inherited, and
   rewrites them after a move; the sim computes them from the tree (`aclOf`), which gives the same result
   [ACL]. "At once" *(check: the propagation after a move is immediate for the moved object itself)*.
8. **Helpdesk in Domain Admins**: every user object's own ACL grants `Domain Admins` full control (the schema's
   default security descriptor for users *(check)*, and AdminSDHolder's copy on protected accounts), so with
   Domain Admins in the token every reset succeeds, the administrator's included.

## Tie-breaks

- T1 explicit before inherited: an explicit allow is read before an inherited deny.
- T2 within one ancestor, deny before allow. (The code sorts the explicit group the same way, but the sim's
  explicit lists hold allows only, so that half cannot be seen or tested.)
- T3 a nearer ancestor before a farther one: an allow on `OU=Brackenridge` beats a deny on `OU=Staff`, and the other
  way round.
- T4 the wizard on an OU that already holds the same ACEs adds none (`added = 0`).
- The panel: on a test step it shows the tested user and action; on any other step the `target` param with reset.

## Params and presets

- `scope` {`OU=Staff`, `OU=Brackenridge`}, default `OU=Staff`: where the wizard runs (and, in `move-user`, where the
  delegation already is).
- `target` {eyardley, aashdown, afenwick, tbrennan-adm, administrator}, default aashdown: the user the panel shows
  between tests.
- `scenario` (hidden), set by the presets.

| Preset | scope | Steps | Script | Expected tests |
|---|---|---|---|---|
| `delegate-staff` | Staff | 5 | wizard; test aashdown; test eyardley; test afenwick; unlock aashdown | ✓ ✓ ✕ ✕ |
| `narrow` | Brackenridge | 4 | wizard; test aashdown; test eyardley; test afenwick | ✓ ✕ ✕ |
| `protected-admin` | Staff | 5 | wizard; tbrennan-adm joins DA; test; SDProp; test | ✓ ✕ |
| `move-user` | Staff | 3 | (delegated at start) test aashdown; move to OU=Disabled; test | ✓ ✕ |
| `quillmoor` | Staff | 4 | (Helpdesk in DA at start) test administrator; Helpdesk leaves DA; wizard; test administrator | ✓ ✕ |

With scope = Brackenridge: `delegate-staff` gives ✓ ✕ ✕ ✕, `narrow` with Staff gives ✓ ✓ ✕, `protected-admin`
gives ✕ ✕ (tbrennan-adm in `OU=Staff` is above Brackenridge). In `quillmoor`, after step 3 the panel's aashdown is ✓
again (through the delegation, not Domain Admins).

`protected-admin` starts with tbrennan-adm as a new admin account in `OU=Staff`, not yet in Domain Admins
(the estate has it in `CN=Users`, already protected); otherwise rule 6 cannot be shown.

Numbers checked by running the model over every preset and both scopes (`sim.test.js`, "presets" tests).
