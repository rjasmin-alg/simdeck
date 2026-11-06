<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-tco: notes

New explorer (task `docs/tasks/w3/fin-tco.md`, catalogue `fin-tco` §4.12). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** price vs lifetime cost. One table, eight cost lines × two options. Each cell is a bar
  of what the line adds **over the horizon**, on one scale for the whole table, so the purchase bar sits next to the
  running costs multiplied by the years; the cell also writes the line's own amount (€ a year, hours a year) and the
  sum over the horizon. Under the lines: each option's total as a stacked bar (purchase, other one-offs, running),
  its rank (★) and the purchase's share; then the ranking **on the quote** (purchase price alone) and a strip of the
  cheaper option for every horizon 1–7, where the flip shows. The strip's chips set the horizon.
- **"Build two options line by line"** is done on the stage: drag a bar, or focus it and use the arrow keys (Shift ×10,
  Home 0, End the line's maximum). The amounts are hidden range params (as `fin-npv-discounting` does with its
  flows), so they stay in the URL and the kit clamps them; the model clamps them again (`normalise`).
- **Switches** are on the stage too, one per line at the start of its row, and count the line for **both** options
  (comparing A with power against B without would not be like with like). Hidden toggle params. A panel button
  "Switch every line on" (key `A`) brings them all back.
- **Eight lines, three kinds:** once at the start (purchase, set-up and migration, training), every year (power and
  cooling, space, support/licences/fees, staff time), once at the end (exit). The task's "migration" is the
  migration in (with set-up); migrating out is part of the exit.
- **Staff time in hours a year at a fixed 50 €/h** (loaded cost). IT managers count staff time in hours; the rate is
  written in the line's name. A rate param would duplicate the line's switch ("what if staff time were free" is the
  switch, preset 5) and cost a panel slot.
- **Build vs buy** is the same sum with staff time as a cost: building in house buys little (a 4 000 € server) but
  takes 500 staff hours a year; the ready-made service has set-up, training, a subscription and a costly exit.
  Preset 5 switches staff time off and building looks ten times cheaper.
- **The horizon** runs 1–7 years (default 5, the catalogue's "five years"). No refresh inside it: past the
  equipment's life a real comparison would buy again (`fin-refresh-cycle`); 7 keeps that out of sight.
- **Linear totals** (once + H × yearly), so the ranking changes at most once; the caption names up to which horizon
  one option is cheaper and from which the other is, and a tie inside the strip is skipped (`upTo` is the last strict
  win, `from` the first of the other).
- **Ties** rank neither: "equal" badges on both, `capTie`, no flip, a dashed `=` chip in the strip.
- **The quote** ranks by the purchase price even when the purchase line is switched off: it is what the offers show,
  and preset 3 ("the quote alone") makes the total equal to it.
- **Option names** come from a hidden `pair` param set by the presets (servers, build, exit), so hand edits keep the
  names while the active preset is deselected.
- **The sums in their own file** (`tco.js`): `lineOver`, `total`, `parts`, `cheaper`, `share`, `strip`, `crossing`;
  pure, no words, registers on `globalThis.SimdeckModels.tco` (catalogue §4.12 finance notes: keep the model in a
  module, promotable). No other `fin-` model was needed: nothing here discounts or books.
- **Changed mark:** the totals row is highlighted when a param change changes the winner (A, B or tie), as the other
  `fin-` pages mark their flips. Loading a link with a preset plus overrides can show it once on load.
- **Grayscale:** the three kinds differ by pattern (solid, diagonal hatching, horizontal stripes); a switched-off line
  is a dashed hollow bar with its name and sum struck through; the winner carries ★ and the word.
- **Phone:** two columns (A, B); each line's switch and name take their own row above its two bars.
- **"Illustrative" note:** once, in the stage footer, with "nominal euros, not discounted".
- **Concepts, not tools:** no product, vendor or tax rule on the page. "Colocation" is named in the explanation as a
  kind of space, not a provider.
- **No glossary terms:** none of these terms are in `kit/glossary.js`, so the strings write the pairs out and the page
  does not link `glossary.js` (as the other `fin-` pages).

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The catalogue's Croatian title "Ukupni trošak vlasništva (TCO)" is used as is.
- No discounting (the task does not ask for it; the explanation points to net present value).

## Sources

- Total cost of ownership as the sum of acquisition, operating and end-of-life costs over the period of use: standard
  in IT management and procurement texts (life-cycle costing). The split into one-off, running and exit costs is the
  usual one *(check: no single standard defines the line list; the eight lines are the catalogue entry's)*.
- Opportunity cost of own staff time in build-vs-buy decisions: standard managerial-accounting treatment (relevant
  costs; an internal hour is valued at its loaded cost).
- DR handbook price list (`~/projects/dr-lecture-estate/student/handbook/constraints.md`): colocation "extra 2 kW
  EUR 310 / month" (about 155 € per kW-month, the order of magnitude for the power and space lines), MSP onboarding
  EUR 7,600 (the order of magnitude for the service's set-up, 7 500 €), a 1U server EUR 3,900 (the build preset's
  4 000 € server), cloud egress EUR 0.08 / GiB (the exit of the service preset: some 50 TiB out is about 4 000 €, plus
  the migration work, 9 000 €). Student material, no answer keys used.
- Numbers: made up but plausible, checked by the script at the end of `SPEC.md` and by the preset test.

## Unchecked *(check)*

- The loaded staff rate of 50 €/h (order of magnitude for an IT staff hour with contributions and overhead).
- The line list as "the" TCO categories (there is no single standard list).
- The Croatian terms below, in particular "tekući trošak", "uvođenje i migracija", "izlazak" for exit costs, and
  "kolokacija".

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| total cost of ownership (TCO) | ukupni trošak vlasništva |
| purchase price | nabavna cijena |
| one-off cost | jednokratni trošak |
| running (yearly) cost | tekući (godišnji) trošak |
| set-up and migration | uvođenje i migracija |
| exit cost | trošak izlaska |
| staff time | vrijeme djelatnika |
| loaded cost (of an hour) | puni trošak (sata rada) |
| horizon (of a comparison) | razdoblje usporedbe |
| build or buy | razviti ili kupiti |
| quote | ponuda |
| colocation | kolokacija (unajmljeni ormar u podatkovnom centru) |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs": none of the four notes applies to `fin-tco` (they
are about depreciation rates, lease accounting, currency and the fiscal year). Nothing to copy.

## Shared requests

- **Promote `tco.js` to `models/tco.js`** if a later page sums costs over a horizon (`fin-fixed-variable`'s
  in-house platform vs per-user service, `fin-refresh-cycle`'s yearly costs). It moves unchanged; its tests are the
  "rule 1–8" tests in `sim.test.js` that call `T.` directly.
- **Glossary:** add the term pairs above.
- **Learn tree:** suggested place: area `money`, subject `real-cost` "Koliko stvarno košta / What it really costs",
  leaf `tco` with `fin-tco` and `fin-tco#build-vs-buy` (catalogue §4.12's suggested placement).

## Review

A fresh reviewer (separate agent, no shared context beyond the files) read the code against `SPEC.md`, ran the SPEC
script (every number matches) and tried 57 rule-breaking mutations of `tco.js` and `sim.js`: 46 were caught, 11
survived. Five of the survivors behave exactly like the original (e.g. the share by `Math.round`, exact for whole
euros). Six were real gaps, now each covered by a test that was seen to fail with the mutation back in: a tie at the
chosen horizon losing its horizon note, the horizon rounded down, the kind groups counting switched-off lines,
`parts` and `total` with a switch off or missing, and `Infinity` from a URL. The reviewer also fixed the SPEC's
misconception line (preset 3 does not flip), and the wording: the build preset's hint (A buys a 4 000 € server),
Croatian "kroz {n} godina" instead of "za" (which read as "in five years' time" and doubled "za" in the caption),
"košta" throughout, "prostorija", "more power, more space", "the dearer, more efficient server"; no-break spaces in
Croatian amounts; PageUp/PageDown step a bar by ten. All applied.

## Time

Started 2026-11-06 23:45, done 2026-11-07 00:05: about 20 minutes. Spec, numbers, model and tests about 7, the page
and its gate passes about 7 (the stage is a size container on phones too, so the phone layout needed
`container-type: inline-size`, as `fin-capex-opex` does), the review (run alongside these notes) and its fixes the
rest.
