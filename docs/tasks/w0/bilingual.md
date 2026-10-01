# bilingual: Croatian and English in every sim, the index and course pages

| | |
|---|---|
| Task | `bilingual` (wave 0) |
| Owner | coordinator (touches kit and frame) |
| Size | M–L |
| Depends on | main at cd893d4 |
| Licence | AGPL-3.0-or-later |

## Goal

Owner decision (2026-10-01): **all simulators and the entire site support English and Croatian.** Design and
build the mechanism once, in the kit and the frame, so that every task only writes strings.

## Requirements (catalogue §7.2)

- **One page, both languages:** a single self-contained file per sim carries both string tables and switches at
  runtime (no second page per language, so the offline folder and the URLs stay simple).
- A **language switch** in the kit header (and a key, if one is free in `docs/sim-ui.md` §3), remembered across
  simdeck pages, and `?lang=hr|en` in the URL. Course pages link their sims with the course's language.
- **String tables** per sim (`STRINGS = { hr, en }`, see COMMON.md §4), looked up through one kit function;
  the kit's own strings already exist in both languages.
- **Manifest:** `title`, `concept`, `summary` and `aliases` become `{ "hr": …, "en": … }`; `lang` goes away (or
  becomes the original language, for provenance). Update `lib/manifest.mjs`, the admin forms, the build and
  `docs/site-structure.md`. Pages adopted in one language only declare a `languages` exception until translated.
- **Index and course pages** in both languages: the home page switches; a course file's `lang` picks its default.
- **Glossary component:** a shared term list (English term, Croatian term) the kit can render in the
  "first mention" style (*lease* (najam adrese)); seeded from ossimulator's `docs/POJMOVNIK.md` and the books.
- **Contract check:** a page fails if a key exists in one table and not the other, or if any visible text node
  at 1920×1080 is not from the tables (render once per language).
- **Layout:** the one-screen check runs in both languages (Croatian labels are longer).
- Update the template, `kit/new-sim.sh`, `docs/sim-ui.md` and `docs/tasks/COMMON.md` §4–§5.

## Done when

The template runs in both languages with the switch, the manifest and admin take both, the index and a course
page switch, the check fails a page with a missing string (with a test), and COMMON.md describes the final
pattern so that adoption tasks can start.
