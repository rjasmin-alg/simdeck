<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# iops-latency: specification

Task `docs/tasks/w3/iops-latency.md`, catalogue `sto-iops-latency` (§4.6). Class **explorer**: the state is a pure
function of the params (`sim.js` `compute`), no steps.

**One concept:** queue depth and block size trade IOPS, throughput and latency off against each other.

## Scene

A queue of waiting requests (small squares, as in `utilisation-latency`'s queue) in front of a device box with **P
lanes** (slots; a request in a lane is a filled square), and a bandwidth pipe out of the box filled to MB/s ÷
ceiling. A badge names the limit that binds. Below, three gauges side by side, **IOPS**, **throughput (MB/s)** and
**latency per request (ms)**, each over a small chart of that metric against queue depth (log₂ axis 1…256) for the
current device and block size, with the current point ringed, a dashed vertical line at QD = P (all lanes busy) and,
on the throughput chart, the dashed bandwidth ceiling. Clicking or dragging on a chart sets QD (snapped to 1…128).

## Params

| key | control | values (default) |
|---|---|---|
| `device` | choice | `hdd-random` / `hdd-seq` / `sata` / `nvme` (`nvme`) |
| `bs` | choice | 4 / 16 / 128 / 1024 KiB (4) |
| `qd` | select (8 options; the kit's choice holds at most 5) | 1 / 2 / 4 / 8 / 16 / 32 / 64 / 128 (1) |

Unknown values fall back to the defaults (`norm`).

## Constants (derived, illustrative; *check* against data sheets and a measurement in NLA T27)

| device | access time | bandwidth | lanes P | source |
|---|---|---|---|---|
| HDD random | 8 ms | 200 MB/s | 1 | task rule 1, 3; one arm |
| HDD sequential | 0 | 200 MB/s | 1 | task rule 1, 3 |
| SATA SSD | 0.1 ms | 550 MB/s | 8 | task rules; ossimulator `timing.ts` (0.1 ms per SSD access); P = 8 from the task's 74,455 IOPS at QD 32 |
| NVMe SSD | 0.08 ms | 3000 MB/s | 32 | task rules; P = 32 from the task's 393,288 IOPS at QD 32 = QD 128 |

MB = 10⁶ B, KiB = 1024 B. Access times are kept in integer µs so rule 3's comparison is exact.

## Rules

Sources: the task's toy closed-loop model (derived); Little, "A Proof for the Queuing Formula L = λW", *Operations
Research* 9(3), 1961 (rule 4).

1. **Service time** of one request = access time + `bs` / bandwidth. (`bs`/(MB/s) is µs exactly.)
2. **IOPS** with QD outstanding and P lanes = min(QD, P) / service time.
3. **Bandwidth cap:** IOPS ≤ bandwidth / `bs`. Capped when min(QD, P) / service ≥ bandwidth / `bs`, tested exactly as
   (min(QD, P) − 1) × `bs` ≥ bandwidth × access time; **equal counts as capped**. Capped → IOPS = bandwidth / `bs`.
4. **Latency** per request = QD / IOPS (Little's law for the closed loop).
5. **Throughput** = IOPS × `bs`. Shown in the scene too: time a request spends in a lane = min(QD, P) / IOPS, the
   service time, or longer when capped (the lanes share the bandwidth: NVMe 128 KiB QD 4 → 0.17 ms per request
   against a 0.12 ms service time; nobody waits, so that is the latency).
6. **Bound** label, tie-break: `bandwidth` if rule 3 capped; else `parallelism` if QD ≥ P; else `latency`.
7. **Changed** (legend): after a parameter change that changes the bound, the gauge of the new bound is marked:
   bandwidth → throughput, parallelism → IOPS, latency → latency. Same bound → nothing marked.
8. **Caption:** one sentence for what changed, when exactly one of device, `bs`, `qd` changed (before → after), then
   one sentence for the bound: `bBandwidth`; `bLatency` (QD < P); for P = 1 `bArm1` (QD 1) or `bArmQueue` (QD > 1);
   for P > 1 `bLanesFull` (QD = P) or `bLanesQueue` (QD > P).

### Tie-breaks (each has its test)

- Rule 6: bandwidth before parallelism: NVMe 128 KiB QD 32 is both capped and QD ≥ P → `bandwidth`.
- Rule 6: QD = P exactly → `parallelism` (SATA QD 8, HDD random QD 1); QD = P − 1 → `latency`.
- Rule 3: equal → capped: HDD sequential (access 0) is capped at every QD, so `bandwidth` even at QD 1.
- Rule 3: NVMe 128 KiB: QD 2 not capped (1 × 131,072 < 240,000), QD 3 capped (262,144 ≥ 240,000).

## Presets (expected numbers, printed by a script from rules 1–6 before coding)

| id | params | expected |
|---|---|---|
| `hdd-random` | HDD random, 4 KiB, QD 32 | **125 IOPS, 0.5 MB/s**, latency **257 ms** (256.66), parallelism; at QD 1: 125 IOPS, 8.0 ms (8.02) |
| `hdd-sequential` | HDD sequential, 1 MiB, QD 1 | 191 IOPS (190.7), **200 MB/s**, 5.2 ms, bandwidth; same disk random at 1 MiB: 76 IOPS (75.5), 79 MB/s, 13 ms |
| `nvme-qd` | NVMe, 4 KiB, QD 32 | **393,288 IOPS, 1611 MB/s, 0.081 ms**, parallelism; QD 1: 12,290 IOPS, 50 MB/s, 0.081 ms, latency; QD 128: 393,288 IOPS, **0.33 ms** |
| `nvme-big-blocks` | NVMe, 128 KiB, QD 32 | **3000 MB/s, 22,888 IOPS, 1.4 ms**, bandwidth; QD 1: 8,085 IOPS, 1060 MB/s, 0.12 ms, latency |
| `sata-vs-nvme` | SATA SSD, 4 KiB, QD 32 | 74,455 IOPS, 305 MB/s, 0.43 ms, parallelism (next to `nvme-qd`) |

Other checked numbers: HDD sequential 4 KiB QD 1 = 48,828 IOPS, 200 MB/s, 0.020 ms (the toy model has no per-request
overhead on a streaming disk); SATA 1 MiB QD 1 = 498 IOPS, 523 MB/s, 2.0 ms; NVMe 1 MiB QD 2 = capped, 2861 IOPS,
0.70 ms.

## Out of scope

Disk scheduling order (ossimulator `disk-scheduling`), the open-system M/G/1 view (`utilisation-latency`), filesystem
and page-cache effects, write amplification (`ssd-internals`), tail latency (`tail-latency`).
