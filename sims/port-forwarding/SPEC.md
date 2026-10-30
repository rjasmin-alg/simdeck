<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# port-forwarding: specification

Task `docs/tasks/w3/port-forwarding.md` (catalogue `net-port-forwarding`, §4.1, overlap §5.12). One concept:
**inbound connections to a server behind NAT**: without a row R drops a packet from outside; a port forward (a
static row the administrator writes) lets it in, rewriting the destination only. Model: `sim.js`; tests:
`sim.test.js`. Builds on `sims/nat` (the merged `nat`/`pat` page, URM ch. 11, Primjer 4).

## Scene

| Node | Kind (K2 mark) | Address | Source |
|---|---|---|---|
| `A` računalo / host | inside host (circle) | 192.168.1.10, port 51000 | URM ch. 11, Primjer 4 |
| `B` računalo / host | inside host (circle) | 192.168.1.11, port 51000 | Primjer 4 |
| `S` poslužitelj / server | inside host (circle) | 192.168.1.20, port 80 | task file |
| `R` usmjernik / router | router (square) | inside 192.168.1.1, outside 203.0.113.5 | Primjer 4 (outside); task file (inside) |
| `K` klijent / client | outside host (diamond) | 198.51.100.77, port 40000 | task file |
| `W` web poslužitelj / web server | outside host (diamond) | 198.51.100.10, port 443 | Primjer 4 |

192.168.1.0/24 is the LAN (RFC 1918); 203.0.113.0/24 and 198.51.100.0/24 are documentation blocks (RFC 5737). A, B
and S share the LAN (a bus in the drawing): a LAN host reaches an address of its own network directly and every
other address through R. K and W reach only R.

## Params

| Param | Values | Default | |
|---|---|---|---|
| `scene` | `book` / `mixed` / `outside` / `inside` | `book` | who sends (below); resets to step 0 |
| `forward` | toggle | off | adds the forward TCP 8080 → 192.168.1.20:80 |
| `proto` | `tcp` / `udp` | `tcp` | protocol of the packet sent to R's outside address (K's, or A's in `inside`) |
| `extPort` | `8080` / `61050` / `61000` | `61050` | the outside port that packet goes to |
| `hairpin` | toggle | off | NAT loopback: R also rewrites the source of a packet from inside to its outside address |

Scenes (each packet is walked hop by hop; "answered" means the receiver replies and the reply is walked too):

- `book`: A → W:443 from 51000, B → W:443 from 51000, then K:40000 → 203.0.113.5:`extPort` (not answered).
- `mixed`: starts with `book`'s two rows (61000 for A, 61001 for B); W:443 → 203.0.113.5:61000 (the reply to A), then
  K:40000 → 203.0.113.5:`extPort` (not answered).
- `outside`: K:40000 → 203.0.113.5:`extPort`, answered.
- `inside`: A:51000 → 203.0.113.5:`extPort`, answered.

## State

`{ phase, scene, hop, table, forwards, nextPort, next, total }`, plain JSON. `hop` is the hop of this step (null at
step 0): `{ from, to, came, opener, pkt, was, decision, drop, deliver, flow, answer, called, unexpected, table }`;
`pkt` is the packet on this wire, `was` the packet as it reached R (on a hop out of R), `decision` R's lookup (on a
hop out of R, or on the hop that R drops): `{ rule, row, fwd, out, table, compare, fwdCompare, port }`. `table` rows
are connections as R tracks them, `{ proto, by: 'out' | 'forward', fwd, orig: {proto, src, dst}, reply: {…} }`:
`orig` is the packet as the opener sent it, `reply` the answer as it will reach R. The page shows each row as the
book's table (inside, outside, remote; `viewOf`). `nextPort` is the port R would hand out next.

Naming against the task file: the task's `pat` and `conn` are one `table` here (a forwarded connection is a row too,
marked `by: 'forward'`, hatched on the page); `packet` is `hop.pkt`; the task's `chart` is not kept (the K2 drawing
and the caption carry the history of one step).

## One step

One packet moves one hop: host → R, R → host, or host → host on the LAN. When a packet reaches R, R decides at
once; the decision is shown on the hop out of R, or on the arriving hop when R drops it. An answer that reaches its
opener is checked: it must come from the address the opener called and go to the opener's own socket.

R's order (`classify`), every packet:

1. **A row of a known connection.** Rows are read top down; a packet equal to a row's `orig` or `reply` direction
   (protocol, source socket, destination socket) matches, and the first match decides. The packet becomes the other
   direction turned round (`orig` match → `reply` reversed, and back).
2. **A forward**, only for a packet to R's outside address: the first forward with the same protocol and outside
   port. The destination becomes the forward's target; the source stays (with `hairpin` and a packet from inside,
   it becomes 203.0.113.5 at the next free port). A row `by: 'forward'` is added.
3. **Otherwise drop**, for a packet to R's outside address.
4. **A new outbound connection** (from inside, to an address outside the LAN): the source becomes 203.0.113.5 at the
   next free port; a row `by: 'out'` is added.

## Rules (task file numbering)

1. Outbound, new connection: source → `203.0.113.5:61000`, then 61001, … (Primjer 4; `nat`'s `freePort` copied as is).
2. Inbound, matching a row (outside port **and** remote end): destination rewritten back (Primjer 4 (a): "R po tom
   paru (*port*, vanjsko odredište) pronađe redak"). The same outside port from another remote end is not that
   connection. (`nat` matches the outside port alone, as its fragment does; this page follows the book's sentence.)
3. Inbound, matching a forward (protocol and outside port): destination → forward's target; the source stays the
   client's, so S sees 198.51.100.77:40000; R records the connection (RFC 3022 §2 "static address maps for
   pre-selected hosts"; URM ch. 11 "NAT: kad više uređaja dijeli jednu adresu").
4. Inbound, no row and no forward: dropped silently (Primjer 4 (b), 203.0.113.5:61050).
5. S's answer: source 192.168.1.20:80 → 203.0.113.5:8080; destination (K) untouched (rule 1 of the order, `reply`
   direction).
6. A forward matches one protocol: UDP to 8080 does not use the TCP forward *(check against the router UI used in
   class)*.
7. Tie-break: a row of a known connection is read before the forwards (connection tracking before the destination
   rewrite of a new connection) *(check: netfilter's conntrack runs before nat PREROUTING, whose rules see only a
   connection's first packet)*. Dynamic allocation skips every forwarded outside port, of any protocol, so the two
   never collide. This is a simplification of the model *(derived)*: a real NAT reserves no ports for its forwards; it
   keeps each connection's tuple unique per protocol and often keeps the source port when it is free. A
   forward added later over a port a connection already holds loses to that connection's answers and takes the
   strangers.
8. A second forward with the same protocol and outside port is refused (one outside port names one inside socket);
   the same inside socket may have several forwards; a forward of the other protocol on the same port is another
   forward *(derived; the task says "two forwards on one outside port", per protocol here, consistent with rule 6)*.
   Model and tests only: the page has one forward toggle, so it cannot add a second; the explanation states it.
9. Hairpin: without NAT loopback S answers A directly (same LAN) from 192.168.1.20:80; A called 203.0.113.5:8080 and
   drops it. With `hairpin` R rewrites the source to 203.0.113.5:61000 (the next free port), S answers through R and
   R rewrites both fields back (RFC 4787 §6 REQ-9). Many home routers rewrite the source to their inside address
   (192.168.1.1) instead; the effect on the lesson is the same (the answer goes back through R).

Other tie-breaks: the lowest free port from 61000 (a freed hole first; `nat`); R reads rows top down and stops at
the first match. On a miss the page strikes the fields that differ from the nearer direction of the row; on a tie,
the direction sent to the packet's destination address (the way the packet travels).

## Expected numbers (checked by `sim.test.js` and a dump script before the page)

| Preset | Params | Steps | Hops and outcome |
|---|---|---|---|
| `book-no-forward` (default) | book, forward off, TCP, 61050 | 5 | A→R, R→W (61000, row 1), B→R, R→W (61001, row 2), K→R dropped |
| `add-forward` | outside, forward on, TCP, 8080 | 4 | K→R, R→S (dst 192.168.1.20:80, src 198.51.100.77:40000, row 1), S→R, R→K (src 203.0.113.5:8080) |
| `reply-vs-forward` | mixed, forward on, TCP, 8080 | 4 | W→R, R→A (row 1, dst 192.168.1.10:51000), K→R, R→S (forward 1, row 3) |
| `wrong-proto` | outside, forward on, UDP, 8080 | 1 | K→R dropped (forward 1: protocol ✕) |
| `hairpin` | inside, forward on, TCP, 8080, hairpin off | 3 | A→R, R→S (src stays 192.168.1.10:51000), S→A dropped by A |
| (hairpin on) | same, hairpin on | 4 | A→R, R→S (src 203.0.113.5:61000), S→R, R→A (src 203.0.113.5:8080, dst 192.168.1.10:51000) |

Every other combination stays between 1 and 6 steps (tested).
The default `extPort` is 61050, not the task's 8080, so the default equals preset 1 (NOTES.md, deviations). `book` with `extPort` 61000: K→R dropped, row 1 holds
61000 but for 198.51.100.10:443 (miss on the remote end).

## Out of scope

UPnP/PCP, CGNAT (→ `cgnat`), firewall rules on top (→ `stateful-firewall`), row timeouts, asymmetric return paths
(→ `asymmetric-path`), container port publishing (→ preset task `lnx-container-ports` on this folder: `classify` takes
the inside network as data, tested with 10.88.0.5).

## Container host (preset task `lnx-container-ports`, `docs/tasks/w3/lnx-container-ports.md`)

One concept: **`-p` is DNAT on the host.** The same rules as above with R as a Linux container host. Param
`container` (toggle, resets to step 0) switches the scene; `cscene` picks one of four. The router's params are ignored
and hidden while it is on. Model: `walkContainer` in `sim.js`, reusing `classify` and `addForward`; tests `C…` in
`sim.test.js`.

| Node | Kind (K2 mark) | Address | Source |
|---|---|---|---|
| `C` klijent / client | outside host (round, colour 5) | 203.0.113.7, port 51000 | task file |
| `H` domaćin / host (`host1`) | router (square) | outside 192.0.2.10 (eth0), bridge 10.88.0.1 | task file |
| `web` kontejner / container | inside host | 10.88.0.5, tcp/80 | task file |
| `web2` kontejner / container | inside host (port-taken only) | 10.88.0.6, tcp/80 | derived (the second container) |

10.88.0.0/16 is the container bridge (one example subnet, "the container bridge"); 192.0.2.0/24 and 203.0.113.0/24
are documentation blocks (RFC 5737). H's own request in `unpublished` leaves from 10.88.0.1:52000 (chosen).

A step is a publish command (`run -d [-p [addr:]hostPort:80] name`, shown on the packet card's place) or one packet one
hop, as in the router scenes.

Rules (task file numbering):

- **C1** Publishing writes one forward (a DNAT rule) by a step: `-p 8080:80` gives `tcp, any host address, 8080 →
  10.88.0.5:80`. Without `-p` no rule. *(check the wording against the engine's rule output; not opened here)*
- **C2** DNAT only, no source rewrite: web sees 203.0.113.7:51000; the reply's source is rewritten back to
  192.0.2.10:8080 by the connection's row (rule 5 above).
- **C3** Not published: the host reaches 10.88.0.5:80 directly over the bridge (no rule, no row); a packet from outside
  to 192.0.2.10:80 matches nothing (derived).
- **C4** A forward may be bound to one host address (`addr`); a packet to another address misses it (column struck).
- **C5** A publish whose protocol and host port clash with an existing forward is refused and the forwards stay as
  they were: a forward without `addr` holds the port on every address, so it clashes with any forward on that port;
  two forwards bound to different addresses do not clash (derived from bind semantics). *(check the error text: the
  page says it in words, "host port 8080 is already allocated")*
- **C6** The rule is read when the packet arrives (prerouting), before the host decides whether the packet is for
  itself, so a published port goes on to the container and is never refused. A packet to the host's own address that
  matches no row and no forward reaches the host's own stack; nothing listens on that port, so the host answers with a
  reset (RST, "connection refused"), where the router drops (RFC 9293 §3.10.7.1: a segment to a closed port gets a
  reset). Published ports therefore bypass a host firewall that filters only input (explanation only: the host
  models no input filter) *(derived; check)*.

Tie-breaks: a publish without an address and one bound to an address on the same port clash both ways (C5); the first
forward in the way is reported. On a miss at the host: refused on the container host, dropped on the router.

| Preset | `cscene` | Steps | Steps and outcome |
|---|---|---|---|
| `container-publish` | publish | 5 | run (rule 1), C→H (to 192.0.2.10:8080), H→web (dst 10.88.0.5:80, src stays 203.0.113.7:51000, row 1), web→H, H→C (src 192.0.2.10:8080) |
| `container-not-published` | unpublished | 5 | run (no rule), C→H (to 192.0.2.10:80), H→C RST, H→web (10.88.0.1:52000 → 10.88.0.5:80), web→H |
| `container-loopback` | loopback | 3 | run `-p 127.0.0.1:8080:80` (rule 1, addr 127.0.0.1), C→H (8080), H→C RST (address struck) |
| `container-port-taken` | taken | 4 | starts with web on 8080; run web2 8080 refused (rule 1 taken), run web2 8081 (rule 2), C→H (8081), H→web2 (10.88.0.6:80) |

Against the task: `publish` is 5 steps, not 7 (the host's hop granularity puts DNAT, forward and delivery on one hop
H→web; the caption names prerouting and the forward path); `loopback` is 3, not 5 (the host has no output-path DNAT,
so the task's second half is dropped as the task allows); `firewall-bypass` is not added (no input filter in the
host). Out of scope: rootless publishing (named in the explanation as the exception), a user-space proxy, IPv6, UDP,
random host ports, name resolution.
