# port-multiplexing: Ports and sockets

| | |
|---|---|
| Task | `port-multiplexing` (wave 2b, Network fundamentals) |
| Catalogue entry | `net-port-multiplexing` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/port-multiplexing/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `tcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **the 5-tuple keeps many connections apart on one port 443**.

The student: open connections from several clients.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md` (Uvod u računalne mreže): "Zašto transportni sloj postoji: *portovi* i multipleksiranje", "Brojevi *portova*: rasponi i imenovana mjesta" (0–1023, 1024–49151, 49152–65535), "TCP: uspostava veze i trostruko rukovanje" (pair of sockets), Primjer 1 (tri programa, jedna adresa, tri porta), Primjer 2 (dvije kartice preglednika, isti poslužiteljski port)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch13-multipleksiranje-po-portu.svg` (numbers of Primjer 1: 52140, 52141, 53217)
- RFC 9293 §3.4.1 ("A connection is defined by a pair of sockets"), RFC 768 (UDP), RFC 1122 §4.1.1 (UDP = checksum + port multiplexing), RFC 6335 and the IANA Service Name and Transport Protocol Port Number Registry (ranges), RFC 9000 (QUIC over UDP)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, page 5 "TCP i UDP", card "multipleksiranje po portu"
- Catalogue seed: URM card ch13 (multiplexing)

## Model and presets

- **Scene:** clients on the left (one or more hosts, each with its programs or browser tabs as small
  boxes holding a socket label `IP:port`), the server 203.0.113.10 on the right with a **listening socket**
  `*:443 LISTEN` and, under it, the **connection table** (K4-style rule/table view): one row per connection
  with protocol, local IP:port, remote IP:port, the owning program, and a byte counter. A segment travelling
  between them carries its four address fields; on arrival the matching row lights up.
- **State:** `{ hosts: [{ip, procs: [{name, port}]}], server: {ip, listen: [{proto, port}]}, conns: [{proto,
  lip, lport, rip, rport, owner, bytes}], seg: {proto, sip, sport, dip, dport, flags}|null, nextEphemeral,
  event }`.
- **One step:** one event: a program opens a connection (OS picks a source port → SYN → server adds a row),
  or one data segment is sent and demultiplexed (match the row → deliver to its owner), or a reply goes
  back (ports swapped). Order on arrival: protocol → full 4-tuple match against the table → else the
  listening socket (new connection only with SYN) → else reject (RST for TCP, ICMP port unreachable for UDP).
- **Rules:**
  1. The transport header's 16-bit port says which process gets the data; the IP address only names the
     host (URM `13-transportni-sloj.md` "Zašto transportni sloj postoji: portovi i multipleksiranje").
  2. A TCP connection is defined by a **pair of sockets** (IP, port) — one per side; with the protocol that
     is the 5-tuple (RFC 9293 §3.4.1; URM ch13 "uspostava veze", Primjer 2).
  3. The client OS gives every new connection a free port from the dynamic range 49152–65535 (IANA, URM ch13
     "Brojevi portova"); Linux uses 32768–60999 by default (`net.ipv4.ip_local_port_range`, check).
  4. Replies swap the roles: source port 443, destination port the client's dynamic port (URM ch13 Primjer
     1).
  5. Tie-break on arrival: an exact 4-tuple match (established connection) wins over the listening socket;
     the listening socket only takes a SYN with no existing row (RFC 9293 §3.10.7, check section).
  6. Edge: two different hosts may use the same source port — the rows differ by source IP, so they stay
     two connections (derived from rule 2).
  7. Edge: if two connections had the identical pair of sockets they would be one connection (URM ch13
     Primjer 2, second question).
  8. The protocol is part of the key: TCP 443 and UDP 443 are different sockets (RFC 768; RFC 9000 QUIC
     runs on UDP 443).
- **Params:** `open` button "open a connection" (from the selected client, applies next step); `client`
  select of the preset's hosts/programs; `forcePort` choice auto | reuse 51000 (for preset 4); `view`
  choice server | client (which side's table is shown, default per preset).
- **Presets:**
  1. `three-programs` — URM ch13 Primjer 1, client view: 192.168.1.50 runs a browser (52140 → 443), SSH
     (52141 → 22) and a game (53217 → the game's port); three replies arrive at the same IP and are
     delivered by destination port. From URM ch13 Primjer 1.
  2. `two-tabs` — URM ch13 Primjer 2, server view: (192.168.1.50:51000, 203.0.113.10:443) and
     (192.168.1.50:51001, 203.0.113.10:443): three of four values equal, two rows, separate sequence
     numbers and windows. From URM ch13 Primjer 2.
  3. `many-clients` — four clients (192.168.1.50, .60, 198.51.100.7, 198.51.100.8) open five connections
     to :443, two of them both from source port 51000 on different hosts: five rows, one listening socket.
     Derived.
  4. `port-clash` — the OS reuses 51000 for tab 2: the SYN matches the existing row, so it is not a new
     connection (the page shows "the same pair = the same connection" and rejects it). From URM ch13
     Primjer 2 (second question); the exact TCP reaction is out of scope.
  5. `quic-too` — the browser opens TCP 443 and UDP 443 (HTTP/3) from 51002 and 51002: two rows, told apart
     only by the protocol. Derived from RFC 9000, unchecked.
- **Steps:** `three-programs` 9 (3 opens, 3 sends, 3 replies); `two-tabs` 6; `many-clients` 10; `port-clash`
  5; `quic-too` 5.
- **Legend:** listening socket (hollow), connection row (solid), client program (round), segment (arrow with
  four fields); "changed" marks the row created or matched in this step and the field that decided it.
- **Captions:**
  - hr: "Obje kartice idu na 203.0.113.10:443, ali s različitih *portova* (51000 i 51001). Par *socketa* se
    razlikuje u jednoj vrijednosti, pa su to dvije veze."
  - en: "The reply arrives at 192.168.1.50 with destination port 52141, so the OS hands it to the SSH
    client, not to the browser on 52140."
- **Terms:** port — *port* (URM keeps the English word; "priključak" is the physical connector); socket —
  *socket*; multiplexing / demultiplexing — multipleksiranje / demultipleksiranje; dynamic (ephemeral) port —
  dinamički *port*; well-known (system) port — sistemski *port*; listening — osluškivanje (URM ch15
  "osluškuje"); connection — veza.
- **Misconceptions:** a server can only serve one client per port; the IP address alone tells which
  program gets the data; "port" is a physical socket on the device (URM ch13 separates *port* and
  priključak).
- **Out of scope:** NAT/PAT rewriting ports (`urm-pat`); the handshake itself (`urm-tcp-handshake`);
  `SO_REUSEPORT` and accept queues; port exhaustion.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh port-multiplexing sims/port-multiplexing` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/port-multiplexing/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
