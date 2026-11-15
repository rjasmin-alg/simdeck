<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# regex-to-nfa: specification

One concept: **Thompson construction and subset construction** (task `docs/tasks/w3/regex-to-nfa.md`, catalogue
`aut-regex-to-nfa`, §4.9). The student picks or types a regular expression and steps through the two constructions:
one postfix token per step builds the NFA, then one DFA state per step fills the subset-construction table.

Sources: A. V. Aho, M. S. Lam, R. Sethi, J. D. Ullman, *Compilers: Principles, Techniques, and Tools*, 2nd ed.
("Dragon book"), §3.7.4 Algorithm 3.23 (McNaughton–Yamada–Thompson), §3.7.1 Algorithm 3.20 (subset construction),
Example 3.21 with Figs. 3.34–3.36 for `(a|b)*abb`; K. Thompson, "Regular Expression Search Algorithm", *CACM* 11(6),
1968. Section, figure and algorithm numbers are the task's; I had no copy of the book to check them against
*(check)*. Every number below was computed twice: by `sim.js` and by an independent Python script (NOTES.md
"Checks"); the numbers of preset 1 are also the ones the task quotes from the book.

## Model

- **Scene:** left, the regex (a text field), its postfix tokens with the current one highlighted, the stack of
  fragments and the parse tree. Right, on top: the NFA as a state graph (circles, ε-edges dashed, symbol edges solid,
  start arrow, accepting double circle). Right, below: the subset-construction table (DFA state, NFA state set, one
  column per symbol) and the DFA graph beside it.
- **Params:** `regex`, the regex itself (a string, default `(a|b)*abb`), typed in the field on the stage or set by a
  preset; `showDead` (boolean, default false, display only). *Deviation:* the task's `regex` select of the presets
  is the preset list (keys 1–4); a select beside it would repeat the same four choices.
- **State:** `{ regex, phase, tokens, ti, tree, stack, nfa, alias, alphabet, dfa, ev }`
  - `phase` ∈ `thompson | subset | done`, or `error` for a rejected regex (`{ regex, phase, error, ev }`, 1 step
    that changes nothing; the page shows the reason under the field and in the caption).
  - `tokens`: the postfix tokens (`a`…`z`, `|`, `·` for concatenation, `*`); `ti` the number processed.
  - `tree[k]`: the parse-tree node of token k, `{ op, sym, kids, start, accept }` (`op` ∈ `sym | cat | or | star`;
    `kids` token indices; `start`, `accept` the node's final NFA state numbers).
  - `stack`: fragments `{ node, start, accept }`, bottom first.
  - `nfa`: `{ states: [ids], edges: [{ from, sym, to }] (sym null = ε), start, accept }`, `start`/`accept` null until
    the end of the Thompson phase.
  - `alias`: provisional id → the final number it is merged into (rule 4).
  - `dfa`: `{ states: [{ name, set, accepting }], trans: { name: { sym: name } }, unmarked: [names], dead }`, `dead`
    true once some U was empty.
  - `ev`: what the last step did, for the caption and the "changed" marks; null at step 0.
- **Steps** = tokens + DFA states.

## Rules

1. **Syntax.** Symbols `a`–`z`, `|`, `*`, `(`, `)`; concatenation is implicit. Precedence `*` > concatenation > `|`;
   both binary operators left-associative (`a|b|n` = `(a|b)|n`, `abc` = `(ab)c`); `a**` is a star of a star. `+`,
   `?`, classes, ε literal, spaces and every other character are rejected with a caption naming the character; so
   are an empty regex, `()`, an operator without an operand (`|a`, `a|`, `*a`, `(|a)`) and unbalanced parentheses.
   Postfix order is the post-order of the tree (left operand, right operand, operator).
2. **Symbol c:** new states i, f and the edge i –c→ f (+2 states).
3. **Union s|t:** pop t, pop s; new i with ε to both starts, new f with ε from both accepts (+2 states, +4 ε).
4. **Concatenation st:** pop t, pop s; the accept state of N(s) and the start of N(t) are **merged** (the Dragon book's
   variant, +0 states, +0 edges). The page says so; many texts link them with an ε-edge instead. Until the merge,
   t's start is a state of its own, shown as `7′` (the number it will merge into, primed); its id is provisional
   (N, N+1, … in the order they are created) and `alias` maps it to the final number.
5. **Star s\*:** pop s; new i, f; ε i→start(s), accept(s)→start(s), accept(s)→f, i→f (+2 states, +4 ε).
6. **Numbering.** The final NFA's states are numbered as in the book: in pre-order of the tree, a node's new start
   before its operands and its new accept after them (symbol: i, f; union: i, s, t, f; star: i, s, f; concatenation:
   s, then t with its start already numbered). Every state carries this number from the step it appears in, so the
   book's 0…10 appear for preset 1 and the task's caption ("we add new states 0 and 7") holds. *Deviation:* the
   task's wording is "creation order, compacted after a merge", which does not give the book's numbers (creation
   order numbers `a` 0, 1 and `b` 2, 3); the book's numbers are what the task asks to show.
7. **Subset construction** (Algorithm 3.20). Step 1 of the phase creates D0 = A = ε-closure(start) and processes it.
   Each step takes the **first unmarked DFA state in creation order**, and for each symbol **in alphabetical order**
   computes U = ε-closure(move(D, c)); a set not seen before becomes a new DFA state named by the next letter; an
   empty U gives no transition (the dead state is not built; with `showDead` it is drawn as ∅, dashed, with a
   self-loop on every symbol, and the empty cells show ∅; no extra step). A DFA state is accepting iff its set
   contains the NFA's accept state. The alphabet is the symbols of the regex.
8. **Limits for a typed regex:** at most 24 characters (the field), at most 20 steps and at most 4 different symbols
   (the table's width); otherwise it is rejected with a caption. Boundaries: `(a|b)*(a|b)abb` has 20 steps and is
   accepted, `abbaabb` has 21 and is not. The presets are all within.

## Presets and expected numbers

| # | id | regex | tokens (postfix) | NFA states / ε-edges | DFA states | steps | source |
|---|---|---|---|---|---|---|---|
| 1 | `abb` | `(a\|b)*abb` | `a b \| * a · b · b ·` (10) | 11 / 8 | 5 | 15 | Dragon book Ex. 3.21, Fig. 3.34 |
| 2 | `aorb` | `a\|b` | `a b \|` (3) | 6 / 4 | 3 | 6 | derived |
| 3 | `astar` | `a*` | `a *` (2) | 4 / 4 | 2 | 4 | derived |
| 4 | `ana` | `(a\|b\|n)*ana` | `a b \| n \| * a · n · a ·` (12) | 15 / 12 | 6 | 18 | derived |

Preset 1 (the book's Fig. 3.35/3.36): A = {0,1,2,4,7}, B = {1,2,3,4,6,7,8}, C = {1,2,4,5,6,7}, D = {1,2,4,5,6,7,9},
E = {1,2,4,5,6,7,10}; A a→B b→C, B a→B b→D, C a→B b→C, D a→B b→E, E a→B b→C; only E accepting. C and A are
equivalent: subset construction does not minimise.

Preset 2: NFA 0 –ε→ 1, 0 –ε→ 3, 1 –a→ 2, 3 –b→ 4, 2 –ε→ 5, 4 –ε→ 5. A = {0,1,3}, B = {2,5}, C = {4,5}; A a→B b→C;
B and C have no transitions (dead without `showDead`); B and C accepting.

Preset 3: A = {0,1,3}, B = {1,2,3}; A a→B, B a→B; both accepting (the empty word is accepted).

Preset 4: the star's start 0, the outer union 1 and 10, the inner union 2 and 7, `a` 3→4, `b` 5→6, `n` 8→9, the
star's accept 11, then `a` 11→12, `n` 12→13, `a` 13→14. A = {0,1,2,3,5,8,11}, B = {1,2,3,4,5,7,8,10,11,12},
C = {1,2,3,5,6,7,8,10,11}, D = {1,2,3,5,8,9,10,11}, E = {1,2,3,5,8,9,10,11,13}, F = {1,2,3,4,5,7,8,10,11,12,14};
A a→B b→C n→D; B a→B b→C n→E; C a→B b→C n→D; D a→B b→C n→D; E a→F b→C n→D; F a→B b→C n→E; only F accepting.
The DFA accepts exactly the words over {a, b, n} that end in `ana` (checked on every word up to length 6), the
language of the `automata` page's NFA preset.

## Captions (both languages, examples)

- hr: „Znak `*`: oko fragmenta za (a|b) dodajemo nova stanja 0 i 7 i četiri ε-prijelaza. Fragment se sada može
  preskočiti ili ponoviti.“
- en: "Token `*`: around the (a|b) fragment we add new states 0 and 7 and four ε-edges. The fragment can now be
  skipped or repeated."

## Misconceptions shown

- "The DFA has 2ⁿ states": only reachable subsets are built (preset 1: 5, not 2¹¹ = 2048).
- "Subset construction gives the minimal DFA": preset 1, A and C have the same row.
- "grep builds exactly this": regexes in tools add back-references, which no finite automaton can match (one line,
  pointing to `lnx-regex-match`).

## Out of scope

DFA minimisation, backtracking matchers, BRE/ERE syntax, running the automaton on a word (the `automata` page).
