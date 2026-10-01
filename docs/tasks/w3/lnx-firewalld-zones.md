# lnx-firewalld-zones: firewalld zones

| | |
|---|---|
| Task | `lnx-firewalld-zones` (wave 3, Linux) |
| Catalogue entry | `lnx-firewalld-zones` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-firewalld-zones/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `firewall` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-netfilter-path` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **a packet's zone comes from its source or interface**.

The student: send packets from different sources.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-netfilter-path/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md` (Uvod u Linux): "Vatrozid: zone, usluge i odluka o otvaranju porta" → "Što treba znati" (definitions *vatrozid*, *zona vatrozida*; `--get-active-zones`, `--list-all`, `target: default`, services vs ports, radna/trajna konfiguracija) and "Šire o temi" (`drop`/`block`/`trusted`/`public`, `--set-default-zone`); "Primjer 1 — usluga sluša, a izvana je nema" (`No route to host`, `--add-port=8991/tcp`)
- Diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-15/` (`tri-mjesta-koja-kazu-ne.svg`: the firewall as one of the three places that say no)
- firewalld documentation: firewalld.zones(5), firewalld.zone(5) (`target`, `source`, `interface`, `ingress-priority`), firewall-cmd(1) (check)
- Catalogue seed: UL ch15 → §5.16

## Overlaps (catalogue §5)

- **§5.16 Firewall zones:** One page, two presets; both pick a rule set by where the packet comes from.

## Model and presets

- **Scene:** host `demosrv1` with interfaces `enp1s0` (`192.168.122.57/24`) and, in one preset, `enp2s0`. Left,
  senders: `democli1` (`192.168.122.186`), an admin laptop (`192.168.122.20`), an outside host on `enp2s0`
  (`10.20.0.9`). Centre, the zone picker as a two-row rule table (kit view K4 once it exists): "source bindings"
  (zone ← prefix), then "interface bindings" (zone ← interface), then "default zone". Right, the chosen zone's
  `--list-all` card (`target`, `services`, `ports`) with the matching line highlighted, and the verdict with
  what the client prints.
- **State:** `{ zones: { name: { target: 'default'|'ACCEPT'|'DROP'|'REJECT', services: [], ports: [], sources: [],
  interfaces: [] } }, defaultZone, serviceDefs: { ssh: ['22/tcp'], cockpit: ['9090/tcp'], 'dhcpv6-client':
  ['546/udp'] }, packet: { src, iif, proto, dport, icmp }, phase, zone, verdict, clientOut, event }`.
- **One step:** a packet arrives (step a) → the zone is picked (step b, rules 1–3) → the zone's lists are checked
  and the verdict given (step c, rules 4–6). A configuration command (`--add-source`, `--add-port`,
  `--set-default-zone`) is its own step.
- **Rules:**
  1. Traffic enters one and only one zone; an interface or source belongs to exactly one zone, a zone may serve
     many (ch15 "Vatrozid: zone…", firewalld concepts as quoted there).
  2. Zone choice: a source binding that contains the packet's source wins; else the zone of the incoming
     interface; else the default zone (firewalld.zones(5); sources before interfaces at equal
     `ingress-priority`, (check) firewalld.zone(5) `ingress-priority`).
  3. Tie-break: two source zones with overlapping prefixes → lower `ingress-priority` first, then zone name
     (check); the same prefix in two zones is refused (`ZONE_CONFLICT`, (check)). An interface with no zone uses
     the default zone, and `--set-default-zone` moves everything that uses it, runtime and permanent at once
     (ch15 "Šire o temi").
  4. In the chosen zone, the packet is accepted if its port/protocol matches a listed `service` (expanded via
     `--info-service`, `ssh` → `22/tcp`) or a listed `port` (ch15 "Vatrozid: zone…").
  5. No match → the zone's `target`: `default` accepts ICMP and rejects the rest; `REJECT` (zone `block`) answers
     with a reject; `DROP` (zone `drop`) answers nothing; `ACCEPT` (zone `trusted`) accepts all (ch15
     "Vatrozid…" and "Šire o temi", zone descriptions).
  6. What the client sees: reject → `ssh: connect to host 192.168.122.57 port 8991: No route to host` (ch15
     Primjer 1); drop → a timeout; accept → the service answers.
- **Params:** `source` choice `192.168.122.186` / `192.168.122.20` / `10.20.0.9`, default `.186`; `dport` choice
  `22/tcp` / `8991/tcp` / `9090/tcp` / ICMP echo, default `8991/tcp` (live: re-run the current packet).
- **Presets:**
  1. `book` (from ch15 "Vatrozid: zone…" and Primjer 1): `enp1s0` in `public` (default); services `cockpit
     dhcpv6-client ssh`, ports `514/tcp`. Packet `22/tcp` from `.186` → `public` → accept (service `ssh`); `8991/tcp`
     → no match → target default → reject → "No route to host"; ICMP echo → accepted; `--add-port=8991/tcp` → the
     same packet is accepted. 10 steps.
  2. `by-source` (derived, unchecked): `--zone=trusted --add-source=192.168.122.20/32` → `8991/tcp` from `.20` →
     zone `trusted` → accept; the same packet from `.186` on the same interface → `public` → reject. 7 steps.
  3. `drop-vs-block` (derived from ch15 "Šire o temi"): `enp2s0` bound to `drop`, then to `block`: the `10.20.0.9`
     packet to `22/tcp` gets silence (timeout), then a reject. 7 steps.
  4. `default-zone` (from ch15 "Šire o temi", rule only; numbers derived): `enp2s0` without a zone → `public`
     (default) → `--set-default-zone=home` → the same packet is now judged by `home`; `enp1s0`, bound
     explicitly, does not move. 6 steps.
- **Steps:** 10, 7, 7, 6.
- **Legend:** binding kinds as row icons (izvor, sučelje, zadana); verdict shapes (✓ accept, ↩ reject, ∅ drop);
  "changed" highlight marks the binding row that decided the zone and the list line that decided the verdict.
- **Captions:** hr: "Paket s `192.168.122.20` ušao je kroz `enp1s0`, ali *source binding* (vezivanje izvorišne
  adrese) ima prednost: zona je `trusted`, ne `public`." en: "The packet from `192.168.122.20` came in on
  `enp1s0`, but the source binding takes precedence: the zone is `trusted`, not `public`."
- **Terms:** firewall — vatrozid; firewall zone — zona vatrozida; default zone — zadana zona; source address —
  izvorišna adresa; interface — sučelje; reject — odbiti (porukom); drop — odbaciti; runtime/permanent
  configuration — radna/trajna konfiguracija.
- **Misconceptions:** rules belong to interfaces; silence means the host is down (drop vs reject); a zone is a
  list of rules rather than a stance applied to everything bound to it.
- **Out of scope:** runtime vs permanent and `--reload` (mentioned in the explanation only; a separate concept),
  rich rules, forward/masquerade and policies between zones, ICMP blocks and inversion, `ufw`, the nftables
  underneath (`lnx-netfilter-path`).
- **Builds on `lnx-netfilter-path`:** reuse only the packet card and verdict vocabulary; the zone picker is new
  (firewalld's zones live in the `inet firewalld` table on the `input` hook, worth one line in the explanation).
- **Note for the coordinator:** §5.16 makes this page the host for `win-firewall-profiles` (one page, two
  presets). The Windows rule is different (a network profile is picked per network connection by location,
  not by packet source), so the model needs a "binding kind" field the Windows preset can set; decide whether
  `win-firewall-profiles` becomes a preset task on this folder.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-firewalld-zones sims/lnx-firewalld-zones` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-firewalld-zones/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
