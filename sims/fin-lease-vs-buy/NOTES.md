<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-lease-vs-buy: notes

New explorer (task `docs/tasks/w3/fin-lease-vs-buy.md`, catalogue `fin-lease-vs-buy` §4.12, needs
`fin-npv-discounting`, ledger model §5.23). Rules and expected numbers: `SPEC.md`.

## Decisions

- **All three ways always side by side.** The catalogue's "choose the financing" is read as choosing the financing
  *terms* (rental, term, residual, loan rate, end of term, how the lease is booked), not picking one way to look at:
  the concept is the comparison, so cash, loan and lease are each one row of the scoreboard, one line of the cash chart
  and one bar per year of the expense chart.
- **The two comparisons are columns next to each other.** "Cash paid in total (nominal)" and "NPV at the cost of
  capital" each tick their best way; the default preset already disagrees (cash pays least, the 6 % loan has the best
  NPV at 8 %). "Still owned" sits between them, because the residual value is what the nominal sum leaves out.
- **Balance sheet as two numbers per way** (asset, liability) at the end of a chosen year (or day one), as the finance
  notes allow, not a statement.
- **The lease is on the balance sheet by default** (IFRS 16, the international standard), with "as rent" one click away;
  both give the same total expense over the lease, the first front-loaded.
- **Same horizon for every way.** With "extend" the bought server is also kept the extra year, so all three are compared
  over T + 1 years. The server's value follows one straight line (price → residual at the end of the term, on at the
  same pace, floored at 0); the bought server's book value follows the same line (useful life to the firm = the term,
  residual value = R, IAS 16 ¶ 6). That keeps "owned at the end" and "book value" one number.
- **Buy-out price = residual value = market value at the end.** So buying out never changes the NPV (it pays what the
  server is worth); the caption says so. A buy-out price that differs from the market value is out of scope.
- **The loan rate doubles as the lessee's borrowing rate** for the lease liability (the "incremental borrowing rate"),
  so the page has one rate fewer. Rates are annual effective; monthly j = (1 + i)^(1/12) − 1, which makes "a loan at the
  cost of capital has the same NPV as cash" exact (with a nominal rate / 12 it would be off by a few euros).
- **Payments at the end of each month**, loan and lease alike (stated in the stage footnote). Many leases are paid in
  advance; that would shift the lease's NPV by about one month of interest.
- **The panel holds the presets and the four rates; term, end of term, books and balance-sheet year are button groups on
  the stage.** Nine controls in the panel did not fit 1920×1080 (1 539 px against 926). The price is a hidden param
  (URL only, default 60 000 €): every amount scales with it, so it adds nothing to the concept.
- **Picks compare amounts rounded to the euro**, and every tied way is ticked (a loan at the cost of capital ties with
  cash although the floats differ in the last bits).
- **Modules.** `discount.js` is the `fin-npv-discounting` copy, unchanged apart from its header (`models/discount.js`
  does not exist yet; COMMON.md §6); a test compares it with the source line by line. `financing.js` is new: the
  capex-opex ledger idea (cash, capex, depreciation, expense) plus interest and a liability line, pure and words-free, so
  it can move to `models/` unchanged. I did not copy `sims/fin-capex-opex/ledger.js`: it has no liability line, which
  a loan and a lease need, and changing it is not mine (see Shared requests).

## Sources

- Lease vs buy as "lease vs borrow and buy", discounting at the cost of capital vs at the borrowing rate, the
  equivalent loan: Brealey, Myers & Allen, *Principles of Corporate Finance*, ch. 25 ("Leasing").
- Lessee accounting: IFRS 16 *Leases* ¶ 22–38 (right-of-use asset at the present value of the lease payments,
  discounted at the rate implicit in the lease or else the incremental borrowing rate; depreciation straight-line;
  interest on the liability; the front-loaded expense). Short-term and low-value exemptions (¶ 5–8) and the old
  operating-lease treatment are the "as rent" switch.
- Depreciation, useful life and residual value: IAS 16 *Property, Plant and Equipment* ¶ 6, 50–62.
- Level annuity instalment A = P j / (1 − (1 + j)^−n): any finance text; annual effective to monthly rate: same.
- Discounting: copied model, sources in `sims/fin-npv-discounting/NOTES.md`.
- Numbers: made-up but plausible; checked with a Decimal (50-digit) script (end of `SPEC.md`) before coding, then by the
  preset tests. No local course material exists for FIN.

## Unchecked *(check)*

- **Which rate to discount a lease at.** The catalogue asks for the cost of capital; finance texts (Brealey-Myers ch.
  25) argue lease payments are debt-like and should be discounted at the (after-tax) borrowing rate. The page follows
  the catalogue and says in the explanation that setting the cost of capital equal to the loan rate gives the textbook
  comparison *(check with the owner which framing the course wants)*.
- **Extension treated as reasonably certain from the start** (the extra year is in the IFRS 16 lease term from day
  one). In practice an unplanned extension is a lease modification at that time *(check)*.
- **Buy-out not in the lease liability** (treated as not reasonably certain at the start): the buy-out is a purchase at
  the end of the term *(check)*.
- **Value after the term** continues the straight line (60 000 € → 12 000 € over three years → 0 € a year later in the
  "extend" preset). A real three-year-old server would likely keep some value *(illustrative)*.
- Croatian terms below, especially "ostatak vrijednosti" for residual value, "imovina s pravom uporabe" and "obveza po
  najmu" (as in the Croatian translation of IFRS 16, MSFI 16), "otkup" for buy-out *(check)*. The reviewer notes
  "pravo korištenja" is common in practice for "pravo uporabe".
- **Cost of capital vs a cheap loan.** With the cost of capital read as what the firm's own money earns elsewhere, a
  loan below it beats cash (the default preset). Standard theory treats fairly priced debt as zero-NPV; the
  explanation says the result holds only if the money really earns that much elsewhere *(check the framing)*.

## Term pairs (not in `kit/glossary.js`; for the coordinator, `"src": "simdeck"`)

| en | hr |
|---|---|
| lease | leasing (najam) |
| rental (lease payment) | najamnina |
| residual value | ostatak vrijednosti *(check)* |
| buy-out | otkup |
| extension | produljenje |
| right-of-use asset | imovina s pravom uporabe (pravo korištenja) |
| lease liability | obveza po najmu |
| loan, instalment | kredit, anuitet (rata) |
| interest | kamata |
| depreciation | amortizacija |
| balance sheet | bilanca |
| asset / liability | imovina / obveza |
| cost of capital | trošak kapitala |
| net present value (NPV) | neto sadašnja vrijednost (NSV) |
| nominal / discounted | nominalno / diskontirano |

## For the owner

- From catalogue §4.12 "Where Croatian practice commonly differs" (not verified, not on the page): *firms reporting
  under the Croatian standards (HSFI) usually still expense operating-lease instalments, where the international
  standard puts a right-of-use asset and a liability on the lessee's balance sheet.* The page's "as rent" switch shows
  exactly that treatment, without naming HSFI.

## Shared requests

- **Promote `discount.js` to `models/discount.js`** (already requested by `fin-npv-discounting` and
  `fin-roi-payback-npv`); then point this page at `../../models/discount.js` and drop the local copy, its copy test and
  the "discount.js" test block.
- **Ledger model with a liability line.** `fin-capex-opex`'s `ledger.js` (cash, capex, dep, opex) cannot carry a loan or
  a lease. `financing.js` here is a superset (adds `interest`, `rent` and `debt`; `totals` gives cash, expense, asset,
  liability with cash = expense + asset − liability). When `models/ledger.js` is promoted, the smallest change is an
  optional `debt` (and `interest`) field per row and a `liability` total, defaulting to 0, so every capex-opex result
  stays the same; then `buyCash` / `buyLoan` / `lease` could sit on top of it. Until then `financing.js` stands alone.
- **Glossary:** add the term pairs above.
- **Kit (optional):** a hidden param still needs the page's own `.sd-ctl[hidden] { display: none; }` (the kit's
  `.sd-ctl` display rule overrides the `hidden` attribute); `fin-roi-payback-npv` has the same line.

## Review

A fresh reviewer (separate agent, no context beyond the files) read the code against `SPEC.md`, reproduced every preset
number with the SPEC script, clicked through the page headless in both languages and ran 46 rule-breaking mutations:
32 caught, 4 equivalent (the `tidy` rounding guard and two caption conditions that never differ on the param grid),
10 survived. Each survivor now has a test (year clamped to the clamped term, junk and fractional years, unknown `end`,
the owned value discounted over H with an extension that leaves value, the lease year of the books note, `flipped` on
the nominal pick, `capSame` on a partial tie, loan interest over the whole term, the right-of-use as rent), and I
re-ran eight of those mutations to see the new tests fail. Defects found and fixed:

- **The buy-out note lost an amount** ("pays more at the end"): `{r}` was used twice and `t.parts` moves one node; now
  `{r}` and `{v}`.
- **Preset "Dear money" said the lease pays the most cash** (the loan does): hint and the `sim.json` entry fixed.
- **The books note at a 0 % loan rate** claimed front-loaded interest where there is none: no `nRou` at 0 %.
- **"As rent" looked like a free choice**: the explanation and SPEC now say IFRS 16 allows it only for short or
  low-value leases.
- **`nRou` put the expense "on the balance sheet"**: now "with the lease on the balance sheet, its expense …", and it
  says higher at first, lower later (true for every year).
- **Phone:** the scoreboard needed a sideways scroll to reach the NPV; a phone now shows the two comparisons (cash paid,
  NPV) and leaves "still owned" and the balance sheet to wide screens.
- **Wording:** Croatian "unatoč kamatama od {i}"; the extension hint no longer says the server is "already paid for"
  (the lessee never owns it); the explanation defines the cost of capital as what the firm's own money earns elsewhere.
- **SPEC:** rule 12 matched to the code (`nRouDay`, no `nLoanDear`), the buy-out stated as decided only at the end
  (IFRS 16 ¶ 27(d), 32), the IAS 16 citation limited to the term, the `price=` URL case explained.
- **Not changed:** the Croatian thousands separator already is U+00A0 in the page (the reviewer read the source escape
  as a space).

## Time

Started 2026-11-07 02:56 (thread start), first passing gate 03:11, done 03:23: about 27 minutes. Model, SPEC
check, page and tests to a first passing gate took 15 minutes; the fit to one screen (moving four controls onto the
stage), the fresh review (about 8 minutes of agent time), its fixes and the final checks took the rest.
