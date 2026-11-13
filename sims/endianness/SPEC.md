<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# endianness: spec

One concept: **byte order in memory and on the wire**. The student writes a value and reads it as bytes: in a
big-endian and a little-endian memory strip, on the wire, and as the integer a program gets back.

Task: `docs/tasks/w3/endianness.md`; catalogue `arh-endianness` (§4.9). Class: explorer (no steps).

## Scene

1. **Value box**: the written value in hex and decimal (and, for 32 bits, as four dotted decimal octets), its width,
   and a stage field where hex digits are typed (at most 8; the select then shows "typed").
2. **Two memory strips**, "big-endian" and "little-endian": byte cells at 0x1000, 0x1001 (, 0x1002, 0x1003), each
   cell labelled with its address; the most significant byte has a bold border and an "MSB" tag, the least an
   "LSB" tag. The strip of the host's own order carries a "this host" badge.
3. **On the wire**: the bytes in transmission order, first byte left, numbered 1., 2., … with an arrow.
4. **Reader**: what a program on the host gets when it loads the received bytes (the wire bytes at 0x1000…) as a
   host integer, with `ntohl`/`ntohs` (convert on) or as a raw load (convert off). The result's bytes are shown
   most significant first, each in the colour of the byte it came from, then hex, decimal and dotted; the other
   setting's result is shown below it, smaller.

A byte's colour follows the byte across every row: the written value's most significant byte is `--c1`, the least
significant `--c4` (32 bits: `--c1 --c2 --c3 --c4`; 16 bits: `--c1 --c4`), and every cell also prints its hex, so
colour is never alone. Text bytes take `--c5 … --c8` by position and print their character.

## State (derived from params)

`{ width, value, full, cut, text, bytesBE, bytesLE, wire, hostOrder, hostBytes, sigBE, sigLE, sigWire,
readAs: { withConversion, withoutConversion }, convert, read, readBytes, sigRead, differs, fn, dotted, dottedRead,
dottedOther }`. `sig*` give each cell's significance in the written value (0 = MSB) so the page can colour it.

## Rules

1. **Store order.** Big-endian stores the most significant byte at the lowest address; little-endian stores the
   least significant byte there (Cohen, IEN 137, 1980; Intel SDM Vol. 1 §1.3.1: IA-32 / Intel 64 are
   little-endian). `bytesBE[0]` is the MSB, `bytesLE[0]` the LSB, and `bytesLE` is `bytesBE` reversed.
2. **Network byte order is big-endian.** Internet protocol headers send multi-byte fields most significant byte
   first (RFC 1700 "Data Notations"; RFC 791 Appendix B). `wire` equals `bytesBE` for every host.
3. **Conversion.** The sender converts with `htonl`/`htons`, the receiver with `ntohl`/`ntohs`; on a big-endian
   host they return their argument unchanged, on a little-endian host they swap the bytes (POSIX `arpa/inet.h`;
   that they are no-ops on a big-endian host is how every implementation behaves, the standard only says "convert
   between host and network byte order" *(check)*). `hton(v) = ntoh(v)`, and `ntoh(ntoh(v)) = v`.
   With convert on, the reader gets the written value back on either host.
4. **Raw load.** A program that loads the wire bytes as a host integer without `ntohl` gets them in host order:
   on a big-endian host the written value, on a little-endian host the value with its **bytes** reversed (the bits
   inside each byte are unchanged).
5. **Bytes have no order.** Single bytes and byte strings (ASCII text) are stored and sent one byte after another
   at increasing addresses; every row shows the same bytes and no conversion applies (convert is disabled with
   its reason). Only multi-byte integers have a byte order.

### Tie-breaks and edge cases

- **A palindrome value** (e.g. 0x0000 or 0xABAB at 16 bits, 0x00000000): big- and little-endian strips are equal
  and the raw load equals the converted one, so `differs` is false and "Changed" never marks the reader row.
- **Width cut.** A value wider than the width keeps its low bytes: `value = full mod 2^width`, `cut = true`, and the
  value box says so (e.g. 0xAC10051E at 16 bits is 0x051E). A narrower value is padded with zero bytes at the
  top (443 at 32 bits is 0x000001BB: wire 00 00 01 BB, little-endian BB 01 00 00).
- **Typed digits.** The stage field keeps hex digits only (a leading `0x` and any other character are dropped), at
  most 8, upper case; an empty field is 0.
- **"Changed"** marks the reader row only when the last input flipped the convert toggle alone and the value read
  changed with it (so never on a big-endian host, never for text, never for a palindrome).
- **MSB/LSB tags** are only on numeric values (text has no significance). In the reader row the bold border stays
  on the original MSB, wherever it lands.

## Presets and expected numbers

Checked with a script (Python `struct`, 2026-11-13), and asserted in `sim.test.js`.

| # | id | params | expected |
|---|---|---|---|
| 1 | `ipv4-address` | 32, ipv4, little, convert off | 172.16.5.30 = 0xAC10051E = 2 886 731 038 (URM ch08 Primjer 1). BE and wire AC 10 05 1E; LE 1E 05 10 AC. Raw load 0x1E0510AC = 503 648 428 = 30.5.16.172 |
| 2 | `port-443` | 16, port443, little, convert off | 443 = 0x01BB; wire 01 BB; LE BB 01; raw 0xBB01 = 47 873 |
| 3 | `textbook` | 32, textbook, little, convert on | 0x0A0B0C0D = 168 496 141; BE 0A 0B 0C 0D; LE 0D 0C 0B 0A; raw would be 0x0D0C0B0A = 218 893 066; reads 0x0A0B0C0D |
| 4 | `text` | 32, http, little | "HTTP" = 48 54 54 50 in BE, LE, wire and reader |
| 5 | `big-host` | 32, ipv4, big, convert on | memory = wire = AC 10 05 1E; `ntohl` a no-op: reads 0xAC10051E with and without it |

Default params: width 32, value ipv4, host little, convert on (reads 172.16.5.30; turning convert off is the
demo's moment).

## Captions

Built from three parts: the wire sentence, the host's store sentence, and the reader sentence. For preset 1 they are
the task's own words:

- hr: „Na žici adresa 172.16.5.30 putuje kao AC 10 05 1E (mrežni poredak okteta). Računalo s little-endian
  poretkom sprema je obrnuto: 1E 05 10 AC. Bez `ntohl` program čita 30.5.16.172.“
- en: "On the wire 172.16.5.30 travels as AC 10 05 1E (network byte order). A little-endian host stores it
  reversed: 1E 05 10 AC. Without `ntohl` the program reads 30.5.16.172."

The value is named as an address in dotted notation only for the ipv4 value; otherwise in hex. A big-endian host
"stores it in the same order"; with convert on the reader sentence says what `ntohl` gives; for text the caption
says the text has no byte order.

## Out of scope

Bit order on the physical layer (Ethernet sends each byte least significant bit first), middle-endian formats,
floating-point byte order, the AAAA record example.
