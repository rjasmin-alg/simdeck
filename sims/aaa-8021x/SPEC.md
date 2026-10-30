<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# aaa-8021x: specification

One concept: **supplicant, authenticator, RADIUS server; the port opens only after EAP succeeds.** A laptop plugs
into a switch port (or associates with a Wi-Fi access point); the student steps through every message and sees when
the port lets ordinary traffic through, and which of the book's four steps (identification, authentication, access
control, audit) each message does.

Task: `docs/tasks/w3/aaa-8021x.md`. Catalogue: `sec-aaa-8021x` (`docs/catalogue.md` §4.3).
Class: stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[B18]** `uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md`, „Tko je to, i smije li:
  autentikacija, nadzor pristupa i revizija", Što treba znati and Šire o temi: the four steps identification →
  authentication → access control → audit, AAA = Authentication, Authorization, Accounting with identification as
  its necessary first step; NIST SP 800-12 Rev. 1 §10 as quoted in footnote `nist80012-aaa`. Figure
  `assets/diagrams/ch18-aaa-koraci.svg` (`fig:aaa-koraci`): four boxes in a row, AAA bracketing the last three.
- **[B17]** `uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md`, „Sigurnost bežične mreže: od otvorenog
  pristupa do WPA3" (enterprise mode: the PMK comes from 802.1X with an authentication server, e.g. RADIUS; the
  4-way handshake is the same) and Primjer 5 (osobni naspram poslovnog Wi-Fi-ja).
- **[X]** IEEE 802.1X-2020, *Port-Based Network Access Control*: the PAE, the controlled and uncontrolled port, EAPOL.
  Clause numbers not checked against the text *(check)*.
- **[EAP]** RFC 3748, EAP: codes Request 1, Response 2, Success 3, Failure 4; type Identity 1; the authenticator as a
  pass-through (§2, §3).
- **[R]** RFC 2865, RADIUS: Access-Request 1, Access-Accept 2, Access-Reject 3, Access-Challenge 11; UDP port 1812
  (§3); retransmission by the client when no reply comes (§2.5 *(check)*).
- **[RA]** RFC 2866, RADIUS Accounting: Accounting-Request 4 with Acct-Status-Type Start, Accounting-Response 5;
  UDP port 1813.
- **[RE]** RFC 3579, RADIUS Support for EAP: the NAS puts each EAP packet in EAP-Message attributes; Access-Challenge
  carries the next EAP-Request; Access-Accept carries EAP-Success, Access-Reject carries EAP-Failure (§2.6 *(check)*).
- **[RV]** RFC 3580, IEEE 802.1X RADIUS Usage Guidelines: VLAN assignment in Access-Accept with Tunnel-Type = VLAN (13),
  Tunnel-Medium-Type = 802 (6), Tunnel-Private-Group-ID = the VLAN ID (§3.31 *(check)*).
- **[T]** The task file's "Model and presets" (step list, presets, captions, misconceptions).

## Scene

- **K1 sequence chart** (`kit/sequence.js`) with three lanes: **supplicant** (the laptop, `STA`), **authenticator**
  (the switch, or the Wi-Fi access point, `SW`), **authentication server** (RADIUS, `AS`).
- Each lane card holds that party's state. Laptop: the identity `ana@fakultet` and its credential (password for
  PEAP, certificate for EAP-TLS), wrong or right. Authenticator: **the port gate** (closed: only EAPOL passes; open:
  everything, in VLAN 20) and that it knows no password. Server: the user record (`ana@fakultet` → staff → VLAN 20)
  and its two UDP ports.
- **AAA column**: the chart's side column (K1 `eve`, retitled) gives each message its step of the four:
  **I** identification, **A** authentication, **A** access control (authorization), **A** audit (accounting).
- **AAA strip** under the chart: the book's figure as four boxes in a row with AAA bracketing the last three; each box
  says what did it in this run and at which step, or that it failed or never came.

## State

```
{ medium, method, credentials, server,
  phase,                                   // the step kind just done ('link', 'dhcpDrop', … ; null at step 0)
  port: 'unauthorized' | 'authorized', vlan: null | 20,
  msgs: [{ step, from, to, proto: 'EAPOL' | 'RADIUS' | 'DHCP', name, eap, round, udp, attrs, dropped, lost, verdict }],
  notes: [{ step, lane, what }],
  aaa: { identified, authenticated, authorized, accounted },   // null not yet | { step, ok: true | false }
  outcome: null | 'authorized' | 'rejected' | 'noReply',
  last: { did, step }, changed: ['port', 'vlan', 'aaa.identified', …] }
```

## Rules

1. **Controlled port** [X]: until the port is authorized, the controlled port passes only EAPOL frames; every other
   frame from the laptop (here DHCP) is dropped at the port. EAPOL always passes (the uncontrolled port). After
   authorization the port passes everything, in the assigned VLAN. Model: `passes(port, proto)`.
   **Tie-breaks:** the port is still unauthorized when Access-Accept reaches the switch and when EAP-Success is sent;
   it opens in the next step (wired: step 12, "port authorized"). On Wi-Fi the port opens only after the 4-way
   handshake (which is EAPOL-Key frames, so it passes the closed port) [B17, X].
2. **The authenticator relays, it does not decide** [RE, EAP]: every EAP-Response from the laptop goes on to the
   server inside an Access-Request, every Access-Challenge comes back to the laptop as an EAP-Request, unchanged.
   The switch holds no password. The decision is always a message from the server (Access-Accept or Access-Reject),
   or, with no server, the switch's own timeout, which leaves the port closed. Test: with the right and the wrong
   credentials the switch's messages are identical up to the server's verdict.
3. **RADIUS** [R, RA]: Access-Request, Access-Challenge, Access-Accept and Access-Reject on UDP 1812; Accounting on
   UDP 1813. The laptop never speaks RADIUS and the server never speaks EAPOL: EAPOL runs only between laptop and
   switch, RADIUS only between switch and server.
4. **VLAN in Access-Accept** [RV]: Tunnel-Type = VLAN (13), Tunnel-Medium-Type = 802 (6), Tunnel-Private-Group-ID =
   "20". The port's VLAN is 20 from the step it opens; before that it has none. VLAN 20 is an example number (derived).
5. **Reject** [RE]: Access-Reject carries EAP-Failure, the switch sends EAP-Failure to the laptop, the port stays
   unauthorized and a DHCP attempt is still dropped. No VLAN, no accounting.
6. **The four steps in order** [B18]: identification (EAP-Response/Identity, the claimed identity), authentication
   (the method rounds, until the server has checked the proof), access control (Access-Accept with the VLAN: what this
   user may reach), audit (Accounting-Request Start: a record of who connected, when). Each happens at a later step
   than the one before; AAA counts the last three, identification comes before it as its first step.
   **Tie-break:** identification and authentication are never the same step (the misconception "the identity is the
   login"); authentication and access control are never the same step (the misconception of [B18] Šire o temi).
7. **Enterprise Wi-Fi** [B17]: the same EAP exchange; Access-Accept also delivers the PMK to the access point
   (protected with the RADIUS shared secret), the laptop derives the same PMK from the EAP method itself, and the
   4-way handshake built on it opens the port. In personal mode the PMK comes from the shared password (no server;
   not run here, said in the explanation; `wpa-handshake` shows it).
8. **No reply** [R, X]: with the server down, the Access-Request is retransmitted once and gets no answer; after the
   switch's timeout the port stays closed. The timeout is shown as "no reply", not as a number (the default value
   differs by edition and device *(check)*). There is no Access-Reject: nobody decided.

### Simplifications (stated on purpose)

- **Folded method rounds.** One step per EAP method round: Access-Challenge (server → switch), EAP-Request (switch →
  laptop), EAP-Response (laptop → switch), Access-Request (switch → server). The round's contents are named, not
  modelled: PEAP has **4** rounds (start ↔ TLS hello; server hello and certificate ↔ the laptop's key exchange and Finished; the
  server's Finished with the inner password challenge (the tunnel is up from here) ↔ password proof: the server checks
  the password; inner result ↔ acknowledgement), EAP-TLS has **3** (start ↔ TLS hello; server hello, certificate and certificate request ↔ client
  certificate and proof: the server checks the certificate; server finished ↔ acknowledgement). Real exchanges have
  more round trips (TLS records are fragmented); the task's "3 vs 2" *(check)* is replaced by 4 vs 3 so the `book`
  preset (PEAP) has exactly the task's 14 steps. NOTES.md, "Deviations".
- **Wrong credentials** fail at the round where the server checks the proof: PEAP round 3, EAP-TLS round 2.
- **One retransmission** before the timeout with the server down.
- **EAPOL-Start** (the laptop may ask first) is left out: the switch starts with EAP-Request/Identity when the link
  comes up.
- **DHCP** after the port opens is shown as the laptop's first DHCP message passing the port into VLAN 20; the DHCP
  server and its answer are not drawn (`dhcp-dora` does that).
- **Accounting** shows Accounting-Request (Start) and the server's Accounting-Response in one step.

## Steps

One step = one message, a folded round (four messages), or one port change. Sequence by params:

| # | wired / Wi-Fi, accepted | rejected | server down |
|---|---|---|---|
| 1 | link up (Wi-Fi: associated); port unauthorized | same | same |
| 2 | DHCP from the laptop, dropped at the port | same | same |
| 3 | EAP-Request/Identity (switch → laptop) | same | same |
| 4 | EAP-Response/Identity `ana@fakultet` (**I**) | same | same |
| 5 | Access-Request with that EAP-Response (switch → server) | same | lost (server down) |
| 6… | method rounds (**A**): PEAP 6–9, EAP-TLS 6–8 | up to the failing round (PEAP 6–8, EAP-TLS 6–7) | 6: retransmission, lost |
| next | Access-Accept + VLAN 20 (Wi-Fi: + PMK) (**A**) | Access-Reject + EAP-Failure | 7: no reply, port stays closed |
| next | EAP-Success (switch → laptop) | EAP-Failure (switch → laptop) | |
| next | port authorized, VLAN 20 (Wi-Fi: 4-way handshake, then port authorized) | DHCP again, still dropped | |
| next | DHCP passes the port, into VLAN 20 | | |
| last | Accounting-Request Start ↔ Accounting-Response (**A**) | | |

| Params | Steps |
|---|---|
| PEAP, accepted (`book`, `wifi`) | 5 + 4 + 5 = **14** |
| EAP-TLS, accepted | 5 + 3 + 5 = 13 |
| PEAP, wrong (`reject`) | 5 + 3 + 3 = **11** |
| EAP-TLS, wrong | 5 + 2 + 3 = 10 |
| server down, any method or medium (`server-down`) | 5 + 2 = **7** |

These match the task's step counts (book 14, reject 11, server-down 7, wifi 14). Checked by the tests and by
`NOTES.md`, "Checks".

## Params

| Key | Type | Values | Default | Effect |
|---|---|---|---|---|
| `medium` | choice, resets | `wired`, `wifi` | `wired` | switch or access point; step 1 and the step that opens the port |
| `credentials` | choice, resets | `correct`, `wrong` | `correct` | the laptop's password (PEAP) or certificate (EAP-TLS) |
| `server` | toggle, resets | on (up) / off | on | off: the server does not answer |
| `method` | choice, resets | `peap`, `tls` | `peap` | the number of rounds and their labels only |

## Presets

| # | id | Params | Steps | What it shows |
|---|---|---|---|---|
| 1 | `book` | defaults | 14 | Accept with VLAN 20; DHCP passes at step 13; accounting starts at 14 [B18 order; R, RE messages] |
| 2 | `reject` | `credentials: wrong` | 11 | Access-Reject, EAP-Failure; DHCP still dropped at step 11 |
| 3 | `server-down` | `server: false` | 7 | Access-Request lost twice; no reply; port closed |
| 4 | `wifi` | `medium: wifi` | 14 | the same EAP; Access-Accept also gives the AP the PMK; 4-way handshake at 12 opens the port [B17 Primjer 5] |

`sim.json` `steps` is 14 (the defaults are the `book` run).

## AAA marks per message (the side column)

| Message | Mark |
|---|---|
| EAP-Response/Identity and the Access-Request that carries it | I identification |
| every message of the method rounds | A authentication |
| Access-Accept (or Access-Reject: denied) | A access control |
| Accounting-Request, Accounting-Response | A audit |
| link up, DHCP, EAP-Request/Identity, EAP-Success/Failure, port change | none |

## Legend

EAPOL (solid arrow) · RADIUS (dashed arrow) · dropped at the port (✕ at the switch) · port closed / open (gate) ·
AAA step badge · changed in this step (kit highlight).

## Misconceptions it targets [T, B18]

- "The switch checks the password." It never holds one; it repacks (rule 2, caption of step 5).
- "Authentication and authorization are the same step." Different steps, different messages (rule 6).
- "802.1X encrypts the wired link." It only decides whether the port opens; DHCP after it is ordinary traffic
  (explanation). On Wi-Fi the encryption comes from the 4-way handshake, not from 802.1X.

## Out of scope [T]

EAP method internals (TLS inside PEAP, the inner method), MAC authentication bypass, MACsec, TACACS+, the 4-way
handshake itself (`wpa-handshake`), RADIUS shared-secret maths, re-authentication timers.
