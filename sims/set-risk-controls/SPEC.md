<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-risk-controls: specification

Task `docs/tasks/w3/set-risk-controls.md`, catalogue `set-risk-controls` (§4.14; link to `cmp-risk-register`, §5.25).
Class **explorer**: the state is a pure function of the params (`sim.js` `derive`); no steps.

**One concept:** a hazard's risk is likelihood × severity; controls work in an order of strength (remove, replace,
separate, organise, personal protection); the lower controls depend on someone remembering every time, so they fail
more often, and a scene protected only by them keeps most of its risk.

**The contrast on the stage:** the same scene with strong (built-in) controls and with weak (remembered) ones, read
three ways: the risk on paper (every control in place), the expected risk on the day (the remembered ones sometimes
forgotten), and 200 runs of the scene with the injuries they give.

## Stage

- **Scene tabs** (top): the four scenes, each with its inherent score → expected score on the day and its injuries in
  this series. The selected one is pressed (thicker border); a tab is a button that selects the scene.
- **Ladder** (left): the five levels, strongest first, each a toggle button (aria-pressed) naming the level, this
  scene's control at that level, its effect (likelihood −n, severity −n, "the hazard is gone", or "moves no level") and
  how reliably it is in place. The rows narrow downwards (an inverted triangle); a pressed row has a dark number box.
- **Risk** (right, top): three bars on a 0–25 scale with their values: without controls (dashed outline, L × I), on
  paper (hatched, L′ × I′ or "0: hazard removed"), on the day (solid, ≈ expected score). Under them the paper levels
  in words (likelihood n: an injury in p % of runs · severity n: its name) and "x % of the risk stays".
- **Runs** (right, under): 200 cells (25 × 8; 10 × 20 on a phone), one per run. An injury fills the cell with its
  severity digit (light fill for 1–3, dark fill and a thick border for serious, 4–5); a run where a chosen control was
  forgotten has a corner mark. Under the grid: injuries, serious ones, runs with something forgotten, and the expected
  injuries with and without controls. Expected values show one decimal, or none when whole ("≈ 16", "≈ 10.6").
- **Foot:** once, that the page simplifies, the numbers are illustrative, the production is made up, and the
  production's safety briefing and the head of department have the final word.

## Params

| key | control | values (default) | notes |
|---|---|---|---|
| `scene` | choice (also the stage tabs) | `stairs`, `lamp`, `car`, `door` (`stairs`) | an unknown value reads as the first |
| `seed` | hidden range 1–99, the "New series" button (key N) adds 1, 99 → 1 | (1) | anything else reads as 1; 2.4 rounds to 2 |
| `<scene>_<level>` | hidden toggle (the ladder buttons) | boolean (false) | 20 of them; only exactly `true` is on |

## Rules

1. **Scenes and score.** Score = L × I, both 1–5 (`score` copied from `sims/cmp-risk-register/scoring.js` @ 35666dc,
   its rule 1). Inherent levels (illustrative):

   | scene | L | I | score |
   |---|---|---|---|
   | stairs: an actor runs down wet stairs | 4 | 4 | 16 |
   | lamp: a heavy lamp on a high stand over the crew | 3 | 4 | 12 |
   | car: a car passes close to the camera | 3 | 5 | 15 |
   | door: a powered door on the set closes on a cue | 4 | 4 | 16 |

2. **Levels, strongest first, and how often each is not in place on a run** (illustrative): remove 0, replace 0,
   separate 1 in 50 (0.02: a barrier moved aside and not put back), organise 1 in 5 (0.2), protect 3 in 10 (0.3).
   Remove and replace are part of how the scene is made; separate is built in but can be moved; organise and protect
   need someone to remember every time.
3. **Effects.** Each control takes whole levels off: L′ = max(1, L − ΣdL), I′ = max(1, I − ΣdI) over the controls in
   place; effects add up. **Remove** takes the hazard away: no L′, I′, score 0, no injury; it wins over anything chosen
   with it. A control with dL = dI = 0 changes nothing. (dL, dI):

   | scene | remove | replace | separate | organise | protect |
   |---|---|---|---|---|---|
   | stairs | gone (shoot dry) | (2, 0) stunt performer | (1, 1) rail, mats | (1, 0) walking rehearsal, spotter | (0, 1) pads |
   | lamp | gone (no lamp over people) | (0, 2) lighter, cooler lamp | (2, 0) cordon under the stand | (1, 0) briefing, stand checks | (0, 1) hard hats |
   | car | gone (no close pass) | (0, 2) slower pass | (2, 0) barrier, remote head | (1, 0) walking rehearsal, fewer people | (0, 0) vests |
   | door | gone (door stays open) | (0, 2) light, slow door | (2, 0) sensor stops it | (1, 0) operator on a cue | (0, 0) boots |

4. **Per run.** The chance of an injury on one run at likelihood level 1–5 is 1, 2, 4, 8, 16 % (doubling); the injury
   has the run's severity I′. Severity names: 1 a bruise, 2 first aid, 3 days off work, 4 serious (hospital), 5
   life-changing or fatal. **Serious** = severity ≥ 4 (4 is serious, 3 is not).
5. **A series** is 200 runs from mulberry32 (`Simdeck.rng`'s generator) seeded with seed × 16 + scene index. Every run
   draws four numbers in this order, whatever is chosen: u_separate, u_organise, u_protect, u_injury. A chosen control
   is forgotten on that run when u < its fail chance (strict, so fail 0 never forgets); the run's L′, I′ follow from the
   controls held; an injury when u_injury < p(L′). Same draws for any choice of controls, so adding a control never
   adds an injury and never raises one's severity (the comparison replays the same runs).
6. **On the day** (expected, exact): the sum over every combination of the forgettable chosen controls (each forgotten
   independently with its chance) of P(combination) × the score with the held controls; likewise the expected injuries
   per series (200 × Σ P × p(L′)) and serious ones (only combinations with I′ ≥ 4). The day is never below paper.
   **Kept** = day ÷ inherent.
7. **Strongest chosen level** = the first chosen in the order of rule 2 (for the caption); none chosen → none.

## Presets

Every preset leaves the scenes it does not name without controls. Numbers: on paper / on the day (kept); expected
injuries in 200 runs; injuries and serious in series 1.

| # | id | params | expected |
|---|---|---|---|
| 1 | `none` | nothing | stairs 16/16 (100 %), 16 expected, 18 in series 1; lamp 12/12, 8, 6; car 15/15, 8, 8; door 16/16, 16, 12 |
| 2 | `lower` | organise + protect in all four | stairs 9/10.56 (66 %), 9.6 (2.88 serious); lamp 6/7.26 (60.5 %), 4.8; car 10/11 (73.3 %), 4.8; door 12/12.8 (80 %), 9.6 — every scene keeps most of its risk |
| 3 | `operator` | door: organise; scene door | door 12/12.8 (80 %), 9.6 expected; series 1: 11 injuries, all serious |
| 4 | `guard` | door: separate + organise; scene door | door 4/4.96 (31 %), 2.544 expected; series 1: 1 injury, serious |
| 5 | `upper` | replace + separate + organise + protect in all; scene lamp | stairs 2/2.3332 (14.6 %), lamp 1/1.3312 (11.1 %), car 3/3.072 (20.5 %), door 2/2.48 (15.5 %); no serious injury in series 1 |
| 6 | `remove` | remove in all; scene car | 0 everywhere, no injuries, nothing forgotten |

Worked example (stairs, `lower`): both held 0.8 × 0.7 = 0.56 → 3 × 3 = 9; organise held, pads forgotten 0.24 → 3 × 4 =
12; organise forgotten, pads held 0.14 → 4 × 3 = 12; both forgotten 0.06 → 16. Day = 5.04 + 2.88 + 1.68 + 0.96 =
10.56. Injuries: 200 × (0.8 × 0.04 + 0.2 × 0.08) = 9.6; serious only with the pads forgotten: 200 × (0.24 × 0.04 + 0.06
× 0.08) = 2.88.

## Captions

- removed: "{scene}: the hazard is removed, so there is nothing to forget or break: no injuries in 200 runs."
- none: "{scene}, no controls: L × I = s. In 200 runs, n injuries, m of them serious."
- strongest is organise or protect: "{scene}, only controls someone must remember: s′ on paper, ≈ d on the day, k % of
  the risk stays. n injuries, m serious; something forgotten in f runs."
- strongest is replace or separate: "{scene}, strongest level "{level}": s′ on paper, ≈ d on the day, k % of the risk
  stays. A built-in control holds on (nearly) every run: n injuries, m serious."
- then, for each chosen control that moves no level: ""{control}" moves no level: it does not protect against this
  injury."

## Legend

on paper (hatched), on the day (solid), injury (light cell, number = severity), serious injury (dark cell, 4–5),
something forgotten (corner mark).

## Terms (hr / en)

ukloniti opasnost / remove the hazard; zamijeniti manje opasnim / replace with something less dangerous; odvojiti ljude
od opasnosti / separate people from it; organizirati rad / organise the work; osobna zaštitna oprema / personal
protective equipment; vjerojatnost / likelihood; posljedica / severity; ponavljanje (scene) / run; kaskader / stunt
performer; brifing; grip; take (takeovi). Terms to check: NOTES.md "For the owner".

## Misconceptions targeted

- "Briefings and PPE are enough": on paper they take a third to a half off a score, on the day the scene keeps 60–80 %.
- "More controls of any kind help equally": a control that moves no level (a vest against a car) changes nothing.
- "A control is either in place or not": the lower ones are in place only when someone remembers.
- "Low risk means no risk": only removal reaches 0; every other combination keeps at least 1 × 1.

## Out of scope

Specialist methods (stunts, rigging, precision driving, the door's mechanism): only that the specialist controls it.
Correlated forgetting (a tired crew forgets everything at once), controls that fail by wear, the cost of each control,
the real ratings of real scenes. Legal duties beyond naming the order of prevention.

## Sources

- Council Directive 89/391/EEC (framework directive), art. 6(2): the general principles of prevention (avoiding risks,
  replacing the dangerous by the non- or less dangerous, collective protective measures before individual ones,
  appropriate instructions) — the order of the ladder. EUR-Lex CELEX 31989L0391, from memory *(check)*; not quoted on
  the page, no number on the page comes from it.
- Zakon o zaštiti na radu (NN 71/14 and amendments), the general principles of prevention *(check: article and
  current amendments)*; named on the page without an article.
- The hierarchy of controls as published by safety regulators (elimination, substitution, engineering,
  administrative, PPE) *(check)*.
- Likelihood × impact scoring: `sims/cmp-risk-register/SPEC.md` rules 1 (5 × 5, score L × I).
- Real case (catalogue §4.14): the 2014 injury of an actor by a powered set door during the shooting of *Star Wars: The
  Force Awakens* (UK) and the Health and Safety Executive's prosecution of Foodles Production (UK) Ltd (guilty plea;
  £1.6 m fine and costs, Aylesbury Crown Court, October 2016) — from news reports only; the HSE press release and the
  conviction record could not be opened (NOTES.md), so the page has **no "Based on" line**. The `door` scene is modelled
  on it (a powered door whose only protection was an operator's reaction; an automatic stop would have been the
  stronger control), fictional and without names.

Every number on the page is illustrative and was checked by an independent script (NOTES.md "Numbers check").
