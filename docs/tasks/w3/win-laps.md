# win-laps: LAPS

| | |
|---|---|
| Task | `win-laps` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-laps` in `docs/catalogue.md` §4.5.7 |
| Kind | build a new simulator |
| Folder | `sims/win-laps/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN2, SEC |
| Topic / tags / level | `windows-admin` / `authentication` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `lateral-movement` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **unique rotated local admin passwords stop lateral movement**.

The student: compromise one machine with and without LAPS.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/lateral-movement/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No Windows course book yet. Use Microsoft documentation (below); mark every rule and default you could not confirm with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → sec-lateral-movement
- Microsoft documentation: *Windows LAPS overview*, *Windows LAPS* (unique per-machine passwords, directory storage, permissions/who may read, rotation), *Windows LAPS password rotation*, Windows LAPS auditing.
- Soft dep: `sims/lateral-movement/` (the estate graph, credentials and tiering model reused); catalogue `sec-lateral-movement`.

## Model and presets

- **Framing:** this is a defensive sim. It shows *why* unique, rotated local administrator passwords contain a
  breach, and *who may read* a stored password — not how to attack anything. The compromise is a single abstract
  "one machine is breached" event; no technique, tool or step is shown.
- **Scene:** a row of workstations plus a directory (AD) card, built on `lateral-movement`'s estate graph. Each
  machine shows its local administrator password as a chip: with LAPS off, every chip is the *same* value; with
  LAPS on, each is a *different* value with an expiry date, and the real value lives in the directory, readable only
  by named, authorized principals. A "containment" meter shows how many machines one breached password reaches.
- **State:** `{ machines: [{id, localAdminSecretId, laps:{managed, expiry}}], laps:{enabled, rotationDays},
  directory:{stored:[{machine, readableBy:[principal]}]}, breach:{machine|null}, reachable:[ids],
  reader:{principal, allowed}, clock }`. The password itself is never a literal in state — only an opaque id.
- **One step:** 1 baseline: show each machine's local admin credential; 2 LAPS off → all identical; 3 one machine
  is breached (abstract event); 4 that one local admin credential is now known to the attacker; 5 contention:
  because it is identical everywhere, it is valid on every machine → reachable = all; 6 switch LAPS on: each
  machine gets a unique managed password stored in the directory with an expiry; 7 breach the same one machine;
  8 the known credential is valid only there → reachable = 1; 9 rotation: on expiry (or on demand after use) the
  password changes, so even that one value stops working; 10 authorized read: a named admin retrieves a machine's
  current password from the directory (allowed); an unauthorized principal is denied.
- **Rules:**
  1. A shared local administrator password means one breach yields a credential valid on every machine that shares
     it (the problem LAPS solves) (Microsoft *Windows LAPS overview*; links to `lateral-movement` rule 3).
  2. LAPS sets a unique, random local administrator password per machine and stores it in the directory
     (Microsoft *Windows LAPS*).
  3. Containment: a unique password is valid only on its own machine, so a single breach reaches exactly one
     machine, not the estate (derived from rules 1–2).
  4. Rotation: the password changes on a schedule and can be rotated after it is retrieved/used, so a leaked value
     has a bounded lifetime (Microsoft *Windows LAPS password rotation*) *(check default rotation period)*.
  5. Access control: only principals granted the right may read a machine's stored password from the directory; the
     read is auditable (Microsoft *Windows LAPS* permissions; *auditing*).
  6. LAPS does not stop a cached higher-tier credential from being reused — it only removes the shared-local-admin
     path; tiering is still needed (links to `lateral-movement` rules 2, 4).
  Tie-break: if a machine's LAPS password is expired but not yet rotated, treat it as still valid until rotation;
  the meter notes it as "overdue".
- **Params:** `laps` toggle (off); `rotationDays` range 1…90 (30); `breachMachine` select of machine ids; `reader`
  choice authorized-admin / other-user (authorized-admin); `tieringOn` toggle (off, from `lateral-movement`).
- **Presets:**
  - `shared` LAPS off: one breach → reachable = all machines. From Microsoft *Windows LAPS overview* (the problem),
    outcome derived.
  - `laps-on` LAPS on: the same one breach → reachable = 1. From Microsoft *Windows LAPS*, outcome derived.
  - `rotation` after rotation the leaked value no longer works → reachable = 0. Derived *(check default period)*.
  - `who-can-read` an authorized admin reads a machine's password (allowed); another user is denied. From Microsoft
    *Windows LAPS* permissions.
  - `laps-not-enough` LAPS on but a domain admin's credential is cached on the breached machine: LAPS contains the
    local-admin path, yet the cached higher-tier credential still enables wider reach → tiering needed. Derived;
    links to `lateral-movement`.
- **Steps:** `shared` 5, `laps-on` 8, `rotation` 9, `who-can-read` 10, `laps-not-enough` 9.
- **Legend:** local admin credential chip (same colour/shape when shared; distinct per machine when managed),
  expiry badge, directory store, authorized reader (key) vs denied (crossed key), reachable machine (outline),
  containment meter; "changed" marks the credential or reachable set that changed this step.
- **Captions:** hr: "Ista lokalna administratorska lozinka na svima: jedan proboj vrijedi na svakom stroju." / en:
  "The same local administrator password everywhere: one breach is valid on every machine." — hr: "Uz LAPS svaki
  stroj ima svoju lozinku: isti proboj doseže samo taj jedan stroj." / en: "With LAPS each machine has its own
  password: the same breach reaches only that one machine."
- **Terms:** local administrator — lokalni administrator; password rotation — rotacija lozinke; unique password —
  jedinstvena lozinka; credential reuse — ponovna uporaba vjerodajnice; directory — imenik (AD); least privilege —
  najmanja ovlast; containment — ograničavanje štete *(check)*; expiry — istek.
- **Misconceptions:** LAPS encrypts the password so no one can read it (authorized principals can, by design);
  LAPS alone stops all lateral movement (it removes the shared-local-admin path, not cached-credential reuse); one
  strong shared password is fine (shared is the problem, not weak).
- **Out of scope:** any attack technique or tooling, LAPS deployment steps, the directory schema, Windows LAPS vs
  legacy LAPS migration, backup of the stored passwords.
- **Builds on `lateral-movement`:** reuses its estate graph, per-machine credentials and the reachable-set/tiering
  logic; new are per-machine unique passwords, rotation, the directory store and authorized-read access control.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-laps sims/win-laps` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-laps/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
