# lnx-pipes-redirection: Pipes and the three streams

| | |
|---|---|
| Task | `lnx-pipes-redirection` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-pipes-redirection` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-pipes-redirection/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `shell` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **stdin/stdout/stderr, > vs 2>&1 order, pipes**.

The student: build a command line, see where each stream goes.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/06-cjevovodi-obrada-teksta.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-06/`
- UL ch06 section "Tokovi, preusmjeravanje i cjevovodi" → "Što treba znati" (`>`, `>>`, `<`, `2>`, `2>&1` worked lines with `cat /nema-me`) and "Šire o temi" (pipe capacity, exit status of a pipeline); diagrams `cjevovod-i-tri-toka.svg` and `tri-preusmjeravanja.svg` in `assets/diagrams/chapter-06/`
- POSIX.1-2024 XCU §2.7 Redirection (§2.7.1, §2.7.2, §2.7.3, §2.7.6) and §2.9.2 Pipelines (as cited in UL ch06 footnotes ch6-redir-out, ch6-dup, ch6-pipeline)
- GNU Bash Reference Manual §3.2.3 Pipelines (pipe before redirections, `|&`) and §3.6 Redirections (order example)
- Catalogue seed: UL ch06 (cjevovod-i-tri-toka.svg) → §5.14

## Overlaps (catalogue §5)

- **§5.14 Pipelines:** Separate pages; the PowerShell page is built as a comparison against the bash one.

## Model and presets

- **Scene:** one command line typed across the top (tokens: commands, `|`, redirections; the token being applied is lit). Below it one box per process (1–2 boxes) with three numbered ports 0, 1, 2. On the right the targets: the terminal (a screen with lines), files (`~/samo1.txt`, `~/greska.txt`, `~/sve.txt`) with their contents, and a pipe drawn as a tube between two boxes. A wire runs from each port to its current target, labelled with the fd number (as in `cjevovod-i-tri-toka.svg`).
- **State:** `{ procs: [{ id, cmd, fds: { "0": target, "1": target, "2": target } }], pipes: [{ id, from, to, buffer: [] }], files: { name: { lines: [], created } }, terminal: [lines], phase, cursor, error: null | code }`. A target is `"tty"`, `"file:<name>"`, `"pipe:<id>:w"` or `"pipe:<id>:r"`.
- **One step:** the shell applies one thing, in this fixed order: (1) the starting fd table of every process; (2) every `|`, left to right; (3) each command's redirections, left to right, one per step; (4) running: one output line per step, written to whatever the fd points to at that moment (stdout lines first, then stderr, per process, left to right); (5) the last step shows the final terminal and file contents.
- **Rules:**
  1. Every process starts with fd 0, 1, 2 open and inherited from the shell, all on the terminal. Source: UL ch06 "Tokovi, preusmjeravanje i cjevovodi" (definicije standardni ulaz/izlaz/greška, datotečni deskriptor); POSIX `<unistd.h>` STDIN_FILENO=0, STDOUT_FILENO=1, STDERR_FILENO=2.
  2. `a | b`: a's fd 1 goes to the pipe's write end, b's fd 0 to its read end. fd 2 of both stays where it was: the pipe carries only fd 1. Source: UL ch06 (definicija cjevovod, `cjevovod-i-tri-toka.svg`); POSIX XCU §2.9.2 Pipelines; Bash Reference Manual §3.2.3 Pipelines.
  3. The pipe is connected **before** the command's own redirections, so `a 2>&1 | b` sends a's stderr into the pipe. Source: Bash Reference Manual §3.2.3 Pipelines ("This connection is performed before any redirections specified by the command"). `a |& b` is bash shorthand for `a 2>&1 | b` (same section).
  4. `> f` points fd 1 (or fd n in `n> f`) at f; f is created if missing and **truncated at open**, before the command runs. `>> f` appends. `< f` opens f on fd 0. Source: UL ch06 (`>`, `>>`, `<`, `2>`); POSIX XCU §2.7.1 Redirecting Input, §2.7.2 Redirecting Output, §2.7.3 Appending Redirected Output.
  5. `n>&m` makes fd n a **copy of fd m as it is at that moment**; later changes to m do not move n. If m is not open, it is a redirection error and the command does not run. Source: UL ch06 ("`2>&1` se čita kao rečenica o dva broja", `tri-preusmjeravanja.svg`); POSIX XCU §2.7.6 Duplicating an Output File Descriptor.
  6. Redirections are applied from left to right. So `> f 2>&1` sends both to f, while `2>&1 > f` sends stderr to the terminal (copied before fd 1 moved) and only stdout to f. Source: POSIX XCU §2.7 Redirection (order of evaluation from beginning to end); Bash Reference Manual §3.6 Redirections (the `ls > dirlist 2>&1` vs `ls 2>&1 > dirlist` example).
  7. Tie-break, the same fd redirected twice: the last one wins, but every file named on the line is still opened, so `> a > b` creates (and empties) `a` and writes to `b`. Source: POSIX §2.7.2 + rule 6 (derived) (check on the lab VM).
  8. The last command's fd 1 is never in a pipe: it ends where it would end without the pipeline (UL ch06, caption of `cjevovod-i-tri-toka.svg`).
- **Params:** `line` (select, the preset command lines; default `samo1`), `missing` (toggle, default on: the input file `/nema-me` does not exist, so `cat` writes one stderr line; off: it exists and `cat` writes its one line to stdout instead), `labels` (toggle, show fd numbers on wires, default on).
- **Presets:**
  1. `samo1` — `cat /nema-me > ~/samo1.txt`: message `cat: /nema-me: No such file or directory` on the terminal, `samo1.txt` empty (0 lines). From UL ch06, "Tokovi" (the four-command line).
  2. `greska` — `cat /nema-me 2> ~/greska.txt`: terminal empty, `greska.txt` holds the message. From UL ch06.
  3. `sve` — `cat /nema-me > ~/sve.txt 2>&1`: terminal empty, `sve.txt` holds the message. From UL ch06 and `tri-preusmjeravanja.svg`.
  4. `obrnuto` — `cat /nema-me 2>&1 > ~/sve.txt`: the message is on the terminal, `sve.txt` is empty. Rule 6 wins. Derived from POSIX §2.7 and the Bash manual example, unchecked on the lab VM.
  5. `cijev` — `cat /etc/hostname /nema-me | wc -l`: the terminal shows the error line and `1` (only stdout went through the pipe). Derived, unchecked.
  6. `cijev-2` — `cat /etc/hostname /nema-me 2>&1 | wc -l`: the terminal shows only `2`. Rule 3 wins. Derived, unchecked.
- **Steps:** 1 (start) + one per `|` + one per redirection + one per output line + 1 (final): samo1 4, greska 4, sve 5, obrnuto 5, cijev 6, cijev-2 7. With `missing` off the counts stay the same (the one line goes to stdout instead).
- **Legend:** three wire styles, one per fd (0 dotted, 1 solid, 2 dashed, plus the number on the wire); terminal, file and pipe icons; "changed" highlight = the wire that moved in this step and the token on the command line that moved it.
- **Captions:** hr: "`2>&1`: deskriptor 2 postaje kopija deskriptora 1 — a 1 sada vodi u `~/sve.txt`, pa i greška ide onamo." en: "`2>&1`: descriptor 2 becomes a copy of descriptor 1 — and 1 now points to `~/sve.txt`, so the error goes there too." hr: "Cijev nosi samo deskriptor 1; poruka o pogrešci ide mimo nje, ravno na zaslon." en: "The pipe carries only descriptor 1; the error message bypasses it and lands on the screen."
- **Terms:** standard input — standardni ulaz; standard output — standardni izlaz; standard error — standardna greška; file descriptor — datotečni deskriptor; redirection — preusmjeravanje; pipeline — cjevovod; pipe — cijev.
- **Misconceptions:** "`2>&1` means send errors to the same file whatever the order" (it copies fd 1 as it is now); "`>` captures everything a command prints" (it moves fd 1 only); "errors go through the pipe too".
- **Out of scope:** exit status of a pipeline and `pipefail` (→ `lnx-exit-status`), here-documents, `tee`, named pipes, pipe buffer size and blocking (UL ch06 Šire o temi, mention in the explanation only), process substitution, `&>`.
<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-pipes-redirection sims/lnx-pipes-redirection` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-pipes-redirection/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
