# lnx-terraform-drift: Infrastructure as code: state and drift

| | |
|---|---|
| Task | `lnx-terraform-drift` (wave 3, Linux) |
| Catalogue entry | `lnx-terraform-drift` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-terraform-drift/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `automation` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **desired vs state vs real; plan shows the diff**.

The student: change infra by hand, run plan.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T31 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T31
- NLA row T31 ("Deklarativna infrastruktura — Terraform / OpenTofu, i stanje kao problem") (no chapter yet; all rules above are (check))
- Terraform documentation: "Command: plan" (refresh, plan symbols), "State" and "Purpose of Terraform State", "Command: import", "Manage resource drift", `-refresh-only` mode; OpenTofu documentation, same commands (behaviour assumed identical, check)

## Model and presets

- **Scene:** three columns for the same three resources (a VM `web` with `size`, a firewall rule `ssh` with `port`, a DNS record `www` with `address`): **configuration** (the declared, desired values, as code), **state** (what the tool recorded at its last apply: address → real ID and attributes), **real infrastructure** (what the provider's API returns now). Below, the plan output in the notation of the tool NLA T31 uses (`+` create, `~` update in place, `-` destroy, `-/+` replace; "Plan: 1 to add, 1 to change, 0 to destroy"). Hand changes are drawn as a person icon acting directly on the right column. Generic labels; the tool is named only in the page's explanation, as the NLA does.
- **State:** `{ config: { addr: attrs }, state: { addr: { id, attrs } }, real: { id: attrs }, plan: null|[{ addr, action, diffs }], log }`.
- **One step:** one action: `apply`, a hand change in the real column (edit an attribute, delete a resource, create one by hand), an edit of the configuration, `plan`, `plan -refresh-only`, removing an entry from state, or `import`. A `plan` step has two visible phases: refresh (state ← real for resources in state) then diff (config vs refreshed state).
- **Rules:**
  1. Plan first refreshes: for every resource **in state** it reads the real object and notes changes made outside the tool ("Objects have changed outside of …"). (tool docs "Command: plan", refresh behaviour, check)
  2. Then it diffs configuration against the refreshed state and proposes actions to make real match the configuration: `~` for an attribute that can change in place, `-/+` for one that forces replacement, `+` for something declared but missing, `-` for something in state but no longer declared. (tool docs "Command: plan", plan symbols, check)
  3. A hand change to a managed resource (drift) is therefore **reverted** by the next apply. (tool docs "Manage resource drift", check)
  4. A resource deleted by hand: refresh drops it from state, plan proposes `+` create.
  5. A resource created by hand (never in state) is invisible to plan: nothing is proposed for it; it can be brought under management only by `import`. (tool docs "Import", check)
  6. State is the map from configuration address to real ID; removing an entry makes the tool forget the object: the next plan proposes `+`, and apply then fails with a name conflict or creates a duplicate. (tool docs "State" / "Purpose of state", check)
  7. `plan -refresh-only` / `apply -refresh-only` updates state to match real without changing infrastructure: accepting the drift; the next normal plan will still revert it unless the configuration is changed too. (tool docs "-refresh-only", check)
  8. Tie-break: plan lists resources in address order, and an attribute that forces replacement makes the whole resource `-/+` even if other attributes could change in place.
- **Params:** none beyond presets; `showState` toggle (state column visible), default on, to show what students forget exists.
- **Presets:**
  - `drift-revert` — apply (all three columns agree); by hand `web.size` small → large; plan: `~ web: size "large" -> "small"`, "1 to change"; apply → small again. Derived, unchecked.
  - `hand-delete` — the DNS record deleted by hand; plan: `+ www`, "1 to add". Derived, unchecked.
  - `hand-create` — a second firewall rule `rdp` created by hand; plan: "No changes"; the rule stays, unmanaged. Derived, unchecked.
  - `state-lost` — `web` removed from state; plan: `+ web`; apply fails: name already taken. Derived, unchecked.
  - `accept-drift` — hand change, `apply -refresh-only` (state now large), normal plan still `~ size "large" -> "small"` until the configuration says large. Derived, unchecked.
- **Steps:** one per action, plan counted as 2 (refresh, diff): `drift-revert` 5, `hand-delete` 4, `hand-create` 4, `state-lost` 5, `accept-drift` 6.
- **Legend:** value agrees across columns (plain), differs (highlight with the two values), resource only in one column (dashed card), plan action badges (`+`, `~`, `-`, `-/+`, each with its own shape), hand action (person icon). "Changed" marks the cells written by this step (real by hand, state by refresh/apply, config by edit).
- **Captions:**
  - HR: „Plan je najprije osvježio stanje i vidio da je `size` ručno promijenjen u `large`. Konfiguracija i dalje kaže `small`, pa plan predlaže promjenu natrag.“
  - EN: "Plan first refreshed state and saw that `size` was changed by hand to `large`. The configuration still says `small`, so plan proposes changing it back."
- **Terms:** declarative infrastructure — deklarativna infrastruktura (NLA toc T31); state — stanje; drift — odmak (check); desired configuration — željena konfiguracija (check); plan — plan; apply — primjena (check); import — uvoz (check).
- **Misconceptions:** plan compares configuration with reality directly (it compares with state, after refreshing what state knows about); something made by hand will show up in plan; deleting the state file is a harmless reset.
- **Out of scope:** remote state and locking (named), modules, `ignore_changes`, providers' computed attributes, GitOps (T35).
- **Note for coordinator:** the catalogue title names one product; under the concepts-not-tools rule the page keeps generic labels and names the tool only where NLA T31 does. The plan symbols are that tool family's notation, which is part of what is taught.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lnx-terraform-drift sims/lnx-terraform-drift` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-terraform-drift/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
