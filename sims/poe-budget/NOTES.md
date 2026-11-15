<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# poe-budget: notes

New explorer (task `docs/tasks/w3/poe-budget.md`, catalogue `net-poe-budget`, §4.1, wave 3). Rules and expected
numbers: `SPEC.md`. No kit view is named by the task; the stage is plain HTML (a grid of port boxes, a flex bar for
the gauge, two tables).

## Decisions

- **Ports.** Each device kind fills its own block: phones 1–24 (the top row), APs 25–32, cameras 33–40, PTZ 41–42;
  43–48 stay empty. A count change never moves another kind, so the "changed" marks stay on the ports that really
  changed, and the priority preset's "highest port first" reads off the top row. The task says "added in a fixed
  order"; this is that order.
- **Port labels.** The task asks for `class n · PSE W · PD W` on each port. Forty-eight ports in two rows of 24 leave
  about 55 px per port at 1920 × 1080, too narrow for that label at 16 px. Each port shows its number, the device
  letter and the watts reserved (or asked for, when denied or shed); class, PSE and PD are in the port table (runs of
  consecutive ports) and the class table beside it, which marks the classes in use with the device letters.
- **Table.** The task's per-port table would need up to 42 rows. It shows runs of consecutive ports with the same
  device, state and allocation instead ("1–22 · IP phone · 2 · low · 22 × 7 W · 6.49 W · powered"); at most a handful
  of rows.
- **Gauge.** Powered allocations stacked in port order in the device colours; then the requests that were denied or
  shed, hatched and dashed, past the budget line, so "the 6th camera needs 15.4 W and 5 W are left" is visible.
- **Class 0 and 3 at the device: 12.95 W**, the 802.3af figure, not the task's rounded 13.0 (SPEC.md rule 1). The
  cable column of the class table is PSE − PD.
- **`bt` port type** is Type 4 (90 W per port). The task's rule 6 lists Type 3 (60 W) and Type 4 (90 W) but the param
  has one `bt` option; no device in the sim is above class 6, so Type 3 or 4 give the same results. The PD at a
  capped port is the PD of the cap's class (at: 25.5 W, bt: 71.3 W).
- **Measured mode** reserves the example draw as the port measures it; the PTZ camera's 40 W on an `at` port is
  capped at 30 W and limited too.
- **Shedding** (rule 5) frees ports one at a time, lowest priority then highest port, and stops as soon as the device
  fits; if every candidate together is not enough, nothing is shed and the device is denied (shedding for nothing
  would be worse than useless). Equal priority never sheds. Shed ports stay down for the pass; a smaller, later
  device can still use the leftover.
- **Priority levels.** The model knows low, high and critical (the vendor levels); the page uses low (phones) and
  critical (APs, cameras, PTZ). The tie-break tests use all three through `allocate()`.
- **Priority column** shows "—" while priorities are off: the switch then treats every port alike.
- **Captions** (both languages, from the start): the totals (class mode: allocated of budget, what is left;
  measured mode first the task's sentence, "the same 34 devices reserve 172 W instead of 380.4 W …"), then a shed
  event, then a denial (and how many more), else a limited port, else, in class mode, how little the devices really
  draw. The Croatian denial caption starts with the port ("Priključak 38 (kamera) traži 15,4 W (klasa 3), a ostalo
  je 5 W — priključak ostaje bez napajanja.") rather than the task's "Šesta kamera", so it works for any device
  without ordinal agreement.
- **Panel.** Eight params and five presets did not fit at 1920 × 1080 (1153 px > 800 px). The page puts the presets
  in two columns and the four device counts in a 2 × 2 grid (as `amdahl` and `aaa-8021x` do for presets), shortens
  the count labels to "Phones (T)" etc. (classes are in the tables), and drops the priorities toggle's hint (the
  table's priority column says it). No exception declared.
- **Examples labelled.** A note under the port table says the device draws and the 370 W budget are examples, not
  values from the standard (the task's note for the coordinator).
- **Concepts, not tools.** No vendor is named on the page; the IEEE standard names are, as in the course book.

## Deviations from the task

- No thin client: the task's tray lists one, but its params, presets and legend have no thin-client count, class or
  draw. Adding one would need an unchecked class and draw; left out.
- Port labels and the table grouped as above (layout, not model).
- Class 0/3 PD 12.95 W instead of 13.0 W.

## Numbers checked

An independent Python script (exact fractions, its own allocation loop, not the JS model) computed every preset:

```
office    288 W allocated, 82 W left, 28 powered; draws 24 × 3.5 + 4 × 13 = 136 W
cameras   365 W, 5 W left, demand 380.4 W; port 38 denied
measured  172 W, 198 W left, 34 powered
priority  366.4 W, 3.6 W left; ports 24 and 23 shed (14 W freed); 32 powered
ptz       318 W, the PTZ camera limited to 30 W; with bt 348 W, 60 W, powered
```

All match the task file. The tests check these and every rule; 25 mutations of `sim.js` (budget `<`, shed order,
priority order, equal-priority shedding, partial and total shedding, port-order sort, stop at first deny, class vs
measured, cap, limited `>=`, PD at cap, class 3 PD, priority always on, AP priority, camera block, clamps, limited
state, changedPorts, groups, deny event, demand) each fail a test.

## Unchecked *(check)*

- The class table numbers (rule 1) are the widely quoted IEEE 802.3af/at/bt figures; the standards were not opened.
- Class-based vs measured allocation, priority levels and "shed lowest priority, highest port first" are common
  vendor practice (power management modes, port priority); no vendor guide was opened. Vendor behaviour differs
  (some take the LLDP request, some add a margin); the page names no vendor.
- "The data link may still be up" on a denied port: vendor practice.
- Device draws (3.5, 13, 6, 40 W) and the 370 W budget: typical examples, not from a source; labelled on the page.
- Croatian terms: proračun snage (power budget), izvor napajanja (PSE), napajani uređaj (PD) are the task's
  suggestions, marked *(check)* there.

## Term pairs

Missing from `kit/glossary.js`; written out by hand in the explanation (hr: the English in italics, the Croatian in
parentheses at first mention):

| en | hr |
|---|---|
| Power over Ethernet (PoE) | napajanje preko Etherneta (URM ch02) |
| power budget | proračun snage *(check)* |
| power sourcing equipment (PSE) | izvor napajanja *(check)* |
| powered device (PD) | napajani uređaj *(check)* |
| class | klasa |
| priority | prioritet |
| access point | *access point* (URM ch02 keeps the English) |

## Shared requests

- None.

## Tags

Topic `networks`, tag `ethernet`, level `intro`: all in `tags.json`. Suggested `learn.json` leaf:
`networks/local/switching` ("How a switch learns", with `mac-table`), or a new leaf under `networks/local`, e.g.
"Power over the data cable", if the coordinator prefers to keep that leaf about learning.

## Review

A fresh reviewer read the code against `SPEC.md`, recomputed the presets in a browser and ran its own mutations on a
scratch copy. Model and preset numbers: no defect. Fixed from the review:

- the gauge's scale was `max(budget, total + requests)` while the bar draws `budget + requests`, so a denied request
  stuck out past the bar's end; the scale is now `budget + requests`;
- "changed" marks were keyed on the result, so a param change that changed nothing left the old marks; they are
  now keyed on the params (a change with no effect clears them);
- "At device" showed the class PD for denied and shed ports; it shows 0 W there now. Port tiles still show what a
  denied or shed port asked for (SPEC.md "Page" says so);
- measured-mode caption: verb agreement moved into the plural forms ("ista 34 uređaja rezerviraju", "the same 1
  device reserves"), and the sentence is left out when both modes ask for the same watts;
- a single shed port gets its own sentence (no "highest number first"); Croatian 2–4 agreement avoided ("slobodno
  {left} W", "u proračunu ima još samo {left} W", "ne stane u ostatak proračuna ({left} W)"); "the device on port
  41 is class 6", not the port; two Croatian phrasings in the explanation and the examples note;
- SPEC.md: shed events carry `left`; the caption order (shed, then denial) is written as the page does it; the
  rounding of params is stated.

Twelve of its mutations had survived (shed port left in the powered list, a device powered by shedding never
shed later, the tie-break inside a non-lowest priority, limited only in class mode, uncapped demand, a fixed `cap`,
events out of order, `changedPorts` without the state, the budget's NaN guard, the exported constants, floor
instead of round for the budget and the counts). Tests were added; all 37 mutations now fail a test.

## Time

2026-11-15, 12:29 to 12:47 by the wall clock (one session), including the fresh review (about 6 minutes) and its fixes.
