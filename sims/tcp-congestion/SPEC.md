<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-congestion: specification

One concept: **TCP congestion control**, the congestion window over time: slow start, congestion avoidance, the AIMD
sawtooth, Reno against CUBIC. Task `docs/tasks/w2/tcp-congestion.md`, catalogue `net-tcp-congestion` (§4.1).
Explorer: no steps; every param change recomputes the whole picture (`initial(params)` in `sim.js`).

Every number below is derived from the rules and checked in `sim.test.js` (test name in brackets).

## Sources

- RFC 5681, TCP Congestion Control: §3.1 slow start and congestion avoidance (cwnd += 1 MSS per ACK in slow start,
  ≈ 1 MSS per RTT in congestion avoidance, slow start while cwnd < ssthresh and either when equal, eq. 4
  ssthresh = max(FlightSize / 2, 2·SMSS), loss window 1 SMSS after a retransmission timeout, initial ssthresh
  "arbitrarily high"); §3.2 fast retransmit and fast recovery (ssthresh by eq. 4 on the third duplicate ACK, cwnd
  deflated to ssthresh at the end of recovery).
- RFC 6582, NewReno (fast recovery ending with cwnd = ssthresh).
- RFC 9438, CUBIC: §4.2 the window function W(t) = C·(t − K)³ + Wmax with t in seconds and
  K = ∛((Wmax − cwnd_epoch) / C); §4.3 the Reno-friendly region, α = 3(1 − β)/(1 + β); §4.6 multiplicative decrease
  with β = 0.7; §4.8 timeout (ssthresh by β, then K = 0 and Wmax = cwnd at the start of the next congestion avoidance
  stage); §5 C = 0.4.
- RFC 6928, initial window 10.
- URM book ch. 13 "TCP: pouzdanost, kontrola toka i kontrola zagušenja": congestion control against flow control (the
  receiver's window against the network); ch. 6: congestion as delay rising near capacity. The book has no slow start,
  AIMD, ssthresh or CUBIC and no worked example, so every number here comes from the RFCs.

## Units and time

- cwnd and ssthresh in MSS (segments). Reno's are whole numbers; CUBIC's are real (shown with one decimal).
- One point per RTT round, r = 0 … 60 (61 points, the chart is 60 rounds wide). The point is the window **sent in that
  round**; a loss event belongs to the round whose window was hit and changes the window from round r + 1 on.
- Time of round r: t = r · RTT seconds. RTT 10–300 ms, step 10, default 100.

## Params

| key | values | default |
|---|---|---|
| `algo` | `reno`, `cubic`, `both` | `reno` |
| `rtt` | 10–300 ms, step 10 | 100 |
| `capacity` | 10–100 MSS (bottleneck: BDP + buffer) | 40 |
| `lossMode` | `capacity` (the full bottleneck only), `random` (that plus random losses) | `capacity` |
| `p` | 0–5 %, step 0.5: the chance that one segment is lost (shown with `random`) | 1 |
| `iw` | 1, 10 | 1 |
| `timeoutAt` | 0 (none), 30 (a timeout in round 30) | 0 |
| `friendly` | CUBIC's Reno-friendly region on or off (shown with `cubic`, `both`) | off |
| `seed` | integer; the button "new random losses" adds 1 (shown with `random`) | 4 |

## Rules (per RTT round)

1. **Slow start** while cwnd < ssthresh: cwnd doubles per RTT (+1 MSS per ACK). If doubling would pass ssthresh,
   cwnd = ssthresh (RFC 5681 §3.1). *Tie-break:* cwnd = ssthresh is congestion avoidance (RFC 5681 allows either; the
   task's rule 2 says ≥) [tie: cwnd equal to ssthresh …], [tie: slow start that would jump past …].
2. **Congestion avoidance** while cwnd ≥ ssthresh: Reno adds 1 MSS per RTT (RFC 5681 §3.1) [rule 2].
3. **Loss model** (the page's, not a TCP rule). The round sends ⌊cwnd⌋ segments. A loss by duplicate ACKs happens in
   the round where ⌊cwnd⌋ > capacity (the bottleneck's buffer overflows). With `lossMode = random`, also: each segment
   is lost with probability p, so the round loses one or more with 1 − (1 − p)^⌊cwnd⌋; one draw u per round from
   mulberry32(seed) (the kit's `Simdeck.rng`), loss when u is below that. Reno and CUBIC take the same draw in the
   same round (the same "weather"). A random loss with fewer than 4 segments in flight (⌊cwnd⌋ < 4) cannot bring
   three duplicate ACKs (the lost segment plus three after it), so it is a **timeout** (rule 5). Each loss records its
   cause: `capacity`, `random` or `timer` (the timeout param). *Tie-breaks:* a window equal to the capacity is no
   loss; 40.9 MSS is 40 segments, no loss; a timeout and a loss in the same round count as the timeout [rule 3, tie
   tests].
4. **Reno, three duplicate ACKs:** ssthresh = max(⌊cwnd/2⌋, 2); cwnd = ssthresh in the next round (fast recovery
   collapsed into one round, RFC 5681 §3.2, RFC 6582). Odd windows round down: 41 → 20 [rule 4, tie: halving].
5. **Timeout** in round `timeoutAt`: Reno: ssthresh = max(⌊cwnd/2⌋, 2), cwnd = 1, slow start again (RFC 5681 §3.1).
   CUBIC: ssthresh = max(β·cwnd, 2), cwnd = 1, slow start, then a new epoch (RFC 9438 §4.8; see deviations)
   [rule 5, rule 5 for CUBIC].
6. **CUBIC, three duplicate ACKs:** Wmax = ⌊cwnd⌋, the window in whole segments at the loss (implementations count
   segments); ssthresh = cwnd = max(β·Wmax, 2), β = 0.7. The epoch starts in the next round (t = 0 there, where the
   window is exactly β·Wmax): W(t) = C·(t − K)³ + Wmax, C = 0.4, K = ∛((Wmax − β·Wmax)/C), t in **seconds** since the
   epoch started (round k of the epoch: t = k·RTT). The window comes from the clock, not from the round count; it is
   kept to 4 decimals, the precision the series records, and that value decides the loss. *Tie-break:* after a loss
   by duplicate ACKs CUBIC is in congestion avoidance (W(0) = ssthresh counts as equal) until a timeout.
   Entering congestion avoidance from slow start (the first time, or after a timeout) starts an epoch with K = 0 and
   Wmax = cwnd: RFC 9438 §4.8 says so for the stage after a timeout; the first exit from slow start, which has no
   Wmax yet, is treated the same [rule 6 tests, tie: CUBIC never slips back].
7. **Reno-friendly region** (option, off by default): W_est starts at the epoch's cwnd and grows by
   α = 3(1 − β)/(1 + β) ≈ 0.529 MSS per RTT until it reaches Wmax, then by 1 MSS per RTT; cwnd = max(W(t), W_est)
   (RFC 9438 §4.3) [rule 7].
8. **Initial values:** cwnd = 1 MSS (option 10, RFC 6928); ssthresh = 64 MSS [rule 8]. ssthresh never goes below 2.

## Summary under the chart (`summarize`)

Per algorithm: the number of losses (duplicate ACKs, timeouts, and how many of them the random draw caused), the
average cwnd over the 61 rounds, the last loss (round, kind, cause, window before → after; CUBIC's "before" is Wmax),
and for a last loss by duplicate ACKs the climb back to that window, if no further loss came: Reno (from − to)
rounds × RTT; CUBIC K seconds, or (from − to)/α rounds when the Reno-friendly region reaches it sooner (`by`:
`reno`, `cubic`, `friendly`). After a timeout there is no such climb (slow start), so none is shown.

## Expected numbers (presets)

| # | id | params | expected | test |
|---|---|---|---|---|
| 1 | `slow-start` | Reno, capacity 100 | 1, 2, 4, 8, 16, 32, 64 (= ssthresh, rounds 0–6), then +1 per RTT to 101 in round 43 → loss → 50 | rule 1, rule 2 |
| 2 | `sawtooth` | Reno, capacity 40 | 1 … 64 (round 6) → loss → 32, 33 … 41 (round 16) → loss → 20 … 41 (round 38) → loss → 20 … 41 (round 60). Each tooth climbs 20 → 41 in 21 RTTs, 2.1 s at 100 ms; losses are 22 rounds apart (the loss round plus the climb) | rule 4 |
| 3 | `timeout` | `sawtooth` + timeout in round 30 | cwnd 33 in round 30 → ssthresh 16, cwnd 1 → 1, 2, 4, 8, 16 (slow start lands exactly on ssthresh), 17, … 41 (round 60) | rule 5 |
| 4 | `reno-vs-cubic` | both, capacity 40, RTT 100 ms | Reno as `sawtooth`: 41 → 20, 21 RTTs = 2.1 s back. CUBIC: 64 → 44.8 (round 6), 44.8 → 30.8 (round 7, still over 40), 41.2 → 28.7 (round 21, Wmax = 41), then W(t) back to 41 in 31 rounds (t = 3.1 s; K = ∛(41·0.3/0.4) ≈ 3.13 s), loss in round 53; its steps shrink near Wmax (concave), six rounds at 41.0 | rule 6 (whole segments) |
| 5 | `long-rtt` | the same at RTT 200 ms | Reno: the same 21 RTTs, now 4.2 s. CUBIC: losses in rounds 6, 7, 15, 32, 49: 16 rounds = 3.2 s per climb, still ≈ K | rule 6: grows with time |
| 6 | `random-loss` | Reno, random, p = 1 %, seed 4 | capacity losses in rounds 6 (64) and 16 (41), random ones in 29, 33, 38, 50, 53: losses 10, 13, 4, 5, 12 and 3 rounds apart; average cwnd ≈ 19.3 MSS against ≈ 30.1 for `sawtooth` | preset random-loss |

Checked against a script before coding (the model's own output printed per preset). Counting Wmax in whole segments
is what makes the chart agree with K: with a real-valued Wmax (41.47, 41.01 …) the flat top of W(t) crosses 41 a
second or more before K, and the teeth came out 2.2–2.8 s while the caption said 3.13 s (found in review).

At the default RTT (100 ms) the Reno-friendly region matters only near the top of a CUBIC tooth: W_est reaches 41 after
(41 − 28.7)/0.529 ≈ 23 rounds = 2.3 s, before K = 3.13 s, so with the option on CUBIC loses in rounds 21 and 46 (teeth
of ≈ 24 rounds instead of 31). At 200 ms it never applies (23 rounds = 4.6 s > K); at 10–30 ms it decides the whole
climb. Off by default, so presets 4 and 5 show the pure cubic the task's numbers describe.

## Misconceptions the page answers

- "Slow start is slow": it doubles every RTT (1 → 64 in 6 RTTs).
- "Congestion control is flow control": flow control is the receiver's window (URM ch. 13, `flow-control`); this page
  is the sender's own window against the network.
- "Any loss resets to 1": only a timeout does; three duplicate ACKs halve (Reno) or keep 70 % (CUBIC).

## Out of scope

BBR, ECN, the receive window (`flow-control`), fairness between flows, the per-ACK detail of fast recovery, HyStart.
Simplified from RFC 9438: the window of a round is W(t) at that round, not the target W(t + RTT) approached per ACK
(§4.2); no fast convergence (§4.7); no 1.5·cwnd per-RTT cap in the convex region (§4.4).
