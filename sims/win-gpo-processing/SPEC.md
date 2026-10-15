<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-processing: spec

One concept: **a GPO change is not pushed; the client picks it up in its next processing pass: the computer part at
startup, the user part at logon (foreground), and both in the background refresh every 90 min plus a random 0–30 min
offset (5 min on a DC) or at `gpupdate`. Folder Redirection and Software Installation apply only in a synchronous
foreground pass; with fast logon optimisation the first startup or logon after the change is asynchronous and only
asks for the next one to be synchronous.**

Task: `docs/tasks/w2/win-gpo-processing.md` (catalogue §4.5.2). Stepper; the processing pass of each event is drawn
with kit view K4 (rule table, `kit/ruletable.js`, marks set by the page), under a GPO card, a host card and a time
axis drawn by the page.

## Scene

| Thing | Data |
|---|---|
| Host | `PC07` (a Windows client, user `ana` logged on), or `DC01` (a domain controller, an administrator logged on) |
| GPO | `Workstation Settings`, version 4 applied everywhere at the start; the administrator's edit at t = 0 makes it 5 |
| File server | `hq-fs01` (`\\hq-fs01\home$`, `\\hq-fs01\apps$`) |
| Time | minutes, t = 0 is the edit. PC07 started at t = −10 (startup and ana's logon). DC01 refreshed last at t = −2 |

Settings in the GPO, one per client-side extension (CSE):

| Setting | CSE | Part | Value 4 → 5 | Needs a synchronous pass |
|---|---|---|---|---|
| `screensaver`: screen saver timeout | Registry (Administrative Templates) | user | 900 s → 300 s | no |
| `lock`: lock after inactivity (never changed) | Security | computer | 900 s | no |
| `folders`: Folder Redirection of Documents | Folder Redirection | user | local → `\\hq-fs01\home$` | yes |
| `msi`: a computer-assigned package | Software Installation | computer | none → `viewer.msi` | yes |

## Params

| Param | Values | Default | Note |
|---|---|---|---|
| `dc` | off / on | off | added: the host is DC01 instead of PC07 (the `dc` preset needs it) |
| `change` | `screensaver`, `folders`, `msi` | `screensaver` | the one setting edited at t = 0 |
| `action` | `wait`, `gpupdate`, `force`, `relog` | `wait` | added (what happens after the edit) |
| `fastLogon` | on / off | on | off = "Always wait for the network at computer startup and logon" enabled; disabled on DC01 |
| `seed` | 1–9 | 3 | the random offsets; disabled on DC01 (no offset) |

Actions: `wait` nothing; `gpupdate` / `force` run `gpupdate` / `gpupdate /force` at t = 5, and if the change is still
not applied, the user accepts the prompt: a logoff and logon (user setting) or a restart (computer setting) at t = 10;
`relog` a logoff and logon (user setting) or a restart (computer setting) at t = 30, and once more at t = 60 if the
change is still not applied.

## Rules

1. **Passes.** Computer policy is processed at startup, user policy at logon (foreground); both are processed in the
   background refresh. A restart is a startup and a logon (both parts); a logoff and logon is the user part only.
   *Source: Microsoft Learn, "Understand the Effect of Fast Logon Optimization and Fast Startup on Group Policy"
   (title checked), "Foreground and background processing".*
2. **Refresh interval.** The background refresh comes 90 min after the previous refresh, startup or logon, plus a
   random offset of 0–30 min; on a domain controller every 5 min with no offset. The offset is
   `Simdeck.rng(seed).int(31)`, one draw per scheduled refresh in order. Seed 3 draws 22, 1, 14: PC07, started at
   −10, refreshes at −10 + 90 + 22 = **102**. *Source: Microsoft Learn "Group Policy refresh interval for computers"
   (title checked: 90 min, offset 0–30 min). DC 5 min: "Group Policy refresh interval for domain controllers"
   (check: only a secondary source seen; offset 0 is the model's).*
3. **What a pass does per CSE.** A CSE whose part is not processed: *not run*. A CSE with nothing new (applied
   version = GPO version) and no `/force`: *skipped, unchanged*. Otherwise, if the CSE needs a synchronous pass and
   this pass is not one (every background pass and `gpupdate` is asynchronous, a foreground pass may be either): it
   applies nothing and **signals** that the next foreground pass of its part (startup for computer, logon for user)
   must be synchronous (`pending.syncNext[part] = true`). Otherwise it **applies** (applied version := GPO version;
   *reapplied* under `/force` when nothing was new). *Source: the same article, "CSE processing requirements" (Folder
   Redirection and Software Installation: require synchronous processing; called in the background; exit after
   signalling), "How Fast Logon Optimization affects CSE processing".*
4. **Fast logon optimisation** (on by default on clients): a foreground pass is asynchronous unless the part's
   `syncNext` flag is set. With it off ("Always wait for the network at computer startup and logon" enabled), every
   foreground pass is synchronous. A domain controller always processes synchronously in the foreground *(check:
   fast logon optimisation is a client feature)*. After a synchronous foreground pass the part's flag is cleared.
   Consequence: a Folder Redirection change takes **two logons** and an assigned package **two restarts** when no
   background pass came first (the article's example 1), and **one** when a background refresh or `gpupdate` came
   first (example 2).
5. **`gpupdate`** runs a background pass of both parts now; it does not restart the refresh timer *(check)*. A CSE
   that cannot apply asks for a logoff (user part) or a restart (computer part). **`gpupdate /force`** reapplies every
   setting, unchanged ones too; Folder Redirection and Software Installation still only signal *(check: `/force`
   makes them signal even when unchanged)*. *Source: Microsoft Learn "gpupdate" (`/force`, `/logoff`, `/boot`, `/sync`).*
6. **Unchanged is skipped.** Most CSEs skip when nothing they handle changed; Security is reapplied every 16 hours
   anyway *(check)*, which no run here reaches (the axis ends before t = 300).
7. **Timer restart.** A foreground pass (logon or restart) restarts the refresh timer: next = t + 90 + a new offset
   (DC: t + 5). A refresh restarts it the same way.

## Tie-breaks

- **T1. A foreground pass and a refresh in the same minute:** the foreground pass runs, and the refresh does not: its
  timer restarts from the foreground pass. (Unreachable from the page's schedules; tested on a model state.)
- **T2. `gpupdate` and a refresh in the same minute:** `gpupdate` first, and the refresh still runs in that minute
  (the timer is not restarted). (Unreachable from the page; tested on a model state.)
- **T3. A flag already set is not news.** A refresh in which a CSE signals again for a part already flagged, and
  nothing applies, is **quiet**.
- **T4. Quiet refreshes before a planned action are not steps.** They are processed and drawn on the axis as thin
  ticks, and the caption of the next step names them (DC01: refreshes every 5 min).
- **T5. The end.** The run ends when the edited setting is applied on the host, or, with no action left, at the first
  quiet refresh ("waiting will not apply it").
- **T6. Within a pass the CSEs run in table order:** Registry, Security, Folder Redirection, Software Installation.

## Steps

Step 1 is always the edit at t = 0 (nothing runs on the host). Then one event per step (T4).

| Preset | Params | Steps | Events (seed 3) |
|---|---|---|---|
| `background` | defaults | 2 | edit 0; refresh 102 (90 + 22): applied |
| `gpupdate` | action gpupdate | 2 | edit 0; gpupdate 5: applied |
| `folder-redirection` | change folders, action relog | 3 | edit 0; logon 30 async: signals; logon 60 sync: applied |
| `msi-two-reboots` | change msi, action relog | 3 | edit 0; restart 30 async: signals; restart 60 sync: installed. Fast logon off: 2 (restart 30 sync) |
| `dc` | dc on | 2 | edit 0; refresh 3: applied |
| `force-folders` | change folders, action force | 3 | edit 0; gpupdate /force 5: everything reapplied, Folder Redirection signals; logon 10 sync: applied |

Other runs (seed 3): `folders`/`msi` + `wait`: edit 0; refresh 102 signals; refresh 193 (102 + 90 + 1) quiet → end,
not applied. `msi` + `gpupdate`: edit 0; gpupdate 5 signals; restart 10 sync: installed. DC01 + `folders` + `relog`:
edit 0; refresh 3 signals; (quiet refreshes 8, 13, 18, 23, 28) logon 30 sync: applied. DC01 + `folders` + `gpupdate`:
edit 0; refresh 3 signals; gpupdate 5 (signals again); (quiet refresh 8) logon 10: applied — **4**, the maximum over all 432 parameter
combinations (2: 162, 3: 198, 4: 72; checked with an independent hand model). `sim.json` `steps` = 2 (defaults).

## Out of scope

Precedence (`win-gpo-precedence`), slow links (`win-gpo-slow-link`), loopback, preference tattooing, separate
refresh timers for the computer and the user part, first logon and roaming profiles (always synchronous), fast
startup (hibernation instead of a shutdown).
