<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# static-default-route: specification

Task `docs/tasks/w3/static-default-route.md` (catalogue `net-static-default-route`, §4.1). One concept: **how a
default route catches everything, and routing loops**. The student turns routes on and off on three routers and
steps a ping through them. Model: `sim.js`; tests: `sim.test.js`.

## Scene

A — R1 — R2 — R3 — ISP, with B behind R2. A, B, R1 and R2 and the R1–R2 link are URM ch11 Primjer 3; the R2–R3 and
R3–ISP links are derived (a second /30 after the book's, and a documentation /30 from RFC 5737).

| Node | Interface | Address | Network |
|---|---|---|---|
| A | | 192.168.1.10/24, gateway 192.168.1.1 | 192.168.1.0/24 |
| R1 | Gi0/0 (to A) | 192.168.1.1/24 | 192.168.1.0/24 |
| R1 | Gi0/1 (to R2) | 192.168.100.1/30 | 192.168.100.0/30 |
| R2 | Gi0/1 (to R1) | 192.168.100.2/30 | 192.168.100.0/30 |
| R2 | Gi0/0 (to B) | 192.168.2.1/24 | 192.168.2.0/24 |
| R2 | Gi0/2 (to R3) | 192.168.100.5/30 | 192.168.100.4/30 (derived) |
| R3 | Gi0/1 (to R2) | 192.168.100.6/30 | 192.168.100.4/30 (derived) |
| R3 | Gi0/0 (to ISP) | 203.0.113.1/30 | 203.0.113.0/30 (derived) |
| ISP | | 203.0.113.2 | the edge of the scene |
| B | | 192.168.2.20/24, gateway 192.168.2.1 | 192.168.2.0/24 |

## Routes the student can add (params)

| Param | Router | Entry | Kind tag |
|---|---|---|---|
| `r1Static` | R1 | 192.168.2.0/24 via 192.168.100.2 (R2) | S |
| `r1Default` | R1 | 0.0.0.0/0 via 192.168.100.2 (R2) | S* |
| `r2Static` | R2 | 192.168.1.0/24 via 192.168.100.1 (R1) | S |
| `r2Default` | R2 | 0.0.0.0/0 via 192.168.100.6 (R3) | S* |
| `r3Default` | R3 | 0.0.0.0/0 via 203.0.113.2 (ISP) | S* |
| `r3Back` | R3 | 0.0.0.0/0 via 192.168.100.5 (R2): the mistake | S* |

Other params: `dst` = `B` (192.168.2.20) | `8.8.8.8` | `198.51.100.7`, default `B`; `ttl` 4–64, default 64: the
initial TTL of **every** packet in the scene (A's request, B's reply, a router's ICMP error). Defaults: `r1Static` and
`r2Static` on, the rest off, `dst` B, `ttl` 64 (= preset `both-ways`).

Each router's table: its connected networks first (kind C, interface name), then the added routes in the order of
the table above. A static route's interface is the connected network that holds its next hop.

## Rules

1. **Connected networks need no entry.** A router knows the networks on its own interfaces (URM ch11
   "Usmjeravanje", Primjer 3a: "Izravno spojenu mrežu svaki usmjernik poznaje sam").
2. **A static route is entered by hand and changes only by hand** (URM ch11; CARNET CERT, *Osnove mrežnog
   usmjeravanja* §7.1): the tables come from the params only; nothing in a run adds or removes a row.
3. **The default route 0.0.0.0/0 matches every address** (its mask compares no bit) and is **used only when nothing
   more specific matches** (URM ch11; RFC 1812 §2.2.5.2; Cisco *Routing and Switching Essentials*, "Routing
   Concepts").
4. **Several matches: the longest prefix wins, regardless of table order** (URM ch11 Primjer 2; RFC 1812
   §2.2.5.2). The lookup is the one of `routing-table` (`match`, `lookup`).
5. **No match and no default: drop, ICMP Destination Unreachable type 3 code 0** (net unreachable) to the dropped
   packet's source (RFC 792; RFC 1812 §5.2.7.1; URM ch11 Primjer 3b).
6. **TTL.** A router that forwards decrements the TTL by 1; when it reaches 0 the router drops the packet and sends
   **Time Exceeded, type 11 code 0**, to the source (RFC 1812 §5.3.1; URM ch11 "Šire o temi": the loop dies on TTL).
   Order inside a router: route lookup first, then TTL (RFC 1812 §5.2.1, the forwarding walk-through *(check: icmp-messages cites §5.2.1.2)*, as in `icmp-messages`): a packet with
   TTL 1 and no route gets 3/0, not 11/0.
7. **Routing works per direction:** B's reply is a new packet looked up on its own; a route to B says nothing about
   the way back (URM ch11 Primjer 3b).
8. **No ICMP error about an ICMP error** (RFC 1812 §4.3.2.7 *(check)*): a dropped ICMP error is just dropped. **If
   the router has no route to the source either, the error is not sent** (it could not be).
9. **Duplicate prefix refused.** Two entries for the same network and prefix length are not allowed in this model;
   metric and administrative distance are out of scope. Of `r3Default` and `r3Back` (both 0.0.0.0/0 on R3) the one
   already on blocks the other (the control says why); if both arrive on (a URL), `r3Default` is installed and
   `r3Back` is refused, listed in the state and named in the caption.

Hosts: A and B send to a destination on their own /24 directly, anything else to their gateway. A host accepts a
packet addressed to it. B answers an echo request with an echo reply (rule 7: a new packet, next step).

**ICMP source address:** the address of the router's interface the error leaves on (RFC 1812 §4.3.2.4, as in
`icmp-messages` and `hop-rewrite`). **The ISP** is the edge of the scene: whatever reaches it leaves into the
internet, which the scene does not draw. A public destination is "handed on"; the answer would need NAT at R3 (out of
scope). A packet for a private address (A or B) that reaches the ISP is lost there: no route on the internet leads
back to a private network (RFC 1918 §3 *(check)*); the ISP sends nothing.

## Step

One step = one node handles one packet:

- **send**: a host (A's request, B's reply) or a router (an ICMP error) puts a new packet on the link to its first
  hop, TTL as set;
- **forward**: a router looks the destination up (longest prefix), decrements the TTL and sends it on;
- **drop**: a router finds no route, or the TTL reaches 0; the packet stays there, crossed out;
- **out**: the ISP takes the packet off the scene.

A packet that reaches its destination host is delivered in the step that brings it there. A reply or an ICMP error
starts as a new packet in the next step. At most three packets per run (request, reply or error, error about the
reply), so a run always ends.

## Presets (each sets all six toggles; the task's numbers)

| Preset | Routes on | dst | TTL | Steps | What happens |
|---|---|---|---|---|---|
| `both-ways` (Primjer 3a) | r1Static, r2Static | B | 64 | **6** | A→R1→R2→B, reply B→R2→R1→A, TTL 62 at A |
| `one-way` (Primjer 3b) | r1Static | B | 64 | **6** | request reaches B (TTL 62); R2 drops the reply (no route to 192.168.1.0/24); 3/0 from 192.168.2.1 goes to **B**; A sees silence |
| `default` (Primjer 3c) | r1Default, r2Static | B | 64 | **6** | as 1; at step 2 R1 uses 0/0; at step 6 R1 matches 192.168.1.0/24 **and** 0/0, /24 wins, out on Gi0/0 |
| `to-internet` | r1Default, r2Default, r3Default | 8.8.8.8 | 64 | **5** | A, R1 (0/0), R2 (0/0), R3 (0/0), the ISP takes it on; TTL 61 at the ISP |
| `loop` | r1Default, r2Static, r2Default, r3Back | 198.51.100.7 | 8 | **11** | A sends 8; R1 8→7, R2 →6, R3 →5, R2 →4, R3 →3, R2 →2, R3 →1, R2 1→0 drops (8 routers); R2 sends 11/0 from 192.168.100.2 via r2Static, R1 8→7, A gets it |

The task lists the routes for `default` as "r1Default instead of r1Static + r2Static" and for `loop` as "r2Default and
r3Back"; the step counts it gives need `r2Static` in `default` (the reply's way back, as in Primjer 3c) and
`r1Default` + `r2Static` in `loop` (R1 must forward 198.51.100.7; with r2Static the Time Exceeded goes R2 → R1 → A, so
9 steps to the drop (A's send, 7 forwards, the drop at R2) + 2 for the 11/0 = 11; without it the 11/0 loops too).

`sim.json` `steps` = 6 (the defaults). The step count depends on the params (`steps(p)`): the longest free play is
**130** steps (r1Default + r2Default + r3Back, no r2Static, a public destination, TTL 64: the request loops, then its 11/0
loops too); the page allows it for free play; every preset stays at or under 11.

## Other cases (tested)

| Routes | dst | TTL | Steps | Result |
|---|---|---|---|---|
| none | B | 64 | 3 | R1 drops (3/0), 3/0 from 192.168.1.1 to A |
| r1Static, r2Static | 8.8.8.8 | 64 | 3 | R1: no route, no default: 3/0 to A |
| r1Default, r2Static | 8.8.8.8 | 64 | 5 | R2 drops (no default on R2); 3/0 from 192.168.100.2, via R1 (connected /24 beats 0/0) to A |
| r1Default, r2Static, r2Default, r3Back | 198.51.100.7 | 4 | 7 | R1, R2, R3, R2 (1→0) drops; 11/0 to A in 2 steps |
| loop without r2Static | 198.51.100.7 | 8 | 18 | the 11/0 from R2 (source 192.168.100.5) loops too, dies at R2 (1→0), dropped without an error (rule 8) |
| r1Static, r2Default, r3Default | B | 64 | 7 | the reply goes R2 (0/0) → R3 (0/0) → the ISP and is lost: A sees silence |
| loop at TTL 64 | 198.51.100.7 | 64 | 67 | free play only: the loop dies at R2 after 64 routers; 11/0 to A |

## Marks

- Packet chips: echo request c1, echo reply c2, ICMP error dashed with a `--danger` border and its type/code; TTL on
  every chip. A drop ends in ✕.
- Tables: kind tag C / S / S* as text. In the router handling the packet (also when it sends an ICMP error: the
  lookup for the error's destination): the winning row thick ink frame, the changed mark and "▶ pobjeđuje" ("▶ jedini
  se podudara" when it is the only match); another matching row dashed, "▽ podudara se, kraći"; no match at all: a
  "✕ nema zapisa ni zadanog puta" line under the table. A refused row (rule 9) is struck, "odbijen: isti prefiks".
- The packet's path: each node with the TTL it left with; a drop is marked ✕ (a no-route drop keeps the TTL it came
  with, a TTL drop shows 0).
- "Changed": the matched row and the TTL on the packet.
