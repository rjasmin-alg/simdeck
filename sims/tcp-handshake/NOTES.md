<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-handshake: notes

Adopted from the URM book's web edition, `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/trostruko-rukovanje.html`
(task `docs/tasks/w1/tcp-handshake.md`, catalogue `urm-tcp-handshake`). The fragment used the book's `IA.Klizac`,
`IA.Koraci`, `IA.gumbPrimjer` and `IA.Zadatak` (`output/interaktivno/static/komponente.js`), the book's CSS and an SVG
drawn with a `viewBox`. The simdeck copy is canonical from here on.

## Decisions

- **Class `stepper`, 3 steps**, one per message, as in the fragment's `IA.Koraci`: 1 SYN (seq X), 2 SYN+ACK (seq Y,
  ack X+1), 3 ACK (ack Y+1). Step 0 is "the connection has not started" (the fragment's index −1). The four conceptual
  steps of RFC 9293 §3.4.1 are labelled on the rows ("korak 1", "koraci 2 i 3", "korak 4"), and the SYN+ACK row names
  its two halves, so "four steps, three messages" is on the stage, not only in the explanation.
- **Book's numbers first:** the default and preset 1 (`book`, "Primjer iz knjige", the button name `check-web.py`
  locks) are URM ch. 13, Primjer 3, which the fragment's top comment names: X = 4000, Y = 9500, so SYN 4000; SYN+ACK
  9500 / 4001; ACK 9501. Tested.
- **"What happened" box → caption; "why" box → the explanation's first paragraph** (verbatim in Croatian). The
  explanation adds three short paragraphs from the chapter: four steps / three messages, why each side needs its own
  ISN (the chapter's "Šire o temi"), and 32-bit numbers. The `<details>` text version is not needed: the caption is
  the kit's live region and the stage is HTML text.
- **Exercises (`ia-zadatak`) → presets**, the question as the hint, the answers not on the page (the steps show them):
  exercise 1 → `small` (X = 100, Y = 500); exercise 2 → `merged` (book numbers, opens at step 2); exercise 3 →
  `own-number` (X = Y = 4000: both sides still send their own number, and the two octet lines stay separate).
- **Added by simdeck** from the chapter: `real` (the ISNs of the chapter's capture figure, 2762080915 and 2945746186:
  real ISNs are not round) and `wrap` (X = 2^32 − 1, so the ack is 0; the chapter says both fields are 32 bits, and
  RFC 9293 §3.4 says sequence arithmetic is modulo 2^32). The fragment's sliders (0–9999) cannot reach those, so the
  `isn` choice ("Biram ih" / "Kao u snimci veze" / "Kraj 32 bita") picks the pair; the sliders are disabled with a
  reason outside "Biram ih" (see Shared requests for why not hidden).
- **The closing ACK shows seq = X+1** as well as ack = Y+1. The fragment and the book's figure show only the ack. RFC
  9293 §3.4 (figure 7, line 4) carries SEQ=X+1 on that ACK, and it reinforces the page's point: the ACK takes no
  number, so A's first data octet is also X+1, the number B waits for.
- **Octet lines** (the book figure's lower panel "Zašto potvrda glasi 4001, a ne 4000", redrawn in HTML): for each side
  its ISN (hatched once its SYN is sent, "zauzima SYN"), the first data octet and the second, with "B čeka ▼" / "A čeka
  ▼" and a thick frame on the number the other side expects.
- **Each side's card** shows the ISN, the next number it sends, what it expects from the other side ("još ne zna"
  before the other's SYN) and whether the other side has acknowledged its ISN. Values changed in the step get the
  kit's `sd-changed`; "veza uspostavljena" appears after step 3.
- **Colour is not the only carrier:** A and B are also left/right, letters and arrow direction; the current message
  has the highlighter band and a thicker line; unsent ones are dashed and say "još nije poslano"; the SYN number is
  hatched, the expected one framed and tagged. Checked in grayscale.
- **The sequence chart is drawn by the page** (HTML, text at 1:1), since the kit view K1 (`w0/kit-sequence-chart`) does
  not exist yet. When it does, this page is one of its consumers.
- **Teardown** (catalogue §5.8 "a second mode of the ported handshake page") is not here: it is the later preset task
  `w3/tcp-teardown`. The model is ready for it: `segments` is plain data with flags (FIN already counts one number in
  `seqLen`), and `sides` replays any list of segments. The step count is fixed at 3 in `sim.json`, so a teardown preset
  with more messages needs either a longer `steps` with idle steps or a per-preset step count; that is for that task.
- Numbers, flags and A/B are data (`translate="no"`). The model (`seqAdd`, `seqLen`, `segments`, `sides`) is pure over
  plain data, ready for `models/` (catalogue §5.8 asks for one TCP model: `tcp-teardown`, `tcp-retransmit`,
  `tcp-states`, `flow-control`, `tcp-window`).

## Sources

- The fragment (structure, sentences, numbers, exercises) and `komponente.js` (what each component did).
- URM ch. 13 (`book/chapters/13-transportni-sloj.md`): "TCP: uspostava veze i trostruko rukovanje" (sequence and
  acknowledgment numbers, SYN takes ISN and data starts at ISN+1, the four steps and their merge, why each side states
  its ISN, all with RFC 9293 quotes), Primjer 3, the figure `ch13-trostruko-rukovanje.svg` (redrawn, not copied) and
  the capture figure's caption (the two real ISNs).
- RFC 9293 §3.4 (modulo 2^32 arithmetic; SEQ=X+1 on the third message) *(check: the owner may prefer the book's figure,
  which shows the ack alone on the third message)*.
- `scripts/check-web.py` (locked button name "Primjer iz knjige").

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| three-way handshake | trostruko rukovanje |
| sequence number | redni broj |
| initial sequence number (ISN) | početni redni broj |
| acknowledgment number | broj potvrde (potvrda) |
| octet | oktet |
| connection established | veza uspostavljena |

The glossary has *handshake* = rukovanje (`src: uvod-u-linux`); OPEN.md already lists the conflict with the URM book's
"trostruko rukovanje". This page does not use `[[handshake]]`.

## Shared requests

- **Kit:** a control with `visible: () => false` stays on screen: `syncState` sets `wrap.hidden`, but `.sd-ctl {
  display: flex }` in `kit.css` overrides the `hidden` attribute (only `.sd-blank[hidden]` has a rule). Smallest fix:
  `.sd-ctl[hidden] { display: none; }`. This page uses `disabled` with a reason instead, which needs no workaround.
- **Glossary:** add the pairs above with `"src": "simdeck"`.

## Checks not done here

- A real projector and a lecturer with a clicker.
- No `SPEC.md` and no fresh reviewer: §8 asks for both for new sims; this is an adopted page (as `nat`). Every rule was
  broken once instead (no modulo, ack = X, final seq, ACK taking a number, ack check skipped, steps 2+3 not merged) and
  each made its tests fail.
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has "one home
  for networking interactives".

## Time

Start 2026-10-02 03:47, done 03:56 (about 10 minutes, one session).
