# link-state-spf: notes

<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

Task `docs/tasks/w3/link-state-spf.md`, thread t-0184. Rules and numbers: SPEC.md.

## Decisions

- **One run, five kinds of step.** change → originate → flood rounds → SPF picks → routing table. The run is fixed by
  the params, so there are no hidden event params: `costBC` 1 with `fail` none is the cold start; anything else starts
  from the converged network before the change and makes the change step 1. Both changes at once are allowed (the
  routers at both links' ends originate).
- **Flood order.** A round's copies are delivered at once and processed receiver, sender, origin. Two copies of one
  LSA in the same round (B gets E's LSA from C and from D in round 2): the first sender by name is stored, the second
  is dropped. The outcome (every LSDB complete) does not depend on it; the counts per round do.
- **Flooding stops when every LSDB holds every newest LSA.** The copies still to send after that would all be
  duplicates (dropped), so the step count matches the task (2 rounds: the hop diameter). Acknowledgements and aging
  are out of scope.
- **SPF reads the source's own LSDB** with the two-way check (a link counts only when both ends' LSAs list it, RFC
  2328 §16.1). Since SPF only starts once the LSDBs are identical, this never changes a result here; it is in the
  model so the code says what the protocol does (and so a half-flooded LSDB, tested directly, gives the right graph).
- **`source` keeps the step; `costBC`, `fail` and `showFlood` reset to step 0.** Switching the source at the table
  step shows another router's table on the same LSDB at once (misconception 3). The other three change the run's
  shape, so the demo restarts.
- **The tree** draws, for each final router, the link to each of its parents; a router with two parents (ECMP) gets
  both parent links as double lines. Tentative routers' candidate links are not drawn (the Dijkstra table shows them).
- **Old routing table.** After a change, the table computed before it stays on screen (marked "before the change")
  until the table step replaces it; rows that differ are marked there. A real router would keep forwarding with the
  old table meanwhile, which this shows.
- **Captions** name every examined neighbour: new, better (with the path, the old distance and the old parent link:
  the task's hr example word for word at `spf-from-a` step 6), equal (ECMP), and worse ("no change"), so the student
  sees that not every offer wins.
- **Layout.** The task's graph drawn as a zigzag of three triangles (B and D on top; A, C, E below), so no link crosses
  another and every link is long enough for its cost in the middle and a chip near each end. Each router card holds
  its LSDB strip (one cell per origin with the sequence number: filled = newest, outlined with the number struck =
  outdated copy, dashed = none). The Dijkstra table and the routing table sit right of the drawing.
- **Phone.** K2 hides links there, so each card also lists the router's own links and costs ("Own links: B 2 · C 5"),
  hidden on wide screens.
- **Dropped copies** are hollow dashed letters. A line-through was tried first and dropped: a struck "C" reads as "€".
  Red drop crosses at the receiver were also dropped: with 22 duplicates in round 2 they looked like failed links.

## Deviations from the task

- Task legend says "router (circle)": K2 draws a router as a rounded square (the kit's shape for routers); kept.
- Task state lists `dist`, `nextHop`, `final` at the top level; they live in `state.spf` (with `parents`, `picked`,
  `relaxed`). `phase` is `kind`, which adds `start` and `change`.
- "Changed" marks: besides the task's (LSAs that arrived this round, the router made final and the distances
  relaxed), the changed link's cost at the change step and the routing-table rows that differ from before.

## Sources

- Uvod u računalne mreže, `book/chapters/11-usmjeravanje.md`: "Dinamičko usmjeravanje: kad tablicu gradi mreža
  sama" (Što treba znati: link state vs distance vector, footnotes carnet-dv-ls, rfc2328-ospf; Šire o temi: faster
  convergence, Dijkstra, footnote carnet-ospf) and the **metrika** paragraph of "Usmjeravanje: kako paket pronalazi
  put kroz mrežu". The book uses "usmjernik" for router (70 times, "usmjerivač" only in quotes); the page does too.
- RFC 2328 (OSPF v2): §2, §12, §13 (flooding procedure: a newer instance is installed and flooded, one already held is
  not flooded), §13.1 (sequence numbers), §16.1 (Dijkstra, two-way check, equal-cost next hops).
- E. W. Dijkstra, "A note on two problems in connexion with graphs" (1959).
- `ch11-*.svg` diagrams: looked at for style only; none shows link state.
- Unchecked: the vendor default cost "reference bandwidth / interface bandwidth" is named in the explanation only,
  without a vendor *(check)*; "preplavljivanje" for flooding is the glossary's (src uvod-u-racunalne-mreze), the other
  Croatian terms below are the builder's *(check)*.

## Check script

`check.py`, written in the thread's scratchpad before `sim.js`, independent of it (Python: Dijkstra with next-hop sets,
flooding as sets of held origins with the same delivery order):

```python
BASE={('A','B'):2,('A','C'):5,('B','C'):1,('B','D'):4,('C','D'):1,('C','E'):6,('D','E'):2}
def graph(bc=1,fail=None):
    g={}
    for (a,b),c in BASE.items():
        if fail==(a,b): continue
        if (a,b)==('B','C'): c=bc
        g.setdefault(a,{})[b]=c; g.setdefault(b,{})[a]=c
    return g
def spf(g,s):
    R=sorted(g); dist={r:None for r in R}; nh={r:[] for r in R}; dist[s]=0; final=[]
    while True:
        F=[f for f,_ in final]; t=[r for r in R if r not in F and dist[r] is not None]
        if not t: break
        u=min(t,key=lambda r:(dist[r],r)); final.append((u,dist[u]))
        for v,c in sorted(g[u].items()):
            if v in [f for f,_ in final]: continue
            d=dist[u]+c; h=[v] if u==s else nh[u]
            if dist[v] is None or d<dist[v]: dist[v]=d; nh[v]=list(h)
            elif d==dist[v]: nh[v]=sorted(set(nh[v])|set(h))
    return final,{r:(dist[r],''.join(nh[r])) for r in R if r!=s}
def flood(g,orig,have):
    pend=[(r,r,None) for r in orig]; rounds=[]
    while any(len(have[r])<len(g) for r in g):
        new=[]; sends=sorted([(n,at,o) for at,o,frm in pend for n in g[at] if n!=frm]); dup=0
        for to,frm,o in sends:
            if o not in have[to]: have[to].add(o); new.append((to,o,frm))
            else: dup+=1
        rounds.append((len(sends),dup)); pend=new
    return rounds
```

Output (rounds as copies/dropped):

```
spf-from-a     rounds [(14, 0), (28, 22)] finals A0 B2 C3 D4 E6  table B 2/B, C 3/B, D 4/B, E 6/B
cost-change    rounds [(7, 0), (12, 11)]  finals A0 B2 C5 D6 E8  table B 2/B, C 5/C, D 6/BC, E 8/BC
link-fails     rounds [(5, 0), (7, 4)]    finals A0 B2 C3 D6 E8  table B 2/B, C 3/B, D 6/B, E 8/B
spf-from-e     rounds [(14, 0), (28, 22)] finals E0 D2 C3 B4 A6  table A 6/D, B 4/D, C 3/D, D 2/D
tie: source C  rounds [(14, 0), (28, 22)] finals C0 B1 D1 A3 E3  table A 3/B, B 1/B, D 1/D, E 3/D
B-D fails      rounds [(4, 0), (8, 4)]    finals A0 B2 C3 D4 E6  table B 2/B, C 3/B, D 4/B, E 6/B
costBC 3       rounds [(7, 0), (12, 11)]  finals A0 B2 C5 D6 E8  table B 2/B, C 5/BC, D 6/BC, E 8/BC
```

Every number in the task file's presets matches. The model gives the same (sim.test.js).

## Checks

- `node --test sims/link-state-spf/sim.test.js`: 31 tests (tie-breaks first, each rule, the four presets, every
  combination of source × costBC {1, 2, 5, 10} × fail × showFlood ends in a table within 20 steps, the generic block).
- Mutants (each rule broken once, sim.js restored after): tie-break reversed, duplicates forwarded, copy sent back to
  its sender, equal sequence stored, no two-way check, comparator flipped, finals re-examined, no ECMP union, next hop
  = parent, sequence not raised (shown and hidden flooding), failed links listed in an LSA, hop count instead of cost:
  all caught. Not caught: SPF reading another router's LSDB, an equivalent mutant (SPF starts only when all LSDBs are
  identical); `graphOf` on a given LSDB is tested directly.
- `npm run gate -- link-state-spf`: pass (62/62 browser checks, both languages, light and dark, phone, keys, motion).
- Screenshots reviewed (1920×1080 light, dark, grayscale; 375×812; hr and en) at flood rounds, SPF steps and table
  steps of all four presets: no overflow, captions at most three lines, costs readable on every link, grayscale keeps
  every mark (filled / outlined / dashed, thick / double lines).

## Review

A fresh reviewer (subagent, read-only, working in a copy) read the diff against SPEC.md, wrote 60 mutants, replayed the
page's caption code for every source × costBC 1–10 × fail × showFlood in both languages (2,840 captions each) and ran
the gate. No model defect; every SPEC number reproduced. Fixed after it:

- hr status "SPF, korak k" clashed with the caption's "Korak n" → "SPF, odabir k" (en "pick").
- ECMP caption said "keeps both next hops" when the second had just been added → "now has both next hops".
- Singular "next hop: B, C" when a router has two → own strings for two next hops ("next hops B and C").
- en "at its ends" with two changed links → "at the link ends".
- hr: LSA was masculine in one sentence and feminine in others → masculine throughout (LSA-ovi, like "oglas").
- SPEC rule 2 cited RFC 2328 §13 for dropping a *lower* number; §13 step 8 answers with the newer copy. Reworded: a lower
  number is never in flight here.
- `capNoNews` was unused → said when a pick has no neighbour left to examine (source C, step 7).
- An equal path that adds no next hop no longer marks its Dijkstra row as changed.
- Six surviving mutants were real test gaps (round not counted, tree including tentative routers, copies kept on the
  links during SPF, the old cost, `originated` with hidden flooding, the old parents): two tests added; all six now
  fail. The other seven survivors are equivalent (SPF from another identical LSDB, symmetric costs, display sort order,
  unread `pending`/`originated`, the unreachable 20-step cap).

Left as is: when a router has two equal parents, the caption names the path through the first parent only ("A–B–D–E
costs 8") while listing both next hops; the double lines on the drawing show the second path.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| English | Croatian |
|---|---|
| link state | stanje veze (protokol stanja veze) |
| link-state advertisement (LSA) | oglas o stanju veze *(check)* |
| link-state database (LSDB) | baza stanja veza *(check)* |
| shortest path first (SPF) | najkraći put prvi; the page says "Dijkstrin algoritam" and keeps SPF |
| equal-cost multipath (ECMP) | višestruki putevi jednake cijene *(check)* |
| metric | metrika (URM ch11) |
| next hop | sljedeći skok |
| routing table | tablica usmjeravanja |
| tentative / final (Dijkstra) | privremen / konačan *(check)* |
| link cost | cijena veze (task; the book says "metrika") |

`flooding` / `preplavljivanje` is in the glossary (src uvod-u-racunalne-mreze); the page writes it out like the
others so all its terms follow one pattern (no `glossary.js` include).

## Shared requests

- **K2 (`kit/topology.js`): a label in the middle of a link** (`links[].label`, e.g. a cost or a bandwidth), drawn above
  the packet arrows. The page draws the cost itself in an overlay (`overlay()` in index.html) that measures the cards
  on resize, as the view does. Likely other users: any routing page with weighted links (`stp` path cost).
- **K2: a link style `double`** (ECMP, a bundle). The page draws a `--bg` line along the middle of an `active` link.
- **K2: thickness for `active`.** The page sets `.sd-topo-link.sd-topo-active { stroke-width: 0.8rem }` so the tree
  reads as a tree; a `weight: 'thick'` field would make this a view option.
- **K2: a state or class on a node's mark** (hollow/filled for Dijkstra's tentative/final). The page sets
  `data-spf` on the cards after `Simdeck.topology()` returns.

## Time

Start 11:56, gate passing 12:11, review fixes and wrap-up done 12:24 (2026-10-27), one session, about 30 minutes
including the review round (about 6 minutes of it the reviewer's run).
