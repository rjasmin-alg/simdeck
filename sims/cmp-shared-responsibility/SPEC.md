<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cmp-shared-responsibility: specification

Task `docs/tasks/w3/cmp-shared-responsibility.md`, catalogue `cmp-shared-responsibility` (§4.13). Explorer: the page
is a pure function of its params (`compute` in `sim.js`). This file fills the task's empty "Model and presets"
section.

## Concept

Moving a workload from the firm's own servers to rented infrastructure, a platform or a finished application hands
controls to the provider layer by layer (building, hardware, operating system, application). The customer always
keeps the data, the accounts and who has access, and the backups of its data, even inside someone else's
application. A gap opens where each side assumes the other runs a control. The provider's assurance report is
evidence only for the provider's own part.

**Contrast on the stage:** what the contract says against what the team believes, control by control: the owner of
each control under the four models (a staircase that climbs as more is handed over), the team's belief beside it,
and the gaps where the belief and the owner disagree. Then the report against the controls: proven, carved out, or
not in it at all.

## State (plain JSON)

`{ p, rows[], provider, customer, marked, gaps[], extra[], ok, report, kept[] }`: the normalised params; one row per
control in register order `{ id, layer, k, owner, by: { own, iaas, paas, saas }, assumed, outcome, evidence }`; how
many controls the provider and the customer run under the chosen model; how many the team marked; the ids of the gaps
and of the double work (register order); the number that match; `report = null | { proven, carved, yours, none }`;
the ids of the controls no model hands over.

## Rules (in order; as in `sim.js`)

1. **Layers and controls.** Five layers, bottom up: building (`site`), hardware (`hw`), operating system (`os`),
   application (`app`), data and access (`data`). Twelve controls in register order, top of the stack first (bit k of
   the mask is control k):

   | k | id | layer | control |
   |---|---|---|---|
   | 0 | data | data | which data goes in, and who it is shared with |
   | 1 | ident | data | accounts and sign-in (second factor, leavers) |
   | 2 | access | data | who has access to what, reviewed |
   | 3 | backup | data | backups of the firm's data |
   | 4 | appupd | app | application updates and fixes |
   | 5 | appavail | app | application availability and capacity |
   | 6 | ospatch | os | operating system patches |
   | 7 | osharden | os | server hardening and administrator accounts |
   | 8 | hwfail | hw | hardware faults and spare parts |
   | 9 | disk | hw | wiping disks that leave service |
   | 10 | phys | site | physical access to the server room |
   | 11 | power | site | power, cooling, fire protection |

2. **Owner.** Each model hands the lowest n layers to the provider: own servers 0, rented infrastructure (IaaS) 2,
   platform (PaaS) 3, finished application (SaaS) 4. A control is the provider's when its layer's index (bottom up,
   from 0) is **below** n, else the customer's. The data layer (index 4) is never below n: the customer keeps it in
   every model. The service models follow NIST SP 800-145's definitions; real contracts draw some lines differently
   and some rows are shared, which the page simplifies to one owner per row (the explanation says so).
   Provider / customer counts: own 0 / 12, IaaS 4 / 8, PaaS 6 / 6, SaaS 8 / 4.
3. **Belief and outcome.** The mask holds the team's belief: bit k set = "the provider runs control k". A click on a
   row flips its bit (`toggle`). Outcome: provider-owned and marked → ok; customer-owned and unmarked → ok;
   customer-owned and **marked → gap** (nobody runs it); provider-owned and **unmarked → extra** (double work: the team
   plans a control it cannot reach). On own servers there is no provider, so every mark is a gap. Beliefs stay when
   the model changes (the team's view does not move with the contract).
4. **The report.** Closed: evidence null for every row. Open: own servers → `none` for every row (no provider, no
   report); a customer-owned row → `yours` (not in the report; the report lists such controls as the customer's own,
   complementary controls); a provider-owned row in the building layer with `carve` on → `carved` (the provider
   rents the data centre and its report carves the operator out: the operator's own report is needed); any other
   provider-owned row → `proven`. `carve` has no effect with the report closed.
5. **Params.** `model` own | iaas | paas | saas (else own); `mask` a number or a numeric string, rounded halves up,
   clamped to 0–4095, anything else (`"abc"`, `""`, `NaN`, `null`) → 0; `report`, `carve` true or the string "true"
   (case matters), else false.
6. **Presets** (table below); defaults = preset 1.
7. **Caption.** Main line by the model (`cap_<model>`, with the provider and customer counts). Then at most two
   notes, the first that apply in this order: gaps → `nGap` (the count, and the first gap in register order with what
   goes wrong when nobody runs it); report open → `nNoReport` on own servers, `nCarve` with carve on, else `nReport`;
   double work → `nExtra` (the count and the first in register order). Only when none of these applies → `nKeep`
   (the four controls no model hands over), so the caption stays at three lines on the projector.

**Tie-breaks.** Only two orders exist: the gap and the double-work lists are in register order (top of the stack
first), so the caption names the topmost; and a layer's index decides the owner with a strict "below" (the layer at
index n stays with the customer).

## Defaults and presets

| # | id | model | mask (bits set) | report / carve | provider / customer | marked | gaps | extra | report: proven / carved / yours | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `own` | own | 0 (none) | off / off | 0 / 12 | 0 | — | — | — | nKeep |
| 2 | `iaas` | iaas | 3840 (8–11) | off / off | 4 / 8 | 4 | — | — | — | nKeep |
| 3 | `iaasOs` | iaas | 4032 (6–11) | off / off | 4 / 8 | 6 | ospatch, osharden | — | — | nGap |
| 4 | `saasAll` | saas | 4095 (all) | off / off | 8 / 4 | 12 | data, ident, access, backup | — | — | nGap |
| 5 | `saasReport` | saas | 4088 (3–11) | on / off | 8 / 4 | 9 | backup | — | 8 / 0 / 4 | nGap, nReport |
| 6 | `carve` | iaas | 3840 (8–11) | on / on | 4 / 8 | 4 | — | — | 2 / 2 / 8 | nCarve |

What a student does from preset 1: switch to rented infrastructure with nothing marked → 4 double work (the team
still plans the server room's door and the disks); mark them → 0. Preset 3 is the lift-and-shift belief ("the
provider patches the servers now"); preset 4 the finished-application belief ("the provider does everything"); preset
5 the team that knows its accounts are its own but trusts the application to keep its data, then opens the report:
8 of 12 proven, and the backup, its gap, is not in it. Preset 6: the report proves only the hardware; the building is
the data-centre operator's, in that operator's report; the 8 customer controls are in no report.

## Check

The Python below re-implements rules 2–7 and prints each preset's row; its output is the table above. `sim.test.js`
asserts the same numbers, and the run in `NOTES.md` compared it with `compute` over every model × report × carve ×
all 4 096 masks (65 536 cases, 0 mismatches).

```python
LAYERS = ['site', 'hw', 'os', 'app', 'data']
C = [('data','data'),('ident','data'),('access','data'),('backup','data'),('appupd','app'),('appavail','app'),
     ('ospatch','os'),('osharden','os'),('hwfail','hw'),('disk','hw'),('phys','site'),('power','site')]
H = {'own': 0, 'iaas': 2, 'paas': 3, 'saas': 4}
def run(model, mask, report=False, carve=False):
    rows = []
    for k, (i, layer) in enumerate(C):
        own = 'provider' if LAYERS.index(layer) < H[model] else 'customer'
        b = (mask >> k) & 1 == 1
        out = ('ok' if b else 'extra') if own == 'provider' else ('gap' if b else 'ok')
        ev = None if not report else 'none' if model == 'own' else 'yours' if own == 'customer' \
            else 'carved' if carve and layer == 'site' else 'proven'
        rows.append((i, own, b, out, ev))
    gaps = [r[0] for r in rows if r[3] == 'gap']; extra = [r[0] for r in rows if r[3] == 'extra']
    prov = sum(r[1] == 'provider' for r in rows)
    rep = None if not report else tuple(sum(r[4] == e for r in rows) for e in ('proven', 'carved', 'yours'))
    notes = (['nGap'] if gaps else []) + ((['nNoReport' if model == 'own' else 'nCarve' if carve else 'nReport'])
             if report else []) + (['nExtra'] if extra else [])
    notes = notes or ['nKeep']
    return prov, 12 - prov, sum(r[2] for r in rows), gaps, extra, rep, notes[:2]
for args in [('own', 0), ('iaas', 3840), ('iaas', 4032), ('saas', 4095), ('saas', 4088, True),
             ('iaas', 3840, True, True)]:
    print(args, run(*args))
```

## Legend and words

- Owner chips in the four model columns: "pružatelj" / "provider" (filled, with a cloud mark ☁) and "korisnik" /
  "customer" (outlined). The chosen model's column has a thick outline and a ▾ in its header.
- Belief: a button per row with the same chips; "korisnik" / "customer" is dashed.
- Outcome: ✓ matches ("poklapa se"); ✗ **gap** (danger colour, bold, a dashed outline on the whole row); ≈ double work (muted,
  dotted).
- Report: ✓ proven; ⧉ carved out (the operator's report); — not in the report, yours to prove; closed: blank.
- Colour never alone: each state has a letter or mark and a fill or line style.

Terms (Croatian / English): podijeljena odgovornost / shared responsibility; vlastiti poslužitelji / own servers;
iznajmljena infrastruktura (IaaS) / rented infrastructure; platforma (PaaS) / platform; gotova aplikacija (SaaS) /
finished application; pružatelj / provider; korisnik (ovdje "mi", tvrtka) / customer; praznina / gap; dvostruki posao /
double work; izvješće neovisnog revizora o kontrolama pružatelja / the provider's assurance report; izuzeće
podizvođača / carve-out; komplementarne kontrole korisnika / complementary customer controls.

## Sources

- GDPR, Regulation (EU) 2016/679 (EUR-Lex; Croatian: Opća uredba o zaštiti podataka): art. 24 (the controller's
  responsibility), art. 28(1) (only processors with sufficient guarantees), art. 28(3)(h) (the processor makes
  available the information needed to demonstrate compliance and allows audits), art. 32 (security of processing,
  controller and processor). These ground rule 2's "the data layer stays with the customer" and rule 4's "the report
  is evidence for the provider's part".
- NIS2, Directive (EU) 2022/2555, art. 21(2)(d): supply chain security among the required measures.
- ISO/IEC 27001:2022, Annex A control 5.23 (information security for use of cloud services), by number only.
- DORA, Regulation (EU) 2022/2554, art. 28–30 (ICT third-party risk, key contractual provisions), for the financial
  sector; explanation only.
- NIST SP 800-145 (the IaaS, PaaS and SaaS service models), for rule 2's layer split.
- Assurance reports, complementary user entity controls and the carve-out method: general audit practice for an
  independent auditor's report on a service organisation's controls; no report type is named on the page.
- Unverified details are marked *(check)* in `NOTES.md`.

## Misconceptions targeted

- "In the cloud the provider does security." (preset 4: the four data-and-access controls are gaps)
- "The application keeps our data safe, so we have backups." (preset 5: the provider keeps the service running; a
  deletion by a user or an attacker with a valid account is replicated, not undone)
- "Rented servers come patched." (preset 3: the operating system is the customer's in IaaS)
- "The provider is certified, so we are covered." (presets 5 and 6: the report proves the provider's part, and may
  carve out its own subcontractor)

## Out of scope

Cost (`fin-cloud-commitment`); choosing and tiering suppliers (`cmp-vendor-tiers`); exit plans and portability;
shared rows (network controls, encryption keys held by either side); hybrid set-ups; where the data is stored
(transfers outside the EU); the contract's wording. The page simplifies each row to one owner.
