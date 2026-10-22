<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# sym-vs-asym: specification

One concept: **the key distribution problem and how public keys solve it.** Symmetric encryption uses one key both
ways, so the key has to reach the other side first, over a channel nobody can read; asymmetric encryption lets
anyone encrypt with a public key and only the private key's holder decrypt, and the private key never travels.
Counted over a group, the first costs a secret transfer per pair, the second none.
Task: `docs/tasks/w2/sym-vs-asym.md`; catalogue `sec-sym-vs-asym` (§4.3).

## Scene

- **Group:** n people on a ring, everyone talks to everyone. Person 0 is Alice (A), person 1 is Bob (B), the rest
  C, D, …. Eve is not a member: she sits on the network and copies everything that passes.
- **Two key rings, one per scheme:** symmetric, one shared key per pair, drawn on the edge; asymmetric, one key pair
  per person, the open padlock (public) outside the ring and the key with a hatched bow (private) inside.
  The rings show the group's **key bill**: every key needed for everyone to talk to everyone. A key that is needed but
  not made yet is dashed and hollow; the keys the demo makes (Alice and Bob's) are solid.
- **Counters** beside each ring: keys in the bill, and how many must travel over a secure channel.
  Symmetric: `n(n−1)/2` shared keys, each one a secret transfer. Asymmetric: `n` pairs = `2n` keys, 0 secret transfers.
  Under the rings (with both schemes) one line says which needs more keys (tie-break below).
- **Message lane:** one row per message: scheme, sender (with the keys they hold), network, receiver, and
  "Eve copies" (her keys, her copies of the ciphertext, and whether she can read). The messages: "Sastanak u 10" /
  "Meeting at 10" (Alice → Bob) and the reply "Može, vidimo se" / "OK, see you" (Bob → Alice). Ciphertexts are fixed
  made-up strings (data, not computed).

## State

`{ n, joined, phase, schemes, keys: [{ id, kind: 'shared'|'public'|'private', pair | owner, made, travelled:
'none'|'secret'|'open' }], counts: { sym: { total, secretTransfers }, asym: { total, pairs, secretTransfers } },
more: 'sym'|'asym'|'equal', lanes: { sym?, asym?, hybrid? : { msgs: [{ id, from, to, stage: 'plain'|'enc'|'wire'|'read',
keyUsed, decryptedWith, whole, eveCopy, eveCanRead, carries? }] } }, eve: { keys }, hybrid, changed }`.
Key ids: `s-i-j` (i < j), `pub-o`, `priv-o`. The hybrid's session key is `session` and is not in the bill.

The task's state names `travelled`, `msg.{from,to,plain,cipher,keyUsed,eveCanRead}` and `counts.{total,secretTransfers}`;
the model keeps those meanings, with `made` added (the bill is drawn from the start) and one message object per lane
row instead of a single `msg`.

## Rules

1. **Symmetric: the same key encrypts and decrypts, so both sides must exchange it beforehand** (URM ch18
   „Šifriranje prometa: VPN, TLS i dvije vrste enkripcije”, Što treba znati; NIST SP 800-12 Rev. 1 §9.1.1 as quoted
   in footnote `nist80012-crypto`). The model: the shared key AB is made and `travelled: 'secret'` at the *carry* step,
   before Alice encrypts; Bob decrypts with the same id. Every shared key in the bill counts one secret transfer
   (`secretTransfers = total`). The reply (single-scheme run) uses the same key the other way.
2. **Asymmetric: anyone may encrypt with a public key; only the holder of the matching private key decrypts; private
   keys are never transmitted** (same section). The model: `decryptingKey(pub-o) = priv-o`; a private key's
   `travelled` is always `'none'`; a public key is `'open'` once published, and Eve takes a copy (public means
   everyone). `asym.secretTransfers = 0` at every step. Eve never holds a private key. A reply needs the other
   side's public key: in the asymmetric run Alice publishes hers and Bob encrypts with `pub-0`.
3. **Key count, everyone talks to everyone:** symmetric `n(n−1)/2`; asymmetric `n` pairs = `2n` keys (textbook).
   The bill changes only when someone joins.
4. **A newcomer adds n new shared keys (one per existing member) but one key pair** (derived). Keys keep the order of
   `groupKeys(n + 1)`: shared keys by pair (i, then j), then the pairs by owner.
5. **Asymmetric is slower for bulk data, so real protocols (TLS) use asymmetric for agreement and symmetric for the
   data** (URM ch18, same section, and figure `ch18-simetricno-asimetricno-sifriranje.svg`: "TLS koristi oba:
   asimetrično, dogovor ključa → simetrično, prijenos podataka"). The model's hybrid step: Alice makes a fresh
   symmetric key S, sends it encrypted with Bob's public key (one public-key operation), then 3 data messages
   encrypted with S. Nothing travels secretly; Eve copies all four ciphertexts and reads none. The page does not
   time anything: "slower" is in the explanation, not modelled.
6. **Eve holding a public key cannot decrypt; Eve holding a copy of a shared key can** (derived). `canRead(holding,
   keyId)` is true only when the holder has `decryptingKey(keyId)`. With `eveHasSharedKey`, Eve copies AB at the carry
   step and reads every later symmetric message (the first and the reply); the asymmetric and hybrid messages stay
   unreadable.

**Tie-break (which scheme needs more keys):** compare `n(n−1)/2` with `2n`. Asymmetric needs more for n < 5 (n = 2:
1 against 4; n = 4: 6 against 8), **equal at n = 5 (10 and 10)**, symmetric more for n > 5. The page says so in the
step-0 caption and under the rings, always adding that only the symmetric keys travel secretly. The task's edge case
("n = 2: asymmetric costs more") is the n < 5 branch. Note: compared as *pairs*, n = 3 is the tie (3 and 3); the page
compares keys, as the task's `office4` line does (6 shared keys against 8 keys).

**Tie-break (one key, two names):** `sharedId(i, j) = sharedId(j, i) = s-min-max`.

## Steps

| # | `both` (11) | `symmetric` (6) | `asymmetric` (6) |
|---|---|---|---|
| 1 | want: the plaintext is at Alice in each lane | want | want |
| 2 | carry: AB reaches Bob over a secret channel (Eve copies it if stolen) | carry | publish: Bob's pair, public key to all |
| 3 | symEnc: Alice encrypts with AB | symEnc | asymEnc: with Bob's public key |
| 4 | symEve: Eve copies the ciphertext, reads it only with the stolen key | symEve | asymEve: Eve has the public key and the ciphertext, cannot read |
| 5 | symDec: Bob decrypts with AB | symDec | asymDec: Bob decrypts with his private key |
| 6 | publish | symReply: Bob → Alice with AB; Eve reads it if she has AB | asymReply: Alice publishes her pair, Bob → Alice with her public key |
| 7 | asymEnc | | |
| 8 | asymEve | | |
| 9 | asymDec | | |
| 10 | join: n → n + 1, +n shared keys, +1 pair | | |
| 11 | hybrid (TLS order) | | |

## Params

| Param | Range / options | Default | Note |
|---|---|---|---|
| `n` | 2 … **30** | 4 | resets. The task says 2…12, but its own `class30` preset needs 30 (NOTES.md, Deviations) |
| `scheme` | both / symmetric / asymmetric | both | resets (it changes the step count) |
| `eveHasSharedKey` | toggle | off | disabled with a reason under `asymmetric` |

## Presets and expected numbers

Checked by a scratch script over the model before the page was written, and pinned in `sim.test.js`.

| Preset | Params, start | Expected | Source |
|---|---|---|---|
| `book` | n = 2, step 0 | 1 shared key (1 secret transfer) against 2 pairs = 4 keys (0); the demo carries exactly 1 key secretly; join → 3 against 3 pairs | URM ch18 figure |
| `office4` | n = 4, step 0 | 6 shared keys against 4 pairs = 8 keys, 0 secret transfers; join → 10 and 10 (equal) | derived |
| `class30` | n = 30, step 0 | 435 shared keys against 30 pairs = 60 keys; join → 465 against 31 pairs | derived |
| `newcomer` | n = 10, step 9 | step 9 → 10: symmetric 45 → 55 (+10), asymmetric 10 → 11 pairs (+1) | derived |
| `stolen` | n = 2, symmetric, Eve has AB, step 0 | 6 steps; Eve reads the message (step 4) and the reply (step 6) | derived |
| `hybrid` | n = 4, step 10 | step 11: 1 public-key operation, 3 symmetric messages, 0 secret transfers, Eve reads nothing | URM ch18 |

## Not modelled (out of scope)

How a key is agreed without sending it (`diffie-hellman`), signatures (`digital-signature`), certificates, algorithm
internals, speed. The ciphertexts are labels, not encryption.
