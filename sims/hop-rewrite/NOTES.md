<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# hop-rewrite: notes

New stepper (task `docs/tasks/w2/hop-rewrite.md`, catalogue `net-hop-rewrite`, §4.1 and §5.9, wave 2b) on kit view K2
(`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Stage, top to bottom.** The field strip ("Paket na putu": the frame row, then the IP header row) beside the
  node's work box; the K2 path; the history table ("Po segmentima").
- **Field strip.** One cell per field, label above, value below. A field this hop changed is highlighted (kit
  `--hl`, thick ink border) with the old value struck out next to its label; an unchanged one carries "=". The
  comparison is with the packet on the previous segment (SPEC.md "Marks"), so the cross step after a router keeps
  that router's marks, and B's arrive step shows every field "=". The summary step compares the last segment with
  segment 1. Version, IHL, length, ID and DF share one "other fields =" cell (rule 7).
- **Frame and IP colours**: the frame row has a solid c4 bar, the IP row a double c3 bar, so the two differ in
  grayscale too (legend swatches drawn the same way).
- **Work box.** The router's order from the task as a numbered list of seven lines with the values (lookup result,
  TTL in → out, checksum in → out, ARP hit/miss/learned, new frame's MACs). After a drop the lines 5–7 are struck
  ("ne radi se") and line 4 carries a ✕. At B: five checks and "accepts". It keeps showing the last node's work
  (muted) on the steps after.
- **History table.** One row per segment crossed; each cell compared with the row above: changed cells
  highlighted, unchanged ones muted with "=". The source and destination IP columns are "=" all the way down. A
  dropped packet ends in a dashed "✕ R2: TTL 0" row.
- **Segment labels** are K2 `cloud` cards in row 1, under each link (segment number and network); the link ends show
  the router interface's host part (`.1`, `.2`); host cards show the full address. On the phone the cards are listed
  in path order (A, segment 1, R1, …).
- **MACs** are `02:00:00:00:00:xx`, shown as `…:xx` with the owner (`R1 Gi0/1`) beside the value in the strip
  (task: "MACs shortened to the last octet").
- **FCS is a real CRC-32** over a fully defined frame (SPEC.md "The packet": the echo request payload is 56 zero
  bytes), so its change is visible and checkable. The ICMP Time Exceeded message's checksum and FCS are shown as
  "novo / new" and not computed (its payload is not modelled).
- **ICMP step** shows the new message in the strip (src = the dropping router's interface towards the source, dst
  192.168.1.10, type 11 code 0, TTL 64) and draws it back across every link to A, chip on the first link only.
- **Params `routers` and `coldArp` reset to step 0** (they change the step count); `ttl0` does not (the kit clamps
  the step).
- **Croatian TTL caption.** The task's hr caption says "TTL pada sa 64 na 63"; the page writes "TTL pada: 64 → 63",
  which reads right for any TTL (s/sa depends on the number).

## Deviations from the task

- **Fourth param `coldArp`** (toggle, default off). The task lists `ttl0`, `routers`, `showChecksum`; the `cold-arp`
  preset needs a param to say "R1's ARP table empty", and it combines with 2 routers (R1 then ARPs for 10.0.0.2).
- **`cold-arp` is two steps longer than `book`** (ARP request, ARP reply), matching the task's step count 7 rather
  than its "(one extra step)".
- **Topology without a kit change:** segment labels as cloud cards (see above). The interface name is in the router
  card, not on the link end, to keep the end labels short.

## Sources

- URM `book/chapters/11-usmjeravanje.md` "Usmjeravanje: kako paket pronalazi put kroz mrežu" (TTL, new frame per
  segment, IPs stay) and Primjer 1 (A 192.168.1.10/24, R1 Gi0/0 192.168.1.1/24, Gi0/1 192.168.2.1/24, B
  192.168.2.20/24, TTL 64 → 63); figure `assets/diagrams/ch11-skok-sto-se-mijenja.svg`.
- URM ch08 "Građa IP zaglavlja" (header checksum field) and Primjer 5b (ARP for the gateway).
- RFC 791 Header Checksum; RFC 1812 §5.3.1 (TTL, Time Exceeded code 0), §4.2.2.5 *(check: section number from the
  task file, not verified offline)*, §4.3.2.4 ICMP source address *(check)*; RFC 1624 eq. 3; RFC 792 type 11; IEEE
  802.3 CRC-32.
- Derived and checked here: every checksum and FCS in SPEC.md. Reference script (python3, standard library), run
  2026-10-05, values equal to the model's:

  ```python
  import ipaddress, struct, zlib
  def s16(b):
      s = sum(struct.unpack('!%dH' % (len(b) // 2), b))
      while s >> 16: s = (s & 0xffff) + (s >> 16)
      return ~s & 0xffff
  def hdr(ttl, src, dst):
      h = struct.pack('!BBHHHBBH4s4s', 0x45, 0, 84, 0x1c46, 0x4000, ttl, 1, 0,
                      ipaddress.IPv4Address(src).packed, ipaddress.IPv4Address(dst).packed)
      c = s16(h); return h[:10] + struct.pack('!H', c) + h[12:], c
  echo = struct.pack('!BBHHH', 8, 0, 0, 1, 1) + bytes(56)
  echo = echo[:2] + struct.pack('!H', s16(echo)) + echo[4:]          # 0xf7fd
  mac = lambda x: bytes([2, 0, 0, 0, 0, x])
  def frame(d, s, ttl, src, dst):
      h, c = hdr(ttl, src, dst)
      return hex(c), '0x%08x' % zlib.crc32(mac(d) + mac(s) + b'\x08\x00' + h + echo)
  print(frame(0x11, 0x0a, 64, '192.168.1.10', '192.168.2.20'))  # ('0x99f4', '0xfac50cbc')
  print(frame(0x14, 0x12, 63, '192.168.1.10', '192.168.2.20'))  # ('0x9af4', '0xc8bc7f0a')
  ```

## Unchecked *(check)*

- RFC 1812 section numbers §4.2.2.5 and §4.3.2.4 (no offline copy of the RFC).
- The ICMP message's TTL 64 is an assumption (the router's own default).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| hop | skok |
| router | usmjernik |
| time to live (TTL) | vrijeme života (TTL) |
| header checksum | kontrolni zbroj zaglavlja |
| next hop | sljedeći skok |
| source / destination address | izvorišna / odredišna adresa |

`frame` (okvir) is in the glossary and used as `[[frame]]`.

## Shared requests

- **K2: a label in the middle of a link** (`links[].label`, e.g. "segment 2 · 10.0.0.0/30"). The page uses `cloud`
  cards in the row under the links instead; traceroute and packet-journey will want the same.
- **Model promotion:** `headerChecksum`, `incrementalChecksum`, `crc32`, `fcsOf` and the scene in `sim.js` are pure
  and string-free; traceroute and packet-journey (§5.9) could take them from `models/`.

## Tags

Topic `networks`, tag `routing` (both in `tags.json`), level `intro`.

## Review

A fresh reviewer read the diff against SPEC.md (2026-10-05): every number recomputed and confirmed; 36 mutations,
17 survived. Fixed: segment 1's link lit during R1's ARP on segment 2; en `capArpRep` hard-coded R1; idle work text
named the checksum with the checksum hidden; the explain text now mentions the end-around carry. Tests added for the
surviving mutations that change what the page shows (networks, route via, TTL out, ICMP TTL, ARP reply unicast,
learned MAC at the next cross, frame type, R2's comparison row, drop summary, TTL clamp). Left: `csumOk`/`macOk` at
B are always true in reachable states; `learned` is one flag, fine while only R1 can be cold.

## Time

2026-10-05, 08:18 → 08:40, about 25 minutes, one session.
