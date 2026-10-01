# win-smb-session: An SMB session

| | |
|---|---|
| Task | `win-smb-session` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-smb-session` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-smb-session/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `file-sharing` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-kerberos` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **negotiate, session setup, tree connect, signing**.

The student: connect with different SMB versions.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/win-kerberos/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No Windows course book yet. Use Microsoft documentation (below); mark every rule and default you could not confirm with *(check)* and list it in `NOTES.md`.
- Microsoft documentation: [MS-SMB2] *Server Message Block (SMB) Protocol Versions 2 and 3* (negotiation §3.2.4, signing §3.1.5.1); *SMB security enhancements*, *Overview of SMB signing*, *SMB encryption*, *Pre-authentication integrity*, *Stop using SMB1*.
- Soft dep: `sims/win-kerberos/` (the authenticated-user token reused for Session Setup).

## Model and presets

- **Scene:** K1 message sequence chart with two lifelines, client and file server, and a panel of what has been
  agreed so far: dialect, whether signing/encryption is on, the authenticated user, and the connected tree (share).
  A small "what a tamperer on the wire can do" note updates as signing turns on. Stepper.
- **State:** `{ phase, offered: [dialects], dialect, signing: 'off'|'enabled'|'required', encryption,
  user, tree: share|null, tamper: {active, detected}, outcome }`.
- **One step:** 1 TCP connection to the server (port 445); 2 Negotiate: the client offers a list of dialects, the
  server picks the highest both support; 3 the negotiated dialect fixes which security features are available;
  4 Session Setup: the user authenticates (the credential exchange is delegated to `win-kerberos` / the provider,
  shown as one folded step); 5 a session key is established; 6 signing/encryption is settled from client and
  server policy; 7 Tree Connect to a share (\\server\share); 8 a request/response on the tree; 9 (tamper preset) a
  man on the wire alters a signed message → the signature check fails and the message is rejected.
- **Rules:**
  1. The session is built in order: Negotiate → Session Setup (authenticate) → Tree Connect; you cannot reach a
     share before authenticating (Microsoft MS-SMB2 §3.2.4; *SMB protocol overview*).
  2. Dialect: the server selects the highest dialect common to the client's offer; SMB1 is the legacy/insecure
     dialect, SMB3.x adds encryption (Microsoft *SMB security enhancements*; MS-SMB2 negotiation).
  3. Signing: when enabled, each message carries a signature derived from the session key; when required, an
     unsigned or altered message is rejected — this defeats tampering and man-in-the-middle relay (Microsoft *SMB
     signing*; MS-SMB2 §3.1.5.1).
  4. Encryption (SMB3): protects message contents on the wire; it is per-share or per-server policy and needs a
     3.x dialect (Microsoft *SMB encryption*).
  5. A pre-authentication integrity check (SMB 3.1.1) protects the Negotiate/Session Setup messages themselves from
     downgrade (Microsoft *Pre-authentication integrity*) *(check)*.
  6. Default signing policy differs by role and dialect (e.g. required when talking to a domain controller's SYSVOL)
     (Microsoft *Overview of SMB signing*) *(check exact defaults)*.
  Tie-break: if the client offers only a dialect the server has disabled (e.g. SMB1 off), negotiation fails and no
  session is formed; show that as an outcome, not a crash.
- **Params:** `clientOffers` choice SMB1 / up-to-SMB2 / up-to-SMB3 (up-to-SMB3); `serverMin` choice SMB1/SMB2/SMB3
  (SMB2); `signing` choice off/enabled/required (enabled); `encryption` toggle (off); `tamper` toggle (off).
- **Presets:**
  - `modern` client and server both to 3.1.1, signing required: negotiate 3.1.1, authenticate, tree connect,
     signed request succeeds. From MS-SMB2 negotiation and *SMB security enhancements*.
  - `downgrade-blocked` client offers SMB1..3, server minimum SMB2: SMB1 is not selected; 3.x is used. From
     Microsoft *Stop using SMB1*.
  - `tamper` signing required, a message altered on the wire: signature check fails, message rejected. From MS-SMB2
     §3.1.5.1.
  - `no-common-dialect` client offers only SMB1, server has SMB1 disabled: negotiation fails, no share. Derived.
  - `encrypted` SMB3 with per-share encryption on: contents unreadable on the wire. From *SMB encryption*.
- **Steps:** `modern` 8, `downgrade-blocked` 8, `tamper` 9, `no-common-dialect` 3, `encrypted` 8.
- **Legend:** message (arrow), negotiated feature chip (dialect, signing, encryption), signed message (seal),
  altered message (break mark), share/tree (folder), outcome colour, changed (kit highlight on the newest message
  and on a feature chip when it is settled).
- **Captions:** hr: "Pregovorom je odabran najviši zajednički dijalekt: SMB 3.1.1." / en: "Negotiation picked the
  highest common dialect: SMB 3.1.1." — hr: "Poruka je izmijenjena na putu, a potpis se ne poklapa: odbijena je."
  / en: "The message was altered in transit and its signature does not match: it is rejected."
- **Terms:** session — sesija; dialect — dijalekt; negotiate — pregovaranje; tree connect — spajanje na stablo
  *(check)*; share — dijeljeni resurs; signing — potpisivanje; encryption — šifriranje; man in the middle — čovjek
  u sredini.
- **Misconceptions:** SMB and the drive letter are the same thing (mapping is separate); signing encrypts the data
  (it only authenticates it against tampering); a newer client always means a newer dialect (the server's minimum
  decides).
- **Out of scope:** the authentication exchange internals (`win-kerberos`, `win-ntlm-vs-kerberos`), DFS referrals
  (`win-dfs`), oplocks/leases, multichannel, opening specific files.
- **Builds on `win-kerberos`:** reuses its authenticated-user token for Session Setup (shown as one folded step);
  new are dialect negotiation, signing/encryption settlement and tree connect.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-smb-session` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-smb-session sims/win-smb-session` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-smb-session/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
