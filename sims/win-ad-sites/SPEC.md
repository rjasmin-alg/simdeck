<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ad-sites: specification

One concept: **intra-site vs inter-site replication, cost and schedule; site-aware DC choice** (task
`docs/tasks/w3/win-ad-sites.md`, catalogue `win-ad-sites`, §4.5.1). Explorer: the student changes costs, intervals,
bridging and subnets, changes a password (or another attribute) in one site and moves the clock; the inter-site tree,
the worst-case arrival at every DC and each client's DC update at once.

## Scene

Kit view K2. Three sites as tinted zones (series colour 1 HQ, 2 Branch, 3 Colo), each with a site card (its name and
subnet; the ends of the site links), its DCs and one client:

| Site | DCs | Subnet | Client |
|---|---|---|---|
| HQ | DC01 (PDC emulator), DC02 | 10.10.0.0/16 | 10.10.0.50 |
| Branch | DC04 | 10.20.0.0/16 | 10.20.0.50 |
| Colo | DC03 | 10.30.0.0/16 | 10.30.0.50 |

HQ and Branch, with their subnets, are topologydrafter's `two-sites` sample (HQ 10.10.0.0/16, branch 10.20.0.0/16);
Colo is the task's third site. Site links HQ–Branch (HB) and HQ–Colo (HC) always exist; Branch–Colo (BC) only with
`linkBC`. Each link is drawn between the site cards with a `cost · interval` label, in ink when the tree uses it,
dashed and muted when not. HQ's two DCs are joined by their intra-site connection. A **clock box** (top left) shows the
time since the change, where and what changed, and the buttons; the **arrival table** (top right) lists each DC's path,
worst-case arrival and whether it has the change now.

## State

`initial(params)` gives the whole state (an explorer has no steps):

`{ sites: [{ id, dcs, subnets }], links: [{ id, a, b, cost, intervalMin }], bridging, change: { at: 0, site, dc,
covered, kind }, pdc, bridgeheads: { site: dc }, edges, tree: [{ a, b, sites, links, cost, intervalMin, bridged }],
arrival: { DCxx: { t, from } }, clock, has: { DCxx: bool }, clients: { site: { site, how, dcs, coveredBy, ip, logon,
lacking } } }`.

- `arrival[dc].t` is seconds after the change, or `null` (never); `from` says how it came: `origin`, `pdc` (the urgent
  copy), `intra` (from a DC of the same site) or `inter` (over a tree edge, with its route).
- `has[dc]` is `t ≤ clock`.
- `clients[site].how`: `site` (its own site's DCs), `coverage` (a site without DCs, covered by the nearest), `any` (no
  subnet matched: all DCs), or `none` (no site with DCs can be reached; not reachable here, as HB and HC always exist).
  `logon` (password changes only): `local`, `pdc` (its DC lacks it and asks the PDC), `depends` (some of its candidate
  DCs have it) or `none` (no DC).
- `arrival[dc].from.edge.sites` and `.links` run in the direction of travel.

## Rules

Sources: Microsoft Learn, "How Active Directory Replication Topology Works" (Windows Server 2003 Technical Reference;
read for this task: ring, three-hop limit, ISTG, spanning tree, bridging, cost, interval, bridged interval, sites
without DCs); "Active Directory replication concepts"; "Designing the site topology". Marked *(check)* where not read.

1. **Inside a site** the KCC builds a ring of the site's DCs (name order); a change triggers change notification and
   the next DC on the ring has it **15 s** later, each further hop another 15 s *(check: 15 s first notification and 3 s
   between partners are the Windows Server 2003+ defaults; with at most two DCs per site the 3 s stagger never shows,
   nor the extra connections that keep a large ring within three hops)*.
2. **Between sites** one **bridgehead** per site replicates (the ISTG's choice; here the first DC by name: DC01,
   DC04, DC03; real ones are picked at random among eligible DCs since Windows Server 2003). It polls its partner over
   the route every **interval** minutes (default 180, minimum 15, step 15); no change notification across sites. The
   page shows the **worst case**: a full interval per inter-site hop (the poll just missed it).
3. **Least cost, one tree.** The ISTG lays a **least-cost spanning tree** over the sites that have DCs ("a layering
   of spanning trees … one intersite connection between any two sites"; a site without DCs "is not considered"). Edge
   between two DC sites:
   - **bridging on** ("Bridge all site links", default): the least-cost path over any links, through any sites
     ("all implicit paths as a single path with a combined cost"). A path of two links is a **bridged** route; it
     replicates as often as the **larger** of its intervals allows (Microsoft's AB 30 min + BC 60 min → once every 60).
   - **bridging off**: only a direct link; replication is store-and-forward through sites, so a site without DCs on
     the way breaks it.
   Kruskal over the edges sorted by cost. Default costs: 100. **Cost is not bandwidth and not schedule**: a link of
   cost 300 with a 15 min interval stays unused when a cost-200 route exists.
4. **Arrival time (worst case)** = intra-site hops at the origin (15 s each) + Σ intervals of the tree edges on the
   way + intra-site hops at the destination. Computed as earliest arrival from every source at t = 0 (the change, and
   the PDC's urgent copy, rule 7) over intra-site hops (15 s) and tree edges (interval × 60 s) between bridgeheads.
5. **Tie-breaks** *(check: the KCC's own tie-break compares GUIDs)*:
   - equal-cost paths for an edge: fewer links, then the site names along the path in alphabetical order (with three
     sites only the first can decide: two different paths between a pair always differ in links);
   - equal-cost tree edges: fewer links, then the two site names (sorted, joined) in alphabetical order;
   - equal arrival times: DCs are settled in time order, equal times in name order, and a DC keeps the first sender
     that reached it; a later one at the same time does not replace it. Password at Colo with `linkBC` on: DC04 is
     180 min from DC01 (the PDC, over HQ–Branch) and from DC03 (over Branch–Colo); DC01 is settled first and delivers.
   So an all-equal triangle (`linkBC` on, costs 100) keeps Branch–Colo and Branch–HQ: a change at HQ reaches Colo
   through Branch in 360 min.
6. **Site-aware DC choice.** A client's address is matched to a subnet → its site; the DC locator gives DCs of that
   site. No matching subnet (`subnets` off: the estate's one site without subnets) → the client has no site and gets
   **any** DC (all four listed; which one answers first is chance).
7. **Password changes** go to the **PDC emulator at once** (t = 0), whatever the schedule; from there they replicate
   like any change (DC02 15 s later; other sites over the tree from HQ). A DC asked to check a password it doesn't
   have yet sends the logon on to the PDC, which has it, so a fresh password works at a far site before replication
   arrives (`win-account-lockout` rule 2). Another attribute (`password` off: the phone number) only replicates. The
   PDC is DC01; without DCs at HQ the page puts the role on DC03 *(simplification)*.
8. **Automatic site coverage**: a site without DCs is covered by the DCs of the nearest site with DCs by least path
   cost; equal cost: the site with more DCs, then the alphabetically first name (HQ empty, HB = HC: Branch and Colo
   have one DC each, so Branch, DC04) *(check: the tie-break is the fresh reviewer's recollection of Microsoft's
   description; coverage uses the intersite messaging costs; RODC behaviour is out of scope)*. A change "in" a site without DCs is made on that
   covering DC.

## Params

| Key | Kind | Default | Meaning |
|---|---|---|---|
| `costHB`, `costHC`, `costBC` | range 1–500 | 100 | site link cost |
| `intervalHB`, `intervalHC`, `intervalBC` | range 15–360, step 15 | 180 | replication interval, minutes |
| `bridging` | toggle | on | bridge all site links |
| `subnets` | toggle | on | the three subnets are defined |
| `linkBC` | toggle | off | the Branch–Colo link exists |
| `hqDcs` | toggle | on | HQ has DC01 and DC02 |
| `origin` | HQ / Branch / Colo | HQ | where the change is made (clock box) |
| `password` | password / phone | password | what changes (clock box) |
| `clock` | 0 … max(60 s, last arrival), step 15 s | 15 s | time since the change (clock box; hidden control) |
| `edit` | HQ–Branch / HQ–Colo / Branch–Colo | HQ–Branch | which link's two sliders the panel shows (view only) |

Buttons in the clock box: **Change now** (`P`): clock to 0, then it runs from arrival to arrival every 1.6 s until
the last; **Next arrival** (`W`): the clock jumps to the next arrival time.

## Presets and expected numbers

Checked by an independent Python hand model (brute-force paths, its own Kruskal and relaxation; NOTES.md "Checks").

| # | Preset | Params | DC01 | DC02 | DC03 | DC04 | Tree |
|---|---|---|---|---|---|---|---|
| 1 | `two-sites` | clock 15 s | 0 | 0:00:15 | 3:00:00 | 3:00:00 | HB, HC |
| 2 | `hub-spoke` | HC 60 min, origin Branch, phone, clock 3 h | 3:00:00 | 3:00:15 | **4:00:00** (180 + 60) | 0 | HB, HC |
| 3 | `cheap-detour` | BC on, cost 300, 15 min; origin Branch, phone; clock 3 h | 3:00:00 | 3:00:15 | **6:00:00** via HQ | 0 | HB, HC |
| 4 | `empty-middle` | no DCs at HQ, HC 60 min, origin Branch, phone, clock 3 h | — | — | **3:00:00** bridged (max 180, 60) | 0 | Branch–Colo over HB+HC |
| 5 | `no-subnets` | no subnets, clock 60 s | 0 | 0:00:15 | 3:00:00 | 3:00:00 | HB, HC |
| 6 | `fresh-password` | origin Branch, password, clock 5 min | 0 (urgent) | 0:00:15 | **3:00:00** from the PDC | 0 | HB, HC |

- `two-sites`: the task's "DC02 in ~15 s, the branch within 180 min (worst)".
- `hub-spoke`: the task's "≤ 240 min (180 + 60)".
- `cheap-detour`: the direct link is cheaper in time (15 min) but costs 300 > 200: not in the tree. With `costBC` 150
  (cheaper for that pair than 200) it is still left out: the tree's total 200 beats 250.
- `empty-middle`: bridging off → no tree edge, DC03 never gets it; HQ's client is covered by DC04 (rule 8 tie).
- `no-subnets`: every client gets any of the four DCs; at 60 s DC01 and DC02 have the password, DC03 and DC04 do not,
  so the branch client's logon "depends on the DC" (one without it asks the PDC).
- `fresh-password`: at 5 min DC03 lacks the password; Colo's logon goes to the PDC DC01 → success. Without the
  urgent copy (phone) DC03 would wait 6 h (Branch → HQ → Colo).

The task's sixth situation (`empty-middle`) was a variant of `cheap-detour`; it is its own preset here (NOTES.md).

## Simplifications

- One domain, one naming context; the schedule is always open; no change notification across site links; no
  compression shown; no USN bookkeeping (`win-ad-replication`), no SYSVOL (`win-sysvol-dfsr`), no RODC
  (`win-rodc`): Branch has a writable DC04 (NOTES.md, deviations).
- Bridgehead = first DC by name; one per site.
- The PDC's urgent copy arrives at t = 0 ("at once").
