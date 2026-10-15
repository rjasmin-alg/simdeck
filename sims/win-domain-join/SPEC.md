<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-domain-join: spec

One concept: **joining a domain is DNS SRV lookup, a computer account and a secure channel built on a machine
password the client keeps changing; reverting a snapshot puts the client back on an old password, and after two
changes the DC no longer knows it.**

Task: `docs/tasks/w2/win-domain-join.md` (catalogue §4.5.1). Stepper, drawn with kit view K1 (message sequence
chart, `kit/sequence.js`) under a strip with the client, the secure channel, the computer object, the joining user
and (for the revert) a day timeline.

## Scene

| Party | Data |
|---|---|
| Client | `PC07`, 10.10.20.57, DNS client pointing at 10.10.0.10 (DC01) or at a public resolver 198.51.100.53 |
| DNS | the DNS server on DC01 (10.10.0.10), or the public resolver |
| DC | `DC01`, 10.10.0.10, domain `quillmoor.example` (NetBIOS `QUILLMOOR`) |
| Joining user | `QUILLMOOR\ana`, an ordinary user (no delegated right to create computer objects) |
| Administrator | `QUILLMOOR\admin` (the repair) |
| Object | `CN=PC07,CN=Computers,DC=quillmoor,DC=example` |

Passwords are labels `p0, p1, …`, issued in order; a label is never reused (after a revert the next label is still
the next number). Both sides keep `{ cur, prev }`; `prev` is `—` until there is one.

## Params

| Param | Values | Default | Applies to |
|---|---|---|---|
| `scenario` | `join`, `revert` | `join` | (added, see NOTES "Deviations") |
| `dnsServer` | `dc01`, `public` | `dc01` | join |
| `joinsByUser` | 0–10, step 1 | 0 | join: computers `ana` has already joined |
| `snapshotAge` | 0–90, step 5 | 65 | revert: the day of the revert (task: step 15, which cannot reach 35 or 65) |

A param that does not apply to the scenario is disabled, with the reason as its hint.

## Rules

1. **Locating a DC.** The client asks its DNS server for the SRV record `_ldap._tcp.dc._msdcs.quillmoor.example`.
   DC01's DNS answers `DC01.quillmoor.example:389` (10.10.0.10). The public resolver has no such zone and answers
   NXDOMAIN; the join then fails ("no domain controller could be contacted") and nothing is created. After the SRV
   answer the client sends an LDAP ping (CLDAP, UDP 389) to DC01, which answers with its name and the domain.
   *Sources: [MS-ADTS] §6.3 "Publishing and locating a domain controller"; Microsoft Learn "How domain controllers are
   located in Windows".*
2. **Computer object and quota.** The joining user authenticates and the client creates `CN=PC07` in `CN=Computers`.
   An ordinary user may create at most 10 computer objects (`ms-DS-MachineAccountQuota`, default 10): with
   `joinsByUser` < 10 the object is created and the user's count goes up by one; with 10 the creation is refused and
   the join fails, nothing created. (A pre-staged object is reused instead; mentioned in the explanation, not
   modelled.) *Source: Microsoft Learn "Default limit to number of workstations a user can join to the domain".*
3. **Machine password.** The client sets a random password `p0` on the object and stores it as an LSA secret:
   client `{ cur p0, prev — }`, object `{ cur p0, prev — }`, `lastSet` = day 0. The join ends with "restart
   required".
4. **Secure channel.** After the restart Netlogon builds a secure channel with DC01, authenticating with the machine
   password (rule 6). GPOs and domain logon work only over it.
5. **Password change.** The client changes the machine password when its own copy is 30 days old or older
   (Domain member: Maximum machine account password age, default 30 days). The change is client-initiated and goes
   over the secure channel. Both sides then keep the new one as `cur` and the old `cur` as `prev`.
   *Sources: Microsoft Learn "Domain member: Maximum machine account password age"; Ask the Directory Services
   Team, "Machine account password process" (title checked; text not readable in this session).*
6. **Channel check.** The secure channel succeeds iff the client's `cur` equals the object's `cur` or its `prev`
   (`prev` not empty). *(check: the DC accepting the previous password.)* Otherwise it fails with access denied and
   the channel is broken.
7. **Snapshot revert.** A snapshot keeps the client's `{ cur, prev }` and `lastSet`. Reverting restores them; the
   object in AD is not touched. After the revert the client builds the secure channel again (rule 6), and a user
   logs on (`ana`).
   - one change since the snapshot: client `p0` = object `prev` → works; the client's copy is then ≥ 30 days old by
     its own clock, so it changes the password at once (rule 5) and both sides are in step again *(check: the
     immediate change)*;
   - two or more changes: client `p0` ∉ object `{cur, prev}` → broken; the logon is refused with "The trust
     relationship between this workstation and the primary domain failed."
8. **Repair.** An administrator resets the machine password on both sides from the client (with the administrator's
   credentials, not the secure channel): a new label on both, client `{ cur new, prev old cur }`, object
   `{ cur new, prev old cur }`. The secure channel is then built again and the logon works. The object, its SID
   and its group memberships stay (unlike deleting the account and joining again).

## Tie-breaks

- **T1. A change on the revert day comes first.** Changes are due on days 30, 60, 90; a revert on day 30 or 60
  happens after that day's change. So `snapshotAge` = 30 is one change (works), 60 is two (broken), 90 three.
- **T2. Age is ≥ 30, not > 30.** A copy exactly 30 days old is changed (that is what puts the changes on days 30,
  60, 90).
- **T3. `prev` empty never matches.** Just after the join the object's `prev` is `—`; a client with no password
  never matches it.
- **T4. The revert restores the client only.** The object's `{cur, prev}` and the label counter keep going.
- **T5. A failed locate or quota stops everything.** No object, no password, no channel, the user's count unchanged.
- **T6. DNS is checked before the quota.** With the public resolver and `joinsByUser` 10 the join fails at DNS.

## Steps (one message or one event each)

**join** (`dnsServer` dc01, `joinsByUser` < 10): 1 SRV query, 2 SRV answer, 3 LDAP ping, 4 ping reply, 5 create
`CN=PC07` (✓), 6 set `p0` (✓, restart required), 7 restart, 8 secure channel with `p0` (✓) — **8**.

**wrong DNS** (`public`): 1 SRV query to the resolver, 2 NXDOMAIN, 3 join fails — **3**.

**quota** (`joinsByUser` 10): 1–4 as join, 5 create refused, quota 10/10 — **5** (task: 4, see NOTES).

**revert** (`snapshotAge` a, k = number of changes on days 30, 60, 90 ≤ a):
1 snapshot (day 0, `p0`), then k changes, then the revert (day a), the channel, and
- k ≤ 1: logon ✓, and if k = 1 the immediate change — **4 + 2k** (a < 30: 4; 30 ≤ a < 60: 6);
- k ≥ 2: logon refused, admin reset, channel ✓, logon ✓ — **7 + k** (60 ≤ a < 90: 9; a = 90: 10).

| Preset | Params | Steps | End |
|---|---|---|---|
| `join` | defaults | 8 | object `CN=PC07`, `p0` on both, channel ok, ana 1/10 |
| `revert-65-days` | revert, a 65 | 9 | changes p1 (30), p2 (60); revert → p0; object {p2, p1} → broken, logon refused; reset p3 → client {p3, p0}, object {p3, p2}; ok |
| `revert-35-days` | revert, a 35 | 6 | change p1 (30); revert → p0 = object prev → ok; change p2 at day 35 → client {p2, p0}, object {p2, p1} |
| `wrong-dns` | dnsServer public | 3 | nothing created |
| `quota` | joinsByUser 10 | 5 | creation refused, ana 10/10, nothing created |

Maximum over all params: 10 (revert, a = 90). `sim.json` `steps` = 8 (defaults).

## Out of scope

User logon after the join in detail (`win-domain-logon`), DC snapshot revert and USN rollback
(`win-ad-backup-restore`), offline domain join, pre-staging, replication of the password between DCs.
