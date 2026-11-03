<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-rsync-delete: SPEC

One concept: **`src` vs `src/`, and how `--delete` mirrors a mistake.** A trailing slash on the source decides whether
the contents or the directory itself arrive; `--delete` makes the destination equal to the source as it is now,
mistakes included, and inside whatever the command names as the destination.

Task: `docs/tasks/w3/lnx-rsync-delete.md`. Catalogue §4.4. Related: `lnx-mirror-not-backup` (a RAID mirror is not a
backup), `backup-diff-incr` (several recovery points).

## Sources

- **UL ch15** `~/projects/uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md`, "Prijenos i
  sinkronizacija datoteka": `ls -R ~/vjezba` (`a.txt`, `pod/b.txt`), `scp` of `a.txt` (11 B) and `pod/b.txt` (6 B),
  the `sftp` listing of the server home, `rsync -avn`/`-av ~/vjezba/ …:~/vjezba-rsync/` and `rsync -av ~/vjezba
  …:~/vjezba-rsync2/` with their lists, `total size is 17`, and the `ls` of both; "Šire o temi" (`--delete` only for
  the directories being synchronised, the dry-run warning); Primjer 3 (dry run with `--delete` first, then the same
  without `-n`).
- **UL ch23** `23-odrzavanje-sustava.md`, "`rsync`: kopija kao stanje…" (`rsync -a -n -v --delete` listing: `./`, the
  directory's files, then each subdirectory followed by its contents; an empty list when in sync; quick check by size
  and modification time, `-c` by checksum) and "Više kopija u vremenu" (*recovery point*, `--link-dest`).
- **UL ch05, ch07, ch09** for what the server home holds: `proba` was a directory (ch05), `tajna` an empty file
  (ch07), `paketi/tmux-3.3a-13.20250207gitb202a2f.el10.x86_64.rpm` and `pokvaren.rpm` (400000 B, ch09).
- **rsync(1)**, as cited in ch15: DESCRIPTION (trailing slash), `--delete`, `--dry-run`.
- **rsync 3.2.7 on this machine (nuc), 2026-11-03**: the presets' commands replayed on a copy of the trees; every list
  below matches its output line for line (`NOTES.md`, "Checked against rsync").
- **DR S3** `~/projects/dr-lecture-estate/student/scenarios/S3.md` (ransomware: files get a new extension; the NAS
  mirror shows the same) and `student/configs/hq/hq-fs01/schtasks-mirror.txt` (a daily 22:00 mirror job with delete
  semantics). Student material only; the preset takes the mechanism, not the scenario's timeline or its answer.

## Model

State (`sim.js`): `{ src, dst, clock, cmd, list, changed, deleted, gone, would, srcChanged, srcGone, lastRunDry, ev,
i }`. A tree is `{ path: { kind: 'f'|'d', size, mtime, data } }`; source paths are relative to the client home
(`vjezba`, `vjezba/a.txt`, …), destination paths to the server home (`''` is the home itself).

**Start trees.** Source: `vjezba/`, `vjezba/a.txt` (11 B), `vjezba/pod/`, `vjezba/pod/b.txt` (6 B). Destination
`fresh`: the home before the book's `rsync` runs: `a.txt` (11 B, copied by `scp`, so a later mtime than the source),
`nohup.out`, `paketi/` (one `.rpm`), `pokvaren.rpm`, `proba/` (empty *(check)*), `tajna` (0 B), `vjezba-scp/`
(`a.txt`, `pod/b.txt`, `scp` copies). Destination `synced`: `fresh` after the book's two runs (`~/vjezba/` →
`~/vjezba-rsync/`, `~/vjezba` → `~/vjezba-rsync2/`), which is the home of the book's `sftp` listing.

**One step** is one action of the scenario (param `script`): a run, or an event at the source (`rm`: a file deleted;
`encrypt`: a file replaced by an encrypted one with a new extension; `wait`: time passes). Every action (event or run)
advances the clock by one tick; an event sets the mtime of what it touches (and of its parent directory). A run takes its command from
the params, except the flags its scenario names (below).

**A run** (`run(src, dst, cmd)`):
1. *File list* (rule 1): with the slash, `vjezba` is `.` and the others lose the `vjezba/` prefix; without it the
   names keep it. Each name lands at `dest root / name` (`.` = the root).
2. *created directory* `/home/student/<root>` when the root is missing (not for `~/`).
3. *Deletion* (rule 3, 6), only with `--delete`: for each directory of the file list, in list order, the entries at
   its destination that the source lacks.
4. *Transfer list* (rule 2): a directory when it is missing at the destination or its mtime differs; a file when it is
   missing or differs (size or mtime; with `checksum`, the content).
5. *Apply* unless dry run (rule 4): delete, create, copy (size, mtime, content), then every synchronised directory
   takes the source's mtime (`-a` keeps times). A directory outside the list (the home, with no slash) gets the
   clock's mtime when an entry appears or goes in it.
6. *Print* (rule 7): `sending incremental file list`, the deletions and the transfer list in walk order, a blank line, `total size is
   <sum of the source file sizes>`, ` (DRY RUN)` after it on a dry run. The `sent … bytes` line and the speedup are
   left out: they count protocol bytes the model does not have.

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | A trailing slash on the source copies the contents of the directory; without it the directory is copied by name, one level more at the destination (`vjezba/a.txt`). | ch15 listings and `ls`; rsync(1) DESCRIPTION |
| 2 | Only what differs is sent: by default size or mtime (quick check), with `-c` the checksum. A re-run with nothing changed lists nothing. | ch23; rsync(1); rsync 3.2.7 |
| 3 | `--delete` removes at the destination what the source lacks, only inside the directories being synchronised. | ch15 "Šire o temi"; rsync(1) `--delete` |
| 4 | `-n` changes nothing and prints the same list, `created directory` included; only `(DRY RUN)` at the end differs. | ch15 (the two listings); rsync(1) `--dry-run` |
| 5 | A mirror reflects the source as it is now: a file deleted or ruined at the source is deleted or ruined at the destination by the next run with `--delete`. One copy is one recovery point. | ch23 *točka oporavka*; ch15 Primjer 3 |
| 6 | Without the slash the destination root is not synchronised: `--delete` acts only inside `dest/vjezba/`. With the slash and the home as the destination, everything in the home the source lacks is in the delete list. | rsync(1) `--delete`; rsync 3.2.7 |
| 7 | **Order of the printed list:** depth first over the source: a directory's `deleting` lines, then its own line, its files by name, then its subdirectories by name, each the same way. Deletions inside one directory go in reverse name order, a deleted directory's contents before the directory itself. Names sort by code point, files before directories. With deletions in one directory only (every preset) the `deleting` lines come first. Across two directories rsync's order is not fixed (incremental recursion): 3.2.7 gave this model's order in 36 of 40 runs. | ch15 and ch23 listings; rsync 3.2.7 |

### Further tie-breaks

- A directory line is `./` for the root, `name/` otherwise; a deleted directory is `deleting name/`.
- A file that becomes a directory or the reverse is not modelled (no scenario makes one).
- The scenario's fixed flags win over the params; flags it does not name come from the params at that moment.
  Changing any param resets to step 0.
- A dry run leaves `src` and `dst` unchanged (the clock still ticks); `would` lists what the real run would delete, create and copy.
- `deleted` and `gone` hold only this step's deletions (drawn as ghosts); the next step drops them.

## Scenarios (presets) and expected numbers (checked with rsync 3.2.7)

| Preset (`script`) | Start | Steps | Fixed flags | Expected with the default params (slash on, no delete, no dry run, `~/vjezba-rsync/`) |
|---|---|---|---|---|
| `book-slash` | fresh | 2 | run 2: the slash flipped, the other directory (`vjezba-rsync` ↔ `vjezba-rsync2`, `~/` → `vjezba-rsync`) | 1: `created directory /home/student/vjezba-rsync`, `./`, `a.txt`, `pod/`, `pod/b.txt`, total 17. 2: `created directory /home/student/vjezba-rsync2`, `vjezba/`, `vjezba/a.txt`, `vjezba/pod/`, `vjezba/pod/b.txt`. `vjezba-rsync` holds `a.txt`, `pod`; `vjezba-rsync2` holds `vjezba` |
| `delete-propagates` (default) | fresh | 4 | run 3: no `--delete`; run 4: `--delete` | 1: the book's list. 2: `rm a.txt` at the source. 3: `./` only, total 6; the destination keeps `a.txt`. 4: `deleting a.txt` only; gone. Without the slash: 3 `vjezba/`, 4 `deleting vjezba/a.txt` |
| `dry-run-first` | synced | 3 | `--delete` in both runs; run 2 `-n`, run 3 not | 1: `rm a.txt`. 2: `deleting a.txt`, `./`, total 6 `(DRY RUN)`; nothing changes. 3: the same list without `(DRY RUN)`; `a.txt` gone. Without the slash: `vjezba/`, `vjezba/pod/`, `vjezba/pod/b.txt`, nothing deleted (the extra level lands inside the synced copy) |
| `wrong-destination` | synced | 1 | `~/`, `--delete`, `-n` | `deleting` `vjezba-scp/pod/b.txt`, `vjezba-scp/pod/`, `vjezba-scp/a.txt`, `vjezba-scp/`, `vjezba-rsync2/vjezba/pod/b.txt`, `vjezba-rsync2/vjezba/pod/`, `vjezba-rsync2/vjezba/a.txt`, `vjezba-rsync2/vjezba/`, `vjezba-rsync2/`, `vjezba-rsync/pod/b.txt`, `vjezba-rsync/pod/`, `vjezba-rsync/a.txt`, `vjezba-rsync/`, `proba/`, `paketi/<rpm>`, `paketi/`, `tajna`, `pokvaren.rpm`, `nohup.out` (19 lines: 19 of the home's 20 entries would go; `a.txt` stays and is re-sent, its mtime differs), then `./`, `a.txt`, `pod/`, `pod/b.txt`, `(DRY RUN)`. Without the slash: no `deleting` line, `vjezba/…` created |
| `nightly-mirror` | synced | 3 | `--delete` | 1 (21:00): `a.txt` becomes `a.txt.locked`. 2 (22:00): `deleting a.txt`, `./`, `a.txt.locked`, total 17; the good copy is gone. 3 (07:50): nothing runs; source and mirror hold the same encrypted file, and there is no older copy |

Task deviations: the `sent … bytes` line and the speedup are not printed; `proba/` is drawn empty (the book does not
show what it holds); the nightly scenario encrypts into a new name (`a.txt.locked`), as S3 describes, so the good copy
is *deleted* by the mirror, not overwritten; its times are 21:00, 22:00 and 07:50 (the task's), not S3's.

## Params

`script` (the five scenarios, default `delete-propagates`); `slash` on; `delete` off; `dryRun` off; `dest`
`rsync` (`~/vjezba-rsync/`) | `rsync2` (`~/vjezba-rsync2/`) | `home` (`~/`), default `rsync`. All `resets: true`.
A param that the scenario fixes in every run is disabled, with the reason.

## Out of scope

`--link-dest` snapshots (named in the explanation as the fix), `--backup`/`--backup-dir`, filters and `--exclude`,
daemon mode, the delta algorithm, `--delete-after`/`--delete-before` timing, file ↔ directory type changes.
