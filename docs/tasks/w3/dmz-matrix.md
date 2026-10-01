# dmz-matrix: DMZ rule matrix

| | |
|---|---|
| Task | `dmz-matrix` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-dmz-matrix` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/dmz-matrix/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | URM, SEC |
| Topic / tags / level | `security` / `firewall` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `stateful-firewall` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **which zone may open what to which**.

The student: toggle rules between internet, DMZ and LAN.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.
5. `sims/stateful-firewall/` (the model this one builds on) and its `NOTES.md`.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md` (Uvod u računalne mreže) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch18-*.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 (the planned card: URM card ch18 (DMZ); extends urm-firewall)
- Catalogue seed: URM card ch18 (DMZ); extends urm-firewall
- URM ch18 „Vatrozid: filtriranje, segmentacija i ono što nije sigurnosna mjera", Što treba znati (DMZ, deny by default, NAT is not security; NIST SP 800-41 Rev. 1 §2.1, §3.1–3.2, §4 as quoted in footnotes `nist80041-*`) and Šire o temi (internal segmentation); Primjer 5 (stateful vs stateless).
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vatrozid.html` (the existing page this extends; DMZ explanation and question 3).
- `/home/rjasmin/projects/dr-lecture-estate/instructor/caveats.md` CV-44, CV-58, CV-59 (real mistakes for presets).

## Model and presets

- **Scene:** the book's figure: one firewall with three interfaces, Internet, DMZ (web server 203.0.113.10,
  mail server) and protected LAN (clients, file server, database). Beside it a 3×3 matrix "from → to" (diagonal
  greyed); each off-diagonal cell lists the allowed services as chips (K4 rule table once it exists). Below, a
  row of test connections, each shown allowed (solid arrow through the firewall) or dropped (arrow stopped at the
  firewall). Explorer.
- **State:** `{ cells: {'inet>dmz': ['tcp/443','tcp/25'], …}, stateful: true, tests: [{id, from, to, host,
  service, result, reason}], compromised: null|'dmz-web' }`; result reason is one of `cell-allow`,
  `default-deny`, `reply-of-tracked`, `no-rule-for-reply`.
- **Params drive live:** clicking a chip toggles that service in a cell; each change re-evaluates every test.
- **Rules:**
  1. Every packet between zones passes the firewall, DMZ ↔ LAN included; the DMZ is a third interface, not a hole
     or a bypass (URM ch18 „Vatrozid…", Što treba znati, and figure `fig:dmz-vatrozid`).
  2. Lookup: find the cell (source zone, destination zone); allowed if the service is listed there (order inside a
     cell does not matter: a cell is a set, unlike first-match ACLs; note the contrast with `rule-first-match`).
  3. Default deny: anything not listed is dropped, in both directions (URM ch18, NIST SP 800-41 Rev. 1 §4
     "deny by default").
  4. Stateful: replies to an allowed connection pass without a cell entry for the reverse direction; stateless:
     the reply needs its own entry (URM ch18 Primjer 5).
  5. Public servers sit in the DMZ so that their compromise does not give direct access to the protected side
     (URM ch18; `vatrozid.html` explanation); the `compromised` param starts tests from the DMZ web server.
  6. NAT is not a security function; the matrix has no NAT row (URM ch18, NIST SP 800-41 §3.2 as quoted).
  Tie-break: a test whose zones are equal (LAN → LAN) never crosses the firewall: shown as "not filtered here".
- **Params:** `stateful` toggle (on); `compromised` toggle (off); the nine cells' chips (service sets).
  Services offered: tcp/443, tcp/80, tcp/25, udp/53, tcp/22, tcp/3389, tcp/445, tcp/5432, udp/161, any.
- **Presets:**
  - `book` Internet → DMZ: 443, 25; LAN → Internet: 443, 53; LAN → DMZ: 22; DMZ → LAN: none. Tests: internet →
    web:443 allowed; internet → file server:445 dropped (default deny); client → internet:443 allowed and its
    reply passes (stateful). From URM ch18 (DMZ paragraph, Primjer 5); service choice derived.
  - `stateless` same cells, `stateful` off: the client's web reply is dropped until LAN ← Internet gets an entry
    for source port 443. From URM ch18 Primjer 5.
  - `web-compromised` attacker on the DMZ web server tries LAN:445 and LAN:3389 → dropped; DMZ → LAN db:5432
    allowed only if that chip is on. Derived.
  - `any-any` a "temporary" any rule Internet → LAN and SNMP udp/161 from anywhere (DR estate CV-58, CV-44):
    every test into the LAN passes. From DR `instructor/caveats.md` CV-58, CV-44.
  - `rdp-forward` Internet → LAN tcp/3389 to one PC (DR CV-59 internet-exposed RDP): one cell entry exposes the
    whole protected side to that service. From DR CV-59, outcome derived.
- **Steps:** explorer, 0.
- **Legend:** zone (box with its name), allowed service (filled chip), allowed test (solid arrow, check mark),
  dropped test (arrow ending at the firewall, cross), reply passed by state (dashed arrow), changed (kit highlight
  on the cell and on tests whose result changed).
- **Captions:** hr: "Internet → DMZ, tcp/443: dopušteno pravilom u ćeliji." / en: "Internet → DMZ, tcp/443:
  allowed by the cell's rule." — hr: "DMZ → LAN, tcp/445: nema pravila, odbij po zadanome." / en: "DMZ → LAN,
  tcp/445: no rule, deny by default."
- **Terms:** firewall — vatrozid; demilitarized zone — demilitarizirana zona (DMZ); protected network —
  zaštićena mreža; deny by default — odbij po zadanome; stateful inspection — filtriranje sa stanjem; stateless —
  bez stanja; access control list — lista kontrole pristupa (ACL); segmentation — segmentacija.
- **Misconceptions:** the DMZ sits outside or around the firewall; DMZ ↔ LAN traffic is unfiltered; NAT protects the
  LAN.
- **Out of scope:** first-match ordering (`rule-first-match`), NAT/port forwarding (`urm-nat`), IDS/WAF, IPv6.
- **Builds on `stateful-firewall`:** reuses its zone drawing and stateful/stateless reply rule; new are the
  zone-pair matrix, toggleable services and test connections.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `dmz-matrix` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh dmz-matrix sims/dmz-matrix` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dmz-matrix/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
