# win-dns-srv-records: What AD puts in DNS

| | |
|---|---|
| Task | `win-dns-srv-records` (wave 2b, DNS) |
| Catalogue entry | `win-dns-srv-records` in `docs/catalogue.md` §4.5.3 |
| Kind | build a new simulator |
| Folder | `sims/win-dns-srv-records/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `dns` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-dc-promotion` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **_ldap._tcp, _kerberos._tcp, _msdcs; what breaks when they are missing**.

The student: delete records, try to join and log in.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.3.
5. `sims/win-dc-promotion/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Locating Active Directory domain controllers in Windows and Windows Server" (DC locator process); "How DNS Support for Active Directory Works" (SRV records, `_msdcs`, `netlogon.dns`); "Verify SRV DNS records have been created"; "DNS requirements for installing Active Directory"; `nltest` reference (`/dsgetdc`, `/dsregdns`)
- RFC 2782 (SRV record, priority and weight selection); RFC 4120 §7.2.3 (locating KDCs via DNS SRV)
- Catalogue seed: pairs with win-domain-logon → §5.21

## Overlaps (catalogue §5)

- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** two panels. Left: the `corp.example` zone and its `_msdcs.corp.example` subzone as a record list grouped by what uses them (DC locator, Kerberos, GC, replication), each with a delete/restore button. Right: a K1-style sequence of a client action (join or logon) against DC1 (site HQ) and DC2 (site Split): DNS query → answer/NXDOMAIN → CLDAP "LDAP ping" → Kerberos → result.
- **State:** `records: [{ owner, type, data: { prio, weight, port, target }, present }]`, `client: { name, site, dnsServers: [ip], joined }`, `action: join|logon`, `msgs: [...]`, `phase`, `netlogonRestarted: bool`.
- **One step:** one message of the client's locator or Kerberos exchange, or the Netlogon re-registration when that is the preset's action.
- **Rules:**
  1. A DC's Netlogon service registers the locator records at start and again periodically (every 24 h (check)); restarting Netlogon, or asking it to re-register, puts deleted ones back (Microsoft, "Verify SRV DNS records have been created" (check)).
  2. Records modelled (RFC 2782 SRV format `_service._proto.name prio weight port target`): `_ldap._tcp.corp.example` (389), `_ldap._tcp.dc._msdcs.corp.example` (389), `_ldap._tcp.HQ._sites.dc._msdcs.corp.example` (389), `_kerberos._tcp.corp.example` and `_kerberos._tcp.dc._msdcs.corp.example` (88), `_kpasswd._tcp.corp.example` (464), `_gc._tcp.corp.example` (3268), `_ldap._tcp.pdc._msdcs.corp.example`, and the `<DSA GUID>._msdcs.corp.example` CNAME used for replication (Microsoft, "SRV Resource Records" / "DNS requirements for installing Active Directory" (check)).
  3. DC locator for a join or logon: query the site-specific `_ldap._tcp.<site>._sites.dc._msdcs.<domain>` if the client knows its site, otherwise `_ldap._tcp.dc._msdcs.<domain>`; pick a target by SRV priority then weight (RFC 2782); send a CLDAP ping (UDP 389) to it; the DC answers with the client's site and whether it is the closest (Microsoft, "Locating Active Directory domain controllers in Windows" (check)).
  4. If the site-specific record is missing, the client falls back to the domain-wide record and may pick a DC in another site (slow logon over the WAN).
  5. If `_ldap._tcp.dc._msdcs.<domain>` is missing, a join fails with "An Active Directory Domain Controller (AD DC) for the domain could not be contacted" (DNS name does not exist) (wording (check)).
  6. If the Kerberos SRV records are missing, the client finds no KDC; the model shows Kerberos failing and NTLM fallback where allowed (check).
  7. A client whose DNS server is a public resolver (`203.0.113.53`) gets NXDOMAIN for every `_msdcs` name: the same symptom as rule 5, with every record present.
  8. Tie-break for equal priority and weight: the model takes the first listed target; real clients randomise (RFC 2782).
- **Params:** `action` choice join / logon (default join); `site` choice HQ / Split / unknown (default HQ); `dns` choice DC1 `10.0.0.10` / public `203.0.113.53` (default DC1); toggles to delete record groups: `locator`, `siteRecord`, `kerberos`, `gc` (all default off); button `restartNetlogon`.
- **Presets:**
  1. `healthy-join` — derived, unchecked: PC-07 joins `corp.example` from HQ → SRV `_ldap._tcp.HQ._sites.dc._msdcs` → DC1, LDAP ping, Kerberos, join succeeds.
  2. `no-locator` — derived, unchecked: delete `_ldap._tcp.dc._msdcs` and the site record → NXDOMAIN → join fails (rule 5).
  3. `no-site-record` — derived, unchecked: client in HQ, site record missing → domain-wide record lists DC2 (Split) first → logon via DC2 over the WAN.
  4. `public-dns` — derived, unchecked: client's DNS is `203.0.113.53`, all records present → NXDOMAIN, join fails; the record list stays green.
  5. `netlogon-fix` — derived, unchecked: from `no-locator`, restart Netlogon on DC1 → records reappear → join succeeds.
- **Steps:** healthy-join 8; no-locator 4; no-site-record 9; public-dns 4; netlogon-fix 3 + 8.
- **Legend:** record rows ✓ present / ✕ deleted (strikethrough); sequence arrows: DNS (dashed), CLDAP (dotted), Kerberos (solid); result badge ✓/✕ with text. "Changed" marks the record the client just queried and the newest arrow.
- **Captions:**
  - hr: "Klijent traži *SRV record* (SRV zapis) `_ldap._tcp.HQ._sites.dc._msdcs.corp.example` — tako pronalazi kontroler domene u svojoj lokaciji."
  - en: "The client asks for the SRV record `_ldap._tcp.HQ._sites.dc._msdcs.corp.example`: that's how it finds a domain controller in its own site."
  - hr: "Svi zapisi postoje, ali klijent pita javni DNS 203.0.113.53 — taj za `_msdcs.corp.example` ne zna ništa, pa pridruživanje domeni ne uspijeva."
  - en: "Every record exists, but the client asks the public resolver 203.0.113.53, which knows nothing about `_msdcs.corp.example`, so the join fails."
- **Terms:** SRV record — SRV zapis; domain controller — kontroler domene; DC locator — lociranje kontrolera domene; site — lokacija (*site*); priority / weight — prioritet / težina; global catalog — globalni katalog; domain join — pridruživanje domeni.
- **Misconceptions:** "a client finds the DC by its name or by broadcast" (it asks DNS for SRV records); "any DNS server will do on a domain client" (public DNS breaks AD); "deleted SRV records stay deleted" (Netlogon puts them back).
- **Out of scope:** Kerberos ticket details (`win-domain-logon`), promotion itself (`win-dc-promotion`), dynamic update security (`win-dns-dynamic-update`), NetBIOS/WINS DC location.
- **Reuse from `win-dc-promotion` (soft dependency):** the domain, DC and site objects and the record set the promotion registers; new here: deleting records and the client-side locator sequence.
- **Note for the coordinator:** §5.21 says "SRV records and domain logon are one page in two steps". This task and `win-domain-logon` would then build the same page; decide which one owns it and make the other a preset or a second mode.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dns-srv-records sims/win-dns-srv-records` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dns-srv-records/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
