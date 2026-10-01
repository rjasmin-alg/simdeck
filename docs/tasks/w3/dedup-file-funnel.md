# dedup-file-funnel: Finding duplicate files

| | |
|---|---|
| Task | `dedup-file-funnel` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-dedup-file-funnel` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/dedup-file-funnel/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | DR |
| Topic / tags / level | `storage` / `deduplication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dedup-chunking` is merged and reuse its model (COMMON.md §6); uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **size → partial hash → full hash, false positives at each stage**.

The student: run the funnel over a file set.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/dedup-chunking/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/filesearcher/idea.md`: §4 "Hashing modes", §8 "Duplicate grouping strategies" and
  "Oldest copy logic", "Prompt C — Quick hash worker" (first 4 MB + last 4 MB, SHA-256, size as salt)
- `~/projects/uvod-u-linux/book/chapters/23-odrzavanje-sustava.md` ("sažetak" for `sha256sum`) and
  `11-diskovi-i-datotecni-sustavi.md` (inode) for the Croatian terms
- Catalogue seed: filesearcher idea.md → §5.3

## Overlaps (catalogue §5)

- **§5.3 Backup, dedup and redundancy:** Block-level dedup (B1) and file-level dedup (funnel) are different concepts; keep both, link them. lnx-send-receive is a preset of sto-backup-diff-incr. The restore drill and lnx-exit-status's pipefail case show the same failure (a job that lies); build the restore drill and link the pipefail preset to it. RAID levels live in ossim-raid-cache: link it rather than building RAID again; build only lnx-mirror-not-backup and lnx-raid-rebuild, which it doesn't cover.

## Model and presets

- **Scene:** a file list on the left (path, size, inode, mtime), and a **funnel** of four stages drawn as
  narrowing bands: (0) same inode → one file, (1) group by size, (2) partial hash, (3) full hash. Each file
  is a card that drops into its group or falls out sideways with the reason ("unique size", "partial hash
  differs", "full hash differs"). A bytes-read meter per stage. Reuses the K3 block grid only to draw a
  file's first/last blocks being read in stage 2 (the chunk rows of `dedup-chunking` are not needed).
- **State:** `{ files: [{id, path, size, inode, mtime, blocks: string[]}], stage: 0..4, groups: {key,
  members[]}[], eliminated: [{id, stage, reason}], bytesRead: [n0,n1,n2,n3], cursor }`. A file's content is
  a short array of block labels (e.g. `['H1','P','P','F1']`) so equality is visible.
- **One step:** one decision: stage 0 collapses hard links (one step); stage 1 forms one size group per
  step; stage 2 and 3 hash one file per step and place it; the last step lists confirmed duplicate groups
  and the canonical copy of each.
- **Rules:**
  1. Paths with the same (device, inode) are one file, not duplicates; keep one entry (standard; filesearcher
     `idea.md` §4 collects inode/file-id) (check).
  2. Only files whose size matches another file can be duplicates; a unique size leaves the funnel without
     being read (filesearcher `idea.md` §8 "weak: size + …").
  3. Zero-length files are reported as their own group and never hashed (derived; they are trivially equal).
  4. Partial hash = hash of the first N and the last N bytes, salted with the size; files whose partial
     hashes differ are not duplicates (filesearcher `idea.md` "Prompt C": first 4 MB + last 4 MB, SHA-256,
     size as salt). If size ≤ 2N the partial hash reads the whole file and is final.
  5. Full hash (SHA-256 of all bytes) decides; equal full hash = duplicate (filesearcher §8 "strong:
     full_hash"). Hash collisions are out of scope.
  6. Each surviving group's canonical copy is the one with the earliest mtime; tie → the endpoint/path with
     higher user priority, then lexicographic path (filesearcher §8 "Oldest copy" logic; the path tie-break
     is ours).
  7. Stages only remove candidates: a pair split at stage k is never compared again (derived).
- **Params:** `partialN` choice 4 KiB / 1 MiB / 4 MiB (default 4 MiB, sizes in the presets scale with it);
  `skipPartial` toggle (off) to show what stage 2 saves; `hardlinks` toggle "collapse hard links" (on).
- **Presets** (derived, unchecked; sizes chosen so each stage removes one false positive):
  1. `funnel` — 9 paths: `a/report.pdf` 12 MiB, `b/report-copy.pdf` 12 MiB (same content), `c/video.mkv`
     12 MiB (different start), `j/report.pdf` (hard link to `a/report.pdf`), `d/disk.img` and
     `e/disk-old.img` 700 MiB (same first and last 4 MiB, different middle), `f/photo.jpg` 3 MiB,
     `g/photo (1).jpg` 3.1 MiB, `h/notes.txt` and `i/empty.log` 0 B. Stage 0: `j` folds into `a`. Stage 1:
     photos leave (unique sizes), empty files reported apart. Stage 2: `video.mkv` leaves (**size was a false
     positive**). Stage 3: `disk-old.img` leaves (**partial hash was a false positive**). Result: one group
     {`a/report.pdf`, `b/report-copy.pdf`}, canonical = older mtime. Bytes read: stage 2 = 5 × 8 MiB =
     40 MiB; stage 3 = 2 × 12 + 2 × 700 = 1424 MiB.
  2. `no-hardlink-check` — same set with `hardlinks` off: `j/report.pdf` is reported as a duplicate, and
     "deleting" it would delete nothing (rule 1).
  3. `skip-partial` — same set with stage 2 off: stage 3 reads `video.mkv` in full too (1436 MiB instead of
     1424 + 40); with many same-size large files the partial stage is what saves the reads (derived).
  4. `photo-burst` — 6 camera files of exactly 4,194,304 B (same size, different content): every one passes
     stage 1 and all leave at stage 2; shows why size alone is a weak signal (derived).
- **Steps:** `funnel` 1 (hard links) + 3 (size groups) + 5 (partial) + 4 (full) + 1 (result) = 14;
  `no-hardlink-check` 15; `skip-partial` 10; `photo-burst` 9.
- **Legend:** file card (rectangle), hard-link badge (chain icon), eliminated (struck through, with reason
  label), surviving candidate (solid), confirmed duplicate (double outline), canonical copy (star). "Changed"
  marks the file or group decided in this step.
- **Captions:**
  - hr: „`video.mkv` ima istu veličinu kao `report.pdf`, ali djelomični sažetak (*partial hash*) prvih i
    zadnjih 4 MiB se razlikuje: nije duplikat, i ostatak datoteke ne treba ni čitati."
  - en: "The two disk images agree on their first and last 4 MiB, so only the full hash can tell them apart:
    1.4 GiB read for this one decision."
- **Terms:** duplicate file — duplikat (datoteka); hash/digest — sažetak (UL ch23); partial hash —
  djelomični sažetak; full hash — puni sažetak; hard link — čvrsta poveznica (UL ch23 "Više kopija u vremenu"); inode — inode
  (UL ch11 keeps the English word); false positive — lažno pozitivan rezultat; canonical copy —
  izvorni primjerak.
- **Misconceptions:** "same size and name means same file"; "a matching partial hash proves a duplicate";
  "two paths are two copies" (hard links).
- **Out of scope:** block/chunk-level dedup (link `dedup-chunking`), deletion scripts, remote connectors
  (SMB/SFTP), similarity search for near-duplicates, hash collisions.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh dedup-file-funnel sims/dedup-file-funnel` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dedup-file-funnel/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
