<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# password-storage: specification

Explorer (no steps). Task `docs/tasks/w3/password-storage.md`, catalogue `sec-password-storage` (§4.3). One concept:
**plain vs hash vs salted vs slow hash; rainbow tables; cracking time.** The student picks a scheme and a password and
sees what a stolen copy of the server's table gives the attacker and how long guessing takes.

Numbers were checked on 2026-10-30 with Python 3 `hashlib` (independent of the model's own SHA-256) and by the tests,
which also compare against node's `crypto`.

## Scene

- **The server's table:** four users in server order Ana, Marko, Iva, Luka. Columns: user, then one column per
  scheme: plain (the password itself), fast hash, salted fast hash, slow salted hash. The column of the chosen
  `scheme` is the attacker's stolen copy (outlined, "attacker's copy"). Hashes show their first 16 of 64 hex
  characters; equality is decided on the full value.
- **The precomputed table** (rainbow table): 8 common passwords with their unsalted SHA-256, and which users of the
  stolen column it finds.
- **Guessing one password:** the search space and one bar per scheme on a log time axis (0.1 µs … 10¹² years), with
  the guess rate, the worst-case time, and the whole-table time.

## Data

| User | Password | Salt (8 hex, public) |
|---|---|---|
| Ana | `ljeto2026` | `3f9a1c07` |
| Marko | `ljeto2026` | `b24e6d91` |
| Iva | `Tr4m!vaj` | `7c05e2ab` |
| Luka | param `password` (typed) | `e81d4f36` |

Salts are fixed stand-ins for random values, so the sim is deterministic. Real salts are longer (NOTES.md).

Common passwords (precomputed table and the breach-list sample): `123456`, `lozinka`, `qwerty`, `ljeto2026`, `volimte`,
`sunce123`, `iloveyou`, `qwertyuiopasdfg`. Breach list size: 10⁶ (task).

## Params

| Key | Control | Values | Default |
|---|---|---|---|
| `scheme` | choice | plain, hash, salted, slow | hash |
| `password` | page text field in Luka's row (no kit control) | any text, max 40 | `k7Pm2xQa` |
| `length` | range | 4 … 20 | 8 |
| `alphabet` | choice | 10, 26, 62, 95 | 62 |
| `inBreachList` | toggle | | off |
| `fastRate` | choice | 10⁸, 10⁹, 10¹⁰, 10¹¹ guesses/s | 10¹⁰ |
| `slowRate` | choice | 10³, 10⁴, 10⁵, 10⁶ guesses/s | 10⁴ |

Typing in Luka's box also sets `length`, `alphabet` and `inBreachList` from the typed text (`shapeOf`): length clamped
to 4 … 20 (code points), alphabet the smallest of digits (10), lowercase a–z (26), letters and digits (62), else 95;
`inBreachList` when the text is one of the common passwords. An empty box changes only `password`. The sliders stay
free to explore afterwards. The task lists `rate` options as selects; they are 4-option choices (the kit's choice is
for 2–5 options).

## Rules

1. **Plain:** the stored value is the password; the stolen table is the passwords. Time 0 ("at once"), no lookup.
   *(derived)*
2. **Unsalted fast hash:** stored = SHA-256(password). Equal passwords give equal stored values; the precomputed table
   of common passwords reverses them by lookup. One guessing pass checks every stored value at once, so the whole
   table costs the same as one password. *(textbook; reuses `hash-properties`, rule 2)*
3. **Salt:** stored = salt · SHA-256(salt + password), the salt per user and stored next to the value (not secret).
   Equal passwords now differ, the precomputed table finds nothing, and each user is attacked separately: whole table
   = 4 × one password. *(NIST SP 800-63B, verifier storage of memorized secrets: salted one-way key derivation
   *(check)* the section number in Rev. 4)*
4. **Slow hash:** each guess costs the attacker a tunable amount of work; the model is the guess rate `slowRate`
   (default 10⁴/s against `fastRate` 10¹⁰/s, one graphics card, both *(check)*). The stored value shown is a stand-in:
   1000 rounds of SHA-256 over salt + password (x₁ = SHA-256(salt + password), xᵢ₊₁ = SHA-256(xᵢ) as bytes). Real slow
   functions and their cost parameters are out of scope.
5. **Search space** = alphabet^length; worst-case time = guesses / rate; average = half. *(textbook)*
6. **Breach list:** a password in the list is found within list-size guesses whatever its length:
   guesses = min(space, 10⁶). *(URM ch18 „Prijetnje i napadi…", NIST SP 800-63B-4 §3.1.1: verifiers compare new
   passwords with known compromised ones)*
7. **Linux** stores salted slow hashes in `/etc/shadow`, readable by root only (UL ch7, `/etc/passwd` and
   `/etc/shadow`; shadow(5)). In the explanation only; the stage stays generic ("the server").

## Tie-breaks

- **Same-value groups:** users with equal full stored values, groups of two or more; members in name order (code point
  order: Ana, Iva, Luka, Marko), groups ordered by their first member. Two groups get ◆ and ●. The bracket lane links
  the stolen column's groups from their first to their last row in server order; a user inside the span who is not a
  member gets no mark. Each group of the stolen column also gets a visible label in the table's headline,
  „◆ isti zapis: Ana i Marko" / "◆ same hash: Ana and Marko" (the task's "group label shows 'same hash'"). With two
  groups the hash caption names the first one; the labels name both.
- **Precomputed-table hits** in server order.
- **Durations:** the largest unit (µs, ms, s, min, h, d, years; a year = 365.25 days) in which the value is ≥ 1; one
  decimal under 10, whole numbers from 10; when rounding reaches the next unit (59.97 s → 60 s), the next unit
  (1 min). From 10⁶ years on: m · 10ᵉ years with m to three significant figures. Zero: "at once".
- **Caption focus:** a preset decides (same-password → the table, the rest → the time); otherwise a change that
  includes `scheme` → the table, any other change → the time; no change keeps the focus. Page start: the table.
- Large numbers: under 10⁷ and whole, written out (456 976 / 456,976); above, m · 10ᵉ with "≈" (space line and
  caption).

## Presets and expected numbers

| # | id | Params | Expected |
|---|---|---|---|
| 1 | `four-chars` | slow, `kava`, 4 × a–z | 26⁴ = 456 976; fast 45.7 µs → **46 µs**; slow 45.7 s → **46 s**; whole table slow 3 min. From DR `instructor/caveats.md` CV-18 (policy: 4 characters), times derived. |
| 2 | `same-password` | hash (rest default) | Ana and Marko: hash `3e618b3965085b27` both; salted `a4e207329682f39b` vs `c46c32b45600f6ca`; precomputed table finds Ana and Marko (2). Derived. |
| 3 | `eight-alnum` | hash, `k7Pm2xQa`, 8 × 62 | 62⁸ = 218 340 105 584 896 ≈ 2.18 · 10¹⁴; fast 21 834 s → **6.1 h**; slow 2.18 · 10¹⁰ s → **692 years**; whole table salted 1 day, slow 2 768 years. Derived, checked. |
| 4 | `passphrase15` | hash, `plavakucanabrdu`, 15 × a–z | 26¹⁵ ≈ 1.68 · 10²¹; fast **5 315 years** (task: ≈ 5 300); slow 5.31 · 10⁹ years. URM ch18 (15 characters), times derived. |
| 5 | `breached` | slow, `qwertyuiopasdfg`, 15 × a–z, in list | guesses 10⁶; fast **100 µs** (= 0.1 ms); slow **100 s**, shown as 1.7 min; precomputed table also finds Luka. Derived, checked. |

The default (Luka `k7Pm2xQa`, 8 × 62, hash) equals preset 2's params, so the page opens on it.

Stored values (first 16 hex), checked with `hashlib`:

| User | hash | salted | slow |
|---|---|---|---|
| Ana | `3e618b3965085b27` | `a4e207329682f39b` | `02450440c1ca5d60` |
| Marko | `3e618b3965085b27` | `c46c32b45600f6ca` | `7757499ffc3eed5d` |
| Iva | `f7496874e501f704` | `069148a5a9a40379` | `0c5f2c6afc91c471` |
| Luka `k7Pm2xQa` | `0a059feb2b3fd5be` | `a6ecdd250eca7ce4` | `9fd4ce04475166d2` |
| Luka `kava` | `a7f213414494e0ad` | `5a3bd2739c43a3b7` | `d38c060ecd984ec2` |

Extremes: smallest time 10⁴ / 10¹¹ = 0.1 µs (left end of the axis); largest 95²⁰ / 10³ = 1.14 · 10²⁹ years, past the
right end (10¹² years): the bar is full with ▶.

## Captions (both languages, written from the start)

- Table focus, by scheme: plain „Bez sažetka ukradena tablica su same lozinke…"; hash with a group: the task's
  „Bez soli Ana i Marko imaju isti zapis — tko razbije jednoga, ima oba." / "Without a salt Ana and Marko have the
  same stored value — crack one and you have both." plus how many values the precomputed table reverses; salted:
  same password, different value, nothing found, each user separately; slow: each guess costs fastRate/slowRate times
  the work.
- Time focus: the task's „Lozinka od 4 mala slova: 456 976 pokušaja, spori sažetak izdrži 46 sekundi." / "4 lowercase
  letters: 456,976 guesses; a slow hash holds out for 46 seconds." (English starts with the digit, not "Four"); with the
  breach list: found within 1 000 000 guesses however long; plain: read at once.

## Legend

stored value (monospace, #), salt (hatched box), same stored value as another user (highlighter + ◆/●, linked by the
bracket lane), time to guess (bar), changed (kit highlight ring on cells whose stored value was recomputed).

## Out of scope

Online guessing and lockout, MFA (`mfa-phishing`), Argon2/bcrypt internals, pepper, NTLM hashes
(`win-ntlm-vs-kerberos`).
