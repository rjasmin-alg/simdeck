# win-wsus-cloned-id: Clients that never report

| | |
|---|---|
| Task | `win-wsus-cloned-id` (wave 3, WSUS and updates) |
| Catalogue entry | `win-wsus-cloned-id` in `docs/catalogue.md` §4.5.6 |
| Kind | build a new simulator |
| Folder | `sims/win-wsus-cloned-id/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2 |
| Topic / tags / level | `windows-admin` / `updates` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-wsus-flow` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **cloned images share one SusClientId, so many machines show as one**.

The student: deploy clones, check reporting, fix the id.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.6.
5. `sims/win-wsus-flow/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "Computers don't appear in the WSUS console" / "Client computers that are cloned share the same SusClientId" (support article (check)); "Sysprep (Generalize) a Windows installation"

## Model and presets

- **Scene:** left, three cloned desktops PC-01, PC-02, PC-03, each showing its name, its client ID (a short GUID like `7f3a…`) and its real patch state (KB-C installed ✓ / missing ✕). Right, the WSUS console's computer list: one row per **client ID**, with the name and status it last received. Arrows show each report landing on a row.
- **State:** `t` (minutes), `machines: [{ name, clientId, patched, nextReport }]`, `console: { [clientId]: { name, lastReport, status } }`, `log`.
- **One step:** one event: a machine reports, an admin resets one machine's ID, or an image is generalised before cloning.
- **Rules:**
  1. WSUS identifies a computer by its client ID (SusClientId), not by its name (Microsoft, "Computers don't appear in the WSUS console" (check)).
  2. The client ID is created once per Windows installation and copied with the disk; cloning a machine that has already contacted WSUS (or whose image wasn't generalised) gives every clone the same ID.
  3. A report from a client overwrites the console row of that ID: name, IP and status become those of the last reporter.
  4. Generalising the image before capture removes the ID, so each clone creates its own at first start (Microsoft, image generalisation documentation (check)).
  5. Resetting the ID on one machine makes it create a new ID and register as a new console row at its next contact.
  6. Tie-break: two reports at the same minute → the later in machine order wins the row.
- **Params:** `clones` range 2–5 (default 3); `generalised` toggle (default off); `patchPc02` toggle (PC-02 missing KB-C, default on); button `reset ID on PC-02`.
- **Presets:**
  1. `one-row` — derived, unchecked: 3 clones, same ID `7f3a…`; reports 09:00 PC-01, 09:20 PC-02, 09:40 PC-03 → console has 1 row, its name flips PC-01 → PC-02 → PC-03.
  2. `false-green` — derived, unchecked: PC-02 is missing KB-C; the row shows PC-03's "installed" after 09:40 → the report says everything is patched.
  3. `reset-one` — derived, unchecked: reset PC-02's ID → at its next report a second row appears with PC-02 and "missing KB-C"; PC-01 and PC-03 still share a row.
  4. `generalised-image` — derived, unchecked: image generalised before cloning → three rows from the first reports.
- **Steps:** one-row 4; false-green 5; reset-one 6; generalised-image 4.
- **Legend:** machines and console rows each carry the ID chip (pattern + short text), so matching is visible without colour; report arrows; status ✓/✕. "Changed" marks the console row that was overwritten and the report arrow.
- **Captions:**
  - hr: "PC-02 javlja stanje. Ima isti *client ID* (oznaku klijenta) kao PC-01, pa WSUS prepisuje isti redak — PC-01 je „nestao”."
  - en: "PC-02 reports. It has the same client ID as PC-01, so WSUS overwrites the same row, and PC-01 has \"disappeared\"."
  - hr: "Izvještaj kaže da je sve zakrpano — ali to je stanje PC-03. PC-02 zakrpu nema."
  - en: "The report says everything is patched, but that is PC-03's state. PC-02 doesn't have the patch."
- **Terms:** client ID — oznaka klijenta; clone (disk image) — klon (slika diska); generalise — generalizirati (poopćiti) sliku; report — izvještaj (javljanje stanja); console — konzola; duplicate identity — dvostruki identitet.
- **Misconceptions:** "WSUS knows computers by name"; "missing machines are switched off"; "the compliance report is the truth".
- **Out of scope:** duplicate machine SIDs in AD (a different issue; mention only), the exact registry location, imaging tools.
- **Reuse from `win-wsus-flow` (soft dependency):** client reporting; new: the ID-keyed console rows.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `win-wsus-cloned-id` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh win-wsus-cloned-id sims/win-wsus-cloned-id` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-wsus-cloned-id/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
