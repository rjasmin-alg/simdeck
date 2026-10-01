# ipv6-address-types: IPv6 address types and scopes

| | |
|---|---|
| Task | `ipv6-address-types` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-ipv6-address-types` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/ipv6-address-types/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `ipv6` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `ipv6-slaac` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **link-local, GUA, ULA, multicast and their reach**.

The student: classify addresses, see where they travel.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/ipv6-slaac/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/10-ipv6.md` §"Vrste IPv6 adresa i podmreža veličine /64", Primjer 1 (skraćivanje i prepoznavanje vrste), Primjer 2 (prepoznavanje vrste adrese po prefiksu), Pitanja 9–11; diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch10-vrste-adresa-prefiksi.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/skracivanje-zapisa-ipv6-adrese.html` (RFC 5952 notation, vocabulary)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, group 2 "IPv6": "vrste adresa i prefiksi"
- RFC 4291 §2.4, §2.5.2, §2.5.3, §2.5.6, §2.7; RFC 4193 §3, §3.1, §4.1; RFC 3849 (documentation prefix); RFC 5952; IANA IPv6 Address Space and IPv6 Multicast Address Space registries
- Catalogue seed: URM ch10

## Model and presets

- **Scene:** left, an address input and a prefix table (type, prefix, scope); the matching row lit, the bits that matched drawn in a 128-bit strip (bit / field strip). Right, a small topology: host H on link L1, router R1 (site border is R2), link L2 inside the site, internet cloud beyond R2. The address's reach is shaded on the topology.
- **State:** `{ address (normalised, RFC 5952), bits, type, scope, reach: 'host'|'link'|'site'|'global'|'none', matchedPrefix, note }`. Reference page: no steps; the input and presets drive it live.
- **What the params drive:** the address in `addr` is parsed, classified by rule 1, and its reach drawn.
- **Rules:**
  1. Classify by the most specific matching prefix (tie-break: longest match wins, so `2001:db8::/32` beats `2000::/3`): `::/128` unspecified, `::1/128` loopback, `fe80::/10` link-local, `fc00::/7` unique local (ULA), `ff00::/8` multicast, `2001:db8::/32` documentation, `2000::/3` global unicast (GUA); anything else "not assigned for unicast use" (book ch10 "Vrste IPv6 adresa", Primjer 2; RFC 4291 §2.4, §2.5.2, §2.5.3, §2.5.6, §2.7; RFC 4193 §3; RFC 3849; IANA IPv6 Address Space).
  2. Prefix length counts bits, not hex digits: `3ffe::1` is in `2000::/3`, `4000::1` is not (book ch10 Primjer 2 closing note; Pitanja 10).
  3. Reach: loopback never leaves the host; link-local stays on its link, a router never forwards it (RFC 4291 §2.5.6); ULA is routed inside the site and filtered at the site border (RFC 4193 §4.1 (check)); GUA reaches the internet (book ch10); documentation addresses are never routed (RFC 3849).
  4. Multicast reach follows the scope nibble (4th hex digit): 1 interface, 2 link, 5 site, 8 organisation, e global (RFC 4291 §2.7).
  5. `::` is never a destination; it appears only as a source before a host has an address (RFC 4291 §2.5.2).
  6. ULA detail: `fd00::/8` (L = 1) is the locally assigned half in use; `fc00::/8` (L = 0) is in `fc00::/7` but its assignment is not defined (RFC 4193 §3.1). The sim classifies both as ULA and shows the L bit in the note.
  7. Input is normalised to RFC 5952 form before display (book ch10 "zapis i skraćivanje"); invalid input shows the error and keeps the previous classification.
- **Params:** `addr` text input (needs a text control: request it if the kit lacks one; fallback a `select` of the preset addresses), default `2001:db8:85a3::8a2e:370:7334`; `showBits` toggle, default on.
- **Presets (5):**
  1. `four` — Primjer 2: `2001:db8:85a3::8a2e:370:7334` GUA format, but documentation (rule 1 tie-break, reach none); `fe80::1` link-local, reach link; `fc00::1` ULA, reach site; `ff02::1` multicast, link scope. From book ch10 Primjer 2 (the documentation flag is from RFC 3849, not in the book).
  2. `two-on-one` — the same interface holds `fe80::204:61ff:fe9d:f156` (talks to the neighbour) and a GUA (talks to a server beyond R2). From book ch10 Primjer 1 and "Koju će od tih adresa…"; the GUA value is derived.
  3. `bits-not-digits` — `3ffe::1` inside `2000::/3`, `4000::1` outside. From book ch10 Pitanja 10.
  4. `multicast-scopes` — `ff02::1` (link), `ff02::2` (link), `ff05::1:3` (site), `ff0e::101` (global). Derived from RFC 4291 §2.7 and IANA IPv6 Multicast Address Space (check the two last).
  5. `special` — `::1` host only, `::` no destination. From book ch10 and RFC 4291 §2.5.2/2.5.3.
- **Steps:** none.
- **Legend:** one series colour per type (GUA, ULA, link-local, multicast, special) with a label and a shape on the topology shading; "changed" = the matched prefix bits and the table row of the current match.
- **Captions:**
  - hr: „`fe80::1` počinje s `fe80::/10`: *link-local* adresa. Vrijedi samo na vezi L1; usmjernik R1 takav paket ne prosljeđuje."
  - en: "`fe80::1` starts with `fe80::/10`: a link-local address. It is valid only on link L1; router R1 does not forward it."
- **Terms:** global unicast address — globalna unicast adresa; link-local address — link-local adresa; unique local address — jedinstvena lokalna adresa; multicast address — multicast adresa; loopback address — adresa povratne petlje; unspecified address — neodređena adresa (check); scope — doseg (check); prefix — prefiks.
- **Misconceptions:** `/3` means three hex digits; ULA is "private" so it is NAT'd like RFC 1918 (it is just not routed beyond the site); a host has one IPv6 address.
- **Reused from `ipv6-slaac`:** the link/host/router topology, RFC 5952 address formatting and the interface-ID vocabulary. New: the type table and the reach shading.
- **Out of scope:** anycast (no prefix to classify by, RFC 4291 §2.6), IPv4-mapped addresses, how an address is obtained (SLAAC, DHCPv6), source address selection (RFC 6724).
- **Note for the coordinator:** like `ipv4-header`, a `reference` page that needs an input and presets; also needs a text-input control (kit has range/toggle/choice/select/button only). Book Primjer 2 uses `2001:db8:…` as "routable on the whole internet"; it is a documentation prefix (RFC 3849), so the page corrects the book: worth a book erratum.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ipv6-address-types sims/ipv6-address-types` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ipv6-address-types/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
