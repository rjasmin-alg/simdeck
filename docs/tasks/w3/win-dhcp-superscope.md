# win-dhcp-superscope: Superscopes

| | |
|---|---|
| Task | `win-dhcp-superscope` (wave 3, DHCP on Windows Server) |
| Catalogue entry | `win-dhcp-superscope` in `docs/catalogue.md` §4.5.4 |
| Kind | build a new simulator |
| Folder | `sims/win-dhcp-superscope/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `dhcp` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-dhcp-scope-options` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **several logical subnets on one segment**.

The student: grow a scope past its subnet.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.4.
5. `sims/win-dhcp-scope-options/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Superscopes" / "Using superscopes" (Windows Server DHCP: multinets, member scopes); "Add-DhcpServerv4Superscope" (PowerShell)
- RFC 2131 §4.3.1 (address selection by `giaddr`), §4.3.2 (DHCPNAK)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md`, "DHCP preko granica podmreža: opcije i posrednik" and "Primjer 2: DHCP dodjela preko posrednika u podružnici" (`giaddr`); diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch14-dhcp-relay-giaddr.svg`

## Model and presets

- **Scene:** one physical segment (switch) with clients, a router R1 with its interface addresses (primary `10.0.30.1/24`, optional secondary `10.0.31.1/24`) acting as relay, and DHCP1 with its scopes, optionally grouped in a superscope box. Each scope shows a small address grid (toy range of 5 addresses so it fills fast). Each client shows its address and gateway, and whether it can reach the server network.
- **State:** `router: { primary, secondaries: [] }`, `scopes: [{ subnet, range: [from, to], gateway, leases }]`, `superscope: [scopeId] | null`, `clients: [{ name, ip, gw, reachable }]`, `msgs`, `phase`.
- **One step:** one client arrives and goes through DORA via the relay; or one admin action (add scope, create superscope, add secondary address).
- **Rules:**
  1. The relay puts its interface's **primary** address in `giaddr`; the server picks the scope whose subnet contains `giaddr` (RFC 2131 §4.3.1; URM ch14 "Primjer 2", giaddr `192.168.1.113`).
  2. Without a superscope only that one scope serves the segment; a second scope for another subnet on the same segment is never used for it (Microsoft, "Superscopes" (check)).
  3. With a superscope, all its member scopes serve the segment: when the first is full, the server offers from the next one with free addresses (member order) (check).
  4. A client in subnet B on the same wire needs its gateway (option 003 of scope B) to be an address the router actually has: without the router's secondary address `10.0.31.1`, the client has an address but no way off its subnet, and even hosts in `10.0.30.0/24` on the same switch are reached only through a router (URM ch09 "Podmreža i podmrežavanje"; ARP stays within a subnet (check)).
  5. A client asking to renew or rebind an address from a subnet that the segment's scopes (or superscope) don't contain gets DHCPNAK (RFC 2131 §4.3.2; Windows (check)).
  6. A full scope with no superscope: no offer, the client stays without an address (as `dhcp-dora` rule 10).
- **Params:** `scopeB` toggle (adds `10.0.31.0/24`, range `.10–.14`, gateway `10.0.31.1`; default off); `superscope` toggle (default off); `secondary` toggle (router secondary `10.0.31.1`; default off); `clients` range 1–10 (default 6). Scope A is `10.0.30.0/24`, range `.10–.14` (5 addresses), gateway `10.0.30.1`.
- **Presets:**
  1. `scope-full` — derived, unchecked: 6 clients, scope A has 5 → client 6 gets no offer.
  2. `second-scope-alone` — derived, unchecked: add scope B without a superscope → client 6 still gets no offer (giaddr `10.0.30.1` selects only A).
  3. `superscope` — derived, unchecked: A and B in a superscope, router secondary present → client 6 gets `10.0.31.10`, gateway `10.0.31.1`, reaches the server network.
  4. `no-secondary` — derived, unchecked: superscope but no router secondary → client 6 gets `10.0.31.10` and gateway `10.0.31.1`, which nobody answers: no connectivity.
  5. `better-fix` — derived, unchecked: replace both with one `10.0.30.0/23`-style larger scope (explanation only): one subnet, no superscope needed — the caption says why a superscope is a workaround.
- **Steps:** scope-full 6 (one step per client's DORA); second-scope-alone 7; superscope 7; no-secondary 8; better-fix 2.
- **Legend:** address grids per scope with leased ■ / free □; superscope as a dashed frame around member scopes; client chips with subnet label A/B and ✓/✕ reachability; router interface addresses listed with "primary"/"secondary". "Changed" marks the client just served and the address cell it took.
- **Captions:**
  - hr: "Posrednik u `giaddr` upisuje svoju primarnu adresu 10.0.30.1, pa poslužitelj bira samo opseg 10.0.30.0/24 — koji je pun."
  - en: "The relay writes its primary address 10.0.30.1 into `giaddr`, so the server picks only the 10.0.30.0/24 scope, which is full."
  - hr: "U *superscope*-u (nadopsegu) oba opsega služe istom segmentu: šesti klijent dobiva 10.0.31.10 — ali samo ako usmjernik ima i adresu 10.0.31.1."
  - en: "In a superscope both scopes serve the same segment: the sixth client gets 10.0.31.10, but only if the router also has 10.0.31.1."
- **Terms:** superscope — nadopseg (*superscope*, check term); scope — opseg adresa; segment — segment; secondary address — sekundarna adresa; relay agent — posrednik (URM ch14); giaddr — polje `giaddr`; multinet — više logičkih podmreža na jednom segmentu.
- **Misconceptions:** "adding a second scope adds addresses to the segment" (not without a superscope); "a superscope makes one bigger subnet" (still two subnets, routed between); "the DHCP server decides by the client's MAC which scope" (by giaddr / receiving interface).
- **Out of scope:** multicast scopes, failover of superscopes, IPv6, re-addressing a subnet in practice.
- **Reuse from `win-dhcp-scope-options` (soft dependency):** scopes, ranges, leases and option 003; from `dhcp-dora`/`net-dhcp-relay`: the relay and `giaddr`. New: the superscope grouping and the router secondary address.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dhcp-superscope sims/win-dhcp-superscope` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dhcp-superscope/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
