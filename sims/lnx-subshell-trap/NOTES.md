<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-subshell-trap: notes

New stepper (task `docs/tasks/w3/lnx-subshell-trap.md`, catalogue `lnx-subshell-trap`, wave 3). No kit view fits
(K1–K4 are sequence, topology, rule table, block grid), so the page draws its stage in HTML: the listing, the
environment boxes stacked like UL figure `podljuska-i-trap.svg`, and the terminal. Rules and expected numbers:
`SPEC.md`.

## Decisions

- **Reuse of `lnx-shell-quoting` (soft dependency):** the line-by-line listing with the current line marked, and the
  page's three-part stage drawn in HTML; the terminal with the caller's command line `$ ./x.sh; echo "izlazni status:
  $?"` follows `lnx-exit-status` (the neighbour on ch17). **No code was copied:** `models/` has no shell model, and
  `lnx-shell-quoting`'s model is about expansion stages, `lnx-exit-status`'s about statuses; this one is about
  execution environments, which neither has. Nothing here is named as a dependency by a later task, but the model
  is pure functions over plain data (`framesOf`, `changes`, `build`) and could be promoted as is.
- **Scripts are data, not parsed text.** Each preset is numbered lines; a line is a list of commands, each with its
  source text, from which `place()` computes its span in the line. The step's command is underlined inside its line
  (a line like `( echo "u podljusci"; exit 1 )` takes two steps), and a trap action's step marks the action inside
  the quotes of its `trap` line. `logic.build` exposes the helpers, so tests write their own scripts (nested `exit`,
  `$(trap)`, `$(cd /etc; pwd)`, `trap … EXIT; false`).
- **State as frames.** `framesOf(script)` runs a small interpreter once and pushes a frame per step (memoised per
  script); `step(s, n, p)` returns a copy of frame n. A step is closed lazily (the frame is pushed when the next step
  begins), so a step can show what its command ended: a subshell that ran off its end or hit `exit`, the main
  shell's final status.
- **A box that ends stays one step, with a door and its status; the next step removes it.** The task says "vanishing
  when it ends"; showing it ended for one step is what lets the student see `exit 1` end the copy and the 1 reach the
  parent's `$?` in the same picture (task caption). The task's "Changed marks … the box created or removed": the
  created box gets the kit's changed outline, the ending box's door is highlighted.
- **Step counts** follow SPEC.md's "One step": one per command run, one per trap action, none for entering `(`. They
  equal the task's numbers (7, 5, 6, 5, 4). The task's "one per executed line" is read as one per command: with
  "per line" `book-ciscenje2` would have 4 and `cd-in-subshell` 5, but the task's own counts (5, 6) need the two
  commands inside `( … )` to be two steps, and `book-ciscenje`'s 7 needs the trap action to be a step.
- **`$( … )` runs inside its command's step** (`rad=$(mktemp …)` is one step whose frame shows the copy appear and end).
  The pipeline in `pipe-loses-var`: the first step shows both member boxes and the `printf` member ending; then one
  step per loop pass; the pass that empties the pipe also ends the loop (the next `read` fails) and the member. That
  `read` empties `x` in the member, as bash does (`x` is shown as `x=`).
- **`exiting`:** after `exit N` in an environment that has an `EXIT` trap, the box shows a dashed door "izlazi sa N,
  hvatanje čeka"; the trap is the next step. When an environment runs off its end with a trap, no such frame (the
  trap step follows the last command directly).
- **`$(trap)` exception (rule 3):** the copy keeps the traps (`kept`), only so `trap` can print them; the copy does not
  run them on its exit (bash prints `x` once, not twice). Tested; no preset uses it.
- **Program output is data:** `echo` lines, paths and `ls`'s message are shown as the book prints them, in both
  languages (`translate="no"`), like `lnx-exit-status`. The book's run picked `/tmp/vjezba17.YHRD9D`; the model uses
  that name so the page matches the book. The caller's line follows the page language (`callerSays`).
- **Output lines carry where they came from:** a solid square (main script), a dashed square (a subshell) or the hook
  (a trap action), the same shapes as the boxes and the legend, with an aria-label.
- **Default preset `book-ciscenje`** (task order, keys 1–5), so `sim.json` `steps` is 7. Preset entries in `sim.json`
  for `cd-in-subshell` (the headline concept), `book-ciscenje2` (the task caption) and `pipe-loses-var`.
- **`showCopy` off:** a nested box lists only the values that differ from its parent (and its trap row when reset or
  set), then "ostalo: kopija roditelja". The model is the same.
- **Captions** are built from the state and the previous one. The task caption is used verbatim for `exit` in
  parentheses when the main script has a trap (`cExitSubTrapMain`, highlighted), with `{cmd}` for `exit 1`; without a
  main trap a shorter variant. The key sentences (status arrives as `$?`, the cd did not stick, `{ …; }` stays, the
  variable lost, the trap running once) are highlighted. The last step of a preset whose main shell changed its
  directory adds that the calling shell is still in `vjezba17` (the misconception "cd in a script changes the
  caller's directory").
- **Glossary terms** (`[[subshell]]`, `[[command substitution]]`, `[[pipeline]]`, `[[exit status]]`) only in the
  explanation; box labels and captions use the Croatian words directly, as `lnx-shell-quoting` does.
- **Named tools:** `bash` is named once in the explanation, because `lastpipe` is bash's and the lost variable is
  bash's default (a shell that runs the last member in itself prints 2). `mktemp` and `rm` are in the book's script,
  the subject being taught. No standard is named on the page; POSIX is in SPEC.md and here.

## Deviations from the task

- Steps counted per command, not per line (above); the numbers are the task's.
- An ended box is shown for one more step before it vanishes (above).
- The legend has no separate "output line" item: the terminal's marks reuse the box shapes (solid, dashed, hook),
  which the legend already explains.

## Sources

- `uvod-u-linux/book/chapters/17-skripte-s-parametrima.md`, "Skripta koja smije raditi bez nadzora": `ciscenje.sh`
  and its output (status 3, the directory gone), `ciscenje2.sh` and its output, the definition *podljuska*, the
  paragraph on pipeline members and command substitution running in a subshell; footnotes ch17-trap, ch17-trap-exit,
  ch17-trap-podljuska, ch17-podljuska-greske (POSIX.1-2024 XCU `trap`, §2.8.1); the footnote on `$?` in a trap action.
  Primjer 1 ("Od posla do skripte", the fourth question).
- `uvod-u-linux/assets/diagrams/chapter-17/podljuska-i-trap.svg`: the stacked boxes (main script, nested subshell, the
  trap reset on entry, `exit 1` ending the subshell, the trap running once at the end). Nothing copied.
- bash(1) 5.2: Pipelines ("Each command in a multi-command pipeline … is executed in a subshell"), `lastpipe`,
  COMMAND EXECUTION ENVIRONMENT (subshell is a duplicate, traps reset, changes cannot affect the parent).
- POSIX §2.13 "Shell Execution Environment" and §2.9.4 grouping *(check: section numbers of Issue 8 as cited by the
  task, not re-read; no copy of the standard here)*.

## Checks

- **Run in bash 5.2.21 on Linux:** the five preset scripts (output and status equal SPEC.md's table), plus
  `v=1; ( v=2; echo in $v ); echo out $v`; `trap "echo x" EXIT; t=$(trap)` (and `$(trap; true)`, `( trap )`);
  `shopt -s lastpipe` with the pipeline (2) and `x` after the loop (empty); `trap "echo main" EXIT; ( trap "echo sub"
  EXIT; exit 4 ); echo "st $?"`; `trap "echo T; false" EXIT; exit 3` (3); `trap "echo T" EXIT; false` (1);
  `v=$(exit 3); echo $?` (3); `false; exit` (1, also with a trap); and `dash` for `$(trap)` (empty) and the pipeline (0).
  *(check on the lab VM: not done; the semantics are the shell's.)*
- bash displays the parent's trap text inside `( trap )` and `$(trap; true)` although it will not run it; the model
  follows POSIX (reset) and the tests check the reset, not that printout (SPEC.md, Out of scope).
- `node --test sims/lnx-subshell-trap/sim.test.js`: 38 tests. **Mutations:** 26 mutations of the model, one at a time
  (copy shared instead of copied, `cd` leaking to the parent, `exit` ending the main shell, status not reaching the
  parent, no trap reset, the `$(trap)` exception off or running the kept trap, the trap replacing the status, no trap
  on `exit`, `$?` inside the trap, `{ }` making a copy, lastpipe, `read` keeping `x`, a subshell's own trap not run,
  the trap without a step of its own, `exiting` not marked, ended boxes kept, the pipe read order, `changes()`, the
  trap and group flags, command substitution not captured, its status, `rm` doing nothing, bare `exit`): all fail a
  test except one equivalent (`exitStatus` from `main.status`, equal by then). Three survived at first (the pipe read
  order, an assignment's status from `$( … )`, bare `exit`); tests added. After the fresh review's fixes, the same set
  plus four more (copy starts with `$?` 0, pipeline status 0, `exit` in the loop not caught, nested copies not
  captured): all killed except the equivalent one.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against UL17, ran extra
  scripts against bash 5.2 and 22 mutations of its own, printed every caption in both languages). It found no
  disagreement with bash in the five presets. Fixed from it: output inside `$( … )` escaping the capture when it came
  from the substitution's own trap, a nested copy or a pipeline (and a pipeline inside `$( … )` taking steps of its
  own); `exit` in a pipeline loop body throwing; a pipeline with no input leaving its second member open; `cTrapSet`
  saying the trap runs "however it exits" (POSIX: on a normal exit; may on a default-action signal; never on
  SIGKILL), now "also when it exits with exit before the end of its code"; `cCdGroup` claimed for `{ }` inside a
  subshell; the trap step's caption building `exit N` from the status (wrong for a bare `exit`); the reset trap not
  put into words when a subshell starts (now `cEnteredReset`); the pipeline shown in turn without saying members run
  at the same time; "ispisuje u podljusci" / "uzima a" read ambiguously (now "ispisuje: …", "uzima redak …").
  Tests added for its 16 surviving mutations: the copy's `$?`, nested copies, names not leaking back, bare `exit` in a
  subshell, the ended box's status vs its trap's, resets in pipeline members and nested copies and after setting
  one's own trap, assignment and `exit` in `{ }`, the loop's status, multi-line capture, `$?` in a subshell's trap,
  the `$( )` box gone at the next step, `entered` for `( )`, the subshell trap's span. Not changed: the English
  caller line `echo "exit status: $?"` follows the page language, as in `lnx-exit-status` (it is the lecturer's own
  command line, not the script's output). Its "NOTES.md is missing" was written before this file existed.
- `npm run gate -- lnx-subshell-trap`: pass (manifest, tests, build, 64 browser checks, tokens, scope). Screenshots at 1920×1080 light, dark,
  grayscale and 375×812, hr and en, reviewed, plus every step of every preset in Croatian and key steps in English
  with a local Playwright script. Fixed from them: a placeholder used twice in one caption (the first copy vanished),
  the slashed hook shown for "no trap ever set" (now only for a reset trap), the pipe disappearing once the first
  member ended, pipeline members wrapping side by side (now stacked with the pipe between them).

## Term pairs

From the glossary (explanation): *subshell*, *command substitution*, *pipeline*, *exit status*. Missing, written out
in both tables (`"src": "simdeck"` if the coordinator adds them, Croatian from UL ch17):

- *execution environment* — **izvršno okruženje**
- *trap* (shell, `trap … EXIT`) — **hvatanje** (the glossary's "trap" entries are the CPU's, from ossimulator)
- *temporary directory* — **privremeni direktorij** (used as a label, not as a marked term)

## Shared requests

None.

## Time

Start 2026-11-12 21:22, done 2026-11-12 21:45 (CET), one session, including the fresh review and its fixes (23 minutes of wall time by the machine clock).
