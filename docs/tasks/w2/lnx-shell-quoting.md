# lnx-shell-quoting: Quoting and word splitting

| | |
|---|---|
| Task | `lnx-shell-quoting` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-shell-quoting` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-shell-quoting/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `shell` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **what the shell does to a line before the command sees it**.

The student: type lines, step expansion, splitting, globbing.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/16-ljuska-kao-jezik.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-16/`
- UL ch16 section "Ljuska kao jezik: varijable, navodnici i zamjena naredbe" → "Što treba znati" (scripts `navodnici.sh`, `razmaci.sh`, `polja.sh`) and "Šire o temi" (`'don'\''t'`, backslash, `${ime}`); "Primjer 2 — Navodnici nisu oprez nego odluka"; diagram `assets/diagrams/chapter-16/navodnici-i-razdvajanje.svg`
- POSIX.1-2024 XCU §2.2 Quoting (§2.2.1–2.2.3), §2.5.3 Shell Variables (`IFS`), §2.6 Word Expansions (§2.6.3, §2.6.5, §2.6.6, §2.6.7), as cited in UL ch16 footnotes ch16-redoslijed … ch16-staze
- Catalogue seed: UL ch16 (navodnici-i-razdvajanje.svg)

## Model and presets

- **Scene:** a pipeline of stage strips stacked top to bottom, like `navodnici-i-razdvajanje.svg`: the typed line; words (quote spans shaded: none, `'…'`, `"…"`); after expansion; after field splitting; after pathname expansion; after quote removal; the final argument boxes (`argv[0]`, `argv[1]`, …, each a separate box so a space inside one is visible). A side card shows the variables (`ime`, `datoteka`, `niz`, `x`), `IFS` written as `$' \t\n'`, and the working directory's file list. The bottom shows what the command did (output lines, exit status).
- **State:** `{ line, vars: {name: value}, ifs, cwdFiles: [names], noglob: bool, stage: 0..6, words: [{ parts: [{ text, quoted: "none"|"single"|"double", fromExpansion: bool }] }], fields: [...], argv: [strings], result: { out: [lines], status } }`.
- **One step:** the shell finishes one stage for the whole line (all words at once), in the POSIX order: (1) the typed line; (2) tokenizing into words, quote spans marked; (3) tilde, parameter and command substitution, results tagged "came from an expansion"; (4) field splitting; (5) pathname expansion; (6) quote removal; (7) the command runs with the final argv.
- **Rules:**
  1. Order is fixed: tilde, parameter, command substitution and arithmetic first; then field splitting; then pathname expansion; quote removal last. Source: UL ch16 "Ljuska kao jezik: varijable, navodnici i zamjena naredbe" (definicija proširenje); POSIX XCU §2.6 Word Expansions.
  2. Single quotes keep every character literal, with no exception (a `'` cannot occur inside). Double quotes keep everything literal except `$`, backtick and `\`, so `"$ime"` still expands. Source: UL ch16; POSIX §2.2.2 Single-Quotes, §2.2.3 Double-Quotes.
  3. Field splitting applies **only to the results of expansions that were not inside double quotes**, using the characters in `IFS` (default space, tab, newline). Literal spaces typed on the line were already word boundaries at step 2 and are not "split" again. Source: UL ch16 (definicija razdvajanje na polja); POSIX §2.6.5 Field Splitting, §2.5.3 `IFS`.
  4. With default `IFS`, leading and trailing IFS whitespace is dropped and runs of it count as one separator; an unquoted expansion that is empty or all whitespace yields **zero** fields (the argument disappears). Source: POSIX §2.6.5 (check the empty case on the lab VM).
  5. Each field that is unquoted and contains `*`, `?` or `[` is replaced by the matching file names, sorted by the locale's collating sequence; unless `set -f` is on. A pattern that matches nothing is left as it is (bash default, no `nullglob`). Names starting with `.` are not matched by `*`. Source: UL ch16 (razrješavanje staza, `set -f`); POSIX §2.6.6 Pathname Expansion and §2.14.3 Patterns Used for Filename Expansion (check section number in POSIX.1-2024).
  6. Command substitution output loses its trailing newlines, then goes through rules 3–5 like a variable's value. Source: UL ch16 (definicija zamjena naredbe); POSIX §2.6.3.
  7. Quote removal deletes the quote characters that were not themselves quoted; what is left is the argument. Source: POSIX §2.6.7 Quote Removal.
  8. Tie-break: within one word, quoted and unquoted parts are tracked separately: in `"$a"$b` only the `$b` part is split and globbed (POSIX §2.6.5) (derived).
- **Params:** `line` (select, preset lines; default `bez`), `quoted` (toggle: wraps the expansion in the preset's line in double quotes, so one line shows both cases; default off), `ifs` (choice: `default` / `:` / `newline only`; default `default`), `noglob` (toggle `set -f`, default off).
- **Presets:**
  1. `bez` — `ime="Ana Marija"`, line `echo bez navodnika: $ime` → argv `echo`, `bez`, `navodnika:`, `Ana`, `Marija` (4 arguments); output `bez navodnika: Ana Marija`. With `quoted` on: 3 arguments, the last `Ana Marija`; same output. From UL ch16, `navodnici.sh`.
  2. `jednostruki` — `echo jednostruki: '$ime'` → argument `$ime` (4 characters), output `jednostruki: $ime`. From UL ch16, `navodnici.sh`.
  3. `razmaci` — `datoteka="moj izvjestaj.txt"`, files `moj izvjestaj.txt`, `drugi.txt`; `ls -l $datoteka` → argv `ls`, `-l`, `moj`, `izvjestaj.txt`, two "No such file or directory" lines, status 2. With `quoted` on: one argument, status 0. From UL ch16, `razmaci.sh`.
  4. `polja` — `niz="a b c"`, `for x in $niz` → 3 fields `a`, `b`, `c`; quoted → 1 field `a b c`. From UL ch16, `polja.sh`, and Primjer 2 ("jedna vrijednost ili popis?").
  5. `uzorak` — `x="*.txt"`, same files, `rm $x` → after splitting one field `*.txt`, after pathname expansion `drugi.txt`, `moj izvjestaj.txt` (2 arguments, the space survives because globbing comes after splitting); quoted → `rm` gets the literal `*.txt` and fails with status 1. With `noglob` on: literal `*.txt`. Derived from UL ch16 ("`rm "$x"` … `rm $x`"), unchecked.
  6. `zamjena` — same files, `for f in $(ls)` → `ls` prints `drugi.txt` and `moj izvjestaj.txt`; split into 3 fields `drugi.txt`, `moj`, `izvjestaj.txt`. Derived from UL ch16 ("`for f in $(ls)` zato nije pošteđen ničega"), unchecked.
- **Steps:** 7 for every preset (one per stage); stages with nothing to do still take a step and say so ("razdvajanje nema nad čim raditi").
- **Legend:** quote spans (none / single / double, each with its own pattern and the quote characters kept visible until step 6); "from an expansion" underline; field boundaries as box edges; "changed" highlight = the words this stage changed (split, replaced or shortened).
- **Captions:** hr: "Razdvajanje na polja: vrijednost `$ime` nije bila u dvostrukim navodnicima, pa je razdvojena po razmaku — `ls` dobiva dva imena, `moj` i `izvjestaj.txt`." en: "Field splitting: `$ime` was not inside double quotes, so it is split at the space — `ls` gets two names, `moj` and `izvjestaj.txt`." hr: "Dvostruki navodnici ništa ne štite: oni ovom koraku samo oduzimaju materijal." en: "Double quotes protect nothing: they just leave this step nothing to work on."
- **Terms:** quoting — navodnici; expansion — proširenje; parameter expansion — zamjena parametra; command substitution — zamjena naredbe; field splitting — razdvajanje na polja; pathname expansion — razrješavanje staza; shell variable — varijabla ljuske; argument — argument.
- **Misconceptions:** "quotes protect a value" (they remove material from the splitting step, UL ch16 Primjer 2); "always quote everything" (a list needs splitting, Primjer 2); "the spaces I typed and the spaces inside a variable are the same".
- **Out of scope:** brace expansion, arithmetic beyond naming it, `$@` vs `$*` (→ UL ch17), `$'…'`, arrays, `nullglob`/`failglob`/`globstar`, alias and history expansion.
<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-shell-quoting` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-shell-quoting sims/lnx-shell-quoting` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-shell-quoting/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
