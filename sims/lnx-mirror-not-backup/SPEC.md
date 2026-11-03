<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-mirror-not-backup: SPEC

One concept: **RAID protects against disk loss, not against deletion or corruption.** A RAID 1 mirror writes
whatever the filesystem writes to every active member: a deleted, overwritten or encrypted file is deleted,
overwritten or encrypted on both disks, and `/proc/mdstat` stays `[2/2] [UU]`.

Task: `docs/tasks/w3/lnx-mirror-not-backup.md`. Catalogue §4.4, overlap §5.3 (RAID levels live in `raid-cache`).

## Sources

- **UL ch12** `~/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, section "Redundantno polje
  diskova": `mdadm --create --run /dev/md0 --level=1 --raid-devices=2 /dev/vdb /dev/vdc`, `/proc/mdstat` with
  `resync =  9.6% (201344/2094080) finish=0.1min speed=201344K/sec`, `mkfs.ext4 -q`, `mount`, `echo 'ovo je test' |
  sudo tee /mnt/polje/proba.txt`, `mdadm --fail` → `vdc[1](F)`, `[2/1] [U_]`, `State : clean, degraded`, `cat`
  still prints the file; `mdadm --re-add` → `[2/2] [UU]`; `ls -l` (`proba.txt` 12 bytes); `rm -f` → `cat: …: No such
  file or directory` (exit 1) and `/proc/mdstat` "do znaka jednak" `[2/2] [UU]`. Definitions *redundantno polje
  diskova*, *zrcaljenje*. Figure `assets/diagrams/chapter-12/granica-zastite-zrcala.svg` ("granica zaštite: zrcalo
  govori o uređajima ispod ove crte").
- **md(4)** (as cited in ch12): RAID 1 holds the same data on every device after initialisation; it survives the
  failure of all devices but one. **mdadm(8)**: "can survive some degree of device failure".
- **md driver, `status_resync`** (linux `drivers/md/md.c`): the bar is `x = per_milli / 50` `=` signs, `>`, then
  `20 − x` dots; the percentage is per mille printed `%3u.%u` (truncated); `finish` is whole seconds `rt` printed as
  `rt / 60` `.` `(rt % 60) / 6` min. With ch12's numbers this gives the book's line exactly (checked by test).
- **DR S3** `~/projects/dr-lecture-estate/student/scenarios/S3.md`: ransomware; files get a new extension and a README
  in every folder; "Z: (the NAS mirror) shows the same". `student/configs/hq/hq-fs01/schtasks-mirror.txt`: that mirror
  is a file-level copy (`lnx-rsync-delete`), not RAID; only the shape of the event is used here.
- Status words from `ossimulator/docs/specs/12-raid-cache.md`: disk ok / failed / rebuilding (here `resync`, md's
  word); array optimal / degraded / failed.

## Model

Two disks `vdb` (role 0) and `vdc` (role 1), 2 GiB each, drawn as their first 8 blocks. Block 0 holds the
filesystem's metadata (superblock, bitmaps, inodes, directory: one cell for all of it, *schematic*); each file takes
two data blocks (the task's "two blocks per file", *schematic*: a 12-byte file needs one data block in ext4). A disk
block is `null` (never written) or `{ tag, data }`: the disk stores bytes and knows nothing of files.

State: `{ created, resync, mounted, fs: { meta, files: [{ name, size, blocks, tag }] }, disks: [{ name, status:
'ok'|'failed'|'resync', blocks }], array: 'none'|'optimal'|'degraded'|'failed'|'resync', mdstat, cat, backup:
null|{ files }, i, ev }`.

One step = one command (or event) of the preset's script, in three phases:

- **(a)** the command acts on its layer: device layer `mdadm --create`, `--fail`, `--re-add`, a disk dying; filesystem
  layer `mkfs.ext4`, `mount`, `tee`, `rm`, an application or a malicious program writing; network `cp` to a second
  machine.
- **(b)** a filesystem write goes through md to every active member: block 0 (metadata version + 1) plus the file's
  data blocks.
- **(c)** recompute the array state and `/proc/mdstat`, and run `cat /mnt/polje/proba.txt`.

Before phase (a) of any command after `--create`, a running initial resync completes (time passes between commands:
`finish=0.1min`).

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | After initialisation every member holds the same data; a filesystem write goes to every **active** member (status not `failed`; a member still resyncing is active). | ch12, *zrcaljenje*; md(4) |
| 2 | `--create` starts a resync: array `resync`, `vdc` `resync`, mdstat `[2/2] [UU]` plus the line `[=>...................]  resync =  9.6% (201344/2094080) finish=0.1min speed=201344K/sec`. The mirror is something the array becomes. The next command finds it done. | ch12 |
| 3 | `--fail` marks a member failed: `(F)`, `[2/1]`, map `_` at its role (`[U_]` for vdc, `[_U]` for vdb), array `degraded` (`State : clean, degraded`). A failed member takes no writes; reads come from the first active member; the file stays readable. | ch12; md(4) |
| 4 | `--re-add` brings a failed member back: it is resynced from the active member (every block copied, the ones that differ counted), `[2/2] [UU]`, `optimal`. | ch12 |
| 5 | `rm` is a filesystem write: the directory entry goes (block 0 written on both members); the data blocks are freed, not erased (both disks still hold the bytes, nothing points at them). mdstat identical to the step before; `cat` fails `No such file or directory`, exit 1. | ch12 Primjer 3 / "Drugi je događaj kraći" |
| 6 | An application writing wrong bytes, or a malicious program encrypting and renaming to `*.locked`, is a filesystem write like any other: both members hold the wrong bytes; mdstat `[2/2] [UU]`. Failing either member and reading the other gives the same wrong bytes. | derived from rule 1 |
| 7 | When no member is active the array is `failed`: mdstat `[2/0] [__]` with `(F)` on both *(check)*; `cat` fails with an I/O error *(check)*; writes fail. | md(4) |
| 8 | Only a copy outside the array, taken **before** the event, restores the file; the restore is again a filesystem write mirrored to both members. A copy taken after the delete has nothing to copy. | ch12 Primjer 3 ("treba potražiti drugi mehanizam"); ch23 *točka oporavka* |

### Tie-breaks

- `--fail` on the **last** active member is refused (no change, `ev.refused`): md keeps the last working member of a
  RAID 1 *(check: recent kernels)*. A disk that **dies** is not refused (rule 7), which is why `two-failures` uses a
  death for the second disk.
- `--fail` of an already failed member, `--re-add` of a member that is not failed: no change (`ev.noop`).
- `--re-add` with no active member left: refused.
- Any filesystem write on a failed array (rule 7) fails with EIO and changes nothing, not even the file list (an
  encryption does not rename, a new file is not listed).
- A `cp` to the second machine creates it with its first copy, in any scene.
- `rm -f` of a missing file: nothing written, exit 0 (`-f`).
- Reads go to the first active member in role order (vdb before vdc).
- Allocation: a new file takes the two lowest blocks the filesystem does not point at (freed blocks are reused).
- Not mounted: `/mnt/polje` is an empty directory on the root filesystem, so `cat` says `No such file or directory`.
- `mount` writes nothing in this model (a real ext4 mount updates its superblock: left out, it changes nothing here).

## Presets (expected numbers)

| Preset | Start | Steps | Script → expected |
|---|---|---|---|
| `book-primjer3` | blank disks, no array | 7 | `--create` (resync 9.6 %) → `mkfs.ext4` (resync done; block 0 on both) → `mount` → `tee proba.txt` (blocks 0, 1, 2 on both; `cat` "ovo je test") → `--fail vdc` (`[2/1] [U_]`, readable from vdb) → `--re-add vdc` (`[2/2] [UU]`, 0 blocks differed) → `rm -f` (block 0 on both, blocks 1–2 freed, `[2/2] [UU]` unchanged, `cat` exit 1) |
| `corruption` | healthy mirror with proba.txt | 4 | application overwrites proba.txt with 12 wrong bytes (blocks 0–2 on both, `[UU]` unchanged) → `--fail vdb` (`[2/1] [_U]`, vdc gives the wrong bytes) → `--re-add vdb` (`[UU]`) → `--fail vdc` (`[U_]`, vdb gives the wrong bytes) |
| `ransomware-mirror` | healthy mirror with proba.txt, vjezba.txt | 4 | encrypt proba.txt → proba.txt.locked (blocks 0–2 on both; `cat` No such file) → encrypt vjezba.txt (0, 3, 4) → README.txt written (0, 5, 6) → `--fail vdc`: the survivor holds the same `.locked` files |
| `two-failures` | healthy mirror with proba.txt | 3 | `--fail vdc` (`[U_]`, readable) → `tee -a` a second line (vdb only; vdc stale) → vdb dies (`[2/0] [__]`, array failed, `cat` I/O error) |
| `with-backup` | blank disks, no array, an empty second machine | 9 | `book-primjer3`'s first six → `cp` proba.txt to the second machine → `rm -f` (as rule 5) → `cp` back (blocks 0, 1, 2 on both; `cat` "ovo je test") |

The task file gave `two-failures` 4 steps and `with-backup` 8; see NOTES.md "Deviations".

## Params

`scene` (the preset script, hidden), `showLayers` toggle (default on): labels the two layers "datotečni sustav" /
"uređaj" beside the boundary line.
