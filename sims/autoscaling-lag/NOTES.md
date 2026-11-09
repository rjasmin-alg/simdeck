<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# autoscaling-lag: notes

New explorer (task `docs/tasks/w3/autoscaling-lag.md`, catalogue `perf-autoscaling-lag` §4.8, wave 3). No kit view
fits (a tick chart is none of K1–K4), so the page draws its own SVG, measured in CSS pixels after layout (1:1, no
viewBox), redrawn by a `ResizeObserver`. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Model reuse:** `models/` has no promoted queueing model yet, so `queueMetrics` (with `utilization`, `zone`, the
  0.999 clamp) is **copied** from `sims/utilisation-latency/sim.js @ f2e6118`, marked in `sim.js` (COMMON.md §6).
  The coordinator can promote it (e.g. `models/mg1-queue.js`) and point both sims at it. `simulate()` is pure over
  plain data, no strings: promotable too.
- **Scenarios as plain data** (`scenarioSpec`): the spike (12 ticks), dc-sim `resource_provisioning` (8 ticks, its
  `ticks: 8`) and dc-sim `spot_and_failure_domains` (9 ticks). The run length follows the scenario (task: "a 9–12
  tick run"; the provisioning yaml has 8, kept as dc-sim has it).
- **Lead time applies to the autoscaler's and the plan's orders.** The provisioning scenario's own reserved block
  keeps the yaml's lead 3. With policy `none` nothing is ordered, so the lead control is disabled with the reason.
- **Units:** capacity and demand in requests per second (a dc-sim node's capacity is its service rate), p99 in
  seconds with cv² 1 (both yamls), SLO p99 ≤ 1 s (both yamls' `p99_latency_target`; the spike scenario uses the same).
  At the spike scenario's quiet ticks (ρ 0.8) p99 is already 2.30 s: the "80 % leaves 20 % headroom" misconception
  is visible in every spike run, and the `calm` caption (spike off) says it.
- **Pre-provisioned** (rule 6) knows the demand plan, not the disruptions: it orders each planned rise one lead time
  early (at a negative tick when the rise is closer than the lead), and keeps the reactive rule as a backstop. In the
  dc-sim scenarios demand is flat, so it equals `reactive` there: preemption cannot be planned for (the "spot is just
  cheaper capacity" misconception).
- **Order drawing:** a flag at the tick placed (hollow for the scenario's own order, solid for the autoscaler's and
  the plan's), its amount, an arrow to the tick online and a dashed drop to that tick's capacity. An order placed
  before the run starts at the left edge with "tick −2"; one that comes online after the run ends at the right edge
  with "→ tick 11". Orders that would overlap take another lane.
- **Capacity drawing:** each active block stacked (baseline solid, reserved striped, spot dotted; racks labelled A/B,
  spot "spot"), the capacity step line on top, blocks down (domain outage) or reclaimed (spot) as dashed empty
  ghosts above with "down"/"reclaimed". Demand is a narrow solid bar; saturated ticks cap it red with "∞", and the p99
  strip shows "∞" under an arrow. With labelled blocks (the spot scenario) the demand bar sits right of centre, so the
  labels stay readable.
- **Verdict per tick** (`saturated` / `over` / `ok`) drives "changed": ticks whose verdict differs from the run before
  the last change are highlighted (yellow column, boxed tick number). A new scenario is a new run: nothing marked.
- **Captions** (`captionKey`, first that applies, SPEC.md): the task's en caption is `spot` (policy none), the task's
  hr caption is `lag` with the spike clause (slow-scaler: "… reagiralo u 2. taktu, ali novi kapacitet stiže tek u 6. —
  4 takta zasićenja, a vršak traje 5 taktova."; the counts are digits so they follow the params). The caption tells
  about the autoscaler's reaction to the spike (`captionOrder`), not an earlier order a small baseline causes.
- **Spike-only controls** (spike, baseline) are hidden outside the spike scenario (`visible`); the lead control is
  disabled with its reason under policy `none` and in the provisioning scenario. The page adds
  `.sd-ctl[hidden] { display: none; }` because the kit's `.sd-ctl` display wins over `[hidden]` (see Shared requests).
- **Panel fit:** every preset and the default fit the panel at 1920×1080 in both languages (checked with a script;
  the gate checks the default only). For that the scenario labels are short (Vršak / Rezervacija / Spot) and the hints
  one line each.
- **Concepts, not tools:** "dc-sim" never appears on the page (it is the source, named here and in SPEC.md). Scenario
  and preset labels are generic: "Reserved block", "Spot and failure domains". Preset ids keep the task's
  `dc-sim-provisioning` (URL only).
- Topic `distributed`, tag `performance`, level `advanced` (the task's); all exist in `tags.json`. `related`:
  `utilisation-latency`.

## Deviations from the task

- **Policy `none` added** (none / reactive / ahead). dc-sim's scenarios have no autoscaler; with the reactive one the
  spot preset would order 10.57 at tick 2 and ticks 6–8 would no longer be the task's capacity 20, ρ 1.0. The two
  dc-sim presets set `policy: none`; the default stays `reactive`.
- **`baseline` is a range 5–20** (default 10): the task names the param without a range.
- **Scenario labels on the page** are "Reserved block" and "Spot" (racks and spot), not "dc-sim provisioning" /
  "dc-sim spot and failure domains" (concepts, not tools).
- **Pre-provisioned is "unaprijed" / "ahead"** on the control (short enough for one row of the panel).
- **Captions with numbers as digits** ("4 takta zasićenja", "5 taktova") where the task writes words.

## Sources

- dc-sim (`/home/rjasmin/projects/dc-sim`): `src/dc_sim/skin/resources.py` (`ResourceManager`: `provision`,
  `is_active`, `preempt`, `is_domain_down`), `tests/unit/test_resources.py` (lead time, mid-run order, preemption,
  domain failure; reproduced in `sim.test.js`), `scenarios/resource_provisioning.yaml`,
  `scenarios/spot_and_failure_domains.yaml` (expected ρ per tick in its header), `src/dc_sim/org/team.py`
  (`TARGET_UTILIZATION = 0.7`, `required_capacity = lambda_eff / TARGET_UTILIZATION`), `kernel/queueing.py` via
  `sims/utilisation-latency/`.
- Numbers checked with a script (Python, reimplementing the rules) before the page: every figure in the task's
  presets reproduces (fast 22.86 / 0.70 / 0.672; slow saturated 2–5; too late 12.86 at tick 11, ρ 0.35; provisioning
  0.533 / 0.658; spot 0.714, 18 saturated, 28, 20 at ρ 1.0). dc-sim itself was not run (it needs packages not
  installed here).
- Rule 2 (the reactive autoscaler) and rule 6 (pre-provisioning) are derived, not in dc-sim (the task says so for
  rule 2); dc-sim's teams buy capacity with `RESERVED_LEAD_TIME_TICKS`, a different mechanism with budgets.
- DR and NLA course placement *(check: syllabus topics not opened)*.

## Term pairs

Missing from `kit/glossary.js`, written out in the strings (*English* (Croatian) on Croatian pages):

| English | Croatian | Note |
|---|---|---|
| autoscaling | autoskaliranje | task (check) |
| lead time | vrijeme isporuke | task (check) |
| load spike | nagli porast opterećenja (vršak) | task |
| spot instance / preemptible | prekidiva instanca | task (check) |
| reserved capacity | rezervirani kapacitet | task |
| failure domain | domena kvara | task |
| tick | takt | as in other simdeck sims |

## Shared requests

- **Kit: `.sd-ctl[hidden] { display: none; }`** in `kit/kit.css`. A param's `visible: () => false` sets `hidden` on
  its wrapper, but `.sd-ctl`'s own `display` wins, so the control stays on screen. `amdahl`, `backup-window` and
  this page add the rule themselves; one line in the kit would let them drop it.
- **Gate: panel fit for preset entries.** The browser check measures the panel at the default params only; this
  page's spot and reserved presets overflowed by 61 px (more controls with their reasons) and the gate passed. Opening
  each `sim.json` entry for the one-screen check would have caught it.
- **Models: promote `queueMetrics`** from `utilisation-latency` (this sim keeps a marked copy).

## Not checked

- Projector colours (only the screenshots, light, dark and grayscale).
- dc-sim run itself (numbers from its formulas and tests, reimplemented).

## Review

A fresh reviewer (a separate agent) read `sim.js` against `SPEC.md` and mutated the code. Fixed from its findings:
the `pre` caption claimed no saturation when a baseline below the quiet demand saturates ticks 0–1 (new `preSat`);
with the spike off, captions still spoke of the spike (the state now carries `spike: null`); with policy `none` the
calm caption spoke of an autoscaler (new `noScalerCalm`); SPEC's caption order now matches `captionOrder`; the lead
control is disabled in the provisioning scenario too (nothing orders there); Croatian ordinals got "taktu" (except the
task's own hr caption, kept verbatim). One surviving mutation (autoscaler blocks in a rack's domain) now has a test, as
do the numbers it listed as untested. Mutations it found unreachable from any param set (EPS 0, `>=` on order,
priority of reclaimed vs down, beyondRun at b = n) are left as they are.

## Time

Start 05:37, done 06:01 (one session, about 24 minutes, the review included).
