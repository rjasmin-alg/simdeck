# cert-chain: Chain of trust and expiry

| | |
|---|---|
| Task | `cert-chain` (wave 2b, Internet protocols) |
| Catalogue entry | `inet-cert-chain` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/cert-chain/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | UL, DR |
| Topic / tags / level | `internet` / `tls` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **leaf, intermediate, root store; a missing intermediate; expiry clocks**.

The student: build a chain, remove links, advance time.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/21-web-posluzitelji.md` (Uvod u Linux): "TLS i certifikati: od čega se sastoji povjerenje i što se lomi kad istekne" (definitions *certifikat*, *rok valjanosti*, *tijelo za izdavanje certifikata*, *samopotpisan certifikat*, *lanac povjerenja*, *spremište povjerenja*, *sidro povjerenja*, *upozorenje TLS-a*; the `openssl`/`curl` sequence with exit statuses 7, 60, 60, 0, 60) and **Primjer 1 — „na HTTP-u radi, na HTTPS-u ne javlja ništa"**
- `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-21/` (chain vs trust-store diagram)
- RFC 5280 §4.1.2.5 (validity), §4.1.2.6 (subject), §6.1 (path validation); RFC 8446 / RFC 9846 §4.4.2 (Certificate message), §6.2 (`unknown_ca`, `certificate_expired`)
- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S4.md` (DR estate scenario, "three clocks at once") and `/home/rjasmin/projects/dr-lecture-estate/student/certs/tls-scan-2026-11-01.txt` (the dates used in the `expiry-clocks` preset)
- Catalogue seed: UL ch21, DR S4 → §5.5

## Overlaps (catalogue §5)

- **§5.5 TLS and certificates:** Handshake and chain are separate pages. Certificate expiry from the DR estate is a preset of inet-cert-chain. Revocation and ACME extend the chain page if they are built at all.

## Model and presets

- **Scene:** server side: the chain the server sends (leaf `CN=www1.lab.example`, optionally an intermediate), each certificate as a card with subject, issuer, `notBefore`/`notAfter`, and a signature arrow to its issuer. Client side: the client's trust store (anchors) and the client's clock. Between them, the validation path lit step by step, and the client's result: one exit status (the book's client gives the same status, 60, for three different faults) and the reason, named as the TLS alert where one exists.
- **State:** `{ serverSends: [cert], store: [cert], now (client clock), certs: { id: { subject, issuer, notBefore, notAfter, selfSigned, sigOk } }, listening443: bool, checks: [{ certId, kind, ok }], result: { exit, message } }`.
- **One step:** one check, in order: (0) can the client connect at all; (1) build the path: for the current certificate find a certificate whose subject = its issuer, among those the server sent, then in the store; (2) verify the signature with that issuer's key; (3) check `now` within `notBefore`…`notAfter`; (4) stop when the current certificate is a trust anchor in the store (success) or no issuer can be found (failure).
- **Rules:**
  1. A certificate is a signed statement that a public key belongs to a subject; the client must obtain and **check** it (UL ch21, definition *certifikat*; RFC 5280 §4.1.2.6).
  2. Path: each certificate points to the one that signed it, up to one that points to nobody (UL ch21, definition *lanac povjerenja*; RFC 5280 §6.1).
  3. The path must end at a trust anchor in the **client's** store, trusted because it arrived out of band, not because it is signed (UL ch21, definitions *spremište povjerenja*, *sidro povjerenja*; RFC 5280 §6.1.1).
  4. Self-signed leaf not in the store → rejected, reason "self-signed certificate in chain"; issuer the client does not know → rejected, reason "unable to get local issuer certificate" (protocol alert `unknown_ca`) (UL ch21 transcript; RFC 8446/9846 §6.2).
  5. The server must send the intermediates; the client store normally holds only roots, so a missing intermediate also ends in "unable to get local issuer certificate" (UL ch21: the server's certificate file must contain at least the leaf; RFC 8446 §4.4.2, check).
  6. Every certificate in the path must be valid at the **client's** clock: outside `notBefore`…`notAfter` → `(60) … certificate has expired` (alert `certificate_expired`) (UL ch21; RFC 5280 §4.1.2.5). A wrong client clock alone can cause or hide this.
  7. No connection at all is a different failure, a different exit status (7 in the book), before any certificate is seen (UL ch21: firewall without the HTTPS service).
  8. Tie-break: checks run leaf first and stop at the first failure, so the reported error is the lowest failing link.
- **Params:** toggle `https443Open`, default on; choice `serverCert` self-signed / signed-by-lab-CA / expired, default signed-by-lab-CA; toggle `sendIntermediate` (chain preset only), default on; toggle `anchorInStore`, default off; range `clockOffsetDays` −400…+800, default 0; button `advance-day` (key D).
- **Presets:**
  1. `book-five-states` — UL ch21's one command, five machine states: firewall closed → exit 7; server still uses the self-signed certificate that came with the package → 60 "self-signed certificate in certificate chain"; server uses `www1.crt` signed by `Laboratorijsko tijelo lab.example` → 60 "unable to get local issuer certificate"; the lab CA certificate added to the client's trust store → 0 and the page; expired `www1-istekao.crt` (notAfter 2025-06-01, client date 2026-09-05) → 60 "certificate has expired". From UL ch21.
  2. `missing-intermediate` — public-CA style chain root → intermediate → leaf; the server sends only the leaf → "unable to get local issuer certificate"; send the intermediate → ok. Derived, unchecked.
  3. `expiry-clocks` — student-visible estate scan (2026-11-01, status relative to 2026-11-02): wildcard `*.quillmoor.example` notAfter 2026-11-19 (17 days), `p4-commit` 2026-12-01 (29 days); advance the clock: once past the wildcard's notAfter (2026-11-19; the scan gives no time of day) it fails on all five endpoints that share it, while `p4-commit` still passes. From `student/certs/tls-scan-2026-11-01.txt` (DR S4); do not quote instructor caveats.
  4. `wrong-client-clock` — valid `www1.crt` (2026-09-05…2027-09-05), client clock set to 2028-01-01 → "certificate has expired" although nothing changed on the server. From UL ch21 ("satom onoga tko provjerava").
- **Steps:** `book-five-states` 5 states × 1–3 checks, about 12; `missing-intermediate` 6; `expiry-clocks` 5; `wrong-client-clock` 3.
- **Legend:** certificate cards (anchor with an anchor icon, intermediate, leaf), signature arrows, tick/cross per check, clock icon with the client date; "changed" marks the check or certificate changed this step.
- **Captions:** hr: "Lanac vodi do izdavatelja Laboratorijsko tijelo lab.example, ali njega nema u klijentovu spremištu povjerenja: klijent odbija vezu (izdavatelj nepoznat, upozorenje unknown_ca). Popravak je na klijentu." en: "The chain leads to the issuer Laboratorijsko tijelo lab.example, but it is not in the client's trust store: the client rejects the connection (unknown issuer, alert unknown_ca). The fix is on the client."
- **Terms:** *certificate* — certifikat; *certificate chain* — lanac povjerenja; *trust store* — spremište povjerenja; *trust anchor* — sidro povjerenja; *certificate authority (CA)* — tijelo za izdavanje certifikata; *self-signed certificate* — samopotpisan certifikat; *validity period* — rok valjanosti.
- **Misconceptions:** "an expired certificate is broken crypto" (the promise expired, UL ch21); "exit status 60 tells you what is wrong" (three faults share it; the message tells you); "the fix is always on the server".
- **Out of scope:** revocation (CRL/OCSP: `sec-pki-revocation`; note the estate's CRL date 2026-11-12 belongs there), name matching (SAN, RFC 9525) beyond a mention, ACME renewal (`acme-renewal` preset), certificate creation commands.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `cert-chain` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh cert-chain sims/cert-chain` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cert-chain/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
