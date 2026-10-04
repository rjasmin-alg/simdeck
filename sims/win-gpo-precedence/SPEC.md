<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-precedence: specification

One concept: **which GPO's value wins for one setting on one computer**: local → site → domain → OU, link order,
Enforced, Block Inheritance. Task: `docs/tasks/w2/win-gpo-precedence.md`; catalogue §4.5.2.

## 1. Scene

The computer `PC07` sits in `OU=Workstations` under `OU=Quillmoor` in the domain `quillmoor.example`, site `HQ`.
Its path, top down, with the links (derived from the estate's link layout, values invented, *(check)* only in the
sense that they are examples):

| Container | Kind | Links (link order) | Lock after inactivity | Removable storage: deny |
|---|---|---|---|---|
| Local Group Policy | L | local GPO | 20 min | not configured |
| `HQ` | S | none | | |
| `quillmoor.example` | D | Domain Lockdown (1), Enforced = `enforceDomain` | 15 min | on |
| `OU=Quillmoor` | OU | Quillmoor Base (1) | not configured | not configured |
| `OU=Workstations` | OU, Block Inheritance = `blockWs` | WS Standard (2), WS Kiosk (1); swapped by `swapOrder`; WS Kiosk Enforced = `enforceOu`; WS Standard link disabled = `disableStd` (model and tests only, no control on the page) | 10 min / 5 min | not configured |

With `cn` on, the computer is `PC19` in `CN=Computers`: its path is local, site and domain only.

**Setting** (deviation from the task, NOTES.md): the task's "Screen saver timeout" is a *user* setting, so for a
computer it would come from the user's OU, not the computer's, unless loopback is on (out of scope,
`win-gpo-loopback`). The sim uses the computer setting with the same meaning, "Interactive logon: Machine inactivity
limit" (lock the session after N minutes idle; stored in seconds, shown in minutes), and keeps every number of the task.
A second setting, "removable storage: deny all access", is set only in Domain Lockdown: it shows that a setting only
the blocked GPO sets is gone under Block Inheritance (task, preset `block`).

## 2. Rules

Sources: Microsoft Learn, "Group Policy processing and precedence" *(check title)*; GPMC help "Block inheritance",
"Enforce a GPO link" *(check titles)*; [MS-GPOL] §3.2.5.1 "GPO list" *(check section)*.

1. **Processing order (LSDOU).** Local GPO, then site, then domain, then OUs from parent to child. Within one
   container the link with the highest link order number is processed first, link order 1 last.
2. **Last writer wins.** For a setting configured by several GPOs, the one processed last wins: closer to the
   computer wins, and link order 1 wins within a container.
3. **Block Inheritance** on an OU drops the links of every container above it (site, domain, parent OUs), except
   enforced links. The local GPO is not inherited from AD and is not blocked. A block on a parent OU also applies.
4. **Enforced** links are taken out of the normal order and processed after every non-enforced link, the deepest
   container first and the highest container last: an enforced domain GPO beats an enforced OU GPO and every
   non-enforced GPO. Enforced links pass Block Inheritance. The local GPO cannot be enforced. A site is higher than
   the domain, so an enforced site link would come after an enforced domain link *(check; no site link on this scene)*.
5. A **disabled link**, or a GPO whose half for this object (computer settings for a computer) is disabled, is
   skipped.
6. **Not configured is not a value.** A GPO that does not configure the setting is processed but changes nothing.
   When no GPO configures it, the setting stays not configured (the system default).
7. **CN=Computers / CN=Users** are containers, not OUs: no GPO can be linked to them, so a computer there gets only
   local, site and domain GPOs.
8. **Tie-break: one GPO linked at two levels** is listed at each link and processed at each; its last processing
   counts *(check)*. Not on the page's scene; tested on a model scene.

Further tie-breaks the model fixes:

- **Two links in one container with the same flag**: ordered by link order (rule 1), also among enforced links in one
  container *(check)*.
- **Blocked and disabled at once**: reported as blocked (the block is decided first, from the path).
- **Blocked GPOs in one step**: every GPO dropped by Block Inheritance is shown dropped in a single step at the
  place of the first, since the block drops them together; each keeps its own row.

## 3. Steps

A step processes the next entry of the list: applies its value (the previous value is overwritten), notes "not
configured", or skips it with a reason (blocked, link disabled, half disabled). The last step names the winner (rule
2) or "not configured". Steps = entries (blocked ones counted once) + 1.

## 4. Presets and expected results (checked by `sim.test.js` and a script before coding)

| Preset | Flags | Processing list (lock) | Winner | Steps |
|---|---|---|---|---|
| `lsdou` | none | local 20 → Domain Lockdown 15 → Quillmoor Base n/c → WS Standard 10 → WS Kiosk 5 | WS Kiosk, 5 min | 6 |
| `link-order` | `swapOrder` | local 20 → Domain Lockdown 15 → Quillmoor Base n/c → WS Kiosk 5 → WS Standard 10 | WS Standard, 10 min | 6 |
| `block` | `blockWs` | local 20 → [Domain Lockdown, Quillmoor Base blocked] → WS Standard 10 → WS Kiosk 5 | WS Kiosk, 5 min; storage: not configured | 5 |
| `enforced-vs-block` | `blockWs`, `enforceDomain` | local 20 → [Quillmoor Base blocked] → WS Standard 10 → WS Kiosk 5 → Domain Lockdown 15 (enforced) | Domain Lockdown, 15 min | 6 |
| `two-enforced` | `enforceDomain`, `enforceOu` | local 20 → Quillmoor Base n/c → WS Standard 10 → WS Kiosk 5 (enforced) → Domain Lockdown 15 (enforced) | Domain Lockdown, 15 min | 6 |
| `computers-container` | `cn` | local 20 → Domain Lockdown 15 | Domain Lockdown, 15 min | 3 |

At most 6 steps on this scene; `sim.json` `steps` is 6 (the defaults, `lsdou`).

## 5. Out of scope

Security and WMI filtering (`win-gpo-security-filtering`), loopback (`win-gpo-loopback`), timing and refresh
(`win-gpo-processing`), preferences, account policies (which take effect only from domain-linked GPOs).
