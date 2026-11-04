<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ou-vs-group: specification

One concept: **OUs carry policy and delegation, groups carry permissions; one object, one OU, many groups**.
Task: `docs/tasks/w3/win-ou-vs-group.md`; catalogue §4.5.1. The student sorts task cards into "OU", "group",
"both" or "neither" and sees, on the directory, the mechanism that decides it.

## 1. Scene

Domain `quillmoor.example`. The OU tree is `win-ad-structure`'s (from the estate's `ou-tree.txt`), cut to what the
cards use, plus one invented OU:

| Box | Kind | Parent | Users | Computers | Source |
|---|---|---|---|---|---|
| `CN=Users` | container | domain | 155 | 0 | estate `ou-tree.txt` |
| `CN=Computers` | container | domain | 0 | 159 | estate `ou-tree.txt` |
| `OU=Quillmoor` | OU | domain | 0 | 0 | estate |
| `OU=Staff` | OU | `OU=Quillmoor` | 0 | 0 | estate |
| `OU=HQ` | OU | `OU=Staff` | 21 | 0 | estate |
| `OU=Brackenridge` | OU | `OU=Staff` | 44 | 0 | estate |
| `OU=Workstations` | OU | `OU=Quillmoor` | 0 | 35 | estate (`gpos.txt` says 38: kept as a talking point) |
| `OU=Kiosks` | OU | `OU=Workstations` | — | — | invented for card 6 (the estate has no kiosk OU); not drawn in the `quillmoor` deck |
| `OU=Servers` | OU | `OU=Quillmoor` | 0 | 5 | estate |

Groups (all in `CN=Users`, the default container for new groups; group scope is out of scope here). Every group has
a SID; a distribution group is not security-enabled, so it never stands in an ACE:

| Group | Type | RID (invented) | Members drawn |
|---|---|---|---|
| `G-Accounting` | security | 1104 | `ana` |
| `G-Projects` | security | 1105 | `ana` |
| `Helpdesk` | security | 1106 | — |
| `All Staff` | security | 1107 | `ana` |
| `Board` | distribution | 1108 | — |

User `ana` sits in `OU=HQ` (estate `users.csv` puts HQ staff in `OU=HQ,OU=Staff,OU=Quillmoor`). She is drawn once,
in her one OU, with a line to each of her three groups.

## 2. Rules

1. **Where a GPO can be linked.** A GPO links only to a site, a domain or an OU; never to a group, a user, a computer or
   a `CN=` container such as `CN=Users` (Microsoft Learn, "Group Policy overview"; "Redirect users and computers
   containers": "Group policies can be applied on OU containers but not on CN class containers"). A GPO linked to an
   OU reaches the users and computers in that OU and every OU below it. A domain link reaches everything in the
   domain, the `CN=` containers too.
2. **Permissions name SIDs.** An ACE on a file, a share or an AD object names a security principal by its SID: a
   user, a computer or a *security* group. An OU has no SID, so it can never be granted access. A distribution group
   has a SID but is not security-enabled, so it cannot be the trustee of an ACE (Microsoft Learn, "Security identifiers"; "Active Directory
   security groups").
3. **Delegation is both.** Delegating control is an ACE on the OU's own ACL (a domain or a `CN=` container can be
   delegated the same way) whose trustee is (best practice) a group:
   "on which objects" is the OU, "who may" is the group (Microsoft Learn, "Delegating administration by using OU
   objects"). Card answer: `both`.
4. **One OU, many groups.** An object has exactly one parent (one OU or container); `member`/`memberOf` are
   multi-valued, so it can be in many groups (MS-ADTS: one parent per object). Moving an object replaces its parent;
   joining a group adds to its groups.
5. **Tie-break: a policy for people spread over several OUs.** The link still goes on an OU: the lowest OU that holds
   all of them (their lowest common ancestor in the tree), or the domain when that is not an OU. When only some of the
   people there should get it, a group narrows it (security filtering, item-level targeting: `win-gpo-security-filtering`,
   `win-gpo-targeting`). Answer `both`, the OU first. A policy for *exactly* some boxes must be linked on one of
   them: when the link box is above them (their common OU, or the domain above a `CN=` container, which takes no
   link, rule 1), it reaches others too, and the answer is `neither` until the objects are moved into one OU.

### How a card's answer follows from the rules (`classify`)

| Need | Answer |
|---|---|
| policy for whole boxes; link box = the first box from their LCA upwards that takes a link | `ou`; but `neither` if `exact` and the link box is not one of the boxes asked for |
| policy for whole boxes plus a group filter | `both` (link on the LCA, filter by the group) |
| permission for a trustee | `group` if the trustee is a security group; refused (`ou-no-sid`) for an OU |
| delegation on an OU, the domain or a container, to a trustee with a SID | `both` |
| membership of one object in several groups | `group` |
| a mailing list | `group` (a distribution group) |

## 3. Cards

### `basic` (8 cards, the task's; derived, unchecked as a real estate case)

| # | Card | Need | Answer | Mechanism lit |
|---|---|---|---|---|
| 1 | screen lock after 10 idle minutes on every workstation (a computer setting) | policy, boxes `OU=Workstations` | `ou` | GPO `Screen Lock` linked to `OU=Workstations` |
| 2 | Accounting reads `\\hq-fs01\finance` | permission, trustee `G-Accounting` | `group` | ACE on `\\hq-fs01\finance`: `G-Accounting` (SID …-1104) read |
| 3 | Helpdesk resets passwords in `OU=Brackenridge` | delegation on `OU=Brackenridge` to `Helpdesk` | `both` | delegation ACE on `OU=Brackenridge` naming `Helpdesk` |
| 4 | `ana` works in Accounting and on Projects | membership of `ana` | `group` | `ana` in `OU=HQ` only, lines to `G-Accounting`, `G-Projects`, `All Staff` |
| 5 | a mailing list for the board | mail list | `group` | distribution group `Board` |
| 6 | kiosk PCs may not read USB drives (a computer setting; the task's "hide Control Panel" is a user setting, which an OU of computers would not reach without loopback) | policy, boxes `OU=Kiosks` | `ou` | GPO `Kiosk Lockdown` linked to `OU=Kiosks` |
| 7 | drive P: for Projects members in HQ and Brackenridge | policy, boxes `OU=HQ` + `OU=Brackenridge`, filter `G-Projects` | `both` | GPO `Drive P` linked to `OU=Staff` (the LCA), filtered by `G-Projects` |
| 8 | a policy for the 155 users in `CN=Users` | policy, box `CN=Users`, exact | `neither` | link refused on `CN=Users` |

Expected: bins `ou` {1, 6}, `group` {2, 4, 5}, `both` {3, 7}, `neither` {8}.

The task's card 4 names groups "Sales" and "Project-X"; the scene's own groups are used instead. Card 1 says
"workstations" for the task's "laptops" (the tree has `OU=Workstations`).

### `quillmoor` (4 cards, the estate's `gpos.txt` and `ou-tree.txt`)

| # | Card | Need | Answer | Numbers |
|---|---|---|---|---|
| 1 | `Chirp Autostart` on the workstations | policy, `OU=Workstations` | `ou` | its scope is the 35 computers in the OU (`ou-tree.txt`); `gpos.txt` comment says 38. Its setting is `HKCU Run`, a user setting, so it works there only with loopback processing (said in the caption, not modelled) |
| 2 | ... and on the 159 computers in `CN=Computers` | policy, `CN=Computers`, exact | `neither` | 159 never get it until moved into `OU=Workstations` |
| 3 | drive maps (`Drive Maps`) for everyone, `CN=Users` too | policy, all boxes | `ou` (the LCA is the domain: a domain link) | reaches the 155 in `CN=Users` because it is linked at the domain root |
| 4 | who may open `\\hq-fs01\projects` | permission, `G-Projects` | `group` | a drive map is policy; access is an ACE naming a group SID |

Expected: bins `ou` {1, 3}, `neither` {2}, `group` {4}.

## 4. State, steps and params

- **Params:** `deck` {basic, quillmoor}, `mode` {show, quiz} (both reset to step 0), and hidden `g1` … `g8`
  {'' , ou, group, both, neither}: the student's guess for card k.
- **Steps:** one per card: 8 (basic), 4 (quillmoor). `sim.json` `steps` is the default deck's, 8.
- **State:** `{ deck, mode, cards: [{ id, answer, revealed, guess, verdict }], cursor, last, score: { right, half,
  wrong, skipped }, lit: [...] }`. `cursor` = the index of the next card (`n`), `last` = the index just turned (or
  −1), `lit` = every mechanism of the turned cards (the current one flagged `now`).
- **One step:** card `n` (1-based) turns: (a) its guess is read (quiz mode only; show mode ignores guesses), (b) it
  goes to its bin, (c) its mechanism is added to `lit`.
- **Verdict** (quiz): `right` when the guess equals the answer; `half` when the answer is `both` and the guess is `ou`
  or `group`; `skipped` with no guess; else `wrong`.
- **Presets:** `basic` {deck basic, mode show}, `quiz` {deck basic, mode quiz}, `quillmoor` {deck quillmoor, mode show}.
