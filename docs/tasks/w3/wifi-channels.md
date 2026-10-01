# wifi-channels: Wi-Fi channels and overlap

| | |
|---|---|
| Task | `wifi-channels` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-wifi-channels` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/wifi-channels/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `wifi` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **2.4 GHz 1/6/11, 5 GHz channel widths, co-channel interference**.

The student: place APs, assign channels.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md` (Uvod u računalne mreže): "Dijeljeni medij: zašto bežična veza radi drukčije od žične" → "Šire o temi" (spectrum, kanali, the EU 5 GHz sub-bands 5150–5250 / 5250–5350 / 5470–5725 MHz with DFS and TPC, 6 GHz LPI/VLP, from ECC/DEC/(04)08 and ECC/DEC/(20)01). The book has **no** 2.4 GHz channel plan and no 1/6/11 rule.
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/06-fizicki-sloj.md`, "Kako signal nosi bitove" (smetnje vs slabljenje; "promjena kanala" as the cure for interference, Pitanja 5)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/skriveni-cvor.html` (the book's Wi-Fi page: vocabulary and style)
- IEEE Std 802.11-2020, clause 17.3.8.4 (5 GHz channel numbering, centre = 5000 + 5·n MHz), clause 19.3.15 / 15.4.4.3 (2.4 GHz, centre = 2407 + 5·n MHz, n = 1–13; DSSS 22 MHz wide) *(check clause numbers)*
- ETSI EN 300 328 (2.4 GHz band 2400–2483.5 MHz in Europe); ECC Decision (04)08 (5 GHz, quoted in the book)
- Catalogue seed: URM ch17

## Model and presets

- **Scene:** top half: a floor plan with 3–4 APs at fixed positions, each with a coverage circle whose radius is the `range` param, a channel badge and an airtime bar. Bottom half: the spectrum strip of the chosen band (2.4 GHz 2400–2483.5 MHz, or 5 GHz 5150–5725 MHz with the DFS sub-bands shaded), each AP drawn as a block over its frequency range, stacked where they overlap. Lines between APs that hear each other, styled by the kind of conflict.
- **State (derived, explorer):** `{ aps: [{id, x, y, primary, width, lo, hi, dfs}], pairs: [{a, b, inRange, kind: 'none'|'cci'|'overlap'}], airtime: {id: share} }`.
- **What the params drive live:** changing an AP's channel or the width moves its spectrum block and re-labels every pair; the range slider adds or removes "hears" lines; the band switch swaps the channel lists.
- **Rules:**
  1. 2.4 GHz: channel n (1–13 in Europe) is centred at 2407 + 5·n MHz; a 20 MHz channel spans centre ± 10 MHz, an 802.11b DSSS channel ± 11 MHz (IEEE 802.11-2020 *(check clause)*; ETSI EN 300 328).
  2. 5 GHz: channel n is centred at 5000 + 5·n MHz. EU 20 MHz channels: 36–64 and 100–140 (19 channels). Bonded blocks: 40 MHz 38, 46, 54, 62, 102, 110, 118, 126, 134 (9); 80 MHz 42, 58, 106, 122 (4); 160 MHz 50, 114 (2). Channel 144 is out (its upper edge 5730 MHz is above 5725). From the book's ECC sub-band limits (URM ch17) and IEEE 802.11 numbering; counts derived.
  3. DFS: any block that overlaps 5250–5350 or 5470–5725 MHz is marked DFS (touching an edge does not count: 42 = 5170–5250 MHz is not DFS) (must leave on radar) (URM ch17, ECC/DEC/(04)08).
  4. Two APs "hear" each other when their distance ≤ `range` (derived floor model; real range depends on walls and power, URM ch17 last paragraph of "Šire o temi").
  5. Conflict for a pair that hears each other: same primary channel → **co-channel** (CCI): they take turns (CSMA/CA, URM ch17 "Dijeljeni medij"); frequency ranges overlap but primaries differ → **overlap** (adjacent-channel interference): they do not defer to each other, they corrupt each other's frames; otherwise none.
  6. Tie-break: ranges that only touch (|Δf| exactly equals the half-widths summed, e.g. channels 1 and 5 at 20 MHz) do **not** overlap. 1/5/9/13 is clean at 20 MHz but 1 and 5 overlap at 22 MHz DSSS; 1/6/11 is clean in both (derived from rule 1).
  7. Airtime share of an AP = 1 / (1 + number of co-channel APs it hears) (derived simplification; overlap pairs keep share 1 but show a "corrupted frames" warning, which is worse in practice *(check)*).
  8. A wider channel occupies more of the band: at 2.4 GHz a 40 MHz AP on 1 (+5 secondary) spans 2402–2442 MHz and leaves room for only one more clean 20 MHz channel (one of 11–13).
- **Params:** `band` choice `2.4` | `5`, default `2.4`; `width` choice 20 | 40 | 80 | 160 MHz (80/160 only on 5 GHz; 22 = "802.11b" option on 2.4), default 20; `chA`…`chD` select from the band's list for that width; `range` range 10–60 m, step 5, default 25; `layout` choice `row3` | `square4`, default from preset.
- **Presets:**
  1. `all-on-6` — row of 3 APs 20 m apart (A, B, C), range 25 m, all on channel 6: pairs A–B and B–C are CCI; airtime A ½, B ⅓, C ½. Derived, unchecked.
  2. `one-six-eleven` — same row on 1 / 6 / 11: no conflict, each AP 1 (full airtime). Derived from rule 1.
  3. `one-three-six` — the "spread them out" mistake, 1 / 3 / 6: A–B (Δ 10 MHz) and B–C (Δ 15 MHz) overlap, A–C out of range; all three warned. Derived.
  4. `four-in-a-square` — APs at the corners of a 20 m square, 1 / 6 / 11 / 1, range 30 m: diagonal A–D (28.3 m) is in range, CCI, airtime A ½ and D ½. Lower the range to 25 m and the conflict disappears ("turn the power down"). Derived.
  5. `five-ghz-80` — square, 5 GHz 80 MHz, 42 / 58 / 106 / 122, range 60: no conflict, three of the four blocks marked DFS (58, 106, 122). Derived from rule 2–3.
  6. `five-ghz-160` — same square at 160 MHz: only 50 and 114 exist, so two pairs share; airtime ½ each, all DFS (both blocks overlap DFS sub-bands). Derived.
- **Steps:** none (explorer).
- **Legend:** AP and its spectrum block (series colour per AP plus its letter), co-channel pair (solid thick line, "⇄ dijele"), overlap pair (zig-zag line, warn + ⚠), no conflict (no line), DFS sub-band (hatched). "Changed" marks the AP whose channel or width just changed and every pair whose kind changed.
- **Captions:**
  - hr: "A i B su na istom kanalu 6 i čuju se: CSMA/CA ih tjera da se izmjenjuju, pa svaki dobije pola vremena u eteru."
  - en: "Channels 1 and 3 overlap by 10 MHz: the two APs do not wait for each other and corrupt each other's frames. Use 1, 6 and 11."
- **Terms:** channel — kanal; frequency band — frekvencijski pojas; access point — *access point* (pristupna točka) (the book keeps the English term in italics); co-channel interference — smetnje na istom kanalu *(check)*; adjacent-channel interference — smetnje susjednog kanala *(check)*; channel width / bonding — širina kanala / spajanje kanala *(check)*; dynamic frequency selection — dinamička selekcija frekvencije (DFS).
- **Misconceptions:** (1) "Spread channels evenly, 1/3/6/9": partial overlap is worse than sharing a channel. (2) "Wider is always faster": in a dense floor the 160 MHz plan leaves two channels for four APs. (3) "More transmit power fixes coverage": it widens CCI too (preset 4).
- **Out of scope:** 6 GHz channel plan (mention LPI/VLP from the book only); 2.4 GHz channel 14; signal strength and SNR maths (`wifi-roaming`); hidden node and RTS/CTS (`net-csma-ca-rts-cts`); automatic channel selection algorithms.
- **Note for the coordinator:** URM ch17 has no 2.4 GHz channel plan, no 1/6/11 rule and no channel widths, so rules 1, 2, 6–8 rest on IEEE 802.11/ETSI only and need a check against the standard text. The airtime model (rule 7) is a teaching simplification.
<!-- model: filled -->

## Steps

1. `kit/new-sim.sh wifi-channels sims/wifi-channels` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/wifi-channels/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
