<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# hash-properties: notes

New explorer (task `docs/tasks/w2/hash-properties.md`, catalogue `sec-hash-properties`, wave 2b). No kit view fits
(K1–K4 are sequence, topology, rule table, block grid), so the page draws its own bit grids in HTML. Rules and
expected numbers: `SPEC.md`.

## Decisions

- **Pure SHA-256 in `sim.js`** (FIPS 180-4 §6.2, with its own UTF-8 encoder), as the task asks: Web Crypto is
  asynchronous. Checked against both FIPS 180-2 appendix vectors and `hashlib` on multi-block and non-ASCII input.
- **Text boxes are the page's own fields.** The kit has no text param (an unknown type throws), so `a` and `b` are
  model params in `defaults` without a control spec; the boxes call `sim.set({ a })`. The stage is built once and
  updated in place, so a box keeps its focus and caret while typing (checked in a browser: typing `X1r` in the middle
  of B inserts the text, the digit and `r` do not fire a preset or reset). The kit already ignores its shortcuts while
  a text field has focus. Consequence: `a` and `b` are not written to the URL (see Shared requests).
- **Typed text survives the language switch.** `L` reloads the page and the kit's pre-reload hook is not open to
  pages, so on `pagehide` the page saves `a`, `b` and the caption focus in `sessionStorage` and restores them once,
  only when the new address equals the old one apart from `?lang=` (a later link to another preset never gets old
  text). Without storage (private mode) the boxes start from the preset. Checked in a browser.
- **The kit specs carry `value`** (the defaults): the kit's `coerce`/`normalise` fall back to the spec's `value`, not
  to `defaults`, so `?toyBits=32` or `?toyCount=abc` used to give "undefined bits" and NaN (fresh review).
- **The newline toggle acts on B only**, so A and B show the difference side by side (`abc` vs `abc\n`, 128 bits). The
  page says "many programs add one at the end of a line" rather than naming a command (concepts, not tools).
- **Seventh preset `newline`** (A = B = `abc`, toggle on), beyond the task's six: the task names the edge case and the
  toggle, and a preset gets it on screen with one key. Keys 1–7.
- **Preset `empty`** sets B to the book's sentence „Isti sažetak, dakle ista datoteka." (35 bytes) rather than leaving
  B empty too, so the two cards show 0 and 35 bytes next to two digests of the same 64 characters (rule 1).
- **Bit grid diff mark:** the kit's `.sd-changed` (6 px highlighter ring outside the cell) does not fit 24 px cells 3 px
  apart, so a differing bit gets an ink border and a highlighter ring *inside* the cell; the fill (bit 1) or the empty
  middle (bit 0) stays visible. Checked in grayscale. Legend swatch `hp-diff` matches.
- **Toy panel:** counters (messages, possible values, values taken, collisions = repeats, expected first), the first
  pair with the same ◆ on both rows (the legend's "colliding pair"), and for 8 bits a 16 × 16 map of all 256 values
  (taken filled, repeated striped with an ink border, the first collision's value with an ink border and ◆). The
  map is the pigeonhole made visible: slide to 257+ messages and repeats must appear. For 16 bits (65 536 values) a
  bar of values taken replaces the map.
- **Verdict** "Isti sažetak: ulaz je (gotovo sigurno) isti": the book's „Isti sažetak, dakle ista datoteka" with
  "almost certainly", since the same page shows that collisions exist.
- **"Collision counter"** = messages whose value an earlier message already had (n − values taken). The task does not
  define it; this is the number that is 1 at the first collision and grows from there.
- **Toy messages are the Croatian strings `poruka i` in both languages** (data, `translate="no"`): the task's numbers
  (5/22, 248/449) depend on the exact bytes hashed.
- **Caption focus:** the half whose params changed last speaks; a preset speaks for its own half (`nextFocus` in
  `sim.js`, tested). The task's two captions are used with the numbers as placeholders. The English collision caption
  says "at message 22" instead of "at the 22nd message": an ordinal suffix would be a word per number in the table.
- **Caption "more":** a different input of the same digest length ends with "a duljina je ista: 64 znaka", so typing
  freely still shows rule 1.
- **Exponents** in the explanation are Unicode superscripts (2²⁵⁶, 2ⁿ): `<sup>` renders at 13.3 px on a phone, under the
  14 px floor.
- **`related`: `ssh-key-auth`** (a key fingerprint is a hash). `password-storage` (rule 4's link) does not exist yet;
  add it to `related` when it does.
- Tags: `cryptography`; topic `security`; level `core` (the task's). All exist in `tags.json`.

## Deviations from the task

- Seventh preset `newline`; `empty` has a long B (see Decisions).
- English collision caption without the ordinal (see Decisions).
- `a` and `b` are not in the URL (kit has no text param).

## Sources

- FIPS 180-4 (SHA-256, digest length, constants); FIPS 180-2 Appendix B.1 ("abc") and B.2 (448-bit message) vectors.
  *(check: the standard was not re-read; the code reproduces both vectors and `hashlib`.)*
- `uvod-u-linux/book/chapters/23-odrzavanje-sustava.md`, „Sigurnosne kopije i oporavak": the `sha256sum` restore check
  and „Isti sažetak, dakle ista datoteka" (lines 196–206); term *sažetak*.
- `uvod-u-linux/book/chapters/09-paketi-i-repozitoriji.md`: *kontrolni zbroj* (line 66).
- Python 3 `hashlib.sha256`, run 2026-10-22 on this machine: every digest, bit count and collision in SPEC.md
  (122, 133, 128, 0x84 at poruka 5/22, 0xaf50 at poruka 248/449, 29 of 30, 225 of 600).
- Birthday bound √(π/2 · 2ⁿ) = 20.05, 320.8, 82 137 for 8, 16, 32 bits: textbook, computed. *(check: no course
  source.)*

## Unchecked *(check)*

- Croatian term *funkcija sažimanja* for "hash function" (the task marks it; the books use only *sažetak*).
- FIPS 180-4 not re-read (see Sources).
- The birthday bound has no course source.

## Term pairs

None of these is in `kit/glossary.js` (it has *hashing* — *raspršivanje*, the data-structure sense, which is the
wrong Croatian here). Written out in both tables (Croatian from the task and the books):

| en | hr |
|---|---|
| hash (digest) | sažetak |
| hash function | funkcija sažimanja *(check)* |
| collision | kolizija |
| avalanche effect | lavinski učinak |
| integrity | cjelovitost |
| checksum | kontrolni zbroj (UL ch9, ch23) |
| one-way | jednosmjerna |

## Fresh review (2026-10-22)

A fresh agent read the diff against SPEC.md, rechecked every number with `hashlib` and the SHA-256 code against node's
crypto on 3 000 random strings and every length 0–300 (0 mismatches), and ran 65 mutations. Fixed from it: the
"none yet" caption had no plural forms (now "Poruka: n."), typed text was lost on the language switch, bad URL values
gave NaN, the toy memo keyed `"8"` and `8` differently, the map key reused the counter's label, and the verdict was
absolute. Ten surviving mutations got tests (TOY_MAX, defaults, focus for `toy16` and `toyBits`, code points, bytes,
U+0400–07FF, lone surrogates, rounding, memo); all are killed now. Left as is: rule 4's test only checks function
names; two different lone surrogates hash alike (SPEC.md, Tie-breaks).

## Shared requests

- **Kit: a `text` param type** (a single-line text box: `maxlength`, `live`, kept in the URL like other params). Here
  the boxes are page fields and the inputs are lost from a copied link. Smallest change: a `text` branch in
  `buildControl`/`coerce` that keeps focus and caret while the page re-renders. Then the page's session-storage
  workaround goes.
- **Kit: fall back to `defaults` for a bad URL value** in `coerce`/`normalise`, not only to the spec's `value`. Pages
  that give `defaults` but no `value` show NaN or undefined for `?param=garbage`; this page now repeats the defaults
  as `value` in each spec. Consumers: this sim, and any later
  sim with typed input (`password-storage`, `sql-injection`, `xss` in the catalogue).

## Time

Start 2026-10-22 14:17 CEST, ready 14:36 CEST (one session, with a fresh review by a second agent).
