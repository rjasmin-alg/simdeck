# ftp-active-passive: Active vs passive FTP

| | |
|---|---|
| Task | `ftp-active-passive` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-ftp-active-passive` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/ftp-active-passive/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `internet` / `nat` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `nat` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **the second connection and why NAT breaks active mode**.

The student: connect through NAT in both modes.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/nat/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` (Uvod u računalne mreže): "FTP: prijenos datoteka i njegova nesigurnost" (USER/PASS in clear text, FTPS, SFTP is a different protocol) and **Primjer 5: lozinka u snimljenom prometu**. The book does not cover active vs passive mode; those rules come from RFC 959 and RFC 1579.
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` "NAT: kad više uređaja dijeli jednu adresu" and **Primjer 4: tablica PAT-a — zašto odlazna sesija radi sama, a dolazna ne**
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/nat.html` and `pat.html` (existing NAT/PAT pages, the `nat` task's model)
- RFC 959 §2.3, §3.2, §4.1.2 (PORT, PASV, reply 227); RFC 1579 "Firewall-Friendly FTP"; RFC 2428 (EPRT/EPSV); RFC 2577 (FTP security considerations); RFC 4217 (FTPS)
- Catalogue seed: URM ch14

## Model and presets

- **Scene:** client `192.168.1.10` behind a NAT router (public `203.0.113.5`), the Internet, and an FTP server `198.51.100.20`. Two connections drawn separately: the control connection (port 21) and the data connection (opened for each listing or transfer). The NAT table (inside addr:port ↔ outside addr:port) is shown and updates; a firewall/NAT "inbound without a mapping is dropped" gate sits on the router.
- **State:** `{ mode: 'active'|'passive', nat: [{ inside, outside, remote }], helper: bool, control: { up, lastCmd, lastReply }, data: { from, to, ok|null }, serverFirewall: { passiveRangeOpen } }`.
- **One step:** one command/reply or connection attempt, in order: (1) control connection (client → server:21, NAT mapping created); (2) USER/PASS (shown, with a note that they are in clear text); (3) `PORT` or `PASV` and its reply; (4) the data connection attempt through the NAT and firewall; (5) the transfer result (`150` … `226`, or failure).
- **Rules:**
  1. FTP uses a control connection to port 21 and separate data connections (RFC 959 §2.3, §3.2).
  2. Active mode: the client sends `PORT h1,h2,h3,h4,p1,p2` (its address and a port = p1 × 256 + p2) and the **server opens** the data connection from its port 20 to that address (RFC 959 §3.2, §4.1.2).
  3. Passive mode: the client sends `PASV`; the server replies `227 Entering Passive Mode (h1,h2,h3,h4,p1,p2)` and the **client opens** the data connection (RFC 959 §4.1.2; RFC 1579).
  4. A NAT/stateful firewall forwards inbound connections only when a mapping exists; an inbound connection nobody asked for is dropped (`nat` model; URM ch11 "NAT", Primjer 4 on PAT: "odlazna sesija radi sama, a dolazna ne").
  5. So active mode through client-side NAT fails twice over: `PORT` carries the private address 192.168.1.10, and an inbound connection has no mapping. Passive mode works because the data connection is outbound like the control one.
  6. A NAT helper (application-level gateway) that reads the control connection can rewrite `PORT` to the public address and pre-create the mapping, making active mode work; it cannot do so if the control connection is encrypted (FTPS) (check; RFC 4217 on FTPS).
  7. Passive mode moves the problem to the server side: its firewall must allow inbound connections to the server's configured passive port range (check).
  8. `USER`/`PASS` travel in clear text in plain FTP (RFC 2577; URM ch14 "FTP", Primjer 5).
- **Params:** choice `mode` active/passive, default active; toggle `natHelper`, default off; toggle `serverPassiveRangeOpen`, default on; toggle `ftps` (encrypted control), default off.
- **Presets** (addresses from RFC 5737 documentation ranges; derived, unchecked):
  1. `active-through-nat` — `PORT 192,168,1,10,195,80` (port 50000); the server's connect from 198.51.100.20:20 to 192.168.1.10:50000 cannot be routed, and even to 203.0.113.5 no mapping exists → no listing, the control connection waits until timeout.
  2. `passive-through-nat` — `PASV` → `227 Entering Passive Mode (198,51,100,20,117,48)` (port 30000); the client connects out to 198.51.100.20:30000, the NAT adds a mapping → `150`, `226 Transfer complete`.
  3. `active-with-helper` — helper on: `PORT` rewritten to `203,0,113,5,…` and a mapping pre-created → active works.
  4. `helper-vs-ftps` — helper on, FTPS on: the helper cannot read `PORT`, active fails again; passive still works.
  5. `server-firewall` — passive, server firewall without the passive range: the client's outbound data connection is blocked at the server.
- **Steps:** `active-through-nat` 5; `passive-through-nat` 5; `active-with-helper` 5; `helper-vs-ftps` 5; `server-firewall` 5.
- **Legend:** solid line = control connection, dashed = data connection, arrow direction = who opens it; NAT table rows (new row highlighted), blocked attempt drawn with a cross at the gate; "changed" marks the NAT row or connection changed this step.
- **Captions:** hr: "Aktivni način: poslužitelj otvara podatkovnu vezu prema 192.168.1.10:50000. Ta privatna adresa nije dostupna s interneta, a NAT za dolaznu vezu nema zapis. Ispis direktorija ne stiže." en: "Active mode: the server opens the data connection to 192.168.1.10:50000. That private address is not reachable from the Internet and the NAT has no entry for an inbound connection. The listing never arrives."
- **Terms:** *control connection* — upravljačka veza (check); *data connection* — podatkovna veza (check); *active / passive mode* — aktivni / pasivni način; *NAT* — prevođenje adresa (NAT, URM ch11); *application-level gateway* — pomoćnik za protokol (check); *mapping* — zapis u tablici NAT-a.
- **Misconceptions:** "FTP is one connection"; "passive mode is more secure" (it is just connectable); "the firewall blocks FTP" (it blocks the second connection).
- **Reuse from `nat`:** the NAT translation table and the inbound/outbound rule; new here are the two FTP connections and the address inside `PORT`/`227`.
- **Out of scope:** EPRT/EPSV and IPv6 (mention RFC 2428), FXP, SFTP (a different protocol over SSH, URM ch14), FTP commands beyond those listed.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ftp-active-passive sims/ftp-active-passive` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ftp-active-passive/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
