# protocol-headers: Header poster

| | |
|---|---|
| Task | `protocol-headers` (wave 3, Reference posters and classroom tools) |
| Catalogue entry | `ref-protocol-headers` in `docs/catalogue.md` §4.11 |
| Kind | build a new simulator |
| Folder | `sims/protocol-headers/` |
| Class | reference |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `encapsulation` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **Ethernet, IPv4, IPv6, TCP, UDP headers side by side**.

The student: hover fields.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.11.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md`, "Građa Ethernet okvira i MAC adresa" (preamble + SFD not counted; 6 + 6 + 2 + 46…1500 + 4 = 64…1518 octets).
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md`, "Građa IP zaglavlja: koja polja nešto znače" (RFC 791 §3.1 quotes) and **Primjer 7** "čitanje zaglavlja".
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/10-ipv6.md` (IPv6 address; the header itself from RFC 8200 §3).
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md`, "UDP: transport bez obećanja" (four 16-bit fields, RFC 768), "TCP: uspostava veze i trostruko rukovanje" (header ≥ 20 octets) and **Primjer 5** "čitanje polja pomaka podataka".
- `/home/rjasmin/projects/single-page-labs/l2l3-protocols.html` sections "Ethernet — IEEE 802.3", "IPv4 header (RFC 791)", "IPv6 header (RFC 8200)" (field data to reuse).
- RFC 791, RFC 8200, RFC 9293, RFC 768; IEEE 802.3 clause 3 (MAC frame format).
- Catalogue seed: overlaps spl-l2l3-protocols

## Model and presets

- **Scene:** a poster of five headers drawn to the same scale as 32-bit rows (one row = 4 octets, bit ruler 0–31
  on top): Ethernet II frame (destination 6, source 6, length/type 2, data 46–1500, FCS 4; drawn as an octet
  strip since it is not 32-bit aligned), IPv4 (5 rows minimum + options), IPv6 (10 rows, fixed), TCP (5 rows
  minimum + options), UDP (2 rows). Hovering (or clicking, for touch and projector) a field shows its size, what it
  is for, and an example value; a "nesting" strip at the bottom shows Ethernet ⊃ IP ⊃ TCP/UDP ⊃ data with octet
  counts, and the minimum and maximum frame totals.
- **State (reference, derived from params):** `{ selected: {header, field}|null, compare: ['ipv4','ipv6']|null,
  example: preset id, headers: [{id, rows: [{fields: [{name, bits, value, desc, rfc}]}], minOctets, maxOctets}] }`.
- **Params drive live:** hover/click selects a field; the compare choice puts two headers side by side with
  corresponding fields linked (TTL ↔ Hop Limit, Protocol ↔ Next Header, Total Length ↔ Payload Length).
- **Rules (content rules):**
  1. Ethernet: 7 octets preamble + 1 SFD not counted; destination and source MAC 6 octets each, length/type 2,
     data 46–1500 (padded to 46), FCS 4 → frame 64–1518 octets (URM ch07 "Građa Ethernet okvira"; IEEE 802.3).
  2. IPv4: Version 4 bits, IHL in 32-bit words (5 → 20 octets), Total Length counts header + data (URM ch08 "Građa IP
     zaglavlja" and Primjer 7: IHL 5, Total Length 1240 → 1220 octets data); fields per RFC 791 §3.1.
  3. IPv6: fixed 40 octets, no checksum, no fragmentation fields in the base header, extension headers chained by
     Next Header (RFC 8200 §3).
  4. TCP: Data Offset in 32-bit words; 20 octets without options (5), e.g. 10 → 40 octets with 20 of options (URM ch13
     Primjer 5; RFC 9293 §3.1).
  5. UDP: four 16-bit fields (source port optional, destination port, length ≥ 8, checksum over a pseudo-header
     with the IP addresses) (URM ch13 "UDP: transport bez obećanja"; RFC 768).
  6. All multi-byte fields are sent in network byte order (big-endian; see `endianness`).
- **Params:** `compare` choice none / IPv4 vs IPv6 / TCP vs UDP (default none); `example` select of the presets.
- **Presets (views with example values):**
  1. `book-ipv4` (URM ch08 Primjer 7): IHL 5, Total Length 1240, source 192.168.1.10, destination 192.168.2.50 →
     header 20 octets, data 1220.
  2. `book-tcp-offset` (URM ch13 Primjer 5): Data Offset 6 → 24-octet header, 4 octets of options; the capture figure's
     value 10 → 40 octets.
  3. `min-frame` (URM ch07): 46 octets of data → 6 + 6 + 2 + 46 + 4 = 64; `max-frame`: 1500 → 1518.
  4. `ipv4-vs-ipv6`: compare mode: 20 vs 40 octets, fields that disappeared (checksum, fragmentation) and renamed ones.
  5. `overhead`: TCP over IPv4 over Ethernet with 1460 octets of data: 14 + 20 + 20 + 1460 + 4 = 1518 *(derived)*.
- **Steps:** reference, none.
- **Legend:** field by header colour plus its name in the box (fields too narrow get a numbered label and a key), bit
  ruler, variable-length part (hatched), "not counted" preamble (dashed). "Changed" marks the selected field and its
  linked field in compare mode.
- **Captions** (footer per view):
  - hr: „IHL = 5 znači 5 riječi po 32 bita: zaglavlje ima 20 okteta. Od ukupne duljine 1240 okteta na podatke otpada
    1220.“
  - en: "IHL = 5 means 5 words of 32 bits: the header is 20 octets. Of the total length of 1240 octets, 1220 are data."
- **Terms** (URM ch07, ch08, ch13): header — zaglavlje; frame — okvir; trailer — podnožje; packet — paket; segment —
  segment; datagram — datagram; octet — oktet; checksum — kontrolni zbroj; frame check sequence — provjera ispravnosti
  okvira (FCS).
- **Misconceptions:** Ethernet frames can be any small size (64 minimum, padding); IPv6 headers are IPv4 headers with
  longer addresses (fixed 40, no checksum); TCP's header is always 20 octets (Data Offset).
- **Out of scope:** VLAN tags, tunnels and overlays (`l2l3-protocols`), IPv4 options in detail, TCP option kinds.
- **Note for the coordinator:** overlaps `l2l3-protocols` (imported, English only), which has Ethernet, 802.1Q,
  IPv4 and IPv6 header diagrams but no TCP or UDP; this poster can reuse its IPv4/IPv6 field data and link to it for
  everything below and above. Keep both: one is a deep dive, this one is the five-header overview.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh protocol-headers sims/protocol-headers` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/protocol-headers/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
