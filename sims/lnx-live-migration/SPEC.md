<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-live-migration — spec

**Concept:** pre-copy rounds converge only if dirtying is slower than copying.
Task: `docs/tasks/w3/lnx-live-migration.md`; catalogue `docs/catalogue.md` §4.4; course NLA, topic T02
"Seoba uživo i zajedničko spremište".

Explorer: the state is a pure function of the params. Every param change recomputes the whole migration
(`migrate(p)` in `sim.js`); the `round` slider only picks which position the page grid shows.

## Symbols

| | Param | Range | Default |
|---|---|---|---|
| M | `memGiB` · 1024 MiB, guest memory | 1–64 GiB | 4 GiB = 4096 MiB |
| B | `bwMiBs`, migration link bandwidth | 10–2000 MiB/s | 1000 (≈ 10 GbE; 1 GbE ≈ 110) |
| D | `dirtyMiBs`, guest dirty rate | 0–1500 MiB/s | 100 |
| W | `wssMiB`, writable working set, clamped to M | 64–8192 MiB | 1024 |
| L | `downtimeMs`, downtime limit | 50–2000 ms | 300 |
| R | `maxRounds`, rounds before the migration is forced | 5–50 | 30 |
| | `autoConverge`, throttle the guest | toggle | off |
| | `round`, the position the grid shows | 0…number of rounds | 1 |

Units: MiB and seconds. Rounds are numbered from 0 and counted including round 0 ("2 rounds" = rounds 0 and 1).

## Rules

1. **Round 0 copies all of M while the guest runs.** Time T₀ = M / B.
   QEMU docs "Migration framework", pre-copy *(check)*.
2. **Dirtying.** During a round of length T the guest dirties D·T MiB, capped at W (it cannot dirty more distinct
   pages than it writes). Round *i* + 1 sends exactly what round *i* left dirty, and lasts (that amount) / B.
   Derived model of pre-copy, Clark et al., "Live Migration of Virtual Machines", NSDI 2005 (writable working set)
   *(check)*.
3. **Stop-and-copy.** Before every round after round 0: if remaining / B ≤ L, the guest is paused and the
   remaining dirty memory is copied; downtime = remaining / B. QEMU `downtime-limit` (QMP `migrate-set-parameters`),
   default 300 ms *(check)*; libvirt `virsh migrate-setmaxdowntime`.
4. **Convergence needs D < B.** Rounds shrink by the factor D/B (until the cap W no longer binds); with D ≥ B round 0
   already dirties at least M ≥ W, so every later round resends exactly W. Derived from rules 1–2; it is not a separate
   branch in the code, and the tests check it as a consequence.
5. **Forced.** When R rounds have run and rule 3 still does not hold, the guest is paused and the rest is copied,
   whatever the downtime. Models `virsh migrate --timeout` with the suspend action *(check)*; QEMU itself would keep
   iterating. Rule 3 is tested first: if the remainder fits after round R − 1, the outcome is `converged`.
6. **Auto-converge.** From round 2 the vCPUs are throttled 20 %, then +10 % per round (capped at 99 %); the dirty
   rate in round *i* is D · (100 − throttle_i) / 100. QEMU `cpu-throttle-initial` 20, `cpu-throttle-increment` 10,
   `max-cpu-throttle` 99 *(check)*. A simplification: real dirtying is not exactly proportional to CPU time, and QEMU
   starts throttling from its own dirty-ratio heuristic, not at a fixed round.
7. **Tie-breaks.** The stop test uses ≤: remaining exactly at the limit (L · B / 1000 MiB) stops. It is evaluated as
   remaining · 1000 ≤ L · B so that whole numbers compare exactly. Round 0 never stops early, however small M / B is.

Totals: total time = Σ round durations + downtime. `throttlePct` = the last live round's throttle.

## State

```
{ memMiB, wssMiB, limitMiB, rounds: [{ i, sentMiB, seconds, dirtiedMiB, throttlePct }],
  outcome: 'converged' | 'forced', remainingMiB, downtimeMs, totalS, throttlePct, ratio,
  view, paused, grid: { cols, rows, cellMiB, wsCells, cells: [kind] } }
```

## The page grid

128 cells (4 × 32), each M / 128 MiB. The working set is the first ⌈W / cell⌉ cells (a bracket over them). Position
`view` 0…n − 1 (n = number of rounds) shows the start of that round, i.e. what it is about to send; position n shows
the pause.

- view 0: every cell `todo` (not yet copied, dashed): round 0 sends all of M.
- 0 < view < n: ⌈dirtied in round view − 1 / cell⌉ cells of the working set `dirty` (hatched), the rest `clean`.
- view n: ⌈remaining / cell⌉ cells `paused` (dark, ‖), the rest `clean`.

A partly dirty cell counts as dirty (ceil). Which working-set cells are dirty is a fixed shuffle seeded by the view, so
it looks scattered and is the same every time.

## Presets (M 4096 MiB, W 1024 MiB, L 300 ms, R 30; derived, numbers checked with `sim.js`)

| id | B | D | other | rounds | outcome | downtime | total |
|---|---|---|---|---|---|---|---|
| `10gbe-converges` | 1000 | 100 | | 2 | converged | 41 ms (40.96 MiB) | 4.55 s |
| `1gbe-busy` | 110 | 100 | | 30 | forced | 587 ms (64.55 MiB) | 133.8 s |
| `dirty-faster` | 110 | 150 | | 30 | forced | 9.31 s (1024 MiB) | 316.5 s |
| `auto-converge` | 110 | 150 | auto-converge | 10 | converged | 41 ms (4.53 MiB), throttle 90 % | 90.4 s |
| `1gbe-quiet` | 110 | 50 | | 6 | converged | 181 ms (19.87 MiB) | 54.2 s |

Worked rounds:

- `10gbe-converges`: round 0 4096 MiB in 4.096 s, dirties 409.6; 409.6 / 1000 = 0.41 s > 0.3 → round 1 409.6 MiB in
  0.41 s, dirties 40.96; 0.041 s ≤ 0.3 → pause 41 ms. Total 4.096 + 0.4096 + 0.041 = 4.547 s.
- `1gbe-busy`: round 0 37.24 s dirties min(3724, 1024) = 1024; then ×(100/110) per round: round k ≥ 1 sends
  1024 · 0.909^(k−1); after round 29, 1024 · 0.909^29 = 64.55 MiB → 0.587 s > 0.3, R reached → forced.
- `dirty-faster`: every round sends 1024 MiB in 9.309 s and dirties min(1396, 1024) = 1024; 30 rounds; total
  37.236 + 30 · 9.309 = 316.5 s.
- `auto-converge`: throttles 0, 0, 20, 30, … 90 %; sent 4096, 1024, 1024, 1024, 977.5, 799.7, 545.3, 297.4, 121.7,
  33.2 MiB; round 8 leaves 33.2 MiB (0.302 s > 0.3, so round 9 runs), round 9 leaves 4.53 MiB → 41 ms.
- `1gbe-quiet`: sent 4096, 1024, 465.5, 211.6, 96.2, 43.7; 43.7 / 110 = 0.397 s > 0.3 → round 5; leaves 19.87 MiB →
  181 ms.

Caption of `dirty-faster` (task): hr „Gost prlja 150 MiB/s, a veza prenosi 110 MiB/s: svaki krug ponovno šalje cijeli
radni skup od 1 GiB. Pretkopiranje ne konvergira; nakon 30 krugova gost se zaustavlja na 9,3 s." / en "The guest dirties
150 MiB/s and the link carries 110 MiB/s: every round resends the whole 1 GiB working set. Pre-copy does not converge;
after 30 rounds the guest is paused for 9.3 s."

## Captions

One key per outcome (`captionKey`): `cIdle` (round 0 dirtied nothing), `cConverged` (D < B, no throttle),
`cSmallWss` (D ≥ B but W fits the limit after round 0), `cThrottled` (converged with a throttle), `cForcedWss`
(forced, and every round after round 0 resent all of W: D ≥ B, or throttled but still dirtying faster than the
link), `cForcedSlow` (forced although the rounds shrank: D < B, or the throttle came too late). A forced migration
with a throttle adds the sentence `cThrottleNote`.

## Out of scope

Post-copy, storage migration without shared storage (T02 assumes shared storage), compression/XBZRLE, multifd,
measuring the dirty rate itself, the time to transfer device state.
