# wifi-roaming: Roaming between APs

| | |
|---|---|
| Task | `wifi-roaming` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-wifi-roaming` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/wifi-roaming/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `wifi` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `wifi-association` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **the client, not the AP, decides when to roam; sticky clients**.

The student: walk a client across a floor plan.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/wifi-association/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md` (Uvod u računalne mreže): "WLAN i IEEE 802.11: arhitektura mreže i pridruživanje" → "Što treba znati" (BSS, distribucijski sustav, skeniranje pasivno/aktivno, pridruživanje) and → "Šire o temi" (the roaming paragraph: Reassociation Request to the new AP, the DS is updated, the old AP is notified; footnote `roam`, Diepstraten/Belanger IEEE P802.11-96/49C slides 33–34)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch17-bss-distribucijski-sustav.svg` and `ch17-pridruzivanje-koraci.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/06-fizicki-sloj.md`, "Kako signal nosi bitove" (slabljenje: signal weakens with distance)
- IEEE Std 802.11-2020: reassociation (clause 11.3), 802.11k neighbor report, 802.11v BSS Transition Management (clause 11.21.7), 802.11r fast BSS transition (clause 13) *(check clause numbers)*
- Apple Platform Deployment, "Wi-Fi roaming support in Apple devices" (roam trigger −70 dBm, candidate must be about 8 dB better) *(check values)*; Cisco "Enterprise Mobility Design Guide", voice coverage −67 dBm *(check)*
- Catalogue seed: URM ch17

## Model and presets

- **Scene:** a corridor floor plan 60 m long with three APs of one ESS (same SSID) on the same distribution system: AP-A at 0 m, AP-B at 30 m, AP-C at 60 m, all 3 m from the walking line. The client is a figure on the line at the `position` param. A thin line joins it to its current AP; dashed lines to the others. On the right, an RSSI chart along the corridor (three curves, the client's current AP drawn thick), the roam threshold as a horizontal line and the hysteresis as a band above the current AP's curve. Event log below: each roam with position and RSSIs.
- **State (derived, explorer):** `{ x, current: 'A'|'B'|'C', rssi: {A, B, C}, roams: [{x, from, to, reason: 'client'|'btm', rssiFrom, rssiTo}], quality }`. The page computes it by replaying the walk from 0 m to `position` in 1 m steps (pure and deterministic; the walk always goes left to right, so dragging the slider back recomputes from 0).
- **What the params drive live:** position moves the client; client type and the threshold/hysteresis sliders change where roams happen along the corridor, and the chart marks them.
- **Rules:**
  1. RSSI(d) = −40 − 30·log10(d) dBm, d = distance in metres (log-distance model, path-loss exponent 3, −40 dBm at 1 m) — derived teaching model, not measured. Signal weakens with distance (URM ch06 "slabljenje").
  2. The **client** decides (URM ch17 roaming paragraph: the station sends the Reassociation Request). At each 1 m step: if RSSI(current) < `trigger`, the client looks at the others and roams to the strongest one only if it is better than the current one by more than `delta` dB (strictly greater).
  3. Tie-break: equal RSSI never roams (strict comparison); two candidates with equal RSSI → the one with the lower letter (derived).
  4. The client starts associated to AP-A at 0 m (the full join is `wifi-association`); a roam is a reassociation: Reassociation Request → Response, the DS learns where the client is, the old AP is notified (URM ch17).
  5. The AP cannot move the client. With `btm` on, the current AP sends an 802.11v BSS Transition Management request when the client's RSSI < −75 dBm, naming the strongest neighbour; a `cooperative` client accepts if that neighbour is stronger, a `legacy` client ignores it (IEEE 802.11v *(check)*).
  6. If RSSI(current) < −90 dBm the client loses the AP and must scan and join again (logged as "veza prekinuta / link lost") *(check: value)*.
  7. Link quality bands for the client: ≥ −67 dBm good (voice-grade), −67 to −80 fair, < −80 poor (vendor design guides, *(check)*).
- **Params:** `position` range 0–60 m, step 1, default 0; `client` choice `default` (trigger −70, delta 8) | `sticky` (trigger −85, delta 8) | `custom`, default `default`; `trigger` range −90…−60 dBm, step 1 (visible for custom); `delta` range 0–20 dB, step 1 (custom); `btm` toggle (AP sends 802.11v request), default off; `support` choice `cooperative` | `legacy`, default `legacy` (visible when `btm` on).
- **Presets:** (numbers from the rule 1 model, computed; derived, unchecked against real devices)
  1. `default-walk` — default client, walk to 60 m: roams A→B at **20 m** (A −79.2, B −70.6 dBm; at 19 m B is only 6.8 dB better) and B→C at **50 m**. Ends on C.
  2. `sticky-client` — sticky client: stays on A past the middle and even standing under AP-B at 30 m (A −84.4, B −54.3 dBm); roams A→B only at **32 m** (A −85.2), then never leaves B: at 60 m it is still on B at −84.4 dBm with C at −54.3 dBm beside it.
  3. `no-hysteresis` — custom, trigger −70, delta 0: at 15 m A and B are exactly equal (−75.5) and the client stays (rule 3); roams at **16 m** and B→C at 46 m. Shows why a margin is used.
  4. `ap-asks` — sticky client, `btm` on, `support` legacy: nothing changes (still 32 m): the AP can only ask.
  5. `ap-asks-cooperative` — same with `support` cooperative: BTM request at 16 m (A −76.3 dBm), the client accepts and moves to B (−74.7); B→C at 46 m.
- **Steps:** none (explorer); the walk is replayed per position.
- **Legend:** AP-A/B/C (series colours c1–c3 plus letters), current association (solid thick line), other APs (dashed), roam threshold (danger dashed line), hysteresis band (hatched), roam event (◆ on the chart), BTM request (✉). "Changed" marks a roam that happened at the current position and the AP it went to.
- **Captions:**
  - hr: "Na 30 m klijent stoji ispod AP-B (−54 dBm), a i dalje je pridružen AP-A na −84 dBm: o prelasku odlučuje klijent, a njegov prag je −85 dBm."
  - en: "At 20 m AP-A has dropped to −79 dBm and AP-B is 8.6 dB stronger: the client sends a Reassociation Request to AP-B."
- **Terms:** roaming — prelazak između *access pointova* (*roaming*) *(check: the book uses the English term)*; reassociation — ponovno pridruživanje; association — pridruživanje; distribution system — distribucijski sustav; scanning — skeniranje; signal strength (RSSI) — jačina signala (RSSI) *(check)*; hysteresis — histereza; access point — *access point*.
- **Misconceptions:** (1) "The AP hands the client over, like a mobile network": in 802.11 the client decides (URM ch17). (2) "Full bars means a good link": the sticky client is still associated at −84 dBm. (3) "802.11v forces a roam": it is only a request.
- **Out of scope:** 802.11r key caching and timing; walls and floors (only distance); channel planning (`wifi-channels`); the association and 4-way handshake (`wifi-association`, `net-wpa-handshake`); AP-side "minimum RSSI" deauthentication (name it in the explanation only).
- **Builds on `wifi-association`:** reuse its party names (station / *access point* / DS), the Reassociation Request/Response message names and its event-log vocabulary; new are the RSSI model, the client's roam rule and the BTM request.
- **Note for the coordinator:** class is explorer but roaming has memory (hysteresis), so the state is a replay along the corridor; if that feels odd on stage, it could be a stepper with one step per 5 m (13 steps). The book has the reassociation mechanism but no thresholds; every number is vendor or derived.
<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `wifi-roaming` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh wifi-roaming sims/wifi-roaming` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/wifi-roaming/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
