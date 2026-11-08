# qos-queues: notes

Task `docs/tasks/w3/qos-queues.md` (catalogue `net-qos-queues`, §4.1). Rules and numbers: `SPEC.md`.

## Decisions

- **Explorer.** `initial(params)` runs all 300 ticks and returns the per-tick series, the totals over ticks 100–299
  and the last tick as a snapshot; there are no steps.
- **The scene shows the last tick (299)**: each queue just after that tick's arrivals, the packets the scheduler
  takes from it outlined, that tick's drops as crossed shapes at the tail with their count, and the link with the
  packets sent, in send order (FIFO mixes the classes; PQ sends voice, then video, then bulk; WRR shows the turns).
  A snapshot rather than a moving animation: the steady state is what the presets are about, and it needs no motion.
- **Queue head on the right**, next to the scheduler (slots run right to left, `direction: rtl`); the tail on the
  left has a dashed edge, where the drops bounce off. A queue of 60 wraps into three rows of 20, so the box length
  shows the buffer size.
- **Layout:** the task puts the chart and the table on the right of the scene. The pipeline (sources → classifier →
  queues → scheduler → link) needs the full stage width to keep 20 slots per row legible at 1920×1080, so the scene
  is on top and the chart and the table sit side by side below it.
- **Chart:** stacked bars, delivered above the zero line and dropped below it (hatched), each bar the mean per tick
  over 10 ticks (30 bars). Per-tick values jump with the arrival order; bins keep the picture readable and still
  show "per tick". Voice is stacked nearest the zero line, then video, then bulk; video bars carry a dot texture and
  a shape mark sits at the right of each band, so the bands read in grayscale. The capacity C is a dashed line;
  ticks 0–99 (queues filling, not in the table) are shaded. Drawn in SVG at 1:1 in CSS pixels and redrawn on resize,
  as `tcp-congestion` does.
- **Table:** per class offered, delivered and dropped per tick (dropped with its share of offered), mean queuing
  delay in ticks; a total row. "Changed" marks (highlighter plus ink outline) go on the cells a param move or a
  preset changed; a redraw without a param change keeps them.
- **`limit` is a choice** (segmented 10 / 20 / 60), not a drop-down: the kit's `select` is for more than five
  options.
- **Slider values without units** (the panel is two columns wide; "/takt" made every label wrap). The unit is on the
  sources, the link and the table headers.
- **On the phone** the table hides its "offered" column (the sources box shows the rates) so it fits 375 px.
- **DSCP labels** EF, AF41 and DF on the sources (`translate="no"`), and "by DSCP marking" on the classifier: rule 7
  (classification by the declared class) needs the marking visible. DF (default forwarding) is RFC 4594's name for
  the default class; the task says "default".
- **Arrival order:** one mulberry32 generator (`Simdeck.rng`, copied into `sim.js` for node, as `tcp-congestion`
  does; a test checks they agree) for the whole run; Fisher–Yates per tick.
- **Captions** pick the one thing the picture shows (SPEC.md, caption table); the two captions in the task are
  used word for word for presets 2 and 5.

## Deviations from the task

- **WRR keeps its place between ticks.** The task's rule 4 says "per tick the scheduler visits queues in fixed order
  voice, video, bulk, sending up to w_i from each, and repeats while capacity is left". Restarting at voice every
  tick gives w_i / Σw only when C is a multiple of Σw: with C = 15 and 2 : 3 : 5 it gives 4 : 6 : 5 instead of
  3 : 4.5 : 7.5, and with voice idle it gives video 5 and bulk 5 instead of 3.75 and 6.25. The model carries the
  round (the queue being visited and how many it has sent in this turn) into the next tick, as WRR and DRR do, which
  gives the stated w_i / Σw for every C. The six presets have C = Σw = 10, where both readings agree. *(Owner may
  prefer the literal reading; it is one line, `rr = rr || …` in `schedule`.)*
- **Preset 1's numbers** differ from the task's rough figures (1.37 / 3.38 / 5.25): the model gives 1.325 / 3.29 /
  5.385 with seed 1. The task's numbers came from another shuffle; the shares (two thirds delivered, a third
  dropped, delay 1 tick) are the same. SPEC.md has the exact values from the tests.
- **Starvation preset:** the task says voice delivers 10 with 1 dropped; the model agrees, and voice's delay is
  1 tick (its own queue fills to 20 and sends 10 per tick).
- **Layout** (above): scene on top, chart and table below, not on the right.

## Sources

- RFC 2474 (DSCP field), RFC 2475 (DiffServ architecture), RFC 3246 (Expedited Forwarding PHB), RFC 4594 (service
  classes: EF for telephony, AF4x for multimedia conferencing, DF default), RFC 7567 §2 (tail drop).
- M. Shreedhar, G. Varghese, "Efficient Fair Queuing using Deficit Round Robin", SIGCOMM 1995; Linux man pages
  `tc-prio(8)`, `tc-drr(8)` (named here for the builder only; the page names no tool).
- Cisco IOS "QoS: Congestion Management Configuration Guide", "Congestion Management Overview" (FIFO, PQ,
  WFQ/CBWFQ, LLQ).
- URM (`~/projects/uvod-u-racunalne-mreze`) ch. 6 `06-fizicki-sloj.md`: *kašnjenje čekanja u redu*, *propusnost*,
  *zagušenje*; ch. 13: *kontrola zagušenja* (terms only; neither covers schedulers).
- No local course material on QoS (URM has no QoS section; the NLA table of contents has no tc/qdisc topic).

## Unchecked *(check)*

Nothing below could be opened from here; each is a standard statement, but not checked against the text:

- Cisco "Congestion Management Overview": FIFO as the default single queue; PQ serving the highest non-empty queue
  and starving the rest; LLQ policing its priority queue (the explanation's "a priority queue is limited in
  practice", worded generically).
- Shreedhar & Varghese 1995 and `tc-drr(8)`: DRR gives each backlogged flow its quantum share; for equal-size
  packets this equals WRR with the same weights.
- RFC 4594 table 3: EF for telephony, AF41 for multimedia conferencing (the page uses AF41 for "video").
- Term pairs marked *(check)* below.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr | source |
|---|---|---|
| quality of service (QoS) | kvaliteta usluge | `tags.json` label of `qos` *(check)* |
| congestion | zagušenje | URM ch. 6, ch. 13 |
| tail drop | odbacivanje s kraja reda | simdeck *(check)* |
| queuing delay | kašnjenje čekanja u redu | URM ch. 6 |
| strict priority | strogi prioritet | simdeck *(check)* |
| weighted fair queuing | težinsko pravedno raspoređivanje | simdeck *(check)* |

Used from the glossary: `scheduler` (raspoređivač), `starvation` (izgladnjivanje). `throughput` (propusnost) is in
the glossary but the page does not need it.

## Shared requests

- **Kit view "small live chart"** (catalogue §7.2): a second consumer after `tcp-congestion`. This page needs stacked
  bars above and below a zero line, a hatched variant for "lost", a dot texture per series, a shaded x-range with a
  label, a horizontal reference line with a label, and shape marks at the end of each band. All of it is in
  `drawChart` in `index.html`.
- **kit.css:** `.sd-ctl { display: flex }` beats `[hidden]` (the same workaround as `tcp-congestion`, `amdahl` and
  others).

## Tags and topic

Topic `networks`, tag `qos` (both in `tags.json`). The catalogue also lists `operating-systems`; left out, as the
task's coordinator note suggests, unless NLA adds a `tc` chapter.

## Review (playbook §7.4)

A fresh reviewer read the diff against SPEC.md, recomputed every preset and side check (all exact) and ran 34
mutations, one at a time; all were caught except one. Fixed from the review:

- **Untested tie-break:** a WRR queue that runs empty just as C runs out still ends its turn. New test; its
  mutation (`!q.length` → `!q.length && sent.length < C`, which changed totals in 163 of 3456 configs) now fails.
- **SPEC rule 6 overclaimed:** "below C, no drops" holds only while one tick's arrivals fit in a queue, because
  all arrivals are queued before the scheduler runs (FIFO, limit 10, 4 + 4 + 4 = 12 < C = 20 drops 17 %). Kept the
  model (its order of a tick gives the task's preset numbers), stated the condition in SPEC.md and in the
  explanation, and added a caption for that case ("below the link's C, yet packets are dropped …").
- **Captions:** starvation captions now test the offered load against C (`rVoice > C`, `rVoice + rVideo > C`), not
  any voice drop; overload with no drops yet (a queue of 60 still filling) gets its own caption instead of "the
  queues only absorb short bursts"; FIFO captions without voice traffic no longer mention voice. SPEC.md's caption
  table now says the FIFO "bigger queue" caption is chosen by limit > 20, as the code does.
- **Wording:** "Voice never waits" (voice waits 1 tick in preset 3) → "voice waits only when voice alone fills the
  link"; "izgladnjuje" (transitive) → "gladuje"; FIFO loses "about the same share" (32.75–34.3 % in preset 1, and
  further apart for a light class); the percent format comes from strings.js (`33 %` in Croatian, `33%` in English).

Mutations I ran before the review (all caught): FIFO from the tail, drop the head instead of the newcomer, PQ in
reverse order, WRR restarting each tick, no shuffle, rounding instead of accumulating, FIFO with three queues,
delay + 1, misclassified voice. Removing the weight limit in WRR makes the loop spin (the test run times out).

## Time

Start 2026-11-08 21:30, done 21:55 (about 25 minutes, one session): spec and number check, model and tests,
page, gate and screenshots, fresh review and its fixes.
