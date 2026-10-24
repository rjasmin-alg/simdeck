<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-domain-logon: spec

One concept: **a domain logon starts with the DC locator (a DNS SRV query, then an LDAP ping that tells the client
its site), then Kerberos with the DC found; when no DC can authenticate, a user who logged on at this PC before gets
in with cached credentials, anyone else does not.**

Task: `docs/tasks/w2/win-domain-logon.md` (catalogue §4.5.1, §5.21). Stepper. Top: the two sites and the tunnel
between them, PC07 where it is, the chosen DC outlined. Below: kit view K1 (message sequence chart,
`kit/sequence.js`) with the lanes PC07, DNS, DC01 and RODC01; beside it the result and PC07's cached credentials
(count / 10).

## Scene

| Party | Data |
|---|---|
| Domain | `quillmoor.example` (NetBIOS `QUILLMOOR`); sites `HQ` (subnet object 10.10.0.0/16) and `Branch` (10.20.0.0/16) |
| DC01 | 10.10.0.10, site HQ, writable DC, DNS server (AD-integrated zone) |
| RODC01 | 10.20.0.10, site Branch, read-only DC, DNS server (read-only copy of the zone) |
| WAN | IPsec tunnel between the sites: up or down |
| PC07 | an HQ laptop: in HQ 10.10.20.57, in Branch 10.20.20.57, offline no address on the domain network |
| Users | `QUILLMOOR\ana`, `QUILLMOOR\marko` |

From topologydrafter `two-sites` (HQ with DC01, Branch with RODC01 10.20.0.10, IPsec site-to-site), reduced to what
logon needs. Domain, DC01, PC07 and the sites are those of `win-dns-srv-records`, `win-domain-join` and
`win-ad-structure` (PC07 in Branch is 10.20.20.57 as in `win-dns-srv-records`; the task wrote 10.20.0.57).

**PC07's DNS server** is the DC of the site it is in (given by DHCP there): DNS on DC01 in HQ, DNS on RODC01 in
Branch. Offline it has none it can reach.

## Records the client asks for

From `win-dns-srv-records` (SPEC rule 2), the three it needs here; every one SRV, priority 0, weight 100, port 389.

| Owner (relative to `quillmoor.example`) | Targets, in order |
|---|---|
| `_ldap._tcp.dc._msdcs` | DC01 |
| `_ldap._tcp.HQ._sites.dc._msdcs` | DC01 |
| `_ldap._tcp.Branch._sites.dc._msdcs` | RODC01 |

**An RODC does not register the domain-wide (generic) locator records**, only those of its own site, so that
clients outside its site do not pick it (Microsoft Learn, RODC planning: "generic DNS SRV records are not registered
by an RODC by default" *(check)*). So the domain-wide record names DC01 alone.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `location` | `hq`, `branch`, `offline` | `hq` | where PC07 is |
| `lastSite` | `HQ`, `Branch`, `none` | `HQ` | the site PC07 remembers from its last logon (added: state `pc.site` of the task) |
| `user` | `ana`, `marko` | `ana` | who logs on (added: `offline-new-user` needs a user who never logged on here) |
| `subnets` | toggle | on | the subnet objects 10.10.0.0/16 → HQ, 10.20.0.0/16 → Branch exist |
| `wan` | toggle | on | the tunnel is up |
| `cachedOnPc` | toggle | off | `ana` has logged on at PC07 before: her cached verifier is on PC07 at the start |
| `rodcHasPwd` | toggle | off | RODC01 holds the passwords of the user logging on and of PC07 (its password replication policy allows both; a branch logon without the WAN needs both, fresh review) |

Every param resets the demo to step 0 (each can change the step count).

## Reachability

A message reaches its target when both ends are on the network and, if they are in different sites, the tunnel is up:
PC07 in HQ reaches DC01 always and RODC01 only with `wan`; in Branch the reverse; offline nothing. RODC01 reaches
DC01 only with `wan`. A message that crosses the tunnel is marked `wan` (the tunnel lights on the topology).

## Rules

1. **Locator, no site known.** With no remembered site (`lastSite` none) the client asks its DNS server for
   `_ldap._tcp.dc._msdcs.quillmoor.example` and LDAP-pings (CLDAP, UDP 389) the targets in the order of the answer
   (lowest priority, highest weight, then the first listed; real clients randomise), taking the first that answers.
   (Microsoft Learn, "How domain controllers are located in Windows"; [MS-ADTS] §6.3.6 *(check)*; task rule 1.)
2. **Site from the ping.** The DC's reply carries the client's site, computed from the client's address against the
   subnet objects, and whether the DC is in it ("closest"). With a site that differs from the DC's, the client asks
   `_ldap._tcp.<site>._sites.dc._msdcs.quillmoor.example` and pings the DC found there; if none answers, it keeps the
   DC that did (in this scene the DC of the client's own site always answers, so this case does not occur). The
   client stores the site for its next logon. With a remembered site, the client asks that site's
   record first (task rule 2).
   - **2a, remembered site does not answer.** If no target of the remembered site's record answers the ping (or the
     DNS query itself goes unanswered), the client asks the domain-wide record next (Microsoft Learn, as rule 1:
     "if no DC in the site responds, the locator tries any DC in the domain" *(check)*).
3. **No subnet.** With `subnets` off no subnet matches: the reply has no site, the client forgets the site it
   remembered and keeps the DC that answered (DR estate `student/configs/ad/quillmoor/forest.txt`: "no subnets
   defined — … clients pick DCs at random"; task rule 3).
4. **Kerberos.** Logon is the Kerberos AS exchange with the chosen DC: AS-REQ (the user), AS-REP (a TGT); the service
   ticket for PC07 that follows is named in the caption, not drawn (details in `win-kerberos`; task rule 4: "two
   arrows"). The DC locator for the KDC is not repeated: Kerberos goes to the DC just located.
5. **Cache on success.** A successful online logon stores (or refreshes) the user's cached verifier on PC07: one more
   step, a note on PC07. At most 10 users (Group Policy "Interactive logon: Number of previous logons to cache (in
   case domain controller is not available)", default 10); an 11th replaces the least recently used. Refreshing
   keeps the count and makes the user the most recently used.
6. **No DC can authenticate.** When the locator finds no DC that answers, or the RODC cannot authenticate (rule 7),
   PC07 looks in its cache (one step, a note on PC07): a user with a cached verifier logs on with cached credentials
   (no ticket, no new Group Policy, no access to file shares that need a ticket until a DC is back); a user never seen
   on this PC gets "We can't sign you in with this credential because your domain isn't available." (current
   Windows; older ones, and the task, "There are currently no logon servers available to service the logon request.")
   *(check: wording)*.
7. **RODC.** RODC01 answers the locator for site Branch. With the passwords of both the user and PC07 (`rodcHasPwd`)
   it answers the AS-REQ itself (it can then also issue PC07's own ticket). Otherwise it forwards the AS-REQ to a writable DC (DC01) over the WAN and passes the reply back (two more
   messages); with the WAN down the forward is lost and RODC01 answers PC07 with an error: rule 6 applies (the
   password replication policy itself is `win-rodc`) *(check: the error the client gets)*.

## Tie-breaks

- **T1 Answer order.** Targets in one answer are pinged in the answer's order (lowest priority, highest weight, then
  the first listed): `order` keeps the list order for equal priority and weight. Every answer here has one target, so
  the order shows only in the model's tests.
- **T2 Remembered site first.** A remembered site is asked before the domain-wide record; `none` asks the domain-wide
  record first.
- **T3 No DC pinged twice.** A DC that did not answer is not pinged again when a later answer names it (rule 2a: the
  domain-wide record after DC01 failed in HQ's record).
- **T4 No second site query.** The client asks one site's record at most once per logon: after the remembered site,
  a "not closest" reply naming that same site sends no new query. (A guard: no combination of this scene reaches
  it, since a remembered site's DC that answers is either in the client's site or names a site not yet asked.)
- **T5 Offline stops at DNS.** Offline, every DNS query is lost (one step each, no answer step): the remembered
  site's query (if any), then the domain-wide one; then rule 6.
- **T6 Cache only after a DC.** A cached verifier is stored only after an online Kerberos success; a cached logon
  stores nothing new.
- **T7 RODC with both passwords works without the WAN.** `rodcHasPwd` makes RODC01 answer the AS-REQ itself, tunnel
  up or down. Only the forward and DC01's reply cross the tunnel; PC07 ↔ RODC01 at the branch is local.

## Steps (one message or one event each)

- DNS query, DNS answer: 2 (offline: the query alone, lost: 1).
- LDAP ping, reply: 2 (a ping that does not reach its DC: the ping alone, lost: 1).
- Kerberos with DC01: AS-REQ, AS-REP: 2. With RODC01 holding the password: 2. Forwarded: AS-REQ to RODC01, forward to
  DC01, DC01's reply, RODC01's AS-REP: 4. Forward lost: AS-REQ, lost forward, RODC01's error: 3.
- Then one event: the verifier stored (success), or the cache looked up (cached logon or no logon).
- Offline: real Windows with no network at all goes to the cache almost at once; the two lost DNS queries show the
  locator's attempts (simplified).

| Preset | Params | Steps | End |
|---|---|---|---|
| `hq` | defaults | 7 | HQ record → DC01, ping (HQ, closest), AS-REQ, AS-REP, cache `ana` 1/10 |
| `branch-first` | `location` branch | 13 | HQ record → DC01 (over the WAN), ping, "Branch, not closest", Branch record → RODC01, ping (closest), AS-REQ to RODC01, forward to DC01, reply, AS-REP, cache 1/10; site now Branch |
| `branch-wan-down` | branch, `lastSite` Branch, `wan` off, `cachedOnPc` | 8 | Branch record → RODC01, ping (closest), AS-REQ, forward lost, error, cached logon `ana` (1/10) |
| `offline-new-user` | offline, `user` marko, `cachedOnPc` | 3 | HQ record lost, domain-wide lost, cache has `ana` only: no logon for `marko` |
| `no-subnets` | branch, `subnets` off, `lastSite` none | 7 | domain-wide → DC01, ping over the WAN, "no site", AS-REQ, AS-REP to DC01 over the WAN although RODC01 is next door, cache 1/10 |

Task counts were 7 / 9 / 7 / 4 / 6; the differences: `branch-first` pings RODC01 before using it (rule 2) and draws the
forward and its reply (rule 7); `branch-wan-down` remembers site Branch (with HQ remembered it never reaches RODC01,
see below) and draws the error; `offline-new-user` has no "typing the password" step; `no-subnets` has the cache step.

Other combinations: branch, WAN down, `lastSite` HQ: HQ record → DC01, ping lost, domain-wide → DC01, not pinged
again (T3), no DC: cached logon or none — 6 steps; the laptop never finds RODC01 next door, because only the Branch
record names it. HQ with `lastSite` Branch and the WAN up: Branch record → RODC01 over the WAN, "HQ, not closest", HQ
record → DC01, ping, AS, cache: 11. Branch with `lastSite` none: domain-wide → DC01, "Branch, not closest", Branch
record → RODC01: as `branch-first`, 13. Offline with `lastSite` none: 2. Minimum 2, maximum 13 (checked by
`numbers.py`, a hand count written from this section before the model, kept in the build thread's scratchpad,
not committed). `sim.json` `steps` = 7 (defaults).

## Out of scope

Kerberos message contents and the service ticket (`win-kerberos`), the RODC password replication policy and what an
RODC caches (`win-rodc`), site links and replication (`win-ad-sites`), what each SRV record is for and what breaks
when one is missing (`win-dns-srv-records`), Group Policy processing (`win-gpo-processing`), the computer account and
its secure channel, NetBIOS DC location, the KDC lookup, DNS answer order (round robin), cached-verifier format.

## Sources

- Task file `docs/tasks/w2/win-domain-logon.md`; catalogue §4.5.1, §5.21.
- Microsoft Learn: "How domain controllers are located in Windows" / "Locating Active Directory domain controllers in
  Windows and Windows Server"; "Interactive logon: Number of previous logons to cache (in case domain controller is
  not available)" (default 10); RODC planning and deployment (generic SRV records not registered by an RODC;
  credential forwarding to a writable DC) — titles from the task and from memory, not opened in this session
  *(check)*.
- [MS-ADTS] §6.3 "Publishing and locating a domain controller" *(check: section numbers)*.
- topologydrafter `js/samples.js`, sample `two-sites` (HQ DC01, Branch RODC01 10.20.0.10, IPsec tunnel; "If the
  tunnel drops, the branch still logs in — locally").
- DR estate `student/configs/ad/quillmoor/forest.txt` ("no subnets defined — BRK and colo clients pick DCs at
  random").
- `sims/win-dns-srv-records/` (record names, `pick`, PC07's addresses), `sims/win-ad-structure/` (sites and subnets).
