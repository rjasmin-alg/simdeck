# lnx-netns-veth-bridge: Namespaces, veth and a bridge

| | |
|---|---|
| Task | `lnx-netns-veth-bridge` (wave 3, Linux) |
| Catalogue entry | `lnx-netns-veth-bridge` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-netns-veth-bridge/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `containers` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lnx-namespaces` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **how container networking is wired by hand**.

The student: connect two namespaces step by step.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/lnx-namespaces/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T06–08 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T06–08
- NLA rows T06 ("VLAN-ovi, mostovi i udruživanje sučelja"), T07 ("Mrežni imenski prostori — ista tehnika koja nosi kontejnere"), T08 (`nftables`), T16 ("Mreža kontejnera") (no chapters yet; rules above are (check))
- network_namespaces(7), ip-netns(8), veth(4), ip-link(8), bridge(8), ip-route(8); kernel Documentation/networking/ip-sysctl.rst (`ip_forward`); nft(8) (`masquerade`)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/14-mreza-na-sustavu.md` (`ip address`, `ip route` vocabulary and the 192.168.122.0/24 lab addresses)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/02-gradja-mreze.md` (*premosnik*, RFC 1983 "Bridge")

## Model and presets

- **Reuses from `lnx-namespaces`:** the host-vs-namespace two-view layout and its "what this process sees" framing, limited here to the network namespace. New here: interfaces as objects that live in exactly one namespace, veth pairs, a bridge, routes, forwarding and NAT.
- **Scene:** a large host box (root namespace) with `enp1s0` 192.168.122.57/24 (the book's `demosrv1`) and gateway 192.168.122.1 outside; two smaller boxes `ns1` and `ns2` inside it, each listing its own interfaces (`lo`, later `eth0`), addresses, routes and ARP table; veth pairs drawn as a cable with two ends; the bridge `br0` as a bar the host-side ends plug into. Below: the command just run and a ping result line. Own drawing (no kit view named); the K2 packet dot can be reused if it exists.
- **State:** `{ netns: { root, ns1, ns2 }: { links: [{ name, kind: 'lo'|'phys'|'veth'|'bridge', up, addrs, master, peer }], routes: [...], arp: [...] }, ipForward: false, nat: false, cmdIndex, lastPing: { from, to, result, stage } }`.
- **One step:** one command from the preset script (`ip netns add`, `ip link add … type veth peer name …`, `ip link set … netns …`, `ip -n … addr add`, `ip -n … link set … up`, `ip link add br0 type bridge`, `ip link set … master br0`, `ip route add default via …`, `sysctl net.ipv4.ip_forward=1`, an nftables masquerade rule, or a `ping`). A `ping` step shows where the packet stops and why.
- **Rules:**
  1. Each network namespace has its own interfaces, addresses, routes, ARP/neighbour table and firewall; a new one contains only `lo`, and `lo` is down. (network_namespaces(7), ip-netns(8))
  2. A veth pair is two linked interfaces: what is sent into one end comes out of the other. Both ends start in the namespace where they were created. (veth(4))
  3. An interface belongs to exactly one namespace; `ip link set X netns ns1` removes it from the host's view (and its addresses are dropped, check). (ip-link(8))
  4. A link is down until `up`; a ping out of a down link fails ("Network is unreachable" or no reply). (ip-link(8))
  5. Same subnet: the sender ARPs for the target directly; the bridge forwards frames between its ports by learned MAC address, so `ns1` reaches `ns2` once both host ends are `master br0` and up. (bridge(8); URM ch02 *premosnik*)
  6. Off-subnet target: the namespace needs a route, here `default via 10.0.0.1` (the bridge's address); without it, "Network is unreachable". (ip-route(8); `lnx-routing-decision` route lookup)
  7. The host forwards between `br0` and `enp1s0` only with `net.ipv4.ip_forward=1`. (kernel Documentation/networking/ip-sysctl.rst, check)
  8. Replies from outside need a way back to 10.0.0.0/24: without source NAT (masquerade on `enp1s0`) the upstream router doesn't know that network, so the ping gets no reply. (nft(8) `masquerade`, check)
  9. Tie-break for ping diagnosis: report the first failing stage in this order: link down → no route → no ARP reply → not forwarded → no return path.
- **Params:** none beyond presets; `showArp` toggle, default off (shows neighbour tables).
- **Presets:**
  - `by-hand` — the full wiring, 14 commands: two namespaces; veth `veth1`/`veth1-br`, `veth2`/`veth2-br`; addresses 10.0.0.2/24 and 10.0.0.3/24; `br0` 10.0.0.1/24; ping ns1→ns2 fails before the bridge, succeeds after; ping ns1→192.168.122.1 fails before the route (no route), fails after route and forwarding (no return path), then succeeds after masquerade (5 pings in all; the no-forwarding stage is the `forgot-forward` preset). Derived, unchecked.
  - `forgot-up` — everything wired but `veth2-br` left down: ns1→ns2 fails at stage "link down". Derived, unchecked.
  - `forgot-forward` — route and NAT present, `ip_forward=0`: the packet reaches `br0` and stops. Derived, unchecked.
  - `container-view` — the same picture as a container engine builds it by default (a bridge, one veth pair per container, a private /16 and masquerade; generic labels, no engine named), to show the engine does rules 1–8 for you. Derived, unchecked.
- **Steps:** `by-hand` 19 (14 commands + 5 pings), `forgot-up` 4, `forgot-forward` 4, `container-view` 6.
- **Legend:** namespace (rounded frame), interface up (solid port) / down (hollow port), veth cable, bridge bar, route (arrow to gateway), packet (dot; reduced motion: static marker), failure point (× with stage label). "Changed" marks the interfaces, addresses or routes created or moved by this step.
- **Captions:**
  - HR: „`veth1` je premješten u `ns1`: iz pogleda domaćina je nestao. Isto sučelje u jednom trenutku pripada samo jednom imenskom prostoru.“
  - EN: "`veth1` was moved into `ns1`: it disappeared from the host's view. An interface belongs to exactly one namespace at a time."
- **Terms:** network namespace — mrežni imenski prostor (NLA toc T07); bridge — most (NLA toc T06; URM uses *premosnik* for the device); veth pair — veth par; interface — sučelje; default route — zadana ruta; address translation (masquerade) — prevođenje adresa (check); forwarding — prosljeđivanje.
- **Misconceptions:** a namespace "has" the network by default (it has only a down `lo`); the bridge routes (it switches frames); once ns1 pings ns2 the internet must work too (route, forwarding and NAT are three more steps).
- **Out of scope:** port publishing (DNAT; NLA T16), VLANs and bonding (T06), IPv6, CNI/netavark internals, nftables in depth (T08).
- **Note for coordinator:** M size and 19 steps in the main preset are at the limit; if it runs long, split `by-hand` into "L2: two namespaces on a bridge" and "L3: out to the world" presets rather than a second page.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-netns-veth-bridge sims/lnx-netns-veth-bridge` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-netns-veth-bridge/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
