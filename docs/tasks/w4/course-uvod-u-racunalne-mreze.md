# course-uvod-u-racunalne-mreze: course page: Uvod u računalne mreže

| | |
|---|---|
| Task | `course-uvod-u-racunalne-mreze` (wave 4) |
| Owner | coordinator or owner (admin → Kolegiji) |
| Size | S |
| Depends on | wave 0; add each sim when it is `ready` |
| Licence | AGPL-3.0-or-later |

## Goal

A course file `courses/uvod-u-racunalne-mreze.json` and its generated page: the playlist for **Uvod u računalne mreže**, in the order the
course teaches it. Sims are added as they become `ready` (unfinished ones are flagged by the check, not
published).

## Do

- Create the course in the admin (Kolegiji → + Novi kolegij), or by hand per `docs/site-structure.md` §3.2.
- Ask the owner for the course's title, term, sections (lectures or weeks) and short address.
- Order the sims below by the syllabus; leave out what the owner drops; tools never go on course pages.

## Candidate sims (100, from the catalogue's course column)

| Sim | Title | Wave | Catalogue § |
|---|---|---|---|
| `comms-poster` | Communication technologies poster (hr) | 1 | 2.1 |
| `l2l3-protocols` | L2/L3 protocol deep dive (en) | 1 | 2.1 |
| `stateful-firewall` | Firewall, stateful filtering and DMZ | 1 | 2.2 |
| `flow-control` | Flow control | 1 | 2.2 |
| `hidden-node` | Hidden node | 1 | 2.2 |
| `ipv6-shorten` | Shortening IPv6 addresses | 1 | 2.2 |
| `layered-diagnosis` | Layer-by-layer troubleshooting | 1 | 2.2 |
| `mac-table` | MAC address table | 1 | 2.2 |
| `nat` | NAT | 1 | 2.2 |
| `pat` | PAT | 1 | 2.2 |
| `routing-table` | Routing table, longest prefix | 1 | 2.2 |
| `subnet-mask` | Subnet mask | 1 | 2.2 |
| `tcp-handshake` | TCP three-way handshake | 1 | 2.2 |
| `vlan` | VLAN | 1 | 2.2 |
| `vlsm` | VLSM | 1 | 2.2 |
| `tcp-window` | Sliding window | 1 | 2.2 |
| `topologydrafter` | topologydrafter | 1 | 2.4 |
| `arp-local-remote` | Local or remote, then ARP | 2a | 4.1 |
| `dhcp-dora` | DHCP DORA and the lease | 2a | 4.1 |
| `encapsulation` | Encapsulation and decapsulation | 2b | 4.1 |
| `hop-rewrite` | What changes at each hop | 2b | 4.1 |
| `ipv6-slaac` | IPv6 SLAAC | 2b | 4.1 |
| `port-multiplexing` | Ports and sockets | 2b | 4.1 |
| `rule-first-match` | First match wins | 2a | 4.1 |
| `stp` | Spanning tree | 2b | 4.1 |
| `tcp-congestion` | TCP congestion control | 2b | 4.1 |
| `tcp-retransmit` | Loss and retransmission | 2b | 4.1 |
| `wifi-association` | 802.11 association step by step | 2b | 4.1 |
| `wpa-handshake` | WPA2/WPA3 handshake and what an attacker sees | 2b | 4.1 |
| `bgp-path-selection` | BGP path selection | 2b | 4.2 |
| `dns-records` | DNS record types | 2b | 4.2 |
| `dns-resolution` | Recursive and iterative resolution | 2b | 4.2 |
| `email-path` | The path of an e-mail | 2b | 4.2 |
| `http-exchange` | One HTTP exchange | 2b | 4.2 |
| `tls-handshake` | TLS 1.2 vs 1.3 | 2b | 4.2 |
| `diffie-hellman` | Diffie–Hellman | 2b | 4.3 |
| `sym-vs-asym` | Symmetric vs asymmetric encryption | 2b | 4.3 |
| `win-ipam-address-plan` | Planning the address space | 2b | 4.5.5 |
| `arp-spoofing` | ARP spoofing, man in the middle | 3 | 4.1 |
| `asymmetric-path` | Asymmetric path through NAT and firewall | 3 | 4.1 |
| `broadcast-storm` | A loop without spanning tree | 3 | 4.1 |
| `cgnat` | Carrier-grade NAT | 3 | 4.1 |
| `crc-error-detection` | Error detection with CRC | 3 | 4.1 |
| `csma-ca-rts-cts` | CSMA/CA and RTS/CTS | 3 | 4.1 |
| `csma-cd` | CSMA/CD and binary exponential backoff | 3 | 4.1 |
| `delay-components` | Four kinds of delay | 3 | 4.1 |
| `dhcp-relay` | DHCP relay and giaddr | 3 | 4.1 |
| `dhcp-rogue` | Rogue DHCP and snooping | 3 | 4.1 |
| `distance-vector` | Distance vector and count to infinity | 3 | 4.1 |
| `domains` | Collision and broadcast domains | 3 | 4.1 |
| `ethernet-frame` | Anatomy of an Ethernet frame | 3 | 4.1 |
| `fragmentation-pmtud` | Fragmentation and PMTUD | 3 | 4.1 |
| `icmp-messages` | What ping answers mean | 3 | 4.1 |
| `intervlan-routing` | Inter-VLAN routing | 3 | 4.1 |
| `ipv4-header` | IPv4 header fields | 3 | 4.1 |
| `ipv6-address-types` | IPv6 address types and scopes | 3 | 4.1 |
| `ipv6-ndp` | NDP instead of ARP | 3 | 4.1 |
| `line-coding` | Line coding: NRZ vs Manchester | 3 | 4.1 |
| `link-aggregation` | Link aggregation and flow hashing | 3 | 4.1 |
| `link-state-spf` | Link state and Dijkstra | 3 | 4.1 |
| `mac-flooding` | MAC flooding and port security | 3 | 4.1 |
| `multicast-igmp` | Multicast and IGMP | 3 | 4.1 |
| `nominal-vs-actual` | Nominal vs actual throughput | 3 | 4.1 |
| `osi-tcpip-map` | OSI vs TCP/IP, and which device lives where | 3 | 4.1 |
| `packet-journey` | The whole journey: from URL to page | 3 | 4.1 |
| `poe-budget` | PoE power budget | 3 | 4.1 |
| `port-forwarding` | Port forwarding (DNAT) | 3 | 4.1 |
| `qos-queues` | QoS queues | 3 | 4.1 |
| `route-summarisation` | Route summarisation | 3 | 4.1 |
| `static-default-route` | Static and default routes | 3 | 4.1 |
| `syn-outcomes` | Open, closed, filtered | 3 | 4.1 |
| `tcp-states` | TCP state machine | 3 | 4.1 |
| `tcp-teardown` | TCP connection teardown | 3 | 4.1 |
| `tcp-vs-udp-loss` | TCP vs UDP under loss | 3 | 4.1 |
| `traceroute` | Traceroute and TTL | 3 | 4.1 |
| `vlan-trunk` | Access and trunk ports, native VLAN | 3 | 4.1 |
| `wifi-channels` | Wi-Fi channels and overlap | 3 | 4.1 |
| `wifi-roaming` | Roaming between APs | 3 | 4.1 |
| `fec-hamming` | Hamming code | 3 | 4.10 |
| `fsk-psk-ask` | ASK, FSK and PSK | 3 | 4.10 |
| `multiple-access` | FDMA, TDMA, CDMA | 3 | 4.10 |
| `qam-ofdm` | QAM and OFDM | 3 | 4.10 |
| `shannon-hartley` | Shannon–Hartley | 3 | 4.10 |
| `http-status-codes` | HTTP status codes | 3 | 4.11 |
| `well-known-ports` | Well-known ports | 3 | 4.11 |
| `protocol-headers` | Header poster | 3 | 4.11 |
| `cdn-anycast` | Anycast and CDN edges | 3 | 4.2 |
| `cookies-sessions` | Cookies and sessions | 3 | 4.2 |
| `ddos-amplification` | DRDoS amplification | 3 | 4.2 |
| `ftp-active-passive` | Active vs passive FTP | 3 | 4.2 |
| `http-caching` | HTTP caching | 3 | 4.2 |
| `http-versions` | HTTP/1.1 vs HTTP/2 vs HTTP/3 | 3 | 4.2 |
| `peering-transit` | Transit vs peering | 3 | 4.2 |
| `websocket` | WebSocket upgrade | 3 | 4.2 |
| `aaa-8021x` | AAA and 802.1X | 3 | 4.3 |
| `dmz-matrix` | DMZ rule matrix | 3 | 4.3 |
| `vrrp-failover` | VRRP failover | 3 | 4.7 |
| `game-tick-server` | Authoritative tick server | 3 | 4.8 |
| `rate-limiting` | Token bucket vs leaky bucket | 3 | 4.8 |
| `endianness` | Endianness | 3 | 4.9 |
