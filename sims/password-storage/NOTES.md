<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# password-storage: notes

New explorer (task `docs/tasks/w3/password-storage.md`, catalogue `sec-password-storage`, wave 3). No kit view fits
(K1–K4 are sequence, topology, rule table, block grid), so the page draws its own table and bars in HTML. Rules and
expected numbers: `SPEC.md`.

## Decisions

- **SHA-256 copied from `hash-properties`** (`utf8`, `rotr`, `sha256Bytes`, `hex`, `sha256`, from
  `sims/hash-properties/sim.js @ 377c608`, unchanged): `models/` has no hash model yet (Shared requests). Tests compare
  it with node's `crypto`.
- **All four schemes side by side.** The task's scene has one column per scheme; the `scheme` param picks the column
  the attacker stole (outlined, "attacker's copy"), the bar that is outlined, the precomputed-table result and the
  caption. So `same-password` shows unsalted-equal and salted-different at once, as the task asks.
- **The plain column is the password column.** Plain storage stores exactly what the user typed, so a separate
  "password" column would repeat it; Luka's text box sits in it.
- **Luka's password is a page text field** (the kit has no text param, as in `hash-properties`): it writes `password`
  and, from the typed text, `length`, `alphabet` and `inBreachList` (`shapeOf`, SPEC.md Params). That is "pick a
  password, see attack cost"; the sliders stay free afterwards, so the bars always describe "a random password of
  this length and alphabet", which the caption names. `password` is not in the URL; it survives the language
  switch through `sessionStorage`, restored once and only into the same address (the `hash-properties` pattern).
- **Breach list and precomputed table share one sample list** of 8 common passwords. Typing one of them turns the
  breach-list toggle on; the toggle itself stands for a 10⁶-entry list (task).
- **The precomputed table is shown as a lookup** (hash → password), as the task says. A real rainbow table stores
  chains to trade memory for time; that detail is out of scope and not claimed on the page.
- **Slow column's stored value:** 1000 rounds of SHA-256 over salt + password, a deterministic stand-in. The attacker's
  cost is the `slowRate` param, not these rounds; real functions (bcrypt, Argon2) are out of scope and not named on
  the page.
- **Salts are 8 hex characters**, fixed per user so the page is deterministic; real salts are longer (NIST asks for
  at least 32 bits *(check)*). Shown in a hatched box next to the value; the explanation says the salt is not secret
  (misconception).
- **Whole-table time:** unsalted, one pass checks every stored value (×1); salted and slow, each user separately (×4).
  This shows rule 3's "each user must be attacked separately" in numbers.
- **Same-hash mark:** highlighter on the value with ◆ (first group) or ● (second); in the stolen column a bracket lane
  left of the names links the group's rows. A user inside the span who is not in the group has no dot. Each group of
  the stolen column gets a visible label in the table's headline, „◆ isti zapis: Ana i Marko".
- **Changed:** the kit's `.sd-changed` ring on cells whose stored value differs from the previous render (typing in
  Luka's box marks his row; scheme changes mark nothing, since the values do not change).
- **Durations:** units µs … years, one decimal under 10; a million years and more as m · 10ᵉ. Plural forms for decimals
  use the "many" form (6,1 sati, 1.7 minutes). Bars use short units, the caption long ones (Croatian accusative after
  „izdrži"). The breached preset's slow time is 100 s, shown as 1.7 min.
- **Number format follows the language:** Croatian 456 976 and 6,1, English 456,976 and 6.1 (the separators are in the
  page, chosen by `Simdeck.lang`: the kit's string check rejects a no-break space as an empty string).
- **Axis:** 0.1 µs to 10¹² years, log scale; the right end has a gridline and no label (it collided with 10⁹). A time
  past the end fills the bar and shows ▶.
- **Captions:** the task's two captions, with the numbers and names as placeholders. English "4 lowercase letters: …"
  starts with the digit, not "Four". Focus: a scheme change speaks about the table, any other change about the time
  (`nextFocus`, tested).
- **Preset labels are short** (one line in the panel's two columns at 1920×1080); the details are in the hints.
- **Linux `/etc/shadow` (rule 7) is in the explanation only.** The stage says "the server": the concept does not depend
  on the OS, and the UL course is where the file is the subject.
- **`related`: `hash-properties`.** Its NOTES.md asks to add `password-storage` to its own `related` once this sim
  exists; that file is outside this task's scope (report).
- Tags: `authentication`; topic `security`; level `intro` (the task's). All exist in `tags.json`.

## Deviations from the task

- `fastRate` and `slowRate` are 4-option choices, not selects (the kit's choice is for 2–5 options).
- `password` is a page field, not a kit param, and is not in the URL (as in `hash-properties`).
- Typing a password also sets length, alphabet and the breach-list flag (an addition, see Decisions).
- The `breached` preset's slow time shows as 1.7 min (= 100 s, the task's number).
- `passphrase15` fast: 5 315 years (the task's „≈ 5 300").

## Sources

- URM ch18 „Prijetnje i napadi: od zloćudnog koda do čovjeka u sredini", the passwords paragraph and footnote
  `nist80063b-pass` (NIST SP 800-63B-4, July 2025, §3.1.1: 15 characters as a single factor, no composition rules, no
  periodic change, compare with compromised passwords). `uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md`
  lines 227–239, 292–300.
- UL ch7 `uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`, „Šire o temi" (lines 174–185): `/etc/shadow` holds
  password data and must not be readable by ordinary users; `/etc/passwd` is readable (shadow(5)).
- DR `dr-lecture-estate/instructor/caveats.md` CV-18: the 4-character policy behind `four-chars` (only the length is
  used; no estate names, no answer).
- NIST SP 800-63B: verifier storage of memorized secrets, salted one-way key derivation *(check)* the section number
  in Rev. 4; not re-read.
- Python 3 `hashlib`, run 2026-10-30 on this machine: every stored value in SPEC.md and every time; node `crypto` in
  the tests.

## Unchecked *(check)*

- Guess rates: fast hash 10¹⁰/s and slow hash 10⁴/s on one graphics card (task values; both params).
- NIST SP 800-63B (Rev. 4) section for salted verifier storage; NIST's minimum salt length (32 bits).
- Croatian *sol* for *salt* and *dugina tablica* for *rainbow table* (the task marks both; no course book uses them).
- `login.defs(5)` `ENCRYPT_METHOD` (the task marks it; not used on the page).

## Term pairs

None of these is in `kit/glossary.js`; written out in both tables (Croatian from the task and the books):

| en | hr |
|---|---|
| hash | sažetak |
| salt | sol *(check)* |
| rainbow table | *rainbow table* (dugina tablica) *(check)* |
| brute force | napad grubom silom |
| password | lozinka |
| breach list | popis kompromitiranih lozinki (URM ch18) |
| key derivation function | funkcija izvođenja ključa |

## Shared requests

- **models/: promote the SHA-256 of `hash-properties`** (`sha256`, `sha256Bytes`, `utf8`, `hex`) as `models/sha256.js`.
  This sim and `hash-properties` carry the same copy; later consumers in the catalogue (`digital-signature`,
  `cert-chain`) may want it too. Then this sim drops its copy.
- **Kit: a `text` param type** (repeats `hash-properties`' request): Luka's password would then be in the URL and the
  session-storage workaround could go.

## Fresh review (2026-10-30)

A fresh agent read the files against SPEC.md, rechecked every stored value and time with `hashlib` (no mismatches),
checked both languages and all presets in a browser, and ran about 75 mutations. Fixed from it: the hit-count caption
took its plural from a DOM node (always the "many" form; latent, as the count is always ≥ 2 today); caption numbers
above 10⁷ lacked "≈"; the task's "same hash" group label was not visible (now in the table's headline). Sixteen
surviving mutations got tests (groups on whole values, both axis ends and the clamp, `shapeOf` on upper case, mixed
digits, spaces, astral characters and list case, focus after a password-only change, durations between 10⁵ and 10⁶
years, preset schemes, option lists, the boolean flag); all are killed now. Left as is: with two groups the hash
caption names only the first (the labels name both); the equivalent mutation `preset !== prevPreset` → `preset`.

## Time

Start 2026-10-30 14:18 CET, ready 14:41 CET (one session, with a fresh review by a second agent).
