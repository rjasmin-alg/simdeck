<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# wifi-channels: Wi-Fi channels and overlap

One concept: **which channel an access point uses decides whether it shares the air with its neighbours (same
channel), corrupts their frames (partly overlapping channels) or is left alone; at 2.4 GHz only 1/6/11 avoid
overlap, and at 5 GHz wider channels mean fewer of them.** An explorer: the params drive the drawing live.

Task: `docs/tasks/w3/wifi-channels.md`. Catalogue: `net-wifi-channels` (§4.1).

## Scene

- **Top left, the floor plan:** a building outline, 3 APs in a row (A, B, C, 20 m apart) or 4 at the corners of a
  20 m square (A top left, B top right, C bottom left, D bottom right). Each AP: a dot in its series colour with its
  letter, a dashed coverage circle of radius `range`, and a box with its channel, an airtime bar with the share
  (1, ½, ⅓, ¼) and "⚠ corrupted frames" when it is in an overlap pair. Pairs that hear each other: co-channel a
  thick solid ink line, overlap a zig-zag line in `--warn`, no conflict no line. A line that would pass through
  another AP (A–C in the row) bows out above it. A 10 m scale bar.
- **Top right, the pairs:** every pair with its distance, whether they hear each other, and the conflict
  (⇄ same channel / ⚠ overlap N MHz / none / none (too far) when the channels would conflict but they are out of
  range).
- **Bottom, the spectrum** of the band (2400–2483.5 MHz, or 5150–5725 MHz with the sub-bands: 5150–5250 "no DFS",
  5250–5350 DFS hatched, 5350–5470 "not for Wi-Fi" cross-hatched, 5470–5725 DFS hatched). Each AP is a block over
  its frequencies, in the first lane where it overlaps no block already there (so a clean plan uses one lane of the
  3 or 4 drawn, a shared channel stacks). The overlap of every overlap pair is marked with dashed `--warn` edges across the lanes and a
  hatched segment in a row under them. Under that, the 20 MHz channel numbers at their centres, and MHz at the edges.
- **Changed** (yellow + ink outline): the AP whose block moved (channel or width) since the last input, in its box
  and its spectrum block; every pair whose kind changed, in the table and as a halo on its floor line. A band or
  layout change marks nothing.

## State (explorer)

Params `{ band, width24, width5, layout, range, chA, chB, chC, chD }` → `{ band, width, layout, range, span, floor,
aps: [{ id, x, y, idx, ch, label, primary, centre, width, lo, hi, dfs, lane }], pairs: [{ a, b, dist, inRange, kind:
'none'|'cci'|'overlap', overlap, from, to }], airtime: { id: share }, sharers: { id: n }, warned: { id: bool },
lanes, cci, overlaps }`. Frequencies in MHz, positions in metres.

`chA`…`chD` are **indices** into the channel list of the current band and width (the kit's sliders need a contiguous
range; the 5 GHz lists have gaps). They are clamped to the list. Presets are written with channel numbers and
converted (`indexOf`).

## Rules

1. **2.4 GHz.** Channel n (1–13 in Europe) is centred at 2407 + 5·n MHz; 20 MHz spans centre ± 10, 802.11b DSSS
   (the "22" width) ± 11. Sources: IEEE 802.11-2020, the 2.4 GHz channel numbering of the HR/DSSS and ERP/HT PHYs
   *(check clause numbers: the task names 19.3.15 / 15.4.4.3; not checked offline)*; ETSI EN 300 328 for the band
   2400–2483.5 MHz. Channel 1 = 2402–2422, 6 = 2427–2447, 11 = 2452–2472, 13 = 2462–2482.
2. **5 GHz.** Channel n is centred at 5000 + 5·n MHz, span ± width/2 (IEEE 802.11-2020, 5 GHz channel numbering,
   *(check clause: task names 17.3.8.4)*). EU 20 MHz: 36–64 and 100–140, 19 channels. Bonded, named by their centre:
   40 MHz 38, 46, 54, 62, 102, 110, 118, 126, 134 (9); 80 MHz 42, 58, 106, 122 (4); 160 MHz 50, 114 (2). 144 is out
   (5710–5730 > 5725); 138 (80 MHz, 5650–5730) and 142 (40 MHz) likewise. The 20 MHz set is an input (the EU
   channel set; the sub-band edges alone would also admit 32, 68 and 96); sub-band limits from ECC/DEC/(04)08 as
   quoted in URM ch. 17 "Šire o temi"; the bonded counts are derived from it (checked by a script that builds blocks
   from aligned 20 MHz channels).
3. **DFS.** A block is DFS when it overlaps 5250–5350 or 5470–5725 MHz; touching an edge does not count
   (42 = 5170–5250 and 46 = 5210–5250 are not DFS; 52 = 5250–5270 is). DFS channels: 52–64 and 100–140 at 20 MHz;
   54, 62 and 102–134 at 40; 58, 106, 122 at 80; both 160 MHz blocks. URM ch. 17, ECC/DEC/(04)08.
4. **Hearing.** Two APs hear each other when their distance ≤ `range` (at exactly the range they still do). A
   derived floor model: real range depends on walls and power (URM ch. 17, last paragraph of "Šire o temi").
   Distances: neighbours 20 m, A–C in the row 40 m, the square's diagonals 28.3 m.
5. **Conflict** of a pair that hears each other: same primary channel → **co-channel** (`cci`): they take turns
   (CSMA/CA, URM ch. 17 "Dijeljeni medij"); otherwise frequency ranges that overlap → **overlap** (adjacent-channel
   interference): they do not defer to each other and corrupt each other's frames; otherwise none. A pair out of
   range is none whatever its channels. The primary at 2.4 GHz is the channel number (at 40 MHz the lower channel);
   at 5 GHz a bonded block counts as one primary (derived simplification: a real AP picks a 20 MHz primary inside
   the block). Since one width applies to all APs, two 5 GHz blocks are either the same block or disjoint: at
   5 GHz there is co-channel but never overlap.
6. **Tie-break: touching is not overlapping.** Overlap in MHz = min(hi) − max(lo), clamped at 0; 0 means no
   overlap. So 1 and 5 at 20 MHz (2422 = 2422) do not overlap, 1/5/9/13 is clean at 20 MHz, but 1 and 5 overlap by
   2 MHz at 22 MHz (DSSS). 1/6/11 is clean at both (1–6: 2423 < 2426 at 22 MHz). Derived from rule 1.
7. **Airtime** of an AP = 1 / (1 + number of co-channel APs it hears) (derived teaching simplification). An overlap
   pair keeps 1 but both APs show "corrupted frames", which is worse in practice *(check)*.
8. **40 MHz at 2.4 GHz.** Primary n (1–9) with the secondary n + 4 above it ("1+5"): centre 2407 + 5·(n + 2),
   span ± 20, so 1+5 = 2402–2442 and 9+13 = 2442–2482. With one width for all APs, the only 40 MHz block clean next
   to 1+5 is 9+13 (they touch): the band holds two clean 40 MHz blocks, so three APs cannot all be clean.
   **Deviation:** the task says a 40 MHz AP on 1+5 "leaves room for only one more clean 20 MHz channel (one of
   11–13)"; by rule 6, 20 MHz channels 9–13 are all clean next to 2402–2442, and 9 and 13 are clean together
   (they touch). That sentence needs mixed widths, which the task's single `width` param does not give, so the page
   states the 40 MHz version (NOTES.md).

Spectrum lanes (page geometry, tested): in AP order, each block goes in the first lane where it overlaps (rule 6
sense) no block already there.

**Keeping the plan across a width or band change** (`remap`, tested; the page's listener): the kit clamps the channel
indices when the list gets shorter, so the page puts the right ones back. Back to a band/width that was left without
an edit, its old channels return (1/6/11 → 40 MHz → 20 MHz is 1/6/11 again; a band switch returns that band's last
plan). Otherwise, within a band, each AP moves to the channel with the same primary if the list has it, else one that
contains its reference frequency (the primary's centre at 2.4 GHz, the lowest 20 MHz channel at 5 GHz), nearest
centre first, lower channel on a tie; with none containing it, the nearest centre. 1/6/11/13 at 20 → 1+5, 6+10,
9+13, 9+13; 44/56/100/140 at 20 → 42/58/106/122 at 80; 42/58/106/122 at 80 → 36/52/100/116 at 20. Presets and the
reset are never remapped.

## Params

| key | type | values | default |
|---|---|---|---|
| `band` | choice | `2.4`, `5` | `2.4` |
| `width24` | choice (shown at 2.4) | 20, 22 (802.11b), 40 | 20 |
| `width5` | choice (shown at 5) | 20, 40, 80, 160 | 20 |
| `layout` | choice | `row3`, `square4` | `row3` |
| `range` | range, m | 10–60, step 5 | 25 |
| `chA`…`chD` | range (index; read-out = channel) | 0 … list length − 1 (`chD` only in the square) | 5, 5, 5, 0 (6, 6, 6, 1) |

**Deviation:** the task's single `width` (20 | 40 | 80 | 160, 80/160 only on 5 GHz, 22 only on 2.4) is two params,
one per band, each listing only its valid widths; switching band keeps each band's width.

## Presets (numbers checked by `check.py` in the session scratchpad and by `sim.test.js`)

| # | id | setup | expected |
|---|---|---|---|
| 1 | `all-on-6` | row, 2.4 GHz 20 MHz, range 25, 6/6/6 | A–B, B–C cci; A–C 40 m out of range; airtime A ½, B ⅓, C ½ |
| 2 | `one-six-eleven` | row, 25, 1/6/11 | no conflict; airtime 1/1/1 |
| 3 | `one-three-six` | row, 25, 1/3/6 | A–B overlap 10 MHz (2412–2422), B–C overlap 5 MHz (2427–2432), A–C out of range; all warned; airtime 1 |
| 4 | `four-in-a-square` | square, 30, 1/6/11/1 | A–D (28.3 m) cci, rest none; airtime A ½, D ½, B, C 1. At range 25: A–D out of range, all 1 |
| 5 | `five-ghz-80` | square, 5 GHz 80 MHz, 60, 42/58/106/122 | no conflict; DFS 58, 106, 122; 42 not |
| 6 | `five-ghz-160` | square, 5 GHz 160 MHz, 60, 50/50/114/114 | A–B and C–D cci; airtime ½ each; all DFS |

Defaults equal preset 1 (with D on channel 1 when the square is picked).

## Captions (composed in the page)

- Any overlap pair: "A (channel 1) and B (channel 3) overlap by 10 MHz: they do not wait for each other and corrupt
  each other's frames." + "There is/are n more such pair(s)." + "A and B also share channel 6." for up to two
  co-channel pairs + at 2.4 GHz "Use 1, 6 and 11." (or at 40 MHz "only two 40 MHz blocks fit: 1+5 and 9+13").
- Else one co-channel pair: the task's hr caption ("… svaki dobije pola vremena u eteru"); several: every channel with
  its sharing APs, "A and B are on the same channel 50, and C and D on channel 114: those that hear each other take
  turns, because CSMA/CA makes them wait. Airtime: A ½, B ½, C ½, D ½."
- Else: "No pair that hears each other is on the same or an overlapping channel…" (or "At 10 m no AP hears
  another…" when no pair is in range) + the DFS channels in use, if any.
