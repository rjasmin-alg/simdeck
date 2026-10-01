# lnx-cgroups: cgroups limits

| | |
|---|---|
| Task | `lnx-cgroups` (wave 3, Linux) |
| Catalogue entry | `lnx-cgroups` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-cgroups/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `containers` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-namespaces` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **CPU shares and memory limits; OOM inside a cgroup**.

The student: set limits, run greedy workloads.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-namespaces/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, §3 Kontejneri, topic T11 ("Što kontejner jest — imenski prostori, cgroups, sposobnosti…"); chapters not written yet
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/12-lvm-zauzece-redundancija.md` (odlagalište memorije, meko/tvrdo ograničenje: terms) and `08-procesi.md` (proces, opterećenje sustava)
- Linux kernel documentation "Control Group v2" (Documentation/admin-guide/cgroup-v2.rst): `cpu.weight` (rule 1), "Weights" (rule 2), `cpu.max` and `cpu.stat nr_throttled` (rule 3), `memory.high` (rule 4), `memory.max`, "OOM", `memory.oom.group` (rule 5)
- man pages cgroups(7), proc(5) (`oom_score`, `oom_score_adj`; rule 5), podman-run(1) (`--cpus`, `--memory`, `--cpu-shares`; rule 7), docker run reference "Runtime constraints on resources" (rule 7), systemd.resource-control(5)
- Catalogue seed: NLA T11

## Overlaps (catalogue §5)

- **§5.17 Containers:** Separate pages (each is one concept) on one container diagram.

## Model and presets

- **Scene:** the container diagram from `lnx-namespaces`, reduced to the host plus three cgroups A, B, C
  (drawn as boxes on the host, each with its processes). Under each box: a CPU bar (cores used, with the
  `cpu.max` cap drawn as a line) and a memory bar (`memory.current`, with `memory.high` and `memory.max`
  lines). A host strip shows total cores and host RAM. An OOM event appears as a cross on the killed process
  inside its box.
- **State (computed live from params):** `{ cores, groups: [{ id, weight, quota, demandCpu, memHigh, memMax,
  demandMem, procs: [{pid, rss}], alloc, memUsed, throttled, oomKilled: [pid] }], hostFree }`.
- **Explorer, what the params drive:** every change recomputes (1) the CPU split and (2) each group's memory
  outcome; nothing accumulates over time, so the model is a pure function of params.
- **Rules:**
  1. CPU under contention is split in proportion to `cpu.weight` (1–10000, default 100) among groups that
     want CPU.
  2. Weights are not limits: a group's unused share goes to the others (work-conserving). Model: water-filling
     — give each group min(demand, cap, weighted share), repeat with the leftover among unsatisfied groups
     (the fill is an idealisation of the scheduler) *(check: idealised)*.
  3. `cpu.max` = "quota period" (e.g. `50000 100000` = 0.5 CPU) is a hard cap that applies even when the
     machine is idle; the excess shows as throttling (`cpu.stat nr_throttled`).
  4. `memory.high` is a throttle point: above it the group is reclaimed hard and slowed, never OOM-killed
     because of `high` alone.
  5. If usage would exceed `memory.max` and reclaim cannot free enough, the OOM killer runs inside that
     cgroup only; candidates are the group's processes, the largest (by badness: RSS + swap + page tables,
     adjusted by `oom_score_adj`) dies, even if the host has free RAM. With `memory.oom.group=1` the whole
     group is killed.
  6. Tie-break: equal badness → the lower PID dies *(check: kernel picks the first found in the scan; the
     model needs a total order)*.
  7. The container engine's resource limits map onto these files: a 1.5-CPU limit → `cpu.max 150000
     100000`; a 512 MB memory limit → `memory.max`; the older v1 CPU-share setting (default 1024) is
     converted to `cpu.weight` *(check conversion formula, Sources)*.
- **Params:** `cores` range 1–8, default 2; per group (A, B, C): `weightX` range 1–1000 step 1 (UI cap,
  default 100), `quotaX` range 0–8 step 0.1 cores (0 = `max`, default 0), `cpuX` demand range 0–8 cores
  (A 2, B 2, C 0), `memMaxX` select 256M/512M/1G/2G/max (default 512M), `memHighX` select off/256M/384M/1G
  (default off), `memX` demand range 0–2048 MB step 32 (A 300, B 300, C 0); `toggle` `oomGroup` (default off).
- **Presets:**
  1. `weights-contention` (default): 2 cores, A weight 100 demand 2, B weight 300 demand 2 → A 0.5, B 1.5
     cores. Rule 1. Derived.
  2. `weights-idle`: same but B demand 0 → A gets 2.0 (rule 2). Derived.
  3. `quota-cap`: 4 cores, A demand 4, a 0.5-CPU limit (`cpu.max 50000 100000`) → A 0.5, 3.5 cores idle, A throttled (rule 3). Derived.
  4. `oom-inside`: host 16 GB, A `memory.max` 512M, two processes 200 MB and 400 MB → the 400 MB one is
     killed; host still has ≈ 15 GB free (rule 5). Derived.
  5. `high-throttle`: A `memory.high` 384M, `memory.max` 512M, demand 450 MB → throttled, no kill; raise demand
     to 600 MB → OOM (rules 4–5). Derived.
  6. `oom-group`: preset 4 with `oomGroup` on → both processes die (rule 5). Derived.
- **Steps:** 0 (explorer); each preset is one configuration, the lecturer moves sliders from there.
- **Legend:** CPU used (solid), CPU wanted but not given (hatched), `cpu.max` cap (dashed line); memory used
  (solid), `memory.high` (dotted line), `memory.max` (thick line); OOM-killed process (cross + "OOM").
  "Changed" outlines the bars whose value changed with the last param edit.
- **Captions:**
  - hr: "Pod opterećenjem B dobiva tri puta više procesora od A (težina 300 prema 100): 1,5 jezgre prema 0,5."
  - en: "Under contention B gets three times A's CPU (weight 300 to 100): 1.5 cores to 0.5."
  - hr: "Grupa A je prešla `memory.max` od 512 MB: *OOM killer* (ubojica pri nedostatku memorije) ubija proces unutar A, iako domaćin ima 15 GB slobodno."
  - en: "Group A crossed its 512 MB memory.max: the OOM killer kills a process inside A, though the host has 15 GB free."
- **Terms:** control group — kontrolna grupa (cgroup) *(check: NLA T11 uses `cgroups`)*; limit — ograničenje
  (UL ch12 "tvrdo ograničenje"); process — proces; load / CPU — procesor, jezgra; swap — odlagalište
  memorije (UL ch12); OOM killer — OOM killer *(check: no book term)*.
- **Misconceptions:** CPU weights cap a container (they only matter under contention); a memory limit makes
  the container slow rather than killed; the OOM killer picks from the whole host.
- **Reuse:** from `lnx-namespaces` only the container/host box drawing; namespaces themselves are not shown.
  New: the CPU split and the memory outcome.
- **Out of scope:** cgroup v1 hierarchies and controllers, `cpuset`, io controller, PSI, page cache charged to
  the group (mention: it counts toward `memory.current`), swap limits, systemd slices (mention that
  `systemd-run -p MemoryMax=` writes the same file).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-cgroups sims/lnx-cgroups` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-cgroups/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
