<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-fgpp: specification

One concept: **one domain password policy comes from the GPO at the domain root; PSOs override it by precedence**.
Task: `docs/tasks/w3/win-fgpp.md`; catalogue §4.5.1. The student applies PSOs to the user and her groups and sees
which policy wins and lands in `msDS-ResultantPSO`.

## 1. Scene

Domain `quillmoor.example`, functional level 2012 R2 (estate `forest.txt`: `Windows2012R2Domain`, so PSOs work;
the model stores it as 2012).
User `ana` sits in `OU=HQ,OU=Staff` (the estate's staff OU layout, `ou-tree.txt`). Groups are global security groups.

| Object | Where / applies to | Precedence | GUID (first group) | Min length | Complexity | Lockout threshold | Source |
|---|---|---|---|---|---|---|---|
| GPO `Default Domain Policy` | linked at the domain root | — | — | 7 | on | 10 | min length 7: estate `gpos.txt` comment; complexity on: the Windows default *(check)*; lockout 10: invented (the estate does not say; the Windows default is 0), so the "replaced as a whole" contrast shows |
| PSO `Default-Staff` | group `All Staff` (ana is a member unless `noStaff`) | 10 | `2b2b2b2b` | 4 | off | 0 (never) | estate `pso.txt` |
| PSO `Finance` | group `Finance` (ana is a member when `group2`) | 5, or 10 with `samePrecedence` | `7e7e7e7e` | 12 | on | 5 | task (precedence); values invented |
| PSO `VIP` | user `ana` directly when `directPso`, else nobody | 50 | `c4c4c4c4` | 15 | on | 3 | task (precedence); values invented |
| GPO `Staff Passwords` | linked to `OU=Staff` when `ouGpo` | — | — | 14 | on | 5 | task (min 14); the rest invented |

GUIDs are full 36-character values in `sim.js`; their first group repeats one byte so the order is the same whether
GUIDs are compared as text or as the stored bytes (the first four bytes are stored little-endian) *(check: which
comparison the DC uses)*.

## 2. Rules

Sources: Microsoft Learn, "AD DS fine-grained password and account lockout policy step-by-step guide" *(check
title)*; "Configuring fine-grained password policies for AD DS" *(check title)*: precedence, direct vs group, GUID
tie-break.

1. **Domain policy from the domain root.** The password and lockout policy of domain accounts comes from GPOs linked
   at the domain root (by convention the Default Domain Policy). Several such GPOs would be ordered by normal GPO
   precedence, setting by setting (`win-gpo-precedence`); this scene has one, and the model supports only one.
2. **An OU-linked password GPO does not touch domain accounts.** It only sets the local account policy of the
   computers in that OU. It is a candidate row only to be dropped.
3. **Where PSOs work.** Domain functional level 2008 or later (below it every PSO is ignored); a PSO applies to users
   and global security groups only, never to an OU (an admin uses a shadow group instead). A PSO naming an OU, a
   distribution group or a domain-local or universal group is ignored for that target.
4. **Direct first.** If one or more PSOs are applied to the user directly, the one with the lowest precedence value
   wins and every group PSO is ignored, however low its number. A PSO applied both directly and through a group
   counts as direct.
5. **Then groups.** Otherwise, among the PSOs that reach the user through group membership, including nested global
   groups *(check)*, the lowest precedence value wins.
6. **Tie-break: equal precedence → the smallest `objectGUID` wins** (within a tier). The model compares lowercase
   hex text; the scene's GUIDs make text and byte order agree.
7. **No PSO → the domain policy.** A PSO replaces the whole domain policy for that user, not field by field: a PSO
   with lockout threshold 0 means no lockout, even when the domain policy sets 10. `msDS-ResultantPSO` names the
   winning PSO, and is empty when the domain policy applies.

Tie-breaks the model fixes on top:

- **Order inside a tier**: precedence, then GUID; a tier's first row is kept, the others are beaten "by precedence"
  or, at equal numbers, "by GUID".
- **One PSO in both tiers** (rule 4): listed once, as direct.
- **A user in two groups that carry the same PSO**: the PSO is listed once, with the first group of the scene as its
  path.

## 3. Steps

Candidate rows, top down: direct PSOs, group PSOs (each tier sorted by precedence, then GUID), the domain-root GPO,
then OU-linked password GPOs. One step looks at one tier (direct, group, domain) that has rows: its best row is kept,
the others are beaten; an OU-linked GPO is dropped (rule 2). Once a tier has kept a row, the next step drops every
row below it at once (group PSOs: a direct PSO came first; the domain policy: a PSO applies; an OU GPO: rule 2). The
last step names the winner, copies it to `msDS-ResultantPSO` and shows the resultant settings.

Steps = tiers looked at + 1: 3 when a PSO applies, 2 when only the domain policy does. The task's maximum is 4.

## 4. Presets and expected results (checked with a script before the page, and by `sim.test.js`)

| Preset | Params | Rows (top down) | Steps | Winner | Resultant: min / complexity / lockout | `msDS-ResultantPSO` |
|---|---|---|---|---|---|---|
| `quillmoor` | none | Default-Staff (10, via All Staff), Default Domain Policy | group, drop, winner = 3 | Default-Staff | 4 / off / 0 | Default-Staff |
| `two-groups` | `group2` | Finance (5), Default-Staff (10), Default Domain Policy | 3 | Finance (Default-Staff beaten by precedence) | 12 / on / 5 | Finance |
| `direct-beats-group` | `directPso`, `group2` | VIP (50, direct), Finance (5), Default-Staff (10), Default Domain Policy | direct, drop, winner = 3 | VIP (rule 4) | 15 / on / 3 | VIP |
| `tie` | `group2`, `samePrecedence` | Default-Staff (10, `2b2b…`), Finance (10, `7e7e…`), Default Domain Policy | 3 | Default-Staff (Finance beaten by GUID) | 4 / off / 0 | Default-Staff |
| `ou-gpo` | `ouGpo` | Default-Staff (10), Default Domain Policy, Staff Passwords (OU=Staff) | 3 | Default-Staff (rule 2) | 4 / off / 0 | Default-Staff |
| (param) | `noStaff` | Default Domain Policy | domain, winner = 2 | Default Domain Policy (rule 7) | 7 / on / 10 | empty |

`sim.json` `steps` is 3 (the defaults, `quillmoor`).

## 5. Out of scope

Lockout mechanics (`win-account-lockout`), the tools that create PSOs, password filters, cloud password protection,
and several domain-root GPOs setting password values (that is `win-gpo-precedence`).
