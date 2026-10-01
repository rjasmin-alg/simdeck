# site-failover: Site failover

| | |
|---|---|
| Task | `site-failover` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `dr-site-failover` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/site-failover/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | DR |
| Topic / tags / level | `storage` / `disaster-recovery`, `fault-tolerance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `rpo-rto` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **DNS/GSLB moves users; what doesn't follow (sessions, IP-bound licences)**.

The student: lose a site, fail over, fail back.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.
5. `sims/rpo-rto/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S1.md` (DR estate scenario)
- Catalogue seed: DR S1, S12, S14
- DR estate (student side only): `student/scenarios/S1.md`, `S12.md`, `S14.md` (cloud region outage);
  `student/configs/public-dns/quillmoor.example.zone` (`$TTL 300`, `chat`, `vpn`, `www`, hosted at the
  registrar); `student/inventory/licences.csv` (floating licences bound to `loom`'s MAC, rehost 5 working
  days); `student/handbook/sites.md` (sites and links)
- `~/projects/uvod-u-linux/book/chapters/19-dns.md` (TTL and caching) for the Croatian terms
- RFC 1034 and RFC 1035 (TTL, caching resolvers) *(check sections)*

## Model and presets

- **Scene:** two sites, **A** (primary) and **B** (standby), a DNS box with the service name and its record
  (`chat.quillmoor.example A 203.0.113.19`, TTL 300), a health checker, and a crowd of users (6 icons) each
  with a resolver cache showing which address it holds and for how long. At each site the service's parts:
  app, sessions (in memory), data (replicated A → B), and a **licence server bound to a host ID**.
  A timeline bar reuses `rpo-rto`'s phase bars (detection, decision, switch, caches expire).
- **State:** `{ t, sites: {A: {up}, B: {up}}, record: {addr, ttl, changedAt}, users: [{id, cachedAddr,
  expiresAt, session}], health: {fails, threshold}, replicaLagS, licence: {boundTo: 'A', movable: false},
  phase: 'normal'|'failed'|'switched'|'failback' }`.
- **One step:** advance to the next event: site A fails → health checks fail one by one → the record is
  changed to B → user caches expire one by one (TTL) → what works at B and what does not → later: fail back.
- **Rules:**
  1. Users reach the service by name; a changed record reaches a user only when its cached answer expires:
     worst case = TTL after the change (RFC 1034 §3.6 / RFC 1035 TTL; URM / UL ch19 on DNS caching) (check
     section).
  2. Automatic switching (health-checked DNS / global load balancing) changes the record after
     `threshold` consecutive failed checks: switch time ≈ interval × threshold (derived).
  3. Total user-visible outage ≈ detection + switch + TTL (worst case), RTO in the sense of `rpo-rto`.
  4. Sessions held in memory at A do not follow: every user logs in again at B.
  5. Data at B is A's data as of the replication lag; writes in the lag are lost (link `db-replication`).
  6. A licence or service bound to a host identity at A (MAC/host ID) does not start at B until it is
     re-hosted (DR `inventory/licences.csv`: a floating render licence bound to `loom`'s MAC, "vendor rehost 5 working days").
     The concept is generic: anything bound to an address or a machine stays behind.
  7. Fail back is a second failover: B's new data must be copied back to A **before** the record moves back,
     otherwise those writes are lost (derived).
  8. Tie-break: users whose caches expire in the same step are switched in id order (derived).
- **Params:** `ttl` choice 60 / 300 / 3600 s (300, the DR public zone's `$TTL`); `checkInterval` choice 10 /
  30 s (10); `threshold` choice 1 / 3 (3); `auto` toggle (on; off = a person changes the record after
  `decideMin`, default 30 min); `licenceBound` toggle (on).
- **Presets** (DR estate student material; times derived):
  1. `auto-failover` — A fails at 0 s; 3 failed checks → record changed at **30 s**; users switch as their
     caches expire, all on B by **330 s**; everyone logs in again (sessions lost); the render licence does not
     start at B.
  2. `manual-dns` — `auto` off (the DR public zone is hosted at the registrar and changed by hand): S1 at
     14:05, the only admin on leave (S1) → decision 30 min (derived) → switched at 14:35, all users by
     **14:40**.
  3. `long-ttl` — TTL 3600 s: some users keep the dead address for up to **1 h** after the change.
  4. `licence-stays` — S1: the licence server lives on `loom` at HQ, bound to its MAC: render nodes at the colo
     stop although the colo has power (S1: "The colo … have power and internet"); rehost takes 5 working days
     (`licences.csv`).
  5. `failback` — after preset 1, A returns: B's writes are copied back first, then the record moves back;
     skipping the copy loses everything written at B.
- **Steps:** `auto-failover` 10 (fail, 3 checks, change, 4 cache-expiry groups, summary); `manual-dns` 7;
  `long-ttl` 8; `licence-stays` 5; `failback` 6.
- **Legend:** site up / down (solid / crossed), user cache (pill with address and remaining TTL), session
  (key icon, lost = crossed), licence bound (lock icon), replication (arrow A → B). "Changed" marks users
  switched and records changed in this step.
- **Captions:**
  - hr: „Zapis je promijenjen u 30. sekundi, ali korisnik 4 ima ga u priručnoj memoriji (*cache*) još 280
    sekundi: dotad šalje zahtjeve mrtvoj lokaciji."
  - en: "The service is up at site B, but the licence it needs is bound to a machine at site A."
- **Terms:** failover — preuzimanje / prebacivanje na pričuvnu lokaciju (check); failback — povratak na
  primarnu lokaciju; TTL — TTL (vrijeme valjanosti zapisa, UL ch19 / URM); DNS record — DNS zapis; session —
  sesija; health check — provjera ispravnosti (check); host ID — identifikator stroja.
- **Misconceptions:** "changing DNS moves users instantly"; "if the servers come up at B, the service works";
  "failing back is just undoing the failover".
- **Out of scope:** anycast and BGP, load-balancer internals, database replication details
  (`db-replication`), the alert path (`alert-to-nobody`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `site-failover` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh site-failover sims/site-failover` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/site-failover/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
