<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# fragmentation-pmtud: fragments, DF and the PMTUD black hole

One concept: **a packet too big for the next link is either cut into fragments (DF = 0), or dropped with an ICMP
"fragmentation needed" that tells the sender the right size (DF = 1, path MTU discovery); if that ICMP is blocked,
the sender never learns and the connection hangs (a black hole).** An explorer: the params drive the drawing live.

Task: `docs/tasks/w3/fragmentation-pmtud.md`. Catalogue: `net-fragmentation-pmtud` (§4.1).

## Scene

A path left to right on kit view K2: **sender — R1 — link A (MTU 9000) — R2 — link B (MTU `mtuB`) — receiver**.
Link B is the only bottleneck. **Deviation:** the task gives link A an MTU of 1500, but its sizes go up to 9000 and
its `just-over` preset sends 1600 B, which R1 would then have to cut before R2; link A carries 9000 (the size
slider's top), so whatever happens, happens at R2. With an encapsulation overhead (`overhead` > 0) link B carries a tunnel, drawn as a hatched
pipe on the link. When `icmpBlocked` is on, R1 is also the firewall that drops ICMP on its way back to the sender.

Above the path: the packet as the sender sent it (one bar, the data cut by dashed lines where R2 splits it), and what
leaves R2 on link B (one block, a row of fragment blocks, the resent smaller packet, or nothing). Each block: tunnel
overhead (if any), the IP header, the data; labelled total length, offset (8-byte units, and in bytes), MF; the
Identification shared by all is written once. Under the path, the **outcome timeline** (1–5 rows).

The packet's Identification is 0x1c46 (the same as `hop-rewrite`'s; any value would do, rule 2).

## State (explorer)

Params `{ size, mtuB, overhead, df, icmpBlocked, proto }` → derived
`{ hdr, effMtu, min, outcome, fits, tcp, sent, onB, fragments, icmp, pmtu, mss, timeline }`.

- `hdr` = 20 (IPv4, no options) or 40 (IPv6, no extension headers).
- `effMtu` = `mtuB` − `overhead` (rule 1).
- `outcome` ∈ `refused` | `pass` | `fragment` | `pmtud` | `blackHole`.
- `tcp` = DF set (IPv4) or IPv6: the sender is a TCP connection doing path MTU discovery, so the timeline starts with
  its handshake. With DF = 0 on IPv4 it is one packet, no handshake.
- `onB`: the blocks that leave R2 on link B, `{ len, offset, mf, data, start }` (`offset` in 8-byte units, `start` =
  first data byte = 8 · offset). `fragments` = `onB` when `outcome` is `fragment`, else `[]`.
- `icmp`: `{ type, code, nextHopMtu, v6 }` or null.

## Rules

1. **Effective MTU = link MTU − tunnel overhead**; a packet whose total length ≤ effective MTU passes unchanged
   (`l2l3-protocols.html` calculator `updateFrag()`; URM ch08 "Građa IP zaglavlja", Šire o temi).
   **Tie-break:** size = effMtu passes, no fragmentation (`<=`, as the calculator). The timeline: send, R2 forwards,
   receiver gets it (with the handshake first in TCP mode).
2. **Fragmentation (IPv4, DF = 0, too big).** Every fragment gets its own IPv4 header (20 B, no options) and the same
   Identification. Data per fragment = ⌊(effMtu − 20) / 8⌋ · 8, except the last, which takes the rest. Offset counts
   8-byte units from the start of the original data. MF = 1 on every fragment but the last
   (URM `08-mrezni-sloj.md` "Građa IP zaglavlja" Šire o temi, footnotes rfc791-frag-nuzno, rfc791-frag-polja;
   RFC 791 §3.2). **Tie-breaks:** when (effMtu − 20) is not a multiple of 8 the full fragments are shorter than
   effMtu (effMtu 1496 → 1492 B fragments); when the data divides exactly, the last fragment is full and there is no
   empty extra fragment (2980 B into 1500 → two of 1500 B, the second with MF = 0).
3. **Reassembly only at the destination**: the receiver puts the fragments back together by Identification and
   offset; one lost fragment loses the whole packet (ch08 same paragraph; RFC 791 §3.2 reassembly timer). Shown as
   the timeline's last row; no loss is simulated.
4. **DF = 1 and too big**: R2 drops the packet and sends ICMP Destination Unreachable, type 3 code 4
   "fragmentation needed and DF set", carrying the next-hop MTU = effMtu (RFC 792; RFC 1191 §4; `l2l3-protocols.html`
   DF tooltip; URM ch15 Destination Unreachable table, code 4). In a tunnel the reported MTU is the tunnel's
   effective MTU (1476 for GRE on a 1500 link).
5. **PMTUD**: the sender lowers its path MTU to the reported value and resends; TCP uses MSS = PMTU − 40 (IPv4 20 +
   TCP 20, no options) (RFC 1191 §3 *(check section)*; MSS arithmetic derived). The resent packet is PMTU bytes long
   and passes (PMTU = effMtu ≤ effMtu, rule 1's tie-break).
6. **Black hole**: if the ICMP is dropped (`icmpBlocked`, at R1 acting as the firewall), the sender never learns. The
   handshake (60 B: IPv4 20 + TCP 40 with options) passes, but the full-size segment is lost; the sender retransmits
   the same size 3 times with no answer, and the transfer stalls: "hangs after connect" (RFC 2923 §2.1;
   `l2l3-protocols.html` "Failure mode: ICMP black holes"). Fixes (explanation only): MSS clamping on the tunnel
   router, or allowing ICMP type 3 code 4. The number of retransmissions shown (3) is the task's; real stacks retry
   longer with backoff *(simplification)*.
   **Tie-break:** with DF = 0, or when the packet fits, no ICMP is sent, so `icmpBlocked` changes nothing but a note
   row ("nothing to block").
7. **Edges.** effMtu below 68 B is refused (RFC 791 minimum; the calculator's check): no packet, one timeline row.
   Size exactly = effMtu → no fragmentation (rule 1).
8. **IPv6**: routers never fragment; the same too-big case gives ICMPv6 "Packet Too Big" (type 2 code 0) with the
   MTU (RFC 8200 §5, RFC 8201), and PMTUD / the black hole work as in rules 5–6 with a 40 B header: handshake 80 B,
   MSS = PMTU − 60. No fragments are drawn; a note says why. DF does not exist in IPv6 (the toggle is disabled with
   that reason). **Edge (added):** IPv6 requires every link to carry at least 1280 B (RFC 8200 §5), so effMtu below
   1280 is refused in IPv6 the way rule 7 refuses 68 in IPv4.

## Timeline rows (language-neutral codes)

| outcome | rows |
|---|---|
| refused | `refused` |
| pass | (`handshake` if tcp), `send`, `forward`, `receive`, (`noIcmp` if icmpBlocked) |
| fragment | `send`, `fragment`, `reassemble`, (`noIcmp` if icmpBlocked) |
| pmtud | `handshake`, `send`, `dropIcmp`, `pmtu` (sender), `resend` (R2 forwards it) |
| blackHole | `handshake`, `send`, `dropIcmp`, `icmpLost`, `retry` |

At most 5 rows. Each row is `{ who, k, mark, v }`: `who` sender | r2 | fw | receiver, `mark` ok | drop | icmp |
silence | info | stall, `v` the numbers its sentence needs.

## Changed

"Changed" marks the blocks on link B and the timeline rows that differ (by value, index by index) from the state
before the last input (a param change or a preset). A block compares its length, data, offset, MF and whether it is
the resent packet; a change of the tunnel overhead marks every block (each is drawn with or without the tunnel). The first render marks nothing; a re-render with the same params
keeps the marks.

## Expected numbers (checked with `python3`, see NOTES.md)

| Preset | Params | Result |
|---|---|---|
| `primjer-3` | size 1400, mtuB 500, DF 0 | effMtu 500, data per fragment 480: 500 B (0, MF 1), 500 B (60, MF 1), 440 B (120, MF 0) |
| `just-over` | size 1600, mtuB 1500 | 1500 B (0, MF 1) + 120 B (185, MF 0) |
| `gre-tunnel` | size 1500, mtuB 1500, overhead 24 | effMtu 1476: 1476 B (0, MF 1) + 44 B (182, MF 0) |
| `pmtud` | size 1500, mtuB 1400, DF 1 | drop, ICMP 3/4 MTU 1400; PMTU 1400, MSS 1360, resend 1400 B passes |
| `black-hole` | `pmtud` + icmpBlocked | handshake 60 B passes; 1500 B dropped, ICMP lost at R1; 3 retransmissions; stall |

Others: 1500 into 1496 (or 1500 with 802.1Q) → 1492 (0) + 28 (184); 2980 into 1500 → 1500 (0, MF 1) + 1500 (185,
MF 0); 1500 into VXLAN (1450) → 1444 (0) + 76 (178); 1476 into GRE passes, 1477 → 1476 (0) + 21 (182); 9000 into
576 with VXLAN (526) → 18 fragments, 17 × 524 B and 432 B at offset 1071; 1500 into 68 → 31 fragments, the last 60 B
at offset 180; mtuB 68 with GRE → effMtu 44, refused. GRE with DF: ICMP MTU 1476, MSS 1436. IPv6 1500 into 1400:
Packet Too Big, MTU 1400, MSS 1340, handshake 80 B.

## Params

`size` 68–9000 B, step 1 (default 1500); `mtuB` 68–9000 B, step 4 (default 1500); `overhead` choice 0 / 4 (802.1Q) /
8 (PPPoE) / 24 (GRE) / 50 (VXLAN) B (default 0); `df` toggle (default off, disabled in IPv6); `icmpBlocked` toggle
(default off); `proto` choice IPv4 / IPv6 (default IPv4).

**Deviation:** the task gives `mtuB` 576–9000, but its own `primjer-3` preset needs 500; the range starts at 68 (the
IPv4 minimum) so the preset and rule 7's refusal are both reachable. Step 4 keeps 68, 500, 576, 1280, 1400, 1500 and
9000 on the scale (the calculator's MTU step).

## Out of scope

Overlapping-fragment attacks, IPv6 fragment header details, PLPMTUD (RFC 4821, mentioned only), jumbo frames, the
reassembly timer's length, fragment loss as a simulated event.
