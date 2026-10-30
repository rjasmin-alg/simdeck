<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ssh-tunnels: notes

New stepper (task `docs/tasks/w3/ssh-tunnels.md`, catalogue `inet-ssh-tunnels`, §4.2, wave 3). Rules, tie-breaks and
expected numbers: `SPEC.md`. The messages are drawn with kit view **K1, message sequence chart** (`kit/sequence.js`);
the hosts, the encrypted pipe and each connection's segments are the page's own scene under it.

## Decisions

- **Layout.** Top: the K1 chart with four lanes, A (the program or target on `democli1`'s side), C (SSH client), S (SSH
  server), B (the target or program beyond the server). The lane names follow the kind: for local and dynamic A is the
  browser/program and B the target "as demosrv1 sees it"; for remote B is the program on `demosrv1` and A the target
  "as democli1 sees it" (rule 2/3: the target is resolved from the far end, written on the card). Bottom: the scene, a
  grid of five columns (democli1, the SSH pipe, demosrv1, network, db1 or the web sites), host cards with their
  listening sockets on top, one row per connection under them. The pipe is one double-walled element spanning all
  rows of its column; each channel is a thick line with a lock inside it (rule 1, visible as several channels in one
  pipe).
- **Segments by line style, not colour:** loopback a thin solid line tagged "loopback", the channel a thick line with a
  lock, plain TCP on the network a dashed line tagged "not encrypted, on the network", a failed connect a dashed line
  ending in ✕. The arrow head is at the end the connection is opened towards (left to right for local and dynamic,
  right to left for remote). Data flowing is a row of dots beside the line (animated, still under reduced motion).
- **Listening sockets** are plugs with their bind address in the host cards. Services exist before any tunnel (both
  hosts' SSH servers on `0.0.0.0:22`, `demosrv1`'s web server on `127.0.0.1:80`, `democli1`'s on `0.0.0.0:80`, the
  database on `db1`). The forwarding's listener is outlined and says whose it is and who can connect (UL ch18's "samo
  procesi na ovom stroju"). The socket a channel lands on gets "✓ target of channel n"; in the mix-up, `democli1`'s
  web server gets "✕ meant, not reached".
- **Order of phases.** The task's step 3 "a channel opens" and step 4 "the far end opens a plain TCP connection" are
  drawn as `CHANNEL_OPEN` (step 3), then the far end's TCP connect followed by `OPEN_CONFIRMATION` or `OPEN_FAILURE`
  (step 4): the receiver of the open tries the target before it answers (RFC 4254 §7).
- **The session** is one row (`SSH :22, key exchange and login`, not locked): `ssh-key-auth` teaches that part.
- **Local forwarding sends nothing at setup**: step 1 has only the session and a note "listens on …" on the client
  lane. Remote sends `tcpip-forward localhost <port>` and gets `REQUEST_SUCCESS`.
- **No tool syntax.** The forwarding is written `8080 → localhost:80` (and `1080` for dynamic) in captions, never as a
  command line (COMMON §1). Message names (`CHANNEL_OPEN`, `direct-tcpip`, `tcpip-forward`, `forwarded-tcpip`,
  `SOCKS CONNECT`) are the subject and appear as data. The server setting is described ("the server allows remote
  listeners on other addresses"), its name (`GatewayPorts`) is only in the aliases.
- **`send-traffic` (T)** adds one connection through the same forwarding as one step (all four phases); the param
  `extra` has no control, like ssh-key-auth's `queue`, so it is not kept across a reload or language switch. At most
  two presses (`MAX_EXTRA`): with five channels the scene left the chart two rows. A press at the last step also moves
  to the new last step.
- **`mixup`** is a model param without a control, set by the mix-up preset; it only changes the words and the marks
  (where traffic goes is the same as `local-to-loopback`), only with a local forward to `localhost:80`, and the page
  clears it as soon as the preset is no longer active (a param changed by hand), since the kit keeps params without a
  control across other changes.
- **T presses belong to one tunnel:** `extra` is stored as `"<kind> <target> <count>"` (`L.sendKey`), so changing the
  kind or the target starts the new tunnel with no extra connections.
- **The server setting** is worded as what it does ("the server binds remote forwards to all addresses",
  `GatewayPorts yes`), not as permission: with `clientspecified` the server would still bind loopback for a client
  that asks for `localhost`, which is not modelled.
- **Message names** are the RFC's without the `SSH_MSG_` prefix: `CHANNEL_OPEN`, `CHANNEL_OPEN_CONFIRMATION`,
  `CHANNEL_OPEN_FAILURE`, `CHANNEL_DATA`, `REQUEST_SUCCESS`, the global request `tcpip-forward`. `forwarded-tcpip` is
  drawn without its address and port (K1 field space, see Shared requests); the caption gives them.
- **Related:** `ssh-key-auth`, `nat`.

## Deviations from the task

- `target` offers `localhost:80`, `localhost:22` and `db1:5432`; the task lists `localhost:80 / db1:5432 / any (for D)`.
  `localhost:22` is added because the `remote` preset needs it; "any" is not an option because dynamic forwarding
  ignores the target (the control is hidden for D and the B lane says "web sites").
- Remote forwarding to `db1:5432` is allowed and fails (the client cannot reach db1): a tie-break of my own (SPEC rule
  3), which shows rule 2/3 from the other side.
- Listening ports follow the target: 80 → 8080, 22 → 2222, 5432 → 5432 (the presets' numbers), 1080 for dynamic.
- Web sites for dynamic are `www.example.com` and `www.example.org` on port 80 (plain HTTP, so the last segment is
  honestly unencrypted; the task names no sites).
- `remoteBindAny` is shown only for remote (it has no effect on the others; SPEC rule 5 tie-break).
- Step counts as the task says (5 per preset, dynamic 6), plus one per T press.

## Sources

- UL `book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md` ("šifrirani tunel dijeli na više logičkih kanala",
  RFC 4251 architecture).
- UL `book/chapters/18-mrezne-usluge.md`, "Adresa na kojoj se čeka je odluka, a ne svojstvo" (the bind-address table:
  `127.0.0.1` → "samo procesi na ovom stroju", `0.0.0.0` → "svatko tko dođe do bilo koje adrese stroja").
- RFC 4254 §7.1 (`tcpip-forward`, `forwarded-tcpip`), §7.2 (`direct-tcpip`); RFC 1928 (SOCKS 5 CONNECT); `ssh(1)`
  `-L`, `-R`, `-D`; `sshd_config(5)` `GatewayPorts`: from memory, no network in this session.
- NLA `meta/toc.md`: no SSH forwarding topic (the task says so); the NLA link comes from the catalogue.

## Unchecked *(check)*

- The client sends the address `localhost` in `tcpip-forward` when no bind address is given (OpenSSH's
  `channel_rfwd_bind_host`, from memory).
- `GatewayPorts yes` on the server binds remote listeners to the wildcard address; `no` (the default) to loopback
  only (from memory of `sshd_config(5)`).
- Local and dynamic listeners bind to loopback by default (the client's own `GatewayPorts`, default `no`).
- That the server connects to the target before it sends `OPEN_CONFIRMATION` (OpenSSH's non-blocking connect; RFC 4254
  leaves the timing to the implementation).
- `forwarded-tcpip` carries "address that was connected" = the address string of the request (`localhost`).
- The Croatian terms below.

## Term pairs

Not in `kit/glossary.js`; written out in both tables (the explanation uses the first-mention style by hand):

| English | Croatian | Source |
|---|---|---|
| port forwarding | prosljeđivanje porta | task *(check)* |
| local / remote / dynamic forwarding | lokalno / udaljeno / dinamičko prosljeđivanje | task *(check)* |
| channel | kanal | UL ch15 ("logičkih kanala") |
| listening socket | *socket* koji osluškuje | UL ch18 |

`forwarding` (prosljeđivanje) and `loopback` (povratna petlja) are in the glossary; the page writes them out in plain
words (no `[[term]]` was needed in the end).

## Shared requests

- **Kit: page state in the URL without a control** (as http-exchange and ssh-key-auth asked): the T presses (`extra`)
  are lost on a reload or a language switch.
- **Kit: hidden controls.** `visible: () => false` sets `[hidden]`, but `.sd-ctl`'s `display` wins; the page adds
  `.sd-panel [hidden] { display: none }` (as ssh-key-auth does).
- **K1: fields beside a short arrow.** A field on a message to the left lane runs past the receiver's lifeline; the
  page shortens the `forwarded-tcpip` field to the type and drops the address from the failed connect (the caption
  says it). Same request as ssh-key-auth, http-exchange and wifi-association.

## Model reuse

`ssh-key-auth` is not in `models/`. Its model is about host keys and user authentication; nothing of it is a function
this sim needs, so nothing is copied: only the host names, the address and the lane colours (client c1, server c6)
are the same. Nothing here is named as a soft dependency of a later sim; the model is still pure functions over plain
data (`listener`, `reach`, `resolve`, `lanesFor`) if one wants it.

## Checks

- Tests: 23. Five tie-breaks first (unreachable target, `remoteBindAny` only for R, the mix-up flag, T presses per
  tunnel, dynamic ignoring the target), rules 1–8, the full message sequence with senders for local, remote and the
  failing remote, steps, presets and the T limit, then the template's generic block.
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md and RFC 4254, ran 61 mutations (21
  survived), read both string tables and drove the page. Fixed from it: the mix-up flag ignoring the port (mix-up then
  `localhost:22` spoke of a web server); T presses and the mix-up flag surviving a change of tunnel; the toggle wording
  (binds, not allows); the target lane naming the landing before the mix-up's first step; Croatian "svaki unutar svojeg
  stroja", "na njega", "prihvaća web poslužitelj koji sluša samo na povratnoj petlji"; the pipe's channel tag cut off;
  `OPEN_CONFIRMATION`/`OPEN_FAILURE` → the full names; the dead preset-params test. Then a test pinning every row's
  kind, sender and receiver, the `direct-tcpip` target as written, the step 1 marks, the fail segment's side and the
  client's web server bind; all 15 visible survivors re-run and now killed. Left as is: `forwarded-tcpip`'s
  address/port and `ev.gatewayPorts` are in the state but not drawn; `127.0.0.1` as a written target is unreachable
  from the controls.
- Gate: pass (61 browser checks); screenshots reviewed (light, dark, grayscale, phone, both languages), plus my own of
  every preset at its last step, two T presses, remote to db1 (the failure), `remoteBindAny` on, and the phone with
  channels drawn. Browser check of the mix-up clearing and of T presses dropped on a kind change: no console errors.

## Time

Start 12:23, done 12:51 (gate, fresh review and its fixes): about 28 minutes, one session.
