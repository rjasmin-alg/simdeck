<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-software-install: spec

One concept: **an MSI package deployed by Group Policy is assigned to a computer (installed at startup, under the
computer's account), assigned to a user (advertised at logon, installed at first use, or fully at logon) or published to
a user (offered in "Get programs", installed only when the user asks); Software Installation runs only in a
synchronous foreground pass, so it takes a restart or a logon, and with fast logon optimisation the second one.**

Task: `docs/tasks/w3/win-gpo-software-install.md` (catalogue §4.5.2). Stepper. Builds on `win-gpo-processing`
(its rules 3 and 4: a CSE that needs a synchronous pass only signals in an asynchronous one, and fast logon makes the
first foreground pass asynchronous); `models/` has no GPO model yet, so the rule is re-stated here as `siPass`, a
smaller function than that sim's `pass` (one CSE, both parts), not a copy.

## Scene

| Thing | Data |
|---|---|
| Domain | `quillmoor.example`, OU `Office` with the computer `PC07` and the user `ana` (both in scope) |
| GPO | `Deploy Viewer`, linked to `OU=Office`, one package: `\\hq-fs01\pkg$\viewer.msi` (product "Viewer", opens `.vwr` files) |
| Share `pkg$` on `hq-fs01` | Read for Domain Users (always) and for Domain Computers (the `computersCanRead` param) |
| Deployments (cards) | assign to computer · assign to user · assign to user + "Install this application at logon" · publish to user · (publish to computer: not possible) |
| Events | `gpupdate` (ana runs it), `boot` (PC07 starts), `logon` (ana logs on), `open` (ana opens `report.vwr`), `store` (ana opens "Get programs" and installs Viewer), `move` (the administrator moves the target to `OU=Lab`, outside the GPO's scope) |
| Results | computer: installed / failed (access denied); user: advertised (shortcut and file type only) / offered (in "Get programs") / installed; removed / stays (out of scope) |

## Params

| Param | Values | Default | Note |
|---|---|---|---|
| `deployment` | `computer`, `user`, `user-at-logon`, `publish` | `computer` | the task's four cards |
| `computersCanRead` | on / off | on | Domain Computers have Read on `pkg$`; only a computer deployment reads it (disabled otherwise) |
| `fastLogon` | on / off | on | fast logon optimisation (client default); off = "Always wait for the network at computer startup and logon" |
| `removeOnScope` | on / off | off | "Uninstall this application when it falls out of the scope of management"; matters only with `move` |
| `move` | on / off | off | **added**: the run starts with Viewer installed and the target (PC07, or ana) is moved out of the OU; the `out-of-scope` preset needs it |
| `gpupdate` | on / off | off | **added**: ana runs `gpupdate` first (the task's misconception "gpupdate installs the package") |
| `slowLink` | model only | off | rule 5's slow link; not on the page (`win-gpo-slow-link` is the sim for it) |

The **target** of a deployment is PC07 (its computer part) for `computer`, and ana (her user part) for the others.
Its **foreground event** is `boot` for PC07 and `logon` for ana.

## Rules

1. **Only Windows Installer packages from a UNC path.** A deployment takes an `.msi` on a UNC share,
   `\\server\share\…` (`.mst` transforms are added to a package, never deployed alone); a local path, a transform
   alone or another installer is refused
   (`deployable(path)`). The scene's package is deployable. *Source: Microsoft Learn, "Group Policy software
   installation overview" (check title); "Use Group Policy to remotely install software" (check title).*
2. **Assign to computer**: Software Installation installs the package in the computer's synchronous startup pass,
   before the logon screen, running as SYSTEM, so the share is read with the **computer** account (Domain Computers
   need Read). Without Read the install fails with *access denied* (and is tried again at every startup); ana's own
   rights on the share do not matter. The install is per machine: ana sees Viewer at her next logon.
3. **Assign to user**: in ana's synchronous logon pass the package is **advertised**: a Start menu shortcut and the
   `.vwr` file type, nothing installed. The first use (ana opens `report.vwr`) installs it. With "Install this
   application at logon" the logon pass installs it fully, and `report.vwr` opens straight away.
4. **Publish to user**: the logon pass only **offers** it in "Get programs": no shortcut, nothing in the Start menu.
   It installs when ana installs it from there (`store`). "Auto-install this application by file extension
   activation" is on by default for a published package, so opening a `.vwr` file would install it too *(check)*;
   not modelled (a publish run has no `open` event), but the caption and the explanation say it. **Publishing to a computer is not possible**
   (`allowed('publish', 'computer') === false`); the page shows that card struck out.
5. **Foreground only.** Software Installation never installs in a background pass (`gpupdate`, the background
   refresh): there it only **signals** that the target's next foreground pass must be synchronous, and `gpupdate`
   asks for a restart (computer) or a logoff (user). In a foreground pass over a slow link it is skipped
   (default policy), and then nothing is signalled (`slowLink`, model only). *Source: `win-gpo-processing` rule 3;
   `win-gpo-slow-link`.*
6. **Fast logon optimisation** (on by default): a foreground pass is asynchronous unless the previous pass of that
   part signalled; an asynchronous one only signals, so the first startup (logon) after a change does nothing and the
   second installs. Off: every foreground pass is synchronous. After a synchronous pass the part's flag is cleared.
   This holds for the user part as well as the computer part *(check: the article lists Software Installation among
   the extensions that need a synchronous logon; the task states it only for the computer)*. *Source:
   `win-gpo-processing` rule 4; Microsoft Learn "Understand the Effect of Fast Logon Optimization and Fast Startup on
   Group Policy" (title checked there).*
7. **Out of scope.** When the target leaves the GPO's scope (`move`), its next synchronous foreground pass (same
   rules 5 and 6: the change is news, so an asynchronous pass signals) **removes** Viewer if "Uninstall this
   application when it falls out of the scope of management" is set, and otherwise leaves it installed, no longer
   managed. *(check: that the removal also waits for a synchronous pass under fast logon.)*

## Tie-breaks

- **T1. Computer and user assignment of the same package:** the computer install wins; the user's pass finds the
  product installed per machine and does nothing (`viaComputer`) *(check)*. Not reachable from the page (one
  deployment at a time); tested on a model state.
- **T2. Share Read and fast logon together:** the read happens only in the synchronous pass, so with fast logon an
  unreadable share fails at the **second** startup; the first only signals.
- **T3. `gpupdate` and fast logon:** a `gpupdate` that signalled makes the next foreground pass synchronous, so
  the package arrives at the first restart (logon) after it, even with fast logon.
- **T4. A failed install is retried** at the next synchronous startup (the failed pass clears the flag, so with fast
  logon every second startup) *(check)*; the run stops after the first failure and ana's logon
  (it would fail the same way).
- **T5. Slow link:** the run ends at the skipped pass (nothing signalled, nothing would change).
- **T6. `computersCanRead` matters only to a computer deployment that installs** (Domain Users can always read; a
  `move` run starts installed and the removal is not modelled as reading the share).

## Steps

One event per step. Step 0: deploy runs: the administrator has just linked `Deploy Viewer` with the package; PC07 is
running with ana logged on; nothing installed. `move` runs: Viewer is installed (by the chosen deployment) and managed.

Script: (`move` first, if set) → (`gpupdate`, if set) → the target's foreground event until the Software Installation
pass is not a signal → the follow-up: PC07: ana's `logon` (she sees it, or does not); ana, assigned: `open`;
ana, publish: `store` (deploy) or `open` (move: does `report.vwr` still open?).

| Preset | Params | Steps | Events |
|---|---|---|---|
| `assign-computer` | defaults | **3** | boot 1 async: signals; boot 2 sync: installed; logon: ana sees Viewer. Fast logon off: **2** (boot 1 installs; logon) |
| `assign-user` | deployment user | **3** | logon 1 async: signals; logon 2 sync: advertised; open `report.vwr`: installed |
| `publish-user` | deployment publish | **3** | logon 1 async: signals; logon 2 sync: offered (nothing visible); store: installed |
| `share-perms` | computersCanRead off | **3** | boot 1 async: signals; boot 2 sync: failed, access denied; logon: ana has no Viewer |
| `out-of-scope` | move on, removeOnScope on | **4** | move PC07 to `OU=Lab`; boot 1 async: signals; boot 2 sync: removed; logon: gone. Option off: same 4 steps, boot 2 leaves it installed |

Other runs: `user-at-logon`: logon 1 signals, logon 2 installed, open (opens at once): 3. Any fast-logon-off run is one
step shorter. `gpupdate` on: gpupdate signals, then one foreground event installs (T3): the same count as fast logon on
without it. Counts over all 128 page combinations: 2 steps in 16 (deploy, fast logon off, no `gpupdate`), 3 in 64,
4 in 48 (`move` with fast logon on or `gpupdate`); the maximum is **4** (checked by an independent enumeration in
`sim.test.js`). `sim.json` `steps` = 3 (defaults).

## Out of scope

Non-MSI installers, upgrades and supersedence, packaging, other deployment systems, the slow link itself (only rule
5's model param), category and auto-install options of published packages, roaming profiles and first logon (always
synchronous), the background refresh timer (`win-gpo-processing`).
