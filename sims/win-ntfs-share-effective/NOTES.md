<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ntfs-share-effective — notes

Task `docs/tasks/w2/win-ntfs-share-effective.md` (thread t-0114, 2026-10-05). Explorer; both ACLs are kit view K4
(`kit/ruletable.js`, `at: 'all'`, every row's `mark` set by the page: "a rule of the page's own", `docs/sim-ui.md`
§12). Rules and expected results: `SPEC.md`.

## Decisions

- **K4 is used, not drawn by hand.** It exists (kit 0.5.0). Neither table is one of K4's modes: NTFS is
  canonical order where the first ACE that mentions a right decides it (not first match, and not "any deny wins"),
  and the share is deny-wins *per right* (K4's `deny` mode would mark Everyone's allow `beaten` although it still
  grants Read). So the model gives every row its mark (`win` = decided at least one right, `beaten` = matched but
  too late, `no` = principal not in the token) and `hit` = matched, so the kit's implicit row still wins only when
  no row matches. The rows are drawn in canonical order with `no` = position.
- **Rights as five atoms** (`r x w d p`), shown as the standard level chips R, X (Read & execute), W, M (Modify),
  F (Full Control), each on when all its atoms are. Atoms make "right by right" exact (Read + Write from two groups;
  Deny Write leaves Delete but breaks Modify). Under each chip the ACE numbers that decided it, or ∅ for implicit
  deny; under the effective chips which side refused it (share / NTFS / both).
- **"Decided by"** compares level chips, not atoms: Everyone Full Control minus Deny Change leaves `r x p` on the
  share, which is the chips R X; comparing atoms would have called it "both" instead of "the share".
- **Scene additions** (not in the task, for realism; none changes a preset result): Domain Users in every token,
  nested in FS1's built-in Users (shows rule 1's nesting); Everyone, Authenticated Users and NETWORK/INTERACTIVE;
  share ACE Administrators Full Control and NTFS inherited Administrators / SYSTEM Full Control as rows that do not
  apply to the three users. No ACE names Users, so marko still gets nothing (the real default root ACL grants Users
  read; this scene's admin removed it).
- **Stage pickers.** `who`, `path` and `voditelji` are buttons on the token card (hidden params, kept in the URL and
  presets): the panel did not fit at 1920×1080 with eight controls (gate: 1171 px > 898 px). Panel gaps are tightened
  as in `win-group-scopes`.
- **Captions** are built from the state: the main sentence by "decided by" (the task's two captions are used word
  for word where they apply: `default-share` / `deny-everyone-share` "…Ana may only read", and
  `explicit-beats-inherited`), then one clause per NTFS order rule that showed (explicit deny, explicit allow before
  inherited deny, inherited deny deciding Write, allows adding up) and the share deny. Croatian: a permission name
  carries its Croatian gloss at its first mention in the caption, italics alone after that.
- **"Changed"** marks the ACE mark cells and the chips that changed with the last param change (not during load); rows are matched by identity (principal, allow/deny, explicit/inherited), so an added row marks only itself.
- **A matching share deny always "decides"**, also for rights no allow granted (Everyone Read + Deny Change: the
  deny row is marked for W M F). That follows SPEC ("deny wins"); marking it only where an allow would have granted
  something would read as "too late", which is wrong for a share.

## Deviations from the task

- **Added param `shareDenyEveryone`** (toggle, share Deny Everyone Change): preset `deny-everyone-share` needs it and
  no listed param sets a share deny.
- **Preset `explicit-beats-inherited` sets Prodaja to Read.** With Prodaja Modify (explicit) ivan already writes past
  the inherited deny through his group, and ivan's own explicit Modify would change nothing. With Read, toggling
  ivan's explicit allow flips Write; with Prodaja Modify the caption says the group's explicit allow beats the deny.
- The Voditelji Write ACE is always on the NTFS ACL; the `voditelji` toggle is ana's membership.
- State: `ntfs[].rights` is one level (not an array); the derived parts are `sids`, `ntfsEff`, `shareEff` (null
  locally), `effective`, `decidedBy` (`ntfs | share | same | both | local`).
- No administrator user: "administrators included" in preset 6 is said in the caption (the deny is for Everyone).
  An admin user would bring UAC token filtering, which is out of scope.

## Sources

- Microsoft Win32 security documentation: "Order of ACEs in a DACL", "How DACLs Control Access to an Object",
  "Access Control Lists", "Access Tokens", "Well-known SIDs" — cited from memory, no network access in this session.
- Microsoft, "Share and NTFS permissions on a file server" / "File and folder permissions" — cited from memory.
- `docs/catalogue.md` §4.5.7 and §5.1 (the first-match contrast); `sims/rule-first-match` for the contrast named in
  the explanation.

## Unchecked *(check)*

- Every Microsoft title above (exact titles not confirmed).
- Canonical order explicit deny → explicit allow → inherited deny → inherited allow, and that the access check takes
  each right from the first ACE that mentions it (stated in the task; matches my knowledge of the docs).
- Over the network the more restrictive of share and NTFS applies; locally only NTFS.
- Share Read ≈ Read & execute, Change ≈ Modify, Full Control ≈ Full Control.
- Default share permission Everyone Read.
- Share deny semantics: Deny Change removes only what Change adds over Read (write, delete); Deny Full Control
  removes everything (the dialog ticks all three deny boxes).
- Modify = Read & execute + Write + Delete; Full Control adds change permissions and take ownership.
- Domain Users is a member of a member server's built-in Users; NETWORK S-1-5-2 / INTERACTIVE S-1-5-4 by logon type.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| access token | pristupni token |
| security identifier (SID) | sigurnosni identifikator (SID) |
| access control entry (ACE) | stavka popisa za kontrolu pristupa |
| share permissions | dozvole dijeljenja |
| NTFS permissions | NTFS dozvole |
| deny / allow | zabrana / dozvola |
| inherited / explicit | naslijeđena / izravno zadana |
| effective access | efektivni pristup |
| canonical order | kanonski redoslijed |
| Read / Read & execute / Write / Modify / Full Control / Change | čitanje / čitanje i izvršavanje / pisanje / izmjena / potpuno upravljanje / promjena |

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute that `visible()` sets (same as
  `win-dhcp-scope-options`); worked around with `.sd-ctl[hidden] { display: none; }`. Smallest fix: that rule in kit.css.
- **K4:** `Simdeck.ruleTable.verdict(ok, text)` takes a string only; the page builds the same span itself to put
  the chip letters in a `translate="no"` node. Smallest fix: accept a node as `text`.
- **K4:** no way to mark a row "changed" in an explorer (`at: 'all'` has no pointer row); the page adds `sd-changed`
  to the mark cells after rendering. Smallest fix: an optional `changed: [row indices]` in the spec.

## Tags

Topic `windows-admin`, tag `permissions` (both in `tags.json`).

## Time

Start to done in one session on 2026-10-05: about 2 h, estimated (reading 20 min, spec and model 25 min, page and
the 1920×1080 fit 45 min, tests and notes 15 min, fresh review and its fixes 15 min). No clock was kept.

## Review

A fresh reviewer read the diff against SPEC.md, checked the Windows semantics (no factual errors found) and ran
35 mutations of sim.js: 32 killed. Fixed from it: "changed" marked every row below an added ACE (rows are now
matched by identity, with a test); the local "no ACE" caption no longer mentions the share; the unused
`shareEff.implicit` field was removed; the two surviving `changes()` mutants now have tests; Croatian: "dobro
poznata" for well-known SIDs (not "ugrađena", which is BUILTIN), gender agreement, clitic order, the ACL sentence.
