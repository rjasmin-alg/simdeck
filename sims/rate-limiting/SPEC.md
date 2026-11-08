<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# rate-limiting: specification

Task `docs/tasks/w3/rate-limiting.md`, catalogue `perf-rate-limiting` (§4.8). One concept: **bursts allowed vs
smoothed**. The same arrival stream feeds a token bucket and a leaky bucket; the student steps through bursts and
sees one limiter pass a burst at once and the other spread it out as delay.

Sources: RFC 2697 "A Single Rate Three Color Marker" §1–3 (token bucket: a bucket of size CBS filled at CIR, a
packet takes tokens if enough are there); A. S. Tanenbaum, D. J. Wetherall, *Computer Networks*, 5th ed., §5.4.2
"Traffic Shaping" (leaky bucket and token bucket) *(check: section number)*; J. Turner, "New Directions in
Communications", *IEEE Communications Magazine* 24(10), 1986 (the leaky bucket) *(check)*. The discrete rules below
(tie-breaks, the half-second step, where the first release happens) are this model's own choices, derived from those
definitions; they are marked *(derived)*.

## Scene

- **Arrivals** (top): one lane on a time axis, a numbered dot per request at its arrival time.
- **Token bucket** (middle): the bucket (b coin slots, filled up to the current level, a fill bar), its rate, and an
  output lane on the same axis: passed requests above the axis (solid, with a tick), rejected ones below (crossed).
  Counters: passed, rejected, max delay (always 0).
- **Leaky bucket** (bottom): the queue (q slots, each waiting request with the time it will leave), its rate, and the
  same output lane: passed above at the time they *leave*, with a line back to their arrival time (the wait), dropped
  below. Counters: passed, dropped, max delay.

## State

Times are integers in tenths of a second (ds); the token level is an integer in tenths of a token.

```
{ t,                                   // instant handled by the last step (ds); -5 at step 0
  arrivals: [{ id, at }], next,        // the stream (sorted by at, id) and the first one not yet handled
  tb: { level, levelAt, passed: [{id, at}], rejected: [{id, at}], decided: [id] },
  lb: { queue: [{id, at, out}], lastOut, passed: [{id, at, out}], dropped: [{id, at}], decided: [id] } }
```

`decided` lists the requests decided in this step (the "changed" mark): every arrival for the token bucket; admitted,
dropped and released ones for the leaky bucket. The task's `nextLeakAt` is `lastOut + 1/r`; `b`, `q`, `r` stay in
params.

## Step

Step 0 is before t = 0 (token bucket full, queue empty, nothing arrived). Step n handles the instant
t = 0.5 (n − 1) s and everything after the previous step's instant: every event in (t_{n−1}, t_n] in time order.

## Rules

1. **Token bucket (policing).** Tokens accrue at r per second, continuously, up to b. A request that finds ≥ 1 token
   passes at once and takes one; otherwise it is rejected and gone (no retry). (RFC 2697 §3, token bucket C;
   Tanenbaum & Wetherall §5.4.2) *(check)*
2. **Burst through a full bucket.** A full bucket lets up to b requests through at one instant. Over any interval of
   length w no more than b + r·w requests pass, so the long-run rate is ≤ r. (follows from rule 1)
3. **Leaky bucket as a queue (shaping).** An arriving request joins a FIFO queue of capacity q if there is room,
   otherwise it is dropped. Requests leave one at a time, at least 1/r s apart: a request leaves at
   out = max(its arrival, previous out + 1/r), the first one at its arrival. So out is fixed when it is admitted, and
   the page shows it on the queued dot. The output is smooth at ≤ r; a burst becomes delay (out − arrival).
   (Tanenbaum & Wetherall §5.4.2; Turner 1986) *(check)*
4. **Both limit the long-run rate to r**; they differ in a burst: passed at once (token) vs spread out with delay
   (leaky). (follows from rules 2 and 3)
5. **Tie-breaks** *(derived)*. At one instant, in this order:
   1. the token bucket refills up to now, and the leaky bucket releases the requests due now that arrived *earlier*;
   2. the instant's arrivals, in id order (each one to both limiters);
   3. a request that found the leaky bucket idle leaves at its own arrival instant, after all of this instant's
      arrivals were admitted. It held a queue place during (2): a burst of 10 into q = 5 admits 5, not 6.
6. **b = 1 is a smoother.** With one token the token bucket never passes two requests less than 1/r apart: no bursts.
   Unlike the leaky bucket, it rejects the excess instead of delaying it. (derived from rule 1)

## Params

| key | values (default) | meaning |
|---|---|---|
| `r` | 1, 2, 5 per s (2) | token rate and leak rate (the same r for both, so they are comparable) |
| `b` | 1, 5, 10 (5) | token bucket size; starts full |
| `q` | 1, 5, 10 (5) | queue size; starts empty |
| `pattern` | `burst`, `steady`, `idle-burst` (`burst`) | arrival stream |

Patterns (all arrivals on the half second, so each arrives in exactly one step):
- `burst`: 10 requests at t = 0. **6 steps** (t = 0 … 2.5 s).
- `steady`: 3 requests/s for 6 s as 1, 2, 1, 2, … at t = 0, 0.5, …, 5.5 s (18 requests). **12 steps**.
- `idle-burst`: 5 at t = 0, nothing for 3 s, 5 at t = 3 s. **12 steps** (t = 0 … 5.5 s).

`sim.json` `steps` is 6, the default pattern's.

## Presets and expected numbers

All with r = 2/s, b = q = 5 unless said. Checked by hand, by an independent tick-by-tick script (NOTES.md, Checks) over
all 81 parameter combinations, and by `sim.test.js`.

1. **`burst-10`** (`burst`): token bucket **5 pass at once (1–5), 5 rejected (6–10)**; leaky bucket admits 1–5,
   drops 6–10, releases at **0, 0.5, 1.0, 1.5, 2.0 s**: **max delay 2 s**. At step 6 (2.5 s) the token bucket is
   full again (0 + 2 × 2.5 = 5).
2. **`steady-3`** (`steady`): token bucket passes everything until it runs dry: the first rejection at **4.5 s**
   (request 15; 13 arrivals by 4.0 s against 5 + 2 × 4 = 13 tokens), then 2 per second (16 passes, 2 rejected by
   5.5 s). Leaky bucket passes **one every 0.5 s from the start** (12 out by 5.5 s); its queue grows by one a second,
   is full at 4.5 s and **drops from 5.5 s** (request 18), one a second from then on. Requests 13–17 are still
   queued at the end (out 6.0 … 8.0 s; request 17, in at 5.5 s, will have waited 2.5 s). Max delay of the released
   ones: 2 s (request 12). The task's "≈ 5 s" is the fluid estimate
   (5 + 2t = 3t); the discrete stream starts with a request at t = 0, so the token bucket runs dry at 4.5 s and the
   queue overflows at 5.5 s.
3. **`idle-then-burst`** (`idle-burst`): first burst: token 5 pass; leaky out at 0 … 2.0 s. In 3 s the bucket gains
   2 × 3 = 6 ≥ 5 tokens (full at 2.5 s), so the **second burst passes whole** at 3.0 s; the leaky bucket releases it
   at **3.0, 3.5, 4.0, 4.5, 5.0 s**. Nothing is rejected or dropped; max delay 2 s for the leaky bucket, 0 for the
   token bucket.
4. **`no-burst`** (`steady`, b = 1): the token bucket passes **one request every 0.5 s** (1, 2, 4, 5, 7, 8, …) and
   rejects the second of each pair (3, 6, 9, 12, 15, 18). Its output ticks are the leaky bucket's, but the excess is
   rejected at once instead of waiting. The task describes this preset with the 10-request burst; with no retries
   (out of scope) that passes 1 and rejects 9 and then shows nothing, so the preset uses the steady stream (NOTES.md,
   Deviations).

## Captions (task)

- hr (step 1 of `burst-10`): „Kantica sa žetonima bila je puna: pet zahtjeva prolazi odmah, ostalih pet je
  odbijeno." The page writes it with digits.
- en (step 5 of `burst-10`, when the queue empties): "The leaky bucket let the same burst through, but one every half
  second: the last request waited 2 seconds."

## Out of scope

Distributed rate limiting, sliding-window counters, two-rate markers (RFC 2698), TCP congestion control, client
retries (`retry-storm`).
