<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ad-structure — notes

Task `docs/tasks/w2/win-ad-structure.md` (thread t-0131, 2026-10-15). Explorer, no kit view. Rules and expected
results: `SPEC.md`.

## Decisions

- **Class explorer (steps 0).** The task's own table already says explorer; its note for the coordinator (reference
  page vs one lens choice) is answered by that: the lens is the one visible param of an explorer.
- **Scene as nested boxes.** Forest (thick outline) › trees (dotted) › domains (solid, panel fill) › OUs (solid with
  a folder tab) and `CN=` containers (dashed). The quillmoor OU tree is drawn as nested boxes in two columns
  (`CN=Users` | `CN=Computers`; inside `OU=Quillmoor`, `OU=Staff` › HQ, Brackenridge on the left, Workstations and
  Servers on the right). A single indented list was tried first and did not fit 1920×1080.
- **Sites strip** under the forest, apart from it: two rounded strips (HQ, Branch) with their DCs side by side, the
  site link and "sites are physical, apart from the domains" between them.
- **DCs added.** `two-sites` has DC01 (HQ) and RODC01 (Branch), both of the root domain. `BRK-DC01` (brk, Branch) and
  `EMB-DC01` (emberline, HQ) were added so each domain has a DC and each site holds DCs of two domains (rule 7).
  GC on DC01, BRK-DC01, EMB-DC01; RODC01 is not a GC, so it shows that a domain partition goes nowhere but its own
  DCs and the GCs.
- **Objects start in their default containers** (ana and G-Projects in `CN=Users`, PC07 in `CN=Computers`), which
  is where new objects land (Microsoft, "Redirect users and computers containers"). There is no tray: every object
  always has exactly one parent (rule 6).
- **Moving:** drag (HTML5 drag and drop), or click the object (it is "held", dashed outline; the valid targets of
  its domain get a dashed outline) and then click a box (or another object: it goes to that object's container,
  as a drag onto it does). Clicking the held object again, or Esc, cancels. A drop where the
  object already is just selects it. State lives in hidden params (`sel`, `held`, `ana`, `pc07`, `gprojects`,
  `last`) so the URL, reset and the language switch keep it, as in `win-group-scopes`.
- **Refusals** say why, in the caption, and mark the target box (red dashed border, "✕ refused"): another domain's
  OU or container → migration; a site → sites are physical; the forest, a tree, a domain head, a DC or an object →
  not an OU or container. Dropping on a domain head is refused as "not a container" although AD can hold objects
  directly under the domain head; the page keeps to OUs and containers (see *(check)*).
- **GPOs in scope** are listed by link (site, domain, then OUs top-down), not by which half of a GPO applies to a
  user or a computer; the card says "GPOs linked in its scope". Precedence is `win-gpo-precedence`.
- **A group receives no GPO.** Group Policy applies to users and computers only; G-Projects' card and caption say so
  wherever it sits (found by the review; the first version listed GPOs for the group too).
- **Changing the lens clears the last move's caption**, so the lens's own caption can show.
- **Every domain has its own Default Domain Policy** (brk and emberline too); the estate's `gpos.txt` lists only
  quillmoor's. That makes "one password policy per domain" concrete.
- **Lenses:** security outlines the forest (c2) and marks each domain "not a security boundary"; replication hatches
  the forest (schema, configuration), tints each domain in its own series colour with its name, and lists each DC's
  copies (schema/config hatched, own domain full and tinted, GC partial dashed); policy marks every box "GPO: yes" /
  "GPO: no" (the `CN=` containers also hatched grey) and lists the GPO names linked there. Colour never carries meaning alone.
- **Captions** follow the last action (refusal, move), then the held object, then the selection, then the lens. The
  task's two captions are used word for word: an OU selected (caption 1); a `CN=` container, or an object in one
  (caption 2, generalised to `{cn}` and `{obj}`).
- **Card** (right of the stage): kind, name and 3–5 facts of the selected box, all computed from the model.
- **Chips** show only the object's name; kind is in its shape (user round, computer square, group double border),
  the card and the aria-label. The kind word did not fit beside the name in the narrow OU boxes.

## Deviations from the task

- The OU tree is the subset the task names; the estate's `OU=Domain Controllers`, `Service Accounts`, `Disabled`
  and `Outsourcers` are left out to fit one screen.
- The child domain `brk.quillmoor.example`, the tree `emberline.example`, their `CN=` containers and the DCs
  BRK-DC01 / EMB-DC01 are invented for the lesson (the estate has one domain, as `forest.txt` says).
- Subnets 10.10.0.0/16 and 10.20.0.0/16 are chosen from the addresses in `two-sites`.
- The legend adds "tree" (dotted) to the task's five shapes.
- The state carries more than the task's `{ lens, selected, placed }`: `held`, `attempt`, `dn`, `gpos`, `lit`.
- Owner questions were not added to `docs/tasks/OPEN.md`: the gate's scope rule allows changes only under
  `sims/win-ad-structure/`. They are in the thread report instead.

## Sources

- Estate `student/configs/ad/quillmoor/ou-tree.txt` (OUs and counts, 155 users in `CN=Users`), `forest.txt`
  (forest/domain name), `gpos.txt` (GPO links).
- topologydrafter `js/samples.js`, sample `two-sites` (HQ with DC01 10.10.0.10, Branch with RODC01 10.20.0.10).
- Microsoft Learn, "Redirect users and computers containers" (dated 2026-02-12, fetched 2026-10-15): "Group policies
  can be applied on OU containers but not on CN class containers"; new users, groups and computers go to `CN=Users`
  and `CN=Computers`.
- Microsoft Learn, "Using the organizational domain forest model" (dated 2025-05-12, fetched 2026-10-15): "Domain
  owners have authority over the entire domain as well as access to all other domains in the forest."
- Microsoft Learn, "Active Directory Domain Services overview", "How domain and forest trusts work", "Active
  Directory replication concepts", "Designing the site topology" — named by the task, not fetched in this session.

## Unchecked *(check)*

- "Security considerations for trusts" (the task's citation for "the domain is not a security boundary") returned
  404 at the URL tried; the claim is backed by the forest-model page quoted above.
- Objects can be created directly under a domain head; the page refuses that drop as "not an OU or container" to
  keep to the task's targets.
- The /16 subnets of the two sites.
- Drag and drop was tested in Chromium only. Firefox has not always started a drag on a `<button draggable>`;
  click-then-click works everywhere.
- Microsoft's hr terms for child domain and the parent–child trust ("podređena domena", "roditelj–dijete").
- Croatian terms (below): Microsoft's hr localisation of "site" may be "web-mjesto"; the page uses "lokacija", as
  `win-gpo-precedence` does.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| forest | šuma |
| domain | domena |
| organizational unit | organizacijska jedinica |
| container (CN=…) | spremnik |
| site (AD) | lokacija *(check)* |
| domain controller | kontroler domene |
| global catalog | globalni katalog |
| schema / configuration | shema / konfiguracija |
| domain partition | particija domene |
| security principal | sigurnosni subjekt |
| distinguished name | razlikovno ime |
| security boundary | sigurnosna granica |
| parent–child trust / tree-root trust | povjerenje roditelj–dijete / povjerenje korijena stabla |
| replication | replikacija |

Used from the glossary: `[[tree]]` (stablo), `[[access control list]]`.

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute (same as `win-group-scopes`,
  `win-dhcp-scope-options`); worked around with `.sd-ctl[hidden] { display: none; }` in the page.
- **check-page:** the one-screen check passed while the forest's contents spilled out of the forest box under the
  sites strip (nothing scrolled, so nothing failed). A check that a stage child does not overflow its own box would
  have caught it; found here with a screenshot script instead.

## Tags

Topic `windows-admin`, tag `active-directory` (both in `tags.json`), level `intro`.

## Time

Start to done in one session on 2026-10-15, 22:11 to 22:40 by the machine clock (reading 6 min, spec and model 6,
page and fitting one screen 10, review and fixes 7).

## Review

A fresh reviewer read the code against SPEC.md and ran 56 mutations of sim.js: 44 caught at first, 12 survived. Nine
survivors now have tests (RODC read-only schema and configuration, a DC is a principal, two `isContiguous` label
cases, unknown object before site, `same` against the current placement, the default containers, no site GPO,
`passwordPolicy` of an unknown domain); the other three behave the same as the original on this data (`gpoLinks`
ignoring `canLinkGpo` while containers have no GPOs, duplicate domains per site, BFS vs DFS on a trust tree).
Fixed from the review too: a group was said to get GPOs; "GPOs linked to the OUs above it" left out its own OU and
said "gets" where the model only lists links in scope; the GPO order claimed a site step that is not modelled; a file
dropped on the stage opened in the browser (own drag type now); a chip clicked while holding was refused instead of
dropping into its container; the replication caption said every GC holds a partial copy (of the other domains);
the RODC sentence contradicted itself; no Esc to cancel a hold; the card was a second live region; card headings
for objects were lowercase; Croatian wording (one verb "povezati" for GPO links, "Neprekinuti", "sigurnosna
granica", "podređena domena").
