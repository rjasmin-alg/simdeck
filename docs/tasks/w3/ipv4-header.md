# ipv4-header: IPv4 header fields

| | |
|---|---|
| Task | `ipv4-header` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-ipv4-header` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/ipv4-header/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `ip` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `hop-rewrite` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **what each field does and which change in transit**.

The student: click fields, see their role.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/hop-rewrite/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md` §"Građa IP zaglavlja: koja polja nešto znače" (Što treba znati, Šire o temi), Primjer 3 (zašto se paket cijepa), Primjer 7 (čitanje zaglavlja); diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch08-ipv4-zaglavlje.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` Primjer 1 (TTL 64 → 63) and §"NAT", Šire o temi (checksum fix-up); diagram `ch11-skok-sto-se-mijenja.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, "Primijenjeno: 11 stranica", group 1 card "IPv4 zaglavlje — polje po polje, s učinkom promjene"
- RFC 791 §3.1 (header format), §3.2 (fragmentation); RFC 1812 §5.2.2, §5.3.1; RFC 1071 (checksum); RFC 2474 §3 (DSCP); RFC 3168 §5 (ECN); RFC 1191 §3 (DF); RFC 3022 §4.1; IANA Protocol Numbers registry
- Catalogue seed: URM card ch08 (IPv4 header)

## Model and presets

- **Scene:** the IPv4 header as a field strip (kit "bit / field strip"): five 32-bit rows, field widths proportional to bits, as in `ch08-ipv4-zaglavlje.svg`; an Options row appears only when IHL > 5. Under it an info card for the selected field, and a row of example values for one packet. Above the strip a small path A → R1 → (R2) → B from `hop-rewrite`.
- **State:** `{ packet: {version, ihl, dscp, ecn, totalLength, id, df, mf, fragOffset, ttl, protocol, checksum, src, dst}, view, selected, changed: [fieldKeys] }`. Reference page: no steps; params drive the view live.
- **What the params drive:** `field` selects the info card; `view` lights the fields that change in that situation (`.sd-changed`) and shows before → after values.
- **Rules:**
  1. Twelve fixed fields in this order and width: version 4, IHL 4, type of service 8, total length 16, identification 16, flags 3, fragment offset 13, TTL 8, protocol 8, header checksum 16, source 32, destination 32 = 160 bits = 20 bytes (book ch08 "Građa IP zaglavlja", Šire o temi; RFC 791 §3.1).
  2. IHL counts 32-bit words: header bytes = IHL × 4; data bytes = total length − IHL × 4; IHL < 5 is invalid (RFC 791 §3.1; book ch08 Primjer 7).
  3. Total length is 16 bits, so a packet is at most 65 535 octets (book ch08; RFC 791 §3.1).
  4. Protocol values shown: 1 ICMP, 6 TCP, 17 UDP (IANA Protocol Numbers; RFC 791 §3.1).
  5. The type-of-service byte is shown as DSCP (6 bits) + ECN (2 bits) (RFC 2474 §3, RFC 3168 §5); the book's label "vrsta usluge" stays as the field name.
  6. Every hop: TTL − 1 and header checksum recomputed; nothing else changes (RFC 1812 §5.3.1 TTL, §5.2.2 checksum; book ch11 Primjer 1, 64 → 63). Source and destination never change on a plain router (book ch11 "Usmjeravanje").
  7. Fragmenting: identification copied unchanged to every fragment; each fragment gets its own header with its own total length, MF = 1 on all but the last, fragment offset in 8-octet units; checksum recomputed (RFC 791 §3.2; book ch08 Primjer 3). DF = 1 forbids fragmenting (RFC 791 §3.1).
  8. Through NAT: source address (outbound) and the header checksum change, plus TTL as on any hop (book ch11 "NAT", Šire o temi; RFC 3022 §4.1 (check)).
  9. Checksum is the one's complement of the one's complement sum of the header's 16-bit words with the checksum field at 0 (RFC 791 §3.1; RFC 1071); the model computes it, the page never hard-codes it.
  10. Tie-break: a field that changes in two views (TTL, checksum) is lit in each; the info card lists every situation in which it changes, ordered hop, fragment, NAT.
- **Params:** `field` select (13 entries incl. options), default `ttl`; `view` choice `role | hop | fragment | nat`, default `role`; `df` toggle, default off (only in `fragment`; on → "would be dropped, ICMP frag needed" note, details belong to `fragmentation-pmtud`).
- **Presets (5):**
  1. `read` — Primjer 7: IHL 5, total 1240, 192.168.1.10 → 192.168.2.50; card shows header 20 B, data 1220 B. From book ch08 Primjer 7.
  2. `hop` — view hop: TTL 64 → 63, checksum recomputed, src 192.168.1.10 / dst 192.168.2.20 unchanged. From book ch11 Primjer 1.
  3. `fragment` — 1400-octet packet (IHL 5) into an MTU of 500: three fragments, total lengths 500, 500, 440, offsets 0, 60, 120 (×8 = 0, 480, 960 bytes of data), MF 1, 1, 0, same identification. Scenario from book ch08 Primjer 3; numbers derived, unchecked against a capture.
  4. `nat` — 192.168.1.10 → 8.8.8.8 leaves as 203.0.113.5 → 8.8.8.8 (RFC 5737 documentation address); lit: source, TTL, checksum. Derived, unchecked.
  5. `df` — the fragment preset with DF = 1: nothing is fragmented, the card says the router drops it (RFC 791 §3.1, RFC 1191 §3). Derived.
- **Steps:** none (reference/explorer).
- **Legend:** field groups by role (`--c1` addressing, `--c2` fragmentation, `--c3` lifetime/integrity, `--c4` format: version, IHL, total length, protocol, ToS) with labels; "changed" = highlighter + outline on fields that change in the chosen view.
- **Captions:**
  - hr: „Na svakom skoku mijenjaju se samo dva polja: *TTL* (vrijeme života) 64 → 63 i kontrolni zbroj zaglavlja. Izvorišna i odredišna adresa ostaju iste."
  - en: "At every hop only two fields change: TTL 64 → 63 and the header checksum. Source and destination stay the same."
- **Terms:** header — zaglavlje; Internet Header Length (IHL) — duljina zaglavlja; total length — ukupna duljina; identification — identifikacijski broj; fragment offset — pomak fragmenta; time to live — vrijeme života; header checksum — kontrolni zbroj zaglavlja; flags — zastavice.
- **Misconceptions:** IHL is bytes (it is 32-bit words); routers rewrite the IP addresses (only NAT does); TTL is time in seconds (it is a hop count in practice, RFC 1812 §5.3.1).
- **Reused from `hop-rewrite`:** the packet object and its field names, the per-hop rule (TTL − 1, checksum, MACs outside the IP header). New: the full field strip, IHL/length arithmetic, the fragment and NAT views.
- **Out of scope:** options in detail, IPv6 header, the fragmentation/PMTUD algorithm itself (`fragmentation-pmtud`), checksum arithmetic step by step.
- **Note for the coordinator:** the class is `reference`, but sim-ui.md says a reference page has no params and no presets; this spec needs a `view` choice and presets. Suggest class `explorer`, or accept presets on a reference page.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ipv4-header sims/ipv4-header` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ipv4-header/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
