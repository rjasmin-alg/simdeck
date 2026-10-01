# lnx-live-migration: Live migration

| | |
|---|---|
| Task | `lnx-live-migration` (wave 3, Linux) |
| Catalogue entry | `lnx-live-migration` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-live-migration/` |
| Class | explorer |
| Size | M |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `virtualization` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **pre-copy rounds converge only if dirtying is slower than copying**.

The student: slider for dirty rate and bandwidth.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T02 "Seoba uživo i zajedničko spremište" (Napredna Linux administracija; chapters not written yet)
- QEMU documentation "Migration framework" (pre-copy, stop-and-copy) and QMP `migrate-set-parameters` (`downtime-limit`, `cpu-throttle-initial`, `cpu-throttle-increment`, `max-bandwidth`); libvirt `virsh` manual (`migrate --live --timeout`, `migrate-setmaxdowntime`)
- C. Clark et al., "Live Migration of Virtual Machines", NSDI 2005 (pre-copy rounds, writable working set)
- Catalogue seed: NLA T02

## Model and presets

- **Scene:** two hosts, source and destination, joined by a migration link labelled with its bandwidth; the
  VM's memory as a page grid on the source (clean / dirtied since last copy / copied); below, a bar chart of
  pre-copy rounds (data sent per round and its duration) and a result card: rounds, total time, downtime,
  converged or forced.
- **State (computed from params, explorer):** `{ rounds: [{i, sentMiB, seconds, dirtiedMiB}], outcome:
  'converged'|'forced', downtimeMs, totalS, throttlePct }`.
- **Explorer:** every param change recomputes the whole migration; the stage shows the rounds as bars. A
  `round` slider (0…number of rounds) scrubs which round the page grid shows.
- **Rules:**
  1. Round 0 copies all guest memory M while the guest runs. Time = M / B. QEMU docs "Migration framework"
     (pre-copy) (check).
  2. During a round of length T the guest dirties D·T MiB, capped at its writable working set W (it cannot
     dirty more distinct pages than it writes). Round *i* + 1 resends exactly what round *i* left dirty.
     Derived model of pre-copy (Clark et al., NSDI 2005, "Live Migration of Virtual Machines") (check).
  3. Before each round after round 0: if remaining dirty / B ≤ the downtime limit, the guest is paused and the
     rest is copied (stop-and-copy); downtime = remaining / B. QEMU `downtime-limit`, default 300 ms
     (QEMU QMP `migrate-set-parameters`) (check); libvirt `virsh migrate-setmaxdowntime`.
  4. The rounds shrink only if D < B (the ratio D/B < 1); with D ≥ B every round re-sends at least as much
     (or W). Derived from rules 1–2.
  5. If `maxRounds` is reached without meeting rule 3, the migration is forced: the guest is paused and the
     remaining dirty memory copied, whatever the downtime. Models `virsh migrate --timeout` with the suspend
     action (check); QEMU itself would keep iterating.
  6. Auto-converge (toggle): from round 2 the guest's vCPUs are throttled 20 %, then +10 % per round (QEMU
     `cpu-throttle-initial` 20, `cpu-throttle-increment` 10) (check); the dirty rate drops in proportion
     (a simplification: real dirtying is not exactly proportional to CPU time).
  7. Tie-break: the stop test uses ≤, so remaining exactly at the limit stops. Round 0 never stops early.
- **Params:** `memGiB` range 1–64, default 4; `bwMiBs` range 10–2,000 MiB/s, default 1,000 (≈ 10 GbE; 1 GbE ≈
  110); `dirtyMiBs` range 0–1,500 MiB/s, default 100; `wssMiB` range 64–8,192, default 1,024 (clamped to M);
  `downtimeMs` range 50–2,000, default 300; `maxRounds` range 5–50, default 30; `autoConverge` toggle, off.
- **Presets** (M 4 GiB = 4,096 MiB, W 1,024 MiB, limit 300 ms unless stated; all derived, unchecked):
  1. `10gbe-converges` — B 1,000, D 100: round 0 4.10 s, round 1 0.41 s (409.6 MiB), then 41 MiB left →
     stop-and-copy, downtime 41 ms, total 4.55 s, 2 rounds.
  2. `1gbe-busy` — B 110, D 100 (D/B 0.91): rounds shrink by ×0.91 only; 30 rounds pass, forced with 587 ms
     downtime after 133.8 s.
  3. `dirty-faster` — B 110, D 150: every round re-sends the full 1,024 MiB working set; forced after 30
     rounds with 9.3 s downtime (316.5 s total): no convergence.
  4. `auto-converge` — preset 3 with auto-converge on: converges after 10 rounds, downtime 41 ms, total
     90.4 s (paid for with a throttled guest).
  5. `1gbe-quiet` — B 110, D 50: 6 rounds, downtime 181 ms, total 54.2 s.
- **Steps:** none (explorer); the `round` slider scrubs rounds.
- **Legend:** grey cell = not yet copied, green = copied and clean, red hatched = dirtied after copying,
  dark = copied during pause; bar = one round; dashed line = downtime limit expressed in MiB (limit × B).
  "Changed" highlight: the result card values that changed after the last param change.
- **Captions:**
  - hr: „Gost prlja 150 MiB/s, a veza prenosi 110 MiB/s: svaki krug ponovno šalje cijeli radni skup od
    1 GiB. Pretkopiranje ne konvergira; nakon 30 krugova gost se zaustavlja na 9,3 s."
  - en: "The guest dirties 150 MiB/s and the link carries 110 MiB/s: every round resends the whole 1 GiB working
    set. Pre-copy does not converge; after 30 rounds the guest is paused for 9.3 s."
- **Terms:** live migration — seoba uživo (NLA toc T02); pre-copy — pretkopiranje (check); dirty page —
  prljava stranica (check); downtime — vrijeme prekida (check); working set — radni skup; bandwidth —
  propusnost; shared storage — zajedničko spremište (NLA toc T02).
- **Misconceptions:** a faster link always finishes a migration (only if it beats the dirty rate); live
  migration has no downtime; migration time depends only on memory size.
- **Out of scope:** post-copy, storage migration without shared storage (T02 assumes shared storage),
  compression/XBZRLE, multifd, dirty-rate measurement itself.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-live-migration` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-live-migration sims/lnx-live-migration` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-live-migration/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
