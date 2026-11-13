<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-trusts: notes

New stepper (task `docs/tasks/w3/win-trusts.md`, catalogue `win-trusts`, §4.5.1, wave 3). Rules, tie-breaks and
expected numbers: `SPEC.md`. No kit view fits a trust graph (forests as outlines, directed arrows between boxes), so the
page draws its own scene: domain boxes in HTML, arrows in an SVG laid over them in pixels from the boxes' measured
positions (redrawn on resize and when the fonts have loaded), labels and ✕ marks in HTML at 16 px or more.

## Decisions

- **Scene:** Quillmoor (root `quillmoor.example`, child `brk.quillmoor.example`, second tree `emberline.example`) on the
  left, Pellucid (`pfx.internal`) top right, Carrow (`carrow.example`) bottom right, so every cross-forest trust has
  its own straight line (Q–P across, P–C down, Q–C diagonal). The Carrow forest's title sits at its bottom right so the
  diagonal's label does not cover it.
- **Arrows:** trust from the trusting to the trusted domain, an arrowhead at each trusted end (two-way: both ends);
  solid = transitive, dashed = external; in-forest trusts ink, cross-forest ones `--c1`. The label carries the type and
  the flags in words (non-transitive, SID filtering off, selective authentication, one way). Access arrows (`--c3`,
  thin) run beside the trust, from the user's domain to the resource's; pending hops dotted, a blocked hop red dashed
  with a ✕. The trust just created and the hop just taken have a yellow underlay; their label/chip is `.tr-ch`.
- **One test = hops + verdict:** one step per Kerberos referral (rule 9), then one step for the checks at the resource
  (SID filtering → selective authentication → ACE). A test with no valid path is one step with the blocking rule.
  This gives the task's 3 / 4 / 3 / 4 for `in-forest`, `quillmoor-pellucid`, `no-third-forest`, `selective`.
- **Referral cache:** a later test by the same user reuses the referrals it holds (rule 9). This is what makes the
  `selective` preset 4 steps: after the grant, the retry is only the service-ticket request.
- **Tests read the params:** each scenario's main test is `userDomain` → `resourceDomain`; the contrast tests are fixed
  (`quillmoor-pellucid`: first `pfx.internal` → `quillmoor.example`; `one-way`: the reverse of the main test). Changing
  the domains changes the step count (up to 7, `one-way` brk → emberline).
- **Default params** are the task's (`brk.quillmoor.example`, `pfx.internal`, ACE on, selective off, SID filtering on),
  with the hidden `scenario` on `quillmoor-pellucid`, the only script those defaults fit: 4 steps (`sim.json` `steps`).
  The preset of the same name also turns SID filtering off (the estate's `trusts.txt`).
- **The share's ACL:** `<R>\Domain Admins` Full control, and with `aceGranted` a domain local group named after the
  user's domain (`Pellucid-Access`, from the estate; `Carrow-Access`, `Brk-Access`, …) holding `<U>\Domain Users`,
  Modify.
- **Tickets card:** the user's TGT, one referral per hop (name `krbtgt/<REALM>`, the issuing KDC, locked with the
  inter-realm key `A ⇄ B`), then the service ticket `cifs/<server>` locked with `<server>$`, or "the KDC refuses" when
  selective authentication fails. Box and padlock style from `sims/win-kerberos/index.html` (CSS copied, not shared
  code: win-kerberos has no model in `models/` and its model is about AS/TGS/AP timing, which this sim does not need).
- **Settings without hints:** the toggles' hints did not fit the 1080 px panel; their meaning is in the explanation's
  last paragraph.
- **Phone:** no arrows; the forests stack, the trusts are a text list, the test card is one column.
- **SID filtering on forest trusts:** switched off, a forest trust still drops the SIDs of the trusting (resource)
  forest (ForestSpecific, [MS-PAC] 4.1.2.2). So the escalation through `<R>\Domain Admins` in SID History works only
  across the external trust (the estate's case); across a forest trust the page shows that SID dropped either way.
- **Where the ✕ goes:** rule 4 on the hop that chains with the external trust; rule 3 on the second forest trust;
  rule 1 and "no trust" on a direct access line U → R. A failed verdict puts it near the resource on the last hop.
- **The grant step clears the test card** (it shows the next test and the grant); the ✕ of the first test stays in
  the log.

## Deviations from the task

- **`one-way` is 4 steps, not 3:** create the one-way trust (the step that shows the arrow's direction), the Carrow
  user's test (1 hop + verdict), the reverse test (✕, one step). 3 would need the trust to exist from the start.
- **Two params added:** `sidHistory` (rule 8 needs a SID from outside the trusted side in the token to show anything
  being filtered) and `shortcut` (rule 5 has no preset; with it on, `in-forest` takes 2 steps instead of 3 and every
  verdict stays the same).
- **The `selective` preset starts with the Quillmoor ⇄ Carrow forest trust in place** (the task's 4 steps leave no
  room for a creation step).
- **ForestSpecific SID filtering** (forest trusts drop the trusting forest's SIDs even with filtering off) is not in
  the task's rules; added after review, since without it the page showed an escalation that a forest trust prevents.
- **An honoured `<R>\Domain Admins` SID also passes selective authentication** (they control the computer objects of
  their domain) *(check)*. Not in the task's rules; without it the escalation case would read "refused" under selective
  authentication, which is not what happens.
- **Title** "Odnosi povjerenja / Trusts between domains and forests" (the task's is "Trusts").

## Sources

- Task file, model and presets.
- [MS-PAC] 4.1.2.2 (SID filtering and claims transformation: ForestSpecific, QuarantinedWithinForest).
- Microsoft Learn: "How domain and forest trusts work" (direction, trust types, transitivity, shortcut trusts, Kerberos
  referrals across trusts); "Security considerations for trusts" (SID filtering, quarantine on external trusts,
  selective authentication, "Allowed to Authenticate").
- RFC 4120 §1.2 (cross-realm operation), §3.3.1 (TGS exchange; referrals).
- DR estate (student material): `student/configs/ad/quillmoor/trusts.txt` (external, bidirectional, not
  forest-transitive, SID filtering disabled; `Pellucid-Access` with Modify on `\\hq-fs01\projects\Emberline\Cinematics`),
  `student/configs/ad/pellucid/summary.txt` (`pfx.internal`, one domain). Only the trust's settings and the group are
  used; nothing from the estate's instructor material, and no judgement of the estate's choices on the page.
- NLA `meta/toc.md` T57 "Kerberos — karte, povjerenje, jedinstvena prijava" (the Croatian term "povjerenje").
- Derived for the sim: forest Carrow, the users (`ana`, `ivan`, `maja`, `jwren`, `sara`), the shares other than
  Cinematics.

## Unchecked *(check)*

- A KDC-side "Allowed to Authenticate" check is passed by a token holding the resource domain's Domain Admins SID.
- Across an external trust a client may fall back to NTLM (task rule 9); the page always draws the Kerberos referral.
- Croatian terms (task list, marked check): odnos povjerenja, domena koja vjeruje, domena kojoj se vjeruje, tranzitivan,
  povjerenje između šuma, vanjsko povjerenje, selektivna autentifikacija, filtriranje SID-ova; and mine: uputnica
  (referral ticket), prečac / prečačno povjerenje (shortcut trust), korijen stabla (tree root), roditelj–dijete
  (parent–child).

## Term pairs

Not in `kit/glossary.js`; written out in `strings.js` (*English* (Croatian) at first mention in the captions, `<em>`
in the explanation):

| en | hr |
|---|---|
| trust | odnos povjerenja |
| forest trust | povjerenje između šuma |
| external trust | vanjsko povjerenje |
| shortcut trust | prečačno povjerenje (prečac) |
| transitive | tranzitivan |
| selective authentication | selektivna autentifikacija |
| SID filtering | filtriranje SID-ova |
| referral ticket | uputnica |
| trusting domain | domena koja vjeruje |
| trusted domain | domena kojoj se vjeruje |

## Shared requests

- **Kit view for directed graphs in groups** (boxes inside outlines, arrows with one or two heads, dashed vs solid, a
  label at a point along the arrow, an overlay arrow beside an edge): this page draws it itself. Other trust or
  dependency sims (forest/domain, DFS namespaces, PKI chains) would reuse it. No change needed for this sim.
- **Kit legend swatches** for a directed arrow and a ✕ mark: drawn in page CSS (`tr-ar`, `tr-arnt`, `tr-aracc`, `tr-x`).

## Checks

- Numbers: an independent Python hand model (`win-trusts-check.py` in the thread's library folder) before the model:
  presets 3 / 4 / 4 / 3 / 4, `in-forest` with the shortcut 2, maximum over 250 runs 7, and the shortcut never changes
  reachability. The model agrees (`sim.test.js`, "presets").
- `node --test sims/win-trusts/sim.test.js`: 27 tests (T1 shortest, T1 trust-id order, T2 same domain, block-reason
  order, rules 1–9, rule 8 + 7, preset numbers, other expected results, duplicate grant, generic block over
  5 scenarios × 5 user domains × 3 resource domains × 2 flag sets).
- Mutations, one at a time (26, after the review): 24 caught. The two survivors are equivalent: the SID scope of an external trust
  (domain) vs a forest trust (forest) cannot differ while the only foreign SID comes from the resource's domain; and
  the explicit U = R case, which the path search already returns as the zero-hop path.
- Fresh reviewer (a separate agent on a scratch copy) read the code against SPEC.md and the task, mutated rules, and
  evaluated captions over the params. Fixed from its findings: the default start caption named the first test instead
  of the second; ForestSpecific filtering (above); the two-way caption of an external trust named whole forests (now
  the two domains); "only through Domain Admins" was said when the ACE also granted (now `okAce` + `okAlsoAdmin`); the
  `selective` start caption claimed an ACE; `createdSidOff` named one side only; the rule-4 ✕ sat on the external hop
  when the chained hop failed; the grant step kept the old ✕ on the test card; SPEC now lists its differences from
  the task. New tests for each of its surviving mutants (U = R SID history, ✕ positions, the selective scenario's
  two-way trust, defaults, the shortcut's type, T1 with trusts stored out of id order). The two equivalent mutants it
  agreed with are above; the others it listed as equivalent (phase guards, cache skip loop, …) were not changed.
- `npm run gate -- win-trusts`: pass; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both languages
  reviewed, plus each preset's key step and the densest card states (SID History with filtering off, selective with
  the grant, the third-forest and direction blocks) in light and dark.

## Time

Start 2026-11-13 10:40, done 2026-11-13 11:55 (about 1 h 15 min of wall clock, one session with a pause after the
spec; the page layout and the review fixes took most of it).
