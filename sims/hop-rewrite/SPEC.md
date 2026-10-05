<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# hop-rewrite: what changes at each hop

One concept: **the MAC addresses change on every segment, the IP addresses stay, the TTL drops by one at every
router, and the header checksum (and the frame's FCS) is recomputed.** The student steps one ping (ICMP echo
request) from A to B across one or two routers.

Task: `docs/tasks/w2/hop-rewrite.md`. Catalogue: `net-hop-rewrite` (§4.1, overlap §5.9).

## Scene

A row of nodes on kit view K2, a segment label (its network) under every link:

| | 1 router (`routers: 1`) | 2 routers (`routers: 2`) |
|---|---|---|
| A | 192.168.1.10/24, gateway 192.168.1.1, MAC `…:0a` | same |
| R1 Gi0/0 | 192.168.1.1/24, MAC `…:11` | same |
| R1 Gi0/1 | 192.168.2.1/24, MAC `…:12` | 10.0.0.1/30, MAC `…:12` |
| R2 Gi0/0 | — | 10.0.0.2/30, MAC `…:21` |
| R2 Gi0/1 | — | 192.168.3.1/24, MAC `…:22` |
| B | 192.168.2.20/24, MAC `…:14` | 192.168.3.20/24, MAC `…:14` |
| segments | 1: 192.168.1.0/24, 2: 192.168.2.0/24 | 1: 192.168.1.0/24, 2: 10.0.0.0/30, 3: 192.168.3.0/24 |

The 1-router scene is URM ch11 Primjer 1 (A, R1 with Gi0/0 and Gi0/1, B, TTL 64). The 2-router scene and every
MAC are this sim's (derived). MACs are `02:00:00:00:00:xx` (locally administered); the page shows the last octet.

Routes (the lookup's result only; how a table is searched is out of scope, `routing-table`):
R1 with one router: 192.168.2.0/24 directly connected on Gi0/1. R1 with two: 192.168.3.0/24 via 10.0.0.2 on Gi0/1.
R2: 192.168.3.0/24 directly connected on Gi0/1. Back to the source: R1 192.168.1.0/24 connected on Gi0/0, R2
192.168.1.0/24 via 10.0.0.1 on Gi0/0.

## The packet

IPv4 header, 20 B: version 4, IHL 5, DSCP/ECN 0, total length 84, ID 0x1c46, flags DF, fragment offset 0,
TTL `ttl0`, protocol 1 (ICMP), header checksum, source 192.168.1.10, destination B. Payload 64 B: ICMP echo request
type 8, code 0, checksum 0xf7fd, identifier 1, sequence 1, 56 zero bytes (derived; the payload only feeds the FCS).
The frame: destination MAC, source MAC, type 0x0800, the 84 B packet, FCS = CRC-32 over the 98 B from the destination
MAC to the end of the payload (no padding needed). Preamble and SFD are not shown (`encapsulation` shows them).

## Rules

1. **IPs stay.** Source and destination IP addresses are the same on every segment, end to end (URM ch11
   "Usmjeravanje: kako paket pronalazi put kroz mrežu", Primjer 1).
2. **New frame per segment.** A router discards the incoming frame and builds a new one: source MAC = its outgoing
   interface, destination MAC = the next hop (the next router, or B on the last segment), found in its ARP cache
   (URM ch11, same section; ch08 Primjer 5b for ARP to the gateway). A's first frame goes to R1 Gi0/0, never to B
   (misconception "the destination MAC is B's from the start"). A's cache for the gateway is warm (the ARP itself is
   `arp-local-remote`).
3. **TTL − 1 at every router** (RFC 1812 §5.3.1; URM ch11 "TTL"). Hosts do not decrement: A sends `ttl0`, B accepts
   what it receives.
4. **TTL 0 → drop and ICMP Time Exceeded.** The check comes after the decrement: a packet that arrives at a router
   with TTL 1 is decremented to 0, discarded, and the router sends ICMP Time Exceeded, type 11 code 0, to the source
   192.168.1.10 (RFC 1812 §5.3.1; RFC 792 type 11; URM ch11). **Tie-break:** a host receiving TTL 1 accepts it
   (the router before it sent it on with TTL 1, which is not 0). The dropped packet's checksum is not recomputed, and
   no new frame is built.
   The ICMP message is a new packet from the dropping router: its source is the address of the interface it is sent
   from towards 192.168.1.10 (RFC 1812 §4.3.2.4 *(check)*): R2 10.0.0.2, or R1 192.168.1.1 when R1 drops. Its TTL is the
   router's own initial value, here 64 (assumption; RFC 1812 leaves it configurable). Its header checksum and FCS are
   new and are not computed here (its payload, the dropped header plus 8 B, is not modelled). It travels back
   through R1 like any packet; the sim shows it as one step.
5. **Header checksum recomputed at every hop**, because TTL is in the header (RFC 791 "Header Checksum"; RFC 1812
   §4.2.2.5 *(check)*; incremental form RFC 1624 eq. 3: HC' = ~(~HC + ~m + m')). TTL is the high byte of the 16-bit
   word TTL|protocol, so TTL − 1 adds 0x0100 to the checksum (one's complement, with end-around carry when the high
   byte wraps). The model recomputes it in full (RFC 791) and a test checks it against the incremental form,
   including a wrapping case.
6. **FCS recomputed for every new frame**: it covers the frame, which is new (URM ch07 FCS; IEEE 802.3 CRC-32).
7. **Nothing else changes** in the IP header on a plain router: version, IHL, length 84, ID 0x1c46, DF, protocol 1,
   addresses (no NAT, no options, no fragmentation). The page shows them as one "other fields =" cell.
8. **ARP on the next segment.** With `coldArp`, R1's cache lacks its outgoing next hop (B, or R2 10.0.0.2): R1 holds
   the packet (already decremented and re-checksummed), sends an ARP request (broadcast) on its outgoing segment,
   gets the reply (unicast), then builds the frame. Two extra steps (task file: "one extra step" for the ARP, and
   the step count 7: request and reply are one step each, as in `arp-local-remote`).

## One step

- **cross**: the packet crosses one segment in the frame as built; a row is added to the history.
- **process**: one router, in this order: strip and discard the frame → look up the destination network →
  TTL − 1 → TTL = 0? (drop, stop) → recompute the header checksum → next-hop MAC from the ARP cache → build the new
  frame (src MAC = outgoing interface, dst MAC = next hop, new FCS). On an ARP miss the packet waits after the
  checksum line.
- **arpReq**, **arpRep**: R1's ARP exchange on its outgoing segment (only with `coldArp`).
- **arrive**: B checks the destination MAC (its own), the destination IP (its own), the checksum; TTL is not
  decremented; it accepts.
- **icmp**: the dropping router sends ICMP Time Exceeded (11/0) back to 192.168.1.10.
- **summary**: the whole history; the marks compare the last segment with segment 1.

Marks: on a process or cross step, each field is compared with the packet on the previous segment (the one before
this hop): changed fields are highlighted with the old value struck out, unchanged ones carry "=". On arrive every
field is "=" (B rewrites nothing). Segment 1 has nothing to compare with.

## Expected numbers (checked with `python3` reference script: `struct`, `zlib.crc32`; see NOTES.md)

| Preset | Steps | Segment rows: TTL, checksum, dst MAC ← src MAC, FCS |
|---|---|---|
| `book` (routers 1, ttl0 64) | 5: cross 1, process R1, cross 2, arrive, summary | 1: 64, 0x99f4, …:11 ← …:0a, 0xfac50cbc; 2: 63, 0x9af4, …:14 ← …:12, 0xc8bc7f0a |
| `two-routers` (routers 2) | 7: cross 1, R1, cross 2, R2, cross 3, arrive, summary | 1: 64, 0x98f4, …:11 ← …:0a, 0x546340f8; 2: 63, 0x99f4, …:21 ← …:12, 0x9ba8557c; 3: 62, 0x9af4, …:14 ← …:22, 0xb5e04438 |
| `ttl-dies` (routers 2, ttl0 2) | 6: cross 1, R1, cross 2, R2 drops, icmp, summary | 1: 2, 0xd6f4, 0x639f1e54; 2: 1, 0xd7f4, 0x587eec5c; R2: TTL 0, dropped; ICMP 11/0 10.0.0.2 → 192.168.1.10 |
| `cold-arp` (routers 1, coldArp) | 7: cross 1, R1 (miss, holds), ARP request, ARP reply, cross 2, arrive, summary | as `book` |

The checksums of `book` and `two-routers` are the task file's (0x99f4 → 0x9af4; 0x98f4 → 0x99f4 → 0x9af4).
Others: routers 1 with ttl0 1 dies at R1 in 4 steps (cross 1, R1 drops, icmp from 192.168.1.1, summary), checksum
0xd8f4; routers 1 with ttl0 2 reaches B with TTL 1 (tie-break), 5 steps. Largest: routers 2 with coldArp, 9 steps.

## Params

`ttl0` 1–64 (default 64), `routers` 1 | 2 (default 1), `showChecksum` (default on: hides the checksum fields,
column and lines when off), `coldArp` (default off; added for the `cold-arp` preset).

## Out of scope

Routing table search (longest prefix: `routing-table`), NAT (`nat`), IPv6 hop limit (no header checksum, RFC 8200),
traceroute, the ICMP message's own forwarding at R1, ARP from A (`arp-local-remote`).
