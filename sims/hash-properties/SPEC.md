<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# hash-properties: specification

One concept: **a hash function's fixed length, avalanche effect, integrity and collisions.** The student changes one
character and compares the two digests; beside them a toy hash shows how soon a short digest repeats.

Task: `docs/tasks/w2/hash-properties.md`. Catalogue: `sec-hash-properties` (`docs/catalogue.md` §4.3).
Class: explorer (no steps). Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[FIPS]** FIPS 180-4, *Secure Hash Standard*: SHA-256 (§6.2), digest length 256 bits; constants K and H(0)
  (§4.2.2, §5.3.3). Test vectors "abc" and the 448-bit message from FIPS 180-2 Appendix B.1 and B.2.
  *(check: the standard itself was not re-read for this task; the constants are the well-known ones and the code
  reproduces both appendix vectors and Python `hashlib` on every input below, which is the check that matters.)*
- **[UL23]** `uvod-u-linux/book/chapters/23-odrzavanje-sustava.md`, „Sigurnosne kopije i oporavak", the `sha256sum`
  restore check: „Isti sažetak, dakle ista datoteka". Term *sažetak*.
- **[UL09]** `uvod-u-linux/book/chapters/09-paketi-i-repozitoriji.md`: *kontrolni zbroj* (a package's file checksum).
- **[PY]** Python 3 `hashlib.sha256`, run 2026-10-22 on this machine: every digest, bit count and collision below.
- **[TXT]** Textbook: avalanche (about half the bits), pigeonhole, birthday bound √(π/2 · 2ⁿ). *(check: no course
  chapter covers hash functions; the bound is the standard expected value of the first repeat.)*

## Scene

- **Left: inputs A and B.** Each card: name and length in bytes (UTF-8), a text box, the label "Sažetak SHA-256 ·
  256 bitova = 64 heksadekadska znaka", the digest as 64 hex characters (two lines, groups of 8), and the digest as a
  16 × 16 bit grid. B's card shows "↵ + znak novog retka" when the newline toggle is on.
- **Bit grid:** bit 1 is a filled square, bit 0 a dashed hollow square; a bit that differs between A and B gets a thick
  ink border and a highlighter ring inside it (fill or hollow still visible in the middle). Both grids mark the same
  positions.
- **Under A and B:** "122 od 256 bitova se razlikuje", a meter of 256 with a dashed mark at half, the verdict
  (= isti sažetak: ulaz je (gotovo sigurno) isti / ≠ različit sažetak; "almost certainly" because rule 5 says
  collisions exist) and the one-way line: no way back, only guessing (rule 4).
- **Right: toy hash.** Title with the width, the messages fed („poruka 1" … „poruka n"), counters (messages,
  possible values 2ⁿ, values taken, collisions = repeats, expected first collision), the first collision pair with
  the same ◆ on both rows, and for 8 bits a map of all 256 values (taken: filled; taken twice or more: striped with
  an ink border; the first collision's value: ink border and ◆; its key says "value taken", "value hit twice or
  more", "first collision"). For 16 bits the map would have 65 536 cells, so a
  bar of values taken replaces it.

## Params

| key | control | values | default |
|---|---|---|---|
| `a` | page text box (no kit control) | any text; the box allows 120 UTF-16 units (an emoji takes 2) | `abc` |
| `b` | page text box | as `a` | `abc` |
| `newline` | toggle | adds `\n` to B before hashing | off |
| `toyBits` | choice | 8, 16 | 8 |
| `toyCount` | range | 1 … 600 | 30 |

The kit has no text param, so `a` and `b` are model params set by the page's boxes (`sim.set`); they are not in the
URL (NOTES.md, Shared requests); the page keeps them across a reload, including the language switch, in session
storage, restored only into the same address. The kit specs carry `value` so a bad URL value falls back to the
default.

## State

`initial(params)` returns `{ a, b, bytesA, bytesB, digestA, digestB, diffBits, diff, edit, toyBits, toyInputs,
toySize, toyFirstCollision, toyDistinct, toyRepeats, toyLast, toyExpected, toyMap }`. `b` is the string hashed
(with the newline when on). `diff` lists the differing bit indices in rule-6 order; `diffBits` is its length.
`toyFirstCollision` is `{ i, j, value }` or null. `toyMap` is 256 counts for 8 bits, null for 16. No steps.

## Rules

1. **Fixed length.** Any input, empty included, gives 256 bits = 64 hex characters [FIPS].
   Test: `rule 1` (lengths 0, 1, 3, 55, 56, 64, 120 characters and UTF-8, crossing the one-block padding edge).
2. **Deterministic.** The same input always gives the same digest; that is why integrity checks work [UL23].
   Test: `rule 2`.
3. **Avalanche.** One changed character flips about half of the 256 bits; the page shows the count, never a promise
   of exactly 128 [TXT], numbers [PY]. Test: `rule 3`.
4. **One-way.** The page offers no reverse; the explanation says the input can only be guessed, which password
   storage builds on (the `password-storage` sim does not exist yet, so no link). Test: `rule 4` (no inverse in the
   model).
5. **Collisions must exist** (infinitely many inputs, 2²⁵⁶ outputs, pigeonhole). For an n-bit hash the first is
   expected after about √(π/2 · 2ⁿ) inputs: 20.05 → ≈ 20 for 8 bits, 320.8 → ≈ 321 for 16, 82 137 → ≈ 82 000 for 32
   [TXT]. Test: `rule 5`; pigeonhole: 257 messages into 256 values give at least one repeat.
6. **Bit order** for the grid and the diff: digest bytes left to right, most significant bit first (task decision).
   Index 0 is the top-left cell, 255 the bottom-right. Test: `rule 6`.

**Toy hash.** Message i is the string `poruka i` (UTF-8), in both languages, because the numbers depend on it. Its
toy value is the first byte (8 bits) or the first two bytes big-endian (16 bits) of its SHA-256.
**Collision counter** = messages whose value an earlier message already had = n − values taken.

**Edge: trailing newline.** Many programs end a line with `\n`; the toggle appends it to B only, so A and B can be
compared: `abc` vs `abc\n` differ in 128 bits.

## Tie-breaks

- **First collision:** the smallest j such that message j's value equals that of an earlier message; i is that
  earlier message. All values before j are distinct, so i is unique. Later repeats never replace it.
  Test: `tie-break: the first collision …` (also a brute force over all pairs up to 22).
- **Edit kind** (which caption): `same` (A equals the hashed B), then `newline` (the toggle is the only difference),
  then `one` (one character replaced, inserted or deleted; characters are code points, not bytes), else `more`.
  `abc`/`abd` with the newline on is `more` (two edits). Test: `tie-break: edit kind order …`.
- **Caption focus:** a newly chosen preset speaks for its half (`toy8`, `toy16` → toy; the others → digest); else the
  half whose params changed (only `toyBits`/`toyCount` → toy, anything else → digest); no change keeps the focus;
  at start the defaults stand in for the previous params (so `?toyCount=10` opens on toy, a plain start on digest).
  After a reload that restored typed text the focus saved with it is used. Test: `tie-break: caption focus …`.
- `toyCount` is clamped to 1 … 600 and rounded. `toyBits` other than 16 means 8 (also when given as a string).
- Lengths are UTF-8 bytes; edits count code points (an emoji is one character); a lone surrogate is hashed as
  U+FFFD, as TextEncoder does. Two different lone surrogates therefore hash alike: the only way the page can show
  "one character changed" with 0 bits differing (not reachable by typing).

## Presets and expected numbers (all [PY])

| id | params | expected |
|---|---|---|
| `abc` | A = B = `abc` | ba7816bf…f20015ad (FIPS 180-2 B.1), 0 bits differ |
| `one-char` | A `abc`, B `abd` | B a52d159f…298449c9, **122** bits differ |
| `payment` | A `Plati 100 EUR`, B `Plati 900 EUR` | 82ea917f… vs 78426577…, **133** bits differ |
| `empty` | A ``, B `Isti sažetak, dakle ista datoteka.` | e3b0c442…7852b855; B is 35 bytes; both 64 hex; 128 differ |
| `newline` | A = B = `abc`, newline on | B edeaaff3…0efd18cb (4 bytes), 128 differ |
| `toy8` | 8 bits, 22 messages | first collision poruka 5 and poruka 22, value 0x84; 21 values taken |
| `toy16` | 16 bits, 449 messages | first collision poruka 248 and poruka 449, value 0xaf50 (≈ 321 expected) |

Also pinned: defaults (8 bits, 30 messages) → 29 values taken, 1 repeat; 600 messages at 8 bits → 225 values taken;
SHA-256 of 1000 × `a` and of `čšž😀` equal `hashlib`; FIPS 180-2 B.2 `abcdbcdecdef…nopq` → 248d6a61…19db06c1.

## Captions

Digest focus, by edit kind (n = differing bits):
- same: "A i B su isti ulaz, pa je i sažetak isti: 0 od 256 bitova se razlikuje. Na tome počiva provjera
  cjelovitosti."
- one: task caption, "Promijenjen je jedan znak, a u sažetku se promijenilo 122 od 256 bitova." / "One character
  changed, and 122 of the 256 digest bits flipped."
- newline: "Jedina razlika je znak novog retka na kraju B, …"
- more: "Ulazi se razlikuju u više znakova; … a duljina je ista: 64 znaka."

Toy focus:
- collision: task caption extended with the pair, "Sažetak od 8 bitova prvi se put ponovio već kod 22. poruke:
  poruka 5 i poruka 22 daju 0x84." / "The 8-bit digest repeated already at message 22: …" (English avoids the
  ordinal "22nd", whose suffix would be a separate word for every number).
- none yet: "Poruka: n. Sažetak od 8 bitova još se nije ponovio; prva kolizija očekuje se oko 20. poruke." ("Poruka: n"
  is a label, so no plural forms are needed for any n.)

## Legend

bit 1 (filled square) · bit 0 (dashed hollow square) · bit differs, A ≠ B (ink border + highlighter) · colliding pair
(◆). The toy map has its own key under it (taken, repeated, first collision).

## Out of scope

SHA-256 internals (rounds, padding), MD5/SHA-1 attacks, HMAC, password hashing (`password-storage`).
