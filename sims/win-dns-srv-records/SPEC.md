<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-srv-records: spec

One concept: **a domain controller publishes itself in DNS as SRV records (`_ldap._tcp`, `_kerberos._tcp`, the
`_msdcs` subzone, one set per site); a client finds a DC and a KDC only through them, so a missing record, or a
DNS server that does not hold them, breaks join and logon; Netlogon puts deleted records back.**

Task: `docs/tasks/w2/win-dns-srv-records.md` (catalogue §4.5.3, §5.21). Stepper. Left: the records of
`quillmoor.example` and `_msdcs.quillmoor.example`, grouped by what uses them. Right: kit view K1 (message sequence
chart, `kit/sequence.js`) of the client's lookups and messages.

## Scene

| Party | Data |
|---|---|
| Domain | `quillmoor.example` (NetBIOS `QUILLMOOR`), one domain in its forest; sites `HQ` (10.10.0.0/16) and `Branch` (10.20.0.0/16) |
| DC01 | 10.10.0.10, site HQ, PDC emulator, global catalog, runs the DNS server the client asks (AD-integrated zones) |
| DC02 | 10.20.0.10, site Branch, global catalog |
| Client | `PC07`; in HQ 10.10.20.57, in Branch 10.20.20.57 |
| User | `QUILLMOOR\ana`: joins PC07 (join) or logs on at it (logon) |
| Public resolver | 203.0.113.53 (RFC 5737 documentation range): no zone `quillmoor.example` |

Names, addresses and DSA GUIDs are those of `win-dc-promotion` and `win-domain-join` (same domain, DC01, PC07); the
sites are `win-ad-structure`'s (HQ, Branch). DC02 is in Branch here (in `win-dc-promotion` it is a second DC in the
one default site).

## Records (rule 2)

Owner names relative to `quillmoor.example`; zone `D` = `quillmoor.example`, `M` = `_msdcs.quillmoor.example`. Every
SRV record has priority 0, weight 100 (the default Netlogon registers) and the target `dc01.quillmoor.example.` or
`dc02.quillmoor.example.`. Each row lists its targets in this order (DC01 before DC02).

| # | owner | zone | type | port | targets | use (display group) | deleted by |
|---|---|---|---|---|---|---|---|
| 1 | `_ldap._tcp` | D | SRV | 389 | DC01, DC02 | locator (LDAP clients that are not Windows) | `locator` |
| 2 | `_ldap._tcp.dc._msdcs` | M | SRV | 389 | DC01, DC02 | locator: any DC of the domain | `locator` |
| 3 | `_ldap._tcp.HQ._sites.dc._msdcs` | M | SRV | 389 | DC01 | locator: a DC in site HQ | `siteRecord` |
| 4 | `_ldap._tcp.Branch._sites.dc._msdcs` | M | SRV | 389 | DC02 | locator: a DC in site Branch | `siteRecord` |
| 5 | `_ldap._tcp.pdc._msdcs` | M | SRV | 389 | DC01 | locator: the PDC emulator | `locator` |
| 6 | `_kerberos._tcp` | D | SRV | 88 | DC01, DC02 | Kerberos (RFC 4120 clients) | `kerberos` |
| 7 | `_kerberos._tcp.dc._msdcs` | M | SRV | 88 | DC01, DC02 | Kerberos: any KDC of the domain | `kerberos` |
| 8 | `_kerberos._tcp.HQ._sites.dc._msdcs` | M | SRV | 88 | DC01 | Kerberos: a KDC in HQ | `kerberos`, `siteRecord` |
| 9 | `_kerberos._tcp.Branch._sites.dc._msdcs` | M | SRV | 88 | DC02 | Kerberos: a KDC in Branch | `kerberos`, `siteRecord` |
| 10 | `_kpasswd._tcp` | D | SRV | 464 | DC01, DC02 | Kerberos password change | `kerberos` |
| 11 | `_gc._tcp` | D | SRV | 3268 | DC01, DC02 | global catalog | `gc` |
| 12 | `_ldap._tcp.gc._msdcs` | M | SRV | 3268 | DC01, DC02 | global catalog | `gc` |
| 13 | `3b6f0c2e-8a41-4d7e-9c15-2f7a9e40b1d3._msdcs` | M | CNAME | — | dc01 | replication (DSA GUID) | — |
| 14 | `a8d24f61-0c9b-47e2-b3f8-6e15c7d9024a._msdcs` | M | CNAME | — | dc02 | replication | — |

14 owner names, 21 records: DC01 11, DC02 10. A record is present unless a group that deletes it is switched on
(a record in two groups goes with either); Netlogon on DC01 can put DC01's back (rule 1).

Not drawn: the A records, the zone-level site records (`_ldap._tcp.<site>._sites`, `_kerberos._tcp.<site>._sites`,
`_gc._tcp.<site>._sites`), `_kerberos._udp`, `_kpasswd._udp`, `_ldap._tcp.<site>._sites.gc._msdcs`, the domain-GUID
record (`_ldap._tcp.<GUID>.domains._msdcs`); the real list is about 25 per DC ([MS-ADTS] §6.3.2) *(check)*.

## Params

| Param | Values | Default |
|---|---|---|
| `action` | `join`, `logon` | `join` |
| `site` | `hq` (in HQ, knows it), `branch` (in Branch, knows it), `unknown` (in Branch, has not learnt its site yet). For a logon, `hq` and `branch` know their site; a computer being joined never does (rule 3), so for `join` `branch` and `unknown` are the same | `hq` |
| `dns` | `dc01` (10.10.0.10), `public` (203.0.113.53) | `dc01` |
| `locator` | toggle: delete records 1, 2, 5 | off |
| `siteRecord` | toggle: delete records 3, 4, 8, 9 | off |
| `kerberos` | toggle: delete records 6–10 | off |
| `gc` | toggle: delete records 11, 12 | off |
| `restartNetlogon` | toggle: restart Netlogon on DC01 before the client starts | off |

The task's button `restartNetlogon` is a toggle (the state is replayed from the params, see NOTES "Deviations").
Every param resets the demo to step 0 (each changes the step count).

## Rules

1. **Netlogon registers and re-registers.** A DC's Netlogon service registers its locator records at start and
   again periodically (24 h by default per the Group Policy setting "Refresh Interval of DC Locator DNS Records" /
   `DnsRefreshInterval`; 60 min is also cited, from [MS-ADTS] §6.3.1.10 *(check)*; the page says "periodically"). Restarting Netlogon (or `nltest /dsregdns`) registers them again at once, so deleted ones come
   back (Microsoft Learn, "Verify SRV DNS records have been created" *(check)*). Here: with `restartNetlogon`,
   step 1 is the restart on DC01, step 2 its dynamic UPDATE to the DNS server on DC01 carrying DC01's 11 records,
   step 3 the answer; DC01's deleted records are present again from step 3, **DC02's stay deleted** (its Netlogon was
   not restarted). The UPDATE shows the 11 records it carries, its answer how many were missing (`+k`; 0 when nothing
   was deleted). Simplified: Netlogon sends one update per name, the page one message for all.
2. **The records** are the table above (RFC 2782 format `_service._proto.name TTL class SRV priority weight port
   target`; ports IANA: LDAP 389, Kerberos 88, kpasswd 464, GC 3268).
3. **DC locator.** The client asks its DNS server for `_ldap._tcp.<site>._sites.dc._msdcs.quillmoor.example` if it
   knows its site, otherwise for `_ldap._tcp.dc._msdcs.quillmoor.example`. A computer being joined is not a member
   and has no stored site, so a join always starts with the domain-wide record (the join error names that query;
   fresh review); a member logging on knows the site it learnt before (`hq`, `branch`), unless `unknown`. It picks a target (rule 8), sends a CLDAP
   "LDAP ping" (UDP 389), and the DC answers with the client's site (from the client's address and the site
   subnets) and whether the DC is in it ("closest"). A client that did not know its site stores the site from the
   answer; if the DC was not in it, the client asks for that site's record and pings the DC found there (Microsoft
   Learn, "How domain controllers are located in Windows" / "Locating Active Directory domain controllers in
   Windows and Windows Server"; [MS-ADTS] §6.3.6 *(check)*).
4. **Site fallback.** If the site record is missing (NXDOMAIN), the client asks for the domain-wide record and may
   get a DC in another site: the join or logon works, over the WAN (`wan` in the result: the located DC or the KDC
   is not in the client's site). A client that already
   asked its site record does not ask it again after the ping.
5. **No DC.** If neither query finds a target, the run ends: join "An Active Directory Domain Controller (AD DC)
   for the domain quillmoor.example could not be contacted" (DNS name does not exist); logon "We can't sign you in
   with this credential because your domain isn't available" (current Windows; older ones say "There are currently
   no logon servers available to service the logon request") (wording *(check)*; cached credentials, which would let
   a user who logged on before in, are not modelled).
6. **KDC.** For Kerberos the client looks up a KDC the same way: `_kerberos._tcp.<site>._sites.dc._msdcs` for its
   site (now known), then `_kerberos._tcp.dc._msdcs` ([MS-ADTS] §6.3.6, the KDC flag *(check)*; RFC 4120 §7.2.3
   for `_kerberos._tcp.<realm>`). It sends AS-REQ (ana) to the KDC found and gets AS-REP (a TGT). If no KDC is found
   it falls back to NTLM with the DC it located (one request, one answer here): the action works, without a Kerberos
   ticket (result `ntlm`). Where policy forbids NTLM it would fail (not modelled) *(check)*.
7. **Public resolver.** A client whose DNS server is 203.0.113.53 gets NXDOMAIN for every `_msdcs` name, with every
   record present: rule 5's failure, and the record list stays green.
8. **Picking a target** (RFC 2782): the lowest priority; among those, the highest weight; among equal priority and
   weight the **first listed** (real clients pick at random, in proportion to weight). All records here are 0 100,
   so the first listed wins: DC01 before DC02 in every domain-wide answer.
9. **Global catalog.** Neither join nor logon in a one-domain forest needs a GC here: deleting `_gc._tcp` and
   `_ldap._tcp.gc._msdcs` changes no step; the last caption says what would use them (forest-wide searches,
   universal groups and UPN logon in a forest of several domains) *(check)*.
10. **Replication CNAMEs** are used by DCs to find replication partners, never by a client; they have no toggle.

## Tie-breaks

- **T1 First listed.** Equal priority and weight: the first target in the answer (DC01).
- **T2 Site known: site record first.** A logon from `hq`/`branch` asks the site record before the domain-wide one;
  `unknown`, and every join, asks the domain-wide one first and the site record only after the ping.
- **T3 No second site query.** After a site query that failed, a "not closest" ping answer does not send another.
- **T4 Restart restores DC01 only,** and only records whose groups are deleted; DC02's stay deleted.
- **T5 DNS before Kerberos.** With no DC found, the run stops before any KDC lookup (no NTLM either).
- **T6 Public DNS stops at the first failure chain.** Every query NXDOMAIN; the restart (if on) still restores DC01's
  records in the DNS server on DC01, which the client does not ask.
- **T7 GC toggle never changes the steps.**

## Steps (one message or one event each)

Restart (optional): 1 note "Netlogon restarted" on DC01, 2 UPDATE DC01 → DNS (DC01), 3 answer — **3**.

Locator: each query is two steps (query, answer). Site known (logon): site query; if NXDOMAIN, the domain-wide
query; if that is NXDOMAIN too, the run ends (2 or 4 steps). Site not known (every join, `unknown` logon): the
domain-wide query (NXDOMAIN ends it, 2 steps). Then ping and answer (2). Not known and not closest: the site query
(2), then if it names a DC, ping and answer (2).

KDC: site query (2); if NXDOMAIN the domain-wide query (2). Then AS-REQ, AS-REP (2) or, with no KDC, NTLM request
and answer (2).

| Preset | Params | Steps | End |
|---|---|---|---|
| `healthy-join` | defaults | 8 | domain-wide query → DC01 (first listed), ping (HQ, closest; site learnt), KDC HQ → DC01, AS ✓: joined via DC01 |
| `no-locator` | `locator`, `siteRecord` | 2 | domain-wide NXDOMAIN: no DC, join fails (`locator` alone does the same) |
| `no-site-record` | logon, `branch`, `siteRecord` | 12 | site NXDOMAIN, domain-wide → DC01 (first listed), ping (Branch, not closest), KDC Branch NXDOMAIN, KDC domain-wide → DC01, AS ✓: logon via DC01 in HQ over the WAN |
| `public-dns` | `dns` public | 2 | NXDOMAIN from the resolver, records all present: join fails |
| `netlogon-fix` | `locator`, `siteRecord`, `restartNetlogon` | 3 + 8 = 11 | DC01's 5 deleted records back (DC02's 4 not); then as `healthy-join` |
| `no-kerberos` (added) | logon, `kerberos` | 10 | locator → DC01; KDC HQ NXDOMAIN, domain-wide NXDOMAIN; NTLM to DC01 ✓: logon without Kerberos |

Other combinations: a join from Branch, or `unknown`, with all records: domain-wide → DC01, ping (Branch, not
closest), Branch site → DC02, ping DC02 (closest), KDC Branch → DC02, AS: 12. A logon with only `locator` deleted
works from its site record (8). `no-locator` and `public-dns` as logons: 4 (site query, then domain-wide). Maximum over all params: 17 (restart + Branch or `unknown` + `kerberos`: DC01's
Kerberos records are back, DC02's are not, so the KDC is DC01 in HQ while the located DC is DC02). `sim.json` `steps` = 8 (defaults).

## Out of scope

Kerberos ticket details (`win-domain-logon`, `win-kerberos`), the promotion that registers the records
(`win-dc-promotion`), who may update a record (`win-dns-dynamic-update`), the computer account and secure channel
(`win-domain-join`), NetBIOS/WINS DC location, the DC locator cache, cached logons.

## Sources

- Task file `docs/tasks/w2/win-dns-srv-records.md`; catalogue §4.5.3, §5.21.
- Microsoft Learn: "How domain controllers are located in Windows" / "Locating Active Directory domain controllers in
  Windows and Windows Server"; "How DNS Support for Active Directory Works"; "Verify SRV DNS records have been
  created"; "DNS requirements for installing Active Directory"; the `nltest` reference (`/dsgetdc`, `/dsregdns`)
  (titles from the task, cited from memory *(check)*).
- [MS-ADTS] §6.3 "Publishing and locating a domain controller" (§6.3.2 the records, §6.3.1.10 the refresh, §6.3.6
  locating a DC) *(check: section numbers)*.
- RFC 2782 (SRV; priority, weight; selection), RFC 4120 §7.2.3 (KDC by SRV), RFC 5737 (documentation addresses).
- `sims/win-dc-promotion/` (domain, DCs, GUIDs, record set), `sims/win-domain-join/` (PC07, 10.10.20.57),
  `sims/win-ad-structure/` (sites HQ, Branch and their subnets).
