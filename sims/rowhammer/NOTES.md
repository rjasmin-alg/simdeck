<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# rowhammer: notes

Adopted from `single-page-labs/rowhammer.html` (task `docs/tasks/w1/rowhammer.md`, catalogue `spl-rowhammer`). The first
commit on the branch is the original copied as-is (sha256 `a34a91d5ec7a…`); the simdeck copy is canonical from here on.

## Decisions

- **Class `explorer`**, as the catalogue says ("import as `expl`"). The original was a real-time loop: press HAMMER, a
  `setInterval` adds activations, and `Math.random` flips victim bits once the count passes 60 % of the threshold.
  simdeck needs a pure model, so the bank is now a function of the params: drag the activations and the flips appear
  live. The original's animation (pulsing aggressor cells, a jumping capacitor) is gone; its four-phase indicator
  (idle, activate, disturb, flip) stays, now driven by the params.
- **Params:** activations per aggressor row in one 64 ms refresh window (0–120 000; the original's "hammer frequency"
  times time, with the rate per ms shown as a stat), the weakest cell's threshold (4 000–50 000; the original's "flip
  threshold"), pattern (single- or double-sided), mitigation (none, 2× refresh, TRR, ECC), and bank size
  (5 × 8, 9 × 16, 11 × 24). The original's two sliders for rows and cells became one size choice so the panel fits at
  1920×1080; cells per row are whole 8-cell ECC words.
- **Presets (keys 1–7):** single-sided, double-sided (same 30 000 activations: 1 flip against 7), 2× refresh, TRR,
  TRR on a weak chip (threshold 6 000: TRR's cap of 8 000 per aggressor is not enough), ECC, ECC at 90 000.
- **Model** (`sim.js`, pure, ready for `models/`):
  - aggressors: single-sided the middle row; double-sided the rows on either side of it (the original's layout);
  - each non-aggressor row's disturbance = effective activations × number of adjacent aggressors (so double-sided
    also disturbs the outer neighbours once, which the original did not show);
  - each cell's threshold = chip threshold × (1 + 3u), u from a fixed integer hash of its position, so the weakest
    cell flips at the set threshold and the strongest near 4×; the stored data comes from the same hash;
  - a cell flips when it holds 1 and its row's disturbance ≥ its threshold (a tie flips); it then reads 0;
  - 2× refresh halves the activations before a refresh; TRR caps them at 8 000 per aggressor (neighbours refreshed);
    ECC (SECDED per 8-cell word) changes what is read: 1 flip corrected, 2 detected, 3+ may pass as good;
  - phase: idle at 0 activations, flip with any flip, disturb when the largest disturbance ≥ 40 % of the threshold
    (the original's 40 % step), activate otherwise.
- Bit values, row numbers and counts are data (`translate="no"`); numbers are grouped with a narrow no-break space in
  both languages.

## Deviations from the original

1. **Flips are 1 → 0 only:** disturbance drains charge, so only charged cells lose their bit. The original flipped
   both ways at random. *(check)* Real chips also have anti-cells (charged = 0), which flip 0 → 1; the explanation
   keeps the model simple and does not mention them.
2. **Deterministic:** no `Math.random`; which cells flip depends on their position-derived threshold.
3. **Mitigations are now controls,** not only a text card; PARA and DDR5 refresh management stay in the explanation.
4. **Concepts, not tools (COMMON.md §1), and no how-to:** dropped the CVE number in the subtitle, the "CVE timeline"
   card (named research attacks and a named company team), and the exploitation card's specifics (the cache-flush
   instruction, the page-map file, huge pages, targeting page-table entries). The explanation keeps the concept:
   isolation assumes memory keeps what was written, and disturbance breaks that. The "PTE corruption possible" log
   line went with it.
5. **Dropped:** the event log (with wall-clock time stamps) became the caption; the noise overlay, gradients and glow;
   Google Fonts (JetBrains Mono, Space Grotesk, IBM Plex Sans), now the kit fonts. No other network loads existed.
6. **Original numbers kept:** 64 ms refresh window, ~20 fF cell, sub-30 nm coupling, ACT/PRE. The TRR cap (8 000), the
   threshold spread (1–4×) and the default threshold (20 000) are the model's own and illustrative; the explanation
   says so.

## Colour and shape

Aggressor rows: `--c2` tint, solid left bar, "A ·" label. Victim rows: `--c4` tint, dashed left bar, "V ·" / "Ž ·".
Bit 1: filled `--c1`; bit 0: dashed hollow; flipped: highlighter + thick ink border, and the digit. Word status is a
symbol (✓ corrected, ! detected, ✗ wrong or beyond SECDED), keyed under the bank. The disturbance bar marks the
weakest-cell threshold with a dashed line and turns `--danger` past it, with the number beside it. Checked in the
grayscale screenshots.

## Sources

- The original page (model, layout, numbers, the four explanation cards).
- Kim et al., "Flipping Bits in Memory Without Accessing Them" (ISCA 2014): disturbance errors, the 64 ms window,
  double-sided activation. *(check)* Thresholds of tens of thousands of activations per window are the order of
  magnitude reported for recent DDR4; the page does not claim a specific chip.
- SECDED: corrects one, detects two errors per word (standard Hamming plus parity).

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| activation (of a row) | aktivacija (retka) |
| aggressor row | agresorski redak |
| victim row | redak žrtva |
| disturbance | smetnja |
| bit flip | preokret bita |
| refresh / refresh window | osvježavanje / prozor osvježavanja |
| target row refresh (TRR) | ciljano osvježavanje retka |
| error-correcting code (ECC) | kod za ispravljanje pogrešaka |
| refresh management | upravljanje osvježavanjem |
| sense amplifier | osjetilno pojačalo |
| single-sided / double-sided | jednostrano / dvostrano |

*(check)* No Croatian course book in reach covers DRAM disturbance; these are descriptive Croatian terms. "Rowhammer"
stays English in both languages.

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"` (several overlap `sram-dram`'s list).
- **Vocabulary:** the task file names topic `radio`; that looks like a slip (Rowhammer is DRAM, like `sram-dram`, and
  the course task lists it under computer architecture). Used `architecture`, tags `attacks`, `memory`.
- **Related:** `sram-dram` is set; add `spectre-meltdown` once it exists (and `rowhammer` to `sram-dram`'s `related`).

## Checks not done here

- A real projector and a lecturer at the page.
- Every model rule was broken once (tie at the threshold, 0-cells never flip, ECC boundaries, TRR cap, 2× refresh,
  ECC wrong-word rule, single-sided aggressor position, the 40 % phase step) and each made a test fail. The
  "aggressors take no disturbance" special case could not fail (no pattern puts aggressors side by side) and was
  removed; the test that aggressor rows stay intact remains.

## Time

Start 2026-10-02 07:49, done 08:02 (about 15 minutes, one session).
