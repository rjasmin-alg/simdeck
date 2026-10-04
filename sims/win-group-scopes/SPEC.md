<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-group-scopes — specification

One concept: **domain local, global and universal groups differ in who can be a member, where they can be used and
what they can be a member of; AGDLP (accounts → global → domain local → permission) is the nesting that follows
from it.** Class: explorer (no steps). Task: `docs/tasks/w2/win-group-scopes.md`; catalogue `docs/catalogue.md`
§4.5.1.

Every rule and expected result below is checked by `sim.test.js`. *(check)* marks a vendor statement that could not
be confirmed against the vendor's documentation in this session; `NOTES.md` lists them.

## 1. The world

| Thing | Value | Source |
|---|---|---|
| Forest | `quillmoor.example` (resource domain, root) and its child `brk.quillmoor.example` (account domain) | task |
| Share | `\\hq-fs01\projects`, on a member server of `quillmoor` | task; estate `trusts.txt` names the share |
| Users | `ana` (brk), `ivo` (quillmoor) | task |
| Group A | `<scope>-Projects` in brk, scope `scopeA` (default G) | task |
| Group B | `<scope>-Projects-Modify` in brk when `bInBrk`, else quillmoor (default), scope `scopeB` (default DL) | task |
| Layout "via universal" (`viaU`) | adds `G-Projects-HQ` (G, quillmoor, member `ivo`) and `U-Projects` (U, quillmoor); A and G-Projects-HQ are members of U, U is a member of B | task preset `agudlp`; names chosen here |
| ACL of the share | 1. `Domain Admins` (G, quillmoor) Full control; 2. the `aclPrincipal` (B, A or the tested user) Modify | task (ACE 2); ACE 1 added here so the table has a row the user does not reach |

A group's name carries its scope as a prefix (`G-`, `DL-`, `U-`), so a scope change renames it: the naming
convention is part of what students learn, and the name never lies about the scope.

Membership (edges `[child, parent]`, in this order):
- default layout: `ana → A`; `ivo → A` when ivo is the tested user (preset `global-cross-domain-member`); `A → B` when
  `aInB`.
- `viaU`: `ana → A`, `ivo → G-Projects-HQ`, `A → U`, `G-Projects-HQ → U`, `U → B`; and `A → B` when `aInB`.

## 2. Rules

Microsoft Learn, "Active Directory security groups", table "group scope" (columns Possible members, Can grant
permissions, Possible member of), checked 2026-10-04. Domain functional level 2003 or higher is assumed (universal
security groups need at least Windows 2000 native mode *(check)*); trusts to other forests are out of scope.

1. **Global (G).** Members: accounts and global groups **from the same domain**. Usable on ACLs in any domain of the
   forest (and trusting domains). Member of: universal groups and domain local groups of any domain of the forest,
   global groups of its own domain.
2. **Domain local (DL).** Members: accounts and global groups from any domain (of the forest or trusted), universal
   groups from any domain of the forest, domain local groups **of its own domain**. Usable on ACLs **only in its own
   domain**. Member of: **only** domain local groups of its own domain (and local groups on computers of its domain,
   not modelled).
3. **Universal (U).** Members: accounts, global and universal groups from any domain of the forest. Usable on ACLs in
   any domain of the forest. Member of: universal groups and domain local groups of the forest. Its membership is
   replicated to the global catalog *(check)*.
4. **Edge check** (`edgeCheck(child, parent)`), in this order, first failure is the reason:
   1. child is DL and parent is not DL → `dl-only-in-dl` (rule 2);
   2. child is DL, parent DL in another domain → `dl-own-domain` (rule 2);
   3. parent is G and child is U → `g-members` (rule 1: a global group takes only accounts and globals);
   4. parent is G and child (account or G) is from another domain → `g-own-domain` (rule 1);
   5. otherwise valid. An unknown id → `unknown`; a group in itself → `self`.
   The two sides of the table agree (a child's "member of" and a parent's "members" give the same verdict), so one
   reason per edge is enough. The check is complete: tested against the table for all 3 × 3 scopes × 2 × 2 domains
   and for accounts.
5. **ACE check** (`aceCheck(principal)`): a DL group from a domain other than the resource's (`quillmoor`) is
   invalid, `dl-foreign-acl` (rule 2; task rule 4: the real picker would not offer it). Accounts, G and U are valid
   on the ACL anywhere in the forest.
6. **Invalid things are shown, never dropped.** An invalid edge or ACE stays in the state with `valid: false` and
   its reason; the page draws it broken.
7. **Access.** A user gets a right if the user, or a group reached from the user along **valid** edges (transitive),
   is the principal of a **valid** ACE. Rights are the union (deny ACEs are out of scope).
8. **Tie-break (path shown).** Breadth-first from the user, edges in member-list order: each group's path is the
   shortest valid chain; on equal length, the chain whose edges come first in the member list (compared edge by edge
   from the user). Among the ACEs the user reaches, the one with the shortest chain is shown; equal length → the
   first in ACL order. `hops` = edges on the chain + 1 (the ACE).
9. **AGDLP label** (a recommendation, not enforced by AD; Microsoft's nesting guidance *(check wording)*): the
   scopes of the groups on the shown chain are `G, DL` → `agdlp`; `G, U, DL` → `agudlp`; any other chain that grants
   access → `other` ("works, but not AGDLP"); no access → `null`.
10. **Duplicates.** A repeated edge is kept once (the first); a repeated group id resolves to the first group with it.

## 3. State (`initial(params)`, JSON-safe)

`{ resDomain, users: [{ id, name, domain, kind: 'user' }], groups: [{ id, name, domain, scope }], members:
[[child, parent]], acl: [{ principal, right }], testUser, tested, edges: [{ child, parent, valid, reason }], aces:
[{ principal, right, valid, reason }], access: { [userId]: { granted, rights, ace, path, hops, label } } }`.

## 4. Params and presets

`scopeA` G/DL/U (G); `scopeB` G/DL/U (DL); `bInBrk` (off = B in quillmoor; added: preset 3 needs it); `aInB` (on);
`userDomain` brk/quillmoor = tested user ana/ivo (brk; set by the two Test buttons on the stage); `aclPrincipal` B/A/user (B); `viaU` (off, added: preset 5
needs it); `tested` (hidden, off; the Test button, key `T`, sets it, and it stays on so every change re-runs the test).

| # | Preset | Params (besides defaults; all `tested`) | Expected |
|---|---|---|---|
| 1 | `agdlp` | — | ana: Modify via ana → G-Projects → DL-Projects-Modify → ACE, hops 3, `agdlp` |
| 2 | `global-cross-domain-member` | userDomain quillmoor | edge ivo → G-Projects invalid `g-own-domain`; ivo no access; ana still granted |
| 3 | `dl-on-foreign-acl` | bInBrk | A → B valid; ACE B invalid `dl-foreign-acl`; nobody has access |
| 4 | `dl-into-global` | scopeA DL, scopeB G | edge DL-Projects → G-Projects-Modify invalid `dl-only-in-dl`; ana no access |
| 5 | `agudlp` | viaU, aInB off | ana → G-Projects → U-Projects → DL-Projects-Modify and ivo → G-Projects-HQ → U-Projects → DL-Projects-Modify, both hops 4, `agudlp` |

All presets are derived from the task (not from the estate's instructor material). Other checked results: user on the
ACL → granted, hops 1, `other`; A (G) on the ACL → granted, hops 2, `other`; A = U, B = DL → granted, `other`; viaU
with aInB on → ana's shown chain is the direct A → B (3 hops beats 4).

## 5. Out of scope

Security vs distribution groups, scope conversion, deny ACEs and the NTFS/share combination
(`win-ntfs-share-effective`), the access token (`win-access-token`), cross-forest and external trusts, local groups on
computers.
