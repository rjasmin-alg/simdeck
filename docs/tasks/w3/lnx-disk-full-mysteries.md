# lnx-disk-full-mysteries: "Disk full" with free space

| | |
|---|---|
| Task | `lnx-disk-full-mysteries` (wave 3, Linux) |
| Catalogue entry | `lnx-disk-full-mysteries` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-disk-full-mysteries/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `filesystems` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-links-inodes` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **inode exhaustion, and a deleted file still open**.

The student: fill a disk both ways, find the cause.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-links-inodes/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/11-diskovi-i-datotecni-sustavi.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-11/`
- UL ch11 "Datotečni sustavi: ext4 i XFS" → "Što treba znati" (`mkfs.ext4 /dev/vdb1`: 261 888 4k blocks, 65 536 inodes) and "Montiranje, `/etc/fstab` i UUID" → "Šire o temi" (`df -h /mnt/vjezba /`, `du -sh`, `df` before `du`, a deleted file still open)
- UL ch05 "Primjer 3 — prostor koji se ne vraća" and section "Rad s datotekama i direktorijima" (the two freeing conditions; `/home/rjasmin/projects/uvod-u-linux/book/chapters/05-datoteke-staze-i-tekst.md`)
- UL ch12 "Zauzeće, kvote i odlagalište memorije" → "Što treba znati" (`df` vs `du`; `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`)
- e2fsprogs "mke2fs(8)" (`-i`, `-N`); "mkfs.xfs(8)" (`-i maxpct`); Linux man-pages "open(2)"/"write(2)" ENOSPC; "lsof(8)" `+L1`
- Catalogue seed: UL ch11, ch23 (ch23 has no disk-full material)

## Model and presets

- **Scene:** one filesystem, the book's `/dev/vdb1` ext4 on `/mnt/vjezba` (989M, 261 888 blocks of 4 KiB, 65 536 inodes). Two gauges side by side: **blocks** (what `df -h` reports) and **inodes** (what `df -i` reports). Under them the directory tree with `du` sizes, and a process strip (`app`, PID) with its open file descriptors. A tool panel shows the output of the command of this step (`df -h`, `df -i`, `du -sh`, `lsof +L1`, the failing write's error).
- **Reuse from `lnx-links-inodes`:** directory entries → inodes, link count, open-by count and the freeing rule (count 0 **and** not open). New here: a filesystem with a fixed number of blocks and inodes, `df` vs `du`, ENOSPC.
- **State:** `{ fs: { type: "ext4"|"xfs", blocks, blocksUsed, inodes, inodesUsed }, dirs, inodes: { ino: { nlink, openBy, blocks } }, procs: [{ pid, cmd, fds: [ino] }], lastError: null | "ENOSPC", tool: { cmd, out: [lines] }, lastEvent }`.
- **One step:** one action (a write burst, `rm`, a diagnostic command, a fix) and its effect on both gauges, in order: (1) allocation or freeing of inodes and blocks; (2) whether a write failed and why; (3) the tool output.
- **Rules:**
  1. A file needs one inode, plus data blocks for its content: a non-empty file uses at least one 4 KiB block, an empty file none. Source: UL ch11 "Datotečni sustavi: ext4 i XFS" (mkfs.ext4 output: 4k blocks, 65 536 "mjesta za zapise o datotekama") (block-per-small-file: check).
  2. On ext4 the number of inodes is fixed when the filesystem is made (`mke2fs` bytes-per-inode ratio or `-N`); a fresh fs uses 11 inodes (reserved + `lost+found`). Source: e2fsprogs "mke2fs(8)" `-i`, `-N` (check the 11).
  3. A write needs a free inode (for a new file) **and** free blocks; if either runs out the call fails with `No space left on device` (ENOSPC). The error text is the same for both causes. Source: Linux man-pages "open(2)", "write(2)" ERRORS ENOSPC (check).
  4. `df` asks the filesystem (its counters); `du` adds up what it finds by walking names. They differ whenever space belongs to something without a name. Source: UL ch11 "Montiranje, `/etc/fstab` i UUID" → "Šire o temi" (`df` vs `du`, "prvo `df`, tek onda `du`"); UL ch12 "Zauzeće, kvote i odlagalište memorije".
  5. Removing a file that a process still holds open removes the name (so `du` drops) but not the blocks (so `df` stays); the blocks return when the last fd closes (process restarts, or the file is truncated through `/proc/PID/fd/N`). `lsof +L1` lists open files with link count 0. Source: UL ch05 Primjer 3 and footnotes ch5-unlink-free, ch5-unlink-postponed; lsof(8) `+L1` (check).
  6. On XFS inodes are allocated on demand (up to `imaxpct` of the space), so inode exhaustion on a small XFS fs shows up as block exhaustion instead. Source: "mkfs.xfs(8)" `-i maxpct` (check).
  7. Tie-break, diagnosis order: `df -h` first (which fs, which gauge), then `df -i` if blocks look free, then `du` inside the fs; `lsof +L1` if `df` and `du` disagree. Source: UL ch11 "Šire o temi" (order `df` → `du`); the `df -i` and `lsof` steps are derived.
- **Params:** `preset` (select), `fstype` (choice ext4 / xfs, default ext4), `fileSize` (choice 0 B / 1 B / 4 KiB / 16 KiB, size of each small file in the inode presets, default 1 B), `holdOpen` (toggle: `app` keeps `app.log` open, default on in the deleted-file preset).
- **Presets:**
  1. `obrisana-otvorena` — `app` writes `/mnt/vjezba/app.log` until the fs is full (Use% 100%, Avail 0); `rm app.log`; `df -h` still 100%, `du -sh /mnt/vjezba` ≈ 24K; `lsof +L1` shows `app.log (deleted)`; restart `app` → `df -h` back to 24K used, 1%. Derived from UL ch05 Primjer 3 and UL ch11 `df -h /mnt/vjezba` (989M / 24K / 922M); unchecked.
  2. `inodi` — a program writes 1-byte session files: after 65 525 files `touch` fails with `No space left on device`; `df -h` shows ≈ 256M used, Use% ≈ 28%; `df -i` shows IUse% 100%. Derived from the UL ch11 mkfs numbers (65 536 inodes − 11; 65 525 × 4 KiB ≈ 256 MiB; directory blocks ignored), unchecked.
  3. `inodi-prazne` — same with `fileSize` 0: `df -h` stays ≈ 1%, `df -i` 100%. Derived, unchecked.
  4. `xfs` — preset 2 with `fstype` xfs: no inode wall; the files keep coming until blocks run out (≈ 922M / 4 KiB ≈ 236 000 files) and `df -h` shows 100%. Derived, unchecked (mkfs.xfs metadata overhead not modelled).
- **Steps:** obrisana-otvorena 6 (fill, write fails, `rm`, `df` vs `du`, `lsof +L1`, restart), inodi 5 (fill, fail, `df -h`, `df -i`, clean up), inodi-prazne 4, xfs 4.
- **Legend:** the two gauges (blocks / inodes, each with its own pattern and the `df` column name); a named file vs a nameless-but-open file (hollow card with "(deleted)"); "changed" highlight = the gauge that moved in this step, and the tool line that shows it.
- **Captions:** hr: "`df -h` kaže 28 %, a `touch` javlja „No space left on device“: potrošena su sva 65 536 mjesta za zapise o datotekama, ne blokovi." en: "`df -h` says 28%, yet `touch` reports 'No space left on device': all 65,536 inodes are used, not the blocks." hr: "Ime `app.log` je nestalo, pa ga `du` više ne broji — ali `app` datoteku još drži otvorenom, pa `df` ne vraća ni bajta." en: "The name `app.log` is gone, so `du` no longer counts it — but `app` still holds the file open, so `df` gets nothing back."
- **Terms:** filesystem — datotečni sustav; inode — inode (zapis o datoteci) (check); block — blok; link count — brojač poveznica; file descriptor — datotečni deskriptor; mount point — točka montiranja; disk usage — zauzeće.
- **Misconceptions:** "No space left means no bytes left"; "`rm` frees space immediately"; "`df` and `du` must agree, so one of them is wrong" (UL ch11: "nijedan alat pritom nije pogriješio").
- **Out of scope:** ext4 reserved blocks for root (5%), quotas (→ `lnx-quotas`), files hidden under a mount point (→ `lnx-mount-layers`), logrotate `copytruncate` (→ `lnx-logrotate`), sparse files and `--apparent-size`, snapshots holding space.
- **Note for the coordinator:** the catalogue seed "UL ch23" has no disk-full material (ch23 only says "disk se puni" in its introduction); the sources are UL ch05 Primjer 3, ch11 and ch12. The book has no `df -i`, `lsof` or inode-exhaustion example; presets 2–4 are derived and need a check on the lab VM.
<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-disk-full-mysteries sims/lnx-disk-full-mysteries` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-disk-full-mysteries/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
