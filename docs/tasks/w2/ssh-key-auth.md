# ssh-key-auth: SSH host and user keys

| | |
|---|---|
| Task | `ssh-key-auth` (wave 2b, Internet protocols) |
| Catalogue entry | `inet-ssh-key-auth` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/ssh-key-auth/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | UL |
| Topic / tags / level | `internet` / `ssh` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **known_hosts, key auth vs password, the first-connection warning**.

The student: connect, change the host key, add a key.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md` (Uvod u Linux): "Udaljeni pristup: SSH, ključevi i otvrdnjavanje" (RFC 4251 architecture, host key and first connection, `ssh-keygen -R` transcript, definition *otisak ključa*, `ssh-keygen -t ed25519`, `ssh-copy-id`, `publickey` REQUIRED vs password SHOULD, `PasswordAuthentication no`, definition *otvrdnjavanje*) and **Primjer 2 — lozinka ili ključ, i kako se ta odluka brani**
- `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-15/` (diagrams for the chapter)
- RFC 4251 §1, §4.1; RFC 4252 §7, §8; RFC 4253 §4.1 (port 22)
- OpenSSH manual pages `ssh(1)` (StrictHostKeyChecking, host key mismatch), `sshd_config(5)` (PasswordAuthentication, AuthorizedKeysFile)
- Catalogue seed: UL ch15

## Model and presets

- **Scene:** kit view K1 message sequence chart, client `democli1` (user `student`) and server `demosrv1` (192.168.122.57), as in UL ch15. Client side shows `~/.ssh/known_hosts` (host → key type → fingerprint) and the key pair `id_ed25519` / `id_ed25519.pub`; server side shows its host key (ED25519, fingerprint `SHA256:a8FjBS…`), `~/.ssh/authorized_keys` and the effective `passwordauthentication` value. Two question badges over the chart: "1. Is this the right server?" and "2. Who is the user?".
- **State:** `{ client: { knownHosts: [{ host, type, fp }], keyPair: { fp }|null }, server: { hostKey: { type, fp }, authorizedKeys: [fp], passwordAuth: bool }, conn: { phase, hostCheck: 'known'|'unknown'|'mismatch'|null, userAuth: 'publickey'|'password'|'denied'|null }, prompt|null, transcript[] }`.
- **One step:** one phase of one connection, in order: (1) TCP to port 22 and key exchange; the server presents its host key; (2) the client checks it against `known_hosts` (rule 2–4); (3) user authentication tried in order publickey, then password if allowed (rules 5–7); (4) the session opens or the connection ends with the printed message.
- **Rules:**
  1. SSH has three parts: the transport layer authenticates the **server** and gives confidentiality and integrity; the user authentication protocol authenticates the **client user**; the connection protocol multiplexes channels (RFC 4251 §1; UL ch15 "Udaljeni pristup: SSH, ključevi i otvrdnjavanje").
  2. The client must know the server's host key in advance to verify it (RFC 4251 §4.1).
  3. First connection (host not in `known_hosts`): the client shows the **fingerprint** and asks; on `yes` the key is stored and never asked again ("trust on first use"). Accepting without comparing keeps protection against passive eavesdropping only, not against an active man in the middle (RFC 4251 §4.1; UL ch15, the transcript after the stored key is removed).
  4. Host key differs from the stored one → the client warns that the remote host identification has changed and refuses to connect (client behaviour, check exact wording). Fix only after confirming the new fingerprint out of band, then remove the old entry (UL ch15).
  5. `publickey` is the only REQUIRED method; `password` is SHOULD (RFC 4252 §7, §8; UL ch15 Primjer 2).
  6. Public-key login: the server accepts if the client proves possession of a private key whose public key is in `authorized_keys`; the private key never crosses the network (RFC 4252 §7; UL ch15). The password does cross the network, in clear inside the encrypted transport (RFC 4252 §8).
  7. With `PasswordAuthentication no` a client that refuses to use its key gets `Permission denied (publickey,gssapi-keyex,gssapi-with-mic).` (UL ch15 Primjer 2 transcript).
  8. Host-key and user-key fingerprints are different things and must not be confused (UL ch15: `SHA256:a8FjBS…` is the server's, `SHA256:ACblrD…` the user's).
- **Params:** button `connect` (key S); choice `answer` at the prompt yes/no, default yes; buttons `reinstall-server` (new host key, key N), `install-user-key` (key K), `disable-password` (key P); each takes effect at the next step.
- **Presets:**
  1. `first-connection` — empty `known_hosts`: "The authenticity of host '192.168.122.57 …' can't be established. ED25519 key fingerprint is SHA256:a8FjBS…" → yes → "Permanently added" → password login → `demosrv1.lab.local`. From UL ch15.
  2. `second-connection` — same host, key known: no question, straight to user auth. From UL ch15.
  3. `host-key-changed` — server reinstalled, new host key: warning, connection refused; after the old entry is removed and the fingerprint checked, the next connection asks again. Derived from UL ch15 and RFC 4251 §4.1 (check message text).
  4. `key-login` — an Ed25519 key pair is made on the client (fingerprint `SHA256:ACblrD…`) and its public half installed in `authorized_keys` → the next login uses publickey without a password prompt. From UL ch15.
  5. `password-off` — UL ch15 Primjer 2 step 5: a normal login passes with the key; the forced password-only attempt gets "Permission denied (publickey,gssapi-keyex,gssapi-with-mic)." From UL ch15 Primjer 2.
- **Steps:** `first-connection` 5; `second-connection` 3; `host-key-changed` 6; `key-login` 5; `password-off` 6.
- **Legend:** server-key fingerprints drawn with a server icon, user-key fingerprints with a person icon (rule 8), lock on the encrypted part of the chart, prompt bubble; "changed" marks the `known_hosts` or `authorized_keys` line written this step.
- **Captions:** hr: "Prvo spajanje: klijent ključ poslužitelja ne poznaje i pokazuje njegov otisak SHA256:a8FjBS…. Odgovor yes bez usporedbe isključuje zaštitu od aktivnog posrednika." en: "First connection: the client does not know the server's key and shows its fingerprint SHA256:a8FjBS…. Answering yes without comparing switches off the protection against an active man in the middle."
- **Terms:** *remote shell* — udaljena ljuska; *host key* — ključ poslužitelja; *key fingerprint* — otisak ključa; *key pair* — par ključeva; *user authentication* — autentikacija korisnika; *hardening* — otvrdnjavanje; *known hosts* — `known_hosts` (baza poznatih poslužitelja, check).
- **Misconceptions:** "the first-connection question is noise, just type yes"; "with keys, the server needs my private key"; "a password sent over SSH is encrypted, so it is as good as a key" (it still leaves the machine at every login).
- **Out of scope:** server configuration precedence (first value read wins, why the book's later drop-in did not override an earlier one in UL ch15) — a separate concept, see the note; SSH certificates, agent forwarding, port forwarding (`ssh-tunnels`), SELinux label on `authorized_keys`.
- **Note for the coordinator:** UL ch15's `PasswordAuthentication` story ("written, syntax OK, still `yes`") is a config-precedence concept, not key authentication; if wanted, it belongs to a "first match wins" page (§5.1 cluster), not here.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `ssh-key-auth` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh ssh-key-auth sims/ssh-key-auth` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ssh-key-auth/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
