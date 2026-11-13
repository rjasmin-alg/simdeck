<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-circuit-load: notes

Task `docs/tasks/w3/set-circuit-load.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native
explorer.

## Decisions

- **The load is its own module, `load.js`** (catalogue §5.25: "the electrical load, lamps, sockets, circuits and
  phases … in its own module file, pure and tested"). This sim is the model's hub. It registers on
  `globalThis.SimdeckModels['set-load']` and is ready to move to `models/set-load.js` unchanged; its rule tests are
  the "load" block of `sim.test.js`. The location (rooms, circuits, sockets, presets) stays in `sim.js`.
- **Four circuits, not three.** Two 16 A circuits for electric (the living room where the scene is shot, the dining
  room), the hall (16 A) that the plan gives to camera and video, and the bedroom used as the make-up room on an older
  10 A circuit. The second electric circuit gives the fix for a trip (spread the lamps) without plugging into another
  department's circuit; the 10 A circuit shows that the breaker, not the socket, sets the limit, and gives make-up a
  reason to wander to the hall with the kettle.
- **A trip is the end state.** The model trips a circuit as soon as its demand is above In × V; the real delay of a
  breaker's thermal part (minutes on a small overload, which is why it happens mid-take) is in the explanation and in
  the camera caption ("mid-take"), not modelled in time. Unplugging returns the circuit at once, and the caption says
  the electricians reset the breaker.
- **Steady temperature for the drum.** T = 25 °C + k·I², coiled k 12 times unwound. The ratio and the 70 °C limit are
  chosen so the drum carries about 1.1 kW coiled and 3.9 kW unwound, close to the two loads drums are marked with
  (often about 1000 W wound / 3500 W unwound) *(check)*; unwound it carries a little more than the 16 A breaker lets
  through, coiled far less, which is the concept's point (the breaker never sees it). Above 200 °C the page shows
  "> 200 °C": a real cable would have failed long before; the explanation says heating takes tens of minutes.
- **The drum is fixed** in the living room's circuit with two outlets. A param for where the drum is plugged was
  left out (Size S, the panel on one screen).
- **Sockets are hidden params** (`s1`…`s8`, `r1`, `r2`, selects with `visible: false`), set by clicking the stage.
  Hidden params (rather than page state) keep the plugs in the URL, so a reload, a copied link and the L language
  switch (which reloads the page) keep them. Keyboard: the sockets are buttons; focus stays on the socket after Enter.
- **Off-plan** is per device: its department differs from the circuit's in the plan. Lamps on the dining room are on
  plan (it is electric's second circuit).
- **The board is drawn closed** with its four breakers' states and a lock: the page shows the load, never the
  connection (the concept's last clause). No wiring, no distribution, no generator on the page.
- **Croatian voltage symbol U** (P = U · I, I = P / U), as Croatian textbooks write it; English V as in the task.
- **No glossary terms** (`[[…]]`): the page needs only plain words; `glossary.js` is not loaded.
- **No real case.** Catalogue §4.14 lists `set-circuit-load` under "No fitting documented case known", so there is
  no "Na temelju / Based on" line.

## For the owner (terms as used; catalogue §4.14 marks them *(check)*)

Loanword from the owner's list, used as written: *gaffer* (explanation glosses it once as "šef rasvjete"; foot line
"… sigurnosni brifing produkcije i gaffer"). Not on the owner's list, so *(check)* with the colleague who trains crews:

- *osigurač* for the circuit breaker (as in the catalogue's Croatian title, "izbaci osigurač"); the explanation
  glosses it once as *automatski prekidač* *(check)*
- *rasvjeta* for the electric department, *maska* for make-up (the department and the room: "Spavaća soba, po planu:
  maska"), *kamera* for camera *(check: or loanwords crews say)*
- *kabel na bubnju* / *namotan na bubanj* / *odmotan do kraja* for the cable drum *(check: or "kolut", "produžni
  kabel")*
- *reflektor* for a lamp; *kuhalo za vodu*; *svjetla ogledala* for the make-up mirror lights *(check)*
- *razvodna ploča* for the distribution board; *agregat* for a generator *(check)*
- *brifing* in the foot line, as on `set-chain-of-command` *(check)*
- No calls (Tišina!, Akcija! …) appear on this page.

## Unchecked (*(check)*)

- EN 60898-1 conventional non-tripping and tripping currents (1.13 In, 1.45 In within an hour): from memory, the
  standard is paid; only in SPEC.md and, qualitatively ("a few minutes"), in the explanation.
- EN 61242 (cable reels) marking of the maximum load fully wound and fully unwound: from the standard's catalogue
  pages, a Dutch inspection guide and a maker's FAQ found by a web search, not from the clause itself. The page says
  "drums are marked with two loads, wound and unwound" without a figure.
- BS 7909 and the film-location guidance pointing to it (Richmond Council's "BS 7909 filming electrical safety", the
  BBC's safety pages on temporary electrical systems, HSE INDG247): found by a web search, not read in full; none is
  named on the page.
- The Croatian rules on who may work on electrical installations and connect temporary supplies, and the technical
  rules for temporary installations (catalogue §4.14): not named on the page; the page says only "licensed
  electricians". The source to check: the Zakon o zaštiti na radu and the rulebook on low-voltage installations in
  Narodne novine.
- Every power, rating and temperature on the page is illustrative (the page says so once in the foot line and in the
  explanation): the 650 W / 1 kW / 2 kW lamps, the 2200 W kettle, the 800 W mirror lights and camera equipment, the
  10 A circuit, the 25 °C air, the 70 °C limit, the factor of 12.
- 230 V single phase is standard and may be on the page (catalogue §4.14).

## Numbers check

An independent script (Python, written apart from `load.js`/`sim.js`, the formulas typed again) gave the numbers in
SPEC.md: 2 kW → 8.696 A; 16 A × 230 V = 3680 W, 10 A → 2300 W; two 2 kW = 4000 W = 17.39 A (trip); kettle + mirror
3000 W = 13.04 A (trips 10 A, not 16 A); camera + kettle + mirror 3800 W = 16.52 A (trip); 2 kW + 1 kW + 650 W = 3650 W
= 15.87 A (no trip); drum unwound 650 W / 1 kW / 2 kW / 3 kW: 26.3 / 28.0 / 37.1 / 52.2 °C, coiled: 40.3 / 61.3 /
170.2 / 351.7 °C; the most each carries: unwound 16.77 A (3857 W), coiled 4.84 A (1113 W).

## Term pairs (glossary)

None needed: the page uses no `[[terms]]`. Candidates for `kit/glossary.js` once the owner confirms the forms:
circuit breaker / automatski prekidač (osigurač); cable drum / kabel na bubnju; distribution board / razvodna ploča.

## Shared requests

- **Promote `load.js` to `models/set-load.js`** when `set-phase-balance` or `set-lamp-heat` starts (catalogue §5.25),
  with the "load" tests of `sim.test.js` (rules 1–4 and "load.js lamps carry what set-lamp-heat needs").
  `set-phase-balance` will add phases (a phase per circuit, 400 V between phases, the neutral current) as new
  functions; `set-lamp-heat` reads `DEVICES[*].lamp` and `w`.

## Learn tree

Suggested leaf (catalogue §4.14): `film-set` → `power` → `load` (the catalogue's tree lists `load: set-circuit-load,
set-phase-balance`).

## Review

A fresh reviewer (a separate agent, given the code and SPEC.md, not this file) checked every rule and number and ran
53 deliberate breaks: 46 failed a test, 7 survived. Fixed since: SPEC.md's `spread` total (4800 W, the camera's 800 W
included); `click()` treats an unknown id as empty (rule 9); the camera caption only when the circuit shown darkened
the camera; the drum caption compares the circuit's current, not the drum's, with the breaker; the headroom in watts
(30 W, not "0.0 kW"); "least to spare" only among circuits the student loaded; the final word given to "the head of
department" (the task's wording), not only the gaffer; the gaffer no longer described as a licensed electrician;
Croatian wording (djelatno opterećenje, desetak minuta, razmjerno kvadratu struje, Ukupna potrošnja). New tests for
the 7 survivors (the dark union's order and repeats, two trips changing at once, the drum's amps when tripped, fixed
devices first, unknown ids on click, the presets' sockets, the defaults); each was broken again and now fails.

## Time

Started 2026-11-13 03:47, done 2026-11-13 04:06, including a fresh review (53 deliberate breaks; the 7 that survived now have tests).
