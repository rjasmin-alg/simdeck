<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-phase-balance: spec

Task `docs/tasks/w3/set-phase-balance.md` (catalogue §4.14). One concept: **a generator or a large supply has three
phases, each with its own limit; lamps are spread across them so that each phase carries a similar load; piling lamps
on one phase trips it while the other two idle, and an unbalanced load sends current back through the neutral
conductor, which can then overheat; the electricians plan the distribution before the lamps are placed, and everyone
else plugs in only where they are told.**

Class: explorer (no steps). The state follows from the params at once. Builds on `set-circuit-load`: its load model
(`load.js`) is copied here unchanged, with the three phases added after it as new functions (COMMON.md §6).

## Distribution (one fictional production, a night exterior in a courtyard)

A generator feeds a distribution box, drawn closed and locked ("only the electricians"). Three phases, each a circuit
of its own behind its own breaker, with four sockets each. All ratings and powers are illustrative.

| Phase | Breaker | Sockets | Already on it | The gaffer's plan |
|---|---|---|---|---|
| L1 | 32 A | a1–a4 | — | a1–a3: 2 kW lamps; a4 free |
| L2 | 32 A | b1–b4 | — | b1–b3: 2 kW lamps; b4 free |
| L3 | 32 A | c1–c4 | camera and video village, 800 W | c1, c2: 2 kW lamps; c3: a 1 kW lamp; c4 free |

The plan: eight 2 kW lamps and one 1 kW lamp, 17 kW of light, spread to 6000, 6000 and 800 + 5000 = 5800 W. The supply
gives 3 × 32 A × 230 V = 22 080 W (illustrative: a generator of about 22 kVA).

Devices one can plug in (from `load.js`): lamps of 650 W, 1 kW and 2 kW (electric) and the kettle, 2200 W (make-up).

## State (from `derive(params)`)

```
{ plugs: [{ slot|null, phase, device, fixed, w, amps, dept, offPlan, live }],     // board order, fixed first per phase
  phases: [{ id, rating, watts, amps, limitW, headroomW, tripped, depts, dark }],
  neutral: { watts, amps, rating }, supply: { demandW, liveW, limitW },
  tripped: [phaseId], dark: [dept], cameraDark, offPlan: [slot], missing: [slot], asPlanned }
```

The model holds no words; the page names phases, devices and departments from `strings.js`.

## Rules (load.js: the shared electrical-load model, catalogue §5.25; sim.js: the distribution)

| # | Rule | Source |
|---|---|---|
| 1 | **Current from power:** a lamp is connected between a phase and the neutral at V = 230 V: I = P / V (`load.amps`, set-circuit-load rule 1). 2000 W → 8.70 A; 1000 W → 4.35 A; 650 W → 2.83 A; 2200 W → 9.57 A; 800 W → 3.48 A. Between two phases the voltage is 400 V (230 × √3 = 398.4, nominal 400; `V_LL`), shown as a fact only. | P = V × I; 230/400 V: IEC 60038 (catalogue §4.14 says both may be on the page) |
| 2 | **A phase's demand** is the sum of the power of every device on it, the fixed camera load included; its current is demand / V (`load.circuitLoad`). | Kirchhoff (standard) |
| 3 | **Each phase has its own breaker:** a phase trips when its demand is **above** 32 A × 230 V = 7360 W (`load.trips`). **Tie-break:** exactly at the rating does not trip; compared in whole watts. A tripped phase carries nothing; every device on it is dark; the other two phases carry on. The generator's total does not protect a phase: 8 kW on one phase trips it while the supply could give 22 kW. Real breakers trip on a small overload only after a long time, or not at all: EN 60898-1's conventional non-tripping current is 1.13 In for an hour *(check)*, and 34.78 A on 32 A is 1.087 In, so the presets' trips stand for a lamp load that grows or a breaker already warm; the explanation says only that a small overload can hold for tens of minutes or more and then trip mid-take, and the model shows the end state. | the concept; breaker simplified |
| 4 | **Neutral current:** the three phase currents are a third of a period apart, so with resistive loads (tungsten lamps, a kettle) the neutral carries their sum as phasors, I_N = √(I1² + I2² + I3² − I1·I2 − I2·I3 − I3·I1), counting the live phases only (a tripped phase is 0). Equal loads: exactly 0 (computed from whole watts). One phase alone: its whole current. Two equal phases and the third off: as much as one phase. With resistive loads I_N never exceeds the largest phase current (tested over a sweep). The phases' breakers do not measure the neutral's current (a real distribution may add neutral detection, IEC 60364-4-43 *(check)*; this fictional box has none); the page draws it as thick as a phase, against the same 32 A line. | three-phase circuits, standard (I_N = \|I1 + a²·I2 + a·I3\|, a = e^(j·120°)) |
| 5 | **Supply totals:** `demandW` is the sum of all three phases' demand; `liveW` of the live phases only; `limitW` = 3 × 7360 = 22 080 W. | definition |
| 6 | **The plan:** the gaffer's plan names a device (or nothing) for each socket (table above). A plugged device is **off-plan** when it is not the plan's device for that socket (a lamp in a socket planned free, a 1 kW where the plan has 2 kW, the kettle anywhere); the fixed camera load is never off-plan. **Missing:** sockets the plan fills that are empty. `asPlanned` is true when every socket holds exactly the plan's device. Lists of sockets are in board order (a1 … c4). | the concept: "the electricians plan the distribution before the lamps are placed, and everyone else plugs in only where they are told" |
| 7 | **Dark departments:** when a phase trips, every department with a device on it is dark, fixed devices included; lists of departments are always electric, camera, make-up (tie-break), without repeats. `cameraDark` is true when the camera is dark. | the concept |
| 8 | **Changed and caption helpers** (page): the sockets whose device (rule 9: an unknown id is empty) changed since the last input and the phases whose tripped state changed are marked, in board order; nothing on the first render or a preset load. `leastSpare`: among the phases the student has plugged something into, the one with the least headroom; **tie-break:** board order; none when nothing is plugged in. | the kit's "changed" mark |
| 9 | **Click on a socket:** an empty socket takes the device in hand (`hand`); a full one is unplugged. A socket holding an unknown id counts as empty (in the state, for a click and for the "changed" mark). A click on an unknown socket, or on an empty one with nothing pluggable in hand, changes nothing. The fixed camera load and the box cannot be clicked. | interaction |

Out of scope (the concept's own line): how the generator or the box is connected, earthing, RCDs, the generator's own
behaviour under unbalance (voltage, derating), loads connected between two phases at 400 V, harmonics of LED and
discharge lamps (named in the explanation as the reason a neutral can carry more than a phase; not modelled), power
factor, voltage drop, inrush current, the cable's heat (`set-circuit-load`), a lamp's heat (`set-lamp-heat`), cable
runs over walkways and exits (`set-cable-runs-exits`). The page shows the load, never the connection.

## Params

- `hand` (choice: l650, l1000, l2000, kettle; default l2000): what a click on an empty socket plugs in.
- `a1` … `a4`, `b1` … `b4`, `c1` … `c4` (hidden selects: '' or a device; default ''): what is in each socket. Changed
  by clicking the sockets on the stage; hidden params so a link, a reload and the language switch keep them.
- Button "Unplug all" (key U): every socket to ''. (Back to the plan is preset 1.)

## Presets and expected numbers (checked by `NOTES.md` "Numbers check")

| # | Preset | Plugs | Expected |
|---|---|---|---|
| 1 | `plan` | the gaffer's plan | L1 6000 W = 26.09 A, L2 6000 W = 26.09 A, L3 5800 W = 25.22 A; nothing trips; neutral 200 W → 0.87 A; 17 800 W of 22 080 W; as planned |
| 2 | `lopsided` | the same nine lamps, plugged where the cables were shortest: L1 2, 2, 2, 1 kW; L2 2, 2 kW; L3 2, 2, 2 kW | L1 7000 W = 30.43 A (360 W to spare), L2 4000 W = 17.39 A, L3 6800 W = 29.57 A; nothing trips; neutral 2905 W → 12.63 A (0.87 A as planned); off-plan a4, c3; missing b3 |
| 3 | `pile` | the first four 2 kW lamps all on L1 | L1 8000 W = 34.78 A > 32 A: tripped, electric dark; L2 0, L3 800 W (the camera); live 800 W of 22 080 W; neutral 3.48 A (the camera alone); off-plan a4; missing b1–b3, c1–c3 |
| 4 | `kettle` | the plan, and make-up's kettle in the free socket c4 | L3 5800 + 2200 = 8000 W = 34.78 A > 32 A: tripped, electric, camera and make-up dark, `cameraDark`; L1, L2 live, so the neutral jumps from 0.87 A to 6000 W → 26.09 A; off-plan c4 |

Other numbers: the plan with a 650 W lamp added on a4: L1 6650 W = 28.91 A, neutral 770 W → 3.35 A; one phase alone at
3000 W: neutral 13.04 A, the same as the phase; 3680 W on L1 alone: neutral exactly 16 A.

## Legend and captions

Legend: a lamp (electric), make-up's device, the camera's equipment (fixed), not in the plan (⚠), tripped (dashed red,
✕), changed. Each phase's meter: the breaker's rating as a thick line, the devices as labelled segments, the overload
beyond the line hatched. The neutral: a meter of the same scale and line, and a small diagram of three arrows a third
of a turn apart (L1 up, L2 lower right, L3 lower left, each as long as its phase current) with the neutral as a
dashed arrow, their sum.

Caption: what the last click did (device, P / V = I, the phase's current against its rating), then the most important
state: a trip (which phase, demand against limit, the departments dark, then either the camera lost mid-take or, when
the camera is still on, how much of the supply is still used: one of the two, to keep the caption short); else the neutral current against the three phase currents (near 0 when balanced); then, when
something is off-plan, how many devices are not where the plan put them, or "as planned".

Foot line on the stage (both languages): the page simplifies, the numbers are illustrative, and the production's safety
briefing and the head of department have the final word. The closed box's note says that the generator and the
distribution are planned and connected by licensed electricians and that everyone else plugs in only where they are
told.

## Misconceptions targeted

- "The generator is 22 kW, so 8 kW is fine": each phase has its own limit; one phase trips at 7.4 kW.
- "Unbalanced just means one phase works harder": the neutral carries the difference (0.87 A → 12.6 A for the same
  lamps).
- "A phase tripping takes load off, so everything else is calmer": the kettle preset; losing L3 makes the neutral
  carry 26 A.
- "A free socket is free": the plan leaves c4 free for a reason; the kettle in it darkens the camera.

## Sources

- IEC 60038 (standard voltages, 230/400 V) and Directive 2014/35/EU (low voltage): the 230 V and 400 V on the page
  *(check: the IEC 60038 edition; HRN EN 60038)*.
- Three-phase circuits, the neutral current of an unbalanced star-connected load: any electrical engineering textbook
  (the phasor sum; checked here by an independent script with complex numbers).
- IEC 60364-5-52 (selection of wiring systems: the neutral's cross-section and the reduced-neutral conditions) and
  IEC 60364-4-43 (protection against overcurrent: overcurrent detection in the neutral where its current can exceed its
  rating, for example with third-harmonic currents) *(check: from memory, the standards are paid; only the explanation's
  qualitative line depends on them)*.
- EN 60898-1, circuit-breakers: the thermal delay *(check, as in set-circuit-load)*.
- BS 7909, code of practice for temporary electrical systems for entertainment and related purposes, and the film
  guidance pointing to it (the competent person who plans and connects a production's supply; balancing the load over
  the phases is part of their design) *(check: found by a web search for set-circuit-load, not read in full)*.
- Zakon o zaštiti na radu (Narodne novine) and the Croatian rules on who may work on electrical installations and
  connect temporary supplies *(check, catalogue §4.14: not named on the page)*.

No real case: catalogue §4.14 lists `set-phase-balance` under "No fitting documented case known", so there is no "Na
temelju / Based on" line.
