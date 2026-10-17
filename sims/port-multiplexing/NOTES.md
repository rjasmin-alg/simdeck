<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# port-multiplexing: notes

New stepper (task `docs/tasks/w2/port-multiplexing.md`, catalogue `net-port-multiplexing`, wave 2b). The scene
(clients, segment, servers) is drawn in HTML; the receiver's socket table is kit view **K4** (`Simdeck.ruleTable`, mode
`first`): connections, then listening sockets, then the implicit "no socket: RST / ICMP" row, so the tie-break of
rule 5 is the table's order. Rules and expected numbers: `SPEC.md`.

## Decisions

- **A connection is stored once, with both ends**; each side's table is derived from it (`tableOf`). The `view`
  param only picks which side's table is drawn; the model does not read it (tested). The task's state had one-sided
  `conns` and a single `nextEphemeral`; here each host has its own `next` (each OS picks its own ports).
- **Lookup only where a segment arrives.** The server's table is read for an open or a send, the client's for a
  reply. When the shown table is not the receiver, it shows the rows (the created row marked, a changed byte count
  highlighted) and a line "this segment arrives at …; switch the table".
- **Primjer 1 uses three servers** (web 203.0.113.10:443, SSH 203.0.113.22:22, game 203.0.113.40:41800), as the book
  has the three programs talk to their own servers. So the reply lookup fails on local port *and* remote socket;
  the caption carries rule 1 ("destination port 52141, so … the SSH client, not the browser on 52140", the task's
  English caption). The game's port 41800 is not in `/etc/services` on this machine *(check against the IANA
  registry: the book says "a number outside the registry")*. The game is TCP, to keep Primjer 1 to one protocol.
- **The open button** opens a new browser tab on the chosen client to 203.0.113.10:443 (TCP) as the next step and
  moves there. Clicks are packed into the param `adds` (three digits each: step × 10 + client), which has no control
  of its own: a hidden slider broke the page check (it clicks the first slider), so `adds` lives in `defaults` only.
  Consequence: added connections are **not kept in the URL**; the button keeps the active preset, so `R` takes them
  away. At most 4 clicks and 8 opens per demo (`many-clients` allows 3): with more rows the table no longer fits at
  1920×1080. When used up the button is `aria-disabled` and the Clients heading says why.
- **`forcePort: reuse`** hands out 51000 for every new connection on every host (the task: "the OS reuses 51000 for
  tab 2"). In `three-programs` that gives three rows all from 51000 (different remote sockets), in `two-tabs` and
  `many-clients` rule 7 — and the tab whose SYN was rejected then has "nothing to send" in its later steps.
- **Rule 7 outcome**: the SYN matches the existing row (the listening socket is never read), no row is added, the
  program's port is struck with ✕. The page says "rejected"; what TCP really does with such a SYN (challenge ACK,
  sequence checks) is out of scope, as the task says.
- **UDP** (`quic-too`): the bound `UDP *:443` takes the first datagram of a new pair and the server keeps a row for it
  (like a connected UDP socket). It has no SYN, so the segment card shows "flag: none" and only the protocol is the
  deciding field.
- **Port picking** (rule 3): the book's numbers where it gives them; otherwise the next free port after the host's
  last one, per protocol, wrapping 65535 → 49152 (a fresh host starts at 49152). Linux uses a hashed offset in
  32768–60999; sequential keeps the demo deterministic. Every preset port is in 49152–60999 (tested).
- **Deciding fields** on the segment ("changed" mark): the fields in which the rows read before the winner differed
  (and SYN for a new TCP connection); all five for rule 7. In Primjer 1 this marks three fields (port and the
  server's address and port), honestly: those rows differ in all three.
- **Croatian terms**: the book keeps *port* and *socket* as English words in italics. Captions are plain text from
  `t.parts`, so the page wraps words starting with "port"/"socket" in `<i>` on Croatian pages (`italics()`); the
  explanation writes the italics in its HTML.
- **Program pills** show `:port` (the host's IP is the card's heading); the full socket is in the segment and the
  table. The protocol is shown in a pill only when the program has a UDP socket.
- **Concepts, not tools**: no product names; "browser", "web server", "SSH client/server", "game". SSH, TCP, UDP,
  ICMP and HTTP/3 are protocols, not products.

## Deviations from the task

- `two-tabs` server view, `many-clients` 10, `port-clash` 5, `quic-too` 5, `three-programs` 9: all as the task.
  `port-clash` order: open tab 1, send, reply, open tab 2 (rule 7), send tab 1 (the task gave only the count).
- The `client` param is a choice of four hosts (the four of `many-clients`), not of programs: the button always
  opens a browser tab. The scene param `scene` is a hidden choice set by the presets.
- State shape (see Decisions); the task's `seg` and `event` are kept, plus `look` (the lookup) and `changed`.

## Sources

URM ch13 (Primjer 1 and 2, "Zašto transportni sloj…", "Brojevi portova", lines 310–311 on sockets), the ch13
figure, RFC 9293 §3.4.1, glossary "port", §3.10.7.1–2 (read in the local copy), RFC 1122 §4.1.1 and §4.1.3.1 (local
copy), RFC 6335 §6 (local copy), RFC 768, RFC 9000 *(HTTP/3 on UDP 443: RFC 9114 not read, check)*, Linux
`ip_local_port_range` read from `/proc` on this machine. Details with quotes: `SPEC.md`.

## Checks

- Numbers printed by a script from the model before the page was written (every preset in both `forcePort`
  values), asserted in `sim.test.js` (26 tests).
- `npm run gate -- port-multiplexing`: pass (manifest, tests, build, 63 browser checks, tokens, scope). Screenshots
  at 1920×1080 light, dark, grayscale and 375×812 in hr and en reviewed, plus every preset at its key steps with a
  local Playwright script, the client view, `forcePort: reuse`, and the worst case of the open button
  (`many-clients` + 3 tabs). Fixed from them: the `visible: false` controls showing (below), the panel scrolling
  (two-column presets), the clients column pushing the table off the stage (pills on one line, host cards as rows,
  the 8-open cap, the "new row" tag moved into the mark column), the phone layout wider than the screen (the
  outer grid's implicit column), a byte count highlighted when only matched, and the client table's useless
  "takes" column.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against the book and the
  local RFC copies; it confirmed rules, numbers and facts and ran **43 mutations**: every rule mutation failed a test;
  4 real gaps survived, now closed with tests and re-run: the student's open aimed at another server in the
  three-server scene, the new host's place in client order, the opening program's and the matched row's "changed"
  marks). Fixed from it: rule 7 worded as "not a new connection, no row added" instead of "rejected" (RFC 9293
  §3.10.7.4: a SYN on an established connection gets a challenge ACK); the UDP row described as the server
  program's per-pair row, not a kernel table row; "again" only when the host already used 51000; "separate sequence
  numbers and window" added (`dOwn`, the task's Primjer 2 point); a generic caption when the clashing program is not a
  tab; Croatian cases ("nema nijedne veze", "nema retka za tu vezu"); the English misconception "a port is a physical
  connector"; "the same {dst}" with nothing before it; the ICMP answer from the string table.
- Fit measured in both languages for the longest captions and the worst case (8 rows): the table ends 23 px above the
  stage's bottom.

## Term pairs

None of these is in `kit/glossary.js` (only *listening* — osluškivanje is). For the coordinator, `"src": "simdeck"`:

| en | hr | source |
|---|---|---|
| port | *port* (the English word, italic; not "priključak") | URM ch13 |
| socket | *socket* | URM ch13 |
| multiplexing / demultiplexing | multipleksiranje / demultipleksiranje | URM ch13, task |
| dynamic (ephemeral) port | dinamički *port* | URM ch13 |
| system (well-known) port | sistemski *port* | URM ch13 |
| connection | veza | URM ch13 |
| pair of sockets | par *socketa* | URM ch13 |

## Shared requests

- **Kit (`kit.css`)**: `.sd-ctl { display: flex }` overrides the `hidden` attribute that a control's `visible`
  sets, so `visible: () => false` controls still show. At least ten pages (tcp-congestion, amdahl, ipv6-slaac,
  qpsk, …) carry their own `.sd-ctl[hidden] { display: none; }`; this page too. Smallest fix: that rule in `kit.css`.
- **Kit (`check-page.mjs`)**: the "slider then →" check clicks the first range in the controls even when it is hidden
  (no bounding box → the browser check crashes). It could pick the first *visible* range.
- **Kit**: a way for a page to keep a param without a control in the URL (here `adds`), e.g. `type: 'hidden'`.
- **K4 (`ruletable.js`)**: a row-level class or "changed" flag (here the page adds `pm-conn`, `pm-listen`, `pm-new`
  to the `<tr>`s after the view returns).

## Time

Start 2026-10-17 11:19, done 11:48 (CEST): about 29 minutes, one session, including the fresh review.
