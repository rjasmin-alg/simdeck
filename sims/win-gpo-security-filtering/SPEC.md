<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-security-filtering: spec

Task `docs/tasks/w3/win-gpo-security-filtering.md`, catalogue §4.5.2. One concept: **who a GPO applies to; the
computer account needs Read too**. Class stepper.

## Scene

- One GPO, **Sales Drive Maps**, user settings only (a drive map `S:`), linked to `OU=Staff`.
- Its delegation list (the ACL as the delegation tab shows it): one row per principal, with **Read**, **Apply Group
  Policy** and whether the row is an allow or a deny entry. Default rows *(check: GPMC default delegation)*:

  | principal | Read | Apply | type |
  |---|---|---|---|
  | Authenticated Users | ✓ | ✓ | allow |
  | Domain Admins | ✓ | – | allow (plus edit rights, not shown) |

  The real default also lists Enterprise Admins, SYSTEM and Enterprise Domain Controllers (Read, no Apply)
  *(check)*; they match none of the scene's tokens and are left out so the table fits one screen.

- One computer, **PC07**, in `OU=Staff`'s domain; its token: `PC07$`, Domain Computers, Authenticated Users,
  Everyone. Chassis: desktop (type 3) or, with the `pc07Laptop` param, a laptop (type 9).
- Three users, all in `OU=Staff`, each logging on to PC07:

  | user | groups (besides Domain Users, Authenticated Users, Everyone) |
  |---|---|
  | `ana` | Sales |
  | `eyardley` | – |
  | `boss` | Sales, Managers |

- An optional WMI filter **Laptops only**:
  `SELECT * FROM Win32_SystemEnclosure WHERE ChassisTypes = 9 OR ChassisTypes = 10` *(check values: 9 Laptop,
  10 Notebook; 3 Desktop)*, true on PC07 only when it is a laptop.

## Rules

Sources: Microsoft Learn, "Security filtering using GPMC"; "WMI filtering using GPMC"; MS16-072 "Security update for
Group Policy" (KB3163622, June 2016) *(check titles)*.

1. **Link scope, Read and Apply.** A GPO linked to the user's OU (or a parent) applies to a user only when the user's
   token has both Read and Apply Group Policy allowed. The default delegation gives both to Authenticated Users.
2. **Deny wins.** A deny entry on Read or on Apply that matches the token wins over any allow. Deny is checked after
   the allow check; both give "Denied (Security)".
3. **The computer reads the GPO list (MS16-072).** Since June 2016 the client retrieves the GPOs for user policy in
   the computer's security context: the computer's token must have Read allowed (and not denied). Without it the
   GPO is **Inaccessible** for every user on that computer, whatever the users' own rights *(check: the report's word
   "Inaccessible")*.
4. **So** "remove Authenticated Users, add Sales" breaks the GPO for everyone. The fix is Read (without Apply) for
   Authenticated Users or Domain Computers; Apply stays with Sales only.
5. **WMI filter.** One per GPO, evaluated on the computer. False → the whole GPO is skipped for that computer and all
   its users: **Denied (WMI Filter)**. The user plays no part in it.
6. **Filtering never changes precedence.** Filtered GPOs are removed from the list; the rest keep their order
   (`keepOrder`, model only; precedence is out of scope here).
7. **Reboot.** The computer's token is built at startup: a computer added to a group gets that group's rights on the
   GPO only after a reboot (`win-access-token`). Model only (`pc.bootGroups`, `restart`), no page control.
8. **Tie-break: security before WMI.** When security filtering and the WMI filter both exclude, the reason shown is
   the security one (inaccessible or Denied (Security)), since it is checked first *(check order)*. The model still
   records that the WMI filter would be false (`alsoWmi`).

## Decision path (one per target)

In order; the first check that fails stops the path and gives the reason; later checks are not reached.

| # | check | fails → reason |
|---|---|---|
| 1 | GPO linked to the user's OU or a parent | `scope` (the GPO is not in the user's list at all) |
| 2 | the computer's token has Read, no deny on Read | `inaccessible` |
| 3 | the user's token has Read and Apply allowed | `security` |
| 4 | no deny on Read or Apply matches the user's token | `security` |
| 5 | no WMI filter, or the filter is true on the computer | `wmi` |
| → | all pass | applied |

## Params

| param | values | default |
|---|---|---|
| `aclMode` | `default` · `sales` (AU removed, Sales Read + Apply) · `sales-dc` (plus Domain Computers Read) | `default` |
| `denyManagers` | toggle: adds Managers, Deny on Apply | off |
| `wmi` | `none` · `laptops` | `none` |
| `pc07Laptop` | toggle | off |

## Steps

- Step 0: the GPO with the default delegation, no WMI filter, nothing evaluated.
- Step 1, only when the params change the GPO (`aclMode` ≠ default, `denyManagers` or `wmi` ≠ none): the admin's
  change; the changed rows (added, removed) and the WMI card are highlighted. `pc07Laptop` alone is no change.
- Then one target per step: `ana`, `eyardley`, `boss`, each on PC07.
- Steps = 3, or 4 with an admin step. `sim.json` `steps` = 3 (the default preset). At most 4.

## Presets and expected results

Checked with `node sims/win-gpo-security-filtering/sim.test.js` (the preset table test), derived from the rules above.

| preset | params | steps | ana | eyardley | boss |
|---|---|---|---|---|---|
| `default` | – | 3 | ✓ | ✓ | ✓ |
| `sales-only-broken` | `aclMode: sales` | 4 | ✕ inaccessible | ✕ inaccessible | ✕ inaccessible |
| `sales-fixed` | `aclMode: sales-dc` | 4 | ✓ | ✕ security (no Read + Apply) | ✓ |
| `deny-managers` | `aclMode: sales-dc, denyManagers` | 4 | ✓ | ✕ security | ✕ security (deny) |
| `wmi-laptops` | `wmi: laptops` | 4 | ✕ WMI | ✕ WMI | ✕ WMI |

Further checked combinations: `wmi-laptops` with `pc07Laptop` → all ✓; `sales` with `wmi: laptops` → all
inaccessible (rule 8); `deny-managers` with `wmi: laptops` → ana ✕ WMI, eyardley and boss ✕ security (rule 8).

## Misconceptions the captions answer

- "Filtering to a user group needs only that group": the computer needs Read too (rule 3, `sales-only-broken`).
- "Deny is the normal way to filter": `eyardley` is filtered out by having no Apply (`sales-fixed`); Deny is for an
  exception inside a group that has Apply (`deny-managers`).
- "A WMI filter applies to users": it is evaluated on the computer; every user on PC07 gets the same answer.

## Out of scope

Item-level targeting (`win-gpo-targeting`), loopback, precedence (`win-gpo-precedence`), writing WMI queries.
