# lnx-mirror-not-backup: A mirror is not a backup

| | |
|---|---|
| Task | `lnx-mirror-not-backup` (wave 3, Linux) |
| Catalogue entry | `lnx-mirror-not-backup` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-mirror-not-backup/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL, DR |
| Topic / tags / level | `linux-admin` / `raid`, `backup` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **RAID protects against disk loss, not deletion or corruption**.

The student: delete a file on a healthy mirror.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-12/`
- Catalogue seed: UL ch12 (granica-zastite-zrcala.svg) → §5.3
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, section "Redundantno polje diskova" (`mdadm --create`, `/proc/mdstat`, `--fail`, `--re-add`, `rm`; definitions *redundantno polje diskova*, *zrcaljenje*) and Primjer 3 ("polje je zdravo, datoteke nema"); figure `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-12/granica-zastite-zrcala.svg`
- md(4) (levels and how many device failures each survives), mdadm(8) ("can survive some degree of device failure"), as cited in ch12
- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S3.md` (ransomware; the NAS mirror shows the same) and `/home/rjasmin/projects/dr-lecture-estate/student/configs/hq/hq-fs01/schtasks-mirror.txt`
- `/home/rjasmin/projects/ossimulator/docs/specs/12-raid-cache.md` (disk and array status vocabulary to reuse)

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Model and presets

- **Scene (K3 block grid):** two rows of blocks, `vdb` and `vdc` (2 GiB each), joined under `md0` (raid1) with the filesystem `/mnt/polje` (ext4) above them showing its file list; one file `proba.txt` ("ovo je test") occupies two blocks on each disk. Right: the live `/proc/mdstat` line (`md0 : active raid1 vdc[1] vdb[0]` / `[2/2] [UU]`) and the result of `cat /mnt/polje/proba.txt`. A dashed line between the filesystem and the array is the "boundary of protection" from the book's figure `granica-zastite-zrcala.svg`. Optional third box: an off-array copy (backup) for the contrast preset.
- **State:** `{ disks: [{ name, status: 'ok'|'failed'|'resync', blocks: [{ file, data }] }], fs: { files: [{ name, data }] }, mdstat: { n, of, map: 'UU'|'U_'|'_U'|'__' }, array: 'optimal'|'degraded'|'failed'|'resync', backup: null|{ files }, lastCat }`. Status words follow `ossim-raid-cache` (ok / failed / rebuilding; optimal / degraded / failed).
- **One step:** one command from the preset's script, in the book's order. Phases: (a) the command acts on its layer (device layer: `mdadm --fail`, `--re-add`; filesystem layer: `tee`, `rm`, an application writing bad data); (b) a write at the filesystem layer goes through md to every active member; (c) recompute `/proc/mdstat` and run `cat`.
- **Rules:**
  1. RAID 1: after initialisation every member holds the same data; a write goes to all active members. (ch12 "Redundantno polje diskova", definition *zrcaljenje*; md(4))
  2. Creation starts a resync (`resync = 9.6%`): the mirror is something the array becomes, not is. (ch12 `/proc/mdstat` after `mdadm --create`)
  3. A failed member stops receiving writes; `/proc/mdstat` shows `(F)`, `[2/1] [U_]`, `mdadm --detail` `State : clean, degraded`; reads come from the survivor, the file is still readable. RAID 1 survives the failure of all members but one. (ch12; md(4) levels)
  4. `mdadm --re-add` brings the member back and resyncs it: `[2/2] [UU]`. (ch12)
  5. Deleting a file is a filesystem write: md mirrors it to both members; `/proc/mdstat` stays `[2/2] [UU]` and `cat` fails with `No such file or directory`. (ch12 Primjer 3)
  6. An application writing wrong content (or ransomware encrypting it) is mirrored the same way: both copies are wrong and the array is healthy. (derived from rule 1)
  7. Both members failed: array failed, data unreachable. (md(4))
  8. Only a copy outside the array (taken before the event) restores the file. (ch12 Primjer 3 "treba potražiti drugi mehanizam"; ch23 *točka oporavka*)
- **Params:** none beyond presets; one `toggle` `showLayers` (default on) that labels the two layers "uređaj" / "datotečni sustav".
- **Presets:**
  - `book-primjer3` — `mdadm --create` (resync) → `mkfs.ext4`+`mount` → `tee proba.txt` → `mdadm --fail /dev/md0 /dev/vdc` (`[2/1] [U_]`, file readable) → `--re-add` (`[2/2] [UU]`) → `rm -f proba.txt` (`[2/2] [UU]`, `cat` fails, exit 1). From ch12 (section and Primjer 3).
  - `corruption` — healthy mirror, the application overwrites `proba.txt` with garbage: both disks hold garbage, `[UU]`. Derived, unchecked.
  - `ransomware-mirror` — the same with every file renamed `*.locked`: the mirror copies the encryption. Ties to DR scenario S3 (the NAS mirror Z: shows the same encryption; that one is a file-level mirror, see `lnx-rsync-delete`). Derived from dr-lecture-estate S3.
  - `two-failures` — `vdc` fails, then `vdb` dies (a real disk death, not `mdadm --fail`, which recent kernels may refuse on the last working member (check)): array failed, data unreachable. Derived from md(4), unchecked.
  - `with-backup` — `book-primjer3` plus a copy of `proba.txt` taken to a second machine before `rm`: after `rm` the mirror has nothing, the copy restores it. Derived, unchecked.
- **Steps:** `book-primjer3` 7, `corruption` 4, `ransomware-mirror` 4, `two-failures` 4, `with-backup` 8.
- **Legend:** data block (solid, labelled with file), failed disk (crossed pattern + "(F)"), resyncing block (striped, progress), deleted/garbage block (hatched red + "×"), boundary line. "Changed" marks the blocks written in this step on each disk, and the `/proc/mdstat` field that changed (or a "no change" tag when it didn't, which is the point of rule 5).
- **Captions:**
  - HR: „Datoteka je obrisana, a `/proc/mdstat` i dalje kaže `[2/2] [UU]`. Brisanje je pisanje kroz datotečni sustav, i zrcalo ga je uredno upisalo na oba diska.“
  - EN: "The file is gone and `/proc/mdstat` still says `[2/2] [UU]`. A delete is a write through the filesystem, and the mirror faithfully wrote it to both disks."
- **Terms:** mirroring — zrcaljenje; RAID — redundantno polje diskova; degraded — oslabljeno (degraded); device failure — kvar uređaja; recovery point — točka oporavka; backup — sigurnosna kopija; resync — ponovno usklađivanje (check).
- **Misconceptions:** "we have RAID, so we have a backup"; a healthy `/proc/mdstat` means the data is fine; a second disk protects against mistakes.
- **Out of scope:** RAID levels and parity (`ossim-raid-cache`), rebuild time and UREs (`lnx-raid-rebuild`), checksums that can tell good from bad copies (`lnx-zfs-self-heal`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-mirror-not-backup sims/lnx-mirror-not-backup` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-mirror-not-backup/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
