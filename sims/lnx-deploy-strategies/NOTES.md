<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-deploy-strategies: notes

New stepper (task `docs/tasks/w3/lnx-deploy-strategies.md`, catalogue `lnx-deploy-strategies` §4.4, wave 3). One
concept: how a rolling update, blue-green and a canary move traffic and roll back. Rules and expected numbers:
`SPEC.md`.

## Decisions

- **Drawn by the page:** no kit view compares lanes. Three lane cards side by side, on shared rows (CSS subgrid), so
  a Croatian name that wraps in one lane keeps the fleets level. Each lane: name (the term) and its rule in one line,
  the phase badge (glyph + word: → deploying, ↩ rolling back, ↩ back on v1, ✓ done, ⏸ stalled), the load balancer,
  the fleet, the split bar, this minute ✗ and total Σ, and the check line (rate, `>`/`≤`, threshold).
- **Fleet:** one column per instance slot, the same width in every lane (rolling 4 + a surge slot; blue-green 4 blue +
  4 green; canary 4 baseline + up to 4 canary). Above each box a bar whose width is that instance's share of traffic
  (a quarter of all traffic = full width; none = a dotted line). v1 = blue box "v1", v2 = orange box "v2", not ready =
  dashed hatched box. Group labels name the sets; the live one is bold with a thick rule and "· live". "Changed" is the
  kit's yellow outline on the replaced boxes, the split bar when it moved and the phase badge when it changed.
- **Shared strip** under the lanes: failed requests per minute per lane, the current minute outlined, the trip
  minute in a red frame, ↩ / ✓ / ⏸ where the minute changed the phase, and the totals.
- **Caption:** one headline per minute, from the lane whose event ranks highest (trip > refused/stalled > rolled back >
  done > rollback step > advance/deploy > serving); ties go to more failed requests, then lane order. By these rules
  blue-green's deploy minute, the canary's advance and stall minutes and a done lane serving never make the headline
  (checked over the whole parameter grid), so they have no caption strings; the stage shows them (phase, check line,
  strip). Failed counts in captions use plural forms (`nFailed`: hr 1 / 2–4 / 5+). Minute 1 of
  `subtle-bug` is the task's caption in both languages. At the end of a run where every lane finished at 100 % on a
  v2 that still fails (`below-threshold`) the caption adds "no check catches what it cannot see".
- **Phases:** `idle` (minute 0) and `rolledBack` added to the task's four (SPEC.md).
- **Crash timing:** rolling and canary stall in minute 1 (their move needs a ready v2 at once); blue-green deploys
  green in minute 1 and refuses the switch in minute 2. Rolling shows the progress deadline as minute 11 (started at
  1, + 600 s) in its caption; the deadline itself lies beyond the run.
- **A finished lane keeps serving:** `done` keeps routing and failing (30 a minute in `below-threshold`), so the strip
  shows the damage a passing check lets through; no more checks run (rule 6).
- **Canary instances:** 1, 1, 1, 2, 4 v2 instances for 10, 10, 25, 50, 100 %, so the bars stay readable. On abort the
  canary instances stay and get 0 % (like green after a blue-green rollback).
- **Checks read the exact rate**, counts are rounded (SPEC rule 7): otherwise a canary at 1.5 % against a 1.5 %
  threshold tripped at 25 % on 8 of 500 (found in review).
- **Params** are all `resets: true` (task). `v2Error` and `threshold` move in 0.5 % steps so 1.5 % is reachable.
- **Steps** = the minute the last lane finishes, at least 3 (`steps(p)`); `sim.json` has the default's (all-errors) 3.
  Over the whole parameter range 3–8 (tested).
- **Terms:** none are in `kit/glossary.js`; on the Croatian page the lane names and *health check* are in italics with
  the Croatian in parentheses (`term()` in the page, keys `…Hr`), the same way `lnx-alert-states` does it.
  "Load balancer" is *uravnotežitelj opterećenja*, as in `reverse-proxy-lb`.
- **Products named:** Kubernetes (NLA T19 teaches it) only in the explanation, with `maxSurge`, `maxUnavailable`,
  `progressDeadlineSeconds` and `rollout undo`, the settings the rolling lane models. Nothing else is named.
- **Preset entries** in `sim.json`: `subtle-bug` (the canary sees 3 % at 10 %) and `below-threshold` (no check sees
  it). Tags `automation`, topic `linux-admin`, level `advanced` (the task's); all exist in `tags.json`.
- **No `related`:** the update-approval page (§5.22, `win-update-rings` / `win-wsus-groups`) does not exist yet, and
  `related` ids must exist. The explanation names Windows update rings as out of scope.

## Deviations from the task

- `below-threshold` runs **5** steps, not 6: the canary finishes last at minute 5 (10, 10, 25, 50, 100), and the
  task's rule is "the longest lane decides". Totals 106 / 120 / 59.
- Failed requests are **rounded half up** to whole requests (500 × 1.5 % = 7.5 → 8); the task does not say.
- The check is strictly over the threshold (exactly 2 % at 2 % does not trip); the task's "> threshold".
- Preset labels give the error rate ("A 3 % bug", "A 1.5 % bug") instead of naming the outcome, so they fit the panel
  on one line; the hints give the threshold.
- Rules 2 and 5 pull two ways (rolling "does not roll back by itself", yet rolls back the minute after the alert). The
  explanation says the alert stands for the operator or pipeline that starts undoing it.

## Tests

28 tests: tie-breaks first (trip at 100 %, done stops, strict threshold, rollback the minute after, rounding), then
rules 1–5, every preset's numbers, steps over the whole range, and the template's generic block. Each rule was broken
once (rolling trip skipped at 100 %, `>=`, +50 %, no stall, no refused switch, canary on the overall rate, canary
stages, −50 % rollback, floor rounding, a finished lane frozen, min steps 1): every break fails 1–14 tests. Counting
traffic to not-ready instances survives: it is an equivalent mutant, because a not-ready v2 never gets a share
above 0 (the strategies refuse the move instead).

**Fresh review** (a separate agent, SPEC.md against the code, 60+ mutations): every preset number confirmed. Fixed
from it: the rounded-count check above; rolling's exact-threshold edge, the deadline, a not-ready canary, the `changed`
ids, the blue-green and canary events, `trippedAt` and the kept canary instance now have tests (each of those
mutations now fails a test); Croatian accusative ("ne prolaze provjeru ispravnosti") and plural agreement of failed
counts; unreachable caption strings removed; minute 0 of `good-release` says v2 makes no errors; "replaces one more
instance" at minute 1 now reads "one instance". Equivalent mutants left: ceil vs round (inputs on a 0.5 grid), traffic
ignoring `ready` or `live`, the canary trip skipped at 100 %, MAX_STEPS 8.

## Sources

- Kubernetes documentation, "Deployments": rolling update strategy (`maxSurge`, `maxUnavailable`), failed
  deployment and `progressDeadlineSeconds` (default 600), `kubectl rollout undo`. Not re-read for this task
  *(check)*; the values are the task's.
- Google, *The Site Reliability Workbook*, ch. 16 "Canarying Releases" (canary compared with the baseline) *(check)*.
- Martin Fowler, "BlueGreenDeployment" (bliki) *(check)*.
- NLA `meta/toc.md` T33 "Strategije uvođenja promjene — plavo-zeleno, kanarinac, povratak unatrag" (chapters not
  written). NLA `meta/glossary.yaml` has none of these terms yet *(check when T33 is written)*.
- All preset numbers are derived from the rules (the task: "all derived, unchecked") and checked by script and tests.

## Term pairs

All eight are in `kit/glossary.js` (`"src": "simdeck"`, added on the owner's request, 2026-11-03); the string tables use them as `[[term]]` markers, and the page links `kit/glossary.js`:

| English | Croatian | Source |
|---|---|---|
| rolling update | postupno uvođenje | task *(check)* |
| blue-green deployment | plavo-zeleno uvođenje | NLA toc T33 |
| canary | kanarinac | NLA toc T33 |
| rollback | povratak unatrag | NLA toc T33 |
| health check | provjera ispravnosti | task *(check)* |
| error rate | stopa pogrešaka | task |
| traffic split | podjela prometa | task |
| load balancer | uravnotežitelj opterećenja | `sims/reverse-proxy-lb` |

## Shared requests

- None for the kit. A compare view (lanes in lockstep on shared rows) would have helped; the subgrid layout here is
  small and could become one if a second sim needs it.

## Time

Start 18:36, first gate pass 18:45, review fixes and done 19:03 (about 27 minutes).
