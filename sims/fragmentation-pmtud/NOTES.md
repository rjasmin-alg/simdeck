<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fragmentation-pmtud: notes

New explorer (task `docs/tasks/w3/fragmentation-pmtud.md`, catalogue `net-fragmentation-pmtud`, §4.1, wave 3). Rules and
expected numbers: `SPEC.md`. The path is drawn with kit view K2 (`kit/topology.js`), as in `hop-rewrite`.

## Decisions

- **Stage, top to bottom.** The packet view (the arithmetic line, the packet as sent, what leaves R2 on link B), the
  K2 path, the outcome timeline. Free height is spread between the three (`align-content: space-evenly`).
- **Packet view.** The sent packet is one bar: IP header (c3, solid) and data (c1, tint), with dashed lines where R2
  will cut the data. The link B row shows one block per fragment, each `[tunnel][header][data]` with total length,
  offset (and the offset × 8 in bytes, against the misconception "offsets count bytes") and MF under it. Blocks grow
  with their length but keep a minimum width for their labels, so the row is not to scale. More than 4 fragments:
  the first two, "… n more …", the last two (9000 B into 68 B gives 188). A single block (pass, PMTUD resend) is drawn
  at its share of the sent packet's width, so the resent 1400 B is visibly shorter than the 1500 B sent.
- **Arithmetic line** above the bars: effective MTU = link MTU − overhead, and data per fragment
  ⌊(effMtu − 20) / 8⌋ · 8 when fragmenting; the shared identification 0x1c46 is written there once.
- **Path.** H1 (sender) — R1 — link A — R2 — link B — H2 (receiver) on a 13-column K2 grid, cards two columns wide,
  link B's gap three columns. The link labels are K2 `cloud` cards under the links (K2 has no link label, the same
  workaround as `hop-rewrite`). The tunnel is a hatched c4 pill card on link B, its label below the line.
- **Arrows.** The packet H1 → R1 → R2; on link B the packet, "n fragments", or the resent packet. With DF the R1 → R2
  arrow ends in K2's drop cross at R2, the ICMP (c5 chip) goes back R2 → R1 → H1, or, when blocked, ends in a cross at
  R1. The resent packet is shown on link B only (drawing it again on the first two links would sit on the original's
  arrows).
- **Firewall at R1.** `icmpBlocked` makes R1 the firewall (badge "blocks ICMP", timeline "R1, firewall"); the task's
  scene has no separate firewall node.
- **Timeline marks** carry shape and colour: ✓ ok (round, green), ✕ drop (square, red), ↩ ICMP (filled c5), … silence
  (dashed), ⟳ stall (dashed square, red), → plain step.
- **Changed** marks (kit highlight + thick ink border) compare with the state before the last input; a preset counts
  as an input, so loading a preset marks what differs from the previous settings.
- **Overhead control** is a drop-down (`select`): five segmented buttons with "VXLAN +50" did not fit the panel.
- **DF in IPv6** is disabled with its reason ("IPv6 has no DF flag: routers never fragment").
- **Numbers as digits.** The task's hr caption says "tri fragmenta"; the page writes "3 fragmenta" (plural forms from
  the table), which works for any count. The offsets list joins with "i"/"and" ("0, 60 i 120"); more than four
  become "0, 63, …, 1071".
- **Black-hole caption.** The task's en caption says "the router drops … and says nothing"; in this model R2 does send
  the ICMP and the firewall (R1) drops it, so the caption says "its ICMP never arrives".

## Deviations from the task

- **Link A MTU 9000, not 1500.** With link A at 1500, sizes above 1500 (the range goes to 9000, and `just-over` sends
  1600) would be cut by R1 before R2. Link A carries 9000, so link B is the only bottleneck, as the task's scene says.
- **`mtuB` range 68–9000 (step 4), not 576–9000.** `primjer-3` needs 500; 68 makes rule 7's refusal reachable too
  (68 with GRE → 44, refused). Step 4 keeps 68, 500, 576, 1280, 1400, 1500 and 9000 on the scale (the calculator's
  MTU step). `size` keeps step 1.
- **IPv6 minimum 1280** (RFC 8200 §5) is refused like IPv4's 68; the task names only the IPv4 edge.
- **IPv6 handshake 80 B and MSS = PMTU − 60** (40 B header); the task gives only the IPv4 numbers.
- **The packet view is a full-width box above the path**, not drawn above link B itself: the fragment labels need
  the width.
- **No 6th preset for IPv6**: the task lists five; IPv6 is one click on "Protokol".

## Sources

- `/home/rjasmin/projects/single-page-labs/l2l3-protocols.html`, tab "07 · Fragmentation": `updateFrag()` (effective
  MTU = link MTU − encapsulation overhead, ⌊(eff − 20) / 8⌋ · 8 per fragment, `<=` passes, < 68 refused), DF/MF/offset
  tooltips, "Path MTU Discovery (PMTUD) — RFC 1191 (IPv4), RFC 8201 (IPv6)", "Failure mode: ICMP black holes", "MTU
  values by tunnel type" (802.1Q +4, PPPoE +8, GRE +24, VXLAN +50).
- URM `book/chapters/08-mrezni-sloj.md` "Građa IP zaglavlja: koja polja nešto znače" (identification, fragment
  offset; footnotes rfc791-frag-nuzno, rfc791-frag-polja) and Primjer 3 "zašto se paket cijepa" (1400 B into 500).
- URM `book/chapters/15-analiza-prometa.md`, Destination Unreachable table, code 4 "potrebna fragmentacija, a
  postavljen je bit „ne fragmentiraj"".
- RFC 791 §3.2; RFC 792 (type 3 code 4); RFC 1191 §3 *(check section)*, §4; RFC 2923 §2.1; RFC 8200 §5; RFC 8201.
  No offline copies of the RFCs: section numbers are the task file's.
- Numbers checked with a python3 script (standard library), 2026-10-25, equal to the model's:

  ```python
  def frags(size, mtu, ovh=0, hdr=20):
      eff = mtu - ovh
      if size <= eff: return eff, [(size, 0, 0)]
      per = (eff - hdr) // 8 * 8
      data, off, out = size - hdr, 0, []
      while data > 0:
          d = min(per, data); data -= d
          out.append((d + hdr, off // 8, 1 if data > 0 else 0)); off += d
      return eff, out
  print(frags(1400, 500))      # (500, [(500, 0, 1), (500, 60, 1), (440, 120, 0)])
  print(frags(1600, 1500))     # (1500, [(1500, 0, 1), (120, 185, 0)])
  print(frags(1500, 1500, 24)) # (1476, [(1476, 0, 1), (44, 182, 0)])
  print(frags(1500, 1496))     # (1496, [(1492, 0, 1), (28, 184, 0)])
  print(frags(2980, 1500))     # (1500, [(1500, 0, 1), (1500, 185, 0)])
  print(frags(9000, 576, 50))  # 18 fragments, 17 × 524 and (432, 1071, 0)
  ```

## Unchecked *(check)*

- RFC 1191 §3 as the section for "lower the path MTU and resend" (task file says "check section").
- Three retransmissions is the task's number; real TCP stacks retry longer with exponential backoff.
- Croatian terms "otkrivanje MTU-a puta" and "crna rupa" are the task's, marked "check term".

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| fragmentation | fragmentacija |
| fragment offset | pomak fragmenta |
| identification | identifikacijski broj |
| maximum transmission unit (MTU) | najveća jedinica prijenosa (MTU) *(check)* |
| Don't Fragment (DF) | ne fragmentiraj (zastavica DF) |
| path MTU discovery | otkrivanje MTU-a puta *(check)* |
| black hole | crna rupa *(check)* |
| MSS clamping | — (kept in English, in italics) |

`header`, `firewall` and `handshake` are in the glossary and used as `[[…]]`.

## Shared requests

- **K2: a label in the middle of a link** (`links[].label`), as `hop-rewrite` asked; the page uses cloud cards under
  the links instead.
- **K2: a styled link** (thick "pipe" for a tunnel, `links[].style: 'pipe'` or a class): the page draws the tunnel as
  a cloud card laid over link B.
- **K2: a colour for arrows** (`packets[].c` colours only the chip; the ICMP arrow is ink like the packet's).
- **Model promotion:** none needed; `fragment(size, eff, hdr)` is pure and could go to `models/` if another sim
  (e.g. a packet-journey or tunnel sim) needs fragment arithmetic.
- `hop-rewrite`'s model was not reused: it is about TTL, checksums and MACs, none of which this sim shows. The path
  drawing (K2 cards, cloud labels under the links) is the reused part.

## Tags

Topic `networks`, tag `ip` (both in `tags.json`), level `intro`.

## Review

A fresh reviewer read the files against SPEC.md (2026-10-25): every number recomputed independently and confirmed;
69 mutations of `sim.js`, 30 survived. Fixed: tests now pin every timeline row's `who`, `mark` and printed numbers
for each outcome (GRE and IPv6 included), the tunnel's PMTU and resent size, DF in the sent row, `fragment()` at
size = effMtu (incl. 1496, not 8-aligned), the refused fields, the scene constants; `changed()` now compares data
size and the resent tag too (IPv4 → IPv6 and pass → PMTUD were not marked), and rows added after a shorter "before"
are tested. Re-run: every mutation killed. Page fixes: the control is "Encapsulation on link B" (802.1Q is a tag, not
a tunnel) and the explanation says when a VLAN tag lowers the MTU; the explanation gives the IPv6 MSS (− 60); the
handshake row says "up to 60 B"; the IPv6 note is not shown on a refused link; the hr explanation uses `[[=header]]`
for the later mention.
- **Open:** 802.1Q stays in the overhead list because the task lists it; whether to keep it is the owner's call
  (report).
- **Jumbo frames**: link A's 9000 and sizes up to 9000 imply jumbo frames on the sender's side, which the task puts
  out of scope; the page only labels link A "MTU 9000" and says nothing more about them.

## Time

2026-10-25, 14:21 → 14:47, about 26 minutes, one session (the fresh review included).
