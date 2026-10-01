# dfa-game: DFA classroom game (hr)

| | |
|---|---|
| Task | `dfa-game` (wave 1, single-page-labs) |
| Catalogue entry | `spl-dfa-game` in `docs/catalogue.md` §2.1 |
| Kind | adopt an existing simulator |
| Folder | `sims/dfa-game/` |
| Class | decide on import (playbook §10.4) |
| Size | S |
| Priority | P3 |
| Courses | see catalogue |
| Topic / tags / level | `theory` / `automata` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

Bring the existing simulator into simdeck as `sims/dfa-game/`: **presenter/player rounds building a DFA**.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §2.1.

## Sources

- `/home/rjasmin/projects/single-page-labs/dfa-classroom-game.html` (the original)

## Steps

1. Copy the page: `cp /home/rjasmin/projects/single-page-labs/dfa-classroom-game.html sims/dfa-game/index.html`. Set `origin` to `single-page-labs/dfa-classroom-game.html`.
2. Classify it as `the right class` and write `sims/dfa-game/sim.json` (all required fields, `status: "wip"`).
3. Adapt it to the kit (`docs/sim-ui.md`): kit tokens instead of the page's own palette, the kit header with
   back link and legend, the kit transport for its class, kit fonts instead of Google Fonts. Keep the page's
   model and wording; where it is a stepper, move the step logic into a DOM-free `sim.js` with `sim.test.js`.
4. Make it bilingual (COMMON.md §4). Today it is in Croatian; write the other language.
5. Remove every network load (fonts, CDN scripts): vendor or drop them. The build refuses network loads.
6. Record exceptions in the page's `#simdeck-exceptions` block instead of working around a rule silently.
7. Run the checks (COMMON.md §7) and look at the screenshots.

## Known state and issues

- State: polished; multi-device sync unverified
- Licence and assets: own; no deps

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dfa-game/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
