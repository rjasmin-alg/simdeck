<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-exceptions: specification

Explorer (task `docs/tasks/w3/cmp-exceptions.md`, catalogue `cmp-exceptions` §4.13; the acceptance is scored and signed
as in `cmp-risk-register`, §5.24). One concept: an exception to a standard is a risk acceptance: it needs an owner, a
compensating control and an expiry date; without expiry, exceptions pile up until they are the real policy; a review
at expiry renews, fixes or escalates.

Code: `exceptions.js` (rules 1–7, pure and wordless, promotable to `models/`), `sim.js` (rules 8–11), the page
`index.html`, words in `strings.js`. Tests: `sim.test.js`. Everything here is illustrative: one made-up firm, made-up
systems, requests and numbers; the page says so once and that it simplifies and is not legal advice.

## State and what a change does

An explorer: no steps. The state is a pure function of the params (`compute`). Every control sets params (the panel's;
on the stage the ◀ ▶ buttons and a click on a month of the history, which set `month`; the panel keeps `month` in the
URL only, to fit 1080 px), and the state is recomputed. The ◀ ▶ buttons stop at 0 and 24 (`aria-disabled`, focus
kept).

## Rules

1. **The regime.** `expiry` ∈ {0, 3, 6, 12} months, 0 meaning no end date. `atExpiry` ∈ {nothing, renew, review}
   says what happens when the end date comes. With `expiry` = 0 the regime is `none` whatever `atExpiry` says (the
   panel disables it); otherwise the regime is `atExpiry`.
2. **An exception as granted.** A request names a system, the month it arrives (it is granted the same month: every
   request is granted, under every regime), the months the fix takes once someone works on it (f), whether it has an
   owner and a compensating control, its likelihood l and impact i (1–5, the 5 × 5 matrix of `cmp-risk-register`) and
   the month its system is replaced, or none. With `complete` on, the policy accepts only complete requests, so every
   exception has an owner and a compensating control; off, it has what the request named. A compensating control
   lowers the likelihood one level (not below 1). The residual is scored l × i (`score`, copied from
   `cmp-risk-register`); it is signed by its owner within the appetite (8, `cmp-risk-register`'s default) and by the
   board above it; a score equal to the appetite is within (tie-break, `above`/`signer` copied). The signer follows
   the score alone: an exception granted without an owner is signed within the appetite by whoever granted it (the
   model keeps it as `owner`). "Without an owner" always means *granted* without one: the flag stays after the board
   names an owner at the first review (rule 3).
3. **When the system meets the standard again.** Under `review` the owner works to the deadline (fixes are finished
   when they are due, not earlier): the fix is done at the first review at which the months since the work began
   reach f, that is at start + ⌈f / E⌉ · E. The work begins at the grant; with no owner nobody answers the first
   review, it is escalated, the board names an owner and the work begins then (start = g + E). Under every other
   regime nobody plans the fix: only a replacement closes the exception. A replacement earlier than the fix closes it
   as *replaced*; a replacement in the same month as the fix counts as *fixed* (tie-break).
4. **Open.** An exception is open at month m when g ≤ m < closed (closed at m: at m the system meets the standard,
   tie-break). Month 0 is the start, month 24 the end of the second year.
5. **The register's status** of an open exception at month m, with k = ⌊(m − g) / E⌋ periods since the grant (at
   exactly g + E the first period is over, tie-break): `none`: *open-ended*; `nothing`: *in date* (k = 0), then
   *expired*; `renew`: *in date*, then *renewed*; `review`: *in date*, *renewed* in the second period (k = 1),
   *escalated* from the third; with no owner *escalated* from the first review on.
6. **What the reviews did by month m** (`review` only; zero otherwise). Each exception counts at most once in each:
   *fixed* (closed by a fix at or before m), *renewed* (still open at its first review, with an owner), *escalated*
   (still open at its second review with an owner, or at its first without one). A review happens only while the
   exception is open: one replaced at or before the review month is not reviewed. `noOwner` counts the escalations
   that came from a missing owner.
7. **The estate at month m.** n = 48 systems; a system meets the standard unless it has an open exception. Share =
   meets / 48. The oldest open exception has the largest age m − g; on a tie the first in arrival order (tie-break).
   Also counted: open ones by status, open ones without a compensating control, granted without an owner, above the
   appetite (signed by the board), a year old or older (age ≥ 12, tie-break: exactly 12 counts), and the systems closed by a
   replacement by m.
8. **The firm's requests.** 48 systems; 36 requests over the two years, at months ⌊24k / 36⌋ for k = 0…35 (1.5 a
   month), each on a different system, so 12 systems never need one. The table is `RAW` in `sim.js` (copied in the
   check script below). Reasons, for the stage only: an old operating system an old business application needs
   (f 10–13), a supplier-managed device that cannot take the standard settings (4–8), an update that breaks a business
   application (2–5), a service account that cannot use multi-factor sign-in (1–3), an old encryption protocol a
   partner still uses (6–7), a test machine outside the standard build (1–2). As requested, 24 of 36 name an owner and
   15 a compensating control; four systems are replaced within the two years (months 11, 13, 20, 24).
9. **History and comparison.** The history is the estate at every month 0…24 under the chosen params. The comparison
   is the share meeting the standard at the chosen month for the same requests under the four regimes, with the chosen
   `complete` and the chosen end date (or 6 months when there is none).
10. **Params** (a URL may carry anything): `expiry` one of 0, 3, 6, 12 by exact string match ("06", " 6", 9 → 0);
    `atExpiry` one of nothing, renew, review, exact match (else nothing); `complete` true/false/"true"/"false"/1/0/
    "1"/"0" (anything else, null included → true); `month` a finite number (a numeric string counts), rounded and
    clamped to 0…24; blank, whitespace, null, non-numeric or infinite (−∞ included) → 24. The defaults are preset 1.
11. **Caption.** The regime's sentence (month, share meeting the standard, oldest exception; for `nothing` the expired
    count, for `renew` the renewed count, for `review` what the reviews did), then at most one note in this order: a
    year's grace (`review`, E = 12, something open); no owner (`review`, an escalation from a missing owner); no
    compensating control (an open exception without one); the pile (12 or more open, a quarter of the estate).

## Presets

All at month 24 with `complete` on unless stated.

| # | id | params | meets (share) | oldest (request) | a year or older | register (open by status) | reviews: fixed / renewed / escalated | no control / granted without owner | board | note |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `open-ended` | no end date | 16 (33.3 %) | 24 (#0) | 16 | 32 open-ended | – | 0 / 0 | 15 | pile |
| 2 | `date-only` | 6 months, nothing | 16 (33.3 %) | 24 (#0) | 16 | 7 in date, 25 expired | – | 0 / 0 | 15 | pile |
| 3 | `auto-renew` | 6 months, renew | 16 (33.3 %) | 24 (#0) | 16 | 7 in date, 25 renewed | – | 0 / 0 | 15 | pile |
| 4 | `review` | 6 months, review | 37 (77.1 %) | 10 (#21) | 0 | 7 in date, 4 renewed | 23 / 10 / 1 | 0 / 0 | 6 | – |
| 5 | `incomplete` | 6 months, review, `complete` off (incomplete requests granted too) | 34 (70.8 %) | 14 (#15) | 1 | 7 in date, 2 renewed, 5 escalated | 20 / 6 / 10 (9 no owner) | 8 / 7 | 11 | no owner |
| 6 | `yearly` | 12 months, review | 31 (64.6 %) | 19 (#8) | 1 | 16 in date, 1 renewed | 16 / 1 / 0 | 0 / 0 | 9 | a year's grace |

Replaced by month 24: 4 in presets 1–3, 2 in 4 and 5, 3 in 6. The comparison at month 24 (complete on, 6 months):
16 / 16 / 16 / 37; with `complete` off: 16 / 16 / 16 / 34. Month by month, no end date against review at 6 months, systems
meeting the standard: 37 / 39 at month 6, 29 / 35 at 12, 21 / 36 at 18 (77.1 / 81.25 %, 60.4 / 72.9 %, 43.8 / 75 %).

The point of presets 1–3: the estate is the same (16 of 48), only the register differs: no end date shows 32
open-ended exceptions, an unchecked date shows 25 expired ones, renewal without a decision shows every exception in
date. Written vs operating.

## Check script

`python3 -I check.py` with the script below (an independent re-implementation of rules 2–7 from this text, not from
the JavaScript) prints the table above.

```python
import math
RAW = [(0,28,2,5,1,0,2,4,None),(0,35,3,2,1,0,4,2,None),(1,29,2,3,1,0,4,2,None),(2,47,5,2,0,0,4,2,None),
 (2,32,5,1,1,1,3,5,None),(3,37,1,6,1,0,2,5,None),(4,12,0,11,1,0,3,5,24),(4,11,1,8,0,1,2,5,None),(5,43,0,13,1,0,4,4,None),
 (6,30,0,11,1,1,4,2,13),(6,40,1,6,0,1,3,5,11),(7,6,1,5,0,0,4,5,None),(8,44,2,3,1,0,2,4,None),(8,19,4,6,1,0,4,3,None),
 (9,9,2,5,1,0,2,2,20),(10,5,1,7,0,1,4,5,None),(10,2,1,4,0,0,4,2,None),(11,34,5,1,1,0,3,5,None),(12,41,0,12,1,1,2,2,None),
 (12,14,5,2,1,1,4,3,None),(13,20,5,2,1,1,2,2,None),(14,23,0,10,1,0,2,2,None),(14,38,2,2,1,1,4,3,None),
 (15,27,5,2,0,0,2,5,None),(16,39,0,13,1,1,3,5,None),(16,25,3,1,0,0,3,5,None),(17,0,2,5,1,1,2,2,None),
 (18,16,0,10,0,1,3,5,None),(18,31,0,12,0,1,4,3,None),(19,1,2,5,1,0,3,4,None),(20,18,2,3,1,0,4,4,None),
 (20,36,0,12,1,1,4,2,None),(21,7,1,5,0,0,2,5,None),(22,33,3,3,0,1,4,5,None),(22,21,4,7,1,0,4,4,None),(23,45,2,2,1,0,2,2,None)]
R = [dict(zip('g sys why f owner ctl l i rep'.split(), r)) for r in RAW]
N, APP = 48, 8
def eff(r, cp):
    o = True if cp else bool(r['owner']); c = True if cp else bool(r['ctl'])
    return o, c, (max(1, r['l'] - 1) if c else r['l']) * r['i']
def close(r, E, mode, cp):
    o, c, s = eff(r, cp)
    rep = r['rep'] if r['rep'] is not None else math.inf
    fix = (r['g'] if o else r['g'] + E) + math.ceil(r['f'] / E) * E if E and mode == 'review' else math.inf
    if rep < fix: return rep, 'replaced'
    return (fix, 'fixed') if fix < math.inf else (math.inf, None)
def status(r, E, mode, cp, m):
    o, c, s = eff(r, cp); cl, _ = close(r, E, mode, cp)
    if not (r['g'] <= m < cl): return None
    if not E: return 'open'
    k = (m - r['g']) // E
    if k == 0: return 'valid'
    if mode == 'nothing': return 'expired'
    if mode == 'renew': return 'renewed'
    return 'renewed' if o and k == 1 else 'escalated'
def summary(E, mode, cp, m):
    op = [(i, r, status(r, E, mode, cp, m)) for i, r in enumerate(R)]
    op = [x for x in op if x[2]]
    ages = [m - r['g'] for i, r, s in op]
    old = max(ages) if ages else 0
    by = {k: sum(1 for x in op if x[2] == k) for k in ['open', 'valid', 'renewed', 'escalated', 'expired']}
    return dict(meets=N - len(op), pct=round(100 * (N - len(op)) / N, 1), oldest=old,
                oi=min([i for i, r, s in op if m - r['g'] == old]) if ages else None,
                year=sum(a >= 12 for a in ages), noctl=sum(not eff(r, cp)[1] for i, r, s in op),
                noown=sum(not eff(r, cp)[0] for i, r, s in op), board=sum(eff(r, cp)[2] > APP for i, r, s in op),
                repl=sum(1 for r in R if close(r, E, mode, cp)[1] == 'replaced' and close(r, E, mode, cp)[0] <= m),
                by={k: v for k, v in by.items() if v})
def revs(E, mode, cp, m):
    out = dict(fixed=0, renewed=0, escalated=0, noOwner=0)
    if not (E and mode == 'review'): return out
    for r in R:
        o, c, s = eff(r, cp); cl, why = close(r, E, mode, cp)
        op = lambda t: t <= m and r['g'] <= t < cl
        if why == 'fixed' and cl <= m: out['fixed'] += 1
        if o:
            out['renewed'] += op(r['g'] + E); out['escalated'] += op(r['g'] + 2 * E)
        elif op(r['g'] + E): out['escalated'] += 1; out['noOwner'] += 1
    return out
for name, E, mode, cp in [('open-ended', 0, 'nothing', True), ('date-only', 6, 'nothing', True),
        ('auto-renew', 6, 'renew', True), ('review', 6, 'review', True), ('incomplete', 6, 'review', False),
        ('yearly', 12, 'review', True)]:
    print(name, summary(E, mode, cp, 24), revs(E, mode, cp, 24))
for cp in (True, False):
    print('compare', cp, [summary(e, md, cp, 24)['meets'] for e, md in [(0, 'nothing'), (6, 'nothing'), (6, 'renew'), (6, 'review')]])
for m in (6, 12, 18): print('month', m, summary(0, 'nothing', True, m)['meets'], summary(6, 'review', True, m)['meets'])
```

## Legend, captions and terms

- Legend: in date (blue, solid), renewed (blue, striped), escalated (violet, dotted), expired (red, cross-hatched),
  open-ended (brown, horizontal stripes), meets the standard (light, empty); on a system: ✕ no compensating control,
  ? granted without an owner; a ring marks the oldest open exception.
- Terms (both languages, settled or chosen in `NOTES.md`): iznimka (*exception*), prihvaćanje rizika (*risk
  acceptance*), kompenzacijska kontrola (*compensating control*), rok isteka (*expiry date*), vlasnik (*owner*),
  obnoviti (*renew*), eskalirati (*escalate*), uprava (*the board*, as `cmp-risk-register`), apetit za rizik (*risk
  appetite*), standard (*standard*), registar iznimki (*exception register*).

## Misconceptions targeted

- "An exception with a date is under control": a date nobody acts on changes nothing in the estate (presets 1–2).
- "The register is in order, so we are compliant": renewal without a decision keeps every exception in date while a
  third of the estate meets the standard (preset 3).
- "A longer grace period is kinder and costs nothing": fixes slip to the deadline (preset 6).
- "An exception is a form": without an owner nobody answers the review; without a compensating control the full risk
  is accepted and more of them need the board's signature (preset 5).

## Out of scope

Refused requests (every request is granted, so the regimes compare on the same stream); the cost of a fix or of a
review; risk that materialises (incidents); exceptions that are reopened after a fix; more than one exception per
system.

## Sources

- ISO/IEC 27001:2022, clause 6.1.3 (risk treatment; the risk owners accept the residual risk) and clause 10.2
  (nonconformity and corrective action), by number only, never quoted. *(check: clause numbers and the acceptance item
  against the 2022 edition)*
- NIS2, Directive (EU) 2022/2555, art. 20(1) (management bodies approve the cybersecurity risk-management measures and
  oversee them) and art. 21(1) (appropriate and proportionate measures), EUR-Lex. *(check: the official Croatian
  wording for "upravljačka tijela" against EUR-Lex)*
- Compensating controls and time-limited exceptions as common governance practice (not a clause), as in
  `cmp-sod-toxic` and `cmp-patch-sla`.
- The scoring and signing of a residual risk: `cmp-risk-register` SPEC rules 1, 4 and 5 (functions copied).
- All numbers (48 systems, 36 requests, fix efforts, owners, controls, replacements, the appetite) are illustrative.
