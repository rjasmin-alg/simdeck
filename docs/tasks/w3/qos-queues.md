# qos-queues: QoS queues

| | |
|---|---|
| Task | `qos-queues` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-qos-queues` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/qos-queues/` |
| Class | explorer |
| Size | M |
| Priority | P3 |
| Courses | URM, NLA |
| Topic / tags / level | `networks` / `qos` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **priority queue vs weighted fair queuing, tail drop**.

The student: set traffic mix and queue weights.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- URM ch06 `06-fizicki-sloj.md`, delay components (kašnjenje čekanja u redu) and propusnost; ch13 kontrola
  zagušenja (terms only; neither covers schedulers)
- RFC 2474 (DSCP field), RFC 2475 (DiffServ architecture), RFC 3246 (Expedited Forwarding), RFC 4594 (service
  classes, EF for telephony, AF4x for video), RFC 7567 §2 (tail drop, AQM recommendations)
- Cisco IOS "QoS: Congestion Management Configuration Guide", "Congestion Management Overview" (FIFO, PQ,
  WFQ/CBWFQ, LLQ) (check)
- M. Shreedhar, G. Varghese, "Efficient Fair Queuing using Deficit Round Robin", SIGCOMM 1995; Linux man pages
  `tc(8)`, `tc-prio(8)`, `tc-drr(8)`

## Model and presets

- **Scene:** three traffic sources on the left (glas / voice, video, skupni prijenos / bulk, each with a
  colour **and** a shape: circle, triangle, square) → a classifier → queues (one shared queue in FIFO, three
  queues otherwise, drawn as boxes filling up to the limit) → a scheduler → one outgoing link of capacity C.
  Right: a small live chart (kit view, catalogue §7.2) of delivered and dropped packets per class per tick,
  and a table: offered, delivered, dropped (%), mean queuing delay, per class.
- **Model (explorer):** `simulate(params) → per-tick series and totals`, pure and deterministic. Time in ticks,
  T = 300, statistics over ticks 100–299 (after the queues fill). Packets are all the same size (one link
  slot), so only counts matter.
- **One tick, in this order:** (1) arrivals: class i adds `rate_i` packets (fractional rates accumulate);
  the tick's arrivals are put in a seeded random order (`seed`), so no class is always first; (2) each
  arrival is queued, or dropped if its queue is full (tail drop); (3) the scheduler sends up to C packets;
  (4) delay of a sent packet = departure tick − arrival tick.
- **Rules:**
  1. FIFO: one queue of `limit` packets, served in arrival order; every class shares the same drops and the
     same delay (Cisco IOS QoS Configuration Guide, "Congestion Management Overview": FIFO) (check).
  2. Tail drop: a packet arriving at a full queue is discarded; nothing already queued is removed (RFC 7567
     §2, "tail drop").
  3. Strict priority (PQ): always send from the highest-priority non-empty queue (voice > video > bulk); a
     lower queue is served only when all higher ones are empty, so it can starve (Cisco "Congestion Management
     Overview", Priority Queueing; RFC 3246 EF PHB for voice) (check).
  4. Weighted fair sharing: modelled as weighted round robin with weights w_i on equal-size packets, which
     gives each backlogged class w_i / Σw of C; share a class doesn't use goes to the others (work
     conserving). This is what WFQ/DRR achieve for equal packets (Shreedhar & Varghese, "Efficient Fair
     Queuing using Deficit Round Robin", 1995; Linux `tc-drr(8)`) (check). Per tick the scheduler visits
     queues in fixed order voice, video, bulk, sending up to w_i from each, and repeats while capacity is left.
  5. Tie-breaks: equal priority does not occur (fixed order); in rule 4 the last partial round goes in the
     fixed order; a queue limit applies per queue (PQ, WRR) or to the single queue (FIFO).
  6. Offered load below C: every scheduler gives the same result, no drops, delay 0 (QoS matters only
     under congestion).
  7. Classification is by the class the source declares (DSCP EF / AF41 / default, RFC 2474, RFC 4594
     table 3) and is taken as correct; marking and policing are out of scope.
- **Params:** `sched` choice `fifo`/`pq`/`wrr` (default `fifo`); `rVoice`, `rVideo`, `rBulk` range 0–12
  packets/tick, step 0.5 (defaults 2, 5, 8); `C` range 5–20 (default 10); `limit` select 10/20/60 (default
  20); `wVoice`, `wVideo`, `wBulk` range 1–8 (defaults 2, 3, 5; visible only for `wrr`); `seed` range 1–9
  (default 1).
- **Presets** (numbers from the model above with seed 1, checked with a throw-away script; derived, not from
  a course source — record exact values in SPEC.md from the test fixture):
  1. `fifo-congested` — offered 2 + 5 + 8 = 15 > C = 10: each class keeps about two thirds; delivered ≈ 1.37
     / 3.38 / 5.25 per tick, about a third of each class dropped (voice 0.62 of 2); delay ≈ 1 tick for all.
  2. `priority` — PQ, same load: voice 2.0 and video 5.0 delivered with 0 drops and delay 0; bulk gets the
     rest, 3.0 of 8 (5 dropped per tick), delay ≈ 5.7 ticks.
  3. `starvation` — PQ with voice 11 > C: voice 10 delivered (1 dropped), video and bulk 0: priority without
     a limit starves everyone else (why real LLQ polices the priority queue, Cisco LLQ docs) (check).
  4. `weighted` — WRR 2:3:5: voice 2.0 (0 drops, delay 0), video 3.0 of 5, bulk 5.0 of 8; delays ≈ 5.7 and
     3.0 ticks. Bulk is protected, voice still meets its rate because it asks for less than its share.
  5. `bufferbloat` — FIFO with `limit` 60: the same drop shares as preset 1 but delay ≈ 5 ticks for voice
     too; with PQ, voice delay stays 0. Bigger buffers trade loss for delay.
  6. `uncongested` — rates 2 + 3 + 4 = 9 < 10: all three schedulers identical, no drops, delay 0.
- **Steps:** none (explorer).
- **Legend:** voice (circle, c1), video (triangle, c2), bulk (square, c3); dropped (✕, hatch); queue fill
  (bar); "changed" marks the table cells whose value changed after the last param move.
- **Captions:** hr: "Strogi prioritet: glas i video prolaze bez gubitaka i bez čekanja u redu; skupni
  prijenos dobiva ostatak, 3 od 8 paketa po taktu." en: "Strict priority: voice and video get through with no
  loss and no queuing delay; bulk gets what is left, 3 of 8 packets per tick."; hr: "FIFO s većim redom:
  gubici su isti, ali glas sada čeka 5 taktova u redu." en: "FIFO with a bigger queue: the losses are the
  same, but voice now waits 5 ticks in the queue."
- **Terms:** quality of service (QoS) — kvaliteta usluge (check); queue — red (čekanja); queuing delay —
  kašnjenje čekanja u redu (URM ch06); tail drop — odbacivanje s kraja reda (check); strict priority — strogi
  prioritet (check); weighted fair queuing — težinsko pravedno raspoređivanje (check); throughput —
  propusnost (URM ch06); congestion — zagušenje (URM ch06, ch13).
- **Misconceptions:** (1) QoS creates bandwidth (it only chooses who loses under congestion; preset 6);
  (2) priority is always safe (preset 3); (3) a bigger buffer fixes loss without cost (preset 5).
- **Out of scope:** marking, policing and shaping (token bucket), AQM (RED, CoDel), variable packet sizes,
  Wi-Fi WMM, end-to-end effects on TCP.
- **Note for the coordinator:** no course source exists (URM has no QoS section; NLA toc has no tc/qdisc
  topic); every rule here comes from vendor docs and RFCs and needs a (check) pass. The catalogue lists
  `operating-systems` as a second tag; `networks`/`qos` alone fits better unless NLA adds a `tc` chapter.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh qos-queues sims/qos-queues` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/qos-queues/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
