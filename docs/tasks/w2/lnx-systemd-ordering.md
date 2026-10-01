# lnx-systemd-ordering: systemd dependencies and ordering

| | |
|---|---|
| Task | `lnx-systemd-ordering` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-systemd-ordering` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-systemd-ordering/` |
| Class | explorer |
| Size | M |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `services` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **Wants/Requires vs After/Before; a failed dependency**.

The student: edit unit relations, boot, see the order and failures.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/10-podizanje-i-systemd.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-10/`
- Catalogue seed: UL ch10 → §5.15
- UL ch10, section "Jedinice: čime `systemd` upravlja" → Što treba znati (`systemctl cat crond.service`,
  Wants= vs Requires= vs After=/Before=, `Wants=network-online.target` + `After=`, `[Install]`/`WantedBy=`)
  and Šire o temi (`list-dependencies multi-user.target`); Primjer 1 (enabled vs started)
- systemd.unit(5), sections `[Unit]` (`Wants=`, `Requires=`, `After=`/`Before=`) and `[Install]`
  (`WantedBy=`) (cited in UL ch10 as [14])
- Windows presets: `docs/tasks/w3/win-services.md` (adds a preset to this folder)

## Overlaps (catalogue §5)

- **§5.15 Boot and service ordering:** One boot-chain page with Linux and Windows presets. One dependency-graph page with systemd and Windows-services presets.

## Model and presets

- **Scene:** left, a small dependency graph: `multi-user.target`, `app.service` (the unit the student
  edits), `db.service`, `network-online.target`. Two edge kinds drawn differently: requirement (Wants= thin
  dashed, Requires= thick solid, both labelled) and ordering (After= arrow with a clock glyph). Right, a
  start timeline (lanes per unit, time slots left to right) and the final state per unit (active / failed /
  dependency failed / not in transaction).
- **Data-driven units and relations** (needed for §5.15): units and edges come from the preset, so
  `win-services` can add Windows services with start types without new model code.
- **State (explorer, computed from params):** `{ units: [{ id, enabled, fails }], edges: [{ from, to,
  kind: 'wants'|'requires'|'after' }], txn: [ids], slots: { id: n }, result: { id: state }, cycle: bool }`.
- **What the params drive:** the edges from `app.service` and whether `db.service` fails or is enabled; the
  transaction, the timeline and the results are recomputed live. A "boot" button replays the timeline slot
  by slot (animation only, not model steps).
- **Rules:**
  1. Booting starts `default.target`; the transaction is everything reachable through Wants=/Requires=
     (and `.wants/` links from enabled units' `WantedBy=`) (UL ch10 "Jedinice…"; systemd.unit(5)).
  2. Wants= pulls the unit in; if it fails or can't be added, the wanting unit still starts (UL ch10,
     systemd.unit(5) `Wants=`).
  3. Requires= pulls the unit in; if it fails **and** After= on it is set, the requiring unit is not started
     ("dependency failed"); without After= both start at once and the requiring unit runs even though the
     required one failed (systemd.unit(5) `Requires=`) (check wording).
  4. Requirements say nothing about order; order comes only from After=/Before= (UL ch10; systemd.unit(5)).
  5. After=/Before= pull nothing in: if the other unit is not in the transaction, the ordering is ignored
     and the unit starts without it (UL ch10: "ako druga jedinica nije uključena, njegova će raditi bez nje").
  6. Units with no ordering between them start in the same slot (in parallel); a unit's slot = 1 + max slot
     of the units it is After= (and which are in the transaction). Tie-break inside a slot: draw in id order.
  7. A unit ordered After= a failed unit still starts after it has finished failing, unless rule 3 applies.
  8. Edge: an ordering cycle is flagged and not computed (real systemd breaks it by dropping a job —
     explanation only, (check)).
- **Params:** `appToDb` choice none / Wants / Requires, default Requires; `appAfterDb` toggle, default on;
  `appToNet` choice none / Wants, default Wants; `appAfterNet` toggle, default on; `dbFails` toggle, default
  off; `dbEnabled` toggle (is `db` pulled in by `multi-user.target` itself), default off.
- **Presets:**
  1. `network-online` — `Wants=network-online.target` + `After=network-online.target`: app in the slot after
     the network target (from UL ch10, the "two lines, not one" passage; `crond.service` After= list).
  2. `requires-no-after` — Requires=db, no After, db fails → db and app in slot 1 together; db failed, app
     active (derived from systemd.unit(5), unchecked).
  3. `requires-after` — Requires=db + After=db, db fails → app "dependency failed", never started (derived
     from systemd.unit(5)).
  4. `wants-after` — Wants=db + After=db, db fails → app starts in slot 2, active (from UL ch10 `Wants=`).
  5. `after-only` — After=db only, db not enabled → db not in transaction, app starts alone in slot 1
     (from UL ch10).
- **Steps:** explorer, no steps (the boot replay is 3–4 slots).
- **Legend:** edge styles (dashed Wants, solid Requires, arrow After); unit state badges active ● /
  failed ✗ / dependency failed ⊘ / not in transaction (grey, dotted outline); "changed" outlines units
  whose result changed with the last param change.
- **Captions:**
  - hr: "`Requires=` bez `After=`: obje jedinice kreću istodobno, pa `app` radi iako `db` nije uspio."
  - en: "`Requires=` without `After=`: both start at once, so `app` runs although `db` failed."
  - hr: "`After=` ništa ne povlači: `db` nije u transakciji, a `app` kreće bez njega."
  - en: "`After=` pulls nothing in: `db` isn't in the transaction, and `app` starts without it."
- **Terms:** unit — jedinica; target — cilj; dependency — ovisnost; ordering — redoslijed; transaction —
  transakcija; enable / start — uključiti / pokrenuti; service — usluga.
- **Misconceptions:** Requires= implies "start after"; After= makes the other unit start; a failed Wants=
  dependency stops the unit.
- **Out of scope:** BindsTo=, PartOf=, Conflicts=, Requisite=, socket activation, stop ordering (mention:
  reversed), timers. Windows services (DependOnService = requirement plus ordering in one relation) come
  from `win-services`; the host must allow one relation that counts as both `requires` and `after`.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-systemd-ordering sims/lnx-systemd-ordering` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-systemd-ordering/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
