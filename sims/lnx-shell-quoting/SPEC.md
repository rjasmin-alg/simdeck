<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-shell-quoting: specification

One concept: **what the shell does to a line before the command sees it.** The student picks a line and steps
through the shell's stages, one per step, for the whole line at once: words and quote spans, expansion, field
splitting, pathname expansion, quote removal, and then the command with its final arguments.

Task: `docs/tasks/w2/lnx-shell-quoting.md`. Catalogue: `lnx-shell-quoting` (`docs/catalogue.md` §4.4). Class:
stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[UL16]** `uvod-u-linux/book/chapters/16-ljuska-kao-jezik.md`, "Ljuska kao jezik: varijable, navodnici i
  zamjena naredbe": "Što treba znati" (definitions *proširenje*, *navodnici*, *razdvajanje na polja*, *zamjena
  naredbe*; the fixed order; the scripts `navodnici.sh`, `razmaci.sh`, `polja.sh` with their output; "`rm "$x"` …
  `rm $x` pušta vrijednost kroz oba preostala koraka"; "`for f in $(ls)` zato nije pošteđen ničega"), "Šire o temi"
  (`$` keeps its meaning in double quotes; `'don'\''t'`; `${ime}`), "Primjer 2 — Navodnici nisu oprez nego odluka".
- **[UL16-fig]** `uvod-u-linux/assets/diagrams/chapter-16/navodnici-i-razdvajanje.svg`: the same value along two
  paths, stage by stage, and its sentence "Dvostruki navodnici ne uključuju nikakvu zaštitu. Oni samo čine da
  razdvajanje na polja nema nad čim raditi." Used for the layout (stage strips top to bottom); nothing copied.
- **[POSIX]** POSIX.1-2024 XCU §2.2 Quoting, §2.2.2 Single-Quotes, §2.2.3 Double-Quotes; §2.5.3 Shell Variables
  (`IFS`, set to `<space><tab><newline>` when the shell starts); §2.6 Word Expansions (the order), §2.6.3 Command
  Substitution (trailing newlines removed), §2.6.5 Field Splitting, §2.6.6 Pathname Expansion, §2.6.7 Quote
  Removal; §2.14.3 Patterns Used for Filename Expansion (a leading `.` must be matched explicitly). As quoted in
  UL16's footnotes ch16-redoslijed … ch16-staze. *(check: §2.14.3 is the number UL16 cites; not re-read.)*

## Scene

- **Six stage strips, top to bottom**, each with its number and name on the left: (0) the typed line;
  (1) words; (2) after expansion; (3) after field splitting; (4) after pathname expansion; (5) after quote
  removal, the argument boxes `argv[0]`, `argv[1]`, … (for a `for` loop: the loop's items). A strip not yet reached
  is dashed and empty. Each word or field is a box (a field boundary is a box edge); a space inside a box is drawn
  as a visible mark, a newline too.
- **Quote spans** inside a box: none (plain), single (hatched), double (dotted outline); the quote characters stay
  visible, muted and bold, until stage 5 removes them. Characters that **came from an expansion** are underlined.
  Boxes this stage changed (split, replaced, shortened) carry the "changed" highlight; a word that vanished in
  splitting is a struck, dashed ghost.
- **Side card**: the variables (`ime`, `datoteka`, `niz`, `x`; the ones the line uses are lit at stage 2),
  `IFS` written as `$' \t\n'` / `:` / `$'\n'`, `set -f` on or off, the working directory and its files (files
  `rm` removed are struck at stage 6).
- **Bottom**: what the command did: output lines (or the loop's passes), and the exit status.

## State

```
{ stage: 0..6, line, kind: 'cmd' | 'for', vars: { name: value }, ifs, cwd, cwdFiles: [names], noglob,
  words, expanded, split, globbed, argv: [item] | null (null until their stage),
  exps: [{ id, word, kind: 'param' | 'cmd' | 'tilde', name, cmd, text, q, value, printed }],
  splitInfo: [{ exp, outcome: 'quoted' | 'split' | 'trim' | 'whole' | 'blank' | 'empty', fields }] | null,
  globInfo: [{ field, outcome: 'quoted' | 'notpattern' | 'noglob' | 'matched' | 'nomatch', matches }] | null,
  removedQuotes: number | null,
  result: { kind: 'cmd' | 'for' | 'unknown', out: [lines], status, removed: [names], name?, items? } | null }
item = { src (the word it came from), text, parts: [{ text, quoted: 'none'|'single'|'double', fromExpansion,
         quoteChar }], syntax?, changed?, vanished?, fromGlob?, index? }
```

Outcomes, for the captions: `split` (more than one field), `trim` (IFS characters only at the edges: one field),
`whole` (no IFS character, or a tilde), `blank` (nothing left of the expansion, the word stays), `empty` (the word
vanished); `notpattern` (an unquoted `[` that never closes).

The task's `words` / `fields` / `argv` are `words`, `split` and `argv` here, with `expanded` and `globbed` for the
two strips between. Internally every character is `{ c, q, qc, x, e }` (its quote context, whether it is a quote
character, whether it came from an expansion and which one), so each stage reads what it needs (rule 8).

The model reads the line as text in a small language: words separated by blanks, `'…'`, `"…"`, `$name`,
`${name}`, `$(cmd)`, a leading `~`. A backslash, an unclosed quote or `$(` throws (not part of the language).
Command substitution knows only `ls` (the working directory's names, one per line). Commands that run: `echo`,
`ls [-l] [names]`, `rm names`, and `for name in words` (the first three words are syntax and are not expanded);
any other command is analysed but not run (`kind: 'unknown'`). The page offers only the preset lines.

## Steps

Seven states, one per stage, for every line (`steps: 6`; step 0 is the typed line, the task's stage 1). A stage
with nothing to do still takes its step and says so.

| n | stage | what it does |
|---|---|---|
| 0 | typed line | the line as typed, nothing done |
| 1 | words | cut at blanks outside quotes; quote spans marked |
| 2 | expansion | tilde, parameter, command substitution, left to right; results tagged |
| 3 | field splitting | unquoted expansion results split at `IFS` characters |
| 4 | pathname expansion | unquoted patterns replaced by the matching names |
| 5 | quote removal | the shell's quote characters deleted: argv |
| 6 | run | the command runs with argv: output and status |

## Rules

1. **Fixed order.** Tilde, parameter, command substitution (and arithmetic, not modelled) first; then field
   splitting on what they produced; then pathname expansion; quote removal last. [UL16 definicija proširenje;
   POSIX §2.6]
2. **Single quotes** keep every character literal, with no exception, so `'$ime'` stays the 4-character text
   `$ime`. **Double quotes** keep everything literal except `$`, backtick and `\`, so `"$ime"` still expands.
   [UL16; POSIX §2.2.2, §2.2.3]
3. **Field splitting applies only to the results of expansions that were not inside double quotes**, at the
   characters in `IFS` (default space, tab, newline). Blanks typed on the line were word boundaries at stage 1 and
   are not split again; with `IFS=:` they still separate words. [UL16 definicija razdvajanje na polja; POSIX §2.6.5,
   §2.5.3]
4. **IFS white space**: leading and trailing dropped, a run is one separator; an unquoted expansion that is empty
   or all white space yields **zero** fields (the argument disappears); `"$nema"` yields one empty argument. A
   non-white-space IFS character delimits a field together with the white space next to it; two in a row give an
   empty field (`a::b` → `a`, empty, `b`), a trailing one gives none (`a:` → `a`). [POSIX §2.6.5; checked in bash]
5. **Pathname expansion**: a field with an unquoted `*`, `?` or bracket expression is replaced by the matching names
   of the working directory, sorted; unless `set -f`. No match: the pattern stays as it is (no `nullglob`). A name
   starting with `.` is not matched by `*`, `?` or a bracket. Quoted pattern characters match only themselves
   (`'*'.txt` is literal). In a bracket, `]` first is a member, a quoted `]` does not close it, `!` or `^` first
   negates only when unquoted (`["!"d]*` matches `drugi.txt`). A glob result is never split again. [UL16 razrješavanje staza, `set -f`; POSIX §2.6.6,
   §2.14.3]
6. **Command substitution** output loses its trailing newlines, then goes through rules 3–5 like a variable's
   value (a newline inside it is IFS white space). [UL16 definicija zamjena naredbe; POSIX §2.6.3]
7. **Quote removal** deletes the quote characters the shell interpreted (a `'` inside `"…"` is not one and stays);
   what is left is the argument. [POSIX §2.6.7]
8. **Tie-break:** within one word, quoted and unquoted parts are tracked separately: in `"$a"$b` only the `$b` part
   is split and globbed; `pre$ime"post $ime"$ime` → `preAna`, `Marijapost Ana MarijaAna`, `Marija`. [POSIX §2.6.5;
   derived, checked in bash]

A **tilde** result is treated as quoted: never split or used as a pattern (POSIX §2.6.1; `~/x` with `IFS=/` stays
one field). Sorting is by code point. The presets' names are lowercase ASCII, where the C and a Croatian or English locale's
collation agree (`drugi.txt` before `moj izvjestaj.txt`). Tilde gives `/home/student` (the book's user).

## Params

| key | type | default | effect |
|---|---|---|---|
| `line` | select (6 lines, resets) | `bez` | the preset line |
| `quoted` | toggle | off | wraps the line's expansion in double quotes; disabled (with the reason) on `jednostruki`, which has no expansion |
| `ifs` | choice `default` / `colon` / `newline` | `default` | `IFS` = `$' \t\n'`, `:`, `$'\n'` |
| `noglob` | toggle | off | `set -f`: stage 4 does nothing |

## Presets and expected numbers (default IFS, `set -f` off)

The machine: `ime="Ana Marija"`, `datoteka="moj izvjestaj.txt"`, `niz="a b c"`, `x="*.txt"`; working directory
`~/vjezba16/pokus` with `moj izvjestaj.txt` and `drugi.txt` (UL16 `razmaci.sh`).

| preset | line | argv / items | output, status |
|---|---|---|---|
| `bez` | `echo bez navodnika: $ime` | `echo` `bez` `navodnika:` `Ana` `Marija` (4 arguments) | `bez navodnika: Ana Marija`, 0 |
| quoted | `echo bez navodnika: "$ime"` | … `Ana Marija` (3 arguments) | the same line, 0 |
| `jednostruki` | `echo jednostruki: '$ime'` | `echo` `jednostruki:` `$ime` (4 characters) | `jednostruki: $ime`, 0 |
| `razmaci` | `ls -l $datoteka` | `ls` `-l` `moj` `izvjestaj.txt` | two `ls: cannot access '…': No such file or directory` lines, 2 |
| quoted | `ls -l "$datoteka"` | `ls` `-l` `moj izvjestaj.txt` | `-rw-r--r--. 1 student student 0 Sep  1 11:38 moj izvjestaj.txt`, 0 |
| `polja` | `for x in $niz` | items `a` `b` `c` (3 passes) | 0 |
| quoted | `for x in "$niz"` | item `a b c` (1 pass) | 0 |
| `uzorak` | `rm $x` | split: 1 field `*.txt`; globbed: `drugi.txt` `moj izvjestaj.txt` (2 arguments) | both removed, 0 |
| quoted / `set -f` | `rm "$x"` / `rm $x` | `rm` `*.txt` | `rm: cannot remove '*.txt': No such file or directory`, 1 |
| `zamjena` | `for f in $(ls)` | `ls` prints `drugi.txt`, `moj izvjestaj.txt`; items `drugi.txt` `moj` `izvjestaj.txt` (3) | 0 |
| quoted | `for f in "$(ls)"` | one item `drugi.txt⏎moj izvjestaj.txt` | 0 |

Other IFS: with `:` no preset value contains a colon, so every unquoted expansion stays one field (`bez` 3
arguments, `razmaci` succeeds, `polja` 1 pass, `zamjena` 1 item with a newline inside); with newline only,
`zamjena` gives 2 items, `drugi.txt` and `moj izvjestaj.txt`, and the others are as with `:`. `uzorak` is the same
under every IFS (no IFS character in `*.txt`). All of these were run in bash 5.2.21 (`NOTES.md`, Checks).

## Captions

Stage by stage, from the state: the expansions and their values (stage 2, an expansion skipped inside single
quotes); per expansion one of "split into n fields", "inside double quotes: nothing to work on" (the task's
"Dvostruki navodnici ništa ne štite…" / "Double quotes protect nothing…"), "no IFS character in the value, one
field" (with a note that typed blanks are not IFS's business when IFS is not the default), "empty: zero fields",
or "no expansion at all"; per pattern one of matched (with "the space survives" when a name has one), quoted,
`set -f`, no match, or "nothing to do"; quote removal with the argument count; the run with what the command did
and one sentence on what the preset shows. The task's split caption is used as a template: "vrijednost `{exp}`
nije bila u dvostrukim navodnicima, pa je razdvojena po razmaku — iz nje nastaju …".

## Simplifications

- No backslash, backtick command substitution (a backtick is an ordinary character here), `$'…'`, brace expansion, arithmetic, `$@`/`$*`, arrays, `nullglob`/`failglob`/`globstar`, alias
  and history expansion (the task's out of scope). Only a `$(` without nested parentheses.
- The `for` loop's body is not shown: the result lists the passes (`x = a`, …).
- `ls -l` prints the book's listing line for any existing file; errors come before listings, as GNU `ls` does.
- Sorting by code point instead of the locale (no preset differs).
