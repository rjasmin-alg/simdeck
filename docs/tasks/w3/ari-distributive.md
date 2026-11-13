# ari-distributive: Multiplying a sum: split the array

| | |
|---|---|
| Task | `ari-distributive` (wave 3, Primary-school mathematics, grades 3 and 4) |
| Catalogue entry | `ari-distributive` in `docs/catalogue.md` §4.17 |
| Kind | build a new simulator |
| Folder | `sims/ari-distributive/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | ARI |
| Topic / tags / level | `arithmetic` / `mental-arithmetic` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **4 · 23 is an array of 4 rows of 23 dots; a cut after 20 splits it into 4 · 20 and 4 · 3, so 4 · 23 = 80 + 12 = 92: multiplying a sum multiplies each addend (distributivity); dividing a sum works the same way when each part divides (84 : 4 = 80 : 4 + 4 : 4); written multiplication by a one-digit number is this split done place by place**.

The student: drag the cut through the array, compare the two parts with the whole, switch to dividing a sum, see the link to the written form.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.17.

## Sources

- The national curriculum for mathematics, Narodne novine 7/2019 (https://narodne-novine.nn.hr/clanci/sluzbeni/2019_01_7_146.html): the outcomes this entry names, their razrada, sadržaj and preporuka; it says what grades 3 and 4 do and do not use.
- Croatian primary-school mathematics textbooks for grades 2 to 4 (the layout and the phrasing a child hears, "pišem 7, pamtim 1") and the national curriculum for mathematics (Narodne novine 7/2019); mark every phrasing and layout you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: MAT OŠ A.3.4 (množenje i dijeljenje zbroja brojem), A.4.4 (distributivnost); leads into ari-column-multiplication

## Paper arithmetic notes (all `ari-` tasks)

- **Who it is for, three views:** one page serves three audiences through an audience switch in the page header, remembered across the `ari-` pages: **teacher** (the default: projected in class, any numbers typed in, step forward and back, "show a typical mistake" with why it is wrong), **adult** (a parent or someone refreshing it: every step says why it works, the ten ones that became one ten), **child** (grades 2 to 4: big digits, one step per click, the school phrasing, almost no text). The model is the same in all three; only the captions, the amount of text and the digit size change.
- **Any base, 10 by default:** a base control (2 to 16; digits 0 to 9 then A to F) with presets for 2, 8, 10 and 16. The point, from the owner (2026-11-12), is that a base is only a way of writing a number: the same quantity, the same algorithm, other digits; a carry happens when a column reaches the base, not 10. Base 2 links to `arh-twos-complement` and shows multiplication as shift-and-add, which is how a processor multiplies. The child view stays in base 10 (the switch is hidden there).
- **Croatian school layout and words:** the written forms Croatian pupils use (division written as "846 : 3 = 282" with the remainders under the dividend, not the English bracket; the multiplication sign as a centred dot), the words of the lesson (zbrajanje, oduzimanje, množenje, dijeljenje, pribrojnik, umanjenik, umanjitelj, faktor, djeljenik, djelitelj, količnik, ostatak), and the spoken step ("pišem 7, pamtim 1"). Put the English textbook terms in the English strings.
- **Concepts, not tricks:** each page shows why the step works (the place value behind a carry, the shift behind a partial product), never a rule to memorise without it. No calculators, apps or brands.
- **Kit view K5 (paper columns):** `ari-column-addition` is the pilot; it draws the squared-paper columns, the carry row, crossed-out digits and the audience and base switches in its own folder, and the coordinator then moves them into the kit (`kit-paper-columns`). The other `ari-` pages use the kit view.
- **Learn tree:** the `npm run check` warning "in no leaf yet" is expected; catalogue §4.16 has the proposed `arithmetic` area.

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

1. `kit/new-sim.sh ari-distributive sims/ari-distributive` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ari-distributive/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
