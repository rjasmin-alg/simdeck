# ssd-internals: Inside an SSD

| | |
|---|---|
| Task | `ssd-internals` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-ssd-internals` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/ssd-internals/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | OS, NLA |
| Topic / tags / level | `storage` / `storage-basics` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **FTL, erase blocks, write amplification, TRIM, wear**.

The student: write and overwrite, see erase cycles.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.

## Sources

- `/home/rjasmin/projects/ossimulator/src/modules/disk-scheduling/` (the matching ossimulator page:
  scenario `hdd-vs-ssd` in `sim/scenarios.ts`, SSD timing in `sim/timing.ts`; its `NOTES.md` notes the OS
  book has no separate SSD section *(check)*); it covers access time only, not FTL/GC/TRIM
- Standard references (no local copy): Tanenbaum & Bos, *Modern Operating Systems* 4th ed., §5.4.1 (SSD)
  *(check)*; N. Agrawal et al., "Design Tradeoffs for SSD Performance" (USENIX ATC 2008); X.-Y. Hu et al.,
  "Write Amplification Analysis in Flash-Based Solid State Drives" (SYSTOR 2009); ATA/ACS "DATA SET
  MANAGEMENT (TRIM)" and NVMe "Dataset Management (Deallocate)" command descriptions *(check)*
- Catalogue seed: ossim-disk-scheduling hdd-vs-ssd

## Model and presets

- **Scene:** K3 block grid. Left: the host's view, 10 logical blocks (LBA 0–9). Right: the NAND, **4 erase
  blocks × 4 pages** (16 pages, 6 of them over-provisioning), each page free / valid (labelled with its
  LBA) / invalid; an erase counter under each erase block. Between them the **FTL map** (LBA → block.page).
  Counters: host writes, NAND writes, **write amplification = NAND writes / host writes**, GC runs.
- **State:** `{ pages: (null|'X'|lba)[4][4], erase: [4], map: {lba: [b,p]}, active: b, ptr: p, host, nand,
  gcLog: [{victim, moved}], trimmed: lba[] }`.
- **One step:** one host operation (write LBA n, or TRIM a set of LBAs), or one garbage-collection run if
  the write needs one first (the GC is its own step, then the write follows).
- **Rules:**
  1. A page can be programmed only when erased; there is no overwrite in place (standard NAND behaviour;
     Tanenbaum & Bos, *Modern Operating Systems*, SSD section) (check).
  2. A host write goes to the next free page of the **active** erase block; the FTL map points the LBA there
     and the LBA's previous page becomes **invalid**.
  3. Erase works on whole erase blocks only and increments that block's erase counter (wear).
  4. When the active block is full: if at least two erase blocks are free, open the lowest-numbered free one;
     otherwise run GC into the one remaining free block (always kept in reserve).
  5. GC victim = the full block with the most invalid pages; tie → the lower erase count, then the lower
     block number. Its valid pages are copied into the reserve block (NAND writes the host never asked
     for), then the victim is erased and becomes the new reserve.
  6. TRIM marks the trimmed LBAs' pages invalid without any NAND write, so GC no longer copies them.
  7. Write amplification counts every NAND program (host + GC copies); first fill of an empty drive has
     WA = 1.0.
- **Params:** `op` button group write / TRIM / reset; `lba` select 0–9; `pattern` choice for auto-play:
  hot (0–3 repeated), spread (every fourth LBA), with TRIM; `showMap` toggle (on).
- **Presets** (all start with LBAs 0–9 written once: 10 host = 10 NAND writes, blocks 0–1 full, block 2 half,
  block 3 free; the numbers after that come from a reference script implementing rules 1–7, derived and
  unchecked against real firmware):
  1. `hot-data` — rewrite 0, 1, 2, 3, 0, 1, 2, 3: 8 host writes → **14 NAND writes (WA 1.75)**, 3 GC runs
     (victims move 2, 2, 2 valid pages), erase counts [1, 0, 1, 1].
  2. `spread` — rewrite 0, 4, 8, 1, 5, 9, 2, 6 (every block has a little garbage): 8 host writes → **26
     NAND writes (WA 3.25)**, 6 GC runs each moving 3 pages, erase counts [2, 2, 1, 1].
  3. `trim` — first TRIM 6, 7, 8, 9 (the files were deleted), then the same writes as `spread`: **13 NAND
     writes (WA 1.63)**, 3 GC runs.
  4. `first-fill` — write 0–9 on an empty drive one by one: 10 = 10, **WA 1.0**, no GC (rule 7).
- **Steps:** the fill is one step in presets 1–3. `hot-data` 1 + 8 + 3 = 12; `spread` 1 + 8 + 6 = 15;
  `trim` 1 + 1 + 8 + 3 = 13; `first-fill` 10.
- **Legend:** free page (empty), valid page (solid, LBA label), invalid page (hatched, "✕"), active block
  (thick border), reserve block ("R" badge), GC copy (arrow), erase (flash icon + counter +1). "Changed"
  marks pages programmed or invalidated, and the erased block, in this step.
- **Captions:**
  - hr: „Blok 0 ima najviše nevaljanih stranica, pa ga skupljanje smeća (*garbage collection*) bira: dvije
    valjane stranice kopiraju se u pričuvni blok, a blok 0 se briše."
  - en: "TRIM told the drive that LBAs 6–9 are no longer in use: GC skips them, and the same writes now cost
    13 NAND writes instead of 26."
- **Terms:** flash translation layer — sloj prevođenja adresa (FTL) (check); erase block — blok za
  brisanje (check); page — stranica; write amplification — pojačanje pisanja (check); garbage collection —
  skupljanje smeća; over-provisioning — pričuvni prostor (check); wear — trošenje; TRIM — TRIM.
- **Misconceptions:** "an SSD overwrites a block in place like an HDD"; "deleting a file frees the flash"
  (only TRIM tells the drive); "write amplification is a fixed property of the drive" (it depends on the
  workload and free space).
- **Out of scope:** wear-levelling of static data, SLC caching, multi-plane/channel parallelism, power-loss
  protection, endurance ratings (TBW/DWPD), the HDD/SSD access-time comparison (ossimulator
  `disk-scheduling` covers it: SSD 0.1 ms per access, independent of order).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ssd-internals sims/ssd-internals` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ssd-internals/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
