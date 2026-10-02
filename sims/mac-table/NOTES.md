<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# mac-table: notes

Adopted from the URM book's web edition, `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/tablica-mac-adresa.html`
(task `docs/tasks/w1/mac-table.md`, catalogue `urm-mac-table`). The fragment used the book's `IA.Koraci` (steps, auto
1500 ms), `IA.TablicaKojaSePuni` (the table that fills), `IA.gumbPrimjer`, `IA.Zadatak` and `IA.stanjeUURL`
(`output/interaktivno/static/komponente.js`) and the book's CSS; it had no `IA.Klizac`. The simdeck copy is canonical
from here on.

## Decisions

- **Class `stepper`, 6 steps: three frames, two steps each.** The original built a 2- or 4-step list per exchange
  (send; flood or forward; reply; learn), and its table carried over between exchanges, so the step count changed with
  the state. The kit needs a fixed count, so one demo is one conversation of three frames: the sender to the receiver,
  the reply, and the sender once more. Each frame takes two steps, as the book's paragraph splits it ("dogode se dvije
  stvari odjednom"): it **arrives** and the switch writes its source; then the switch **looks up** the destination and
  forwards or floods. The third frame shows the book's "Sljedeći put … nijedan se okvir više ne preplavljuje", which
  the original only said in its caption.
- **Book's numbers first:** the defaults and preset 1 (`book`, "Primjer iz knjige", the fragment's own button name) are
  ch. 7, Primjer 2: A on 1, B on 2, C on 3; the table knows only C on 3; A sends to B → flooded to ports 2 and 3, so C
  sees it although the switch knows where C is. The fragment's top comment names Primjer 2.
- **Params replace the original's two selects and its "table already knows" state:**
  - `pair`, one select of the six ordered pairs ("A šalje B-u" …), instead of two selects for sender and receiver. The
    original moved the other select when both were the same host; one select of pairs has no invalid state at all.
  - `knowA`, `knowB`, `knowC`: which hosts the table knows before the first frame (time "ranije"). The original reached
    that state only by running earlier exchanges or through the book button; Primjer 2 needs `knowC`.
- **Exercises (`ia-zadatak`) became presets**, opened at step 0 so the class predicts before stepping; the question is
  the preset's hint, the answer is what the steps show (the revealed answers are not on the page):
  exercise 1 → `book`; exercise 2 → `reply` ("B šalje C-u", empty table: flooded, then the reply is not); exercise 3
  ("why the source and not the destination?") → `source` (A already known, A sends to B: A's row is only refreshed and
  the frame still floods, because what the switch knows about the sender says nothing about the receiver). One more,
  `learn` ("Prazna tablica"), is the chapter's own paragraph and its figure `ch07-preklopnik-samoucenje.svg` (empty
  table, A to B, B replies). End-of-chapter questions (6, 7, 8) are not presets: they are the students' homework.
- **The table has the book's three columns:** address, port and time ("tri podatka", ch. 7). The original showed only
  two. Time is shown as the frame that wrote the row ("okvir 2"), and "ranije" for rows that were there before the
  demo, which makes the refresh of an existing row visible.
- **Rules and tie-breaks** (all in `sim.js`, tested, each test seen failing once by breaking the rule):
  - learn: every arriving frame writes its **source** with the incoming port and the time; the destination is never
    written by the frame going to it.
  - **tie-break: an address already in the table is updated in place** (port and time), never a second row; a new
    address goes to the end, so rows keep the order they were learned in (as `TablicaKojaSePuni` appended).
  - decide: the destination's row alone decides. Known → forward to that one port; unknown → flood to every port
    except the incoming one, in port order. Rows of other hosts change nothing (Primjer 2's point).
  - learn comes before decide within a frame, so the decision sees the sender's fresh row (it never matters for the
    decision, since a host never sends to itself).
  - Not modelled, by the one-concept rule: broadcast frames (question 8 and `net-mac-flooding`'s territory), aging
    (300 s, in the explanation only), hosts that move (the `learn` function handles a new port, and a test covers it,
    but the page's hosts stay put), and filtering a frame whose destination is on its incoming port.
- **The "what happened" box is the caption, the "why" box is the explanation** (with the chapter's aging sentence
  added), and the `<details>` text version is gone: the table is real HTML and the caption is the kit's live region.
- **"MAC adresa" is the host's letter**, as in the fragment and the book at this point (the fragment's comment says
  so): the book introduces no hex addresses for A, B, C.
- **Colour is not the only carrier:** each host's colour goes with its letter; the incoming link and a forwarded link
  are thick solid lines with "ulazi" / "ciljano", a flooded copy is a thick dashed line with "kopija" and the host box
  dashed, the host's role is written under it ("šalje", "prima okvir", "prima kopiju", "kopija nije za njega", "ne
  prima ništa"); the row written in this step gets the highlighter plus the kit's left bar; the row the lookup found
  is outlined, and the lookup line under the table says the result in words (dashed when there is no entry).
- **Caption placeholders used twice** (`{src}`, `{port}`) need two nodes: the page's `parts()` wraps `t.parts` and
  copies a node at its second use. A kit request below.
- `learn`, `lookup`, `decide` and `frames` are pure functions over plain data with no strings, ready for `models/` when
  `net-mac-flooding` (catalogue §5.9, "extends `urm-mac-table`") reuses them.

## Sources

- The fragment (structure, sentences, exercises, the "why" box) and `komponente.js` (what each component did).
- URM book ch. 7 (`book/chapters/07-podatkovni-sloj.md`): "Ethernet u preklopljenoj mreži: kako preklopnik radi
  iznutra" (self-learning, the three data in a row, flooding, aging after 300 s), Primjer 2, and the figure
  `assets/diagrams/ch07-preklopnik-samoucenje.svg`. Every number in `sim.test.js` is checked against those passages.
- `scripts/check-web.py` (the §7a order and locked button names): "Primjer iz knjige" kept as preset 1.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| switch | preklopnik |
| port (of a switch) | priključak |
| MAC address table | tablica MAC adresa |
| self-learning | samoučenje |
| source / destination address | izvorišna / odredišna adresa |
| forwarding (to one port) | ciljano slanje, prosljeđivanje |

*flooding* (preplavljivanje) is in the glossary and used as `[[flooding]]` in the explanation.

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **kit (optional): `t.parts` with a placeholder used twice** puts the same node in both places, so the first use ends
  up empty. Smallest change: clone the node from its second use on, inside `t.parts`. Worked around here with a local
  `parts()`; other sims with repeated placeholders hit the same thing.
- **models/:** promote `learn`, `lookup`, `decide` when `net-mac-flooding` starts.

## Checks not done here

- A real projector and a lecturer with a clicker.
- No fresh reviewer read the diff (COMMON §8 asks it of new sims; this is an adoption).
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has
  "one home for networking interactives".

## Time

Start 2026-10-02 02:58, done 03:06 (about 8 minutes, one session).
