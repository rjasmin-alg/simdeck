# smtp-dialogue: An SMTP session

| | |
|---|---|
| Task | `smtp-dialogue` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-smtp-dialogue` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/smtp-dialogue/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | UL |
| Topic / tags / level | `internet` / `email` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `email-path` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **HELO/MAIL FROM/RCPT TO/DATA and reply codes**.

The student: type commands, read replies.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/email-path/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/20-elektronicka-posta.md` (Uvod u Linux): "Tko sve dodirne poruku prije nego što stigne" (the `printf … | nc 192.168.180.1 25` transcript with `220`, `250-` capability lines, `250 2.1.0 Ok`, `250 2.1.5 Ok`, `221 2.0.0 Bye`; the three-step transaction) and "Poslužitelj koji prima, nosi i odlaže" (the relay-denied transcript `454 4.7.1 … Relay access denied`, `smtpd_relay_restrictions` default with `defer_unauth_destination`, 4xx vs 5xx, definition *otvoreni relej*)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md` "E-pošta: slanje naspram dohvata" (MAIL FROM, RCPT TO, DATA, a reply after each)
- RFC 5321 §3.1, §3.3, §3.6.2, §4.1.4, §4.2.1, §4.3.2, §4.5.4.1; RFC 3463 (enhanced status codes)
- Postfix documentation "SMTP relay and access control" and `postconf(5)` `smtpd_relay_restrictions` (as cited in UL ch20)

## Model and presets

- **Scene:** kit view K1 message sequence chart, client `democli1` and server `demosrv1` port 25 (`220 demosrv1.lab.local ESMTP …`), with a transcript beside it that grows line by line as in UL ch20 (the dialogue is typed by hand, without a mail client). A small state badge on the server: *greeted / mail / rcpt / data / done*. A panel explains the reply code: first digit (2 ok, 3 more input, 4 temporary, 5 permanent) and the enhanced code (`2.1.0`).
- **State:** `{ transcript: [{ who, line }], session: { greeted, mailFrom|null, rcpts[], inData, queuedId|null }, server: { ownDomains: ['lab.example'], trustedNets, clientIp, authenticated }, lastReply }`.
- **One step:** the client sends one command (or the whole DATA block as one step), the server replies; the state badge moves.
- **Rules:**
  1. The server speaks first with a 220 greeting (RFC 5321 §3.1, §4.3.2).
  2. `EHLO` gets a multi-line 250 reply; a hyphen after the code means "more lines follow", a space marks the last line; the lines list capabilities such as `STARTTLS` (RFC 5321 §4.2.1; UL ch20 transcript).
  3. A mail transaction is `MAIL FROM`, then one or more `RCPT TO`, then `DATA`; the message ends with a line containing only `.`, which also confirms the transaction (RFC 5321 §3.3; UL ch20 "Sama transakcija ima tri koraka").
  4. `DATA` is answered with **354** (send the data), the final dot with 250 (RFC 5321 §4.3.2).
  5. Commands out of order (`RCPT` before `MAIL`, `DATA` without an accepted `RCPT`) get **503** bad sequence (RFC 5321 §4.1.4, §4.3.2).
  6. `MAIL FROM` is not checked against anything by the protocol (RFC 7208 §1 as cited in UL ch20): any sender is accepted with `250 2.1.0 Ok`.
  7. The relay decision is made at `RCPT TO`: a recipient outside the server's own domains from a client neither in the server's trusted networks nor authenticated is refused; the book's server defers by default and gives **454 4.7.1 … Relay access denied** (temporary), where RFC 5321 recommends 550 for policy refusals (UL ch20 "Poslužitelj koji prima, nosi i odlaže"; RFC 5321 §3.6.2).
  8. 4xx = try again later (the sending MTA retries for days), 5xx = give up now (RFC 5321 §4.2.1, §4.5.4.1; UL ch20).
  9. `QUIT` → 221 and the server closes the connection (RFC 5321 §4.1.1.10).
- **Params:** buttons to send the next command of a small menu (EHLO, MAIL FROM, RCPT TO local, RCPT TO external, DATA, `.`, QUIT), each queued for the next step; toggle `clientTrusted` (client in the trusted networks), default off; choice `relayPolicy` defer/reject, default defer (the book's server default).
- **Presets:**
  1. `book-envelope-only` — the UL ch20 transcript: `220`, `EHLO` → `250-demosrv1.lab.local` … `250 CHUNKING`, `MAIL FROM:<student@lab.example>` → `250 2.1.0 Ok`, `RCPT TO:<student@lab.example>` → `250 2.1.5 Ok`, `QUIT` → `221 2.0.0 Bye`. No DATA, so no message. From UL ch20.
  2. `book-relay-denied` — UL ch20: `MAIL FROM:<netko@drugdje.example>` → 250, `RCPT TO:<meta@vani.example>` → `454 4.7.1 <meta@vani.example>: Relay access denied`. From UL ch20.
  3. `full-message` — as 1 plus `DATA` → `354 End data with <CR><LF>.<CR><LF>`, header and body, `.` → `250 2.0.0 Ok: queued as …`. Reply texts vary by server; the codes are what matters (check).
  4. `out-of-order` — `RCPT TO` before `MAIL FROM` → `503 5.5.1` bad sequence of commands (reply text varies, check).
  5. `reject-not-defer` — `relayPolicy` = reject: the same as 2 but a 5xx refusal (`554 5.7.1` or the RFC's recommended `550`, check); the caption contrasts retry vs give up.
- **Steps:** `book-envelope-only` 5; `book-relay-denied` 5; `full-message` 7; `out-of-order` 3; `reject-not-defer` 5.
- **Legend:** client lines `>`, server lines `<` in the transcript; reply-code chips shaped by class (2 = round, 3 = arrow, 4 = clock, 5 = cross); "changed" marks the transcript line and the state badge changed this step.
- **Captions:** hr: "RCPT TO:<meta@vani.example> dobiva 454 4.7.1 Relay access denied. Pošiljatelja nitko nije provjerio; odbijen je primatelj, i to privremeno (4xx)." en: "RCPT TO:<meta@vani.example> gets 454 4.7.1 Relay access denied. Nobody checked the sender; the recipient is refused, and only temporarily (4xx)."
- **Terms:** *reply code* — kod odgovora (check); *envelope* — omotnica poruke; *relay* — prosljeđivanje; *open relay* — otvoreni relej; *capability* — sposobnost (UL ch20 "popis sposobnosti"); *transaction* — transakcija.
- **Misconceptions:** "the server checks who the sender is"; "an error code always means the mail is lost" (4xx is retried); "the `From:` the user sees was sent with MAIL FROM".
- **Reuse from `email-path`:** the hosts, domains and the envelope/letter drawing; new here is the command/reply state machine.
- **Out of scope:** AUTH and STARTTLS negotiation (mention the capability lines), PIPELINING, BDAT/CHUNKING, testing other people's servers (the book: only your own server on an isolated segment).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh smtp-dialogue sims/smtp-dialogue` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/smtp-dialogue/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
