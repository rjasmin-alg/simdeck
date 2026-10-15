<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-dynamic-update: notes

New stepper (task `docs/tasks/w2/win-dns-dynamic-update.md`, catalogue `win-dns-dynamic-update`, §4.5.3 and §5.21,
wave 2b). Drawn with kit view **K1, message sequence chart** (`kit/sequence.js`) beside the zone's record table.
Rules and expected numbers: `SPEC.md`.

## Decisions

- **Layout.** Left: the zone `corp.example` (AD-integrated) with its *Dynamic updates* setting as three tags (the
  active one inverted), the record table (name, type, address, owner, timestamp, a mark for this step), the AD
  computer accounts, and the message card (what this step carries, or DC1's check, line by line). Right: K1 with two
  lanes, the client and DC1. The task puts the setting "top"; it heads the zone box, where it is read with the
  table.
- **Owner chip.** An account the SID resolves to: a solid chip with a small computer mark, `CORP\PC1$` and the
  shortened SID (`S-…-1104`). A SID no account has any more (the rebuild): a dashed chip with the bare SID and "no
  account", which is how an ACL shows a deleted principal. A record created unsigned: a dotted "nobody" chip.
  Ownership is shown as a SID throughout, because the concept is "the SID, not the name".
- **One step = one message, a query and its answer count as one.** The SOA query and its answer, and the TKEY
  exchange, are two rows in one step; the UPDATE and its answer are separate steps (the answer is the point). That
  gives the task's join = 6 (SOA, UPDATE, REFUSED, TKEY, signed UPDATE, answer) and hijack = 3.
- **Unsigned / signed / answer** are told apart by shape: a plain arrow, K1's `lock` (double line and padlock on
  the chip), and a dashed arrow; the answer's field is ✓ or ✕ and its chip is the return code.
- **Marks in the table** pair a symbol and a word with the highlight: `+ new`, `✓ changed`, `− deleted` (row struck
  through, shown for the step it goes), `✕ refused` (row with a thick border), `→ in the message` (dashed border,
  at the UPDATE steps, not highlighted).
- **The admin's fix is a toggle**, "Then the admin deletes the stale record", not a button: the model is a pure
  replay, so the fix must be a param (it is also kept in the URL). It is disabled, with the reason as its hint,
  unless the run ends in a refusal by ownership (SPEC T5).
- **Times.** Every action happens on day 3 at 10:00:00 and each step adds a second; the admin acts at 10:30. The
  chart's time column shows the step's clock; the table shows "day d hh:mm".
- **Names and addresses** are the task's (`corp.example`, `DC1`, `PC1`, `PC2`, `PC2-NEW`, `fs1`, `10.0.0.51`,
  `10.0.1.23`, `10.0.0.77`, `10.0.0.66`). Added: `dc1` 10.0.0.10 and `fs1` 10.0.0.20 as standing records, the RIDs
  (DC1 1000, FS1 1103, PC1 1104, PC2 1105, the new PC1 1131), and the domain SID `S-1-5-21-3623811015-3361044348-
  30300820` (Microsoft's documentation example).
- **Reusable model.** `zoneAccepts`, `mayWrite` and `applyUpdate` are pure, string-free functions over records
  `{ name, type, data, owner, timestamp, static }` (the task's note for the coordinator), ready to move to
  `models/` for `win-dhcp-dns-update` and `win-dns-scavenging` (catalogue §5.21).

## Deviations from the task

- **No refresh interval on the page** (rule 1). The task's 24 h matches the *Registration refresh interval* policy
  text (`DefaultRegistrationRefreshInterval` 86400 s), but "Understanding Dynamic Update" (Windows Server 2008) says
  "By default, computers send a refresh once every seven days." The sources disagree *(check)*, so the explanation
  says "periodically".
- **Step counts: move 6 (task 4), rename 6 (task 5), the admin fix + 7 (task + 2; rebuild-new-sid 13 in all).**
  The task's numbers would need the client to skip the unsigned try on later registrations; the documented default
  is unsigned first every time (rule 3), so every registration under "Secure only" is the same 6 messages. No
  documented client memory of a zone's setting was found. The maximum, 13, is within the 20-step limit.
- **Rename removes the old name** (rule 10). The task says "removal of the old name is best effort, the old record
  may remain until scavenged". Microsoft's example (`oldhost` → `newhost`) sends one update that adds the new name
  and removes the old, and the renamed account keeps its SID, so it owns `pc2`: the page deletes it and the caption
  says the old record would stay only if that update never reached the server.
- **The SOA query asks for the name being registered**, so the rogue laptop asks for `fs1.corp.example`.
- **The task's button `deleteRecord` is the toggle `adminDelete`** (above).
- **Title** "DNS: secure dynamic update" (task: "Secure dynamic updates"), so it lists next to the other DNS pages.

## Sources

- Task file, model and presets.
- Microsoft Learn (archived), "Understanding Dynamic Update", Windows Server 2008 (cc771255): the events that send
  an update (address change, lease renewal, `ipconfig /registerdns`, startup, DC promotion), refresh every 7 days,
  SOA query then update to the primary, any DC loading an AD-integrated zone answers as primary, the rename example,
  "DNS update security is available only for zones that are integrated into AD DS", "DNS clients attempt to use
  unsecured dynamic update first. If an unsecured update is refused, clients try to use secure update.", "allow all
  dynamic updates, which permits all updates to be accepted".
- RFC 2136 (DNS UPDATE: §3.4 prescan and all-or-nothing, §4 the client finds the primary via SOA), RFC 2930 (TKEY),
  RFC 3645 (GSS-TSIG).
- Not found online in this session: the Microsoft pages "How dynamic update works", "Secure dynamic update" and
  "Configure DNS dynamic update" under those exact titles *(check)*.

## Checks

- Numbers: an independent Python hand model of all 36 combinations (3 settings × 6 actions × fix on/off: steps and
  final records) before the model was written; the model agrees on every one (`sim.test.js` "presets").
- Rule tests broken on purpose, 21 mutations one at a time (33 after the review, below) (update not atomic, owner by name, case-sensitive names,
  "None" taking signed updates, "Nonsecure and secure" needing a signature, the fix always applying, SOA of the
  client's own name, members skipping the unsigned try, new names without an owner, unowned records closed, unsigned
  updates checked against the ACL, unsigned updates taking ownership, timestamp not refreshed, rename without the
  delete, the rebuild keeping the old SID, the admin not deleting, no registration after the admin, a workgroup
  client negotiating TKEY, a member giving up under "None", the admin's time, records not sorted): every one fails a
  test.
- Browser sweep: 422 pages (both languages × every setting, action, fix and step) at 1920×1080: no page scroll, no
  clipping in the zone column, no `undefined`/`NaN`/placeholders, no empty caption, no console errors. Found and
  fixed on the way: a placeholder used twice in one caption appeared only once (the node was moved; captions now go
  through `rich()`, which clones repeats); the chart fields of the rename and the SOA query ran over DC1's lifeline
  (now the names only); the record table ran off the side at 375×812 (each record is a small card there).

## Unchecked *(check)*

- Rule 5: the zone's default ACL gives Authenticated Users *Create all child objects*, which is what lets any
  computer create a new name.
- Rule 1: the default refresh interval, 24 h or 7 days (above).
- Rule 6/7: a record created by an unsigned update has no owner and may be taken by a signed one; an unsigned
  update in a "Nonsecure and secure" zone may overwrite a name created by a secure update (the `nonsecure-hijack`
  preset depends on it), and it leaves that record's ACL as it was.
- Rule 8: under "None" the server still answers TKEY, so the member's signed try is refused by the zone setting.
- Rule 11: resetting the old computer account (rather than deleting it) keeps the SID and the rebuilt machine can
  update its record.
- T1: Windows applies the per-record ACL checks all or nothing, as RFC 2136 requires of an update.
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| dynamic update | dinamičko ažuriranje | task |
| secure dynamic update | sigurno dinamičko ažuriranje | task |
| computer account | račun računala | task |
| record owner | vlasnik zapisa (u ACL-u) | task (UL ch19 uses "vlasnik zapisa" for the owner *name*) |
| security context | sigurnosni kontekst | simdeck *(check)* |
| REFUSED | odbijeno | task |

`access control list` (popis kontrole pristupa) is used from the glossary, as `[[access control list]]` in the
explanation. The task's "popis za kontrolu pristupa" differs slightly from the glossary's; the glossary wins.

## Known limits

- At 375×812 the signed UPDATE row of the rename ("🔒 UPDATE +pc2-new") runs about 7 px past the chart's edge
  and is clipped there by the kit (no sideways scroll). The address and the deleted name are already left out of
  the chart's fields on a phone; the message card has the whole update.
- With the admin's fix on, switching the zone to "None" leaves the toggle on but disabled; it adds no steps there
  (T5).

## Shared requests

- **K1:** a row kind for a two-way exchange (query and answer as one step), and arrowhead styles (open for
  unsigned, closed for signed) as the task's legend asks; the page uses two rows per step and `lock` instead.
- **Kit legend swatches** `signed` (double line), `owner` (chip with a computer mark), `sid` (dashed chip), `ok`
  (✓ in a circle) and `no` (✕ in a filled square): the page defines them in its CSS.
- **models/:** promote `zoneAccepts`, `mayWrite`, `applyUpdate` (sim.js) as the record-lifecycle model for
  `win-dhcp-dns-update` and `win-dns-scavenging`.

## Fresh review

A separate agent read SPEC.md, sim.js and the page against the task file and Microsoft's "Understanding Dynamic
Update", broke rules on purpose (34 mutations) and drove the page (336 states, both languages, 1920×1080 and
375×812). It confirmed the model, the sources and the step-count deviations. Fixed from it:
- the record table overflowed its box at 1920×1080 in the rename (the timestamp and the mark now wrap);
- the 7-day refresh was presented as settled, but the sources disagree (now "periodically", *(check)*);
- the start captions and the SOA caption claimed updates are taken under "None" (start captions say "tries to
  write" and add "dynamic updates are off" under None; SOA: "the server to send updates to");
- the refusal caption names both SIDs (`S-…-1104` vs `S-…-1131`), and the "new owner" caption the SID;
- a member's unsigned overwrite of a record owned by another SID now says Secure only would refuse it again;
- Croatian: "nijedna" (agrees with "ažuriranja"), the TKEY caption's case, "dan 0, 07:00";
- the English summary had a clause the Croatian lacked (dropped);
- the unused `fqdn` field went, and `was` became an explicit `renamedFrom`;
- the chart's UPDATE field on a phone (names only);
- tests for its 12 meaningful surviving mutations (None's refusal reason, `fixPossible` with the toggle on, ownership
  after an unsigned member update, lower-cased new names, unsigned writes to unowned records, the timestamp of an
  unsigned write, the admin's time, the seed records, the client flags). The mutation script now runs 33 mutations
  and all of them fail a test. Its other 7 survivors are equivalent in every reachable state.
- Its "NOTES.md missing" was written before this file existed.

## Time

Start 2026-10-15 21:34; built, swept and mutation-tested by 21:52; review fixed, gate passing and status ready
22:07: about 33 min.
