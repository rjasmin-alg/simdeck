# win-wsus-groups: Computer groups and approvals

| | |
|---|---|
| Task | `win-wsus-groups` (wave 3, WSUS and updates) |
| Catalogue entry | `win-wsus-groups` in `docs/catalogue.md` §4.5.6 |
| Kind | build a new simulator |
| Folder | `sims/win-wsus-groups/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `updates` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-wsus-flow` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **approve per group, deadlines; server-side vs client-side targeting by GPO**.

The student: approve for test, then production.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.6.
5. `sims/win-wsus-flow/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Manage WSUS computer groups" / "Create and manage computer groups" (server-side vs client-side targeting, Unassigned Computers); "Approve and deploy WSUS updates" / "Approving updates" (approval inheritance, conflicting approvals, deadlines, declining); Group Policy "Enable client-side targeting"
- Catalogue seed: → §5.22

## Overlaps (catalogue §5)

- **§5.22 Update approval:** Groups with approvals and rings with deferrals are the same staged-rollout idea; one page with two presets. The canary deploy in Linux links to it.

## Model and presets

- **Scene:** the WSUS-HQ console as a tree of computer groups (All Computers → Unassigned Computers, Pilot, Production, Kiosks) with member computers, next to an approval grid: rows = updates, columns = groups, cells = approval (Install / Remove / Not approved / Declined) with an optional deadline. Right: a 10-day timeline of each computer's state for the selected update (detected, installed, by deadline). A badge shows the server's targeting mode.
- **State:** `targeting: server|client`, `groups: [{ name, parent, members: [pc] }]`, `computers: [{ name, gpoGroup (client-side name) | null }]`, `approvals: [{ update, group, action: install|remove|notApproved, deadline | null }]`, `declined: [update]`, `day`, derived `effective[pc][update]`, `state[pc][update]`.
- **One step:** one day: (1) admin actions scripted for that day; (2) effective approval per computer; (3) each computer scans, installs if approved (users postpone non-deadline installs per preset), installs forcibly at a deadline that has passed.
- **Rules:**
  1. Server-side targeting: new computers land in Unassigned Computers; the admin moves them. Client-side targeting: the computer's Group Policy names its group; the server puts it there if the group exists, otherwise in Unassigned Computers (Microsoft, "Manage WSUS computer groups" (check)).
  2. In server-side mode the client's group setting is ignored, and vice versa the console can't move computers in client-side mode (check).
  3. An approval on a group applies to its child groups; All Computers covers everyone.
  4. A computer in several groups with different approvals: Install beats Remove, Remove beats Not approved; with several deadlines the earliest applies (Microsoft, "Approving updates" (check)).
  5. Declined is global: it removes the update from every group and from client scans.
  6. Without a deadline, installation follows the client's own update settings (here: users postpone 3 days); at a deadline the update installs and the machine restarts (link to `win-wsus-client-cycle`).
  7. Tie-break: a computer added to a group on day d sees that group's approvals at its scan on day d (admin actions run before scans).
- **Params:** `targeting` choice server-side / client-side (default server-side); `gpoName` choice `Pilot` / `Pliot` (typo) (default Pilot); `prodDeadline` choice none / day 7 (default none); `kioskRemove` toggle (Kiosks approved for Remove, default off); button `decline`.
- **Presets:**
  1. `pilot-first` — derived, unchecked: KB-B approved for Pilot (PC-P1, PC-P2) on day 0 → both install by day 3; Production (6 PCs) shows "not approved".
  2. `production-deadline` — derived, unchecked: day 4 approve for Production with deadline day 7 → 4 users install when asked, 2 postpone → all 6 installed on day 7.
  3. `typo-unassigned` — derived, unchecked: client-side targeting, PC-P3's policy says `Pliot` → no such group → Unassigned → never gets the pilot approval.
  4. `two-groups` — derived, unchecked: PC-K1 in Pilot (Install) and Kiosks (Remove) → Install wins (check).
  5. `approve-all` — derived, unchecked: approval on All Computers → every group, Unassigned included, gets it.
  6. `decline` — derived, unchecked: day 2 decline KB-B → nobody else installs it; PC-P1 that installed it keeps it.
- **Steps:** pilot-first 4; production-deadline 8; typo-unassigned 4; two-groups 3; approve-all 4; decline 4.
- **Legend:** approval cells with icons ✓ Install, ↺ Remove, — Not approved, ⊘ Declined, ⏰ deadline; group tree with member counts; computer timeline glyphs ○ not approved, ◐ detected, ● installed, ⚠ forced at deadline. "Changed" marks approval cells and computer states changed this day.
- **Captions:**
  - hr: "Ažuriranje je odobreno samo grupi Pilot. Proizvodnja ga ne vidi — za nju je „nije odobreno”."
  - en: "The update is approved for the Pilot group only. Production doesn't see it: for them it is \"not approved\"."
  - hr: "*Client-side targeting* (odabir grupe na klijentu): pravilo kaže „Pliot”, takve grupe nema, pa PC-P3 ostaje u Unassigned Computers."
  - en: "Client-side targeting: the policy says \"Pliot\", there is no such group, so PC-P3 stays in Unassigned Computers."
- **Terms:** computer group — grupa računala; approval — odobrenje; deadline — rok; decline — odbijanje (ažuriranja); server-side / client-side targeting — dodjela grupe na poslužitelju / na klijentu; Group Policy — grupna pravila; staged rollout — postupno uvođenje.
- **Misconceptions:** "approving for All Computers is the normal way"; "client-side targeting creates the group"; "declining uninstalls the update".
- **Out of scope:** automatic approval rules, update rings with deferrals (preset task `win-update-rings`), WSUS reporting, cleanup.
- **Reuse from `win-wsus-flow` (soft dependency):** server, client, update and scan objects; new: groups, targeting, approval resolution and deadlines.
- **Host for `win-update-rings`:** keep approvals schedulable per day and group (`approvals` with a `day` field) and an update `health` flag, so the rings preset can be added without model changes.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-wsus-groups sims/win-wsus-groups` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-wsus-groups/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
