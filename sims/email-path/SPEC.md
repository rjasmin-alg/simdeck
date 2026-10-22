<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# email-path: specification

One concept: **MUA → MSA → MTA → MDA → IMAP; envelope vs header.** The student sends a mail across two domains
and follows who holds it at each hand-over, what each hop adds to it, and how the recipient's devices fetch it.
Task: `docs/tasks/w2/email-path.md` (catalogue `inet-email-path`, §4.2). Class: stepper. Drawn with kit view K1.

## Scene

| Lane | Party | lab scene (UL ch20, recipient domain invented) | grafo scene (URM ch14 Primjer 4) |
|---|---|---|---|
| A | sender's mail user agent | `ana@lab.example` on `democli1.lab.example` | `marko@grafo.hr` on `[192.168.1.23]` |
| P | sending server: MSA (587) then MTA | `posluzitelj.lab.example` | `[192.168.1.99]` |
| D | DNS (answers the MX lookup) | `drugdje.example`: `20 mx2…`, `10 mx…` | (not used: no lookup) |
| M | receiving MTA (25) | `mx.drugdje.example` | (not used: no relay) |
| S | delivery agent and the mailbox | `mx.drugdje.example` | `[192.168.1.99]` |
| I | recipient's MUA, two devices | `ivan@drugdje.example`: phone, computer | `petar@grafo.hr`: phone, computer |

Names, the client address `192.168.1.23`, subjects and bodies are invented; `posluzitelj.lab.example`, its
`10` MX and `192.168.1.99` come from the books. The DNS zone lists `mx2` (20) **before** `mx` (10) on purpose, so
the pick by preference is not the pick by order.

The message: an **envelope** (`MAIL FROM`, `RCPT TO[]`) around a **letter** (header `From:`, `To:`, `Subject:`,
body, plus the trace lines `Received:` and, after delivery, `Return-Path:`).

State: `{ n, scene, hop, ev, done, at, msg: { envelope: { mailFrom, rcptTo[] }, header: { from, to, subject }, body,
received[] (newest first), returnPath }, mx: { domain, records[], host, pref }, store: { messages: [{ id, seen,
deleted }] }, devices: [{ id, proto, sees: [{ id, seen }], synced }], log[], rows[], refused }`. `at` is the lane
that holds the message. `rows` are the chart's rows as data.

## Rules

1. **Submission** (MUA → MSA) is on port **587**; the MSA applies the organisation's policy and **by default refuses
   `MAIL` from an unauthenticated session**: reply `530 5.7.0`, nothing is accepted, no `Received:` line, the message
   stays with the sender's MUA and no lookup or relay follows. (RFC 6409 §3.1, §4.3; RFC 4954 §6 for `530 5.7.0`;
   UL ch20 "Tko sve dodirne poruku", definitions *predaja poruke*, *agent za predaju pošte*.)
2. **MTA → MTA is SMTP on port 25**, one application-level hop. (RFC 5598 §4.3.2; RFC 6409 §1; UL ch20, *agent za
   prijenos pošte*.)
3. **The next hop comes from the MX record of the recipient's domain**, the domain of the envelope's `RCPT TO`, not
   of the header's `To:`. **Lowest preference first.** Tie-break: equal preference → the first listed (RFC 5321
   §5.1 says the client SHOULD pick at random; a deterministic model takes the first, *(check)* noted). A domain the
   server hosts itself is delivered there: no MX lookup, no relay hop (grafo). (RFC 5321 §5.1; UL ch20:
   `lab.example` MX → `10 posluzitelj.lab.example.`.)
4. **A relay changes nothing but trace**: each hop that receives the message puts one `Received:` line **on top**
   (newest first) and leaves envelope, header and body as they were. (RFC 5321 §2.3.10, §4.4; UL ch20,
   *prosljeđivanje*.)
5. **Envelope and header are two different data.** Routing, the logs and `Return-Path:` use the envelope; the header
   `From:` travels inside the message and need not match. With `headerFromDiffers` the header says
   `direktor@lab.example` while `MAIL FROM` is `ana@lab.example`; the message is routed and delivered exactly the
   same, and the recipient's device shows `direktor@lab.example`. (RFC 5598 §4.1; UL ch20, *omotnica poruke*.)
6. **The MDA moves responsibility into the recipient's mailbox**: the message is in the message store (`at` = S),
   final delivery writes `Return-Path:` from `MAIL FROM` (RFC 5321 §4.4) and the delivery agent's hand-over adds a
   `Received:` line (`with LMTP`, as a local delivery over LMTP does, *(check)*). (RFC 5598 §4.3.3; UL ch20, *agent
   za dostavu pošte*.)
7. **Fetching is never SMTP.** IMAP (143) lists the mailbox as it stands on the server, flags included; opening a
   message sets `\Seen` **on the server**, so every device sees it read. POP3 (110) with delete downloads the message
   (RETR), marks it (DELE) and the server removes it when the session ends (QUIT); a device that comes later finds
   nothing, and "read" exists only on the device that has the copy. After a POP3 download the device holds the
   only copy (`at` = I). (RFC 9051 §1, RFC 1939 §1, §6; URM ch14 "E-pošta:
   slanje naspram dohvata"; UL ch20 "Šire o temi".)

Log: every receiving or sending hop writes one line in **its own** host's log, with the role word the book uses:
*prima s mreže* (receiving side), *nosi dalje* (sending side), *odlaže* (local delivery) (UL ch20 and figure
`put-poruke.svg`).

## Steps

One step is one hand-over: `submit` (or `try` + `refuse` without login), `mx` (query and answer), `relay`, `local`
(the domain is this server's own), `deliver`, `fetch` (a device's session), `read` (the user opens the message on a
device). The run is `plan(p)`: submission, then `local` or `mx` + `relay`, then `deliver`, then the script's device
actions.

## Params

- `fetch`: `imap` (default) or `pop3` (with delete).
- `headerFromDiffers`: header `From:` is `direktor@…`; default off.
- `authenticated`: the submission session has logged in; default on.
- `script` (hidden, set by the preset): the scene and the device actions.

## Presets and expected numbers

Checked with a scratch script over the model before the page was written (`node` replay of every preset).

| Preset | Params | Steps | Plan | `Received:` | Log lines |
|---|---|---|---|---|---|
| `two-domains` | defaults | **6** | submit, mx, relay, deliver, fetch phone, fetch computer | **3** | **4**: P receive, P send, M receive, M deliver |
| `urm-two-devices` | `script` | **6** | submit, local, deliver, fetch phone, read phone, fetch computer | 2 | 2: P receive, S deliver |
| `envelope-vs-header` | `headerFromDiffers` | **5** | submit, mx, relay, deliver, fetch computer | 3 | 4 |
| `no-auth-submission` | `authenticated: false` | **2** | try, refuse | 0 | 1: P receive, reject `530 5.7.0` |

- `two-domains`: MX answer `mx.drugdje.example`, preference 10 (not `mx2`, 20, listed first). `Received:` top to
  bottom: `from mx.drugdje.example by mx.drugdje.example with LMTP`, `from posluzitelj.lab.example by
  mx.drugdje.example with ESMTP`, `from democli1.lab.example by posluzitelj.lab.example with ESMTPSA`.
  `Return-Path: <ana@lab.example>`. Both devices see 1 message, unread.
- `urm-two-devices`, IMAP: after step 6 both devices show the message **read** (the phone set `\Seen` at step 5).
  With POP3: the phone's fetch (step 4) empties the mailbox; step 5 marks only the phone's copy read; the computer's
  fetch (step 6) gets **0** messages.
- `envelope-vs-header`: `MAIL FROM` / `Return-Path` `ana@lab.example`, header `From: direktor@lab.example`; routing,
  `Received:` lines and logs identical to `two-domains` (logs say `from=<ana@lab.example>`).
- `no-auth-submission`: store empty, no MX lookup, message still at A.

## Legend

Envelope shape (dashed border with a flap) = SMTP envelope data; letter shape (folded corner) = header and body;
port badges on the arrows (587 / 25 / 143 / 110); filled vs hollow dot = read / unread on each device; struck entry =
removed from the mailbox; "changed" marks the hop, trace line, store entry or device changed this step.

## Out of scope

SPF/DKIM/DMARC (`email-auth`), the command-by-command SMTP dialogue (`smtp-dialogue`), STARTTLS vs implicit TLS
(only mentioned in the explanation), spam filtering, bounces, retries and queues.
