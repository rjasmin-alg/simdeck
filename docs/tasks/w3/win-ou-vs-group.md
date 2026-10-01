# win-ou-vs-group: OU or group?

| | |
|---|---|
| Task | `win-ou-vs-group` (wave 3, Active Directory) |
| Catalogue entry | `win-ou-vs-group` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-ou-vs-group/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `active-directory` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ad-structure` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **OUs carry policy and delegation, groups carry permissions; one object, one OU, many groups**.

The student: sort tasks into "OU" or "group", see why.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-ad-structure/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.21
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/ou-tree.txt` and `gpos.txt` (preset `quillmoor`)
- Microsoft Learn: "Active Directory security groups"; "Security identifiers"; "Delegating administration by using OU objects"; "Group Policy overview"

## Overlaps (catalogue §5)

- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** left, the estate OU tree (reused from `win-ad-structure`'s data: `OU=Quillmoor` › `Staff` › `HQ`/`Brackenridge`, `Workstations`, `Servers`, `CN=Users`); right, a group list (`G-Accounting`, `G-Projects`, `Helpdesk`, `All Staff`); centre, a deck of task cards. Each step turns one card and drops it into the "OU" bin, the "group" bin, or "both" with the reason. User `ana` is drawn once in her one OU with lines to her several groups.
- **State:** `{ cards: [{ id, answer: 'ou'|'group'|'both', revealed: bool }], cursor, guess: { cardId: 'ou'|'group' } }`.
- **One step:** reveal the next card: (a) show the student's guess if one was clicked, (b) move the card to its bin, (c) light the mechanism on the stage (a GPO link on an OU, an ACE naming a group SID, a delegation ACE on an OU naming a group).
- **Rules:**
  1. A GPO can be linked only to a site, a domain or an OU; never to a group or a container like `CN=Users` (Microsoft: "Group Policy overview"; "Link a Group Policy Object").
  2. Permissions (ACEs on files, shares, AD objects) name security principals by SID: users, computers, groups. An OU has no SID, so it cannot be granted access (Microsoft: "Security identifiers"; "Active Directory security groups").
  3. Delegation of control is an ACE on the OU's own ACL; its trustee is (best practice) a group. So "who may do it" is a group, "on which objects" is an OU — the card answer is "both".
  4. An object is in exactly one OU or container; it can be a member of many groups (MS-ADTS: one parent per object; `member`/`memberOf` multivalued).
  5. Tie-break for "policy for a set of people spread over several OUs": the link still goes on an OU (or the domain); a group narrows it by security filtering or item-level targeting (`win-gpo-security-filtering`, `win-gpo-targeting`). Answer "both", with the OU first.
- **Params:** `mode` choice {show, quiz}, default show (quiz waits for the student's bin click before revealing).
- **Cards (default preset, 8):** screen-lock for all laptops → OU; Accounting reads `\\hq-fs01\finance` → group; helpdesk resets Branch passwords → both (rule 3); `ana` in Sales and in Project-X → group (rule 4); mail list for the board → group (distribution); kiosk PCs hide Control Panel → OU; drive P: for Projects members across HQ and Brackenridge → both (rule 5); policy for the 155 users in `CN=Users` → neither until moved to an OU (rule 1).
- **Presets (3):**
  - `basic` — the 8 cards above, show mode. Derived, unchecked.
  - `quiz` — same cards, quiz mode.
  - `quillmoor` — estate case: the `Chirp Autostart` GPO linked to `OU=Workstations` reaches only the 38 computers there (`gpos.txt`, the OU holds 35 per `ou-tree.txt` — the estate's own discrepancy, keep it as a talking point); 159 computers sit in `CN=Computers` and never get it. From the DR estate.
- **Steps:** 8 (basic, quiz), 4 (quillmoor).
- **Legend:** OU (folder tab), group (rounded pill), GPO link (chain icon), ACE (key icon); "changed" highlight marks the card just turned and the mechanism it lit.
- **Captions:** hr: "Dozvola za dijeljenu mapu ide *grupi* (grupa): ACL sadrži SID, a OU ga nema." en: "Share permissions go to a group: an ACL holds SIDs, and an OU has none."
  hr: "Pomoćnici smiju resetirati lozinke u `OU=Brackenridge`: delegiranje je na OU-u, a dobiva ga grupa `Helpdesk` — oboje." en: "Helpdesk may reset passwords in `OU=Brackenridge`: the delegation sits on the OU and is granted to the `Helpdesk` group — both."
- **Terms:** organizational unit — organizacijska jedinica (check); security group — sigurnosna grupa (check); distribution group — distribucijska grupa (check); permission — dozvola (UL ch07); delegation — delegiranje (check); member — član.
- **Misconceptions:** putting users in an OU grants them access to something; a GPO can be linked to a group; a user can be in two OUs.
- **Out of scope:** group scopes (`win-group-scopes`), the precedence of GPOs, the access token (`win-access-token`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ou-vs-group sims/win-ou-vs-group` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ou-vs-group/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
