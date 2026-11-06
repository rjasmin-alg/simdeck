<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-tco: specification

Task `docs/tasks/w3/fin-tco.md`, catalogue `fin-tco` (§4.12). Class **explorer**: the state is a pure function of
the params (`sim.js` `compute`), no steps.

**One concept:** the purchase price is a small part of the cost of owning something for several years (power, space,
support, staff time, training, migration and the exit at the end), so the cheaper purchase can be the dearer option;
build-vs-buy is the same sum with staff time as a cost.

**The contrast on the stage:** price vs lifetime cost. Two options, **A** and **B**, side by side, built from the same
eight cost lines. Each line shows what it adds over the horizon as a bar on one scale for the whole table, so a small
purchase bar sits next to the larger running costs. Under the lines: each option's total over the horizon with its
rank, the purchase's share of it, the ranking on the quote (price alone), and a strip of the cheaper option for every
horizon from 1 to 7 years, where the flip shows.

## Cost lines (`tco.js`, the order on the stage)

| key | line | when it is paid | unit | range, step |
|---|---|---|---|---|
| `purchase` | purchase price | once, at the start | € | 0–40 000, 500 |
| `setup` | set-up and migration in | once, at the start | € | 0–20 000, 500 |
| `training` | training | once, at the start | € | 0–10 000, 250 |
| `power` | power and cooling | every year | € a year | 0–5 000, 100 |
| `space` | space (rack, room) | every year | € a year | 0–5 000, 100 |
| `support` | support, licences and fees | every year | € a year | 0–30 000, 100 |
| `staff` | staff time | every year | hours a year, × 50 €/h | 0–1 000 h, 10 h |
| `exit` | exit: migration out, data export, disposal | once, at the end | € | 0–20 000, 500 |

The staff rate is a fixed 50 €/h, the loaded cost of an hour of own staff (salary, contributions, overhead)
*(check: plausible order of magnitude, illustrative)*.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `horizon` | range in the panel, step 1 | 1–7 years (5) | how many years the comparison covers |
| `a_<line>`, `b_<line>` | a bar on the stage per line and option (drag, or arrow keys; hidden ranges keep them in the URL) | the table above (preset 1) | the amounts of each option |
| `on_<line>` | a switch at the start of each row on the stage (hidden toggles) | on | the line counts for both options, or for neither |
| `pair` | hidden choice: `servers`, `build`, `exit` (`servers`) | | which names A and B carry; set only by presets |

Out-of-range or non-numeric amounts (from a URL) are clamped to the line's range and snapped to its step; non-numbers
take the default (`normalise`). A toggle is on unless it is `false` (the kit reads `true`/`1` as on).

## Rules

All amounts are whole euros, so every sum is exact; there is no rounding except the share (rule 6).

1. **Ties (first).** Equal totals rank neither option first: the result is a tie (`'tie'`), no "cheaper by". The same
   for the quote (equal purchase prices) and for each year of the strip. A tie is never a flip (rule 7), but a tie at the chosen horizon still gets the horizon note when the strip crosses
   (rule 8).
2. **A line over the horizon H.** Once at the start or at the end: its amount, whatever H is (the exit is paid once,
   in the last year). Every year: amount × H. Staff time: hours × 50 × H. A line that is switched off adds 0 to both
   options.
3. **Total (TCO)** of an option = the sum of its lines over H (rule 2). Nominal euros: no discounting, no price rises
   (out of scope; `fin-npv-discounting` discounts).
4. **Ranking:** the lower total is cheaper, by the difference; equal totals tie (rule 1).
5. **On the quote:** the ranking by the purchase price alone, whether or not the purchase line is switched on: what
   the two offers show before anything else is counted.
6. **Share of the purchase:** purchase ÷ total, as a whole percent rounded half up; shown only when the purchase line
   is on and the total is above 0.
7. **The flip:** when the quote has a strict winner and the total has the other one as a strict winner, the cheaper
   purchase is the dearer option (caption note `nFlip`).
8. **The strip:** the ranking for every horizon 1…7 with the switches as they are. Each total is (one-off part) +
   H × (yearly part), so the difference A − B is linear in H and changes sign at most once: the strip reads A…A, then
   perhaps one tie, then B…B (or the other way round). When the winners at H = 1 and H = 7 are both strict and
   differ, the caption says up to which horizon the first one is cheaper (the last H it wins) and from which the
   other is (the first H it wins).
9. **Changed mark:** when a param change changes the winner (A, B or tie), the totals row is marked changed.

## Presets (numbers checked by the script at the end)

Option amounts (€, staff in hours a year); lines not listed are 0.

- **servers** (A: the cheaper server, B: the dearer, efficient server with a support contract):
  A purchase 6 000, setup 1 500, power 1 200, space 1 000, staff 70 h, exit 1 000;
  B purchase 10 000, setup 1 500, power 700, space 600, support 1 200, staff 30 h, exit 1 000.
- **build** (A: build it in house, B: buy a ready-made service): A purchase 4 000, power 400, space 500, staff 500 h,
  exit 1 000; B setup 7 500, training 2 500, support 15 000, staff 80 h, exit 6 000.
- **exit** (A: a service that is costly to leave, B: own equipment): A setup 1 000, training 500, support 8 400,
  staff 20 h, exit 9 000; B purchase 12 000, setup 2 500, training 1 000, power 900, space 900, support 1 000,
  staff 80 h, exit 1 500.

| # | id | pair | switches | H | A / B total | cheaper | quote | share A / B | strip 1…7 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `cheaper-purchase` | servers | all on | 5 | 37 000 / 32 500 | B by 4 500 (flip) | A | 16 % / 31 % | A A B B B B B |
| 2 | `short-horizon` | servers | all on | 2 | 19 900 / 20 500 | A by 600 | A | 30 % / 49 % | A A B B B B B |
| 3 | `price-only` | servers | purchase only | 5 | 6 000 / 10 000 | A by 4 000 | A | 100 % / 100 % | A A A A A A A |
| 4 | `build-vs-buy` | build | all on | 5 | 134 500 / 111 000 | B by 23 500 | B | 3 % / 0 % | A B B B B B B |
| 5 | `staff-free` | build | staff off | 5 | 9 500 / 91 000 | A by 81 500 (flip) | B | 42 % / 0 % | A A A A A A A |
| 6 | `exit-cost` | exit | all on | 5 | 57 500 / 51 000 | B by 6 500 (flip) | A | 0 % / 24 % | A A B B B B B |

Also checked: preset 6 with the exit switched off → 48 500 / 49 500, A by 1 000, strip A A A A A B B (the exit
flips the ranking at 5 years); everything switched off → 0 / 0, a tie, no share, strip all ties; the servers with
A's power at 1 500 → strip A = B B B B B (tie at 2 years: "A up to 1 year, B from 3").

## Legend

Purchase price (solid bar, `--c1`), other one-off costs at the start or the end (bar with diagonal hatching, `--c2`),
running costs every year (bar with horizontal stripes, `--c3`), a line switched off (hollow, dashed outline), cheaper
over the horizon (★ badge), changed (highlight).

## Captions (built from the state)

The main sentence (`capCheaper` A or B cheaper over H years by d, with both totals; `capTie` equal totals;
`capNothing` when every line is switched off), then at most two notes in this order: `nFlip` (rule 7: the cheaper
purchase is the dearer option) and `nHorizon` (rule 8: up to which horizon one is cheaper, from which the other).

## Misconceptions targeted

- "The cheaper offer is the cheaper option." (Presets 1, 6: the quote ranks A first, the total ranks B; preset 3 shows the quote alone.)
- "Our own people are free, they are on the payroll anyway." (Presets 4, 5: staff time switched off makes building
  look ten times cheaper.)
- "Leaving costs nothing." (Preset 6: the exit flips the ranking.)
- "The ranking is a property of the options." (Presets 1, 2: it depends on the horizon.)

## Out of scope

Discounting and the cost of capital (`fin-npv-discounting`, `fin-lease-vs-buy`); price rises and indexation
(`fin-indexation-fx`); depreciation and the expense view (`fin-capex-opex`); a refresh within the horizon
(`fin-refresh-cycle`); costs that grow with age; resale value at the exit; fixed vs variable costs per user
(`fin-fixed-variable`); downtime and risk (`fin-downtime-cost`, `fin-ale-risk`); tax.

## Terms (hr / en)

ukupni trošak vlasništva / total cost of ownership (TCO); nabavna cijena / purchase price; jednokratni trošak /
one-off cost; tekući (godišnji) trošak / running (yearly) cost; uvođenje i migracija / set-up and migration;
izlazak (trošak izlaska) / exit (exit cost); vrijeme djelatnika / staff time; razdoblje usporedbe / horizon;
razviti ili kupiti / build or buy; ponuda / quote.

## Check script

Run with `python3`; the preset test in `sim.test.js` compares `sim.js` with the same numbers.

```python
CATS = ['purchase','setup','training','power','space','support','staff','exit']
YEARLY = {'power','space','support','staff'}
RATE = 50; HMAX = 7
def line(c, v, H):
    if c == 'staff': return v * RATE * H
    return v * H if c in YEARLY else v
def tco(o, on, H): return sum(line(c, o[c], H) for c in CATS if on[c])
def win(a, b): return 'a' if a < b else 'b' if b < a else 'tie'
def pct(x, t):  # half up, whole percent
    return None if t == 0 else (200 * x + t) // (2 * t)
def view(A, B, on, H):
    ta, tb = tco(A, on, H), tco(B, on, H)
    strip = ''.join({'a':'A','b':'B','tie':'='}[win(tco(A,on,h), tco(B,on,h))] for h in range(1, HMAX+1))
    sa = pct(A['purchase'], ta) if on['purchase'] else None
    sb = pct(B['purchase'], tb) if on['purchase'] else None
    return dict(a=ta, b=tb, win=win(ta,tb), diff=abs(ta-tb), price=win(A['purchase'],B['purchase']), share=(sa,sb), strip=strip)
O = lambda **k: dict({c: 0 for c in CATS}, **k)
ALL = {c: True for c in CATS}
servers = (O(purchase=6000, setup=1500, power=1200, space=1000, staff=70, exit=1000),
           O(purchase=10000, setup=1500, power=700, space=600, support=1200, staff=30, exit=1000))
build = (O(purchase=4000, power=400, space=500, staff=500, exit=1000),
         O(setup=7500, training=2500, support=15000, staff=80, exit=6000))
exitp = (O(setup=1000, training=500, support=8400, staff=20, exit=9000),
         O(purchase=12000, setup=2500, training=1000, power=900, space=900, support=1000, staff=80, exit=1500))
cases = {
  'cheaper-purchase': (*servers, ALL, 5),
  'short-horizon':    (*servers, ALL, 2),
  'price-only':       (*servers, {c: c == 'purchase' for c in CATS}, 5),
  'build-vs-buy':     (*build, ALL, 5),
  'staff-free':       (*build, dict(ALL, staff=False), 5),
  'exit-cost':        (*exitp, ALL, 5),
  'exit-cost, exit off': (*exitp, dict(ALL, exit=False), 5),
  'all off':          (*servers, {c: False for c in CATS}, 5),
  'tie at 2 years':   (dict(servers[0], power=1500), servers[1], ALL, 5),
}
for k, v in cases.items(): print(f"{k:22}", view(*v))
# cheaper-purchase  a 37000  b 32500  win b diff 4500   price a share (16, 31)   strip AABBBBB
# short-horizon     a 19900  b 20500  win a diff 600    price a share (30, 49)   strip AABBBBB
# price-only        a 6000   b 10000  win a diff 4000   price a share (100, 100) strip AAAAAAA
# build-vs-buy      a 134500 b 111000 win b diff 23500  price b share (3, 0)     strip ABBBBBB
# staff-free        a 9500   b 91000  win a diff 81500  price b share (42, 0)    strip AAAAAAA
# exit-cost         a 57500  b 51000  win b diff 6500   price a share (0, 24)    strip AABBBBB
# exit-cost, exit off a 48500 b 49500 win a diff 1000   price a share (0, 24)    strip AAAAABB
# all off           a 0      b 0      win tie diff 0    price a share (None, None) strip =======
# tie at 2 years    a 38500  b 32500  win b diff 6000   price a share (16, 31)   strip A=BBBBB
```
