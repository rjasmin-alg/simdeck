# sym-vs-asym: Symmetric vs asymmetric encryption

| | |
|---|---|
| Task | `sym-vs-asym` (wave 2b, Security foundations) |
| Catalogue entry | `sec-sym-vs-asym` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/sym-vs-asym/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM, SEC |
| Topic / tags / level | `security` / `cryptography` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **the key distribution problem and how public keys solve it**.

The student: send messages with each scheme, count keys.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md` (Uvod u računalne mreže) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch18-*.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 (the planned card: URM card ch18)
- Catalogue seed: URM card ch18
- URM ch18 section „Šifriranje prometa: VPN, TLS i dvije vrste enkripcije", Što treba znati and Šire o temi (the rules; NIST SP 800-12 Rev. 1 §9.1.1 quoted in footnote `nist80012-crypto`), figure `fig:simetricno-asimetricno-sifriranje`.

## Model and presets

- **Scene:** a ring of n people (default 4) with every pair that needs to talk; beside it two key rings, one per
  scheme: symmetric (one shared key per pair, drawn on the edge) and asymmetric (one key pair per person: open
  padlock = public, key = private). A message lane at the bottom shows one Alice → Bob message per scheme, with
  Eve on the wire. Counters: keys in existence, keys that must travel over a secure channel.
- **State:** `{ n, scheme, phase, keys: [{id, kind: 'shared'|'public'|'private', owner|pair, travelled}],
  msg: {from, to, plain, cipher, keyUsed, eveCanRead}, counts: {total, secretTransfers} }`.
- **One step:** stepper over one message, then a group change. 1 Alice wants to write to Bob; 2 symmetric: a
  shared key must reach Bob first (secret transfer, counter +1); 3 encrypt with it; 4 Eve copies the ciphertext,
  cannot read; 5 Bob decrypts with the same key; 6 asymmetric: Bob publishes his public key (no secret travels);
  7 Alice encrypts with Bob's public key; 8 Eve copies it and holds the public key too, still cannot read; 9 Bob
  decrypts with his private key; 10 a new person joins: count the new keys in each scheme; 11 hybrid: Alice
  encrypts a fresh symmetric key with Bob's public key, then the data with the symmetric key (TLS order).
- **Rules:**
  1. Symmetric: the same key encrypts and decrypts, so both sides must exchange it beforehand
     (URM ch18 „Šifriranje prometa…", Što treba znati; NIST SP 800-12 Rev. 1 §9.1.1 as quoted there).
  2. Asymmetric: anyone may encrypt with a public key; only the holder of the matching private key decrypts;
     private keys are never transmitted (same section).
  3. Key count, everyone talks to everyone: symmetric n(n−1)/2 keys; asymmetric n pairs = 2n keys (textbook).
  4. A newcomer adds n new shared keys (one per existing member) but one key pair (derived).
  5. Asymmetric is slower for bulk data, so real protocols (TLS) use asymmetric for agreement, symmetric for the
     data (URM ch18, same section, and figure `ch18-simetricno-asimetricno-sifriranje.svg`).
  6. Eve holding a public key cannot decrypt; Eve holding a copy of a shared key can (derived).
  Edge cases: n = 2 gives 1 shared key vs 2 pairs, so asymmetric "costs more" at n = 2; say so in the caption.
- **Params:** `n` range 2…12 (4, `resets`); `scheme` choice symmetric/asymmetric/both (both); `eveHasSharedKey`
  toggle (off): Eve stole the shared key in transit.
- **Presets:**
  - `book` the book's figure: Alice and Bob, one message each way; symmetric needs 1 secret transfer, asymmetric
    0. From URM ch18 figure `ch18-simetricno-asimetricno-sifriranje.svg`.
  - `office4` n=4: 6 shared keys vs 4 pairs (8 keys, 0 secret transfers). Derived, checked.
  - `class30` n=30: 435 shared keys vs 30 pairs. Derived, checked.
  - `newcomer` n=10 → 11: symmetric 45 → 55 (+10), asymmetric 10 → 11 pairs (+1). Derived, checked.
  - `stolen` symmetric key copied by Eve in transit: she reads every later message. Derived.
  - `hybrid` TLS order: one public-key operation, then all data symmetric. From URM ch18, same section.
- **Steps:** 11 for `book`, `office4`, `class30`, `newcomer`, `hybrid`; 6 for `stolen` (symmetric half only).
- **Legend:** shared key (key icon on an edge), public key (open padlock), private key (key with a hatched bow),
  ciphertext (hatched envelope), Eve (eye), changed (kit highlight on the key or envelope that moved this step).
- **Captions:** hr: "Simetrično: prije prve poruke ključ mora doći do Boba — netko ga mora prenijeti." / en:
  "Symmetric: before the first message the key must reach Bob — someone has to carry it." — hr: "Eve ima Bobov
  javni ključ i šifrat, ali bez privatnog ključa ne može pročitati poruku." / en: "Eve has Bob's public key and
  the ciphertext, but without the private key she cannot read the message."
- **Terms:** symmetric encryption — simetrično šifriranje; asymmetric (public-key) encryption — asimetrično
  šifriranje; plaintext — razumljivi podaci (*plaintext*, URM ch18) / otvoreni tekst *(check)*; ciphertext — šifrat (*ciphertext*) *(check)*; public key — javni
  ključ; private key — privatni ključ; key exchange — razmjena ključa; encryption in transit — šifriranje u
  prijenosu.
- **Misconceptions:** asymmetric replaces symmetric (TLS uses both); the public key must be kept secret; you
  decrypt with the public key (that is signing, `digital-signature`).
- **Out of scope:** how the key is agreed (`diffie-hellman`), signatures, certificates, algorithm internals.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh sym-vs-asym sims/sym-vs-asym` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/sym-vs-asym/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
