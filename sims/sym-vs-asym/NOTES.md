<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# sym-vs-asym: notes

New stepper (task `docs/tasks/w2/sym-vs-asym.md`, catalogue `sec-sym-vs-asym`, §4.3, wave 2b). Rules, tie-breaks and
expected numbers: `SPEC.md`. No kit view: the task names none, and the scene (two key rings beside a message lane) is
none of K1–K4, so the page draws it (SVG shapes without text, HTML labels).

## Decisions

- **The rings show the key bill.** Every key the group needs for everyone to talk to everyone is drawn from step 0,
  dashed and hollow until made; only Alice and Bob's keys become solid during the demo. That keeps the counters stable
  (they are the whole group's numbers, as the task's preset lines are) and makes the newcomer's step a pure delta:
  +n dashed edges against one dashed pair, with "+n keys" and "+1 pair" badges.
- **Counters** are "keys in the bill" and "keys that must travel secretly" (symmetric: every shared key; asymmetric:
  "none travels secretly"); see Deviations for the task's "counter +1".
- **Comparison line** under the rings: which scheme needs more keys, with the tie at n = 5 (10 and 10) and the
  n = 2 edge case ("asymmetric costs more", 4 against 1) from the task; it always adds that only symmetric keys travel
  secretly. The step-0 caption and the join caption repeat it.
- **Message lane**: one row per message, columns sender / network / receiver / "Eve copies". Each person cell shows the
  keys that person holds in that scheme (shared AB; everyone's public keys; one's own private key), so "Eve has the
  public key too" and "the private key stays with Bob" are visible, not only told. Eve's column shows her keys, her
  copies and a verdict (✓ reads, double red border / ✕ cannot read, green), never colour alone.
- **Single scheme, 6 steps**: the sixth step is a reply (Bob → Alice). Symmetric: the same key both ways (the book's
  figure: "isti ključ, oba smjera"), and with the stolen key Eve reads it too ("she reads every later message").
  Asymmetric: Bob needs Alice's public key, so she publishes hers. With both schemes the reply is left out to keep
  11 steps; the book preset shows one message per scheme (see Deviations).
- **Hybrid wording.** The step is key transport (a fresh key encrypted with Bob's public key), which is what the
  task asks for. The page calls it "TLS order" (asymmetric first, then symmetric for the data: the book's words and
  figure), not "as TLS": TLS 1.3 (RFC 8446, which the book cites) agrees on the key instead of sending it. The
  explanation says so ("today's TLS does not send the key but agrees on it, in the same order") and leaves the how to
  `diffie-hellman`. Preset: "Hibridno, redoslijed TLS-a" / "Hybrid, TLS order".
- **Hybrid** (step 11) is one row: Alice holds a fresh key S, the network carries one ciphertext of S (Bob's padlock)
  and "3 ×" data ciphertexts (key S), with the line "1 × public key, 3 × key S"; Bob unlocks S and reads 3 messages;
  Eve has all four and reads none. S is not in the ring: it is per conversation, not part of the group's bill.
- **Eve takes Bob's public key when it is published** (step 6), not at step 8: public means everyone. Step 8's caption
  is the task's.
- **Presets** start at step 0, except `newcomer` (step 9, so → shows the join) and `hybrid` (step 10, so → shows the
  hybrid). `stolen` uses n = 2, `book` n = 2 (the figure has one sender and one receiver).
- **Labels**: rings name every person up to 13 (A, B, C, …); above that only A and B, outside the ring. Key glyphs sit
  on every edge up to n = 6 and on AB always, 38 % along the edge so crossing diagonals don't share a spot.
- **Ciphertexts** are fixed made-up 4-character strings (`7fQ2…`), data with `translate="no"`; nothing is encrypted.
- **Changed** marks: the keys made, Eve's new holdings, the moved message, the newcomer and their keys, the counters
  at the join. On the highlighter, icons take `--on-hl` (series colours on yellow fail contrast in the dark theme).
- **Words**: Alice, Bob, Eve as in the task (both languages). "šifrat" is the task's Croatian for ciphertext.
- **Related:** `tls-handshake`, `ssh-key-auth`, `cert-chain`. `diffie-hellman` and `digital-signature` (named as out
  of scope) are not built yet; the explanation names the topics without links.

## Deviations from the task

- **Counters**: the task's counters are "keys in existence" and "keys that must travel over a secure channel", with
  "secret transfer, counter +1" at step 2. The page counts the whole group's bill from step 0 (stable numbers, the
  task's preset lines) and shows the one transfer on the key itself: the AB chip in the network column, "over a secret
  channel" (or, with the stolen key, the eye and "Eve copied it"). A third counter would have shown 1 next to the
  bill's 6.
- **`n` range 2…30, not 2…12**: the task's own `class30` preset needs n = 30 (the kit clamps a range to its bounds).
  The join makes it 31.
- **The book preset**: "one message each way" is one message per scheme (the figure's two halves, sender → receiver);
  the reply direction is in the single-scheme runs (step 6), because the 11-step `both` run has no room for two more
  steps. `book` still shows 1 secret transfer against 0.
- **State shape**: `made` added to each key (the bill is drawn from the start); one message object per lane row
  instead of one `msg`; `counts` per scheme (SPEC.md "State").

## Sources

- URM `book/chapters/18-kiberneticka-sigurnost.md`, „Šifriranje prometa: VPN, TLS i dvije vrste enkripcije”, Što
  treba znati (plaintext/ciphertext, the same key both ways must be exchanged beforehand, any party encrypts with a
  public key, only the private key's holder decrypts, private keys need not be transmitted, asymmetric slower for bulk,
  TLS uses both) with footnote `nist80012-crypto` (NIST SP 800-12 Rev. 1 §9.1.1, quoted there; not read separately),
  and Šire o temi (two parties with no prior shared secret).
- Figure `assets/diagrams/ch18-simetricno-asimetricno-sifriranje.svg` (its labels: "isti ključ, oba smjera", "mora
  se prenijeti", "javni ključ: svima dostupan, njime se šifrira", "privatni ključ: samo primatelj, njime se dešifrira",
  "TLS koristi oba: asimetrično dogovor ključa → simetrično prijenos podataka").
- URM `meta/plan-interaktivne-stranice.md` names the card ("simetrično i asimetrično šifriranje", ch18) without
  further detail.
- Counting n(n−1)/2 and 2n: textbook; the preset numbers were checked with a scratch script over the model before the
  page was written, then pinned in `sim.test.js`.

## Unchecked *(check)*

- Croatian "otvoreni tekst" for plaintext (the task marks it *check*; the page does not use the word: the plaintext is
  shown as the message itself). "šifrat" for ciphertext (task, *check*).
- "ključ sesije" for session key (not in the book).

## Term pairs

Not in `kit/glossary.js`; the explanation writes the first two out (*symmetric encryption* (simetrično šifriranje)).
Proposed for the glossary with `"src": "simdeck"`:

| English | Croatian | Source |
|---|---|---|
| symmetric encryption | simetrično šifriranje | task, URM ch18 |
| asymmetric encryption | asimetrično šifriranje | task, URM ch18 |
| plaintext | razumljivi podaci | URM ch18 *(check: otvoreni tekst)* |
| ciphertext | šifrat | task *(check)* |
| key exchange | razmjena ključa | task |
| encryption in transit | šifriranje u prijenosu | URM ch18 |
| session key | ključ sesije | none *(check)* |

## Shared requests

- **Kit: legend swatches with an icon.** The page puts its own SVG icons into `.sd-swatch[data-shape="k-…"]` after
  mount; a `legend[].icon` (an element or SVG markup) would make that the kit's job.

## Checks

- Tests: 31. Two tie-breaks first (which scheme needs more keys, equal at n = 5; one id per shared key and one key order
  after a join), rules 1–6, an invariant over 18 runs × every step × every message (encrypted with a key the
  receiver opens, made before use; only the receiver's private key decrypts; the session key reached the receiver
  first), whole messages, the asymmetric reply's keys, the newcomer's keys not made, the `changed` ids per step, the
  message stages, the step sequences pinned explicitly, every preset's numbers, n range and rounding, lanes per
  scheme, then the template's generic block (over five runs, since the step count depends on the scheme).
- Mutation pass on the model: my 23 mutations (all killed, after a stage test was added for the one survivor), then the
  reviewer's 63: after the fixes 59 killed, 3 equivalent survivors (pairs counted by private instead of public key,
  `slice(0, 2)` over at most two schemes, `phase || 'x'`), 1 no longer applicable (`eve.copies` removed).
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md, the task and the book, ran 63
  mutations, drove 14 page states in both languages (no console errors, fit and phone checked, Croatian plurals at
  1, 2–4, 5+, 21, 22, 210, 465). Fixed from it: the AB chip said "over a secret channel" while the stolen-key caption
  said the channel was not secret; no test that a message is encrypted with the receiver's key (now the invariant);
  the single-scheme step order tested against itself; "Hybrid, as TLS" overstated (now "TLS order", with the TLS 1.3
  note); the explanation's "it only encrypts … checking with the public one is a signature" (now: secrecy uses the
  receiver's public key; a signature is signed with the private key, checked with the public one, and hides nothing);
  no legend entry for "not made yet"; six unused strings; first mentions of *ciphertext* (šifrat), *key exchange*
  (razmjena ključa), *encryption in transit* (šifriranje u prijenosu) in the explanation; "grupe od 2 osoba" in the
  rings' aria labels; "same key … so she has it too" (she has a copy); "kanal kojim Eve ne može čitati" →
  "koji Eve ne može prisluškivati"; A and B unlabelled in the asymmetric ring above 13; dead `eve.copies`; the counter
  deviation filed under Decisions.
- Gate: pass (manifest, tests, build, 62 browser checks, tokens, scope). Screenshots reviewed: 1920×1080 light, dark,
  grayscale, phone 375×812, both languages, plus own shots of class30 at the join, the hybrid, stolen at step 6, the
  asymmetric run and the book join.

## Time

Start 13:23, done (gate, two mutation passes, fresh review and its fixes) 13:46, one session.
