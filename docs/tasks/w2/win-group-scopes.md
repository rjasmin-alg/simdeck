# win-group-scopes: Group scopes and AGDLP

| | |
|---|---|
| Task | `win-group-scopes` (wave 2b, Active Directory) |
| Catalogue entry | `win-group-scopes` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-group-scopes/` |
| Class | explorer |
| Size | S |
| Priority | P1 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `active-directory` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **domain local, global, universal: who can be a member, where they can be used; AGDLP nesting**.

The student: build the nesting for a file share, test a user.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft Learn: "Active Directory security groups" (group scope table: members, usable in, can be member of)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/trusts.txt` (estate example: `Pellucid-Access` DomainLocal with members from another domain; `Payroll` Global)

## Model and presets

- **Scene:** two domains of one forest, `quillmoor.example` (resource domain, owns `\\hq-fs01\projects`) and child `brk.quillmoor.example` (account domain). Accounts `ana` (brk) and `ivo` (quillmoor); groups drawn as pills whose border shows the scope; arrows for "is member of"; the share's ACL drawn as a K4 rule table (rows = ACEs). A "test user" button runs the access check and lights the path user → groups → ACE.
- **State (explorer):** `{ groups: [{ id, domain, scope: 'DL'|'G'|'U' }], members: [[childId, parentId]], acl: [{ principal, right }], testUser }`. Derived each render: per edge `valid` + reason, per user `access` + path.
- **Live:** changing a scope or an edge re-validates every edge and re-runs the test user; an invalid edge is drawn broken with its reason, never silently dropped.
- **Rules (domain functional level 2003 or higher; Microsoft: "Active Directory security groups", group scope table):**
  1. Global (G): members are accounts and global groups **from the same domain**; usable on ACLs in any domain of the forest and in trusting domains; can be a member of universal and domain local groups anywhere in the forest, and of global groups in its own domain.
  2. Domain local (DL): members are accounts, global and universal groups from any domain of the forest (and trusted domains), and domain local groups of its own domain; usable on ACLs **only in its own domain**; can be a member only of domain local groups in its own domain.
  3. Universal (U): members are accounts, global and universal groups from any domain of the forest; usable anywhere in the forest; can be a member of universal and domain local groups. Its membership is stored in the global catalog.
  4. An ACE naming a DL group from another domain is invalid (rule 2) — the picker wouldn't offer it.
  5. Access: the user gets the right if any group on a valid membership chain from the user reaches an ACE (union; deny ACEs out of scope here). Nesting is transitive along valid edges only.
  6. AGDLP (accounts → global → domain local → permission) and AGUDLP for several domains are recommendations, not enforced rules; the page labels a valid but non-AGDLP layout "works, but not AGDLP" (Microsoft: "Active Directory security groups", nesting guidance (check wording)).
  7. Tie-break: if a user reaches the ACE by two chains, show the shortest valid one; equal length → the first in member-list order.
- **Params:** `scopeA` choice {G, DL, U} default G (group `G-Projects`, brk); `scopeB` choice {G, DL, U} default DL (group `DL-Projects-Modify`, quillmoor); `aInB` toggle default on; `userDomain` choice {brk, quillmoor} default brk; `aclPrincipal` choice {group B, group A, user} default group B; `test` button.
- **Presets (5):**
  - `agdlp` — `ana`(brk) ∈ G-Projects(G, brk) ∈ DL-Projects-Modify(DL, quillmoor); ACL: DL → Modify. Access granted, path 3 hops, label AGDLP. Derived, unchecked.
  - `global-cross-domain-member` — `ivo` (quillmoor) added to G-Projects (G, brk) → edge invalid (rule 1); `ivo` has no access.
  - `dl-on-foreign-acl` — scope of B set to DL but B created in brk and placed on the quillmoor share ACL → ACE invalid (rule 2/4), nobody gets access.
  - `dl-into-global` — DL-Projects nested into a global group → invalid (rule 2: DL can only be in DL).
  - `agudlp` — two account domains: G-brk and G-quillmoor both in U-Projects (U), U in DL → both users granted; caption notes the universal group's membership lives in the GC.
- **Steps:** 0 (explorer).
- **Legend:** global (solid border), domain local (dashed), universal (double); valid edge (arrow), invalid edge (broken arrow with ✕); ACE row; "changed" highlight marks the edge or scope just changed and the access result.
- **Captions:** hr: "*Global group* (globalna grupa) prima samo članove iz svoje domene — `ivo` iz `quillmoor` ne može ući u `G-Projects` iz `brk`." en: "A global group takes members only from its own domain — `ivo` from `quillmoor` cannot join `G-Projects` in `brk`."
  hr: "`ana` → G-Projects → DL-Projects-Modify → *Modify*: to je AGDLP." en: "`ana` → G-Projects → DL-Projects-Modify → Modify: that is AGDLP."
- **Terms (check):** group scope — opseg grupe; global group — globalna grupa; domain local group — lokalna grupa domene; universal group — univerzalna grupa; nesting — ugniježđivanje; permission — dozvola (UL ch07); global catalog — globalni katalog.
- **Misconceptions:** "domain local" means local to a computer; any group can go on any ACL; AGDLP is enforced by AD.
- **Out of scope:** group types (security vs distribution), scope conversion rules, deny ACEs and NTFS/share combination (`win-ntfs-share-effective`), the token (`win-access-token`), cross-forest trusts.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-group-scopes sims/win-group-scopes` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-group-scopes/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
