<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-uac — specification

One concept: **an administrator runs with a filtered token until elevated.** Task: `docs/tasks/w3/win-uac.md`
(catalogue §4.5.7). Builds on `win-access-token` (the token card: user SID, group SIDs, privileges; the access check
against an ACL). New here: the linked pair of tokens, deny-only SIDs, integrity levels, elevation.

Sources (titles cited from memory, no network in the session; every one *(check)*):
[UAC] Microsoft Learn, "How User Account Control works"; [UACS] "User Account Control settings and configuration"
(Admin Approval Mode policies); [MIC] "Mandatory Integrity Control"; [DACL] Win32, "How DACLs Control Access to an
Object"; [RT] Win32, `TOKEN_LINKED_TOKEN` and `TOKEN_ELEVATION_TYPE` (the filtered token is `TokenElevationTypeLimited`: deny-only
groups and removed privileges, no restricting SIDs, so it is not a "restricted token" in the `CreateRestrictedToken` sense); [REM] Microsoft support, "Description of User
Account Control and remote restrictions in Windows Vista" (`LocalAccountTokenFilterPolicy`).

## Scene

Computer `PC-07`, local accounts. `ana` (member of Administrators), `marko` (standard user), `admin-it` (member of
Administrators, whose name marko types into the credential prompt), `Administrator` (the built-in account, RID 500).
Every token carries the user's SID, `Everyone`, `Users` (members of Administrators are in Users too), `INTERACTIVE`,
`Authenticated Users`, and `Administrators` for an administrator.

Processes: `explorer.exe` (the desktop), `cmd.exe` (a console started with "Run as administrator"), `notepad.exe`
(a child started from either).

Tasks (param `task`), each with a target and what it needs:

| task | target | needs | DACL, top to bottom |
|---|---|---|---|
| `progfiles` | `C:\Program Files\App` | write | SYSTEM Full control · Administrators Full control · Users Read & execute |
| `hklm` | `HKLM\SOFTWARE` | write (set value) | SYSTEM Full control · Administrators Full control · Users Read |
| `timezone` | the time zone | `SeTimeZonePrivilege` | (a privilege, no DACL) |
| `service` | the service `Spooler` | stop | SYSTEM all · Administrators all · INTERACTIVE query |

The DACLs are simplified (TrustedInstaller, CREATOR OWNER and the application-package SIDs left out) *(check)*.
Objects carry no integrity label, so they count as Medium [MIC].

## Rules

1. **Two linked tokens** [UAC]. With UAC on, an administrator's interactive logon makes two tokens, linked to each
   other: the *full* token and a *filtered* one made from it. The desktop (`explorer.exe`) runs with the filtered one.
   A standard user gets one token. With UAC off (the pre-Vista situation) an administrator gets one full token.
2. **The filtered token** [UAC, RT, MIC]. Made from the full token: Administrators (and similar groups: Backup
   Operators, Power Users, Account/Server/Print Operators, Network Configuration Operators) become **deny-only**; the
   privileges are cut to `SeShutdownPrivilege`, `SeChangeNotifyPrivilege`, `SeUndockPrivilege`,
   `SeIncreaseWorkingSetPrivilege`, `SeTimeZonePrivilege` *(check full list)*; integrity **Medium**. The full token
   keeps everything and is **High**. A standard user's token has the same five privileges and is Medium. With UAC off
   an administrator's single token is High *(check)*.
3. **The access check** (as in `win-access-token`, plus deny ACEs and deny-only SIDs) [DACL, MIC]:
   1. Mandatory integrity first: a write to an object whose level is above the process's is denied (no write-up).
      Unlabelled objects are Medium, so here this check always passes; it is shown so that it is not mistaken for the
      reason.
   2. Then the DACL, top down. An ACE whose SID is not in the token is skipped. An **allow** ACE counts only for an
      **enabled** SID; a deny-only SID matches **deny** ACEs only. An ACE that matches but does not cover the right
      asked for is skipped. The first ACE that matches and covers the right decides (allow or deny). None: denied
      (implicit deny).
   3. A task that needs a privilege is allowed when the token holds it. (A program enables a held privilege itself;
      the sim does not show enabled/disabled privileges.)
   - **Tie-break T1:** when a deny and an allow both match and cover the right, the order of the DACL decides (the
     earlier one), as in `win-ntfs-inheritance`. A deny-only SID still matches a deny ACE.
4. **Elevation** [UAC, UACS]. "Run as administrator" shows a prompt: for an administrator in Admin Approval Mode a
   **consent** prompt (yes / no); for a standard user a **credential** prompt for an administrator account. On
   approval a **new process** starts: an administrator's runs with her linked full token; a standard user's runs **as
   the account typed in** (`admin-it`), with that account's full token, not as marko.
5. **Inheritance** [UAC]. A process gets its parent's token. Elevation never changes a running process: Explorer
   stays filtered after the console is elevated; a child of the elevated console is High, a child of Explorer Medium.
6. **Built-in Administrator** [UACS]. The RID 500 account is not in Admin Approval Mode by default (policy "Admin
   Approval Mode for the Built-in Administrator account" disabled): one full token, no prompt *(check)*.
7. **Network logon** [REM]. A *local* administrator account logging on over the network gets the filtered token
   (`LocalAccountTokenFilterPolicy` = 0, the default); a *domain* administrator gets the full token; with the policy
   set to 1 a local account gets the full token too; the built-in Administrator (rule 6) gets the full token *(check)*. Model function and tests only; the page names it in
   the explanation (no preset in the task).
8. **UAC off** (derived) means the policy "Run all administrators in Admin Approval Mode" disabled (EnableLUA = 0),
   not the "never notify" slider (with which tokens stay split and elevation is silent). No prompt: "Run as administrator" starts the process with the user's own token (an
   administrator's is already full; a standard user's stays standard) *(check)*. The plan therefore never elevates
   with UAC off.

## One step

One action, then its check. The plan, from the params `account`, `uac`, `task`, `children`:

1. `logon`: LSA builds the token(s) (rules 1, 2, 6).
2. `explorer`: `explorer.exe` starts with the filtered token, or the only one.
3. `attempt` by `explorer.exe`: the task, checked (rule 3).
4. Only if 3 was denied and UAC is on and the account is in Admin Approval Mode or standard: `prompt` (consent or
   credentials, rule 4);
5. `approve`: `cmd.exe` starts elevated (rule 4);
6. `attempt` by `cmd.exe`: the same task, checked with the full token.
7. With `children` on and an elevated `cmd.exe`: `spawn` of `notepad.exe` by `cmd.exe` (rule 5).
8. With `children` on: `spawn` of `notepad.exe` by `explorer.exe` (rule 5).

Steps = 3, + 3 when step 3 is denied and elevation is possible, + 1 or 2 with `children`.

## Expected results (checked by `sim.test.js`, and by hand before coding)

| preset | params | steps | results |
|---|---|---|---|
| `admin-filtered` | admin, UAC on, progfiles | 6 | step 3 denied (implicit; Administrators deny-only, Users read only), step 6 allowed at row 2 (Administrators) |
| `time-zone` | admin, UAC on, timezone | 3 | step 3 allowed (`SeTimeZonePrivilege` kept) |
| `standard-user` | standard, UAC on, progfiles | 6 | step 3 denied (implicit), step 4 credentials prompt, step 5 `cmd.exe` as `admin-it` (High), step 6 allowed at row 2 |
| `child-inherits` | admin, UAC on, progfiles, children | 8 | as admin-filtered; step 7 notepad under cmd: full, High; step 8 notepad under explorer: filtered, Medium |
| `uac-off` | admin, UAC off, progfiles, children | 4 | step 1 one full token (High); step 3 allowed at row 2; step 4 notepad under explorer: full, High |

Other params: builtin-admin → 3 steps, allowed at row 2; standard with UAC off → 3 steps, denied, no prompt;
`hklm` as `progfiles`; `service` for ana: denied (INTERACTIVE matches, query only), elevated allowed at row 2;
`timezone` for marko: allowed (3 steps). Default params = `admin-filtered`: `sim.json` `steps` = 6.

## Legend

Enabled SID: filled chip. Deny-only SID: hatched chip with a stop octagon. Privilege: key chip. Integrity: badge M / H.
Filtered vs full token: thin vs thick card border. Allowed ✓, denied ✕. Changed: the kit's highlight on the chip or
row the last check used.
