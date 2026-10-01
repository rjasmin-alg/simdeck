# regex-to-nfa: Regex to NFA to DFA

| | |
|---|---|
| Task | `regex-to-nfa` (wave 3, Computer architecture, OS gaps and automata) |
| Catalogue entry | `aut-regex-to-nfa` in `docs/catalogue.md` §4.9 |
| Kind | build a new simulator |
| Folder | `sims/regex-to-nfa/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | AUT |
| Topic / tags / level | `theory` / `shell`, `automata` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `automata` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **Thompson construction and subset construction**.

The student: type a regex, step the constructions.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.9.
5. `sims/automata/` (the model this one builds on) and its `NOTES.md`.

## Sources

- A. V. Aho, M. S. Lam, R. Sethi, J. D. Ullman, *Compilers: Principles, Techniques, and Tools*, 2nd ed., §3.7.1 "Conversion of an NFA to a DFA" (Algorithm 3.20, Example 3.21, Figs. 3.34–3.36: (a|b)*abb), §3.7.4 "Construction of an NFA from a regular expression" (Algorithm 3.23, McNaughton–Yamada–Thompson); K. Thompson, "Regular Expression Search Algorithm", *CACM* 11(6), 1968. Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: pairs with `spl-automata` (`/home/rjasmin/projects/single-page-labs/automati-dijagrami-demo.html`, section "2. NFA — nedeterministički konačni automat", preset "NFA: završava s ana") and `lnx-regex-match` (`/home/rjasmin/projects/uvod-u-linux/book/chapters/06-cjevovodi-obrada-teksta.md`, "Regularni izrazi").

## Model and presets

- **Scene:** three panels. Left: the regex and its parse tree (postfix order shown as a row of tokens, the
  token being processed highlighted). Centre: the NFA under construction, drawn as a state graph (circles,
  ε-edges dashed, symbol edges solid, start arrow, accepting double circle). Right: the subset-construction
  table (DFA state letter, the NFA state set, one column per symbol) and the DFA graph growing beside it.
- **State:** `{ phase: 'thompson'|'subset'|'done', tokens: [..], ti, stack: [{start, accept}], nfa: {states: [id],
  edges: [{from, sym|null, to}], start, accept}, dfa: {states: [{name, set: [ids], accepting}], trans:
  {[name]: {[sym]: name}}, unmarked: [names]} }`.
- **One step:** Thompson phase: process one postfix token (push a 2-state fragment for a symbol; pop two and
  join for concatenation or union; pop one for star). Subset phase: take the next unmarked DFA state (in
  creation order), compute move + ε-closure for every symbol in alphabet order, add new sets as new DFA
  states, fill the row.
- **Reused from `automata`** (`spl-automata`, `automati-dijagrami-demo.html`): the state-graph drawing and the
  NFA "active set" idea (its NFA preset accepts words ending in "ana"). **New:** both constructions, the
  ε-closure, the table. If `automata` is not merged yet, draw the graph locally (COMMON.md §6).
- **Rules** (Aho, Lam, Sethi, Ullman, *Compilers: Principles, Techniques, and Tools*, 2nd ed., §3.7.4
  "Construction of an NFA from a regular expression" (Algorithm 3.23) and §3.7.1 "Conversion of an NFA to a
  DFA" (Algorithm 3.20, Example 3.21)):
  1. Syntax: symbols a–z, `|`, `*`, parentheses, implicit concatenation. Precedence `*` > concatenation >
     `|`; both binary operators left-associative (so `a|b|n` = `(a|b)|n`). `+`, `?`, classes and ε literal are
     out of scope; reject other characters with a caption.
  2. Symbol c: new states i, f with edge i –c→ f.
  3. Union s|t: new i with ε to both starts, new f with ε from both accepts (+2 states).
  4. Concatenation st: the accept state of N(s) and the start of N(t) are merged (Dragon book variant, +0
     states). Say so on screen; many texts link them with an ε-edge instead.
  5. Star s*: new i, f; ε i→start(s), accept(s)→start(s), accept(s)→f, i→f (+2 states).
  6. States are numbered in creation order; after a merge, numbering is compacted so the book's numbers
     (0…10 for the worked example) appear.
  7. Subset construction: D0 = ε-closure(start); for each unmarked D and symbol c: U = ε-closure(move(D, c));
     empty U gives no transition (the dead state is not drawn, say so); a DFA state is accepting if it contains
     the NFA accept state. Tie-break: unmarked states processed in creation order, symbols alphabetically.
- **Params:** `regex` select of the presets (plus a typed field, see the note); `showDead` toggle (default off).
- **Presets:**
  1. `(a|b)*abb` (Dragon book Example 3.21, Fig. 3.34): NFA 11 states, 8 ε-edges; DFA 5 states A–E with
     A = {0,1,2,4,7}, transitions A a→B b→C, B a→B b→D, C a→B b→C, D a→B b→E, E a→B b→C; E accepting.
     (C and A are equivalent: subset construction does not minimise.)
  2. `a|b`: NFA 6 states, DFA 3 states (start, {after a}, {after b}), two accepting (derived).
  3. `a*`: NFA 4 states, DFA 2 states, both accepting (the empty word is accepted) (derived).
  4. `(a|b|n)*ana`: NFA 15 states (left-nested union), DFA 6 states; the language of the `automata` page's
     NFA "ends with ana" over the letters of "banana" (derived).
- **Steps:** tokens + DFA states: preset 1: 10 + 5 = 15; preset 2: 3 + 3 = 6; preset 3: 2 + 2 = 4;
  preset 4: 12 + 6 = 18.
- **Legend:** NFA state (circle), accepting (double circle), start (arrow), ε-edge (dashed, "ε"), symbol edge
  (solid, letter), DFA state = set (letter plus set). "Changed" marks the fragment built or the table row
  filled in this step.
- **Captions:**
  - hr: „Znak `*`: oko fragmenta za (a|b) dodajemo nova stanja 0 i 7 i četiri ε-prijelaza. Fragment se sada
    može preskočiti ili ponoviti.“
  - en: "Token `*`: around the (a|b) fragment we add new states 0 and 7 and four ε-edges. The fragment can now
    be skipped or repeated."
- **Terms:** regular expression — regularni izraz (UL ch06); finite automaton — konačni automat (spl
  `automata`); NFA / DFA — nedeterministički / deterministički konačni automat; ε-closure — ε-zatvaranje
  (check); subset construction — konstrukcija podskupova (check); accepting state — prihvatljivo stanje
  (check); transition — prijelaz.
- **Misconceptions:** the DFA has 2ⁿ states (only reachable subsets are built; here 5, not 2¹¹); subset
  construction gives the minimal DFA (preset 1, A ≡ C); `grep` builds exactly this (UL ch06 regexes add
  back-references, which no finite automaton can do; one line, link `lnx-regex-match`).
- **Out of scope:** DFA minimisation, backtracking matchers (`lnx-regex-match`), BRE/ERE syntax details,
  running the automaton on a word (the `automata` page does it).
- **Note for the coordinator:** "type a regex" needs a text input the kit lacks (see `endianness`); presets
  cover the demo.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `regex-to-nfa` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh regex-to-nfa sims/regex-to-nfa` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/regex-to-nfa/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
