<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-shell-quoting: notes

New stepper (task `docs/tasks/w2/lnx-shell-quoting.md`, catalogue `lnx-shell-quoting`, wave 2b). No kit view fits
(K1–K4 are sequence, topology, rule table, block grid), so the page draws its own stage in HTML: six stage strips top
to bottom like `navodnici-i-razdvajanje.svg`, the command's result below them, and a side card. Rules and expected
numbers: `SPEC.md`.

## Decisions

- **Steps: 6 (seven states).** The task lists seven stages, "(1) the typed line … (7) the command runs", and gives
  the state as `stage: 0..6`. Step 0 is the typed line, so each stage is one state and the kit's `steps` is 6. The
  task's "Steps: 7 for every preset (one per stage)" is read as seven stages; an empty prompt before the line would
  have been a wasted click.
- **The model reads the line as text** and tracks every character with its quote context, whether it is a quote
  character, and which expansion it came from (`{ c, q, qc, x, e }`). Each stage reads only what it needs, so rule 8
  (quoted and unquoted parts of one word) falls out of the representation, and tests type their own lines
  (`pre$ime"post $ime"$ime`, `a::b` with `IFS=:`, `.*.txt`, `~`, `"a'b"`). The page offers only the six lines.
- **Six strips, not seven.** The task's "after quote removal" and "the final argument boxes" are the same content, so
  strip 5 is quote removal with the boxes labelled `argv[0]`, `argv[1]`, … (for a loop: "stavka 1", …) and the
  seventh row is what the command did.
- **Boxes are grouped by the word they came from**, with a wider gap between groups, so splitting and globbing show
  one word turning into several boxes. A space inside a box is drawn as `␣` and a newline as `↵` (with an
  aria-label), so "Ana Marija" in one box is visibly one argument.
- **Quote spans**: single = hatched, double = dotted frame, each with a tint; quote characters muted and bold until
  strip 5; "from an expansion" is a thick underline. All three survive grayscale (checked).
- **"Changed"** marks the boxes a stage changed (expansion: words with an expansion; splitting: words that split or
  vanished; globbing: replaced fields; quote removal: boxes that lost quotes). Stage 1 marks nothing: every word is
  new there, and the current strip is outlined anyway.
- **Side card**: the four variables, `IFS` written as `$' \t\n'` / `:` / `$'\n'`, `set -f`, and the files. The card
  lights what the current stage reads: the variables the line uses (stage 2), `IFS` (stage 3), `set -f` and the
  matched files (stage 4), the removed files (stage 6, struck through).
- **`quoted` param**: wraps the expansion in double quotes in the same line (`echo bez navodnika: "$ime"`, so the
  output is the same, as the task says). On `jednostruki` it is disabled with the reason (the line has no
  expansion); the model ignores it there.
- **`for` loops**: `for`, the name and `in` are syntax (muted boxes, not expanded); the rest are the loop's items. The
  body is not shown; the result lists the passes (`1. prolaz: x = a`). The variable `x` keeps `*.txt` in the side
  card: the loop's assignments are not shown.
- **Program output is data**: the `ls`/`rm` messages are GNU's English wording, as the book prints them, in both
  languages (`translate="no"`). `ls -l` of an existing file prints the book's line
  (`-rw-r--r--. 1 student student 0 Sep  1 11:38 moj izvjestaj.txt`). The commands are the subject (the book's
  scripts), so `echo`, `ls`, `rm` appear as code.
- **Captions** are built from the state, per expansion and per pattern. The task's two captions are used: the split
  one as a template ("vrijednost `{exp}` nije bila u dvostrukim navodnicima, pa je razdvojena po {sep} — iz nje
  nastaju …"; the task's example mixes `$ime` with `ls`/`moj`, so the template names the real expansion), and
  "Dvostruki navodnici ništa ne štite: oni ovom koraku samo oduzimaju materijal" verbatim, highlighted. The last step
  adds one sentence on what the preset shows, chosen by the outcome (e.g. `polja` with one pass: "splitting was
  needed here"), from UL16 and Primjer 2.
- **Glossary terms** (`[[expansion]]`, `[[quoting]]`, `[[field splitting]]`, `[[command substitution]]`) are used in
  the explanation only. In captions they would start a sentence in lowercase or land in the wrong Croatian case
  ("unutar *quoting* (navodnici)"); the strip names already give the Croatian terms.
- **Preset entries** in `sim.json` for `uzorak` (globbing after splitting) and `zamjena` (command output splits too).

## Deviations from the task

- `quoted` has no effect on `jednostruki` (disabled with a reason); the task names it as a global toggle.
- Steps read as described above (6 kit steps, 7 states).
- Sorting is by code point, not the locale's collation; the presets' names are lowercase ASCII, where they agree.
- **English title** kept as the catalogue's "Quoting and word splitting", although the page (and the Croatian title)
  says "field splitting" / "razdvajanje na polja", POSIX's term. "word splitting" is an alias too. *(owner: rename
  to "Quoting and field splitting"?)*

## Sources

- `uvod-u-linux/book/chapters/16-ljuska-kao-jezik.md`: "Ljuska kao jezik: varijable, navodnici i zamjena naredbe"
  ("Što treba znati": definitions, the order, `navodnici.sh`, `razmaci.sh`, `polja.sh` and their output, `rm "$x"` /
  `rm $x`, `for f in $(ls)`; "Šire o temi"), "Primjer 2 — Navodnici nisu oprez nego odluka"; footnotes
  ch16-redoslijed … ch16-zamjena-redak (POSIX.1-2024 XCU §2.2, §2.2.2, §2.2.3, §2.5.3, §2.6, §2.6.3, §2.6.5, §2.6.6).
- `uvod-u-linux/assets/diagrams/chapter-16/navodnici-i-razdvajanje.svg`: the layout (stages top to bottom) and its
  closing sentence. Nothing copied.
- POSIX §2.6.7 Quote Removal and §2.14.3 (leading dot) *(check: as cited by the task; not re-read for this task)*.

## Checks

- Numbers printed from the model for every line × quoted × IFS × `set -f` before the page was written; all equal the
  task's (SPEC.md table).
- **Run in bash 5.2.21 on a Linux machine** in a scratch directory with `moj izvjestaj.txt` and `drugi.txt`: every
  preset line under the three IFS values and `set -f`, plus `$nema`, `"$nema"`, three spaces, `pre$ime"post
  $ime"$ime`, `a::b` / `:a` / `a:` with `IFS=:`, ` :a` / `a : b` with `IFS=' :'`, `~ ~/x "~" a~`, `*.TXT`, `'*'.txt`,
  `[dm]*`, `[!d]*`, and `ls -l` with and without quotes (status 2 and 0): the argv of each equals the model's.
  *(check on the lab VM: not done; the semantics are the shell's, not the machine's.)*
- `node --test sims/lnx-shell-quoting/sim.test.js`: 30 tests. **Mutations**: 36 mutations of the model, one rule at a
  time, run on a copy (quote semantics, what splits, white-space runs, empty fields, zero fields, quoted pattern
  characters, `set -f`, sorting, dot files, no-match, glob before split, trailing newlines (all vs one), quote
  removal, tilde, `for` syntax, stage reveal, `ls`/`rm` status, `echo` join, changed marks, the `quoted` toggle,
  the outcomes, bracket negation and quoted `!`/`]`, the tilde result splitting, the IFS choice): all fail a test (two
  survived at first, the one-trailing-newline strip and the "whole" outcome; tests added).
- `npm run gate -- lnx-shell-quoting`: pass (manifest, tests, build, 63 browser checks, tokens, scope). Screenshots at
  1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed; plus every preset at its key steps (quoted, IFS
  and `set -f` variants) with a local Playwright script. Fixed from them: strip names wrapping, the side card
  wrapping `datoteka`, "no output" and the loop passes in the mono font, the strike-through covering the "removed"
  tag, Croatian agreement in the `ls` caption ("2 od njih ne postoje"), a one-pass loop saying "redom dobiva".

- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against UL16; compared
  75 extra lines with bash 5.2 under `LC_ALL=C`; printed every caption of 1008 URL combinations in both languages;
  ran 46 mutations of its own). Fixed from it: the `zamjena` note blaming quotes with `IFS=:` and no quotes
  (`nZamjenaWhole`); the words caption saying "the quotes are still there" on lines without quotes, and calling the
  shading "uzorak" (the page's word for a glob pattern); the tilde result being split and globbed (now literal, POSIX
  §2.6.1); a quoted `!` negating a bracket; outcome labels outside the presets (`blank`, `trim`, `notpattern`);
  "dobiva 1 argument, svaki u svojoj kutiji"; the `uzorak` note for quotes vs `set -f`; "abecednim redom" vs "in order"
  (now "sorted by name"); `expCmd` and `nPoljaOne` wording; two bracketed groups in a row in the Croatian
  explanation, and the *pathname expansion* / *quote removal* pairs added there; tests for leading dots with `?` and
  `[…]`, `a : : b`, quoted `]`, `]` first, `^`, ranges, the state the page draws (argv index, quote context before
  expansion, glob changes, syntax marks, `missing`, sorted files), tabs, `${name}`, `$( ls )`, `rm` twice, `echo ""`.
  Survivors left, equivalent: a `^` skip that finds the same `]`; globbing the `for` syntax words (a loop name cannot
  hold a pattern); `for` detection with an expansion as the first word (its text never reads `for`); `exps` revealed
  before stage 2 (the page reads them only from stage 2). Not changed: the English title (above).

## Term pairs

From the glossary (explanation): *expansion*, *quoting*, *field splitting*, *command substitution*. Missing, written
out in both tables (`"src": "simdeck"` if the coordinator adds them, Croatian from UL16):

- *parameter expansion* — **zamjena parametra**
- *pathname expansion* — **razrješavanje staza**
- *quote removal* — **uklanjanje navodnika**

## Shared requests

None.

## Time

Start 2026-10-22 23:56, done 2026-10-23 about 16:35 (CEST), one session, including the fresh review and its fixes.
The wall time includes a long pause (the session stopped after SPEC.md and waited until it was told to continue), so
it overstates the work; the active time was not measured.
