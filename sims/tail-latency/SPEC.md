<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tail-latency: specification

Task `docs/tasks/w3/tail-latency.md`, catalogue `perf-tail-latency` (§4.8). One concept: **p99 decouples from the
mean; fan-out makes the tail common**. An explorer: the state is a pure function of the params, `compute(params)` in
`sim.js`.

The one-node formulas are `utilisation-latency`'s (rules 2–3 there), a port of dc-sim's analytical M/G/1 kernel
(`src/dc_sim/kernel/queueing.py`: `pk_wait_time`, `mean_sojourn_time`, `p99_latency`, `compute_queue_metrics`;
`docs/concepts.md` §2). `models/` has no queueing model yet, so `utilization`, `zone` and `queueMetrics` are copied
from `sims/utilisation-latency/sim.js @ f2e6118` unchanged (COMMON.md §6). The fan-out rule is J. Dean and
L. A. Barroso, "The Tail at Scale", *Communications of the ACM* 56(2), 2013, pp. 74–80.

## Params

| Param | Values | Default | Notes |
|---|---|---|---|
| `cv2` | 0–16, step 1 | 1 | squared coefficient of variation of the backend's service time; 1 = exponential (M/M/1) |
| `rho` | 0.1, 0.5, 0.8 | 0.1 | the backend's utilisation ρ |
| `fanout` | 1–200, step 1 | 1 | N, calls one user request makes in parallel |
| `slowP` | `p99`, `p999` | `p99` | what counts as a slow call: above the backend's p99 (1 in 100) or p99.9 (1 in 1000) |

The backend is dc-sim's `tail_decoupling` db: capacity **C = 10 req/s** (service time 1/C = 0.1 s), fixed. The
arrival rate is λ = ρ × C (ρ 0.1 is the scenario's λ 1).

## Rules

Units: rates in requests per second, times in seconds.

1. **Mean and p99 of one node** (dc-sim; `utilisation-latency` rules 2–3). With vf = (1 + cv²)/2:
   W = ρ/(1 − ρ) × vf × 1/C + 1/C (Pollaczek–Khinchine mean wait plus service), p99 = ln 100 × vf / (C × (1 − ρ)).
   At low ρ the mean is dominated by 1/C, which does not depend on cv²; p99 scales with vf at every ρ (dc-sim
   `p99_latency` docstring: the cv² scaling is dc-sim's modelling choice, exact only at cv² = 1). ρ ≤ 0.8 here, so
   the clamp at 0.999 is never reached (kept in the copied function).
   - `ratioMean` = W / W(cv² 1) and `ratioP99` = p99 / p99(cv² 1), at the same ρ: how far cv² moved each from the
     exponential reference. The p99 ratio is vf at every ρ.
   - **p99.9** (for `slowP` = `p999`): the same tail form with ln 1000, p99.9 = ln 1000 × vf / (C × (1 − ρ))
     = 1.5 × p99 (*derived*: dc-sim's scaling extended to another percentile; exact for M/M/1, where the time in
     system is exponential with rate C − λ).
   - **Decoupled** (the "mean looks fine, the tail does not" caption): `ratioP99 > 2 × ratioMean`, strict, dc-sim's
     acceptance assertion `p99_ratio > mean_ratio * 2`. Equal is not decoupled.
2. **Fan-out.** A user request sends N calls in parallel and answers when the slowest returns. A call is slow (above
   the backend's p99, or p99.9) with probability q = 0.01 (or 0.001); calls are independent, so the user request is
   slow with probability **pSlow = 1 − (1 − q)^N** (Dean & Barroso). N = 1 gives q itself: the backend's own share.
   The state also reports `slowCalls` = N × q, the mean number of slow calls per user request.
3. **Independence is an assumption** (derived), stated on the page: shared causes (one slow disk, a pause on one
   host, a noisy neighbour) correlate the calls, which changes the share but no longer to 1 − (1 − q)^N.
4. **Hedged requests** (Dean & Barroso: send a second copy after the p95 and take the first answer) are out of the
   model; the explanation names them.

## State

`{ capacity, service, lambda, rho, cv2, wMean, p99, p999, ratioMean, ratioP99, decoupled, fanout, slowP, q,
threshold, pSlow, slowCalls }`; `threshold` is p99 or p99.9 (the chosen slow line). Plain JSON.

## Sketch (illustration, not model)

The model gives two numbers per node, W and p99, not a distribution. The left panel draws **100 requests sorted by
their time**, each a bar, as a sketch: the times are the quantiles (i + ½)/100, i = 0…99, of a **gamma distribution
fitted to the model's mean W and p99** (shape k from p99/W by bisection, scale W/k). A gamma covers every ratio p99/W
the params reach (2.4–22.4); a Weibull tops out near 18.8 and a lognormal at 15.0, so neither can.
At **cv² 0** every service takes exactly 1/C, so no request can be faster: the sketch is 1/C + a gamma fitted to
W − 1/C and p99 − 1/C (`sketchOf(state)`). That ratio reaches 28.05 at ρ 0.1, just under the gamma's own maximum
p99/mean of 28.34 (at shape 0.0158; below that shape the ratio falls again), so the shape search starts at 0.016. By construction
the slowest bar (quantile 0.995) is past p99 and the 99th (0.985) is not: one request in a hundred is slow. With
`p999` the line moves to p99.9 and none of the hundred passes it (one in a thousand would). `sketch(w, p99)` in
`sim.js` is pure and tested (its mean and its 0.99 quantile match W and p99); it is not part of the state.

The time axis is fixed per ρ so a cv² change moves the markers, not the axis: 4 s at ρ 0.1, 8 s at 0.5, 20 s at
0.8 (near p99 at cv² 16: 4.35, 7.83, 19.6 s; at ρ 0.1 the last cv² values run past the edge, which keeps cv² 1 readable).
A marker past the axis gets an arrow in its label, a bar past it an arrowhead at the edge.

## Captions (`captionKey(state, params, prev)`, first that applies)

`prev` is the params before the last change (null on first load). A change touches the left panel (`cv2`, `rho`) or
the right one (`fanout`, `slowP`).

1. Only left params changed → the left family.
2. Only right params changed → the right family.
3. Otherwise (first load, a preset or a reset changing both sides, nothing changed): fan-out N > 1 → the right
   family, else the left.

Left family, by the state: `tail` (cv² > 1 and decoupled: the task's hr caption, "mean ×1.4, p99 ×5; the mean looks
fine, the tail does not"); `cv2Load` (cv² > 1, not decoupled, ρ ≥ 0.5: under load the
wait in the queue grows with cv² too, so the mean rises with the tail); `cv2Up` (cv² > 1, not decoupled, ρ 0.1: cv² 2
and 3, both move a little); `cv2Ref`
(cv² = 1, the exponential reference: W = 1/(C − λ) and p99 = ln 100 × W ≈ 4.6 × the mean at every ρ);
`cv2Down` (cv² 0: both drop below the exponential case). Right family: `fanOne` (N = 1: q of user requests) and
`fanout` (N > 1: the task's en caption).

## "Changed"

The gauges are the mean W, p99 and the slow share. After a change, the one whose value moved most, measured as
|ln(new/old)|, is marked. **Ties** (within 1e-9) mark all of them: at cv² 1 a ρ change moves W and p99 by the same
factor (both ∝ 1/(1 − ρ)), so both are marked. Nothing moved, or no previous state: none.

## Presets and expected numbers (checked with a script against dc-sim's formulas, and by `sim.test.js`)

Presets apply on top of the defaults (cv² 1, ρ 0.1, N 1, p99).

| # | id | Params | Numbers |
|---|---|---|---|
| 1 | `tail-decoupled` | cv² 9 | dc-sim `tail_decoupling` / `test_a_tail_decoupled_from_mean` (db C 10, λ 1, ρ 0.1): cv² 1 → 9, W **0.111 → 0.156 s** (×1.4), p99 **0.512 → 2.558 s** (×5.0); p99 ratio > 3, mean ratio < 1.5, p99 ratio > 2 × mean ratio |
| 2 | `fanout-10` | N 10 | pSlow = 1 − 0.99¹⁰ = **9.56 %** |
| 3 | `fanout-100` | N 100 | pSlow = 1 − 0.99¹⁰⁰ = **63.4 %** (Dean & Barroso: 1 in 100 slow, 100 servers → 63 %) |
| 4 | `p999` | N 100, p99.9 | pSlow = 1 − 0.999¹⁰⁰ = **9.52 %** |

Also: N 200 → 86.6 % (p99), 18.1 % (p99.9). cv² 0 at ρ 0.1: W 0.106 s (×0.95), p99 0.256 s (×0.5). ρ 0.5, cv² 9:
W 0.600 s (×3.0), p99 4.61 s (×5.0), not decoupled. ρ 0.8, cv² 9: W 2.10 s (×4.2), p99 11.5 s (×5.0), not decoupled.
ρ 0.8, cv² 16: p99 19.6 s, p99.9 29.4 s.

## Tie-breaks (tested first)

- Decoupled is strict: `ratioP99` exactly 2 × `ratioMean` is not decoupled.
- N = 1: pSlow = q exactly (0.01, 0.001); `slowCalls` = q.
- cv² 1: both ratios exactly 1.
- "Changed": a tie marks every gauge in it; no change marks none.
- Caption: a change on both sides follows rule 3 (N > 1 → right); a change of nothing follows rule 3 too.
- The sketch: the 100th bar is past p99 and the 99th is not, at every cv² and ρ; at cv² 0 none is under 1/C.
- "Changed": a ρ 0.8 → 0.1 change at cv² 1 is a tie only within the tolerance (the two |ln| differ in the last bit).
- Caption rule 3 and the right family switch at N = 2.
