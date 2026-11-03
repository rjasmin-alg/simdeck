<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-mirror-not-backup: notes

New stepper (task `docs/tasks/w3/lnx-mirror-not-backup.md`, catalogue `lnx-mirror-not-backup` §4.4, overlap §5.3),
drawn on kit view **K3: block grid** (`kit/blockgrid.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Scripts, not free input.** Each preset is a fixed script of commands (hidden `scene` select), so step counts are
  fixed and replay holds. Every caption is worded from the model's event and state.
- **Scene.** Left: the filesystem `/mnt/polje` (file list with sizes; the deleted file is struck in its step), with the
  second machine `/mnt/kopija` beside it in `with-backup`. Below it, the dashed **boundary of protection** with the
  book figure's words. The layer names "datotečni sustav" / "uređaj" sit on its left (`showLayers`). Below that, one
  block grid: `md0` (what the array presents), `vdb`, `vdc`, first 8 blocks each; the `[n/of] [map]` box as the
  grid's counter. Right: a terminal panel with the step's command (or event, in italics) and its layer, the full
  `/proc/mdstat` with changed tokens highlighted and a "= bez promjene" / "≠ promijenjeno" tag (rule 5's point), then
  `cat /mnt/polje/proba.txt` and its exit status, and the next command.
- **Blocks are schematic.** Block 0 is the filesystem's metadata (superblock, bitmaps, inodes, directory) in one cell,
  and each file takes two data blocks (`p1`, `p2`), as the task asks. A 12-byte file needs one data block in ext4;
  SPEC.md says so.
- **Cell kinds.** Metadata: `fill` c1. File data: `fill` in the file's colour. Wrong content (garbage or encrypted):
  `bad`. Freed by `rm`, bytes still there: `ghost`, dim text. A failed disk: `dead` (crossed, text struck) with
  "(F) u kvaru". Not yet in sync during the initial resync: `soft` c8 (hatched). The task's legend wanted the
  deleted/garbage block "hatched red + ×" and the failed disk crossed. Freed and garbage are different things here
  (freed blocks are unreferenced, garbage blocks are referenced but wrong), so the two get two kinds.
- **Resync timing.** `--create` shows the book's resync line. The next command finds the resync done (2 GiB at
  ~200 MB/s, `finish=0.1min`), and the caption says "in the meantime". `--re-add` resyncs at once, which matches the
  book's next `/proc/mdstat` (`[2/2] [UU]`, no progress line). It reports how many blocks differed: 0 in the book
  preset, so its caption says there was nothing to copy.
- **`/proc/mdstat` text** follows the md driver's `status_resync` formatting (bar `x = per_mille / 50`, `%3u.%u`
  truncated, `finish` from whole seconds). With ch12's numbers, the test reproduces the book's line character for
  character.
- **"Changed" marks** (the kit's yellow) go on blocks written to a disk in the step: by the filesystem through md,
  by a re-add or by the resync. A failed or dead disk is never marked as written (its point is that it receives
  nothing): the status that changed ("(F) u kvaru", the array's "oslabjelo") is marked instead, on its aside. The
  legend says "promijenjeno u ovom koraku".
- **Reads** come from the first active member in role order. The degraded disk serving reads gets "čita se odavde".
- **No links (arrows).** The blocks written in a step are marked changed on `md0` and on every member written; a
  failed member's cells are not marked when a write skips it, and the caption names it. Arrows md0 → vdb / vdc for
  three blocks would be six arrows through the vdb row.
- **Names on the page:** `mdadm`, `/proc/mdstat`, `mkfs.ext4`, `mount`, `tee`, `rm`, `cp`, `cat` are the subject (UL
  ch12 teaches them). The book's own commands are used. "Ransomware" is not named on the page: it is "a malicious
  program", and the preset is "Šifriranje datoteka" / "Files encrypted". No product names.
- **Second machine** is `/mnt/kopija`, "a shared directory on a second machine", copied with plain `cp`. That is a
  generic copy, not a backup tool.

## Deviations from the task

- **Step counts:** `two-failures` has 3 steps, not 4: `--fail vdc` → `tee -a` (reaches vdb only: rule 3, and why vdc
  cannot help later) → vdb dies. A fourth step would be filler. `with-backup` has 9, not 8: the book's 6, then the
  copy, the `rm` and the restore, each its own command. The book preset has 7 as the task says (`mkfs.ext4` and
  `mount` are two commands).
- **`corruption`** checks each copy on its own: overwrite → `--fail vdb` (vdc gives garbage) → `--re-add vdb` →
  `--fail vdc` (vdb gives garbage). This counters "the other disk still has the old version".
- **`ransomware-mirror`** starts with two files (`proba.txt`, `vjezba.txt`) so that "every file" holds; the third step
  is the README the S3 scenario mentions. The last step fails vdc to show the survivor is encrypted too.
- **Legend:** see "Cell kinds" above.

## Unchecked *(check)*

- Both members failed: `/proc/mdstat` drawn as `md0 : active raid1 vdc[1](F) vdb[0](F)` / `[2/0] [__]`, and `cat`
  failing with `Input/output error`. Recent kernels (md/raid1 since about 5.19) keep the last device and mark the array
  broken instead of faulty, so the real line may still read `[2/1] [U_]`. The task's own state model says `__`.
- `--fail` of the last working member is refused in the model (no change). That is the current kernel behaviour as
  far as I know. No preset uses it.
- `mdadm --re-add` output text `mdadm: re-add /dev/vdc to md0 succeed` is the book's. For `vdb` (corruption preset)
  the same wording with `vdb` is assumed.
- A real `mount` of ext4 writes the superblock (mount count, time); the model writes nothing on `mount`.
- `ponovno usklađivanje` for *resync*: the page uses "usklađuje se" / "usklađivanje" (task: "(check)").

## Term pairs (missing from `kit/glossary.js`)

- RAID — redundantno polje diskova (uvod-u-linux ch12) — used in the explanation as `*RAID* (redundantno polje diskova)`
- device failure — kvar uređaja (uvod-u-linux ch12)
- degraded — oslabjelo (uvod-u-linux ch12 writes "polje je oslabjelo"; glossary has *degraded mode* — degradirani rad)
- resync — ponovno usklađivanje *(check)*

Used from the glossary: mirroring, backup, recovery point.

## Shared requests

None. K3 covered everything. A per-row pattern for "this whole member is out" would be nicer than marking every cell
`dead`, but `dead` reads fine.

## Sources

See SPEC.md "Sources": UL ch12 (section "Redundantno polje diskova", Primjer 3, figure
`granica-zastite-zrcala.svg`), md(4), mdadm(8), md driver `status_resync`, DR S3 (student material only),
ossimulator spec 12 (status words).

## Review

A fresh reviewer (a subagent with no context but the files) read the code against SPEC.md and ran 42 deliberate
breaks of the rules and tie-breaks. 39 were caught. The three missed ones (`--re-add` leaving the member resyncing,
`mount` writing, `cat` before mount with a file on md0) now have tests, and each was broken again to see it fail.
It also found the following, all fixed:
- three latent model defects: an encrypt or write on a failed array changed the file list; a `cp` with no second
  machine crashed
- a Croatian agreement error ("točka oporavka kojem" → "kojoj")
- the "written" mark on a failed disk's cells
- a re-add caption naming the wrong source disk (latent)
- "only encrypted files" on the survivor (README.txt is plain)
- "on the right" in a caption, which is wrong on phones
- the explanation's title for `backup-diff-incr`
- the summary's "the file is gone from both disks" (the bytes stay, rule 5): it now says the delete was written to
  both disks

## Timing

Started 2026-11-03 19:09 CET, done 19:32 CET: about 23 minutes.
