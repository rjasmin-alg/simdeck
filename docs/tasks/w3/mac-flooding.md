# mac-flooding: MAC flooding and port security

| | |
|---|---|
| Task | `mac-flooding` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-mac-flooding` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/mac-flooding/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | URM, SEC |
| Topic / tags / level | `networks` / `switching`, `attacks` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `mac-table` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **a full CAM table turns a switch into a hub**.

The student: flood fake MACs, then enable port security.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/mac-table/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No course text on the attack itself. Learning, flooding and aging come from `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/07-podatkovni-sloj.md` (Uvod u računalne mreže): "Ethernet u preklopljenoj mreži: kako preklopnik radi iznutra" (tablica MAC adresa, preplavljivanje, 300 s aging) and Primjer 2 (preplavljivanje pogađa i onoga tko nema veze s razgovorom); diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch07-preklopnik-samoucenje.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/tablica-mac-adresa.html` (the page this extends; vocabulary)
- RFC 4188 (BRIDGE-MIB, `dot1dTpAgingTime`, default 300 s); IEEE 802.1Q (filtering database, learning)
- Cisco "Configuring Port Security" (maximum, violation modes protect/restrict/shutdown, err-disabled) (check: every number and default)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: extends urm-mac-table

## Model and presets

- **Scene:** one switch with four ports: A on port 1, B on port 2, attacker C on port 3, D on port 4 (A, B, C
  as in URM ch07 Primjer 2). Beside it the MAC address table (CAM) as rows `MAC | port | age`, with a capacity
  bar "n / capacity". A small per-port "who received a copy" strip under each host. Port-security panel for port
  3 when enabled. Rule-table view with the matching row highlighted (kit §7.2) for the CAM table.
- **State:** `{ cam: [{ mac, port, age }], capacity, clock (seconds), secure: { on, max, mode, learned: [mac],
  violations, errDisabled }, lastFrame: { src, dst, inPort }, copies: [port], events: [code] }`.
- **One step:** one scripted event: either a legitimate frame (A → B or B → A), an attacker burst of `burst` frames
  with random-looking source MACs (seeded, deterministic), or a time jump (aging). Phases per frame: (1) port
  security check on the ingress port, (2) learning the source MAC, (3) forwarding decision on the destination
  MAC, (4) copies delivered.
- **Rules:**
  1. Learning: on each frame the switch records (source MAC, ingress port) and resets that entry's age (URM ch07
     "Ethernet u preklopljenoj mreži").
  2. Forwarding: a known destination goes only to its port; an unknown destination is flooded to every port
     except the ingress port (ch07; Primjer 2).
  3. Aging: an entry with no frame from that MAC for 300 s is removed (default) (ch07, RFC 4188
     `dot1dTpAgingTime`). The attacker's burst keeps its fake entries fresh; quiet legitimate hosts age out.
  4. Full table: when `cam.length == capacity`, a new source MAC is not learned; existing entries stay until they
     age out (check: vendor behaviour, Cisco "MAC address table" docs). Frames to unlearned destinations are
     flooded by rule 2 — the switch now behaves like a hub for them and C sees A ↔ B traffic.
  5. Tie-break: if one burst would overflow the table, frames are learned in order until full; the rest are
     not learned (order = frame order in the burst).
  6. Port security (Cisco `switchport port-security`): at most `max` source MACs on the port (default 1); the
     first `max` seen are allowed (secure MACs). A frame from another source MAC is a violation, handled by
     `mode` (Cisco "Configuring Port Security" (check)):
     - `shutdown` (default): the port goes err-disabled; no further frames from it; violation counter +1.
     - `restrict`: the frame is dropped and not learned, counter +1, port stays up.
     - `protect`: the frame is dropped silently, counter unchanged.
  7. Port security is checked before learning (rule 1), so violating MACs never enter the CAM.
- **Params:** `capacity` range 4–16 default 8 (a teaching size; real switches hold thousands to hundreds of
  thousands of entries (check)); `burst` range 1–8 default 4; `secure` toggle default off; `max` range 1–4
  default 1; `mode` choice `shutdown` | `restrict` | `protect` default `shutdown`.
- **Presets:**
  1. `learning` — book baseline: C known on port 3; A → B floods to 2, 3, 4; B → A goes to 1 only; A → B now
     unicast. 3 steps. From URM ch07 Primjer 2 (+ D on port 4).
  2. `flood` — table holds A, B, C (3/8). Step 1: burst of 4 fakes → 7/8. Step 2: burst of 4 → 1 learned, 3 not
     (8/8, rule 5). Step 3: 300 s pass while C keeps sending: A, B and C's real MAC age out, the fakes are
     refreshed and new fakes take the 3 freed rows (8/8, all fake). Step 4: A → B: A not learned, B unknown →
     flooded, C on port 3 gets a copy. Step 5: B → A: also flooded. 5 steps. Derived, unchecked.
  3. `shutdown` — same as 2 with port security on port 3 (`max 1`, `shutdown`): C's real MAC is the secure MAC;
     the first fake MAC is a violation → port 3 err-disabled, counter 1; A → B stays unicast. 4 steps.
     Derived from Cisco port-security defaults (check).
  4. `restrict` — `mode restrict`: every fake frame dropped, counter = 4 after one burst, port 3 still up and C's
     real traffic still passes. 4 steps. Derived (check).
  5. `protect` — as 4 but counter stays 0: the attack is stopped and nobody is told. 4 steps. Derived (check).
- **Steps:** 3, 5, 4, 4, 4.
- **Legend:** legitimate MAC (colour 1, solid row), fake MAC (colour 2, hatched row), secure MAC (lock glyph),
  flooded copy (dashed arrow), unicast copy (solid arrow), err-disabled port (danger ✕). "Changed" marks the CAM
  rows added/removed/refreshed in this step and the ports that received a copy.
- **Captions:**
  - hr: "Korak 4: tablica MAC adresa je puna (8/8). B se ne može upisati, pa A-ov okvir za B preklopnik
    preplavljuje — kopiju dobiva i napadač C na priključku 3."
  - en: "Step 2: port security on port 3 allows one MAC. The second source MAC is a violation: the port is now
    err-disabled and the table is untouched."
- **Terms:** MAC address table — tablica MAC adresa; flooding — preplavljivanje; aging — starenje zapisa; port —
  priključak; port security — sigurnost priključka (check); violation — povreda (check); err-disabled —
  onemogućen zbog pogreške (check); MAC flooding attack — napad preplavljivanjem tablice MAC adresa (check).
- **Misconceptions:** a full table crashes the switch (it keeps forwarding, but floods); the attack is instant
  for existing entries (they stay until they age out); port security "blocks the attacker's MAC" (it limits the
  count per port, it does not know who is fake).
- **Out of scope:** sticky MACs, 802.1X, DHCP snooping/DAI (`dhcp-rogue`, `arp-spoofing`), VLAN hopping, real
  table sizes and hash collisions in CAM.
- **Builds on `mac-table`:** reuses its learning/flooding model, host names and table view; new are capacity,
  aging clock, attacker bursts and the port-security check.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `mac-flooding` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh mac-flooding sims/mac-flooding` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/mac-flooding/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
