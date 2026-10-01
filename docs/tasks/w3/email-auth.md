# email-auth: SPF, DKIM and DMARC

| | |
|---|---|
| Task | `email-auth` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-email-auth` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/email-auth/` |
| Class | stepper |
| Size | M |
| Priority | P1 |
| Courses | UL, SEC |
| Topic / tags / level | `internet` / `email` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `email-path` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **three checks, alignment, and the DMARC verdict**.

The student: send legitimate, forwarded and spoofed mails.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/email-path/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/20-elektronicka-posta.md` (Uvod u Linux): "Kako primatelj zna da je poruka doista vaša" (SPF, DKIM, DMARC; records `"v=spf1 a mx -all"`, `sel1._domainkey.lab.example`, `"v=DMARC1; p=none; rua=mailto:postmaster@lab.example"`; definitions *zapis pošiljatelja*, *kvalifikator*, *potpis poruke*, *selektor*, *domena autora*, *potvrđeni identitet*, *poravnanje identiteta*, *organizacijska domena*, *pravilo postupanja*, *način nadzora*), its "Šire o temi" (`p=reject` and mailing lists), **Primjer 3** (zone record checked where it is read) and **Primjer 4 — „ljudi nam ispadaju s dopisne liste"**
- `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-20/` (envelope vs header diagram)
- RFC 7208 (SPF) §2.4, §2.6.1, §4.6.2, §4.6.4, §5, §10.3; RFC 6376 (DKIM) §1, §6; RFC 8301, RFC 8463 (DKIM algorithms); RFC 9989 (DMARC, as cited in UL ch20) §1, §3.2.10, §7.2; RFC 7489 (original DMARC)
- Catalogue seed: UL ch20

## Model and presets

- **Scene:** kit view "decision path": a received message on the left (envelope MAIL FROM, connecting IP, `DKIM-Signature` with `d=` and `s=`, header `From:`), three check boxes in a row (SPF, DKIM, DMARC alignment) and a verdict box with the DMARC policy (`p=none/quarantine/reject`). A small DNS panel shows the three TXT lookups as the receiver makes them: `lab.example TXT`, `sel1._domainkey.lab.example TXT`, `_dmarc.lab.example TXT`.
- **State:** `{ msg: { ip, mailFrom, heloName, from, dkim: { d, s, intact } | null }, dns: { spf: { domain: record }, dkimKeys, dmarc: { domain: { p, aspf, adkim } } }, results: { spf: { result, domain }, dkim: { result, domain }, aligned: { spf, dkim } }, verdict, action }`.
- **One step:** one check, in order: (1) SPF on the MAIL FROM domain and connecting IP; (2) DKIM signature verification with the key at `s._domainkey.d`; (3) find the author domain from `From:` and fetch its DMARC record; (4) alignment of each passing identifier with the author domain; (5) DMARC result and the policy action.
- **Rules:**
  1. SPF checks the **envelope** MAIL FROM domain (DMARC uses only this one, not HELO) against the connecting IP (RFC 7208 §2.4, §4; UL ch20 "Kako primatelj zna…").
  2. SPF record terms are evaluated left to right; the first matching term decides; qualifier `+` pass, `-` fail, `~` softfail, `?` neutral, default `+`; `all` always matches and goes last; `a` matches A and AAAA of the domain; `mx` needs two lookups (MX, then addresses) (RFC 7208 §4.6.2, §5.1–5.4; UL ch20 on `"v=spf1 a mx -all"`).
  3. At most 10 DNS-querying terms per check, else `permerror`; no SPF record → `none` (RFC 7208 §4.6.4, §2.6.1; UL ch20).
  4. DKIM: a valid signature means domain `d=` takes some responsibility for the message; it says nothing about the author (RFC 6376 §1, §6; UL ch20 definition *potpis poruke*). A message changed in transit fails verification.
  5. DMARC passes if **SPF passes and its domain is aligned** with the `From:` domain, **or DKIM passes and its `d=` is aligned** (RFC 9989 as cited in UL ch20, check section; RFC 7489 §4.2 for the original).
  6. Alignment: relaxed = same organisational domain, strict = identical names; relaxed is the default (UL ch20 definitions *poravnanje identiteta*, *organizacijska domena*; RFC 9989 §3.2.10).
  7. Policy: missing `p` in a valid record = `p=none`; `none` delivers and reports, `quarantine` treats as suspicious, `reject` refuses (example reply `550 5.7.1 Email rejected per DMARC policy for example.com`) (UL ch20; RFC 9989 §7.2).
  8. Forwarding through a list changes the connecting IP, so SPF no longer aligns; a DKIM signature usually survives if the list does not modify the message (UL ch20 Primjer 4; RFC 7208 §10.3).
- **Params:** choice `scenario` (sets the message, `resets: true`); choice `policy` none/quarantine/reject, default none (lab record `p=none`); choice `aspf` relaxed/strict, default relaxed; toggle `signed`, default on; toggle `listModifiesSubject`, default off.
- **Presets:**
  1. `legit` — `ana@lab.example` from `posluzitelj.lab.example` (192.168.180.1), `"v=spf1 a mx -all"`, signed `d=lab.example s=sel1`. Outcome: SPF pass (via `mx`), DKIM pass, both aligned, DMARC pass. From UL ch20 (the lab records as the book reads them from the client side).
  2. `mailing-list-signed` — via `lista.example` (198.51.100.7), `p=reject`: SPF not aligned for `lab.example`; DKIM pass and aligned → DMARC pass. From UL ch20 Primjer 4.
  3. `mailing-list-unsigned` — same, `signed` off: DMARC fail, `p=reject` → refused; the list reads the refusal as a dead address and unsubscribes the reader. From UL ch20 Primjer 4.
  4. `spoof-own-domain` — `From: ana@lab.example`, MAIL FROM `x@zlo.example` from zlo's own server, signed `d=zlo.example`: SPF pass and DKIM pass, neither aligned → DMARC fail. From UL ch20 (RFC 9989 §1 on both passes being useless alone).
  5. `subdomain-alignment` — MAIL FROM `bounce@news.lab.example`, `From: lab.example`, SPF pass: relaxed → aligned, strict → not aligned. Derived from UL ch20 definitions.
- **Steps:** 5 per preset.
- **Legend:** pass tick, fail cross, neutral circle; alignment drawn as a line between the identifier and the `From:` domain (solid = aligned, broken = not); "changed" marks the check evaluated this step and the DNS record it read.
- **Captions:** hr: "SPF prolazi i DKIM prolazi, ali obje potvrđene domene su zlo.example, a u zaglavlju From: piše lab.example. Nema poravnanja, DMARC ne prolazi." en: "SPF passes and DKIM passes, but both authenticated domains are zlo.example while the From: header says lab.example. No alignment, so DMARC fails."
- **Terms:** *SPF record* — zapis pošiljatelja; *qualifier* — kvalifikator; *DKIM signature* — potpis poruke; *selector* — selektor; *author domain* — domena autora; *authenticated identifier* — potvrđeni identitet; *identifier alignment* — poravnanje identiteta; *organizational domain* — organizacijska domena.
- **Misconceptions:** "SPF checks the From: line"; "a DKIM pass means the mail is from who it says"; "p=reject is the safest choice" (it drops legitimate list mail, UL ch20 "Šire o temi").
- **Reuse from `email-path`:** the message with envelope and header, the domains and hosts; new here are the checks and DNS TXT lookups.
- **Out of scope:** ARC, aggregate report parsing, BIMI, the DKIM canonicalisation algorithms, key generation commands.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `email-auth` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh email-auth sims/email-auth` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/email-auth/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
