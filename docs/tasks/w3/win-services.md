# win-services: Services and dependencies

| | |
|---|---|
| Task | `win-services` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-services` in `docs/catalogue.md` §4.5.7 |
| Kind | **add a preset to `sims/lnx-systemd-ordering/`** (no page of its own) |
| Folder | `sims/lnx-systemd-ordering/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `services` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `lnx-systemd-ordering` merged; only one preset task per host folder at a time |

## Goal

One concept: **start types, dependencies, delayed start, recovery actions**.

The student: configure services, boot, fail one.

This is a **preset on `lnx-systemd-ordering`** (systemd dependencies and ordering), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/lnx-systemd-ordering/` (the host page) and its `NOTES.md`.

## Sources

- No Windows course book yet. Use Microsoft documentation (titles below) and mark every number and rule you could not check with *(check)* in `NOTES.md`.
- Catalogue seed: → §5.15
- Microsoft Learn: "Service start types" / "sc.exe config", "sc.exe failure", Win32 "Service Control Manager" and "Service startup"; "System error codes" (1058, 1068) *(check titles)*.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/10-podizanje-i-systemd.md`, „Jedinice: čime `systemd` upravlja" and „Vođenje usluga i pisanje vlastite jedinice" (the host's systemd rules; terms *usluga*, *ovisnost*, *jedinica*).
- Host spec: `docs/tasks/w2/lnx-systemd-ordering.md`, Model and presets (Out of scope line on `win-services`).

## Overlaps (catalogue §5)

- **§5.15 Boot and service ordering:** One boot-chain page with Linux and Windows presets. One dependency-graph page with systemd and Windows-services presets.

## Model and presets

- **Preset task on `lnx-systemd-ordering`.** Same graph and start timeline; units come from the preset, so this
  task adds Windows services with start types. Units: `LanmanServer` (Server), `LanmanWorkstation`
  (Workstation), `AppSvc` (the lecturer's service, Automatic), `DbSvc` (its database), `Spooler`.
- **Windows rules the preset needs:**
  1. Start types: Automatic (started by the Service Control Manager at boot), Automatic (Delayed Start) (started
     after the automatic ones, about 2 minutes later *(check)*), Manual (started on demand, by a user, a program or
     a dependent service), Disabled (cannot be started) (Microsoft "Service start types" / `sc config start=`;
     registry `Start` 2 = auto, 3 = manual, 4 = disabled).
  2. Dependencies (`DependOnService`) are requirement and ordering in one: the SCM starts the services a service
     depends on first, even if they are Manual (Win32 "Service Control Manager", "Service startup" *(check)*).
  3. A dependency that is Disabled or fails → the dependent does not start (error 1068 "The dependency service or
     group failed to start"); a Disabled service started directly gives error 1058 *(check codes)*.
  4. Stopping a service asks to stop its dependents first (derived; `net stop` behaviour *(check)*).
  5. Recovery actions per failure: first, second, subsequent failure → Take no action / Restart the service /
     Run a program / Restart the computer; "Reset fail count after N days"; "Restart service after N minutes"
     (Services console, Recovery tab; `sc failure`).
  Tie-break: services in the same slot are drawn in name order (host rule 6).
- **What the host model must support:** a relation `dependsOn` counting as both `requires` and `after` (the host
  already anticipates this); per-unit `startType` replacing `enabled` (Automatic ≈ enabled, Manual ≈ pulled only by
  a dependent, Disabled ≈ masked); a delayed-start slot after all automatic units; for rule 5 a failure counter and
  restart action per unit.
- **Presets (added to the host):**
  - `win-manual-dep` `AppSvc` (Automatic) depends on `DbSvc` (Manual): the SCM starts `DbSvc` first, then `AppSvc`.
    Derived from rule 2.
  - `win-disabled-dep` `DbSvc` Disabled: `AppSvc` fails with 1068 *(check)*. Derived from rule 3.
  - `win-delayed` `AppSvc` Automatic (Delayed Start): starts in the last slot after all automatic services.
    Derived from rule 1.
  - `win-recovery` `DbSvc` crashes: first failure → restart after 1 min, second → restart, subsequent → no action;
    third crash leaves `AppSvc` dependent stopped. Derived from rule 5, unchecked.
  - `contrast` the same graph as the host's `requires-no-after`: on Windows there is no "requirement without
    ordering", so `AppSvc` waits for `DbSvc`. Derived.
- **Steps:** explorer (host); the boot replay is 3–4 slots; `win-recovery` needs the failure counter as extra
  replay slots (3 failures).
- **Legend:** as the host, plus start-type badges (A, A-delayed, M, D) as shapes; changed: services whose result
  changed with the last param change.
- **Captions:** hr: "`DbSvc` je ručna usluga, ali ovisi o njoj automatska `AppSvc`: upravitelj usluga je pokreće
  prvu." / en: "`DbSvc` is a manual service, but the automatic `AppSvc` depends on it: the service manager starts it
  first." — hr: "Na Windowsima ovisnost znači i redoslijed: nema `Requires=` bez `After=`." / en: "On Windows a
  dependency also means order: there is no `Requires=` without `After=`."
- **Terms:** service — usluga (UL ch10); dependency — ovisnost (UL ch10); start type — način pokretanja *(check)*;
  delayed start — odgođeno pokretanje; recovery action — radnja oporavka *(check)*; Service Control Manager —
  upravitelj usluga *(check)*; disabled — onemogućeno.
- **Misconceptions:** Manual means "never starts by itself"; a dependency only orders, it does not start the other
  service; Disabled and Manual differ only at boot.
- **Out of scope:** trigger-start services, service accounts and privileges, svchost grouping, load order groups,
  systemd `Restart=` (one line of comparison).
- **Note for the coordinator:** this entry is two concepts for the host (dependencies/start types, and recovery
  actions over repeated failures). Recovery needs a failure counter over time that the host explorer does not
  have; either drop `win-recovery` or ask the host for a "fail N times" replay.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-systemd-ordering/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
