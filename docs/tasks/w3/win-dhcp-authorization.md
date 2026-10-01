# win-dhcp-authorization: Authorizing a DHCP server

| | |
|---|---|
| Task | `win-dhcp-authorization` (wave 3, DHCP on Windows Server) |
| Catalogue entry | `win-dhcp-authorization` in `docs/catalogue.md` §4.5.4 |
| Kind | build a new simulator |
| Folder | `sims/win-dhcp-authorization/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `dhcp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dhcp-dora` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **an unauthorized Windows server stays silent; rogue servers that aren't Windows don't**.

The student: add servers with and without authorization.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.4.
5. `sims/dhcp-dora/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Authorize a DHCP server in Active Directory" / "DHCP Server Authorization" (domain members, workgroup servers and DHCPINFORM rogue detection, re-check interval); `Add-DhcpServerInDC` (PowerShell); DHCP Server event IDs 1046/1047 (check)
- RFC 2131 §3.4 (DHCPINFORM)
- Catalogue seed: → net-dhcp-rogue

## Model and presets

- **Scene:** K1 message sequence chart: lanes Client, DHCP1 (Windows, domain member), DHCP2 (Windows, domain member), WG1 (Windows, workgroup), ROGUE (a DHCP server that isn't Windows: any other DHCP software or a small router), and the AD box with the authorized-servers list (Configuration partition, `CN=NetServices`). Each Windows server shows its service state: serving / not serving (with the event it logged).
- **State:** `ad: { authorized: [ip] }`, `servers: [{ id, kind: windowsDomain|windowsWorkgroup|other, up, serving, lastCheck, scope }]`, `client: { state, lease }`, `msgs`, `t` (minutes).
- **One step:** one event: a server's start-up authorization check, its answer from AD, a client DORA message, or an admin action (authorize / unauthorize).
- **Rules:**
  1. A domain-member Windows DHCP server checks AD at service start and then periodically (every 60 min by default (check)); if its address/name is in the authorized list it serves, otherwise it does not answer clients and logs an event (event ID 1046 (check)) (Microsoft, "Authorize a DHCP server in Active Directory" (check)).
  2. Authorizing needs Enterprise Admins rights (or delegated rights on `NetServices`) (check).
  3. A workgroup Windows DHCP server sends DHCPINFORM on its segment at start and periodically; if a reply shows an authorized server of a domain, it stops serving; if none answers, it serves (rogue detection (check)).
  4. Unauthorizing a server stops it at its next check, not at once (check).
  5. A server that is not Windows doesn't know about AD authorization and answers every DISCOVER (RFC 2131 has no authorization).
  6. The client takes the first offer it receives (`dhcp-dora` rule 3); tie-break in the model: ROGUE is placed on the client's own segment and answers first.
  7. Authorization is not a security control against rogues: it only keeps Windows servers polite. The defence against rogues is DHCP snooping (`net-dhcp-rogue`).
- **Params:** `dhcp2Authorized` toggle (default off); `wg1` toggle (WG1 present, default off); `rogue` toggle (default off); button `authorize DHCP2`; button `unauthorize DHCP1`.
- **Presets:**
  1. `unauthorized-silent` — derived, unchecked: DHCP1 authorized, DHCP2 installed but not authorized → DHCP2 checks AD, finds itself missing, logs the event and stays silent; client leased from DHCP1.
  2. `authorize` — derived, unchecked: admin authorizes DHCP2 → at its next check it serves; caption warns: two servers with overlapping scopes need failover or split ranges.
  3. `workgroup-detects` — derived, unchecked: WG1 starts, sends DHCPINFORM, DHCP1 answers (authorized) → WG1 stops serving.
  4. `rogue-non-windows` — derived, unchecked: ROGUE (`192.168.88.0/24`) answers first → client gets `192.168.88.23` and gateway `192.168.88.1`: no network; DHCP1 is authorized and helpless.
  5. `unauthorize` — derived, unchecked: DHCP1 unauthorized at t = 10 min → still serving until its check at t = 60 min (check), then silent.
- **Steps:** unauthorized-silent 7; authorize 6; workgroup-detects 5; rogue-non-windows 6; unauthorize 6.
- **Legend:** server badges ✓ authorized / ✕ not authorized / ? not checked; service state ▶ serving / ■ silent; arrows as in `dhcp-dora`; AD lookup arrows dotted. "Changed" marks the server whose state changed and the newest message.
- **Captions:**
  - hr: "DHCP2 pita AD je li ovlašten. Nije na popisu, pa ne odgovara klijentima i zapisuje događaj — *unauthorized* (neovlašteni) poslužitelj šuti."
  - en: "DHCP2 asks AD whether it is authorized. It isn't on the list, so it doesn't answer clients and logs an event: an unauthorized server stays silent."
  - hr: "Poslužitelj koji nije Windows ne zna za AD i odgovara prvi. Klijent uzima prvu ponudu — ovlaštenje ga ne štiti."
  - en: "A server that isn't Windows knows nothing about AD and answers first. The client takes the first offer, and authorization doesn't protect it."
- **Terms:** authorization — ovlaštenje (ovlašćivanje poslužitelja); rogue DHCP server — lažni (neovlašteni) DHCP poslužitelj; workgroup — radna grupa; domain member — član domene; event log — dnevnik događaja; DHCP snooping — *DHCP snooping*.
- **Misconceptions:** "authorization stops rogue DHCP servers" (only Windows ones); "an authorized server is the only one clients will use"; "unauthorizing takes effect at once".
- **Out of scope:** DHCP snooping and trusted ports (`net-dhcp-rogue`), failover, IPv6, delegation of rights in AD.
- **Reuse from `dhcp-dora` (soft dependency):** the DORA sequence, first-offer selection and the K1 lanes; new: the authorization check and the server service state.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-dhcp-authorization` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-dhcp-authorization sims/win-dhcp-authorization` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-dhcp-authorization/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
