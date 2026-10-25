<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# icmp-messages: specification

Task `docs/tasks/w3/icmp-messages.md` (catalogue `net-icmp-messages`, §4.1). One concept: **what a ping's answer
means**: echo reply, the unreachable codes, time exceeded, and silence. Model: `sim.js`; tests: `sim.test.js`.

## Scene

The addresses of URM ch08 Primjer 2 (192.168.1.10/24 and 192.168.2.50; (a) 192.168.1.77 on the same network) on a
three-segment path:

| Node | Interfaces | Routes (net → via) |
|---|---|---|
| PC | 192.168.1.10/24, gateway 192.168.1.1 | |
| R1 | `if0` 192.168.1.1 (towards PC), `if1` 10.0.12.1 | 192.168.1.0/24 conn, 10.0.12.0/30 conn, **192.168.2.0/24 via 10.0.12.2** |
| R2 | `if0` 10.0.12.2 (towards PC), `if1` 192.168.2.1 | 10.0.12.0/30 conn, 192.168.2.0/24 conn, 192.168.1.0/24 via 10.0.12.1 |
| S (server) | 192.168.2.50/24 | |
| X | 192.168.1.77 (scenario `local` only: nobody has this address) | |

Links and their one-way delay (chosen, round numbers): PC–R1 0.5 ms, R1–R2 2 ms, R2–S 0.5 ms. Round trip to S:
2 × 3 = **6 ms**. Router and host processing take no time.

## Params

| Param | Values | Default |
|---|---|---|
| `scenario` | `ok`, `noRoute` (R1 lacks the 192.168.2.0/24 route and has no default), `hostDown` (S is off), `fwDrop` / `fwReject` (a filter on R2 for ICMP echo requests to 192.168.2.50, action drop or reject), `local` (ping 192.168.1.77, which nobody has) | `ok` |
| `ttl` | 1–64, the request's initial TTL | 64 |
| `os` | `win` / `linux`: only the console wording (no effect on the steps) | `win` |

## Steps

One step: the packet (request or answer) crosses one link, or a device makes a decision (a rule fires), or the
timer runs out. The console line is printed in the step the answer reaches the PC, or when the timer runs out.
A router that simply forwards does it inside the hop step that leaves it (the chip shows the TTL after its
decrement). Step kinds: `hop`, `arp`, `decide`, `wait`, `print` (the last two only for silence).

### The order at a router (RFC 1812 §5.2.1.2: next-hop lookup step 5, "forwarding is permitted" step 6, TTL step 7, link-layer address step 10)

1. **Route lookup.** No route to the destination's network → drop, **3/0** net unreachable (RFC 792; URM ch11,
   footnote rfc792-unreachable).
2. **Filter** (R2 only, scenarios `fwDrop`/`fwReject`): drop → nothing is sent; reject → **3/13** communication
   administratively prohibited (RFC 1812 §5.2.7.1; step 6 "administrative constraints on forwarding", before the
   TTL). An inbound interface filter also acts before the TTL check; a forwarding-path filter on a Linux router
   sits after it, so there a TTL-2 request would get 11/0 instead (NOTES.md).
3. **TTL** − 1. If it is 0 → drop, **11/0** time exceeded (RFC 792; URM ch11, footnote rfc792-exceeded;
   RFC 1812 §5.3.1).
4. **Next hop's link-layer address.** The destination is on a connected network: ARP for it. No answer after 3
   requests 1 s apart (3 s) → drop, **3/1** host unreachable (RFC 1812 §5.2.7.1: "does not respond to ARP").
   3 requests, 1 s apart *(check: a common router default; some router firmware stays silent instead, task Sources)*.
5. Otherwise forward: the next hop step.

The **ICMP source address** of an error is the router's interface towards the PC (RFC 1812 §4.3.2.4: one of the
addresses of the interface the ICMP message is sent on): R1 → 192.168.1.1, R2 → **10.0.12.2**. An ICMP error starts
with TTL 64 and carries the dropped request's IP header and first 8 bytes (RFC 792), which is how the PC matches it
to its ping.

### At the target

- **S up:** echo request type 8 → **echo reply type 0** with the same data (RFC 792; URM ch11, footnote
  rfc792-echo-ch11). The reply starts at TTL 64 (a server with the common default; a host that starts at 128
  would arrive with 126) and loses one per router: **TTL=62** at the PC. The reply's TTL is its own, not the
  request's: with `ttl` 3 the request reaches S with 1, and the reply still arrives with 62.
- **The PC itself (`local`, rule 7):** 192.168.1.77 AND 255.255.255.0 = 192.168.1.0 = the PC's own network, so it
  delivers directly and ARPs for 192.168.1.77. Three ARP requests, no answer: **no IP packet leaves the PC**; it
  reports host unreachable from its **own** address 192.168.1.10 (Windows: "Reply from 192.168.1.10: Destination
  host unreachable.") *(check)*. `ttl` has no effect.

### Silence (rule 6)

The filter drops the request: nothing comes back. The PC's timer runs to **4 s** (Windows' default wait, the *ping*
command reference) and prints "Request timed out." Silence says only that no answer came, not where the path broke
(URM ch11, the paragraph after footnote rfc792-echo-ch11). Linux wording prints no line for a lost request; only
the summary counts it *(the Linux wait is not modelled)*.

### Tie-break (rule 8)

The **first device whose rule fires answers**; nothing behind it is reached. Inside one router, the order above.

| `ttl` | `ok` | `noRoute` | `hostDown` | `fwDrop` | `fwReject` | `local` |
|---|---|---|---|---|---|---|
| 1 | R1 11/0 | R1 3/0 (lookup first) | R1 11/0 | R1 11/0 | R1 11/0 | PC, no packet |
| 2 | R2 11/0 from 10.0.12.2 | R1 3/0 | R2 11/0 (TTL before ARP) | silence (the filter before the TTL) | R2 3/13 | PC |
| ≥ 3 | S echo reply | R1 3/0 | R2 3/1 | silence | R2 3/13 | PC |

## Steps per preset (task: 7, 3, 6, 5, 5, 3)

| Preset | Params | Steps | Sequence |
|---|---|---|---|
| `echo-ok` | ok, 64 | **7** | PC→R1, R1→R2, R2→S, S replies (0/0), S→R2, R2→R1, R1→PC + print |
| `no-route` | noRoute | **3** | PC→R1, R1 drops (3/0), R1→PC + print |
| `host-down` | hostDown | **6** | PC→R1, R1→R2, R2 ARPs ×3, R2 gives up (3/1), R2→R1, R1→PC + print |
| `firewall-drop` | fwDrop | **5** | PC→R1, R1→R2, R2 drops (nothing), the timer runs (2 s shown), at 4 s print "Request timed out." |
| `firewall-reject` | fwReject | **5** | PC→R1, R1→R2, R2 rejects (3/13), R2→R1, R1→PC + print |
| `ttl-low` | ok, ttl 1 | **3** | PC→R1, R1: TTL 1 → 0 (11/0), R1→PC + print |
| `local-down` (added) | local | **2** | PC ARPs ×3 for 192.168.1.77, gives up + print from its own address |

`sim.json` `steps` = 7 (the defaults). Most for any params: 7.

## Clock

| Event | t |
|---|---|
| reply at the PC (ok) | 6 ms |
| 3/0 from R1 at the PC | 1 ms |
| 11/0 from R1 / from R2 at the PC | 1 ms / 5 ms |
| 3/13 from R2 at the PC | 5 ms |
| R2's ARP requests | 2.5 ms, 1002.5 ms, 2002.5 ms; gives up at 3002.5 ms; 3/1 at the PC 3005 ms |
| PC's ARP requests (local) | 0, 1000, 2000 ms; gives up at 3000 ms |
| fwDrop: the timer running / timeout | 2000 ms / 4000 ms |

## Console (what ping prints; the OS's output is data, English on both page languages)

Windows (the *ping* reference): header `Pinging <dst> with 32 bytes of data:`; per request `Reply from 192.168.2.50:
bytes=32 time=6ms TTL=62`, `Reply from <src>: Destination net unreachable.`, `… Destination host unreachable.`,
`… TTL expired in transit.`, `Request timed out.`; 3/13 prints `… Destination net unreachable.` *(check: Windows
has no own wording for code 13)*. Summary `Packets: Sent = 4, Received = r, Lost = l (p% loss),`. Windows counts
every "Reply from" line as received, an ICMP error too, so every error case shows **0 % loss**; only the timeout
shows 100 % *(check)*.

Linux: header `PING <dst> (<dst>) 56(84) bytes of data.`; `64 bytes from 192.168.2.50: icmp_seq=1 ttl=62 time=6.00
ms`, `From <src> icmp_seq=1 Destination Net Unreachable`, `… Destination Host Unreachable`, `… Packet filtered`
(code 13), `… Time to live exceeded`; a timeout prints no line. Summary `4 packets transmitted, r received, +e
errors, p% packet loss` (the `+e errors` part only when e > 0): errors are **not** received, so 100 % loss. The
real summary ends with `, time NNNNms` (the run's duration, not modelled, left out).

The page runs one request on the path; at the print step it prints that line and the same line for requests 2–4
(the scenario is deterministic), then the summary: 4 sent.

## Marks

- The packet chip: request c1, echo reply c2, ICMP error c5 with its `type/code`; a silent drop ends in ✕.
- The broken element (route missing on R1, the filter on R2, S off, X absent): dashed warn outline and a badge.
- "Changed": the device that decides in this step (thick border, badge) and the console line just printed.
