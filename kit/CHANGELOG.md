<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# kit changelog

One line per change; the kit only grows (playbook §4). Rules and API: `docs/sim-ui.md`.

- **0.6.0** (2026-10-04): view K3, block grid: `kit/blockgrid.js` (`Simdeck.blockGrid`, `.space`, `.split`, `.route`,
  `.meter`, `.checkSpec`), its section in `kit.css`, tests in `kit/blockgrid.test.js`, docs/sim-ui.md §13. Cell kinds
  fill, soft (hatched), dead, bad, ghost with reference counts, sub lines, under/gap marks and the changed mark; holes;
  spans with numbers (solid, dashed, dotted, open ends), brackets, row labels and asides, column labels, offsets;
  arrows between cells or rows under the cells with heads over them (dashed, dotted, now, broken); the space counter,
  the meter and `split` for long rows; `joined` for touching cells; legend swatches `bg-*`. Pilot `dedup-chunking`
  moved onto it.
- **0.5.0** (2026-10-04): view K4, rule table with the matching row: `kit/ruletable.js` (`Simdeck.ruleTable`,
  `.evaluate`, `.checkSpec`, `.verdict`), its section in `kit.css`, tests in `kit/ruletable.test.js`, docs/sim-ui.md §12.
  Modes first match, most specific (tie: the earlier row) and deny wins (allows add up), page-set marks for other
  rules, `at: 'all'` for explorers, failing fields struck with ✕, row tags and notes, the implicit row, `stickyMark`,
  legend swatches `rt-*`. Pilot `rule-first-match` moved onto it.
- **0.4.0** (2026-10-03): view K1, message sequence chart: `kit/sequence.js` (`Simdeck.sequence`, `.checkSpec`, lane
  geometry and tie-breaks), its section in `kit.css`, tests in `kit/sequence.test.js`, docs/sim-ui.md §11. Lanes with
  cards and lifelines, messages (broadcast, thin, dashed/dotted, encrypted, muted, lost at a receiver or on the wire,
  receiver words), notes, timers on a lane, an eavesdropper column, oldest rows dropped to fit. Pilot `dhcp-dora`
  moved onto it.
- **0.3.0** (2026-10-03): view K2, topology with moving packets: `kit/topology.js` (`Simdeck.topology`, `.table`,
  `.headers`, `.checkSpec`), its section in `kit.css`, tests in `kit/topology.test.js`, docs/sim-ui.md §10; legend
  swatches `dash` and `line`. Pilot `arp-local-remote` moved onto it.
- **0.2.0**: languages (Croatian and English in one page, `Simdeck.useStrings`, glossary), docs/sim-ui.md §9.
- **0.1.0**: step controller, controls, transport, header tools, shortcuts, template.
