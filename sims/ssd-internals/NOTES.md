<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ssd-internals: notes

Task `docs/tasks/w3/ssd-internals.md` (catalogue `sto-ssd-internals`, §4.6). Built by thread t-0271 on 2026-11-05.
Rules and numbers: `SPEC.md`.

## Decisions

- **Kit view K3** (`kit/blockgrid.js`) draws the whole scene in one grid, as the K3 consumer sketch (t-0103) did:
  the host's LBA row on top, the four erase blocks as rows of four pages under it (`offset: 3`). The FTL map is the
  LBA row's `sub` line (`block.page`); only this step's pointers are arrows (the kit's advice: few links).
- **Counters start after the fill** in presets 1–3. The task's numbers ("8 host writes → 14 NAND writes, WA 1.75")
  count the workload, not the fill; the fill step says it was 10 = 10 and the card says "counted from the end of the
  fill". `first-fill` counts from the empty drive (WA 1.0, rule 7).
- **The GC is its own step** and the write follows without a second check (task "One step"). The step count comes
  from replaying the script (`steps(p)`), so it changes with the preset: 12, 15, 13, 10. `sim.json` `steps` is the
  default preset's (`hot-data`, 12).
- **The reserve ("R")** is shown only when exactly one block besides the active one is free (rule 4); on an empty or
  half-empty drive no block is the reserve yet.
- **The task's `op` button group** is three buttons with the `lba` select above them: *Write LBA* (W), *TRIM LBA*
  (T), *Undo my ops* (U). Each appends to a model param without a control, `extra` (`w3 t5 …`, as `ssh-tunnels`'
  `extra`), and the page jumps to the first new step (a GC step when the write needs one). The kit's own reset (R)
  restores the defaults. A run stops at 20 steps: an op that would go past is not added, and the last step's caption
  says why (a write may need two steps, GC + write, so a TRIM can still fit where a write does not).
  TRIM from the button takes one LBA; the preset's TRIM takes the set 6–9 in one step.
- **The `pattern` choice is hidden** (`visible: false`, like `lnx-cow-filesystem`'s `scene`): the four presets set it,
  and with it the Croatian panel was 58 px too tall for one screen. The param stays in the model and the URL.
- **Erased pages in a GC step** are free and highlighted; the GC arrows start from the pages that were copied out.
  The aside shows a flash, the new count and "+1".
- **Invalid pages carry no label** (state `'X'`, as the task's state shape): the kit's crossing is the "✕".
- **Model invariants fail loudly.** `gcRun` throws if there is no full victim or reserve, if the victim has no invalid
  page, or if the reserve would be full after the copy; `writeLba` throws on a page that is not erased. With 10 LBAs
  on 12 non-reserve pages none of these can happen (SPEC.md "Derived"); a broken rule then fails the tests instead of
  looping. `countSteps` stops at 100 as a guard.
- WA is shown with two decimals, a trailing zero dropped (1.0, 1.75, 1.63) and the language's decimal mark (1,75 in
  Croatian). `block.page` addresses keep the dot: they are addresses, not decimals.
- The caption helper `rich()` (node placeholders, `*English term*` → `<em lang="en">`) is copied from
  `sims/lnx-cow-filesystem/index.html`.

## Deviations from the task

- `op` is three buttons, not a button group param (the kit has no group of action buttons); `pattern` is hidden (above).
- State has `gc: [{ victim, to, moved }]` for the task's `gcLog: [{ victim, moved }]`, plus `i` (position in the
  script) and `ev` (what the step did, for the page).

## Sources

- Agrawal et al., "Design Tradeoffs for SSD Performance", USENIX ATC 2008 (page programming, block erase,
  log-structured page mapping, cleaning) *(check: section numbers cited from memory)*.
- Hu et al., "Write Amplification Analysis in Flash-Based Solid State Drives", SYSTOR 2009 (greedy victim choice,
  WA definition) *(check)*.
- Tanenbaum & Bos, *Modern Operating Systems* 4th ed., SSD section, given as §5.4.1 in the task *(check: no local
  copy; ossimulator's disk-scheduling NOTES.md also marks it unchecked)*.
- ATA/ACS DATA SET MANAGEMENT (TRIM) and NVMe Dataset Management (Deallocate) *(check)*.
- `~/projects/ossimulator/src/modules/disk-scheduling/` (scenario `hdd-vs-ssd`): access time only, nothing taken.
- The preset numbers come from the rules, not from firmware. They were derived twice: by an independent Python script
  written before the model (below) and by `sim.js`; both give the task's numbers.

```python
# reference for rules 1–7 (counters from the end of the fill)
B,P=4,4
def new(): return dict(pages=[[None]*P for _ in range(B)],erase=[0]*B,map={},active=0,ptr=0,host=0,nand=0,gc=[])
def free(s): return [b for b in range(B) if all(x is None for x in s['pages'][b])]
def full(s,b): return all(x is not None for x in s['pages'][b])
def gc(s):
    inv=lambda b: sum(1 for x in s['pages'][b] if x=='X')
    v=sorted([b for b in range(B) if full(s,b)],key=lambda b:(-inv(b),s['erase'][b],b))[0]
    r=free(s)[0]; s['active'],s['ptr']=r,0; moved=0
    for x in s['pages'][v]:
        if x not in (None,'X'):
            s['pages'][r][s['ptr']]=x; s['map'][x]=(r,s['ptr']); s['ptr']+=1; s['nand']+=1; moved+=1
    s['pages'][v]=[None]*P; s['erase'][v]+=1; s['gc'].append((v,moved))
def write(s,l):
    if s['ptr']>=P:
        fr=free(s)
        if len(fr)>=2: s['active'],s['ptr']=fr[0],0
        else: gc(s)
    if l in s['map']: b,p=s['map'][l]; s['pages'][b][p]='X'
    b=s['active']; s['pages'][b][s['ptr']]=l; s['map'][l]=(b,s['ptr']); s['ptr']+=1; s['host']+=1; s['nand']+=1
def trim(s,ls):
    for l in ls:
        if l in s['map']: b,p=s['map'].pop(l); s['pages'][b][p]='X'
# hot 8→14 (1.75) gc (0,2)(3,2)(2,2) erase [1,0,1,1]; spread 8→26 (3.25) 6×3 [2,2,1,1];
# trim 8→13 (1.625) gc (1,1)(0,2)(2,2) [1,1,1,0]; first fill 10→10 (1.0)
```

## Term pairs

The glossary has only *page* — stranica (ossimulator's, the same words). Not in the glossary, written out in both
tables with the English term in italics on the Croatian page:

- flash translation layer — sloj prevođenja adresa (FTL) *(check)*
- erase block — blok za brisanje *(check)*
- write amplification — pojačanje pisanja *(check)*
- garbage collection — skupljanje smeća
- over-provisioning — pričuvni prostor *(check)*
- wear — trošenje
- TRIM — TRIM

## Shared requests

- **K3: keep the crossing on a changed invalid cell.** `kit.css` `.sd-bg .sd-bg-cell.sd-changed` sets
  `background: var(--hl)`, which drops `.sd-bg-dead`'s crossing `background-image`, so a page invalidated in this step
  reads as a plain highlighted cell (and as a free one in grayscale). Smallest change: `background-color` instead of
  `background` in that rule, or a `.sd-bg-dead.sd-changed` rule that redraws the cross in `--on-hl`. The page does the
  latter locally (`index.html`, "an invalid page changed in this step"); drop it when the kit has it.
- **Kit: a disabled state for action buttons** (`{ type: 'button', disabled: (p) => reason }`), as params have. The
  page now ignores a press past 20 steps and explains it in the caption.

## Tags

Topic `storage`, tag `storage-basics`, level `advanced` (as the task names; both exist in `tags.json`).

## Checks

- `node --test sims/ssd-internals/sim.test.js`: 21 tests; tie-breaks first, a test per rule, the preset numbers,
  the added ops, then the template's generic block.
- Mutations (each run once, then reverted): victim tie on erase count reversed, tie on number reversed, most-invalid
  reversed, non-full blocks as candidates, old page freed instead of invalid, erase +2, opening the highest free
  block, GC without a reserve, GC copies not counted, TRIM keeping the map entry, counters not reset after the fill,
  no 20-step cap, GC copying invalid pages: every one fails at least one test.
- `npm run gate -- ssd-internals`: pass. Screenshots reviewed: 1920×1080 light, dark, grayscale in hr and en, 375×812,
  and by hand the GC step (hot 4), the TRIM step (trim 2), every preset's last step, dark mid-run (spread 7).

## Review

A fresh reviewer (a separate agent with no part in the build) read the code against `SPEC.md` and the task, traced
all 12 GC runs of the presets, and mutated the model. Rules, tie-breaks and numbers matched. Found and fixed:

- the "20 steps" caption appeared whenever a write no longer fitted, even at 19 steps; it now appears only after a
  refused press and says the op does not fit;
- SPEC said the buttons were disabled past 20 steps, which the kit cannot do; SPEC now says what the page does, and
  the kit request is under Shared requests;
- the GC copy arrows ignored the `showMap` toggle;
- the tie-break caption could name the wrong reason in a mixed tie; the event now lists the blocks beaten on the erase
  count and on the number separately;
- tests added for the GC event's fields, `trimmed`, `MAX_STEPS = 20` and skipping an op that does not fit; the rule-6
  test now writes a really trimmed LBA; TRIM's caption says "these LBAs", not "these blocks".

## Time

2026-11-05, 07:09 to 07:37 (about 30 min), one session.
