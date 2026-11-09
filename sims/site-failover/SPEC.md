<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# site-failover: specification

Task `docs/tasks/w3/site-failover.md`, catalogue `dr-site-failover` (§4.6). One concept: **DNS / global load balancing
moves users; what does not follow (sessions, licences bound to a machine)**. A stepper: one step = the next event.

## Scene

Two sites, **A** (primary, `203.0.113.19`) and **B** (standby, `198.51.100.36`), one name
`chat.quillmoor.example` with an A record (TTL from the param), a health checker that probes A every
`checkInterval` seconds, and six users, each with a resolver cache (the address it holds and until when). Each site
runs the service's parts: app, sessions (in memory), data (replicated A → B with a lag), a licence server bound to
a host ID. A timeline under the scene shows the phases (rpo-rto's phase bars: detection, decision, caches expire;
copy back in a failback).

Addresses: A is the DR estate's `chat` record (`student/configs/public-dns/quillmoor.example.zone`, in HQ's
`203.0.113.16/29`); B is an address in the colo's `198.51.100.32/28` (`handbook/sites.md`), chosen here (derived).

## Time

Seconds from **t = 0**: the failure (failover) or A's return (failback). With `clockMin` ≥ 0 the page also shows the
clock (`clockMin` minutes after midnight at t = 0; S1: 14:05).

## Params

| Param | Values | Default | Notes |
|---|---|---|---|
| `ttl` | 60 / 300 / 3600 s | 300 | the DR public zone's `$TTL 300` |
| `checkInterval` | 10 / 30 s | 10 | |
| `threshold` | 1 / 3 | 3 | consecutive failed checks before the switch |
| `auto` | on / off | on | off: a person changes the record `decideMin` after the failure |
| `decideMin` | 5–120 min, step 5 | 30 | shown only with `auto` off |
| `licenceBound` | on / off | on | the licence server's licence is bound to A's host ID |
| `copyBack` | on / off | on | failback only: copy B's writes to A before the record moves back |
| `scenario` | `failover` / `failback` | `failover` | hidden; set by the presets |
| `clockMin` | −1 or 0–1439 | −1 | hidden; −1 = no clock |
| `lagS` | seconds | 5 | hidden; replication lag A → B (derived) |

## Users and their caches

Six users, ids 1–6. Each keeps using the service, so its resolver asks again **the moment** its cached answer
expires and caches the answer for `ttl` (RFC 1034 §3.6, RFC 1035 §3.2.1 / §7.3; UL ch19 „TTL zapisa",
„predmemorija") *(check sections)*. User i last asked `AGE[i]` seconds before t = 0, with
`AGE = [525, 120, 120, 1490, 525, 3570]` (derived), so at t = 0 its cache has
**remaining = ttl − (AGE mod ttl)** seconds (a remainder 0 means it asked exactly at t = 0 and holds a full `ttl`).
The ages are chosen so that with every TTL (60, 300, 3600) user 6's lookup falls 30 s after t = 0, i.e. on the
switch of the default run (the worst case), and users 1 = 5 and 2 = 3 share a time (the tie-break is visible).

## Rules

1. **A changed record reaches a user only when its cached answer expires** (RFC 1034 §3.6, RFC 1035 TTL; UL ch19)
   *(check)*. Until then the user sends requests to the address it holds: a dead site means a failed request.
   Worst case = **`ttl` after the change**.
2. **Automatic switch** (health-checked DNS / global load balancing): checks at t = k · `checkInterval`; the record is
   changed after `threshold` consecutive failed checks, at **Tc = `checkInterval` × `threshold`** (derived). With
   `auto` off, a person changes it at **Tc = `decideMin` × 60**; the checks still fail (an alert), nothing switches.
3. **User-visible outage** of user i = the second it first reaches B (from the failure). Total ≈ detection + decision
   + caches expire ≤ **Tc + `ttl`**: rpo-rto's RTO for this service. Phases: detection [0, `checkInterval` ×
   `threshold`], decision [that, Tc] (zero width when `auto`), caches expire [Tc, Tc + `ttl`].
4. **Sessions** live in memory at the site that made them: a user who moves to the other site has lost its session
   and logs in again (`relogins` + 1). Sessions never follow, in either direction.
5. **Data at B** is A's data as of `lagS` seconds before the failure: the writes of the last `lagS` seconds are lost
   (`db-replication` has the details).
6. **Licence bound to a host ID**: with `licenceBound`, the licence server's licence names A's machine; at B it does
   not start, so the licensed work stops there although B is up, until the licence is re-hosted (the estate:
   vendor rehost 5 working days, `inventory/licences.csv`). It works again when users are back at A. Without
   `licenceBound` (a licence that is not tied to a machine) it works at B.
7. **Fail back is a second failover**: B's writes must be copied to A **before** the record moves back (derived). With
   `copyBack`, B becomes read-only when A returns (first freeze, then copy) and stays read-only until the last user has
   left it, so nothing is lost; users still on B can read, not write. Without it, A serves its old data and every write made at B (since
   the failover, and by users still on B during the window) is lost. The users move back through their caches as in
   rule 1, and their sessions at B are lost (rule 4).
8. **Tie-breaks** (derived): users whose caches expire in the same step are listed and switched in **id order**; a
   lookup in the **same second** as the record change gets the **old** answer (the worst case: the change is
   published just after it).

## Events (one step each)

Failover: `fail` (t = 0, A down) → `check` × `threshold` (only when `auto`, at k · `checkInterval`) → `change`
(Tc: the record → B; B takes over: sessions empty, data as of −`lagS`, licence) → `window` × 4 → `summary`.

Failback (start: every user on B, A down, the record on B): `return` (t = 0, A up with its old data) → `copy`
(t = `COPY_S` = 60 s, derived: B, read-only since the return, has its writes copied to A; or "no copy", the bar's
phase `nocopy`) → `change` (t = 60: the record
→ A) → `window` × 4 → `summary`.

**Windows**: the k-th window step ends at **Tc + k · `ttl` / 4** (k = 1…4) and takes every cache that expires in
(previous end, this end] (end included). The last window ends at the worst case, Tc + `ttl`, so every user has moved
by then. Before the change, each step also applies the lookups that fall in its interval (they get the old address
again, marked "asked again").

Step counts: failover 1 + (`auto` ? `threshold` : 0) + 1 + 4 + 1 (default 10); failback 8 (the copy step stays when
`copyBack` is off, so the two runs line up step by step).

## State

`{ t, scenario, event: { code, k? }, sites: { A: { up, data, readOnly }, B: { … } }, record: { addr: 'A'|'B',
ttl, changedAt }, users: [{ id, addr, exp, session, relogins, movedAt, lostData }], health: { fails, threshold },
replicaLagS, licence: { boundTo: 'A', movable }, phase: 'normal'|'failed'|'switched'|'failback', switched: [ids],
renewed: [ids], tc, end, phases: [{ id, from, to }] }`. `data`: `current`, `replica` (B before the change: A's data
as of −lag), `old` (A back without B's writes), `none` (down). `lostData` (failback without copy): the user is on A,
whose data lacks the writes made at B.

## Presets and expected numbers (checked with a script before the code: NOTES.md; and by `sim.test.js`)

| # | id | Params | Change Tc | Users reach B (s) | Last / worst case | Steps |
|---|---|---|---|---|---|---|
| 1 | `auto-failover` | defaults | 30 s (3 × 10) | 1, 5: 75 · 2, 3: 180 · 4: 310 · 6: 330 | **330 s** / 330 s | 10 |
| 2 | `manual-dns` | `auto` off, clock 14:05 (S1) | 14:35 (30 min) | 4: 14:35:10 · 6: 14:35:30 · 1, 5: 14:36:15 · 2, 3: 14:38:00 | 14:38:00 / **14:40** | 7 |
| 3 | `long-ttl` | `ttl` 3600 | 30 s | 4: 2110 · 1, 5: 3075 · 2, 3: 3480 · 6: 3630 | 3630 s = **1 h after the change** | 10 |
| 4 | `licence-stays` | clock 14:05 (S1), `ttl` 60, `threshold` 1 | 10 s | 1, 5: 15 · 6: 30 · 2, 3: 60 · 4: 70 | 70 s; the licensed work stops at B (rehost 5 working days) | 8 |
| 5 | `failback` | scenario `failback` | 60 s (after the copy) | 1, 5: 75 · 2, 3: 180 · 4: 310 · 6: 330 (to A) | 330 s / 360 s; with `copyBack` off, B's writes are lost | 8 |

Preset 1: at the change user 4 still holds A for 280 s (asked again at 10 s), user 6 for 300 s (asked again at 30 s,
the same second as the change: tie-break). Every user logs in again (6 relogins); the licensed work does not start
at B. Window groups: [1, 5], [2, 3], [], [4, 6].
Preset 2: the decision takes 30 min (S1: the only admin is on leave; the public zone is hosted at the registrar and
changed by hand); the last user moves at 14:38, the worst case is 14:40. Windows: [1, 4, 5, 6], [], [2, 3], [].
Preset 3: windows [], [], [4], [1, 2, 3, 5, 6]: for 30 minutes after the change nobody has moved.
Preset 5: windows (ends 135, 210, 285, 360): [1, 5], [2, 3], [], [4, 6].

## Tie-breaks (tested first)

- A lookup at exactly Tc gets the old address (user 6 at 30 s in preset 1: holds A until 330).
- A cache that expires exactly at a window's end belongs to that window (user 6 at 330 = the 4th window's end).
- Users switched in one step are listed in id order, not in the order their caches expired (preset 2's first window:
  [1, 4, 5, 6], although 4 moves at 14:35:10, 6 at 14:35:30 and 1, 5 at 14:36:15).
- Remainder 0: a user who asked exactly at t = 0 holds a full `ttl` (and the old address, the record still says A).
