# ethernet-frame: Anatomy of an Ethernet frame

| | |
|---|---|
| Task | `ethernet-frame` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-ethernet-frame` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/ethernet-frame/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `ethernet` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `encapsulation` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **fields, minimum size, padding, FCS**.

The student: edit the payload, see padding and FCS.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/encapsulation/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` (Uvod u računalne mreže): "Građa Ethernet okvira i MAC adresa" (fields, 64/1518 B, padding, preamble/SFD not counted; footnotes ieee-frame-format, ieee-frame-sizes), "Okviri veći od 1500 okteta: zašto „jumbo" ne znači standardiziran" (footnote ieee-jumbo), the CSMA/CD paragraph on the 64 B minimum (footnote emory-slottime), Primjer 1 "što govori sama MAC adresa" (I/G and U/L bits)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch04-enkapsulacija-dekapsulacija.svg` (frame with header and trailer); there is no ch07 frame diagram
- IEEE 802.3 clause 3 "Media Access Control (MAC) frame and packet specifications": §3.2.6 Length/Type, §3.2.8 Pad, §3.2.9 FCS (clause numbers (check)); RFC 826 (ARP packet, 28 B for IPv4 over Ethernet)
- Catalogue seed: URM ch07

## Model and presets

- **Scene:** one Ethernet frame drawn as a horizontal **field strip** (kit bit/field strip), each field
  proportional in width (with a minimum width) and labelled with name and size: preamble 7 + SFD 1 (greyed,
  "not counted"), destination 6, source 6, length/type 2, payload, pad (if any), FCS 4. Above the strip, a
  ruler with the running octet count and two marks at 64 and 1518. Below, the payload editor (a text box or
  size slider) and the FCS panel: sent FCS, recomputed FCS, match / mismatch.
- **State (explorer):** `{ dst, src, type, payloadLen, payloadBytes, flipBit: index | null }` → derived
  `{ padLen, frameLen, fcsSent, fcsRecv, verdict: 'ok'|'too-long'|'fcs-error' }`.
- **What the params drive live:** payload length moves the pad and the frame length; any change to
  addresses, type or payload changes the FCS; "flip a bit in transit" makes the receiver's FCS differ.
- **Rules:**
  1. Field order and sizes: preamble 7 B, SFD 1 B, destination 6, source 6, length/type 2, data 46–1500,
     FCS 4 (URM `07-podatkovni-sloj.md` "Građa Ethernet okvira i MAC adresa", footnote ieee-frame-format:
     IEEE 802.3 Figure 3-1).
  2. Frame length is counted from the destination address to the FCS; preamble and SFD are not counted
     (same section).
  3. Minimum 64 B = 6 + 6 + 2 + 46 + 4; maximum 1518 B = 6 + 6 + 2 + 1500 + 4 (same section, footnote
     ieee-frame-sizes).
  4. Padding: if the data is shorter than 46 B, pad bytes (zeros) are added after it so the frame reaches
     64 B: pad = max(0, 46 − data) (same section; IEEE 802.3 §3.2.8 (check clause)).
  5. Data over 1500 B is not a valid basic frame; the page refuses it and says the network layer must send
     smaller packets (fragmentation, `fragmentation-pmtud`). Jumbo frames are a vendor extension, not
     802.3 (ch07 "Okviri veći od 1500 okteta").
  6. Length/type: a value ≥ 0x0600 (1536) is an EtherType (0x0800 IPv4, 0x0806 ARP, 0x86DD IPv6); a value
     ≤ 1500 is a length (IEEE 802.3 §3.2.6 (check clause); EtherType values from the IEEE registry (check)).
  7. FCS = CRC-32 over destination through pad, computed by the sender and recomputed by the receiver; a
     mismatch means the frame is discarded silently (ch07 "Građa…", FCS bullet; IEEE 802.3 §3.2.9). Use the
     standard reflected CRC-32 (the same as zlib), test vector "123456789" → 0xCBF43926.
  8. A frame shorter than 64 B is treated by the receiver as a collision fragment and dropped (ch07, footnote
     emory-slottime); the page cannot produce one, but the explanation says why the floor exists.
  9. Edge: the I/G bit of the destination (lowest bit of the first octet) shows unicast / multicast;
     FF-FF-FF-FF-FF-FF is broadcast (ch07 same section, Primjer 1). Shown as a tag on the destination field.
- **Params:** `payload` range 0–1500 B (default from preset), `type` select IPv4 / ARP / IPv6 (default
  IPv4), `dst` select unicast AC-DE-48-23-45-67 / broadcast / multicast 01-00-5E-00-00-01 (default unicast),
  `flip` button "flip one bit in transit", `fix` button "clear the error".
- **Presets:**
  1. `arp-request` — ARP request (28 B) to FF-FF-FF-FF-FF-FF, type 0x0806: pad 18 B, frame 64 B. Derived from
     ch07 rules; ARP size (check, RFC 826 for IPv4/Ethernet).
  2. `exact-minimum` — 46 B of data: no pad, 64 B. From ch07 (6+6+2+46+4).
  3. `tcp-ack` — a 40 B IPv4+TCP packet with no data: pad 6 B, frame 64 B. Derived.
  4. `full-frame` — 1500 B: frame 1518 B, 1526 B on the wire with preamble and SFD. From ch07.
  5. `bit-flip` — preset 4 with one bit flipped in transit: recomputed FCS ≠ sent FCS → discarded. From ch07
     FCS bullet; value computed by the page.
  6. `too-big` — 1501 B: refused (rule 5). From ch07 and footnote ieee-jumbo.
- **Steps:** none (explorer).
- **Legend:** addresses (c1), length/type (c2), data (c3), pad (hollow, hatched), FCS (c4), preamble/SFD
  (muted, dashed: not counted); "changed" marks the fields whose size or value changed on the last edit.
- **Captions:**
  - hr: "Podaci imaju 28 okteta, pa se dodaje 18 okteta *padding* (nadopune) da okvir dosegne najmanjih 64
    okteta."
  - en: "One bit flipped on the wire: the receiver's CRC-32 is 0x… instead of the sent 0x…, so the frame is
    dropped without notice."
- **Terms:** frame — okvir; header — zaglavlje; trailer — podnožje; frame check sequence (FCS) — provjera
  ispravnosti okvira; preamble — preambula; start frame delimiter — graničnik početka okvira; padding —
  nadopuna (check term); destination / source address — odredišna / izvorišna adresa.
- **Misconceptions:** the preamble counts toward the 64 B minimum; FCS errors are reported back to the
  sender (they are dropped silently); the 1500 B limit is the frame size (it is the payload).
- **Out of scope:** the 802.1Q tag and 1522 B (`vlan-trunk`), how CRC is computed step by step (`crc`),
  collision handling (`csma-cd`), interframe gap, line coding.
- **Reuse:** from `encapsulation` reuse the block drawing of headers and the link-layer trailer; new here
  are field-level sizes, padding, the type rule and the FCS check.
- **Note for the coordinator:** the `bit-flip` preset touches `crc-error-detection`'s concept; keep the
  arithmetic there and only the verdict here.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ethernet-frame sims/ethernet-frame` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ethernet-frame/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
