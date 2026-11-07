<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-indexation-fx: notes

New explorer (task `docs/tasks/w3/fin-indexation-fx.md`, catalogue `fin-indexation-fx` §4.12). Rules and expected
numbers: `SPEC.md`.

## Decisions

- **The buyer's view, yearly payments in advance.** Five yearly payments at the start of each contract year, the
  price changed at each anniversary by the past year's inflation. With payment and price level on the same dates a
  fully indexed price is worth exactly the signing price every year (real 100 000 €), which makes "indexation passes
  inflation on" visible as a flat line. The one-year lag of real indexation clauses is in the explanation ("the past
  year's inflation"), not modelled further.
- **Fixed price carries a premium (default 4 %).** Without one, a fixed price would always be cheapest for the buyer
  whenever inflation is positive, which hides why vendors index. At 2 % a year a 4 % premium almost exactly matches
  full indexation in real terms (500 004 against 500 000 €), so the default shows the trade-off rather than a winner.
  The premium applies to the fixed price only.
- **One clause for cap and floor ("indexed with a cap and floor").** The catalogue's "capped" with "a cap or a
  floor": one clause with both bounds as sliders (floor −3…3 %, cap 0…10 %). A floor above the cap is lowered to the
  cap (SPEC rule 5); the board's subtitle shows the floor actually used.
- **The board compares all three clauses on the same paths; the row name picks the one the chart shows.** That is
  COMMON.md §11's "run the others to their own end". A ✓ marks the least for the buyer in each total (paid and
  worth), all tied rows, none when all three tie.
- **The chart is marks and lines on a zoomed axis, not bars from zero.** The differences are a few percent of
  100 000 €; bars from zero would hide them and bars from a cut axis mislead. Paid ● solid, worth ■ dashed, the price
  at signing a dotted line.
- **Dollar as the foreign currency, named.** "A foreign currency" in the abstract is hard to read on a projector;
  the dollar is the most common foreign currency in IT contracts priced outside the euro area. Only the currency is
  named, no country's rules. The signing rate (0.80 € per USD) and the four rate paths are made up but plausible.
  *(If the owner prefers a generic "foreign currency", only `curUsd`, `fxN` and `usd` strings change.)*
- **One inflation path for the index and the deflator, also in dollars.** A dollar contract would in practice be
  indexed to a dollar price index; using the same path keeps one path to read and isolates the exchange-rate
  effect. Said in the explanation.
- **Paths are choices, not sliders.** Three inflation paths (steady 2 %, a spike 3/9/6/3 %, low 1/0/−1/1 % with a
  fall to test the floor) and four exchange-rate paths (flat, euro weakens, euro strengthens, swings). The values are
  shown under each year on the chart, so the panel has no hints (the panel had to fit 1080 px).
- **Controls.** Clause: the board's row names (buttons, `aria-pressed`). Currency and, in dollars, the rate path:
  stage buttons. Inflation path, premium, cap, floor: the panel. `clause`, `cur` and `fx` are hidden kit params, so
  they stay in the URL and presets set them.
- **Phone.** The board drops the year-5 column, the chart its value labels and the lines under each year (the
  caption says what the cap and floor held); year labels shrink to the number.
- **Module.** `indexation.js` (price level, cap/floor clamp, factors, the contract in nominal and real euros, the
  exchange-rate effect, money rounding) is pure and words-free, registered as `SimdeckModels.indexation`, so the
  coordinator can promote it to `models/` unchanged. Nothing is copied from another sim (no discounting is needed;
  `roundMoney` is re-implemented in four lines with the same rule as `discount.js`).

## Sources

- Nominal vs real amounts, deflating by a price index: Brealey, Myers & Allen, *Principles of Corporate Finance*,
  the chapter on the discount rate and inflation ("nominal vs real cash flows"); any introductory macroeconomics text
  (price index, real value).
- Indexation (price adjustment) clauses with caps and floors, currency of the contract price as exchange-rate risk:
  general contract and procurement practice; corporate-finance texts on foreign-exchange risk (Brealey, Myers &
  Allen, the chapter on managing international risks: transaction exposure).
- Numbers: made up but plausible; checked with a 50-digit Decimal script (end of `SPEC.md`) before coding, then by
  the preset test. No local course material exists for FIN.

## Unchecked *(check)*

- **The premium size** (4 % for five years fixed) is illustrative, not from a source *(check)*.
- **Euro-area indexation practice** (HICP or the national CPI, applied yearly on the anniversary): named in SPEC
  only, not on the page *(check)*.
- **Chapter titles** in Brealey-Myers differ between editions *(check)*.
- **Croatian terms** below, especially "euri s dana potpisa" for real (signing-day) euros, "indeksacija s
  granicama" for a capped and floored clause and "godišnjica" for the contract anniversary *(check)*.

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| inflation | inflacija |
| price level | razina cijena |
| price index | indeks cijena |
| indexation clause | klauzula o indeksaciji |
| indexed price | indeksirana cijena |
| fixed price | fiksna cijena |
| premium (for a fixed price) | premija |
| cap | gornja granica |
| floor | donja granica |
| nominal euros | nominalni euri |
| real euros, signing-day euros | realni euri, euri s dana potpisa |
| exchange rate | tečaj |
| exchange-rate (currency) risk | tečajni rizik |
| foreign currency | strana valuta |
| (contract) anniversary | godišnjica (ugovora) |

## For the owner

- Catalogue §4.12 "Where Croatian practice commonly differs", the line for this sim (not verified, not on the page):
  "Croatia has used the euro since 2023, so the currency risk lies in contracts priced in another currency (often US
  dollars)."
- The page names the US dollar as the foreign currency (see Decisions). Confirm, or ask for a generic currency.

## Shared requests

- **`indexation.js`** could become `models/indexation.js` if another contract page (`fin-licence-models`'s yearly
  price rises, `fin-tco`) needs indexed prices or real euros; nothing needs it yet.
- **Glossary:** add the term pairs above.
- **Kit (optional):** a hidden param still needs the page's own `.sd-ctl[hidden] { display: none; }` (as in
  `fin-prepay-discount`).
- **Kit:** when a URL param is invalid, `coerce`/`normalise` (kit.js) fall back to the spec's `value`, not to
  `defaults[key]`, although `docs/sim-ui.md` §5 says "defaults win"; a page that passes only `defaults` then shows
  "NaN" on a slider (`?premium=abc`) and writes `undefined` into the URL. Worked around here with `value:` on every
  spec. Smallest fix: fall back to `defaults[key]` when `value` is absent. Other sims probably have the same defect.
- **Learn tree:** suggested leaf `money / worth-it / time-value` (catalogue §4.12 outline), next to
  `fin-npv-discounting`.

## Review

A fresh reviewer (separate agent, given only the files) read the code against `SPEC.md` (every rule and tie-break
matches), re-ran the SPEC script (table reproduced), swept all 203 112 reachable param combinations, tried odd URLs
in a headless browser (no console errors, no overflow), and ran 71 rule-breaking mutations: 64 caught, 7 survived,
6 of them equivalent (floor before cap in `adjust`, ranking on raw instead of rounded totals, the two −0 guards,
caption checks on raw values, nFloor before nCap). Fixed after the review:

- **Non-numeric URL params showed "NaN%"** on the slider (`?premium=abc`) and junk choices wrote `undefined` into the
  URL: the kit falls back to a spec's `value`, so every param spec now has `value: L.defaults[key]` (see Shared
  requests). Checked in the browser: `?premium=abc&cur=gbp&fx=zzz` shows 4 % and euros.
- **"The buyer gains what the vendor loses"** was wrong when the premium outweighs inflation (the default is 4 € the
  other way): the fixed-price note now has two forms, `nFixed` (general) and `nFixedDearer` (fixed real total above
  indexed, with the difference). SPEC rule 10 and tests updated; a tie is not dearer.
- **Fixed in dollars on a flat rate** read "runs from €104,000 to €104,000": new `nFixedUsdFlat`.
- **Phone: the ✓ "least for the buyer" was colour only**: the ✓ and its key stay on the phone.
- **Croatian:** "na 1 godišnjici" (locative) with the number first ("Na 2 godišnjice rast je zadržala gornja
  granica"); imperfective present ("pokriva", "zadržava … prolazi", "plaća se", "štedi"); "podijeljen s razinom";
  concept "indeksacija prenosi inflaciju, tečaj dodaje rizik"; "koleba se" for a swinging rate.
- **The floor** is "the smallest yearly change" (it may be above 0), not "limits the fall"; English captions say
  "held back the rise on 2 anniversaries" / "held up the change".
- **Tests:** the `swings` path (the one real survivor) now has its numbers checked; the two new caption rules each
  fail their test when broken.

## Time

Started 2026-11-07 10:10 (thread start), first passing gate 10:20, review back and fixed by 10:32, done 10:35: about
25 minutes. Model, SPEC check, page and tests to a first passing gate took 10 minutes; the fresh review (about 6
minutes of agent time, run in parallel with the notes and the full test run), its fixes and the final checks took the
rest.
