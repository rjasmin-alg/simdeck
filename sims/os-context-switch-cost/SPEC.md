<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# os-context-switch-cost: specification

Task `docs/tasks/w3/os-context-switch-cost.md`, catalogue `os-context-switch-cost` (§4.9, wave 3). One concept:
**what a context switch costs: the saved state, and the TLB and cache warm-up after it**. An explorer: the state is
a pure function of the params, `derive(params)` in `sim.js` (`initial` is the same function).

The model is **illustrative**, like ossimulator's `threads` costs (`ossimulator/src/modules/threads/NOTES.md`:
"Troškovi u simulaciji su ilustrativni"). Every timing is a default chosen to show the shape, not a measurement
*(check)*; the page says so on the stage in both languages.

Sources: W. Stallings, *Operating Systems: Internals and Design Principles*, ch. 3 §3.5 "Process switching" (when to
switch; a mode switch without a process switch only changes the mode; a process switch saves the processor context
and changes the memory-management structures) and ch. 8 (the TLB, flushed when the address space changes);
*Intel 64 and IA-32 Architectures Software Developer's Manual*, Vol. 3A, §4.10.1 "Process-Context Identifiers
(PCIDs)" (TLB entries tagged with an address-space identifier survive a change of address space); ossimulator
`processes` (`meta.ts` terms; `NOTES.md` "Mode switch"), `threads` (`costProcessSwitch` vs `costKernelSameProc`:
a switch to a thread of the same process is cheaper), `scheduling` ("Promjene konteksta").

## Params

| Param | Values | Default | Notes |
|---|---|---|---|
| `q` | 0 … 9, the position on the log slider | 6 | Q = `Q_STEPS[q]` µs, `Q_STEPS` = 10, 20, 50, 100, 200, 500, 1 000, 2 000, 5 000, 10 000 (1-2-5 steps, 10 µs … 10 ms) |
| `kind` | `process`, `thread`, `tagged` | `process` | process switch; thread of the same process; process switch with a tagged TLB (address-space identifiers) |
| `direct` | 0.5 … 10 µs, step 0.5 | 2 | direct cost of one switch (save/restore, scheduler, dispatcher) |
| `wCache` | 0 … 200 µs, step 5 | 40 | cache warm-up *(check)* |
| `wTlb` | 0 … 50 µs, step 5 | 10 | TLB warm-up *(check)* |
| `rate` | 0.1 … 0.9, step 0.05 | 0.3 | speed while warming up, as a share of full speed; the model rounds it to 2 decimals |

The task names the quantum param `Q` with log steps; the kit's slider is linear, so the param is the slider position
`q` and the state carries `Q` in µs (NOTES.md, Deviations). Bad params fall back: `q` is rounded and clamped to
0 … 9, an unknown `kind` is `process`, a missing (`null`, empty) or non-finite number takes its default, and every number is clamped to its range.

## Rules

1. **Direct cost.** Each switch costs `direct` µs during which no process runs (Stallings §3.5).
2. **Warm-up.** After a switch the incoming process needs W µs during which it progresses at `rate` of full speed.
3. **Kind.** `process`: W = `wCache` + `wTlb` (new address space, the TLB is flushed). `thread`: W = `wCache` (same
   address space, no TLB flush; `wTlb` is ignored). `tagged`: W = `wCache` (the TLB keeps entries tagged with the
   address-space identifier; Intel SDM 3A §4.10.1).
4. **Useful work per quantum:** Q − W·(1 − rate) if Q ≥ W, else Q·rate. **Useful %** = useful / (Q + direct) · 100.
   At Q = W both branches give W·rate (the rule is continuous; tested).
5. **Switches per second** = 10⁶ / (Q + direct).
6. **Where a quantum's time goes** (`perQuantum`, sums to Q + direct): `direct`; `warm` = min(Q, W)·(1 − rate), the
   time lost to stalls; `useful` (rule 4). Also `warmTime` = min(Q, W) (the striped bar: the process runs but stalls)
   and `fullTime` = Q − `warmTime` (full speed).
7. **Timeline:** six slots, k = 0 … 5, each `direct` + Q long, starting at k·(direct + Q); slot k runs process A for
   even k and B for odd k; each slot is a switch (direct), then `warmTime`, then `fullTime`. The window is
   6·(direct + Q) (the task's "≈ 6 quanta", growing with Q).
8. **Shown value and band.** `pct1` is the useful % as shown: rounded to 6 decimals first (drops floating-point noise
   such as 89.99999999999999), then to one decimal, halves up. The **band** is taken from `pct1`: `high` when ≥ 90,
   `mid` when ≥ 50, else `low`, so the gauge never reads "90.0 %" in the middle band. **Tie-breaks:** exactly 90.0 is
   `high`, exactly 50.0 is `mid`; 89.95 shows 90.0 and is `high`. The page marks the gauge "changed" when the band
   differs from the one it showed last (not on first load).
9. **Regime** (which caption): `nowarm` when W = 0; else `thrash` when Q ≤ W (the process never runs at full speed;
   **tie-break:** Q = W is `thrash`, although rule 4 takes its first branch); else `warm`.
10. **Curve:** useful % (rule 4, same params) at Q = 10^(1 + i/20) µs, i = 0 … 60 (10 µs … 10 ms), plus Q = W when
    10 ≤ W ≤ 10 000 and W is not already a point (the kink), ascending by Q.
11. **Saved and lost** (the side card). Saved on every switch: registers, program counter, stack pointer, flags, FPU/SIMD
    state; the page-table base register is saved and switched for `process` and `tagged`, and stays (`same`) for
    `thread`. Goes cold: the TLB is `flushed` for `process`, `kept` for `thread`, `tagged` (kept) for `tagged`; the
    cache is `cold` (displaced by the other process or thread) for every kind.

## Expected numbers (defaults unless named; Python, `fractions` not needed: all are short decimals)

| Preset | q (Q) | kind | W | useful / quantum | useful % | switches / s | band | regime |
|---|---|---|---|---|---|---|---|---|
| `desktop` | 9 (10 ms) | process | 50 | 9 965 | 99.630 | 99.98 | high | warm |
| `server` (default) | 6 (1 ms) | process | 50 | 965 | 96.307 | 998.00 | high | warm |
| `too-often` | 3 (100 µs) | process | 50 | 65 | 63.725 | 9 803.92 | mid | warm |
| `threads` | 3 (100 µs) | thread | 40 | 72 | 70.588 | 9 803.92 | mid | warm |
| `thrash` | 1 (20 µs) | process | 50 | 6 | 27.273 | 45 454.55 | low | thrash |

Others, used by the tests: Q = 50, process: useful 15 both ways, 28.846 %, regime `thrash` (rule 9 tie-break);
Q = 100, tagged: 70.588 % (as `threads`); `wCache` 0 and `thread`: W = 0, Q = 100 → 98.039 %, regime `nowarm`;
Q = 10, process: 3 / 12 = 25 %; perQuantum at `too-often`: direct 2, warm 35, useful 65 (sum 102). The task's
caption ("the switch itself takes 2 µs, … 50 µs … Only 63.7 %") is `too-often`.

The band follows the shown value (rule 8): Q = 100, `wCache` 0, `wTlb` 15, `rate` 0.45 → 89.951 %, shown 90.0, `high`;
Q = 50, `direct` 0.5, `wCache` 0, `wTlb` 45, `rate` 0.45 → 49.99999999999999 %, shown 50.0, `mid`.

Band boundaries reached by slider settings (rule 8): Q = 10, `direct` 10, `thread`, `wCache` 0 → 10 / 20 = **50.0 %,
`mid`**; Q = 100, `direct` 10, `thread`, `wCache` 5, `rate` 0.8 → 99 / 110 = **90.0 %, `high`** (1 − 0.8 is
0.19999999999999996 in binary floating point; here the result still comes out as 90 exactly, and the 6-decimal rounding
guards the settings where such noise would not cancel).
