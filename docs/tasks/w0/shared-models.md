# shared-models: where model code shared by several sims lives

| | |
|---|---|
| Task | `shared-models` (wave 0) |
| Owner | coordinator |
| Size | S |
| Depends on | main at cd893d4 |
| Licence | AGPL-3.0-or-later |

## Goal

About 140 wave-3 tasks reuse a core sim's model (task files: "soft: … reuse its model"), and catalogue §5
groups many sims on one model (a small Windows domain, DNS records over time, TCP, a packet's path). Copying
model code into every folder (COMMON.md §6, the interim rule) works but drifts.

## Decide and build

- A `models/` folder of pure, DOM-free model modules (classic scripts that register on one global, like
  `kit.js`), each with its own tests, inlined by the build when a page includes it (the same exception as the
  kit), and runnable under `node --test`.
- Ownership: a model is promoted from a sim into `models/` by the coordinator (additive change, changelog
  entry), never edited by page tasks; requests go through "Shared requests" in `NOTES.md`.
- Update COMMON.md §6.

## Done when

One model (from the first pilot that has a soft dependent) lives in `models/`, its sim uses it from there,
the build inlines it, and COMMON.md §6 says how to use it.
