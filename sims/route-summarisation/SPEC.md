<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# route-summarisation: aggregating contiguous prefixes into one route

One concept: **several neighbouring prefixes are replaced by one shorter prefix that covers them all (the summary),
and that summary may cover addresses the picked blocks do not.** An explorer: the params drive the drawing live.

Task: `docs/tasks/w3/route-summarisation.md`. Catalogue: `net-route-summarisation` (§4.1). Builds on
`sims/routing-table/` (its IPv4 helpers and longest-prefix lookup are copied into `sim.js`, marked).

## Scene

- **Top, the address strip** of the plan's space (`192.168.1.0/24`, 256 addresses; or `172.16.0.0/22`, 1024),
  every block drawn to scale as in `ch09-vlsm-podjela-24.svg`: a picked block filled in its series colour, a block
  not picked as a dashed outline. Over the strip the summary is a bracket (`--ink`) with its prefix; inside the strip
  the over-covered parts are hatched (`--warn`), a risk cross-hatched (`--danger`).
- **Lower left, the summary up close:** the same strip over the summary's range only (small summaries are readable),
  the over-covered ranges listed with their owner and kind, the lowest and the highest address of the picked blocks
  bit by bit (3rd and 4th octet) with the summary's network under them and the boundary marked, and two chips:
  exact / over-covered N, and covered of size.
- **Lower right, router R2's routing table** before and after summarising, columns Odredišna mreža / Prefiks /
  Sljedeći skok (as `routing-table` and URM ch. 11). Before: the replaced rows struck through and tagged; after: the
  summary row in bold with an ink bar and a tag.

## Network (URM ch. 9, Primjer 1; ch. 11, Primjer 3 for the table shape)

Grafo d.o.o., `192.168.1.0/24`. The book places the branch "iza drugog usmjernika" and has a link R1–R2; R1 is the
head office's router, R2 the branch's. So, seen from R2:

| id | block | site | R2's route |
|---|---|---|---|
| `sales` | Prodaja `192.168.1.0/26` | behind R1 | via R1 |
| `prod` | Proizvodnja `192.168.1.64/27` | behind R1 | via R1 |
| `mgmt` | Uprava `192.168.1.96/28` | behind R1 | via R1 |
| `branch` | Podružnica `192.168.1.112/28` | R2's own | directly connected |
| `guest` | Gosti `192.168.1.128/29` | behind R1 | via R1 |
| `link` | Veza R1–R2 `192.168.1.136/30` | both (R1 and R2 sit on it) | directly connected |

Where the guest network sits is not in the book; it is put at the head office with the other departments (derived).
The `four24` plan: `172.16.0.0/24` … `172.16.3.0/24`, all four behind R1 (derived, the standard textbook case).

## State (explorer)

Params `{ plan, sales, prod, mgmt, branch, guest, link, n0, n1, n2, n3 }` (toggles; `n0`…`n3` are the four24 blocks)
→ `{ plan, space, blocks: [{ id, net, len, size, site, selected, inSummary }], selected, summary: { net, len, first,
last, size, low, high, aligned } | null, covered, overCovered: [{ first, last, count }], overCount, exact, pieces:
[{ first, last, count, owner, kind, risk, r2, safeOnR2 }], tableBefore, tableAfter, replaced, installed }`.
Addresses are unsigned 32-bit numbers.

## Rules

1. **Length and network.** Summary length = the number of leading bits shared by the lowest address and the
   highest address of all picked blocks (the highest is the *last* address of the highest block); network = the
   lowest address AND that mask. Source: RFC 4632 §3.1 (prefix notation; aggregation of contiguous prefixes is
   described there and in §3.2 *(check section)*); URM ch. 9 "CIDR zapis i duljina prefiksa". Example: .0 and .111
   share 25 bits → `/25`.
2. **Alignment.** A prefix is a valid network only on an aligned boundary: its address is a multiple of its size
   (URM ch. 9 "Izrada adresne sheme", step 4; `ch09-poravnanje-binarno.svg`: .16 and .32 start a /28, .20 does not).
   Rule 1 always gives an aligned network (zeros after the boundary); the page shows it and the test checks it.
3. **Exact or over-covering.** Exact iff the picked blocks' addresses fill the summary with no gap; otherwise
   over-covered = summary size − covered addresses, listed as maximal ranges (derived from rules 1–2).
4. **Tie-break: duplicates and nesting count once.** Picked blocks are merged into ranges first (overlapping, nested,
   duplicate or touching); `covered` counts each address once. A block inside another picked block adds nothing.
5. **One block** picked: the summary is that block, exact. **No block**: no summary, the table is unchanged.
6. **R2's table and the risk.** The summary replaces the picked routes *via R1* with one route via R1, put in
   address order (**tie-break:** equal network, shorter prefix first). Connected routes stay: a router always knows
   its own networks. With no picked route via R1 nothing is replaced and no summary route is installed
   (`installed: false`). On R2 the more specific route still wins (longest prefix match, RFC 1812 §2.2.5.2; URM
   ch. 11 Primjer 2; lookup copied from `routing-table`: on equal length the earlier entry). Each over-covered piece
   is split by owner block and given a kind:
   - `risk`: it belongs to a block behind R2 (the branch). A router that only has the summary sends it to R1;
     `risk` is true only while the summary is installed. On R2 its own /28 wins (`safeOnR2`, `r2: 'connected'`).
   - `same`: a block that R1 reaches too (another R1 block, or the R1–R2 link): the summary sends it the right way.
   - `unused`: nobody's addresses (rule 7).

   `r2` is R2's choice for the piece's first address on the table after: `'summary'`, `'connected'`, `'R1'` (a
   remaining route via R1, when no summary is installed) or `'none'` (no route); `safeOnR2` is true when a route other
   than the summary wins.
7. **Nobody's addresses** are only flagged ("ničije"): on R2 they now follow the summary to R1 (`r2: 'summary'`),
   where they are dropped or loop on. The page does not route them (derived).

"Changed" (page): the blocks whose pick changed and the rows of the table after that were not there before the
last input (`changed(before, now)`; nothing across a change of plan).

## Expected numbers (all checked by an independent python `ipaddress` script before coding, and in `sim.test.js`)

| preset | picked | summary | covered | over-covered | R2 routes |
|---|---|---|---|---|---|
| `head-office` | Prodaja, Proizvodnja, Uprava | `192.168.1.0/25` | 112 | .112–.127 (16) = Podružnica, risk, safe on R2 | 6 → 4 (3 → 1) |
| `exact` | Proizvodnja, Uprava, Podružnica | `192.168.1.64/26` | 32 + 16 + 16 = 64 | none, exact | 6 → 5 (2 → 1; the branch stays connected) |
| `small` | Gosti, Veza | `192.168.1.128/28` | 12 | .140–.143 (4), nobody's | 6 → 6 (1 → 1: /29 becomes /28) |
| `all` | all six | `192.168.1.0/24` | 140 | .140–.255 = 116, the book's reserve, nobody's | 6 → 3 |
| `four24` | 172.16.0–3.0/24 | `172.16.0.0/22` | 1024 | none, exact | 4 → 1 |
| (four24 without .3) | 172.16.0–2.0/24 | `172.16.0.0/22` | 768 | 172.16.3.0–.3.255 (256), behind R1 | 4 → 2 |

Sources of the numbers: blocks and the 116-address reserve from URM ch. 9, Primjer 1; every summary is derived (the
book has no section on summarisation).

## Captions (from the task, as the page composes them)

The page composes: the picked list and the summary; how many routes via R1 become one (or "nothing to replace");
then "exact", or the over-covered ranges. With no summary installed the ranges are only "would cover". Otherwise one
sentence for a risk (naming only the risk blocks), one for nobody's addresses (their own count), and the sentence for
blocks R1 reaches anyway only when it is the only kind (the stage lists every kind, one line each).

- hr, `head-office`: „Prodaja, Proizvodnja i Uprava sažimaju se u **192.168.1.0/25**: na R2 3 zapisa preko R1 postaju
  jedan, ali sažetak pokriva i **.112–.127** (16 adresa), Podružnica je iza R2: …"
- en: "Sales, Production and Management summarise to **192.168.1.0/25**: on R2, 3 routes via R1 become one, but the
  summary also covers **.112–.127** (16 addresses), …"

## Misconceptions addressed

- *Any contiguous networks summarise exactly*: `head-office` and `small` are contiguous and still over-cover.
- *A summary only covers the networks you picked*: the hatched ranges and their owners.
- *The summary replaces the more specific routes on every router*: R2 keeps its connected /28 and /30, and the
  /28 wins on R2 by longest prefix match.

## Out of scope

Automatic summarisation in routing protocols, IPv6, classful supernetting history, BGP aggregation with AS_SET,
routing a packet (rule 7 only flags).
