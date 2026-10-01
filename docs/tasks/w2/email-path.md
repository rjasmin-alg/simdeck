# email-path: The path of an e-mail

| | |
|---|---|
| Task | `email-path` (wave 2b, Internet protocols) |
| Catalogue entry | `inet-email-path` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/email-path/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | UL, URM |
| Topic / tags / level | `internet` / `email` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **MUA → MSA → MTA → MDA → IMAP; envelope vs header**.

The student: send a mail across two domains.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/20-elektronicka-posta.md` (Uvod u Linux): "Tko sve dodirne poruku prije nego što stigne" (RFC 5598 roles MUA/MSA/MTA/MDA, message store vs mailbox, envelope vs header, the `nc` dialogue, MX lookup, relay definition, ports 587 and 25), its "Šire o temi" (POP3 vs IMAP, ports 110/143/993, STARTTLS vs implicit TLS) and **Primjer 1 — „poslao sam, nije stiglo"**
- `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-20/` (path of one message with the log name of each step)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` (Uvod u računalne mreže): "E-pošta: slanje naspram dohvata" and **Primjer 4: poruka koju čita dvoje ljudi**; diagram `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch14-e-posta-slanje-dohvat.svg`
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6 "Primijenjeno: 11 stranica", card 8 "Aplikacijski slijedovi" (e-pošta, slanje i dohvat)
- RFC 5598 §4; RFC 5321 §2.3.10, §5.1; RFC 6409 §3.1, §4.3; RFC 9051 §1; RFC 1939 §1
- Catalogue seed: UL ch20, URM card ch14 (mail send vs fetch)

## Model and presets

- **Scene:** kit view K1 message sequence chart with lanes for the roles, two domains side by side: sender `ana@lab.example` (MUA) → MSA on `posluzitelj.lab.example:587` → MTA (same host) → receiving MTA `mx.drugdje.example:25` → MDA → message store / mailbox → `ivan@drugdje.example`'s MUA over IMAP (143/993) or POP3 (110). A DNS box answers the MX lookup. The message is drawn as an envelope (MAIL FROM, RCPT TO) holding a letter (header `From:`, `To:`, `Subject:`, body). Each lane shows the role name the book uses for its log entries (receiving side, sending side, local delivery).
- **State:** `{ hop, msg: { envelope: { mailFrom, rcptTo[] }, header: { from, to, subject }, received[] }, mx: { domain, host, pref }, store: { messages: [{ id, seen, deleted }] }, devices: [{ id, proto, sees[] }], log[] }`.
- **One step:** one hand-over, in order along the path: submission, MX lookup, relay hop, delivery, fetch by device 1, fetch by device 2. Each step adds the hop's `Received:` trace line and the log line.
- **Rules:**
  1. MUA → MSA is **submission** on port 587; MSA applies the organisation's policy and by default refuses `MAIL` from an unauthenticated session (RFC 6409 §3.1, §4.3; UL ch20 "Tko sve dodirne poruku", definitions *predaja poruke*, *agent za predaju pošte*).
  2. MTA → MTA is SMTP on port 25, one application-level hop at a time (RFC 5598 §4.3.2; RFC 6409 §1; UL ch20, definition *agent za prijenos pošte*).
  3. The sending MTA finds the next host by the recipient domain's MX record (lowest preference first) (RFC 5321 §5.1; UL ch20: `lab.example` MX → `10 posluzitelj.lab.example.`). Tie-break: equal preference → either; the model picks the first listed (check: RFC 5321 says randomise).
  4. A relay does not change the message except for adding trace information (`Received:`) (RFC 5321 §2.3.10, §4.4; UL ch20, definition *prosljeđivanje*).
  5. The envelope (MAIL FROM, RCPT TO) is used for routing and travels as SMTP commands; the header `From:` travels inside the message. They are two different data and need not match (RFC 5598 §4.1; UL ch20, definition *omotnica poruke*).
  6. The MDA moves responsibility into the recipient's mailbox (RFC 5598 §4.3.3; UL ch20, *agent za dostavu pošte*).
  7. Fetching is never SMTP: IMAP keeps messages and their state (seen, folders) on the server; POP3 typically downloads and deletes (RFC 9051 §1, RFC 1939 §1; URM ch14 "E-pošta: slanje naspram dohvata").
- **Params:** choice `fetch` IMAP / POP3 with delete, default IMAP; toggle `headerFromDiffers` (header From: shows `direktor@lab.example` while MAIL FROM is `ana@lab.example`), default off; toggle `authenticated` (submission login), default on.
- **Presets:**
  1. `two-domains` — `ana@lab.example` → `ivan@drugdje.example`: submission 587 → MX lookup of `drugdje.example` → relay on 25 → local delivery → IMAP fetch. Outcome: 3 `Received:` lines and four log entries, one per role: submission, sending MTA, receiving MTA, local delivery. Derived from UL ch20 (roles) with an invented recipient domain.
  2. `urm-two-devices` — URM ch14 Primjer 4: internal message via `192.168.1.99`, read on phone then computer: with IMAP both see it, marked read; with POP3 + delete the computer never sees it. From URM ch14 Primjer 4.
  3. `envelope-vs-header` — MAIL FROM `ana@lab.example`, header `From: direktor@lab.example`: delivered without complaint, the recipient sees "direktor". From UL ch20 (definition *omotnica poruke*), bridge to `email-auth`.
  4. `no-auth-submission` — submission without login: the MSA refuses `MAIL` and the message never leaves the sender's domain. From UL ch20 / RFC 6409 §4.3.
- **Steps:** `two-domains` 6; `urm-two-devices` 6; `envelope-vs-header` 5; `no-auth-submission` 2.
- **Legend:** envelope shape = SMTP envelope data, letter shape = header and body, port badges on arrows (587 / 25 / 143 / 110), filled vs hollow dot for read/unread on each device; "changed" marks the hop or store entry changed this step.
- **Captions:** hr: "Agent za prijenos pošte pita DNS za zapis MX domene drugdje.example i dobiva mx.drugdje.example s prednošću 10. Poruku nosi jedan skok dalje, na port 25." en: "The mail transfer agent asks DNS for the MX record of drugdje.example and gets mx.drugdje.example, preference 10. It carries the message one hop further, to port 25."
- **Terms:** *mail user agent (MUA)* — poštanski klijent; *mail submission agent (MSA)* — agent za predaju pošte; *mail transfer agent (MTA)* — agent za prijenos pošte; *mail delivery agent (MDA)* — agent za dostavu pošte; *envelope* — omotnica poruke; *relay* — prosljeđivanje; *message store* — spremište poruka; *mailbox* — poštanski sandučić.
- **Misconceptions:** "mail is sent to port 25" (submission is 587); "the From: line is what the servers route by"; "IMAP and POP3 are two ways to send".
- **Out of scope:** SPF/DKIM/DMARC (`email-auth`), the command-by-command SMTP dialogue (`smtp-dialogue`), STARTTLS vs implicit TLS (mention), spam filtering, bounces.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh email-path sims/email-path` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/email-path/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
