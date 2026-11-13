<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-unknown-term: notes

New explorer (task `docs/tasks/w3/ari-unknown-term.md`, catalogue §4.17, wave 3), built on the number line of
`ari-constant-difference` (§5.27). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Two modes in one page**, a switch in the panel: a sentence with one unknown (the default) and an inequality. The
  catalogue row and the curriculum's own content line put them together ("Određivanje vrijednosti nepoznatoga člana
  jednakosti i nejednakosti", B.3.1), so this is one concept, the unknown term, in its two forms.
- **A sentence: three bands.** On top the sentence with the term names as buttons (click one to make it the unknown,
  or U) and the solving steps beside it; in the middle the bar model; below the fact's three readings. The solving
  steps are a counter `show` (0 sentence, 1 the inverse, 2 the value, 3 the check), moved by the stage's Dalje button
  and S, so a class can guess before each step (as `ari-mental-strategies`' jump counter). The kit's stepper keys
  (→, PgDn) are not used, so `sim.json` has no `steps`.
- **One fact, three readings, uniform for all four operations.** The page stores the fact (the parts p, q; the whole w
  is p + q or p · q) and which place of the sentence is unknown; a subtraction is w − q = p and a division w : q = p.
  The unknown is then always found from the reading with it alone, so the four operations and three places share one
  rule (SPEC rules 2–5) and the readings box shows which reading is given and which is used. Each family keeps its
  own numbers, so switching + to − shows the same fact (89 + 691 = 780 ↔ 780 − b = 89).
- **The bar model** (*model trake*): the whole on top, the parts below. Addition parts get at least 15 % of the bar
  each (a part of 0 or of 2 next to 900 still carries its label), the rest in proportion; it is a schematic, not a
  scale. Multiplication is p pieces of q, drawn 3 … 1 when there are more than 12, or when the count is the unknown
  and not yet shown (15 pieces would give f = 15 away by counting). In a division the count is the quotient
  (63 : 7 = 9 is 9 pieces of 7, "koliko puta 7 stane u 63"); the bar is the same for both readings of the fact.
- **The typical mistake** (teacher): the inverse step with the other operation of the pair, "minus is undone by plus"
  (780 − b = 89 → b = 780 + 89 = 869). The check catches it (780 − 869 cannot be computed; 602 − 89 = 513 ≠ 691), and
  then the caption says why from the bar (a part is the whole without the other part) and gives the right step. When
  the result is the unknown there is nothing to undo, so the mistake is disabled with that reason. Under the mistake
  the readings box marks no reading as "računamo" until the check, then the right one.
- **The check is the curriculum's "uvrštava zadani broj umjesto slova" / "provjerava točnost dobivenoga rješenja"**:
  for a sentence the value back in place of the letter; for an inequality each marked number back in place of the
  letter (694 > 694 > 688 ✗), shown when the solutions are revealed.
- **An inequality** is two strict halves (694 > c > 688 is c < 694 and c > 688), drawn on reveal as two rays above the
  number line; where both hold is the stretch between the bounds, hollow rings at the bounds. Every whole number on the
  line is a button that marks it; marks are a bit mask param so the presets and the URL carry them (`ends` marks
  688…694, the typical mistake of counting the bounds). Bounds at most 20 apart, so every number stays clickable; a
  crowded projector line (7-digit numbers) stands its labels upright, and on a phone the line scrolls inside its box.
- **Numbers to a million** (B.4.1's 12 395 < b < 12 402 and 5871 + a = 7820; A.4.1), grouped by spaces from 10 000 on
  as the curriculum writes them (5871, 12 395). No 0 in multiplication and division (x · 0 = 0 holds for every x: the
  task field says so), no remainders (A.3.3 is its own topic).
- **Words**: *jednakost / nejednakost*, *nepoznati član*, *provjera*, never *jednadžba* (B.4.1: "ne upoznaje se
  sustavno linearna jednadžba"). The letter is free (b, s, a, f, c, x …), any letter typed is used.
- **Audiences** (shared switch, `Simdeck.paperColumns.audience`): teacher (task field, mistake), adult (why each step
  works: the reading with the unknown alone; the halves as stretches), child (bigger digits, no term labels in the
  bar or step names, one short caption line, no task field). No K5 paper (§4.17 note).
- **Base 10 only:** the row does not say "any base". **No glossary terms**, as in the sibling `ari-` pages.
- **No panel slider for the solving step**: with it the panel did not fit at 1920×1080 (the stage button and S do it;
  the URL carries `show`).

## The number line model (§5.27)

`numberline.js` is copied unchanged from `sims/ari-constant-difference/numberline.js` @ f2a51d4 with its test block
(the first four tests of `sim.test.js`); this page uses `view` (the inequality's line: ±3 around the bounds, step 1,
slid inside 0…10⁶) and `pos`. When the coordinator promotes it to `models/number-line.js`, the page should include it
from there and drop the copy and its tests.

## Deviations from the task

- Task file "Model and presets" was empty; SPEC.md fills it.
- The curriculum's grade 3 example "Odredi sve troznamenkaste brojeve c" adds "three-digit"; the page leaves that
  extra condition out (all whole numbers between the bounds).
- Inequalities are strict only, both bounds given (the curriculum's examples); ≤ and one-sided ones are out of scope.

## Sources

- The curriculum, Narodne novine 7/2019, fetched and read 2026-11-13 for this task: MAT OŠ B.3.1 (ishod, razrada
  "Uvrštava zadani broj umjesto slova", "Određuje vrijednost nepoznatoga člana jednakosti/nejednakosti", dobar
  "… provjerava točnost dobivenoga rješenja", preporuka with 780 – b = 89 → b = 780 – 89, 694 > c > 688, 94 + s = 136,
  63 : ☐ = 9), B.4.1 (5871 + a = 7820, f · 65 = 975, 12 395 < b < 12 402, "nepoznati se član računa primjenom veze
  među računskim operacijama", no systematic *jednadžba*), A.3.2 ("Imenuje članove računskih operacija", "veza
  zbrajanja i oduzimanja"), A.2.4 (djeljenik, djelitelj, količnik; the fact family 3 · 7 = 21, 21 : 7 = 3), A.4.1
  (numbers to a million), A.3.3 (division with a remainder).
- Croatian textbooks for grades 2–4 were not available offline. From general knowledge of Croatian school practice,
  all *(check)*: "model trake" for the bar model (the curriculum does not name it; Croatian textbooks may only draw
  it); "cijelo" and "dio" as its words; "veza računskih operacija" as the label of the inverse step; "faktor" for the
  factors in grade 3–4 (A.2.4 says "čimbenici", with "faktori" encouraged later; the task asks for faktor); "1. faktor"
  and "2. faktor"; "Jedna činjenica, tri zapisa" as the name of the fact family.
- Examples: 780 − b = 89, 94 + s = 136, 63 : b = 9, 694 > c > 688 (B.3.1), f · 65 = 975, 12 395 < b < 12 402 (B.4.1) are
  the curriculum's; a − 89 = 691 is mine (the same fact as 780 − b = 89 with the minuend unknown).

## Checks

- Numbers: a Python script independent of `sim.js` solved twelve sentences by trying every whole number 0…10 000 (each
  operation, each place of the unknown, the curriculum's examples) and compared the unique solution with the model's
  value and check; it also recomputed the six mistake values (869, 602, 63 375, 567, none for a : 9 = 7, 230), four
  inequalities (solutions and the line ±3) and the bar shares. All agree.
- Tests: 27 (`node --test sims/ari-unknown-term/sim.test.js`), tie-breaks first; a sweep over the four operations, three
  places and five facts checks the value is always the hidden number; the presets read back through the task field.
  56 mutations of `sim.js` (each role table, the readings, the inverse and the swap, the direct tie-break, the check,
  the clamps and their tie-breaks, the shares, the pieces and their hiding, the bounds, the view, strictness, marks
  and toggling, every parse refusal and sign): 55 fail a test; the survivor is equivalent (it appends a comment).
  Three survived the first run and got tests (a difference one below 0, an upper-case letter in an inequality).
- `npm run gate -- ari-unknown-term`: pass (47/47 browser checks). The gate opens the defaults; the other states were
  screenshotted with a separate Playwright script (no page scroll, no sideways scroll on the phone, no text under
  16 px, no console errors): every preset, every solving step, the mistake at each step, a direct sentence with the
  mistake asked, adult and child views, an empty inequality (693, 694), the widest one (100…120) and one at a million
  (999 980…1 000 000, crowded labels), English, the phone. Screenshots reviewed at 1920×1080 (light, dark, grayscale)
  and 375×812 in both languages.

## Term pairs (not in the glossary; written out in both tables)

| en | hr |
|---|---|
| addend, sum | pribrojnik, zbroj |
| minuend, subtrahend, difference | umanjenik, umanjitelj, razlika |
| factor, product | faktor, umnožak |
| dividend, divisor, quotient | djeljenik, djelitelj, količnik |
| unknown term | nepoznati član |
| equality, inequality | jednakost, nejednakost |
| check | provjera |
| bar model | model trake *(check)* |
| whole, part | cijelo, dio *(check)* |
| the inverse operation | veza računskih operacija *(check)* |
| number line | brojevna crta |

## Shared requests

- **Promotion:** `numberline.js` to `models/number-line.js` (from `ari-constant-difference`), then this page includes
  it from there.
- **A number line view in the kit?** This page draws its own line (`lineBox`: axis, ticks, a button per whole number,
  marks, rays for the halves, the stretch, rings at the bounds). With `ari-constant-difference`'s `lineEl` and
  `ari-mental-strategies`' empty line that is three drawings of one model; a kit view would serve all three.
- **A bar model view?** `barBox` (whole over parts, proportional with a floor, equal pieces with 3 … 1 elision) will be
  wanted by word-problem pages in §4.17; it is page code here.
- Still open from the `ari-` siblings: a text param type (the task field is page code); `t.parts` returning one node for
  two placeholders (the page's `tp`); a param type for a set of numbers (the marks are a bit mask in a hidden range).

## Fresh review

A separate reviewer read the folder against SPEC.md, recomputed every rule and preset (all held; no model bug), mutated
the model on a copy, drove the page in hr/en and three audiences at 1920×1080 and 375×812, and read the Croatian. Fixed
from its findings:
- **the child saw the preset's mistake as a plain step**: the child captions now ask ("b = 780 + 89?", "b = 869?"), and
  the mistake control is shown to adults too, so a preset's mistake can be undone there;
- **a wrong operation that gives the right value** (· 1, : 1, + 0, − 0: x · 1 = 7 → 7 · 1 = 7) showed a passing check
  next to a red step and a "right step" line: now a tie-break of rule 6, with its own caption (lucky because of the 1 or
  0) and step 1 not marked wrong; tested;
- **plural agreement**: "3 dijelova", "od 1 jednakih dijelova", "1 puta", "1 parts" → plural forms (`nParts`,
  `nEqParts`, `barTimes`);
- **phone**: a 7-digit inequality wraps instead of being clipped; the piece name is hidden on narrow pieces;
- **tests for unguarded rules**: a mark outside the bounds is wrong (not only the bounds), the last number on the line
  can be marked, values of exactly 10⁶ are accepted (four sentence forms and an inequality), parts are rounded, other
  dashes and dots, leading zeros, "ab" is `form`; all eight of the reviewer's surviving mutants now fail;
- **SPEC**: the unknown `dir`, the check's `frac`, the extra signs and leading zeros, `letters` vs `form`, the legend;
- **wording**: "Granice nisu rješenja", "ne može se podijeliti bez ostatka" (no *prirodni broj*, which comes later),
  no double colon in "89 − 691 ne može se izračunati jer …".
Not changed: the header legend (whole, part, unknown) also shows in the inequality mode, where it does not apply: the
kit's legend is set once at mount; the inequality stage labels its own parts.

## Time

Started 21:41, curriculum read and model checked 21:52, first gate pass 22:00 (after the panel fit), states reviewed
22:03, mutation tests 22:05, fresh review 22:06–22:12, review fixes, gate and states again, done 22:17: about 36 minutes,
one session.
