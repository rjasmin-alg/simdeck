<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-wsus-client-cycle: specification

One concept: **detect, download, install, restart; scan interval, deadlines, active hours** (task
`docs/tasks/w3/win-wsus-client-cycle.md`, catalogue `win-wsus-client-cycle`, §4.5.6). The student runs a working week
of client time for two machines with different Automatic Updates settings.

## Scene

A timeline Mon 00:00 → Sat 00:00 (120 h) with a row for WSUS (approval ✓ Mon 10:00, deadline ⏰ Thu 12:00 when set)
and one row per machine: **DESK-1** (always on) and **LAP-1** (off 18:00–08:00 when `laptopOffAtNight`). Each machine
row has a band track (active hours hatched, machine off grey with ⏻) and an event track: scan ◆, download ▬,
install ■, restart ↻. The current 6-hour window is outlined; the part after it is dimmed. Under the timeline: a card
per machine (its state chip idle / detected / downloading / ready to install / restart pending / done, the four
stages found → downloaded → installed → restarted with their times, its settings, and what it waits for), and the
list of what happened in this window.

## State

`{ t, update: { id, approvedAt, approved, deadline | null }, machines: [...], log }`, `t` in minutes from Mon 00:00.

machine: `{ id, kind, onHours: [8, 18] | null, au: 2|3|4, schedInstall: 3, activeHours: [from, to], scanAnchor,
scanCut, interval, nextScan, lastScan, missedScan, on, upAt, state, detectT, noticeT, dlStartT, dlLeft, dlEndT,
missedInstall, installT, installHow, restartT, restartHow, go, userT, userActs: { postpone } }`.

state: `idle` (nothing known) → `detected` (AU 2: notice "download?") → `downloading` → `ready` (downloaded, waits
for the install) → `pending` (installed, restart pending) → `done`.

`log`: every event `{ t, who, kind, ... }`, kinds `on`, `off`, `approve`, `deadline`, `scan` (`found`: none / new /
known, `late`: after start-up), `user`, `downloaded`, `missed`, `install` (`how`: scheduled / missed / user /
deadline), `restart` (`how`: outside / deadline / shutdown).

## One step

Advance 6 hours: step n processes every minute m in ((n − 1)·360, n·360], in this phase order: (1) power on/off,
(2) approval, (3) deadline, (4) scan, (5) the user answers a notice, (6) download, (7) install, (8) restart; within a
phase DESK-1 before LAP-1. 20 steps (5 days × 4 windows), fixed.

## Rules

1. **Scan interval.** A client scans every *detection frequency* (default 22 h) minus a random 0–20 %, i.e. every
   17.6–22 h (Microsoft, "Configure Group Policy settings for Automatic Updates", "Automatic Updates detection
   frequency" *(check)*). The model fixes each machine's random part: DESK-1 −10 % (22 h → 19 h 48 min), LAP-1 −15 %
   (22 h → 18 h 42 min). Scans fall at anchor + k·interval: DESK-1's anchor is Mon 14:00, LAP-1's Mon 15:00, so with
   22 h their first scans are Mon 14:00 and 15:00, and with 4 h (3 h 36 min, 3 h 24 min) Mon 03:12 and 01:24. After
   each scan the next is due one interval later.
2. **Off means nothing happens.** A machine that is off does not scan, download or install. A scan that falls due
   while it is off runs 5 min after the next start-up (model setting *(check)*); the interval counts from that scan.
   A download pauses while the machine is off and continues after start-up (60 min of download time, model).
3. **Automatic Updates options** (Microsoft, "Configure Automatic Updates" *(check)*):
   - AU 2, notify for download and auto install (older wording: "notify for download and install"): the scan finds
     the update and shows a notice; nothing is downloaded until the user acts, and the install follows the download.
   - AU 3, auto download and notify for install: downloads at once (60 min), then shows a notice and waits for the
     user.
   - AU 4, auto download and schedule the install: downloads at once, installs at the scheduled time, every day at
     03:00 (the policy's default *(check)*).
   - The user (param `userClicks`, off by default and in every preset) answers a notice an hour after it appears, at
     the first minute inside active hours while the machine is on: AU 2 → download, then install at once; AU 3 →
     install at once. Model, not from a source.
4. **Missed scheduled install.** AU 4, the update downloaded, the machine off at 03:00: the install is missed and runs
   5 min after the next start-up (Microsoft, "Reschedule Automatic Updates scheduled installations", wait 1–60 min;
   the model uses 5 min *(check: not configured is said to be 1 min)*).
5. **Active hours.** After an install the restart is pending. It is not done automatically inside active hours
   (default 08:00–17:00; the other choice 06:00–23:00; a range is at most 18 h wide (Microsoft, "Manage device
   restarts after updates" *(check)*)); it happens at the first minute outside them while the machine is on. Active
   hours do not stop an install, only the restart. A machine that shuts down with a restart pending completes the
   update as it shuts down (LAP-1 at 18:00 with active hours 06–23) *(check)*.
6. **Deadline.** A WSUS approval deadline (Microsoft, "Approve and deploy WSUS updates" *(check)*) is known to the
   client once it has found the update. From the deadline on, a machine that is on downloads (if needed), installs
   and restarts at once, inside active hours too; a real client shows a restart notice first *(check)*; the model
   restarts in the same minute. A machine that is off at the deadline does it at start-up.
7. **Tie-break: approval and scan.** Events in a window run in time order, so a scan earlier in the window than the
   approval finds nothing and one later finds the update. At the same minute the approval (phase 2) runs first, so the
   scan sees it.
8. **Tie-break: same minute.** Phase order decides: a download that ends at the scheduled install time is installed
   then; an install outside active hours is followed by the restart in the same minute; a restart pending at the
   moment of power-off completes at the shut-down (phase 1) rather than waiting.

## Params

| Param | Values | Default |
|---|---|---|
| `au` | 2 / 3 / 4 | 4 |
| `detection` | 1–22 h | 22 |
| `activeHours` | 08–17 / 06–23 | 08–17 |
| `deadline` | none / Thu 12:00 | none |
| `laptopOffAtNight` | on / off | on |
| `userClicks` | the user answers notices (AU 2 and 3) | off |

## Presets (derived by hand from the rules; the model agrees, `sim.test.js`)

| Preset | Params | Expected |
|---|---|---|
| `desktop-scheduled` | laptopOffAtNight off | KB-A approved Mon 10:00; DESK-1 scans Mon 14:00, downloads by 15:00, installs Tue 03:00 and restarts at once (outside active hours): done Tue 03:00. LAP-1 (on all night): scan Mon 15:00, download 16:00, done Tue 03:00 |
| `laptop-missed` | defaults | DESK-1 as above. LAP-1 scans Mon 15:00, downloads by 16:00, is off at 03:00 (missed), installs at Tue 08:05 after start-up, restart pending inside active hours, restarts Tue 17:00 |
| `notify-ignored` | AU 3, deadline Thu 12:00 | both download Monday (15:00, 16:00) and wait all week; at Thu 12:00 both install and restart, inside active hours |
| `notify-only` | AU 2 | both find KB-A Monday (14:00, 15:00) and show a notice; nothing is downloaded by Saturday |
| `short-detection` | detection 4 h | DESK-1 finds KB-A Mon 10:24 (24 min after the approval, not 4 h), LAP-1 Mon 11:29; installs still wait for Tue 03:00 (LAP-1: Tue 08:05, restart 17:00) |

Other runs pinned in the tests: AU 2 + deadline → download Thu 12:00–13:00, install and restart 13:00; AU 3 + user →
DESK-1 installs Mon 16:00 and restarts 17:00, LAP-1's notice at 16:00 is answered Tue 08:00 (17:00 is outside active
hours), restart Tue 17:00; active hours 06–23 → LAP-1's restart waits past its 18:00 shut-down, which completes it.

## Legend

Header legend: hatched band = active hours; grey band with ⏻ = machine off; ◆ scan (small: found nothing new);
▬ download (drawn only where the machine is on); ■ install (□ missed at 03:00); ↻ restart; "changed" (yellow and
outlined) = marks of this window, stages reached in it and a state chip that changed. ✓ approval and ⏰ deadline are
labelled where they are shown (the tags beside KB-A above the timeline); the state chip carries its own word and
symbol.

Not modelled: "No auto-restart with logged on users" and other restart policies; sleep (a laptop here is either on
or shut down).

## Out of scope

Feature updates, Windows Update for Business, update delivery (`win-wsus-delivery`), computer groups
(`win-wsus-groups`), the server side (`win-wsus-flow`), status reporting.
