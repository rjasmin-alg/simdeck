# tls-handshake: TLS 1.2 vs 1.3

| | |
|---|---|
| Task | `tls-handshake` (wave 2b, Internet protocols) |
| Catalogue entry | `inet-tls-handshake` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/tls-handshake/` |
| Class | stepper |
| Size | M |
| Priority | P1 |
| Courses | UL, URM, SEC |
| Topic / tags / level | `internet` / `tls` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **key exchange, certificate, round trips; 1-RTT vs 2-RTT**.

The student: step both handshakes side by side.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/21-web-posluzitelji.md` (Uvod u Linux): "TLS i certifikati: od čega se sastoji povjerenje i što se lomi kad istekne" (TLS on TCP, server always authenticated, definition *rukovanje*), its "Šire o temi" (TLS 1.2/1.3 `openssl s_client` output, `no protocols available` vs alert 70, crypto policy, RFC 8996 deprecating TLS 1.0/1.1) and **Primjer 5 — „provjeri dopuštamo li stari TLS"**. The book cites RFC 9846 as the current TLS 1.3 document (minor update of RFC 8446, same version).
- `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-21/` (TLS diagrams)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md` "Šifriranje prometa: VPN, TLS i dvije vrste enkripcije" (asymmetric for the agreement, symmetric for the data)
- RFC 5246 §7.3 (TLS 1.2 handshake); RFC 8446 / RFC 9846 §2 (TLS 1.3 handshake), §6 (alerts); RFC 8996 (TLS 1.0/1.1 deprecated)
- Catalogue seed: UL ch21 → §5.5

## Overlaps (catalogue §5)

- **§5.5 TLS and certificates:** Handshake and chain are separate pages. Certificate expiry from the DR estate is a preset of inet-cert-chain. Revocation and ACME extend the chain page if they are built at all.

## Model and presets

- **Scene:** kit view K1 message sequence chart in "side-by-side compare" mode: left TLS 1.2, right TLS 1.3, each with client and server lanes (`democli1` → `www1.lab.example:443`, UL ch21). Before the TLS messages, the TCP handshake (1 RTT, greyed). Each message is labelled with its name and drawn plain (readable by an eavesdropper) or with a lock (encrypted). An "attacker sees" overlay lists what a passive observer reads. A round-trip counter under each column.
- **State:** `{ v12: { i, msgs[], rtt, keysAt, appDataAt }, v13: { … }, offered: ['1.2','1.3'], failure: null|'protocol_version'|'no_protocols_local', rttMs }`. Both columns step in lockstep; the shorter one waits at its end (playbook "run the others to their end").
- **One step:** one flight (all messages one side sends before waiting), in both columns: (1) draw the flight; (2) update which keys each side has; (3) update the RTT counter and "attacker sees".
- **Rules:**
  1. TLS runs on a reliable, ordered byte stream (TCP), so the TCP handshake comes first: 1 RTT (UL ch21 "TLS i certifikati", RFC 9846 §1 as cited there).
  2. The handshake negotiates the version, picks algorithms, authenticates the server (always) and optionally the client, and establishes shared keys; application data is protected only after it (UL ch21, definition *rukovanje*; RFC 9846 §1, §2).
  3. TLS 1.2 full handshake (ECDHE-RSA, as in the book's `ECDHE-RSA-AES256-GCM-SHA384`): C→ ClientHello; S→ ServerHello, Certificate, ServerKeyExchange, ServerHelloDone; C→ ClientKeyExchange, ChangeCipherSpec, Finished; S→ ChangeCipherSpec, Finished. The client can send application data after **2 RTT** (RFC 5246 §7.3).
  4. TLS 1.3 full handshake: C→ ClientHello (+key_share, supported_versions); S→ ServerHello (+key_share), {EncryptedExtensions}, {Certificate}, {CertificateVerify}, {Finished}; C→ {Finished} + application data. Application data after **1 RTT** (RFC 8446 / RFC 9846 §2).
  5. In TLS 1.3 everything after ServerHello is encrypted, including the certificate; in TLS 1.2 the certificate travels in clear (RFC 8446 §2, check wording).
  6. If client and server share no version, the handshake fails: either before anything is sent (the client has no protocol it may offer: "no protocols available", a local error) or with the server's alert `protocol_version` (70) (UL ch21 "Šire o temi" and Primjer 5; RFC 8446 §6).
  7. Tie-break: when both columns finish, the counter shows time to first application byte including TCP: 1.2 = 3 RTT, 1.3 = 2 RTT.
- **Params:** range `rttMs` 10–300, default 50; choice `clientOffers` "1.2+1.3" / "only 1.1 (policy allows)" / "only 1.1 (policy forbids)", default "1.2+1.3"; toggle `attackerView`, default on.
- **Presets:**
  1. `side-by-side` — RTT 50 ms: TLS 1.2 first app byte at 150 ms (TCP 1 + TLS 2 RTT), TLS 1.3 at 100 ms; certificate visible to the observer only in 1.2. Derived from RFC 5246/8446.
  2. `book-versions` — UL ch21 "Šire o temi": TLS 1.2 negotiates `ECDHE-RSA-AES256-GCM-SHA384`, TLS 1.3 `TLS_AES_256_GCM_SHA384`. Same steps as 1 with the book's cipher-suite names. From UL ch21.
  3. `old-version-local` — client asked for TLS 1.1 only, but the system-wide crypto policy forbids it: nothing is sent and the error is local to the client ("no protocols available"). From UL ch21 "Šire o temi" / Primjer 5.
  4. `old-version-alert` — the client is allowed to offer 1.1; the server answers with alert 70 `protocol_version`. From UL ch21 "Šire o temi" / Primjer 5.
- **Steps:** `side-by-side` 5 (TCP, then up to 4 flights; 1.3 finishes after 3); `book-versions` 5; `old-version-local` 2; `old-version-alert` 3.
- **Legend:** plain arrow = readable on the wire, arrow with lock = encrypted, key icon on a lane = that side now has the traffic keys, grey = TCP; "changed" marks the flight drawn this step.
- **Captions:** hr: "TLS 1.3: već u drugom letu poslužitelj šalje svoj dio razmjene ključeva, a sve iza ServerHello, pa i certifikat, putuje šifrirano. Klijent šalje podatke nakon jednog kruga." en: "TLS 1.3: in the second flight the server already sends its key share, and everything after ServerHello, the certificate included, is encrypted. The client sends data after one round trip."
- **Terms:** *handshake* — rukovanje; *key exchange* — razmjena ključeva; *certificate* — certifikat; *round trip (RTT)* — povratno vrijeme (check URM ch13); *TLS alert* — upozorenje TLS-a; *cipher suite* — šifrarnik (UL ch21 uses "šifrarnik"); *system-wide cryptographic policy* — kriptografska politika sustava.
- **Misconceptions:** "TLS replaces TCP"; "the certificate encrypts the traffic" (it authenticates; keys come from the key exchange); "an error mentioning the handshake came from the server".
- **Out of scope:** certificate validation (that is `cert-chain`), session resumption and 0-RTT, client certificates, the maths of ECDHE (`sec-diffie-hellman`), HelloRetryRequest.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `tls-handshake` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh tls-handshake sims/tls-handshake` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/tls-handshake/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
