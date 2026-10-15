<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-processing: notes

New stepper (task `docs/tasks/w2/win-gpo-processing.md`, catalogue `win-gpo-processing`, §4.5.2, wave 2b). The pass
of each event is drawn with kit view **K4, rule table** (`kit/ruletable.js`), one row per client-side extension, with
the marks set by the page; the GPO card, the host card and the time axis are the page's own. Rules, tie-breaks and
expected numbers: `SPEC.md`.

## Decisions

- **Layout.** Top: the GPO card `Workstation Settings` (the three settings the task names, a lamp each for "in the
  GPO" and "on PC07": filled = version 5, hollow = version 4, with the version written beside it and a status word:
  same, waiting, waits for a synchronous logon/startup, ✓ applied) and the host card (now, next refresh with its
  `base + offset`, fast logon state, whether the next logon and the next startup will be synchronous). Middle: the
  time axis. Bottom: K4 with Registry, Security, Folder Redirection and Software Installation; the mark column
  header names the event (`t = 30 · logon, asynchronous`).
- **Axis.** Foreground passes (startup, logon, restart) are tall bars, background passes (refresh, gpupdate) short
  bars; a bar is filled when the edited setting was applied in that pass, hollow otherwise (the task's
  "applied (filled) / skipped (hollow)"); the edit is a dashed line with ◆; the random offset is a bracket under the
  axis from `previous + 90` to the refresh, labelled `+22`. What comes next (the scheduled refresh and the planned
  action) is drawn dashed. Quiet refreshes skipped over (DC01) are thin grey ticks. Labels are placed in rows after
  layout so that none overlaps (2 rows at 1920×1080, up to 6 on a phone). The axis range is fixed per run.
- **K4 marks:** applied (and reapplied under `/force`, with a note) = `win` "applied"; signals = `hit` "waits" with
  the note "next logon/startup synchronous"; nothing new = `no` "–" with the note "nothing new: skipped"; the other
  part = `skip` "not run" (hatched). The edited setting's row has the tag "edited".
- **Step 1 is the edit itself** (at t = 0, nothing runs on the host). That is how the task's 2-step presets count
  (`background`: the edit, then the refresh at 97/102) and it makes the first misconception visible: the GPO lamp is
  on, the PC07 lamp is off.
- **One refresh timer** for the computer and the user part (the task's model has one `nextRefresh`). Windows keeps
  one per part, the computer one started at startup and the user one at logon; the page's timer restarts at every
  foreground pass (rule 7 of the task). The explanation does not claim more.
- **One CSE per setting, change tracked per setting**: a CSE whose own setting did not change is "nothing new". In
  Windows the engine calls a CSE when a GPO that holds settings for it changed version (any change in that GPO's
  part), so e.g. editing the screen saver could also call Folder Redirection. The sim keeps the simplification so the
  table shows one change at a time. *(check)*
- **Follow-up after gpupdate.** When `gpupdate`/`/force` cannot apply the change, the user accepts its prompt: a
  logoff and logon (user setting) or a restart (computer setting) 5 min later (what `/logoff` and `/boot` do).
- **Names**: `PC07`, `ana`, `DC01`, `admin`, `hq-fs01` as in the task and the neighbouring sims; the package is
  `viewer.msi` (generic, no product); the fourth setting "lock after inactivity" (Security, never edited) is the
  computer setting `win-gpo-precedence` uses.
- **Model is promotable**: `offsetAt`, `schedule`, `syncForeground`, `pass`, `nextEvent`, `processNext` are pure and
  string-free, should `win-gpo-slow-link` or `win-gpo-software-install` want them.

## Deviations from the task

1. **`folder-redirection` preset: 3 steps, not 4, and no refresh before the logon.** The task's sequence (refresh at
   97 skips; logon at 120 asynchronous, flags sync, not applied; logon at 200 applied) contradicts Microsoft's
   article: Folder Redirection *is called* in background processing and, unable to apply there, signals that the next
   logon must be synchronous (the article's table and "Example 2": with a background refresh before the logoff, one
   logon is enough). The two-logon case is the article's "Example 1" (no background pass between the edit and the
   logon), so the preset logs off and on at t = 30 (asynchronous: signals) and t = 60 (synchronous: applied), with the
   task's caption. The one-logon case is shown by `force-folders` and by any run with `gpupdate`.
2. **`msi-two-reboots`: 3 steps, not 4** (edit, restart 30 asynchronous: signals, restart 60 synchronous: installed;
   with fast logon off 2 steps). The task gave no event list for its 4.
3. **Seed 3 gives a 22 min offset, not 17**: the task's 17 was marked *(check: derived from the kit's seeded
   random)*; `Simdeck.rng(3).int(31)` is 22. So `background` applies at t = 102 (80 + 22), not 97. Captions take the
   numbers from the model.
4. **Added params**: `dc` (a toggle "Domain controller DC01", for the `dc` preset; a choice did not fit the panel at
   1920×1080) and `action` (wait | gpupdate | /force | log off / restart), because the task's presets need events the
   three task params cannot produce.
5. **Added a sixth preset `force-folders`** (gpupdate /force with a Folder Redirection change: everything is
   reapplied, Folder Redirection still waits; one synchronous logon applies it). It is the task's misconception
   "gpupdate /force applies everything without logoff" and the article's one-logon case.
6. **Drive Maps** (task rule 2, "check: drive-map preferences run in background"): the article says the opposite —
   the Drive Maps preference extension requires synchronous processing and is *not* called in the background. It is
   not on the page (one CSE per edited setting); noted here and in the report.
7. **Rule 7 tie-break unreachable from the page**: no schedule makes a logon and a refresh fall in the same minute
   (PC07's first refresh is at 80–110, the logons at 30/60/10; DC01's refreshes at 3 + 5k). Tested on model states
   (SPEC T1, T2).
8. **No `docs/tasks/OPEN.md` entry**: the gate's scope rule refuses any change outside `sims/<id>/`; the owner
   questions are here and in the report.

## Sources

- Microsoft Learn, "Understand the Effect of Fast Logon Optimization and Fast Startup on Group Policy" (Windows
  Server 2012 R2 archive, jj573586; read in full in this session): asynchronous vs synchronous, foreground vs
  background ("all requested Group Policy refreshes that are performed by using GPUpdate.exe also run as background
  processing"), the CSE table (Folder Redirection and Software Installation: require synchronous processing, called
  during background processing; Drive Maps: synchronous, not called in background), Examples 1 and 2, Fast Logon
  Optimization on by default on clients, off at a first logon / roaming profile / synchronous logon scripts.
- Microsoft Learn, "gpupdate" (Windows commands; read in this session): `/force` reapplies all settings, by default
  only changed ones; `/logoff` and `/boot` for extensions that do not process on a background update cycle (user
  Software Installation and Folder Redirection; computer Software Installation); `/sync`.
- Microsoft Learn, "Group Policy refresh interval for computers" (title confirmed by search; 90 min, random offset
  0–30 min, also at startup; text seen in search snippets only).
- "Always wait for the network at computer startup and logon" (Computer Configuration\Administrative
  Templates\System\Logon), named in the article above.

## Unchecked *(check)*

- DC refresh every 5 min with no offset: only a secondary source (ITPro Today) seen for the 5 min; offset 0 is the
  model's.
- A domain controller (a server) processes synchronously in the foreground: fast logon optimisation is described as
  a client feature; the page disables the toggle on DC01.
- `gpupdate` does not restart the refresh timer.
- `gpupdate /force` makes Folder Redirection and Software Installation signal even when unchanged (commonly observed:
  `/force` asks to log off when Folder Redirection is configured).
- Security settings reapplied every 16 hours even if unchanged (the article's table does not say it; never reached on
  the axis).
- The change tracking per setting rather than per GPO version (see Decisions).
- Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| background refresh | osvježavanje u pozadini | task *(check)* |
| foreground processing | obrada u prvom planu | task *(check)* |
| client-side extension | proširenje na klijentu | task *(check)* |
| fast logon optimization | optimizacija brze prijave | task *(check)* |
| refresh interval | interval osvježavanja | task *(check)* (aliases only) |
| Folder Redirection | preusmjeravanje mapa | task *(check)* |
| Software Installation | instalacija softvera | simdeck *(check)* |
| Administrative Templates | administrativni predlošci | simdeck *(check)* |
| synchronous / asynchronous | sinkrono / asinkrono | simdeck |
| random offset | slučajni pomak | glossary has offset — pomak |
| assigned package | dodijeljeni paket | simdeck *(check)* |

## Checks

- Numbers: an independent Python hand model (mulberry32 re-implemented) of all 432 combinations (2 hosts × 3 changes
  × 4 actions × fast logon on/off × seeds 1–9) before the page was written: step counts (2: 162, 3: 198, 4: 72) and
  the event lists of the presets; the model agrees on every one.
- Browser sweep: 188 pages (the six presets and seven more param sets × every step × both languages, at 1920×1080
  and 375×812) from `file://`: no page scroll at 1920×1080, no stage overflow, no sideways scroll at 375×812,
  nothing outside the stage, no overlapping axis labels, no `undefined`/`NaN`/`null`/unfilled placeholder, no empty
  caption, no console errors or warnings. Found and fixed on the way: the header legend and two-line preset names
  pushed the panel to 900 px (shorter labels, the host as a toggle); the unit "min" sat on the last tick number; the
  axis of a run that ends waiting stretched to the next refresh nobody sees; six labels on a phone overflowed four
  rows.

## Shared requests

- **Kit legend swatches** for a tall and a short bar (`gp-tall`, `gp-short`, defined in the page CSS).
- **K4:** none (`at: -1` with page marks did everything).
- **Glossary:** the term pairs above.

## Tags

Topic `windows-admin`, tag `group-policy` (both in `tags.json`), level `intro`.

## Fresh review

A separate agent read the task, SPEC.md, the model, the tests, the strings and the page, re-implemented the model from
SPEC.md alone (all 432 combinations agree, step counts and event times) and made 47 single mutations of `sim.js`:
40 killed at once. Of the 7 survivors, 5 are equivalent in every reachable state (the DC guard in `syncForeground`,
which `initial` already covers by turning fast logon off; the end check with a plan left, which the collapse loop
never reaches; a restart's mode taken from either part, since a restart only follows a computer change; a dead
`applied` field on events, now removed; the `fastLogon` default, which the kit always passes) and 2 were real gaps,
now tested and killed: a background pass must not clear a flag, and seed 9 must not be clamped. It agreed that the
deviations from the task are justified by the Microsoft article. Fixed from it:
- **the host name vanished from the step-1 caption** of `msi-two-reboots` (one node used in two captions of the same
  step moved out of the first); `rich()` now always copies nodes, and the sweep checks captions for double spaces;
- `capForceApplied` no longer says /force is why a changed setting applied; the quiet-refresh captions say "this
  refresh, too" and name what waiting will not apply; the start caption's Croatian future tense; the `/force` preset
  hint says Folder Redirection waits for a logon, not a logoff;
- a step where a refresh applies the change before a planned gpupdate or logoff (DC01) says the planned step is no
  longer needed;
- DC01's two disabled controls give two different reasons; offsets under 3 min show the label without a bracket;
  the axis writes −10 with a minus sign, as the captions do; Croatian wording in the explanation.
Not changed: the disabled fast-logon toggle still shows its own value ("on") on DC01, with the reason under it; in the
`force-folders` step Software Installation also shows "waits" (the model's *(check)* assumption that /force makes it
signal), which the caption does not mention.

## Time

Start 2026-10-15 23:58 (reading); sources, hand model and SPEC, model and tests, page, gate passing and sweep by
00:18; fresh review and its fixes, status ready by 00:28: about 30 min wall clock, one session.
