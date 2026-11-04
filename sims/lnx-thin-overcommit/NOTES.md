<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-thin-overcommit: notes

New explorer (task `docs/tasks/w3/lnx-thin-overcommit.md`, catalogue `lnx-thin-overcommit` §4.4, overlap §5.2), drawn on
kit view **K3: block grid** (`kit/blockgrid.js`): the pool grid, `split()`, spans and `meter()`. Rules and expected
numbers: `SPEC.md`.

## Decisions

- **Model reuse.** `models/` has no LVM model. `lnx-lvm-extend`'s code allocates physical extents over disks, which a
  thin pool does not need (the VG's free space here is one number, as in `lnx-lvm-snapshot`). So nothing was copied;
  the sim reuses that family's vocabulary and choices: "all or nothing" growth, autoextend strictly above the threshold
  (lvm.conf "exceeds", as `lnx-lvm-snapshot` after its review), the lvs column names. The pool operations (`createPool`,
  `write`, `discard`, `autoextend`, `dataPct`, `used`) are pure functions over `{ cells, lvs, vgFree, extended, short }`
  with no words, so they can be promoted unchanged.
- **Explorer, not stepper.** The task says explorer: `compute(params)` applies the writes in volume order, one 1-GiB block
  at a time, checking autoextend after each block; the page redraws on every param change. No steps, no scripts.
- **Allocation order.** A first write takes the lowest free pool cell, so thin1's cells come first, then thin2's, … and
  cells freed by discard are reused by the next volume (visible as thin2's colour inside thin1's old run).
- **thin1's deletion** happens right after thin1's writes, before thin2 writes (SPEC rule 7). So with discard on, the
  freed space is there for later volumes, and discard can save a later volume from a full pool; without it, it cannot.
  The deleted blocks are thin1's oldest; their pool cells are drawn hatched (`soft`) while the pool still holds them.
- **Writes clamped to the volume's size.** Each `w_i` slider's max is `virt` (a param-dependent max), and the model
  clamps too: a filesystem cannot hold more than its volume. `deleted1` is clamped to what thin1 wrote.
- **The pool grid.** The pool as created, then all autoextensions as one added group of rows, labelled with the
  percentage ("+20 %"), each extension a dashed span. Columns: the narrowest of 20, 25, 40, 50 that keeps the pool
  within 6 rows (4 when four volume bars are below); cells 2rem high (1.55rem with four volumes, 1.2rem at 6 rows) so
  that every combination of params fits 1920×1080. Cell text is the volume's number (1–4) with its colour, so grayscale
  and colour-blind viewers read the owner. The sizes after each growth are written under the grid (`100 → 120 → 144
  GiB`; past three growths, the first and the last only), not as span labels, which would add a band under each row.
- **Meters** (kit `meter()`): pool Data% with one segment per volume and the threshold tick (dashed in page CSS; the
  task's legend says dashed) when autoextend is on; "promised" with the volumes' virtual sizes as ghost segments
  against the pool, overcommitted = the kit's dashed danger end, and the banner "obećano 240 GiB / stvarno 100 GiB".
- **Volume bars** are kit meters over `virt`: filesystem used (fill), deleted but still in the pool (soft), refused
  (bad), the promised unbacked rest (ghost). Refused writes get a badge under the volume's name: "⏱ čeka 10 GiB"
  (dashed danger frame, default mode) or "✕ odbijeno 10 GiB" (solid frame, error when full). The caption says
  "waits 60 seconds, then fails" or "fails at once".
- **Banner vs warning:** the banner and the promised meter compare the promise with the pool as it is now (after
  growth); `overcommit` and the warning line use the pool as created, when LVM warned.
- **Changed** marks pool cells whose owner differs from the state before the last param change (allocated, freed, taken
  over) and the new rows of an extension. A changed cell a volume holds keeps its colour under the kit's halo (page CSS,
  as `lnx-lvm-extend`), so a preset switch does not turn the whole pool yellow.
- **Captions** are one main sentence (refused / just full / no overcommit / fits) and notes (other refused volumes,
  rewrites still work, deleted kept or discarded, grew / grew then short / short). The rewrite note is left out when
  other notes follow (the explanation says it), so the caption stays at most four lines.
- **The panel** holds up to 14 controls: two columns for the writes, thin1's deletion and its discard switch, the two
  switches, and threshold with percent; the panel is 26rem wide (`--panel-w`, as `tcp-handshake`, `rf-bandplan`); the
  switches' on/off word is hidden (the switch shows its state), since half-width labels need the room. VG free,
  threshold and percent show only with autoextend on; discard only when thin1 deletes something.
- **Names on the page:** LVM, `lvs`, `lvm.conf` and its `thin_pool_autoextend_*` settings, `--errorwhenfull`, `fstrim`
  and the `discard` mount option are the subject (NLA T20), in the explanation only. The overcommit warning is a
  translated line, not the tool's text.

## Deviations from the task

- **Presets `one-tenant-fills`, `deleted-not-returned`, `error-at-once` write 50/40 (/20 or /0)**, not 70/20: thin1's
  70 GiB does not fit a 50-GiB volume. Same totals and pool numbers (100 % after 10 of thin3's 20 GiB; 90 % / 60 %), and
  the task's caption "thin3 believes it has 40 GiB free" word for word (the reviewer's suggestion; a first version used
  `virt` 80 instead).
- **Autoextend at "exceeds"**, so the `autoextend` preset grows at **71 and 85 GiB**, not 70 and 84 (lvmthin(7) "whenever
  a pool exceeds 70% usage", lvm.conf(5) "exceeds this percent"; its own example "using 700M will trigger a resize"
  says ≥, so the man page disagrees with itself *(check)*). Same final numbers.
- **Growth rounded up to whole GiB:** the third growth needs **29 GiB, not 28.8** (lvextend rounds up to whole extents;
  here an extent is drawn as 1 GiB).
- **No `pool.meta`** in the state: pool metadata is out of scope (task "Out of scope"); the explanation names it.
- **Legend:** "queued write (clock badge)" and "refused write (× on the volume)" are badges under the volume's name, not
  on the bar; "promised but unbacked (hatched outline)" is the kit's `ghost` (dashed outline), since `soft` (hatched)
  marks deleted-but-kept here.
- **Labels shortened to fit the panel:** preset names (Sve stane, Jedan napuni bazen, Proširenje, Obrisano, Pogreška),
  threshold "Prag", percent "Raste za". The hints give the full story.
- `sim.json` has two `entries` (`one-tenant-fills`, `deleted-not-returned`), so they show on the home page; the
  coordinator can change them.

## Sources

- Task "Model and presets" (rules 1–7, params, presets, captions, terms, misconceptions).
- lvmthin(7) from this machine (lvm2 2.03): "Automatic extend settings" (threshold minimum 50, 100 = off, "exceeds", the
  70/20 example), "Data space exhaustion" (`errorwhenfull n` queues writes for up to 60 s by default, then errors;
  `y` errors at once; reads go on), "Discard". lvm.conf(5) `thin_pool_autoextend_threshold`,
  `thin_pool_autoextend_percent` ("in percent of its current size").
- From memory, not re-read here *(check)*: the lvcreate overcommit warning text; lvs(8) Data% for thin LVs relative to
  their virtual size; dm-thin `no_space_timeout` (kernel thin-provisioning.rst); dmeventd polling; whether newer lvm2
  grows by more than the percent (to get under the threshold) or partially.
- `lnx-lvm-snapshot` and `lnx-lvm-extend` (vocabulary, all-or-nothing growth, "exceeds", changed-cell style); UL ch12
  (PV/VG/LV vocabulary). `lnx-live-migration` (explorer page structure on K3, `track()` of changed values).
- `single-page-labs/lvm-topology-lab-v2.html`: not used beyond the idea (adopted as `lvm-topology`, linked as related).

## Term pairs

Missing from `kit/glossary.js` (written out in the explanation as *English* (Croatian) at first mention):

- thin provisioning — tanko dodjeljivanje (NLA toc T20)
- thin pool — tanki bazen *(check)*
- overcommit — prekomjerno dodjeljivanje *(check)*
- discard — odbacivanje blokova *(check)*
- thin volume — tanki volumen

`logical volume`, `volume group`, `file system` come from the glossary.

## Shared requests

- **K3 meter tick style:** a `mark.style: 'dashed'` (or a page token) for the threshold tick; done here in page CSS
  (`.sd-bg-tick { border-left-style: dashed }`).
- **K3 meter badges:** a way to put a small badge (✕, a clock) on a meter segment, so a refused or queued part can carry
  its mark on the bar itself. Worked around with a badge beside the bar.
- Carried from `lnx-lvm-snapshot`: `.sd-ctl[hidden]` (kit.css `display: flex` beats `hidden`). Same workaround here.
- **Panel controls in two columns:** a param option (`half: true`) so pages with many short controls need no page CSS
  on `.sd-group`; done here with a grid on `[data-sd-controls] .sd-group` keyed by `data-key`.

## Checks

- Numbers before the page: a node script printed pool size, Data%, VG free, overcommit, refusals, extensions and each
  volume's numbers for every preset (with discard off and on); all match SPEC.md.
- `node --test sims/lnx-thin-overcommit/sim.test.js`: 18 tests, tie-breaks first.
- Scripted Playwright sweep (1920×1080, hr and en): all five presets, `deleted-not-returned` with discard, and extreme
  params (pool 50 / 200 / 60, four 100-GiB volumes all full, autoextend at 10 % and 50 %, threshold 50 and 95, VG 100,
  deletions with and without discard): no panel scroll, no stage overflow, no page scroll, no console errors, no
  `undefined`/`NaN`.
- Mutations (each broken once, all caught after the review): allocate on rewrite, ≥ in autoextend, partial growth,
  discard ignored, rewrite refused when full, Data% against the original size, writes not clamped, volume order
  reversed, deletion after all writes, volume Data% from the filesystem's use, threshold or percent fixed at 70 / 20,
  overcommit or warning against the grown pool, "full" at 95 %, the rewrite note never dropped, the was-full caption,
  `cFullExact`, the free space at refusal.
- `npm run gate -- lnx-thin-overcommit`: pass (manifest, tests 23, build, browser 48/48, tokens, scope); `npm test` 5243 pass; `npm run check` 0 errors.

## Review

A fresh reviewer read the diff against the task and `SPEC.md`, mutated a copy of the model, checked the LVM facts
against lvmthin(7) and lvm.conf(5) on this machine, and loaded every preset in hr and en in a browser (no console
errors, numbers as in SPEC.md). Fixed from the review:

- Caption after thin1 hit the full pool and then discarded said "the pool is full" while it no longer was: new
  `cWasFullQueue` / `cWasFullError`, worded with the free space at the moment of refusal.
- `?threshold=abc` or `?percent=x` gave NaN on the page: every range now has `value` (the kit falls back to it), and
  the model clamps threshold and percent.
- "The next new block will be refused" when promised = pool and every volume is at its size: new `cFullExact`.
- Presets 50/40 instead of `virt` 80 (above).
- "Rewrites still work" now adds that a filesystem getting write errors usually goes read-only; the explanation names
  the syslog warnings at 80/85/90/95 %.
- Croatian: "pisači" (printers) → "u stvarnosti se pisanja isprepliću"; "pun {p}" → "popunjen {p}"; "upravo pun" → "točno
  pun"; "Odmah pogreška" → "Pogreška bez čekanja"; "Jedan puni" → "Jedan napuni bazen"; "Odbijen je i …" → "I … ostaje
  bez mjesta"; "LVM upozori, ali dopusti" → "upozorava, ali dopušta"; "Kod … prag" → "Pri … prag"; metadata clause.
- Dead `autoextend()` call after the discard and unused `extAside` string removed; five tests added for the surviving
  mutants.

## Time

Start 2026-11-04 01:10 CET, done 01:38 CET (about 28 minutes, review included).
