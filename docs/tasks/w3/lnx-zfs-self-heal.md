# lnx-zfs-self-heal: Checksums and self-healing

| | |
|---|---|
| Task | `lnx-zfs-self-heal` (wave 3, Linux) |
| Catalogue entry | `lnx-zfs-self-heal` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-zfs-self-heal/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `filesystems` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-cow-filesystem` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **a scrub finds a bad block and repairs it from the mirror**.

The student: corrupt a block, scrub.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-cow-filesystem/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T23 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T23
- NLA row T23 ("ZFS na Linuxu — bazeni, `datasets`, provjera integriteta, licenčno pitanje") (no chapter yet; rules above are (check))
- OpenZFS manual pages: zpoolconcepts(7), zfsconcepts(7), zpool-scrub(8), zpool-status(8), zfsprops(7) (`checksum`, `copies`); md(4) (`mismatch_cnt`, for the contrast)
- Related lab: `/home/rjasmin/projects/single-page-labs/zfs-btrfs-topology-lab.html` (scrub and repair "when a redundant good copy exists")

## Model and presets

- **Reuses from `lnx-cow-filesystem`:** its block grid and the tree of block pointers (root → indirect → data blocks), where a write never overwrites in place. New here: every pointer carries the checksum of the block it points to, a mirror keeps two copies, and reads and scrubs compare the two.
- **Scene (block grid):** pool `tank` with vdev `mirror-0` of two disks, `sda` and `sdb`, as two rows of 8 data blocks each (same content on both); above them the pointer tree with the stored checksum on each pointer; one file `film.mkv` spans blocks 3–6. Right: a `zpool status`-style panel (`state: ONLINE`, per device `READ WRITE CKSUM`, `scan:` line, `errors:` line). A "corrupt" tool marks one block copy as silently changed (bit rot); a scrub cursor walks the blocks.
- **State:** `{ disks: [{ name, blocks: [{ data, rotten }] }], ptrs: [{ block, sum }], counters: { sda: { read, write, cksum }, sdb: {…} }, scrub: null|{ at, repaired, errors }, permanent: [blocks], redundancy: 'mirror'|'single'|'md-mirror', last }`.
- **One step:** one action or one scrubbed block: corrupt a copy; an application read of a block; or the scrub advancing one block. A read/scrub of a block: read copy 1, verify against the pointer's checksum; if bad, read copy 2, verify; repair or report.
- **Rules:**
  1. Each block pointer stores the checksum of the block it points to (default fletcher4, `sha256` optional), so a block is checked by its parent, not by itself. (zfsprops(7) `checksum`; zfsconcepts(7), check)
  2. On read, a copy whose checksum does not match is rejected; on a mirror the other copy is read and, if it matches, returned to the application, and the bad copy is rewritten from it (self-healing); the bad device's `CKSUM` counter goes up. The application sees no error. (zpoolconcepts(7), check)
  3. A scrub reads every allocated block on every copy and repairs as in rule 2; free space is not checked. (zpool-scrub(8))
  4. If no copy matches, the error is permanent: `zpool status -v` lists the affected file under "Permanent errors have been detected". (zpool-status(8), check wording)
  5. A single-disk pool detects the bad block but cannot repair it, unless the dataset keeps extra copies (`copies=2`). (zfsprops(7) `copies`)
  6. Contrast `md-mirror`: an md RAID 1 has no checksums, so with two different copies it cannot tell which one is right; a check only counts mismatches. (md(4) `mismatch_cnt`, check; `lnx-mirror-not-backup`)
  7. Tie-break: the copy on the first device of the vdev is read first; if both are bad the block is reported once, not per copy.
- **Params:** `redundancy` choice `mirror` | `single` | `md-mirror`, default `mirror`; `copies2` toggle (only for `single`), default off. Actions come from presets.
- **Presets:**
  - `scrub-repairs` — rot blocks 3 and 5 on `sdb`; scrub 8 blocks: both repaired from `sda`, `sdb CKSUM 2`, "scrub repaired 2 blocks with 0 errors", `errors: No known data errors`. Derived, unchecked (real output gives bytes, e.g. `repaired 8K`).
  - `read-heals` — rot block 4 on `sda`; the application reads `film.mkv`: block 4 comes from `sdb`, `sda` is rewritten, `sda CKSUM 1`; no scrub needed. Derived, unchecked.
  - `both-bad` — rot block 6 on both disks; scrub: permanent error in `film.mkv`. Derived, unchecked.
  - `single-disk` — `redundancy` single, rot block 3: detected (`CKSUM 1`), not repaired, permanent error; with `copies2`: repaired. Derived, unchecked.
  - `md-contrast` — `md-mirror`, rot block 3 on one disk: the check finds a mismatch but cannot say which copy is right; a read may return the bad one. Derived from md(4), unchecked.
- **Steps:** `scrub-repairs` 10 (2 corruptions + 8 scrubbed blocks), `read-heals` 6, `both-bad` 10, `single-disk` 6, `md-contrast` 6.
- **Legend:** good copy (solid), rotten copy (hatched with ⚡ mark), checksum on pointer (small tag), checksum match (check) / mismatch (×), repaired copy (solid with ↺ mark), permanent error (red frame + file name), scrub cursor (arrow). "Changed" marks the block copies read or rewritten in this step and the counters that changed.
- **Captions:**
  - HR: „Kontrolni zbroj bloka 3 na `sdb` ne odgovara onome zapisanom u pokazivaču. Kopija na `sda` odgovara, pa se blok vraća iz nje i `sdb` se prepisuje ispravnim sadržajem.“
  - EN: "Block 3 on `sdb` does not match the checksum stored in its pointer. The copy on `sda` does, so the block is returned from it and `sdb` is rewritten with the good content."
- **Terms:** checksum — kontrolni zbroj (UL ch09); pool — bazen (NLA toc T23); integrity check (scrub) — provjera integriteta (NLA toc T23); mirror — zrcalo; self-healing — samoizlječenje (check); silent corruption — tiho oštećenje (check); block pointer — pokazivač na blok (check).
- **Misconceptions:** a mirror always knows which copy is right (only with checksums); a scrub is a backup (it repairs from redundancy, it does not restore deleted data); "no read errors" means no bad data.
- **Out of scope:** RAID-Z, ditto blocks for metadata, resilvering after disk replacement, scrub scheduling, licence question (T23 names it).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-zfs-self-heal sims/lnx-zfs-self-heal` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-zfs-self-heal/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
