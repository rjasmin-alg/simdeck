<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-forwarders: spec

One concept: **where a DC sends names it doesn't own.** PC-07 asks its DNS server DC1 for a name; DC1 decides, once
per query, along a fixed order (cache → hosted zone → conditional forwarder → server forwarders → root hints →
SERVFAIL), and the chosen server answers, times out or refers. One step = one message. Task:
`docs/tasks/w3/win-dns-forwarders.md`. Kit views: K1 (message sequence chart) for the messages, K4 (rule table) for
DC1's decision panel.

## Scene (fixed data)

| Party | Lane | Address | Holds |
|---|---|---|---|
| PC-07 | `PC` | 10.0.0.57 | the stub resolver; asks once with `rd` |
| DC1 | `DC` | 10.0.0.10 | zone `corp.example` (`fs1` A 10.0.0.21, TTL 3600); the decision order; a cache |
| partner DNS | `partner` | 10.20.0.53 | authoritative for `partner.example` (`crm` A 10.20.5.8, TTL 3600) |
| forwarder (ISP resolver) | `fwd` | 198.51.100.53 | a recursive resolver: it resolves public names for whoever asks |
| root | `root` | a.root-servers.net 198.41.0.4 | the root zone: delegates `org` only (in this scene) |
| `.org` | `tld` | a.ns.org 192.0.2.10 | delegates `example.org` |
| `example.org` | `auth` | ns1.example.org 203.0.113.53 | `www.example.org` A 203.0.113.80, TTL 3600 |

Every `.org` / `example.org` server name and every address except the root's is invented (documentation ranges);
`example.org` and `partner.example`/`corp.example` are reserved example names. The `PC`–`DC1` addresses match
`win-dns-client-order`.

**Lanes** (K1 has at most 6): the internet name `www.example.org` → `PC, DC, fwd, root, tld, auth`; the other two
names → `PC, DC, partner, fwd, root`. No run of `fs1` or `crm` reaches `.org` or `example.org`, and no run of `www`
reaches the partner (the partner's row in DC1's table says why). The task's seven lanes do not fit K1.

## DC1's decision order (checked once per query)

| # | Row | Applies when | Action |
|---|---|---|---|
| 1 | cache | a valid cached answer (positive or negative) for the name | reply from the cache, TTL = what is left |
| 2 | zone `corp.example` | the name is the zone or ends in `.corp.example` | reply from the zone with `aa`; NXDOMAIN there is final |
| 3 | conditional forwarder `partner.example → 10.20.0.53` | the name is in the domain; **longest matching domain wins** | send the query (`rd`) to its targets, in order |
| 4 | forwarder 1 `198.51.100.53` (one row per forwarder) | any other name | send the query (`rd`), first in the list first |
| 5 | root hints | forwarders all timed out (or none configured), and root-hint fallback is on | resolve iteratively from the root, as in `dns-resolution` |
| – | (implicit) | nothing above applies | SERVFAIL |

Rules (sources in NOTES.md; *(check)* = not confirmed):

1. **Hosted zone.** A name in a zone DC1 hosts is answered from that zone with `aa`, nothing is forwarded; NXDOMAIN
   there is final (Microsoft, "DNS queries and lookups"; RFC 1034 §4.3.2 step 3). DC1's own zone data is never put
   in its cache, so rule 1 (cache) can never shadow rule 2 here.
2. **Conditional forwarder.** Applies to the domain and every name under it (`partner.example`,
   `crm.partner.example`; not `xpartner.example`). **Tie-break:** with several matching domains the longest (most
   labels) wins, wherever it stands in the list (Microsoft, "Conditional forwarders" *(check)*). Equal domains twice:
   the first in the list (the later one is noted "same domain listed earlier wins").
3. **Server forwarders** are tried in list order; each gets **3 s** (`ForwardingTimeout`, default 3 s, Microsoft KB
   2834250, checked 2026-11-04) before the next is tried. A conditional forwarder's targets get **5 s** each
   (`ForwarderTimeout`, same KB). Messages themselves take 0 s.
4. **Root-hint fallback.** If every forwarder times out and "Use root hints if no forwarders are available" is on
   (default on), DC1 resolves iteratively from the root hints; off → SERVFAIL (KB 2834250; Microsoft, "DNS: The DNS
   server must have root hints or forwarders configured"). With **no** forwarders configured DC1 uses the root hints
   whatever the box says (the box is about fallback) *(check)*. The page always has one forwarder.
5. **An answer ends the search.** A forwarder (or conditional forwarder target, or the walk) that *answers* —
   an address or NXDOMAIN — ends the decision: no next forwarder, no root hints. Only no answer (timeout) moves on.
6. **Recursion off** ("Disable recursion (also disables forwarders)"): only hosted zones (and the cache, empty then)
   answer; every other name gets **SERVFAIL** at once *(check: from a Microsoft blog, not a capture)* (Windows Server 2016 and later; earlier versions sent an upward
   referral to the root; Microsoft, "Upward referral responses from authoritative DNS servers"). Conditional
   forwarders are disabled too *(check)*. `ra` is clear in DC1's replies.
7. **Cache.** Answers DC1 receives are cached for their TTL (RFC 1035 §7.4; `dns-resolution` rule 5); an entry with
   0 s left is expired. Negative answers (NXDOMAIN) are cached for min(SOA TTL, SOA MINIMUM) (RFC 2308 §5), capped
   at **900 s** (`MaxNegativeCacheTtl`, default 900 s, Microsoft "Set-DnsServerCache", checked 2026-11-04); positive
   ones capped at 86400 s (`MaxCacheTtl` default) — no answer here reaches that. SERVFAIL is not cached. A cached
   answer is used before rules 1–5.
8. **Conditional forwarder with every target down:** SERVFAIL; the rows under it are not read. KB 2834250's
   conditional-forwarder timeline ends in Server Failure and, unlike its forwarder timeline, names no root-hint
   fallback *(check)*. No param of the page reaches it (the partner is always up).

**Flags.** PC-07 → DC1: `rd`. DC1 → forwarder or conditional target: `rd` (forwarding is a recursive query).
DC1 → root / `.org` / `example.org`: no `rd` (iterative). The partner's answer and the walk's last answer carry
`aa`; the forwarder's answer and DC1's replies to PC-07 carry `ra` (when recursion is on) and no `aa`, except DC1's
answer from its own zone, which has `aa`.

**Iterative walk** (copied from `dns-resolution`): start from the deepest cached NS with a valid address (root
hints at first), referrals (NS + glue, no `aa`) cached for their TTL (`org` 172800 s, `example.org` 86400 s), the
first listed NS asked.

**What the forwarder answers:** the public view of the scene: `www.example.org` → 203.0.113.80 TTL 3600 (ra, no aa);
`crm.partner.example` → NXDOMAIN with the root's SOA (TTL 86400, MINIMUM 86400; the `.example` TLD is not delegated)
→ DC1 caches it for min(86400, 86400, 900) = **900 s**. The root, asked directly for `crm.partner.example`, gives the
same NXDOMAIN with `aa`.

**Not modelled (simplifications):** the client's own retries while DC1 waits (`win-dns-client-order`); the +1 s and
0.5 s extra per forwarder in KB 2834250 and the 8 s `RecursionTimeout` (one forwarder: 3 s, then the walk);
dynamic forwarder reordering (Windows Server 2022); stub zones (`win-dns-zone-types`); DNS policies; DNSSEC.

## Params

| Key | Values | Default |
|---|---|---|
| `name` | `fs1` (fs1.corp.example) / `crm` (crm.partner.example) / `www` (www.example.org) | `fs1` |
| `condFwd` | conditional forwarder `partner.example → 10.20.0.53` configured | on |
| `forwarderUp` | 198.51.100.53 answers | on |
| `rootHints` | "Use root hints if no forwarders are available" | on |
| `recursion` | recursion enabled on DC1 | on |
| `repeat` | after the first lookup, PC-07 asks for the same name again 60 s later (cache kept) | off |

## Expected numbers (checked by `NOTES.md` § Checks before coding)

| Preset | Params | Messages | Ends | Time |
|---|---|---|---|---|
| `internal` | fs1 | 2 | 10.0.0.21, `aa`, from the zone | 0 s |
| `partner` | crm | 4 | 10.20.5.8 via 10.20.0.53 (conditional) | 0 s |
| `internet` | www, repeat | 4 + 2 | 203.0.113.80 via 198.51.100.53; repeat at 60 s from the cache, TTL 3540 s | 0 s, 60 s |
| `forwarder-down` | www, forwarder down | 9 | 198.51.100.53 ✕, 3 s; root → .org → example.org → 203.0.113.80 | 3 s |
| `no-cond-fwd` | crm, cond off | 4 | NXDOMAIN from 198.51.100.53; no root hints (rule 5); cached 900 s | 0 s |
| `no-fallback` | www, forwarder down, root hints off | 3 | SERVFAIL | 3 s |
| `no-recursion` | crm, recursion off | 2 | SERVFAIL although the conditional forwarder is set (rule 6) | 0 s |

Other combinations: fs1 is 2 messages under every setting (rule 1 comes first); crm with cond off and the forwarder
down → root NXDOMAIN, 5 messages, 3 s; with root hints off too → SERVFAIL, 3 messages. `repeat` adds 2 messages
for a cached answer or a zone answer, 3 for a SERVFAIL after a timeout, 2 for a SERVFAIL with recursion off. Most
steps in any run: 9 + 2 = 11 (forwarder-down with repeat). At the defaults: 2 (`sim.json` `steps`).

Message counts follow from one message per step: query, (forward, answer)*, reply; a timed-out forward is one message
with no answer, and the 3 s pass before the next message.
