<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# http-versions: spec

Explorer (task `docs/tasks/w3/http-versions.md`, catalogue `inet-http-versions`, §4.2). One concept:
**multiplexing, and head-of-line blocking at TCP vs QUIC**. The same page of N objects is loaded over HTTP/1.1,
HTTP/2 and HTTP/3; the three waterfalls share one time axis, and one object can lose a segment.

## Scene

Three horizontal blocks, top to bottom HTTP/1.1, HTTP/2, HTTP/3, on one time axis in ms (ticks at whole round
trips). No kit view fits (a timeline), so the page draws it in HTML and CSS.

- **HTTP/1.1**: one lane per connection; each lane starts with its own set-up bars (TCP, TLS), then its objects one
  after another.
- **HTTP/2** and **HTTP/3**: one lane per object (stream); the one connection's set-up is one tall bar spanning all
  lanes (TCP + TLS, or QUIC), so it reads as one handshake shared by every stream.
- Right of each block: when the page is done.

## State

`initial(params)` → `{ lost, rows: [{ version, conns, setupMs, setup: [{ kind, startMs, endMs }],
objects: [{ id, conn, startMs, endMs, blockedMs, lost }], doneMs }] }`, rows in the order `h1`, `h2`, `h3`. Times
in ms from the moment the browser starts. `lost` is the object that loses a segment (0 = none). `blockedMs` is the
waiting at the end of an object's bar caused by a loss (its own or one ahead of it on the same TCP connection).
`doneMs` = the latest `endMs` (the page is done when its last object has arrived).

## Rules (a teaching model)

Bandwidth, slow start, server time and the HTML document itself are ignored; **one object = one round trip**
(request out, response back), and all N objects are wanted at once when the first connection is ready.

1. **HTTP/1.1, one request at a time per connection.** A connection carries the next request only after the
   previous response has arrived ("svaki zahtjev čeka prethodni": URM ch14 "HTTP i HTTPS" → "Šire o temi").
   Parallelism comes only from more connections: the browser opens `c = min(h1conns, N)` connections, all at
   once (a browser uses about 6 per host *(check)*; the page offers 1 or 6). Each object, in id order, goes to the
   connection that is free first.
2. **Each TCP connection** costs 1 RTT for the TCP handshake and 1 RTT for the TLS 1.3 handshake before its first
   request: set-up = 2 RTT (RFC 9293 §3.5 three-way handshake; RFC 8446 §2 TLS 1.3 full handshake in 1 RTT;
   URM ch13 "TCP: uspostava veze i trostruko rukovanje").
3. **HTTP/2** multiplexes all requests as streams on **one** TCP connection; all N are sent when it is ready
   (RFC 9113 §5; URM ch14 "Šire o temi": "dopušta više istodobnih izmjena na istoj vezi").
4. **HTTP/3** runs over QUIC on UDP; QUIC sets up the transport and TLS 1.3 together in **1 RTT** (RFC 9000 §7,
   RFC 9001 §4; URM ch14 "Šire o temi"). Streams as in HTTP/2.
5. **Head-of-line blocking.** TCP delivers bytes in order, so a lost segment holds back **all** data behind it on
   that connection until it is retransmitted. In HTTP/2 every stream shares the one connection, so one loss stalls
   every stream (RFC 9114 §1.1, "Prior Versions of HTTP": a packet loss on the one TCP connection stalls all active
   transactions *(check wording)*). In HTTP/1.1 only the lost object's own connection waits (the next request on it starts later). In
   QUIC streams are delivered independently, so a loss stalls only its own stream (RFC 9000 §2.2).
6. **Recovery = 1 extra RTT** for the affected data (a simplification, stated on the page). The loss is on the
   object's data, never on the set-up.

Derived formulas (R = RTT, N = objects, ℓ = lost object or none):

| | object end | page done, no loss | page done, loss |
|---|---|---|---|
| HTTP/1.1 | 2R + (its place on its connection) × R, + R for ℓ and everything after ℓ on ℓ's connection | 2R + ⌈N / c⌉·R | see tie-breaks |
| HTTP/2 | 2R + R, + R for **every** object | 3R | 4R |
| HTTP/3 | R + R, + R for ℓ only | 2R | 3R |

Everything is a multiple of R, so changing the RTT rescales the axis and leaves the picture unchanged: the lesson
is counted in round trips.

## Tie-breaks

1. **Two connections free at the same moment:** the lowest-numbered one takes the next object (with no loss this is
   round robin: object i on connection ((i − 1) mod c) + 1).
2. **A connection freed later by a loss** loses its turn: the next objects go to connections that are free earlier
   (dynamic dispatch). So in `high-rtt` connection 1 carries objects 1 and 12, not 1 and 7.
3. **More connections allowed than objects:** only N are opened (`conns = min(h1conns, N)`).
4. **`lostObject` above N** (N lowered after picking): the last object loses the segment; below 1: object 1. Loss
   off: no object is lost whatever `lostObject` says.
5. **One object with loss:** every version waits the one extra round trip; there is nothing behind the lost segment
   to block (caption `capLossOne`).
6. **"Changed" marks** compare with the state before the last param change: an object whose end time moved, or
   that is new (more objects), and each block's done time if it moved. Nothing is marked on first load.

## Presets

All from rules 1–6; checked by `sim.test.js` (test "presets: the numbers of SPEC.md").

| # | id | params | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|---|---|
| 1 | `no-loss` | RTT 100, 6 objects, 6 conns | all 300, page 300 | all 300, page 300 | all 200, page 200 |
| 2 | `one-connection` | as 1, `h1conns` 1 | 300, 400, …, 800: page 200 + 6 × 100 = 800 | 300 | 200 |
| 3 | `loss` | as 1, loss on object 1 | object 1 400, others 300; page 400 | all six 400; page 400 | object 1 300, others 200; page 300 |
| 4 | `high-rtt` | RTT 250, 12 objects, 6 conns, loss on object 1 | objects 2–6 at 750; 1 and 7–11 at 1000; 12 (connection 1) at 1250; page 1250 | all twelve 1000 | object 1 750, others 500 |

Preset 4 differs from the task's text in which objects end at 1000 and 1250 (the task put object 7 on connection 1;
tie-break 2 sends it to connection 2). The page-done times are the task's.

Preset 3's lesson: HTTP/2 is done when HTTP/1.1 is (400 ms), but five of its six objects arrive 100 ms later than on
six HTTP/1.1 connections; HTTP/3 alone keeps the loss to one object. In this model HTTP/2's page time is never later
than HTTP/1.1's (that would need congestion control, out of scope); "HTTP/2 is always faster" is answered per object.

## Captions (one, chosen by `captionKey(params)`)

- `capNoLoss`: the three done times; HTTP/3 is one round trip ahead because QUIC sets up transport and TLS together.
- `capSerial` (some HTTP/1.1 connection carries more than one request): requests in a row on one connection wait for
  each other; with one connection 2R + N·R; HTTP/2 sends all N as streams at once.
- `capLoss`: the task's caption: "HTTP/2: one TCP segment of object 1 was lost, and all six streams wait for its
  retransmission. The page is done at 400 ms instead of 300 ms." + HTTP/3: only stream ℓ waits. The "instead of" is
  the same params with loss off. With exactly two objects the stream count reads "both streams" (`bothStreams`).
- `capLossOne`: one object; every version waits one round trip for the retransmission, nothing else is blocked.

## Params

`rtt` 10–300 ms step 10 (default 100); `objects` 1–12 (6); `h1conns` choice 1 / 6 (6); `loss` toggle (off);
`lostObject` 1…`objects` (1), disabled while loss is off.

## Out of scope

HTTP/1.1 pipelining (RFC 9112 allows it; browsers do not use it), header compression (HPACK/QPACK), server push, 0-RTT resumption, congestion control and slow start,
prioritisation, bandwidth, the HTML document and the discovery of objects in it, DNS.
