# win-storage-spaces: Storage Spaces

| | |
|---|---|
| Task | `win-storage-spaces` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-storage-spaces` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-storage-spaces/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `raid` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **mirror vs parity, columns, how many disks you can lose**.

The student: build a pool, fail disks.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.

## Sources

- Local course material for the RAID ideas and terms: UL ch12 (below). Windows specifics from the vendor's documentation; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, „Redundantno polje diskova", Što treba znati (zrcaljenje, parnost, oslabljeno polje) and Primjer 3 (polje je zdravo, datoteke nema).
- Microsoft Learn, *Storage Spaces overview*; *Deploy Storage Spaces on a stand-alone server* (minimum disks per resiliency type); *Fault tolerance and storage efficiency in Storage Spaces Direct* (efficiency arithmetic; S2D-specific parts out of scope) (check titles).

## Model and presets

- **Scene:** K3 block grid. A storage pool of N physical disks (columns of the grid, labelled Disk 0…N−1); a
  virtual disk is drawn as 8 slabs (rows); each slab shows which disks hold its data and parity/mirror pieces.
  A summary line: resiliency, columns, usable capacity, efficiency, "survives losing: k disks". Clicking a disk
  fails it; slabs that lost too much turn red. Explorer.
- **State:** `{ disks: N, sizeGB, resiliency: 'simple'|'mirror2'|'mirror3'|'parity1'|'parity2', columns,
  failed: [diskIds], slabs: [{disks: [], role: [], lost}], usableGB, efficiency, vdState: 'healthy'|'degraded'|
  'failed' }`.
- **Params drive live:** changing disks, resiliency or columns re-lays the slabs; failing disks recomputes which
  slabs are lost and the virtual disk state.
- **Rules:**
  1. Copies: two-way mirror keeps 2 copies, three-way 3; parity keeps 1 (single) or 2 (dual) parity pieces per
     stripe (Microsoft Learn, *Storage Spaces overview* / resiliency types (check)).
  2. Minimum disks: simple 1, two-way mirror 2, three-way mirror 5, single parity 3, dual parity 7 (Microsoft
     Learn, *Deploy Storage Spaces on a stand-alone server* (check)). Below the minimum the option is disabled
     with that reason.
  3. Columns = how many disks one stripe spans; a stripe needs columns × copies disks (mirror) or columns disks
     (parity), so columns ≤ N / copies (check).
  4. Efficiency: simple 100 %, two-way 50 %, three-way 33.3 %, single parity (c − 1)/c, dual parity (c − 2)/c
     (derived, the usual arithmetic; UL ch12 „Redundantno polje diskova" for mirror and parity).
  5. Placement (model simplification, stated on the page): slab s uses disks (s·w + j) mod N, j = 0…w − 1, w =
     stripe width; mirror column k uses pieces j = k·copies … k·copies + copies − 1. Real Storage Spaces places
     slabs by free space (check).
  6. A mirror slab is lost when every copy of one column is on a failed disk; a parity slab when more pieces failed
     than parity pieces. One lost slab fails the whole virtual disk; failures that lose no slab leave it degraded
     (derived).
  7. "How many disks you can lose" is guaranteed only up to copies − 1 (mirror) or the parity count; beyond that
     it depends which disks (derived; preset `which-two`).
- **Params:** `disks` range 1…8 (4); `resiliency` choice simple/mirror2/mirror3/parity1/parity2 (mirror2);
  `columns` range 1…8 clamped by rule 3 (2); `sizeGB` select 1000/4000 (1000); fail-disk buttons 0…N−1.
- **Presets** (all outcomes from the rule-5 placement, checked by script):
  - `mirror-one` 4 disks, two-way mirror, 2 columns, fail Disk 0: degraded, no slab lost; usable 2000 GB of 4000.
  - `which-two` same, fail Disk 0 and 1 → all 8 slabs lost (both copies of column 0); fail Disk 0 and 2 instead →
    degraded only.
  - `parity3` 3 disks, single parity, 3 columns: efficiency 66.7 %; fail 1 → degraded; fail 2 → failed.
  - `dual-parity7` 7 disks, dual parity, 7 columns: efficiency 71.4 %; fail Disk 2 and 5 → degraded; a third → failed.
  - `simple` 4 disks, simple, 4 columns: fail any one → failed (no resiliency).
  - `three-way` 5 disks, three-way mirror, 1 column: any 2 failures → degraded; efficiency 33.3 %.
- **Steps:** explorer, 0.
- **Legend:** data piece (filled), mirror copy (same colour, hatched), parity piece (P label, outline), failed disk
  (crossed column + "✕"), lost slab (red row + "izgubljeno"), changed (kit highlight on slabs whose state changed).
- **Captions:** hr: "Otkazali su Disk 0 i Disk 1 — obje kopije stupca 0: virtualni disk je izgubljen." / en: "Disk 0
  and Disk 1 failed — both copies of column 0: the virtual disk is lost." — hr: "Dvostruka parnost na 7 diskova:
  71,4 % prostora, preživljava dva bilo koja kvara." / en: "Dual parity on 7 disks: 71.4 % of the space, survives
  any two failures."
- **Terms:** storage pool — skup za pohranu *(check)*; mirror — zrcaljenje (UL ch12); parity — parnost (UL ch12);
  column — stupac; resiliency — otpornost *(check)*; virtual disk — virtualni disk; degraded — oslabljeno (UL
  ch12 „polje oslabi").
- **Misconceptions:** two-way mirror survives any two failures on four disks; parity is free capacity; more columns
  means more failures tolerated.
- **Out of scope:** Storage Spaces Direct (multi-server), tiering and cache, repair/rebuild timing (`lnx-raid-rebuild`),
  thin provisioning; RAID levels in general (`ossim-raid-cache`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-storage-spaces sims/win-storage-spaces` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-storage-spaces/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
