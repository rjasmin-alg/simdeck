# encapsulation: Encapsulation and decapsulation

| | |
|---|---|
| Task | `encapsulation` (wave 2b, Network fundamentals) |
| Catalogue entry | `net-encapsulation` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/encapsulation/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | URM |
| Topic / tags / level | `networks` / `encapsulation` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **each layer adds its header going down and strips it coming up**.

The student: step a message down the sender's stack and up the receiver's.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/04-slojeviti-modeli.md` (Uvod u računalne mreže): "Enkapsulacija, dekapsulacija i imena podatkovnih jedinica", Primjer 2 (redoslijed enkapsulacije), Primjer 3 (do kojeg sloja tko gleda), Primjer 4 (imena jedinica)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch04-enkapsulacija-dekapsulacija.svg` (the book's figure: adding order vs reading order, with the Ethernet trailer)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` "Građa Ethernet okvira i MAC adresa" (14 B header, 4 B FCS, 46–1500 B payload, 64/1518 B limits, padding, preamble/SFD not counted)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md` (IPv4 header 20 B, IHL) and `13-transportni-sloj.md` (TCP header 20 B, Data Offset)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/03-put-podataka.md` "Put kroz mrežu: od klika do prikazane stranice" (the scenario of preset 1)
- RFC 1983 (Internet Users' Glossary, "Encapsulation"), RFC 768 (UDP, 8 B header), RFC 2784 (GRE)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, page 7 "Slojevi i enkapsulacija" (the planned card)
- Catalogue seed: URM card ch04-enkapsulacija-dekapsulacija → §5.9

## Overlaps (catalogue §5)

- **§5.9 A packet's path:** One topology-with-headers model for the path pages (ARP, hop rewrite, traceroute). Tunnels (VXLAN, GRE, WireGuard, IPsec) are presets of net-encapsulation. net-packet-journey is the capstone and links into each, like ossimulator's journey.

## Model and presets

- **Scene:** two protocol stacks side by side, sender (student's computer) on the left and receiver (web
  server) on the right, four TCP/IP layers each (application, transport, network, link) with the physical
  medium as a strip between them. Under the stacks, one large **PDU strip**: the unit as it is now, drawn
  as nested boxes (outermost header on the left, Ethernet FCS trailer on the right), each block labelled
  with its name and size in octets, and the unit's name (data, segment/datagram, packet, frame) above it.
- **State:** `{ phase: 'down'|'wire'|'up'|'done', layer, pdu: [{kind, layer, bytes, label}], side }`.
  `pdu` is the list of blocks outside-in; everything is derived from the preset's payload and protocol set.
- **One step:** going down, one layer adds its header (and the link layer its trailer) and the strip
  renames the unit; one step puts the frame on the wire; going up, one layer reads and strips its own
  header and hands the rest up. Order within a step: highlight the layer → add/remove the block → rename
  the unit → caption.
- **Rules:**
  1. Going down, each layer prepends its header to the PDU received from above; it never reads or changes
     the inside (URM `04-slojeviti-modeli.md` "Enkapsulacija, dekapsulacija i imena podatkovnih jedinica",
     RFC 1983 "Encapsulation").
  2. Order of adding is application data → transport → network → link, so the link header ends up
     outermost and the data innermost (URM ch04 Primjer 2).
  3. The link layer (Ethernet) adds a header in front **and** the FCS trailer behind (URM ch04 same section;
     `07-podatkovni-sloj.md` "Građa Ethernet okvira i MAC adresa").
  4. Sizes: TCP header 20 B without options (URM ch13 "Zaglavlje TCP-a"), UDP 8 B (RFC 768), IPv4 20 B
     without options (URM ch08, IHL = 5), Ethernet 6+6+2 = 14 B header + 4 B FCS (URM ch07). Preamble and
     SFD (8 B) are shown on the wire step but not counted in the frame length (URM ch07).
  5. Edge case: if the packet is shorter than 46 B, the link layer pads it so the frame is 64 B (URM ch07).
  6. Names: data → segment (TCP) or datagram (UDP) → packet → frame (URM ch04, same section; Primjer 4 says
     the names are a teaching convention, not a strict rule).
  7. Going up, each layer removes exactly the outermost block that belongs to it, in reverse order of
     adding, until only the original data is left (URM ch04, "Dekapsulacija"; Primjer 2, last sentence).
- **Params:** `proto` choice `tcp`|`udp` (default `tcp`); `payload` range 0–1460 B, step 10 (default from
  preset); `showSizes` toggle (default on).
- **Presets:**
  1. `http-get` — the chapter 3 path: an HTTP GET of 300 B over TCP. Sizes 300 → segment 320 → packet 340 →
     frame 358 B (+8 B preamble/SFD on the wire). From URM ch04 Primjer 2 (order); byte count derived.
  2. `dns-udp` — a 40 B DNS query over UDP: 40 → datagram 48 → packet 68 → frame 86 B. Derived, unchecked.
  3. `pure-ack` — a TCP ACK with no data: segment 20 → packet 40 → 6 B padding → frame 64 B (rule 5).
     Derived from URM ch07 minimum frame.
  4. `full-frame` — 1460 B of data over TCP: 1480 → 1500 (the Ethernet maximum payload) → frame 1518 B.
     From URM ch07 (1518) and ch08 (1500 octets).
  5. `gre-tunnel` — the `http-get` packet (340 B) wrapped again: GRE 4 B + outer IPv4 20 B → 364 B, then
     Ethernet → 382 B. Shows a tunnel as one more envelope (§5.9). From RFC 2784 (GRE header 4 B without
     options); derived, unchecked.
- **Steps:** 1 start + 4 down + 1 wire + 4 up = 10 for presets 1–4; 12 for `gre-tunnel` (GRE+outer IP added
  and removed as one extra step each way).
- **Legend:** application data (c1), transport header (c2), network header (c3), link header and FCS (c4,
  hatched trailer), padding (hollow), tunnel header (c5); "changed" marks the block just added or removed
  and the layer that did it.
- **Captions:**
  - hr: "Mrežni sloj dodaje zaglavlje IP-a (20 okteta) ispred segmenta; nastaje *packet* (paket) od 340
    okteta. Unutrašnjost ne čita."
  - en: "The receiver's link layer checks the FCS and strips the Ethernet header and trailer; the 340-byte
    packet goes up to the network layer."
- **Terms:** encapsulation — enkapsulacija; decapsulation — dekapsulacija; protocol data unit (PDU) —
  protokolna podatkovna jedinica; header — zaglavlje; trailer — podnožje; frame — okvir; packet — paket;
  segment / datagram — segment / datagram.
- **Misconceptions:** the RFC's outside-in listing is the order headers are added (it is the reverse,
  ch04); every layer adds only a header (Ethernet adds a trailer too); intermediate layers read the data
  inside.
- **Out of scope:** what switches and routers read and rewrite on the way (`net-hop-rewrite`); header field
  contents; IPv6; fragmentation; physical-layer coding.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `encapsulation` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh encapsulation sims/encapsulation` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/encapsulation/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
