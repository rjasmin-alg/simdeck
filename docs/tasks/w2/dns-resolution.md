# dns-resolution: Recursive and iterative resolution

| | |
|---|---|
| Task | `dns-resolution` (wave 2b, DNS) |
| Catalogue entry | `inet-dns-resolution` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/dns-resolution/` |
| Class | stepper |
| Size | M |
| Priority | P1 |
| Courses | URM, UL, WIN1 |
| Topic / tags / level | `internet` / `dns` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **resolver asks root, TLD and authoritative servers; the client asks once**.

The student: step a lookup; repeat it warm.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md` (Uvod u Linux), section "Tko odgovara kad se pita za ime" (definitions *stub* rezolver, rekurzivni rezolver, autoritativni poslužitelj, zona, TTL zapisa, predmemorija; "Šire o temi": delegiranje, vrh zone, korijenski poslužitelji, prosljeđivač), section "Vlastiti poslužitelj imena" (SOA MINIMUM, negativno predmemoriranje), "Primjer 2 — selidba poslužitelja u utorak"; diagram `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-19/put-razrjesavanja-imena.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` (Uvod u računalne mreže), section "Kako DNS pronalazi odgovor: *resolver*, rekurzivni i iterativni upit, TTL" and "Primjer 1: prvi upit za `www.grafo.hr`"; diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch14-dns-put-upita.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 (the planned card: UL ch19, URM card ch14 (DNS query path) → §5.4)
- RFC 1034 §4.2.1, §4.3.1, §5.3.3 (resolver algorithm); RFC 1035 §3.2.1, §4.1.1 (TTL, AA/RD/RA flags); RFC 2181 §8 (TTL); RFC 2308 §5 (negative caching); RFC 9499 (terminology)
- Catalogue seed: UL ch19, URM card ch14 (DNS query path) → §5.4

## Overlaps (catalogue §5)

- **§5.4 DNS:** Resolution and TTL can share one page with two modes, but each is a full 3–5 minute demo, so keep two pages on one model. Secondary expiry and split-brain are presets of one "zone servers over time" page.

## Model and presets

- **Scene:** kit view K1 message sequence chart (own drawing until K1 exists). Lanes left to right: *stub* rezolver on the host `192.168.1.5`, rekurzivni rezolver `192.168.1.99`, korijenski poslužitelj, poslužitelj za `.hr`, mjerodavni poslužitelj za `grafo.hr`. Under the resolver lane: its cache table (name, type, data, TTL left). Each message shows type (query/referral/answer), flags (`rd`, `ra`, `aa`) and the RR it carries.
- **State:** `t` (s), `query: { name, type }`, `phase`, `cache: [{ name, type, data, expiresAt, negative }]`, `msgs: [{ n, from, to, kind: query|referral|answer|nxdomain, rd, aa, rr }]`, `zones` (the fixed hierarchy: root → `hr` → `grafo.hr`, each with its NS, glue and records).
- **One step:** one message. Order inside the resolver: (1) look in the cache for the exact answer (or a cached negative answer); (2) if missing, find the deepest cached NS set for the name (root hints if none); (3) send an iterative query there; (4) on a referral, cache NS + glue and go to (2); on an answer or NXDOMAIN, cache it and reply to the stub. A "repeat warm" button reruns the same lookup with the cache kept, `t` advanced by a chosen amount.
- **Rules:**
  1. The stub sends one recursive query (`rd` set) and gets either the answer or an error, never a referral (RFC 1034 §4.3.1; URM ch14 "rekurzivni upit"; UL ch19 "*stub* rezolver").
  2. The resolver asks the hierarchy iteratively; a server answers from its own data: answer, error or referral to servers closer to the name (RFC 1034 §4.3.1, §5.3.3 algorithm; URM ch14 "iterativni upit").
  3. A referral carries the child zone's NS records (plus glue A records); it has no `aa` (RFC 1034 §4.2.1; UL ch19 "delegiranje").
  4. Only the authoritative server's answer has `aa`; the resolver's answer to the stub does not (RFC 1035 §4.1.1; UL ch19 figure `put-razrjesavanja-imena.svg`).
  5. Every RR is cached for its TTL; within the TTL the resolver answers from the cache with no further packets (RFC 1035 §3.2.1, RFC 2181 §8; URM ch14 Primjer 1: TTL 3600 s).
  6. The resolver starts from the deepest NS set it has cached: if `grafo.hr` NS is still cached, a lookup of another name in that zone goes straight to the authoritative server (RFC 1034 §5.3.3 step 2).
  7. NXDOMAIN is cached as a negative answer for the SOA MINIMUM / SOA TTL, whichever is lower (RFC 2308 §5; UL ch19 Primjer 2: 900 s).
  8. Tie-break: when several NS are known, the model asks the first listed; real resolvers pick by measured RTT (say so in the explanation).
- **Params:** `name` choice `www.grafo.hr` / `mail.grafo.hr` / `nema.grafo.hr` (default www); `advance` choice +60 s / +3600 s / +1 day for the warm repeat (default +60 s); `ttlA` range 60–86400 s (default 3600); `ttlNS` range 3600–172800 s (default 86400, derived).
- **Presets:**
  1. `cold` — from URM ch14 Primjer 1: cache empty; 8 messages: stub→resolver, resolver→root (referral to `.hr`), →`.hr` (referral to `grafo.hr`), →auth (A, TTL 3600, `aa`), resolver→stub. Outcome: 3 iterative round trips, answer cached for 3600 s.
  2. `warm` — from URM ch14 Primjer 1 (second half) and figure `ch14-dns-put-upita.svg`: same name 60 s later; 2 messages, answer from cache with TTL 3540.
  3. `same-zone` — derived, unchecked: `mail.grafo.hr` 60 s after `cold`; NS for `grafo.hr` still cached → 4 messages (stub, auth, back).
  4. `ttl-expired` — derived, unchecked: `www.grafo.hr` at t = 3601 s; A expired, NS (86400) still valid → 4 messages, not 8.
  5. `nxdomain` — from UL ch19 Primjer 2 (negative caching): `nema.grafo.hr` → NXDOMAIN with `aa` from auth; a repeat at +60 s is answered NXDOMAIN from cache (negative entry, 900 s).
- **Steps:** cold 8; warm 2; same-zone 4; ttl-expired 4; nxdomain 8 + 2.
- **Legend:** solid arrow = query, dotted arrow = referral (with the NS it names), bold arrow = final answer; `aa` badge only on authoritative answers; cache rows show a draining TTL bar; negative cache rows have a ⊘ mark. "Changed" marks the newest message and the cache row it added or used.
- **Captions:**
  - hr: "Korijenski poslužitelj ne zna adresu, ali vraća uputu: NS zapise poslužitelja za .hr. *Resolver* (rekurzivni rezolver) sam pita dalje."
  - en: "The root server doesn't know the address but returns a referral: the NS records for .hr. The resolver asks on by itself."
  - hr: "Isti upit 60 s kasnije: odgovor stiže iz predmemorije, TTL 3540 s, i nijedan paket ne ide prema korijenu."
  - en: "The same query 60 s later: the answer comes from the cache, TTL 3540 s, and no packet goes to the root."
- **Terms:** stub resolver — *stub* rezolver; recursive resolver — rekurzivni rezolver (URM: *resolver*); recursive query — rekurzivni upit; iterative query — iterativni upit; referral — uputa; authoritative server — autoritativni (UL) / mjerodavni (URM) poslužitelj; root servers — korijenski poslužitelji; cache — predmemorija; negative caching — negativno predmemoriranje.
- **Misconceptions:** "my computer asks the root servers" (only the resolver does); "every lookup walks root → TLD → authoritative" (caching skips most of it); "TTL is a hop count" (URM ch14 warns: seconds in the record).
- **Out of scope:** forwarders and conditional forwarders (`win-dns-forwarders`), TTL cutover planning (`inet-dns-ttl-cache`), DNSSEC, TCP fallback and EDNS, reverse lookup, QNAME minimisation.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh dns-resolution sims/dns-resolution` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dns-resolution/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
