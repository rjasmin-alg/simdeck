<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ipam-address-plan: notes

Built in thread t-0135 from `docs/tasks/w2/win-ipam-address-plan.md`. Rules and expected numbers: `SPEC.md`.

## What it shows

One IP address block (192.168.1.0/24 or 10.20.0.0/16) as a bar of ranges, and IPAM's block → ranges → addresses as
one table. The student changes growth, adds Nabava, switches to two sites or to "as listed", watches the plan stop
fitting, and re-plans with the larger block. Five presets, the task's: `grafo`, `add-nabava`, `double-growth`,
`as-listed`, `two-sites`.

## Decisions and deviations from the task

1. **Nabava is a three-way choice, not a toggle:** none / add later / re-plan. The task's preset 2 numbers (Nabava
   at .144–.151, gap .140–.143) only come out if the plan already in use stays put and Nabava takes the next aligned
   free slot; re-planning from scratch with largest first puts Nabava at .136–.143 and moves R1–R2 to .144. Both are
   real choices an administrator makes ("add without renumbering" vs "re-plan"), so both are on the page. "Add later"
   is first fit (the lowest aligned free slot, which can reuse a hole: with the `as-listed` preset Nabava lands in
   .8–.15). This bends the task's "every param change recomputes the plan from scratch": the plan is still
   recomputed from the params each time; Nabava "added later" is placed after the rest by rule.
2. **A router link does not grow.** The task's preset 3 sums /25 + /26 + /27 + /27 + /28 + **/30** = 276, which
   needs R1–R2 to stay a /30 at 100 % growth (with growth it would need 4 hosts → /29). A point-to-point link has
   two ends whatever the growth, so links are exempt (SPEC rule 1).
3. **The needs set is a toggle** ("Two sites: Zagreb and Split") instead of a two-way choice: the panel did not fit
   at 1920×1080 with five params as choices (962 px > 898 px).
4. **One table instead of a range table and a separate needs table.** Ten columns plus a needs table beside them did
   not fit beside the panel; each range is one need, so "hosts → with growth" became a column of the IPAM table.
   "Start – end" was left out of the table (the address row of the selected range shows network, first, last and
   broadcast).
5. **Two stage params the task does not list:** `first` (the ↑ button in a row moves that need to the top of the
   list; the `as-listed` preset needs Gosti first, and with largest first it changes the tie-break between equal
   sizes) and `sel` (the range whose sample addresses are shown). Both are hidden selects kept in the URL.
6. **"Managed by":** client ranges "DHCP (scope)", the router link "IPAM (static)". Microsoft's "MS DHCP" value is
   reserved for scopes IPAM discovers on a managed DHCP server, so the page says "DHCP (scope)" without the vendor.
7. **Utilisation** is today's hosts ÷ usable; "full" marks a client range with no address to spare (Gosti /29). IPAM's
   own utilisation thresholds are not used (out of scope, `win-ipam-utilisation`).
8. **Two-site range names** are data: ZG-10 … ZG-60, ST-10 … ST-30 (site and VLAN in the next column).
9. **Nabava's VLAN is shown as "VLAN ?":** whether Nabava gets its own VLAN is question 2 of URM ch. 12 Primjer 3,
   which the book leaves open on purpose.
10. **Tags:** `ip-addressing` only (topic `windows-admin`, level `intro`), as the task's coordinator note suggests;
    `authentication` was not used. Both are in `tags.json`.
11. **The bar in the /16** shows a window: the smallest power of two from the block's start that holds every placed
    range (at least 256 addresses; 10.20.0.0/21 for two sites), with a strip of the whole /16 above it marking the
    window. Drawn at full scale, two sites would be 3 % of the bar.
12. **Caption wording: "range", not "block".** The task's first caption says "svaki blok poravnat" / "each block
    aligned"; in a sim whose concept is block vs range that calls the ranges blocks, so the page says "svaki raspon
    poravnat" / "each range aligned". The numbers and the rest of the wording are the task's. The second caption
    writes the digit 4 where the task writes "četiri" / "four" (the count comes from the model).
13. **Narrow segments** (Gosti /29, R1–R2 /30, a 4-address gap) put their label in a callout above the bar with a
    stem; the page measures which labels fit after layout and on resize.

## Kit views

- **K3 (block grid) is not used.** It exists (kit 0.6.0), but its cells are equal-width blocks: a /24 would be 256
  cells, or 64 cells of four addresses with the /30 a single cell, and the /16 cannot be drawn at all. Its `meter`
  has segments of proportional width but no labels inside them, no free/gap patterns between parts and no address
  ticks. The bar is drawn in the page with the kit's tokens.
- **K4 (rule table) is not used** either, though the task names it for the scene: a range table has no rule being
  matched, no deciding row and nothing skipped, so its marks would say something false. The table is a plain HTML
  table in the kit's style.

## Shared requests

- **A proportional, labelled bar** (kit K3 or a new view): segments of any size along one axis (address space, disk
  partitions, memory regions), a label inside each segment that fits and a callout with a stem for those that do
  not, free and gap patterns, ticks at boundaries, and parts that overflow past the end. This page's
  `bar()`/`layoutBar()`/`place()` is a working start. Consumers: this sim, `vlsm`, `disk-partitioning`, any memory
  map.
- **Glossary terms** (below).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| IP address block | adresni blok | task file |
| IP address range | raspon adresa | task file |
| room for growth | prostor za rast | URM ch. 9 |
| address plan | adresna shema | URM ch. 9 |
| alignment | poravnanje | URM ch. 9 |
| prefix length | duljina prefiksa | URM ch. 9 |
| DHCP scope | DHCP opseg | (check) |

## Sources

- URM, `09-podmrezavanje.md`: "VLSM: različita veličina svake podmreže", "Izrada adresne sheme: postupak i
  uobičajene pogreške", "Primjer 1: adresna shema za Grafo d.o.o." (needs, prefixes, placement, 116 free),
  "Primjer 2: kad prostor ne stane", "Primjer 3" (/31, out of scope). Read 2026-10-16.
- URM, `12-izgradnja-mreze.md`: VLAN 10/20/30/40 for Prodaja/Proizvodnja/Uprava/Gosti, Podružnica without a VLAN,
  "Primjer 3: proširite mrežu sami" (Nabava, 4 hosts).
- `sims/vlsm/sim.js @ b8448ec` (the adopted `urm-vlsm` card): `prefixFor`, `blockSize`, `usable`, `mask`, `format`,
  `order`, `allocate` copied (COMMON.md §6; not in `models/` yet).
- Microsoft, "Managing IP Address Space" (Windows Server 2012 R2 and 2012, archived, learn.microsoft.com
  `jj878303`), read 2026-10-16: blocks are containers of ranges and are not deployed; a range typically corresponds
  to a DHCP scope, maps to one block, and ranges of one block cannot overlap; an address maps to one range; ranges
  start and end on usable addresses, blocks on the network and broadcast address; a manually added range defaults to
  "Managed by service: IPAM"; "MS DHCP" is reserved for discovered scopes. **Checked.**
- Microsoft, "IP Address Management (IPAM) Overview" (same series, `hh831353`), read 2026-10-16: IPAM records the
  address space and detects overlaps; DHCP servers hand out addresses. **Checked.**
- The task's Microsoft titles "Manage IP address blocks and ranges", "Add-IpamBlock", "Add-IpamRange": the cmdlet
  pages were not fetched (the English doc page returned 404 at the path tried); nothing on the page depends on them.
  *(check)*
- RFC 1918: 10.0.0.0/8 and 192.168.0.0/16 are private (both blocks on the page lie inside them).

## Unchecked *(check)*

- The task's derived presets 2–5 were checked arithmetically (an independent Python hand model in the thread's
  library, `hand-model.py`, and `sim.test.js`), not against a source: they are the task's own examples.
- "DHCP opseg" as the Croatian for *DHCP scope*.
- That IPAM shows a range's "Managed by" as "IPAM" for a static router link in practice (the default for a manual
  range is documented; the choice for a link is the model's).

## Fresh review (playbook §7.4)

A separate agent re-implemented the model from SPEC.md in Python and compared 2 376 param sets field by field
(0 mismatches), then ran 46 mutations of `sim.js`: 35 killed, 6 equivalent survivors (stable sort makes the explicit
tie-break redundant, /31 is excluded by the −2 anyway, unique ids, alignment makes `<`/`<=` the same), and 5 real
gaps (the cursor staying after a failed range, first unplaced in placement order, utilisation rounding, `full` on
today's hosts, the growth clamp), now tested and each seen to fail. Page fixes from the review: keyboard focus stays
on the pressed stage button, changed table names get an outline as well as the highlight, the ↑ column has a
header, Croatian `toTop` case, no "less growth" advice at 0 % growth, "range" instead of "block" in captions and the
explanation, the explanation says links do not grow, unused strings removed.
Left as is: plural counts in captions (`116` in "Slobodno ostaje 116 adresa") are plain text, not `translate="no"`,
because `t.parts` picks the plural form from a number and writes it as text; every other number is data.

## Checks

- `node --test sims/win-ipam-address-plan/sim.test.js`: 28 tests.
- `npm run gate -- win-ipam-address-plan`: passes (46/46 browser checks).
- A browser sweep of 11 states × 2 languages at 1920×1080 (each preset, re-plan, growth 25 %, two sites in the /24,
  growth 100 % in the /16, as listed + Nabava, two sites at 200 % as listed): no console errors, no overflow, no
  empty caption slots.

## Time

About 27 min: start 00:31, done 00:58 (2026-10-16), including a fresh review by a separate agent.
