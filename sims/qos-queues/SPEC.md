# qos-queues: specification

Task: `docs/tasks/w3/qos-queues.md` (catalogue `net-qos-queues`, §4.1). Class: explorer. One concept: **strict
priority vs weighted fair queuing, with tail drop**. The student sets the traffic mix and the queue weights.

Numbers marked *(check)* come from vendor documentation I could not open here; they are listed in `NOTES.md`.

## Scene

Three traffic sources (voice, video, bulk; circle, triangle, square; series colours c1, c2, c3), each marked with
the DSCP class it declares (EF, AF41, DF) → a classifier → the queues (one shared queue for FIFO, one queue per
class otherwise, drawn as rows of slots up to the limit) → the scheduler → one outgoing link of C packets per tick.
The scene shows the **last tick** (299): the queues just after that tick's arrivals, the packets the scheduler takes
from them (outlined), the packets dropped at a full queue (✕), and the packets on the link in send order.

Below: a small live chart of delivered (up) and dropped (down, hatched) packets per class, as the mean per tick over
bins of 10 ticks, with the capacity C as a line and ticks 0–99 (queues filling) shaded; and a table per class:
offered, delivered, dropped (%), mean queuing delay.

## Model (`sim.js`, pure, deterministic)

`run(params)` → `{ series: { delivered[t][c], dropped[t][c], fill[t][q] }, totals[c], all, snapshot }`.

- Time in ticks, T = 300 (ticks 0 … 299). **Statistics over ticks 100–299** (200 ticks), after the queues fill.
  Offered and dropped count arrivals in that window; delivered and delay count departures in it.
- All packets are the same size (one link slot), so only counts matter.
- **One tick, in this order:**
  1. *Arrivals:* class i adds `rate_i` packets; fractional rates accumulate (an accumulator starts at 0, adds
     `rate_i`, and releases its whole part). The tick's arrivals are put in a seeded random order (Fisher–Yates with
     mulberry32 = `Simdeck.rng(seed)`, one generator for the whole run), so no class is always first.
  2. *Queuing:* each arrival, in that order, joins its queue, or is dropped if the queue is full (tail drop).
  3. *Scheduling:* the scheduler sends up to C packets.
  4. *Delay* of a sent packet = departure tick − arrival tick (a packet sent in the tick it arrived waited 0).

### Rules

| # | Rule | Source |
|---|---|---|
| 1 | **FIFO:** one queue of `limit` packets for all classes, served in arrival order; every class sees the same drop share and the same delay | Cisco IOS QoS Configuration Guide, "Congestion Management Overview", FIFO *(check)* |
| 2 | **Tail drop:** a packet arriving at a full queue is discarded; nothing already queued is removed | RFC 7567 §2 ("tail drop") |
| 3 | **Strict priority (PQ):** always send from the highest-priority non-empty queue, voice > video > bulk; a lower queue is served only when every higher one is empty, so it can starve | Cisco "Congestion Management Overview", Priority Queueing *(check)*; RFC 3246 (EF PHB for voice); Linux `tc-prio(8)` |
| 4 | **Weighted fair sharing (WRR):** weighted round robin with weights w_i on equal packets: the scheduler visits voice, video, bulk in turn and takes up to w_i from each; a queue found empty loses the rest of its turn (work conserving). A tick that runs out of capacity mid-turn stops there and the next tick carries on from the same point, so each backlogged class gets w_i / Σw of C over time. For equal packets this is what WFQ and DRR achieve | Shreedhar & Varghese, "Efficient Fair Queuing using Deficit Round Robin", SIGCOMM 1995; Linux `tc-drr(8)` *(check)* |
| 5 | **Tie-breaks:** equal priority does not occur (fixed order voice, video, bulk); in rule 4 a partial round goes in that fixed order and resumes in the next tick, and a queue that runs empty just as C runs out has finished its turn (the next tick starts with the next queue); the limit applies per queue (PQ, WRR) or to the single queue (FIFO); within a tick the arrival order is the seeded shuffle | task file |
| 6 | **No congestion:** with the offered load below C every tick, every scheduler gives the same result: no drops, delay 0, **as long as one tick's arrivals fit in a queue**. All of a tick's arrivals are queued before the scheduler runs, so FIFO with limit 10 and 4 + 4 + 4 = 12 < C = 20 drops about 17 % while PQ and WRR (three queues of 10) drop nothing | follows from 1–4 and the order of a tick |
| 7 | **Classification** is by the class the source declares (DSCP EF / AF41 / default, RFC 2474; RFC 4594 table 3: EF for telephony, AF4x for multimedia conferencing *(check)*) and is taken as correct; marking and policing are out of scope | RFC 2474, RFC 4594 |

Deviation from the task text (rule 4): the task says "per tick the scheduler visits queues in fixed order … and
repeats while capacity is left". Read literally, each tick restarts at voice, and whenever C ≠ Σw the last partial
round always favours the earlier queues (C = 15, all backlogged, 2:3:5 gives 4 : 6 : 5 instead of 3 : 4.5 : 7.5).
Carrying the position into the next tick is how WRR and DRR keep their round (the DRR paper's active list and deficit
counter persist between transmissions) and gives the stated w_i / Σw. With C = Σw (the presets) both readings agree.

### Params

| Key | Control | Range | Default |
|---|---|---|---|
| `sched` | choice | `fifo` / `pq` / `wrr` | `fifo` |
| `rVoice`, `rVideo`, `rBulk` | range | 0–12 packets/tick, step 0.5 | 2, 5, 8 |
| `C` | range | 5–20 packets/tick | 10 |
| `limit` | choice | 10 / 20 / 60 packets | 20 |
| `wVoice`, `wVideo`, `wBulk` | range, only with `wrr` | 1–8 | 2, 3, 5 |
| `seed` | range | 1–9 | 1 |

`limit` is a choice (segmented buttons), not a drop-down: the kit uses `select` for more than five options.

## Presets (seed 1; exact values from `sim.test.js`, statistics over ticks 100–299, per tick)

Columns: delivered / dropped per tick (dropped % of offered), mean queuing delay in ticks.

| # | id | params | voice | video | bulk |
|---|---|---|---|---|---|
| 1 | `fifo-congested` | FIFO, 2 + 5 + 8 = 15 > C = 10, limit 20 | 1.325 / 0.665 (33.25 %), 1.000 | 3.290 / 1.715 (34.3 %), 1.000 | 5.385 / 2.620 (32.75 %), 1.000 |
| 2 | `priority` | PQ, same load | 2.000 / 0 (0 %), 0 | 5.000 / 0 (0 %), 0 | 3.000 / 5.000 (62.5 %), 5.667 |
| 3 | `starvation` | PQ, voice 11 | 10.000 / 1.000 (9.09 %), 1.000 | 0 / 5.000 (100 %), — | 0 / 8.000 (100 %), — |
| 4 | `weighted` | WRR 2 : 3 : 5 | 2.000 / 0 (0 %), 0 | 3.000 / 2.000 (40 %), 5.667 | 5.000 / 3.000 (37.5 %), 3.000 |
| 5 | `bufferbloat` | FIFO, limit 60 | 1.315 / 0.665 (33.25 %), 5.000 | 3.265 / 1.715 (34.3 %), 5.000 | 5.420 / 2.620 (32.75 %), 5.000 |
| 6 | `uncongested` | FIFO, 2 + 3 + 4 = 9 < 10 | 2 / 0, 0 | 3 / 0, 0 | 4 / 0, 0 |

Checks on the presets, also in the tests:

- 1 vs 5: the same dropped counts per class (0.665, 1.715, 2.620), delay 1 → 5 ticks: a bigger buffer trades no loss
  for delay. The same load with PQ and limit 60: voice and video delay 0, bulk 19 ticks.
- 6 with `pq` and `wrr`: the same totals as FIFO, no drops, delay 0.
- 4 with C = 15 and all three classes at 12: delivered 3.0 / 4.5 / 7.5 = 2 : 3 : 5 of 15 (rule 4's carried round).
- 4 with voice 0 and video = bulk = 8: video 3.75, bulk 6.25 = 3 : 5 of 10 (work conserving).

The task's preset 1 numbers (≈ 1.37 / 3.38 / 5.25) came from a different shuffle; the shares (about two thirds
delivered, a third dropped, delay 1) are the same. The table above is from this model.

Why the numbers are what they are: FIFO under steady overload keeps the queue at `limit` after arrivals and sends C,
so every packet waits (limit − C) / C ticks: (20 − 10)/10 = 1, (60 − 10)/10 = 5. PQ: bulk gets C − 2 − 5 = 3 per
tick; its queue holds 20 after arrivals and 17 after sending, so a packet waits 17/3 = 5.67 ticks. WRR: video's queue
holds 17 after sending 3 (17/3 = 5.67), bulk's 15 after sending 5 (15/5 = 3).

## Captions (both languages in `strings.js`), chosen from the state

| Situation | Caption (en) |
|---|---|
| no drops and no queuing delay | No congestion: {o} packets per tick offered, the link carries {C}. No queue fills, nothing is dropped, nobody waits: every scheduler gives the same result. |
| drops, offered ≤ C | The offered {o} packets per tick are below the link's {c}, yet packets are dropped: one tick's arrivals do not fit in a queue of {limit}. (rule 6's limit) |
| no drops, offered > C | The offered {o} packets per tick exceed the link's {c}: the queues are still growing (waits up to {d} so far), and once they are full, packets will be dropped. |
| no drops, some delay | Nothing dropped: the queues only absorb short bursts; the longest mean wait is {d}. |
| FIFO, limit above 20 | FIFO with a bigger queue ({limit}): the losses are the same, but voice now waits {d} in the queue. (Task caption 2; without voice: "every packet now waits") |
| FIFO otherwise | FIFO: one shared queue, so every class loses about the same share, {pct}, and waits the same, {d}; voice too. (Without voice: no "voice too") |
| PQ, bulk is the only class with drops, voice and video wait under 0.05 ticks | Strict priority: voice and video get through with no loss and no queuing delay; bulk gets what is left, {d} of {o} packets per tick. (Task caption 1) |
| PQ, voice alone is over C, video and bulk deliver nothing | Strict priority: voice alone offers {v} packets per tick, more than the link's {C}; video and bulk get nothing. Priority without a limit starves everyone else. |
| PQ, voice + video over C, bulk delivers nothing | Strict priority: voice and video together offer {o} per tick, more than the link's {C}; bulk gets nothing, it starves. |
| PQ, any other case | Strict priority: voice {a} of {ao}, video {b} of {bo}, bulk {x} of {xo} packets per tick. |
| WRR | Weighted sharing {w}: no queue starves. Delivered per tick: voice {a} of {ao}, video {b} of {bo}, bulk {c} of {co}. |

## Out of scope

Marking, policing and shaping (token bucket), AQM (RED, CoDel), variable packet sizes, Wi-Fi WMM, end-to-end effects
on TCP (all from the task file).
