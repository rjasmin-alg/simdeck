<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-data-subject-request: specification

Stepper (task `docs/tasks/w3/cmp-data-subject-request.md`, catalogue `cmp-data-subject-request` §4.13). One concept: a
person may ask for a copy of their data or for its erasure, and the answer is due within one month of receipt (two
more for complex requests, GDPR art. 12(3)); personal data sit in more places than the main system, so the record of
processing activities and the data map beside it decide how much is found; erasure reaches the backups only as they
age out.

The contrast on the stage: the same request with a complete data map, with a map of the systems only, and with none;
the viewer sees all eight places that really hold the data, the team only those on its list.

Code: `sim.js` (every rule, pure and wordless), the page `index.html`, words in `strings.js`. Tests: `sim.test.js`.
Everything is illustrative: one made-up firm, one made-up former customer, made-up places and durations; the page says
so once, and that it simplifies and is not legal advice.

## State and what a step does

The whole request is computed from the params (`plan`); a step only chooses how much of it is shown and which day the
clock reads (`build(p, n)`). Steps: 0 received, 1 logged, 2–9 the eight places in order, 10 the answer, 11 afterwards.

## Rules

1. **Calendar.** Day 0 is Monday 1 March 2027, the day the request arrives in the support mailbox. The answer is due
   one month after receipt: the same day of the next month, or that month's last day when it has no such day
   (tie-break) (`addMonths`): day 31, 1 April 2027. A two-month extension would move it to day 92, 1 June 2027, only if
   announced with reasons within the first month (art. 12(3)); the page shows that limit and does not model the
   extension.
2. **Logged.** The request waits `noticed` days (0…21) in the mailbox before it reaches the person in charge; it is
   logged and the identity confirmed one day later (day `noticed` + 1). The clock ran from day 0 all the same.
3. **The list.** Eight places hold the data (fixed, made up), in this order; each has the days one search takes when
   the map names the place and its owner, the maps that list it, and what an erasure does there:

   | # | id | place | days | complete | systems only | none | erasure |
   |---|---|---|---|---|---|---|---|
   | 1 | `crm` | customer records | 1 | ✓ | ✓ | ✓ | erased |
   | 2 | `invoices` | invoices | 2 | ✓ | ✓ | ✓ | kept (a law requires it) |
   | 3 | `support` | support mailbox | 2 | ✓ | ✓ | ✓ | erased |
   | 4 | `newsletter` | newsletter at an external service (a processor) | 3 | ✓ | ✓ | | erased by the processor |
   | 5 | `sales` | a salesperson's mailbox | 2 | ✓ | | | erased |
   | 6 | `export` | an export in a shared folder | 1 | ✓ | | | erased |
   | 7 | `test` | a test copy of the database | 2 | ✓ | | | erased |
   | 8 | `backups` | nightly backups | 1 | ✓ | ✓ | | recorded, ages out |

   The team goes through the places in order. A place on the list takes its days, four more without a map (asking
   around who has what); a place not on the list is missed and takes no time (tie-break). Each place's day is the day
   its search (and, for an erasure, its erasure) ends.
4. **The answer** goes out two days after the last search. On time when the answer day ≤ the due day (tie-break: the
   due day itself is on time); late by answer − due days otherwise.
5. **Outcomes.** Access: every place found goes into the copy (`found`); the backups hold the same data, so the answer
   states how long they keep them (`noted`, art. 15(1)(d)). Erasure: `erased`, `processor` (erased on the controller's
   instruction), `kept` (invoices, a legal obligation, art. 17(3)(b)) or `recorded` (backups: one person cannot be
   erased from them; the erasure record notes until when, and that a restore must be followed by erasing again). A
   place not on the list is `missed` in either kind.
6. **Backups** (`cmp-retention-hold` rule 7, in days). The last in-house erasure is the latest day of an `erased` place
   (the processor's backups are its own, tie-break). The last backup holding the data was taken the night before;
   each backup is kept `backup` months (1, 3, 6, 12, 36), so the data are in the backups while day < `gone` =
   `addMonths(lastErase, backup)`. Only an erasure has a `gone`; without a map the backups are not on the list, but the
   data are in them all the same (nobody recorded it).
7. **The clock at each step.** Step 0: day 0. Step 1: the logged day. Steps 2–9: the day of the latest place so far
   that is on the list (the logged day if none, which cannot happen with these places: `crm` is on every list). Step 10: the answer day. Step 11: for an erasure the later of the
   answer day and `gone`, for access the answer day.
8. **Steps.** 11 (12 states). Places are revealed one per step from step 2 and all from step 10. The step count is
   fixed for every map: a missed place still gets its step, so the class watches the team walk past it.
9. **Params** (a URL may carry anything): `kind` access / erasure, `map` good / partial / none (else the default);
   `noticed` rounded and clamped to 0…21; `backup` one of its list, else the default (3); the step rounded and
   clamped to 0…11. The backup period is a panel control in both kinds (access states it in the answer).
10. **Caption.** Step 0: the request (access or erasure), then the clock. Step 1: logged (the same day, or after
    waiting `noticed` days), then what the map lists. Steps 2–9: a place on the list: its outcome and the time it
    took, then the days left (day < due), the due day itself, or the days past the deadline; not on the list: missed (the backups
    with their own sentences, for access and for erasure). Step 10: on time, on the due day itself, or late (an extension is
    only for a complex request or many requests, announced in the first month; a forgotten request is neither), then complete or partial (access or erasure). Step 11: access: everything,
    or the live places the data subject did not receive (`still`); erasure: the erased data aged out of the backups,
    recorded or unrecorded, then what still exists (and is still backed up), or nothing but the invoices.

## Presets

All with backups kept 3 months. Read at step 10 (the answer).

| # | id | params | found | answer (day, date) | on time | missed | erased | kept | in backups until | still there |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `good` | access, complete map, waits 2 days | 8 | 19, 20 Mar 2027 | yes | 0 | – | – | – | – |
| 2 | `partial` | access, systems only, 2 days | 5 | 14, 15 Mar 2027 | yes | 3 | – | – | – | sales, export, test |
| 3 | `none` | access, no map, 2 days | 3 | 22, 23 Mar 2027 | yes | 5 | – | – | – | newsletter, sales, export, test |
| 4 | `late` | access, no map, 14 days | 3 | 34, 4 Apr 2027 | 3 days late | 5 | – | – | – | as 3 |
| 5 | `erase-good` | erasure, complete map, 2 days | 8 | 19 | yes | 0 | 6 | 1 | 17 Jun 2027 | – |
| 6 | `erase-none` | erasure, no map, 2 days | 3 | 22 | yes | 5 | 2 | 1 | 21 Jun 2027 (not recorded) | newsletter, sales, export, test |

Reachable by hand, checked too: complete map waiting 14 days answers on day 31, the due day itself, on time; 15 days,
day 32, one day late. Erasure with systems only: 3 erased, invoices kept, backups recorded until 9 Jun 2027, three
places still hold the data. Complete map with backups kept 12 months: in the backups until 17 Mar 2028.

What each shows: 1, a complete map finds all eight places on day 19; 2, a map of the systems only is faster (day 14)
and the answer misses the copies people made; 3, without a map the team asks around, finds three places and is
slower; 4, the same with two weeks in the mailbox misses the deadline (a complete map with the same wait still makes
it, on the due day); 5, an erasure that erases six places, keeps the invoices by law and records the backups until
they age out; 6, without a map two places are erased, four still hold the data, and nobody wrote down that the
backups do.

## Expected numbers, checked

`sim.test.js` checks the table. This independent re-implementation (Python's own calendar for the month arithmetic, a
single loop instead of the model's per-step build) prints the same numbers:

```python
# Independent check of cmp-data-subject-request's numbers (SPEC.md). Python 3, standard library only.
import datetime as dt
D0 = dt.date(2027, 3, 1)
LOC = [('crm', 1, 'gpn', 'erase'), ('invoices', 2, 'gpn', 'keep'), ('support', 2, 'gpn', 'erase'),
       ('newsletter', 3, 'gp', 'processor'), ('sales', 2, 'g', 'erase'), ('export', 1, 'g', 'erase'),
       ('test', 2, 'g', 'erase'), ('backups', 1, 'gp', 'age')]
def add_months(d, k):
    y, m = divmod(d.month - 1 + k, 12)
    y += d.year; m += 1
    last = [31, 29 if y % 4 == 0 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
    return dt.date(y, m, min(d.day, last))
DUE = (add_months(D0, 1) - D0).days
EXT = (add_months(D0, 3) - D0).days
def run(kind='access', map='good', noticed=2, backup=3):
    day = noticed + 1
    found, missed, last_erase, erased, kept = [], [], None, 0, 0
    for lid, days, lists, act in LOC:
        if map[0] in lists:
            day += days + (4 if map == 'none' else 0)
            found.append(lid)
            if kind == 'erasure' and act in ('erase', 'processor'):
                erased += 1
                if act == 'erase': last_erase = day
            if kind == 'erasure' and act == 'keep': kept += 1
        else:
            missed.append(lid)
    ans = day + 2
    gone = None
    if kind == 'erasure' and last_erase is not None:
        gone = add_months(D0 + dt.timedelta(last_erase), backup)
    return dict(found=len(found), ans=ans, onTime=ans <= DUE, late=max(0, ans - DUE), missed=missed, erased=erased,
                kept=kept, gone=gone and gone.isoformat(), backupsListed='backups' in found,
                still=[m for m in missed if m != 'backups'])
print('due day', DUE, add_months(D0, 1), 'extension limit day', EXT, add_months(D0, 3))
for name, kw in [('good', {}), ('partial', dict(map='partial')), ('none', dict(map='none')),
                 ('late', dict(map='none', noticed=14)), ('erase-good', dict(kind='erasure')),
                 ('erase-none', dict(kind='erasure', map='none')),
                 ('good14', dict(noticed=14)), ('good15', dict(noticed=15)),
                 ('erase-partial', dict(kind='erasure', map='partial')), ('erase-good-b12', dict(kind='erasure', backup=12))]:
    o = run(**kw)
    print(name, o['found'], o['ans'], 'on time' if o['onTime'] else 'late %d' % o['late'], len(o['missed']), o['erased'],
          o['kept'], o['gone'] or '-', ','.join(o['still']) or '-')
```

Output (name, found, answer day, on time, missed, erased, kept, in backups until, still there):

```
due day 31 2027-04-01 extension limit day 92 2027-06-01
good 8 19 on time 0 0 0 - -
partial 5 14 on time 3 0 0 - sales,export,test
none 3 22 on time 5 0 0 - newsletter,sales,export,test
late 3 34 late 3 5 0 0 - newsletter,sales,export,test
erase-good 8 19 on time 0 6 1 2027-06-17 -
erase-none 3 22 on time 5 2 1 2027-06-21 newsletter,sales,export,test
good14 8 31 on time 0 0 0 - -
good15 8 32 late 1 0 0 0 - -
erase-partial 5 14 on time 3 3 1 2027-06-09 sales,export,test
erase-good-b12 8 19 on time 0 6 1 2028-03-17 -
```

## Legend, terms, out of scope

- **Legend:** on the list (solid outline) and not on the list (dashed); ✓ found or erased (green); § kept by law
  (amber); ⌛ in the backups (dotted outline); ✕ missed (red stripes). The clock strip: waiting in the mailbox
  (hatched), the days used (solid), past the deadline (red stripes); the due day a thick line, the answer a dotted
  one, both labelled on the stage; the strip's segments are not in the header legend (it holds the card marks). Every
  carrier is a glyph, a line style or a pattern as well as a colour. After an erasure that missed places, the backups
  card reads "erased data aged out; missed data still backed up" (dotted, not green).
- **Misconceptions targeted:** "the clock starts when we see the request" (it starts on receipt); "the main system is
  where the data are" (exports, mailboxes, test copies, processors, backups); "a fast answer is a good answer" (the
  systems-only map is the fastest and the least complete); "erasure means everything goes" (what a law requires stays,
  backups age out, and a restore can bring data back unless the erasure is recorded).
- **Out of scope:** verifying identity when in doubt (art. 12(6)); exemptions and refusals (manifestly unfounded or
  excessive requests, others' rights); the extension itself; the format of the copy; the other rights (rectification,
  restriction, portability, objection); how backups rotate (`retention-gfs`); retention periods and holds
  (`cmp-retention-hold`).
