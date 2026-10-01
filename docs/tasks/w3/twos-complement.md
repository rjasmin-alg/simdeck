# twos-complement: Two's complement and overflow

| | |
|---|---|
| Task | `twos-complement` (wave 3, Computer architecture, OS gaps and automata) |
| Catalogue entry | `arh-twos-complement` in `docs/catalogue.md` §4.9 |
| Kind | build a new simulator |
| Folder | `sims/twos-complement/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | ARH |
| Topic / tags / level | `architecture` / `number-representation` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **signed integers and the wrap**.

The student: add numbers, watch flags.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.9.

## Sources

- No local course material. Use *Intel 64 and IA-32 Architectures Software Developer's Manual*, Vol. 1, §3.4.3 "EFLAGS Register" (CF, OF, SF, ZF) and §4.2.1 "Integers"; *Arm Architecture Reference Manual* (NZCV flags); D. A. Patterson, J. L. Hennessy, *Computer Organization and Design*, §2.4 "Signed and unsigned numbers" and §3.2 (overflow). Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** two operand rows and a result row of n bit cells (n = 8 by default), each bit labelled with its
  weight (−128, 64, 32 … 1: the top bit's weight is negative); under each row the same bits read three ways:
  unsigned, signed (two's complement) and hex. Carries are drawn above the columns. A number wheel (circle of
  2ⁿ values, 0 at the top, unsigned outside, signed inside) shows where the sum lands and where it wraps. A
  flag panel: N, Z, C, V, each with its rule in one line.
- **State (explorer, derived from params):** `{ n, a, b, aBits, bBits, sumBits, carries[], unsigned: {a, b, r},
  signed: {a, b, r}, flags: {N, Z, C, V}, trueSum }`.
- **Params drive live:** changing a or b recomputes the row, the carries, the wheel arrow and the flags.
- **Rules** (Patterson & Hennessy, *Computer Organization and Design*, §2.4 and §3.2; processor manuals' flag
  definitions, see Sources):
  1. Bits → signed value: −b(n−1)·2ⁿ⁻¹ + Σ bᵢ·2ⁱ; range −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1 (8 bits: −128 … 127).
  2. The adder is the same for signed and unsigned: r = (a + b) mod 2ⁿ. Only the reading differs.
  3. C (carry) = carry out of the top bit: the unsigned result wrapped.
  4. V (overflow) = both operands have the same sign and the result's sign differs: the signed
     result wrapped. Equivalent: carry into the top bit ≠ carry out of it. C and V are independent.
  5. N = top bit of r; Z = (r = 0).
  6. Negation: −x = (~x) + 1. Edge case: −(−128) = −128 in 8 bits (V would be set).
  7. Input clamping: a and b are entered as signed values in range; the bit cells can also be clicked
     (custom stage control), which re-reads the value.
- **Params:** `width` choice 4 / 8 / 16 (default 8); `a` range −2ⁿ⁻¹…2ⁿ⁻¹−1 (default 100); `b` same
  (default 50); `view` choice signed / unsigned / both (default both).
- **Presets** (checked with a script):
  1. `overflow`: 100 + 50 → 0x64 + 0x32 = 0x96 = 150 unsigned, −106 signed; C = 0, V = 1, N = 1.
  2. `max-plus-one`: 127 + 1 → 0x80 = −128; V = 1, C = 0 (the wrap at the top of the signed range).
  3. `carry-not-overflow`: −1 + 1 → 0xFF + 0x01 = 0x00; C = 1, V = 0, Z = 1 (unsigned wrapped, signed
     answer correct).
  4. `both`: −100 + −50 → 0x9C + 0xCE = 0x6A = 106; C = 1, V = 1 (two negatives give a positive).
  5. `subtract`: 5 + (−3) → 0x05 + 0xFD = 0x02; C = 1, V = 0 (subtraction is addition of the complement;
     the carry here is not an error).
  6. `16-bit`: width 16, 30000 + 10000 → 0x9C40 = −25 536; V = 1 (the same wrap, later).
- **Steps:** explorer, none.
- **Legend:** bit 1 (filled) / 0 (hollow), sign bit (bold border, "−128"), carry dot, flag lit (filled with
  its letter) / clear (outline). "Changed" marks bits that differ from the previous parameter state and flags
  that toggled.
- **Captions:**
  - hr: „100 + 50 = 150 ne stane u 8 bitova s predznakom: rezultat 1001 0110 čita se kao −106. Oba pribrojnika
    su pozitivna, zbroj je negativan → zastavica V (preljev).“
  - en: "100 + 50 = 150 does not fit in 8 signed bits: 1001 0110 reads as −106. Both operands positive, result
    negative → the V (overflow) flag."
- **Terms:** two's complement — dvojni komplement (check); sign bit — bit predznaka; overflow — preljev; carry
  — prijenos; flag — zastavica; signed / unsigned — s predznakom / bez predznaka; wrap-around — omatanje
  (check).
- **Misconceptions:** carry means overflow (presets 3 and 5); the CPU knows whether a number is signed (the
  same adder, only the flags are read differently); the sign bit is just a minus sign (it has weight −128).
- **Out of scope:** multiplication/division, one's complement and sign-magnitude (one line in the
  explanation), the two carry conventions processors use for subtraction (carry vs borrow), BCD.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh twos-complement sims/twos-complement` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/twos-complement/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
