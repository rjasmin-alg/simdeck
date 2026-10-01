# poe-budget: PoE power budget

| | |
|---|---|
| Task | `poe-budget` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-poe-budget` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/poe-budget/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `ethernet` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **class per device vs switch budget**.

The student: add devices to a switch.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/02-gradja-mreze.md` (Uvod u računalne mreže), "Šire o temi" → "Isti kabel, i podaci i struja" (IEEE 802.3af-2003; AP and IP phone powered over the data cable). No class or budget numbers there.
- IEEE 802.3af-2003 (PoE, classes 0–3), IEEE 802.3at-2009 (PoE+, class 4), IEEE 802.3bt-2018 (types 3/4, classes 5–8) (check: every PSE/PD number)
- Vendor docs on allocation and priority, e.g. Cisco "Configuring PoE" / power management modes, HPE Aruba "PoE/PoE+ planning" (check)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** one PoE switch (48 ports drawn as two rows; budget gauge "allocated / budget W") and a device tray:
  IP phone, access point (AP), fixed camera, PTZ camera, thin client. Each placed device sits on a port with a
  label `class n · PSE W · PD W` and a state badge (powered / denied / shed / limited). Table on the right:
  per-port class, allocated W at the switch, power at the device, priority.
- **State (derived live, explorer):** `{ budget, allocMode, ports: [{ n, device|null, cls, priority, portType }],
  result: [{ n, allocated, state }], total }`. Devices are added in a fixed order; the result is recomputed
  from scratch on every param change.
- **What the params drive:** adding/removing device counts, the budget, the allocation mode and the priorities;
  the gauge and every port badge update live.
- **Rules:**
  1. Class table, power at the switch port (PSE) / guaranteed at the device (PD) (IEEE 802.3af/at/bt (check)):
     class 0: 15.4 / 13.0 W; 1: 4.0 / 3.84; 2: 7.0 / 6.49; 3: 15.4 / 13.0; 4: 30 / 25.5 (802.3at, PoE+);
     5: 45 / 40; 6: 60 / 51; 7: 75 / 62; 8: 90 / 71.3 (802.3bt). The difference is the loss in up to 100 m of
     cable.
  2. Class-based allocation (default): the switch reserves the PSE maximum of the device's class, whatever it
     actually draws (vendor docs, e.g. Cisco "PoE power management" static/auto (check)).
  3. Measured allocation (`allocMode = measured`): the switch reserves the device's actual draw (or the LLDP
     request) instead (vendor-specific (check)).
  4. Admission: devices are powered in port order; a device whose allocation would push the total above the
     budget is denied (port stays down for power, data link may still be up) (check).
  5. Priority (when `priorities` is on): a higher-priority device that does not fit sheds lowest-priority
     powered ports, highest port number first, until it fits; ties broken by higher port number shed first
     (vendor practice, e.g. HPE/Aruba, Cisco (check)).
  6. Port type cap: a device whose class exceeds the port type (af 15.4 W, at 30 W, bt type 3 60 W, bt type 4
     90 W) is powered at the port's maximum and marked "limited" (it may not work fully) (IEEE 802.3bt (check)).
  7. Edge: a budget exactly equal to the total is accepted (≤, not <).
- **Params:** `budget` range 60–740 W step 10 default 370 (a common PoE+ switch figure (check)); `allocMode`
  choice `class` | `measured` default `class`; `phones` range 0–24 default 24 (class 2, draws 3.5 W (check));
  `aps` 0–8 default 4 (class 4, draws 13 W (check)); `cams` 0–8 default 0 (class 3, draws 6 W (check)); `ptz`
  0–2 default 0 (class 6, draws 40 W (check)); `portType` choice `at` | `bt` default `at`; `priorities` toggle
  default off (APs and cameras critical, phones low).
- **Presets:**
  1. `office` — 24 phones + 4 APs on 370 W, class mode: 24 × 7.0 + 4 × 30 = 288 W allocated, 82 W left; all
     powered. Derived, unchecked.
  2. `cameras` — add 6 cameras: 288 + 5 × 15.4 = 365 W; the 6th camera needs 15.4 W with 5 W left → denied.
     Derived.
  3. `measured` — preset 2 in measured mode: 24 × 3.5 + 4 × 13 + 6 × 6 = 172 W; all powered, 198 W left; same
     devices, different arithmetic. Derived, (check) draws.
  4. `priority` — preset 2 with priorities on: the 6th camera (critical) does not fit (5 W left), so low-priority
     phones are shed from the highest port down: one phone frees 7.0 W (12 W, still short), two free 14 W →
     365 − 14 + 15.4 = 366.4 W; all 6 cameras and 22 phones powered. Derived, unchecked.
  5. `ptz` — one PTZ camera (class 6) on an `at` port: capped at 30 W and marked limited; switch `portType` to
     `bt`: 60 W allocated. Derived from rule 6 (check).
- **Steps:** none (explorer).
- **Legend:** device kinds (series colours + icon letter: T phone, A AP, K camera, P PTZ); powered (solid
  outline), denied (danger ✕), shed (hatched), limited (warn triangle). "Changed" marks ports whose state
  changed on the last param change.
- **Captions:**
  - hr: "Dodijeljeno 365 od 370 W. Šesta kamera traži 15,4 W (klasa 3), a ostalo je 5 W — priključak ostaje bez
    napajanja."
  - en: "Measured mode: the same 34 devices reserve 172 W instead of 380.4 W, because each port reserves what its
    device draws, not its class maximum."
- **Terms:** Power over Ethernet — napajanje preko Etherneta (URM ch02); power budget — proračun snage (check);
  power sourcing equipment (PSE) — izvor napajanja (check); powered device (PD) — napajani uređaj (check);
  class — klasa; priority — prioritet; access point — *access point* (URM ch02).
- **Misconceptions:** a 370 W switch can power 370 W of devices on any ports (allocation reserves class maxima);
  a device's class equals what it draws; the power at the device equals the power at the port (cable loss).
- **Out of scope:** the detection/classification signalling, pairs used (2-pair vs 4-pair), LLDP-MED
  negotiation messages, PSU redundancy, heat.
- **Note for the coordinator:** the device draws and the 370 W figure are typical, not from a source; the page
  must label them as examples.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh poe-budget sims/poe-budget` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/poe-budget/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
