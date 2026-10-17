<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# port-multiplexing: specification

One concept: **the 5-tuple keeps many connections apart on one port 443.** Clients on the left, servers on the right,
one segment travelling between them per step, and the receiver's socket table (kit view K4, first match) read top
down when it arrives: the matching row lights up and the owning program gets the data. The student opens more
connections from any of four clients and watches the table grow on one listening socket.

Task: `docs/tasks/w2/port-multiplexing.md`. Catalogue: `net-port-multiplexing` (`docs/catalogue.md` §4.1). Class:
stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[urm13]** URM book, `~/projects/uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md`:
  "Zašto transportni sloj postoji: *portovi* i multipleksiranje" (the *port* is a 16-bit field of the transport header
  that says which process the data belongs to; the IP address names the computer; *port* is not the physical
  priključak), "Brojevi *portova*: rasponi i imenovana mjesta" (0–1023 system, 1024–49151 user, 49152–65535 dynamic,
  "iz njih operacijski sustav uzima broj za privremenu upotrebu"), "TCP: uspostava veze" (lines 310–311: (IP, *port*)
  on one side is a *socket*; a connection is defined by a pair of them), **Primjer 1** (192.168.1.50; browser,
  terminal program and game; source ports 52140, 52141, 53217; servers on 443, 22 and the game author's number;
  replies swap the roles), **Primjer 2** (192.168.1.50 → 203.0.113.10:443 from 51000 and 51001: "tri od četiri
  vrijednosti se poklapaju", separate sequence numbers, windows and state; the same 51000 twice would be one pair,
  so one connection).
- **[fig13]** `~/projects/uvod-u-racunalne-mreze/assets/diagrams/ch13-multipleksiranje-po-portu.svg`: the numbers of
  Primjer 1 (52140, 52141, 53217; "poslužiteljski broj izvan registra" for the game).
- **[rfc9293]** RFC 9293 (local copy `~/projects/uvod-u-racunalne-mreze/references/chapter-13/rfc9293.txt`):
  §3.4.1 "A connection is defined by a pair of sockets."; glossary "port: The portion of a connection identifier
  used for demultiplexing connections at an endpoint"; §3.10.7.1 CLOSED (no TCB): "An incoming segment not containing
  a RST causes a RST to be sent in response"; §3.10.7.2 LISTEN: an ACK-bearing segment gets a RST, a SYN creates the
  connection ("If the listen was not fully specified … the unspecified fields should be filled in now").
- **[rfc1122]** RFC 1122 (local copy `…/references/chapter-04/rfc1122.txt`) §4.1.1 (UDP: "the only services it
  provides over IP are checksumming of data and multiplexing by port number"), §4.1.3.1 ("If a datagram arrives
  addressed to a UDP port for which there is no pending LISTEN call, UDP SHOULD send an ICMP Port Unreachable
  message").
- **[rfc6335]** RFC 6335 §6 (local copy `~/projects/uvod-u-linux/references/chapter-18/rfc6335.txt`): "the Dynamic
  Ports, also known as the Private or Ephemeral Ports, from 49152-65535 (never assigned)".
- **[rfc768]** RFC 768 (UDP: its own source and destination port fields).
- **[rfc9000]** RFC 9000 (QUIC runs over UDP). HTTP/3 on UDP 443 *(check: RFC 9114 not read; the task's statement)*.
- **[linux]** Linux `net.ipv4.ip_local_port_range` default `32768 60999` (read from `/proc` on this machine). Every
  port in the presets lies in 49152–60999, inside both ranges.
- **[rfc5737]** documentation addresses: 198.51.100.0/24 and 203.0.113.0/24; 192.168.1.0/24 is RFC 1918.

## Scene

- **Clients** (left): one card per host with its IP; inside, one round box per program (browser, a browser tab,
  SSH client, game) with its socket label `proto IP:port`, or "no connection yet". A program whose SYN was rejected
  shows its port struck with ✕.
- **Servers** (right): one card per server with its IP, its **listening sockets** (hollow, dashed: `TCP *:443
  LISTEN`, `UDP *:443`), and its program (round: web server, SSH server, game server).
- **The segment** (middle): an arrow (→ client to server, ← server to client) with protocol, source IP, source
  port, destination IP, destination port, flag (SYN / ACK / none for UDP) and payload bytes. The fields that decided
  the lookup carry the "changed" mark.
- **The socket table** (kit view K4, mode first) of the side chosen by `view`: columns protocol, local IP, local port,
  remote IP, remote port, segment (SYN for a listening TCP socket, any otherwise); the action column is the owning
  program; an extra column counts bytes. Rows: the connections (solid) in the order they were made, then the
  listening sockets (hollow). The implicit row: "no socket: RST (TCP) / ICMP port unreachable (UDP)". When the
  segment arrives at the side shown, the pointer stands on the deciding row, rows read before it show ✕ on the fields
  that differ, rows below are "not read". A row created in this step is marked "+ new".
- Hosts: 192.168.1.50 (c50), 192.168.1.60 (c60), 198.51.100.7 (c7), 198.51.100.8 (c8). Servers: web 203.0.113.10
  (TCP 443; in `quic-too` also UDP 443), SSH 203.0.113.22 (TCP 22), game 203.0.113.40 (TCP 41800).

## State

`{ scene, hosts: [{ id, ip, next, procs: [{ id, kind, tab, socks: [{ proto, port, conn, fail }] }] }], servers: [{ key,
ip, kind, listen: [{ proto, port }] }], conns: [{ id, proto, cip, cport, sip, sport, host, prog, skind, bytes }], seg:
{ proto, sip, sport, dip, dport, flag, bytes, dir } | null, look: { side, ip, read: [{ key, miss }], at, result, key,
conn, answer, decide } | null, event, changed }`.

A connection is stored once with both ends (client `cip:cport`, server `sip:sport`); each side's table is derived
from it (`tableOf`). This replaces the task's one-sided `conns` and `nextEphemeral` (one `next` per host: each OS
picks its own ports).

## Rules

1. **The port picks the process** [urm13 "Zašto…", rfc9293 glossary, rfc1122 §4.1.1]. The destination IP only
   brings the segment to the host; the receiver's table lookup uses the ports, and the row it finds names the owning
   program, which gets the data (its byte counter grows).
2. **A connection is a pair of sockets; with the protocol, the 5-tuple** [rfc9293 §3.4.1, urm13 Primjer 2]. A row
   matches when protocol, local IP, local port, remote IP and remote port are all equal (a `*` in a listening row
   matches anything).
3. **The client OS gives every new connection a free port from the dynamic range** [rfc6335, urm13 "Brojevi
   portova"]. The scripted opens use the book's numbers; an open without one (the student's, `port-clash` tab 2) gets
   the host's next free port after the last one it used, per protocol, wrapping at 65535 to 49152; a fresh host starts
   at 49152. *(Linux starts from a hashed offset in 32768–60999 [linux]; the model's sequential pick keeps the demo
   deterministic.)*
4. **Replies swap the roles** [urm13 Primjer 1]: source = the server's IP and port (443, 22, 41800), destination = the
   client's IP and dynamic port.
5. **Order on arrival, and the tie-break** [rfc9293 §3.10.7]: protocol and full 4-tuple against the connections
   first; only if none matches, the listening sockets; else reject. **An exact match on an established connection
   wins over the listening socket** (the connections are above the listening rows, and first match decides). A
   listening TCP socket takes only a SYN.
6. **Same source port on different hosts** (from rule 2): 192.168.1.50:51000 and 192.168.1.60:51000 to
   203.0.113.10:443 are two rows; the remote IP tells them apart.
7. **The identical pair is the same connection** [urm13 Primjer 2, second question]: a SYN whose 5-tuple equals an
   existing row matches that row (rule 5), so it is not a new connection: no row is added, the attempt is rejected
   and its program has no connection (later sends from it are "nothing to send"). What TCP does with that SYN
   in detail is out of scope.
8. **The protocol is part of the key** [rfc768, rfc9000]: TCP 443 and UDP 443 are different sockets; TCP and UDP
   from the same 51002 are two rows. A UDP socket has no LISTEN state and no SYN: the bound `UDP *:443` takes the
   first datagram of a new pair, and the server keeps a row for that pair *(check: a UDP "row" is the server
   program's per-peer flow, like a connected UDP socket; QUIC itself tells its connections apart by connection IDs,
   out of scope)*.
9. **Reject** [rfc9293 §3.10.7.1–2, rfc1122 §4.1.3.1]: no row and no listening socket that takes the segment → TCP
   answers RST, UDP answers ICMP port unreachable. No preset reaches it; the implicit row shows it and the tests
   check it.

**Deciding fields** (the segment's "changed" mark): for a delivery or a new connection, the fields in which the rows
read before the winner differed from the segment (and the SYN for a new TCP connection); for rule 7, the protocol and
all four address fields; none for a reject.

## One step

One event per step: **open** (the OS picks the source port; the SYN, or a UDP datagram of 400 B, goes to the server;
its table lookup: a listening socket takes it → the row is added on both sides; or rule 7), **send** (a 400 B data
segment from the client; the server's lookup delivers it), **reply** (a 1200 B segment from the server, ports swapped;
the client's lookup delivers it), or **none** (a send or reply on a connection that was never made). Bytes count the
payload of both directions on the connection: SYN 0, send 400, reply 1200.

## Params

| Key | Values | Meaning |
|---|---|---|
| `scene` | the five preset ids (hidden; set by the presets, resets) | which clients, servers and script |
| `client` | c50, c60, c7, c8 | the host the open button opens from |
| open (button, key O) | | a new browser tab on `client` opens TCP to 203.0.113.10:443, as the next step (at most 4) |
| `forcePort` | `auto` / `reuse` | `reuse`: the OS hands out 51000 for every new connection |
| `view` | `server` / `client` | which side's table is drawn; the model does not depend on it |
| `adds` | number (hidden) | the open clicks: 3 digits each, (step after which) × 10 + (client index + 1), first click lowest |

The server table shown is the server of this step's segment (else the first server); the client table is the host of
this step's segment (else the first host).

## Presets and expected numbers

Checked by a script from the model before the page was written, asserted in `sim.test.js`.

| Preset | Params | Steps | End |
|---|---|---|---|
| `three-programs` (URM Primjer 1) | scene, view client | 9: 3 opens, 3 sends, 3 replies (SSH, browser, game) | client 192.168.1.50: 3 rows (52140→203.0.113.10:443, 52141→203.0.113.22:22, 53217→203.0.113.40:41800), 1600 B each |
| `two-tabs` (Primjer 2) | view server | 6: open 51000, open 51001, send tab 1, send tab 2, reply tab 2, reply tab 1 | server: 2 rows differing only in remote port, + `TCP *:443 LISTEN`; 1600 B each |
| `many-clients` (derived) | view server | 10: 5 opens, 5 sends | server: 5 rows (.50:51000, .60:51000, 198.51.100.7:50122, 198.51.100.8:58410, .50:51001), 1 listening socket; 400 B each |
| `port-clash` (Primjer 2, 2nd question) | forcePort reuse, view server | 5: open tab 1, send, reply, open tab 2 from 51000 → matches row 1 (rule 7), send tab 1 | server: 1 row, 2000 B. With `auto`: tab 2 gets 51001, 2 rows |
| `quic-too` (derived from RFC 9000) | view server | 5: open TCP 51002, first UDP datagram 51002, send TCP, send UDP, reply UDP | server: TCP row 400 B, UDP row 2000 B, told apart only by the protocol |

Key lookups (receiver, rows read with the fields that failed → winner):

- `three-programs` step 7, reply to SSH at the client: row 1 (browser) fails local port, remote IP, remote port →
  row 2 (SSH client) delivers. Step 9: rows 1–2 fail → row 3 (game).
- `two-tabs` step 2: row 1 fails remote port → listening socket takes the SYN → new row 2. Step 4: row 1 fails remote
  port → row 2. Step 5 (client): row 1 fails local port → row 2.
- `many-clients` step 2: row 1 fails remote IP only (both 51000) → listening socket → row 2. Step 6: row 1 fails
  remote IP → row 2.
- `port-clash` step 4: row 1 matches the SYN exactly → rule 7 (the listening socket is not read).
- `quic-too` step 2: row 1 fails protocol; `TCP *:443` fails protocol and SYN; `UDP *:443` takes it → new UDP row.
  Step 4: row 1 fails protocol → row 2.
- `forcePort: reuse`: `two-tabs` step 2 and `many-clients` step 5 hit rule 7 (then "nothing to send" for that tab);
  `three-programs` gets three rows all from 51000 (different remote sockets).
- Steps: at most 10 per preset, plus at most 4 opens by the student: never above 14.

## Legend

Listening socket (hollow, dashed), connection row (solid), program (round), segment (arrow with four fields),
changed (the kit highlight: the row created or matched and the deciding fields), rejected (✕).

## Out of scope

NAT/PAT (`urm-pat`), the handshake itself (`urm-tcp-handshake`), `SO_REUSEPORT` and accept queues, port exhaustion,
TIME-WAIT and connection incarnations, QUIC connection IDs.
