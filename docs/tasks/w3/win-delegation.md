# win-delegation: Delegation of control

| | |
|---|---|
| Task | `win-delegation` (wave 3, Active Directory) |
| Catalogue entry | `win-delegation` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-delegation/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `active-directory` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ad-structure` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **granting rights on an OU instead of Domain Admins**.

The student: delegate password resets, test as a helpdesk user.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-ad-structure/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "Delegating administration by using OU objects"; "Appendix C: Protected accounts and groups in Active Directory" (AdminSDHolder, SDProp every 60 minutes)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/domain-admins.txt` (estate: `helpdesk` in Domain Admins) and `ou-tree.txt`, `users.csv` (user names)

## Model and presets

- **Scene:** the estate OU tree (from `win-ad-structure`): `OU=Quillmoor` › `Staff` › `HQ`, `Brackenridge`; `CN=Users`. Group `Helpdesk` with user `hd-mia`. The ACL of the selected OU is shown as rows (ACEs): trustee, right, applies to, inherited. A "try as hd-mia" panel: reset password of a chosen user → ✓ or ✕ with the ACE that decided.
- **State:** `{ aces: { container: [{ trustee, right, appliesTo, inherited }] }, users: { id: { container, adminCount } }, helpdeskInDA: bool, sdpropRun: bool, log: [] }`.
- **One step:** one admin action (run the delegation wizard, move a user, add someone to Domain Admins, SDProp run) or one test as hd-mia.
- **Rules (Microsoft: "Delegating administration by using OU objects"; "Appendix C: Protected accounts and groups in Active Directory"):**
  1. The Delegation of Control wizard adds ACEs to the OU: trustee `Helpdesk`, extended right "Reset Password" and write `pwdLastSet`, applying to descendant user objects; they inherit to every user below the OU.
  2. A test as hd-mia succeeds if an inherited or explicit allow ACE grants the right on the target user and no deny applies.
  3. A user outside the OU (e.g. in `CN=Users`) has no such ACE → refused.
  4. Unlocking needs write on `lockoutTime`, which the reset task does not include (check: wizard task contents).
  5. Protected accounts: members of Domain Admins and other protected groups get `adminCount=1`; SDProp (every 60 min on the PDC emulator) replaces their ACL with AdminSDHolder's and disables inheritance → the delegated ACE no longer applies even if they sit in the OU.
  6. Edge: between joining Domain Admins and the next SDProp run, the inherited ACE still applies (check).
  7. Moving a user out of the OU removes the inherited ACEs at once (new parent's inheritance).
  8. The alternative "put helpdesk in Domain Admins" grants everything in the domain, including reset of admins' passwords.
- **Params:** `target` choice {HQ user `eyardley`, Brackenridge user `aashdown`, `CN=Users` user `afenwick`, admin `tbrennan`} default `aashdown`; `scope` choice {OU=Staff, OU=Brackenridge} default OU=Staff.
- **Presets (5):**
  - `delegate-staff` — wizard on `OU=Staff` → hd-mia resets `aashdown` ✓ and `eyardley` ✓, `afenwick` (CN=Users) ✕. 5 steps. Derived, unchecked.
  - `narrow` — delegation on `OU=Brackenridge` only → `eyardley` (HQ) ✕. 4 steps.
  - `protected-admin` — `tbrennan-adm` placed in OU=Staff and in Domain Admins: before SDProp ✓ (check), after SDProp ✕. 5 steps.
  - `move-user` — `aashdown` moved to `OU=Disabled` → reset ✕. 3 steps.
  - `quillmoor` — estate: `helpdesk` is a member of Domain Admins (`domain-admins.txt`) → it can reset any password, including administrator; the delegated design replaces that. From the DR estate. 4 steps.
- **Steps:** max 5.
- **Legend:** explicit ACE (solid key), inherited ACE (key with arrow), deny (⛔), protected account (shield), test ✓/✕; "changed" highlight marks the ACE added/removed or the test just run.
- **Captions:** hr: "Čarobnjak je na `OU=Staff` dodao ACE: `Helpdesk` smije *reset password* (postaviti novu lozinku) na svim korisnicima ispod." en: "The wizard added an ACE on `OU=Staff`: `Helpdesk` may reset the password of every user below it."
  hr: "SDProp je prepisao ACL računa `tbrennan-adm` iz AdminSDHoldera: nasljeđivanje je isključeno i delegiranje više ne vrijedi." en: "SDProp overwrote `tbrennan-adm`'s ACL from AdminSDHolder: inheritance is off and the delegation no longer applies."
- **Terms:** delegation of control — delegiranje ovlasti (check); access control entry — unos kontrole pristupa (ACE) (check); inheritance — nasljeđivanje (UL ch07 "nasljeđuju"); permission — dozvola (UL ch07); protected account — zaštićeni račun (check); extended right — prošireno pravo (check).
- **Misconceptions:** helpdesk needs Domain Admins to reset passwords; delegation on an OU covers admins in it; delegation is a group membership.
- **Out of scope:** the ACL editor's every right, tiered admin models, local administrator password management.
- **Builds on `win-ad-structure`:** reuses its OU tree; new are ACLs and the test panel.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-delegation sims/win-delegation` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-delegation/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
