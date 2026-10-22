<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-log-path: notes

New stepper (task `docs/tasks/w2/lnx-log-path.md`, catalogue §4.4). Rules and expected numbers: `SPEC.md`.
The rule table is kit view K4 (`kit/ruletable.js`); the rest of the scene is drawn in HTML (no SVG).

## Decisions

- **Scene** (as `put-poruke.svg`, left to right): the command line (the `logger` command, or what the sender does);
  three stations, ① sender (the message as a token: `tag[pid]: text`, `facility.severity`, both numbers, PRI), ②
  journald (`Storage=` and its directory, the stored entry with `PRIORITY` and `SYSLOG_FACILITY` in bold, rsyslog's own
  entries on the client), ③ rsyslog (inputs: `imjournal` on, `imuxsock` with `SysSock.Use="off"` dashed and struck);
  below, the rules of `/etc/rsyslog.conf` (K4) beside the outputs (four files, all users' terminals, and with `remote`
  the server box); at the bottom "where this event is", filled step by step and highlighted at the summary step.
- **The token** (a notched pill, series colour 1, ✉) sits in the station that holds the message; the station has a
  thick ink border. In the table the pointer chip is ✉ alone, and the mark column's header names the message
  (`user.notice`): a long chip (`authpriv.emerg ▸`) widened the pointer column and pushed the table sideways.
- **"Every match fires" in K4:** the table is in `deny` mode with every row an allow (every match wins), but no mode
  marks a row as firing at the step it is read, so every row gets its own `mark` (`win` "uzima" / `no` / `pending`), the way `lnx-pam-stack` was told to (sim-ui §12).
  No implicit row: rsyslog has no default action; a message no rule takes is only in the journal.
- **The deciding term** of a selector is boxed in the selector cell: solid `--ok` (takes it) or dashed `--danger`
  (does not), with ✓/✕ on the row being read. `miss` is not used: striking the whole selector would hide which term
  decided. Each term keeps its `;` on its line.
- **The sender follows the facility** (SPEC.md "Senders"): user and mail → `logger`, authpriv → `sshd-session`, cron →
  `CROND`, daemon → `systemd`, kern → the kernel through kmsg (a user process cannot send `kern`). The task has no
  sender param; this keeps one message per facility and the book's senders.
- **Forwarding rule first:** rsyslog.conf includes `/etc/rsyslog.d/*.conf` before its own rules, so `90-slanje.conf`'s
  `*.*` is rule 1 (its file named beside the selector; the table title says "90-slanje.conf, then /etc/rsyslog.conf")
  and the book's five rules are 2–6. The line stays in flight while they are read; the server step comes after.
- **Remote:** with `remote` on the machine is the client `democli1` (the book's setup) and a `user` message is the
  book's `logger -t klijent` (logger's default `user.notice`, so no `-p`). `serverUp` off means "reception stopped
  while the message is sent, back later": the forward step writes the two 18:09:20 lines into the client's journal,
  the server step adds 18:09:58 resumed and the 18:10:43 check; the event's remote record is "unknown" (`?`, dashed),
  never "lost", and the record count leaves it out. The forward caption quotes the client's journal; it does not say
  this message caused the suspension (the book has no send time). `serverUp` is shown only when `remote` is on.
  Other facilities keep demosrv1's PIDs on democli1 (a simplification).
- **No time stamps on record lines** (the task puts the journal/messages time difference out of scope). Only the
  remote events carry the book's times; the server's two old lines are identified by their times in the caption.
- **Captions:** the task's two captions are used at the summary step (two records; authpriv only in secure). Other
  summary captions count the records (one to four). Rule captions name the deciding term and why (takes / `none`
  removes the facility / severity too low / facility not named), then the action. The first matching rule adds
  "reading goes on" (misconception: first match).
- **Panel:** no hints (the panel did not fit at 1920×1080 with them); the sender table and the remote rule are in the
  explanation instead.

## Deviations from the task

- State: the task's `at: ruleIndex` is kept; `at` is `null` at step 0. Added `ruleTerms` (the deciding term per rule),
  `host`, `records` (where the event exists) and `event` for the page; `remote` has `inFlight`, `resumed`, `checked`.
- `facility` is a select (six options) and `severity` a select (eight), as the kit needs for more than five options.
- `serverUp` is hidden (not disabled) while `remote` is off, to keep the panel within one screen.
- The client's suspended lines: the book shows five rsyslogd lines at 18:09:20 (two "suspended", two "cannot connect",
  one "no working…"); the model keeps one of each kind, cut where `cut -c1-72` cut them.

## Sources

- UL ch13, read in full for this task: "Dnevnik sustava: `journald`…" (severities 0–7, `Storage=` volatile/persistent
  and the two directories), "`rsyslog`, `/var/log` i rotacija" (`logger -t proba -p user.notice`, `proba[57063]` in
  both logs, `PRIORITY=5`, `SYSLOG_FACILITY=1`, `_TRANSPORT=syslog`, the `rsyslog.conf` excerpt with `imuxsock`
  `SysSock.Use="off"`, `imjournal` and the five rules, `sshd-session[57230]: Accepted publickey for stu…`), its "Šire
  o temi" (`SYSLOG_FACILITY=10` for `sshd-session`, the `,` facility list), "Zapisi koji odlaze s računala" (`@`/`@@`,
  `90-slanje.conf`, the server's two `klijent` lines, the 18:09:20 / 18:09:58 rsyslogd lines, the 18:10:43 check, the
  queue paragraph) and Primjer 2. `CROND[55240]: (root) CMD (run-parts /` and `systemd[1]: Started session-701.scope -
  Session` from the chapter's other outputs, which cut them at 72 columns; the tails (`etc/cron.hourly)`, `701 of User
  student.`) are completed from the neighbouring lines *(check)*. Diagrams `put-poruke.svg`,
  `odakle-se-vidi-prekid.svg`.
- RFC 5424 §6.2.1: facility and severity numbers, PRI = facility × 8 + severity. Linux numbers cron 9, authpriv 10.
- Selector semantics, last term naming a facility decides; a severity takes itself and every more severe one: rsyslog
  doc "sysklogd format" / rsyslog.conf(5), from memory *(check)*.
- Every rule fires, no first match without `stop`: rsyslog doc, from memory *(check)*.
- systemd logging with facility `daemon` and `_TRANSPORT=journal` *(check)*; the kernel entry `_TRANSPORT=kernel`,
  `SYSLOG_FACILITY=0` *(check)*; a user process's `kern` becoming `user` *(check)*.
- The kernel line `virtio_net virtio0 enp1s0: renamed from eth0`: UL "Zapisi o mrežnim sučeljima" (`journalctl -k`).
- Made up: the tail of the `sshd-session` line (`dent from 192.168.122.1`; the book cuts it after `for stu`), the client message's PID 9512 and the server-up text
  "treća poruka s klijenta".

## Concepts, not tools

The subject is journald and rsyslog on Linux, which the course (UL) teaches by name; `logger`, the config syntax,
journal field names and the module names (`imjournal`, `imuxsock`, `omfile`, `omusrmsg`, `omfwd`) are what is taught.
Senders are the book's (`sshd-session`, `CROND`, `systemd`, the kernel); no other product is named.

## Term pairs

From the glossary: *system journal*, *severity*, *selector*, *central logging*. Missing from `kit/glossary.js`, written
out in both tables:

- *facility* — **naprava** (UL ch13)
- *action* — **akcija** (UL ch13)
- *queue* — **red čekanja** (UL ch13; the glossary has only "mail queue")

## Shared requests

- **Kit:** `.sd-ctl[hidden]` is still overridden by `.sd-ctl { display: flex }` (as in `lnx-mount-layers`); worked
  around in the page CSS.
- **Kit (K4):** an "every match fires" mode (all matching rows win as they are read, no implicit row) would replace the
  per-row marks here; `win-gpo-processing`-style pages may want the same. On a phone, `stickyMark` covers the action
  column when the table scrolls; the page turns it off under 900 px.

## Checks

- `node --test sims/lnx-log-path/sim.test.js`: 29 tests, tie-breaks first (last term decides, a term that does not name
  the facility, the info/debug boundary, every match fires in order), one or more per rule, the SPEC table of eight
  messages, remote up and down, senders, presets, then the template's generic block.
- **Mutations:** 11 of my own after the review (selector/severity rules, rule order, records, the book data); all fail a
  test.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against the book; 40
  mutations, 33 caught). Fixed from it: the remote-down summary was hardcoded ("journal and /var/log/messages") and is
  now built from the records; the count no longer includes the unknown server copy; the forwarding rule moved to the
  front (file order: the include comes first); the forward caption quotes the client's journal instead of claiming
  cause; `*.emerg` gets "takes only emerg"; Croatian wording (`pokrenuti`, "te poruke … nije bilo", "manje redaka");
  K4 mode `deny` instead of `first`; SPEC sources (kernel line from the book, derived tails, the democli1 assumption,
  the five rsyslogd lines, state names). Tests added for the seven survivors (the book's rules, forwarding line and
  sender PIDs verbatim; a `user.alert` row) and for remote with other facilities.
- Fit: every facility × {emerg, info, debug} × {no remote, server up, server down} × steps 1–5 and 8–11, in both
  languages, at 1920×1080: no overflow in the stage, the table, the outputs, the caption or the panel (a Playwright
  script in the scratchpad). The made-up tail of the sshd line was shortened to make the longest case fit.
- `npm run gate -- lnx-log-path`: pass. Screenshots at 1920×1080 light, dark, grayscale and 375×812 in both languages
  reviewed, plus each preset at its key step and remote-down at a phone size.

## Time

2026-10-22 22:38 to 23:12, one session: reading and design, model, tests and page, fit and screenshots, a fresh review
(run while NOTES.md was written) and its fixes: about 34 minutes of work.
