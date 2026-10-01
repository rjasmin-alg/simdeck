# pki-revocation: Revocation: CRL vs OCSP

| | |
|---|---|
| Task | `pki-revocation` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-pki-revocation` in `docs/catalogue.md` §4.3 |
| Kind | **add a preset to `sims/cert-chain/`** (no page of its own) |
| Folder | `sims/cert-chain/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | NLA, SEC |
| Topic / tags / level | `security` / `tls` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `cert-chain` merged; only one preset task per host folder at a time |

## Goal

One concept: **how a revoked certificate is (or isn't) noticed; stapling**.

The student: revoke, then connect with different checks.

This is a **preset on `cert-chain`** (Chain of trust and expiry), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.
5. `sims/cert-chain/` (the host page) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T50 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T50 → §5.5
- RFC 5280, *Internet X.509 PKI Certificate and CRL Profile*, §3.3 (revocation vs validity) and §5 (CRL).
- RFC 6960, *X.509 Internet PKI Online Certificate Status Protocol — OCSP*.
- RFC 6066, *TLS Extensions*, §8 Certificate Status Request (OCSP stapling).
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, T50 „PKI u kući — vlastito tijelo, izdavanje, opoziv, obnavljanje po mjerilu" (course term *opoziv*; chapters not written yet — mark derived numbers *(check)*).
- Host: `sims/cert-chain/` (chain building and verdict this extends).

## Overlaps (catalogue §5)

- **§5.5 TLS and certificates:** Handshake and chain are separate pages. Certificate expiry from the DR estate is a preset of inet-cert-chain. Revocation and ACME extend the chain page if they are built at all.

## Model and presets

- **Preset task:** adds revocation checking to the host sim `cert-chain` (`sims/cert-chain/`): presets, their
  strings and tests only, no new page. Describes the revoked-certificate scenarios the host must render.
- **What this adds:** a server certificate can be *revoked* before it expires, and whether a client notices depends
  on which check it does: nothing, a CRL, OCSP, or OCSP stapling. The preset drives a "revoke, then connect" flow
  on the chain the host already draws.
- **Host model must support (requests if missing):** per-certificate fields `revoked` (bool) and `revokedAt`; a CA
  side that can publish a CRL (a list of revoked serial numbers with a `thisUpdate`/`nextUpdate` window) and answer
  an OCSP query (good / revoked / unknown); a client `revocationCheck` param (none/CRL/OCSP/stapled) and a
  `responderReachable` toggle; a verdict that combines chain validity with revocation status
  (valid / revoked / unknown-soft-fail / unknown-hard-fail). If the host state cannot carry these, request: add
  `revoked`, `crl`, `ocsp` and `revocationCheck` to `cert-chain`'s state and a verdict step after chain validation.
- **Rules (added to the host's):**
  1. Revocation is separate from expiry: a revoked cert is still within its validity dates (RFC 5280 §3.3).
  2. `none`: a revoked cert is accepted — the common real-world default, and the reason revocation often fails
     silently (RFC 5280; derived).
  3. CRL: the client fetches the CA's signed list; the cert is rejected iff its serial is on a list whose
     `nextUpdate` has not passed; a stale CRL may miss a recent revocation (RFC 5280 §5).
  4. OCSP: the client asks the responder about one serial and gets good/revoked/unknown (RFC 6960); if the
     responder is unreachable, browsers typically *soft-fail* (accept), which an attacker can force by blocking it
     (RFC 6960; soft-fail is behavioural *(check per client)*).
  5. OCSP stapling: the server presents a recent, CA-signed OCSP response in the handshake, so the client needs no
     separate fetch and blocking the responder does not help the attacker (RFC 6066 §8 Certificate Status Request).
  Tie-break: if both expiry and revocation would fail, report expiry first (it is checked first in the host).
- **Params (added):** `revocationCheck` choice none/CRL/OCSP/stapled (none); `revokeServerCert` toggle (off);
  `responderReachable` toggle (on); `crlFresh` toggle (on).
- **Presets:**
  - `revoked-unchecked` server cert revoked, check=none: connection accepted. From RFC 5280 (default behaviour),
    outcome derived.
  - `crl-catches` revoked, CRL, fresh list: rejected. From RFC 5280 §5.
  - `stale-crl` revoked after the CRL's `thisUpdate`, stale list: accepted (miss). Derived.
  - `ocsp-good` not revoked, OCSP reachable: good → accepted. From RFC 6960.
  - `ocsp-blocked` revoked, OCSP, responder unreachable: soft-fail → accepted (the attacker blocks the responder).
    Derived from soft-fail behaviour *(check)*.
  - `stapled` revoked, stapling on: the stapled response shows revoked → rejected even with the responder blocked.
    From RFC 6066 §8.
- **Steps:** the host chain steps + 2 (fetch/evaluate revocation, verdict); keep each preset ≤ the host's budget.
- **Legend (added):** revoked (strike-through / crossed seal on the cert), CRL list, OCSP query+response, stapled
  response (attached to the server), verdict colours (ok/warn/danger), changed marks the cert or response acted on.
- **Captions:** hr: "Certifikat je opozvan, ali klijent ne provjerava opoziv — veza se ipak uspostavlja." / en:
  "The certificate is revoked, but the client does not check revocation — the connection is established anyway." —
  hr: "OCSP odgovor je priložen u rukovanju: blokiranje poslužitelja za opoziv više ne pomaže napadaču." / en:
  "The OCSP response is stapled into the handshake: blocking the responder no longer helps the attacker."
- **Terms:** revocation — opoziv (NLA T50); certificate revocation list — popis opozvanih certifikata (CRL); OCSP —
  OCSP (protokol statusa certifikata) *(check)*; stapling — prilaganje statusa *(check)*; soft-fail — meki
  neuspjeh *(check)*; serial number — serijski broj; responder — poslužitelj za opoziv *(check)*.
- **Misconceptions:** expiry and revocation are the same; a revoked cert always fails to connect (depends on the
  check); OCSP is strictly better than CRL (soft-fail undermines it; stapling fixes that).
- **Out of scope:** CRLSets/OneCRL push lists, short-lived certs as an alternative, OCSP Must-Staple as more than a
  mention, the chain building itself (host `cert-chain`).

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cert-chain/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
