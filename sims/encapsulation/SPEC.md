<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# encapsulation: specification

One concept: **each layer adds its header going down and strips it coming up** (task
`docs/tasks/w2/encapsulation.md`, catalogue `net-encapsulation`, §4.1 and §5.9). The student steps a message down
the sender's stack, onto the wire, and up the receiver's stack.

## Scene

- Two protocol stacks side by side: **sender** (a computer, left) and **receiver** (a web server, right), four
  TCP/IP layers each, top to bottom: application, transport, network, link. With the tunnel on, a **tunnel** slot
  (GRE + outer IPv4) sits between network and link in both stacks. The physical medium is a strip under the two
  stacks joining them.
- The layer acting in this step is outlined ("changed"); the path the unit has taken is marked on the stacks.
- Under the stacks, one large **PDU strip**: the unit as it is now, blocks left to right as they lie in the unit
  (outermost header on the left, Ethernet FCS trailer on the right). Each block shows its protocol and, with
  `showSizes`, its size in octets. Above the strip one bracket per unit nested in it (frame, packet, segment or
  datagram, data), each with its name and length; the outermost one is the unit's name. On the wire step the
  preamble and SFD (8 B) stand in front of the frame, marked "not counted".

## State

`{ phase, layer, side, action, pdu, added, removed }`

- `phase`: `'start' | 'down' | 'wire' | 'up' | 'done'`.
- `layer`: the layer that acted in this step (`'application' | 'transport' | 'network' | 'tunnel' | 'link' |
  'physical'`, or `null` at the start).
- `side`: `'sender' | 'receiver' | null`.
- `action`: `'start' | 'create' | 'add' | 'wire' | 'strip' | 'deliver'`.
- `pdu`: the blocks left to right, each `{ kind, layer, bytes }`; `kind` is one of `eth`, `oip`, `gre`, `ip`, `tcp`,
  `udp`, `data`, `pad`, `fcs`. Everything is derived from the params.
- `added` / `removed`: the kinds this step added or removed (outside-in order).

The task's state shape lists `label` in each block; the label is language (or the protocol's name), so the page
derives it from `kind`.

## One step

Going down, one layer adds its header (the link layer also its trailer, and padding when needed); one step puts the
frame on the wire; going up, one layer checks and strips its own blocks and hands the rest up. Order inside a step,
as drawn: highlight the layer → add/remove the block(s) → rename the unit → caption.

| n | presets 1–4 | `gre-tunnel` |
|---|---|---|
| 0 | start: nothing sent yet | start |
| 1 | sender application creates the data | same |
| 2 | sender transport adds TCP/UDP header | same |
| 3 | sender network adds IPv4 header | same |
| 4 | sender link adds Ethernet header + FCS (+ padding) | sender tunnel adds GRE + outer IPv4 |
| 5 | wire (preamble + SFD shown, not counted) | sender link adds Ethernet header + FCS |
| 6 | receiver link checks FCS, strips header, FCS, padding | wire |
| 7 | receiver network strips IPv4 | receiver link strips |
| 8 | receiver transport strips TCP/UDP | receiver tunnel strips outer IPv4 + GRE |
| 9 | receiver application reads the data (done) | receiver network strips IPv4 |
| 10 | | receiver transport strips TCP |
| 11 | | receiver application reads the data (done) |

**Steps: 9 without the tunnel, 11 with it** (`sim.json` `steps`: 9, the default). The task counts "1 start + 4 down
+ 1 wire + 4 up = 10" and "12 for `gre-tunnel`": those are positions on the scrubber including step 0 (the start);
the kit counts transitions, so 10 positions are 9 steps (NOTES.md, deviations).

## Rules

1. **Prepend, never look inside.** Going down, each layer puts its header in front of the PDU it received from the
   layer above; the blocks already there stay unchanged, in the same order. (URM `04-slojeviti-modeli.md`
   "Enkapsulacija, dekapsulacija i imena podatkovnih jedinica"; RFC 1983 "Encapsulation": "a layer adds header
   information to the protocol data unit (PDU) from the layer above".)
2. **Order of adding:** application data → transport → network → (tunnel) → link. So the link header is outermost
   and the data innermost; reading the finished frame outside-in (the RFC's listing) is the reverse of the adding
   order. (URM ch04 Primjer 2; the book's figure `ch04-enkapsulacija-dekapsulacija.svg`.)
3. **Ethernet adds a header and a trailer:** 14 B header in front (destination 6 + source 6 + length/type 2) and the
   4 B FCS behind. (URM ch04 same section; `07-podatkovni-sloj.md` "Građa Ethernet okvira i MAC adresa".)
4. **Sizes:** TCP header 20 B without options (URM ch13 "Zaglavlje TCP-a", Data Offset = 5); UDP 8 B (RFC 768);
   IPv4 20 B without options (URM ch08, IHL = 5); Ethernet 14 + 4 B (URM ch07); GRE 4 B without options (RFC 2784
   §2.1, C = 0). Preamble + SFD = 7 + 1 = 8 B, drawn on the wire step and **not counted** in the frame length
   (URM ch07).
5. **Padding (edge case and tie-break):** if what the link layer receives is shorter than 46 B, it adds padding
   behind it, before the FCS, so that the frame is 64 B. Exactly 46 B gets no padding (6 + 6 + 2 + 46 + 4 = 64).
   Padding = max(0, 46 − packet). (URM ch07: 46–1500 B payload, 64 B minimum.)
6. **Names:** data → segment (TCP) or datagram (UDP) → packet → frame. A unit is named after its outermost header:
   `tcp` segment, `udp` datagram, `ip`/`oip` packet, `eth` frame, nothing but data: data. (URM ch04 same section;
   Primjer 4: the names are a teaching convention, not a strict rule.)
7. **Going up, strip only your own, outermost first:** each receiving layer removes exactly the outermost block(s)
   it owns, in the reverse order of adding, and hands the rest up unchanged, until only the original data is left.
   The link layer checks the FCS, then removes its header, the FCS and the padding. (URM ch04 "Dekapsulacija";
   Primjer 2, last sentence.)
8. **Tunnel (`gre-tunnel`):** the tunnel layer treats the whole IPv4 packet as its payload: it prepends the GRE
   header (4 B) and an outer IPv4 header (20 B), adding and removing both in one step each way; the inner packet is
   not changed. A tunnel is one more envelope. (RFC 2784 §2; catalogue §5.9.)
9. **Payload range:** 0–1460 B in steps of 10; with the tunnel on, at most 1430 B so that the outer packet stays
   within 1500 B (1430 + 20 + 20 + 24 = 1494). Fragmentation is out of scope.
10. **The wire changes nothing:** the wire step adds no block to the frame; the preamble and SFD are shown in front
    of it and counted only in "on the wire" (frame + 8).

## Expected numbers (checked with an independent script before coding)

| Preset | params | data | segment / datagram | packet | padding | frame | on the wire | steps |
|---|---|---|---|---|---|---|---|---|
| `http-get` | tcp, 300 | 300 | segment 320 | 340 | 0 | 358 | 366 | 9 |
| `dns-udp` | udp, 40 | 40 | datagram 48 | 68 | 0 | 86 | 94 | 9 |
| `pure-ack` | tcp, 0 | 0 | segment 20 | 40 | 6 | 64 | 72 | 9 |
| `full-frame` | tcp, 1460 | 1460 | segment 1480 | 1500 | 0 | 1518 | 1526 | 9 |
| `gre-tunnel` | tcp, 300, tunnel | 300 | segment 320 | 340 inner, 364 outer | 0 | 382 | 390 | 11 |

Other checks: udp 0 → datagram 8, packet 28, padding 18, frame 64; tcp 0 with the tunnel → outer packet 64, no
padding, frame 82; a 46 B packet (udp 18, called on the function) → no padding, frame 64; a 45 B packet → 1 B
padding, frame 64; udp 1460 → 1506; tunnel 1430 → outer 1494, frame 1512.

## Params

- `proto`: choice `tcp` | `udp` (default `tcp`).
- `payload`: range 0–1460 (1430 with the tunnel), step 10 (default 300).
- `tunnel`: toggle (default off). Not in the task's params list; needed so the `gre-tunnel` preset is a param set
  like the others (NOTES.md).
- `showSizes`: toggle, sizes in the blocks and brackets (default on). View only.

## Presets

1. `http-get` — HTTP GET over TCP, 300 B (URM ch03 path; byte count derived).
2. `dns-udp` — DNS query over UDP, 40 B (derived, unchecked).
3. `pure-ack` — TCP ACK with no data (padding, rule 5).
4. `full-frame` — 1460 B over TCP: the 1500 B Ethernet maximum payload, frame 1518 B.
5. `gre-tunnel` — the `http-get` packet wrapped in GRE + outer IPv4 (rule 8).

## Out of scope

What switches and routers read and rewrite on the way (`net-hop-rewrite`); header field contents; IPv6;
fragmentation; physical-layer coding; FCS errors (the FCS check always passes).
