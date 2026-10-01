# ssh-tunnels: SSH port forwarding

| | |
|---|---|
| Task | `ssh-tunnels` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-ssh-tunnels` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/ssh-tunnels/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL, NLA |
| Topic / tags / level | `internet` / `ssh` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `ssh-key-auth` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **local, remote and dynamic forwarding**.

The student: build each tunnel, send traffic.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/ssh-key-auth/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md` (Uvod u Linux): "Udaljeni pristup: SSH, ključevi i otvrdnjavanje" (RFC 4251: the connection protocol divides the encrypted tunnel into logical channels). The book does not cover port forwarding; the rules below come from RFC 4254 and the OpenSSH manuals.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/18-mrezne-usluge.md` (Uvod u Linux): "Usluga koja čeka na portu" → "Adresa na kojoj se čeka je odluka, a ne svojstvo" (services bound to loopback)
- RFC 4254 "The Secure Shell (SSH) Connection Protocol" §7.1 (tcpip-forward), §7.2 (direct-tcpip)
- OpenSSH manual pages `ssh(1)` (`-L`, `-R`, `-D`), `sshd_config(5)` (`GatewayPorts`, `AllowTcpForwarding`)
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md` (Napredna Linux administracija): no topic names SSH port forwarding (checked); the NLA course link comes from the catalogue entry
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** three hosts: client `democli1`, SSH server `demosrv1` (192.168.122.57), and an internal host `db1` (192.168.180.20) reachable only from the server; plus a web service on `demosrv1` that listens only on `127.0.0.1:80`. The SSH connection is a thick encrypted pipe (kit view K1 lanes above it for the forwarding requests). Each tunnel shows its listening socket (host, address, port), where traffic enters and leaves the pipe, and which segment is unencrypted.
- **State:** `{ tunnels: [{ kind: 'L'|'R'|'D', bind: { host, addr, port }, target: { host, port }|null }], flows: [{ from, to, path: [segments], encrypted: [bool] }], gatewayPorts: bool, phase }`.
- **One step:** for the current tunnel: (1) the forwarding is requested when the SSH session is set up and the listening socket appears; (2) an application connects to the listening socket; (3) a channel opens inside the SSH connection; (4) the far end opens a plain TCP connection to the target; (5) data flows; segments are marked encrypted or plain.
- **Rules:**
  1. The SSH connection protocol carries several logical channels inside one encrypted tunnel (RFC 4251 §1; UL ch15).
  2. Local forwarding (listen port → target host:port): the **client** listens; each connection is carried to the server, which connects to the target **as resolved and reached from the server** (RFC 4254 §7.2 "direct-tcpip").
  3. Remote forwarding: the **server** listens; connections are carried back to the client, which connects to the target (RFC 4254 §7.1 "tcpip-forward").
  4. Dynamic forwarding: the client runs a SOCKS proxy; the destination is chosen per connection by the application (RFC 1928 for SOCKS 5; client behaviour, check).
  5. Listening sockets bind to loopback by default; a remote-forward listener binds to other addresses only if the server's configuration allows it (off by default) (check).
  6. Only the client ↔ server segment is encrypted; the segment from the far end to the target is plain TCP unless the target is the far end itself (`localhost`).
  7. `localhost` in the target means the far end's own loopback, not the client's (rule 2) — the most common mix-up.
  8. A service bound to `127.0.0.1` on the server is reachable through `-L …:localhost:…` although the firewall and the bind address stop direct access (UL ch18 "Adresa na kojoj se čeka je odluka, a ne svojstvo").
- **Params:** choice `kind` L/R/D, default L; choice `target` localhost:80 / db1:5432 / any (for D), default per preset; toggle `remoteBindAny` (server allows non-loopback remote listeners), default off; button `send-traffic` (key T).
- **Presets** (derived from RFC 4254 and common client behaviour, unchecked):
  1. `local-to-loopback` — local forward 8080 → localhost:80 over a session to 192.168.122.57; the browser on `democli1` opens `http://localhost:8080` → arrives at `demosrv1`'s `127.0.0.1:80`. All network segments encrypted.
  2. `local-to-internal` — local forward 5432 → 192.168.180.20:5432: `democli1:5432` → server → `db1:5432`; the server → db1 segment is plain.
  3. `remote` — remote forward 2222 → localhost:22 from a machine behind NAT: on the server, a connection to `localhost:2222` reaches the client; with `remoteBindAny` off only from the server itself.
  4. `dynamic` — dynamic forward on 1080: the browser uses SOCKS `localhost:1080`; two sites reached, each leaving from the server.
  5. `localhost-mixup` — local forward 8080 → localhost:80 where the user meant the client's own web server: traffic lands on the server's port 80.
- **Steps:** 5 per preset (`dynamic` 6).
- **Legend:** encrypted pipe (thick, lock), plain segment (thin, dashed), listening socket as a plug with its bind address, arrow direction = who opens the TCP connection; "changed" marks the socket or segment created this step.
- **Captions:** hr: "Lokalno prosljeđivanje: democli1 sluša na 127.0.0.1:8080. Veza ulazi u SSH tunel, a demosrv1 je dalje otvara prema svojem 127.0.0.1:80." en: "Local forwarding: democli1 listens on 127.0.0.1:8080. The connection enters the SSH tunnel, and demosrv1 opens it onwards to its own 127.0.0.1:80."
- **Terms:** *port forwarding* — prosljeđivanje porta (check); *local / remote / dynamic forwarding* — lokalno / udaljeno / dinamičko prosljeđivanje (check); *channel* — kanal (UL ch15 "logičkih kanala"); *loopback* — povratna petlja (UL ch18); *listening socket* — *socket* koji osluškuje (UL ch18).
- **Misconceptions:** "everything through a tunnel is encrypted end to end"; "`localhost` in a local forward is my machine"; "a remote forward exposes my port to the whole Internet" (only if the server allows non-loopback binding).
- **Reuse from `ssh-key-auth`:** the client/server lanes and the encrypted transport; new here are channels, listening sockets and the unencrypted last segment.
- **Out of scope:** jump hosts (`-J`), `-w` tun devices, X11 forwarding, firewall rules for tunnels, abuse scenarios.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `ssh-tunnels` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh ssh-tunnels sims/ssh-tunnels` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ssh-tunnels/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
