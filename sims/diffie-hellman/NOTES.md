<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# diffie-hellman: notes

New stepper (task `docs/tasks/w2/diffie-hellman.md`, catalogue `sec-diffie-hellman`, §4.3, wave 2b). Rules, tie-breaks
and expected numbers: `SPEC.md`. No kit view: the task names none, and the scene (three "knows" boxes of cards with a
wire between) is none of K1–K4, so the page draws it in HTML.

## Decisions

- **Every value carries both forms**, `{ num, paint }`, so one model run drives the numbers, the paint, or both on
  the same card: the analogy maps value by value on each card (p, g ↔ yellow; a ↔ red; A ↔ yellow + red; …).
- **Fixed slots.** Each side has five cards (public, secret, sends, arrived, shared secret), Eve five (p and g, copy A,
  copy B, her shortcut, her search), Mallory seven. Empty slots are dashed "nothing yet" cards, so nothing moves
  while stepping.
- **Card kinds**: public plain; secret hatched (`.sd-hatch`) with a lock; shared secret hatched with a double border
  and a key. Eve's copies carry an eye. Changed cards take the kit highlighter plus a thick outline.
- **Paint colours** are kit tokens (`--c7` yellow, `--c5` red, `--c6` teal, `--c4` violet), averaged with nested
  `color-mix(in srgb, …)`, not real pigments. The recipe in words ("2 × žuta + crvena + tirkizna") always sits beside
  the swatch, so colour never carries the meaning alone (grayscale screenshot checked). Eve's shortcut shows the true
  s swatch next to hers.
- **Eve's search (rule 5)** shows the first x with g^x = A, the count against p − 2 as a bar, then B^x = s: at p = 23
  or 97 Eve always wins, and the card says the real size (2048 bits, 617 digits). It also shows ord(g) ("s is one of
  n values"), which makes the bad-g preset visible without a special case. The text says "trying", not "the best
  attack": faster discrete-log methods are out of scope.
- **Coincidences shown, not hidden**: Eve's product can equal s when a + b ≡ ab (mod ord g), e.g. a = b = 2 (the card
  says "= s, by chance" and the caption adds that Eve cannot know); with Mallory and a = b the two numbers coincide
  (separate caption). The paints never coincide.
- **Mallory** replaces Eve in the middle column (an active attacker sees everything Eve would). m = 3 is fixed
  (task preset); not a param. Her M goes to both sides; "arrived" cards then carry "really Mallory's M".
- **Compare step** (10, or 12 with Mallory) is the sim's view, shown on the wire as "Alice 2 = 2 Bob": the parties never
  send s to compare. With Mallory: "6 ≠ 5, different".
- **Captions** follow the numbers unless the view is paint only. Formulas (`5⁶ mod 23 = 8`) are built by the page and
  marked `translate="no"`; the exponents are Unicode superscripts (the phone layout's `<sup>` fell under 14 px).
- **Words**: Alice, Bob, Eve, Mallory (the usual names, both languages). "Prečac"/"shortcut" for A·B,
  "potraga"/"search" for the discrete-log search.
- **Related**: `sym-vs-asym`, `tls-handshake`, `ssh-key-auth`.

## Deviations from the task

- **`mode` + `showPaint` are one 3-way choice**: Brojevi / Oboje / Boje (numbers, both, paint), default both, which is
  the task's default (numbers with the paint toggle on). With a separate toggle the panel did not fit 1920×1080 without
  its own scroll. p, g, a and b are hidden in paint mode (the paints are fixed), instead of disabled with a reason
  each (four hint lines also broke the fit).
- **Preset order**: `paint` first, then `textbook`, `small-a`, `bad-g`, `bigger`, `mallory`. The concept reads "colour
  mixing, then numbers"; it also keeps the gate's slider check off a paint preset (key 2), whose sliders are hidden.
- **Steps 4 and 6**: the task's sample caption ("Alice računa A = 5⁶ mod 23 = 8 i šalje ga…") joins compute and send,
  but its step list splits them; the captions follow the step list (step 4 computes, step 6 sends and Eve records).
- **Mallory's 13 steps**: catch A, M to Bob, catch B, M to Alice are steps 6–9 (the two extra steps are the
  substitutions); step 13 is Mallory's view (she computes A^m and B^m) in place of Eve's.
- **`g` = 22 at p = 97** is an ordinary base (order 4), as the task's fixed option list gives it; only at p = 23 is it
  p − 1. The order line on Eve's card says which.
- **State shape**: besides the task's `alice/bob/eve/mallory/log`, the state has `pub`, `known` (filled slots per
  column), `wire` (the value crossing in this step), `compare` and `changed`. `eve.guess` is `eve.product` and
  `eve.search`.

## Sources

- RFC 2631 §2.1.1 (ZZ = g^(xb·xa) mod p), RFC 3526 (MODP groups, 2048 bit and up), RFC 7748 (X25519, named only),
  RFC 8446 §4.4.3 (CertificateVerify signs the handshake transcript). Read from memory of the RFCs, not re-fetched
  offline: *(check)* the section numbers.
- The textbook example p = 23, g = 5, a = 6, b = 15 → A = 8, B = 19, s = 2 (standard textbooks; also the common
  encyclopaedia example).
- URM `book/chapters/18-kiberneticka-sigurnost.md`: Šire o temi (two parties agreeing a shared secret without sending
  it over a network that may be tapped) and „Napad čovjekom u sredini” (MITM definition).
- Every number in SPEC.md was checked with a scratch script before coding, then pinned in `sim.test.js`.
  2^2048 has 617 decimal digits (checked).

## Unchecked *(check)*

- The RFC section numbers above (from memory).
- "prisluškivač" for eavesdropper (task; the book uses "prisluškivanje").
- "modul" for modulus (task).

## Term pairs

Not in `kit/glossary.js`; the explanation writes them out at first mention. Proposed with `"src": "simdeck"`:

| English | Croatian | Source |
|---|---|---|
| shared secret | zajednička tajna | task, URM ch18 |
| key exchange | razmjena ključa | task (also proposed by sym-vs-asym) |
| eavesdropper | prisluškivač | task *(check)* |
| discrete logarithm | diskretni logaritam | task |
| modulus | modul | task *(check)* |

**Glossary conflict**: *man in the middle* is "aktivni posrednik" in the glossary (from `ssh-key-auth`, UL ch15), but
"čovjek u sredini" in the URM book (ch18) and in this task. The page uses `[[man in the middle]]` (glossary) and, in
Croatian, adds "(u knjizi „čovjek u sredini”)". Owner to decide; belongs in OPEN.md's glossary-conflicts row.

## Shared requests

- **Kit: `visible()` does not hide a control.** The kit sets `[hidden]` on the control, but `.sd-ctl { display: flex }`
  wins. Workaround in the page: `.sd-panel [hidden] { display: none }` (as `cert-chain` and `amdahl` do). Smallest fix:
  `.sd-ctl[hidden] { display: none; }` in `kit.css`.
- **Kit: a choice beside its label.** The page puts each choice's label and buttons on one row
  (`.sd-ctl:has(> .sd-seg)`) to fit the panel; an option on the spec (`inline: true`) would make it the kit's.
- **Kit: legend swatches with an icon** (same request as `sym-vs-asym`): the page replaces `.sd-swatch[data-shape^="dh-"]`
  content after mount.
- **Gate: the slider-drag check** (`kit/tools/check-page.mjs`, "after a mouse drag on a slider") crashes when preset 2
  hides the sliders (`boundingBox()` is null). It should pick a visible slider or skip.

## Checks

- Numbers: every SPEC.md value checked with a scratch Python script before coding, again independently by the
  reviewer, then pinned in `sim.test.js`.
- Tests: 33. Four tie-breaks first (a = b; Eve's product equal to s by chance; Eve's x ≠ a when g is not a generator;
  Mallory with a = b), then rules 1–8 (sweeps over every p and g with a, b strided over 2 … p−2), the boundary a = p − 2,
  Mallory's catch steps, the log, the step order, `changed` per step, every preset's numbers, param clamping, mode
  independence, a duplicate-key check on `strings.js`, then the template's generic block.
- Mutation pass: 20 own mutants, 19 killed, 1 equivalent (capping the order loop at p − 1: the order divides p − 1).
  The reviewer's 47: 37 killed; the non-equivalent survivors (Mallory never active, the search's `<=`, a caught A
  delivered, `round` → `floor`, the log) now have tests.
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md and the task, mutated it, drove every
  step of all six presets plus edge params in both languages. Fixed from it: p and g still visible in paint mode
  (the row-layout rule beat `[hidden]`); a missing `capPaintEveViewChance` caption (paint with a = b = 2); a duplicate
  `mallory` key in both tables (the toggle read "Mallory"); the comparison chip sat on the channel lane, picturing s
  on the wire (now "comparison: s is not sent", no arrow); step 1 said "Eve" in Mallory runs; Croatian "se dogovore",
  "s Alice" → "s Alicom", "šalje objema" → "šalje na obje strane"; the hr explanation's MITM sentence; "A does not show
  a" overstated (now "for a real-size p"); the bad-g caption now names the order and that Eve's x is not a; the
  common paint is lighter (`--c7` mixed with `--hl`), since ochre read as brown.
- Gate: pass (manifest, tests, build, 62 browser checks, tokens, scope), no exceptions declared. Screenshots reviewed:
  1920×1080 light, dark, grayscale and 375×812 in both languages, plus own shots of every preset's last step,
  paint at the compare step, a = b = 2, g = 2 with a = 15, and Mallory at steps 1 and 13.

## Time

Start 13:50, done (gate, mutation passes, fresh review and its fixes) 14:15, one session.
