<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# protocol-headers: spec

Reference poster (task `docs/tasks/w3/protocol-headers.md`, catalogue `ref-protocol-headers`, §4.11). One concept:
**the Ethernet, IPv4, IPv6, TCP and UDP headers side by side**, drawn to one scale. No steps: the params drive the
view live. Numbers checked with a small script before coding (NOTES.md, "Numbers").

## Scene

- **Ethernet strip** (top): the frame as an octet strip, since it is not 32-bit aligned: preamble 7 and SFD 1
  (dashed, "not counted"), destination 6, source 6, length/type 2, data 46–1500 (hatched, variable), FCS 4. Octet
  offsets under it: 0, 6, 12, 14, 14 + data, end. The strip is to scale for the fixed fields only; the data block
  has a fixed width with its range written in it.
- **Four 32-bit headers** (middle), side by side, one scale (one row = 32 bits = 4 octets, bit ruler 0–31 on top):
  IPv4 (5 rows + an options row), IPv6 (10 rows, fixed), TCP (5 rows + an options row), UDP (2 rows). A field's box
  is as wide as its bits; a 128-bit address spans four rows. Options (IPv4, TCP) are one hatched row standing for
  0–40 octets.
- **Detail card** (bottom left): the hovered or clicked field: name, header, size in bits (and octets), offset,
  what it is for, the example value and its octets on the wire, the RFC section; in compare mode the linked
  field. With nothing selected: the compare summary in compare mode, else a hint.
- **Nesting strip** (bottom right): Ethernet ⊃ IP ⊃ TCP/UDP ⊃ data as nested boxes with octet counts, padding and
  FCS, and the frame's total; the minimum and maximum frame totals (64 and 1518) under it.
- **Compare mode**: only the two compared headers, twice as wide; each field marked same, renamed (with the name
  of its partner) or present on one side only; selecting a field marks its partner too.

## Params

| key | type | values | default | notes |
|---|---|---|---|---|
| `compare` | choice | `none`, `ipv4-ipv6`, `tcp-udp` | `none` | |
| `example` | select | `none` and the six example ids below | `none` | `none`: boxes show sizes, not values |
| `sel` | hidden | `''` or `<header>.<field>` | `''` | set by a click; a hover previews it without changing the URL |

## Rules (with sources)

1. **Ethernet** (URM ch07 "Građa Ethernet okvira i MAC adresa"; IEEE 802.3 clause 3): preamble 7 and SFD 1 octet
   are not counted. Destination 6, source 6, length/type 2, data 46…1500, FCS 4. Data shorter than 46 is padded
   to 46. Frame = 6 + 6 + 2 + data + padding + 4: **64…1518** octets. Header 14, trailer 4.
2. **IPv4** (URM ch08 "Građa IP zaglavlja", Primjer 7; RFC 791 §3.1): Version 4, IHL 4, ToS 8, Total Length 16 |
   Identification 16, Flags 3, Fragment Offset 13 | TTL 8, Protocol 8, Header Checksum 16 | Source 32 |
   Destination 32 = 160 bits = **20 octets**; options up to 40 more (IHL 4 bits, at most 15 words = 60 octets).
   IHL counts 32-bit words (`IHL × 4` octets); Total Length counts header + data in octets, so data =
   Total Length − IHL × 4 (5 → 20; 1240 → 1220 data).
3. **IPv6** (RFC 8200 §3; URM ch10): Version 4, Traffic Class 8, Flow Label 20 | Payload Length 16, Next Header 8,
   Hop Limit 8 | Source 128 | Destination 128 = 320 bits = **40 octets, fixed**. No checksum, no IHL, no
   fragmentation fields in the base header; extension headers are chained by Next Header. Payload Length counts
   everything after the 40-octet header (so a packet is 40 + Payload Length).
4. **TCP** (URM ch13 "TCP: uspostava veze", Primjer 5; RFC 9293 §3.1): Source Port 16, Destination Port 16 |
   Sequence Number 32 | Acknowledgment Number 32 | Data Offset 4, Reserved 4, control bits 8 (CWR ECE URG ACK
   PSH RST SYN FIN), Window 16 | Checksum 16, Urgent Pointer 16 = **20 octets**; options up to 40 more. Data Offset
   counts 32-bit words: 5 → 20, 6 → 24 (4 of options), 10 → 40 (20 of options). The eight control bits are one box
   (decision: 1-bit boxes would be 12 px wide); the detail card names the eight.
5. **UDP** (URM ch13 "UDP: transport bez obećanja"; RFC 768): four 16-bit fields, Source Port (optional, 0 when
   unused), Destination Port | Length (header + data, **≥ 8**), Checksum (over a pseudo-header with the IP
   addresses, the UDP header and the data) = **8 octets**.
6. **Network byte order** (all RFCs above; `endianness` in the catalogue): every multi-octet field is sent most
   significant octet first. On the wire, Total Length 1240 = 0x04D8 is `04 D8`; 192.168.1.10 is `C0 A8 01 0A`.
   Shown for fields that are whole octets; fields of 3, 4, 13 or 20 bits share octets with their neighbours and
   show none.

### Sizes per header (state `minOctets`, `maxOctets`)

| header | min | max | note |
|---|---|---|---|
| Ethernet | 18 | 18 | header 14 + FCS 4 around the data; frame 64…1518 (rule 1) |
| IPv4 | 20 | 60 | IHL 5…15 |
| IPv6 | 40 | 40 | base header only |
| TCP | 20 | 60 | Data Offset 5…15 |
| UDP | 8 | 8 | |

### Narrow fields

A field of **4 bits or fewer** in a 32-bit header (IPv4 Version, IHL, Flags; IPv6 Version; TCP Data Offset,
Reserved), and the 1-octet SFD in the Ethernet strip, gets a numbered label (1, 2, 3 … per header) instead of its
name, and the header's key (above its rows) lists number → name.

### Compare (links)

| compare | linked (left ↔ right) | kind | left only | right only |
|---|---|---|---|---|
| `ipv4-ipv6` | Version ↔ Version, Source ↔ Source, Destination ↔ Destination | same | IHL, Identification, Flags, Fragment Offset, Header Checksum, Options ("gone in IPv6") | Flow Label ("new in IPv6") |
| | ToS ↔ Traffic Class, Total Length ↔ Payload Length, TTL ↔ Hop Limit, Protocol ↔ Next Header | renamed | | |
| `tcp-udp` | Source Port ↔ Source Port, Destination Port ↔ Destination Port, Checksum ↔ Checksum | same | Sequence, Acknowledgment, Data Offset, Reserved, control bits, Window, Urgent Pointer, Options ("TCP only") | Length ("UDP only") |

ToS ↔ Traffic Class is added to the task's three (RFC 8200 §7: the Traffic Class field is IPv4's Type of Service
in IPv6); Total Length ↔ Payload Length is "renamed" although the meaning changed too (IPv6 does not count its
own header), which the detail card says.

## Examples (the `example` param; presets set it)

Common values: IPv4 192.168.1.10 → 192.168.2.50 (URM ch08 Primjer 7); IPv6 2001:db8:1::10 → 2001:db8:2::50 (RFC
3849 documentation prefix); MAC source 00-00-5E-00-53-0A, destination 00-00-5E-00-53-01 (RFC 7042 documentation
range; the destination is the gateway's, since 192.168.2.50 is in another network, Primjer 7 (b)); IPv4 ToS 0, DF
set, offset 0, TTL 64; IPv6 Traffic Class 0, Flow Label 0, Hop Limit 64; TCP ports 49152 → 80, window 64240,
urgent 0; UDP ports 49152 → 50000. Chosen values are marked *(chosen)*; the rest come from the sources.

| id | stack | transport | app data | IP packet | padding | frame | IPv4 ID | checksum | sources |
|---|---|---|---|---|---|---|---|---|---|
| `book-ipv4` | IPv4 | TCP 20, ACK PSH | 1200 *(derived)* | 1240 (IHL 5 → 20 + 1220) | 0 | 1258 | 0x2a10 | 0x8783 | Primjer 7 |
| `book-tcp-offset` | IPv4 | TCP 24 (offset 6, options 4), SYN | 0 | 44 | 2 | 64 | 0x2a11 | 0x8c2e | ch13 Primjer 5; SYN from the capture figure |
| `min-frame` | IPv4 | TCP 20, ACK | 0 | 40 | 6 | 64 | 0x2a12 | 0x8c31 | ch07; a bare ACK *(chosen)* |
| `max-frame` | IPv4 | UDP 8 (length 1480) | 1472 *(derived)* | 1500 | 0 | 1518 | 0x2a13 | 0x8671 | ch07 |
| `ipv4-vs-ipv6` | IPv4 and IPv6 (compare) | TCP 20, ACK PSH | 1200 | IPv4 1240 (Total Length 1240), IPv6 1260 (Payload Length 1220) | 0 | 1258 (IPv4) | 0x2a14 | 0x877f | RFC 8200 §3 |
| `overhead` | IPv4 | TCP 20, ACK PSH | 1460 | 1500 | 0 | 1518 | 0x2a15 | 0x867a | task (derived) |

- Frame = 14 + IP packet + padding + 4; padding = max(0, 46 − IP packet). Ethernet type 0x0800 for IPv4, 0x86DD for
  IPv6; IPv4 Protocol / IPv6 Next Header 6 for TCP, 17 for UDP.
- The IPv4 header checksum is computed (RFC 1071 one's complement) over the 20 octets with the checksum at 0;
  `book-ipv4` gives 0x8783, the same packet and value as `sims/ipv4-header`. The TCP and UDP checksums and the FCS
  cover the data, which the poster does not have: their example value is shown as "computed over …", no number.
- TCP sequence and acknowledgment numbers *(chosen)*: SYN seq 1000, ack 0; the others seq 1001, ack 5001.
- `overhead`: 1460 of 1518 octets are data, 58 are headers and trailer (14 + 20 + 20 + 4): 96.2 % and 3.8 %. The 8
  octets of preamble and SFD are outside the 1518.
- In `ipv4-vs-ipv6` the IPv6 packet carries the same TCP segment (1220 octets), so Payload Length 1220 = IPv4's
  Total Length 1240 − 20: the renamed field no longer counts the header.

### Which headers an example uses

An example's stack (its IP and its transport) is "in use"; the other IP and the other transport are drawn dimmed
(dashed, muted) and show sizes, not values. With `example: none` nothing is dimmed and every box shows its size.

### The nesting strip

- With an example: its stack and numbers: Ethernet header 14 ⊃ IP header ⊃ transport header ⊃ data, padding (if
  any), FCS 4; the segment/datagram, packet and frame totals.
- Without: the stack follows the selected field (IPv6 if it is in IPv6, UDP if in UDP; else IPv4 and TCP), with
  data as a range: 0 … 1500 − IP − transport (IPv4/TCP 0…1460, IPv4/UDP 0…1472, IPv6/TCP 0…1440, IPv6/UDP 0…1452)
  and the frame from 14 + max(46, IP + transport) + 4 (IPv4/TCP 64, IPv4/UDP 64, IPv6/TCP 78, IPv6/UDP 66) to
  1518.
- Always: the minimum frame 64 and the maximum 1518.

## Presets (keys 1–6)

| # | id | params | selected | caption (en) |
|---|---|---|---|---|
| 1 | `book-ipv4` | example `book-ipv4` | `ipv4.ihl` | the task's caption: IHL = 5 … 1220 are data |
| 2 | `book-tcp-offset` | example `book-tcp-offset` | `tcp.offset` | Data Offset 6 → 24 octets, 4 of options; the book's capture reads 10 → 40, 20 of options |
| 3 | `min-frame` | example `min-frame` | `eth.data` | 40-octet packet padded with 6: 6 + 6 + 2 + 46 + 4 = 64 |
| 4 | `max-frame` | example `max-frame` | `eth.data` | 6 + 6 + 2 + 1500 + 4 = 1518 |
| 5 | `ipv4-vs-ipv6` | example `ipv4-vs-ipv6`, compare `ipv4-ipv6` | `ipv4.ttl` | 20 vs 40; checksum and fragmentation gone; three renamed |
| 6 | `overhead` | example `overhead` | none | 14 + 20 + 20 + 1460 + 4 = 1518; 96.2 % data |

## Caption precedence

1. A selected field that is not the example's own focus field → "<header> · <field>: <size in bits>" (octets in the
   Ethernet strip, the range for a variable part).
2. The example's caption (presets 1–6).
3. The compare caption (compare on, no example).
4. The default caption.

## Tie-breaks and edge cases

- An unknown `compare`, `example` or `sel` (also `constructor`, `__proto__`, `''`) is `none`, `none`, no
  selection.
- A selected field outside the compared pair (compare on) stays selected: the detail card shows it, the poster
  does not draw it, no partner is marked.
- In compare mode only the selected field and its partner are marked "changed"; with no partner only the field.
- Hover beats the clicked selection for the detail card and the marks while the pointer is on a field; leaving
  the poster restores the clicked one. A click on the selected field clears it.
- Example `ipv4-vs-ipv6` without compare: values are shown in both IP headers (both in use); the nesting strip uses
  IPv4.
- Field and header order is the order on the wire (RFC diagrams), so every list (keys, the only-on-one-side lists)
  is in that order; the compare links follow the left header's order (in IPv6 Next Header comes before Hop Limit,
  in IPv4 TTL before Protocol).

## Legend

Header colour + name in the box (numbered when narrow, with a key); bit ruler; hatched = variable length; dashed =
not counted (preamble, SFD) or not in use; "changed" (yellow + ink outline) = selected field and its partner;
compare marks: "=" same, "↔" renamed, "✕" one side only.

## Out of scope

VLAN tags, tunnels and overlays (`l2l3-protocols`), IPv4 option kinds, TCP option kinds, IPv6 extension header
types, how the checksums and the FCS are computed beyond the IPv4 header checksum value.
