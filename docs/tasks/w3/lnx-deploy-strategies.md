# lnx-deploy-strategies: Blue-green, canary, rolling

| | |
|---|---|
| Task | `lnx-deploy-strategies` (wave 3, Linux) |
| Catalogue entry | `lnx-deploy-strategies` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-deploy-strategies/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `automation` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **how each moves traffic and rolls back**.

The student: deploy a bad version with each strategy.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T33 "Strategije uvođenja promjene — plavo-zeleno, kanarinac, povratak unatrag" (Napredna Linux administracija; chapters not written yet)
- Kubernetes documentation "Deployments" (rolling update strategy, `maxSurge`/`maxUnavailable` (rule 1), failed deployment and `progressDeadlineSeconds` default 600 s (rule 2), `kubectl rollout undo` (rule 5))
- Google, *The Site Reliability Workbook*, ch. 16 "Canarying Releases" (rule 4); Martin Fowler, "BlueGreenDeployment" (bliki) (rule 3)
- Catalogue seed: NLA T33

## Overlaps (catalogue §5)

- **§5.22 Update approval:** Groups with approvals and rings with deferrals are the same staged-rollout idea; one page with two presets. The canary deploy in Linux links to it.

## Model and presets

- **Scene:** side-by-side compare (kit view if it exists), three lanes stepped in lockstep: rolling,
  blue-green, canary. Each lane: a load balancer, 4 instance boxes labelled v1/v2 (blue-green has two sets of
  4: blue and green), the traffic split as a bar (% to v2), the step's failed requests, a running total, and
  the lane's phase (deploying / done / rolling back / stalled). One shared metric strip under the lanes.
- **State:** `{ t, lanes: { rolling: {phase, v2Share, instances: [{id, ver, ready}], failed, total},
  blueGreen: {…, live: 'blue'|'green'}, canary: {…, stage} } }`.
- **One step:** one minute. Phases per lane, in order: (1) apply the strategy's next move (or the rollback
  move); (2) route 2,000 requests by the split, to ready instances only; (3) count failures
  = requests to v2 × v2's error rate; (4) run the lane's check and, if it trips, set phase = rolling back for
  the next step. A lane that has finished keeps its last state while the others run on.
- **Rules:**
  1. Rolling (surge 1, unavailable 0; Kubernetes is the one named example): one instance replaced per step;
     a new instance takes traffic only once ready; with 4 instances the v2 share goes 25 → 50 → 75 → 100 % (check, Sources).
  2. If v2 never becomes ready, rolling stops with v1 still serving (0 failed requests) and the deployment
     reports no progress after its progress deadline (default 600 s); it does not roll back by itself
     (check, Sources).
  3. Blue-green: step 1 deploys green (v2) beside blue with 0 % traffic and health-checks it; step 2 switches
     100 % at once; rollback switches back in one step, because blue is still running. Switch is refused if
     green is not ready. Derived (check, Sources).
  4. Canary: 10 % for two steps, then 25, 50, 100 %. Its check compares the canary's own error rate with the
     baseline; it aborts when v2's error rate > threshold, setting v2 to 0 % in one step (check, Sources).
  5. Rolling and blue-green rely on the service-wide alert: overall error rate (failed / 2,000) > threshold.
     Their rollback starts the step after it trips. Rolling rollback is itself rolling: −25 % per step.
  6. Tie-break: a check that trips in the step a lane reaches 100 % still triggers rollback; a lane that
     reaches "done" with no trip stops there.
- **Params:** `v2Error` range 0–100 %, default 100; `v2Ready` toggle (v2 passes its health check), default on;
  `threshold` range 1–10 %, default 2; `resets: true` on all. Requests per step fixed at 2,000.
- **Presets** (all derived, unchecked; numbers by the rules above):
  1. `all-errors` — v2 fails every request: rolling 500 failed (one step at 25 %, then rollback to 0);
     blue-green 2,000 (one full step at 100 %, rollback in 1 step); canary 200 (one step at 10 %).
     3 steps.
  2. `subtle-bug` — v2Error 3 %: rolling trips at 75 % (overall 2.25 %), rolls back 50 → 25 → 0: 15+30+45+
     30+15 = 135 failed over 6 steps; blue-green trips at the switch: 60 failed, back in 1 step; canary
     aborts at 10 %: 6 failed. 6 steps.
  3. `below-threshold` — v2Error 1.5 %: overall never exceeds 2 %; rolling and blue-green complete with v2 at
     100 % (30 failed per minute from then on); canary's own rate 1.5 % < 2 % also completes: no strategy
     catches what the check cannot see. 6 steps.
  4. `crash` — v2Ready off: rolling stalls after starting one v2 (0 failed, phase stalled); blue-green refuses
     the switch; canary gets no traffic: 0 failed everywhere. Health checks catch crashes, not wrong answers.
     3 steps.
  5. `good-release` — v2Error 0: rolling done in 4 steps, blue-green in 2, canary in 5. 5 steps.
- **Steps:** 3–6 per preset (the longest lane decides).
- **Legend:** blue box = v1, orange box with a "2" = v2, dashed box = not ready; red cross count = failed
  requests; arrow width = traffic share; "↩" = rolling back. "Changed" highlight: instances replaced and the
  split bar that moved this step.
- **Captions:**
  - hr: „Minuta 1: kanarinac prima 10 % prometa i griješi u 3 % zahtjeva; usporedba s osnovnom inačicom to
    odmah vidi i promet vraća na v1. Ukupno 6 neuspjelih zahtjeva."
  - en: "Minute 1: the canary takes 10 % of traffic and fails 3 % of its requests; comparing it with the
    baseline catches this at once and traffic goes back to v1. 6 failed requests in total."
- **Terms:** rolling update — postupno uvođenje (check); blue-green deployment — plavo-zeleno uvođenje (NLA
  toc T33); canary — kanarinac (NLA toc T33); rollback — povratak unatrag (NLA toc T33); health check —
  provjera ispravnosti (check); error rate — stopa pogrešaka; traffic split — podjela prometa.
- **Misconceptions:** blue-green is the safest (fast rollback, but the whole user base is hit); a passing
  health check means a good release (presets 2–4); rolling update rolls back on its own.
- **Out of scope:** database schema changes and backward compatibility, session affinity, feature flags,
  A/B testing, update rings and WSUS approvals (catalogue §5.22: `win-update-rings` / `win-wsus-groups`
  page; link from here).
- **Note for the coordinator:** §5.22 says the Linux canary links to the update-approval page; this page keeps
  its own model (traffic split per minute), not the rings/deferral model.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-deploy-strategies sims/lnx-deploy-strategies` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-deploy-strategies/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
