<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# rate-limiting: notes

New stepper (task `docs/tasks/w3/rate-limiting.md`, catalogue `perf-rate-limiting`, §4.8). The page draws its own
stage (no kit view fits: three time lanes on one axis). Rules and expected numbers: `SPEC.md`.

## Decisions

- **One time axis for three lanes.** Arrivals (top), token bucket output, leaky bucket output share the x axis, so
  "passed at once" vs "spread out" is a vertical comparison. Passed requests stack above each limiter's axis (with
  a tick on the axis), rejected or dropped below it (a dashed red-tinted dot with a ✕ badge). A leaky bucket's passed
  request sits at the time it *leaves*, with a dashed line back to its arrival: the wait. Rows for those dots are
  assigned greedily (the first row whose last request left before this one arrived), so a wait line normally does not
  cross another dot; with all four rows busy (r = 5, b = q = 10 burst) lines can cross.
- **Device boxes on the left**: the token bucket as b coins filled from the bottom by the level (fractional at
  r = 1/s); the queue as q places, head first, each with the time it will leave. Counters: passed, rejected/dropped,
  max delay (the token bucket's is always 0 s, shown for the comparison).
- **Integer time.** The model counts tenths of a second and tenths of a token, so 0.2 s leaks (r = 5), half tokens
  (r = 1) and 0.5 s steps are exact.
- **Step n handles the instant t = 0.5 (n − 1) s** and everything since the previous step; step 0 is before t = 0, so
  the student sends the burst with the first →. All patterns put arrivals on the half second.
- **A leaky bucket request's leave time is fixed when it is admitted** (out = max(arrival, previous out + 1/r)), so
  the queue shows each request's leave time and the end caption can say when the still-queued ones will leave and how
  long the last one will have waited. This answers COMMON §11 "run the others to their own end" without more steps.
- **Same r for both limiters** (one param): the comparison is only fair at equal long-run rates.
- **Tie-break detail** (SPEC rule 5.3): a request that reaches an idle leaky bucket leaves at its own arrival
  instant, but only after all of that instant's arrivals were admitted. This is what gives the task's numbers
  (burst of 10 into q = 5: 5 queued, 5 dropped, out at 0 … 2.0 s); letting it leave first would admit 6.
- **Arrival pattern `steady`** is 3/s as 1, 2, 1, 2 … requests on the half second, not one every 1/3 s: every request
  then arrives in exactly one step, and the b = 1 preset shows rule 6 cleanly.
- **Captions** state per step: arrivals; the token bucket's level before the arrivals, how many passed and were
  rejected (or that it refills / is full again); the leaky bucket's admitted, dropped and released requests with the
  wait. Two first-time notes are highlighted: the token bucket running dry and the queue overflowing (not on the last
  step, which gives the end summary instead). The task's captions appear as: hr step 1 of `burst-10` ("Kantica sa
  žetonima bila je puna: 5 zahtjeva prolazi odmah, ostalih 5 je odbijeno.", digits for number words) and en step 5
  ("The leaky bucket let the same burst through, but one every 0.5 s: the last request waited 2 s.").
- **Phone (≤ 34rem stage height)**: dots shrink and lose their numbers, the counters and queue times hide; the shape
  of the three lanes stays.
- **Colours**: arrivals c8, token bucket c1, leaky bucket c3, coins c7, rejected/dropped `--danger`. Grayscale: the
  lane (position), above/below the axis, the ✕ badge, dashed vs solid outlines and the wait lines carry the meaning.

## Deviations from the task

- **`no-burst` uses the steady stream, not the 10-request burst.** The task says "the 10-request burst passes 1, then
  one per 0.5 s as tokens arrive", but a policer does not keep rejected requests and client retries are out of scope
  (`retry-storm`): the burst gives 1 passed, 9 rejected and nothing after. With the steady 3/s stream and b = 1 the
  token bucket passes exactly one request every 0.5 s, which is what rule 6 means.
- **`steady-3` turning points are 4.5 s (tokens run out) and 5.5 s (queue overflows)**, not "≈ 5 s": the task used the
  fluid estimate 5 + 2t = 3t; the discrete stream starts with a request at t = 0 (SPEC.md preset 2).
- **State shape**: `tb.tokens` is `tb.level` in tenths of a token (plus `levelAt`); `lb.nextLeakAt` is
  `lb.lastOut + 1/r`; `b`, `q`, `r` live in params, not in the state; `next` and `decided` are added. Same content.
- **Steps**: 6 for `burst`, 12 for the other patterns, as the task says; with r = 1/s the leaky bucket has not
  emptied by then, and the end caption gives the remaining leave times.

## Sources

- RFC 2697, "A Single Rate Three Color Marker", 1999, §1–3: token bucket C of size CBS filled at CIR, a packet passes
  (is green) when the bucket holds enough tokens. Used for rules 1–2. The page uses one token per request, not bytes.
- A. S. Tanenbaum, D. J. Wetherall, *Computer Networks*, 5th ed., Pearson 2011, "Traffic Shaping" (leaky and token
  bucket) *(check: §5.4.2, and that the leaky bucket is described as a finite queue drained at a fixed rate)*.
- J. Turner, "New Directions in Communications (or Which Way to the Information Age?)", *IEEE Communications
  Magazine* 24(10), 1986 *(check: volume/issue; the leaky bucket idea attributed to it)*.
- RFC 2698 named in the task: two-rate marking is out of scope; not used.
- No local course material (task).

## Unchecked *(check)*

- Section number of "Traffic Shaping" in Tanenbaum & Wetherall 5th ed. (§5.4.2 assumed).
- Turner 1986 bibliographic details.
- The Croatian term pairs below (none is in `kit/glossary.js` or the course books' term lists in the repo).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| rate limiting | ograničavanje brzine *(check)* |
| token bucket | kantica sa žetonima *(check)* |
| leaky bucket | kantica koja curi *(check)* |
| burst | nalet *(check)* |
| policing | odbacivanje viška *(check; task: "odbacivanje")* |
| shaping (traffic shaping) | oblikovanje prometa *(check)* |
| tail latency | latencija repa *(check)* |

`queue` → red čekanja and `latency` → latencija are known (glossary has "latency"; "red čekanja" is used in the
mail-queue entry).

## Shared requests

None.

## Checks

- Numbers: an independent tick-by-tick script (every 0.1 s, its own queue/token code) agreed with the model on all
  four presets and all 81 parameter combinations (r × b × q × pattern) at the last step.
- Tests: 25, one or more per rule; each rule broken once in the model (id order reversed, refill after arrivals, no
  leak before arrivals, instant release frees a place, no cap at b, half a token passes, no leak spacing, queue
  q + 1): every mutation failed at least one test, the tie-breaks each failed their own.
- `npm run gate -- rate-limiting`: pass (61/61 browser checks, 0 exceptions). Screenshots reviewed: 1920×1080
  light, dark, grayscale in hr and en, 375×812, plus each preset's end step and r = 5, b = q = 10.

## Review

A fresh reviewer (subagent, no shared context) read the diff against SPEC.md, ran 23 mutations on a scratch copy and
replayed the caption function for every step of all 81 parameter combinations. No model defect; preset numbers and
both task captions confirmed. Findings and what was done:
- The "tokens are used up" note claimed "{r} a second", false for r = 5, b = 1 (b = 1 wastes tokens; 2/s pass).
  Reworded to "a request now passes only once a new token has arrived", and shown only when more requests follow.
- Mutant `out <= T` (releasing requests due later in the step at its start) survived: added a test with arrivals
  inside a step (q = 1, arrivals at 0, 0.1, 0.3 s); it now fails that mutant.
- The `r.at < now` guard on the first leak was redundant (this instant's arrivals are not queued yet): removed.
- Storing a rejected request's time as the step instant is equivalent for the built-in patterns; left as is.

## Time

Start 12:49, done 13:15 (2026-11-08): about 26 minutes.
