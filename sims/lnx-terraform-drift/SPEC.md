<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-terraform-drift: spec

One concept: **desired vs state vs real; plan shows the diff.** The student changes infrastructure by hand (or the
configuration, or the state) and runs plan.

Task: `docs/tasks/w3/lnx-terraform-drift.md`. Catalogue: `docs/catalogue.md` §4.4. Course: NLA T31 ("Deklarativna
infrastruktura — Terraform / OpenTofu, i stanje kao problem"; no chapter yet). Every rule below is *(check)*: the
NLA chapter is not written, and the tool's behaviour is from its documentation as known, not run in this session
(NOTES.md, "Not checked").

## Scene

Three columns for the same resources, one row per resource, rows in address order:

| Column | What it holds | Written by |
|---|---|---|
| **configuration** (desired) | `address → attributes`, as code | an edit of the configuration |
| **state** (recorded at the last apply) | `address → { real ID, attributes }` | apply, `apply -refresh-only`, `state rm`, `import` |
| **real infrastructure** (what the provider's API returns now) | `real ID → { type, attributes }` | apply, a hand change |

Below: the output of the step in the tool family's notation (`+` create, `~` update in place, `-` destroy, `-/+`
replace; `Plan: 1 to add, 1 to change, 0 to destroy.`). Hand changes carry a person icon and act only on the real
column. Generic resource types; the tool is named only in the explanation.

Resources at the start of every preset (configuration only; state and real empty):

| Address | Attributes | Forces replacement |
|---|---|---|
| `dns_record.www` | `name = "www"`, `address = "203.0.113.10"` | `name` |
| `firewall_rule.ssh` | `name = "ssh"`, `port = 22` | `name`, `port` |
| `vm.web` | `name = "web"`, `size = "small"`, `image = "debian-12"` | `name`, `image` |

Every other attribute changes in place. Real IDs are drawn in order from a fixed list per type (`vm-7f3a`,
`vm-2c91`, …; `fw-21c9`, …; `dns-5e02`, …), so a re-created object visibly gets a new ID. The hand-created rule
`rdp` is `fw-88d4`, `name = "rdp"`, `port = 3389`.

## State

`{ script, config: { addr: attrs }, state: { addr: { id, attrs } }, real: { id: { type, attrs } }, refreshed:
null | { addr: { id, attrs } | null }, outside: [{ addr, id, kind, diffs }], plan: null | [{ addr, action, diffs }],
phase, out: [lines], changed: [cell keys], ev: [events], seq }`.

`refreshed` is plan's in-memory copy of state after the refresh (`null` value: the object was not found). It is
drawn inside the state column, beside the stored value, and dropped by the next action that is not the second
phase of the same command. `out` is the output of this step only, as structured lines (the page words them).

## One step

One action:

- `apply`: refresh, diff (rules 1, 2), then carry out the plan (rule 9); state is written. 1 step.
- `hand` change in the real column: edit an attribute, delete an object, create one. 1 step.
- `edit` of the configuration: set attributes, add or remove a block. 1 step.
- `plan`: 2 steps, **refresh** (rule 1) then **diff** (rule 2). State is not written.
- `plan -refresh-only`: 2 steps, refresh, then "no actions"; state is not written.
- `apply -refresh-only`: 2 steps, refresh, then state ← refreshed (rule 7).
- `state rm <addr>`: the entry leaves state; nothing real changes (rule 6). 1 step.
- `import <addr> <id>`: state gets `addr → id` with the attributes read from real (rule 5). 1 step.

## Rules

1. **Plan refreshes first.** For every resource **in state** (address order) it reads the real object by its ID. A
   changed attribute is noted as `# <addr> has changed` (`~ key = old -> new`), a missing object as `# <addr> has
   been deleted`, under "Objects have changed outside of [the tool]". Objects not in state are never read. (tool docs
   "Command: plan", refresh; "Manage resource drift", check)
   *Simplification:* since Terraform 1.2 (and in OpenTofu) a normal plan lists outside changes only when they
   contribute to the planned actions; the model always lists them. No preset differs (every outside change in a
   preset is one plan acts on).
2. **Then it diffs** configuration against the refreshed state and proposes what makes real match configuration:
   - declared, not in (refreshed) state → `+` create, every attribute shown with its declared value;
   - in state, not declared → `-` destroy;
   - both, some attribute differs → `~` update in place, or `-/+` replace if a differing attribute forces
     replacement (rule 8);
   - both, all equal → nothing.
   Summary: `Plan: A to add, C to change, D to destroy.` with A = creates + replaces, C = updates, D = destroys +
   replaces; nothing proposed → `No changes. Your infrastructure matches the configuration.` (tool docs "Command:
   plan", plan symbols and summary, check)
3. **Drift is reverted.** A hand change to a managed object shows as `~ key = "hand" -> "declared"`; the next apply
   writes the declared value back. (tool docs "Manage resource drift", check)
4. **Deleted by hand:** refresh finds no object and drops the address from the refreshed state; plan proposes `+`
   create; apply creates a new object with a new ID.
5. **Created by hand** (never in state) is invisible: refresh does not read it, the diff does not see it, plan says
   "No changes". It comes under management only by `import <addr> <id>`, which needs a configuration block for the
   address that is not already in state, and an object with that ID, and writes `addr → id` and the attributes read
   from real (not from the configuration) to state; if the block matches, the next plan says "No changes", else it
   proposes the difference. Like the tool, it does not check whether another address already maps to that ID. Without import, declaring it makes plan propose `+` create, and apply then fails on the name (rule 6).
   (tool docs "Command: import", check)
6. **State is the map from address to real ID.** `state rm` makes the tool forget the object (real is untouched):
   the next plan proposes `+`, and apply fails because an object of that type with that name already exists
   (`a vm named "web" already exists`); real and state stay as they were. A provider without unique names would
   create a duplicate instead (named in the explanation only). (tool docs "State", "Purpose of Terraform State";
   `state rm`, check)
7. **Refresh-only.** `plan -refresh-only` shows the outside changes and proposes no actions; `apply -refresh-only`
   writes the refreshed values to state without touching real: the drift is accepted into state. The next normal
   plan still proposes reverting it, because configuration still says otherwise; only an edit of the configuration
   to the hand value makes plan say "No changes". (tool docs "-refresh-only" mode, check)
8. **Tie-breaks.** (a) Plan lists, and apply carries out, resources in address order (string order of `type.name`).
   *Simplification:* the real tool applies independent resources in parallel along its dependency graph, in no fixed
   order; the model uses address order so the output is deterministic.
   (b) One differing attribute that forces replacement makes the whole resource `-/+`, even when the others could
   change in place; the forcing ones are marked `# forces replacement`. (c) Hand-created objects are drawn after the
   managed rows, in ID order. (d) Attributes are drawn in a fixed order per type: `name` first.
9. **Apply** first writes the refreshed state for every resource in it, then, in address order: destroy (real and
   state entry removed), create (new ID from the type's list; fails on an existing object of the same type and name,
   leaving real and state unchanged for that resource only), update (real and state take the declared values),
   replace (destroy, then create with a new ID). Result: `Apply complete! Resources: A added, C changed, D
   destroyed.`, or, when any resource failed, its error instead of that line.

## Params

- `script`: the scenario (chosen with the presets; the select is hidden).
- `showState`: the state column visible (default on). Off, the column is folded to a narrow strip saying it still
  exists: the plan does not change, which is the point.

## Presets and expected numbers

Each preset starts with configuration only; step 1 is always `apply` (`Plan: 3 to add` is carried out:
`Resources: 3 added, 0 changed, 0 destroyed.`; all three columns agree).

| Preset | Steps | Actions after step 1 | Expected |
|---|---|---|---|
| `drift-revert` | 5 | hand `vm.web` size small → large; plan (2); apply | refresh: `vm.web has changed`, `size "small" -> "large"`; plan `~ vm.web size "large" -> "small"`, `Plan: 0 to add, 1 to change, 0 to destroy.`; apply: real size small, same ID `vm-7f3a`, `0 added, 1 changed, 0 destroyed` |
| `hand-delete` | 4 | hand delete `dns-5e02`; plan (2) | refresh: `dns_record.www has been deleted`; plan `+ dns_record.www`, `Plan: 1 to add, 0 to change, 0 to destroy.` |
| `hand-create` | 4 | hand create `fw-88d4` (rdp, 3389); plan (2) | refresh reads 3 objects, nothing changed outside; `No changes.`; `fw-88d4` stays, unmanaged |
| `state-lost` | 5 | `state rm vm.web`; plan (2); apply | refresh reads 2 objects; plan `+ vm.web`, `Plan: 1 to add, 0 to change, 0 to destroy.`; apply fails: `a vm named "web" already exists`; real still 3 objects, state 2 entries |
| `accept-drift` | 6 | hand size → large; `apply -refresh-only` (2); plan (2) | refresh-only writes state `size = "large"`, real unchanged, `0 added, 0 changed, 0 destroyed`; plan: no outside change (state agrees with real), still `~ vm.web size "large" -> "small"`, `0 to add, 1 to change, 0 to destroy` |
| `edit-config` (added) | 5 | edit: `vm.web` size → medium, `firewall_rule.ssh` port → 2222, remove `dns_record.www`; plan (2); apply | plan in address order: `- dns_record.www`, `-/+ firewall_rule.ssh` (`port 22 -> 2222 # forces replacement`), `~ vm.web` (`size "small" -> "medium"`); `Plan: 1 to add, 1 to change, 2 to destroy.`; apply: `1 added, 1 changed, 2 destroyed`, ssh gets `fw-6b0d` |
| `import` (added) | 8 | hand create `fw-88d4`; edit: add `firewall_rule.rdp` (rdp, 3389); plan (2); `import firewall_rule.rdp fw-88d4`; plan (2) | first plan `+ firewall_rule.rdp`, `1 to add` (would collide, rule 6); after import, refresh reads 4 objects, `No changes.` |

`sim.json` `steps` is the default preset's (`drift-revert`): 5. The longest preset has 8 steps.

Numbers checked with the model itself (`node --test`) and by hand against rules 1–9 above; they are derived from
the rules, not from a run of the tool *(check)*.

## Legend

Value agrees across columns (plain); differs (dashed outline and a `!` mark, each column showing its own value);
resource missing from a column (dashed ghost cell, with the struck ID where state still points to a vanished
object; a card present in one column only is dashed too); plan badges `+` (circle), `~` (rounded square), `-`
(square, thick border), `-/+` (pill, double border); hand action (person icon, kept on the hand-changed value until
an apply overwrites it); "changed in this step" (kit highlight): real by hand or apply, state by apply,
refresh-only, `state rm` or import, configuration by an edit, the refreshed value by plan's refresh.

## Output

The output panel prints each step as the tool family does, as data (English, `translate="no"`): `addr: Refreshing
state... [id=…]`; the outside-change note (its heading translated, "outside of the tool" instead of the product
name); per resource `# addr will be created | updated in-place | destroyed | must be replaced` (destroy adds
`# (because addr is not in configuration)`), then the `resource "type" "name" { … }` block with attributes in name
order, `=` aligned, `# forces replacement`, `# (N unchanged attributes hidden)`; `Plan: …` or `No changes. Your
infrastructure matches the configuration.`; `Apply complete! Resources: …`. Errors and the import/state rm messages
are worded generically *(check)*. Over 10 lines, the output flows into two columns.

## Out of scope

Remote state and locking (named in the explanation), modules, `ignore_changes`, computed attributes, GitOps (T35).
