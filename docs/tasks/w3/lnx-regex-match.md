# lnx-regex-match: How a regex matches

| | |
|---|---|
| Task | `lnx-regex-match` (wave 3, Linux) |
| Catalogue entry | `lnx-regex-match` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-regex-match/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | UL, AUT |
| Topic / tags / level | `linux-admin` / `shell` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **the matcher walks the input, backtracks, anchors**.

The student: type a pattern and text, step the match.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/06-cjevovodi-obrada-teksta.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-06/`
- Catalogue seed: UL ch06; pairs with spl-automata
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/06-cjevovodi-obrada-teksta.md`, section "Regularni izrazi" (definitions *regularni izraz*, *osnovni / prošireni regularni izraz*; `grep "ro+t"` vs `grep -E "ro+t"`; `grep -E "^(root|bin)"`) and its "Šire o temi" (regex(7) on modern/obsolete forms, `grep -P` as a third form)
- POSIX.1-2024 Base Definitions (XBD) chapter 9 "Regular Expressions": 9.1 (leftmost-longest), 9.3 BRE, 9.3.3 BRE special characters, 9.4 ERE; regex(7); grep(1)

## Model and presets

- **Scene:** the pattern as a row of tokens (literal, `.`, bracket set, group, quantifier badge, anchor), the input line as a row of character cells with indices, two cursors (pattern token, text position), the current start position, and a choice-point stack (each entry: which token, how many repetitions taken, which alternative). Bottom: tries counter and the result: matched span, or "no match", with the `grep` exit status (0/1) as in the book. A final row compares the backtracking result with the POSIX leftmost-longest result.
- **State:** `{ tokens, text, mode: 'BRE'|'ERE'|'PCRE', start, ti, pos, stack: [{ ti, pos, alt, count }], tries, match: null|{ from, to }, posix: null|{ from, to }, done }`.
- **One step:** one matcher action: try the current token at `pos` (consume one character, test an anchor, enter an alternative, take one more repetition); on success advance; on failure pop the newest choice point and resume from it (backtrack); if the stack is empty, move `start` one to the right and restart; after the last start, report no match.
- **Rules:**
  1. A plain character matches itself; a small set of special characters describes rules instead; which ones are special depends on the form. (ch06 "Regularni izrazi", definition *regularni izraz*; POSIX XBD 9.3.3)
  2. BRE vs ERE: in a basic expression `+`, `?`, `|` and `( )` are ordinary characters, in an extended one they are operators; `grep` uses BRE unless given `-E`. So `ro+t` finds nothing in `/etc/passwd` without `-E` and finds `root` and `operator` with it. (ch06, POSIX XBD 9.3 and 9.4; grep(1))
  3. Leftmost first: the matcher tries start positions 0, 1, 2, …; the first start that yields any match wins. (POSIX XBD 9.1; regex(7))
  4. `^` matches only at the start of the line, `$` only at its end; with `^` only start 0 can succeed. (POSIX XBD 9.3.8 / 9.4.9)
  5. Greedy quantifiers (`*`, `+`, `?`): take as many as possible, then give back one at a time on failure; each "how many" is a choice point. (backtracking model; regex(7))
  6. Alternation `a|b`: the backtracking matcher tries the left alternative first and keeps the first that leads to a match. (PCRE semantics, `grep -P`; ch06 names `-P`)
  7. POSIX ERE (`grep -E`) instead returns the **longest** match among those starting at the leftmost position: `a|ab` on `ab` gives `a` by rule 6 but `ab` by POSIX. The page shows both and says which tool follows which. (POSIX XBD 9.1 "leftmost-longest"; regex(7), check)
  8. Tie-break order of choice points: newest first (stack); within a quantifier, more repetitions before fewer; within alternation, left before right.
- **Params:** `pattern` (text input, validated to the supported subset: literals, `.`, `[…]`, `[^…]`, `*`, `+`, `?`, `|`, `( )`, `^`, `$`); `text` (text input, ≤ 24 characters); `mode` choice `BRE` | `ERE` | `PCRE`, default `ERE`. Changing them `resets`.
- **Presets:**
  - `book-ro-t` — `ro+t` on `root:x:0:0:root:/root:/bin/bash`: ERE matches `root` at 0 in 4 tries; BRE (mode switch) treats `+` as a literal and finds nothing, exit status 1. From ch06.
  - `book-root-bin` — `^(root|bin)` on `bin:x:1:1:bin:/bin:/sbin/nologin`: start 0 only; `root` fails at `b`→`r`, backtrack, `bin` matches. From ch06.
  - `greedy` — `a.*b` on `aXbYb`: `.*` first takes `XbYb`, fails to find `b`, gives back one → match `aXbYb` (5 characters). Derived, unchecked.
  - `leftmost-longest` — `a|ab` on `ab`: backtracking `a`, POSIX `ab`. Derived from POSIX XBD 9.1, unchecked.
  - `anchor-scan` — `t$` on `root:x`: every start is tried and fails; no match. Derived, unchecked.
  - `explosion` — `(a+)+b` on `aaaaaa`: no match; the tries counter runs into hundreds (the page jumps after 20 steps and shows the count). Derived, unchecked.
- **Steps:** one per matcher action: `book-ro-t` 6, `book-root-bin` 8, `greedy` 10, `leftmost-longest` 6, `anchor-scan` 12, `explosion` 20 (capped, declared as an exception if needed).
- **Legend:** token being tried (frame), character consumed (filled), choice point (bookmark icon on the stack), backtrack (curved arrow back), anchor test (pin), match span (underline), no match (×). "Changed" marks the token and cell compared in this step and the stack entry pushed or popped.
- **Captions:**
  - HR: „`.*` je uzeo sve do kraja retka, pa za `b` nema više znakova. Matcher se vraća na posljednju točku izbora i `.*` vraća jedan znak.“
  - EN: "`.*` took everything to the end of the line, so nothing is left for `b`. The matcher goes back to the last choice point and `.*` gives back one character."
- **Terms:** regular expression — regularni izraz; basic / extended regular expression — osnovni / prošireni regularni izraz; pattern — uzorak; alternation — alternacija; anchor — sidro (check); backtracking — vraćanje unatrag (check); greedy quantifier — pohlepni kvantifikator (check).
- **Misconceptions:** a pattern is complete on its own (the form, BRE/ERE/PCRE, is part of it; ch06); the first alternative always wins (not in POSIX); a regex "searches the line" in one pass (it tries starts and backtracks).
- **Out of scope:** back-references, character classes like `[[:alpha:]]` beyond one example, lookaround, the automaton construction (`aut-regex-to-nfa`), how `grep` actually executes (it uses automata, not this backtracking walk).
- **Note for coordinator:** the stepper shows a backtracking matcher, which is the PCRE (`grep -P`) model, while UL ch06 teaches POSIX BRE/ERE, which `grep` executes with automata and leftmost-longest results. The page must label the model and show the POSIX result alongside (rule 7); `aut-regex-to-nfa` covers the automaton side.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-regex-match` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-regex-match sims/lnx-regex-match` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-regex-match/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
