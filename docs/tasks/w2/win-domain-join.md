# win-domain-join: Joining a domain

| | |
|---|---|
| Task | `win-domain-join` (wave 2b, Active Directory) |
| Catalogue entry | `win-domain-join` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-domain-join/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `active-directory` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **DNS SRV lookup, computer account, secure channel; a broken secure channel after a snapshot revert**.

The student: join a client, revert it, try to log in.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- [MS-ADTS] §6.3 "Publishing and locating a domain controller"; Microsoft Learn: "How domain controllers are located in Windows"
- Microsoft Learn: "Default limit to number of workstations a user can join to the domain" (ms-DS-MachineAccountQuota = 10); "Domain member: Maximum machine account password age" (30 days)
- Microsoft (Ask the Directory Services Team): "Machine account password process" (check title)

## Model and presets

- **Scene:** K1 message sequence chart with lanes `PC07` (client, 10.10.20.57), `DNS` (on DC01), `DC01` (10.10.0.10), and an admin card. Above the chart, a strip with the computer object `CN=PC07` in AD and the machine password on both sides (client LSA secret: current + previous; DC: current + previous), and a timeline in days for the snapshot preset.
- **State:** `{ day, client: { joined, dns, pwd: { cur, prev }, snapshot: null|{day,pwd} }, dc: { objects: {PC07: { pwd: { cur, prev } }}, quota: { user: count } }, secureChannel: 'none'|'ok'|'broken', log: [] }`. Passwords are labels `p0, p1, …`, not secrets.
- **One step:** one message or one event (password change, snapshot, revert, logon attempt); arrows drawn in the chart, the strip updates.
- **Rules:**
  1. The client finds a DC by DNS: `_ldap._tcp.dc._msdcs.quillmoor.example` SRV → DC01, then an LDAP ping (CLDAP, UDP 389) to confirm (MS-ADTS §6.3; Microsoft: "How domain controllers are located in Windows"). A DNS client pointing at a public resolver gets no answer → join fails.
  2. The joining user authenticates; a computer object `CN=PC07` is created in `CN=Computers` (or a pre-staged object is reused). An ordinary user may create up to 10 computer objects (`ms-DS-MachineAccountQuota` default 10); the 11th fails (Microsoft: "Default limit to number of workstations a user can join to the domain").
  3. The client sets a random machine password `p0` on the object and stores it as an LSA secret; join ends with "restart required".
  4. After restart Netlogon builds a secure channel with a DC, authenticating with the machine password; GPOs and domain logon work only over it.
  5. The client changes its machine password every 30 days (Domain member: Maximum machine account password age, default 30 days); the change is client-initiated; client and DC keep current and previous (Microsoft: "Machine account password process" (check)).
  6. Secure channel succeeds if the client's current password equals the DC's current or previous one (check: DC accepting the previous password).
  7. Reverting a VM snapshot restores the client's old LSA secret; after one change since the snapshot it still works (rule 6), after two it fails: "The trust relationship between this workstation and the primary domain failed".
  8. Repair: an administrator resets the machine password on both sides (or rejoins the computer); the pair is then in step again.
- **Params:** `dnsServer` choice {DC01, public resolver} default DC01; `snapshotAge` range 0–90 days step 15, default 65; `joinsByUser` range 0–10 default 0.
- **Presets (5):**
  - `join` — rules 1–4: SRV query, LDAP ping, create object, set `p0`, restart, secure channel ok. 8 steps. Derived, unchecked.
  - `revert-65-days` — snapshot at day 0 (`p0`), changes at day 30 (`p1`) and 60 (`p2`), revert at day 65 → client `p0`, DC `{cur p2, prev p1}` → secure channel broken, domain logon refused. Then repair. 9 steps.
  - `revert-35-days` — one change only (`p1`), revert → client `p0` = DC previous → still works (rule 6, check). 6 steps.
  - `wrong-dns` — DNS points at a public resolver → step 1 fails, nothing created. 3 steps.
  - `quota` — the user already joined 10 machines → object creation refused. 4 steps.
- **Steps:** as listed; max 9.
- **Legend:** DNS message, LDAP/SAMR message, Netlogon message (three arrow styles), machine password label, broken channel (red ✕ plus dashed line); "changed" highlight marks the passwords that changed and the new arrow.
- **Captions:** hr: "Vraćanje snimke vratilo je PC07 na lozinku `p0`, a DC zna samo `p2` i `p1`: *secure channel* (sigurni kanal) ne prolazi." en: "Reverting the snapshot put PC07 back on password `p0`; the DC knows only `p2` and `p1`: the secure channel fails."
  hr: "PC07 pita DNS za `_ldap._tcp.dc._msdcs.quillmoor.example` i dobiva DC01." en: "PC07 asks DNS for `_ldap._tcp.dc._msdcs.quillmoor.example` and gets DC01."
- **Terms:** domain join — učlanjenje u domenu (check); computer account — račun računala (check); secure channel — sigurni kanal (check); machine password — lozinka računala (check); snapshot — snimka (check); SRV record — SRV zapis.
- **Misconceptions:** the computer joins once and the relationship lasts forever; a snapshot revert is harmless for a domain member; the fix is to delete the computer account.
- **Out of scope:** user logon after the join (`win-domain-logon`), DC snapshot revert and USN rollback (`win-ad-backup-restore`), offline domain join.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-domain-join` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-domain-join sims/win-domain-join` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-domain-join/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
