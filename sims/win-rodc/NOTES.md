<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-rodc: notes

New stepper (task `docs/tasks/w3/win-rodc.md`, catalogue `win-rodc`, §4.5.1, wave 3). Drawn with kit view **K2**
(topology): DC01, the IPsec tunnel, RODC01 and BR-PC01 on top; three page cards below (the PRP of RODC01, the
domain's accounts at DC01, what RODC01 holds) and a log of the steps. Rules and expected numbers: `SPEC.md`.

## Decisions

- **One logon per step, PC and user together.** A step is "a logon at BR-PC01": the PC's own account first (its
  secure channel), then the user's, each answered locally, forwarded (and maybe cached) or failed. So the given
  caption ("doesn't have ana's password, forwards to DC01; the PRP allows it, so it caches it now") is one step, and
  BR-PC01's own password is cached in the same step (rule 6).
- **Allowed group = `BRK-Staff` + `BRK-PCs`**, not `BRK-Staff` alone: without a group for the branch PCs no computer
  would ever be cached, and the `stolen` preset's "8 computer hashes" could not happen. The param's values are
  `empty` / `brk`, labelled "BRK-Staff + BRK-PCs".
- **tbrennan is in Domain Admins and in BRK-Staff** (he looks after the branch, the start caption says so), so
  `admin-at-branch` shows deny winning over allow (T1), not just "not allowed".
- **Denied list**: the Denied RODC Password Replication Group's default members (Domain Admins, Enterprise Admins,
  Schema Admins, Cert Publishers, Group Policy Creator Owners, Domain Controllers, Read-only Domain Controllers,
  krbtgt) plus the PRP's own deny entries (Administrators, Account Operators, Server Operators, Backup Operators). The
  task lists them all under "Denied group"; the page keeps the two apart ("+ in the policy itself"). Group nesting is
  not modelled.
- **`stolen` replays a month of history into step 0** (10 logons with the WAN up: six branch users at PC01–06, PC07
  and PC08 started alone, marko and tbrennan visiting), so its numbers follow `allowGroup`: with the Allowed group
  empty the theft exposes only `krbtgt_8123` and nothing is reset.
- **`stolen` in 5 steps**: theft; read the revealed list at DC01; delete RODC01's account (with `krbtgt_8123`);
  reset the users; reset the computers. The "read the list" step makes `msDS-RevealedList` the visible source of what
  is reset.
- **TGT key** (rule 7) is in the model (`tgt: 'rodc' | 'domain'`) and in the caption of a local logon ("signs the
  ticket with its own key krbtgt_8123"); the forwarded logon's TGT is not mentioned in captions, to keep them short.
- **WAN down with an earlier logon at the PC**: the logon fails at the RODC, and the caption adds that BR-PC01 may
  still let the user in with its own cached logon, without the network (`win-domain-logon` rule 6). The model only
  records it (`pcLocal`); it never counts as a successful logon.
- **A hidden `scenario` param** carries the preset's script (as in `win-account-lockout`); the `user` param picks
  who logs on in the main logons and is hidden in `stolen`. `allowGroup`, `user` and `wan` recompute the same step.
- **Changed mark**: the account chip whose password was cached or reset in this step, the WAN cloud when it is cut,
  RODC01 when it is stolen, and the step in the log. Colour is never alone: cached = key icon, denied = ⛔ and a
  dashed chip, exposed = thick red outline plus "!" (and the RODC card's "stolen: all of this is exposed"), deleted =
  struck through plus "deleted", RODC = hatched.
- **Croatian term rule** via the page's `rich()` (`*term*` → `<em lang="en">`), as in `win-account-lockout`: the
  glossary has none of these terms.

## Deviations from the task

- **`first-logon` is four logons, not one logon in four sub-steps**: u (forwarded, cached), u again (local, RODC's
  TGT), marko (forwarded, in neither list), marko again (forwarded again). The task's "4 steps" for one logon
  contradicts its own "one step = one logon"; this keeps one logon per step and shows the three PRP outcomes across
  the presets.
- **`wan-down`**: u (cached), cut, u (local), marko (fails at the RODC) — the task's "ana logs on again with WAN
  down" needs her first logon to be in the preset.
- **`admin-at-branch`, `default-empty`**: u, u, cut, u (the task: "logs on twice … with WAN down he cannot").
- **State** is `{ wan, pwdVer, rodc: { cached, krbtgt, account }, localLogons, stolen, exposed, toReset, reset,
  before, log, last }`, not `users: { id: { groups, pwdVer } }`: groups are fixed and live in `ACCOUNTS`; computers
  are accounts too.
- **`allowGroup` value `brk`** (task: `BRK-Staff`), see Decisions.
- `RODC01`'s "no writes" line from topologydrafter is dropped from the card (the role already says read-only; it did
  not fit).

## Sources

- Task file (model, presets, captions, terms); catalogue §4.5.1.
- `~/projects/topologydrafter/js/samples.js`, sample `two-sites`: DC01 10.10.0.10, RODC01 10.20.0.10 "no writes",
  "Branch PCs ×8", IPsec site-to-site tunnel.
- DR estate, student side: `student/configs/ad/quillmoor/domain-admins.txt` (tbrennan in Domain Admins). No instructor
  material used.
- Microsoft Learn, "Password Replication Policy" (Windows Server 2008 R2 and 2008), from a web search summary in this
  session, not opened: the Denied List defaults to the Denied RODC Password Replication Group plus Account Operators,
  Server Operators, Backup Operators and Administrators; deny overrides allow; the Allowed group has no members by
  default.
- Microsoft Learn, "Review the removal of the default members from the Denied RODC Password Replication Group"
  (Services Hub) and "Administering the Password Replication Policy", search summaries: default members of the Denied
  group (krbtgt, Domain Admins, Enterprise Admins, Schema Admins, Cert Publishers, Group Policy Creator Owners, domain
  controllers and read-only domain controllers) *(check: lists differ slightly between versions)*.
- Microsoft Learn, "Securing Accounts After an RODC Is Stolen" and the `ms-DS-Revealed-List` attribute page, search
  summaries: delete the RODC account; the deletion dialog's check box to reset the passwords of user accounts cached
  on that RODC (selected by default); `msDS-RevealedList` holds the accounts whose passwords were cached.
- From memory, not checked in this session *(check)*: the second check box for computer accounts; that deleting the
  RODC account removes its `krbtgt_<n>` account; that an uncached computer account stops the PC's secure channel
  with the WAN down (rule 6, as the task marks it); the RODC's TGTs being signed with `krbtgt_<n>` and forwarded to a
  writable DC when presented elsewhere.
- Checked numbers: an independent Python hand model, `win-rodc-check.py` in the thread's library folder, gives every
  preset's per-step results and the `stolen` exposure (6 users, 8 computers; marko, tbrennan, krbtgt untouched; with
  the Allowed group empty, nothing).

## Term pairs

Not in `kit/glossary.js`; written out in `strings.js` (*English* (Croatian) at first mention):

| en | hr |
|---|---|
| read-only domain controller | kontroler domene samo za čitanje |
| password replication policy | pravilo replikacije lozinki |
| revealed list | popis otkrivenih lozinki (otkrivene lozinke) |
| cached credentials | spremljene vjerodajnice |
| writable DC | kontroler domene s pisanjem |
| branch office | podružnica |
| theft | krađa |

## Shared requests

- **Kit legend**: no key glyph swatch; the page draws `⚿` in a `::after`. A `key` swatch (and a way to pass an icon
  node as a legend swatch) would let the legend match the key icon on the chips.

## Checks

- `node --test sims/win-rodc/sim.test.js`: 22 tests (T1 first, rules 1–8, the denied lists, preset numbers, repeated
  events, generic block over every scenario × allowGroup × wan × user).
- Fresh reviewer (a separate agent on an isolated copy) read the code against SPEC.md and mutated each rule: 29
  mutations, 26 caught. Two of the three gaps (the denied-policy list, delete keeping the revealed list) got tests; the third (the domain krbtgt
  answered locally) cannot happen, since krbtgt never logs on. Its other findings were fixed: the PC caption after a denied or
  not-allowed user (`pcCachedAlone`), delete clears `rodc.krbtgt`, `exposedKey`, no TGT on a failed logon, the start
  caption with the WAN off (`startNoWan`), English `resetU` mood, unused strings, SPEC's differences from the task,
  and the delete caption now says the two reset check boxes are in the same dialog.
- `npm run gate -- win-rodc`: pass; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both languages
  reviewed, plus each preset's key step (first-logon 1, admin-at-branch 1, wan-down 4, default-empty 4, stolen 5).

## Time

Start 2026-11-13 10:15, done 2026-11-13 10:37 (about 22 minutes of wall clock, one session).
