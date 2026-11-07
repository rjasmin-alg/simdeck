<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-chargeback: notes

New explorer (task `docs/tasks/w3/fin-chargeback.md`, catalogue `fin-chargeback` §4.12). Rules and expected numbers:
`SPEC.md`.

## Decisions

- **The contrast on the stage:** the same shared cost seen two ways.
  - *Left:* one row per department, with its bill, its own variable cost and its outside offer.
  - *Right:* the company's total round by round: the shared cost, plus what the departments that left spend outside,
    against everyone in.
  - Showback bills are hollow (shown only), chargeback bills solid (charged).
- **What the shared cost is made of:** a fixed part F (a param), plus each department's own variable cost: 10 € per
  user, 20 € per VM, 10 € per TB and 5 € per ticket a month. Only the variable part follows usage. That is why any key
  is arbitrary for the fixed part, and why a department that leaves saves the company only its variable cost.
- **The unit cost from `fin-fixed-variable`:** the price per unit of the key is the average cost T ÷ U. A departure
  saves only the marginal (variable) cost, so the average for those left rises. This is the same average-vs-marginal
  point, applied to departments. The shared cost here has no step costs; they are `fin-fixed-variable`'s subject and
  would add a second mechanism. `allocation.js` copies only `cents` (rounding to the cent, halves up) from
  `sims/fin-fixed-variable/stepcost.js @ 68befed`, with that comment. `stepcost.js` is not in `models/` yet (see
  Shared requests).
- **Outside offers:** a fixed amount a month per department, scaled with its usage. The model reads it as "what the
  department would pay a provider on its own". Each offer is far above the department's variable cost, so every
  departure makes the company as a whole pay more (rule 7).
- **The spiral is computed, not stepped:** the class is explorer. In chargeback, `compute` runs rounds until nobody is
  over, and the page shows every round at once on the right. One department leaves per round: the one whose bill is
  over its offer by the most euros. Ties go to the earlier department. This makes "the next one leaves" visible as a
  sequence. Leaving all at once would hide the chain.
- **Exact decisions:** usage moves in quarters and every base value is a multiple of 4, so all units, costs and offers
  are integers. "Over" is T × u > q × U (exact), and a bill equal to the offer stays. Bills are shown in whole euros by
  the largest-remainder method, so they always add up to the shared cost (ties in list order). Unit prices are shown
  in cents.
- **Usage and leaving are on the stage**, as −/+ and Leave / Come back buttons on each row. The panel holds only the
  key, the mode and the fixed part. The 10 per-department params are kept in the URL by hidden kit controls
  (`visible: () => false`). The kit's `.sd-ctl` display rule beats the `hidden` attribute, so the page hides them
  with `.sd-ctl[hidden] { display: none; }` (see Shared requests).
- **Stage buttons:**
  - They keep keyboard focus across re-renders: the page refocuses the button with the same `data-act`.
  - They don't take focus on a click (mousedown cancelled), like the kit's buttons.
  - At a limit they are `aria-disabled`, not `disabled`.
- **Departments out by hand:** these drop out from round 1 in both modes. In chargeback this lets the student start
  the spiral (preset 5). The caption begins with what the company saves (the department's variable cost) and how much
  of its bill falls on the rest. If its bill was below its own variable cost (possible with a small fixed part), the
  caption says the others now pay less.
- **Croatian grammar:** the department names are of different genders (Prodaja, Računovodstvo, Razvoj, Podrška
  korisnicima, Marketing). Sentences that name one therefore use present-tense verbs, which agree in number only
  ("izlazi"), or "tog odjela", never a gendered past participle. The department "Finance" is called "Accounting /
  Računovodstvo" for the same reason ("Financije" is plural).
- **The mode term:** the captions name it in the term style: on Croatian pages *Showback* (prikaz troškova) and
  *Chargeback* (interna naplata), English in italics with the Croatian in parentheses. The panel's choice reads
  "Računi se prikazuju / naplaćuju" ("Bills are shown / charged").
- **Grayscale:**
  - a charged bill is a solid bar, a shown bill a hollow dashed bar;
  - out is hatched;
  - the own variable cost is a dotted line, the offer a ▼ with a dashed line;
  - a row's status is written out, and its left border differs (solid in, double over, dashed out);
  - the result badge carries ● or ✕.
- **No glossary terms:** none of these terms are in `kit/glossary.js`. The strings write the pairs out, and the page
  does not link `glossary.js`, like the other `fin-` pages.
- **No `entries`:** no preset needs its own line on the home page. `related`: `fin-fixed-variable`.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- The catalogue's Croatian title is used as is. The English title is the catalogue's "Showback and chargeback".
- Tags `costs` and `budgeting` (the task's), topic `finance`. Both tags exist in `tags.json`.

## Sources

- Allocating shared or overhead costs by an allocation base (cost driver), and the difference between showback
  (informational reports) and chargeback (internal billing to the department's budget). Standard cost and management
  accounting (cost allocation, service-department costs) and IT financial management practice.
- The spiral: the textbook warning that allocating fixed costs per unit makes users who can leave do so, raising the
  rate for the rest (the "death spiral" of full-cost transfer pricing and cost allocation). Here it is shown with an
  outside offer as each department's alternative.
- Numbers: made up but plausible, checked by the script at the end of `SPEC.md` and by an independent reference
  implementation in `sim.test.js` over 1 248 param combinations.

## Unchecked *(check)*

- The variable rates: 10 € per user, 20 € per VM, 10 € per TB, 5 € per ticket a month.
- 30 000 € a month as the fixed part of a small company's shared IT cost (team, data centre, base licences).
- The outside offers (10 000, 5 500, 34 000, 13 000, 8 000 € a month), and each department's usage profile.
- The Croatian terms below, in particular "prikaz troškova" for showback, "interna naplata" for chargeback, and
  "vanjska ponuda".

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| showback | prikaz troškova |
| chargeback | interna naplata |
| allocation key | ključ raspodjele |
| shared costs | zajednički troškovi |
| fixed costs | fiksni troškovi |
| variable costs | varijabilni troškovi |
| own variable cost | vlastiti varijabilni trošak |
| unit price | jedinična cijena |
| outside offer | vanjska ponuda |
| (death) spiral | spirala (odlazaka) |
| cross-subsidy (aliases only) | unakrsno subvencioniranje |
| cost centre (aliases only) | mjesto troška |

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs": none of the four notes applies to
`fin-chargeback`. They are about depreciation rates, lease accounting, currency and the fiscal year, and this page
allocates a monthly cost. Nothing to copy.

## Shared requests

- **Kit: `.sd-ctl[hidden] { display: none; }`.** A param with `visible: () => false` gets `hidden` on its wrapper, but
  `.sd-ctl`'s `display` wins, so the control still shows. The page carries the rule locally. Once the kit has it, the
  page rule can go.
- **Promote `allocation.js` to `models/allocation.js`** if a later sim allocates a shared cost. It is pure, has no
  words, and registers on `SimdeckModels.allocation`. Its tests are the rule 1–8 tests in `sim.test.js` that call
  `A.` directly.
- **Promote `sims/fin-fixed-variable/stepcost.js`** (already requested there). This sim then takes `cents` from it
  instead of the copy.
- **Glossary:** add the term pairs above.
- **Learn tree:** add `fin-chargeback` to the existing leaf `money` → `real-cost` → `per-user` ("Trošak po korisniku
  i tko ga plaća" / "Cost per user, and who pays it"), after `fin-fixed-variable`.

## Review

A fresh reviewer (a separate agent, given only the files and the rules) ran the SPEC script and compared it with
`sim.js` over 3 744 param sets, with no mismatch. It also searched 600 000 random states for reachable edge cases and
tried 72 rule-breaking mutations. No wrong number was found in the model. 13 mutations survived; 7 of them behave
exactly like the original. Each of the other 6 is now covered by a test and re-checked as killed:
- who would leave first: the largest excess among those in, not the list order or everyone;
- the result mark on a change of numbers alone;
- the caption with exactly two departures;
- out by hand with a stable outcome, and a shift of only 3 €;
- `Infinity` from a URL taking the default.

Fixed defects:
- **Croatian gender:** "prvi izlazi Podrška korisnicima" (on the default page) and "za prvim" are now "najprije
  izlazi" and "a zatim".
- **"Growing lowers everyone's price" was stated without its condition** in the explanation and in SPEC rule 4. It
  holds while most of the cost is fixed (the grower's own cost per unit below the price). By users at no fixed cost,
  Development growing raises the price (38.23 → 45.28 €). Both now say so.
- **The "out by hand" note at a zero shift** said the others pay less. `nForcedEven(N)` now says they pay the same,
  and the several-department notes speak of the sum ("in all", "together").
- **The result badge:**
  - The spiral's extra cost now reads "more than with everyone in", since it includes departments out by hand.
  - In showback with a department out it said "nobody leaves"; it now says "nobody else leaves".
- **"The fixed 0 €"** with everyone out and no fixed cost: `capEmptyFree` and `resEmptyFree`.
- **The legend** now has the "everyone in" line, and "changed" (shortened from "the outcome changed") covers department statuses too.
- **Croatian style:** "zajednički trošak od …", "vanjske ponude od …".
- **Strings:** the unused `baseTag` and `roundUnit` are dropped.

Also checked after the fixes: in 31 205 random chargeback spirals, the price for those left always rises (the caption
says so).

## Time

Started 2026-11-07 06:30, done 07:00: about 30 minutes.
- Design, numbers script and model: about 8 minutes.
- Strings, page and tests: about 12 minutes. The kit does not hide `visible: false` controls by itself.
- The review (about 9 minutes, run while NOTES were written) and its fixes: the rest.
