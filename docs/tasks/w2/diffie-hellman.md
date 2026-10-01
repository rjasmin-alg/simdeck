# diffie-hellman: Diffie–Hellman

| | |
|---|---|
| Task | `diffie-hellman` (wave 2b, Security foundations) |
| Catalogue entry | `sec-diffie-hellman` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/diffie-hellman/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM, SEC |
| Topic / tags / level | `security` / `cryptography` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **a shared secret over a public channel (colour mixing, then numbers)**.

The student: step both sides and the eavesdropper.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: feeds inet-tls-handshake
- RFC 2631, *Diffie-Hellman Key Agreement Method*, §2.1.1 (ZZ = g^(xb·xa) mod p).
- RFC 3526, *More Modular Exponential (MODP) Diffie-Hellman groups for IKE* (real group sizes, 2048 bit and up).
- RFC 7748, *Elliptic Curves for Security* (X25519, what is used today; out of scope here, named on the page).
- RFC 8446 (TLS 1.3) §4.4.3 CertificateVerify: why the exchange is signed (the Mallory preset).
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md`, „Šifriranje prometa: VPN, TLS i dvije vrste enkripcije", Šire o temi (agreeing a secret without sending it over a tapped network); terms *zajednička tajna*, *čovjek u sredini*.

## Model and presets

- **Scene:** three columns: Alice (left), the public channel with Eve listening (middle), Bob (right). Each party
  has a "knows" box (public values in plain cards, secrets in hatched cards with a lock shape). Two modes on one
  stage: `paint` (colour mixing) and `numbers` (modular arithmetic); the two rows can be shown together so the
  analogy maps value by value.
- **State:** `{ mode, phase, alice: {secret, sent, received, shared}, bob: {…}, eve: {seen: [], guess}, mallory:
  {active, aliceSide, bobSide}, log: [] }`; in `numbers` all values are integers; in `paint` a mixture is a list
  of paint ids with counts (`{yellow: 1, red: 1}`), rendered as the averaged colour.
- **One step:** one action of one party, in order: 1 agree public p, g (or common paint) in the open; 2 Alice
  picks secret a; 3 Bob picks secret b; 4 Alice computes A; 5 Bob computes B; 6 A crosses the channel (Eve copies
  it); 7 B crosses (Eve copies it); 8 Alice computes s = B^a; 9 Bob computes s = A^b; 10 compare: equal; 11 Eve's
  view: what she holds and what she would need. Within a step: compute, then send, then update Eve's list.
- **Rules:**
  1. Public: p (prime) and g; A = g^a mod p, B = g^b mod p (RFC 2631 §2.1.1; standard textbooks).
  2. Shared secret: s = B^a mod p = A^b mod p = g^(ab) mod p, because exponentiation commutes (RFC 2631 §2.1.1).
  3. Secrets a, b never cross the channel; only p, g, A, B do. Eve sees exactly those four (textbook).
  4. Eve's shortcut fails: A·B mod p = g^(a+b), not g^(ab); show her product beside the true s (derived).
  5. Eve's only generic route in the sim is trying exponents x = 1 … p−2 until g^x = A (discrete logarithm); the
     sim shows the count, which grows with p (textbook; real sizes ≥ 2048-bit p, RFC 3526, or X25519, RFC 7748).
  6. Paint mode: mixing is commutative and cannot be un-mixed; Eve combining the two public mixtures gets
     2×common + red + teal, a different shade from common + red + teal (derived, the standard analogy).
  7. A bad g (order 2, e.g. g = p−1) gives A, B ∈ {1, p−1}: the secret has two possible values (derived).
  8. Active attacker (Mallory) swaps A and B for her own g^m: each side shares a different key with Mallory,
     both "succeed", and neither notices; plain DH has no authentication (RFC 8446 §4.4 signs the exchange).
  Tie-break: if a party's secret equals another's (a = b) the protocol still works; show it, no special case.
- **Params:** `mode` choice paint/numbers (default numbers); `p` select {23, 97} (23); `g` select {5, 2, 22}
  (5); `a` range 2…p−2 (6); `b` range 2…p−2 (15); `mallory` toggle (off); `showPaint` toggle side by side (on).
- **Presets:**
  - `textbook` p=23, g=5, a=6, b=15 → A=8, B=19, s=2 on both sides; Eve's A·B mod 23 = 14 ≠ 2. From the standard
    textbook example (also the common Wikipedia example), numbers checked.
  - `paint` colour mixing: common yellow, Alice red, Bob teal; both end with yellow+red+teal; Eve's mix differs.
    Derived, unchecked as colour values.
  - `small-a` p=23, g=5, a=4, b=3 → A=4, B=10, s=18; Eve finds a=4 after 4 tries: small p is brute-forceable.
    Derived, checked by script.
  - `bad-g` p=23, g=22 → A=1, B=22, s=1 (order of 22 is 2). Derived, checked by script.
  - `bigger` p=97, g=5, a=36, b=58 → A=50, B=44, s=75; Eve's search space 95. Derived, checked by script.
  - `mallory` p=23, g=5, a=6, b=15, m=3: Mallory sends 10 to both; Alice's key 6, Bob's key 5, Mallory holds both.
    Derived, checked by script.
- **Steps:** 11 for every preset; `mallory` 13 (two extra interception steps).
- **Legend:** public value (plain card), secret (hatched card + lock), sent over the channel (arrow), Eve's copy
  (eye icon), changed (kit highlight on the card computed or sent in this step).
- **Captions:** hr: "Alice računa A = 5⁶ mod 23 = 8 i šalje ga javnim kanalom; Eve ga bilježi." / en: "Alice
  computes A = 5⁶ mod 23 = 8 and sends it over the public channel; Eve records it." — hr: "Oboje imaju s = 2, a
  tajna nikad nije prošla kanalom." / en: "Both now hold s = 2, and the secret never crossed the channel."
- **Terms:** shared secret — zajednička tajna; public key — javni ključ; private key — privatni ključ; key
  exchange — razmjena ključa (*key exchange*); eavesdropper — prisluškivač; man in the middle — čovjek u sredini;
  discrete logarithm — diskretni logaritam; modulus — modul.
- **Misconceptions:** DH encrypts the message (it only agrees a key); the shared key is sent at some point; DH on
  its own stops an active attacker.
- **Out of scope:** elliptic curves, ephemeral vs static keys, key derivation (HKDF), TLS message formats
  (`tls-handshake`), safe-prime selection.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `diffie-hellman` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh diffie-hellman sims/diffie-hellman` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/diffie-hellman/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
