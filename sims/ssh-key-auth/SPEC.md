<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ssh-key-auth: specification

One concept: **known_hosts, key auth vs password, the first-connection warning.** Every SSH connection answers two
questions, with two different keys: 1. *is this the right server?* (the server's host key against the client's
`known_hosts`) and 2. *who is the user?* (the user's key against the server's `authorized_keys`, or a password).
Task: `docs/tasks/w2/ssh-key-auth.md`; catalogue `inet-ssh-key-auth` (§4.2).

## Scene

Client `democli1`, user `student`; server `demosrv1` at `192.168.122.57`, answering `demosrv1.lab.local` to
`hostname` (UL ch15, all names and both fingerprints). Key type ED25519 everywhere.

| Thing | Value | Source |
|---|---|---|
| server host key (book) | `SHA256:a8FjBS05WGhECCl2x0lY5eQjjVRGMGSZ5fx73CdxIBA` | UL ch15 transcript |
| server host key after a reinstall | `SHA256:Vq7mK2pXc9dLr4TnZ0sWb8yHf3EuJ6gAo1iQ5RtYzMk`, then `SHA256:h3TzR8nLq0WcY5vKe2PmX7aDj9sFu4GbN1oIt6QyBpE`, then `SHA256:Zt4pWn7cQe2hKs9Lb0vXr5mFy8uGd3oAj6iTq1NwE0c`; no wrap (a reinstall never brings an old key back), N is refused after the last | made up for the demo |
| user key pair `id_ed25519` | `SHA256:ACblrDNUk04LEEIo5iREeR+wTCukWUMPd4zUB5lJCd0` | UL ch15 |
| methods the server lists | `publickey,gssapi-keyex,gssapi-with-mic` + `,password` while allowed | UL ch15 Primjer 2 transcript |

## Rules

1. **Two questions, two parts of SSH.** The transport layer authenticates the *server* and encrypts; the user
   authentication protocol authenticates the *user* (RFC 4251 §1; UL ch15). On the page: badge 1 belongs to the
   key exchange and the `known_hosts` check, badge 2 to user authentication; every message after the key exchange is
   drawn locked.
2. **The client must know the host key in advance** (RFC 4251 §4.1). The check looks only at `known_hosts` lines for
   this host and this key type.
3. **Unknown host → ask.** No line for the host: the client prints the fingerprint and asks
   (`yes/no/[fingerprint]`). `yes` appends a line and prints `Permanently added`; the next connection matches it
   without asking (trust on first use). `no` → `Host key verification failed.`, nothing stored. Answering `yes`
   without comparing keeps protection against a passive eavesdropper only, not against an active man in the middle
   (RFC 4251 §4.1; UL ch15).
4. **Changed key → refuse.** A line with a different key of the same type and no line with the same key: the client
   prints `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!` … `Offending ED25519 key in …known_hosts:<line>` …
   `Host key verification failed.` and ends; there is no question (OpenSSH `ssh(1)`; wording checked against the
   local client binary's strings). The two lines the client prints after the offending line, naming the tool that
   removes it, are left out (concepts, not tools; COMMON §1). The fix (action *forget*): confirm the new fingerprint out of band, then remove
   the old line; the next connection is "unknown" and asks.
   **Tie-break:** a line with the same key wins over a line with a different one (known, the first same line);
   with several differing lines the last one is the offending line (OpenSSH's hostfile check keeps overwriting the
   found entry and stops only on a match). *(from memory of the source; check)* The model reaches one line per host,
   so this shows only in the unit tests.
   A forget that removed a line makes the next "unknown" a repeated question (`ev.again`), not a first connection;
   `ev.changed` says whether the removed line held another key than the server has now.
5. **Order of methods.** `publickey` is the only REQUIRED method, `password` SHOULD (RFC 4252 §7, §8). The client tries
   publickey first when it has a key pair and is allowed to use it, then password if the server still lists it.
   Without a key to offer it sends the `none` request, whose failure lists the methods (RFC 4252 §5.2).
   Simplification: a real client sends `none` first in every case (a MAY in §5.2); the chart shows it only where the
   list is the point.
6. **Key login.** The client sends its public key and a signature made with the private key; the server accepts when
   the public key is in `authorized_keys`. The private key never crosses the network (RFC 4252 §7; UL ch15). A
   password does cross it, in clear inside the encrypted packet (RFC 4252 §8), at every login.
7. **Password off.** With `PasswordAuthentication no` the list lacks `password`; a client that will not use its key
   gets `student@192.168.122.57: Permission denied (publickey,gssapi-keyex,gssapi-with-mic).` (UL ch15 Primjer 2).
   A key that is not in `authorized_keys` fails the same way when password is off, and falls back to the password
   prompt when it is on.
8. **Two fingerprints.** The host key's fingerprint (`SHA256:a8FjBS…`, server icon) and the user key's
   (`SHA256:ACblrD…`, person icon) are different things and are drawn apart (UL ch15).

## Steps

One step = one phase of one action. A connection:

| Phase | What happens | Ends the connection when |
|---|---|---|
| `kex` | TCP to port 22, key exchange; the server presents its host key | — |
| `check` | the client compares it with `known_hosts` | mismatch (refused) |
| `answer` | only after "unknown": the user's yes/no (param `answer`) | no (declined) |
| `auth` | publickey (or `none`), the server's answer; accepted → session; password listed → password prompt; else denied | key accepted, denied |
| `password` | the password is sent, accepted, the session opens | always |

Steps per connection: known host + key 3; known + password 4; unknown + key 4; unknown + password 5; changed 2;
unknown + `no` 3; denied 3.

Other actions, one step each: `reinstall` (new host key), `pwset` (toggle `PasswordAuthentication`), `forget` (remove
every `known_hosts` line for the host), `key` (two steps when there is no key pair yet: `keygen`, then `install`;
`install` of a key already in `authorized_keys` adds nothing; `install` is **refused** while `PasswordAuthentication`
is `no` and `authorized_keys` is empty, because copying the public half needs a login and the only one left would be
a password: the lockout UL ch15 Primjer 2 warns about).

## Presets

| # | id | Setup | Script | Steps (task) |
|---|---|---|---|---|
| 1 | `first-connection` | empty `known_hosts`, no key pair, password on | connect | 5 (5) |
| 2 | `second-connection` | key known, no key pair, password on | connect | 4 (3) |
| 3 | `host-key-changed` | stored `a8FjBS…`, server reinstalled (`Vq7mK2…`), key installed, password on | connect, forget, connect | 7 (6) |
| 4 | `key-login` | key known, no key pair, password on | key, connect | 5 (5) |
| 5 | `password-off` | key known, key installed, password off | connect, connect refusing the key | 6 (6) |

Expected (checked with a script before the page was written, and pinned in `sim.test.js`):

- `first-connection`: kex · check unknown, prompt with `a8FjBS…` · yes → line 1 · `none` → failure with password →
  password prompt · password → `demosrv1.lab.local`. With `answer=no`: 3 steps, `Host key verification failed.`
- `second-connection`: kex · known (line 1) · password prompt · session.
- `host-key-changed`: kex (`Vq7mK2…`) · mismatch, offending line 1 · forget (1 line) · kex · unknown, prompt with
  `Vq7mK2…` · yes → line 1 · publickey accepted → session.
- `key-login`: keygen (`ACblrD…`) · install (authorized_keys line 1) · kex · known · publickey → session.
- `password-off`: kex · known · publickey → session · kex · known · `none` → failure
  `publickey,gssapi-keyex,gssapi-with-mic` → denied.

The buttons queue actions after the script (S connect, W connect refusing the key, N reinstall, K key, P password
on/off, D forget); a press is refused when the run would pass 20 steps or 12 queued actions, or N when no new host key is left.
Exactly 20 steps is allowed.

## Out of scope

Server configuration precedence (UL ch15's drop-in that "did not take"), SSH certificates, agent and port forwarding,
SELinux labels, `StrictModes`, several key types per host (the book's three lines for one address are one line here).
