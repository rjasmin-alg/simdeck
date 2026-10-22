<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-log-path: specification

One concept: **app → journald → rsyslog → file or remote.** Task: `docs/tasks/w2/lnx-log-path.md`. Sources: UL =
`~/projects/uvod-u-linux/book/chapters/13-dnevnici-i-zapisi.md`; diagrams `put-poruke.svg`,
`odakle-se-vidi-prekid.svg` (UL `assets/diagrams/chapter-13/`); RFC 5424 §6.2.1.

## State

`{ msg: { sender, tag, text, pid, facility, severity, transport }, host, at, journal: [entries], storage,
rules: [{ selector, action, kind, target }], ruleResults: [true|false|null], files: { path: [lines] }, terminals:
[lines], remote: null | { up, received: [{ time, text }], inFlight, suspended, resumed, checked }, records, event }`.

- `at`: `null` (step 0), `'sender'`, `'journald'`, `'rsyslog'`, a rule index `0…`, `'server'`, `'done'`.
- `journal`: entries `{ id, PRIORITY, SYSLOG_FACILITY, SYSLOG_IDENTIFIER, _PID, MESSAGE, _TRANSPORT }`; the message's own
  entry first, then (remote down) the sending rsyslog's own entries about the action.
- `ruleResults[i]`: `null` until rule i is evaluated, then whether its selector matches.
- `records`: where the one event exists (`{ where, status }`: `journal`, file paths, `terminals`, `remote`; status `yes`
  or `unknown`), filled step by step. The page counts only `yes` records; an `unknown` copy is shown but not counted.
- `event`: `{ kind, rule, term, changed: [...] }` for the page: what this step did and what it changed.

## One step

1. **sender**: the sender emits the message; the token carries `tag[pid]`, `facility.severity`, the numbers and PRI.
2. **journald**: journald stores the entry (`PRIORITY`, `SYSLOG_FACILITY`) under the `Storage=` path.
3. **rsyslog**: rsyslog reads the entry through `imjournal`; `imuxsock` is loaded with `SysSock.Use="off"`.
4. **one per rule** in file order: evaluate the selector; if it matches, run the action (append a line to the file,
   write to all terminals, or forward).
5. **server** (remote on only): what the server's `/var/log/messages` holds.
6. **done**: where the one event now exists.

Steps: 3 + 5 rules + 1 = **9**; with `remote`: 3 + 6 rules + 1 server + 1 = **11**. Parameter changes reset to step 0.

**Rule order with `remote`:** `/etc/rsyslog.conf` includes `/etc/rsyslog.d/*.conf` (`include(…)`) *before* its own five
rules (UL), so the forwarding rule from `90-slanje.conf` is read **first** (rule 1, and the client's log calls it
`action-1-builtin:omfwd`); the book's five rules follow as rules 2–6. The server step comes after all rules: the line
is in flight (server up) while the client's own rules are read. *Assumption:* democli1's own `rsyslog.conf` is the
same as demosrv1's; the book does not show it.

## Rules

1. **journald receives every message.** With `Storage=persistent` the entry is under `/var/log/journal`, with
   `volatile` only under `/run/log/journal`, lost at reboot (UL "Dnevnik sustava…"; journald.conf(5) `Storage=`). The
   entry exists whatever rsyslog's rules say (a `debug` message is in the journal and in no file).
2. **rsyslog reads from journald** (`imjournal`), not from the socket (`imuxsock` `SysSock.Use="off"`): one event, two
   records, the same PID in both (UL "`rsyslog`, `/var/log` i rotacija": `proba[57063]` in `journalctl` and in
   `/var/log/messages`). rsyslog is in series after journald, never a second source.
3. **Selector `facility.severity`**: `*` = any facility (before the dot) or any severity (after it); `none` = no
   messages of that facility; `,` lists several facilities with one severity; `;` joins terms on one line (UL).
   **Tie-break:** terms are read left to right and each term sets the severity set of the facilities it names, so the
   **last term that names a facility decides** for it (`*` names every facility): in
   `*.info;mail.none;authpriv.none;cron.none`, `authpriv.info` is decided by `authpriv.none` → no match; with the terms
   reversed (`authpriv.none;*.info`) it would match (sysklogd selector semantics, rsyslog doc "sysklogd format"
   *(check)*). The deciding term is reported (`event.term`) so the page can outline it.
4. **A severity matches itself and every more severe one** (numerically ≤): `*.info` takes `info` (6) … `emerg` (0),
   not `debug` (7); `*.debug` and `*.*` take everything; `*.emerg` only `emerg` (rsyslog doc "sysklogd format",
   rsyslog.conf(5) *(check)*). Boundary: `info` matches `*.info` (6 ≤ 6); `debug` does not (7 > 6).
5. **Every rule is evaluated, in file order, and every matching rule fires**; a message can land in several places. No
   first match (that needs a `stop` action, which the book config has none of) (rsyslog doc *(check)*).
6. **Numbers** (RFC 5424 §6.2.1): severity 0 emerg, 1 alert, 2 crit, 3 err, 4 warning, 5 notice, 6 info, 7 debug;
   facility kern 0, user 1, mail 2, daemon 3, cron 9, authpriv 10. `PRI = facility × 8 + severity`: `user.notice` =
   `<13>`, `authpriv.info` = `<86>`, `cron.info` = `<78>`, `user.emerg` = `<8>`, `user.debug` = `<15>`, `kern.info` =
   `<6>`. journald stores `PRIORITY=` the severity and `SYSLOG_FACILITY=` the facility number (UL: `PRIORITY=5`,
   `SYSLOG_FACILITY=1` for `user.notice`; `SYSLOG_FACILITY=10` for `sshd-session`).
7. **Remote** (`*.* action(type="omfwd" target="192.168.122.57" port="514" protocol="tcp")`, UL `90-slanje.conf`): `@` =
   UDP, `@@` / `protocol="tcp"` = TCP. Server up: the line is appended to the server's `/var/log/messages` with the
   sender's host name (`democli1`). Server down: the client's journal shows the action suspended (18:09:20,
   "suspended", "cannot connect to 192.168.122.57:514") and resumed later (18:09:58, "resumed"). The book has five
   rsyslogd lines at 18:09:20 (suspended ×2, cannot connect ×2, "no working…"); the model keeps one of each of the
   first two kinds. The book does not show when the message was sent (only the order of the commands), so the captions
   quote the client's journal and do not say this message caused the suspension. At 18:10:43 the server has the 18:08:39 and 18:09:03 lines and no third (UL "Zapisi koji
   odlaze s računala", Primjer 2). What happened to the message in between depends on the queue and no output shows
   it: the model records `remote` in `records` as `unknown`, never as lost or delivered.

## Senders

The sender follows the facility (a sender's facility is its own, so each facility has its typical sender):

| facility | sender | tag[pid] | text | transport | source |
|---|---|---|---|---|---|
| user | `logger -t proba -p user.<sev> 'poruka iz 13. poglavlja'` | `proba[57063]` | poruka iz 13. poglavlja | syslog | UL |
| user, remote | `logger -t klijent …` on `democli1` | `klijent[9512]` | poruka dok je poslužitelj ugašen (down) / treća poruka s klijenta (up) | syslog | UL; PID and up text made up |
| mail | `logger -t proba -p mail.<sev> …` | `proba[57063]` | poruka iz 13. poglavlja | syslog | derived |
| authpriv | sshd-session | `sshd-session[57230]` | Accepted publickey for student from 192.168.122.1 | syslog | UL cuts it after `for stu`; the rest derived |
| cron | CROND | `CROND[55240]` | (root) CMD (run-parts /etc/cron.hourly) | syslog | UL cuts it after `run-parts /`; the rest derived |
| daemon | systemd | `systemd[1]` | Started session-701.scope - Session 701 of User student. | journal | UL cuts it after `Session`; the rest derived from the session-689 line; facility *(check)* |
| kern | the kernel | `kernel` (no PID) | virtio_net virtio0 enp1s0: renamed from eth0 | kernel | UL "Zapisi o mrežnim sučeljima" (`journalctl -k`); its severity is the param *(check)* |

`logger` can send any facility except `kern` (a user process's `kern` becomes `user`), so `kern` comes from the
kernel through `kmsg` (UL: journald's five sources). With `remote` on, the machine is `democli1` and a `user` message
is the book's `klijent` message; other facilities keep their sender (and the demosrv1 PIDs, a simplification).

## Expected results (book config, 5 rules; ✓ = match)

| message | 1 `*.info;mail.none;authpriv.none;cron.none` | 2 `authpriv.*` | 3 `mail.*` | 4 `cron.*` | 5 `*.emerg` | records |
|---|---|---|---|---|---|---|
| user.notice | ✓ (`*.info`) | – | – | – | – | journal, messages: **2** |
| authpriv.info | – (`authpriv.none`) | ✓ | – | – | – | journal, secure: **2** |
| user.debug | – (`*.info`: 7 > 6) | – | – | – | – | journal: **1** |
| user.emerg | ✓ | – | – | – | ✓ | journal, messages, terminals: **3** |
| cron.info | – (`cron.none`) | – | – | ✓ | – | journal, cron: **2** |
| mail.err | – (`mail.none`) | – | ✓ | – | – | journal, maillog: **2** |
| kern.info | ✓ | – | – | – | – | journal, messages: **2** |
| authpriv.emerg | – (`authpriv.none`) | ✓ | – | – | ✓ | journal, secure, terminals: **3** |
| user.alert | ✓ | – | – | – | – (`*.emerg` takes only 0) | journal, messages: **2** |

With `remote`, rule 1 `*.*` (from `90-slanje.conf`) matches every message and the table above moves down one row:
server up adds `remote` (+1); server down adds `remote` as unknown (not counted).
`remote-down` ends with journal, messages and remote unknown (2 records counted); the client's journal holds 1 + 3
entries (the message, suspended, cannot connect, resumed).

## Presets

1. `logger-notice`: user.notice; journal `PRIORITY=5`, `SYSLOG_FACILITY=1`; rule 1 matches → `/var/log/messages`; two
   records, PID 57063 in both.
2. `authpriv`: authpriv.info from `sshd-session`; rule 1 decided by `authpriv.none` (no), rule 2 `authpriv.*` →
   `/var/log/secure` only.
3. `debug-journal-only`: user.debug; in the journal, in no file.
4. `emerg`: user.emerg; `/var/log/messages` and every terminal (rule 5).
5. `cron`: cron.info; `/var/log/cron` only.
6. `remote-down`: `remote` on, server down; 11 steps; the forwarding rule is rule 1 (step 4): suspended at 18:09:20;
   the server step (10): resumed at 18:09:58, and at 18:10:43 the server has two `klijent` lines and no third.

## Out of scope

logrotate (`lnx-logrotate`), journalctl filters, queue types, TLS (RFC 5425), timestamp differences between the two
logs (record lines carry no time stamp; only the remote events carry the book's times), `stop`, `=`/`!` severity
modifiers.
