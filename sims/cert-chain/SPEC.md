<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cert-chain: specification

One concept: **leaf, intermediate, root store; a missing intermediate; expiry clocks.** The client checks the chain a
server sends against **its own** trust store and **its own** clock; the student builds a chain, removes links and
advances time.

Task: `docs/tasks/w2/cert-chain.md`. Catalogue: `inet-cert-chain` (`docs/catalogue.md` §4.2, overlap §5.5).
Class: stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[UL21]** `uvod-u-linux/book/chapters/21-web-posluzitelji.md`, "TLS i certifikati: od čega se sastoji povjerenje i
  što se lomi kad istekne": definitions *certifikat*, *rok valjanosti*, *tijelo za izdavanje certifikata*,
  *samopotpisan certifikat*, *lanac povjerenja*, *spremište povjerenja*, *sidro povjerenja*, *upozorenje TLS-a*; the
  certificates `lab-ca.crt` (CN=Laboratorijsko tijelo lab.example, 2026-09-05 … 2036-09-02), `www1.crt`
  (CN=www1.lab.example, issuer the lab CA, 2026-09-05 … 2027-09-05), `www1-istekao.crt` (2025-01-01 … 2025-06-01),
  the package's `localhost.crt` (the client reports "self-signed certificate in certificate chain", so the file holds a
  leaf and the package's own self-signed CA); the client's date `Sat Sep 5 … 2026`; one command, five machine states with
  exit statuses **7, 60, 60, 0, 60** and the messages "Could not connect to server", "self-signed certificate in
  certificate chain", "unable to get local issuer certificate", (the page), "certificate has expired"; "satom onoga tko
  provjerava"; **Primjer 1** (no message at all means the conversation never started). The server's certificate file
  "must include at least the end-entity (leaf) certificate" (footnote on the server's certificate directive).
- **[UL21-fig]** `uvod-u-linux/assets/diagrams/chapter-21/lanac-povjerenja-i-spremiste.svg`: server side the chain
  (www1 → the lab CA, "subject and issuer are the same, the chain stops here"), client side the trust store ("added
  here by hand"), the decision on the client ("is that issuer in the store? if not, the fault is on the client").
- **[5280]** RFC 5280 §3.2 (obtain and validate), §4.1.2.5 (validity: "from notBefore through notAfter,
  inclusive"), §4.1.2.6 (subject), §6.1 and §6.1.1 (path validation; the trust anchor is an input, trusted because it
  arrived out of band), as quoted in [UL21]'s footnotes.
- **[8446]** RFC 8446 / RFC 9846 §4.4.2 (Certificate message: the sender's certificate first, each following one
  certifying the one before), §6.2 (`unknown_ca`, `certificate_expired`, `bad_certificate`). The `unknown_ca` and
  `certificate_expired` texts are quoted in [UL21]'s footnotes *(check: 9846's section numbers taken from the book's
  citation)*.
- **[DR-scan]** `dr-lecture-estate/student/certs/tls-scan-2026-11-01.txt` (student material): `CN=*.quillmoor.example`,
  public CA (OV, 397-day), notAfter 2026-11-19, "expires in 17 d", on five endpoints (hq-fw01, cloud-web01,
  git-cloud, rq-colo01:8082, tracklist01:443); `p4-commit:1666`, `CN=p4-commit`, self-signed, notAfter 2026-12-01,
  "expires in 29 d"; status relative to 2026-11-02. **[DR-S4]** `student/scenarios/S4.md` ("three clocks at once",
  Monday 2026-11-02). Nothing from `instructor/` is used.

## Scene

- **Server side**: the endpoint (`www1.lab.example:443`), whether port 443 lets the client in, and the certificates
  the server sends, leaf first, each a card: role (leaf / intermediate / self-signed), subject, issuer, `notBefore` …
  `notAfter`, and a clock line ("365 days left", "expired 461 days ago") at the client's date.
- **Client side**: the client's clock (its date; when it is off, the true date and the offset) and its trust store
  (the anchors, each a card with an anchor mark). The store always holds a public root (`Example Root CA`), as a
  client's system store does; the lab CA is in it only when added.
- **Between them**: the signature arrows (each card to the card that signed it, or to a dashed "?" when nobody has
  the issuer) and the checks, numbered, each with a tick or a cross; then the **result**: the exit status (7, 60, 0),
  the client's message, the TLS alert where one exists, and on which side the fix is.
- **Sequence strip** for stories with several states: one chip per state with its exit status once it has run
  (the book's 7 → 60 → 60 → 0 → 60).
- The estate story draws two rows (the wildcard chain served on five endpoints; p4-commit's self-signed
  certificate), each with its result at the client's date.

## State

```
{ story, scene, scenes, event, changed: [param keys], sceneStart,
  now, trueDay, offset, nowIso, trueIso,                 // days since 1970-01-01, and as YYYY-MM-DD
  store: [certId], certs: { id: { file, subject, issuer, notBefore, notAfter, selfSigned, sigOk } },
  connections: [{ endpoints: [name], listening443, serverSends: [certId], checks: [check], total, result, newCheck }],
  history: [null | [exit per connection]] }              // per scene, once it has run
check  = { certId, kind: 'connect' | 'issuer' | 'validity' | 'anchor', ok, issuerId?, from?: 'sent' | 'store', reason? }
result = { exit: 7 | 60 | 0, reason: null | 'connect' | 'self-signed' | 'unknown-issuer' | 'bad-signature' |
           'expired' | 'not-yet-valid', alert: null | 'unknown_ca' | 'certificate_expired' | 'bad_certificate',
           certId, fix: null | 'server' | 'client' }
```

The task's state names map so: `serverSends`, `store`, `now`, `certs`, `listening443`, `checks`, `result`.

## Rules

One validation runs, in order, one check per step (a scene change comes with its first check):

0. **connect**: can the client reach port 443 at all?
1. **issuer** (for the current certificate, starting with the leaf): find a certificate whose subject equals its
   issuer, **first among those the server sent, then in the client's store**; and (2) verify the signature with that
   issuer's key. Both are one check: "who signed it, and does the signature verify?".
3. **validity**: is the client's `now` within `notBefore` … `notAfter` (inclusive)?
4. **anchor**: when the current certificate is in the client's store, it is a trust anchor and the path ends
   (success), provided it is valid at the client's clock (rule 6).

Rules, with their sources:

1. A certificate is a signed statement that a public key belongs to a subject; the client must obtain and **check**
   it [UL21 *certifikat*; 5280 §3.2, §4.1.2.6]. Every card shows subject and issuer; the check is the client's.
2. **Path**: each certificate points to the one that signed it, up to one that points to nobody (self-signed)
   [UL21 *lanac povjerenja*; 5280 §6.1]. Test: `www.example.com → Example Issuing CA 1 → Example Root CA`.
3. The path must end at a **trust anchor in the client's store**, trusted because it arrived out of band, not
   because it is signed [UL21 *spremište*, *sidro povjerenja*; 5280 §6.1.1]. A root the server sends but the client
   does not hold is not an anchor (test: server sends the lab CA too, store without it → "self-signed certificate in
   certificate chain").
4. **Self-signed** certificate not in the store → exit 60, "self-signed certificate in certificate chain"; issuer the
   client cannot find → exit 60, "unable to get local issuer certificate". Both are alert `unknown_ca` [UL21
   transcript; 8446 §6.2]. The package's certificate is modelled as the book's client saw it: a leaf `CN=localhost`
   signed by the package's own `CN=localhost CA`, both sent; the path reaches that CA, which is self-signed and not
   held. *(check: the book names `unknown_ca` for the unknown issuer only; the self-signed case is
   mapped to `unknown_ca` too, as a client that cannot match the certificate with a known anchor does.)*
5. **The server must send the intermediates**; the store normally holds only roots, so a missing intermediate also
   ends in "unable to get local issuer certificate" [UL21 footnote: the file must include at least the leaf; 8446
   §4.4.2]. Test: `missing-intermediate` state 1.
6. **Every certificate in the path is checked at the client's clock**, the anchor included: outside
   `notBefore`…`notAfter` → exit 60, "certificate has expired" (after `notAfter`) or "certificate is not yet valid"
   (before `notBefore`), alert `certificate_expired` ("has expired or is not currently valid") [UL21; 5280
   §4.1.2.5; 8446 §6.2]. A wrong client clock alone can cause or hide this [UL21 "satom onoga tko provjerava"].
   RFC 5280 §6.1 treats the anchor as an input and does not check its dates; clients do, and the estate's
   p4-commit (a self-signed certificate the client holds as its anchor) expires that way [DR-scan].
7. **No connection** is a different failure with a different exit status (7), before any certificate is seen; there
   is no TLS alert because the conversation never started [UL21, Primjer 1].
8. **Tie-break: leaf first, stop at the first failure**, so the reported error is the lowest failing link. Within one
   certificate: issuer before signature before date (an expired leaf whose issuer is unknown reports the unknown
   issuer). Issuer search: the certificates sent (in the order sent) before the store (in store order); a certificate
   already in the path is not searched again.
9. **Where the fix is** (the result names it; the task's misconception "the fix is always on the server"):
   no connection → server (its firewall); self-signed leaf, or a self-signed CA made on the machine for itself
   (`localOnly`, the package's CA) → server (use a certificate from a CA clients trust); another self-signed root sent
   but not held → client; unknown issuer that is a root → client (add the anchor); unknown issuer that is an
   intermediate → server (send it); an anchor out of date → no single side (none shown); date fault while the
   certificate is valid on the true date → client (its clock); otherwise a date fault → server (renew); bad
   signature → server. The issuer's kind is read from the certificates `validate()` is given.
10. **Signature**: each certificate has `sigOk`; a false one fails the issuer check with "certificate signature
    failure", alert `bad_certificate` [8446 §6.2]. No preset breaks a signature (out of the concept; the
    `sec-digital-signature` page owns it); the rule is in the model and tested.

Dates are whole days (`dayOf`/`isoOf`, no `Date`), and the window is inclusive [5280 §4.1.2.5]: on its `notAfter` day
a certificate is still valid, the next day it is expired.

## Params

| key | control | values | default | notes |
|---|---|---|---|---|
| `story` | none (set by presets) | `book`, `intermediate`, `clocks`, `one` | `book` | the sequence of machine states |
| `https443Open` | toggle | | off | the book's first state; the task's default "on" is preset 5's |
| `serverCert` | choice | `self`, `lab`, `expired`, `public` | `self` | `public` = the public-CA chain; the task's default `lab` is preset 5's |
| `sendIntermediate` | toggle | | off | only with `public` |
| `anchorInStore` | toggle | | off | the lab CA in the client's store |
| `clockOffsetDays` | range | −400 … +800 | 0 | how far the client's clock is off the true date |
| advance a day | button, key **D** | | | `clockOffsetDays + 1` |

**Stories**: the params set the first machine state; each event then changes it (an event that changes nothing still
makes a state, and the caption says so). The client's clock offset applies to every state.

- `book`: events open the firewall → server uses `www1.crt` → lab CA into the store → server uses `www1-istekao.crt`.
- `intermediate`: event: the server sends the intermediate too.
- `clocks`: the estate, fixed; the true date moves 2026-11-02 → 11-18 → 11-19 → 11-20 → 12-01 → 12-02.
- `one`: one state, no events (build your own).

## Presets and expected numbers

Checked with `node` before the page was written (script output in NOTES.md, "Checks"); asserted in `sim.test.js`.

1. **`book-five-states`** (= the defaults) [UL21]: client date 2026-09-05. 14 steps.
   - state 1, port 443 closed: connect ✗ → **7**, no alert, fix server.
   - state 2, firewall opened, the package's `localhost.crt` (leaf + its own CA): connect ✓, issuer ✓ (the package CA,
     sent), validity ✓, issuer ✗ at the package CA → **60** "self-signed certificate in certificate chain",
     `unknown_ca`, fix server.
   - state 3, `www1.crt` signed by the lab CA: connect ✓, issuer ✗ → **60** "unable to get local issuer
     certificate", `unknown_ca`, fix client (the task's caption).
   - state 4, lab CA in the client's store: connect ✓, issuer ✓ (found in the store), validity ✓ (365 days left),
     anchor ✓ → **0**.
   - state 5, `www1-istekao.crt` (notAfter 2025-06-01): connect ✓, issuer ✓, validity ✗ (expired 461 days ago) →
     **60** "certificate has expired", `certificate_expired`, fix server.
   - Sequence 7 → 60 → 60 → 0 → 60; steps 1 + 4 + 2 + 4 + 3 = **14** (task: "about 12"; NOTES.md, Deviations).
2. **`missing-intermediate`** (derived, unchecked): root → intermediate → `www.example.com`, port open, client date
   2026-09-05. 8 steps.
   - state 1, the server sends only the leaf: connect ✓, issuer ✗ → **60** "unable to get local issuer certificate",
     fix **server** (send the intermediate).
   - state 2, leaf + intermediate: connect ✓, issuer ✓ (sent), validity ✓, issuer ✓ (store), validity ✓, anchor ✓ →
     **0**. Steps 2 + 6 = **8** (task: 6; NOTES.md, Deviations).
3. **`expiry-clocks`** [DR-scan, DR-S4]: two rows, store = { Example Root CA, p4-commit }. Six dates, step 0 the first,
   so **5** steps.
   - 2026-11-02: wildcard 17 days left, p4-commit 29 → both **0**.
   - 2026-11-18: 1 and 13 → 0, 0. 2026-11-19: 0 (last day) and 12 → 0, 0.
   - 2026-11-20: wildcard expired 1 day ago → **60** `certificate_expired` on all five endpoints; p4-commit 11 days
     left → **0**.
   - 2026-12-01: p4-commit's last day → 60, 0. 2026-12-02: both expired → 60, 60 (p4-commit's an anchor out of date:
     no fix side shown).
   - The client's clock offset moves the client's date in this story too (the strip and caption keep the true dates);
     at −400 the client's date is 2025-09-28, before the wildcard's notBefore → "not yet valid".
   - The scan gives no time of day, so the wildcard is shown valid through 2026-11-19 and expired from 11-20.
4. **`wrong-client-clock`** [UL21]: `www1.crt` (2026-09-05 … 2027-09-05), lab CA in the store, true date 2026-09-05,
   client clock 2028-01-01 (offset **+483**). connect ✓, issuer ✓, validity ✗ (expired 118 days ago at the client's
   date) → **60** "certificate has expired", fix **client** (its clock). **3** steps.
5. **`build`**: one state with the task's defaults (port open, `www1.crt`, no anchor): connect ✓, issuer ✗ → 60
   unknown issuer, fix client. 2 steps; the student changes the params.

Clock range at the book's date: −400 → 2025-08-01 (`www1.crt` not yet valid: fix client), +800 → 2028-11-13.

## Simplifications

- **Check order (task rule 8, kept).** The model checks leaf first, each certificate's issuer and then its date, and
  reports the lowest failing link. RFC 5280 §6.1 builds the whole path first and then processes it from the anchor
  down, and common clients do the same, so where two certificates fail at once a real client may name the higher one
  (e.g. the book's state 4 at a negative clock offset: `www1.crt` and the lab CA both start on 2026-09-05; the model
  blames `www1.crt`, a client the lab CA). Both are "not yet valid" with the fix on the client. Owner decision, in the
  report.
- **Issuer search order** (task rule): the certificates sent, then the store. Common clients look in the store first;
  no preset shows the difference.
- **Signature failure alert:** `bad_certificate` as RFC 8446 §6.2 describes it; some clients send `decrypt_error`.

- **Whole days.** Real certificates carry a time of day (`www1-istekao.crt`: `Jun 1 00:00:00 2025 GMT`); the model
  counts days with an inclusive window.
- **Names are not matched** (SAN / RFC 9525 out of scope). The package certificate's subjects are shown as
  `CN=localhost` and `CN=localhost CA` *(check: the book shows the file name `localhost.crt` and the client's message,
  not the subjects)*, and their dates as the day the book's machine made them (2026-09-05 … 2027-09-05) *(check)*.
- The public chain (`Example Root CA`, `Example Issuing CA 1`, `www.example.com`, their dates) is invented
  (documentation names); the wildcard's issuer in the estate is "public CA (OV, 397-day)" [DR-scan], drawn as the same
  invented intermediate and root. The wildcard's `notBefore` (2025-10-18) is notAfter − 397 days (with the inclusive window that is 398 calendar days;
  invented anyway); p4-commit's
  `notBefore` (2024-12-01) is invented.
- The client's messages are shown as the book prints them (data, untranslated); no tool is named.
- Revocation (CRL/OCSP: `sec-pki-revocation`; the estate's CRL date 2026-11-12 belongs there), ACME renewal and
  certificate creation are out of scope.
