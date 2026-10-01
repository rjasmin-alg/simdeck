# bgp-hijack: BGP hijack and RPKI

| | |
|---|---|
| Task | `bgp-hijack` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-bgp-hijack` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/bgp-hijack/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | NLA, SEC |
| Topic / tags / level | `internet` / `bgp`, `attacks` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `bgp-path-selection` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **a more-specific prefix wins; route origin validation**.

The student: announce a hijack, then turn on ROV.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/bgp-path-selection/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course chapter covers hijacks or RPKI. Related: `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` "Usmjeravanje: kako paket pronalazi put kroz mrežu" (most specific match wins) and **Primjer 2: kad se u tablici podudara više puteva**; "Dinamičko usmjeravanje" (BGP, RFC 4271)
- RFC 4271 §9.1; RFC 6480 (RPKI architecture); RFC 6482 (ROA profile); RFC 6811 "BGP Prefix Origin Validation" §1, §2, §5; RFC 7908 (route-leak terminology, background)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** kit view K2 topology reused from `bgp-path-selection`: the legitimate origin AS64496 announcing 203.0.113.0/24, a misconfigured or malicious AS64511 announcing a conflicting route, and six other ASes. Each AS shows its forwarding choice for a test address 203.0.113.10 (towards the real origin or the false one) and, when origin validation is on, a validation badge per route (Valid / Invalid / NotFound). A ROA card shows what the prefix holder has published.
- **State:** `{ round, ases: { asn: { rib: [{ prefix, path, valid }], rov: bool, fwd: { dest, via } } }, roas: [{ prefix, maxLength, origin }], announcements: [{ origin, prefix }] }` (decision process copied from `bgp-path-selection`).
- **One step:** one propagation round as in `bgp-path-selection`, with origin validation (rule 4) applied before the decision at every AS that has it on; then each AS's forwarding for 203.0.113.10 is recomputed by longest prefix match.
- **Rules:**
  1. Path selection per AS as in `bgp-path-selection` (RFC 4271 §9.1).
  2. Forwarding uses the longest matching prefix, whatever its origin: a more-specific route wins over a shorter one for the addresses it covers (URM ch11 "Usmjeravanje", Primjer 2).
  3. A conflicting announcement of the **same** prefix wins only where its AS path is better, so it captures part of the Internet (rule 1); a **more-specific** announcement captures every AS that accepts it (rule 2).
  4. Route origin validation: a route is **Valid** if a ROA covers it with the same origin AS and its length ≤ maxLength; **Invalid** if some ROA covers it but none matches; **NotFound** if no ROA covers it (RFC 6811 §2; ROA content RFC 6482).
  5. An AS with validation on drops Invalid routes (local policy; RFC 6811 §5 leaves the action to the operator). An AS with it off keeps them, and traffic from validating ASes can still be drawn in if it passes through a non-validating one.
  6. Many networks do not accept IPv4 prefixes longer than /24 (check); the page says so, and the more-specific preset is drawn as an illustration of rule 2.
  7. Validation checks the origin only, not the whole path (RFC 6811 §1, check).
- **Params:** choice `conflict` none / same-prefix / more-specific, default none; toggle `roa` (203.0.113.0/24, maxLength 24, AS64496), default off; choice `rovDeployment` none / half / all, default none (`resets: true`).
- **Presets** (topology derived, unchecked):
  1. `normal` — only AS64496 announces /24: all eight ASes forward 203.0.113.10 to it.
  2. `same-prefix` — AS64511 also announces /24: the three ASes closer to it (shorter AS path) forward to AS64511, five stay correct.
  3. `more-specific` — AS64511 announces 203.0.113.0/25: every AS that accepts it forwards 203.0.113.10 to AS64511 (longest match), regardless of path length.
  4. `rov-all` — ROA published, all ASes validate: the /25 from AS64511 is Invalid (wrong origin and longer than maxLength) and dropped everywhere; all traffic returns to AS64496.
  5. `rov-half` — only half validate: validating ASes drop it, but one of them still reaches 203.0.113.10 through a non-validating neighbour that forwards to AS64511.
- **Steps:** `normal` 3; `same-prefix` 4; `more-specific` 4; `rov-all` 4; `rov-half` 5.
- **Legend:** origin ASes marked with a flag (real vs false, shape-distinguished), forwarding arrows coloured and labelled by destination, validation badges with text (V / I / NF), ROA card; "changed" marks ASes whose forwarding changed this round.
- **Captions:** hr: "AS64511 najavljuje 203.0.113.0/25. Za adresu 203.0.113.10 to je dulji prefiks od /24, pa ga svaki AS koji ga primi koristi, koliko god AS put bio dug." en: "AS64511 announces 203.0.113.0/25. For 203.0.113.10 that is a longer prefix than the /24, so every AS that accepts it uses it, however long its AS path."
- **Terms:** *route hijack* — otmica prefiksa (check); *more-specific prefix* — specifičniji prefiks (URM ch11 "najspecifičniji"); *longest prefix match* — najdulji podudarajući prefiks; *route origin authorisation (ROA)* — ovlaštenje izvorišta puta (check); *origin validation* — provjera izvorišta (check); *autonomous system* — autonomni sustav.
- **Misconceptions:** "BGP checks who owns a prefix" (without validation it does not); "a hijack needs a shorter path" (a more-specific prefix needs none); "turning on validation in my network protects everyone".
- **Reuse from `bgp-path-selection`:** the AS graph, rounds and decision process; new here are competing origins, longest-match forwarding per AS and the validation filter.
- **Out of scope:** any real incident or operator, path validation proposals (mentioned only as "check"), RPKI repository mechanics, prefix filtering lists, how such announcements are made.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh bgp-hijack sims/bgp-hijack` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/bgp-hijack/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
