<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-retention-hold: specification

Explorer (task `docs/tasks/w3/cmp-retention-hold.md`, catalogue `cmp-retention-hold` §4.13). One concept: each record
class is kept for a period counted from a trigger, and deleting it afterwards is an obligation too (storage
limitation); a legal hold suspends deletion for the records a dispute touches; deleted data lives on in backups until
they age out.

The contrast on the stage: a written retention period against a deletion that operates, and a hold that only the
records the dispute needs, only while it runs, against a hold that is announced but not in the routine, never lifted,
or put on everything.

Code: `sim.js` (every rule, pure and wordless), the page `index.html`, words in `strings.js`. Tests: `sim.test.js`.
Everything here is illustrative: one made-up firm, thirteen made-up records, made-up periods that are not the
statutory ones; the page says so once and that it simplifies and is not legal advice.

## State and what a change does

An explorer: no steps. The state is a pure function of the params (`compute`): every record's life over the whole
window under the chosen periods, routine, dispute and hold, read at the end of the chosen year. Every control (the
panel's three choices, and the stage's steppers for the year, the dispute, the backups and the three periods) sets
params, and the state is recomputed. "Run the years" is the year stepper: the bars grow and the numbers change.

## Rules

1. **The window.** Months 0…143, January 2020 to December 2031. The state is read at the end of December of the year
   `now` (month (now − 2020) · 12 + 11).
2. **The records** (fixed, made up): three classes, each record with the month it first exists (`from`, 0 = already
   there before the window) and its trigger month (the month the period starts counting).
   | class | trigger | records (from → trigger) |
   |---|---|---|
   | job applications of candidates not hired (`app`) | the hiring decision | 2020 (0 → 2), 2022 (27 → 29), 2025 (67 → 69), 2028 (96 → 98) |
   | customer contracts (`contract`) | the end of the contract | Sjever (0 → 17), Lipa (3 → 37), Most (20 → 58), Orbita (38 → 79), Kvadrat (61 → 119) |
   | personnel files of people who left (`staff`) | the end of employment | Iva (0 → 10), Marko (0 → 27), Petra (14 → 72), Luka (0 → 101) |
   The customer dispute touches the Lipa contract; the employee dispute touches Marko's personnel file. Only records
   with `from` ≤ the read month are drawn and counted.
3. **The period.** Due month = trigger + the class's period in months. Periods (stage steppers, over a list; default
   in bold): applications 3, 6, **12**, 24, 36, 60; contracts 12, 24, 36, **60**, 84, 120; personnel files 12, 24, 36,
   60, **72**, 120. The record is kept lawfully in months [trigger, due) and must be gone from the due month on.
4. **The deletion routine** (`purge`): `none` never runs; `yearly` runs in January (month % 12 = 0); `monthly` runs
   every month. A record is deleted in the first month m ≥ due in which the routine runs and does not skip it
   (rule 5). Deletion happens at the start of that month (tie-break: the due month itself is on time).
5. **The dispute and the hold.** `dispute` none / customer / employee; it runs over months [from, to), from =
   (`from` − 2020) · 12 (January of year `from`, 2020…2031), to = from + 12 · `years` (1…5). The routine skips a
   record in month m (`hold`): `paper` (announced only) never; `held` (in the routine) the touched record while the
   dispute runs; `forgotten` (never lifted) the touched record from the dispute's start on, for good; `all` (on
   everything) every record while the dispute runs. Without a dispute nothing is skipped.
6. **Needed.** A record is needed in month m when m < due, or when it is touched and the dispute runs in m. Nothing
   else (not a hold) makes keeping it lawful.
7. **Each record at the read month `now`** (only months [from, end) count, end = the deletion month if deleted by
   `now`, else now + 1):
   - **over**: the months in [due, end) in which it is not needed (kept too long, record-months).
   - **status**: deleted by `now`: *underHold* if needed in its deletion month (the dispute needed it: deleted during
     the dispute), else *late* if over > 0, else *onTime*. Not deleted: *active* if now < trigger, *kept* if now < due,
     *held* if needed in `now` (past due, kept for the dispute), else *tooLong*.
   - **wait** (deleted records): the months in [due, deletion) in which the routine did not skip the record, the
     routine's own share of the delay (a hold's months are the hold's, not the routine's).
   - **backups**: one backup at the end of every month, each kept `backup` months (1, 3, 6, **12**, 24, 36, 60, 120).
     A record deleted in month d was last backed up at the end of d − 1, so it stays in the backup set through month
     d − 1 + backup: *in backup* when now < d + backup.
   - **segments** for the bar, clipped to [from, min(end, now + 1)): *use* [from, trigger), *keep* [trigger, due),
     then month by month *need* or *over* (merged), then *backup* [d, min(d + backup, now + 1)).
8. **The numbers.** Counts per status; **kept too long** = records with over > 0 (still there or deleted late), with
   the sum of over (months over in all); **deleted** and of them **on time**, **late**, **during the dispute**;
   **erased, still in the backups** = deleted records in backup, with the last month any of them is still there
   (max d − 1 + backup); the **longest wait** the routine caused (max wait over deleted records). The caption's "kept for a reason" = active + kept + held (in use, within retention, held for the dispute).
9. **Params** (a URL may carry anything): `now` rounded and clamped to 2020…2031; `purge`, `dispute`, `hold` one of
   their values (else the default); `from` rounded and clamped to 2020…2031; `years` rounded and clamped to 1…5; each
   period and `backup` the nearest value of its list (tie: the smaller). Steppers move to the next value of the list
   (or ±1 for `now`, `from`, `years`) and stay at the ends. The panel holds `purge`, `dispute` and `hold` (disabled,
   with the reason, without a dispute); the rest are stage steppers next to what they move (the panel must fit one
   screen).
10. **Caption.** The main line (*capMain*): kept for a reason, kept too long, deleted, of them on time. Then at most
    two notes, in this order. About the dispute, once it has started by the read month (at most one): the touched
    record was deleted before the dispute began (*nGone* when it was still in the backups at the dispute's start,
    del + backup > from, else *nGoneAged*; any hold); it was deleted during it (*nPaper*); the hold was never lifted
    and the record is now kept too long (*nForgotten*, with the months over counted from the dispute's end only); the
    hold on everything delayed records the dispute does not touch, deleted late in the month it was lifted (*nAll*,
    with their count; so only with a routine and only after the lift); with the routine every month, the hold in the
    routine or a hold not yet lifted kept the record past a due month that fell inside the dispute and has passed
    (*nHeld*). About the routine (at most one): none, with records kept too long (*nNone*); once a year, with a
    longest wait above 0 (*nYearly*, that wait). Last: erased records still in the backups (*nBackup*, a count after
    a colon so no word agrees with it). Only the first two are shown.

## Presets

All with the default periods (applications 1 year, contracts 5, personnel files 6), backups kept a year, read at the
end of 2031.

| # | id | params | kept for a reason | kept too long (months over) | deleted | on time | during the dispute | in backups (last) | notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `none` | no routine | 3 | 10 (582) | 0 | 0 | 0 | 0 | nNone |
| 2 | `routine` | every month | 3 | 0 (0) | 10 | 10 | 0 | 1 (07/2032) | nBackup |
| 3 | `paper` | every month, customer dispute 2027–2029, hold announced only | 3 | 0 (0) | 10 | 9 | 1 (Lipa, 02/2028) | 1 (07/2032) | nPaper, nBackup |
| 4 | `held` | as 3, hold in the routine | 3 | 0 (0) | 10 | 10 | 0 | 1 (07/2032) | nHeld, nBackup |
| 5 | `forgotten` | as 3, hold never lifted | 3 | 1 (24) | 9 | 9 | 0 | 1 (07/2032) | nForgotten, nBackup |
| 6 | `archive` | every month, backups kept 10 years | 3 | 0 (0) | 10 | 10 | 0 | 9 (07/2041) | nBackup |

Reachable by hand, checked too: hold on everything (as 4, `all`): 3 kept too long (33 months: applications 2028 10,
Most 2, Marko 21), 7 on time, notes nAll, nBackup; once a year (`yearly`, no dispute): 10 kept too long (66), 9
deleted, all late, the longest 11 months, note nYearly; the dispute starting 2029 (as 4, `from` 2029): Lipa was deleted
in 02/2028, note nGone; read at the end of 2028 (as 4, `now` 2028): 7 kept for a reason (Kvadrat still in use, Lipa held), 6 deleted, 1 in
backups until 03/2029, note nHeld.

What each shows: 1, the periods are written down and nothing operates: ten records past their date, 582 months over;
2, a routine that runs every month deletes all ten on time, and the newest erased record is still in the backups for
a year; 3, the hold goes out by e-mail and the routine never hears of it: the Lipa contract goes in 02/2028, while the
dispute needs it until 12/2029; 4, the routine skips only Lipa and deletes it when the hold is lifted (01/2030),
everything else on time; 5, nobody lifts the hold: Lipa stays 24 months with no reason; 6, deletion runs on time and
the erased records live on in the backups for ten years.

## Expected numbers, checked

The table is checked by `sim.test.js` and by this independent Python re-implementation (month by month over the whole
window, a different shape from the model's), which prints the same numbers:

```python
# Independent check of cmp-retention-hold's numbers (SPEC.md). Python 3, no dependencies.
REC = [('app', 0, 2, None), ('app', 27, 29, None), ('app', 67, 69, None), ('app', 96, 98, None),
       ('contract', 0, 17, None), ('contract', 3, 37, 'customer'), ('contract', 20, 58, None),
       ('contract', 38, 79, None), ('contract', 61, 119, None),
       ('staff', 0, 10, None), ('staff', 0, 27, 'employee'), ('staff', 14, 72, None), ('staff', 0, 101, None)]
D = dict(now=2031, purge='none', dispute='none', hold='held', frm=2027, years=3, app=12, contract=60, staff=72, backup=12)

def run(**kw):
    p = dict(D, **kw)
    now = (p['now'] - 2020) * 12 + 11
    ds = (p['frm'] - 2020) * 12; de = ds + 12 * p['years']
    disp = p['dispute'] != 'none'
    out = dict(reason=0, overRec=0, over=0, deleted=0, onTime=0, late=0, under=0, inB=0, last=None, lateMax=0)
    for cls, frm, trig, which in REC:
        if frm > now: continue
        due = trig + p[cls]
        touched = disp and which == p['dispute']
        alive, del_m, over = True, None, 0
        for m in range(frm, now + 1):               # month by month: delete at the start, then count
            in_d = disp and ds <= m < de
            need = m < due or (touched and in_d)
            runs = p['purge'] == 'monthly' or (p['purge'] == 'yearly' and m % 12 == 0)
            skip = disp and m >= ds and ((p['hold'] == 'held' and touched and m < de) or
                                         (p['hold'] == 'forgotten' and touched) or (p['hold'] == 'all' and m < de))
            if alive and m >= due and runs and not skip:
                alive, del_m = False, m
                kind = 'under' if need else ('late' if over else 'onTime')
                out['deleted'] += 1; out[kind] += 1
                if kind == 'late': out['lateMax'] = max(out['lateMax'], over)
                if now < m + p['backup']:
                    out['inB'] += 1; out['last'] = max(out['last'] or 0, m + p['backup'] - 1)
            if alive and m >= due and not need: over += 1
        if alive:
            last_need = now < due or (touched and disp and ds <= now < de)
            if last_need: out['reason'] += 1
        out['over'] += over; out['overRec'] += over > 0
    return out

fmt = lambda m: '-' if m is None else '%02d/%d' % (m % 12 + 1, 2020 + m // 12)
for name, kw in [('none', {}), ('routine', dict(purge='monthly')),
                 ('paper', dict(purge='monthly', dispute='customer', hold='paper')),
                 ('held', dict(purge='monthly', dispute='customer', hold='held')),
                 ('forgotten', dict(purge='monthly', dispute='customer', hold='forgotten')),
                 ('archive', dict(purge='monthly', backup=120)),
                 ('all', dict(purge='monthly', dispute='customer', hold='all')),
                 ('yearly', dict(purge='yearly')),
                 ('now2028', dict(purge='monthly', dispute='customer', hold='held', now=2028))]:
    o = run(**kw)
    print(name, o['reason'], o['overRec'], o['over'], o['deleted'], o['onTime'], o['late'], o['under'], o['inB'],
          fmt(o['last']), o['lateMax'])
```

Output (name, kept for a reason, kept too long, months over, deleted, on time, late, during the dispute, in backups,
last, the largest months over among late records; for `yearly` without a dispute that equals the routine's longest
wait, and under a hold on everything it includes the hold's delay):

```
none 3 10 582 0 0 0 0 0 - 0
routine 3 0 0 10 10 0 0 1 07/2032 0
paper 3 0 0 10 9 0 1 1 07/2032 0
held 3 0 0 10 10 0 0 1 07/2032 0
forgotten 3 1 24 9 9 0 0 1 07/2032 0
archive 3 0 0 10 10 0 0 9 07/2041 0
all 3 3 33 10 7 3 0 1 07/2032 21
yearly 3 10 66 9 0 9 0 0 - 11
now2028 7 0 0 6 6 0 0 1 03/2029 0
```

## Legend, terms, out of scope

- **Legend:** in use (pale, outlined); retention (solid); held for the dispute (hatched); kept too long (striped);
  deletion marks ✓ on time (round, green), ! late (round, dashed), ✕ during the dispute (square, filled); in a backup
  (dotted outline). The dispute is a band behind the rows, labelled with its years and the hold; a hold never lifted
  continues as a hatched band. Each carrier is shape or pattern as well as colour.
- **Misconceptions targeted:** "a retention period means keep at least this long" (it is also the latest date);
  "a hold is an e-mail" (it has to stop the deletion that operates); "when in doubt, hold everything" (that is
  keeping too long, too); "deleted means gone" (backups keep it until they age out).
- **Out of scope:** the statutory periods themselves (illustrative values only); restoring from a backup and
  re-deleting what comes back; holds on the backups; a data subject's erasure request (its own sim); anonymisation
  as an alternative to deletion.
