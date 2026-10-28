<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# wifi-channels: notes

New explorer (task `docs/tasks/w3/wifi-channels.md`, catalogue `net-wifi-channels`, §4.1). Rules, numbers and
sources are in `SPEC.md`; this file holds the decisions around them.

## Decisions

- **Channel params are list indices.** `chA`…`chD` are `range` params whose value is an index into the channel list
  of the current band and width, with a param-dependent `max`, and the read-out shows the channel ("6", "1+5",
  "106"). The kit's `select` has fixed options, and the 5 GHz lists have gaps (64 → 100) that a plain channel-number
  slider cannot skip. A slider also moves the spectrum block live while dragging, which suits an explorer. Cost: the
  URL holds indices (`chA=5` is channel 6 at 2.4 GHz, 20 MHz); presets are written with channel numbers in `sim.js`
  and converted. The kit clamps an index when the list gets shorter, which first turned 1/6/11 → 40 MHz → 20 MHz
  into 1/6/9 (found by the fresh review); the page now keeps the plan across width and band changes (`SPEC.md`,
  "Keeping the plan"; `remap` in `sim.js`). The first visit to the other band keeps the indices, an arbitrary
  mapping (there is nothing to keep).
- **Two width params, not one** (`width24`: 20, 22 (802.11b), 40; `width5`: 20, 40, 80, 160), shown by band. The
  task's single `width` would show 80/160 pressed on 2.4 GHz, where they do not exist. Each band keeps its own width.
- **One width for all APs** (as the task's params). Consequences: at 5 GHz blocks of one width are aligned, so there
  is co-channel but never overlap; and rule 8's sentence about a 40 MHz AP next to 20 MHz ones cannot be shown (below).
- **Rule 8 corrected.** The task says a 40 MHz AP on 1+5 (2402–2442) "leaves room for only one more clean 20 MHz
  channel (one of 11–13)". By the task's own rule 6 (touching is not overlapping), 20 MHz channels 9–13 are all
  clean next to it, and 9 + 13 are clean together. With one global width the honest statement is: two clean 40 MHz
  blocks fit (1+5 and 9+13, touching at 2442). The caption says that when a 2.4 GHz 40 MHz plan has an overlap.
  Owner question in the report.
- **2.4 GHz 40 MHz** is primary n with the secondary n + 4 above (1+5 … 9+13), not also "n−4 below": one list, no
  duplicate blocks under two names. Its primary is n (rule 5).
- **5 GHz bonded primary**: a bonded block counts as one primary, named by its centre (42, 58, …) as in the task's
  presets. A real AP picks a 20 MHz primary inside the block; two APs on one 80 MHz block with different primaries
  would still mostly contend. Simplification stated in `SPEC.md` rule 5.
- **No line for "no conflict"** on the floor plan, as the task's legend says; the coverage circles show who is in
  range, and the pairs table lists every pair (distance, hear yes/no, kind). "none (too far)" marks a pair whose
  channels would conflict if it were in range, which is what lowering the range in preset 4 turns into.
- **No chips on the floor lines.** Labels at the midpoints collided in the square (both diagonals cross at the
  centre, next to the A–C and B–D labels); the line style (solid ink vs zig-zag `--warn`) plus the pairs table carry
  the kind, and the legend names both.
- **A–C in the row** passes through B, so a line that would cross another AP bows out (a quadratic, apex 8 m above
  the row); the zig-zag follows the curve.
- **Spectrum lanes**: first-fit by AP order, so a clean plan is one row and a shared channel stacks, which shows
  overlap without words. The overlap itself: dashed `--warn` edges across the lanes and a hatched segment in its own
  row under them. An earlier version hatched the whole column over the blocks and hid their labels.
- **Airtime box** shows the share as a bar and a fraction (1, ½, ⅓, ¼): at most three co-channel neighbours. A
  warned AP adds "⚠ corrupted frames" (rule 7: its share stays 1).
- **Captions**: overlap first (it is the worse case), with one more sentence for further overlap pairs, a co-channel
  pair if there is one, and the advice (1, 6 and 11; or the two 40 MHz blocks). Else co-channel: the task's hr
  caption for a single pair, the airtime list for several. Else clean (or "no AP hears another" when none is in
  range), plus the DFS channels in use. The task's en caption ("Channels 1 and 3 overlap by 10 MHz … Use 1, 6 and
  11.") comes out of preset 3 with the APs named.
- **Panel fit at 1920×1080**: presets in two columns with short names (the long name in the hint), a channel's label
  beside its slider, no hints on width and range (the explanation and preset 4's hint say them). With the square's
  four sliders the panel is exactly at its limit (926 px); a longer preset name would push it over.
- **Phone**: the boxes beside the dots do not fit, so a list under the floor plan gives each AP's channel, airtime
  and ⚠; every other channel number and MHz label is hidden; the pairs table wraps its last column.
- **Terms**: no Wi-Fi term is in `kit/glossary.js`, so the strings use no `[[terms]]` and the page does not link the
  glossary. *access point* stays English in italics in the Croatian explanation, as in URM ch. 17 and `hidden-node`.

## Sources

- URM ch. 17 (`book/chapters/17-bezicne-mreze.md`): "Dijeljeni medij" (CSMA/CA, sharing the capacity of one
  channel), "Šire o temi" (spectrum, kanali, the EU 5 GHz sub-bands 5150–5250 / 5250–5350 / 5470–5725 MHz with DFS
  and TPC from ECC/DEC/(04)08; 6 GHz LPI/VLP from ECC/DEC/(20)01; range depends on walls and power). The book has no
  2.4 GHz channel plan, no 1/6/11 rule and no channel widths.
- URM ch. 6 (`06-fizicki-sloj.md`), "Kako signal nosi bitove": smetnje (interference) vs slabljenje, "promjena
  kanala" as the cure for interference.
- `sims/hidden-node/` (the URM Wi-Fi page's vocabulary: *access point*, stanica, CSMA/CA).
- IEEE Std 802.11-2020: 2.4 GHz centre 2407 + 5n, 5 GHz centre 5000 + 5n, DSSS 22 MHz *(check: clause numbers
  not checked offline; the task names 17.3.8.4, 19.3.15, 15.4.4.3)*. ETSI EN 300 328: 2400–2483.5 MHz *(check)*.
- Every number derived; checked by an independent python script before coding (channel lists built from aligned
  20 MHz channels, all six presets), then by `sim.test.js`.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| channel | kanal (URM ch. 17) |
| frequency band | frekvencijski pojas *(check: the book says "pojas", "radiofrekvencijski spektar")* |
| access point | *access point* (URM ch. 17 keeps the English term) |
| co-channel interference | smetnje na istom kanalu *(check)* |
| adjacent-channel interference | smetnje susjednog kanala *(check)* |
| channel width / channel bonding | širina kanala / spajanje kanala *(check)* |
| dynamic frequency selection (DFS) | dinamička selekcija frekvencije (URM ch. 17) |
| airtime | vrijeme u eteru *(check: from the task's caption)* |
| corrupted frames | pokvareni okviri *(check)* |

## Shared requests

- **kit: `.sd-ctl[hidden] { display: none; }`** in `kit.css` (this page carries the line, as route-summarisation and
  others do).
- **kit: `select` with options from params** (`options: (params) => [...]`), or a `range` with a value list, so a
  channel param could hold the channel number instead of an index.
- **Glossary:** the term pairs above with `"src": "simdeck"`, after the owner checks the *(check)* ones.

## Checks

- `npm run gate -- wifi-channels`: pass (manifest, tests, build, browser 46/46, tokens, scope).
- **Fresh review** (a separate agent, 2026-10-28): recomputed every number in `SPEC.md` with its own script (all
  match, including the rule 8 deviation), ran 63 mutants (48 killed), and read the page. Fixed: (1) a width or band
  round trip corrupted the plan (above); (2) the explanation said "only three fit" and then listed four; (3) the
  overlap caption made the channels the subject ("channels … do not wait"), now the APs; hr "međusobno si kvare";
  (4) with several co-channel pairs the caption named one; now every channel with its APs; (5) DFS caption said one
  sub-band for channels in two; (6) the ⚠ row label showed at 5 GHz, where overlap cannot happen; (7) hr "kanali su
  ovdje svejedno" reworded; (8) SPEC said the 19 channels were derived (they are the EU set, an input). Ten
  surviving mutants got tests (warned only by overlap, lanes checking every block, `changed` on one moved edge,
  counts, `to`, `overlap` out of range, defaults, 2.4 GHz never DFS, index rounding); the remaining survivors are
  equivalent (`+ 0`, `|| false`, `Number()` dropped, an impossible condition, `lo` equality vs primary under one
  width, `round1` on distances that never meet a 5 m range).
- Round trips checked in the browser: 1/6/11 → 40 → 20, → 5 GHz → 80 → 2.4 GHz, an edit at 40 then 20, preset 6,
  R; no console errors.
- Screenshots reviewed: the gate's set (1920×1080 light, dark, grayscale, help, panel hidden; 375×812; hr and en),
  and presets 3, 4, 5, 6, all-on-6 at range 45 (the A–C arc, dark), 1/3/2 at range 45 (three overlap pairs) at
  1920×1080 and 375×812.

## Time

2026-10-28, 14:58 → 15:25, one session (the fresh review and its fixes included).
