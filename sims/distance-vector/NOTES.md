<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# distance-vector: notes

New stepper (task `docs/tasks/w3/distance-vector.md`, catalogue `net-distance-vector`), on kit view **K2: topology**.
Rules, tie-breaks and expected numbers: `SPEC.md`.

## Decisions

- **One destination, network N.** Every table has one row (destination, metric, next hop). The model handles any
  number of networks; the scenes keep one so the count to infinity stays readable on the wire and in the caption.
- **The table is inside the router card** (the view's `extra`), under the mark, with the column heads "odredište /
  metrika / sljedeći skok". Under the card (`table`) would have put the ring's and the triangle's tables in the path
  of their vertical and diagonal links. Cards keep their natural width (`justify-self: center`), so the links have room
  for two chips each way.
- **N is a cloud under its router** (line, triangle) or beside it (ring), linked; "network down" draws that link cut
  and the cloud hatched. Putting it at the end of the row left too little room between the line's routers.
- **Vectors are the view's packet chips**, one per direction per up link per round (`N:2`), placed at 0.3 of the way
  so the two chips of one link do not overlap. A router with no entry sends nothing (no arrow). Page CSS styles the
  chip by what it carries (`:has()` on the chip's inner span): held back by split horizon = hollow, dashed, struck,
  and its arrow dashed (the view's `cast: 'broadcast'` dash, used here for "not really sent"); metric 16 = danger fill
  with the number struck; a vector that changed a table = the kit's highlighter with an ink outline.
- **Processing order** (SPEC rule 6a): each router processes the received vectors one by one in the sender's name
  order against its table so far. The task's numbers need exactly this: in the triangle, A first rejects B's 4 (not
  better than 3 via C) and only then believes C's 16, so A ends at 16 as the task says; "next hop first, then the best
  other offer" would give A = 4 via B in round 1 and a different run.
- **A down network can be beaten.** The task's preset 2 has C (whose own network went down, metric 16) take B's old
  2 → 3 via B in round 1. That is rule 4 with the down route at 16, nothing special: a direct route at 1 can never be
  beaten (an offer is at least 2).
- **End of a run** (SPEC "End of a run"): a quiet round (shown, "converged"), or, after bad news, the round in which
  every router cut off from N reaches 16 (no quiet round after it), or step 20. These two endings reproduce all the
  task's step counts (3, 15, 3, 6, 14). "Cut off" is true reachability over up links, computed in the model; the
  same set marks the **false routes** (a finite route written at a router that has no path to N), which drive the
  count-to-infinity sentence in the caption.
- **Events are a param** (`events`), like `stp`'s `inject`: the buttons add one at step n + 1, drop every event after
  step n, and step. Repeats (cut a cut link, N down twice) and events past step 20 are refused with a caption note and
  no step. `events` is a **number** (one base-6 digit per step; `code('line', '1:down')` = 1 for the presets) so that it
  can be a hidden param the kit writes to and reads from the URL: a reload, a copied link or `L` keeps a run the
  buttons made (checked in the browser over http; `file://` behaves the same where the browser allows
  `history.replaceState`). It is a hidden **choice** whose options are the presets' codes plus the code in the page's
  URL, because the kit reads a URL value only when it is an option, and a hidden range would trip the page check
  (it clicks the first range input). `topo` and `start` are hidden choices too, so a run that left its preset (after
  choosing a link) survives a reload.
- **Link to cut**: one choice per scene (`cutLine`, `cutRing`, `cutTri`, shown for the current scene); the chosen link
  is drawn in ink (the view's `active`), legend "veza za prekid". Choosing a link drops the preset highlight (the kit
  does that for any param change).
- **Rounds are numbered from the start of the run**; a topology change is a step, not a round. In preset 2 "Krug 3"
  is step 4, as in the task's Croatian caption.
- **Mode keeps the step** (no reset): flipping plain / split horizon / poisoned reverse at the same step shows the
  other run at that point. The converged start is the same in every mode (tested).
- **Captions** group the changes of a round by kind (learned, switched, believed the next hop, false route) with
  Croatian plural agreement by the number of routers, e.g. "A i C još vjeruju susjedu B, koji javlja 4 skoka do mreže
  N, pa upisuju 5 — a mreža N više ne postoji." The split-horizon note appears only where a held-back entry would
  have offered a finite route to a router at 16 (the case that matters); in a round that still writes a false route
  it says the false route arrives another way, round the loop. Router names, metrics and chips are data
  (`translate="no"`); a string that uses a name twice gets a copy of the node (a node stands in one place only).
- **Croatian router names** are never declined: every name follows a noun ("susjedu B", "usmjernik C", "sljedeći skok
  C"), so "B-u" is not needed.
- **Panel fit (hr)**: legend labels are short ("preko susjeda", "zadržano", "veza za prekid") so the Croatian header
  stays two lines and the panel (six presets, three params, three buttons) fits without its own scroll.

## Deviations from the task

- **Sixth preset `ring-split`** ("Prsten: horizont ne pomaže" / "Ring: split horizon fails"): the ring, converged,
  split horizon, N down; counts to infinity round the loop A → D → C → B → A, all 16 at round 14 (15 steps). The task's
  rule 9 says split horizon stops the two-router loop and that loops through three or more routers "can still count
  to infinity with real, unsynchronised timers … which this model does not show". The check script showed that the
  synchronous model does show it, in a ring: A learned N from B, so split horizon lets A tell D its stale 3. RFC 2453
  §3.4.4 says exactly this ("three routers are engaged in mutual deception … Split horizon cannot stop such a loop").
  The explanation says so instead of the task's sentence. Same concept (the limit of split horizon), so it is a preset,
  not a second sim. Not written to `docs/tasks/OPEN.md` (outside this task's folder, and the gate's scope rule); the
  report lists it for the owner.
- **The optional "send a packet" check** (task "Reuse": the routing-table lookup) is not built. With one destination
  and one row per table, the next hop is the table itself; a lookup step would add a second concept for no gain. The
  routing-table model is therefore not reused, and nothing is copied from it.
- **The hop-count convention note** is in the explanation without the vendor's name ("some routers print a learned
  route one lower, because they give a directly connected network 0"), per COMMON.md §1 "Concepts, not tools". *(check)*
  that the vendor in question shows a route learned from a neighbour one hop away as metric 1.
- **"RFC 2453" is not named on the page** (documentation titles belong in Sources); the explanation names RIP, which the
  URM chapter teaches.
- **Task steps per preset kept** (3, 15, 3, 6, 14) through the two-way end rule above; preset 6 adds 15.

## Sources

- URM `book/chapters/11-usmjeravanje.md`, "Dinamičko usmjeravanje: kad tablicu gradi mreža sama" and its "Šire o
  temi": distance vector vs link state, "svaki usmjernik cijelu svoju tablicu podijeli sa susjednim usmjernicima"
  (footnote carnet-dv-ls), hop count and the 15-hop limit (footnotes rfc2453-rip, carnet-rip), convergence and
  routing loops. Croatian terms from the same section.
- RFC 2453, local copy `uvod-u-racunalne-mreze/references/chapter-11/rfc2453.txt`: §3.4.1 (16 = infinity, marking a
  route invalid), §3.4.2 (counting to infinity, why 16), §3.4.3 (split horizon, poisoned reverse), §3.4.4 (three
  routers in mutual deception: split horizon cannot stop it; the next hop is always believed), §3.8 (timers 30 s /
  180 s / 120 s; an expired route is kept so neighbours learn it was dropped), §3.9.2 (metric = MIN(metric + cost,
  infinity); no route is added at infinity; same router and a different metric, or a lower metric → adopt; equal
  metric from another router → no change). Quotations in SPEC.md were checked against that text.
- CARNET CERT, *Osnove mrežnog usmjeravanja* §7.6 and §9.7: as quoted in URM ch11 (not read separately).
- Check script (below): every number in SPEC.md and `sim.test.js`.

## Check script

Written before `sim.js`, from the rules alone (Python dictionaries, no shared code). Its round:

```python
def rnd(tables, links, mode):
  snap = {r: dict(t) for r,t in tables.items()}
  new = {r: dict(t) for r,t in tables.items()}
  for r in sorted(tables):
    for s in nbrs(r, links):            # neighbours in name order
      e = snap[s].get('N')
      if e is None: continue
      m = e['m']
      if e['via'] == r:
        if mode == 'split': continue
        if mode == 'poison': m = INF
      m = min(m+1, INF)
      cur = new[r].get('N')
      if cur is not None and cur['via'] == s: new[r]['N'] = {'m': m, 'via': s}
      elif (cur is None and m < INF) or (cur is not None and m < cur['m']): new[r]['N'] = {'m': m, 'via': s}
  return new
```

Output, per preset (`router=metric/next hop`, events as their own step):

- cold-start (line, plain): `A=- B=2/C C=1/*` → `A=3/B` → no change.
- count-to-infinity (line, plain, N down): step 2 `A=3/B B=16/C C=3/B`; step 3 `A=16/B B=4/A C=16/B`; step 4
  `A=5/B B=16/A C=5/B` … step 14 `A=15/B B=16/A C=15/B`; step 15 all 16.
- split-horizon and poisoned reverse (line, N down): step 2 `B=16/C`, step 3 all 16.
- ring-reroute (split, cut B–C at 3): step 4 `A=3/D B=16/C`, step 5 `B=4/A`, step 6 no change. Plain: `B=4/A` already
  at step 4, no change at 5.
- triangle-plain (cut C–D): step 2 `A=16/C B=16/C C=4/A`, step 3 `A=5/C B=5/C C=16/A` … step 14 `A=16/C B=16/C
  C=16/A D=1/*`. Split or poison: all 16 at step 2.
- ring, split, N down: step 3 `D=4/A`, step 4 `C=5/D`, step 5 `B=6/C`, step 6 `A=7/B` … step 15 all 16 (preset 6).
- Also run, not presets: line cut B–C plain counts to infinity between A and B (14 steps), split stops it in 2 rounds;
  ring cut C–D: D reroutes via A in one round.

## Checks

- `node --test sims/distance-vector/sim.test.js`: 34 tests. Each rule and tie-break was broken once in a copy of
  `sim.js` (26 mutations: equal metric replaces, reversed processing order, vectors read from tables already updated
  this round, no + 1, no cap at 16, a route added at 16, 16 not beatable, next hop not believed, cut on one end only,
  a cut rewrites routes already at 16, down changes nothing, split horizon off, poison sent as split, `used` never or
  always set, no "unreachable" end, no "quiet" end, end without the next-round check, end on an event step, an empty
  cut-off table not counted, bad news without a 16, `since` not reset, false routes unmarked, duplicate event keeps
  the last, wrong digit base); every one failed at least one test. The reviewer's own 48 mutants: all caught after
  the fixes below, except four equivalent ones (same behaviour).
- `npm run gate -- distance-vector`: pass (61/61 browser checks, both languages, light and dark, phone, keys, motion).
- Every step of every preset in both languages at 1920×1080: no caption overflow (at most four lines), no console
  errors; buttons checked in the browser (cut, refused repeat, network down, stepping back and pressing again
  rewrites the later events).
- Screenshots reviewed: light, dark, grayscale (chips and rows keep their meaning by fill, dash and strike), 375×812.

## Review

A fresh reviewer (subagent, read-only) read the diff against SPEC.md, ran 48 mutants and the page headless. Found and
fixed:

- Runs made with the buttons were lost on reload, a shared link and `L` → `events` as a number in a hidden param.
- A false "bad news has reached everyone" ending in free play when a router was cut off before it learned N (cold
  start, cut A–B) → the end needs at least one cut-off router at 16; caption reworded ("no router cut off from N has a
  route to it any more").
- The split-horizon note fired for a held-back 15 (which arrives as 16 anyway) → tests metric + 1 < 16.
- "…so the false path never comes back" on ring-split's round 1, right before it comes back round the loop → the
  note now says only what is local ("the old route does not go back to where it came from"), and "but the false route
  arrives another way, round the loop" in a round that writes a false route.
- "B believes its next hop, which reports 16: network N is unreachable" in the same caption where B then switches to
  another neighbour → "…which reports 16, and writes 16".
- The summary said split horizon stops the count → "and when split horizon stops it".
- Untested branches (cut skips routes at 16, `used`, the end's next-round check, no end on an event step, `since`
  reset, a vacuous `ads.length` assertion) → six tests added.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr | source |
|---|---|---|
| distance vector (protocol) | protokol vektora udaljenosti | URM ch11 |
| routing table | tablica usmjeravanja | URM ch11 |
| hop count | broj skokova | URM ch11 |
| next hop | sljedeći skok | URM ch11 |
| convergence | konvergencija | URM ch11 ("brža konvergencija") |
| routing loop | petlja usmjeravanja | URM ch11 |
| count to infinity | brojanje do beskonačnosti | task *(check)*; not in URM |
| split horizon | podijeljeni horizont | task *(check)*; not in URM |
| poisoned reverse | otrovani povratak | simdeck *(check)*; not in URM |

## Shared requests

- **Kit: `visible` on a param does not hide it.** `.sd-ctl { display: flex }` beats the `hidden` attribute, so the
  page adds `.sd-ctl[hidden] { display: none }` (as `amdahl` and `chirp-1` do). Smallest change: that rule in
  `kit.css`.
- **Kit: a param kept in the URL without a control.** Only params with a control are written to the URL; the page
  keeps `events` with a hidden choice whose options include the URL's value (see Decisions). Smallest change: a
  `{ key, type: 'hidden' }` param type that is read and written as given and builds no control.
- **check-page.mjs: the slider-focus check takes the first range input even when it is hidden** (`boundingBox()` is
  null and the check crashes). Smallest change: `.filter({ visible: true })` on that locator.
- **K2: a class on a packet chip.** The page styles chips with `.sd-topo-chip:has(.dv-ad[...])`; a `className` (or
  `kind`) on a packet would make that plain CSS. The dashed arrow for a held-back vector borrows `cast: 'broadcast'`;
  a `style: 'dashed'` on packets would say what it means.

## Time

Start 13:09, done 13:46 (2026-10-25), one session, including the review round (about 8 minutes of it the
reviewer's run).
