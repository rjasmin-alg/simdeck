# win-gpo-security-filtering: Security and WMI filtering

| | |
|---|---|
| Task | `win-gpo-security-filtering` (wave 3, Group Policy) |
| Catalogue entry | `win-gpo-security-filtering` in `docs/catalogue.md` §4.5.2 |
| Kind | build a new simulator |
| Folder | `sims/win-gpo-security-filtering/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `group-policy` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-gpo-precedence` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **who a GPO applies to; the computer account needs Read too**.

The student: filter a GPO to a group, add a WMI filter.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.2.
5. `sims/win-gpo-precedence/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft: MS16-072 "Security update for Group Policy" (KB3163622, June 2016: user GPOs retrieved in the computer's context)
- Microsoft Learn: "Security filtering using GPMC"; "WMI filtering using GPMC" (check titles)

## Model and presets

- **Scene:** one GPO "Sales Drive Maps" (user settings) linked to `OU=Staff`, its delegation/ACL table (K4): principal, Read, Apply Group Policy, allow/deny. Below, computer `PC07` and users `ana` (Sales), `eyardley` (not Sales), `boss` (Sales + Managers). An optional WMI filter card. Per target, a decision path lights: in scope by link? → computer can read? → principal has Read + Apply? → deny? → WMI true? → applied / filtered (with the reason the client's policy report gives).
- **State:** `{ acl: [{ principal, read, apply, deny }], wmi: null|{ query, trueOn: [computers] }, targets: [], cursor, results: { target: { applied, reason } } }`.
- **One step:** evaluate one target through the decision path (one target per step); a step may also be an admin change.
- **Rules (Microsoft: "Security filtering using GPMC"; MS16-072 "Security update for Group Policy" (KB3163622); "WMI filtering using GPMC" (check titles)):**
  1. A GPO in the link scope applies to a principal that has both Read and Apply Group Policy (allow); the default is Authenticated Users with both.
  2. Deny (on either right) wins over allow.
  3. Since MS16-072 (June 2016) the client reads the GPO list for user policy in the computer's security context: the computer account must have Read on the GPO, or the GPO is "inaccessible" for users too.
  4. So "remove Authenticated Users, add Sales" breaks the GPO for everyone; the fix is Read (not Apply) for Authenticated Users or Domain Computers.
  5. A WMI filter (one per GPO) is evaluated on the computer; false → the whole GPO is skipped for that computer and its users ("Denied (WMI filter)").
  6. Filtering never changes precedence among the GPOs that remain.
  7. A computer added to a filtering group gets it only after a reboot (its token is built at startup) (`win-access-token`).
  8. Tie-break: if both security filtering and WMI exclude, the reason shown is the security one (it is checked first) (check order).
- **Params:** `aclMode` choice {default, Sales only, Sales + Domain Computers Read} default default; `denyManagers` toggle default off; `wmi` choice {none, laptops only} default none; `pc07Laptop` toggle default off.
- **Presets (5):**
  - `default` — Authenticated Users: ana ✓, eyardley ✓, boss ✓. 3 steps. Derived, unchecked.
  - `sales-only-broken` — AU removed, Sales Read+Apply: all three ✕ "inaccessible" (rule 3). 4 steps.
  - `sales-fixed` — plus Domain Computers Read: ana ✓, eyardley ✕ (not Sales), boss ✓. 4 steps.
  - `deny-managers` — plus Deny Apply for Managers: boss ✕ (rule 2). 4 steps.
  - `wmi-laptops` — WMI filter `SELECT * FROM Win32_SystemEnclosure WHERE ChassisTypes = 9 OR ChassisTypes = 10` (check values), PC07 a desktop → ✕ for all users on PC07. 4 steps.
- **Steps:** max 4.
- **Legend:** decision diamond, pass (✓ arrow), stop (✕ with the reason), ACL row, deny row (⛔); "changed" highlight marks the ACL row or result changed by the step.
- **Captions:** hr: "Uklonjeni su *Authenticated Users* (prijavljeni korisnici): računalo više ne može pročitati GPO, pa ga ne dobiva ni `ana` iz grupe Sales." en: "Authenticated Users was removed: the computer can no longer read the GPO, so even `ana` from Sales doesn't get it."
  hr: "WMI filtar vraća laž na PC07 (stolno računalo): GPO se preskače za sve korisnike na njemu." en: "The WMI filter is false on PC07 (a desktop): the GPO is skipped for every user on it."
- **Terms (check):** security filtering — sigurnosno filtriranje; WMI filter — WMI filtar; Apply Group Policy — primjena pravila grupe; deny — zabrana; computer account — račun računala; permission — dozvola (UL ch07).
- **Misconceptions:** filtering to a user group needs only that group; Deny is the normal way to filter; a WMI filter applies to users.
- **Out of scope:** item-level targeting (`win-gpo-targeting`), loopback, precedence, writing WMI queries.
- **Builds on `win-gpo-precedence`:** reuses its target list and rule table; new is the per-target decision path.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-gpo-security-filtering` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-gpo-security-filtering sims/win-gpo-security-filtering` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-gpo-security-filtering/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
