# fragmentation-pmtud: Fragmentation and PMTUD

| | |
|---|---|
| Task | `fragmentation-pmtud` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-fragmentation-pmtud` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/fragmentation-pmtud/` |
| Class | explorer |
| Size | M |
| Priority | P2 |
| Courses | URM, NLA |
| Topic / tags / level | `networks` / `ip` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `hop-rewrite` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **fragments vs DF + ICMP "frag needed", and the PMTUD black hole**.

The student: sliders for MTU and overhead; block ICMP.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/hop-rewrite/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/single-page-labs/l2l3-protocols.html`: tab "07 · Fragmentation" (calculator `updateFrag()`: datagram size, link MTU, encapsulation overhead; DF/MF/offset tooltips; "Path MTU Discovery (PMTUD) — RFC 1191 (IPv4), RFC 8201 (IPv6)"; "MTU values by tunnel type")
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md` (Uvod u računalne mreže): "Građa IP zaglavlja: koja polja nešto znače" → Šire o temi (identification, fragment offset; footnotes rfc791-frag-nuzno, rfc791-frag-polja) and Primjer 3 "zašto se paket cijepa" (1400 B into 500 B)
- RFC 791 §3.2 (fragmentation and reassembly, 68 B minimum); RFC 792 (Destination Unreachable, code 4); RFC 1191 (Path MTU Discovery); RFC 2923 §2.1 (black-hole detection); RFC 8200 §5 and RFC 8201 (IPv6)
- Catalogue seed: spl-l2l3-protocols calculator

## Model and presets

- **Scene:** a path left to right: sender — R1 — link A (MTU 1500) — R2 — link B (MTU set by the slider, the
  bottleneck) — receiver, optionally with a tunnel drawn as a pipe on link B. Above link B, the packet as it
  leaves R2: one block, or a row of fragment blocks, each labelled total length, offset (in 8-byte units),
  MF and the shared Identification. Under the path, a short **outcome timeline** (3–5 rows): what the sender
  sent, what R2 did, what came back (an ICMP arrow, or nothing), what the sender did next.
- **State (explorer):** `{ size, mtuB, overhead, df, icmpBlocked, proto }` → derived `{ effMtu, fragments:
  [{len, offset, mf}], icmp: {type, code, nextHopMtu} | null, timeline: [...] }`.
- **What the params drive live:** size, link-B MTU and tunnel overhead recompute the fragments; DF switches
  between fragmenting and drop + ICMP; "block ICMP" turns the ICMP row into silence and the timeline into
  repeated retransmissions.
- **Rules:**
  1. Effective MTU = link MTU − tunnel overhead; a packet whose total length ≤ effective MTU passes
     unchanged (`l2l3-protocols.html` calculator; URM ch08 "Građa IP zaglavlja", Šire o temi).
  2. Fragmentation (DF = 0): every fragment gets its own IPv4 header (20 B, no options) and the same
     Identification; data per fragment = ⌊(effMtu − 20) / 8⌋ · 8, except the last; offset counts 8-byte units
     from the start of the original data; MF = 1 on every fragment but the last (URM `08-mrezni-sloj.md`
     "Građa IP zaglavlja" Šire o temi, footnotes rfc791-frag-nuzno, rfc791-frag-polja; RFC 791 §3.2).
  3. Fragments are reassembled only at the destination; losing one fragment loses the whole packet (ch08
     same paragraph; RFC 791 §3.2 reassembly timer).
  4. DF = 1 and too big: the router drops the packet and sends ICMP Destination Unreachable type 3 code 4
     "fragmentation needed and DF set", carrying the next-hop MTU (RFC 792; RFC 1191 §4; `l2l3-protocols.html`
     DF tooltip).
  5. PMTUD: the sender lowers its path MTU to the reported value and resends; TCP uses MSS = PMTU − 40
     (RFC 1191 §3 (check section); MSS arithmetic derived for IPv4 + TCP without options).
  6. Black hole: if a firewall drops that ICMP, the sender never learns; the small handshake packets pass but
     every full-size segment is lost, so the connection "hangs after connect" (RFC 2923 §2.1;
     `l2l3-protocols.html` "Failure mode: ICMP black holes"). Fixes: MSS clamping on the tunnel router, or
     allowing ICMP type 3 code 4.
  7. Edge: effMtu below 68 B is refused (RFC 791 minimum; the calculator's check). Size exactly = effMtu → no
     fragmentation.
  8. IPv6: routers never fragment; the same case gives ICMPv6 "Packet Too Big" (RFC 8200 §5, RFC 8201) —
     shown as a note when `proto` = IPv6, no fragments drawn.
- **Params:** `size` range 68–9000 B (default 1500); `mtuB` range 576–9000 B (default 1500); `overhead`
  select 0 / 4 (802.1Q) / 8 (PPPoE) / 24 (GRE) / 50 (VXLAN) B (default 0); `df` toggle (default off);
  `icmpBlocked` toggle (default off); `proto` choice IPv4 / IPv6 (default IPv4).
- **Presets:**
  1. `primjer-3` — URM ch08 Primjer 3: a 1400 B packet into a 500 B MTU, DF off → 3 fragments: 500 B (offset
     0, MF 1), 500 B (offset 60, MF 1), 440 B (offset 120, MF 0). Scenario from URM ch08 Primjer 3; numbers
     checked with a script.
  2. `just-over` — the calculator's default: 1600 B into 1500 → 1500 B (offset 0, MF 1) + 120 B (offset 185,
     MF 0). From `l2l3-protocols.html`; checked.
  3. `gre-tunnel` — a 1500 B packet into a GRE tunnel (overhead 24 → effective 1476), DF off → 1476 B (offset
     0) + 44 B (offset 182). Derived; checked.
  4. `pmtud` — 1500 B TCP segment with DF on, link B MTU 1400: R2 drops it and returns ICMP 3/4 with MTU
     1400; the sender resends at 1400 (MSS 1360). From RFC 1191; derived.
  5. `black-hole` — preset 4 with ICMP blocked: the handshake (60 B) passes, the 1500 B segment is
     retransmitted 3 times with no answer, the transfer stalls. From RFC 2923 and the l2l3 page; derived.
- **Steps:** none (explorer); the outcome timeline is static per setting.
- **Legend:** IP header (c3), data (c1), fragment boundary (dashed), ICMP message (c5 arrow), dropped
  (danger ✕), tunnel overhead (c4, hatched); "changed" marks the fragments or timeline rows that changed on
  the last input.
- **Captions:**
  - hr: "Paket od 1400 okteta ne stane u MTU od 500: R2 ga dijeli na tri fragmenta s pomakom 0, 60 i 120
    (u jedinicama od 8 okteta); samo zadnji ima MF = 0."
  - en: "DF is set and ICMP is blocked: the router drops the 1500-byte segment and says nothing, so the sender
    keeps retrying the same size. This is a PMTUD black hole."
- **Terms:** fragmentation — fragmentacija; fragment offset — pomak fragmenta; identification —
  identifikacijski broj; MTU — MTU (najveća jedinica prijenosa) (check term); Don't Fragment — zastavica DF
  (ne fragmentiraj); path MTU discovery — otkrivanje MTU-a puta (check term); black hole — crna rupa (check).
- **Misconceptions:** offsets count bytes (they count 8-byte units); routers reassemble fragments; blocking
  all ICMP is harmless.
- **Out of scope:** overlapping-fragment attacks, IPv6 fragment header details, PLPMTUD (RFC 4821, mentioned
  only), jumbo frames.
- **Reuse:** from `hop-rewrite` reuse the path drawing and the per-hop header view; new here are the
  fragment arithmetic, DF and the ICMP feedback.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `fragmentation-pmtud` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh fragmentation-pmtud sims/fragmentation-pmtud` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/fragmentation-pmtud/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
