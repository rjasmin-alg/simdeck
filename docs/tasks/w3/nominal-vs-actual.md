# nominal-vs-actual: Nominal vs actual throughput

| | |
|---|---|
| Task | `nominal-vs-actual` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-nominal-vs-actual` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/nominal-vs-actual/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `physical-layer` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `delay-components` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **overhead, half duplex and retries eat the link rate**.

The student: toggle overheads, watch goodput.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/delay-components/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/06-fizicki-sloj.md` (Uvod u računalne mreže), section "Kako signal nosi bitove" → "Što treba znati" (nazivna propusnost, ostvarena brzina prijenosa, the three reasons: coding, framing, shared medium/kolizija; dupleks), "Šire o temi" → "Zašto riječ „brzina" za propusnost zapravo nije točna", **Primjer 1** (100 Mb/s advertised, 82 Mb/s measured) and **Primjer 4** (11 MB/s ≈ 88 Mb/s → a 100 Mb/s link)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch06-nazivna-propusnost-ostvarena-brzina.svg` (the road analogy)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md`, "Građa Ethernet okvira i MAC adresa" (preamble 7 + SFD 1, header 6+6+2, payload 46–1500, FCS 4; 64 and 1518 octet frames)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, row "6 · Signal i medij" (the planned card: nazivna naspram ostvarene brzine)
- RFC 5136 "Defining Network Capacity" (quoted in ch06); IEEE 802.3 clause 4.4.2 (interpacket gap 96 bit times = 12 octets) *(check)*; RFC 791 (IPv4 header 20 B), RFC 9293 (TCP header 20 B)
- Catalogue seed: URM card ch06

## Model and presets

- **Scene:** one horizontal bar the width of the **nominal bandwidth** (nazivna propusnost), cut into stacked segments from left to right: useful data (goodput), TCP/IP headers, Ethernet header + FCS, preamble/SFD + interframe gap, then "lost to sharing" and "lost to retries". Above the bar, the road analogy from the book (lanes = nominal, cars that reach the finish = achieved). Under the bar, one frame drawn to scale with its byte counts, and a result box: achieved throughput (ostvarena brzina prijenosa) in Mb/s and in MB/s, plus frames per second.
- **State (derived, explorer):** `{ wireBytes, dataBytes, efficiency, goodputBps, perStationBps, fps, segments: [{kind, bits}] }`; pure function of the params.
- **What the params drive live:** each toggle removes or adds its segment; payload size redraws the frame; stations and loss shrink the last segments; the unit toggle switches the result between bits and bytes.
- **Rules:**
  1. Bytes on the wire per frame = max(P, 46) + 18 (Ethernet header 14 + FCS 4) + 20 (preamble/SFD 8 + interframe gap 12), where P is the IP packet size; a packet under 46 B is padded (URM `07-podatkovni-sloj.md` "Građa Ethernet okvira"; IFG 12 B per IEEE 802.3 *(check)*).
  2. Useful data per frame = P − 40 with TCP/IPv4 headers on (20 + 20, no options), or P with them off (RFC 791, RFC 9293; URM ch08, ch13).
  3. Efficiency = data / wire bytes; goodput = nominal × efficiency (derived). Frames per second = nominal / (8 × wire bytes).
  4. Shared medium (URM ch06, third reason): with n stations sending at once on one half-duplex medium, each gets goodput / n (derived; collisions and backoff ignored, named in the caption).
  5. Duplex: on full duplex both directions get the full rate at once; on half duplex with traffic in both directions, each direction gets half (URM ch06 "Dupleks"; derived split).
  6. Retries: with frame loss p and each lost frame resent until it arrives, goodput × (1 − p) (derived, unchecked).
  7. Units: MB/s = Mb/s ÷ 8 (decimal prefixes, URM ch06 Primjer 4 and "bajt ima osam bitova").
  8. Line coding does **not** appear as a segment: the advertised Ethernet rate (10/100/1000 Mb/s) is already the data rate after coding (Manchester 20 Mbaud for 10 Mb/s, 4B/5B 125 Mbaud for 100 Mb/s) *(check: IEEE 802.3 clauses 14, 24)*. The explanation says so and links `line-coding`.
- **Params:** `rate` choice 10 | 100 | 1000 Mb/s, default 100; `packet` range 46–1500 B, step 2, default 1500; `l1` toggle preamble + gap, default on; `l2` toggle Ethernet header + FCS, default on; `l34` toggle TCP/IP headers, default on; `duplex` choice `full` | `half-both`, default `full`; `stations` range 1–8, default 1; `loss` range 0–30 %, step 1, default 0; `unit` choice `Mb/s` | `MB/s`, default `Mb/s`.
- **Presets:**
  1. `book-ex1` — 100 Mb/s, 1500 B, all overheads, no loss: 1460 / 1538 = 94.93 % → **94.93 Mb/s**, 8,127 frames/s. The book's 82 Mb/s is lower still; the caption says headers alone explain about 5 Mb/s, the rest needs sharing or retries (try `loss` 14 % → 81.6 Mb/s). From URM ch06 Primjer 1 (scenario); numbers derived.
  2. `book-ex4` — 100 Mb/s, all overheads, loss 7 %, unit MB/s: 94.93 × 0.93 = 88.3 Mb/s = **11.0 MB/s**, the browser's "about 11 MB/s"; on 1 Gb/s the same would be 110.4 MB/s. From URM ch06 Primjer 4; loss value derived.
  3. `tiny-frames` — 1 Gb/s, packet 46 B (64 B frame): 6 B data per 84 B on the wire = 7.14 % → 71.4 Mb/s at **1,488,095 frames/s**. Derived (the 1.488 Mpps line rate is the standard figure *(check)*).
  4. `gigabit-full` — 1 Gb/s, 1500 B: 949.3 Mb/s = 118.7 MB/s; with `l1` off 961.8 Mb/s, showing that the gap and preamble cost 1.3 %. Derived.
  5. `shared-hub` — 100 Mb/s, half duplex, 3 stations: 94.93 / 3 = **31.6 Mb/s** each. Derived from URM ch06 third reason and ch07 "Koncentrator".
- **Steps:** none (explorer).
- **Legend:** useful data (c1, solid), TCP/IP headers (c2), Ethernet header + FCS (c3), preamble + gap (c4, hatched), shared with others (c5, hollow), retries (danger, cross-hatched). "Changed" marks the segment the last param change added, removed or resized.
- **Captions:**
  - hr: "Od 1538 okteta na žici korisno je 1460: *achieved throughput* (ostvarena brzina prijenosa) je 94,9 Mb/s na vezi nazivne propusnosti 100 Mb/s, bez ikakvog kvara."
  - en: "Three stations share one half-duplex medium: each gets 31.6 Mb/s of the nominal 100 Mb/s. Nothing is broken; the medium is shared."
- **Terms:** nominal bandwidth — nazivna propusnost; achieved throughput — ostvarena brzina prijenosa; overhead — režijski trošak; frame — okvir; preamble — preambula; frame check sequence — provjera ispravnosti okvira (FCS); full / half duplex — puni dupleks / polu-dupleks; collision — kolizija.
- **Misconceptions:** (1) "Measured below advertised means a fault" (URM ch06 Primjer 1). (2) "11 MB/s on a 100 Mb/s link is slow": units differ by 8 (Primjer 4). (3) "Line coding lowers the advertised data rate": see rule 8.
- **Out of scope:** queueing and latency (that is `delay-components`); TCP windows and congestion control; Wi-Fi MAC timing (DIFS, SIFS, backoff, block ACK); PPPoE/VLAN tags (could be a later toggle); collision and backoff dynamics (`net-csma-cd`).
- **Builds on `delay-components`:** reuse its link-rate and packet-size params, its "transmission delay = size / rate" helper (frames per second is its reciprocal) and its unit formatting; new here are the overhead segments, sharing and loss.
- **Note for the coordinator:** URM ch06 ("Prvo, sama shema kodiranja pojede dio nazivnog kapaciteta", and Primjer 4's "razlika … dolazi od troška kodiranja i uokvirivanja") says coding eats nominal capacity. For Ethernet the nominal rate is quoted after coding, so this sim leaves coding out (rule 8). Worth a word with the book's author before the demo contradicts the text.
<!-- model: filled -->

## Steps

1. `kit/new-sim.sh nominal-vs-actual sims/nominal-vs-actual` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/nominal-vs-actual/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
