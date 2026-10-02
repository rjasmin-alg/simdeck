<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# student-picker: notes

Adopted from `single-page-labs/random-student-picker.html` (task `docs/tasks/w1/student-picker.md`, catalogue
`spl-student-picker`) into the simdeck kit. The first sim of class `tool`.

## Decisions

- **Class `tool`** (catalogue: "import as `tool`"; playbook §10.4): lecturer-only, never on course pages. No steps, no
  presets. The kit's header, legend, panel, caption and reset are used; the transport is the kit's reset button.
- **The model** (`sim.js`, DOM-free) keeps the original's rules: names trimmed and inner whitespace collapsed; exact
  (case-sensitive) duplicates refused; at most 30 names; bulk split on new lines, commas and semicolons; remove; reset
  picks; clear all; draw uniformly from the names not picked yet. The page draws the random number
  (`crypto.getRandomValues`) and passes it to `pick(state, u)`, so the draw is testable; tie-break: `u` selects
  `pool[floor(u · size)]` in list order.
- **The list lives in the page, not in kit params** (it is text). It is kept in `sessionStorage`
  (`simdeck.student-picker`), so the language switch, which reloads the page, keeps the list and the picks. It never
  leaves the browser tab and is not in the URL (student names). If storage is unavailable the page simply starts empty.
- **Clicker:** `P` picks (a page key; → and PgDn are reserved for steppers and the kit gives them nothing on a tool).
  After **Uvezi listu** the text field loses focus so `P` picks at once. *(owner)* A clicker's PgDn picking would be
  handy in class; that needs a kit decision (reserved keys), not done here.
- **Roll animation** kept (14–21 ticks of 80 ms, random names, then the winner), as a toggle `roll` (default on). It
  is skipped under reduced motion (`?motion=reduce` or the OS).

## Deviations from the original

- `picked` keeps the order of the draws (the original used a Set); the chips show **✓n**, the draw number, so picked
  vs not picked is not colour alone (filled + ✓n vs dashed hollow; the last pick has the highlighter and thick outline).
- The caption reports what each action did, including names refused as duplicates or over the limit (the original
  ignored them silently).
- A name is cut at 60 characters in the bulk import too (the original limited only the single-name field).
- "Polaznici n / 30" moved from a badge to a fifth stat card; the explanation ("Ideja") is new, in both languages.
- Remove buttons are real `<button>`s with an aria-label ("Ukloni {name}"), not a clickable span.

## Sources

- `/home/rjasmin/projects/single-page-labs/random-student-picker.html` (own, no dependencies, no network loads).

## Term pairs

None needed.

## Shared requests

None. *(check)* With an empty list the gate's word checks see only the empty state; a full list (30 names, 7 picks)
was checked by hand in both languages at 1920×1080 light/dark/grayscale and 375×812 (thread library, `full/`).

## Checks

- Every model rule was broken once and a test failed each time: floor → round, the pool ignoring picks, no duplicate
  check, the 30 limit off by one, remove keeping the pick, remove keeping the result, whitespace collapse, the
  semicolon split, a new round keeping picks, the `u = 1` clamp.

## Time

2026-10-02, 20:38 → 20:48 CEST, about 10 minutes (wall clock).
