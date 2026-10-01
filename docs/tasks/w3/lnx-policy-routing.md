# lnx-policy-routing: Policy routing

| | |
|---|---|
| Task | `lnx-policy-routing` (wave 3, Linux) |
| Catalogue entry | `lnx-policy-routing` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-policy-routing/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `routing` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-routing-decision` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **ip rule picks a table before the route lookup**.

The student: add rules and tables, send from two sources.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-routing-decision/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T05 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T05
- NLA row T05 ("Napredno usmjeravanje — više tablica, usmjeravanje po pravilu") (no chapter yet; rules above are (check))
- ip-rule(8) (RPDB, default rules 0/32766/32767, selectors, actions, priority), ip-route(8) (`table`, `show table`, `get`)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/14-mreza-na-sustavu.md` (`ip route`, `ip route get`, *zadana ruta*) and `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` (tablica usmjeravanja, longest prefix)
- RFC 5737 (documentation prefixes used for the addresses), RFC 2827 / BCP 38 (source filtering upstream)

## Model and presets

- **Reuses from `lnx-routing-decision`:** the route lookup itself (longest prefix match in one table, `ip route get` style answer: `via`, `dev`, `src`) and its topology drawing. New here: the rule list (RPDB) that runs **before** the lookup and picks which table to look in.
- **Scene (K2 topology):** a Linux router `rt1` with LAN `eth2` 192.168.10.1/24 (hosts `pc20` 192.168.10.20 and `pc30` 192.168.10.30), uplink `eth0` 203.0.113.10/24 to ISP-A (gw 203.0.113.1) and uplink `eth1` 198.51.100.10/24 to ISP-B (gw 198.51.100.1); a server on the internet 192.0.2.80 (RFC 5737 documentation prefixes throughout). Beside `rt1`: the `ip rule` list (priority, selector, action) and the tables `main` and `100` (`ispb`) as `ip route show table …`. A packet moves per step with its source and destination shown.
- **State:** `{ rules: [{ prio, from, to, iif, action: 'lookup'|'unreachable'|'blackhole', table }], tables: { local, main, 100, … }, packet: { src, dst, iif }, phase, ruleIdx, chosen: { table, route }, outcome, log }`.
- **One step:** one phase of one packet's decision: (1) walk the rules in priority order, testing the selector (one rule per step until a match); (2) longest prefix match in the chosen table; (3) if the table has no matching route, go back to (1) with the next rule; (4) forward via the route; the packet moves.
- **Rules:**
  1. The rule list is evaluated in ascending priority; the default list is `0: from all lookup local`, `32766: from all lookup main`, `32767: from all lookup default`. Every packet first matches rule 0 and, unless it is addressed to the router itself, finds no route in `local` and continues (rule 4). (ip-rule(8))
  2. A rule matches when all its selectors match (`from` source prefix, `to` destination prefix, `iif`, `fwmark`, …); its action is usually `lookup <table>`. (ip-rule(8))
  3. In the chosen table the longest matching prefix wins (as in `lnx-routing-decision`; URM ch11 *najdulji prefiks*). (ip-route(8))
  4. If the chosen table has no route for the destination, the lookup "fails" and evaluation continues with the next rule. (ip-rule(8), check wording)
  5. `unreachable`/`blackhole`/`prohibit` actions end the decision with that result. (ip-rule(8))
  6. Tie-break: rules with the same priority are tried in the order they were added; a rule added without a priority gets one below the first existing user rule (check ip-rule(8)).
  7. A reply leaving through the ISP whose address is not its source is dropped upstream (source filtering, BCP 38). (RFC 2827, check)
- **Params:** `source` choice `pc20` | `pc30` | `rt1 (198.51.100.10)`, default `pc20`; `dst` choice `192.0.2.80` | `192.168.10.20`, default `192.0.2.80`; `ruleFrom30` toggle (`ip rule add from 192.168.10.30 lookup 100 priority 1000`), default on; `lanInTable100` toggle (`192.168.10.0/24 dev eth2` also in table 100), default off; `replyRule` toggle (`from 198.51.100.10 lookup 100`), default off. All `resets: true`.
- **Presets:**
  - `two-sources` — main has `default via 203.0.113.1`, table 100 has `default via 198.51.100.1`, rule 1000 `from 192.168.10.30 lookup 100`: a packet from `pc20` matches only rule 32766 → main → ISP-A; from `pc30` matches rule 1000 → table 100 → ISP-B. Two packets. Derived, unchecked.
  - `lan-leak` — `pc30` sends to `pc20` (192.168.10.20): rule 1000 sends it to table 100, whose only route is the default → it leaves via ISP-B. Fix: add `192.168.10.0/24 dev eth2` to table 100 (toggle) → LPM picks the LAN route. Derived, unchecked.
  - `empty-table` — rule `from 192.168.10.20 lookup 200 priority 900`, table 200 empty: lookup fails, evaluation continues to rule 32766 → main. Derived from ip-rule(8), check.
  - `reply-path` — a client on the internet reaches `rt1` at 198.51.100.10 (ISP-B); without `replyRule` the reply follows main's default via ISP-A with source 198.51.100.10 and is dropped; with it, the reply leaves via ISP-B. Derived, unchecked.
  - `blackhole` — `ip rule add to 192.0.2.0/24 blackhole priority 500`: every packet to the server is dropped silently before any table. Derived, unchecked.
- **Steps:** per packet: rule tests until match (1–3) + lookup + forward. `two-sources` 8, `lan-leak` 10 (before and after the fix), `empty-table` 6, `reply-path` 10, `blackhole` 3.
- **Legend:** rule being tested (frame), matching rule (bold + check), skipped rule (dash), table looked up (frame), winning route (bold), packet (dot with src/dst; reduced motion: static), dropped (×). "Changed" marks the rule and route cells evaluated in this step.
- **Captions:**
  - HR: „Pravilo 1000 (`from 192.168.10.30`) odgovara, pa se ruta traži u tablici 100, a ne u `main`. Ondje je jedina ruta zadana, prema ISP-B.“
  - EN: "Rule 1000 (`from 192.168.10.30`) matches, so the route is looked up in table 100, not in `main`. Its only route is the default, towards ISP-B."
- **Terms:** policy routing — usmjeravanje po pravilu (NLA toc T05); routing table — tablica usmjeravanja; rule — pravilo; longest prefix match — najdulji prefiks (URM ch11); default route — zadana ruta; source address — izvorišna adresa; uplink — vanjska veza (check).
- **Misconceptions:** routing looks only at the destination; `ip route` shows "the" routing table (it shows `main`); a rule for a source catches only internet traffic (it catches everything from that source, LAN included).
- **Out of scope:** `fwmark` marking with nftables (one sentence), ECMP and multipath routes, VRFs, `rp_filter` details, IPv6.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-policy-routing` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-policy-routing sims/lnx-policy-routing` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-policy-routing/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
