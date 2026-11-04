<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ipam-utilisation: notes

Built in thread t-0251 from `docs/tasks/w3/win-ipam-utilisation.md`. Rules and expected numbers: `SPEC.md`.

## What it shows

IPAM's utilisation view of the block `10.0.0.0/16` and its five ranges (DHCP scopes) on DHCP1 and DHCP2: a block card
(aggregate bar, threshold ticks, status, "collected at"), a range table (size, used, utilisation bar with threshold
ticks, status chip, trend sparkline of the weeks so far), and a detail of the selected range or the block: what its
used addresses are (resident devices, leases of today's visitors, leases of devices that have left, reservations,
free, devices without an address) and its trend over the term with the first week over (△) and the first week full
(✕). The week slider drives the students range; the other four are steady. Five presets, the task's: `byod-term`,
`short-lease`, `hidden-hotspot`, `server-vlan-under`, `threshold-70`.

## Decisions and deviations from the task

1. **Percentages to one decimal** (27,5 % / 27.5 %, 2,4 %, 8,9 %), ",0" dropped. The task's presets say 28 % and 2 %
   (rounded). With a 200-address range every address is 0.5 %, so a rounded figure would show "20 %" on a range that is
   under-utilised (19.5 %) or "80 %" on one that is over (80.4 % in a larger range). Status is decided on exact
   integers (used × 100 vs threshold × size), the display never contradicts it. The block caption still reads 9 %.
2. **Tie-break: exactly at a threshold is optimal** (strict > and <). Microsoft's cmdlet page says IPAM alerts when
   utilisation "exceeds or drops below" a threshold, which supports this. `byod-term` week 0 (160 of 200 = 80 %) is
   optimal and the caption says why; week 1 (170) is over.
3. **The other ranges and their numbers are the model's** (staff 2 600 / 4 094, labs 2 400 / 4 094, phones 694 / 1 022,
   servers 6 reservations / 254), chosen so they sum to the task's 5 700 and the server range is 2.4 %. They do not
   grow: the concept is the one range that fills.
4. **"Used" = leases + reservations.** The server range's 6 are reservations, so rule 1's "incl. reserved" is on the
   page. A reservation takes capacity from dynamic leases (refused = demand − (size − reserved)).
5. **Composition of a full range** (toy, derived): residents first, then visitor leases, today's visitors the newest.
   When residents alone fill it (week 16, 1-day lease), the visitors are the ones refused.
6. **Rule 4 (collection)** is shown as a line ("Collected: week w, Monday 08:00 · every 2 h"): the view is read at
   Monday 09:30, the last 2-hourly run was 08:00. The toy model does not change within a week, so the lag never changes
   a number; it says where the numbers come from. Modelling hours would be a second concept.
7. **Rule 6 (failover once)** is visible in the block card: the students scope shows "DHCP1 + DHCP2, failover" and the
   card gives the sum of both servers' reports, which counts the students scope twice (6 020 instead of 5 860 at week 0
   with the defaults).
8. **Stage selection** is a hidden param `sel` (a range id or `block`; default `students`): clicking a range name or the
   block selects it, the detail and the caption follow. `hidden-hotspot` sets `sel: block`, `server-vlan-under`
   `sel: servers`. The presets' captions are derived from state, never from the preset id.
9. **Presets:** `byod-term` = week 1 (the first week over), `short-lease` = lease 1, week 11, `hidden-hotspot` = week 4
   (the first week full) with the block selected, `server-vlan-under` = week 0 with the servers range selected,
   `threshold-70` = lease 1, over 70, week 9.
10. **The large trend shows the rest of the term dotted** ("later, if nothing changes"), and the △/✕ marks for weeks
    still ahead are dotted too. The task says "the weeks so far" for the sparklines, which do show only those; the
    large chart needs the rest for "four weeks before it is full" to be visible.
11. **Captions** are the task's wording where the state matches (week 11 short lease; hidden hotspot), with the number
    of weeks as a digit ("4 tjedna", "4 weeks") from the model, as in `win-ipam-address-plan`.
12. **Presets in two columns** (as `amdahl`, `dns-ttl-cache`): five presets and six params did not fit the panel at
    1920×1080 in one column (979 > 898 px). Preset labels are short.
13. **Tags:** `ip-addressing`, `dhcp`, `performance`; topic `windows-admin`, level `advanced`. All exist in
    `tags.json`. `dhcp` added per the task's coordinator note (scopes and leases are the subject); no
    `authentication`.
14. **Lease is "dodjela"** in Croatian (UL ch. 18, `win-ipam-audit`), not "zakup" (`win-dhcp-failover`); the glossary
    has no *lease* yet (docs/tasks/OPEN.md, glossary conflicts).

## Kit views

None. The table is not a K4 rule table (no rule is matched), and the bars are utilisation bars, not K3 block grids.
Lines of the trend charts are SVG with `vector-effect: non-scaling-stroke` and no text; every label is HTML.

## Model reuse

`win-ipam-address-plan` is not in `models/`. From its `sim.js @ a22e9ec` only `format` (and the block object's shape:
name, base, prefix, size) is copied, marked in `sim.js`. Nothing else of that model is needed here (no placement or
alignment). The reusable part of this model (`leasesAt`, `status`, `blockUsed`, `collectedAt`) is pure and promotable.

## Shared requests

- **Glossary terms** (below).
- **A utilisation bar / meter with threshold ticks and a status shape** (K3's meter has no ticks): this page's
  `.iu-bar` is a start. Consumers: this sim, `sto-smallest-disk-caps`, `lnx-thin-overcommit`-like pages.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| utilization | iskorištenost | task |
| threshold | prag | task |
| over-utilized | prepunjen | task *(check)* |
| under-utilized | nedovoljno iskorišten | task *(check)* |
| lease | dodjela | UL ch. 18 (glossary question open) |
| lease duration | trajanje dodjele | UL ch. 18 |
| failover | preuzimanje u slučaju kvara | `win-dhcp-failover` |
| reservation | rezervacija | simdeck |

`pool` → skup adresa is in the glossary and used as `[[pool]]`.

## Sources

- Microsoft, **"Set-IpamAddressUtilizationThreshold"** (IpamServer module, learn.microsoft.com, read 2026-11-04): IPAM
  alerts "when a block, subnet, or range utilization exceeds or drops below the overutilization or underutilization
  thresholds"; the over threshold must not be below the under one; the example output shows under 20 before it is
  changed. **Checked**, except the defaults: the page lists no default, so **80 % is unchecked** *(check)* and 20 % is
  seen only in example output *(check)*. The task's title "Set-IpamConfiguration" is a different cmdlet; the
  thresholds are set with Set-IpamAddressUtilizationThreshold.
- Microsoft, **"MSFT_IPAM_IPAddressUtilizationThreshold class"** (archived, read 2026-11-04): two uint32 percentages,
  for a range, subnet or block. **Checked.**
- Microsoft, **"IPAM Architecture"** (Windows Server 2012 R2, technet `jj878342`), via a search summary 2026-11-04:
  the AddressUtilization task collects address space usage from DHCP servers every 2 hours by default. Checked through
  the search summary only, not the page itself *(check)*.
- The task's "IPAM: monitor IP address utilisation": not found under that title; the utilisation formula (used /
  size; block = sum of its ranges) and "reservations count as used" are *(check)*.
- "A failover scope is counted once in the block" *(check)*: the model's rule (one scope, one range in IPAM).
- `uvod-u-linux` book, `18-mrezne-usluge.md`, "Koliko dodjela traje, i zašto to nije proizvoljno" (short vs long
  leases; "skup adresa se iscrpi") and "Primjer 3 — koliko traje dodjela u učionici" (the pool fills with machines
  that have left). Read 2026-11-04.
- `sims/win-ipam-address-plan/sim.js @ a22e9ec`: `format`.

## Unchecked *(check)*

- Default thresholds 80 % / 20 % (see Sources); whether the comparison at exactly the threshold is strict.
- Block size 65 536 (every address of the /16) as IPAM's block size.
- Reserved addresses counted as used; a failover scope counted once.
- The term model (rule 3) is derived and unchecked by design: the presets' numbers are the task's own examples,
  checked arithmetically (`sim.test.js`, and the thread's `hand-model.py` in the library folder).
- "prepunjen" / "nedovoljno iskorišten" as the Croatian terms.

## Fresh review (playbook §7.4)

A separate agent re-implemented the model from SPEC.md in Python and compared 104 448 param sets field by field
(0 mismatches), then ran 48 mutations of `sim.js`: 33 killed, 9 equivalent survivors (status checks swapped while
under < over always holds, clamps the kit applies first, VIEW_HOUR 9 vs 9.5 in the same 2-hour slot, and an unused
block `firstOver`, now removed), and 6 real gaps, now tested and each seen to fail once: `refused` going negative
when not full, residents and today's visitors not clamped to the capacity, `free` ignoring reservations, `firstFull`
one address short, and the clamps/defaults of `growth`, `under`, `over` (the model now clamps every param to its
slider bounds, rounds it, and takes the default for a missing value). Unused `hot` output removed.
Caption fixes from its scan of the reachable states: week 0 already over or full no longer says "crosses" (it says the
term starts above the threshold); an under-utilised students range says so, with a tie note at `under` too; the block
caption names the fullest range, not the first over in table order; "no visitors" instead of "0 a day × 1 day"; a
crossing in the week the range fills says "the same week"; en `capNever` now means "does not go above" like the hr.
Strings: en "over-utilised" throughout (the task's en caption writes IPAM's "over-utilized"; the hr keeps
*over-utilized* as the italic English term); the server preset says 2.4 %; an unused key removed. SPEC.md errata
fixed (rule 6's naive sum, the display note, the hidden-hotspot status, the block's status depending on `under`).
Left as is: "prepunjen" for *over-utilized* (the task's term, marked *(check)*; "pun" is the 100 % state).

## Checks

- `node --test sims/win-ipam-utilisation/sim.test.js`: 21 tests.
- `npm run gate -- win-ipam-utilisation`: passes (46/46 browser checks).
- A browser sweep of 12 states × 2 languages at 1920×1080 (each preset; full with devices refused; full at week 0;
  never over; tie at 95 %; the block and a steady range selected): no console errors, no stage overflow, no empty
  caption slots (two found and fixed: a node reused in two sentences). A second sweep of the reviewer's 7 problem
  states in both languages after the caption fixes.

## Time

About 25 min: start 17:55, done 18:20 (2026-11-04), including a fresh review by a separate agent (7 min).
