<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# digital-signature: notes

New stepper (task `docs/tasks/w2/digital-signature.md`, catalogue `sec-digital-signature`, wave 2b). Rules and
expected numbers: `SPEC.md`. Drawn on the kit's view K2 (`kit/topology.js`), as the task asks now that K2 exists.

## Decisions

- **Layout.** Top row: "Poruka i potpis" (the message card and the signature seal, where they are now: at Alice, on
  the network, Mallory → Bob, at Bob; what Mallory changed is highlighted, the old message struck through) and
  "Bobova provjera" (v, h', the verdict, and at step 9 two lists: what Bob can and cannot conclude). Under them K2:
  Alice, Mallory, Bob in three columns (gap 9cqw so the `m + s` chip fits on the link), each card with its keys, and
  under each card its work strip built with `Simdeck.topology.table` (labels in the body font, values in mono).
- **Mallory is a node, not a cloud.** The task puts "the network with Mallory on it" in the middle; a host card for
  Mallory carries her keys and her role "na mreži: čita i mijenja", which a cloud pill could not.
- **Hash mod n of the key in use.** Alice reduces SHA-256 mod her n; Bob reduces mod the n of the key he trusts. In
  `swapkey` that is Mallory's 2773, so h' = 144 (the task gives the other numbers; this one follows from "SHA-256 of
  the message mod n" and was checked with Python).
- **`swapkey` swaps the key in step 5**, as the task's step list says ("Mallory acts: … swap the public key Bob
  holds"). Bob's key chip changes there (highlighted, n = 2773, tag "zapravo Mallorin"); its label stays 'javni ključ „Alice"'
  (en '"Alice's" public key'), in quotes because that is what Bob believes. Mallory also sends her own message signed with her key:
  swapping the key alone would make Alice's genuine signature fail, which is not the attack the preset teaches.
- **Mallory's message is the other of the two**, so `msg = Plati 900 EUR` gives the mirror demo (edited to
  Plati 100 EUR). All eight combinations are in `SPEC.md` and the tests. `forged` is a model-only param (no control)
  so the tests can reach the tie-break.
- **Tie-break as a classification**, not a special case of the edit preset: Bob's verdict is v = h' alone; step 9 then
  asks whether the verdict is explained (the holder of the trusted key signed exactly the received message).
  Unexplained valid verdicts are `collision` (same toy hash; the page says "kolizija sažetka igračke, nemoguća kod
  pravih veličina") or `chance` (another key gave v = h' by luck). Test cases found by search: `Plati 5529 EUR`
  (hash 2363 mod 3233) and `Plati 246 EUR` (Mallory's signature verifies with Alice's key). Neither is reachable from
  the page's controls; the strings exist for the model's sake.
- **The message is data** ("Plati 100 EUR" in both languages, `translate="no"`): its hash is what is signed, so the
  numbers must not depend on the page language. The English choice labels gloss it ("pay 100 EUR").
- **`showNumbers` off** shows the formulas as symbols (h = SHA-256(m) mod n, s = hᵈ mod n, v = sᵉ mod n), the keys as
  d and e, n, and the verdict as v = h' or v ≠ h'. The captions use the same placeholders.
- **Exponents are written with `^`** (s = 2363^2753 mod 3233), as in the task's captions. Unicode superscripts in the
  mono font came out spaced and small (fresh review); the explanation, in the body font, keeps hᵈ and sᵉ.
- **The digest is shortened** to its first 6 and last 4 hex characters (82ea91…fb8b) to fit the work strip.
- **Mallory's strip shows her own hash** (h = SHA-256(m) mod 2773 = 144) when she signs, so the second hash of the same
  message is visibly a different modulus, not a different message (fresh review).
- **Bob's knowledge vs the narrator's.** Step 9's lists say only what Bob can know: "signed by the owner of the key pair
  he holds as Alice's", and non-repudiation only "if the key really is Alice's". Step 8 keeps the task's caption
  ("the message was changed"), which is the narrator's view; step 9 then says so ("We can see what happened; Bob only
  sees v ≠ h'").
- **Control specs carry `value`** (the model defaults), following the `hash-properties` fresh-review finding that the
  kit falls back to a spec's `value`, not to `defaults`, for a bad URL value.
- **Colours:** Alice c1, Mallory c5, Bob c3 (series colours of the marks and the strips' left bars); the names, the
  marks' letters and the positions carry the same information. Valid is a solid green border with a check, invalid a
  dashed red border with a cross; a message Bob got that differs from Alice's has a dashed red border.
- Tags: `cryptography`; topic `security`; level `core` (the task's). All exist in `tags.json`. The task's note about a
  stray `nat` tag does not apply: `cryptography` only.

## Deviations from the task

- Mallory re-signs in `swapkey` as well as swapping the key (the task implies it: "her signature verifies").

## Sources

- RFC 8017, *PKCS #1 v2.2*, §8 (signature schemes with appendix): sign with the private exponent, verify with the
  public one, over an encoded hash. Simplified to textbook RSA over SHA-256 mod n, no padding; the page says so in
  the explanation ("bez dopune (PKCS #1 je propisuje)").
- Textbook RSA example p = 61, q = 53, e = 17, d = 2753 (standard textbook example); Mallory's key p = 47, q = 59,
  e = 17, d = 157 from the task. e·d = 1 mod φ checked for both (Python and a test).
- SHA-256: FIPS 180-4, code from `sims/hash-properties/sim.js @ 377c608`; checked against the empty-string test value
  and `hashlib`.
- URM ch18 (*cjelovitost*, *autentikacija*) and its research notes `meta/chapter-18/research.md:91-99` (NIST SP 800-12:
  *povjerljivost* (confidentiality), *cjelovitost* (integrity), *neporecivost* (non-repudiation), *autentičnost*
  (authenticity)). This settles the task's *(check)* on *neporecivost*.

Numbers check (Python 3, run before coding; every value is also asserted in `sim.test.js`):

```python
import hashlib
A = dict(n=3233, e=17, d=2753); M = dict(n=2773, e=17, d=157)
H = lambda m, n: int(hashlib.sha256(m.encode()).hexdigest(), 16) % n
msgs = ['Plati 100 EUR', 'Plati 900 EUR']
for m in msgs:
    f = msgs[1 - msgs.index(m)]
    h = H(m, A['n']); s = pow(h, A['d'], A['n'])
    for att in ['none', 'edit', 'resign', 'swapkey']:
        rm = m if att == 'none' else f
        rs = s if att in ('none', 'edit') else pow(H(f, M['n']), M['d'], M['n'])
        K = M if att == 'swapkey' else A
        print(m, att, rm, rs, H(rm, K['n']), pow(rs, K['e'], K['n']))
```

## Unchecked *(check)*

- Nothing numeric. The Croatian phrasing "kolizija sažetka mod n" is mine; it is reachable only through the model, not
  the page.

## Term pairs

In `kit/glossary.js`: *private key* — privatni ključ, *public key* — javni ključ, *certificate* — certifikat (used as
`[[terms]]` in the explanation). Missing, written out in both tables (`<i lang="en">`):

| en | hr | source |
|---|---|---|
| digital signature | digitalni potpis | task file |
| hash | sažetak | task file, `hash-properties` (also missing there) |
| integrity | cjelovitost | URM ch18 |
| authenticity | autentičnost | URM ch18 research notes (NIST SP 800-12) |
| non-repudiation | neporecivost | URM ch18 research notes (NIST SP 800-12) |

## Shared requests

- **Promote SHA-256 to `models/`** (`models/sha256.js`: `sha256`, `sha256Bytes`, `utf8`, `hex`): `hash-properties` and
  this sim now carry the same copy (`// from sims/hash-properties/sim.js @ 377c608`), and `cert-chain` will need it.
- The K2 view could take a node as a packet `label` (or a `chipData` flag) so a chip can be data (`translate="no"`);
  here the chip is `m + s`, the same string in both tables.

## Fresh review (2026-10-22)

A fresh agent read the task, `SPEC.md` and the code, recomputed every number with Python (all match), rendered all 32
combinations (language × message × attack × numbers) at every step, and ran ~45 mutations. Fixed:

- Step-9 "authentic" list overclaimed (signed with *Alice's* key, Alice cannot deny): now hedged on the key binding.
- Step 8 and step 9 contradicted each other (narrator vs Bob): step 9 now names the difference.
- Test gaps: phase order compared with itself; values set a step early, `malloryDid`, the `changed` marks, the wire
  at step 5 and `defaults.showNumbers` were untested. Six tests added; each of the 14 surviving mutations now fails.
- English captions used Croatian quotes: the quote marks are now a string (`quoted`) per language.
- With numbers off, step 8 read "v = h': v = h'": the captions now start "Bob uspoređuje: …".
- Superscripts in mono hard to read: `^` (see Decisions). Mallory's hash row added.
- Croatian: "Poruka nije bila tajna.", the step-9 reject caption rewritten, "kolizija sažetka mod n".
- The hash-vs-message misconception now says why: RSA signs numbers below n, and an unhashed textbook signature can be
  forged (pick s, m = sᵉ mod n).

Kept: the preset hints name numbers and "Plati 900 EUR" (they are correct: a preset resets `msg` to the default).

## Time

Start 15:52; first gate pass about 16:00; fresh review and its fixes done 16:15. About 25 minutes in all.
