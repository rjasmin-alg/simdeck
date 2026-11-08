<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipv4-header: notes

New explorer (task `docs/tasks/w3/ipv4-header.md`, catalogue `net-ipv4-header`, §4.1, wave 3). No kit view: the task
names none, and a bit/field strip is not one of K1–K4. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Scene, top to bottom.** A small path A → R1 → B (HTML, not K2: one row with two links is all it needs); the
  field strip; the selected field's card beside a situation box.
- **Field strip** is one CSS grid of 32 equal columns, each cell spanning its bits, under a ruler 0 / 8 / 16 / 24 / 31,
  so the widths are exactly proportional, as in `ch08-ipv4-zaglavlje.svg`. Every cell is a `<button>` (click or
  Tab + Enter selects the field; focus is put back on the same cell after the re-render); `aria-pressed` and a
  thick bottom bar plus "▶" mark the selected one. Group colour from the series (c1 addressing, c2 fragmentation,
  c3 lifetime and integrity, c4 format) plus a border style per group (fragmentation dashed, lifetime double), so the
  groups differ in grayscale too.
- **Changed fields** get `.sd-changed` and show the old value struck through → the new one. With several fragments
  the cell lists one value per fragment when they differ ("1400 → 500 · 500 · 440") and one value when they are the
  same (TTL "64 → 63"). The flags cell (3 bits) shows "DF 1 MF 0" on one line, and in the fragment view DF and MF
  on two lines with MF's per-fragment values.
- **One packet per view** (SPEC.md "The packets"), each from the book example the view is about; the hop packet is
  `hop-rewrite`'s, so its checksums (0x99f4 → 0x9af4) agree with that sim.
- **Situations on the card** are computed (rule 10), not listed per field: each situation's own packet is sent
  through R1 and the fields that differ are collected. TTL and the checksum therefore list hop, fragment and NAT.
- **TTL in the fragment view** also drops 64 → 63: the fragmenting router is a hop (rule 6). The task's rule 10 names
  TTL as changing in "two views"; with R1 forwarding the fragments it changes in all three. Lit and listed so.
- **Type of service** stays one field (one cell, one select entry) with DSCP and ECN shown side by side inside it
  (rule 5). The card says that DSCP may be re-marked at a network boundary and ECN set to 11 by a congested router,
  so "nothing else changes" on a plain hop (rule 6) is not read as "never changes".
- **Options** are NOP filler bytes (type 1), so the checksum follows IHL. The options row is one row for all the
  option words (it says how many octets), so IHL 15 does not need ten rows.
- **DF on**: nothing is lit, the flags cell gets a red outline, R1 a red frame and the "dropped" chip, and the box
  says ICMP "fragmentation needed" and points at the fragmentation/PMTUD sim by its title (not a link: the page works
  alone from one file).
- **No RFC numbers on the page** (documentation belongs in Sources): the card says "in practice a hop count".

## Deviations from the task

- **Fourth param `ihl`** (range 5–15, default 5), shown only in the `role` view. The task's scene has an Options row
  "only when IHL > 5" and rule 2 is IHL arithmetic, but none of its three params can set IHL. Other views use their
  book packet with IHL 5 (fragmenting with options would need the options' copy flag, out of scope).
- **`df` and `ihl` are hidden outside their view** (`visible`), with the `.sd-ctl[hidden]` page workaround that
  `ethernet-frame` and `amdahl` use.
- **Class `explorer`**, as the task's coordinator note suggests (a reference page has no params or presets).
- **Croatian hop caption**: the task's text with the TTL numbers filled in from the model.

## Sources

- URM `book/chapters/08-mrezni-sloj.md`: "Građa IP zaglavlja: koja polja nešto znače" (Što treba znati: version,
  IHL in 32-bit words, total length and 65 535, TTL, protocol; Šire o temi: the twelve fields and their widths,
  160 bits, identification and fragment offset), Primjer 3 (1400 into 500), Primjer 7 (IHL 5, 1240, 1220), question
  4 (IHL 7, 500 → 472, tested); figure `assets/diagrams/ch08-ipv4-zaglavlje.svg`.
- URM `book/chapters/11-usmjeravanje.md`: Primjer 1 (TTL 64 → 63), "NAT" and its Šire o temi (the NAT fixes the
  checksums); `sims/hop-rewrite/` SPEC "The packet".
- RFC 791 §3.1, §3.2; RFC 1071 (checksum, its §3 example sum 0xddf2 is a test); RFC 1812 §5.3.1, §5.2.2 *(check: §5.2.2 may be header
  validation rather than the recompute; RFC 791 §3.1 says the checksum is recomputed wherever the header is
  processed)*; RFC 2474 §3; RFC 3168 §5; RFC 1191 §3; RFC 3022 §4.1 (confirmed by the reviewer); RFC 5737
  (203.0.113.0/24); IANA Protocol Numbers (1, 6, 17).
- Copied from `sims/hop-rewrite/sim.js @ 266f5d7`: `sum16`, `checksumOf` (marked in `sim.js`). `models/` has no
  shared IP model yet.

## Checks

- Numbers: an independent Python script (struct, standard library) before the model; the model agrees:

  ```python
  import ipaddress, struct
  def s16(b):
      s = sum(struct.unpack('!%dH' % (len(b)//2), b))
      while s >> 16: s = (s & 0xffff) + (s >> 16)
      return ~s & 0xffff
  def hdr(ihl=5, tos=0, total=0, ident=0, df=0, mf=0, off=0, ttl=64, proto=6, src='', dst=''):
      h = struct.pack('!BBHHHBBH4s4s', 0x40 | ihl, tos, total, ident, (df << 14) | (mf << 13) | off, ttl, proto, 0,
                      ipaddress.IPv4Address(src).packed, ipaddress.IPv4Address(dst).packed) + bytes([1]) * ((ihl - 5) * 4)
      return '0x%04x' % s16(h)
  # role 0x8783, role IHL 7 0x817f, hop 0x99f4 → 0x9af4, fragment 0xc6d7 (DF 0x86d7),
  # fragments 0xab5b 0xab1f 0xcb1f, nat 0x4ca0 → 0xd34c
  ```
- `npm run gate -- ipv4-header`: all checks pass (manifest, 22 model tests, build, 46 browser checks, tokens, scope),
  0 exceptions declared.
- Fresh review (a separate agent read the diff against SPEC.md and the task, recomputed every checksum with its own
  script, ran 73 mutations in a scratch copy, 63 caught, and read both tables). Numbers and rules: no findings.
  Fixed from it: tests for the header bytes in wire order (source/destination or length/ID swaps kept the checksum),
  the legend groups, a packet of exactly the MTU (with DF), the role view at IHL 15 and `hex4` padding, each mutation
  re-run and now caught; the fragment table's ID and checksum marks are compared with the model instead of fixed;
  the flags cell shows an after-value for DF as well as MF when the model changes it; the explanation's checksum
  definition said "one's complement sum" without "the complement of"; the type-of-service card no longer reads as
  contradicting "does not change in transit" (the DSCP/ECN exceptions are named as not shown, and ECN 11 only on a
  packet that supports ECN); the options card no longer shows a width when there are no options; the destination
  card lost the NAT misconception (inbound NAT rewrites the destination, not shown here); hr "16 bitova", "TTL se ne
  mjeri u sekundama", "novi kontrolni zbroj"; the unused `checksumHex` state field removed. Left as they are (no
  behaviour change): equivalent mutants (DF cleared inside the fragment loop, one fold of the checksum sum, `>= 32`
  in `rows()`, the situation packets built from other views); `val_tos` is worded for DSCP 0 / ECN 00, which every
  packet here has.
- Screenshots reviewed at 1920×1080 (light, dark, grayscale) and 375×812, hr and en, plus every preset and IHL 6,
  9 and 15 with the options field selected. A script measured every cell for clipped content in each of them.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| Internet Header Length (IHL) | duljina zaglavlja | URM ch08 |
| total length | ukupna duljina | URM ch08 |
| identification | identifikacijski broj | URM ch08 |
| flags | zastavice | URM ch08 |
| fragment offset | pomak fragmenta | URM ch08 |
| time to live (TTL) | vrijeme života | URM ch08, ch11 |
| header checksum | kontrolni zbroj zaglavlja | URM ch08, ch11 |
| type of service | vrsta usluge | URM ch08 |

`header` (zaglavlje) is in the glossary and used as `[[header]]`. TTL and checksum are also listed in
`sims/hop-rewrite/NOTES.md`; one glossary entry each would serve both.

## Shared requests

- **Model promotion:** `sum16`/`checksumOf` now live in two sims (hop-rewrite, here). The packet helpers here
  (`headerBytes`, `seal`, `hop`, `fragment`, `nat`, `changedFields`) are pure and string-free, so an `ipv4-packet`
  model in `models/` could serve hop-rewrite, this sim, fragmentation-pmtud and traceroute.
- **kit: `.sd-ctl[hidden]`** (already requested by ethernet-frame): worked around in the page CSS.

## Tags

Topic `networks`, tag `ip` (both in `tags.json`), level `intro`.

## Time

Start to done: one session, 17:23–18:05 on 2026-11-08 by the wall clock (about 40 minutes), including the review.
