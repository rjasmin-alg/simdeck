<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-rodc: spec

One concept: **the password replication policy (PRP) decides which passwords a read-only DC may keep; a stolen RODC
exposes only those and its own `krbtgt_8123` key, so the response resets exactly that list.**

Task: `docs/tasks/w3/win-rodc.md` (catalogue §4.5.1). Stepper. Kit view K2 (topology) draws HQ's writable DC01, the
IPsec tunnel (the WAN), the branch's RODC01 and the branch PC where people log on; three cards below it: RODC01's
PRP, the domain's accounts at DC01, and the secrets RODC01 holds. A short log of the steps at the bottom.

## Scene

From topologydrafter's sample `two-sites`: HQ with the writable `DC01` (10.10.0.10), Branch with `RODC01` (10.20.0.10,
"no writes") and 8 branch PCs, the IPsec site-to-site tunnel between the sites. Domain `quillmoor.example`, as in
the other `win-` sims.

| Account | Kind | Direct groups | Notes |
|---|---|---|---|
| `ana`, `luka`, `maja`, `ivan`, `petra`, `sara` | user | `BRK-Staff` | the six branch users |
| `marko` | user | `HQ-Staff` | HQ staff, visiting the branch |
| `tbrennan` | user | `Domain Admins`, `BRK-Staff` | estate Domain Admin (`domain-admins.txt`); also in `BRK-Staff` because he looks after the branch, so deny and allow both match him |
| `krbtgt` | the domain's Kerberos key account | — (member of the Denied RODC Password Replication Group) | |
| `BR-PC01` … `BR-PC08` | computer | `BRK-PCs` | the eight branch PCs |
| `RODC01$` with `krbtgt_8123` | the RODC's account and its own Kerberos key account | | deleted in the theft response |

Every account starts at password version 1 (`pwdVer`); a reset makes it 2.

**PRP of RODC01:**

- Allowed: `Allowed RODC Password Replication Group`, whose members are `BRK-Staff` and `BRK-PCs` (`allowGroup` =
  `brk`) or nobody (`empty`, the default of a new domain).
- Denied: `Denied RODC Password Replication Group` (members: Domain Admins, Enterprise Admins, Schema Admins, Cert
  Publishers, Group Policy Creator Owners, Domain Controllers, Read-only Domain Controllers, krbtgt) and the policy's
  own deny entries Administrators, Account Operators, Server Operators, Backup Operators.

Group nesting is not modelled: each account's direct groups are matched against both lists.

## State

`{ wan, pwdVer: { id: n }, rodc: { cached: [ids], krbtgt: 'krbtgt_8123', account: bool }, localLogons: { pc: [users] },
stolen, exposed: [ids], toReset: [ids], reset: [ids], before, log: [], last }`

- `rodc.cached` is the RODC's revealed list (`msDS-RevealedList`): the accounts whose passwords it holds, in the order
  they were cached. No duplicates.
- `localLogons[pc]` the users who logged on successfully at that PC (its own cached logon, `win-domain-logon` rule 6).
- `exposed` the accounts whose passwords the theft exposed (`rodc.cached` at the theft); `exposedKey` the RODC's own
  key exposed with them (`krbtgt_8123`).
- `rodc.krbtgt` becomes null when RODC01's account is deleted; `rodc.cached` (the revealed list) stays.
- `before` the number of history logons replayed into the initial state (`stolen` only: 10).
- `last` the event of this step with what each party did (for the page); `log` one entry per step.

## Params

| Param | Values | Default | Meaning |
|---|---|---|---|
| `scenario` | the five presets | `first-logon` | which events happen (hidden; set by the presets; resets the demo) |
| `allowGroup` | `empty`, `brk` | `brk` | members of the Allowed RODC Password Replication Group |
| `wan` | toggle | on | the WAN (IPsec tunnel) at step 0 |
| `user` | `ana`, `marko`, `tbrennan` | `ana` | who logs on in the presets' main logons |

## Rules

1. **An RODC holds the domain without secrets**, except the accounts its PRP let it cache (`rodc.cached`) and its own
   `krbtgt_8123`. (Microsoft Learn, "RODC Filtered Attribute Set, Credential Caching, and the Authentication Process
   with an RODC"; "Password Replication Policy".)
2. **Logon at the branch.** For each account in turn, the PC's own account first, then the user's: if the RODC holds
   its password, it authenticates locally (`local`); otherwise, with the WAN up, it forwards to the writable DC01,
   which authenticates it.
3. **After a forwarded success, DC01 checks the PRP.** **T1: deny wins over allow.** Denied → not cached (`forwarded`,
   verdict `deny`); allowed → DC01 replicates that account's password to the RODC (`cached`); neither → not cached
   (`forwarded`, verdict `none`). A forwarded logon of a not-cached account is forwarded again next time.
4. **The Allowed RODC Password Replication Group is empty by default**; members of the denied lists, and so Domain
   Admins and `krbtgt`, are never cached. (Microsoft Learn, "Password Replication Policy": "Deny permissions override
   allow permissions"; the allowed group "has no members by default".)
5. **WAN down**: an account the RODC holds is authenticated locally; any other fails at the RODC. A user who logged on
   at that PC before may still get the PC's own cached logon (no network resources); the page says so (`pcLocal`).
6. **Computer accounts are cached too.** The PC's account is authenticated first (its secure channel to the DC); with
   the WAN down a PC the RODC does not hold fails, and the logon with it, even when the user's password is cached
   *(check)*. Branch PCs are in `BRK-PCs`, which the Allowed group holds together with `BRK-Staff`.
7. **The RODC signs its own TGTs** with `krbtgt_8123`: a local logon gets a TGT signed with `krbtgt_8123`, a forwarded
   one a TGT from DC01 signed with the domain's `krbtgt` (`tgt`: `rodc` / `domain`). Writable DCs know `krbtgt_8123`
   (its account is in the domain). **A stolen RODC exposes only `rodc.cached` and `krbtgt_8123`**, never the domain's
   `krbtgt`, nor accounts it never cached.
8. **Response to theft** (Microsoft Learn, "Securing Accounts After an RODC Is Stolen"; the task's "RODC removal and
   reinstallation"): read the revealed list (`msDS-RevealedList`) at DC01 (`toReset` := `rodc.cached`); delete
   RODC01's computer account, which removes `krbtgt_8123`, so TGTs signed with it are refused *(check)*; reset the
   passwords of the cached user accounts, then of the cached computer accounts (the delete dialog's two check boxes,
   "Reset all passwords for user accounts that were cached on this Read-only Domain Controller" and the same for
   computer accounts *(check)*). Exactly `toReset` is reset (`pwdVer` + 1); every other account keeps its version. Deleting the account sets `rodc.krbtgt` to null and keeps
   the revealed list. A logon that fails gets no TGT.

One step is one event: a logon at `BR-PC01` (the PC and then the user), a WAN cut (a cut while the WAN is already down
changes nothing), or one theft/response action. A logon after the theft fails (`gone`); no preset does that.

## Presets (one step per event)

`u` is the `user` param. Every logon is at `BR-PC01`.

| Preset | Params | Events | Steps |
|---|---|---|---|
| `first-logon` | defaults | u, u, marko, marko | 4 |
| `wan-down` | defaults | u, WAN cut, u, marko | 4 |
| `admin-at-branch` | `user: tbrennan` | u, u, WAN cut, u | 4 |
| `default-empty` | `allowGroup: empty` | u, u, WAN cut, u | 4 |
| `stolen` | defaults | theft, read the revealed list, delete RODC01's account, reset users, reset computers | 5 |

`stolen` starts after a month at the branch, replayed into step 0 with the WAN up (`history()`, 10 logons): the six
branch users at `BR-PC01`…`BR-PC06`, `BR-PC07` and `BR-PC08` started with nobody logging on, marko at `BR-PC01`,
tbrennan at `BR-PC02`.

`sim.json` `steps` is 4 (the default preset).

## Expected numbers

Checked by an independent Python model (`win-rodc-check.py`, the thread's library folder) and by `sim.test.js`.
PC result first, then the user's; `cached` = size of `rodc.cached` after the step.

| Preset | Step 1 | Step 2 | Step 3 | Step 4 | Step 5 |
|---|---|---|---|---|---|
| `first-logon` | cached, cached (2); TGT from DC01 | local, local (2); TGT `krbtgt_8123` | local, forwarded `none` (2) | local, forwarded `none` (2) | |
| `wan-down` | cached, cached (2) | cut | local, local (2); TGT `krbtgt_8123` | local, failed (2) | |
| `admin-at-branch` | cached, forwarded `deny` by Domain Admins, also allowed by BRK-Staff (1) | local, forwarded `deny` (1) | cut | local, failed (1); `pcLocal` | |
| `default-empty` | forwarded `none`, forwarded `none` (0) | the same (0) | cut | failed, failed (0); `pcLocal` | |
| `stolen` | exposed: 6 users + 8 computers + `krbtgt_8123` | `toReset` 14 | `RODC01$` and `krbtgt_8123` deleted | 6 user passwords reset | 8 computer passwords reset |

`stolen` at the end: the 14 accounts of `toReset` at version 2; `marko`, `tbrennan` and `krbtgt` at version 1, never
exposed. With `allowGroup: empty`, the same preset exposes no password, only `krbtgt_8123`, and resets nothing.

## Differences from the task file

- **WAN cut only, no restore**: no preset restores the WAN, so the model has a `cut` event only.
- **Allowed group members `BRK-Staff` and `BRK-PCs`** (task: `BRK-Staff`): rule 6 needs the branch PCs cached, and the
  `stolen` preset's 8 computer hashes need an allowed group for them.
- **Account Operators, Server Operators, Backup Operators (and Administrators)** are the PRP's own deny entries, not
  members of the Denied RODC Password Replication Group (the task lists them under "Denied group"); the outcome is the
  same.
- **`first-logon` is four logons** (task: one logon in four sub-steps), keeping one logon per step; `wan-down` starts
  with the user's first logon. NOTES.md lists the rest.

## Out of scope

RODC promotion and staged install, administrator role separation, the filtered attribute set, DNS on the RODC,
prepopulating passwords, group nesting.
