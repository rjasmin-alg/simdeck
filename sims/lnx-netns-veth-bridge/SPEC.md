<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-netns-veth-bridge: specification

One concept: **how container networking is wired by hand.** Task: `docs/tasks/w3/lnx-netns-veth-bridge.md`.
Sources: man pages network_namespaces(7), ip-netns(8), veth(4), ip-link(8), bridge(8), ip-route(8), ip-neighbour(8),
nft(8) (`masquerade`), kernel `Documentation/networking/ip-sysctl.rst` (`ip_forward`, `arp_ignore`); UL =
`~/projects/uvod-u-linux/book/chapters/14-mreza-na-sustavu.md` (`ip address`, `ip route`, demosrv1 192.168.122.57/24,
gateway 192.168.122.1, `enp1s0`); URM = `~/projects/uvod-u-racunalne-mreze/book/chapters/02-gradja-mreze.md`
(*premosnik*); NLA `meta/toc.md` T06, T07, T08, T16 (no chapters yet). Builds on `sims/lnx-namespaces/` (rule 7 there:
a new network namespace has only `lo`, down).

## State

`{ scene, netns: { root, ns1, ns2 | c1, c2 }: { links: [{ name, kind: 'lo'|'phys'|'veth'|'bridge', idx, mac, up,
addrs, master, peer: { ns, name }, end, fdb }], routes: [static { dst, via, dev, src }], arp: [{ ip, dev, mac, state
}] }, order: [namespace ids in creation order], ipForward, nat: [{ src, oif, notOif }], nextIdx, nextMac, cmd, out,
lastError, changed, gone, event, ping, lastPing }`.

- Connected routes are not stored: they are derived from the addresses of the interfaces that are up (rule 4).
- `fdb` (bridges only): the MAC table, `{ mac, port }` in learning order.
- `ping`: this step's ping, `{ from, to, ok, stage, at, trail, out }`; `lastPing` keeps the last one's result.
- `changed`: `ns:<id>`, `<ns>:link:<name>` (new, up/down, addresses, master, where its peer is), `<ns>:route:<dst>
  <dev>`, `<ns>:arp:<ip>`, `<ns>:fdb:<bridge>:<mac>`, `sys:forward`, `sys:nat`. `gone`: `{ <ns>: [{ name, to }] }`,
  interfaces that left that namespace in this step.
- Start (every preset, before its setup script): the host (root namespace) with `lo` (up, 127.0.0.1/8) and `enp1s0`
  (up, 192.168.122.57/24, MAC 52:54:00:dc:b4:80, UL ch14), `default via 192.168.122.1 dev enp1s0`, the gateway in its
  ARP table, `ip_forward` 0, no NAT rule. Outside: the gateway 192.168.122.1, which routes only 192.168.122.0/24.

## One step

One command from the preset's script, or a ping. Phases: (1) the command is shown as typed; (2) it is applied to the
state (commands print nothing unless noted); (3) a ping is followed hop by hop (rules 4–8) and its stage found
(rule 9); what the ping learnt goes into the ARP and MAC tables; (4) the rows that appeared or changed are marked,
interfaces that left a namespace are listed as gone for this step.

## Rules

1. **A network namespace has its own** interfaces, addresses, routes, ARP table and firewall. A new one contains only
   `lo`, and `lo` is down (no address until it is up: then 127.0.0.1/8). A ping to 127.0.0.0/8 or to one of the
   namespace's own addresses goes through its own `lo`: with `lo` down it is "link down" (`Network is unreachable`
   *(check)*); it never leaves the namespace, and nobody answers ARP for a loopback address. (network_namespaces(7),
   ip-netns(8).)
2. **A veth pair** is two linked interfaces: a frame sent into one end comes out of the other. Both ends start in the
   namespace where they were made (`peer name … netns X` puts the peer straight into X), both down. The peer is
   registered first, so it gets the lower interface index *(check)*. (veth(4).)
3. **An interface belongs to exactly one namespace.** `ip link set X netns ns1` removes it from the host's view, and it
   arrives down, without addresses, out of any bridge; routes and ARP entries through it in the old namespace go.
   (ip-link(8); addresses dropped *(check)*.)
4. **A link is down until `up`.** Only an interface that is up gets the connected route of its address; a frame is not
   sent out of, or received on, a down link. A ping out of a down link has no route: `ping: connect: Network is
   unreachable`. (ip-link(8).) A connected route on an interface that is up without carrier (its veth peer down) is
   listed with `linkdown`. A static route whose interface is down is not used; the kernel deletes it, the model only
   leaves it unused (no preset takes a link down again).
5. **Same subnet:** the sender asks by ARP for the target directly. A frame sent into a veth comes out of its peer; a
   frame arriving on a bridge port enters the bridge, which delivers it to its own interface and forwards it to its
   other ports (an ARP request is a broadcast, so it floods; the bridge learns the sender's MAC on the port it came in
   by, and the reply's MAC on the port it left by; the target's ARP table learns the sender from the request, as
   STALE, the sender's from the reply, as REACHABLE). Linux answers ARP for any of the namespace's own addresses on the
   interface the request came in (`arp_ignore` 0). So `ns1` reaches `ns2` once both host ends are `master br0` and
   both ends and the bridge are up. A bridge port needs no address; the bridge forwards frames, it does not route.
   (bridge(8); URM ch02 *premosnik*; ip-sysctl.rst `arp_ignore`.) STP is off by default, so a port forwards at once.
6. **Off-subnet target:** the namespace needs a route: `default via 10.0.0.1` (the bridge's address). The gateway must
   be on a connected subnet (else `Error: Nexthop has invalid gateway.`), and a route the table already has (connected
   ones included) is `RTNETLINK answers: File exists`. Without a route: `Network is unreachable`.
   Longest prefix wins; ties keep the table order. (ip-route(8).)
7. **The host forwards** between `br0` and `enp1s0` only with `net.ipv4.ip_forward=1`; with 0, a packet for someone
   else that reaches `br0` is dropped without an error. A namespace's own `ip_forward` stays 0 (it never forwards
   here). (ip-sysctl.rst *(check)*.)
8. **Replies from outside need a way back.** The gateway routes only 192.168.122.0/24, so a request with source
   10.0.0.2 gets no reply. Masquerade on the way out of `enp1s0` rewrites the source to 192.168.122.57; the reply comes
   to the host, which hands it back to `ns1`. A rule matches `ip saddr <net>` and `oifname "<if>"` (or `!= "<if>"`).
   (nft(8) `masquerade` *(check)*.) The rule is the host's (its own firewall, rule 1): it applies where the host
   forwards, never to a packet the host or a namespace sends itself. Inside the model a reply walks back the same way the request came, and must find a
   route too.
9. **Tie-break for the ping diagnosis:** the first failing stage in the order link down → no route → no ARP reply →
   not forwarded → no return path. Implemented as two walks: the real one (what ping prints, which tables learn) and
   one that treats down links as up, and walks past a host that does not forward, to note them. A down link on the
   path the packet would take wins (the first one on that path); otherwise the real walk's stage, where the packet
   stopped (on one path that is always the earliest of the rest).

## What ping prints (`ping -c 1`, abbreviated: no `PING` header or statistics header)

- reply: `64 bytes from <dst>: icmp_seq=1 ttl=<64 − routers on the way> time=0.051 ms` (0.412 ms through the gateway;
  illustrative), then `1 packets transmitted, 1 received, 0% packet loss`.
- no route at the sender (its link down included): `ping: connect: Network is unreachable`, nothing else.
- no ARP reply for the sender's next hop: `From <sender's address> icmp_seq=1 Destination Host Unreachable`, then
  `1 packets transmitted, 0 received, +1 errors, 100% packet loss`. A router that has no route reports `From <its
  address> icmp_seq=1 Destination Net Unreachable` (the gateway, for anything beyond 192.168.122.0/24).
- dropped later (not forwarded, no return path): `1 packets transmitted, 0 received, 100% packet loss`.

## Presets (step counts 19, 7, 4, 4, 6)

The task's `by-hand` (14 commands + 5 pings, L2 and L3 in one) runs to 23 steps with every `up` written out, so it is
split as the task's note allows: `by-hand` is L2 (two namespaces on a bridge), `to-the-world` is L3 (out to the world)
from where `by-hand` ends.

1. `by-hand` (19): `ip netns add ns1`, `ns2` → `ip link add veth1 type veth peer name veth1-br`, the same for `veth2`
   → `ip link set veth1 netns ns1` (the task's caption), `veth2 netns ns2` → `ip -n ns1 addr add 10.0.0.2/24 dev
   veth1`, `ns2 … 10.0.0.3/24 dev veth2` → **ping ns1 → 10.0.0.3: link down at `ns1:veth1`** (`Network is
   unreachable`) → `ip -n ns1 link set veth1 up`, `ns2 veth2`, `ip link set veth1-br up`, `veth2-br up` → **ping:
   no ARP reply at `root:veth1-br`** (`From 10.0.0.2 … Destination Host Unreachable`: the host ends are two loose
   cables) → `ip link add br0 type bridge` → `ip link set veth1-br master br0`, `veth2-br` → `ip link set br0 up`
   → **ping: reply, ttl 64**; ns1 learnt veth2's MAC, ns2 veth1's, br0 one MAC per port. br0 has no address.
2. `to-the-world` (7), from `by-hand`'s end (tables empty): **ping ns1 → 192.168.122.1: no route at `ns1`** →
   `ip addr add 10.0.0.1/24 dev br0` → `ip -n ns1 route add default via 10.0.0.1` → `sysctl -w
   net.ipv4.ip_forward=1` (prints `net.ipv4.ip_forward = 1`) → **ping: no return path at the gateway** (silent) →
   the masquerade rule (three `nft` commands: table, chain, rule `ip saddr 10.0.0.0/24 oifname "enp1s0" masquerade`) →
   **ping: reply, ttl 63**.
3. `forgot-up` (4), everything of `by-hand` but `veth2-br` never up: **ping ns1 → 10.0.0.3: link down at
   `root:veth2-br`** (ping itself prints `Destination Host Unreachable`) → `ip -br link show master br0` (`veth1-br@if4
   UP`, `veth2-br@if6 DOWN`) → `ip link set veth2-br up` → **ping: reply**.
4. `forgot-forward` (4), `by-hand` + br0's address, the route and the masquerade rule, `ip_forward` 0: **ping ns1 →
   192.168.122.1: not forwarded at `root:br0`** (silent) → `sysctl net.ipv4.ip_forward` (`= 0`) → `sysctl -w
   net.ipv4.ip_forward=1` → **ping: reply, ttl 63**.
5. `container-view` (6), what a container engine does by default, as one step per engine action with the equivalent
   commands listed: the engine starts (`br0` 172.17.0.1/16 up, `ip_forward=1`, masquerade `ip saddr 172.17.0.0/16
   oifname != "br0"`) → container `c1` (`ip netns add c1`; `ip link add veth-c1 type veth peer name eth0 netns c1`;
   `ip link set veth-c1 master br0 up`; `ip -n c1 addr add 172.17.0.2/16 dev eth0`; `lo` up; `eth0` up; `ip -n c1
   route add default via 172.17.0.1`) → container `c2` (the same, 172.17.0.3) → **ping c1 → 172.17.0.3: reply, ttl
   64** → **ping c1 → 192.168.122.1: reply, ttl 63** → `ip -n c1 route` (`default via 172.17.0.1 dev eth0`;
   `172.17.0.0/16 dev eth0 proto kernel scope link src 172.17.0.2`). No engine is named; the private /16 is
   illustrative.

MACs are handed out in creation order from a fixed list (veth1-br …:01, veth1 …:02, veth2-br …:03, veth2 …:04, br0
…:05); interface indexes from 3 (lo 1 and enp1s0 2 in the host; every namespace's lo is 1).

## Params

`scene` (hidden, set by the presets) and `showArp` (toggle, default off): shows the ARP tables of every namespace and
the bridge's MAC table. Page only; the model keeps the tables either way.
