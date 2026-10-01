# win-gpo-loopback: Loopback processing

| | |
|---|---|
| Task | `win-gpo-loopback` (wave 3, Group Policy) |
| Catalogue entry | `win-gpo-loopback` in `docs/catalogue.md` §4.5.2 |
| Kind | build a new simulator |
| Folder | `sims/win-gpo-loopback/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `group-policy` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-gpo-precedence` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **user policy from the computer's OU, replace vs merge**.

The student: log users into a kiosk OU.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.2.
5. `sims/win-gpo-precedence/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: extends win-gpo-precedence
- Microsoft Learn: "Loopback processing of Group Policy" (merge vs replace; users need permissions on computer-path GPOs) (check title); "Configure user Group Policy loopback processing mode" (Administrative Templates policy reference)

## Model and presets

- **Scene:** two containers: `OU=Staff` (user `ana`) with GPO "Staff User" (user settings: wallpaper = staff.jpg, drive P:), and `OU=Kiosks` (computer `KIOSK1`) with GPO "Kiosk Lockdown" (user settings: wallpaper = kiosk.jpg, hide Control Panel; computer setting: loopback mode). A K4 table of the user-settings list built at ana's logon on KIOSK1, in processing order, with the winner per setting.
- **State:** `{ mode: 'off'|'merge'|'replace', userGpos: [], computerGpos: [], kioskReadableByUsers: bool, list: [], cursor, result: { setting: { value, from } } }`.
- **One step:** add one GPO's user settings to the list (or drop it with the reason), then show the result.
- **Rules (Microsoft: "Loopback processing of Group Policy"; "Configure user Group Policy loopback processing mode" (policy reference)):**
  1. Without loopback, user settings come from the GPOs in the user's path (`OU=Staff`); user settings in GPOs linked to the computer's OU do nothing for users.
  2. Loopback is a computer setting: it takes effect only when the GPO that sets it applies to the computer.
  3. Merge: the user's own list is processed first, then the user settings of the computer's list; on conflicts the computer's list wins (processed last).
  4. Replace: only the computer's list provides user settings; the user's own GPOs are ignored.
  5. The computer-path GPOs are still security-filtered against the user: the user needs Read + Apply on "Kiosk Lockdown", or it is dropped (`win-gpo-security-filtering`).
  6. Within each list the normal precedence holds (`win-gpo-precedence`).
- **Params:** `mode` choice {off, merge, replace} default off; `usersCanRead` toggle default on.
- **Presets (4):**
  - `no-loopback` — ana on KIOSK1: wallpaper staff.jpg, P: mapped, Control Panel visible; Kiosk Lockdown's user half unused. 3 steps. Derived, unchecked.
  - `merge` — order Staff User, then Kiosk Lockdown: wallpaper kiosk.jpg (computer list wins), P: mapped, Control Panel hidden. 3 steps.
  - `replace` — only Kiosk Lockdown: wallpaper kiosk.jpg, no P:, Control Panel hidden. 2 steps.
  - `filtered` — replace, but users lack Read on Kiosk Lockdown → no user settings at all from either list. 3 steps.
- **Steps:** max 3.
- **Legend:** user-path GPO (person icon), computer-path GPO (monitor icon), dropped (struck through), conflict winner (✓); "changed" highlight marks the row just added and any value it overwrote.
- **Captions:** hr: "*Loopback* u načinu *merge* (spajanje): prvo pravila korisnika, zatim korisnička pravila iz OU-a računala — u sukobu pobjeđuje kiosk." en: "Loopback in merge mode: the user's policy first, then the user settings from the computer's OU — the kiosk wins conflicts."
  hr: "U načinu *replace* (zamjena) korisnik dobiva samo pravila kioska: pogon P: nestaje." en: "In replace mode the user gets only the kiosk's policy: drive P: is gone."
- **Terms (check):** loopback processing — obrada povratne petlje; merge — spajanje; replace — zamjena; user configuration — korisnička konfiguracija; computer configuration — konfiguracija računala; kiosk — kiosk.
- **Misconceptions:** user settings in a GPO linked to computers apply to whoever logs on; loopback replaces computer settings; loopback ignores security filtering.
- **Out of scope:** the timing (`win-gpo-processing`), preferences targeting, RDS session hosts beyond a mention.
- **Builds on `win-gpo-precedence`:** reuses its list builder and winner table; new is the second (computer-path) list and the two modes.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-gpo-loopback` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-gpo-loopback sims/win-gpo-loopback` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-gpo-loopback/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
