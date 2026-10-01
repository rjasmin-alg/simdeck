# os-map: OS map (index)

| | |
|---|---|
| Task | `os-map` (wave 1, ossimulator) |
| Catalogue entry | `ossim-map` in `docs/catalogue.md` §2.3 |
| Kind | adopt an existing simulator |
| Folder | `sims/os-map/` |
| Class | decide on import (playbook §10.4) |
| Size | S |
| Priority | P2 |
| Courses | OS |
| Topic / tags / level | `os` / `operating-systems` / `core` |
| Languages | Croatian now; English comes from ossimulator's source (task `ossimulator-english`) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; none beyond wave 0 |

## Goal

Bring the existing simulator into simdeck as `sims/os-map/`: **layered OS overview**.

Notes from the catalogue: ?m=<id> focuses a module.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §2.3.

## Sources

- `/home/rjasmin/projects/ossimulator/dist-single/index.html (built from /home/rjasmin/projects/ossimulator/src/modules/map/)` (the original)

## Steps

1. Copy the built single file `/home/rjasmin/projects/ossimulator/dist-single/index.html` to `sims/os-map/index.html`
   (rebuild it first with `npm run verify` in `/home/rjasmin/projects/ossimulator` if `src/` is newer than `dist-single/`).
   Set `origin` to `ossimulator/index`.
2. Do not adapt it to the kit: it has its own shared runtime and a full test suite. Add `data-sim="os-map"` to
   its `<html>`, a `#simdeck-meta` placeholder and a `#simdeck-exceptions` block declaring `kit`, `text-size`
   (ossimulator's floor is 14 px), `one-screen` (its six-section layout scrolls) and `languages` (until it has
   English). These are the only edits to the built file.
3. Write `sim.json`: title, concept and summary from the page's `meta.ts`
   (`/home/rjasmin/projects/ossimulator/src/modules/index/meta.ts`), class `explorer`, topic `os`.
4. List the scenario deep links that index entries should use: ?m=<id> focuses a module. Each opens paused with
   `?scenario=<id>` (put them in `NOTES.md`; the frame does not have per-preset entries yet: see the
   foundation task about presets in the index).
5. **English** cannot be added to a built bundle. It belongs in ossimulator's source (foundation task
   `ossimulator-english`); this task only imports the Croatian build.
6. Check that the single file runs from `file://` with the network blocked (ossimulator's own e2e does this).

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/os-map/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
