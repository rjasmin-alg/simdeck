<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-sunk-cost: notes

New stepper (task `docs/tasks/w3/fin-sunk-cost.md`, catalogue `fin-sunk-cost` §4.12; seed: the write-off from
`fin-depreciation`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **The contrast on the stage:** one project, two lanes deciding at the same gates: *by already spent* and *by still to
  spend*. The gate table puts both scores side by side for the same three options: benefit, cash and people's time
  still to come (= looking forward), then the money already spent and the old system's book value (= by already
  spent). The two scores differ only by the sunk amounts, so whatever the lanes do differently is the sunk money's
  doing.
- **The sunk rule, made exact:** "by already spent" charges the cash already spent to every way out (switch, stop:
  "it would be wasted") and the old system's book value to every option that retires it (continue, switch: "we would
  book a loss"). It still counts the people's time, so the opportunity cost is a separate lesson (preset 3, `value`
  slider) and does not blur the sunk one.
- **"Same whichever way" shown as arithmetic:** under every decided table one line counts the money already spent as a
  cost in every row (as it really is) and shows the order is unchanged (rule 7, tested over all params and gates).
  The old system's book value gets the same treatment in the outcome: "expensed on every path: written off, or
  depreciated while it runs".
- **Gates open, then decide** (two steps each): the open step shows the options and inputs with the scores hidden
  (`?`), so the class can vote; → reveals both rules' choices and applies them. 4 gates × 2 + 9 more months = 16 steps.
- **Gate 0 is a real gate:** before anything is spent the only sunk thing is the old system's book value, which is
  where the write-off bias shows on its own (preset `old-books`: the sunk rule keeps the old system to avoid a
  €180 000 "loss").
- **Comparisons run to their own end** (COMMON.md §11): at the last step each lane still building runs on, with no
  more gates, until it goes live (month 14 or 22 in the presets); the lane shows "→ m14" past month 12 and the outcome
  table compares whole-project nets. Months past 12 are not drawn.
- **The old system's book value** uses `asset.js` (copied from fin-depreciation, unchanged): a monthly straight-line
  schedule over a 60-month life, 36 months gone (cost = 2.5 × the book value today), `bookAt` for the book value at a
  gate and `disposal` (proceeds 0) for the write-off when a new system goes live. The `old` slider sets today's book
  value directly; its step (12 000) keeps the monthly charge whole.
- **Benefits are lumps** (value over the system's life once live, measured against keeping the old system),
  undiscounted, and do not shrink with delay: discounting is fin-npv-discounting, delay is fin-cost-of-delay.
- **The estimate is honest by the last gate** (the true length is the G3 estimate), but earlier estimates can be too
  short: in `no-way-out` the G2 estimate says 11 months to go and it is really 16, so the lanes end 240 000 apart
  where G2 said 40 000. The explanation says a forward decision is only as good as its estimate. The sunk rule can even come
  out better: with `moderate` overrun and a large old book value (e.g. `value` 5 000, `old` 240 000) it keeps the old
  system at G0 (net 0), while the forward rule starts on the 4-month estimate, which turns into 14 months, and switches
  at G2 (net −70 000). The caption says so (`gEndSunk`: "the estimate at the gate was wrong"). Kept: it is honest, and a good
  question for the class.
- **Tie-break:** the current course wins (at G0 keeping the old system, later continuing), then less cash still to
  spend, then continue, switch, stop. One reachable tie: `none`, `value` 5 000, `old` 240 000 at G0.
- **Marks:** building solid (series 1), product setup hatched (series 3), live dotted with ★ in the go-live month,
  old system kept dashed, gate choices ▶ / ↪ / ■ in a circle (dashed with `?` while a gate is open, `·` for a lane no
  longer building); the chosen score is outlined and marked ✓, the sunk columns shaded. Grayscale checked.
- **Phone:** lane names above their rows, month numbers and totals hidden, the table keeps the option and the two
  scores (the outcome keeps live and net).
- **Numbers in Croatian** use a no-break space as the thousands separator and before €.
- **No glossary terms** (none of these are in `kit/glossary.js`); the page does not link `glossary.js`.
- **Concepts, not tools:** no product, vendor or tax rule. IAS 16 (MRS 16) is named in the explanation only.

## Deviations from the task

- The task's "Model and presets" section was empty; `SPEC.md` fills it.
- "At each gate continue, stop or switch": the student decides by voting at the open step (scores hidden), not by a
  control that steers a third lane. A third "your choices" lane (params `g1`…`g3`) would not fit the stage or the
  panel with the two rule lanes; it is left as an idea for the owner (docs/tasks/OPEN.md is not touched: outside
  scope).

## Sources

- IAS 16 *Property, Plant and Equipment* ¶ 67–72: derecognition; the gain or loss is net disposal proceeds − carrying
  amount (the write-off at proceeds 0). Straight-line depreciation ¶ 62 (as fin-depreciation).
- Standard managerial-accounting treatment of relevant costs: sunk costs are irrelevant to a decision because they are
  the same under every alternative; relevant costs are future costs that differ between alternatives, including
  opportunity costs (e.g. Horngren, Datar, Rajan, *Cost Accounting: A Managerial Emphasis*, chapter on decision making
  and relevant information; Drury, *Management and Cost Accounting*, relevant costs). *(check: chapter numbers vary by
  edition, not checked against a copy)*
- Escalation of commitment: Staw, B. M. (1976), "Knee-deep in the big muddy", *Organizational Behavior and Human
  Performance* 16(1). *(check: citation from memory)*
- All amounts are illustrative (the page says so once): build €20 000/month + 4 people, planned 4 months, benefit
  €400 000; product €120 000 over 3 months, 2 people, benefit €320 000; €5 000 a person-month. *(check: plausibility
  only, no source)*

## For the owner

From catalogue §4.12, "Where Croatian practice commonly differs" (not verified, not on the page):

- `fin-capex-opex`, `fin-depreciation`: firms often book depreciation at the maximum rates the profit-tax rules allow,
  so computer equipment is commonly written off over two years, shorter than its useful life; low-value items
  (sitni inventar) are often expensed when put into use. (Here: an old IT system's book value is then often already
  0, so the write-off bias of preset 4 is weaker in Croatian practice than the page's five-year life suggests.)

## Term pairs

Not in `kit/glossary.js`; written out in the strings (*English* (hrvatski)):

- *sunk cost* (nepovratni trošak; "utonuli trošak" also used, an alias)
- *opportunity cost* (oportunitetni trošak)
- *book value* (knjigovodstvena vrijednost)
- *write-off* (otpis)
- *depreciation* (amortizacija)
- *escalation of commitment* (eskalacija predanosti) *(check: no settled Croatian term found)*
- *gate* (odluka, on the stage "O0"–"O3"; "kontrolna točka" would be the project-management term but is long)
- *person-month* (čovjek-mjesec)
- *ready-made product* (gotov proizvod)

## Shared requests

- **Promote `asset.js`** (`sims/fin-depreciation/asset.js @ 10381af`, copied unchanged): now used by fin-depreciation,
  fin-refresh-cycle and fin-sunk-cost. This sim uses it with monthly rows (`schedule(cost, 60, 0, 'sl')`), which it
  supports unchanged.

## Checks

- `node --test sims/fin-sunk-cost/sim.test.js`: 30 tests; each rule and tie-break was broken once (18 mutations of
  `sim.js`) and each break failed at least one test; a fresh reviewer then made 18 more, and the four that survived on reachable
  params got tests (open-gate table, the gate where the paths parted, which lane is named).
- `npm run gate -- fin-sunk-cost`: pass; screenshots 1920×1080 (light, dark, grayscale, help, panel hidden) and
  375×812 in hr and en reviewed, plus gate 2 decided, the last step and gate 0 of `old-books` at 1920×1080 and the
  last step at 375×812.

## Time

Start 05:13, done 06:30 (2026-11-07): 1 h 17 min, one session, with one break for a lost API connection after `SPEC.md`.
