<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-disk-full-mysteries: spec

One concept: **inode exhaustion, and a deleted file still open** — two ways to get "No space left on device" while
`df -h` shows free space, or while `du` finds nothing to delete. Task: `docs/tasks/w3/lnx-disk-full-mysteries.md`.
Class stepper; one step is one action (a write burst, `touch`, `rm`, a diagnostic command, a restart).

Numbers marked *(check)* are derived, not seen on the lab VM. Every number below was printed by an independent script
(`numbers.js` in the thread's scratchpad, logic copied into NOTES.md) before the model was written, and is asserted in
`sim.test.js`.

## Scene

One filesystem, the book's `/dev/vdb1` on `/mnt/vjezba` (UL ch11). Two gauges: **blocks** (what `df -h` reports:
Size, Used, Avail, Use%) and **inodes** (what `df -i` reports: Inodes, IUsed, IFree, IUse%). Under them the directory
tree with `du` sizes, and the process strip (`app`, PID 4242) with its open file descriptors. A tool panel shows the
command of the step and what it printed (or `app`'s own error line).

## The filesystem

| | ext4 (UL ch11, `mkfs.ext4 /dev/vdb1`) | xfs (UL ch11, `mkfs.xfs /dev/vdb2`, same size) |
|---|---|---|
| blocks of 4 KiB on the device | 261 888 | 261 888 |
| `df` Size (f_blocks) | 261 888 − 8 853 overhead = **253 035** (989M) | 261 888 − 16 384 log = **245 504** (959M) |
| used when fresh | **6** blocks (24K): `/` 1, `lost+found` 4, 1 with no name | **13 000** (51M) *(check: the book gives 51M, any 12 801–13 055 fits)* |
| kept from unprivileged writes | 13 094 (5 %) + 4 096 = **17 190** | 0 |
| Avail when fresh | **235 839** (922M), Use% 1 % | **232 504** (909M), Use% 6 % |
| inodes | **65 536**, fixed; **11** used when fresh | on demand, chunks of 64 (8 blocks of 512-byte inodes); 64 allocated, **3** used when fresh; at most **523 776** (imaxpct 25 % of 261 888 blocks × 8) |
| `df -i` Inodes | 65 536 | min(allocated + 8 × free blocks, 523 776) |
| a directory | 1 block | inline, no block |

Sources and derivations: the overhead is e2fsck's "8859/261888 blocks" minus `df`'s 24K = 6 blocks (UL ch11); the 989M,
24K, 922M and 1 % are the book's `df -h /mnt/vjezba`; 959M/51M/909M/6 % its `df -hT /mnt/druga`. The 17 190 kept blocks
are mke2fs's 5 % for root plus ext4's own reserve of min(2 %, 4 096) blocks — the only split that makes 989M − 24K
come out as 922M (kernel `ext4_statfs`, from memory *(check)*). The task puts the 5 % out of scope: the model keeps it
so the book's numbers come out, and the page never mentions it. `app` runs as an ordinary user, so for it the disk is
full at Avail 0. XFS `df -i` follows `xfs_fs_statfs` (from memory *(check)*).

**df/du formatting.** `-h` is powers of 1024 rounded **up**, one decimal under 10 (`4.0K`), `0` for nothing. Use% and
IUse% are used ÷ (used + avail), rounded up. Column widths as coreutils (minimum 14 for Filesystem, 5 for the numbers,
4 for Use%), so `df -h` reproduces the book's lines exactly. `du -sh` sums the blocks of every name it reaches from the
path.

## Rules

1. **A file costs one inode, plus ⌈size ÷ 4 KiB⌉ blocks.** An empty file takes no block, a 1-byte file one. Directory
   growth is not modelled (an ext4 directory keeps 1 block, an XFS one none): a real `sess/` with 65 524 entries needs
   about 260–340 blocks more, so on the VM "28K" would read about 1.1–1.4M and "256M" about 257–258M; Use% and IUse%
   hold *(check)*. Indirect/extent blocks are not modelled. Source: UL ch11 (4k blocks, "65 536 mjesta za zapise o datotekama").
2. **ext4's inode count is fixed when it is made**: 65 536; a fresh one uses 11 (10 reserved + `lost+found`; the book's
   e2fsck "11/65536 files"). Source: UL ch11; mke2fs(8) `-i`, `-N`.
3. **A create needs a free inode, a write needs free blocks; either missing is ENOSPC, the same text.** A create with no
   free inode fails before anything is written; a write that runs out of blocks keeps what it got and fails. Message
   texts: `touch: cannot touch '…': No space left on device`, and `app`'s own `app[4242]: write …: No space left on
   device` / `app[4242]: create …: No space left on device`. Source: open(2), write(2) ENOSPC *(check)*.
4. **`df` reads the filesystem's counters; `du` adds up what it finds by walking names.** They differ by everything with
   no name: the fs's own structures (ext4 1 block → `df` 24K vs `du` 20K; XFS 51M vs 0) and a deleted file still open.
   Source: UL ch11 "Šire o temi", UL ch12.
5. **Freeing needs link count 0 and no open file descriptor.** `rm` of an open file removes the name (`du` drops) but
   not the blocks (`df` stays); the blocks come back when the last fd closes (the process exits). `lsof +L1` lists open
   files whose link count is below 1, shown as `NAME (deleted)`. Source: UL ch05 Primjer 3, footnotes ch5-unlink-free,
   ch5-unlink-postponed; lsof(8) `+L1` *(check)*. The same rule as `lnx-links-inodes` rule 4 (`freeCheck` copied).
6. **XFS makes inodes on demand** from free space, 64 at a time (8 blocks), up to 25 % of the space. Chunks emptied by
   `rm -r` go back, counted as if the inodes left were packed into the first chunks (an approximation: the surviving
   `test` keeps its number though its chunk is counted as freed). With small files
   the blocks run out first and `df -i`'s Inodes shrinks with the free space (no inode wall at 65 524); with empty
   files the 25 % cap is reached first. Source: mkfs.xfs(8) `-i maxpct`; xfs_fs_statfs *(check)*.
7. **Diagnosis order (tie-break):** `df -h` first; if Avail > 0 (blocks look free) then `df -i`; if Avail = 0 then
   `du` inside the fs; `lsof +L1` only if `df` and `du` disagree, meaning `df` Used − `du` > 10 % of Size (so the
   fs's own 24K or 51M never counts as a disagreement). A reading is forgotten when the state changes (a write, `rm`,
   a restart). `nextCheck(state)` gives the next tool; `cause(state)` the verdict (`inodes`, `blocks`, `deleted-open`,
   or none). Source: UL ch11 (`df` before `du`); the `df -i` and `lsof` steps are derived (task).

Tie-breaks inside the model: a new ext4 inode takes the lowest free number (12, then 13, …); XFS numbers go up from 131
(root 128, two realtime inodes 129–130 *(check)*); a burst stops at the first failure; the inode check comes before
the block check in a create.

## Params

- `scene` (hidden; set by the presets): `obrisana` | `inodi` | `inodi-kratko`.
- `fstype`: ext4 / xfs, default ext4. `resets`.
- `fileSize`: 0 B / 1 B / 4 KiB / 16 KiB, default 1 B (inode scenes only; disabled with a reason in `obrisana`).
- `holdOpen`: `app` keeps `app.log` open, default on (`obrisana` only; disabled with a reason in the inode scenes).

## Presets and expected numbers

1. **`obrisana-otvorena`** (scene `obrisana`, ext4, holdOpen on), 6 steps. `app.log` exists empty (inode 12), `app`
   holds it as fd 3w.
   1. `app` writes 800 MiB: 204 800 blocks. `df -h`: 801M used, 122M avail, 87 %.
   2. `app` writes 200 MiB more: only 31 039 blocks fit (app.log 965 996 544 B = 921.25 MiB), then ENOSPC (blocks).
      989M / 922M / 0 / 100 %.
   3. `rm /mnt/vjezba/app.log`: no output; the name goes, count 1 → 0, blocks stay (postponed).
   4. `df -h` + `du -sh /mnt/vjezba`: 100 % vs **20K**. Disagree → next check `lsof +L1`.
   5. `lsof +L1`: `app 4242 student 3w REG 252,17 965996544 0 12 /mnt/vjezba/app.log (deleted)` *(check the device and
      the column layout: lsof's own alignment of USER, FD and TYPE is from memory)*.
   6. `kill 4242`, `app &` → `[1] 4243` (a new empty `app.log`, inode 12 again), `df -h`: 24K, 1 %.
   With holdOpen off: step 3 frees 235 839 blocks at once (`df` 24K); step 4 agrees (24K vs 20K); step 5 prints nothing;
   step 6 frees nothing. With xfs: 959M / 51M / 909M / 6 % at the start, 959M / 959M / 0 / 100 % full, app.log
   232 504 blocks, `du` 0, lsof NODE 131.
2. **`inodi`** (scene `inodi`, ext4, 1 B), 5 steps.
   1. `app` makes `sess/` (inode 12, 1 block) and writes files until a create fails: **65 524** files (13…65 536);
      12 + 65 524 = 65 536 inodes, **65 525** new. ENOSPC (inodes).
   2. `touch /mnt/vjezba/test`: ENOSPC.
   3. `df -h`: 989M / **256M** / 666M / **28 %** → next `df -i`.
   4. `df -i`: 65 536 / 65 536 / 0 / **100 %** → cause inodes.
   5. `rm -r /mnt/vjezba/sess`: 65 525 inodes and blocks back; 11 inodes, 24K.
   With 0 B: 28K / 1 %; 4 KiB as 1 B; 16 KiB: blocks first, 58 960 files (the last with 2 of its 4 blocks), 100 %,
   `df -i` 58 972 used (90 %); then `touch` works (inodes are free) and `df -h` asks for `du` next.
3. **`inodi-prazne`** (scene `inodi-kratko`, ext4, 0 B), 4 steps: fill (65 524 empty files), `touch` fails, `df -h`
   **28K, 1 %**, `df -i` 100 %.
4. **`xfs`** (scene `inodi-kratko`, xfs, 1 B), 4 steps: fill → **206 673** files, ENOSPC (blocks), the last file
   created with no block (206 720 / 206 677 / 43 after it); `touch` **works** — an empty file needs only an inode and the
   last chunk has 43 free (rule 3); `df -h` 959M / 959M / 0 / 100 % → next `du`; `df -i` 206 720 / 206 678 / 42 / 100 %
   (Inodes shrank from 523 776; IFree is not 0, so the cause is not inodes). With 0 B on
   XFS: 523 772 files, the 25 % cap, `df -h` 307M / 32 %, `df -i` 100 %.

The task's "≈ 236 000 files" for XFS assumed the ext4 922M and no inode space; with the book's XFS numbers and 64-inode
chunks taking blocks it is 206 673 (NOTES.md, deviations).

## Steps

`steps(p)`: obrisana 6, inodi 5, inodi-kratko 4 (`sim.json` `steps`: 6, the default preset).
