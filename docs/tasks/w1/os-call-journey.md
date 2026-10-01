# os-call-journey: Journey of one call (capstone)

| | |
|---|---|
| Task | `os-call-journey` (wave 1, ossimulator) |
| Catalogue entry | `ossim-journey` in `docs/catalogue.md` §2.3 |
| Kind | adopt an existing simulator |
| Folder | `sims/os-call-journey/` |
| Class | decide on import (playbook §10.4) |
| Size | S |
| Priority | P2 |
| Courses | OS |
| Topic / tags / level | `os` / `operating-systems`, `encapsulation` / `core` |
| Languages | Croatian now; English comes from ossimulator's source (task `ossimulator-english`) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; none beyond wave 0 |

## Goal

Bring the existing simulator into simdeck as `sims/os-call-journey/`: **read() and page fault through every layer**.

Notes from the catalogue: read-miss, page-fault.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §2.3.

## Sources

- `/home/rjasmin/projects/ossimulator/dist-single/journey.html (built from /home/rjasmin/projects/ossimulator/src/modules/journey/)` (the original)

## Steps

1. Copy the built single file `/home/rjasmin/projects/ossimulator/dist-single/journey.html` to `sims/os-call-journey/index.html`
   (rebuild it first with `npm run verify` in `/home/rjasmin/projects/ossimulator` if `src/` is newer than `dist-single/`).
   Set `origin` to `ossimulator/journey`.
2. Do not adapt it to the kit: it has its own shared runtime and a full test suite. Add `data-sim="os-call-journey"` to
   its `<html>`, a `#simdeck-meta` placeholder and a `#simdeck-exceptions` block declaring `kit`, `text-size`
   (ossimulator's floor is 14 px), `one-screen` (its six-section layout scrolls) and `languages` (until it has
   English). These are the only edits to the built file.
3. Write `sim.json`: title, concept and summary from the page's `meta.ts`
   (`/home/rjasmin/projects/ossimulator/src/modules/journey/meta.ts`), class `explorer`, topic `os`.
4. List the scenario deep links that index entries should use: read-miss, page-fault. Each opens paused with
   `?scenario=<id>` (put them in `NOTES.md`; the frame does not have per-preset entries yet: see the
   foundation task about presets in the index).
5. **English** cannot be added to a built bundle. It belongs in ossimulator's source (foundation task
   `ossimulator-english`); this task only imports the Croatian build.
6. Check that the single file runs from `file://` with the network blocked (ossimulator's own e2e does this).
7. **ossimulator is the source of truth** (owner, 2026-10-02): never fix this copy. A defect found here goes into
   ossimulator, and the build is re-imported.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/os-call-journey/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
