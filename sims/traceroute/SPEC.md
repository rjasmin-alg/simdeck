<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# traceroute: spec

Task `docs/tasks/w3/traceroute.md`, catalogue `net-traceroute` (§4.1, §5.9). One concept: **Time Exceeded replies
map the path, and stars are not failures.** A stepper: one step is one TTL round.

## Scene

A chain A — R1 — R2 — … — Rn — S, n = 2…11 routers (param `routers`, default 5).

| Node | Address shown (the one it answers from) | Source |
|---|---|---|
| A, the source host | 192.168.1.10 | URM ch11 Primjer 1 (A's address) |
| R1 | 192.168.1.1 (its interface towards A) | URM ch11 Primjer 1 (R1 Gi0/0) |
| Rk, k ≥ 2 | 10.0.(k − 1).2 (its end of the /30 link 10.0.(k − 1).0/30 from Rk−1, which is .1) | derived |
| S, the destination | 192.0.2.20 (behind Rn, whose interface there is 192.0.2.1) | derived, RFC 5737 documentation range |

A router's Time Exceeded leaves from the interface towards A (the one the probe came in on, in a chain), so its
source address is the address in the table (RFC 1812 §4.3.2.4: an address of the interface the error is sent from
*(check: section number)*, as `hop-rewrite` and `static-default-route`
do).

## State

`{ tool, routers, dst, maxHops, silent: [ids], silentOff, filteredAtDest, round, lines, done, end }`

- `silent`: the silent router if it is on the chain (else empty); `silentOff`: the one chosen when it is not (rule 6).

- `round`: the round of this step, or null at step 0: `{ ttl, hop, at, ttlIn, links, probes, reply, from, why, rtts }`
  - `hop` = k for k ≤ n (dies at Rk); n + 1 for every k > n (the probe reaches S).
  - `at`: the node id where the probe stops (`R<k>` or `S`); `ttlIn`: its TTL on arrival there.
  - `links`: the TTL on each link the probe crosses, from A outward: `[k, k − 1, …, k − hop + 1]`.
  - `probes`: three `{ ttl, kind: 'echo' | 'udp', seq | port, at, reply, rtt }`.
  - `reply`: `'time-exceeded'` | `'echo-reply'` | `'port-unreachable'` | `null`; `from` its source address or null;
    `why`: `'ttl'` (a router answered), `'dest'` (the destination answered), `'silent'`, `'filtered'`.
- `lines`: one per round so far, `{ ttl, addr, rtts }`; `addr` and `rtts` are null for a `* * *` line.
- `end`: null while running; `'reply'` when the destination answered, `'max-hops'` when the last round was max hops.

## One step (phase order inside it: out, die, reply, print)

Round k: A sends three probes with TTL = k; each router decrements; the probes die where TTL reaches 0; that router
answers (or stays silent); line k is printed.

## Rules

1. **Every router decrements TTL by 1;** at 0 the packet is discarded and an ICMP Time Exceeded (type 11, code 0)
   goes to the source, unless the router is silent. A host (S) does not decrement. (RFC 1812 §5.3.1; RFC 792 "Time
   Exceeded Message"; URM ch11 "ICMP i dijagnostika puta".) So the probe of round k crosses link i (i = 1 is A–R1)
   with TTL k − i + 1, arrives at Rk with TTL 1 and dies there (1 → 0).
2. **Probe k dies at hop k; the reply's source names hop k** (URM ch11; Microsoft *tracert*). Line k's address is Rk's
   address from the scene table, for every k ≤ n.
3. **ICMP echo probes** (`tool: tracert`): the probes are echo requests (type 8, code 0), the destination answers
   with an echo reply (type 0, code 0). (Microsoft *tracert*; URM ch11 Primjer 6.) Sequence numbers 1, 2, 3, … one
   per probe.
4. **UDP probes** (`tool: traceroute`): the probes are UDP datagrams, the destination answers with ICMP port
   unreachable (type 3, code 3). Destination port 33434 for the first probe, + 1 per probe, so round k uses
   33434 + 3(k − 1) … + 2. (FreeBSD *traceroute(8)*: base port 33434; URM ch11 Primjer 6. *(check)*: the LBL source
   adds the sequence number counted from 1, which would make the first port 33435.)
5. **Three probes per TTL,** start at TTL 1, + 1 per round, stop at the destination's reply or after the round with
   TTL = max hops. (Microsoft *tracert*: default 30 hops; FreeBSD *traceroute(8)*.)
   Steps = min(n + 1, maxHops), or maxHops when the destination filters.
   Tie-break: when n + 1 = maxHops the last round both reaches the destination and is the last allowed; the
   destination's answer wins (`end: 'reply'`). When maxHops < n + 1 the trace ends at a router (`end: 'max-hops'`).
6. **A silent router prints `* * *` for its hop,** but probes with a larger TTL still pass it, and the replies of
   later hops pass it on the way back (URM ch11 Šire o temi, Primjer 5). Tie-break: silence at hop k never changes
   lines k + 1 … (same address, same three times). A silent router outside the chain (R9 with 5 routers) changes
   nothing; the start caption says it is not on the path.
7. **A destination that filters the probes** (its firewall drops them, no answer) prints `* * *` from its hop to max
   hops; the trace never completes though the path works (`end: 'max-hops'`). Probes of round k > n + 1 reach S with
   TTL k − n and are dropped there too (derived from rules 5, 6).
8. **RTT of a line** = 2 × (sum of the one-way link delays to the hop) + the hop's reply delay + a small fixed jitter
   per probe. A router builds its ICMP message on its slower path, so a router that is slow to answer shows a larger
   RTT than the hop after it: RTTs need not grow (URM ch11 screenshot caption: 5th hop 84.108 ms, 6th lower; the
   delay values are derived).

### Delays (derived, in µs, so every time is an exact integer)

| | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 | R11 | S |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| one-way delay of the link into it | 200 | 1 500 | 3 000 | 18 000 | 2 000 | 1 200 | 800 | 10 500 | 1 000 | 600 | 400 | 300 (Rn–S) |
| reply delay | 300 | 400 | 500 | **9 000** | 400 | 600 | 500 | 700 | 500 | 400 | 600 | 100 |

Jitter of probe j (0, 1, 2) in round k: `JIT[(3(k − 1) + j) mod 13]`, `JIT = [0, 41, 17, 63, 8, 52, 29, 74, 12, 47,
35, 58, 21]` µs.

### Printing (presentation, from the model's numbers)

- ICMP echo probes (`tracert` style): hop right-aligned in 3, then each time in 9 (`<1 ms` under 1000 µs, else
  whole ms rounded half up, `(µs + 500) div 1000` *(check: rounding of the tool)*), two spaces, the address. A silent
  hop: `*` in each field and no address (the tool's "Request timed out." text is left out: it is localised OS text).
- UDP probes (`traceroute` style): hop right-aligned in 2, two spaces, the address, then `  x.xxx ms` three times. A
  silent hop: `* * *`.
- Command line above the output: `tracert -d -h <maxHops> 192.0.2.20` or `traceroute -n -m <maxHops>
  192.0.2.20` (no name lookups; max hops written out because the tools' defaults differ).

## Params

| Param | Values | Default | Note |
|---|---|---|---|
| `tool` | `tracert` (ICMP echo) \| `traceroute` (UDP) | `tracert` | |
| `routers` | 2–11 | 5 | resets to step 0 (the chain changes) — deviation: the task implies it through its presets |
| `silent` | `none`, `R1` … `R11` | `none` | keeps the step: switch it at hop 9 and watch line 9 |
| `destFilter` | on/off | off | |
| `maxHops` | 4–30 | 30 | the kit clamps the step |

## Presets and expected numbers (checked with the script in NOTES.md)

1. **`basic`** — 5 routers, tracert. 6 steps. Lines: 1 `<1 ms` 192.168.1.1; 2 `4 ms` 10.0.1.2; 3 `10 ms` 10.0.2.2;
   4 `54 ms` 10.0.3.2; 5 `50 ms` 10.0.4.2; 6 `50 ms` 192.0.2.20 (echo reply 0/0). Hop 4 (54) > hop 5 (50).
2. **`stars`** — URM ch11 Primjer 5: 11 routers, R9 silent, tracert. 12 steps, 12 lines; line 9 `* * *`; line 10
   `78 ms` 10.0.9.2, 11 `79 ms` 10.0.10.2, 12 `79 ms` 192.0.2.20 (echo reply).
3. **`tools`** — URM ch11 Primjer 6: the basic path with UDP probes. 6 steps, the same 6 addresses; line 1 `0.700 ms
   0.741 ms 0.717 ms`, line 6 `50.117 ms 50.163 ms 50.108 ms` from 192.0.2.20, answered by port unreachable 3/3;
   round 1 ports 33434–33436, round 6 ports 33449–33451.
4. **`filtered`** — 5 routers, destFilter on, maxHops 8. 8 steps; lines 1–5 as basic, lines 6–8 `* * *`,
   `end: 'max-hops'`, no reply. Derived, unchecked against a real trace.

## Legend and marks

Probe (`--c1` chip "TTL k" on each link, solid arrow), Time Exceeded (`--c2`, dashed arrow back to A), the
destination's answer (`--ok`, dashed arrow back), silent router (hatched card, "šuti / silent" badge, solid border:
it works), the drop (red cross where the probe dies). Changed: the card of the node where the probes stop and the
newly printed line.

## Out of scope

Asymmetric return paths, load balancing (Paris traceroute), MPLS, ICMP rate limiting numbers, IPv6 hop limit, name
lookups, probes answered by different routers within one round.
