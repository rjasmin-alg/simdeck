<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-wsus-groups: notes

New stepper (task `docs/tasks/w3/win-wsus-groups.md`, catalogue `win-wsus-groups`, §4.5.6, overlap §5.22, wave 3). No
kit view: the task names none; the scene is two HTML tables (the console and the timeline). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **One step = one day, and every run is the 10 days of the timeline** (`sim.json` `steps` 10). Step 0 is "before day
  0": KB-B has arrived, nothing approved. The script is one story for every preset (day 0 Pilot, day 1 PC-P3 moved
  out of Unassigned, day 4 Production), so "approve for test, then production" plays out in every run; the presets
  differ only in params.
- **The approval grid is transposed and merged with the group tree:** one row per group (name, member count, member
  computers), one column per update (KB-A, KB-B). The task asks for rows = updates and columns = groups beside a
  separate tree; merged, a group's approval sits on the same line as its computers, and the five group names fit
  without wrapping. More updates (the `win-update-rings` host) add columns.
- **Two updates.** KB-A is last month's update, approved for Pilot, Production and Kiosks on day −7 and installed
  there at step 0: the grid shows a finished staged rollout, a decline of KB-B leaves KB-A alone, and PC-P3 in
  Unassigned has no KB-A either. The timeline and the captions follow KB-B only. The model treats both alike.
- **The fleet:** PC-P1, PC-P2 (Pilot), PC-P3 (new, registers on day 0), PC-K1 (a test kiosk in Pilot and Kiosks),
  PC-K2 (Kiosks), PC-01 … PC-06 (Production). PC-P2, PC-05 and PC-06 postpone 3 days; the others install when asked.
  PC-K1 is always in two groups, so `two-groups` only adds the Kiosks Remove approval (`kioskRemove`).
- **User timing:** detected and downloaded on day d, the user is asked on day d + 1; installs then, or postpones 3
  days and installs on d + 4. A deadline forces whatever is still waiting on the deadline day.
- **PC-P3 is new.** Server-side it registers into Unassigned Computers on day 0 and the admin moves it to Pilot on day 1
  (rule 1, tie-break 1). Client-side its Group Policy decides at its first contact: `Pilot` puts it in Pilot on day 0;
  `Pliot` leaves it in Unassigned, and the admin's move on day 1 is rejected (rule 2), shown as a red "move rejected"
  mark on its chip.
- **The Group Policy column** of the timeline is struck through, headed "GPO (ignored)", in server-side mode.
- **Param `firstApproval`** (Pilot / All Computers) is not in the task: the `approve-all` preset needs a param. With
  All Computers there is no separate Production approval on day 4, so `prodDeadline` is disabled (with the reason).
- **Decline button** (`D`): sets `declineAt` to the current step n, so KB-B is declined on day n, the next step (the
  `resetAt` / `brAt` pattern of the sibling sims). The decline runs before the day's plan; an approval of a declined
  update is skipped (the admin would have to approve it again). As in the siblings, `declineAt` survives in the URL only
  through the `decline` preset.
- **Remove** of an installed update uninstalls it at the scan. No preset reaches it (the Kiosks Remove only meets
  computers without KB-B, or PC-K1 where Install wins); a test covers it from a hand-made state.
- **Timeline marks** are drawn as shapes, not font glyphs (a font's ◐ and ● were too small): hollow circle, half-filled,
  filled, red triangle. Each has a title and an `aria-label`. Grayscale: the four differ by shape.
- **Names:** WSUS, Group Policy (GPO), All Computers and Unassigned Computers are named (the course teaches WSUS,
  COMMON.md §1); group names and computer names are data (`translate="no"`), as the console shows them.
- **Last step** ends with a count: "KB-B is installed on n of 11 computers".

## Deviations from the task

- **Step counts:** every preset runs 10 steps (task: pilot-first 4, production-deadline 8, typo-unassigned 4, two-groups
  3, approve-all 4, decline 4). The task's counts are stopping points within one 10-day story; the kit's step count is
  a function of the params, and the timeline is 10 days.
- **pilot-first:** Pilot has PC-P1, PC-P2, PC-K1 and (from day 1) PC-P3; PC-P2 postpones and installs on day 4, not
  "by day 3". PC-P1, PC-K1 install on day 1, PC-P3 on day 2.
- **Grid transposed** and merged with the tree (above). The task's state fields are all there; besides them the state
  has `hist` (KB-B per computer per day), `plan` (the day-stamped admin actions), `pc` (each computer's state per
  update: `st`, `det`, `due`, `forced`), `declineAt` and `ev`.
- **Extra param `firstApproval`** (above).
- **Croatian caption for typo-unassigned** says "dodjela grupe na klijentu" (the task's term list) instead of the
  caption's "odabir grupe na klijentu", so one term is used throughout.
- **Reuse of `win-wsus-flow`:** its model is not in `models/` and has no groups or approvals per group; nothing was
  copied. Only the ideas (a scan finds an approved update, then download and install) are shared.

## Sources

- Task file, model and presets.
- Microsoft (titles from the task, not opened from here, no network): "Manage WSUS computer groups" / "Create and manage
  computer groups" (server-side vs client-side targeting, Unassigned Computers); "Approve and deploy WSUS updates" /
  "Approving updates" (approval inheritance, conflicting approvals, deadlines, declining); Group Policy "Enable
  client-side targeting".

## Not checked *(check)*

- Every Microsoft title above.
- Client-side targeting puts a computer in a named group only if it exists on the server, else Unassigned Computers;
  it never creates the group.
- Several groups in the policy value separated by `;` (supported by newer clients and servers); names compared without
  regard to case.
- In server-side mode the policy's group name is ignored; in client-side mode the console cannot change membership.
- Inheritance: a child group without its own approval is "same as parent"; its own approval overrides.
- Conflicts across groups: Install beats Remove beats Not approved; the earliest deadline applies. The reviewer
  recalls that Microsoft's text also gives an approval with a deadline priority over one without (a Remove with a
  deadline beating an Install without); not modelled, no preset reaches it (Remove never has a deadline).
- A declined update is offered to nobody and uninstalls nothing.
- At the deadline the install is forced and the computer restarts (restart timing: `win-wsus-client-cycle`).
- Model choices, not from a source: one contact per computer per day, the user asked the day after detection, the
  3-day postponement, all days in the script.

## Checks

- Numbers: SPEC.md's preset table was written before the model; a small script printed every preset's timeline (and
  client + Pilot, server + Pliot, client + Pliot + All Computers, All Computers + kioskRemove), and they agree.
  `sim.test.js` pins every computer's KB-B timeline in five presets and the events of the key days.
- 34 tests: 6 tie-break tests first, then one or more per rule, the run's length, an invariant over every param
  combination (installed never goes back without a Remove), and the template's generic block.
- Mutations, one at a time (31): server registration into Pilot, client policy ignored, case-sensitive names, a typo
  matching anyway, only the first `;` group, client-side move allowed, no inheritance, parent overriding the group's own
  approval, Remove over Install, Not approved over Remove, latest deadline, decline not global, decline uninstalling,
  Remove not uninstalling, a withdrawn detection kept, install on the detection day, postponement ignored, deadline
  winning the tie with the user's day, deadline strict `>`, no forced flag, scans before admin actions, decline after
  the plan, approving a declined update, Production on day 5, the move on day 2, a Production approval in approve-all,
  kioskRemove ignored, KB-A not preinstalled, Unassigned Computers targetable by policy, no postponed event: every one
  fails a test (Unassigned targetable survived at first; a test was added).
- Fresh review (a separate agent read the code against SPEC.md and the task, made ~40 mutations in a copy and drove
  every preset and the button in both languages). The model matched SPEC.md. Fixed from it: the skipped-approval
  caption always named Production (now the skipped groups, once); "at today's contact it already sees Pilot's
  approval" after a decline or with an inherited approval (now only when Pilot's own Install stands; inherited gets
  its own sentence); approve-all with kioskRemove said every group inherits it; the decline button moved an earlier
  decline later, rewriting the past, and did nothing silently at the end (one decline per run, ignored at the last
  step); the explanation said a typo leaves a computer with no approvals at all (it keeps what Unassigned inherits);
  Croatian: neuter for "računalo", "uz *deadline* (rok)", "Production" not "Proizvodnja", "u grupi Kiosks", word
  order of the ignored-policy sentence, "prošao bez problema". 9 surviving mutations closed with 6 new tests (a
  Remove deadline counted, inherited deadline vs none, Not approved withdrawing, "postponed" every day, a decline
  skipping only Install approvals, the move after a decline, tie-break 3 for a user who installs when asked, counts and
  effective approvals at step 0 and mid-run). Not changed: `declineAt` is not kept in the URL (kit request below).
- Gate: see the report; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both languages reviewed, plus
  pilot-first at steps 1, 2, 4, 10, production-deadline at 8 (hr and en), typo-unassigned at 1, 2, 4, two-groups at 1,
  approve-all at 1, decline at 3 (dark).

## Term pairs

Not in `kit/glossary.js`; written out in the strings (*English* (Croatian) at the first mention):

- computer group — grupa računala
- approval — odobrenje
- deadline — rok
- decline — odbijanje (ažuriranja)
- server-side / client-side targeting — dodjela grupe na poslužitelju / na klijentu
- Group Policy — grupna pravila
- staged rollout — postupno uvođenje

## Shared requests

- **Kit: hidden params in the URL.** `declineAt` has no control, so a press of the decline button is lost on `L` or a
  reload (same as `brAt` in `win-wsus-flow` and `resetAt` in `win-wsus-cloned-id`).
- **Legend swatches** `wg-install`, `wg-remove`, `wg-not`, `wg-declined`, `wg-inh` (a box with an icon; dashed):
  defined in the page.
- **Promotion:** the approval resolution (`groupApproval`, `effectiveOf`, `targetGroups`) is pure and promotable for
  `win-update-rings`, which the task names as a preset on this host.

## Time

Start 19:24, done 19:47 (one session, 2026-11-04): about 23 min.
