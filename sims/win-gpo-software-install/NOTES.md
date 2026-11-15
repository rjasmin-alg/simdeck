<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-software-install: notes

Thread t-0460, 2026-11-15. Task `docs/tasks/w3/win-gpo-software-install.md`.

## Decisions

- **Model reuse.** `models/` has no GPO model yet. The task's dependency on `win-gpo-processing` is its rules 3 and 4
  (a CSE that needs a synchronous pass only signals in an asynchronous one; fast logon makes the first foreground pass
  asynchronous; a synchronous pass clears the flag). This sim needs them for one extension only, so `siPass` re-states
  them in a few lines instead of copying that sim's `pass` (four CSEs, versions, `/force`), which would bring code this
  sim never runs. Same results for Software Installation; `syncNext` is the same flag per part. If the coordinator
  promotes a GPO-processing model, `siPass` is the piece to replace.
- **A step is one event**, as the task says. Step 0 is the moment after the administrator linked the package (deploy
  runs) or the state with Viewer installed (move runs). The script per run: (`move`) → (`gpupdate`) → the target's
  foreground event (PC07 starts / ana logs on) until Software Installation does more than signal → one follow-up that
  shows the result to the user (ana logs on; opens `report.vwr`; opens "Get programs"). SPEC.md "Steps".
- **Fast logon for the user part too.** The task states the second-reboot rule only for the computer, but Software
  Installation needs a synchronous logon as well, so with fast logon on, user deployments take two logons. This is
  what makes the task's step counts work: `assign-user` = logon 1 signals, logon 2 advertises, first use installs
  (3); `publish-user` = logon 1 signals, logon 2 offers, "Get programs" installs (3).
- **Third step of `assign-computer` and `share-perms`** is ana's logon after the deciding startup: it shows the
  per-machine install (or its absence: her own Read on the share did not help, the task's misconception 3).
- **`out-of-scope` is 4 steps** with and without the uninstall option: move; startup 1 (async, signals: the change is
  news); startup 2 (sync: removes, or leaves it unmanaged); ana's logon. The task says "removed at the next boot":
  with fast logon that is the next *synchronous* boot, the second.
- **Scene**: domain `quillmoor.example` and `OU=Office` (both PC07 and ana), `OU=Lab` as the move target, as in the
  other GPO sims; `report.vwr` is the file ana opens. Group names `Domain Users`, `Domain Computers` are data
  (`translate="no"`), as Windows shows them.
- **Panel**: `computersCanRead` is shown only for a computer deployment that installs (not with `move`), and
  `removeOnScope` only with `move` (params' `visible`), so the panel fits at 1920×1080 in Croatian. The GPO card always
  shows both values.
- **Icons** are CSS shapes (parcel, pin, shop window with an awning, dashed shortcut arrow, solid tick, boxed cross,
  monitor, person), so the legend survives grayscale; each state also has its word. Pass badges: background dotted,
  asynchronous dashed, synchronous thick, each with its word.
- **Changed highlight**: the target card whose Viewer state (or OU) changed has the kit's `sd-changed`; the new
  "next startup/logon: synchronous" flag is highlighted; the current event row has a thick outline and its result on
  the highlighter.

## Deviations from the task

1. **Two params added**: `move` (the `out-of-scope` preset needs a run that starts installed and moves the target)
   and `gpupdate` (the task's misconception "gpupdate installs the package" and rule 5). `slowLink` exists in the model
   only (rule 5's slow-link skip is tested; the page leaves slow links to `win-gpo-slow-link`).
2. **State fields**: the task's `{ deployment, shareReadable, fastLogon, events, pc: { installed }, user: { advertised,
   installed }, removeOnScope, inScope }` plus `user.offered` (published), `user.viaComputer` (T1), `pc.failed`,
   `syncNext`, `managed` and the run bookkeeping.
3. **Publish + auto-install by file type** (task rule 4, "(check)"; on by default) is not modelled: a publish run
   never opens the file. The caption and the explanation mention it.
4. **Captions follow COMMON.md's term rule** (English term in italics, Croatian in parentheses: *assigned*
   (dodijeljen)) rather than the task's "Dodijeljeno računalu (*assigned*)"; the wording is otherwise the task's.
5. **No `docs/tasks/OPEN.md` entry**: the gate's scope rule refuses changes outside `sims/<id>/`; owner questions are
   in the report.

## Sources

- Microsoft Learn, "Group Policy software installation overview" *(check title)*: MSI and transforms only, UNC path,
  assign vs publish, publish not for computers, advertise and install on first use, "Install this application at
  logon", "Uninstall this application when it falls out of the scope of management".
- Microsoft Learn, "Use Group Policy to remotely install software" *(check title)*: the share must be readable by the
  computer accounts (Domain Computers) for computer assignment; installs at startup.
- Microsoft Learn, "Understand the Effect of Fast Logon Optimization and Fast Startup on Group Policy" (title checked
  in `win-gpo-processing`): Software Installation needs a synchronous foreground pass; signals in the background.
- `sims/win-gpo-processing/SPEC.md` rules 3–5 (`@ 9026db3`), `sims/win-gpo-slow-link` (Software Installation skipped
  over a slow link).

## Unchecked *(check)*

- The two documentation titles above (no network in this thread).
- Fast logon optimisation delays **user**-assigned and published packages to the second logon, as it does for the
  computer (SPEC rule 6).
- T1: computer and user assignment of the same package → the computer install wins, the user pass finds it.
- Rule 7 detail: the removal of an out-of-scope package also waits for a synchronous pass under fast logon.
- Publish + "Auto-install this application by file extension activation" on by default (mentioned, not modelled).
- T4: after a failed synchronous install the flag is cleared, so with fast logon the retry comes every second startup.
- Croatian terms below; the Croatian name of "Get programs" (written „Nabavi programe”).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| software installation | instalacija softvera (as in `win-gpo-processing`) |
| assign / assigned | dodijeliti / dodijeljen *(check)* |
| publish / published | objaviti / objavljen *(check)* |
| advertise / advertised | oglasiti / oglašen (prečac bez instalacije) *(check)* |
| package | paket |
| foreground processing | obrada u prvom planu (as in `win-gpo-processing`) |
| fast logon optimization | optimizacija brze prijave (as in `win-gpo-processing`) |
| share | dijeljena mapa (the task's term; the glossary has `share` → *dijeljeni resurs* from uvod-u-linux, not used here) |
| Get programs | Nabavi programe *(check: the Croatian Windows label)* |
| scope of management | opseg (upravljanja) |

## Shared requests

- **Kit:** `.sd-ctl[hidden] { display: none; }` in `kit.css`. A param's `visible()` sets `hidden` on the control,
  but `.sd-ctl { display: flex }` wins, so the control stays visible. Worked around in the page (one rule); the same
  workaround is in `sims/antenna-array/`.
- **Models:** when a GPO-processing model is promoted from `win-gpo-processing`, this sim's `siPass` (rules 5, 6) can
  use it.

## Tags

Topic `windows-admin`, tag `group-policy` (both in `tags.json`), level `intro`.

## Time

Start 14:07, done 14:40 (about 35 min wall clock ; one session, including a fresh-review round).

## Review

A fresh reviewer read the diff against SPEC.md, re-derived the preset counts and the 128-combination split by hand,
checked the domain facts, and ran 57 single mutations of `sim.js`: 45 caught at first. Added since: a user assignment
removed out of scope (the advertisement goes with it, `open` finds no program), `flagged` false without fast logon
(the caption's reason), a deeper local path for rule 1. Fixed from the review: a transform alone is no longer
deployable (rule 1); the retry after an access-denied failure is "the next synchronous startup", not "every startup"
(T4); the published caption no longer claims "no file type" and mentions auto-install by file type; "optimization"
spelled one way in English; Croatian wording (*pravo čitanja*, "Viewer bi bio uklonjen samo uz …", *oglašava
(advertised)*, `objavljeno` as the option); fast logon shown on both target cards. Survivors left, harmless here:
`hasWork` ignoring `managed` in move runs, the starting `advertised`/`managed` flags of runs where they are never
read, the store installing an advertised package (no store event in assign runs), the order of non-final outcomes,
`initial()` defaults that `P()` always supplies, and the slow link also skipping a background pass (model only).
