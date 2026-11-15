<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-slow-link: notes

New explorer (task `docs/tasks/w3/win-gpo-slow-link.md`, catalogue `win-gpo-slow-link`, §4.5.2, wave 3). The
extensions are drawn with kit view **K4, rule table** (`kit/ruletable.js`), one row per client-side extension, with the
marks set by the page (`at: -1`, as `win-gpo-processing` does); the scene (PC07, the link with its speed dial, DC01)
is the page's own. Rules, tie-breaks and expected numbers: `SPEC.md`.

## Decisions

- **Explorer, not stepper.** The task file's own note says the concept is a live dial; the catalogue says `expl`. No
  steps; `sim.json` `class: "explorer"`.
- **Layout.** Top: the client `PC07` with the pass (foreground: solid box "startup and logon"; background: dashed box
  "every 90 min"), the dial, `DC01`. The dial is a log scale from 56 kbit/s to 1 Gbit/s: the slow zone (below the
  threshold) hatched with the words "slow link", the threshold a dashed line with a ▲ under it and "threshold 500
  kbit/s" below that, the speed a solid needle with "384 kbit/s" above it, ticks at 100 kbit/s, 1, 10, 100 Mbit/s and
  1 Gbit/s between the bar and the threshold label.
  Above the dial on the right the verdict: "✓ fast link" (solid, `--ok`) or "snail slow link" (dashed, `--danger`);
  at the threshold "at the threshold: fast", with threshold 0 "threshold 0: fast". Below: K4 with nine rows; then a
  tally line ("5 of 9 run, 4 skipped, 0 not in this pass").
- **K4 columns.** `#`, Extension (the Drive Maps row carries a dashed "preference" tag), the action column "Over a
  slow link" (padlock + "always" / "allowed" / "not allowed"), the two task columns "fast link" and "slow link" (the
  outcome on each; the current link's cell lit with an accent outline, the other at half opacity) and the mark column
  "now": runs = `win` ▶ "runs"; skipped = `no` "–" with a note "snail slow link"; not in this pass = `skip`, hatched
  "not in this pass".
- **Shapes beside colour** (the task's legend): runs = filled box; skipped = dashed hollow box + snail; not in this
  pass = grey hatched; always = padlock; changed = the kit's highlight. The snail and the padlock are small inline
  SVG icons in `currentColor`, added to the legend swatches after mount (the kit's legend takes CSS shapes only).
- **"Changed".** The page keeps the state before the last param change (as `win-admx-store` does); the rows whose
  "now" flipped carry a yellow "changed" tag beside their name, and a moved speed or threshold label is highlighted.
  The caption names the flipped rows by their new outcome ("Now running: Scripts."), except when the slow-link sentence
  already lists exactly the rows that became skipped.
- **Captions** are built from the model: slow (lists every skipped row), fast, exactly at the threshold, threshold 0,
  each with a background variant plus the sentence that Software Installation and Folder Redirection wait for a startup
  or logon. The Croatian slow sentence is impersonal ("Preskače se: …") so that the verb agrees with any list
  (Disk Quotas alone is a plural noun in Croatian).
- **Dial labels** are laid out after render: a centred speed or threshold label that would stick out of the dial is
  anchored at its line instead; a tick label that touches the threshold label, its ▲ or the tick kept before it is
  dropped; a zone word that does not fit its zone or lies under the needle or the threshold line is dropped. A window
  resize lays them out again.
- **Names**: `PC07`, `ana`, `DC01` as in `win-gpo-processing`.
- **Model reuse**: `win-gpo-processing` is not in `models/` and its model is a time axis this sim does not need. The
  only part reused is its knowledge of which extensions need a foreground pass (`CSES[].sync` → `fgOnly` here),
  copied with a `// from sims/win-gpo-processing/sim.js @ 350b667` comment. Nothing to promote.

## Deviations from the task

1. **`speedKbps` is a ladder, not a continuous log range.** The kit's range control is linear, so the param is
   `speed`, an index 0–16 into `SPEEDS` = 56, 128, 256, 384, 500, 768, 1 000, 1 500, 2 000, 5 000, 10 000, 20 000,
   50 000, 100 000, 200 000, 500 000, 1 000 000 kbit/s; the model reads `speedKbps = SPEEDS[speed]` and the slider shows
   the value. The ladder holds 384 (VPN), 500 (the tie-break at the default threshold) and 200 000 (the branch). The
   task's lower bound 0 kbit/s is left out: no link is not a slow link, and 0 has no place on a log scale. Should the
   kit get a log-scale range (shared request below), the param can become `speedKbps` again.
2. **Threshold step 100 kbit/s** (task: range 0–5 000, no step given).
3. **The slow caption lists every skipped extension** (Scripts and Disk Quotas too), not only the task's
   "Software Installation and Folder Redirection": rule 3 of the task skips all four, and a caption that names two would
   suggest the other two run.
4. **Captions say "Mbit/s" and "kbit/s"** in both languages, not the task's "Mb/s" and "kbps", and the branch caption
   is the generic fast-link caption ("200 Mbit/s is not below the 500 kbit/s threshold: not a slow link, everything
   applies."), because an explorer's caption comes from the state, not from the preset. The preset's name says
   "Branch at 200 Mbit/s".
5. **Drive Maps defaults to "allowed" across a slow link** (task rule 4 left it as *check*): the policy "Configure
   Drive Maps preference extension policy processing" says that, not configured, Drive Maps items are allowed to
   process across a slow network connection (read in a mirror of the policy text only).
6. **Drive Maps runs in a background refresh** here. `win-gpo-processing`'s NOTES report that Microsoft's fast-logon
   article lists Drive Maps as "not called in background processing", while the Drive Maps policy text speaks of
   background processing being applied by default. The task's rule 5 names only Software Installation and Folder
   Redirection as foreground-only, so the sim follows the task; marked *(check)*.
7. **No `docs/tasks/OPEN.md` entry**: the gate's scope rule refuses any change outside `sims/<id>/`; the owner
   questions are here and in the report.

## Sources

- Microsoft Learn, "Configure Group Policy slow link detection" (policy reference; title confirmed by search): "If you
  type 0 all connections are considered to be fast … If you disable this setting or do not configure it the system
  uses the default value of 500 kilobits per second" (search snippets of the policy text).
- Microsoft Learn archive, "GPOs and Slow Link Detection" (blog of a Microsoft TAM): since Windows Vista Network
  Location Awareness replaces ICMP for slow-link detection.
- TechNet (Windows Server 2003), "Specifying Group Policy for Slow Link Detection" (table 2.6: default slow-link
  processing per extension; Security cannot be turned off; IP Security on by default) and "Group Policy and Network
  Bandwidth" / "Group Policy and Slow Links" (by default only Administrative Templates and security settings are
  processed; Software Installation, Scripts and Folder Redirection are not). Seen in search snippets only.
- Policy "Configure Drive Maps preference extension policy processing" (gp.kapilarya.com mirror of the policy text).
- `/home/rjasmin/projects/topologydrafter/js/samples.js`, sample `two-sites`: the branch WAN link `200/50 Mb`
  (line 84); the sim takes 200 Mbit/s (the 50 Mbit/s upstream is above any threshold too).
- `sims/win-gpo-processing/` (SPEC rule 3): Software Installation and Folder Redirection apply only in a synchronous
  foreground pass.

## Unchecked *(check)*

- T1: a speed equal to the threshold counts as fast ("slower than" read as strict).
- EFS recovery processed over a slow link by default (task rule 2; not in the snippets seen).
- Disk Quotas skipped over a slow link by default (task rule 3; not in the snippets seen).
- Drive Maps: allowed across a slow link by default (mirror only) and processed in the background (see deviation 6).
- Scripts in a background refresh: the model shows Scripts as "runs" in a background refresh on a fast link (task rule
  5 names only Software Installation and Folder Redirection); startup and logon scripts themselves run only at startup
  and logon.
- Every number and default above comes from documentation for Windows Server 2003 to 2012 seen in search results;
  none was read in full in this session.
- The Croatian terms below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| slow link | spora veza | task *(check)* |
| threshold | prag | task *(check)* |
| client-side extension | proširenje na klijentu | task, `win-gpo-processing` *(check)* |
| network location awareness | prepoznavanje mrežne lokacije | task *(check)* |
| bandwidth | propusnost | task (URM, check); in `sim.json` aliases only |
| Folder Redirection | preusmjeravanje mapa | task *(check)* |
| Software Installation | instalacija softvera | `win-gpo-processing` *(check)* |
| Administrative Templates | administrativni predlošci | `win-gpo-processing` *(check)* |
| Disk Quotas | diskovne kvote | simdeck *(check)* |
| EFS recovery | oporavak EFS-a | simdeck *(check)* |
| IP security | sigurnost IP-a | simdeck *(check)* |
| Drive Maps | mapiranje pogona | simdeck *(check)* |
| background refresh | osvježavanje u pozadini | `win-gpo-processing` *(check)* |
| foreground | prvi plan | `win-gpo-processing` *(check)* |

## Checks

- Numbers: a Python hand model of the rules (independent of `sim.js`) before coding: the four presets and four more
  cases of SPEC.md ("Expected numbers"); the model agrees with every one, and `sim.test.js` checks them.
- Browser sweep: 256 pages (the four presets and 60 param sets: 6 speeds × 5 thresholds × 2 passes, Scripts allowed on
  odd speeds; both languages; 1920×1080 and 375×812) from `file://`: no page scroll at 1920×1080, no stage or table
  overflow, no sideways scroll at 375×812, no overlapping or clipped dial labels, no clipped zone words, no
  `undefined`/`NaN`/`null`/unfilled placeholder, no empty caption, no console errors or warnings. Found and fixed on
  the way: the "changed" tags under the row number made the ninth row scroll out of the table (moved beside the name);
  the threshold label sat on the needle; tick labels collided with the threshold label at thresholds of 100 kbit/s and
  on the phone; the threshold label stuck out of the dial on the phone in English; the slow-zone word was clipped on
  the phone; the caption repeated its list of skipped rows; Croatian verb agreement with "diskovne kvote" alone.
- Live check (keyboard presets 2 → 4 → 1, then "background"): the captions name the flipped rows.

## Shared requests

- **Kit range control with a log scale** (`scale: 'log'` with `min`/`max` in the param's own units, or a list of
  notches), so the param can be `speedKbps` as the task names it.
- **Kit legend items with an icon** (a node or an SVG path list), so the page need not append the snail and the
  padlock into the swatches after mount.
- **K4:** none (`at: -1` with page marks, nodes in cells, tags and notes did everything).
- **Glossary:** the term pairs above.

## Tags

Topic `windows-admin`, tag `group-policy` (both in `tags.json`), level `advanced`. Suggested `learn.json` leaf:
Windows Group Policy › "When policy applies" (`group-policy/when`), beside `win-gpo-processing`.

## Fresh review

A separate agent read the task, SPEC.md, the model, the tests, the strings and the page, checked every rule, tie-break
and expected number of SPEC.md against the model (all agree) and made 47 single mutations of `sim.js`: 33 killed at
once. Of the 14 survivors, 7 are equivalent in every reachable state (the `thresholdKbps > 0` guard in `isSlow`, since
no speed is below 56; `!!allowScripts` after `norm`; `equal` without `detection`; the row guard in `flipped`; `cse()`
falling back; an extra `count` key) and 6 were real gaps, now tested; each of the six mutants was re-run and is killed:
the threshold default when a param is bad or missing, rounding a fractional slider value, `null` and `''` turning
detection off (fixed in `clamp`: they fall back to the default), `flipped` comparing the setting, the slider bounds,
and the slow-link defaults with no allow settings. Fixed from it:
- the ▲ of the threshold label was half a label left of its line (now its own marker on the line, the label under it;
  the ▼ before the speed is gone, the needle shows the speed);
- the tick marks of the end labels (100 kbit/s, 1 Gbit/s) sat mid-label;
- "✓fast link" had no space; the needle crossed the "fast link" zone word on the phone (zone words under a line are
  dropped); the setting and outcome cells may wrap on a phone; the dial labels are laid out again on a resize;
- Croatian: the captions say "Veza od 384 kbit/s sporija je …" and "Preskaču se: …" (every list the page can reach is
  plural); "Sada rade / se preskaču / nisu u prolazu"; the tally without verb agreement; "zadnjim pomakom"; `<em
  lang="en">` for the English terms; the background pass "svakih 90 min (+ do 30)" as in `win-gpo-processing`;
- facts: "Allow processing across a slow network connection" is an option of each "Configure … policy processing"
  policy, not a policy of its own; Software Installation and Folder Redirection need a *synchronous* foreground pass
  (the explanation now says so and points to the processing sim).
Not changed: the threshold stays in kbit/s in captions next to a speed in Mbit/s (the policy's unit); the "Always treat
WWAN connections as a slow link" option is left out (added to SPEC's out of scope).

## Time

Start 2026-11-15 13:41 (reading the brief); sources, SPEC and hand model, model and tests, page, gate passing and
sweep by 13:53; fresh review and its fixes, status ready by 14:03: about 22 min wall clock, one session.
