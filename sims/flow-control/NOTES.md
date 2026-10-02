<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# flow-control: notes

Adopted from the URM book's web edition, `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/kontrola-toka.html`
(task `docs/tasks/w1/flow-control.md`, catalogue `urm-flow-control`). The fragment used the book's `IA.Klizac`,
`IA.Koraci`, `IA.gumbPrimjer` and `IA.Zadatak` (`output/interaktivno/static/komponente.js`) and the book's CSS. The
simdeck copy is canonical from here on.

## Decisions

- **Class `stepper`, 12 steps, one event per step.** The original was a slider over the acknowledgment (500–4000,
  step 100) with a fixed window of 1000 octets and two steps (its moments 1 and 2); the octets "sent, not
  acknowledged" were always half the window, by construction. That showed the window *moving*, but not the receiver
  *limiting* the sender, which is the catalogue's concept. Here a greedy sender sends 500-octet segments while the
  next one fits in the window, waits when it would cross the right edge, and every acknowledgment slides the window
  by one segment. The rules, in order: after a wait, the oldest segment is acknowledged; otherwise send if the
  segment's last octet ≤ the right edge; otherwise wait.
- **The book's numbers are steps 1 and 4 of the first preset** (`book`, "Primjer iz knjige", the fragment's own
  button name and the default). Step 1 = the figure's moment 1 (acknowledged 1000–1499, in flight 1500–1999, may send
  2000–2499, not yet from 2500); step 4 = moment 2 (acknowledgment 2000, window 2000–2999, in flight 2000–2499, may send
  2500–2999). The caption says so at those two steps. The fragment's top comment names no "Primjer N": its numbers are
  the figure's (`assets/diagrams/ch13-prozor-kontrola-toka.svg`, `meta/chapter-13/diagrams.yaml`). The segment of 500
  octets from octet 1000 is the chapter's sequence-number paragraph ("Segment koji nosi 500 okteta i počinje na rednom
  broju 1000 završava, dakle, oktetom 1499"); the window of 1000 is the figure's own choice, not the text's
  (`meta/chapter-13/notes.md`, "svg-diagram, 2026-08-22", §2). The explanation says that.
- **Deviation: acknowledgments arrive only while the sender waits**, one per segment. This is a stylisation of a path
  whose round trip is longer than sending a whole window (the regime where the window is the limit), and it keeps the
  step count fixed (12 for every window). The explanation's last paragraph says real receivers acknowledge as data
  arrives and may change the advertised window. The window does not change during a run.
- **The window is a param** (choice 500 / 1000 / 1500 / 2000, multiples of the segment so a segment either fits or not).
  It replaces the original's acknowledgment slider; the acknowledgment now moves through the steps. Changing the window
  keeps the step and recomputes.
- **Exercises (`ia-zadatak`) became presets**, opened at step 0; the question is the preset's hint, the fragment's
  revealed answers are not on the page:
  - exercise 1 (move the acknowledgment 1500 → 2000: how far did the window move, did its size change?) → `book`;
  - exercise 2 (what is the window field for, whose capacity does it protect, from whom?) → `small` (500 octets: one
    segment, then a wait);
  - exercise 3 (flow control versus congestion control) → `large` (2000 octets), together with "how many segments
    before the first wait?". The question about congestion is deliberately not answered by the stage: the page shows
    only flow control, as the original's "why" box says.
- **The "why" box is the explanation's third paragraph**, nearly word for word (dashes replaced by colons and commas).
  Two paragraphs before it state the window rule (edges, sliding) and the limit; the last one states the simplification.
- **The original's text version (`<details>`) is gone:** the caption is the kit's live region and says the same.
- **Colour is not the only carrier:** acknowledged = solid fill + ✓; in flight = tint + hatch + solid border; may be
  sent = dashed, empty; may not be sent yet = cross-hatch, dotted border, muted ✕; the refused segment in a wait gets
  a dashed outline; every region also has its label and range under the strip. Checked in the grayscale screenshot.
- The strip is octets 1000–5499 (nine cells); a test checks that every window edge of every offered window stays
  inside it. On a phone the cells show their first octet only and the region labels go (the legend stays).
- The model (`edges`, `fits`, `region`, `step`) is pure and promotable to `models/` as the start of the shared TCP model
  of catalogue §5.8 (`tcp-window`, `net-tcp-retransmit`, `net-tcp-congestion`), should one of them need it.

## Sources

- The fragment (structure, sentences, exercises) and `komponente.js`.
- URM book ch. 13 (`book/chapters/13-transportni-sloj.md`): the window field and its RFC 9293 §3.1 quote
  (`[^rfc9293-window]`), sequence and acknowledgment numbers ("potvrda 1500 … čekam 1500"), "TCP: pouzdanost,
  kontrola toka i kontrola zagušenja" with its Peterson & Davie quote, "Šire o temi" (16 bits, window scaling).
- Figure `assets/diagrams/ch13-prozor-kontrola-toka.svg` (not copied; the stage draws it) and its manifest entry.
- `scripts/check-web.py` (locked button names): "Primjer iz knjige" kept as preset 1.
- Every number in `sim.test.js` is checked against those passages.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| flow control | kontrola toka |
| congestion control | kontrola zagušenja |
| window (TCP window field) | prozor (polje prozora) |
| acknowledgment (number) | potvrda (broj potvrde) |
| segment | segment |
| octet | oktet |
| in flight (sent, not acknowledged) | u letu (poslano, nepotvrđeno) — *u letu* is simdeck's, the book says only "poslano, nepotvrđeno" *(check)* |
| left / right edge of the window | lijevi / desni rub prozora |

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"` (*acknowledgment number*, *octet* overlap with
  `tcp-handshake`'s list).
- **Duplicate source:** `ugradbeno/prozor.html` (task `w1/tcp-window.md`, "window size vs throughput") is
  byte-identical to `kontrola-toka.html` (the fragment's comment says it is embedded under both `pojam/prozor.html` and
  `pojam/kontrola-toka.html`). Adopting it as written would give a second copy of this sim. Either drop `tcp-window`,
  make it a preset of this sim, or rewrite its goal (a real throughput-versus-window model, e.g. window / RTT), which is
  then a native sim, not an adoption.

## Checks not done here

- A real projector and a lecturer with a clicker.
- A fresh reviewer reading the diff against the rules (COMMON.md §8 asks it of new sims; this is an adoption, and the
  rules are in this file and `sim.js`, not a `SPEC.md`).
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has "one
  home for networking interactives".

## Time

Start 2026-10-02 21:02, done 21:12 (about 10 minutes, one session).
