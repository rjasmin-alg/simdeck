<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# disk-partitioning: notes

New explorer (task `docs/tasks/w3/disk-partitioning.md`, catalogue `lnx-partition-tables` §4.4). It replaces the
placeholder page that had stood in this folder since the site frame (a 500 GB disk with two sliders, Croatian only).
Rules and expected numbers: `SPEC.md`. The task names no kit view; the page draws the strips and tables in HTML.

## Decisions

- **Folder and id stay `disk-partitioning`**, not the catalogue's `lnx-partition-tables`: `courses/linux-essentials.json`
  and `sims/lnx-lvm-extend/sim.json` (`related`) already name this id, and changing either is outside this task. The
  task's own note asks the coordinator to keep one; the rename is theirs (three files).
- **The request: each new partition takes the second half of the last one.** A first version split the disk evenly;
  then every boundary moved on each `parts` change, so the "changed" marks covered everything and hid the one thing
  that changes at 5 (slot 4 becomes the extended partition). Halving keeps the partitions made before in place, and
  n = 2 is still exactly the book's `vjezba 1MiB 1GiB`, `druga 1GiB 100%`. At 8 the last ones are thin (2 GiB disk:
  16M and 15M), still drawn (minimum width) and named in the tables.
- **The same request on both tables, resolved by each table:** "100%" on GPT stops on the last whole MiB before the
  backup (2146MB); on MBR it runs to the disk's last sector (2147MB) or, on the 4 TB disk, to 2³² − 1 without a word.
  An explicit end past 2³² is cut and marked "skraćena / cut short" in the table; a partition that would start past
  2³² is not made (one table row "N traženih particija ne stane u 32 bita").
- **`damageHeader` damages both tables' first structure:** GPT's header in LBA 1 (read from the backup, every
  partition found) and MBR's sector 0 (no copy: "Tablica nije prepoznata", the partitions drawn as dashed "?"). The task
  names only GPT; the MBR side is the contrast that makes "backup header" mean something. The toggle is called
  "Oštećen početak tablice / Damaged start of the table", with a hint naming LBA 1 and sector 0.
- **`oldTool` changes only the GPT strip's bar and its table** (one `ee` partition, dotted, "disk je zauzet"); the
  insets keep showing what is really on the disk, including the protective MBR's slot 1 `ee`, which is always drawn.
  On 4 TB with 512-byte sectors the `ee` entry stops at 2³² − 1 and the rest is hatched "stari alat ne vidi".
- **The 2³² line** is drawn on the MBR strip (red tick and "2³² · 2 TiB" on the axis) whenever the disk is past it, and
  on the GPT strip only in the old tool's view (where the `ee` entry ends there).
- **Insets are schematic, the bar is to scale.** The insets name sector numbers; the bar's metadata at both ends has a
  minimum width so it can be seen at all (34 sectors of 4 million).
- **Device names:** the book's `vdb` for every disk size (the same VM gets a different second disk); partitions
  `vdbN` as the block device list names them, so MBR's logical ones are `vdb5`… and the extended one `vdb4`. GPT names
  `vjezba`, `druga`, then `treca` … `osma` (ASCII, as the book's names are). All data, `translate="no"`.
- **Disk sizes:** 1 TB and 4 TB are real drives' byte counts (IDEMA), so the tables print `1000GB` and `4001GB` as a
  real disk does; the unreachable part of the 4 TB disk is 1802GB ≈ 1.8 TB, as the task says.
- **Colours:** each requested partition keeps one series colour in both strips and tables (so `vdb4` on GPT and `vdb5`
  on MBR are visibly the same partition); the name is always written on it or beside it, so colour is never alone.
  Metadata is ink (dark in light, light in dark), the extended partition a dashed outline, the protective entry
  dotted, unreachable hatched with a label, damaged a red × pattern with a label.
- **Changed** marks (kit highlighter + ink outline) go on bar regions, inset cells, MBR slots and whole table rows
  whose position, name or kind changed since the last param change (`changedRegions`); table rows are outlined as a
  row, not per cell, so the outline covers no digit.
- **Sizes are printed as the tools print them** (`compact`: the listing's decimal units, `human`: the block-device
  list's binary units); they are data and stay `2146MB`, `1023M`, `3.6T` in both languages. Prose sizes use the page's
  decimal comma (≈ 1,8 TB).
- **No tool names on the page** (COMMON §1): the tables are "tablica msdos/gpt" in the listing's format, without
  naming the program; `parted`, `fdisk`, `gdisk`, `sfdisk`, `lsblk` appear only in SPEC.md and these notes. The label
  types `msdos`/`gpt` and `ee` are the subject.
- **Unreachable caption:** the task's text word for word ("… bez ijedne poruke o grešci"), plus "GPT opisuje cijeli
  disk." *(check)*: current fdisk warns when it creates a DOS label on a disk over 2 TiB ("DOS partition table format
  cannot be used on drives for volumes larger than 2199023255040 bytes") and then caps the last sector at 4294967295
  quietly; parted refuses a too-long msdos partition outright. The model behaves like the former (it caps "100%"
  silently) while printing the listing's format. The book's point (ch11) is that once written, nothing in the table
  says the rest exists. Left as the task and the book have it.

## Deviations from the task

- Class `explorer` (the task: "reference, an explorer without steps"); `sim.json` class is the manifest's value.
- The `damageHeader` toggle also damages MBR's sector 0 (above).
- The request rule (halving) is this sim's; the task says only "partition count".
- Captions besides the task's unreachable one are written here (SPEC.md "Captions").

## Checks

- `node --test sims/disk-partitioning/sim.test.js`: 27 tests. Every rule broken once by hand (a mutation script: slot
  count 5, logical from 4, no EBR gap, 2³³ limit, start-at-limit boundary, explicit end not cut, 64 entries, 256-byte
  entries, "100%" unaligned, no backup, damage ignored on either table, protective entry over the whole disk or from
  sector 0, extended at 6, formatter precision and rounding): each fails at least one test.
- Gate: see the report for the run; screenshots reviewed at 1920×1080 light, dark, grayscale and 375×812 in both
  languages, and each preset plus 4 TB × 8 partitions × damaged (the densest state) by hand.

## Review

A fresh reviewer (a separate agent, no part in the build) read the code against SPEC.md and ran 77 mutants of
`sim.js`. It confirmed every rule and number (book listing, IDEMA counts, protective entry size, GPT layout at both
sector sizes, the formatters). Taken from it:

- SPEC wording: MBR's "100%" ends on the last whole MiB it can describe (the last sector only on the 2 GiB disk).
- Caption `cEndsSame` for 1 TB and 4 TB / 4096 B, where both tables end on the same MiB and `cEnds` lost its contrast.
- The MBR-unreachable note now also follows the old tool's caption; damage + old tool adds a note; the GPT table shows
  the old tool's note then (the backup note goes with the real table).
- The caption's plurals took their form from a grouped number string ("2 048"); now from the raw count.
- Explanation: "a disk over 2 TiB (≈ 2.2 TB)", not "2 TB"; hr "Pravilo:".
- The extended partition's number and extent come from its slot (one source), not from slot 4 and a second variable.
- Six tests for paths only the 2 GiB disk had exercised (1 TB extended end, 4096-byte reach in sectors, the request's
  flooring, regions and their extents, changed regions on 2 → 3, warnings and `restorable`), two formatter edges.
- 8 mutants still survive; all are equivalent for this sim's inputs (2³² is a whole MiB; extended and unreachable
  never occur together; 4096-byte sectors are never unreachable; GPT's 2146MB comes from alignment, so reserving only
  the backup header gives the same end; the formatter's epsilon only matters at exact halves; a start never moves
  without its end).

## Sources

- Task "Model and presets" (rules 1–8, params, presets, caption, terms, misconceptions, legend).
- UL ch11 "Blokovni uređaji i particije" (the `lsblk`, `parted print` listings for `vdb`; MBR four entries; 32 bits;
  GPT 128 entries, 64-bit LBA; backup header; protective MBR; definitions), "Šire o temi" (extended/logical, gdisk's
  45 PiB display limit, not used), Primjer 3 (4 TB disk). Its footnotes quote fdisk(8) DISK LABELS, sfdisk(8)
  (`gpt-bak-std`, "an MBR always contains 4 partitions"), gdisk(8) (128 entries, 64-bit LBA, `g` "three primary and as
  many logical"), parted(8) `mklabel`.
- From memory, not re-read here *(check)*: UEFI Specification "GUID Partition Table (GPT) Disk Layout" (header at LBA 1,
  entry array at LBA 2, 128 × 128 B, backup entries before the backup header at the last LBA, protective MBR one `0xEE`
  entry from LBA 1 with size min(disk − 1, 0xFFFFFFFF)); Linux's msdos partition code (logical partitions from 5, the
  extended partition shown as 1K); fdisk proposing `e` for the 4th partition; parted's compact unit (libparted
  `unit.c`) and util-linux `size_to_human_string`, both of which reproduce every number in ch11; IDEMA LBA counts.
- `lnx-mount-layers` (its bottom layer only: the disk `vdb` and partitions as block devices `vdb1`, `vdb2`), and
  `lnx-thin-overcommit` (explorer page structure, `track()` of changed values).

## Term pairs

Missing from `kit/glossary.js`; written out in the explanation as *English* (Croatian) on the Croatian page:

- primary partition — primarna particija (UL ch11)
- extended partition — proširena particija (UL ch11 "Šire o temi": "proširena")
- logical partition — logička particija (UL ch11 "Šire o temi")
- protective MBR — zaštitni MBR (UL ch11)
- backup header — sigurnosna kopija zaglavlja (task)
- logical block addressing — logičko adresiranje blokova (UL ch11)
- sector — sektor (UL ch11; not marked as a term on the page)

`partition`, `partition table`, `block device`, `header`, `backup` come from the glossary.

## Shared requests

None. The model is pure and promotable (`createMbr`, `addPrimary`, `addExtended`, `addLogical`, `planMbr`,
`mbrLayout`, `gptLayout`, `protectiveEntry`, `compact`, `human`), should `lnx-boot-chain` or another sim want the
partition tables; no task names this one as a soft dependency yet.

## Timing

Started 2026-11-12 02:31 (thread start), done 03:04: about 35 minutes by the wall clock, including the gate runs and
the fresh review (about 6 minutes, run alongside the notes).
