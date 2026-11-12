# ari-checking: Is it right? Checking a result

| | |
|---|---|
| Task | `ari-checking` (wave 3, Arithmetic on paper) |
| Catalogue entry | `ari-checking` in `docs/catalogue.md` §4.16 |
| Kind | build a new simulator |
| Folder | `sims/ari-checking/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | ARI |
| Topic / tags / level | `arithmetic` / `column-arithmetic` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `ari-long-division` is merged and reuse its model (COMMON.md §6); uses kit view K5 paper columns once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **the inverse operation checks a result (difference plus the number taken away gives the top number; quotient times divisor plus remainder gives the dividend), and an estimate from rounded numbers catches a result that is off by a place**.

The student: check given results, find the wrong one, estimate before computing.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.16.
5. `sims/ari-long-division/` (the model this one builds on) and its `NOTES.md`.

## Sources

- Croatian primary-school mathematics textbooks for grades 2 to 4 (the layout and the phrasing a child hears, "pišem 7, pamtim 1") and the national curriculum for mathematics (Narodne novine 7/2019); mark every phrasing and layout you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: owner suggestion s-002; after ari-long-division

## Paper arithmetic notes (all `ari-` tasks)

- **Who it is for, three views:** one page serves three audiences through an audience switch in the page header, remembered across the `ari-` pages: **teacher** (the default: projected in class, any numbers typed in, step forward and back, "show a typical mistake" with why it is wrong), **adult** (a parent or someone refreshing it: every step says why it works, the ten ones that became one ten), **child** (grades 2 to 4: big digits, one step per click, the school phrasing, almost no text). The model is the same in all three; only the captions, the amount of text and the digit size change.
- **Any base, 10 by default:** a base control (2 to 16; digits 0 to 9 then A to F) with presets for 2, 8, 10 and 16. The point, from the owner (2026-11-12), is that a base is only a way of writing a number: the same quantity, the same algorithm, other digits; a carry happens when a column reaches the base, not 10. Base 2 links to `arh-twos-complement` and shows multiplication as shift-and-add, which is how a processor multiplies. The child view stays in base 10 (the switch is hidden there).
- **Croatian school layout and words:** the written forms Croatian pupils use (division written as "846 : 3 = 282" with the remainders under the dividend, not the English bracket; the multiplication sign as a centred dot), the words of the lesson (zbrajanje, oduzimanje, množenje, dijeljenje, pribrojnik, umanjenik, umanjitelj, faktor, djeljenik, djelitelj, količnik, ostatak), and the spoken step ("pišem 7, pamtim 1"). Put the English textbook terms in the English strings.
- **Concepts, not tricks:** each page shows why the step works (the place value behind a carry, the shift behind a partial product), never a rule to memorise without it. No calculators, apps or brands.
- **Kit view K5 (paper columns):** `ari-column-addition` is the pilot; it draws the squared-paper columns, the carry row, crossed-out digits and the audience and base switches in its own folder, and the coordinator then moves them into the kit (`kit-paper-columns`). The other `ari-` pages use the kit view.
- **Learn tree:** the `npm run check` warning "in no leaf yet" is expected; catalogue §4.16 has the proposed `arithmetic` area.

## Model and presets

_To be filled before building: state, what one step does, rules in order, tie-breaks, params, 3–6 presets with expected outcomes, step count, legend, captions, terms in both languages, misconceptions to target, out of scope._

## Steps

1. `kit/new-sim.sh ari-checking sims/ari-checking` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ari-checking/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
