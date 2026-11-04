<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dhcp-dns-update: specification

One concept: **the DHCP server registers DNS records for its clients; who owns them, name protection,
DnsUpdateProxy** (task `docs/tasks/w3/win-dhcp-dns-update.md`, catalogue §4.5.4, §5.21). The student gives leases
to an option-81 Windows client and to clients that do not send option 81 (a non-Windows host, a printer), under the
server's DNS settings, and watches who writes which record, and what happens when a second server or a client with
someone else's name comes along.

## Scene

- **Left:** the two zones on DC1, both AD-integrated and *Secure only*: `corp.example` (A and DHCID records) and
  `10.0.10.in-addr.arpa` (PTR records), as record tables with an owner chip per row. Under them the DHCP server's
  **DNS settings** (the DNS tab) with its credentials and leases, and the **message card** (what this step carries,
  or DC1's check).
- **Right, kit view K1:** lanes for the client, `DHCP1`, `DHCP2` (only in the failover event) and `DC1`. DHCP
  messages are dashed (DISCOVER broadcast to every server); DNS UPDATEs are drawn signed (K1 `lock`) unless the
  sender has no account; answers are dashed. Events (a server goes down, a lease expires) are notes.

## State

```
dhcp:    [{ id, ip, up, creds: computer|dedicated, inDnsUpdateProxy (param creds = proxy),
            settings: { mode: off|onRequest|always, discardOnDelete, legacyClients, nameProtection },
            leases: [{ host, mac, ip, granted, expires, dns: [{ zone, name, types }] }] }]
clients: [{ id, name, host, mac, os: windows|other|printer, sendsOpt81, account | null, ip }]
zones:   { fwd: { name, updates: 'secureOnly', records }, rev: { … } }
         records: [{ name, type: A|DHCID|PTR, data, owner: account | null, timestamp, static: false }]
lease:   { client, ip, by }      (the lease this run is about, and the server giving it)
queue:   [{ by: DHCP1|DHCP2|client, op: A|PTR|del, try, … }]   (the DNS updates still to send)
msgs, phase, t, event
```

The task's `zone: { records }` is two zones here, because A and PTR live in different zones and each needs its own
UPDATE. The record shape is `win-dns-dynamic-update`'s with `type` used (A, DHCID, PTR) and the owner an account
name instead of a SID (the concept here is which account, not SID versus name).

## One step

| Phase | Row(s) | Notes |
|---|---|---|
| `down` | note on DHCP1: down | failover event only |
| `expire` | note on DHCP1: lease of the client expired, deleted | expiry event only |
| `do` | DISCOVER (broadcast) and OFFER, two rows, one step | in failover the DISCOVER is ✕ at DHCP1 |
| `ra` | REQUEST (option 81 when the client sends it) and ACK (option 81 reply when the server gives one), one step | the lease is written in the server's table |
| `upd` | one DNS UPDATE, by the server or by the client | |
| `ans` | DC1's answer: NOERROR, REFUSED, YXDOMAIN or NXRRSET | |

A query with its answer is one step for DHCP (the answer is not the point there); a DNS UPDATE and its answer are two
(the answer is the point), as in `win-dns-dynamic-update`.

## Rules

1. **Option 81.** A Windows client puts option 81 (Client FQDN, RFC 4702) in its REQUEST with its FQDN and the S flag
   0: "I update my A record myself; you, the server, update the PTR" (RFC 4702 §2.1; Microsoft (check)). A
   non-Windows host and the printer send no option 81.
2. **"Dynamically update DNS records only if requested by the DHCP clients"** (the default, *onRequest* (check)):
   the server does what the client asked: the PTR only, and its ACK option 81 has S = 0. The client then registers its
   A record itself (its own secure update, `win-dns-dynamic-update`, drawn here as one signed UPDATE).
   **"Always dynamically update DNS records"** (*always*): the server updates A and PTR for every client that sends
   option 81 and answers S = 1, O = 1 (it overrides the client), so the client sends no update.
3. **No option 81.** A client that sends no option 81 gets no records, unless **"Dynamically update DNS records for
   DHCP clients that do not request updates"** is on (default off (check)): then the server updates A and PTR.
4. **"Discard A and PTR records when lease is deleted"** (default on (check)): when the lease expires and is deleted
   (the grace period before deletion is not shown (check)), the server deletes the records it registered for that
   lease: A (and DHCID) in one UPDATE, PTR in another. Records the client registered itself stay (until scavenged,
   `win-dns-scavenging`). Off: everything stays.
5. **Credentials.** The server writes with its computer account (`DHCP1$`) by default, or with the user set under
   "DNS dynamic update registration credentials" (here the shared `svc-dhcpdns`, set on both servers) (Microsoft
   (check)). The record's owner is that account.
6. **Secure only.** Both zones take signed updates only; a signed update to an existing name must come from its owner,
   otherwise REFUSED and the old data stays (`win-dns-dynamic-update` rule 6). So DHCP2 (`DHCP2$`) may not change a
   record DHCP1 created as `DHCP1$`; with the shared user both write as `svc-dhcpdns` and may. A client with no
   computer account (the workgroup laptop) cannot sign: REFUSED, it gives up. A refused A update does not stop the
   server's PTR update (separate updates, separate zones (check)).
7. **DnsUpdateProxy.** Records created by a member of the DnsUpdateProxy group get no owner ("no security"); any
   authenticated account may write them, and the next one that writes and is not a member becomes the owner (Microsoft,
   DnsUpdateProxy security note (check)). Membership is of the computer account: with the dedicated user the servers
   write as `svc-dhcpdns`, which is not a member; so membership is a third value of the credentials param. A DHCP server
   on a DC in DnsUpdateProxy also leaves the DC's own records unsecured: named in the explanation, not modelled.
8. **Name Protection** (Windows Server 2008 R2 and later; needs updates on). The server registers A and PTR for every
   option-81 client (as *always*) and keeps a DHCID record beside the A (RFC 4701: a digest of the client's identifier
   and FQDN; shown here as "digest of <MAC>"). The forward update follows RFC 4703 §5.3: first "add A + DHCID if the
   name is not in use"; if the answer is YXDOMAIN, again "replace A if this name's DHCID is this client's". If that
   fails (NXRRSET: another client's DHCID, or none), the server stops for this client: no A, no PTR (check).
   Legacy clients get the same treatment when "do not request updates" is on (check).
9. **Leases.** 8 days (the Windows default (check)). Only the lease of the client this run is about is shown.

### Tie-breaks

- **T1: an update is all or nothing**: the A and its DHCID are added together or not at all; one name the sender may
  not write refuses the whole update (RFC 2136 §3.4, §3.7).
- **T2: the order of DC1's checks**: zone setting, then prerequisites, then the owner (RFC 2136 §3.2 before §3.3).
  A DHCID that matches does not excuse the owner check: DHCP2 with name protection gets YXDOMAIN, then REFUSED.
- **T3: the owner sits on the name**, not on one record: the A and the DHCID of `fs1` share it, and a name with no
  owner is taken over by the next writer outside DnsUpdateProxy; a member writing it leaves it open.
- **T4: the switches that need others**: with updates off, legacy clients and Name Protection have no effect (the
  Windows client then registers A and PTR itself, rule 2's fallback: no option 81 in the ACK (check));
  "Discard" matters only when a lease expires.
- **T5: server first, then the client**: after the ACK the server's updates are drawn before the client's own, A before
  PTR (RFC 4703 §5: forward first).
- **T6: names compare case-insensitively**, and PTR names are the last octet in `10.0.10.in-addr.arpa`.

## Events (param `event`)

| Event | History before step 0 | Run |
|---|---|---|
| `lease` | none (the clash client: FS1's own lease on day 0) | DORA, then the updates |
| `failover` | the client's lease from DHCP1 on day 1, with its records | DHCP1 goes down; the client restarts and asks from scratch; DHCP2 answers from its own part of the scope with `10.0.10.88`; the updates |
| `expiry` | the client's lease from DHCP1 on day 1, with its records | the client left; on day 9 the lease expires; with Discard on, DHCP1 deletes what it registered |

The history is the same model run silently with the same settings, so the starting records are what these settings
would have produced. The task's `failover` toggle is this choice (the three are exclusive); a failover partner proper
would keep the address (`win-dhcp-failover`), so DHCP2 here holds its own part of the scope (NOTES.md).

## Times

`t` is seconds since day 0 00:00. FS1's ACK at day 0 08:00:00, an earlier lease's ACK at day 1 09:00:00. Every
visible run starts on day 3 at 10:00:00, one second per step; the expiry note jumps to the lease's end, day 9
09:00:00, and its updates follow a second apart.

## Names and addresses

| | Name | MAC | Address | Option 81 | Account |
|---|---|---|---|---|---|
| Windows laptop | WIN10-07 | 00-15-5D-0A-0A-07 | 10.0.10.57 | yes | `WIN10-07$` |
| non-Windows host | HOST-12 | 52-54-00-3C-4D-12 | 10.0.10.62 | no | none |
| printer | PRN-3 | 00-80-77-11-22-03 | 10.0.10.53 | no | none |
| laptop named FS1, outside the domain | FS1 | 00-15-5D-0A-0A-66 | 10.0.10.66 | yes | none |
| the file server (reservation) | FS1 | 00-15-5D-0A-0A-20 | 10.0.10.20 | yes | `FS1$` |

DC1 10.0.10.10 (`dc1` A and `10` PTR, owner `DC1$`), DHCP1 10.0.10.11, DHCP2 10.0.10.12, the new address in the
failover event 10.0.10.88.

## Params

| Param | Values | Default |
|---|---|---|
| `client` | `windows`, `other`, `printer`, `clash` | `windows` |
| `event` | `lease`, `failover`, `expiry` | `lease` |
| `mode` | `off`, `onRequest`, `always` | `onRequest` |
| `legacy` | toggle | off |
| `discard` | toggle | on |
| `creds` | `computer`, `proxy` (the computer accounts in DnsUpdateProxy), `dedicated` (`svc-dhcpdns`) | `computer` |
| `nameProtection` | toggle | off |

## Presets and expected numbers

Checked by an independent hand model (Python) before `sim.js`; `sim.test.js` "presets" holds the same numbers.

| Preset | Params | Path | Steps | Records at the end |
|---|---|---|---|---|
| `windows-default` | defaults | DO, RA, DHCP1 PTR ✓, client A ✓ | 6 | `57 PTR win10-07` owner `DHCP1$`; `win10-07 A 10.0.10.57` owner `WIN10-07$` |
| `printer-none` | client printer | DO, RA | 2 (6 with legacy) | nothing; with legacy `prn-3 A .53`, `53 PTR`, owner `DHCP1$` |
| `failover-refused` | printer, legacy, failover | down, DO, RA, DHCP2 A REFUSED, DHCP2 PTR ✓ | 7 | `prn-3 A` still `.53` (`DHCP1$`); `88 PTR prn-3` (`DHCP2$`); `53 PTR` stale |
| `lease-expiry` | other, legacy, expiry | expire, delete A ✓, delete PTR ✓ | 5 (1 with discard off) | `host-12` A and PTR gone (stay with discard off) |
| `name-protection` | clash, nameProtection | DO, RA, A YXDOMAIN, A NXRRSET | 6 | `fs1 A 10.0.10.20` + DHCID unchanged; no PTR for .66 |

Neighbours the page invites: failover with the dedicated user or with DnsUpdateProxy: 7, A → `.88`; the clash
without Name Protection: 6, DHCP1 writes `66 PTR fs1`, the laptop's own unsigned A REFUSED; the clash under
*always*: 6, DHCP1 overwrites `fs1` → `.66` (it owns the name); the Windows client with updates off: 6, both records
owned by `WIN10-07$`; with Name Protection in failover: 9 (YXDOMAIN, then REFUSED). The largest of all
864 combinations is 9. Default 6 = `sim.json` `steps`.

The task gives printer-none "5 + 3": with one step per DHCP exchange and two per DNS update the printer has 2, and 6
with legacy (NOTES.md, "Deviations").

## Legend

DHCP message (dashed), signed DNS UPDATE (double line, padlock), owner chips: a server mark for records the DHCP
server owns, a computer mark for client-owned, an open lock for no owner (DnsUpdateProxy); ✓ accepted, ✕ refused;
"this step" (highlight).

## Out of scope

The client's own secure update in detail (`win-dns-dynamic-update`), aging and scavenging (`win-dns-scavenging`),
failover mechanics (`win-dhcp-failover`), DHCPv6, the grace period of an expired lease, the option-81 E and N flags,
the "Disable dynamic updates for DNS PTR records" setting.
