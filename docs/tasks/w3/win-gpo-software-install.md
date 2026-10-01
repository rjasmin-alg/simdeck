# win-gpo-software-install: Software installation

| | |
|---|---|
| Task | `win-gpo-software-install` (wave 3, Group Policy) |
| Catalogue entry | `win-gpo-software-install` in `docs/catalogue.md` §4.5.2 |
| Kind | build a new simulator |
| Folder | `sims/win-gpo-software-install/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `group-policy` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-gpo-processing` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **assigned vs published, computer vs user, why it needs a reboot or a logon**.

The student: deploy an MSI each way.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.2.
5. `sims/win-gpo-processing/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "Group Policy software installation overview"; "Use Group Policy to remotely install software" (check titles)

## Model and presets

- **Scene:** a GPO "Deploy Viewer" with one MSI package on `\\hq-fs01\pkg$\viewer.msi`, four deployment cards (assign to computer, assign to user, assign to user + install at logon, publish to user) and the share's permissions. A timeline per target (PC07 boots, ana logs on, ana opens a `.vwr` file, ana opens "Get programs"). The result: installed / advertised (shortcut only) / offered / failed (reason).
- **State:** `{ deployment, shareReadable: { computers: bool, users: bool }, fastLogon, events: [], pc: { installed }, user: { advertised, installed }, removeOnScope: bool, inScope: bool }`.
- **One step:** one event on the timeline and what the Software Installation extension does in it.
- **Rules (Microsoft: "Group Policy software installation overview"; "Use Group Policy to remotely install software" (check titles)):**
  1. Only Windows Installer packages (MSI, optionally with transforms) are deployed; the path must be a UNC share.
  2. Assign to computer: installs at the next startup, as SYSTEM using the computer account — so the share must be readable by the computers (e.g. Domain Computers); with fast logon optimisation it may need a second reboot (`win-gpo-processing` rule 3).
  3. Assign to user: at logon the application is advertised (Start menu shortcut, file association); it installs on first use; with "Install this application at logon" it installs fully at logon.
  4. Publish to user: nothing appears until the user installs it from "Get programs" (or opens an associated file, if auto-install is on) (check). Publishing to computers is not possible.
  5. Software Installation runs only in a foreground pass (startup or logon), never in a background refresh, and is skipped over a slow link by default (`win-gpo-slow-link`).
  6. "Uninstall this application when it falls out of the scope of management": moving the computer/user out of scope removes it at the next foreground pass; without it, the application stays.
  7. Tie-break: computer and user assignment of the same package → the computer install wins, the user one finds it installed (check).
- **Params:** `deployment` choice {computer, user, user-at-logon, publish} default computer; `computersCanRead` toggle default on; `fastLogon` toggle default on; `removeOnScope` toggle default off.
- **Presets (5):**
  - `assign-computer` — boot 1 (async) detects, boot 2 installs; with fast logon off: boot 1 installs. 3 steps. Derived, unchecked.
  - `assign-user` — logon → shortcut appears; first launch → installs. 3 steps.
  - `publish-user` — logon → nothing; ana opens "Get programs" → installs. 3 steps.
  - `share-perms` — computer assignment with a share only users can read → install fails at startup (access denied event). 3 steps.
  - `out-of-scope` — PC07 moved out of the OU with the uninstall option → removed at the next boot; without it, stays. 4 steps.
- **Steps:** max 4.
- **Legend:** package (box), assigned (pin), published (shop-window icon), advertised (dashed shortcut), installed (solid), failed (✕ with reason); "changed" highlight marks the target whose state changed.
- **Captions:** hr: "Dodijeljeno računalu (*assigned*): instalacija pri pokretanju, pod računom računala — zato računala moraju moći čitati dijeljenu mapu." en: "Assigned to the computer: it installs at startup under the computer account — so computers must be able to read the share."
  hr: "Objavljeno korisniku (*published*): ništa se ne pojavljuje dok ga `ana` sama ne instalira." en: "Published to the user: nothing appears until `ana` installs it herself."
- **Terms (check):** software installation — instalacija softvera; assign — dodijeliti; publish — objaviti; advertise — oglasiti (prečac bez instalacije); package — paket; foreground processing — obrada u prvom planu; share — dijeljena mapa.
- **Misconceptions:** `gpupdate` installs the package; publish works for computers; the user's rights matter for a computer install.
- **Out of scope:** non-MSI installers, upgrades and supersedence, packaging, other deployment systems.
- **Builds on `win-gpo-processing`:** reuses its foreground/background timeline and fast-logon rule; new are the four deployment modes.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-gpo-software-install` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-gpo-software-install sims/win-gpo-software-install` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-gpo-software-install/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
