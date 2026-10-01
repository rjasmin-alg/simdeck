# bgp-path-selection: BGP path selection

| | |
|---|---|
| Task | `bgp-path-selection` (wave 2b, Internet protocols) |
| Catalogue entry | `inet-bgp-path-selection` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/bgp-path-selection/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | NLA, URM |
| Topic / tags / level | `internet` / `bgp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **AS path, local preference, prefix propagation between ASes**.

The student: step announcements across a small internet.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T10 "BGP koliko treba sistemašu" (Napredna Linux administracija; chapters not written yet)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` (Uvod u računalne mreže): "Dinamičko usmjeravanje: kad tablicu gradi mreža sama" (BGP between autonomous systems, RFC 4271) and **Primjer 2: kad se u tablici podudara više puteva** (longest prefix match)
- RFC 4271 "A Border Gateway Protocol 4 (BGP-4)" §1, §5.1.2, §5.1.5, §9.1.1, §9.1.2, §9.1.2.2, §9.1.3; RFC 5398 (documentation ASNs); RFC 5737 (documentation prefixes)
- Catalogue seed: NLA T10 → §5.11

## Overlaps (catalogue §5)

- **§5.11 Routing protocols:** Separate pages on one graph view.

## Model and presets

- **Scene:** kit view K2 topology: five autonomous systems drawn as rounded boxes with their ASN (documentation numbers, RFC 5398): O = AS64496 originates 203.0.113.0/24; A = AS64497, B = AS64498, C = AS64499, D = AS64500 (the observer). Links O–A, O–B, A–C, B–C, B–D, C–D. Each AS shows its table for the prefix: every path it has learned (AS path, local preference, neighbour) with the best one marked. Announcements travel as labelled packets along links.
- **State:** `{ round, ases: { asn: { routerId, localPref: { neighbour: value }, rib: [{ path: [asn…], from, lp }], best|null } }, links: [{ a, b, up }], inFlight: [{ from, to, kind: 'announce'|'withdraw', path }], prepend: { asn: { towards, count } } }`.
- **One step:** one synchronous round: (1) every AS whose best path changed in the previous round sends it (with its own ASN prepended) or a withdrawal to each neighbour; (2) receivers drop paths that already contain their own ASN; (3) each receiver reruns the decision (rules 3–6) and marks its best. A round with no change ends the run ("converged").
- **Rules:**
  1. BGP routes between autonomous systems; an AS is a set of routers under one technical administration (RFC 4271 §1; URM ch11 "Dinamičko usmjeravanje").
  2. When a route is sent to an eBGP neighbour the sender prepends its own ASN to AS_PATH; a router drops a route whose AS_PATH contains its own ASN (loop prevention) (RFC 4271 §5.1.2, §9.1.2).
  3. Highest LOCAL_PREF first; LOCAL_PREF is set by the receiving AS and never sent to eBGP neighbours (RFC 4271 §5.1.5, §9.1.1).
  4. Then the shortest AS_PATH (RFC 4271 §9.1.2.2 a).
  5. Then lowest ORIGIN and MED (same neighbouring AS only); held equal in this model (RFC 4271 §9.1.2.2 b–c).
  6. Final tie-break: lowest BGP Identifier (router ID) of the advertising neighbour, then lowest peer address (RFC 4271 §9.1.2.2 f–g).
  7. A withdrawal removes the path; the AS falls back to its next-best stored path and tells its neighbours if its best changed (RFC 4271 §9.1.3, simplified: no timers, MRAI ignored).
  8. Forwarding uses the longest matching prefix in the resulting table (URM ch11 Primjer 2); this page has one prefix, so rule 8 matters only for `bgp-hijack`.
- **Params:** choice `dLocalPrefFromC` 100/200, default 100; toggle `linkOB` up/down, default up; range `prependOtoB` 0–3, default 0; each `resets: true` (the run restarts from round 0 with the new policy).
- **Presets** (topology derived, unchecked; outcomes follow from rules 2–6):
  1. `shortest-path` — all LP 100. D receives [64498 64496] from B and [64499 64497 64496] from C → best via B (2 hops). Converges after 3 rounds.
  2. `local-pref` — D sets LP 200 on routes from C: best via C although its path is longer; D's neighbours are not told about the LP (rule 3).
  3. `router-id-tie` — C hears [64497 64496] from A (router ID 192.0.2.1) and [64498 64496] from B (192.0.2.2): equal length, A wins on the lower router ID.
  4. `link-failure` — O–B goes down at round 4: B withdraws, D falls back to [64499 64497 64496] via C; B relearns the prefix via C or D. Converges after 3 more rounds.
  5. `prepending` — O prepends twice towards B ([64498 64496 64496 64496]): D now prefers via C ([64499 64497 64496], 3 hops vs 4).
- **Steps:** `shortest-path` 4; `local-pref` 4; `router-id-tie` 4; `link-failure` 7; `prepending` 4.
- **Legend:** AS boxes (series colour plus ASN label), announcement packet (solid arrow with the path written on it), withdrawal (dashed arrow with ✕), best path drawn thick; "changed" marks each AS whose best path changed this round.
- **Captions:** hr: "AS64500 ima dva puta: [64498 64496] od B i [64499 64497 64496] od C. Lokalna prednost je jednaka (100), pa odlučuje kraći AS put: preko B." en: "AS64500 has two paths: [64498 64496] from B and [64499 64497 64496] from C. Local preference is equal (100), so the shorter AS path wins: via B."
- **Terms:** *autonomous system* — autonomni sustav; *AS path* — AS put (check); *local preference* — lokalna prednost (check); *announcement / withdrawal* — najava / povlačenje (check); *prefix* — prefiks; *path selection* — odabir puta; *router ID* — identifikator usmjernika (check).
- **Misconceptions:** "BGP picks the fastest path" (it picks by policy, then AS-path length; no speed or load); "the AS path counts routers"; "my local preference tells others what to do".
- **Out of scope:** iBGP and route reflectors, MED in detail, communities, timers and MRAI, route flap damping, real-world policy (that is `peering-transit`), security (`bgp-hijack`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `bgp-path-selection` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh bgp-path-selection sims/bgp-path-selection` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/bgp-path-selection/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
