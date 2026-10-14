<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-pipes-redirection: specification

One concept: **stdin/stdout/stderr, `>` vs `2>&1` order, pipes.** The student picks a command line and steps
through what the shell does with it: which descriptor points where, in which order, and where each line of output
lands.

Task: `docs/tasks/w2/lnx-pipes-redirection.md`. Catalogue: `lnx-pipes-redirection` (`docs/catalogue.md` §4.4,
overlap §5.14). Class: stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[UL06]** `uvod-u-linux/book/chapters/06-cjevovodi-obrada-teksta.md`, "Tokovi, preusmjeravanje i cjevovodi",
  "Što treba znati": the three streams and their numbers (definitions *standardni ulaz/izlaz*, *standardna greška*,
  *datotečni deskriptor*); `>` creates or empties the file; `>>`; `<`; `cat /nema-me 2> ~/greska.txt`;
  `cat /nema-me > ~/samo1.txt` (the message on the screen, the file empty); `cat /nema-me > ~/sve.txt 2>&1`
  ("`2>&1` se čita kao rečenica o dva broja"); the pipeline definition (stdout of each command but the last to stdin
  of the next). "Šire o temi": pipe capacity and blocking, the exit status of a pipeline (explanation only / out of
  scope). The book's machine is `demosrv1`, which is the content of `/etc/hostname` here.
- **[UL06-fig]** `uvod-u-linux/assets/diagrams/chapter-06/cjevovod-i-tri-toka.svg` (only fd 1 goes through the pipe,
  fd 2 of both bypasses it, the last command's fd 1 ends on the screen; the numbers on the wires) and
  `tri-preusmjeravanja.svg` (`> f`, `2> f`, `> f 2>&1`). Used for the layout and the numbered wires; nothing copied.
- **[POSIX]** POSIX.1-2024 XCU §2.7 Redirection (applied from beginning to end), §2.7.1 Redirecting Input, §2.7.2
  Redirecting Output (created or truncated), §2.7.3 Appending, §2.7.6 Duplicating an Output File Descriptor (a copy;
  not an open descriptor → redirection error), §2.9.2 Pipelines; `<unistd.h>` `STDIN_FILENO` 0, `STDOUT_FILENO` 1,
  `STDERR_FILENO` 2. As cited in UL06's footnotes (ch6-redir-out, ch6-redir-in, ch6-dup, ch6-pipeline, ch6-fileno).
- **[Bash]** GNU Bash Reference Manual §3.2.3 Pipelines ("This connection is performed before any redirections
  specified by the command"; `|&` is shorthand for `2>&1 |`, its implicit redirection "performed after any
  redirections specified by the command") and §3.6 Redirections (`ls > dirlist 2>&1` vs `ls 2>&1 > dirlist`).
  *(check: quoted as the task file and UL06 cite them, not re-read for this task)*

## Scene

- **Command line** across the top: `$` and one token per command (its words), redirection and `|`. The token the
  current step applies is lit (`.sd-changed`); tokens already applied are underlined.
- **One box per process** (1 or 2): its command, its descriptor table (`0 ← zaslon`, `1 → ~/samo1.txt`,
  `2 → cijev, piše`), port dots on the edges (0 on the left, 1 and 2 on the right), and a status (waits for the
  shell, writes, finished, not started; how many lines it read).
- **Targets**: the screen (below, full width), the files the line names (right; dashed while they do not exist), and
  the pipe between two boxes (a tube with its write end left, read end right, and the lines waiting in it).
- **Wires**: one per open descriptor, from port to target (fd 0: from the source into the port), in the descriptor's
  colour and line style (0 dotted, 1 solid, 2 dashed) with its number in a circle (the `labels` param). A wire moved
  in this step is thicker with a highlighter halo; its row in the table is highlighted too.
- **Lines of text** (on the screen, in a file, in the pipe) each carry the badge of the descriptor that wrote them,
  and the line written in this step is highlighted.

## State

```
{ phase: 'typed' | 'start' | 'pipe' | 'redir' | 'run' | 'done',
  cursor: token id lit in this step ('c<i>' command, 'r<i>-<k>' redirection, 'p<i>' pipe) | null,
  changed: ['<proc>:<fd>', …]   // wires moved in this step
  opened: file name opened in this step (by >, >> or <) | null,
  wrote: { proc, fd, text, target, lost } | null,   // the line written in this step
  error: null | { code: 'bad-fd', proc, fd } | { code: 'no-file', proc, file },   // stays once set
  procs: [{ id, cmd, fds: { '0', '1', '2' }, ran, failed, read }],
  pipes: [{ id, from, to, buffer: [line], read }],
  files: { name: { lines: [line], created } },
  terminal: [line] }
line = { text, fd (the descriptor that wrote it; 0 for content that was there before), proc }
target = 'tty' | 'file:<name>' | 'pipe:<id>:w' | 'pipe:<id>:r' | null (not open yet)
```

The model takes the command line as text in a small language (words, `|`, `|&`, `[n]>`, `[n]>>`, `[n]<`, `[n]>&m`;
the target may follow as the next word) and knows three programs: `cat` (its files to fd 1 in order, a missing one as
`cat: <f>: No such file or directory` on fd 2; no files: fd 0 to fd 1), `wc -l` (the number of lines on fd 0) and
`echo` (its words on fd 1, used by tests only). A redirection without a target (`cat >`) or a `>&` whose target is not a
number (`2>&-`) is not part of the language: `parse` throws. The page offers only the six preset lines.

## Steps

Step 0 is the line typed, nothing applied (`typed`, every fd `null`). Then one thing per step, in this fixed order:

1. `start`: every process gets fd 0, 1, 2, all on the terminal (all six or three wires marked changed).
2. `pipe`: every `|`, left to right.
3. `redir`: each command's redirections, left to right, one per step; commands left to right. `|&` adds a `2>&1`
   after the command's own redirections, lit on the `|&` token.
4. `run`: one output line per step, written to whatever the fd points to at that moment. Processes left to right;
   within a process, stdout lines first, then stderr lines. A process reads its fd 0 when it writes its first line,
   by which time every process to its left has written everything.
5. `done`: the final picture; the caption counts the lines on the screen and in each file and says what the preset
   shows.

Steps = 1 + pipes + redirections + output lines + 1.

## Rules

| # | Rule | Source | Test |
|---|---|---|---|
| 1 | Every process starts with fd 0, 1, 2 open and inherited from the shell, all on the terminal. | UL06 (definitions), POSIX `<unistd.h>` | `rule 1` |
| 2 | `a \| b`: a's fd 1 → the pipe's write end, b's fd 0 → its read end. fd 2 of both stays. The pipe carries only fd 1. | UL06, UL06-fig, POSIX §2.9.2, Bash §3.2.3 | `rule 2` ×2 |
| 3 | The pipe is connected **before** the command's own redirections, so `a 2>&1 \| b` sends a's stderr into the pipe. `a \|& b` = `a 2>&1 \| b`, the `2>&1` after a's own redirections. | Bash §3.2.3 | `rule 3` ×2 |
| 4 | `> f` points fd 1 (or fd n in `n> f`) at f; f is created if missing and **emptied at open**, before the command runs. `>> f` appends (creates if missing). `< f` opens f on fd 0; a missing f is a redirection error. | UL06, POSIX §2.7.1–2.7.3 | `rule 4` ×3 |
| 5 | `n>&m` makes fd n a **copy of fd m as it is at that moment**; later changes to m do not move n. If m is not open, it is a redirection error: the command does not run, and its remaining redirections are not applied. | UL06, UL06-fig, POSIX §2.7.6 | `rule 5` ×2 |
| 6 | Redirections are applied from left to right: `> f 2>&1` sends both to f; `2>&1 > f` sends stderr to the terminal and only stdout to f. | POSIX §2.7, Bash §3.6 | tie-break `rule 6` |
| 7 | Tie-break, the same fd redirected twice: the last wins, but every file named is still opened (created, emptied): `> a > b` empties `a` and writes to `b`. | POSIX §2.7.2 + rule 6 (derived) | tie-break `rule 7` |
| 8 | The last command's fd 1 is never in a pipe: it ends where it would end without the pipeline. | UL06-fig caption | `rule 8` |
| 9 | Step order (above): stdout lines before stderr lines within a process; processes left to right. A line goes where its fd points when it is written. | task, "One step" | tie-breaks `step order` ×2, `step order`, `a written line` |

## Presets and expected numbers

`missing` on (default): `/nema-me` does not exist. Off: it exists and holds one line (`demo`), which `cat` writes on
stdout instead of the error; the step counts stay the same.

| Preset (`line`) | Command line | Steps | Screen at the end | Files at the end | Source |
|---|---|---|---|---|---|
| `samo1` | `cat /nema-me > ~/samo1.txt` | 4 | the message | `samo1.txt` 0 lines | UL06 |
| `greska` | `cat /nema-me 2> ~/greska.txt` | 4 | nothing | `greska.txt` the message | UL06 |
| `sve` | `cat /nema-me > ~/sve.txt 2>&1` | 5 | nothing | `sve.txt` the message | UL06, fig |
| `obrnuto` | `cat /nema-me 2>&1 > ~/sve.txt` | 5 | the message | `sve.txt` 0 lines | derived (POSIX §2.7, Bash §3.6) |
| `cijev` | `cat /etc/hostname /nema-me \| wc -l` | 6 | the message, `1` | – | derived |
| `cijev-2` | `cat /etc/hostname /nema-me 2>&1 \| wc -l` | 7 | `2` | – | derived |

With `missing` off: `samo1` file `demo`, screen empty; `greska` screen `demo`, file empty; `sve` and `obrnuto` file
`demo`; `cijev` and `cijev-2` screen `2`.

**Checked** (2026-10-14) with bash 5.2.21 on a Linux machine (not the lab VM), `/etc/hostname` one line, `/nema-me`
absent: all six presets give exactly the screen and file contents above, `> ~/a > ~/b` leaves `a` empty (it held
`old`) and `b` empty with the message on the screen, `|&` gives `2`, and `2>&3` prints the shell's "Bad file
descriptor" and does not run `cat`. The model's numbers were printed by a script before the page was written and are
asserted in `sim.test.js`.

## Simplifications

- **One process writes everything, then the next reads.** Real pipelines run concurrently and the pipe is a buffer of
  finite size (UL06 "Šire o temi"); the explanation says so, the model does not show blocking.
- **stdout before stderr** within a process (task's step order). With `cat /nema-me /etc/hostname` a real `cat` writes
  the error first; on the screen the order would differ, nowhere else (no preset has it).
- **A redirection error** stops the command; the model does not print the shell's own error message (no preset has
  it; tested in the model only).
- **The terminal as fd 0** gives no input (nothing is typed); no preset reads from it. On the page fd 0 on the terminal
  reads "keyboard", fd 1 and 2 "screen": the terminal box is both.
- **One file opened twice** (`> f 2> f`) has one shared list of lines in the model, so both lines end up in it; in a
  shell the two opens have separate offsets and the second write overwrites the first. No preset does this (`> f 2>&1`
  is the one that shares an open file, and it is modelled right).
- **A write to a descriptor not open for writing** (a pipe's read end, `wc -l 1>&0` after a `|`) is lost; a real program
  would report a write error on fd 2.
- **The exit status** of the pipeline, `pipefail`, here-documents, `tee`, named pipes, process substitution and `&>`
  are out of scope (task).
