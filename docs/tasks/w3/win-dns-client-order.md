# win-dns-client-order: How a Windows client resolves a name

| | |
|---|---|
| Task | `win-dns-client-order` (wave 3, DNS on Windows Server) |
| Catalogue entry | `win-dns-client-order` in `docs/catalogue.md` §4.5.3 |
| Kind | build a new simulator |
| Folder | `sims/win-dns-client-order/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `dns` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dns-resolution` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **hosts file, cache, DNS with suffix search, then LLMNR/NetBIOS; why a short name goes wrong**.

The student: resolve short and full names with different settings.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.3.
5. `sims/dns-resolution/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Microsoft TCP/IP Host Name Resolution Order" (KB 172218); "DNS Client Resolution Timeouts" (KB 2018101, check number); "Configure DNS suffix search list" / Group Policy "DNS Suffix Search List", "Primary DNS Suffix Devolution"; "ipconfig" reference (`/flushdns`, `/displaydns`)
- RFC 4795 (LLMNR); RFC 1001, RFC 1002 (NetBIOS over TCP/IP); RFC 2308 (negative caching)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md`, "Vlastiti poslužitelj imena" (negativno predmemoriranje) and "Uvod" (`search lab.local` in `/etc/resolv.conf`, the Linux counterpart)

## Model and presets

- **Scene:** a vertical pipeline on the client PC-07 (`corp.example` member, IP `10.0.0.57`): typed name → hosts file → DNS client cache → DNS servers (preferred `10.0.0.10`, alternate) with the suffix list → LLMNR (multicast) → NetBIOS (broadcast/WINS). Each stage lights as it is tried and shows its result. Below: the list of candidate FQDNs built from the suffixes, with ✓/✕ per try, and the cache table.
- **State:** `typed`, `settings: { primarySuffix, connSuffix, searchList: [] | null, devolution: bool, dnsServers: [ip], llmnr: bool, netbios: bool }`, `hosts: [{ name, ip }]`, `cache: [{ name, ip | null (negative), expiresAt }]`, `servers: { [ip]: { up, zone: {…} } }`, `segment: [{ name, ip, answersLLMNR }]`, `tries: [{ stage, fqdn, result }]`, `t`.
- **One step:** one try: one stage, one candidate name. Stop at the first positive answer.
- **Rules:**
  1. Hosts file entries are loaded into the DNS client cache, so they are checked before any DNS server and win over DNS (Microsoft, "Microsoft TCP/IP Host Name Resolution Order" (check)).
  2. The cache is checked next, positive and negative entries alike; a negative entry ends the lookup until it expires (Windows default negative cache time 900 s, `MaxNegativeCacheTtl` (check)).
  3. A name ending with a dot is tried only as typed. A name with no dot (single label) is tried with suffixes appended. If a DNS suffix search list is set (e.g. by GPO), only that list is used, in order; otherwise the primary DNS suffix, then its devolution (parent domains down to two labels, if enabled), then the connection-specific suffix (Microsoft, "DNS client settings: suffix search list" / "Configure DNS suffix search" (check)).
  4. A dotted name without a final dot is tried as typed first; appending suffixes to multi-label names depends on `AppendToMultiLabelName` (check), off in the model.
  5. Each candidate goes to the preferred DNS server; the alternate is asked **only if the preferred doesn't answer** within the timeout (1 s first, then more servers; Windows timeouts 1, 1, 2, 4 s (check)). An NXDOMAIN from the preferred is an answer: the alternate isn't asked.
  6. Only if DNS gave no positive answer for every candidate: LLMNR multicast on the local link (`224.0.0.252` / `FF02::1:3`, UDP 5355; RFC 4795), then NetBIOS name resolution (WINS or broadcast, RFC 1001/1002) if enabled. Any host on the segment may answer LLMNR.
  7. Positive DNS answers are cached for their TTL (capped by `MaxCacheTtl`, 86400 s (check)); flushing the cache empties it but reloads the hosts entries (check).
  8. Tie-break: two LLMNR answers → the first one received wins (model: segment list order).
- **Params:** `typed` choice `fs1` / `fs1.corp.example` / `printer` / `fs1.` (default fs1); `searchList` choice none / `example.com` (default none); `alternate` choice none / `10.0.0.11` / `203.0.113.53` (default none); `preferredUp` toggle (default on); `hostsEntry` toggle (`10.0.0.99 fs1`, default off); `llmnr` toggle (default on); button `flushCache`.
- **Presets:**
  1. `short-name` — derived, unchecked: `fs1` → hosts ✕, cache ✕, DNS `fs1.corp.example` → `10.0.0.21` ✓. 4 tries.
  2. `stale-hosts` — derived, unchecked: hosts has `10.0.0.99 fs1` (old server) → answered from hosts, DNS never asked; the server moved months ago.
  3. `llmnr-answer` — derived, unchecked: `printer` not in DNS → NXDOMAIN for `printer.corp.example` → LLMNR multicast → laptop `10.0.0.77` answers "me". Caption: anyone on the segment could (LLMNR poisoning, link to SEC).
  4. `public-alternate` — derived, unchecked: preferred `10.0.0.10` down, alternate `203.0.113.53` → `fs1.corp.example` NXDOMAIN, cached negatively for 900 s; preferred back after 60 s, `fs1` still fails until the cache is flushed.
  5. `search-list` — derived, unchecked: GPO search list `example.com` → `fs1` is tried only as `fs1.example.com` → NXDOMAIN, although `fs1.corp.example` exists.
  6. `fqdn-dot` — derived, unchecked: `fs1.corp.example.` → one DNS try, no suffixes, ✓.
- **Steps:** short-name 4; stale-hosts 2; llmnr-answer 6; public-alternate 8; search-list 5; fqdn-dot 3.
- **Legend:** stage boxes with state ○ not tried / ▶ trying / ✓ answered / ✕ no answer / ⊘ negative cache; candidate list with ✓/✕; ⏱ for a timeout. "Changed" marks the stage and candidate tried in this step.
- **Captions:**
  - hr: "Kratko ime `fs1` dobiva sufiks: klijent pita DNS za `fs1.corp.example` — *primary DNS suffix* (primarni DNS sufiks) dodaje se sam."
  - en: "The short name `fs1` gets a suffix: the client asks DNS for `fs1.corp.example`; the primary DNS suffix is appended automatically."
  - hr: "Preferirani poslužitelj odgovorio je NXDOMAIN. To je odgovor, pa zamjenski poslužitelj nije ni pitan."
  - en: "The preferred server answered NXDOMAIN. That's an answer, so the alternate server isn't asked at all."
- **Terms:** hosts file — datoteka hosts; DNS client cache — predmemorija DNS klijenta; DNS suffix — DNS sufiks; suffix search list — popis sufiksa za pretraživanje; single-label name — ime od jedne oznake (kratko ime); preferred / alternate DNS server — preferirani / zamjenski DNS poslužitelj; negative caching — negativno predmemoriranje (UL ch19); multicast — višeodredišno slanje (*multicast*).
- **Misconceptions:** "the alternate DNS server is asked when the first one says no" (only when it doesn't answer); "a hosts entry is a last resort" (it wins); "a short name is looked up as-is" (suffixes are appended, and the search list replaces them).
- **Out of scope:** NRPT and DirectAccess, mDNS, DNS over HTTPS, NetBIOS node types in detail, server-side behaviour (`win-dns-forwarders`).
- **Reuse from `dns-resolution` (soft dependency):** the cache with TTL and negative entries; new: the client-side stage order, suffixes, LLMNR/NetBIOS.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dns-client-order sims/win-dns-client-order` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dns-client-order/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
