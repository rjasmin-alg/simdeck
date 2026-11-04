<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ipam-utilisation: spec

Task: `docs/tasks/w3/win-ipam-utilisation.md`. Catalogue §4.5.5. Class: explorer (no steps).

**Concept:** scope fill across servers; IPAM's thresholds alert before a range runs out.

## 1. Scene

An IPAM-style utilisation view of one block, `10.0.0.0/16`, and the five IP address ranges (DHCP scopes) in it,
spread over two DHCP servers, DHCP1 and DHCP2. A week slider (term weeks 0–16) lets leases grow over a term.

- **Block card** (top): name, used / size, utilisation with a bar, threshold ticks at *under* and *over*, status.
- **Range table:** name, server, start – end, size, used (leases + reservations), utilisation bar with threshold
  ticks, status chip, and a trend sparkline of weeks 0 … week.
- **Detail** of the selected range (or the block): what the used addresses are (residents, visitor leases of
  devices here today, visitor leases of devices that have left, reservations, free, devices refused) and a larger
  trend chart over the term with the thresholds, the first week over and the first week full.
- "Collected at" line: the numbers are as IPAM last collected them.

## 2. Data

| id | server | start – end | size | residents at week 0 | growth / week | visitors / day | reserved |
|---|---|---|---:|---:|---:|---:|---:|
| `staff` | DHCP1 | 10.0.0.1 – 10.0.15.254 | 4 094 | 2 600 | 0 | 0 | 0 |
| `labs` | DHCP2 | 10.0.16.1 – 10.0.31.254 | 4 094 | 2 400 | 0 | 0 | 0 |
| `phones` | DHCP2 | 10.0.32.1 – 10.0.35.254 | 1 022 | 694 | 0 | 0 | 0 |
| `students` | DHCP1 + DHCP2, failover | 10.0.40.20 – 10.0.40.219 | 200 | 40 | param | param | 0 |
| `servers` | DHCP1 | 10.0.50.1 – 10.0.50.254 | 254 | 0 | 0 | 0 | 6 |

Other ranges than `students` are steady over the term (their used counts sum to 5 700, the task's
`hidden-hotspot` figure: 2 600 + 2 400 + 694 + 6). Lease of the steady ranges: 8 days (it does not change their
numbers). Block: `10.0.0.0/16`, 65 536 addresses (task; IPAM's block size counts every address of the prefix
*(check)*).

As IPAM collects them, DHCP1 reports the scopes `staff`, `students`, `servers`; DHCP2 reports `labs`, `phones`,
`students`.

## 3. Params

| key | type | values | default |
|---|---|---|---|
| `week` | range | 0 … 16 | 0 |
| `lease` | choice | 1 day / 8 days | 8 |
| `growth` | range | 0 … 20 residents per week | 10 |
| `visitors` | range | 0 … 30 per day | 15 |
| `over` | range | 60 … 95 %, step 5 | 80 |
| `under` | range | 5 … 40 %, step 5 | 20 |
| `sel` | hidden | a range id or `block` | `students` |

`growth`, `visitors` and `lease` apply to `students` only. The model clamps every param to these bounds and rounds
it to a whole number; a missing or non-numeric value takes the default. The bounds keep `under` < `over`.

## 4. Rules

1. **Utilisation.** A range's utilisation = used / size, where used = dynamic leases + reservations, at most the
   size. A block's utilisation = the sum of its ranges' used / block size. (Formula *(check)*; "reserved counts
   as used" *(check)*.)
2. **Status.** Under-utilised when utilisation < `under`, over-utilised when utilisation > `over`, optimal
   otherwise. **Tie-break:** exactly at a threshold is optimal (strict comparisons), compared in integers
   (used × 100 against threshold × size), never on a rounded percentage. Microsoft, "Set-IpamAddressUtilizationThreshold":
   IPAM alerts when utilisation "exceeds or drops below" a threshold, for a block, subnet or range (checked).
   Defaults 20 % and 80 % *(check: the page lists no default; 20 appears in its example output)*. The block gets
   a status by the same rule.
3. **Leases at week w** (derived toy model, unchecked; UL ch. 18 "Koliko dodjela traje" and Primjer 3):
   demand = residents0 + growth × w + visitors × lease days. Residents hold an address all term; each day's
   visitors leave the same day but their lease stays until it expires, so `lease` days of visitors hold a lease
   at once. Dynamic capacity = size − reserved; leased = min(capacity, demand).
   Composition: residents held = min(residents, capacity); visitor leases = min(visitors × lease, capacity −
   residents held); of those, today's = min(visitors, visitor leases), and the rest belong to devices that have
   left.
4. **Collection.** IPAM shows the numbers of its last address-utilisation collection, which runs every 2 hours
   (Microsoft, "IPAM Architecture", via a search summary *(check)*). The view is read on Monday 09:30 of week w, so the numbers are "collected Monday 08:00, week w"
   (`collectedAt(hour, interval) = floor(hour / interval) × interval`). Within one week the toy model does not
   change, so the lag never changes a number here; the line is there to say where the numbers come from.
5. **Full.** A range whose used = size is full and refuses new clients: refused = max(0, demand − capacity)
   devices get no address (UL ch. 18 "skup adresa se iscrpi").
6. **Failover counted once.** A scope served by a failover pair is reported by both servers but counted once in
   the block (distinct scope ids) *(check)*. Naive sum of the servers' reports, the students scope twice: 6 020 instead of 5 860 at
   week 0 with the defaults (6 100 instead of 5 900 at week 4).
7. **First weeks.** `firstOver` = the smallest week 0 … 16 whose status is over (null if none);
   `firstFull` = the smallest week 0 … 16 that is full (null if none). Trend = utilisation at every week 0 … 16,
   for each range and for the block (the block peaks near 9 %, so it has no first week over).

**Display.** Percentages are shown to one decimal, the trailing ",0"/".0" dropped (27,5 %, 9 %, 2,4 %). Status
is decided on exact numbers (rule 2), not on the shown figure; with one decimal and this data (the students range
moves in 0.5 % steps, no other range sits within 0.05 % of a threshold) a shown "80 %" is exactly 80 % and
optimal. Whole percentages would show "20 %" on 19.5 % (under).

## 5. Expected numbers (checked in `sim.test.js`, and by hand below)

| case | students used | util | status | firstOver | firstFull | block |
|---|---:|---:|---|---:|---:|---|
| defaults, week 0 (8-day lease) | 40 + 120 = 160 | 80 % | optimal (tie) | 1 | 4 | 5 860 / 65 536 = 8.9 %, under |
| `byod-term` (week 1) | 170 | 85 % | over | 1 | 4 | |
| week 4, 8 days | 200, refused 0 | 100 % | over, full | | | (5 700 + 200) / 65 536 = 9.003 % (shown 9 %), under |
| week 5, 8 days | 200, refused 10 | 100 % | over, full | | | |
| `short-lease` (1 day), week 0 | 55 | 27.5 % | optimal | 11 | 15 | |
| 1 day, week 10 / 11 | 155 / 165 | 77.5 % / 82.5 % | optimal / over | | | |
| 1 day, week 14 / 15 | 195 / 200 (refused 5) | 97.5 % / 100 % | over / full | | | |
| `threshold-70` (1 day, over 70, week 9) | 145 | 72.5 % | over | 9 (week 8: 135, 67.5 %) | 15 | |
| `server-vlan-under` | servers 6 / 254 | 2.4 % | under | | | |
| `hidden-hotspot` (week 4, sel block) | 200 | 100 % | over, full | | | 9 %, under (at under = 20) |

Caption figures: short-lease crosses 80 % at week 11, full at week 15 → "four weeks before it is full";
byod-term week 1 → 3 weeks before full. Composition at week 0, 8 days: residents 40, visitor leases 120, of them
15 today and 105 of devices that left; 1 day: 15 visitor leases, all today's.

## 6. Presets

| id | params | shows |
|---|---|---|
| `byod-term` | week 1 | an 8-day lease: over at week 1, full at week 4 |
| `short-lease` | lease 1, week 11 | the same devices, over at week 11, full at week 15 |
| `hidden-hotspot` | week 4, sel block | the block at 9 % (under at the default 20 %) while the students range is full |
| `server-vlan-under` | sel servers | 2.4 %, under-utilised: planning data, not a fault |
| `threshold-70` | lease 1, over 70, week 9 | the alert at week 9 instead of 11 |

## 7. Out of scope

Capacity planning beyond one term, IPv6 utilisation, IPAM's address-expiry alerts for static assignments,
discovery (`win-ipam-discovery`).
