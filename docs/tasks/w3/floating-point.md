# floating-point: IEEE 754

| | |
|---|---|
| Task | `floating-point` (wave 3, Computer architecture, OS gaps and automata) |
| Catalogue entry | `arh-floating-point` in `docs/catalogue.md` §4.9 |
| Kind | build a new simulator |
| Folder | `sims/floating-point/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | ARH |
| Topic / tags / level | `architecture` / `number-representation` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **sign/exponent/mantissa; why 0.1 + 0.2 ≠ 0.3**.

The student: toggle bits, type numbers.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.9.

## Sources

- No local course material. Use *IEEE Std 754-2019, IEEE Standard for Floating-Point Arithmetic*, §3.4 (binary interchange encodings), §4.3 (rounding-direction attributes, roundTiesToEven), §5.1; D. Goldberg, "What Every Computer Scientist Should Know About Floating-Point Arithmetic", *ACM Computing Surveys* 23(1), 1991, §1.1–1.2. Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** a bit strip for one value: sign (1), exponent (8 for binary32, 11 for binary64), fraction
  (23 / 52), each group in its own colour band and label; under it the decoding written out:
  (−1)^s × 1.f × 2^(e − bias), the stored exponent, the unbiased exponent, the exact decimal value of the
  stored number (all digits) and the gap to the next representable number (ULP). A second panel "sum"
  shows a + b → the exact sum, the rounded result, and the comparison with the nearest double to the
  decimal the student expected.
- **State (explorer, derived from params):** `{ format, bits: '0…1', sign, expStored, expUnbiased, fraction,
  kind: 'normal'|'subnormal'|'zero'|'inf'|'nan', exact: decimal string, ulp, sum: {a, b, exactSum, rounded,
  expected, equal} }`.
- **Params drive live:** clicking a bit (stage control) or choosing a value re-decodes; the sum panel
  recomputes from its two operands.
- **Rules** (IEEE Std 754-2019, §3.4 "Binary interchange format encodings", §4.3 rounding; D. Goldberg,
  "What Every Computer Scientist Should Know About Floating-Point Arithmetic", ACM Computing Surveys 1991):
  1. binary32: bias 127, binary64: bias 1023. Normal (1 ≤ e ≤ max−1): value = (−1)^s × (1 + f/2^p) × 2^(e − bias)
     with p = 23 or 52.
  2. e = 0, f = 0: ±0 (two zeros, equal). e = 0, f ≠ 0: subnormal, value = (−1)^s × (f/2^p) × 2^(1 − bias).
  3. e = all ones: f = 0 → ±∞, f ≠ 0 → NaN (NaN ≠ NaN).
  4. A decimal input is rounded to the nearest representable value, ties to even (the default rounding
     attribute, §4.3.3).
  5. Each operation rounds its exact result once (correct rounding, §5.1); 0.1 + 0.2 is the rounded sum of two
     already-rounded inputs.
  6. Exact decimal display: every binary fraction has a finite decimal expansion; show all its digits (use
     BigInt arithmetic, not `toFixed`).
- **Params:** `format` choice binary32 / binary64 (default binary64 for the sum, binary32 for bit toggling: the
  strip of 64 bits must still fit, so binary64 shows the fraction in two rows); `value` select of the presets'
  values plus bit clicks; `a`, `b` select (0.1, 0.2, 0.3, 1, 1e16 …).
- **Presets** (checked with a script):
  1. `point-one`: 0.1 in binary32 = 0x3DCCCCCD: s 0, e 123 (−4), f 5033165; exact value
     0.100000001490116119384765625 (not 0.1).
  2. `sum-64`: binary64 0.1 + 0.2 = 0x3FD3333333333334 = 0.3000000000000000444…, while 0.3 is
     0x3FD3333333333333 = 0.2999999999999999888…: one ULP apart (5.55e−17), so `0.1 + 0.2 == 0.3` is false.
  3. `sum-32`: the same in binary32: 0.1f + 0.2f = 0x3E99999A = 0.3f, equal. Rounding happens to land on
     the same number: "≠" is not a law, it depends on format and values.
  4. `one-and-next`: 1.0 = 0x3F800000; flip the last fraction bit → 1.00000011920928955078125 (ULP 2⁻²³).
  5. `specials`: 0x7F800000 = +∞, 0x7F7FFFFF = 3.4028234663852886e38 (largest normal), 0x00800000 =
     1.17549435e−38 (smallest normal), 0x00000001 = 1.4e−45 (smallest subnormal).
  6. `big-plus-one`: binary32 16 777 216 + 1 = 16 777 216 (2²⁴: the ULP is 2, the 1 is rounded away).
- **Steps:** explorer, none.
- **Legend:** sign / exponent / fraction bands (colour plus label "s", "e", "f"), bit 1 filled / 0 hollow,
  special-value badge (∞, NaN, subnormal) in text. "Changed" marks bits flipped since the last state.
- **Captions:**
  - hr: „0.1 nije točno prikaziv u binarnom zapisu: spremljena vrijednost je 0.1000000000000000055511…
    Zbroj 0.1 + 0.2 zaokružuje se na broj koji je za jedan ULP veći od 0.3.“
  - en: "0.1 cannot be stored exactly in binary: the stored value is 0.1000000000000000055511… The sum
    0.1 + 0.2 rounds to the number one ULP above 0.3."
- **Terms:** floating point — pomični zarez (check); sign / exponent / mantissa (significand) — predznak /
  eksponent / mantisa; bias — pomak (check); rounding — zaokruživanje; subnormal — subnormalni (denormalizirani)
  broj; ULP — jedinica na zadnjem mjestu (ULP) (check); NaN — keep "NaN".
- **Misconceptions:** floats are inexact random noise (each value is an exact binary fraction; the error is
  in the conversion and the rounding); 0.1 + 0.2 ≠ 0.3 always (preset 3); bigger numbers are as precise as
  small ones (preset 6).
- **Out of scope:** decimal formats, fused multiply-add, rounding modes other than ties-to-even, signalling
  NaN payloads, x87 extended precision.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh floating-point sims/floating-point` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/floating-point/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
