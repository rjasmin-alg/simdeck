<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-trusts: specification

One concept: **direction, transitivity, forest vs external trusts; who can access what** (task
`docs/tasks/w3/win-trusts.md`, catalogue `win-trusts`, §4.5.1). The student builds trusts between forests and tests
"user U opens a share in domain R".

## Scene

Three forests drawn as large outlines, domains as boxes inside:

| Domain (id) | NetBIOS | Forest | Place in its forest | Test user | Share (server) |
|---|---|---|---|---|---|
| `quillmoor.example` | `QUILLMOOR` | Quillmoor | forest root | `ana` | `\\hq-fs01\Cinematics` |
| `brk.quillmoor.example` | `BRK` | Quillmoor | child of `quillmoor.example` | `ivan` | `\\brk-fs01\branch` |
| `emberline.example` | `EMBERLINE` | Quillmoor | second tree root | `maja` | `\\em-fs01\assets` |
| `pfx.internal` | `PELLUCID` | Pellucid | forest root (the only domain) | `jwren` | `\\pfx-fs1\comp` |
| `carrow.example` | `CARROW` | Carrow | forest root (the only domain) | `sara` | `\\cr-fs01\shared` |

Quillmoor's three domains, Pellucid's `pfx.internal` and the external trust are the DR estate's
(`student/configs/ad/quillmoor/trusts.txt`, `pellucid/summary.txt`); the estate's share is
`\\hq-fs01\projects\Emberline\Cinematics`, shortened to `\\hq-fs01\Cinematics`. Carrow, the users other than the
estate's group names, and the other shares are derived for the sim.

A **trust** is an arrow from the trusting (resource) domain to the trusted (account) domain, with a label: its type,
and its flags (SID filtering off, selective authentication). Solid = transitive, dashed = not transitive; an
arrowhead at each trusted end (two-way = heads at both ends). **Access** arrows are thin and run the other way, from
the user's domain to the resource's, along the path of the current test.

Below the scene: the **test card** (user, share, the hops of the path, then the checks at the resource: SID filtering,
selective authentication, the share's ACL; the verdict ✓/✕ or the rule that blocks it) and the **ticket card** (the
user's Kerberos tickets: the TGT, one referral ticket per hop, the service ticket; boxes and padlocks as in
`win-kerberos`). A log line of the steps at the bottom.

## State

```
{ trusts: [{ id, from, to, type, twoWay, transitive, selectiveAuth, sidFiltering, auto }],
  grants: [{ user, server }],          // "Allowed to Authenticate" on the server's computer object, for user's Domain Users
  cache: { '<userDomain>': ['<realm>', …] },   // realms the user holds a TGT or referral ticket for
  ev: <index of the next script event>,
  test: null | { user, resource, path, hops, done, verdict, block, checks, naive },
  path: [...], verdict: null | 'allow' | 'deny',
  log: [], last }
```

`from` trusts `to`. `path` is in access order (user's domain first). `type` is `parent-child`, `tree-root`, `forest`,
`external` or `shortcut`.

## One step

One admin action (create a trust, grant "Allowed to Authenticate") or one part of an access test: one hop of the path
(one Kerberos referral), or the verdict at the resource. A test whose path does not exist is one step (✕ with the
rule). A hop whose referral ticket the user already holds is not repeated (rule 9).

## Rules

1. **Direction.** If A trusts B, users of B can be granted access in A: access flows against the trust arrow. A two-way
   trust is two one-way trusts. *(Microsoft Learn, "How domain and forest trusts work": trust direction.)*
2. **Inside a forest** the parent–child trust (`quillmoor.example`–`brk.quillmoor.example`) and the tree-root trust
   (`quillmoor.example`–`emberline.example`) exist from the start, two-way and transitive: every domain of a forest
   trusts every other. *(ibid., "Trust types": parent-child, tree-root.)*
3. **A forest trust** links two forest roots and is transitive inside both forests (every domain of A ↔ every domain
   of B), but not on to a third forest: A–B and B–C do not give A–C. A path crosses at most one forest trust.
   *(ibid., "Forest trusts".)*
4. **An external trust** links exactly its two domains and is not transitive: it is a path on its own (user's domain
   → resource's domain, one hop) and is never chained with any other trust. *(ibid., "External trusts".)*
5. **A shortcut trust** inside a forest shortens the referral path; it does not change who can access what (the set of
   allowed (user, resource) pairs is the same with and without it). *(ibid., "Shortcut trusts".)* It is transitive.
6. **Trust ≠ permission.** A trust only makes the trusted side's users eligible; an ACE must still grant access. The
   share's ACL: `<R>\Domain Admins` Full control, and, when `aceGranted`, the domain local group `<User>-Access`
   (members `<U>\Domain Users`) Modify. *(Microsoft Learn, "How domain and forest trusts work"; the estate's
   `Pellucid-Access` group.)*
7. **Selective authentication.** When the trust crossed (forest or external) has selective authentication, the user
   also needs "Allowed to Authenticate" on the server's computer object, else the resource domain's KDC refuses the
   service ticket, even with an ACE. *(Microsoft Learn, "Security considerations for trusts": selective
   authentication.)* The check is made before the ACE.
8. **SID filtering** is on by default for external and forest trusts. Crossing such a trust, the token loses every
   SID from outside the trusted domain (external) or the trusted forest (forest). With it off on an external trust,
   every SID is honoured (estate `trusts.txt`: "All SIDs presented … will be honored"). Across a forest trust the
   SIDs of the trusting (resource) forest itself are dropped even with filtering off (ForestSpecific filtering,
   [MS-PAC] 4.1.2.2). Inside a forest nothing is filtered: the forest is the security boundary. *(ibid., "SID
   filtering".)* The page shows this with the param `sidHistory`: the user's token also carries the SID of
   `<R>\Domain Admins` (an entry of SID history).
9. **Kerberos across trusts.** The user's own KDC gives a referral ticket for the next domain on the path, locked with
   the trust's inter-realm key; that domain's KDC gives the next one, and so on; the resource domain's KDC gives the
   service ticket, locked with the server's key. One referral per trust on the path, reused for a later test by the
   same user. *(RFC 4120 §1.2, §3.3.1 cross-realm; reused from `win-kerberos`.)* *(check: across an external trust
   a client may fall back to NTLM; not drawn.)*

## Path (tie-breaks first)

Valid paths from U to R, in access order, over access edges x → y where y trusts x:

- in-forest edges (parent–child, tree-root, shortcut): any number, before and after the forest edge;
- a forest edge (between two roots): at most one;
- an external edge: only the path [U, R] alone.

**T1 — the path is the shortest; among equally short ones, the one whose trust ids, read hop by hop, are smallest**
(trusts are numbered in creation order: the two automatic ones, the shortcut, then the scenario's). So with a
shortcut `brk`–`emberline`, `brk → emberline` (1 hop) beats `brk → quillmoor → emberline` (2 hops).
**T2 — U = R** is a path of no hops: one step, the verdict only (no trust is needed).

**When no valid path exists**, the rule that blocks it, first match:

1. a path over all trusts, ignoring rules 3 and 4 (shortest, same tie-break as T1), contains an external trust →
   rule 4 (`external`), the ✕ on the hop that chains with it: the external hop, or the next one when the external hop
   comes first;
2. that path crosses two forest trusts → rule 3 (`third-forest`), the ✕ on the second;
3. a path exists the other way (R's users could reach U) → rule 1 (`direction`); the page draws the attempted access
   U → R crossed out;
4. else `none` (no trust at all).

## Verdict at the resource (one step, after the last hop)

Checks in this order; the verdict is ✕ at the first that fails:

1. **SID filtering** (rule 8, never fails itself): token = `<U>\<user>`, `<U>\Domain Users`, and with `sidHistory`
   and U ≠ R `<R>\Domain Admins` (SID history). If the path crosses a forest or external trust with `sidFiltering`,
   drop the SIDs outside the trusted domain (external) or forest (forest); a forest trust always drops the SIDs of
   R's forest (when U is in another forest).
2. **Selective authentication** (rule 7): applies when the crossed trust has `selectiveAuth`. Passes if `grants`
   holds `{ user: U, server: R }`, or the kept token holds `<R>\Domain Admins` (they control every computer object of
   their domain) *(check)*.
3. **ACE** (rule 6): passes if `aceGranted`, or the kept token holds `<R>\Domain Admins`.

## Params

| Key | Type | Default | Notes |
|---|---|---|---|
| `scenario` | hidden | `quillmoor-pellucid` | set by the presets |
| `userDomain` | select (5 domains) | `brk.quillmoor.example` | resets |
| `resourceDomain` | select (5 domains) | `pfx.internal` | resets |
| `aceGranted` | toggle | on | rule 6 |
| `selective` | toggle | off | selective auth on every forest/external trust of the scenario |
| `sidFilter` | toggle | on | SID filtering on every forest/external trust of the scenario |
| `sidHistory` | toggle | off | added (rule 8 needs a SID to filter) |
| `shortcut` | toggle | off | added (rule 5): a two-way shortcut `brk`–`emberline`; resets |

## Presets and expected numbers

Script per scenario (U = `userDomain`, R = `resourceDomain`):

| Preset | Params | Script | Steps | Outcome |
|---|---|---|---|---|
| `in-forest` | U `brk`, R `emberline` | test(U, R) | 3 | brk → quillmoor → emberline (2 hops) ✓ |
| `quillmoor-pellucid` | U `brk`, R `pfx`, `sidFilter` off | create external Q ⇄ pfx; test(pfx, Q); test(U, R) | 4 | pfx → quillmoor ✓ (Pellucid-Access); brk → pfx ✕ rule 4 |
| `one-way` | U `carrow`, R `quillmoor` | create forest Q → carrow (one way); test(U, R); test(R, U) | 4 | carrow → quillmoor ✓; quillmoor → carrow ✕ rule 1 |
| `no-third-forest` | U `quillmoor`, R `carrow` | create forest Q ⇄ pfx; create forest pfx ⇄ carrow; test(U, R) | 3 | ✕ rule 3 |
| `selective` | U `carrow`, R `quillmoor`, `selective` on | (forest Q ⇄ carrow exists, selective) test(U, R); grant; test(U, R) | 4 | ✕ rule 7; grant; ✓ (hop cached: 1 step) |

Defaults = the `quillmoor-pellucid` script with `sidFilter` on: 4 steps (`sim.json` `steps`). Over all
5 × 5 domain pairs × shortcut on/off × 5 scenarios (250 runs) the longest run is 7 steps (`one-way`, U `brk`,
R `emberline`: create, 2 hops + verdict, 2 hops + verdict). Checked with an independent Python model before the code.

Other expected results (tests):

- `in-forest` with `shortcut` on: 2 steps, path brk → emberline.
- `quillmoor-pellucid`, `aceGranted` off: pfx → quillmoor ✕ rule 6.
- `quillmoor-pellucid`, `aceGranted` off, `sidHistory` on: `sidFilter` off → ✓ via `QUILLMOOR\Domain Admins`;
  `sidFilter` on → that SID dropped, ✕ rule 6.
- `one-way`, U `carrow`, R `quillmoor`, `aceGranted` off, `sidHistory` on, `sidFilter` off: the SID is still dropped
  (forest trust), ✕ rule 6.
- `in-forest`, `aceGranted` off, `sidHistory` on: ✓ (nothing filtered inside a forest).
- `selective` with `selective` off: ✓ at step 2 already.
- `one-way`, U `brk`, R `quillmoor`: Q trusts brk, so ✓ in-forest; reverse quillmoor → brk ✓.
- `no-third-forest`, U `brk`, R `pfx`: brk → quillmoor → pfx ✓ (a forest trust is transitive inside Quillmoor).

## Differences from the task

- `one-way` is 4 steps (the task says 3): the trust is created in step 1, so the direction is seen being built.
- The task's "max 4" holds for the presets; with the domain params changed a run takes up to 7 steps (`one-way`, U
  `brk`, R `emberline`), within the contract's 20.
- "Toggle a flag" is not a step: selective authentication and SID filtering are params (what-if at the same step); the
  admin step that changes access mid-run is the grant of "Allowed to Authenticate".
- Params `sidHistory` and `shortcut` added (rules 8 and 5 need them to be seen).
- The `selective` scenario starts with its forest trust in place (no room for a creation step in 4).
- Rule 7: an honoured `<R>\Domain Admins` SID passes selective authentication *(check)*.
- Rule 8: ForestSpecific filtering across forest trusts (not in the task's rule list).

## Captions (from the task)

- hr: "`quillmoor.example` vjeruje `pfx.internal`: korisnici iz Pellucida smiju dobiti pristup u Quillmooru — pristup
  ide suprotno od strelice *trust* (odnosa povjerenja)." en: "`quillmoor.example` trusts `pfx.internal`: Pellucid
  users may be granted access in Quillmoor — access flows against the trust arrow."
- hr: "Vanjski odnos povjerenja nije tranzitivan: korisnik iz `brk.quillmoor.example` ne prolazi do `pfx.internal`."
  en: "An external trust is not transitive: a user from `brk.quillmoor.example` does not get through to
  `pfx.internal`."

## Out of scope

Realm trusts to non-Windows Kerberos realms, name suffix routing, trust passwords, migration with SID history (the
`sidHistory` param only puts a SID in the token, it does not migrate anyone), NTLM across trusts.
