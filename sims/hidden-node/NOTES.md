<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# hidden-node: notes

Task `docs/tasks/w1/hidden-node.md`, catalogue `urm-hidden-node` ("two stations out of range of each other collide at
the AP"). `origin` is the URM book's `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/skriveni-cvor.html`. The
simdeck copy is canonical from here on.

## Decisions

- **The book's numbers are the first preset.** The fragment's top comment names ch. 17, **Primjer 1** ("skriveni čvor u
  velikoj učionici"): A and C both hear the access point B, which stands between them, not each other; both send data
  to B. The book gives no timings, so the first preset (`book`, "Primjer iz knjige", the fragment's locked button name)
  is that layout with RTS/CTS off, as the fragment's button sets it.
- **From a 3–4-step slideshow to a slotted model.** The fragment has two fixed step lists (3 steps without RTS/CTS,
  4 with). The kit needs one step count, and a model whose rules can be tested, so the page is a stepper of 16 slots
  with the rules in `sim.js` (top comment): RTS, CTS and ACK one slot, DATA three; a reply starts at once (SIFS), a new
  attempt only after one quiet slot (DIFS); a frame is intact only if its listener heard it alone in every slot; an
  overheard intact RTS/CTS sets NAV through the exchange's ACK; a missing CTS/ACK is a timeout and a retry after a wait.
  The fragment's sentences survive as captions: "A počinje slati…", "C ne čuje A…", "Sudar na B…", "B odgovara
  CTS-om…", "C upisuje trajanje iz CTS-a u vlastiti NAV…", "Nema sudara".
- **C has its frame from slot 3, while A is still sending.** The fragment shows A starting first and C starting during
  A's transmission ("Istovremeno, C počinje slati… ne zna da medij baš sad nije slobodan"); the book's "obje odjednom"
  is read the same way. With both ready in the same slot, RTS frames would collide too, which is a second story (a
  test covers the rule with a crafted state; no preset shows it).
- **The fixed waits** (A: 1 then 3 slots, C: 1 then 5) replace the random backoff the book names ("nakon slučajnog
  čekanja"), so every run is the same. They are chosen so the book's preset shows what the book says may happen
  ("s mogućnošću da se sudar ponovi"): a second collision, then A gets through on its third attempt in slot 16 while C
  still waits. The explanation says the waits are fixed here and random in reality.
- **Params:** `rts` (the fragment's RTS/CTS select, now a toggle) and `hear` ("A i C se čuju"), which adds the
  comparison that shows the concept: with the stations in range of each other, carrier sense alone avoids the
  collision. Both keep the current step when changed.
- **Exercises (`ia-zadatak`) became preset hints, without their answers:**
  - exercise 1 (RTS/CTS off: why do neither A nor C notice the collision?) → `book`;
  - exercise 2 (RTS/CTS on: how does C learn to wait when it never heard A?) → `rts`;
  - exercise 3 (is RTS/CTS required for every transmission?) → `hear-rts`, with "how many slots does delivering both
    frames take now?" (the cost of RTS/CTS when it is not needed);
  - `hear` (new): "what does C hear in slot 2 now, and why is there no collision?".
- **The "why" box** ("Zašto C uopće nešto poduzima kad ne čuje A") is the explanation's third paragraph, nearly word for
  word; the others are the hidden node (ch. 17 text), why the senders do not notice (Primjer 1's solution, in general
  words), optional RTS/CTS with RTS_Threshold (ch. 17 and exercise 3's answer, in general words), and the
  simplification. The exercises' answers do not appear as answers on the page.
- **The original's text version (`<details>`) is gone:** the caption is the kit's live region.
- **Stage:** A — B — C with "u dometu" links and the A–C range (dashed and red "izvan dometa", or solid "u dometu");
  each station's state under it and the frame it sends now; then a 16-slot timeline with rows A, B, C and "Na B" (what
  B hears: the sender, ✕ for a collision, – while B itself sends); then facts (delivered and when, slots with a
  collision at B, frames lost).
- **Colour is not the only carrier:** A's frames solid, C's solid and hatched, B's replies round and tinted; collision =
  red frame, cross-hatch and ✕; NAV = dotted border and the word NAV; every frame cell carries its name. Checked in the
  grayscale screenshot.
- **Term rule:** the glossary has none of these terms, so `strings.js` writes them out and the page does not load
  `glossary.js`. *access point* stays English in italics on Croatian pages, as in the book.
- The model (`hears`, `navUntil`, `backoff`, `step`) is pure and promotable to `models/` for the catalogue's
  `net-csma-ca-rts-cts` ("extends `urm-hidden-node`").

## Sources

- The fragment (sentences, steps, exercises, the "why" box) and `output/interaktivno/static/komponente.js`
  (`IA.Koraci`, `IA.gumbPrimjer`, `IA.Zadatak`); `scripts/check-web.py` (locked button names).
- URM book ch. 17 (`book/chapters/17-bezicne-mreze.md`): "Dijeljeni medij" (CSMA/CA, the hidden node, RTS/CTS, NAV,
  RTS_Threshold, ACK and retransmission after a random wait, with the IEEE P802.11-96/49C quotes), and Primjer 1.
- Figure `assets/diagrams/ch17-skriveni-cvor-rts-cts.svg` (not copied; the stage follows its topology and its two
  timelines).
- Every number in `sim.test.js` is the book's layout or computed from the model's stated slot lengths and waits.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| hidden node | skriveni čvor (ch. 17) |
| station | stanica (ch. 17) |
| access point | *access point* (ch. 17 keeps the English term) |
| collision | sudar (ch. 17; ch. 7 also kolizija) |
| acknowledgment (ACK) | potvrda primitka (ACK) (ch. 17) |
| duration field | polje trajanja (ch. 17) |
| NAV (Network Allocation Vector) | NAV, virtualni osjetnik zauzeća medija (ch. 17) |
| random backoff | slučajno čekanje (ch. 17) |
| slot | odsječak — simdeck's, the book has no term *(check)* |
| medium | medij (ch. 17) |

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`. Note the glossary's *frame* = okvir comes from
  ossimulator (memory frame); the network sense is the same word in the book.

## Checks not done here

- A real projector and a lecturer with a clicker.
- A fresh reviewer reading the diff against these rules (COMMON.md §8; the rules are in `sim.js` and here, there is
  no `SPEC.md`). The rules were broken on purpose: NAV `>=` → `>`, NAV one slot short, "sending in the slot before is
  not idle" dropped: each fails tests. Three mutations survive because they are equivalent in every reachable state
  (`heard.length !== 1` vs `> 1`, `!sends.B` in the collision test, `!sends[x]` in the NAV cell flag).
- Freezing the original is outside simdeck (OPEN.md, "one home for networking interactives").

## Time

Start 2026-10-02 21:28, done 21:45 (about 17 minutes, one session).
