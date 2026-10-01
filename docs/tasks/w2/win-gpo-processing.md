# win-gpo-processing: When policy applies

| | |
|---|---|
| Task | `win-gpo-processing` (wave 2b, Group Policy) |
| Catalogue entry | `win-gpo-processing` in `docs/catalogue.md` §4.5.2 |
| Kind | build a new simulator |
| Folder | `sims/win-gpo-processing/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `group-policy` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **computer at boot, user at logon, background refresh every 90 ± 30 min, gpupdate; settings that need a foreground pass**.

The student: change a GPO, run time, log off and on.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.2.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "Group Policy refresh interval for computers" (90 min, offset 0–30 min; DCs 5 min) (check title); "Understand the effect of fast logon optimization on Group Policy" (check title); "Always wait for the network at computer startup and logon" (policy reference); "gpupdate" command reference

## Model and presets

- **Scene:** a time axis (hours) with the PC's events: boot, user logon, background refreshes (each at 90 min + a random 0–30 min offset), `gpupdate`, logoff. Above it, a GPO "Workstation Settings" with three settings an admin changes at t = 0: a registry policy (screen saver timeout), Folder Redirection (Documents → `\\hq-fs01\home$`), and a computer-assigned MSI. Each setting has a lamp: changed in GPO / applied on PC07. A K4 table lists the client-side extensions run at each event and whether they ran.
- **State:** `{ t (min), seed, nextRefresh, fastLogon: bool, pending: { syncNext: bool }, applied: { setting: version }, events: [] }`.
- **One step:** jump to the next event on the axis (refresh, logon, reboot, `gpupdate`), run its processing pass, update the lamps.
- **Rules (Microsoft: "Group Policy processing" / "Group Policy refresh interval for computers"; "Understand the effect of fast logon optimization on Group Policy"):**
  1. Computer policy applies at startup, user policy at logon (foreground passes); then background refresh for both every 90 minutes with a random offset of 0–30 minutes; on DCs every 5 minutes.
  2. Background refresh runs registry-based (Administrative Templates), security and most other extensions; Folder Redirection and Software Installation run only in a foreground pass (check: drive-map preferences run in background).
  3. Fast logon optimisation (default on clients): foreground passes are asynchronous — logon doesn't wait for the network, so a foreground-only change found during a pass is applied at the next startup/logon, which the client then makes synchronous. Folder Redirection or a computer-assigned MSI can need two logons/reboots.
  4. "Always wait for the network at computer startup and logon" makes foreground passes synchronous: one reboot/logon suffices.
  5. `gpupdate` runs a background pass now; for foreground-only changes it asks to log off or restart. `gpupdate /force` reapplies all settings even if unchanged.
  6. Unchanged GPOs are skipped by most extensions; Security settings are reapplied every 16 hours anyway (check).
  7. Tie-break: if a refresh and a logon fall in the same minute, the logon (foreground) runs first and the refresh timer restarts.
- **Params:** `seed` range 1–9 default 3 (the random offset; seed 3 → 17 min (check: derived from the kit's seeded random)); `fastLogon` toggle default on; `change` choice {screen saver, folder redirection, assigned MSI} default screen saver.
- **Presets (5):**
  - `background` — screen saver changed at t=0 on a PC that booted at t=−10: next refresh at 80 + 17 = t=97 (derived) → applied at 97, no logon needed. 2 steps. Derived, unchecked.
  - `gpupdate` — same change, `gpupdate` at t=5 → applied at 5. 2 steps.
  - `folder-redirection` — refresh at 97 sees it but skips (foreground only); logoff/logon at t=120 (async, flags sync) → not yet; logon at t=200 (sync) → applied. 4 steps.
  - `msi-two-reboots` — computer-assigned MSI with fast logon: reboot 1 detects, reboot 2 installs (check). With `fastLogon` off: one reboot. 4 steps.
  - `dc` — the same GPO on a DC: refresh at most 5 minutes later. 2 steps.
- **Steps:** max 4.
- **Legend:** foreground pass (tall bar), background refresh (short bar), skipped extension (hollow), applied (filled), random offset (bracket); "changed" highlight marks lamps that turned on this step.
- **Captions:** hr: "Osvježavanje u pozadini (*background refresh*) svakih 90 min + 17 min slučajnog pomaka: postavka je primijenjena u t = 97 min." en: "Background refresh every 90 min + a 17 min random offset: the setting is applied at t = 97 min."
  hr: "Preusmjeravanje mapa radi samo pri prijavi, a uz brzu prijavu tek pri drugoj." en: "Folder Redirection runs only at logon, and with fast logon only at the second one."
- **Terms (check):** background refresh — osvježavanje u pozadini; foreground processing — obrada u prvom planu; client-side extension — proširenje na klijentu; fast logon optimization — optimizacija brze prijave; refresh interval — interval osvježavanja; folder redirection — preusmjeravanje mapa.
- **Misconceptions:** a GPO change applies immediately; `gpupdate /force` applies everything without logoff; every refresh reapplies all settings.
- **Out of scope:** precedence (`win-gpo-precedence`), slow links (`win-gpo-slow-link`), loopback, preference tattooing.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-gpo-processing` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-gpo-processing sims/win-gpo-processing` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-gpo-processing/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
