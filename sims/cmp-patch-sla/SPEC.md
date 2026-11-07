<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-patch-sla: specification

Explorer (task `docs/tasks/w3/cmp-patch-sla.md`, catalogue `cmp-patch-sla` §4.13). One concept: a remediation policy
sets deadlines by severity; compliance is reported as the share fixed in time, but exposure is open vulnerabilities ×
days, and the average hides the long tail on systems nobody owns; fixing the known-exploited ones first lowers real
risk more than fixing by score; an exception needs an owner and an end date.

Code: `sim.js` (every rule, pure and wordless), the page `index.html`, words in `strings.js`. Tests: `sim.test.js`.
Everything here is illustrative: one made-up firm, twenty made-up systems, made-up rates; the page says so once and
that it simplifies and is not legal advice.

## State and what a change does

An explorer: no steps. The state is a pure function of the params (`compute`): the stream, a run of the year under the
chosen order, a second run under the other order (for the comparison bars), and, when the deadlines differ from the
default policy, a third run under the default deadlines (for the caption). Every control (the panel's, and the
stage's deadline steppers and "New stream") sets params, and the state is recomputed.

## Rules

1. **The year and the systems.** Days 1…365. Twenty systems, 0…19; the last `unowned` (0…6, default 3) have no owner.
   Nobody plans work on a system without an owner, so its items never enter the team's queue (unless rule 5's dated
   exception gives one an owner). Changing `unowned` does not change the stream, only which systems are owned.
2. **The stream** (mulberry32(seed), the kit's generator). Day by day: one draw for the day's count, 2 + ⌊u · 5⌋
   (2…6, about 4 a day); then exactly four draws per item (tie-break: always four, so no param changes the stream):
   system ⌊u₁ · 20⌋; severity by u₂ against the cumulative shares critical 10 %, high 30 %, medium 45 %, low 15 %;
   score in tenths within the severity's band, lo + ⌊u₃ · (hi − lo + 1)⌋, bands 9.0–10.0, 7.0–8.9, 4.0–6.9, 0.1–3.9
   (the CVSS v3 severity bands); known exploited when u₄ < 20 %, 10 %, 6 %, 2 % by severity (about 8 % overall, a third
   of them medium: exploitation follows the score only loosely). Items arrive at the end of their day.
3. **The team.** On day d the team fixes ⌊cap · d⌋ − ⌊cap · (d − 1)⌋ items (`cap` 1…6 in halves, so 2.5 alternates
   2 and 3), the first ones in the queue's order (rule 4). An item arriving on day d can be fixed on day d + 1 at the
   earliest (its age at the fix is ≥ 1). The team does the same work under either order, so the number open each day,
   and so the total exposure, does not depend on the order; only which items stay open does.
4. **The queue's order.** By score: higher score first. Known-exploited first: exploited items before the rest, then
   by score. Ties (tie-break): earlier arrival, then lower id. A total order.
5. **Exceptions** (`exc`), for items on systems nobody owns, granted on the first day after the item's deadline
   (day > arrival + deadline), before that day's fixes. `none`: no exception, the item stays overdue. `open`: an
   exception with no end date; the item leaves the report and is never fixed. `dated`: an exception with an owner
   and an end date 30 days after it is granted; the owner puts the item in the team's queue at once (it can be fixed
   that day), and the end date replaces the deadline.
6. **The numbers at the end of day 365.** Each item is *in time* (fixed by its deadline day, or by a dated
   exception's end day: on the day counts as in time, tie-break), *late* (fixed after it), *excepted* (open under an
   open exception, or under a dated one whose end day is ≥ 365), *overdue* (open, day 365 > its deadline or the
   exception's end) or *not yet due*. **Fixed in time (the report)** = in time ÷ (in time + late + overdue): excepted
   and not-yet-due items are not counted (an empty count reads 100 %). **Average time to fix** = mean of fix day −
   arrival over fixed items. **Oldest open** = the open item with the earliest arrival (tie: lower id), its age
   365 − arrival. **Exposure** = Σ over items of (fix day, or 365 if open) − arrival, in vulnerability-days; split by
   owned and unowned systems; the **known-exploited exposure** is the same sum over exploited items, shown for both
   orders on the same stream with the share in time under each.
7. **Deadlines** (`dCrit`, `dHigh`, `dMed`, `dLow`, default 15 / 30 / 90 / 180 days) are the yardstick: they decide
   in time, late and overdue, never the queue. So under `none` and `open` a shorter deadline lowers the share in time
   and leaves the exposure and the average exactly the same. (Under `dated` the deadline also sets when an exception
   starts, so it moves the unowned items' fixes.) When the deadlines differ from the default policy the state carries
   the share in time and the exposure under the default ones.
8. **The age chart.** Every item open at the end, in its lane (owned, unowned), in a column of 10 days by age
   (⌊age / 10⌋, columns 0…36), stacked from the bottom by severity (critical first), exploited before the rest, then
   id; each carries a mark, *excepted* (rule 6, drawn faded), *overdue* or not yet due. Overdue is not drawn on the
   tile: the deadline of each severity is a line at its age, and a tile right of its severity's line is overdue. All
   columns share one height scale (the tallest column, at least 10).
9. **Params** (a URL may carry anything): `order` score / exploited (else score); `cap` rounded to a half and clamped
   to 1…6; `unowned` rounded and clamped to 0…6; `exc` none / open / dated (else open); each deadline rounded and
   clamped to its range (critical 1…30, high 7…90, medium 14…180, low 30…365); `seed` rounded and clamped to 1…999.
   The panel holds the order, `cap`, `unowned` and `exc` (disabled with a reason when no system is unowned). The
   deadlines are steppers on the stage, next to the lines they move (the panel must fit one screen): each moves to the
   next offered value above or below the current one (critical 1, 3, 5, 7, 10, 15, 20, 30; high 7, 14, 21, 30, 45, 60,
   90; medium 14, 30, 45, 60, 90, 120, 180; low 30, 60, 90, 120, 180, 270, 365), from any value a URL set, and stays at
   the end of the list. "New stream" (key N) sets seed + 1, after 999 back to 1.
10. **Caption.** The report against the tail: nothing open longer than 30 days (*capClean*; at least two items arrive
    on day 365, so something is always open); otherwise the share in time, the average,
    the open count and the oldest, plus, with systems nobody owns, their share of the items against their share of
    the exposure (*capTail*, or *capTailOwned* without them). Then at most one note, in this order: open-ended
    exceptions keep items out of the share (*nOpenExc*, only when some item is excepted); exceptions with an owner and
    an end date (*nDated*, only with systems nobody owns: under them a deadline also decides when an item enters the
    queue, so it can move the exposure, and this note comes before the deadlines note, whose "same exposure" is a rule
    only without them; with the team busy every day, as in the presets, the total stays the same anyway);
    deadlines other than 15/30/90/180 (any one of the four), with the share under those and the same exposure
    (*nDeadlines*; the state carries that exposure too, so a test can hold the claim); the order,
    when the known-exploited exposure under the two orders differs by at least a quarter of the by-score value
    (*nByScore* / *nByKev*; exploited first never has more exploited exposure than by score, so the test is one-sided);
    overdue items on systems nobody owns, now counted (*nUnowned*). The first two cannot both
    apply (`exc` has one value).

## Presets

All with seed 7 (1483 items), the default policy 15 / 30 / 90 / 180 days unless shown.

| # | id | params | in time | counted | excepted | overdue | avg fix | open | oldest | exposure | exploited exposure | caption note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `report` | by score, cap 3.5, 3 unowned, open exceptions | 99.1 % | 1277 | 149 | 9 | 4.2 d | 215 | 362 d | 42 715 (80.2 % unowned, from 188 items = 12.7 %) | 3334 (exploited first 3230) | nOpenExc |
| 2 | `no-exc` | as 1, no exceptions | 88.8 % | 1426 | 0 | 158 | 4.2 d | 215 | 362 d | 42 715 | 3334 | nUnowned |
| 3 | `dated` | as 1, owner and end date | 93.7 % | 1339 | 3 | 67 | 11.2 d | 211 | 360 d | 41 617 (34.8 % unowned) | 1374 (831) | nDated |
| 4 | `short` | by score, cap 3, none unowned | 81.6 % | 1335 | 0 | 244 | 3.8 d | 392 | 363 d | 74 378 | 2442 (126) | nByScore |
| 5 | `kev` | as 4, exploited first | 81.2 % | 1335 | 0 | 244 | 4.1 d | 392 | 363 d | 74 378 | 126 (by score 2442) | nByKev |
| 6 | `tight` | as 5, deadlines 7 / 14 / 45 / 90 | 76.6 % | 1404 | 0 | 313 | 4.1 d | 392 | 363 d | 74 378 | 126 | nDeadlines (81.2 % under the default) |

What each shows: 1, the report looks fine (99 %, four days on average) while the oldest item is a year old and the
13 % of items on unowned systems carry 80 % of the exposure; 2, counting them honestly drops the share to 89 % and
changes no exposure; 3, an owner and an end date pull the unowned exposure from 80 % to 35 %, but the same team now
carries those items: total exposure barely falls (42 715 → 41 617), overdue items on owned systems rise from 9 to 55,
the average fix from 4.2 to 11.2 days, and fixes inside the end date count as in time (counted against the original
deadline the share would be 83.9 %); the caption says so (the oldest open is a low item whose exception ran out
unfixed: the end date brings it back as overdue); 4 and 5, with a team short of
hands the order leaves the share almost the same (81.6 % → 81.2 %) and cuts the exploited exposure 19-fold; 6,
halving the deadlines drops the share to 76.6 % with exactly the same exposure.

## Expected numbers, checked

The table is checked by `sim.test.js` and by this independent Python re-implementation (sorting with Python's own
`sort` on a key tuple, not the model's comparator), which prints the same numbers:

```python
# Independent check of cmp-patch-sla's preset numbers (SPEC.md). Python 3, no dependencies.
import math

def rng(seed):
    a = seed & 0xffffffff
    def imul(x, y): return (x * y) & 0xffffffff
    def nxt():
        nonlocal a
        a = (a + 0x6d2b79f5) & 0xffffffff
        t = a
        t = imul(t ^ (t >> 15), t | 1)
        t = (t ^ ((t + imul(t ^ (t >> 7), t | 61)) & 0xffffffff)) & 0xffffffff
        return ((t ^ (t >> 14)) & 0xffffffff) / 4294967296
    return nxt

DAYS, SYSTEMS, EXC = 365, 20, 30
P = [0.10, 0.30, 0.45, 0.15]; LO = [90, 70, 40, 1]; HI = [100, 89, 69, 39]; KEV = [0.20, 0.10, 0.06, 0.02]

def stream(seed):
    r, out = rng(seed), []
    for d in range(1, DAYS + 1):
        for _ in range(2 + math.floor(r() * 5)):
            sys = math.floor(r() * SYSTEMS)
            u, s, acc = r(), 0, P[0]
            while s < 3 and u >= acc:
                s += 1; acc += P[s]
            score = LO[s] + math.floor(r() * (HI[s] - LO[s] + 1))
            out.append(dict(id=len(out), day=d, sys=sys, sev=s, score=score, kev=r() < KEV[s]))
    return out

def run(items, order, cap, unowned, exc, dl):
    recs = [dict(x, owned=x['sys'] < SYSTEMS - unowned, due=x['day'] + dl[x['sev']], fixed=None, exc=None) for x in items]
    key = (lambda x: (not x['kev'], -x['score'], x['day'], x['id'])) if order == 'exploited' else (lambda x: (-x['score'], x['day'], x['id']))
    q, nxt = [], 0
    for d in range(1, DAYS + 1):
        if exc != 'none':
            for x in recs[:nxt]:
                if not x['owned'] and x['exc'] is None and x['fixed'] is None and d > x['due']:
                    if exc == 'open': x['exc'] = 'open'
                    else: x['exc'] = d + EXC; q.append(x)
        k = math.floor(cap * d + 1e-9) - math.floor(cap * (d - 1) + 1e-9)
        q.sort(key=key)
        for x in q[:k]: x['fixed'] = d
        q = q[k:]
        while nxt < len(recs) and recs[nxt]['day'] == d:
            if recs[nxt]['owned']: q.append(recs[nxt])
            nxt += 1
    return recs

def status(x):
    lim = x['exc'] if isinstance(x['exc'], int) else x['due']
    if x['fixed'] is not None: return 'in' if x['fixed'] <= lim else 'late'
    if x['exc'] == 'open' or (isinstance(x['exc'], int) and DAYS <= x['exc']): return 'exc'
    return 'over' if DAYS > lim else 'notdue'

def measure(recs):
    st = [status(x) for x in recs]
    counted = sum(s in ('in', 'late', 'over') for s in st)
    fixed = [x for x in recs if x['fixed'] is not None]
    od = lambda x: (x['fixed'] if x['fixed'] is not None else DAYS) - x['day']
    opn = [x for x in recs if x['fixed'] is None]
    return dict(inTime=round(100 * st.count('in') / counted, 1), counted=counted, excepted=st.count('exc'), overdue=st.count('over'),
                meanFix=round(sum(x['fixed'] - x['day'] for x in fixed) / len(fixed), 1), open=len(opn),
                oldest=max(DAYS - x['day'] for x in opn), exposure=sum(od(x) for x in recs),
                unownedExp=round(100 * sum(od(x) for x in recs if not x['owned']) / sum(od(x) for x in recs), 1),
                unownedItems=sum(not x['owned'] for x in recs),
                kev=sum(od(x) for x in recs if x['kev']))

items = stream(7)
print('arrivals', len(items))
D = (15, 30, 90, 180)
presets = [('report', 'score', 3.5, 3, 'open', D), ('no-exc', 'score', 3.5, 3, 'none', D), ('dated', 'score', 3.5, 3, 'dated', D),
           ('short', 'score', 3, 0, 'none', D), ('kev', 'exploited', 3, 0, 'none', D), ('tight', 'exploited', 3, 0, 'none', (7, 14, 45, 90))]
for name, order, cap, un, exc, dl in presets:
    print(name, measure(run(items, order, cap, un, exc, dl)))
```

Output (2026-11-07):

```
arrivals 1483
report {'inTime': 99.1, 'counted': 1277, 'excepted': 149, 'overdue': 9, 'meanFix': 4.2, 'open': 215, 'oldest': 362, 'exposure': 42715, 'unownedExp': 80.2, 'unownedItems': 188, 'kev': 3334}
no-exc {'inTime': 88.8, 'counted': 1426, 'excepted': 0, 'overdue': 158, 'meanFix': 4.2, 'open': 215, 'oldest': 362, 'exposure': 42715, 'unownedExp': 80.2, 'unownedItems': 188, 'kev': 3334}
dated {'inTime': 93.7, 'counted': 1339, 'excepted': 3, 'overdue': 67, 'meanFix': 11.2, 'open': 211, 'oldest': 360, 'exposure': 41617, 'unownedExp': 34.8, 'unownedItems': 188, 'kev': 1374}
short {'inTime': 81.6, 'counted': 1335, 'excepted': 0, 'overdue': 244, 'meanFix': 3.8, 'open': 392, 'oldest': 363, 'exposure': 74378, 'unownedExp': 0.0, 'unownedItems': 0, 'kev': 2442}
kev {'inTime': 81.2, 'counted': 1335, 'excepted': 0, 'overdue': 244, 'meanFix': 4.1, 'open': 392, 'oldest': 363, 'exposure': 74378, 'unownedExp': 0.0, 'unownedItems': 0, 'kev': 126}
tight {'inTime': 76.6, 'counted': 1404, 'excepted': 0, 'overdue': 313, 'meanFix': 4.1, 'open': 392, 'oldest': 363, 'exposure': 74378, 'unownedExp': 0.0, 'unownedItems': 0, 'kev': 126}
```

## Legend, words, out of scope

- Tiles: the report's two numbers (share in time, average) are outlined green with a tick when the share is at least
  95 % (the report looks good); oldest open and open at year end are dashed red when the oldest is over 30 days and
  when anything is overdue.
- Legend: critical (solid), high (hatched), medium (light fill), low (hollow), exploited (a pill with an outline),
  on exception (faded). Severity is carried by pattern as well as colour (checked in grayscale), and the deadline
  lines carry their severity's name and days as text.
- Terms (both languages) and choices: `NOTES.md`.
- Misconceptions targeted: "99 % in time means we are fine"; "the average time to fix measures risk"; "fix the
  highest score first"; "a shorter deadline makes us safer"; "an exception closes the item".
- Out of scope: how a patch is delivered (`win-wsus-flow`, update rings), testing and rollback of patches (change
  management, `cmp-change-risk-class`), scanning coverage (assumed complete), exploitation becoming known after
  arrival, weekends and patch days (the team works every day at a steady rate), risk scoring of exceptions
  (`cmp-exceptions`, `cmp-risk-register`).
