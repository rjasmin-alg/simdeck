# lnx-thin-overcommit: Thin provisioning and overcommit

| | |
|---|---|
| Task | `lnx-thin-overcommit` (wave 3, Linux) |
| Catalogue entry | `lnx-thin-overcommit` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-thin-overcommit/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `linux-admin` / `lvm` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-lvm-extend` is merged and reuse its model (COMMON.md §6); uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **promised vs real space; the pool fills under everyone**.

The student: create thin volumes, write, run out.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-lvm-extend/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T20 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T20 → §5.2
- NLA row T20 ("LVM u pogonu — snimke, tanko dodjeljivanje, `lvmcache`, oporavak metapodataka") (no chapter yet)
- lvmthin(7): "Thin Provisioning", "Data space exhaustion" (`--errorwhenfull`), "Automatic extend settings", "Discard"; lvm.conf(5) `thin_pool_autoextend_threshold`, `thin_pool_autoextend_percent`; lvs(8) Data%; kernel Documentation/admin-guide/device-mapper/thin-provisioning.rst (`no_space_timeout`, default 60 s) (check)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md`, section "LVM: fizički volumeni, grupe i logički volumeni" (PV/VG/LV vocabulary)
- Related lab: `/home/rjasmin/projects/single-page-labs/lvm-topology-lab-v2.html` (thin pool and thin LV objects)

## Overlaps (catalogue §5)

- **§5.2 Snapshots and copy-on-write:** sto-backing-chains gets presets for qcow2, VHDX/AVHDX (covers win-hyperv-checkpoints) and VMware. LVM snapshot fill, thin overcommit and CoW filesystem stay separate pages on the same block-grid view. sto-cow-vs-row and win-vss can become presets of lnx-cow-filesystem.

## Model and presets

- **Reuses from `lnx-lvm-extend`:** VG, LV and VG free space, and `lvextend` growing a volume. New here: a thin pool whose physical space is shared, thin volumes whose size is only promised, and allocation on first write. Shares the block-grid look with `lnx-lvm-snapshot` and `lnx-cow-filesystem` (§5.2).
- **Scene (K3 block grid):** top, the thin pool as a grid of 1-GiB cells (100 by default), each coloured by the thin volume that owns it; a Data% gauge with the autoextend threshold line; VG free beside it. Below, one bar per thin volume: its virtual size (outline, e.g. 50 GiB), what its filesystem believes is used, and what it really holds in the pool. A banner "obećano 150 GiB / stvarno 100 GiB". When the pool is full, refused writes show on the volume that tried.
- **Class:** explorer: params describe the volumes and how much each has written; the picture is recomputed.
- **State (derived):** `{ pool: { size, used, meta }, vgFree, lvs: [{ name, virt, written, deletedInFs, allocated, refused }], extended: [sizes], overcommit, mode: 'queue'|'error' }`.
- **What the params drive:** writes are applied in volume order (`thin1`, `thin2`, `thin3`) in 1-GiB units; after each unit the autoextend rule is checked; when the pool is full the remaining units are refused (or queued).
- **Rules:**
  1. A thin volume's size is virtual; pool blocks are allocated only when a block is first written. (lvmthin(7) "Thin Provisioning")
  2. The sum of virtual sizes may exceed the pool (overcommit); LVM warns but allows it. (lvmthin(7), check the warning text)
  3. Pool Data% = allocated / pool size; a volume's Data% is relative to its own virtual size. (lvs(8))
  4. Deleting files inside a filesystem does not return blocks to the pool unless the filesystem discards them (`fstrim`, or the `discard` mount option). (lvmthin(7) "Discard")
  5. Pool full: a write needing a new block fails for **every** thin volume in the pool, including ones whose filesystems show plenty of free space; writes to already allocated blocks still work. Default: such writes are queued for 60 s, then fail; with `--errorwhenfull y` they fail at once. (lvmthin(7) "Data space exhaustion"; dm-thin `no_space_timeout`, check)
  6. Autoextend: when Data% reaches `thin_pool_autoextend_threshold`, the pool grows by `thin_pool_autoextend_percent` of its current size if the VG has that much free; otherwise it does not grow. (lvmthin(7) "Automatic extend settings"; lvm.conf(5), check partial extension)
  7. Tie-break: writes are applied in volume order, so the last volume in the list is the one that hits the full pool (a simplification of concurrent writers; say so).
- **Params:** `pool` range 50–200 step 10 GiB, default 100; `n` range 1–4, default 3; `virt` range 10–100 step 10 GiB, default 50 (same for each); `w1`, `w2`, `w3`, `w4` range 0–100 GiB written, default 20 each; `autoextend` toggle, default off; `threshold` range 50–95 step 5, default 70; `percent` range 10–50 step 10, default 20; `vgFree` range 0–100 step 10 GiB, default 0; `deleted1` range 0–50 GiB deleted inside `thin1`'s filesystem, default 0; `discard` toggle, default off; `errorWhenFull` toggle, default off.
- **Presets:**
  - `overcommit-ok` — pool 100, three 50-GiB volumes (150% promised), writes 20/20/20: pool 60%, everyone fine. Derived, unchecked.
  - `one-tenant-fills` — writes 70/20/20: pool 100% after 10 of `thin3`'s 20 GiB; `thin3`'s filesystem shows 40 GiB free but its writes are refused (queued 60 s, then error). Derived, unchecked.
  - `autoextend` — writes 40/40/50, autoextend on (70 / 20), VG free 50: pool 100 → 120 at 70 GiB → 144 at 84 GiB; at 101 GiB 70% again but 28.8 GiB needed and only 6 free → no growth; all 130 GiB fit. Derived, unchecked (real LVM rounds to extents and polls).
  - `deleted-not-returned` — writes 70/20/0, `deleted1` 30: pool still 90%; with `discard` on: 60%. Derived, unchecked.
  - `error-at-once` — `one-tenant-fills` with `errorWhenFull`: refused writes fail immediately instead of after 60 s. Derived, unchecked.
- **Steps:** none (explorer).
- **Legend:** pool cell owned by a volume (colour + volume initial), free pool cell (outline), promised-but-unbacked part of a volume (hatched outline), refused write (× on the volume), queued write (clock badge), autoextension (added row with "+20%" label), threshold line (dashed). "Changed" marks pool cells allocated or freed since the last param change.
- **Captions:**
  - HR: „Bazen je pun. `thin3` vjeruje da ima 40 GiB slobodno, ali za svaki novi blok treba mjesto u bazenu, kojega više nema — pisanje čeka 60 sekundi, a onda pada.“
  - EN: "The pool is full. `thin3` believes it has 40 GiB free, but every new block needs room in the pool, and there is none — the write waits 60 seconds, then fails."
- **Terms:** thin provisioning — tanko dodjeljivanje (NLA toc T20); thin pool — tanki bazen (check); overcommit — prekomjerno dodjeljivanje (check); logical volume — logički volumen; volume group — grupa volumena; discard — odbacivanje blokova (check); allocation — dodjela.
- **Misconceptions:** the filesystem's free space is real space; deleting files frees pool space; one volume filling up hurts only itself.
- **Out of scope:** pool metadata exhaustion (named: worse than data), thin snapshots (`lnx-lvm-snapshot` covers the thick kind), `lvmcache`, monitoring setup.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-thin-overcommit sims/lnx-thin-overcommit` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-thin-overcommit/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
