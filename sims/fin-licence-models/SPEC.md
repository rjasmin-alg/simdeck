<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-licence-models: specification

Task `docs/tasks/w3/fin-licence-models.md`, catalogue `fin-licence-models` (§4.12; overlap §5.23: the shared ledger
of `fin-capex-opex`). Class **explorer**: the state is a pure function of the params (`sim.js` `compute`), no steps.

**One concept:** a perpetual licence is a large upfront purchase (capitalised, amortised) plus yearly maintenance at a
share of the list price; a subscription is a recurring expense; letting maintenance lapse and coming back costs
back-fees; per-user and per-core metrics grow differently as the hardware grows.

**The contrast on the stage:** the two options side by side, always. On top a scoreboard, one row per option: **cash
paid** by the end of the horizon (the lesser ticked), **expensed** (profit and loss), **still on the balance sheet**
(unamortised licences), and the **crossing year** in its own cell. Under it the stage's choices (metric, hardware
refresh, a maintenance lapse), then the licences each metric counts year by year (users, cores; the counted row
marked), then two charts: the **cash paid so far** (two step lines, the crossing year outlined) and the **expense of
each year** (perpetual: amortisation, maintenance, back-fees; subscription).

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `growth` | range, step 1 | 0–30 % a year (10) | user growth |
| `maint` | range, step 1 | 10–30 % of the list price a year (20) | maintenance share |
| `rise` | range, step 0.5 | 0–10 % a year (3) | price rises: new licences, maintenance and the subscription alike |
| `horizon` | range, step 1 | 3–10 years (7) | H |
| `sub` | hidden (URL), step 5 | 20–80 % of the list price a year (40) | the subscription fee per licence; a hidden param because the panel has room for four sliders and the concept does not need it moved |
| `metric` | stage buttons | `user` / `core` (`user`) | what one licence counts |
| `refresh` | stage buttons (none, 3, 4, 5 up to H) | 0, 2–10 (4); 0 or 1 = none; after H no effect | the hardware refresh year |
| `lapse` | stage buttons (never, 2…5 up to H − 1) | 0, 2…H − 1 (0) | the first year without maintenance |
| `gap` | stage buttons (shown with a lapse) | 1–3, at most H − lapse (2) | years lapsed; back in year lapse + gap ≤ H |

`normalise` clamps and snaps every number (non-numbers, `''` and `null` take the default), maps an unknown metric to
`user`, turns a lapse in year 1 into none, clamps the lapse to H − 1 and the gap to H − max(lapse, 1), so the return
always falls within the horizon.

## Constants (illustrative, `sim.js` `C`)

200 users in year 1; one server per 50 users; 16 cores per server, 32 from the refresh year on; list price of one
perpetual licence in year 1: 400 € per user or 1 250 € per core (so year 1 costs the same either way: 200 × 400 =
64 × 1 250 = 80 000 €); amortisation over 5 years; reinstatement fee 20 % of the back-maintenance.

## The ledger (`ledger.js`, copied from `fin-capex-opex`)

Rows 0…H: row 0 is day one (empty), row y is year y. Every payment falls on the first day of its year and sits in
that year's row with its expense, so at the end of each year cash so far = expensed so far + book value (the ledger's
identity; test). Each row holds `cash`, `capex` (licences bought), `dep` (amortisation) and `opex` (maintenance,
back-fees, the subscription). `licensing.js` (new, promotable) builds the rows; `ledger.shown` rounds the totals.

## Rules

All amounts in euros, computed in floating point, rounded only for display (rule 12).

1. **Counts.** users_y = 200 × (1 + growth)^(y − 1), tidied to a millionth then **rounded half up** (220.5 → 221);
   servers_y = ⌈users_y / 50⌉ (250 users → 5, 251 → 6); cores per server 16, or 32 **from** the refresh year on
   (the refresh year itself already has the new servers); cores_y = servers_y × cores per server. The metric's count
   is the need of year y.
2. **List price** of one licence in year y: base × (1 + rise)^(y − 1).
3. **Perpetual licences held** = the most ever needed so far (bought licences are kept); in year y the increase is
   bought at that year's list price.
4. **Amortisation** (IAS 38 ¶ 97: straight-line over the useful life, from when the asset is available for use): each
   year's purchase is capitalised and amortised in equal parts over 5 years, starting with a full year in the year it
   is bought (bought on its first day). What is not amortised by year H stays on the balance sheet.
5. **Maintenance** in year y = licences held × list price_y × `maint`, an expense of that year; none in a lapsed year.
6. **Lapse and back-fees.** Years `lapse` … `lapse` + `gap` − 1 pay no maintenance (licences are still bought if the
   need grows). In the return year R = `lapse` + `gap` the back-fee = (sum of the licences held in each missed year)
   × list price_R × `maint` × (1 + 20 %), an expense of year R, on top of that year's maintenance. *(check: practice
   varies; some vendors charge the missed years at the old prices, some a higher fee, some require buying anew.)*
7. **Subscription** in year y = need_y × list price_y × `sub`: paid and expensed that year; nothing on the balance
   sheet.
8. **Crossing year** (tie-breaks): the first year from which the subscription's cash paid so far, rounded to the
   euro, is **strictly greater** than the perpetual licence's in **every** remaining year of the horizon. Equal is not
   a crossing (preset `flat`: both 160 000 € in year 5, crossing in year 6). If the subscription is not dearer in year
   H, there is no crossing (0); a lead that is lost again before H does not count.
9. **Cheaper option:** the least cash paid by year H, rounded; both on a tie.
10. **Changed mark:** a change of the crossing year or of the cheaper option, after a param change, is highlighted.
11. **Caption:** `capCross` (crossing year, totals) or `capNever`; then at most two notes in this order: `nLapse`
    (years lapsed, maintenance skipped, the back-fee and the extra over staying current = total cash with the lapse
    − total cash without it), the metric note (`nCoreRefresh` per core with a refresh within the horizon, `nCore` per
    core otherwise, `nUser` per user: users and cores in year 1 and year H), then `nExpense` (year 1 of the perpetual
    licence: cash paid vs expensed).
12. **Display:** euros to the euro, half away from zero (ledger `roundMoney`, sums tidied to a millionth).

## Presets (numbers from the check script below; `sim.test.js` compares)

Defaults: growth 10 %, maintenance 20 %, rise 3 %, horizon 7, subscription 40 %, per user, refresh in year 4, no lapse.

| # | id | change | perpetual: cash / expensed / balance sheet | subscription cash | crossing | cheaper |
|---|---|---|---|---|---|---|
| 1 | `crossing` | – | 316 934 / 289 678 / 27 256 | 335 961 | year 6 | perpetual |
| 2 | `flat` | growth 0, rise 0 | 192 000 / 192 000 / 0 | 224 000 | year 6 (tie in 5) | perpetual |
| 3 | `lapse` | lapse 3, gap 2 | 328 030 / 300 774 / 27 256 | 335 961 | year 7 | perpetual |
| 4 | `per-core` | per core | 653 347 / 556 718 / 96 629 | 611 264 | none | subscription |
| 5 | `core-no-refresh` | per core, refresh none | 351 246 / 313 859 / 37 387 | 363 450 | year 7 | perpetual |
| 6 | `short` | horizon 3 | 152 243 / 107 830 / 44 413 | 109 334 | none | subscription |

Cash so far, preset 1: perpetual 96 000, 122 368, 152 243, 185 986, 224 524, 267 834, 316 934; subscription 32 000,
68 256, 109 334, 155 841, 208 604, 268 330, 335 961. Preset 3: perpetual 96 000, 122 368, 131 704, 142 194, 235 620,
278 931, 328 030; back-fee 54 889 in year 5 ((242 + 266) × 400 × 1.03⁴ × 0.2 × 1.2), maintenance skipped 43 792,
11 096 more than staying current. Preset 4: perpetual 96 000, 137 200, 158 418, 363 851, 417 875, 529 165, 653 347;
subscription 32 000, 73 200, 115 636, 220 538, 328 587, 458 425, 611 264. Counts (growth 10 %): users 200, 220, 242,
266, 293, 322, 354; cores 64, 80, 80, 192, 192, 224, 256 (refresh 4) or 64, 80, 80, 96, 96, 112, 128 (none).
Expense of the perpetual licence by year, preset 1 (amortisation, maintenance): (16 000, 16 000), (17 648, 18 128),
(19 515, 20 539), (21 613, 23 253), (24 044, 26 382), (10 734, 29 863), (12 143, 33 816); subscription 32 000,
36 256, 41 078, 46 506, 52 764, 59 726, 67 631. Year 1 of the perpetual licence: cash 96 000, expensed 32 000.

## Legend

Perpetual licence (●, solid line, `--c1`), subscription (■, dashed, `--c2`); less cash paid (✓); crossing year
(outlined column); changed (highlight). In the expense bars: amortisation (solid), maintenance (hatched), back-fees
(dotted), lapsed years (hatched background). The counted row of the counts strip: bold, ◀ and an accent edge; the
refresh year ⟳; a jump in cores per server underlined.

## Misconceptions targeted

- "The subscription is cheaper: 160 € against 400 €." (Preset 1: by year 6 it has paid more.)
- "The perpetual licence costs 96 000 € this year." (In cash; in profit and loss 32 000 €, the rest is an asset.)
- "Skipping maintenance saves money." (Preset 3: 11 096 € more in all, and two years without updates.)
- "Licences grow with the users." (Presets 4, 5: per core they grow with the hardware; a refresh doubles them.)
- "Owning is always cheaper in the long run." (Presets 4, 6: not within the horizon.)

## Out of scope

Discounting and NPV (`fin-npv-discounting`, `fin-roi-payback-npv`); tax and any country's rules; true-ups, audits,
volume discounts, minimum core counts per processor, licences per socket or per VM; buying back in instead of paying
back-fees; staying lapsed for good (no updates, a security risk); resale of licences; the cloud's commitments
(`fin-cloud-commitment`).

## Terms (hr / en)

trajna licenca / perpetual licence; pretplata / subscription; održavanje / maintenance; kataloška cijena / list
price; nematerijalna imovina / intangible asset; amortizacija / amortisation; korisni vijek uporabe / useful life;
bilanca / balance sheet; račun dobiti i gubitka / profit and loss; godina prijelaza / crossing year; prekid
održavanja / maintenance lapse; zaostalo održavanje i naknada za ponovnu aktivaciju / back-fees, reinstatement fee;
po korisniku / per user; po jezgri / per core; zamjena poslužitelja / hardware refresh.

## Check script

Run with `python3` (Decimal, 50 digits).

```python
from decimal import Decimal as Dd, getcontext, ROUND_HALF_UP, ROUND_CEILING
getcontext().prec = 50
D = lambda x: Dd(str(x))
def rnd(x):
    x = D(x)
    return int(x.quantize(Dd(1), rounding=ROUND_HALF_UP)) if x >= 0 else -int((-x).quantize(Dd(1), rounding=ROUND_HALF_UP))
U0, PER, LIST = 200, 50, {'user': D(400), 'core': D(1250)}
LIFE, FEE = 5, D('0.20')
def run(growth=10, maint=20, rise=3, horizon=7, sub=40, metric='user', refresh=4, lapse=0, gap=2):
    H = horizon; g = D(growth)/100; m = D(maint)/100; r = D(rise)/100; s = D(sub)/100
    users = {y: rnd(U0*(1+g)**(y-1)) for y in range(1, H+1)}
    servers = {y: -(-users[y]//PER) for y in users}
    cps = {y: 32 if (refresh and y >= refresh) else 16 for y in users}
    cores = {y: servers[y]*cps[y] for y in users}
    need = users if metric == 'user' else cores
    lst = {y: LIST[metric]*(1+r)**(y-1) for y in range(1, H+1)}
    held = {}; h = 0
    for y in range(1, H+1): h = max(h, need[y]); held[y] = h
    lapsed = set(range(lapse, lapse+gap)) if lapse else set()
    back_y = lapse+gap if lapse else None
    P = {y: dict(cash=Dd(0), capex=Dd(0), amort=Dd(0), maint=Dd(0), back=Dd(0)) for y in range(1, H+1)}
    S = {y: dict(cash=Dd(0), sub=Dd(0)) for y in range(1, H+1)}
    for y in range(1, H+1):
        bought = held[y] - (held[y-1] if y > 1 else 0)
        c = bought*lst[y]
        P[y]['capex'] = c
        for k in range(y, min(H, y+LIFE-1)+1): P[k]['amort'] += c/LIFE
        if y not in lapsed: P[y]['maint'] = held[y]*lst[y]*m
        if y == back_y:
            P[y]['back'] = sum(held[k] for k in lapsed)*lst[y]*m*(1+FEE)
        P[y]['cash'] = c + P[y]['maint'] + P[y]['back']
        S[y]['sub'] = need[y]*lst[y]*s; S[y]['cash'] = S[y]['sub']
    cumP = {}; cumS = {}; a = b = Dd(0)
    for y in range(1, H+1):
        a += P[y]['cash']; b += S[y]['cash']; cumP[y] = a; cumS[y] = b
    cross = None
    for y in range(H, 0, -1):
        if rnd(cumS[y]) > rnd(cumP[y]): cross = y
        else: break
    expP = sum(P[y]['amort']+P[y]['maint']+P[y]['back'] for y in P)
    book = sum(P[y]['capex'] for y in P) - sum(P[y]['amort'] for y in P)
    return dict(users=users, cores=cores, held=held, cumP={y: rnd(v) for y, v in cumP.items()}, cumS={y: rnd(v) for y, v in cumS.items()},
                cross=cross, expP=rnd(expP), book=rnd(book), totP=rnd(cumP[H]), totS=rnd(cumS[H]),
                yearP=[(rnd(P[y]['amort']), rnd(P[y]['maint']), rnd(P[y]['back'])) for y in P], yearS=[rnd(S[y]['sub']) for y in S],
                cashP=[rnd(P[y]['cash']) for y in P], back=rnd(P[back_y]['back']) if back_y else 0,
                skipped=rnd(sum(held[k]*lst[k]*m for k in lapsed)))
cases = {
 'crossing': {},
 'flat': dict(growth=0, rise=0),
 'lapse': dict(lapse=3, gap=2),
 'per-core': dict(metric='core'),
 'core-no-refresh': dict(metric='core', refresh=0),
 'short': dict(horizon=3),
}
for n, kw in cases.items():
    o = run(**kw); print('==', n, kw)
    for k in ('users', 'cores', 'held'): print('  ', k, list(o[k].values()))
    print('   cumP', list(o['cumP'].values())); print('   cumS', list(o['cumS'].values()))
    print('   cross', o['cross'], 'totP', o['totP'], 'totS', o['totS'], 'expP', o['expP'], 'book', o['book'], 'back', o['back'], 'skipped', o['skipped'])
    print('   yearP', o['yearP']); print('   yearS', o['yearS'])
base = run(); lap = run(lapse=3, gap=2); print('lapse extra vs staying current', lap['totP'] - base['totP'])
print('users g=5 y3', run(growth=5)['users'][3])
```
