# acme-renewal: ACME certificate renewal

| | |
|---|---|
| Task | `acme-renewal` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-acme-renewal` in `docs/catalogue.md` §4.2 |
| Kind | **add a preset to `sims/cert-chain/`** (no page of its own) |
| Folder | `sims/cert-chain/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `internet` / `tls` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `cert-chain` merged; only one preset task per host folder at a time; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **HTTP-01 vs DNS-01 challenge, 90-day automation**.

The student: step a renewal; break port 80.

This is a **preset on `cert-chain`** (Chain of trust and expiry), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/cert-chain/` (the host page) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/21-web-posluzitelji.md` (Uvod u Linux): "TLS i certifikati" (HTTP-01 on port 80 at `/.well-known/acme-challenge/`, ACME per RFC 8555, `certbot`, `certbot-renew.timer` with `OnCalendar=*-*-* 00/12:00:00`, `RandomizedDelaySec=12hours`, `Persistent=true`, enabled on install) and its "Šire o temi" (renew when less than a third of the lifetime remains, certbot ≥ 4.0.0; older docs: 30 days)
- RFC 8555 "Automatic Certificate Management Environment (ACME)" §8.3 (HTTP-01), §8.4 (DNS-01)
- Let's Encrypt documentation "Challenge Types"; Certbot documentation "Automated Renewals" (as cited in UL ch21)
- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T50 "PKI u kući — … obnavljanje po mjerilu" (follow-up course; chapters not written yet)

## Overlaps (catalogue §5)

- **§5.5 TLS and certificates:** Handshake and chain are separate pages. Certificate expiry from the DR estate is a preset of inet-cert-chain. Revocation and ACME extend the chain page if they are built at all.

## Model and presets

- **Kind:** a preset (or preset pair) on `sims/cert-chain/` (§5.5). The host's chain validation at a client clock stays as it is; this adds a day-scale timeline with a renewal agent.
- **What the presets show:** a 90-day certificate renewed automatically by an ACME client started from a timer, the challenge that proves control of the name, and the day it silently stops working.
- **What the host model must support** (request in the host's NOTES.md "Shared requests" if missing):
  1. Advancing the clock in days with events on a timeline (the host has `advance-day`).
  2. A renewal agent with a schedule: runs twice a day, with a random delay of up to 12 h (model it as a fixed offset, not randomness) and catch-up of a missed run at the next boot (UL ch21, the renewal timer shipped with the package).
  3. A challenge step drawn as a short message sequence between the CA and the server, with toggles for "port 80 reachable from outside" and "can write a DNS TXT record".
- **Rules:**
  1. The client renews a certificate when less than **one third** of its lifetime remains (the book's client version; older versions and docs say 30 days) (UL ch21 "Šire o temi"). For a 90-day certificate: renewal from day 60. Tie-break: exactly one third left counts as "not yet" (check).
  2. Running `renew` often is harmless: it does nothing unless rule 1 holds (UL ch21).
  3. HTTP-01: the CA gives a token; the client places a file at `http://<name>/.well-known/acme-challenge/<token>`; the CA fetches it **on port 80** from outside (RFC 8555 §8.3; UL ch21 and the CA documentation cited there).
  4. DNS-01: the client publishes a TXT record at `_acme-challenge.<name>`; nothing needs to listen (RFC 8555 §8.4). Wildcard names need DNS-01 (CA documentation, check).
  5. A failed challenge leaves the old certificate in place; the agent tries again at the next run until the certificate expires; after `notAfter` the host's rule 6 (expired) applies.
  6. Who runs the renewal is a property of the distribution's package (the timer is enabled on install on the book's system), not of the ACME client (UL ch21: "program zna obnoviti certifikat, a paket odlučuje kada ga se pita").
- **Presets:**
  1. `acme-healthy` — issued day 0, notAfter day 90; runs at 00:00 and 12:00; renewal succeeds on day 60 via HTTP-01; new notAfter day 150. Steps: 5 (issue, day 30 no-op, day 60 challenge, day 60 new cert, validation ok). From UL ch21 (rule 1, timer) and RFC 8555; dates derived.
  2. `acme-port80-closed` — the firewall opens only 443 (UL ch21 "TLS i certifikati" firewall step in reverse): HTTP-01 fails on every run from day 60; nobody reads the log; day 91 the client gets "certificate has expired". Steps: 6. Derived.
  3. `acme-dns01` — same closed port 80, challenge switched to DNS-01: renewal succeeds on day 60. Steps: 5. Derived.
  4. `acme-machine-off` — server off on days 59–62 with catch-up enabled: the missed run is caught up at boot on day 62 and renewal succeeds. Steps: 5. From UL ch21 (the catch-up paragraph), dates derived.
- **Legend additions:** timeline with run ticks (twice daily, collapsed into one tick per day), renewal window shaded from day 60, challenge arrows (HTTP-01 port-80 arrow, DNS-01 TXT arrow).
- **Captions:** hr: "Dan 60: do isteka je ostala trećina životnog vijeka. Klijent ACME pokreće izazov HTTP-01, ali port 80 je zatvoren i tijelo ne može dohvatiti datoteku. Stari certifikat ostaje do dana 90." en: "Day 60: one third of the lifetime is left. The ACME client starts the HTTP-01 challenge, but port 80 is closed and the CA cannot fetch the file. The old certificate stays until day 90."
- **Terms:** *ACME* — ACME (protokol za automatsko izdavanje); *challenge* — izazov; *renewal* — obnavljanje; *timer* — mjerač vremena (UL ch10/ch21); *certificate authority* — tijelo za izdavanje certifikata.
- **Misconceptions:** "the CA renews for me" (a timer on your machine does, if it is enabled and the challenge can pass); "HTTPS only needs port 443"; "renewal happens 30 days before expiry" (version-dependent).
- **Out of scope:** account keys and orders in detail, rate limits, revocation, deploy hooks reloading the web server (mention: a renewed file that the server never reloads still serves the old certificate, check).
- **Note for the coordinator:** the task header says both "build a new simulator" and "adds a preset to `sims/cert-chain/`"; this spec treats it as a preset task. The challenge exchange is a short second concept on the host; if the `cert-chain` author finds it too much for one page, it becomes its own small stepper.

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
