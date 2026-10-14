<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-pipes-redirection: notes

New stepper (task `docs/tasks/w2/lnx-pipes-redirection.md`, catalogue `lnx-pipes-redirection`, wave 2b). No kit view
fits (K1–K4 are sequence, topology, rule table, block grid), so the page draws its own stage in HTML: the command
line, one box per process with its descriptor table, the targets, and one wire per open descriptor in an SVG drawn at
1:1 over the boxes. Rules and expected numbers: `SPEC.md`.

## Decisions

- **The model reads the command line as text** (`parse()`): words, `|`, `|&`, `[n]>`, `[n]>>`, `[n]<`, `[n]>&m`, and
  three programs (`cat`, `wc -l`, `echo`). The presets are six lines of text (`LINES`); tests type their own lines
  (`> a > b`, `|&`, `2>&3`, `< f`, `>>` on an existing file), so every rule is tested on the same code the presets
  use. The page offers only the six lines (`line` select, one preset per line, ids equal).
- **State as frames.** `frames(p)` computes every step once (memoised on the line and `missing`); `step(s, n, p)` returns
  a copy of frame n. Pure and deterministic; the generic tests cover replay and copies.
- **Step 0 is the line typed** (no descriptor open yet, boxes dashed, "waits for the shell to start it"); the task's
  "1 (start)" is step 1, so the step counts are exactly the task's (4, 4, 5, 5, 6, 7) and the kit's `steps` equals
  them.
- **The descriptor table is in every box** (`0 ← zaslon`, `1 → ~/samo1.txt`, `2 → cijev, piše`). It carries the same
  information as the wires in words, so the phone layout hides the wires and keeps the tables, and grayscale needs
  nothing else. Wires: colour + line style (0 dotted, 1 solid, 2 dashed) + the number in a circle; a moved wire is
  thicker with a highlighter halo and its table row is highlighted.
- **Every line of text carries the badge of the descriptor that wrote it** (on the screen, in a file, in the pipe), so
  "the error went through the pipe" is visible in the pipe itself in `cijev-2`.
- **Applied tokens are underlined** on the command line; the token of this step is lit. On step 1 the command words
  are lit (the processes start).
- **The final step's caption** counts the lines on the screen and in each file and adds one sentence on what the
  preset shows (`n*` strings), or, with `missing` off, that the difference shows only when something is written on
  fd 2. The two task captions are used as written (`cDup` with `where` = the file, `cBypass`).
- **`/nema-me` when it exists** holds one line, `demo` (data). `/etc/hostname` holds `demosrv1`, the book's machine.
- **Program output is data**: the error message is shown as the book prints it (`cat: /nema-me: No such file or
  directory`), in English in both languages, `translate="no"`. The commands are the subject (the book's own lines), so
  `cat` and `wc -l` appear as code, never as product names.
- **Preset entries** in `sim.json` for `obrnuto` (the order) and `cijev-2` (the pipe before redirections), so a course
  file can name them as `lnx-pipes-redirection#<preset>`.
- **Wires are measured** from the laid-out boxes (`getBoundingClientRect`) and redrawn on stage resize (a
  `ResizeObserver`) and when fonts load. The SVG has no `viewBox`, so nothing in it is scaled; the numbers on the wires
  are HTML.

## Deviations from the task

- **Rule 7 and `|&`, `<`, `>>` have no preset** (the task names six presets); they are in the model and tested.
- **A redirection error** (`2>&3`, `< missing`) stops the command and the rest of its redirections, as in bash; the model
  does not print the shell's own "Bad file descriptor" line on the screen (no preset reaches it).
- **stdout before stderr** within one process is the task's step order. A real `cat /nema-me /etc/hostname` writes the
  error first; no preset has a file after the missing one, so no preset differs (SPEC.md, Simplifications).

## Sources

- `uvod-u-linux/book/chapters/06-cjevovodi-obrada-teksta.md`, "Tokovi, preusmjeravanje i cjevovodi": "Što treba znati"
  (the three streams and their numbers; `>`, `>>`, `<`, `2>`, `2>&1` with `cat /nema-me`; the pipeline) and "Šire o
  temi" (capacity and blocking, in the explanation only); its footnotes citing POSIX XCU §2.7, §2.7.1–3, §2.7.6, §2.9.2
  and `<unistd.h>`, and the Bash manual on pipelines.
- `uvod-u-linux/assets/diagrams/chapter-06/cjevovod-i-tri-toka.svg` and `tri-preusmjeravanja.svg`: the layout (process
  boxes, the pipe between them, the screen below, numbered wires). Nothing copied.
- GNU Bash Reference Manual §3.2.3 (pipe before redirections; `|&` and its implicit `2>&1` after the command's
  redirections) and §3.6 (the `ls > dirlist 2>&1` vs `ls 2>&1 > dirlist` example) *(check: as cited by the task and
  the book, not re-read)*.

## Checks

- Numbers printed from the model before the page was written (a `node` script over all six lines, `missing` on and
  off, plus `> a > b`, `2>&3`, `|&`, `2>&1 > f |`, `< f`): steps 4/4/5/5/6/7 both ways; screens and files as in SPEC.md.
- **Run in bash 5.2.21 on a Linux machine** (HOME in a scratch folder): all six presets, `> a > b` (a emptied),
  `|&` (2) and `2>&3` (shell error, `cat` not run) give what the model gives. *(check on the lab VM: not done, this was
  another Linux machine; the semantics are the shell's, not the machine's.)*
- Rule tests broken on purpose with a script, one mutation at a time (start fd closed, pipe also moving fd 2, pipes after
  redirections, `>` not truncating, `>>` truncating, dups applied last, right-to-left order, only the last `>`
  truncating, the first file of `> a > b` not created, dup of a closed fd allowed, a failed command still running,
  stderr first, output in produced order, the pipe not drained, `|&` before or without its `2>&1`, pipe writes landing
  on the screen, `<` of a missing file allowed, the dup's changed mark, `missing` ignored, no final step, `wc` off by
  one, the start's changed marks, `opened` not recorded, `>>` not creating, `<` ignored): all **26** fail a test (one
  survived at first, the first file of `> a > b` when it did not exist; a test was added).
- `npm run gate -- lnx-pipes-redirection`: pass (manifest, tests, build, 63 browser checks, tokens, scope).
  Screenshots at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed; plus every preset at its key steps
  with a local Playwright script. Fixed from them: the screen's highlighted line filling the whole screen, wire numbers
  overlapping where the wire to the screen crosses the wire to a file, the process command overflowing its box, the
  pipe's lines wrapping into five rows.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against UL ch06, compared
  about 22 extra lines with bash 5.2, printed every caption in both languages, and ran 47 mutations of its own; 16
  survived at first). Fixed from it: the `2>&1` caption claiming an error goes there when `missing` is off
  (`cDupNoErr`); fd 0 on the terminal labelled "screen" (now "keyboard", the box "Terminal: screen and keyboard", the
  start caption says 0 reads from the keyboard); `cOut` saying "created" for a file that existed; the parser gluing a
  word after a redirection onto it, and crashing on `cat >` / misreading `2>&-` (now it throws); a machine file used as
  a redirection target shown as absent and empty; `opened` not set for `<`; Croatian "s deskriptora", "korak po
  korak", "Ista preusmjeravanja, obrnut poredak", "na standardni izlaz", English "to descriptor", `cRead`; tests for
  `>&` without a number, `n>&m` and `n<` on other fds, `<` (a machine file, the wire, a missing file stopping the rest,
  a file only named later), `wrote.target`, `opened` for `>>`, no wire moved by an error, `pipe.read`, three-stage
  pipes, a write lost on a read end, a trailing `|`, parse errors. The remaining survivors are equivalent (a mutation
  pair that only acts together, `|&` on the last command, `<` files in `namedFiles`). Kept: the Croatian explanation
  puts the English term first with the Croatian in parentheses, as COMMON.md §4 requires (the reviewer suggested the
  book's order). Added to SPEC.md, Simplifications: one file opened twice, a write to a read end.

## Term pairs

Not used through the glossary; written out in both tables:

- *file descriptor* — **datotečni deskriptor** (UL ch06). `kit/glossary.js` has *file descriptor* — "opisnik
  datoteke" (`src: ossimulator`), which differs from the Linux book's term; the page follows the book. The coordinator
  may want a book-specific variant or to settle one Croatian term.
- *pipe* — **cijev** (UL ch06: "Riječ „cijev” … nije usporedba nego ime mehanizma"). Missing from the glossary
  (`"src": "simdeck"`).

From the glossary: *standard input*, *standard output*, *standard error*, *redirection*, *pipeline*.

## Shared requests

None.

## Time

Start 2026-10-14 17:56, done 18:20 (CEST): about 25 minutes, one session, including the fresh review.
