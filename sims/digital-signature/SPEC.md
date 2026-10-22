<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# digital-signature: spec

One concept: **sign with the private key, verify with the public key; tampering breaks it.**
Task: `docs/tasks/w2/digital-signature.md`; catalogue `sec-digital-signature` (§4.3), overlap §5.5.

## Scene

Alice (left) holds her private key d. The network in the middle has Mallory on it. Bob (right) holds the public
key (e, n) he believes is Alice's. A message card and a signature card (a seal) travel together over the kit's
view K2 (`kit/topology.js`): Alice → network in step 4, network → Bob in step 5. Under each party a work strip:
Alice hash → exponent (sign); Bob hash → exponent (recover) → compare. Mallory's strip shows what she sees and
what she does.

## Keys (toy RSA, textbook example)

| Owner | p | q | n | e | d | check |
|---|---|---|---|---|---|---|
| Alice | 61 | 53 | 3233 | 17 | 2753 | e·d = 46801 = 15·3120 + 1, φ = 60·52 = 3120 |
| Mallory | 47 | 59 | 2773 | 17 | 157 | e·d = 2669 = 1·2668 + 1, φ = 46·58 = 2668 |

Source: the standard textbook RSA example (p = 61, q = 53, e = 17, d = 2753); Mallory's key from the task file.
Both checked with Python (`pow(e·d, 1, φ) = 1`).

## Hash

h = SHA-256(UTF-8 bytes of the message), read as a 256-bit big-endian integer, **mod n of the key used** (Alice's n
when she signs; the n of the key Bob trusts when he verifies). SHA-256 is FIPS 180-4, copied from
`sims/hash-properties/sim.js @ 377c608`; the reduction mod n is done byte by byte (r = (256·r + b) mod n), exact
in doubles. Textbook simplification: no padding (RFC 8017 §8 uses EMSA-PSS or EMSA-PKCS1-v1_5); the page says so.

| Message | SHA-256 (hex) | mod 3233 | mod 2773 |
|---|---|---|---|
| `Plati 100 EUR` | `82ea917f…86b7fb8b` | 2363 | 741 |
| `Plati 900 EUR` | `78426577…cde6c9d0` | 233 | 144 |

The message is data (the same Croatian string in both languages; English adds a gloss "pay 100 EUR"), so the
numbers do not depend on the page language.

## Rules

1. **Sign with the private key, verify with the public key; the signature is over the hash.** s = h^d mod n
   (Alice, step 3); Bob recovers v = s^e mod n with the public key he trusts (step 7) and compares v with h' = hash
   of what he received (step 8). Valid iff v = h'. Source: textbook RSA; RFC 8017 §8 (signature schemes with
   appendix), simplified to no padding *(stated on the page)*.
2. **Any change to the message changes h', so v ≠ h'.** (`edit`: Mallory replaces the message, keeps s.) Derived
   from the hash rule of `hash-properties`.
3. **A signature made with another private key does not verify with Alice's public key.** (`resign`: Mallory signs
   her message with d = 157, n = 2773; Bob verifies with Alice's e, n.) Textbook.
4. **Wrong public key: the forgery verifies.** (`swapkey`: in step 5 Mallory also swaps the key Bob holds for hers,
   under Alice's name, and sends her message signed with her key.) The signature proves possession of *a* private
   key, not whose it is; binding key to name is the certificate's job (feeds `cert-chain`). Derived.
5. **A signature does not hide the message.** Mallory reads the message in step 4 in every preset; confidentiality
   is a separate matter (`sym-vs-asym`). Textbook.

**Tie-break (toy sizes).** "Valid" is decided by v = h' alone, as Bob would. The page then asks whether the valid
verdict is *explained*: the holder of the private key matching Bob's key signed exactly the received message. A
valid verdict that is not explained is an accident of the toy numbers:
- `collision`: the signature was made by the key Bob trusts, over a different message with the same toy hash
  (h(m') = h(m) mod n, a 1 in n chance). The page says "collision of the toy hash, impossible at real sizes".
  Example: `Plati 5529 EUR` hashes to 2363 mod 3233, like `Plati 100 EUR` (Python, checked).
- `chance`: a signature from another key happens to give v = h' (1 in n). Example: Mallory re-signs
  `Plati 246 EUR` with her key, and with Alice's key v = h' (Python, checked).
The model is tested with both; the presets avoid both (checked below and in the tests).

## Params

| Key | Values | Default |
|---|---|---|
| `msg` | `Plati 100 EUR`, `Plati 900 EUR` | `Plati 100 EUR` |
| `attack` | `none`, `edit`, `resign`, `swapkey` | `none` |
| `showNumbers` | on / off (off: symbols and the verdict only) | on |
| `forged` | (model only, for tests) Mallory's message; default the other of the two | — |

## Steps (9 for every preset)

1 `write` Alice writes the message · 2 `hash` h = H(m) mod n · 3 `sign` s = h^d mod n · 4 `send` message + s to the
network (Mallory sees the message) · 5 `mallory` Mallory acts (nothing / edit / resign / swap key) and the pair goes
on to Bob · 6 `bobHash` h' = H(m') mod n_B · 7 `recover` v = s^e mod n_B · 8 `compare` v = h' → valid / invalid ·
9 `conclude` what Bob can and cannot conclude.

## Expected numbers (all checked with Python, the script in `NOTES.md`; repeated in `sim.test.js`)

`msg = Plati 100 EUR` (h = 2363, s = 1834):

| Preset | Bob gets | sig | key Bob uses | h' | v | verdict |
|---|---|---|---|---|---|---|
| `honest` (none) | Plati 100 EUR | 1834 | Alice 3233 | 2363 | 2363 | valid |
| `tamper` (edit) | Plati 900 EUR | 1834 | Alice 3233 | 233 | 2363 | invalid |
| `resign` | Plati 900 EUR | 1945 | Alice 3233 | 233 | 2145 | invalid |
| `swapkey` | Plati 900 EUR | 1945 | Mallory 2773 | 144 | 144 | valid (forged) |

`msg = Plati 900 EUR` (h = 233, s = 3161): none 233 = 233 valid; edit h' = 2363, v = 233 invalid; resign sig 2,
v = 1752 ≠ 2363 invalid; swapkey sig 2, h' = 741 = v valid (forged). No preset or param combination hits the
tie-break.

## Conclusion (step 9)

- `authentic` (valid, Bob trusts Alice's key, explained): the message is unchanged and was signed with the private
  key matching Alice's public key; Alice cannot deny it (non-repudiation) *(term check)*. Not concluded: that the
  message was secret (Mallory read it), or when it was sent.
- `reject` (invalid): something changed, the message or the signature; Bob cannot tell which, nor by whom, nor
  recover the original. He rejects it.
- `wrongKey` (valid with Mallory's key): Bob concludes "Alice sent Plati 900 EUR", which is false: the signature only
  proves the signer holds the private key matching the key Bob holds. A certificate binds a key to a name.
- `collision` / `chance`: the toy-size accident above.

## Legend

private key (key with hatched bow), public key (open padlock), message (card), signature (seal), valid (check,
`--ok`), invalid (cross, `--danger`), changed (kit highlight).

## Out of scope

Padding (PSS), ECDSA/EdDSA, certificate chains (`cert-chain`), timestamps.
