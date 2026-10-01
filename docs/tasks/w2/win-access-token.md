# win-access-token: The access token

| | |
|---|---|
| Task | `win-access-token` (wave 2b, Windows files and identity) |
| Catalogue entry | `win-access-token` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-access-token/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `permissions` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **SIDs and groups are fixed at logon; why you log off after a group change**.

The student: add a user to a group, test before and after logon.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Access Tokens" and "How Access Tokens Work" (Win32 security documentation); "Kerberos Authentication Overview"; "Kerberos Policy" (maximum lifetime for user ticket 10 hours); "How Active Directory Replication Topology Works" (intra-site change notification)
- RFC 4120 (Kerberos V5: TGT and service tickets)

## Model and presets

- **Scene:** left, AD: user ana and groups (Prodaja, DL_FS1_Prodaja_Modify), with a change log (who was added or removed, when, on which DC). Middle: ana's logon session on PC-07: the access token as a card (user SID, group SIDs, well-known SIDs, logon time) and, for network access, her Kerberos ticket to FS1 (issued at, group list carried, expires). Right: FS1's folder `Prodaja` with an ACL granting DL_FS1_Prodaja_Modify Modify, and the result of her last access attempt.
- **State:** `t` (clock time), `ad: { members: { [group]: [principal] }, dcs: [{ id, replicatedUpTo }] }`, `session: { user, logonAt, tokenGroups: [], tgt: { issuedAt, groups, expiresAt }, serviceTickets: [{ server, issuedAt, groups }] }`, `fs1: { acl, sessions: [{ user, groups }] }`, `attempt: { at, result }`, `log`.
- **One step:** one event: an AD change, a replication, a logon or logoff, a new ticket, or an access attempt (local or to FS1).
- **Rules:**
  1. At logon the system builds the access token: user SID, all group SIDs (nested groups expanded), well-known SIDs; every process of the session gets a copy (Microsoft, "Access Tokens", "How Access Tokens Work" (check)).
  2. The token doesn't change during the session: a group change in AD has no effect on it.
  3. For network access, the group list travels in the Kerberos ticket (the PAC in the TGT, copied into service tickets); FS1 builds its own token for ana from the service ticket (Microsoft, "Kerberos authentication overview" (check); RFC 4120 for tickets).
  4. A TGT lives 10 h by default and service tickets keep the groups they were issued with (Kerberos policy defaults (check)); getting new tickets (by logging on again, or after purging and re-requesting them) brings in the new groups.
  5. An open SMB session on FS1 keeps the token it was set up with until it is closed (check).
  6. Logon uses whatever the answering DC has: a change made on DC2 is not seen by DC1 until replication (intra-site about 15 s (check)).
  7. Removal works the same way: a user removed from a group keeps access until her token and tickets are renewed.
  8. Tie-break: an access attempt at the same minute as a logon uses the new token.
- **Params:** `change` choice add to Prodaja / remove from Prodaja (default add); `changeOn` choice DC1 / DC2 (default DC1); `action` choice log off and on / renew tickets only / do nothing (default log off and on); `smbOpen` toggle (default off).
- **Presets:**
  1. `add-then-relog` — derived, unchecked: ana logged on 08:00 without Prodaja; 10:00 added to Prodaja; 10:05 open `\\FS1\Prodaja` → denied (token from 08:00); 10:10 log off and on → token has Prodaja and DL_FS1_Prodaja_Modify → 10:11 access OK.
  2. `nested` — derived, unchecked: Prodaja is a member of DL_FS1_Prodaja_Modify; after relogon the token shows both SIDs, the ACL names only the DL group — access OK.
  3. `remove-still-works` — derived, unchecked: 13:00 ana removed from Prodaja; 13:05 access still OK; works until she logs off or her tickets are renewed (TGT from 08:00 valid to 18:00).
  4. `renew-tickets` — derived, unchecked: as 1 but with new tickets instead of relogon → access to FS1 OK (new service ticket), while her local token on PC-07 still lacks the group.
  5. `replication-lag` — derived, unchecked: change on DC2 at 10:00:00, ana logs on against DC1 at 10:00:05 → token without the group; at 10:00:20, after replication, a new logon gets it.
- **Steps:** add-then-relog 6; nested 4; remove-still-works 5; renew-tickets 6; replication-lag 6.
- **Legend:** token and ticket cards with a timestamp and a SID list; SIDs that differ from AD's current membership flagged ≠; access results ✓/✕ with the ACE that decided; DC replication arrows. "Changed" marks the card that was rebuilt or the AD membership that changed in this step.
- **Captions:**
  - hr: "Ana je dodana u grupu Prodaja u 10:00, ali njezin *access token* (pristupni token) nastao je pri prijavi u 08:00 — u njemu te grupe nema."
  - en: "Ana was added to Prodaja at 10:00, but her access token was built at her 08:00 logon, and the group isn't in it."
  - hr: "Ana je uklonjena iz grupe, a pristup i dalje radi: token i Kerberos karta pamte stanje od jutros."
  - en: "Ana was removed from the group and access still works: her token and Kerberos ticket remember this morning's state."
- **Terms:** access token — pristupni token; security identifier (SID) — sigurnosni identifikator; group membership — članstvo u grupi; logon session — sesija prijave; Kerberos ticket — Kerberos karta (ulaznica); nested group — ugniježđena grupa; replication — replikacija.
- **Misconceptions:** "adding a user to a group takes effect at once"; "removing a user cuts access at once"; "the file server asks AD at every access".
- **Out of scope:** privileges and integrity levels in depth, UAC split tokens, claims and Dynamic Access Control, NTLM, Kerberos message details (`win-domain-logon`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-access-token sims/win-access-token` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-access-token/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
