<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-netns-veth-bridge: notes

New stepper (task `docs/tasks/w3/lnx-netns-veth-bridge.md`, catalogue §4.4). Rules and expected numbers: `SPEC.md`.
No kit view fits (K2 draws nodes in a flat grid; this scene nests namespaces inside the host), so the page draws its
own scene in HTML and CSS.

## Decisions

- **Scene.** The command strip on top (who ran it, the command as typed, what it printed). Below, the host as a large
  box (root namespace): in its head `enp1s0` 192.168.122.57/24, with its cable out through the frame to the gateway
  192.168.122.1, a dashed card outside the box that says it knows only 192.168.122.0/24 (rule 8). Inside: the bridge
  `br0` as a bar across two columns; under it, per column, the host-side veth end (a stub up to the bar when it is
  `master br0`, else "not in a bridge"), a veth cable down to a namespace box (`ns1`, `ns2`; a rounded frame) with its
  interfaces, routes and, with the toggle, its ARP table. On the right, the host's own `lo`, `ip_forward`, the NAT rule,
  routes and ARP. At the bottom, the last ping: from, to, ✓ or ✗ with the stage, and where.
- **Reuse of `lnx-namespaces`:** the host-vs-namespace framing (the host box is "what the host sees", each namespace
  box "what a process in it sees"), the command strip, the inset changed mark and the caption helper (`rich`) are
  taken over as page code. No model code is shared: that model is about PID namespaces and processes; this one models
  interfaces, which it does not have. Nothing to promote from it, nothing to request.
- **Interfaces are objects in exactly one namespace** (rule 3): an interface is a row in one namespace's `links`, and
  moving it removes the row there and adds it in the target, down, without addresses or master. The veth peer pointer
  follows. Connected routes are derived from the interfaces that are up, never stored, so "the route appears with
  `up`" cannot drift.
- **Columns.** Pair *k* (veth pairs in creation order) and namespace *k* (in creation order) share column *k*; at least
  two columns, so the layout does not jump when ns2 arrives. A namespace not made yet is a dashed placeholder with its
  name (taken from the preset's last step). A pair whose ends are both still on the host is drawn as the two ends
  stacked with a short cable between them; the end that was moved away stays one step as a dotted, struck "moved to
  ns1" chip, so the task's caption ("it disappeared from the host's view") has something to point at.
- **The ping is two walks** (rule 9). The real walk is what the kernel does (what ping prints, what the ARP and MAC
  tables learn). The diagnosis walk passes down links and a host that does not forward, noting both; the stage is the
  first in rule 9's order among those found, else where the real packet stopped. So `forgot-up` reports "link down at
  veth2-br" although ping itself only sees an unanswered ARP (and prints `Destination Host Unreachable`).
- **Where the packet stopped** is a ✗ badge with the stage on the interface (or the namespace head for "no route", the
  gateway card for "no return path"); the interfaces on its path get a thick ring in `--c1`; the cable and stub between
  two path interfaces get the ring too. A reply gets ✓ on the target. Reduced motion: nothing moves anyway (badges pop
  in only on forward steps, and the kit turns that off).
- **The state word on an interface chip** is written only for "down" (dashed border, hollow port); up is the solid
  port and solid border. Writing "up" on every chip made the namespace boxes wrap at 1920×1080.
- **ARP and MAC tables** behind a toggle (task: `showArp`, default off), the MAC table on the bridge bar. Entries from
  a request and a reply are both shown as known MACs; a failed ARP shows `FAILED` (ip-neighbour(8) state).
- **Container engine steps** (`container-view`): one step per engine action, labelled "container engine" in a dashed
  side chip, with the equivalent commands listed in two columns in the output area. The strip's height is fixed per
  preset from the command and ping steps only; an engine step's strip is taller and the scene, which is smallest then,
  gives way.
- **Commands are the subject** (COMMON §1): `ip netns`, `ip link`, `ip addr`, `ip route`, `sysctl`, `nft`, `ping` are
  what NLA T06–T08 teach. No container engine, bridge front end or product is named; the engine preset says "container
  engine" and uses generic names (`c1`, `veth-c1`, `br0`, 172.17.0.0/16).

## Deviations from the task

- **`by-hand` is split in two** (the task's coordinator note allows it): written out with every `up`, the 14 commands
  are 18 and with 5 pings 23 steps, over the 20-step limit. `by-hand` (19) is L2, "two namespaces on a bridge", with
  three pings ns1 → ns2: link down (before `up`, an extra ping that shows rule 4 with the sender's own link), no ARP
  reply (before the bridge), reply. `to-the-world` (7) is L3 from where `by-hand` ends, with the task's other pings: no
  route, no return path (after the route and forwarding), reply (after masquerade). sim.json `steps` is 19.
- **The host ends are brought up before the bridge** (task: "fails before the bridge"), so the second ping fails at
  "no ARP reply" (two loose cables), not at "link down", which the first ping and `forgot-up` already show.
- **br0's address comes in `to-the-world`**: the L2 ping works without it, which is the point against "the bridge
  routes". The masquerade "rule" is the three `nft` commands it takes (table, chain, rule) in one step.
- **Steps beyond the task's scripts:** `forgot-up` is ping → `ip -br link show master br0` → `up` → ping;
  `forgot-forward` is ping → `sysctl net.ipv4.ip_forward` (reads 0) → `sysctl -w …=1` → ping; `container-view` is
  engine start → container c1 → container c2 → ping c1 → c2 → ping c1 → gateway → `ip -n c1 route`. Counts are the
  task's 4, 4, 6.
- **ping output is abbreviated**: no `PING …` header and no statistics header; times are illustrative (0.051 ms on the
  host, 0.412 ms via the gateway).

## Sources

- man pages network_namespaces(7), ip-netns(8), veth(4), ip-link(8), bridge(8), ip-route(8), ip-neighbour(8),
  nft(8); kernel `Documentation/networking/ip-sysctl.rst` (`ip_forward`, `arp_ignore`): from memory, not re-read online
  *(check)*.
- UL `14-mreza-na-sustavu.md`: `ip address` / `ip route` vocabulary, demosrv1 `enp1s0` 192.168.122.57/24 (its MAC
  52:54:00:dc:b4:80 from the link-local address there), `default via 192.168.122.1`. URM `02-gradja-mreze.md`:
  *premosnik* for the device. NLA `meta/toc.md` T06 („VLAN-ovi, mostovi i udruživanje sučelja"), T07 („Mrežni imenski
  prostori — ista tehnika koja nosi kontejnere"), T08 (`nftables`), T16 („Mreža kontejnera"); no chapters written yet.
- Unchecked against a lab *(check)*: the peer of a veth pair gets the lower ifindex (so `veth1-br@if4`); moving an
  interface drops its IPv4 addresses; a fresh namespace's `lo` has no address until up; `ip -br link` state and
  flags for a port and for a veth whose peer is down (`LOWERLAYERDOWN`, `NO-CARRIER`); with `ip_forward` 0 the packet
  is dropped without an ICMP error; `Destination Host Unreachable` with `+1 errors` after a failed ARP; the masquerade
  rule's `priority srcnat` keyword (nft 0.9.6 and later). If the host has `br_netfilter` loaded and a FORWARD policy of
  drop (as some container engines set), bridged traffic is filtered too; out of scope.
- Numbers: derived from the model and printed by a script before the page was written (SPEC.md "Presets"); asserted
  in `sim.test.js`.

## Checks

- `node --test sims/lnx-netns-veth-bridge/sim.test.js`: 40 tests, tie-breaks first (rule 9's order, two down links,
  a down link past a host that does not forward, longest prefix), one or more per rule, marks, every preset's numbers,
  then the template's generic block.
- `npm run gate -- lnx-netns-veth-bridge`: pass (manifest, tests, build, 64 browser checks, tokens, scope).
  Screenshots at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed; plus every step of every preset in
  both languages with the ARP toggle on, with a local Playwright script that also checks that nothing inside the host
  box is clipped. Fixed from them: the engine's seven commands made the strip too tall (now two columns, and engine
  steps size their own strip), a pair with both ends on the host wrapped with a dangling cable (now stacked), the
  host's column too narrow for its routes, "up" on every chip, the route legend repeating its arrow.

- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page, checked the model against
  Linux and ran 55 mutations of its own; 13 survived). Fixed from it: rule 9 sorted a later stage of the diagnosis walk
  ahead of "not forwarded" (now as SPEC says: a down link, else where the real packet stopped); `lo` and 127.0.0.0/8
  leaked across namespaces (ns1 pinging 127.0.0.1 got the host's `lo`; now its own `lo`, which must be up); a gateway
  with no route reported br0's address; a route already in the table (a connected one) was accepted twice; ARP
  learnt from a request is STALE; `linkdown` on a connected route without carrier; NAT only where the host forwards;
  tests for the 13 survivors (moving an interface after a ping and a static route, namespaces never forwarding,
  equal-length routes, the target learning the sender, a gateway behind a gateway, a missing namespace, own-address
  pings, reading `ip_forward` after setting it, NAT at the sender). Captions: the ping out "came in to the host at br0"
  (not "out through br0"); the goal "until a ping from ns1 to ns2 gets a reply"; "both host ends are now ports";
  `ip_forward` named in "0 by default"; *Masquerade* in italics in Croatian; "on the host" instead of "in root";
  "the routes ns1 ended up with" (the kernel added the connected one); the first mention of *gateway* moved into the
  start caption; Croatian „obavlja", „nositelja", „ni na što", „o pogrešci", „usmjereno", „port mosta"; "nftables in
  depth" in the explanation is "the packet filter in depth" (COMMON §1). After the fixes the same 55 mutations plus 4
  new ones: 56 of 59 fail a test; the three survivors are equivalent (the reply walk learns the bridge's MAC table
  again; the reply walk's down links are the request's).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| network namespace | mrežni imenski prostor (NLA T07) |
| bridge | most (NLA T06); URM uses *premosnik* for the device |
| veth pair | veth par |
| masquerade (address translation) | prevođenje adresa *(check)* |

From the glossary: `network interface`, `loopback`, `default route`, `gateway`, `forwarding`.

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute (reported by `lnx-namespaces` and
  `lnx-overlayfs-layers` too); worked around in the page.
- **kit.css:** an inset variant of `.sd-changed` (same as `lnx-namespaces` asked); worked around with a page rule.

## Time

Start 2026-11-03 19:34, done 20:12 (CET): about 38 minutes, one session, including the fresh review and its fixes.
