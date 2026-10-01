# win-wsus-client-cycle: The client update cycle

| | |
|---|---|
| Task | `win-wsus-client-cycle` (wave 3, WSUS and updates) |
| Catalogue entry | `win-wsus-client-cycle` in `docs/catalogue.md` §4.5.6 |
| Kind | build a new simulator |
| Folder | `sims/win-wsus-client-cycle/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `updates` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-wsus-flow` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **detect, download, install, reboot; scan interval, deadlines, active hours**.

The student: run days of client time with different settings.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.6.
5. `sims/win-wsus-flow/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Configure Group Policy settings for Automatic Updates" (Configure Automatic Updates options 2–5 and 7, detection frequency, scheduled install time, rescheduling missed installs); "Manage device restarts after updates" (active hours, maximum range); "Approve and deploy WSUS updates" (deadlines)

## Model and presets

- **Scene:** a 5-day timeline (Mon 00:00 to Sat 00:00) in 6-hour steps for two machines side by side: DESK-1 (always on) and LAP-1 (off at night, 18:00–08:00). Bands: active hours (hatched), machine off (grey with ⏻), scans (◆), download (▬), install (■), restart (↻), deadline (⏰). Each machine shows its update agent state: idle / detected / downloading / ready to install / pending restart / done.
- **State:** `t` (hours from Mon 00:00), `update: { approvedAt, deadline | null }`, `machines: [{ id, onHours, au: 2|3|4, schedInstall (hour), activeHours: [from, to], lastScan, scanOffset (deterministic from seed), state, userActs: { postpone: bool } }]`, `log`.
- **One step:** advance 6 hours; within the window process events in time order: power on/off, scan, download, install, restart, deadline.
- **Rules:**
  1. Scan interval: detection frequency (default 22 h) minus a random 0–20 % (17.6–22 h) (Microsoft, "Automatic Updates detection frequency" (check)); the model uses a fixed offset per machine from the seed.
  2. A machine that is off doesn't scan, download or install; it scans soon after it starts (check).
  3. AU 2 (notify download and install): nothing happens until the user acts. AU 3 (auto download, notify install): downloads, then waits for the user. AU 4 (auto download, scheduled install): downloads, installs at the scheduled time (default every day 03:00) (Microsoft, "Configure Automatic Updates" (check)).
  4. A scheduled install that was missed because the machine was off runs after the next start-up (check).
  5. A restart after install is not done automatically inside active hours (default 08:00–17:00, at most 18 h wide (check)); it happens at the first moment outside them when the machine is on.
  6. At a deadline (WSUS approval deadline) the update installs and the machine restarts even inside active hours, after notice (check).
  7. Tie-break: an approval and a scan in the same 6-hour window: the approval counts if it is earlier in the window.
- **Params:** `au` choice 2 / 3 / 4 (default 4); `detection` range 1–22 h (default 22); `activeHours` choice 08–17 / 06–23 (default 08–17); `deadline` choice none / Thu 12:00 (default none); `laptopOffAtNight` toggle (default on).
- **Presets:**
  1. `desktop-scheduled` — derived, unchecked: approved Mon 10:00; DESK-1 scans Mon 14:00 (offset), downloads, installs Tue 03:00, restarts at once (outside active hours). Done Tue 03:00.
  2. `laptop-missed` — derived, unchecked: LAP-1 off at 03:00 → install runs after start-up Tue 08:05 → restart pending; active hours block it until 17:00; restarts Tue 17:00.
  3. `notify-ignored` — derived, unchecked: AU 3, user never clicks → downloaded, waiting all week; with deadline Thu 12:00 → installed and restarted Thu 12:00 inside active hours.
  4. `notify-only` — derived, unchecked: AU 2 → not even downloaded until the user acts; nothing by Friday.
  5. `short-detection` — derived, unchecked: detection 4 h → DESK-1 sees the approval within 4 h instead of up to 22 h; install still waits for 03:00.
- **Steps:** 20 per preset (5 days × 4 windows of 6 h).
- **Legend:** as in the scene; each band has a pattern and a label as well as a colour; the state chip per machine. "Changed" marks the events that happened in the current 6-hour window and the state chip if it changed.
- **Captions:**
  - hr: "Laptop je u 03:00 bio ugašen. Zakazana instalacija pokreće se nakon paljenja, ali ponovno pokretanje čeka kraj *active hours* (aktivnih sati) u 17:00."
  - en: "The laptop was off at 03:00. The scheduled install runs after start-up, but the restart waits for the end of active hours at 17:00."
  - hr: "Rok je u četvrtak u 12:00: ažuriranje se instalira i računalo se ponovno pokreće, iako je usred radnog dana."
  - en: "The deadline is Thursday 12:00: the update installs and the computer restarts, although it is the middle of the working day."
- **Terms:** detection (scan) — otkrivanje (provjera ažuriranja); detection frequency — učestalost provjere; scheduled install — zakazana instalacija; active hours — aktivni sati; restart — ponovno pokretanje; deadline — rok; Automatic Updates — automatsko ažuriranje.
- **Misconceptions:** "an approved update is installed within the hour"; "active hours prevent installs" (they defer restarts); "machines that are off at night miss updates forever".
- **Out of scope:** feature updates, Windows Update for Business policies in depth, update delivery (`win-wsus-delivery`), server-side groups (`win-wsus-groups`).
- **Reuse from `win-wsus-flow` (soft dependency):** client and update objects and the scan rule; new: the time-of-day model, AU options, active hours and deadlines.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-wsus-client-cycle sims/win-wsus-client-cycle` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-wsus-client-cycle/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
