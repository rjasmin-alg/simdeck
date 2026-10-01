# hash-properties: Hash functions

| | |
|---|---|
| Task | `hash-properties` (wave 2b, Security foundations) |
| Catalogue entry | `sec-hash-properties` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/hash-properties/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | SEC |
| Topic / tags / level | `security` / `cryptography` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **avalanche effect, fixed length, integrity, collisions**.

The student: change one character, compare hashes.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.

## Sources

- No course chapter on hash functions; the books use the term and `sha256sum` only. Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- FIPS 180-4, *Secure Hash Standard*, SHA-256 (digest length; test vector "abc" from FIPS 180-2 Appendix B.1).
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/23-odrzavanje-sustava.md`, „Sigurnosne kopije i oporavak", Što treba znati: `sha256sum` restore check („Isti sažetak, dakle ista datoteka"); term *sažetak*. `09-paketi-i-repozitoriji.md` for *kontrolni zbroj*.

## Model and presets

- **Scene:** two input boxes (A and B, B starts as a copy of A) and their SHA-256 digests below as 64 hex
  characters and as a 16×16 bit grid; bits that differ between A and B are marked. A side panel: a "toy hash"
  (SHA-256 truncated to the first 8 or 16 bits) fed with a numbered list of messages, with a collision counter.
  Explorer: no steps.
- **State:** `{ a, b, digestA, digestB, diffBits, toyBits, toyInputs: n, toyFirstCollision: {i, j, value} | null }`;
  digests computed by a pure SHA-256 in `sim.js` (Web Crypto is async and cannot be used in the pure model).
- **Params drive live:** editing A or B recomputes both digests and the differing-bit count; `toyBits` and
  `toyCount` recompute the first collision in "poruka 1 … poruka n".
- **Rules:**
  1. Fixed length: any input, empty included, gives 256 bits = 64 hex characters (FIPS 180-4, SHA-256).
  2. Deterministic: the same input always gives the same digest; this is why integrity checks work (UL ch23
     „Sigurnosne kopije i oporavak", `sha256sum` example: „Isti sažetak, dakle ista datoteka").
  3. Avalanche: one changed character flips about half of the 256 bits; show the count, not a promise of exactly
     128 (textbook; numbers below checked with Python `hashlib`).
  4. One-way: the page offers no "reverse" button; the only way back is guessing inputs (links to
     `password-storage`).
  5. Collisions must exist (infinite inputs, 2^256 outputs, pigeonhole); for an n-bit hash the first one is
     expected after about √(π/2 · 2^n) inputs: ≈ 20 for 8 bits, ≈ 321 for 16 bits, ≈ 82 000 for 32 bits
     (birthday bound, textbook).
  6. Bit order for the diff grid: digest bytes left to right, most significant bit first (decision).
  Edge case: trailing newline matters (`echo` adds one); a toggle "add \n" shows the different digest.
- **Params:** `a` text (default "abc"); `b` text ("abc"); `newline` toggle (off); `toyBits` choice 8/16 (8);
  `toyCount` range 1…600 (30). Text inputs are a page-level field (kit has no text param; note in NOTES.md).
- **Presets:**
  - `abc` A=B="abc": digest ba7816bf…f20015ad (FIPS 180-2 Appendix B example), 0 bits differ.
  - `one-char` A="abc", B="abd": 122 of 256 bits differ. Derived, checked with hashlib.
  - `payment` A="Plati 100 EUR", B="Plati 900 EUR": 82ea917f… vs 78426577…, 133 bits differ. Derived, checked.
  - `empty` A="": e3b0c442…7852b855, still 64 hex characters. From FIPS 180-4 (well-known value), checked.
  - `toy8` 8-bit toy hash: first collision "poruka 5" and "poruka 22" (value 0x84). Derived, checked.
  - `toy16` 16-bit toy hash: first collision "poruka 248" and "poruka 449" (0xaf50), near the ≈ 321 estimate.
    Derived, checked.
- **Steps:** explorer, 0.
- **Legend:** bit 1 (filled square), bit 0 (hollow square), bit differs between A and B (kit highlight + outline),
  collision pair (same shape on both inputs).
- **Captions:** hr: "Promijenjen je jedan znak, a u sažetku se promijenilo 122 od 256 bitova." / en: "One character
  changed, and 122 of the 256 digest bits flipped." — hr: "Sažetak od 8 bitova prvi se put ponovio već kod 22.
  poruke." / en: "An 8-bit digest repeated already at the 22nd message."
- **Terms:** hash (digest) — sažetak; hash function — funkcija sažimanja *(check)*; collision — kolizija; avalanche
  effect — lavinski učinak; integrity — cjelovitost; checksum — kontrolni zbroj (UL ch9, ch23); one-way — jednosmjerna.
- **Misconceptions:** a hash is encryption and can be decrypted; similar inputs give similar hashes; "no collisions
  exist" (they exist, they are just hard to find).
- **Out of scope:** SHA-256 internals (rounds, padding), MD5/SHA-1 attacks in detail, HMAC, password hashing
  (`password-storage`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh hash-properties sims/hash-properties` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/hash-properties/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
