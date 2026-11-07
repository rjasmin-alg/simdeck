<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-prepay-discount: notes

New explorer (task `docs/tasks/w3/fin-prepay-discount.md`, catalogue `fin-prepay-discount` §4.12, needs
`fin-npv-discounting`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The baseline is monthly billing, not yearly.** The catalogue's "years prepaid" is K = 1, 2 or 3 years paid upfront
  against paying the same three-year contract month by month. That makes K = 1 meaningful (the common "pay the year
  upfront, get a discount" offer) and lets one rule (SPEC rule 9) give every rate: the same 10 % is 26.5 % a year for
  one year upfront, 11.9 % for two, 7.6 % for three. The default is the surprising one (three years, 10 %, below the
  8 % cost of capital).
- **Both plans have the same payment terms.** The vendor invoices at the start of each billing period; every invoice
  is paid N days later. So the terms shift both plans by the same days: the implied rate and the expense do not move,
  only the cash does. That is the catalogue's "terms move cash, not cost", shown rather than told (preset 5 against
  preset 1). An early-payment discount on one invoice ("2 % if paid 20 days early") is the same rule with one month;
  it is named in the explanation (≈ 45 % a year), not built as a preset.
- **The cash buffer gets the list price as a monthly budget.** Balance = buffer + 5 000 € a month (the contract's
  yearly price ÷ 12) − payments. Without an inflow both lines would just run down; with it the monthly plan stays
  level (a little above with longer terms) and the upfront plan dips once and climbs back, ending ahead by the
  saving on paper. The gap between the lines is the working capital tied up. A "minimum buffer" (finance's floor) is a
  dotted line; the upfront plan's lowest point is marked and compared with it.
- **Verdict by the NPV difference, rate shown beside it.** "Take / skip" is the sign of the saving in today's money,
  rounded to the euro (as in `fin-npv-discounting`). It always agrees with "implied rate above / below the cost of
  capital" (one sign change; checked over the whole param grid). The rate is shown with one decimal, or two or three
  when fewer would read as equal to the cost of capital (SPEC rule 11).
- **Scoreboard ticks the cheaper plan in each column** (paid in total, worth today): in the default they disagree
  (upfront pays less on paper, monthly is cheaper today), which is the page's contrast.
- **The panel holds presets, discount, cost of capital, buffer and minimum; years and terms are button groups on the
  stage**, as in `fin-lease-vs-buy`. The price is a hidden param (URL only, 60 000 € a year): every amount scales with
  it, the rate and the verdict do not.
- **Time.** Months as twelfths of a year, days as 1/365 of a year (no leap years); rates annual effective.
- **Modules.** `discount.js` is the `fin-npv-discounting` copy, unchanged apart from its header (`models/discount.js`
  does not exist yet; COMMON.md §6); a test compares it with the source line by line. `prepay.js` is new: schedule,
  expense by year, balance over time, tied-up amount, cost today and the implied rate, pure and words-free, taking
  the discount model as an argument, so it can move to `models/` unchanged.

## Sources

- Effective annual cost of a trade or early-payment discount, payment terms as trade credit: Brealey, Myers & Allen,
  *Principles of Corporate Finance*, ch. 30 (working capital management, trade credit); Ross, Westerfield & Jaffe,
  *Corporate Finance*, ch. on credit and inventory management (terms of sale, the cost of not taking the discount).
- Implied rate as the IRR of the difference between two payment plans; discounting with fractional years: any
  corporate-finance text; the discounting is the copied model (sources in `sims/fin-npv-discounting/NOTES.md`).
- Prepaid expense used up month by month (accrual basis): IAS 1 *Presentation of Financial Statements* ¶ 27–28 and the
  IASB *Conceptual Framework* (accrual accounting); named in SPEC only.
- Numbers: made-up but plausible (a 60 000 € a year support contract, 10–15 % for multi-year prepayment); checked
  with a 50-digit Decimal script (end of `SPEC.md`) before coding, then by the preset tests. No local course material
  exists for FIN.

## Unchecked *(check)*

- **Typical prepay discounts** (10–15 % for three years, 10 % for one year against monthly billing) are plausible
  from vendor price lists in general but not from a source I checked *(check)*.
- **The budget inflow model** (the list price spread evenly as the buffer's monthly inflow) is a teaching device, not
  a finance rule; the explanation calls it the budget *(check the framing with the owner)*.
- **ch. 30 in Brealey-Myers** is the chapter number in recent editions; older editions number it differently *(check)*.
- **Croatian terms** below, especially "rok plaćanja" (also "valuta plaćanja" in practice), "obrtni kapital",
  "novčana rezerva" and "unaprijed plaćeni trošak" (the balance-sheet line is "plaćeni troškovi budućeg razdoblja")
  *(check)*.

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| prepayment, paying upfront | plaćanje (uplata) unaprijed |
| prepayment discount | popust za plaćanje unaprijed |
| early-payment discount | popust za prijevremeno plaćanje (skonto) |
| payment terms (net 30) | rok plaćanja (valuta plaćanja) *(check)* |
| implied annual rate | implicitna godišnja kamatna stopa |
| cost of capital | trošak kapitala |
| working capital | obrtni kapital |
| cash buffer | novčana rezerva |
| minimum buffer | najmanja rezerva |
| prepaid expense | unaprijed plaćeni trošak (plaćeni troškovi budućeg razdoblja) *(check)* |
| expense | trošak (rashod) |
| present value | sadašnja vrijednost |

## For the owner

- Catalogue §4.12 "Where Croatian practice commonly differs" has no line for `fin-prepay-discount`, so nothing is
  copied here. A candidate, not verified: Croatian invoices state the due date as "valuta plaćanja", and statutory
  payment terms between businesses are capped (commonly 60 days) *(check before using)*.

## Shared requests

- **Promote `discount.js` to `models/discount.js`** (already requested by `fin-npv-discounting`,
  `fin-roi-payback-npv` and `fin-lease-vs-buy`); then point this page at `../../models/discount.js` and drop the local
  copy and its copy test.
- **`prepay.js`** could become `models/prepay.js` if another contract page (`fin-cloud-commitment`,
  `fin-licence-models`) needs an implied rate or a cash-buffer timeline; nothing needs it yet.
- **Glossary:** add the term pairs above.
- **Kit (optional):** a hidden param still needs the page's own `.sd-ctl[hidden] { display: none; }` (as in
  `fin-lease-vs-buy` and `fin-roi-payback-npv`).

## Review

A fresh reviewer (separate agent, no context beyond the files) read the code against `SPEC.md`, re-ran the SPEC
script (table reproduced), re-checked the grid claims and the finance (implied rate as the IRR of an annuity due,
independent of the terms; accrual expense; tied-up amount; 2 % for 20 days ≈ 44.6 %), clicked through every preset in
both languages at 1920×1080 and 375×812 (no console errors, no overflow), and ran about 70 rule-breaking mutations,
about 45 caught. Fixed after the review:

- **URL terms were snapped by the kit** (`?terms=45` gave 60 days, `?terms=%20` gave 0) before `normalise` saw them:
  the hidden `terms` param is now a `choice` of 0/30/60/90, and `num()` reads a blank string as junk. Checked in the
  browser: 45 and blank give 30, 90 gives 90, a click updates the URL.
- **Croatian plural "24 mjeseci"**: months are now a plural string (`monthsN`) and the phrasing "za plaćanje 24
  mjeseca unaprijed" agrees in every form.
- **The cost-of-capital value was unreadable inside its hatched bar**: the hatched bar never carries its label now.
- **The rate bar was labelled "discount"** next to 26.5 %: now "implied rate" / "stopa popusta".
- **"Same cost" with longer terms** was loose (the worth-today column does drop): the hint says "the same expense in
  the books", and the explanation adds that paying later is worth a little today, which is what early-payment
  discounts buy back.
- **Croatian wording**: "na papiru isplati", "usluga više nije potrebna", "ispod najmanje rezerve (od …)", "1 godina
  unaprijed", "priznaje se kao rashod mjesec po mjesec".
- **Tests**: the tie-break test now really depends on the comparator (payments are listed first inside `balance`,
  several events at one instant); new tests for a lowest balance of exactly 0 (below the minimum, not overdrawn), a
  0.5 % discount (not "no discount"), `balanceAt` at an event time, `tiedUp` with different event times, and every
  `normalise` bound. I re-ran five of the surviving mutations; each now fails a test.
- **Dead `lag` field dropped; `discount.js` header line corrected; SPEC rule 8 (each payment at its own time, no
  year-end convention), rule 9 (the `null` case) and rule 11 (13 two-decimal and 2 three-decimal cases) corrected;
  the check script prints percentages.**
- **Not changed:** the remaining survivors are equivalent on the param grid (no saving between 0 and 0.5 €, so
  `Math.round`/`Math.sign` in place of the money rounding cannot differ; guards in `impliedRate` that no reachable
  input hits; rounding variants that give the same euros).

## Time

Started 2026-11-07 03:30 (thread start), first passing gate 03:42, done 03:56: about 26 minutes. Model, SPEC check,
page and tests to a first passing gate took 12 minutes; the board and phone layout fixes, the fresh review (about 9
minutes of agent time, run in parallel with the notes), its fixes and the final checks took the rest.
