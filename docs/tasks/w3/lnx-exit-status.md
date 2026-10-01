# lnx-exit-status: Exit status and &&, ||, set -e, pipefail

| | |
|---|---|
| Task | `lnx-exit-status` (wave 3, Linux) |
| Catalogue entry | `lnx-exit-status` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-exit-status/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL, DR |
| Topic / tags / level | `linux-admin` / `shell` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-pipes-redirection` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **how failure propagates, and a pipeline that reports success while failing**.

The student: run chains where one step fails.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-pipes-redirection/` (the model this one builds on) and its `NOTES.md`.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/17-skripte-s-parametrima.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-17/`
- UL ch17 section "Skripta koja smije raditi bez nadzora" → "Što treba znati" (`set -e` and its three exceptions, scripts `erre.sh` and `erre-pipefail.sh`, `help set` text for `pipefail`); "Primjer 3 — Isti neuspjeh kroz tri kanala, i cijena svakoga koji nedostaje"
- UL ch16 "Prva skripta: tumačski redak, izvršnost i izlazni status" and "Grananje i petlje" (`&&`, 126/127, `if` reads the status); diagram `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-16/izlazni-status-spaja.svg` (it is in chapter-16, not chapter-17)
- UL ch06 "Tokovi, preusmjeravanje i cjevovodi" → "Šire o temi" (pipeline status = last command)
- POSIX.1-2024 XCU §2.8.2 Exit Status for Commands, §2.9.3 Lists, §2.15 `set` (`-e`)
- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S8.md` (DR estate scenario; lists the case only indirectly)
- `/home/rjasmin/projects/dr-lecture-estate/instructor/caveats.md` CV-32 "The checkpoint cron pipeline has no pipefail and reports success regardless"; evidence `student/configs/colo/p4-commit/usr/local/bin/p4-nightly.sh` and `student/logs/p4-commit/p4-nightly.log` (entry 2026-10-11)
- Catalogue seed: UL ch17 (izlazni-status-spaja.svg, actually UL ch16), DR S8 → §5.3

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Model and presets

- **Scene:** left, the script as a numbered listing with a line pointer; each executed line gets a status badge (`0` or the number). Middle, the current line drawn as command boxes: pipeline members side by side joined by `|` (reused from `lnx-pipes-redirection`), `&&`/`||` as gates between them, each box with its own status. Right: the `$?` register, the per-member statuses (`PIPESTATUS`, labelled as bash-only), two switches `set -e` and `pipefail` shown as lamps, the terminal (stdout and stderr lines), and for the DR preset a mailbox and the checkpoint file with its size.
- **Reuse from `lnx-pipes-redirection`:** the pipeline structure (members, fd 1 into the pipe, fd 2 to the terminal) and its drawing. New here: per-command exit status, the list operators, `set -e` and `pipefail`.
- **State:** `{ script: [lines], pc, opts: { errexit, pipefail }, lastStatus, pipeStatus: [n], out: [{ fd, text }], files: { name: { bytes } }, mail: [subjects], exited: null | status, lastEvent }`.
- **One step:** one script line runs to completion, in this order: (1) each pipeline member gets its status; (2) the pipeline's status is computed (rule 3); (3) the `&&`/`||` chain decides what else on the line runs (rule 2); (4) `$?` is set; (5) `set -e` checks whether to stop (rule 4). An `if`/`while` line is one step for the condition and one for the branch taken.
- **Rules:**
  1. Every command leaves an exit status: 0 is success, anything else failure; 127 = command not found, 126 = found but not executable. Source: UL ch16 "Prva skripta: tumačski redak, izvršnost i izlazni status"; POSIX XCU §2.8.2 Exit Status for Commands.
  2. `a && b` runs `b` only if `a` returned 0; `a || b` runs `b` only if `a` returned non-zero. The operators have equal precedence and group left to right; the list's status is that of the last command that ran. Tie-break: `a && b || c` is not if/else: `c` also runs when `a` succeeds and `b` fails. Source: UL ch16 (`&&`, footnote ch16-and-lista); POSIX §2.9.3 Lists (AND Lists, OR Lists).
  3. A pipeline's status is the status of its **last** command, unless `pipefail` is on: then it is the status of the last (rightmost) command that failed, or 0 if none did. `!` before a pipeline inverts it. Source: UL ch06 "Šire o temi" (footnote ch6-pipe-status); UL ch17 "Skripta koja smije raditi bez nadzora" (`help set` text for `pipefail`, bash 5.2.26).
  4. With `set -e` the shell exits as soon as a command fails, **except**: (a) a failing member of a multi-command pipeline (only the pipeline's own status counts), (b) the condition of `if`/`elif`/`while`/`until`, a pipeline starting with `!`, and every command of an `&&`/`||` list except the last, (c) a compound command whose failure came from inside such an ignored context. Source: UL ch17 "Skripta koja smije raditi bez nadzora" (the three exceptions); POSIX XCU §2.15 Special Built-In Utilities, `set -e`.
  5. A script's exit status is that of its last command, or the `n` of `exit n`; under `set -e` it is the status of the command that stopped it. Source: UL ch17 (`erre.sh` ends with 1, `erre-pipefail.sh` with 127).
  6. Tie-break, stderr vs status: a message on stderr does not change the status, and a status does not print anything (UL ch17 Primjer 3, "tri kanala").
- **Params:** `preset` script (select), `errexit` (toggle `set -e`, default per preset), `pipefail` (toggle, default per preset). Toggles act live at the current step: the replay shows where the script would now have stopped.
- **Presets:**
  1. `erre` — UL ch17 `erre.sh` (`set -e`; `if false`; `false || echo`; `nema_ove_naredbe | cat`; `false`): lines "1 pocetak" to "4 cjevovod nije pao…" print, `command not found` on stderr, the script stops at line 9, final status 1. From UL ch17.
  2. `erre-pipefail` — UL ch17 `erre-pipefail.sh`: the pipeline now returns 127, `set -e` stops at line 4, the `echo` is not reached, final status 127. From UL ch17.
  3. `p4-nightly` — the DR estate script: `p4d … -jj` (0), then on Sunday `p4d -jd - | gzip -1 > checkpoint.YYYYMMDD.gz`; `p4d` fails ("Database write error on db.rev! … Disk quota exceeded"), `gzip` returns 0, so the pipeline returns 0; `find … -delete` (0); the mail "Perforce nightly OK" is sent. The checkpoint file exists but is truncated. With `pipefail` + `errexit` on: the script stops at the checkpoint line, no OK mail, status = p4d's non-zero status (exact value unknown: show "≠0" (check)). From `dr-lecture-estate` student files `configs/colo/p4-commit/usr/local/bin/p4-nightly.sh` and `logs/p4-commit/p4-nightly.log` (2026-10-11), instructor caveat CV-32.
  4. `and-or` — `true && false || echo B` prints `B`; `false && echo A || echo B` prints `B`; `mkdir -p pokus && cd pokus || exit` (UL ch17 shellcheck SC2164 line). Shows rule 2's tie-break: the `||` branch runs after a success too. Derived from POSIX §2.9.3, unchecked.
- **Steps:** erre 7 (one per executed line, `if` condition counted once since its branch is empty), erre-pipefail 2, p4-nightly 6 (journal, date test, checkpoint pipeline, find, mail, end) or 3 with both switches on, and-or 3. Max ≤ 10.
- **Legend:** status badge `0` (filled check) vs non-zero (hollow with number); "ignored by set -e" hatch on commands in an exception context; pipe member vs pipeline status; "changed" highlight = the status that decided this step (the one `set -e` or `&&`/`||` looked at).
- **Captions:** hr: "`nema_ove_naredbe` vratila je 127, ali cjevovod vraća status svoje posljednje naredbe — `cat` je uspio, pa `set -e` ne vidi ništa." en: "`nema_ove_naredbe` returned 127, but a pipeline returns its last command's status — `cat` succeeded, so `set -e` sees nothing." hr: "S `pipefail` cjevovod vraća status naredbe koja je doista pala; `set -e` zaustavlja skriptu i poruka „OK“ se ne šalje." en: "With `pipefail` the pipeline returns the status of the command that actually failed; `set -e` stops the script and the 'OK' mail is never sent."
- **Terms:** exit status — izlazni status; pipeline — cjevovod; AND list / OR list — `&&`-popis / `||`-popis; error handling — obrada greške; standard error — standardna greška; condition — uvjet; branching — grananje.
- **Misconceptions:** "`set -e` stops on any error" (three exceptions); "an error message means the job failed" / "status 0 means the backup is good" (CV-32: verify the output, not the status); "`a && b || c` is if-then-else".
- **Out of scope:** `trap ERR`/`EXIT` and subshells (→ `lnx-subshell-trap`), `set -u`, `return` in functions, exit statuses over 255, the restore drill itself (→ `sto-restore-drill`, catalogue §5.3).
- **Note for the coordinator:** DR S8 (`student/scenarios/S8.md`) is a capacity/cost brief and says nothing about exit status; the pipefail case is caveat CV-32 (listed for S8, S1, S11). CV-32's root-cause line says `… | gzip > file && mail OK`, but the actual `p4-nightly.sh` has no `&&` and mails unconditionally; the spec follows the script. The `izlazni-status-spaja.svg` diagram is in UL ch16 (`assets/diagrams/chapter-16/`), not ch17.
<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-exit-status sims/lnx-exit-status` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-exit-status/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
