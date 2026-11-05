<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# crush-failure-domain: notes

New stepper (task `docs/tasks/w3/crush-failure-domain.md`, catalogue `sto-crush-failure-domain`, wave 3). Rules and
expected numbers: `SPEC.md`. Kit view **K3** (`Simdeck.blockGrid`) draws the sample strip; the tree, the rule and the
overview of every PG are drawn in the page.

## Decisions

- **Model reuse** (COMMON §6): `ceph-min-size`'s model is not in `models/` yet, so its `group` (PG state from live
  copies, rules 1–4) is copied into `sim.js` with `// from sims/ceph-min-size/sim.js @ 74e4819`, and so are its colours (clean `--c3` solid, degraded `--c7` hatched, inactive a `--danger` frame) and its
  CSS state marks. What this sim adds on top (risk racks, holes, the step script) is pure and promotable.
- **Placement fixture** from cephsim's own sample documents (`makeSample('brokenRule')`, `makeSample('threeRacks')`),
  not rebuilt by hand: `tools/gen-placement.mjs` swaps in the rule (`type host` / `type rack`, `firstn` for rbd,
  `indep` for EC) and runs `mapPool`. It also prints `evaluatePool`'s counts with each rack down, which match the
  model's own counts (tests).
- **"At risk"** is defined as "a rack holds more than `width − min_size` of the PG's copies", i.e. losing that rack
  alone stops the PG. For rbd 3/2 that is the task's "two replicas share a rack"; for EC 4+2 it is three or more
  shards (two in one rack are unavoidable with six shards on three racks, and harmless with m = 2). A test checks the
  equivalence for every PG, rack and rule.
- **Copies drawn grouped by rack** (rack 1, 2, 3; CRUSH order within a rack), so the copies that share a rack stand side
  by side and one K3 span outlines them. The order of copies (the primary) is not the subject here.
- **"!" in the aside, not as the span label.** A span label lives in the band under the row, which only takes height
  when a label is there; the rows then jumped between step 1 and step 2. The span is an outline only; the aside says
  "! rack1" and, after a loss, the state.
- **The overview of every PG** (`showAll`) is a bitmap drawn in the page, not K3: 2048 cells as 32 K3 rows (each with
  its bands) overflowed the stage, and K3's ✕ corner on `bad` cells is unreadable at that size. Squares: clean solid,
  degraded hatched, inactive a hollow red frame, no copy grey with a diagonal (distinct in grayscale); before a loss a
  PG at risk has an ink bar under it. Counts with matching keys under it.
- **Rule switch in the comparison** brings the lost rack back and places afresh; the caption says "rack N is back up".
  Changing the rule on a live cluster moves data, which this page does not model (the explanation says so).
- **Comparison without a loss** (`before-the-loss`) is two steps, as the task asks: step 1 places under the rule and
  shows its risk at once, step 2 does the same for the other rule and shows the totals table.
- **Health**: `HEALTH_OK` only when every PG is clean and nothing is down; otherwise `HEALTH_WARN`.
- **Concepts, not tools**: Ceph and CRUSH are named (NLA T26 teaches them); the rule text, pool names and state
  strings are the subject. Host names are cephsim's sample names.

## Deviations from the task

- **Params**: added `pool` (rbd / ec) so the `ec-by-host` preset is a setting, and `compare` (then the other rule) for
  the seven-step comparison and `before-the-loss`. `showAll` shows every PG as a bitmap instead of the sample strip
  (the task's "totals only vs sample strip"; the totals card is always there).
- **State**: `raw` is not in the state (constant per pool and rule, `placement.js`); `pgs` is one letter per PG; added
  `placed`, `risk`, `risky`, `holes`, `health`, `ev`.
- **State names**: the page shows words ("inactive", "no copy"), not Ceph's state strings; the task's
  `incomplete+inactive` / `stale+inactive` are cephsim's names, which `ceph-min-size` NOTES.md questions.
- **Health word**: `HEALTH_WARN` after the loss; cephsim's `health.js` raises inactive PGs to `HEALTH_ERR`
  ("this is an outage, not a warning"). Ceph's health checks list `PG_AVAILABILITY` as a warning *(check)*.
- **Legend**: the replica badge is a K3 cell (host name, colour = rack) rather than a circle with the rack number; the
  "two in one rack" mark is a span outline plus "! rackN"; the lost rack is a crossed, dashed red frame in the tree.
- **Croatian caption**: the task's hr caption says "poslužitelja"; the page says "domaćina", as `ceph-min-size` does
  for host.
- **EC by rack** (not in the task) is reachable from the controls and shows rule 2 on the page: three shards, three
  holes, inactive before anything fails.

## Sources

- cephsim `js/engine/crush.js`, `js/engine/pgmap.js` (`mapPool`, `pgState`, `evaluatePool`), `js/compile.js`,
  `js/samples.js` (`threeRacks`, `replicasInOneRack` / `brokenRule`), `js/engine/health.js`: in `sims/cephsim/`, copied
  from `~/projects/cephsim`. Read and run.
- `sims/ceph-min-size/` (SPEC rules 1–4, `group`, page layout). Read.
- DR estate, student side: `configs/hq/hqc/crushmap.txt` (`step chooseleaf firstn 0 type host`), via the task text.
- Ceph documentation "CRUSH Maps" (failure domains, `chooseleaf firstn|indep`, `CRUSH_ITEM_NONE` holes) and "Health
  checks" (`PG_AVAILABILITY`, `PG_DEGRADED` severities) *(check: from memory, no network)*.

## Checks

- Numbers from the cephsim engine (`node sims/crush-failure-domain/tools/gen-placement.mjs` prints them), all asserted in
  `sim.test.js`: 453 = 420 + 33 / 1096 / 499 (host, rack 1); 470 and 467 for racks 2 and 3; 0 / 2048 (rack); 271 and
  783 (EC by host); 1024 inactive with holes (EC by rack); 1390 and 706 PGs at risk.
- **Mutations**: 16 one-at-a-time mutations of `sim.js` (inactive and degraded thresholds, stale never, risk `>=`,
  CRUSH-order drawing, holes counted as copies, the no-loss comparison script, the rule switch keeping the rack down,
  health ignoring down OSDs, the sample from PG 1, the rack size, changed marks beyond the sample, the EC alternative
  min_size, the rule ignored, strict param matching, totals after = before): all fail a test.
- **Fresh review** (a separate agent: the four placements re-derived from cephsim's own sample rules, 0 PGs differ; every
  number confirmed; all 32 param combinations × every step × hr/en loaded headless, no console errors). Fixed from it:
  "one word changed, host → rack" said when no host run came first (`capLoseRackPlain`) and "just as with type host" in
  `capRiskRack`; the Croatian totals and the degraded 5+ form without agreement; a `;` before a capital when no clean
  clause followed; the EC comparison saying "1024 stop" under rack without saying they were inactive before
  (`capTotalsEcRack`); "two copies" where the count includes three; copy-only words on EC (legend neutral,
  `stripMetaEc`); "! 0 of …" on a zero count (`riskNone`); `cephState` unused (removed). Ten surviving mutations (risk
  shown in the place step, `alt` for rbd, `placedNow`, totals for rack 1 only, EC health, changed marks in an
  all-inactive pool, PG ids in decimal, EC m, the rule mode) now fail tests: 26 mutations in all.
- `npm run gate -- crush-failure-domain` passes; screenshots (1920×1080 light, dark, grayscale; 375×812; both languages)
  and every preset at its key steps (a local Playwright script) reviewed.

## Term pairs

Not in `kit/glossary.js`; written out by hand (`*failure domain* (domena kvara)` in the start caption, `<em lang="en">`
in the explanation). For the coordinator to add with `"src": "simdeck"`:

| en | hr | source |
|---|---|---|
| failure domain | domena kvara | task *(check)* |
| placement rule | pravilo smještaja | task |
| rack | ormar | task (DR/UL usage, *check*) |
| bucket (CRUSH) | spremnik | task *(check)* |
| placement group (PG) | grupa smještaja | task, as `ceph-min-size` |
| replica | kopija | task |
| shard (EC) | dio | this page *(check)* |

## Shared requests

- **Model promotion**: `ceph-min-size`'s `group` is now copied in three sims (`ceph-min-size`,
  `ceph-down-out`'s own copy, this one). A `models/ceph-pg.js` with `group(live, size, minSize)` and `cephState(g)`
  would serve all of them (`ceph-min-size` also has `cephState(g)`).
- **K3 `blockGrid`**: a dense mode for hundreds of cells (no bands, no corner glyphs, square cells), so an "every PG"
  overview can use the kit. Worked around: a bitmap drawn in the page.
- **K3 spans**: the band under a row grows only when a span has a label, so rows jump when labels come and go; an
  option to reserve the band (as `brackets: []` does above) would help. Worked around: no span labels.

## Time

Started 04:21, done 04:45 (about 25 minutes, one session, including the fresh review).
