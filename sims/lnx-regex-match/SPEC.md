<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-regex-match: spec

One concept: **the matcher walks the input, backtracks, anchors.** A typed pattern and one line of text; the
student steps a backtracking matcher one action at a time and sees, at the end, the POSIX leftmost-longest result
beside it. Task: `docs/tasks/w3/lnx-regex-match.md`. Class: stepper.

## Sources

- **Uvod u Linux, ch06 "Cjevovodi i obrada teksta", section "Regularni izrazi"** (`~/projects/uvod-u-linux/book/
  chapters/06-cjevovodi-obrada-teksta.md`): the definitions *regularni izraz*, *osnovni / prošireni regularni
  izraz*; `grep "ro+t" /etc/passwd` → exit status 1 vs `grep -E "ro+t"` → root, operator; `grep -E "^(root|bin)"`
  → root, bin and, without `-E`, exit status 1; "Šire o temi": regex(7) on modern/obsolete forms, `grep -P` as a
  third form (PCRE).
- **POSIX.1-2024 XBD chapter 9**: 9.1 (a match is the leftmost one, and of those the longest), 9.3 BRE and 9.3.3 the
  BRE special characters (`.[\*^$`; `^` special only first, `$` only last, `*` ordinary first), 9.3.8 / 9.4.9 the
  anchors, 9.4 ERE (`+ ? | ( )` are operators).
- **regex(7)**, **grep(1)** (GNU grep 3.11 on this machine): `-G` (default, BRE), `-E`, `-P`; exit status 0 / 1 / 2.
- **Cross-check run** (2026-11-03, this machine, GNU grep 3.11, script in NOTES.md "Cross-check"): 3000 random ERE
  patterns over the supported subset and short lines over `abcx`: the model's backtracking result equals `grep -P`
  and JS `RegExp` (both backtracking), and its POSIX result equals `grep -E`, in every case; 1500 random BRE patterns
  equal plain `grep`. Thirteen cases (the presets and the contrast cases) were run by hand and are pinned in
  `sim.test.js` (`REAL`).

## Model

`sim.js`, pure, plain data. `parse(pattern, mode)` → tokens and a syntax tree; `compile` → a small program
(`test`, `bol`, `eol`, `alt`, `rmore`, `rend`, `jmp`, `match`); `act(machine)` performs the next visible action;
`posixMatch` computes the leftmost-longest match from sets of end positions (no backtracking, no step count).

State per step: `{ tokens, pattern, text, mode, start, ti, pos, stack: [{ kind: 'more'|'alt', ti, count | bti, alt,
pos }], tries, act, match, posix, done, limit, jumped, exit, error }` (the task's state, plus the action record `act`
the stage and caption read, `jumped`, `limit` and `error`).

### One step = one matcher action

| action | what happens | choice point |
|---|---|---|
| `test` | a one-character token (literal, `.`, `[…]`, `[^…]`, or the first repetition `+` cannot do without) is tested at `pos`; a hit advances `pos`, a miss is a failure | — |
| `bol` / `eol` | an anchor is tested at `pos` | — |
| `more` | a greedy quantifier over one character tries one more: a hit pushes "could stop at *n*" and advances; a miss ends the repetition at once (the choice point it would leave is used immediately) and the walk goes on | pushed on a hit |
| `more-enter` | a quantified group starts one more (optional) repetition | pushed |
| `alt` | an alternation is entered at its left branch | pushed: "next branch" |
| `back-more` / `back-alt` | after a failure: the newest choice point is popped and resumed (one character given back, a group stopping earlier, the next branch) | popped (an alternation with a further branch re-pushes it) |
| `restart` | after a failure with an empty stack: `start + 1`, the pattern begins again | stack empty |
| `match` / `nomatch` / `limit` | the end of the pattern is reached / no start is left / the matcher gave up after 100 000 tries | — |

`tries` counts token tests (`test`, `bol`, `eol`, `more`), hits and misses alike. A walk longer than 20 actions shows
the first 19, and step 20 jumps to the end of the walk (`jumped` = the actions skipped), showing the final count.

### Rules

1. **A plain character matches itself; special characters describe rules; which are special depends on the form.**
   `.` any one character, `[…]` a set (ranges, `[:alpha:]`-style classes), `[^…]` its complement, `\` before a
   special character makes it ordinary. (ch06 *regularni izraz*; XBD 9.3.3)
2. **BRE vs ERE.** In BRE `+ ? | ( ) { }` are ordinary characters (drawn dashed, "ordinary here"), `^` is an anchor
   only first, `$` only last, `*` is ordinary first; in ERE and PCRE they are operators. `ro+t` on root's line finds
   nothing in BRE (exit status 1) and `root` in ERE; `^(root|bin)` matches `bin`'s line only in ERE. (ch06; XBD 9.3,
   9.4; grep(1))
3. **Leftmost first.** Starts 0, 1, …, n (the empty position after the last character too); the first start that
   yields any match wins. (XBD 9.1; regex(7))
4. **Anchors.** `^` holds only at position 0, `$` only at position n; with `^` only start 0 can succeed (every later
   start fails at the anchor itself). (XBD 9.3.8, 9.4.9)
5. **Greedy quantifiers** `*` (0…∞), `+` (1…∞), `?` (0…1) take as many as they can; every repetition beyond the
   minimum leaves a choice point "could stop at *n*"; on a failure they give back one at a time. A group repetition
   that consumed nothing ends the repetition (no endless empty loop).
6. **Alternation** `a|b`: the backtracking matcher tries the left side first and keeps the first that leads to a
   match. (PCRE semantics, `grep -P`)
7. **POSIX leftmost-longest**: `grep` and `grep -E` report the longest match among those starting at the leftmost
   start. Both models always agree on whether there is a match and where it starts; only the end can differ
   (`a|ab` on `ab`: backtracking `a`, POSIX `ab`). The page shows both rows and marks the one the chosen form's tool
   reports (BRE, ERE → POSIX; PCRE → backtracking). Exit status: 0 match, 1 none, 2 an invalid pattern, or (PCRE) the
   matcher gave up. (XBD 9.1; regex(7); checked against grep, see Sources)
8. **Tie-breaks:** the newest choice point first (a stack); within a quantifier more repetitions before fewer; within an
   alternation left before right.

### Supported subset and limits

Literals, `.`, `[…]`, `[^…]` (ranges, `[:alpha:]`, `[:digit:]`, `[:alnum:]`, `[:upper:]`, `[:lower:]`, `[:space:]`,
`[:punct:]`), `*`, `+`, `?`, `|`, `( )`, `^`, `$`, `\` before a special character. Anything else is refused with a reason (the
pattern box turns dashed red), in two kinds, checked with GNU grep 3.11:
- **invalid for grep too** ("pattern error", exit status 2): an unclosed `(` or `[`, a backwards range (also
  `[[:alpha:]-z]`), an unknown `[:class:]`, a trailing `\`; in PCRE also a lone `)`, a quantifier with nothing before
  it, two quantifiers in a row;
- **accepted by grep, not covered here** ("not covered here", no exit status): `{m,n}` in ERE, BRE's `\( \) \{ \}
  \| \+ \?`, other escapes (`\d`), `\` inside brackets in PCRE, `[. .]` and `[= =]`, and in ERE a lone `)`, a
  leading quantifier, two quantifiers in a row, an empty alternative or group. Pattern ≤ 24 characters, line ≤ 32 (task: 24; see NOTES.md).

## Presets (checked: `node` run of the model, the grep cross-check, `sim.test.js`)

| id | pattern / line / form | steps | tries | backtracking | POSIX | exit |
|---|---|---|---|---|---|---|
| `book-ro-t` | `ro+t` / `root:x:0:0:root:/root:/bin/bash` / ERE | 6 | 5 | `root` 0–4 | `root` 0–4 | 0 |
| — same, BRE | | 20 (70 actions) | 38 | none | none | 1 |
| `book-root-bin` | `^(root|bin)` / `bin:x:1:1:bin:/bin:/sbin/nologin` / ERE | 8 | 5 | `bin` 0–3 | `bin` 0–3 | 0 |
| `greedy` | `a.*b` / `aXbYb` / ERE | 10 | 8 | `aXbYb` 0–5 | `aXbYb` 0–5 | 0 |
| `leftmost-longest` | `a|ab` / `ab` / ERE | 3 | 1 | `a` 0–1 | `ab` 0–2 | 0 |
| `anchor-scan` | `t$` / `root:x` / ERE | 15 | 8 | none | none | 1 |
| `explosion` | `(a+)+b` / `aaaaaa` / ERE | 20 (671 actions) | 367 | none | none | 1 |

Walks: `book-ro-t` r✓, o✓ (+'s one), o✓ (choice point: stop at 1), o? at 3 is `t` → `+` stops at 2, t✓, match;
1 choice point never tried. `book-root-bin` ^✓, enter `(root|bin)` (choice point: bin), r✗ against b, back → bin,
b✓ i✓ n✓, match. `greedy` a✓, `.*` takes X b Y b (4 choice points), one more at the end ✗ → stops at 4, b✗ at the end,
back: `.*` gives back one (3, the task's caption), b✓ at 4, match. `leftmost-longest` enter `a|ab` (choice point: ab),
a✓, match `a`; the choice point is never tried; POSIX reports `ab`. `anchor-scan` starts 0–6: t✗ ×3, t✓ at 3 then
$✗ at 4, t✗ at 4, 5 and at the end; 6 restarts; no match. `explosion` (a+) takes all six, the group tries a second
repetition, b fails, and the stack unwinds through every way to split six a's: 671 actions, 367 tries, no match.
