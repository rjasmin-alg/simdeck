<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tls-handshake: notes

New stepper (task `docs/tasks/w2/tls-handshake.md`, catalogue `inet-tls-handshake`, wave 2b). Drawn with kit view
**K1, message sequence chart** (`kit/sequence.js`, kit 0.6.0), which exists, so nothing is drawn by hand in its place.
Rules and expected numbers: `SPEC.md`.

## Decisions

- **Two K1 charts side by side** (TLS 1.2 left, 1.3 right), as sketched for this sim in the K1 freeze (thread t-0101):
  client and server lanes, the time column (when the row is sent, in ms), the eavesdropper column (`eve`, what a passive
  observer reads of each row), the TCP handshake greyed (`muted`), encrypted rows locked (`lock`). The hosts
  (`democli1 → www1.lab.example:443`, UL ch21) are one line above both charts, so the lane cards stay one line wide.
- **Lockstep = the same moment.** Step k draws the flight sent at the same time in both columns (step 1 TCP, then one
  flight per step), so the time column reads the same left and right. TLS 1.3 finishes at step 4 and waits (its counter
  says "done, waiting for TLS 1.2") while 1.2 runs to step 6.
- **Rows, not one row per message.** Half a 1920 px screen holds about ten rows and lanes about 190 px wide, so
  consecutive messages of a flight with the same protection share a row, at most two per row, and application data has its
  own row (`rowsOf` in `sim.js`, tested). That keeps every message name on the chart with its real name: TLS 1.2 is
  10 rows, 1.3 is 8, and all of them stay in view at the end (rows 2.3rem instead of K1's 2.75rem at projector size).
  Long chips are centred over the arrow (`place: 'mid'`).
- **Keys** are a chip in each lane card: dashed "no keys", then a solid chip with a key icon from the step in which the
  other side's key share reaches that side (1.2: client 3, server 4; 1.3: server 2, client 3). One chip for "keys from the
  key exchange"; 1.3's separate handshake and application keys are a simplification stated in SPEC.md.
- **Counter box under each chart:** when the last flight drawn arrives ("last flight arrives", RTT and ms; 1.3 stays at
  2½ RTT / 125 ms while it waits, the moment its data reaches the server), the first data byte
  ("150 ms = TCP 1 + TLS 2 = 3 RTT"), the cipher suite when `suites` is on, and with `attackerView` on the list of what
  the eavesdropper has read in that column. In 1.3 the list shows "not the certificate (encrypted)", hatched, next to
  1.2's "certificate", so rule 5 is visible at the end without stepping back.
- **The failing presets** draw one chart ("The client offers only TLS 1.1") and a "Where is the error from?" panel:
  client wants, client policy, server accepts, and the verdict (local, nothing sent / from the server, a TLS alert) with
  the error text as data (`no protocols available`, `alert protocol_version (70)`). That is the task's misconception
  "an error mentioning the handshake came from the server", and the book's Primjer 5.
- **No tool names.** The book's `openssl s_client`, `update-crypto-policies`, Apache and `ssl.conf` stay in Sources; the
  page says "the client's system-wide cryptographic policy". The error string "no protocols available" is shown because
  the task names it as what the student sees; it is data, not a command.
- **The ACK** (third TCP segment) is not drawn: it leaves with the ClientHello and adds no time; caption 1 says so.

## Deviations from the task

- **Steps: 6, not 5** for `side-by-side` and `book-versions`. The task's own rule 3 has four TLS 1.2 flights and data
  "after 2 RTT", and the client's data is a fifth flight (it waits for the server's Finished), so TCP + 5 flights = 6. Drawing
  the data in the same step as the server's Finished would break "one step = one flight" and the lockstep timing. The
  others are as the task says: `old-version-local` 2, `old-version-alert` 3.
- **`suites` toggle** (not in the task's params): `book-versions` must differ from `side-by-side` by a param, and its only
  difference is showing the book's cipher-suite names. Off by default; disabled with a reason when the client offers 1.1.
- **`clientOffers` values** are ids `modern`, `old-allowed`, `old-forbidden` with the task's three labels.
- **RTT term:** the task suggests *povratno vrijeme (check URM ch13)*; URM ch13 says **vrijeme kruženja**, so the page
  uses that.
- **The task caption** for 1.3 is used at step 3 (first sentence) and step 4 ("the client sends data after one round
  trip"), because its two halves happen in different flights.
- The 1.2 cipher suite is shown in the book's spelling `ECDHE-RSA-AES256-GCM-SHA384`, as the task asks; the registry name
  is `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384` (SPEC.md, Simplifications).

## Sources

- `uvod-u-linux/book/chapters/21-web-posluzitelji.md`: "TLS i certifikati …" (TLS on TCP, server always authenticated,
  *rukovanje*), "Šire o temi" (1.2 / 1.3 cipher suites, "no protocols available" vs alert 70, crypto policy, RFC 8996),
  Primjer 5.
- `uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md` "Šifriranje prometa …" (asymmetric for the
  agreement, symmetric for the data); ch13 for *vrijeme kruženja*.
- RFC 5246 §7.3, §7.4.9, Appendix E.1; RFC 8446 §2, §4.1.2, §6.2; RFC 8996. RFC 9846 as the book's current TLS 1.3
  document *(check: its section numbers are taken from the book's citation, not read in the RFC)*.
- The diagrams in `uvod-u-linux/assets/diagrams/chapter-21/` are about the chain of trust and the reverse proxy, not the
  handshake; nothing taken from them.

## Checks

- Numbers: first data byte 150 / 100 ms at 50 ms, 30 / 20 at 10 ms, 900 / 600 at 300 ms; send times 0, 25, 50, 75,
  100, 125, 150 ms; asserted in `sim.test.js` (rule 7 tests) and printed from the model before the page was written.
- Rule tests broken on purpose, one mutation at a time (27 mutations: flight timing off by one, SYN+ACK timing, keys given
  to the sender, cert in clear in 1.3, cert encrypted in 1.2, the 1.3 observer reading the certificate, CCS encrypted,
  alert encrypted, alert code, rows of three, data sharing a row, the shorter column not waiting, steps min instead of
  max, no local failure, a forbidden client still offering or sending ClientHello, server accepting 1.1, no
  ServerHelloDone, 1.3 ClientHello without a key share, 1.3 data a flight later, data time at arrival, suites swapped,
  TCP rtt, the counter at send time or rounded, the old ClientHello without the server name, data row joined after):
  every one fails a test.
- **Fresh review** (a separate agent read the diff against SPEC.md and the RFCs and ran 38 mutations of its own). It found
  the model protocol-accurate. Fixed from it: the counter (renamed "last flight arrives", now tested per step); the
  certificate no longer "proves who the server is" on its own: caption and explanation say it binds the public key to the
  name and the server proves the private key by signing (ServerKeyExchange / CertificateVerify); "the secret from its own
  private part and the other side's public part"; the 1.3 suite name also lacks the signature algorithm (agreed
  separately); "one round trip less on every full handshake" (resumption is out of scope); the book preset's step 3 now
  also says where the certificate is readable; captions say the ACK and the teardown are not drawn; SPEC state brought
  in line; tests for the counter, the old ClientHello's reads and the data row; Croatian wording (pogreška, rukovanje in
  the captions, grammar in the explanation, the policy hint) and the English hint. Its 6 surviving mutations are caught
  now, except two equivalent ones (the `keysAt == null` guard: no side receives two key shares; `out.rttMs`, already
  set by `initial`).
- `npm run gate -- tls-handshake`: all checks pass (after the review fixes). Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale,
  help, panel hidden and 375×812 in both languages, plus every preset at its key step (side-by-side 3, 4 and 6,
  book-versions 3 and 6, old-version-local 2, old-version-alert 3) and the phone at step 4.

## Unchecked *(check)*

- RFC 9846 section numbers (above).
- Croatian "javni dio ključa" for *key share* and "prelazak na šifriranje" for what ChangeCipherSpec does: not book terms.
- "no protocols available" is the error text one TLS library prints (the book quotes it); the task asks for it, so it is
  shown as data in the fail panel and the caption, without naming the library. Owner may prefer a generic label.
- On the phone, the longest chips (`ClientKeyExchange, ChangeCipherSpec`) are clipped at the screen edge and cover the
  time of their row, as K1 does on a phone by design.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| key exchange | razmjena ključeva | task, URM ch18 ("razmjena ključa") |
| cipher suite | šifrarnik | UL ch21 |
| round-trip time (RTT) | vrijeme kruženja | URM ch13 (ch6 and `tcp-window` say *kružno vrijeme*; `tcp-congestion` asked for the same pair) |
| key share | javni dio ključa | none *(check)* |

`handshake`, `certificate`, `TLS alert`, `system-wide cryptographic policy` are in the glossary and used as `[[…]]`.

## Shared requests

- **K1: a row height option** (`spec.rowHeight`, or document `--sd-seq-row` as page-settable). This page sets
  `--sd-seq-row: 2.3rem` at projector size so all ten TLS 1.2 rows fit; `wpa-handshake` asked for the same.
- **K1: keep two charts' rows aligned** (optional): a `minRows` or a way to drop the same number of rows from two charts,
  so side-by-side charts keep their time rows level when one of them overflows. Not needed now (nothing overflows).

## Time

Start 2026-10-14 16:50, done (gate passing, review addressed) 17:15, about 25 min of build and review.
