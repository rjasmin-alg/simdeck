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
- **Teardown** (catalogue §5.8 "a second mode of the ported handshake page") was added by the preset task
  `w3/tcp-teardown`: see "Closing modes (task tcp-teardown)" below and `SPEC.md`.
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
- **Glossary:** add the pairs above with `"src": "simdeck"`, and the teardown pairs under "Closing modes".
- **Kit, `t.parts`:** a node passed as a placeholder value that occurs twice in a string (`{c}` twice in one caption)
  lands only in its last place (the same node is appended twice). Smallest fix: clone a node already used. The page
  works around it with `partsOnce` in `index.html`.
- **Kit, K1:** (1) a `weight: 'thick'` for data segments (the task's legend asks for "data: thicker arrow"); (2) on a
  phone a note whose text wraps in the last row hangs below the list, so `fit()` drops rows although the page scrolls
  there; the page keeps its notes short instead.
- **Host:** the handshake's own chart could move to K1 like the closing modes, so the page has one chart.

## Checks not done here

- A real projector and a lecturer with a clicker.
- No `SPEC.md` and no fresh reviewer: §8 asks for both for new sims; this is an adopted page (as `nat`). Every rule was
  broken once instead (no modulo, ack = X, final seq, ACK taking a number, ack check skipped, steps 2+3 not merged) and
  each made its tests fail.
- Freezing the original (a note in the URM book's repo pointing here) is outside simdeck; OPEN.md already has "one home
  for networking interactives".

## Closing modes (task tcp-teardown)

Task `docs/tasks/w3/tcp-teardown.md`, catalogue `net-tcp-teardown`: five presets, `close-client`, `close-server`,
`half-close`, `fin-ack-combined`, `simultaneous` (5, 5, 7, 4, 3 steps), each with a `sim.json` entry. Rules,
tie-breaks, numbers and sources: `SPEC.md`.

### Decisions

- **The host model could express it with additive changes in this folder**, so no shared request blocked the task:
  (a) a step list per mode (`SCRIPTS`, `stepsFor(params)`, mounted as `steps`; `logic.steps` stays 3 so the
  handshake's own tests are untouched, and `sim.json` `steps` stays 3, the default's count); (b) a state per end after
  every step; (c) a timeout step; (d) step 0 = both ESTABLISHED with A from X+1 and B from Y+1. New params `mode`
  (default `open`) and `closer` (default `A`); the handshake's `defaults` test now lists them.
- **K1 for the closing modes, the page's own chart for the handshake.** K1 exists now, so the closing modes use it
  (lanes with the state in the card, receiver's new state at the tip, a TIME-WAIT timer, a note for 2×MSL). The
  handshake's own chart is the host's; moving it to K1 too is a change to the host, not to this preset.
- **State changes on receipt**, in the step a segment arrives (RFC 9293 §3.10.7.4 and the task's "one step"). So
  in `close-client` A is in TIME-WAIT already after step 3 (B's FIN arrives) and *stays* there in step 4; the task's
  caption for step 4 ("A potvrđuje B-ov FIN brojem 9502 i ulazi u TIME-WAIT") became "… i ostaje u TIME-WAIT". The
  same rule gives the task's CLOSING after step 1 of `simultaneous` and FIN-WAIT-1 → TIME-WAIT in step 2 of
  `fin-ack-combined`.
- **Flags as the task writes them:** FIN, ACK, FIN+ACK, data (no flag, a "podaci" chip and `len`). Every segment after
  the handshake really carries the ACK bit; the page writes FIN+ACK only where that ACK acknowledges the peer's FIN.
  The fields (`seq= ack=`) are on every arrow, so the ack value is always there.
- **Arrows:** a pure ACK is K1's thin line (legend "čisti ACK"); FIN and data are the normal line. K1 has no thicker
  weight for data (Shared requests); data is told apart by its chip and `len`.
- **The numbers under the chart** continue the host's octet lines: SYN took X, the FIN takes the next number (dashed
  "tu bi došao FIN" until sent), the FIN's ACK carries the one after. In `half-close` B's line shows the 200 data
  octets 9501–9700 before its FIN at 9701. This puts rule 2 (FIN takes a number) on the stage.
- **Each lane card says whether the end may still send and receive data** (✓/✕ with da/ne), for misconception 2
  ("after sending FIN a side can no longer receive").
- **Panel space.** Eleven presets did not fit at 1920×1080 (1368 px of 926). The page now has two preset columns
  (as `db-replication` and `win-wsus-flow`), a panel of up to 28rem (`--panel-w`), slightly tighter preset buttons,
  and no control for `mode` (the presets set it; presets 1–6 and R go back to the handshake). The `closer` choice is
  shown only in `close`, `half` and `finack` (page CSS `.sd-ctl[hidden] { display: none; }`, the kit fix asked for
  above). Measured in all 11 presets at the last step, hr and en: the panel fits in every one.
- **Keys 1–9** reach the first nine presets; `fin-ack-combined` and `simultaneous` are clicked (the host's six come
  first).
- **The half-close hint** says "A has nothing more to send", not "has sent the whole file": the task fixes A's FIN at
  4001, i.e. no data octets from A, and a file would move that number. The book's file story is in the explanation.
- **TIME-WAIT duration on the page:** 2×MSL = 4 min from the standard, "many systems wait less, e.g. 60 s" in the
  explanation; no operating system is named (concepts, not tools).
- **The explanation switches with the mode:** `explain` for the handshake, `explainClose` for a close.
- **Phone:** the cards stack and the chart grows (no dropped rows; checked in `half-close`, `simultaneous`,
  `close-client`, hr and en, no sideways scroll). Long field labels are clipped at the lane edge and run under the step
  numbers, as K1 does on a phone. The 2×MSL note is short ("2×MSL prošlo") because a wrapped note in the last row hangs
  below the list and makes `fit()` drop rows on a phone (Shared requests).

### Rules checked by breaking them

Each change made at least one test fail: the ACK of a FIN+ACK ignored; FIN-WAIT-1 + FIN → TIME-WAIT instead of
CLOSING; each segment delivered before the next is sent (FINs cannot cross); FIN takes no number; no CLOSE-WAIT; no
FIN-WAIT-2; LAST-ACK → TIME-WAIT instead of CLOSED; no receiving after FIN; the timeout does nothing; no LAST-ACK.

### Sources

- URM ch. 13 (`book/chapters/13-transportni-sloj.md`), "TCP: zatvaranje veze" (CLOSE sends FIN, simplex close,
  half-closed connection, the file-upload story, "Zatvaranje, drugim riječima, nije otvaranje unatrag") and Primjer 3
  (X = 4000, Y = 9500).
- RFC 9293 §3.3.2 Figure 5 (states), §3.4 (FIN takes a number), §3.4.2 (MSL 2 min), §3.6 and §3.6.1 (closing,
  half-closed), Figure 13 (simultaneous close), §3.10.7.4 (order: ACK, text, FIN).
- Linux `tcp(7)` (`tcp_fin_timeout`) for the 60 s *(check: OS-specific, not named on the page)*.

### Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| connection teardown | zatvaranje veze |
| half-closed connection | poluzatvorena veza |
| flag | zastavica |
| simplex | simpleksno (jednosmjerno) |
| maximum segment lifetime (MSL) | najdulje vrijeme života segmenta (the page explains MSL in words) |

State names (ESTABLISHED, FIN-WAIT-1, …) stay in English as data (`translate="no"`), as the standard names them; the
book does not name them.

### Time

Start 2026-10-28 12:57, done 13:20 (about 25 minutes, one session).

## Time

Start 2026-10-02 03:47, done 03:56 (about 10 minutes, one session).
