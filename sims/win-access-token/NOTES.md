<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-access-token: notes

New stepper (task `docs/tasks/w2/win-access-token.md`, catalogue `win-access-token`, §4.5.7, wave 2b). Rules,
tie-breaks and expected numbers: `SPEC.md`. The ACL is drawn with kit view **K4, rule table** (`kit/ruletable.js`,
mode `first`), so the task's "until K4 exists, draw your own" does not apply.

## Decisions

- **Layout.** Three columns. Left, AD: DC1 ("answers ana") and DC2 ("other DC"), each with the members of Prodaja and
  DL_FS1_Prodaja_Modify, the replication arrow between them (dotted: no change; dashed: waiting; solid with the time:
  replicated) and the change log. Middle, PC-07: the clock, the access token (thick left bar: user, group SIDs, "via
  Prodaja" for the nested group, well-known SIDs, the logon time and DC), the TGT and the service ticket for FS1
  (dashed left edge, like a ticket stub: issued, valid to, group chips). Right, the access check of the last attempt:
  the target, the ACL as K4 with ana's chip at the deciding row (or the implicit "no entry matches"), the token the
  check used (the ticket, the open SMB session or the logon token) and the SMB session on FS1.
- **≠** marks a group in a token or ticket that AD no longer has (dashed chip with ≠) and a group AD has that the
  card lacks (a muted dashed ghost with ≠). "AD" is the newest membership (where the change was made); the TGT is
  compared with the groups a TGT would carry (no domain local ones).
- **The model is a schedule.** `plan(params)` lists the events with their times; a stable sort by time and then by a
  fixed order of kinds is the task's tie-break (rule 8). `step(n)` applies event n. Replication is a function of the
  clock (`reached`); it is a step of its own only when it reaches DC1, the DC ana uses.
- **Morning state** (step 0, 08:05): ana logged on at 08:00, then opened a share on FS1 at 08:05, so a service
  ticket for FS1 is cached (and, with `smbOpen`, the session is open). The first attempt on Prodaja uses that ticket.
  A service ticket and an SMB session belong to the server, not to one share.
- **The local attempt** needs a local resource: `C:\Ponude` on PC-07 with Prodaja Modify. It is tried only after
  "new tickets only", where it shows that the logon token did not change.
- **Domain local groups are added to service tickets, not to the TGT** ([MS-KILE] §3.3.5.7.3). The TGT card shows
  Domain Users and Prodaja; the service ticket and the token add DL_FS1_Prodaja_Modify. The task's rule 3 simplified
  this to "copied into service tickets"; the outcomes are the same here because the change is always ana ↔ Prodaja.
- **Names and numbers** follow `win-ntfs-share-effective` (domain QUILLMOOR, `S-1-5-21-…`, ana 1104, Prodaja 1201,
  Domain Users 513, `\\FS1\Prodaja`); DL_FS1_Prodaja_Modify gets RID 1210. Terms follow `win-kerberos` ("karta za
  uslugu"); permission names stay the Windows terms (Modify, Full Control), as in `win-ntfs-share-effective`.
- **Reusable model.** `expand`, `tgtGroups`, `withDomainLocal`, `serviceTicket`, `renewTgt`, `check`, `membersAt` are
  pure and string-free, should `win-uac` (soft dependency in the tasks list) want the token.

## Deviations from the task

- **"Do nothing" does not end at 18:00.** The task's `remove-still-works` says access works "until she logs off or
  her tickets are renewed (TGT from 08:00 valid to 18:00)". Windows renews the TGT 15 min before it ends, and a
  renewal copies the PAC ([MS-KILE] note <20>, §3.3.5.7), so the morning groups go on past 18:00 (up to 7 days, the
  renewal limit). The preset shows this: 13:00 removed, 13:05 ✓, 17:45 renewal, 18:05 new service ticket, 18:05 still
  ✓ (5 steps, as the task says). "Renewed" in the task's sense (new tickets) is the `renew` action.
- **`replication-lag` has 8 steps (task 6):** change, logoff, logon (old groups), replication, logoff, logon (new
  groups), then the service ticket and the access, so the run ends with the result like the others. Logoff and logon
  are separate steps everywhere, as the task's "one step: one event … a logon or logoff" says.
- **`nested` is `add-then-relog` opened at step 2** (4 steps left, as the task says). The task's nested story (Prodaja
  in DL_FS1_Prodaja_Modify, the ACL naming only the DL group, both SIDs in the token after the relogon) is part of
  every run; the preset starts where the relogon is next, with its own caption.
- **With `changeOn` DC2 and an action**, the action happens 5 s after the change (before replication) and again 20 s
  after it; there is no test at T+5 min. That is the task's `replication-lag` timing.
- **`smbOpen`** decides whether the 08:05 session is still open. Without it every access sets up and closes its own
  session (a simplification; an idle session really closes after some minutes).
- **Captions:** the task's two captions are used word for word for the change step of `add` on DC1 and for the
  13:05 attempt of `remove`; the others are written in the same style.

## Sources

Checked in this session through Microsoft Learn (a research subagent read the pages):

- Microsoft, "Access Tokens" (Win32): the system produces an access token at logon; every process run for the user
  has a copy; user SID and group SIDs.
- Microsoft, "How Access Tokens Work" (Windows Server 2003 documentation, archived): the primary token's contents;
  "If you add a user to a group after the user's access token has been issued … the user must log off and then log on
  again".
- Microsoft, "Kerberos authentication overview in Windows Server" (the task's "Kerberos Authentication Overview"): the
  service authenticates the client without contacting a DC.
- [MS-KILE] §3.3.5.7 "TGS Exchange" (the PAC copied from the TGT into the new ticket), §3.3.5.7.3 "Domain Local
  Group Membership" (added for every service ticket), Appendix A note <20> (Windows renews TGTs 15 min before expiry).
- Microsoft, "Kerberos Policy" and its settings (archived Windows 10 security policy pages): maximum lifetime for
  user ticket 10 h, for service ticket 600 min, for user ticket renewal 7 days.
- RFC 4120 §1 (TGT, service tickets), §3.3.3 (end time no later than the TGT's; authorization data copied from the
  TGT or renewable ticket), §5.3.
- Microsoft, "Modify the default intra-site DC replication interval": first partner notified after 15 s, then 3 s
  between partners. The task's "How Active Directory Replication Topology Works" does not give these numbers.
- [MS-SMB2] §3.3.5.5.3 (Session.ExpirationTime from the authentication), §3.3.5.2.9 (STATUS_NETWORK_SESSION_EXPIRED),
  §3.3.5.5.2 "Reauthenticating an Existing Session".
- Microsoft, "Well-known SIDs" (Win32) and "Security identifiers": S-1-1-0, S-1-5-2, S-1-5-4, S-1-5-11, RID 513.

## Unchecked *(check)*

- Rule 4: a TGT whose renewal limit (7 days) is reached is replaced by a new one from the client's stored credentials
  (observed behaviour, not found in Microsoft's documentation). Not reached in any run (the runs end the same day).
- Rule 5: each access without `smbOpen` sets up and closes its own session (a model simplification).
- Rule 6: one replication partner, so 15 s; with more partners the later ones follow 3 s apart.
- The page's 18:05 re-authentication of an open SMB session is the [MS-SMB2] mechanism; the client's exact timing is
  not modelled.
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| access token | pristupni token | task; also `win-ntfs-share-effective` |
| security identifier (SID) | sigurnosni identifikator (SID) | task; also `win-ntfs-share-effective` |
| service ticket | karta za uslugu | `win-kerberos` *(check)* |
| Kerberos ticket | Kerberos karta | task ("Kerberos karta (ulaznica)") |
| logon session | sesija prijave | task |
| group membership | članstvo u grupi | task |
| nested group | ugniježđena grupa | task |
| replication | replikacija | task |
| domain local group | domenska lokalna grupa | simdeck *(check)* |
| ticket renewal | obnova (TGT-a) | simdeck *(check)* |

`access control list` (popis kontrole pristupa) is used from the glossary, as `[[access control list]]`.

## Checks

- Numbers: an independent Python hand model of all 24 param sets (step counts and the access results in order)
  before the page was written, and again after the renewal correction; the model agrees on every one.
- Tests: 25, every rule and tie-break, then the template's generic block.
- Browser: a sweep of nine states × two languages at 1920×1080 (no page scroll, nothing outside the stage, no box
  wider than itself, no `undefined`/`NaN`/`null`/unfilled placeholder, no console errors), and the gate's screenshots
  (light, dark, grayscale, 375×812, both languages). Found and fixed: the K4 mark column cut off (columns rebalanced,
  `stickyMark`), the long group name breaking mid-word (it breaks after underscores now), two notes run together in
  the token card, a Croatian slip ("grupe iz AD-u sada"), the Croatian panel 16 px too tall (the change options are now
  "dodaj Anu" / "ukloni Anu" under "Grupa Prodaja u AD-u"). A stage font of 1.04–1.1 rem overflowed; it stays 1 rem.

## Shared requests

- **Kit legend swatches** `tok` (a box with a thick left bar), `tkt` (a box with a dashed left edge), `neq` (a dashed
  box with ≠) and `repl` (a vertical bar): the page defines them in its CSS.
- **Glossary:** the term pairs above.

## Fresh review

A separate agent read the task, SPEC.md, the model, the tests, the strings and the page, made 35 single mutations
of `sim.js` and drove the page (all 5 presets and all 24 param sets, every step, both languages, 1920×1080 and
375×812). It found no mismatch between the model and SPEC.md, no console errors and no scrolling. 27 mutations were
killed; of the 8 survivors, 2 were real gaps, now tested and killed (a new TGT before replication must carry what DC1
has, not the newest membership; with `smbOpen` the access after a relogon opens a session that stays open), 5 are
equivalent in every reachable state (domain local lookup on the base membership, session expiry at exactly 18:00,
re-authentication keeping the groups, the order of listed events of one kind, last match instead of first in an ACL
whose first entry never matches), and 1 expands only one level of nesting, which is all the scene has (removing
expansion is killed). Fixed from it as well:
- the start caption of `remove` said the TGT carries DL_FS1_Prodaja_Modify (it carries Prodaja; rule 3);
- the logoff caption said the SMB session closes when none was open (now only when one was);
- "AD is not read" on a renewal overstated it (the KDC checks the account; the groups are copied, not re-read);
- "logs on at DC1" is now "logs on to PC-07, and DC1 answers";
- the nested caption appeared for a URL that changes the nested preset's params (now only at its denied attempt);
- Croatian: the group name after a preposition takes the noun ("u grupu Prodaja", "bez grupe Prodaja"), "dodaje",
  "sastavi", "DC2 javlja DC1-u", the name capitalised in prose (Ana, Anu, Anin); the term rule for *TGT*, *well-known*
  SIDs, *domain local* groups, *site*, ACL; English "grants", "requested from", "valid until 03:45 tomorrow";
- SIDs break only after hyphens on a phone; the start caption names the 08:05 share (`\\FS1\Javno`) so it does not
  read against "Ana has not opened the Prodaja folder yet".
Not changed: the task's two captions (`capChangeAdd`, `capProbeOk`) keep their wording, without the "n. time:"
prefix the other captions have; on the Croatian page the stage labels (pristupni token, karta za uslugu) are Croatian,
and the captions use the English term in italics after its first mention.

## Time

Start 2026-10-17 10:07; model, tests and hand model by 10:15; renewal and domain local correction from the source
check by 10:19; page and gate passing by 10:26; review and its fixes, status ready by 10:38: about 31 min.
