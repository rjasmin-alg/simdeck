<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ipam-address-plan: specification

One concept: **blocks → ranges → addresses for sites and VLANs, with room to grow.** The student allocates a block
to sites, runs out, and re-plans. Class: explorer (no steps). Task: `docs/tasks/w2/win-ipam-address-plan.md`.

Sources: URM = *Uvod u računalne mreže*, ch. 9 (`09-podmrezavanje.md`) and ch. 12 (`12-izgradnja-mreze.md`);
MS-ASM = Microsoft, "Managing IP Address Space" (Windows Server 2012 R2 and 2012, archived, read 2026-10-16);
MS-OV = Microsoft, "IP Address Management (IPAM) Overview" (same series, read 2026-10-16); RFC 1918; RFC 4632.

## 1. State

Params: `block` (`192.168.1.0/24` | `10.20.0.0/16`), `growth` (0–200 %, step 25), `nabava` (`off` | `add` |
`plan`), `strategy` (`largest` | `listed`), `twoSites` (the needs set: false = Grafo, true = two sites), and two the stage sets: `first`
(the need moved to the top of the list, `''` none) and `sel` (the range whose addresses are shown, `''` the first
in the table).

`plan(params)` returns: `block { name, base, prefix, size, broadcast }`, `ranges[]` in list order
`{ id, hosts, needed, site, vlan, link, added, listed, rank, prefix, total, usable, placed, start, end, network,
broadcast, mask, first, last, managedBy, util, full, cursor? }`, `order` (ids by address, unplaced last),
`placeOrder`, `free[] { from, to, size, gap }`, `freeTotal`, `gapTotal`, `sum`, `used`, `end`, `fits`,
`firstUnplaced`, `errors[] { code: 'sum' | 'noRoom' }`. Offsets (`start`, `end`, `from`, `to`) count from the
block's first address.

## 2. Needs

| Set (`twoSites`) | Need | Hosts | Site / VLAN | Source |
|---|---|---|---|---|
| false | Prodaja (sales) | 60 | Sjedište, VLAN 10 | URM ch. 9 Primjer 1; VLAN: ch. 12 |
| false | Proizvodnja (production) | 28 | Sjedište, VLAN 20 | same |
| false | Uprava (management) | 12 | Sjedište, VLAN 30 | same |
| false | Podružnica (branch) | 10 | Podružnica, no VLAN | same ("Podružnica sama ne treba VLAN") |
| false | Gosti (guests) | 6 | Sjedište, VLAN 40 | same |
| false | R1–R2 (link) | 2 | the link between the sites | same |
| `nabava` ≠ off | Nabava (purchasing) | 4 | Sjedište, VLAN shown as "?" | URM ch. 12 Primjer 3 (its VLAN is the book's open question 2) |
| true | ZG-10 … ZG-60 | 200 each | Zagreb, VLAN 10–60 | task file, preset 5 |
| true | ST-10 … ST-30 | 100 each | Split, VLAN 10–30 | task file, preset 5 |

List order is the table order above; Nabava is appended last; `first` moves that need to the top (an unknown id
changes nothing).

## 3. Rules

1. **Size.** `needed = ceil(hosts × (1 + growth/100))`, computed in integers. The range is the smallest prefix
   `n ≤ 30` with `2^(32−n) − 2 ≥ needed` (URM ch. 9 Primjer 1, Korak 1). *Decision:* a router link does not grow:
   it has exactly two ends whatever the growth (needed for the task's preset 3 numbers, where R1–R2 stays /30 at
   100 %).
2. **Order and alignment.** `largest`: biggest range first; **tie-break: equal sizes keep the list order** (Uprava
   before Podružnica; `first` can swap them). `listed`: the list order. Each range starts at the next address at or
   after the end of the previous one that is a multiple of its own size (URM ch. 9 Primjer 1, Korak 2; the urm-vlsm
   `allocate`, copied from `sims/vlsm/sim.js @ b8448ec`). A range that does not fit is left out and the cursor stays.
   "As listed" shows the gaps alignment creates.
3. **No overlap, inside the block.** Placed ranges never overlap and lie inside the block (URM ch. 9; MS-ASM:
   "ranges that map to the same block cannot overlap", a range maps to one block only).
4. **Doesn't fit.** If a range cannot be placed the plan does not fit: `fits = false`, `firstUnplaced` = the first
   in placement order that failed (the stage marks it ✕), every unplaced range is listed after the placed ones.
   `errors` has `sum` when the sizes add up to more than the block, and one `noRoom` per unplaced range. With these
   needs every failure the page can reach also has `sum` (checked over all param sets); a failure from alignment alone
   (as listed) is tested on `allocate` and has its own caption.
5. **Hierarchy.** A block (here a private RFC 1918 block) contains ranges; a range typically corresponds to a DHCP
   scope; addresses map to one range (MS-ASM). A range's start and end are usable addresses (MS-ASM: "blocks begin on
   a network ID and end on a broadcast address, unlike IP address ranges which start and end on usable IP
   addresses"): `first = network + 1`, `last = broadcast − 1`. *Managed by:* client ranges `dhcp` (a DHCP scope),
   the router link `ipam` (static; MS-ASM: a manually added range defaults to "IPAM").
6. **Links.** /30 for router links (2 usable); /31 (RFC 3021) is out of scope (`MAX_PREFIX = 30`).
7. **A later addition** (*decision*, needed for preset 2's numbers): with `nabava: 'add'` Nabava arrives after the
   plan is in use, so the ranges already placed do not move; Nabava takes the **lowest** start that is a multiple of
   its size and lies wholly in free space (first fit, which can reuse an aligned gap). `cursor` is the end of the
   plan before it (for the caption). With `nabava: 'plan'` Nabava is one more need in the list and the plan is made
   again from scratch (re-plan): largest first puts it before R1–R2, which moves.
8. **Free space.** The free intervals of the block; one that ends before the end of the last placed range is a
   **gap** (dotted on the stage), the rest is **reserve** (hatched). `freeTotal = block size − used`.
9. **Utilisation** shown per range is today's hosts ÷ usable, rounded to a whole percent; `full` when a client
   range has no address left for growth (hosts ≥ usable; Gosti /29 at 0 % growth, URM ch. 9). Links are never
   `full` (two ends by design).

## 4. Presets and expected numbers (checked by `sim.test.js` and an independent Python hand model)

| # | id | Params | Expected |
|---|---|---|---|
| 1 | `grafo` | defaults | Prodaja /26 .0–.63, Proizvodnja /27 .64–.95, Uprava /28 .96–.111, Podružnica /28 .112–.127, Gosti /29 .128–.135, R1–R2 /30 .136–.139; free .140–.255 = 116, no gap (URM ch. 9 Primjer 1) |
| 2 | `add-nabava` | `nabava: 'add'`, `sel: 'purchasing'` | Nabava /29 at .144–.151 (`.140` is not a multiple of 8); gap .140–.143 (4); free 108 = 4 + 104 (.152–.255) |
| 3 | `double-growth` | `growth: 100` | /25, /26, /27, /27, /28, /30: sum 276 > 256; Prodaja .0–.127, Proizvodnja .128–.191, Uprava .192–.223, Podružnica .224–.255; Gosti is the first that cannot be placed, R1–R2 cannot either; errors `sum`, `noRoom` × 2 |
| 4 | `as-listed` | `strategy: 'listed'`, `first: 'guests'` | Gosti .0–.7, Prodaja .64–.127 (gap .8–.63 = 56), Proizvodnja .128–.159, Uprava .160–.175, Podružnica .176–.191, R1–R2 .192–.195; free 116 = 56 gap + 60 reserve (.196–.255) |
| 5 | `two-sites` | `block: '10.20.0.0/16'`, `twoSites: true` | ZG-10…ZG-60 /24 at 10.20.0.0–10.20.5.255, ST-10…ST-30 /25 at 10.20.6.0–10.20.7.127; free from 10.20.7.128, 63 616 addresses |

Other checked values: `nabava: 'plan'` puts Nabava at .136–.143 and R1–R2 at .144–.147 (no gap, free 108);
growth 25 % already does not fit Grafo in the /24 (sum 260, R1–R2 is first unplaced); preset 3 with the /16 fits.

## 5. Stage

- **Bar:** the block as a horizontal bar, each placed range a segment whose width is its size, its name and prefix
  inside (or above, in a callout with a stem, when the segment is too narrow; the page measures this after layout);
  reserve hatched, gaps dotted, each free piece labelled with its size; ticks under it at range and free starts and at
  the block's last address. In the /16 the bar shows a window (the smallest power of two from the block's start that
  holds every placed range, at least 256), with a strip of the whole block over it marking the window. Unplaced
  ranges hang past the block's end, each with a dashed `--danger` outline, ✕ and its name; the first unplaced has the
  thicker outline.
- **IPAM table** (one table; the needs are columns of it, NOTES decision 4): the block row (network, RFC 1918, size,
  used, free), then its ranges by address, unplaced last with ✕ and struck through: ↑ (moves the need to the top of
  the list, pressed again it undoes), name, site / VLAN, hosts today → with growth, network/prefix, mask, total,
  usable, managed by, utilisation with "full". The selected range opens a row of sample addresses: network, first
  usable, last usable, broadcast. A last row gives the sum of the ranges against the block size.
- **Changed:** ranges whose position or size changed with the last param change carry the kit's changed mark (page
  memory, not model state); a re-render with the same params keeps the marks.
- **Captions:** does not fit (with or without the growth advice), a later addition (with a gap, aligned at once, or in
  a reused hole), as listed with a hole (the first range, the largest hole and the range behind it), and otherwise
  the first two placements and the free space.

## 6. Out of scope

IPv6, IPAM discovery and utilisation collection (`win-ipam-discovery`, `win-ipam-utilisation`), route
summarisation, /31 links, IPAM utilisation thresholds.
