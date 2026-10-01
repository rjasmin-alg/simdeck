# win-update-rings: Update rings

| | |
|---|---|
| Task | `win-update-rings` (wave 3, WSUS and updates) |
| Catalogue entry | `win-update-rings` in `docs/catalogue.md` §4.5.6 |
| Kind | **add a preset to `sims/win-wsus-groups/`** (no page of its own) |
| Folder | `sims/win-wsus-groups/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `updates` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `win-wsus-groups` merged; only one preset task per host folder at a time |

## Goal

One concept: **approval rings and deferrals; a bad patch stopped at ring 1**.

The student: release patches through rings.

This is a **preset on `win-wsus-groups`** (Computer groups and approvals), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.6.
5. `sims/win-wsus-groups/` (the host page) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Build deployment rings for Windows client updates"; "Configure Windows Update for Business" (quality update deferral 0–30 days, pause up to 35 days); "Approve and deploy WSUS updates" (declining, scheduled approvals per group)
- Catalogue seed: → §5.22

## Overlaps (catalogue §5)

- **§5.22 Update approval:** Groups with approvals and rings with deferrals are the same staged-rollout idea; one page with two presets. The canary deploy in Linux links to it.

## Model and presets

- **This is a preset task on `sims/win-wsus-groups/`.** It adds presets, their strings in both languages and their tests; the scene, legend and model are the host's.
- **What the presets show:** the same staged-rollout idea as the host's approvals, arranged as rings with delays: Ring 0 (IT, 3 PCs), Ring 1 (pilot users, 10 PCs, 4 of them run the line-of-business app LOB), Ring 2 (broad, 80 PCs, 30 run LOB). Update KB-X is bad: it breaks LOB on any machine that has it.
- **Rules the presets rely on (host rules plus):**
  1. A ring is a computer group whose approval is given a fixed number of days after release (WSUS: scheduled approvals per group; Windows Update for Business: a quality-update deferral per ring, 0–30 days (check)) (Microsoft, "Build deployment rings for Windows client updates" (check)).
  2. A broken install is reported the day after it happens (toy delay, derived).
  3. On the day a problem is reported, the admin stops the rollout: declines KB-X (WSUS) or pauses quality updates for the later rings (WUfB, up to 35 days (check)). Admin actions run before that day's scans (host rule 7).
  4. Machines that already installed KB-X stay broken until it is removed; stopping protects only rings not yet approved.
- **Presets:**
  1. `rings-stop-at-1` — derived, unchecked: Ring 0 day 0, Ring 1 day 2, Ring 2 day 7. Ring 0 installs day 0–1, no LOB there, no report. Ring 1 installs day 2 → 4 LOB machines broken, reported day 3 → admin declines KB-X on day 3 → Ring 2 never gets it. Outcome: 4 broken, 30 protected.
  2. `no-rings` — derived, unchecked: approve All Computers on day 0 → all 93 install by day 1 → 34 LOB machines broken, reported day 2: too late to stop anything.
  3. `deferral-too-short` — derived, unchecked: Ring 2 at day 3 instead of 7 → Ring 2 scans on day 3 after the decline (admin first): protected; with Ring 2 at day 2 (same day as Ring 1) → 30 more broken. Shows that the gap must exceed "install + report".
  4. `good-patch` — derived, unchecked: KB-Y is fine → rings only add delay: Ring 2 patched on day 7–8 instead of day 0–1. Shows the cost of rings.
- **Steps:** 10 per preset (one per day, days 0–9), within the host's ~20 limit.
- **Captions:**
  - hr: "Dan 3: prsten 1 javlja da KB-X ruši aplikaciju. Administrator ga odbija — prsten 2, 80 računala, zakrpu nikad ne dobiva."
  - en: "Day 3: ring 1 reports that KB-X breaks the app. The admin declines it, and ring 2, 80 computers, never gets the patch."
  - hr: "Bez prstenova zakrpu su svi instalirali do dana 1. Kad je problem prijavljen, nije bilo što zaustaviti."
  - en: "Without rings everyone installed the patch by day 1. When the problem was reported, there was nothing left to stop."
- **Terms:** deployment ring — prsten (krug) uvođenja; deferral — odgoda; pause — pauziranje; staged rollout — postupno uvođenje; pilot group — pilotna grupa; line-of-business application — poslovna aplikacija.
- **Misconceptions:** "the IT ring catches every problem" (IT machines may not run the app that breaks); "rings are free" (they delay good patches too).
- **What the host model must support:** approvals scheduled per group by day (`approvals[].day`), an update `health` flag with the tag it affects (`bad: true, affects: "LOB"`), computer tags (`tags: ["LOB"]`), a per-computer `broken` state with a report delay, and a scripted admin action "decline" on a given day. The host task already notes this ("Host for `win-update-rings`"). If the merged host lacks any of these, write the change under "Shared requests" in `sims/win-wsus-groups/NOTES.md` and stop, as the task says.
- **Out of scope:** feature-update rings, automatic rollback, cloud update policies beyond the deferral number.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-wsus-groups/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
