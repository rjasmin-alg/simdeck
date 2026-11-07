<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-bia: specification

Task `docs/tasks/w3/cmp-bia.md`, catalogue `cmp-bia` (§4.13). Explorer: the page is a pure function of its params
(`compute` in `sim.js`). This file fills the task's empty "Model and presets" section.

## Concept

A business impact analysis (BIA) sets each business process's maximum tolerable downtime (MTD). A supporting system
inherits the **shortest** MTD of every process that depends on it, directly or through other systems, so the
infrastructure (directory and sign-in, name resolution, the network) ends up most urgent. Its recovery time
objective (RTO) must be below that MTD (by the time to notice and decide). The gap between the required RTO and what
recovery achieves today is the work list; sorting by required RTO is the recovery order.

**Contrast on the stage:** the same graph and the same numbers analysed two ways, *direct users only* (each system
owner asks only which processes use their system) against *the whole chain*. The first leaves the infrastructure
without an RTO: the work list is empty while three processes are still late.

## State (plain JSON)

`{ p, adj, sys[], order[], procs[], m }`: the normalised params; adjacency (node id → ids it depends on directly);
per system `{ id, layer, depth, deps, users, req, from, ach, gap, pos, waits }`; the recovery order (ids); per process
`{ id, mtd, deps, back, within, slow }`; totals `m = { within, work, worst, unrated, broken }`.

## Rules (in order; numbers as in `sim.js`)

1. **Nodes.** Five processes (taking orders, dispatching goods, invoicing, paying salaries, customer support), five
   applications (web shop, business system (ERP), warehouse system, e-mail, payroll system), three infrastructure
   services (directory and sign-in, name resolution, network). `SYSTEMS` = net, dns, idm, shop, erp, wms, mail, pay
   (infrastructure from the bottom up, then the applications).
2. **Edges.** Process → application edges are bits of `pa` (bit = process index × 5 + application index);
   application → infrastructure edges bits of `ai` (application index × 3 + infrastructure index, infrastructure
   order idm, dns, net). Inside the infrastructure the chain is fixed: directory → name resolution → network.
   Processes reach the infrastructure only through applications. Default drawing: orders → shop; dispatch → ERP,
   warehouse; invoicing → ERP, e-mail; payroll → payroll system; support → e-mail; shop → DNS, network; ERP →
   directory, DNS, network; warehouse → directory, network; e-mail → directory, DNS, network; payroll system →
   directory, network (`pa` = 8 923 329, `ai` = 24 446).
3. **Who counts.** The closure of a node is every system reachable from it. *direct*: a system's dependents are the
   processes with an edge to it (so no infrastructure system ever has one); *chain*: the processes whose closure holds it.
4. **Required RTO** = min over dependents of (MTD − margin), never below 0; `from` = that process (**tie: the first
   in process order**). No dependents: `req = null` ("no RTO set").
5. **Recovery order:** required RTO ascending, `null` last; **tie: depth ascending** (the longest chain of
   dependencies below a system; network 0, DNS 1, directory 2); **tie: `SYSTEMS` order**. `waits` = systems in a
   system's closure placed after it. In chain mode a dependency never has a larger required RTO than its dependent
   (every process above the dependent is above the dependency too), and has a smaller depth, so `waits` is always
   empty (tested on 400 random graphs). In direct mode the unrated infrastructure goes last and every application
   every rated application with an infrastructure edge waits for it.
6. **Gap** = max(0, achieved − required); `null` without a requirement. Work list = systems with gap > 0 in recovery
   order; worst = the largest gap (**tie: earlier in the order**); unrated = systems without an RTO that some process
   needs through the graph (closure); broken = systems with `waits`.
7. **Outcome.** A process is back after margin + the largest achieved time in its closure (systems restored in
   parallel); `slow` = that system (**tie: smaller depth, then `SYSTEMS` order**); with no dependency it is back
   after the margin. In time when back ≤ MTD. The outcome does not depend on the mode: the analysis does not change
   the graph. Consequence (tested on 600 random cases): in chain mode, empty work list ⇔ every process in time,
   because a process misses only if some system in its closure takes longer than MTD − margin ≥ that system's
   required RTO.
8. **Params.** `mode` direct | chain; `margin` 0 | 1 | 2 | 3 h (time to notice and decide); MTDs on the steps 4, 8,
   12, 24, 48, 72, 120, 168, 336 h; achieved recovery on 1, 2, 4, 6, 8, 12, 24, 48, 72, 120, 168 h; values off a step
   go to the nearest (**tie: the smaller**); masks clamped to their range; unknown values fall back to the default.
   The stage's − / + steppers move one step and stop at the ends.
9. **Caption.** Main line: processes in time and the work list (or "the work list is empty"). Then at most two notes,
   the first that apply in this order. *direct:* an unrated system that a late process waits for as its slowest
   (nUnrated; else the first unrated one, nUnratedAny); a broken order (nWaits: the first broken system and the last
   system it waits for); a late process (nMiss). *chain:* the first late process (nMiss); the first system in the
   order whose gap only the margin opens, achieved ≤ required + margin (nMargin); the first infrastructure system in
   the order with an RTO, inherited (nInherit); no late process while some system has an RTO (nAllOk).

## Defaults and presets

Defaults = preset 1. Firm defaults: MTD orders 4 h, dispatch 24 h, invoicing 72 h, payroll 168 h, support 24 h;
achieved today network 2 h, DNS 8 h, directory 48 h, shop 2 h, ERP 12 h, warehouse 8 h, e-mail 8 h, payroll system
48 h; margin 1 h. All made up.

| # | id | change from defaults | in time | work list | first in order | processes back (orders/dispatch/invoice/payroll/support) |
|---|---|---|---|---|---|---|
| 1 | `direct` | — (direct users only) | 2 / 5 | empty | shop (infrastructure 6–8, no RTO) | 9 / 49 / 49 / 49 / 49 h |
| 2 | `chain` | mode chain | 2 / 5 | DNS +5 h, directory +25 h | network, DNS, shop, directory… | 9 / 49 / 49 / 49 / 49 h |
| 3 | `hidden` | chain, + shop → directory | 2 / 5 | DNS +5 h, directory +45 h (required 3 h, from orders) | network, DNS, directory, shop… | 49 / 49 / 49 / 49 / 49 h |
| 4 | `fixed` | chain, DNS 2 h, directory 12 h | 5 / 5 | empty | network | 3 / 13 / 13 / 49 / 13 h |
| 5 | `late` | as 4, margin 3 h | 4 / 5 | network, DNS, shop +1 h each | network | 5 / 15 / 15 / 51 / 15 h |

Chain mode, defaults: required network 3, DNS 3, directory 23 (from dispatching: 24 h, tie with support), shop 3, ERP
23, warehouse 23, e-mail 23 (from support), payroll 167. Order: network, DNS, shop (all 3 h, depth 0 / 1 / 2),
directory, ERP, warehouse, e-mail (23 h; directory depth 2, the others 3), payroll system.

## Legend and words

Lines: depends on (solid), ignored by the analysis (dashed: application → infrastructure in direct mode). Cards: in
time (solid green, ✓), gap or late (dashed red, +h or ✕), no RTO (dotted). The black disc is the place in the order.
Terms: business impact analysis / analiza utjecaja na poslovanje (BIA); maximum tolerable downtime / najdulji
podnošljivi prekid (MTD); recovery time objective / ciljno vrijeme oporavka (RTO), as `rpo-rto` writes it.

## Misconceptions targeted

- "Infrastructure is IT's concern, not the business's": no process names it, yet every process inherits through it.
- "Ask each system owner how critical their system is": the direct analysis, with an empty work list and late processes.
- "RTO = MTD": the time to notice and decide comes off it (preset 5).
- "An empty work list means we are fine": only when the requirements followed the whole chain.

## Out of scope

RPO and data loss (`rpo-rto`); the money per hour (`fin-downtime-cost`); finding hidden single points of failure
(`faultline`); sequential restores where one system can only start after another (the times add up; the page says
so in the explanation and foot); restore testing as evidence (`cmp-restore-evidence`); people and suppliers as
dependencies.

## Sources

- ISO 22301:2019, clause 8.2.2 (business impact analysis and risk assessment), by number only *(check)*; the MTD
  concept is ISO 22301's "maximum tolerable period of disruption" (MTPD) *(check the term)*.
- ISO/IEC 27001:2022, Annex A control 5.30, ICT readiness for business continuity *(check)*.
- NIS2, Directive (EU) 2022/2555, art. 21(2)(c): business continuity, such as backup management and disaster
  recovery, and crisis management (EUR-Lex) *(check the official Croatian wording)*.
- DORA, Regulation (EU) 2022/2554, art. 11 (ICT business continuity policy; the business impact analysis in
  art. 11(5)) *(check the paragraph)*.
- `/home/rjasmin/projects/faultline/PEDAGOGY.md`: start from a working but broken estate; the counterfactual as a
  control (here the mode switch and the steppers).

## Check

`bia.py` below re-implements rules 2–7 from this file alone. A node script fed it the five presets and 20 000 random
param sets (seeded, every mask, mode, margin and step) and compared order, work list, worst, in-time count, required
RTO, `from`, gap and every process outcome with `compute`: **20 005 cases, 0 mismatches** (2026-11-07). The preset
table above is its output.

```python
# cmp-bia, re-implemented from SPEC.md alone (not from sim.js).
import json, sys
PROCS = ['orders', 'dispatch', 'invoice', 'payroll', 'support']
APPS = ['shop', 'erp', 'wms', 'mail', 'pay']
INFRA = ['idm', 'dns', 'net']
SYSTEMS = ['net', 'dns', 'idm'] + APPS
FIXED = {'idm': ['dns'], 'dns': [], 'net': []}
MKEY = dict(zip(PROCS, ['mOrders', 'mDispatch', 'mInvoice', 'mPayroll', 'mSupport']))
AKEY = {'shop': 'aShop', 'erp': 'aErp', 'wms': 'aWms', 'mail': 'aMail', 'pay': 'aPay', 'idm': 'aIdm', 'dns': 'aDns', 'net': 'aNet'}
FIXED['dns'] = ['net']

def run(p):
    adj = {}
    for i, x in enumerate(PROCS):
        adj[x] = [a for j, a in enumerate(APPS) if (p['pa'] >> (i * 5 + j)) & 1]
    for j, a in enumerate(APPS):
        adj[a] = [n for k, n in enumerate(INFRA) if (p['ai'] >> (j * 3 + k)) & 1]
    adj.update({k: v for k, v in FIXED.items()})
    def clo(n):
        seen, todo = set(), list(adj[n])
        while todo:
            x = todo.pop()
            if x not in seen: seen.add(x); todo += adj[x]
        return seen
    def depth(n): return max([1 + depth(x) for x in adj[n]], default=0)
    sysd = {}
    for s in SYSTEMS:
        deps = [x for x in PROCS if (s in adj[x] if p['mode'] == 'direct' else s in clo(x))]
        if deps:
            mtd = min(p[MKEY[x]] for x in deps)
            frm = next(x for x in deps if p[MKEY[x]] == mtd)
            req = max(0, mtd - p['margin'])
        else:
            req, frm = None, None
        ach = p[AKEY[s]]
        sysd[s] = dict(req=req, frm=frm, ach=ach, depth=depth(s), gap=None if req is None else max(0, ach - req))
    order = sorted(SYSTEMS, key=lambda s: (sysd[s]['req'] is None, sysd[s]['req'] or 0, sysd[s]['depth'], SYSTEMS.index(s)))
    procs = []
    for x in PROCS:
        c = sorted(clo(x), key=lambda s: (-sysd[s]['ach'], sysd[s]['depth'], SYSTEMS.index(s)))
        back = p['margin'] + (sysd[c[0]]['ach'] if c else 0)
        procs.append(dict(id=x, back=back, within=back <= p[MKEY[x]], slow=c[0] if c else None))
    work = [s for s in order if (sysd[s]['gap'] or 0) > 0]
    worst = max(work, key=lambda s: (sysd[s]['gap'], -order.index(s))) if work else None
    return dict(order=order, work=work, worst=worst, within=sum(q['within'] for q in procs),
                req={s: sysd[s]['req'] for s in SYSTEMS}, frm={s: sysd[s]['frm'] for s in SYSTEMS},
                gap={s: sysd[s]['gap'] for s in SYSTEMS}, procs=procs)

if __name__ == '__main__':
    for line in sys.stdin:
        print(json.dumps(run(json.loads(line))))
```
