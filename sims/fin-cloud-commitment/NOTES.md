<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-cloud-commitment: notes

New explorer (task `docs/tasks/w3/fin-cloud-commitment.md`, catalogue `fin-cloud-commitment` §4.12). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** price vs utilisation. The discounted price is only a saving for the part of the
  commitment that is used. Year 1 is drawn month by month: each column splits around the commitment line into
  *used* (solid), *paid but unused* (hatched, dashed outline) and *on demand* (striped). Beside it, on the same vertical
  scale, the **ladder**: one row per server level (the 1st, 2nd, … committed server) with the share of the term it
  runs, against a dashed break-even line. The rows that cross the line are the ones that pay, and the best level sits
  where they stop. It is a load-duration curve turned sideways, so "commit the base load, leave the peaks" can be read
  straight off it.
- **Drawing the year:** drag across the month columns (one drag can paint several months) or focus a column and use
  the arrow keys (Shift or PageUp/PageDown ±5, Home 0, End the top). The months are hidden range params `u1…u12`, so
  they stay in the URL and the kit clamps them, as `fin-tco` does with its amounts.
- **The level** is a panel slider and also the ladder itself (drag it, or focus it and use the arrows). A panel button
  "Commit at the best level" (key `O`) jumps to c\*.
- **Units:** servers running all month (whole servers), on a 0–16 scale. Sixteen keeps each ladder row at least about
  20 px tall at 1920×1080, so its percent label fits; the presets peak at 13. Usage within a month (hours, autoscaling)
  is out of scope (`perf-autoscaling-lag`).
- **Prices fixed, not params:** 200 € per server-month on demand, 1 year 30 % off (140 €), 3 years 50 % off (100 €).
  A discount slider would let the term and the discount disagree; with the discount set by the term, the term choice
  moves break-even (70 % ↔ 50 %), which is the point. The prices are written in the stage footer.
- **Risk of the longer term:** the `later` param (always shown, since it also drives the 3-year chip) scales years 2 and 3 to a share of
  year 1 (0–150 %, step 25). The 3-year term is costed over all 36 months; a block between the year and the ladder
  draws years 2–3 at that scale, so the unused commitment growing when usage falls is visible, not only a number.
  The ladder and the best level are over the whole term.
- **Comparing the terms:** the chips under the money show the saving **as a percent of the on-demand cost** for both
  terms at the chosen level, so a one-year and a three-year total are comparable. The 1-year chip covers year 1 only:
  after a 1-year term you choose again (a renewed 1-year term is out of scope; the explanation says so).
- **Exact sums:** usage in hundredths of a server, prices in whole euros; every amount on the page is a whole euro for
  every param value (years 2–3 exist only at the 100 € price). No rounding except the percent (halves away from zero,
  never −0: a test caught that).
- **Ties:** a level exactly at break-even is *even* (`=` mark, dashed bar) and is not part of the best level, which is
  the smallest commitment with the lowest total (less bound for the same money). The caption then says "the best
  level, 7, costs the same" (preset 4 with 8). Equal totals are *even* (`capEven`, dashed badge).
- **Changed mark:** the result badge is highlighted when a param change turns a saving into a loss or back (or to even).
- **Grayscale:** the three parts differ by pattern (solid, diagonal hatching, horizontal stripes); ladder rows by fill
  (solid ✓, dashed =, hollow); the result by ★ / ✗ / =.
- **Phone:** the chart stacks: year 1 with its axis, years 2–3, then the ladder; every other month name is shown.
- **The sums in their own file** (`commitment.js`): `termUsage`, `euros`, `cost`, `levelUse`, `level`, `best`, `pct`,
  `outcome`; pure, no words, registers on `globalThis.SimdeckModels.commitment` (catalogue §4.12 finance notes). No
  other `fin-` model was needed: nothing here discounts or books.
- **No glossary terms:** none of these terms are in `kit/glossary.js`; the strings write the pairs out and the page does
  not link `glossary.js` (as the other `fin-` pages).
- **No `entries`:** none of the presets needs its own line on the home page.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The catalogue's Croatian title is used as is.
- "Draw a year of usage" is done by dragging the month columns, not freehand.

## Sources

- Commitment-based discounts (a term of one or three years, the discount deeper for the longer term, paid whether used
  or not) and the break-even utilisation as committed price ÷ on-demand price: the public pricing documentation of the
  large cloud providers and the cloud financial management (FinOps) literature on "commit to the base load"; the same
  reasoning as the load-duration curve in capacity planning. No product or provider is named on the page.
- DR handbook (`~/projects/dr-lecture-estate/student/handbook/constraints.md`): a cloud burst build agent at EUR 1.9
  per instance-hour, the catalogue's seed. That is a large build machine (about 1 390 € a month); the page uses a
  mid-size server at 200 € a month instead, the same order of magnitude as the handbook's other monthly items.
  Student material, no answer keys used.
- Numbers: made up but plausible, checked by the script at the end of `SPEC.md` and by the preset test.

## Unchecked *(check)*

- 200 € per server-month on demand (order of magnitude for a mid-size virtual server).
- 30 % (1 year) and 50 % (3 years) as typical discounts; published ones are often some 30–40 % and 50–60 %.
- The Croatian terms below, in particular "ugovorena potrošnja" / "obveza" for a commitment, "plaćanje po potrošnji"
  for on demand, and "točka pokrića" used for a utilisation share.

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| commitment (committed use) | ugovorena potrošnja, obveza |
| on demand (pay as you go) | plaćanje po potrošnji |
| committed price | ugovorena cijena |
| discount | popust |
| term (of a commitment) | razdoblje obveze |
| utilisation | iskorištenost |
| break-even (utilisation) | točka pokrića (iskorištenosti) |
| base load | osnovno opterećenje |
| peak (load) | vršno opterećenje, vrh |
| unused commitment | neiskorištena obveza |
| server-month | poslužitelj-mjesec |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs": none of the four notes applies to
`fin-cloud-commitment` (they are about depreciation rates, lease accounting, currency and the fiscal year). Nothing to
copy. A related point the owner may want to check: cloud contracts are usually priced in US dollars, which is
`fin-indexation-fx`'s currency note, not this page's.

## Shared requests

- **Promote `commitment.js` to `models/commitment.js`** if a later page weighs a commitment against usage
  (`fin-prepay-discount` builds on paying in advance; `fin-fixed-variable`'s step costs). It moves unchanged; its tests
  are the rule 1–7 tests in `sim.test.js` that call `M.` directly.
- **Glossary:** add the term pairs above.
- **Learn tree:** catalogue §4.12's placement: area `money` (exists), subject `buying` "Kupiti, unajmiti ili se
  pretplatiti" / "Buy, lease or subscribe" (not yet in `learn.json`), leaf `cloud` with `fin-cloud-commitment`.

## Review

A fresh reviewer (a separate agent with no context beyond the files) read the code against `SPEC.md` and ran the
SPEC script: every number matches, in both the SPEC table and `sim.js`. It tried 73 rule-breaking mutations of
`commitment.js` and `sim.js`; 50 were caught and 23 survived. Seven of the survivors behave exactly like the original
(e.g. `euros` with `Math.round`, which is exact because every amount is a whole euro). The rest were real gaps, and
each is now covered by a test:
- `best` not reaching the top of the scale or level 1;
- `nAtBest` at c = 1;
- the wrong `bestWith`;
- the years 2–3 notes on the 1-year term;
- the 3-year chip ignoring `later`;
- `flipped` comparing percents;
- `normalise`: rounding, lower clamps and term values;
- `''` / `null` from a URL becoming 0 instead of the default;
- the level share rounded;
- the default commitment.

Fixed defects:
- **"No saving" for a real saving.** A chip printed "no saving" when the saving rounded to 0 %. Each chip now carries
  its outcome, and a non-zero result that rounds to 0 % reads "under 1 %".
- **"The best level is 0".** That sentence appeared when nothing pays; the caption now uses `nNonePays`, and `nStop`
  covers usage that stops from year 2.
- **Hidden `later`.** It was hidden on the 1-year term but still drove the 3-year chip; the slider is now always shown.
- **Wording.** The Croatian case after "uz obvezu od", "one iz 1. godine", "koliko košta" instead of "što stoji", and
  the unbolded total in `capNone`.
- **Dead field.** The unused `discount` field is gone.

Three panel hints were dropped so that the Croatian panel (two-line title, four-line caption) still shows "Ideja"
at 1920×1080.

## Time

Started 2026-11-07 00:07, done 00:30: about 25 minutes.
- Spec, numbers, model and tests: about 12 minutes.
- The page: about 15 minutes. The phone grid needed its placement in CSS rather than inline styles, and a 16-server
  scale so the ladder labels fit.
- The review and its fixes: the rest.
