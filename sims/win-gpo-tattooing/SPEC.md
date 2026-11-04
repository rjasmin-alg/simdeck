<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-tattooing: spec

Task `docs/tasks/w3/win-gpo-tattooing.md`, catalogue §4.5.2. One concept: **a policy reverts when the GPO goes
away; a preference stays (tattooing)**. Class stepper. Builds on `win-gpo-processing` (its refresh timeline: a
logon processes the user part, then a background refresh every 90 min plus a random offset).

## Scene

| Thing | Data |
|---|---|
| GPO | `Quillmoor Desktop`, user settings, linked to `OU=Staff` |
| User, computer | `ana` (in `OU=Staff`), logged on to `PC07` |
| Policy item | Administrative Templates › Control Panel › *Prohibit access to Control Panel and PC settings*: Enabled. Lands at `HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer`, value `NoControlPanel = 1` |
| Preference item | Preferences › Windows Settings › Registry: `HKCU\Software\Quillmoor`, value `ProxyMode = 1` (REG_DWORD), action **Update**; Common tab: *Remove this item when it is no longer applied* (param), *Apply once and do not reapply* (param) |
| Registry at the start | both values absent: Control Panel opens; the in-house app uses its default proxy mode |
| Time | minutes; `t = 0` ana's logon; the admin's or ana's action at `t = 30`; the next background refresh at `t = 100` (90 min + an offset, fixed here at 10; `win-gpo-processing` draws it) |

## Rules

Sources: Microsoft Learn, "Group Policy preferences in Windows" (2025, read in full: preferences are refreshed each
time Group Policy updates, a user's change persists only until the next refresh; the Common tab table: *Remove this
item when it is no longer applied* removes the item's settings when it falls out of scope and **automatically sets
the action to Replace**; *Apply once and do not reapply* applies a single time); Microsoft Learn archive, Group
Policy team blog, "GP Policy vs. Preference vs. GP preferences" (J. Herman, 2008-03-04, read in full: policy
settings do not tattoo, are removed when the GPO goes out of scope, and the UI is unavailable; GP preferences
tattoo by default); Microsoft Learn, "Remove this item if it is no longer applied option" (KB 3060859: a local
database per computer records what was applied, `…\Group Policy\History`); Microsoft Learn, Policy CSP
ADMX_ControlPanel (`NoControlPanel` under `Software\Microsoft\Windows\CurrentVersion\Policies\Explorer`); Microsoft Learn, previous
versions, "Administrative templates overview for GPMC" (cc779058, rules 1, 4, 5: the Policies trees are cleaned and
rewritten at processing, cannot be modified by a non-administrator; ADM settings outside them are preferences).

1. **Policies are owned by Group Policy.** An Administrative Templates policy writes its value under a Policies key
   (`…\Software\Policies`, `…\Software\Microsoft\Windows\CurrentVersion\Policies`). When the GPO no longer applies,
   the next processing deletes the value → the setting reverts to the default (no tattoo).
2. **Preferences tattoo.** A preference writes to an ordinary location; when the GPO no longer applies the value
   stays (tattoo), unless *Remove this item when it is no longer applied* is set: then it is deleted (not set back
   to any earlier value). Setting that option makes the action **Replace** (delete and recreate).
3. **Preferences are reapplied at each refresh.** A user's change is overwritten at the next refresh, unless
   *Apply once and do not reapply* is set and the item was applied before.
4. **Users can change a preference; a policy is enforced.** The user changes `ProxyMode` in the app; Control Panel
   does not open while `NoControlPanel = 1` (the restriction message), and the value under the Policies key is not
   the user's to change (the Policies trees "cannot be modified by a non-administrator").
5. **Location, not the word "policy", decides.** An old ADM template that writes outside the Policies keys tattoos
   like a preference (such settings "are known as preferences" and persist). Model and rule table only (row 3); no preset uses it.
6. **Tie-break: unlink and refresh together.** When the unlink and a refresh fall in the same minute, the refresh
   runs without the GPO: removal (or tattooing) happens in that refresh.
7. **Unlinking changes nothing on the PC by itself.** The client learns of it at its next processing pass (from
   `win-gpo-processing`).

## What a pass does with an item (rule table, first match, top down)

| # | item | GPO applies | condition | → |
|---|---|---|---|---|
| 1 | policy | yes | – | write the value (enforced) |
| 2 | policy | no | value under a Policies key | delete the value: default again |
| 3 | policy | no | value outside the Policies keys (old ADM) | leave it: tattoo |
| 4 | preference | no | *Remove this item…* | delete the value |
| 5 | preference | no | – | leave it: tattoo |
| 6 | preference | yes | *Apply once*, applied before | leave it (the user's value stays) |
| 7 | preference | yes | – | write the value (Update; Replace with *Remove…*) |

Rows read by an item are those of its own kind; rows of its kind above the deciding row are "–", below it "not
read". A step that is not a pass (unlink, a user's action) reads no row.

## Params

| param | values | default | note |
|---|---|---|---|
| `script` | `unlink` (logon, unlink at 30, refresh at 100) · `unlinkAtRefresh` (logon, unlink and refresh at 100) · `edit` (logon, ana sets `ProxyMode = 0` at 30, refresh at 100) · `try` (logon, ana tries both at 30) | `unlink` | added: what happens after the logon |
| `removeWhenNotApplied` | toggle | off | task |
| `applyOnce` | toggle | off | task |

Steps: 3 (`unlink`, `edit`), 2 (`unlinkAtRefresh`, `try`). `sim.json` `steps` = 3 (defaults).

## Outcome codes per item and step

Policy: `write` (absent → 1), `same` (1 rewritten), `remove`, `tattoo` (rule 5), `none` (nothing to do), `waits`
(no pass this step), `blocked` (ana tried: refused), `untouched` (ana changed something else).
Preference: `write`, `overwrite` (ana's 0 → 1), `same`, `once` (not reapplied), `remove`, `tattoo`, `none`,
`waits`, `userSet` (ana set 0).

## Expected numbers (checked by `NOTES.md` § Checks, then by the tests)

| preset | params | step 1 (t = 0 logon) | step 2 | step 3 (t = 100 refresh) |
|---|---|---|---|---|
| `unlink` | defaults | policy write → 1 (row 1); pref write → 1 (row 7) | t = 30 unlink: both `waits`, 1 / 1 | policy remove → absent (row 2); pref tattoo, 1 (row 5) |
| `remove-flag` | `removeWhenNotApplied` | as above, action Replace | as above | policy remove (row 2); pref remove → absent (row 4) |
| `user-edit` | `script: edit` | write / write | t = 30 ana sets 0: policy `untouched` 1, pref `userSet` 0 | policy same 1 (row 1); pref overwrite 0 → 1 (row 7) |
| `apply-once` | `script: edit`, `applyOnce` | write / write (row 7, first time) | ana sets 0 | policy same (row 1); pref `once`, stays 0 (row 6) |
| `policy-locked` | `script: try` | write / write | t = 30: policy `blocked` (stays 1, Control Panel refused); pref `userSet` 0 | – (2 steps) |
| (no preset) | `script: unlinkAtRefresh` | write / write | t = 100 unlink + refresh: policy remove; pref tattoo 1 (rule 6) | – |

## Tests (`sim.test.js`)

Tie-break first (rule 6: an unlink and a refresh in one event run the refresh without the GPO, also with the
Remove option), then one test per rule (1–5, 7), the rule-table order (row 4 before 5, row 6 before 7), the five
presets' numbers above, step counts, and the template's generic block (determinism, JSON-safe state, replay,
strings tables match).
