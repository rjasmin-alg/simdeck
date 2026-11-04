<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-wsus-groups: spec

One concept: **approve per computer group, with deadlines; server-side vs client-side targeting decides which group a
computer is in.** The student approves an update for the test group (Pilot) first, then for Production.
Task: `docs/tasks/w3/win-wsus-groups.md`; catalogue §4.5.6, overlap §5.22. Model: `sim.js`; tests: `sim.test.js`.

## Scene

- Top: the day (0–9) and a badge with WSUS-HQ's targeting mode (server-side / client-side).
- The console: the group tree, All Computers → Unassigned Computers, Pilot, Production, Kiosks, one row per group with
  its member count and its computers, and one approval cell per update (KB-A, last month's, already rolled out; KB-B,
  the new one). A cell is ✓ Install, ↺ Remove, — Not approved or ⊘ Declined, with ⏰ and the deadline day; a cell with
  no approval of its own shows its parent's, marked "inherited" (dashed). (The task's grid, transposed: NOTES.md.)
- Below: a 10-day timeline for KB-B, one row per computer: name, the group its Group Policy names (struck
  through in server-side mode, where it is ignored), then one cell per day: ○ not offered, ◐ detected (waiting for
  the user), ● installed, ⚠ installed by force at the deadline. Today's column is outlined; cells changed today are
  marked "changed".

## State

`targeting`, `day` (−1 before the first step), `groups: [{ name, parent, members }]`, `computers: [{ name, gpoGroup,
postpone, registered }]`, `updates: [{ id, health }]`, `approvals: [{ update, group, action, deadline, day }]` (`day`
= the day the admin makes it; KB-A's are day −7), `declined: [update]`, `pc: { [pc]: { [update]: { st, due, forced }
} }` (`st`: `none` | `detected` | `installed`), derived `effective: { [pc]: { [update]: { action, deadline } } }`,
`hist: { [pc]: [code per day] }` for KB-B, `ev` (this day's events). `health` is always `good`: kept for the
`win-update-rings` preset (task, "Host").

## Computers

| Computer | Group (server-side) | Group Policy names | User |
|---|---|---|---|
| PC-P1 | Pilot | `Pilot` | installs when asked |
| PC-P2 | Pilot | `Pilot` | postpones 3 days |
| PC-P3 | new: registers on day 0 | `Pilot` or `Pliot` (param `gpoName`) | installs when asked |
| PC-K1 | Pilot and Kiosks (a test kiosk) | `Pilot;Kiosks` | installs when asked |
| PC-K2 | Kiosks | `Kiosks` | installs when asked |
| PC-01 … PC-04 | Production | `Production` | install when asked |
| PC-05, PC-06 | Production | `Production` | postpone 3 days |

KB-A was approved (Install, no deadline) for Pilot, Production and Kiosks on day −7: at step 0 every member of those
groups has it. PC-P3 does not (it is new).

## One step = one day

Step n is day n − 1 (step 0: before day 0). Every run is 10 days (steps 1–10), the length of the timeline.
On each day, in this order:

1. **Admin actions:** the decline, if the button set it for this day, then the plan for the day (table below). The
   admin does not approve a declined update: such an approval is skipped.
2. **Each computer contacts the server**, in the table's order: a new one registers; in client-side mode its group
   membership is set from its Group Policy (rule 1); then its effective approval is worked out (rules 3–5) and it acts
   on it (rule 6).

| Day | Admin action (KB-B) |
|---|---|
| 0 | approve Install for Pilot (or for All Computers, param `firstApproval: all`); with `kioskRemove`, approve Remove for Kiosks |
| 1 | if PC-P3 is in Unassigned Computers: move it to Pilot (rejected in client-side mode, rule 2) |
| 4 | approve Install for Production, deadline `prodDeadline` (none or day 7); skipped when KB-B is approved for All Computers or declined |
| `declineAt` | decline KB-B (button: the decline is the next day) |

## Rules (sources: NOTES.md, "Sources"; Microsoft facts are *(check)*)

1. **Targeting.** Server-side: a new computer lands in Unassigned Computers; the admin moves it. Client-side: the
   computer's Group Policy names its group (or groups, separated by `;` *(check)*); the server puts it in every named
   group that exists, and in Unassigned Computers if none exists. Names are compared without regard to case
   *(check)*; `Pliot` is not `Pilot`. (Microsoft, "Manage WSUS computer groups" *(check)*.)
2. **One mode at a time.** In server-side mode the Group Policy group name is ignored; in client-side mode the console
   cannot move computers (the move is rejected and nothing changes) *(check)*.
3. **Inheritance.** A group with no approval of its own for an update takes its parent's ("same as parent"); a group's
   own approval overrides the inherited one *(check)*. All Computers is everyone's ancestor, Unassigned Computers
   included. A group with no approval anywhere up its chain is Not approved.
4. **Several groups.** A computer's effective approval is the strongest of its groups': Install beats Remove, Remove
   beats Not approved. Its deadline is the earliest deadline among the groups that give Install; a Remove approval's
   deadline is not modelled (Microsoft, "Approving updates" *(check)*). Not modelled either: Microsoft's conflict text
   may also give an approval *with* a deadline priority over one without (so a Remove with a deadline would beat an
   Install without) *(check)*; no preset gives Remove a deadline.
5. **Declined is global.** A declined update is offered to nobody, whatever the cells say; computers that installed it
   keep it (declining uninstalls nothing).
6. **Acting on the approval** (KB-A and KB-B alike):
   - Install, not yet detected: the scan **detects** it on that day (◐) and the client downloads it. The user is
     asked the next day: a user who installs when asked installs on day d + 1 (●); one who postpones 3 days, on
     d + 4.
   - Install with a deadline: on the deadline day (or the first scan after it) a computer that has not installed
     it yet installs it **by force** (⚠), restarting at once (`win-wsus-client-cycle` shows the restart). A computer
     that detects it on or after the deadline day installs it by force that same day.
   - Not approved, or declined, while detected: no longer offered; it goes back to ○ (and its schedule is dropped).
   - Remove while installed: uninstalled at that scan (○). No preset reaches it (Remove only ever meets computers
     without KB-B); a test covers it from a hand-made state.
   - Installed stays installed under Not approved and Declined.

## Tie-breaks

1. **Admin actions run before scans** (task rule 7): an approval made on day d, and a computer added to a group on
   day d, are seen at that computer's scan on day d.
2. **Client-side membership is set at the contact itself**, before the effective approval: PC-P3 registering with
   `Pilot` on day 0 detects Pilot's approval on day 0.
3. **The user's own day and the deadline on the same day:** the install counts as the user's (●); the deadline forces
   only what is still waiting.
4. **Install beats Remove** even when Remove is a group's own approval and Install is inherited on another group:
   rule 4 compares the computer's groups, rule 3 works inside each group's chain.

## Params

`targeting` server / client (server); `gpoName` `Pilot` / `Pliot` (Pilot); `prodDeadline` none (−1) / day 7 (7)
(none; disabled with `firstApproval: all`); `kioskRemove` (off); `firstApproval` pilot / all (pilot; not in the task,
see NOTES.md); `declineAt` (−1: never; set by the button "decline KB-B" to the current step n, so KB-B is declined on
day n, which is step n + 1).

## Presets and expected numbers (KB-B; derived by hand before coding, checked by `sim.test.js`)

Day of each computer's KB-B event (det = detected, ● = installed, ⚠ = forced; – = never):

| Preset | Params | P1 | P2 | P3 | K1 | K2 | 01–04 | 05, 06 | Installed on day 9 |
|---|---|---|---|---|---|---|---|---|---|
| `pilot-first` | defaults | det 0, ● 1 | det 0, ● 4 | Unassigned 0; moved 1: det 1, ● 2 | det 0, ● 1 | – | det 4, ● 5 | det 4, ● 8 | 10 of 11 |
| `production-deadline` | `prodDeadline: 7` | as above | | | | | det 4, ● 5 | det 4, ⚠ 7 | 10 of 11 |
| `typo-unassigned` | `targeting: client`, `gpoName: Pliot` | as above | | Unassigned 0, move rejected 1, – | | | as above | | 9 of 11 |
| `two-groups` | `kioskRemove: true` | as pilot-first; K1 = Install (Pilot) beats Remove (Kiosks); K2 Remove, nothing to remove | | | | | | | 10 of 11 |
| `approve-all` | `firstApproval: all` | det 0, ● 1 | det 0, ● 4 | Unassigned, det 0, ● 1 (moved day 1, still Install) | det 0, ● 1 | det 0, ● 1 | det 0, ● 1 | det 0, ● 4 | 11 of 11 by day 4 |
| `decline` | `declineAt: 2` | det 0, ● 1 (keeps it) | det 0, ○ 2 | det 1, ○ 2 | det 0, ● 1 (keeps it) | – | – | – | 2 of 11 |

Other checked cases: client-side with `Pilot`: PC-P3 registers into Pilot on day 0, detects on day 0, ● 1; no move on
day 1. Server-side with `Pliot`: identical to `pilot-first` (rule 2). Client-side `Pliot` with `firstApproval: all`:
PC-P3 in Unassigned still gets KB-B (inherits All Computers): det 0, ● 1. `prodDeadline: 7` without a Production
approval (approve-all) does nothing.

Steps: every run is 10; `sim.json` `steps` is 10.

## Rings (preset task `win-update-rings`, `docs/tasks/w3/win-update-rings.md`)

One concept: **approval rings and deferrals; a bad patch stopped at ring 1.** The same staged rollout as above,
arranged as rings whose approvals come a fixed number of days after the release. The toggle `rings` switches the
page to this scene (a different fleet and plan; the rules above all still apply).

### Scene

- **Groups:** All Computers → Unassigned Computers, `Ring 0 IT`, `Ring 1 Pilot`, `Ring 2 Broad`.
- **Fleet (93):** Ring 0: IT-01 … IT-03 (none runs LOB); Ring 1: PL-01 … PL-10, PL-01 … PL-04 tagged `LOB` (they run the
  line-of-business application); Ring 2: BR-01 … BR-80, BR-01 … BR-30 tagged `LOB`. 34 LOB computers in all.
  Server-side targeting, every computer registered and in its ring at step 0. No KB-A.
- **One update:** `KB-X` (param `patch: bad`: `health: 'bad', affects: 'LOB'`) or `KB-Y` (`patch: good`).
- **Ring computers install at the scan** (`auto: true`): detected and installed on the same day, nobody asks a user
  (rule R0). The host's computers keep the user model of rule 6.
- **Stage:** the console as above with one update column and, per ring, a cell with its scheduled day; members drawn
  as one mark per computer (circle, or square for LOB; hollow = not installed, filled = installed, ✕ = broken). Below,
  the timeline per ring (not per computer): per day the count installed and the count broken, and an admin row with
  the approvals (✓), the report (⚑) and the decline (⊘).

### Rules (host rules plus)

- **R0 (model choice).** A ring computer installs an approved update at the scan that detects it (automatic install;
  no user is asked, no postponement).
- **R1.** A ring is a computer group whose approval is made a fixed number of days after the release: Ring 0 day 0,
  Ring 1 day 2, Ring 2 day `ring2Day` (7, 3 or 2). WSUS: an approval per group made on the day; Windows Update for
  Business: a quality-update deferral per ring, 0–30 days *(check)* (Microsoft, "Build deployment rings for Windows
  client updates" *(check)*). `rollout: all` approves All Computers on day 0 instead (no rings).
- **R2 (toy delay, derived).** An install of a bad update on a computer with the tag it affects breaks it on that day
  (`broken` = the day); the break is reported `REPORT_DELAY` = 1 day later.
- **R3.** On the day a break is reported the admin stops the rollout: declines the update (host rule 5), before the
  plan of the day and before the scans (host tie-break 1). Windows Update for Business would pause quality updates
  for the later rings instead (up to 35 days *(check)*); not modelled, the explanation names it. An approval of the
  declined update planned for that day or later is skipped (host). A report while it is already declined changes
  nothing more.
- **R4.** A broken computer stays broken while the update is installed; declining uninstalls nothing (host rule 5),
  so stopping protects only rings not yet approved. A Remove approval uninstalls it and clears `broken` (no preset;
  a test from a hand-made state).

### Tie-breaks

1. **Report before plan before scans:** on day d the report (of breaks from day d − 1) and the decline come first,
   then the day's planned approvals (skipped when declined), then the scans. So a ring approved on the report day
   never gets the update (`deferral-too-short` with `ring2Day: 3`).
2. **Rings approved on the same day** install on the same day; a report the next day stops neither.
3. **Several breaks on one day** are one report, one decline.

### Params

`rings` (off; resets to step 0), `rollout` rings / all (rings), `ring2Day` 7 / 3 / 2 (7; disabled with `rollout: all`),
`patch` bad / good (bad). In the rings scene the host's params and the decline button are hidden.

### Presets and expected numbers (derived by hand before coding, checked by `sim.test.js`)

| Preset | Params | Day 0 | Day 2 | Day 3 | Ring 2 | End (day 9) |
|---|---|---|---|---|---|---|
| `rings-stop-at-1` | `rings` | Ring 0 approved, 3 install, 0 broken | Ring 1 approved, 10 install, 4 broken | reported, KB-X declined | approval day 7 skipped | 13 of 93 installed, 4 broken, 30 LOB protected |
| `no-rings` | `rings`, `rollout: all` | All Computers approved, 93 install, 34 broken | – | – | installed day 0 | 93 of 93, 34 broken (reported and declined day 1: nothing left to stop), 0 protected |
| `deferral-too-short` | `rings`, `ring2Day: 2` | as above | Ring 1 and Ring 2 approved, 90 install, 34 broken | reported, declined: nothing left | installed day 2 | 93 of 93, 34 broken, 0 protected |
| `good-patch` | `rings`, `patch: good` | Ring 0, 3 install (KB-Y) | Ring 1, 10 install | – | approved and installed day 7 | 93 of 93 by day 7, 0 broken; without rings all on day 0 |

Also checked: `ring2Day: 3` (bad): reported and declined day 3 before Ring 2's approval on day 3, which is skipped:
as `rings-stop-at-1`, 4 broken, 30 protected. `rollout: all` with `patch: good`: 93 install day 0, nothing reported.
Steps: 10 per preset, as the host.
