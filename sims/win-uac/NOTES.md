<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-uac — notes

Task `docs/tasks/w3/win-uac.md` (thread t-0260, 2026-11-05). Stepper; the DACL of each target is kit view K4
(`kit/ruletable.js`, mode `first`). Rules and expected results: `SPEC.md`.

## Decisions

- **Layout.** Top left: the logon (who, UAC on/off) and the two token cards side by side, filtered (thin border) and
  full (thick border), with a chain between a linked pair; each card lists the SIDs (filled chip = enabled, hatched chip
  with a stop octagon = deny-only, the SID beside it), the privileges as key chips (the full token shows the five it
  shares with the filtered one, three notable ones, and "+ 16 more"), and the integrity badge M / H. Top right: the
  process tree (explorer.exe, cmd.exe "run as administrator", notepad.exe), each with its user, token, level and the
  result of its attempts; the UAC prompt appears under Explorer while it is open. Bottom, full width: the access check
  of the last attempt (process, token, target, the integrity check, the verdict) beside the DACL as K4. The first try
  had the check in a right column; K4 with its notes did not fit there.
- **One plan from the params**, no hidden script param: logon, Explorer, the attempt; if denied and elevation is
  possible: prompt, approve, the attempt from cmd.exe; with `children`: notepad from cmd.exe (if elevated) and from
  Explorer. This gives exactly the task's step counts (6 / 3 / 6 / 8 / 4) and sensible runs for all 48 param sets
  (3 to 8 steps). `sim.json` `steps` = 6 (defaults = `admin-filtered`).
- **Param `children`** (toggle, off) was added: the task's `child-inherits` (8 steps) and `uac-off` (4 steps) need
  the child steps, and a toggle lets any run end with them.
- **`account` and `task` are selects** (a three-option choice with long labels made the panel 19 px too tall).
- **The state** follows the task's shape with `tokens: { filtered, full }`; a standard user's single token sits in the
  `filtered` slot with `kind: 'standard'`, and after the credential prompt `admin-it`'s full token in `full` (not
  linked). An unsplit administrator (UAC off, built-in Administrator) has only `full`.
- **Integrity check shown, never deciding** for the four tasks (objects unlabelled = Medium): it is on the page so that
  students see it is the DACL, not the level, that refuses the write. A test covers a High object.
- **Privileges: held = usable.** Enabled vs disabled privileges (a program enables a held one) is left out.
- **"Changed"** marks: on logon the cards; on a check the chips it used (the deciding SID, or the deny-only SID whose
  allow did not count, or the privilege); a new process box; the prompt.
- **Access check** copied in spirit from `sims/win-access-token/sim.js @ b69e015` (`tokenSids`, `check`: top down, the
  first matching entry decides), extended with deny ACEs, SID attributes, rights per entry, integrity and privileges.
  `models/` has no token model; the two checks differ enough that this one is written anew (see Shared requests).
- **Names.** Local accounts on PC-07 (`ana`, `marko`, `admin-it`, `Administrator`), processes `explorer.exe`,
  `cmd.exe`, `notepad.exe`, the service `Spooler`. Windows names are the concept here (COMMON §1). Windows permission
  names (Full control, Read & execute, Read) are data, as in the NTFS sims.

## Deviations from the task

- Added the `children` param (above). The task's state had no slot for a second user's token; `admin-it`'s full token
  takes the `full` slot.
- Rule 7 (network logon) is a model function with tests (`networkToken`) and a sentence in the explanation; the task
  names no param or preset for it. Added from the review: the built-in Administrator is not filtered remotely either.
- "UAC off" is the Admin Approval Mode policy off (EnableLUA = 0), not the "never notify" slider; the explanation says
  so (the hint stays short so the panel fits).
- UAC off: no prompt at all, so a standard user stays denied (3 steps) *(check)*.
- DACLs simplified (TrustedInstaller, CREATOR OWNER, application-package SIDs left out); the deny-only
  "Local account and member of Administrators group" SID (S-1-5-114) left out of the tokens.
- The tie-break (deny vs allow, DACL order) is in the model and tested; no preset target has a deny ACE, so the page
  never shows it. The explanation states the deny-only rule ("matches deny entries only").

## Sources

Cited from memory; no network access to Microsoft's documentation in this session.

- Microsoft Learn: "How User Account Control works" (linked tokens, Admin Approval Mode, consent and credential
  prompts, children inherit), "User Account Control settings and configuration" (policy "Admin Approval Mode for the
  Built-in Administrator account"), "Mandatory Integrity Control" (Medium / High, no write up).
- Win32: "How DACLs Control Access to an Object", "Restricted Tokens" / `TOKEN_LINKED_TOKEN`.
- Microsoft support: "Description of User Account Control and remote restrictions in Windows Vista"
  (`LocalAccountTokenFilterPolicy`).
- URM ch18 („načelo najmanje ovlasti"); `uvod-u-linux` ch. 7 „Kad treba više nego što smijete" (`sudo`): the one-line
  comparison in the explanation.

## Unchecked *(check)*

- Every Microsoft title above.
- The five privileges of the filtered token (SeShutdown, SeChangeNotify, SeUndock, SeIncreaseWorkingSet, SeTimeZone)
  and the 24 of a full administrator token (Windows 10/11 client); "+ 16 more" depends on that count.
- The groups that become deny-only (Administrators, Backup Operators, Power Users, Account/Server/Print Operators,
  Network Configuration Operators).
- UAC off: the single admin token is High; "Run as administrator" gives no prompt and no elevation for a standard user.
- Built-in Administrator (RID 500) not in Admin Approval Mode by default.
- Network logon: local admin filtered with `LocalAccountTokenFilterPolicy` = 0, full with 1; domain admin full.
- Changing the time zone needs only SeTimeZonePrivilege (no elevation for an admin or a standard user).
- The simplified DACLs of `C:\Program Files`, `HKLM\SOFTWARE` and a service (INTERACTIVE: query only).
- Microsoft's wording that UAC is not a security boundary.
- Croatian terms: *privilege* — ovlaštenje (glossary, from uvod-u-linux) rather than the task's "povlastica".

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| access token | pristupni token (as in `win-access-token`) |
| filtered token / full token | filtrirani token / puni token |
| linked tokens | povezani tokeni |
| deny-only (SID) | SID samo za zabranu |
| integrity level | razina integriteta *(check)* |
| elevation | podizanje ovlasti *(check)* |
| consent prompt / credential prompt | upit za potvrdu / upit za korisničko ime i lozinku |
| Admin Approval Mode | način odobrenja administratora *(check)* |
| local administrator | lokalni administrator |
| least privilege | najmanja ovlast (URM ch18 „načelo najmanje ovlasti") |

Used from the glossary: `[[privilege]]` (ovlaštenje), `[[access control list]]`, `[[elevated privileges]]`.

## Shared requests

- **models/:** a Windows token / access-check model (`models/win-token.js`?): token = user SID, group SIDs with an
  attribute (enabled / deny-only), privileges, integrity level; `check(token, dacl, right)` with deny and allow ACEs,
  first match decides, deny-only matching deny ACEs only, an optional integrity pre-check. `win-access-token`'s `check`
  is the allow-only special case; `win-ntfs-share-effective` and `win-ntfs-inheritance` have their own rights atoms.
  This sim's `logonSids`, `fullToken`, `filterToken`, `logonTokens`, `networkToken`, `attrOf`, `integrityOk` and
  `check` are pure and string-free, promotable unchanged.
- **K4:** none needed; the per-row notes ("not in the token", "deny-only: does not count", "does not cover write")
  use `note`.

## Tags

Topic `windows-admin`, tag `permissions` (both in `tags.json`).

## Checks

- Numbers: an independent Python hand model (step counts and the access results of the five presets and five other
  param sets) before coding; the model agrees.
- Tests: 28; every rule and the tie-break, then the template's generic block. 52 single-change mutations of
  `sim.js` (the reviewer's runner), every one killed.
- Browser: a sweep of 17 states × two languages at 1920×1080 (no page scroll, nothing outside the stage or a box, no
  sideways scroll inside, no `undefined`/`NaN`/`null`/`{`, no console errors), the gate's screenshots (light, dark,
  grayscale, 375×812, both languages) and a full-page phone shot. Fixed from them: the panel 19 px too tall, SIDs
  breaking mid-number, the DACL table scrolling sideways in a right column (moved to the bottom row), a long Croatian
  note, SIDs clipped on a phone.

## Time

Start 2026-11-05 02:01, done about 02:25 (clock read at both ends; the system clock may be off, the work felt
longer). Roughly: reading 5 min, spec, hand model and model 5 min, tests, strings and page 5 min, layout fixes from
screenshots 5 min, the fresh review (in parallel with NOTES) and its fixes 5 min.

## Review

A fresh reviewer (a separate agent, given the diff, SPEC and the task, not my conclusions) read the model against SPEC,
loaded all 48 param sets × every step × both languages (516 pages, no console errors or unfilled text), checked the
Windows claims, and ran 51 mutations; 6 survived. Fixed:

- `capApproveCred` used `{admin}` twice; the one node moved to the second slot and the first was empty ("runs as ,").
  Reworded to one placeholder.
- `capLogonOff` and `capSpawnExplorerFull` named ana also for the built-in Administrator: now `{user}`.
- `capDeniedStandard` said "Users lacks the right" also for the service (whose matching entry is INTERACTIVE): now
  "no entry for his groups covers {need}".
- `capDeniedOff`: "start the program as another user" instead of "log on as an administrator".
- Tests for the six survivors: the order of the two child steps, cmd.exe's parent, the console's child running as
  admin-it, `promptKind` null for the built-in Administrator and with UAC off, `networkToken` with UAC off; plus the
  built-in run's deciding row.
- Explanation: the built-in Administrator exception for network logons; "UAC off" ≠ the "never notify" slider.
- SPEC: the filtered token is `TokenElevationTypeLimited` (deny-only groups, no restricting SIDs), not a "restricted
  token".
- `plan()` normalises an unknown task like `initial()` does.

After the fixes: 52 mutations, all killed; the 516-page sweep clean again.
