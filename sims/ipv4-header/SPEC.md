<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipv4-header: spec

Explorer (task `docs/tasks/w3/ipv4-header.md`, catalogue `net-ipv4-header`, §4.1). One concept: **what each field
of the IPv4 header does, and which fields change in transit**. No steps: the params drive the view live.

## Scene

- **Path** (top): A → R1 → B as in `hop-rewrite`; the packet before R1 on segment 1, after it on segment 2. In
  `fragment` segment 1 is labelled MTU 1500 and segment 2 MTU 500; in `nat` R1 is the NAT router and B is the
  server 8.8.8.8 on the Internet side.
- **Field strip** (middle): five 32-bit rows, cell widths proportional to the bits (with a minimum so short fields
  stay readable), as in URM `assets/diagrams/ch08-ipv4-zaglavlje.svg`. An Options row appears only when IHL > 5.
  Every cell is a button: name, size in bits, value in this packet; a cell that changes in the chosen view is
  marked `.sd-changed` and shows before → after.
- **Info card** (bottom left) for the selected field: name, bits, group, role, what the value in this packet means,
  every situation in which the field changes (rule 10), the misconception where there is one.
- **Situation box** (bottom right): `role` the IHL/length arithmetic; `hop` and `nat` a before/after table;
  `fragment` one row per fragment; `fragment` with DF = 1 the drop.

## Params

| key | type | values | default | notes |
|---|---|---|---|---|
| `field` | select | 13: version, ihl, tos, totalLength, id, flags, fragOffset, ttl, protocol, checksum, src, dst, options | `ttl` | also set by clicking a cell |
| `view` | choice | role, hop, fragment, nat | `role` | |
| `df` | toggle | | off | shown only in `fragment` |
| `ihl` | range 5–15 | | 5 | shown only in `role` (deviation: the task's Options row needs an IHL above 5) |

## The packets (one per view)

| view | src → dst | total | ID | DF | TTL | protocol | source |
|---|---|---|---|---|---|---|---|
| role | 192.168.1.10 → 192.168.2.50 | 1240 | 0x2a10 | 1 | 64 | 6 TCP | URM ch08 Primjer 7 (IHL 5, 1240, the two addresses); ID, DF, TTL, protocol chosen |
| hop | 192.168.1.10 → 192.168.2.20 | 84 | 0x1c46 | 1 | 64 | 1 ICMP | URM ch11 Primjer 1; the packet of `sims/hop-rewrite` (SPEC "The packet") |
| fragment | 192.168.1.10 → 192.168.2.50 | 1400 | 0x2a11 | param | 64 | 17 UDP | URM ch08 Primjer 3 (1400 into 500); the rest chosen |
| nat | 192.168.1.10 → 8.8.8.8 | 84 | 0x1c47 | 1 | 64 | 1 ICMP | task; public address 203.0.113.5 (RFC 5737 documentation range) |

All: version 4, IHL 5 (in `role` the `ihl` param), DSCP 0, ECN 0, MF 0, offset 0. Options, when IHL > 5, are
(IHL − 5) × 4 octets of the No Operation option (type 1, RFC 791 §3.1); their detail is out of scope.

## Rules

1. **Twelve fixed fields**, in this order and width: version 4, IHL 4, type of service 8, total length 16,
   identification 16, flags 3, fragment offset 13, TTL 8, protocol 8, header checksum 16, source 32, destination 32
   = 160 bits = 20 octets in five 32-bit rows (RFC 791 §3.1; URM ch08 "Građa IP zaglavlja", Šire o temi).
2. **IHL counts 32-bit words:** header octets = IHL × 4; data octets = total length − IHL × 4; options octets =
   (IHL − 5) × 4; IHL < 5 is invalid (RFC 791 §3.1; URM ch08 Primjer 7). IHL is 4 bits, so at most 15 (60 octets).
3. **Total length is 16 bits:** a packet is at most 65 535 octets (RFC 791 §3.1; URM ch08).
4. **Protocol values shown:** 1 ICMP, 6 TCP, 17 UDP (IANA Protocol Numbers; RFC 791 §3.1).
5. **Type of service** is shown as DSCP (6 bits) + ECN (2 bits) (RFC 2474 §3, RFC 3168 §5); the field's name stays
   "vrsta usluge" / "type of service".
6. **Every hop:** TTL − 1 and the header checksum recomputed; nothing else in the header changes; source and
   destination never change on a plain router (RFC 1812 §5.3.1 TTL; RFC 1812 §5.2.2 for the checksum *(check: the
   reviewer recalls §5.2.2 as header validation, not the recompute)*; RFC 791 §3.1 "recomputed at each point that
   the internet header is processed"; URM ch11 Primjer 1, 64 → 63).
7. **Fragmenting** (R1, MTU 500 on segment 2): data per fragment = ⌊(MTU − IHL × 4) / 8⌋ × 8; identification copied
   to every fragment; each fragment its own header with its own total length; MF = 1 on all but the last (the last
   keeps the original's MF); offset = original offset + data offset / 8; TTL − 1 (R1 is a hop, rule 6); checksum
   recomputed. DF = 1 forbids it: the packet is dropped, no fragments (RFC 791 §3.1, §3.2; RFC 1191 §3; URM ch08
   Primjer 3).
8. **Through NAT:** source address (outbound) → 203.0.113.5, plus TTL − 1 and the checksum as on any hop (URM ch11
   "NAT", Šire o temi; RFC 3022 §4.1).
9. **Checksum** = one's complement of the one's complement sum of the header's 16-bit words with the checksum field
   at 0 (RFC 791 §3.1; RFC 1071). The model computes every checksum; the page never hard-codes one.
10. **Tie-break:** "changed" is computed by comparing the packet before R1 with every packet after it, field by
    field (DSCP + ECN are one field, DF + MF one field). A field that changes in several views is lit in each. The
    info card lists every situation in which the field changes, in the order hop, fragment, NAT, each computed from
    that view's own packet (DF off); a field that changes in none says so.

## Expected numbers (checked with an independent Python script, NOTES.md)

| case | checksum before | after |
|---|---|---|
| role (IHL 5) | 0x8783 | — |
| role, IHL 7 (8 octets of NOP) | 0x817f | — |
| hop | 0x99f4 | 0x9af4 (TTL 63; equals `hop-rewrite`) |
| nat | 0x4ca0 | 0xd34c (src 203.0.113.5, TTL 63) |
| fragment, DF 0 | 0xc6d7 | see below |
| fragment, DF 1 | 0x86d7 | dropped |

Fragments of 1400 (IHL 5, data 1380) at MTU 500: 480 octets of data each (500 − 20 = 480, a multiple of 8).

| # | total length | data octets | MF | offset (× 8 = octets) | TTL | checksum |
|---|---|---|---|---|---|---|
| 1 | 500 | 480 | 1 | 0 (0) | 63 | 0xab5b |
| 2 | 500 | 480 | 1 | 60 (480) | 63 | 0xab1f |
| 3 | 440 | 420 | 0 | 120 (960) | 63 | 0xcb1f |

Read preset: header 5 × 4 = 20 octets, data 1240 − 20 = 1220 octets.

Changed fields per view: role none; hop TTL, checksum; fragment total length, flags, fragment offset, TTL, checksum
(identification stays); fragment with DF none (dropped); nat TTL, checksum, source.
Situations: TTL and checksum hop, fragment, NAT; total length, flags, fragment offset: fragment; source: NAT; every
other field: none.

## Presets

1. `read`: view role, field IHL. Header 20 octets, data 1220 (Primjer 7).
2. `hop`: view hop, field TTL. 64 → 63, checksum recomputed, addresses unchanged (ch11 Primjer 1).
3. `fragment`: view fragment, field fragment offset. Three fragments as above (Primjer 3; numbers derived).
4. `nat`: view nat, field source. 192.168.1.10 → 8.8.8.8 leaves as 203.0.113.5 → 8.8.8.8 (derived).
5. `df`: view fragment, DF on, field flags. Dropped: ICMP "fragmentation needed" to A; details in
   `fragmentation-pmtud` (RFC 791 §3.1, RFC 1191 §3).

## Terms and misconceptions

Terms (written out, not in the glossary yet; NOTES.md): header (glossary), Internet Header Length — duljina
zaglavlja, total length — ukupna duljina, identification — identifikacijski broj, fragment offset — pomak
fragmenta, time to live — vrijeme života, header checksum — kontrolni zbroj zaglavlja, flags — zastavice.
Misconceptions on the card: IHL is octets (it is 32-bit words); routers rewrite the IP addresses (only NAT does);
TTL is seconds (in practice a hop count, RFC 1812 §5.3.1).

Out of scope: options in detail, the IPv6 header, the PMTUD algorithm (`fragmentation-pmtud`), checksum arithmetic
step by step, ports and ICMP identifiers that NAPT also rewrites (outside the IP header).
