<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-logrotate: notes

New stepper (task `docs/tasks/w3/lnx-logrotate.md`, catalogue `lnx-logrotate` §4.4). No kit view fits (a directory
listing whose rows point at inodes, a descriptor arrow, an ordered operations list), so the page draws its own stage
in HTML. Rules and expected numbers: `SPEC.md`.

## Decisions

- **The arrow is the point.** The `/var/log` box holds the writer on the left and one row per name: lane (the
  descriptor's arrow, only on the row of the inode the writer holds), the inode with its lines as chips, then
  `◀ name`. Both the writer and the name point at the inode, so after a rename the arrow stays on the same box while the
  name beside it changes. The writer spans all rows, so the arrow leaves its right edge.
- **Operations in order.** The logrotate box lists the run's operations numbered, in logrotate 3.21's order, so the
  corrected tie-break (the oldest is shifted to `.N+1` and removed last) is visible. The shift of old versions is one
  item with its renames in order (short names), to fit 8–9 operations at 1920×1080.
- **Deleted but open** (rule 8) is a row of its own, "(obrisan, otvoren) bio messages.2", dashed red, with its lines
  and the arrow. It happens with `create` without reload when the writer's version is removed (`rotate 1`, preset
  `still-open`) or compressed (gzip makes a new inode and removes the old name). A reload releases it (op `freed`).
  Rows removed in this step and not open are drawn struck and dashed for one step.
- **Time:** day 0 = Sunday 2026-08-30; the writer writes on day 7c − 1, logrotate runs on day 7c. Dates for `dateext`
  come from a civil-date function in the model (no `Date`).
- **The status file already knows the log** (last rotation day 0), so every weekly run rotates. That matches four of the
  brief's five presets (`numbers-compress`, `forgot-reload`, `copytruncate-loss`, `delaycompress`); the explanation
  says that a log the status file does not know yet is only recorded on its first run (checked: `Creating new state …
  log does not need rotating`).
- **Inode numbers** 2101, 2102, … in order of creation (gzip and copytruncate's copy take numbers too). Made up, short
  for the projector.
- **Writer:** "the system logger", PID 9360 (the book's `rsyslogd` PID, taken from `sims/lnx-log-path/sim.js @ 275f465`),
  and the book's selector for `/var/log/messages`. The page never names the logger program; the `postrotate` directive
  is shown as "postrotate: reload the logger" (the book's `systemctl reload rsyslog.service` is cited here only).
- **Params:** `delaycompress` is shown only with `compress`, `writeDuringRotation` only with `copytruncate` (hidden, not
  disabled: the panel did not fit at 1920×1080 with both and their reasons); the model ignores them otherwise
  (`norm`). `cycles` (2–8) is added and hidden: the presets set it. The method label says "(reload u postrotate)" so the
  short choice labels `create + reload` / `create` / `copytruncate` fit one row.
- **Captions:** the task's caption is used for `create-reload` rotations, followed by "postrotate does that, so the
  descriptor now points at the new inode N", because in this model the reload happens in the same run. At most two
  extra sentences: removed-while-open or compressed-while-open first, then the removal (numbered: "one too many only for
  a moment… removes the extra one at the end of the run"; dated: "the oldest date… at the end of the run"),
  then compress/delaycompress, then the shift.
- **Long line lists** (custom params up to 4 lines × 8 weeks in one file) show the first 2 and the last 6 chips with
  "…"; the count gives the total.
- **Concepts, not tools:** logrotate, its directives, `/var/log/messages`, `logrotate.status` and gzip's `.gz` are the
  subject (UL ch13 teaches them by name). The logger is generic.

## Deviations from the task

- **Tie-break reversed (rule 3).** The brief: "the removal of the oldest happens first, so there is never a moment with
  N+1 versions. (logrotate(8), check the exact order)". Checked with strace on logrotate 3.21.0: the shift renames
  `.3.gz → .4.gz` first, and `unlink messages.4.gz` is the last call of the run, after `postrotate` and gzip; with
  `dateext` the oldest dated file is also removed last. The model follows logrotate. Test: "tie-break: the oldest is
  shifted to .N+1 first and removed last".
- **Order of compress and postrotate.** The brief lists "then compress, then postrotate"; logrotate runs `postrotate`
  first and compresses after (strace). With `delaycompress` the previous version is compressed at the start of the next
  run, before the shift.
- **`book-config` numbers.** The brief says "after cycle 5 there are four dated files; at cycle 6 the oldest is
  removed"; with every run due, there are four dated files from cycle 4 on and the first removal is at cycle 5 (see
  SPEC.md). Only a first run that is not due would give the brief's numbers, and that would break the other four
  presets' numbers.
- **State:** `files` as in the brief; added `deleted` (inodes with no name the writer holds), `ops`, `removed`,
  `written`, `writtenTo`, `arrowMoved`, `due`, `rotations`, `lastRotation`, `lostLines`, `phase`. `changed` holds inode
  numbers.
- **A sixth preset, `still-open`** (`create`, `rotate 1`, no `dateext`, 3 cycles), for the brief's third misconception
  ("removing an old version frees space at once") and rule 8, which no listed preset reaches.
- **`writeDuringRotation`** is ignored by the model unless `copytruncate` (the brief: "only matters for copytruncate").
- **Title** "Rotacija dnevnika: create i copytruncate": the catalogue name is "logrotate"; the title names the
  contrast the page is about. Aliases carry `logrotate`.

## Sources

- UL ch13 "`rsyslog`, `/var/log` i rotacija": the definition *rotacija dnevnika*, logrotate as a daily cron job that
  changes a log at most once a day, `weekly` (7 days since the last rotation), `rotate`, the `/etc/logrotate.conf`
  listing (`weekly`, `rotate 4`, `create`, `dateext`), `/etc/logrotate.d/rsyslog` (`postrotate` reload, "program koji u
  nju piše mora doznati da datoteke više nema na starom mjestu"), `compress`, the status file
  `/var/lib/logrotate/logrotate.status` and "Creating new state"; Primjer 4 (`weekly` + `rotate 4` ≈ a month).
- UL ch05 Primjer 3 (space comes back only when the link count is 0 and no descriptor holds the file), the `ls -li`
  experiment (directory entry, link count).
- UL ch10 "Poslovi koji se pokreću sami": `logrotate.timer`, `OnCalendar=daily`, `Persistent=true`.
- UL ch13 / `sims/lnx-log-path`: the selector `*.info;mail.none;authpriv.none;cron.none` for `/var/log/messages`, PID 9360.
- logrotate(8) for `copytruncate`, `delaycompress`, `dateext`, `postrotate` (the book cites only the first four
  directives) — all checked by running logrotate 3.21.0 (below), except the line between copy and truncate *(check:
  follows the man page's warning; a race, not reproduced)*.
- *(check)* "i-čvor" for inode (the brief's suggestion; ch05 avoids the word and says "broj"), "skraćivanje" for
  truncate.

## Checked against logrotate

On nuc, 2026-11-12, logrotate 3.21.0, Linux 6.8, as a normal user with `-s <state>`:

- strace of one run with `rotate 3`, `create`, `compress`, `postrotate` and three old `.gz`: `rename .3.gz→.4.gz`,
  `.2.gz→.3.gz`, `.1.gz→.2.gz`, `messages→messages.1`, `open messages O_CREAT|O_EXCL`, `sh -c postrotate`, gzip into
  `messages.1.gz`, `unlink messages.1`, `unlink messages.4.gz`.
- strace with `dateext`, `rotate 4` and four old dated files: `rename messages→messages-20261112`, create, postrotate,
  `unlink messages-20260906`.
- strace with `copytruncate`, `compress`, `delaycompress`: gzip `messages.1 → messages.1.gz`, `unlink messages.1`, shift,
  `open messages`, `open messages.1 O_CREAT`, `ftruncate(messages, 0)`.
- A fresh state file and `weekly`: "Creating new state … log does not need rotating", nothing renamed.
- Whole demos: a Python writer holding an `O_APPEND` descriptor, `logrotate -f` once per cycle, reopening after a
  `postrotate` that touches a flag; the end state (names, lines per name, which name the writer's inode has, or
  deleted) equals the model's for 8 cases: `numbers-compress`, `forgot-reload`, `copytruncate` without the line
  between, `delaycompress`, `still-open`, `create` + `compress` (rotate 2, 4 cycles), `create` + `delaycompress` (3
  lines, 4 cycles), `copytruncate` + `compress` (rotate 2, 5 cycles, 1 line). The two scripts (`real.py`, `cmp.js`)
  are in the thread's library folder, `check-against-logrotate/`.
- Not run: `dateext` over several weeks (no fake clock on nuc).

## Term pairs

From the glossary: *log rotation*, *file descriptor* (glossary: "opisnik datoteke"; the book says "datotečni
deskriptor"), *directory entry*. Missing from `kit/glossary.js`, written out in both tables:

- *inode* — **i-čvor** *(check)*
- *truncate* — **skraćivanje** (skratiti) *(check)*
- *compression* — **kompresija** (komprimirati), UL ch13 uses "komprimira"

## Shared requests

- **Kit:** `.sd-ctl[hidden]` is still overridden by `.sd-ctl { display: flex }` (as in `lnx-log-path`); worked around in
  the page CSS.
- **Kit:** `.sd-hatch` loses to any page rule that sets `background` on the same element; the page repeats the hatch
  gradient. A `background-image`-only `.sd-hatch` with higher priority (or a `--hatch` token) would avoid that.
- **Model:** nothing promotable from `lnx-log-path` was needed beyond the PID and the selector (copied as constants).

## Checks

- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against the book, ran
  logrotate itself and 58 mutations of `sim.js`). It confirmed both deviations (removal last; a first run that only
  records state) and every number. Fixed from it: plural forms (`capWrite` and `opCopyInode` got a node as `n`, so
  Croatian said "2 redaka"; `capRemoved`/`capRemovedDate` are now plural forms of `rotate`); `weekly` is "Sunday, or 7
  days" as in logrotate 3.21 (was 7 days only); without a reload the caption says where the writer's inode is now
  (`messages.2`, or no name); "messages.1 je komprimiran u messages.1.gz"; Croatian gender in the explanation; tests
  for the 10 surviving mutations that mattered (not-due run keeps the status file, rotation count, changed/arrowMoved
  per step, the ops' open flags, `norm` clamps and defaults) and a line-accounting test. Surviving now: 3 equivalent
  mutants (delaycompress picks the oldest plain version: only one can exist; dateext "shifts": nothing numbered; the
  numbered-versus-dated tie in the sort: both never coexist).
- `node --test sims/lnx-logrotate/sim.test.js`: tie-breaks first (removal last, shift from the top, dateext removal
  last, delaycompress before the shift, compress after the reload, copy → line between → truncate), one or more per
  rule (1–8), the preset numbers of SPEC.md, line accounting, `norm`, then the template's generic block.
- Fit: every preset × every step × both languages, plus two sets of extreme params (rotate 6, 8 weeks, 4 lines; with and
  without dateext + compress + delaycompress), 516 pages at 1920×1080: no overflow in the stage boxes, the panel or the
  caption, no console errors (a Playwright script in the scratchpad).
- `npm run gate -- lnx-logrotate`: pass. Screenshots at 1920×1080 light, dark, grayscale and 375×812 in both languages
  reviewed.

## Time

2026-11-12 08:43 to 09:23, one session: reading the task and the book, checking logrotate 3.21 with strace and
whole-demo runs, model and SPEC, tests, strings and page, fit sweep and screenshots, a fresh review (run while
NOTES.md was written) and its fixes.
