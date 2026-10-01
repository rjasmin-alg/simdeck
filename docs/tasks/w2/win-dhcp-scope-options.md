# win-dhcp-scope-options: Scopes, reservations and option precedence

| | |
|---|---|
| Task | `win-dhcp-scope-options` (wave 2b, DHCP) |
| Catalogue entry | `win-dhcp-scope-options` in `docs/catalogue.md` §4.5.4 |
| Kind | build a new simulator |
| Folder | `sims/win-dhcp-scope-options/` |
| Class | explorer |
| Size | S |
| Priority | P1 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `dhcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **exclusions, reservations; server, scope, class and reservation options, the most specific wins**.

The student: set options at each level, renew a client.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.4.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "DHCP Server" (Windows Server: scopes, exclusion ranges, reservations, default lease 8 days); "Configure DHCP options" / "DHCP options precedence" (server, scope, reservation, class-based options); `Set-DhcpServerv4OptionValue` (PowerShell, `-ScopeId`, `-ReservedIP`, `-VendorClass`, `-UserClass`)
- RFC 2132 options 3, 6, 15, 42, 51, 60 (vendor class), 77 (user class, RFC 3004)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/18-mrezne-usluge.md`, section "Tko dijeli adrese" → "Šire o temi": "Što se uz adresu još dijeli" (options 1, 3, 6, 51), "Koliko dodjela traje" (T1/T2), "Tri mehanizma, gledana s poslužiteljeve strane" (manual allocation = reservation); "Primjer 3 — koliko traje dodjela u učionici"
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md`, "Primjer 2: DHCP dodjela preko posrednika u podružnici" (options 1, 3, 6 handed out together)
- Catalogue seed: builds on net-dhcp-dora → §5.1

## Model and presets

- **Scene:** kit view K4 rule table (see the coordinator note). Left: the DHCP server DHCP1 as nested boxes: Server options ⊃ Scope `10.0.10.0/24` (range `.10–.250`, exclusions, lease 8 days) ⊃ Reservations; class-based option rows inside each box. Right: the chosen client and its effective configuration: address, and for each option (003 Router, 006 DNS Servers, 015 DNS Domain Name, 042 NTP Servers, 051 Lease) the value and the level that supplied it, with the levels it beat struck through.
- **State:** `server: { options: { [code]: value }, classOptions: [{ class, code, value }] }`, `scope: { subnet, range: [from, to], exclusions: [[from, to]], lease, options, classOptions, reservations: [{ name, mac, ip, options }] }`, `leases: [{ mac, ip }]`, `client: { name, mac, vendorClass, userClass }`, derived `effective: [{ code, value, level, overridden: [level] }]`, `offer` (the address).
- **One step:** explorer. Every param change recomputes the client's offer and its effective options.
- **Rules:**
  1. Address: a client with a reservation gets the reserved address; any other gets a free address from the range that is not excluded, not reserved and not leased (Microsoft, "Manage DHCP scopes: exclusions and reservations" (check)). The model takes the lowest free address; Windows' real choice order is not documented here (check).
  2. A reservation must lie in the scope's subnet; exclusions remove addresses from the pool, typically for static servers and gateways (check whether a reservation may sit inside an exclusion range; the presets avoid it).
  3. Option precedence, lowest to highest: server options → scope options → reservation options. The most specific level that sets an option wins, per option, not per level (Microsoft, "DHCP options: precedence" (check)).
  4. Within one level, an option set for a vendor or user class the client presents (option 60 / 77) beats the plain option of that level (check).
  5. An option set at no level is not sent.
  6. A changed option reaches a client only when it renews (T1 = half the lease, 4 days with the 8-day default) or is renewed by hand; the page shows "client still has the old value" until a renew (link to `dhcp-dora`).
  7. Contrast shown in the explanation: this is **most specific wins**, not first match (§5.1).
- **Params:** `client` choice laptop `02-AB-CD-01-02-03` / printer (reserved `10.0.10.40`) / VoIP phone (vendor class `VoIP-Phone`) (default laptop); `scope006` toggle (scope DNS `10.0.10.53`, default off); `resOption003` toggle (reservation router `10.0.10.254`, default off); `exclusion` toggle (`10.0.10.10–10.0.10.30`, default on); `classNtp` toggle (scope class option 042 for `VoIP-Phone`, default off); button `renew`.
- **Presets:**
  1. `server-and-scope` — derived, unchecked: server options 006 `10.0.0.10`, 015 `corp.example`; scope 003 `10.0.10.1`. Laptop → address `10.0.10.31` (first after the exclusion), 003 from scope, 006 and 015 from server.
  2. `scope-overrides` — derived, unchecked: scope 006 `10.0.10.53` set → laptop's DNS = `10.0.10.53` (scope beats server), 015 still from server.
  3. `reservation` — derived, unchecked: printer → `10.0.10.40`; reservation 003 `10.0.10.254` beats scope `10.0.10.1`; the laptop keeps `10.0.10.1`.
  4. `class-option` — derived, unchecked: scope class option 042 `10.0.0.123` for vendor class `VoIP-Phone` → the phone gets 042, the laptop doesn't.
  5. `change-needs-renew` — derived, unchecked: laptop leased with DNS `10.0.0.10`; admin sets scope 006 `10.0.10.53` → effective table shows the new value, client panel still `10.0.0.10` until `renew` (or T1 after 4 days).
- **Steps:** none (explorer).
- **Legend:** level boxes Server / Scope / Reservation with a level icon each; the winning value in bold with its level chip, overridden values struck through; class rows tagged with the class name. "Changed" marks the option rows whose effective value changed with the last param.
- **Captions:**
  - hr: "Opcija 006 postavljena je na poslužitelju i na *scope*-u (opsegu adresa): pobjeđuje razina *scope*, jer je specifičnija — klijent dobiva 10.0.10.53."
  - en: "Option 006 is set on the server and on the scope: the scope wins because it is more specific, and the client gets 10.0.10.53."
  - hr: "Pisač ima *reservation* (rezervaciju): uvijek 10.0.10.40, a opcija 003 s rezervacije nadjačava onu sa scope-a."
  - en: "The printer has a reservation: always 10.0.10.40, and the reservation's option 003 overrides the scope's."
- **Terms:** scope — opseg adresa (*scope*; Microsoft's Croatian UI term (check)); exclusion range — raspon isključenja; reservation — rezervacija (UL ch18: ručna dodjela); option — opcija; router (option 3) — usmjernik / zadani pristupnik; DNS servers (option 6) — poslužitelji imena; lease duration — trajanje dodjele (UL ch18) / zakup (URM ch14); vendor class — klasa proizvođača.
- **Misconceptions:** "the last option I set wins"; "server options are the defaults that scope options can't change"; "changing an option changes the clients now".
- **Out of scope:** DHCP policies (`win-dhcp-policies`), failover (`win-dhcp-failover`), superscopes, DNS registration (`win-dhcp-dns-update`), relay.
- **Builds on `dhcp-dora` (catalogue seed):** reuse its lease and T1 arithmetic for rule 6; nothing else.
- **Note for the coordinator:** the task's Depends on line names K1 (message sequence chart), but this explorer is a precedence table; K4 (rule table) fits. Suggest changing the Depends on line.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-dhcp-scope-options` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-dhcp-scope-options sims/win-dhcp-scope-options` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dhcp-scope-options/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
