# digital-signature: Digital signatures

| | |
|---|---|
| Task | `digital-signature` (wave 2b, Security foundations) |
| Catalogue entry | `sec-digital-signature` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/digital-signature/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | SEC |
| Topic / tags / level | `security` / `cryptography` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **sign with private, verify with public; tampering breaks it**.

The student: sign, tamper, verify.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: feeds inet-cert-chain
- RFC 8017, *PKCS #1: RSA Cryptography Specifications Version 2.2*, §8 (signature schemes with appendix), simplified to textbook RSA on the page.
- URM ch18 „Šifriranje prometa: VPN, TLS i dvije vrste enkripcije" (*cjelovitost*, *autentikacija*; TLS „prevents … message forgery", RFC 8446 Abstract as quoted there).
- Toy numbers: the standard textbook RSA example (p = 61, q = 53, e = 17, d = 2753).

## Overlaps (catalogue §5)

- **§5.5 TLS and certificates:** Handshake and chain are separate pages. Certificate expiry from the DR estate is a preset of inet-cert-chain. Revocation and ACME extend the chain page if they are built at all.

## Model and presets

- **Scene:** Alice (left, holds private key d), the network with Mallory on it (middle), Bob (right, holds Alice's
  public key e, n). A message card and a signature card travel together (K2 topology with moving packets once it
  exists). Under each party a "work" strip: hash → modular exponent → compare.
- **State:** `{ phase, msg, sigFrom, sig, recvMsg, recvSig, hashSent, hashRecv, recovered, valid, keys: {alice:
  {n, e, d}, mallory: {n, e, d}}, bobTrusts: 'alice'|'mallory' }`; toy RSA with small integers; hash = SHA-256 of
  the message mod n (reuse `hash-properties`' SHA-256).
- **One step:** 1 Alice writes the message; 2 hashes it (h); 3 signs: s = h^d mod n; 4 sends message + s;
  5 Mallory acts (per preset: nothing, edit message, re-sign with own key, swap the public key Bob holds);
  6 Bob hashes what he received (h'); 7 Bob recovers v = s^e mod n with the public key he trusts; 8 compare
  v = h' → valid / invalid; 9 conclusion card (what Bob can and cannot conclude).
- **Rules:**
  1. Sign with the private key, verify with the public key; the signature is over the hash of the message
     (textbook; RFC 8017 PKCS #1 v2.2 §8 signature schemes, simplified: no padding *(state on page)*).
  2. Any change to the message changes h' (hash rule from `hash-properties`), so v ≠ h' (derived).
  3. A signature made with any other private key does not verify with Alice's public key (textbook).
  4. If Bob holds the wrong public key (Mallory's), Mallory's forgery verifies: the signature proves possession of
     *a* private key, not whose it is; binding key to name is the certificate's job (feeds `cert-chain`).
  5. A signature does not hide the message; confidentiality is separate (`sym-vs-asym`).
  Tie-break: if the toy hash mod n happens to be equal for the edited message (1 in n chance), the page must
  say "collision of the toy hash, impossible at real sizes"; presets avoid it (checked below).
- **Params:** `msg` choice "Plati 100 EUR" / "Plati 900 EUR" (first); `attack` choice none/edit/resign/swapkey
  (none); `showNumbers` toggle (on).
- **Presets** (toy RSA p=61, q=53, n=3233, e=17, d=2753, the textbook RSA example; Mallory p=47, q=59, n=2773,
  e=17, d=157; hashes = SHA-256 mod n, all checked with Python):
  - `honest` "Plati 100 EUR": h = 2363, s = 1834, Bob gets v = 2363 = h' → valid. Derived, checked.
  - `tamper` Mallory changes to "Plati 900 EUR", keeps s = 1834: h' = 233, v = 2363 → invalid. Derived, checked.
  - `resign` Mallory signs "Plati 900 EUR" with her key: s = 1945; with Alice's key v = 2145 ≠ 233 → invalid.
    Derived, checked.
  - `swapkey` Bob was given Mallory's public key: her signature verifies → "valid" for a forged message; the
    caption points to certificates. Derived.
- **Steps:** 9 for every preset.
- **Legend:** private key (key with hatched bow), public key (open padlock), message (card), signature (seal
  shape), valid (check + `--ok`), invalid (cross + `--danger`), changed (kit highlight on the card or number
  produced this step).
- **Captions:** hr: "Alice potpisuje sažetak svojim privatnim ključem: s = 2363^2753 mod 3233 = 1834." / en:
  "Alice signs the hash with her private key: s = 2363^2753 mod 3233 = 1834." — hr: "Bob dobiva 2363, a sažetak
  primljene poruke je 233: poruka je mijenjana." / en: "Bob recovers 2363, but the received message hashes to
  233: the message was changed."
- **Terms:** digital signature — digitalni potpis; private key — privatni ključ; public key — javni ključ; hash —
  sažetak; integrity — cjelovitost; authenticity — autentičnost; non-repudiation — neporecivost *(check)*;
  certificate — certifikat.
- **Misconceptions:** signing is encrypting with the private key so the message is secret; a valid signature
  proves who sent it (only if the public key is trusted); signing the whole message vs its hash makes no difference.
- **Out of scope:** padding schemes (PSS), ECDSA/EdDSA, certificate chains (`cert-chain`), timestamps.
- **Note for the coordinator:** the task's tags list `nat`, which is unrelated; probably meant `cryptography`
  only (or `tls`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `digital-signature` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh digital-signature sims/digital-signature` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/digital-signature/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
