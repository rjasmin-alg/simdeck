# set-card-handoff: Camera cards: never wiped before two checked copies

| | |
|---|---|
| Task | `set-card-handoff` (wave 3, Working on a film set) |
| Catalogue entry | `set-card-handoff` in `docs/catalogue.md` §4.14 |
| Kind | build a new simulator |
| Folder | `sims/set-card-handoff/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | SET |
| Topic / tags / level | `film-set` / `set-procedure`, `backup` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **a camera card holds the only copy of the day's shots until it is copied; the hand-over from camera to the data team is logged, each copy is checked against the card by a checksum, and the card goes back to camera to be wiped only when two verified copies exist on separate drives kept apart; a card wiped early, a copy nobody verified, or both copies on one drive lose a scene that cannot be reshot without the whole unit; the camera report and the labels let anyone see which card is safe to wipe**.

The student: shoot a day on several cards, move each through hand-over, copying and verification, choose when to send it back for wiping; inject a failed copy, a dropped drive and a mislabelled card; see which takes survive with and without the two-copies rule and the log.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.14.

## Sources

- The primary texts under "Film set notes" below (EUR-Lex, Narodne novine, published film and TV safety guidance); mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: idea only; the same rule as backups: ransomware-321, restore-drill → §5.25

## Film set notes (all `set-` tasks)

- **Who it is for:** people learning to work on a film set (trainees, new crew, day players, film students), taught by a colleague who trains film crews; they know neither the equipment nor the jobs. Each page puts one practice in motion and shows one contrast (with and without the practice, the right and the wrong order, under and over the limit); make that contrast the stage, not the rule. Not a quiz and not a slideshow.
- **The set has the final word.** Every page says once, in the explanation and in a line the learner sees, that it simplifies, that its numbers are illustrative and that the production's safety briefing and the department head have the final word. A safety rule appears as the reason behind a practice (what goes wrong without it), never as a regulation to obey because the page says so; nothing on the page reads as "do this and you are safe".
- **Specialist work from outside.** Connecting power (tie-ins and distribution), rigging, stunts, special effects and pyrotechnics, weapons, precision driving and operating lifts are shown as what the specialist controls and why everyone else stays out, never as steps someone could follow: no wiring, no rigging method, no charge or quantity, no weapon handling, no driving technique.
- **Concepts, not tools** (COMMON.md §1): no brand or model of lamp, stand, radio, lift, camera, card or vehicle; say "a 2 kW lamp", "a stand", "a lift", "a handheld radio".
- **Numbers are illustrative.** Wattages, wind speeds, weights, distances, hours, temperatures and decibels are made-up but plausible, and the page says so once; the physics (P = V × I, moments about the tipping edge, wind force with the square of the speed, E = m·g·h, stopping distance, decibels and a daily dose) is standard and is checked in SPEC.md with a small script.
- **One fictional production, real cases as references** (owner, 2026-11-08): the scenario is a made-up feature film with a made-up crew and locations, and no real name or date appears in the model, the presets or the captions. Where catalogue §4.14 ("Real cases as visible references") names a case for your entry, model the scenario recognisably on it and name the case visibly on the page, in a "Na temelju / Based on" line in the notes or foot with the public investigation or court record, so a lecturer can teach it as a hypothetical or point to the real event; cite the source in full in SPEC.md. Only cases with a public official report or court record; check the report's title, number and date against the document itself, and if you cannot find it, leave the reference off and say so in `NOTES.md`.
- **Croatian terms** (owner, 2026-11-08): roles, equipment and the day use the English loanwords crews say (gaffer, key grip, grip, boom operator, 1st AD, stand-in, call sheet, setup, wrap, picture vehicle, camera car), written in the Croatian strings as loanwords with Croatian declension where natural (setupa, gaffera); a Croatian gloss may appear once in the explanation. The calls are in Croatian (Tišina!, Ton!, Kamera!, Klapa!, Akcija!, Rez!, Idemo dalje!). The exact wording of the calls and the terms marked *(check)* in catalogue §4.14 are not settled yet: use them as listed there, and copy each one you use into `NOTES.md` under "For the owner".
- **The law applies to everyone** (owner, 2026-11-08): the Zakon o zaštiti na radu and the rest rules apply to everyone on set, whatever their contract, and a page may say so (`set-stop-for-safety`, `set-fatigue-turnaround`). Name the law's provisions without article numbers; the article numbers, the current amendments and the other Croatian rules marked *(check)* in §4.14 stay off the page and go into `NOTES.md` with the source you would check. An EU directive may be named in the explanation, with its article, only where a number on the page comes from it (the noise action values, the minimum daily rest).
- **Primary sources:** the EU texts on EUR-Lex (the framework directive 89/391/EEC, working time 2003/88/EC, noise 2003/10/EC, manual handling 90/269/EEC, work equipment 2009/104/EC), the Croatian laws in Narodne novine, and the film and TV safety guidance published by safety regulators and industry safety committees. Cite them in SPEC.md; do not copy their text or figures onto the page.
- **Shared models (catalogue §5.25):** keep the crew and chain, the floor plan, the forces and moments, the shooting day or the electrical load in its own module file inside your sim folder, pure and tested, so the coordinator can promote it to `models/` later. When the entry builds on another sim, copy its module (COMMON.md §6).
- **Learn tree:** the `npm run check` warning "in no leaf yet" is expected; suggest a leaf in your report (catalogue §4.14 has the proposed `film-set` area).

## Overlaps (catalogue §5)

- **§5.25 Film set: five shared models, and links to existing sims:** Five shared models, each built first in its hub sim and copied by the others, like §5.24's: the crew and its chain, departments with their heads, the 1st AD and who passes a message to whom, hop by hop (set-stop-for-safety; set-chain-of-command and set-who-touches-what read the same crew); the floor plan, a location's rooms, doors, exits and walkways with gear and people placed on it and walking paths through it (set-cable-runs-exits; set-exclusion-zone, set-emergency-response and set-working-at-height place their zones and routes on it, set-picture-vehicles adds a vehicle's envelope to the exclusion zone); forces and moments, weights, lever arms, wind load and line tension (set-stand-tipping; set-working-load and set-manual-handling reuse the statics, set-weather-lightning the wind force); the shooting day, scenes, setups, calls, breaks and wrap on one timeline (set-call-sheet; set-continuity reads its shooting order, set-hearing its exposures; set-fatigue-turnaround keeps its own week of calls and wraps in the same day format); the electrical load, lamps, sockets, circuits and phases (set-circuit-load; set-phase-balance adds the three phases, set-lamp-heat uses its lamps). The set pages link the technical ones instead of repeating them: set-radio-discipline ↔ csma-cd (a shared medium with collisions) and hidden-node (the station that cannot hear the channel is busy), and kk-directed-net and kk-priority-traffic once built; set-card-handoff ↔ ransomware-321 (copies kept apart) and restore-drill (a copy counts only when checked); set-risk-controls ↔ cmp-risk-register (likelihood × impact, residual risk); set-emergency-response ↔ cmp-incident-clocks (the clock runs from awareness). The real cases of §4.14 are visible references on single pages (set-stop-for-safety, set-exclusion-zone, set-risk-controls, set-weather-lightning), not part of any shared model: each page keeps the one fictional production.

## Model and presets

_To be filled before building: state, what one step does, rules in order, tie-breaks, params, 3–6 presets with expected outcomes, step count, legend, captions, terms in both languages, misconceptions to target, out of scope._

## Steps

1. `kit/new-sim.sh set-card-handoff sims/set-card-handoff` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/set-card-handoff/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
