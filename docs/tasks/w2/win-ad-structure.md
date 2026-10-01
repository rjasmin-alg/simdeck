# win-ad-structure: Forest, tree, domain, OU

| | |
|---|---|
| Task | `win-ad-structure` (wave 2b, Active Directory) |
| Catalogue entry | `win-ad-structure` in `docs/catalogue.md` §4.5.1 |
| Kind | build a new simulator |
| Folder | `sims/win-ad-structure/` |
| Class | explorer |
| Size | S |
| Priority | P2 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `active-directory` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **the logical structure of AD and what each boundary is for (security, replication, policy)**.

The student: click through a sample forest, place objects.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.1.

## Sources

- `/home/rjasmin/projects/topologydrafter/js/samples.js` (sample `two-sites`: AD multi-site with RODC)
- Catalogue seed: link-topologydrafter two-sites
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/ou-tree.txt` (OU tree with object counts; `CN=Users` holds 155 users)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/forest.txt` (forest/domain names, one site, no subnets)
- `~/projects/dr-lecture-estate/student/configs/ad/quillmoor/gpos.txt` (which GPOs are linked where)
- Microsoft Learn: "Active Directory Domain Services overview"; "How domain and forest trusts work"; "Active Directory replication concepts"; "Redirect the users and computers containers in Active Directory domains"

## Model and presets

- **Scene:** one sample forest drawn as nested boxes: forest `quillmoor.example` (forest root domain), its child domain `brk.quillmoor.example` (same tree), and a second tree `emberline.example` in the same forest. Inside `quillmoor.example`, the OU tree from the DR estate (`ou-tree.txt`: `OU=Quillmoor` › `Staff` › `HQ`, `Brackenridge`; `Workstations`, `Servers`; plus the default containers `CN=Users`, `CN=Computers`). Below, a strip of two AD sites taken from topologydrafter `two-sites` (HQ with DC01, Branch with RODC01), drawn apart from the domains on purpose. A side card shows the selected box's facts. No kit view needed.
- **State:** `{ lens: 'security'|'replication'|'policy'|'none', selected: nodeId|null, placed: { objectId: containerId } }` — the forest itself is constant data.
- **Interaction (reference, no steps):** clicking a box selects it and fills the card; dragging (or click-then-click) an object card (user `ana`, computer `PC07`, group `G-Projects`) into a container updates `placed`; the lens highlights the boundary it names.
- **Rules:**
  1. The forest is the security boundary: all domains share one schema, one configuration partition and one global catalog, and Enterprise Admins / Schema Admins have rights in every domain (Microsoft: "Active Directory Domain Services overview"; "Security considerations for trusts": the domain is not a security boundary).
  2. A domain is the boundary of its domain partition's replication, of Domain Admins, and of the one domain password policy; schema and configuration replicate forest-wide; the GC holds a partial copy of every domain (Microsoft: "Active Directory replication concepts").
  3. A tree is a set of domains with a contiguous DNS namespace; a child domain gets a two-way transitive parent–child trust automatically, a new tree gets a tree-root trust to the forest root (Microsoft: "How domain and forest trusts work").
  4. An OU is a container inside one domain that carries GPO links and delegated permissions; it is not a security principal (no SID), so it never appears on an ACL.
  5. `CN=Users` and `CN=Computers` are containers, not OUs: GPOs cannot be linked to them, so objects there get only site- and domain-linked GPOs (Microsoft: "Redirect the users and computers containers"; estate `ou-tree.txt` has 155 users there).
  6. Every object sits in exactly one container (its distinguished name has one parent); a user cannot be placed in another domain's OU by dragging — that is a migration, refused with a reason.
  7. Sites are physical (subnets and links) and independent of domains: one site can hold DCs of several domains, one domain can span sites (Microsoft: "Designing the site topology").
- **Params:** `lens` choice {none, security, replication, policy}, default none. A reference page normally has no params; this one choice is the lens.
- **Presets (lenses, 4):**
  - `security` — the forest outline is highlighted; card: "Enterprise Admins reach every domain here". From rule 1.
  - `replication` — schema/configuration shaded across all three domains, each domain partition shaded only in its own domain, sites strip shows where the copies live. From rules 2, 7.
  - `policy` — the containers that can carry GPO links (site, domain, OU) are highlighted; `CN=Users` greyed with "no GPO link possible". From rules 4, 5.
  - `quillmoor-as-is` — the estate's real tree: `ana` placed in `CN=Users` → card lists only domain-linked GPOs (Default Domain Policy, Local Admins - Interactive, Drive Maps, Windows Update - Defer from `gpos.txt`). From the DR estate.
- **Steps:** 0 (reference).
- **Legend:** forest (thick outline), domain (solid box), OU (folder tab), container (dashed box), site (rounded strip); "selected/changed" highlight marks the box chosen last and the object just placed.
- **Captions:** hr: "*Organizational unit* (organizacijska jedinica) nosi poveznice na GPO i delegiranje, ali nije sigurnosni subjekt: ne može se pojaviti u ACL-u." en: "An organizational unit carries GPO links and delegation, but it is not a security principal: it can't appear on an ACL."
  hr: "`CN=Users` je spremnik, a ne OU: na njega se ne može povezati GPO, pa korisnik `ana` dobiva samo pravila s razine domene." en: "`CN=Users` is a container, not an OU: no GPO can be linked there, so `ana` gets only domain-level policy."
- **Terms (no course-book terms; Microsoft hr localisation, check):** forest — šuma; tree — stablo; domain — domena; organizational unit — organizacijska jedinica; domain controller — kontroler domene; site — lokacija (Microsoft hr uses "web-mjesto", check); replication — replikacija; container — spremnik.
- **Misconceptions:** the domain is the security boundary (it is the forest); OUs are like groups and can be given permissions; sites follow domains.
- **Out of scope:** trusts between forests (`win-trusts`), FSMO roles (`win-fsmo-roles`), group scopes (`win-group-scopes`), the GPO precedence order itself (`win-gpo-precedence`).
- **Note for the coordinator:** the task is "reference" but the student drags objects and switches lenses; the kit says reference pages have no params. Either allow one lens choice on a reference page or reclassify as explorer (steps 0).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ad-structure sims/win-ad-structure` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ad-structure/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
