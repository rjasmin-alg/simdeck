<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# protocol-headers: notes

Task `docs/tasks/w3/protocol-headers.md` (catalogue `ref-protocol-headers`, §4.11). Rules, data and expected
numbers: `SPEC.md`.

## What it is

A reference poster (class `reference`, no steps). On top the Ethernet frame as an octet strip (preamble and SFD
dashed, "not counted"; data hatched, 46…1500; octet offsets under it). In the middle IPv4, IPv6, TCP and UDP as
32-bit rows to one scale, each with its bit ruler, a key for the numbered narrow fields, and its size. Hovering or
clicking a field opens its card (size, position, what it is for, the example value and its octets on the wire, the
RFC section, its pair in compare mode). At the bottom one line of nested boxes: frame ⊃ Ethernet header, packet ⊃
IP header, segment/datagram ⊃ transport header, data, padding, FCS, with octet counts, and the 64/1518 totals.
Compare (IPv4 vs IPv6, TCP vs UDP) shows the two headers twice as wide with = / ↔ / ✕ marks. Six presets fill one
packet's values in.

## Decisions

- **The card sits in the free rows under the shortest header** (UDP normally, IPv4 or UDP in compare mode), not
  in a bottom row. A bottom row for the card and the nesting strip left the 32-bit rows 36 px high, too low for a
  name and a value at 16 px; with the card moved and the nesting strip on one line, rows are about 50 px and no box
  clips in any preset in either language (measured: scrollHeight vs clientHeight of every box).
- **The nesting strip is one line at the bottom** (the task's "nesting strip at the bottom"), with the minimum and
  maximum frame at its right.
- **The Ethernet strip is to scale for the fixed fields only**; the data block has a fixed width with its range or
  value written in it (1500 octets to scale would leave the 6-octet fields unreadable). Its title sits under the
  preamble, in the offsets row, to save a line.
- **TCP's eight control bits are one 8-bit box** ("flags"), not eight 1-bit boxes (12 px each); the card names the
  eight, and the example shows the set ones (SYN, ACK, ACK PSH). Recorded in SPEC rule 4.
- **Narrow fields** (≤ 4 bits; the SFD in the strip) get a numbered disc and the header's key line; their value,
  when there is one, still shows under the number.
- **ToS ↔ Traffic Class** added to the task's three links (RFC 8200 §7). Same-name fields (Version, addresses,
  ports, checksum) are linked as "same". Compare links follow the left header's order.
- **Hover is a preview, a click selects**: hover re-renders from the params plus the hovered field and never
  touches the URL; a click sets the hidden `sel` param (kept in the URL, keeps the active preset so `R` returns to
  it); a second click clears it. Same hidden-param pattern and `.sd-ctl[hidden]` workaround as `http-status-codes`.
- **Values vs sizes**: with no example every box shows its size; with an example the headers it uses show values
  and the others are dimmed (dashed, muted, "not in this example").
- **Checksums**: the IPv4 header checksum is computed (0x8783 for the book's packet, the same as `ipv4-header`);
  TCP/UDP checksums and the FCS cover data the poster does not have, so they show "…" and say what they are
  computed over. The checksum helper is copied from `sims/ipv4-header/sim.js @ 269e90b` (marked in the code).
- **Example values chosen** (marked *(chosen)* in SPEC.md): RFC 7042 documentation MACs, RFC 3849 IPv6 prefix,
  ports 49152 → 80 / 50000, IPv4 IDs 0x2a10…0x2a15, TTL/Hop Limit 64, window 64240, sequence numbers 1000/1001/5001.
  The destination MAC is the gateway's, since 192.168.2.50 is off-net (Primjer 7 (b)) — shown as a value only, the
  page does not say so, so the book's question (b) is not answered on the page.
- **`max-frame` uses UDP** (20 + 8 + 1472) and `overhead` TCP (20 + 20 + 1460), so the two 1518-octet presets
  differ and all five headers appear across the presets.
- **`min-frame` is a bare ACK** (40 octets → 6 of padding), the common case behind the "frames can be any size"
  misconception; `book-tcp-offset` (a SYN with 4 octets of options, 44 octets) is padded too, with 2.
- **The explanation links `l2l3-protocols` by name** for VLAN tags, tunnels and the deep dive (task's coordinator
  note: keep both).

## Deviations from the task

- Six presets, not five: the task's item 3 is two presets (`min-frame`, `max-frame`).
- The card is not at the bottom (see Decisions); the nesting strip is.
- `book-tcp-offset` shows Data Offset 6; the capture figure's 10 (40 octets, 20 of options) is in the caption only,
  since the options row is drawn as one row standing for 0–40 octets.

## Numbers

Checked with a script before coding (frames 1258/64/64/1518/1258/1518, padding 0/2/6/0/0/0, IPv4 checksums
0x8783, 0x8c2e, 0x8c31, 0x8671, 0x877f, 0x867a; nesting ranges per stack). All are tests in `sim.test.js`.
18 deliberate breakages of the rules and tie-breaks (padding, FCS size, preamble counted, IHL words, field widths,
IPv6 payload length, an IPv6 checksum field, TCP offset, flag order, UDP length, byte order, unaligned wire bytes,
compare partner, own-key lookup, nesting stack, narrow rule, in-use, checksum) each made the suite fail.

## Fresh review

A fresh reviewer read the diff against SPEC.md, recomputed every number independently (all match), checked every
field against the RFCs (no errors) and tried 33 further mutations. Fixed from the review: tests for the nesting
ranges without an example (padding, packet, segment), for whole-octet fields that do not start on an octet boundary
(IPv6 Traffic Class, Flow Label: no wire octets), for every example value SPEC.md states, and for `ipv4Data(5, 20)`;
hover now clears when the pointer moves onto a non-field part of the stage, a click that clears the selection clears
the hover preview too, and `aria-pressed` follows the clicked field, not the preview; Croatian wording (128 bitova,
"se ne koristi", "nadopunjene", "od toga 20 okteta opcija", preset "Udio podataka"); the data field's description
now says the data is the packet padded to 46; length/type "up to 1500 is a length"; the field caption is
"<header> · <field>: <size>" (no double brackets). Left as is: IPv6 in the frame (0x86DD) and IPv6 with UDP are
reachable only without values (no example uses them), so those value branches have no test.

## Sources

- URM ch07 "Građa Ethernet okvira i MAC adrese"; ch08 "Građa IP zaglavlja", Primjer 7; ch10 (IPv6); ch13 "UDP:
  transport bez obećanja", "TCP: uspostava veze i trostruko rukovanje", Primjer 5 and the capture figure
  (`fig:tcp-zaglavlje-analizator`).
- RFC 791 §3.1, RFC 8200 §3 and §7, RFC 9293 §3.1, RFC 768, RFC 1071; IEEE 802.3 clause 3 (length/type ≥ 1536 is a
  type *(check exact subclause)*); RFC 7042 (documentation MACs), RFC 3849 (documentation IPv6 prefix).
- Field descriptions for IPv4 adapted from `sims/ipv4-header/strings.js`.

## Unchecked

- RFC section for the Ethernet frame shown as "IEEE 802.3 §3.1.1" on the card *(check)*.
- UDP checksum "required in IPv6" (RFC 8200 §8.1; RFC 6935/6936 allow exceptions for tunnels) — kept short on the
  card *(check wording)*.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| preamble | preambula | URM ch07 |
| start frame delimiter (SFD) | graničnik početka okvira | URM ch07 |
| frame check sequence (FCS) | provjera ispravnosti okvira | URM ch07 |
| padding | nadopuna | URM ch07 ("okvir se nadopunjuje") |
| octet | oktet | URM ch07, ch08 |
| packet | paket | URM ch04 |
| segment | segment | URM ch04, ch13 |
| datagram | datagram | URM ch13 |
| checksum | kontrolni zbroj | URM ch08, ch13 |
| Internet Header Length (IHL) | duljina zaglavlja | URM ch08 |
| Time to Live (TTL) | vrijeme života | URM ch08 |
| Data Offset | pomak podataka | URM ch13 Primjer 5 |
| Traffic Class | klasa prometa | simdeck |
| Flow Label | oznaka toka | simdeck |
| Payload Length | duljina sadržaja | simdeck |
| Next Header | sljedeće zaglavlje | simdeck |
| Hop Limit | granica skokova | simdeck |
| network byte order | mrežni redoslijed okteta | simdeck |

`header`, `frame` and `trailer` come from the glossary (`[[header]]`, `[[frame]]`, `[[trailer]]` in the explanation).

## Shared requests

- Same as `ipv4-header` and `http-status-codes`: `.sd-ctl[hidden]` loses to kit.css's `.sd-ctl { display: flex }`;
  the page works around it locally.

## Time

Start 02:21, done 02:50 (about 30 minutes, including the fresh review); one session.
