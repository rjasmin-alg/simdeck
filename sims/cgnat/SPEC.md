<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cgnat: specification

One concept: **double NAT, shared address space, why port forwarding fails.** Task `docs/tasks/w3/cgnat.md`,
catalogue `net-cgnat` (§4.1, §5.12). The student steps a connection through two NATs: the subscriber's home router
and the carrier's NAT (CGN).

Sources: URM book ch. 11 (`book/chapters/11-usmjeravanje.md`) "NAT: kad više uređaja dijeli jednu adresu" and
Primjer 4 (the PAT table: A 192.168.1.10:51000 → 203.0.113.5:61000, B → :61001; a packet from outside to :61050 is
dropped); URM ch. 08 (`08-mrezni-sloj.md`) "Javne i privatne adrese" → Šire o temi (100.64.0.0 – 100.127.255.255 for
CGN, "nije ni javan ni jednak trima klasičnim privatnim rasponima", RFC 6598 quoted); RFC 6598 §4 (read for this task:
"Packets with Shared Address Space source or destination addresses MUST NOT be forwarded across Service Provider
boundaries. Service Providers MUST filter such packets on ingress links."; "Devices MUST be capable of performing
address translation when identical Shared Address Space ranges are used on two different interfaces."); RFC 6888 §2
("Subscribers have limited or no control over the CGN, whereas they typically have full control over a NAT placed on
their premises"), §3 REQ-9 (a CGN MUST offer subscribers a protocol for explicit control of mappings), REQ-15 (ports
SHOULD be hard to guess), §4 ("identify a subscriber based on external IPv4 address, port, and timestamp … When
multiple subscribers share a single external address"); RFC 3022 (traditional NAT, sessions outbound only); RFC 5737
(documentation blocks). The PAT functions are copied from `sims/nat/sim.js` @ ff047ee (the `nat` model is not in
`models/` yet).

## Scene

- Up to three **subscribers** A, B, C (param `subscribers`, 1–3, default 2), each a home with one host and a home
  router. Every home uses the same private range, and every host is **192.168.1.10**, port **51000** (RFC 6598 §4:
  identical ranges on different interfaces must work; the URM book's host A).
- Home routers (NAT 1, "CPE") have outside addresses in the shared space: A **100.64.0.5**, B **100.64.0.6**,
  C **100.64.0.7**. The CGN's inside address is **100.64.0.1**. Each home router assigns ports from **61000** (the
  book's Primjer 4).
- The **CGN** (NAT 2) has one public address, **203.0.113.5** (the book's R address), and assigns ports from
  **62000** (task file).
- The **server** is **198.51.100.10:443** (the book's). An **outside client** is **192.0.2.50:50000** (RFC 5737
  TEST-NET-1; derived: the book gives no address for a packet from outside).
- Port forwarding (param `portForward`, default off) puts one static entry on A's home router: outside
  **100.64.0.5:8080** → inside **192.168.1.10:8080**.

## State

`{ phase, who, homes: [{ id, table, forwards }], cgn, packet, lookup, seen, verdict }`, plain JSON.

- A table row is the `nat` model's `{ inside: {ip, port}, outside: {ip, port}, dest: {ip, port} }` (the task file
  called them `inside, mapped, dst`; the copy keeps `nat`'s names). A forward is `{ outside, inside }`.
- `packet` is `{ from, to, src, dst, was, drop }` or null: the hop it is on (node ids `A…C` hosts, `hA…hC` home
  routers, `cgn`, `net`, `server`, `client`), its header after this step's rewrite, `was = { field: 'src' | 'dst', ep }`
  the value before the rewrite, `drop` true when it dies at `to`.
- `lookup` is `{ box: 'hA' | … | 'cgn', row, result: 'new' | 'reuse' | 'hit' | 'miss' | 'forward' }` or null.
- `seen` lists the source endpoints the server has received (what "the internet" knows about the subscribers).
- `verdict`: null, `delivered`, `dropped` (no entry at a NAT) or `unreachable` (the internet has no route).

## Rules

1. **Translate out, reverse on the way back.** An outbound packet leaving a NAT gets its source address and port
   rewritten; the NAT adds a row (or reuses one for the same connection). An inbound packet gets its destination
   rewritten from the row whose outside address and port it is addressed to (URM ch. 11 "NAT"; Primjer 4; RFC 3022).
2. **One-way sessions, at each NAT on its own.** An inbound packet with no row is dropped. Each NAT reads only its own
   table (URM ch. 11, "Sesije u tradicionalnom NAT-u jednosmjerne su"; Primjer 4b).
3. **Shared address space.** 100.64.0.0/10 (100.64.0.0 – 100.127.255.255) is neither public nor one of the three
   private ranges 10/8, 172.16/12, 192.168/16 (URM ch. 08; RFC 6598). The internet carries no packet addressed to it
   (RFC 6598 §4: not forwarded across provider boundaries, filtered on ingress). Model: `addressSpace(ip)` →
   `private | shared | public`; `routable(ip)` is `public` only.
4. **Double NAT.** Outbound, a packet is translated twice (home router, then CGN); a reply twice in reverse. What the
   server sees is the CGN's address and a CGN-assigned port, nothing the subscriber chose (RFC 6888 §2, §4).
5. **Port forwarding on the home router does not help.** An inbound packet to the public address dies at the CGN,
   where there is no row and the subscriber cannot add one; the home router's forward is never read. Sent to the home
   router's own address (100.64.0.5) instead, it is not routed on the internet (rule 3). The forward itself works: a
   packet that reaches the home router at 100.64.0.5:8080 goes to 192.168.1.10:8080. Derived from rule 2 at NAT 2 and
   RFC 6888 §2. Lookup order at a home router: the dynamic table first, then the forwards. *(check: a CGN offering
   subscribers the explicit-mapping protocol of RFC 6888 REQ-9 would let a forward be opened; the page says so in the
   explanation, not in the steps.)*
6. **One public address, many homes.** Subscribers behind one CGN all leave from 203.0.113.5; only the CGN port tells
   them apart, so the address alone no longer identifies one home (RFC 6888 §4: address, port and time are needed).
7. **Tie-break: lowest free port per NAT.** Each NAT gives a new connection the lowest port, from its first port, that
   no row uses on its outside address; equal inside endpoints behind different home routers get distinct CGN ports in
   the order they arrive. From `nat` (Primjer 4a: 51000 → 61000, 61001). Real CGNs pick hard-to-guess ports (RFC 6888
   REQ-15); lowest-free keeps the demo deterministic and is the book's rule.

## Steps

Order within a step: the packet moves one hop → the NAT it leaves looks up or inserts a row → the header is rewritten
→ caption. A drop happens at the NAT (or the internet) the packet arrives at.

**Outbound, one connection** (`direction: outbound`, `senders: one`): 6 steps. A opens a connection and the reply
comes home.

| n | phase | hop | header after the step | table |
|---|---|---|---|---|
| 1 | `send` | A → home A | 192.168.1.10:51000 → 198.51.100.10:443 | |
| 2 | `nat1` | home A → CGN | **100.64.0.5:61000** → 198.51.100.10:443 | home A: new row 192.168.1.10:51000 ↔ 100.64.0.5:61000 |
| 3 | `nat2` | CGN → internet → server | **203.0.113.5:62000** → 198.51.100.10:443 | CGN: new row 100.64.0.5:61000 ↔ 203.0.113.5:62000; server sees 203.0.113.5:62000 |
| 4 | `reply` | server → internet → CGN | 198.51.100.10:443 → 203.0.113.5:62000 | |
| 5 | `back2` | CGN → home A | 198.51.100.10:443 → **100.64.0.5:61000** | CGN: hit row 0 |
| 6 | `back1` | home A → A | 198.51.100.10:443 → **192.168.1.10:51000** | home A: hit row 0; verdict `delivered` |

**Outbound, every subscriber** (`senders: all`): 3 steps per subscriber, 3 × `subscribers` (6 by default), no
replies. Subscriber k: `send`, `nat1`, `nat2` as above. With two: A → 100.64.0.5:61000 → 203.0.113.5:62000;
B → 100.64.0.6:61000 → 203.0.113.5:62001; with three, C → 100.64.0.7:61000 → 203.0.113.5:62002. Each home router
gives 61000 (its own table); the CGN gives 62000, 62001, 62002 (rule 7). The server sees 203.0.113.5 two or three
times.

**Inbound** (`direction: inbound`): 3 steps, 4 with port forwarding. The probe port is 8080 with port forwarding on,
else 62050 (the task's presets; 62050 is the book's 61050 moved to the CGN's range).

| n | phase | hop | what happens |
|---|---|---|---|
| 1 | `probe` | client → internet | 192.0.2.50:50000 → 203.0.113.5:62050 (or :8080) |
| 2 | `arrive` | internet → CGN, dropped | CGN looks up 203.0.113.5:port: no row (`miss`), drops; verdict `dropped` |
| 3 | `after` | none | nothing reaches any home router; with a forward, its row is never read |
| 4 | `direct` (forward on) | client → internet, dropped | 192.0.2.50:50000 → 100.64.0.5:8080: not routable (rule 3); verdict `unreachable` |

Step counts against the task file: outbound-works 7 states (6 steps) as asked; inbound-dropped 4 states (3 steps) as
asked; port-forward-fails 5 states (4 steps) as asked; shared-address 7 states (6 steps), the task said 6 states.
`sim.json` `steps` is 6, the default's count (`steps` is a function of the params, as in `tcp-handshake`).

## Params

- `direction`: `outbound` | `inbound` (default outbound).
- `senders`: `one` (A, with the reply) | `all` (every subscriber, out only); shown for outbound.
- `portForward`: toggle, the static entry on A's home router (default off).
- `subscribers`: range 1–3 (default 2). Subscribers are drawn whether or not they send.

## Presets

1. `outbound-works`: outbound, one. Expected: A leaves as 203.0.113.5:62000 and the reply comes home, rewritten at
   the CGN to 100.64.0.5:61000 and at home A to 192.168.1.10:51000.
2. `inbound-dropped`: inbound, no forward. Expected: 203.0.113.5:62050 has no CGN row, dropped at step 2.
3. `port-forward-fails`: inbound, forward on. Expected: 203.0.113.5:8080 dropped at the CGN (no row), the forward
   unread; 100.64.0.5:8080 not routable.
4. `shared-address`: outbound, all, two subscribers. Expected: A and B both leave as 203.0.113.5, ports 62000 and
   62001; both home rows use 61000.

## Legend

Private address (c1, dashed border), shared address 100.64/10 (c2, hatched), public address (c3, thick border). The
address text itself is always there, so colour is never the only carrier. The task's "server (c4)" is not a legend
entry: the server and the outside client carry c4 in their marks and are named on their cards, and the legend row
has no room for a seventh item at 1920×1080 without wrapping the header. NAT boxes are the kit's router shape, the
dropped packet the kit's cross, the rewritten field and the row used have the kit's changed mark.
