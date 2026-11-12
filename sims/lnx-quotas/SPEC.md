<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-quotas: spec

One concept: **soft vs hard limit, grace period**. A user writes files on a filesystem with a disk quota, and time
passes. The hard limit stops a write where it stands; the soft limit lets it through but starts a clock, and when the
clock runs out the soft limit is a wall too.

Task: `docs/tasks/w3/lnx-quotas.md`. Book: UL ch12 "Zauzeće, kvote i odlagalište memorije" (definitions *kvota*,
*meko ograničenje*, *tvrdo ograničenje*, *razdoblje odgode*; the `repquota` / `setquota -u ana 40M 50M 0 0` /
`quotaon -v` / two `dd` sequence) and "Šire o temi" (quota counts in 1-KiB "blocks"; per filesystem). Sources read
for the edge cases (2026-11-12): Linux `fs/quota/dquot.c` (`dquot_add_space`, `dquot_add_inodes`,
`dquot_decr_space`, `dquot_decr_inodes`) and quota-tools `repquota.c` / `quotasys.c` (`overlim`, `difftime2str`,
`time2str`), see Sources at the end.

## Scene

- **Command** (top): the prompt `[student@demosrv1 ~]$` and the step's command as the book writes it, its output
  (`quotaon -v` lines, `dd: error writing '…': Disk quota exceeded`, `touch: cannot touch '…': Disk quota exceeded`)
  and `status=0` / `status=1`. "Time passes N days" is not a command: the box says so instead.
- **Filesystem** `/mnt/polje` (ext4 on `/dev/md0`), quotas on or off. One row per user: a **blocks bar** (each file a
  segment, scale 0–64 MiB), with the soft limit as a dashed line, the hard limit as a solid wall, the part above soft
  hatched, a refused write as × at the wall it hit, and the numbers `used / soft / hard`; a **files bar** (one cell per
  file, scale 0–8) with the same marks for the inode limits; a grace badge with the time left.
- **Second filesystem** `/home` (no quotas): only in the `other-fs` preset, ana's bar without limits.
- **`repquota /mnt/polje`**: the live table, exactly in the book's layout (below). Cells that changed are highlighted.
- **Calendar**: days 0–15, today marked, the block grace clock as a span from the day it started to its deadline
  (and the file grace clock the same way when it runs).

## State

```
{ day, graceDays, quotaOn,
  fs: [{ id, mount, dev, quotas, users: [{ name, usedKB, files, soft, hard, isoft, ihard,
                                           graceUntil: null|day, igraceUntil: null|day,
                                           graceFrom: null|day, igraceFrom: null|day,
                                           list: [{ name, kb }] }] }],
  last: { op, cmd, fs, user, file, status, wantKB, writtenKB, why, freedKB, n } | null,
  changed: [ keys ] }
```

`fs` is a list so rule 1 has a second filesystem; `/home` is in it only for `other-fs` (`homeShown`). `graceFrom` is
for the calendar only. `list` is the user's files, for the bar segments and `rm`.

## Units

Quota usage and limits are in 1-KiB blocks (quota(1): "shown in kbytes (and are named blocks for historical
reasons)"). ext4 allocates 4-KiB blocks, so usage grows in steps of 4 KiB; every number in the presets is a multiple
of 4. `40M` in `setquota` is 40 × 1024 = 40960 blocks (ch12).

## Rules

1. **Per user, per filesystem.** Limits belong to one user on one filesystem. ana's limits on `/mnt/polje` do not
   apply on `/home`, where quotas are not on: there a write is never refused by a quota. (ch12 definition *kvota*;
   quotactl(2))
2. **`setquota -u ana 40M 50M 0 0 /mnt/polje`** sets block soft 40960, hard 51200; `0 0` means no file limits. A
   limit of 0 is "no limit". (ch12 listing: `ana -- 4 40960 51200 1 0 0`). With the `fileLimits` param the command
   is `setquota -u ana 40M 50M 3 5 /mnt/polje`: file soft 3, hard 5.
   Setting limits also re-evaluates the clock: usage at or below the new soft limit clears it; usage above it with no
   clock running starts one, but only while limits are enforced (rule 3). (kernel `dquot_set_dqblk`, *(check)*: not
   reached by any preset)
3. **Limits are enforced only once `quotaon` has run.** Before it, usage is counted (repquota already shows `used 4`)
   but nothing is refused and no clock starts. (ch12 `quotaon -v`; dquot.c: the add path skips the checks unless
   limits are enabled, `goto finish` still adds the usage)
4. **Hard limit.** An allocation that would make usage **greater than** hard is refused; usage **equal to** hard is
   allowed. A write that would pass it stops exactly at it: the blocks up to the wall are written (the file stays,
   partial), the rest is refused, `Disk quota exceeded`, exit status 1. When the hard limit and an expired soft limit
   refuse the same block, the reason is the hard limit (the kernel tests it first). (ch12: second `dd`, `used 51200`, status 1;
   dquot.c `tspace > dqb_bhardlimit`)
   - Expected (book-ana): used 46084, `dd … count=20` wants 20480 KiB, writes 51200 − 46084 = **5116** KiB, used
     **51200**, files 3 (the file `prevelika` is created before the write).
5. **Soft limit and the clock.** An allocation that makes usage **greater than** soft, while no clock runs, starts
   the clock: deadline = today + `graceDays`. The write goes through (status 0). `repquota` shows `+` in the first
   flag and the time left in `grace`.
   - **Tie-break: usage equal to soft is not over.** No `+`, no clock. (dquot.c `tspace > dqb_bsoftlimit`;
     repquota `overlim()` uses `>` too)
   - Expected (book-ana): `dd … count=45`: 4 + 46080 = **46084** > 40960, status 0, flags `+-`, grace `7days`.
6. **Grace expired.** When today ≥ deadline (**tie-break: on the deadline day itself it has expired**, dquot.c
   `now >= dqb_btime`), the soft limit is enforced like the hard one: any allocation that keeps usage above soft is
   refused, even far below hard. `repquota` shows `none` in `grace`. (ch12 *razdoblje odgode*; edquota(8):
   "Once the grace period has expired, the soft limit is enforced as a hard limit.")
   - Expected (grace-expires): day 8 ≥ 7; `dd … count=1` creates `mala` (files 3) and writes **0** KiB; used stays
     **46084** < 51200; status 1; grace `none`.
7. **Back at or below soft clears the clock.** When freeing makes usage ≤ soft (**tie-break: equal clears it**), the
   clock is gone; the next crossing starts a fresh full period. Freeing that leaves usage above soft keeps the clock
   running from its old deadline. (dquot.c `dquot_decr_space`: `curspace + rsvspace <= dqb_bsoftlimit` → `btime = 0`)
   - Expected (delete-resets): day 3, `rm velika`: used **4**, files 1, flags `--`, grace empty; `dd … count=45` on
     day 3: deadline day **10**, grace `7days`; 5 days later (day 8): `2days` (the old deadline, day 7, would be
     past).
8. **Blocks and files are separate.** Each has its own soft and hard limit, flag (first = blocks, second = files),
   clock and `grace` column. Creating a file needs one inode (checked against the file limits) before any block is
   written; `touch` creates an empty file (0 blocks). A file refused at the inode check is not created:
   `touch: cannot touch '…': Disk quota exceeded` / `dd: failed to open '…': Disk quota exceeded`, status 1.
   (ch12 `repquota` columns; dquot.c `dquot_add_inodes`, same `>`/`>=` tests as blocks)
   - Expected (file-limit, `fileLimits` on, limits 3 / 5, ana starts with 1 inode, her directory): touch 1 → 2,
     touch 2 → **3 = soft, not over** (`--`), touch 3 → **4** (`-+`, file grace `7days`), touch 4 → **5 = hard,
     allowed**, touch 5 → would be 6 > 5: refused, files stay 5, status 1.

## Time

`time passes N days` adds N to `day`. Nothing else changes; the time left is recomputed. Time is whole days, so the
time left is a whole number of days.

## repquota layout

From the book's listings and quota-tools `repquota.c` (`PRINTNAMELEN 9`):

```
*** Report for user quotas on device /dev/md0
Block grace time: 7days; Inode grace time: 7days
                        Block limits                File limits
User            used    soft    hard  grace    used  soft  hard  grace
----------------------------------------------------------------------
root      --      28       0       0              3     0     0       
ana       +-   46084   40960   51200  7days       2     0     0       
```

Row: `%-9s %c%c %7s %7s %7s %6s %7s %5s %5s %6s`. Flag: `+` when used > soft (soft ≠ 0) or used > hard (hard ≠ 0),
else `-`. Grace cell: empty while no clock runs; `none` when expired; time left otherwise, `Ndays` for N ≥ 2 and
`24:00` for exactly one day (quotasys.c `time2str`, `TF_ROUND`: `%ddays` only when days ≥ 2, else `%02d:%02d`). The
header `Block grace time` uses the same function: `7days`, and `24:00` when `graceDays` is 1.

`root` (28 blocks, 3 files, no limits) is the book's row and never changes.

## Params

- `graceDays`: 1–14, default 7 (both the block and the inode grace time).
- `fileLimits`: toggle, default off; on: ana's `setquota` gets `3 5` instead of `0 0`.
- `script`: the preset's command list (hidden; `resets`).

Changing `graceDays` mid-demo replays the script as if the filesystem had that grace time from the start.

## Presets (steps)

| id | steps | commands |
|---|---|---|
| `book-ana` | 5 | `setquota` · `repquota` · `quotaon -v` · `dd velika count=45` · `dd prevelika count=20` (ch12) |
| `grace-expires` | 6 | `setquota` · `quotaon -v` · `dd velika 45` · +8 days · `dd mala count=1` · `rm velika` |
| `delete-resets` | 7 | `setquota` · `quotaon -v` · `dd velika 45` · +3 days · `rm velika` · `dd velika 45` · +5 days |
| `file-limit` | 7 | (`fileLimits` on) `setquota … 3 5` · `quotaon -v` · `touch dat1` … `dat5` |
| `other-fs` | 4 | `setquota` · `quotaon -v` · `dd velika count=60` on `/mnt/polje` · `dd velika count=60` on `/home` |

Expected numbers:

- **book-ana**: step 1 (setquota) ana `--` 4 / 40960 / 51200, files 1 / 0 / 0, nothing enforced; step 2 repquota
  same; step 3 quotaon; step 4 status 0, `+-` 46084, `7days`, files 2; step 5 status 1, written 5116, used 51200,
  files 3, `7days`.
- **grace-expires**: step 3 46084 `+-` `7days`; step 4 day 8 `none`; step 5 status 1, written 0, used 46084, files 3;
  step 6 `rm velika` frees 46080: used 4, files 2, `--`, grace empty.
- **delete-resets**: step 4 day 3 `4days`; step 5 used 4, `--`, empty; step 6 46084, `7days` (deadline 10);
  step 7 day 8 `2days`.
- **file-limit**: see rule 8; step 7 status 1, files 5, flags `-+`, file grace `7days`.
- **other-fs**: step 3 wants 61440, writes 51196, used 51200, status 1 (`+-`, `7days`); step 4 on `/home`: status 0,
  ana's `/home` usage 36 → 61476 (no limits).

`/home` starting usage (36 KiB, 8 files: a home directory with dotfiles) is illustrative; the book shows no `/home`
numbers.

## Captions

The task's caption (book-ana step 4) is the "crossed soft, clock starts" sentence:

- HR: „`ana` je s 46084 bloka iznad mekog ograničenja (40960), a ispod tvrdog (51200). Pisanje je prošlo, ali od sada
  teče razdoblje odgode od 7 dana.“
- EN: "At 46084 blocks `ana` is above the soft limit (40960) and below the hard one (51200). The write went through,
  but the 7-day grace period has started."

Every step's caption: what the command did, then where ana stands against the limits and the clock.

## Out of scope

Group and project quotas (named in the explanation only), `xfs_quota`, `warnquota` and the warning messages
themselves (the book's `dd` prints none), root / `CAP_SYS_RESOURCE` ignoring the limits, the filesystem running out of
space (the disk is assumed large enough), reservations and delayed allocation, `setquota -t` (the grace time is a
param).

## Sources

- UL ch12 (above), read 2026-11-12.
- Linux `fs/quota/dquot.c` (master, read 2026-11-12): `dquot_add_space` (`tspace > dqb_bhardlimit`;
  `tspace > dqb_bsoftlimit && now >= dqb_btime` → `-EDQUOT`; `tspace > dqb_bsoftlimit && dqb_btime == 0` → start;
  `!sb_has_quota_limits_enabled(...)` → `goto finish`, usage still added), `dquot_add_inodes` (same with
  `newinodes`), `dquot_decr_space` (`<= dqb_bsoftlimit` → `btime = 0`), `dquot_decr_inodes` (`<= dqb_isoftlimit`).
- quota-tools `repquota.c` (commit 8e534b): row and header formats, `overlim()` (`>`), grace cell
  (`>= softlimit` → `difftime2str(btime)`, which prints nothing for btime 0); `quotasys.c` `difftime2str` (`none`
  when `btime <= now`), `time2str` with `TF_ROUND`.
- quotactl(2), edquota(8), setquota(8), quotaon(8), quota(1) as cited in ch12.
- *(check)*: `dquot_set_dqblk` re-evaluating the clock on `setquota` (rule 2, last sentence; from memory, no preset
  depends on it); the derived presets (`grace-expires`, `delete-resets`, `file-limit`, `other-fs`) were not run on a
  real filesystem.
