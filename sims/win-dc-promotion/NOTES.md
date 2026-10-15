<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dc-promotion: notes

New stepper (task `docs/tasks/w2/win-dc-promotion.md`, catalogue `win-dc-promotion`, §4.5.1 and §5.21, wave 2b).
Drawn in the page (no kit view fits: two server boxes with panels). Rules and expected numbers: `SPEC.md`.

## Decisions

- **Layout.** DC01 | replication column | DC02 on top; under them the two zones, `quillmoor.example` and
  `_msdcs.quillmoor.example`, as record tables. Each server box: name, address, what it is now (server / AD DS role
  installed / promotion running / domain controller; dashed border until it is a DC), its DNS client setting, the
  domain line (domain, NetBIOS, functional level, DSRM), and four panels: the database `NTDS.dit` (five partition
  slots, dashed while empty), the DNS server (zones, the partition each is stored in, record counts), SYSVOL (shares,
  the two default GPOs with shortened GUIDs, DFSR), and the roles (five FSMO badges, the GC badge).
- **Zones shown once.** The zones are AD-integrated, so every DNS server holds the same copy; the record tables show
  it once, and each DNS server's panel says which zones it holds and how many records. One row per owner name and
  type, one chip per target DC (DC01 blue, DC02 orange, and the host name or address written in the chip, so colour
  is not the only carrier). SRV chips show host and port (`dc01:389`); the full RDATA (`0 100 389
  dc01.quillmoor.example.`) is in the query card and the SPEC.
- **Ten records per DC, not the full list** (rule 4): `@` A, the host A, `_ldap._tcp`, `_kerberos._tcp`,
  `_kpasswd._tcp`, `_gc._tcp`, the site `_ldap`, `_ldap._tcp.dc._msdcs`, `_ldap._tcp.pdc._msdcs`, the DSA-GUID
  CNAME. The task asks for "~10" and names most of them; a real DC registers about 25 ([MS-ADTS] §6.3.2), which is
  `win-dns-srv-records`' subject. The host's A record is registered by the DNS client, not Netlogon; SPEC says so.
- **Failed registrations are drawn**, struck through with ✕ chips in dashed zone boxes, under "Netlogon cannot
  register (event 5774)", so `no-dns-role` shows what is missing rather than an empty table.
- **One step = one phase on one server.** first-dc 7 (role, forest, database, DNS, SYSVOL, restart, register),
  no-dns-role 6 (no DNS step), second-dc 6 (role, locate, replicate, restart, SYSVOL, register), wrong-dns 3 (role,
  locate, stop): the task's counts.
- **The FSMO roles and GC appear at the restart**, the moment the server starts as a DC, not at the database step;
  the caption names it ("as the first DC in the forest").
- **DC02's DNS server and zones appear at its restart** (the DNS service loads the zones from the DNS partitions it
  replicated at step 3), with the GC; the KCC's two connection objects appear in the same step. **DC02's SYSVOL
  comes after the restart**: DFSR's initial sync runs then, and only once it is done are the shares there and does
  DC02 register itself (fresh review). DC01 keeps the task's order (SYSVOL before the restart).
- **DC02's records are written on DC01** (its DNS client asks DC01) and reach DC02's copy by AD replication; the
  caption says so. The initial
  replication and the SYSVOL sync are dashed one-step arrows, not connection objects (T5).
- **The query card** replaces DC02's (still empty) panels in the locate and stop steps: whom it asked, the name, the
  answer; after a failure the wizard's message in a red box.
- **Params.** `server` (DC01: new forest / DC02: second DC), `dns` (DC01 installs DNS), `dc2Dns` (DC01 / public DNS)
  and `gc2`, the last two shown only for DC02. All but `gc2` reset the demo (they change the step count). The task's
  `dns` default on, `dc2Dns` default DC01, `gc2` default on are kept.
- **Combinations beyond the presets** are modelled consistently: DC02 pointed at a DC01 without DNS fails with "no
  answer" (T2), 3 steps; DC02 without GC registers 8 records (18 in all).
- **Names and addresses**: `quillmoor.example`, `QUILLMOOR`, `DC01` 10.10.0.10, `DC02` 10.10.0.11 (task,
  topologydrafter `two-sites`). Added: the public resolver 203.0.113.53 (RFC 5737 documentation range), the DSA
  GUIDs (invented), level "2016" *(check)*, the site `Default-First-Site-Name` (the default).
- **`@`** is written for the zone apex (the domain's own A record), as in zone files (`dns-records` explains it).

## Deviations from the task

- **Re-registration interval not named.** The task says "re-registered periodically (check interval)": [MS-ADTS]
  §6.3.1.10 and the TechNet `DnsRefreshInterval` entry say 60 minutes / 3600 s, a Microsoft blog and third-party
  guides say 24 hours. The page says "periodically".
- **The task's caption "DC02 traži domenu preko javnog DNS poslužitelja…"** is the wrong-dns step 3 caption, with
  "DNS klijent na DC02 mora pitati DC01" added; step 2 shows the query and its NXDOMAIN answer.
- **Title** "What promoting a DC does" (catalogue); Croatian "Što radi promocija kontrolera domene".

## Sources

- Task file, model and presets; catalogue §4.5.1, §5.21.
- Microsoft Learn: "Install Active Directory Domain Services (Level 100)"; "Install a Replica Windows Server 2012
  Domain Controller in an Existing Domain (Level 200)" (GC always selected by default; DNS selected by default when
  the domain's DCs already run DNS, found by an SOA query).
- [MS-ADTS] §6.3 "Publishing and locating a domain controller" (§6.3.2 records, §6.3.1.10
  `DynamicRegistrationRefreshInterval` default 60).
- Microsoft support: KB 4493934 (a Windows Server 2019 server cannot be promoted into a domain that still replicates
  SYSVOL with FRS); "A DNS update is recorded as failed: Event ID 5774, 1196, or 1578" (5774 = a DC failed to
  register one of its records, e.g. when its DNS client does not list a server authoritative for the AD zone).
- RFC 2782 (SRV), RFC 5737 (documentation addresses); IANA ports 389, 88, 464, 3268.
- `~/projects/uvod-u-racunalne-mreze` ch. 14 (zona, resursni zapis); `kit/glossary.js` (zone → zona, resource
  record → zapis zone); topologydrafter `js/samples.js` `two-sites`.

## Checks

- **Numbers:** a separate Python hand count (all 16 param combinations: steps, records, partitions, failures)
  before the model; the model agrees (`sim.test.js` "presets" and the tie-break tests).
- **Mutation test:** 37 mutations of `sim.js` (30 of mine, 7 from the review's survivors), one at a time (role makes a DC, DNS partitions in the database, no
  loopback, zone stores swapped, registration without a zone, PDC/GC records always, FSMO on DC02, DC01 without GC,
  the public resolver answering, noServer as NXDOMAIN, connection objects at replication, one connection only,
  SYSVOL not copied, no dedupe, no sort, partitions not taken from DC01, `gc2` ignored, records not replicated,
  kpasswd port, DC02's DNS client changed, the DNS step always, DSRM at the role step, no domain, FSMO before the
  restart, failures not recorded, a stop reported as ok, one GPO, zones not loaded on DC02; DC02 with one share, without
  DFSR, not promoting, the site SRV port, CNAME data as an address, DC02's apex A with DC01's address, SYSVOL before
  the restart): 36 fail a test. The
  survivor ("DC02 installs DNS even when DC01 has none") is equivalent in every reachable state: without DC01's DNS,
  DC02 never gets past the lookup.
- **Browser sweep:** 148 pages (both languages × every preset and two extra combinations × every step, at
  1920×1080 and 375×812): no page scroll at 1920×1080, no sideways scroll, nothing overflowing a box or the stage,
  no `undefined`/`NaN`/placeholder text, no empty caption, no console errors or warnings. Found and fixed on the
  way: the kit's highlight halo of one record row covered the underscores of the row above (the page's highlight is
  now flat), and a whole record row lit up when only DC02's target was new (now only the new chip).
- **Gate:** `npm run gate -- win-dc-promotion` passes (63 browser checks); screenshots light, dark, grayscale and
  375×812 in both languages reviewed.

## Unchecked *(check)*

- Rule 2: the functional level shown, "2016", as the wizard's default on current Windows Server.
- Rule 3: the wizard points the first DC's DNS client at 127.0.0.1; the zones are created during promotion (not
  only at the DNS service's first start).
- Rule 4: the re-registration interval (60 min vs 24 h, above).
- Rule 5: that new domains never use FRS (only the Windows Server 2019 block for adding DCs was confirmed).
- Rule 9: that DC02's records reach DC01 by AD replication of `DomainDnsZones`/`ForestDnsZones` (the page shows both
  servers with all records at the register step; real intra-site replication takes seconds).
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| domain controller | kontroler domene | task *(check)*; also win-ad-structure |
| promotion | promocija | task *(check)* |
| SRV record | SRV zapis | task |
| replication | replikacija | task; also win-ad-structure |
| global catalog | globalni katalog | task *(check)*; also win-ad-structure |
| connection object | objekt veze | simdeck *(check)* |
| application partition (DomainDnsZones) | particija (DNS particija) | simdeck |
| shared folder | dijeljena mapa | simdeck |
| functional level | funkcijska razina | simdeck *(check)* |

Used from the glossary: `[[zone]]` (zona), `[[resource record]]` (zapis zone; the task's "resursni zapis" from URM
ch. 14 differs, the glossary wins).

## Known limits

- At 375×812 the page scrolls (as every sim's phone layout); the record tables become cards with the targets on a
  second line.
- The DSA GUID names are cut to 8 characters (`3b6f0c2e…`); the full GUID is the cell's title.

## Shared requests

- **Kit:** `.sd-ctl[hidden] { display: none; }` (kit.css gives `.sd-ctl` `display: flex`, which beats `hidden`;
  same request as win-group-scopes and win-ad-structure). The page carries the rule.
- **Kit:** a flat variant of `.sd-changed` for dense tables (the 0.45 rem halo covers neighbouring rows); the page
  overrides it inside its stage.
- **Kit legend swatches** `dp-part` (cylinder slice), `dp-zone` (folder), `dp-rec` (record row), `dp-share`,
  `dp-fsmo`, `dp-repl` (dashed line): the page defines them in its CSS.
- **Glossary:** the term pairs above.
- **models/ (catalogue §5.21):** `dcRecords` and `register` are the "which records a DC writes, and where" part of
  the shared small-domain model (with win-dns-srv-records, win-domain-logon); pure and string-free if promoted.

## Fresh review

A separate agent read the task, SPEC, model, tests and page, broke 24 rules of its own on a copy (11 killed, 5 real
gaps, 8 equivalent in every reachable state), drove the page in both languages, and checked the AD/DNS facts.
Confirmed: SRV ports, priority and weight, `_gc._tcp` in the forest root zone, the zones' partitions, the GPO GUIDs,
the FSMO/GC facts, the wizard's message, every SPEC number, and the concepts-not-tools rule. Fixed from it:
- the register caption had replication carrying DC02's records *to* DC01; they are written on DC01 (DC02's DNS
  client) and replicate to DC02;
- DC02's SYSVOL sync was before its restart; DFSR's initial sync runs after it, then the shares, then registration
  (the step order is now role, locate, replicate, restart, SYSVOL, register);
- the five test gaps (DC02's shares, DFSR flag and promoting state; every record's data; DC02's records' data);
- "nema veze" (reads as "never mind") → "nema replikacije"; "imenovanje domena", "nema dijeljenih mapa", "replicira
  ga DFSR", "u particijama", "Promocija je zaustavljena", "početna" sinkronizacija, "nijedan upis ne uspijeva", "a
  ujedno je i globalni katalog";
- "AD and DNS are one" → "AD depends on DNS"; "copies no files" → "does not copy the database file" (DFSR does copy
  SYSVOL's files);
- connection objects: the KCC on each DC creates an inbound one;
- the failed registrations in `no-dns-role` are now highlighted at their step, and the note names the failing DC's
  own DNS client instead of a fixed address;
- the term rule in the second-DC start caption (*domain controller* first mention).
Not changed: event 5774 (the reviewer's alternative, 5781, is for no reachable DNS server at all; here a server
answers but holds no zone, which is 5774's documented case); the "2016" level stays *(check)*.

## Time

Start 2026-10-15 22:57; built, swept and mutation-tested by 23:11; review fixed, gate passing and status ready
23:21: about 24 min.
