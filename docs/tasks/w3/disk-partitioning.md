# disk-partitioning: MBR vs GPT

| | |
|---|---|
| Task | `disk-partitioning` (wave 3, Linux) |
| Catalogue entry | `lnx-partition-tables` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/disk-partitioning/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `partitioning` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-mount-layers` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **partition limits, protective MBR, backup header**.

The student: add partitions to each.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-mount-layers/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/11-diskovi-i-datotecni-sustavi.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-11/`
- Catalogue seed: UL ch11
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/11-diskovi-i-datotecni-sustavi.md`: section "Blokovni uređaji i particije" (`parted -s /dev/vdb mklabel gpt`, `mkpart vjezba ext4 1MiB 1GiB`, the 2GiB error, `1GiB 100%` ending at 2146MB, MBR four entries, 32-bit limit, GPT 128 entries, 64-bit LBA, backup header, protective MBR; definitions *particija*, *tablica particija*), its "Šire o temi" (extended/logical partitions, gdisk 45 PiB display limit) and Primjer 3 ("novi disk od 4 TB u poslužitelju")
- fdisk(8) "DISK LABELS", sfdisk(8), gdisk(8), parted(8), as cited in ch11; UEFI Specification, chapter "GUID Partition Table (GPT) Disk Layout" (header, entry array, protective MBR)

## Model and presets

- **Reuses from `lnx-mount-layers`:** only its bottom layer (disk → partition as a block device with its own name, e.g. `vdb1`); nothing above it. The soft dependency is weak; the page can be built first.
- **Scene:** two horizontal LBA strips of the same disk, one per table type, drawn to scale with the start and end enlarged as insets. **MBR:** sector 0 with four entry slots, partitions after it, an extended partition holding a chain of logical ones (each with its own EBR), and everything beyond 2³² sectors hatched "nedostupno". **GPT:** LBA 0 protective MBR (one entry of type `0xEE`), LBA 1 primary header, LBA 2–33 the entry array (128 × 128 B), partitions from LBA 2048 (1 MiB alignment), and at the end the backup entry array and the backup header in the last LBA. Under each strip: a `parted print`-style table and `lsblk`-style names.
- **Class:** reference (an explorer without steps): the params set the disk and the requested partitions; both strips are recomputed.
- **State (derived):** `{ sectors, mbr: { slots: [..4], extended, logical: [...], unreachable }, gpt: { entries: [...], firstUsable: 34, lastUsable, backupAt, protectiveEnd }, warnings: [...] }`.
- **What the params drive:** disk size → the 2 TiB line and GPT's backup position; partition count → MBR switches to 3 primary + extended + logicals at 5 and refuses a 5th primary; toggles show the old-tool view and a damaged primary header.
- **Rules:**
  1. MBR: the table is in sector 0 and has room for four entries, the primary partitions; there are never more than four. (ch11 "Blokovni uređaji i particije"; fdisk(8), sfdisk(8))
  2. MBR beyond four: one entry becomes an extended partition holding logical partitions (Linux numbers them from 5); "four primary, or three primary and as many logical as can be generated". (ch11 "Šire o temi"; gdisk(8))
  3. MBR size limit: start and size are 32-bit sector numbers, so with 512-byte sectors nothing past 2³² × 512 B = 2 TiB (≈ 2.2 TB) can be described. (ch11; fdisk(8) "works correctly up to 2 TB")
  4. GPT: 64-bit LBA only (no CHS), 128 entries by default. (ch11; gdisk(8))
  5. GPT keeps a backup of its header at the end of the disk; partitioning tools can restore it. That is why `parted … 100%` on the book's 2 GiB disk ends at 2146MB, not 2147MB (plus 1 MiB alignment). (ch11 `parted print` listing; sfdisk(8); UEFI Specification, "GUID Partition Table (GPT) Disk Layout")
  6. Sector 0 of a GPT disk holds a protective MBR, so an MBR-only tool sees one partition of type `ee` covering the disk (up to 2 TiB) instead of free space, and does not overwrite it. (ch11; fdisk(8) "DISK LABELS")
  7. Layout numbers: entry array 128 × 128 B = 32 sectors, first usable LBA 34, last usable = last LBA − 33; first partition aligned to LBA 2048. (UEFI spec, check; parted alignment, check)
  8. Tie-break for the request "partition 5" on MBR: the 4th slot is turned into the extended partition before the 4th primary is created (as `fdisk` proposes), never after. (check)
- **Params:** `disk` choice `2 GiB (vdb)` | `1 TB` | `4 TB`, default `2 GiB`; `parts` range 1–8, default 2; `oldTool` toggle (show what an MBR-only tool sees on the GPT disk), default off; `damageHeader` toggle (primary GPT header corrupt → read from the backup), default off; `sector` choice `512` | `4096`, default `512` (4096 moves the MBR limit to 16 TiB, check).
- **Presets:**
  - `book-vdb` — 2 GiB, GPT, `vjezba` 1MiB–1GiB and `druga` 1GiB–100%: ends at 2146MB; MBR strip shows the same two primaries. From ch11 (`parted` listings).
  - `four-tb` — 4 TB, 1 partition: GPT uses it all; MBR reaches only 2 TiB, the remaining ≈ 1.8 TB is unreachable with no error message. From ch11 Primjer 3.
  - `five-parts` — 2 GiB, 5 partitions: MBR = 3 primary + extended with 2 logical (`vdb5`, `vdb6`); GPT = 5 entries of 128. From ch11 "Šire o temi" (gdisk quote), layout derived.
  - `old-tool` — GPT disk seen by an MBR-only tool: one `ee` partition, "disk is in use". From ch11 (protective MBR sentence).
  - `damaged-header` — primary header corrupt: the table is read from the backup at the end and can be rewritten. Derived from ch11's sfdisk(8) sentence, unchecked.
- **Steps:** none (reference).
- **Legend:** metadata sector (dark, labelled MBR / header / entries / backup), partition (solid, named), extended container (outline) with logical partitions inside, unreachable area (hatched + label), protective entry (dotted outline), damaged (× pattern). "Changed" marks the regions that moved or appeared since the last param change.
- **Captions:**
  - HR: „Disk od 4 TB s tablicom MBR: zapis od 32 bita doseže samo 2 TiB, pa ostatak diska postoji, plaćen je, a nedostupan je — bez ijedne poruke o grešci.“
  - EN: "A 4 TB disk with an MBR table: the 32-bit fields reach only 2 TiB, so the rest of the disk is there and paid for but unreachable, without a single error message."
- **Terms:** partition — particija; partition table — tablica particija; primary / extended / logical partition — primarna / proširena / logička particija; protective MBR — zaštitni MBR; backup header — sigurnosna kopija zaglavlja; sector — sektor; logical block addressing — logičko adresiranje blokova.
- **Misconceptions:** MBR's limit is "about four"; GPT's last megabyte is wasted by a bug; an old tool showing a GPT disk as one strange partition means the disk is broken.
- **Out of scope:** CHS geometry, hybrid MBR, partition type GUIDs, boot (`lnx-boot-chain`), filesystems and mounting (`lnx-mount-layers`).
- **Note for coordinator:** the task id `disk-partitioning` differs from its catalogue id `lnx-partition-tables`; keep one (the catalogue's fits the `lnx-` family). Class "reference" behaves as a stepless explorer here.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh disk-partitioning sims/disk-partitioning` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/disk-partitioning/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
