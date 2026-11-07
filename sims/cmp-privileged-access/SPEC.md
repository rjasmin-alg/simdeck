<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-privileged-access: specification

Explorer (task `docs/tasks/w3/cmp-privileged-access.md`, catalogue `cmp-privileged-access` §4.13). One concept:
standing administrator rights are exposed every hour of the year; just-in-time elevation (requested, approved,
limited in time, logged) shrinks the window in which a stolen credential is an admin one; a break-glass account for
when the identity system itself is down stays sealed, alerts when used and is reviewed afterwards.

Code: `privileged.js` (rules 1–8, pure and wordless, promotable to `models/`), `sim.js` (rules 9–10), the page
`index.html`, words in `strings.js`. Tests: `sim.test.js`. Everything here is illustrative: one made-up firm, made-up
people and numbers; the page says so once and that it simplifies and is not legal advice.

## State and what a change does

An explorer: no steps. The state is a pure function of the params (`compute`). Every control (the panel's, and the
stage's buttons: the theft count, "New thefts", "Next stage", outage and alert) sets params, and the state is
recomputed.

## Rules

1. **The week and the year.** Hour h of the week (0…167) is day ⌊h / 24⌋ (0 = Monday) at hour h mod 24. Working
   hours are Monday to Friday 08:00–16:00, 40 hours a week. A standing right is there 365 × 24 = 8760 hours a year;
   just-in-time windows count 52 weeks a year.
2. **Elevation windows (just in time).** Each of the team's n = 2…8 administrators (default 4) gets `per` elevations a
   week, each lasting `len` ∈ {1, 2, 4, 8} hours. The working week is cut into 40 / `len` slots, Monday 08:00 onwards,
   day by day (slot s starts at ⌊s / (8 / len)⌋ · 24 + 8 + (s mod (8 / len)) · len). Person by person, in id order,
   `per` distinct slots are drawn by a partial Fisher–Yates shuffle (exactly `per` draws each) from
   mulberry32(seed + 7919). Windows never overlap and stay inside working hours; at most min(10, 40 / `len`) a week.
   The same pattern repeats every week of the year (a simplification). Because people are drawn in id order, a
   person's windows do not depend on the team size (tie-break).
3. **Admin at an hour.** Standing: always. Just in time: when a window covers the hour; a window covers its first hour
   and ends before first + `len` (an hour exactly at the end is outside, tie-break).
4. **Thefts.** `count` ∈ {10, 100, 1000} thefts, from mulberry32(seed), a separate stream from the schedule's. Each
   theft takes exactly three draws u₁, u₂, u₃ (tie-break: always three, so the people and the order of the thefts are
   the same whether they happen at any hour or only in working hours, and the first k thefts do not depend on how many
   are drawn): person ⌊u₁ · n⌋; at any hour, hour ⌊u₂ · 168⌋; in working hours only (`work`), day ⌊u₂ · 5⌋ at
   8 + ⌊u₃ · 8⌋. The thefts do not depend on the mode or on the windows, so both settings are judged on the same thefts.
5. **The numbers.** A theft is a stolen admin session (or token) that the attacker uses at once; it *carries admin
   rights* when its person is admin at its hour (rule 3). The attacker cannot get an elevation on their own (someone
   else approves it), and a stolen password kept for later is out of scope. Shown: the hits
   under standing rights (always all of them), the hits just in time on the same thefts, the expected share
   (standing 1; just in time `per` · `len` / 168, or / 40 for thefts in working hours, the share of theft hours that
   fall in a window), admin hours a year per person (8760, or `per` · `len` · 52), and elevations a year for the team
   (n · `per` · 52, each requested, approved, logged; none under standing rights). The hits are a binomial sample of
   the expected share: with 10 thefts they vary a lot, with 1000 they come close.
6. **The break-glass account: six stages.** 0 sealed (the password in a safe, in two halves), 1 the identity system is
   down (or, without an outage, an ordinary day), 2 opened (two people, two halves; the account does not depend on the
   identity system), 3 the alert (to the security lead and the management; every action logged), 4 restored and
   reviewed, 5 resealed (new password, new halves). Two switches: `outage` (the identity system really is down) and
   `alert` (a sign-in raises an alert). "Next stage" (key G) moves to the next stage, after 5 back to 0.
7. **Outcome, from stage 4 on.** Outage and alert → *justified*; outage, no alert → *known* (the use is known from
   the outage, the missing alert is a finding); no outage, alert → *caught* (used without need, found at once, a
   finding); no outage, no alert → *unnoticed*. Before stage 4 there is none.
8. **What holds at a stage.** The identity system is down at stages 1–3 when there is an outage (nobody can sign in as
   admin or get an elevation approved; the week shows a banner). The use is reviewed from stage 4 when there was an
   outage or an alert. The password is out of the safe from stage 2 until it is resealed at stage 5, which happens only
   when the use was reviewed; unnoticed, it stays out. The alert is sent from stage 3 when the switch is on.
   The stage labels follow the path: stage 1 without an outage is "an ordinary day", stage 3 without an alert "no
   alert", stages 4 and 5 without a review (no outage, no alert) "no review" and "not resealed" (`stageKey` in
   `sim.js`).
9. **Params** (a URL may carry anything): `mode` standing / jit (else the default); `team` rounded and clamped to
   2…8; `len` one of 1, 2, 4, 8 (else 2); `per` rounded and clamped to 1…min(10, 40 / `len`); `work` boolean;
   `thefts` one of 10, 100, 1000 (else 100); `seed` rounded and clamped to 1…999; `glass` rounded and clamped to 0…5;
   `outage`, `alert` booleans (true/false/1/0, anything else the default; in the page the kit already reads any toggle
   value in the URL other than true/1 as false, before the model sees it). "New thefts" (key N) sets seed + 1, after
   999 back to 1. The panel shows the mode, `per`, `len` and `work` (`per` and `len` disabled under standing rights; `work` stays,
   it moves the thefts under both); the
   stage holds the theft count, "New thefts" and the break-glass controls (the panel must fit one screen); `team` and
   `seed` are kept in the URL only.
10. **Caption.** With the break-glass account out of its seal (stage > 0) the caption follows the account: the
    stage's sentence (stage 1 and 2 by outage, stage 3 by alert, stages 4 and 5 by outcome). Otherwise the thefts:
    standing (every theft with rights, 8760 hours, and the same thefts just in time), or just in time (hits, share,
    expected share, the window in hours against 8760), then at most one note in this order: the windows cover every
    theft hour (expected share 1: just in time in name only); no hit (the risk is not zero); thefts in working hours.
    The first two cannot both apply (a share of 1 hits every theft), so their order does not matter.

## Presets

All with seed 42, four administrators, 100 thefts.

| # | id | params | hits standing / just in time | expected | admin h a year per person | elevations a year | break-glass |
|---|---|---|---|---|---|---|---|
| 1 | `standing` | standing (3 × 2 h for the comparison) | 100 / 4 | 100 % | 8760 | none (624 just in time) | sealed |
| 2 | `jit` | just in time, 3 × 2 h, any hour | 100 / 4 | 3.6 % | 312 | 624 | sealed |
| 3 | `work` | as 2, thefts in working hours | 100 / 15 | 15 % | 312 | 624 | sealed |
| 4 | `all-day` | just in time, 5 × 8 h, working hours | 100 / 100 | 100 % | 2080 | 1040 | sealed |
| 5 | `glass` | as 2, break-glass at stage 3, outage, alert | 100 / 4 | 3.6 % | 312 | 624 | alert sent, identity system down |
| 6 | `quiet` | as 2, break-glass at stage 5, no outage, no alert | 100 / 4 | 3.6 % | 312 | 624 | unnoticed, password still out |

Seed 42 is one of the 17 seeds in 1–999 whose hits for presets 2 and 3 equal the rounded expected numbers (4 and
15 of 100), and one of the five among them that also stay within 3 and 8 of the expected numbers with 1000 thefts
(35 of 1000 for 35.7; 149 for 150). Preset 4 at any hour: 23 of 100,
expected 23.8 %. Windows with seed 42, 3 × 2 h: Ana 38, 56, 110; Bruno 80, 82, 104; Iva 36, 58, 108; Dino 34, 58, 106
(hours of the week).

## Check script

`python3 -I check.py` (an independent re-implementation of mulberry32, the schedule and the thefts; the script as run):

```python
from fractions import Fraction as F
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
def schedule(seed, team, per, ln):
    r, n, out = rng(seed + 7919), 40 // ln, []
    for _ in range(team):
        s = list(range(n))
        for j in range(per):
            k = j + int(r() * (n - j)); s[j], s[k] = s[k], s[j]
        pd = 8 // ln
        out.append(sorted((x // pd) * 24 + 8 + (x % pd) * ln for x in s[:per]))
    return out
def thefts(seed, count, team, work):
    r, out = rng(seed), []
    for _ in range(count):
        u1, u2, u3 = r(), r(), r()
        h = int(u2 * 5) * 24 + 8 + int(u3 * 8) if work else int(u2 * 168)
        out.append((int(u1 * team), h))
    return out
def hits(seed, count, team, per, ln, work, standing=False):
    sch = schedule(seed, team, per, ln)
    return sum(1 for p, h in thefts(seed, count, team, work)
               if standing or any(s <= h < s + ln for s in sch[p]))
def share(per, ln, work): return F(per * ln, 40 if work else 168)
for name, per, ln, work, st in [('standing', 3, 2, False, True), ('jit', 3, 2, False, False), ('work', 3, 2, True, False),
                                ('all-day', 5, 8, True, False), ('all-day, any hour', 5, 8, False, False)]:
    e = F(1) if st else share(per, ln, work)
    print('%-18s expected %6.2f %%  hits/100 %3d  hits/1000 %4d  admin h/yr %4d' % (
        name, float(e) * 100, hits(42, 100, 4, per, ln, work, st), hits(42, 1000, 4, per, ln, work, st), 8760 if st else per * ln * 52))
print('schedule seed 42, 3×2 h:', schedule(42, 4, 3, 2))
print('elevations a year, 4 people × 3 a week:', 4 * 3 * 52, '; 5 a week:', 4 * 5 * 52)
```

Output:

```
standing           expected 100.00 %  hits/100 100  hits/1000 1000  admin h/yr 8760
jit                expected   3.57 %  hits/100   4  hits/1000   35  admin h/yr  312
work               expected  15.00 %  hits/100  15  hits/1000  149  admin h/yr  312
all-day            expected 100.00 %  hits/100 100  hits/1000 1000  admin h/yr 2080
all-day, any hour  expected  23.81 %  hits/100  23  hits/1000  238  admin h/yr 2080
schedule seed 42, 3×2 h: [[38, 56, 110], [80, 82, 104], [36, 58, 108], [34, 58, 106]]
elevations a year, 4 people × 3 a week: 624 ; 5 a week: 1040
```

The JavaScript gives the same numbers (tests "presets"). The expected share is exact: a theft's hour is uniform over
the 168 (or 40) hours, and the windows of a person cover `per` · `len` of them without overlap (rule 2).

## Sources

- ISO/IEC 27001:2022, Annex A 8.2 (privileged access rights), by number only. *(check: number and title against the
  2022 edition)*
- NIS2, Directive (EU) 2022/2555, art. 21(2)(i): human resources security, access control policies and asset
  management, EUR-Lex. *(check: the point letter, and the official Croatian wording; the page says "politike
  kontrole pristupa", as `cmp-sod-toxic` does)*
- Just-in-time elevation, break-glass (emergency access) accounts sealed in two halves with an alert and a review:
  common identity-governance practice, no standard number on the page.
- DR `student/handbook/it-wiki.md`: "Domain Admins: Tomasz, Ade and the break-glass administrator account" (student
  material, the seed of the entry); nothing from `instructor/`.
- Team size, elevations, lengths, working hours and the thefts are illustrative (the page says so once).

## Terms (hr / en)

stalna administratorska prava / standing admin rights (standing privileges); privremena prava / just-in-time access;
podizanje ovlasti / elevation; vjerodajnica / credential; račun za hitne slučajeve / break-glass account (owner's
term, settled 2026-11-07); sustav identiteta / identity system; upozorenje / alert; naknadni pregled / review
afterwards; ponovno zapečaćen / resealed; povlaštena prava pristupa / privileged access rights (ISO 8.2's title).

## Misconceptions targeted

- "Our admins are careful, so standing rights are fine": the exposure is the hours, not the care; every theft of a
  standing admin's credential carries the rights (presets 1 → 2).
- "Just in time is a label": elevated for the whole working day, every day, it is standing rights in working hours,
  exactly when credentials are stolen (preset 4).
- "A small sample says it is safe": with 10 thefts just in time often shows none; the risk is the share, not zero.
- "The break-glass account is an exception to the rules": it is the most powerful standing account, so it is sealed,
  alerts on every use and is reviewed; without the alert a use without need is invisible (presets 5, 6).

## Out of scope

How access piles up over time (`cmp-jml-drift`); segregation of duties (`cmp-sod-toxic`); the second signature on a
request (`cmp-four-eyes`); what an attacker does with an admin credential (`lateral-movement`); local administrator
passwords; log integrity (`cmp-log-evidence`); multi-factor authentication; separate admin accounts and admin
workstations.
