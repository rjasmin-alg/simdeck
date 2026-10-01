# mfa-phishing: MFA fatigue and adversary-in-the-middle

| | |
|---|---|
| Task | `mfa-phishing` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-mfa-phishing` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/mfa-phishing/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | SEC |
| Topic / tags / level | `security` / `authentication` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **push bombing and session-token theft defeat weak MFA**.

The student: step attacks against OTP, push, FIDO2.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.

## Sources

- Local course material: URM ch18 (below). For push fatigue, cookies and FIDO2 use vendor and standards documents; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- URM ch18 „Tko je to, i smije li: autentikacija, nadzor pristupa i revizija", Što treba znati (four means, MFA, AAL1–3; NIST SP 800-63B-4 as quoted in footnote `nist80063b-mfa`) and Šire o temi; Primjer 6 (MFA koji ipak ne zaustavlja *phishing*).
- RFC 6238 (TOTP) §4; W3C *Web Authentication: An API for accessing Public Key Credentials, Level 2* (RP ID, origin); OWASP *Session Management Cheat Sheet*; Microsoft Learn, number matching in Microsoft Authenticator push notifications *(check title)*.

## Model and presets

- **Scene:** K1-style sequence with four lifelines: user (browser), phishing proxy on a look-alike domain
  (`micros0ft-login.example`), the real login service, and the attacker's browser. A card per factor in play
  (password, SMS/TOTP code, push prompt, FIDO2 key). The session cookie is a distinct token that ends up with
  whoever receives it.
- **State:** `{ method: 'otp'|'push'|'push-number'|'fido2', phase, user: {onFakeSite, approvals}, proxy:
  {password, code, cookie}, server: {sessions: [{to, valid}]}, attacker: {hasSession}, outcome }`.
- **One step:** one message: 1 phishing mail, user opens the fake site; 2 user types the password, proxy relays it
  to the real site in real time; 3 real site asks for the second factor; then per method: OTP 4 user receives
  the code, 5 types it on the fake page, 6 proxy relays it within its validity window, 7 server issues the session
  cookie to the proxy, 8 attacker imports the cookie and is logged in (MFA "passed"). Push (attacker has the
  password): 4–8 repeated prompts, the user approves one at night; push with number matching: the user cannot
  type the number shown only on the attacker's screen → denied. FIDO2: 4 the browser asks the key to sign the
  challenge for the origin it sees (`micros0ft-login.example`); 5 the key has no credential for that RP ID →
  nothing to sign; 6 login fails, the proxy gets no cookie.
- **Rules:**
  1. MFA = more than one of the four means (know, have, are, do) (URM ch18 „Tko je to, i smije li…", NIST SP
     800-63B-4 as quoted).
  2. A code the user types can be relayed: real-time phishing defeats SMS/OTP (URM ch18 Primjer 6).
  3. TOTP codes are valid for a time step (30 s default) (RFC 6238 §4); the proxy relays well inside it.
  4. After login the session cookie is the credential; whoever holds it is logged in without any factor
     (textbook; OWASP *Session Management Cheat Sheet*).
  5. Push fatigue: repeated prompts until one is accepted; number matching requires a value shown on the login
     screen, which only the attacker sees (Microsoft doc *How number matching works in MFA push notifications*
     *(check title)*).
  6. FIDO2/WebAuthn binds the signature to the origin (RP ID); a look-alike domain gets no assertion (W3C
     *Web Authentication* Level 2, RP ID and origin checks). This is phishing resistance, required as an option at
     AAL2 and inherent at AAL3 (URM ch18, AAL paragraph).
  Edge case: AAL2 offers a phishing-resistant option but does not stop the user picking SMS (URM ch18 Primjer 6).
- **Params:** `method` choice OTP/push/push+number/FIDO2 (OTP); `pushAttempts` range 1…10 (5; user approves the
  last one); `userNoticesDomain` toggle (off; on ends the run at step 2).
- **Presets:**
  - `book` SMS code on the fake page (URM ch18 Primjer 6): the attacker is logged in at step 8, MFA "satisfied".
    From URM ch18 Primjer 6.
  - `push-bomb` attacker has the password, sends 5 prompts, user approves the 5th. Derived.
  - `number-match` same, with number matching: all 5 fail. Derived from rule 5 *(check)*.
  - `fido2` FIDO2 key: login fails at step 6, no cookie. Derived from rule 6.
  - `cookie-only` attacker steals the cookie from the proxy after an OTP login and logs in from another country;
    no factor is asked again. Derived.
- **Steps:** `book` 8, `push-bomb` 8, `number-match` 8, `fido2` 6, `cookie-only` 9.
- **Legend:** message (arrow), credential card (password, code, push, key: distinct shapes), session cookie
  (token shape), attacker-held item (hatched), success (check), failure (cross), changed (kit highlight on the
  card or token that moved this step).
- **Captions:** hr: "Korisnik prepisuje SMS kôd na lažnu stranicu; posrednik ga istog trena prosljeđuje pravom
  poslužitelju." / en: "The user copies the SMS code into the fake page; the proxy forwards it to the real server
  at once." — hr: "FIDO2 ključ potpisuje samo za domenu koju vidi: za lažnu domenu nema što potpisati." / en: "The
  FIDO2 key signs only for the domain it sees: for the fake domain there is nothing to sign."
- **Terms:** multi-factor authentication — višefaktorska autentikacija (MFA); phishing — *phishing*;
  phishing-resistant — otporan na *phishing*; one-time code — jednokratni kôd; session cookie — kolačić sesije
  *(check)*; man in the middle — čovjek u sredini; authenticator — autentikator *(check)*; assurance level —
  razina pouzdanosti autentikacije (AAL).
- **Misconceptions:** any MFA stops phishing; the attacker needs the second factor again for every request; push
  approval is safe because "I would never approve a strange prompt".
- **Out of scope:** malware stealing cookies from the device, passkey sync, SIM swapping, conditional access
  policies.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh mfa-phishing sims/mfa-phishing` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/mfa-phishing/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
