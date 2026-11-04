<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-sysvol-dfsr: specification

One concept: **GPO version in AD vs in SYSVOL; a GPO that half-arrived at a branch** (task
`docs/tasks/w3/win-sysvol-dfsr.md`, catalogue `win-sysvol-dfsr`, §4.5.1 and §5.21). The student edits a GPO, cuts
the WAN to the branch site, and watches the two halves of the GPO travel by two different paths.

## Scene

Two sites of `quillmoor.example` joined by a WAN link:

- **HQ:** `DC01` (`qm-dc01`), the PDC emulator.
- **Branch:** `DC03` (`brk-dc03`), a writable DC, and the client `PC-B`, which reads Group Policy from `DC03` (its
  site's DC).

Each DC holds the GPO **Drive Maps** (`{3F2A9C41-7B0E-4D52-9A1C-5E8D2B6F4A07}`, made up) in two halves:

- **GPC** (Group Policy container), an object in AD: `CN={GUID},CN=Policies,CN=System,DC=quillmoor,DC=example`,
  attribute `versionNumber`.
- **GPT** (Group Policy template), a folder in SYSVOL: `\Policies\{GUID}\GPT.INI` with `Version=`, and the
  settings file `User\Preferences\Drives\Drives.xml`.

Between the DCs run two pipes over the WAN: **AD replication** (carries the GPC) and **DFS Replication** (DFSR,
carries the GPT folder). The WAN has a cut switch that stops both.

## Versions

`versionNumber` = user version × 65536 + computer version ([MS-GPOL] §2.2.4 *(check section)*; the same encoding in
`GPT.INI` `Version=`). Drive Maps is a user-side preference, so a save bumps the **user** version by 1 (the
versionNumber by 65536); a computer-side save would add 1. The GPO starts at **user 5, computer 1**:
versionNumber **327681**; after one edit **user 6**: **393217**. The page shows the user version as the big number
(v5, v6) and the full versionNumber beside it.

Settings (data, `Drives.xml`):

| Key | Saved by | Drive map |
|---|---|---|
| `m5` | (start) | `P: → \\qm-fs01\projekti` |
| `m6a` | DC01's admin | `P: → \\brk-fs01\projekti` |
| `m6b` | DC03's admin (`two-editors`) | `P: → \\qm-fs01\projekti` and `R: → \\brk-fs01\arhiva` |

## State

`{ t, wan: 'up'|'down', dcs: { DC01|DC03: { gpc: { ver, seq, by }, gpt: { ver, content, seq, by }, cad: [ { ver,
content, by } ] } }, inflight: { ad: [ { from, to, ver, seq, by, due, held } ], dfsr: [ { from, to, ver, content, seq,
by, due, held } ] }, client: { applied: { ver, content, gptVer }, report: null|'mismatch' }, last, changed }`.

- `seq` is the save's global order (1, 2 within the run; 0 for the start); `by` the DC it was saved on.
- `cad` is the DC's `ConflictAndDeleted` folder (DFSR's conflict losers).
- `due` is the tick the send really arrives (after a hold, the WAN's return); `held` is true while the cut holds it
  up (it was due during the outage). A send due after the WAN is back is in flight, not held.
- `last`: this step's event: `edit`, `ad`/`dfsr` with `items` (`outcome` `applied`, `equal` (same version, kept or
  replaced by the later save), `older`, `lost`/`won` (DFSR conflict)), `cut` with `waiting` (held) and `later` (in
  flight, not held), `restore` with `waiting`, `refresh`/`force` with what PC-B read (`gpc`, `gpt`, `content`), what
  it had (`was`), `outcome` (`applied`/`skipped`) and `stale`; `changed`: paths changed by it (`DC03.gpc`, `DC03.gpt`, `DC01.cad`, `client`,
  `wan`).

## Timeline (one step = one event)

Params: `wanCut` choice {`never`, `afterAd`, `afterDfsr`} default `never`; `adDelay` 1–10 ticks default 2;
`dfsrDelay` 1–10 ticks default 4; `refreshAt` 1–12 ticks default 5 (PC-B's background refresh; added, see NOTES);
`twoEditors` toggle default off (added).

1. **Edit** at t = 0 on DC01 (seq 1); with `twoEditors` also on DC03 (seq 2), after DC01 in the same tick.
2. **AD delivery** due at t = `adDelay`, **DFSR delivery** at t = `dfsrDelay` (sends leave at the edit, t = 0).
3. **WAN cut** at t = `adDelay` (`afterAd`) or `dfsrDelay` (`afterDfsr`), after that tick's deliveries; **WAN back**
   at cut + 2.
4. A delivery due while the WAN is down (cut < due < back) waits and goes right after the WAN comes back, in the same
   tick.
5. **Background refresh** of PC-B at t = `refreshAt`.
6. **Final refresh**: if the background refresh came before the last delivery (`refreshAt` < the last delivery's
   tick), PC-B refreshes again one tick after the last delivery.
7. **Forced refresh** (`gpupdate /force`): if at the end PC-B still applies other settings than DC03's SYSVOL holds,
   one tick after the last event.

**Tie-break inside one tick:** edits (DC01 before DC03) → WAN back → AD delivery → DFSR delivery → WAN cut →
refresh → forced refresh.

## Rules

Sources: Microsoft Learn, "Group Policy architecture" / "Group Policy processing" (GPC and GPT, version numbers);
[MS-GPOL] Group Policy: Core Protocol (§2.2 GPC/GPT, `versionNumber`, `GPT.INI`); Microsoft Learn, "SYSVOL replication
migration guide: FRS to DFS Replication" and "DFS Replication overview" (SYSVOL replicated by DFSR; conflicts,
`ConflictAndDeleted`).

1. **Two objects.** A GPO is a GPC in the directory (AD replication carries it) and a GPT folder in SYSVOL (DFSR
   carries it), each replicated on its own schedule.
2. **Edit.** GPMC edits on the PDC emulator by default; one save bumps both halves on that DC, together: GPC
   `versionNumber` and `GPT.INI` `Version=` +65536 (user side) and `Drives.xml` new. The save sends one GPC to the AD
   pipe and one GPT to the DFSR pipe, towards the other DC.
3. **Encoding.** versionNumber = user × 65536 + computer (above). *(check section number)*
4. **Independent arrival.** A delivery copies the half to the other DC if it is newer there (GPC: higher version, then
   the later save — values are equal in this model when versions are; GPT: the later save, last writer wins). A cut
   WAN holds both pipes; whatever arrived before the cut stays. So a DC can hold the new GPC with the old GPT, or the
   reverse.
5. **Client.** PC-B reads the GPC version on DC03 and the files from DC03's SYSVOL. If the GPC version is newer than
   the one it last applied, it applies the GPO with the files that are there and records the GPC version (`applied =
   { ver: GPC, content: files, gptVer: GPT }`; `report` = `mismatch` when GPT ≠ GPC). Otherwise it skips the GPO ("no
   change"). With old files it applies old settings under the new number, so when the files come later the next
   normal refresh skips it again; only a forced refresh (or the next version bump) applies them *(check: client
   behaviour on a GPC/GPT mismatch)*.
6. **Status view.** GPMC's status shows "AD / SYSVOL version mismatch" for a DC whose GPC and GPT versions differ
   (Windows Server 2012 and later *(check)*). The page shows it on each DC card (≠). Equal versions with different
   content (two editors) are not flagged.
7. **Two editors.** Two admins saving the same GPO on DC01 and DC03 before DFSR syncs: both GPCs say v6 (AD keeps one,
   the values are equal); DFSR keeps the last writer's files (DC03's, saved later in the tick) and moves the other
   copy to `ConflictAndDeleted` on each DC that resolved the conflict (both, here) *(check)*. DC01's edit is gone
   though every version number agrees.

## Presets and expected numbers

| # | id | params | events (tick) | steps |
|---|---|---|---|---|
| 1 | `normal` | never, AD 2, DFSR 4, refresh 5 | edit DC01 (0) · AD (2) · DFSR (4) · refresh (5): PC-B applies **v6**, `m6a` | **4** |
| 2 | `half-arrived` | afterAd, AD 2, DFSR 4, refresh 3 | edit (0) · AD (2): DC03 GPC **6**, GPT **5**, ≠ · cut (2) · refresh (3): PC-B applies `m5` as **v6**, mismatch · WAN back (4) · DFSR (4) · refresh (5): **skipped** (6 = 6), still `m5` · forced (6): `m6a` | **8** |
| 3 | `files-first` | never, AD 4, DFSR 2, refresh 3 | edit (0) · DFSR (2): DC03 GPC **5**, GPT **6**, ≠ · refresh (3): skipped (5 = 5), keeps `m5` · AD (4) · refresh (5): applies **v6** `m6a` | **5** |
| 4 | `two-editors` | never, AD 2, DFSR 4, refresh 5, two editors | edit DC01 (0, `m6a`) · edit DC03 (0, `m6b`) · AD (2): both GPC v6 · DFSR (4): DC03's `m6b` wins, DC01's `m6a` to `ConflictAndDeleted` on both · refresh (5): PC-B applies **v6** `m6b` | **5** |

Every DC and PC-B end with versionNumber 393217 (v6). The default params are preset 1 (`sim.json` `steps` 4).

Other values the params reach: `refreshAt` 3 without a cut (AD 2, DFSR 4) gives the stale client without any failure
(6 steps); `afterDfsr` with DFSR first gives the reverse half at Branch for longer. Most steps: 8 (one editor, a cut
that holds a delivery, a refresh during it, final and forced refresh). With two editors a forced refresh is never
needed (PC-B reads DC03, whose files win), so at most 8 there too. Checked over every combination in `sim.test.js`.

## Simplifications

- Two DCs, one GPO, one client; ticks instead of minutes; no replication schedules, site links or DFSR staging (out of
  scope, task). Each pipe carries its half once per save; no pull/notify detail (`win-ad-replication`,
  `win-ad-sites` for that).
- The client checks only the user side (the computer version never changes here).
- The WAN comes back two ticks after the cut.
- The GPT folder travels as one unit. Real DFSR resolves conflicts per file, so `GPT.INI` and `Drives.xml` could in
  general end up from different saves; with one later save for both, as here, the result is the same.
- GPC conflicts between equal values are resolved by save order (the real tie-break is the attribute's version, time,
  then the originating DC; `win-ad-replication`), since the value is the same either way.
