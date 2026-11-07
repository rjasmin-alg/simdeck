<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fin-fixed-variable: specification

Task `docs/tasks/w3/fin-fixed-variable.md`, catalogue `fin-fixed-variable` (§4.12). Class **explorer**: the state is a
pure function of the params (`sim.js` `compute`), no steps.

**One concept:** a platform's fixed cost spread over more users lowers the average cost per user; capacity is bought
in steps (blocks); the next user's marginal cost is not the average (usually far below it, and far above it when it
opens a new block); and the break-even volume between running the platform yourself and paying a service per user.

**The contrast on the stage:** average vs marginal cost, and fixed + steps vs a price per user. Two charts over
0–1 000 users: the cost a month (in-house staircase, the service's straight line, the fixed cost as a floor, the
break-even zone) and the cost per user a month (in-house average falling as a sawtooth, the service's flat price, the
next user's marginal cost low with a spike at every block edge). A marker at the chosen user count on both. Below:
what each side costs at that count, the average and the next user, the spare capacity, and the result.

## Costs (illustrative, made up but plausible)

| | symbol | value | source |
|---|---|---|---|
| fixed cost of the platform | `F` | param, 0–6 000 € a month (3 000): a share of the team's time, base licences, monitoring, whatever does not grow with users | *(check: order of magnitude)* |
| one capacity block | `S` | 500 € a month (a server with its storage, power, space and support) | *(check)* |
| a block's capacity at 100 % | `K` | 100 users | made up |
| variable cost per user | `v` | 2 € a month (storage, support tickets, backup space) | *(check)* |
| the service's price per user | `p` | param, 4–30 € a month (12) | *(check: per-user prices of hosted services span about 4–30 €)* |

All amounts are whole euros a month; the model is exact (integers). Only the averages are rounded, to the cent.

## Params

| key | control | range (default) | notes |
|---|---|---|---|
| `users` | range in the panel; also click or drag on either chart | 0–1 000, step 10 (400) | users of the platform (or of the service) |
| `util` | range in the panel | 50–100 %, step 5 (80) | target utilisation: how full each block is planned before the next one is bought |
| `fixed` | range in the panel | 0–6 000 €, step 500 (3 000) | `F` |
| `price` | range in the panel | 4–30 €, step 1 (12) | `p` |

Out-of-range or non-numeric values (from a URL) are clamped and snapped to their step (rounded to nearest); empty
values, `null`, booleans and non-numbers take the default (`normalise`).

## Rules

1. **Ties (first).**
   - a. **A full block stays one block:** the number of blocks is ⌈n ÷ cap⌉, so 80 users at cap 80 are 1 block, and
     the 81st opens the second.
   - b. **The next user opens a block** exactly when n is a multiple of cap (n = 0 included: the first user opens
     the first block).
   - c. **Equal monthly costs are even:** neither side is cheaper (`capEven`). At 0 users there is no outcome
     (`none`): nothing is compared, the page shows the fixed cost alone.
   - d. **Break-even counts equal as reached:** in-house "pays" at n when its cost is ≤ the service's.
   - e. **Averages** are rounded to the nearest cent, halves up (all amounts are positive). Of the average's three
     shares, the fixed share is rounded the same way and the block share is the rest (rounded average − fixed share −
     v), so the shares shown always add up to the average shown.
2. **Capacity per block** cap = K × util ÷ 100 users (50…100 users: the planned fill; the rest is headroom).
3. **Blocks** b(n) = ⌈n ÷ cap⌉; 0 users need no block.
4. **In-house cost a month** C(n) = F + S × b(n) + v × n: fixed + steps + variable. The service costs p × n.
   Difference = p × n − C(n): positive, running it yourself is cheaper; negative, the service is.
5. **Average cost per user** A(n) = C(n) ÷ n (none at 0 users), split into F ÷ n + S × b ÷ n + v. The fixed share
   falls as 1 ÷ n; the block share is a sawtooth between S ÷ cap and higher just after a step.
6. **Marginal cost of the next user** = C(n + 1) − C(n) = v, or v + S when the next user opens a block (rule 1b).
7. **Spare capacity** = b × K − n user places paid for and idle (headroom planned by `util` plus the unfilled part of
   the last block); its cost = S × spare ÷ K a month.
8. **Break-even.**
   - **Textbook** (steps spread smoothly): n̄ = F ÷ (p − v − S ÷ cap), the fixed cost over the margin per user;
     none when that margin is ≤ 0.
   - **First:** the smallest n ≥ 1 with C(n) ≤ p × n (rule 1d); the page says "no dearer", not "cheaper", since
     the costs may be equal there. C touches the textbook line at every full block and is
     above it elsewhere, so first ≥ n̄.
   - **For good:** the smallest n ≥ 1 from which C(m) ≤ p × m for every m ≥ n; none when the margin per full block
     (p − v) × cap − S is ≤ 0. Between *first* and *for good*, in-house is cheaper only in the last part of each block
     and dearer again after the next step: a zone, not a point.
   - Computed exactly per block: in block j (users (j − 1)·cap + 1 … j·cap) in-house pays from
     ⌈(F + S·j) ÷ (p − v)⌉ on. *For good* is the start of the paying tail of block j\* − 1, or j\*'s first user, where j\*
     is the first block whose first user already pays. (That fallback is reachable only when a block costs less than
     one user's margin, S < p − v, which the page's params never give; the promotable module allows it.)
   - The page draws the zone only when *for good* exists; where costs merely touch (no fixed cost, zero block margin)
     it says "never cheaper" and draws no zone.
9. **Changed mark:** when a param change changes the outcome (in-house cheaper, service cheaper, even, none at 0
   users), the result is marked changed.

## Presets (numbers checked by the script at the end)

F = 3 000 €, p = 12 € in all five; they differ in users and utilisation.

| # | id | users | util | blocks | in-house (fixed + steps + var) | service | result | average | next user | spare (cost) | first / for good | textbook |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `few-users` | 100 | 80 | 2 | 4 200 (3 000 + 1 000 + 200) | 1 200 | service cheaper by 3 000 | 42.00 | 2 | 100 (500) | 800 / 900 | 800 |
| 2 | `step-edge` | 400 | 80 | 5 | 6 300 (3 000 + 2 500 + 800) | 4 800 | service cheaper by 1 500 | 15.75 | 502 | 100 (500) | 800 / 900 | 800 |
| 3 | `grown` | 1 000 | 80 | 13 | 11 500 (3 000 + 6 500 + 2 000) | 12 000 | in-house cheaper by 500 | 11.50 | 2 | 300 (1 500) | 800 / 900 | 800 |
| 4 | `headroom` | 600 | 50 | 12 | 10 200 (3 000 + 6 000 + 1 200) | 7 200 | service cheaper by 3 000 | 17.00 | 502 | 600 (3 000) | none / none | none |
| 5 | `run-hot` | 800 | 100 | 8 | 8 600 (3 000 + 4 000 + 1 600) | 9 600 | in-house cheaper by 1 000 | 10.75 | 502 | 0 (0) | 600 / 650 | 600 |

The default is preset 2.

Also checked: 800 users at 80 % → 9 600 both, even (the textbook point; the next user opens block 11); 900 at 80 % →
10 800 both, even (the start of "for good"); 0 users → in-house 3 000 (fixed only), service 0, no average, no outcome,
the first user costs 502; 220 users at 80 % → average 22.45 = fixed 13.64 + blocks 6.81 + 2.00 (rule 1e); no fixed cost, 600 users at 50 % → 7 200 both, even, first 50, for good none (margin 0); the service at
6 €, 1 000 users at 100 % → in-house 10 000 vs 6 000, never pays.

## Legend

In-house (solid line `--c1`, round marker), the service (dashed line `--c2`, square marker), the fixed cost (dotted
line `--c3`), the next user's marginal cost (dotted line `--c4` with ▲ at each block edge, the scale's right end
included), the break-even zone
(hatched band), the chosen user count (ink line), changed (highlight).

## Captions (built from the state)

The main sentence: `capNone` (no users: the fixed cost against nothing; `capNoneFree` when the fixed cost is 0), else `capInhouse` / `capService` / `capEven`
with both monthly costs, the average and the price per user, and the difference. Then at most two notes, in order:
the next user, `nEdge` (it opens block b + 1: v + S) or `nNext` (it costs v, the average is mostly fixed and blocks);
none at 0 users; and break-even, `nBe` (first = for good: "no dearer from …"), `nZone` (first < for good) or
`nNever` (no "for good": at this price and utilisation a full block costs v + S ÷ cap per user, no less than p).
Prices per user are written with cents everywhere in a sentence (12,00 € beside 15,75 €).

## Misconceptions targeted

- "Running it ourselves costs 2 € per user." (Presets 1, 2: the next user costs 2 €, the average is 15.75 € or 42 €.)
- "Adding a user costs the average." (Preset 2: the 401st costs 502 €; preset 3: the 1 001st costs 2 €.)
- "Break-even is one number." (Presets 1–3: the textbook 800 users, but with steps in-house is cheaper for good only
  from 900.)
- "Spare capacity is free safety." (Preset 4: at 50 % the idle half costs 3 000 € a month and in-house never pays;
  preset 5: at 100 % break-even falls to 600–650, with no headroom left for peaks or queueing.)

## Out of scope

Investment and depreciation of the blocks (`fin-capex-opex`, `fin-depreciation`), discounting (`fin-npv-discounting`),
the full lifetime cost (`fin-tco`), allocating the cost to departments (`fin-chargeback`), latency as a function of
utilisation (`utilisation-latency`), a cost per usable TB with an erasure-coding overhead (`ec-vs-replication`;
a possible later preset), volume discounts on the service, migration cost, the fixed cost itself growing in steps.

## Terms (hr / en)

fiksni troškovi / fixed costs; varijabilni troškovi / variable costs; stepenasti troškovi / step costs; prosječni
trošak (po korisniku) / average cost (per user); granični trošak / marginal cost; točka pokrića / break-even point;
iskorištenost / utilisation; ciljana iskorištenost / target utilisation; rezerva kapaciteta / headroom; blok kapaciteta
/ capacity block; vlastita platforma / in-house platform; usluga po korisniku / per-user service; marža po korisniku /
margin per user.

## Check script

Run with `python3`; the preset test in `sim.test.js` compares `sim.js` with the same numbers. `first` and `be` are
checked against brute force (up to 20 000 users) over every param combination except those with a block margin of
1–40 €, whose "for good" lies further out; those 65 combinations were brute-forced separately up to 2 million users
by the reviewer, with no mismatch. Averages round halves up, as rule 1e says (Python's `round` would round them to
even).

```python
S = 500; K = 100; V = 2   # € per block-month, users per block at 100 %, € per user-month
def cap(u): return K * u // 100
def blocks(n, u): return -(-n // cap(u))
def cost(n, u, F): return F + S * blocks(n, u) + V * n
def ok(n, u, F, p): return cost(n, u, F) <= p * n
def first(u, F, p):
    c = cap(u)
    if p <= V: return None
    j = 1
    while j < 100000:
        lo = (j - 1) * c + 1; need = -(-(F + S * j) // (p - V)); m = max(lo, need)
        if m <= j * c: return m
        if (p - V) * c - S <= 0 and j > 1: return None
        j += 1
    return None
def be(u, F, p):
    c = cap(u); marg = (p - V) * c - S
    if p <= V or marg <= 0: return None
    j = 1
    while (p - V) * ((j - 1) * c + 1) - F - S * j < 0: j += 1
    if j == 1: return 1
    need = -(-(F + S * (j - 1)) // (p - V)); m = max((j - 2) * c + 1, need)
    return m if m <= (j - 1) * c else (j - 1) * c + 1
def brute(u, F, p, N=20000):
    oks = [ok(n, u, F, p) for n in range(1, N + 1)]
    f = next((i + 1 for i, x in enumerate(oks) if x), None)
    b = None
    for i in range(N - 1, -1, -1):
        if not oks[i]: b = i + 2; break
    else: b = 1
    if b > N - 2000: b = None
    return f, b
def smooth(u, F, p):
    m = p - V - S / cap(u)
    return None if m <= 0 else F / m
def view(n, u, F, p):
    c = cost(n, u, F); sv = p * n; b = blocks(n, u)
    avg = None if n == 0 else ((200 * c // n + 1) // 2) / 100     # cents, halves up (rule 1e)
    marg = V + (S if n % cap(u) == 0 else 0)
    spare = b * K - n
    return dict(blocks=b, fixed=F, steps=S * b, var=V * n, inhouse=c, service=sv, diff=sv - c,
                avg=avg, marg=marg, spare=spare, idle=S * spare / K,
                first=first(u, F, p), be=be(u, F, p), smooth=smooth(u, F, p))
for u in range(50, 101, 5):
    for F in range(0, 6001, 500):
        for p in range(4, 31):
            f, b = brute(u, F, p) if (p - V) * cap(u) - S > 40 or (p - V) * cap(u) - S <= 0 else (first(u, F, p), be(u, F, p))
            assert (f, b) == (first(u, F, p), be(u, F, p)), (u, F, p, f, b, first(u, F, p), be(u, F, p))
print('first/be agree with brute force')
cases = {
  'few-users':  (100, 80, 3000, 12),
  'step-edge':  (400, 80, 3000, 12),
  'grown':      (1000, 80, 3000, 12),
  'headroom':   (600, 50, 3000, 12),
  'run-hot':    (800, 100, 3000, 12),
  'tie 800':    (800, 80, 3000, 12),
  'tie 900':    (900, 80, 3000, 12),
  'zero users': (0, 80, 3000, 12),
  'no fixed':   (600, 50, 0, 12),
  'cheap svc':  (1000, 100, 3000, 6),
}
for k, a in cases.items(): print(f"{k:11}", view(*a))
# first/be agree with brute force
# few-users   {'blocks': 2, 'fixed': 3000, 'steps': 1000, 'var': 200, 'inhouse': 4200, 'service': 1200, 'diff': -3000, 'avg': 42.0, 'marg': 2, 'spare': 100, 'idle': 500.0, 'first': 800, 'be': 900, 'smooth': 800.0}
# step-edge   {'blocks': 5, 'fixed': 3000, 'steps': 2500, 'var': 800, 'inhouse': 6300, 'service': 4800, 'diff': -1500, 'avg': 15.75, 'marg': 502, 'spare': 100, 'idle': 500.0, 'first': 800, 'be': 900, 'smooth': 800.0}
# grown       {'blocks': 13, 'fixed': 3000, 'steps': 6500, 'var': 2000, 'inhouse': 11500, 'service': 12000, 'diff': 500, 'avg': 11.5, 'marg': 2, 'spare': 300, 'idle': 1500.0, 'first': 800, 'be': 900, 'smooth': 800.0}
# headroom    {'blocks': 12, 'fixed': 3000, 'steps': 6000, 'var': 1200, 'inhouse': 10200, 'service': 7200, 'diff': -3000, 'avg': 17.0, 'marg': 502, 'spare': 600, 'idle': 3000.0, 'first': None, 'be': None, 'smooth': None}
# run-hot     {'blocks': 8, 'fixed': 3000, 'steps': 4000, 'var': 1600, 'inhouse': 8600, 'service': 9600, 'diff': 1000, 'avg': 10.75, 'marg': 502, 'spare': 0, 'idle': 0.0, 'first': 600, 'be': 650, 'smooth': 600.0}
# tie 800     {'blocks': 10, 'fixed': 3000, 'steps': 5000, 'var': 1600, 'inhouse': 9600, 'service': 9600, 'diff': 0, 'avg': 12.0, 'marg': 502, 'spare': 200, 'idle': 1000.0, 'first': 800, 'be': 900, 'smooth': 800.0}
# tie 900     {'blocks': 12, 'fixed': 3000, 'steps': 6000, 'var': 1800, 'inhouse': 10800, 'service': 10800, 'diff': 0, 'avg': 12.0, 'marg': 2, 'spare': 300, 'idle': 1500.0, 'first': 800, 'be': 900, 'smooth': 800.0}
# zero users  {'blocks': 0, 'fixed': 3000, 'steps': 0, 'var': 0, 'inhouse': 3000, 'service': 0, 'diff': -3000, 'avg': None, 'marg': 502, 'spare': 0, 'idle': 0.0, 'first': 800, 'be': 900, 'smooth': 800.0}
# no fixed    {'blocks': 12, 'fixed': 0, 'steps': 6000, 'var': 1200, 'inhouse': 7200, 'service': 7200, 'diff': 0, 'avg': 12.0, 'marg': 502, 'spare': 600, 'idle': 3000.0, 'first': 50, 'be': None, 'smooth': None}
# cheap svc   {'blocks': 10, 'fixed': 3000, 'steps': 5000, 'var': 2000, 'inhouse': 10000, 'service': 6000, 'diff': -4000, 'avg': 10.0, 'marg': 502, 'spare': 0, 'idle': 0.0, 'first': None, 'be': None, 'smooth': None}
```
