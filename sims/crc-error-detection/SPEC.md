<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# crc-error-detection: specification

One concept: **how a CRC catches burst errors where parity fails.** Task `docs/tasks/w3/crc-error-detection.md`,
catalogue `net-crc` (§4.1). Class: stepper.

## Scene

- **Left, the frames.** The sender sends the same 10-bit message twice: once with one even parity bit P (the
  parity frame, 11 bits) and once with the CRC's FCS (the CRC frame, 10 + r bits). Below a "line" bar, the receiver's
  copy of both frames. Message bits are tinted `--c1`; check bits (P, FCS) `--c2` with a double border, after a gap.
- **Right, the long division modulo 2** (shift-and-XOR), row by row: the dividend, then per row the generator under
  its window (⊕) and the register it leaves. In the last step it is the receiver's division of the received frame.
- Clicking a message bit at the sender changes the message; clicking one at the receiver toggles an error on the
  line at that position. The same changes are sliders in the panel ("Message", "Error pattern"), shown as bits.

Bits are numbered from 0 at the left: bit 0 is the most significant and is sent first.

## Parameters

| key | values | default | notes |
|---|---|---|---|
| `gen` | `10011` (CRC-4, x⁴+x+1), `1011` (CRC-3, x³+x+1), `100000111` (CRC-8, x⁸+x²+x+1) | `10011` | resets the demo |
| `data` | 0 … 1023, the 10 message bits | 863 = `1101011111` | resets the demo |
| `flip` | 0 … 1023, a mask of message bits the line flips (the error pattern) | 0 | keeps the step |

## Rules

1. **Even parity** (50ohm `fehlererkennung.md`): the check bit P is set so that the number of 1s in message + P is
   even. The receiver recounts message + P; an odd count is an error.
2. **Parity's limit** (same source): parity detects every odd number of flipped bits and misses every even number
   (two flips restore the parity).
3. **CRC at the sender** (Peterson & Brown 1961; URM ch07 for the FCS as the frame's last field): append r = deg(generator) zero bits, divide
   modulo 2 by the generator (XOR, no borrows); the r-bit remainder is the FCS. The codeword is the message followed
   by the FCS.
4. **CRC at the receiver** (same): divide the whole received codeword by the same generator; remainder 0 → accept,
   non-zero → error detected. That an Ethernet frame failing its FCS is silently dropped is IEEE 802.3; URM ch07
   says it only of runts *(check)*.
5. **The guarantee** (Peterson & Brown *(check)*): a generator of degree r with a +1 (x⁰) term detects every
   burst error of length ≤ r and every single-bit error. "More than one term" (the task's wording) is not enough:
   x⁴ + x³ (`11000`) misses a 2-bit burst. All three generators offered have the +1 term. Tested exhaustively for CRC-4 over the 14-bit codeword; a
   burst of length r + 1 equal to the generator is missed.
6. **The blind spot**: the CRC misses exactly those errors whose pattern is itself a multiple of the generator
   (tested over all 2¹⁴ − 1 patterns of the default codeword). A zero remainder means "no error detected", not
   "correct".
7. **Tie-break / determinism**: the division goes left to right. At each position whose leading bit is 1 the
   generator is XORed in and a row is written; a leading 0 is only brought down (XOR with zeros changes nothing, so
   no row is written). The sequence of rows is therefore fixed by the dividend and the generator.
8. **The line** flips the chosen *message* bits in both frames alike; P and the FCS always arrive intact (a decision,
   NOTES.md). The receiver's parity and CRC checks run on what arrived.

Verdicts: `ok` (accepted, nothing was flipped), `detected` (the check failed), `missed` (accepted although bits
were flipped). Each is a symbol and a word: ✓ accepted, ⚑ detected, ✕ missed.

## Steps

Let k be the number of XOR rows of the sender's division.

| step | phase | what happens |
|---|---|---|
| 0 | `start` | message, P computed, dividend = message + r zeros |
| 1 … k | `divide` | one XOR row each: the window, the generator below it, the register it leaves |
| k + 1 | `sent` | the remainder is the FCS; both frames are sent |
| k + 2 | `line` | only when `flip` ≠ 0: the flipped bits arrive (✕) |
| k + 3 | `parity` | the receiver recounts the 1s with P |
| k + 4 | `crc` | the receiver divides the received codeword (all rows at once) and reads the remainder |

Steps = k + 1, or k + 4 with errors. At the defaults k = 5, so `sim.json` `steps` = 6. The longest run is
10 rows + 4 = 14 steps (rule tested over every message and generator).

## Presets and expected numbers

Checked with an independent Python script before coding (NOTES.md, Checks), then by `sim.test.js`.

| # | id | params | opens at | expected |
|---|---|---|---|---|
| 1 | `crc-build` | defaults | 0 | dividend `11010111110000`, 5 rows at positions 0, 1, 6, 7, 8; remainder `0010`; codeword `11010111110010`; 6 steps |
| 2 | `crc-catches-burst` | `flip` = bits 3–6 (120) | 6 | received `11001001110010`; remainder `0011` → detected; parity counts 6 → even → missed; 9 steps |
| 3 | `parity-catches` | `flip` = bit 3 (64) | 6 | received `11000111110010`; remainder `0111` → detected; parity counts 7 → odd → detected; 9 steps |
| 4 | `crc-blind-spot` | `flip` = bits 2, 5, 6 (152) | 6 | error pattern x¹¹ + x⁸ + x⁷ = x⁷ · (x⁴ + x + 1); received `11110001110010`; remainder `0000` → missed; parity counts 7 → detected; 9 steps |

The check presets open at the `sent` step (6), so the three receiver steps follow at once; ← goes back through the
division.

Other numbers used in tests: FCS of `1101011111` is `011` for CRC-3 (6 rows) and `10100101` for CRC-8;
`1000 ÷ 1011` gives one row `0011` (no borrow).

## Captions (examples)

- hr, step 9 of `crc-catches-burst`: "Ostatak dijeljenja je **0011**, različit od nule — CRC je otkrio pogrešku.
  Paritet je promašio jer su promijenjena 4 bita (paran broj)."
- en, step 8 of `parity-catches`: "The receiver counts the 1s with P: 7 ones, odd. Even parity flips to odd, so parity
  detected the error."

## Out of scope

CRC hardware (LFSR), the reflected / initial-value conventions of real CRC-32, the Internet checksum, error
correction (the Hamming preset belongs to `fec-hamming`, catalogue §5.13).
