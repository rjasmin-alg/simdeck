# tcp-congestion: TCP congestion control

| | |
|---|---|
| Task | `tcp-congestion` (wave 2b, Network fundamentals) |
| Catalogue entry | `net-tcp-congestion` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/tcp-congestion/` |
| Class | explorer |
| Size | M |
| Priority | P1 |
| Courses | URM, NLA |
| Topic / tags / level | `networks` / `tcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **slow start, congestion avoidance, AIMD sawtooth, Reno vs CUBIC**.

The student: set loss and RTT, watch cwnd over time.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md` (Uvod u računalne mreže): "TCP: pouzdanost, kontrola toka i kontrola zagušenja" (congestion control vs flow control only; no cwnd mechanics) and `ch13-prozor-kontrola-toka.svg` (the flow/congestion distinction panel)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/06-fizicki-sloj.md` (congestion as delay rising near capacity, referenced by ch13)
- RFC 5681 (TCP Congestion Control) §3.1 slow start and congestion avoidance, §3.2 fast retransmit/fast recovery; RFC 6582 (NewReno); RFC 9438 (CUBIC) §4.2, §4.3, §4.6; RFC 6928 (initial window 10)
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md` T44 "Podešavanje jezgre — `sysctl`, i kako se zna da je pomoglo" (where `net.ipv4.tcp_congestion_control` reno/cubic would be set; the topic table names no TCP topic explicitly)
- Catalogue seed: URM ch13

## Overlaps (catalogue §5)

- **§5.8 TCP:** Separate pages, one shared sequence-chart view and one TCP model. Teardown is a second mode of the ported handshake page. The state machine is the union of the others; build it last or not at all.

## Model and presets

- **Scene:** a large **live chart** (kit "small live chart" view, not the sequence chart): cwnd in MSS
  (y) against time in RTT rounds and in seconds (x), 60 rounds wide. A dashed horizontal line for ssthresh,
  a solid one for the bottleneck capacity (BDP + buffer, in MSS). Loss events are marked on the curve
  (▼ three duplicate ACKs, ✕ timeout) and phases shaded with a label (slow start, congestion avoidance).
  With "both" chosen, Reno and CUBIC are drawn together (two series, distinct colour and dash).
- **State:** derived, recomputed from params: `{ series: {reno: [{r, t, cwnd, ssthresh, phase, event}],
  cubic: [...]}, summary: {lossCount, avgCwnd, timeToRecover} }`. Pure function of the params (seeded
  RNG for random loss).
- **What the params drive:** every param change recomputes the whole series and redraws; the summary
  under the chart gives the numbers the lecturer points at (sawtooth low/high, rounds per tooth, seconds
  to recover after a loss).
- **Rules** (per RTT round, cwnd and ssthresh in MSS):
  1. Slow start while cwnd < ssthresh: cwnd doubles per RTT (+1 MSS per ACK), capped at ssthresh when it
     would jump past it (RFC 5681 §3.1).
  2. Congestion avoidance while cwnd ≥ ssthresh: cwnd += 1 MSS per RTT (RFC 5681 §3.1).
  3. Loss model: a loss happens in the round where cwnd exceeds the capacity (deterministic, default), or
     with probability p per round (seeded). This is the page's model, not a TCP rule.
  4. Reno, loss by three duplicate ACKs: ssthresh = max(⌊cwnd/2⌋, 2); cwnd = ssthresh (fast recovery
     collapsed to one round) (RFC 5681 §3.2; RFC 6582 NewReno). This is the AIMD sawtooth.
  5. Timeout (any algorithm): ssthresh = max(⌊cwnd/2⌋, 2); cwnd = 1 (loss window), then slow start again
     (RFC 5681 §3.1).
  6. CUBIC after a loss: Wmax = cwnd, cwnd = β·Wmax with β = 0.7; then W(t) = C·(t − K)³ + Wmax with C =
     0.4 and K = ∛(Wmax·(1 − β)/C), t in **seconds** since the loss (RFC 9438 §4.2, §4.6). Growth depends on
     time, not on RTT.
  7. CUBIC's Reno-friendly region: if the Reno estimate W_est (α = 3(1 − β)/(1 + β) ≈ 0.53 MSS per RTT) is
     above W(t), cwnd = W_est (RFC 9438 §4.3). Show it as an option; off by default (check whether the
     page needs it at the default RTTs).
  8. Edge: initial window 1 MSS by default for a readable start; option 10 (RFC 6928, Linux default).
     Initial ssthresh 64 MSS ("arbitrarily high" in RFC 5681).
- **Params:** `algo` choice reno | cubic | both (default reno); `rtt` range 10–300 ms, step 10 (default 100);
  `capacity` range 10–100 MSS (default 40); `lossMode` choice capacity | random (default capacity); `p`
  range 0–5 %, step 0.5 (shown only for random); `iw` choice 1 | 10 (default 1); `timeoutAt` choice none /
  round 30 (default none); `seed` button "new random losses".
- **Presets:**
  1. `slow-start` — Reno, capacity 100: 1, 2, 4, 8, 16, 32, 64 (= ssthresh) then +1 per RTT. Derived from RFC
     5681.
  2. `sawtooth` — Reno, capacity 40: 1 … 64 → loss → 32, 33 … 41 → loss → 20 … 41 → loss → 20; each tooth
     21 RTTs (2.1 s at 100 ms). Derived, computed.
  3. `timeout` — `sawtooth` with a timeout at round 30 (cwnd 30): ssthresh 15, cwnd 1 → 1, 2, 4, 8, 15, 16
     … Derived.
  4. `reno-vs-cubic` — both, capacity 40, RTT 100 ms: Reno drops 41 → 20 and needs 21 RTTs (2.1 s) back to 41;
     CUBIC drops 41 → 28.7 and returns to Wmax at K = ∛(41·0.3/0.4) ≈ 3.13 s, flattening near Wmax.
     Derived from RFC 9438, computed.
  5. `long-rtt` — same at RTT 200 ms: Reno now needs 4.2 s per tooth, CUBIC still ≈ 3.13 s (RTT
     independence). Derived.
  6. `random-loss` — Reno, random p = 1 %, seed fixed: irregular sawtooth, lower average cwnd. Derived.
- **Steps:** explorer, no steps (an optional "play" may sweep the x-axis cursor; not required).
- **Legend:** Reno (c1, solid), CUBIC (c2, dashed), ssthresh (thin dashed), capacity (thick line), loss by
  dup ACKs (▼), timeout (✕), slow-start shading (hatched); "changed" marks the series that a param change
  moved (outline flash, off under reduced motion).
- **Captions** (the caption reads the current state):
  - hr: "Tri duple potvrde pri cwnd = 41: Reno prepolovi prozor na 20 i opet raste za jedan MSS po RTT-u.
    Do 41 treba mu 21 RTT, 2,1 s."
  - en: "With RTT doubled to 200 ms, Reno takes 4.2 s to climb back, while CUBIC still returns to Wmax
    after about 3.1 s: its growth is measured in seconds, not round trips."
- **Terms:** congestion control — kontrola zagušenja (URM ch13); congestion window (cwnd) — prozor
  zagušenja (cwnd) (check); slow start — spori početak (check); congestion avoidance — izbjegavanje
  zagušenja (URM ch13); slow-start threshold — prag sporog početka (ssthresh) (check); additive increase,
  multiplicative decrease — aditivno povećanje, multiplikativno smanjenje (AIMD) (check); round-trip time —
  vrijeme kruženja (URM ch13).
- **Misconceptions:** slow start is slow (it is exponential); congestion control is flow control (URM ch13
  separates them: the receiver window vs the network); one loss resets to 1 (only a timeout does).
- **Out of scope:** BBR, ECN, the receive window (`urm-flow-control`), fairness between flows, the
  per-ACK detail of fast recovery, HyStart.
- **Note for the coordinator:** URM ch13 only names congestion control and separates it from flow control;
  it has no slow start, AIMD, ssthresh or CUBIC and no worked example, so every number here is derived from
  RFC 5681 and RFC 9438. The task's Depends line names K1 (sequence chart); this page needs the "small live
  chart" view (catalogue §7.2), not K1. Croatian terms marked (check) are not in the course books.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `tcp-congestion` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh tcp-congestion sims/tcp-congestion` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/tcp-congestion/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
