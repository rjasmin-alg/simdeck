# win-dhcp-failover: DHCP failover

| | |
|---|---|
| Task | `win-dhcp-failover` (wave 3, DHCP on Windows Server) |
| Catalogue entry | `win-dhcp-failover` in `docs/catalogue.md` §4.5.4 |
| Kind | build a new simulator |
| Folder | `sims/win-dhcp-failover/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `dhcp`, `fault-tolerance` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-dhcp-scope-options` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **load balance vs hot standby, MCLT, partner down; the old 80/20 split scope**.

The student: fail a server, renew leases.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.4.
5. `sims/win-dhcp-scope-options/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "DHCP failover overview" / "Step-by-Step: Configure DHCP for Failover" (Windows Server 2012+: load balance, hot standby, MCLT default 1 hour, reserve 5 %, state switchover interval); "Add-DhcpServerv4Failover" (PowerShell `-LoadBalancePercent`, `-ReservePercent`, `-MaxClientLeadTime`, `-StateSwitchInterval`); "DHCP Best Practices" (80/20 split scope rule)
- IETF draft-ietf-dhc-failover-12, "DHCP Failover Protocol" (MCLT, states); RFC 3074 (DHC load balancing algorithm)

## Model and presets

- **Scene:** K1-style lanes: clients (a column of 6 named clients, plus a "new clients" counter), DHCP1, DHCP2, and the link between the servers (up/down). Each server shows its failover state (NORMAL, COMMUNICATION INTERRUPTED, PARTNER DOWN), its free pool (own / partner's) as a bar, and its lease table. A clock shows the time and the MCLT countdown.
- **State:** `t` (minutes), `mode: loadBalance|hotStandby|splitScope`, `range: { from, to }` (200 addresses), `share` (LB percent or HS reserve percent), `mclt` (min), `switchover` (min or null), `servers: [{ id, up, state, pool: { own, partner }, leases }]`, `link: up|down`, `clients: [{ mac, hashBucket, ip, server, expires }]`, `msgs`, `events` (scripted: server down, new clients arrive).
- **One step:** the next scripted event or timer: a server or link failure, a batch of DISCOVERs or renewals, the switchover timer, the MCLT expiry after PARTNER DOWN. Phases: (1) state changes; (2) client messages answered; (3) binding updates sent to the partner when the link is up.
- **Rules:**
  1. A failover relationship covers a scope on two servers; both hold the whole lease database and send each other binding updates (Microsoft, "DHCP failover overview" (check); IETF draft-ietf-dhc-failover-12).
  2. Load balance: each DISCOVER is hashed on the client's MAC (RFC 3074); only the server owning that bucket answers (50/50 by default). Both servers answer renewals of their own clients.
  3. Hot standby: the active server answers all clients; the standby holds a reserve (5% of the free addresses by default) and answers only when the active is unreachable (check default).
  4. MCLT (maximum client lead time, default 1 h): a server may give or extend a lease only up to MCLT beyond what its partner knows; in COMMUNICATION INTERRUPTED renewals by the survivor are for MCLT only (check).
  5. COMMUNICATION INTERRUPTED: the survivor can't tell a dead partner from a broken link. It renews every client (for MCLT) and gives new leases from its own pool only (LB: its half; HS: the standby's reserve).
  6. PARTNER DOWN is entered by the admin, or automatically after the state switchover interval if one is set (off by default; 60 min when enabled (check)). Then, after MCLT has passed, the survivor may use the whole pool.
  7. When the free pool a server may use is empty, new clients get no offer.
  8. Split scope (old 80/20 design): two independent servers, same subnet, non-overlapping ranges by exclusion (DHCP1 `.10–.169`, DHCP2 `.170–.209`); no shared database. A client of DHCP1 can't renew at DHCP2; at expiry it gets a new address from DHCP2's 40 or none (check whether DHCP2 NAKs or ignores the rebind).
  9. Tie-break: a client in REBINDING (broadcast) with both servers up is answered by its bucket owner (LB) or the active server (HS).
- **Params:** `mode` choice load balance / hot standby / 80/20 split (default load balance); `share` range LB 10–90 %, HS reserve 1–20 % (default 50 / 5); `mclt` choice 15 min / 1 h / 4 h (default 1 h); `switchover` choice off / 60 min (default off); `newClients` range 0–60 (default 6); button `fail DHCP1`; button `partner down`.
- **Presets:**
  1. `lb-normal` — derived, unchecked: LB 50/50, both up, 6 clients: hash buckets give 3 to each; every lease appears in both databases.
  2. `lb-interrupted` — derived, unchecked: DHCP1 fails at t = 0; at their T1 its 3 clients renew at DHCP2 (rebind broadcast), DHCP2 extends for 1 h (MCLT); 6 new clients get addresses from DHCP2's half (100 free).
  3. `lb-partner-down` — derived, unchecked: from 2, admin sets PARTNER DOWN at t = 30 min → at t = 90 min (30 + MCLT 60) DHCP2 may use DHCP1's half too.
  4. `hs-reserve-runs-out` — derived, unchecked: hot standby, 200-address range, 100 leased, reserve 5% of the 100 free = 5 addresses (whether the reserve is a share of free or of all addresses (check)); active fails; new clients 1–5 get addresses, 6th gets none until PARTNER DOWN + MCLT.
  5. `split-80-20` — derived, unchecked: DHCP1 (160 addresses, 60 clients) dies for 8 days; renewals fail, at expiry the 60 clients ask DHCP2 → 40 get addresses from `.170–.209`, 20 get none.
- **Steps:** lb-normal 6; lb-interrupted 9; lb-partner-down 6; hs-reserve-runs-out 9; split-80-20 8.
- **Legend:** server state badges NORMAL ● / COMM-INT ◐ / PARTNER DOWN ○ (with text); pool bars split own / partner (hatched); link line solid up / broken down; MCLT countdown ring; leases with a server tag. "Changed" marks the state badge, pool bar or lease that changed.
- **Captions:**
  - hr: "DHCP1 ne odgovara. DHCP2 ne zna je li partner mrtav ili je pukla veza, pa obnavlja tuđe *lease*-ove (dodjele) samo na MCLT — 1 sat."
  - en: "DHCP1 doesn't answer. DHCP2 can't tell a dead partner from a broken link, so it renews the partner's leases for MCLT only: 1 hour."
  - hr: "*Partner down* (partner ne radi) proglašen je u 0:30; nakon MCLT-a, u 1:30, DHCP2 smije dijeliti i adrese iz partnerova dijela."
  - en: "Partner down was declared at 0:30; after MCLT, at 1:30, DHCP2 may also hand out addresses from the partner's share."
- **Terms:** failover — preuzimanje u slučaju kvara (*failover*); load balance — raspodjela opterećenja; hot standby — vruća pričuva (*hot standby*); MCLT — najdulje vrijeme vođstva klijenta (MCLT, check term); partner down — partner ne radi; binding update — ažuriranje dodjele; split scope — podijeljeni opseg.
- **Misconceptions:** "with failover, the survivor takes over everything at once" (it waits: MCLT and PARTNER DOWN); "80/20 split scope is redundancy" (no shared state, renewals fail); "hot standby has no capacity limit when the primary dies" (only the reserve until PARTNER DOWN).
- **Out of scope:** DNS registration by both servers (`win-dhcp-dns-update`), shared secrets and message authentication, more than two servers, IPv6 (Windows failover is IPv4 only (check)).
- **Reuse from `win-dhcp-scope-options` (soft dependency):** the scope, range and lease objects; new: the failover relationship, states, pools, MCLT and the hash.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-dhcp-failover sims/win-dhcp-failover` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dhcp-failover/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
