<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ari-order-of-operations: specification

One concept: **an expression with several operations is worked out in an agreed order: brackets first, then
multiplication and division, then addition and subtraction, each from left to right; a tree of the expression shows the
order, and moving the brackets changes the tree and the result (543 − (423 + 28) = 92, but 543 − 423 + 28 = 148).**
Task: `docs/tasks/w3/ari-order-of-operations.md`; catalogue §4.17 (MAT OŠ A.3.5, A.4.4). Every expected number below
was computed with a small script independent of `sim.js` (Python's own operator precedence, and a separate
left-to-right evaluator; NOTES.md, Checks) and is asserted in `sim.test.js`.

## Source: the curriculum (Narodne novine 7/2019), read 2026-11-14

- **MAT OŠ A.3.5** "Izvodi više računskih operacija." Razrada: "Određuje vrijednosti izraza sa zagradama.",
  "Određuje vrijednosti izraza s više računskih operacija.", "Primjenjuje svojstva računskih operacija (komutativnost,
  asocijativnost i distributivnost).", "Imenuje članove računskih operacija.", "Rješava zadatke s više računskih
  operacija i sa zagradama." Sadržaj: "Izvođenje više računskih operacija (sa zagradama i bez zagrada)." Preporuka:
  "Postupno uvoditi učenike u rješavanje zadataka u kojima se pojavljuju zagrade i više računskih operacija."
- **MAT OŠ A.4.4** razrada "Izvodi više računskih operacija.", "Rješava problemske zadatke sa uporabom i bez uporabe
  zagrada.", "Procjenjuje rezultat." Preporuka: "U zadatcima s više računskih operacija ne treba pretjerivati s
  velikim brojevima jer težište je na redoslijedu izvođenja računskih operacija. … Dobro bi bilo odabirati primjere
  zadataka u kojima se pojavljuju zagrade, a u kojima zagrade mijenjaju rezultat. Na primjer, u zadatku
  543 – (423 + 28) primjena zagrada zaista mijenja rezultat u odnosu na zadatak u kojemu bismo zagradu izostavili."
- So: whole numbers only (no remainders, nothing below zero: grade 3 and 4 work in the natural numbers); small numbers,
  the order is the point; brackets that change the result next to the same text without them; the curriculum's own
  example as the first preset. The rule as Croatian textbooks say it ("prvo se računa u zagradi, zatim množenje i
  dijeljenje, a onda zbrajanje i oduzimanje, redom kako su napisani") is *(check)*: the curriculum names the outcome,
  not the sentence.

## Model

The expression is text (`expr`), parsed into **tokens** (numbers, signs, brackets: the columns of the drawing) and a
**tree**: each operation is a node whose two operands are numbers or other operations. The grammar holds rule 2 and
rule 3: a *term* is factors joined by `·` and `:`, an *expression* is terms joined by `+` and `−`, both read left to
right (left-associative); a factor is a number or a bracketed expression.

### Rules, in order (the pick: which operation is done next)

1. **Brackets first.** While a bracket is not yet worked out, the work happens inside the innermost one. *Tie-break 1:*
   of several innermost brackets waiting, the leftmost. (Inside a bracket, rules 2 and 3 hold as everywhere.) A bracket
   whose inside has become one number is dropped in the same step that makes it one number.
2. **Then multiplication and division** (`·`, `:`), before addition and subtraction (`+`, `−`), even when a `+` or `−`
   stands to their left (shown as "passed over").
3. **Of equal rank, left to right.** `·` and `:` are one rank, `+` and `−` the other; of the same rank the leftmost
   goes first (*tie-break 2*): `24 : 4 · 2 = 6 · 2 = 12`, `543 − 423 + 28 = 120 + 28 = 148`. When the operation just to
   the right has the same rank, the page shows the other order as the bracketed expression it really is
   (`24 : (4 · 2) = 3`, `543 − (423 + 28) = 92`): doing the right one first is another task.
4. **Whole numbers only.** Every operation must stay in the whole numbers up to 99 999: a subtraction that would go
   below zero, a division with a remainder or by zero, or a value over 99 999 makes the expression one the page does not
   take (the field says which operation and why). Typed numbers have at most 4 digits; at most 7 numbers
   (6 operations, 12 steps).
5. **One operation per step pair.** Step 2k − 1 (*pick*) marks the k-th operation, its two operands and the rule that
   chose it; step 2k (*do*) computes it: the node folds into its value, the written form gets a new line. Steps = 2 ×
   operations; the last step shows the result.
6. **Without the brackets.** For a text with brackets, the same numbers and signs without any brackets are worked out
   too: at the last step the page says what that gives (`543 − 423 + 28 = 148`), that it is the same order (the
   brackets changed nothing), or that it cannot be done in whole numbers.
7. **Moving the brackets** (2 to 4 numbers): the page offers no brackets and one pair around every run of two or more
   neighbouring numbers that is not all of them (3 numbers: 3 choices; 4 numbers: 6). A choice that breaks rule 4 is
   offered but refused, with its reason (the operation that fails); a choice whose order of work is the same as without
   brackets says so (its tooltip, and the start caption once chosen). More brackets (nested, two pairs) are typed; such
   a current expression leads the choices so it stays visible and pressed. With 5 to 7 numbers the page says to type
   the brackets.
8. **The typical mistake, strictly left to right** (teacher view, a toggle): the same text with every operation of one
   rank, brackets still first (the mistake is about `·` and `:` before `+` and `−`, not about brackets). The card shows
   its written lines and its result, or where it gets stuck (a remainder, below zero); it says when this expression does
   not show the mistake (the same order).

### Tie-breaks first (tests)

- Two innermost brackets: the left one first: `(36 + 14) : (12 − 7)`: `36 + 14`, then `12 − 7`, then `50 : 5`.
- `:` then `·`: leftmost: `24 : 4 · 2` → `24 : 4` first (12, not 3).
- `−` then `+`: leftmost: `543 − 423 + 28` → `543 − 423` first (148, not 92).
- `·` after `+`: `·` first though it stands right: `6 + 4 · 3` → `4 · 3` first (18, not 30).
- Two `·`/`:` with a `+` between: the left one: `100 − (12 + 8) · 4 + 30 : 5` → `(12 + 8)`, `20 · 4`, `30 : 5`,
  `100 − 80`, `20 + 6`.
- Nested brackets: the inner first: `((3 + 4) · 2 − 4) : 5` → `3 + 4`, `7 · 2`, `14 − 4`, `10 : 5` = 2.

### Params

| key | values | default |
|---|---|---|
| `expr` | text (rules 4 and the grammar); typed in the field, set by the bracket buttons and presets; in the URL as `?expr=` (the page's own, the kit carries only its control params) | `543 − (423 + 28)` |
| `mistake` | the typical mistake card (teacher view only) | off |

### Presets (expected numbers checked independently)

| # | id | expression | steps | result | notes |
|---|---|---|---|---|---|
| 1 | `brackets` | 543 − (423 + 28) | 4 | 92 | curriculum A.4.4; without brackets 148 |
| 2 | `no-brackets` | 543 − 423 + 28 | 4 | 148 | left to right; the other order is 543 − (423 + 28) = 92 |
| 3 | `times-first` | 6 + 4 · 3 (mistake on) | 4 | 18 | · passes over +; strictly left to right gives 30 |
| 4 | `same-rank` | 24 : 4 · 2 | 4 | 12 | : and · one rank; the other order is 24 : (4 · 2) = 3 |
| 5 | `two-brackets` | (36 + 14) : (12 − 7) | 6 | 10 | left bracket first; without brackets 36 + 14 : 12 − 7 cannot be done (14 : 12) |
| 6 | `everything` | 100 − (12 + 8) · 4 + 30 : 5 (mistake on) | 10 | 26 | 20, 80, 6, 20, 26; strictly left to right: 20, 80, 320, 350, 70; without brackets 126 |

Bracket choices for 543, 423, 28 (rule 7): none 148 (same order), (543 − 423) + 28 = 148 (same order),
543 − (423 + 28) = 92. For 6, 4, 3 with + and ·: none 18, (6 + 4) · 3 = 30, 6 + (4 · 3) = 18 (same order).

`sim.json` `steps` is 4 (the default, preset 1).

## Scene

- **The written form** on top: the school's chain, `543 − (423 + 28) = 543 − 451 = 92`, one `=` part per done
  operation; at a pick step the part to work out is underlined in the last line and its brackets marked to go; at a do
  step the new value is the changed part.
- **The tree** (left, large): the expression's tokens in a row across the top, each number in a box; under each sign
  its operation node, lower the later it can be done (a node's row is one more than its deeper operand's), with lines
  up to its two operands. A node waiting is a circle with its sign; the picked one is highlighted with its operands
  outlined; a done one becomes a box with its value (the sign small beside it) and its operands turn hollow and dashed
  (used up). The root is the bottom node, the result.
- **The rules** (right): 1 `( )` brackets, 2 `·` `:` multiplication and division, 3 `+` `−` addition and subtraction,
  with "of equal rank, left to right" under 2 and 3; the rule that chose the current pick is marked (a ▶ and the
  highlight, not colour alone). Child view: the three symbols only.
- **The bracket choices** (rule 7): a row of chips under the written form, in the stage so the class sees the brackets
  move; the current one pressed. A choice keeps the step at the end when the demo is at its end (so results compare at
  once), otherwise it starts again.
- **Typical mistake card** (teacher, toggle): the strictly-left-to-right lines up to the current operation count, at
  the last step the wrong result next to the right one and why.
- **Header:** the audience switch (kit, `Simdeck.paperColumns.audience`). **Panel:** presets; the expression field;
  the mistake toggle (teacher).

## Captions (three audiences)

- *start:* teacher "Which operation first?"; adult the three rules in one sentence; child "What first?"
- *pick:* which rule chose it and why it beats the others in play (brackets; `·` before the `+` to its left; left to
  right, with the other order as a bracketed expression and its value when it differs). Adult adds why the rule makes
  sense: a bracket makes its inside one number; a product is one number (4 · 3 is 3 + 3 + 3 + 3, so 6 + 4 · 3 is 6 and
  four threes); left to right follows what is written (take 423 away, then add 28).
- *do:* `423 + 28 = 451`, the bracket goes; the last: the result; with rule 6 and the mistake (teacher).
- Child: one short line, the operation and its value.

## Terms

| hr | en |
|---|---|
| brojevni izraz *(check)*, izraz | expression |
| zagrada, zagrade | bracket(s) |
| redoslijed računskih operacija | order of operations |
| zbrajanje, oduzimanje, množenje, dijeljenje | addition, subtraction, multiplication, division |
| vrijednost izraza | value of the expression |
| stablo izraza *(check: not a school term; the page says "crtež računa" in the child view)* | expression tree |

## Out of scope

Fractions and decimals, negative numbers, powers, square brackets `[ ]` (only round brackets at this level), the
names of the parts of every operation (other `ari-` pages), estimating the result (A.4.4; a later preset could add it),
the properties (commutativity, associativity, distributivity: `ari-distributive`).
