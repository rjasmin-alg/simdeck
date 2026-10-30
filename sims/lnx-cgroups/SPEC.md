<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-cgroups: specification

One concept: **CPU shares and memory limits; OOM inside a cgroup.** A weight only matters under contention, `cpu.max`
is a hard cap, `memory.high` slows a group down, and over `memory.max` the OOM killer kills inside that group only,
though the host has RAM free. The student sets limits on three groups and runs greedy workloads.

Task: `docs/tasks/w3/lnx-cgroups.md`. Catalogue: `lnx-cgroups` (`docs/catalogue.md` §4.4, §5.17). Class: explorer.
Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[CG2]** Linux kernel documentation, "Control Group v2" (`Documentation/admin-guide/cgroup-v2.rst`): `cpu.weight`
  (1–10000, default 100), "Weights" (a child's share is its weight over the sum of the active siblings' weights;
  work-conserving), `cpu.max` ("$MAX $PERIOD", default "max 100000"), `cpu.stat` `nr_throttled`, `memory.current`
  (page cache is charged to the group), `memory.high` ("throttle limit … the processes of the cgroup are throttled and
  put under heavy reclaim pressure"; "Going over the high limit never invokes the OOM killer"), `memory.max` ("If a
  cgroup's memory usage reaches this limit and can't be reduced, the OOM killer is invoked in the cgroup"),
  `memory.oom.group` (the group is killed as a whole). Not available offline on this machine: read from memory of the
  document *(check: re-read the current text)*.
- **[CGM]** cgroups(7) (local man page): v2 unified hierarchy, the `cpu` and `memory` controllers.
- **[PROC]** proc(5): `oom_score`, `oom_score_adj` (−1000…1000; the score is mostly the process's memory share,
  shifted by `oom_score_adj` in thousandths of the memory the OOM is about).
- **[SRC]** systemd.resource-control(5) (local man page, systemd 255): `CPUWeight=` controls `cpu.weight` (1 to 10000,
  kernel default 100), `CPUQuota=` controls `cpu.max`, `CPUQuotaPeriodSec=` its second field (default 100 ms);
  `MemoryHigh=`, `MemoryMax=` write `memory.high`, `memory.max`.
- **[ENG]** podman-run(1) and the docker run reference, "Runtime constraints on resources": `--cpus`, `--memory`,
  `--cpu-shares` (default 1024). Builder sources only; the page says "the container engine".
- **[CONV]** The v1 shares → v2 weight conversion of the OCI runtimes (opencontainers/cgroups, runc 1.3, crun 1.23,
  2025): `weight = ceil(10^((l² + 125·l)/612 − 7/34))`, `l = log2(shares)`, mapping 2 → 1, 1024 → 100, 262144 → 10000.
  The earlier linear one, `1 + (shares − 2)·9999/262142`, gave 1024 → 39. *(check: from memory, not re-read.)*
- **[UL]** `uvod-u-linux` ch12 (odlagalište memorije, meko/tvrdo ograničenje), ch08 (proces, opterećenje sustava).
- **[NLA]** `napredna-linux-administracija/meta/toc.md`, T11 (cgroups as part of what a container is).

## Scene

- **The host** (top strip, ink frame with a thick top as in `lnx-namespaces`): its cores as a stacked bar (A, B, C
  by allocation, idle hatched; a tick per core) and its RAM (host's own 512 MB, A, B, C, free), with "free x GB".
- **Three groups A, B, C** (boxes in series colours 1–3, each with its letter): the group's files as the kernel reads
  them back (`cpu.weight`, `cpu.max`, `memory.high` and `memory.max` in bytes or `max`, `memory.oom.group`), its two processes (PID, name,
  RSS; a killed one struck through, dashed red, "✗ OOM"), a CPU bar and a memory bar, and chips for "throttled:
  cpu.max", "slowed: over memory.high", "OOM in the group". The group being edited has a thicker frame.
- **CPU bar**: used (solid), wanted but not given (hatched), the `cpu.max` cap (dashed line), the host's cores (dotted)
  when the scale is wider; scale 0 … ceil(max(cores, every demand, every cap)), shared by all three bars.
- **Memory bar**: used (solid), wanted but killed (hatched), `memory.high` (dotted line, only when below
  `memory.max`), `memory.max` (thick line); scale 0–2 GB.
- **Changed**: the bars whose outcome changed with the last param edit get the highlighter and outline; the host strips
  when any group's CPU or memory changed.

## Params

| key | type | values | default |
|---|---|---|---|
| `cores` | range | 1–8 | 2 |
| `group` | choice | A, B, C: which group's controls the panel shows (view only) | A |
| `weightX` | range | 1–1000 (UI cap; the kernel allows 10000) | A 100, **B 300**, C 100 |
| `quotaX` | range | 0–8 step 0.1 cores, 0 = `max` | 0 |
| `cpuX` | range | demand 0–8 step 0.1 cores | A 2, B 2, C 0 |
| `memMaxX` | choice | 256M, 512M, 1G, 2G, max | 512M |
| `memHighX` | choice | off, 256M, 384M, 1G | off |
| `memX` | range | demand 0–2000 MB step 50 (task: 0–2048 step 32, which cannot hit the presets' 450 and 600) | A 300, B 300, C 0 |
| `oomGroup` | toggle | `memory.oom.group` = 1 in every group | off |

The defaults are preset 1 (`weights-contention`), so `weightB` defaults to 300.

**Processes.** A and B have a small and a large process, ⌊D/3⌋ and the rest of the group's demand D (A: `api` 1201,
`cache` 1202; B: `batch` 1301, `index` 1302). C has two equal workers, ⌊D/2⌋ and the rest (`worker` 1401, 1402), so the
tie-break can be reached from the page. `oom_score_adj` is 0 on the page; the model takes any value.

**Host.** 16 GB RAM (16384 MB), of which 512 MB are the host's own (kernel and its processes), outside the groups.

## State

`{ cores, idle, groups: [{ id, weight, quota, demandCpu, alloc, throttled, memHigh, memMax, demandMem, memUsed,
procs: [{ pid, name, rss, killed }], oom, oomKilled: [pid], overHigh, files }], hostRam, hostOwn, memTotal, hostFree }`,
computed by `compute(params)`; nothing accumulates. `splitCpu`, `memoryOutcome`, `oomOrder`, `badness`, `cpuMax`,
`sharesToWeight`, `engineFiles` are pure over plain data and promotable to `models/`.

## Rules

1. **Weights under contention** [CG2 Weights; SRC]. Among the groups that want CPU, each gets a share in proportion
   to its `cpu.weight`. A group that wants nothing takes no share and its weight does not count.
2. **Weights are not limits** [CG2: work-conserving]. Water-filling: every wanting group gets min(want, weight/ΣW ×
   left); a group that wants no more than its share takes only its want, and the rest is split again among the others
   by weight, until nothing is left or every group is satisfied; what remains is idle. `want = min(demand, cap)`.
   *(Idealised: the real scheduler reaches this split on average over time, not exactly.)*
3. **`cpu.max` is a hard cap** [CG2 `cpu.max`, `cpu.stat`]. "quota period" in µs (`50000 100000` = 0.5 CPU, period
   100000); it holds even when the machine is idle. A group is **throttled** when its demand is above its cap and it
   gets its whole cap (the cap, not the weights, is what stops it); `nr_throttled` then rises every period. A group
   held below its cap by the weights is not throttled.
4. **`memory.high` throttles, never kills** [CG2 `memory.high`]. Use above `memory.high` (and `memory.high` below
   `memory.max`): `overHigh`, reclaimed and slowed. No kill for it, however far above.
5. **`memory.max` and the OOM killer inside the group** [CG2 `memory.max`, OOM; PROC]. The demand is anonymous memory
   and there is no swap, so reclaim cannot free it: if the group's demand is above `memory.max` (strictly), the OOM
   killer runs in that group only. It kills the process with the highest badness = RSS + `oom_score_adj` × limit /
   1000 (MB; swap and page tables out of scope), then the next, until the rest fits. Other groups and the host's free
   RAM play no part. With `memory.oom.group` = 1 every process of the group is killed. `memory.max` = `max`: never.
   A process with `oom_score_adj` −1000 is never killed (also not by `memory.oom.group`). A group whose processes were
   all killed wants no CPU any more: its CPU demand is 0 in the split (rule 1), so its share goes to the others.
6. **Tie-break**: equal badness → the lower PID dies first (the model's total order, the task's choice). *(check: in
   the kernel, `oom_evaluate_task` skips a task only when its points are lower than the chosen one's, so on equal points
   the task found later in the scan replaces the earlier one; the task's note says "first found". With badness counted
   in pages ties are rare. Kept as the task states; the tie caption says the *page* breaks the tie by the lower PID.
   Flagged for the owner.)*
7. **The engine's limits are these files** [SRC; ENG; CONV]. A CPU limit of c cores → `cpu.max` `round(c × 100000)
   100000`; a memory limit of m MB → `memory.max` m × 2²⁰ bytes; the v1 CPU shares (default 1024) → `cpu.weight` by
   [CONV], so 1024 → 100. The page shows the files; the explanation names the mapping. `systemd-run -p MemoryMax=`
   writes the same file.

## Expected numbers (checked with a script before the page was written; pinned in `sim.test.js`)

| preset | params over the defaults | outcome |
|---|---|---|
| 1 `weights-contention` (default) | — | A 0.5, B 1.5 cores, idle 0 |
| 2 `weights-idle` | `cpuB` 0 | A 2.0 (its share by weight would be 0.4) |
| 3 `quota-cap` | `cores` 4, `cpuA` 4, `quotaA` 0.5, `cpuB` 0 | A 0.5, idle 3.5, A throttled, `cpu.max 50000 100000` |
| 4 `oom-inside` | `memA` 600 | A: 200 + 400 MB; 1202 (400) killed; A uses 200; host free 16384 − 512 − 200 − 300 = 15372 MB = 15.0 GB |
| 5 `high-throttle` | `memA` 450, `memHighA` 384M | 150 + 300 = 450 > 384: throttled, no kill; at `memA` 600: 1202 killed, 200 left, under `memory.high` again |
| 6 `oom-group` | `memA` 600, `oomGroup` | 1201 and 1202 killed, A uses 0, host free 15.2 GB |
| tie (no preset) | `memC` 600 | C: 300 + 300; 1401 killed |

## Captions

`nextFocus` picks the group and half the caption speaks about: a preset's own focus; else the param changed last
(`weight`/`quota`/`cpu` → that group, CPU; `memMax`/`memHigh`/`mem` → that group, memory; `cores` → CPU, `oomGroup` →
memory, same group; `group` → the picked group, same half); with no history, B and CPU. `captionKey(state, focus)`:

- Memory: `cOomGroup` (OOM with `memory.oom.group` 1), `cOom` (+ `cOomMore` when more than one died), `cOomTie` (one
  died and its size equals another process's), `cHigh` / `cHighNoMax`, `cMemNone`, `cMemFits` / `cMemNoMax`.
- CPU: `cThrottledIdle` / `cThrottled` (idle cores or not); the group wants nothing → `cCpuNoneIdle` / `cCpuNone`
  (idle cores or not); else, among the wanting groups not stopped by a cap, two
  both short of their demand → `cContention` (the task's caption: "B gets 3 times A's CPU (weight 300 to 100): 1.5
  cores to 0.5") or `cEqual`; one wanting group, short → `cAlone`; any other shortage → `cSplit`; it gets more than
  cores × weight / ΣW (all three weights) → `cWorkConserving`; else `cNoContention`.

The task's two captions are used: `cContention` (with the ratio as a number) and `cOom` (naming the victim).

## Out of scope

cgroup v1 hierarchies and controllers, nested groups, `cpuset`, the io controller, PSI, swap and `memory.swap.max`,
page cache (the explanation says it counts toward `memory.current`), `memory.low`/`min`, host-wide (global) OOM (the
demand on the page is at most 3 × 2000 MB of 16 GB, so it cannot happen), systemd slices (the explanation names
`systemd-run -p MemoryMax=`), the time a throttled group waits, real `nr_throttled` counts.
