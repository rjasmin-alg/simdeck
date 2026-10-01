# win-ntlm-vs-kerberos: NTLM vs Kerberos

| | |
|---|---|
| Task | `win-ntlm-vs-kerberos` (wave 3, Active Directory) |
| Catalogue entry | `win-ntlm-vs-kerberos` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-ntlm-vs-kerberos/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2, SEC |
| Topic / tags / level | `windows-admin` / `kerberos`, `authentication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-kerberos` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **challenge-response vs tickets; when Windows falls back to NTLM; why pass-the-hash works**.

The student: authenticate by name and by IP, capture the hash.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.
5. `sims/win-kerberos/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- [MS-NLMP] NT LAN Manager (NTLM) Authentication Protocol §3.3.1 (NT hash), §3.3.2 (NTLMv2 response)
- RFC 4178 (SPNEGO); Microsoft Learn: "Microsoft Negotiate"; "NTLM overview"; "Kerberos with IP addresses (TryIPSPN)" (check title)
- `docs/tasks/w2/win-kerberos.md` (model reused for the Kerberos half)

## Model and presets

- **Scene:** K1 chart with lanes `PC07` (ana), `FS01`, `DC01`, and an "attacker sees" overlay (the kit's overlay) that collects what crossed the wire or sat in memory. Two panels side by side under the chart: "Kerberos" and "NTLM", each listing what the server needed from the DC and what an attacker could reuse. Reuses `win-kerberos`'s lanes, keys and ticket boxes for the Kerberos half.
- **State:** `{ target: 'name'|'ip', protocol: null|'kerberos'|'ntlm', wire: [], attacker: { hash: bool, capture: bool }, phase, log: [] }`.
- **One step:** one message; in the NTLM path the server's pass-through to the DC is its own step.
- **Rules:**
  1. Negotiate (SPNEGO, RFC 4178) tries Kerberos first; it falls back to NTLM when the client cannot get a service ticket: target given by IP address (no SPN; check: Windows 10 1507+/Server 2016 can use IP SPNs if registered and `TryIPSPN` set), name not in an AD realm, no DC reachable, or a local account (Microsoft: "Microsoft Negotiate").
  2. Kerberos path: as in `win-kerberos`, shown in 3 steps (TGS-REQ/REP and AP-REQ); FS01 never contacts the DC.
  3. NTLM: NEGOTIATE → CHALLENGE (server's 8-byte random challenge) → AUTHENTICATE (NTLMv2 response = HMAC-MD5 keyed by a key derived from the NT hash over the challenge and a client blob) ([MS-NLMP] §3.3.2).
  4. FS01 does not know ana's hash, so it passes the challenge and response to a DC (Netlogon pass-through); the DC verifies and returns the result and groups.
  5. NT hash = MD4(UTF-16LE(password)), no salt ([MS-NLMP] §3.3.1): two accounts with the same password have the same hash.
  6. Pass-the-hash: the response is computed from the hash, never from the password, so whoever holds the hash (taken from the memory of a machine where ana logged on) can answer any challenge as ana — no cracking needed.
  7. A captured challenge/response can only be attacked offline (guessing passwords); a strong password resists, a weak one falls (check: no numbers on cracking speed here).
- **Params:** `target` choice {`\\fs01\projects`, `\\10.10.0.20\projects`} default name; `attacker` choice {none, on-path observer, admin-on-PC07} default none.
- **Presets (4):**
  - `by-name` — Kerberos: TGS-REQ, TGS-REP, AP-REQ, access; DC contacted once for the ticket, FS01 alone checks. 4 steps. Derived, unchecked.
  - `by-ip` — NTLM: NEGOTIATE, CHALLENGE, AUTHENTICATE, pass-through to DC01, DC reply, access. 6 steps.
  - `capture` — `by-ip` with an on-path observer: overlay collects challenge + NTLMv2 response → "offline guessing only". 6 steps.
  - `pass-the-hash` — attacker is admin on PC07, holds ana's NT hash, then answers FS01's challenge from another host → access granted as ana without knowing the password. 7 steps.
- **Steps:** max 7.
- **Legend:** Kerberos message (solid), NTLM message (dashed), pass-through (dotted to DC), attacker overlay (eye icon); "changed" highlight marks the newest item the attacker gained.
- **Captions:** hr: "Pristup po IP adresi nema SPN, pa Windows prelazi na NTLM: poslužitelj šalje *challenge* (izazov) od 8 bajtova." en: "Access by IP address has no SPN, so Windows falls back to NTLM: the server sends an 8-byte challenge."
  hr: "Napadač ima NT *hash* (sažetak) korisnice ana i njime računa odgovor — lozinka mu ne treba." en: "The attacker holds ana's NT hash and computes the response with it — he never needs the password."
- **Terms:** challenge-response — izazov-odgovor (check); hash — sažetak (check URM ch18); pass-the-hash — napad prosljeđivanjem sažetka (check; keep the English term); fallback — povratak na NTLM (check); ticket — karta (NLA T57); service principal name — ime principala usluge (check).
- **Misconceptions:** NTLM is gone in modern Windows; a hash must be cracked before it is useful; Kerberos is used whenever there is a domain.
- **Out of scope:** NTLMv1/LM, relay attacks, overpass-the-hash and Kerberos RC4 keys, memory-isolation defences, disabling NTLM by policy (mention only).
- **Note for the coordinator:** pass-the-hash overlaps `lateral-movement` (w3) if that page covers credential reuse; link rather than repeat.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ntlm-vs-kerberos sims/win-ntlm-vs-kerberos` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ntlm-vs-kerberos/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
