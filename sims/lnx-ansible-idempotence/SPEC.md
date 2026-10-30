<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-ansible-idempotence: spec

One concept: **a script run twice breaks things; a declarative task doesn't.** Two identical hosts: A is configured
by a shell script, B by a playbook with the same tasks; both are run up to three times. Task:
`docs/tasks/w3/lnx-ansible-idempotence.md`.

## Sources

- **[UL]** Uvod u Linux, ch. 17 (`book/chapters/17-skripte-s-parametrima.md`): "Kad ljuska nije pravi alat", Šire o
  temi: "Skripta … kaže koje se radnje izvode … Ako se pokrene dvaput, radnje se izvode dvaput, pa se u nju moraju
  upisati sve provjere postoji li već ono što treba stvoriti"; a playbook "iskazuje željeno stanje"; a script grown
  into "ako ovoga nema, stvori; … ako je takvo kakvo treba, ne diraj" "počela je opisivati stanje, a to radi jezikom
  koji za opis stanja nije napravljen". Footnote ch17-ansible: "Introduction to Ansible", ansible-core 2.19, "You
  declare the desired state of a local or remote system in your playbook." "Skripta koja smije raditi bez nadzora"
  (`set -e`).
- **[AM]** Ansible module documentation (`ansible.builtin.lineinfile`, `file`, `user`, `copy`, `service`,
  `command`): each module compares the requested state with the host and reports `changed` only when it acted;
  `command`/`shell` always report `changed` unless `creates`/`removes`/`changed_when` say otherwise.
- **[AH]** Ansible documentation, "Handlers: running operations on change": a task with `notify` notifies the handler
  only when it reports `changed`; notified handlers run once, after all the play's tasks, however many tasks notified
  them.
- **[AR]** PLAY RECAP: `ok` counts every successful task result, the changed ones included; `changed` is the subset
  that changed the host *(check against a running ansible-core)*.
- **[P]** POSIX `set -e`: the shell exits when a command fails, except a command in an `&&`/`||` list other than the
  last. mkdir(1): exit > 0 on error ("File exists"; GNU coreutils exits 1). useradd(8) EXIT VALUES: 9 "username or
  group name already in use".
- **[T]** the task file (model, presets, captions, terms).

## State

`{ run, pc, edit, edited, hosts: { A, B }, results: { A: [line result | null], B: [task result | null] },
stopped: { A }, notified, exitA, recap: [{ run, A: { exit, stopped }, B: { ok, changed, failed } }] }`.
A host is `{ hostsLines: [], dirs: [], users: [], conf: 'default'|'ours', restarts }`; both start as
`['127.0.0.1 localhost']`, no `/srv/app`, users `['root']`, the web server's stock `web.conf`, 0 restarts.
A line result is `{ outcome: 'done'|'error'|'skipped', exit, changed, msg }` (`changed` = the line wrote the host;
the script itself reports only its exit status). A task result is `{ outcome: 'ok'|'changed'|'none' }` (`none` = the
handlers phase with nothing notified). `results` hold the current run; `recap` every finished one.

## One step

The schedule is `runs` × the play's items, with the manual edit after run 1 when it applies. One step runs item k on
both hosts in lockstep [T]: (1) script line k acts on A and sets `$?`; (2) task k on B compares desired with actual
state and acts only on a difference; (3) after the last item of a run, A's exit status and B's recap are written.
At the start of each run the results clear, the script is no longer stopped and nothing is notified.

## Plays

| play | script (A) | playbook (B) |
|---|---|---|
| `hosts` | `echo "10.0.0.5 db01" >> /etc/hosts` | `lineinfile: {path: /etc/hosts, line: "10.0.0.5 db01"}` |
| `three` | + `mkdir /srv/app`, `useradd deploy` | + `file: {path: /srv/app, state: directory}`, `user: {name: deploy}` |
| `guarded` | `grep -qxF "…" /etc/hosts \|\| echo "…" >> /etc/hosts`, `mkdir -p /srv/app`, `id deploy &>/dev/null \|\| useradd deploy` | as `three` |
| `handler` | `cp web.conf /etc/web/web.conf`, `systemctl restart web` | `copy: {src: web.conf, dest: /etc/web/web.conf}` + `notify: restart web`; handler `service: {name: web, state: restarted}` |

The script starts with `#!/bin/bash` and, when `setE` is on, `set -e`. The playbook has `gather_facts: false`, so the
recap counts only the tasks shown.

## Rules

1. **A script line repeats its action every run** [UL]: `>>` appends another copy of the line on each run (`hosts`
   after 3 runs: 3 copies, exit 0 each run). `cp` writes the file every run; `systemctl restart web` restarts every
   run.
2. **A task states the desired state; the module acts only on a difference** [UL, AM]: present → `ok`, absent →
   acts and reports `changed`. `copy` compares the content: same → `ok`. *Note on the page:* `command:`/`shell:`
   tasks are not idempotent by themselves (always `changed`) [AM].
3. **Plain create commands fail on an existing object** [P]: `mkdir /srv/app` → exit 1 ("File exists"),
   `useradd deploy` → exit 9 ("already exists"). Nothing on the host changes.
4. **`set -e`** [UL, P]: on, the script stops at the first failing line; the lines after it do not run (`skipped`)
   and the script's exit status is that line's. Off, it runs on and the final status is the last line's.
   *Tie-break:* the stop lasts until the end of the run; the next run starts the script fresh (the recap keeps
   whether a run stopped). The playbook is not affected (B runs every task). No play here has a failure followed
   by a success; a test play (`mkdir`, then `>>`) checks that without `set -e` the later 0 hides the earlier 1.
5. **A guarded script is idempotent too** [UL]: the guard finds the object and the line does nothing, exit 0. The
   guard is the left side of `||`, so `set -e` does not stop the script when it fails [P].
6. **Handler** [AH]: `copy` notifies `restart web` only when it reports `changed`; the handler runs once in the
   handlers phase, after the last task. Not notified → it does not run and is not counted (`none`). The script
   restarts every run.
7. **Recap** [AR]: `ok` = tasks (and handlers that ran) with `ok` or `changed`; `changed` = those with `changed`;
   `failed` = 0 in every play here.
8. **Manual edit** [T]: between run 1 and run 2 (when `manualEdit` is on, `runs` ≥ 2 and the play has the hosts
   line) someone deletes `10.0.0.5 db01` from `/etc/hosts` on both hosts (every copy; after run 1 each host holds
   one). *Tie-break:* it never applies to the `handler` play or to one run; the toggle is disabled there and the
   model ignores it. The step after the edit is an ordinary run step (`edit` false again).

## Params

| key | values | default | resets |
|---|---|---|---|
| `play` | `hosts`, `three`, `guarded`, `handler` | `hosts` | yes |
| `runs` | 1–3 | 3 | yes |
| `setE` | on / off | on | yes |
| `manualEdit` | on / off | off | yes |

Steps = `runs` × items (1, 3, 3, 2) + 1 with the edit. `sim.json` `steps` is the default's, 3. Largest: `three`,
3 runs, edit = 10.

## Presets and expected numbers

Checked by running the model before the page (`sim.test.js`, "presets"); derived from the rules, not from a running
ansible-core *(check)*. Recap is `ok/changed/failed`.

| id | params | steps | A after | A exit per run | B after | B recap per run |
|---|---|---|---|---|---|---|
| `append-twice` | hosts, 3 runs | 3 | line ×3 | 0, 0, 0 | line ×1 | 1/1/0, 1/0/0, 1/0/0 |
| `three-tasks` | three, 2 runs, set -e | 6 | line ×2, dir, deploy | 0, 1 (useradd skipped) | line ×1, dir, deploy | 3/3/0, 3/0/0 |
| `guarded-script` | guarded, 2 runs | 6 | line ×1, dir, deploy | 0, 0 | same as A | 3/3/0, 3/0/0 |
| `drift` | hosts, 2 runs, manual edit | 3 | line ×1 | 0, 0 | line ×1 | 1/1/0, 1/1/0 |
| `handler` | handler, 2 runs | 4 | web.conf ours, 2 restarts | 0, 0 | web.conf ours, 1 restart | 2/2/0, 1/0/0 |

Variations (tested): `three-tasks` with `setE` off → run 2 exit 9 (useradd runs and fails too). `drift` without the
edit → A holds the line twice. `three`, 3 runs, edit → 10 steps; A exits 0, 1, 1; B 3/3/0, 3/1/0, 3/0/0.
In `handler` run 1 the recap counts the handler: `ok=2 changed=2` *(check)*.

## Captions

Before run 1: the two hosts and what to watch. A step: the run (ordinal) and, in plays with more than one item, the
task number; then what the script did and what the task reported. Run 2 of `append-twice` is the task's caption
verbatim. The last step of a run adds the run's results (exit status and recap) and, when the script exited 0 with a
duplicated line, that exit 0 did not mean a correct result. The edit step says what was deleted and from where.

## Out of scope

Inventories, roles, variables, check mode, `command` with `creates:`/`changed_when` (one-line note only), facts,
Terraform (`lnx-terraform-drift`) [T]. A failing task on B (no play here fails on B).
