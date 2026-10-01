# win-dns-dynamic-update: Secure dynamic updates

| | |
|---|---|
| Task | `win-dns-dynamic-update` (wave 2b, DNS) |
| Catalogue entry | `win-dns-dynamic-update` in `docs/catalogue.md` §4.5.3 |
| Kind | build a new simulator |
| Folder | `sims/win-dns-dynamic-update/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `dns` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **clients register their own records; record ownership and why a renamed machine can't update**.

The student: join, rename, move machines.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.3.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "How dynamic update works" / "Understanding Dynamic Update"; "Secure dynamic update" (Windows Server DNS); "Configure DNS dynamic update" (zone property *Dynamic updates*); `ipconfig /registerdns` reference
- RFC 2136 (DNS UPDATE); RFC 3645 (GSS-TSIG); RFC 2930 (TKEY)
- Catalogue seed: → §5.21

## Overlaps (catalogue §5)

- **§5.4 DNS:** Resolution and TTL can share one page with two modes, but each is a full 3–5 minute demo, so keep two pages on one model. Secondary expiry and split-brain are presets of one "zone servers over time" page.
- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** left, the AD-integrated zone `corp.example` as a record table: name, type, data, **owner** (security principal on the record's ACL), timestamp. Right: K1-style sequence between the client and DC1: SOA query → update (unsigned) → REFUSED → TKEY/GSS-TSIG negotiation → signed update → result. Top: the zone's dynamic-update setting (None / Nonsecure and secure / Secure only).
- **State:** `zone: { name, updates: none|nonsecureAndSecure|secureOnly, records: [{ name, type, data, owner, timestamp }] }`, `ad: { computers: [{ name, sid }] }`, `clients: [{ id, name, ip, sid | null (workgroup), domainMember }]`, `msgs`, `phase`, `t`.
- **One step:** one message of one client's registration (the preset's action triggers it: join, IP change, rename, rebuild), or one admin action.
- **Rules:**
  1. A Windows client registers its A record (and PTR when it has a static address) at boot, on an address change, on a manual re-registration and periodically, every 24 h (check) (Microsoft, "How dynamic update works" (check)).
  2. It finds the server to update by asking for the SOA of its name; for an AD-integrated zone any writable DC accepts the update (RFC 2136 §4; Microsoft (check)).
  3. The client first sends an unsigned update; with "Secure only" the server REFUSES it, the client negotiates a security context (TKEY, GSS-TSIG, RFC 3645) with its computer account and resends the update signed (Windows default "try nonsecure, then secure" (check)).
  4. "Secure only" exists only for AD-integrated zones (Microsoft (check)).
  5. A new name: any authenticated computer may create it; the creator becomes the record's owner with full control (ACL "Authenticated Users: Create all child objects" on the zone (check)).
  6. An existing name: a signed update succeeds only if the sender may write the record (its owner, or a group with rights). Otherwise REFUSED and the old data stays.
  7. "Nonsecure and secure": unsigned updates from anyone are accepted, any name can be overwritten (RFC 2136 has no authentication).
  8. "None": updates REFUSED; records only by hand.
  9. An IP change from the same machine is an update by the owner: accepted, data and timestamp change.
  10. Rename: the machine registers the new name as a new record; removal of the old name is best effort, the old record may remain until scavenged (check).
  11. A rebuilt machine with the same name but a **new** computer account (old one deleted, new SID) is not the owner of the old record → REFUSED. Resetting the old account instead of deleting it keeps the SID, and the update succeeds (check).
- **Params:** `updates` choice None / Nonsecure and secure / Secure only (default Secure only); `action` choice join / move IP / rename / rebuild (delete account) / rebuild (reset account) / rogue laptop (default join); button `deleteRecord` (admin deletes the stale record).
- **Presets:**
  1. `join` — derived, unchecked: PC1 joins, DHCP gives `10.0.0.51` → unsigned update REFUSED → GSS-TSIG → signed update OK; record `pc1 A 10.0.0.51`, owner `CORP\PC1$`.
  2. `move` — derived, unchecked: PC1 moves to `10.0.1.23` → signed update by the owner → `pc1 A 10.0.1.23`.
  3. `rebuild-new-sid` — derived, unchecked: PC1's account deleted, a new machine joined as PC1 (new SID) at `10.0.0.77` → REFUSED, `pc1` still `10.0.0.51`; users reach the wrong host. Fix: admin deletes the record → next registration creates it with the new owner.
  4. `rebuild-reset` — derived, unchecked: same, but the account was reset → same SID → update OK.
  5. `rename` — derived, unchecked: PC2 renamed to PC2-NEW → new record `pc2-new`; `pc2` may stay behind (link to `win-dns-scavenging`).
  6. `nonsecure-hijack` — derived, unchecked: zone set to Nonsecure and secure; a workgroup laptop sends an unsigned update `fs1 A 10.0.0.66` → accepted; `fs1` now points to the laptop.
- **Steps:** join 6; move 4; rebuild-new-sid 6 (+2 fix); rebuild-reset 6; rename 5; nonsecure-hijack 3.
- **Legend:** record rows with an owner chip (computer icon + name); update arrows: unsigned (open arrowhead), signed (closed arrowhead with a key glyph); result badges ✓ accepted / ✕ REFUSED. "Changed" marks the record row changed or refused and the newest message.
- **Captions:**
  - hr: "Zona prihvaća samo *secure dynamic update* (sigurno dinamičko ažuriranje): nepotpisano ažuriranje odbijeno je, klijent se prijavljuje računom računala i šalje potpisano."
  - en: "The zone accepts secure dynamic updates only: the unsigned update is refused, the client authenticates with its computer account and sends a signed one."
  - hr: "Zapis `pc1` pripada starom računu CORP\\PC1$. Novi PC1 ima drugi SID, pa ga ne smije mijenjati — ime i dalje vodi na 10.0.0.51."
  - en: "The `pc1` record belongs to the old CORP\\PC1$ account. The new PC1 has another SID, so it may not change it, and the name still leads to 10.0.0.51."
- **Terms:** dynamic update — dinamičko ažuriranje; secure dynamic update — sigurno dinamičko ažuriranje; record owner — vlasnik zapisa (in the ACL sense; note that UL ch19 "vlasnik zapisa" means the owner *name*, so say "vlasnik (u ACL-u)"); computer account — račun računala; access control list — popis za kontrolu pristupa (ACL); REFUSED — odbijeno.
- **Misconceptions:** "the DNS admin must add every PC by hand"; "if the name is wrong, the client will fix it" (not if someone else owns the record); "nonsecure updates are fine inside the LAN".
- **Out of scope:** DHCP registering on behalf of clients (`win-dhcp-dns-update`), aging (`win-dns-scavenging`), PTR zones in detail, TSIG with shared keys, Kerberos internals.
- **Note for the coordinator:** §5.21 puts this page, `win-dhcp-dns-update` and `win-dns-scavenging` on one record-lifecycle model (records with owner, timestamp, data). Whoever builds first should put that model where the others can copy it (COMMON.md §6), with fields `{ name, type, data, owner, timestamp, static }`.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dns-dynamic-update sims/win-dns-dynamic-update` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dns-dynamic-update/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
