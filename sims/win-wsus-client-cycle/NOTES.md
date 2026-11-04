<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-wsus-client-cycle: notes

New stepper (task `docs/tasks/w3/win-wsus-client-cycle.md`, catalogue `win-wsus-client-cycle`, §4.5.6, wave 3). No kit
view: the task names none, and none of K1–K4 is a time line with bands, so the page draws its own (HTML, no SVG, so
text stays at 1:1). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Time in whole minutes**, one step = 360 minutes processed minute by minute in phase order (power, approval,
  deadline, scan, user, download, install, restart; DESK-1 before LAP-1). Exact, deterministic, and fast enough for
  the tests' 192 combinations. 20 steps, fixed.
- **Fixed scan offsets** (no seed): DESK-1 cuts 10 % off the detection frequency, LAP-1 15 % (both inside 0–20 %);
  scans fall at anchor + k·interval with anchors Mon 14:00 and Mon 15:00, which gives the task's "DESK-1 scans Mon
  14:00" and keeps the 4-hour preset on the same phase. The task's "scanOffset (deterministic from seed)" is
  `scanAnchor` + `scanCut`.
- **Durations (model):** download 60 min of on-time (pauses while off); a missed scan or scheduled install runs
  5 min after start-up (the task's Tue 08:05); install takes no time; the deadline restart is in the same minute
  (the task's "restarts Thu 12:00"; a real client shows a notice first, said in SPEC.md).
- **A shut-down completes a pending restart** (LAP-1 at 18:00 with active hours 06–23). The task does not say what
  happens to a pending restart when the machine turns off; "update and shut down" is the behaviour students know.
- **The user (`userClicks`, new param, off by default and in every preset).** The task's state has `userActs` and
  presets 3 and 4 say "the user never clicks", so clicking must be possible: when on, the user answers a notice an
  hour after it appears, inside active hours, with the machine on. Disabled (with the reason) under AU 4.
- **`desktop-scheduled` sets `laptopOffAtNight` off**, so the first two presets differ: with defaults both would be
  the same run. In it both machines install and restart Tue 03:00; `laptop-missed` (defaults) then shows LAP-1 off.
- **Update KB-A**, as in `win-wsus-flow`, approved Mon 10:00 (fixed). The deadline is part of the approval: the WSUS
  row shows ⏰ from the approval on.
- **"Changed":** marks of events inside the current window, the stages reached in it and a state chip that changed;
  the window itself is outlined and the rest of the week dimmed. The "In this window" list holds only this window's
  events, so its rows are not highlighted again; scans that find nothing are folded into one row per machine.
- **Scans that find nothing** are drawn smaller than the one that finds KB-A, so 1-hour detection stays readable.
- **Reuse of `win-wsus-flow`:** `models/` has no promoted WSUS model, and flow's event engine is the two-server
  hierarchy, so no function was copied. The client fields (`nextScan`, `interval`, `lastScan`, `state`, `detectT`,
  `installT`), the update id and the scan rule (22 h minus a fixed part of 0–20 %) follow it. If the coordinator
  promotes a WSUS client model later, `intervalOf`, `nextScanAt` and `nextAtHour` are pure and promotable.
- **hr subtitle** (`concept`): "Nađi, preuzmi, instaliraj, pokreni ponovno; učestalost, rok, aktivni sati" (73);
  the noun form with "ponovno pokretanje" and "učestalost provjere" was 85, over the 80 limit.
- **Names:** WSUS, Automatic Updates and active hours are named: the course teaches WSUS (COMMON.md §1). No product
  other than Windows features appears.

## Deviations from the task

- Added the `userClicks` param (above).
- Step order inside a minute puts the deadline before scan/install/restart (the task lists it last). With the
  deadline as a condition ("from the deadline on") rather than a one-off event, the order only decides that an
  install and a restart due at the deadline minute happen in it.
- `desktop-scheduled` uses `laptopOffAtNight: false` (above).
- AU 2 with a deadline (not a preset): the download starts at the deadline, so install and restart are at 13:00.

## Sources

- Task file, model and presets (derived, unchecked).
- Microsoft Learn titles from the task, not opened from here (no network): "Configure Group Policy settings for
  Automatic Updates" (Configure Automatic Updates options 2–5 and 7, Automatic Updates detection frequency,
  scheduled install day and time, Reschedule Automatic Updates scheduled installations); "Manage device restarts
  after updates" (active hours, maximum range); "Approve and deploy WSUS updates" (deadlines).

## Unchecked *(check)*

- Detection frequency 22 h default and the random 0–20 % cut.
- AU option numbers and meanings (2 notify download, 3 auto download notify install, 4 auto download scheduled
  install); scheduled install default every day 03:00.
- Missed install: "Reschedule Automatic Updates scheduled installations" wait range 1–60 min; not configured is
  said to be 1 min; the model uses 5 min (task: 08:05).
- A scan missed while off runs soon after start-up (model: 5 min).
- Active hours default 08:00–17:00 and the maximum width 18 h.
- Deadline: install and restart at the deadline, inside active hours, after a notice (model: no delay).
- A pending restart completes at shut-down ("Update and shut down"; not sleep or closing the lid, which the model
  does not have).
- AU 2's name: current Group Policy says "Notify for download and auto install"; older docs "notify for download and
  install" (the review).

## Checks

- The preset timelines were derived by hand from the rules (SPEC.md) before the page; the model agrees, and
  `sim.test.js` pins each one in literal minutes (it caught a wrong hand value: Thu 12:00 is minute 5040, not 4320).
- 34 tests: 5 tie-breaks first, then one or more per rule, presets, `waitingFor`, every combination (au × 4
  detections × active hours × deadline × laptop × user: time order, states only forward, one install and restart,
  done after a deadline), the generic block.
- 28 mutations, one at a time (approval after the scan, approval seen early, no random cut, a 20 % cut, scanning
  while off, no start-up delay, downloading while off, AU 2 downloading, AU 3 installing at 03:00, install hour 04,
  installing while off, missed install never rescheduled or without delay, restart inside active hours, active hours
  blocking the install, no shut-down completion, deadline ignored for restart or install, deadline known before the
  scan, AU 2 not downloading at the deadline, user answering at once or outside active hours or under AU 4, 30-min
  download, laptop on at 07:00, deadline 13:00, `nextScanAt` ignoring off time, `waitingFor` while off): 27 fail a
  test. The survivor is equivalent: "deadline known only after the scan" (every use of it is on a machine past
  `idle`, which has `detectT`).
- Fresh review (a separate agent read the code against SPEC.md, ran all 1056 parameter combinations, made 40 more
  mutations and read every preset's captions in both languages). The model matched SPEC.md. Fixed from it: the user's
  answer time in captions was the install time (AU 2); the AU 2 scan caption said "nothing more happens" when the
  user answers or a deadline is set; a window holding the deadline said "nothing changes"; the deadline caption's
  plural ("računala se ponovno pokreću" / "the computers restart") and one sentence for both machines after it; an
  ambiguous "on" in hr and the first mention of *active hours* on that path; the download bar crossed the night (now
  drawn only where the machine is on); the legend lacked the missed-install mark (□, now in the install item);
  highlighted stages covered the time above; a window with install and shut-down told only the shut-down (captions
  now tell every event of the window, in order). Two surviving mutations (no `restartT` at shut-down, the user
  answering while off) now fail a test; `scan.found` 'known' is asserted; `waitingFor`'s unused `deadline` field on
  installs is gone. A name node reused across sentences vanished from captions (found in the re-check, fixed). Its
  other survivors were equivalent. Fact notes taken: AU 2's current name, restart policies not modelled.
- `npm run gate -- win-wsus-client-cycle`: pass (manifest, tests, build, 62 browser checks, tokens, scope).
  Screenshots 1920×1080 light, dark, grayscale and 375×812 in both languages reviewed, plus laptop-missed at 6,
  notify-ignored at 14 (en), notify-only at 9, short-detection at 2, detection 1 h with AU 3 and the user at 3.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| detection (scan) | otkrivanje (provjera ažuriranja) | task |
| detection frequency | učestalost provjere | task |
| scheduled install | zakazana instalacija | task |
| active hours | aktivni sati | task |
| restart | ponovno pokretanje | task |
| deadline | rok | task |
| Automatic Updates | automatsko ažuriranje | task |

## Shared requests

- **A time-line view** (bands over a day axis, point marks in lanes, a current-window outline, the future dimmed):
  drawn in the page here; later WSUS and scheduling sims (`win-update-rings`, maintenance windows) would reuse it.
- **Legend swatches** `cc-active` (hatched), `cc-off` (grey with ⏻), `cc-scan` ◆, `cc-dl` bar, `cc-install` ■,
  `cc-restart` ↻: defined in the page.

## Time

Start 2026-11-04 18:23; model, tests and page with the gate passing 18:36; fresh review, fixes, gate passing and status ready 18:55: about 32 min.
