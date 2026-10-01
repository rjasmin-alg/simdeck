# rate-limiting: Token bucket vs leaky bucket

| | |
|---|---|
| Task | `rate-limiting` (wave 3, Performance and capacity) |
| Catalogue entry | `perf-rate-limiting` in `docs/catalogue.md` §4.8 |
| Kind | build a new simulator |
| Folder | `sims/rate-limiting/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA, URM |
| Topic / tags / level | `distributed` / `performance` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **bursts allowed vs smoothed**.

The student: send bursts through each limiter.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.8.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- RFC 2697 "A Single Rate Three Color Marker" (token bucket definitions), RFC 2698 "A Two Rate Three Color
  Marker"; A. S. Tanenbaum and D. J. Wetherall, *Computer Networks* 5th ed., §5.4 "Traffic Shaping" (leaky
  and token buckets) *(check section)*; J. Turner, "New Directions in Communications (or Which Way to the
  Information Age?)", *IEEE Communications Magazine*, 1986 (leaky bucket)
## Model and presets

- **Scene:** the same arrival stream feeds two limiters side by side. **Token bucket:** a bucket of capacity
  b refilled at r tokens/s; each request takes a token or is rejected. **Leaky bucket (as a queue):** a
  queue of capacity q drained at r requests/s; a full queue drops. Under each, an output timeline (accepted
  requests as ticks) and counters: passed, rejected/dropped, max delay.
- **State:** `{ t, arrivals: [{id, at}], tb: {tokens, b, r, passed: [], rejected: []}, lb: {queue: [], q, r,
  nextLeakAt, passed: [{id, at, out}], dropped: []} }`.
- **One step:** advance 0.5 s: (1) refill tokens / leak due requests, (2) handle this interval's arrivals in
  arrival order, (3) update counters.
- **Rules:**
  1. Token bucket: tokens accrue at r per second up to b; a request that finds ≥ 1 token passes at once and
     takes one; otherwise it is rejected (policing) (RFC 2697 "A Single Rate Three Color Marker", token
     bucket definition; Tanenbaum & Wetherall, *Computer Networks*, "Traffic Shaping") (check).
  2. A full token bucket lets a burst of up to b requests through instantly; long-run rate ≤ r.
  3. Leaky bucket as a queue: arrivals join a queue of size q; one request leaves every 1/r seconds; a request
     arriving at a full queue is dropped. Output is smooth at r, bursts become delay (Tanenbaum & Wetherall)
     (check).
  4. Both limit the long-run rate to r; they differ in what happens to a burst: passed at once (token) vs
     spread out with delay (leaky).
  5. Tie-break: within one interval arrivals are handled in id order; refill/leak happens before arrivals.
  6. A token bucket with b = 1 behaves like a smoother: no bursts (derived).
- **Params:** `r` choice 1 / 2 / 5 per s (2); `b` choice 1 / 5 / 10 (5); `q` choice 1 / 5 / 10 (5); `pattern`
  choice burst / steady overload / idle then burst (burst).
- **Presets** (r = 2/s, b = q = 5, both start full/empty respectively; derived, checked by hand):
  1. `burst-10` — 10 requests at t = 0: token bucket **5 pass at once, 5 rejected**; leaky bucket 5 queued
     (5 dropped), released at 0, 0.5, 1.0, 1.5, 2.0 s: **max delay 2 s**.
  2. `steady-3` — 3 requests/s for 6 s: token bucket passes everything until the bucket runs dry at ≈ 5 s,
     then 2/s; leaky bucket passes 2/s from the start, its queue fills in ≈ 5 s and then drops 1/s.
  3. `idle-then-burst` — burst of 5, 3 s of silence, burst of 5: the token bucket has refilled (2/s × 3 s ≥
     5) and passes the second burst whole; the leaky bucket smooths both.
  4. `no-burst` — token bucket with b = 1: the 10-request burst passes 1, then one per 0.5 s as tokens
     arrive (rule 6).
- **Steps:** 12 per preset (6 s at 0.5 s per step); `burst-10` 6.
- **Legend:** request (dot), token (small coin), passed (solid tick on the output line), rejected/dropped
  (crossed dot), queued (dot in the queue, with its wait), bucket level (fill bar). "Changed" marks
  requests decided in this step.
- **Captions:**
  - hr: „Kantica sa žetonima (*token bucket*) bila je puna: pet zahtjeva prolazi odmah, ostalih pet je
    odbijeno."
  - en: "The leaky bucket let the same burst through, but one every half second: the last request waited 2
    seconds."
- **Terms:** rate limiting — ograničavanje brzine (check); token bucket — kantica sa žetonima (check);
  leaky bucket — kantica koja curi (check); burst — nalet (check); policing / shaping — odbacivanje /
  oblikovanje prometa (check); queue — red čekanja.
- **Misconceptions:** "a rate limit of 2/s means never more than 2 in any second"; "both buckets are the
  same thing"; "rejecting is worse than delaying" (delay has its own cost: tail latency).
- **Out of scope:** distributed rate limiting, sliding-window counters, two-rate markers (RFC 2698), TCP
  congestion control, retry behaviour of clients (`retry-storm`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `rate-limiting` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh rate-limiting sims/rate-limiting` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/rate-limiting/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
