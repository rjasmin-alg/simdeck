<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# topologydrafter: notes

Adopted from `~/projects/topologydrafter` at `5b173cf` (2026-09-30; task `docs/tasks/w1/topologydrafter.md`, catalogue
`app-topologydrafter`). The first commit on the branch is the plain copy of `index.html`, `css/`, `js/` and
`tests/smoke.html`, so `git diff` from it shows every simdeck change. The simdeck copy is canonical from here on.

## Layout

| File | |
|---|---|
| `js/*.js` | the app's ES modules, the source (`js/i18n.js` is new) |
| `bundle.mjs` | the one-off bundler: `js/` → `app.js` (no dependencies) |
| `app.js` | **generated**, one classic script; the page loads it after `strings.js` |
| `strings.js` | every visible string, `{ hr, en }` |
| `css/style.css` | the app's own chrome |
| `tests/smoke.html` | the app's own smoke test, now on the bundle; `sim.test.js` runs it in Chromium |

## Import

**Bundling (task step 2).** The build inlines only classic scripts and import-free modules
(`docs/site-structure.md` §5). After any change in `js/`:

```sh
node sims/topologydrafter/bundle.mjs           # writes app.js
node sims/topologydrafter/bundle.mjs --check   # exit 1 when app.js is stale
```

Each module becomes a function scope: its `import { a, b as c } from './x.js'` reads from the modules bundled before
it, and it returns its exports. It refuses forms it does not handle (default exports, `import *`, re-exports) and
import cycles. The entry (`main`) is skipped when `globalThis.TOPOLOGYDRAFTER_NO_BOOT` is set, so the smoke test can load
the bundle without booting the app. A test checks that `app.js` equals what `bundle.mjs` makes of `js/`, so a hand edit of
`app.js` or a forgotten rebuild fails `npm test`. No new dependency.

**Markers (task step 3):** `data-sim`, the `#simdeck-meta` placeholder (`metaFor(sim.json)`), `#simdeck-exceptions`, and
the kit header's back link (`.sd-back`, `../../index.html`) at the left of the toolbar. Without the kit the back link is
a plain link (no history-back).

**Deep links (task step 4):** `?sample=two-sites|dmz|campus&present=1&step=<n>&theme=light|dark` as before, plus
`?lang=hr|en` and `?motion=reduce`. `sim.json` `entries` lists the three samples with `query: "sample=<id>&present=1"`, so
the home page and course files can name `topologydrafter#dmz`.

## Decisions

- **Class `explorer`.** It is a drawing tool, but `tool` never goes on course pages, and the task lists URM, WIN1 and
  WIN2: students open the three samples in presentation mode and step through them. Not a `stepper`: only one sample
  has steps (dmz: 0–2), and the kit's step controller is not there.
- **Croatian (task step 5)** in the same page, chosen as the kit chooses (`?lang=`, else `localStorage` `simdeck.lang`,
  else `<html lang>`, which is `hr`). The **EN / HR** button stores the choice and reloads with `?lang=`, like the kit's L
  switch (L stays the app's link tool). A sample nobody has edited comes back built in the other language at the same
  step; any other drawing comes back from the autosave as it is (the user's own labels are not translated).
- **Catalog labels** (67 devices, 69 services, groups, categories, link kinds, zone colours) are getters on the catalog
  objects that read `strings.js`, so every module that used `dev.label` follows the language unchanged. The palette search
  matches a label in either language ("router" finds Usmjernik).
- **Badge codes stay codes** (DNS, SMB, GW, BKP, MON, …): they are drawn on every box and exported into slides; the
  full name is in both languages in the legend and the tooltip.
- **Sample text** is in the table; host names, addresses, VLAN numbers and interface names (DC01, 10.10.0.10, Te1/0/1,
  MEC / stack) are data and the same in both.
- **Concepts, not tools** (COMMON.md §1): `pfSense / OPNsense` → *Software firewall / Softverski vatrozid*; services
  `ESXi` → `HV` *Hypervisor (type 1)*, `PVE` (Proxmox VE) → `VIRT` *Virtualisation platform*, `DOCKER` → `CTR`
  *Container engine*, `K8S` → `ORCH` *Container orchestration*, device *Kubernetes cluster* → *Container cluster*, `ENTRA`
  → `IDaaS` *Cloud directory*, `S3` → `OBJ`; sample sublabels `— pfSense` dropped and `Samba` → `SMB`. The ids are unchanged,
  so saved `.json` diagrams still open. Kept: Windows Server features the WIN courses teach (AD DS, RODC, GPO, AD FS, DFS,
  NPS, Hyper-V, WinRM), and the *Windows Server* / *Linux server* / file-server device types, because the two-sites sample
  is about mixed Windows and Linux roles. A test fails if a removed name comes back.
- **Fixed in the copy:** `.present-bar` ignored `hidden` (its `display: flex` won), so the step bar showed, faded,
  outside presentation mode; a note's size was ignored (the canvas CSS `font-size` beat the SVG
  attribute), so the samples' 24 px headings drew at 14 px. Now inline `style`.
- **Added:** presenter clicker keys in presentation mode (PageDown / PageUp, Home / End, next to ← → and Space), and no
  transition under `?motion=reduce` or the OS setting.

## Exceptions (`#simdeck-exceptions`)

`kit` (own runtime), `text-size` (the editor's 13 px chrome, 10–12 px rails; in presentation mode the rails are hidden and
the diagram fits the screen), `theme` (the chrome is always dark; the canvas has its own light/dark, light by default).
The task asked for `one-screen` too, but the gate found it unused (the editor fills the window, the rails scroll inside),
as was `tokens`; both dropped (COMMON.md §12).

## Deviations from the task

- `one-screen` not declared (above).
- The task's `node tests/run.mjs` does not exist in the original; its tests are the browser page `tests/smoke.html`
  (20 checks plus one per sample). Ported to load `app.js` from `file://`, and run by `sim.test.js` in hr and en.
- Six small app changes beyond the markers (the fixes and additions above). Each is marked `simdeck copy` in the code.

## Sources

- The original app (`README.md`, `js/`, `tests/smoke.html`).
- Croatian terms from the URM book (`~/projects/uvod-u-racunalne-mreze`): usmjernik, preklopnik, koncentrator, pristupna
  točka, vatrozid, zadani pristupnik, uravnotežitelj opterećenja, obrnuti proxy, hipervizor, zona, podružnica, sjedište,
  tijelo za izdavanje certifikata, višefaktorska autentikacija, trunk (kept in English, as the book does).
- Not from the books, my choice *(check)*: kontroler domene (samo za čitanje), jezgreni / pristupni preklopnik, prespojni
  panel, skokovito računalo (bastion), sabirnik zapisa, grozd kontejnera, pogon kontejnera, knjižnica traka, poslužiteljski
  ormar, perimetar s tri kraka, Privuci (snap).

## Term pairs (not in kit/glossary.js; the page uses no `[[terms]]`, it has no kit)

| en | hr |
|---|---|
| domain controller | kontroler domene |
| read-only domain controller | kontroler domene samo za čitanje |
| core switch | jezgreni preklopnik |
| access switch | pristupni preklopnik |
| load balancer | uravnotežitelj opterećenja (URM) |
| reverse proxy | obrnuti proxy (URM) |
| jump host | skokovito računalo |
| default gateway | zadani pristupnik (URM) |

The italic-English-at-first-mention term rule is not applied: the strings are labels and short captions, not prose.

## Shared requests

None. (`docs/tasks/OPEN.md` items are in the report: the task scope allows only this folder.)

## Checks not done here

- A real projector and a clicker *(check)*: PageDown / PageUp were tested with the keyboard only.
- Export (PNG, SVG, clipboard) and Save / Open were not exercised in a browser here; the smoke test checks the SVG
  builder. Exported file names lose diacritics (`sjediste-…`).
- Long Croatian labels wrap to two lines on some boxes (Jezgreni preklopnik, Perimetarski vatrozid): the cable runs
  through the second line, and in dmz the "unutarnji krak" link label sits on the badges, as "inside leg" does in English.
  The smoke test's overlap rules still pass in hr.
- Phone (375×812): no sideways scroll, but the editor is unusable there; a sample link in presentation mode shows the
  whole diagram, small.
- Note colours from the inspector are still ignored on the canvas (the theme's ink wins); left as in the original.
- Freezing the original (`~/projects/topologydrafter`, `materijali.online/topologija/`) is outside simdeck.

## Time

Start 2026-10-02 05:17, done 05:40 (about 25 minutes, one session).
