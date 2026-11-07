<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-chargeback: specification

Task `docs/tasks/w3/fin-chargeback.md`, catalogue `fin-chargeback` (§4.12). Class **explorer**: the state is a pure
function of the params (`sim.js` `compute`), no steps.

**One concept:** a shared IT cost is allocated to departments by a key (users, VMs, storage, tickets); the key decides
who pays, not what it costs. Under chargeback a department compares its bill with an outside offer; charging a mostly
fixed cost per unit means a department that leaves raises everyone else's price, and the next one leaves (the spiral).

**The contrast on the stage:** the same shared cost seen two ways, as each department's bill (left: one row per
department, its bill against its own variable cost and its outside offer) and as the company's total (right: round by
round, the shared cost plus what the departments that left spend outside, against everyone in). Showback against
chargeback: shown bills are hollow and nobody moves; charged bills are solid and the spiral runs.

## Departments and costs (illustrative, made up but plausible)

Five departments, in this order (the order is the tie-break order). Units a month at 100 % usage:

| id | department (hr / en) | users | VMs | TB | tickets | outside offer € a month |
|---|---|---|---|---|---|---|
| `sales` | Prodaja / Sales | 56 | 12 | 8 | 60 | 10 000 |
| `acct` | Računovodstvo / Accounting | 28 | 16 | 12 | 40 | 5 500 |
| `dev` | Razvoj / Development | 40 | 120 | 52 | 48 | 34 000 |
| `sup` | Podrška korisnicima / Customer support | 100 | 16 | 8 | 200 | 13 000 |
| `mkt` | Marketing / Marketing | 24 | 36 | 20 | 52 | 8 000 |
| | total | 248 | 200 | 100 | 400 | 70 500 |

Variable cost a month per unit *(check)*: 10 € per user (endpoint management, per-user licences), 20 € per VM (compute,
power, a licence share), 10 € per TB (disks, backup), 5 € per ticket (parts, escalations; the desk's staff are fixed).
A department's own variable cost V is the sum over the four keys: sales 1 180, acct 920, dev 3 560, sup 2 400, mkt 1 420
(Σ 9 480).

The fixed part F of the shared cost (the team, the data centre, base licences) is a param, 30 000 € a month by default
*(check: order of magnitude for a small company's IT)*. The outside offer is what the department would pay a provider on
its own a month for what it uses *(made up; dev's is high because 120 VMs and 52 TB outside are dear)*.

All amounts are whole euros and all units whole numbers: every base value is a multiple of 4 and usage moves in
quarters, so every comparison is exact (integers). Bills are shown in whole euros, unit prices in cents.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `key` | choice in the panel | users, VMs, storage (TB), tickets; default users | the allocation key |
| `mode` | choice in the panel | shown (showback), charged (chargeback); default shown | |
| `fixed` | range in the panel | 0–60 000 €, step 5 000 (30 000) | F |
| `use_<id>` | − / + on the department's row (a hidden kit range keeps it in the URL) | 50–200 %, step 25 (100) | scales the department's units of every key, its variable cost and its offer |
| `out_<id>` | Leave / Come back on the row (a hidden kit toggle) | off / on (off) | the department is out by hand from round 1: it buys outside |

Out-of-range or non-numeric values (from a URL) are clamped and snapped to their step (rounded to nearest); empty
values, `null`, booleans and non-numbers take the default; an unknown key or mode takes the default; `out_<id>` is on
only for `true` or `"true"` (`normalise`).

## Rules

1. **Ties (first).**
   - a. **Bills add up to the shared cost.** Each bill is T × u ÷ U floored, and the euros left over (fewer than the
     number of departments) go one each to the largest remainders (T × u mod U); equal remainders go in the list's
     order. So by VMs, Accounting and Customer support (16 VMs each, 3 158.40) pay 3 159 and 3 158.
   - b. **A bill equal to the offer stays:** a department is over only when its exact bill is above its offer,
     T × u > q × U (integers, no rounding). Decisions never use the rounded bills.
   - c. **Equal excesses: the earlier department leaves.**
   - d. **One department leaves per round:** the one whose exact bill passes its offer by the most euros
     ((T × u − q × U) ÷ U, compared within the round, where U is common), even when several are over.
   - e. **The unit price** T ÷ U is rounded to the nearest cent, halves up; none when nobody is in.
2. **Departments at their usage:** units, the variable cost V and the offer q scale with `use` ÷ 100. The shared cost of
   a set of departments is T = F + Σ V over those in.
3. **The key's units** U = Σ u over those in.
4. **Bills:** each department in pays T × u ÷ U (rule 1a for whole euros). The total is the same for every key; the key
   only decides who pays. When one department's usage grows, the price per unit T ÷ U falls (and everyone else's bill
   with it) exactly when that department's own variable cost per unit of the key is below the current price, which
   holds whenever most of T is fixed (always at the default 30 000). With little or no fixed cost it can go the other
   way: by users at F = 0, Development growing from 100 % to 200 % raises the price from 38.23 to 45.28 €. The same
   condition, reversed, decides whether a departure raises or lowers the price for those left.
5. **Over:** a department is over when its exact bill is above its offer (rule 1b). In showback the page marks it
   "would leave if charged"; nobody moves.
6. **Leaving:** in chargeback the round's leaver (rules 1c, 1d) goes; the shared cost loses only its V, and the fixed
   part of its bill lands on those left, whose bills rise.
7. **The company's total** = T of those in + Σ q of those out (by hand or in the spiral). Everyone in, it is F + Σ V
   (39 480 by default). Every departure adds q − V > 0 to it (each offer is above its V at every usage).
8. **Rounds.** Showback is one round. Chargeback repeats rule 6 until nobody still in is over, or nobody is left; then
   the company still pays F (the fixed cost cannot be cut in the short run). At most five departures, six rounds.
   Outcomes: `show`; `stable` (charged, nobody leaves); `spiral` (one or more leave, someone stays); `collapse` (all
   leave in the spiral); `empty` (everyone out by hand, either mode).
9. **Changed mark:** after a param change, a department whose status (in, over, left in round r, out by hand) changed
   has its status highlighted; the result is highlighted when the outcome or the number of departures changed.

## Presets (numbers checked by the script at the end)

F = 30 000 € and usage 100 % unless said. Bills in whole euros; the unit price in euros per unit of the key.

| # | id | key, mode, change | round 1: T, unit price | bills sales / acct / dev / sup / mkt | outcome | company |
|---|---|---|---|---|---|---|
| 1 | `by-users` | users, shown | 39 480, 159.19 | 8 915 / 4 457 / 6 368 / **15 919** / 3 821 | show; sup over (15 919 > 13 000) | 39 480 |
| 2 | `by-vms` | VMs, shown | 39 480, 197.40 | 2 369 / 3 159 / **23 688** / 3 158 / 7 106 | show; nobody over | 39 480 |
| 3 | `dev-grows` | VMs, shown, dev 200 % | 43 040, 134.50 | 1 614 / 2 152 / 32 280 / 2 152 / 4 842 | show; nobody over (dev's offer 68 000) | 43 040 |
| 4 | `charged` | TB, charged | 39 480, 394.80 | 3 158 / 4 738 / 20 530 / 3 158 / 7 896 | stable | 39 480 |
| 5 | `one-leaves` | TB, charged, mkt out | 38 060, 475.75 | 3 806 / **5 709** / 24 739 / 3 806 / – | spiral: acct leaves (5 709 > 5 500); round 2: 37 140, 546.18, sales 4 370, dev 28 401, sup 4 369, nobody over | 50 640 |
| 6 | `spiral` | users, charged | 39 480, 159.19 | as preset 1 | spiral: sup, sales, acct, mkt leave; dev stays alone at 33 560 ≤ 34 000 | 70 060 |

Preset 6, round by round (T, unit price, company; who leaves): 39 480, 159.19, 39 480, sup · 37 080, 250.54, 50 080,
sales (14 030 − 10 000 beats acct's 7 015 − 5 500) · 35 900, 390.22, 58 900, acct · 34 980, 546.56, 63 480, mkt · 33 560,
839.00, 70 060, nobody.

Preset 5's forced departure: Marketing's bill with everyone in was 7 896; the company saves its V, 1 420, and the other
6 476 lands on the rest.

The default is preset 1.

Also checked: by users, charged, F = 20 000 → stable (sup pays 11 887 ≤ 13 000): with a smaller fixed part the spiral
never starts; F = 40 000 → collapse, all five leave (sup, sales, acct, mkt, dev), the company pays 40 000 + 70 500 =
110 500; everyone out by hand → T = 30 000, company 100 500, no unit price; no fixed cost, by users, dev out by hand →
dev's bill had been 1 529, below its V of 3 560, so the others now pay less (2 031 less in all).

## Legend

Bill charged (solid `--c1` bar), bill shown only (hollow dashed `--c1` bar), own variable cost (dotted `--c4` line),
outside offer (`--c2` ▼ with a dashed line), out: spent outside (hatched `--c2`, also the outside part of the company's
bar; the bill that pushed a department out is the thin `--c1` outline behind it), everyone in (ink line on the company's
bars), changed: the outcome or a department's status (highlight). The company's
bars: the shared cost (solid `--c1`), spent outside (hatched `--c2`).

## Captions (built from the state)

First, when departments are out by hand, one note on what moved to the rest, from the sum over those out of (bill
with everyone in − V): positive, `nForced` (one; the company saves only its V, the rest of its bill falls on the
others) or `nForcedN` (several, "in all"); negative, `nForcedSub` / `nForcedSubN` (their bills were below their V, the
others now pay less); zero, `nForcedEven` / `nForcedEvenN` (the others pay the same). Then the main sentence: `capShow` (the shared cost and the unit price; nobody pays, nobody leaves),
`capStable`, `capSpiral1` (one leaves, the price rises, nobody else passes their offer), `capSpiralN` (the first leaver,
the price from round 1 to the last round, how many leave in all), `capCollapse`, or `capEmpty` (`capEmptyFree` when F = 0: nothing is paid inside). The main sentence
names the mode as *showback* (prikaz troškova) or *chargeback* (interna naplata). Then `nWould` (showback: who would
leave first if charged: the largest excess among those in, rule 1d) and `nTotal` (the company's total against everyone
in, when they differ).

The result badge: showback `resShow` (`resShowOut` when some are out by hand: "nobody else leaves"), or `resShowOver`
(who leaves first if charged); `resStable` (`resStableOut`: the rest stay, the company pays more); `resSpiral` (how many
left in the spiral, and how much more the company pays than with everyone in, departments out by hand included);
`resCollapse`; `resEmpty` (`resEmptyFree` when F = 0).

## Misconceptions targeted

- "The allocation shows what each department costs." (Presets 1, 2: the same 39 480 €, and Customer support pays
  15 919 € or 3 158 € depending only on the key.)
- "My bill depends on my usage." (Preset 3: Development doubles its usage and every other bill falls.)
- "Showback and chargeback are the same numbers." (Presets 1, 6: the same bills; shown, nobody moves, charged, four
  departments leave.)
- "If a department leaves, its cost goes with it." (Preset 5: the company saves 1 420 €, Marketing's other 6 476 € lands
  on the rest, and Accounting follows.)
- "Letting departments buy outside when it is cheaper for them saves the company money." (Preset 6: the company pays
  70 060 € instead of 39 480 €.)

## Out of scope

Step costs in the shared platform (`fin-fixed-variable`), budgets and variances (`fin-budget-variance`), a blended or
activity-based key, transfer prices with a margin, cutting the fixed cost after departures, departments coming back,
negotiating the offers, taxes.

## Terms (hr / en)

ključ raspodjele / allocation key; zajednički troškovi / shared costs; prikaz troškova / showback; interna naplata /
chargeback; fiksni troškovi / fixed costs; varijabilni troškovi / variable costs; jedinična cijena / unit price; vanjska
ponuda / outside offer; spirala (odlazaka) / (death) spiral; vlastiti varijabilni trošak / own variable cost.

## Check script

Run with `python3`; the preset tests in `sim.test.js` compare `sim.js` with the same numbers, and a test compares the
spiral with an independent implementation over 1 248 param combinations.

```python
KEYS = ['users', 'vms', 'tb', 'tickets']
RATE = {'users': 10, 'vms': 20, 'tb': 10, 'tickets': 5}            # variable € a month per unit
DEPTS = ['sales', 'acct', 'dev', 'sup', 'mkt']                      # list order = tie-break order
BASE = {'sales': (56, 12, 8, 60), 'acct': (28, 16, 12, 40), 'dev': (40, 120, 52, 48),
        'sup': (100, 16, 8, 200), 'mkt': (24, 36, 20, 52)}          # users, VMs, TB, tickets at 100 %
QUOTE = {'sales': 10000, 'acct': 5500, 'dev': 34000, 'sup': 13000, 'mkt': 8000}
def units(d, k, use): return BASE[d][KEYS.index(k)] * use[d] // 100
def var(d, use): return sum(RATE[k] * units(d, k, use) for k in KEYS)
def quote(d, use): return QUOTE[d] * use[d] // 100
def cents(x, n): return (200 * x // n + 1) // 2                     # halves up (rule 1e)
def bills(T, ins, k, use):                                          # rule 1a: largest remainder
    U = sum(units(d, k, use) for d in ins)
    fl = {d: T * units(d, k, use) // U for d in ins}
    rem = {d: T * units(d, k, use) % U for d in ins}
    for d in sorted(ins, key=lambda d: (-rem[d], DEPTS.index(d)))[:T - sum(fl.values())]: fl[d] += 1
    return fl
def run(k, mode, F, use=None, out=()):
    use = dict({d: 100 for d in DEPTS}, **(use or {}))
    ins = [d for d in DEPTS if d not in out]; rounds = []
    while True:
        T = F + sum(var(d, use) for d in ins); U = sum(units(d, k, use) for d in ins)
        r = dict(T=T, unit=cents(T, U) if U else None,
                 company=T + sum(quote(d, use) for d in DEPTS if d not in ins))
        if not ins: rounds.append(r); break
        over = [d for d in ins if T * units(d, k, use) > quote(d, use) * U]      # rule 1b: equal stays
        r['bills'] = bills(T, ins, k, use); r['over'] = over; rounds.append(r)
        if mode == 'show' or not over: break
        lv = max(over, key=lambda d: (T * units(d, k, use) - quote(d, use) * U, -DEPTS.index(d)))  # 1c, 1d
        r['leaves'] = lv; ins.remove(lv)
    return rounds
cases = {
  'by-users':   ('users', 'show', 30000),
  'by-vms':     ('vms', 'show', 30000),
  'dev-grows':  ('vms', 'show', 30000, {'dev': 200}),
  'charged':    ('tb', 'charge', 30000),
  'one-leaves': ('tb', 'charge', 30000, None, ('mkt',)),
  'spiral':     ('users', 'charge', 30000),
  'fixed 20k':  ('users', 'charge', 20000),
  'fixed 40k':  ('users', 'charge', 40000),
  'all out':    ('users', 'charge', 30000, None, tuple(DEPTS)),
  'no fixed, dev out': ('users', 'show', 0, None, ('dev',)),
}
for name, a in cases.items():
    print(name)
    for i, r in enumerate(run(*a)): print('  round', i + 1, r)
```

Output:

```text
by-users
  round 1 {'T': 39480, 'unit': 15919, 'company': 39480, 'bills': {'sales': 8915, 'acct': 4457, 'dev': 6368, 'sup': 15919, 'mkt': 3821}, 'over': ['sup']}
by-vms
  round 1 {'T': 39480, 'unit': 19740, 'company': 39480, 'bills': {'sales': 2369, 'acct': 3159, 'dev': 23688, 'sup': 3158, 'mkt': 7106}, 'over': []}
dev-grows
  round 1 {'T': 43040, 'unit': 13450, 'company': 43040, 'bills': {'sales': 1614, 'acct': 2152, 'dev': 32280, 'sup': 2152, 'mkt': 4842}, 'over': []}
charged
  round 1 {'T': 39480, 'unit': 39480, 'company': 39480, 'bills': {'sales': 3158, 'acct': 4738, 'dev': 20530, 'sup': 3158, 'mkt': 7896}, 'over': []}
one-leaves
  round 1 {'T': 38060, 'unit': 47575, 'company': 46060, 'bills': {'sales': 3806, 'acct': 5709, 'dev': 24739, 'sup': 3806}, 'over': ['acct'], 'leaves': 'acct'}
  round 2 {'T': 37140, 'unit': 54618, 'company': 50640, 'bills': {'sales': 4370, 'dev': 28401, 'sup': 4369}, 'over': []}
spiral
  round 1 {'T': 39480, 'unit': 15919, 'company': 39480, 'bills': {'sales': 8915, 'acct': 4457, 'dev': 6368, 'sup': 15919, 'mkt': 3821}, 'over': ['sup'], 'leaves': 'sup'}
  round 2 {'T': 37080, 'unit': 25054, 'company': 50080, 'bills': {'sales': 14030, 'acct': 7015, 'dev': 10022, 'mkt': 6013}, 'over': ['sales', 'acct'], 'leaves': 'sales'}
  round 3 {'T': 35900, 'unit': 39022, 'company': 58900, 'bills': {'acct': 10926, 'dev': 15609, 'mkt': 9365}, 'over': ['acct', 'mkt'], 'leaves': 'acct'}
  round 4 {'T': 34980, 'unit': 54656, 'company': 63480, 'bills': {'dev': 21863, 'mkt': 13117}, 'over': ['mkt'], 'leaves': 'mkt'}
  round 5 {'T': 33560, 'unit': 83900, 'company': 70060, 'bills': {'dev': 33560}, 'over': []}
fixed 20k
  round 1 {'T': 29480, 'unit': 11887, 'company': 29480, 'bills': {'sales': 6657, 'acct': 3328, 'dev': 4755, 'sup': 11887, 'mkt': 2853}, 'over': []}
fixed 40k
  round 1 {'T': 49480, 'unit': 19952, 'company': 49480, 'bills': {'sales': 11173, 'acct': 5586, 'dev': 7981, 'sup': 19952, 'mkt': 4788}, 'over': ['sales', 'acct', 'sup'], 'leaves': 'sup'}
  round 2 {'T': 47080, 'unit': 31811, 'company': 60080, 'bills': {'sales': 17814, 'acct': 8907, 'dev': 12724, 'mkt': 7635}, 'over': ['sales', 'acct'], 'leaves': 'sales'}
  round 3 {'T': 45900, 'unit': 49891, 'company': 68900, 'bills': {'acct': 13970, 'dev': 19956, 'mkt': 11974}, 'over': ['acct', 'mkt'], 'leaves': 'acct'}
  round 4 {'T': 44980, 'unit': 70281, 'company': 73480, 'bills': {'dev': 28113, 'mkt': 16867}, 'over': ['mkt'], 'leaves': 'mkt'}
  round 5 {'T': 43560, 'unit': 108900, 'company': 80060, 'bills': {'dev': 43560}, 'over': ['dev'], 'leaves': 'dev'}
  round 6 {'T': 40000, 'unit': None, 'company': 110500}
all out
  round 1 {'T': 30000, 'unit': None, 'company': 100500}
no fixed, dev out
  round 1 {'T': 5920, 'unit': 2846, 'company': 39920, 'bills': {'sales': 1594, 'acct': 797, 'sup': 2846, 'mkt': 683}, 'over': []}
```
