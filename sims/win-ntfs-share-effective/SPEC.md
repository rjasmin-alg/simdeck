<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-ntfs-share-effective — specification

One concept: **over the network the stricter of share and NTFS wins; on NTFS deny beats allow in canonical order
(so an explicit allow beats an inherited deny); rights from several groups add up.** Class: explorer (no steps).
Task: `docs/tasks/w2/win-ntfs-share-effective.md`; catalogue `docs/catalogue.md` §4.5.7 and the contrast in §5.1
(this is **not** first match).

Every rule and expected result below is checked by `sim.test.js`. *(check)* marks a vendor rule that could not be
confirmed against Microsoft's documentation in this session (no network access to it); `NOTES.md` lists them.

## 1. The world

| Thing | Value | Source |
|---|---|---|
| Server, folder, share | `FS1`, `D:\Prodaja`, shared as `\\FS1\Prodaja` | task |
| Domain | `QUILLMOOR` (as in `win-gpo-precedence`); SIDs `S-1-5-21-…-<RID>` | chosen here |
| Users | ana (Prodaja; + Voditelji with toggle `voditelji`), ivan (Prodaja, Pripravnici), marko (no group of his own) | task |
| Primary group | every domain user is in Domain Users (RID 513); Domain Users is a member of FS1's built-in Users (S-1-5-32-545) | Microsoft, "Active Directory security groups" / "Well-known SIDs" *(check)* |
| Well-known groups in every token | Everyone S-1-1-0, Authenticated Users S-1-5-11, and NETWORK S-1-5-2 (over the network) or INTERACTIVE S-1-5-4 (local logon) | Microsoft, "Well-known SIDs" *(check)* |

**Rights** are evaluated as five atoms: `r` read data, `x` execute / traverse, `w` write (create, append, write
attributes), `d` delete, `p` change permissions and take ownership. The page shows the standard NTFS levels as
chips, each on when all its atoms are granted:

| Chip | NTFS level | Atoms | Share level (rule 7) |
|---|---|---|---|
| R | Read | r | |
| X | Read & execute | r x | Read |
| W | Write | w | |
| M | Modify | r x w d | Change |
| F | Full Control | r x w d p | Full Control |

Source: Microsoft, "File and folder permissions" (Modify = Read & execute + Write + Delete; Full Control adds
change permissions and take ownership) *(check)*. The atom split is the model's simplification of the access mask.

**Share ACL** (`\\FS1\Prodaja`), in this order:

| # | Principal | Level | Type | When |
|---|---|---|---|---|
| 1 | Administrators | Full Control | allow | always |
| 2 | Everyone | `shareEveryone`: Read / Change / Full Control (default Full Control) | allow | always |
| 3 | Everyone | Change | deny | `shareDenyEveryone` (default off) |

A share allow grants the whole level (its atoms above). A share deny removes what its box stands for: Deny Read
removes `r x`, Deny Change removes what Change adds over Read (`w d`), Deny Full Control removes everything
(Microsoft's dialog ticks all three deny boxes for Full Control) *(check)*.

**NTFS ACL** (`D:\Prodaja`), as written; the evaluation sorts it into canonical order (rule 2):

| Principal | Rights | Type | Origin | When |
|---|---|---|---|---|
| Pripravnici | Write | deny | explicit | `denyPripravnici = explicit` |
| ivan | Modify | allow | explicit | `explicitAllowIvan` (default off) |
| Prodaja | `ntfsProdaja`: Read / Modify (default Modify) | allow | explicit | always |
| Voditelji | Write | allow | explicit | always (only ana with `voditelji` is a member) |
| Pripravnici | Write | deny | inherited from `D:\` | `denyPripravnici = inherited` |
| Administrators | Full Control | allow | inherited from `D:\` | always |
| SYSTEM | Full Control | allow | inherited from `D:\` | always |

No ACE names Users, Domain Users or Everyone on NTFS, so marko matches nothing (preset `classic`). The real default
ACL of a volume root grants Users read access; this scene's admin removed it (stated in NOTES).

## 2. Rules (in evaluation order)

1. **Token.** The user's SIDs: the user, each group the user is in, every group those are in (nested groups
   expanded breadth first, each group once), then Everyone, Authenticated Users and NETWORK or INTERACTIVE by path
   (Microsoft, "Access Tokens" *(check)*; sim `win-access-token`). Expected: ana over the network = ana, Domain
   Users, Prodaja, Users (via Domain Users), Everyone, Authenticated Users, NETWORK.
   - Tie-break: a group reached twice appears once, with its first path.
2. **NTFS, canonical order.** ACEs are read as explicit deny, explicit allow, inherited deny, inherited allow
   (Microsoft, "Order of ACEs in a DACL"). For each right, the first ACE that matches a SID in the token and
   mentions the right decides it: a deny refuses it, an allow grants it; later ACEs no longer change it
   ("How DACLs Control Access to an Object"). Rights allowed by different ACEs add up.
   - Tie-break: ACEs in the same canonical group keep their written order; the first decides, a later one that
     would have said the same is marked "too late". The result is the same either way (same type).
3. **Explicit before inherited.** Follows from rule 2: an explicit allow on `D:\Prodaja` is read before a deny
   inherited from `D:\`, so it wins. An explicit deny is read before every allow, so it beats them all.
4. **Implicit deny.** A right no matching ACE mentions is refused ("How DACLs Control Access…"). With no matching
   ACE at all, the table's implicit row decides: no access.
5. **Share.** Every matching allow adds its level; any matching deny removes what it denies, whatever its position
   (deny wins; the share has no explicit/inherited split). No matching ACE → no access.
6. **Effective.** Over the network a right needs both the share and NTFS (the more restrictive of the two, right by
   right); locally only NTFS applies ("Share and NTFS permissions on a file server" *(check)*).
   - "Decided by": compare the level chips. Effective = NTFS ≠ share → NTFS is stricter; = share ≠ NTFS → share is
     stricter; = both → the same; = neither → each takes something away. Local → NTFS alone.
7. **Level equivalence.** Share Read ≈ NTFS Read & execute, Change ≈ Modify, Full Control ≈ Full Control (task;
   Microsoft *(check)*).
8. **Default share permission.** A new share gives Everyone Read (Microsoft *(check)*): preset `default-share`.

**Row marks** (K4 rule table, the page's own marks, `docs/sim-ui.md` §12 "a rule of the page's own"): a matching ACE
that decided at least one right **decides** (▶, outlined) and lists the chips it decided; a matching ACE that decided
nothing is **too late** (▽, struck); an ACE whose principal is not in the token is "–". On the share every
matching allow that still grants something decides (allows add up), and every matching deny decides. The implicit
row decides only when no ACE matches.

**Chip deciders.** A chip that is on lists the ACEs that supplied its atoms; a chip that is off lists the ACEs that
refused one of its atoms, or "no ACE" (implicit deny).

## 3. Expected results (presets)

Each preset sets every param; unnamed ones keep the defaults (ana, network, Everyone Full Control, no share deny,
Prodaja Modify, no Pripravnici deny, no ivan allow, ana not in Voditelji).

| # | Preset | Changes | Share | NTFS | Effective | Decided by |
|---|---|---|---|---|---|---|
| 1 | `classic` | — | ana: R X W M F | ana: R X W M (F: no ACE) | ana Modify | NTFS |
| | | marko | R X W M F | none (implicit row) | no access | NTFS |
| 2 | `default-share` | Everyone Read | ana: R X | R X W M | ana Read & execute (share Read) | share |
| | | local | (not used) | R X W M | Modify | local |
| 3 | `groups-add-up` | Prodaja Read, ana in Voditelji | R X W M F | R + W (Prodaja R, Voditelji W) | Read + Write | NTFS |
| 4 | `deny-wins` | ivan, Pripravnici Deny Write explicit | R X W M F | R X (W, M, F refused by the deny) | Read & execute | NTFS |
| 5 | `explicit-beats-inherited` | ivan, Prodaja Read, Pripravnici Deny Write inherited, ivan Modify explicit | R X W M F | R X W M (ivan's ACE; Prodaja and the inherited deny too late) | Modify | NTFS |
| 6 | `deny-everyone-share` | share Deny Everyone Change | R X (W M F refused by the deny) | R X W M | Read & execute | share |
| | | local | (not used) | R X W M | Modify | local |

Preset 5 sets Prodaja to Read on purpose: with Prodaja Modify (explicit) ivan would already write past the inherited
deny through his group, and the explicit allow for ivan would change nothing.

Preset 4: the deny removes Write only; Delete stays granted by Prodaja's Modify, but no level that includes it is
complete, so the chips show Read & execute.

## 4. Out of scope

Inheritance mechanics, move vs copy (`win-ntfs-inheritance`), ownership, UAC token filtering, access-based
enumeration, Dynamic Access Control, special permissions beyond the five atoms, per-file ACEs.
