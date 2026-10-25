# dhcp-relay: DHCP relay and giaddr

<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

Task: `docs/tasks/w3/dhcp-relay.md` (catalogue `net-dhcp-relay`, §4.1). Class: stepper. Kit view **K1: message
sequence chart**, with the lanes in the order of the path, so the lane cards are the topology.

**One concept:** a relay forwards broadcasts as unicast and tags the subnet.

Sources, short names used below: **URM14** = Uvod u računalne mreže `book/chapters/14-aplikacijski-sloj.md`;
**URM12** = the same book, `12-izgradnja-mreze.md` Primjer 1 (address table and router configuration); **RFC** = RFC
2131; **RFC1542**; options RFC 2132; link-local RFC 3927. The RFC quotations below were checked against the
rfc-editor.org text on 2026-10-25.

## Scene (Grafo d.o.o.)

| Device | Addresses | Source |
|---|---|---|
| C, the new computer | MAC `52:54:00:4a:1c:07` (derived), no address | URM14 Primjer 2 |
| R2, branch router | LAN `192.168.1.113/28` (to SW2, Podružnica), serial `192.168.1.138/30` | URM12 Primjer 1 |
| R1, head-office router | serial `192.168.1.137/30`, VLAN 10 `192.168.1.1/26` (Prodaja), VLAN 30 `192.168.1.97/28` (Uprava) | URM12 Primjer 1 |
| S, DHCP server | `192.168.1.99` in Uprava `192.168.1.96/28`; option 6 DNS = `192.168.1.99` | URM14 "DHCP preko granica podmreža", Primjer 2 |

Server scopes (the table on the server's card; the picked row is outlined):

| Scope | Network | Mask (option 1) | Router (option 3) | First free address | Source |
|---|---|---|---|---|---|
| Podružnica | 192.168.1.112/28 | 255.255.255.240 | 192.168.1.113 | 192.168.1.116 | URM14 Primjer 2 |
| Prodaja | 192.168.1.0/26 | 255.255.255.192 | 192.168.1.1 | 192.168.1.20 (derived) | URM14 Pitanja 11, URM12 |
| Uprava | 192.168.1.96/28 | 255.255.255.240 | 192.168.1.97 | 192.168.1.100 (derived) | URM12 (.97, .99 taken) |

The task named two scopes; Uprava is added because the `same-subnet` preset needs a scope for the server's own subnet.

Where the client sits (param `client`) fixes the path and the lanes:

| `client` | Lanes, left to right | Relay (giaddr) | Segments |
|---|---|---|---|
| `branch` (Podružnica, SW2) | C, R2, R1, S | R2 `192.168.1.113` | Podružnica /28 · R2–R1 /30 · Uprava /28 |
| `sales` (Prodaja, VLAN 10) | C, R1, S | R1 `192.168.1.1` | Prodaja /26 · Uprava /28 |
| `admin` (Uprava, VLAN 30) | C, S | none | Uprava /28 |

The subnet boundary (dashed) is at the relay's lane. On `branch` R1 only routes the relay's unicast (no tip at R1;
its card says it routes); the R2 → S hop is one segment crossing in the model (one step), drawn across R1.

## State

```
{ t, p: { client, relay, server }, phase: INIT|SELECTING|REQUESTING|BOUND|LINKLOCAL,
  msgs: [{ n, t, type, from, to, via: [ids], src, dst, cast, giaddr, hops, yiaddr, flagB, chaddr, o50, o54, opts,
           wrote: [fields], lost, attempt }],
  client: { ip, mask, gw, dns } | null, attempts, scope, binding, offer, pending, last, done }
```

`msgs` holds one record per segment crossing (the relayed copy is its own record). `wrote` lists the fields the
sending device wrote (relay: `giaddr` when it was 0, `hops`; server: `yiaddr`): the "changed" mark on the field strip.
`scope` is the server's pick, `binding` its record after the ACK, `offer` the address the client asks for. `pending` is the
next crossing or timer; the run ends when there is none. The task's `relayOn`, `serverUp` are
`p.relay`, `p.server`.

## One step

One message crosses one segment, then the device it reaches applies its rule, in that order: the relay rewrites
(rules 3, 6), the server picks a scope and answers (rules 4, 5), the client stores the offer or the configuration
(rules 7, 8). Or the client's timer fires: the next DISCOVER, or the link-local fallback (rule 9). Messages take no
time; only the client's waits move the clock.

## Rules

1. **The client sends DHCPDISCOVER and DHCPREQUEST as broadcast**, from `0.0.0.0:68` to `255.255.255.255:67`, with
   `giaddr` 0.0.0.0, `hops` 0 and the BROADCAST bit set (a client sets it when it cannot take unicast before it has
   an address; the model's client always does, as the book draws it) (URM14 "DHCP: DORA slijed…"; RFC §4.1: "DHCP messages
   broadcast by a client prior to that client obtaining its IP address must have the source address field in the IP
   header set to 0").
2. **A router does not forward broadcasts.** With the relay off, the DISCOVER ends at the router's interface (✕ at R2
   or R1) (URM14 "DHCP preko granica podmreža", first paragraph).
3. **The relay** receives the broadcast on its interface, **writes that interface's address into `giaddr` only if
   `giaddr` is 0**, **increments `hops`**, and sends the message as **unicast to the configured server, port 67**
   (URM14 same section; RFC §1.5; RFC1542 §4.1.1: "the relay agent MUST fill this field with the IP address of the
   interface on which the request was received", "the 'giaddr' field MUST NOT be modified" when non-zero, "the value
   of the 'hops' field MUST be incremented", the destination "MUST be configurable"). *Tie-break:* a message that
   arrives with `hops` over 16 is discarded (RFC1542 §4.1.1: "MUST silently discard BOOTREQUEST messages whose 'hops'
   field exceeds the value 16"; 16 is the hard cap, the configurable threshold SHOULD default to 4, which the model
   leaves out). Source address of the relayed copy: the relay's receiving interface, source port 67
   (*check*: RFC1542 §4.1.1 leaves the IP source address open; implementations differ).
4. **The server picks the scope that contains `giaddr`**, not its own subnet: `192.168.1.113` → `192.168.1.112/28`;
   with `giaddr` 0 the scope of the interface it received the message on (Uprava) (URM14 Primjer 2; RFC §4.3.1: "the
   address is selected based on the subnet from which the message was received (if 'giaddr' is 0) or on the address
   of the relay agent that forwarded the message ('giaddr' when not 0)"). It offers the scope's first free address;
   the ACK for the REQUEST records a binding `{ addr, mac }`.
5. **With `giaddr` ≠ 0 the server answers to the relay at `giaddr`, port 67, as unicast**, never as broadcast (URM14
   footnote rfc2131-giaddr; RFC §4.1: "the server sends any return messages to the 'DHCP server' port on the BOOTP
   relay agent whose address appears in 'giaddr'"). With `giaddr` 0 and the BROADCAST bit set it broadcasts to
   `255.255.255.255:68`; without the bit it would unicast to `yiaddr` (RFC §4.1; a test drives it, no preset).
6. **The relay delivers OFFER and ACK on the client's segment to port 68**: broadcast `255.255.255.255:68` because
   the client set the BROADCAST bit, as the book draws it; without the bit, unicast to `yiaddr` / `chaddr` (RFC1542
   §4.1.2: "SHOULD be sent as an IP broadcast using the IP limited broadcast address", "MUST have its UDP destination
   port set to BOOTPC (68)"). The fields (`giaddr`, `hops`, `yiaddr`) arrive unchanged.
7. **REQUEST and ACK take the same path as DISCOVER and OFFER**: the REQUEST is a new client broadcast (`giaddr` 0,
   `hops` 0, option 50 = the offered address, option 54 = `192.168.1.99`), and the relay writes `giaddr` again
   (URM14 Primjer 2).
8. **The ACK carries option 1 (mask), option 3 (router) and option 6 (DNS)**; the client stores them. Option 6 points
   to `192.168.1.99` in another subnet, reached through the gateway (URM14 "DHCP preko granica podmreža", Primjer 2;
   RFC 2132 §3.3, §3.5, §3.8).
9. **No answer: retransmit, then link-local.** When nothing comes back (relay off, or server down: the relay still
   forwards and the unicast is lost at the server, ✕), the client sends DISCOVER again **4 s, 8 s and 16 s later**
   (at 4, 12, 28 s; RFC §4.1: "4 seconds randomized by … -1 to +1", "doubled with subsequent retransmissions up to a
   maximum of 64 seconds"; the model leaves out the ±1 s, and sends the first DISCOVER at 0 s instead of after the random 1–10 s wait of RFC
   §4.4.1). After the third retransmission the client waits 32 s and
   at **60 s gives itself `169.254.28.7/16`**, no gateway, no DNS (RFC 3927; *check*: neither RFC says when a client
   gives up, the 60 s and "three retransmissions" are the model's; the address is the last two MAC bytes, a real host
   picks it pseudo-randomly, seeded by its MAC, RFC 3927 §2.1). No OS is named.

## Params

| Key | Type | Values | Default |
|---|---|---|---|
| `client` | choice, resets | `branch` (Podružnica), `sales` (Prodaja), `admin` (Uprava) | `branch` |
| `relay` | toggle, resets; disabled for `admin` (no router on the path) | on/off | on |
| `server` | toggle, resets | up/down | up |

## Presets and expected numbers (checked by script and `sim.test.js`)

| # | Id | Params | Steps (task) | Outcome |
|---|---|---|---|---|
| 1 | `branch` | defaults | 8 (9) | giaddr `192.168.1.113`, hops 1, scope 192.168.1.112/28, offered `.116`; client `192.168.1.116`, `255.255.255.240`, gw `192.168.1.113`, DNS `192.168.1.99` |
| 2 | `sales-vlan` | client sales | 8 (9) | relay R1 `192.168.1.1`, giaddr `.1`, scope 192.168.1.0/26, mask `255.255.255.192`, gw `.1`, offered `.20` |
| 3 | `same-subnet` | client admin | 4 (5) | no relay, giaddr stays `0.0.0.0`, hops 0, four local broadcasts, scope 192.168.1.96/28, offered `.100`, gw `.97` |
| 4 | `no-relay` | relay off | 5 (6) | DISCOVER ✕ at R2 at 0, 4, 12, 28 s; at 60 s `169.254.28.7/16` |
| 5 | `server-down` | server down | 9 (6) | each DISCOVER is relayed (giaddr .113) and lost at the server: 4 × 2 crossings, then `169.254.28.7` at 60 s |

The task counted "start" as a step; here step 0 is the start, so presets 1–4 have one step fewer. `server-down` has
two crossings per attempt (client → R2, R2 → server ✕), as rule 9 says the relay still forwards each one. Every one
of the 12 combinations ends in at most 9 steps.

## Legend

Broadcast = dashed arrow with a tip at the receiver; unicast = solid arrow; ✕ = not taken (a router without a relay,
a server that is down); the relay's "relay" badge (c3) in the step it rewrites; a thick-bordered dashed line at the
relay's lane in the network strip = subnet boundary; changed (yellow): the field the last device wrote (`giaddr`, `hops`, `yiaddr`), the
scope row the server picked, the client's new settings, and the message of this step.

## Out of scope

Option 82, DHCP failover, lease renewal T1/T2 (`dhcp-dora`), Windows scope options (`win-dhcp-scope-options`),
DHCPv6 relay, several relays in a chain (the `giaddr`-only-if-0 and hops rules are tested on the functions), more
than one server, the server's ARP/ping check of the address, a NAK for a REQUEST outside the scope or the offer (the
model's server ACKs option 50 as asked).
