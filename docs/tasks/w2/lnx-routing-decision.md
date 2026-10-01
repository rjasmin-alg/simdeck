# lnx-routing-decision: Address, route and resolver

| | |
|---|---|
| Task | `lnx-routing-decision` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-routing-decision` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-routing-decision/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `routing` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **the three things a host needs, and the route lookup**.

The student: break each one, see which command fails.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/14-mreza-na-sustavu.md` (Uvod u Linux): "Sučelje, adresa i ruta" (`ip -br addr`, `ip route`, `ip route get` with and without `via`; definitions *zadana ruta*, *pristupnik*), "Ime umjesto adrese: `/etc/hosts` i rezolver" (`hosts: files dns myhostname`, `/etc/resolv.conf`), "Dijagnostika: pitanje po pitanje" (the seven-rung ladder), "Primjer 2 — ime vodi na krivu adresu", "Primjer 3 — poslužitelj „ne odgovara""
- Diagram: `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-14/cetiri-podatka-i-tri-mjesta.svg` (four facts, three places)
- RFC 791 (name, address, route), RFC 4632 (CIDR prefix notation, longest match); ip-route(8) (`default` = `0/0`, metric, `route get`)
- LPM model: `urm-routing-table`, ported from `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/tablica-usmjeravanja.html`
- Catalogue seed: UL ch14 (cetiri-podatka-i-tri-mjesta.svg); urm-routing-table for LPM

## Model and presets

- **Scene:** the host `demosrv1` as a card with the three places from `cetiri-podatka-i-tri-mjesta.svg`: the
  interface `enp1s0` (address `192.168.122.57`, prefix `/24`), the kernel routing table (`ip route`, the default
  route via `192.168.122.1`), and the name files (`/etc/nsswitch.conf` `hosts:` line → `/etc/hosts` →
  `/etc/resolv.conf`). Right, a small topology (kit view K2 once it exists): the LAN `192.168.122.0/24` with
  `democli1` (`.186`) and the gateway (`.1`, also the DNS server), and beyond it `1.1.1.1` and `www.example.org` (modelled as `203.0.113.10`, RFC 5737).
  Bottom, the command being run and its output, and the routing table with the matching row highlighted.
- **State:** `{ iface: { name, admin: 'up'|'down', addr: null|{ ip, prefix } }, routes: [{ dst, prefix, via, dev,
  metric, proto }], nsswitch: ['files','dns','myhostname'], hosts: [{ ip, names }], resolv: { nameserver },
  dnsZone: { name: ip }, cmd, steps: [{ place, result }], out, exit, event }`.
- **One step:** one command from the preset script, evaluated in a fixed order of phases: (1) the name, if the
  command has one (rule 1); (2) the route lookup for the address (rules 2–5); (3) the packet to the next hop and
  back (rule 6). The first phase that fails ends the step and its place is marked; later phases stay grey.
- **Rules:**
  1. A name is resolved by the sources on the `hosts:` line of `/etc/nsswitch.conf`, in order, until one has a
     result: with `files dns`, a line in `/etc/hosts` answers before DNS is asked, silently (ch14 "Ime umjesto
     adrese…", Primjer 2). The DNS step itself needs a route to the `nameserver` from `/etc/resolv.conf`.
     `getent hosts` exit status 2 = not found (ch14 Primjer 2).
  2. Route lookup: of the routes whose prefix contains the destination, the longest prefix wins; `default` is
     `0/0` and matches everything with length 0 (ch14 "Sučelje, adresa i ruta"; RFC 4632; LPM as in
     `urm-routing-table`).
  3. Tie-break: equal prefix length → lowest `metric` (ip-route(8)) (check); equal metric → first in table order.
  4. A connected route (`proto kernel scope link`) exists only while the interface has an address in that prefix
     and is administratively up; removing the address or `ip link set down` removes it (check, ip-route(8)).
  5. On-link destination → no `via` (`ip route get 192.168.122.57` from democli1); off-link → `via` the gateway
     (`ip route get 1.1.1.1` → `via 192.168.122.1 dev enp1s0 src 192.168.122.57`) (ch14 "Sučelje, adresa i ruta").
     No matching route → `RTNETLINK answers: Network is unreachable` / `connect: Network is unreachable` (check).
  6. The source address is the interface's address (`src`); without an address there is nothing to send from.
  7. The ladder order (ch14 "Dijagnostika: pitanje po pitanje"): link → address → route → the other side. A "no"
     at a lower rung makes the higher ones meaningless; the caption says which rung failed.
- **Params:** `break` choice `none` / `address` / `route` / `resolver` / `hosts`, default `none` (live: the same
  command list re-evaluates at the current step); `target` choice `by-name` / `by-address`, default `by-name`.
- **Presets:**
  1. `healthy` (from ch14 "Sučelje, adresa i ruta"): `ip -br addr` (`192.168.122.57/24`) → `ip route` (2 rows) →
     `ip route get 1.1.1.1` (via `.1`) → `ip route get 192.168.122.57` on democli1 (no via) → `getent hosts demosrv1`
     → `ping -c1 1.1.1.1` ok. 6 steps.
  2. `stale-hosts` (from ch14 Primjer 2): `/etc/hosts` has `192.168.122.99 demosrv1`, order `files dns` → `ping
     192.168.122.57` ok → `getent hosts demosrv1` → `.99` (DNS never asked) → `ping demosrv1` no reply → `grep -n
     '^hosts' /etc/nsswitch.conf` → remove the line → `getent` → `.57`. 6 steps.
  3. `no-default` (derived, unchecked): default route deleted → `ping 192.168.122.1` ok (connected route) →
     `getent hosts www.example.org` ok (the DNS server is on-link) → `ping www.example.org` → Network is
     unreachable: the name was fine, the route was not. 4 steps.
  4. `no-address` (derived, unchecked): `ip addr del` → connected and default routes vanish → `ip route` empty →
     `ping 192.168.122.1` Network is unreachable → `getent hosts www.example.org` fails too (no route to the DNS
     server) → `getent hosts demosrv1` still works from `/etc/hosts`. 5 steps.
  5. `bad-resolver` (from ch14 Primjer 2, third place): `nameserver 192.168.122.250` → `ping 1.1.1.1` ok →
     `getent hosts www.example.org` exit 2 → fix in the NetworkManager profile (`ipv4.dns`), not the file
     (ch14 Primjer 2). 4 steps.
  6. `longest-prefix` (derived, unchecked): add `10.0.0.0/8 via 192.168.122.254` and `10.1.0.0/16 via
     192.168.122.253` → `ip route get 10.1.2.3` → `.253`; `10.2.0.1` → `.254`; `8.8.8.8` → default. 5 steps.
- **Steps:** 6, 6, 4, 5, 4, 5.
- **Legend:** the three places with icons (sučelje, ruta, ime); a tick or a cross per phase; the matching route
  row; "changed" highlight marks the place the preset broke and the row or line the last command read.
- **Captions:** hr: "Ime je razriješeno (`www.example.org` → `203.0.113.10`), ali *route lookup* (traženje
  rute) ne nalazi nijedan redak: bez zadane rute izvan vlastite mreže nema puta." en: "The name resolved, but
  the route lookup finds no row: without a default route there is no way out of the local network."
- **Terms:** network interface — mrežno sučelje; IP address — IP adresa; network prefix — mrežni prefiks;
  default route — zadana ruta; gateway — pristupnik; routing table — usmjerivačka tablica; name resolution —
  razrješavanje imena; resolver — rezolver.
- **Misconceptions:** "the network is down" is one fault; if `ping` by name fails the route is broken; editing
  `/etc/resolv.conf` by hand is a lasting fix.
- **Out of scope:** policy routing and multiple tables (`lnx-policy-routing`), IPv6, ARP, DHCP, firewalls and
  silent `ping` (ch14 Primjer 3), oper-state vs admin-state (shown as text only), how DNS resolves recursively
  (`inet-dns-resolution`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-routing-decision` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-routing-decision sims/lnx-routing-decision` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-routing-decision/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
