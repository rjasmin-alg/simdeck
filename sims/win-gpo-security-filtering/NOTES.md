<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-security-filtering: notes

Thread t-0244, 2026-11-04. Task `docs/tasks/w3/win-gpo-security-filtering.md`.

## Decisions

- **Kit view K4** (`kit/ruletable.js`) draws the GPO's delegation list (principal, Read, Apply Group Policy, allow or
  deny). The rule here does not fit one of K4's modes, since there are two subjects (the computer needs Read, the user
  needs Read and Apply) and two rights. So the page gives each row its own `mark` (K4's "rule of the page's own"):
  `hit` "matches" for a row in PC07's or the user's token, with a note naming who and which right; `win` "denies" for a
  deny row that matches the user (with the outcome Denied (Security)); `beaten` "overridden" for the user's allow rows
  when a deny wins; `skip` "removed" for a row the admin removed; `no` "–" otherwise. `at: 'all'` on target steps (no
  pointer), `-1` elsewhere. No shared request: K4 had everything.
- **The decision path** is the page's own drawing: a grid with one row per user and five CSS diamonds (pending dashed,
  pass ✓ with a thick ink border, stop ✕ with a thicker danger border, not reached hatched), the principal or value
  that decided each check under it, and the result with the reason the client's report gives.
- **Steps.** Step 0 is the default GPO. Step 1 is the admin's change only when the params change the GPO; then one
  user per step. So the default has 3 steps and every other preset 4; `sim.json` `steps` is 3 (the default, which the
  gate compares with the controller). `pc07Laptop` alone is not an admin change.
- **Removed rows stay visible** (hatched, "removed") so the before/after reads in one table; the admin step tags added
  and removed rows with the highlight.
- **Scene trimmed:** the default delegation shows Authenticated Users and Domain Admins only. Enterprise Admins,
  SYSTEM and Enterprise Domain Controllers (Read, no Apply) match no token here and pushed the table past one screen
  with four added rows.
- **The model is promotable** (`decide`, `effective`, `keepOrder` take any GPO, computer and user; no strings).
- **Nothing reused from `win-gpo-precedence`'s model.** It computes processing order for one setting. This sim has
  one GPO, and filtering doesn't change order (rule 6). Reused from it: the K4 table, the `rich()` caption helper for
  the term rule, and the page structure.

## Deviations from the task

1. **Rule 7 (reboot)** is in the model and tested (`pc.groups` vs `pc.bootGroups`, `restart`), and mentioned in the
   explanation. It has no page control: the task's params have none, and a fourth delegation option would need its
   own group and computer membership on the scene.
2. **Rule 6 (precedence kept)** is a model function with a test and a line in the explanation; the scene has one GPO.
3. **Rule 1's link scope** is a check on the path (always ✓ on this scene; tested with a user outside `OU=Staff`).
4. **The Domain Admins row** stands for the default's admin rows (Read without Apply), see above.
5. **No `docs/tasks/OPEN.md` entry**: the gate's scope rule refuses any change outside `sims/<id>/`; owner questions
   are in the report.

## Sources

- Microsoft Learn, "Security filtering using GPMC" *(check title)*: Read + Apply Group Policy, Authenticated Users by
  default.
- Microsoft, MS16-072 "Security update for Group Policy", KB3163622, June 2016 *(check title)*: user policy GPOs are
  retrieved in the computer's security context; the fix is Read for Authenticated Users or Domain Computers.
- Microsoft Learn, "WMI filtering using GPMC" *(check title)*: one filter per GPO, evaluated on the target computer.
- Win32_SystemEnclosure `ChassisTypes` values *(check)*.

## Unchecked *(check)*

- All documentation titles above (no network in this thread).
- The report's reason words: "Inaccessible", "Denied (Security)", "Denied (WMI Filter)".
- Order of security filtering before the WMI filter (rule 8 tie-break).
- The full default delegation of a new GPO (Enterprise Admins, SYSTEM, Enterprise Domain Controllers rows).
- ChassisTypes: 3 Desktop, 9 Laptop, 10 Notebook. Also whether `ChassisTypes = 9` works in WQL on an array property
  (the query is the task's; writing WMI queries is out of scope).
- That `PC07$`, Everyone, Authenticated Users and Domain Computers are the computer token's relevant entries.
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| security filtering | sigurnosno filtriranje |
| WMI filter | WMI filtar |
| Apply Group Policy | primjena pravila grupe (column: primjena) |
| Read (permission) | čitanje |
| deny | zabrana |
| computer account | račun računala |
| permission | dozvola (UL ch07) |
| Authenticated Users | prijavljeni korisnici |
| delegation (GPMC tab) | delegacija *(check)* |
| chassis | kućište *(check)* |

## Shared requests

None.

## Tags

Topic `windows-admin`, tag `group-policy` (both in `tags.json`), level `advanced`.

## Time

Start 13:20, done 13:40 (about 20 min wall clock, one session, review agent included).

## Review

A fresh reviewer read the diff against SPEC.md and broke the model 36 ways: 29 caught at once. The real gaps are now
tested: `denyManagers` alone (default delegation, one admin step), no WMI filter at step 0, the Managers row's rights
(Deny on Apply only) and `userOk`. Three uncaught mutations are near-equivalent or display-only: a scope suffix
without the comma boundary, a computer deny on Apply, and the `via` of a denied computer read. The reviewer judged
the model's Windows facts sound. Page fixes from the review:
- A deny row that matches the user is marked "denies" only when the path reached the deny check (before, it showed
  for boss under Sales only + Deny, where the GPO is already inaccessible).
- The removed row's word no longer appears twice at the admin step.
- The hr table no longer has bare English: columns *čitanje* and *primjena*, check *čitanje i primjena*.
- Smoother Croatian wording in five captions.
- `lang="en"` on two terms in the hr explanation.
- No "eyardley's groups" in the second WMI caption.
