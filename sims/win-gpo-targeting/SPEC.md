<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-targeting: spec

Task `docs/tasks/w3/win-gpo-targeting.md`, catalogue §4.5.2. One concept: **one GPO, preference items that apply per
group, IP range and OS (item-level targeting)**. Class stepper. Builds on `win-gpo-tattooing` (preferences tattoo;
*Remove this item when it is no longer applied* deletes and sets the action to Replace; removal needs this computer's
history of the item).

## Scene

| Thing | Data |
|---|---|
| GPO | `Drive Maps`, linked at the domain root, security filtering Authenticated Users: it applies to both users (rule 1). User Configuration › Preferences › Windows Settings › Drive Maps. From the estate's `gpos.txt` (`P: \\hq-fs01\projects · K: \\hq-fs01\cinematics · H: \\weft\home$\%USERNAME% · X: \\LOOM\builds`) |
| Item 1 | `P:` → `\\hq-fs01\projects`, target: user in group `Projects` |
| Item 2 | `K:` → `\\hq-fs01\cinematics`, target: user in group `Cinematics` |
| Item 3 | `H:` → `\\weft\home$\%USERNAME%`, no targeting (everyone) |
| Item 4 | `X:` → `\\LOOM\builds`, target: IP in `10.20.0.0 – 10.20.255.255` (Branch, = 10.20.0.0/16) AND NOT OS is a server |
| Action | Update; Replace when *Remove this item…* is set (param `removeFlag`, on all four items) |
| Users | `ana` (group `Projects`) on laptop `LT07`; `eyardley` (group `Cinematics`) on laptop `LT12`. Both workstations (computer role Workstation: not a server) |
| Locations | HQ: the laptop has `10.10.20.57`; Branch: `10.20.0.57` |
| Without targeting | param `targeting` off: the estate's GPO as it is, no targeting on any item |

## Rules

Sources: Microsoft Learn, "Group Policy preferences in Windows" (2025: preference items, the Common tab, item-level
targeting is set per item on the Common tab, *Remove this item when it is no longer applied* sets the action to
Replace and removes the item when it falls out of scope); Microsoft Learn (previous versions), "Item-level targeting"
/ "Preference Item-Level Targeting" (cc733022 family) *(check title)*: targeting items, AND/OR, "is not", collections;
the `win-gpo-tattooing` SPEC (rules 2 and the KB 3060859 history); `win-access-token` (groups are fixed in the token
at logon).

1. **The GPO first.** Item-level targeting runs on the client, inside a GPO that applies (link, security filtering,
   WMI filter: `win-gpo-security-filtering`). A GPO that does not apply evaluates no item. Targeting does not
   replace security filtering; it filters items within an applied GPO, at every processing pass. *(model test only:
   the scene's GPO always applies)*
2. **An expression.** A targeting expression is a list of targeting items, each with AND or OR and optionally
   "is not". It is evaluated left to right: `A OR B AND C` is `(A OR B) AND C`; grouping needs a collection
   *(check: precedence; cc733022 says each item is joined "with the preceding one" and collections make parenthetical
   expressions)*. No targeting = the item applies. The OS item matches a computer role (Workstation, Member Server,
   Domain Controller; cc753566); "is not a server" is modelled as one flag.
3. **Groups from the token.** A security-group targeting item checks the user's group membership as of the logon
   (the token: "determines group membership from the user's authentication token", AskDS 2011). Moving the user to
   another group in the directory counts from the next logon; a refresh before that still sees the old groups.
4. **IP range from the current address.** An IP range item checks the client's current address (bounds inclusive,
   cc732310), at every pass: a laptop moved to Branch matches at the next refresh *(check)*. Whether the Drive Maps
   extension runs at a background refresh at all is disputed by Microsoft's own sources: the ADMX setting "Configure
   Drive Maps preference extension policy processing" has a "Do not apply during periodic background processing"
   option (so by default it does apply; `win-gpo-slow-link` uses this), while an archived TechNet Wiki page
   (12221, Windows 7 era) says Drive Maps is "called … only during foreground processing, never during background
   processing". The model follows the policy text; an owner question.
5. **No match: not applied, not undone.** An item whose target does not match is not applied. A drive it mapped
   earlier stays (a tattoo, `win-gpo-tattooing`) unless *Remove this item when it is no longer applied* is set and
   this computer recorded the item as applied: then the drive is removed.
6. **Tie-break: one letter, two items.** Items are processed in order; when two matching items map the same letter,
   the later one is processed last and wins *(check)*. *(model test only: the scene's letters differ)*

## Steps

- With targeting on, the **logon is walked one item per step** (cursor 1–4, the `t = 0` logon): the token is taken
  at step 1 and each step evaluates one item's expression and maps, skips, keeps or removes its drive.
- Without targeting the logon is **one step** (nothing to evaluate: all four items apply).
- Every later event is one step, a whole pass over the four items:
  - `move`: the laptop moves to the other site (new IP), then the next refresh (`t = 100`).
  - `group`: the admin moves the user to the other group in the directory (`t = 30`), then the next refresh
    (`t = 100`, token unchanged); then a step "log off and on again" the next day (`t = 1440`; new token, a pass).

## Outcome codes per item

`map` (drive newly mapped, or mapped over another item's drive), `same` (already mapped by this item: kept with
Update, deleted and mapped again with Replace), `skip` (no match, nothing to undo), `stale` (no match, the drive it
mapped stays: tattoo), `remove` (no match, removed by the Remove option), `noGpo` (the GPO does not apply: not
evaluated). Per item also the terms that failed (`fails`: group, ip, os).

## Params

| param | values | default | note |
|---|---|---|---|
| `user` | `ana` (Projects, LT07) · `eyardley` (Cinematics, LT12) | `ana` | task |
| `location` | `hq` (10.10.20.57) · `branch` (10.20.0.57), where the laptop is at the logon | `hq` | task |
| `script` | `none` (logon only) · `move` (to the other site + refresh) · `group` (to the other group + refresh + logon) | `group` | added: the presets need different events |
| `targeting` | toggle | on | added: off = the estate's GPO as it is |
| `removeFlag` | toggle | off | task |

Steps: logon 4 (1 without targeting) + 0 / 1 / 2 for `none` / `move` / `group`. Defaults: 6 = `sim.json` `steps`.

## Expected numbers (checked by a hand model, `NOTES.md` § Checks, then by the tests)

Drives after each step; `*` = stale (tattoo).

| preset | params | steps | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|---|
| `quillmoor-as-is` | `targeting` off, `script: none` | 1 | P K H X all `map` | | | | | |
| `targeted` | `script: none` | 4 | P `map` | K `skip` (group) | H `map` | X `skip` (ip) | | |
| (eyardley) | `script: none`, `user: eyardley` | 4 | P `skip` | K `map` | H `map` | X `skip` | | |
| `branch-laptop` | `script: move` | 5 | P | P | P H | P H | IP 10.20.0.57: P `same`, K `skip`, H `same`, X `map` → P H X | |
| `group-change` | `script: group` | 6 | P | P | P H | P H | ana in Cinematics, token Projects: P `same`, K `skip` → P H | new token: P `stale`, K `map` → P* K H |
| `remove-flag` | `script: group`, `removeFlag` | 6 | as above, action Replace | | | | P `same` (Replace) → P H | P `remove`, K `map` → K H |
| (no preset) | `location: branch`, `script: move` | 5 | | | | X `map` → P H X | to HQ: X `stale` → P H X* | |

## Tests (`sim.test.js`)

Tie-break first (rule 6, two items for one letter: the later wins, both orders), then one test per rule (1–5), the
presets' numbers above, step counts, and the template's generic block (determinism, JSON-safe state, replay, strings
tables match).
