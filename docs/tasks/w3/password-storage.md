# password-storage: Storing passwords

| | |
|---|---|
| Task | `password-storage` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-password-storage` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/password-storage/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | SEC, UL |
| Topic / tags / level | `security` / `authentication` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `hash-properties` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **plain vs hash vs salted vs slow hash; rainbow tables; cracking time**.

The student: pick a scheme and a password, see attack cost.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.
5. `sims/hash-properties/` (the model this one builds on) and its `NOTES.md`.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- No course chapter on password hashing; related material is cited below. Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- URM ch18 „Prijetnje i napadi: od zloćudnog koda do čovjeka u sredini", paragraph on passwords (NIST SP 800-63B-4: 15 characters, no forced rotation, no composition rules, check against compromised lists; footnote `nist80063b-pass`).
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/07-korisnici-grupe-dozvole.md`, `/etc/passwd` and `/etc/shadow` paragraph (shadow(5)); `login.defs(5)` for `ENCRYPT_METHOD` *(check: not quoted in the book)*.
- `/home/rjasmin/projects/dr-lecture-estate/instructor/caveats.md` CV-18 (4-character policy, no lockout).
- NIST SP 800-63B, memorized-secret verifier requirements (salted, one-way key derivation function).

## Model and presets

- **Scene:** a small user table (4 users, two with the same password) as the server stores it, one column per
  scheme: plain, fast hash (SHA-256), salted fast hash, slow salted hash (bcrypt/Argon2-like, cost param). On the
  right the attacker: a stolen copy of the table, a rainbow-table lookup, and a cracking-time bar per scheme on a
  log scale (seconds → years). Explorer.
- **State:** `{ users: [{name, password, salt}], scheme, policy: {length, alphabet}, rate: {fast, slow},
  table: [{name, stored}], attack: {space, secondsWorst, sameHashGroups, rainbowHit} }`; stored values from the
  `hash-properties` SHA-256, truncated to 16 hex for display.
- **Params drive live:** changing scheme, password, length or alphabet recomputes the stored table, which users
  share a visible hash, whether a rainbow table hits, and the worst-case guessing time = space / rate.
- **Rules:**
  1. Plain: the stolen table is the passwords (derived).
  2. Unsalted hash: equal passwords give equal stored values, and a precomputed (rainbow) table of common
     passwords reverses them by lookup (textbook; reuses `hash-properties` rule 2).
  3. Salt: a random per-user value stored next to the hash; equal passwords now differ, precomputed tables are
     useless, each user must be attacked separately (NIST SP 800-63B, verifier storage of memorized secrets
     *(check)* section number in Rev. 4).
  4. Slow hash: each guess costs the attacker a tunable amount of work; the sim models this as a guess rate
     (`fast` 10^10/s, `slow` 10^4/s on one GPU, both *(check)*, both params).
  5. Search space = alphabet^length; worst-case time = space / rate, average half (textbook).
  6. A password in a breach list is found in list-size guesses whatever its length (URM ch18 „Prijetnje i
     napadi…": the verifier must compare new passwords against known compromised ones, NIST SP 800-63B-4).
  7. Linux stores salted slow hashes in `/etc/shadow`, readable by root only (UL ch7, `/etc/shadow` section).
  Tie-break: users with the same password are grouped by name order; the group label shows "same hash".
- **Params:** `scheme` choice plain/hash/salted/slow (hash); `length` range 4…20 (8); `alphabet` choice
  digits 10 / lower 26 / alnum 62 / printable 95 (alnum); `inBreachList` toggle (off); `slowRate` select 10^3…10^6
  (10^4); `fastRate` select 10^8…10^11 (10^10).
- **Presets:**
  - `four-chars` 4 lowercase letters (the DR estate's staff policy, CV-18): 26^4 = 456 976; fast 46 µs, slow
    46 s. From DR `instructor/caveats.md` CV-18 (policy), times derived and checked.
  - `same-password` two users with "ljeto2026", unsalted: identical stored values; salted: different. Derived.
  - `eight-alnum` 8 of 62: 2.18·10^14; fast ≈ 6.1 h, slow ≈ 692 years. Derived, checked.
  - `passphrase15` 15 lowercase (NIST minimum for a sole password, URM ch18): 26^15 ≈ 1.7·10^21; fast ≈ 5 300
    years. From URM ch18 (the 15-character rule), times derived.
  - `breached` a 15-character password that is in a 10^6-entry list: fast 0.1 ms, slow 100 s. Derived, checked.
- **Steps:** explorer, 0.
- **Legend:** stored value (monospace cell), salt (hatched cell), same hash as another user (kit highlight, linked
  bracket), cracking-time bar per scheme (shape + label), changed (kit highlight on cells recomputed).
- **Captions:** hr: "Bez soli Ana i Marko imaju isti zapis — tko razbije jednoga, ima oba." / en: "Without a salt
  Ana and Marko have the same stored value — crack one and you have both." — hr: "Lozinka od 4 mala slova: 456 976
  pokušaja, spori sažetak izdrži 46 sekundi." / en: "Four lowercase letters: 456,976 guesses; a slow hash holds out
  for 46 seconds."
- **Terms:** salt — sol (*salt*) *(check)*; hash — sažetak; rainbow table — *rainbow table* (dugina tablica) *(check)*; brute force — napad grubom silom; password — lozinka; breach list — popis kompromitiranih
  lozinki (URM ch18); key derivation function — funkcija izvođenja ključa.
- **Misconceptions:** hashing alone makes a stolen table safe; salt must be secret; complexity rules beat length
  (URM ch18: NIST forbids imposed composition rules).
- **Out of scope:** online guessing and lockout, MFA (`mfa-phishing`), Argon2/bcrypt internals, pepper, NTLM
  hashes (`win-ntlm-vs-kerberos`).
- **Builds on `hash-properties`:** reuses its pure SHA-256 and digest display; new are salt, rate and cost model.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh password-storage sims/password-storage` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/password-storage/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
