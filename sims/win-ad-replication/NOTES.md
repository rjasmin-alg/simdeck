<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ad-replication: notes

New stepper (task `docs/tasks/w2/win-ad-replication.md`, catalogue `win-ad-replication`, §4.5.1 and §5.7, wave 2b).
Drawn with kit view **K2** (topology with moving packets): three DC cards in a ring, the pull as a packet on the link
from source to destination. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Layout.** A 9-column K2 grid: DC01 top left, DC02 top right, DC03 bottom left, so the free bottom-right corner
  holds the **pull box** (what this pull carried and what happened to each change) and the **edits box** (every
  originating write, who holds it, its fate at the end). The boxes are appended to the K2 grid element with their own
  grid placement; the ring's links clear them. Each card: host name and this step's role badge, USN, a
  partner × {UTD, HWM} table, and `ana`'s two attributes with all six metadata fields in one row each. Cells that
  differ from the step before carry the kit's highlight plus an ink underline (grayscale).
- **The UTD merge** (SPEC rule 4). The task's rule 4 raises UTD[origDc] for each applied change. The model instead
  takes over the source's vector at the end of every pull (and the source's own entry = its USN), as [MS-DRSR] does
  when a cycle completes. That covers every applied change too, and also changes that *lost* the conflict at the
  source, so a losing value is never offered again by a DC that has seen it (with `direct` on, DC03 is not sent
  DC01's losing `555-0111`). Per-change raising alone would let it through and resolve it again.
- **Dampening at the source.** The request carries the destination's UTD and the source leaves covered changes out
  (Microsoft Learn's description); the packet chip counts only the changes actually sent ("nothing" when every one
  was left out), and the pull box lists the left-out ones dashed.
- **The destination's own change** coming back (DC01 ← DC03 after DC03 got DC01's change) is left out the same way
  (`own`): a DC's own UTD entry is its USN. The UTD table shows only the two partners.
- **One USN per object update** (fresh review). A pull's winning changes to `ana` are applied as one update under one
  new local USN of the destination, as AD applies an object's replicated changes in one transaction: in
  `different-attrs` DC03 stores `title` and `telephoneNumber` both under 2201. The first draft gave every attribute its
  own USN, which would teach "a USN per attribute".
- **A loser is still seen.** When an incoming change loses, the caption adds that the destination's UTD for its origin
  still rises (the source's vector comes over); when a later pull leaves out a change the destination never held, the
  caption says the vector came from a DC where the change lost, instead of "it came another way".
- **One change per attribute per pull.** The source sends the current value of each attribute above the HWM, so
  DC01's two edits in `version-beats-time` travel as one change (v3); `555-0111` (v2) never leaves DC01 and is
  "replaced in order", not lost.
- **Fate of a write**: kept / replaced in order (the winner's chain of `over` reaches it) / lost, as in
  `multimaster-conflict`'s "what is lost". Shown at the last step; before it, which DCs hold each write.
- **Pull times.** Pulls start at t = 15 s (the intra-site change-notification delay) and run 1 s apart, after all
  writes (`t2` ≤ 10 s, so both edits always happen before replication: the "at once" of the task).
- **Values.** Phone numbers `555-0100` (start), `555-0111/0112/0113` (DC01's edits), `555-0222` (DC02); titles are
  string-table words (`asistentica`/`assistant` → `docentica`/`lecturer`).
- **invocationID = the DC name** (task), so DC02 > DC01 on the last tie-break; reached with `t2` = 0 s.
- **Model copied, not shared:** `models/` has no `multimaster-conflict` model yet. `beats`/`ruleOf` are adapted from
  `sims/multimaster-conflict/sim.js @ fdaedd1` (`adBeats`, `adRule`: field names, and the DC name instead of a GUID)
  and their tie-break test is here. Nothing else of that model is reused (its two-writer timeline and lost display are
  reproduced in the page, not shared code).

## Deviations from the task

- **Two params added:** `edit2` (DC02 edits too; off for `one-change` and `dampening`) and `direct` (DC03 also pulls
  from DC01 directly, the `dampening` preset). The task's three params alone cannot express those two presets.
- **Step counts** (task 4 / 6 / 7 / 6 / 5, ours 4 / 5 / 6 / 5 / 5): writes plus the ring of pulls; three pulls bring
  every run to convergence, so the two-writer presets are one step shorter than the task's. Maximum 8 (task: 7), with
  `edits1` 3, `edit2` and `direct`.
- **Kit view K2 exists** (since kit 0.3.0), so the page uses it rather than its own drawing.
- **Preset 1 is `one-change`** (the task's order); the defaults are `same-attr-time` (the task's param defaults), so
  the page opens on preset 2.

## Sources

- Microsoft Learn, "How the Active Directory Replication Model Works" (Windows Server 2003 Technical Reference): USNs,
  high-watermark, up-to-dateness vector, propagation dampening, conflict resolution (version, originating time,
  originating DSA GUID).
- [MS-DRSR] Directory Replication Service (DRS) Remote Protocol: `IDL_DRSGetNCChanges`, `PROPERTY_META_DATA_EXT`
  (dwVersion, timeChanged, uuidDsaOriginating, usnOriginating), `UPTODATE_VECTOR_V2_EXT`.
- Task file (rules 1–7, presets, captions, terms); catalogue §5.7.
- DR estate, student side: `student/configs/ad/quillmoor/forest.txt` (DC names qm-dc01, qm-dc02, brk-dc03; one site).
  No instructor material used.

## Checks

- Numbers: an independent Python hand model (in the thread's library folder as `win-ad-replication-check.py`) gave every preset's USNs, UTDs, HWMs and winners before the page was written; the
  model agrees (`sim.test.js`, "presets" and the rule tests).
- Page sweep: every step of every param combination (edits1 1–3 × edit2 × t2 {0,1,2,5,10} × sameAttr × direct) in
  both languages at 1920×1080, 2160 page loads: no console errors, no empty or broken caption, no card or box clipped
  by the stage, no table wider than its card.
- `npm run gate -- win-ad-replication`: passes; screenshots 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus every step of every preset in both languages.

## Unchecked *(check)*

- One local USN per replicated object update (all attributes applied in one pull share it), from memory of Microsoft
  Learn and [MS-DRSR] (`usnProperty` per attribute, `uSNChanged` per object); not re-read.
- The third tie-break: Microsoft Learn says the originating DSA's GUID wins when version and time are equal; whether
  it is the higher one, and whether it is the DSA object GUID or the invocationID, is not confirmed. The model takes
  the higher, compared on the name standing in for the invocationID, as the task says.
- The UTD merge at the end of a pull (rule 4 above) and the self entry being the DC's own USN.
- 15 s as the first change-notification delay within a site (Windows Server 2003 and later).
- Croatian terms (task marks them *(check)*): slijedni broj promjene (USN), vektor ažurnosti, gornja oznaka, izvorna
  promjena, replikacija s više glavnih kopija, razrješavanje sukoba; and prigušivanje širenja (*propagation
  dampening*), which is mine.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| update sequence number (USN) | slijedni broj promjene | task *(check)* |
| up-to-dateness vector | vektor ažurnosti | task *(check)* |
| high-watermark | gornja oznaka | task *(check)* |
| originating write | izvorna promjena | task *(check)* |
| multi-master replication | replikacija s više glavnih kopija | task *(check)*; `multimaster-conflict` uses "… glavnih poslužitelja" |
| propagation dampening | prigušivanje širenja | this page *(check)* |
| attribute | atribut | task |
| conflict resolution | razrješavanje sukoba | task |

## Shared requests

- **K2: free cells in the grid** (`spec.extras: [{ col, row, span, el }]`) for boxes beside the drawing. The page
  appends its `.ar-boxes` element to the returned `.sd-topo` and places it with `grid-column`/`grid-row` itself; it
  depends on `.sd-topo` being the grid and on the phone rule resetting placements (the page resets its own).
- **K2: name as a node.** The card's `name` is a node here (host name, badge, USN and the UTD/HWM table, so the card
  is shorter); `cardEl` accepts it, but the docs describe `name` as text.
- **Promote `multimaster-conflict`'s AD comparison** (`adBeats`/`adRule`) to `models/` if a third page needs it; this
  page's `beats` differs only in field names and the tie-break key.

## Fresh review

A separate agent read the code against `SPEC.md`, ran 58 mutations of `sim.js` (50 killed; the survivors equivalent
in this model — HWM from the last change sent, `supersedes` without the self case, `changed` always holding the HWM,
`fateOf` reading DC03 at the end — or untested bookkeeping, now tested: `changed` paths, `converged` on `title`) and
swept 978 page loads in both languages. Fixed from it: one USN per object update (above), the false "came another
way" caption (new `capUtdLost`), the hidden UTD rise on a lost change (`capLostSeen`), Croatian "a DC02 ima veći
invocationID", "imaju je" for several holders, "the change"/"the changes" by count, "once"/"jednom", "in the same
second" for `t2` 0, "USN na DC01" for "its USN", the pull box's "changes whose USN on DC01 is above", the
"replaced in order" style in the edits box (no longer the dashed "left out" style), and a note in the explanation that
real invocationIDs are GUIDs, so the last tie-break is effectively arbitrary. Left: `capLostVersion` and
`capPullNone` cannot be reached with these params (kept for completeness).

## Time

Start 2026-10-24 10:31, gate passing 10:55, review fixed 11:15: about 45 minutes.
