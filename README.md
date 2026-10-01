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
npm run gate -- <id>                      # every contract rule on one sim (needs npm ci); docs/tasks/COMMON.md §7
```

- `docs/proposal-simdeck.md`: the proposal (source; the PDF next to it is built with the `project-proposal` skill's `build.sh`)
- `docs/design-notes-simdeck.md`: design decisions and open questions from the proposal review
- `docs/site-structure.md`: the site frame: layout, the `sim.json` and course formats, admin, build, how to add a sim or a course
- `docs/sim-ui.md`: the simulator UI: layout, palette and type, keys, the kit's API (`kit/`), and how to start a sim from `kit/template/`
- `docs/catalogue.md`: every simulator simdeck should contain: what to adopt, what to build, overlaps, requirements
- `docs/tasks/`: one self-contained task per simulator, in waves (`docs/tasks/README.md`), with the rules in `docs/tasks/COMMON.md`
- `docs/playbook.md`: method distilled from `ossimulator` (contract, rules as tests, waves, DoD, lessons), to adapt for simdeck

License: AGPL-3.0-or-later (owner decision, 2026-10-01; the LICENSE file comes with docs/tasks/w0/licence.md).
