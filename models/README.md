# models/: model code shared by several sims

A sim's model lives in `sims/<id>/sim.js`. When other sims need the same model (a task file says "soft: start
after X is merged and reuse its model"), the coordinator **promotes** it here, so every sim uses one copy instead
of a drifting copy each. Rules for the sims that use one: `docs/tasks/COMMON.md` §6.

## What a model is

- **One file per model:** `models/<name>.js`, the name in lowercase words joined by `-` (`dhcp-lease`,
  `dns-records`). Its tests are `models/<name>.test.js`; `npm test` runs them.
- **Pure:** no DOM, no `window`/`document`, no storage, no `Date`, no timers, no `Math.random` (randomness comes in
  as a seeded `Simdeck.rng` from the caller). State is plain JSON. Model code is English and language-neutral; no
  visible strings (those stay in each sim's `strings.js`).
- **A classic script, like the kit:** in a page it registers on `globalThis.SimdeckModels[<name>]`; under node it
  is `module.exports`. Both give the same object. It requires nothing: what it needs comes in as arguments.
- **Licence:** starts with `SPDX-License-Identifier: AGPL-3.0-or-later`, and names where it came from:
  `from sims/<x>/sim.js @ <commit>`.

```js
/* SPDX-License-Identifier: AGPL-3.0-or-later
   DHCP lease timers (RFC 2131 §4.4.5). From sims/dhcp-dora/sim.js @ <commit>. */
(function (root) {
  'use strict';
  var model = {
    timers: function (lease) { return { t1: 0.5 * lease, t2: 0.875 * lease, expiry: lease }; }
  };
  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['dhcp-lease'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
```

## How a sim uses one

The page includes it before its own `sim.js`, by the same relative path as the kit, so it runs unbuilt from
`file://`; the build inlines it into the sim's single file (`scripts/build.mjs`):

```html
<script src="../../kit/kit.js"></script>
...
<script src="../../models/dhcp-lease.js"></script>
<script src="strings.js"></script>
<script src="sim.js"></script>
```

`sim.js` takes it from the global in a page and from `require` in node tests:

```js
(function (root) {
  'use strict';
  var lease = typeof module === 'object' && module.exports
    ? require('../../models/dhcp-lease.js')
    : root.SimdeckModels['dhcp-lease'];
  ...
})(typeof globalThis !== 'undefined' ? globalThis : this);
```

The sim keeps its own tests for what it builds on top (its steps, presets, the page); the model's rules are tested
here, once.

## Checks

`npm run check` and the build (`lib/models.mjs`) refuse a model without its header, tests or changelog line, one
that is not pure, one that does not load both ways to the same object, and a page that includes a model that does
not exist. `npm run gate -- <id>` checks every model the page includes and runs its tests with the sim's.

## Ownership

- **Only the coordinator changes `models/`.** Page tasks never edit it; the gate's scope check refuses it.
- **Promotion** (when the first soft dependent is about to start, or the second sim needs the model):
  1. Move the shared functions from `sims/<x>/sim.js` into `models/<name>.js`, unchanged in behaviour, with the
     header above.
  2. Move their rule tests from `sims/<x>/sim.test.js` into `models/<name>.test.js`.
  3. Point `sims/<x>/` at it (page `<script>`, `sim.js` lookup), and check that its gate still passes and its
     screenshots do not change.
  4. Add a line to `CHANGELOG.md`.
- **Additive only.** Once a model is in use, a change keeps every existing function and result as they are: add a
  function or an optional parameter whose default keeps the old behaviour, with a test and a changelog line. A
  change that would alter a result is a new function (or a new model), never an edit.
- **Requests** come from page tasks under "Shared requests" in their `NOTES.md` (what, why, the smallest change).
  The page works around it locally until the coordinator lands the change, then drops the workaround.
