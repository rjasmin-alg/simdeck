<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# vlsm: notes

Adopted from the URM book's web edition, `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vlsm.html` (task
`docs/tasks/w1/vlsm.md`, catalogue `urm-vlsm`). The fragment used the book's `IA.Klizac` (six sliders), `IA.gumbPrimjer`
and `IA.Zadatak` (`output/interaktivno/static/komponente.js`) and the book's CSS; it had no `IA.Koraci`. The simdeck copy
is canonical from here on.

## Decisions

- **Class `stepper`, 9 steps.** The original was a live explorer (move a slider, the bar redraws). The book's chapter 9
  gives the procedure as numbered steps ("Izrada adresne sheme", steps 1–4; Primjer 1, Korak 1 and 2), so the steps
  follow it: 0 the needs, 1 the smallest block per unit, 2 the order, 3–8 one block placed per step, 9 the result
  (used, holes, reserve). The six sliders are kit params; a change recomputes every number at the current step, so the
  original's "move a slider and watch" still works (at step 9 everything is visible).
- **Book's numbers first:** the defaults and preset 1 (`book`, "Primjer iz knjige", the fragment's own button name) are
  Primjer 1 of ch. 9 (Grafo d.o.o., 192.168.1.0/24: Prodaja 60, Proizvodnja 28, Uprava 12, Podružnica 10, Gosti 6,
  veza R1–R2 2) → /26 /27 /28 /28 /29 /30 at .0, .64, .96, .112, .128, .136; 140 used, 116 reserve. The fragment's top
  comment names Primjer 1 and 2; both are presets and tests.
- **A second param, the allocation scheme** (`largest` / `smallest` / `fixed`), so the fragment's "why" box and its
  exercise 1 can be shown rather than told:
  - `smallest` is the chapter's own paragraph on the wrong order (link .0–.3, guests .8, branch .16–.31, management
    .32–.47, production .64, sales .128; 52 addresses in three holes, 64 left at the end). Smallest first is defined as
    the exact reverse of largest first, which is what puts the branch before management as the book does.
  - `fixed` is Primjer 2: one /26 for all six, 6 × 64 = 384 > 256, so guests and the link do not fit; the result line
    and caption give VLSM's 140 next to it.
  This is still one concept (sizing and placing VLSM blocks); the scheme only varies the order and the mask rule.
- **Exercises (`ia-zadatak`) became presets**, opened at step 0 so the class predicts before stepping; the question is
  the preset's hint, the answer is what the steps show (the revealed answers are not on the page):
  exercise 1 → `fixed` ("Primjer 2: ista maska za sve"), exercise 2 → `sales-100` (Prodaja 100 → /25, still first,
  the rest shift by 64; 52 left). Two more: `smallest` (the chapter's text) and `full` (Prodaja and Proizvodnja 100 each:
  two /25 fill the /24 and four units do not fit; the original's overflow message, now per block). End-of-chapter
  questions (8, 10, 11) are not presets: they are the students' homework.
- **Rules and tie-breaks** (all in `sim.js`, tested):
  - prefix: the largest n ≤ 30 with 2^(32 − n) − 2 ≥ hosts (ch. 9, step 2). /31 (Primjer 3, RFC 3021) is not used, as in
    the original; the explanation mentions it.
  - order: by block size, largest first; **equal blocks keep the list order** (Uprava before Podružnica, both /28).
    Smallest first is the reverse of that. One fixed mask: list order (all blocks equal).
  - placement: the next start that is a multiple of the block's size, never before the end of the previous block
    (cursor model, as in the book and the original). **A block that does not fit is left out and the cursor stays**, so
    a later, smaller block may still fit (the original only reported the total overflow). Holes are never back-filled:
    that is the book's point about order.
- **The "what happened" box is the caption, the "why" box is the explanation**, and the `<details>` text version is
  gone: the table is real HTML with every number, and the caption is the kit's live region.
- **Unit names** are strings (hr from the book, en written here: Sales, Production, Management, Branch office, Guests,
  Link R1–R2); "Grafo d.o.o." is "Grafo Ltd" in English.
- **Host sliders show the number only** and sit on one row (name, slider, number) via page CSS on the kit's control
  markup, so six sliders, the scheme choice and five presets fit the panel at 1920×1080 without scrolling. The table's
  "hostova" column carries the unit. Range 1–100 as in the original.
- **Colour is not the only carrier:** each unit's colour goes with its order number (badge in the table, number in the
  bar), holes are hatched and labelled, the free part is dashed and labelled, the block of the current step gets the
  highlighter plus the kit's outline in both bar and table, "ne stane" is a dashed box in words.
- The arithmetic (`prefixFor`, `blockSize`, `usable`, `mask`, `order`, `allocate`) is pure functions over numbers and
  arrays with no strings, ready for `models/` when `win-ipam-address-plan` (catalogue §5.21) reuses it. `mask` and
  `format` duplicate two helpers of `sims/subnet-mask/sim.js`; they were written again here, not copied, and a shared
  IPv4 model would hold both.

## Sources

- The fragment (structure, sentences, exercises, the "why" box) and `komponente.js` (what each component did).
- URM book ch. 9 (`book/chapters/09-podmrezavanje.md`): the introduction (Grafo d.o.o.), "VLSM: različita veličina
  svake podmreže", "Izrada adresne sheme" (steps 1–4, the alignment paragraph, the smallest-first paragraph with its
  numbers), Primjer 1, 2 and 3. Figures `ch09-vlsm-podjela-24.svg` and `ch09-najvece-prvo.svg` (the bar and the holes).
  Every number in `sim.test.js` is checked against those passages.
- `scripts/check-web.py` (the §7a order and locked button names): "Primjer iz knjige" kept as preset 1.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| VLSM (Variable Length Subnet Mask) | VLSM, maska promjenjive duljine |
| subnet | podmreža |
| block (of addresses) | blok |
| alignment | poravnanje |
| addressing plan | adresna shema |
| network address / broadcast address | mrežna adresa / *broadcast* adresa |
| reserve for growth | rezerva za rast |

**Glossary conflict** (already raised by `subnet-mask`): *host* = domaćin in the glossary (UL book), but the URM book
keeps *host* in English. This page follows the URM book.

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **kit (optional): a compact one-row range layout** (`compact: true` on a range spec) so pages with many sliders do not
  restyle the kit's control markup from page CSS as this one does (`.sd-ctl:has(> .sd-range)` grid).
- **models/:** promote the allocation arithmetic together with `subnet-mask`'s IPv4 helpers as one IPv4 model when
  `win-ipam-address-plan` starts.

## Checks not done here

- A real projector and a lecturer with a clicker.
- No fresh reviewer read the diff (COMMON §8 asks it of new sims; this is an adoption).
- One mutation survives by design: holes of one address cannot occur (every block is a multiple of 4), so `at > pos`
  and `at > pos + 1` give the same holes.
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has
  "one home for networking interactives".

## Time

Start 2026-10-02 02:43, done 02:55 (about 12 minutes, one session).
