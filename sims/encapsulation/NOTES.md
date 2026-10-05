<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# encapsulation: notes

New stepper (task `docs/tasks/w2/encapsulation.md`, catalogue `net-encapsulation`, §4.1 and §5.9, wave 2b). No kit
view: the task names none, and the scene (two stacks and a strip of nested blocks) is not one of K1–K4. Rules and
expected numbers: `SPEC.md`.

## Decisions

- **Scene.** Two stacks (sender left, receiver right) with the unit's name and length between them and the physical
  medium as a dashed strip under both. Each layer box carries its layer's series colour as a left stripe, its
  protocol (TCP/UDP, IPv4, GRE + IPv4, Ethernet) and, once it has acted, what it did (`+20 B`, `−18 B`, "creates
  300 B", "reads 300 B"). Idle layers are dashed and muted, done layers solid, the acting layer highlighted
  ("changed"). The arrow between the stacks shows the direction (↓ down, → wire, ↑ up, ✓ done).
- **PDU strip.** A CSS grid: one column per block, `minmax(<min>rem, <octets>fr)`, so the data block takes the room in
  proportion to its size while a 4-octet FCS stays readable. Above the blocks one bracket per unit nested in the PDU
  (frame, outer packet, packet, segment or datagram, data), outermost on top and bold. The brackets come from the
  model (`units()`): the frame spans header to FCS; a packet, segment or datagram spans its header to the end of the
  data, so padding and FCS sit under the frame bracket only.
- **Removed blocks stay one step as ghosts** (dashed, struck through, highlighted) on a strip step, so the student
  sees what the layer took away and from which side (the link layer takes the front and the back).
- **The wire step** puts a dotted "preamble + SFD, 8 B, not counted" block in front of the frame, outside the frame
  bracket, and the middle shows "on the wire 366 octets (with preamble)".
- **Padding** is a hollow dashed block between the packet and the FCS (rule 5); the receiving link layer strips it
  with its header and trailer. In a real stack with the type field the Ethernet layer cannot tell padding from data;
  the receiving IP layer drops it using its Total Length (RFC 894). The page keeps the teaching version (the layer
  that added it takes it away) and does not show IP's Total Length (header field contents are out of scope).
- **`pure-ack` has a 0-octet data block**, drawn hollow ("data 0 B"), so the bracket "data · 0 octets" still marks
  where application data would be; the captions say there is no data.
- **Names on the stage are in the page language** (okvir, paket, segment, datagram, podaci); captions use the term
  rule (*packet* (paket) on the Croatian page) with `*word*` → `<em lang="en">` for the terms not in the glossary,
  and `[[frame]]`, `[[trailer]]` from it.
- **The hr network caption** is the task's: "Mrežni sloj dodaje zaglavlje IP-a (20 okteta) ispred segmenta; nastaje
  *packet* (paket) od 340 okteta. Unutrašnjost ne čita." The en link-strip caption is the task's too ("…the
  340-octet packet goes up to the network layer"; octets, not bytes, as everywhere on the page).
- **Sender and receiver** are "a computer" and "web server" (the chapter 3 path), no names.
- **Payload slider** goes to 1460, or 1430 with the tunnel (SPEC rule 9), so the outer packet stays within 1500 B and
  fragmentation never comes up.
- **The tunnel toggle resets to step 0** (`resets: true`): it changes the number of steps (9 ↔ 11).

## Deviations from the task

- **Steps: 9 and 11 in the kit's count, not 10 and 12.** The task counts "1 start + 4 down + 1 wire + 4 up = 10":
  that includes the start, which is the kit's step 0. The scrubber has 10 positions (0–9), and `sim.json` `steps` is
  9 (11 with the tunnel). The start shows the empty stacks ("nothing sent yet"); step 1 is the application creating
  the data, so all four sender layers have a step of their own.
- **A `tunnel` param** (toggle, default off) is added to the task's params (`proto`, `payload`, `showSizes`), so the
  `gre-tunnel` preset is a param set like the others.
- **State shape:** as the task's, plus `action`, `added` and `removed` (what this step did), and without `label` in
  the blocks (the page derives the label from `kind`; labels are language).
- **Units with the tunnel:** the strip names the GRE-wrapped unit "outer packet" (vanjski paket) and shows both
  packet brackets; the task does not name it.

## Sources

- Task file, model and presets.
- URM `book/chapters/04-slojeviti-modeli.md` "Enkapsulacija, dekapsulacija i imena podatkovnih jedinica" (RFC 1983
  definition, order of adding vs reading, Ethernet trailer, decapsulation, names), Primjer 2 (order), Primjer 4
  (names are a convention); figure `assets/diagrams/ch04-enkapsulacija-dekapsulacija.svg`.
- URM `07-podatkovni-sloj.md` "Građa Ethernet okvira i MAC adresa" (6 + 6 + 2 header, 46–1500 payload, 4 B FCS,
  64/1518, padding, 7 + 1 preamble/SFD not counted).
- URM `08-mrezni-sloj.md` (IPv4 20 B, IHL = 5), `13-transportni-sloj.md` (TCP 20 B, Data Offset = 5),
  `03-put-podataka.md` "Put kroz mrežu" (the scenario).
- RFC 1983 "Encapsulation"; RFC 768 (UDP header 8 B); RFC 2784 §2.1 (GRE header 4 B with C = 0); RFC 894 (padding,
  46-octet minimum data field).
- `dns-udp` (40 B query) and `gre-tunnel` sizes are derived, *(check)* as the task marks them.

## Checks

- Numbers: an independent Python script before the model (SPEC.md "Expected numbers", "Other checks"); the model
  agrees (`sim.test.js`, rule 4).
- Rule tests broken on purpose, 24 mutations one at a time, every one caught: prepend → append, the inside changed,
  network before transport, no FCS, FCS in front, TCP 24 / UDP 20 / Ethernet 18 / GRE 8, padding at ≤ 46, padding to
  a 64 B packet, padding after the FCS, no padding, UDP named segment, IP named frame, a network layer that also
  strips the transport header, stripping in adding order, a link layer that leaves the FCS, a tunnel with GRE only,
  GRE and outer IPv4 swapped, no 1430 limit with the tunnel, preamble 7, a wire step that adds a block, no wire step.
- Fresh review (a separate agent read the diff against `SPEC.md`, broke rules in a scratch copy and read every
  caption of every preset in both languages). Fixed from it: the link-strip caption with the tunnel said the packet
  goes up to the network layer (it goes to the tunnel); a UDP start with 0 B called the unit an ACK; "preko TCP" for
  "preko TCP-a" on the Croatian start; the pure-ACK transport caption said "in front of the data". Tests added for
  the `up` phase, the wire step's layer and a literal 1500 B limit (the old test compared with the model's own
  constant). Numbers, SPEC against the task and COMMON.md rules: no findings.
- `npm run gate -- encapsulation`: all checks pass (manifest, 18 model tests, build, 62 browser checks, tokens,
  scope), 0 exceptions declared.
- Screenshots reviewed at 1920×1080 (light, dark, grayscale) and 375×812, hr and en, plus the wire step of
  `gre-tunnel` and `full-frame`, the link strip of `pure-ack` (ghosts with padding) and the tunnel strip in dark.
  Grayscale: blocks and layers carry their protocol name, so the similar greys of the series colours do not matter;
  the FCS is hatched, padding and preamble hollow, the changed block outlined.
- On a phone the PDU strip can be wider than the screen at the wire step with the tunnel; it scrolls inside its own
  box (the page does not scroll sideways).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| encapsulation | enkapsulacija | URM ch04 |
| decapsulation | dekapsulacija | URM ch04 |
| protocol data unit (PDU) | protokolna podatkovna jedinica | URM ch04 |
| packet | paket | URM ch04 |
| segment | segment | URM ch04 |
| datagram | datagram | URM ch04 |
| padding | nadopuna | URM ch07 ("okvir se nadopunjuje") *(check)* |
| frame check sequence (FCS) | provjera ispravnosti okvira | URM ch07 |
| preamble | preambula | URM ch07 |
| start frame delimiter (SFD) | graničnik početka okvira | URM ch07 |

Used from the glossary: `header` (zaglavlje), `trailer` (podnožje), `frame` (okvir).

## Shared requests

None. The kit's legend has no hatched swatch; the page styles its own `data-shape="trailer"` swatch in its CSS.

## Tags

Topic `networks`, tag `encapsulation` (both in `tags.json`).

## Time

Start to done: one session, 07:56–08:15 on 2026-10-05 by the wall clock (about 20 minutes), including the review.
