# ossimulator-english: English UI for ossimulator

| | |
|---|---|
| Task | `ossimulator-english` (wave 0 (runs in parallel with waves 1–2)) |
| Owner | an ossimulator thread |
| Size | L |
| Depends on | owner approval: this changes `~/projects/ossimulator`, outside simdeck |
| Licence | AGPL-3.0-or-later |

## Goal

ossimulator's 16 pages are imported into simdeck as built single files (wave 1). They are Croatian only, and
English cannot be added to a built bundle. Add English in ossimulator's source, then re-import.

## Do (in `~/projects/ossimulator`)

- Externalise UI strings and the theory text per module into `hr`/`en` tables; add a language switch and
  `?lang=` to the shared shell (`src/shared/`), following simdeck's `bilingual` pattern so the behaviour matches.
- English terms come from `docs/POJMOVNIK.md` (it already pairs every term).
- Keep event codes and tests language-neutral (they already are, playbook §4.3).
- Rebuild `dist-single/`, run ossimulator's gate, then re-run step 1 of each simdeck `w1` ossimulator task.

## Decided (owner, 2026-10-02)

ossimulator stays the source of truth for its pages (`docs/site-structure.md` §0): simdeck holds the builds,
and this work happens in ossimulator, never in the simdeck copies.
