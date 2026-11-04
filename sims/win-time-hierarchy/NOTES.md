<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-time-hierarchy: notes

New stepper (task `docs/tasks/w3/win-time-hierarchy.md`, catalogue `win-time-hierarchy`, §4.5.1 and §5.21, wave 3).
Drawn with kit view **K2, topology** (`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **K2 for the tree.** Six cards in a 12-column grid, four card rows: `loom` on top, `DC01` under it, `DC02` left and
  `DC03` right, each member under its own DC. A link is drawn for every sync relation of this round (solid, in ink);
  an edge of the usual tree that is not used is `off` (dashed, muted); the edge of a member whose time service is
  stopped is `down` (dashed with ✕). When the role is on DC02, a DC02–DC03 link appears (DC03 follows the new PDC).
  On a round step, one packet per sync relation runs from the source to the node with the source's offset as its chip.
- **Cards:** the offset (big, signed seconds), the host from the estate (`qm-dc01`, `qm-dc02`, `brk-dc03`; loom's
  address `10.40.1.5`), the configuration with the source ("domain hierarchy, from DC01", "domain hierarchy, nobody
  above", "manual peer: loom", "true time"), the own drift per round, and badges: PDC (filled), event 12 (dashed), not
  syncing (dashed), and "corrected ±N s" (what the sync changed after the drift). "Changed" is the kit's mark on cards
  whose offset differs from the step before.
- **Side column (page-drawn):** the round, the Kerberos strip (four fixed pairs: PC-A ↔ DC02 and PC-B ↔ DC03 as logons,
  DC02 ↔ DC01 and DC03 ↔ DC01 DC to DC; skew in seconds, ✓ / ✕ with a dashed red border when refused), and the event
  log (event 12, Kerberos refused / works again), this round's entries highlighted.
- **DC to DC pairs in the strip.** The task's strip is "|member − DC| per pair"; the two DC pairs are added so the
  `move-pdc` split (DC01 on loom, the rest on DC02) is visible and can fail with a steeper drift (DCs authenticate
  replication with Kerberos too). The logon pairs are the task's.
- **Members' DCs are fixed** (PC-A → DC02, PC-B → DC03): the task's tree says only "DC02, DC03 → members". So the
  members do not move with the role, and the old PDC "feeds nobody" after the move (rule 4).
- **Own drifts** of the nodes no param drives: DC01 +1 (when not PDC), DC02 −2 (when not PDC), DC03 +3, PC-A −5 s per
  round (made up, small), so every round shows a drift and its correction; none decides an outcome. All clocks start
  at 0.
- **`pdcSource` describes DC01's configuration**, not "the PDC's": that is what makes rule 4 work (the setting stays on
  DC01 when the role moves). Its label says so ("DC01's source").
- **The two choices share a row in the panel** (page CSS on the kit's control group) so the panel fits at 1920×1080
  without its own scroll; their option labels are short (`loom` / none, `DC01` / `DC02`).
- **Captions:** round 1 explains the mechanism with this round's sync order ("loom → DC01 → DC02, DC03 → PC-A, PC-B",
  one tree per root); then event 12, the free-running PDC and the domain's offset, a corrected PDC (quillmoor), the
  stopped member's distance, new and standing Kerberos refusals (the task's caption for PC-B at 320 s), the whole
  domain off true time but all green (the task's caption, from 5 minutes on), and the split after a moved role. Round
  1 with a lone PDC defers the stopped member and the old PDC to round 2, so no caption is longer than three lines.
  Distances are in seconds ("320 s", as the task's caption); the whole domain against true time is in minutes ("10
  minutes").
- **Names on the page:** Windows Server features are the course's topic (PDC emulator, domain hierarchy, event 12,
  Kerberos). No commands are shown; `w32tm` and `manualpeerlist` stay out of the page (concepts, not tools).
- **Tags:** `time-sync` (task), plus `active-directory` and `kerberos`, all in `tags.json`. Topic `windows-admin`,
  level `advanced`. Related: `ntp-sync` (the protocol, "inet-ntp-sync" in the catalogue), `win-kerberos`,
  `win-fsmo-roles`.

## Deviations from the task

- **A `rounds` param** (1–10, default 4). The presets differ in length (4 / 10 / 9 / 6 / 3 rounds) and the kit's
  presets are param sets, so the length has to be a param. `sim.json` `steps` is 4 (the default).
- **`pdc-no-source` caption says "ahead of"**: the preset drifts +60 s per round (clock fast), while the task's
  caption says "behind". The page picks ahead or behind from the sign; with −60 it reads exactly as the task's.
- **`quillmoor`** sets `pdcDrift` +15 so it differs from `healthy`: qm-dc01's own clock drifts and loom pulls it back
  every round. The estate gives only the configuration (PDC qm-dc01, manual peer loom 10.40.1.5); the drift is made up.
- **Ranges step by 5 s** in the controls (`pdcDrift`, `pcbDrift`); the model takes any whole number in the range.
- **Kerberos strip:** two DC to DC pairs added (above).

## Reuse

- `win-kerberos` (soft dependency): only the 5-minute comparison is reused, `skewOk` (≤ 300 s passes), copied in
  seconds with the comment `from sims/win-kerberos/sim.js @ 7577d92`. `models/` has no shared model; nothing else of
  the Kerberos exchange is needed here.
- `ntp-sync` covers the NTP arithmetic; this page syncs instantly and says so in the explanation.

## Sources

- Microsoft Learn, "How the Windows Time service works": domain hierarchy, members sync from a DC, DCs from the PDC
  emulator, the forest root PDC as the top with an external source; event 12 text.
- Microsoft Learn, "Windows Time service tools and settings": NtpServer / manual peer, type NT5DS, event 12.
- Microsoft Learn, "Maximum tolerance for computer clock synchronization": Kerberos policy, 5 minutes.
- Estate: `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/forest.txt` (DCs qm-dc01, qm-dc02, brk-dc03;
  PDC qm-dc01; time source loom 10.40.1.5 as manual peer). Student side only; no instructor material used.
- Task file (rules, presets, captions, terms); catalogue §5.21.

## Checks

- Numbers: an independent Python hand model (`library/win-time-hierarchy-check.py` in the thread folder) gave every
  preset's offsets and Kerberos results before `sim.js` was written; `sim.test.js` asserts the same.
- Model: every combination of a param grid (2 × 2 × 2 × 5 × 3, 10 rounds) keeps the strip consistent with the offsets
  and every syncing node equal to its source; at most 10 steps.
- Page sweep: every step of every preset and of a 48-combination param grid at steps 0, 1, 2, 5, 8, 10, in both
  languages at 1920×1080 (686 page loads): no console errors, no empty or unfilled caption, caption not overflowing,
  no card or side box clipped by the stage, no page or panel scroll.
- `npm run gate -- win-time-hierarchy`: passes; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed.

## Unchecked *(check)*

- Rule 4's detail: that DCs choose their time source by the PDC role, so they follow a new PDC at once (real DCs
  re-discover their source at their next sync).
- Rule 6's VM case: a virtual DC that takes its time from the hypervisor (named in the explanation, not drawn).
- Event 12's wording and that it is logged by the forest root PDC set to domain hierarchy (task's quote, not re-read).
- That Kerberos-authenticated DC to DC replication fails past 5 minutes the same way as a logon (the strip's DC pairs).
- Croatian terms the task marks *(check)*: izvor vremena, emulator PDC-a, hijerarhija domene, odmak sata, razlika
  satova.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| time source | izvor vremena | task *(check)* |
| PDC emulator | emulator PDC-a | task *(check)* |
| domain hierarchy | hijerarhija domene | task *(check)* |
| clock drift | odmak sata | task *(check)* |
| time synchronisation | sinkronizacija vremena | task |
| clock skew | razlika satova | task *(check)* |
| offset (from true time) | pomak | `ntp-sync` |

## Shared requests

- **K2: a link direction marker** (a small arrowhead on `active` links, `links[].dir: 'a→b'`), so a hierarchy reads
  without packets at step 0. Here the direction is in the card text ("from DC01") and in the packets on round steps.

## Fresh review

A separate agent read the code against `SPEC.md` and the task, ran 54 mutations of `sim.js` in a copy (13 survived:
10 equivalent in reachable states, such as event 12 deduplicated by code only, the unreachable `krbOk`, the order of
the `manual` and `syncs` checks; 3 real gaps, now tested) and dumped every preset caption in both languages. No model
or SPEC mismatch. Fixed from it:

- Tests: the strip's skew is a distance (`Math.abs`; PC-B behind DC03 with the domain running ahead), `domainOffset`
  is null when a stopped member disagrees (otherwise "everyone agrees" would show), clamps of `pcbDrift` and `rounds`.
  Both bugs re-introduced once in a copy: the tests fail; `<=` → `<` in `skewOk` fails three tests.
- `move-pdc` step 0 said "the other DCs follow the PDC" next to "DC01 still has loom": now "DC03 follows the new PDC".
- "The whole domain follows it" after a moved role or with a stopped member was false: now "everyone below it follows".
- The round-1 order text joined levels with arrows ("DC02 → DC03, PC-A → PC-B" read as PC-A feeding PC-B): now each
  source with who follows it ("loom → DC01; DC01 → DC02, DC03; …").
- The split caption no longer shows at 0 s (role moved, PDC not drifting).
- The stopped-member caption no longer says "nobody corrects its clock" when PC-B is the one on true time: it says it
  runs on its own clock and does not follow DC03.
- Croatian: "ostatak domene udaljen je … kad razlika prijeđe 5 minuta", "Sat na DC01 sam odmiče", and a domain behind
  true time "kasni … za stvarnim vremenom" (the task's wording); ahead and behind are two strings now.
- Explanation: a virtual DC on hypervisor time follows the host's clock, not the domain's (it is corrected, wrongly).
- Round 1 with a corrected PDC and a stopped member was four lines: the stopped member waits for round 2 there too.

Left as is: when both DC pairs fail in one round the caption names the first, the strip shows both; after a moved
role with a stopped member the split caption gives way to the stopped member's (the strip still shows the split).

## Time

Start 2026-11-04 12:44 (scaffolded 12:55), first gate pass 13:00, fresh review 13:08–13:12, review fixed and gate
passing 13:25: about 40 minutes.
