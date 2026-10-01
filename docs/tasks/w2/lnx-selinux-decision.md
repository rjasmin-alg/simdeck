# lnx-selinux-decision: DAC says yes, SELinux says no

| | |
|---|---|
| Task | `lnx-selinux-decision` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-selinux-decision` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-selinux-decision/` |
| Class | stepper |
| Size | S |
| Priority | P1 |
| Courses | UL |
| Topic / tags / level | `linux-admin` / `selinux` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **a second, label-based check after permissions**.

The student: change modes and contexts, retry access.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md` (Uvod u Linux) and its diagrams in `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-15/`
- Catalogue seed: UL ch15 (dozvola-i-politika.svg, tri-mjesta-koja-kazu-ne.svg)
- UL ch15, section "SELinux: načini rada, konteksti i čitanje odbijanja", Što treba znati (sshd on 8991,
  `ausearch -m AVC`, `semanage port -a`, `setenforce 0`) and Šire o temi (`cp` vs `mv`, `restorecon`,
  booleans); Primjer 4 "tri odbijenice, tri različita ispisa"
- Figures `/home/rjasmin/projects/uvod-u-linux/assets/diagrams/chapter-15/dozvola-i-politika.svg` and
  `tri-mjesta-koja-kazu-ne.svg`
- Man pages cited by UL ch15: selinux(8), semanage-port(8), setenforce(8), restorecon(8), ausearch(8)

## Model and presets

- **Scene:** a decision path (kit "decision path" view if it exists, else own): process box (`comm`, UID,
  `scontext`) → gate 1 **DAC** (mode bits, owner; who sets it: the owner) → gate 2 **SELinux policy** (a
  small allow table `source_t target_t:class perm`; who sets it: the system policy) → **mode** switch
  (enforcing / permissive) → outcome. Below: the object box (file path or TCP port, `ls -l` mode, `tcontext`)
  and an audit-log strip where AVC lines appear, plus the `ss -tlnp` / result line the student sees.
- **State:** `{ proc: { comm, uid, scontext }, obj: { kind: 'file'|'port', name, mode, owner, tcontext },
  perm, tclass, policy: [rules], portLabels: { 22: 'ssh_port_t', … }, mode: 'enforcing'|'permissive',
  phase, dac: null|bool, mac: null|bool, outcome: null|'allowed'|'denied', audit: [avc], actions: [] }`.
- **One step:** phases in order: (1) the process attempts the action; (2) DAC check; (3) if DAC allowed,
  look up the type pair in the policy; (4) the mode decides whether a MAC "no" is enforced, and the AVC line
  is written; (5) outcome. Fix presets continue with an action step (`semanage …`, `restorecon`,
  `setenforce`) and a retry.
- **Rules:**
  1. Two checks, both must say yes; DAC first, then MAC; MAC can only take away, never grant what DAC
     refused (UL ch15 "SELinux: načini rada…", fig. `dozvola-i-politika.svg`).
  2. If DAC refuses, the policy is not consulted and no AVC is written; the error is a plain
     "Permission denied" (kernel order DAC → LSM hook (check)).
  3. The decision uses the **type** field of `user:role:type[:range]` (UL ch15, definition of sigurnosni
     kontekst); the model ignores user, role, range.
  4. A port's type comes from the port-label table: on the book machine only 22 is `ssh_port_t`; 8991 is
     `unreserved_port_t` (UL ch15, `semanage port -l`).
  5. enforcing: a denial is enforced and logged; permissive: the access is allowed and the same denial is
     logged with `permissive=1`. The mode never changes which access the policy would deny (UL ch15).
  6. AVC record fields shown: `denied { perm }`, `comm`, `scontext`, `tcontext`, `tclass` (UL ch15,
     `ausearch -m AVC`).
  7. A file's label belongs to the inode: `cp` creates a new file labelled for its new place, `mv` keeps the
     old label; `restorecon` resets the type to the policy default (UL ch15 "Šire o temi").
  8. Tie-break: `setenforce` changes the current mode only; `/etc/selinux/config` holds the boot mode; a
     "reboot" step returns to the config value (UL ch15).
- **Params:** `mode` choice enforcing/permissive, default enforcing; `fix` choice none / `semanage port -a`
  / `restorecon` (per preset), default none; `dacOk` toggle (preset 4), default on.
- **Presets:**
  1. `sshd-8991` — sshd (`sshd_t`, root) binds TCP 8991: DAC yes; policy has no `sshd_t
     unreserved_port_t:tcp_socket name_bind` → denied; AVC `denied { name_bind } comm="sshd" src=8991
     tcontext=…unreserved_port_t tclass=tcp_socket`; `systemctl is-active` says `active`, `ss` shows only
     22. Step `semanage port -a -t ssh_port_t -p tcp 8991`, restart → `ss` shows 8991 and 22 (from UL ch15).
  2. `permissive-switch` — same start, `setenforce 0`, restart → 8991 listens, AVC still `denied` with
     `permissive=1`, `semanage port -l` still 22 only; `setenforce 1` → back to 22 only (from UL ch15).
  3. `mv-label` — `authorized_keys` copied to `/tmp` (`user_tmp_t`) and moved back keeps `user_tmp_t`;
     `restorecon -v` relabels to `ssh_home_t` (from UL ch15). That sshd is then denied reading it and key
     login fails is derived, unchecked.
  4. `dac-first` — a file `-rw-------` owned by another user, read by an unconfined user: DAC denies, no
     AVC, SELinux never asked (derived, unchecked).
- **Steps:** preset 1 = 9 (attempt, DAC, MAC, mode, outcome, fix, restart, DAC, MAC+outcome); 2 = 9;
  3 = 7; 4 = 3.
- **Legend:** gate open ✓ / closed ✗ (shape + label); mode switch position; new AVC line highlighted;
  "changed" marks the label or mode the last action changed.
- **Captions:**
  - hr: "Dozvole kažu da, politika kaže ne: `sshd_t` se ne smije vezati na `unreserved_port_t`."
  - en: "Permissions say yes, the policy says no: `sshd_t` may not bind to `unreserved_port_t`."
  - hr: "U načinu `permissive` radnja prolazi, ali odbijanje je i dalje zabilježeno — pravilo se nije promijenilo."
  - en: "In permissive mode the action goes through, but the denial is still logged — the rule hasn't changed."
- **Terms:** mandatory access control — obvezna kontrola pristupa; security context — sigurnosni kontekst;
  policy — politika; SELinux mode — način rada SELinuxa; AVC denial — odbijanje pristupa; discretionary
  (permissions) — diskrecijska (dozvola); policy boolean — logička varijabla.
- **Misconceptions:** `setenforce 0` fixed it; correct `rwx` means access is allowed; SELinux replaces
  permissions instead of adding a second check.
- **Out of scope:** booleans (mention), `audit2allow`, MLS/MCS ranges, the firewall layer of
  `tri-mjesta-koja-kazu-ne.svg` (`lnx-firewalld-zones`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-selinux-decision sims/lnx-selinux-decision` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-selinux-decision/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
