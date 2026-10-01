# win-dc-promotion: What promoting a DC does

| | |
|---|---|
| Task | `win-dc-promotion` (wave 2b, Active Directory) |
| Catalogue entry | `win-dc-promotion` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-dc-promotion/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `active-directory` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **AD DS, the DNS zone and SRV records, SYSVOL, the first replication**.

The student: step a server becoming the first DC, then a second.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.21
- Microsoft Learn: "Install Active Directory Domain Services (Level 100)"; "Verify SRV DNS records have been created"; "SYSVOL replication migration guide: FRS to DFS Replication"
- [MS-ADTS] Active Directory Technical Specification §6.3 "Publishing and locating a domain controller" (record list)
- RFC 2782 (DNS SRV records); `~/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` § "Imenski prostor DNS-a: hijerarhija, zone i vrste zapisa" (zona, resursni zapis)
- `/home/rjasmin/projects/topologydrafter/js/samples.js` (sample `two-sites`: DC01 10.10.0.10)

## Overlaps (catalogue §5)

- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** two server boxes, `DC01` (10.10.0.10) and `DC02` (10.10.0.11), each with panels that fill as the steps go: AD DS database (`NTDS.dit` with partitions: schema, configuration, domain, DomainDnsZones, ForestDnsZones), DNS zones and their records, `SYSVOL`/`NETLOGON` shares with the two default GPOs, FSMO/GC badges. A replication arrow between them appears for the second DC. Names from topologydrafter `two-sites` (`DC01` 10.10.0.10).
- **State:** `{ servers: { DC01: { role: 'member'|'dc', partitions: [], zones: {name: [records]}, sysvol: [], fsmo: [], gc: bool, dnsClient: ip }, DC02: {...} }, connections: [], log: [] }`.
- **One step:** one promotion phase on one server; caption names what was created and why the next phase needs it.
- **Rules (Microsoft: "Install Active Directory Domain Services (Level 100)"; "DNS and AD DS"; MS-ADTS §6.3 "Publishing and locating a domain controller"):**
  1. Installing the AD DS role only adds binaries; nothing is a DC until promotion.
  2. New forest: the server creates the forest root domain (`quillmoor.example`, NetBIOS `QUILLMOOR`), sets forest and domain functional levels, asks for the DSRM password; the database gets schema, configuration and domain partitions.
  3. With "DNS server" chosen (default for the first DC), AD-integrated zones `quillmoor.example` and `_msdcs.quillmoor.example` are created, stored in DomainDnsZones / ForestDnsZones.
  4. After the reboot, Netlogon registers the DC's records: A record, `_ldap._tcp.quillmoor.example`, `_kerberos._tcp`, `_kpasswd._tcp`, `_ldap._tcp.dc._msdcs`, `_gc._tcp` (it is a GC), site-specific `_ldap._tcp.Default-First-Site-Name._sites`, and `<DSA-GUID>._msdcs` CNAME. Records are re-registered periodically (check interval).
  5. `SYSVOL` (`C:\Windows\SYSVOL`) and `NETLOGON` are shared; SYSVOL holds Default Domain Policy and Default Domain Controllers Policy; SYSVOL is replicated by DFSR (FRS is not supported for new domains since Windows Server 2019 (check)).
  6. The first DC holds all five FSMO roles and is a global catalog.
  7. Second DC: its DNS client must point at DC01, because it finds the domain by the SRV records of rule 4; with a public resolver it fails ("An Active Directory domain controller for the domain could not be contacted").
  8. Second DC promotion pulls schema, configuration, domain and DNS partitions from DC01 (or from IFM media), then the KCC creates a connection object in each direction; SYSVOL is copied by an initial DFSR sync from DC01 (non-authoritative).
  9. DC02 registers its own SRV records (rule 4) and, by default since Windows Server 2012, becomes a GC and DNS server (check). Clients now find two DCs.
- **Params:** `dns` toggle "install DNS server" default on; `dc2Dns` choice {DC01, public resolver} default DC01; `gc2` toggle default on.
- **Presets (4):**
  - `first-dc` — new forest on DC01: steps 1–6, ends with 5 partitions, 2 zones, ~10 records, 2 GPOs, 5 FSMO roles. Derived, unchecked.
  - `second-dc` — starts with DC01 done, DC02 promoted: rules 7–9; ends with 2 connection objects and records for both DCs.
  - `wrong-dns` — DC02's DNS points at a public resolver → step 7 fails, promotion stops.
  - `no-dns-role` — DC01 promoted without DNS and no other zone → Netlogon cannot register (rule 4 fails, event 5774 (check)), the domain cannot be found by clients.
- **Steps:** first-dc 7, second-dc 6, wrong-dns 3, no-dns-role 6.
- **Legend:** partition (cylinder slice), zone (folder), SRV record (row), share (hand icon), FSMO badge, replication arrow; "changed" highlight marks what the step created.
- **Captions:** hr: "Netlogon upisuje *SRV record* (SRV zapis) `_ldap._tcp.dc._msdcs.quillmoor.example` → DC01: po tome klijenti nalaze kontroler domene." en: "Netlogon writes the SRV record `_ldap._tcp.dc._msdcs.quillmoor.example` → DC01: that is how clients find a domain controller."
  hr: "DC02 traži domenu preko javnog DNS poslužitelja, a on ne zna za `quillmoor.example` — promocija staje." en: "DC02 asks a public DNS resolver for the domain; it knows nothing of `quillmoor.example` — promotion stops."
- **Terms:** domain controller — kontroler domene (check); promotion — promocija (check); zone — zona (URM ch14); resource record — resursni zapis (URM ch14); SRV record — SRV zapis; replication — replikacija; global catalog — globalni katalog (check).
- **Misconceptions:** installing the role makes a DC; AD and DNS are separate products you can wire up later; the second DC copies files from the first.
- **Out of scope:** the record details and what breaks per missing record (`win-dns-srv-records`), the SYSVOL version mismatch (`win-sysvol-dfsr`), sites and the KCC topology (`win-ad-sites`), RODC promotion.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dc-promotion sims/win-dc-promotion` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dc-promotion/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
