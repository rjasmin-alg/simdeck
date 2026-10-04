<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-wsus-flow: specification

One concept: **Microsoft Update → upstream WSUS → downstream (replica or autonomous) → client; sync, approval,
download** (task `docs/tasks/w2/win-wsus-flow.md`, catalogue `win-wsus-flow`, §4.5.6). The student steps one update
through a two-site hierarchy.

## Scene

Kit view K2 (topology), left to right: Microsoft Update (cloud) → `WSUS-HQ` (upstream) → WAN → `WSUS-BR` (downstream,
replica or autonomous). Under each server its client: `PC-HQ1` (HQ), `PC-BR1` (branch). Each server card shows three
slots for the update KB-A: **M** metadata, **A** approval (and for which group), **C** content, each ✓ or —, plus its
mode, sync hour, the HQ's product selection and the client status it holds. Each client card shows its server, its
next scan and a five-stage strip: scanned → detected → downloaded → installed → reported, with the time of each. Above:
the clock (day and time) and a ruler Tue 19:00 → Sat 19:00 with a tick per step (HQ above the line, branch below it).
Beside: the event log. The packet of the step is drawn on its link: thin for metadata, approval, scan, report and
status; thick, with the size, for update files.

## State

`{ t, update: { id, product, released, sizeMB }, hqApproveAt, hqApproveDone, rollup, servers: { HQ, BR }, clients: [],
last, done, log }`. `t` is hours from Tuesday 19:00.

- server: `{ id, site, syncHour, meta, approvals: { [group]: bool }, approvedT, content, contentT, needT, lastSync,
  upRev, rev, reports: { [client]: 'installed' } }`; HQ also `products: []`, `storeLocally: true`; BR also `mode`.
- client: `{ id, site, server, group, nextScan, interval, state: idle|detected|downloaded|installed|reported, seen:
  null|absent|notApproved|approved, lastScan, detectT, dlT, installT, reportDue, reportT }`.

The task's `upstream`/`downstream` objects are `servers.HQ`/`servers.BR`; servers, clients and the update are separate
plain objects, and `events`/`apply`/`nextStep` take any state of that shape (for the later WSUS sims).

## One step

The next scheduled or admin event **that changes something** is applied. Events at the same time run in this phase
order: (1) syncs, (2) approvals, (3) server content downloads, (4) client scans, (5) client downloads, (6) installs,
(7) status reports; within one phase HQ before BR and PC-HQ1 before PC-BR1. A sync or scan that finds nothing new is
applied without a step (the clock passes it). A step is:

- the first sync of each server and the first scan of each client (they look and may find nothing);
- a sync that brings metadata, an approval or rolled-up status; a replica's sync after the upstream's catalogue
  (metadata or approvals) changed since its last one; an autonomous branch's sync while HQ has an approval the branch
  lacks, the first time after it changed (so the branch is seen *not* taking HQ's approval);
- a scan that changes what the client sees (absent / not approved / approved) or its state;
- every approval (admin event), content download, client download, install and report.

The run ends when nothing that changes anything is left before a week's horizon (t ≤ 168 h).

## Rules

1. **Upstream sync.** WSUS-HQ syncs from Microsoft Update daily at 03:00, and only for the products (and
   classifications) it is set to sync: KB-A's product (`Windows Server`) not selected → KB-A is skipped and never
   reaches any metadata. (Microsoft, "Configure WSUS", step "products and classifications" *(check)*.)
2. **Content on approval.** With "Download update files to this server only when updates are approved" (the default
   *(check)*), a server's content download starts when the update is approved, not at sync. Model: 30 min.
   (Microsoft, "Configure WSUS" / "Plan your WSUS deployment", update storage *(check)*.)
3. **Downstream sync.** WSUS-BR syncs from WSUS-HQ (not from Microsoft Update) daily at 04:00 and gets only what HQ
   has. (Microsoft, "Plan your WSUS deployment", WSUS server hierarchies *(check)*.)
4. **Replica vs autonomous.** A replica takes approvals, groups and settings from the upstream at each sync; its own
   admin cannot approve (its console offers no approving; the page shows the attempt failing). An autonomous server takes metadata from the upstream; approvals
   are made locally by the branch admin. (Microsoft, "Plan your WSUS deployment", "replica mode" and "autonomous mode"
   *(check)*.)
5. **Downstream content.** WSUS-BR downloads the files from WSUS-HQ after the update is approved *for it* (replica: by
   HQ's approval, arriving at the sync); HQ must have them or fetch them from Microsoft Update first (HQ's own 30 min,
   then BR's 30 min). *(check)*
6. **Client scan.** A client scans the WSUS its Group Policy names ("Specify intranet Microsoft update service
   location") about every 22 h minus a random 0–20 % ("Automatic Updates detection frequency", default 22 h
   *(check)*). The model fixes each client's random part: PC-HQ1 every 20 h from Wed 14:00, PC-BR1 every 18 h from Wed
   17:00 (both within 17.6–22 h). It detects only an update approved for its group **and** applicable (here: both
   clients in All Computers, KB-A applies to both). Not known to the server → "nothing missing"; known, not approved →
   "not approved".
7. **Client download, install, report.** The client downloads from its WSUS once that server has the files: 30 min at
   its own site, 1 h over the WAN. It installs at the next 03:00 at or after the download (Automatic Updates,
   scheduled install, model setting), and reports its status at its next contact: the first scan after the install
   (a scan at the install's own time runs first, phase 4 before 6). Model simplification, as the task states it: a
   real client sends its install result within minutes *(check)*.
8. **Roll-up.** A replica rolls its clients' status up to the upstream at its next sync (the reporting roll-up option,
   on in the model *(check)*). An autonomous server does not in the model *(check: later WSUS versions may roll up
   from autonomous servers too)*.
9. **Tie-break:** events at the same time run in the phase order above, so a scan at the moment of an approval sees
   it, a sync runs before a content download due at the same time, and a report due at a branch sync's time is rolled
   up only at the following sync.

## Params

| Param | Values | Default |
|---|---|---|
| `mode` | replica / autonomous (WSUS-BR) | replica |
| `upstreamProducts` | KB-A's product selected on WSUS-HQ | on |
| `branchPointsToHQ` | PC-BR1's policy names WSUS-HQ | off |
| `approveAt` | Wed 09:00 (t = 14) / Wed 03:30 (t = 8.5) | Wed 09:00 |
| `brAt` | the branch admin approves right after step `brAt` (−1 never); set by the button "Approve at the branch" | −1 |

## Timeline and presets

Times hand-derived from the rules before the model was written; the model agrees (`sim.test.js`).

`replica-two-sites` (defaults), 16 steps:

| # | Time | Event |
|---|---|---|
| 1 | Wed 03:00 | WSUS-HQ sync: metadata |
| 2 | Wed 04:00 | WSUS-BR sync: metadata (nothing approved yet) |
| 3 | Wed 09:00 | HQ approves KB-A for All Computers |
| 4 | Wed 09:30 | WSUS-HQ content from Microsoft Update (480 MB) |
| 5 | Wed 14:00 | PC-HQ1 scans WSUS-HQ: detected |
| 6 | Wed 14:30 | PC-HQ1 downloads |
| 7 | Wed 17:00 | PC-BR1 scans WSUS-BR: known, not approved |
| 8 | Thu 03:00 | PC-HQ1 installs (HQ's Thu 03:00 sync changes nothing: no step) |
| 9 | Thu 04:00 | WSUS-BR sync: approval inherited |
| 10 | Thu 04:30 | WSUS-BR content from HQ over the WAN |
| 11 | Thu 10:00 | PC-HQ1 reports (next scan) |
| 12 | Thu 11:00 | PC-BR1 scans: detected |
| 13 | Thu 11:30 | PC-BR1 downloads |
| 14 | Fri 03:00 | PC-BR1 installs (24 h after PC-HQ1: the branch is a day behind) |
| 15 | Fri 05:00 | PC-BR1 reports to WSUS-BR |
| 16 | Sat 04:00 | WSUS-BR sync: PC-BR1's status rolled up to HQ |

| Preset | Params | Steps | Path |
|---|---|---|---|
| `replica-two-sites` | — | 16 | above |
| `autonomous-waits` | mode autonomous | 10 | 1–8 as above (step 2 says approvals are local), 9 Thu 04:00 sync: HQ's approval not taken, 10 Thu 10:00 PC-HQ1 reports; PC-BR1 stays "not approved". With the button at step 10: + approve Thu 10:00, BR content 10:30, PC-BR1 scan 11:00, download 11:30, install Fri 03:00, report Fri 05:00 = 16 |
| `replica-cant-approve` | brAt 2 (opens at step 2) | 17 | the replica run with step 3 Wed 04:00: the branch admin's approval rejected |
| `not-synced` | upstreamProducts off | 5 | HQ sync skips KB-A, BR sync has nothing, HQ admin finds nothing to approve, PC-HQ1 and PC-BR1 scan: nothing missing |
| `client-points-to-hq` | branchPointsToHQ on | 14 | PC-BR1 scans HQ Wed 17:00: detected, downloads over the WAN by 18:00, both clients install Thu 03:00; WSUS-BR still syncs and downloads the files nobody takes from it; PC-BR1 reports to HQ Thu 11:00 |

Other: approve at Wed 03:30 → 14 (the replica takes the approval at the Wed 04:00 sync; both clients install Thu
03:00). Maximum over every combination (modes, toggles, approval times, `brAt` −1…20): within 20 (`sim.test.js`).
Default 16 = `sim.json` `steps`.

## Legend

M / A / C slot: solid with ✓ = the server has it, dashed with — = not yet; client strip: filled square = stage
reached; thin arrow = metadata, approval, scan, report, status; thick arrow with a size = update files; "changed" =
the slot, stage, log row and ruler tick of this step.

## Out of scope

Computer groups and deadlines (`win-wsus-groups`), the client cycle in detail (`win-wsus-client-cycle`), express files
and peer caching (`win-wsus-delivery`), cleanup (`win-wsus-supersedence`), cloud update services, reboots,
classifications other than through the product switch.
