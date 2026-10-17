<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-access-token: spec

One concept: **SIDs and groups are fixed at logon; why you log off after a group change.** The access token and the
Kerberos tickets carry the groups AD had when they were made; a membership change in AD reaches an access check only
through a new token or new tickets.

Task: `docs/tasks/w2/win-access-token.md` (catalogue §4.5.7). Stepper, one event per step. The ACL of the access
check is drawn with kit view K4 (rule table, `kit/ruletable.js`). Every rule, tie-break and number below has a test in
`sim.test.js`; *(check)* marks what is not fully confirmed (`NOTES.md`, "Unchecked").

## Scene

| Thing | Value | Source |
|---|---|---|
| Domain | `QUILLMOOR`, SIDs `S-1-5-21-…-<RID>` | as in `win-ntfs-share-effective` |
| User | `ana`, RID 1104, logged on to `PC-07` at 08:00 against DC1 | task; RID as in `win-ntfs-share-effective` |
| Groups | Domain Users (513, global), Prodaja (1201, global), DL_FS1_Prodaja_Modify (1210, domain local); Prodaja is a member of DL_FS1_Prodaja_Modify | task; RIDs 513/1201 as in `win-ntfs-share-effective`, 1210 chosen here |
| Well-known SIDs | Everyone S-1-1-0, Authenticated Users S-1-5-11, INTERACTIVE S-1-5-4 (logon on PC-07), NETWORK S-1-5-2 (token on FS1) | Microsoft, "Well-known SIDs" |
| DCs | DC1 (answers ana's logon and ticket requests) and DC2, one site | task |
| FS1 | folder `D:\Prodaja` shared as `\\FS1\Prodaja`; ACL: 1 Administrators Full Control, 2 DL_FS1_Prodaja_Modify Modify | task |
| PC-07 | local folder `C:\Ponude`; ACL: 1 Administrators Full Control, 2 Prodaja Modify | added here (the task's "local access attempt") |
| Morning | 08:00 logon: token and TGT (to 18:00); 08:05 a share on FS1 opened: a service ticket for FS1 (to 18:00) | task (logon 08:00); 08:05 chosen here |

ana asks for Modify (she saves a file); every ACL entry grants at least Modify, so an entry decides when its SID is in
the token.

## Params

| Param | Values | Default |
|---|---|---|
| `change` | `add` (10:00, ana not in Prodaja before) / `remove` (13:00, ana in Prodaja before) | `add` |
| `changeOn` | `DC1` / `DC2` | `DC1` |
| `action` | `relog` (log off and on) / `renew` (new tickets only) / `none` | `relog` |
| `smbOpen` | the SMB session to FS1 from 08:05 stays open | off |

## Rules

1. **The token at logon.** The logon builds the access token from what the logon DC has: the user SID, every group
   the user is in directly or through nesting, and the well-known SIDs. Every process of the session has a copy.
   *Microsoft, "Access Tokens"; "How Access Tokens Work" (Windows Server 2003 documentation).*
2. **The token does not change.** A membership change in AD does not touch an existing token; the local access check
   on PC-07 uses the logon token until the next logon. *"How Access Tokens Work": a user added to a group after the
   token was issued must log off and on.*
3. **Over the network the groups travel in the tickets.** The TGT carries the user's groups without the domain local
   ones (the PAC); a service ticket copies the TGT's groups, and the issuing DC adds the domain local groups the user
   or those groups are members of, as it has them then. FS1 builds its own token for ana from the service ticket
   (plus NETWORK, Everyone, Authenticated Users) and does not ask AD. *[MS-KILE] §3.3.5.7 (the PAC copied from the
   TGT), §3.3.5.7.3 "Domain Local Group Membership"; Microsoft, "Kerberos authentication overview in Windows Server"
   (the service needs no DC); RFC 4120 §3.3.3 (authorization data copied from the TGT).*
4. **Ticket lifetimes and renewal.** A TGT lives 10 h; a service ticket 600 min but never past its TGT's end
   (08:05 + 600 min = 18:05 → 18:00). New tickets (old ones discarded, a new TGT asked from DC1) carry the groups DC1
   has now; the logon token is untouched. With nothing done, the client renews the TGT 15 min before its end (17:45,
   new end 03:45, never past logon + 7 days), and a renewal copies the groups from the old TGT: AD is not read. The
   service ticket of 08:05 ends at 18:00 with the old TGT; the next access asks for a new one, from the renewed TGT.
   *Microsoft, "Kerberos Policy" ("Maximum lifetime for user ticket" 10 h, "… for service ticket" 600 min, "… for user
   ticket renewal" 7 days); RFC 4120 §3.3.3 (end time ≤ the TGT's); [MS-KILE] Appendix A note <20> (renewal 15 min
   before expiry), §3.3.5.7 (renewal is a TGS request that copies the PAC).*
5. **An open SMB session keeps its token.** With `smbOpen` the session from 08:05 is used for every access to FS1
   and keeps the token it was set up with: new tickets do not reach it. It ends at logoff. When its ticket's time is
   over (18:00), the next request authenticates the session again with a valid service ticket, which gives it a new
   token. Without `smbOpen` every access sets up its own session from the cached service ticket and closes it after.
   *[MS-SMB2] §3.3.5.5.3 (Session.ExpirationTime from the ticket), §3.3.5.5.2 "Reauthenticating an Existing Session";
   the per-access session is the model's simplification (check).*
6. **Replication.** A change is on the DC it was made on at once and reaches the other DC 15 s later (intra-site
   change notification). ana's logon and her ticket requests go to DC1. *Microsoft, "Modify the default intra-site DC
   replication interval" (15 s to the first partner, 3 s between partners).* With one partner the model uses 15 s.
7. **Removal works the same way.** ana removed from Prodaja keeps access through her token and tickets until they are
   made again (logon, or new tickets); renewals keep it too.
8. **Tie-break T1: same time, fixed order.** Events at the same time apply in the order change, replication, logoff,
   logon, TGT, service ticket, access attempt (then as listed). So an access attempt at the same time as a logon (or a
   new ticket) uses the new token, and a logon at the same second as a change on its DC sees the change.

## Tie-breaks

- **T1** rule 8 (the sort in `plan`).
- **T2** replication is reached at change + 15 s (≥), not before: at +14 s DC1 does not have it.
- **T3** an open SMB session wins over new tickets (no new service ticket is asked for while it is open).
- **T4** a service ticket never outlives its TGT (`min(issued + 600 min, TGT end)`).

## The schedule (one event per step)

T = 10:00 (`add`) or 13:00 (`remove`).

| `changeOn` | `action` | Events | Steps |
|---|---|---|---|
| DC1 | relog | change T · attempt T+5 · logoff T+10 · logon T+10 · ticket T+11 · attempt T+11 | 6 |
| DC1 | renew | change · attempt T+5 · new TGT T+10 · ticket T+11 (not with `smbOpen`) · attempt T+11 · local attempt T+12 | 6 (5) |
| DC1 | none | change · attempt T+5 · TGT renewal 17:45 · ticket 18:05 · attempt 18:05 | 5 |
| DC2 | relog | change T · logoff, logon T+5 s · replication T+15 s · logoff, logon T+20 s · ticket T+1 · attempt T+1 | 8 |
| DC2 | renew | change · new TGT T+5 s · replication T+15 s · new TGT T+20 s · ticket T+1 (not with `smbOpen`) · attempt T+1 · local T+2 | 7 (6) |
| DC2 | none | change · replication T+15 s · attempt T+5 · renewal 17:45 · ticket 18:05 · attempt 18:05 | 6 |

With a change on DC1 the replication to DC2 is not a step (ana never asks DC2); the DC2 box shows it at T+15 s.

## Presets and expected results

| Preset | Params | Steps | Expected |
|---|---|---|---|
| `add-then-relog` | defaults | 6 | 10:05 ✕ (ticket of 08:05: Domain Users); 10:10 token Domain Users, Prodaja, DL_FS1_Prodaja_Modify; 10:11 ticket with all three; ✓ by entry 2 |
| `nested` | defaults, opens at step 2 | 4 left | the ACL names only DL_FS1_Prodaja_Modify; after the relogon the token has Prodaja and the DL group (nesting) → ✓ |
| `remove-still-works` | remove, none | 5 | 13:05 ✓; 17:45 renewal (to 03:45) still Domain Users, Prodaja; 18:05 ticket + DL; ✓ |
| `renew-tickets` | renew | 6 | 10:10 TGT Domain Users, Prodaja; 10:11 ticket + DL; FS1 ✓; 10:12 `C:\Ponude` ✕ (logon token of 08:00) |
| `replication-lag` | DC2 | 8 | 10:00:05 token without Prodaja (DC1 not replicated); 10:00:15 replication; 10:00:20 token with it; 10:01 ✓ |

`sim.json` `steps` = 6 (defaults). Maximum over all 24 param sets: 8. An independent hand model (Python) of all 24
param sets gives the same step counts and the same access results in order.

## Out of scope

Privileges and integrity levels, UAC split tokens (`win-uac`), claims and Dynamic Access Control, NTLM, Kerberos
messages (`win-kerberos`, `win-domain-logon`), deny entries and share plus NTFS (`win-ntfs-share-effective`),
changes to the DL group itself (a new service ticket alone would pick those up, rule 3).
