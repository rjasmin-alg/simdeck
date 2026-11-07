<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-licence-models: notes

New explorer (task `docs/tasks/w3/fin-licence-models.md`, catalogue `fin-licence-models` §4.12, ledger model §5.23,
soft dependency `fin-capex-opex`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Both options always side by side.** The scoreboard has one row each (cash paid, expensed, on the balance sheet)
  and the crossing year in its own cell, as the student's first task is "find the crossing year". The cash chart is a
  step line per option (cash leaves on the first day of each year), with the crossing year's column outlined; the
  expense chart splits the perpetual licence into amortisation, maintenance and back-fees.
- **Cash vs expense is the stage's second view:** the perpetual licence's cash leaves in lumps, its expense is spread
  by amortisation; the subscription's cash equals its expense. The caption's `nExpense` note says it in numbers
  (year 1: 96 000 € paid, 32 000 € expensed).
- **Yearly, not monthly.** Licences, maintenance and subscriptions are bought and billed by the year; payments on the
  first day of each year, so a year's cash and expense sit in one ledger row (no prepayment line needed).
- **The ledger is reused unchanged.** `ledger.js` is the `fin-capex-opex` copy (header lines only; a test compares it
  line by line), with rows as years instead of months; its `sums`, `totals` and `shown` work on any rows.
  `licensing.js` (new, words-free, promotable) builds the rows: counts, list prices, the perpetual licence with its
  lapse and back-fees, the subscription, the cumulative cash and the crossing year.
- **The crossing year is "from then on to the end of the horizon"**, not the first year the subscription was ever
  dearer: a lead lost again (a per-core refresh forces a lump of new perpetual licences) would otherwise mislead.
  Equal (rounded) cash is not a crossing (SPEC rule 8; preset `flat` shows the tie in year 5).
- **Per-core growth comes from the hardware:** servers follow the users (one per 50), and a refresh replaces them with
  servers of twice the cores (16 → 32), "because the smaller ones are no longer sold". The same server count with
  more cores is the simplest way to show licences growing without users. Year 1 costs the same per user and per core
  (80 000 €), so the difference that follows is only the metric's growth.
- **The lapse always returns within the horizon** (`normalise` clamps the gap). Staying lapsed for good is a different
  decision (no updates, a security question) and out of scope; the explanation says lapsing loses updates and support.
- **Back-fee rule:** missed licence-years at the return year's price plus a 20 % reinstatement fee (SPEC rule 6).
  The "extra over staying current" in the caption is the whole difference in cash over the horizon, so it includes
  the price rise between the missed years and the return.
- **Controls:** the panel holds four sliders (growth, maintenance, price rises, horizon) and the presets; metric,
  refresh and the lapse are button groups on the stage (the pattern of `fin-lease-vs-buy`, for the one-screen fit).
  The subscription share (40 % of the list price) is a hidden param (URL only).
- **One price-rise param** for new licences, maintenance and the subscription alike (the task names "yearly price
  rises"). Separate rises (subscriptions often rise faster) would be a second knob on the same concept.
- **Concepts, not tools:** no vendor, product or licensing programme is named. IAS 38 (MRS 38) is named once in the
  explanation, as the finance notes allow.
- **No glossary terms:** none of the finance terms are in `kit/glossary.js`; the strings write the pairs out and the
  page does not link `glossary.js` (as the other `fin-` pages).
- **Croatian number formats** use a no-break space before € and % and as the thousands separator, so "96 000 €" never
  wraps.
- **Phone:** the scoreboard keeps cash paid and the crossing year; expensed and the balance sheet need the wide screen.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- Added a **hardware refresh** choice (none, year 3, 4, 5): the concept's "per-core metrics grow as the hardware
  grows" needs a hardware change to show, and it is a choice, not a second concept.
- The subscription price is not a visible control (hidden param), see Decisions.

## Sources

- IAS 38 *Intangible Assets* ¶ 97 (amortisation of a finite-life intangible asset on a systematic basis over its
  useful life, beginning when it is available for use; straight-line when the pattern cannot be determined ¶ 97–98).
  Software bought outright as an intangible asset: standard textbook treatment (e.g. an introductory financial
  accounting text, non-current assets chapter).
- Subscriptions and maintenance as period expenses: same.
- Maintenance as a yearly share of the list price (commonly 15–25 %), reinstatement with back-maintenance and a fee,
  per-user vs per-core licence metrics: general vendor licensing practice; not tied to any one vendor *(check)*.
- Numbers: made up but plausible, checked with a Decimal script (end of `SPEC.md`) before coding, then by the preset
  tests. No local course material exists for FIN.

## Unchecked *(check)*

- The 15–25 % maintenance range in the explanation, and the 40 % subscription share as "plausible".
- Back-fee practice (rule 6): missed years at the return year's price plus 20 %; vendors vary (old prices, other
  fees, or buying anew).
- Amortisation over 5 years and a full year's amortisation in the purchase year (bought on the year's first day); some
  firms use 3 years for software, or start the month after purchase.
- The refresh doubling cores per server while keeping the server count, and "the smaller servers are often no
  longer sold" in the explanation.
- "A subscription is all expense": a subscription paid a year ahead is briefly a prepayment; at yearly resolution
  it is an expense of its year (the prepayment is `fin-accruals-cash`'s concept).
- Croatian terms below, especially "trajna licenca", "kataloška cijena", "godina prijelaza", "naknada za ponovnu
  aktivaciju", "zamjena poslužitelja".

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| perpetual licence | trajna licenca |
| subscription | pretplata |
| maintenance (software) | održavanje |
| list price | kataloška cijena |
| intangible asset | nematerijalna imovina |
| amortisation | amortizacija |
| useful life | korisni vijek uporabe |
| balance sheet | bilanca |
| profit and loss | račun dobiti i gubitka |
| crossing year | godina prijelaza |
| maintenance lapse | prekid održavanja |
| back-fees, reinstatement fee | zaostalo održavanje, naknada za ponovnu aktivaciju |
| per user / per core | po korisniku / po jezgri |
| hardware refresh | zamjena poslužitelja (opreme) |

## For the owner

- Catalogue §4.12 "Where Croatian practice commonly differs" has no line for `fin-licence-models`. The nearest, for
  `fin-capex-opex` / `fin-depreciation` (not verified, not on the page): *firms often book depreciation at the maximum
  rates the profit-tax rules allow*; for software this would mean a shorter amortisation than the page's five years.

## Shared requests

- **Promote `ledger.js` to `models/ledger.js`** (already requested by `fin-capex-opex`); then point this page at
  `../../models/ledger.js`, drop the local copy, its copy test and the copied ledger tests.
- **`licensing.js`** can move to `models/` unchanged if another page needs licence counts (e.g. `fin-tco`,
  `fin-cloud-commitment`); no other task names it yet.
- **Glossary:** add the term pairs above.
- **Learn tree:** suggested place: area `money`, the subject for the catalogue's playlist group 4 "Kupiti, unajmiti ili
  se pretplatiti / Buy, lease or subscribe", next to `fin-lease-vs-buy` (leaf "Licence / Licences", or one leaf
  "Kupiti ili unajmiti / Buy or rent" holding `fin-lease-vs-buy`, `fin-licence-models` and `fin-licence-models#per-core`).

## Review

A fresh reviewer (a separate agent, with no context beyond the files) read the code against the task and `SPEC.md`,
recomputed every preset with its own Decimal script (all match), clicked through the page headless in both languages
and ran 43 rule-breaking mutations: 39 caught. Of the four survivors, three cannot change any result (held = need on
every reachable param, `<=` after the tie check, `snap` without `toFixed` on these steps) and one hit an unused field.
Defects found and fixed:

- **The lapse note lost the return year** ("coming back in year cost …"): `{r}` was used twice and `t.parts` moves
  its node; now `{r}` and `{q}`. A new test fails any string that uses a placeholder twice (I checked that it
  catches the old string).
- **`refresh=1` (URL)** gave a refresh note about doubling cores that were never small: a refresh in year 1 is now
  none (test).
- **A refresh after the horizon** still showed its button pressed: the pressed button follows the refresh within the
  horizon.
- **Phone:** the refresh year's header overlapped the next year; on the phone it is now the underlined year alone.
- **Unused state fields** removed; a direct test now covers back-fees counting licences held, not a lower need.
- **Wording:** the preset hint and the `sim.json` entry no longer say the licences simply double (cores per server
  double; per-core licences jump 2.4 times in year 4, users grow too); "the smaller servers are often no longer
  sold"; the maintenance range and the subscription-as-expense simplification are in *(check)*.

## Time

Started 2026-11-07 04:01 (thread start), first passing gate 04:10, done 04:17: about 16 minutes. SPEC check, model, tests and page to a first passing gate took about 10 minutes; the fresh review (about 3.5 minutes of agent time, run while SPEC and NOTES were written), its fixes and the final checks the rest.
