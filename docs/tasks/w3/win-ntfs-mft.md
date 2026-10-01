# win-ntfs-mft: NTFS MFT

| | |
|---|---|
| Task | `win-ntfs-mft` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-ntfs-mft` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-ntfs-mft/` |
| Class | reference |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `filesystems` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **MFT records, resident vs non-resident data, alternate data streams**.

The student: create small and large files, add an ADS.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.

## Sources

- No local course material on NTFS (UL ch11 covers ext4 and XFS: *Datotečni sustavi: ext4 i XFS*, for the inode/block contrast). Use the vendor's documentation; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn, *Master File Table (Local File Systems)*; *File Streams (Local File Systems)*; *Default cluster size for NTFS, FAT, and exFAT*; *NTFS overview* (check titles).
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/11-diskovi-i-datotecni-sustavi.md`, „Datotečni sustavi: ext4 i XFS" (inode and block terms for comparison).

## Model and presets

- **Scene:** left, the MFT as a column of numbered 1 KiB records (0–15 system metafiles greyed with their names,
  user files from record 64 (check)); right, the selected record opened as a stack of attributes
  (`$STANDARD_INFORMATION`, `$FILE_NAME`, `$DATA` unnamed, named `$DATA` streams); bottom, the volume's clusters
  (4 KiB each) as a strip, with the clusters a non-resident `$DATA` uses. Reference page with a small explorer.
- **State:** `{ recordSize: 1024, clusterSize: 4096, files: [{record, name, streams: [{name, size, resident,
  runs: [{lcn, len}]}]}], selected, freeClusters: [] }`.
- **Params drive live:** creating a file of a chosen size, growing it, or adding a named stream updates the
  record view and the cluster strip.
- **Rules:**
  1. Every file and directory has at least one MFT record; the MFT itself is a file (record 0) (Microsoft Learn,
     *Master File Table (Local File Systems)*).
  2. Records 0–15 are reserved for metafiles: `$MFT` 0, `$MFTMirr` 1, `$LogFile` 2, `$Volume` 3, `$AttrDef` 4,
     root directory 5, `$Bitmap` 6, `$Boot` 7, `$BadClus` 8, `$Secure` 9, `$UpCase` 10, `$Extend` 11 (same doc (check)).
  3. A record is 1 KiB by default (check; 4 KiB on 4Kn disks); the default cluster is 4 KiB (Microsoft Learn,
     *Default cluster size for NTFS, FAT, and exFAT* (check)).
  4. Small data is resident: it is stored inside the record when it fits after the other attributes (about 700
     bytes in a 1 KiB record; model threshold 700 B (check)).
  5. Larger data is non-resident: the record holds runs (start cluster, length); clusters = ⌈size / 4096⌉. A
     stream that became non-resident does not move back when it shrinks (check).
  6. An alternate data stream is another, named `$DATA` attribute of the same record (`file.txt:name`);
     Explorer and `dir` show only the unnamed stream's size; `dir /r` and `Get-Item -Stream *` list all streams
     (Microsoft Learn, *File Streams (Local File Systems)*). Downloaded files carry a `Zone.Identifier` stream
     (Mark of the Web) (check).
  7. Run allocation in the model: first free clusters in order; fragmentation only via the `fragmented` preset
     (decision).
- **Params:** `size` select 100 B / 600 B / 2 KiB / 10 000 B / 1 MiB (100 B); `grow` button (+4 KiB); `ads` choice
  none / Zone.Identifier / 5 MiB stream (none); `recordSize` choice 1 KiB / 4 KiB (1 KiB).
- **Presets:**
  - `small` `bilj.txt`, 100 B: resident in its record, 0 clusters. Derived from rule 4.
  - `large` `slika.png`, 10 000 B: non-resident, one run of ⌈10000/4096⌉ = 3 clusters. Derived, checked by hand.
  - `grow` 600 B file grows past the threshold: becomes non-resident, 1 run of 2 clusters for 4.6 KiB (600 + 4096 B).
    Derived, unchecked.
  - `mark-of-web` downloaded `setup.exe` with stream `Zone.Identifier` = `[ZoneTransfer]` / `ZoneId=3`, resident.
    From rule 6, (check).
  - `hidden-size` 1 KiB file with a 5 MiB named stream: Explorer shows 1 KiB, the volume loses 1280 clusters.
    Derived, checked (5 MiB / 4 KiB = 1280).
  - `fragmented` a 3-run file: runs (100, 2), (340, 1), (512, 4). Derived.
- **Steps:** explorer, 0.
- **Legend:** metafile record (grey, name), user record (filled), attribute (row in the record), resident data
  (inside the record), run (arrow from record to clusters), named stream (tag shape), changed (kit highlight on the
  record, attribute and clusters touched by the last action).
- **Captions:** hr: "Datoteka od 100 B stane u sam zapis MFT-a: podaci su rezidentni, nijedan klaster nije zauzet."
  / en: "A 100-byte file fits in its MFT record: the data is resident, no cluster is used." — hr: "Imenovani tok
  od 5 MiB: Explorer pokazuje 1 KiB, a na disku je zauzeto 1280 klastera." / en: "A 5 MiB named stream: Explorer
  shows 1 KiB, while 1280 clusters are used on disk."
- **Terms:** Master File Table — glavna tablica datoteka (MFT) *(check)*; record — zapis; attribute — atribut;
  resident — rezidentan *(check)*; cluster — klaster *(check; UL ch11 uses blok for ext4)*; data run — niz
  klastera *(check)*; alternate data stream — zamjenski tok podataka *(check)*; metafile — metadatoteka *(check)*.
- **Misconceptions:** a file's size in Explorer is all it holds; every file uses at least one cluster; the MFT is
  separate from the files it describes.
- **Out of scope:** NTFS permissions (`win-ntfs-share-effective`), `$LogFile` journaling, compression and sparse
  files, ReFS, forensics of deleted records.
- **Note for the coordinator:** the task names kit view K4 (rule table) and tag `permissions`; this sim is a record
  and cluster layout, so K3 (block grid) fits better, and `filesystems` alone is the right tag.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ntfs-mft sims/win-ntfs-mft` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ntfs-mft/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
