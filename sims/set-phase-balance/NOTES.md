<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-phase-balance: notes

Task `docs/tasks/w3/set-phase-balance.md` (catalogue §4.14). Rules, tie-breaks and numbers: `SPEC.md`. A new native
explorer that builds on `set-circuit-load`.

## Decisions

- **The load model is copied, then extended.** `models/` has no `set-load` yet, so `load.js` is
  `sims/set-circuit-load/load.js @ 982e7d9` copied unchanged (COMMON.md §6), with the three phases added after it as
  new functions (`V_LL`, `neutralW`, `neutralAmps`, `phaseLoad`). Every old function and result is the same (a test
  checks the devices are unchanged and keeps set-circuit-load's load tests), so this file can be promoted to
  `models/set-load.js` as a superset. The distribution (phases, sockets, plan, presets) stays in `sim.js`.
- **The neutral does not overheat on the stage, by design.** The concept says an unbalanced load sends current back on
  the neutral, "which can then overheat". With resistive loads (tungsten lamps, a kettle) the neutral never carries
  more than the busiest phase (a property of the phasor sum, tested over a sweep), so a neutral as thick as a phase
  cannot overheat from unbalance alone. Showing it overheat would be wrong physics. The page shows what is true: the
  neutral carries the unbalance (0.87 A as planned, 12.6 A for the same lamps badly spread, 26.1 A when one phase
  trips), it is drawn against the same 32 A line as a phase, and the phases' breakers do not measure it. The
  explanation names the real reason a neutral overheats (LED and discharge lamps' pulsed currents add up in the
  neutral even when the phases are balanced), without modelling it: harmonics would be a second concept
  (COMMON.md §1). **For the owner**: if the colleague wants the neutral to overheat on the page, that is a second sim
  (harmonics), not a preset of this one.
- **A phase trip raises the neutral current** (preset 4, the kettle): L3 out leaves L1 and L2 with nothing to cancel
  against, 0.87 A → 26.1 A. Kept as a preset because it is counter-intuitive and true, and it ties the trip to the
  neutral.
- **The gaffer's plan is on the stage** as a hint in every empty socket ("plan: 2 kW", "plan: free") and a ⚠ on
  anything plugged where the plan has something else. That carries the concept's last clause ("plan before the lamps
  are placed; everyone else plugs in only where told") without a separate plan panel. The plan leaves one socket per
  phase free; the kettle preset uses L3's.
- **Same lamps in `plan` and `lopsided`** (eight 2 kW, one 1 kW, tested), so "rebalance and compare" compares like
  with like. With these lamps no spread keeps every phase under 32 A and still pushes the neutral above 16 A, so the
  page has no "neutral high" threshold: the caption gives the number and the three phase currents.
- **The camera and video village is fixed on L3** (800 W), as in set-circuit-load, so a trip has a visible cost
  beyond the lamps and the plan's L3 is a little lighter (5800 W against 6000 W), which is why the plan's neutral is
  0.87 A, not 0.
- **The arrow diagram** draws each phase's current as an arrow a third of a turn apart (L1 up, L2 lower right, L3
  lower left; 32 A reaches the dashed ring) and the neutral as their dashed sum. No text inside the SVG (it scales):
  the phase names are HTML labels at the rim, and a line under the diagram says what the arrows are. A tripped phase
  has no arrow.
- **Sockets are hidden params** (`a1`…`c4`), as in set-circuit-load, so a reload, a copied link and the language
  switch keep the plugs. Keyboard: the sockets are buttons; focus stays on the socket after Enter.
- **No meter segment labels**: at four 2 kW lamps per phase they overlapped; the sockets above each meter give the
  values.
- **Defaults are empty sockets**, as in set-circuit-load; preset 1 is the plan.
- **No glossary terms** (`[[…]]`): plain words only; `glossary.js` is not loaded.
- **No real case.** Catalogue §4.14 lists `set-phase-balance` under "No fitting documented case known".
- **Not added to `docs/tasks/OPEN.md`**: the gate's scope rule allows only this folder; the owner's questions are
  below and in the report.

## For the owner (terms as used; catalogue §4.14 marks them *(check)*)

Loanword from the owner's list: *gaffer* ("Gafferov plan"; the explanation glosses it once as "šef rasvjete"). Not on
the owner's list, so *(check)* with the colleague who trains crews:

- *faza* for a phase, *L1, L2, L3* for their names *(check: crews may say "prva faza" or the colours)*
- *nulvodič* for the neutral conductor, glossed once as *neutralni vodič* *(check: or "nula", "neutralni vodič")*
- *agregat* for the generator, *razdjelnik* for the distribution box *(check: or "razvodni ormarić", "distribucija")*
- *osigurač* for the breaker (as in set-circuit-load) *(check)*
- *rasvjeta* for the electric department, *maska* for make-up, *kamera* for camera *(check, as in set-circuit-load)*
- *reflektor* for a lamp, *kuhalo za vodu* *(check)*
- *brifing* in the foot line *(check)*
- No calls (Tišina!, Akcija! …) appear on this page.

## Unchecked (*(check)*)

- IEC 60364-5-52 (the neutral's cross-section, reduced neutrals) and IEC 60364-4-43 (overcurrent detection in the
  neutral where third-harmonic currents can exceed its rating): from memory, the standards are paid. The page says only
  that the phases' breakers do not measure the neutral's current and that LED and discharge lamps' pulsed currents add
  up in the neutral.
- That a temporary film distribution's neutral is as thick as a phase: the usual case for multicore and single-core
  sets of five as far as I know *(check)*; the page says "as thick as a phase" for this distribution.
- BS 7909 and the film guidance pointing to it (the competent person plans the distribution, including the load per
  phase): found by a web search for set-circuit-load, not read in full; not named on the page.
- EN 60898-1, the breaker's thermal delay ("a few minutes"): as in set-circuit-load.
- The Croatian rules on who may work on electrical installations and connect temporary supplies (catalogue §4.14):
  not named on the page; the page says only "licensed electricians". To check: the Zakon o zaštiti na radu and the
  rulebook on low-voltage installations in Narodne novine.
- Every power and rating is illustrative (the page says so in the foot line and the explanation): the 32 A per phase,
  the 22 kW generator, the lamps, the kettle, the 800 W camera load.
- 230 V and 400 V at 50 Hz are standard and may be on the page (catalogue §4.14).

## Numbers check

An independent script (Python with complex numbers, written apart from `load.js`/`sim.js`: the neutral as
|I1 + I2·a² + I3·a|, not the closed form) gave: 230 × √3 = 398.4 V; 32 A × 230 V = 7360 W per phase, 22 080 W in all;
plan 6000 / 6000 / 5800 W = 26.09 / 26.09 / 25.22 A, neutral 0.87 A (200 W); lopsided 7000 / 4000 / 6800 W = 30.43 /
17.39 / 29.57 A, neutral 12.63 A (2905 W), 360 W to spare on L1; pile 8000 W = 34.78 A on L1 (trip), 800 W live,
neutral 3.48 A; kettle L3 8000 W = 34.78 A (trip), neutral 26.09 A (6000 W); the plan with 650 W on a4: L1 28.91 A,
neutral 3.35 A; one phase alone: the neutral equals the phase; 10 000 random triples: the neutral never exceeds the
largest phase.

## Term pairs (glossary)

None needed: the page uses no `[[terms]]`. Candidates once the owner confirms the forms: phase / faza; neutral
conductor / neutralni vodič (nulvodič); generator / agregat; distribution box / razdjelnik.

## Shared requests

- **Promote `load.js` to `models/set-load.js`** from this copy (a superset of set-circuit-load's), with the "load"
  tests of both sims; then point set-circuit-load and this sim at it. `set-lamp-heat` reads `DEVICES[*].lamp` and `w`.

## Learn tree

Suggested leaf (catalogue §4.14): `film-set` → `power` → `load`, after `set-circuit-load`.

## Review

A fresh reviewer (a separate agent, given the code, SPEC.md and the task, not this file) recomputed every number with
its own phasor script, diffed `load.js` against set-circuit-load's (only the header, the new block and the new exports
differ) and ran 82 deliberate breaks: 64 failed a test, 6 were equivalent (no possible input tells them apart), 12
survived. Fixed since:

- **The breaker's delay.** The explanation said a small overload trips "after a few minutes". At 34.78 A on 32 A
  (1.087 In) a breaker may hold for over an hour (EN 60898-1's non-tripping current is 1.13 In *(check)*). Now: "it can
  hold for a long time, tens of minutes or more, and then trip mid-take; the page shows the end state". SPEC.md rule 3
  says why. **The same wording is in set-circuit-load's explanation** (17.4 A on 16 A, also 1.087 In): a fix for that
  sim, not made here (another sim's folder).
- "When a phase trips the other two have nothing left to cancel against" contradicted the model (two equal phases
  still cancel in part). Now: "cancel each other only in part".
- The camera chip said "always on" while drawn dark after a trip. Now: "wired in" / "stalno spojeno".
- The caption on a trip gives either the camera line or the supply line, not both. SPEC.md now says so.
- `changedSlots` compares devices (an unknown id going to '' is no change); `click` ignores unknown sockets and a hand
  that is not pluggable (SPEC.md rules 8 and 9).
- New tests for the 12 survivors: the plan plus one extra lamp, nothing marked on the first render (both helpers), a
  tripped L2 in the neutral, each plug's current, least to spare with a tripped phase, the click on an unknown socket
  and with an unpluggable hand, the voltage passed to `phaseLoad` and `circuitLoad`, and the key order of the params.
  Each break was made again (11 scripted) and each now fails a test.

## Time

Started 2026-11-13 05:08, done 2026-11-13 05:26, including a fresh review.
