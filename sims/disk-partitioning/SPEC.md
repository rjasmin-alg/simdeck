<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# disk-partitioning: spec

One concept: **partition limits, the protective MBR and the backup header** — the same disk, partitioned the same way,
with an MBR table and with a GPT table. Task: `docs/tasks/w3/disk-partitioning.md`; catalogue `lnx-partition-tables`
§4.4.

## Scene

- Two horizontal strips of the same disk's sectors (LBA), MBR above, GPT below. Each strip has two insets above it,
  the start (sector 0 …) and the end (… last sector) enlarged with their sector numbers, then the whole disk to scale.
- **MBR:** sector 0 with its four slots (each shows the partition number it holds, the extended one dashed, empty `–`),
  the gap to the first MiB, the partitions, an extended container (dashed outline) holding logical partitions, each
  behind its EBR sector (a dark tick), and everything past 2³² sectors hatched "nedostupno".
- **GPT:** LBA 0 the protective MBR (its slot 1 holds `ee`, dotted), LBA 1 the header, LBA 2–33 the entry array (drawn
  as 128 small cells, the used ones coloured), partitions from LBA 2048, and at the end the backup entry array and the
  backup header in the last LBA.
- Under the strips, both tables side by side, as a partition table listing prints them (device name, number, start,
  end, size in the tool's decimal units, type or name). The device name is the block device's (`vdb1`, `vdb5`).
- Each requested partition has the same series colour in both strips and both tables, so the same partition can be
  followed when its name differs (`vdb4` on GPT, `vdb5` on MBR).

State (derived, `compute(p)`): `{ disk, dev, bytes, sectorSize, sectors, perMiB, n, mbrLimitBytes, mbr: { label,
slots: [4 × { type: primary|extended|empty, num, name, start, end }], extended, logical: [...], parts: [...], reach,
lastUsable, unreachable: { start, end, bytes } | null, missing: [req], clipped: [req], damaged, readable }, gpt: { label,
entries: [{ name, num, label, req, start, end }], entryCount: 128, entrySectors, headerAt, firstUsable, lastUsable,
backupEntriesAt, backupAt, protective: { type: 'ee', start, end, sectors }, protectiveEnd, protectiveShort, primaryOk,
readFrom, restorable, oldTool }, warnings: [...] }`. All positions are sector numbers (LBA).

## The request

`parts` = n partitions, made one after another; **each new partition takes the second half of the last one**, so the
partitions made before it stay where they are (only the last one shrinks, and the new one appears). Boundary k
(1 … n − 1) is at ⌊total MiB × (1 − 2⁻ᵏ)⌋ MiB; the first partition starts at 1 MiB; the last runs to "100%", which each
table resolves for itself (rule 5). With n = 2 on the 2 GiB disk this is exactly the book's `vjezba 1MiB 1GiB` and
`druga 1GiB 100%`. GPT names are `vjezba`, `druga`, then `treca` … `osma` (data, never translated).

## Rules

1. **MBR: the table is in sector 0 and has room for four entries, the primary partitions; never more than four.** A
   fifth primary is refused (`addPrimary` → `'full'`). (ch11 "Blokovni uređaji i particije"; fdisk(8) DISK LABELS "In
   sector 0 there is room for the description of 4 partitions"; sfdisk(8) "an MBR always contains 4 partitions".)
2. **MBR beyond four: one slot becomes the extended partition, a container for logical partitions, numbered from 5.**
   Each logical partition has its own EBR sector at the start of its region and starts one MiB later (alignment); the
   extended partition runs from the first EBR to the end of the last logical one. Only one extended partition. "Four
   primary, or three primary and as many logical as can be generated." (ch11 "Šire o temi"; gdisk(8) `g`.)
3. **MBR's 32-bit limit:** start and size are 32-bit sector numbers, so sectors 0 … 2³² − 1 can be described:
   2³² × 512 B = 2 TiB (≈ 2.2 TB) with 512-byte sectors, 2³² × 4096 B = 16 TiB with 4096-byte ones. A partition that
   starts at or past sector 2³² is not made (`missing`); one whose explicit end is past it ends at the last whole MiB
   before 2³² (`clipped`); "100%" on MBR means as far as the table reaches, so it ends there silently. Everything from
   2³² to the last sector is `unreachable`. (ch11; fdisk(8) "with 512-byte sectors this will work up to 2 TB".)
4. **GPT: 64-bit LBA only (no CHS), 128 entries by default.** Every requested partition gets an entry, numbered 1 … n
   in order; nothing is clipped on these disks. (ch11; gdisk(8) "uses 64-bit LBA mode exclusively", "The default
   partition table size is 128 entries".)
5. **GPT keeps a backup of its header and entries at the end of the disk; a tool can restore from it.** So "100%" on
   GPT ends on the last whole MiB at or before the last usable LBA, not on the last sector: on the book's 2 GiB disk
   `druga` ends at **2146MB**, not 2147MB, while the same request on MBR ends on the last whole MiB it can describe,
   which on the book's disk is the last sector, **2147MB**. (On the 1 TB disk, and on 4 TB with 4096-byte sectors,
   both tables end on the same last whole MiB: GPT's backup fits in the alignment remainder; caption `cEndsSame`.)
   With `damageHeader` the primary header (LBA 1) is unreadable: the table is read from the backup header in the last
   LBA and every entry is found (`readFrom: 'backup'`, `restorable`). The same damage on MBR hits sector 0, and MBR has
   no copy: the disk shows no table (`readable: false`), though the partitions' data is still there. (ch11 `parted
   print` listing; sfdisk(8) `gpt-bak-std`, "partitioning tools can automatically relocate the header"; UEFI
   Specification, "GUID Partition Table (GPT) Disk Layout".)
6. **Sector 0 of a GPT disk holds a protective MBR: one entry of type `ee` from sector 1 over the whole disk, as far as
   a 32-bit size reaches** (end = min(last sector, 2³² − 1)). With `oldTool` the GPT strip shows what an MBR-only tool
   sees: one partition `ee` and no free space, so it does not overwrite the disk. Past 2³² sectors (4 TB, 512 B) the
   entry cannot reach, and the old tool sees nothing there (`protectiveShort`). The old tool's view changes nothing on
   the disk. (ch11; fdisk(8) DISK LABELS "the first sector is still reserved for a protective MBR".)
7. **GPT layout numbers:** entry array 128 × 128 B = 16 KiB = 32 sectors of 512 B (4 of 4096 B), at LBA 2; first
   usable LBA 34 (6); last usable = last LBA − 33 (− 5); backup entries from last − 32 (− 4); backup header at the last
   LBA. Partitions start at 1 MiB: LBA 2048 (256). (UEFI Specification *(check)*: from memory, matches the book's
   2146MB; parted's 1 MiB alignment *(check)*: matches the book's 1049kB start.)
8. **Tie-break, "partition 5" on MBR:** the 4th slot is turned into the extended partition **before** a 4th primary is
   made, never after. So n = 4 is four primaries (`vdb1`–`vdb4`); n = 5 is three primaries, `vdb4` extended, and the
   4th and 5th requested partitions are logical `vdb5`, `vdb6`. (Task; fdisk proposes `e` for the 4th partition
   *(check)*: from memory.)

Tie-breaks also tested: "100%" alignment (GPT to the last whole MiB before the backup, MBR to the last whole MiB it
can describe, the last sector on the book's disk);
a start exactly at 2³² is missing, one MiB before it is made; an explicit end past 2³² is cut, "100%" is not marked.

## Numbers

| | 2 GiB (vdb) | 1 TB | 4 TB |
|---|---|---|---|
| bytes | 2 147 483 648 | 1 000 204 886 016 | 4 000 787 030 016 |
| sectors (512 B) | 4 194 304 | 1 953 525 168 | 7 814 037 168 |
| sectors (4096 B) | 524 288 | 244 190 646 | 976 754 646 |
| shown as | 2147MB | 1000GB | 4001GB |
| GPT last usable (512 B) | 4 194 270 | 1 953 525 134 | 7 814 037 134 |
| GPT "100%" ends | 4 192 255 → 2146MB | 1 953 523 711 | 7 814 035 455 |
| MBR "100%" ends | 4 194 303 → 2147MB | 1 953 523 711 | 4 294 967 295 → 2199GB |
| MBR unreachable | – | – | 2³² … 7 814 037 167 = 1 801 763 774 464 B ≈ 1.8 TB (1802GB) |

- 1 TB and 4 TB are the byte counts real drives carry (IDEMA LBA count: 97 696 368 + 1 953 504 × (GB − 50) sectors of
  512 B *(check)*: from memory); they divide evenly by 4096. The 2 GiB disk is the book's `vdb`.
- **The book's listing**, reproduced by the model: `vjezba` start `1049kB`, end `1074MB`, size `1073MB`; `druga` start
  `1074MB`, end `2146MB`, size `1073MB`; both `1023M` as block devices. On MBR `druga` is `1G` (it runs to the end).
- **Sizes as printed**, data on the page: the partition table listing uses decimal units chosen so the number is at
  least 10 of them, with 2, 1 or 0 decimals (parted's compact unit, from memory of libparted `unit.c` *(check)*; it
  reproduces every number in ch11). The block-device names carry binary sizes with one rounded decimal (`1023M`,
  `3.6T`, the book's `18.8G` for `vda4`; util-linux size_to_human_string *(check)*).
- `five-parts` (2 GiB): GPT `vdb1` 1023M, `vdb2` 512M, `vdb3` 256M, `vdb4` 128M, `vdb5` 127M; MBR `vdb4` extended
  sectors 3 670 016 – 4 194 303, `vdb5` EBR 3 670 016, data 3 672 064 – 3 932 159; `vdb6` EBR 3 932 160, data
  3 934 208 – 4 194 303.
- `four-tb`: MBR `vdb1` ends at 2³² − 1 (2199GB, block device `2T`); GPT `vdb1` 3.6T.

## Params

| key | type | values | default |
|---|---|---|---|
| `disk` | choice | `2GiB` · `1TB` · `4TB` | `2GiB` |
| `sector` | choice | `512` · `4096` | `512` |
| `parts` | range | 1 – 8 | 2 |
| `oldTool` | toggle | the GPT strip as an MBR-only tool sees it | off |
| `damageHeader` | toggle | GPT header (LBA 1) and MBR sector 0 damaged | off |

The defaults are the book's disk (`book-vdb`).

## Presets

| id | params | shows |
|---|---|---|
| `book-vdb` | 2 GiB, 2 parts | GPT `druga` ends at 2146MB, MBR's at 2147MB; the same two primaries |
| `four-tb` | 4 TB, 1 part | GPT uses it all; MBR reaches 2 TiB, ≈ 1.8 TB unreachable, no error |
| `five-parts` | 2 GiB, 5 parts | MBR 3 primary + `vdb4` extended with `vdb5`, `vdb6`; GPT 5 of 128 |
| `old-tool` | 2 GiB, 2 parts, `oldTool` | one `ee` partition over the disk: in use, not empty |
| `damaged-header` | 2 GiB, 2 parts, `damageHeader` | GPT reads the backup; MBR shows no table |

## Captions

One main sentence chosen in this order: damaged → old tool (short when the `ee` entry stops at 2 TiB) → unreachable
(the task's caption, word for word, plus "GPT opisuje cijeli disk") → logical (≥ 5) → four (= 4) → ends (the backup at
the end; the default), or "same ends" when both tables' last partitions end on the same whole MiB. Notes after it: MBR
unreachable (whenever another caption than the unreachable one leads, the old tool's too), the old tool still seeing
only the intact protective MBR (damage and old tool together), how many requested partitions MBR cannot describe, and
4096-byte sectors reaching 16 TiB on the 4 TB disk.

## Legend

table metadata (dark, labelled MBR / header / entries / backup) · partition (solid colour, named) · extended
partition (dashed outline) with logical ones inside · unreachable (hatched + label) · protective entry `ee` (dotted
outline) · damaged (× pattern + label) · changed (highlighter + ink outline: regions, cells and table rows that
appeared, moved, were renamed or changed kind since the last param change).

## Out of scope

CHS geometry, hybrid MBR, partition type GUIDs, boot (`lnx-boot-chain`), filesystems and mounting
(`lnx-mount-layers`), MBR's 4 TiB trick (a partition starting just under 2³² with a 32-bit size).
