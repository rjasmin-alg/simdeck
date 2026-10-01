# crc-error-detection: Error detection with CRC

| | |
|---|---|
| Task | `crc-error-detection` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-crc` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/crc-error-detection/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM, HAM |
| Topic / tags / level | `networks` / `error-detection` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **how a CRC catches burst errors where parity fails**.

The student: flip bits, compute parity and CRC.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/fehlererkennung.md` (50ohm, CC BY-SA): parity bit (even/odd), worked byte examples, why one flipped bit is caught and two are missed, and that CRC is used for variable-length data (keep attribution, COMMON.md §9)
- `/home/rjasmin/projects/50ohm-contents-hr/contents/sections/fehlerkorrektur.md` (50ohm): Hamming code with four parity bits over overlapping regions — the host for the `fec-hamming` preset (`ham-fec-hamming`, catalogue §5.13)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` "Građa Ethernet okvira i MAC adresa" (FCS = 4-octet frame check sequence; a frame failing it is silently dropped) — the real-world use of CRC in Ethernet
- W. W. Peterson, D. T. Brown, "Cyclic Codes for Error Detection", Proc. IRE, 1961 (polynomial division over GF(2), burst-error guarantee) *(check: cited from textbooks, no local copy)*
- Generator polynomials: CRC-4 x⁴+x+1 = `10011` (teaching example); CRC-32 = Ethernet FCS *(check)*
- Catalogue seed: → §5.13

## Overlaps (catalogue §5)

- **§5.13 Error detection and correction:** One page, parity → CRC → Hamming as steps.

## Model and presets

- **Scene:** a **bit strip** for the message, a divisor box showing the generator polynomial, and the long
  division worked out row by row below (shift-and-XOR), with the remainder appended as the FCS. Above it a
  parallel **parity** strip (one check bit) for the same message, so the student sees both schemes on one
  error. A "flip bits" layer lets the student click bits to inject an error on the received side. Uses the
  kit's bit/field strip view (§7.2) if it exists; otherwise its own (say so in NOTES.md).
- **State:** `{ mode: 'parity'|'crc'|'hamming', data: [0|1…], gen: [1,0,0,1,1], fcs: [..], codeword: [..],
  received: [..], flipped: [indices], step, division: [{row, bits}], syndrome: [..], verdict:
  'ok'|'detected'|'missed'|'corrected' }`. All derived from `data`, `gen` and `flipped`.
- **One step:** in build mode, one row of the long division (bring down the next bit; if the leading bit is 1,
  XOR the generator, else XOR zeros), until the remainder is the FCS. In check mode, one step flips the chosen
  bit(s), then one step divides the received codeword and reads the remainder (0 = accept, non-zero =
  detected). Order within a step: highlight the active window → XOR → show new remainder → caption.
- **Rules:**
  1. Parity (even): the check bit is set so the total number of 1s is even; the receiver recounts and flags an
     error if the count is odd (50ohm `fehlererkennung.md`).
  2. Parity catches any **odd** number of flipped bits and misses any **even** number (50ohm, same section).
  3. CRC: append r = deg(generator) zero bits, divide modulo 2 (XOR, no borrows) by the generator; the
     r-bit remainder is the FCS. The transmitted codeword = data followed by FCS (Peterson & Brown; Ethernet
     FCS, URM ch07).
  4. The receiver divides the whole received codeword by the same generator; remainder 0 → accept, non-zero →
     error detected (same).
  5. CRC with a generator of degree r whose polynomial has more than one term catches every burst error of
     length ≤ r, and every single- and (for a suitable polynomial) double-bit error (Peterson & Brown
     *(check)*).
  6. CRC misses exactly those errors whose bit pattern is itself a multiple of the generator (edge case; the
     `crc-blind-spot` preset shows one).
  7. Tie-break / determinism: the division always processes bits left to right; equal leading bits are handled
     by the "XOR generator only when the leading bit is 1" rule, so the sequence is fixed.
  8. Hamming (preset, see host note): 4 parity bits over overlapping bit regions; the failing parity checks
     spell the binary position of the single wrong bit, which is then flipped back → corrected (50ohm
     `fehlerkorrektur.md`).
- **Params:** `mode` choice `parity`|`crc`|`hamming` (default `crc`); `data` an editable bit string (default
  `1101011111`); `gen` choice `10011` (CRC-4) | `1011` (CRC-3) | `100000111` (CRC-8) (default `10011`);
  `flip` = click bits on the received strip (buttons), no fixed count.
- **Presets:**
  1. `crc-build` — data `1101011111`, generator `10011`: the long division gives remainder `0010`, so the
     codeword is `11010111110010` (5 XOR rows). From a checked script; the canonical worked example.
  2. `crc-catches-burst` — flip a 4-bit burst in `11010111110010` (bits 3–6) → received `11001001110010`,
     remainder `0011` ≠ 0, detected; parity (even number of flips) says "ok" and misses it. Shows CRC winning
     where parity fails. Checked by script.
  3. `parity-catches` — flip one bit → remainder `0111` and parity odd: both catch it. Baseline. Checked.
  4. `crc-blind-spot` — flip bits 2,5,6 (a pattern equal to a generator multiple) → remainder `0000`, CRC
     **misses** it, but parity (odd flips) catches it. Rule 6; the honest edge case. Checked by script.
  5. `fec-hamming` — the Hamming preset from `ham-fec-hamming` (added by that task): flip one bit, the syndrome
     locates it, correct it. From 50ohm `fehlerkorrektur.md`.
- **Steps:** 6 (`crc-build`: 5 division rows + start), 8 (`crc-catches-burst`), 7 (`parity-catches`),
  8 (`crc-blind-spot`); Hamming preset counts owned by `fec-hamming`.
- **Legend:** data bits (c1), FCS / check bits (c2), the division window being XORed (highlight), flipped bits
  (danger, X marker), generator (ink); verdict shown as ok / detected / missed / corrected with an icon, not
  colour alone. "changed" marks the current division row and any newly flipped bit.
- **Captions:**
  - hr: "Ostatak dijeljenja je `0011`, različit od nule — CRC je otkrio pogrešku. Paritet je promašio jer su
    promijenjena četiri bita (paran broj)."
  - en: "Even parity flips to odd, so the single-bit error is caught by both the parity bit and the CRC."
- **Terms:** error detection — otkrivanje pogrešaka; parity bit — paritetni bit; even/odd parity — parni /
  neparni paritet; cyclic redundancy check — ciklička provjera redundancije (CRC); generator polynomial —
  generatorski polinom *(check)*; frame check sequence — provjera ispravnosti okvira (FCS); burst error —
  rafalna pogreška *(check)*; remainder — ostatak.
- **Misconceptions:** a zero remainder means the data is correct (it means no detectable error; rule 6);
  parity catches two-bit errors (it misses all even counts); CRC corrects errors (it only detects — correction
  is the Hamming preset); the FCS is a checksum you can read as data.
- **Out of scope:** CRC hardware (LFSR shift registers), the reflected/init-value conventions of real CRC-32,
  checksums (Internet checksum), and error correction beyond the single Hamming preset.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `crc-error-detection` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh crc-error-detection sims/crc-error-detection` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/crc-error-detection/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
