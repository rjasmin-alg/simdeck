<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ad-replication: specification

One concept: **USNs, up-to-dateness vector, attribute-level last writer wins** (task
`docs/tasks/w2/win-ad-replication.md`, catalogue `win-ad-replication`, §4.5.1 and §5.7). The student changes one
attribute on two DCs at once and steps through the pulls that bring the three DCs back together.

## Scene

Three domain controllers of `quillmoor.example` in a ring (kit view K2): **DC01** `qm-dc01` top left, **DC02**
`qm-dc02` top right, **DC03** `brk-dc03` at the bottom; links DC01–DC02, DC02–DC03, DC03–DC01. Each DC card holds:

- its **USN** (`highestCommittedUSN`): its own counter, one per DC, unrelated to the others' numbers;
- a small table with one column per partner: the **UTD** entry (up-to-dateness vector: for each other DC, the highest
  originating USN of that DC whose changes it has) and the **HWM** (high-watermark: the partner's own USN up to which it
  has asked that partner for changes);
- the user object `ana` with two attributes, `telephoneNumber` and `title`, each with its replication metadata: value,
  **version**, **originating DC**, **originating USN**, **originating time**, **local USN**.

A pull is a packet on the link from the source to the destination (the reply that carries the changes). Beside the
drawing, the **pull box** lists what this pull carried: the HWM it asked from, each attribute change above it, and what
happened to it (applied ✓, left out by the UTD, lost the conflict ✗), and the new HWM; the **edits box** lists every
originating write of the run, which DCs hold it now, and at the end its fate: kept ✓, overwritten in order (a later
write that had seen it), or lost (struck through).

Each DC's invocationID is its name (task); DC02 > DC01 in the comparison.

## State

`{ t, dcs: { DC01|DC02|DC03: { usn, utd: { other: usn }, hwm: { partner: usn }, obj: { telephoneNumber|title:
{ value, ver, origDc, origUsn, origTime, localUsn, wid } } } }, writes: [], last, changed: [] }`.

- `utd` has an entry for each *other* DC. A DC's own entry is implicit: its own USN (it has all its own changes).
- `writes[]`: every originating write `{ wid, dc, attr, value, ver, usn, t, over }`; `over` is the `wid` the write
  replaced on its DC (the initial value is `wid` 0).
- `last`: the event of this step, `{ kind: 'write', dc, attr, wid }` or `{ kind: 'pull', dest, src, from, to, changes:
  [{ attr, value, ver, origDc, origUsn, origTime, srcUsn, outcome, rule, localUsn }] }` with `outcome` `applied`,
  `utd` (left out: the destination has it), `own` (left out: the destination's own change), `lost` (the destination's
  value won) or `same`, and `rule` the part of rule 5 that decided (`version`, `time`, `id`).
- `changed`: the paths changed by this step (`DC02.usn`, `DC02.utd.DC01`, `DC02.hwm.DC01`,
  `DC02.obj.telephoneNumber`). The page's "changed" highlight compares each shown field with the step before, which
  gives the same cells and also marks single metadata fields.

One step is one event: an originating write, or one pull.

## Start (step 0)

All three DCs in step: every UTD and HWM entry equals the partner's USN.

| DC | USN | UTD / HWM | `telephoneNumber` | `title` |
|---|---|---|---|---|
| DC01 | 4100 | DC02 7300, DC03 2200 | `555-0100` v1 DC01 4000 09:00:00, local 4000 | `@title0` v1 DC01 4001 09:00:00, local 4001 |
| DC02 | 7300 | DC01 4100, DC03 2200 | same, local 7200 | same, local 7201 |
| DC03 | 2200 | DC01 4100, DC02 7300 | same, local 2100 | same, local 2101 |

Both attributes were written on DC01 long ago (originating USNs 4000 and 4001); each DC stored them under its own
local USN. The numbers 4100, 7300, 2200 are the task's (other objects took the USNs in between); they are made up, not
an estate's real counters.

Clock: real time `t` in seconds; times are shown as `10:00:00 + t` (hh:mm:ss), as in `multimaster-conflict`.

## Timeline

1. **Writes**, in time order: DC01 writes `telephoneNumber` `edits1` times at t = 0, 1, 2 (values `555-0111`,
   `555-0112`, `555-0113`); DC02 (when `edit2`) writes once at t = `t2`: `telephoneNumber` = `555-0222` (`sameAttr`) or
   `title` = `@title1`. **Tie-break (rule 7): writes in the same second → DC01 first, then DC02.**
2. **Pulls**, after the last write, one per second from t = 15 *(check: 15 s is the default first change-notification
   delay within a site since Windows Server 2003; schedules are out of scope, `win-ad-sites`)*, in ring order:
   DC02 ← DC01, DC03 ← DC02, (DC03 ← DC01 when `direct`), DC01 ← DC03.

Steps = writes + pulls: 4 to 8.

## Rules

Sources: Microsoft Learn, "How the Active Directory Replication Model Works" (Windows Server 2003 Technical
Reference): USNs, high-watermark, up-to-dateness vector, propagation dampening, conflict resolution; [MS-DRSR]
Directory Replication Service (DRS) Remote Protocol, §§ IDL_DRSGetNCChanges, replication metadata
(`PROPERTY_META_DATA_EXT`: dwVersion, timeChanged, uuidDsaOriginating, usnOriginating; `usnProperty` the local USN),
`UPTODATE_VECTOR_V2_EXT`.

1. **Originating write.** The DC increments its USN; the attribute gets `ver + 1`, `origDc` = this DC, `origUsn` =
   `localUsn` = the new USN, `origTime` = now. Only that attribute's metadata changes.
2. **Pull and high-watermark.** The destination asks the source for changes with a source local USN above its HWM for
   that source. The source answers with the *current* value and metadata of every attribute whose local USN is above
   it, in local-USN order (attribute level: two edits of one attribute travel as one change, its latest; an attribute
   that did not change does not travel). After the pull the destination's HWM for the source is the source's current USN.
3. **Propagation dampening.** The request carries the destination's UTD; a change whose `origUsn` ≤ the destination's
   UTD entry for `origDc` is left out — the destination already has it (`utd`). A change that originated on the
   destination itself is left out the same way (its own entry is its USN: `own`). The HWM still advances.
4. **Applying a change.** The changes of the object that win (rule 5) are applied as **one update** of the object
   under **one new local USN of the destination** (its own counter: USN + 1), and each keeps its originating metadata
   (version, origin DC, originating USN and time). Two attributes arriving in one pull share that local USN; a pull in
   which nothing wins uses no USN. Changes with equal source USNs are listed in attribute order (`telephoneNumber`,
   `title`). At the end of
   the pull the destination raises each UTD entry to the source's (`max`), and its entry for the source to the source's
   USN: it now has everything the source had *(check: [MS-DRSR] returns the source's UTD with the last reply of a
   cycle; the destination merges it)*. So the UTD entry for the change's origin covers it on every DC it reached,
   including one where it lost the conflict.
5. **Conflict on one attribute.** Incoming vs held: **higher version wins → tie: later originating time → tie: higher
   originating invocationID** (here the DC name, DC02 > DC01) *(check: order, and which GUID the third tie-break
   compares; Microsoft Learn says the originating DSA's GUID)*. A losing incoming change is discarded (`lost`); a held
   value that loses is overwritten. Identical metadata is the same change (`same`; not reached by the presets).
6. **Attribute level.** Every attribute is resolved alone: changes to `telephoneNumber` on DC01 and to `title` on DC02
   never conflict, and both survive everywhere.
7. **Tie-break for one tick:** originating writes first (DC01 before DC02), then the pulls in ring order (above).

**Fate of a write** (edits box, last step): the final value of its attribute (the same on every DC) is the write
(**kept**), or a write whose chain of `over` reaches it (**overwritten** in order: DC01's second edit replaced its
first), or neither (**lost**: it lost a conflict, rule 5). The edits box lists the DCs that hold each write at every
step before the last; at the last step its fate.

## Params

| Key | Kind | Default | Meaning |
|---|---|---|---|
| `edits1` | range 1–3 | 1 | edits of `telephoneNumber` on DC01 (t = 0, 1, 2) |
| `edit2` | toggle | on | DC02 edits too |
| `t2` | range 0–10 s | 2 | when DC02 edits (shown with `edit2`) |
| `sameAttr` | toggle | on | DC02 edits the same attribute (`telephoneNumber`); off: `title` (shown with `edit2`) |
| `direct` | toggle | off | DC03 also pulls from DC01 directly, after DC02 |

## Presets and expected numbers (checked by an independent hand model, NOTES.md "Checks")

1. `one-change` (`edit2` off): DC01 (USN 4100) sets `telephoneNumber` = `555-0111`: **DC01 USN 4101, ver 2,
   origUsn 4101**. DC02 ← DC01: applied under **DC02 USN 7301**, origUsn stays **4101**. DC03 ← DC02: applied under
   **DC03 USN 2201**. DC01 ← DC03: its own change, left out. **UTD[DC01] = 4101** on DC02 and DC03. **4 steps.**
2. `same-attr-time` (defaults): DC01 `555-0111` v2 at 10:00:00 (4101), DC02 `555-0222` v2 at 10:00:02 (7301). DC02 ←
   DC01: same version, DC02's later time wins, `555-0111` **lost** at DC02 (DC02 USN stays 7301). DC03 ← DC02: `555-0222`
   (2201). DC01 ← DC03: `555-0222` beats DC01's own `555-0111` on time → DC01 USN 4102, origUsn 7301 kept. **All hold
   `555-0222`**; `555-0111` lost. **5 steps.**
3. `version-beats-time` (`edits1` 2, `t2` 5): DC01 v2 (4101) then v3 `555-0112` (4102) at 10:00:01; DC02 `555-0222` v2
   at 10:00:05 (7301). DC02 ← DC01: one change, v3 beats v2 though older → DC02 7302. DC03 ← DC02: v3 (2201). DC01 ← DC03:
   own, left out. **All hold `555-0112` (v3)**; `555-0111` overwritten in order, `555-0222` lost. **6 steps.**
4. `different-attrs` (`t2` 0, `sameAttr` off): DC01 `telephoneNumber` (4101), DC02 `title` (7301), same second. DC02 ←
   DC01: phone (7302). DC03 ← DC02: two changes in one pull, `title` and phone, applied as one update under **2201**.
   DC01 ← DC03: phone its own, left out; `title` applied (4102). **Both values everywhere**, nothing lost. **5 steps.**
5. `dampening` (`edit2` off, `direct` on): as `one-change`, then DC03 ← DC01: phone (DC01 local 4101 > HWM 4100) left
   out by **UTD[DC01] = 4101**; HWM → 4101. DC01 ← DC03: own, left out. **5 steps.**

Other values the page reaches: `t2` 0 with `sameAttr`: equal version, equal time → DC02's `555-0222` wins on the
invocationID (rule 5's last tie-break). `t2` 0 with DC01 at v2 and `edits1` 1 is the only tie the params reach; `edits1`
≥ 2 always wins on version. Most steps: `edits1` 3, `edit2`, `direct` = 8.

## Simplifications

- One object, two attributes, three DCs in one site; pulls in a fixed ring order, no schedule, sites or KCC
  (`win-ad-sites`); no linked-value replication, naming conflicts (CNF) or USN rollback (`win-ad-backup-restore`).
- UTD entries are USNs only (no timestamps); the invocationID is the DC's name.
- One reply per pull (no paging).
- Values: phone numbers are data; titles are words from the string table (`@title0` asistentica / assistant,
  `@title1` docentica / lecturer).
