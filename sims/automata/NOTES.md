<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# automata: notes

Adopted from `single-page-labs/automati-dijagrami-demo.html` (task `docs/tasks/w1/automata.md`, catalogue `spl-automata`).
The first commit on the branch is the original copied as-is (sha256 `26e015ddf01d…`); the simdeck copy is canonical
from here on.

## Decisions

- **Class `stepper`** (the catalogue says "import as `step`"). One step is one transition; the step count depends on
  the machine and the word (`steps(params)`), at most 8 for the offered words. `sim.json` `steps: 7` is the default run
  (DFA on banana), which is what the kit and the gate compare.
- **Params:** `machine` (DFA / NFA / PDA / TM) and `word` (a list; the kit has no free-text input). The list is the
  union of the original's per-machine example buttons plus `baanaa` (a PDA word with n = 2) and `bn` (n = 0). Both
  params reset to step 0. **Presets:** DFA banana / bandana, NFA banana / ananas, PDA baanaa / banana / bana, TM
  bandana / baba: for each machine one accepted and one rejected word, chosen to show its point (dead state, a path
  dying in q3, the stack, the TM returning to q0).
- **One diagram at a time.** The original showed all four diagrams stacked above the demo; one screen fits only the
  selected machine's diagram, which now also shows the current state(s) and the transition just taken. The
  original's per-machine description became the language line and the explanation ("Ideja"); its "trace" became the
  caption (the step message) and the path of states.
- **Model kept:** the four machines and their step messages are the original's (`stepDFA`, `stepNFA`, `stepPDA`,
  `stepTM`), moved into the pure `sim.js`. The DFA and the NFA take one extra step at the end of the input to decide,
  as the original did. Added: the NFA caption names the paths that die (`dropped`); the original only listed moves.
- Diagram labels (state names, symbols, `push`/`pop`, `/ R`, `≠ a`, `Σ`, `□`) are data, the same in both languages.
  The SVG draws no text: the labels are HTML on top, from the same coordinates (as in `sram-dram`), so they keep
  their rem size. On a phone the diagram keeps a 46 rem width and scrolls sideways inside its box.

## Deviations from the original (fixes) *(check)*

1. **PDA and banana.** The original said "banana = b aaa n aaa" and listed banana as the PDA's example. It is not:
   b a n a n a has two n, so its own PDA rejects it at the second n. The text now says so, the preset "PDA: banana"
   shows the rejection, and bana / baanaa are the accepted examples.
2. **TM diagram.** The original drew qAN → qA on "a / R" (the code goes qAN → ACCEPT on a) and had no edge for
   qAN → q0 on any other symbol, and drew the blank → REJECT edge only from q0. The diagram now matches the code:
   qA → q0 and qAN → q0 on other symbols, and □ → REJECT from q0, qA and qAN. Loop labels use `≠ a` instead of
   "b, n, ostalo".
3. **DFA diagram.** The original wrote "sve pogrešno → dead"; the dead state is now drawn with one edge from each
   state (`≠ b`, `≠ a`, …, `Σ` from q6) and its Σ loop.
4. Dropped: the free-text word input (the kit has none; the list covers the original's examples) and "Pokreni"
   (run to the end) became the kit's End / Play.

## Colour and shape

Current state: highlighter fill and a thick outline (NFA: every active state). Accepting state: a double circle.
Dead / REJECT: dashed circle. Transition just taken: thick `--c1` line, bigger arrow head, and its label highlighted
and outlined. Read tape cells are dashed and muted, the head cell has a thick border and ▼. Result: ✓ / ✗ / … with
the word, the rejection box dashed. Checked in the grayscale screenshots.

## Sources

- The original page (machines, example words, descriptions, step messages). The languages are checked in
  `sim.test.js` against independent definitions (regular expression or count) on every word of length ≤ 6 over
  {a, b, n} plus the examples.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| deterministic finite automaton (DFA) | deterministički konačni automat |
| nondeterministic finite automaton (NFA) | nedeterministički konačni automat |
| pushdown automaton (PDA) | potisni automat |
| Turing machine | Turingov stroj |
| dead state | mrtvo stanje |
| accepting state | prihvatljivo stanje |
| tape | traka |
| head (read/write) | glava (za čitanje i pisanje) |

*(check)* No Croatian course book in reach covers automata. The original page said "pushdown automat"; "potisni
automat" is the usual Croatian term. "stack" (stog) is in the glossary and used as `[[stack]]`.

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **Related:** once `aut-regex-to-nfa` or `lnx-regex-match` exist (catalogue: "pairs with `spl-automata`"), add them
  to `related`.

## Checks not done here

- A real projector and a lecturer with a clicker.
- Rules broken on purpose, each made tests fail: DFA dead state escaping on a right symbol, NFA q0 not looping, PDA
  without the `$` check, TM qAN → qA instead of q0.

## Time

Start 2026-10-02 08:27, done 08:42 (about 15 minutes, one session).
