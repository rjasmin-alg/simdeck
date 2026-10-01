# faultline: faultline

| | |
|---|---|
| Task | `faultline` (wave 1, larger apps) |
| Catalogue entry | `app-faultline` in `docs/catalogue.md` §2.4 |
| Kind | adopt an existing simulator |
| Folder | `sims/faultline/` |
| Class | decide on import (playbook §10.4) |
| Size | S |
| Priority | P2 |
| Courses | DR, NLA |
| Topic / tags / level | `distributed` / `fault-tolerance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

Bring the existing simulator into simdeck as `sims/faultline/`: **fault-domain tree + dependency gates, minimal cut sets**.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §2.4.

## Sources

- `~/projects/faultline, materijali.online/faultline/` (the original)

## Steps

1. Copy the app's `index.html`, `css/` and `js/` into `sims/faultline/` (keep `origin`: `faultline`).
2. The app uses ES modules that import each other. The simdeck build only inlines classic scripts and
   import-free modules (`docs/site-structure.md` §5), so bundle it once into one classic script at import
   time (write the one-off bundling command in `NOTES.md`; no new dependency without asking the coordinator).
3. Keep the app's own UI (declare `kit` and `one-screen` in `#simdeck-exceptions`); add `data-sim`, the
   `#simdeck-meta` placeholder and the kit header's back link only.
4. Expose its samples as presets in the URL: samples `threeZone`, `onePdu`, `sizeTwo`, `usEast1`, `frontDoor` (add `?sample=`; `load(key)` exists).
5. It is in English; write Croatian (COMMON.md §4) in the copy. The simdeck copy is canonical from now on.
6. Run the app's own tests (`node tests/run.mjs` where present) against the copy, then the checks
   (COMMON.md §7). faultline is a spike (phase 0b of 7); import what exists, and keep its `TODO.md` roadmap in `NOTES.md`.

## Known state and issues

- State: phase 0b of 7 (spike), 47/47 checks pass
- Licence and assets: none

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/faultline/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
