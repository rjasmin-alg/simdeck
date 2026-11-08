<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ethernet-frame: specification

One concept: **the fields of an Ethernet frame, its minimum size, the padding that reaches it, and the FCS** (task
`docs/tasks/w3/ethernet-frame.md`, catalogue `net-ethernet-frame`, §4.1). An explorer: the student edits the data
length, the type and the destination, and sees the pad, the frame length and the FCS change; one button flips a bit
in transit and the receiver's FCS no longer matches.

## Scene

- **Length meter** on top: a linear bar from 0 to 1618 octets (the largest frame the slider makes) with the frame length filled in (header, data, pad,
  FCS) and two marks, **64** (minimum) and **1518** (maximum). Beside it the frame length and the length on the wire
  (with preamble and SFD).
- **Field strip** in the middle: one block per field, left to right: preamble 7 and SFD 1 (muted, dotted, "not
  counted"), destination 6, source 6, length/type 2, data, pad (only when there is one), FCS 4. Widths are
  proportional to the octets with a minimum width per block, so the 2-octet type and the 4-octet FCS stay readable.
  Each block shows its name, its size and its value: the MAC addresses, the type in hex with its name, the FCS in
  hex. The destination carries a tag: unicast, multicast or broadcast (rule 9). Above the blocks the running octet
  count at each field boundary (0, 6, 12, 14, …, frame length), counted from the destination (rule 2); one bracket
  over destination to FCS names the counted frame.
- **FCS panel** at the bottom: sender's CRC-32 over destination through pad, what happened on the wire (nothing,
  or bit k flipped in field F), the receiver's recomputed CRC-32, and the verdict: accepted, or dropped without
  notice. For data over 1500 octets the panel says the frame is refused and the network layer must send smaller
  packets.
- "Changed" (highlight) marks the fields whose size or value changed on the last edit, and the FCS panel when the
  check changed.

## State

`derive(params)` → `{ dst, dstKind, src, srcKind, type, typeHex, typeKind, payloadLen, padLen, frameLen, wireLen,
fields, coveredBits, flipBit, flipField, fcsSent, fcsRecv, verdict }`

- `dst`, `src`: MAC addresses as text (`AC-DE-48-23-45-67`); `dstKind`, `srcKind`: `'unicast' | 'multicast' |
  'broadcast'`.
- `type`: the length/type value (number), `typeHex` (`0x0800`), `typeKind`: `'type' | 'length' | 'undefined'`.
- `payloadLen`, `padLen`, `frameLen` (destination to FCS), `wireLen` (frame + 8).
- `fields`: the counted fields `[{ id, bytes, from }]`, ids `dst, src, type, data, pad, fcs`, `from` the octet
  offset from the destination. The pad is listed with 0 octets when there is none.
- `coveredBits`: bits covered by the FCS (destination through pad).
- `flipBit`: the flipped bit (0 = most significant bit of the first destination octet) or `null`; `flipField`: the
  field it lies in.
- `fcsSent`, `fcsRecv`: CRC-32 as `0x` and 8 hex digits, or `null` when the frame is refused.
- `verdict`: `'ok' | 'too-long' | 'fcs-error'`.

Deviation from the task's state: `payloadBytes` is not kept in the state (1500 numbers per render); the data's content
is a fixed function of its length (`payloadBytes(n)`: octet i = (29·i + 7) mod 256), so the FCS depends only on the
params. The state carries the derived fields the page draws instead.

## Rules

1. **Field order and sizes:** preamble 7, SFD 1, destination 6, source 6, length/type 2, data 46–1500, FCS 4.
   URM `07-podatkovni-sloj.md` "Građa Ethernet okvira i MAC adresa", footnote ieee-frame-format (IEEE 802.3
   Figure 3-1).
2. **Frame length** is counted from the destination address to the FCS; the preamble and SFD (8 octets) are not
   counted. On the wire: frame length + 8. Same section.
3. **Limits:** minimum 64 = 6 + 6 + 2 + 46 + 4; maximum 1518 = 6 + 6 + 2 + 1500 + 4. Same section, footnote
   ieee-frame-sizes ("Minimum basic (untagged) MAC frame size: 64 octets", "Maximum …: 1518 octets").
4. **Padding:** pad = max(0, 46 − data), zero octets after the data, so every frame is at least 64 octets.
   Tie-break: data = 46 gives no pad; data = 45 gives 1. Same section ("okvir se nadopunjuje"); IEEE 802.3 §3.2.8
   *(check clause number)*.
5. **Data over 1500 octets** is not a valid basic frame: the page refuses it (verdict `too-long`, no FCS, no bit
   flip) and says the network layer must send smaller packets (`fragmentation-pmtud`). Tie-break: 1500 is valid,
   1501 is refused. Jumbo frames are a vendor extension, not 802.3 (ch07 "Okviri veći od 1500 okteta", footnote
   ieee-jumbo). The slider goes to 1600 so the refusal can be reached.
6. **Length/type:** a value ≥ 0x0600 (1536) is an EtherType; a value ≤ 1500 is a length. Tie-breaks: 1500 →
   length, 1536 → type, 1501–1535 → neither (`'undefined'`; the task does not say, IEEE 802.3 leaves the range
   undefined *(check)*). EtherTypes on the page: 0x0800 IPv4, 0x0806 ARP, 0x86DD IPv6. IEEE 802.3 §3.2.6
   *(check clause number)*; EtherType values from the IEEE registry *(check)*. The page only offers EtherTypes; the
   rule is shown as the tag "≥ 0x0600 → type" and tested in the model.
7. **FCS** = CRC-32 over destination through pad, computed by the sender and recomputed by the receiver; a mismatch
   means the frame is discarded silently, nothing goes back to the sender. Standard reflected CRC-32 (polynomial
   0xEDB88320 reflected, initial and final XOR 0xFFFFFFFF, as zlib); test vector "123456789" → 0xCBF43926. ch07
   FCS bullet (the receiver checks the frame); the silent discard is not in ch07: IEEE 802.3 §3.2.9 and the MAC
   receive procedure *(check clause numbers)*. The page shows the CRC-32 value, not the bit order in
   which the FCS goes on the wire (out of scope, `crc`).
8. **Below 64 octets:** the receiver treats a shorter frame as a collision fragment and drops it (ch07, footnote
   emory-slottime). The page cannot produce one (rule 4 always pads); the explanation says why the floor exists.
9. **Destination tag:** all ones (FF-FF-FF-FF-FF-FF) is broadcast; else the I/G bit (lowest bit of the first
   octet) 1 is multicast, 0 unicast. Tie-break: broadcast is checked first (it also has I/G = 1). ch07 same
   section and Primjer 1 (01-00-5E-00-00-01 is multicast).
10. **Bit flip (page rule):** the flipped bit is an index into the covered bits (destination through pad), bit 0
    the most significant bit of the first destination octet. An index past the end (after the data shrinks) takes
    the last covered bit. The flip stays until "clear the error" or a preset without it. The sent FCS never
    changes with the flip; only the recomputed one does.

## Expected numbers (checked with an independent Python script, zlib.crc32, before coding)

| Preset | Params | Pad | Frame | On the wire | FCS sent | FCS recomputed | Verdict |
|---|---|---|---|---|---|---|---|
| `arp-request` | 28 B, ARP, broadcast | 18 | 64 | 72 | 0x32FC7B2F | 0x32FC7B2F | ok |
| `exact-minimum` | 46 B, IPv4, unicast | 0 | 64 | 72 | 0xC18171E0 | 0xC18171E0 | ok |
| `tcp-ack` | 40 B, IPv4, unicast | 6 | 64 | 72 | 0x2DD9DBEF | 0x2DD9DBEF | ok |
| `full-frame` | 1500 B, IPv4, unicast | 0 | 1518 | 1526 | 0x3134C01E | 0x3134C01E | ok |
| `bit-flip` | 1500 B, flip bit 8000 (octet 1000, in the data) | 0 | 1518 | 1526 | 0x3134C01E | 0xC65EAE2E | fcs-error |
| `too-big` | 1501 B | — | (1519) | — | — | — | too-long |

Also: 0 B of data → pad 46, frame 64, FCS 0xD54BFF0D. CRC-32("123456789") = 0xCBF43926.

Sizes: ARP request for IPv4 over Ethernet is 28 octets (RFC 826: 8 octets of fixed fields + 2·6 + 2·4)
*(check)*; IPv4 + TCP with no data and no options is 20 + 20 = 40 octets.

## Params

- `payload`: range 0–1600, step 1 (default 28). Data length in octets.
- `type`: choice IPv4 / ARP / IPv6 (default IPv4).
- `dst`: choice unicast AC-DE-48-23-45-67 / broadcast FF-FF-FF-FF-FF-FF / multicast 01-00-5E-00-00-01 (default
  unicast).
- `flip`: −1 (none) or the flipped bit; a hidden range (so the URL keeps it), set by the button "flip one bit in
  transit" (a seeded random covered bit) and cleared by "clear the error" (it also clears a flip kept under a
  refused frame). Kit buttons cannot be disabled, so a refused press (flip on a refused frame, clear with no flip
  set) changes nothing and adds the reason to the caption until the next change.
- Source fixed: AC-DE-48-00-00-80.

## Presets

Six, keys 1–6, in the table above.

## Out of scope

The 802.1Q tag and 1522 octets (`vlan-trunk`), how CRC is computed step by step (`crc-error-detection`), collision
handling (`csma-cd`), interframe gap, line coding, the U/L bit, the OUI, the bit order on the wire.
