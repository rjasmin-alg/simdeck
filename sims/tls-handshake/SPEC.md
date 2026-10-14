<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tls-handshake: specification

One concept: **key exchange, certificate, round trips; TLS 1.3 needs one round trip for its handshake where
TLS 1.2 needs two.** The student steps both handshakes side by side.

Task: `docs/tasks/w2/tls-handshake.md`. Catalogue: `inet-tls-handshake` (`docs/catalogue.md` §4.2).
Class: stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[UL21]** `uvod-u-linux/book/chapters/21-web-posluzitelji.md`, "TLS i certifikati: od čega se sastoji povjerenje i
  što se lomi kad istekne": TLS needs only a reliable, ordered byte stream and stands on TCP; the server is always
  authenticated, the client optionally; definition *rukovanje* (version, algorithms, authentication, shared key
  material; application traffic protected after it). Its "Šire o temi": the TLS 1.2 and 1.3 connections from
  `democli1` to `www1.lab.example:443` with `ECDHE-RSA-AES256-GCM-SHA384` and `TLS_AES_256_GCM_SHA384`; TLS 1.1
  refused first locally ("no protocols available" while the handshake is being prepared, nothing sent), then, with
  the client allowed to offer it, by the server's alert number 70; RFC 8996. **Primjer 5** ("provjeri dopuštamo li
  stari TLS"): a local error says nothing about the server.
- **[URM18]** `uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md`, "Šifriranje prometa: VPN, TLS i
  dvije vrste enkripcije": asymmetric for the agreement, symmetric for the data.
- **[URM13]** `uvod-u-racunalne-mreze/book/chapters/13-transportni-sloj.md`: the book's term for RTT is *vrijeme
  kruženja*.
- **[5246]** RFC 5246 §7.3 (TLS 1.2 full handshake, figure 1), §7.4.9 (Finished), Appendix E.1 (a server that supports
  only versions above the client's sends `protocol_version`).
- **[8446]** RFC 8446 §2 (TLS 1.3 handshake, figure 1: `{}` = protected with keys from the handshake secret), §4.1.2
  (ClientHello `key_share`, `supported_versions`), §6 / §6.2 (alerts, `protocol_version(70)`). RFC 9846 is the book's
  current TLS 1.3 document (the same version, a minor update); its §2 keeps the figure *(check: section numbers taken
  from the book's citation, not from the RFC text)*.
- **[8996]** RFC 8996: TLS 1.0 and 1.1 deprecated, "MUST NOT be used" and must not be negotiated.

## Scene

- Kit view **K1** (`kit/sequence.js`), two charts side by side: left **TLS 1.2**, right **TLS 1.3**. Each has the
  lanes **client** (`democli1`) and **server** (`www1.lab.example:443`) [UL21], the time column (when the row is
  sent, ms) and, with `attackerView` on, the eavesdropper column (what a passive observer reads of the row).
- Rows: the TCP handshake greyed (`muted`), then the TLS messages, plain (readable on the wire) or locked (encrypted).
  A flight is drawn as one or more rows: consecutive messages of a flight with the same protection share a row, at
  most two per row, and application data has its own row (the chips stay short enough for half a screen).
- Lane cards: a key chip once that side holds the keys from the key exchange, a dashed "no keys" before.
- Under each chart: the round-trip counter (when the last flight drawn arrives, in RTT and ms, tested per step; when data goes, "first data byte at …,
  TCP 1 + TLS n"), the negotiated cipher suite when `suites` is on, and with `attackerView` on what the observer has
  read so far in that column.
- `clientOffers` other than the default: one chart (the client offers only TLS 1.1), with a panel that says where the
  error came from (this machine, or the server).

## State

```
{ mode: 'compare' | 'fail', rttMs, wanted: ['1.2','1.3'] | ['1.1'], offered: [...], failure: null | 'protocol_version' | 'no_protocols_local',
  v12: col, v13: col,          // mode 'compare'
  att: col,                    // mode 'fail'
  last: n }
col = { key: '1.2' | '1.3' | 'old-allowed' | 'old-forbidden', v: '1.2' | '1.3' | '1.1', i: steps drawn, msgs: [msg],
        rtt: when the last flight drawn arrives, in RTT, keysAt: { C: step | null, S: step | null }, appDataAt: RTT | null,
        done, waiting, failed: null | failure, read: [item], suite: string | null }
msg = { step, flight, from, to, name, enc, half, row, reads: [item], tcp, share, cert, app, alert }
```

`half` is the number of one-way trips before the message leaves (the time column shows `half × rttMs / 2`).

## Rules

1. **TCP first.** TLS needs a reliable, ordered byte stream, so the TCP handshake comes first: SYN, SYN+ACK, one round
   trip, in both columns at step 1 [UL21, 8446 §1 as cited there]. The third TCP segment (ACK) leaves with the
   ClientHello and adds no time; it is not drawn (said in the caption).
2. **What the handshake does.** It negotiates the version, picks the algorithms, authenticates the server (always) with
   its certificate, and establishes shared keys; application data is protected and may flow only after it [UL21
   *rukovanje*, 8446 §1–2]. The certificate binds the server's public key to its name; the server proves it holds the
   private key by a signature (ServerKeyExchange in 1.2, CertificateVerify in 1.3). The certificate does not encrypt. The keys come from the key exchange:
   **a side holds the keys from the step in which the other side's key share reaches it** (it already has its own),
   and only a side that holds the keys sends an encrypted message (test: no locked message before its sender has
   keys).
3. **TLS 1.2 full handshake (ECDHE-RSA)** [5246 §7.3]: flight 1 C→ ClientHello; flight 2 S→ ServerHello, Certificate,
   ServerKeyExchange (the server's key share), ServerHelloDone; flight 3 C→ ClientKeyExchange (the client's key
   share), ChangeCipherSpec, Finished (encrypted); flight 4 S→ ChangeCipherSpec, Finished (encrypted); flight 5 C→
   application data. The client may send data only after the server's Finished: **2 RTT** of TLS.
   Keys: client at step 3 (ServerKeyExchange arrives), server at step 4 (ClientKeyExchange arrives).
4. **TLS 1.3 full handshake** [8446 §2]: flight 1 C→ ClientHello with `key_share` and `supported_versions`; flight 2
   S→ ServerHello with `key_share`, then {EncryptedExtensions}, {Certificate}, {CertificateVerify}, {Finished};
   flight 3 C→ {Finished} and application data in the same flight. **1 RTT** of TLS.
   Keys: server at step 2 (ClientHello with the key share arrives), client at step 3 (ServerHello arrives).
5. **What is encrypted.** In TLS 1.3 everything after ServerHello is encrypted, the certificate included; in TLS 1.2
   the server's whole second flight is in clear, the certificate included, and only the two Finished and the data are
   encrypted [8446 §2: "{} Indicates messages protected using keys derived from a [sender]_handshake_traffic_secret";
   5246 §7.3]. ChangeCipherSpec and messages that carry a key share are always in clear.
   **The observer** reads: the server name, the offered versions and cipher suites (ClientHello), the chosen version
   and suite (ServerHello), both key shares (public halves), in 1.2 the certificate; never the keys, nor anything
   locked. Test: in 1.3 the observer never reads the certificate; in 1.2 it does from step 3.
6. **No common version** [UL21 Šire o temi, Primjer 5; 5246 E.1; 8446 §6.2; 8996]. The server accepts 1.2 and 1.3.
   - `clientOffers = old-forbidden`: the client wants only TLS 1.1, its system-wide cryptographic policy does not allow
     it, so it has **no protocol to offer**. After TCP the handshake stops on the client while it is being prepared:
     nothing TLS is sent, the server is never asked; the error is local (`no_protocols_local`). 2 steps.
   - `clientOffers = old-allowed`: the client offers TLS 1.1 in its ClientHello; the server answers with the alert
     `protocol_version` (70), fatal, in clear (no keys yet), and the connection ends. The error comes from the other
     side (`protocol_version`). 3 steps.
   Neither side ever holds keys; no application data.
7. **Tie-break: lockstep and the end.** Both columns step in lockstep, one flight per step, so a row's time is the same
   in both columns (step k is the same moment left and right). TLS 1.3 finishes at step 4 and **waits** (its state
   no longer changes, `waiting`) while TLS 1.2 runs to its end at step 6 (playbook: run the others to their end).
   Time to the first application byte, TCP included: **1.2 = 3 RTT, 1.3 = 2 RTT**.

## Expected numbers

| rttMs | TLS 1.2 first data byte | TLS 1.3 first data byte | difference |
|---|---|---|---|
| 50 (default) | 150 ms (3 RTT: TCP 1 + TLS 2) | 100 ms (2 RTT: TCP 1 + TLS 1) | 50 ms |
| 10 | 30 ms | 20 ms | 10 ms |
| 300 | 900 ms | 600 ms | 300 ms |

Send times at 50 ms (half = 0, 1, 2, …): SYN 0, SYN+ACK 25, ClientHello 50, server flight 75, client flight 100,
1.2 server Finished 125, 1.2 data 150. 1.3 data leaves at 100 ms with the client's Finished. Checked with
`node` arithmetic in `sim.test.js` (rule 7 tests) and by hand: 3 × 50 = 150, 2 × 50 = 100.

Steps: `side-by-side` and `book-versions` **6** (TCP, then up to five flights; 1.3 finishes after three);
`old-version-local` **2**; `old-version-alert` **3**.

## Params

| key | type | values | default |
|---|---|---|---|
| `rttMs` | range | 10–300, step 10 | 50 |
| `clientOffers` | choice, resets | `modern` (1.2 + 1.3), `old-allowed` (only 1.1, policy allows), `old-forbidden` (only 1.1, policy forbids) | `modern` |
| `attackerView` | toggle | | on |
| `suites` | toggle | show the negotiated cipher suite | off |

## Presets

1. `side-by-side`: defaults. 1.2 first data byte at 150 ms, 1.3 at 100 ms; the certificate is visible to the
   observer only in 1.2 [5246, 8446].
2. `book-versions`: `suites` on. 1.2 negotiates `ECDHE-RSA-AES256-GCM-SHA384`, 1.3 `TLS_AES_256_GCM_SHA384` [UL21].
   Same steps as 1. The 1.2 name carries the key exchange (ECDHE) and the authentication (RSA); the 1.3 name only the
   cipher and the hash, because in 1.3 the key exchange travels in `key_share` and the signature algorithm is agreed
   separately (`signature_algorithms`). The step-3 caption also says the certificate is readable in 1.2, encrypted in 1.3.
3. `old-version-local`: `clientOffers = old-forbidden`: no protocols available, local, nothing sent [UL21].
4. `old-version-alert`: `clientOffers = old-allowed`: alert 70 `protocol_version` from the server [UL21].

## Simplifications

- TLS 1.3's key schedule has handshake keys (for the flight after ServerHello) and application keys (for data); the
  page shows one key chip, "keys from the key exchange", for both. Both come from the same (EC)DHE shared secret.
- No session resumption, 0-RTT, client certificates, HelloRetryRequest, TLS 1.2 False Start, 0.5-RTT server data,
  ECDHE maths (`sec-diffie-hellman`) or certificate validation (`cert-chain`) [task, out of scope].
- 1.2's cipher-suite string is the book's spelling (`ECDHE-RSA-AES256-GCM-SHA384`); its registry name is
  `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384` (RFC 5289).
- TCP connection teardown after the alert is not drawn (said in the caption).
