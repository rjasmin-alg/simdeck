<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-sysvol-dfsr: notes

New stepper (task `docs/tasks/w3/win-sysvol-dfsr.md`, catalogue `win-sysvol-dfsr`, §4.5.1 and §5.21, wave 3). Rules
and expected numbers: `SPEC.md`.

## Decisions

- **Own drawing, not K2.** The scene needs two parallel pipes (AD replication and DFSR) between the same two DCs, and
  K2 draws one link per pair, from card centre to card centre, and routes a packet over the first link it finds. The
  page draws a three-column grid: DC01 | the two pipes | DC03, with the timeline under DC01 and the pipes and PC-B under
  DC03. The pipes are HTML lines (solid for AD, dashed for DFSR) that reach into the column gaps; what is in flight is a
  list under each line (direction, half, version, due tick or "waits for the WAN"); this step's delivery stays on the
  pipe with ✓ / ✕ and the highlight. A cut WAN breaks both lines with ✕ and turns the WAN pill dashed red.
- **Reuse of `win-ad-replication`.** The task says "reuses its DC cards and the AD replication pipe". Its model (USNs,
  UTD, HWM, attribute conflict resolution) is not needed here: a GPC delivery is one versioned value. Nothing is
  copied from its `sim.js`; the card look (mark, host, badge, changed highlight with an ink underline) follows its page.
  `models/` has no shared AD replication model, so there was nothing to include.
- **Versions.** Drive Maps is a user-side Group Policy preference, so a save bumps the *user* version: versionNumber
  327681 → 393217 (user 5 → 6, computer 1). The task's "GPC 5→6" is kept as the big number (v5, v6); the full
  versionNumber and its split are shown on each card, which teaches rule 3. The task's "a computer-settings edit adds
  1" is in the caption and the explanation as the counterpart.
- **Ticks.** Time is in ticks (takt), with no unit claimed; the explanation says real delays are minutes.
- **WAN back after 2 ticks**; a delivery due while the WAN is down goes right after it comes back, in the same tick.
- **Client refresh.** The task's events need a client refresh at different moments per preset (after both halves in
  `normal`, in the gap in `half-arrived` and `files-first`), which the three task params cannot express, so a param
  `refreshAt` (PC-B's background refresh tick) was added. When it falls before the last delivery, a final refresh
  follows one tick after the last delivery; when PC-B still holds other files than DC03 after that, a forced refresh
  follows (`gpupdate /force`, named once in the caption: it is the concept's remedy, as the task names it).
- **Two editors** is a toggle param (`twoEditors`), so the preset is reachable from params (the kit's presets are
  param sets). DC03's admin saves after DC01's in the same tick, so DC03's files win (last writer). The loser goes to
  `ConflictAndDeleted` on both DCs (each resolved the conflict) *(check)*.
- **GPMC status** is drawn on each DC card: "AD vN = SYSVOL vN in sync" or a dashed red box with ≠ and "mismatch".
  Equal versions with different content (two editors) show in sync, which is the point of that preset.
- **Names.** DCs and hosts from the estate's forest as in `win-ad-replication` (`qm-dc01`, `brk-dc03`); sites `HQ` and
  `Branch` (topologydrafter `two-sites`; DC03 is writable here, not its RODC). The GPO GUID and the file-server paths
  are made up.
- **Tags:** `active-directory` (task), plus `group-policy` and `replication`, both already in `tags.json`.

## Deviations from the task

- **Two params added:** `refreshAt` (range 1–12, default 5) and `twoEditors` (toggle). See above.
- **Step counts** (task 5 / 8 / 6 / 5, ours 4 / 8 / 5 / 5). `normal` is edit, AD, DFSR, refresh: 4 events; nothing
  else happens in it. `files-first` is edit, DFSR, refresh (skipped), AD, refresh: 5. Maximum 8 over every param
  combination (tested).
- **Drive Maps lives in `User\Preferences\Drives\Drives.xml`**, not `Registry.pol` (the task lists both); a Drive Maps
  GPO has no `Registry.pol` change.

## Sources

- Microsoft Learn, "Group Policy architecture" / "Group Policy processing": GPC in AD, GPT in SYSVOL, version numbers.
- [MS-GPOL] Group Policy: Core Protocol, §2.2 (GPC, GPT, `versionNumber`, `GPT.INI`): user version in the high 16 bits,
  computer version in the low 16 bits.
- Microsoft Learn, "SYSVOL replication migration guide: FRS to DFS Replication" and "DFS Replication overview": SYSVOL
  replicated by DFSR; conflict resolution by last writer; `ConflictAndDeleted`.
- `topologydrafter/js/samples.js`, sample `two-sites` (HQ and Branch over a tunnel): site names only.
- Task file (rules, presets, captions, terms); catalogue §5.21. No instructor material used.

## Checks

- Numbers: an independent Python hand model (thread library folder, `win-sysvol-dfsr-check.py`) gave every preset's
  events, versions and client state before the model was written; `sim.test.js` asserts the same.
- Model: every combination of the params (3 × 10 × 10 × 12 × 2 = 7200) ends converged, with 4–8 steps.
- Page sweep: every step of every preset and of a 600-combination param grid, in both languages at 1920×1080 (9080
  page loads): no console errors, no empty or unfilled caption, nothing clipped by the stage, no page scroll.
- `npm run gate -- win-sysvol-dfsr`: passes; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus every step of every preset in both languages.

## Unchecked *(check)*

- [MS-GPOL] section number for the versionNumber encoding (§2.2.4 from memory).
- Client behaviour on a GPC/GPT mismatch: that the client goes by the GPC version, applies whatever files are in
  SYSVOL, records the GPC version, and skips the GPO at the next normal refresh. (Real clients also read `GPT.INI`;
  whether a lower `GPT.INI` version changes anything is not confirmed.)
- GPMC's "AD / SYSVOL version mismatch" in the status view (Windows Server 2012 and later; the real view compares
  each DC with a baseline DC).
- DFSR conflict: last writer wins by time; the losing copy goes to `ConflictAndDeleted` on the member that resolved
  the conflict (here both).
- Croatian terms (task marks them *(check)*): spremnik pravila grupe (GPC), predložak pravila grupe (GPT), broj
  verzije, DFS replikacija, nepodudaranje, replikacija.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| Group Policy container (GPC) | spremnik pravila grupe | task *(check)* |
| Group Policy template (GPT) | predložak pravila grupe | task *(check)* |
| version number | broj verzije | task *(check)* |
| DFS Replication | DFS replikacija | task *(check)* |
| mismatch | nepodudaranje | task *(check)* |
| replication | replikacija | task |

## Shared requests

- **K2: parallel links between one pair of nodes** (`links[].lane` or an offset, and `packets[].link` to pick the
  link), so pages with two transports between the same two hosts (AD replication and DFSR here; control and data
  channels elsewhere) can use K2 instead of drawing their own pipes.

## Fresh review

A separate agent read the code against `SPEC.md`, ran 70 mutations of `sim.js` (27 survived: most equivalent in the
reachable states, such as the order key of the forced refresh, comparisons by seq only, dead `same` branches; the rest
real gaps, now tested) and swept the page in both languages. Fixed from it:

- The `files-first` refresh at t = 3 claimed "the mismatch left no trace" (the stale caption was tested before the
  newer-files one); now it says the client goes by the GPC number, and the stale caption shows only when PC-B applied
  under a mismatch.
- In-flight items showed their nominal due tick after a hold; `due` is now the real arrival (`timing()`).
- A cut marked every send in flight as held, so a DFSR due after the WAN was back was "waiting" and "could go now" at
  the restore; now only sends due during the outage are held, with a caption for a cut that holds nothing up
  (`capCutLater`).
- Two editors: DC01's GPC v6 reaching DC03 (also v6) was labelled "older"; now "same version".
- SPEC said the forced refresh comes one tick after the final refresh; it is one tick after the last event.
- The dead `same` outcomes are gone; a caption for a refresh with nothing newer (`capRefUpToDate`); `capRefTwo` on any
  last step of a two-editor run; softer wording of the stale caption; Croatian "Primjenjuje staro mapiranje" and the
  restore caption without a singular verb; DFSR's per-file conflicts noted under Simplifications.
- New tests: an AD send held by the WAN, a send not held up by a cut, the fields the captions read (`items`, refresh
  `gpc`/`gpt`/`content`/`was`), `changed` for the GPC delivery and the restore. Both bugs re-introduced once: the tests
  fail.

Left as *(check)*: the client's behaviour on a GPC/GPT mismatch and the ConflictAndDeleted side (above).

## Time

Start 2026-11-04 05:20 (scaffolded 05:23), first gate pass and fresh review before 05:40, review fixed and gate passing 05:50: about 30 minutes.
