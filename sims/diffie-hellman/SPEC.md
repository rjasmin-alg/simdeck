<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# diffie-hellman: specification

One concept: **a shared secret over a public channel**, first with paint (colour mixing), then with numbers
(modular arithmetic). Task `docs/tasks/w2/diffie-hellman.md`, catalogue `sec-diffie-hellman` (§4.3). Class:
stepper. The student steps both sides and the eavesdropper.

## Scene

Three columns: Alice (left), the public channel with Eve listening (middle), Bob (right). Each party has a "knows"
box with fixed slots: public values on plain cards, secrets on hatched cards with a lock, the shared secret on a
hatched card with a double border. Slots that are still empty are dashed placeholders, so nothing moves while
stepping. Each card shows the number (`numbers`), the paint (`paint`), or both on one card, so the analogy maps
value by value. The middle column has the wire (the value crossing in this step, with its arrow) above Eve's box.
With `mallory` on, the middle party is Mallory, an active attacker, instead of Eve.

## Values

Every value carries both forms: `{ num, paint }`.

- `num`: an integer in 0…p−1.
- `paint`: a mixture, counts of paint ids in the fixed order `Y` (common, yellow), `R` (Alice, red), `T` (Bob,
  teal), `V` (Mallory, violet), e.g. `{ Y: 1, R: 1 }`. Rendered as the averaged colour of the units, with the
  recipe in words beside it (colour is never the only carrier).

| Value | Number | Paint |
|---|---|---|
| public (p, g) | p, g | `{Y:1}` |
| Alice's secret a | a | `{R:1}` |
| Bob's secret b | b | `{T:1}` |
| A | g^a mod p | `{Y:1, R:1}` |
| B | g^b mod p | `{Y:1, T:1}` |
| s at Alice | B^a mod p | B + R = `{Y:1, R:1, T:1}` |
| s at Bob | A^b mod p | A + T = `{Y:1, R:1, T:1}` |
| Eve's product | A·B mod p | A + B = `{Y:2, R:1, T:1}` |
| Mallory's secret m | 3 (fixed) | `{V:1}` |
| M | g^m mod p | `{Y:1, V:1}` |

## Rules

1. **Public values and the halves.** p (a prime) and g are public; A = g^a mod p, B = g^b mod p (RFC 2631
   §2.1.1; standard textbooks).
2. **The shared secret.** s = B^a mod p = A^b mod p = g^(ab) mod p, because exponentiation commutes:
   (g^b)^a = (g^a)^b (RFC 2631 §2.1.1: ZZ = g^(xb·xa) mod p). Paint: mixing is commutative, so B + R = A + T.
3. **What crosses.** Only p, g, A and B cross the channel; a, b and s never do. Eve sees exactly those four
   (textbook). In the model, a party's `knows` only grows by its own computation or by a value received over the
   wire; Eve's only by copying the wire.
4. **Eve's shortcut.** Multiplying what she saw gives A·B mod p = g^(a+b) mod p, not g^(ab) (derived). The sim
   shows her product beside the true s. Paint: A + B has two units of the common paint, s one, so the shade
   differs (rule 6).
   *Tie-break:* if a + b ≡ ab (mod the order of g), the product equals s by coincidence (e.g. p = 23, g = 5,
   a = b = 2: A·B = 2·2 = 4 and s = 2² mod 23 = 4). The sim says so: Eve cannot tell, because she does not know s.
5. **Eve's generic route** is trying exponents x = 1, 2, … p−2 until g^x mod p = A (a discrete logarithm). The sim
   shows the count of tries and the size of the search space p−2, which grows with p; real groups use p of 2048
   bits and more (RFC 3526: a number of 617 decimal digits), or elliptic curves such as X25519 (RFC 7748, named
   only). With the x she found, B^x mod p = s (derived).
   *Tie-break:* when g is not a generator, the first x found may differ from a (only x ≡ a modulo the order of g);
   it still gives the same s (p = 23, g = 2, a = 15, b = 15: A = B = 16, x = 4, B^4 mod 23 = s = 9). Paint has no exponent to try: paint
   cannot be un-mixed.
6. **Paint.** Mixing is commutative and cannot be undone. Eve combining the two public mixtures gets
   2×common + red + teal, a different shade from common + red + teal (derived; the standard analogy).
7. **A bad g.** g of order 2 (g = p−1, e.g. 22 for p = 23) gives A, B ∈ {1, p−1}, and s has only two possible
   values (derived). In general s is one of ord(g) values; Eve's box shows ord(g) at the last step.
8. **Mallory (active attacker).** She catches A and B and sends her own M = g^m mod p to each side instead. Alice
   computes M^a, Bob M^b: each side shares a different key with Mallory (A^m = M^a, B^m = M^b), both
   computations "succeed", and neither notices. Plain DH has no authentication; TLS 1.3 signs the exchange (RFC
   8446 §4.4.3, CertificateVerify).
   *Tie-break:* if a = b (or a ≡ b modulo the order of M), Alice's and Bob's numbers are equal by chance; Mallory
   still holds that key. The paints always differ (red against teal), so the comparison is per row.

**Tie-break a = b** (task): the protocol still works; A = B and s is the same on both sides. No special case.

## Parameters

| Param | Values | Default | Notes |
|---|---|---|---|
| `mode` | `numbers`, `both`, `paint` | `both` | what the cards show; captions follow numbers unless `paint` (the task's `mode` + `showPaint`, NOTES.md) |
| `p` | 23, 97 | 23 | hidden in `paint` (the paints are fixed) |
| `g` | 5, 2, 22 | 5 | hidden in `paint` |
| `a` | 2 … p−2 | 6 | clamped to the range when p changes; hidden in `paint` |
| `b` | 2 … p−2 | 15 | hidden in `paint` |
| `mallory` | toggle | off | resets to step 0 (13 steps instead of 11) |

## Steps

Honest run, 11 steps. Within a step: compute, then send, then Eve copies.

| n | Phase | What happens |
|---|---|---|
| 1 | `agree` | p and g (the common paint) agreed in the open: both sides know them, Eve copies them |
| 2 | `alicePick` | Alice picks secret a |
| 3 | `bobPick` | Bob picks secret b |
| 4 | `aliceCompute` | Alice computes A = g^a mod p |
| 5 | `bobCompute` | Bob computes B = g^b mod p |
| 6 | `sendA` | A crosses to Bob; Eve copies it |
| 7 | `sendB` | B crosses to Alice; Eve copies it |
| 8 | `aliceShared` | Alice computes s = B^a mod p |
| 9 | `bobShared` | Bob computes s = A^b mod p |
| 10 | `compare` | the two values are equal (the sim's view: they never send s to compare) |
| 11 | `eveView` | Eve's product A·B, her search for a, ord(g); what she holds and what she would need |

Mallory run, 13 steps: 1–5 as above, then

| n | Phase | What happens |
|---|---|---|
| 6 | `catchA` | A leaves Alice; Mallory catches it, Bob gets nothing |
| 7 | `forgeToBob` | Mallory picks m, computes M = g^m mod p, sends M to Bob in A's place |
| 8 | `catchB` | B leaves Bob; Mallory catches it |
| 9 | `forgeToAlice` | Mallory sends M to Alice in B's place |
| 10 | `aliceShared` | Alice computes M^a mod p (she thinks it is B^a) |
| 11 | `bobShared` | Bob computes M^b mod p |
| 12 | `compare` | Alice's and Bob's keys differ (or are equal by chance, rule 8); neither can see it |
| 13 | `malloryView` | Mallory computes A^m and B^m: she holds both keys |

## Presets

In this order (keys 1–6): paint first, as the concept says (colour mixing, then numbers).

| Id | Params | Expected | Source |
|---|---|---|---|
| `paint` | mode paint | both end with yellow + red + teal; Eve's mix 2×yellow + red + teal | standard analogy; colours are kit tokens, not real paint |
| `textbook` | p=23, g=5, a=6, b=15 | A=8, B=19, s=2 on both sides; Eve's A·B mod 23 = 14 ≠ 2; Eve finds x = 6 after 6 of 21 tries; ord(5) = 22 | standard textbook example; checked by script |
| `small-a` | p=23, g=5, a=4, b=3 | A=4, B=10, s=18; Eve finds x = 4 after 4 tries; A·B = 17 | derived, checked by script |
| `bad-g` | p=23, g=22 (a=6, b=15) | A=1, B=22, s=1; ord(22) = 2; Eve's x = 2 (≠ a, same s); A·B = 22 | derived, checked by script |
| `bigger` | p=97, g=5, a=36, b=58 | A=50, B=44, s=75; A·B = 66; Eve finds x = 36 after 36 of 95 tries; ord(5) = 96 | derived, checked by script |
| `mallory` | p=23, g=5, a=6, b=15, mallory on (m=3) | M=10 to both; Alice's key 6, Bob's 5; Mallory: A^m = 8³ mod 23 = 6, B^m = 19³ mod 23 = 5 | derived, checked by script |

Other checked values: p = 23, g = 2: ord 11, a = 15 → A = 16, Eve's x = 4 (with b = 15, s = 9; with b = 6, s = 4). p = 97: ord(2) = 48, ord(22) = 4.
2^2048 has 617 decimal digits.

## Out of scope

Elliptic curves (named only), ephemeral vs static keys, key derivation (HKDF), TLS message formats
(`tls-handshake`), safe-prime selection, faster discrete-log algorithms than trying.
