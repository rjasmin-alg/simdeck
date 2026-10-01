# dns-records: DNS record types

| | |
|---|---|
| Task | `dns-records` (wave 2b, DNS) |
| Catalogue entry | `inet-dns-records` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/dns-records/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | UL, URM, WIN1 |
| Topic / tags / level | `internet` / `dns` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **A/AAAA/CNAME/MX/TXT/NS resolve differently; no CNAME at the apex**.

The student: build a small zone, query it.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md` (Uvod u Linux), section "Tko odgovara kad se pita za ime" (definitions zapis zone, vrsta zapisa; field formats of A, NS, CNAME, SOA, MX; "Šire o temi": delegiranje, vrh zone, AAAA) and section "Vlastiti poslužitelj imena" (zone file `lab.example`, `@`, SOA fields, `NXDOMAIN` for `nepostojece.lab.example`); diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-19/`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` (Uvod u računalne mreže), section "Imenski prostor DNS-a: hijerarhija, zone i vrste zapisa" (A, AAAA, CNAME, MX, NS)
- RFC 1034 §3.6.2 (CNAME and other data), §4.2.1, §4.3.2; RFC 1035 §3.3.9 (MX), §3.3.14 (TXT), §3.4.1 (A); RFC 2181 §5.2, §10.1, §10.3; RFC 2308 (NXDOMAIN, NODATA); RFC 3596 (AAAA); RFC 5321 §5.1 (MX order)
- Catalogue seed: UL ch19

## Model and presets

- **Scene:** kit view K4 rule table (own drawing until K4 exists). Left: the zone `lab.example` as an editable table (owner, TTL, type, data), starting from the UL ch19 zone file. Right: a query box (name, type) and the answer in the usual answer-section form (owner, TTL, class, type, data), with the status (`NOERROR`, `NXDOMAIN`, `NODATA`), the `aa` flag and the follow-up lookups (CNAME target, MX exchange A record). A "zone check" strip shows whether the zone would load and why not.
- **State:** `zone: [{ owner, ttl, type, data }]` (data for MX = `{ pref, host }`), `query: { name, type }`, derived `answer: { status, aa, rrs: […], chain: […] }`, `check: [{ level: ok|error, code }]`.
- **One step:** explorer, no steps. Any param change re-evaluates the zone check, then the query.
- **Rules:**
  1. Exact match: an RRset with the queried owner and type is returned whole; every RR of an RRset has the same TTL (RFC 1034 §4.3.2; RFC 2181 §5.2; UL ch19 "RRset").
  2. If the owner has a CNAME and the query type is not CNAME, the answer carries the CNAME and the lookup restarts at the canonical name; the chain is shown, max 8 hops, a loop is an error (RFC 1034 §3.6.2, §4.3.2; UL ch19 "`CNAME` nosi kanonsko … ime").
  3. A name with a CNAME may hold no other data (RFC 1034 §3.6.2; RFC 2181 §10.1). The apex always holds SOA and NS, so a CNAME at the apex is a zone error (UL ch19 "vrh zone"); the zone check shows "CNAME and other data" and the query box answers from the last valid zone.
  4. MX returns all exchanges; lower preference is tried first; equal preference = either order (model: listed order) (RFC 1035 §3.3.9; RFC 5321 §5.1; URM ch14 "MX zapis"). The exchange must not be a CNAME (RFC 2181 §10.3): flagged as a warning.
  5. The owner exists but has no RR of that type → `NOERROR` with an empty answer (NODATA); the owner doesn't exist → `NXDOMAIN` (RFC 2308 §1–2; UL ch19 "`status: NXDOMAIN`").
  6. NS at the apex is authoritative data (`aa`); NS at a name below the apex is a delegation: the query for anything under it gets a referral without `aa` (RFC 1034 §4.2.1; UL ch19 "delegiranje").
  7. A holds one IPv4 address, AAAA one IPv6 address, TXT one or more character strings (RFC 1035 §3.3.14, §3.4.1; RFC 3596 §2).
  8. Owner names are relative to the origin unless they end with a dot; `@` is the apex (UL ch19, the zone file explanation).
- **Params:** `qname` select over the zone's owners plus `nema.lab.example` (default `posluzitelj.lab.example`); `qtype` choice A / AAAA / CNAME / MX / TXT / NS (and SOA in the select if 6 is too many: use `select`, default A); toggles `addWww` (www CNAME posluzitelj, default on), `apexCname` (adds `@ CNAME posluzitelj`, default off), `mx` (two MX, default on), `delegate` (`sub NS ns.sub` + glue, default off).
- **Presets:**
  1. `ul-zone` — from UL ch19 "Vlastiti poslužitelj imena" (zone `lab.example`, `$TTL 3600`): `posluzitelj.lab.example A` → `192.168.180.1`, `aa`; `lab.example SOA` → `ns1.lab.example. admin.lab.example. 2026090301 3600 900 604800 900`.
  2. `nxdomain` — from UL ch19 (query `nepostojece.lab.example`): `NXDOMAIN`, empty answer, `aa`.
  3. `cname` — derived, unchecked: `www.lab.example A` → `www CNAME posluzitelj.lab.example.` then `posluzitelj A 192.168.180.1` (2 RRs in the answer).
  4. `mx` — derived, unchecked: `lab.example MX` → `10 mail.lab.example.`, `20 mail2.lab.example.`; the follow-up shows `mail A 192.168.180.25` tried first.
  5. `nodata` — derived, unchecked: `posluzitelj.lab.example AAAA` → `NOERROR`, 0 answers — not NXDOMAIN.
  6. `apex-cname` — derived, unchecked: toggle `apexCname` → zone check error at `lab.example`: CNAME beside SOA and NS; the zone isn't loaded.
- **Steps:** none (explorer).
- **Legend:** status badge with icon (✓ NOERROR, ∅ NODATA, ✕ NXDOMAIN, ⚠ zone error); `aa` badge; chain arrows for CNAME and MX follow-ups; rows of the matched RRset outlined. "Changed" marks the zone row the last param touched and the answer rows that differ from the previous answer.
- **Captions:**
  - hr: "`www` ima CNAME zapis: odgovor nosi nadimak i zatim A zapis kanonskog imena `posluzitelj.lab.example`."
  - en: "`www` has a CNAME: the answer carries the alias and then the A record of the canonical name `posluzitelj.lab.example`."
  - hr: "CNAME na vrhu zone nije dopušten: `lab.example` već nosi SOA i NS, a ime s CNAME zapisom ne smije nositi ništa drugo."
  - en: "A CNAME at the zone apex isn't allowed: `lab.example` already holds SOA and NS, and a name with a CNAME may hold nothing else."
- **Terms:** resource record — zapis zone (UL) / resursni zapis (URM); record type — vrsta zapisa; owner — vlasnik; zone apex — vrh zone (ishodište); canonical name / alias — kanonsko ime / nadimak; mail exchanger — izmjenjivač pošte (UL) / poštanski izmjenjivač (URM); preference — prednost; delegation — delegiranje.
- **Misconceptions:** "CNAME is like a redirect and can sit anywhere, also on the bare domain"; "no record of that type means the name doesn't exist" (NODATA vs NXDOMAIN); "MX points to an address" (it names a host that needs its own A/AAAA).
- **Out of scope:** SRV (`win-dns-srv-records`), PTR and reverse zones, wildcards, DNSSEC types, ALIAS/ANAME vendor records (mention in the explanation only), TTL behaviour over time (`inet-dns-ttl-cache`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `dns-records` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh dns-records sims/dns-records` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dns-records/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
