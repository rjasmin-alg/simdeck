# websocket: WebSocket upgrade

| | |
|---|---|
| Task | `websocket` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-websocket` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/websocket/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `internet` / `http` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `http-exchange` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **from HTTP request to a persistent two-way channel**.

The student: step the upgrade, then push messages.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/http-exchange/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course book covers WebSocket. Related: `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` "HTTP i HTTPS" (request/response, status codes) and `/home/rjasmin/projects/uvod-u-linux/book/chapters/21-web-posluzitelji.md` "Kako web-poslužitelj dolazi do odgovora" (header fields, status-line)
- RFC 6455 "The WebSocket Protocol" §1.2, §1.3 (example key and accept), §4.1, §4.2.2, §4.4, §5.1–5.5, §7.4.1
- RFC 9110 §7.8 (Upgrade), §15.2.2 (101), §15.5.22 (426)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** kit view K1 message sequence chart, browser and server `chat.example`, in two phases: first an ordinary HTTP/1.1 exchange (the upgrade request and the 101 response, shown as text with headers), then the same TCP connection redrawn as a two-way channel where frames flow in both directions without requests. A small panel computes `Sec-WebSocket-Accept` from the key. A comparison strip shows the same three server messages delivered by repeated polling.
- **State:** `{ phase: 'http'|'open'|'closing'|'closed', request: { headers }, response: { status, headers }|null, accept: { key, concat, sha1, base64 }, frames: [{ dir, opcode, masked, payload }], polling: [{ t, request, response }] }`.
- **One step:** one message, in order: (1) client sends `GET /chat HTTP/1.1` with the upgrade headers; (2) server validates them and computes the accept value; (3) server answers 101 (or an error); (4…) data frames in either direction; (last) close frame and its echo.
- **Rules:**
  1. The opening handshake is an HTTP/1.1 GET with `Upgrade: websocket`, `Connection: Upgrade`, `Sec-WebSocket-Key` (base64 of 16 random bytes) and `Sec-WebSocket-Version: 13` (RFC 6455 §4.1).
  2. The server proves it understood by returning `101 Switching Protocols` with `Sec-WebSocket-Accept` = base64(SHA-1(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")) (RFC 6455 §1.3, §4.2.2). RFC example: key `dGhlIHNhbXBsZSBub25jZQ==` → accept `s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`.
  3. If the version is not supported the server refuses with an HTTP error (e.g. 426 Upgrade Required) and a `Sec-WebSocket-Version` header listing what it supports (RFC 6455 §4.4); any status other than 101 means the connection stays HTTP (RFC 6455 §4.1).
  4. After 101 the same TCP connection carries frames; either side may send at any time, the server without being asked (RFC 6455 §1.2, §5).
  5. Frames from client to server are masked, from server to client are not (RFC 6455 §5.1, §5.3).
  6. Opcodes: text 0x1, binary 0x2, close 0x8, ping 0x9, pong 0xA; a ping is answered with a pong (RFC 6455 §5.2, §5.5).
  7. Closing: one side sends a close frame (e.g. code 1000 normal closure), the other answers with a close frame, then TCP closes (RFC 6455 §5.5.1, §7.4.1).
  8. Polling comparison: without WebSocket the client must ask repeatedly; a message waits on average half the polling interval (teaching simplification).
- **Params:** choice `version` 13 / 8, default 13; toggle `missingUpgrade`, default off; range `pollInterval` 1–10 s, default 5 (comparison strip); button `server-push` (key P) adds a server message at the next step.
- **Presets:**
  1. `rfc-handshake` — the RFC 6455 §1.3 example values: key `dGhlIHNhbXBsZSBub25jZQ==` → accept `s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`; 101. From RFC 6455 §1.3, §4.2.2.
  2. `server-push` — after the handshake the server sends three messages at t = 1, 2, 7 s without any request; with 5 s polling they would arrive at 5, 5, 10 s. Derived, unchecked.
  3. `ping-pong-close` — client ping → server pong → client close 1000 → server close → TCP closed. From RFC 6455 §5.5.
  4. `wrong-version` — `Sec-WebSocket-Version: 8`: server answers 426 with `Sec-WebSocket-Version: 13`; nothing is upgraded. From RFC 6455 §4.4.
  5. `not-an-upgrade` — request without `Upgrade`: an ordinary 200 page, the connection stays HTTP. Derived.
- **Steps:** `rfc-handshake` 3; `server-push` 6; `ping-pong-close` 7; `wrong-version` 3; `not-an-upgrade` 2.
- **Legend:** HTTP messages as text cards, frames as small chips with opcode labels (mask icon on client frames), the connection line changing from "HTTP" to "WebSocket" style at 101; "changed" marks the frame or header checked this step.
- **Captions:** hr: "Poslužitelj spaja ključ s fiksnim nizom 258EAFA5-…, računa SHA-1 i vraća ga u base64: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=. Odgovor 101 znači da ista TCP veza od sada nosi okvire u oba smjera." en: "The server appends the fixed string 258EAFA5-… to the key, takes SHA-1 and returns it in base64: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=. The 101 response means the same TCP connection now carries frames both ways."
- **Terms:** *upgrade* — nadogradnja protokola (check); *handshake* — rukovanje; *frame* — okvir; *masking* — maskiranje; *polling* — prozivanje (check); *persistent connection* — trajna veza.
- **Misconceptions:** "WebSocket is a separate port and protocol from the start" (it starts as HTTP on the same connection); "the accept value is a security check" (it proves the server understood the handshake, not who anyone is); "the server can only answer requests".
- **Reuse from `http-exchange`:** the request/response text panel and status codes; new here are the upgrade, the accept computation and frames.
- **Out of scope:** extensions and subprotocols, compression, WebSocket over HTTP/2 (RFC 8441), TLS (`wss://` mentioned only), fragmentation details.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh websocket sims/websocket` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/websocket/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
