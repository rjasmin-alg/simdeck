# fin-indexation-fx: Inflation, indexation and currency in a multi-year contract

| | |
|---|---|
| Task | `fin-indexation-fx` (wave 3, Finance basics for IT managers) |
| Catalogue entry | `fin-indexation-fx` in `docs/catalogue.md` §4.12 |
| Kind | build a new simulator |
| Folder | `sims/fin-indexation-fx/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | FIN |
| Topic / tags / level | `finance` / `contracts` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **a fixed price loses real value to inflation; an indexation clause passes inflation on (with a cap or a floor); a price in a foreign currency adds exchange-rate risk; nominal vs real euros**.

The student: run a five-year contract along inflation and exchange-rate paths, choose fixed, indexed or capped, and the currency.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.12.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Finance notes (all `fin-` tasks)

- **Who it is for:** IT managers who meet these terms in budgets and with finance; they know IT, not accounting. Each page shows one purchase or decision seen two ways (cash vs expense, nominal vs discounted, price vs lifetime cost); make that contrast the stage.
- **Generic principles only.** No product, vendor or software names; no country's tax law or VAT. Name the principle (straight-line depreciation over the useful life, NPV as the sum of discounted cash flows). Naming an accounting standard (IAS 16, IFRS 16) is fine in the explanation, not in the stage.
- **Numbers are illustrative.** Prices, rates and costs are made-up but plausible, in euros, and the page says so once; formulas and rules must be standard and are checked in SPEC.md with a small script.
- **Croatian practice:** the notes in catalogue §4.12 ("Where Croatian practice commonly differs") are not verified yet. Do not put them on the page; copy the one that applies into `NOTES.md` under "For the owner".
- **Croatian terms:** standard Croatian accounting terms (amortizacija, kapitalni izdaci, operativni troškovi, novčani tok, neto sadašnja vrijednost, točka pokrića, vremenska razgraničenja); list your choices in `NOTES.md` so the owner can check them in one place.
- **Balance sheet:** only where the entry asks for it (`fin-capex-opex`, `fin-lease-vs-buy`), as one or two lines (asset, liability), not a full statement.
- **Shared models (catalogue §5.23):** keep the ledger (cash, expense, book value by month) or the discounting in its own module file inside your sim folder, pure and tested, so the coordinator can promote it to `models/` later. When the entry builds on another `fin-` sim, copy its module (COMMON.md §6).
- **Learn tree:** the `npm run check` warning "in no leaf yet" is expected; suggest a leaf in your report (catalogue §4.12 has the proposed `money` area).

## Model and presets

_To be filled before building: state, what one step does, rules in order, tie-breaks, params, 3–6 presets with expected outcomes, step count, legend, captions, terms in both languages, misconceptions to target, out of scope._

## Steps

1. `kit/new-sim.sh fin-indexation-fx sims/fin-indexation-fx` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/fin-indexation-fx/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
