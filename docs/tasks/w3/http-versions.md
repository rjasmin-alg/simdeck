# http-versions: HTTP/1.1 vs HTTP/2 vs HTTP/3

| | |
|---|---|
| Task | `http-versions` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-http-versions` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/http-versions/` |
| Class | explorer |
| Size | M |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `internet` / `http` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `http-exchange` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **multiplexing, and head-of-line blocking at TCP vs QUIC**.

The student: load a page with loss on each version.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/http-exchange/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` (Uvod u računalne mreže): "HTTP i HTTPS" → "Šire o temi" (HTTP/1.1 one request after another; HTTP/2 multiplexing and header compression, RFC 9113; HTTP/3 over QUIC, RFC 9114; QUIC on UDP, RFC 9000)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md` (TCP handshake and retransmission, for the round-trip assumptions)
- RFC 9113 (HTTP/2) §1, §5; RFC 9114 (HTTP/3) §1; RFC 9000 (QUIC) §2.2, §7; RFC 9001 (QUIC-TLS) §4; RFC 8446 §2 (TLS 1.3 1-RTT); RFC 9293 §3.5 (TCP handshake)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** kit view "side-by-side compare": three horizontal timelines (waterfalls), HTTP/1.1, HTTP/2, HTTP/3, sharing one time axis in ms. Each shows the connection set-up bars (TCP, TLS, or QUIC) and one bar per page object. A packet-loss marker can be dropped on one object.
- **State (explorer, no steps):** derived purely from params: `{ rows: [{ version, setupMs, objects: [{ id, startMs, endMs, blockedMs }], doneMs }] }`.
- **What the params drive live:** RTT, object count, number of HTTP/1.1 connections, and an optional loss on one object; the three waterfalls and their "page done" times update at once.
- **Rules (a teaching model: bandwidth, slow start and server time are ignored, one object = one round trip):**
  1. HTTP/1.1 sends one request at a time per connection and waits for the response before the next (URM ch14 "Šire o temi": "svaki zahtjev čeka prethodni"); parallelism comes only from opening more connections (browsers use about 6 per host, check).
  2. Each TCP connection costs 1 RTT for the TCP handshake and 1 RTT for TLS 1.3 before the first request (RFC 9293 §3.5; RFC 8446 §2).
  3. HTTP/2 multiplexes all requests as streams on one TCP connection (RFC 9113 §5; URM ch14 "Šire o temi").
  4. HTTP/3 runs over QUIC on UDP; QUIC combines transport and TLS 1.3 set-up in 1 RTT (RFC 9000 §7, RFC 9001 §4; URM ch14 "Šire o temi").
  5. A lost TCP segment holds back **all** data behind it on that connection until it is retransmitted, so in HTTP/2 one loss stalls every stream (TCP head-of-line blocking) (RFC 9113 §1 motivation for HTTP/3, RFC 9114 §1, check wording). In QUIC a loss stalls only its own stream (RFC 9000 §2.2).
  6. Recovery in the model = 1 extra RTT for the affected bytes (simplification, stated on the page).
- **Params:** `rtt` range 10–300 ms, default 100; `objects` range 1–12, default 6; `h1conns` choice 1/6, default 6; `loss` toggle, default off; `lostObject` select 1…objects, default 1.
- **Presets** (all derived from rules 1–6, unchecked):
  1. `no-loss` — RTT 100, 6 objects, 6 HTTP/1.1 connections: page done H1.1 300 ms, H2 300 ms, H3 200 ms. QUIC wins by the handshake round trip only.
  2. `one-connection` — as 1 with `h1conns` = 1: H1.1 200 + 6 × 100 = 800 ms; H2 300; H3 200. Multiplexing is the win.
  3. `loss` — as 1, loss on object 1: H1.1 object 1 ends at 400, others 300 (only its own connection waits); H2 all six end at 400 (one TCP stream stalls all); H3 object 1 at 300, others 200.
  4. `high-rtt` — RTT 250, 12 objects, loss on object 1: H1.1 (6 conns, two objects each): objects 1 and 7 on connection 1 end at 1000 and 1250, the others at 750 or 1000, page 1250; H2 all twelve at 1000; H3 object 1 at 750, the others at 500. Recompute with the model's test before quoting.
- **Steps:** none (explorer).
- **Legend:** set-up bars hatched (TCP / TLS / QUIC labelled), object bars solid, blocked time cross-hatched with a "čeka" label, loss marker ✕; the "changed" highlight marks bars whose end time changed with the last param change.
- **Captions:** hr: "HTTP/2: izgubljen je jedan TCP segment objekta 1, a svih šest tokova čeka njegov ponovni prijenos. Stranica je gotova u 400 ms umjesto 300 ms." en: "HTTP/2: one TCP segment of object 1 was lost, and all six streams wait for its retransmission. The page is done at 400 ms instead of 300 ms."
- **Terms:** *multiplexing* — multipleksiranje; *stream* — tok; *head-of-line blocking* — blokiranje na čelu reda (check); *round-trip time (RTT)* — vrijeme obilaska (check against URM ch13); *handshake* — rukovanje; *connection* — veza.
- **Misconceptions:** "HTTP/2 is always faster" (under loss it can be slower than six HTTP/1.1 connections); "QUIC on UDP is unreliable"; "HTTP/3 changed the methods and status codes" (same semantics, URM ch14).
- **Reuse from `http-exchange`:** the request/response pair and status codes are unchanged; new here are timing, connections and loss.
- **Out of scope:** header compression (HPACK/QPACK), server push, 0-RTT resumption, congestion control, prioritisation, bandwidth.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh http-versions sims/http-versions` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/http-versions/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
