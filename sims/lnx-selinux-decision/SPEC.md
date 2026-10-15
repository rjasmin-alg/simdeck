<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-selinux-decision: specification

One concept: **a second, label-based check after permissions.** A process tries one access; the permission check
(DAC) answers first, then the SELinux policy is looked up by the type pair, and the mode decides whether a "no" from
the policy is enforced. The student changes a label or the mode and retries.

Task: `docs/tasks/w2/lnx-selinux-decision.md`. Catalogue: `lnx-selinux-decision` (`docs/catalogue.md` §4.4). Class:
stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[UL15]** `uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md`, "SELinux: načini rada, konteksti i
  čitanje odbijanja". "Što treba znati": definitions *obvezna kontrola pristupa*, *politika*, *način rada SELinuxa*,
  *sigurnosni kontekst*, *odbijanje pristupa*; `sestatus` (`Current mode` / `Mode from config file`),
  `/etc/selinux/config`; `id -Z`, `ls -Z`, `ps -eZ` (the contexts used here); sshd on 8991: `systemctl is-active` →
  `active`, `ss -tlnp` → only 22, `ausearch -m AVC` (fields `denied { name_bind }`, `comm="sshd"`, `src=8991`,
  `scontext=…sshd_t…`, `tcontext=…unreserved_port_t…`, `tclass=tcp_socket`), `semanage port -l` → `ssh_port_t tcp 22`,
  `semanage port -a -t ssh_port_t -p tcp 8991` → `8991, 22`, restart → 8991 and 22 listen; `setenforce 0` → 8991
  listens, `semanage port -l` still 22, the AVC still `denied` with `permissive=1`; `setenforce 1` + restart → 22 only.
  "Šire o temi": `cp` to `/tmp` gives `user_tmp_t`, `mv` back keeps it, `restorecon -v` relabels to `ssh_home_t` and
  changes only the type; booleans (explanation only). Its footnotes cite selinux(8), selinux_config(5), setenforce(8),
  semanage-port(8), restorecon(8), ausearch(8) and The SELinux Notebook ("Security Context").
- **[UL15-fig]** `uvod-u-linux/assets/diagrams/chapter-15/dozvola-i-politika.svg` (two checks, not one instead of the
  other; who sets each answer: the owner / the system policy) and `tri-mjesta-koja-kazu-ne.svg` (SELinux refuses what
  the permissions allowed; "seen as: the service is active and `ss -tlnp` does not show the port"). Layout ideas only.
- **[UL15-ex4]** UL15 "Primjer 4 — tri odbijenice, tri različita ispisa": the AVC record is the only proof that SELinux
  said no.
- **[kernel]** Linux `fs/namei.c` `inode_permission()`: the mode-bit check (`do_inode_permission`) returns first; only
  then `security_inode_permission()` (the LSM hook SELinux uses). *(check: from memory of the kernel source, not
  re-read for this task)*
- **[ssh]** OpenSSH reads `authorized_keys` with the user's UID (`temporarily_use_uid`). *(check: from memory, not
  re-read; it only decides the UID shown in the `keys` scene)*

## Scene

- **Command line** across the top: the command this step runs (`$ sudo systemctl restart sshd`,
  `$ sudo semanage port -a …`), or a sentence where nothing is typed (sshd reading the keys at a login, a boot).
- **The decision path**, left to right: the **process** (`comm`, UID, `scontext` with the type in bold) → **gate 1,
  permissions** (who sets it: the owner; the class that applies, its three bits, the bit needed) → **gate 2, SELinux
  policy** (who sets it: the system policy; the request `source_t → target_t : class perm`) → the **mode** switch
  (enforcing / permissive, and the boot mode from `/etc/selinux/config`) → the **outcome**. Each gate shows ✓ yes, ✕ no
  or – not asked, as a symbol, a word and a border style.
- Below: the **object** (a TCP port with its label table, or the files with `ls -l` mode, owner and `ls -Z` context),
  the **policy table** (kit view K4: the allow rows, the row that decides outlined, the implicit "no rule → deny"),
  the **audit log** (AVC lines; the new one highlighted), and **what the admin sees** (`systemctl is-active`,
  `ss -tlnp`, `semanage port -l`; or the key login; or `cat`'s output).

## State

```
{ scene: 'port' | 'keys' | 'secret',
  proc: { comm, uid, scontext }, obj: { kind: 'port', name, proto, tcontext } | { kind: 'file', name, inode, mode,
  owner, group, tcontext }, perm, tclass, policy: [{ src, tgt, tclass, perm }], portLabels: { 22: 'ssh_port_t', … },
  files: [{ inode, path, owner, group, mode, tcontext }], mode, configMode,
  phase: 'start' | 'action' | 'attempt' | 'dac' | 'mac' | 'mode' | 'outcome', attempt (count),
  dac: null | bool, dacWhy: { cls: 'owner' | 'group' | 'other', bits, need, ok } | { cls: 'port', port, ok },
  mac: null | bool, macAt: winning row (policy.length = no rule), enforced: null | bool,
  outcome: null | 'allowed' | 'denied', audit: [{ perm, comm, src | name, scontext, tcontext, tclass, permissive }],
  actions: [done so far], action (this step's), cmd (text or null), changed: [marks],
  listening: [ports] (port scene), seen: null | 'ok' | 'denied' (file scenes) }
```

## Steps

Step 0 is the starting picture. Then the plan for the params, one entry per step group:

- the scene's own actions (`keys`: `cp`, then `mv`), one step each;
- an **attempt**: (1) `attempt` the process tries; (2) `dac` the permission check; (3) `mac`, only if DAC said yes:
  the type pair is looked up; (4) `mode`, only if the policy said no: enforced or not, and the AVC is written;
  (5) `outcome`;
- `fix = relabel`: `semanage port -a` (port) or `restorecon -v` (files), then an attempt;
- `fix = setenforce`: `setenforce 0`, an attempt, then `setenforce 1` (or a reboot, `undo`), an attempt.

An attempt is 3 steps (DAC no), 4 (DAC yes, policy yes) or 5 (policy no).

## Rules

| # | Rule | Source | Test |
|---|---|---|---|
| 1 | Two checks, both must say yes; DAC first, then MAC. MAC can only take away, never grant what DAC refused. | UL15, UL15-fig | `rule 1` ×2 |
| 2 | If DAC refuses, the policy is not consulted and no AVC is written; the error is a plain "Permission denied". | kernel, UL15-ex4 (derived) | tie-break `rule 2` ×2 |
| 3 | The decision uses the **type** field of `user:role:type[:range]`; user, role and range are ignored. | UL15 (definition) | `rule 3` |
| 4 | A port's type comes from the port label table: 22 is `ssh_port_t`, 8991 `unreserved_port_t`; `semanage port -a` changes the table. | UL15 | `rule 4` |
| 5 | enforcing: a denial is enforced and logged; permissive: allowed and logged with `permissive=1`. The mode never changes **which** access the policy denies. | UL15 (definition, `setenforce 0` run) | tie-break `rule 5` ×2 |
| 6 | The AVC record shows `denied { perm }`, `comm`, `scontext`, `tcontext`, `tclass` (+ `src=` for a port, `name=` for a file, `permissive=`). | UL15 | `rule 6` |
| 7 | A file's label belongs to the inode: `cp` makes a new file labelled for its new place, `mv` keeps the old label; `restorecon` resets the type to the default for the path. | UL15 "Šire o temi" | `rule 7` ×2 |
| 8 | Tie-break: `setenforce` changes the current mode only; `/etc/selinux/config` holds the boot mode; a reboot returns to it. | UL15 | tie-break `rule 8` |
| 9 | The policy is looked up top down; the first row that matches source type, target type, class and permission allows; no row → denied (the implicit row). | UL15 (`audit2allow` prints `allow`-style rules: only what is allowed is written) | `rule 9` |

The permission check (gate 1): a file's mode string has owner, group and other triplets; the owner's triplet applies
when the UID is the owner, else the group's when it is the group, else other's; the access needs `r`. A port has no
mode bits: one at 1024 or above needs no privilege, so gate 1 says yes for 8991 (derived; the model ignores the UID
here, so it does not model a privileged process binding a port below 1024). The group class compares the UID with
the file's group, which assumes user private groups (UID = GID, as on the book machine for `student`).

## Presets and expected numbers

| Preset | Params | Steps | Outcome sequence | Audit at the end | Seen at the end | Source |
|---|---|---|---|---|---|---|
| `sshd-8991` | port, fix relabel | 10 | denied, allowed | 1 AVC, `permissive=0` | `ss`: 8991, 22; `ssh_port_t tcp 8991, 22` | UL15 |
| `permissive-switch` | port, fix setenforce, undo setenforce 1 | 17 | denied, allowed, denied | 3 AVC: 0, 1, 0 | `ss`: 22; `ssh_port_t tcp 22` | UL15 |
| `mv-label` | keys, fix relabel | 12 | denied, allowed | 1 AVC, `name="authorized_keys"`, `user_tmp_t` | key login works | UL15 (labels); denial derived |
| `dac-first` | secret, dacOk off | 3 | denied | none | `cat: /tmp/plan.txt: Permission denied` | derived |

Defaults (`port`, fix none, enforcing): 5 steps, denied, 1 AVC (`sim.json` `steps`). Other numbers: start permissive,
no fix: 5 steps, allowed, 1 AVC with `permissive=1`. `secret` with dacOk on: 4 steps, allowed (row 4), no AVC.
`dac-first` with fix setenforce: 11 steps, denied three times, no AVC at all. `undo reboot`: 17 steps, as `setenforce 1`.

The model's numbers were printed by a script before the page was written and are asserted in `sim.test.js`.

## Simplifications

- **A small policy excerpt.** Four allow rows; the real `targeted` policy has many thousands, conditional rules
  (booleans) and type transitions. Rows 1 (`sshd_t ssh_port_t:tcp_socket name_bind`, `semanage-port(8)` example via
  UL15) and 2 are what the book's runs imply; rows 3 and 4 are plausible, *(check)*.
- **"Labelled for its new place."** `cp` into `/tmp` gives `user_tmp_t` (UL15, measured); in the real system that comes
  from a type-transition rule for the creating process, not from the file-context table that `restorecon` reads. The
  model uses one `defaultType(path)` for both.
- **Order for a port.** For a file the kernel runs the mode-bit check before the LSM hook. For `bind()` the LSM hook
  runs first and the privileged-port check after it; the model shows the same order for both because gate 1 says
  yes for 8991 either way.
- **The `keys` scene's denial is derived.** The book shows only the labels (`cp`, `mv`, `restorecon`); that sshd is then
  refused the read (`{ read }`, `tclass=file`) and the key login fails is the task's derivation, unchecked on a
  machine. In reality more than one AVC may appear (`read`, `open`, `getattr`).
- **"DAC no → no AVC"** holds for an ordinary process (the `secret` scene). For a privileged process a DAC "no" leads to
  a capability check (`dac_override`) that SELinux does mediate and may log; out of scope.
- **sshd keeps running** when the bind to 8991 is refused (UL15: `is-active` says `active`, 22 still listens); the model
  shows it as "active" throughout and does not model the service.
- **The mode param** sets the current mode at step 0; the boot mode (`/etc/selinux/config`) is always `enforcing`.
- **`disabled`** (the third mode, deprecated in favour of `selinux=0`), booleans, `chcon`, `semanage fcontext`,
  `audit2allow`, MLS/MCS ranges and the firewall layer of `tri-mjesta-koja-kazu-ne.svg` are out of scope (task; the
  explanation mentions booleans).
