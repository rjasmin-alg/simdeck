<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-wsus-cloned-id: spec

One concept: **cloned images share one client ID (SusClientId), so many machines show as one** in the WSUS console.
Task: `docs/tasks/w3/win-wsus-cloned-id.md`; catalogue §4.5.6. Model: `sim.js`; tests: `sim.test.js`.

## Scene

- Left: the image card (the reference machine's disk: its client ID, generalised or not) and one card per clone,
  PC-01 … PC-0N: name, IP, client ID chip (colour + pattern + 4 hex digits), real KB-C state (✓ installed /
  ✕ missing), when it last reported.
- Right: the WSUS console's computer list, **one row per client ID**: ID chip, name, IP, last status report, KB-C
  (✓ installed / ✕ needed), and the console's summary under it (computers listed, KB-C installed / needed) beside the
  truth (machines, machines missing KB-C).
- Arrows from each clone that has reported with its current ID to that ID's row; the current step's arrow is thick
  and highlighted, the row it overwrote or created is marked "changed".

## State

`t` (minutes from Monday 00:00), `image: { id, generalised }`, `deployed`, `machines: [{ name, ip, clientId,
patched, nextReport, lastReport, reportedId }]`, `console: { [clientId]: { name, ip, lastReport, status, seq } }`,
`resetDone`, `ev` (this step's event), `log` (every event so far).

## Rules (sources: NOTES.md, "Sources"; every Microsoft fact is *(check)*)

1. **WSUS keys a computer by its client ID, not by its name.** A report finds its row by `clientId` only; two
   machines with different names and one ID land on one row. (Microsoft support article on clients missing from the
   console / cloned clients sharing a SusClientId *(check)*.)
2. **The client ID is created once per installation and copied with the disk.** The image is taken from a reference
   machine that has already contacted WSUS, so it carries the ID `7f3a…`. Cloned without generalising, every clone
   starts with `7f3a…`.
3. **A report overwrites the row of its ID:** name, IP, last report time and KB-C status become the reporter's. A
   report with an ID the console does not know creates a new row (rows keep the order they were created in).
4. **Generalising the image before capture removes the ID;** each clone creates its own at first start
   (`a2c4`, `d91e`, `5b07`, `e3f8`, `16bd` for PC-01 … PC-05). (Microsoft, "Sysprep (Generalize) a Windows
   installation" *(check)*.)
5. **Resetting the ID on one machine** gives it a new ID (`9c6b`) at once; it registers as a new row at its next
   contact, which comes 10 min after the reset (the reset restarts the update agent, which then contacts the server
   *(check)*: model choice), or at its scheduled report if that is sooner. The console keeps the old row: it still
   belongs to the other clones that share it, or stays as a stale entry when the machine had an ID of its own.
   A reset before the clones exist is rejected (nothing changes; the step says why).
6. **Tie-break (two reports in the same minute):** processed in machine order, so the later machine in that order
   wins the row. Reports never go back in time: events run in (time, machine order).

## Timeline

| Time | Event |
|---|---|
| Mon 07:30 | step 0: the image is ready (ID `7f3a…`, generalised or not); console empty |
| 08:00 | deploy: N clones start from the image (rule 2 or 4) |
| 09:00 + 20 min · (k − 1) | PC-0k reports (first status report); one report per clone in this window |
| step `resetAt` + 1 | admin resets PC-02's ID, at the time of the step before + 10 min (button; `resetAt` = step) |
| reset + 10 min | PC-02 reports with the new ID (or earlier if its first report was due sooner) |

The demo ends when no event is left. Next reports (about a day later) are outside the window.

Real KB-C state: every clone has KB-C installed except PC-02 when `pc02Missing` is on.

## Params

`clones` 2–5 (3), `generalised` (off), `pc02Missing` (on; the task's `patchPc02`), `resetAt` (−1: no reset; set by
the button "reset ID on PC-02" to the current step, so the reset is the next step).

## Presets and expected numbers (derived by hand, checked by `sim.test.js`)

| Preset | Params | Steps | End state |
|---|---|---|---|
| `one-row` | `pc02Missing: false` | 4 | 1 row `7f3a`; its name PC-01 (09:00) → PC-02 (09:20) → PC-03 (09:40); summary 1 computer, 1 installed; truth 3 machines |
| `false-green` | defaults | 4 | 1 row; status ✓ (09:00) → ✕ (09:20) → ✓ (09:40); summary 0 needed, truth 1 of 3 missing |
| `reset-one` | `resetAt: 4` | 6 | step 5 reset at 09:50 (PC-02 → `9c6b`), step 6 report 10:00: 2 rows, `7f3a` PC-03 ✓ and `9c6b` PC-02 ✕; PC-01 still hidden behind PC-03 |
| `generalised-image` | `generalised: true` | 4 | 3 rows from the first reports: `a2c4` PC-01 ✓, `d91e` PC-02 ✕, `5b07` PC-03 ✓ |

Default params = `false-green`: `sim.json` `steps` is 4. Largest run: 5 clones and a reset = 8 steps.

Other checked cases: reset at step 2 (after PC-01's report, 09:00): reset 09:10, PC-02 reports with `9c6b` at 09:20
(its scheduled time, the same as reset + 10), PC-03 overwrites `7f3a` at 09:40: 5 steps. Reset at step 3 (09:20):
reset 09:30, PC-02 reports with `9c6b` at 09:40 in the same minute as PC-03 and goes first (machine order): 6 steps. Reset at step 0: rejected at
07:40, then the same as without. Generalised + reset at 4: PC-02 gets `9c6b`; the console shows PC-02 twice (`d91e`
stale at 09:20, `9c6b` at 10:00).
