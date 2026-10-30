<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ssh-tunnels: specification

One concept: **local, remote and dynamic forwarding.** One SSH connection carries several logical channels; a
forwarding is a listening socket at one end of it, and every connection to that socket becomes a channel whose far
end opens a plain TCP connection to the target, *as seen from the far end*. Task: `docs/tasks/w3/ssh-tunnels.md`;
catalogue `inet-ssh-tunnels` (§4.2). Builds on `ssh-key-auth` (same hosts, same client/server lanes).

## Scene

| Thing | Value | Source |
|---|---|---|
| SSH client | `democli1` (no address shown: it may sit behind NAT, the remote preset's case) | task, UL ch15 |
| SSH server | `demosrv1`, `192.168.122.57`, SSH on port 22 | task, UL ch15 |
| internal host | `db1`, `192.168.180.20`, a database on port 5432; only `demosrv1` reaches it | task |
| services on `demosrv1` | SSH server `0.0.0.0:22`; web server `127.0.0.1:80` (loopback only) | task; UL ch18 table |
| services on `democli1` | SSH server `0.0.0.0:22`; web server `0.0.0.0:80` (the one the mix-up preset means) | made up for the demo |
| web sites (dynamic) | `www.example.com:80`, `www.example.org:80` (reserved example names; plain HTTP so the last segment is plainly unencrypted) | made up for the demo |
| listen port per target | 80 → 8080, 22 → 2222, 5432 → 5432; dynamic 1080 | task presets |

## State

`{ kind, target, tunnels: [{ kind, bind: { host, addr, port }, target: { host, port } | null, n }], flows: [{ ch,
src, dst, segs: [{ at, kind, enc, wire, dir, n }], phase, fail }], gatewayPorts, phase, rows, ev, extra }`.
`segs[].kind` is `loop` (inside one host, over its loopback: plain, never on the network), `ssh` (the channel inside
the encrypted connection) or `net` (plain TCP on a network). `enc` is true only for `ssh` (rule 6). `dir` is the
direction the TCP connection is opened in: `r` (left to right) for local and dynamic, `l` for remote. `n` is the step
that drew it (the page's "changed" mark).

## Rules

1. **Channels.** The SSH connection protocol carries several logical channels inside one encrypted tunnel
   (RFC 4251 §1; UL ch15 "šifrirani tunel dijeli na više logičkih kanala"). Every forwarded connection is its own
   channel, numbered 1, 2, … in the order they open, all inside the same SSH connection (one `ssh` segment kind,
   one pipe on the page).
2. **Local (`L`): the client listens.** The listener is the SSH client's, on `democli1`; nothing is sent to the server
   when it appears. Each connection to it becomes a `CHANNEL_OPEN direct-tcpip` carrying the target as written
   (`localhost:80`, `192.168.180.20:5432`); the server then connects to that target **as resolved and reached from
   the server** (RFC 4254 §7.2).
3. **Remote (`R`): the server listens.** The client sends the global request `tcpip-forward` (address, port) and the
   server answers `REQUEST_SUCCESS` and listens. Each connection to it becomes a `CHANNEL_OPEN forwarded-tcpip` from
   the server; the client then connects to the target as resolved and reached from the client (RFC 4254 §7.1).
   **Tie-break:** a target the far end cannot reach (`db1` from `democli1`) fails: the far end answers
   `CHANNEL_OPEN_FAILURE`, the waiting program's connection is closed, no data flows. Every later connection through
   the same forwarding fails the same way.
4. **Dynamic (`D`): the client runs a SOCKS proxy** on its listener. The application names the destination per
   connection (SOCKS `CONNECT host:port`, RFC 1928); the client opens a `direct-tcpip` channel for it, and the server
   connects. The page's `target` choice does not apply. Connections alternate between the two sites
   (`www.example.com`, `www.example.org`, then again). *(client behaviour; check)*
5. **Bind address.** Local and dynamic listeners bind to `127.0.0.1` (the client's default). A remote listener binds
   to `127.0.0.1` unless the server binds remote forwards to all addresses (`remoteBindAny`, `GatewayPorts yes` in the
   server's configuration; default off): then `0.0.0.0`, whatever address the client asked for. (`clientspecified`,
   where the client's address counts, is not modelled.) The client's request carries the address `localhost` either
   way (the client's default when no address is given). Who can connect: `127.0.0.1` → only processes on that host;
   `0.0.0.0` → anyone who reaches any of the host's addresses (UL ch18 table). *(sshd_config(5) GatewayPorts and the
   client's `localhost` default from memory; check)*
   **Tie-break:** `remoteBindAny` has no effect on `L` and `D` (it is the server's setting for the server's listeners).
6. **What is encrypted.** Only the client ↔ server segment (`ssh`) is encrypted. The segment from the far end to the
   target is plain TCP: `net` on the network when the target is another host, `loop` (plain, but never on the network)
   when the target is the far end itself. The segment from the application to the listener is `loop` (the
   application runs on the listening host).
   Expected: `local-to-loopback` → `loop, ssh, loop` (no plain segment on the network); `local-to-internal` →
   `loop, ssh, net`; `remote` → `loop, ssh, loop`; `dynamic` → `loop, ssh, net` for each site.
7. **`localhost` is the far end's.** In a target, `localhost` (and `127.0.0.1`) means the far end's own loopback: the
   server's in `L`, the client's in `R`. `direct-tcpip` carries `localhost` as written; only the far end resolves it.
   **Tie-break** (the mix-up, only with `L` to `localhost:80`, and only while the mix-up preset is active): `-L 8080:localhost:80` meant for the client's own
   web server lands on `demosrv1`'s `127.0.0.1:80`; the page shows the client's web server as "meant" and not reached.
8. **Loopback services become reachable.** `demosrv1`'s web server on `127.0.0.1:80` refuses direct connections from
   the network (bind address; UL ch18 "Adresa na kojoj se čeka je odluka, a ne svojstvo"), but `-L 8080:localhost:80`
   reaches it: the server's connection to it comes from `demosrv1` itself.

## Steps

One forwarding per run. Step 1 sets up the session and the forwarding; then each connection takes four steps the
first time:

1. **setup** — the SSH session to `192.168.122.57:22` (one row, the key exchange and login are `ssh-key-auth`'s);
   `R`: `tcpip-forward` + `REQUEST_SUCCESS`; the listening socket appears (`L`, `D`: on the client, a note only).
2. **connect** — the application connects to the listener (`D`: plus the SOCKS `CONNECT` with its destination).
3. **open** — `CHANNEL_OPEN` (`direct-tcpip` for `L` and `D` from the client, `forwarded-tcpip` for `R` from the
   server).
4. **target** — the far end connects to the target, then answers `CHANNEL_OPEN_CONFIRMATION` (or fails: `CHANNEL_OPEN_FAILURE`,
   rule 3). The order follows RFC 4254 §7: the receiver of the open decides after trying the target.
5. **data** — data flows app → listener → channel → far end → target (three rows); failed: the waiting program's
   connection is closed.

After that, every further connection (dynamic's second site, and each press of **T**, `send-traffic`) takes **one
step** with all four phases. **Step counts:** `local-to-loopback` 5, `local-to-internal` 5, `remote` 5, `dynamic` 6,
`localhost-mixup` 5; each T press adds 1, at most 2 presses (`MAX_EXTRA`, so the scene keeps the chart readable on one screen), so at most 8 steps.

## Params

`kind` L/R/D (default L); `target` `localhost:80` / `localhost:22` / `db1:5432` (default `localhost:80`; hidden and
ignored for D); `remoteBindAny` (default off; shown for R only); `mixup` (no control: set by the mix-up preset; only
read for L with a `localhost` target); `extra` (no control: the T presses as `"<kind> <target> <count>"`, count 0–2; a different kind or target reads as
0, so presses never carry over to another tunnel). Changing `kind` or `target` resets to
step 0 (a different tunnel).

## Presets

| # | id | kind | target | listener | steps | segments |
|---|---|---|---|---|---|---|
| 1 | `local-to-loopback` | L | `localhost:80` | `democli1 127.0.0.1:8080` | 5 | loop, ssh, loop |
| 2 | `local-to-internal` | L | `db1:5432` (`192.168.180.20:5432`) | `democli1 127.0.0.1:5432` | 5 | loop, ssh, net |
| 3 | `remote` | R | `localhost:22` | `demosrv1 127.0.0.1:2222` | 5 | loop, ssh, loop |
| 4 | `dynamic` | D | per connection | `democli1 127.0.0.1:1080` | 6 | loop, ssh, net ×2 |
| 5 | `localhost-mixup` | L | `localhost:80`, meant `democli1` | `democli1 127.0.0.1:8080` | 5 | loop, ssh, loop |

All derived from RFC 4254 and common client behaviour (the task's presets; numbers checked with
`scratch/check-numbers.js`-style replay in the tests, `sim.test.js` "presets").

## Out of scope

Jump hosts, tun devices, X11 forwarding, firewall rules for tunnels, abuse scenarios (task). The key exchange and user
authentication are one row (`ssh-key-auth`). Replies are not drawn as rows (the caption says data comes back the same
way).
