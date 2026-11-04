<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-client-order: specification

One concept: **hosts file, cache, DNS with suffix search, then LLMNR/NetBIOS; why a short name goes wrong** (task
`docs/tasks/w3/win-dns-client-order.md`, catalogue `win-dns-client-order`, §4.5.3). The student resolves short and full
names with different settings and watches which stage answers.

## Scene

- **Client** `PC-07`, member of `corp.example` (primary DNS suffix `corp.example`), address `10.0.0.57`. No
  connection-specific suffix. Suffix devolution on (it adds nothing here: `corp.example` has two labels).
- **DNS servers:** preferred `10.0.0.10` (DC01); alternate none, `10.0.0.11` (DC02) or `203.0.113.53` (a public
  resolver). DC01 and DC02 hold the zone `corp.example` (`fs1` → `10.0.0.21`, `dc01` → `10.0.0.10`, `dc02` →
  `10.0.0.11`) and answer NXDOMAIN for every other name here (`fs1.example.com`, `printer.corp.example`, `fs1`). The
  public resolver does not know `corp.example` (a private zone): NXDOMAIN for every name here.
- **Hosts file:** empty, or one line `10.0.0.99 fs1` (the old address of the file server, left behind).
- **The link (segment):** one host that answers link-local queries: a laptop `10.0.0.77` that answers for `printer`,
  by LLMNR and by NetBIOS. The servers do not answer link-local queries (assumption: they are on PC-07's address range
  but have LLMNR and NetBIOS turned off, a common hardening; with it on, `fs1` would answer for itself).
- **Record TTL** 1200 s (the TTL a Windows host registers its A record with, 20 min *(check)*).

All addresses are documentation or private ranges; the names are the task's.

## Params

`typed` choice `fs1` / `fs1.corp.example` / `fs1.corp.example.` / `printer` / `fs1.` (default `fs1`);
`searchList` none / `example.com` (default none); `alternate` none / `10.0.0.11` / `203.0.113.53` (default none);
`preferredUp` toggle (default on: the preferred server during the first lookup); `hostsEntry` toggle (default off);
`llmnr` toggle (default on); `repeat` toggle (default off): the same name again 60 s later, with the preferred server
back up; `flush` toggle (default off, only with `repeat`): flush the cache before the repeat. `netbios` is a model
param, default on, not on the page (the task's controls do not have it).

## State

`{ t, lookup, typed, flushed, hosts, cache: [{ name, ip | null, expiresAt | null, from: hosts | dns }], servers: [{ ip,
role, kind, up }], candidates: [{ fqdn, src, result }], stages: { hosts, cache, dns, llmnr, netbios }, queries: [{
fqdn, server, result, ip, wait }], answer, results, tries, last, next, done }`

- `t`: seconds since the first lookup started. Answers take no time; only DNS timeouts and the repeat move `t`.
- `stages`: `idle` (not tried, ○), `trying` (DNS between two servers), `ok` (✓), `no` (✕), `neg` (⊘: the cache held
  negative entries), `skip` (will not run: LLMNR off, a name with a dot, or no candidate left for DNS).
- `candidates[].src`: `typed`, `primary`, `devolution`, `connection`, `list`; `result`: `null`, `cache`, `neg`,
  `ok`, `nx`, `timeout`.
- `last`: the try of this step `{ lookup, stage, fqdn, server, result, ip, wait, t }`; `tries`: all of them; `results`:
  the answers of finished earlier lookups (`null` = not resolved); `next`: the cursor (stage, candidate, server).

## One step = one try

One stage, one candidate name, or one DNS server asked. The lookup stops at the first positive answer. Steps = the
number of tries in the run (both lookups when `repeat` is on); at most 11 with the page's params.

## Rules

1. **Hosts first.** (KB 172218 checks the local host's own name before that; not modelled.) The hosts file is checked before anything else, and an entry wins over DNS (its entries are
   loaded into the DNS client cache). It matches the name as typed (without a final dot) or any candidate FQDN.
   Tie-break: two lines for the same name → the first line wins *(check)*. (Microsoft, "Microsoft TCP/IP Host Name
   Resolution Order", KB 172218 *(check)*.)
2. **The cache next**, for every candidate in order: a valid positive entry answers; a valid negative entry
   (NXDOMAIN) rules that name out, so no server is asked for it until it expires. An NXDOMAIN is kept for the negative
   TTL from the SOA in the answer, capped at 900 s; the zones' SOA minimums here are larger, so 900 s
   (`MaxNegativeCacheTtl`, default 900 s since Windows XP; checked in the itprotoday/TechNet material on negative
   caching *(check for current Windows)*). Tie-break: an entry with 0 s left is expired (valid while `expiresAt > t`,
   as in `dns-resolution`). **Deviation:** the task says a negative entry "ends the lookup"; here it ends DNS for that
   name and LLMNR/NetBIOS still run (NOTES.md).
3. **Candidates.** A name ending with a dot is tried only as typed. A single-label name gets suffixes: if a suffix
   search list is set (e.g. by GPO), only that list, in order; otherwise the primary DNS suffix, then its devolution
   (parent domains down to two labels), then the connection-specific suffix. Duplicates are dropped (the first stays).
   A search list turns devolution off (Microsoft, "DNS Devolution"; Policy CSP ADMX_DnsClient).
4. **A dotted name without a final dot** is tried as typed first; suffixes are appended to it only with
   `AppendToMultiLabelName`, off in the model as the task says *(check the Windows default: the reviewer believes
   Windows appends after the as-typed query fails; it changes no preset, as `fs1.corp.example` answers at once)*.
5. **Servers.** Each candidate goes to the preferred server first. The alternate is asked only if the preferred has
   not answered within 1 s; if no server answers, the client gives up 10 s after the first query (Microsoft, "DNS
   client resolution timeouts", KB 2834226, checked: 0 s preferred, 1 s second server, 2 s second again, 4 s all, 8 s
   all, stop at 10 s). In the model: preferred down with an alternate → +1 s, the alternate is the next try; the last
   server down → the remaining time to 10 s, and the candidate counts as not answered (nothing cached). An NXDOMAIN
   from any server is an answer: no other server is asked (same article), the next candidate is tried. Each candidate
   starts again at the preferred server (simplification *(check: the client may keep a failed server's priority
   lowered for a while)*).
6. **Link-local fallbacks.** Only when DNS gave no positive answer for every candidate, and only for a name typed
   without any dot (RFC 4795 §3: by default LLMNR only for single-label names; NetBIOS names have no dots *(check
   Windows for multi-label names)*): LLMNR multicast on the link (`224.0.0.252` / `FF02::1:3`, UDP 5355, RFC 4795) if
   enabled, then NetBIOS name resolution (broadcast here, no WINS; RFC 1001/1002) if enabled. Any host on the link
   may answer, and nothing checks that it is who it says. LLMNR and NetBIOS answers are not cached in the model
   *(check)*, and their waits are not counted in `t`.
7. **Caching.** A positive DNS answer is cached for its TTL capped at `MaxCacheTtl` 86400 s (1 day; itprotoday,
   *(check)*); an NXDOMAIN for 900 s (rule 2). A flush empties the cache and loads the hosts entries again *(check)*,
   so a stale hosts line survives it.
8. **Tie-break: two link-local answers** → the first received wins (model: segment list order).

## Presets (6) and expected numbers (checked with `library/win-dns-client-order-check.py` before coding)

| Preset | Params (others default) | Steps | Expected |
|---|---|---|---|
| `short-name` | defaults | 3 | hosts ✕, cache ✕, DNS `fs1.corp.example` @ 10.0.0.10 → `10.0.0.21` ✓; cached 1200 s |
| `stale-hosts` | `hostsEntry`, `repeat`, `flush` | 2 | hosts ✓ `10.0.0.99`, DNS never asked; after the flush at 60 s the hosts line is loaded again: hosts ✓ `10.0.0.99` |
| `llmnr-answer` | `typed` printer | 4 | hosts ✕, cache ✕, DNS `printer.corp.example` NXDOMAIN (cached 900 s), LLMNR ✓ the laptop `10.0.0.77` |
| `public-alternate` | `preferredUp` off, `alternate` 203.0.113.53, `repeat` | 10 | 10.0.0.10 ⏱ (t = 1 s), 203.0.113.53 NXDOMAIN, negative entry until 901 s; LLMNR ✕, NetBIOS ✕; at 60 s (preferred up): hosts ✕, cache ⊘ (841 s left), LLMNR ✕, NetBIOS ✕: still not resolved. With `flush`: 9 steps, the repeat ends DNS ✓ `10.0.0.21` |
| `search-list` | `searchList` example.com | 5 | only `fs1.example.com` is tried → NXDOMAIN; LLMNR ✕, NetBIOS ✕; `fs1.corp.example` is never asked |
| `fqdn-dot` | `typed` fs1.corp.example. | 3 | hosts ✕, cache ✕, DNS `fs1.corp.example` ✓, no suffixes |

Other numbers: preferred down and no alternate → one try of 10 s, then LLMNR, NetBIOS (5 steps, t = 10). `fs1.` →
DNS asked for `fs1` (a top-level name) → NXDOMAIN, no LLMNR (the name has a dot): 3 steps.

## Limits

One adapter, IPv4 only, A records only; no NRPT, DirectAccess, mDNS, DNS over HTTPS, NetBIOS node types or WINS
(out of scope by the task); no server-side behaviour (`win-dns-forwarders`).
