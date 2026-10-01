# licence: AGPL-3.0-or-later for simdeck

| | |
|---|---|
| Task | `licence` (wave 0) |
| Owner | coordinator |
| Size | S |
| Depends on | main at cd893d4 |
| Licence | AGPL-3.0-or-later |

## Goal

Owner decision (2026-10-01): simdeck is **AGPL-3.0-or-later**, to keep it open as long as possible.

## Do

- `LICENSE`: the full AGPL-3.0 text (from the FSF, `https://www.gnu.org/licenses/agpl-3.0.txt`).
- `package.json` `"license": "AGPL-3.0-or-later"`.
- SPDX headers in `kit/`, `site/`, `lib/`, `scripts/`, `admin/` and the template.
- **Source link** (AGPL §13: users of a served page must be offered the source): the kit help overlay or
  header, the home page footer and course pages show "Izvorni kod / Source code" and the licence name, pointing
  to the source. While the site is behind basic auth, publish a source archive next to it
  (`/simdeck/source.tar.gz`, built by the deploy script from the same `main` commit), or link a public repo
  once there is one.
- `kit/fonts/OFL.txt` stays; the home page credits third-party licences (fonts, vendored libraries, CC BY
  material) on a small "Licences" page generated from the sims' `NOTES.md` or `sim.json`.
- The proposal, design notes, playbook and README already say AGPL-3.0-or-later (thread t-0002); rebuild
  `docs/proposal-simdeck.pdf` with the project-proposal skill's `build.sh` so the PDF matches.

## Done when

`LICENSE` exists, every page and the index link the source and licence, and the deploy publishes the source
archive.
