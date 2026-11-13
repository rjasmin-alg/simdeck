<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-circuit-load: spec

Task `docs/tasks/w3/set-circuit-load.md` (catalogue §4.14). One concept: **a lamp's power divided by the mains voltage
is the current it draws (P = V × I: 2 kW at 230 V is about 8.7 A); a circuit's breaker allows a set current (a 16 A
socket circuit carries about 3.7 kW), so lamps that add up to more trip it, often mid-take; a cable heats with the
current through it, and a cable left coiled on its drum cannot shed that heat, so it carries far less than when unwound
before its insulation softens; a lamp plugged into another department's circuit trips their equipment too; connecting
to a building's or a generator's supply is the licensed electricians' work, and the page shows the load, never the
connection.**

Class: explorer (no steps). The state follows from the params at once.

## Location (one fictional production, a flat used as a location)

Four socket circuits behind a distribution board that is drawn closed ("only the electricians"). Each circuit is given to
one department by the electricians' plan. All ratings and powers are illustrative.

| Circuit | Room | Breaker | Department (plan) | Free sockets | Already on it |
|---|---|---|---|---|---|
| c1 | living room (the set) | 16 A | electric | s1, s2; the cable drum's outlets r1, r2 | the cable drum (25 m) |
| c2 | dining room | 16 A | electric | s3, s4 | — |
| c3 | hall (camera and video) | 16 A | camera | s5, s6 | camera, monitors and chargers, 800 W |
| c4 | bedroom (make-up room) | 10 A | make-up | s7, s8 | — |

Devices one can plug in: lamps of 650 W, 1 kW and 2 kW (electric), the kettle 2200 W and the mirror lights 800 W
(make-up). The 10 A circuit is an older circuit of the flat (illustrative): the same load that a 16 A circuit carries can
trip it.

## State (from `derive(params)`)

```
{ plugs: [{ slot|null, circuit, device, fixed, w, amps, dept, offPlan, live }],     // board order, fixed first per circuit
  circuits: [{ id, room, rating, dept, watts, amps, limitW, headroomW, tripped, depts, dark, offPlan }],
  reel: { circuit, mode, demandW, watts, amps, temp, over, maxAmps, maxW },
  tripped: [circuitId], dark: [dept], cameraDark, totalW }
```

The model holds no words; the page names rooms, devices and departments from `strings.js`.

## Rules (load.js: the shared electrical-load model, catalogue §5.25; sim.js: the location)

| # | Rule | Source |
|---|---|---|
| 1 | **Current from power:** I = P / V with V = 230 V (single-phase mains). 2000 W → 8.70 A; 1000 W → 4.35 A; 650 W → 2.83 A; 2200 W → 9.57 A; 800 W → 3.48 A. | P = V × I (standard, for a resistive load such as a tungsten lamp or a kettle); 230 V: the EU's nominal low voltage (IEC 60038, catalogue §4.14 says it may be on the page) |
| 2 | **A circuit's demand** is the sum of the power of every device on it, fixed ones and the drum's outlets included; its current is demand / V. Currents in parallel add (Kirchhoff). | standard |
| 3 | **Breaker:** a circuit trips when its demand is **above** In × V (16 A → 3680 W; 10 A → 2300 W). **Tie-break:** exactly at the rating does not trip. Compared in whole watts, so the tie is exact. A tripped circuit carries nothing: every device on it is dark. Real breakers trip on a slight overload only after minutes (their thermal part; EN 60898-1 conventional non-tripping current 1.13 In, tripping current 1.45 In within an hour *(check)*), which is why it so often happens mid-take; the model shows the end state, the explanation says so. | breaker behaviour simplified; EN 60898-1 *(check)* |
| 4 | **Cable temperature:** at steady state a cable's rise over the air is proportional to I² (heat made I²R, heat shed proportional to the rise): T = 25 °C + k·I². Unwound k = 4/25 = 0.16 K/A²; coiled on its drum k = 48/25 = 1.92 K/A² (12 times: the inner turns are wrapped in the outer ones and shed heat only through the drum's outside). Limit 70 °C (the insulation starts to soften, illustrative). **Tie-break:** at the limit is not over; compared as integers (k_num·P² > k_den·V²·45). So the most it carries: unwound √(45/0.16) = 16.8 A (3857 W, just above the breaker: the breaker protects it); coiled √(45/1.92) = 4.84 A (1113 W: far below the breaker, which never trips for it). Cable drums are marked with two loads, wound and unwound, in that proportion *(check: EN 61242 marking clause)*. | Joule heating and linear cooling (standard); the ratio and the limit illustrative, close to drum markings of about 1000 W wound / 3500 W unwound *(check)* |
| 5 | **The drum carries** the sum of its two outlets, only while its circuit is live; on a tripped circuit it carries 0 and is at 25 °C. The drum is plugged into c1 and its load counts in c1's demand (rule 2). | rules 2 and 3 |
| 6 | **Off-plan and dark departments:** a device is off-plan when its department is not the circuit's (a lamp on the camera's circuit, the kettle in the hall). When a circuit trips, every department with a device on it is dark, fixed devices included; lists of departments are always in the order electric, camera, make-up (tie-break). `cameraDark` is true when the camera's department is dark. | the concept: "a lamp plugged into another department's circuit trips their equipment too" |
| 7 | **Totals:** `totalW` is the power of the live circuits only. | definition |
| 8 | **Changed** (page only): the sockets whose device changed since the last input and the circuits whose tripped state changed are marked; nothing is marked on the first render or on a preset load. | the kit's "changed" mark |
| 9 | **Click on a socket:** an empty socket takes the device in hand (`hand`); a full one is unplugged (a socket holding an unknown id counts as empty and takes the device in hand). The fixed camera load and the board cannot be clicked. An unknown device id in a socket counts as empty. | interaction |

Out of scope (the concept's own line): how the location's or a generator's supply is connected, distribution boards,
earthing, RCDs, three phases (`set-phase-balance`), a lamp's heat (`set-lamp-heat`), cable runs over walkways and
exits (`set-cable-runs-exits`), voltage drop over long cables, inrush current, power factor of LED or discharge lamps.
The page shows the load, never the connection.

## Params

- `hand` (choice: l650, l1000, l2000, kettle, mirror; default l2000): what a click on an empty socket plugs in.
- `reel` (choice: coiled, unwound; default coiled): the cable drum as it is.
- `s1` … `s8`, `r1`, `r2` (hidden selects: '' or a device; default ''): what is in each socket. Changed by clicking the
  sockets on the stage; hidden params so a link, a reload and the language switch keep them.
- Button "Unplug all" (key U): every socket to ''.

## Presets and expected numbers (checked by `NOTES.md` "Numbers check")

| # | Preset | Plugs | Expected |
|---|---|---|---|
| 1 | `one-lamp` | s1 2 kW | c1 2000 W = 8.70 A of 16 A, headroom 1680 W; nothing tripped |
| 2 | `trip` | s1, s2 2 kW | c1 4000 W = 17.39 A > 16 A: tripped, electric dark; the drum carries 0 |
| 3 | `spread` | s1 2 kW (c1), s3 2 kW (c2) | each 8.70 A of 16 A; nothing tripped; total 4800 W (the camera's 800 W included) |
| 4 | `coiled` | r1 2 kW, drum coiled | c1 8.70 A, no trip; drum 8.70 A at 170.2 °C > 70 °C, over (max 4.84 A, 1113 W). Unwound: 37.1 °C, not over (max 16.77 A, 3857 W) |
| 5 | `makeup` | s7 kettle, s8 mirror (c4, 10 A) | 3000 W = 13.04 A > 10 A: tripped, make-up dark |
| 6 | `camera` | s5 kettle, s6 mirror (c3) | 800 + 2200 + 800 = 3800 W = 16.52 A > 16 A: tripped, camera and make-up dark, two off-plan devices, `cameraDark`. The kettle alone there: 3000 W = 13.04 A, no trip |

Other numbers: 2 kW + 1 kW + 650 W on c1 = 3650 W = 15.87 A, just under (30 W to spare); the coiled drum with 1 kW:
61.3 °C, with 650 W: 40.3 °C; unwound with 3 kW: 52.2 °C.

## Legend and captions

Legend: a lamp (electric), make-up's device, the camera's equipment (fixed, locked), off-plan (⚠ another department's
circuit), tripped (hatched, ✕), changed. Each meter: the breaker's rating as a thick line, the devices as labelled
segments, the overload beyond the line hatched. The drum's thermometer: a line at 70 °C, the over part hatched.

Caption: what the last click did (device, P / V = I, the circuit's current against its rating), then the most important
state: a trip (which circuit, demand against limit, which departments are dark; the camera's power lost mid-take), or the
drum over its limit (its temperature, and that the breaker does not trip), or all live with the headroom left.

Foot line on the stage (both languages): the page simplifies, the numbers are illustrative, and the production's safety
briefing and the head of department have the final word. The closed board's note on the stage says that connecting to
the building's supply or a generator is licensed electricians' work and that the page shows the load.

## Misconceptions targeted

- "A 2 kW lamp is 2 A" (or watts and amps are the same thing): every chip shows P and I.
- "If the breaker did not trip, the cable is fine": the coiled drum at 8.7 A, 170 °C, breaker quiet.
- "The breaker trips the moment I plug in": the explanation's thermal delay, mid-take.
- "Any free socket is free": the kettle in the hall darkens the camera.
- "A bigger breaker would fix it": the explanation: the breaker matches the wiring behind it, and only the electricians
  change the supply.

## Sources

- Directive 2014/35/EU (low voltage) and IEC 60038 (standard voltages, 230/400 V): the 230 V on the page *(check:
  the IEC 60038 edition; HRN EN 60038)*.
- EN 60898-1, circuit-breakers for overcurrent protection for household and similar installations: conventional
  non-tripping and tripping currents 1.13 In and 1.45 In *(check, not read: the standard is paid)*.
- EN 61242, cable reels for household and similar purposes (≤ 16 A): marking of the maximum load fully wound and fully
  unwound, and temperature protection unwound, partly and fully wound *(check: known from the standard's catalogue
  pages, a Dutch inspection guide (nen.sulerr.com, "Extension cords & cable reels — inspection criteria") and a maker's
  FAQ, not from the clause itself)*.
- BS 7909, code of practice for temporary electrical systems for entertainment and related purposes, and the guidance
  that points to it for film location work (Richmond Council, "BS 7909 filming electrical safety"; the BBC's
  safety guidance pages on temporary electrical systems; HSE INDG247): the competent person in charge of a temporary
  system, and that a production's supply is planned and connected by them *(check: found by a web search, not read in
  full)*.
- Zakon o zaštiti na radu (Narodne novine), and the Croatian rules on who may work on electrical installations and
  connect temporary supplies *(check, catalogue §4.14: not named on the page)*.
- Directive 89/391/EEC (the framework directive): the employer's risk assessment, behind the safety briefing *(not on
  the page)*.

No real case: catalogue §4.14 lists `set-circuit-load` under "No fitting documented case known", so there is no "Na
temelju / Based on" line.
