<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-group-scopes — notes

Task `docs/tasks/w2/win-group-scopes.md` (thread t-0110, 2026-10-04). Explorer; the share's ACL is kit view K4
(`kit/ruletable.js`, `deny` mode = allows add up, `at: 'all'`). Rules and expected results: `SPEC.md`.

## Decisions

- **K4 is used, not drawn by hand.** The task's Depends on line names K4 "once it exists"; it exists (kit 0.5.0). The
  ACL is a K4 table in `deny` mode with only allow rows, which is exactly "the union of the matching allows" (rule 7):
  every reached valid ACE wins, the implicit row "no ACE matches" wins when none does. An invalid ACE is a "no" row
  with its principal struck (`miss`) and a "⚠ invalid ACE" note; a reached ACE says "via N groups" or "directly".
- **Scene.** Two domain bands (brk on top, quillmoor under it) and five columns: users, first groups, the universal
  group, group B, the share. Pills have the scope as border **and** word: global solid (c1), domain local dashed (c3),
  universal double (c4). Arrows are an SVG overlay drawn at 1:1 from the laid-out HTML nodes (no `viewBox`, so text
  is never scaled), redrawn on resize. An invalid edge is dashed red with a numbered ✕ at its middle; the number points
  into the "Not allowed" list. The tested path is a thick accent line plus an outline on its nodes.
- **ACE badges** on the pills ("ACE: Modify", ✕ when invalid) instead of arrows to the share: an arrow from a user in
  column 1 to the share in column 5 would cross the other pills.
- **Group names follow the scope** (`G-Projects`, `DL-Projects`, `U-Projects-Modify`): preset `dl-into-global`
  ("DL-Projects nested into a global group") is then just scopeA = DL, scopeB = G, and a name never claims a scope the
  group does not have.
- **Testing.** The Test buttons are on the stage, one per user (`▶ ana brk`, `▶ ivo quillmoor`), plus key `T` for
  the selected user; they set the hidden params `userDomain` and `tested`. Once tested, every change re-runs the test
  live (task "Live"). Before the first test the ACL rows are unread and the share says "press ▶".
- **ivo's membership.** In the default layout ana is always in A; ivo is added to A only while he is the tested user
  (that is preset 2, "ivo added to G-Projects"). With `viaU`, ivo sits in `G-Projects-HQ` (G, quillmoor) as the
  task's AGUDLP preset needs. The caption says "For the test, ivo is added to G-Projects" so the edge is not a
  surprise; a separate toggle did not fit the panel. `aclPrincipal: user` puts the tested user on the ACL.
- **Domain Admins (G, quillmoor) → Full control** is ACE 1 on every ACL, so the table always has a row the user does not
  reach. Not in the task; it is not drawn in the diagram.
- **The caption** names the problem on the tested user's way (an invalid edge from a group the user reaches, or an
  invalid ACE on a reached principal), else the first problem, then the result with its AGDLP / AGUDLP / "works, but
  not AGDLP" label. The universal-group caption mentions the global catalog.
- **Panel fit.** The gate's "panel fits" check failed at 1198 px > 898 px. Fixed by: scope choices labelled G / DL / U
  (the pills and legend carry the words), group B's domain as a toggle (`bInBrk`), the user choice moved to the stage,
  and slightly tighter `.sd-group` / `.sd-presets` gaps in the page CSS (0.4rem / 0.25rem instead of the kit's
  0.55rem / 0.35rem).
- **"Changed"** marks the groups whose scope or domain changed, the edges that are new or changed verdict (a yellow
  halo under the line), and the result (share card and the test result line) after the last param change; not while
  the page loads.

## Deviations from the task

- Params: added `bInBrk` (group B in brk; preset `dl-on-foreign-acl` needs B "created in brk") and `viaU` (the AGUDLP
  layout of preset `agudlp`); `test` is a stage button + key, with a hidden `tested` param; `userDomain` is hidden in the
  panel and set by the stage buttons.
- With `viaU` and `aInB` both on, ana has two valid chains (3 and 4 hops): the page shows the tie-break of rule 7
  (shortest wins) live. The equal-length tie-break cannot occur in this scene; it is tested on hand-built graphs.
- The task's state names `groups, members, acl, testUser`; the state also carries `users`, `edges` (verdicts),
  `aces` (verdicts), `access` per user (`granted, rights, ace, path, hops, label, reached`), `tested`, `resDomain`.
- The task's English caption "`ana` → … → Modify: that is AGDLP" is generated from the path, so it reads the same for
  every valid path.

## Sources

- Microsoft Learn, "Active Directory security groups", section "Group scope", table columns Possible members / Can
  grant permissions / Possible member of — fetched 2026-10-04 (learn.microsoft.com, page dated 2025-07-02). Rules 1–3 of
  the task match it word for word.
- Estate `student/configs/ad/quillmoor/trusts.txt`: `Pellucid-Access` (DomainLocal, members from another domain, Modify
  on `\\hq-fs01\projects\…`) and `Payroll` (Global). Used for the share name and the scope examples only.

## Unchecked *(check)*

- The global catalog keeps universal groups' membership (the GC page fetched does not say it in so many words).
- Microsoft's current wording of the AGDLP / AGUDLP recommendation (not on the security-groups page).
- Universal security groups need at least Windows 2000 native mode; the sim assumes functional level 2003 or higher.
- Croatian terms (below), none in the glossary or the books.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| group scope | opseg grupe |
| global group | globalna grupa |
| domain local group | lokalna grupa domene |
| universal group | univerzalna grupa |
| nesting | ugniježđivanje |
| global catalog | globalni katalog |
| account domain / resource domain | domena računa / domena resursa |
| forest root | korijen šume |

(*permission* — dozvola is in the glossary as *file permission*; the page writes "dozvola" plainly.)

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute (same as `win-dhcp-scope-options`); worked
  around with `.sd-ctl[hidden] { display: none; }` in the page.
- **K4:** none. An optional `spanNote` (a note under the whole row instead of under the mark) would let long "via"
  paths sit under the row without widening the mark column; the page shows a group count instead.

## Tags

Topic `windows-admin`, tag `active-directory` (both in `tags.json`).

## Time

Start to done in one session on 2026-10-04, 12:12 to 12:40 by the machine clock (reading 5 min, spec and model 5, page and fit 10, review and fixes 10).

## Review

A fresh reviewer read the diff against SPEC.md and ran 30 mutations of sim.js: 24 caught at first. The six survivors now have tests (duplicate id resolves to the first, g-members before g-own-domain, unknown parent and ACE principal, rights listed once plus a membership cycle, a domain change marks the group); all 30 are caught. Also fixed from it: the explanation lacked three clauses of the scope table, "lokalna domene" → "lokalna grupa domene", Croatian domain names after prepositions ("iz domene brk"), the AGUDLP caption said "both account domains", the functional-level remark, ACL expanded at first mention, and a caption now says when ivo is added to G-Projects for the test.
