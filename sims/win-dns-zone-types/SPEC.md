<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-zone-types — specification

Task `docs/tasks/w2/win-dns-zone-types.md` (catalogue §4.5.3). Explorer, no steps. One concept: **primary, secondary,
stub, AD-integrated; forest, domain or custom replication scope.** The student defines one zone (which zone, its type,
its scope, the server it is created on), gives DC3 the DNS role, gives MS1 a secondary copy, allows zone transfers,
and the table shows who holds which zone.

Model: `sim.js` (pure). Tests: `sim.test.js`, one or more per rule below, tie-breaks first. Every expected table in §3
was checked by running the presets through the model before the page was written (NOTES.md, "Numbers").
Marked *(check)*: not confirmed against the vendor's documentation in this session (no network); listed in NOTES.md.

## 1. Scene

A forest with root domain `corp.example` and child domain `branch.corp.example` (task "Scene"):

| server | domain | role | DNS role |
|---|---|---|---|
| DC1 | corp.example | DC | yes |
| DC2 | corp.example | DC | yes |
| DC3 | corp.example | DC | param `dc3Dns` (default off) |
| RODC1 | corp.example | read-only DC (branch site) | yes |
| DC4 | branch.corp.example | DC | yes |
| MS1 | corp.example | member server, not a DC | yes |

Zones, one column each. Serials, record counts and addresses are chosen here (not from a source):

| zone | before the student defines anything (baseline) | serial | NS and glue | full copy |
|---|---|---|---|---|
| corp.example | AD-integrated primary, scope domain, created on DC1 | 128 | dc1.corp.example 10.0.0.11, dc2.corp.example 10.0.0.12 | 14 records, `www` 10.0.0.80 |
| branch.corp.example | AD-integrated primary, scope domain, created on DC4 | 45 | dc4.branch.corp.example 10.1.0.14 | 6 records, `www` 10.1.0.80 |
| partner.example | held by nobody; its primary is the partner's server `10.20.0.53` (task) | 2026101401 | ns1.partner.example 10.20.0.53, ns2.partner.example 10.20.0.54 | 9 records, `www` 10.20.0.80 |
| _msdcs.corp.example | AD-integrated primary, scope forest, fixed (not a param) *(check: forest scope by default)* | 77 | as corp.example | 11 records |

The custom scope uses one application directory partition, `CustomDnsZones.corp.example`, with **DC1 and DC4**
enlisted (chosen here: one DC from each domain, so the custom scope crosses the domain boundary).

**Params:** `zone` corp.example / branch.corp.example / partner.example (default corp.example); `type` primary (file)
/ secondary / stub (file) / AD-integrated primary / AD-integrated stub (default AD-integrated primary); `scope` forest /
domain / all DCs in the domain / custom (default domain; used by the AD types only); `host` DC1 / DC3 / RODC1 / DC4 /
MS1, the server the zone is created on (default DC1; added to the task's params, NOTES.md); `dc3Dns`, `ms1Secondary`,
`allowXfr` toggles (default off).

**Holdings** (one per server × zone): `write` ✎ writable copy, `read` ⊙ read-only copy, `stub` ◔ stub (SOA, NS, glue),
`stored` ▣ stored in AD but not loaded, `refused` ⊘ the copy exists but its transfer was refused (empty), `none` —.
A rejected definition adds ✕ to the cell where it was rejected (rule 9).

## 2. Rules

1. **File-backed primary.** A primary zone in a file lives on one server, in a file (`<zone>.dns`), writable there
   only; nothing else gets it except by zone transfer. (Microsoft, "Understanding Zone Types", primary zone *(check)*;
   UL ch19 "primarni poslužitelj".)
2. **Secondary.** A read-only copy pulled by zone transfer (AXFR/IXFR) from a master; the master must allow the
   transfer. Our masters (DC1, DC4, a server holding a file primary) allow it only when `allowXfr` is on *(check:
   AD-integrated zones default to no zone transfers)*; the partner's server outside the forest allows it (fixed,
   the partner's setting). A refused secondary exists but is empty (`refused`, no serial). A secondary cannot be
   AD-integrated: a file-backed definition with a scope is rejected (`scope-on-file`); the page drops the scope for
   file types, so this is reachable only from the model. The master of a secondary or stub is the zone's primary in
   the forest (corp.example: DC1, branch.corp.example: DC4, or the server the student made primary), else for
   partner.example `10.20.0.53`. (RFC 1034 §4.3.5; RFC 1995; RFC 5936; Microsoft zone transfer settings *(check)*.)
3. **Stub.** A stub zone holds only the zone's SOA, its NS records and the glue A records of those name servers
   (partner.example: 1 + 2 + 2 = **5** records). It does not answer for the zone's names: a query for
   `www.<zone>` is sent to the zone's name servers. A secondary or stub whose transfer was refused exists but is not
   loaded: it answers SERVFAIL for the zone's names *(check)*. It is refreshed from the master like a secondary, so it needs the
   transfer too *(check)*, and it can be AD-integrated (`adStub`), stored and replicated by scope like an AD primary.
   (Microsoft, "Understanding Stub Zones" *(check)*.)
4. **AD only on DCs.** An AD-integrated zone (primary or stub) cannot be created on a server that is not a DC
   (`not-dc`): MS1. (Microsoft, "Understanding Active Directory Domain Services Integration" *(check)*.)
5. **Replication scope.** Which DCs get an AD zone's data, for a zone created on DC *h*:
   - *forest*: every DC running DNS in the forest (partition `ForestDnsZones.corp.example`);
   - *domain*: every DC running DNS in *h*'s domain (`DomainDnsZones.<h's domain>`); the default for a new AD zone
     *(check)*;
   - *all DCs in the domain*: the domain partition of *h*'s domain itself, every DC of that domain, with or without
     DNS (the Windows 2000 compatible scope);
   - *custom*: the DCs enlisted in the application partition (`CustomDnsZones.corp.example`: DC1, DC4); a zone can
     be created there only on an enlisted DC (`not-enlisted`).
   **Tie-break:** "domain" is the domain of the DC the zone is created on, not the zone's name: partner.example
   created on DC4 with domain scope goes to `DomainDnsZones.branch.corp.example` (DC4 only), created on DC1 to
   `DomainDnsZones.corp.example` (DC1, DC2, RODC1); an AD stub of branch.corp.example made on DC1 is stored in
   `DomainDnsZones.corp.example`. (The task's wording "the zone's domain" is the same thing for its presets, all
   created on DC1 for corp.example.) (Microsoft,
   "Understanding DNS Zone Replication in Active Directory Domain Services" *(check)*.)
6. **Stored, not served.** A DC that receives the data but has no DNS role stores it (`stored` ▣, no serial shown)
   and answers nothing. It asks for nothing either, so it is `stored` even when an AD stub's transfer is refused
   (rule 6 before rule 2). No zone can be created on a server without the DNS role (`no-dns`).
7. **Multi-master, RODC.** In an AD primary every writable DC in scope holds a writable copy and accepts changes; an
   RODC holds a read-only copy and refers updates to a writable DC; an RODC cannot create an AD zone (`rodc`)
   *(check)*. An AD stub on an RODC is a stub like any other.
8. **Secure updates.** Only an AD-integrated primary offers "secure only" dynamic updates (`none`, `nonsecure`,
   `secure`); a file primary offers `none`, `nonsecure`; a copy (secondary, stub) takes none: updates go to the master.
   (Microsoft, "Secure dynamic update" *(check)*; see `win-dns-dynamic-update`.)
9. **Tie-break: rejections.** When a rule rejects the student's definition, nothing of it takes effect: every cell
   keeps the previous valid holding (the baseline), and the cell of the server where it was rejected is marked ✕ with
   the reason; the page lists every reason, grouped by reason. Order:
   - a **primary** (file or AD) made on a server that **already holds** the zone *converts* it: it replaces the
     zone's previous definition (a new type, or a new scope: "change replication scope");
   - a **file primary** made on a server that does not hold the zone is a **second, separate primary** with the same
     name: the old zone stays, and a change in one never reaches the other;
   - an **AD primary** made on a DC that does not hold the zone while the zone is already in AD is rejected
     (`exists-ad`, with the partition it is in): one name is one zone in the directory *(check: the console refuses
     a second AD zone of the same name)*;
   - a **secondary** or **stub** (file or AD) is a *further copy* from the zone's master; a copy that would land on a
     server already holding the zone (any holding but `none`) is rejected there (`exists`);
   - MS1's secondary (`ms1Secondary`) is added last, from the master of the zone in force (the student's primary
     when it was accepted, else the baseline's), **also when the student's definition was rejected**; if MS1 already
     holds the zone it is rejected (`exists`, by `ms1Secondary`) and what MS1 holds stays.
   The master of a copy is always a **primary** (a stub or secondary is never a master).

Rejection codes: `not-dc`, `no-dns`, `rodc`, `not-enlisted`, `exists`, `exists-ad`, `scope-on-file`, `no-scope`,
`no-host` (the last two only reachable from the model).

## 3. Presets (derived, unchecked against a running server, as the task says)

| id | params (others default) | corp.example (or the zone named) |
|---|---|---|
| `domain-scope` | corp.example, AD primary, domain, DC1 | DC1 ✎, DC2 ✎, RODC1 ⊙; DC3, DC4, MS1 — |
| `forest-scope` | scope forest | DC1 ✎, DC2 ✎, DC4 ✎, RODC1 ⊙; DC3 —; `_msdcs.corp.example` the same |
| `all-dcs` | scope all DCs in the domain | DC1 ✎, DC2 ✎, DC3 ▣, RODC1 ⊙; DC4 — |
| `secondary-ms1` | `ms1Secondary` on, `allowXfr` off | as domain-scope, MS1 ⊘ (from DC1, refused); with `allowXfr` on, MS1 ⊙ serial 128 |
| `stub-partner` | partner.example, stub (file), DC1 | DC1 ◔ from 10.20.0.53: SOA, 2 NS, 2 glue A (5 records); `www.partner.example` is sent to ns1/ns2.partner.example |
| `ad-on-member` | AD primary, host MS1 | rejected `not-dc` at MS1; corp.example as domain-scope |

## 4. State

`initial(params)` returns `{ servers: [{ id, domain, isDC, isRODC, dnsRole }], zones: [the definitions in force:
{ name, type, scope, host, master }], created (the student's definition), accepted, zone, def (the selected zone's
definition in force, null when nobody holds it), partition, holdings: { [server]: { [zone]: { hold, via, from,
serial, rejected } } }, errors: [{ code, server, zone, by }], ms1: 'none' | 'ok' | 'refused' | 'rejected', allowXfr }`.
The task's `customPartition: [serverId]` is the constant `CUSTOM.members`; `errors` are objects, not bare codes, so the
page can mark the server.

## 5. Page

Kit view K4 (`kit/ruletable.js`, mode `'deny'`, `at: 'all'`, `done`): one row per server; match columns domain, role,
DNS; the action column is the selected zone; the other three zones follow as extra columns; the mark column says
whether this server gets the selected zone: ▶ holds (✎ ⊙ ◔), ▷ stores only (▣), – not in scope with the column that
keeps it out struck (domain, role or DNS), or a dashed note for a refused transfer (⊘) or a rejection (✕).
Below: the cell key, the zone on the server it was created on (storage, records, the answer to `www.<zone>`, dynamic
updates) and the check (created or rejected with every reason, MS1's copy, the transfer setting). "Changed" outlines
the cells whose holding changed with the last param.
