<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-stop-for-safety: spec

Task `docs/tasks/w3/set-stop-for-safety.md` (catalogue §4.14). One concept: **the 1st AD runs the floor and calls the
halt, each head of department answers for their department's work, and the safety briefing makes one rule explicit:
whoever sees danger says so at once and work stops until it is fixed.** A hazard passed along the chain ("I'll tell my
boss at the break", "not my department") loses minutes at every hop and sometimes the message itself, while the hazard
does not wait; nobody is blamed for a stop that turns out unnecessary; after the stop the department that owns the
hazard fixes it and the 1st AD restarts.

The student places a hazard, picks who notices it and what they do, and switches the briefing's "anyone may stop" rule
on and off; the message travels hop by hop across the crew chart and along a minute line that ends, for a real hazard,
in the minute it becomes an accident.

## Scene

One fictional production, no names: the fifteen people of the shared crew (crew.js) drawn left to right as in
`set-chain-of-command`, the hazard tagged beside the owning department's crew member. Under the chart, a minute line
(0 to 16) with the hops, the break, the 1st AD's check, the halt, the fix, the restart and the hazard's accident minute;
beside it a scoreboard of all four actions with the rule on and off, at the current minute. One step = one minute
(illustrative).

## State

```
{ minute,
  runs: { "<action>-<on|off>": Run } }      // all eight run from the same start; the params pick the one drawn
Run = { log: { halt, fixed, clear, restart, accident, lost, blame, check },   // first minute of each, or null
        hops: [Hop], now: [Event], lostAt, blamed, checkUntil }
Event = { t, kind: hop | halt | fixed | clear | restart | accident | lost | check | blame, from?, to?, how?, at?, ... }
Hop.how = call (out loud or on the radio, heard at once) | say (to the person beside you) | break (at the break)
        | send (a head sends their own crew)
```

`plan(params, action, rule)` lists a run's events in time order (pure); a step adds the events of minute n to each run.
The model holds no words.

## The crew (crew.js, copied from `set-chain-of-command`, catalogue §5.25)

| # | Rule | Source |
|---|---|---|
| 1 | **Fifteen people, one line up each** (rule 1 of `set-chain-of-command`'s SPEC): departments and their heads; grip's head is the key grip (crew: the grip), electric's the gaffer (crew: the electrician); the trainee (AD department) and the actor go through the 1st AD; the gaffer and the key grip through the DoP. | `sims/set-chain-of-command/SPEC.md` |
| 2 | **The path** along the lines (unique: a tree). Used only for the drawing here. | definition |
| 3 | **Lines:** n(n−1)/2 against n − 1. Not used on this page. | standard |

## The hazard and the message (sim.js)

| # | Rule | Source |
|---|---|---|
| 4 | **Four hazards** (illustrative minutes): *stand* — a stand without its sandbag over a walkway; owned by grip; accident at minute 7; fix 2 min (bag it, or move it). *exit* — a cable across the fire exit; electric; accident at 12 (someone trips on the way out); fix 3 min (re-route it). *smoke* — smoke from a lamp near a curtain; electric; accident at 4 (the curtain catches); fix 2 min (lamp off, moved). *smell* — a burning smell at a new lamp, a **false alarm** (a new lamp burning off its coating); electric; never an accident; checking it takes 1 min. | the task's three hazards; the false alarm for "a stop that turns out unnecessary"; minutes made up *(illustrative)* |
| 5 | **Who notices:** *trainee* — the AD trainee, from another department than the owner; *dayplayer* — the actor of the crew model, playing a day player; *own* — the owning department's crew member (the grip for the stand, the electrician for the rest). | the task's three noticers |
| 6 | **What they do, from minute 0:** *silent* — nothing. *colleague* — tell the person working beside them (trainee → electrician, day player → boom operator, grip ↔ electrician), heard at minute 1. *break* — tell their line up (crew.js `via`) at the break, minute B (param, default 10): the trainee and the day player tell the 1st AD, the grip the key grip, the electrician the gaffer. *stop* — call "stop" on the spot: heard by the 1st AD at minute 1. | the task's four actions |
| 7 | **Minutes:** a call or a word to the person beside you is heard the next minute (CALL = 1); the 1st AD's check (rule 9a) takes CHECK = 4 minutes (radio the owning head, who goes to look and answers); after the halt see rule 10. | illustrative |
| 8 | **Rule on** ("anyone may stop", the briefing's rule): the 1st AD halts the work the minute they hear of the hazard, whoever reports it; anyone else who hears of it calls stop to the 1st AD at once (+1). | catalogue concept: "whoever sees danger says so at once … and work stops until it is fixed"; the worker's right to stop in serious and imminent danger (Directive 89/391/EEC art. 8; Zakon o zaštiti na radu) *(check)* |
| 9 | **Rule off** (only the owning department may stop it), in this order for whoever hears it: **9a** the 1st AD, hearing it from outside the owning department, checks it with the owning head first: a real hazard is halted CHECK minutes later; a false alarm is not halted, and the one who reported it is **told off** at the end of the check (*blame*). From the owning department: halted at once. **9b** the owning head sends their crew to fix it (+1, then the fix), without a halt. **9c** someone of the owning department who is not its head tells their head at the break (minute max(B, t + 1)). **9d** anyone else drops it: *"not my department"*, the message is **lost** there. | catalogue concept: "a hazard passed along the chain … loses minutes at every hop and sometimes the message itself"; "nobody is blamed for a stop that turns out unnecessary" (so, without the rule, someone is) |
| 10 | **After the halt** (minute H): the owning head sends their crew (hop at H + 1; they heard the halt and what it is for), the crew fixes it (*fixed*) or, for the false alarm, checks it (*clear*) at H + 1 + fix, and the 1st AD restarts the work at H + 2 + fix. | catalogue concept: "after the stop the department that owns the hazard fixes it and the 1st AD restarts" |
| 11 | **Accident:** the hazard is safe from the first halt or fix. If it is not safe **before** its fuse minute, the accident happens at the fuse. **Tie-break: a halt or fix in the fuse minute itself is too late** (the hazard does not wait). Events after the fuse are dropped; a hop or a lost message in the fuse minute is kept (the 1st AD hears it as the curtain catches). | catalogue concept: "the hazard does not wait" |
| 12 | **Outcome at minute n**, the first that holds: accident; restarted (with the minutes stopped = restart − halt); halted; fixed without a halt; told off; checked, nothing wrong; lost; being checked; a message on its way or waiting for the break; quiet. | definition |

Out of scope: what happens after an accident (`set-emergency-response`); the order of controls that removes a hazard
(`set-risk-controls`); radio channels and their queue (`set-radio-discipline`); who decides requests that are not safety
(`set-chain-of-command`); refusals (a head always acts on what reaches them); the specialists' own work (no fixing
method appears, only who fixes it).

## Params

- `hazard` (choice: stand, exit, smoke, smell; default stand).
- `noticer` (choice: trainee, dayplayer, own; default trainee).
- `action` (choice: silent, colleague, break, stop; default stop).
- `anyone` (toggle, default on; key A): the briefing's "anyone may stop" rule.
- `breakAt` (range 5–12, default 10): the minute of the next break.

## Steps

16 (one per minute). The latest event of any case is a restart at minute 16: the false alarm told by the electrician to
the gaffer at a break in minute 12 with the rule on (gaffer 12, halt 13, crew 14, checked 15, restart 16), or the cable
told by the trainee to the 1st AD at a break in minute 11 with the rule on (halt 11, crew 12, fixed 15, restart 16).
Every case over every hazard, noticer, action, rule and break minute (5–12) ends by minute 16 (tested).

## Expected numbers (checked by an independent replay script, NOTES.md)

Break at minute 10. "own" is the owning department's crew member. The trainee and the day player differ only in "colleague,
rule off": the trainee's colleague is the electrician (rule 9c for the electric hazards), the day player's the boom operator
(always lost); the day player's row is the trainee's with "lost 1" there.

| Hazard, who | silent | colleague on / off | break on / off | stop on / off |
|---|---|---|---|---|
| stand (7), trainee | accident 7 | halt 2, restart 6 / lost 1, accident 7 | accident 7 / accident 7 | halt 1, restart 5 / halt 5 (checked), restart 9 |
| stand (7), own | accident 7 | halt 2, restart 6 / lost 1, accident 7 | accident 7 / accident 7 | halt 1, restart 5 / halt 1, restart 5 |
| exit (12), trainee | accident 12 | halt 2, restart 7 / gaffer 10, accident 12 | halt 10, restart 15 / check 10–14, accident 12 | halt 1, restart 6 / halt 5, restart 10 |
| exit (12), own | accident 12 | halt 2, restart 7 / lost 1, accident 12 | halt 11, restart 16 / gaffer 10, accident 12 (fix due 14) | halt 1, restart 6 / halt 1, restart 6 |
| smoke (4), trainee | accident 4 | halt 2, restart 6 / accident 4 (gaffer not yet told) | accident 4 / accident 4 | halt 1, restart 5 / check 1–5, accident 4 |
| smoke (4), own | accident 4 | halt 2, restart 6 / lost 1, accident 4 | accident 4 / accident 4 | halt 1, restart 5 / halt 1, restart 5 |
| smell (false), trainee | quiet | halt 2, restart 5 / gaffer 10, checked 12 | halt 10, restart 13 / told off 14 | halt 1, restart 4 (3 min stopped, nobody blamed) / told off 5 |
| smell (false), own | quiet | halt 2, restart 5 / lost 1 | halt 11, restart 14 / checked 12 (no halt) | halt 1, restart 4 / halt 1, restart 4 |

## Presets

A sixth, `own` (cable, own crew, break, rule off: the gaffer hears at 10, accident at 12, the fix would be done at 14),
was dropped so the panel fits 1920×1080 in English; it stays reachable from the controls and in the tests.

| # | id | Params | Outcome |
|---|---|---|---|
| 1 | `stop` | stand, trainee, stop, on | halt 1, fixed 4, restart 5 |
| 2 | `break` | stand, trainee, break, on | still waiting for the break at 7: accident 7 |
| 3 | `colleague` | exit, day player, colleague, off | lost with the boom operator at 1; accident 12 (A: halt 2, restart 7) |
| 4 | `smoke` | smoke, trainee, stop, off | the 1st AD checks 1–5; accident 4 (A: halt 1, restart 5) |
| 5 | `false` | smell, day player, stop, on | halt 1, nothing wrong 3, restart 4, nobody blamed (A: told off at 5) |

## Legend and captions

Legend: a line of the chain; a stop call (dashed); at the break (dotted); lost (dotted red ring with ✕); the accident
(⚠). On the chart: arrows for the hops so far with their minute (a word to a colleague solid, a head sending their crew
solid green), the noticer's box dashed ("saw it"), the 1st AD's box double red with "■ STOP" while the work stands, a
lost message's box dotted red, the hazard tag beside the owning crew member (red when the accident happens, ✓ when
fixed). On the minute line: a column per minute with symbol chips (→ hop, ■ halt, ✓ fixed or checked, ▶ restart, ✕ lost,
? check, ! told off, ⚠ accident), the fuse minute as a red dashed line labelled "⚠ min n", the break minute labelled
under its number, the check as a bar under its minutes, the current minute as a band. The caption gives the minute and
what happened in it, in time order (at most two events happen in any minute), or the run's state in a quiet minute; the
last step adds the outcome.

## Terms (owner's list, catalogue §4.14; everything else *(check)*, NOTES.md)

1st AD, gaffer, key grip, grip, boom operator, day player as loanwords; *Pripravnik*, *Električar*, *Pomoćni
rekviziter*; the call "Stop!" (as in `set-radio-discipline`) *(check)*; glossed once in the explanation: *prvi asistent
režije* (1st AD).

## Misconceptions targeted

"It's not my department" (the owner may not have seen it, and the message is lost); "I'll tell my boss at the break" (the
break comes after the accident); "telling someone is enough" (a colleague who thinks it is not theirs drops it); "a stop
that turns out unnecessary is a mistake" (three minutes lost, nobody blamed; without the rule the next trainee stays
silent); "the 1st AD has to check first" (the check costs the minutes the smoke does not have).

## Real case (visible reference)

Catalogue §4.14 names the 2014 train strike on a railway bridge during the shooting of *Midnight Rider* (Georgia, USA):
crew placed on a live railway line without the railway's permission and without a safety briefing; the US federal safety
agency (OSHA) cited the production company, and the Georgia criminal case ended in guilty pleas (2015). **The official
records could not be opened** (NOTES.md: the DOL news release returned 403, the OSHA inspection search and the OSHRC
decision search need queries the fetch tool cannot run, no official Georgia court page was found), so their titles,
numbers and dates are unchecked and the page has **no "Based on" line**, as the task requires. The page's scenario stays
plainly fictional and is not modelled on the case. The wording for the line, once the records are in hand, is in
NOTES.md.

## Sources

- Council Directive 89/391/EEC of 12 June 1989 (the framework directive), EUR-Lex: art. 8(4) and (5), workers who leave
  their workstation or take steps in serious and imminent danger must not be placed at a disadvantage; art. 13, workers
  report danger *(check the article numbers and wording against the text; not cited on the page)*.
- Zakon o zaštiti na radu, Narodne novine: applies to everyone at work on the set whatever the contract; the employer's
  risk assessment (procjena rizika), training for safe work (osposobljavanje za rad na siguran način), the worker's right
  to stop or leave work in serious and imminent danger without consequence *(check the current consolidated text, the
  articles and the amendments; named on the page without article numbers)*.
- Film and TV safety guidance on the 1st AD and heads of department, as listed in `set-chain-of-command`'s SPEC (HSE
  "Film, TV and broadcasting"; Ontario "Safety guidelines for the film and television industry"; ScreenSkills PSA3)
  *(check: found by search, not read in full)*.
