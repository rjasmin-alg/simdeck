# iops-latency: IOPS, throughput and latency

| | |
|---|---|
| Task | `iops-latency` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `sto-iops-latency` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/iops-latency/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | NLA, DR |
| Topic / tags / level | `storage` / `storage-basics` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `utilisation-latency` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **queue depth and block size trade them off**.

The student: sliders for block size, queue depth, device.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/utilisation-latency/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T27 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T27 ("Mjerenje i ugađanje diskovnog podsustava — `fio`, redovi, planeri")
- `~/projects/ossimulator/src/modules/disk-scheduling/sim/timing.ts` (HDD vs SSD access-time model; SSD
  0.1 ms per access) and its `NOTES.md` (Croatian terms „slijedno/nasumično")
- J. D. C. Little, "A Proof for the Queuing Formula L = λW", *Operations Research* 9(3), 1961 (rule 4);
  device constants are illustrative, to be checked against data sheets *(check)*

## Model and presets

- **Scene:** a device box with **P internal lanes** (1 for a spinning disk, several for flash) and a queue in
  front of it holding QD outstanding requests of size `bs`. Three gauges side by side: **IOPS**,
  **throughput (MB/s)**, **latency per request (ms)**, and a small chart of the three against QD (log
  axis 1…256) with the current point marked. Reuses `utilisation-latency`'s queue drawing; the queueing
  formula there (M/G/1) is *not* reused, this is a closed system with a fixed number of requests in flight.
- **State:** pure function of params → `{ svcMs, iops, mbps, latMs, bound: 'latency'|'parallelism'|
  'bandwidth' }`.
- **Live:** sliders recompute and move the point on the chart; the label says which limit binds.
- **Rules** (toy closed-loop model, derived; check the device numbers against vendor data sheets and a
  benchmark measurement in NLA T27 when written):
  1. Service time of one request = access time + `bs` / device bandwidth (access time: 8 ms for random HDD,
     0 for sequential HDD; 0.1 ms SATA flash; 0.08 ms NVMe flash) (derived).
  2. With QD requests outstanding and P lanes: IOPS = min(QD, P) / service time.
  3. Bandwidth cap: IOPS ≤ bandwidth / `bs` (HDD 200 MB/s, SATA 550 MB/s, NVMe 3000 MB/s) (derived).
  4. Latency per request follows Little's law for the closed loop: latency = QD / IOPS (Little 1961; link
     `littles-law`).
  5. Throughput = IOPS × `bs`.
  6. Tie-break for the "bound" label: bandwidth if rule 3 capped, else parallelism if QD ≥ P, else latency.
- **Params:** `device` choice HDD random / HDD sequential / SATA SSD / NVMe SSD (NVMe); `bs` choice 4 KiB /
  16 KiB / 128 KiB / 1 MiB (4 KiB); `qd` choice 1 / 2 / 4 / 8 / 16 / 32 / 64 / 128 (1).
- **Presets** (from the rules above, computed with a script; device constants derived):
  1. `hdd-random` — HDD, 4 KiB, QD 1: **125 IOPS, 0.5 MB/s, 8.0 ms**; QD 32: still 125 IOPS, latency
     **257 ms** (one arm: deeper queues only wait).
  2. `hdd-sequential` — HDD sequential, 1 MiB, QD 1: 191 IOPS, **200 MB/s**, 5.2 ms; the same disk random at
     1 MiB: 76 IOPS, 79 MB/s.
  3. `nvme-qd` — NVMe, 4 KiB: QD 1 **12,290 IOPS, 50 MB/s, 0.081 ms**; QD 32 **393,288 IOPS, 1.6 GB/s,
     0.081 ms** (parallelism used, latency flat); QD 128: same IOPS, latency **0.33 ms**.
  4. `nvme-big-blocks` — NVMe, 128 KiB, QD 32: bandwidth-bound at **3000 MB/s, 22,888 IOPS, 1.4 ms**; QD 1:
     8,085 IOPS, 1.06 GB/s, 0.12 ms.
  5. `sata-vs-nvme` — SATA SSD 4 KiB QD 32: 74,455 IOPS, 305 MB/s, 0.43 ms, next to preset 3.
- **Steps:** explorer, no steps.
- **Legend:** request in queue (small square), request in a lane (filled), lane (slot), current point on the
  chart (ring). "Changed" marks the gauge whose bound changed after the last parameter change.
- **Captions:**
  - hr: „Na vrtećem disku dublji red (*queue depth*) ne donosi više operacija u sekundi (*IOPS*): ruka je
    jedna, pa zahtjevi samo dulje čekaju — 125 IOPS uz 257 ms."
  - en: "With 128 KiB blocks the drive hits its 3 GB/s ceiling at QD 32: IOPS stop rising and every extra
    request in the queue only adds latency."
- **Terms:** IOPS — U/I operacija u sekundi (IOPS); throughput — propusnost; latency — kašnjenje (latencija);
  queue depth — dubina reda; block size — veličina bloka; random / sequential access — nasumičan / slijedan
  pristup (ossimulator `disk-scheduling` „slijedno/nasumično").
- **Misconceptions:** "IOPS and MB/s are the same number in different units"; "a faster disk always has
  lower latency at any queue depth"; "more parallel requests always help".
- **Out of scope:** disk scheduling order (ossimulator `disk-scheduling`), the open-system M/G/1 view
  (`utilisation-latency`), filesystem and page-cache effects, write amplification (`ssd-internals`), tail
  latency (`tail-latency`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh iops-latency sims/iops-latency` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/iops-latency/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
