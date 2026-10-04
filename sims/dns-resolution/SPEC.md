<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dns-resolution: specification

One concept: **the resolver asks the root, TLD and authoritative servers; the client asks once** (task
`docs/tasks/w2/dns-resolution.md`, catalogue `inet-dns-resolution`, §4.2 and §5.4). The student steps a lookup, then
repeats it warm.

## Scene

Kit view K1 (message sequence chart), five lanes left to right:

| Lane | Party | Address / zone |
|---|---|---|
| `S` | *stub* rezolver on the host | `192.168.1.5` |
| `R` | rekurzivni rezolver | `192.168.1.99` |
| `root` | korijenski poslužitelj | `a.root-servers.net` (zone `.`) |
| `tld` | poslužitelj za `.hr` | `a.ns.hr` (zone `hr`) |
| `auth` | mjerodavni poslužitelj za `grafo.hr` | `ns1.grafo.hr` (zone `grafo.hr`) |

Host and resolver addresses from URM ch14 Primjer 1. The `.hr` and `grafo.hr` server names and their addresses
(documentation ranges `198.51.100.0/24`, `203.0.113.0/24`) are invented; `a`/`b.root-servers.net` and their
addresses are the real root servers. Beside the chart: the resolver's **cache** (name, type, data, TTL left with a
draining bar; ⊘ on a negative entry; expired entries struck through) and a **message card** (kind, flags, question,
the RRs it carries).

## Zones (fixed)

| Zone | Servers (NS order) | Holds |
|---|---|---|
| `.` | `a.root-servers.net 198.41.0.4`, `b.root-servers.net 170.247.170.2` (root hints) | cut `hr`: NS `a.ns.hr`, `b.ns.hr`, glue `198.51.100.10`, `.11`, TTL 172800 s; SOA 86400 / 86400 |
| `hr` | `a.ns.hr`, `b.ns.hr` | cut `grafo.hr`: NS `ns1.grafo.hr`, `ns2.grafo.hr`, glue `203.0.113.53`, `.54`, TTL `ttlNS`; SOA 3600 / 3600 *(derived)* |
| `grafo.hr` | `ns1.grafo.hr`, `ns2.grafo.hr` | `www` A `203.0.113.80`, `mail` A `203.0.113.25`, TTL `ttlA`; SOA TTL 3600, MINIMUM 900 |

## State

`{ t, lookup (1|2), query: {name, type}, phase, target, pendingReply, cache: [{name, type, data[], ttl, expiresAt,
negative, glue?, hint?}], msgs: [{n, lookup, t, from, to, kind, rd, ra, aa, q, rr?, zone?, ns?, glue?, ttl?, soa?,
fromCache?, server?}], touched: [{key, how}], lookupStart: [n], outcome: [...] }`. `kind` is `query`, `referral`,
`answer` or `nxdomain`. A NXDOMAIN cache entry has type `NXDOMAIN` and `negative: true`. `touched` names the cache rows
this step added or used ("changed" marks).

## One step = one message

The run is two lookups: the first (`name`) at t = 0 from an empty cache (only the root hints), the second (`again`:
the same name or another) at t = `advance`, with the cache kept. Inside a lookup the resolver's order is (RFC 1034
§5.3.3; URM ch14 "vršni algoritam ... četiri koraka"):

1. Look in the cache for the exact answer, or a cached negative answer for the name.
2. If missing, find the deepest zone whose NS set is cached and valid and has an address for one of its servers
   (root hints if none).
3. Send an iterative query there.
4. On a referral, cache the NS and glue and go to 2; on an answer or NXDOMAIN, cache it and reply to the stub.

Messages carry no travel time: every message of a lookup has the lookup's t (0 s, or `advance`).

## Rules

1. **The stub asks once.** It sends one recursive query (`rd` set) and gets an answer or an error, never a referral
   (RFC 1034 §4.3.1; URM ch14 "rekurzivni upit"; UL ch19 "*stub* rezolver").
2. **Iterative walk.** The resolver's queries to servers carry no `rd`; a server answers from its own data only:
   the record, NXDOMAIN, or a referral to the servers of the child zone closer to the name (RFC 1034 §4.3.1, §5.3.3;
   URM ch14 "iterativni upit").
3. **Referral.** A referral carries the child zone's NS records plus glue A records; it has no `aa`. The resolver
   caches NS and glue for the delegation's TTL (RFC 1034 §4.2.1; UL ch19 "delegiranje").
4. **`aa` only from the authoritative server.** Only `auth`'s answer (or NXDOMAIN) has `aa`; the resolver's answer to
   the stub has `ra` and no `aa` (RFC 1035 §4.1.1; UL ch19 figure `put-razrjesavanja-imena.svg`).
5. **TTL.** Every RRset is cached for its TTL (`expiresAt = t + ttl`). Within it the resolver answers from the cache
   with no packet leaving; the TTL it hands the stub is what is left (`expiresAt − t`) (RFC 1035 §3.2.1, RFC 2181 §8;
   URM ch14 Primjer 1: 3600 s). **Tie-break: at 0 s left an entry is expired** (valid while `expiresAt > t`), so
   `www` asked at t = 3600 with TTL 3600 goes out again; the task's "t = 3601" is the same outcome.
6. **Deepest NS first.** If `grafo.hr` NS is still cached, the next lookup in that zone goes straight to `auth`; if
   only `hr` NS is left, it starts at `tld` (RFC 1034 §5.3.3 step 2).
7. **Negative caching.** NXDOMAIN (with `aa`, carrying the zone's SOA) is cached as a negative answer for
   min(SOA TTL, SOA MINIMUM) = min(3600, 900) = 900 s; a repeat within it is answered NXDOMAIN from the cache
   (RFC 2308 §5; UL ch19 Primjer 2: 900 s).
8. **Tie-break: which NS.** With several NS known, the model asks the first listed with a valid address
   (`a.root-servers.net`, `a.ns.hr`, `ns1.grafo.hr`); real resolvers choose by measured round-trip time (the
   explanation says so).
9. **Replacing.** A new RRset replaces a cached one with the same name and type (an expired one included). Root hints never expire (configuration, not a learned record).

## Params

| Param | Values | Default |
|---|---|---|
| `name` | `www` / `mail` / `nema` (`.grafo.hr`) | `www` |
| `again` | the name of the second lookup: same / `www` / `mail` / `nema` | same |
| `advance` | the second lookup's t: +60 s / +3600 s / +1 day (86400 s) | +60 s |
| `ttlA` | 60–86400 s, A records of `grafo.hr` | 3600 |
| `ttlNS` | 3600–172800 s, the `grafo.hr` delegation (NS + glue) in `hr` | 86400 (derived) |

A **"Ponovi s predmemorijom / Repeat warm"** button jumps to the first message of the second lookup.

## Steps

`steps(p)` = messages of lookup 1 + messages of lookup 2. A lookup is 2 + 2 × (servers asked) messages.

| Preset | Params | Lookup 1 | Lookup 2 | Steps | Opens at |
|---|---|---|---|---|---|
| `cold` (URM ch14 Primjer 1) | www, same, +60 | 8 (3 round trips; A cached 3600 s) | 2 | 10 | 0 |
| `warm` (URM ch14 Primjer 1, figure `ch14-dns-put-upita.svg`) | www, same, +60 | 8 | 2 (from the cache, TTL 3540) | 10 | 8 |
| `same-zone` *(derived)* | www, mail, +60 | 8 | 4 (S, auth, back; `grafo.hr` NS cached) | 12 | 8 |
| `ttl-expired` *(derived)* | www, same, +3600 | 8 | 4 (A expired, NS 86400 valid) | 12 | 8 |
| `nxdomain` (UL ch19 Primjer 2) | nema, same, +60 | 8 (NXDOMAIN, aa, cached 900 s) | 2 (NXDOMAIN from the cache, 840 s left) | 10 | 0 |

Default (`cold`) = 10 steps = `sim.json` `steps`. Other numbers: +1 day → lookup 2 is 6 (`grafo.hr` NS expired at
0 s left, `hr` NS 172800 still valid); the maximum is 8 + 6 = 14 ≤ 20 (the `hr` delegation, 172800 s, outlives the
longest advance, so a second lookup never goes back to the root). Checked by an independent hand model
(NOTES.md, "Checks").

## Legend

Solid arrow = query (`rd` on the stub's); dotted arrow = referral (fields name the zone it delegates); bold arrow =
final answer (to the stub); `aa` badge only on authoritative answers; cache rows: TTL bar, ⊘ on a negative entry,
struck through when expired; changed marks: the newest message, the cache rows it added or used.

## Out of scope

Forwarders (`win-dns-forwarders`, a later preset on this model), TTL cutover planning (`inet-dns-ttl-cache`), DNSSEC,
TCP fallback, EDNS, reverse lookup, QNAME minimisation, priming the root NS set, the apex NS set the authoritative
answer also carries, resolving NS names without glue, the stub's own cache, the SOA in the resolver's NXDOMAIN to the stub (RFC 2308 would pass it
on with its TTL counted down).
