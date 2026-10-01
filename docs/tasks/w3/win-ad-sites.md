# win-ad-sites: Sites, site links and the KCC

| | |
|---|---|
| Task | `win-ad-sites` (wave 3, Active Directory) |
| Catalogue entry | `win-ad-sites` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-ad-sites/` |
| Class | explorer |
| Size | M |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `active-directory` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ad-replication` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **intra-site vs inter-site replication, cost and schedule; site-aware DC choice**.

The student: add sites and links, change a password, wait.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-ad-replication/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/topologydrafter/js/samples.js` (sample `two-sites`: AD multi-site with RODC)
- Catalogue seed: link-topologydrafter two-sites
- Microsoft Learn: "How Active Directory replication topology works" (KCC, ISTG, bridgeheads, site link cost and interval, bridging); "Active Directory replication concepts"; "Designing the site topology"
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/forest.txt` (estate: one site, no subnets defined)

## Model and presets

- **Scene:** K2 topology of sites as shaded zones holding DCs: `HQ` (DC01, DC02), `Branch` (RODC01) from topologydrafter `two-sites`, plus `Colo` (DC03) for a third site. Site links drawn between zones, labelled cost / interval; inside a site, the KCC's connection objects as thin arrows; between sites, bridgehead servers marked. A client per site. A clock and a "password change at HQ" button; a table of when each DC got the change.
- **State (explorer):** `{ sites: [{ id, dcs, subnets }], links: [{ a, b, cost, intervalMin }], bridging, change: null|{ at, site } }`. Derived: least-cost paths, bridgeheads, arrival time per DC, DC chosen per client.
- **Live:** params change costs, intervals, bridging and subnets; paths, the arrival table and the client's DC choice update at once.
- **Rules (Microsoft: "How Active Directory replication topology works"; "Active Directory replication concepts"):**
  1. Inside a site the KCC builds a bidirectional ring, with extra connections so no DC is more than 3 hops away; replication is triggered by change notification (15 s after the change, then 3 s between partners — Windows Server 2003+ defaults (check)).
  2. Between sites one bridgehead per site (chosen by the ISTG) replicates over site links on the link's schedule, polling every `intervalMin` (default 180, minimum 15); no change notification unless enabled on the link; traffic compressed.
  3. Site link defaults: cost 100, interval 180 min. The KCC uses the least total cost path. "Bridge all site links" (default on) makes links transitive, which matters when a site on the path has no DC: on → the two end sites get a direct connection over the bridged path; off → only directly linked sites with DCs replicate (check).
  4. Arrival time (worst case) = intra-site delay at the origin + Σ intervals along the chosen path + intra-site delay at the destination; the page shows worst case, not average.
  5. Tie-break for equal cost paths: fewer hops, then alphabetical site name (check: KCC's real tie-break).
  6. Site-aware DC choice: a client's IP is matched to a subnet object → site; the DC locator prefers DCs in that site; no matching subnet → any DC (estate `forest.txt`).
  7. Password changes are sent to the PDC emulator at once (not waiting for the schedule); a DC that gets a wrong password retries at the PDC, so a user with a fresh password can log on at a far site before replication arrives (links to `win-account-lockout` rule 2).
  8. A site with no DC is covered by a DC from the nearest site by link cost (automatic site coverage) (check).
- **Params:** `costHB` range 1–500 default 100; `costHC` range 1–500 default 100; `costBC` range 1–500 default 100; `intervalHB`, `intervalHC`, `intervalBC` range 15–360 step 15 default 180; `bridging` toggle default on; `subnets` toggle default on; `linkBC` toggle (does the Branch–Colo link exist) default off; `hqDcs` toggle (HQ has DCs) default on.
- **Presets (5):**
  - `two-sites` — HQ–Branch cost 100 / 180 min: password change at HQ reaches DC02 in ~15 s, RODC01 within 180 min (worst). From topologydrafter `two-sites`, timings derived.
  - `hub-spoke` — HQ–Branch 100/180, HQ–Colo 100/60, no Branch–Colo link: change at Branch reaches Colo via HQ in ≤ 240 min (180 + 60).
  - `cheap-detour` — direct Branch–Colo link cost 300 vs via HQ 100 + 100 = 200: the change takes the path via HQ (rule 3). Then `empty-middle` variant: remove HQ's DCs; with bridging on the KCC connects Branch and Colo across both links (cost 200), with bridging off and no direct link they never replicate (check). Derived, unchecked.
  - `no-subnets` — estate: one site, no subnets → branch client picks DC01 or RODC01 at random (`forest.txt`). From the DR estate.
  - `fresh-password` — ana changes her password at Branch, logs on at Colo 5 min later: the Colo DC still has the old one, retries at the PDC (HQ) → success. Derived, unchecked.
- **Steps:** 0 (explorer); the password change is a button that runs the clock.
- **Legend:** site (shaded zone), site link (thick line with cost/interval), connection object (thin arrow), bridgehead (star), subnet (label); "changed" highlight marks the path and arrival times that changed with the last param.
- **Captions:** hr: "Unutar lokacije promjena stiže za 15 s; preko *site link* (veza lokacija) troška 100 čeka raspored, do 180 minuta." en: "Inside a site a change arrives in 15 s; across a cost-100 site link it waits for the schedule, up to 180 minutes."
  hr: "Bez podmreža klijent u Branchu ne zna svoju lokaciju i dobiva bilo koji DC." en: "Without subnets the branch client doesn't know its site and gets any DC."
- **Terms (check):** site — lokacija; site link — veza lokacija; cost — trošak; replication interval — interval replikacije; bridgehead server — poslužitelj mosta; subnet — podmreža (URM ch09); change notification — obavijest o promjeni.
- **Misconceptions:** replication between sites is instant; cost is bandwidth; a client always uses the nearest DC.
- **Out of scope:** USN/UTD bookkeeping (`win-ad-replication`), SYSVOL/DFSR schedules (`win-sysvol-dfsr`), RODC password caching (`win-rodc`), ISTG election details.
- **Builds on `win-ad-replication`:** reuses its DC cards and packet animation; new are sites, links, costs, schedules and the locator choice.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-ad-sites` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-ad-sites sims/win-ad-sites` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ad-sites/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
