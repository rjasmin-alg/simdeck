<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-four-eyes: specification

Explorer (task `docs/tasks/w3/cmp-four-eyes.md`, catalogue `cmp-four-eyes` §4.13). One concept: a second approval
catches a bad request only when the approver is independent and actually looks; as the queue grows the time per item
falls and approval becomes automatic, so the catch rate drops while the record still shows two signatures; reviewing
the risky few in depth beats reviewing everything thinly.

Code: `approval.js` (rules 1–6, pure and wordless, promotable to `models/`), `sim.js` (rules 7–8), the page
`index.html`, words in `strings.js`. Tests: `sim.test.js`. Everything here is illustrative: one made-up firm, made-up
requests and numbers; the page says so once and that it simplifies and is not legal advice.

## State and what a change does

An explorer: no steps. The state is a pure function of the params (`compute`). Every control (the panel's, and the
stage's "New requests" button, key N) sets params, and the state is recomputed.

## Rules

1. **The stream.** A month of one team's requests: N = 300, of which 30 are high-risk (a privileged access right, a
   change to production, a payment over the limit) with 9 bad ones among them, and 270 routine with 3 bad ones
   (12 bad, 9 of them high-risk). The kinds `[9 high bad, 21 high, 3 routine bad, 267 routine]` are put in arrival
   order by a Fisher–Yates shuffle from mulberry32(seed + 7919), i from N − 1 down to 1, j = ⌊r · (i + 1)⌋. Then each
   request, in arrival order, takes one draw u from mulberry32(seed). The draws do not depend on any setting (common
   random numbers): the same u decides a request under every policy, load and approver (tie-break), so more time
   never catches fewer, and the two policies are compared on the same draws.
2. **The approver's day.** The approver has `BUDGET` = 60 minutes a day for approvals and a queue of `load` ∈ {10, 20,
   40, 80, 160} requests a day, with the same mix as the stream (10 % high-risk). The team's stream is part of that
   queue; the minutes per request (rule 3) apply to it.
3. **Minutes per request.** Evenly (`all`): t = 60 / `load` (6, 3, 1.5, 0.75, 0.375). By risk (`risk`) with a share
   `deep` ∈ {10, 20, 30, 50} %: D = `deep` · `load` requests a day in depth (an integer for every pair), each
   t_deep = min(15, 60 / D) minutes; the rest share what is left, t_thin = max(0, (60 − D · t_deep) / (`load` − D)).
   The hour is always used in full, never more. When D · 15 ≥ 60 the in-depth reviews take the whole hour and the rest
   get 0 (tie-break: exactly 60, as at 40 a day and 10 %, also leaves 0).
4. **Which requests get depth.** In the stream, the first round(`deep` · 300) requests in risk order: high-risk first
   in arrival order, then routine in arrival order (tie-break). From 10 % on, every high-risk request is in depth.
   Evenly: none. `deep` · 300 is a whole number for every share, so the rounding (half up, `Math.round`) never
   matters on the page; for other inputs a fraction below .5 rounds down.
5. **The look.** A request reviewed for t minutes: under `GLANCE` = 1 minute it is not opened, p = 0 (the signature
   is a click); from 1 minute on (exactly 1 minute looks, tie-break) p = q · (1 − e^(−t / 4)), q = 1 for an
   independent approver and 0.25 for one who is not (a colleague on the same team, or someone reporting to the
   requester). The floor holds for in-depth requests too: at 160 a day with 50 % in depth each gets 45 s, so nothing
   is opened (the page draws those tiles and slots as signed unread). This is the random-search detection formula (Koopman), with made-up constants. A bad request is
   caught (rejected) when u < p (rule 1); a good request is always approved (wrongly rejected good requests are out of
   scope). The expected catch rate is the mean of p over the 12 bad requests.
6. **The record.** Every request carries two signatures, the requester's and the approver's, whether approved or
   rejected: the record shows 300 of 300, and a test of "every request has a second signature" passes under every
   setting. Rejected = caught; bad requests approved with two signatures = 12 − caught. Requests "signed unread" are
   those with t < 1 minute.
7. **Params** (a URL may carry anything): `policy` all / risk (else all); `load` one of 10, 20, 40, 80, 160 (else 10);
   `deep` one of 0.1, 0.2, 0.3, 0.5 (else 0.1); `independent` boolean (true/false/1/0, anything else the default); `seed`
   rounded and clamped to 1…999 (else 26). "New requests" (key N) sets seed + 1, after 999 back to 1. The panel shows
   policy, `deep` (disabled when evenly), `load` and `independent`; `seed` is kept in the URL only. `compute` reviews
   the stream under both policies with the same `load`, `deep` and approver; the stage shows both bars and outlines the
   chosen one, the day bar and the tiles follow the chosen policy.
8. **Caption.** Evenly: the load, the minutes each, caught of 12, the expected rate, and the record's 300 / 300. By
   risk: in depth per day and their minutes, the rest's minutes, caught of 12 and expected, and the same queue
   evenly. Then at most one note in this order: everything signed unread (evenly, t < 1); in depth for too many (by
   risk, t_deep < 5 minutes: "in depth" under five minutes is thin again; exactly 5 is not thin, tie-break); the
   approver is not independent; a bad request signed unread (by risk: some bad request has t < 1; when every bad
   request falls inside the in-depth share, as with seed 28, 10 a day, 50 %, there is no note).

## Presets

All with seed 26 and an independent approver unless stated; `deep` 10 % unless stated.

| # | id | params | minutes (deep / rest) | caught of 12 | expected | evenly / by risk | signed unread | record |
|---|---|---|---|---|---|---|---|---|
| 1 | `quiet` | evenly, 10 a day ("a quiet day") | – / 6 | 9 | 77.7 % | 9 / 12 | 0 | 300 / 300 |
| 2 | `busy` | evenly, 80 a day | – / 0.75 (45 s) | 0 | 0 % | 0 / 8 | 300 | 300 / 300 |
| 3 | `colleague` | evenly, 10 a day, not independent | – / 6 | 3 | 19.4 % | 3 / 3 | 0 | 300 / 300 |
| 4 | `by-risk` | by risk 10 %, 80 a day | 7.5 / 0 | 8 | 63.5 % | 0 / 8 | 270 | 300 / 300 |
| 5 | `too-deep` | by risk 50 %, 80 a day | 1.5 / 0 | 4 | 28.7 % | 0 / 4 | 150 | 300 / 300 |

Seed 26 is one of 91 seeds in 1–999 whose catches stay within 0.8 of the expected count (12 × the expected rate) for
these five presets and for 40 a day evenly (4 of 12, 31.3 %) and by risk (9 of 12, 73.2 %).

## Check script

`python3 -I check.py` (an independent re-implementation of mulberry32, the stream, the minutes, the depth order and
the look; the script as run):

```python
import math
M32 = 0xffffffff
def imul(a, b): return (a * b) & M32
def rng(seed):
    a = seed & M32
    def r():
        nonlocal a
        a = (a + 0x6d2b79f5) & M32
        t = a
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296
    return r
N, HIGH, HIGH_BAD, LOW_BAD = 300, 30, 9, 3
BUDGET, DEEP_T, TAU, GLANCE, Q_DEP = 60, 15, 4, 1, 0.25
def stream(seed):
    kinds = ['hb'] * HIGH_BAD + ['h'] * (HIGH - HIGH_BAD) + ['lb'] * LOW_BAD + ['l'] * (N - HIGH - LOW_BAD)
    r = rng(seed + 7919)
    for i in range(N - 1, 0, -1):
        j = int(r() * (i + 1)); kinds[i], kinds[j] = kinds[j], kinds[i]
    u = rng(seed)
    return [(k[0] == 'h', k.endswith('b'), u()) for k in kinds]
def times(policy, load, deep):
    if policy == 'all': return None, BUDGET / load
    dl = deep * load
    td = min(DEEP_T, BUDGET / dl)
    return td, max(0, (BUDGET - dl * td) / (load - dl))
def p(t, indep):
    return 0.0 if t < GLANCE else (1 if indep else Q_DEP) * (1 - math.exp(-t / TAU))
def run(seed, policy, load, deep, indep):
    s = stream(seed); td, tt = times(policy, load, deep)
    order = [i for i in range(N) if s[i][0]] + [i for i in range(N) if not s[i][0]]
    isdeep = set(order[:round(deep * N)]) if policy == 'risk' else set()
    k, e, stamped = 0, 0.0, 0
    for i, (hi, bad, u) in enumerate(s):
        t = td if i in isdeep else tt
        stamped += t < GLANCE
        if bad:
            pp = p(t, indep); e += pp; k += u < pp
    return k, e / (HIGH_BAD + LOW_BAD), td, tt, stamped
print('minutes evenly:', [BUDGET / l for l in (10, 20, 40, 80, 160)])
print('p(6), p(3), p(1.5), p(15), p(7.5):', [round(p(t, True), 3) for t in (6, 3, 1.5, 15, 7.5)], ' colleague p(6):', round(p(6, False), 3))
for name, pol, L, d, ind in [('quiet', 'all', 10, .1, True), ('busy', 'all', 80, .1, True), ('colleague', 'all', 10, .1, False),
                             ('by-risk', 'risk', 80, .1, True), ('too-deep', 'risk', 80, .5, True)]:
    k, e, td, tt, st = run(26, pol, L, d, ind)
    ke = run(26, 'all', L, d, ind)[0]; kr = run(26, 'risk', L, d, ind)[0]
    print('%-10s %-4s %3d/day  deep %-5s thin %5.3f  caught %2d/12  expected %4.1f %%  evenly %2d  by risk %2d  unread %3d' % (
        name, pol, L, '-' if td is None else '%.2f' % td, tt, k, e * 100, ke, kr, st))
print('seed 26 high-risk at:', [i for i, x in enumerate(stream(26)) if x[0]])
print('seed 26 bad at:', [i for i, x in enumerate(stream(26)) if x[1]])
```

Output:

```
minutes evenly: [6.0, 3.0, 1.5, 0.75, 0.375]
p(6), p(3), p(1.5), p(15), p(7.5): [0.777, 0.528, 0.313, 0.976, 0.847]  colleague p(6): 0.194
quiet      all   10/day  deep -     thin 6.000  caught  9/12  expected 77.7 %  evenly  9  by risk 12  unread   0
busy       all   80/day  deep -     thin 0.750  caught  0/12  expected  0.0 %  evenly  0  by risk  8  unread 300
colleague  all   10/day  deep -     thin 6.000  caught  3/12  expected 19.4 %  evenly  3  by risk  3  unread   0
by-risk    risk  80/day  deep 7.50  thin 0.000  caught  8/12  expected 63.5 %  evenly  0  by risk  8  unread 270
too-deep   risk  80/day  deep 1.50  thin 0.000  caught  4/12  expected 28.7 %  evenly  0  by risk  4  unread 150
seed 26 high-risk at: [15, 18, 20, 24, 41, 43, 46, 55, 57, 66, 105, 113, 131, 136, 137, 174, 182, 186, 193, 198, 209, 223, 244, 246, 251, 257, 288, 293, 296, 298]
seed 26 bad at: [15, 46, 57, 66, 99, 113, 119, 136, 165, 174, 182, 288]
```

The JavaScript gives the same numbers (tests "presets: the table in SPEC.md", rule 2–3, rule 6).

## Sources

- ISO/IEC 27001:2022, Annex A 5.3 (segregation of duties), by number only; the four-eyes principle is one way to
  operate it. *(check: number and title against the 2022 edition)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(i): human resources security, access control policies and asset
  management, EUR-Lex. *(check: the point letter, and the official Croatian wording; the page says "politike
  kontrole pristupa", as `cmp-sod-toxic` and `cmp-privileged-access` do)*
- Design vs operating effectiveness of a control (a signature proves the control exists, re-performance shows whether
  it works): general audit practice, as in `cmp-policy-to-record` and `cmp-audit-sampling`; no standard number on the
  page.
- The detection formula p = 1 − e^(−t/τ): B. O. Koopman, *Search and Screening* (1946; 1980), the random-search
  formula. Used as a plausible shape; τ = 4 min, the 1-minute glance, q = 0.25 and the 15-minute review are made up.
- The stream's mix (10 % high-risk, 12 bad of 300, three quarters of them high-risk), the hour a day and the loads are
  illustrative (the page says so once).

## Terms (hr / en)

načelo četiri oka / four-eyes principle (owner's term, settled 2026-11-07); razdvajanje dužnosti / segregation of
duties (owner's); odobravatelj / approver; drugi potpis / second signature; neispravan zahtjev / bad request;
formalnost, potpis bez čitanja / rubber stamp, signed unread; pregled prema riziku / review by risk; detaljan pregled
/ in-depth review; neovisan / independent; zapis / the record.

## Misconceptions targeted

- "Two signatures mean two people checked": the record is the same 300 / 300 whether anyone looked (presets 1 → 2).
- "Any second person will do": a colleague who will not object catches a quarter as often, with the same time
  (preset 3).
- "Under pressure, look at everything a little": 45 seconds each is no look at all; the riskiest tenth in depth
  catches 8 of 12 in the same hour (presets 2 → 4).
- "More in depth is always better": in depth for half the queue is 1.5 minutes each, thin again (preset 5).
- "By risk catches everything": the routine bad requests pass unread (preset 4: the three routine ones).

## Out of scope

Who holds which right and toxic combinations (`cmp-sod-toxic`); how access piles up (`cmp-jml-drift`); how an auditor
samples the approvals (`cmp-audit-sampling`); standard pre-approved changes and the change board
(`cmp-change-risk-class`); wrongly rejected good requests and the delay approvals add; collusion between requester and
approver; several approvers sharing a queue; learning from caught requests.
