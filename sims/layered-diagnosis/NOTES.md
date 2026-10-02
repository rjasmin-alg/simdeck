<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# layered-diagnosis: notes

Task `docs/tasks/w1/layered-diagnosis.md`, catalogue `urm-layered-diagnosis` ("bottom-up, top-down,
divide-and-conquer"). `origin` is the URM book's
`uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/dijagnostika-po-slojevima.html`. The simdeck copy is canonical
from here on.

## Decisions

- **The book's numbers are the first preset.** The fragment's top comment names ch. 15, "Metodika rješavanja problema
  po slojevima", and **Primjer 8** ("odabir metode": a user cannot open an internal web application). The fragment's
  locked example button sets divide and conquer with a passed first test. The first preset (`book`) is that case with
  the fault in the application layer (7): divide and conquer needs **5** checks (the test, then 4, 5, 6, 7: the
  fragment's exercise 1), bottom-up 7 ("would start checking cables and signal first"). The second preset (`down`,
  fault in layer 1) gives the fragment's exercise 2: the test fails, then data link and physical, **3** checks.
- **From one approach at a time to three side by side.** The fragment shows one approach (a select) and, for divide
  and conquer, a second select for the first test's outcome, as a list of steps that walks every remaining layer. Here
  the page has one param, the **faulty layer** (1–7), and the three approaches run side by side on it, one check per
  step, each stopping when it has found the fault (COMMON.md §11: run every variant to its own end and show each
  outcome). The test's outcome follows from the faulty layer (it fails exactly when the fault is in layers 1–3), so
  the fragment's outcome select is gone. The stage follows the book's figure `ch15-metodika-po-slojevima.svg`: three
  copies of the seven-layer stack with the check order numbered on each layer.
- **Rules** (top of `sim.js`): a check of one layer reveals only a fault in that layer; the reachability test at the
  network layer works only when layers 1–3 all work; after a failed test, data link then physical are checked, and when
  both work the fault is in the network layer by elimination (the book: "problem je u mrežnom sloju ili niže", then
  "ARP, pa fizičku vezu"). Every check costs the same. `steps` = 7, the longest any approach takes. The explanation
  states the simplification.
- **"Usually" made visible:** when all three have finished, the stage shows the average over the seven possible faulty
  layers (bottom-up 4, top-down 4, divide and conquer 22/7 ≈ 3.1), and the explanation says top-down wins on an
  application fault. This is the book's "obično brže", not a second concept.
- **Concepts, not tools:** the fragment's `ping` and `traceroute` are commands; the page says "test dostupnosti" /
  "reachability test" and the explanation names the mechanism, ICMP *echo*. Primjer 8 names `ping`; this is a deliberate
  deviation for the memory rule (concepts-not-tools). *(check: the owner may prefer "ping", which ch. 11 teaches)*
- **Exercises (`ia-zadatak`) became preset hints, without their answers:** exercise 1 → `book`, exercise 2 → `down`,
  exercise 3 (why pure bottom-up spends more effort) → `transport` (fault 4: bottom-up and top-down 4, divide and
  conquer 2); `network` (fault 3, new) asks how divide and conquer concludes it is the network layer (elimination).
- **The "why" box** ("Zašto podjela napola obično isključi uzroke brže") is the explanation's third paragraph, nearly
  word for word; the others are the chapter's text on systematic order and on bottom-up/top-down, and the "usually,
  not always" paragraph with the simplification. The fragment's text version (`<details>`) is gone: the caption is the
  kit's live region.
- **Colour is not the only carrier:** works = ✓ and the word; fault = ✗, the word, double border and cross-hatch;
  failed test = ✗ and dashed border; excluded = hatch, dashed border and the word; check order = the number in a
  badge (dotted while only planned). Checked in the grayscale screenshot.
- **Croatian case forms:** `layerN` (nominative) and `layerNL` (locative), `count` ("1 provjera") and `checks` (after
  "nakon": "1 provjere").
- No `SPEC.md`: an adoption; the rules are at the top of `sim.js` and here.

## Sources

- The fragment (sentences, three orders, the example button, three exercises, the "why" box) and
  `output/interaktivno/static/komponente.js` (`IA.Koraci`, `IA.gumbPrimjer`, `IA.Zadatak`); `scripts/check-web.py`.
- URM book ch. 15 (`book/chapters/15-analiza-prometa.md`): "Metodika rješavanja problema po slojevima" (with the
  chapter's Ranjbar citations) and Primjer 8; question 17. Layer names from ch. 4 (`04-slojeviti-modeli.md`).
- Figure `assets/diagrams/ch15-metodika-po-slojevima.svg` (not copied; the stage follows its three stacks and order
  numbers).
- Every number in `sim.test.js` comes from the book (5 and 3 checks) or from the stated rules.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| layer-by-layer diagnosis / troubleshooting | dijagnostika po slojevima (ch. 15) |
| bottom-up | odozdo prema gore (ch. 15) |
| top-down | odozgo prema dolje (ch. 15) |
| divide and conquer | podjela napola (ch. 15) |
| reachability test | test dostupnosti — simdeck's, the book says "test" / `ping` *(check)* |
| physical / data link / network / transport / session / presentation / application layer | fizički / podatkovni / mrežni / transportni / sjednički / prezentacijski / aplikacijski sloj (ch. 4) |

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.

## Checks not done here

- A real projector and a lecturer with a clicker.
- A fresh reviewer reading the diff against the rules (COMMON.md §8). The rules were broken on purpose instead: test
  `>` → `>=`, elimination on the wrong layer, downward branch going up, a failed test counted as found, a finished
  approach not stopping, `checksFor` for faults below the network layer: each fails tests.
- Freezing the original is outside simdeck (OPEN.md, "one home for networking interactives").

## Time

Start 2026-10-02 23:30, done 23:58 (about 30 minutes, one session).
