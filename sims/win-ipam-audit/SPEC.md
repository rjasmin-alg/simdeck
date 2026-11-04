<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ipam-audit: spec

Task `docs/tasks/w3/win-ipam-audit.md`, catalogue `win-ipam-audit` (§4.5.5). One concept: **correlating lease and
logon events to find a machine and a user**. The student answers an incident question from the audit trail.

## The question and the evidence

"Who had `10.0.40.57` on Monday 28 Sep at T?", T one of 09:10, 14:32 (default), 17:55. Times are minutes after
midnight on 28 Sep (28 Sep is a Monday in the scenario, so the DHCP server's file for it is `DhcpSrvLog-Mon.log`).

- **Lease events** for the address, from the DHCP server DHCP1: `{ t, id: new | renew | release | expire, ip, mac,
  host }`. Audit-log IDs shown on the page: 10 new lease, 11 renew, 12 release, 17 expired *(check: 16 is "deleted",
  17 and 18 "expired" with DNS records kept / deleted; Microsoft, "Analyze DHCP Server Log Files")*.
- **Logon events** from the address, from the DCs DC1 and DC2: `{ t, user, clientIp, dc, kind: tgt | logoff }`. A TGT
  request is Security event 4768, "A Kerberos authentication ticket (TGT) was requested", with the account name and
  the client address *(check)*.
- **DNS now**: `{ name, ip }`, the A record as it is when the question is asked.

## Rules

1. **The lease covering T.** Read the address's events back from T, newest first. Events after T are passed over. The
   first event at or before T decides: new or renew → that lease covers T; release or expire → the address was free at
   T; nothing at or before T → the log does not say. (Task rule 1, read as a first-match scan; the same as "the last new
   or renew at or before T not followed by a release or expiry before T".) Lease duration is not checked: an expiry
   counts only when the log has the event.
   - **The lease start**: from the covering event, walk back over renews of the same MAC to the new lease that started
     them; a release, an expiry or another MAC ends the walk, and a new lease is a start of its own.
2. **The device** is the MAC (client ID) of the covering event. The host name is what the client sent: it may be wrong
   or empty; an empty name leaves the device known by its MAC only.
3. **Logons inside the lease.** TGT requests from the address with lease start ≤ t ≤ T. A logon before the lease start
   belongs to the previous holder of the address; one after T does not count. Logoffs and other addresses are not
   logons.
4. **Still logged on.** A user is dropped when a logoff of theirs from the same address follows their latest logon and
   is at or before T. One user left → found; several → several candidates (the trail gives the device, not the
   person); none left → the device without a user. *A DC does not record a workstation's logoff (logoffs are 4634/4647
   on the workstation itself, check)*, so no evidence set has a logoff from the DCs; rule 4 is in the model and tested,
   and on the page step 4 says that the DCs record no logoff.
5. **Retention.** Asked `d` days after the day (0–14):
   - DHCP1's audit log keeps 7 days: one file per weekday, started again the same weekday a week later (a file not
     written in the last 24 hours is overwritten) *(check)*. It has the events while `d < 7`; at `d = 7` (Monday 5 Oct)
     the Monday file is new.
   - The DCs' Security logs keep about 3 days in this scenario: the log has a size limit and overwrites the oldest
     events, so how long it lasts depends on the load. 3 is a scenario value, not a default. They have the events while
     `d < 3`.
   - IPAM (when it collects) keeps what it collected until an administrator purges it *(check)*: it has both kinds
     for any `d` on the page.
   - No source for the leases → no answer. Leases but no logons → the device, user unknown.
6. **DNS now is never evidence.** The record shows who has the name now; the answer never reads it. The page shows it
   with "not evidence for T", and the answer's caption says so when the name differs from the device found.
7. **Tie-breaks.** An event exactly at T counts as before T (lease events, logons and logoffs). A logon exactly at
   the lease start counts. Two lease events in the same minute keep the log order (the later line is newer).

## Steps

One step = one link of the chain: (1) lease at T, (2) device, (3) logons in the lease, (4) still logged on, (5) the
answer or why there is none. 5 steps per question. Each link carries a reason when it is not found: `gone` (the
source no longer has the events; checked before `no-lease` for the logon link, so an overwritten log is named as
such), `no-lease`, `free`, `none`, `all-off`. The `address-reused` evidence set asks two questions: T, then
09:10 (or 14:32 when T is 09:10), so 10 steps; the second answer is compared with the first. Each link is ✓ found,
✕ missing or ≈ ambiguous. The answer link is ✓ for one device and one user, ≈ for a partial answer (several
candidates, or a device with no user), ✕ for no answer.

## Evidence sets (task presets, "derived, unchecked")

MACs: PC-LAB07 `02-AB-CD-0A-0B-07` (task), LAPTOP-IVAN `02-AB-CD-1C-2D-31`, PC-LAB12 `02-AB-CD-0A-0B-12` (invented).

| Set | Lease events | Logons | DNS now |
|---|---|---|---|
| `one-user` | 08:12 new PC-LAB07, 13:05 renew, 17:40 release | 08:15 ana (DC1) | `pc-lab07` |
| `address-reused` | 08:12 new PC-LAB07, 11:58 release, 12:30 new LAPTOP-IVAN, 16:30 renew | 08:15 ana (DC1), 12:33 ivan (DC2) | `laptop-ivan` |
| `two-users` | 08:12 new PC-LAB07, 12:12 renew, 16:12 renew | 08:15 ana (DC1), 13:50 marko (DC2) | `pc-lab07` |
| `dns-trap` | 08:12 new PC-LAB07, 13:05 renew, 16:40 release, 16:45 new PC-LAB12 | 08:15 ana (DC1), 16:48 petra (DC1) | `pc-lab12` |

## Presets and expected answers

| Preset | Params | Steps | Answer |
|---|---|---|---|
| `one-user` | one-user, 14:32, 0 days, IPAM on | 5 | PC-LAB07, ana (lease: 13:05 renew; start 08:12) |
| `address-reused` | address-reused, 14:32, 0, on | 10 | 14:32: LAPTOP-IVAN, ivan (12:30 new; ana 08:15 is before the lease); 09:10: PC-LAB07, ana (ivan 12:33 is after T) |
| `two-users` | two-users, 14:32, 0, on | 5 | PC-LAB07, ana / marko (≈ two candidates) |
| `too-old` | one-user, 14:32, 9 days, IPAM off | 5 | none: DHCP file overwritten Mon 5 Oct, DC logs gone; with IPAM on: PC-LAB07, ana |
| `dns-trap` | dns-trap, 14:32, 2 days, on | 5 | PC-LAB07, ana; DNS now says pc-lab12 |

Other values the tests check: `one-user` at 17:55 → nobody (released 17:40); `one-user` 4 days later without IPAM →
PC-LAB07, user unknown; `dns-trap` at 17:55 → PC-LAB12, petra (DNS agrees, because it is about now); `two-users` at
09:10 → ana only.

## Params

`evidence` (hidden; set by the presets), `at` 09:10 / 14:32 / 17:55 (default 14:32), `askedDaysAgo` 0–14 (default 0),
`ipamCollected` (default on). Every param change starts the run again.

## Sources

- Microsoft, "IP Address Tracking" (Windows Server 2012 R2, archived, read online 2026-11-04): IPAM correlates DHCP lease
  events on managed DHCP servers with user and computer authentication events on managed DCs and NPS servers; search by
  IP address, client ID, host name or user name; user names are not in DHCP lease events.
- Microsoft, "Analyze DHCP Server Log Files" (TechNet, WS 2008 R2) and NXLog's DHCP integration page (search result
  summaries, 2026-11-04): event IDs 10 new, 11 renew, 12 release, 16 deleted, 17 expired; files `DhcpSrvLog-<day>.log`.
- ITProToday "Configuring DHCP Server Logs" and the "All about DHCP Auditing" blog (search summaries): week-old files
  are overwritten; a file not modified in the last 24 hours is overwritten, otherwise appended *(check)*.
- Microsoft, Security event 4768 "A Kerberos authentication ticket (TGT) was requested" (from memory) *(check)*.
- UL ch. 18 "Tko dijeli adrese" → "Što poslužitelj pamti" (the lease record: address, hardware address, client ID,
  expiry, host name), through the task file.
