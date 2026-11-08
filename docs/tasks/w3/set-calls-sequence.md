# set-calls-sequence: The calls: from "lock it up" to "moving on"

| | |
|---|---|
| Task | `set-calls-sequence` (wave 3, Working on a film set) |
| Catalogue entry | `set-calls-sequence` in `docs/catalogue.md` §4.14 |
| Kind | build a new simulator |
| Folder | `sims/set-calls-sequence/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | SET |
| Topic / tags / level | `film-set` / `set-procedure` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **a take runs on a fixed sequence of calls from the 1st AD and the departments: last looks, lock it up (the area held quiet and clear, doors and passers-by stopped), roll sound and "speed", roll camera, the slate marks the take, action, cut, then reset or back to one, check the take, and "moving on" when the setup is done; each call is a handshake that tells every department what it may and may not do (nobody crosses the frame or talks after "roll", nobody moves before "cut", lamps and dressing are touched only on reset); called out of order or not heard, the take is lost (no sound at action, a passer-by in frame, no slate) or someone is standing where the camera, a vehicle or an effect will be**.

The student: step through a take and pick a department (camera, sound, grip, make-up, a production assistant at the door) to see what it does and must not do at each call; then reorder or skip calls, let one department miss a call on a noisy radio, and see what the take and the floor look like.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.14.

## Sources

- The primary texts under "Film set notes" below (EUR-Lex, Narodne novine, published film and TV safety guidance); mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: idea only; the calls travel on the main radio channel of set-radio-discipline

## Film set notes (all `set-` tasks)

- **Who it is for:** people learning to work on a film set (trainees, new crew, day players, film students), taught by a colleague who trains film crews; they know neither the equipment nor the jobs. Each page puts one practice in motion and shows one contrast (with and without the practice, the right and the wrong order, under and over the limit); make that contrast the stage, not the rule. Not a quiz and not a slideshow.
- **The set has the final word.** Every page says once, in the explanation and in a line the learner sees, that it simplifies, that its numbers are illustrative and that the production's safety briefing and the department head have the final word. A safety rule appears as the reason behind a practice (what goes wrong without it), never as a regulation to obey because the page says so; nothing on the page reads as "do this and you are safe".
- **Specialist work from outside.** Connecting power (tie-ins and distribution), rigging, stunts, special effects and pyrotechnics, weapons, precision driving and operating lifts are shown as what the specialist controls and why everyone else stays out, never as steps someone could follow: no wiring, no rigging method, no charge or quantity, no weapon handling, no driving technique.
- **Concepts, not tools** (COMMON.md §1): no brand or model of lamp, stand, radio, lift, camera, card or vehicle; say "a 2 kW lamp", "a stand", "a lift", "a handheld radio".
- **Numbers are illustrative.** Wattages, wind speeds, weights, distances, hours, temperatures and decibels are made-up but plausible, and the page says so once; the physics (P = V × I, moments about the tipping edge, wind force with the square of the speed, E = m·g·h, stopping distance, decibels and a daily dose) is standard and is checked in SPEC.md with a small script.
- **One fictional production:** a made-up feature film with a made-up crew and made-up locations; never a real production, company or person, and no real accident retold on the page (published accident reports may inform SPEC.md).
- **Croatian terms and rules:** use the Croatian set term where one is in use and give the English in brackets once (crews often say the English word: gaffer, grip, call sheet). The terms and the Croatian rules marked *(check)* in catalogue §4.14 (the Croatian titles and "Where Croatian practice matters") are unverified: use a plain descriptive Croatian phrase on the page instead, and copy them into `NOTES.md` under "For the owner" with the source you would check. An EU directive may be named in the explanation, with its article, only where a number on the page comes from it (the noise action values, the minimum daily rest).
- **Primary sources:** the EU texts on EUR-Lex (the framework directive 89/391/EEC, working time 2003/88/EC, noise 2003/10/EC, manual handling 90/269/EEC, work equipment 2009/104/EC), the Croatian laws in Narodne novine, and the film and TV safety guidance published by safety regulators and industry safety committees. Cite them in SPEC.md; do not copy their text or figures onto the page.
- **Shared models (catalogue §5.25):** keep the crew and chain, the floor plan, the forces and moments, the shooting day or the electrical load in its own module file inside your sim folder, pure and tested, so the coordinator can promote it to `models/` later. When the entry builds on another sim, copy its module (COMMON.md §6).
- **Learn tree:** the `npm run check` warning "in no leaf yet" is expected; suggest a leaf in your report (catalogue §4.14 has the proposed `film-set` area).

## Model and presets

_To be filled before building: state, what one step does, rules in order, tie-breaks, params, 3–6 presets with expected outcomes, step count, legend, captions, terms in both languages, misconceptions to target, out of scope._

## Steps

1. `kit/new-sim.sh set-calls-sequence sims/set-calls-sequence` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/set-calls-sequence/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
