# win-gpo-targeting: Item-level targeting

| | |
|---|---|
| Task | `win-gpo-targeting` (wave 3, Group Policy) |
| Catalogue entry | `win-gpo-targeting` in `docs/catalogue.md` §4.5.2 |
| Kind | build a new simulator |
| Folder | `sims/win-gpo-targeting/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `group-policy` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-gpo-tattooing` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **one GPO, preferences that apply per group, OS, IP range**.

The student: target drive maps, move a user.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.2.
5. `sims/win-gpo-tattooing/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: extends win-gpo-tattooing
- Microsoft Learn: "Item-level targeting" (Group Policy preferences) (check title)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/gpos.txt` (GPO "Drive Maps": P:, K:, H:, X: for everyone)

## Model and presets

- **Scene:** one GPO "Drive Maps" (the estate's real one maps P:, K:, H:, X: for everyone, `gpos.txt`) with four drive-map preference items, each with its targeting rule shown as a small expression: P: `\\hq-fs01\projects` if group `Projects`; K: `\\hq-fs01\cinematics` if group `Cinematics`; H: home for all; X: `\\nas01\builds` if IP in 10.20.0.0/16 (Branch) AND NOT OS = server. Two users and two PCs; the result per user/PC as drive letters in an Explorer-like column.
- **State:** `{ items: [{ letter, path, target: expr, action: 'update'|'replace', removeWhenNotApplied }], user: { groups, logonGroups }, pc: { ip, os, ou }, mapped: {}, cursor }`.
- **One step:** at a refresh/logon, evaluate one item's targeting expression and map, skip or remove the drive; or one change (move user to another group, move laptop to Branch).
- **Rules (Microsoft: "Item-level targeting" (Group Policy preferences) (check title)):**
  1. The GPO must first apply (link scope, security and WMI filtering — `win-gpo-security-filtering`); item-level targeting then decides per item, on the client, at each refresh.
  2. A targeting expression combines items with AND/OR and "is not"; evaluated left to right, AND binding as written (check: grouping via collections).
  3. Security-group targeting uses the user's (or computer's) group membership as of the token, so a group change counts after the next logon (`win-access-token`) (check).
  4. IP range targeting uses the client's current address: a laptop moved to Branch matches at the next refresh.
  5. An item whose target no longer matches is simply not applied; a drive it mapped earlier stays (tattooing, `win-gpo-tattooing`) unless "Remove this item when it is no longer applied" is set.
  6. Tie-break: two items for the same letter → the one later in the item order wins (processed last) (check).
- **Params:** `user` choice {ana: Projects, eyardley: Cinematics} default ana; `location` choice {HQ 10.10.20.57, Branch 10.20.0.57} default HQ; `removeFlag` toggle default off.
- **Presets (5):**
  - `quillmoor-as-is` — estate GPO without targeting: everyone gets P:, K:, H:, X:. 1 step. From the DR estate `gpos.txt`.
  - `targeted` — ana at HQ → P:, H:; eyardley at HQ → K:, H:. 4 steps. Derived, unchecked.
  - `branch-laptop` — ana's laptop moves to Branch → X: appears at the next refresh. 5 steps.
  - `group-change` — ana moved from Projects to Cinematics: before logoff still P:, after logon K: added and P: still there (no remove flag). 6 steps.
  - `remove-flag` — same with "Remove when no longer applied" → P: removed after the logon. 6 steps.
- **Steps:** max 6.
- **Legend:** preference item (pencil), targeting expression (filter funnel), match ✓ / no match ✕, mapped drive (letter tile), stale drive (tile with tattoo mark); "changed" highlight marks drive tiles added or removed.
- **Captions:** hr: "*Item-level targeting* (ciljanje na razini stavke): P: se mapira samo članovima grupe Projects." en: "Item-level targeting: P: is mapped only for members of Projects."
  hr: "`ana` više nije u grupi Projects, ali P: ostaje jer stavka nema „Ukloni kad se više ne primjenjuje”." en: "`ana` is no longer in Projects, but P: stays because the item lacks \"Remove when no longer applied\"."
- **Terms (check):** item-level targeting — ciljanje na razini stavke; preference — preferenca; drive map — mapiranje pogona; IP address range — raspon IP adresa (URM ch09); security group — sigurnosna grupa; targeting item — uvjet ciljanja.
- **Misconceptions:** targeting replaces security filtering; a group change applies at the next refresh; an unmatched item removes what it did.
- **Out of scope:** every targeting type (only group, IP range, OS), performance of WMI/LDAP targeting.
- **Builds on `win-gpo-tattooing`:** reuses its preference items and the remove-flag behaviour; new are the targeting expressions.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-gpo-targeting sims/win-gpo-targeting` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-gpo-targeting/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
