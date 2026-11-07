<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-downtime-cost: notes

New explorer (task `docs/tasks/w3/fin-downtime-cost.md`, catalogue `fin-downtime-cost` §4.12). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** the price of an hour down against the price of a nine. Top: what an hour down
  costs across the week, Monday to Sunday, three bands a day (00–08, 08–18, 18–24), each stacked by component, with
  the average hour as a dashed line and its tag. Below: one row per level (99 %, 99.9 %, 99.99 %, 99.999 %) with the
  downtime it allows a year, a bar of its expected downtime cost (stacked by the same components) plus the redundancy,
  the total (★ on the cheapest), and what its nine saves against what it costs (✓ / = / ✗). The target row is
  outlined and marked ▶; under the rows, a badge with the target against no redundancy.
- **"Varying with the hour and the day"** is the week chart plus rule 9: when pricing every hour down at the
  working-hour cost would pick a different level, the caption says so (`nNaive`). Preset 1 shows it: at 700 € an hour
  the third nine pays; at the average 419 € it does not. Failures are equally likely at any hour (stated in the stage
  footer), so the expected cost of an hour is the week's average. Two bands only (working hours Mon–Fri 08–18, and
  everything else): enough to show the variation without a 168-cell editor.
- **Components:** lost revenue (per working hour, and outside working hours as a share of it, 0–200 %, so a shop can
  sell more in the evenings), idle staff (people × 40 € an hour, working hours only), recovery work and penalties
  (€ an hour, every hour). Recovery and penalties behave alike in the model; they are kept apart because the concept
  names them and the owner may want to see each.
- **Availability levels are whole nines, 99 % to 99.999 %.** 99 % is "no redundancy", the system as it stands, and
  costs nothing extra. Each further nine costs 3 × the one before (`ha`, 3 `ha`, 9 `ha`: totals `ha`, 4 `ha`, 13 `ha`).
  The factor 3 is fixed, not a param: with downtime falling tenfold per nine and the price tripling, the marginal nine
  stops paying at some level, which is the point; a factor slider would add a control without a new idea.
- **The target is chosen on the stage**, by clicking a level row (or focus it and press Enter or Space). It is a
  hidden param (`visible` false), so it stays in the URL and the kit checks it. It was a panel choice too, but the
  panel with five presets and six ranges did not fit 1920×1080 with it. A panel button "Cheapest level" (key `O`)
  jumps to n\*. The presets sit in two columns and the ranges are tighter, as in `lnx-live-migration`.
- **To the euro:** each level's downtime cost is computed exactly (in units of 1/700 000 €: 7 days × 10^5) and rounded
  once to whole euros, halves up. Every total, difference and comparison (cheapest level, a nine's verdict, the
  outcome) uses those whole-euro amounts, the ones the page shows, so a ✓ never stands beside "saves 55 000 €, costs
  55 000 €" and ★ never goes to the dearer of two equal totals. An exact difference under a euro is no difference.
- **Ties:** equal totals go to the fewer nines (less redundancy for the same money); a nine that saves exactly what it
  costs is *even* (=); a target with the same total as no redundancy is *even*. Ties are reachable from the sliders
  (SPEC "To the euro (rule 1)" lists two); they are tested on the module and on the page model.
- **Changed mark:** the result badge is highlighted when the outcome changes (base, saving, even, loss); the
  cheapest total when the cheapest level changes. The legend says both.
- **Grayscale:** each component has its own pattern (solid, diagonal, horizontal stripes, vertical stripes, dots
  with a dashed outline for redundancy); marks ★ ▶ ✓ = ✗ carry the verdicts.
- **Phone:** the week chart keeps its seven days; each level row wraps to label and total, bar, nine.
- **The sums in their own file** (`downtime.js`): `hourCost`, `weekSum`, `downSeconds`, `downCost`, `haCost`,
  `levels`, `best`, `nine`, `outcome`, `euros`; pure, no words, registers on `globalThis.SimdeckModels.downtime`. No
  other `fin-` model was needed (nothing here discounts or books).
- **No glossary terms:** none of these terms are in `kit/glossary.js`; the strings write the pairs out and the page does
  not link `glossary.js` (as the other `fin-` pages).
- **`related`: `rpo-rto`**, the technical side of the same hours (one incident's detection, decision, restore); the
  explanation points to it in words. No `entries`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The catalogue's Croatian title is used as is.
- "Set the availability target" is done on the stage (the level rows), not in the panel (see Decisions).
- The catalogue seed links `perf-slo-error-budget`; it does not exist yet. The explanation says that an error budget's
  minutes become euros here; no link.

## Sources

- Cost of downtime as lost revenue + lost productivity + recovery + penalties, and expected cost = hours down × cost
  per hour: the standard business-impact-analysis method (e.g. the ITIL availability management and BCM literature,
  ISO 22301's business impact analysis). No product or vendor is named on the page.
- Availability in nines and the downtime each allows (10^−n of 8 760 hours): standard reliability arithmetic; the
  error-budget reading of an availability target is the SRE literature's.
- "Each nine costs more than the last": the usual cost-of-availability curve in availability management texts; the
  factor 3 is illustrative.
- Numbers: made up but plausible, checked by the script at the end of `SPEC.md` and by the preset test.

## Unchecked *(check)*

- 40 € per idle person-hour (loaded: pay and on-costs), order of magnitude for an office employee.
- 99 % for a single system without redundancy.
- Each further nine costing 3 × the one before, and 40 000 € a year for the first extra nine (a second server, a
  second site's share, failover, on-call).
- Failures equally likely at any hour (real failures cluster around changes and load, which is mostly working hours).
- The Croatian terms below, in particular "devetka" for a nine, "zaposlenici bez posla" for idle staff, "ugovorne
  kazne" for penalties or service credits, and "trošak zastoja" for the cost of downtime.

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| downtime | zastoj (prekid rada) |
| cost of downtime | trošak zastoja |
| availability | dostupnost |
| a nine (of availability) | devetka |
| high availability (HA) | visoka dostupnost |
| redundancy | redundancija |
| lost revenue | izgubljeni prihod |
| idle staff | zaposlenici bez posla |
| recovery work | rad na oporavku |
| penalties (service credits) | ugovorne kazne |
| expected yearly cost | očekivani godišnji trošak |
| working hours | radno vrijeme |
| error budget | proračun pogrešaka |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs": none of the four notes applies to
`fin-downtime-cost` (they are about depreciation rates, lease accounting, currency and the fiscal year). Nothing to
copy.

## Shared requests

- **Promote `downtime.js` to `models/downtime.js`** if `fin-ale-risk` or an "in money" preset on `rpo-rto` prices
  hours down (catalogue §5.23). It moves unchanged; its tests are the rule 1–7 tests in `sim.test.js` that call `M.`
  directly.
- **Glossary:** add the term pairs above.
- **Learn tree:** catalogue §4.12's placement: area `money` (exists), subject `risk` "Rizik izražen u novcu" /
  "Risk in money" (not yet in `learn.json`), leaf `downtime` with `fin-downtime-cost` and `rpo-rto`; also in the
  existing leaf `resilience › disaster › rpo-rto`.
- **`rpo-rto` "in money" preset** (catalogue §5.23): not done here (another sim's folder).

## Review

A fresh reviewer (a separate agent with no context beyond the files) read the code against `SPEC.md` and ran the
SPEC script: every number matched the SPEC table and `sim.js`. It tried 83 rule-breaking mutations; 66 were caught.
Six of the survivors behave exactly like the original (e.g. `euros` as `Math.round(x / S)`, snapping before or after
clamping, as every bound is a multiple of its step). The rest were real gaps, each now covered by a test that I
checked fails on the mutation:
- a nine charged the whole redundancy instead of its own step (payments with `ha` = 60 000);
- rule 9 with 167 or 169 hours, or priced at the dearer hour instead of the working hour (two edge cases and a
  case where the other hours cost more);
- the week chart's scale (`top`) taken from working hours only;
- `compute` given junk params directly (not through the defaults);
- the range limits of `people`, `fix`, `off`, `pen`; a target of `'3.5'`, `4.6`, `true` or blank.

Fixed defects:
- **Rounded numbers against an exact verdict.** The page could show "✓ saves 55 000 €, costs 55 000 €", or ★ on the
  dearer of two totals that both read 130 000 €. Every decision now compares the whole-euro amounts the page shows
  (see Decisions); the "under 1 €" special case is gone.
- **A blank or array value from a URL** became 0 instead of the default; `normalise` now treats anything not a finite
  number or a numeric string as missing.
- **Wording:** hints said "evenings and weekends" / "at night" where the model means every hour outside working hours;
  `translate="no"` was on text that is translated; the legend's changed mark now names both triggers; non-breaking
  spaces before % and €; Croatian: "Kad bi … koštao", "Nijedna se devetka", "sat rada zaposlenika"; the en preset
  name matches its hint ("Internal app").
- **SPEC:** the target param (stage rows, hidden panel param, the "Cheapest level" button), the dashed outline of
  redundancy, and which caption note wins when `nSameAsBest` and `nNonePays` both hold.
- A dead field (`anyCost`) is gone.

## Time

Started 2026-11-07 00:33, done 01:01: about 28 minutes, the fresh review and its fixes included.
