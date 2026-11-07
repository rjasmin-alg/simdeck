<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-fixed-variable: notes

New explorer (task `docs/tasks/w3/fin-fixed-variable.md`, catalogue `fin-fixed-variable` §4.12). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** average vs marginal cost, and fixed + steps vs a price per user. Two charts share
  the user axis (0–1 000):
  - *Cost a month*: the in-house staircase (solid), the service's straight line (dashed), the fixed cost as a dotted
    floor, the break-even zone hatched.
  - *Cost per user a month*: the in-house average falling as a sawtooth, the service's flat price, and the next user's
    marginal cost as a dotted line at 2 € with a ▲ at every block edge, where it jumps to 502 €. That spike is off any
    sensible per-user scale, so it is a marker plus the label "new block +500 €", not a drawn bar.
  - Below the charts, four cards at the chosen count: in-house (fixed + blocks + variable, and the idle places with
    their cost), the service, per user (the average split into fixed, blocks and running, and the next user), and
    break-even (first and for good, plus the textbook formula with its numbers).
- **Break-even is a zone.** With step costs, in-house is cheaper only in the last part of each block for a while,
  and dearer again after the next step. The page shows both numbers:
  - *first*: the first user count at which in-house is no dearer;
  - *for good*: the count from which it stays no dearer.
  The textbook formula, fixed ÷ (price − variable − block ÷ capacity), equals *first* whenever *first* falls on a full
  block (presets 1–3: 800). The staircase touches the textbook line at every full block and lies above it elsewhere.
  This is the "break-even is not one number" misconception.
- **Utilisation as a planning ceiling.** `util` is how full a block is planned before the next one is bought, so it
  sets a block's capacity (K × util ÷ 100 users). Headroom has a price: card 1 shows the idle places and what they
  cost a month. At 90 % and above, card 1 warns that waiting times grow near full; the explanation names the
  "Latency near full utilisation" simulator (`related: utilisation-latency` in `sim.json`). The page has no link of
  its own, since the site renders `related`.
- **Costs fixed, not params:** a block costs 500 € a month for 100 users at 100 %, and running costs 2 € per user a
  month; both are printed in the footer. The four params are the ones the concept turns on: users, utilisation, the
  fixed cost and the service's price. A block-cost slider would duplicate what utilisation already does to the cost
  per user.
- **Users** are a panel slider (step 10, so it reaches the keyboard), and a click or drag on either chart sets them.
- **Exact sums:** whole euros, integers everywhere; only the averages are rounded, to the cent, and only for display
  (`cents`). `first` and `forGood` are computed per block in closed form (`payFrom`), with no scan over users, and are
  tested against brute force over the parameter grid.
- **Ties:**
  - A full block stays one block; the next user opens a new one exactly at a multiple of the capacity (0 included).
  - Equal costs are *even* (`capEven`, a dashed badge), and count as break-even reached (≤). So 800 and 900 users in
    preset 2's setting are both even, the two ends of the zone.
- **Changed mark:** the result badge is highlighted when a param change moves the outcome between in-house cheaper,
  service cheaper and even.
- **Grayscale:**
  - in-house: a solid line with a round marker; the service: a dashed line with a square marker;
  - the fixed cost and the marginal cost: dotted lines, in different charts;
  - the zone: hatching;
  - the result: ● / ■ / =;
  - the cards: differ by their left border style.
- **Phone:** the charts stack, every other axis label is hidden, and the cards go in two columns, then one.
- **The sums in their own file** (`stepcost.js`): `blocks`, `cost`, `cents`, `average`, `opensBlock`, `marginal`,
  `spare`, `diff`, `outcome`, `blockMargin`, `textbook`, `payFrom`, `first`, `forGood`. The file is pure and has no
  words, and it registers on `globalThis.SimdeckModels.stepcost`. `fin-chargeback` names this sim as its source of the
  unit cost.
- **No other `fin-` model was needed:** the page neither books nor discounts. The catalogue's §5.23 ledger is for
  timelines, and this page has none.
- **No glossary terms:** none of these terms are in `kit/glossary.js`. The strings write the pairs out, and the page
  does not link `glossary.js`, like the other `fin-` pages.
- **No `entries`:** no preset needs its own line on the home page.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The catalogue's Croatian title is used as is.
- The catalogue mentions `ec-vs-replication`'s overhead as a possible cost-per-usable-TB preset ("could take"). It is
  not built here: it would change the unit from users to terabytes. It is listed under Out of scope in `SPEC.md`.

## Sources

- Cost behaviour: fixed, variable and step-fixed costs; average and marginal cost; the break-even volume as fixed
  cost ÷ contribution margin per unit, with step costs giving several break-even points. These are the standard
  cost and management accounting textbook treatment (cost-volume-profit analysis). No vendor or product is named.
- Utilisation and headroom: the same queueing argument as `utilisation-latency` (waits grow steeply near full).
- Numbers: made up but plausible, checked by the script at the end of `SPEC.md` (with brute force) and by the preset
  test.

## Unchecked *(check)*

- 500 € a month for a block of capacity for 100 users (a server with its storage, power, space and support).
- 2 € per user a month of variable running cost.
- 4–30 € per user a month as the range of per-user service prices, and 12 € as a typical one.
- 3 000 € a month as a platform's fixed cost (a share of the team's time, base licences, monitoring).
- The Croatian terms below, in particular "stepenasti troškovi", "granični trošak", "rezerva kapaciteta",
  "ciljana iskorištenost" and "vlastita platforma".

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| fixed costs | fiksni troškovi |
| variable costs | varijabilni troškovi |
| step costs (step-fixed costs) | stepenasti troškovi |
| average cost (per user) | prosječni trošak (po korisniku) |
| marginal cost | granični trošak |
| break-even point | točka pokrića |
| margin per user (contribution margin) | marža po korisniku |
| utilisation / target utilisation | iskorištenost / ciljana iskorištenost |
| headroom | rezerva kapaciteta |
| capacity block | blok kapaciteta |
| in-house platform | vlastita platforma |
| per-user service | usluga po korisniku |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs": none of the four notes applies to
`fin-fixed-variable`. They are about depreciation rates, lease accounting, currency and the fiscal year, and this
page does not book, lease or change currency. Nothing to copy.

## Shared requests

- **Promote `stepcost.js` to `models/stepcost.js`** before `fin-chargeback` starts: its task takes the "unit cost from
  `fin-fixed-variable`". The file moves unchanged. Its tests are the rule 1–8 tests in `sim.test.js` that call `M.`
  directly.
- **Glossary:** add the term pairs above.
- **Learn tree:** catalogue §4.12's placement: area `money` (exists), subject `real-cost` (exists, with `tco`), a new
  leaf `per-user` "Trošak po korisniku" / "Cost per user", with `fin-fixed-variable` (later also `fin-chargeback`).

## Review

A fresh reviewer (a separate agent, given only the files) read the code against `SPEC.md`, ran the SPEC script and
tried 75 rule-breaking mutations of `stepcost.js` and `sim.js`. No rule was broken in the code. 22 mutations
survived; 9 of them behave exactly like the original. Each of the other 13 is now covered by a test, and all are
re-checked as killed:
- the rounding of the average's parts;
- `payFrom` called directly, and the `forGood` fallback branch (reachable only through the module, when S < p − v);
- `unitCents` and the page's textbook value at utilisations where the division is not exact;
- 0 users: whether the next user opens a block, and the spare capacity;
- the caption at small counts;
- `normalise` with a blank value and the price's upper clamp;
- the block edges and the average curve at the scale's right end.

Fixed defects:
- **"Cheaper" at a tie.** At 800 and 900 users the caption said the costs were equal *and* that in-house was cheaper.
  Break-even counts equal as reached, so the notes and cards now say "no dearer".
- **A break-even tag beside "never cheaper"** when costs only touch (no fixed cost, zero block margin): no zone is
  drawn then.
- **"=" with rounded arithmetic.** "3 000 € ÷ 0,91 € = 3 300" now reads "≈" whenever the margin shown is rounded.
- **Average parts that did not add up** (22,45 € against 13,64 + 6,82 + 2,00). The block share is now the remainder
  (rule 1e).
- **Ungrouped user counts** ("1000 users") in the plural strings.
- **0 users:**
  - the changed mark compared a hidden outcome; at 0 users the outcome is now `none`;
  - with no fixed cost the caption said "still costs its fixed 0 €"; `capNoneFree` and `resNoneFree` replace it.
- **`nNever` blamed utilisation alone**; it now says "at this price and N % utilisation".
- **The run-hot hint** said break-even falls to 600; it falls to 600–650.
- **Prices in a caption** are written with cents beside the averages.
- **The SPEC script** rounded halves to even (Python `round`), against rule 1e; it now rounds halves up. Its
  brute-force claim is narrowed to what it actually checks.

## Time

Started 2026-11-07 01:56, done 02:20: about 25 minutes.
- Spec, numbers, model and tests: about 8 minutes.
- The page and screenshots: about 9 minutes. The value tags first had no position: the style was built but never
  passed.
- The review and its fixes: the rest.
