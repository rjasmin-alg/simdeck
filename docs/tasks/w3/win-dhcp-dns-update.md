# win-dhcp-dns-update: DHCP updating DNS for clients

| | |
|---|---|
| Task | `win-dhcp-dns-update` (wave 3, DHCP on Windows Server) |
| Catalogue entry | `win-dhcp-dns-update` in `docs/catalogue.md` §4.5.4 |
| Kind | build a new simulator |
| Folder | `sims/win-dhcp-dns-update/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `dns`, `dhcp` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-dns-dynamic-update` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **the server registers records, name protection, DnsUpdateProxy**.

The student: renew leases for old and new clients.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.4.
5. `sims/win-dns-dynamic-update/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Using DNS servers with DHCP" / "Configure DHCP to update DNS" (DNS tab settings and defaults); "DHCP Name Protection"; "Configure DNS dynamic update credentials" (`Set-DhcpServerDnsCredential`); "DnsUpdateProxy group" security considerations
- RFC 4702 (option 81, Client FQDN); RFC 4701 (DHCID record); RFC 4703 (conflict resolution between DHCP clients and servers); RFC 2136 (DNS UPDATE)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md`, "Tko odgovara kad se pita za ime" → "Šire o temi" (obrnuto razrješavanje, PTR zones)
- Catalogue seed: → §5.21

## Overlaps (catalogue §5)

- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** three columns: client(s) with their OS and whether they send option 81; DHCP1 (and DHCP2 for the failover preset) with the DNS tab settings; the `corp.example` zone and the `10.0.10.in-addr.arpa` reverse zone as record tables with owner. K1-style arrows below for the lease and the DNS updates it triggers.
- **State:** `dhcp: [{ id, account, inDnsUpdateProxy, creds: computer|dedicatedUser, settings: { mode: off|onRequest|always, discardOnDelete, legacyClients, nameProtection } }]`, `clients: [{ name, mac, os: windows|other|printer, sendsOpt81 }]`, `zone: { records: [{ name, type, data, owner }] }`, `leases`, `msgs`, `t`.
- **One step:** one event: a lease (grant/renew/expire), the DHCP server's DNS update, the client's own update, or a failover switch.
- **Rules:**
  1. A Windows client sends option 81 (Client FQDN) asking the server to update only the PTR; the client registers its A record itself (RFC 4702 §2.1 flags; Microsoft (check)).
  2. Server setting "Dynamically update DNS records only if requested by DHCP clients" (default (check)): the server updates what the client asked for (PTR); "Always dynamically update": the server updates A and PTR for every client that sends option 81.
  3. Clients that don't send option 81 (many non-Windows clients, printers) get no records unless "Dynamically update DNS records for DHCP clients that do not request updates" is on (default off (check)).
  4. "Discard A and PTR records when lease is deleted" (default on (check)): when the lease expires or is deleted, the server removes the records it registered.
  5. Records the DHCP server creates are owned by the account it uses: its computer account by default, or the dedicated user set under "DNS dynamic update registration credentials" (Microsoft (check)).
  6. In a Secure only zone, another account (a second DHCP server, or the client itself) may not change those records → REFUSED (same ownership rule as `win-dns-dynamic-update` rule 6).
  7. Records created by a member of `DnsUpdateProxy` get no owner protection; the next account to update the name takes ownership (check). If the DHCP server is a DC in DnsUpdateProxy, records it creates (its own included) are unsecured: a known risk.
  8. Name Protection (Windows Server 2008 R2+): the server registers on behalf of clients and adds a DHCID record (RFC 4701); an update for a name whose DHCID belongs to another client is refused (RFC 4703 conflict resolution) (check).
- **Params:** `client` choice Windows laptop / non-Windows host / printer (default Windows); `mode` choice off / on request / always (default on request); `legacy` toggle (default off); `failover` toggle (default off); `creds` choice computer account / shared user `svc-dhcpdns` (default computer); `proxy` toggle (DHCP1 and DHCP2 in DnsUpdateProxy, default off); `nameProtection` toggle (default off).
- **Presets:**
  1. `windows-default` — derived, unchecked: WIN10-07 leases `10.0.10.57`, sends option 81 → DHCP1 registers `57.10.0.10.in-addr.arpa PTR win10-07.corp.example` (owner DHCP1$); the client registers `win10-07 A 10.0.10.57` itself (owner WIN10-07$).
  2. `printer-none` — derived, unchecked: printer PRN-3 (no option 81) → no record; turn `legacy` on → DHCP1 registers A + PTR, owner DHCP1$.
  3. `failover-refused` — derived, unchecked: DHCP1 down, DHCP2 renews PRN-3 with a new address `10.0.10.88` → its update of `prn-3 A` is REFUSED (owner DHCP1$) → the name points to the old address. Fix: same credentials `svc-dhcpdns` on both, or DnsUpdateProxy.
  4. `lease-expiry` — derived, unchecked: non-Windows host HOST-12 (registered via `legacy`) leaves; at lease expiry DHCP1 deletes `host-12 A` and PTR (discard on delete on); off → records stay (link to scavenging).
  5. `name-protection` — derived, unchecked: Name Protection on; a laptop calls itself `fs1` → DHCID of `fs1` belongs to another client → update refused, `fs1` unchanged.
- **Steps:** windows-default 6; printer-none 5 + 3; failover-refused 7; lease-expiry 5; name-protection 6.
- **Legend:** record rows with owner chips (server icon for DHCP-owned, computer icon for client-owned, open lock for unsecured DnsUpdateProxy records); update arrows ✓ accepted / ✕ REFUSED. "Changed" marks the record touched and the newest message.
- **Captions:**
  - hr: "Windows klijent u opciji 81 traži da DHCP poslužitelj upiše samo PTR zapis; A zapis registrira sam."
  - en: "The Windows client uses option 81 to ask the DHCP server to register only the PTR record; it registers the A record itself."
  - hr: "DHCP2 ne smije promijeniti `prn-3`: zapis je stvorio DHCP1 svojim računom računala. Zato oba poslužitelja trebaju iste vjerodajnice."
  - en: "DHCP2 may not change `prn-3`: DHCP1 created it with its computer account. That's why both servers need the same credentials."
- **Terms:** option 81 (Client FQDN) — opcija 81 (puno ime klijenta); PTR record — PTR zapis (obrnuto razrješavanje, UL ch19); registration credentials — vjerodajnice za registraciju; name protection — zaštita imena; record owner — vlasnik zapisa (u ACL-u); lease expiry — istek dodjele.
- **Misconceptions:** "DHCP registers every client in DNS by default"; "two DHCP servers can update each other's records"; "DnsUpdateProxy makes it secure" (it removes protection).
- **Out of scope:** the client's own secure update in detail (`win-dns-dynamic-update`), aging (`win-dns-scavenging`), failover mechanics (`win-dhcp-failover`), DHCPv6.
- **Reuse from `win-dns-dynamic-update` (soft dependency):** the zone record table with owners and the ownership rule; new: option 81, the DHCP server's DNS settings, credentials, DnsUpdateProxy and DHCID.
- **Note for the coordinator:** §5.21 puts this page, `win-dns-dynamic-update` and `win-dns-scavenging` on one record-lifecycle model; see the same note in those tasks.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dhcp-dns-update sims/win-dhcp-dns-update` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dhcp-dns-update/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
