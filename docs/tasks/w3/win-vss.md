# win-vss: Volume Shadow Copy

| | |
|---|---|
| Task | `win-vss` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-vss` in `docs/catalogue.md` §4.5.7 |
| Kind | **add a preset to `sims/lnx-cow-filesystem/`** (no page of its own) |
| Folder | `sims/lnx-cow-filesystem/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `snapshots` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `lnx-cow-filesystem` merged; only one preset task per host folder at a time; uses kit view K3 block grid once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **copy-on-write snapshots behind "Previous Versions"**.

The student: write files, take shadows, restore.

This is a **preset on `lnx-cow-filesystem`** (Copy-on-write filesystems), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/lnx-cow-filesystem/` (the host page) and its `NOTES.md`.

## Sources

- No Windows course book yet. Use Microsoft documentation (below); mark every rule and number you could not confirm with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §5.2
- Microsoft documentation: *Volume Shadow Copy Service*, *How Volume Shadow Copy Service works* (copy-on-write, diff area), *Previous Versions*, *Shadow copy storage space*.
- Host: `sims/lnx-cow-filesystem/` (the block grid and snapshot model this extends); catalogue §5.2 (shared copy-on-write / `sto-cow-vs-row`).

## Overlaps (catalogue §5)

- **§5.2 Snapshots and copy-on-write:** sto-backing-chains gets presets for qcow2, VHDX/AVHDX (covers win-hyperv-checkpoints) and VMware. LVM snapshot fill, thin overcommit and CoW filesystem stay separate pages on the same block-grid view. sto-cow-vs-row and win-vss can become presets of lnx-cow-filesystem.

## Model and presets

- **Preset task:** adds a Windows "Previous Versions" (Volume Shadow Copy) preset to the host sim
  `lnx-cow-filesystem` (`sims/lnx-cow-filesystem/`): presets, strings and tests only. Teaches copy-on-write
  snapshots behind the "Previous Versions" tab, on the host's K3 block grid.
- **What this shows:** a volume's blocks over time; taking a shadow copy, overwriting a file, then restoring the
  older version from the shadow, and how much extra space the shadow area uses.
- **Host model must support (request if missing):** the host currently models redirect-on-write (a new write goes
  to a *new* block and the snapshot keeps the old block in place). Windows VSS is the other variant: **copy the old
  block into a shadow (diff) area first, then overwrite the original block in place** (Microsoft *How Volume Shadow
  Copy Service works*). The host needs a `mode: 'redirect-on-write' | 'copy-on-write'` switch and a separate diff
  area whose growth is shown. This is the same mode `sto-cow-vs-row` needs (catalogue §5.2); request it once, in
  `sims/lnx-cow-filesystem/NOTES.md`. Also needed: a per-snapshot timestamp label and a "restore from snapshot N"
  action.
- **Rules (added to the host's):**
  1. A shadow copy is point-in-time: it preserves the volume's contents at the moment it was taken (Microsoft
     *Volume Shadow Copy Service*).
  2. Copy-on-write: on the first change to a block after a shadow, the *old* block is copied to the diff area, then
     the new data overwrites the original; unchanged blocks are shared (Microsoft *How VSS works*).
  3. The diff area grows with the amount changed since a shadow, not with volume size; it has a size limit, and
     when full the oldest shadows are dropped (Microsoft *Shadow copy storage* / `VSS max size`) *(check)*.
  4. "Previous Versions" lets a user restore a file or folder from any surviving shadow without admin rights for
     read; the live file is replaced by the older content (Microsoft *Previous Versions*).
  5. Shadows live on the same volume by default, so they are not a backup and do not survive the volume's loss or a
     host compromise (Microsoft; links to `ransomware-321`).
  Tie-break: restoring from the newest shadow older than the deletion time; if two shadows share a timestamp, the
  one with the larger id.
- **Params (added):** `mode` set to copy-on-write for this preset; `diffLimit` range (blocks); `action` choice
  write/take-shadow/restore.
- **Presets:**
  - `previous-versions` write file v1, take shadow S1, overwrite to v2 (old block copied to diff), restore v1 from
    S1. From Microsoft *How VSS works*; block counts derived and checked by script.
  - `diff-growth` several edits after one shadow: the diff area grows by the number of changed blocks, live volume
    usage unchanged. Derived, checked.
  - `diff-full` diff area hits its limit: the oldest shadow is dropped and its "Previous Versions" entry
    disappears. Derived *(check limit behaviour)*.
- **Steps:** `previous-versions` ~8, `diff-growth` ~8, `diff-full` ~10 (within the host budget).
- **Legend (added):** live block, shadow (diff-area) block (distinct pattern), shared block (both), restored block
  (kit highlight), shadow timestamp label; "changed" marks blocks copied to the diff area or overwritten this step.
- **Captions:** hr: "Pri prvoj izmjeni nakon sjene stari se blok kopira u diferencijalno područje, pa se original
  prepiše." / en: "On the first change after a shadow, the old block is copied to the diff area, then the original
  is overwritten." — hr: "Vraćanje iz sjene S1: datoteka se vraća na sadržaj od 10:00." / en: "Restore from shadow
  S1: the file returns to its 10:00 contents."
- **Terms:** shadow copy — sjenovita kopija *(check)*; copy-on-write — kopiranje pri pisanju; snapshot — snimka;
  previous versions — prethodne verzije; diff area — diferencijalno područje *(check)*; point-in-time — točka u
  vremenu; volume — svezak *(check)*.
- **Misconceptions:** a shadow copy is a full second copy (only changed blocks are kept); "Previous Versions" is a
  backup (same volume); copy-on-write and redirect-on-write are the same.
- **Out of scope:** VSS writers/requesters and application quiescing, scheduling, off-volume shadow storage
  details, the backup products that use VSS.
- **Builds on `lnx-cow-filesystem`:** reuses its block grid and snapshot sharing; new are the copy-on-write mode,
  the diff area and restore-in-place.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-cow-filesystem/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
