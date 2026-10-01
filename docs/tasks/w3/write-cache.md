# write-cache: Write-back vs write-through

| | |
|---|---|
| Task | `write-cache` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-write-cache` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/write-cache/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | DR, NLA |
| Topic / tags / level | `storage` / `storage-basics` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **write-back is fast until the power fails; battery-backed cache**.

The student: write, cut power with each setting.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.

## Sources

- `/home/rjasmin/projects/cluster-design-sim-scoping.md` §5
- Catalogue seed: scoping note §5 "no write cache" (item 5 there is a performance cache tier, not this
  concept; see the note for the coordinator)
- `~/projects/ossimulator/src/modules/disk-scheduling/` (HDD timing model, `sim/timing.ts`) and
  `~/projects/ossimulator/src/modules/raid-cache/` (cache replacement, not write policy) for neighbouring
  models
- Vendor docs to check the rules against (no local copy): Linux kernel documentation "Explicit volatile
  write back cache control"; RAID controller vendor manuals, sections on write-back/write-through policy
  and battery- or flash-backed cache *(check)*

## Model and presets

- **Scene:** a horizontal path **application → controller cache (DRAM) → disk platter**. The cache is a
  row of slots holding written blocks with a "dirty" mark; the disk is a row of LBAs. Each write shows
  when it was **acknowledged** to the application (tick mark on the app's timeline) and when it became
  **durable** (reached the disk). A battery/flash module beside the cache (on/off). A big **power switch**.
  After power returns: a table "acknowledged — on disk — lost".
- **State:** `{ t, policy: 'wt'|'wb', bbu: bool, flushOnCommit: bool, queue: [{id, lba, label, ackAt,
  durableAt|null}], cache: [{id, lba, dirty}], disk: {lba: label}, power: 'on'|'off'|'restored', lost: id[] }`.
- **One step:** one tick of 1 ms in this order: (1) the application issues the next write (if any),
  (2) the cache acknowledges it (write-back) or forwards it (write-through), (3) the disk completes at most
  one write per `diskMs` ticks, taken from the dirty queue in the destage order, (4) power cut if this is the
  cut step, (5) on restore: the BBU-protected cache destages, an unprotected cache is empty.
- **Rules:**
  1. Write-through acknowledges only after the disk has the block: ack latency = disk latency (derived;
     standard controller semantics) (check against a controller manual).
  2. Write-back acknowledges when the block is in cache: ack latency ≈ cache latency; the block is
     **dirty** until destaged.
  3. Power loss empties volatile cache: every acknowledged-but-dirty block is **lost**, though the
     application was told it was written.
  4. With a battery (BBU) or flash-backed cache the dirty blocks survive and are destaged after power
     returns; nothing acknowledged is lost (check hold-up time in a controller manual).
  5. Many controllers fall back to write-through while the battery is failed or charging (check).
  6. Destage order in write-back may differ from write order (elevator by LBA, as in ossimulator's
     disk-scheduling page); a journal's commit record can reach the disk before the data it commits. A flush /
     FUA after the data (what `fsync` asks for) forces order (kernel documentation in Sources) (check).
  7. Tie-break: equal LBAs in the queue → the later write supersedes the earlier one in cache (one
     destage).
- **Params:** `policy` choice write-through / write-back (wb); `bbu` toggle (off); `flush` toggle "flush
  after commit record" (off); `diskMs` choice 4 / 8 / 12 (8, a 7200 rpm HDD random write ≈ 8 ms, derived);
  `cacheMs` fixed 0.1; `cutAt` range 1–12 (6); button "power cut now".
- **Presets** (6 writes issued one per ms, `diskMs` 8; derived, checked by hand):
  1. `write-through` — acks at 8, 16, 24, 32, 40, 48 ms; cut at 30 ms: 3 acknowledged, 3 on disk, **0 lost**;
     the app is slow (mean ack latency ≈ 8 ms plus queueing: last write waits 42 ms) (check queueing).
  2. `write-back-cut` — all 6 acked by 6 ms (0.1 ms each); disk has destaged 3 by 24 ms; cut at 25 ms:
     **3 acknowledged writes lost**.
  3. `write-back-bbu` — preset 2 with battery: the 3 dirty blocks are destaged after power returns:
     **0 lost**, the fast acks are kept.
  4. `reorder` — write-back, data at LBA 900 then commit record at LBA 100, destaged in LBA order: commit
     lands first; cut between the two: **commit without its data** (corrupt journal state). With `flush`
     on: data reaches the disk first, then the commit; same cut leaves the old, consistent state.
  5. `battery-failed` — `bbu` on but failed: controller runs write-through (rule 5): preset 1's latencies
     come back (check vendor behaviour).
- **Steps:** one per tick until the queue drains or the cut; `write-through` 30 (too many: step every 4 ms
  → 8 steps), `write-back-cut` 7 steps (grouped ticks), `write-back-bbu` 9, `reorder` 6, `battery-failed`
  8. The kit's step is "next event", not "next millisecond" (derived).
- **Legend:** dirty block (hatched), clean/durable (solid), acknowledged (tick on the app timeline),
  lost (crossed, "izgubljeno"), battery (icon, on/off). "Changed" marks the block acknowledged or destaged in
  this step.
- **Captions:**
  - hr: „Upravljač je potvrdio sva šest pisanja za 0,6 ms (*write-back*), ali na disku su tek tri. Nestanak
    struje sada briše ostala tri, a aplikacija misli da su zapisana."
  - en: "With the battery, the three dirty blocks wait in cache and are written as soon as power returns."
- **Terms:** write-back — odgođeno upisivanje (check); write-through — izravno upisivanje (check); cache —
  priručna memorija (ossimulator `raid-cache`; UL ch12 „priručna sprema"); acknowledgement — potvrda;
  dirty block — prljavi blok (check); battery-backed cache — priručna memorija s baterijom; flush —
  pražnjenje priručne memorije (check).
- **Misconceptions:** "acknowledged means on disk"; "write-back is unsafe, full stop" (with BBU it is the
  normal setting); "the RAID controller's cache is the only cache" (the drive has its own).
- **Out of scope:** the OS page cache and `fsync` semantics in depth, SSD power-loss protection
  (`ssd-internals`), Ceph/bcache write-cache devices, filesystem journalling modes.
- **Note for the coordinator:** the cited seed (scoping note §5 item 5, "no write-cache device in front of
  20 TB spinning disks") is a different concept: an SSD caching/DB tier in front of HDDs for performance,
  not volatile write-back durability. Either relink the seed or add a separate entry (`sto-cache-tier`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `write-cache` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh write-cache sims/write-cache` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/write-cache/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
