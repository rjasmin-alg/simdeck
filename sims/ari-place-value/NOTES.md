<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-place-value: notes

New explorer (task `docs/tasks/w3/ari-place-value.md`, catalogue §4.16, wave 3). Rules and expected numbers:
`SPEC.md`.

## Decisions

- **An explorer, as the task's class says.** No steps: the student acts on a place-value chart with blocks and the
  page shows the result at once. Each column is one place (ones on the right); under it `+` and `−` add or take away
  a block, `⇐` trades *b* blocks for one block of the next place, `⇒` breaks one block into *b* of the place on the
  right. "Regroup all" regroups every place at once: a button beside the "a full place is not a digit" note (shown
  while a place is full) and the key `G` (kept out of the panel so the panel fits 1920×1080).
- **Kit view K5 is used, not drawn here.** The number is written with `Simdeck.paperColumns` (place row, one result
  row, a decimal aside when the base is not 10, `big` for the child); a full place is written as its count struck with
  `x: 'wrong'`; a digit changed by the last move has `now`. The typical-mistake card is a second, smaller paper.
  The audience switch is `Simdeck.paperColumns.audience`, so the choice is shared with the other `ari-` pages.
- **The chart is this page's** (K5 has no blocks): a CSS grid of columns, each block an HTML box whose shape says its
  place: a unit square, a rod of *b* cells, a flat of *b* × *b*, and for place 3 and up a flat with depth and its
  value written on it (1000, 8, 8192). Colour repeats the place (`--c1`…`--c4`) but is never the only carrier. Each
  column's blocks are fitted to its box by script (the number per row that gives the largest blocks, re-fitted on
  resize); every text stays ≥ 16 px.
- **Blocks follow the quantity (SPEC rule 3).** The URL holds `n` (the quantity) and `c0…c13` (blocks per place,
  hidden range params, as the pilot keeps its numbers). The counts are shown only when they are valid for the base
  and worth `n`; otherwise the page shows the digits of `n`. So the base slider and the quick buttons (2, 8, 10, 16)
  change only `base` and the same quantity is regrouped in the new base, while presets, typed numbers and the chart's
  buttons set both. After a base change the page writes the regrouped blocks back into `c0…c13`, so the URL's counts
  always belong to the current base (without that, base 10 → 8 → 10 brought the loose ones back). This is the reading of "switch the base and watch the digits change while the blocks stay": the
  quantity (the pile of units, `n`, said in the caption and the other-bases card) stays; its grouping and digits
  change. Loose units are the one case where the blocks literally stay (12 loose ones in base 10 → base 11).
- **Limits:** at most 9999 (four decimal places, the "T" column of grades 3–4; 14 places in base 2), at most 2b − 1
  blocks in a column (one full group plus a digit: enough to make and see a regrouping), and only the places whose
  one block is ≤ 9999. Refused moves keep focus (`aria-disabled`), say why in the button's tooltip and, on click,
  once in the caption.
- **Columns shown:** the places in use plus one free place on the left, at least four (J D S T in base 10).
- **Audiences:** teacher (default; the expansion in the caption, the other-bases card, the typical mistake), adult
  (each move says why the number does not change), child (base 10 only: the base control hides and switching to the
  child view sets base 10 with the same quantity; bigger digits; school words "3 stotice, 4 desetice i 7 jedinica";
  no worth line, no decimal aside, no other-bases card).
- **Typical mistakes** (teacher): a full place written as it is ("2 tens 13 ones" → 213), a zero left out
  (307 → 37), a numeral in another base read as decimal (1101₂ → 1101). The card says when the current number does not
  show the mistake and which preset does; when the mistake happens to give the right numeral (only the highest place
  full; a one-digit numeral) it says so and why.
- **Place row:** in base 10 the school letters J, D, S, T (English O, T, H, Th) with the value under them; other
  bases b^k with its decimal value. Same letters as `ari-column-addition`.
- **Presets:** six, keys 1–6 (SPEC.md). `sim.json` `entries` lists `zero-place` and `base-2`.
- **No glossary terms:** as in `ari-column-addition`, the Croatian school words are used directly; `glossary.js` is
  not linked.
- **Not linked:** `arh-twos-complement` does not exist yet, so `related` is empty.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The task's "ten ones regroup into one ten" is a move the student makes (⇐), not an automatic step; the reverse move
  (⇒, break one ten into ten ones) is added because borrowing in `ari-column-subtraction` is that move.
- "Regroup all" is not in the panel (it was over its height with a button there): it sits beside the full-place note
  and on `G`.
- The child view hides the presets in other bases (4–6); their keys still load the quantity, in base 10.

## Sources

- Croatian school words and layout: jedinice, desetice, stotice, tisućice and the letters J, D, S, T as in
  `ari-column-addition` (from a grade-3 worksheet heading found there). "Tablica mjesnih vrijednosti" for the
  place-value chart and "rastaviti" for breaking a block up *(check)*: not confirmed in a textbook; the textbooks and
  the national curriculum (NN 7/2019) were not read in this session.
- The arithmetic (positional notation, b^k, regrouping) is standard; every number was computed by a small Python script
  before the model was written (presets, the four bases of 347, 33, 307, 13, 8, 255, 9999, places per base) and is
  asserted in `sim.test.js`.

## Checks

- Tests: 27 (`node --test sims/ari-place-value/sim.test.js`), tie-breaks first. Mutation run: 32 mutations of
  `sim.js`, one rule each (stale counts kept, worth check off, cap 2b, columns shown, the refusal order and
  boundaries of add, regroup and break, the quantity changed by a trade, a count of b not full, the empty numeral,
  the squash order, each mistake's applicability, the current base not listed first, the parse limits, the
  expansion's top, base clamping, regroup all, `digitsOf(0)`, the regroup refusal order, the column cap of base 16,
  squash counts written in decimal). All are caught except `placesFor` with `<` instead of `≤`, an
  equivalent mutant: no b^k equals 9999 for b = 2…16.
- `npm run gate -- ari-place-value`: pass (48/48 browser checks). Screenshots reviewed at 1920×1080 (light, dark,
  grayscale) and 375×812 in both languages, plus the presets in base 2, 8 and 16, the child and adult views, refused
  moves, base 2 with 9999 (14 columns) and base 3; minimum text 16 px in each, no sideways page scroll on the phone
  (the chart and the paper scroll inside their boxes).

## Fresh review

A separate reviewer read the folder against SPEC.md, ran its own 62 mutations and probed the page with odd URLs and
every button. Fixed from its findings: the base-change caption lost its base (one node used for two `{b}`); base
10 → 8 → 10 brought back the un-regrouped blocks (now written back, SPEC rule 3 reworded); the refusal for ⇒ when the
column on the right is too full named the wrong count (own string `rFullRight`); the mistake card wrote a full
place's count in decimal instead of the base (and the paper now writes it in the base too); the "read as decimal"
card always said "not 1000, 100, 10, 1" and its place row overlapped on long numerals (now the last four places of
both, and no place row above six places); Croatian plurals of *kockica* and *jedinica* (2–4) and the accusative after
*za* and *rastavi* ("za 1 deseticu", "Rastavi 1 deseticu"); the presets in other bases offered in the child view;
explanatory text in the cards under 20 px; a caption repeating a single term ("8 · 1 = 8 = 8"); an unreachable
`place` refusal in regroup removed; Regroup all reachable by touch; tests added for every surviving mutation it
listed (boundaries, refusal order, base 16 cap, mistakes in other bases, `initial`, the presets' mistakes).
Kept as they are: `?base=` (empty) loads base 2 (the kit reads it as 0 and clamps), hand-written links that leave out
some `c` keys merge with the default counts and fall back to the digits of `n`, `?c0=99` is clamped to 31.

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| place value | mjesna vrijednost |
| place-value chart | tablica mjesnih vrijednosti *(check)* |
| digit | znamenka |
| base | baza |
| regroup, trade | pregrupirati, zamijeniti |
| break up | rastaviti *(check)* |
| ones, tens, hundreds, thousands | jedinice, desetice, stotice, tisućice |

## Shared requests (kit view K5, `kit-paper-columns`)

- A block view (base-ten blocks in any base: unit, rod, flat, cube, placed per column) would let `ari-` pages that
  show regrouping draw the same blocks; here it is page code (`blockNode`, `fitBlocks`). Not needed by K5 itself.
- Still open from the pilot: the base control (range plus quick buttons) is page code here too (`buildQuick`).
- Still open from the pilot: a text param type in the kit would replace the hidden `range` params (`n`, `c0`…`c13`).

## Time

Started 23:44 (2026-11-12), first gate pass 23:58, review fixes and done 00:17 (2026-11-13): about 35 minutes, one
session.
