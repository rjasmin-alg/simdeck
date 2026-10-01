# hop-rewrite: What changes at each hop

| | |
|---|---|
| Task | `hop-rewrite` (wave 2b, Network fundamentals) |
| Catalogue entry | `net-hop-rewrite` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/hop-rewrite/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | URM |
| Topic / tags / level | `networks` / `routing` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **MACs change per hop, IPs stay, TTL drops, checksum recomputed**.

The student: step a packet across two routers.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` (Uvod u računalne mreže): "Usmjeravanje: kako paket pronalazi put kroz mrežu" (TTL, new frame per segment, IPs stay), Primjer 1 (put paketa kroz usmjernik — A 192.168.1.10, R1, B 192.168.2.20, TTL 64 → 63)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch11-skok-sto-se-mijenja.svg` (the book's figure, numbers from Primjer 1)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md` "Građa IP zaglavlja: koja polja nešto znače" (header checksum field) and Primjer 5b (ARP for the gateway)
- RFC 791 (Header Checksum), RFC 1812 §5.3.1 (TTL decrement, Time Exceeded), RFC 1624 (incremental checksum update), RFC 792 (ICMP type 11)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, page 4 "Usmjeravanje", card "što se mijenja na svakom skoku"
- Catalogue seed: URM card ch11-skok-sto-se-mijenja → §5.9

## Overlaps (catalogue §5)

- **§5.9 A packet's path:** One topology-with-headers model for the path pages (ARP, hop rewrite, traceroute). Tunnels (VXLAN, GRE, WireGuard, IPsec) are presets of net-encapsulation. net-packet-journey is the capstone and links into each, like ossimulator's journey.

## Model and presets

- **Scene:** K2 topology in a row: A (192.168.1.10/24) — R1 (Gi0/0 192.168.1.1, Gi0/1) — [R2] — B. Each
  segment is labelled with its network. Above the moving packet, a **field strip** in two parts: the frame
  (dst MAC, src MAC, type, FCS) and the IP header (TTL, protocol, header checksum, src IP, dst IP). Fields
  that this hop changed are highlighted; fields that stayed are shown with a small "=" mark. A history
  table under the stage keeps one row per segment, so the student compares segment 1 to segment 3.
- **State:** `{ hop, at: node, segment, frame: {dstMac, srcMac, fcs}, ip: {ttl, proto, csum, src, dst},
  history: [{segment, dstMac, srcMac, ttl, csum}], dropped: null|{at, reason} }`.
- **One step:** either the packet crosses one segment (frame as built), or one router processes it in this
  order: strip and discard the frame → look up the destination network → TTL − 1 → if TTL = 0 drop and
  send ICMP Time Exceeded → recompute the header checksum → resolve the next-hop MAC (ARP shown as one
  line, cache assumed warm unless the preset says otherwise) → build a new frame with new src/dst MAC.
- **Rules:**
  1. Source and destination IP addresses stay the same end to end (URM `11-usmjeravanje.md` "Usmjeravanje:
     kako paket pronalazi put kroz mrežu", Primjer 1).
  2. Each router discards the incoming frame and builds a new one: src MAC = its outgoing interface, dst
     MAC = the next hop (next router or the destination host), resolved by ARP on that segment (URM ch11,
     same section; ch08 Primjer 5b).
  3. Each router decrements TTL by at least one (RFC 1812 §5.3.1; URM ch11 "TTL").
  4. If TTL reaches 0 the router discards the packet and sends ICMP Time Exceeded, type 11 code 0, to the
     source (RFC 1812 §5.3.1; URM ch11). Tie/edge: the check happens after the decrement, so a packet that
     arrives with TTL 1 dies at that router; a host receiving TTL 1 still accepts it.
  5. Because TTL is in the header, the IPv4 header checksum is recomputed at every hop (RFC 791 "Header
     Checksum"; RFC 1812 §4.2.2.5 (check section number); incremental update RFC 1624). TTL is the high byte
     of a 16-bit word, so TTL − 1 raises the checksum by 0x0100 (when no carry wraps).
  6. The FCS is recomputed for every new frame (it covers the frame, which is new) (URM ch07 FCS).
  7. Nothing else in the IP header changes on a plain router (no NAT, no options, no fragmentation).
- **Params:** `ttl0` range 1–64 (default 64); `routers` choice 1|2 (default from preset); `showChecksum`
  toggle (default on).
- **Presets** (header: total length 84, ID 0x1c46, DF, protocol 1 ICMP; MACs shortened to the last octet):
  1. `book` — URM ch11 Primjer 1: A → R1 → B (192.168.2.20/24), TTL 64 → 63; MACs: A→R1 Gi0/0 on segment 1,
     R1 Gi0/1→B on segment 2; IPs unchanged. Checksum 0x99f4 → 0x9af4. From URM ch11 Primjer 1 (checksum
     values derived, computed with the header above).
  2. `two-routers` — A → R1 → R2 → B (192.168.3.20/24), transit 10.0.0.0/30 between R1 and R2: TTL 64 → 63 →
     62, checksum 0x98f4 → 0x99f4 → 0x9af4, three different MAC pairs, the same IP pair. Derived, unchecked.
  3. `ttl-dies` — `two-routers` with TTL 2: R1 forwards with TTL 1, R2 decrements to 0, drops it and returns
     ICMP Time Exceeded (11/0) to 192.168.1.10. Derived from RFC 1812; links to `net-traceroute`.
  4. `cold-arp` — `book` with R1's ARP table empty for B: R1 holds the packet while it ARPs for 192.168.2.20
     on segment 2, then builds the frame. Derived (one extra step).
- **Steps:** `book` 5 (send, R1 process, segment 2, arrive, summary); `two-routers` 7; `ttl-dies` 6;
  `cold-arp` 7.
- **Legend:** frame fields (c4), IP header fields (c3), unchanged field ("="), changed field (highlight);
  dropped packet (✕); "changed" marks every field this hop rewrote.
- **Captions:**
  - hr: "R1 odbacuje stari okvir i gradi novi: izvorišna MAC adresa je sad njegovo sučelje Gi0/1, odredišna
    B-ova. IP adrese ostaju iste, TTL pada sa 64 na 63, pa se kontrolni zbroj zaglavlja ponovno računa."
  - en: "R2 decrements TTL from 1 to 0, so the packet stops here. R2 sends ICMP Time Exceeded back to
    192.168.1.10, the source address that never changed."
- **Terms:** hop — skok; router — usmjernik; time to live (TTL) — vrijeme života (TTL); header checksum —
  kontrolni zbroj zaglavlja; next hop — sljedeći skok; frame — okvir; source / destination address —
  izvorišna / odredišna adresa.
- **Misconceptions:** the destination MAC is B's from the start; routers rewrite the IP addresses (that is
  NAT, `urm-nat`); TTL counts seconds.
- **Out of scope:** routing table lookup rules (`urm-tablica-usmjeravanja`, longest prefix); NAT; IPv6 hop
  limit (could be a later preset: no header checksum in IPv6, RFC 8200); traceroute (`net-traceroute`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh hop-rewrite sims/hop-rewrite` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/hop-rewrite/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
