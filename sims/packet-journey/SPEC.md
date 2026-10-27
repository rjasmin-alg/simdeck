<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# packet-journey: specification

Task `docs/tasks/w3/packet-journey.md` (catalogue `net-packet-journey`, §4.1, overlap §5.9). One concept: **DNS,
ARP, TCP, TLS, HTTP in order, across the real path**: one click on `example.com`, step by step, and which phases a
remembered answer takes off the wire. Model: `sim.js`; tests: `sim.test.js`.

## Scene

URM ch16, figure `ch16-put-podataka-detaljno` (addresses 192.168.1.23, 192.168.1.1, 203.0.113.10:443), left to
right:

| Node | Kind | Address | MAC (short label) |
|---|---|---|---|
| `PC` Računalo / Computer | host, on Wi-Fi | 192.168.1.23/24, gateway 192.168.1.1, DNS 192.168.1.1 | `aa:23` |
| `AP` *access point* | AP | none (bridges the frame unchanged) | none |
| `SW` Preklopnik / Switch | switch | none (forwards the frame unchanged) | none |
| `R` Usmjernik / Router | router: default gateway, NAT, DNS resolver, DHCP server | LAN 192.168.1.1, public 198.51.100.7 | LAN `bb:01`, WAN `bb:02` |
| `NET` Internet | cloud: collapsed hops | 10 routers *(derived)* | first hop `cc:01` |
| `SRV` Poslužitelj / Server | server, `example.com` | 203.0.113.10, port 80 (http) or 443 (https) | not shown (beyond the hops) |

*Derived, unchecked* (task file, and this spec where the book gives no number): public address 198.51.100.7
(RFC 5737 documentation range), client port 51000 → public port 40001, DNS answer TTL 300 s, DNS query from port
50500, 10 routers in the collapsed Internet, every sender starts at TTL 64 (URM ch11), the second object on an
open connection is `/logo.png`. The router is the DHCP server too (one device at the edge of a classroom network).

**Where a header card shows a packet.** A packet that crosses the whole path in one step is shown as the client's
link carries it (what the client's capture sees). The router-hop step shows the packet as it leaves the router on
the public side. TTL therefore reads 64 for everything the client sends and everything the router itself sends,
63 after the router, and 53 for what the server sends (64 − 10 Internet hops − 1 at the router).

## Params

| Param | Values | Default | |
|---|---|---|---|
| `scheme` | `http` / `https` | `http` | port 80 or 443; TLS only with https |
| `joined` | toggle | on | the host already has an address; off: DHCP first |
| `dnsWarm` | toggle | off | the host's cache (browser or OS) knows `example.com`; forced on with `connOpen` (the browser keeps the connection by name and port, so it holds the address) |
| `arpWarm` | toggle | off | the ARP table knows 192.168.1.1 |
| `connOpen` | toggle | off | a connection to `example.com` on this port is already open (with its NAT mapping and, for https, its TLS session); ignored while `joined` is off (no connection survives without an address) |
| `close` | toggle | off | the browser closes the connection after the response |

All reset to step 0 (each changes which phases run). Unknown values fall back to the defaults.

## State

`{ phase, next, host, target, dstIp, decision, lookup, packets, sw, natUse, dnsCache, arp, conns, nat, chain,
chainChanged, capture, newCapture, wrote, reqs, handshake }`, plain JSON. `phase` is the step just done, `next` the
one after it (null at the end); `host` is `{ ip, prefix, gw, dns }` or null before the DHCP ACK. `packets` is the
list of packets on the wire in this step (one, or two for the DHCP and FIN pairs; the task's `packet`, as a list):
`{ kind, dir, path, cast, view, l2: {src, dst}, l3: {src, dst, ttl} | null, l4: {proto, sport, dport, flags} | null,
app, nat: {field, wire, pub} | null, changed, was }`. `lookup` is the host's decision (`dns`, `arp` or `conn`, hit or
miss), `natUse` the router's (`{row, dir, created}`), `sw` the switch's (flood or the port). `dnsCache: {name: {ip,
ttl}}`, `arp: {ip: mac}`, `conns: [{sport, dst, dport, state}]`, `nat: [{priv, pub}]`, `chain: {phase: 'pending' |
'done' | 'absent' | 'unused'}`, `capture: [{n, filter, kind, dir, src, dst, sport, dport, flags, app}]`.
`wrote` (rows written), `chainChanged` (phases that changed state) and `newCapture` (lines added) drive the
"changed" marks.

## One step

One message (or one DHCP / FIN pair) or one packet-less decision. Inside a step: (1) the host or device decides
(cache lookup, AND with the mask, NAT lookup); (2) if a packet is sent, it moves and its headers are set; (3) the
tables that learn from it update; (4) the chain strip and the capture list update. A cache hit and the
local/remote decision are steps with nothing on the wire. The first packet of a new connection shows the router hop
(NAT + TTL + MACs) as its own step; every later packet crosses the whole path in one step.

**The phase order** (the model follows it from the state; nothing is scripted per preset):

1. `dhcp1` DISCOVER + OFFER, `dhcp2` REQUEST + ACK, only while the host has no address.
2. `click`: the host's caches (browser, then OS) are asked for `example.com`.
3. On a miss: `decide` for the resolver 192.168.1.1, `arp-req` + `arp-rep` if its MAC is unknown, `dns-q`, `dns-a`.
4. `decide` for the server 203.0.113.10, `arp-req` + `arp-rep` if the gateway's MAC is unknown.
5. No open connection: `syn`, `hop`, `synack`, `ack`; with https then `tls1`, `tls2`.
6. `req`, `resp`, once; twice when the connection was already open.
7. With `close`: `fin-c` (client FIN, server ACK) and `fin-s` (server FIN, client ACK).

## Rules

1. **DHCP only without an address.** `joined` off: DORA as broadcast, UDP 68 → 67 and 67 → 68, from 0.0.0.0 to
   255.255.255.255, MAC `ff:ff:ff:ff:ff:ff`; two steps (DISCOVER/OFFER, REQUEST/ACK). The ACK carries the
   address 192.168.1.23/24, the gateway and the DNS server (both 192.168.1.1), and the host stores them. DISCOVER and
   REQUEST come from 0.0.0.0; OFFER and ACK from the router, 192.168.1.1. `joined`
   on: DHCP is `absent` at step 1. (URM ch16 "Adresa dobivena unaprijed"; ch14 DORA)
2. **Name before request; host cache first.** The click asks the host's caches; a hit sends nothing and DNS is
   `absent`. (ch16 "Ime pretvoreno u adresu"; ch16 Primjer 1)
3. **One recursive query on a miss.** UDP 50500 → 53 to the resolver 192.168.1.1, type A; the answer
   `example.com A 203.0.113.10, TTL 300` is stored in the cache. The resolver's iterative walk is not drawn.
   (ch16; ch14)
4. **Local or remote: AND with the mask, no packet.** 192.168.1.1 AND 255.255.255.0 = 192.168.1.0 = the host's
   network → local, next hop the resolver itself. 203.0.113.10 AND 255.255.255.0 = 203.0.113.0 ≠ 192.168.1.0 →
   remote, next hop the gateway 192.168.1.1. (ch16 "Lokalno ili udaljeno"; ch08)
5. **ARP for the next hop.** The same `decide` step looks the next hop up in the ARP table: hit → no packet, ARP
   `absent`; miss → `arp-req` (broadcast, "who has 192.168.1.1? tell 192.168.1.23") and `arp-rep` (unicast,
   "192.168.1.1 is at `bb:01`"), and the entry is stored. The resolver is the gateway, so ARP comes before the DNS
   query and the later `decide` for the server finds the entry stored. (ch16; ch16 Primjer 1 order ARP → DNS →
   TCP; ch08)
6. **The switch and AP change nothing.** They forward by the MAC table (unicast to one port) or flood (broadcast,
   unknown destination), create no packets and never change the frame: the frame on the router's port equals the
   frame the host sent. (ch16 "Lokalno ili udaljeno", Šire o temi; ch07)
7. **At the router: IP addresses unchanged, TTL − 1, both MACs new.** src `aa:23` dst `bb:01` → src `bb:02` dst
   `cc:01`; TTL 64 → 63. (ch16 "Kroz usmjernike"; Primjer 4; ch11)
8. **NAPT once, at the edge, reversed on the way back.** The first packet of a connection rewrites the source
   192.168.1.23:51000 → 198.51.100.7:40001 and stores the mapping; a later packet of the same connection reuses
   the row (no new one); a reply to 198.51.100.7:40001 is rewritten back to 192.168.1.23:51000 by the same
   device. Nothing the client sends or receives on its own link carries 198.51.100.7: the capture never shows it.
   (ch16 "Kroz usmjernike", Primjer 5; ch11)
9. **TCP handshake unless a connection is open.** SYN, SYN-ACK, ACK from port 51000 to 80 or 443; the connection
   is `syn-sent` after the SYN and `established` when the SYN-ACK arrives. With `connOpen` the request goes on the
   open connection: no SYN, TCP `absent`. (ch16 "Veza prije zahtjeva", Primjer 3; RFC 9112 §9.3)
10. **https: TLS after TCP, before the request.** TLS 1.3 1-RTT in two steps: ClientHello; ServerHello …
    Finished (RFC 8446 §2). The request and response are then encrypted application data: the capture shows no
    GET and no 200. http: TLS `unused`, GET and `200 OK` readable. On an already open https connection the TLS
    session is open too: TLS `absent`. (ch16 "Zahtjev, odgovor i put unatrag"; ch18)
11. **The response returns the same way**: server → Internet → router (NAT reversed, TTL − 1, MACs new) → switch
    → AP → host, and is decapsulated layer by layer. (ch16; ch04)
12. **The connection stays open.** After the (last) response there is no FIN or RST and the closing phase is
    `absent`, unless `close` is on: then `fin-c` (client FIN, server ACK; `fin-wait-2`) and `fin-s` (server FIN,
    client ACK; `time-wait`), 2 steps. (ch16 Primjer 6; ch13)

**Tie-breaks.**

- A host cache that can answer wins: the phase is `absent` and no packet is drawn for it, ever (DNS on `dnsWarm`,
  ARP on a stored entry, TCP and TLS on `connOpen`).
- A warm *resolver* cache does not make DNS absent on the client's wire: the client still asks the resolver. This
  spec has no resolver-cache param (task file, note for the coordinator).
- The ARP entry learnt for the resolver is the gateway's: the second `decide` hits it (prvi-student step 7).
- `connOpen` is ignored while `joined` is off, and it implies `dnsWarm` (an open connection to the name means
  the host still holds its address; without that the model would resolve a name it does not need).
- An ARP miss for the server's gateway on a host that just joined is "nothing sent to the gateway since the address
  was obtained", not "the entry expired" (ch16 Primjer 2 names both cases).

**Chain strip.** Eleven phases in ch16's order: DHCP, DNS, lokalno/udaljeno, ARP, preklopnik, usmjernik, NAT, TCP,
TLS, HTTP, zatvaranje. Each is `pending`, `done` (when its last message is through, or at its first message for the
switch, router and NAT), `absent` (remembered state took it off the wire, or the connection stays open) or `unused`
(TLS on http), with a link to that part's own simulator. When each becomes `done` or `absent`:

| Phase | done | absent |
|---|---|---|
| DHCP | `dhcp2` | step 1 when `joined` |
| DNS | `dns-a` | `click` on a hit |
| lokalno/udaljeno | the first `decide` | never |
| ARP | `arp-rep` | `decide` on a hit (and nothing sent before) |
| preklopnik | the first frame through the switch | never |
| usmjernik | `hop`, or the first packet to the server on an open connection | never |
| NAT | the same step as usmjernik | never |
| TCP | `ack` | the first `req` on an open connection |
| TLS | `tls2` | the first `req` on an open https connection (`unused` on http, from step 0) |
| HTTP | the last `resp` | never |
| zatvaranje | `fin-s` | the last `resp` without `close` |

**Capture list** (what a capture on the client shows, numbered from 1): every packet the client sends or receives
on its own link, in order, with its filter word (`dhcp`, `arp`, `dns`, `tcp`, `tls`, `http`), source, destination and
a summary. The router hop adds no line (the client's link did not see it).

## Presets and expected numbers

| # | Preset | Params | Steps | Capture (filter: lines) | Chain at the end |
|---|---|---|---|---|---|
| 1 | `prvi-student` (ch16 Primjer 1, first student) | defaults (http, cold) | 13 | arp 2, dns 2, tcp 3, http 2 = 9 | DHCP absent, close absent, TLS unused, rest done |
| 2 | `drugi-student` (Primjer 1, second) | `dnsWarm`, `arpWarm` | 8 | tcp 3, http 2 = 5 | DHCP, DNS, ARP, close absent; TLS unused |
| 3 | `arp-istekao` (Primjer 2) | https, `dnsWarm` | 12 | arp 2, tcp 3, tls 4 (2 handshake + 2 encrypted) = 9 | DHCP, DNS, close absent |
| 4 | `novo-spajanje` (derived, unchecked) | https, `joined` off | 17 | dhcp 4, arp 2, dns 2, tcp 3, tls 4 = 15 | close absent, rest done |
| 5 | `otvorena-veza` (Primjer 3) | `dnsWarm`, `arpWarm`, `connOpen` | 6 | http 4 (two GET/200 on port 51000) | DHCP, DNS, ARP, TCP, close absent; TLS unused |

`close` adds 2 steps and 4 capture lines (tcp FIN, ACK, FIN, ACK) to any of them; the longest run is
`novo-spajanje` + `close` = 19 (≤ 20).

**prvi-student, step by step** (the page's TTL and MACs as the header card shows them):

| n | Phase | On the wire | Card: MAC src → dst, IP src → dst, TTL | Tables | Chain |
|---|---|---|---|---|---|
| 1 | click | none (cache miss) | | | DHCP absent |
| 2 | decide (resolver) | none: 192.168.1.1 local; ARP miss | | | local/remote done |
| 3 | arp-req | PC → AP → SW → R, broadcast | `aa:23` → `ff:ff:ff:ff:ff:ff` | | switch done |
| 4 | arp-rep | R → SW → AP → PC | `bb:01` → `aa:23` | ARP 192.168.1.1 = `bb:01` | ARP done |
| 5 | dns-q | PC → R | `aa:23` → `bb:01`, 192.168.1.23:50500 → 192.168.1.1:53, 64 | | |
| 6 | dns-a | R → PC | `bb:01` → `aa:23`, 192.168.1.1:53 → 192.168.1.23:50500, 64 | DNS example.com = 203.0.113.10, 300 | DNS done |
| 7 | decide (server) | none: remote → 192.168.1.1; ARP hit | | | |
| 8 | syn | PC → R | `aa:23` → `bb:01`, 192.168.1.23:51000 → 203.0.113.10:80, 64 | conn 51000 syn-sent | |
| 9 | hop | R → NET → SRV | `bb:02` → `cc:01`, **198.51.100.7:40001** → 203.0.113.10:80, **63** | NAT 192.168.1.23:51000 = 198.51.100.7:40001 | router, NAT done |
| 10 | synack | SRV → … → PC | `bb:01` → `aa:23`, 203.0.113.10:80 → 192.168.1.23:51000 (NAT reversed), 53 | conn established | |
| 11 | ack | PC → … → SRV | `aa:23` → `bb:01`, 192.168.1.23:51000 → 203.0.113.10:80, 64 | | TCP done |
| 12 | req | PC → … → SRV | GET / | | |
| 13 | resp | SRV → … → PC | 200 OK | | HTTP done, close absent |

Step 9 is the task's caption: "the router forwards the packet: IP addresses unchanged, TTL 64 → 63, both MACs new,
and NAT rewrites the source to 198.51.100.7:40001". drugi-student step 2 is the other: "the ARP table already
knows the gateway, so there is no ARP on the wire".

## Legend

Packet on the wire (filled chip, solid arrow; broadcast dashed); decision without a packet (hollow badge); phase
absent / cache hit (dashed, "odsutan"); NAT-rewritten field (hatched); changed in this step (the kit's highlight):
the header fields the router changed, and the table row just written.

## Misconceptions the presets answer

- A missing DHCP/DNS/ARP/SYN in a capture means something failed: presets 2, 3, 5 (dashed "odsutan" chips, with
  the reason).
- IP addresses change at every router: step 9 of preset 1 (only MACs and TTL, plus the NAT rewrite once).
- The client can see its public address in its own capture: the capture never contains 198.51.100.7 (test).

## Out of scope

The resolver's iterative walk (`dns-resolution`), TLS key exchange, IPv6/AAAA, HTTP/2–3 and QUIC, asymmetric return
paths, Wi-Fi association, switch learning (its table is assumed learnt), loss and retransmission.
