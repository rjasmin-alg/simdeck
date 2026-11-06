# fin-ale-risk: Expected annual loss and the price of a control

| | |
|---|---|
| Task | `fin-ale-risk` (wave 3, Finance basics for IT managers) |
| Catalogue entry | `fin-ale-risk` in `docs/catalogue.md` §4.12 |
| Kind | build a new simulator |
| Folder | `sims/fin-ale-risk/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | FIN, DR, SEC |
| Topic / tags / level | `finance` / `risk` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **ALE = single loss expectancy × annual rate of occurrence; a control is worth its yearly cost when it removes more ALE than that; accept, reduce, transfer (insurance) or avoid; a rare large loss hides behind a small average**.

The student: add risks with a loss and a frequency, buy controls and insurance, watch ALE, control cost and the worst simulated year.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.12.

## Sources

- `/home/rjasmin/projects/faultline/js/engine/`, `/home/rjasmin/projects/faultline/js/samples.js`, `/home/rjasmin/projects/faultline/PEDAGOGY.md`
- Catalogue seed: ransomware-321 (an immutable copy as a control), faultline → §5.23

## Finance notes (all `fin-` tasks)

- **Who it is for:** IT managers who meet these terms in budgets and with finance; they know IT, not accounting. Each page shows one purchase or decision seen two ways (cash vs expense, nominal vs discounted, price vs lifetime cost); make that contrast the stage.
- **Generic principles only.** No product, vendor or software names; no country's tax law or VAT. Name the principle (straight-line depreciation over the useful life, NPV as the sum of discounted cash flows). Naming an accounting standard (IAS 16, IFRS 16) is fine in the explanation, not in the stage.
- **Numbers are illustrative.** Prices, rates and costs are made-up but plausible, in euros, and the page says so once; formulas and rules must be standard and are checked in SPEC.md with a small script.
- **Croatian practice:** the notes in catalogue §4.12 ("Where Croatian practice commonly differs") are not verified yet. Do not put them on the page; copy the one that applies into `NOTES.md` under "For the owner".
- **Croatian terms:** standard Croatian accounting terms (amortizacija, kapitalni izdaci, operativni troškovi, novčani tok, neto sadašnja vrijednost, točka pokrića, vremenska razgraničenja); list your choices in `NOTES.md` so the owner can check them in one place.
- **Balance sheet:** only where the entry asks for it (`fin-capex-opex`, `fin-lease-vs-buy`), as one or two lines (asset, liability), not a full statement.
- **Shared models (catalogue §5.23):** keep the ledger (cash, expense, book value by month) or the discounting in its own module file inside your sim folder, pure and tested, so the coordinator can promote it to `models/` later. When the entry builds on another `fin-` sim, copy its module (COMMON.md §6).
- **Learn tree:** the `npm run check` warning "in no leaf yet" is expected; suggest a leaf in your report (catalogue §4.12 has the proposed `money` area).

## Overlaps (catalogue §5)

- **§5.23 Money: one ledger, and costs on top of existing models:** One shared ledger model (a month-by-month timeline with three lines: cash, expense, book value) under the capex, accruals, variance, lease and licence pages, like §5.21's shared domain; depreciation and refresh share one asset model; fin-npv-discounting holds the discounting the investment pages reuse, so build it first. The money pages do not repeat the technical ones: fin-downtime-cost takes the hours down from rpo-rto's timeline (link, or an "in money" preset on rpo-rto) and turns an error budget's minutes into euros; fin-ale-risk links ransomware-321 as a priced control; fin-fixed-variable links utilisation-latency (headroom costs money, too little costs latency) and could take ec-vs-replication's overhead as a cost per usable TB preset.

## Model and presets

_To be filled before building: state, what one step does, rules in order, tie-breaks, params, 3–6 presets with expected outcomes, step count, legend, captions, terms in both languages, misconceptions to target, out of scope._

## Steps

1. `kit/new-sim.sh fin-ale-risk sims/fin-ale-risk` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/fin-ale-risk/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
