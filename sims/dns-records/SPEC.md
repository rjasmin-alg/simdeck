<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dns-records — specification

Task `docs/tasks/w2/dns-records.md` (catalogue `inet-dns-records`, §4.2). Explorer, no steps. One concept:
**A/AAAA/CNAME/MX/TXT/NS resolve differently; no CNAME at the apex.** The student builds a small zone with four
toggles and queries it; the authoritative server for `lab.example` answers.

Model: `sim.js` (pure). Tests: `sim.test.js`, one per rule below, tie-breaks first. Numbers below were checked by
running every preset through the model (NOTES.md, "Numbers").

## 1. Zone

`$TTL 3600`, origin `lab.example.`, the zone file of UL ch19 "Vlastiti poslužitelj imena", in file order, with the
rows each toggle adds. Owners and names in data are written as in a zone file (relative unless they end with a dot).

| id | owner | type | data | from |
|---|---|---|---|---|
| soa | `@` | SOA | `ns1.lab.example. admin.lab.example. 2026090301 3600 900 604800 900` | UL ch19 |
| ns | `@` | NS | `ns1.lab.example.` | UL ch19 |
| txt | `@` | TXT | `"v=spf1 mx -all"` | added here, so TXT has a record (decision) |
| mx10, mx20 | `@` | MX | `10 mail`, `20 mail2` | toggle `mx` (default on) |
| apexCname | `@` | CNAME | `posluzitelj` | toggle `apexCname` (default off) |
| ns1 | `ns1` | A | `192.168.180.1` | UL ch19 |
| posluzitelj | `posluzitelj` | A | `192.168.180.1` | UL ch19 |
| klijent | `klijent` | A | `192.168.180.100` | UL ch19 |
| klijent6 | `klijent` | AAAA | `2001:db8:180::100` | added here (RFC 3849 documentation prefix), so AAAA has a record |
| www | `www` | CNAME | `posluzitelj` | toggle `addWww` (default on) |
| mail, mail2 | `mail`, `mail2` | A | `192.168.180.25`, `192.168.180.26` | toggle `mx` |
| subNs | `sub` | NS | `ns.sub` | toggle `delegate` (default off) |
| glue | `ns.sub` | A | `192.168.180.53` | toggle `delegate` (glue) |

Every row has TTL 3600 (from `$TTL`). The class is always IN.

## 2. Rules

1. **RRset.** An RRset (same owner, class and type) is returned whole: a query for `lab.example MX` returns both MX
   records. Every RR of an RRset has the same TTL; a zone with different TTLs in one RRset gets a `ttl-differs`
   *warning* and the answer gives every RR the lowest TTL of the set (the rule RFC 2181 gives a client receiving such
   a set; a real loader may instead warn and use one TTL). (RFC 1034 §4.3.2 step 3a; RFC 2181 §5.2; UL ch19
   "RRset".)
2. **CNAME.** If the owner has a CNAME and the query type is not CNAME, the answer carries the CNAME and the lookup
   restarts at the canonical name; the chain is listed. At most **8** CNAMEs are followed: needing a 9th gives
   `SERVFAIL` (kind `too-long`), and a CNAME pointing back to a name already in the chain gives `SERVFAIL` (kind
   `loop`). A canonical name outside the zone ends the answer there (kind `outside`, `NOERROR`): the resolver goes on
   elsewhere. A query for type CNAME returns the CNAME itself and does not follow it. (RFC 1034 §3.6.2, §4.3.2 step
   3a; UL ch19 "`CNAME` nosi kanonsko … ime".) *Model choice:* the authoritative server returning `SERVFAIL` on a
   loop is how a resolver reports it; real authoritative servers differ (NOTES.md).
3. **CNAME and other data.** A name with a CNAME holds no other data, and only one CNAME. The apex always holds SOA
   and NS, so a CNAME at the apex is a zone error (`cname-and-other`, with `apex: true` and the other types, in zone
   order: SOA, NS, TXT, MX); a name with other data *and* two CNAMEs reports `cname-and-other`. A zone with an error
   does not load; the server keeps answering from the **last valid
   zone**, which here is the same zone without the apex CNAME (the only toggle that can break the zone). Missing SOA
   or NS at the apex are errors too (`apex-no-soa`, `apex-no-ns`). (RFC 1034 §3.6.2; RFC 2181 §10.1; UL ch19 "vrh
   zone".)
4. **MX.** A query for MX returns every MX record of the owner (rule 1) in zone order. The follow-up lists the
   exchanges in the order they are tried: **lower preference first**; **tie-break: equal preferences keep zone order**
   (the RFC allows either order; the model picks the listed one). Each exchange is a name, not an address: its A and
   AAAA records from this zone go in the additional section. An exchange that is an alias (owns a CNAME) is a
   `mx-cname` *warning* in the zone check and is marked in the follow-up. (RFC 1035 §3.3.9; RFC 5321 §5.1; RFC 2181
   §10.3; URM ch14 "MX zapis".)
5. **NODATA and NXDOMAIN.** The owner exists but has no RR of the queried type (and no CNAME): `NOERROR` with an empty
   answer, shown as **NODATA**. The name does not exist: `NXDOMAIN`. A name "exists" when it owns a record or has a
   name below it (an empty non-terminal). Both negative answers carry the zone's SOA in the authority section, with
   TTL min(SOA TTL, MINIMUM) = min(3600, 900) = **900** (how long the "no" may be cached), and `aa`. A CNAME whose target does not exist gives `NXDOMAIN` with the CNAME in the answer. (RFC 2308 §1–2; RFC 8020
   §2 for empty non-terminals; RFC 2308 §3 for the SOA TTL; UL ch19 "`status: NXDOMAIN`", "`MINIMUM`".)
6. **Delegation.** NS at the apex is authoritative data (`aa`; the in-zone address of `ns1` goes in additional). NS at a name below
   the apex is a delegation: a query for that name or **anything under it** — even a name this zone has a record for,
   like the glue `ns.sub.lab.example` — gets a **referral**: empty answer, the child's NS in the authority section,
   their A and AAAA records (glue) in additional, **no `aa`**, `NOERROR`. The longest cut wins; a cut covers names
   that end with `.<cut>`, not names that only end with the same letters (`mysub` is not under `sub`). If an alias led to the cut, `aa`
   stays (it belongs to the query name). (RFC 1034 §4.2.1, §4.3.2 step 3b; RFC 1035 §4.1.1; UL ch19 "delegiranje".)
7. **Data formats.** A holds exactly one IPv4 address (four decimal octets 0–255, no leading zeros), AAAA one IPv6
   address (eight groups, or fewer with one `::`; the last two groups may be written as an IPv4 address,
   `::ffff:192.0.2.1`), TXT one or more character strings of at most 255 **octets** in UTF-8 (`č` counts 2), MX a
   preference 0–65535 and a host name. Anything else is a `bad-data` error. (RFC 1035 §3.3.14, §3.4.1; RFC 3596 §2; RFC
   4291 §2.2.)
8. **Names.** Owner names and names in data are relative to the origin unless they end with a dot; `@` is the apex.
   `posluzitelj` and `posluzitelj.lab.example.` are the same name; `posluzitelj.lab.example` (no dot) is
   `posluzitelj.lab.example.lab.example.`. Query names are always absolute. Names compare without regard to case.
   (UL ch19, the zone file explanation; RFC 1034 §3.1 for case.)

Check order (fixed, so the strip is stable): rule 7 per row, apex SOA/NS, rule 3 per owner (first-seen order), rule 1
per RRset, rule 4 per MX row. A clean zone is one `ok` item.

## 3. Params and presets

Params: `qname` (select, 11 names: every owner the toggles can create, `www.sub.lab.example` under the delegation,
and `nepostojece.lab.example`; default `posluzitelj.lab.example`), `qtype` (select A, AAAA, CNAME, MX, TXT, NS, SOA;
default A), toggles `addWww` (on), `apexCname` (off), `mx` (on), `delegate` (off).

| # | id | params | expected |
|---|---|---|---|
| 1 | `ul-zone` | `posluzitelj` A; www, mx off (the book's zone) | `posluzitelj.lab.example. 3600 IN A 192.168.180.1`, NOERROR, `aa`; the SOA row as above |
| 2 | `nxdomain` | `nepostojece` A; www, mx off | NXDOMAIN, 0 answers, `aa`, SOA in authority with TTL 900 |
| 3 | `cname` | `www` A | 2 RRs: `www.lab.example. CNAME posluzitelj.lab.example.`, `posluzitelj.lab.example. A 192.168.180.1`; NOERROR, `aa` |
| 4 | `mx` | `lab.example` MX | `10 mail.lab.example.`, `20 mail2.lab.example.`; tried first `mail` → `192.168.180.25`, then `mail2` → `192.168.180.26` |
| 5 | `nodata` | `posluzitelj` AAAA | NOERROR, 0 answers (NODATA), `aa`, SOA (TTL 900) in authority — not NXDOMAIN |
| 6 | `apex-cname` | `lab.example` A, apexCname on | zone error `cname-and-other` at `lab.example.` beside SOA, NS, TXT, MX; not loaded; the last valid zone answers: NODATA |
| 7 | `delegation` | `www.sub.lab.example` A, delegate on | referral: authority `sub.lab.example. NS ns.sub.lab.example.`, additional glue `192.168.180.53`, no `aa`; with delegate off the same query is NXDOMAIN with `aa` |

Presets 3–7 are derived (unchecked against a running server); 1–2 are the book's outputs.

## 4. State

`{ zone: [{ id, owner, ttl, type, data }], check: [{ level, code, owner, types, rows }], loaded: 'zone' | 'last-valid',
served: [row ids of the zone that answers], query: { name, type }, answer: { rcode, kind, aa, answer: [rr], authority: [rr], additional: [rr], chain } }`.
MX data is `{ pref, host }`, TXT data an array of strings, SOA data an object of its seven fields. The page's status is
`statusOf(answer)`: NODATA for kind `nodata`, otherwise the rcode (a referral is NOERROR). This differs in names from
the task's sketch (`answer: { status, aa, rrs, chain }`, check levels ok|error): the answer keeps the message's three
sections and the rcode, and the check has a `warn` level for rules 1 and 4.

## 5. Out of scope

SRV, PTR and reverse zones, wildcards, DNSSEC types, ALIAS/ANAME (mentioned in the explanation only), TTL behaviour
over time, recursion (the server answers from its own zone only).
