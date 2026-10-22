<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ssh-key-auth: notes

New stepper (task `docs/tasks/w2/ssh-key-auth.md`, catalogue `inet-ssh-key-auth`, §4.2, wave 2b). Rules, tie-breaks
and expected numbers: `SPEC.md`. The messages are drawn with kit view **K1, message sequence chart**
(`kit/sequence.js`); the files and the terminal are page panels beside and under it.

## Decisions

- **Layout.** Two columns. Left: the two question badges ("1. Is this the right server?", "2. Who is the user?"),
  the K1 chart with lanes Client (`democli1`) and Server (`demosrv1 · 192.168.122.57`), and the client's terminal
  under it (the newest lines at the bottom, older ones cut at the top). Right: the client's `~/.ssh/known_hosts` table
  and key pair, the server's host key (full fingerprint, "the admin tells you this another way"), `authorized_keys` and
  `PasswordAuthentication`. The badges carry ✓ ✕ ? • and a border style (dashed idle, solid ok, double refused), not
  colour alone.
- **Granularity.** One step is one phase of one action (SPEC.md "Steps"). The password is its own phase (the prompt,
  then the password sent), so the two human prompts (the host question and the password) are both visible steps. With
  that rule `first-connection` is 5 and `key-login` and `password-off` match the task; see Deviations.
- **Two fingerprints** (rule 8): host-key fingerprints carry a server icon, user-key fingerprints a person icon, drawn in
  CSS; both in the legend. Chart chips and tables show `SHA256:` + 6 characters + …, the server panel and the terminal
  the whole fingerprint.
- **Lock** on every message after the key exchange (`lock: true`); the key exchange and the host key are not locked.
- **`none` request.** Without a key to offer (no pair, or "password only") the client sends `none` and the server's
  `failure` lists the methods (RFC 4252 §5.2). This is how the `Permission denied (publickey,gssapi-keyex,gssapi-with-mic)`
  list of Primjer 2 appears in the chart. The chart shows the list shortened (`publickey,…,password`); the terminal and
  the caption give it whole.
- **Answer and offer are params**, the actions are a queue. `answer` (yes/no) applies to every host question in the run,
  read at the step, so a student at the question can switch to `no` and press →. The buttons queue actions after the
  script in the model param `queue` (letters S/W connect, N reinstall, K key, P password on/off, D forget); S records
  the "The client offers" choice at the time of the press (W = password only). A press is refused (the page re-renders,
  the last caption says the demo is full) once the run would pass 20 steps or 12 queued actions. Like http-exchange's
  `sent`, `queue` has no control, so queued actions are not kept across a reload or a language switch.
- **P toggles** `PasswordAuthentication` instead of only turning it off: the book insists that undoing is part of the job
  (Primjer 2, "Vraćanje"), and a run can show password back on.
- **K** makes the key pair when there is none (one step) and installs its public half (one step, a dashed arrow: setup,
  not part of a connection). The book copies it over one more password login; the page shows only the result. With
  password login off and no key installed yet the install is refused (the arrow ends in ✕ at the server): there is no
  way in to copy it, the lockout the book warns about.
- **D (forget)** removes every `known_hosts` line for the host; its caption says the new fingerprint was confirmed out of
  band first. The page shows the removed line struck through for that step.
- **Reinstall** gives the next of four host keys and never wraps (a reinstall must not bring back an old identity); N is
  refused after the last. Only the first (`a8FjBS…`) is the book's; the other three are made up.
- **"Reinstaliraj"** stays on the button (the captions say "ponovno instaliran"): "Ponovno instaliraj" wraps in the
  half-width button and pushes the panel past one screen.
- **Captions follow the case**, from flags in the events: a forget that removed a line makes the next question
  "again"; a forget of an unchanged key says so; a password-only attempt with no key pair is not "refusing its key";
  "Permission denied" without any key is the lockout, not the proof that hardening works.
- **Terminal text is data.** It is OpenSSH's literal output (both languages), checked against the strings in this
  machine's `ssh` binary: the first-connection question, `Permanently added`, the `REMOTE HOST IDENTIFICATION HAS
  CHANGED` block, `Offending ED25519 key in …:1`, `Host key verification failed.` The changed-key block is shown
  without the two lines that name the removal tool (`remove with:` and the command); the terminal grows for that step.
- **Commands.** The only command shown is the connection itself (`ssh student@192.168.122.57 'hostname'`, and with
  `-o PubkeyAuthentication=no` for the password-only attempt, as in Primjer 2 shortened). Key generation, key copying
  and `known_hosts` cleanup are shown by their effect, not by their tools (COMMON §1, concepts not tools).
- **Related:** `tls-handshake`, `cert-chain`.

## Deviations from the task

- Step counts: `second-connection` 4 (task 3) because a password login is two phases (prompt, then password);
  `host-key-changed` 7 (task 6) because the run ends with the session open (the book's transcript after
  `ssh-keygen -R`: yes → `Permanently added` → `demosrv1.lab.local`), with the user's key installed as in the book.
  `first-connection` 5, `key-login` 5, `password-off` 6 as the task says.
- `host-key-changed` starts with the server already reinstalled (the step-0 caption says so); N reinstalls again.
- `password-off` starts with password already off (Primjer 2 step 5 only: the two checks from the client).
- Added a "The client offers" choice (key then password / password only) so the student can reproduce rule 7 without
  the preset; and D (forget), which the task's rule 4 needs as an action.
- `known_hosts` holds one ED25519 line per host; the book's three lines for one address (three key types) are one.

## Sources

- UL `book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md`: "Udaljeni pristup: SSH, ključevi i otvrdnjavanje"
  (RFC 4251 architecture, first connection transcript after the stored key is removed, *otisak ključa*, the key pair
  `SHA256:ACblrD…`, `authorized_keys`, `publickey` REQUIRED vs password SHOULD, the two fingerprints that must not be
  confused) and Primjer 2 (the order of hardening, the two attempts, the `Permission denied` transcript).
- RFC 4251 §1, §4.1; RFC 4252 §5.1, §5.2, §7, §8: from memory, no network in this session.
- OpenSSH client messages: `strings` of the local `/usr/bin/ssh`.
- Numbers checked with a scratch script over all five presets (and `answer=no`) before the page was written.

## Unchecked *(check)*

- The tie-breaks when `known_hosts` has several lines for one host (a match wins; else the last differing line is the
  offending one), from memory of OpenSSH's hostfile check (the reviewer remembered the same). The model can only reach
  one line per host, so this shows only in the unit tests.
- That the default client (StrictHostKeyChecking `ask`) prints "Host key for … has changed and you have requested strict
  checking." on a changed key (the string is in the binary; the order of the lines is from memory).
- RFC section numbers above.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| host key | ključ poslužitelja | task, UL ch15 |
| user authentication | autentikacija korisnika | task, UL ch15 |
| man in the middle | aktivni posrednik | UL ch15 ("aktivan napad posrednika") *(check)* |
| trust on first use | povjerenje pri prvom spajanju | none *(check)* |

`known_hosts` is written as the file name in both languages (the task's "baza poznatih poslužitelja, check" appears as
the table title "poznati poslužitelji").

## Shared requests

- **Kit: page state in the URL without a control** (as http-exchange asked): the queue of button presses is lost on a
  reload or a language switch.
- **Kit: hidden controls.** `visible: () => false` sets `[hidden]`, but `.sd-ctl`'s `display` wins; the page adds
  `.sd-panel [hidden] { display: none }` (as http-exchange and cert-chain do).
- **K1: fields beside a short arrow.** On a two-lane chart a field on a message to the left lane runs past the client's
  lifeline into the time column; the page shortens the method list for that reason. An option to put fields under the
  chip would help (http-exchange and wifi-association asked for the same).

## Checks

- Tests: 35. Four tie-breaks first, rules 1–8, the setup actions (reinstall without wrap, key/install and the refused
  install, forget and its flags), the queue and its limits (exactly 20 allowed), connection numbering, the presets' step
  counts and events, a golden snapshot (`golden.json`) of every page-visible field per step (event, marks, rows added,
  terminal lines with their flags, connection, prompt) for the five presets, `answer=no` and two queued runs, then the
  template's generic block.
- Mutation pass on a copy: 43 mutations over every rule, the tie-breaks, the queue limits and the page-visible fields;
  one survives, and it is equivalent (the offending line number is always 1 in reachable states; the unit test of
  `hostCheck` covers the real tie-break).
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md, the book and the RFCs, ran 60 own
  mutations, fuzzed every queue of up to four letters over all presets and both answers (no exception, no connection
  left open, no prompt left), drove all preset steps in both languages (no console errors). Fixed from it: K installing a
  key while password login was off (now refused), captions for the no-key cases (lockout vs hardening, "refuses its key"
  without a key), "again" after a forget that removed nothing, a forget of an unchanged key, reinstall wrapping to the
  book's key, the "full" caption naming 20 steps when another limit applied, the offending-line tie-break (last, not
  first), "the only moment the server is checked" (only at the first connection), "the rest is encrypted" on a known
  key (encryption comes from the key exchange anyway), Croatian "privatnim parom" → "privatnim dijelom tog ključa",
  the term order (*host key* (ključ poslužitelja), as the term rule wants), a sentence starting with a lowercase term,
  "i to pri svakoj prijavi" attached to the wrong clause, "refused (no)" →
  "declined (no)", "sama lozinka" → "lozinka, otvoreni tekst", badge 2 after a refused connection ("never asked"),
  fields crossing the lifelines (shortened), the denied failure field hiding that password is missing; and the golden
  test for the 45 page-visible fields it found unpinned.
- Gate screenshots reviewed: light, dark, grayscale, phone, both languages; plus my own of every preset at the key steps
  and of the queued runs (refused install, reinstall, forget).

## Time

Start 11:21, done (gate, mutation pass, fresh review and its fixes) 11:55: about 34 minutes, one session.
