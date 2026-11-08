<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-incident-clocks: specification

Task `docs/tasks/w3/cmp-incident-clocks.md`, catalogue `cmp-incident-clocks` (§4.13; seed: an outage found late,
`rpo-rto` preset "found on Monday"; hub of the incident-timeline model, §5.24). Class **stepper**, 7 steps. The state
at step *n* is a pure function of *n* and the params (`sim.js`); the timeline and its clocks are `clocks.js` (pure,
wordless, promotable to `models/`).

**One concept:** a significant incident starts NIS2's clocks at awareness (early warning within 24 hours, incident
notification within 72 hours, final report within a month of the notification, art. 23(4)); a personal-data breach
goes to the supervisory authority within 72 hours of awareness (GDPR art. 33(1)); the clocks start at awareness, not
at the attack, and run through nights and weekends; one incident can start both sets.

**The contrast on the stage:** the clock started at awareness against the clock started at the attack (a dashed,
struck-through "from the attack?" lane), and hour clocks that run on through a weekend against the office hours of
whoever may file the report (with and without an on-call rota).

## Stage

A day axis (one column per day, weekends hatched; one compressed "… n days …" column when detection comes more than two
days after the attack's day) with lanes:

1. **Incident:** attack ▲, detection ●, the triage bar and awareness ◆ ("clocks start"), each with its time.
2. **From the attack?** (misconception): a dashed box from the attack to attack + 24 h, ✗, "would end …" struck through.
3. **Early warning** (NIS2 · 24 h), **Incident notification** (NIS2 · 72 h), **Personal-data breach** (GDPR · 72 h):
   a bar from awareness to the deadline ("due …" inside), filled up to now; a tick and "✓ filed …" or "✗ n h late,
   filed …" below; a hatched red bar from the deadline to a late filing; "not running: …" when the clock does not start.
4. **Who files:** the office-hours blocks (weekdays 8–16) or one band (on call), and the hours of work on reports up to
   now, in ink.
5. A **now** line through every lane and a "now" tag under them (steps 1–5; at steps 6–7 now is a month on, past
   the axis, and the line is hidden).

Below: a table, one row per clock (early warning, notification, final report, GDPR) with start, due, filed and result;
the rows the step is about are highlighted. The foot says once: simplified, not legal advice, made-up firm, hours of
work and office hours, holidays and daylight saving left out.

## Fixed data (illustrative)

- Reference week: Monday **1 March 2027** (no daylight-saving change or Croatian public holiday from 1 to 22 March;
  the final reports fall in April, after Easter Monday 29 March). Hour 0 = Monday 1 March 00:00.
- Office hours: weekdays, hour slots 08:00–16:00 (8 hours a day).
- Hours of work per report: early warning **1**, incident notification **3**, GDPR breach notification **3**. The final
  report is not simulated, only its deadline.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `day` | select | 0–6, Monday–Sunday (0) | the attack's day in the reference week |
| `hour` | range | 0–23 (22) | the attack's hour |
| `detect` | range | 0–168 h (9) | from the attack to detection |
| `triage` | range | 1–24 h (3) | from detection to awareness |
| `significant` | toggle | (on) | NIS2 significant incident |
| `personal` | toggle | (on) | personal data affected (a notifiable breach) |
| `reporting` | choice | `office`, `oncall` (`office`) | who may file reports works office hours, or is on call 24/7 |

## Rules

### The timeline (`clocks.js`, promotable)

1. **Calendar.** Hours count from Monday 00:00 of the reference week; `moment(h)` gives the day, hour, weekday and
   civil date; `week0` must be a Monday (the weekday of an hour is taken from the hour itself, so `timeline` throws
   otherwise). **One calendar month later** is the same day number in the next month at the same hour; **tie-break:**
   a day the month lacks becomes its last day (31 January → 28 February, 29 in a leap year; 31 March → 30 April).
2. **Working time.** On call: every hour slot is worked. Office: weekdays, slots 8…15. **Tie-break:** the slot from
   15:00 to 16:00 is the last one worked; the 16:00 slot is not. An unknown mode throws (in `timeline` even when no
   report needs work).
3. **Work.** A report needing *k* hours fills the next *k* worked slots from its start; it is filed when its last slot
   ends. Zero hours is filed at once.
4. **Moments.** detection = attack + `detect`; awareness = detection + `triage`. Every hour clock starts at awareness,
   whatever the attack's time: the same awareness gives the same clocks.
5. **Deadlines.** early warning = awareness + 24 h; incident notification = awareness + 72 h; GDPR = awareness + 72 h;
   all in plain hours, through nights and weekends. Final report = one calendar month (rule 1) after the hour the
   notification was **filed**, so a late notification moves it.
6. **Which clocks run.** The three NIS2 clocks when the incident is significant; the GDPR clock when personal data is
   affected; none when neither.
7. **One queue.** Reports are prepared one after another in clock order (early warning, notification, GDPR); each
   starts when the one before is filed, the first at awareness. **Tie-break:** the two 72-hour reports share a deadline
   and the NIS2 notification goes first. With only GDPR running it starts at awareness.
8. **Result.** In time when filed ≤ deadline. **Tie-break:** filed exactly at the deadline is in time (late 0, spare 0).
   late = filed − deadline, spare = deadline − filed. *met* and *missed* count the hour clocks only. The misconception's
   deadline is attack + 24 h; `beforeDetect` = detection − (attack + 24 h).
   Consequences checked by a test over every attack hour of the week and triage 1, 6, 24 h: on call meets every
   deadline (at most 7 hours of work, all inside 24 h); in office hours the two 72-hour reports are always in time (any
   72 hours hold at least 8 office hours) and only the early warning can be missed. So with the page's hours of work
   no report is filed after the 72-hour mark: a late 72-hour report and a final report moved by a late notification
   exist in the model and the strings (for other hours of work, `prep`) but are reached only by tests.

### The sim (`sim.js`)

9. **Params (normalise).** Numbers: non-numbers (`null`, `''`, `true`, `NaN`, `Infinity`) take the default, numbers
   are rounded and clamped to their range (every range starts at 0 or above). Toggles accept booleans, `'true'`/`'false'`,
   `'1'`/`'0'`, 1/0; anything else takes the default. `reporting` not one of the two takes the default.
10. **Steps (7).** Stages: 0 start (no now), 1 attack, 2 detection, 3 awareness, 4 awareness + 24 h, 5 awareness +
    72 h, 6 the final report (now = its deadline; without one, the later of awareness + 72 h and the last filing), 7 the
    summary (same now). A step outside 0…7 is clamped, a fractional one rounded. A clock shows: `off` (not running), `hidden` (before awareness), `set` (the
    final report, once running), `ok` / `late` once filed, `overdue` when now ≥ deadline and not filed (**tie-break:**
    at the deadline hour itself), else `running`. Filings and work appear when now reaches them.
11. **Axis.** From the attack's day to the day holding (max(awareness + 72 h, last filing) + 3 h). When detection's day
    *D* is more than two days after the attack's day *A*, days *A* and *A* + 1 are kept, the days between are one gap
    column (half a day wide) and the axis goes on from *D*. Positions are linear inside each column.
12. **Caption.** Sentences by stage: start; attack; detection + the misconception's clock (`cGhostGone` when
    `beforeDetect` > 0, **tie-break:** exactly 0 is `cGhostJust`, "it would end right now", else `cGhostLeft` with its
    end time; detection in the attack's own hour is `cDetectAtOnce` alone); awareness + which clocks start (both,
    NIS2, GDPR, none); +24 h (early warning in time or missed; not significant: GDPR's due date, or no clock); +72 h (a
    lead with the time, then a late early warning's filing, then the notification and GDPR results, or no clock);
    final report (its date, and that a late notification moves it; none when not significant); summary (all met, or
    met of total and which were missed, why office hours fail, and how long the attack ran unseen when that is ≥ 24 h,
    **tie-break:** exactly 24 h included).

## Presets and expected outcomes

| # | id | attack | detect / triage | sig / pers / filer | awareness | early warning (due → filed) | notification | GDPR | final report due | met / missed |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `tuesday` (= defaults) | Mon 22:00 | 9 / 3 | ✓ ✓ office | Tue 2 Mar 10:00 | Wed 10:00 → Tue 11:00 ✓ 23 h | Fri 10:00 → Tue 14:00 ✓ | Fri 10:00 → Wed 09:00 ✓ | Fri 2 Apr 14:00 | 3 / 0 |
| 2 | `found-late` | Wed 03:00 | 126 / 3 | ✓ ✓ office | Mon 8 Mar 12:00 | Tue 12:00 → Mon 13:00 ✓ | Thu 12:00 → Mon 16:00 ✓ | Thu 12:00 → Tue 11:00 ✓ | Thu 8 Apr 16:00 | 3 / 0; from the attack the 24 h ended Thu 4 Mar 03:00, 102 h before detection |
| 3 | `friday` (entry) | Fri 17:00 | 1 / 2 | ✓ ✓ office | Fri 5 Mar 20:00 | Sat 20:00 → Mon 09:00 ✗ 37 h | Mon 20:00 → Mon 12:00 ✓ 8 h | Mon 20:00 → Mon 15:00 ✓ 5 h | Thu 8 Apr 12:00 | 2 / 1 |
| 4 | `on-call` | Fri 17:00 | 1 / 2 | ✓ ✓ on call | Fri 5 Mar 20:00 | Sat 20:00 → Fri 21:00 ✓ | Mon 20:00 → Sat 00:00 ✓ | Mon 20:00 → Sat 03:00 ✓ | Tue 6 Apr 00:00 | 3 / 0 |
| 5 | `slow-triage` | Fri 09:00 | 2 / 8 | ✓ ✓ office | Fri 5 Mar 19:00 | Sat 19:00 → Mon 09:00 ✗ 38 h | Mon 19:00 → Mon 12:00 ✓ | Mon 19:00 → Mon 15:00 ✓ | Thu 8 Apr 12:00 | 2 / 1; with triage 2 h: aware Fri 13:00, all in time, GDPR 1 h to spare |
| 6 | `data-only` | Thu 14:00 | 2 / 4 | – ✓ office | Thu 4 Mar 20:00 | not running | not running | Sun 20:00 → Fri 11:00 ✓ 57 h | none | 1 / 0 |

Contrasts the presets carry: 2 the clock from awareness vs from the attack; 3 vs 4 the weekend with and without an
on-call filer; 5 the triage pushing awareness out of office hours (2 h vs 8 h); 6 one set of clocks, not both; 1 and 3
both sets from one incident.

Independent check (run 2026-11-07; a separate re-implementation with Python's `datetime` and `calendar`):

```python
import datetime as dt, calendar
W0 = dt.datetime(2027, 3, 1)            # Monday
def working(h, mode):
    t = W0 + dt.timedelta(hours=h)
    return mode == 'oncall' or (t.weekday() < 5 and 8 <= t.hour < 16)
def finish(t, need, mode):
    while need:
        if working(t, mode): need -= 1
        t += 1
    return t
def month_later(h):
    t = W0 + dt.timedelta(hours=h)
    y, m = (t.year, t.month + 1) if t.month < 12 else (t.year + 1, 1)
    return t.replace(year=y, month=m, day=min(t.day, calendar.monthrange(y, m)[1]))
fmt = lambda h: (W0 + dt.timedelta(hours=h)).strftime('%a %d.%m %H:%M')
for name, day, hour, det, tri, sig, pers, mode in [('tuesday',0,22,9,3,1,1,'office'), ('found-late',2,3,126,3,1,1,'office'),
        ('friday',4,17,1,2,1,1,'office'), ('on-call',4,17,1,2,1,1,'oncall'), ('slow-triage',4,9,2,8,1,1,'office'),
        ('data-only',3,14,2,4,0,1,'office'), ('slow-triage at 2 h',4,9,2,2,1,1,'office')]:
    a = day*24 + hour; d = a + det; aw = d + tri; t = aw; out = []; filed = {}
    for i, clock, prep in ([('ew',24,1),('notif',72,3)] if sig else []) + ([('gdpr',72,3)] if pers else []):
        t = finish(t, prep, mode); filed[i] = t
        out.append(f"{i} due {fmt(aw+clock)} filed {fmt(t)} {'ok' if t <= aw+clock else 'LATE %dh' % (t-aw-clock)}")
    if sig: out.append('final due ' + month_later(filed['notif']).strftime('%a %d.%m %H:%M'))
    print(name, '| aware', fmt(aw), '| ghost', d - (a+24), '|', '; '.join(out))
```

Output (matches the table):

```
tuesday | aware Tue 02.03 10:00 | ghost -15 | ew due Wed 03.03 10:00 filed Tue 02.03 11:00 ok; notif due Fri 05.03 10:00 filed Tue 02.03 14:00 ok; gdpr due Fri 05.03 10:00 filed Wed 03.03 09:00 ok; final due Fri 02.04 14:00
found-late | aware Mon 08.03 12:00 | ghost 102 | ew due Tue 09.03 12:00 filed Mon 08.03 13:00 ok; notif due Thu 11.03 12:00 filed Mon 08.03 16:00 ok; gdpr due Thu 11.03 12:00 filed Tue 09.03 11:00 ok; final due Thu 08.04 16:00
friday | aware Fri 05.03 20:00 | ghost -23 | ew due Sat 06.03 20:00 filed Mon 08.03 09:00 LATE 37h; notif due Mon 08.03 20:00 filed Mon 08.03 12:00 ok; gdpr due Mon 08.03 20:00 filed Mon 08.03 15:00 ok; final due Thu 08.04 12:00
on-call | aware Fri 05.03 20:00 | ghost -23 | ew due Sat 06.03 20:00 filed Fri 05.03 21:00 ok; notif due Mon 08.03 20:00 filed Sat 06.03 00:00 ok; gdpr due Mon 08.03 20:00 filed Sat 06.03 03:00 ok; final due Tue 06.04 00:00
slow-triage | aware Fri 05.03 19:00 | ghost -22 | ew due Sat 06.03 19:00 filed Mon 08.03 09:00 LATE 38h; notif due Mon 08.03 19:00 filed Mon 08.03 12:00 ok; gdpr due Mon 08.03 19:00 filed Mon 08.03 15:00 ok; final due Thu 08.04 12:00
data-only | aware Thu 04.03 20:00 | ghost -22 | gdpr due Sun 07.03 20:00 filed Fri 05.03 11:00 ok
slow-triage at 2 h | aware Fri 05.03 13:00 | ghost -22 | ew due Sat 06.03 13:00 filed Fri 05.03 14:00 ok; notif due Mon 08.03 13:00 filed Mon 08.03 09:00 ok; gdpr due Mon 08.03 13:00 filed Mon 08.03 12:00 ok; final due Thu 08.04 09:00
```

## Legend

NIS2 clock (series 1) · GDPR clock (series 3) · late (red hatched) · weekend (grey hatched) · work on a report (ink
block). Shapes carry the rest: ▲ attack, ● detection, ◆ awareness, ✓ / ✗ and words on every filing, a dashed
struck-through box for the misconception, the now line and its tag.

## Terms (hr / en)

saznanje / awareness · trijaža / triage · značajan incident / significant incident · rano upozorenje / early
warning · obavijest o incidentu / incident notification · završno izvješće / final report · povreda osobnih podataka /
personal-data breach · nadzorno tijelo / supervisory authority · nadležni CSIRT / competent CSIRT · bez nepotrebne
odgode / without undue delay · radno vrijeme / office hours · dežurstvo / on call.

## Misconceptions targeted

- "The 24 hours run from the attack" (or from when it was detected): the misconception lane and preset 2.
- "Deadlines pause at the weekend": preset 3, the early warning due on Saturday, filed on Monday.
- "We report when we know everything": the early warning is light (1 hour of work) and due first; the caption at +24 h.
- "A longer triage buys time": preset 5 shows it can push awareness out of office hours; the explanation adds that an
  authority can treat a drawn-out triage as undue delay.
- "One incident, one report": presets 1 and 3 start both sets, to two bodies; preset 6 only one.

## Out of scope

Whether the incident is significant or the breach notifiable (`cmp-breach-triage` adds that decision); the intermediate
report on request (art. 23(4)(c)) and the progress report for an incident still ongoing (art. 23(4)(e)); informing the
people affected (GDPR art. 34) and service recipients (NIS2 art. 23(1)–(2)); a processor's duty to tell the controller
(GDPR art. 33(2)); DORA's timings for financial entities; national variations, public holidays, daylight saving; the
content of each report; filing outside the work queue (two people in parallel).

## Sources

- NIS2: Directive (EU) 2022/2555, art. 23(1) and (4)(a), (b), (d) (EUR-Lex; Croatian terms from the official Croatian
  version: rano upozorenje, obavijest o incidentu, završno izvješće, značajan incident, "bez nepotrebne odgode, a u
  svakom slučaju u roku od 24 sata od saznanja"). *(check: the Croatian wording was confirmed through a secondary
  Croatian source quoting the directive, not read on EUR-Lex directly)*
- Croatian law: Zakon o kibernetičkoj sigurnosti (NN 14/2024) and a government regulation under it transpose art. 23;
  the competent authorities categorise entities and notify them; the GDPR supervisory authority is AZOP; financial
  entities follow DORA, supervised by the Hrvatska narodna banka and HANFA (owner confirmed 2026-11-08; named in the
  explanation only, no article cited). The article number and any national difference: open, not stated by the owner
  (NOTES.md "For the owner").
- GDPR: Regulation (EU) 2016/679, art. 33(1) (72 hours "after having become aware", "where feasible", reasons for the
  delay), art. 33(2) and art. 34 (out of scope) (EUR-Lex; Croatian: "bez nepotrebnog odgađanja i, ako je izvedivo,
  najkasnije 72 sata nakon saznanja").
- EDPB, Guidelines 9/2022 on personal data breach notification under GDPR (version 2.0, 28 March 2023), section on
  when the controller becomes "aware": a reasonable degree of certainty that a security incident has led to personal
  data being compromised, after a short initial investigation that should begin as soon as possible. *(check: section
  and paragraph numbers not checked against the PDF)*
- Months and hours: the model counts one calendar month to the same day number (last day of a shorter month), the
  usual reading in EU law (Regulation (EEC, Euratom) No 1182/71, art. 3). Whether 1182/71's extension of a period
  ending on a Saturday, Sunday or holiday applies to the final report under the Croatian law: open, not stated by the
  owner; the page ignores it.
- Seed: `rpo-rto` preset "found on Monday" (an outage found late); no answer from the DR instructor material is used.
