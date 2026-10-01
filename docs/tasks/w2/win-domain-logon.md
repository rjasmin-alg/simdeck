# win-domain-logon: Domain logon

| | |
|---|---|
| Task | `win-domain-logon` (wave 2b, Active Directory) |
| Catalogue entry | `win-domain-logon` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-domain-logon/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `active-directory` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-dns-srv-records` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **DC locator via DNS SRV, then Kerberos; cached credentials when no DC answers**.

The student: log in on site, at a branch, offline.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-dns-srv-records/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/topologydrafter/js/samples.js` (sample `two-sites`: AD multi-site with RODC)
- Catalogue seed: link-topologydrafter two-sites
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/forest.txt` (one site, no subnets: clients pick DCs at random)
- [MS-ADTS] §6.3 "Publishing and locating a domain controller"; Microsoft Learn: "How domain controllers are located in Windows"
- Microsoft Learn: "Interactive logon: Number of previous logons to cache (in case domain controller is not available)" (default 10)

## Overlaps (catalogue §5)

- **§5.21 Windows infrastructure: AD, DNS and DHCP together:** One shared model of a small domain (DCs, DNS zones, DHCP server, clients over time) under all of these, like ossimulator's shared engine. Dynamic update, DHCP-registered records and scavenging are three pages on one record-lifecycle model. SRV records and domain logon are one page in two steps. The time hierarchy links to inet-ntp-sync for the protocol. USN rollback is a preset next to sto-backing-chains (the same "revert a snapshot" act, a different victim). The address plan reuses urm-vlsm's arithmetic.

## Model and presets

- **Scene:** topologydrafter `two-sites` reduced to what logon needs: site HQ (subnet 10.10.0.0/16, `DC01` 10.10.0.10, writable) and site Branch (10.20.0.0/16, `RODC01` 10.20.0.10), the IPsec tunnel between them, and DNS on both. Below, a K1 sequence chart with lanes `PC` (user `ana`), `DNS`, `DC`, plus the PC's cached-credentials box (count / 10).
- **State:** `{ pc: { ip, site: null|name, cache: [users] }, wanUp, rodcCached: [users], dcChosen, phase, log: [] }`.
- **One step:** one message of the DC locator or of logon; the chosen DC is lit on the topology.
- **Rules (reuse `win-dns-srv-records` for record names; Microsoft: "How domain controllers are located in Windows"; MS-ADTS §6.3):**
  1. With no cached site, the client asks `_ldap._tcp.dc._msdcs.quillmoor.example` and gets all DCs; it LDAP-pings the first that answers.
  2. The DC answers with the client's site, computed from the client's IP against the subnet objects; if that site differs from the DC's, the client re-queries the site record `_ldap._tcp.<site>._sites.dc._msdcs.quillmoor.example` and uses a DC in its own site. The site is cached for next time.
  3. No subnet matches → no site; the client keeps whichever DC answered first (estate `forest.txt`: "no subnets defined — clients pick DCs at random").
  4. Logon is Kerberos (AS exchange → TGT, then a service ticket for the PC itself); details in `win-kerberos`, shown here as two arrows.
  5. A successful interactive domain logon stores a cached verifier on the PC; up to 10 users by default (Interactive logon: Number of previous logons to cache, default 10).
  6. No DC answers: a user with a cached verifier logs on with cached credentials (no new GPOs, no ticket); a user never seen on this PC gets "There are currently no logon servers available to service the logon request".
  7. At the branch the RODC answers locator queries for its site; if it lacks the user's password it forwards authentication to a writable DC over the WAN (PRP details in `win-rodc`); WAN down and password not cached → RODC cannot authenticate → rule 6 applies.
- **Params:** `location` choice {HQ, Branch, offline} default HQ; `subnets` toggle default on; `wan` toggle default on; `cachedOnPc` toggle default off; `rodcHasPwd` toggle default off.
- **Presets (5):**
  - `hq` — PC 10.10.20.57, subnets on → site HQ, DC01, Kerberos, cache 1/10. 7 steps. Derived, unchecked.
  - `branch-first` — laptop from HQ moved to Branch 10.20.0.57: cached site HQ → DC01 tells it "you are in Branch" → re-query site record → RODC01; RODC forwards to DC01 (WAN up). 9 steps.
  - `branch-wan-down` — same, WAN down, RODC has no password, PC has `ana` cached → cached logon succeeds; caption: no GPO, no file-share ticket. 7 steps.
  - `offline-new-user` — offline, `marko` never logged on here → "no logon servers available". 4 steps.
  - `no-subnets` — estate case: subnets off, branch PC gets DC01 over the WAN although RODC01 is next door. 6 steps. From the DR estate `forest.txt`.
- **Steps:** max 9.
- **Legend:** DNS query, LDAP ping, Kerberos (three arrow styles); site boundary (shaded zone); chosen DC (outlined); cached credential (key in a box); "changed" highlight marks the DC chosen in this step and the cache entry added.
- **Captions:** hr: "DC01 javlja da je klijent s 10.20.0.57 u lokaciji Branch: klijent ponovo pita DNS za `_ldap._tcp.Branch._sites.dc._msdcs` i dobiva RODC01." en: "DC01 reports that the client at 10.20.0.57 is in site Branch: the client asks again for `_ldap._tcp.Branch._sites.dc._msdcs` and gets RODC01."
  hr: "Nijedan DC ne odgovara, ali `ana` je već prijavljena na ovom računalu: prijava *cached credentials* (spremljenim vjerodajnicama)." en: "No DC answers, but `ana` has logged on here before: she logs on with cached credentials."
- **Terms:** DC locator — lociranje kontrolera domene (check); site — lokacija (check); subnet — podmreža (URM ch09); cached credentials — spremljene vjerodajnice (check); logon — prijava; ticket — karta (NLA T57).
- **Misconceptions:** logon needs the DC every time (cached logon works offline); clients always use the nearest DC (only with subnets defined); an RODC at a branch makes WAN-less logon work for everyone.
- **Out of scope:** Kerberos message contents (`win-kerberos`), the RODC password replication policy (`win-rodc`), site links and replication (`win-ad-sites`), what each SRV record does (`win-dns-srv-records`).
- **Note for the coordinator:** §5.21 says SRV records and domain logon are one page in two steps; this spec assumes `win-dns-srv-records` stays its own page and this one reuses its record model. If they merge, this becomes its second step.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-domain-logon sims/win-domain-logon` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-domain-logon/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
