<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# regex-to-nfa: notes

New stepper (task `docs/tasks/w3/regex-to-nfa.md`, catalogue `aut-regex-to-nfa`, §4.9, wave 3). Rules and expected
numbers: `SPEC.md`. No kit view is named by the task; the three drawings are page-owned SVG with HTML labels on top
(as in `automata`).

## Decisions

- **Layout.** The task's three panels (left regex and tree, centre NFA, right table and DFA) did not fit one
  1920×1080 screen with the panel shown: the NFA of preset 4 is 11–12 columns wide. The left column keeps the regex,
  the postfix tokens, the stack of fragments and the parse tree; the right part puts the NFA across the top and the
  table beside the DFA below. Reading order stays regex → NFA → DFA.
- **The regex is the param**, typed in a field on the stage (the kit has no text param), as `lnx-regex-match` does:
  the field is built once so typing keeps the caret, typing resets to step 0, Enter/Escape leaves the field so the
  clicker steps again, and the page keeps `?regex=` in the URL itself (only when it differs from the preset). The
  task's `regex` select is the preset list (keys 1–4); a select would repeat the same four choices.
- **Rejected input** (rule 1: any other character, empty group, missing operand, unbalanced parentheses; rule 8:
  more than 20 steps or more than 4 letters) gives an error state with one step; the reason is under the field (red,
  dashed border) and in the caption. The limits keep every typed regex within one screen and one demo.
- **Numbering** (SPEC rule 6): the book's numbers are assigned before the construction (pre-order: new start,
  operands, new accept), so each state has its final number from the step it appears in, and the task's caption
  ("we add new states 0 and 7") holds. The task's "creation order, compacted after a merge" does not give the book's
  numbers (it would number `a` 0, 1). The start of a concatenation's right operand is its own state until the merge,
  drawn dashed and labelled with the number it will merge into, primed (`7′`); the caption says so.
- **Edges never cross a state** (`edgeShape`, tested on the presets and 300 generated regexes at every step): the
  star's back edge and bypass go straight up (down) from their ends, across above (below) the operand and straight
  back, with rounded corners; the shorter branch of a union runs level to the last column and then to the union's
  accept. A plain arc or a straight diagonal cut through states of an unbalanced union (`(a|b*)*`, `c|a*(a*|b*)`).
- **The NFA drawing is the stack:** fragments left to right, bottom first, one column apart; a concatenation slides
  the right fragment onto the left one's accept state. Positions come from the parse tree (`fragLayout`: a symbol
  is one column, a union stacks its operands, a star wraps its operand with the back edge arcing above and the bypass
  below), so a built fragment never moves except when an operator wraps it. One scale for the whole run
  (`nfaBox`, the widest step), so the drawing does not jump.
- **Subset phase:** the first subset step creates A = ε-closure(start) and fills its row (steps = tokens + DFA
  states, as the task counts). The NFA marks the states of the set being processed (blue tint, thick ring) and the
  letter edges `move` follows; the table row filled is "changed" (highlighter plus ink outline); the DFA marks the
  new states and the row's edges. Unmarked rows have empty cells (note under the table); marked rows show `–` for
  no transition, `∅` with `showDead`.
- **The dead state** with `showDead`: ∅ in the empty cells, a dashed ∅ row in the table and a dashed ∅ state with a
  loop on every letter in the DFA; no step of its own (display only), so the step count does not depend on it.
- **DFA layout:** states on an ellipse in creation order, A on the left, the final DFA's places from the first row
  on, so nothing moves while it grows. Edges between two states bend to one side, so both directions stay apart;
  letters to the same target share one label (`a, b`). For 6 states (preset 4) the graph is busy; the table is the
  exact view.
- **Last step caption:** the DFA's size against 2ⁿ (misconception 1) and, when states have identical rows and
  acceptance, that they are equivalent and the DFA is not minimal (misconception 2: preset 1 A and C; preset 4 A, C
  and D; preset 2 B and C). Identical rows are a sufficient condition for equivalence, so the claim is safe; the page
  does not claim minimality when no rows match.
- **Misconception 3 (grep):** "concepts, not tools": the explanation says "regular expressions in text search tools"
  and back-references, and names the page "How a regex matches" (`lnx-regex-match`), without naming a tool.
- **`related`:** `automata`, `lnx-regex-match`.
- **Colour and shape:** accepting = double circle (graph) / double border (table); start = arrow (graph) / `→`
  (table); ε-edge dashed and grey with "ε", letter edge solid ink; new = highlighter with a thick ink ring; the set
  being processed = blue tint with a thick blue ring; provisional and pending = dashed. Checked in grayscale.

## Checks

- **Numbers checked twice:** an independent Python script (recursive Thompson with the book's numbering, subset
  construction, and every word up to length 6 against Python's `re`) gave the same tokens, NFA sizes, ε-edges, sets,
  transitions and steps for all four presets as `sim.js` (`SPEC.md` tables). Preset 1's sets are the ones the task
  quotes from the book.
- **Languages:** `sim.test.js` checks the NFA and the DFA of 16 regexes against the platform's regex engine on every
  word up to length 6 (4 for 4 letters), and preset 4 against "ends with ana".
- **Fresh review** (a separate agent read the diff against SPEC.md, fuzzed numbering and languages on ~750 random
  regexes against an independent implementation, ran 42 mutants and drove the page in a browser). Fixed from it: union
  and concatenation captions lost one state number (a node used twice in one string; the page now clones it); regexes
  named like `Object.prototype` keys (`constructor`) crashed the page (memos now have no prototype); arcs and
  diagonal ε-edges crossing states (above); the unmarked-row note was wrong for marked rows without transitions; the
  field hint said Enter steps (it leaves the field); quote marks per language and ␣ for a rejected space; `lang="en"`
  on the English terms of the Croatian explanation and two reworded sentences; the prime explained for a union's or
  star's start too; the length limit now in SPEC rule 8; boundary tests for 20/21 steps, 4/5 letters and 24/25
  characters, `)a`, and the order of provisional ids. Unused `ev.operands` dropped.
- **Mutants (rules broken on purpose), all killed:** | binding tighter than concatenation, concatenation
  right-associative, `+` accepted, symbol without its edge, union without one ε, star without back edge / bypass,
  concatenation by ε instead of merge, accept numbered before the operands, last unmarked state first, alphabet
  reversed, no ε-closure after move, D0 without closure, accepting by the start state, empty U as a state, sets never
  reused, step limit off and off by one (`>=`, 19, 21), letter limit off, length limit off by one, `)` at depth 0
  not an error, provisional ids in reverse order, star bypass on the wrong side, star arcs not clearing the operand,
  no elbow for the shorter union branch, union branches overlapping, no prime on provisional states. Three of the
  reviewer's surviving mutants change nothing observable (union operand order in an unused event field, merging only
  out-edges, accepting = largest number); left as they are.
- Screenshots at 1920×1080 (light, dark, grayscale) and 375×812 in both languages reviewed, plus presets 1 and 4 at
  several steps, `showDead`, a typed `a(b|c)*d` and a rejected `a+b`.

## Sources

- Aho, Lam, Sethi, Ullman, *Compilers: Principles, Techniques, and Tools*, 2nd ed., §3.7.1 (Algorithm 3.20,
  Example 3.21, Figs. 3.34–3.36) and §3.7.4 (Algorithm 3.23). *(check)* I had no copy: section, algorithm and figure
  numbers are the task's, and the merge variant of concatenation and the numbering are as the task describes them.
  The numbers of preset 1 match the ones the task quotes.
- K. Thompson, "Regular Expression Search Algorithm", *CACM* 11(6), 1968 (the construction's origin; not consulted).
- Presets 2–4 are derived (computed by two independent implementations).

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| nondeterministic finite automaton (NFA) | nedeterministički konačni automat (as in `automata`) |
| deterministic finite automaton (DFA) | deterministički konačni automat (as in `automata`) |
| ε-closure | ε-zatvaranje *(check)* |
| subset construction | konstrukcija podskupova *(check)* |
| accepting state | prihvatljivo stanje *(check)* (as in `automata`) |
| transition | prijelaz |
| Thompson construction | Thompsonova konstrukcija |
| concatenation | nadovezivanje *(check)* |
| union | unija *(check)* |
| postfix order | postfiksni zapis |
| parse tree | stablo izraza *(check)* |
| dead state | mrtvo stanje (as in `automata`) |

`regular expression` is in the glossary (`uvod-u-linux`) and used as `[[regular expression]]`.

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **Kit:** a `text` param type (already requested by `endianness`); this page handles its field and `?regex=` itself.
- **Models:** none promoted. If a later sim needs Thompson or subset construction, `parseTree`, `closure`, `move`,
  `run` and the layout functions in `sim.js` are pure and DOM-free, ready to move to `models/`.

## Not done here

- A real projector and a clicker.
- The book itself (see Sources).

## Time

Start 11:23 (2026-11-15, brief read), SPEC and numbers checked 11:29, model and tests 11:33, first gate pass 11:37,
layout fixes and mutants 11:40, fresh review 11:41–11:49, review fixes, final gate and commit 11:58: about 35 minutes.
