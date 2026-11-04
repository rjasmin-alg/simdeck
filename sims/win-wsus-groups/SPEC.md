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
