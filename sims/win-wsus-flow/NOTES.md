<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-wsus-flow: notes

New stepper (task `docs/tasks/w2/win-wsus-flow.md`, catalogue `win-wsus-flow`, §4.5.6, wave 2b). Drawn with kit view
**K2, topology** (`kit/topology.js`); the task names no view, and K2 already draws the cards, links and a packet per
step. Rules and expected numbers: `SPEC.md`.

## Decisions

- **One step = the next event that changes something.** Servers sync daily and clients scan every ~20 h for ever, so
  the run would fill with "nothing new" syncs and scans. A sync or scan that finds nothing new passes without a step
  (the clock still moves; the explanation says so). The first sync of each server and the first scan of each client
  are steps even when they find nothing (the `not-synced` preset is made of them), and so is a downstream sync after
  the upstream's catalogue changed (an autonomous branch is seen *not* taking HQ's approval). SPEC.md, "One step".
- **WSUS-BR also syncs on Wednesday at 04:00** (daily schedule). The task's timeline lists only the Thursday 04:00
  sync; on a daily schedule the branch already gets the metadata on Wednesday, without the approval. The page shows
  both, which makes the point that metadata and approval travel separately.
- **Fixed scan times:** PC-HQ1 every 20 h from Wed 14:00, PC-BR1 every 18 h from Wed 17:00 (22 h minus a fixed 9 % and
  18 %), so the model stays deterministic with no seed. PC-BR1's Wednesday scan finds KB-A "not approved": the
  student sees the branch client look and find nothing while HQ already has it.
- **Durations (model):** server content 30 min, client download 30 min, 1 h over the WAN; KB-A is 480 MB.
- **Status report** at the client's next scan (task rule 7); the report is its own step, after the scan.
- **Roll-up:** on, at the replica's next sync (task rule 8): replica-two-sites ends with Saturday's sync bringing
  PC-BR1's status to HQ.
- **"Approve at the branch"** (key `A`) sets `brAt` to the current step: the branch admin's approval is the next step,
  at the time of the current event. In a replica it is rejected (the `replica-cant-approve` preset sets `brAt` 2 and
  opens at step 2, just before the attempt). `brAt` has no control of its own (a hidden range breaks the page check,
  see "Shared requests"), so the URL keeps it only through the preset; after `L` or a reload a button press is lost.
- **When the upstream lacks the files** (an autonomous branch approves before HQ does), HQ fetches them first, then BR
  copies them (task rule 5).
- **Names:** WSUS, Microsoft Update, Group Policy and "All Computers" are named because the course teaches WSUS
  (COMMON.md §1). The product of KB-A is "Windows Server".
- **The hr subtitle** (`concept`) starts at "Središnji WSUS": with Microsoft Update in front it is 96 characters,
  over the 80 limit; the en one has the whole chain.
- **Croatian terms** in italics with the Croatian in parentheses at the first mention (*metadata* (metapodatke),
  *replica* (replika), *autonomous* (samostalni)), written out in the strings: none of them is in `kit/glossary.js`.

## Deviations from the task

- **Step counts** differ from the task's (derived, unchecked) numbers: replica-two-sites 16 (task 13), autonomous-waits
  10 (12), replica-cant-approve 17 (6), not-synced 5 (5), client-points-to-hq 14 (10). The extra steps are the
  Wednesday branch sync, PC-BR1's Wednesday scan, the reports and the roll-up; the replica presets run to the end of
  the flow rather than stopping after the event they are named for. All within 20.
- **`approveAt` choice is Wed 09:00 / Wed 03:30, not Wed 09:00 / Wed 05:00.** Both 09:00 and 05:00 come after the
  branch's 04:00 sync and before PC-HQ1's 14:00 scan, so 05:00 changed nothing but the time on one line. 03:30 falls
  between HQ's 03:00 sync and the branch's 04:00 sync: the replica takes the approval at once and the branch is no
  longer a day behind. **Owner decision** (for `docs/tasks/OPEN.md`): keep 03:30, or use 05:00 as written.
- The state is `servers: { HQ, BR }` rather than separate `upstream`/`downstream` fields, so the event code treats
  both servers alike; the task's fields are all there.

## Sources

- Task file, model and presets.
- Microsoft Learn (titles from the task, not opened from here): "Windows Server Update Services (WSUS) overview";
  "Plan your WSUS deployment" (server hierarchies, replica and autonomous mode, update storage); "Configure WSUS"
  (products and classifications, synchronization schedule, "Download update files to this server only when updates
  are approved"); "Configure Group Policy settings for Automatic Updates" ("Specify intranet Microsoft update service
  location", "Automatic Updates detection frequency": 22 h minus a random 0–20 %).

## Checks

- Numbers: the preset timelines were derived by hand from the rules before the model was written (SPEC.md, "Timeline
  and presets"); the model agrees, and `sim.test.js` pins every time and step count, plus the maximum over all
  combinations (modes, toggles, approval times, `brAt` −1…20).
- 33 tests: 6 tie-breaks, one or more per rule, presets, time order over every combination, the generic block.
- Rule tests broken on purpose, 31 mutations one at a time (phase orders, entity order, products ignored, content at
  sync, branch syncing from Microsoft Update, replica approval not copied, autonomous inheriting, the replica admin
  approving, HQ not fetching for the branch, branch content without approval, detection without approval, the client
  downloading before its server has the files, the WAN as fast as the LAN, install at download, report at install,
  no roll-up, silent events shown, the downstream sync after an upstream change not shown, scan interval, sync hour,
  server download time, client download time, the client's policy ignored, the branch approval time not kept, any
  upstream change counted as a step, the page's scan time not kept): 27 fail a test. The 4 survivors are equivalent: the report's
  phase relative to the scan and the sync (a report exists only after its scan, which already runs after the sync),
  `nextAtHour`'s `<=` vs `<` (both give the same time), and a roll-up added to an autonomous sync (it would change only
  state the page never shows, at a sync that is no step).
- Fresh review (a separate agent read the code against SPEC.md, checked the WSUS facts, made 22 more mutations and
  drove every preset and step in both languages, with the button at steps 2, 5 and 10). Fixed from it: HQ's approval
  caption said HQ now downloads the files when it already had them for the branch; an autonomous branch sync that
  changed nothing was a step; the client strip's "scanned" time followed silent scans (now the last scan that was a
  step, `scanT`); tests pinned times through the model's constants (now literal) and missed the button timeline and
  time order (both added; one of its surviving mutations let time run backwards); "pravilo grupe" → "pravila grupe";
  "samostalni" → "samostalan" as a predicate; the clients', not the server's, status; the not-synced hint (KB-A does
  exist, on Microsoft Update); the thin-arrow legend lists approval; the branch content caption when no branch client
  uses it; an autonomous branch syncing after an HQ approval at 03:30 now says it does not take it; "rejected" →
  the replica's console offers no approving. Its other survivors were equivalent.
- `npm run gate -- win-wsus-flow`: see the report; screenshots 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus replica at steps 9 and 16, replica-cant-approve at 3 (dark) and 17, client-points-to-hq at
  8, autonomous-waits at 10, not-synced at 5.

## Unchecked *(check)*

- Every Microsoft title and setting name above (cited from memory by the task, no network here).
- Default of "download update files only when approved" (on); the detection frequency default (22 h, minus 0–20 %);
  replica roll-up being an option and its default (the model has it on); that an autonomous server does not roll up.
- That an upstream with "download only when approved" fetches files for a downstream's own approval (rule 5).
- Report timing: the task's rule (status at the next contact) is kept; real clients send the install result within
  minutes, so HQ would see PC-HQ1's install sooner than Thu 10:00.
- Whether roll-up also covers autonomous servers in later WSUS versions (the model: replica only).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| update | ažuriranje (zakrpa) | task |
| upstream / downstream server | nadređeni / podređeni poslužitelj | task |
| replica | replika | task |
| autonomous | samostalni | task |
| synchronization | sinkronizacija | task |
| approval | odobrenje | task |
| metadata | metapodaci | task |
| content (update files) | sadržaj (datoteke ažuriranja) | task |

## Shared requests

- **K2: `extra` spans the card.** A node's `extra` lands in the card's first grid column (the mark's), so a wide
  `extra` stretches the mark. The page gives its `extra` elements `grid-column: 1 / -1`; the view could do it.
- **K2: per-packet weight.** "WAN transfers drawn as a thick arrow with size": the view has one arrow weight. The page
  sets a class on the whole drawing when the step's packet is a file transfer and thickens `.sd-topo-path`; a packet
  field `weight: 'bulk'` would do it per packet.
- **K2: a label on a link** (the WAN). The page puts a small cloud node on the HQ–BR link instead.
- **Kit: hidden params.** A control with `visible: () => false` still shows (`.sd-ctl` overrides `[hidden]`), and
  `check-page.mjs` drags the first range on the page even when it is hidden (it crashed on it). A param kept for the
  URL only (`brAt`, set by a button) would want either fixed.
- **Legend swatches** `ws-has` (a box with ✓) and `ws-thick` (a thick bar): defined in the page.

## Time

Start 2026-10-04 13:30; built, reviewed, review fixed, gate passing and status ready 14:01: about 31 min.
