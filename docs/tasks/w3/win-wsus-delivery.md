# win-wsus-delivery: Delivering updates over a WAN

| | |
|---|---|
| Task | `win-wsus-delivery` (wave 3, WSUS and updates) |
| Catalogue entry | `win-wsus-delivery` in `docs/catalogue.md` §4.5.6 |
| Kind | build a new simulator |
| Folder | `sims/win-wsus-delivery/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `updates` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-wsus-flow` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **express vs full files, BITS, delivery optimization peers at a branch**.

The student: update a branch over a slow link.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.6.
5. `sims/win-wsus-flow/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Plan your WSUS deployment" (express installation files, storage and bandwidth trade-off, BranchCache with WSUS); "BranchCache overview"; "Delivery Optimization reference"; "Background Intelligent Transfer Service" (Group Policy "Limit the maximum network bandwidth for BITS background transfers")

## Model and presets

- **Scene:** a branch with N clients on a LAN, a WAN link of chosen speed to HQ (where WSUS-HQ sits), and optionally a downstream WSUS-BR at the branch. Big numbers: bytes over the WAN, time to finish at link speed, bytes per client. Per-client bars show where each client's bytes came from: WAN, branch server, or a peer.
- **State:** `clients` (N), `wanMbps`, `throttleMbps | null`, `updateFullMB`, `expressDeltaMB`, `expressStoreFactor`, `files: full|express`, `peering: none|peerCache`, `branchServer: bool`, derived `wanBytes`, `hours`, `perClient: [{ fromWan, fromServer, fromPeer }]`.
- **One step:** explorer. Every param change recomputes the totals.
- **Rules:**
  1. Full files: every client downloads the whole update (`updateFullMB`). Express files: the client downloads only the delta it needs (`expressDeltaMB`, toy 100 MB vs 600 MB), but the WSUS server must store the express set, `expressStoreFactor` × full (toy 4×) (Microsoft, "Express installation files" (check)).
  2. No branch server, no peering: WAN bytes = N × per-client size.
  3. Branch server: WAN bytes = what the branch server stores (full or express set) once; clients then use the LAN.
  4. Peer caching at the branch: the first client pulls over the WAN, the others from peers; WAN bytes ≈ one copy (plus small hash metadata, ignored). For clients of WSUS this is BranchCache; Delivery Optimization peering applies to content from Microsoft's cloud services (check — see the coordinator note).
  5. Background transfers (BITS) use idle bandwidth and may be capped by policy (`throttleMbps`); time = WAN bytes × 8 / min(link, throttle) (Microsoft, "BITS: Background Intelligent Transfer Service" (check)).
  6. Time ignores protocol overhead and other traffic (stated on the page).
- **Params:** `clients` range 5–200 (default 50); `wanMbps` choice 2 / 10 / 100 (default 10); `throttle` choice none / 2 Mbps (default none); `files` choice full / express (default full); `peering` choice none / peer cache (default none); `branchServer` toggle (default off); `updateFullMB` range 100–1500 (default 600).
- **Presets:**
  1. `full-from-hq` — derived, unchecked: 50 clients × 600 MB = 30 GB over 10 Mbps → 24 000 s ≈ 6 h 40 min.
  2. `express-from-hq` — derived, unchecked: express, 50 × 100 MB = 5 GB → 4 000 s ≈ 1 h 7 min.
  3. `peer-cache` — derived, unchecked: full files, peer cache → about 600 MB over the WAN → 480 s = 8 min; the other 49 clients load from peers.
  4. `branch-server-express` — derived, unchecked: branch server storing the express set (4 × 600 MB = 2.4 GB) → 1 920 s = 32 min over the WAN once, then LAN.
  5. `throttled` — derived, unchecked: preset 1 with BITS capped at 2 Mbps → 120 000 s ≈ 33 h 20 min.
- **Steps:** none (explorer).
- **Legend:** per-client stacked bars with patterns: WAN (solid), branch server (dotted), peer (hatched); WAN total and time as large labelled numbers; a link icon with its speed. "Changed" marks the totals and bars that changed with the last param.
- **Captions:**
  - hr: "Pedeset klijenata, svaki po 600 MB, preko veze od 10 Mbit/s: 30 GB i gotovo sedam sati. Problem nije zakrpa, nego to što svatko vuče svoju."
  - en: "Fifty clients, 600 MB each, over a 10 Mbit/s link: 30 GB and nearly seven hours. The problem isn't the patch, it's that everyone pulls their own copy."
  - hr: "S *express* datotekama (ekspresnim datotekama) klijent vuče samo razliku — ali poslužitelj mora čuvati četiri puta više."
  - en: "With express files the client pulls only the difference, but the server has to store four times as much."
- **Terms:** express installation files — ekspresne instalacijske datoteke; delta — razlika (delta); peer caching — dijeljenje među susjednim računalima (*peer caching*); background transfer — prijenos u pozadini; bandwidth throttling — ograničenje propusnosti; WAN link — WAN veza.
- **Misconceptions:** "express files save space everywhere" (they save the link, cost the server); "a branch server is always the answer" (peer caching may beat it); "a throttle makes updates cheaper" (same bytes, longer).
- **Out of scope:** content of the delta algorithm, QoS on the WAN, cloud update services in depth, multicast imaging.
- **Reuse from `win-wsus-flow` (soft dependency):** the HQ/branch topology and server objects; new: the byte and time arithmetic.
- **Note for the coordinator:** the catalogue concept says "delivery optimization peers at a branch". As far as I know (check), Delivery Optimization peering serves content from Microsoft's cloud update services, while WSUS clients download over BITS and get peer caching from BranchCache. The spec models a generic "peer cache" and names both in the explanation; confirm or change the catalogue wording. The task file's Class says explorer, consistent with the catalogue.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-wsus-delivery` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-wsus-delivery sims/win-wsus-delivery` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-wsus-delivery/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
