<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-dynamic-update: specification

One concept: **clients register their own records; record ownership and why a rebuilt or renamed machine can't
update** (task `docs/tasks/w2/win-dns-dynamic-update.md`, catalogue §4.5.3, §5.21). The student steps one client's
registration in the AD-integrated zone `corp.example`: join, move, rebuild, rename, or a workgroup laptop claiming a
server's name, under the zone's three *Dynamic updates* settings.

## Scene

- **Top of the zone column:** the zone `corp.example`, AD-integrated, and its *Dynamic updates* setting (None /
  Nonsecure and secure / Secure only).
- **Zone column:** the record table: name, type, data, **owner** (the security principal on the record's ACL, shown
  as the computer account's name, or as a bare SID when no account has that SID any more), timestamp. Under it the
  AD computer accounts with their SIDs, and the **server's check** of the current update (what it asked, the answer).
- **Chart (kit view K1):** two lanes, the client (left) and `DC1` (right, DNS server and domain controller). One row
  per message; an unsigned update is a plain arrow, a signed one carries the kit's lock (double line, padlock on the
  chip); answers are dashed. The admin's action is a note on DC1's lane.

## State

```
zone:    { name: 'corp.example', updates: 'none' | 'nonsecureAndSecure' | 'secureOnly',
           records: [{ name, type: 'A', data, owner: sid | null, timestamp, static: false }] }
ad:      { computers: [{ name, sid }] }
clients: [{ id, name, ip, sid | null, domainMember,              (one client: the one this action is about)
            reset?, oldSid?, renamedFrom? }]                         (flags the page reads: account reset, the
                                                                      deleted account's SID, the old name)
update:  { adds: [{ name, data }], deletes: [name] }                 (what the client asks for)
msgs:    [ one entry per step ]                                      (log of the run)
phase, t (seconds since day 0 00:00), result, check
```

Records are kept sorted by name. Names are compared case-insensitively (DNS, RFC 1034 §3.1): `PC1` registers `pc1`.

## One step

One message of the registration, or one admin action:

| Phase | Row(s) in the chart | Notes |
|---|---|---|
| `soa` | SOA query and its answer (two rows, one step) | the client learns which server takes the update |
| `unsigned` | UPDATE, unsigned | |
| `answer1` | NOERROR or REFUSED | with a workgroup client after REFUSED, a note "no account, gives up" in the same step |
| `tkey` | TKEY query and answer (two rows, one step) | GSS-TSIG with the computer account (Kerberos, not shown) |
| `signed` | UPDATE, signed | |
| `answer2` | NOERROR or REFUSED | |
| `admin` | note on DC1: the admin deletes the stale record | only with `adminDelete`, after a refusal by ownership |

After `admin` the client registers again from `soa` (a restart or a manual re-registration).

## Rules

1. **When a client registers.** A Windows client registers its A record at startup, when an address is added or
   changed, on a DHCP lease renewal, on a manual re-registration, and refreshes it periodically. The default refresh
   interval is given differently by Microsoft's documents: "once every seven days" ("Understanding Dynamic Update",
   Windows Server 2008) and every 24 hours (the *Registration refresh interval* policy text,
   `DefaultRegistrationRefreshInterval` 86400 s) *(check)*. The page says "periodically" and names no interval; no
   preset depends on it. A statically configured client also registers its PTR record; DHCP clients' PTR records
   are out of scope (`win-dhcp-dns-update`). The page shows one registration per run; the triggers are named in the
   captions.
2. **Which server.** The client asks for the SOA of the name it registers (its own FQDN; the laptop asks for
   `fs1.corp.example`); for an AD-integrated zone any DNS server loading
   the zone answers and names itself as the primary, so any writable DC takes the update (Microsoft, same document,
   step 2; RFC 2136 §4). Here that is `DC1`.
3. **Unsigned first.** The client first sends an unsigned UPDATE. Only if it is refused does it negotiate a
   security context (TKEY, RFC 2930, with GSS-TSIG, RFC 3645) using its computer account, and send the update again,
   signed (Microsoft, "Understanding Dynamic Update": "DNS clients attempt to use unsecured dynamic update first. If
   an unsecured update is refused, clients try to use secure update."). Every registration starts unsigned again
   (the default; no memory of the zone's setting between registrations is modelled).
4. **"Secure only" exists only for AD-integrated zones** (Microsoft, same document: "DNS update security is
   available only for zones that are integrated into AD DS"). The zone here is AD-integrated; the explanation
   says so.
5. **A new name.** A signed update for a name that has no record is accepted: any authenticated computer may create
   it, and the sender's account becomes the record's owner with full control (zone ACL: Authenticated Users,
   *Create all child objects* *(check)*).
6. **An existing name.** A signed update to a name that has records succeeds only if the sender may write them: the
   record's owner (the same SID). Otherwise REFUSED and the old data stays. Groups with rights on the record
   (DnsUpdateProxy, admins) are out of scope. A record with no owner (created unsigned) may be written by anyone
   *(check)*.
7. **"Nonsecure and secure":** an unsigned update from anyone is accepted, for any name, new or existing; the ACL is
   not consulted (RFC 2136 has no authentication; Microsoft: "allow all dynamic updates, which permits all updates
   to be accepted"). That an unsigned update may overwrite a name created by a secure update (the hijack of `fs1`)
   is not stated in a source found *(check)*. A record created this way has no owner; an existing record keeps its
   owner *(check)*, so a member that overwrote a record owned by another SID would be refused again under "Secure
   only" (the caption says so). Since the unsigned try succeeds, the client never signs (rule 3).
8. **"None":** every update is REFUSED, unsigned and signed; records are added by hand only. A domain member still
   tries secure after the refusal (rule 3) and is refused again.
9. **An address change by the same machine** is an update by the owner: accepted, the data and the timestamp
   change.
10. **Rename.** Renaming a computer renames its account; the SID stays. After the restart one update adds the new
    name and removes the old one (Microsoft, "Understanding Dynamic Update", example `oldhost` → `newhost`). The
    sender owns the old record (same SID), so both changes are accepted. If that update never reaches the server,
    the old record stays until scavenged (`win-dns-scavenging`); the caption says so.
11. **Rebuild.** A machine rebuilt with the same name and a **new** computer account (the old one deleted, a new
    SID) is not the owner of the old record → REFUSED, the name still leads to the old address. Resetting the old
    account instead of deleting it keeps the SID, and the update succeeds *(check)*. The record's owner then shows
    as a bare SID: no account has it any more.
12. **The admin's fix.** The admin deletes the stale record; the next registration finds no record and creates it,
    owned by the new account (rule 5).
13. **A workgroup client** (no computer account) cannot negotiate a security context: after REFUSED it gives up and
    nothing changes.

### Tie-breaks

- **T1: an update is all or nothing** (RFC 2136 §3.4.2.6 prescan, §3.7 atomicity): if the sender may not write one
  name in the update, the whole update is REFUSED and no record changes. A rename that would delete a record owned
  by someone else changes nothing *(check: Windows per-record ACL checks)*.
- **T2: ownership is the SID, not the name.** `CORP\PC1$` with SID …-1131 is not the owner of a record owned by
  …-1104, though both are called PC1; the renamed `PC2-NEW$` (…-1105) still owns `pc2`.
- **T3: names compare case-insensitively** (`PC2-NEW` updates `pc2-new`).
- **T4: "None" refuses the owner too**; "Nonsecure and secure" accepts the non-owner too, at the first unsigned try.
- **T5: the admin fix applies only after a refusal by ownership** (rule 11 under "Secure only"). After a refusal by
  the zone setting ("None") or of a workgroup client, deleting the record would not help: the toggle is disabled
  and adds no steps.

## Times

`t` is seconds since day 0 00:00, shown as "day d, hh:mm" (records) and "hh:mm:ss" (chart). Every action happens
on day 3 at 10:00:00; each step adds 1 s. The admin's deletion is at 10:30:00 and the registration after it starts
at 10:30:01. Records already in the zone:

| Record | Data | Owner | Timestamp | In actions |
|---|---|---|---|---|
| `dc1` | 10.0.0.10 | `DC1$` …-1000 | day 0 07:00 | all |
| `fs1` | 10.0.0.20 | `FS1$` …-1103 | day 0 08:00 | all |
| `pc1` | 10.0.0.51 | `PC1$` …-1104 | day 2 09:15 | move, both rebuilds |
| `pc2` | 10.0.0.52 | `PC2$` …-1105 | day 1 09:00 | rename |

## Params

| Param | Values | Default |
|---|---|---|
| `updates` | `none`, `nonsecureAndSecure`, `secureOnly` | `secureOnly` |
| `action` | `join`, `move`, `rename`, `rebuildNew`, `rebuildReset`, `rogue` | `join` |
| `adminDelete` | then the admin deletes the stale record (rule 12; only after a refusal by ownership) | off |

Actions (the client, its account and what it registers):

| Action | Client | Account (SID) | Update |
|---|---|---|---|
| `join` | PC1, DHCP 10.0.0.51 | new `PC1$` …-1104 | add `pc1` 10.0.0.51 |
| `move` | PC1, now 10.0.1.23 | `PC1$` …-1104 | add `pc1` 10.0.1.23 (replaces) |
| `rename` | PC2 → PC2-NEW, 10.0.0.52 | `PC2-NEW$` …-1105 (renamed) | add `pc2-new` 10.0.0.52, delete `pc2` |
| `rebuildNew` | PC1 rebuilt, 10.0.0.77 | old …-1104 deleted, new `PC1$` …-1131 | add `pc1` 10.0.0.77 |
| `rebuildReset` | PC1 rebuilt, 10.0.0.77 | `PC1$` …-1104, reset | add `pc1` 10.0.0.77 |
| `rogue` | LAPTOP, workgroup, 10.0.0.66 | none | add `fs1` 10.0.0.66 (claims the file server's name) |

"Add" replaces the name's A data (the client's update deletes its old A records for the name and adds the current
one).

## Steps and presets

Paths: accepted unsigned = 3 (SOA, UPDATE, NOERROR); refused unsigned, workgroup = 3 (… REFUSED + note);
refused unsigned, member = 6 (… REFUSED, TKEY, signed UPDATE, answer). The fix adds 1 + a new registration (6 under
"Secure only").

| Preset | Params | Path | Steps |
|---|---|---|---|
| `join` (derived, unchecked) | defaults | unsigned REFUSED, TKEY, signed NOERROR; `pc1` 10.0.0.51, owner `PC1$` | 6 |
| `move` | action move | as join; `pc1` → 10.0.1.23 | 6 |
| `rebuild-new-sid` | action rebuildNew | signed REFUSED; `pc1` stays 10.0.0.51 | 6 (13 with `adminDelete`) |
| `rebuild-reset` | action rebuildReset | signed NOERROR; `pc1` → 10.0.0.77 | 6 |
| `rename` | action rename | signed NOERROR; `pc2-new` added, `pc2` removed | 6 |
| `nonsecure-hijack` | updates nonsecureAndSecure, action rogue | unsigned NOERROR; `fs1` → 10.0.0.66 | 3 |

All 36 combinations: "Nonsecure and secure" 3 for every action; "Secure only" 6, rogue 3, rebuildNew with the fix
13; "None" 6, rogue 3. Maximum 13. Default 6 = `sim.json` `steps`.

The task gives move 4, rename 5 and the fix +2: those counts assume the client skips the unsigned try or reuses a
context; rule 3 (the documented default) makes every registration the same 6 messages (NOTES.md, "Deviations").

## Legend

Unsigned update (plain arrow), signed update (double line with a padlock), answer (dashed), owner chip (a computer
mark and the account), a bare SID (dashed chip: no such account), ✓ accepted / ✕ REFUSED, "this step" (highlight).

## Out of scope

DHCP registering for clients (`win-dhcp-dns-update`), aging and scavenging (`win-dns-scavenging`), PTR zones,
TSIG with shared keys, Kerberos inside GSS-TSIG (`win-kerberos`), the NS-query fallback when the first server
refuses, groups with rights on records (DnsUpdateProxy).
