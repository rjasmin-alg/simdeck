# kit-paper-columns: kit view K5: paper columns

| | |
|---|---|
| Task | `kit-paper-columns` (wave 2a) |
| Owner | coordinator (kit owner) |
| Size | M |
| Depends on | pilot `ari-column-addition` merged |
| Licence | AGPL-3.0-or-later |

## Goal

Extract the **paper columns** from the pilot sim `sims/ari-column-addition/` into the kit, so the 5 sims that need it
draw it the same way: squared-paper cells with one digit each, aligned by place, a carry or borrow row above, digits crossed out and rewritten, the current column highlighted, a result line, partial products shifted by one place, the Croatian division layout ("846 : 3 = 282" with the remainders underneath), any base from 2 to 16, and the audience switch (teacher by default, adult, child) remembered across the `ari-` pages.

## Do

- Add it to `kit/` **additively** (playbook §4: after the first real page, the kit only grows), with tests, a
  section in `docs/sim-ui.md`, and a changelog line.
- Move the pilot onto the kit version; the pilot's screenshots must not change in a way a student would notice.
- Text in HTML or SVG drawn at 1:1 (no `viewBox` scaling of labels), both languages, colour plus shape or
  pattern, reduced motion respected, fits 1920×1080 with 2–6 parties or nodes.
- Before freezing the API, check it against two consumers below with different needs (sketch them, don't
  build them).

## Consumers (from the task files)

`ari-checking`, `ari-column-multiplication`, `ari-column-subtraction`, `ari-long-division`, `ari-place-value`

## Done when

The pilot uses the kit view, the kit tests pass, `docs/sim-ui.md` documents it, and COMMON.md mentions it.
