# win-kerberos: Kerberos

| | |
|---|---|
| Task | `win-kerberos` (wave 2b, Active Directory) |
| Catalogue entry | `win-kerberos` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-kerberos/` |
| Class | stepper |
| Size | M |
| Priority | P1 |
| Courses | WIN2, NLA |
| Topic / tags / level | `windows-admin` / `kerberos` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **AS → TGT, TGS → service ticket, AP; clock skew breaks it**.

The student: step a user opening a file share; skew the clock.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T57 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T57 → §5.6
- RFC 4120 (The Kerberos Network Authentication Service V5) §3.1 AS exchange, §3.2 client/server exchange, §3.3 TGS exchange, §5.2.7.2 PA-ENC-TIMESTAMP
- [MS-KILE] Kerberos Protocol Extensions (PAC, Windows error mapping)
- Microsoft Learn: "Kerberos authentication overview"; "Maximum tolerance for computer clock synchronization" (5 min); "Maximum lifetime for user ticket" (10 h), "Maximum lifetime for user ticket renewal" (7 days), "Maximum lifetime for service ticket" (600 min)

## Overlaps (catalogue §5)

- **§5.6 Kerberos:** One page, one model; the Linux course links it (MIT Kerberos and AD use the same exchanges).

## Model and presets

- **Scene:** K1 sequence chart, three lanes: `PC07` (user `ana`), `KDC` on DC01 (two halves: AS and TGS), `FS01` (`cifs/fs01.quillmoor.example`). Above each lane its keys (ana: key from password; KDC: krbtgt key, every account key; FS01: its own `FS01$` key) and its clock. Each ticket is drawn as a box labelled with whose key locks it (padlock + owner name), so the student sees who can open what.
- **State:** `{ clocks: { pc, kdc, fs }, cache: { tgt: null|{ expires }, st: { spn: { expires } } }, phase, error: null|code, log: [] }`.
- **One step:** one message (request or reply) or one check at a party; caption says what was encrypted with which key.
- **Rules (RFC 4120 §3.1–3.2; Microsoft: "Kerberos authentication overview"; [MS-KILE]):**
  1. AS-REQ carries pre-authentication: a timestamp encrypted with ana's key (PA-ENC-TIMESTAMP, RFC 4120 §5.2.7.2).
  2. The KDC decrypts it with ana's stored key and checks the timestamp is within the skew limit: 5 minutes (Kerberos policy "Maximum tolerance for computer clock synchronization", default 5 min). Outside → KRB_AP_ERR_SKEW (error 37).
  3. AS-REP: the TGT (encrypted with the krbtgt key; holds a session key and the PAC with ana's SIDs) plus that session key encrypted with ana's key. The client cannot read the TGT.
  4. TGS-REQ: TGT + authenticator (timestamp under the TGS session key) + target SPN `cifs/fs01.quillmoor.example`.
  5. The KDC finds the account owning the SPN (`FS01$`) and returns a service ticket encrypted with FS01's key, plus a service session key. No SPN found → KDC_ERR_S_PRINCIPAL_UNKNOWN; Windows then falls back to NTLM (`win-ntlm-vs-kerberos`).
  6. AP-REQ (inside SMB session setup): service ticket + authenticator. FS01 opens the ticket with its own key, checks the authenticator time (5 min skew) and its replay cache, builds ana's token from the PAC. The DC is not contacted.
  7. Lifetimes from the Default Domain Policy: user ticket (TGT) 10 h, renewal 7 days, service ticket 600 min (Microsoft: "Kerberos policy"). A cached, unexpired service ticket skips steps 4–5.
  8. Tie-break: skew is checked as |client − KDC| > limit; exactly 5:00 passes (check boundary).
- **Params:** `skewMin` range −10…+10 min step 1, default 0 (PC clock vs KDC); `byName` toggle (name vs IP) default on; `cached` toggle "service ticket already cached" default off; `hoursLater` range 0–12, default 0.
- **Presets (5):**
  - `open-share` — ana opens `\\fs01\projects`: AS-REQ, check, AS-REP, TGS-REQ, TGS-REP, AP-REQ, check, access. 8 steps. Derived, unchecked.
  - `skew-7` — PC clock +7 min → KDC rejects at step 2 with KRB_AP_ERR_SKEW; logon fails. 3 steps.
  - `skew-4` — +4 min → works; caption: "within 5 minutes". 8 steps.
  - `cached` — second access within 10 h: only AP-REQ and check. 2 steps.
  - `by-ip` — `\\10.10.0.20\projects`: no SPN for the address → step 5 fails → hand-off note to NTLM. 5 steps.
- **Steps:** max 8.
- **Legend:** message arrow, ticket (box with padlock and key owner), authenticator (small clock card), check (diamond); "changed" highlight marks the newly issued ticket and the key used.
- **Captions:** hr: "KDC vraća *TGT* (kartu za dobivanje karata) zaključan ključem `krbtgt`: `ana` ga nosi, ali ga ne može otvoriti." en: "The KDC returns a TGT locked with the `krbtgt` key: ana carries it but cannot open it."
  hr: "Sat na PC07 kasni 7 minuta za KDC-om, više od dopuštenih 5: KRB_AP_ERR_SKEW." en: "PC07's clock is 7 minutes off the KDC, more than the 5 allowed: KRB_AP_ERR_SKEW."
- **Terms:** ticket — karta (NLA T57); ticket-granting ticket — karta za dobivanje karata (check); key distribution center — centar za distribuciju ključeva (check); service principal name — ime principala usluge (check); authenticator — autentifikator (check); clock skew — razlika satova (check); session key — ključ sesije (check).
- **Misconceptions:** the password crosses the network; the file server asks the DC on every access; Kerberos needs the right time (it needs agreeing clocks, within 5 min).
- **Out of scope:** delegation (constrained/unconstrained), cross-realm referrals (`win-trusts`), PAC validation, encryption types, offline attacks on service tickets.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-kerberos sims/win-kerberos` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-kerberos/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
