# win-dns-zone-types: Zone types and replication scope

| | |
|---|---|
| Task | `win-dns-zone-types` (wave 2b, DNS) |
| Catalogue entry | `win-dns-zone-types` in `docs/catalogue.md` §4.5.3 |
| Kind | build a new simulator |
| Folder | `sims/win-dns-zone-types/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `dns` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **primary, secondary, stub, AD-integrated; forest, domain or custom replication scope**.

The student: create zones, add DCs, see who holds which.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.3.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Understanding DNS Zone Replication in Active Directory Domain Services" (replication scopes, ForestDnsZones/DomainDnsZones); "Understanding Active Directory Domain Services Integration" (DNS); "Understanding Zone Types" / "Understanding Stub Zones"; "Add-DnsServerPrimaryZone" / "Add-DnsServerStubZone" (PowerShell `-ReplicationScope Forest|Domain|Legacy|Custom`)
- RFC 1034 §4.3.5 (zone transfer); RFC 1995 (IXFR); RFC 5936 (AXFR)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md`, section "Tko odgovara kad se pita za ime" (definition zona) and "Vlastiti poslužitelj imena" (BIND zone types `primary`, `secondary`, `stub`, `forward`), for the generic terms
- Catalogue seed: → §5.4 (but see the coordinator note: §5.4 names `win-ad-dns`)

## Overlaps (catalogue §5)

- **§5.4 DNS:** Resolution and TTL can share one page with two modes, but each is a full 3–5 minute demo, so keep two pages on one model. Secondary expiry and split-brain are presets of one "zone servers over time" page.

## Model and presets

- **Scene:** kit view K4 rule table (own drawing until K4 exists). A small forest: domain `corp.example` with DC1 (DNS), DC2 (DNS), DC3 (no DNS role), RODC1 (DNS, branch); child domain `branch.corp.example` with DC4 (DNS); member server MS1 (DNS role, not a DC). One row per server, one column per zone; each cell shows what the server holds: writable copy ✎, read-only copy 👁, stub (SOA/NS/glue only) ◔, stored in AD but not loaded ▣, nothing.
- **State:** `servers: [{ id, domain, isDC, isRODC, dnsRole }]`, `zones: [{ name, type: primary|secondary|stub|adPrimary|adStub, scope: forest|domain|allDCsDomain|custom|null, host (for file-backed), master (for secondary/stub), customPartition: [serverId] }]`, derived `holdings[server][zone]`, `errors: [code]`.
- **One step:** explorer. Params set the zone type, scope and DNS roles; the table re-derives every cell and lists rejected combinations with the reason.
- **Rules:**
  1. A file-backed primary lives on one server, in a file, writable there only (Microsoft, "Understanding DNS Zone Types" / "Primary zone" (check)).
  2. A secondary is a read-only copy pulled by zone transfer (AXFR/IXFR) from a master; it can't be AD-integrated; the master must allow the transfer (RFC 1034 §4.3.5, RFC 1995; Microsoft zone transfer settings (check)).
  3. A stub zone holds only the SOA, the NS records and the glue A records of the zone; it is refreshed from the master like a secondary and can be AD-integrated (Microsoft, "Understanding Stub Zones" (check)).
  4. An AD-integrated zone exists only on DCs: a non-DC (MS1) can't host one (Microsoft, "Understanding Active Directory Domain Services Integration" (check)).
  5. Replication scope decides which DCs get the zone data: *forest* = every DC running DNS in the forest (ForestDnsZones); *domain* = every DC running DNS in the zone's domain (DomainDnsZones; the default for a new AD-integrated zone (check)); *all DCs in the domain* = the domain partition, every DC of the domain even without DNS (Windows 2000 compatible); *custom* = DCs enlisted in an application directory partition (Microsoft, "Understanding DNS Zone Replication in Active Directory Domain Services" (check)).
  6. A DC that receives the data but has no DNS role stores it (▣) and answers nothing.
  7. AD-integrated zones are multi-master: every writable DC accepts changes; an RODC holds a read-only copy and refers updates to a writable DC (check).
  8. Only AD-integrated zones offer "Secure only" dynamic updates (link to `win-dns-dynamic-update`) (Microsoft, "Secure dynamic update" (check)).
  9. Tie-break for the table: when a rule rejects a combination (AD-integrated on MS1, secondary with scope), the cell shows the rejection and the previous valid holding stays.
- **Params:** `zone` choice `corp.example` / `branch.corp.example` / `partner.example` (default corp.example); `type` choice primary / secondary / stub / AD-integrated primary / AD-integrated stub (default AD-integrated primary); `scope` choice forest / domain / all DCs in domain / custom (default domain); `dc3Dns` toggle (default off); `ms1Secondary` toggle (MS1 holds a secondary of the zone, default off); `allowXfr` toggle (default off).
- **Presets:**
  1. `domain-scope` — derived, unchecked: `corp.example` AD-integrated, domain scope → DC1, DC2 ✎, RODC1 👁; DC3 nothing; DC4 nothing.
  2. `forest-scope` — derived, unchecked: same zone, forest scope → DC1, DC2, DC4 ✎, RODC1 👁, DC3 nothing. (The `_msdcs.corp.example` zone is forest-scoped by default (check).)
  3. `all-dcs` — derived, unchecked: scope "all DCs in the domain" → DC1, DC2 ✎, DC3 ▣ (stored, not served), RODC1 👁, DC4 nothing.
  4. `secondary-ms1` — derived, unchecked: MS1 secondary of `corp.example` from DC1 with transfers off → MS1 empty, "transfer refused"; turn `allowXfr` on → MS1 👁 at serial of DC1.
  5. `stub-partner` — derived, unchecked: `partner.example` stub on DC1 from `10.20.0.53` → DC1 ◔ with SOA, 2 NS, 2 glue A; a query for `www.partner.example` is sent to the partner's NS, not answered locally.
  6. `ad-on-member` — derived, unchecked: try AD-integrated on MS1 → rejected: MS1 isn't a DC.
- **Steps:** none (explorer).
- **Legend:** cell glyphs ✎ writable, 👁 read-only, ◔ stub, ▣ stored not served, — none, ✕ rejected (each with a text label in the cell's title and a pattern, not only colour). "Changed" outlines the cells whose holding changed with the last param.
- **Captions:**
  - hr: "Opseg replikacije *domain* (domena): zonu dobivaju samo DC-ovi s ulogom DNS u domeni corp.example — DC3 je nema, DC4 je u drugoj domeni."
  - en: "Replication scope *domain*: only DCs running DNS in corp.example get the zone; DC3 has no DNS role, DC4 is in another domain."
  - hr: "*Stub zone* (zona zaglavlja) drži samo SOA, NS i adrese poslužitelja partnera — ne odgovara na upite o njegovim imenima."
  - en: "A stub zone holds only the partner's SOA, NS and server addresses; it doesn't answer for the partner's names."
- **Terms:** zone — zona; primary zone — primarna zona; secondary zone — sekundarna zona; stub zone — *stub* zona (zona zaglavlja (check term)); AD-integrated zone — zona integrirana u AD; replication scope — opseg replikacije; zone transfer — prijenos zone; domain controller — kontroler domene.
- **Misconceptions:** "AD-integrated means every DC has the zone" (only those in scope and running DNS); "a secondary on a DC is the same as AD-integrated"; "a stub zone is a small copy of the zone".
- **Out of scope:** conditional forwarders (`win-dns-forwarders`), zone transfers over time and SOA timers (`inet-dns-secondary-expiry`), DNSSEC signing, zone scopes (`win-dns-policies`), AD replication latency.
- **Note for the coordinator:** the task's catalogue seed says "→ §5.4", but §5.4 lists `win-ad-dns`, which has no catalogue entry; probably the old name of this entry. Fix §5.4's member list.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-dns-zone-types` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-dns-zone-types sims/win-dns-zone-types` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dns-zone-types/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
