<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ad-structure — specification

One concept: **the logical structure of Active Directory (forest, tree, domain, OU, container) and what each boundary
is for: security (the forest), replication (the domain partition vs the forest-wide partitions) and policy (GPO links
on site, domain and OU, never on a `CN=` container).** Class: explorer (no steps). Task:
`docs/tasks/w2/win-ad-structure.md`; catalogue `docs/catalogue.md` §4.5.1.

Every rule and expected result below is checked by `sim.test.js`. *(check)* marks a statement that could not be
confirmed against the vendor's documentation in this session; `NOTES.md` lists them.

## 1. The world (constant data)

| Thing | Value | Source |
|---|---|---|
| Forest | `quillmoor.example`; forest root domain `quillmoor.example` | task; estate `forest.txt` |
| Tree 1 | `quillmoor.example` and its child `brk.quillmoor.example` | task (the child domain is invented for the lesson; the estate has one domain) |
| Tree 2 | `emberline.example` (new tree in the same forest) | task |
| OU tree of `quillmoor.example` | `CN=Users` (155 users), `CN=Computers` (159 computers), `OU=Quillmoor` › `OU=Staff` › `OU=HQ` (21 users), `OU=Brackenridge` (44 users); `OU=Quillmoor` › `OU=Workstations` (35 computers), `OU=Servers` (5 computers) | estate `ou-tree.txt` (subset the task names) |
| `brk`, `emberline` | `CN=Users`, `CN=Computers` only (counts unknown, not shown) | chosen here: a drop target in another domain, for rule 6 |
| GPO links, `quillmoor.example` | domain root: Default Domain Policy, Local Admins - Interactive, Drive Maps, Windows Update - Defer (in that order); `OU=Workstations`: Chirp Autostart; `OU=Servers`: Firewall Off | estate `gpos.txt` |
| GPO links, `brk`, `emberline` | domain root: Default Domain Policy (every domain gets its own) | Microsoft, chosen here |
| Sites | `HQ` (subnet 10.10.0.0/16), `Branch` (10.20.0.0/16), one site link `HQ–Branch`; no GPO linked to a site | topologydrafter `two-sites` (DC01 10.10.0.10 at HQ, RODC01 10.20.0.10 at the branch); the /16 prefixes are chosen here *(check)* |
| DCs | `DC01` (quillmoor, HQ, GC), `RODC01` (quillmoor, Branch, read-only, not GC), `BRK-DC01` (brk, Branch, GC), `EMB-DC01` (emberline, HQ, GC) | DC01/RODC01 from `two-sites`; BRK-DC01 and EMB-DC01 added here so each domain has a DC and each site holds DCs of two domains (rule 7) |
| Objects to place | user `ana`, computer `PC07`, group `G-Projects`, all in `quillmoor.example` | task |
| Default containers | users and groups → `CN=Users`, computers → `CN=Computers` (so that is where all three start) | Microsoft, "Redirect users and computers containers" (2026-02-12) |

The estate's other OUs (`Domain Controllers`, `Service Accounts`, `Disabled`, `Outsourcers`) are left out to fit one
screen; the task names the subset.

## 2. Rules

1. **The forest is the security boundary.** All domains share one schema, one configuration partition and one global
   catalog. Enterprise Admins (and Schema Admins, for the schema) are in the forest root domain and have rights in every
   domain: `reach('enterprise-admins')` = all three domains. Domain Admins have rights in their own domain
   (`reach('domain-admins:brk')` = `[brk]`), but a domain's owners can reach every other domain of the forest, so the
   domain is **not** a security boundary: `securityBoundary()` = `forest`. Microsoft: "Active Directory Domain Services
   overview"; "Using the organizational domain forest model" (2025-05-12): "Domain owners have authority over the entire
   domain as well as access to all other domains in the forest."
2. **Replication.** Schema and configuration replicate to every DC of the forest (4 DCs). A domain partition replicates
   only to the DCs of its own domain (full copy; the RODC holds a read-only full copy), and a **partial** copy goes to
   every GC of the other domains. A domain is also the boundary of Domain Admins and of the one domain password policy
   (its own Default Domain Policy). Expected: `replicas('domain:brk')` = BRK-DC01 full; DC01 and EMB-DC01 partial;
   RODC01 none. `replicas('domain:quillmoor')` = DC01 full, RODC01 full read-only, BRK-DC01 and EMB-DC01 partial.
   `replicas('schema')` = all four. Microsoft: "Active Directory replication concepts".
3. **Trees and trusts.** A tree is a set of domains with a contiguous DNS namespace: a child's name is a label plus its
   parent's name (`brk.quillmoor.example` under `quillmoor.example`; `emberline.example` is not, so it is a new tree).
   A child domain gets a two-way transitive **parent–child** trust with its parent; a new tree root gets a two-way
   transitive **tree-root** trust with the forest root. Transitivity: `brk` reaches `emberline` through
   `quillmoor` (path `brk → quillmoor → emberline`). The forest's trusts form a tree, so there is one path; no
   tie-break is needed. Microsoft: "How domain and forest trusts work".
4. **An OU** is a container inside one domain that carries GPO links and delegated permissions. It is not a security
   principal (no SID), so it never appears on an ACL: `isPrincipal(OU)` = false, `isPrincipal(user|computer|group)` =
   true.
5. **`CN=Users` and `CN=Computers` are containers, not OUs:** no GPO can be linked to them (`canLinkGpo` true only for
   site, domain and OU), so objects there get only site- and domain-linked GPOs. Expected: `ana` in `CN=Users` → the
   four domain-root GPOs; `PC07` in `OU=Workstations` → those four + Chirp Autostart; in `OU=Servers` → four + Firewall
   Off. Order: the domain, then the object's OUs from the top down (the order links are processed; precedence itself
   is out of scope, `win-gpo-precedence`). The site is not on this path: a computer's site comes from its subnet, not
   from the directory tree, and no GPO is linked to a site here (`gpoLinks(site)` = `[]`). Which half of a GPO (user
   or computer settings) applies is not modelled: the page lists the GPOs **linked in the object's scope**. Group
   Policy applies only to users and computers: a **group receives no GPO** wherever it sits (`receivesGpo(group)` =
   false, its list is empty); a group can only filter whom a GPO applies to. Microsoft, "Redirect users and computers
   containers" (2026-02-12): "Group policies can be applied on OU containers but not on CN class containers"; estate
   `ou-tree.txt`.
6. **One parent.** Every object sits in exactly one container; its distinguished name has one parent
   (`CN=ana,CN=Users,DC=quillmoor,DC=example`). Placing it elsewhere moves it. Refusals, checked in this order
   (tie-break): unknown object or target → `unknown` (before every other reason); a site → `site` (rule 7); a box that is not an OU or a container
   (forest, tree, domain head, DC, another object) → `not-container`; an OU or container of another domain → `other-domain`
   (that is a migration between domains, not a move). A refused attempt leaves the placement unchanged. Placing an
   object where it already is (compared with the current placement, not the default) succeeds with `same: true`.
7. **Sites are physical** (subnets and site links) and independent of domains: `HQ` holds DCs of `quillmoor` and
   `emberline`, `Branch` of `quillmoor` and `brk`; `quillmoor` spans both sites. Objects are not placed in sites.
   Microsoft: "Designing the site topology".

## 3. State and params

Params: `lens` ∈ {none, security, replication, policy} (default none, the one visible control); hidden, set by the
stage: `sel` (selected box id or ''), `held` (object picked up by a click, or ''), `ana`, `pc07`, `gprojects` (each
object's container id), `last` (`'<object>><target>'`, the last placement attempt, or '').

State: `{ lens, selected, held, placed: { objectId: containerId }, attempt: { obj, target, ok, reason } | null,
dn: { objectId }, gpos: { objectId: [{ at, gpo }] }, lit: { mode, nodes[], grey[] } }`. `attempt` is the last move:
refused (with its reason), or a real move (the page clears `last` when an object is dropped where it already is); a
`last` that says a move succeeded but disagrees with the placement params is stale and ignored. A param naming a container
the object may not be in (another domain, unknown id) falls back to the object's default container, so a hand-edited
URL never gives an invalid state.

**Lenses** (`lit`): `security` lights the forest; `replication` lights the forest (schema, configuration) and each
domain with its own partition; `policy` lights every box that can carry a GPO link (2 sites, 3 domains, 6 OUs) and
greys the six `CN=` containers; `none` lights nothing.

## 4. Presets

| # | id | params | expected |
|---|---|---|---|
| 1 | `security` | lens security, sel forest | forest lit; card: Enterprise Admins reach all 3 domains |
| 2 | `replication` | lens replication, sel forest | 4 DCs hold schema and configuration; each domain partition on its own DCs, partial on the GCs |
| 3 | `policy` | lens policy, sel q-users | 11 boxes lit, 6 containers greyed; card on `CN=Users`: no GPO link possible |
| 4 | `quillmoor-as-is` | lens none, sel ana, all objects in their default containers | `ana` in `CN=Users` → the four domain-root GPOs |
