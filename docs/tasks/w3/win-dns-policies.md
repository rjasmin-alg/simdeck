# win-dns-policies: DNS policies and zone scopes

| | |
|---|---|
| Task | `win-dns-policies` (wave 3, DNS on Windows Server) |
| Catalogue entry | `win-dns-policies` in `docs/catalogue.md` §4.5.3 |
| Kind | build a new simulator |
| Folder | `sims/win-dns-policies/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `dns` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-dns-zone-types` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **split-horizon answers by client subnet**.

The student: query from inside and outside.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.3.
5. `sims/win-dns-zone-types/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "DNS Policies Overview" (Windows Server 2016+: criteria, processing order, actions); "Use DNS Policy for Split-Brain DNS Deployment"; "Use DNS Policy for Split-Brain DNS in Active Directory"; "Add-DnsServerQueryResolutionPolicy", "Add-DnsServerClientSubnet", "Add-DnsServerZoneScope" (PowerShell)
- RFC 7871 (EDNS client subnet)

## Model and presets

- **Scene:** kit view K4 rule table. Top: DNS1 (and DNS2) with the zone `corp.example` and its zone scopes as small record tables: *default* (`www A 203.0.113.80`) and *internal* (`www A 10.0.0.80`), optionally *branch* (`www A 10.20.0.80`). Middle: the client subnets (`InternalNet 10.0.0.0/8`, `BranchNet 10.20.0.0/16`, `VpnNet 172.16.0.0/16`). Bottom: the ordered query resolution policies; the policy that matched is highlighted. Right: a stepped query from a chosen client and the answer it gets.
- **State:** `servers: [{ id, policies: [{ name, order, level: server|zone, criteria: [{ type: ClientSubnet|ServerInterfaceIP|QType|TimeOfDay|FQDN, op: EQ|NE, values }], condition: AND|OR, action: ALLOW|DENY|IGNORE, scope }] }]`, `subnets`, `scopes: { [name]: records }`, `query: { client ip, server, name, type }`, `trace`.
- **One step:** one evaluation phase for the current query: (1) the client sends to DNS1 or DNS2; (2) server-level policies by order; (3) zone-level policies by order; (4) the matching policy's action or the default scope; (5) the answer.
- **Rules:**
  1. Query resolution policies are evaluated in processing order; the first one whose criteria match wins, the rest are skipped (Microsoft, "DNS Policies Overview" (check)).
  2. Criteria combine with AND or OR as the policy says; `EQ` matches if the value is in the list, `NE` if it isn't.
  3. Server-level policies are evaluated before zone-level policies (check).
  4. ALLOW answers from the policy's zone scope; DENY answers REFUSED (check); IGNORE drops the query, the client times out.
  5. No matching policy → the answer comes from the zone's default scope.
  6. A client subnet is matched on the query's source address (or the EDNS client-subnet option when present (check)); an address in no defined subnet matches nothing.
  7. Policies, client subnets and zone scopes are configured per server; they are not copied to the other DNS servers by AD replication, so each server needs its own (check; the zone data itself replicates).
  8. Tie-break: two policies with overlapping subnets → the lower processing order wins, regardless of which subnet is more specific.
- **Params:** `client` choice office `10.0.5.20` / branch `10.20.3.4` / VPN `172.16.0.9` / internet `198.51.100.7` (default office); `server` choice DNS1 / DNS2 (default DNS1); `branchPolicy` toggle (default off); `swapOrder` toggle (default off); `policyOnDns2` toggle (default off); `vpnInInternal` toggle (adds VpnNet to the internal policy, default off).
- **Presets:**
  1. `split-brain` — derived, unchecked (after Microsoft's split-brain walkthrough): office client → policy `SplitBrainInternal` (ClientSubnet EQ InternalNet) → `www.corp.example` = `10.0.0.80`; internet client → no match → default scope `203.0.113.80`.
  2. `vpn-missing` — derived, unchecked: VPN client `172.16.0.9` not in any subnet → public `203.0.113.80` → traffic hairpins through the firewall. Toggle `vpnInInternal` → `10.0.0.80`.
  3. `order-wins` — derived, unchecked: branch policy (order 1, BranchNet → branch scope) and internal policy (order 2, InternalNet 10.0.0.0/8, which contains the branch) → branch client gets `10.20.0.80`; swap the order → `10.0.0.80`.
  4. `second-server` — derived, unchecked: policies only on DNS1; office client asks DNS2 → `203.0.113.80`. Toggle `policyOnDns2` → `10.0.0.80`.
  5. `ignore-vs-deny` — derived, unchecked: a policy for `198.51.100.0/24` with IGNORE → no answer (client retries, times out); with DENY → REFUSED at once.
- **Steps:** 5 per query; presets with a toggle show the query twice: split-brain 10; vpn-missing 10; order-wins 10; second-server 10; ignore-vs-deny 10.
- **Legend:** policy rows with order number, criteria chips and action icon (✓ ALLOW, ⛔ DENY, ∅ IGNORE); the matched row outlined, skipped rows dimmed with "not evaluated"; zone-scope tables labelled by name. "Changed" marks the row evaluated in this step and the scope that supplied the answer.
- **Captions:**
  - hr: "Upit dolazi iz 10.0.5.20, a to je InternalNet: prvo pravilo koje odgovara daje odgovor iz *zone scope* (opsega zone) *internal* — 10.0.0.80."
  - en: "The query comes from 10.0.5.20, which is InternalNet: the first matching policy answers from the *internal* zone scope, 10.0.0.80."
  - hr: "DNS2 nema ta pravila: pravila se postavljaju na svakom poslužitelju posebno, pa isti klijent dobiva javnu adresu."
  - en: "DNS2 has no such policy: policies are set on each server, so the same client gets the public address."
- **Terms:** DNS policy — DNS pravilo (*policy*); zone scope — opseg zone; client subnet — podmreža klijenta; processing order — redoslijed obrade; split-brain / split-horizon DNS — razdvojeni DNS (*split-brain*); default scope — zadani opseg.
- **Misconceptions:** "the most specific subnet wins" (processing order wins); "a policy on one DC applies to the domain"; "split-brain needs two separate zones" (one zone, two scopes; contrast with `inet-dns-split-brain`, where two primaries drift apart by accident).
- **Out of scope:** recursion policies and recursion scopes, zone transfer policies, time-of-day load balancing, geo-location by EDNS client subnet in depth, views in other DNS servers (mention as the generic counterpart).
- **Reuse from `win-dns-zone-types` (soft dependency):** the server and zone objects; new: client subnets, zone scopes and the policy evaluator.
- **Note for the coordinator:** the rule shape here is "first match by processing order" — the same as the §5.1 first-match evaluator. Consider building it on that evaluator (with zone scopes as the action) rather than a separate rule engine.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dns-policies sims/win-dns-policies` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dns-policies/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
