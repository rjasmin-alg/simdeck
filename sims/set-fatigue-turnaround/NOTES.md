<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-fatigue-turnaround: notes

Task `docs/tasks/w3/set-fatigue-turnaround.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native
explorer.

## Decisions

- **The week is its own module, `week.js`** (catalogue §5.25: "set-fatigue-turnaround keeps its own week of calls and
  wraps in the same day format"). It registers `SimdeckModels['set-week']`, holds no strings and is ready to move to
  `models/` unchanged; its tests are the "week" block of `sim.test.js`. `set-call-sheet` (the shooting day's hub) is
  not built yet, so the "day format" is simply call and wrap in minutes from the first day's midnight; when the call
  sheet's model lands, the coordinator can align the two (a day there is `{ call, wrap }` at least).
- **Three crew members, not one**, so "set each crew member's travel time" has something to compare: a grip (near,
  60 min of de-rig after wrap), a make-up artist (an hour's pre-call before the crew, 30 min after wrap) and a camera
  assistant (far, 90 min, 45 min of packing and card handover). The pre-call and the packing make each person's own
  rest shorter than the call sheet's turnaround, which is one of the misconceptions the page targets.
- **The x axis is hours awake counting the sleep owed.** Each row is drawn from the person's waking, shifted right by
  the sleep they owe (a hatched block), so the 16 h and 17 h lines are straight verticals through all five rows and
  the rows creep right through the week. Rows end at the next own call (the next morning faded), so a night's sleep and
  the turnaround bracket sit in the row of the day before.
- **Risk = hours awake at the end of the drive home + sleep owed** (each hour owed counts as an hour longer awake).
  This is an illustrative rule, said so on the page; only the 17 h reference (research's 17–19 h ≈ 0.05 %) comes from
  a source. The 16 h "raised" line is illustrative.
- **Sleep is capped at the need (8 h) and never paid back within the week.** Recovery sleep, naps, the body clock and
  the weekend are out of scope (the explanation says so).
- **Remedies as separate switches**, so they can be applied one at a time or combined:
  - *Fixed minimum rest*: 11 h counted from each person's release to their own next call (the EU minimum, Directive
    2003/88/EC art. 3). The unit's call moves to wrap + 11 h + 90 min (the make-up artist's pre-call and packing, the
    largest), and the day keeps its length, so the week slides (Friday wraps at 02:00 on Saturday in the preset). The
    point: rest protects sleep but not the drive after a long day.
  - *Wrap on time*: every overrun cut; the 1st AD calls wrap at the planned time (the task's "an earlier wrap"). With
    the overruns, it equals the planned week; the planned day itself is the `length` slider.
  - *Shorter next day*: the day after an overrun starts later by it and keeps its planned wrap.
  - *A room near the location / a driver* for those 60 min or more away (one choice): the room cuts travel to 15 min
    and gives the sleep back; the driver keeps the travel and the debt but takes them off the wheel (badge "passenger",
    ▭). Riding as a passenger is not modelled as sleep.
- **Overruns and travel are set on the stage** (− / + per day and per crew member), as hidden params so a link, a
  reload and the L language switch keep them; the panel holds the planned day and the remedies. Bounds: the button is
  `aria-disabled` and its label says why.
- **Whose week** is chosen by clicking a crew member's name in the table (a hidden `who` param). Default: the camera
  assistant, the far one, where the contrast is.
- **Changed mark**: badges whose risk level (or passenger state) changed with the last input; nothing on a preset load.
- **No glossary terms** (`[[…]]`): the page uses plain words and loanwords; `glossary.js` is not loaded.
- **No real case.** The catalogue's candidate, the 1997 death of a camera assistant driving home after a very long day
  on *Pleasantville*, needs a public court record; a web search (2026-11-13) found none (only unrelated cases), so
  there is no "Na temelju / Based on" line. If the owner finds the record, the `planned`/`overrun` presets already
  model the scenario (a camera assistant, a long drive home after long days).

## For the owner (terms as used; catalogue §4.14 marks them *(check)*)

Loanwords from the owner's list, used as written: *turnaround* (in the title), *wrap* (wrapa, wrapova), *grip*,
*1st AD*. Not on the list, so *(check)* with the colleague who trains crews:

- *poziv* for the call (call time); the explanation glosses it once as *call* *(check: or crews say "call")*
- *maskerka* for the make-up artist *(check: maskerka / masker / vizažistica)*
- *asistent kamere* for the camera assistant *(check: or "focus puller", "drugi asistent")*
- *prekovremeno* for an overrun; *pakiranje* for wrap-out *(check)*
- *dug sna* for sleep debt; *budnost* for time awake *(check)*
- *brifing* in the foot line, as on `set-chain-of-command` and `set-circuit-load` *(check)*
- *Svojim autom / Soba blizu / Vozač* for the three choices for those who live far *(check)*
- No calls (Tišina!, Akcija! …) appear on this page.

## Unchecked (*(check)*)

- **Zakon o radu, daily rest:** the Croatian figure (from memory 12 consecutive hours for adult workers) and its
  article; not on the page, which names only the EU's 11 h with its directive. Source to check: Zakon o radu, NN 93/14
  and amendments (127/17, 98/19, 151/22, 64/23).
- **"The rest rules and the Zakon o zaštiti na radu apply to everyone on set, whatever their contract"**: on the page
  because the owner decided it (2026-11-08). The page does not tie the rest rules to the Zakon o radu, whose rest
  rules bind employers of workers in employment; crew on service or author contracts may fall outside them. Worth the
  owner's second look.
- **Croatian blood-alcohol limit** 0.5 g/kg for most drivers (Zakon o sigurnosti prometa na cestama); the page says
  only "many countries" and 0.5 ‰.
- **Film and TV guidance on hours and the drive home** (industry safety committees, broadcasters' pages): not read;
  nothing from it is on the page. Counting the rest from each person's release (not from the unit's wrap) follows
  what such guidance commonly asks, from memory.
- Every duration is illustrative (the page says so): the 07:00 call, 11 h planned day, 45 min mornings and evenings,
  8 h of sleep, the packing times, the pre-call, the travel times, the 15 min room, the 16 h line, adding debt to time
  awake.

## Numbers check

An independent Python script (written apart from `week.js`/`sim.js`, the rules typed again from SPEC.md) gave every
number in SPEC.md's presets table: planned (turnaround 13 h; camera assistant 15.5 → 16.5 h, 1 h owed), overrun
(turnaround 11 h; sleep 7.5 / 6.5 / 5.75 h; owed 2 / 6 / 9 h; camera assistant 17.5 → 26.5 h), min-rest (calls 07:00,
08:30, 10:00, 11:30, 13:00, Friday's wrap 02:00 Saturday; camera assistant 7.25 h sleep, 3 h owed, 17.5 → 20.5 h),
shorter (Tue–Fri 09:00–20:00; camera assistant 17.5, then 15.75 → 16.5 h, 1 h owed), room (camera assistant 15 h, no
debt), driver (as overrun, not at the wheel). Wrap on time with the overruns equals planned.

Research numbers: Dawson & Reid, Nature 388:235 (1997): 17 h awake ≈ 0.05 %; Williamson & Feyer, Occup Environ Med
57:649–655 (2000): 17–19 h ≈ 0.05 % or worse. EU daily rest: Directive 2003/88/EC art. 3, 11 consecutive hours per
24-hour period.

## Term pairs (glossary)

None needed: the page uses no `[[terms]]`. Candidates once the owner confirms the forms: turnaround / turnaround
(odmor između wrapa i poziva); sleep debt / dug sna.

## Shared requests

- **Promote `week.js` to `models/set-week.js`** if another page needs a week of calls and wraps; or merge it with
  `set-call-sheet`'s day model when that is built (catalogue §5.25), keeping `schedule()` and `turnarounds()`.

## Learn tree

Suggested leaf (catalogue §4.14): `film-set` → `health` "Zdravlje kroz dugi dan / Health over a long day" → `fatigue`.

## Review

A fresh reviewer (a separate agent, given the code and SPEC.md, not this file) recomputed every preset and ran 89
deliberate breaks of `week.js` and `sim.js`: 79 failed a test, 10 survived. Fixed since: the caption's minimum-rest
note now fires when the rule moved any call (it compared Friday's call with its planned time, which the shorter next
day also changes; `week.js` days now carry `base`, the call before the rule); the timeline's label for a driven crew
member; the legend lists ▭ passenger; unused strings dropped; SPEC.md's model-file rule ranges and caption text;
wording (17 h *or more*, under 16 h "not a safe line", the Croatian "Odmor od najmanje 11 h", "Svojim autom" / "Own car"
instead of a masculine "Vozi sam", the first-night sentence, the law line now names the Zakon o zaštiti na radu, not
the Zakon o radu). New tests for the 10 survivors (Infinity and rounding in both clamps, shorter after a 4 h overrun,
`planned` and `base` under shorter, shorter with the minimum rest, the member's default travel in `bump`, the driver
with other remedies, the longest planned day); the reviewer's 88 valid breaks were rerun and all now fail.

## Time

Started 2026-11-13 04:13, done 2026-11-13 04:37, including a fresh review (89 deliberate breaks; the 10 that survived now have tests).
