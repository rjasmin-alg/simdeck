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
| `gen` | `10011` (CRC-4, x⁴+x+1), `1011` (CRC-3, x³+x+1), `100000111` (CRC-8, x⁸+x²+x+1), `hamming15` (the Hamming run, below) | `10011` | the "Code" choice; resets the demo |
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

CRC hardware (LFSR), the reflected / initial-value conventions of real CRC-32, the Internet checksum. Error correction
is the Hamming run below (preset task `fec-hamming`, catalogue §5.13); extended Hamming (SECDED), Reed–Solomon,
convolutional codes and interleaving are out of scope.

## Hamming(15,11) (preset task `fec-hamming`)

One concept: **correcting one bit error with parity bits.** Task `docs/tasks/w3/fec-hamming.md`, catalogue
`ham-fec-hamming` (§4.10); §5.13 puts parity → CRC → Hamming on one page. The run is selected by the code choice's
fourth option, `gen = hamming15`; the CRC run above is unchanged.

### Scene

One grid, 15 columns for positions 1 … 15: the position and its binary index; the bit name (p1, p2, a, p3, b, c, d, p4,
e … k); the sent word; the line; the received word; four check rows (the 50ohm "crossword" bands: each covered
position is a tinted cell holding the bit, the rest is empty); the syndrome (↓ over the position it names); the
corrected word; the decoded data bits. A result column on the right: "5 ones → p1 = 1" while encoding, ✓ passes / ✕
fails with the count while checking, the syndrome `bin = n`, the wrong-bit count and the verdict. Parity bits are
squares with a double border (`--c2`), data bits circles (`--c1`); a flipped bit is hatched with a `--danger` border
and a ⚡. Clicking a data bit at the sender changes the data; clicking a received bit toggles an error on the line.

### Parameters

| key | values | default | notes |
|---|---|---|---|
| `hdata` | 0 … 2047, the data bits a … k (a most significant) | 1437 = `10110011101` | resets the demo |
| `hflip` | 0 … 32767, a mask of positions 1 … 15 the line flips (position 1 most significant) | 0 | keeps the step |

### Rules

Sources: 50ohm `fehlerkorrektur.md` (the 11-bit example: positions a … k, four parity bits in crossword areas, errors
in k, a and p1; more than one error not correctable) and `fehlererkennung.md` (even parity); R. W. Hamming, "Error
Detecting and Error Correcting Codes", *Bell System Technical Journal* 29(2), 1950.

- **H1. Even parity per check** (50ohm `fehlererkennung`): p_j makes the number of 1s over its covered positions even.
  The receiver recounts each group with its parity bit; even passes, odd fails. Zero 1s is even (tie-break).
- **H2. Coverage:** p_j (j = 1 … 4) sits at position 2^(j−1) and covers every position whose binary index has bit
  j − 1 set, itself included: p1 1, 3, 5, … 15; p2 2, 3, 6, 7, 10, 11, 14, 15; p3 4–7, 12–15; p4 8–15. Data bits
  a … k fill the other positions in order: 3, 5, 6, 7, 9 … 15.
- **H3. Syndrome** = Σ 2^(j−1) over the failed checks, read p4 p3 p2 p1 (p1 the lowest bit, tie-break). 0 = no error
  found; otherwise it is the position of the single flipped bit, data or parity (50ohm: k fails all four, a fails p1
  and p2, p1 fails only p1).
- **H4. Correction** flips the position the syndrome names back. Syndrome 0 changes nothing (there is no position 0).
- **H5. Two errors** give a non-zero syndrome (a ⊕ b) that points at a third, correct bit: the decoder "corrects" it
  and the word now has three wrong bits (50ohm: more than one error cannot be corrected). Tested over every pair;
  over all 2¹⁵ − 1 patterns, one flip is always corrected and two or more always leave the data wrong (after the
  decoder's flip the remaining errors XOR to 0, so they are never parity bits alone). Three errors can give syndrome
  0 (1 ⊕ 2 ⊕ 3) and pass unseen.
- **Duplicates** in a flip list count once.

Verdicts at the end: `ok` (✓, nothing flipped), `corrected` (↺, flips, and the data came back right), `wrong` (✕, the
decoded data differ from the original). Each is a symbol, a word and a border style.

### Steps (13 for every word and pattern)

| step | phase | what happens |
|---|---|---|
| 0 | `start` | the 11 data bits wait; the 15 positions are empty |
| 1 | `place` | a … k go to positions 3, 5, 6, 7, 9 … 15 |
| 2 … 5 | `parity` | p1 … p4, one per step: its band lights, the index bit is marked, "n ones → p_j = v" |
| 6 | `sent` | the code word is sent |
| 7 | `line` | the flipped positions arrive (⚡) |
| 8 … 11 | `check` | the receiver recounts p1 … p4 on the received word, one per step |
| 12 | `syndrome` | the syndrome is read and the named position flipped back |
| 13 | `compare` | the decoded data against the original, the wrong-bit count, the verdict |

### Presets and expected numbers

Data `10110011101` (the task's choice; the 50ohm figures are not in the repo), code word `111101100011101`
(p1 = 1, p2 = 1, p3 = 1, p4 = 0; without the parity bit p1 … p4 cover 5, 5, 5, 4 ones). Checked with an
independent Python script (NOTES.md), then by `sim.test.js`.

| # | id | `hflip` | opens at | expected |
|---|---|---|---|---|
| 5 | `hamming-k` | position 15 (1) | 0 | received `111101100011100`; ones 5, 5, 5, 3; all four fail; syndrome 1111 = 15; corrected |
| 6 | `hamming-a` | position 3 (4096) | 6 | ones 5, 5, 6, 4; p1, p2 fail; syndrome 0011 = 3; corrected |
| 7 | `hamming-p1` | position 1 (16384) | 6 | ones 5, 6, 6, 4; only p1 fails; syndrome 1; the parity bit is corrected, data never wrong |
| 8 | `hamming-two` | positions 3, 5 (5120) | 6 | ones 6, 5, 7, 4; p2, p3 fail; syndrome 0110 = 6 → c flipped; decoded `01010011101`; 3 wrong bits |

The last three open at the sent word, so the error, the four checks and the correction follow at once; ← goes back
through the encoding. All four presets set `gen = hamming15`.

### Captions (examples)

- hr, step 12 of `hamming-a`: "Ne prolaze provjere p1 i p2: sindrom je 0011 = 3. Pogreška je u bitu a na položaju 3;
  ispravljamo ga."
- en, the same: "Checks p1 and p2 fail: the syndrome is 0011 = 3. The error is in bit a at position 3; we flip it back."

### Misconceptions addressed

Parity bits are never wrong (preset 7); a code that corrects one error also detects two (preset 8: plain Hamming
miscorrects; one extra overall parity bit would detect it, one line in the explanation); FEC replaces retransmission
(the explanation: it only reduces it).
