# win-dhcp-policies: Policy-based assignment

| | |
|---|---|
| Task | `win-dhcp-policies` (wave 3, DHCP on Windows Server) |
| Catalogue entry | `win-dhcp-policies` in `docs/catalogue.md` §4.5.4 |
| Kind | build a new simulator |
| Folder | `sims/win-dhcp-policies/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `dhcp` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-dhcp-scope-options` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **addresses and options by vendor class, MAC or user class**.

The student: connect phones and laptops.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.4.
5. `sims/win-dhcp-scope-options/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "DHCP Policies" / "Introduction to DHCP Policies" (Windows Server 2012+: conditions, processing order, IP ranges, option precedence with policies); "Add-DhcpServerv4Policy", "Add-DhcpServerv4PolicyIPRange" (PowerShell); `ipconfig /setclassid`
- RFC 2132 option 60 (vendor class identifier); RFC 3004 (user class option 77)

## Model and presets

- **Scene:** kit view K4 rule table, with K1 arrows for the client exchange. Top: scope `10.0.10.0/24` (range `.10–.229`) with its policy list in processing order; each policy row: conditions, AND/OR, its IP sub-range, its options. Bottom: arriving clients (phones, laptops, a guest); for each, the conditions it presents (vendor class option 60, user class option 77, MAC) and the result: matched policies, address, options with their source.
- **State:** `scope: { range, options, policies: [{ name, order, level: scope|server, conditions: [{ field: vendorClass|userClass|mac|clientId|fqdn|relayAgent, op: EQ|NE, values (MAC may end with *) }], logic: AND|OR, range: [from, to] | null, options }] }`, `serverPolicies`, `clients: [{ name, mac, vendorClass, userClass }]`, `leases`, derived `result[client]`.
- **One step:** one client arrives and gets a lease. Phases: (1) evaluate scope-level policies in order, then server-level; (2) pick the address; (3) assemble options; (4) record the lease.
- **Rules:**
  1. A policy matches if its conditions hold under its AND/OR logic; MAC conditions may use a trailing wildcard (`02-AB-CD*`) (Microsoft, "DHCP Policies" (check)).
  2. Scope-level policies are evaluated before server-level policies, each in processing order (check).
  3. Address: the first matching policy (by order) that has an IP range gives an address from that range; a client matching no policy with a range gets an address from the scope range outside all policy ranges (check).
  4. If that policy range is full, the client gets **no** address; it does not fall back to the general range (check).
  5. Options: a client gets the options of every policy it matches; for the same option, the policy with the lower processing order wins (check).
  6. Option precedence including policies, lowest to highest: server → server-level policy → scope → scope-level policy → reservation (Microsoft (check); extends `win-dhcp-scope-options` rule 3).
  7. A user class comes from the client (set on the client by its administrator); a vendor class is sent by the device's DHCP client (option 60).
  8. Tie-break: equal processing order is not allowed; the model rejects it.
- **Params:** `phonesPolicy` toggle (vendor class EQ `VoIP-Phone` → `.200–.204`, option 066 TFTP `10.0.0.66`, order 1, default on); `macPolicy` toggle (MAC EQ `02-AB-CD*` → lease 1 day, order 2, default off); `guestPolicy` toggle (user class EQ `Guests` → `.180–.199`, DNS `203.0.113.53`, lease 2 h, order 3, default off); `phones` range 0–8 (default 3); `laptops` range 0–5 (default 2); `swapOrder` toggle (default off).
- **Presets:**
  1. `phones-by-vendor` — derived, unchecked: 3 phones → `10.0.10.200–.202` with option 066; 2 laptops → `10.0.10.10`, `.11`, no 066.
  2. `two-policies-order` — derived, unchecked: a phone with MAC `02-AB-CD-…` and vendor class `VoIP-Phone` matches both; options merge; `phonesPolicy` (order 1) range wins; lease: only the MAC policy sets option 51, so 1 day applies. Swap the order: the address is still from `.200–.204` (the MAC policy has no range) and the lease still 1 day; the order matters only for an option both policies set.
  3. `range-full` — derived, unchecked: 6 phones, policy range 5 addresses → phone 6 gets no offer although the scope has 200 free.
  4. `guests` — derived, unchecked: laptop whose user class is set to `Guests` → `10.0.10.180`, DNS `203.0.113.53`, lease 2 h.
  5. `no-match` — derived, unchecked: printer with no class and another MAC → general range `10.0.10.12`, scope options only.
- **Steps:** phones-by-vendor 5; two-policies-order 4; range-full 6; guests 3; no-match 2.
- **Legend:** policy rows with order number and a match marker ✓/—; client chips with their class tags; address chips coloured by range with a range label; option values tagged with the policy or level that supplied them. "Changed" marks the client just served and the policy rows that matched it.
- **Captions:**
  - hr: "Telefon šalje *vendor class* (klasu proizvođača) `VoIP-Phone`: pravilo 1 odgovara, pa dobiva adresu iz raspona .200–.204 i opciju 066."
  - en: "The phone sends vendor class `VoIP-Phone`: policy 1 matches, so it gets an address from .200–.204 and option 066."
  - hr: "Raspon pravila je pun. Šesti telefon ne dobiva adresu, iako u ostatku opsega ima 200 slobodnih."
  - en: "The policy's range is full. The sixth phone gets no address, although 200 are free in the rest of the scope."
- **Terms:** policy — pravilo (*policy*); condition — uvjet; processing order — redoslijed obrade; vendor class — klasa proizvođača; user class — korisnička klasa; MAC address — MAC adresa (fizička adresa); wildcard — zamjenski znak.
- **Misconceptions:** "a full policy range falls back to the scope"; "the most specific condition wins" (processing order wins); "user class is set by the server".
- **Out of scope:** reservations in depth and plain precedence (`win-dhcp-scope-options`), failover, DNS registration settings per policy, relay agent information (option 82) beyond a mention.
- **Reuse from `win-dhcp-scope-options` (soft dependency):** the scope, range, lease and option-precedence model; new: policies, conditions, sub-ranges and processing order.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-dhcp-policies` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-dhcp-policies sims/win-dhcp-policies` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dhcp-policies/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
