<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# sram-dram: notes

Adopted from `single-page-labs/sram-dram.html` (task `docs/tasks/w1/sram-dram.md`, catalogue `spl-sram-dram`). The first
commit on the branch is the original copied as-is (sha256 `c972f9e8e780…`); the simdeck copy is canonical from here on.

## Decisions

- **Class `stepper`, 13 steps** (the catalogue says "import as `step`"). The original was three tabs of free buttons
  (SRAM: write 1/0, read, idle; DRAM: write 1/0, read, start leakage, refresh) and a comparison table, with a real-time
  leak timer and `setTimeout` write-backs. simdeck needs a pure step model and one screen, so the two cells now stand
  **side by side and take the same operations**: write, read, write-back, wait 32 ms × 2, refresh (or skip it), wait
  32 ms × 2, read, write-back, write the other bit, read, write-back. This keeps every operation the page had and makes
  the "vs" visible at each step.
- **Params:** `bit` (the first bit written, 1 or 0), `refresh` (whether the refresh at 64 ms happens), `view` (the
  cells, or the comparison table on the stage). **Presets:** 1 write 1 with refresh, 2 write 1 without refresh (the
  DRAM 1 reads as 0 at 128 ms and the write-back makes the loss permanent), 3 write 0 without refresh (nothing to lose),
  4 the comparison table.
- **The original's three tabs:** the SRAM and DRAM tabs became the two cell cards; the comparison tab became the `view`
  choice (all 16 rows kept); the info cards ("theory", "memory hierarchy", "security", "emerging memories") became
  the explanation ("Ideja"), shortened but with the original's numbers. The operation log became the caption.
- **The charge chart** keeps the original's "refresh timeline" idea: the DRAM charge over 0–128 ms with the V_DD/2
  sense threshold and the 64 ms window.
- **Original numbers kept:** V_DD 1.2 V, C_s 20 fF, C_BL 200 fF, bitline precharged to V_DD/2, refresh window 64 ms,
  tREFI 7.8 µs, the comparison table's figures, sense threshold "charge > 50 % reads 1" (tie at exactly V_DD/2 → 0).
- Signal and part names (WL, BL, BL̄, Q, P1…N4, C_s, SA), voltages, percentages and times are data (`translate="no"`).
  The cell functions (`leak`, `share`, `deltaV`, `sense`) are pure over numbers, ready for `models/` if `rowhammer`
  wants them.

## Deviations from the original's model (physics fixes) *(check)*

1. **Leakage drains toward GND, not toward V_DD/2.** The original moved a 0 *up* toward 50 % ("leak toward the
   midpoint, V_DD/2 cell plate voltage"). Junction and sub-threshold leakage (the original's own info card) drain the
   storage node, so a stored 1 decays and a stored 0 stays 0: refresh matters for the charged cells. Preset 3 shows it.
2. **Leak rate is the model's own:** 0.5 % of V_DD per ms, linear, so a full cell reaches V_DD/2 after 100 ms: inside
   the 64 ms window a read is safe, past it the bit is lost by 128 ms. The original leaked 0.8 % per 100 ms tick of
   wall-clock time. The explanation says the rate is illustrative (real cells hold tens of ms to seconds).
3. **Charge sharing:** after a read the original set the cell to `charge × 20/220` (≈ 9 %). Physically the cell and
   the bitline settle at one voltage, `(C_s·V_cell + C_BL·V_DD/2)/(C_s + C_BL)`: 54.5 % from a full cell, 45.5 % from
   an empty one. The cell is still destroyed (its level is gone), which is the point the original made.
4. **Bitline swing is signed:** ΔV = (V_cell − V_DD/2)·C_s/(C_s + C_BL), ±54.5 mV for a full or empty cell. The
   original showed `charge × 0.055 V`, which gave 0 V for an empty cell; its info card wrote the unsigned
   `V_cell × C_s/(C_s + C_BL)`. The explanation now writes the signed form.
5. **Dropped:** the "power-on read → metastable" message (a read before any write); the start caption says the latch
   settled into an unknown state instead. The "charge below sense threshold, bit flip imminent" warning became the
   "bit lost" tag (hatched, dashed card, ✗), shown whenever a read now would give the wrong bit.

## Colour and shape

SRAM is `--c1` with a round marker, DRAM `--c2` with a square one; every value is also written out. "Changed" is the
kit's highlight plus outline (the op name, Q on a write, the charge value, the swing on a read). A lost bit is a dashed,
hatched card with "✗ bit lost". WL low is dashed, high is solid and thick; a driven bitline is thick. Checked in the
grayscale screenshots.

## Sources

- The original page (model, numbers, wording of the step boxes, info cards and the comparison table).
- Charge sharing and the signed swing: the standard 1T1C read equation, the same quantities as the original's info card.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| SRAM, static memory | statička memorija |
| DRAM, dynamic memory | dinamička memorija |
| latch | bistabil |
| cross-coupled inverters | unakrsno spregnuti invertori |
| access transistor | pristupni tranzistor |
| wordline | linija riječi |
| bitline | linija bita |
| sense amplifier | osjetilno pojačalo |
| precharge(d) | predpunjenje, predpunjena |
| write driver | upisni pokretač |
| charge sharing | dijeljenje naboja |
| destructive / non-destructive read | razorno / nerazorno čitanje |
| write-back (restore) | povratni upis |
| refresh | osvježavanje |
| leakage | curenje |
| retention time | vrijeme zadržavanja |
| memory wall | zid memorije |

*(check)* No Croatian course book in reach covers memory cells; these are the usual Croatian electronics terms.

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **Related:** once `rowhammer` and `spectre-meltdown` exist, add them to `related` (both are named in the explanation).

## Checks not done here

- A real projector and a lecturer with a clicker.
- Every rule was broken once (sense tie, leak floor, write-back of the sensed bit, charge sharing, leak rate, refresh
  toggle, window boundary, SRAM write) and each made its tests fail.

## Time

Start 2026-10-02 07:32, done 07:45 (about 15 minutes, one session).
