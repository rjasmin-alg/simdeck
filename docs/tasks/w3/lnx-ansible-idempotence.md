# lnx-ansible-idempotence: Idempotence

| | |
|---|---|
| Task | `lnx-ansible-idempotence` (wave 3, Linux) |
| Catalogue entry | `lnx-ansible-idempotence` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-ansible-idempotence/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `automation` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **a script run twice breaks things; a declarative task doesn't**.

The student: run both versions repeatedly.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T30 (Napredna Linux administracija; chapters not written yet)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/17-skripte-s-parametrima.md` (Uvod u Linux), section "Kad ljuska nije pravi alat" → "Šire o temi" (script states actions, playbook states desired state; footnote ch17-ansible, "Introduction to Ansible", ansible-core 2.19) and "Skripta koja smije raditi bez nadzora" (`set -e`)
- Ansible documentation: module pages `ansible.builtin.lineinfile`, `ansible.builtin.file`, `ansible.builtin.user`, `ansible.builtin.command` (always `changed` unless `creates`/`changed_when`) (rule 2); "Handlers: running operations on change" (rule 6); "PLAY RECAP" counting (rule 7, check)
- useradd(8) EXIT VALUES (9: username already in use); mkdir(1) (POSIX, exit 1 "File exists") (rule 3)
- Catalogue seed: NLA T30

## Model and presets

- **Scene:** side-by-side compare (kit view if it exists): two identical hosts, A run by a bash script and B
  run by an Ansible playbook. Each column shows its source (script lines / YAML tasks, current line lit), the
  host's state (`/etc/hosts` lines, whether `/srv/app` exists, users, web server restart count, last exit status)
  and, at the end of each run, the result: the script's exit status and the playbook's `PLAY RECAP`
  (`ok= changed= failed=`). A run counter and an optional "manual edit" event sit between runs.
- **State:** `{ run, pc, hosts: { A: {hostsLines: [], dirs: [], users: [], restarts, exit}, B: {…} },
  results: { A: [{line, outcome: 'done'|'error', exit, msg}], B: [{task, outcome: 'ok'|'changed'|'failed'}] },
  recap: [{run, A: {exit}, B: {ok, changed, failed}}], stopped: {A: bool} }`.
- **One step:** one task line runs on both hosts in lockstep (script line *k* on A, task *k* on B). Phases:
  (1) the script line acts and sets its exit status; (2) the module compares desired with actual state and
  acts only on a difference; (3) after the last task of a run, handlers run (B) and both results are
  written. A preset may insert one "manual edit" step between runs.
- **Rules:**
  1. A script line states an action and repeats it every run: `echo "10.0.0.5 db01" >> /etc/hosts` appends
     a second copy on run 2. From UL ch17 "Kad ljuska nije pravi alat", Šire o temi ("Ako se pokrene dvaput,
     radnje se izvode dvaput").
  2. A playbook task states the desired state; the module changes the host only if it differs, and reports
     `changed`, otherwise `ok`. From UL ch17 (same section, footnote ch17-ansible "declare the desired
     state"); module pages in Sources.
  3. `mkdir /srv/app` on an existing directory fails with exit 1 ("File exists"); `useradd deploy` for an
     existing user fails with exit 9 (check, Sources).
  4. With `set -e` the script stops at the first failing line (later lines don't run, exit = that status);
     without it, it runs on and the final status is the last line's. From UL ch17 "Skripta koja smije raditi
     bez nadzora".
  5. A guarded script (`grep -qxF … || echo … >>`, `mkdir -p`, `id deploy || useradd deploy`) is idempotent
     too; it has started describing state in a language not made for it. From UL ch17 "Kad ljuska nije pravi
     alat".
  6. A handler runs once at the end of the play only if a task that notifies it reported `changed`.
  7. Recap: `ok` counts every successful task, including the changed ones; `changed` is the subset that
     changed something (check, Sources).
- **Params:** `runs` range 1–3, default 3; `setE` toggle, default on; `manualEdit` toggle (delete the hosts line
  between run 1 and run 2), default off; `resets: true` on all.
- **Presets:**
  1. `append-twice` — one task, 3 runs: A's `/etc/hosts` holds the line 3×, exit 0 every run (no error, just
     wrong); B: run 1 `changed=1`, runs 2–3 `ok=1 changed=0`, one line. 3 steps. From UL ch17 idea; numbers
     derived.
  2. `three-tasks` — hosts line, `mkdir /srv/app`, `useradd deploy`, `set -e`, 2 runs: run 2 on A: line
     duplicated, mkdir fails (exit 1), useradd never runs, script exit 1; B run 2: `ok=3 changed=0`.
     6 steps. Derived. With `setE` off: useradd also fails, exit 9.
  3. `guarded-script` — the same three tasks written with guards: both hosts end identical after 2 runs; A
     exit 0 both runs. 6 steps. From UL ch17 rule 5.
  4. `drift` — one task, run 1, manual edit deletes the line, run 2: B reports `changed=1` and restores it;
     A appends it again (and would have duplicated it without the edit). 3 steps (run, edit, run). Derived.
  5. `handler` — copy the web server's `web.conf` + `notify: restart web`, 2 runs: B restarts the web
     server once (run 1 only); A (`cp …; systemctl restart web`) restarts it twice. 4 steps (task + handler per run). Derived.
- **Steps:** 3–6 per preset.
- **Legend:** green tick = `ok` (no change); amber pencil = `changed`; red cross = failed / non-zero exit;
  duplicated line marked with a "×2" badge; greyed line = not executed (`set -e` stop). "Changed"
  highlight: the host-state cells written in this step.
- **Captions:**
  - hr: „Drugo pokretanje: skripta je redak dodala još jednom (dva ista retka), a zadatak `lineinfile` je
    vidio da redak već postoji i javio *ok* (bez promjene)."
  - en: "Second run: the script appended the line again (two identical lines), while the `lineinfile` task saw
    the line already there and reported ok (no change)."
- **Terms:** idempotence — idempotentnost; desired state — željeno stanje; playbook — playbook (*playbook*,
  as the book keeps it); task — zadatak; handler — rukovatelj (check, NLA glossary); configuration management
  — upravljanje konfiguracijom; exit status — izlazni status.
- **Misconceptions:** "Ansible is idempotent by itself" (`command:`/`shell:` tasks are not; mention under rule 2
  as a one-line note); "exit 0 means the run was correct" (preset 1); a script can't be idempotent (preset 3).
- **Out of scope:** inventories, roles, variables, `check` mode, `command` with `creates:`/`changed_when`
  (one-line note only), Terraform (`lnx-terraform-drift`).

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-ansible-idempotence` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-ansible-idempotence sims/lnx-ansible-idempotence` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-ansible-idempotence/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
