# lnx-log-path: The path of a log message

| | |
|---|---|
| Task | `lnx-log-path` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-log-path` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-log-path/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `logging` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **app → journald → rsyslog → file or remote**.

The student: send messages with facilities and priorities.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/13-dnevnici-i-zapisi.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-13/`
- Catalogue seed: UL ch13 (put-poruke.svg)
- UL ch13, sections "Dnevnik sustava: `journald` i čitanje zapisa" (severities, `Storage=`), "`rsyslog`,
  `/var/log` i rotacija" (`logger -t proba -p user.notice`, `/etc/rsyslog.conf` rules, `/var/log/secure`)
  and "Zapisi koji odlaze s računala" (`@`/`@@`, `omfwd`, suspended/resumed); Primjer 2 "poruka koja u
  18:10:43 nije bila ondje"; figures `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-13/put-poruke.svg`
  and `odakle-se-vidi-prekid.svg`
- RFC 5424 (The Syslog Protocol) §6.2.1, facility and severity tables
- rsyslog documentation: imjournal, omfwd, "sysklogd format" selectors; journald.conf(5) `Storage=`

## Model and presets

- **Scene:** as `put-poruke.svg`, left to right: the sender (`logger`, a service, `sshd`) → `journald`
  (with its store: `/var/log/journal` or `/run/log/journal`) → `rsyslog` (input `imjournal`; `imuxsock`
  shown switched off) → the rule table of `/etc/rsyslog.conf` (K4 rule table view if it exists) → outputs:
  `/var/log/messages`, `/var/log/secure`, `/var/log/maillog`, `/var/log/cron`, "all users' terminals"
  (`omusrmsg`), and optionally a remote server box (`omfwd` to `192.168.122.57:514/tcp`). The message is a
  token carrying `tag`, `facility.severity` and its numbers.
- **State:** `{ msg: { tag, text, pid, facility, severity }, at: 'sender'|'journald'|'rsyslog'|ruleIndex|
  'done', journal: [entries], storage: 'persistent'|'volatile', rules: [{ selector, action }],
  ruleResults: [match bool], files: { path: [lines] }, remote: { up: bool, received: [lines], suspended } }`.
- **One step:** (1) the sender emits; (2) journald stores the entry (PRIORITY, SYSLOG_FACILITY fields);
  (3) rsyslog reads it through imjournal; (4…) one step per rule: evaluate the selector, run the action if
  it matches; last step: summary of where the one event now exists.
- **Rules:**
  1. journald receives every message; with `Storage=persistent` it is written under `/var/log/journal`, with
     `volatile` only under `/run/log/journal` (lost at reboot) (UL ch13 "Dnevnik sustava…"; journald.conf(5)).
  2. On the book machine rsyslog takes messages from journald (`imjournal`), not from the socket
     (`imuxsock` `SysSock.Use="off"`): one event, two records, same PID (UL ch13 "`rsyslog`, `/var/log` i
     rotacija").
  3. Selector `facility.severity`: `*` = any, `none` = no messages of that facility; `;` joins terms on one
     line, and a `fac.none` term removes that facility from the line (UL ch13).
  4. A severity in a selector matches that severity **and all more severe** ones (numerically ≤): `*.info`
     takes info…emerg, not debug (rsyslog doc "sysklogd format" / rsyslog.conf(5) (check)).
  5. Every rule is evaluated; **all matching rules fire** (a message can land in two places); no first
     match unless a `stop` action is used (rsyslog doc (check)). Rules are evaluated in file order (only
     matters for `stop`).
  6. Severity numbers 0 emerg … 7 debug; facility numbers user 1, mail 2, cron 9, authpriv 10
     (RFC 5424 §6.2.1; UL ch13: `PRIORITY=5`, `SYSLOG_FACILITY=1` for `user.notice`).
  7. Remote: `@` = UDP, `@@` / `protocol="tcp"` = TCP; when the target is down the action is `suspended`
     and later `resumed`; what happened to messages in between depends on the queue and is not shown by any
     of the outputs (UL ch13 "Zapisi koji odlaze s računala", Primjer 2).
- **Params:** `facility` select (user, authpriv, mail, cron, kern, daemon), default user; `severity` select
  (emerg … debug, with numbers), default notice; `storage` choice persistent/volatile, default persistent;
  `remote` toggle (adds `*.* action(type="omfwd" … protocol="tcp")`), default off; `serverUp` toggle,
  default on. Param changes reset to step 0.
- **Presets:**
  1. `logger-notice` — `logger -t proba -p user.notice 'poruka iz 13. poglavlja'` → journal (`PRIORITY=5`,
     `SYSLOG_FACILITY=1`) → `*.info;mail.none;authpriv.none;cron.none` matches → `/var/log/messages`; other
     rules no. Two records, PID 57063 in both (from UL ch13).
  2. `authpriv` — `sshd` `authpriv.info` "Accepted publickey…" → line 1 excluded by `authpriv.none`, line 2
     `authpriv.*` → `/var/log/secure` only (from UL ch13).
  3. `debug-journal-only` — `user.debug` → in the journal, in no file (7 > info) (derived from rule 4).
  4. `emerg` — `user.emerg` → `/var/log/messages` **and** every logged-in terminal (`*.emerg omusrmsg`)
     (derived from UL ch13 config; rule 5).
  5. `cron` — `cron.info` → `/var/log/cron` only (from UL ch13 config).
  6. `remote-down` — client forwards to `192.168.122.57:514/tcp`; server down: 18:09:20 action suspended,
     18:09:58 resumed; at 18:10:43 the server has the 18:08:39 and 18:09:03 lines and no third (from UL ch13
     Primjer 2).
- **Steps:** 3 + one per rule (book config has 5 rules) + 1 summary = 9; preset 6 adds 2 (forward, server).
- **Legend:** token shape = message; rule row lit = being evaluated, ✓ match / ✗ no match; file icons
  receive a line; "changed" marks the output that just got a line.
- **Captions:**
  - hr: "Jedan događaj, dva zapisa: `rsyslog` nije drugi izvor nego drugi ispis onoga što je `journald` primio."
  - en: "One event, two records: `rsyslog` isn't a second source but a second copy of what `journald` received."
  - hr: "`authpriv.none` vadi poruku iz retka za `/var/log/messages`, a `authpriv.*` je šalje u `/var/log/secure`."
  - en: "`authpriv.none` takes the message out of the `/var/log/messages` line, and `authpriv.*` sends it to `/var/log/secure`."
- **Terms:** journal — dnevnik sustava; facility — naprava; severity — razina ozbiljnosti; selector —
  selektor; action — akcija; central logging — središnje dnevničenje; log rotation — rotacija dnevnika.
- **Misconceptions:** journald and rsyslog split the work (they are in series); rules are first match;
  `*.info` means only info.
- **Out of scope:** logrotate (`lnx-logrotate`), journalctl filters, queue types, TLS (RFC 5425), timestamp
  differences between the two logs.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-log-path sims/lnx-log-path` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-log-path/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
