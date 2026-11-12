<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-quotas: notes

New stepper (task `docs/tasks/w3/lnx-quotas.md`, catalogue `lnx-quotas` §4.4, wave 3). No kit view fits: K3 (block
grid) draws cells, not a usage bar with two limit lines and a clock, so the page draws its own in HTML. Rules and
expected numbers: `SPEC.md`.

## Decisions

- **Four panels.** The command as the book writes it (with `[student@demosrv1 ~]$`, its output and `status=`), the
  filesystem `/mnt/polje` (ana's blocks bar and files bar, root's line), the live `repquota` report in the book's
  exact layout, and a calendar with the grace clocks. The `other-fs` preset adds a compact `/home` card.
- **Blocks bar:** each file is a segment (`velika`, `prevelika`; ana's directory is 4 KiB and too thin to see), the
  soft limit a dashed line labelled above, the hard limit a solid wall labelled below (two rails, so the labels never
  collide on a phone), the part above soft hatched, and a refused write a × at the wall it hit. After the grace period
  runs out the dashed soft line is drawn solid: it is a wall now. Fixed scale 0–64 MiB on every card so the bars do not
  jump between steps.
- **Files bar:** one cell per file (inode), with the same marks: dashed after the soft cell, a wall after the hard
  cell, hatched cells above soft, × in the cell that was refused.
- **repquota is computed, not typed.** `repquotaRow` uses repquota.c's format (`%-9s %c%c %7s …`); the test checks
  the book's rows character for character. Changed cells are highlighted against the previous step.
- **Grace text** follows quota-tools exactly: `Ndays` for 2 days and more, `24:00` for one day left, `none` when
  expired, empty when no clock runs. With `graceDays` = 1 the header says `Block grace time: 24:00`. That looks odd
  but is what the tool prints.
- **One step = one command.** The step counts are the task's (5/6/7/7/4). "Time passes N days" is a step with no
  command; the command box shows ⏱ and the new day instead.
- **`graceDays` and `fileLimits` are live params.** Changing them keeps the step and replays the script, so
  `grace-expires` step 5 with 14 days is a successful write (`6days` left): the "what if" the concept needs.
  The script is hidden (`resets`), as in the neighbouring Linux steppers.
- **`dd` creates the file before writing** (`O_CREAT`, inode check first), so a refused `dd` still leaves the file:
  `prevelika` partial (5116 KiB, the book's files 2 → 3) and `mala` empty in `grace-expires`. A file refused at the
  inode check is not created (`touch: cannot touch …`).
- **Writes stop on 4-KiB allocation boundaries** (ext4 blocks). Every number in the presets is a multiple of 4, so this
  never shows; it keeps the model honest for other values.
- **Captions** are composed: what the command did, then where ana stands (below / at / over soft, the clock, the
  deadline). The task's caption is the "crossed soft" sentence, word for word in both languages. The glossary terms
  are used in the explanation; captions use plain Croatian forms (*mekog ograničenja*, genitive), which the term
  markup would break.
- **Entries** in `sim.json` for `grace-expires` and `other-fs`: the two misconceptions the task names that a lecturer
  would link to on their own ("the soft limit is only a warning", "a quota holds for the whole machine").
- Tags: `filesystems`; topic `linux-admin`; level `intro` (the task's). All exist in `tags.json`.

## Deviations from the task

- **State shape.** The task's state is for one filesystem; this one has `fs: [...]` so rule 1 can show `/home`
  (only in `other-fs`), plus `graceFrom`/`igraceFrom` (for the calendar) and `list` (files, for the segments and
  `rm`). `last` also carries `out` (the output lines) and `why`.
- **Presets the task leaves open:**
  - `grace-expires` (6 steps): setquota, quotaon, `dd velika 45`, +8 days, `dd mala count=1` (refused), and as the
    sixth step `rm velika` (back to 4, `--`, clock gone): the way out of the wall.
  - `delete-resets` (7 steps): setquota, quotaon, `dd velika 45`, +3 days, `rm velika`, `dd velika 45` (fresh 7 days,
    deadline day 10), +5 days (day 8: `2days` left, where the old clock would have expired on day 7).
  - `file-limit` (7 steps): setquota with `3 5`, quotaon, five `touch dat1…dat5`. ana starts with 1 inode (her
    directory, the book's `used 1`), so the touches take her to 2, 3 (= soft, not over), 4 (`+`), 5 (= hard,
    allowed), and the fifth touch would be the 6th inode: refused. That is the task's "at the 4th the second flag turns
    `+`, the 6th fails", read as inode counts.
  - `other-fs` (4 steps): setquota, quotaon, `dd velika count=60` on `/mnt/polje` (stops at 51200), the same on
    `/home` (status 0).
- **`/home` numbers are invented** (36 KiB, 8 files before the write): the book shows none. Its device is not named.
- **The book's `rm -f … ; quotaon -v`** line is shown as plain `quotaon -v` (the `rm -f` there only cleans up files
  that do not exist).

## Sources

- `uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, "Zauzeće, kvote i odlagalište memorije" (definitions
  *kvota*, *meko ograničenje*, *tvrdo ograničenje*, *razdoblje odgode*; `repquota` before and after
  `setquota -u ana 40M 50M 0 0`; `quotaon -v`; the two `dd` with `status=0` / `Disk quota exceeded`, `status=1`;
  46084 and 51200) and "Šire o temi" (1-KiB blocks; per filesystem). Read 2026-11-12.
- Linux `fs/quota/dquot.c` (master, fetched 2026-11-12): `dquot_add_space`, `dquot_add_inodes` (hard `>`, soft `>`,
  expiry `now >= btime`, no checks while limits are not enabled), `dquot_decr_space`, `dquot_decr_inodes` (`<=` soft
  clears the clock).
- quota-tools `repquota.c` and `quotasys.c` (SourceForge linuxquota, fetched 2026-11-12): row and header formats,
  `overlim()`, the grace cell, `difftime2str`, `time2str(TF_ROUND)` (`24:00` for one day).
- quotactl(2), edquota(8), quota(1) as quoted in ch12's footnotes.
- *(check)*: `setquota` re-evaluating the clock (`dquot_set_dqblk`, from memory; no preset reaches it). The derived
  presets were not run on a real filesystem (nuc has no quota-enabled ext4 to try them on; the book's sequence is
  reproduced exactly).

## Term pairs

Used in the page, missing from `kit/glossary.js` (written out in both tables for now):

- block — blok (quota's 1-KiB unit; ch12 "blokovima")
- file limit (inode limit) — ograničenje broja datoteka *(check: the book has no term for it; this is the task's)*

## Shared requests

None. (A view for "a usage bar with limit lines" could serve `lnx-quotas`, `disk-partitioning`-style sims and
cgroup memory limits, but one sim does not justify it yet.)

## Checks

- `node --test sims/lnx-quotas/sim.test.js`: 27 tests. Every rule and tie-break was broken once in `sim.js` and a
  test failed each time (soft `>=`, expiry `>`, reset `<`, inode hard and soft `>=`, the hard cap one block short,
  `/home` with quotas, M as 1000, enforcement before quotaon, no clock, no expiry, no reset, no inode limit,
  `1days`). The block hard test `>` vs `>=` alone is an equivalent mutation: the cap formula already stops at the wall.
- **Fresh review** (a separate agent read the diff against `SPEC.md` and ran ~45 mutations). Fixed from it: the
  `rm` caption said "a full 1 days" at `graceDays` 1 (now the `days` plural); Croatian accusative at step 0 and in the
  `touch` caption ("1 datoteku"); a write that crosses soft and lands exactly on hard now says "exactly at the hard
  one", not "below"; when the hard limit and an expired soft limit refuse the same block the reason is the hard limit
  (kernel order); `setquota` no longer starts a clock before `quotaon` (rule 3); SPEC's bar scale (64 MiB); the
  `file-limit` hint now counts touches, not inodes. New tests for the gaps it found (`rm` frees an inode, the two
  clocks are independent, `dd: failed to open`, the `setquota` re-evaluation, the reason order, the 4-KiB floor at
  the soft wall); each of those mutations now fails a test.
- `npm run gate -- lnx-quotas`: pass (64/64 browser checks, no exceptions). Screenshots reviewed: 1920×1080 light,
  dark, grayscale, help, panel hidden, 375×812, both languages, plus every preset's last step at 1920×1080 and
  `other-fs` at 375×812.

## Time

Start 2026-11-12 19:05, done 19:30: about 25 minutes, one session (the fresh review ran in parallel, about 4 minutes).
