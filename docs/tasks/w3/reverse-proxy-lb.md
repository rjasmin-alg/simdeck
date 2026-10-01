# reverse-proxy-lb: Reverse proxy and load balancing

| | |
|---|---|
| Task | `reverse-proxy-lb` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-reverse-proxy-lb` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/reverse-proxy-lb/` |
| Class | explorer |
| Size | M |
| Priority | P2 |
| Courses | UL, NLA |
| Topic / tags / level | `internet` / `http` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `http-exchange` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **round robin vs least connections vs hash vs sticky; health checks**.

The student: add servers, fail one, change the algorithm.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/http-exchange/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/21-web-posluzitelji.md` (Uvod u Linux): "nginx: drugi oblik konfiguracije, i posao koji jedan poslužitelj obavlja za drugi" (definitions *posrednik*, *obrnuti proxy*, *pozadinski poslužitelj*; `proxy_pass`; 502 vs 504 with the three attempts), its "Šire o temi" (RFC 9110 on intermediaries used for load balancing), and **Primjer 7 — „aplikacija iza proxyja vraća 502, je li kriv proxy?"**. The book does not cover balancing algorithms.
- `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-21/` (reverse-proxy diagram)
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T54 "Raspodjela opterećenja — HAProxy, `keepalived`, VRRP" (Napredna Linux administracija; chapters not written yet)
- RFC 9110 §3.7 (intermediaries), §15.6.3 (502), §15.6.5 (504)
- HAProxy Configuration Manual: `balance`, `cookie`, `server` options `check`, `inter`, `fall`, `rise`; nginx documentation "ngx_http_upstream_module" (`least_conn`, `ip_hash`, `max_fails`, `fail_timeout`)
- Catalogue seed: UL ch21, NLA T54

## Model and presets

- **Scene:** clients c1–c3 on the left, a reverse proxy in the middle (shows the algorithm, each backend's open connections and health state), backends b1–b3 on the right (each with a busy bar and a health badge). A fixed request trace (r1…r9, one per second, each from a client in turn) is drawn as a strip under the scene; each request chip shows which backend served it or that it got 502.
- **State (explorer):** derived from params by replaying the fixed trace: `{ assignments: [{ req, t, client, backend|null, status }], perBackend: [{ id, count, maxOpen, up }], healthLog[] }`.
- **What the params drive live:** algorithm, backend count, a slow backend, a failing backend and the health-check settings; the strip and the per-backend counts recompute at once.
- **Rules:**
  1. The proxy is a server to the client and a client to the backend; the client never sees the backends (UL ch21, definitions *obrnuti proxy*, *pozadinski poslužitelj*; RFC 9110 §3.7).
  2. Round robin: next backend in order among those up (the usual default).
  3. Least connections: the backend with fewest open connections; tie → lowest index (a simplification: real balancers may break ties round robin; say so on the page).
  4. Source hash: backend = hash(client) mod (number of backends up); removing a backend remaps most clients (check).
  5. Sticky cookie: the first response sets a cookie naming the backend; later requests with it go to that backend while it is up.
  6. A connection refused by a backend becomes **502** at the proxy; a backend that answers too late becomes **504** (RFC 9110 §15.6.3, §15.6.5; UL ch21 Primjer 7).
  7. Active health check every `inter` seconds; a backend is marked down after `fall` consecutive failures and up again after `rise` successes; until marked down it still gets traffic (typical defaults: every 2 s, down after 3, up after 2, check).
  8. Request completion before assignment at the same instant (tie-break for counting open connections).
- **Params:** choice `algo` round-robin / least-connections / source-hash / sticky, default round-robin; range `backends` 2–4, default 3; toggle `slowB2` (b2 takes 5 s instead of 2 s), default off; range `failB2At` none/1–9 s, default none; range `inter` 1–5 s, default 2; range `fall` 1–5, default 3; range `rise` 1–5, default 2.
- **Presets** (derived from the rules, recompute in tests):
  1. `round-robin` — 3 backends, 9 requests: b1 r1 r4 r7, b2 r2 r5 r8, b3 r3 r6 r9 (3/3/3).
  2. `least-conn-slow` — b2 slow (5 s), others 2 s, least connections: b1 5 (r1 r3 r5 r7 r9), b2 2 (r2 r8), b3 2 (r4 r6); round robin would still give b2 three.
  3. `hash-remap` — source hash, c1→b1, c2→b2, c3→b3; with b2 removed two of three clients change backend.
  4. `health-check` — b2 fails at t = 4 s, checks every 2 s, fall 3: failing checks at 4, 6, 8 → marked down at 8 s; requests assigned to b2 between 4 and 8 s (r5, r8 under round robin) get 502; after that only b1/b3. From UL ch21 Primjer 7 (502 meaning); timing derived.
  5. `sticky` — c1 pinned to b1 by cookie; b1 fails → after it is marked down c1 is sent elsewhere and loses its server-side session (ties to `cookies-sessions`).
- **Steps:** none (explorer).
- **Legend:** request chips coloured by backend with the backend number printed on them, 502 chips crossed and hatched; health badges up/down with shape; "changed" marks chips whose assignment changed with the last param change.
- **Captions:** hr: "Najmanje veza: b2 je spor i drži veze otvorene, pa dobiva samo 2 od 9 zahtjeva; kružna raspodjela dala bi mu 3." en: "Least connections: b2 is slow and keeps connections open, so it gets only 2 of 9 requests; round robin would give it 3."
- **Terms:** *reverse proxy* — obrnuti proxy; *backend server* — pozadinski poslužitelj; *intermediary* — posrednik; *load balancer* — uravnotežitelj opterećenja; *health check* — provjera ispravnosti (check); *round robin* — kružna raspodjela (check); *sticky session* — vezana sjednica (check).
- **Misconceptions:** "502 means the proxy is broken" (the code names the role, the fault is behind it; UL ch21 Primjer 7); "round robin balances load" (it balances request counts); "a dead backend is removed at once".
- **Reuse from `http-exchange`:** status codes and the client/server role idea; new here are the algorithms and health state.
- **Out of scope:** VRRP/keepalived failover of the proxy itself (NLA T54's other half), TLS termination, consistent hashing, weights, connection queuing.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh reverse-proxy-lb sims/reverse-proxy-lb` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/reverse-proxy-lb/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
