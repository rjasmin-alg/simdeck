<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-jml-drift: specification

Task `docs/tasks/w3/cmp-jml-drift.md`, catalogue `cmp-jml-drift` (§4.13; hub of §5.24's people × roles × rights
model; overlaps `win-group-scopes`, `win-access-token`). Class **explorer**: the state is a pure function of the
params (`sim.js` `compute`). People × roles × rights over time: `access.js` (pure, wordless, promotable to
`models/access-rights.js`).

**One concept:** access granted on request and never removed grows with every move (privilege creep), and leavers'
accounts stay open when HR and IT are not connected; roles instead of one-off grants and removal on move keep people
near least privilege; a periodic access review cleans up, but a reviewer given hundreds of lines approves nearly all
of them unread.

**The contrast on the stage:** the same two years of events replayed twice, with no controls and with the controls
the student switched on; both on the same charts, and the people × rights matrix of the controlled run at the chosen
month.

## Stage

- **Numbers** (top left): at the chosen month, for no controls and for your controls: unneeded rights per person
  (mean over the 48 active people, one decimal), leavers' accounts still open, the lines an access review would list
  (rule 6) and, for your controls, what the reviews so far removed (rights) and closed (accounts); "—" without
  reviews.
- **Two charts** over months 0–24, drawn up to the chosen month: unneeded rights per person and leavers' open
  accounts. No controls: dashed muted line, square marker at the month; your controls: solid line in `--c1`, round
  marker. The y scale is fixed for the two years (rights: the highest value rounded up to a whole number, at
  least 1; accounts: rounded up to a multiple of 5, at least 5), so it does not jump while the month moves. A triangle on the
  axis at each review month up to the chosen one; a dotted cursor at the month.
- **Matrix** (bottom): one column per open account at the month under your controls, the active people grouped by
  team (team order, then id), then the leavers' open accounts by id under "⊘ n". One row per right (20), grouped by
  team, the team's colour on the row label. A held right is solid in its team's colour when the job needs it,
  hatched with a danger outline when it does not, and cross-hatched in ink on a leaver's account. Empty cells are
  rights not held. Each held right has a tooltip (person, team or month left, right, state).
- **Foot:** once, that the page simplifies, is not legal advice, and the firm, people, systems and rates are made up.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `hr` | toggle | off | HR's record of a departure closes the account on the last day |
| `roles` | toggle | off | rights come with a role per team; no copying |
| `move` | toggle | off | a move removes the old team's access |
| `review` | choice | `off`, `one`, `teams` (`off`) | quarterly access review: none, one reviewer for the department, each team lead their team |
| `care` | range, shown when `review` ≠ `off` | 10–500 step 10 (50) | lines a reviewer reads with care |
| `month` | range | 0–24 (24) | the month the numbers, markers and matrix show |
| `seed` | hidden; "New two years" (`N`) adds 1, back to 1 after 999999 | 1–999999 (949) | the events |

## Rules

1. **The department.** Four teams (sales, finance, support, logistics), twelve people each at the start, ids 1–48 in
   team order. Each team's job needs five rights; right r (0–19) belongs to team ⌊r / 5⌋. At month 0 everyone holds
   exactly their job's rights (a role, or the five rights directly). Rights are bit masks.
2. **Events** (`events(seed)`, the same under every set of controls; mulberry32 = the kit's `Simdeck.rng`). Each
   month 1–24, every active person in roster order takes **six draws, always all six**: u₀ leave, u₁ told, u₂ move,
   u₃ where to, u₄ request, u₅ which right. **Leaves** when u₀ < 0.02 (≈ 21 %/year); then **told** when u₁ < 0.5 (the
   manager tells IT on the last day); a leaver neither moves nor requests. **Moves** when u₂ < 0.015 (≈ 17 %/year) to
   team (from + 1 + ⌊u₃ × 3⌋) mod 4, one of the other three. **Requests** one right outside the (new) team when
   u₄ < 0.05: the ⌊u₅ × 15⌋-th right not of that team, in right order. All comparisons strict (`<`): a draw equal to
   the chance does not trigger. Then **one joiner per leaver**, in the leavers' order, into the leaver's team, with a
   new id (49, 50, …); a seventh draw picks the colleague to copy: the ⌊u × n⌋-th of the team's n people who are
   still active after this month's leavers and before its joiners and movers, by id (none: no copy, the draw is
   taken anyway). The roster for
   the next month: the stayers in their order, then the joiners. **Tie-break:** everything within a month goes by
   roster order, which is id order.
3. **Joiners** (an account per joiner): with roles, the team's role and nothing else; without roles, the team's five
   rights plus a **copy of everything the colleague holds** (needed and unneeded).
4. **Movers:** the account's team changes. With roles: the new role is added; with removal on move the old role is
   taken away first. Without roles: the new team's five rights are added; with removal on move the old team's five
   rights are taken away first (rights outside the old team stay, one-off and copied ones included: nobody knows
   why they were granted).
5. **Order within a month:** leavers, then joiners (the copy is taken before this month's moves and requests), then
   movers, then requests, then the review (rule 6). **Leavers:** the account is marked left. It is closed on the last day when `hr` is on or the manager told IT
   (rule 2); otherwise it stays open with all its rights (an orphaned account) until a review closes it.
   **Requests:** the right is granted directly and never expires.
6. **Access review** at the end of months 3, 6, … 24 when `review` ≠ `off`, after the month's events. The **lines** of
   an open account: one per role it holds plus one per right granted directly (without roles: one per right held).
   One reviewer gets all open accounts; team leads get the open accounts of their team (a leaver's by the team they
   left). Each reviewer's list is sorted **by name** (a fixed draw per person and seed, `nameKey`; tie-break id),
   each account's lines roles first, then rights in order. **The reviewer reads the first `care` lines with care and
   approves the rest unread**; the list is in the same order every quarter. A read line that the job does not need is
   removed (a role of another team, a right outside the team); a needed line is kept; any read line of a leaver
   closes the account. Lines are counted at the start of the review (removals do not move later lines up).
7. **Numbers** at the end of each month (after the review): over open accounts, active people's unneeded rights
   (held & ¬ needed by the current team) summed and divided by the active people (48), in tenths, halves up; leavers'
   open accounts; total lines (rule 6) over open accounts. Per review: lines (total and the largest per reviewer),
   lines read, unneeded rights of active people before it and removed by it, leavers' accounts listed and closed.
   **Copied:** the unneeded rights joiners got with a copy, per month.
8. **Two runs** on the same events: no controls (`hr`, `roles`, `move` off, no review) and your controls. The page shows
   both series up to the month, the reviews' sums up to the month (count, removed, closed) and the last review.
9. **Params made safe:** toggles accept booleans, the numbers 1/0 and "true"/"false"/"1"/"0", otherwise the default; `review` outside
   its list → default; `care` rounded to 10 and clamped to 10–500; `month` rounded and clamped to 0–24; `seed` rounded
   and clamped to 1–999999; blank strings, non-numbers and ±Infinity → default (on the page the kit has already
   clamped a range to its bounds).
10. **Caption:** month 0 → `capStart`. Otherwise `capNone` when your controls equal no controls, else `capMain`; then at
    most two notes in this order: `nReview` (the last review: one reviewer or team leads, its lines and lines read,
    then removed of unneeded, and closed of listed leavers' accounts when any were listed), `nRolesNoMove` (roles on,
    removal on move off, someone moved), `nCopy` (roles off and joiners copied unneeded rights), `nUntold` (`hr` off,
    a leaver not told), `nOneOff` (roles and removal on move on, unneeded rights left).

## Presets (seed 949, month 24; checked by `sim.test.js` and the Python script below)

Events over the two years: 23 leavers (12 not told), 23 joiners, 17 moves, 58 requests. No controls in every row:
**2.8** unneeded rights per person, **12** leavers' accounts open, **451** lines.

| # | id | controls | unneeded / person | open leavers' accounts | lines | reviews removed · closed | last review |
|---|---|---|---|---|---|---|---|
| 1 | `drift` | none | 2.8 | 12 | 451 | — | — |
| 2 | `hr` | hr | 2.8 | 0 | 373 | — | — |
| 3 | `big-review` | review one, care 50 | 2.1 | 12 | 418 | 27 · 0 | 424 lines, 50 read; removed 6 of 106; closed 0 of 12 |
| 4 | `team-review` | review teams, care 50 | 0.5 | 4 | 290 | 106 · 8 | 307 lines, ≤ 112 per lead, 200 read; removed 12 of 36; closed 1 of 5 |
| 5 | `roles` | hr, roles, move | 0.9 | 0 | 91 | — | — |
| 6 | `all` | hr, roles, move, review teams | 0.0 | 0 | 48 | 58 · 0 | 56 lines, ≤ 19 per lead, 56 read; removed 8 of 8 |

The no-controls run grows from 0.7 (month 3) to 0.9 (6), 1.3 (12) and 2.8 (24) unneeded rights per person.
Unneeded rights joiners got with a copy: 50 (presets 1–2), 42 (3), 18 (4), 0 with roles.

**Over many runs** (seeds 1–200, month 24, preset controls): unneeded per person 2.68 / 2.68 / 2.07 / 0.52 / 0.87 /
0.00; open leavers' accounts 11.9 / 0 / 9.5 / 2.5 / 0 / 0; lines 444 / 369 / 399 / 280 / 92 / 48; the one reviewer's
last list 405 lines on average. In every one of the 200 runs: `hr` leaves no open account; the big review ends
below no controls but above the team review; roles with removal on move end below no controls; all controls end
at or below roles alone; roles without removal on move end above roles with it. `sim.test.js` checks these over
seeds 1–60.

## Numbers checked

`sim.test.js` asserts the table. An independent Python re-implementation of rules 1–7 (below; `python3 check.py`
after copying it out) prints the same event counts and, per preset, the same totals at month 24 (unneeded rights in
tenths, open leavers' accounts, lines, rights removed and accounts closed by the reviews). The last-review column, the
copied counts and the many-runs figures are checked by `sim.test.js` only (a fresh reviewer compared Python and JS on
seeds 1–200 for all six presets: no difference):

```
events: leaves 23 moves 17 requests 58 untold 12
drift excess10, orphans, lines, removed, closed = (28, 12, 451, 0, 0)
hr excess10, orphans, lines, removed, closed = (28, 0, 373, 0, 0)
big-review excess10, orphans, lines, removed, closed = (21, 12, 418, 27, 0)
team-review excess10, orphans, lines, removed, closed = (5, 4, 290, 106, 8)
roles excess10, orphans, lines, removed, closed = (9, 0, 91, 0, 0)
all excess10, orphans, lines, removed, closed = (0, 0, 48, 58, 0)
```

```python
# Independent check of SPEC.md rules 1-8: python3 check.py
M32 = 0xFFFFFFFF
def imul(a, b): return (a * b) & M32
def rng(seed):
    a = seed & M32
    def r():
        nonlocal a
        a = (a + 0x6D2B79F5) & M32
        t = a
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296
    return r
T, K, S, MONTHS = 4, 5, 12, 24
NEED = [((1 << K) - 1) << (K * t) for t in range(T)]
def pc(x): return bin(x).count('1')
def events(seed):
    r = rng(seed); team = {i: (i - 1) // S for i in range(1, T * S + 1)}; ids = sorted(team); nxt = T * S + 1
    months = [None]
    for m in range(1, MONTHS + 1):
        L, Mv, Rq, J = [], [], [], []
        for i in ids:
            u = [r() for _ in range(6)]
            if u[0] < 0.02: L.append((i, team[i], u[1] < 0.5)); continue
            t = team[i]
            if u[2] < 0.015: to = (t + 1 + int(u[3] * 3)) % 4; Mv.append((i, t, to)); t = to
            if u[4] < 0.05: Rq.append((i, [x for x in range(20) if x // 5 != t][int(u[5] * 15)]))
        gone = {x[0] for x in L}; stay = [i for i in ids if i not in gone]
        for (i, t, _) in L:
            mates = [j for j in stay if team[j] == t]; u = r()
            J.append((nxt, t, mates[int(u * len(mates))] if mates else None)); team[nxt] = t; nxt += 1
        for (i, f, to) in Mv: team[i] = to
        ids = stay + [x[0] for x in J]
        months.append((L, J, Mv, Rq))
    return months
def roles_mask(r): return sum(NEED[t] for t in range(T) if r >> t & 1)
def held(a): return a['d'] | roles_mask(a['r'])
def excess(a): return held(a) & ~NEED[a['t']] if a['left'] is None else held(a)
def lines(a): return pc(a['r']) + pc(a['d'])
def name_key(seed, i): return rng((seed ^ imul(i, 0x9E3779B1)) & M32)()
def new(i, t, c, cp):
    a = dict(id=i, t=t, left=None, on=True, r=0, d=0)
    if c['roles']: a['r'] = 1 << t
    else: a['d'] = NEED[t] | (held(cp) if cp else 0)
    return a
def review(ac, m, c, seed):
    groups = {}
    for a in ac:
        if a['on']: groups.setdefault(a['t'] if c['review'] == 'teams' else 0, []).append(a)
    rem = clo = 0
    for g in sorted(groups):
        lst = sorted(groups[g], key=lambda a: (name_key(seed, a['id']), a['id'])); left = c['care']
        for a in lst:
            orphan = a['left'] is not None; before = pc(excess(a)); hit = False
            ls = [100 + t for t in range(T) if a['r'] >> t & 1] + [x for x in range(20) if a['d'] >> x & 1]
            for ln in ls:
                if left <= 0: break
                left -= 1
                if orphan: hit = True
                elif ln >= 100:
                    if ln - 100 != a['t']: a['r'] &= ~(1 << (ln - 100))
                elif ln // 5 != a['t']: a['d'] &= ~(1 << ln)
            if orphan and hit: a['on'] = False; clo += 1
            if not orphan: rem += before - pc(excess(a))
    return rem, clo
def replay(ev, c, seed):
    ac = [new(i, (i - 1) // S, c, None) for i in range(1, T * S + 1)]; by = {a['id']: a for a in ac}; rem = clo = 0
    for m in range(1, MONTHS + 1):
        L, J, Mv, Rq = ev[m]
        for (i, t, told) in L:
            by[i]['left'] = m
            if c['hr'] or told: by[i]['on'] = False
        for (i, t, cp) in J:
            a = new(i, t, c, by[cp] if cp else None); ac.append(a); by[i] = a
        for (i, f, to) in Mv:
            a = by[i]; a['t'] = to
            if c['roles']:
                if c['move']: a['r'] &= ~(1 << f)
                a['r'] |= 1 << to
            else:
                if c['move']: a['d'] &= ~NEED[f]
                a['d'] |= NEED[to]
        for (i, x) in Rq: by[i]['d'] |= 1 << x
        if c['review'] != 'off' and m % 3 == 0:
            x, y = review(ac, m, c, seed); rem += x; clo += y
    act = [a for a in ac if a['on'] and a['left'] is None]; orph = [a for a in ac if a['on'] and a['left'] is not None]
    ex = sum(pc(excess(a)) for a in act)
    return ((20 * ex + len(act)) // (2 * len(act)), len(orph), sum(lines(a) for a in ac if a['on']), rem, clo)
def C(**k): d = dict(hr=False, roles=False, move=False, review='off', care=50); d.update(k); return d
PRESETS = [('drift', C()), ('hr', C(hr=True)), ('big-review', C(review='one')), ('team-review', C(review='teams')),
           ('roles', C(hr=True, roles=True, move=True)), ('all', C(hr=True, roles=True, move=True, review='teams'))]
ev = events(949)
print('events: leaves', sum(len(e[0]) for e in ev[1:]), 'moves', sum(len(e[2]) for e in ev[1:]),
      'requests', sum(len(e[3]) for e in ev[1:]), 'untold', sum(1 for e in ev[1:] for x in e[0] if not x[2]))
for name, c in PRESETS:
    print(name, 'excess10, orphans, lines, removed, closed =', replay(ev, c, 949))
```

## Legend and captions

Legend: needed for the job (solid, the team's colour), not needed for the job (hatched, danger outline), left with
the account open (cross-hatched, dashed), no controls (dashed line), your controls (solid line), access review
(triangle). Captions: rule 10; words in `strings.js`.

## Terms (hr / en)

dolazak, premještaj, odlazak / joiner, mover, leaver (owner, 2026-11-07); načelo najmanjih ovlasti / least privilege;
gomilanje ovlasti / privilege creep; napušteni račun / orphaned account; pregled prava pristupa / access review;
pristup temeljen na ulogama / role-based access; odobravanje naslijepo ("ostali odobreni nepročitani") /
rubber-stamping; kadrovska evidencija / HR records. All listed in `NOTES.md` for the owner.

## Misconceptions targeted

- "We remove access when people leave": without a link from HR, half of the leavers are never reported, and the
  accounts stay open with everything they held.
- "A move is just new access": without removal, every move adds a team's worth of rights.
- "Copy a colleague's account" passes the colleague's surplus on to every new hire.
- "The quarterly review will catch it": a reviewer given hundreds of lines reads a few dozen; the review's size, not
  its existence, decides what it removes. Roles shrink the list to something one can read.
- Least privilege is not reached once: one-off grants keep coming, and only a review that is read takes them back.

## Out of scope

Segregation of duties (`cmp-sod-toxic`), privileged accounts (`cmp-privileged-access`), approval queues
(`cmp-four-eyes`), how groups and tokens carry rights in a directory (`win-group-scopes`, `win-access-token`),
reviewers removing needed rights by mistake, temporary grants with an expiry, the cost of access.
