<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# routing-table: notes

Adopted from the URM book's web edition, `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/tablica-usmjeravanja.html`
(task `docs/tasks/w1/routing-table.md`, catalogue `urm-routing-table`). The fragment used the book's
`IA.UnosAdrese`, `IA.gumbPrimjer` and `IA.Zadatak` (`output/interaktivno/static/komponente.js`) and the book's CSS.
The simdeck copy is canonical from here on.

## Decisions

- **Class `stepper`, 5 steps.** The fragment was a live lookup (type an address, the table lights up). It had no
  slider and no `IA.Koraci`, although the task file says it did. The steps make the router's work visible: 0 the
  table and the packet, 1–4 one entry checked per step in table order (its compared bits filled, the first differing
  bit marked, "da"/"ne"), 5 the longest match chosen and the next hop named. Changing the destination or the order
  recomputes at the same step.
- **Book's numbers first:** the default and preset 1 (`book`, "Primjer iz knjige", the button name `check-web.py`
  locks) are R2's table and 10.1.2.55, from URM ch. 11, Primjer 2 ("kad se u tablici podudara više puteva"), which
  the fragment's top comment names: 10.0.0.0/8 via R3, 10.1.0.0/16 via R4, 10.1.2.0/24 via R5, 0.0.0.0/0 via R6.
  10.1.2.55 matches all four and /24 wins, via R5; 172.16.5.5 matches only the default route, via R6 (the book's
  second case in the same Primjer). Both are tested.
- **"What happened" box → caption; "why" box → explanation** (with the chapter's 256 vs. sixteen million sentence).
  The fragment's `<details>` text version is not needed: the caption is the kit's live region.
- **Exercises (`ia-zadatak`) → presets**, opened at step 0 so the class predicts first; the question is the hint,
  the revealed answers are not on the page (the steps show them):
  - exercise 1 → `book` (does 10.1.2.55 match all four?);
  - exercise 2 → `default-route` (172.16.5.5);
  - exercise 3 → `slash-8` (10.5.0.1: /8 and /0 match, /8 wins).
  Added by simdeck: `slash-16` (10.1.3.7, misses /24 at its last bit, so /16 wins via R4; with it every specific
  entry wins for one offered destination) and `reversed` (the same table, default route first). The fragment's
  "why" box argues "not the first, not the last"; the reversed order shows it: the first match is then
  0.0.0.0/0, and /24 still wins. The step-5 caption names the first match whenever it is not the winner.
- **No free-text address input.** The kit has no text param (as in `subnet-mask`), so the destination is a choice of
  the four addresses above. The fragment's own invalid-input message is gone with the field.
- **The book's figure** (`ch11-najdulji-prefiks.svg`, "duljina prefiksa nacrtana je kao duljina") is drawn, not
  copied: each entry's compared bits stand under the destination's bits, so the prefix length is a length. /0 has no
  bits and says so in words.
- **Colour is not the only carrier:** equal bits are filled (`--c1`), uncompared bits are dashed and hollow, the
  first differing bit has the highlighter plus the kit's outline, results carry ✓/✗ and "da"/"ne", the winner has a
  thick ink frame and the word "pobjeđuje", the first match a dashed "prvi u tablici" tag. Checked in grayscale.
- **Tie-break** (not in the book): two matching entries of equal length must be the same network, so only a
  duplicated entry ties; the earlier one wins. The table on the page has none; `lookup` is tested with one.
- **No match** (a table without a default route): `lookup` returns winner −1. Not offered on the page: R2's table
  always has its default route, and "the router drops the packet" would be a second concept.
- **Hops are router names** (R3…R6, data, `translate="no"`); "preko {r}" / "via {r}" is the string.
- The lookup (`match`, `firstDiff`, `lookup`) is pure over plain data, ready for `models/`.
- **Phone:** 32 bits on a 375 px line are unreadable, so the phone layout breaks every address into two lines of
  16 bits.

## Sources

- The fragment (structure, sentences, exercises) and `komponente.js` (what each component did).
- URM ch. 11 (`book/chapters/11-usmjeravanje.md`): the table and Primjer 2, the default route section (prefix of
  length zero matches everything) and the longest-prefix paragraph citing RFC 1812 §2.2.5.2. Every number in
  `sim.test.js` is checked against them; the bit positions (172 vs. 10 at bit 1, 10.5 vs. 10.1 at bit 14, 10.1.3 vs.
  10.1.2 at bit 24) are worked out from the binary.
- `scripts/check-web.py` (§7a order, locked button name "Primjer iz knjige").

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| router | usmjernik |
| routing table | tablica usmjeravanja |
| (table) entry | zapis |
| next hop | sljedeći skok |
| longest prefix match | najdulji podudarajući prefiks |
| default route | zadani put |

**Glossary conflict:** the glossary has *default route* = "zadana ruta" (`src: uvod-u-linux`); the URM book says
"zadani put". This page follows the URM book and does not use `[[default route]]`. Worth an OPEN.md line next to the
other glossary conflicts.

## Shared requests

- **models/: an IPv4 model.** `parse`, `format`, `bits`, `mask` are copied from `sims/subnet-mask/sim.js @ ff94f8f`
  (marked in `sim.js`). The coordinator can promote them (with subnet-mask's tests) and point both sims at it;
  `match`/`firstDiff`/`lookup` could go with them for `lnx-routing-decision`, whose catalogue entry names this sim
  for longest-prefix match.
- **Glossary:** add the pairs above with `"src": "simdeck"`, and decide *default route*.

## Checks not done here

- A real projector and a lecturer with a clicker.
- One mutation survives by design: dropping the `>>> 0` in `match` changes nothing, since both sides go signed the
  same way and equality holds. Every other rule (longest wins, tie keeps the earlier, /0 mask, compare only inside
  the prefix) was broken once and failed its tests.
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has
  "one home for networking interactives".

## Time

Start 2026-10-02 03:19, done 03:30 (about 12 minutes, one session).
