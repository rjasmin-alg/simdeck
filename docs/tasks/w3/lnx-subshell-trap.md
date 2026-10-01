# lnx-subshell-trap: Subshells and traps

| | |
|---|---|
| Task | `lnx-subshell-trap` (wave 3, Linux) |
| Catalogue entry | `lnx-subshell-trap` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-subshell-trap/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `shell` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-shell-quoting` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **a cd in a subshell doesn't stick; cleanup on EXIT**.

The student: run scripts with and without subshells.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-shell-quoting/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/17-skripte-s-parametrima.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-17/`
- Catalogue seed: UL ch17 (podljuska-i-trap.svg)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/17-skripte-s-parametrima.md`, section "Skripta koja smije raditi bez nadzora" (`trap … EXIT` with `mktemp -d` in `ciscenje.sh`, exit status 3; `ciscenje2.sh` with `( echo "u podljusci"; exit 1 )`; definition *podljuska*; trap reset on entering a subshell) and Primjer 1 ("Od posla do skripte"); figure `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-17/podljuska-i-trap.svg`
- POSIX (Base Specifications Issue 8) XCU chapter 2 "Shell Command Language": `trap`, shell execution environment, `exit`, as cited in ch17; bash(1) (`lastpipe`, subshell traps) for the derived presets (check)

## Model and presets

- **Reuses from `lnx-shell-quoting`:** its line-by-line stepping through what the shell does before a command runs, and its script/line view. New here: execution environments: the main shell's environment (cwd, variables, traps, `$?`) and the copies a subshell gets.
- **Scene:** left, the script listing with the current line marked; middle, environment boxes stacked like the book's figure `podljuska-i-trap.svg`: the main script's box (cwd, variables, `trap` table, last `$?`), and a nested box that appears for `( … )`, `$( … )` or a pipeline member, starting as a copy and vanishing when it ends; right, the terminal output and the final `izlazni status`.
- **State:** `{ lines, pc, envs: [{ id, kind: 'main'|'subshell', cwd, vars, traps: { EXIT }, status }], out: [lines], exitStatus: null|number }`.
- **One step:** execute one line or one command of a line. Entering `(`: push a copy of the current environment with traps reset (rule 3). Leaving `)`: pop it; its last status becomes `$?` in the parent. `exit N`: ends the innermost environment; if that is the main one, run its EXIT trap, then finish with N.
- **Rules:**
  1. A subshell is a separate execution environment, a copy of the parent's; changes inside it (`cd`, variable assignment, `umask`) do not reach the parent. (ch17 definition *podljuska*; POSIX XCU 2.13 "Shell Execution Environment", check section number)
  2. `exit` inside `( … )` ends only the subshell; its status arrives in the parent as `$?` and the script continues. (ch17 `ciscenje2.sh`)
  3. On entering a subshell, traps that are not ignored are reset to their defaults (except a command substitution containing only `trap`); a trap set in the main script does not run when the subshell exits. (ch17; POSIX `trap`)
  4. `trap '…' EXIT` runs when the shell exits, also by `exit N` before the end of the code, and the exit status stays N. (ch17 `ciscenje.sh`: status 3)
  5. `{ …; }` runs in the current shell: a `cd` there sticks. (POSIX XCU 2.9.4 compound commands, check)
  6. Command substitution `$( … )` and pipeline members run in subshells: a variable set inside `… | while read …` is lost after the loop in bash's default mode. (ch17 on `set -e` exceptions; bash(1) `lastpipe`, check)
  7. A trap set inside the subshell belongs to it and runs when the subshell exits. (bash(1), check)
  8. Tie-break: when the main shell exits, its EXIT trap runs once, after the last line's output and before the status is returned.
- **Params:** none beyond presets; `showCopy` toggle (show the copied environment values in the nested box), default on.
- **Presets:**
  - `book-ciscenje` — `ciscenje.sh` (`mktemp -d`, `trap 'echo "trap: brisem $rad"; rm -rf "$rad"' EXIT`, …, `exit 3`): output `radim u: /tmp/vjezba17.YHRD9D`, the path, `sada namjerno prekidam`, `trap: brisem /tmp/vjezba17.YHRD9D`; status 3; the directory is gone. From ch17.
  - `book-ciscenje2` — `ciscenje2.sh`: `u podljusci`, `podljuska je zavrsila sa: 1`, `trap u glavnoj skripti` (once, at the end); status 0. From ch17.
  - `cd-in-subshell` — `cd /tmp; (cd /etc; pwd); pwd` prints `/etc` then `/tmp`; `{ cd /etc; }; pwd` prints `/etc`. Derived, unchecked.
  - `pipe-loses-var` — `n=0; printf 'a\nb\n' | while read x; do n=$((n+1)); done; echo $n` prints `0`. Derived from bash(1), check.
  - `trap-in-subshell` — `( trap 'echo unutra' EXIT; exit 1 ); echo $?` prints `unutra` then `1`. Derived, check.
- **Steps:** one per executed line: `book-ciscenje` 7, `book-ciscenje2` 5, `cd-in-subshell` 6, `pipe-loses-var` 5, `trap-in-subshell` 4.
- **Legend:** main environment (solid frame), subshell (dashed frame, "kopija"), value changed in this environment (highlight), trap set (hook icon) / reset to default (slashed hook), output line (terminal), exit (door icon with status). "Changed" marks the environment values changed by this step and the box created or removed.
- **Captions:**
  - HR: „Naredba `exit 1` stoji u zagradama, pa završava podljusku, a ne skriptu. Status stiže kao `$?`, a hvatanje iz glavne skripte ovdje se nije izvršilo.“
  - EN: "`exit 1` is inside the parentheses, so it ends the subshell, not the script. The status arrives as `$?`, and the main script's trap did not run here."
- **Terms:** subshell — podljuska; execution environment — izvršno okruženje; trap — hvatanje (*trap*); exit status — izlazni status; command substitution — zamjena naredbe; pipeline — cjevovod; temporary directory — privremeni direktorij.
- **Misconceptions:** `cd` in a script or in parentheses changes the caller's directory; `exit` always ends the script; a trap set at the top protects every part of the script.
- **Out of scope:** `set -e` exceptions in full (`lnx-exit-status`), `source`/`.`, signals other than EXIT (`lnx-signals`), `mktemp` security (named, as in ch17).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-subshell-trap sims/lnx-subshell-trap` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-subshell-trap/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
