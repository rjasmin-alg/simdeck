# win-ntfs-share-effective: Effective access: NTFS plus share

| | |
|---|---|
| Task | `win-ntfs-share-effective` (wave 2b, Windows files and identity) |
| Catalogue entry | `win-ntfs-share-effective` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-ntfs-share-effective/` |
| Class | explorer |
| Size | S |
| Priority | P1 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `permissions` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **most restrictive of the two wins; deny beats allow; groups add up**.

The student: set ACEs on share and folder, test users locally and over the network.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "How DACLs Control Access to an Object" and "Order of ACEs in a DACL" (Win32 security documentation: explicit deny, explicit allow, inherited deny, inherited allow); "Access Control Lists"; "Share and NTFS permissions on a file server" (most restrictive applies over the network; default share permission)
- Catalogue seed: → §5.1

## Overlaps (catalogue §5)

- **§5.1 First-match rule evaluation:** Build one rule-table evaluator with presets: router ACL, stateless firewall, pg_hba.conf. Keep netfilter (a path through hooks, not one list), PAM (control flags, not first match), NTFS (deny wins, not first match) and the most-specific-wins rules (win-dhcp-scope-options, win-fgpp) separate, because their rules are different; note the contrast on each page.

## Model and presets

- **Scene:** kit view K4 rule table. Folder `D:\Prodaja` shared as `\\FS1\Prodaja`. Two ACL tables: the share's ACL (Read / Change / Full Control, allow or deny, per principal) and the folder's NTFS ACL (Read, Read & execute, Write, Modify, Full Control; allow or deny; explicit or inherited). A user picker and an access-path switch (local logon at FS1 / over the network). Result panel: the user's SIDs (user + groups + well-known), each ACE that applied, the share result, the NTFS result, and the effective result with the rule that decided it.
- **State:** `users: [{ name, groups: [] }]`, `share: [{ principal, level: read|change|full, type: allow|deny }]`, `ntfs: [{ principal, rights: [read, readExecute, write, modify, full], type: allow|deny, inherited: bool }]`, `who`, `path: local|network`, derived `sids`, `shareEff`, `ntfsEff`, `effective`, `decidedBy`.
- **One step:** explorer. Every change recomputes in this order: (1) the user's SIDs; (2) NTFS result; (3) share result (network only); (4) the effective result.
- **Rules:**
  1. The user's identity is the set of SIDs in the access token: the user, every group (nested groups expanded), and well-known groups such as Everyone and Authenticated Users (Microsoft, "Access Tokens" (check); link `win-access-token`).
  2. NTFS: ACEs are checked in canonical order — explicit deny, explicit allow, inherited deny, inherited allow; a right denied before it is allowed is refused; rights allowed by different ACEs add up (Microsoft, "Order of ACEs in a DACL", "How DACLs Control Access to an Object").
  3. So an explicit allow on the folder beats a deny inherited from the parent (rule 2's order).
  4. No ACE grants a right → refused (implicit deny).
  5. Share permissions: allows from all SIDs add up; a deny for any SID removes that level (deny wins).
  6. Over the network the effective access is the more restrictive of the share result and the NTFS result, right by right; locally only NTFS applies.
  7. Levels compared: share Read ≈ NTFS Read & execute; share Change ≈ NTFS Modify; share Full Control ≈ NTFS Full Control (Microsoft, "Share and NTFS permissions" (check)).
  8. Default share permission on a new share: Everyone Read (check).
- **Params:** `who` choice ana (Prodaja) / ivan (Prodaja, Pripravnici) / marko (no group) (default ana); `path` choice local / network (default network); `shareEveryone` choice Read / Change / Full Control (default Full Control); `ntfsProdaja` choice Read / Modify (default Modify); `denyPripravnici` choice none / deny Write explicit / deny Write inherited (default none); `explicitAllowIvan` toggle (ivan Modify, explicit; default off); `voditelji` toggle (ana also in Voditelji with NTFS Write; default off).
- **Presets:**
  1. `classic` — derived, unchecked: share Everyone Full Control, NTFS Prodaja Modify → ana over the network: Modify (NTFS decides); marko: no access (no NTFS ACE).
  2. `default-share` — derived, unchecked: share Everyone Read → ana over the network: Read; locally at FS1: Modify. The share is the more restrictive.
  3. `groups-add-up` — derived, unchecked: NTFS Prodaja Read, Voditelji Write; ana in both → Read + Write.
  4. `deny-wins` — derived, unchecked: ivan in Prodaja (Modify) and Pripravnici (explicit Deny Write) → read only.
  5. `explicit-beats-inherited` — derived, unchecked: Pripravnici Deny Write inherited from `D:\`, ivan has an explicit Modify on `D:\Prodaja` → ivan can write (rule 3).
  6. `deny-everyone-share` — derived, unchecked: share Deny Everyone Change → nobody writes over the network, administrators included; locally still Modify.
- **Steps:** none (explorer).
- **Legend:** ACE rows with ✓ allow / ⛔ deny and an "inherited" tag (↧) vs "explicit"; the ACE that decided a right outlined; result chips per right (R, X, W, M, F) as on/off with letters; a "more restrictive" arrow between share and NTFS results. "Changed" marks the ACE rows and result chips that changed with the last param.
- **Captions:**
  - hr: "Preko mreže vrijedi strože od dvaju: dijeljenje daje *Read* (čitanje), NTFS *Modify* (izmjenu) — Ana smije samo čitati."
  - en: "Over the network the stricter of the two applies: the share gives Read, NTFS gives Modify, so Ana may only read."
  - hr: "Zabrana je naslijeđena s D:\\, a dozvola za Ivana zadana je izravno na mapi: izravna dozvola dolazi prije naslijeđene zabrane."
  - en: "The deny is inherited from D:\\, and Ivan's allow is set on the folder itself: an explicit allow comes before an inherited deny."
- **Terms:** permission — dozvola; share permissions — dozvole dijeljenja; NTFS permissions — NTFS dozvole; access control entry (ACE) — stavka popisa za kontrolu pristupa; deny — zabrana; inherited / explicit — naslijeđena / izravno zadana; effective access — efektivni pristup; security identifier (SID) — sigurnosni identifikator (SID).
- **Misconceptions:** "share and NTFS permissions add up" (the stricter wins); "deny always beats allow" (an explicit allow beats an inherited deny); "the first matching rule decides" (not first match; contrast with §5.1).
- **Out of scope:** inheritance mechanics, move vs copy (`win-ntfs-inheritance`), ownership and taking ownership, UAC token filtering, access-based enumeration, Dynamic Access Control.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-ntfs-share-effective` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-ntfs-share-effective sims/win-ntfs-share-effective` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ntfs-share-effective/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
