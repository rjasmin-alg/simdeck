# win-wsus-supersedence: Superseded updates and cleanup

| | |
|---|---|
| Task | `win-wsus-supersedence` (wave 3, WSUS and updates) |
| Catalogue entry | `win-wsus-supersedence` in `docs/catalogue.md` §4.5.6 |
| Kind | build a new simulator |
| Folder | `sims/win-wsus-supersedence/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `updates` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-wsus-flow` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **superseded updates pile up; declining and cleanup keep WSUS alive**.

The student: run a year of releases with and without cleanup.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.6.
5. `sims/win-wsus-flow/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "The complete guide to Microsoft WSUS and Configuration Manager SUP maintenance" (supersedence, declining superseded updates, scan performance); "Use the Server Cleanup Wizard" (options: unused updates and revisions, computers not contacting the server, unneeded update files, expired updates, superseded updates)

## Model and presets

- **Scene:** a 12-month strip; for each month the updates released (2 cumulative updates — client OS and server OS —, 1 framework update, about 90 definition updates). Below: the server's catalogue as stacked bars per month: active (not superseded), superseded but not declined, declined; a second chart: content on disk (GB); a third gauge: client scan cost (relative). A switch: cleanup run monthly or never.
- **State:** `month`, `updates: [{ id, family, released, supersededBy | null, approved, declined, neededBy: number, contentGB }]`, `cleanup: { monthly: bool, declineSuperseded: bool, deleteFiles: bool }`, derived `catalogue: { active, supersededOpen, declined }`, `contentGB`, `scanCost`.
- **One step:** one month: (1) releases; (2) new cumulative updates supersede the previous one of their family; (3) automatic approvals (definitions); (4) clients install, `neededBy` falls; (5) cleanup if enabled.
- **Rules:**
  1. A cumulative update supersedes the previous cumulative update of the same family; the old one is still in the catalogue until declined (Microsoft, "Update supersedence in WSUS" (check)).
  2. Clients that installed the newer update no longer need the superseded one; because it is cumulative, declining the old one leaves no client unpatched (check for non-cumulative updates).
  3. Cleanup "decline superseded updates" declines an update that is superseded by an approved update, has been superseded for at least 30 days, and is not reported as needed by any client (Microsoft, "WSUS Server Cleanup Wizard" (check exact conditions)).
  4. Cleanup "unneeded update files" deletes content of declined (and expired) updates; declining alone frees no disk space.
  5. Client scan cost grows with the number of non-declined updates the client must evaluate (toy: proportional; real scans also slow the server's web service and database (check)).
  6. Content per month (toy, derived): client cumulative 0.7 GB, server cumulative 0.7 GB, framework 0.1 GB; definitions are counted but their content expires and is not stored.
  7. Tie-break: an update superseded in the same month it is released is kept until the next run (the 30-day rule).
- **Params:** `monthlyCleanup` toggle (default off); `declineSuperseded` toggle (default on, applies only when cleanup runs); `deleteFiles` toggle (default on); `offlinePcs` range 0–5 (machines that come back after 3 months; default 0).
- **Presets:**
  1. `no-cleanup` — derived, unchecked: 12 months → 24 cumulative updates (22 superseded), 12 framework (11 superseded), about 1080 definitions (1079 superseded) all not declined; content 24 × 0.7 + 12 × 0.1 = 18 GB; scan cost × 12 vs month 1 (1116 vs 93 updates to evaluate, toy).
  2. `monthly-cleanup` — derived, unchecked: cleanup every month → superseded open ≤ 2 months' worth; content stays near 3 GB; scan cost flat.
  3. `decline-no-delete` — derived, unchecked: decline on, delete files off → catalogue small, disk still 18 GB.
  4. `offline-machine` — derived, unchecked: 2 machines away for 3 months: superseded updates they still "need" aren't declined until they report the newer cumulative update; then declined at the next run.
- **Steps:** 12 per preset (one per month).
- **Legend:** stacked bars with patterns: active (solid), superseded open (diagonal), declined (dotted); content line with GB labels; scan-cost gauge with a number. "Changed" marks the month just added and the updates declined in it.
- **Captions:**
  - hr: "Novo kumulativno ažuriranje zamjenjuje (*supersedes*) prošlomjesečno. Staro ostaje u katalogu sve dok ga netko ne odbije."
  - en: "The new cumulative update supersedes last month's. The old one stays in the catalogue until someone declines it."
  - hr: "Odbijanje je smanjilo katalog, ali disk je i dalje 18 GB: datoteke briše tek „uklanjanje nepotrebnih datoteka”."
  - en: "Declining shrank the catalogue, but the disk is still at 18 GB: only \"delete unneeded update files\" removes files."
- **Terms:** supersedence — zamjena (nadomještanje) ažuriranja; superseded update — zamijenjeno ažuriranje; cumulative update — kumulativno ažuriranje; decline — odbijanje; cleanup — čišćenje; catalogue — katalog; scan — provjera.
- **Misconceptions:** "declining superseded updates leaves machines unpatched" (not for cumulative ones); "WSUS cleans itself"; "declining frees disk space".
- **Out of scope:** database maintenance (index rebuilds), expired updates in depth, express files (`win-wsus-delivery`), approval rules.
- **Reuse from `win-wsus-flow` (soft dependency):** update, approval and client objects; new: supersedence links, cleanup rules and the month timeline.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-wsus-supersedence sims/win-wsus-supersedence` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-wsus-supersedence/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
