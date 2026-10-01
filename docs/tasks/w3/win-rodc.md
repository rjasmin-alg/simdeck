# win-rodc: Read-only DC at a branch

| | |
|---|---|
| Task | `win-rodc` (wave 3, Active Directory) |
| Catalogue entry | `win-rodc` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-rodc/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2, SEC |
| Topic / tags / level | `windows-admin` / `active-directory` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ad-sites` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **password replication policy; what a stolen RODC exposes**.

The student: log users in at the branch, steal the RODC.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-ad-sites/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/topologydrafter/js/samples.js` (sample `two-sites`: AD multi-site with RODC)
- Catalogue seed: link-topologydrafter two-sites
- Microsoft Learn: "Read-only domain controllers (RODC) planning" (check title); "Password replication policy" / "Allowed RODC Password Replication Group" and "Denied RODC Password Replication Group" (default groups) (check titles)
- Microsoft Learn: "RODC removal and reinstallation" (reset passwords of cached accounts) (check title)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/domain-admins.txt` (estate Domain Admins for the `admin-at-branch` preset)

## Model and presets

- **Scene:** topologydrafter `two-sites`: HQ with writable `DC01`, Branch with `RODC01` (10.20.0.10, "no writes") and 8 branch PCs, the IPsec tunnel with a cut switch. On the RODC, a card "secrets held": users and computers whose password hashes are cached (`msDS-RevealedList`), plus its own `krbtgt_8123` account. The PRP card: Allowed group (`Allowed RODC Password Replication Group` + `BRK-Staff`), Denied group (`Denied RODC Password Replication Group`: Domain Admins, Enterprise Admins, Schema Admins, Account Operators, Server Operators, Backup Operators, Cert Publishers, krbtgt, Domain Controllers…).
- **State:** `{ wan, users: { id: { groups, pwdVer } }, rodc: { cached: [ids], krbtgt: 'krbtgt_8123' }, stolen: bool, log: [] }`.
- **One step:** one logon at the branch (RODC answers, forwards or fails), one WAN cut/restore, or one theft/response action.
- **Rules (Microsoft: "Read-only domain controllers (RODC) planning"; "RODC password replication policy" (check titles)):**
  1. An RODC holds a read-only copy of the domain partition without secrets, except for accounts it was allowed to cache.
  2. Logon at the branch: if the RODC has the user's password it authenticates locally; otherwise it forwards to a writable DC over the WAN.
  3. After a forwarded success, the writable DC checks the PRP: deny wins over allow; allowed → it replicates that user's password to the RODC (now cached); neither → not cached.
  4. The `Allowed RODC Password Replication Group` is empty by default; members of the Denied group (and so Domain Admins) are never cached.
  5. WAN down: cached users log on via the RODC; others fail at the RODC (the PC may still use local cached credentials, `win-domain-logon` rule 6).
  6. Computer accounts need caching too, or PCs can't build their secure channel to the RODC (check).
  7. The RODC signs TGTs with its own `krbtgt_<n>` key; writable DCs recognise them; a stolen RODC exposes only cached passwords and that key, not the domain's krbtgt.
  8. Response to theft: delete the RODC's computer account and choose "Reset all passwords for user accounts that were cached on this RODC" (and computer accounts); the list to reset is `msDS-RevealedList`.
- **Params:** `allowGroup` choice {empty, BRK-Staff} default BRK-Staff; `wan` toggle default on; `user` choice {ana (BRK-Staff), marko (HQ staff), tbrennan (Domain Admins)} default ana.
- **Presets (5):**
  - `first-logon` — ana at the branch, WAN up: RODC lacks her password → forwards to DC01 → success → PRP allows → cached. 4 steps. Derived, unchecked.
  - `wan-down` — ana logs on again with WAN down → RODC authenticates alone; marko → fails at RODC. 4 steps.
  - `admin-at-branch` — `tbrennan` (Domain Admins, estate `domain-admins.txt`) logs on twice → never cached (deny wins); with WAN down he cannot log on via the RODC. 4 steps.
  - `default-empty` — Allowed group empty: ana forwarded, not cached → WAN down fails for everyone. 4 steps.
  - `stolen` — after 6 branch users and 8 PCs logged on: theft → exposed 6 user hashes + 8 computer hashes + `krbtgt_8123`; response resets exactly those 14 accounts; HQ accounts untouched. 5 steps.
- **Steps:** max 5.
- **Legend:** writable DC (solid), RODC (hatched), cached secret (key), denied (⛔), forwarded logon (dashed arrow over the WAN), exposed after theft (red outline + label); "changed" highlight marks the key just cached or reset.
- **Captions:** hr: "RODC nema lozinku korisnice ana pa prijavu prosljeđuje DC01; *password replication policy* (pravilo replikacije lozinki) dopušta, pa je sada sprema." en: "The RODC doesn't have ana's password, so it forwards the logon to DC01; the password replication policy allows it, so it caches it now."
  hr: "Ukradeni RODC otkriva 6 korisničkih i 8 računalnih lozinki — resetiraju se samo one." en: "The stolen RODC exposes 6 user and 8 computer passwords — only those are reset."
- **Terms (check):** read-only domain controller — kontroler domene samo za čitanje; password replication policy — pravilo replikacije lozinki; cached credentials — spremljene vjerodajnice; writable DC — kontroler domene s pisanjem; branch office — podružnica; theft — krađa.
- **Misconceptions:** an RODC holds every password; a stolen RODC means resetting the whole domain (and krbtgt); admins can safely log on at the branch.
- **Out of scope:** RODC promotion and staged install, admin role separation, filtered attribute set, DNS on the RODC.
- **Builds on `win-ad-sites`:** reuses its two-site topology and WAN; new are the PRP and the secrets card.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-rodc` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-rodc sims/win-rodc` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-rodc/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
