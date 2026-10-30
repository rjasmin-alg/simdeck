<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-ansible-idempotence: notes

New stepper (task `docs/tasks/w3/lnx-ansible-idempotence.md`, catalogue `lnx-ansible-idempotence` §4.4, wave 3). One
concept: a script run twice breaks things; a declarative task doesn't. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Drawn by the page:** no kit view does a side-by-side compare. Two equal columns, host A (shell script) and host B
  (playbook), each with its source (the current item lit, a gutter mark per item, `$? = n` after each script line),
  the host's state, and the results per run (exit status / `PLAY RECAP`). A timeline of runs (and the manual edit)
  sits on top, with "task k of n" for multi-task plays.
- **One `play` choice instead of separate scripts per preset:** `hosts` (one task), `three`, `guarded` (the same three
  with guards in the script), `handler` (copy + notify). The presets are these plays with `runs`, `setE` and
  `manualEdit`; every param `resets` (task).
- **Same marks on both hosts:** ✓ ok (no change), ✎ host changed, ✗ failed (status ≠ 0), – not run. On A the mark
  says what the line did to the host (the script itself reports only `$?`, so the legend says "host changed", not
  Ansible's "changed"); so on run 2 the script's `>>` gets ✎ again
  while the task gets ✓, which is the concept in one glance. Each mark has its own shape (circle, rounded square,
  square, dashed circle) and glyph, so the grayscale screenshot still reads.
- **`cp` counts as a write every run** (✎), even with the same content: it rewrites the file. The playbook's `copy`
  compares content and reports ok.
- **Duplicate lines** in `/etc/hosts` are drawn one per copy, red, with a `×2`/`×3` badge on the repeats.
- **The handlers phase is the play's second lockstep item** (`systemctl restart web` on A): 4 steps for 2 runs, as
  the task says. Not notified → the handler block is struck through and the recap does not count it.
- **The playbook has `gather_facts: false`**, so the recap counts only the tasks shown (otherwise every recap would be
  one higher for fact gathering).
- **Manual edit** deletes every copy of the line on both hosts. The toggle is disabled (with the reason) for one run
  and for the `handler` play, which has no hosts line; the model ignores it there too.
- **Steps** = runs × items (+1 with the edit): 1–10. `sim.json` has the default's (`hosts`, 3 runs) 3.
- **Captions** say the run (ordinal), the task number (multi-task plays) or "handlers", then what the script did and
  what the task reported; the last step of a run adds the exit status and the recap, plus "exit 0, and still the
  result is wrong" when a line is duplicated, or "both hosts are now identical". Run 2 of `append-twice` is the task's
  caption verbatim in both languages.
- **Misconceptions** (task): "Ansible is idempotent by itself" — one sentence in the explanation (`command:`/`shell:`
  always report changed); "exit 0 means correct" — `append-twice` and the "still wrong" caption; "a script can't be
  idempotent" — `guarded-script`.
- **Preset entries** in `sim.json`: `three-tasks` (set -e and the failing `mkdir`) and `handler`.
- **Short labels for the one-screen fit** (the Croatian panel was 2 px too tall): plays `redak`, `tri`, `s provjerama`,
  `rukovatelj` / `hosts line`, `three`, `guarded`, `handler` in one row; the toggle is "Ručna izmjena" / "Manual edit"
  with "after run 1" in its hint; short legend labels so the title stays on one line. The `≠` sign is not in the kit
  font, so the legend says "greška" / "failed".
- Tags: `automation`; topic `linux-admin`; level `advanced` (the task's). All exist in `tags.json`. Ansible is named
  (NLA T30 teaches it, COMMON.md §1); the web server is "web", generic. Commands and YAML are the subject, so they
  appear, as `translate="no"` data.

## Deviations from the task

- **A `play` param** (not in the task's Params) picks the task set the presets need: `hosts`, `three`, `guarded`,
  `handler`. The task's `runs`, `setE` and `manualEdit` are as given.
- **State shape:** `results` hold the current run only (the per-run outcome is in `recap`); added `edit`, `edited`,
  `notified` and `exitA`; host state adds `conf` (the web server's config: stock or ours) for the handler play.
  `stopped` is `{ A }` as in the task.
- **Recap for the handler play:** the task gives no numbers; derived: run 1 `ok=2 changed=2` (the handler counts),
  run 2 `ok=1 changed=0` *(check against a running ansible-core)*.
- **Rule 8 (manual edit)** written out in SPEC.md as its own rule, with its tie-breaks.
- **"Both hosts are now identical"** is said only in the `guarded` play (in `drift` it could read as "the script is
  fine").
- **`recap.A.stopped`** added, so "stopped by set -e" stays on an earlier run's row.

## Reused model

None: `models/` has nothing for configuration management. `sim.js` is pure over plain data and promotable if
`lnx-terraform-drift` wants the desired-versus-actual compare.

## Sources

- Uvod u Linux ch. 17, "Kad ljuska nije pravi alat" → Šire o temi (script = actions, run twice = twice; playbook =
  desired state; a guarded script "describes state in a language not made for it"); footnote ch17-ansible
  ("Introduction to Ansible", ansible-core 2.19); "Skripta koja smije raditi bez nadzora" (`set -e`).
- NLA `meta/toc.md` T30 ("Ansible — inventar, playbook, uloge, i što idempotentnost stvarno traži"). The NLA glossary
  has no Ansible terms yet *(check when T30 is written)*.
- Ansible module pages (`lineinfile`, `file`, `user`, `copy`, `service`, `command`), "Handlers: running operations on
  change", PLAY RECAP counting: from the documentation as known, not re-read online in this session and not run
  against ansible-core *(check)*.
- useradd(8) EXIT VALUES (9: username already in use); mkdir(1) (exit > 0, GNU coreutils 1, "File exists"); POSIX
  `set -e` and its `&&`/`||` exception.

## Term pairs

`exit status` is in `kit/glossary.js` (`[[exit status]]` in the explanation). Missing, written out in both tables:

| en | hr |
|---|---|
| idempotence | idempotentnost |
| desired state | željeno stanje |
| playbook | playbook |
| task | zadatak |
| handler (Ansible) | rukovatelj *(check, NLA glossary)* |
| configuration management | upravljanje konfiguracijom |

The glossary's `handler` entry is ossimulator's (interrupt handler, "obrađivač"), so `[[handler]]` would give the
wrong Croatian here; an Ansible handler needs its own key (e.g. `handler (Ansible)`).

## Shared requests

- **Glossary:** add the term pairs above with `"src": "simdeck"`, with a separate key for the Ansible handler.
- **Kit: a side-by-side compare view** (two or more columns, each a source listing with a lit line and per-line marks,
  a state table, and a results list), as the task anticipated ("kit view if it exists").
- **Kit font:** `≠` renders as a broken glyph in the sans font; a fallback or a note in `docs/sim-ui.md`.

## Checks

- Model numbers printed before the page (every preset and the variations); equal to SPEC.md, pinned in `sim.test.js`
  ("presets").
- `npm run gate -- lnx-ansible-idempotence`: pass (manifest, 21 tests, build, 64 browser checks, tokens, scope);
  `npm test` 4632 pass; `npm run check` 0 errors. Screenshots at 1920×1080 light, dark,
  grayscale and 375×812, hr and en, reviewed, plus preset states (append-twice 2 and 3, three-tasks 6 with and without
  set -e, guarded 1 and 6, drift 2 and 3, handler 2 and 4, three with 3 runs and the edit at 10). Fixed from them: the
  Croatian panel 2 px too tall, the `≠` glyph, the title wrapping behind the legend, hanging indent for wrapped YAML,
  the exit chip on the last line of the two-line guarded command, word labels in monospace.
- **Fresh review** (a separate agent read the task, SPEC, model, tests, strings and page; no model defect; gate
  passed on its side). It ran 41 mutations: 32 caught, 3 equivalent in reachable states, 3 real survivors, now
  caught and each re-run to fail: the `edit` flag not cleared after the edit step, `cp` not rewriting on run 2, the
  exit status as the maximum instead of the last line's (a test play `mkdir` then `>>` without set -e). Fixed from
  it: the `three-tasks` entry claimed useradd fails (with set -e it never runs); "na kraju igre" for an Ansible
  play; the term pattern of *desired state*; "ponovno", "web-poslužitelj", "razliku u odnosu na", "zbog set -e";
  the stop note lost from earlier runs; the legend's "changed" on the script (now "host changed"); the unused
  `runShort` string; the edit tie-break test reworded (only one copy is reachable after run 1).
- Not checked: a running ansible-core and bash (the numbers are derived from the rules, as the task says); a projector.

## Time

Start 2026-10-30 16:55, done 17:14 (CET), one session, including the fresh review.
