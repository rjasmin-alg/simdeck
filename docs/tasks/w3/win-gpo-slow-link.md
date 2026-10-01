# win-gpo-slow-link: Slow links

| | |
|---|---|
| Task | `win-gpo-slow-link` (wave 3, Group Policy) |
| Catalogue entry | `win-gpo-slow-link` in `docs/catalogue.md` §4.5.2 |
| Kind | build a new simulator |
| Folder | `sims/win-gpo-slow-link/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `group-policy` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-gpo-processing` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **which extensions skip over a slow link, and why a branch behaves differently**.

The student: change the link speed, refresh.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.2.
5. `sims/win-gpo-processing/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "Configure Group Policy slow link detection" (policy reference; default 500 kbps) (check title); "Group Policy slow link detection" (which extensions process over slow links) (check title)
- `/home/rjasmin/projects/topologydrafter/js/samples.js` (sample `two-sites`: branch link 200/50 Mb)

## Model and presets

- **Scene:** a client PC at the end of a link with a speed dial (kbps), the DC at the other end, and the slow-link threshold marked on the dial. A K4 table: one row per client-side extension (Administrative Templates/registry, Security, EFS recovery, IP security, Scripts, Folder Redirection, Software Installation, Disk Quotas, one preference extension: Drive Maps) with columns "fast link" / "slow link" and the cell lit for the current speed.
- **State (explorer):** `{ speedKbps, thresholdKbps, allowSlow: { cse: bool }, refreshKind: 'foreground'|'background' }`. Derived: `slow = speedKbps < thresholdKbps` (threshold 0 → never slow), and per CSE ran / skipped / not-in-this-pass.
- **Live:** moving the speed or threshold re-evaluates every row; the caption names which rows flipped.
- **Rules (Microsoft: "Configure Group Policy slow link detection" (policy reference); "Group Policy slow link detection" (check titles)):**
  1. Default threshold 500 kbps; 0 disables detection (every link fast). Since Windows Vista the estimate comes from Network Location Awareness, not from pings.
  2. On a slow link, registry-based policy (Administrative Templates) and Security settings always apply; EFS recovery and IP security policy too (check).
  3. On a slow link, by default: Software Installation, Folder Redirection, Scripts and Disk Quotas are skipped (check: Scripts default).
  4. Each extension (and each preference extension) can be set to "Allow processing across a slow network connection", which turns rule 3 off for it (check: preference extension defaults).
  5. Foreground-only extensions (Software Installation, Folder Redirection) are "not in this pass" in a background refresh regardless of speed (`win-gpo-processing` rule 2).
  6. Tie-break at the boundary: speed equal to the threshold counts as fast (check: strict "slower than").
- **Params:** `speedKbps` range 0–1,000,000 (log scale) default 200,000 (the two-sites branch link, 200/50 Mb); `thresholdKbps` range 0–5,000 default 500; `allowScripts` toggle default off; `pass` choice {foreground, background} default foreground.
- **Presets (4):**
  - `branch-200mb` — two-sites branch at 200 Mb/s → fast; every extension runs. From topologydrafter `two-sites` link label; classification derived.
  - `vpn-384k` — home user on a 384 kbps VPN → slow: Software Installation, Folder Redirection, Scripts skipped; Admin Templates and Security applied. Derived, unchecked.
  - `threshold-0` — same link, threshold 0 → all run.
  - `allow-scripts` — 384 kbps with "allow across slow link" on Scripts → scripts run, the rest as `vpn-384k`.
- **Steps:** 0 (explorer).
- **Legend:** extension row, ran (filled), skipped for slow link (hollow + snail), not in this pass (grey), always-applied (padlock); "changed" highlight marks rows that flipped with the last param change.
- **Captions:** hr: "Veza od 384 kbit/s sporija je od praga 500 kbit/s: instalacija softvera i preusmjeravanje mapa preskaču se, a administrativni predlošci i sigurnosne postavke primjenjuju." en: "384 kbps is below the 500 kbps threshold: Software Installation and Folder Redirection are skipped; Administrative Templates and Security settings still apply."
  hr: "Podružnica na 200 Mbit/s nije *slow link* (spora veza): sve se primjenjuje." en: "The branch at 200 Mb/s is not a slow link: everything applies."
- **Terms (check):** slow link — spora veza; threshold — prag; client-side extension — proširenje na klijentu; network location awareness — prepoznavanje mrežne lokacije; bandwidth — propusnost (URM, check); folder redirection — preusmjeravanje mapa.
- **Misconceptions:** a branch office means a slow link; on a slow link no policy applies; security settings can be skipped over a slow link.
- **Out of scope:** roaming profiles and offline files over slow links, remote-access specifics, measuring bandwidth.
- **Builds on `win-gpo-processing`:** reuses its CSE table and foreground/background passes; new is the speed gate.
- **Note for the coordinator:** the task's Class is stepper but the concept is a live dial; this spec makes it an explorer (steps 0). If it must stay a stepper, step through the four presets.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-gpo-slow-link sims/win-gpo-slow-link` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-gpo-slow-link/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
