<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# email-path: notes

New stepper (task `docs/tasks/w2/email-path.md`, catalogue `inet-email-path`, §4.2, wave 2b). Rules, tie-breaks
and expected numbers: `SPEC.md`. The hand-overs are drawn with kit view **K1, message sequence chart**
(`kit/sequence.js`); the message (envelope around letter) and the server logs are page panels under it.

## Decisions

- **Layout.** The chart spans the stage's full width on top. Six lanes need about 190 px each, and in a side
  column they had about 110 px. Under it are two panels: the message on the left, the server logs on the right. On
  desktop the page tightens the K1 rows, the lane gap and the card padding (`--sd-seq-row: 2.3rem`, as
  `tls-handshake` does), so all 7 rows of `two-domains` show at its last step at 1920×1080 with the panel open.
- **Lanes = roles.** A sender's MUA · P `MSA · MTA` (one host, so submission and transfer share a lane) · D DNS
  (the "DNS box" from the task, with the MX records and the one picked outlined) · M receiving MTA · S MDA with the
  mailbox · I the recipient's MUA with its two devices. A lane's name is the role's abbreviation (data). Its card
  gives the role in words, the host and, for servers, **the role words the book uses in the log** ("dnevnik: prima s
  mreže, nosi dalje" / "prima s mreže" / "odlaže", from UL ch20's figure, without the product's process names). The
  lane that holds the message has the active border and "✉ has the message". The grafo scene has no DNS or M lane,
  because nothing is looked up or relayed.
- **One step = one hand-over**, as the task says. The MX lookup is one step with two rows (query and answer); a
  fetch is one row (the device's IMAP/POP3 session). Its outcome shows in the device line and the mailbox entry,
  and a receiver word on the arrow says "deleted at QUIT" or "no messages".
- **Step counts as in the task (6/6/5/2)**. `urm-two-devices` is submit, local (a note: grafo.hr is this server's
  own domain, so there is no MX lookup and no relay), deliver, phone fetch, phone read, computer fetch. The phone's
  read is a step of its own because the URM example is about where "read" lives: with IMAP it sets `\Seen` on the
  server, with POP3 it marks only the phone's copy. `two-domains` has no read step, so both devices see the message
  unread.
- **Three `Received:` lines in `two-domains`** come from the MSA (`with ESMTPSA`, the authenticated submission), the
  receiving MTA (`ESMTP`) and the delivery agent (`LMTP`, as a local delivery over LMTP adds one). The sending MTA
  is on the MSA's host and adds none. Final delivery also writes `Return-Path:` from `MAIL FROM` (RFC 5321 §4.4).
  That line is what is left of the envelope in the stored message, and it bridges to `email-auth`.
- **Envelope vs header** is shown by shape (dashed envelope with a flap around a solid letter with a folded corner,
  each with its caption on the border). With `headerFromDiffers` a dashed badge "≠ MAIL FROM in the envelope" sits
  beside `From:`, and the logs keep `from=<ana@lab.example>`.
- **Logs** show what each server would write in short form: host, role word, then `from=<…> port=…` (receiving
  side) or `to=<…> relay=host:25` / `status=…`. These lines are generic, not any product's log format.
- **No-auth**: two steps, the attempt (`SMTP 587`, "no login") and the refusal `530 5.7.0` (RFC 4954 §6 code). The
  later lanes stay empty and the message stays at A ("the message waits in the client"). The toggle does the same
  on every scenario.
- **Read/unread** is a filled or hollow dot with its own outline, never colour alone. A deleted mailbox entry is
  struck through, with the words "deleted at QUIT".
- **Invented data**: `ivan@drugdje.example`, `mx.drugdje.example` (10) and `mx2.drugdje.example` (20, listed first in
  the zone so that preference, not order, decides), `democli1.lab.example` as the sender's host (the UL lab client),
  `marko@`/`petar@grafo.hr`, the client address `192.168.1.23`, subjects and bodies. From the books:
  `posluzitelj.lab.example` and its MX 10 (UL ch20), `192.168.1.99` (URM ch14). An address literal is written in
  brackets (`[192.168.1.99]`).
- **Related:** `dns-records`, `dns-resolution`, `http-exchange` (existing sims only; `email-auth` and
  `smtp-dialogue` do not exist yet).

## Deviations from the task

- The task's sample caption joins the MX lookup and the hop to port 25 in one sentence. Here they are two steps
  (MX, then relay), and the MX caption ends by saying the next hop is on port 25.
- The task lists "fetch by device 1, fetch by device 2" for `two-domains`; `urm-two-devices` adds a separate "read"
  step on the phone (see Decisions) to reach the task's 6 steps with a meaningful one.
- Port badges show 587 / 25 / 143 / 110 as the task's legend says. The explanation mentions 993/995 and STARTTLS
  vs implicit TLS, but does not show them.

## Sources

- UL `book/chapters/20-elektronicka-posta.md`: "Tko sve dodirne poruku prije nego što stigne" (definitions MUA,
  MSA, MTA, MDA, message store, mailbox, envelope, relay, submission; MX `10 posluzitelj.lab.example.`; ports 587/25;
  the MSA refuses unauthenticated MAIL by default), "Šire o temi" (POP3 110 download, IMAP 143/993 on the server,
  DELE marks and the server deletes at the end of the session; STARTTLS vs implicit TLS), Primjer 1 (follow the
  message by the log of whoever had it last). Figure `assets/diagrams/chapter-20/put-poruke.svg` (log role words:
  prima s mreže, nosi dalje, odlaže).
- URM `book/chapters/14-aplikacijski-sloj.md`: "E-pošta: slanje naspram dohvata" (SMTP sends, IMAP/POP3 fetch,
  never SMTP), Primjer 4 (one message read on phone and computer; IMAP vs POP3 with delete), `192.168.1.99`.
- RFC 5598 §4.1, §4.3; RFC 5321 §2.3.10, §4.4, §5.1; RFC 6409 §1, §3.1, §4.3; RFC 4954 §6; RFC 9051 §1; RFC
  1939 §1, §6: from memory, no network in this session.
- Numbers checked with a scratch replay of every preset (and POP3 variants) before the page was written.

## Unchecked *(check)*

- RFC section numbers above are from memory.
- MX tie-break: RFC 5321 §5.1 says equal preferences SHOULD be picked at random; the model takes the first listed
  (deterministic), as the task says.
- That the delivery agent's hand-over adds a `Received:` line (`with LMTP`). It does when the MTA delivers over
  LMTP, as is common; a direct local delivery may add only `Return-Path:` and a delivered-to line.
- `with ESMTPSA` for authenticated submission (RFC 3848's protocol type).

## Term pairs

All terms used are in `kit/glossary.js` (`mail user agent`, `mail submission agent`, `mail transfer agent`, `mail
delivery agent`, `message store`, `mailbox`, `envelope`, `relay`, `submission`). None missing.

## Shared requests

- **Kit: hidden controls.** `visible: () => false` sets `[hidden]`, but `.sd-ctl`'s `display` wins; the page adds
  `.sd-panel [hidden] { display: none }` (as `http-exchange` and `cert-chain` do).
- **K1: a compact density option.** Six lanes with card bodies and seven rows only fit at 1920×1080 after the page
  shrinks `--sd-seq-row`, `--sd-seq-gap` and the head padding through kit CSS variables and classes. An official
  `density: 'compact'` would keep pages from depending on kit internals.

## Checks

- Tests: 26 (three tie-breaks first, rules 1–7, the presets' numbers, golden rows of two presets, the events the
  captions read, the fields the page shows (device connected, log status and login, MX answer, relay target = MX
  pick, who holds the message after POP3), then the template's generic block over 7 param combinations).
- Mutation pass on a copy (28 mutations: tie-break direction, highest preference, first record, routing by header
  `To:`, local domains ignored, case-sensitive domains, trace appended at the bottom, a relay that changes the
  header, missing `Received:` at relay or delivery, `Return-Path` from the header, unauthenticated accepted, no-auth
  continuing, ports swapped, IMAP fetch marking seen or deleting, POP3 keeping the message, IMAP read staying local,
  fetch drawn as SMTP, delivery not moving the message, missing send log, logs from the header, the toggle ignored
  or changing the envelope, missing MX answer, MX in a local route): 27 fail a test. The survivor ("a POP3 read
  reaches the server") is equivalent, since by then POP3 has removed the message.
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md and the RFCs (rules, numbers and
  citations confirmed), drove every preset × fetch × header × login × language × step headlessly (no console errors)
  and ran its own mutations. Fixed from it: the mailbox lane stayed "active" after POP3 had taken the only copy (now
  the device holds it); the relay caption called the receiving server the relay (RFC 5321 §2.3.10: the relay is the
  one that passes it on); a feminine, conditional-sounding Croatian sentence in the header caption, which also claimed
  only Return-Path keeps the envelope sender (the logs do too); the no-auth envelope showed RCPT TO as if it had been
  sent (now "not sent"); "nothing is downloaded" for IMAP (now "nothing is taken away"); the grafo sending server
  claiming a "carries on" log role; straight quotes in Croatian; a doubled parenthesis after a glossary term; "immediate
  encryption" → implicit TLS; the delivery row named "delivery" twice (the chip is now LMTP); dead strings and state; a
  hard-coded address in a caption. Six surviving non-equivalent mutants got tests (all now killed).
- Gate: pass (manifest, tests, build, 61 browser checks, tokens, scope). Screenshots reviewed: the gate's light,
  dark, grayscale and phone in both languages, plus my own of `two-domains` 6 (hr, en), `urm-two-devices` 6 with
  POP3, `urm-two-devices` 5 dark, `envelope-vs-header` 4 and 5, `no-auth-submission` 2 and the phone at step 6.
  Fixed on the way: six lanes squeezed into a side column, host names breaking mid-word, the chart dropping the
  first rows at the last step, the envelope flap covering `RCPT TO`, and the shape captions cut off on the phone.

## Time

Start 10:49, done (gate, mutation pass, fresh review and its fixes) 11:20: about 31 minutes, one session.
