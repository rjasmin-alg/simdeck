<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-terraform-drift: notes

New stepper (task `docs/tasks/w3/lnx-terraform-drift.md`, catalogue `lnx-terraform-drift` §4.4, wave 3). One
concept: desired vs state vs real; plan shows the diff. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Drawn by the page:** no kit view fits a three-way compare. A grid with one row per resource and four columns
  (configuration | state | real infrastructure | plan badge), rows in address order, hand-made objects after them;
  below it the output of the step, in the tool family's notation. Missing cells are dashed ghosts, so "state still
  points to an object that is gone" and "real object nobody tracks" are visible as holes in a row.
- **Plan does not write state** (the tool's behaviour since plan refreshes in memory). The refresh phase shows the
  value it read as a `↻ refreshed "large"` chip beside the stored value in the state column; the stored value
  changes only with apply, `apply -refresh-only`, `state rm` or import. This is what makes `accept-drift` teach
  something: plan's refresh and refresh-only's write look different.
- **Each resource has a `name`** that forces replacement, so `state-lost` can fail on "a vm named "web" already
  exists" (rule 6). VM `size` changes in place, VM `image` and rule `port` force replacement, DNS `address` in place.
- **Real IDs** come from a fixed list per type, so a re-created or replaced object visibly gets a new ID
  (`dns-91ab`, `fw-6b0d`) while an update keeps it (`vm-7f3a`).
- **Apply always re-plans** (refresh + diff + carry out), as `apply` without a saved plan does; after a plan with
  nothing in between it does exactly what that plan showed. An error stops only its own resource; with any error
  the "Apply complete!" line is left out.
- **Generic resource types** (`vm`, `firewall_rule`, `dns_record`) and "outside of the tool" in the outside-change
  note; Terraform and OpenTofu are named only in the explanation (NLA T31 names them; COMMON.md §1). The plan
  symbols and the `Plan: … to add …` line are the tool family's notation, which is the subject.
- **Tool output stays English** (data, `translate="no"`), as students will see it; the narration around it (the
  hand change, the configuration edit, the outside-change heading, phases) is translated.
- **The plan output block** follows the tool's shape (`# addr will be updated in-place`, `~ resource "vm" "web" {`,
  aligned `=`, `# forces replacement`, `# (N unchanged attributes hidden)`, `}`), attributes in name order as the
  tool prints them; the cards draw `name` first (rule 8d). Output over 10 lines flows into two columns
  (`edit-config` step 4 has 17), so the grid keeps its height.
- **`showState` off** folds the state column to a narrow dashed strip saying it still exists and plan compares
  with it; the plan output is the same (a test checks the model ignores the toggle).
- **Hand marks:** the person icon stays on a hand-changed value (and on a hand-made object) until a later apply;
  the real column's header shows it in the step of the hand change.
- **Captions** are chosen from the step's event (apply, hand, edit, state rm, import, refresh, diff, refresh-only
  write) and its content, not from the preset and step number; the diff caption of `drift-revert` is the task's
  caption verbatim in both languages (placeholders for `size`, `large`, `small`).
- **Preset entries** in `sim.json`: `state-lost` and `accept-drift` (the two misconceptions with the most surprise).
- **Layout:** 1920×1080 fits every step of every preset in both languages (measured: no overflow in the stage or the
  output panel); the cards use 0.95rem mono at line height 1.12 so the five-row `import` steps fit.

## Deviations from the task

- **Two presets added:** `edit-config` (5 steps: apply, edit, plan ×2, apply) shows `-`, `-/+` and `~` in one plan
  and the replacement's new ID; without it the legend's `-` and `-/+` never appear on the page. `import` (8 steps:
  apply, hand create, declare, plan ×2, import, plan ×2) shows rule 5's only way out and that declaring alone
  proposes a create that would collide. The task's five presets and their step counts are unchanged.
- **`accept-drift`** ends at the plan that still reverts (6 steps, as the task says); "until the configuration says
  large" is in the caption and in a test, not a seventh step.
- **State shape:** `real` is `{ id: { type, attrs } }` (the type is needed to draw and to check names); added
  `refreshed`, `outside`, `phase`, `seq`, `out`, `changed`, `ev` (the task's `log` is `out`, this step's lines only).
- **`plan -refresh-only`** is in the model and tested but used by no preset (the task's presets use the apply form).

## Reused model

None: `models/` has nothing for this. `sim.js` is pure over plain data. `lnx-ansible-idempotence` noted it might be
promotable for a desired-versus-actual compare; the two models do not share code.

## Sources

- NLA `meta/toc.md` T31 ("Deklarativna infrastruktura — Terraform / OpenTofu, i stanje kao problem"); no chapter
  yet, so every rule is *(check)* against the chapter when it is written.
- Terraform documentation: "Command: plan" (refresh in memory, plan symbols and summary), "State" and "Purpose of
  Terraform State", "Command: import", "Command: state rm", "Manage resource drift", `-refresh-only` mode; OpenTofu
  documentation for the same commands (behaviour assumed identical *(check)*). From the documentation as known; not
  re-read online in this session.

## Not checked

- **Not run against the tool.** A run of OpenTofu with a local provider (to capture the exact output of each preset)
  was attempted and refused by this session's permission check (downloading and running an external binary), so
  the output wording is from the documentation as known *(check)*: "Objects have changed outside of …", "has
  changed", "has been deleted", "(because … is not in configuration)", "(N unchanged attributes hidden)", "No
  changes. Your infrastructure matches the configuration.", "Apply complete! Resources: …", the `state rm` and
  import messages, and that `apply -refresh-only` reports `0 added, 0 changed, 0 destroyed`.
- **Provider-specific, generic here:** the name-conflict error text (each provider words it differently; some allow
  equal names and make a duplicate, said in the explanation); which attributes force replacement.
- The order in which apply carries out independent resources: the tool runs them in parallel; the model uses
  address order so the output is deterministic.

## Term pairs

The glossary has none of these; written out in both tables (`*term*` in captions, `<em lang="en">` in the
explanation) until the coordinator adds them with `"src": "simdeck"`:

- declarative infrastructure — deklarativna infrastruktura (NLA toc T31)
- state — stanje
- drift — odmak *(check)*
- desired configuration — željena konfiguracija *(check)*
- apply — primjena *(check)*; the page writes the command `apply`
- import — uvoz *(check)*; the page writes the command `import`

## Shared requests

None.

## Fresh review

A fresh reviewer (a subagent with no part in writing the model) read `SPEC.md` against `sim.js`, confirmed every rule
and every expected number of the presets table, and ran 63 mutations of `sim.js` in a scratch copy: 42 caught, 21
survived (1 equivalent, ~3 in fields nothing read). Closed: 10 tests added for the survivors (refresh count, name
clash per type, import onto a managed address, import attributes from real, an error not stopping later resources,
apply counts of `edit-config`, DNS address in place, `state rm` of an unknown address, the hand-change line, the
`changed` marks, `rows()` for removed and vanished objects); three of the former survivors re-run and now caught.
41 tests. Changed after the review:

- **Import no longer refuses an ID that another address already maps to**: the tool does not check this (its docs
  only warn against it). SPEC rule 5 says so.
- **Apply order** (8a) and **the outside-change note** (rule 1: since Terraform 1.2 only changes that feed the plan
  are listed) are marked as simplifications in SPEC; no preset differs.
- The refresh-only plan's closing line now follows the tool's wording ("…will not take any actions to undo these").

## Time

Start 2026-11-03 23:54, done 2026-11-04 01:30 (about 1 h 35 min, one session, including a dropped connection).
