<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-fatigue-turnaround: spec

Task `docs/tasks/w3/set-fatigue-turnaround.md` (catalogue §4.14). One concept: **turnaround is the rest between one
day's wrap and the next day's call; every hour the day runs over comes out of it, and travel, packing up and getting
home shorten the sleep left inside it; lost sleep accumulates through the week as a sleep debt; reaction time worsens
with hours awake (research puts 17 to 19 hours awake on a par with a blood alcohol level many countries set as the
driving limit), so the most dangerous part of a long day is often the drive home; a fixed minimum rest, an earlier
wrap, a room near the location or a driver for those who live far, and a shorter next day each break the chain.**

Class: explorer (no steps). The state follows from the params at once.

## The week (one fictional production)

A five-day shooting week, Monday to Friday, one unit. Every day is planned with the same call, 07:00, and the same
planned length from call to wrap (param `length`). Each day may run over (params `o1` … `o5`). All times are whole
minutes from Monday 00:00; every number is illustrative except the research reference (17 h) and the EU minimum
daily rest (11 h).

Three crew members, in this fixed order (tie-break for every list of them):

| id | Role | Own call | After wrap | Travel (default) |
|---|---|---|---|---|
| `grip` | a grip | the crew call | 60 min (de-rig, load the truck) | 30 min |
| `makeup` | a make-up artist | 60 min before the crew call (pre-call: actors are made up before the crew starts) | 30 min (clean up, put away) | 45 min |
| `ac` | a camera assistant | the crew call | 45 min (pack the camera, hand over the cards) | 90 min |

Every crew member: 45 min from waking to leaving home (`MORNING`), 45 min from getting home to falling asleep
(`EVENING`), sleep need 8 h (`NEED`). Each day's travel is the same each way.

## Model files

- `week.js`: the week of calls and wraps (catalogue §5.25: "set-fatigue-turnaround keeps its own week of calls and wraps
  in the same day format"): pure, no strings, registers `SimdeckModels['set-week']`. Rules 1–5.
- `sim.js`: the crew, their travel, sleep, debt and risk on top of the week (rules 6–12), presets, page helpers.

## State (from `derive(params)`)

```
{ days: [{ d, call, wrap, len, overrun, planned, base }],           // the unit's week (week.js); base: the call before rule 4
  turnaround: [min × 4],                                            // wrap of day d → call of day d+1
  crew: [{ id, travel, travelSet, far, roomed, atWheel,
           days: [{ d, ownCall, release, wake, home, awake, debtBefore, effective, risk,
                    rest|null, avail|null, sleep|null, asleep|null }],
           debtEnd, worst }],                                       // worst: index of the riskiest drive at the wheel, or -1
  who, extraRest }                                                  // extraRest = M (rule 4)
```

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | **Overrun:** `o_d` is the day's overrun in minutes, clamped to 0 … 240 (not a number → 0). With **wrap on time** (`onTime`) every overrun is 0: the 1st AD calls wrap at the planned time and what is left moves to another day. | the task's "an earlier wrap"; illustrative |
| 2 | **A day:** planned start `base_d = d·1440 + 420 (+ o_{d−1} with shorter)`; length `len_d = length + o_d (− o_{d−1} with shorter)`; `call_d = base_d` (or later, rule 4); `wrap_d = call_d + len_d`. Monday has no day before it (`o_{−1} = 0`). | definition |
| 3 | **Shorter next day** (`shorter`): the day after an overrun starts later by that overrun and keeps its planned wrap, so it is shorter by it (its own overrun, if any, still comes on top). | the task's "a shorter next day" |
| 4 | **Fixed minimum rest** (`minRest`): every crew member's own rest (own release → own next call) is at least 11 h. The unit's call moves to `max(base_d, wrap_{d−1} + 660 + M)`, `M = max over crew (pre-call + after wrap)` = 90 min (the make-up artist); the day keeps its length, so the week slides later. **Tie-break:** when the two are equal the call is the planned one (nothing moves). | Directive 2003/88/EC art. 3 (11 consecutive hours of daily rest per 24 h); counted from each person's release, as film guidance asks *(check)* |
| 5 | **Turnaround** of night d (d = 0…3) = `call_{d+1} − wrap_d`, the unit's (as a call sheet gives it). | definition |
| 6 | **A crew member's day:** `ownCall = call − precall`, `release = wrap + afterWrap`, `wake = ownCall − travel − 45`, `home = release + travel`; **awake at the end of the drive home** `awake = home − wake = precall + len + afterWrap + 2·travel + 45`. | definition |
| 7 | **Travel and the far:** travel is clamped to 15 … 150 min. A crew member is **far** when their travel is 60 min or more (**tie-break:** exactly 60 is far). `far = room`: every far crew member sleeps in a room near the location, 15 min away. `far = driver`: every far crew member is driven; their travel stays, but they are not at the wheel (`atWheel` false). | the task's remedies; illustrative |
| 8 | **Sleep:** own rest `rest = ownCall_{d+1} − release_d`; time left to sleep `avail = rest − 2·travel − 45 − 45`; `sleep = min(max(avail, 0), 480)` (**tie-break:** exactly 8 h left gives 8 h and no debt; more than 8 h is not slept ahead or paid back within the week). Friday has no next call: no rest, no sleep. Asleep from `home + 45`. | sleep need 8 h illustrative; recovery out of scope |
| 9 | **Sleep debt:** `debtBefore_0 = 0`; `debtBefore_{d+1} = debtBefore_d + 480 − sleep_d`. `debtEnd` = the debt before Friday (after four nights). | definition (the concept's "accumulates through the week") |
| 10 | **Risk at the drive home:** `effective = awake + debtBefore` (every hour of sleep owed counts as an hour longer awake, illustrative). `low` under 16 h; `raised` from 16 h; `high` from 17 h (**tie-break:** exactly 16 h is raised, exactly 17 h is high). The 17 h line is where research begins to compare time awake with a blood alcohol of 0.05 % (0.5 ‰). A driven crew member keeps the level (they are as tired) but is not at the wheel. | Dawson & Reid 1997; Williamson & Feyer 2000 (17–19 h ≈ 0.05 %); the 16 h line and adding debt illustrative |
| 11 | **Worst drive** (`worst`, the caption): the day with the highest `effective` among drives at the wheel; **tie-break:** the earliest day; −1 when not at the wheel. | caption |
| 12 | **Clicks on the stage** (page): a day's − / + changes its overrun by 30 min within 0 … 240; a crew member's − / + their travel by 15 min within 15 … 150; a crew member's name shows their week. A click at a bound changes nothing (the button is `aria-disabled` and says why). | interaction |

Out of scope: the body clock (time of day, night shoots), naps, caffeine, recovery sleep and the weekend, how long
a driver may drive, the morning drive in, overtime pay and contracts, the call sheet's scenes and setups
(`set-call-sheet`). Driving technique is never shown.

## Params

- `length` (range 480 … 840 min, step 30, default 660): the planned day, call to wrap, shown in hours.
- `minRest`, `onTime`, `shorter` (toggles, default off): the remedies of rules 4, 1 and 3.
- `far` (choice `none`, `room`, `driver`; default `none`): rule 7.
- `who` (hidden choice `grip`, `makeup`, `ac`; default `ac`): whose week the timeline shows. Set from the stage.
- `o1` … `o5` (hidden range 0 … 240, step 30, default 0) and `tGrip`, `tMakeup`, `tAc` (hidden range 15 … 150, step
  15; defaults 30, 45, 90): set from the stage, hidden params so a link, a reload and the language switch keep them.

## Presets and expected numbers (checked by the script in `NOTES.md` "Numbers check")

| # | Preset | Params | Expected |
|---|---|---|---|
| 1 | `planned` | defaults (11 h days, no overrun) | turnaround 13 h every night. Grip and make-up: 8 h sleep, no debt, low (13.75 h, 14.75 h). Camera assistant: rest 12.25 h, sleep 7.75 h, debt 0.25 h a night; 15.5, 15.75 (low), 16.0, 16.25, 16.5 (raised from Wednesday); 1 h owed by Friday |
| 2 | `overrun` | every day 2 h over | turnaround 11 h (the EU minimum) every night. Grip 7.5 h sleep, 15.75 low Monday, high from Thursday (17.25), 2 h owed. Make-up 6.5 h sleep, raised Monday (16.75), high from Tuesday, 6 h owed. Camera assistant 5.75 h sleep, high from Monday (17.5 → 26.5 on Friday), 9 h owed |
| 3 | `min-rest` | overrun + fixed minimum rest | calls 07:00, 08:30, 10:00, 11:30, 13:00, Friday's wrap 02:00 on Saturday; turnaround 12.5 h. Grip and make-up no debt; camera assistant 7.25 h sleep, 3 h owed, still high every day (17.5 → 20.5) |
| 4 | `shorter` | overrun + shorter next day | Tuesday to Friday start at 09:00 and, running 2 h over again, wrap at 20:00 (11 h days instead of 13). Turnaround 13 h; no debt for grip and make-up; camera assistant 1 h owed, high only on Monday (17.5), then 15.75, 16.0, 16.25, 16.5 |
| 5 | `room` | overrun + a room near the location | camera assistant (far) 15 min away: 8 h sleep, no debt, 15.0 h, low all week; grip and make-up as in `overrun` |
| 6 | `driver` | overrun + a driver for the far | camera assistant as in `overrun` (9 h owed, 17.5 → 26.5) but not at the wheel; grip and make-up as in `overrun` |

Wrap on time with the overrun is the same as `planned`. `who` is `ac` in every preset.

## Legend and captions

Timeline, one row per day for the crew member shown, drawn from their waking (plus the sleep they owe, a hatched
block before it) to their next own call: getting ready, the drive in, pre-call, the planned day (solid), the overrun
(hatched), packing up, the drive home (shape and colour by risk: ○ low, ◐ raised, ● high, ▭ driven), the evening,
sleep (dark, with its hours), and the next morning (faded). The x axis is hours awake counting the sleep owed, so the
16 h and 17 h lines are vertical lines through every row and a row creeps right as the debt grows. Each row: the day,
its call and wrap clock times, its overrun − / +; on the right the turnaround, the sleep and the risk badge.

Crew table: each crew member's travel (− / +), far mark, the five risk badges, the debt by Friday; the shown one is
outlined.

Caption: whose week; their worst drive at the wheel (day, hours awake plus owed, against 17 h; under 16 h it says the
scale is illustrative and not a safe line), or, when driven, that they are not at the wheel and just as tired; the debt
by Friday; then one more sentence: the room's travel when they have a room, else Friday's wrap when the minimum rest
moved any call, else the turnaround against the sleep inside it on Monday night. Foot line: the
page simplifies, its numbers are illustrative, and the production's safety briefing and the head of department have
the final word.

## Misconceptions targeted

- "Turnaround is sleep time": 11 h of turnaround, 5 h 45 of sleep for the camera assistant.
- "The rest rule makes the drive home safe": `min-rest`, debt down, the drive still high.
- "One long day is fine, it is the week that counts" and the opposite: `shorter`, Monday is still high.
- "Being tired is about the last night": the debt carried row creeps right.
- "Everyone on the crew has the same day": pre-call and packing up make the make-up artist's and the grip's rest shorter
  than the turnaround on the call sheet.

## Sources

- Directive 2003/88/EC (working time), art. 3, daily rest: "a minimum daily rest period of 11 consecutive hours per
  24-hour period" (EUR-Lex, OJ L 299, 18.11.2003, p. 9). Named on the page with its article.
- Zakon o radu (Narodne novine 93/14 and amendments): dnevni odmor; the Croatian figure (12 h?) and its article
  *(check)*, not on the page.
- D. Dawson, K. Reid, "Fatigue, alcohol and performance impairment", Nature 388, 235 (1997): 17 h awake ≈ 0.05 % blood
  alcohol, 24 h ≈ 0.10 %.
- A. M. Williamson, A.-M. Feyer, "Moderate sleep deprivation produces impairments in cognitive and motor performance
  equivalent to legally prescribed levels of alcohol intoxication", Occupational and Environmental Medicine 57,
  649–655 (2000): after 17–19 h without sleep, performance equal to or worse than 0.05 %.
- Croatian limit for most drivers 0.5 g/kg (Zakon o sigurnosti prometa na cestama) *(check)*: the page says "many
  countries".
- Film and TV safety guidance on working hours and the drive home (industry safety committees, broadcasters' safety
  pages) *(check: not read; nothing from it is on the page)*.

No real case: the catalogue's candidate (the 1997 drive home after a long day on *Pleasantville*) needs a court record;
a web search found none (`NOTES.md`), so there is no "Na temelju / Based on" line.
