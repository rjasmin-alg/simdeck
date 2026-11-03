<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-exit-status: notes

New stepper (task `docs/tasks/w3/lnx-exit-status.md`, catalogue `lnx-exit-status`, wave 3). No kit view fits (K1–K4
are sequence, topology, rule table, block grid), so the page draws its stage in HTML. Rules and expected numbers:
`SPEC.md`.

## Decisions

- **Scripts are data, not parsed text.** Each preset is a list of numbered lines; a line is a list of pipelines joined
  by `&&`/`||`, a pipeline a row of commands with a fixed result (status, output, a file or mail they produce).
  `logic.build` exposes the same helpers, so the tests write their own scripts (`a && b`, `! p`, `exit n`, an `if`
  with a body) and every rule is tested on the code the presets use.
- **State as frames.** `framesOf(script, opts)` computes every step once (memoised on script and switches);
  `step(s, n, p)` returns a copy of frame n. The switches are not `resets`, so toggling one keeps the step and the
  replay shows where the script now is (or where it stopped; the kit clamps n when the script got shorter).
- **The `set` lines are the switches.** A script's own `set -e` / `set -o pipefail` line is struck through ("off by
  the switch") when its switch is off; a switch that is on with no line of its own adds an unnumbered `+ set …` line
  after the shebang. They are not steps (SPEC.md, One step).
- **A final step: the caller reads `$?`.** The terminal starts with the book's own command line,
  `$ ./erre.sh; echo "izlazni status: $?"`, and the end step prints `izlazni status: 1` under the script's output,
  as the book shows it. The echo text follows the page language (`callerSays`).
- **Status badges:** 0 filled in the ok colour with a check, non-zero hollow with a danger border and the number;
  shape and the check carry it in grayscale. A failure `set -e` does not look at is hatched with its reason
  (condition, not the last, pipeline member, starts with `!`), shown only while `set -e` is on. "Decided this
  step" (kit highlight) marks the statuses the `&&`/`||` gates looked at and the status `set -e` checked.
- **The dump's status is unknown** in the sources (the log shows the error, not the number): the model uses
  `NZ = -1` (any non-zero) and the page shows **≠0** with the tooltip "exact number unknown"; the end caption says
  `$? ≠ 0`. *(check: the real status of the dump program on a quota error.)*
- **Preset order** erre, and-or, erre-pipefail, nightly (keys 1–4). The gate's deep-link check opens the second
  preset at step 3, and erre-pipefail has 2 steps; and-or second is also a sensible teaching order (the exceptions,
  then the operators, then pipefail, then the real job).
- **Preset entries** in `sim.json` for erre-pipefail, nightly and and-or. The nightly entry is the one catalogue §5.3
  wants linked to the restore drill: `sto-restore-drill` does not exist yet, so `related` names only
  `lnx-pipes-redirection`; add `sto-restore-drill` to `related` when it lands.
- **Reuse of `lnx-pipes-redirection`:** the pipeline structure (members side by side, fd 1 into the pipe, fd 2 to the
  terminal) and its look (fd badges with a solid border for 1, dashed for 2, the pipe as a rounded tube showing what
  went through it). No code was copied: that model is a descriptor-table machine this sim does not need, and
  `models/` has no shared model yet. Nothing to promote from here either (no task names this sim as a dependency).

## Deviations from the task

- **Step counts** follow one rule for all presets (one step per line run, an `if` with a same-line branch two, plus
  the caller's step): erre **8** (task 7), erre-pipefail 2, nightly 6, nightly with both switches **4** (task 3),
  and-or **4** (task 3). The task's own counts mix "with an end step" (erre-pipefail 2, nightly 6) and "without"
  (erre 7, and-or 3); one rule is easier to follow in class. All ≤ 10.
- **Product names removed (COMMON.md §1, concepts not tools).** The estate script's `p4d` is `repodb` (its `-jj` and
  `-jd -` are `rotate-journal` and `dump -`, its error message is `repodb: database write error` and
  `write: /srv/repo/rev.db: Disk quota exceeded`), its paths are
  `/srv/repo`, `/srv/ckp`, `/srv/logs`, the mail subject "Nightly OK" (estate: "Perforce nightly OK"), the recipient
  `it-alerts`. The preset id is `nightly` (task: `p4-nightly`), its file `/usr/local/bin/nightly.sh`. `export` lines,
  the `cd` and the comments are left out of the listing (they do not change any status). The error lines, the date
  (Sunday 2026-10-11), the quota error and the file sizes (1 214 000 B that day, 131 945 690 300 B the week before, from the student
  file `configs/colo/p4-commit/checkpoints-ls.txt`) are kept.
- **and-or preset** is a script `./and-or.sh` with the task's three lines; `mkdir`/`cd` both succeed, so `exit` is
  skipped (the `cd` fails case is in the tests).
- **Task caption 1 in Croatian** anchors both commands on "naredba" ("Naredba `nema_ove_naredbe` vratila je 127, ali …
  — naredba `cat` je uspjela, pa set -e ne vidi ništa."): the task's wording mixes feminine and masculine for the
  two commands, which reads wrong once the same caption names `repodb dump -` and `gzip -1`. Task caption 2 adds the
  status in parentheses ("…koja je doista pala (127); …"). English as written in the task, plus the status.
- **`exit` inside a multi-command pipeline** does not end the script (bash runs each member in a subshell); no
  preset has one (SPEC.md, Simplifications).

## Sources

- `uvod-u-linux/book/chapters/17-skripte-s-parametrima.md`, "Skripta koja smije raditi bez nadzora" → "Što treba
  znati": `set -e` and its three exceptions (as the norm states them), `erre.sh` (4 lines, `command not found`, status 1)
  and `erre-pipefail.sh` (127), the `help set` text for `pipefail` (bash 5.2.26); "Primjer 3" (the three channels:
  status, stderr, log), the error-handling definition.
- UL ch16 "Prva skripta: tumačski redak, izvršnost i izlazni status" and "Grananje i petlje" (`&&`, 126/127, `if`
  reads the status) and ch06 "Šire o temi" (pipeline status = last command) *(check: cited as the task gives them; the
  numbers were checked in bash instead)*. Diagram `assets/diagrams/chapter-16/izlazni-status-spaja.svg`: not copied.
- POSIX.1-2024 XCU §2.8.2, §2.9.3 (AND and OR lists), §2.9.4.2 (`if` with no branch returns 0), §2.15 `set -e`
  *(check: as cited by the book and the task, not re-read)*.
- `dr-lecture-estate` student files: `configs/colo/p4-commit/usr/local/bin/p4-nightly.sh`,
  `logs/p4-commit/p4-nightly.log` (2026-10-11), `configs/colo/p4-commit/checkpoints-ls.txt`. Instructor caveat CV-32
  informed the model only; its text is not on the page. As the task notes, CV-32's root-cause line has
  `… && mail OK`, but the script mails unconditionally; the preset follows the script.

## Checks

- **bash 5.2.21** (on this Linux machine): `erre.sh` with all four switch settings (1; 0 with line 10; 127 at line 7;
  0 with pipefail only), `erre-pipefail.sh`, `if false; then …; fi` (`$?` 0, `PIPESTATUS` 1), `false || echo b`
  (`PIPESTATUS` 0), `nema | cat` (127 0), `set -e; true && false` (exits 1), `false && true` (goes on), an `if` body
  ending in `false && true` (goes on, `if` returns 1), `{ false && true; }` (goes on), `! true` (1, goes on),
  `false | (exit 3) | true` with pipefail (3, `PIPESTATUS` 1 3 0), `! (exit 2) | true` (0), the and-or lines with and
  without `set -e`, `cd /nonexist && … || exit` (1), and the nightly script with stub functions for the four switch
  settings (OK mail in three, none with both; the checkpoint file written in all four). The model gives the same in
  every case. *(check on the lab VM: not done; the semantics are the shell's.)*
- Rule tests broken on purpose, one mutation at a time (37: `&&`/`||` inverted, a skipped pipeline resetting the
  status, the pipeline taking its first member, pipefail taking the first failure or ignored, `!` ignored, `set -e`
  ignoring "last of the list", acting in a condition, on a `!` pipeline, never, always, `if` returning the condition,
  stderr setting the status, `exit` ignoring `$?` or ignored, the stop or end status wrong, no end step, a same-line
  branch not run, a body run on a false condition, the member exemption on the status source, pipe output on the
  terminal, `cat` ignoring its input, `PIPESTATUS` inverted by `!`, the listing's added and struck lines, mail and
  file not written, the condition exemption; from the review: `&&`/`||` testing 1 instead of non-zero, a same-line
  branch treated as a condition, `exit` not stopping the rest of its list, the `!` exemption dropped, the stderr
  count, the line badge written before `exit`): **all 37 fail a test**.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page; compared every preset
  under all four switch settings and about a dozen edge cases with bash 5.2.21 — all matched; ran its own mutations;
  printed every caption in both languages). Fixed from it: the line badge showing the status before `exit` (now the
  exit status), `exit` in a pipeline member ending the script, five test gaps (above), Croatian gender and wording
  ("naredba …", "nijedna iznimka ne vrijedi", "ne provjerava nikakav status", "izlaz pri grešci", the legend's
  "status koji je odlučio korak"), the explanation's terms in the wrong case or starting a sentence, English "is 1.2
  MB", "stays on disk", the pipefail stop caption without its number, and the dump's flags and error message, which
  were still the product's own. Kept: every `&&`/`||` gate's looked-at status carries the highlight, since each of them
  decided whether its right side ran; the nightly preset as the task orders it (see the report: the owner may want to
  confirm it against the DR scenarios).
- `npm run gate -- lnx-exit-status`: pass. Screenshots 1920×1080 light, dark, grayscale and 375×812, hr and en,
  reviewed, plus every preset at its key steps with a local Playwright script. Fixed from them: listing rows and
  terminal lines overlapping under the highlight, the hatch hidden by the box background, file names in the script
  choice failing the language check, a caption saying the pipeline rule twice, pipeline members wrapping under the pipe.

## Term pairs

From the glossary: *exit status*, *standard error*, *pipeline*, *error handling*. Written out in both tables, missing
from `kit/glossary.js` (`"src": "simdeck"`):

- *condition* — **uvjet** (UL ch16)
- *AND list* / *OR list* — **`&&`-popis** / **`||`-popis** (UL ch16/ch17; the page says "popis" and "list")

## Shared requests

None.

## Time

Start 2026-11-03 16:40, done 17:05 (CET): about 25 minutes, one session, including the fresh review.
