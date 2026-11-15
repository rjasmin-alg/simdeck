<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-loopback: specification

One concept: **user policy from the computer's OU, replace vs merge** (loopback processing). Task:
`docs/tasks/w3/win-gpo-loopback.md`; catalogue §4.5.2. Builds on `win-gpo-precedence` (its processing list, copied
into `sim.js` because `models/` has no GPO model yet).

## 1. Scene

Domain `quillmoor.example` (the same domain as `win-gpo-precedence`). The user `ana` logs on to the computer `KIOSK1`.

| Container | Holds | GPO linked (link order 1) | User settings | Computer settings |
|---|---|---|---|---|
| `OU=Staff` | user `ana` | Staff User | wallpaper = `staff.jpg`; drive `P:` mapped | none |
| `OU=Kiosks` | computer `KIOSK1` | Kiosk Lockdown | wallpaper = `kiosk.jpg`; hide Control Panel = on | loopback mode = `mode` (off = not configured) |

Security filtering: Staff User has the default (Authenticated Users: Read + Apply). Kiosk Lockdown: computers always
have Read + Apply (`computersCanRead`, model only); users have Read + Apply when `usersCanRead` is on (default on).

Defaults when no GPO sets a user setting: wallpaper = the default one, no drive `P:`, Control Panel visible.

The two lists:

- **user list**: the GPOs on the user's path (`OU=Staff`), in the normal order (`win-gpo-precedence`);
- **computer list**: the GPOs on the computer's path (`OU=Kiosks`), in the normal order, used for their *user* half.

## 2. Rules

Sources: Microsoft Learn, "Loopback processing of Group Policy" *(check title)*; Administrative Templates policy
reference, "Configure user Group Policy loopback processing mode" (Computer Configuration › Administrative
Templates › System › Group Policy) *(check path)*; [MS-GPOL] §3.2.5.1 for the GPO list order *(check section)*.

1. **Without loopback**, a user's settings come from the GPOs in the user's path (`OU=Staff`). The user settings in
   a GPO linked to the computer's OU do nothing for that user; they would apply only to users whose accounts sit in
   that OU (none here). They are shown as *unused*.
2. **Loopback is a computer setting.** Its mode is read from the computer list's *computer* half, in the normal
   precedence (last writer wins), and takes effect only when the GPO that sets it applies to the computer (link
   enabled, computer half enabled, the computer has Read + Apply). Otherwise the mode is off.
3. **Merge:** the user list is processed first, then the user settings of the computer list. On a conflict the
   computer list wins, because it is processed last (last writer wins).
4. **Replace:** only the computer list provides user settings; the user list's GPOs are dropped (*replaced*).
5. **Security filtering still holds, against the user:** in loopback the computer list's GPOs are filtered with the
   user's token; without Read + Apply for the user, the GPO is dropped (*filtered*) and gives the user nothing. The
   user list is filtered the same way (Staff User is readable on this scene).
6. **Within each list the normal precedence holds** (`win-gpo-precedence`): link order, Enforced, Block Inheritance,
   disabled links, a disabled user half. Tested on model scenes; the page's scene has one GPO per list.

Tie-breaks the model fixes:

- **Loopback off and not readable**: a computer-list GPO is reported *unused* (rule 1), not *filtered*: without
  loopback it never enters the user's list, so filtering is never asked.
- **Replace and not readable**: a user-list GPO is reported *replaced*, not *filtered* (rule 4 decides first).
- **A drop from the normal precedence** (blocked, link disabled, user half disabled) is reported before any loopback
  reason: the GPO is not in its list at all.
- **One GPO in both lists** (linked to both OUs) is listed in each; in merge its computer-list settings come last.
- **Not configured is not a value:** a GPO that does not set a setting leaves the earlier value standing; a setting no
  applied GPO sets keeps the default.

## 3. Steps

The table lists every user setting of every GPO in both lists, in processing order: the user list first, then the
computer list. One step takes one GPO: it adds that GPO's user settings to the result (a value overwrites the value
standing for the same setting) or drops all of them with the reason (*unused*, *replaced*, *filtered*, or a
precedence reason). The last step shows the result: per setting, the last value added wins; a setting no GPO set keeps
its default. Steps = GPOs in both lists + 1.

## 4. Presets and expected results (checked by `sim.test.js`)

| Preset | Params | Processing (one step each) | Result: wallpaper / drive P: / Control Panel | Steps |
|---|---|---|---|---|
| `no-loopback` | `mode: off` | Staff User adds staff.jpg, P: → Kiosk Lockdown unused | staff.jpg (Staff User) / mapped (Staff User) / visible (default) | 3 |
| `merge` | `mode: merge` | Staff User adds staff.jpg, P: → Kiosk Lockdown overwrites wallpaper with kiosk.jpg, adds hide CP | kiosk.jpg (Kiosk Lockdown) / mapped (Staff User) / hidden (Kiosk Lockdown) | 3 |
| `replace` | `mode: replace` | Staff User replaced → Kiosk Lockdown adds kiosk.jpg, hide CP | kiosk.jpg (Kiosk Lockdown) / not mapped (default) / hidden (Kiosk Lockdown) | 3 |
| `filtered` | `mode: replace`, `usersCanRead: off` | Staff User replaced → Kiosk Lockdown filtered | default / not mapped / visible: every setting at its default | 3 |

**Deviation:** the task gives `replace` 2 steps. With "one step = one GPO added or dropped with the reason", Staff
User's drop under replace is a step of its own, as it is in `filtered` (3 steps in the task). Every preset therefore
has 3 steps; `sim.json` `steps` is 3. NOTES.md says so.

Not a preset, from the params: merge with `usersCanRead` off gives Staff User's settings only (staff.jpg, P:, Control
Panel visible): loopback is on for the computer, but the user cannot read the kiosk's GPO.

## 5. Out of scope

The timing (`win-gpo-processing`), preferences item-level targeting, RDS session hosts (mentioned in the explanation
only), computer settings other than the loopback mode itself.
