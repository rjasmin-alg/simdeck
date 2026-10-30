<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# http-caching: specification

One concept: **Cache-Control, ETag, 304, and what a CDN edge keeps.** Task `docs/tasks/w3/http-caching.md`,
catalogue `inet-http-caching` (§4.2). Class: stepper. Builds on `http-exchange` (the scene `www.grafo.hr`, the
request and status lines).

## Scene

- Left to right: one browser (A) or two (A, B), each with its own **private cache**; a **CDN edge** (a shared
  cache); the **origin server** `www.grafo.hr`. Every request is `GET /katalog HTTP/1.1`.
- The origin holds one file in versions v1, v2, …: ETag `"v1"`, `"v2"`, …; sizes 48 213, 48 977, 49 302 … bytes
  (data, made up *(derived)*; version n ≥ 4 is 49 302 + 400·(n − 3)). Every response carries the same
  `Cache-Control` (the param) and the ETag of the version.
- Each cache shows its stored entry: URL, ETag, `Cache-Control`, when it was stored (or last revalidated), its age,
  its freshness lifetime and a fresh / stale badge; or nothing stored.
- Time `now` in seconds from the first request (t = 0).

## Parameters

| key | values | default | notes |
|---|---|---|---|
| `cacheControl` | `max-age=60`, `no-cache`, `no-store`, `private, max-age=60`, `max-age=60, s-maxage=300` | `max-age=60` | what the origin sends; changing it keeps the step |
| `interval` | 10 … 120 s, step 10 | 30 | the time between requests (scales the two-browser schedule too) |
| `browsers` | 1, 2 | 1 | the schedule (below); resets |
| `changes` | a number (bit k set = the origin changes before request k, k ≥ 1) | 0 | hidden; set by presets and the button **O** |

## Schedule

- **One browser:** A asks at k·`interval`, k = 0 … R − 1; R = 4.
- **Two browsers:** in units of `interval`: A 0, A 1, B 4, B 5, A 10, B 11; R = 6. With `interval` 30: 0, 30, 120,
  150, 300, 330 s.
- Requests past the base schedule (made by **O** at the last request, below) come one `interval` apart; with two
  browsers they alternate A (even k), B (odd k).
- R = max(base, highest k in `changes` + 1): a change before request k brings request k.
- **Origin change before request k:** at T_k − ⌊(T_k − T_{k−1}) / 3⌋. With `interval` 30 and k = 1: 30 − 10 =
  **20 s** (the task's changed-file time). It is a step of its own.
- **Steps** = R + the number of changes; at most 20. Events in time order; at equal times a change comes before a
  request (never happens with the rule above, since the change is strictly between two requests).

## One step

Advance `now` to the next event. A change: the origin's version goes up by one (new ETag, new size). A request from
browser X: X's cache decides, then (if it must) the edge, then (if it must) the origin; the response fills or
refreshes the caches on the way back. The step records the hops (messages), who answered, and which caches were
written (stored) or refreshed (revalidated).

## Rules

1. **Fresh while age < lifetime.** A stored response is fresh while its age is less than its freshness lifetime;
   at age = lifetime it is stale. Tie-break: equality is stale. (RFC 9111 §4.2: "response_is_fresh =
   (freshness_lifetime > current_age)".) The RFC's prose reads the other way at equality (§4.2 "has not yet
   exceeded", §5.2.2.1 "stale after its age is greater than"); the task fixes the formula's reading, and the
   `max-age` preset's 304 at 60 s depends on it.
2. **Lifetime.** A shared cache (the edge) uses `s-maxage` if present, else `max-age`; a private cache (a browser)
   uses `max-age`. No `max-age`: no explicit lifetime, taken as 0 (heuristic freshness is out of scope). (RFC 9111
   §4.2.1, §5.2.2.10; §4.2.2 out of scope.)
3. **Age.** age = the `Age` value the response arrived with (0 when absent) + the time since it was stored or last
   revalidated. A cache that answers from its store without contacting the origin sends `Age` = that age; a response
   that came from (or was just validated by) the origin carries no `Age`. (RFC 9111 §4.2.3 corrected_initial_age +
   resident_time, with no network delay; §4 "MUST generate an Age header field"; §5.1 "The presence of an Age header
   field implies that the response was not generated or validated by the origin server for this request".)
4. **Hit.** A fresh entry (and not `no-cache`) is used without contacting the next hop. In a browser: no message at
   all, the page shows "from cache, Age a". At the edge: a request without `If-None-Match`, or whose tag differs,
   gets `200` from the edge with the body and `Age`; a request with `If-None-Match` equal to the edge's ETag gets
   `304` with `Age` and no body. (RFC 9111 §4, §4.3.2 "SHOULD evaluate … preconditions … with respect to … the
   stored response".)
5. **Revalidation.** An entry that may not be used (stale, or `no-cache`) and has an ETag is revalidated: the cache
   sends `If-None-Match: <its ETag>`. The origin answers `304 Not Modified`, no body, when the tag equals its
   current ETag, else `200` with the new body and ETag. On a 304 the cache refreshes its entry (stored-at = now,
   age from the 304's `Age`, 0 if none); on a 200 it replaces it. (RFC 9111 §4.3, §4.3.1 "MUST send the relevant
   entity tags", §4.3.3, §4.3.4; RFC 9110 §13.1.2, §15.4.5, §8.8.3.)
6. **The edge in between.** The edge with no entry forwards the browser's request unchanged, `If-None-Match`
   included (it must not evaluate a precondition for a resource it does not hold), and passes the origin's 304 or
   200 back. The edge with an entry it may not use validates its own ETag with the origin; after that it answers
   the browser from its now-validated entry: 304 if the browser's tag equals it, else 200 with the body. (RFC 9111
   §4.3.2 "MUST NOT evaluate … for which it has no stored responses"; RFC 9110 §15.4.5 "the proxy SHOULD forward
   the 304"; the union of tag lists (§4.3.2 MAY) is not used.)
7. **Storing.** `no-store`: no cache stores the response (and no request ever becomes conditional). `no-cache`: it
   is stored, but must be validated before every use (rule 5) — a 200 is heuristically cacheable, so it may be
   stored without `max-age`. `private`: a browser stores it, the edge never does. (RFC 9111 §3, §5.2.2.4,
   §5.2.2.5, §5.2.2.7; RFC 9110 §15.3.1 "A 200 response is heuristically cacheable".)
8. **No recall.** A changed file at the origin is not seen by anyone holding a fresh copy until that copy goes stale
   (rule 1) and is revalidated (rule 5). Nothing in HTTP tells a cache that the origin changed (purge APIs are out of
   scope). The HTTP analogue of DNS TTL (`dns-ttl-cache`).

## Marks per step

- **hops:** the messages of the step, in order: request browser → edge, edge → origin, then the responses back. A
  browser hit has none ("arrow length shows how far the request went").
- **reached:** the farthest party the request reached: the browser itself, the edge, or the origin.
- **written:** each cache that stored a new response (`stored`) or refreshed its entry after a 304 (`revalidated`).
- **got:** what browser X ends up with: the status it saw (`hit`, `200`, `304`), the version, the `Age` it got, the
  body bytes that crossed each hop.

## The button O (change the origin)

At step n, O sets the change before the next request: n must be a request step (request j), and the change goes
before request j + 1. Refused at step 0 (nobody holds a copy yet), on a change step, when the change is already
set, or when the run would pass 20 steps. A change before request R adds request R too (two steps). The run is
recomputed; the current step stays, so the change is the next step.

## Presets and expected numbers

Checked with an independent Python hand model before the model was written (NOTES.md, "Checks").

1. **`max-age`** — `max-age=60`, interval 30, **4 steps**. 0 s: `200` from the origin, both caches store v1. 30 s:
   browser hit, Age 30. 60 s: the browser's copy is 60 s old = max-age: stale (rule 1 tie); `If-None-Match: "v1"` to
   the edge, whose copy is stale too (60 = 60), so it goes on to the origin: `304` to the edge, `304` to the browser,
   no body; both refreshed. 90 s: browser hit, Age 30.
2. **`changed-file`** — as 1, `changes` = 2 (before request 1): the origin changes to `"v2"` at **20 s**. **5 steps**.
   30 s: the browser still gets v1 from its own cache (Age 30). 60 s: revalidation with `"v1"` reaches the origin,
   which answers `200` with v2, ETag `"v2"`; the edge stores v2 and passes `200` on (the browser's tag `"v1"`
   differs); the browser stores v2. 90 s: browser hit on v2, Age 30.
3. **`no-cache`** — **4 steps**. 0 s: `200`, both store (stale at once: lifetime 0). 30, 60, 90 s: every request
   reaches the origin, `304` at both hops, no body.
4. **`no-store`** — **4 steps**. Every request is a full `200` from the origin; both caches stay empty.
5. **`edge-vs-browser`** — `max-age=60, s-maxage=300`, two browsers, interval 30, **6 steps**. 0 s A: `200` from
   the origin; edge stores (lifetime 300), A stores (60). 30 s A: hit, Age 30. **120 s B: `200` from the edge, Age
   120; the origin is not reached.** B stores it with age 120 ≥ 60: stale on arrival. 150 s B: `If-None-Match:
   "v1"` to the edge (fresh, 150 < 300): `304`, Age 150; B's copy is still stale. 300 s A: A stale, the edge's
   copy is 300 s old = s-maxage (tie, stale): the edge validates with the origin, `304`, then `304` to A (no Age);
   both fresh. 330 s B: `304` from the edge, Age 30: B's copy fresh again. With `private, max-age=60` instead: the
   edge stores nothing; B's first request at 120 s goes to the origin (`200`), 150 s B hit, 300 s and 330 s each
   reach the origin for a `304`.

## Out of scope

Heuristic freshness, `Vary`, `Last-Modified` / `If-Modified-Since` (mentioned in the explanation only), purge APIs,
service workers, `must-revalidate`, `stale-while-revalidate`, request directives, network delay.
