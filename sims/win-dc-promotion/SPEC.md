<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dc-promotion: specification

One concept: **what promoting a domain controller does: AD DS, the DNS zone and SRV records, SYSVOL, the first
replication** (task `docs/tasks/w2/win-dc-promotion.md`, catalogue §4.5.1, §5.21). The student steps a server
becoming the first DC of a new forest, then a second DC joining it.

## Scene

- **Two server boxes**, `DC01` (10.10.0.10) and `DC02` (10.10.0.11) (topologydrafter sample `two-sites`), side by
  side. Each box's head: name, address, what it is now (server / AD DS role installed / domain controller), and
  its DNS client setting (the DNS server it asks). Its four panels fill as the steps go:
  - **AD DS database** `NTDS.dit`: five slots for the partitions schema, configuration, domain
    (`quillmoor.example`), `DomainDnsZones`, `ForestDnsZones`; an empty slot is dashed.
  - **DNS server**: the zones it holds (`quillmoor.example`, `_msdcs.quillmoor.example`), each with the partition
    it is stored in and its record count.
  - **SYSVOL**: the shares `SYSVOL` and `NETLOGON`, the two default GPOs with their GUIDs, the replication engine
    (DFSR).
  - **Roles**: the five FSMO badges and the GC badge; the domain line (domain, NetBIOS name, functional level,
    DSRM password set).
- **Between the boxes:** the replication column: the initial replication (dashed, DC01 → DC02), the SYSVOL sync
  (dashed, DC01 → DC02), and the two KCC connection objects (solid, one each way).
- **Under the boxes:** the zone content, one row per record name (owner name and type), with a chip per target DC
  (port and host for SRV, address for A, host for CNAME). Records Netlogon tried and could not register are shown
  struck through with ✕.
- **DNS query card** (DC02's locating step): whom it asked, what, and the answer.

## State

```
servers: { DC01: S, DC02: S }
S = { ip, role: 'server' | 'binaries' | 'promoting' | 'dc',
      partitions: [ 'schema' | 'config' | 'domain' | 'domainDns' | 'forestDns' ],   (in that order)
      zones: { 'quillmoor.example': [rec], '_msdcs.quillmoor.example': [rec] },   (only zones the server holds)
      dnsServer: bool, sysvol: [gpoId], shares: [ 'SYSVOL', 'NETLOGON' ], dfsr: bool,
      fsmo: [ 'schema', 'naming', 'rid', 'pdc', 'infrastructure' ], gc: bool, dsrm: bool, dnsClient: ip,
      failed: [rec] }                                        (records Netlogon could not register)
rec = { zone, name, type: 'A' | 'SRV' | 'CNAME', dc, port?, data }   (name relative to the zone, '@' = the apex)
domain: null | { name: 'quillmoor.example', netbios: 'QUILLMOOR', level: '2016' }
connections: [ { from, to } ]                                (KCC connection objects; an object on DC02 says
                                                              "replicate from DC01")
flows: [ { from, to, kind: 'initial' | 'sysvol' } ]          (this step's one-off copies, arrows for one step)
query: null | { from, server, name, answer: 'found' | 'nxdomain' | 'noServer', target? }
log: [ code per step ]   phase   result: null | 'ok' | 'stopped' | 'unregistered'
```

Records in a zone are sorted by name, then type, then DC. `rec.data` is the RDATA as text: an SRV is
`0 100 <port> <host>.` (priority 0, weight 100, RFC 2782), an A the address, a CNAME the host.

## Params

| key | values | default | meaning |
|---|---|---|---|
| `server` | `dc01`, `dc02` | `dc01` | which promotion is stepped: DC01 as the first DC of a new forest, or DC02 added to it (DC01 done) |
| `dns` | bool | on | DC01 installs the DNS server role during its promotion (the wizard's default for the first DC) |
| `dc2Dns` | `dc01`, `public` | `dc01` | DC02's DNS client: DC01 (10.10.0.10) or a public resolver (203.0.113.53, documentation range, RFC 5737) |
| `gc2` | bool | on | DC02 is made a global catalog |

`dc2Dns` and `gc2` are shown only for `server: dc02`. With `server: dc02`, DC01 starts in the state the DC01 run
ends in with the same `dns`.

## Steps (one step = one promotion phase on one server)

DC01, new forest (`server: dc01`):

| # | phase | what it creates | rule |
|---|---|---|---|
| 1 | `role` | AD DS binaries; still a plain server | 1 |
| 2 | `forest` | domain `quillmoor.example`, NetBIOS `QUILLMOOR`, forest and domain functional level, DSRM password | 2 |
| 3 | `database` | `NTDS.dit` with schema, configuration, domain | 2 |
| 4 | `dns` (only with `dns`) | DNS server; partitions `DomainDnsZones`, `ForestDnsZones`; zones `quillmoor.example` (in DomainDnsZones) and `_msdcs.quillmoor.example` (in ForestDnsZones), empty; DNS client → 127.0.0.1 | 3 |
| 5 | `sysvol` | `C:\Windows\SYSVOL`, shares SYSVOL and NETLOGON, the two default GPOs, DFSR | 5 |
| 6 | `reboot` | the server restarts as a DC: all five FSMO roles, GC | 6 |
| 7 | `register` | Netlogon (and the DNS client, for the host's A) registers 10 records — or, without a zone, none: 10 failures, event 5774 | 4 |

So `first-dc` has 7 steps and `no-dns-role` 6.

DC02, additional DC (`server: dc02`):

| # | phase | what happens | rule |
|---|---|---|---|
| 1 | `role` | AD DS binaries on DC02 | 1 |
| 2 | `locate` | DC02 asks its DNS server for `_ldap._tcp.dc._msdcs.quillmoor.example` SRV. At DC01 with DNS: found, `dc01.quillmoor.example` 10.10.0.10; the wizard's options are set (DSRM password, DNS server if the domain's DCs run DNS, GC per `gc2`). Public resolver: no such name. DC01 without DNS: no DNS server answers. | 7 |
| 3 | `stop` (failure) — or `replicate` | failure: "An Active Directory domain controller for the domain could not be contacted", the run ends (3 steps). Success: DC02 pulls schema, configuration, domain and (if DC01 has them) the two DNS partitions from DC01; an initial replication arrow DC01 → DC02 | 7, 8 |
| 4 | `reboot` | DC02 restarts as a DC: GC if `gc2`, its DNS server loads the zones from the DNS partitions; the KCC on each DC creates an inbound connection object: DC01 → DC02 and DC02 → DC01 | 8, 9 |
| 5 | `sysvol` | after the restart, the initial (non-authoritative) DFSR sync from DC01 copies both GPOs; only then are SYSVOL and NETLOGON shared on DC02 | 8 |
| 6 | `register` | DC02 registers its records (9, or 8 without GC) at DC01 (its DNS client); AD replication carries them into DC02's copy, so both DNS servers hold 19 (18); `_ldap._tcp.dc._msdcs` now names two DCs | 9 |

So `second-dc` has 6 steps and `wrong-dns` 3.

## Rules

1. **The role is only binaries.** Installing the AD DS role copies the files; the server is no DC, has no database,
   no shares, no records until it is promoted (Microsoft Learn, "Install Active Directory Domain Services (Level
   100)": the role installation, then "Promote this server to a domain controller").
2. **New forest.** The first DC creates the forest root domain `quillmoor.example` (NetBIOS `QUILLMOOR`), sets the
   forest and domain functional levels (shown as "2016", the wizard's default on current Windows Server *(check)*),
   and asks for the DSRM password. Its database `NTDS.dit` gets the schema, configuration and domain partitions
   (Microsoft Learn, same document; [MS-ADTS] §3.1.1.1 naming contexts).
3. **DNS with AD.** With "DNS server" chosen (the default for the first DC), the AD-integrated zones
   `quillmoor.example` and `_msdcs.quillmoor.example` are created and stored in the application partitions
   `DomainDnsZones` and `ForestDnsZones` respectively; the partitions are created with them. The DC's DNS client is
   pointed at itself (127.0.0.1) *(check)*. Without DNS neither partition nor zone exists.
4. **Netlogon registers the DC's records** after the restart ([MS-ADTS] §6.3.2, "DNS records registered by a DC").
   The page shows 10 of them for DC01 (the real list is longer; the full list and what each is for are
   `win-dns-srv-records`):

   | zone | name | type | data |
   |---|---|---|---|
   | quillmoor.example | `@` (the domain name) | A | 10.10.0.10 |
   | quillmoor.example | `dc01` | A | 10.10.0.10 (the host record, from the DNS client) |
   | quillmoor.example | `_ldap._tcp` | SRV | 0 100 389 dc01.quillmoor.example. |
   | quillmoor.example | `_kerberos._tcp` | SRV | 0 100 88 dc01.quillmoor.example. |
   | quillmoor.example | `_kpasswd._tcp` | SRV | 0 100 464 dc01.quillmoor.example. |
   | quillmoor.example | `_gc._tcp` | SRV | 0 100 3268 dc01.quillmoor.example. (a GC, forest root zone) |
   | quillmoor.example | `_ldap._tcp.Default-First-Site-Name._sites` | SRV | 0 100 389 dc01.quillmoor.example. |
   | _msdcs.quillmoor.example | `_ldap._tcp.dc` | SRV | 0 100 389 dc01.quillmoor.example. |
   | _msdcs.quillmoor.example | `_ldap._tcp.pdc` | SRV | 0 100 389 dc01.quillmoor.example. (PDC emulator only) |
   | _msdcs.quillmoor.example | `<DSA-GUID>` | CNAME | dc01.quillmoor.example. |

   The DSA GUIDs are invented: DC01 `3b6f0c2e-8a41-4d7e-9c15-2f7a9e40b1d3`, DC02
   `a8d24f61-0c9b-47e2-b3f8-6e15c7d9024a`. Ports: LDAP 389, Kerberos 88, kpasswd 464, GC 3268 (IANA). The records
   are re-registered periodically; the interval is given as 60 minutes ([MS-ADTS] §6.3.1.10,
   `DynamicRegistrationRefreshInterval`; TechNet `DnsRefreshInterval` 3600 s) and as 24 hours (Microsoft blog)
   *(check)*: the page says "periodically".
   **Registration needs a zone:** a record is registered only if the DNS server in the DC's DNS client setting holds
   the zone. Otherwise every record fails and Netlogon logs event 5774 (Microsoft support, "A DNS update is recorded
   as failed: Event ID 5774, 1196, or 1578"). In `no-dns-role` DC01's DNS client still asks the public resolver,
   which holds no `quillmoor.example`: 10 failures, no records, clients cannot find the domain.
5. **SYSVOL.** `C:\Windows\SYSVOL` is created, shared as `SYSVOL`, and its `scripts` folder as `NETLOGON`. It holds
   the Default Domain Policy `{31B2F340-016D-11D2-945F-00C04FB984F9}` and the Default Domain Controllers Policy
   `{6AC1786C-016F-11D2-945F-00C04FB984F9}` (well-known GUIDs). SYSVOL is replicated by DFSR; a server from Windows
   Server 2019 on cannot be promoted into a domain that still uses FRS (Microsoft support KB 4493934) *(check:
   that new domains never use FRS)*.
6. **First DC: all five FSMO roles and a GC.** Schema master, domain naming master, RID master, PDC emulator,
   infrastructure master; and the global catalog. The roles stay on DC01 when DC02 comes (no transfer).
7. **The second DC finds the domain through DNS.** DC02 looks up `_ldap._tcp.dc._msdcs.quillmoor.example` (SRV, rule
   4) at the DNS server in its DNS client setting. Only a server holding the zone answers. A public resolver
   answers "no such name"; DC01 without the DNS role does not answer at all. Either way promotion stops: "An Active
   Directory domain controller for the domain could not be contacted" (the wizard's message).
8. **The second DC replicates, it does not copy files.** DC02 pulls schema, configuration, domain and the DNS
   partitions from DC01 by AD replication (or from IFM media, not modelled). After its restart the KCC creates one
   connection object on each DC (DC01 replicates from DC02, DC02 from DC01): 2 in all; DC01's in reality appears on
   its next KCC run (every 15 minutes), the page shows both at DC02's restart. SYSVOL arrives by an initial,
   non-authoritative DFSR sync from DC01 **after the restart** (DFSR events 4614, 4604); only when it is done is
   SYSVOL shared and does the DC register (advertise) itself: DC02 ends with the same two GPOs (same GUIDs).
   For the first DC the page keeps the task's order (SYSVOL created during promotion, before the restart); that it
   is shared only after the restart is not drawn *(check)*.
9. **DC02 registers its own records** as in rule 4, minus the PDC record (the FSMO roles stay on DC01) and minus
   `_gc._tcp` without GC: 9, or 8. It becomes a GC and a DNS server by default (GC always selected by default since
   Windows Server 2012; DNS selected by default when the domain's DCs already run DNS: Microsoft Learn, "Install a
   Replica Windows Server 2012 Domain Controller in an Existing Domain (Level 200)"). Its zones come with the DNS
   partitions; it registers its records at the DNS server its client asks (DC01), and AD replication carries them
   into DC02's copy, so both DNS servers end with the same 19 records (18 without GC),
   and `_ldap._tcp.dc._msdcs` names both DCs: clients find two.

## Tie-breaks and edge cases

- **T1** `dns` off on DC01: the `dns` step is skipped (6 steps), the database has 3 partitions, no zone exists,
  DC01's DNS client stays at the public resolver.
- **T2** With `server: dc02` and DC01 without DNS, pointing DC02 at DC01 fails like the public resolver (no
  server answers): 3 steps, reason `noServer`, not `nxdomain`.
- **T3** `gc2` off changes only DC02 (badge and `_gc._tcp`); DC01 is always a GC.
- **T4** DC02 never gets a FSMO role or the `_ldap._tcp.pdc` record.
- **T5** Connection objects appear only at DC02's `reboot`; the initial replication and the SYSVOL sync are
  one-step flows, not connection objects.
- **T6** DC02's own DNS client is not changed by its promotion (it keeps 10.10.0.10).
- **T7** In a failed run nothing on DC02 changes after `role`: no partitions, shares, records; DC01 is untouched.
- **T8** Records are deduplicated by (zone, name, type, dc): registering twice does not add rows.

## Expected numbers (checked by `sim.test.js` and a separate hand count)

| preset | params | steps | end |
|---|---|---|---|
| `first-dc` | dc01, dns on | 7 | DC01: 5 partitions, 2 zones, 10 records (7 + 3), 2 shares, 2 GPOs, 5 FSMO, GC |
| `second-dc` | dc02, dc2Dns dc01, gc2 on | 6 | DC02: 5 partitions, 2 zones, 2 GPOs, 0 FSMO, GC; 2 connections; 19 records on each DNS server; `_ldap._tcp.dc` → 2 DCs |
| `wrong-dns` | dc02, dc2Dns public | 3 | result `stopped`, `nxdomain`; DC02 only has the binaries |
| `no-dns-role` | dc01, dns off | 6 | 3 partitions, 0 zones, 0 records, 10 failed, result `unregistered` |

Other combinations: dc02 with gc2 off: 6 steps, 18 records; dc02 with DC01 without DNS: 3 steps (`noServer`).

## Sources

- Task file `docs/tasks/w2/win-dc-promotion.md`, model and presets.
- Microsoft Learn: "Install Active Directory Domain Services (Level 100)"; "Install a Replica Windows Server 2012
  Domain Controller in an Existing Domain (Level 200)" (GC and DNS defaults); "Verify SRV DNS records have been
  created".
- [MS-ADTS] §6.3 "Publishing and locating a domain controller" (§6.3.2 the record list, §6.3.1.10 the refresh).
- Microsoft support: KB 4493934 (FRS and Windows Server 2019); "A DNS update is recorded as failed: Event ID 5774,
  1196, or 1578".
- RFC 2782 (SRV: priority, weight, port, target), RFC 5737 (203.0.113.0/24 for documentation).
- `~/projects/uvod-u-racunalne-mreze` ch. 14 (zona, resursni zapis); topologydrafter `two-sites` (DC01 10.10.0.10).
