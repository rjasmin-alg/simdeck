<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-systemd-ordering: specification

One concept: **Wants=/Requires= vs After=/Before=; a failed dependency.** Requirements decide *which* units are in the
boot transaction, orderings decide *when* they start, and a failed unit stops only the units that require it **and**
are ordered after it. The student edits the relations of `app.service`, boots, and sees the order and the failures.

Task: `docs/tasks/w2/lnx-systemd-ordering.md`. Catalogue: `lnx-systemd-ordering` (`docs/catalogue.md` §4.4, §5.15).
Class: explorer. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[UL10]** `uvod-u-linux/book/chapters/10-podizanje-i-systemd.md`, "Jedinice: čime `systemd` upravlja", "Što treba
  znati": `systemctl cat crond.service` (its `After=` list and `WantedBy=multi-user.target`); a target groups units
  and may stand in `Wants=`/`Requires=` and `Before=`/`After=`; `systemctl get-default` → `multi-user.target`;
  `Wants=` ("ako se te jedinice ne uspiju pokrenuti … jedinica koja ih je navela svejedno će se pokrenuti");
  `Requires=` stronger; "zahtjevi za ovisnostima ne utječu na redoslijed … mora zasebno postaviti opcijama `After=`
  ili `Before=`"; "Tko napiše samo `After=` … ništa neće povući: ako druga jedinica nije uključena, njegova će raditi
  bez nje"; "dva retka, ne jedan: `Wants=network-online.target` i `After=network-online.target`"; `[Install]`,
  `WantedBy=` and the `.wants/` links `enable` creates. "Šire o temi": `list-dependencies multi-user.target`.
  "Primjer 1": enabled vs started.
- **[UNIT]** systemd.unit(5), `[Unit]`: `Wants=`, `Requires=`, `Before=, After=`; `[Install]`: `WantedBy=` (UL10's
  [14]). Re-read for this task in the local man page (systemd 255, Ubuntu 24.04): `Requires=` — "If one of the other
  units fails to activate, and an ordering dependency `After=` on the failing unit is set, this unit will not be
  started"; `Before=, After=` — "for service units start-up is considered completed for the purpose of
  Before=/After= when all its configured start-up commands have been invoked and they either failed or reported
  start-up success"; "If two units have no ordering dependencies between them, they are shut down or started up
  simultaneously"; shutdown runs in the inverse order.
- **[TARGET]** systemd.target(5), "Default Dependencies": "Target units will automatically complement all configured
  dependencies of type Wants= or Requires= with dependencies of type After= unless DefaultDependencies=no is set in
  the specified units" — and not the other way round (local man page, systemd 255).
- **[SYSD]** systemd(1): a job is added to a transaction with its dependencies; the transaction is checked for
  ordering cycles, and systemd "will try to fix it up, and removes non-essential jobs from the transaction that might
  remove the loop" (local man page, systemd 255).
- **[SPECIAL]** systemd.special(7), `network-online.target`: units that need the network "should pull in
  network-online.target (via a Wants= type dependency) and order themselves after it" (local man page).

## Scene

- **Left, the unit graph.** Four cards: `multi-user.target` (top, "default target"), `app.service` (the unit the
  student edits; its card shows its unit file, `[Unit]` and `[Install]`, as the params write it), `db.service`
  (its `WantedBy=` line, enabled or disabled, "fails" when set), `network-online.target`. Each card ends in its
  state: symbol and word.
- **Edges.** A requirement is a line with a chevron at the unit it pulls in: `Wants=` thin dashed, `Requires=`
  thick solid, labelled. An ordering is a blue arrow from the earlier to the later unit with a clock glyph at its
  middle, labelled `After=`. The `[Install]` link from the target is labelled `WantedBy=`; the target's automatic
  `After=` (rule 9) is a dotted grey arrow labelled "automatic". A pair's requirement line and ordering line sit
  side by side, each on a fixed side, so neither moves when the other appears. An edge to a unit outside the
  transaction is drawn grey and dotted: it does nothing (rule 5).
- **Right, the boot timeline.** A lane per unit (order: rule 6's tie-break), a column per slot, and the final state:
  a box with the state's symbol in the unit's slot (failed hatched, dependency failed dashed), a green line after an
  active unit's box (it keeps running), and the state symbol and word at the end of the lane.
- **Changed.** Units whose result or slot changed with the last param change: the card gets the kit's changed
  outline, the lane name the highlighter.
- **Boot replay** (`P`, "Podigni sustav"): reveals the timeline slot by slot, 1.1 s per slot, the current slot's
  header highlighted, later units "waiting…" in the timeline and on their cards, and the caption says which units
  start. Animation only: the state does not change. Off under reduced motion (the button just redraws). Any param
  change stops it.

## Params

| key | type | values | default |
|---|---|---|---|
| `appToDb` | choice | `none`, `wants`, `requires` | `requires` |
| `appAfterDb` | toggle | `After=db.service` in app | on |
| `appToNet` | choice | `none`, `wants` | `wants` |
| `appAfterNet` | toggle | `After=network-online.target` in app | on |
| `dbFails` | toggle | db's start-up fails | off |
| `dbEnabled` | toggle | db is enabled: `multi-user.target` pulls it in through `WantedBy=` | off |

`app.service` is always enabled (`WantedBy=multi-user.target`): it is the unit under study and must be in the
transaction.

## Model

A graph `{ root, units: [{ id, type: 'target' | 'service', enabled, wantedBy, fails }], edges: [{ from, to, kind }] }`,
kinds `wants`, `requires`, `after`, `before`, and `depends` (requirement **and** `after` in one relation, for the
Windows-services presets of `win-services`; Windows `DependOnService`). `graph(params)` builds the scene's graph;
`compute(graph)` is pure over any graph, holds no strings and is promotable to `models/` unchanged.

State: `{ units, edges (with via: unit | install | target), txn, slots: { id: n }, result: { id: state }, cycle, loop,
order, nSlots, waits }`. States: `active`, `failed`, `dependency` (dependency failed), `none` (not in the
transaction).

## Rules

1. **Transaction.** Booting starts the default target (`root`); the transaction is everything reachable from it
   through `wants`/`requires`/`depends` edges, plus a `wants` edge from `wantedBy` to every enabled unit (the
   `.wants/` link `enable` makes) [UL10; UNIT]. Units not reached: `none`.
2. **Wants=** pulls the unit in; if it fails, the wanting unit still starts [UL10; UNIT].
3. **Requires=** pulls the unit in; if it fails (or its own dependency failed) **and** the requiring unit is ordered
   after it, the requiring unit is not started: `dependency` [UNIT, `Requires=`, checked in the man page]. Without
   the ordering neither waits for the other and the requiring unit runs: the man page states only the first half; the
   second follows from it and from UL10 (a requirement gives no order), and is how the task states it. *(check: in
   real systemd a requiring start job still pending when the required unit fails is failed too, so "runs" depends on
   timing; the model takes the case where both start together.)* A `dependency` unit is never started, so its
   own `fails` does not show. The failure travels down a chain of `Requires=` + `After=`.
4. **Requirements say nothing about order**; order comes only from `After=`/`Before=` (`X Before= Y` is `Y After= X`)
   [UL10; UNIT].
5. **Orderings pull nothing in**: an ordering to a unit outside the transaction is ignored [UL10].
6. **Slots.** A unit's slot is 1 + the latest slot among the units it waits for (in the transaction); with nothing
   to wait for, slot 1. Units with no ordering between them share a slot (start in parallel) [UNIT].
   **Tie-break:** lanes are drawn by slot, then by id; units outside the transaction last, by id. `txn` and each
   unit's `waits` are in id order.
7. **After= a failed unit:** a failed unit has still *finished* starting, in its slot; a unit ordered after it starts
   in the next slot, unless rule 3 applies [UNIT, `Before=, After=`, checked]. A `dependency` unit keeps the slot
   it would have started in (its job ends there), so units after it wait for it. *(Simplification: systemd cancels
   that job as soon as the required unit fails, which could let a target be reached one slot earlier.)*
8. **Ordering cycle** (only possible with other graphs, e.g. a preset's): flagged, its units listed (`loop`), no
   slots and no results computed; the page says that real systemd drops a non-essential job to break it [SYSD].
9. **A target's automatic After=:** a target gets `After=` on every unit it pulls in with `wants`/`requires`, unless
   an ordering is set between the two either way; a service does not [TARGET]. So `multi-user.target` is reached
   last. (Added beyond the task's rules: without it the target would sit in slot 1, which systemd does not do.)

## Expected numbers (checked with a script before the page was written; pinned in `sim.test.js`)

| case | db | net | app | multi-user | results |
|---|---|---|---|---|---|
| defaults (Requires= + After= db, Wants= + After= net) | 1 | 1 | 2 | 3 | all active |
| 1 `network-online` | — | 1 | 2 | 3 | db none |
| 2 `requires-no-after` | 1 | — | 1 | 2 | db failed, app active |
| 3 `requires-after` | 1 | — | 2 | 3 | db failed, app dependency failed, target active |
| 4 `wants-after` | 1 | — | 2 | 3 | db failed, app active |
| 5 `after-only` | — | — | 1 | 2 | db none, app alone in slot 1 |
| db enabled + After= only + db fails (rule 7) | 1 | — | 2 | 3 | db failed, app active |

## Presets

1. `network-online`: `appToDb: none`, `appAfterDb: off`, `appToNet: wants`, `appAfterNet: on`. The "two lines, not
   one" passage [UL10; SPECIAL].
2. `requires-no-after`: `requires`, no After, `dbFails`, network off. (Network off so that "both start at once"
   holds: with `After=network-online.target` app would be in slot 2 for another reason.)
3. `requires-after`: `requires` + After, `dbFails`, network off.
4. `wants-after`: `wants` + After, `dbFails`, network off.
5. `after-only`: `appToDb: none`, After on, `dbEnabled: off`, network off.

`sim.json` entries: `requires-no-after` and `after-only` (the task's two captions and two misconceptions).

## Captions

The relation whose params changed last speaks (`nextFocus`: a preset speaks for its own; `appToNet`/`appAfterNet` →
network; `appToDb`/`appAfterDb`/`dbFails`/`dbEnabled` → db; with no history, db). `captionKey(state, params, focus)`
chooses, in order:

- cycle → `cCycle`.
- network (only while app is not `dependency`; a dependency-failed app is explained by the db branch, since the
  network captions would name a slot app never started in): not in the transaction → `cNetAfterOnly` (After= set) or `cNetNone`; else `cNetOrdered` (After= set) or
  `cNetNoOrder`.
- db not in the transaction → `cAfterOnly` (task caption; After= set) or `cDbOut`.
- app `dependency` → `cDepFailed`.
- db failed, `Requires=`, no After= → `cReqNoAfter` (task caption) when db and app share a slot, else
  `cReqNoAfterApart` (app is later for another reason, so "at once" would be false).
- db failed, app pulls db → `cWantsAfterFailed` / `cWantsFailed` (After= or not).
- db failed, app does not pull db (db enabled) → `cAfterFailed` / `cUnrelatedFailed`.
- db fine → `cOrdered` (After=), `cNoOrder` (requirement, no After=), `cIndependent`.

During the replay: `cReplay`, the slot and the units starting in it. Captions name slots from the model only.

## Out of scope

`BindsTo=`, `PartOf=`, `Conflicts=`, `Requisite=`, socket activation, timers, `DefaultDependencies=no`, condition
checks, stop jobs (the explanation says stopping runs in reverse order), restarts, `network.target` vs
`network-online.target`, the real jobs behind `network-online.target`, `basic.target`/`sysinit.target`.
