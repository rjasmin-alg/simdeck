<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# reverse-proxy-lb: specification

Task `docs/tasks/w3/reverse-proxy-lb.md`, catalogue `inet-reverse-proxy-lb` (§4.2). Class: explorer. One concept:
**round robin vs least connections vs source hash vs sticky cookie, and health checks.** The student adds backends,
makes one fail and changes the algorithm; the trace recomputes at once.

## Scene

Clients c1–c3 on the left, the reverse proxy in the middle (the algorithm, how long it waits for a response, the
health-check settings), backends b1–b4 on the right (requests served, most connections open at once, health badge).
Lines join each client to the proxy and the proxy to each backend; there is no line from a client to a backend
(rule 1). Under the scene a timeline (0–15 s): the request trace r1…r9 as chips, then one row per backend with each
request it held as a bar, every health check (✓ / ✗) and the time it was marked down hatched.

## Fixed trace and constants

| Name | Value | Note |
|---|---|---|
| requests | r1…r9, rk at t = k s | one per second |
| client of rk | c((k − 1) mod 3 + 1) | c1, c2, c3, c1, … each in turn |
| service time | 2 s; b2 5 s when `slowB2` | |
| proxy timeout | 6 s | longer than the slow b2, so a slow answer is still an answer |
| hash of c1, c2, c3 | 42, 37, 44 | fixed numbers standing for hash(client address); chosen so mod 3 gives b1, b2, b3, mod 4 b3, b2, b1, and mod 2 over b1, b3 moves two of three |
| timeline | 0–15 s | checks run to 15 s; the last request can end at 15 s (r9 + 6 s) |

Only **b2** can be slow or fail: it is the one backend the student breaks (deviation: the task's sticky preset broke
b1; see NOTES.md).

## Params

| Key | Kind | Values | Default |
|---|---|---|---|
| `algo` | choice | `rr` round robin, `lc` least connections, `hash` source hash, `sticky` sticky cookie | `rr` |
| `backends` | range | 2–4 | 3 |
| `slowB2` | toggle | b2 takes 5 s instead of 2 s | off |
| `failAt` | range | 0 = never, 1–9 s: b2 fails at this time | 0 |
| `failMode` | choice | `refuse` (the service is stopped: connections refused) / `hang` (accepts, never answers) | `refuse` |
| `failFor` | range | 0 = stays failed, 1–8 s: b2 works again after this long | 0 |
| `inter` | range | 1–5 s between health checks | 2 |
| `fall` | range | 1–5 failed checks in a row mark a backend down | 3 |
| `rise` | range | 1–5 passed checks in a row mark it up again | 2 |

`failMode` and `failFor` are additions to the task's params: `failMode` so that both codes of rule 6 can appear,
`failFor` so that `rise` has something to do (a backend that never comes back never rises).

## Rules

1. **Roles.** The proxy is a server to the client and a client to the backend; the client sends every request to the
   proxy and never sees a backend. A 502 or 504 comes *from the proxy* and names its role: the fault is behind it.
   (UL ch21, definitions *posrednik*, *obrnuti proxy*, *pozadinski poslužitelj*; RFC 9110 §3.7.)
2. **Round robin.** The next backend in order after the last one round robin chose, skipping those marked down.
   (The usual default; HAProxy `balance roundrobin`, nginx upstream default.)
3. **Least connections.** The backend marked up with the fewest open connections at that instant; **tie → lowest
   number** (a simplification: real balancers may break ties round robin; the page says so).
4. **Source hash.** backend = up[hash(client) mod |up|], where up is the list of backends marked up, in order.
   Removing a backend from the list changes the modulus and remaps most clients *(check: "most" holds for these
   numbers; plain modulo hashing, not consistent hashing, which is out of scope)*.
5. **Sticky cookie.** A request whose client holds a cookie naming a backend that is marked up goes to that backend.
   Otherwise round robin (rule 2) picks, and the backend's successful response sets the cookie. The cookie arrives
   with the response, so a request sent before the previous response came back carries the older cookie or none.
   A client sent away from its cookie's backend has lost its server-side session there.
6. **502 and 504.** A request sent to a failed backend in `refuse` mode is refused at once and the proxy answers
   **502**; one in flight when the service stops is cut off, 502 at that moment. In `hang` mode the backend accepts
   and never answers: the proxy gives up after its 6 s timeout with **504** (in flight when it fails: 504 at start +
   6 s). A hung request stays hung if b2 recovers before the 6 s are up: that connection is lost. (RFC 9110 §15.6.3, §15.6.5; UL ch21 Primjer 7: stopped service → 502 "Connection refused", a program that
   accepts and stays silent → 504 after the proxy's wait.)
7. **Health checks.** Every `inter` seconds from t = 0, the proxy checks every backend. A check fails while the
   backend is failed (either mode) and passes otherwise; slowness does not fail a check. A backend marked up is
   marked down at the check that makes `fall` failures in a row; one marked down is marked up at the check that makes
   `rise` passes in a row. **Until it is marked down a failed backend still gets traffic.** Typical defaults: every
   2 s, down after 3, up after 2 *(check: HAProxy's `inter 2s fall 3 rise 2`)*.
8. **Order within one instant:** (a) responses that end now complete (their connections close, their cookies
   arrive); (b) b2 fails or recovers; (c) the request of this second is assigned; (d) health checks run. So a
   completion frees its connection before the next assignment (task rule 8), a failure at t already hits the request
   at t, and a backend marked down at t still gets the request at t.
9. **No backend up:** the proxy answers 502 itself, backend none. (Not reachable with these params: only b2 fails.)

## Derived state

`initial(params)` → `{ assignments, perBackend, healthLog, endT }`:

- `assignments[k]`: `{ req, t, client, backend (1…4 or null), status (200/502/504), end, moved, cookie, cut }`;
  `cut` marks a request that was in flight when b2 failed (rule 6), `cookie` the backend its cookie named;
  `moved` is set only for `hash` and `sticky`: the client's previous request went elsewhere (`hash`), or the client's
  cookie named another backend (`sticky`: session lost).
- `perBackend[i]`: `{ id, count, ok, errors, maxOpen, service, down: [[from, to|null]], up (marked up at 15 s) }`.
  `count` counts every request assigned, errors included. `maxOpen` is the most requests open at once
  (`start ≤ s < end`; a refused request is never open).
- `healthLog`: `{ t, backend, pass, mark: 'down' | 'up' | null }` per check.

`changed(prev, cur)` → the request numbers whose backend or status differs (none without a previous state).

## Presets (numbers checked with the model, pinned in `sim.test.js`)

1. **`round-robin`**: defaults. b1 r1 r4 r7, b2 r2 r5 r8, b3 r3 r6 r9 (3/3/3).
2. **`least-conn-slow`**: `lc`, `slowB2`. b1 5 (r1 r3 r5 r7 r9), b2 2 (r2 r8), b3 2 (r4 r6). Round robin with the same
   params: b2 still 3, with 2 open at once.
3. **`hash-remap`**: `hash`, b2 fails at 4 s (refused), checks every 1 s, down after 1. c1→b1, c2→b2, c3→b3 until
   4 s; b2 is marked down at 4 s (hash mod 2 from then on): c1 stays on b1, c2 goes to b3, c3 to b1: two of three
   clients move. No request meets the failed b2.
4. **`health-check`**: round robin, b2 fails at 4 s (refused), checks every 2 s, down after 3. Failed checks at 4, 6,
   8 s → marked down at 8 s. r5 (5 s) and r8 (8 s) are sent to b2 and get 502; r9 goes to b3; after 8 s only b1 and
   b3. (UL ch21 Primjer 7 for what 502 means; timing derived.)
5. **`sticky`**: sticky cookie, b2 fails at 4 s (refused), checks every 2 s, down after 2. c2's first response (r2,
   2–4 s) completes at 4 s just before the failure (rule 8) and sets cookie b2; r5 (5 s) still follows it and gets
   502; failed checks at 4 and 6 s mark b2 down at 6 s; r8 (8 s) goes to b1 by round robin (the last round-robin pick
   was b3, for r3) and c2 loses its session on b2. c1 stays on b1, c3 on b3: b1 4, b2 2 (one 502), b3 3.
   (Ties to `cookies-sessions`.)

The task's `hash-remap` said "with b2 removed"; here b2 is removed the way a balancer removes it, by failing its
health check, so the remap shows in one trace. Its `sticky` preset pinned c1 to b1 and failed b1; only b2 fails here,
so it is c2 and b2.

## Captions (one per param set)

One or two sentences. A fault that caused errors (`capFault502`, `capFault504`: the requests and when b2 was marked
down), followed by `capMovedSticky` / `capMovedHash` when clients also moved; else the move alone; else a fault no
request met (`capFaultClean`); else per algorithm: `capRR`, `capRRSlow`, `capLCSlow` (the task's caption, numbers
from the model; only when least connections gives b2 fewer than round robin would, else `capLCSlowEven`), `capLC`,
`capHash`, `capSticky`, or `capStickyRace` when a client sent a request before its previous response, and so its
cookie, came back (rule 5).

The fault captions say separately which requests were *sent* to the failed b2 before it was marked down and which
were *in flight* when it failed; when b2 recovers before any check marks it down they say so, and a mark-down at the
first failed check is "at once", not "only at".

## Out of scope

VRRP/keepalived failover of the proxy itself, TLS termination, consistent hashing, weights, connection queuing,
passive health checks (`max_fails`), retrying a failed request on another backend.
