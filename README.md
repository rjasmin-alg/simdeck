# simdeck

A library of short, colourful browser simulators for lectures, one concept each, gathered in one searchable index. Open a demo on the fly in class, or generate a one-page course list to hand to students.

Status: the site frame is built (admin, home page, course pages, build); the first simulators are next.

Two sides, from the same files (`docs/site-structure.md`):

- **Admin**, local only: `npm run admin`, then <http://127.0.0.1:5300/>. Edit simulators, topics and tags, and courses
  (with optional short addresses such as `materijali.online/linux`); preview; publish to a folder or USB stick.
- **Site**, published and read-only: a home page with one search box, one page per course, and each simulator as one
  self-contained file. Works at any path and offline from a USB stick.

```sh
npm run admin     # the editorial app
npm run check     # validate sims/*/sim.json, courses/*.json, tags.json
npm run build     # build the site into dist/
npm test          # all unit tests
kit/new-sim.sh <id> sims/<id>             # start a sim from the kit's template (the admin does the same)
npm run check:page -- sims/<id>/index.html  # browser check: fits 1920×1080, text size, keys (needs npm install)
```

- `docs/proposal-simdeck.md`: the proposal (source; the PDF next to it is built with the `project-proposal` skill's `build.sh`)
- `docs/design-notes-simdeck.md`: design decisions and open questions from the proposal review
- `docs/site-structure.md`: the site frame: layout, the `sim.json` and course formats, admin, build, how to add a sim or a course
- `docs/sim-ui.md`: the simulator UI: layout, palette and type, keys, the kit's API (`kit/`), and how to start a sim from `kit/template/`
- `docs/playbook.md`: method distilled from `ossimulator` (contract, rules as tests, waves, DoD, lessons), to adapt for simdeck

License: GPL (version to be fixed before the first public release; GPL-3.0-or-later assumed).
