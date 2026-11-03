<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-disk-full-mysteries: notes

New stepper (task `docs/tasks/w3/lnx-disk-full-mysteries.md`, catalogue §4.4). Rules and expected numbers: `SPEC.md`.
The task names no kit view; the page draws everything itself (gauges, tree, processes, terminal, checks).

## Decisions

- **Scene:** two gauges on top, blocks (`df -h`: Size, Used, Avail, Use%) and inodes (`df -i`: Inodes, IUsed, IFree,
  IUse%); under them the tree of names under `/mnt/vjezba` with what `du` adds up, and the processes with their open
  descriptors; at the bottom the command of the step and what it printed, beside the order of checks
  (`df -h` → `df -i` → `du -sh` → `lsof +L1`) and the cause found so far.
- **Patterns, not only colour:** the blocks bar is solid `--c1`; the inodes bar is `--c2` in vertical stripes; the part
  of the blocks held by a deleted, open file is hollow, dashed and hatched (the same on its descriptor card, with
  "(deleted)" and "link count 0"); the filesystem's own blocks are dotted. Under the blocks bar the three parts are
  named with their sizes ("files with a name" is exactly what `du` reaches), so `df` vs `du` reads off the bar. The
  gauge that moved this step is outlined with the kit's changed mark; the gauge that caused an ENOSPC carries
  "✕ ENOSPC · the wall is here". Checked in grayscale.
- **The order of checks (rule 7)** is drawn from the model's `nextCheck` and `cause`: a check run shows its reading, the
  next one is dashed "next", the ones the order skips are dotted "not needed", the one run this step is outlined.
  Readings are forgotten when the filesystem changes and the failure is cleared when something is freed.
- **Scenes and presets:** the kit reserves `?preset=`, so the hidden `scene` param (`obrisana`, `inodi`,
  `inodi-kratko`) carries the script, as in `lnx-links-inodes`. Presets: `obrisana-otvorena` (6 steps), `inodi` (5),
  `inodi-prazne` (4, `fileSize` 0) and `xfs` (4, `fstype` xfs) — the task's step counts. `fileSize` is disabled with a
  reason in `obrisana`, `holdOpen` in the inode scenes.
- **Bulk files as one record:** 65 524 (or 206 673) files are one inode record with `n` and the total blocks, and one
  directory row `s000001…s065524`; ext4 is filled in closed form, XFS chunk by chunk (≤ 8 184 iterations), so replay
  stays fast.
- **`app`** is a generic process (PID 4242) that writes as an ordinary user, so for it the disk is full at Avail 0.
  Its own lines are `app[4242]: write …: No space left on device`. The restart is `kill 4242`, `app &` (`[1] 4243`),
  `df -h`; with `holdOpen` the new process opens a new, empty `app.log` (it gets inode 12 back).
- **`touch` on a full disk with free inodes works.** On XFS with 1-byte files the last inode chunk has 43 free inodes
  when the blocks run out, so step 2 of the `xfs` preset (and of `inodi` with 16 KiB files) succeeds; the caption says
  why ("an empty file needs only an inode"). This follows from rule 3 and is a sharper contrast than a second failure.
- **df/du numbers** are reproduced to the character from the book (`/dev/vdb1       989M   24K  922M   1% /mnt/vjezba`
  and the XFS 959M/51M/909M/6 %), from the model's counters; nothing is typed in.
- **Model is pure and promotable**: no words, plain JSON; the freeing rule is `lnx-links-inodes`' rule 4 (its
  `freeCheck`, adapted to groups of files). `models/` is empty, so nothing was included from there.

## Deviations from the task

- **XFS file count:** 206 673, not "≈ 236 000". The task assumed ext4's 922M and no inode space; the model uses the
  book's XFS numbers (959M, 51M used, 909M free) and charges each chunk of 64 inodes 8 blocks (rule 6).
- **`du -sh /mnt/vjezba` is 20K, not "≈ 24K":** `/` (1 block) and `lost+found` (4) have names; the sixth block of
  `df`'s 24K has none *(check on the VM)*. The page names the difference as "the filesystem itself".
- **`sess/` holds 65 524 files:** the burst makes a directory first, so 65 525 new inodes are the directory and 65 524
  files (the task's 65 525 "files" counts the same inodes; cleaning up is then one `rm -r`).
- **The 5 % kept for root** is in the model (the book's 989M − 24K ≠ 922M needs it) but never mentioned on the page,
  as the task puts it out of scope.
- **Not modelled:** directory growth (a 65 524-entry ext4 directory needs ~1–2 MiB more), extent/indirect blocks,
  XFS sparse inode chunks and the XFS reserve pool. The task's `fsck`-free scene keeps them out.

## Sources

- UL ch11 "Datotečni sustavi: ext4 i XFS" (mkfs.ext4: 261 888 4k blocks, 65 536 inodes; e2fsck 11/65536 files,
  8859/261888 blocks; mkfs.xfs: blocks=261888, imaxpct=25, log 16384 blocks, isize=512) and "Montiranje, `/etc/fstab`
  i UUID" (df -h 989M/24K/922M/1 %; df -hT xfs 959M/51M/909M/6 %; "Šire o temi": df vs du, "prvo df, tek onda du",
  "nijedan alat pritom nije pogriješio"). Read in full for this task.
- UL ch05 "Primjer 3 — prostor koji se ne vraća" (the two freeing conditions), UL ch12 (`du -sh`).
- Kernel `ext4_statfs` (f_bavail = free − root reserve − min(2 %, 4096) blocks) and `xfs_fs_statfs` (f_files =
  min(icount + free blocks × inodes per block, maxicount)): from memory *(check)*.
- mke2fs(8) `-i`/`-N`, mkfs.xfs(8) `-i maxpct`, open(2)/write(2) ENOSPC, lsof(8) `+L1`: from memory *(check)*.
- Message texts (`touch: cannot touch '…': No space left on device`, lsof's columns and the device `252,17`, XFS
  inode numbers from 131, 3 inodes used on a fresh XFS): from memory *(check)*.
- Numbers: printed by an independent script before the model was written and asserted in `sim.test.js`.

## Concepts, not tools

No product is named. Commands appear where they are the subject (`df -h`, `df -i`, `du -sh`, `lsof +L1`, `rm`,
`rm -r`, `touch`, `kill`), all from the task; `ext4` and `XFS` are the task's subject (rule 6). The process is a
generic `app`. The prompt `[student@demosrv1 ~]$` is the book's.

## Term pairs

From the glossary: *file system* (datotečni sustav), *process* (proces), *link count* (brojač poveznica), in the
explanation. Missing from `kit/glossary.js`, written out in both tables:

- *inode* — **inode** (zapis o datoteci) *(check)*: UL ch11 says "mjesta za zapise o datotekama"; the same pair is
  pending from `lnx-links-inodes`.
- *file descriptor* — **datotečni deskriptor** (UL ch05, the task's term). The glossary has "opisnik datoteke" from
  ossimulator — the open conflict in `docs/tasks/OPEN.md`; written out by hand so the page follows the book.
- *disk usage* — **zauzeće** (task): used only in `sim.json` aliases.

## Shared requests

- **Kit:** `.sd-ctl[hidden]` is still overridden by `.sd-ctl { display: flex }` (as `lnx-links-inodes`); worked around
  in the page CSS.
- **Kit (optional):** a "terminal" block (prompt, command, output, error lines with a fixed height) — this is the third
  page drawing its own.
- **Models (for the coordinator):** the freeing rule (`freeCheck`) now lives in two sims; promoting
  `lnx-links-inodes`' model would let this one take it from `models/`.

## Checks

- `node --test sims/lnx-disk-full-mysteries/sim.test.js`: 39 tests — tie-breaks first (lowest free inode number with a
  gap, inode before block, a burst stops at the first failure, -h and Use% rounding, the book's df columns, the order
  of checks, the 10 % threshold, readings forgotten on change), one or more per rule, the presets' numbers, the page
  marks, then the template's generic block over eight parameter sets.
- **Mutations:** 24 one-at-a-time mutations of `sim.js` (lowest free → counter, block check first, rounding down ×2,
  narrow columns, `df -i` always, no threshold, readings kept, empty file takes a block, inodes grow, 10 used fresh,
  all-or-nothing write, no partial file, `du` counting nameless files, no root block, `rm` freeing an open file, restart
  not closing, `lsof` listing named files, XFS chunks free / uncapped / fixed `df -i` / never shrinking, root reserve
  ignored, failure never cleared): all 24 fail a test (the first only after a gap test was added; "inodes grow" by
  hanging the 0-byte fill).
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page; checked every number against
  the book and the kernel formulas; printed every caption for each preset × step × param combination in both languages;
  ran 22 mutations of its own, 12 survived). Fixed from it: `rm -r` on XFS now reports the chunk blocks it gives back;
  a fill that finds no blocks for a new XFS chunk fails at the create and names the next file; XFS writes get their own
  caption (df -i's Inodes falls with free space, so the inodes gauge does move); the XFS fill caption is used only past
  65 524 files; the end of a fill is worded without an off-by-one ("with N made, the write to the last one fails");
  "as good as new", "here too" and "they agree" (51M vs 0) dropped; Croatian uses one stem (inodei, inodee, inodea),
  `t.n` for file counts, "se vraća", "prazan"; tests for all 12 survivors (Avail vs Use%, IFree vs IUse%, the exact 10 %
  boundary, the lsof header not counted, inode-only freeing, XFS `df -i` mid-fill, chunk rounding, the 10K boundary,
  the exact 16 KiB error line and lsof lines). All 22 now fail a test, as do my 24. Left as they are: directory growth
  and the XFS chunk packing (disclosed in SPEC.md), lsof's exact layout *(check)*.
- `npm run gate -- lnx-disk-full-mysteries`: pass (manifest, tests, build, 62 browser checks, tokens, scope). Screenshots at 1920×1080 light, dark, grayscale and 375×812
  in both languages reviewed, plus every preset at its key step and the 16 KiB and XFS 0 B variants.

## Time

2026-11-03 16:01 to 16:58, about 1 hour (including a 6-minute fresh review and its fixes).
