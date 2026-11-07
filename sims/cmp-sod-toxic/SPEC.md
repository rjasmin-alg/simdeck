<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-sod-toxic: specification

Explorer (task `docs/tasks/w3/cmp-sod-toxic.md`, catalogue `cmp-sod-toxic` §4.13). One concept: some pairs of
duties in one person let them make an error or a fraud and hide it; a conflict matrix checked against the
assignments finds them; a small team cannot always separate, so a compensating control (an independent review of a
log the person cannot edit) takes the place of separation.

Code: `sod.js` (rules 1–8, pure and wordless, promotable to `models/`), `sim.js` (rules 9–12), the page
`index.html`, words in `strings.js`. Tests: `sim.test.js`. Everything here is illustrative: one made-up firm, made-up
people; the page says so once and that it simplifies and is not legal advice.

## State and what a change does

An explorer: no steps. The state is a pure function of the params (`compute`). Each click on the stage (a cell, a
resolution button, "split") sets params, and the state is recomputed.

## Rules

1. **Duties and the conflict matrix.** Eight duties, numbered 0–7: 0 requests a purchase, 1 approves a purchase,
   2 creates suppliers, 3 pays suppliers, 4 writes code, 5 deploys to production, 6 runs the backups, 7 manages the
   logs (can delete them). The matrix forbids four pairs, pair k = duties 2k and 2k + 1: request + approve (buy for
   yourself), create supplier + pay (pay a supplier you made up), write code + deploy (put unreviewed code into
   production), backups + logs (delete a backup and the log line that shows it). Every other pair is allowed.
2. **The team and who may hold what.** A team of n = 3…12 people, person i (0-based) in the office when i is even and
   in IT when odd (so n = 3 has two office people and one in IT; the office has ⌈n/2⌉, IT ⌊n/2⌋). The money duties
   (0–3) only the office may hold, the production duties (4–6) only IT, the logs (7) anyone: the log store can be
   run outside IT. A duty a person may not hold is dropped from their assignment (rule 9).
3. **Holders.** Every duty needs r holders: r = 1, or r = 2 with **deputies** (cover for absence). A duty with fewer
   holders than r is *short*; short duties are listed in duty order with how many they have and need.
4. **Conflicts.** A conflict is one person holding both duties of a forbidden pair. The list is ordered by person id,
   then pair (tie-break). The matrix cell (a, b) counts the people who hold both a and b; the diagonal (a, a) counts
   the holders of a.
5. **The fewest conflicts a team can reach** (with every duty covered as far as people allow). Per pair, independently
   (no duty is in two pairs): with A the people who may hold the first duty, B the second, and C = A ∩ B,
   hₐ = min(r, |A|), h_b = min(r, |B|); the first duty's holders come from C only beyond |A \ C|, the second's beyond
   |B \ C|; the overlap is max(0, max(0, hₐ − |A \ C|) + max(0, h_b − |B \ C|) − |C|). Short = (r − hₐ) + (r − h_b).
   The total is the sum over the four pairs. The money pairs and code + deploy have A = B, so the overlap is
   max(0, 2r − |A|) (or |A| when |A| < r); backups + logs never conflicts here (the office has at least two people).
6. **Sharing out** ("Share out the duties", key S) reaches that minimum. Pairs in order 0–3. For a pair whose two
   duties the same e people may hold (the money pairs, code + deploy), k = max(0, 2r − e) of them must hold both (all
   e when e < r): those k are picked first, people already in a conflict before the others (the overlaps pile up on
   one person, so the others stay free to hold the logs), then fewest duties so far, then id; the remaining holders
   of the first duty, then of the second, come from the others by fewest duties, then id. For backups + logs:
   backups to the r IT people with the fewest duties (ties by id); logs to the r people not holding backups, people
   holding no conflict first (so their compensating control stays possible), then fewest duties, then id. Result:
   where conflicts are unavoidable and someone is left free (n = 5–7 with deputies, n = 3 without), every conflict's
   control can hold; with n = 3–4 and deputies both office people are in conflict, so theirs cannot.
7. **Split.** A conflict is split by moving one of its two duties to someone else: the second duty is tried first,
   then the first. The taker may hold the duty (rule 2), holds neither duty of the pair, and has the fewest duties;
   ties by id. The person loses the duty, the taker gains it: holders per duty stay the same and no new conflict
   appears. When nobody qualifies for either duty, the split is refused (the button says why in the caption).
8. **Compensating control.** A control on a conflict holds when (a) the person does not hold the logs duty (they
   cannot edit the log the review reads) and (b) there is a reviewer: another person holding neither duty of the
   pair, the first by id. When both fail, the reason is "logs". So a control can never hold for backups + logs (the
   person holds the logs by definition). Part (b) never fails in this team: for the money and production pairs the
   other department is always a reviewer, and for backups + logs the reason is always "logs".
9. **Params** (a URL may carry anything): `team` rounded and clamped to 3…12; `deputies` and `edit` booleans
   (true/false/1/0, anything else the default); per person `m0…m11` a duty mask rounded and clamped to 0…255, then
   cut to the duties the person may hold; `r0…r11` the resolutions, rounded and clamped to 0…80, digit k in base 3 is
   pair k's: 0 open, 1 control, 2 accept. With `edit` off the assignment is the shared-out one (rule 6) for the team;
   with it on, `m0…m(n−1)`. People beyond the team keep their masks (growing the team back restores them).
   A click on a cell switches `edit` on, writes every mask and resets that person's resolution for the cell's pair.
   A split does the same for the moved duty's pair. "Share out" switches `edit` off and clears every mask and
   resolution.
10. **Presets** (table below).
11. **Outcome of a conflict.** Accepted (signed) → *accepted*: the risk stays and nothing finds an abuse, but it is
    a decision on record. A control that holds → *detected*: an abuse is found at the next review. Anything else
    (no resolution, a control that does not hold) → *open*. A matrix cell of a forbidden pair shows its worst
    conflict: open over accepted over detected; with none, the pair is *separated*. Verdict: *finding* when a duty
    is short or a conflict is open; *managed* when there are conflicts and none open; *clean* otherwise.
12. **Caption.** Main sentence: no conflicts → *clean* (or *short* when a duty is short); some open → *open*; none
    open → *detected* (all by a control), *accepted* (all signed) or *managed* (both). Then at most two notes, in this order: short duties; a control that fails because the person
    manages the logs; conflicts this team cannot avoid (minimum > 0, its own wording with deputies); conflicts that
    could be separated (current − minimum > 0). A control without a reviewer (rule 8b) cannot happen in this team
    (rule 8), so it has no note; the rule stays in `sod.js` for teams laid out differently and is tested there.
    The list on the stage shows the first six conflicts with their buttons and "+ n more"; the rest are resolved
    through the cells (more rows would push the grid off the projector's one screen). Resolutions are kept when the
    team or the deputies change (only a click on a cell, a split or "Share out" resets them). The caption also starts with the last action's message (a move by
    split or a refused click), which disappears on the next change.

## The fewest conflicts by team size (rule 5)

| team n | office / IT | one holder | with deputies |
|---|---|---|---|
| 3 | 2 / 1 | 1 | 5 (3 duties short) |
| 4 | 2 / 2 | 0 | 6 |
| 5 | 3 / 2 | 0 | 4 |
| 6 | 3 / 3 | 0 | 3 |
| 7 | 4 / 3 | 0 | 1 |
| 8–12 | | 0 | 0 |

Separation is possible from n = 4 without deputies and from n = 8 with them. Checked by brute force over every
holding of every pair (script below) and by the tests (rule 6 reaches the minimum for every n and both settings).

## Presets

| # | id | params | conflicts | open / detected / accepted | minimum | verdict |
|---|---|---|---|---|---|---|
| 1 | `mixed` | n = 6, edit: person 0 {0, 1, 2}, 1 {4, 5}, 2 {3}, 3 {6, 7}, 4 {3}, 5 {4} | 3 (0: pair 0, 1: pair 2, 3: pair 3) | 3 / 0 / 0 | 0 (all 3 avoidable) | finding |
| 2 | `separated` | n = 6, shared out | 0 | 0 / 0 / 0 | 0 | clean |
| 3 | `cover` | n = 6, deputies, shared out | 3 (0: pairs 0 and 1, 1: pair 2; none can be split, every control would hold) | 3 / 0 / 0 | 3 | finding |
| 4 | `three` | n = 3, shared out, person 1 control on pair 2 | 1 (1: pair 2; reviewer 0; person 0 holds the logs) | 0 / 1 / 0 | 1 | managed |
| 5 | `own-log` | n = 3, edit: 0 {0, 2}, 1 {4, 5, 6, 7}, 2 {1, 3}; person 1 control on pairs 2 and 3 | 2 (1: pairs 2, 3; both controls fail: logs) | 2 / 0 / 0 | 1 (1 avoidable) | finding |
| 6 | `eight` | n = 8, deputies, shared out | 0 | 0 / 0 / 0 | 0 | clean |

Shared-out masks: n = 6 → [9, 144, 2, 32, 4, 64]; n = 6 with deputies → [15, 48, 133, 80, 138, 96]; n = 3 →
[133, 112, 10]; n = 8 with deputies → [5, 80, 5, 80, 10, 160, 10, 160]. In preset 5, moving the logs from person 1
to person 0 (a click each) removes the backups + logs conflict and the code + deploy control then holds (reviewer 0).

## Check script

`python3 -I check.py` (the script as run, kept here):

```python
from itertools import product
PAIRS = [(0, 1), (2, 3), (4, 5), (6, 7)]
def dept(i): return 'O' if i % 2 == 0 else 'I'
def elig(d, duty):
    if duty == 7: return True
    return d == 'O' if duty < 4 else d == 'I'
def best(n, r):
    total, short_total = 0, 0
    for a, b in PAIRS:
        opts = []
        for i in range(n):
            o = [(0, 0)]
            if elig(dept(i), a): o.append((1, 0))
            if elig(dept(i), b): o.append((0, 1))
            if elig(dept(i), a) and elig(dept(i), b): o.append((1, 1))
            opts.append(o)
        bestv = None
        for combo in product(*opts):
            ha = sum(x[0] for x in combo); hb = sum(x[1] for x in combo)
            short = max(0, r - ha) + max(0, r - hb)
            over = sum(1 for x in combo if x == (1, 1))
            v = (short, over)
            if bestv is None or v < bestv: bestv = v
        short_total += bestv[0]; total += bestv[1]
    return total, short_total
for r in (1, 2):
    print('deputies' if r == 2 else 'single  ', ' '.join(
        '%d:%d%s' % (n, t, '' if s == 0 else ' short %d' % s) for n in range(3, 13) for t, s in [best(n, r)]))
```

Output: one holder `3:1 4:0 … 12:0`; deputies `3:5 short 3, 4:6, 5:4, 6:3, 7:1, 8:0 … 12:0`, the table above. It
checks the minimum (coverage first, then the overlap) by enumeration; the presets' numbers are checked by the tests.

## Sources

- ISO/IEC 27001:2022, Annex A 5.3 (segregation of duties), by number only. *(check: number and title against the
  2022 edition)*
- Compensating controls and the conflict matrix ("SoD ruleset"): common audit and identity-governance practice, no
  standard number on the page.
- NIS2, Directive (EU) 2022/2555, art. 21(2)(i), access control policies, EUR-Lex (the broader measure segregation
  belongs to). *(check: the point letter and the official Croatian wording)*
- DORA, Regulation (EU) 2022/2554, art. 9(4)(c), for financial entities: policies that limit access to what the job
  needs; mentioned in NOTES only. *(check)*

## Terms (hr / en)

razdvajanje dužnosti / segregation of duties (owner's term); nespojiva kombinacija / toxic combination; matrica
sukoba / conflict matrix; kompenzacijska kontrola / compensating control; prihvaćanje rizika / risk acceptance;
zamjena / deputy (cover for absence); neovisni pregled / independent review; načelo četiri oka / four-eyes principle
(owner's term; only in the explanation, linking `cmp-four-eyes`).

## Misconceptions targeted

- "We are too small for segregation of duties, so nothing can be done": a compensating control replaces separation.
- "A control is a control": a review of a log the person can edit proves nothing (preset 5).
- "Holiday cover is harmless": a deputy for every duty doubles the people separation needs (presets 2 → 3 → 6).
- "Accepting the risk resolves it": an accepted conflict is on record, but nothing finds an abuse.

## Out of scope

Approval queues and rubber-stamping (`cmp-four-eyes`); how access piles up over time (`cmp-jml-drift`); privileged
and break-glass accounts (`cmp-privileged-access`); log integrity and retention (`cmp-log-evidence`); roles as
bundles (the duties here are assigned directly); conflicts across more than two duties.
