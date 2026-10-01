# presets-in-index: index and course entries that open a sim at a preset

| | |
|---|---|
| Task | `presets-in-index` (wave 0) |
| Owner | coordinator |
| Size | S |
| Depends on | `kit-follow-ups` |
| Licence | AGPL-3.0-or-later |

## Goal

The catalogue relies on opening one page at a preset: about 60 ossimulator scenario entries (`?scenario=`),
and the preset tasks of catalogue §5 (e.g. `update-rings` on `wsus-groups`, `broadcast-storm` on `stp`). The
frame has one entry per sim folder only.

## Do

- Let `sim.json` declare **entries**: `[{ "preset": "<id>", "title", "concept" }]` (both languages), each
  listed and searchable on the home page as its own line and linkable from course files as `"<sim>#<preset>"`.
- The link opens `sims/<id>/index.html?preset=<preset>` (kit) or `?scenario=<id>` (ossimulator pages: let an
  entry give the query string explicitly).
- Validation: the preset id exists in the page (the contract check can read the kit's preset list).

## Done when

A course page lists a preset entry, the link opens the sim paused at that preset, and preset tasks can add
their entry to the host's `sim.json` without touching anything else.
