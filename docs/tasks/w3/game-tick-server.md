# game-tick-server: Authoritative tick server

| | |
|---|---|
| Task | `game-tick-server` (wave 3, Performance and capacity) |
| Catalogue entry | `perf-game-tick-server` in `docs/catalogue.md` §4.8 |
| Kind | build a new simulator |
| Folder | `sims/game-tick-server/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `distributed` / `performance` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **a fixed tick, server-side line of sight, why clients lag**.

The student: step ticks, move players, add latency.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.8.

## Sources

- `/home/rjasmin/projects/agentvsagent/engine.py`, `/home/rjasmin/projects/agentvsagent/spectator.html`
  - constants `TICK = 0.1`, `SHOOT_RANGE = 15`, `ACTION_COOLDOWN = 0.5`, `RESPAWN_DELAY = 5.0`;
    `line_of_sight` (Bresenham, endpoints excluded); `Match.shoot` (hit chance, damage); `Match.step` (what
    the tick actually does: hazards and match end)
  - `~/projects/agentvsagent/DESIGN.md` for the intended architecture *(not read)*
- Catalogue seed: agentvsagent

## Model and presets

- **Scene:** three panels on one time axis. **Server:** the authoritative grid map (walls, players A and B)
  with the tick counter (100 ms per tick). **Client A view** and **Client B view:** the same map as each
  client last received it, drawn with its age ("this picture is 150 ms old"). Input messages travel from
  clients to the server and snapshots back, on a timeline strip between the panels. A line-of-sight ray is
  drawn on the server map when a shot is evaluated.
- **State:** `{ tick, server: {players: {A: {x, y, hp, cooldownUntil}, B: {...}}, walls}, inbox: [{player,
  action, sentAt, arrivesAt}], clients: {A: {snapshotTick, view}, B: {...}}, rttMs: {A, B}, log: [] }`.
- **One step:** one server tick, in order: (1) collect every input that has arrived since the last tick,
  (2) apply them in arrival order (tie → player id), checking cooldown, walls and line of sight **on the
  server's state**, (3) advance timers, (4) send a snapshot; clients receive it RTT/2 later.
- **Rules:**
  1. The server is authoritative: only its state counts; clients only send inputs and draw snapshots
     (derived; standard client–server game architecture) (check).
  2. A fixed tick of 100 ms (agentvsagent `engine.py`: `TICK = 0.1`); inputs that arrive between ticks wait
     for the next tick (a model choice: agentvsagent itself applies actions when the request arrives and
     uses the tick only for timed effects; see the note).
  3. Line of sight is a Bresenham line between the two cells that must not pass through a wall, endpoints
     excluded (agentvsagent `line_of_sight`).
  4. A shot needs range ≤ 15 tiles and line of sight; hit chance = max(0.2, 1 − d / 22.5); damage =
     max(10, ⌊25 − 0.8 d⌋) (agentvsagent `shoot`, `SHOOT_RANGE = 15`). The sim uses a seeded random draw, or
     shows the chance and assumes a hit, so a preset replays identically.
  5. Move and shoot have a 0.5 s cooldown = 5 ticks (`ACTION_COOLDOWN = 0.5`).
  6. What a client sees is the server state RTT/2 old when it arrives; an action it sends lands RTT/2 later,
     plus up to one tick of waiting: input-to-result ≈ RTT + tick (derived).
- **Params:** `rttA`, `rttB` choice 0 / 100 / 300 ms (0); `tickMs` choice 50 / 100 / 200 (100); buttons per
  player: move N/S/E/W, shoot.
- **Presets** (map: a wall segment between A and B's corner; derived, checked by hand):
  1. `same-tick` — both players act with RTT 0: inputs applied in arrival order, ties by player id; the
     snapshot matches both clients' views.
  2. `behind-the-wall` — A (RTT 300) steps behind the wall on its screen; its move reaches the server 150 ms
     later; B (RTT 0) shoots at tick k, when the server still has A in the open: line of sight is clear on the
     server, **A is hit "behind the wall"**.
  3. `distance` — B shoots A at d = 5: chance 78 %, damage 21; at d = 12: chance 47 %, damage 15 (rule 4).
  4. `cooldown` — A shoots twice 200 ms apart: the second is rejected (cooldown until +500 ms = 5 ticks).
  5. `tick-rate` — the same as preset 2 at 50 ms and 200 ms ticks: the worst-case extra delay changes by one
     tick (derived).
- **Steps:** one per tick: presets 1, 3: 4; preset 2: 8; preset 4: 7; preset 5: 8.
- **Legend:** player (letter in a circle, team colour), wall (dark block), input message (small arrow up),
  snapshot (small arrow down), line of sight (dotted ray; blocked = crossed), snapshot age label. "Changed"
  marks players and HP changed in this tick.
- **Captions:**
  - hr: „Na zaslonu igrača A on je već iza zida, ali poslužitelj (*authoritative server*) još ne zna za taj
    korak: crta vidljivosti je slobodna i pogodak vrijedi."
  - en: "The move arrived 150 ms after it was made, waited 40 ms for the next tick, and only then counted."
- **Terms:** tick — takt (check); authoritative server — mjerodavni poslužitelj (check); line of sight —
  crta vidljivosti (check); latency / RTT — kašnjenje / vrijeme povratnog puta; snapshot — snimka stanja;
  cooldown — vrijeme hlađenja (check).
- **Misconceptions:** "what I see is what the server sees"; "a faster tick removes lag" (the network RTT
  stays); "the client decides whether a shot hit".
- **Out of scope:** client-side prediction and lag compensation (rewinding), interpolation, cheating and
  anti-cheat, matchmaking.
- **Note for the coordinator:** agentvsagent is not tick-authoritative for actions (it applies each HTTP
  action on arrival, rate-limited by the cooldown; the 100 ms tick drives hazards and match end). The spec
  models the classic tick-batched server the concept names and borrows only agentvsagent's map, LOS and
  combat numbers; confirm that is the intended concept (the task lists URM, where RTT and latency are taught).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh game-tick-server sims/game-tick-server` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/game-tick-server/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
