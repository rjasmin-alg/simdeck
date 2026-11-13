# geo-units: Units of length, mass and volume

| | |
|---|---|
| Task | `geo-units` (wave 3, Primary-school mathematics, grades 3 and 4) |
| Catalogue entry | `geo-units` in `docs/catalogue.md` §4.17 |
| Kind | build a new simulator |
| Folder | `sims/geo-units/` |
| Class | explorer |
| Size | M |
| Priority | P2 |
| Courses | ARI |
| Topic / tags / level | `arithmetic` / `measurement` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `ari-times-ten` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **a unit is an agreed amount and measuring counts how many fit; 1 cm = 10 mm, 1 dm = 10 cm, 1 m = 10 dm, 1 km = 1000 m; 1 dag = 10 g, 1 kg = 100 dag, 1 t = 1000 kg; 1 l = 10 dl; a smaller unit gives a bigger number for the same length; converting moves the digits in a table of units (3 m 4 dm = 34 dm)**.

The student: zoom a ruler from a kilometre down to a millimetre, weigh things on a balance with weights, convert by sliding digits in the unit table, estimate first.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.17.
5. `sims/ari-times-ten/` (the model this one builds on) and its `NOTES.md`.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019 (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html): the outcomes this entry names, their razrada, sadržaj and preporuka; it says what grades 3 and 4 do and do not use.
- Croatian primary-school mathematics textbooks for grades 2 to 4 (the layout and the phrasing a child hears, "pišem 7, pamtim 1") and the national curriculum for mathematics (Narodne novine 7/2019); mark every phrasing and layout you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: MAT OŠ D.3.1, D.3.2, D.4.1; after ari-times-ten

## Grades 3 and 4 notes (catalogue §4.17; these override the paper arithmetic notes where they differ)

- **From the curriculum:** owner request 2026-11-13, "everything in grades 3 and 4 where a sim makes sense". The row names the outcomes (MAT OŠ A.3.2 …); read their razrada, sadržaj and preporuka in Narodne novine 7/2019 before the SPEC, and use the curriculum's own examples as presets where it gives them. Keep out what it leaves to later grades: no fraction notation ("ne spominje se pojam razlomka"), no degrees for angles, no formulas for perimeter or area (o and P are counted and written as o = 12 cm, P = 8 cm²).
- **Who it is for:** the same three audiences as the paper arithmetic pages, through the same switch: load `../../kit/papercolumns.js` after kit.js and call `Simdeck.paperColumns.audience(…)` (docs/sim-ui.md §14) with the default key, so one choice holds across the whole area; teacher is the default. The child view is a grade 3 pupil: big, few words, one thing per click.
- **Base:** base 10 only, unless the row says "any base"; then the base control of the paper arithmetic notes.
- **The look:** squared paper and the school's instruments (ruler, set square, compass, a clock face, a balance, vessels) drawn plainly in SVG, not photographs and not cartoons; the kit's colours. Kit view K5 only where the row or §5.27 says so (`ari-times-ten`, `ari-big-numbers`); the paper arithmetic note that the other `ari-` pages use K5 does not apply to these.
- **Shared models (catalogue §5.27):** the number line (hub `ari-constant-difference`) and squared-paper geometry (hub `geo-lines`) are pure modules in the hub's folder; the pages that build on a hub copy its module (COMMON.md §6).
- **Croatian terms first:** the words of the lesson (umanjenik, umanjitelj, razlika, nepoznati član, pravac, polupravac, dužina, sjecište, usporedni, okomiti, kružnica, krug, polumjer, središte, kut, vrh, krakovi, šiljasti, pravi, tupi, jednakostranični, jednakokračni, raznostranični, pravokutni, opseg, površina, brid, vrh, strana, redak, stupac, piktogram, stupčasti dijagram, siguran, moguć, nemoguć događaj); the English textbook terms in the English strings. Mark a term you could not confirm with *(check)*.
- **Randomness** (`dat-dice-sums`): the model takes a seeded generator, so tests and screenshots are repeatable; the page seeds from the clock unless `?seed=` is given.
- **Learn tree:** catalogue §4.17 has the leaves; the `npm run check` warning "in no leaf yet" is expected.

## Model and presets

_To be filled before building: state, what one step does, rules in order, tie-breaks, params, 3–6 presets with expected outcomes, step count, legend, captions, terms in both languages, misconceptions to target, out of scope._

## Steps

1. `kit/new-sim.sh geo-units sims/geo-units` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/geo-units/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
